'use client';

import { useState, useMemo } from 'react';

// Help Hub interactive bits: live search over guides + FAQ accordions.
// Guides data is passed in from the server component so the page still gets
// full SSG/indexing — this just adds client-side filtering on top.
export default function HelpHubClient({ guides, deepDives = [] }) {
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((g) => {
      const haystack = [g.title, g.meta_description, g.intro, g.pillar_page_anchor_text]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, guides]);

  return (
    <>
      {/* Search bar */}
      <div className="help-search">
        <input
          type="search"
          placeholder="Search help… e.g. contact Vinted, delivery, scam, Nike alerts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search help articles"
        />
        {query && (
          <span className="help-search-count">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Quick categories — the questions users actually ask */}
      <div className="help-topics">
        <a href="/guides/how-to-contact-vinted-support" className="help-topic">
          <span className="help-topic-ico">✉️</span>
          <strong>Contact Vinted</strong>
          <span>Phone, email, response times &amp; what actually works</span>
        </a>
        <a href="/guides/vinted-delivery-issues-troubleshooting" className="help-topic">
          <span className="help-topic-ico">📦</span>
          <strong>Delivery issues</strong>
          <span>Not arrived, lost parcel, &quot;delivered&quot; but missing</span>
        </a>
        <a href="/guides/vinted-scams-buyer-protection" className="help-topic">
          <span className="help-topic-ico">🛡️</span>
          <strong>Scams &amp; safety</strong>
          <span>Buyer protection, fake items, how to report</span>
        </a>
        <a href="#alerts" className="help-topic">
          <span className="help-topic-ico">⚡</span>
          <strong>Alerts &amp; guides</strong>
          <span>Brand guides, price alerts, reseller tactics</span>
        </a>
      </div>

      {/* Deep-dive articles — the big organic-traffic sections */}
      {deepDives.length > 0 && (
        <section className="help-section" id="top-articles">
          <h2>In-depth help articles</h2>
          <div className="help-deepdives">
            {deepDives.map((d) => (
              <a key={d.slug} href={`/guides/${d.slug}`} className="help-deep">
                <span className="help-topic-ico">{d.ico}</span>
                <strong>{d.title}</strong>
                <span>{d.desc}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ accordion — quick answers without leaving the page */}
      <section className="help-section" id="faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-acc">
          {FAQ_ITEMS.map((item, i) => (
            <div className={`faq-acc-item ${openFaq === i ? 'open' : ''}`} key={i}>
              <button
                className="faq-acc-q"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {item.q}
                <span className="faq-acc-caret">▾</span>
              </button>
              {openFaq === i && <div className="faq-acc-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Searchable guide grid */}
      <section className="help-section" id="alerts">
        <h2>All guides</h2>
        {results.length === 0 ? (
          <p className="help-empty">No guides match &quot;{query}&quot; — try &quot;alerts&quot;, a brand name, or &quot;Vinted&quot;.</p>
        ) : (
          <div className="guide-card-grid">
            {results.map((g) => (
              <a key={g.slug} href={`/guides/${g.slug}`} className="guide-card">
                <h3>{g.title}</h3>
                <p>{g.meta_description || g.intro}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const FAQ_ITEMS = [
  {
    q: 'How do I contact Vinted support?',
    a: 'Vinted has no phone number. Support is reached through the in-app Help Centre (Vinted app → Profile → Help) or the Contact us form at vinted.com/help. Response times are typically 1-5 business days. For order issues, always open the order and press "I have an issue" — that routes your case to the right team with the order attached.',
  },
  {
    q: 'My item says delivered but I never received it. What do I do?',
    a: 'Open the order and report the problem within 2 days of it being marked delivered — Vinted\'s Buyer Protection only covers issues reported in that window. Press "I have an issue" → "I haven\'t received it" and follow the prompts. Keep the tracking number from your parcel carrier handy.',
  },
  {
    q: 'What does Vinted Buyer Protection cover?',
    a: 'Buyer Protection refunds you if an item never arrives or arrives damaged/not as described, provided you report it within 2 days of delivery. Shipping costs for returns may still be your responsibility depending on the case. Report issues through the order page, never outside Vinted.',
  },
  {
    q: 'How do I spot a Vinted scam?',
    a: 'Common red flags: sellers asking to pay outside Vinted (bank transfer, PayPal "friends"), prices far below market value, stock-photo listings, and messages pushing you to a third-party website. Keep all payment and communication inside Vinted — that\'s what makes Buyer Protection apply.',
  },
  {
    q: 'How does Supervint alert me to new listings?',
    a: 'Supervint is a Chrome extension that watches your saved Vinted searches in the background and sends a desktop or email alert the instant a new matching listing appears. It\'s alert-only — it never logs into your Vinted account, never auto-buys, and carries no ban risk.',
  },
  {
    q: 'Can I get alerts for a specific brand or item?',
    a: 'Yes — build a search on Vinted for anything (brand, model, size, price range), copy the URL, and add it to Supervint. There are also dedicated guides for popular brands like Nike, Adidas, Dr. Martens, Patagonia, Barbour and Arc\'teryx below.',
  },
];
