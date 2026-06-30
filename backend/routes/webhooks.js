// BotPip — Webhook Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { searchKnowledge } = require('../services/rag');
const { generateBotResponse } = require('../services/claude');
const { sendEscalationAlert } = require('../services/email');

async function processMessage({ firmId, platform, userId, userName, channelId, messageText, platformMessageId }) {
  const { data: firm } = await supabase.from('firms').select('*').eq('id', firmId).single();
  if (!firm || firm.status === 'paused' || firm.status === 'cancelled') return null;

  let { data: conv } = await supabase.from('conversations').select('id').eq('firm_id', firmId).eq('platform', platform).eq('platform_user_id', userId).eq('status', 'open').order('created_at', { ascending: false }).limit(1).single();

  if (!conv) {
    const { data: newConv } = await supabase.from('conversations').insert({ firm_id: firmId, platform, platform_user_id: userId, platform_user_name: userName, platform_channel_id: channelId }).select('id').single();
    conv = newConv;
  }

  const { data: history } = await supabase.from('messages').select('role, content').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(10);

  await supabase.from('messages').insert({ conversation_id: conv.id, firm_id: firmId, role: 'user', content: messageText, platform_message_id: platformMessageId });

  if (firm.bot_mode === 'human') return { skip: true };

  const chunks = await searchKnowledge(firmId, messageText);
  const { answer, confidence, linkShared, sourceDocId } = await generateBotResponse({ question: messageText, chunks, firmSettings: firm, conversationHistory: (history || []).reverse(), platformUserId: userId, platformUserName: userName });

  const shouldEscalate = confidence < firm.confidence_threshold && firm.human_handoff;

  await supabase.from('messages').insert({ conversation_id: conv.id, firm_id: firmId, role: 'bot', content: answer, source_doc_id: sourceDocId, confidence_score: confidence, escalated: shouldEscalate, link_shared: linkShared });
  await supabase.from('analytics_events').insert({ firm_id: firmId, event_type: 'message_handled', platform, metadata: { confidence, escalated: shouldEscalate } });

  if (shouldEscalate) {
    await supabase.from('escalations').insert({ conversation_id: conv.id, firm_id: firmId, reason: 'Low confidence', confidence_at_escalation: confidence });
    await supabase.from('conversations').update({ status: 'escalated' }).eq('id', conv.id);
    await sendEscalationAlert(firm, userName || userId, messageText, platform);
  }

  if (firm.typing_delay_ms > 0) await new Promise(r => setTimeout(r, firm.typing_delay_ms));
  return { answer, confidence, shouldEscalate, convId: conv.id };
}

// WhatsApp verify
router.get('/whatsapp/:firmId', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === req.params.firmId) return res.status(200).send(challenge);
  res.status(403).send('Forbidden');
});

// WhatsApp messages
router.post('/whatsapp/:firmId', async (req, res) => {
  res.status(200).json({ status: 'ok' });
  try {
    const { firmId } = req.params;
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== 'text') return;
    const result = await processMessage({ firmId, platform: 'whatsapp', userId: msg.from, userName: msg.from, messageText: msg.text.body, platformMessageId: msg.id });
    if (!result || result.skip) return;
    const { data: conn } = await supabase.from('platform_connections').select('whatsapp_phone_number_id,whatsapp_access_token').eq('firm_id', firmId).eq('platform', 'whatsapp').single();
    if (conn) await fetch(`https://graph.facebook.com/v18.0/${conn.whatsapp_phone_number_id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${conn.whatsapp_access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: msg.from, type: 'text', text: { body: result.answer } }) });
  } catch (e) { console.error('WA error:', e.message); }
});

// Intercom
router.post('/intercom/:firmId', async (req, res) => {
  res.status(200).json({ status: 'ok' });
  try {
    const { firmId } = req.params;
    const { type, data } = req.body;
    if (!type?.includes('conversation')) return;
    const conv = data?.item;
    const part = conv?.conversation_parts?.conversation_parts?.[0] || conv?.source;
    if (!part || part.author?.type !== 'user') return;
    const messageText = part.body?.replace(/<[^>]*>/g, '') || '';
    if (!messageText.trim()) return;
    const result = await processMessage({ firmId, platform: 'intercom', userId: part.author?.id, userName: part.author?.name, channelId: conv?.id, messageText });
    if (!result || result.skip) return;
    const { data: conn } = await supabase.from('platform_connections').select('intercom_access_token').eq('firm_id', firmId).eq('platform', 'intercom').single();
    if (conn) await fetch(`https://api.intercom.io/conversations/${conv?.id}/reply`, { method: 'POST', headers: { Authorization: `Bearer ${conn.intercom_access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'admin', admin_id: 'bot', message_type: 'comment', body: result.answer }) });
  } catch (e) { console.error('Intercom error:', e.message); }
});

// Zendesk
router.post('/zendesk/:firmId', async (req, res) => {
  res.status(200).json({ status: 'ok' });
  try {
    const { firmId } = req.params;
    const ticket = req.body;
    const messageText = ticket.description || ticket.comment?.body || '';
    if (!messageText.trim()) return;
    const result = await processMessage({ firmId, platform: 'zendesk', userId: ticket.requester_id?.toString(), userName: ticket.via?.source?.from?.name || 'Trader', channelId: ticket.id?.toString(), messageText });
    if (!result || result.skip) return;
    const { data: conn } = await supabase.from('platform_connections').select('zendesk_subdomain,zendesk_email,zendesk_api_token').eq('firm_id', firmId).eq('platform', 'zendesk').single();
    if (conn) { const auth = Buffer.from(`${conn.zendesk_email}/token:${conn.zendesk_api_token}`).toString('base64'); await fetch(`https://${conn.zendesk_subdomain}.zendesk.com/api/v2/tickets/${ticket.id}.json`, { method: 'PUT', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: { comment: { body: result.answer } } }) }); }
  } catch (e) { console.error('Zendesk error:', e.message); }
});

// Slack
router.post('/slack/:firmId', async (req, res) => {
  const { firmId } = req.params;
  if (req.body.type === 'url_verification') return res.json({ challenge: req.body.challenge });
  res.status(200).json({ status: 'ok' });
  try {
    const event = req.body.event;
    if (!event || event.type !== 'message' || event.bot_id) return;
    const result = await processMessage({ firmId, platform: 'slack', userId: event.user, channelId: event.channel, messageText: event.text || '', platformMessageId: event.ts });
    if (!result || result.skip) return;
    const { data: conn } = await supabase.from('platform_connections').select('slack_bot_token').eq('firm_id', firmId).eq('platform', 'slack').single();
    if (conn) await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', headers: { Authorization: `Bearer ${conn.slack_bot_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: event.channel, text: result.answer, thread_ts: event.ts }) });
  } catch (e) { console.error('Slack error:', e.message); }
});

// Website widget
router.post('/widget/:firmId', async (req, res) => {
  const { firmId } = req.params;
  const { userId, userName, message, sessionId } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message' });
  try {
    const result = await processMessage({ firmId, platform: 'website', userId: userId || sessionId, userName, messageText: message });
    if (!result) return res.status(404).json({ error: 'Firm inactive' });
    if (result.skip) return res.json({ answer: 'A human will be with you shortly.', escalated: false });
    res.json({ answer: result.answer, confidence: result.confidence, escalated: result.shouldEscalate });
  } catch (e) { console.error('Widget error:', e.message); res.status(500).json({ error: 'Internal error' }); }
});

module.exports = { router, processMessage };
