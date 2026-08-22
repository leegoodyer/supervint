import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import { normalizePlan, PLANS } from '@/lib/plans';

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

  // Live usage: every active extension pings sv:heartbeat:<clientId> on a
  // keepalive interval — this tells us who is actually USING the plugin now.
  const heartbeatKeys = keys.map(k => `sv:heartbeat:${k.replace('sv:sub:', '')}`);
  const heartbeats    = await kv.mget(...heartbeatKeys);

  // Server-side search backup: sv:searches:<clientId> holds full search
  // definitions WITH labels. The heartbeat only carries ids for Store builds,
  // so merge labels from here to show what each user is searching for.
  const serverSearchKeys = keys.map(k => `sv:searches:${k.replace('sv:sub:', '')}`);
  const serverSearches   = await kv.mget(...serverSearchKeys);

  // Feature-usage telemetry: sv:usage:client:<clientId> is a hash of
  // event -> count (panel_opened, search_my_items, sold_search, ...).
  // Merge it into each user row so the admin panel can show "who used what".
  // NOTE: hashes must be read with hgetall — mget on a hash key returns
  // nothing (the bug that made the admin panel show usage:null).
  const usageKeys = keys.map(k => `sv:usage:client:${k.replace('sv:sub:', '')}`);
  const usageHashes = [];
  for (const uk of usageKeys) {
    usageHashes.push(await kv.hgetall(uk));
  }

  // AI assistant usage: the help-chat route stores a per-day counter at
  // sv:helpchat:<clientId>:<YYYY-MM-DD> (UTC) and caps it per plan. Read the
  // current day's count so the admin panel can show "AI used today / cap".
  const today = new Date().toISOString().slice(0, 10);
  const aiKeys = keys.map(k => `sv:helpchat:${k.replace('sv:sub:', '')}:${today}`);
  const aiUsed  = await kv.mget(...aiKeys);

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
        // Live usage from heartbeat (null = never pinged / not running)
        lastSeenAt:      heartbeats[i]?.at      ?? null,
        lastPollResult:  heartbeats[i]?.lastPollResult ?? null,
        searchCount:     Array.isArray(heartbeats[i]?.searches) ? heartbeats[i].searches.length : null,
        searches:        (() => {
          const hb = heartbeats[i]?.searches;
          const sv = serverSearches[i]?.searches;
          // The heartbeat is the LIVE truth (enabled + poll state, sent every
          // few minutes). The server backup (sv:searches) has full definitions
          // WITH labels but can be STALE (enabled false from an old sync) — so
          // labels come from the backup, live state comes from the heartbeat.
          const svById = new Map((Array.isArray(sv) ? sv : []).map(s => [String(s?.id), s]));
          const hbById = new Map((Array.isArray(hb) ? hb : []).map(s => [String(s?.id), s]));
          const allIds = [...new Set([...svById.keys(), ...hbById.keys()])];
          if (allIds.length === 0) return null;
          return allIds.map(id => {
            const b = svById.get(id) || {};
            const h = hbById.get(id) || {};
            return {
              id: id,
              label: b.label || h.label || '',
              // Live state wins — heartbeat is authoritative for enabled/polls.
              enabled: h.enabled !== undefined ? !!h.enabled : !!b.enabled,
              lastPollTime: h.lastPollTime ?? b.lastPollTime ?? null,
              lastPollResult: h.lastPollResult ?? b.lastPollResult ?? null,
              // Search health diagnostics (trackedItemCount = how many items the
              // search actually returns; newItemsLastCount = how many were new
              // last poll). These settle "is this search finding anything?" at a
              // glance instead of guessing from a bare no_new/new_items result.
              trackedItemCount:  h.trackedItemCount  ?? b.trackedItemCount  ?? null,
              newItemsLastCount: h.newItemsLastCount ?? b.newItemsLastCount ?? null,
              // Active hours + baseline (heartbeat now sends them; the server
              // backup is the fallback for older builds).
              activeHoursStart: h.activeHoursStart ?? b.activeHoursStart ?? null,
              activeHoursEnd:   h.activeHoursEnd   ?? b.activeHoursEnd   ?? null,
              needsBaseline:    h.needsBaseline    ?? b.needsBaseline    ?? false,
            };
          });
        })(),
        // Feature usage: event -> count hash (panel_opened, sold_search, ...).
        // Null/empty = no tracked usage yet.
        usage:           (usageHashes[i] && Object.keys(usageHashes[i]).length > 0) ? usageHashes[i] : null,
        // AI assistant usage: { used, daily } — used is today's UTC count from
        // the help-chat counter, daily is the plan cap (0 for free).
        aiUsage: {
          used:  Number(aiUsed[i]) || 0,
          daily: PLANS[plan]?.aiDaily ?? 0,
        },
        // Version: heartbeat is live (updated every poll). Fall back to the
        // install record for users who never started a search — they never
        // send heartbeats, so sv:install:<clientId>.version is the only
        // signal we have for what build they're on.
        version:         heartbeats[i]?.version
                      ?? (installs[i] && typeof installs[i] === 'object' ? installs[i].version : null)
                      ?? null,
        offscreenAlive:  typeof heartbeats[i]?.offscreenPingAgoMs === 'number'
          ? heartbeats[i].offscreenPingAgoMs < 120_000
          : null,
        active24h:       heartbeats[i]?.at ? (now - heartbeats[i].at) < 86_400_000 : false,
        active7d:        heartbeats[i]?.at ? (now - heartbeats[i].at) < 7 * 86_400_000 : false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return NextResponse.json({ users, total: users.length });
}
