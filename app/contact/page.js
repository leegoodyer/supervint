export const metadata = {
  title: 'Contact — Supervint',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
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

      <section style={{ textAlign: 'center', paddingBottom: '6rem' }}>
        <p className="eyebrow">Support</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', lineHeight: 1.15, maxWidth: '36rem', margin: '0 auto 1rem' }}>
          Get in touch.
        </h1>
        <p className="hero-sub" style={{ marginBottom: '2rem' }}>
          For support questions about Supervint, email us and we&apos;ll get back to you.
        </p>
        <a href="mailto:support@supervint.com" className="btn btn-ghost">
          support@supervint.com
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
