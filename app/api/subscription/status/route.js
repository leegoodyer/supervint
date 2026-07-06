import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { planLimits, normalizePlan } from '@/lib/plans';

const kv = Redis.fromEnv();

const CORS = {
  'Access-Control-Allow-Origin': '*',
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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }

  const key = `sv:sub:${clientId}`;
  const record = await kv.get(key);

  if (!record) {
    // Missing because this clientId was merged into another one (reinstall,
    // Stripe checkout under a known email, or admin grant) — without this
    // check, the old device would silently get a brand new trial instead of
    // a real signal that its plan moved elsewhere.
    const deletedRecord = await kv.get(`sv:deleted:${clientId}`);
    const invalidated = !!deletedRecord?.mergedInto;

    // Nothing persisted yet, and this clientId was never merged away either
    // — a genuinely fresh install. Nothing is usable without an email on
    // file anyway (search creation and starting a search both require it),
    // so don't create a record or start the trial clock here — that now
    // happens in account/email, at the moment an email is actually
    // submitted. This just reports the pre-email state without writing
    // anything.
    const freeLimits = planLimits('free');
    return NextResponse.json({
      plan:           'free',
      searchLimit:    freeLimits.searchLimit,
      emailLimit:     freeLimits.emailLimit,
      sheets:         freeLimits.sheets,
      trialExpiresAt: null,
      email:          null,
      invalidated,
    }, { headers: CORS });
  }

  let plan = normalizePlan(record.plan);

  // Expire trial to free if the window has passed and no paid plan is recorded
  if (plan === 'trial' && record.trialExpiresAt && Date.now() > record.trialExpiresAt) {
    plan = 'free';
    await kv.set(key, { ...record, plan: 'free', updatedAt: Date.now() });
  }

  const limits = planLimits(plan);

  return NextResponse.json({
    plan,
    searchLimit:    limits.searchLimit,
    emailLimit:     limits.emailLimit,
    sheets:         limits.sheets,
    trialExpiresAt: record.trialExpiresAt ?? null,
    email:          record.email          ?? null,
  }, { headers: CORS });
}
