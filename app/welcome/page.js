import { getStripe } from '@/lib/stripe';

// Update this once the extension is published to the Chrome Web Store
const CWS_URL = 'https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo';

const PLAN_DISPLAY = {
  reseller: {
    name: 'Reseller',
    summary: 'Up to 10 live searches, email alerts, and Google Sheets logging — all included.',
  },
  powerseller: {
    name: 'Power Seller',
    summary: 'Unlimited searches, 25 email alerts per day, and Google Sheets logging — all yours.',
  },
};

export const metadata = {
  title: 'Welcome — Supervint',
};

export default async function WelcomePage({ searchParams }) {
  const params = await searchParams;
  const sessionId = params?.session_id;
  let planKey = null;

  if (sessionId && typeof sessionId === 'string' && sessionId.length < 200) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      planKey = session?.metadata?.plan ?? null;
    } catch {
      // invalid or expired session — fall through to generic confirmation
    }
  }

  const planInfo = PLAN_DISPLAY[planKey] ?? null;

  return (
    <main>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo">
            <span className="logo-mark" />
            Supervint
          </a>
          <a href="/" className="btn btn-ghost btn-sm">← Back to site</a>
        </div>
      </nav>

      <section style={{ textAlign: 'center', paddingBottom: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(160deg, var(--green-bright), var(--green-dark))',
          color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.4rem',
        }}>✓</div>
        <p className="eyebrow">Payment confirmed</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', lineHeight: 1.15, maxWidth: '36rem', margin: '0 auto 1rem' }}>
          {planInfo ? `You're on ${planInfo.name}.` : "You're all set."}
        </h1>
        <p className="hero-sub" style={{ marginBottom: 0 }}>
          {planInfo ? planInfo.summary : 'Open the extension to get started.'}
        </p>
      </section>

      <section className="section-alt">
        <div className="sec-head">
          <p className="eyebrow">Get started</p>
          <h2>Three steps to your first snipe.</h2>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-no">1</span>
            <h3>Build your search on Vinted</h3>
            <p>Go to Vinted and set your filters — size, price range, colour, condition, brand, whatever you normally buy. Copy the URL from the address bar once the results look right.</p>
          </div>
          <div className="how-step">
            <span className="how-no">2</span>
            <h3>Paste it into Supervint</h3>
            <p>Open the extension, paste the Vinted URL to create a new search, give it a name, and toggle it on. Supervint starts watching immediately and notifies you when new matches appear.</p>
          </div>
          <div className="how-step">
            <span className="how-no">3</span>
            <h3>Set your urgent email threshold</h3>
            <p>Your Vinted price range sets what Supervint tracks — your general budget. In Supervint's Edit screen for that search, set a lower "urgent price". You'll only get emailed when something hits that exceptional price, not for every match.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <p className="eyebrow">Go further</p>
          <h2>Two more things worth setting up.</h2>
        </div>
        <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '700px', margin: '0 auto' }}>
          <div className="feature-card">
            <h3>Email alerts</h3>
            <p>Add your email in the popup's Email section. Then in each search's Edit screen, set an urgent price — lower than your Vinted range — and you'll only be emailed for the genuinely cheap finds.</p>
          </div>
          <div className="feature-card">
            <h3>Google Sheets log</h3>
            <p>Connect your Google account in the popup's Sheets section. Every new match is logged automatically — handy for tracking prices over time.</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', paddingTop: 0, paddingBottom: '4rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--gray)', marginBottom: '1rem' }}>
          Don't have the extension yet?
        </p>
        <a href={CWS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Install from the Chrome Web Store →
        </a>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span>Supervint</span>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
