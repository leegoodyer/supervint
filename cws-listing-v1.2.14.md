# Supervint — Chrome Web Store listing (v1.2.14 / Empire tier)

## Short description (max 132 chars)
Vinted price alerts with an AI assistant — build snipes in plain English, see real sold prices, get notified the instant a deal drops.

## Detailed description

**Supervint watches your Vinted searches around the clock and notifies you the instant a new listing appears.** While you're working, sleeping, or away from your screen, Supervint is checking — so you see the best listings before anyone else does.

**HOW IT WORKS**

1. Go to Vinted and set your filters — size, condition, price range, brand, colour. Copy the URL from the address bar.
2. Paste it into Supervint, give it a name, and switch it on.
3. Supervint runs quietly in the background and fires a desktop notification the moment something matches. Click it and you're straight on the listing.

Or skip the filters entirely — tell the built-in AI assistant what you're after in plain English ("Nike P-6000 trainers under £20 in UK size 8–10") and it builds the search, sets the price cap and filters, and starts watching for you.

**FEATURES**

• **AI search builder** — describe it in plain language, Supervint turns it into a live, monitored search
• **Sold-price intelligence** — see what items actually sold for on Vinted, so you know a genuine bargain from a trap
• Run multiple searches simultaneously — watch trainers, jackets, vintage gear, anything you're hunting, all at once
• Instant desktop notifications with photo and price the moment a listing goes live
• Search your own listings — type a keyword to find any item in your own closet instantly, no scrolling
• Email price alerts — set a lower "urgent" price per search and get emailed only when something exceptionally cheap appears
• Google Sheets logging — every match written automatically to a spreadsheet you own, accessible from any device
• Active hours — tell Supervint when to check, and when not to
• Transparent — if a search pauses for any reason, you'll see exactly why in the popup, never just silence

**PLANS**

- **Free** — 5 active searches, desktop alerts, search your own listings
- **Trial (7 days, starts automatically)** — 50 searches, email alerts, sold prices, AI assistant, Sheets — the full experience, no card required
- **Reseller** — 50 searches, email alerts, sold prices, AI assistant, Sheets — £6.99/month
- **Power Seller** — 100 searches, everything included — £13.99/month
- **Empire** — 200 searches, built for high-volume sellers — £24.99/month

Subscriptions are handled via Stripe. Upgrade, downgrade, or cancel at any time from within the extension.

Free users may optionally provide an email address inside the extension — used only for account recovery and occasional updates, never required to use the extension.

**PRIVACY**

Supervint fetches Vinted search results directly from Vinted's public catalogue — the same data your browser loads when you search normally. It does not log in to Vinted on your behalf, does not store your Vinted credentials, and does not post, bid, or buy on your account. Your search configurations are stored locally on your device. The optional Google Sheets feature connects only to a spreadsheet Supervint itself creates in your own Drive — no other Drive files are accessed.

To power sold-price insights, Supervint reads your own Vinted sold-order history (item titles and sale prices only) using your existing logged-in session, and contributes this to an anonymised shared database of sale prices that helps all users spot real bargains. No buyer usernames, messages, or payment details are collected or stored.

## Privacy practices justifications (paste both on the Privacy tab)

**Offscreen:**
The offscreen document keeps Supervint's background service worker alive so that scheduled search monitoring runs reliably. Chrome suspends service workers after 30 seconds of idle time, which would interrupt the extension's timed checks and delay alerts for users. The offscreen document contains no user interface and processes no user data; it only sends a lightweight keep-alive signal to the service worker to keep monitoring on schedule. No user data is collected, stored, or transmitted by the offscreen document.

**Scripting:**
This permission is used to inject Supervint's content script into Vinted tabs that were already open when the extension was installed or updated. Chrome only auto-injects content scripts on freshly loaded pages, so tabs that predate the install would otherwise be missing the script. The content script is required for Supervint's core feature: it lets the extension read the user's saved Vinted searches and detect new matching listings so the user receives alerts. The script runs only on Vinted domains, reads no personal data, and does not modify or upload any page content. It contains no user interface and processes no user data.

## Data collected (declare in the Privacy practices tab)
- **Personal information** (email address — for email alerts + account recovery)
- **User activity / browsing** (the search terms you configure and the listings Supervint finds; sold-order item titles and prices, anonymised, contributed to the shared sold-price database)
- No buyer usernames, no messages, no payment info, no Vinted credentials.
