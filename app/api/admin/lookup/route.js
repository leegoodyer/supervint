import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

export async function GET(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = (searchParams.get('clientId') || '').trim();

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId.' }, { status: 400 });
  }

  const record = await kv.get(`sv:sub:${clientId}`);

  if (!record) {
    return NextResponse.json({ found: false });
  }

  const plan = normalizePlan(record.plan);
  const now  = Date.now();

  let trialDaysLeft = null;
  if (plan === 'trial' && record.trialExpiresAt) {
    trialDaysLeft = Math.max(0, Math.ceil((record.trialExpiresAt - now) / 86_400_000));
  }

  return NextResponse.json({
    found:          true,
    clientId,
    plan,
    trialExpiresAt: record.trialExpiresAt  ?? null,
    trialDaysLeft,
    customerId:     record.customerId      ?? null,
    subscriptionId: record.subscriptionId  ?? null,
    adminGrantedAt: record.adminGrantedAt  ?? null,
    createdAt:      record.trialStart      ?? record.updatedAt ?? null,
    updatedAt:      record.updatedAt       ?? null,
  });
}
