'use client';
import { useState } from 'react';

export default function AdminLogin({ configured }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (!configured) {
    return (
      <main style={{ maxWidth: 400, margin: '8rem auto', padding: '0 2rem', fontFamily: 'monospace' }}>
        <p style={{ color: '#dc2626' }}>ADMIN_PASSWORD is not set. Configure it in Vercel environment variables.</p>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '8rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--ink)' }}>
        Supervint Admin
      </h1>
      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
          required
          style={{
            padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid var(--line)',
            fontSize: '0.95rem', outline: 'none', width: '100%',
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
