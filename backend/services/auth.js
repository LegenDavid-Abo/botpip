// BotPip — Auth Service

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES = '30d';

// ============================================================
// FIRM SIGNUP
// ============================================================
async function firmSignup({ name, email, password, referralCode }) {
  // Check email not taken
  const { data: existing } = await supabase.from('firms').select('id').eq('email', email).single();
  if (existing) throw new Error('Email already registered');

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Get trial days from settings
  const { data: settings } = await supabase.from('platform_settings').select('trial_days').single();
  const trialDays = settings?.trial_days || 14;
  const trial_ends_at = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  // Create firm
  const { data: firm, error } = await supabase.from('firms').insert({
    name, email, password_hash,
    plan: 'trial',
    status: 'active',
    trial_ends_at
  }).select().single();

  if (error) throw error;

  // Handle referral
  if (referralCode) {
    const { data: affiliate } = await supabase.from('affiliates').select('id').eq('referral_code', referralCode).single();
    if (affiliate) {
      await supabase.from('referrals').insert({ affiliate_id: affiliate.id, firm_id: firm.id });
    }
  }

  // Send welcome email
  const { sendWelcome } = require('./email');
  await sendWelcome(firm, trialDays);

  const token = jwt.sign({ firmId: firm.id, role: 'firm' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const { password_hash: _, ...firmData } = firm;
  return { firm: firmData, token };
}

// ============================================================
// FIRM LOGIN
// ============================================================
async function firmLogin({ email, password }) {
  const { data: firm } = await supabase.from('firms').select('*').eq('email', email).single();
  if (!firm) throw new Error('Invalid email or password');

  const valid = await bcrypt.compare(password, firm.password_hash);
  if (!valid) throw new Error('Invalid email or password');

  if (firm.status === 'paused') throw new Error('Account paused — please contact support');

  const token = jwt.sign({ firmId: firm.id, role: 'firm' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const { password_hash, ...firmData } = firm;
  return { firm: firmData, token };
}

// ============================================================
// SUPER ADMIN LOGIN
// ============================================================
async function superAdminLogin({ email, password }) {
  if (email !== process.env.SUPER_ADMIN_EMAIL) throw new Error('Invalid credentials');
  if (password !== process.env.SUPER_ADMIN_PASSWORD) throw new Error('Invalid credentials');

  const token = jwt.sign({ role: 'superadmin', email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, role: 'superadmin' };
}

// ============================================================
// VERIFY JWT token middleware
// ============================================================
function requireFirm(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'firm') return res.status(403).json({ error: 'Firm access required' });
    req.firmId = decoded.firmId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSuperAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Super admin access required' });
    req.adminEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.decoded = decoded;
    if (decoded.role === 'firm') req.firmId = decoded.firmId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { firmSignup, firmLogin, superAdminLogin, requireFirm, requireSuperAdmin, requireAuth };
