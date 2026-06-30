// BotPip — Email Service using Gmail SMTP (via nodemailer)
// No domain verification needed. Works immediately with any Gmail account.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD // 16-character App Password, NOT your normal Gmail password
  }
});

const FROM = process.env.GMAIL_FROM_NAME
  ? `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`
  : process.env.GMAIL_USER;

// ============================================================
// SEND any email
// ============================================================
async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    return info;
  } catch (err) {
    console.error('Email error:', err.message);
    return null;
  }
}

// ============================================================
// WELCOME EMAIL
// ============================================================
async function sendWelcome(firm, trialDays) {
  return sendEmail({
    to: firm.email,
    subject: `Welcome to BotPip — your AI bot is ready 🚀`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Welcome to BotPip, ${firm.name}!</h2>
        <p>Your account is live and ready. Here's how to get started in 3 steps:</p>
        <ol>
          <li><strong>Upload your rules PDF</strong> — go to Knowledge Base and upload your firm's documents.</li>
          <li><strong>Connect Discord</strong> — go to Integrations and follow the 4-step setup.</li>
          <li><strong>Test your bot</strong> — use the Playground to verify it answers correctly before going live.</li>
        </ol>
        <p>Your <strong>${trialDays}-day free trial</strong> starts now. No charge until it ends.</p>
        <p>Questions? Just reply to this email or use the "Contact Support" section in your dashboard.</p>
        <p>— The BotPip team</p>
      </div>
    `
  });
}

// ============================================================
// TRIAL EXPIRY WARNING
// ============================================================
async function sendTrialExpiry(firm, daysLeft) {
  return sendEmail({
    to: firm.email,
    subject: `Your BotPip trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} ⏳`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Trial ending soon, ${firm.name}</h2>
        <p>Your free trial ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
        <p>To keep your bot running without interruption, add a payment card — it takes 30 seconds.</p>
        <p>Your bot has been handling support automatically. Add a card to keep it going.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/subscription" 
           style="background:#7F77DD;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          Add card & continue
        </a>
        <p style="color:#888;font-size:12px">If you don't add a card, your bot will pause when the trial ends.</p>
      </div>
    `
  });
}

// ============================================================
// PAYMENT CONFIRMED
// ============================================================
async function sendPaymentConfirmed(firm, amount, plan) {
  return sendEmail({
    to: firm.email,
    subject: `Payment confirmed — BotPip ${plan} plan ✅`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Payment confirmed!</h2>
        <p>Hi ${firm.name},</p>
        <p>Your payment of <strong>$${amount}</strong> for the <strong>${plan}</strong> plan has been confirmed.</p>
        <p>Your bot is fully active on all connected platforms.</p>
        <p>— The BotPip team</p>
      </div>
    `
  });
}

// ============================================================
// PAYMENT FAILED
// ============================================================
async function sendPaymentFailed(firm) {
  return sendEmail({
    to: firm.email,
    subject: `Action needed — BotPip payment failed ⚠️`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Payment failed</h2>
        <p>Hi ${firm.name}, we couldn't process your payment. Please update your card to avoid interruption.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/subscription"
           style="background:#E24B4A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          Update payment method
        </a>
        <p style="color:#888;font-size:12px">Your bot will pause in 3 days if payment isn't resolved.</p>
      </div>
    `
  });
}

// ============================================================
// HEALTH SCORE ALERT
// ============================================================
async function sendHealthAlert(firm, score, issues) {
  return sendEmail({
    to: firm.email,
    subject: `Bot health alert — score dropped to ${score} ⚠️`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Your bot health score dropped</h2>
        <p>Hi ${firm.name}, your BotPip health score is now <strong>${score}/100</strong>.</p>
        <p>Issues found:</p>
        <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>
        <p>Login to your dashboard to fix these issues and improve your bot's performance.</p>
        <a href="${process.env.FRONTEND_URL}/playground/health"
           style="background:#7F77DD;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          Fix issues now
        </a>
      </div>
    `
  });
}

// ============================================================
// ESCALATION ALERT to firm owner
// ============================================================
async function sendEscalationAlert(firm, userName, question, platform) {
  return sendEmail({
    to: firm.email,
    subject: `Bot escalation — ${userName} needs a human on ${platform}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Escalation alert</h2>
        <p><strong>${userName}</strong> on <strong>${platform}</strong> asked a question your bot couldn't answer confidently:</p>
        <blockquote style="border-left:3px solid #7F77DD;padding-left:16px;color:#555">${question}</blockquote>
        <p>Login to your dashboard to reply.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/escalations"
           style="background:#7F77DD;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          View escalation
        </a>
      </div>
    `
  });
}

// ============================================================
// WEEKLY REPORT to firm
// ============================================================
async function sendWeeklyReport(firm, stats) {
  return sendEmail({
    to: firm.email,
    subject: `BotPip weekly report — ${firm.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Weekly report</h2>
        <p>Here's how your bot performed this week:</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Messages handled</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.messages}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">AI resolution rate</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.resolution_rate}%</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Escalations</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.escalations}</td></tr>
          <tr><td style="padding:8px">Health score</td><td style="padding:8px;font-weight:bold">${stats.health_score}/100</td></tr>
        </table>
        <a href="${process.env.FRONTEND_URL}/dashboard/analytics"
           style="background:#7F77DD;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          View full analytics
        </a>
      </div>
    `
  });
}

// ============================================================
// SUPER ADMIN — new firm message alert
// ============================================================
async function sendSupportMessageAlert(firmName, subject, content) {
  return sendEmail({
    to: process.env.SUPER_ADMIN_EMAIL,
    subject: `BotPip: New message from ${firmName} — ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>New support message</h2>
        <p><strong>From:</strong> ${firmName}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <blockquote style="border-left:3px solid #7F77DD;padding-left:16px;color:#555">${content}</blockquote>
        <a href="${process.env.FRONTEND_URL}/super/inbox"
           style="background:#7F77DD;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          Reply in dashboard
        </a>
      </div>
    `
  });
}

// ============================================================
// SUPER ADMIN — weekly revenue digest
// ============================================================
async function sendRevenueDigest(stats) {
  return sendEmail({
    to: process.env.SUPER_ADMIN_EMAIL,
    subject: `BotPip weekly revenue — $${stats.monthly_revenue}/month`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Weekly revenue digest</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Active firms</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.active_firms}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Monthly revenue</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">$${stats.monthly_revenue}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">New this week</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.new_firms}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Churn this week</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${stats.churned}</td></tr>
          <tr><td style="padding:8px">Total messages</td><td style="padding:8px;font-weight:bold">${stats.total_messages}</td></tr>
        </table>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendWelcome,
  sendTrialExpiry,
  sendPaymentConfirmed,
  sendPaymentFailed,
  sendHealthAlert,
  sendEscalationAlert,
  sendWeeklyReport,
  sendSupportMessageAlert,
  sendRevenueDigest
};
