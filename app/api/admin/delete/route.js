import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const clientId = (body?.clientId ?? '').trim();
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId.' }, { status: 400 });
  }

  const record = await kv.get(`sv:sub:${clientId}`);
  if (!record) {
    return NextResponse.json({ error: 'No record found for that clientId.' }, { status: 404 });
  }

  // Soft-delete: copy to sv:deleted:<clientId> with timestamp
  await kv.set(`sv:deleted:${clientId}`, { ...record, deletedAt: Date.now() });

  // Remove primary record
  await kv.del(`sv:sub:${clientId}`);

  // Remove email index only if it still points to this clientId
  let deletedEmailIndex = false;
  const email = record.email ? String(record.email).trim().toLowerCase() : null;
  if (email) {
    const indexedClientId = await kv.get(`sv:email:${email}`);
    if (indexedClientId === clientId) {
      await kv.del(`sv:email:${email}`);
      deletedEmailIndex = true;
    }
  }

  return NextResponse.json({ ok: true, deletedEmailIndex });
}
