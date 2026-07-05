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
  console.log('[account/email] request', { clientId, email, recordFound: !!record });
  if (!record) {
    return NextResponse.json({ error: 'Unknown clientId' }, { status: 404, headers: CORS });
  }

  // This email may already belong to a different clientId — e.g. the extension
  // was uninstalled and reinstalled, generating a fresh clientId, and the user
  // is re-entering the email tied to their existing plan. Without this check,
  // that existing account gets orphaned and a brand new trial takes its place
  // under the new clientId (the exact reinstall-abuse case this field was
  // meant to prevent). Migrate the existing plan onto the new clientId instead.
  const existingClientId = await kv.get(`sv:email:${email}`);
  console.log('[account/email] merge check', {
    submittedClientId: clientId,
    submittedEmail:     email,
    emailIndexLookup:   existingClientId ?? null,
    wouldMerge:         !!(existingClientId && existingClientId !== clientId),
  });
  if (existingClientId && existingClientId !== clientId) {
    const existingRecord = await kv.get(`sv:sub:${existingClientId}`);
    console.log('[account/email] existing record for merge candidate', {
      existingClientId,
      found: !!existingRecord,
      existingPlan: existingRecord?.plan ?? null,
    });
    if (existingRecord) {
      const merged = { ...existingRecord, email, updatedAt: Date.now() };
      // Migrate the old clientId's saved searches too — otherwise plan
      // recovery works but the actual search list is still lost on reinstall
      // (see project memory on the search-persistence build). The new
      // clientId shouldn't have any searches of its own yet: creating a
      // search now requires an email on file for free/trial, and having a
      // matching email is exactly what triggers this merge — so there's
      // nothing to reconcile, just overwrite.
      const existingSearches = await kv.get(`sv:searches:${existingClientId}`);
      await Promise.all([
        kv.set(key, merged),
        kv.set(`sv:email:${email}`, clientId),
        kv.set(`sv:deleted:${existingClientId}`, { ...existingRecord, mergedInto: clientId, deletedAt: Date.now() }),
        kv.del(`sv:sub:${existingClientId}`),
        existingRecord.customerId ? kv.set(`sv:customer:${existingRecord.customerId}`, clientId) : Promise.resolve(),
        existingSearches ? kv.set(`sv:searches:${clientId}`, existingSearches) : Promise.resolve(),
        existingSearches ? kv.del(`sv:searches:${existingClientId}`) : Promise.resolve(),
      ]);
      return NextResponse.json({ ok: true, merged: true, searches: existingSearches?.searches ?? [] }, { headers: CORS });
    }
    // sv:email pointed at a clientId with no live record (stale index) — fall
    // through to the normal path below.
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
