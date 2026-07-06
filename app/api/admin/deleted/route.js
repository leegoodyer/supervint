import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const keys = await kv.keys('sv:deleted:*');

  if (keys.length === 0) {
    return NextResponse.json({ deleted: [] });
  }

  const records = await kv.mget(...keys);

  const deleted = keys
    .map((key, i) => {
      const record = records[i];
      if (!record) return null;
      const clientId = key.replace('sv:deleted:', '');
      return {
        clientId,
        plan:       normalizePlan(record.plan),
        email:      record.email      ?? null,
        customerId: record.customerId ?? null,
        mergedInto: record.mergedInto ?? null,
        deletedAt:  record.deletedAt  ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

  return NextResponse.json({ deleted });
}
