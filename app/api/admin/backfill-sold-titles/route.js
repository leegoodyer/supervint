import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// POST /api/admin/backfill-sold-titles
// One-time repair: rebuild sv:sold:titles (the live-prefix-search index) from
// existing sv:sold:item:* records. The index was introduced AFTER the sold DB
// was populated, so old records have no title entries — this re-adds them so
// "l" -> "le" -> "lego" prefix search works over ALL history, not just new
// posts. Idempotent: zadd overwrites same member.
export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: CORS });
  }

  let cursor = '0';
  let keys = [];
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'sv:sold:item:*', count: 500 });
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');

  let added = 0;
  for (let i = 0; i < keys.length; i += 100) {
    const batch = keys.slice(i, i + 100);
    const records = await kv.mget(...batch);
    const pipe = kv.pipeline();
    let n = 0;
    for (let j = 0; j < batch.length; j++) {
      const rec = records[j];
      if (!rec || !rec.title) continue;
      const itemId = batch[j].replace('sv:sold:item:', '');
      pipe.zadd('sv:sold:titles', { score: Number(rec.soldAt) || 0, member: `${String(rec.title).toLowerCase()}||${itemId}` });
      n++;
    }
    if (n > 0) await pipe.exec();
    added += n;
  }

  return NextResponse.json({ ok: true, scanned: keys.length, added }, { headers: CORS });
}
