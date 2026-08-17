import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

const kv = Redis.fromEnv();

// Temporary admin-only helper (2026-08-17): delete ONE sold record + all its
// index entries. Used to purge 3 probe records accidentally inserted while
// probing the sold DB. Remove after use.
export async function POST(request) {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const itemId = String(body?.itemId || '');
  if (!/^\d+$/.test(itemId)) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }
  const itemKey = `sv:sold:item:${itemId}`;
  const rec = await kv.get(itemKey);
  let removed = 0;
  if (rec) {
    const pipe = kv.pipeline();
    pipe.del(itemKey);
    if (rec.keyword) pipe.hdel(`sv:sold:kw:${String(rec.keyword).toLowerCase()}`, itemId);
    if (rec.title) {
      pipe.zrem('sv:sold:titles', `${String(rec.title).toLowerCase()}||${itemId}`);
      for (const tok of tokenize(rec.title)) pipe.hdel(`sv:sold:tok:${tok}`, itemId);
    }
    pipe.zrem('sv:sold:recent', itemId);
    await pipe.exec();
    removed = 1;
  }
  return NextResponse.json({ ok: true, removed, itemId });
}

function tokenize(title) {
  return String(title || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
