import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

const kv = Redis.fromEnv();

// Admin-only sold-DB audit (2026-08-17): count records + list any with
// probe-like titles so we can confirm cleanup and that genuine sales are intact.
export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = await kv.keys('sv:sold:item:*');
  const probes = [];
  let total = 0, emptyTitle = 0, withPrice = 0;
  const CHUNK = 100;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const recs = await kv.mget(...chunk);
    for (let j = 0; j < recs.length; j++) {
      const r = recs[j];
      if (!r) continue;
      total++;
      if (!r.title) emptyTitle++;
      if (r.price > 0) withPrice++;
      const t = String(r.title || '');
      if (/probe|^z$|^q$|^probe[0-9x]?$/.test(t)) {
        const itemId = String(chunk[j]).split(':').pop();
        probes.push({ itemId, title: t, price: r.price });
      }
    }
  }
  return NextResponse.json({ ok: true, total, emptyTitle, withPrice, probeCount: probes.length, probes: probes.slice(0, 20) });
}
