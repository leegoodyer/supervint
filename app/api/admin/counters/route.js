import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

const kv = Redis.fromEnv();

export async function POST(request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { email } = body ?? {};
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const key   = `ec:${email.trim().toLowerCase()}:${today}`;
  await kv.del(key);
  return NextResponse.json({ ok: true, deleted: key });
}

export async function GET(request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  const globalKey = `global:${today}`;
  const globalCount = await kv.get(globalKey) ?? 0;

  let emailCount = null;
  if (email) {
    emailCount = await kv.get(`ec:${email}:${today}`) ?? 0;
  }

  return NextResponse.json({
    date:        today,
    globalCount: Number(globalCount),
    ...(email ? { email, emailCount: Number(emailCount) } : {}),
  });
}
