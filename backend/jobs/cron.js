// BotPip — Cron Jobs
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { sendTrialExpiry, sendRevenueDigest } = require('../services/email');
const { checkAllFirmHealth } = require('../services/health');
const { processScheduledMessages } = require('../services/broadcaster');

console.log('🕐 BotPip cron jobs starting...');

// Every 5 minutes — process scheduled messages
cron.schedule('*/5 * * * *', async () => {
  const sent = await processScheduledMessages();
  if (sent > 0) console.log(`Sent ${sent} scheduled messages`);
});

// Every hour — check trial expiry
cron.schedule('0 * * * *', async () => {
  const { data: settings } = await supabase.from('platform_settings').select('trial_expiry_warning_days, grace_period_days, trial_auto_charge').single();
  const warningDays = settings?.trial_expiry_warning_days || 3;
  const graceDays = settings?.grace_period_days || 3;

  const warningDate = new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiring } = await supabase.from('firms').select('*').eq('plan', 'trial').eq('status', 'active').lte('trial_ends_at', warningDate).gt('trial_ends_at', new Date().toISOString());

  for (const firm of (expiring || [])) {
    const msLeft = new Date(firm.trial_ends_at) - Date.now();
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    await sendTrialExpiry(firm, daysLeft);
    console.log(`Trial expiry warning sent to ${firm.name} (${daysLeft} days left)`);
  }

  // Pause firms past grace period
  const graceDate = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: overdue } = await supabase.from('firms').select('id, name').eq('plan', 'trial').eq('status', 'active').lt('trial_ends_at', graceDate);
  for (const firm of (overdue || [])) {
    await supabase.from('firms').update({ status: 'paused' }).eq('id', firm.id);
    console.log(`Paused firm ${firm.name} — trial expired`);
  }
});

// Daily at 8am — health check all firms
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily health checks...');
  await checkAllFirmHealth();
});

// Every Monday 9am — weekly report to firms + super admin digest
cron.schedule('0 9 * * 1', async () => {
  console.log('Sending weekly reports...');

  // Super admin revenue digest
  const { data: firms } = await supabase.from('firms').select('id, plan, status').eq('status', 'active');
  const { data: plans } = await supabase.from('plans').select('name, price_monthly');
  const planMap = Object.fromEntries((plans || []).map(p => [p.name, p.price_monthly]));

  let monthlyRevenue = 0;
  for (const f of (firms || [])) monthlyRevenue += planMap[f.plan] || 0;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: newFirms } = await supabase.from('firms').select('id').gte('created_at', weekAgo);
  const { data: messages } = await supabase.from('messages').select('id').gte('created_at', weekAgo);

  await sendRevenueDigest({
    active_firms: firms?.length || 0,
    monthly_revenue: monthlyRevenue,
    new_firms: newFirms?.length || 0,
    churned: 0,
    total_messages: messages?.length || 0
  });
});

// Re-sync website URLs every 7 days
cron.schedule('0 2 * * 0', async () => {
  console.log('Re-syncing website URLs...');
  const { processURL } = require('../services/rag');
  const { data: docs } = await supabase.from('knowledge_docs').select('id, firm_id, source_url').eq('type', 'url').eq('status', 'indexed');
  for (const doc of (docs || [])) {
    try {
      await processURL(doc.source_url, doc.firm_id);
      console.log(`Re-synced URL: ${doc.source_url}`);
    } catch (e) { console.error(`URL re-sync failed: ${doc.source_url}`, e.message); }
  }
});

console.log('✅ All cron jobs scheduled');
