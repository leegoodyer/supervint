import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'sv_admin_session';

// sha256(ADMIN_PASSWORD) — stored in the cookie rather than the raw password,
// so a leaked cookie doesn't reveal the secret and can't be forged without it.
export function expectedAdminToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function verifyPassword(password) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !password) return false;
  return safeEqual(password, pw);
}

export async function isAdminAuthed() {
  const expected = expectedAdminToken();
  if (!expected) return false;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, expected);
}
