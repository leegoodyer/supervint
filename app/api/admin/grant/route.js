import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan, PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const clientId  = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  const plan      = normalizePlan(body?.plan);
  const trialDays = plan === 'trial' ? Math.max(1, Math.min(365, Number(body?.trialDays) || 5)) : null;
  const email     = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId.' }, { status: 400 });
  }
  if (!(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  // Read existing record so we can preserve Stripe IDs and createdAt.
  const existing = (await kv.get(`sv:sub:${clientId}`)) ?? {};
  const now      = Date.now();

  // admin/grant previously never touched sv:email: at all — the exact reason
  // manually-granted test accounts (no Stripe checkout, no account/email call)
  // ended up with a record.email that the email-index lookup could never find.
  if (email && email !== (existing.email ?? null)) {
    const indexedClientId = await kv.get(`sv:email:${email}`);
    if (indexedClientId && indexedClientId !== clientId) {
      return NextResponse.json({
        error: `That email is already linked to a different account (${indexedClientId}). Resolve that first.`,
      }, { status: 409 });
    }
    const oldEmail = existing.email ?? null;
    if (oldEmail && oldEmail !== email) {
      await kv.del(`sv:email:${oldEmail}`);
    }
    await kv.set(`sv:email:${email}`, clientId);
  }

  let updated;
  if (plan === 'trial') {
    updated = {
      ...existing,
      plan:           'trial',
      trialStart:     existing.trialStart ?? now,
      trialExpiresAt: now + trialDays * 24 * 60 * 60 * 1000,
      adminGrantedAt: now,
      updatedAt:      now,
    };
  } else if (plan === 'free') {
    updated = {
      ...existing,
      plan:           'free',
      trialStart:     existing.trialStart ?? null,
      trialExpiresAt: null,
      adminGrantedAt: now,
      updatedAt:      now,
    };
  } else {
    // reseller / powerseller — preserve any existing Stripe IDs
    updated = {
      ...existing,
      plan,
      trialExpiresAt: null,
      adminGrantedAt: now,
      updatedAt:      now,
    };
  }

  if (email) updated.email = email;

  await kv.set(`sv:sub:${clientId}`, updated);

  return NextResponse.json({ ok: true, clientId, plan });
}
