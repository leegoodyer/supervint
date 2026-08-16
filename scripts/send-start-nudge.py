#!/usr/bin/env python3
"""Send 'don't forget to press Start' nudge to Supervint users who created
searches but never started monitoring. Uses the Resend API (alerts@supervint.com)."""
import json, os, sys, time, urllib.request, urllib.error

RESEND_KEY = os.environ.get("RESEND_API_KEY", "")
FROM = "Supervint <alerts@supervint.com>"

# (email, first search label, search count) — from admin data, real users only
USERS = [
    ("gnkelly73@gmail.com", "Leather Jackets", 1),
    ("vinco1975@libero.it", "Filosofia", 1),
    ("rluca1540@gmail.com", "pokemon", 1),
    ("matthisdespiegelaere2012@gmail.com", "Nike Tech", 1),
    ("mallickcrpo.o.n.am.o.b@gmail.com", "house", 1),
    ("kevinmuresan540@gmail.com", "Ralph lauren", 1),
    ("quackobear09@gmail.com", "Iphone 12", 4),
    ("wakelyoscar@gmail.com", "Zelda Wind Waker", 1),
]

def send(email, label, count):
    subject = "Don't forget to press Start 👀"
    html = f"""<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
    <span style="font-size:22px">⚡</span>
    <span style="font-size:20px;font-weight:700;color:#007782">Supervint</span>
  </div>
  <p style="font-size:15px;line-height:1.6">Hi there 👋</p>
  <p style="font-size:15px;line-height:1.6">We noticed you set up <strong>{count} search{'' if count == 1 else 'es'}</strong>{" — <em>" + label + "</em>" if count == 1 else ""} — but it hasn't started watching Vinted yet.</p>
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
</div>"""
    body = json.dumps({
        "from": FROM,
        "to": [email],
        "subject": subject,
        "html": html,
    }).encode()
    req = urllib.request.Request("https://api.resend.com/emails",
        data=body, headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            out = json.loads(resp.read())
            print(f"  ✓ {email} ({label}) → id={out.get('id')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"  ✗ {email}: HTTP {e.code} {e.read().decode()[:120]}")
        return False
    except Exception as e:
        print(f"  ✗ {email}: {str(e)[:100]}")
        return False

def main():
    key = RESEND_KEY or sys.argv[1] if len(sys.argv) > 1 else ""
    if not key:
        print("Need RESEND_API_KEY (env or argv)")
        sys.exit(1)
    print(f"Sending to {len(USERS)} users via Resend...")
    ok = 0
    for email, label, count in USERS:
        if send(email, label, count):
            ok += 1
        time.sleep(1.2)  # gentle pacing
    print(f"\nDone: {ok}/{len(USERS)} sent")

if __name__ == "__main__":
    main()
