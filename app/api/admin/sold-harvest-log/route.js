import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// TEMPORARY debug endpoint — lets the extension report harvest diagnostics
// so the agent can read them via GET (no console access to Lee's Chrome).
// REMOVE after the sold-history harvest is verified. 2026-08-17.

const kv = Redis.fromEnv();

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    await kv.set('sv:debug:harvest', { ...body, ts: Date.now() }, { ex: 3600 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const d = await kv.get('sv:debug:harvest');
  return NextResponse.json(d || { none: true });
}
