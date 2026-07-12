import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { checkVerificationCode } from '@/lib/verificationCode';
import { mergeEmailOwnership, getOrRevive } from '@/lib/accountMerge';
import { TRIAL_MS } from '@/lib/plans';
import { sendWelcomeEmail, notifyAdminNewAccount } from '@/lib/accountNotifications';

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
  const code     = typeof body?.code     === 'string' ? body.code.trim() : '';

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: CORS });
  }
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400, headers: CORS });
  }

  const result = await checkVerificationCode(kv, email, code, clientId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: CORS });
  }

  await kv.del(`sv:verify:${email}`);

  const merge = await mergeEmailOwnership(kv, email, clientId);
  if (merge.merged) {
    return NextResponse.json({ ok: true, merged: true, searches: merge.searches }, { headers: CORS });
  }
  if (merge.conflict) {
    // This clientId already has its own real Stripe subscription — do not
    // fall through to the "attach normally" path below, which would still
    // repoint sv:email: away from the other (also real) account without
    // ever migrating its data. Surface this for manual resolution instead.
    return NextResponse.json(
      { error: 'This email is linked to a different active subscription. Contact support to resolve this.' },
      { status: 409, headers: CORS }
    );
  }

  // Merge target vanished between request-code and verify (rare race) — the
  // code was still valid proof the user owns this email, so just attach it
  // normally rather than leaving them stuck. Check for recoverable
  // soft-deleted data on this clientId first, same reasoning as account/email.
  const { record, revived } = await getOrRevive(kv, clientId);
  const isNewAccount = !record.plan;
  const oldEmail = record.email ?? null;
  if (oldEmail && oldEmail !== email) {
    await kv.del(`sv:email:${oldEmail}`);
  }
  const now = Date.now();
  const updated = record.plan
    ? { ...record, email, updatedAt: now }
    : { plan: 'trial', trialStart: now, trialExpiresAt: now + TRIAL_MS, email, updatedAt: now };
  await Promise.all([
    kv.set(`sv:sub:${clientId}`, updated),
    kv.set(`sv:email:${email}`, clientId),
  ]);
  if (revived) await kv.del(`sv:deleted:${clientId}`);

  if (isNewAccount) {
    await Promise.all([
      sendWelcomeEmail(email, 'trial'),
      notifyAdminNewAccount({ email, plan: 'trial', clientId, event: 'signup', timestamp: now }),
    ]);
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
