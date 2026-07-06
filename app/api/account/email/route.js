import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { generateCode, checkAndSetRateLimit, storeVerificationCode, sendVerificationEmail } from '@/lib/verificationCode';
import { getOrRevive } from '@/lib/accountMerge';
import { TRIAL_MS } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  const email    = typeof body?.email    === 'string' ? body.email.trim().toLowerCase() : '';

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: CORS });
  }

  const key = `sv:sub:${clientId}`;
  // No live record yet is expected now — subscription/status no longer
  // auto-creates a trial at first boot, since nothing is usable without an
  // email anyway. This is where the trial clock actually starts, the moment
  // an email is actually submitted. Check for recoverable soft-deleted data
  // first though — this same clientId could have been deleted (not merged)
  // by mistake and still have real plan/customerId data sitting there.
  const { record, revived } = await getOrRevive(kv, clientId);

  // This email may already belong to a different clientId — e.g. the extension
  // was uninstalled and reinstalled, generating a fresh clientId, and the user
  // is re-entering the email tied to their existing plan. Claiming someone
  // else's (or your own prior) account requires proof of ownership first — a
  // one-time code sent to the email — before any merge happens. A genuinely
  // new email (no existing owner) attaches immediately below, unchanged.
  const existingClientId = await kv.get(`sv:email:${email}`);
  if (existingClientId && existingClientId !== clientId) {
    const existingRecord = await kv.get(`sv:sub:${existingClientId}`);
    if (existingRecord) {
      const allowed = await checkAndSetRateLimit(kv, email);
      if (!allowed) {
        return NextResponse.json(
          { error: 'A code was already sent recently — check your inbox, or wait a minute before requesting another.' },
          { status: 429, headers: CORS }
        );
      }
      const code = generateCode();
      await storeVerificationCode(kv, email, code, clientId);
      await sendVerificationEmail(email, code);
      return NextResponse.json({ ok: true, needsVerification: true }, { headers: CORS });
    }
    // sv:email pointed at a clientId with no live record (stale index) — fall
    // through to the normal path below.
  }

  // Delete old secondary index if email is changing
  const oldEmail = record.email ?? null;
  if (oldEmail && oldEmail !== email) {
    await kv.del(`sv:email:${oldEmail}`);
  }

  // A record with no plan means this clientId has never been seen before —
  // start the trial here rather than at first boot.
  const now = Date.now();
  const updated = record.plan
    ? { ...record, email, updatedAt: now }
    : { plan: 'trial', trialStart: now, trialExpiresAt: now + TRIAL_MS, email, updatedAt: now };

  await Promise.all([
    kv.set(key, updated),
    kv.set(`sv:email:${email}`, clientId),
  ]);
  if (revived) await kv.del(`sv:deleted:${clientId}`);

  return NextResponse.json({ ok: true }, { headers: CORS });
}
