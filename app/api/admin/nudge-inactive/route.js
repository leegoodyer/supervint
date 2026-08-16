import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

let _resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = 'Supervint <alerts@supervint.com>';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// POST /api/admin/nudge-inactive
// Sends a "don't forget to press Start" email to users who created searches
// but never started monitoring (no heartbeat ever). Admin-only. Idempotent
// per user via sv:nudged:<clientId> so a re-run never double-sends.
export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: CORS });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: 'Email provider not configured.' }, { status: 503, headers: CORS });
  }

  const keys = await kv.keys('sv:sub:*');
  const records = await kv.mget(...keys);
  const now = Date.now();

  // Find users who created searches but have never sent a heartbeat.
  const candidates = [];
  for (let i = 0; i < keys.length; i++) {
    const record = records[i];
    if (!record) continue;
    const clientId = keys[i].replace('sv:sub:', '');
    const email = record.email;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

    const [hb, searches] = await Promise.all([
      kv.get(`sv:heartbeat:${clientId}`),
      kv.get(`sv:searches:${clientId}`),
    ]);
    const searchList = Array.isArray(searches?.searches) ? searches.searches : [];
    if (searchList.length === 0) continue;          // created nothing
    if (hb?.at) continue;                            // has polled — active

    const already = await kv.get(`sv:nudged:${clientId}`);
    if (already) continue;                           // idempotent

    candidates.push({ clientId, email, searches: searchList });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No inactive users to nudge.' }, { headers: CORS });
  }

  const results = [];
  let sent = 0;
  for (const c of candidates) {
    const first = c.searches[0];
    const label = (first?.label || '').trim() || 'your search';
    const count = c.searches.length;

    const subject = "Don't forget to press Start 👀";
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
    <span style="font-size:22px">⚡</span>
    <span style="font-size:20px;font-weight:700;color:#007782">Supervint</span>
  </div>
  <p style="font-size:15px;line-height:1.6">Hi there 👋</p>
  <p style="font-size:15px;line-height:1.6">We noticed you set up <strong>${count} search${count !== 1 ? 'es' : ''}</strong>${count === 1 ? ` — <em>${label}</em>` : ''} — but it hasn't started watching Vinted yet.</p>
  <p style="font-size:15px;line-height:1.6">One click and it'll start monitoring in the background:</p>
  <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 18px;margin:16px 0">
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#007782">How to start it</p>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.8">
      <li>Open the <strong>Supervint</strong> extension in Chrome</li>
      <li>Find your search card</li>
      <li>Press the <strong style="color:#007782">Start</strong> button</li>
    </ol>
  </div>
  <p style="font-size:15px;line-height:1.6;margin-top:18px">That's it — Supervint checks Vinted every few minutes and pings you the moment something new and relevant appears.</p>
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:16px 0">
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#92400e">💡 Get the most out of Supervint</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8">
      <li><strong>Start with the exact thing you want</strong> — the more specific your search (brand + model), the better the alerts.</li>
      <li><strong>Set a price cap</strong> in the search settings to only get alerted on bargains.</li>
      <li><strong>Use the Sold prices button</strong> on any search to see what similar items actually sold for — so you know a good price when you see one.</li>
      <li><strong>Turn on email alerts</strong> so you never miss a find even when you're away from Chrome.</li>
    </ul>
  </div>
  <p style="font-size:14px;line-height:1.6;color:#6b7280">Questions? Just reply to this email — we read everything and reply fast.</p>
  <p style="font-size:13px;color:#9ca3af;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">You're getting this because you installed Supervint. No emails unless they're useful — unsubscribe anytime by replying "stop".</p>
</div>`;

    try {
      const { data, error } = await resend.emails.send({ from: FROM, to: [c.email], subject, html });
      if (error) throw new Error(error.message || 'resend error');
      await kv.set(`sv:nudged:${c.clientId}`, { at: Date.now() });
      results.push({ email: c.email, ok: true, id: data?.id });
      sent++;
    } catch (err) {
      results.push({ email: c.email, ok: false, error: String(err.message || err).slice(0, 100) });
    }
  }

  return NextResponse.json({ ok: true, sent, total: candidates.length, results }, { headers: CORS });
}
