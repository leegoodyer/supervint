'use client';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I see sold prices on Vinted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Vinted doesn't show sold prices. Supervint's crowd-sourced sold-price database shows what similar items actually sold for, so you know a fair price before you buy or list.",
      },
    },
    {
      '@type': 'Question',
      name: 'Will Supervint get my Vinted account banned?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Supervint is alert-only — it never logs into your Vinted account, never auto-buys, and never takes any automated action. You always buy manually.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Supervint free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — free to install with 5 active searches and desktop alerts. Every new account also gets 7 days of Trial free, with no card required. Upgrade to Reseller (£6.99/month), Power Seller (£13.99/month) or Empire (£24.99/month) for more searches and extra tools.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Supervint auto-buy items for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Supervint only notifies you. You review the listing and buy it yourself on Vinted — no automated buying, posting, or account actions are ever involved.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I search my own Vinted listings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Supervint lets you search your own listings by keyword, so you can spot what\u2019s underpriced, what\u2019s not moving, and what to re-price — without scrolling your whole wardrobe.',
      },
    },
    {
      '@type': 'Question',
      name: 'What\u2019s the difference between Supervint and Vinted\u2019s own favourites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vinted favourites notify you when a favourited item drops 5%+. Supervint alerts you the moment a brand-new matching listing goes live — before it\u2019s gone.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a Vinted tab open for it to work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. As long as Chrome is open and you\u2019re signed in to Vinted, Supervint checks your searches in the background on its own — no Vinted tab needed. The only requirements: Chrome open, signed in to Vinted, and your computer not asleep.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Supervint is a desktop Chrome extension for Mac and Windows. Alerts also arrive by email, so you can act from your phone the moment a deal drops.',
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="nav">
        <div className="nav-inner">
          <a href="/" className="logo"><span className="logo-mark"></span>Supervint</a>
          <div className="nav-right">
            <nav className="nav-links">
              <a href="/help">Help</a>
              <a href="/guides">Guides</a>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <a
              href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo"
              className="btn btn-primary btn-sm"
              onClick={() => fbq('track', 'Lead', { content_name: 'Chrome Web Store Click' })}
            >
              Get Supervint
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Sold prices · Instant alerts · Search your own listings</p>
        <h1>Find out what it actually sold for — <span className="hero-accent">before you buy.</span></h1>
        <p className="hero-kw">Supervint shows you the real sold price of any Vinted item, then fires an instant desktop alert the second a matching listing goes live — so you know a genuine bargain from a listing that just looks cheap.</p>
        <p className="hero-sub">Vinted hides sold prices. We built the database. And while other buyers are still scrolling, you&apos;re already on the listing.</p>
        <a
          href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo"
          className="btn btn-primary btn-lg"
          onClick={() => fbq('track', 'Lead', { content_name: 'Hero CTA Click' })}
        >
          Add Supervint to Chrome — it&apos;s free
        </a>
        <p className="hero-fine">No credit card required · Set up in 2 minutes · Alert-only — never logs into your Vinted account</p>

        <div className="mock-app">
          <div className="mock-app-head">
            <span className="m-brand">Supervint</span>
            <span className="m-count">Sold prices</span>
          </div>
          <div className="mock-app-body">
            <div className="mock-sold-head">What it actually went for</div>
            <div className="mock-sold-item"><span className="mock-sold-thumb">🧥</span><span className="mock-sold-title">Carhartt WIP Detroit Jacket · M</span><span className="mock-sold-price">£48</span></div>
            <div className="mock-sold-item"><span className="mock-sold-thumb">👟</span><span className="mock-sold-title">Nike P-6000 · UK 9</span><span className="mock-sold-price">£32</span></div>
            <div className="mock-sold-item"><span className="mock-sold-thumb">🧸</span><span className="mock-sold-title">Lego Star Wars set</span><span className="mock-sold-price">£4.50</span></div>
            <div className="mock-sold-item"><span className="mock-sold-thumb">🧥</span><span className="mock-sold-title">Barbour Wax Jacket</span><span className="mock-sold-price">£38</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Trusted by resellers">
        <div className="trust-strip-inner">
          <span className="trust-item"><strong>5.0</strong> ★ rated by resellers on the Chrome Web Store</span>
          <span className="trust-sep">·</span>
          <span className="trust-item">Alert-only — <strong>never logs into your Vinted account</strong></span>
          <span className="trust-sep">·</span>
          <span className="trust-item"><strong>No auto-buy, no ban risk</strong></span>
          <span className="trust-sep">·</span>
          <span className="trust-item"><strong>Free</strong> to start</span>
        </div>
      </section>

      <section className="section-alt">
        <div className="sec-head">
          <p className="eyebrow">Why Supervint</p>
          <h2>The reseller&apos;s edge, all in one place.</h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Know what it sold for</h3>
            <p>Asking price is a guess. Sold price is the truth. See what identical items actually went for — so you never overpay and you know exactly what to list it at.</p>
          </div>
          <div className="feature-card">
            <h3>Get there first</h3>
            <p>Supervint watches your searches 24/7 and alerts you the instant a matching listing goes live. Good listings sell in minutes — you&apos;ll be on it in seconds.</p>
          </div>
          <div className="feature-card">
            <h3>Search your own listings</h3>
            <p>Got hundreds of items up? Type a keyword and find the one you&apos;re after in a second. No more scrolling your whole wardrobe to locate a single jacket.</p>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="sec-head">
          <p className="eyebrow">Setup</p>
          <h2>Set it once. Let it snipe.</h2>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-no">1</span>
            <h3>Paste a search — or just describe it</h3>
            <p>Search Vinted like you normally would and copy the link, or tell the AI what you&apos;re hunting in plain English — &ldquo;Nike Dunks under £40, size 8&rdquo; — and it builds the search for you.</p>
          </div>
          <div className="how-step">
            <span className="how-no">2</span>
            <h3>Name it, set your alert</h3>
            <p>Give it a label, pick the hours you want it checking, and set a &ldquo;steal price&rdquo; if you want an email when something drops below a threshold. Everything else runs itself.</p>
          </div>
          <div className="how-step">
            <span className="how-no">3</span>
            <h3>Get on with your day</h3>
            <p>Supervint works in the background while you do literally anything else. When a match goes live you get a desktop alert with the photo and price — click it and you&apos;re on the listing.</p>
          </div>
        </div>
      </section>

      <section id="features" className="section-alt">
        <div className="sec-head">
          <p className="eyebrow">What Supervint does</p>
          <h2>Know the real price. Then get there first.</h2>
        </div>

        <div className="showcase">
          <div className="showcase-copy">
            <h3>See what it actually sold for.</h3>
            <p>
              Vinted doesn&apos;t publish sold prices — so most buyers are guessing. Supervint shows what
              identical items really went for, so you can <a href="/guides/how-to-see-sold-prices-on-vinted">see how much similar items sold for</a> before you buy.
            </p>
            <ul>
              <li>Real sale prices, not asking prices</li>
              <li>Average sold price for the exact item you&apos;re hunting</li>
              <li>Spot flips instantly — buy low, sell at true market value</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <div className="mock-app">
              <div className="mock-app-head">
                <span className="m-brand">Supervint</span>
                <span className="m-count">Sold prices</span>
              </div>
              <div className="mock-app-body">
                <div className="mock-sold-head">What it actually went for</div>
                <div className="mock-sold-item"><span className="mock-sold-thumb">🧥</span><span className="mock-sold-title">Carhartt WIP Detroit Jacket · M</span><span className="mock-sold-price">£48</span></div>
                <div className="mock-sold-item"><span className="mock-sold-thumb">👟</span><span className="mock-sold-title">Nike P-6000 · UK 9</span><span className="mock-sold-price">£32</span></div>
                <div className="mock-sold-item"><span className="mock-sold-thumb">🧸</span><span className="mock-sold-title">Lego Star Wars set</span><span className="mock-sold-price">£4.50</span></div>
                <div className="mock-sold-item"><span className="mock-sold-thumb">🧥</span><span className="mock-sold-title">Barbour Wax Jacket</span><span className="mock-sold-price">£38</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase reverse">
          <div className="showcase-copy">
            <h3>Get alerted the second your grail goes live.</h3>
            <p>
              Supervint watches every search you set — 24/7, in the background — and fires a desktop
              notification the moment a matching listing appears. While other buyers are still
              refreshing, you&apos;re already on the listing. That&apos;s <a href="/guides/vinted-price-alert">how Vinted price alerts work</a>.
            </p>
            <ul>
              <li>Instant desktop alert with the photo and price</li>
              <li>Email &ldquo;steal price&rdquo; alerts when something drops below your threshold</li>
              <li>Watch trainers, jackets, consoles — all at once</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <div className="mock-app">
              <div className="mock-app-head">
                <span className="m-brand">Supervint</span>
                <span className="m-count">5 searches · 3 new</span>
              </div>
              <div className="mock-app-body">
                <div className="mock-search"><span className="mock-dot active"></span><span className="mock-search-label">Nike trainers UK 9</span><span className="mock-tag new">3 new</span></div>
                <div className="mock-search"><span className="mock-dot active"></span><span className="mock-search-label">Carhartt jacket M</span><span className="mock-tag new">1 new</span></div>
                <div className="mock-search"><span className="mock-dot active"></span><span className="mock-search-label">N64 console</span><span className="mock-tag watching">watching</span></div>
                <div className="mock-search"><span className="mock-dot hibernating"></span><span className="mock-search-label">Vintage Levi&apos;s denim</span><span className="mock-tag watching">hibernating</span></div>
                <div className="mock-notif">
                  <span className="mock-notif-thumb">🔔</span>
                  <span className="mock-notif-body">
                    <span className="mock-notif-title">New listing — Carhartt WIP Detroit Jacket</span>
                    <span className="mock-notif-sub">£48 · Medium · just now</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase">
          <div className="showcase-copy">
            <h3>Find any item in your own closet, instantly.</h3>
            <p>
              Got hundreds of items listed? Type a keyword and Supervint finds the one you&apos;re after
              in a second — no more scrolling your whole wardrobe to locate a single jacket.
            </p>
            <ul>
              <li>Keyword search across your entire listing history</li>
              <li>Built for high-volume sellers with hundreds of items</li>
              <li>Zero scrolling — type it, find it</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <div className="mock-app">
              <div className="mock-app-head">
                <span className="m-brand">Supervint</span>
                <span className="m-count">My items</span>
              </div>
              <div className="mock-app-body">
                <div className="mock-wardrobe-search">⌕ jacket</div>
                <div className="mock-wardrobe-grid">
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">🧥</div><div className="mock-wardrobe-name">Vintage Levi&apos;s Denim</div><div className="mock-wardrobe-tag">found</div></div>
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">🧥</div><div className="mock-wardrobe-name">Barbour Wax · M</div><div className="mock-wardrobe-tag">found</div></div>
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">🧥</div><div className="mock-wardrobe-name">Carhartt Detroit · L</div><div className="mock-wardrobe-tag">found</div></div>
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">🧥</div><div className="mock-wardrobe-name">North Face Puffer</div><div className="mock-wardrobe-tag">found</div></div>
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">👕</div><div className="mock-wardrobe-name">Stone Island Crew</div><div className="mock-wardrobe-tag">found</div></div>
                  <div className="mock-wardrobe-card"><div className="mock-wardrobe-img">🧥</div><div className="mock-wardrobe-name">Patagonia Fleece</div><div className="mock-wardrobe-tag">found</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase reverse">
          <div className="showcase-copy">
            <h3>Tell the AI what you&apos;re hunting. It builds the search.</h3>
            <p>
              No more fiddling with filters or pasting URLs. Describe the item in plain English —
              brand, size, price, the lot — and the AI assistant turns it into a live, monitored
              Vinted search in seconds.
            </p>
            <ul>
              <li>Sets brand, size, colour and price cap automatically</li>
              <li>Paste a whole list of links and it adds them all at once</li>
              <li>Ask it anything about selling — what to charge, what sells fast</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <div className="ai-chat">
              <div className="chat-bar"><span className="shot-dot"></span><span className="shot-dot"></span><span className="shot-dot"></span><span className="chat-title">Supervint AI</span></div>
              <div className="ai-msg ai-msg-user">&ldquo;Nike P-6000 trainers under £20, UK size 8–10&rdquo;</div>
              <div className="ai-msg ai-msg-bot">
                Done — search built and watching now.
                <span className="ai-built">Nike P-6000 · ≤£20 · UK 8–10 · colour: any</span>
              </div>
            </div>
          </div>
        </div>

        <div className="support-grid">
          <div className="support-card">
            <h3>Email price alerts</h3>
            <p>Set a lower &ldquo;urgent&rdquo; price and get emailed only when something drops below it.</p>
          </div>
          <div className="support-card">
            <h3>Google Sheets logging</h3>
            <p>Every find written straight to a spreadsheet in your own Drive, checkable from any device.</p>
          </div>
          <div className="support-card">
            <h3>Active hours you control</h3>
            <p>Set when Supervint checks — it hibernates outside your window.</p>
          </div>
          <div className="support-card">
            <h3>Upfront, always</h3>
            <p>If a search pauses to keep your account safe, you&apos;ll see exactly why — never silence.</p>
          </div>
        </div>
      </section>

      <section className="safety">
        <div className="safety-inner">
          <h2>Your account stays yours.</h2>
          <p>
            Supervint is <strong>alert-only</strong>. It never logs into your Vinted account, never
            auto-buys, never posts, never takes any automated action. We tell you when a deal drops —
            you buy it yourself, at your own pace. No ban risk, no fine print. That&apos;s the whole
            difference.
          </p>
          <div className="safety-points">
            <span>✓ Read-only — never logs in as you</span>
            <span>✓ No automated buying or posting</span>
            <span>✓ No Vinted credentials stored</span>
            <span>✓ Pauses automatically if Vinted rate-limits</span>
          </div>
        </div>
      </section>

      <section id="pricing" className="section-alt">
        <div className="sec-head">
          <p className="eyebrow">Pricing</p>
          <h2>Start free. Upgrade when it&apos;s earning its keep.</h2>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <h3>Free</h3>
            <p className="price-num">£0<span>forever</span></p>
            <a href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo" className="btn btn-ghost price-cta" onClick={() => fbq('track', 'Lead', { content_name: 'Free Tier Install Click' })}>Install free on Chrome</a>
            <ul>
              <li>5 active searches</li>
              <li>Desktop alerts</li>
              <li>Search your own listings</li>
              <li>Standard sniping speed</li>
            </ul>
          </div>
          <div className="price-card pop">
            <span className="tag-pop">Most popular</span>
            <h3>Reseller</h3>
            <p className="price-num">£6.99<span>/ month</span></p>
            <a href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo" className="btn btn-primary price-cta" onClick={() => fbq('track', 'Lead', { content_name: 'Reseller Install Click' })}>Get started on Chrome</a>
            <ul>
              <li>Up to 50 active searches</li>
              <li>AI assistant — 50 messages/day</li>
              <li>Sold-price intelligence</li>
              <li>Email price alerts</li>
              <li>Google Sheets logging</li>
            </ul>
          </div>
          <div className="price-card">
            <h3>Power Seller</h3>
            <p className="price-num">£13.99<span>/ month</span></p>
            <a href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo" className="btn btn-ghost price-cta" onClick={() => fbq('track', 'Lead', { content_name: 'Power Seller Install Click' })}>Get started on Chrome</a>
            <ul>
              <li>Up to 100 active searches</li>
              <li>AI assistant — 100 messages/day</li>
              <li>Everything in Reseller</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="price-card">
            <h3>Empire</h3>
            <p className="price-num">£24.99<span>/ month</span></p>
            <a href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo" className="btn btn-ghost price-cta" onClick={() => fbq('track', 'Lead', { content_name: 'Empire Install Click' })}>Get started on Chrome</a>
            <ul>
              <li>Up to 200 active searches</li>
              <li>AI assistant — 200 messages/day</li>
              <li>Everything in Power Seller</li>
              <li>Built for high-volume sellers</li>
            </ul>
          </div>
        </div>
        <p className="pricing-callout">
          <strong>Every new account gets 7 days of Trial free</strong> — 50 searches, AI assistant,
          sold prices, Google Sheets logging and email alerts, no card needed. After 7 days you keep
          everything on Free (5 searches) forever. Upgrade to Reseller, Power Seller or Empire directly
          inside the extension when you need more room.
        </p>
        <p className="pricing-note">Free accounts are optionally asked for an email inside the extension — to back up your searches across devices and for account updates. Never required to start.</p>
      </section>

      <section className="guides-block">
        <div className="sec-head">
          <h2>Popular guides</h2>
          <p className="guides-block-sub">Everything you need to sell smarter on Vinted.</p>
        </div>
        <div className="guides-links">
          <a href="/guides/vinted-price-alert">How Vinted price alerts work</a>
          <a href="/guides/how-to-see-sold-prices-on-vinted">See sold prices on Vinted</a>
          <a href="/guides/vinted-sniper">Vinted sniper — find deals first</a>
          <a href="/guides/how-to-sell-on-vinted">How to sell on Vinted</a>
          <a href="/guides/how-to-get-more-views-on-vinted">Get more views on Vinted</a>
          <a href="/guides/vinted-ban-risk">Is it safe? Account ban risk explained</a>
          <a href="/help">Help &amp; support</a>
        </div>
      </section>

      <section id="faq" className="section-alt">
        <div className="sec-head">
          <h2>Common questions</h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <h3>How do I see sold prices on Vinted?</h3>
            <p>Vinted doesn&apos;t show sold prices. Supervint&apos;s crowd-sourced sold-price database shows what similar items actually sold for, so you know a fair price before you buy or list.</p>
          </div>
          <div className="faq-item">
            <h3>Will Supervint get my Vinted account banned?</h3>
            <p>No. Supervint is alert-only — it never logs into your Vinted account, never auto-buys, and never takes any automated action. You always buy manually.</p>
          </div>
          <div className="faq-item">
            <h3>Is Supervint free?</h3>
            <p>Yes — free to install with 5 active searches and desktop alerts. Every new account also gets 7 days of Trial free, with no card required. Upgrade to Reseller (£6.99/month), Power Seller (£13.99/month) or Empire (£24.99/month) for more searches and extra tools.</p>
          </div>
          <div className="faq-item">
            <h3>Does Supervint auto-buy items for me?</h3>
            <p>No. Supervint only notifies you. You review the listing and buy it yourself on Vinted — no automated buying, posting, or account actions are ever involved.</p>
          </div>
          <div className="faq-item">
            <h3>Can I search my own Vinted listings?</h3>
            <p>Yes. Supervint lets you search your own listings by keyword, so you can spot what&apos;s underpriced, what&apos;s not moving, and what to re-price — without scrolling your whole wardrobe.</p>
          </div>
          <div className="faq-item">
            <h3>What&apos;s the difference between Supervint and Vinted&apos;s own favourites?</h3>
            <p>Vinted favourites notify you when a favourited item drops 5%+. Supervint alerts you the moment a brand-new matching listing goes live — before it&apos;s gone.</p>
          </div>
          <div className="faq-item">
            <h3>Do I need a Vinted tab open for it to work?</h3>
            <p>No. As long as Chrome is open and you&apos;re signed in to Vinted, Supervint checks your searches in the background on its own — no Vinted tab needed. The only requirements: Chrome open, signed in to Vinted, and your computer not asleep.</p>
          </div>
          <div className="faq-item">
            <h3>Does it work on mobile?</h3>
            <p>Supervint is a desktop Chrome extension for Mac and Windows. Alerts also arrive by email, so you can act from your phone the moment a deal drops.</p>
          </div>
        </div>
      </section>

      <section className="final">
        <h2>Stop guessing. Start sniping.</h2>
        <p className="final-sub">Know the real sold price before you buy, and get the alert before anyone else. Install Supervint free, set your searches once, and let it do the watching for you.</p>
        <a
          href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo"
          className="btn btn-primary btn-lg"
          onClick={() => fbq('track', 'Lead', { content_name: 'Chrome Web Store Click' })}
        >
          Get Supervint free
        </a>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span>Supervint</span>
          <div className="footer-links">
            <a href="/#how">How it works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <span>© 2026 Supervint. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
