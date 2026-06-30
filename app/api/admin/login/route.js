import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken, verifyPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Admin panel is not configured.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!verifyPassword(body?.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expectedAdminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // No maxAge/expires — session cookie, cleared when browser closes.
  });
  return res;
}
