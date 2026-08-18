# Supervint — Chrome Web Store listing (v1.2.13)

## Short description (max 132 chars)
Vinted price alerts with an AI assistant — auto-create snipes, see real sold prices, and get notified the second a deal drops.

## Detailed description

**Find Vinted bargains first — with an AI assistant that builds your snipes for you.**

Supervint watches your saved Vinted searches 24/7 and alerts you the instant a new listing matches — so you grab the deal before it sells. Good listings on Vinted sell within minutes. Supervint is faster.

**What's new:**
- **AI Assistant** — describe what you're hunting in plain English ("Nike P-6000 trainers under £20 in UK size 8–10") and the AI builds the exact search, sets the price cap and filters, and starts monitoring it for you.
- **Sold-price intelligence** — see what items actually sold for, powered by a shared database of real Vinted sales. Check if that "bargain" is genuinely a flip or overpriced.
- **Instant alerts** — the second a matching listing goes live, you get notified. No bots, no ban risk, just faster than everyone else.
- **Google Sheets log** — every new find written to a spreadsheet you can check from any device.

**Why Supervint:**
- Set price caps, size, colour, condition, and brand filters
- Email alerts at your chosen price threshold
- Runs while Chrome is open — no Vinted tab needed
- Simple, fast, and reliable

**Plans:** Free to start (1 search). Every new account gets 7 days of Power Seller free, no card required. Upgrade to Reseller (£6.99/mo) or Power Seller (£13.99/mo) for more searches, higher alert limits, and Google Sheets logging.

Supervint is an alert-only tool — it never buys, bids, or checks out on your behalf, and never accesses your Vinted password or login details. It uses your existing logged-in Vinted session, the same way a normal visit to Vinted would.

## Privacy practices justifications (paste both on the Privacy tab)

**Offscreen:**
The offscreen document keeps Supervint's background service worker alive so that scheduled search monitoring runs reliably. Chrome suspends service workers after 30 seconds of idle time, which would interrupt the extension's timed checks and delay alerts for users. The offscreen document contains no user interface and processes no user data; it only sends a lightweight keep-alive signal to the service worker to keep monitoring on schedule. No user data is collected, stored, or transmitted by the offscreen document.

**Scripting:**
This permission is used to inject Supervint's content script into Vinted tabs that were already open when the extension was installed or updated. Chrome only auto-injects content scripts on freshly loaded pages, so tabs that predate the install would otherwise be missing the script. The content script is required for Supervint's core feature: it lets the extension read the user's saved Vinted searches and detect new matching listings so the user receives alerts. The script runs only on Vinted domains, reads no personal data, and does not modify or upload any page content. It contains no user interface and processes no user data.

## Data collected (declare in the Privacy practices tab)
- **Personal information** (email address — for email alerts + account recovery)
- **User activity / browsing** (the search terms you configure and the listings Supervint finds; sold-order item titles and prices, anonymised, contributed to the shared sold-price database)
- No buyer usernames, no messages, no payment info, no Vinted credentials.
