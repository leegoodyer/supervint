import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan, PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

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

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId.' }, { status: 400 });
  }
  if (!(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  // Read existing record so we can preserve Stripe IDs and createdAt.
  const existing = (await kv.get(`sv:sub:${clientId}`)) ?? {};
  const now      = Date.now();

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

  await kv.set(`sv:sub:${clientId}`, updated);

  return NextResponse.json({ ok: true, clientId, plan });
}
