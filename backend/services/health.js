// BotPip — Bot Health Score Calculator

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ============================================================
// CALCULATE health score for a firm (0-100)
// ============================================================
async function calculateHealthScore(firmId) {
  let score = 0;
  const issues = [];
  const positives = [];

  // 1. Knowledge base docs (max 30 pts)
  const { data: docs } = await supabase.from('knowledge_docs').select('id, accuracy_score').eq('firm_id', firmId).eq('status', 'indexed');
  if (docs && docs.length > 0) {
    const avgAccuracy = docs.reduce((sum, d) => sum + (d.accuracy_score || 0), 0) / docs.length;
    const docScore = Math.min(30, docs.length * 10);
    score += docScore;
    positives.push(`${docs.length} document${docs.length > 1 ? 's' : ''} indexed (avg accuracy: ${Math.round(avgAccuracy)}%)`);
  } else {
    issues.push('No knowledge base documents uploaded');
  }

  // 2. Platform connections (max 20 pts)
  const { data: conns } = await supabase.from('platform_connections').select('platform').eq('firm_id', firmId).eq('status', 'connected');
  if (conns && conns.length > 0) {
    const connScore = Math.min(20, conns.length * 5);
    score += connScore;
    positives.push(`${conns.length} platform${conns.length > 1 ? 's' : ''} connected`);
  } else {
    issues.push('No platforms connected — bot cannot receive messages');
  }

  // 3. No conflicting rules (max 20 pts)
  const { data: conflicts } = await supabase.from('knowledge_conflicts').select('id').eq('firm_id', firmId).eq('resolved', false);
  if (!conflicts || conflicts.length === 0) {
    score += 20;
    positives.push('No conflicting rules detected');
  } else {
    const penalty = Math.min(20, conflicts.length * 5);
    issues.push(`${conflicts.length} conflicting rule${conflicts.length > 1 ? 's' : ''} need resolving`);
    score = Math.max(0, score - penalty);
  }

  // 4. AI settings configured (max 15 pts)
  const { data: firm } = await supabase.from('firms').select('confidence_threshold, bot_mode, reply_threading').eq('id', firmId).single();
  if (firm) {
    score += 15;
    positives.push('AI behaviour settings configured');
  }

  // 5. No question gaps — check for recent unanswered (max 15 pts)
  const { data: lowConf } = await supabase
    .from('messages')
    .select('id')
    .eq('firm_id', firmId)
    .eq('role', 'bot')
    .lt('confidence_score', 50)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!lowConf || lowConf.length === 0) {
    score += 15;
    positives.push('All recent questions answered confidently');
  } else {
    const penalty = Math.min(15, lowConf.length * 3);
    score = Math.max(0, score - penalty);
    issues.push(`${lowConf.length} questions answered with low confidence this week`);
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  // Update firm health score
  await supabase.from('firms').update({ health_score: score }).eq('id', firmId);

  return { score, issues, positives };
}

// ============================================================
// CHECK all firms and alert if health is low
// ============================================================
async function checkAllFirmHealth() {
  const { data: settings } = await supabase.from('platform_settings').select('health_alert_threshold').single();
  const threshold = settings?.health_alert_threshold || 60;

  const { data: firms } = await supabase.from('firms').select('id, name, email, health_score').eq('status', 'active');
  if (!firms) return;

  const { sendHealthAlert } = require('./email');

  for (const firm of firms) {
    const { score, issues } = await calculateHealthScore(firm.id);
    if (score < threshold && issues.length > 0) {
      await sendHealthAlert(firm, score, issues);
    }
  }
}

module.exports = { calculateHealthScore, checkAllFirmHealth };
