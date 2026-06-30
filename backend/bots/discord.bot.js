// BotPip — Discord Bot
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { searchKnowledge } = require('../services/rag');
const { generateBotResponse } = require('../services/claude');
const { sendEscalationAlert } = require('../services/email');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ BotPip Discord bot ready as ${bot.user.tag}`);
  await syncAllChannels();
});

async function syncAllChannels() {
  const { data: conns } = await supabase.from('platform_connections').select('firm_id,discord_guild_id').eq('platform', 'discord').eq('status', 'connected');
  if (!conns) return;
  for (const conn of conns) await syncChannels(conn.firm_id, conn.discord_guild_id);
}

async function syncChannels(firmId, guildId) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const chs = guild.channels.cache.filter(ch => ch.type === 0);
    for (const [channelId, ch] of chs) {
      await supabase.from('discord_channels').upsert({ firm_id: firmId, guild_id: guildId, channel_id: channelId, channel_name: ch.name, channel_type: 'text' }, { onConflict: 'firm_id,channel_id' });
    }
  } catch (e) { console.error('Sync error:', e.message); }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guildId) return;

  const { data: conn } = await supabase.from('platform_connections').select('firm_id').eq('platform', 'discord').eq('discord_guild_id', message.guildId).eq('status', 'connected').single();
  if (!conn) return;

  const { data: ch } = await supabase.from('discord_channels').select('monitored').eq('firm_id', conn.firm_id).eq('channel_id', message.channelId).single();
  if (!ch?.monitored) return;

  const { data: firm } = await supabase.from('firms').select('*').eq('id', conn.firm_id).single();
  if (!firm || firm.status === 'paused') return;

  if (firm.bot_mode === 'human') return;

  // Get conversation history
  const convKey = `${conn.firm_id}_discord_${message.author.id}`;
  const chunks = await searchKnowledge(conn.firm_id, message.content);

  const { answer, confidence, shouldEscalate } = await (async () => {
    const { answer, confidence, linkShared, sourceDocId } = await generateBotResponse({ question: message.content, chunks, firmSettings: firm, platformUserId: message.author.id, platformUserName: message.member?.displayName || message.author.username });
    const esc = confidence < firm.confidence_threshold && firm.human_handoff;
    return { answer, confidence, shouldEscalate: esc };
  })();

  // Save to DB
  let { data: conv } = await supabase.from('conversations').select('id').eq('firm_id', conn.firm_id).eq('platform', 'discord').eq('platform_user_id', message.author.id).eq('status', 'open').order('created_at', { ascending: false }).limit(1).single();
  if (!conv) {
    const { data: nc } = await supabase.from('conversations').insert({ firm_id: conn.firm_id, platform: 'discord', platform_user_id: message.author.id, platform_user_name: message.member?.displayName || message.author.username, platform_channel_id: message.channelId }).select('id').single();
    conv = nc;
  }
  await supabase.from('messages').insert([
    { conversation_id: conv.id, firm_id: conn.firm_id, role: 'user', content: message.content, platform_message_id: message.id },
    { conversation_id: conv.id, firm_id: conn.firm_id, role: 'bot', content: answer, confidence_score: confidence, escalated: shouldEscalate }
  ]);

  try {
    if (answer.length > 200 || answer.includes('**')) {
      const embed = new EmbedBuilder().setColor(firm.bot_color || '#7F77DD').setDescription(answer).setFooter({ text: `${firm.bot_name || 'BotPip'} • ${confidence}% confidence` }).setTimestamp();
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply(answer);
    }
    if (firm.stamp_resolved && !shouldEscalate) await message.react('✅');
    if (shouldEscalate) {
      await message.react('⚠️');
      await sendEscalationAlert(firm, message.member?.displayName || message.author.username, message.content, 'Discord');
    }
  } catch (e) { console.error('Discord reply error:', e.message); }
});

client.on(Events.GuildCreate, async (guild) => {
  const { data: conn } = await supabase.from('platform_connections').select('firm_id').eq('discord_guild_id', guild.id).single();
  if (conn) await syncChannels(conn.firm_id, guild.id);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => { console.error('Discord login failed:', e.message); process.exit(1); });
module.exports = client;
