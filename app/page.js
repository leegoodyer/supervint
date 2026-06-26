export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a href="/" className="logo"><span className="logo-mark"></span>Supervint</a>
          <div className="nav-right">
            <nav className="nav-links">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <a href="#pricing" className="btn btn-primary btn-sm">Get Supervint</a>
          </div>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">The Vinted Product Sniper &amp; Price Alert</p>
        <h1>Spot it first. Snipe it before anyone else does.</h1>
        <p className="hero-sub">Supervint runs your snipe around the clock, pulling in every product that matches your setup the second it&apos;s listed.</p>
        <a href="#pricing" className="btn btn-primary btn-lg">Start sniping, free</a>
        <p className="hero-fine">No credit card required · Chrome extension · Set up in 2 minutes</p>

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
            <a href="#" className="btn btn-ghost price-cta">Get started</a>
            <ul>
              <li>1 active search</li>
              <li>Desktop alerts</li>
              <li>Standard sniping speed</li>
            </ul>
          </div>
          <div className="price-card pop">
            <span className="tag-pop">Most popular</span>
            <h3>Reseller</h3>
            <p className="price-num">£6<span>/ month</span></p>
            <a href="#" className="btn btn-primary price-cta">Get started</a>
            <ul>
              <li>Up to 10 active searches</li>
              <li>Desktop alerts</li>
              <li>Google Sheets logging</li>
              <li>Email price alerts</li>
            </ul>
          </div>
          <div className="price-card">
            <h3>Power Seller</h3>
            <p className="price-num">£14<span>/ month</span></p>
            <a href="#" className="btn btn-ghost price-cta">Get started</a>
            <ul>
              <li>Unlimited active searches</li>
              <li>Everything in Reseller</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="final">
        <h2>Stop refreshing. Start sniping.</h2>
        <a href="#pricing" className="btn btn-primary btn-lg">Get Supervint free</a>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span>Supervint</span>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <span>© 2026 Supervint. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
