'use client';
import { useState, useEffect, useCallback } from 'react';

const PLAN_OPTIONS = [
  { value: 'free',        label: 'Free' },
  { value: 'trial',       label: 'Trial' },
  { value: 'reseller',    label: 'Reseller' },
  { value: 'powerseller', label: 'Power Seller' },
];

const PLAN_COLORS = {
  free:        { bg: '#f3f4f6', color: '#6b7280' },
  trial:       { bg: '#fef3c7', color: '#b45309' },
  reseller:    { bg: '#d1fae5', color: '#065f46' },
  powerseller: { bg: '#ede9fe', color: '#6d28d9' },
};

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function PlanBadge({ plan }) {
  const c = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999,
      fontSize: '0.78rem', fontWeight: 700, background: c.bg, color: c.color,
    }}>
      {plan}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '0.35rem 1rem 0.35rem 0', color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ padding: '0.35rem 0', fontSize: '0.88rem', wordBreak: 'break-all' }}>
        {value ?? '—'}
      </td>
    </tr>
  );
}

export default function AdminPanel() {
  const [users, setUsers]           = useState([]);
  const [usersLoading, setUL]       = useState(true);
  const [usersError, setUE]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [lookupId, setLookupId]     = useState('');
  const [lookupErr, setLookupErr]   = useState('');
  const [lookupEmail, setLookupEmail]       = useState('');
  const [lookupEmailErr, setLookupEmailErr] = useState('');
  const [grantPlan, setGrantPlan]   = useState('trial');
  const [trialDays, setTrialDays]   = useState(5);
  const [grantMsg, setGrantMsg]     = useState('');
  const [busy, setBusy]             = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteMsg, setDeleteMsg]             = useState('');
  const [deleted, setDeleted]                 = useState([]);
  const [deletedLoading, setDeletedLoading]   = useState(true);

  const loadUsers = useCallback(async () => {
    setUE('');
    try {
      const res  = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        setUE(data.error || 'Failed to load users.');
      } else {
        setUsers(data.users);
      }
    } catch {
      setUE('Network error loading users.');
    } finally {
      setUL(false);
    }
  }, []);

  const loadDeleted = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/deleted');
      const data = await res.json();
      if (res.ok) setDeleted(data.deleted ?? []);
    } catch {
      // non-critical — silently fail
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadDeleted();
  }, [loadUsers, loadDeleted]);

  function selectUser(user) {
    setSelected(user);
    setGrantPlan(user.plan);
    setGrantMsg('');
    setLookupErr('');
    setConfirmDeleteId(null);
    setDeleteMsg('');
  }

  async function handleLookup(e) {
    e.preventDefault();
    setLookupErr('');
    setGrantMsg('');
    const id = lookupId.trim();
    if (!id) return;
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/lookup?clientId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setLookupErr(data.error || 'No record found for that clientId.');
        setSelected(null);
      } else {
        setSelected(data);
        setGrantPlan(data.plan);
      }
    } catch {
      setLookupErr('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailLookup(e) {
    e.preventDefault();
    setLookupEmailErr('');
    setGrantMsg('');
    const email = lookupEmail.trim();
    if (!email) return;
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/lookup-by-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setLookupEmailErr(data.error || 'No record found for that email.');
        setSelected(null);
      } else {
        setSelected(data);
        setGrantPlan(data.plan);
      }
    } catch {
      setLookupEmailErr('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGrant(e) {
    e.preventDefault();
    setGrantMsg('');
    setBusy(true);
    try {
      const body = { clientId: selected.clientId, plan: grantPlan };
      if (grantPlan === 'trial') body.trialDays = Number(trialDays);
      const res  = await fetch('/api/admin/grant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setGrantMsg(`Error: ${data.error}`);
      } else {
        const [res2] = await Promise.all([
          fetch(`/api/admin/lookup?clientId=${encodeURIComponent(selected.clientId)}`),
          loadUsers(),
        ]);
        const data2 = await res2.json();
        if (data2.found) setSelected(data2);
        setGrantMsg(`Plan set to ${grantPlan}.`);
      }
    } catch {
      setGrantMsg('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(clientId) {
    setBusy(true);
    setDeleteMsg('');
    try {
      const res  = await fetch('/api/admin/delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg(`Error: ${data.error}`);
      } else {
        // Move from users list to top of deleted list
        const deletedUser = users.find(u => u.clientId === clientId);
        setUsers(prev => prev.filter(u => u.clientId !== clientId));
        if (deletedUser) {
          setDeleted(prev => [{ ...deletedUser, deletedAt: Date.now() }, ...prev]);
        }
        if (selected?.clientId === clientId) setSelected(null);
        setDeleteMsg(`Account deleted. You can restore it from "Recently deleted" below.`);
      }
    } catch {
      setDeleteMsg('Network error.');
    } finally {
      setBusy(false);
      setConfirmDeleteId(null);
    }
  }

  async function handleRestore(clientId) {
    setBusy(true);
    setDeleteMsg('');
    try {
      const res  = await fetch('/api/admin/restore', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg(`Restore error: ${data.error}`);
      } else {
        setDeleted(prev => prev.filter(d => d.clientId !== clientId));
        await loadUsers();
        setDeleteMsg(
          data.emailConflict
            ? `Restored. Note: email index not restored — another account now uses that address.`
            : `Restored successfully.`
        );
      }
    } catch {
      setDeleteMsg('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin';
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>Supervint Admin</h1>
        <button onClick={handleSignOut} className="btn btn-ghost btn-sm">Sign out</button>
      </div>

      {deleteMsg && (
        <div style={{
          marginBottom: '1rem', padding: '0.7rem 1rem', borderRadius: 8,
          background: deleteMsg.startsWith('Error') || deleteMsg.startsWith('Restore error') ? '#fef2f2' : '#f0fdf4',
          color:      deleteMsg.startsWith('Error') || deleteMsg.startsWith('Restore error') ? '#dc2626' : '#16a34a',
          fontSize: '0.85rem',
        }}>
          {deleteMsg}{' '}
          <button
            onClick={() => setDeleteMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'inherit', opacity: 0.6, marginLeft: '0.5rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* User table */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: '0.75rem' }}>
          {usersLoading
            ? 'Loading…'
            : `${users.length} user${users.length !== 1 ? 's' : ''} · no email stored server-side · click a row to manage`}
        </p>
        {usersError && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{usersError}</p>}
        {!usersLoading && !usersError && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--offwhite)', borderBottom: '1px solid var(--line)' }}>
                  {['clientId', 'Plan', 'Email', 'Trial expires', 'Stripe customer', 'Admin grant', 'Created', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '1.4rem', color: 'var(--gray)', textAlign: 'center' }}>
                      No users yet.
                    </td>
                  </tr>
                )}
                {users.map(u => {
                  const isSelected  = selected?.clientId === u.clientId;
                  const isConfirming = confirmDeleteId === u.clientId;
                  return (
                    <tr
                      key={u.clientId}
                      onClick={() => { if (!isConfirming) selectUser(u); }}
                      style={{
                        borderBottom: '1px solid var(--line)', cursor: isConfirming ? 'default' : 'pointer',
                        background: isSelected ? '#f0fdf4' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected && !isConfirming) e.currentTarget.style.background = 'var(--offwhite)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#f0fdf4' : 'transparent'; }}
                    >
                      <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }} title={u.clientId}>
                        {u.clientId.slice(0, 13)}…
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem' }}>
                        <PlanBadge plan={u.plan} />
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: u.email ? 'var(--ink)' : 'var(--gray)' }}>
                        {u.email ?? '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap', color: u.trialDaysLeft === 0 ? '#dc2626' : 'inherit' }}>
                        {u.trialExpiresAt ? `${u.trialDaysLeft}d left` : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {u.customerId ? `${u.customerId.slice(0, 14)}…` : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center', color: 'var(--green)' }}>
                        {u.adminGrantedAt ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap', color: 'var(--gray)' }}>
                        {fmt(u.createdAt)}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        {isConfirming ? (
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleDelete(u.clientId)}
                              disabled={busy}
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', color: 'var(--gray)' }}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setConfirmDeleteId(u.clientId); setDeleteMsg(''); }}
                            disabled={busy}
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual lookup */}
      <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="Paste a full clientId to look up"
          value={lookupId}
          onChange={e => setLookupId(e.target.value)}
          style={{
            flex: 1, padding: '0.65rem 1rem', borderRadius: 8,
            border: '1px solid var(--line)', fontSize: '0.88rem', fontFamily: 'monospace',
          }}
        />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={busy}>
          {busy ? '…' : 'Look up'}
        </button>
      </form>
      {lookupErr && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{lookupErr}</p>
      )}

      {/* Email lookup */}
      <form onSubmit={handleEmailLookup} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
        <input
          type="email"
          placeholder="Or look up by email address"
          value={lookupEmail}
          onChange={e => setLookupEmail(e.target.value)}
          style={{
            flex: 1, padding: '0.65rem 1rem', borderRadius: 8,
            border: '1px solid var(--line)', fontSize: '0.88rem',
          }}
        />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={busy}>
          {busy ? '…' : 'Look up'}
        </button>
      </form>
      {lookupEmailErr && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{lookupEmailErr}</p>
      )}

      {/* Selected user detail + grant */}
      {selected && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '1.4rem', marginTop: '1rem', background: 'var(--offwhite)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Selected user
          </p>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.4rem' }}>
            <tbody>
              <DetailRow label="clientId"        value={<span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{selected.clientId}</span>} />
              <DetailRow label="Plan"            value={<PlanBadge plan={selected.plan} />} />
              <DetailRow label="Email"           value={selected.email} />
              <DetailRow label="Trial expires"   value={selected.trialExpiresAt ? `${fmt(selected.trialExpiresAt)} (${selected.trialDaysLeft}d left)` : null} />
              <DetailRow label="Stripe customer" value={selected.customerId} />
              <DetailRow label="Subscription"    value={selected.subscriptionId} />
              <DetailRow label="Admin granted"   value={fmt(selected.adminGrantedAt)} />
              <DetailRow label="Created"         value={fmt(selected.createdAt)} />
              <DetailRow label="Updated"         value={fmt(selected.updatedAt)} />
            </tbody>
          </table>

          <form onSubmit={handleGrant}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={grantPlan}
                onChange={e => setGrantPlan(e.target.value)}
                style={{ padding: '0.55rem 0.8rem', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.9rem', background: '#fff' }}
              >
                {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {grantPlan === 'trial' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--gray)' }}>
                  Days:
                  <input
                    type="number" min={1} max={365} value={trialDays}
                    onChange={e => setTrialDays(e.target.value)}
                    style={{ width: 64, padding: '0.5rem 0.6rem', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.9rem', textAlign: 'center' }}
                  />
                </label>
              )}
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? '…' : 'Grant'}
              </button>
            </div>
            {grantMsg && (
              <p style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: grantMsg.startsWith('Error') ? '#dc2626' : '#16a34a' }}>
                {grantMsg}
              </p>
            )}
          </form>

          {/* Delete from detail view */}
          <div style={{ marginTop: '1.4rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
            {confirmDeleteId === selected.clientId ? (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.7rem 1rem', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5' }}>
                <span style={{ fontSize: '0.85rem', color: '#dc2626', flex: 1 }}>
                  This is irreversible without restore — delete this account?
                </span>
                <button
                  onClick={() => handleDelete(selected.clientId)}
                  disabled={busy}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {busy ? '…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem', borderRadius: 6, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', color: 'var(--gray)', whiteSpace: 'nowrap' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setConfirmDeleteId(selected.clientId); setDeleteMsg(''); }}
                disabled={busy}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
              >
                Delete user
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recently deleted */}
      <div style={{ marginTop: '3rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Recently deleted
        </p>
        {deletedLoading && <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Loading…</p>}
        {!deletedLoading && deleted.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Nothing deleted yet.</p>
        )}
        {!deletedLoading && deleted.length > 0 && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--offwhite)', borderBottom: '1px solid var(--line)' }}>
                  {['Deleted at', 'clientId', 'Plan', 'Email', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deleted.map(d => (
                  <tr key={d.clientId} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap', color: 'var(--gray)' }}>
                      {fmt(d.deletedAt)}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }} title={d.clientId}>
                      {d.clientId.slice(0, 13)}…
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <PlanBadge plan={d.plan} />
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: d.email ? 'var(--ink)' : 'var(--gray)' }}>
                      {d.email ?? '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <button
                        onClick={() => handleRestore(d.clientId)}
                        disabled={busy}
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', color: 'var(--gray)' }}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  );
}
