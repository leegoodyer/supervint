'use client';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Supervint?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Supervint is a Chrome extension that monitors Vinted searches in real time and sends you an instant desktop alert the moment a matching listing appears — so you can snipe the deal before anyone else.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is Supervint different from refreshing Vinted manually?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Supervint checks continuously in the background, even when you\'re away from the keyboard. Manual refreshing means you\'re always behind buyers who already have an alert running. Good listings on Vinted sell within minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Supervint work on any Vinted search?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Paste any Vinted search URL into Supervint and it monitors it for you. You can run multiple searches simultaneously on paid plans — trainers, jackets, consoles, whatever you\'re hunting.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a free version?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — Supervint is free to install with 5 active searches and desktop alerts included. Every new account also gets 7 days of Trial free, with no card required. Upgrade to Reseller (£6.99/month), Power Seller (£13.99/month) or Empire (£24.99/month) for more searches, Google Sheets logging, email price alerts, and priority support.',
      },
    },
    {
      '@type': 'Question',
      name: 'Will Supervint get my Vinted account banned?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Supervint is designed to be account-safe — it uses randomised check intervals, respects the active hours you set, and pauses automatically if Vinted returns any rate-limit signals. No automated buying, posting, or account actions are ever involved.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — Supervint is a desktop Chrome extension and only runs while Chrome is open on a Mac or Windows computer. It does not work on Chrome for iPhone or Android (mobile Chrome does not support extensions).',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a Vinted tab open for it to work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. As long as Chrome is open and you are signed in to Vinted, Supervint checks your searches in the background on its own — you don\u2019t need a Vinted tab open, and you can use other apps while it monitors. The only requirements are: Chrome open, signed in to Vinted, and your computer not asleep.',
      },
    },
    {
      '@type': 'Question',
      name: 'Will battery saver or power saving mode stop it working?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — it can. Low power mode, battery saver, or Chrome\u2019s energy saver can pause background apps, which pauses your Supervint alerts. For alerts to keep coming through, turn off low battery / power saving mode (on Windows: disable Battery Saver; on Mac: disable Low Power Mode) and keep the laptop plugged in where possible.',
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
              href="#pricing"
              className="btn btn-primary btn-sm"
              onClick={() => fbq('track', 'Lead', { content_name: 'Chrome Web Store Click' })}
            >
              Get Supervint
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">The Vinted Product Sniper &amp; Price Alert</p>
        <h1>Never miss a Vinted deal again. <span className="hero-accent">Flip for profit, before anyone else.</span></h1>
        <p className="hero-kw">The Vinted Chrome extension that watches your searches 24/7 and fires an instant desktop alert the second a matching listing goes live — so you snipe the flip before it&apos;s gone.</p>
        <p className="hero-sub">Deals on Vinted sell in minutes. Supervint alerts you in seconds — no bots, no ban risk, just faster than everyone else.</p>
        <a
          href="#pricing"
          className="btn btn-primary btn-lg"
          onClick={() => fbq('track', 'Lead', { content_name: 'Hero CTA Click' })}
        >
          Add Supervint to Chrome — it&apos;s free
        </a>
        <p className="hero-fine">No credit card required · Set up in 2 minutes · No Vinted login details ever</p>

        <div className="product-shot">
          <div className="shot-bar">
            <span className="shot-dot"></span>
            <span className="shot-dot"></span>
            <span className="shot-dot"></span>
            <span className="shot-title">Supervint — live searches</span>
          </div>
          <div className="shot-rows">
            <div className="shot-row"><span className="name">Nike trainers UK 9</span><span className="shot-tag tag-new">3 new</span></div>
            <div className="shot-row"><span className="name">Carhartt jacket M</span><span className="shot-tag tag-idle">watching</span></div>
            <div className="shot-row"><span className="name">N64 console</span><span className="shot-tag tag-idle">watching</span></div>
          </div>
        </div>
      </section>

      <section className="problems">
        <div className="sec-head"><h2>The deal&apos;s gone before you&apos;ve even opened the tab.</h2></div>
        <div className="problem-grid">
          <div className="problem">
            <span className="problem-no">01</span>
            <h3>Good listings sell in minutes</h3>
            <p>Manually refreshing means you&apos;re always behind the buyers who already have an alert running.</p>
          </div>
          <div className="problem">
            <span className="problem-no">02</span>
            <h3>You can&apos;t watch ten searches at once</h3>
            <p>Trainers, jackets, that console — your eyes can only be on one tab at a time. Supervint&apos;s can be on all of them.</p>
          </div>
          <div className="problem">
            <span className="problem-no">03</span>
            <h3>The big one never waits</h3>
            <p>You need something sniping for you even when you&apos;re nowhere near your laptop.</p>
          </div>
        </div>
      </section>

      <section id="features" className="section-alt">
        <div className="sec-head">
          <p className="eyebrow">What Supervint does</p>
          <h2>Everything you need to snipe the drop.</h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Run as many searches as you want</h3>
            <p>Track every search that matters at once — each with its own schedule and daily limit, fully independent of the rest.</p>
          </div>
          <div className="feature-card">
            <h3>Search your own listings, instantly</h3>
            <p>Got hundreds of items listed? Type a keyword and find your own listing in a second — no more scrolling your whole wardrobe to locate one item.</p>
          </div>
          <div className="feature-card">
            <h3>Instant alerts, the second it&apos;s live</h3>
            <p>A real desktop notification with the photo and price, the moment a new listing matches. Click it — you&apos;re already on the page.</p>
          </div>
          <div className="feature-card">
            <h3>Every find, logged to a Google Sheet</h3>
            <p>Connect your own Google account and every item Supervint snipes gets written straight to a spreadsheet you can check from any device.</p>
          </div>
          <div className="feature-card">
            <h3>Set a price alert, get emailed on the steals</h3>
            <p>Tell Supervint what counts as a steal for any search and get an email the second something drops below it.</p>
          </div>
          <div className="feature-card">
            <h3>Active hours you control</h3>
            <p>Set the window Supervint should be checking — it hibernates outside it, so it&apos;s never running when you wouldn&apos;t be.</p>
          </div>
          <div className="feature-card">
            <h3>Upfront, always</h3>
            <p>If a search needs to pause to keep your account safe, you&apos;ll see exactly why, right in the popup — never just silence.</p>
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
            <h3>Paste a search</h3>
            <p>Search Vinted like normal, copy the link, drop it into Supervint.</p>
          </div>
          <div className="how-step">
            <span className="how-no">2</span>
            <h3>Name it, set your alert</h3>
            <p>Give it a label, choose your hours, set a price alert if you want emails.</p>
          </div>
          <div className="how-step">
            <span className="how-no">3</span>
            <h3>Get on with your day</h3>
            <p>Supervint snipes in the background. You find out the moment it matters.</p>
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
              <li>Desktop alerts</li>
              <li>Google Sheets logging</li>
              <li>Email price alerts</li>
              <li>Search your own listings</li>
            </ul>
          </div>
          <div className="price-card">
            <h3>Power Seller</h3>
            <p className="price-num">£13.99<span>/ month</span></p>
            <a href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo" className="btn btn-ghost price-cta" onClick={() => fbq('track', 'Lead', { content_name: 'Power Seller Install Click' })}>Get started on Chrome</a>
            <ul>
              <li>Up to 100 active searches</li>
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
              <li>Everything in Power Seller</li>
              <li>Built for high-volume sellers</li>
            </ul>
          </div>
        </div>
        <p className="pricing-callout">
          <strong>Every new account gets 7 days of Trial free</strong> — 50 searches, Google Sheets
          logging and email alerts, no card needed. After 7 days you keep everything on Free (5 searches) forever.
          Upgrade to Reseller, Power Seller or Empire directly inside the extension when you need more room.
        </p>
        <p className="pricing-note">Free accounts are optionally asked for an email inside the extension — to back up your searches across devices and for account updates. Never required to start.</p>
      </section>

      <section id="faq" className="section-alt">
        <div className="sec-head">
          <h2>Common questions</h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <h3>What is Supervint?</h3>
            <p>Supervint is a Chrome extension that monitors Vinted searches in real time and sends you an instant desktop alert the moment a matching listing appears — so you can snipe the deal before anyone else.</p>
          </div>
          <div className="faq-item">
            <h3>How is Supervint different from refreshing Vinted manually?</h3>
            <p>Supervint checks continuously in the background, even when you&apos;re away from the keyboard. Manual refreshing means you&apos;re always behind buyers who already have an alert running. Good listings on Vinted sell within minutes.</p>
          </div>
          <div className="faq-item">
            <h3>Does Supervint work on any Vinted search?</h3>
            <p>Yes. Paste any Vinted search URL into Supervint and it monitors it for you. You can run multiple searches simultaneously on paid plans — trainers, jackets, consoles, whatever you&apos;re hunting.</p>
          </div>
          <div className="faq-item">
            <h3>Is there a free version?</h3>
            <p>Yes — Supervint is free to install with 5 active searches and desktop alerts included. Every new account also gets 7 days of Trial free, with no card required. Upgrade to Reseller (£6.99/month), Power Seller (£13.99/month) or Empire (£24.99/month) for more searches, Google Sheets logging, email price alerts, and priority support.</p>
          </div>
          <div className="faq-item">
            <h3>Will Supervint get my Vinted account banned?</h3>
            <p>Supervint is designed to be account-safe — it uses randomised check intervals, respects the active hours you set, and pauses automatically if Vinted returns any rate-limit signals. No automated buying, posting, or account actions are ever involved.</p>
          </div>
          <div className="faq-item">
            <h3>Does it work on mobile?</h3>
            <p>No — Supervint is a desktop Chrome extension and only runs while Chrome is open on a Mac or Windows computer. It does not work on Chrome for iPhone or Android (mobile Chrome does not support extensions).</p>
          </div>
          <div className="faq-item">
            <h3>Do I need a Vinted tab open for it to work?</h3>
            <p>No. As long as Chrome is open and you&apos;re signed in to Vinted, Supervint checks your searches in the background on its own — no Vinted tab needed, and you can use other apps while it monitors. The only requirements: Chrome open, signed in to Vinted, and your computer not asleep.</p>
          </div>
        </div>
      </section>

      <section className="final">
        <h2>Stop refreshing. Start sniping.</h2>
        <a
          href="#pricing"
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
