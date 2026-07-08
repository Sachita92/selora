import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'
import { useAuth } from '../lib/useAuth'

const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const s = {
  page:    { minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' },
  body:    { maxWidth: 760, margin: '0 auto', padding: '2.5rem 2rem 5rem' },
  h1:      { fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px', margin: 0 },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2rem', marginBottom: '1.25rem' },
  label:   { display: 'block', fontSize: '.7rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' },
  input:   { width: '100%', padding: '.7rem 1rem', border: `1px solid ${c.border}`, borderRadius: 10, fontSize: '.9rem', fontFamily: 'Inter, sans-serif', outline: 'none', background: c.bg, color: c.dark, boxSizing: 'border-box', transition: 'border-color .15s' },
  btnP:    { background: c.green, color: '#fff', border: 'none', padding: '.7rem 1.6rem', borderRadius: 10, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  btnG:    { background: 'transparent', color: c.dark, border: `1px solid ${c.border}`, padding: '.7rem 1.6rem', borderRadius: 10, fontSize: '.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' },
  divider: { border: 'none', borderTop: `1px solid ${c.border}`, margin: '1.5rem 0' },
  sTitle:  { fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 500, color: c.dark, margin: '0 0 .3rem 0' },
  sSub:    { fontSize: '.8rem', color: c.muted, fontWeight: 300, margin: 0 },
}

const PLAN_LABELS = { free: 'Free Tier', growth: 'Growth', scale: 'Scale' }
const PLAN_COLORS = {
  free:   { bg: 'var(--bg-2)',                  color: 'var(--text-muted)' },
  growth: { bg: 'rgba(90,138,103,.12)',          color: 'var(--g)' },
  scale:  { bg: 'rgba(109,40,217,.1)',           color: '#7c3aed' },
}

function Avatar({ name, email, size = 72 }) {
  const initial = (name || email || '?').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--g) 0%, #3d6b52 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      boxShadow: '0 4px 16px rgba(95,141,118,.25)',
      userSelect: 'none',
    }}>
      {initial}
    </div>
  )
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      style={{
        background: copied ? 'rgba(90,138,103,.1)' : 'transparent',
        border: `1px solid ${copied ? 'var(--g)' : c.border}`,
        color: copied ? 'var(--g)' : c.muted,
        padding: '.28rem .7rem', borderRadius: 7, fontSize: '.72rem',
        fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: '.3rem', transition: 'all .15s',
      }}
    >
      {copied ? (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
      ) : (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
      )}
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, setUser, stores, activeStore } = useAppContext()
  const { walletAddress, logout } = useAuth()

  const [displayName, setDisplayName] = useState(
    user?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.name || ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  if (!user) return null

  const plan = user?.subscription_plan || 'free'
  const planColors = PLAN_COLORS[plan] || PLAN_COLORS.free
  const planLabel = PLAN_LABELS[plan] || plan

  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const handleSave = async () => {
    setSaving(true)
    setSaveErr('')
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName, name: displayName }
      })
      if (error) throw error
      setUser(prev => ({
        ...prev,
        display_name: displayName,
        user_metadata: { ...prev.user_metadata, display_name: displayName, name: displayName }
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setSaveErr(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={s.page}>
      <div style={s.body}>

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={s.h1}>Profile</h1>
          <p style={{ fontSize: '.85rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
            Manage your account details and preferences
          </p>
        </div>

        {/* ── IDENTITY CARD ───────────────────────────────────────────────────── */}
        <div style={s.card}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <Avatar name={displayName || user?.user_metadata?.name} email={user?.email} size={72} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: c.dark, marginBottom: '.25rem' }}>
                {displayName || user?.user_metadata?.name || 'Seller'}
              </div>
              <div style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300, marginBottom: '.5rem' }}>
                {user?.email}
              </div>
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '.2rem .65rem',
                borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.07em',
                background: planColors.bg, color: planColors.color,
              }}>
                {planLabel}
              </span>
            </div>
          </div>

          <hr style={s.divider} />

          {/* Display name field */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={s.label}>Display Name</label>
            <input
              style={s.input}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              onFocus={e => e.target.style.borderColor = 'var(--g)'}
              onBlur={e => e.target.style.borderColor = c.border}
            />
          </div>

          {/* Email — read-only */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={s.label}>Email Address</label>
            <div style={{
              padding: '.7rem 1rem', border: `1px solid ${c.border}`, borderRadius: 10,
              fontSize: '.9rem', color: c.muted, background: c.bg2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{user?.email}</span>
              <span style={{ fontSize: '.65rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Read-only</span>
            </div>
          </div>

          {/* Save feedback */}
          {saved && (
            <div style={{ padding: '.65rem 1rem', background: 'rgba(22,101,52,.07)', border: '1px solid rgba(22,101,52,.15)', borderRadius: 8, fontSize: '.82rem', color: '#166534', marginBottom: '1rem' }}>
              ✓ Profile updated
            </div>
          )}
          {saveErr && (
            <div style={{ padding: '.65rem 1rem', background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.15)', borderRadius: 8, fontSize: '.82rem', color: '#DC2626', marginBottom: '1rem' }}>
              {saveErr}
            </div>
          )}

          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button style={s.btnP} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── WALLET CARD ─────────────────────────────────────────────────────── */}
        <div style={s.card}>
          <div style={s.row}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 3px 12px rgba(153,69,255,.22)',
              }}>
                <svg width="19" height="15" viewBox="0 0 98 76" fill="none">
                  <path d="M9.5 57.5H88.5L79 67H0L9.5 57.5Z" fill="white"/>
                  <path d="M9.5 9.5H88.5L79 0H0L9.5 9.5Z" fill="white"/>
                  <path d="M88.5 33.5H9.5L19 43H98L88.5 33.5Z" fill="white"/>
                </svg>
              </div>
              <div>
                <p style={{ ...s.sTitle }}>Solana Wallet</p>
                <p style={s.sSub}>Your embedded Privy wallet for Solana Pay</p>
              </div>
            </div>

            {walletAddress ? (
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: 999,
                textTransform: 'uppercase', letterSpacing: '.07em',
                background: 'rgba(20,241,149,.1)', color: '#059669',
              }}>Connected</span>
            ) : (
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: 999,
                textTransform: 'uppercase', letterSpacing: '.07em',
                background: c.bg2, color: c.muted,
              }}>Not connected</span>
            )}
          </div>

          {walletAddress && (
            <>
              <hr style={s.divider} />
              <div>
                <label style={s.label}>Wallet Address</label>
                <div style={{
                  padding: '.7rem 1rem', border: `1px solid ${c.border}`, borderRadius: 10,
                  background: c.bg2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '.85rem', color: c.dark, wordBreak: 'break-all' }}>
                    {walletAddress}
                  </span>
                  <CopyButton value={walletAddress} />
                </div>
                {activeStore?.platform === 'selora' && (
                  <p style={{ fontSize: '.75rem', color: c.muted, marginTop: '.6rem', fontWeight: 300 }}>
                    ⚡ Solana Pay is active on your storefront — customers can pay directly to this address.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── PLAN & BILLING ──────────────────────────────────────────────────── */}
        <div style={s.card}>
          <div style={s.row}>
            <div>
              <p style={s.sTitle}>Plan & Billing</p>
              <p style={s.sSub}>
                You are on the <strong style={{ color: planColors.color }}>{planLabel}</strong>
                {user?.subscription_status === 'active' ? ' · Active' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              {plan === 'free' ? (
                <Link to="/pricing" style={{ ...s.btnP, textDecoration: 'none', display: 'inline-block' }}>
                  Upgrade Plan
                </Link>
              ) : (
                <Link to="/settings?tab=billing" style={{ ...s.btnG, textDecoration: 'none', display: 'inline-block' }}>
                  Manage Billing
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── CONNECTED STORES ────────────────────────────────────────────────── */}
        {stores.length > 0 && (
          <div style={s.card}>
            <p style={{ ...s.sTitle, marginBottom: '.8rem' }}>Connected Stores</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {stores.map(store => {
                const isActive = activeStore?.id === store.id
                const platformColor = store.platform === 'selora' ? 'var(--g)' : '#96bf48'
                const platformBg = store.platform === 'selora' ? 'rgba(90,138,103,.1)' : 'rgba(150,191,72,.1)'
                return (
                  <div key={store.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.75rem 1rem', borderRadius: 10,
                    border: `1px solid ${isActive ? 'var(--g)' : c.border}`,
                    background: isActive ? 'rgba(90,138,103,.04)' : c.bg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                      <span style={{
                        fontSize: '.6rem', fontWeight: 700, padding: '.15rem .4rem',
                        borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em',
                        background: platformBg, color: platformColor,
                      }}>
                        {store.platform === 'selora' ? 'Selora' : 'Shopify'}
                      </span>
                      <span style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>{store.shop_name}</span>
                      {isActive && (
                        <span style={{
                          fontSize: '.6rem', fontWeight: 700, padding: '.15rem .4rem',
                          borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em',
                          background: 'rgba(90,138,103,.1)', color: 'var(--g)',
                        }}>Active</span>
                      )}
                    </div>
                    {store.shop_url && (
                      <a
                        href={store.shop_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '.75rem', color: c.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.3rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--g)'}
                        onMouseLeave={e => e.currentTarget.style.color = c.muted}
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ACCOUNT INFO ────────────────────────────────────────────────────── */}
        <div style={s.card}>
          <p style={{ ...s.sTitle, marginBottom: '1rem' }}>Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {joinedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem' }}>
                <span style={{ color: c.muted }}>Member since</span>
                <span style={{ color: c.dark, fontWeight: 500 }}>{joinedAt}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem' }}>
              <span style={{ color: c.muted }}>User ID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '.78rem', color: c.muted }}>
                  {user?.id?.slice(0, 8)}…
                </span>
                {user?.id && <CopyButton value={user.id} />}
              </div>
            </div>
          </div>

          <hr style={s.divider} />

          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent', border: '1px solid rgba(220,38,38,.25)',
              color: '#DC2626', padding: '.65rem 1.4rem', borderRadius: 10,
              fontSize: '.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: '.5rem', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.07)'; e.currentTarget.style.borderColor = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(220,38,38,.25)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  )
}
