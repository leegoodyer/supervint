export const metadata = {
  title: 'Supervint — See you soon',
  description: 'Supervint uninstall page — thank you for trying Supervint.',
};

export default function UninstallPage() {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%)', padding: '2rem 1rem',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <div style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
        background: '#fff', borderRadius: 16, padding: '2.5rem 2rem',
        boxShadow: '0 8px 30px rgba(0,119,130,0.12)', border: '1px solid #e5e7eb',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
        <h1 style={{ color: '#007782', fontSize: '1.5rem', margin: '0 0 0.75rem' }}>
          Sad to see you go
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
          Thanks for trying Supervint. Your searches and settings are saved on your
          account — so if you come back, everything will be right where you left it.
        </p>

        <div style={{
          background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10,
          padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 0.35rem', fontWeight: 700, color: '#007782', fontSize: '0.9rem' }}>
            🎁 Changed your mind? Get 7 more days free
          </p>
          <p style={{ margin: '0', color: '#4b5563', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Reinstall and your trial extends by a week — unlimited searches, no card needed.
            If it wasn&apos;t for you, no hard feelings.
          </p>
        </div>

        <a
          href="https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo"
          style={{
            display: 'block', width: '100%', padding: '0.85rem', borderRadius: 10,
            background: '#007782', color: '#fff', textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box',
          }}
        >
          ↩ Reinstall Supervint
        </a>

        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>
          If something went wrong, tell us — support@supervint.com
        </p>
      </div>
    </main>
  );
}
