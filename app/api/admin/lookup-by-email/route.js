import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan } from '@/lib/plans';

export const runtime = 'nodejs';

const kv      = Redis.fromEnv();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const clientId = await kv.get(`sv:email:${email}`);
  if (!clientId) {
    return NextResponse.json({ found: false });
  }

  const record = await kv.get(`sv:sub:${clientId}`);
  if (!record) {
    return NextResponse.json({ found: false });
  }

  const plan          = normalizePlan(record.plan);
  const now           = Date.now();
  const trialDaysLeft = (plan === 'trial' && record.trialExpiresAt)
    ? Math.max(0, Math.ceil((record.trialExpiresAt - now) / 86_400_000))
    : null;

  return NextResponse.json({
    found:          true,
    clientId,
    plan,
    email:          record.email           ?? null,
    trialExpiresAt: record.trialExpiresAt  ?? null,
    trialDaysLeft,
    customerId:     record.customerId      ?? null,
    subscriptionId: record.subscriptionId  ?? null,
    adminGrantedAt: record.adminGrantedAt  ?? null,
    createdAt:      record.trialStart      ?? record.updatedAt ?? null,
    updatedAt:      record.updatedAt       ?? null,
  });
}
