import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// POST /api/admin/broadcast — send a one-off announcement email to a list of
// addresses using the production Resend key (never exposed client-side).
// Body: { to: string[], subject: string, html: string }
// Admin-only. Used for the occasional "what's new" update email.
export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const to      = Array.isArray(body?.to) ? body.to.map(String).filter(Boolean) : [];
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const html    = typeof body?.html    === 'string' ? body.html.trim()    : '';

  if (to.length === 0 || !subject || !html) {
    return NextResponse.json({ error: 'to[], subject and html are required.' }, { status: 400 });
  }
  if (to.length > 50) {
    return NextResponse.json({ error: 'Max 50 recipients per broadcast.' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const results = [];
  let ok = 0;
  for (const addr of to) {
    try {
      await resend.emails.send({
        from:    'Supervint <alerts@supervint.com>',
        to:      addr,
        subject,
        html,
      });
      results.push({ addr, ok: true });
      ok++;
    } catch (err) {
      results.push({ addr, ok: false, error: err?.message });
    }
  }

  return NextResponse.json({ ok: ok > 0, sent: ok, failed: to.length - ok, results });
}
