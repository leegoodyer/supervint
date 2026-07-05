import { Resend } from 'resend';

// Instantiated lazily, not at module load — most account/email requests
// never need to send anything (only the "claiming an already-owned email"
// path does), so a missing/misconfigured key shouldn't break every request
// to that endpoint, only the one path that actually needs Resend.
let resend = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = 'Supervint <alerts@supervint.com>';

const CODE_TTL_SECONDS  = 15 * 60; // 15 minutes — Redis TTL is the only expiry check needed
const RATE_LIMIT_SECONDS = 60;      // minimum gap between code requests for the same email
const MAX_ATTEMPTS       = 5;

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits, no leading zero ambiguity
}

// Returns true if allowed to send, false if rate-limited.
export async function checkAndSetRateLimit(kv, email) {
  const key = `sv:coderate:${email}`;
  const existing = await kv.get(key);
  if (existing) return false;
  await kv.set(key, Date.now(), { ex: RATE_LIMIT_SECONDS });
  return true;
}

export async function storeVerificationCode(kv, email, code, clientId) {
  await kv.set(
    `sv:verify:${email}`,
    { code, clientId, attempts: 0 },
    { ex: CODE_TTL_SECONDS }
  );
}

export async function sendVerificationEmail(email, code) {
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: `${code} is your Supervint verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;">
        <p>Someone tried to link this email to a Supervint account. If that was you, enter this code in the extension to continue:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:20px 0;">${code}</p>
        <p style="color:#6b7280;font-size:13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// Validates a submitted code against sv:verify:<email>. Returns
// { ok: true } on success (caller is responsible for deleting the record),
// or { ok: false, error } on failure. Increments attempts on mismatch.
export async function checkVerificationCode(kv, email, code, clientId) {
  const key = `sv:verify:${email}`;
  const record = await kv.get(key);
  if (!record) {
    return { ok: false, error: 'Code expired or not found — request a new one.' };
  }
  if (record.clientId !== clientId) {
    return { ok: false, error: 'This code was requested from a different device.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await kv.del(key);
    return { ok: false, error: 'Too many incorrect attempts — request a new code.' };
  }
  if (record.code !== code) {
    await kv.set(key, { ...record, attempts: record.attempts + 1 }, { ex: CODE_TTL_SECONDS });
    return { ok: false, error: 'Incorrect code.' };
  }
  return { ok: true };
}
