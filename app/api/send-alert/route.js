import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { planLimits, normalizePlan, PAID_PLANS } from '@/lib/plans';

const kv     = Redis.fromEnv();
const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = 'Supervint <alerts@supervint.com>';
const RESEND_FREE_DAILY_MAX = 100;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const { clientId, toEmail, searchLabel, itemTitle, itemPrice, itemUrl, thumbnailUrl } = body;

  if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400, headers: CORS });
  }

  // Validate clientId and look up plan from KV — never trust the client's self-reported plan
  const clientIdStr = typeof clientId === 'string' ? clientId.trim() : '';
  if (!clientIdStr || clientIdStr.length < 8 || clientIdStr.length > 128) {
    return Response.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }

  const record = await kv.get(`sv:sub:${clientIdStr}`);
  const storedPlan = normalizePlan(record?.plan);
  const effectivePlan = (storedPlan === 'trial' && record?.trialExpiresAt && Date.now() > record.trialExpiresAt)
    ? 'free'
    : storedPlan;

  const limits = planLimits(effectivePlan);
  if (!limits.emailLimit) {
    return Response.json({ error: 'Email alerts require a Trial or paid plan' }, { status: 403, headers: CORS });
  }
  const dailyLimit = limits.emailLimit;

  if (!process.env.RESEND_API_KEY) {
    console.error('[Supervint] RESEND_API_KEY is not set — email alerts are disabled');
    return Response.json({ error: 'Email service not configured' }, { status: 503, headers: CORS });
  }

  // IP rate-limit backstop
  const forwarded = request.headers.get('x-forwarded-for');
  const ip        = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const minute    = Math.floor(Date.now() / 60_000);
  const ipKey     = `rl:${ip}:${minute}`;
  const ipCount   = await kv.incr(ipKey);
  if (ipCount === 1) await kv.expire(ipKey, 120);
  if (ipCount > 20) {
    return Response.json({ error: 'Too many requests — try again shortly' }, { status: 429, headers: CORS });
  }

  // Per-customer daily cap — increment first to prevent races
  const today    = new Date().toISOString().slice(0, 10);
  const countKey = `ec:${toEmail}:${today}`;
  const newCount = await kv.incr(countKey);
  if (newCount === 1) await kv.expire(countKey, 90_000); // ~25h

  if (newCount > dailyLimit) {
    if (newCount === dailyLimit + 1) {
      try {
        await resend.emails.send({
          from:    FROM,
          to:      toEmail,
          subject: 'Supervint — daily email alert limit reached',
          html:    buildCapNotifHtml(dailyLimit, effectivePlan),
        });
        await incrementGlobalCounter(today);
      } catch (err) {
        console.error('[Supervint] Cap notification failed:', err.message);
      }
    }
    return Response.json({ capReached: true, sentToday: dailyLimit, dailyLimit }, { headers: CORS });
  }

  try {
    await resend.emails.send({
      from:    FROM,
      to:      toEmail,
      subject: `[${searchLabel}] ${itemTitle} — ${itemPrice}`,
      html:    buildAlertHtml({ searchLabel, itemTitle, itemPrice, itemUrl, thumbnailUrl, sentToday: newCount, dailyLimit }),
    });
  } catch (err) {
    await kv.decr(countKey);
    console.error('[Supervint] Alert send failed:', err.message);
    return Response.json({ error: 'Failed to send email — will retry' }, { status: 500, headers: CORS });
  }

  const globalCount = await incrementGlobalCounter(today);
  if (globalCount >= Math.floor(RESEND_FREE_DAILY_MAX * 0.8)) {
    console.warn(`[Supervint] Approaching Resend daily limit: ${globalCount}/${RESEND_FREE_DAILY_MAX} emails today`);
  }
  if (globalCount >= RESEND_FREE_DAILY_MAX) {
    console.error(`[Supervint] Resend FREE daily limit reached: ${globalCount}/${RESEND_FREE_DAILY_MAX} — upgrade plan or sending will stop`);
  }

  return Response.json({ ok: true, sentToday: newCount, dailyLimit, capReached: false }, { headers: CORS });
}

async function incrementGlobalCounter(today) {
  const key   = `global:${today}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, 90_000);
  return count;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAlertHtml({ searchLabel, itemTitle, itemPrice, itemUrl, thumbnailUrl, sentToday, dailyLimit }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:480px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)">
  <div style="background:#09B83C;padding:12px 16px;display:flex;align-items:baseline;gap:8px">
    <span style="color:#fff;font-size:15px;font-weight:700">Supervint</span>
    <span style="color:rgba(255,255,255,.8);font-size:12px">${esc(searchLabel)}</span>
  </div>
  <div style="padding:16px 18px">
    ${thumbnailUrl ? `<img src="${esc(thumbnailUrl)}" alt="" width="70" style="float:right;border-radius:4px;margin:0 0 8px 12px">` : ''}
    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a2e">${esc(itemTitle)}</p>
    <p style="margin:0 0 14px;font-size:20px;font-weight:700;color:#09B83C">${esc(itemPrice)}</p>
    <a href="${esc(itemUrl)}" style="display:inline-block;padding:8px 18px;background:#09B83C;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View on Vinted →</a>
    <div style="clear:both"></div>
  </div>
  <div style="padding:8px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af">
    ${sentToday}/${dailyLimit} email alerts used today · <a href="https://supervint.com" style="color:#9ca3af;text-decoration:none">supervint.com</a>
  </div>
</div>
</body></html>`;
}

function buildCapNotifHtml(dailyLimit, plan) {
  const planName   = plan === 'powerseller' ? 'Power Seller' : plan === 'trial' ? 'Trial' : 'Reseller';
  const canUpgrade = plan !== 'powerseller';
  const continuing = planLimits(plan).sheets
    ? 'Desktop notifications and Google Sheets logging'
    : 'Desktop notifications';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:480px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)">
  <div style="background:#09B83C;padding:12px 16px">
    <span style="color:#fff;font-size:15px;font-weight:700">Supervint</span>
  </div>
  <div style="padding:16px 18px">
    <p style="margin:0 0 10px;font-size:14px;color:#1a1a2e">You've reached your daily email alert limit of <strong>${dailyLimit} emails</strong> on the ${planName} plan.</p>
    <p style="margin:0 0 10px;font-size:13px;color:#6b7280">${continuing} continue as normal. Email alerts will resume automatically at midnight.</p>
    ${canUpgrade ? `<p style="margin:0 0 10px;font-size:13px;color:#6b7280">Need more? <a href="https://supervint.com/#pricing" style="color:#09B83C;text-decoration:none;font-weight:600">Upgrade to Power Seller</a> for 25 alerts/day.</p>` : ''}
    <p style="margin:0;font-size:13px;color:#9ca3af">— The Supervint team</p>
  </div>
</div>
</body></html>`;
}
