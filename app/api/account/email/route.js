import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

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

  const key    = `sv:sub:${clientId}`;
  const record = await kv.get(key);
  if (!record) {
    return NextResponse.json({ error: 'Unknown clientId' }, { status: 404, headers: CORS });
  }

  // Delete old secondary index if email is changing
  const oldEmail = record.email ?? null;
  if (oldEmail && oldEmail !== email) {
    await kv.del(`sv:email:${oldEmail}`);
  }

  await Promise.all([
    kv.set(key, { ...record, email, updatedAt: Date.now() }),
    kv.set(`sv:email:${email}`, clientId),
  ]);

  return NextResponse.json({ ok: true }, { headers: CORS });
}
