import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// Uses KEYS + MGET — fine for small user counts.
// TODO: when user count grows, maintain a sorted set index instead:
//   ZADD sv:users <timestamp> <clientId>  (add to status/route.js on record creation)
//   ZREVRANGE sv:users 0 -1 here          (non-blocking, supports LIMIT pagination)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const keys = await kv.keys('sv:sub:*');

  if (keys.length === 0) {
    return NextResponse.json({ users: [], total: 0 });
  }

  const records = await kv.mget(...keys);
  const now     = Date.now();

  // Fetch install attribution for each user (sv:attrib:<clientId>) so the
  // admin panel can show where each signup/install came from.
  const attribKeys = keys.map(k => `sv:attrib:${k.replace('sv:sub:', '')}`);
  const attribs    = await kv.mget(...attribKeys);

  // Also fetch install metadata (sv:install:<clientId>) which carries the
  // country from Vercel's geo header — a second, independent source signal
  // that works even when the attribution cookie/referrer never fired.
  const installKeys = keys.map(k => `sv:install:${k.replace('sv:sub:', '')}`);
  const installs    = await kv.mget(...installKeys);

  const users = keys
    .map((key, i) => {
      const record = records[i];
      if (!record) return null;
      const clientId     = key.replace('sv:sub:', '');
      const plan         = normalizePlan(record.plan);
      const trialDaysLeft = (plan === 'trial' && record.trialExpiresAt)
        ? Math.max(0, Math.ceil((record.trialExpiresAt - now) / 86_400_000))
        : null;

      // Merge attribution (referrer/UTM/source) with install country so the
      // admin panel has a single, complete "where did they come from" picture.
      const attrib   = attribs[i]   ?? null;
      const install  = installs[i]  ?? null;
      let mergedAttrib = attrib;
      if (install && typeof install === 'object' && install.country) {
        mergedAttrib = { ...(attrib && typeof attrib === 'object' ? attrib : {}), country: install.country };
      }

      return {
        clientId,
        plan,
        email:           record.email           ?? null,
        trialExpiresAt:  record.trialExpiresAt  ?? null,
        trialDaysLeft,
        customerId:      record.customerId       ?? null,
        subscriptionId:  record.subscriptionId   ?? null,
        adminGrantedAt:  record.adminGrantedAt   ?? null,
        createdAt:       record.trialStart       ?? record.updatedAt ?? null,
        updatedAt:       record.updatedAt        ?? null,
        attribution:     mergedAttrib            ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return NextResponse.json({ users, total: users.length });
}
