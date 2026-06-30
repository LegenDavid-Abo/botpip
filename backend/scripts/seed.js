// BotPip — Seed script
// Creates a demo firm account you can log in with immediately.
// Run with: node scripts/seed.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DEMO_FIRM = {
  name: 'Demo Trading Firm',
  email: 'demo@botpip.io',
  password: 'Demo12345!'
};

async function seed() {
  console.log('Seeding demo firm...');

  const { data: existing } = await supabase.from('firms').select('id').eq('email', DEMO_FIRM.email).single();
  if (existing) {
    console.log('Demo firm already exists. Email:', DEMO_FIRM.email, ' Password:', DEMO_FIRM.password);
    return;
  }

  const password_hash = await bcrypt.hash(DEMO_FIRM.password, 12);
  const trial_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase.from('firms').insert({
    name: DEMO_FIRM.name,
    email: DEMO_FIRM.email,
    password_hash,
    plan: 'trial',
    status: 'active',
    trial_ends_at
  }).select().single();

  if (error) {
    console.error('Seed failed:', error.message);
    console.error('Check that SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env are correct,');
    console.error('and that you ran db/schema.sql in the Supabase SQL editor first.');
    process.exit(1);
  }

  console.log('✅ Demo firm created successfully!');
  console.log('   Login at /login with:');
  console.log('   Email:    ' + DEMO_FIRM.email);
  console.log('   Password: ' + DEMO_FIRM.password);
}

seed();
