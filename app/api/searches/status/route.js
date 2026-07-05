import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Direct pull by the CURRENT clientId — only useful when local storage was
// cleared without a full uninstall (clientId survived). A genuine reinstall
// generates a brand new clientId that has nothing stored under itself; that
// case is recovered via the account/email merge instead, once the user
// re-enters their known email.
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
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }

  const data = await kv.get(`sv:searches:${clientId}`);
  return NextResponse.json({ searches: data?.searches ?? [] }, { headers: CORS });
}
