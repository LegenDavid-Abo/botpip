// BotPip — Main Express Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

// Raw body not needed for Flutterwave (uses JSON + signature header, not raw signing like Stripe)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// Services
const { firmSignup, firmLogin, superAdminLogin, requireFirm, requireSuperAdmin, requireAuth } = require('./services/auth');
const { processPDF, processURL, processText, searchKnowledge, checkForConflicts, deleteDoc, getDocsContent } = require('./services/rag');
const { generateBotResponse, generateFAQ, generateQuiz, processInterviewAnswer, analyseScreenshot, INTERVIEW_QUESTIONS } = require('./services/claude');
const { sendEmail, sendSupportMessageAlert } = require('./services/email');
const { broadcastForFirm, broadcastToAllFirms, alertSuperAdmin } = require('./services/broadcaster');
const { createCheckoutSession, handleWebhook: flutterwaveWebhook, cancelSubscription, verifyTransaction } = require('./services/flutterwave');
const { calculateHealthScore } = require('./services/health');

// Webhook routes
const { router: webhookRouter } = require('./routes/webhooks');
app.use('/api/webhooks', webhookRouter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() }));

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const result = await firmSignup(req.body);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await firmLogin(req.body);
    res.json(result);
  } catch (e) { res.status(401).json({ error: e.message }); }
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const result = await superAdminLogin(req.body);
    res.json(result);
  } catch (e) { res.status(401).json({ error: e.message }); }
});

// ============================================================
// FIRM ROUTES
// ============================================================
app.get('/api/firm/me', requireFirm, async (req, res) => {
  const { data: firm } = await supabase.from('firms').select('*').eq('id', req.firmId).single();
  if (!firm) return res.status(404).json({ error: 'Not found' });
  const { password_hash, ...firmData } = firm;
  res.json(firmData);
});

app.patch('/api/firm/settings', requireFirm, async (req, res) => {
  const allowed = ['bot_name','bot_color','confidence_threshold','typing_delay_ms','response_length','tone','use_emojis','bold_key_info','reply_threading','personalise_names','only_from_docs','share_links_when_relevant','human_handoff','mt4_screenshot_reader','voice_messages','auto_thread_long_convos','stamp_resolved','bot_mode','ask_account_type_first','offer_calculator','evaluation_max_lots','master_max_lots','risk_formula','approved_emojis','custom_emojis'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();
  await supabase.from('firms').update(updates).eq('id', req.firmId);
  res.json({ success: true });
});

// ============================================================
// KNOWLEDGE BASE ROUTES
// ============================================================
app.get('/api/kb/docs', requireFirm, async (req, res) => {
  const { data } = await supabase.from('knowledge_docs').select('*').eq('firm_id', req.firmId).order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/kb/upload', requireFirm, upload.single('file'), async (req, res) => {
  try {
    let doc;
    if (req.file) {
      doc = await processPDF(req.file.buffer, req.firmId, req.file.originalname);
    } else if (req.body.url) {
      doc = await processURL(req.body.url, req.firmId);
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }
    // Check for conflicts in background
    checkForConflicts(req.firmId, doc.id).catch(console.error);
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/kb/docs/:docId', requireFirm, async (req, res) => {
  await deleteDoc(req.firmId, req.params.docId);
  res.json({ success: true });
});

app.get('/api/kb/conflicts', requireFirm, async (req, res) => {
  const { data } = await supabase.from('knowledge_conflicts').select('*, knowledge_docs!doc_a_id(name), knowledge_docs!doc_b_id(name)').eq('firm_id', req.firmId).eq('resolved', false);
  res.json(data || []);
});

app.patch('/api/kb/conflicts/:id/resolve', requireFirm, async (req, res) => {
  await supabase.from('knowledge_conflicts').update({ resolved: true, resolution: req.body.resolution }).eq('id', req.params.id);
  res.json({ success: true });
});

// ============================================================
// PLATFORM INTEGRATION ROUTES
// ============================================================
app.get('/api/integrations', requireFirm, async (req, res) => {
  const { data } = await supabase.from('platform_connections').select('*').eq('firm_id', req.firmId);
  res.json(data || []);
});

app.post('/api/integrations/:platform', requireFirm, async (req, res) => {
  const { platform } = req.params;
  const { data: existing } = await supabase.from('platform_connections').select('id').eq('firm_id', req.firmId).eq('platform', platform).single();

  const connData = { firm_id: req.firmId, platform, status: 'connected', connected_at: new Date().toISOString(), ...req.body };

  if (existing) {
    await supabase.from('platform_connections').update(connData).eq('id', existing.id);
  } else {
    await supabase.from('platform_connections').insert(connData);
  }

  // If Discord, sync channels immediately
  if (platform === 'discord' && req.body.discord_guild_id) {
    await supabase.from('firms').update({ updated_at: new Date().toISOString() }).eq('id', req.firmId);
  }

  res.json({ success: true });
});

app.delete('/api/integrations/:platform', requireFirm, async (req, res) => {
  await supabase.from('platform_connections').update({ status: 'disconnected' }).eq('firm_id', req.firmId).eq('platform', req.params.platform);
  res.json({ success: true });
});

// ============================================================
// DISCORD CHANNEL ROUTES
// ============================================================
app.get('/api/channels/discord', requireFirm, async (req, res) => {
  const { data } = await supabase.from('discord_channels').select('*').eq('firm_id', req.firmId).order('channel_name');
  res.json(data || []);
});

app.patch('/api/channels/discord/:channelId/monitor', requireFirm, async (req, res) => {
  await supabase.from('discord_channels').update({ monitored: req.body.monitored }).eq('firm_id', req.firmId).eq('channel_id', req.params.channelId);
  res.json({ success: true });
});

// ============================================================
// ANALYTICS ROUTES
// ============================================================
app.get('/api/analytics', requireFirm, async (req, res) => {
  const { period = '7d' } = req.query;
  const days = period === '30d' ? 30 : period === '1d' ? 1 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [messages, escalations, conversations] = await Promise.all([
    supabase.from('messages').select('id, confidence_score, role, created_at').eq('firm_id', req.firmId).gte('created_at', since),
    supabase.from('escalations').select('id').eq('firm_id', req.firmId).gte('created_at', since),
    supabase.from('conversations').select('platform').eq('firm_id', req.firmId).gte('created_at', since)
  ]);

  const msgs = messages.data || [];
  const botMsgs = msgs.filter(m => m.role === 'boat');
  const avgConf = botMsgs.length > 0 ? botMsgs.reduce((s, m) => s + (m.confidence_score || 0), 0) / botMsgs.length : 0;
  const totalUserMsgs = msgs.filter(m => m.role === 'user').length;
  const totalBotMsgs = msgs.filter(m => m.role === 'bot').length;
  const resolutionRate = totalUserMsgs > 0 ? Math.round(((totalUserMsgs - (escalations.data?.length || 0)) / totalUserMsgs) * 100) : 0;

  const byPlatform = {};
  for (const c of (conversations.data || [])) { byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1; }

  res.json({ total_messages: totalUserMsgs, bot_replies: totalBotMsgs, escalations: escalations.data?.length || 0, avg_confidence: Math.round(avgConf), resolution_rate: resolutionRate, by_platform: byPlatform, period });
});

// ============================================================
// CONVERSATIONS ROUTES
// ============================================================
app.get('/api/conversations', requireFirm, async (req, res) => {
  const { status, platform, limit = 50 } = req.query;
  let query = supabase.from('conversations').select('*').eq('firm_id', req.firmId).order('updated_at', { ascending: false }).limit(parseInt(limit));
  if (status) query = query.eq('status', status);
  if (platform) query = query.eq('platform', platform);
  const { data } = await query;
  res.json(data || []);
});

app.get('/api/conversations/:id/messages', requireFirm, async (req, res) => {
  const { data } = await supabase.from('messages').select('*').eq('conversation_id', req.params.id).order('created_at');
  res.json(data || []);
});

// ============================================================
// ESCALATIONS
// ============================================================
app.get('/api/escalations', requireFirm, async (req, res) => {
  const { data } = await supabase.from('escalations').select('*, conversations(platform, platform_user_name), messages(content)').eq('firm_id', req.firmId).is('resolved_at', null).order('created_at', { ascending: false });
  res.json(data || []);
});

app.patch('/api/escalations/:id/resolve', requireFirm, async (req, res) => {
  await supabase.from('escalations').update({ resolved_by: req.body.resolved_by || 'agent', resolved_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ success: true });
});

// ============================================================
// PLAYGROUND ROUTES
// ============================================================
app.post('/api/playground/test', requireFirm, async (req, res) => {
  const { question } = req.body;
  const { data: firm } = await supabase.from('firms').select('*').eq('id', req.firmId).single();
  const chunks = await searchKnowledge(req.firmId, question);
  const result = await generateBotResponse({ question, chunks, firmSettings: firm });
  res.json({ ...result, chunks: chunks.map(c => ({ similarity: c.similarity, preview: c.content.substring(0, 100) })) });
});

app.post('/api/playground/screenshot', requireFirm, upload.single('image'), async (req, res) => {
  const { data: firm } = await supabase.from('firms').select('*').eq('id', req.firmId).single();
  const base64 = req.file?.buffer.toString('base64');
  if (!base64) return res.status(400).json({ error: 'No image' });
  const analysis = await analyseScreenshot(base64, firm);
  res.json({ analysis });
});

app.get('/api/playground/quiz', requireFirm, async (req, res) => {
  const { data: firm } = await supabase.from('firms').select('name').eq('id', req.firmId).single();
  const chunks = await getDocsContent(req.firmId, 30);
  if (chunks.length === 0) return res.status(400).json({ error: 'Upload docs first' });
  const quiz = await generateQuiz(chunks, firm?.name || 'Your Firm');
  res.json(quiz);
});

app.get('/api/playground/health', requireFirm, async (req, res) => {
  const result = await calculateHealthScore(req.firmId);
  res.json(result);
});

app.post('/api/playground/faq', requireFirm, async (req, res) => {
  const { data: msgs } = await supabase.from('messages').select('role, content').eq('firm_id', req.firmId).eq('role', 'user').limit(200);
  if (!msgs || msgs.length < 10) return res.status(400).json({ error: 'Need at least 10 messages to generate FAQ' });
  const faq = await generateFAQ(msgs);
  res.json(faq);
});

// AI Interviewer
app.post('/api/playground/interview', requireFirm, async (req, res) => {
  const { questionIndex, answer, previousAnswers } = req.body;
  const result = await processInterviewAnswer(questionIndex, answer, previousAnswers || []);
  if (result.done) {
    // Save as knowledge base doc
    await processText(result.kbContent, req.firmId, 'AI Interview — Knowledge Base');
    res.json({ done: true, message: 'Knowledge base built from interview' });
  } else {
    res.json(result);
  }
});

app.get('/api/playground/interview/questions', (req, res) => {
  res.json(INTERVIEW_QUESTIONS);
});

// ============================================================
// REPLY TEMPLATES
// ============================================================
app.get('/api/templates', requireFirm, async (req, res) => {
  const { data } = await supabase.from('reply_templates').select('*').eq('firm_id', req.firmId).order('created_at');
  res.json(data || []);
});

app.post('/api/templates', requireFirm, async (req, res) => {
  const { data } = await supabase.from('reply_templates').insert({ firm_id: req.firmId, ...req.body }).select().single();
  res.json(data);
});

app.delete('/api/templates/:id', requireFirm, async (req, res) => {
  await supabase.from('reply_templates').delete().eq('id', req.params.id).eq('firm_id', req.firmId);
  res.json({ success: true });
});

// ============================================================
// SCHEDULED MESSAGES
// ============================================================
app.get('/api/scheduled', requireFirm, async (req, res) => {
  const { data } = await supabase.from('scheduled_messages').select('*').eq('firm_id', req.firmId).eq('sent', false).order('send_at');
  res.json(data || []);
});

app.post('/api/scheduled', requireFirm, async (req, res) => {
  const { data } = await supabase.from('scheduled_messages').insert({ firm_id: req.firmId, ...req.body }).select().single();
  res.json(data);
});

app.delete('/api/scheduled/:id', requireFirm, async (req, res) => {
  await supabase.from('scheduled_messages').delete().eq('id', req.params.id).eq('firm_id', req.firmId);
  res.json({ success: true });
});

// ============================================================
// BROADCAST (firm sends to own platforms)
// ============================================================
app.post('/api/broadcast', requireFirm, async (req, res) => {
  const { platform, target, message } = req.body;
  const result = await broadcastForFirm(req.firmId, { platform, target, message });
  res.json(result);
});

// ============================================================
// SUPPORT MESSAGES (contact super admin)
// ============================================================
app.post('/api/support/message', requireFirm, async (req, res) => {
  const { subject, content } = req.body;
  const { data: firm } = await supabase.from('firms').select('name').eq('id', req.firmId).single();
  await supabase.from('support_messages').insert({ firm_id: req.firmId, subject, content });
  await sendSupportMessageAlert(firm?.name || 'Unknown', subject, content);
  await alertSuperAdmin(`New message from ${firm?.name}: ${subject}`);
  res.json({ success: true });
});

// ============================================================
// PAYMENTS
// ============================================================
app.post('/api/payments/checkout', requireFirm, async (req, res) => {
  try {
    const session = await createCheckoutSession(req.firmId, req.body.plan, req.body.coupon);
    res.json({ url: session.url });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Flutterwave has no separate "billing portal" the way Stripe does —
// firms manage/cancel their plan directly from the Subscription page in-app.
app.post('/api/payments/cancel', requireFirm, async (req, res) => {
  await cancelSubscription(req.firmId);
  res.json({ success: true });
});

// Called when Flutterwave redirects the user back after checkout, to confirm payment immediately
app.get('/api/payments/verify/:transactionId', requireFirm, async (req, res) => {
  try {
    const result = await verifyTransaction(req.params.transactionId);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Flutterwave webhook
app.post('/api/webhooks/flutterwave', async (req, res) => {
  try {
    const result = await flutterwaveWebhook(req.body, req.headers['verif-hash']);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Export data
app.get('/api/export/:type', requireFirm, async (req, res) => {
  const { type } = req.params;
  let data, filename;

  if (type === 'conversations') {
    const result = await supabase.from('messages').select('*, conversations(platform, platform_user_name)').eq('firm_id', req.firmId).order('created_at');
    data = result.data;
    filename = 'conversations.json';
  } else if (type === 'analytics') {
    const result = await supabase.from('analytics_events').select('*').eq('firm_id', req.firmId).order('created_at', { ascending: false }).limit(10000);
    data = result.data;
    filename = 'analytics.json';
  } else {
    return res.status(400).json({ error: 'Invalid export type' });
  }

  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.json(data);
});

// ============================================================
// SUPER ADMIN ROUTES
// ============================================================

// Dashboard stats
app.get('/api/admin/stats', requireSuperAdmin, async (req, res) => {
  const [firms, plans, messages, newFirms] = await Promise.all([
    supabase.from('firms').select('id, plan, status, created_at'),
    supabase.from('plans').select('name, price_monthly'),
    supabase.from('messages').select('id').gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
    supabase.from('firms').select('id').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
  ]);

  const planMap = Object.fromEntries((plans.data || []).map(p => [p.name, p.price_monthly]));
  const activeFirms = (firms.data || []).filter(f => f.status === 'active');
  const mrr = activeFirms.reduce((sum, f) => sum + (planMap[f.plan] || 0), 0);

  res.json({ active_firms: activeFirms.length, mrr, messages_today: messages.data?.length || 0, new_firms_week: newFirms.data?.length || 0, by_plan: Object.fromEntries(['trial','starter','pro','enterprise'].map(p => [p, (firms.data || []).filter(f => f.plan === p).length])) });
});

// All firms
app.get('/api/admin/firms', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('firms').select('id, name, email, plan, status, health_score, trial_ends_at, created_at').order('created_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/admin/firms/:id', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('firms').select('*').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'Not found' });
  const { password_hash, ...firmData } = data;
  res.json(firmData);
});

app.patch('/api/admin/firms/:id', requireSuperAdmin, async (req, res) => {
  await supabase.from('firms').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/firms/:id', requireSuperAdmin, async (req, res) => {
  await supabase.from('firms').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Plans management
app.get('/api/admin/plans', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('plans').select('*').order('price_monthly');
  res.json(data || []);
});

app.patch('/api/admin/plans/:name', requireSuperAdmin, async (req, res) => {
  await supabase.from('plans').update({ ...req.body, updated_at: new Date().toISOString() }).eq('name', req.params.name);
  res.json({ success: true });
});

// Coupons
app.get('/api/admin/coupons', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/coupons', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('coupons').insert({ ...req.body, code: req.body.code?.toUpperCase() }).select().single();
  res.json(data);
});

app.patch('/api/admin/coupons/:id', requireSuperAdmin, async (req, res) => {
  await supabase.from('coupons').update(req.body).eq('id', req.params.id);
  res.json({ success: true });
});

// Platform settings
app.get('/api/admin/settings', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('platform_settings').select('*').single();
  res.json(data);
});

app.patch('/api/admin/settings', requireSuperAdmin, async (req, res) => {
  await supabase.from('platform_settings').update(req.body).eq('id', 1);
  res.json({ success: true });
});

// Inbox (support messages)
app.get('/api/admin/inbox', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('support_messages').select('*, firms(name, email)').order('created_at', { ascending: false });
  res.json(data || []);
});

app.patch('/api/admin/inbox/:id/reply', requireSuperAdmin, async (req, res) => {
  const { reply } = req.body;
  const { data: msg } = await supabase.from('support_messages').select('*, firms(email, name)').eq('id', req.params.id).single();
  if (!msg) return res.status(404).json({ error: 'Not found' });
  await supabase.from('support_messages').update({ reply, replied_at: new Date().toISOString(), read: true }).eq('id', req.params.id);
  // Send reply email
  const emailResult = await sendEmail({ to: msg.firms.email, subject: `Re: ${msg.subject}`, html: `<p>Hi ${msg.firms.name},</p><p>${reply}</p><p>— BotPip team</p>` });
  if (!emailResult) {
    console.error(`[admin reply] Email FAILED to send to ${msg.firms.email} for message ${req.params.id}`);
    return res.json({ success: true, emailSent: false, warning: 'Reply saved, but the email failed to send. Check backend logs and your GMAIL_USER/GMAIL_APP_PASSWORD in .env.' });
  }
  res.json({ success: true, emailSent: true });
});

app.patch('/api/admin/inbox/:id/read', requireSuperAdmin, async (req, res) => {
  await supabase.from('support_messages').update({ read: true }).eq('id', req.params.id);
  res.json({ success: true });
});

// Broadcast to all firms OR a single targeted firm
app.post('/api/admin/broadcast', requireSuperAdmin, async (req, res) => {
  const { platforms, message, targetPlan, targetFirmId } = req.body;

  if (targetFirmId) {
    const { data: firm } = await supabase.from('firms').select('name, email').eq('id', targetFirmId).single();
    if (!firm) return res.status(404).json({ error: 'Firm not found' });
    let sent = 0;
    if (platforms.includes('email')) {
      const ok = await sendEmail({ to: firm.email, subject: 'Message from BotPip', html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><p>Hi ${firm.name},</p><p>${message.replace(/\n/g,'<br>')}</p><p>— The BotPip team</p></div>` });
      if (ok) sent++;
    }
    return res.json({ sent, total: platforms.length, firms: 1 });
  }

  const result = await broadcastToAllFirms({ platforms, message, targetPlan });
  res.json(result);
});

// Changelog
app.get('/api/admin/changelog', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('changelog').select('*').order('published_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/changelog', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('changelog').insert(req.body).select().single();
  if (req.body.notify_firms) {
    await broadcastToAllFirms({ platforms: ['email', 'dashboard'], message: `📦 BotPip ${req.body.version} is live!\n\n${req.body.notes}` });
  }
  res.json(data);
});

// Affiliates
app.get('/api/admin/affiliates', requireSuperAdmin, async (req, res) => {
  const { data } = await supabase.from('affiliates').select('*, referrals(id, firms(name), commission_amount, paid)').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/affiliates', requireSuperAdmin, async (req, res) => {
  const code = `BP${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const { data } = await supabase.from('affiliates').insert({ ...req.body, referral_code: code }).select().single();
  res.json(data);
});

// API usage (placeholder — connect to Anthropic/OpenAI billing APIs in production)
app.get('/api/admin/usage', requireSuperAdmin, async (req, res) => {
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const { data: events } = await supabase.from('analytics_events').select('metadata').eq('event_type', 'message_handled').gte('created_at', since);
  const totalMessages = events?.length || 0;
  res.json({ period: '30d', total_messages: totalMessages, estimated_anthropic_cost: (totalMessages * 0.003).toFixed(2), estimated_openai_cost: (totalMessages * 0.0001).toFixed(4), total_estimated: (totalMessages * 0.0031).toFixed(2) });
});

// ============================================================
// WIDGET SCRIPT (served to firm websites)
// ============================================================
app.get('/widget.js', (req, res) => {
  const firmId = req.query['data-id'] || '';
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  var FIRM_ID = document.currentScript.getAttribute('data-id') || '${firmId}';
  var API = '${process.env.FRONTEND_URL?.replace('//', '//api.') || 'http://localhost:3001'}';
  var sessionId = 'bp_' + Math.random().toString(36).substr(2,9);
  
  var style = document.createElement('style');
  style.textContent = '.bp-widget{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:sans-serif}.bp-btn{width:52px;height:52px;border-radius:50%;background:#7F77DD;border:none;color:white;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(127,119,221,.4)}.bp-popup{position:absolute;bottom:68px;right:0;width:320px;background:white;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.15);overflow:hidden;display:none}.bp-popup.open{display:flex;flex-direction:column}.bp-header{background:#7F77DD;color:white;padding:14px 16px;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:500}.bp-messages{flex:1;padding:12px;overflow-y:auto;height:240px;background:#f9f9f9}.bp-msg{margin-bottom:8px;display:flex}.bp-msg.bot{justify-content:flex-start}.bp-msg.user{justify-content:flex-end}.bp-bubble{max-width:80%;padding:8px 12px;border-radius:10px;font-size:13px;line-height:1.5}.bp-msg.bot .bp-bubble{background:white;border:1px solid #e5e5e5}.bp-msg.user .bp-bubble{background:#7F77DD;color:white}.bp-input-area{display:flex;padding:10px;border-top:1px solid #e5e5e5;gap:8px}.bp-input{flex:1;border:1px solid #e5e5e5;border-radius:8px;padding:8px 12px;font-size:13px;outline:none}.bp-send{background:#7F77DD;color:white;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px}';
  document.head.appendChild(style);
  
  var div = document.createElement('div');
  div.className = 'bp-widget';
  div.innerHTML = '<button class="bp-btn" onclick="this.parentElement.querySelector(\'.bp-popup\').classList.toggle(\'open\')">💬</button><div class="bp-popup"><div class="bp-header"><div style="width:28px;height:28px;background:rgba(255,255,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center">🤖</div><span>Support Bot</span><div style="margin-left:auto;width:8px;height:8px;background:#4ADE80;border-radius:50%"></div></div><div class="bp-messages" id="bp-msgs"><div class="bp-msg bot"><div class="bp-bubble">Hi! Ask me anything about rules, payouts, or your account. 👋</div></div></div><div class="bp-input-area"><input class="bp-input" id="bp-in" placeholder="Type a question..." onkeydown="if(event.key===\'Enter\')document.getElementById(\'bp-sbtn\').click()"><button class="bp-send" id="bp-sbtn">Send</button></div></div>';
  document.body.appendChild(div);
  
  document.getElementById('bp-sbtn').addEventListener('click', async function() {
    var inp = document.getElementById('bp-in');
    var msg = inp.value.trim();
    if (!msg) return;
    var msgs = document.getElementById('bp-msgs');
    msgs.innerHTML += '<div class="bp-msg user"><div class="bp-bubble">' + msg + '</div></div>';
    inp.value = '';
    msgs.scrollTop = msgs.scrollHeight;
    try {
      var r = await fetch(API + '/api/webhooks/widget/' + FIRM_ID, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: msg, sessionId: sessionId }) });
      var d = await r.json();
      msgs.innerHTML += '<div class="bp-msg bot"><div class="bp-bubble">' + d.answer + '</div></div>';
    } catch(e) { msgs.innerHTML += '<div class="bp-msg bot"><div class="bp-bubble">Sorry, something went wrong. Please try again.</div></div>'; }
    msgs.scrollTop = msgs.scrollHeight;
  });
})();
  `);
});

// ============================================================
// 404
// ============================================================
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 BotPip API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
