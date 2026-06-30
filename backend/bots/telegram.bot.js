// BotPip — Telegram Bot
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { searchKnowledge } = require('../services/rag');
const { generateBotResponse } = require('../services/claude');
const { sendEscalationAlert } = require('../services/email');

// Map of firm telegram bots: firmId -> bot instance
const bots = new Map();

async function startTelegramBots() {
  const { data: conns } = await supabase.from('platform_connections').select('firm_id,telegram_bot_token').eq('platform', 'telegram').eq('status', 'connected');
  if (!conns) return;
  for (const conn of conns) {
    if (!conn.telegram_bot_token) continue;
    try {
      const bot = new TelegramBot(conn.telegram_bot_token, { polling: true });
      bots.set(conn.firm_id, bot);
      setupBotHandlers(bot, conn.firm_id);
      console.log(`✅ Telegram bot started for firm ${conn.firm_id}`);
    } catch (e) { console.error(`Telegram bot error for firm ${conn.firm_id}:`, e.message); }
  }
}

function setupBotHandlers(bot, firmId) {
  bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const userName = msg.from.first_name || msg.from.username || userId;

    const { data: firm } = await supabase.from('firms').select('*').eq('id', firmId).single();
    if (!firm || firm.status === 'paused') return;
    if (firm.bot_mode === 'human') return;

    const chunks = await searchKnowledge(firmId, msg.text);
    const { answer, confidence, linkShared, sourceDocId } = await generateBotResponse({ question: msg.text, chunks, firmSettings: firm, platformUserId: userId, platformUserName: userName });
    const shouldEscalate = confidence < firm.confidence_threshold && firm.human_handoff;

    // Save to DB
    let { data: conv } = await supabase.from('conversations').select('id').eq('firm_id', firmId).eq('platform', 'telegram').eq('platform_user_id', userId).eq('status', 'open').limit(1).single();
    if (!conv) {
      const { data: nc } = await supabase.from('conversations').insert({ firm_id: firmId, platform: 'telegram', platform_user_id: userId, platform_user_name: userName, platform_channel_id: chatId.toString() }).select('id').single();
      conv = nc;
    }
    await supabase.from('messages').insert([
      { conversation_id: conv.id, firm_id: firmId, role: 'user', content: msg.text, platform_message_id: msg.message_id.toString() },
      { conversation_id: conv.id, firm_id: firmId, role: 'bot', content: answer, confidence_score: confidence, escalated: shouldEscalate }
    ]);

    // Reply in thread (reply_to_message_id)
    await bot.sendMessage(chatId, answer, {
      reply_to_message_id: msg.message_id,
      parse_mode: 'HTML'
    });

    if (shouldEscalate) await sendEscalationAlert(firm, userName, msg.text, 'Telegram');
  });
}

startTelegramBots().then(() => console.log('Telegram bots initialised'));
module.exports = { bots, startTelegramBots };
