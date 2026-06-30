// BotPip — Broadcaster Service
// Sends messages across Discord, Email, WhatsApp, Telegram, Slack simultaneously

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ============================================================
// SEND to a specific Discord channel
// ============================================================
async function sendDiscord(botToken, channelId, message) {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
    return response.ok;
  } catch (err) {
    console.error('Discord send error:', err.message);
    return false;
  }
}

// ============================================================
// SEND via WhatsApp (Twilio)
// ============================================================
async function sendWhatsApp(to, message) {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message
    });
    return true;
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return false;
  }
}

// ============================================================
// SEND via Telegram
// ============================================================
async function sendTelegram(botToken, chatId, message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
    return response.ok;
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return false;
  }
}

// ============================================================
// SEND via Slack
// ============================================================
async function sendSlack(botToken, channel, message) {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, text: message })
    });
    const data = await response.json();
    return data.ok;
  } catch (err) {
    console.error('Slack send error:', err.message);
    return false;
  }
}

// ============================================================
// FIRM BROADCASTER — send to their connected platforms
// ============================================================
async function broadcastForFirm(firmId, { platform, target, message }) {
  const { data: conn } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('firm_id', firmId)
    .eq('platform', platform)
    .eq('status', 'connected')
    .single();

  if (!conn) return { success: false, error: `${platform} not connected` };

  switch (platform) {
    case 'discord':
      // Find channel ID from channel name or use direct ID
      let channelId = target;
      if (target.startsWith('#')) {
        const { data: ch } = await supabase
          .from('discord_channels')
          .select('channel_id')
          .eq('firm_id', firmId)
          .ilike('channel_name', target.replace('#', ''))
          .single();
        if (ch) channelId = ch.channel_id;
      }
      return { success: await sendDiscord(conn.discord_bot_token, channelId, message) };

    case 'whatsapp':
      return { success: await sendWhatsApp(target, message) };

    case 'telegram':
      return { success: await sendTelegram(conn.telegram_bot_token, target, message) };

    case 'slack':
      return { success: await sendSlack(conn.slack_bot_token, target, message) };

    default:
      return { success: false, error: `Platform ${platform} not supported for broadcast` };
  }
}

// ============================================================
// SUPER ADMIN BROADCAST — send to all firms
// ============================================================
async function broadcastToAllFirms({ platforms, message, targetPlan = 'all' }) {
  let query = supabase.from('firms').select('id, name, email').eq('status', 'active');
  if (targetPlan !== 'all') query = query.eq('plan', targetPlan);
  const { data: firms } = await query;

  if (!firms || firms.length === 0) return { sent: 0 };

  const results = [];
  const { sendEmail } = require('./email');

  for (const firm of firms) {
    for (const platform of platforms) {
      if (platform === 'email') {
        const sent = await sendEmail({
          to: firm.email,
          subject: 'Important update from BotPip',
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><p>${message.replace(/\n/g, '<br>')}</p></div>`
        });
        results.push({ firmId: firm.id, platform: 'email', success: !!sent });
      } else if (platform === 'discord') {
        const conns = await supabase
          .from('platform_connections')
          .select('*')
          .eq('firm_id', firm.id)
          .eq('platform', 'discord')
          .eq('status', 'connected');

        if (conns.data?.[0]) {
          // Find announcement channel
          const { data: ch } = await supabase
            .from('discord_channels')
            .select('channel_id')
            .eq('firm_id', firm.id)
            .ilike('channel_name', 'announcement%')
            .limit(1)
            .single();

          if (ch) {
            const ok = await sendDiscord(conns.data[0].discord_bot_token, ch.channel_id, message);
            results.push({ firmId: firm.id, platform: 'discord', success: ok });
          }
        }
      }
    }
  }

  return { sent: results.filter(r => r.success).length, total: results.length, firms: firms.length };
}

// ============================================================
// ALERT super admin via WhatsApp
// ============================================================
async function alertSuperAdmin(message) {
  if (process.env.MY_WHATSAPP) {
    await sendWhatsApp(process.env.MY_WHATSAPP, `🤖 BotPip Alert:\n\n${message}`);
  }
}

// ============================================================
// SEND scheduled messages that are due
// ============================================================
async function processScheduledMessages() {
  const now = new Date().toISOString();
  const { data: due } = await supabase
    .from('scheduled_messages')
    .select('*, firms(id)')
    .eq('sent', false)
    .lte('send_at', now);

  if (!due || due.length === 0) return 0;

  let sent = 0;
  for (const msg of due) {
    const result = await broadcastForFirm(msg.firm_id, {
      platform: msg.platform,
      target: msg.target,
      message: msg.content
    });

    await supabase.from('scheduled_messages').update({
      sent: true,
      sent_at: new Date().toISOString()
    }).eq('id', msg.id);

    if (result.success) sent++;
  }
  return sent;
}

module.exports = {
  sendDiscord,
  sendWhatsApp,
  sendTelegram,
  sendSlack,
  broadcastForFirm,
  broadcastToAllFirms,
  alertSuperAdmin,
  processScheduledMessages
};
