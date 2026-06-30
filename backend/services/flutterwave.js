// BotPip — Flutterwave Payment Service
// Works for Nigerian-registered businesses and accepts payment from anywhere in the world.
// Docs: https://developer.flutterwave.com/docs

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

// ============================================================
// CREATE a payment link (checkout) for a firm's plan upgrade
// ============================================================
async function createCheckoutSession(firmId, planName, couponCode = null) {
  const { data: firm } = await supabase.from('firms').select('*').eq('id', firmId).single();
  const { data: plan } = await supabase.from('plans').select('*').eq('name', planName).single();
  if (!firm || !plan) throw new Error('Firm or plan not found');

  let amount = plan.price_monthly;

  // Apply coupon if provided
  if (couponCode) {
    try {
      const { data: coupon } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('active', true).single();
      if (coupon) {
        if (coupon.discount_type === 'percent_first' || coupon.discount_type === 'percent_forever') {
          amount = amount * (1 - coupon.discount_value / 100);
        } else if (coupon.discount_type === 'fixed') {
          amount = Math.max(0, amount - coupon.discount_value);
        }
        await supabase.from('coupons').update({ uses_count: coupon.uses_count + 1 }).eq('id', coupon.id);
      }
    } catch (e) { /* coupon not found, continue with full price */ }
  }

  const tx_ref = `botpip_${firmId}_${planName}_${Date.now()}`;

  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref,
      amount: amount.toFixed(2),
      currency: process.env.FLW_CURRENCY || 'USD',
      redirect_url: `${process.env.FRONTEND_URL}/dashboard?payment=processing`,
      customer: {
        email: firm.email,
        name: firm.name
      },
      customizations: {
        title: 'BotPip',
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
        logo: `${process.env.FRONTEND_URL}/logo.png`
      },
      meta: {
        firm_id: firmId,
        plan_name: planName
      }
    })
  });

  const data = await response.json();
  if (data.status !== 'success') throw new Error(data.message || 'Failed to create payment link');

  // Store the tx_ref so we can verify it later from the webhook/redirect
  await supabase.from('firms').update({ pending_tx_ref: tx_ref }).eq('id', firmId);

  return { url: data.data.link };
}

// ============================================================
// VERIFY a transaction (called from webhook or redirect callback)
// ============================================================
async function verifyTransaction(transactionId) {
  const response = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` }
  });
  const data = await response.json();
  return data;
}

// ============================================================
// HANDLE Flutterwave webhook
// ============================================================
async function handleWebhook(payload, signature) {
  // Verify the webhook signature matches your configured hash
  const expectedSig = process.env.FLW_WEBHOOK_HASH;
  if (expectedSig && signature !== expectedSig) {
    throw new Error('Invalid webhook signature');
  }

  const { sendPaymentConfirmed, sendPaymentFailed } = require('./email');

  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    const { meta, amount, id } = payload.data;
    const firmId = meta?.firm_id;
    const planName = meta?.plan_name;
    if (!firmId || !planName) return { received: true };

    // Double-check with verify endpoint (never trust webhook body alone)
    const verified = await verifyTransaction(id);
    if (verified.data?.status !== 'successful') return { received: true };

    await supabase.from('firms').update({
      plan: planName,
      status: 'active',
      flw_customer_email: payload.data.customer?.email,
      trial_ends_at: null,
      pending_tx_ref: null,
      updated_at: new Date().toISOString()
    }).eq('id', firmId);

    const { data: firm } = await supabase.from('firms').select('*').eq('id', firmId).single();
    if (firm) await sendPaymentConfirmed(firm, amount, planName);
  }

  if (payload.event === 'charge.failed') {
    const { meta } = payload.data;
    const firmId = meta?.firm_id;
    if (firmId) {
      const { data: firm } = await supabase.from('firms').select('*').eq('id', firmId).single();
      if (firm) {
        await supabase.from('firms').update({ status: 'overdue' }).eq('id', firmId);
        await sendPaymentFailed(firm);
      }
    }
  }

  return { received: true };
}

// ============================================================
// CANCEL subscription (manual — Flutterwave doesn't auto-recur
// the same way Stripe does for one-off plan links, so cancellation
// just downgrades the firm in our own database)
// ============================================================
async function cancelSubscription(firmId) {
  await supabase.from('firms').update({ plan: 'trial', status: 'cancelled' }).eq('id', firmId);
}

module.exports = { createCheckoutSession, verifyTransaction, handleWebhook, cancelSubscription };
