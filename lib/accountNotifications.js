import { Resend } from 'resend';

// Lazy singleton, same reasoning as lib/verificationCode.js — most requests
// on the calling routes don't hit the "brand new account" branch, so a
// missing/misconfigured key shouldn't break every request, only the ones
// that actually try to send.
let resend = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM     = 'Supervint <alerts@supervint.com>';
const ADMIN_TO = process.env.ADMIN_NOTIFICATION_EMAIL;

const PLAN_LABELS = { free: 'Free', trial: 'Trial', reseller: 'Reseller', powerseller: 'Power Seller' };

const PLAN_BLURB = {
  trial:       'Your 5-day trial includes 5 live searches and up to 10 email alerts a day.',
  reseller:    'Your plan includes 10 live searches, 10 email alerts a day, and Google Sheets logging.',
  powerseller: 'Your plan includes unlimited live searches, 25 email alerts a day, and Google Sheets logging.',
  free:        'Your free plan includes 1 live search.',
};

function buildWelcomeHtml(plan) {
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const blurb = PLAN_BLURB[plan] ?? '';
  return `
    <body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12);">
        <div style="background:#09B83C;padding:14px 18px;">
          <div style="color:#fff;font-size:15px;font-weight:700;">Supervint</div>
          <div style="color:rgba(255,255,255,.8);font-size:12px;margin-top:2px;">${planLabel} plan is active</div>
        </div>
        <div style="padding:16px 18px;color:#1a1a2e;">
          <p style="font-size:15px;">Welcome to Supervint — here's how to get your first snipe running.</p>
          <ol style="padding-left:18px;font-size:14px;line-height:1.6;">
            <li><strong>Paste a search.</strong> Search Vinted like normal, copy the link, drop it into Supervint.</li>
            <li><strong>Name it, set your alert.</strong> Give it a label, choose your hours, set a price alert if you want emails.</li>
            <li><strong>Get on with your day.</strong> Supervint snipes in the background — you'll find out the moment it matters.</li>
          </ol>
          ${blurb ? `<p style="font-size:13px;color:#6b7280;">${blurb}</p>` : ''}
          <p style="font-size:13px;color:#6b7280;">Questions? Just reply to this email.</p>
        </div>
        <div style="padding:8px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
          — The Supervint team · <a href="https://supervint.com" style="color:#9ca3af;">supervint.com</a>
        </div>
      </div>
    </body>
  `;
}

function buildAdminNotifHtml({ email, plan, clientId, event, previousPlan, timestamp }) {
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const rows = [
    ['Email', email ?? '(none on file)'],
    ['Plan', planLabel],
    ...(previousPlan !== undefined ? [['Previous plan', previousPlan ? (PLAN_LABELS[previousPlan] ?? previousPlan) : '(none — brand new)']] : []),
    ['Client ID', clientId],
    ['Event', event],
    ['Timestamp', new Date(timestamp).toISOString()],
  ];
  return `
    <body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12);">
        <div style="background:#09B83C;padding:14px 18px;">
          <div style="color:#fff;font-size:15px;font-weight:700;">Supervint</div>
          <div style="color:rgba(255,255,255,.8);font-size:12px;margin-top:2px;">New account activity</div>
        </div>
        <div style="padding:16px 18px;color:#1a1a2e;">
          <table style="font-size:13px;border-collapse:collapse;width:100%;">
            ${rows.map(([k, v]) => `
              <tr>
                <td style="padding:4px 8px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">${k}</td>
                <td style="padding:4px 0;">${v}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    </body>
  `;
}

// Fired only on genuinely first-time account creation (no prior sv:sub:
// record) — not on later plan changes/upgrades for an existing account.
export async function sendWelcomeEmail(email, plan) {
  if (!email) return;
  try {
    await getResend().emails.send({
      from:    FROM,
      to:      email,
      subject: 'Welcome to Supervint — here’s how to get started',
      html:    buildWelcomeHtml(plan),
    });
  } catch (err) {
    console.error('[accountNotifications] welcome email failed:', err?.message);
  }
}

// event: 'signup' (free/trial email entered) | 'stripe_signup' (brand new
// account created directly via checkout) | 'stripe_conversion' (existing
// trial/free account converting to paid). previousPlan is only meaningful
// for the stripe events.
export async function notifyAdminNewAccount({ email, plan, clientId, event, previousPlan, timestamp = Date.now() }) {
  if (!ADMIN_TO) {
    console.error('[accountNotifications] ADMIN_NOTIFICATION_EMAIL not set — skipping admin notification');
    return;
  }
  try {
    await getResend().emails.send({
      from:    FROM,
      to:      ADMIN_TO,
      subject: `New Supervint account: ${email ?? clientId} (${PLAN_LABELS[plan] ?? plan})`,
      html:    buildAdminNotifHtml({ email, plan, clientId, event, previousPlan, timestamp }),
    });
  } catch (err) {
    console.error('[accountNotifications] admin notification failed:', err?.message);
  }
}
