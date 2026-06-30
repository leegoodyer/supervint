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

  const record = await kv.get(`sv:deleted:${clientId}`);
  if (!record) {
    return NextResponse.json({ error: 'No deleted record found for that clientId.' }, { status: 404 });
  }

  // Strip deletedAt before restoring
  const { deletedAt: _deletedAt, ...restored } = record;
  await kv.set(`sv:sub:${clientId}`, restored);

  // Remove the deleted tombstone
  await kv.del(`sv:deleted:${clientId}`);

  // Restore email index only if no other user now owns that key
  let emailIndexRestored = false;
  let emailConflict = false;
  const email = restored.email ? String(restored.email).trim().toLowerCase() : null;
  if (email) {
    const existing = await kv.get(`sv:email:${email}`);
    if (!existing) {
      await kv.set(`sv:email:${email}`, clientId);
      emailIndexRestored = true;
    } else if (existing !== clientId) {
      emailConflict = true;
    } else {
      emailIndexRestored = true;
    }
  }

  return NextResponse.json({ ok: true, emailIndexRestored, emailConflict });
}
