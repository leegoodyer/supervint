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

// ── Feature-usage event metadata ────────────────────────────────────────────
// Human label for each tracked event. No icons, no colours — a clean,
// minimal admin list (Lee: "weird colours with weird logos from clipart —
// make it clean").
const USAGE_META = {
  panel_opened:       { label: 'Opened panel' },
  search_created:     { label: 'Created search' },
  search_deleted:     { label: 'Deleted search' },
  search_toggled:     { label: 'Started/stopped' },
  search_my_items:    { label: 'Search my items' },
  sold_search:        { label: 'Sold search' },
  notif_clicked:      { label: 'Alert clicked' },
  email_setup:        { label: 'Email set up' },
  sheets_connected:   { label: 'Sheets connected' },
  alert_test:         { label: 'Test alert' },
};
function usageLabel(ev) { return USAGE_META[ev]?.label ?? ev.replace(/_/g, ' '); }
// Total across all events for one usage hash.
function usageTotal(u) {
  if (!u) return 0;
  return Object.values(u).reduce((a, b) => a + (Number(b) || 0), 0);
}

// Pretty-print the install attribution record:
// e.g. "Facebook ad (fbclid …) · utm_campaign=spring24" or "chatgpt.com / ai-assistant"
function fmtAttribution(a) {
  if (!a) return '—';
  const parts = [];
  if (a.source)       parts.push(a.source);
  if (a.utm_source)   parts.push(a.utm_source);
  if (a.utm_medium)   parts.push(a.utm_medium);
  if (a.utm_campaign) parts.push(`campaign: ${a.utm_campaign}`);
  if (a.fbclid)       parts.push(`fbclid: ${String(a.fbclid).slice(0, 12)}…`);
  if (a.gclid)        parts.push(`gclid: ${String(a.gclid).slice(0, 12)}…`);
  if (a.referrer && a.source !== a.referrer) parts.push(`ref: ${a.referrer.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 40)}`);
  if (a.country)      parts.push(a.country.toUpperCase());
  if (parts.length === 0) return '—';
  const when = a.ts ? ` (${fmt(a.ts)})` : '';
  return parts.join(' · ') + when;
}

// Human-friendly poll status — "12 new items found", "no new items",
// "stopped", "error (HTTP 429)" — never the raw internal token.
function friendlyPollResult(u) {
  const r = (u.lastPollResult || '').toLowerCase();
  const when = u.lastPollTime ? ` ${fmt(u.lastPollTime)}` : '';
  const n = u.newItemsLastCount;
  switch (r) {
    case 'new_items':
      return n > 0 ? `${n} new item${n !== 1 ? 's' : ''} found${when}` : 'new items found';
    case 'no_new':      return `no new items${when}`;
    case 'stopped':     return 'stopped';
    case 'hibernating': return `hibernating (resumes ${u.activeHoursStart || '08:00'})`;
    case 'capped':      return `daily cap reached (${u.dailyCap || 200}/day)`;
    case 'rate_limited': return `rate-limited${u.lastPollError ? ` (${u.lastPollError})` : ''}`;
    case 'error':       return `error${u.lastPollError ? ` — ${u.lastPollError}` : ''}`;
    default:            return r || '—';
  }
}

// Is the search inside its active-hours window right now? Null hours = always
// active (old searches / no window set).
function insideActiveHours(s) {
  if (!s.activeHoursStart || !s.activeHoursEnd) return true;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = String(s.activeHoursStart).split(':').map(Number);
  const [eh, em] = String(s.activeHoursEnd).split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(eh)) return true;
  const start = sh * 60 + (sm || 0);
  const end = eh * 60 + (em || 0);
  if (start === end) return true;          // 24h
  if (start < end) return mins >= start && mins < end;
  return mins >= start || mins < end;      // overnight window
}

// Poll status for a single search row (compact).
function friendlySearchStatus(s) {
  const r = (s.lastPollResult || '').toLowerCase();
  const n = s.newItemsLastCount;
  // Enabled but outside active hours = hibernating, regardless of the last
  // poll result (the server may not have a fresh "hibernating" sync yet).
  if (s.enabled && !insideActiveHours(s)) return `hibernating (resumes ${s.activeHoursStart || '08:00'})`;
  // A search that has never polled yet isn't "stopped" — it's starting up
  // (first poll happens within minutes of being added).
  if (!r && s.needsBaseline) return 'starting up';
  if (!r && s.enabled)      return 'waiting for first poll';
  switch (r) {
    case 'new_items': return n > 0 ? `${n} new` : 'new items';
    case 'no_new':    return 'no new';
    case 'stopped':   return 'stopped';
    case 'hibernating': return `hibernating (resumes ${s.activeHoursStart || '08:00'})`;
    case 'capped':    return 'capped';
    case 'rate_limited': return 'rate-limited';
    case 'error':     return 'error';
    default:          return r || 'starting up';
  }
}

// Color for a search row's status — green only when it's genuinely running
// and finding/checking items; amber for hibernating (outside active hours);
// grey for stopped/starting.
function searchStatusColor(s) {
  const r = (s.lastPollResult || '').toLowerCase();
  if (!s.enabled)       return 'var(--gray)';
  if (!insideActiveHours(s)) return '#b45309';   // amber — paused by the clock
  if (r === 'hibernating') return '#b45309';
  if (r === 'capped' || r === 'rate_limited' || r === 'error') return '#b45309';
  return 'var(--green)';
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

// Fancy collapsible section header — a proper button with chevron + hover.
// Responsive: on narrow screens the `right` slot wraps onto its own row.
function SectionHeader({ title, subtitle, open, onClick, right }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', rowGap: '0.5rem',
        padding: '0.65rem 1rem', marginBottom: '0.75rem',
        background: open ? 'var(--green)' : 'var(--offwhite)',
        border: '1px solid var(--line)', borderRadius: 10,
        cursor: 'pointer', userSelect: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#eef2ff'; }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'var(--offwhite)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: '1 1 auto' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, width: 20, height: 20, borderRadius: 6,
          background: open ? 'rgba(255,255,255,0.25)' : 'var(--line)',
          color: open ? '#fff' : 'var(--gray)',
          fontSize: '0.7rem', transition: 'transform 0.15s',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>
          ▼
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: open ? '#fff' : 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: '0.78rem', color: open ? 'rgba(255,255,255,0.85)' : 'var(--gray)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '1 1 auto' }}>
            {subtitle}
          </span>
        )}
      </div>
      {right && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: '0 1 auto', justifyContent: 'flex-end' }}
        >
          {right}
        </div>
      )}
    </div>
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
  const [grantEmail, setGrantEmail] = useState('');
  const [grantMsg, setGrantMsg]     = useState('');
  const [busy, setBusy]             = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteMsg, setDeleteMsg]             = useState('');
  const [deleted, setDeleted]                 = useState([]);
  const [deletedLoading, setDeletedLoading]   = useState(true);
  // Filters + collapsible sections
  const [filterStatus, setFilterStatus]       = useState('all');
  const [filterPlan, setFilterPlan]           = useState('all');
  const [usersOpen, setUsersOpen]             = useState(true);
  const [deletedOpen, setDeletedOpen]         = useState(false);
  const [selectedOpen, setSelectedOpen]       = useState(true);
  // Push broadcast (Web Push to all subscribed users' computers, or one user)
  const [pushTitle, setPushTitle]   = useState('');
  const [pushBody, setPushBody]     = useState('');
  const [pushUrl, setPushUrl]       = useState('');
  const [pushClientId, setPushClientId] = useState('');
  const [pushMsg, setPushMsg]       = useState('');
  const [pushBusy, setPushBusy]     = useState(false);

  async function handlePushSend(e) {
    e?.preventDefault();
    if (pushBusy) return;
    setPushBusy(true);
    setPushMsg('');
    try {
      const res = await fetch('/api/admin/push-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          url: pushUrl || undefined,
          clientId: pushClientId.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPushMsg(`Error: ${data.error || res.status}`); return; }
      if (pushClientId.trim()) {
        setPushMsg(data.sent > 0 ? `Sent to that user.` : `No subscription found for that clientId.`);
      } else {
        setPushMsg(`Sent to ${data.sent} device(s) · ${data.failed} failed.`);
      }
      setPushTitle(''); setPushBody(''); setPushUrl('');
    } catch (err) {
      setPushMsg(`Error: ${err?.message || err}`);
    } finally {
      setPushBusy(false);
    }
  }

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
    setGrantEmail(user.email || '');
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
        setGrantEmail(data.email || '');
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
        setGrantEmail(data.email || '');
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
      const body = { clientId: selected.clientId, plan: grantPlan, email: grantEmail.trim() };
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

  // Filtered user list (status + plan filters)
  const filteredUsers = users.filter(u => {
    if (filterPlan !== 'all' && u.plan !== filterPlan) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return !!u.active24h;
    if (filterStatus === 'stale')  return !u.active24h && !!u.active7d;
    if (filterStatus === 'idle')   return !u.active24h && !u.active7d;
    return true;
  });

  const statusCounts = {
    all: users.length,
    active: users.filter(u => u.active24h).length,
    stale:  users.filter(u => !u.active24h && u.active7d).length,
    idle:   users.filter(u => !u.active24h && !u.active7d).length,
  };

  const FILTER_STATUS_OPTIONS = [
    { value: 'all',    label: `All (${statusCounts.all})` },
    { value: 'active', label: `● Active (${statusCounts.active})` },
    { value: 'stale',  label: `◐ Stale (${statusCounts.stale})` },
    { value: 'idle',   label: `○ Idle (${statusCounts.idle})` },
  ];
  const FILTER_PLAN_OPTIONS = [
    { value: 'all', label: 'All plans' },
    { value: 'trial', label: 'Trial' },
    { value: 'reseller', label: 'Reseller' },
    { value: 'powerseller', label: 'Power Seller' },
    { value: 'free', label: 'Free' },
  ];

  return (
    <main style={{ width: '100%', maxWidth: 'none', margin: '0 auto', padding: '2rem 2.5rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>Supervint Admin</h1>
        <button onClick={handleSignOut} className="btn btn-ghost btn-sm">Sign out</button>
      </div>

      {/* Push broadcast — Web Push notification to all subscribed users' computers */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid var(--line)', borderRadius: 10, padding: '1rem 1.1rem', background: '#fff' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray)', marginBottom: '0.6rem' }}>
          Push notification (to users' computers)
        </div>
        <form onSubmit={handlePushSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={pushTitle}
              onChange={e => setPushTitle(e.target.value)}
              placeholder="Title"
              required
              style={{ flex: '1 1 200px', padding: '0.45rem 0.6rem', borderRadius: 7, border: '1px solid var(--line)', fontSize: '0.85rem' }}
            />
            <input
              value={pushUrl}
              onChange={e => setPushUrl(e.target.value)}
              placeholder="URL (optional)"
              style={{ flex: '1 1 200px', padding: '0.45rem 0.6rem', borderRadius: 7, border: '1px solid var(--line)', fontSize: '0.85rem' }}
            />
            <input
              value={pushClientId}
              onChange={e => setPushClientId(e.target.value)}
              placeholder="Client ID (optional — send to ONE user only)"
              style={{ flex: '1 1 260px', padding: '0.45rem 0.6rem', borderRadius: 7, border: '1px solid var(--line)', fontSize: '0.85rem', fontFamily: 'monospace' }}
            />
          </div>
          <textarea
            value={pushBody}
            onChange={e => setPushBody(e.target.value)}
            placeholder="Message body"
            required
            rows={2}
            style={{ padding: '0.45rem 0.6rem', borderRadius: 7, border: '1px solid var(--line)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <button type="submit" disabled={pushBusy} className="btn btn-sm" style={{ background: 'var(--green)', color: '#fff', border: 'none' }}>
              {pushBusy ? 'Sending…' : 'Send push'}
            </button>
            {pushMsg && <span style={{ fontSize: '0.8rem', color: pushMsg.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{pushMsg}</span>}
          </div>
        </form>
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

      {/* User table — collapsible + filterable */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHeader
          title="Users"
          subtitle={`${filteredUsers.length}${filterStatus !== 'all' || filterPlan !== 'all' ? ` of ${users.length}` : ''} shown`}
          open={usersOpen}
          onClick={() => setUsersOpen(o => !o)}
          right={
            usersOpen && (
              <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.78rem', background: '#fff', color: '#111827' }}
                >
                  {FILTER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={filterPlan}
                  onChange={e => setFilterPlan(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.78rem', background: '#fff', color: '#111827' }}
                >
                  {FILTER_PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )
          }
        />
        {usersOpen && (
          <>
        {usersError && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{usersError}</p>}
        {!usersLoading && !usersError && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--offwhite)', borderBottom: '1px solid var(--line)' }}>
                  {['clientId', 'Plan', 'Email', 'Trial expires', 'Stripe customer', 'Admin grant', 'Created', 'Last seen', 'Searches', 'Version', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: '1.4rem', color: 'var(--gray)', textAlign: 'center' }}>
                      {users.length === 0 ? 'No users yet.' : 'No users match the selected filters.'}
                    </td>
                  </tr>
                )}
                {filteredUsers.map(u => {
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
                        {u.trialDaysLeft != null ? `${u.trialDaysLeft}d left` : '—'}
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
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap', color: u.active24h ? 'var(--green)' : 'var(--gray)', fontWeight: u.active24h ? 600 : 400 }}>
                        {u.lastSeenAt ? fmt(u.lastSeenAt) : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>not running</span>}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}>
                        {u.searchCount != null ? u.searchCount : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.78rem', color: u.version ? 'var(--ink)' : '#9ca3af' }}>
                        {u.version ?? 'unknown'}
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap' }}>
                        {u.active24h ? (
                          <span style={{ color: 'var(--green)', fontWeight: 600 }}>● Active</span>
                        ) : u.active7d ? (
                          <span style={{ color: '#d97706', fontWeight: 600 }}>◐ Seen 7d</span>
                        ) : (
                          <span style={{ color: 'var(--gray)' }}>○ Idle</span>
                        )}
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
          </>
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

      {/* Selected user detail + grant — collapsible */}
      {selected && (
        <div style={{ marginTop: '1rem' }}>
          <SectionHeader
            title="Selected user"
            subtitle={`· ${selected.email || selected.clientId.slice(0, 13)}`}
            open={selectedOpen}
            onClick={() => setSelectedOpen(o => !o)}
          />
          {selectedOpen && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '1.4rem', background: 'var(--offwhite)' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.4rem' }}>
            <tbody>
              <DetailRow label="clientId"        value={<span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{selected.clientId}</span>} />
              <DetailRow label="Plan"            value={<PlanBadge plan={selected.plan} />} />
              <DetailRow label="Email"           value={selected.email} />
              <DetailRow label="Trial expires"   value={selected.trialDaysLeft != null ? `${fmt(selected.trialExpiresAt)} (${selected.trialDaysLeft}d left)` : null} />
              <DetailRow label="Stripe customer" value={selected.customerId} />
              <DetailRow label="Subscription"    value={selected.subscriptionId} />
              <DetailRow label="Admin granted"   value={fmt(selected.adminGrantedAt)} />
              <DetailRow label="Created"         value={fmt(selected.createdAt)} />
              <DetailRow label="Updated"         value={fmt(selected.updatedAt)} />
              <DetailRow label="Came from"       value={selected.attribution ? fmtAttribution(selected.attribution) : '—'} />
              <DetailRow label="Last seen"       value={selected.lastSeenAt ? `${fmt(selected.lastSeenAt)}${selected.active24h ? ' · active' : selected.active7d ? ' · seen this week' : ''}` : '—'} />
              <DetailRow label="Version"         value={selected.version ?? '—'} />
              <DetailRow label="Last poll"       value={selected.lastPollResult ? friendlyPollResult(selected) : '—'} />
              <DetailRow label="Offscreen"       value={selected.offscreenAlive ? 'alive' : selected.offscreenAlive === false ? 'not pinging' : '—'} />
              <DetailRow label="Searches"        value={Array.isArray(selected.searches) ? `${selected.searches.length} total · ${selected.searches.filter(s => s.enabled).length} running` : '—'} />
              <DetailRow
                label="Usage"
                value={
                  selected.usage && Object.keys(selected.usage).length > 0 ? (
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray)' }}>Feature usage</span>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                          background: 'var(--green)', borderRadius: 999, padding: '0.05rem 0.5rem',
                        }}>
                          {usageTotal(selected.usage)} events
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {Object.entries(selected.usage)
                          .sort((a, b) => b[1] - a[1])
                          .map(([ev, n]) => (
                            <div key={ev} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                              fontSize: '0.8rem',
                            }}>
                              <span style={{ color: 'var(--ink)' }}>{USAGE_META[ev]?.label || ev}</span>
                              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="AI assistant"
                value={
                  selected.aiUsage ? (
                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: selected.aiUsage.used >= selected.aiUsage.daily && selected.aiUsage.daily > 0 ? 'var(--red, #dc2626)' : 'inherit' }}>
                      {selected.aiUsage.used} / {selected.aiUsage.daily} today
                      {selected.aiUsage.daily === 0 ? ' (off — paid plans only)' : ''}
                    </span>
                  ) : '—'
                }
              />
            </tbody>
          </table>

        {/* Searches list — full width, outside the detail table so it fills
            the panel instead of being squeezed into a value cell. */}
        {Array.isArray(selected.searches) && selected.searches.length > 0 && (
          <div style={{ marginTop: '0.2rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray)', margin: '0.35rem 0 0.3rem' }}>
              Searches
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>
                <tbody>
                  {selected.searches.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--line)', background: s.enabled ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '0.4rem 0.7rem', color: 'var(--ink)', fontWeight: s.enabled ? 600 : 400 }}>
                        {s.label || '(unnamed search)'}
                      </td>
                      <td style={{ padding: '0.4rem 0.7rem', textAlign: 'left', whiteSpace: 'nowrap', width: 170 }}>
                        {s.enabled
                          ? <span style={{ color: searchStatusColor(s), fontWeight: 600 }}>● {friendlySearchStatus(s)}</span>
                          : <span style={{ color: 'var(--gray)' }}>○ {friendlySearchStatus(s)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          <form onSubmit={handleGrant}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="email" placeholder="email (optional)" value={grantEmail}
                onChange={e => setGrantEmail(e.target.value)}
                style={{ padding: '0.55rem 0.8rem', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.9rem', minWidth: 180 }}
              />
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
        </div>
      )}

      {/* Recently deleted — collapsible */}
      <div style={{ marginTop: '1.5rem' }}>
        <SectionHeader
          title="Recently deleted"
          subtitle={deleted.length > 0 ? `${deleted.length} account${deleted.length !== 1 ? 's' : ''}` : 'nothing deleted'}
          open={deletedOpen}
          onClick={() => setDeletedOpen(o => !o)}
        />
        {deletedOpen && (
          <>
        {deletedLoading && <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Loading…</p>}
        {!deletedLoading && deleted.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Nothing deleted yet.</p>
        )}
        {!deletedLoading && deleted.length > 0 && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--offwhite)', borderBottom: '1px solid var(--line)' }}>
                  {['Deleted at', 'clientId', 'Plan', 'Email', 'Stripe customer', 'Merged into', ''].map((h, i) => (
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
                    <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem', color: d.customerId ? 'var(--ink)' : 'var(--gray)' }}>
                      {d.customerId ? `${d.customerId.slice(0, 14)}…` : '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap', color: d.mergedInto ? 'var(--ink)' : 'var(--gray)' }} title={d.mergedInto || ''}>
                      {d.mergedInto ? `${d.mergedInto.slice(0, 13)}…` : '—'}
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
          </>
        )}
      </div>

    </main>
  );
}
