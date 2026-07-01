import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useChat } from '../lib/ChatContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getOptimizedImageUrl = (url, width = 300) => {
  if (!url) return url
  if (url.includes('cdn.shopify.com')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}width=${width}`
  }
  if (url.includes('images.unsplash.com')) {
    if (url.includes('w=')) return url.replace(/w=\d+/, `w=${width}`)
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}w=${width}`
  }
  return url
}

// ─── Colour tokens (all CSS vars so they respect dark mode) ──────────────────
const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const s = {
  page:    { minHeight: '100vh', background: 'radial-gradient(circle at top right,rgba(95,141,118,.04),transparent 45%),radial-gradient(circle at bottom left,rgba(95,141,118,.02),transparent 45%),var(--bg-0)', fontFamily: 'Inter,sans-serif' },
  h1:      { fontFamily: 'Fraunces,serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px' },
  btnP:    { background: c.green, color: '#fff', border: 'none', padding: '.65rem 1.4rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '.4rem' },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '1.6rem', position: 'relative' },
  cardTit: { fontFamily: 'Fraunces,serif', fontSize: '1rem', fontWeight: 500, color: c.dark, marginBottom: '1rem' },
  mCard:   { background: 'var(--bg-1)', border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem', display: 'flex', flexDirection: 'column', transition: 'all .25s ease' },
  mVal:    { fontFamily: 'Fraunces,serif', fontSize: '1.8rem', fontWeight: 400, color: c.dark, margin: '.3rem 0' },
  mLbl:    { fontSize: '.68rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 },
  empty:   { textAlign: 'center', padding: '3rem 1rem', color: c.muted, fontSize: '.88rem', fontWeight: 300, lineHeight: 1.7 },
}

const GlobalStyles = () => (
  <style>{`
    .selora-card { transition: all .25s cubic-bezier(.4,0,.2,1); }
    .selora-card:hover { transform: translateY(-3px); border-color: #5F8D76 !important; box-shadow: 0 8px 24px rgba(95,141,118,.06) !important; }
    .qa-card {
      display: flex; align-items: center; gap: .7rem;
      padding: .85rem 1.1rem;
      background: var(--bg-1); border: 1px solid var(--border); border-radius: 10px;
      cursor: pointer; text-decoration: none; color: var(--text-primary);
      font-size: .82rem; font-weight: 500; font-family: Inter,sans-serif;
      transition: all .2s ease; flex: 1; min-width: 140px;
    }
    .qa-card:hover { border-color: var(--g); background: var(--bg-2); }
    .qa-card svg { color: var(--g); flex-shrink: 0; }
    .qa-card:disabled { opacity: .6; cursor: not-allowed; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }
    .pdot { animation: pulse 2s infinite; }
    .spotlight-card { display:flex; gap:.85rem; padding:.85rem; background:var(--bg-0); border:1px solid var(--border); border-radius:10px; transition:all .15s; cursor:pointer; }
    .spotlight-card:hover { border-color:var(--g); background:var(--bg-2); }
  `}</style>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const hr = new Date().getHours()
  if (hr < 12) return 'Good morning'
  if (hr < 18) return 'Good afternoon'
  return 'Good evening'
}

const formatDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTimeShort = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').trim()

const isFlagged = (prod) => {
  if (prod.inventory === 0 || prod.inventory < 10) return true
  return stripHtml(prod.description).length < 50
}

const getFlagReason = (prod) => {
  if (prod.inventory === 0) return 'Out of stock'
  if (prod.inventory < 10) return `Low stock: ${prod.inventory} remaining`
  const len = stripHtml(prod.description).length
  if (len === 0) return 'No description'
  return 'Description too short'
}

// Next run: computed from last run + ~60 min cycle, falls back to static copy
const getNextRunText = (latestReport) => {
  if (!latestReport?.created_at) return 'Agent runs automatically every night'
  const nextRun = new Date(new Date(latestReport.created_at).getTime() + 60 * 60 * 1000)
  const now = new Date()
  if (nextRun <= now) return 'Agent runs automatically every night'
  const diffMins = Math.floor((nextRun - now) / 60000)
  if (diffMins < 60) return `Next run: in ~${diffMins} minute${diffMins !== 1 ? 's' : ''}`
  const hrs = Math.floor(diffMins / 60)
  return `Next run: in ~${hrs} hour${hrs !== 1 ? 's' : ''}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSpark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconTrend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IconFlag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
)
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconReport = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IconWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, stores, activeStore, setActiveStore, loading, products, fetchingProducts, fetchProducts } = useAppContext()
  const { sendMessage, setOpen } = useChat()
  const [logs, setLogs]         = useState([])
  const [reports, setReports]   = useState([])
  const [fetchingLogs, setFetchingLogs]       = useState(false)
  const [fetchingReports, setFetchingReports] = useState(false)
  const [running, setRunning]   = useState(false)
  const [scrollIndex, setScrollIndex] = useState(0)
  const [isHovered, setIsHovered]     = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Redirect if plan param present
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p && p !== 'free') navigate(`/pricing?plan=${p}`, { replace: true })
  }, [navigate])

  useEffect(() => {
    if (activeStore) {
      fetchLogs(activeStore.id)
      fetchReports(activeStore.id)
      setScrollIndex(0)
      setBannerDismissed(false)
    } else {
      setLogs([])
      setReports([])
    }
  }, [activeStore])

  useEffect(() => {
    const handleActionTaken = (e) => {
      if (activeStore && e.detail?.storeId === activeStore.id) {
        fetchLogs(activeStore.id)
        fetchReports(activeStore.id)
        fetchProducts(activeStore.id, true)
      }
    }
    window.addEventListener('selora-action-taken', handleActionTaken)
    return () => window.removeEventListener('selora-action-taken', handleActionTaken)
  }, [activeStore])

  const fetchLogs = async (storeId) => {
    setFetchingLogs(true)
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/logs`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) { console.error(e) }
    finally { setFetchingLogs(false) }
  }

  const fetchReports = async (storeId) => {
    setFetchingReports(true)
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/reports`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (e) { console.error(e) }
    finally { setFetchingReports(false) }
  }

  // Carousel autoplay
  useEffect(() => {
    if (products.length <= 4 || isHovered) return
    const interval = setInterval(() => {
      setScrollIndex(prev => {
        const next = prev + 1
        return next > products.length - 4 ? 0 : next
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [products, isHovered])

  const runAgent = async () => {
    if (!activeStore) return
    setRunning(true)
    try {
      await fetch(`${API_URL}/api/agent/run/${activeStore.id}?dry_run=false`, { method: 'POST' })
      setTimeout(() => {
        fetchLogs(activeStore.id)
        fetchReports(activeStore.id)
        fetchProducts(activeStore.id, true)
        setRunning(false)
      }, 6000)
    } catch (e) { console.error(e); setRunning(false) }
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: c.muted, fontSize: '.9rem' }}>Loading your dashboard...</p>
    </div>
  )

  const latestReport = reports[0] || null

  // ── Condensed summary ──────────────────────────────────────────────────────
  const uniqueProductsInRun = new Set(
    logs.filter(l => l.data?.product_id || l.data?.product_title)
        .map(l => l.data?.product_id || l.data?.product_title)
  ).size

  const listingsUpdated = logs.filter(l =>
    ['optimize_listing', 'reprice_product'].includes(l.action_type)
  ).length

  const buildSummaryLine = () => {
    if (!latestReport) return null
    if (uniqueProductsInRun > 0) {
      const n = uniqueProductsInRun
      const parts = [`reviewed ${n} product${n !== 1 ? 's' : ''}`]
      if (listingsUpdated > 0) parts.push(`updated ${listingsUpdated} listing${listingsUpdated !== 1 ? 's' : ''}`)
      const cc = latestReport.concerns?.length || 0
      if (cc > 0) parts.push(`flagged ${cc} for your attention`)
      if (parts.length === 1) return `Selora ${parts[0]}.`
      if (parts.length === 2) return `Selora ${parts[0]} and ${parts[1]}.`
      return `Selora ${parts[0]}, ${parts[1]}, and ${parts[2]}.`
    }
    const ac = Array.isArray(latestReport.actions_taken)
      ? latestReport.actions_taken.length
      : (typeof latestReport.actions_taken === 'number' ? latestReport.actions_taken : 0)
    return `Selora took ${ac} action${ac !== 1 ? 's' : ''}.`
  }

  // ── Stat card values (real data) ───────────────────────────────────────────
  const actionsTaken = (() => {
    if (!latestReport) return 0
    if (Array.isArray(latestReport.actions_taken)) return latestReport.actions_taken.length
    if (typeof latestReport.actions_taken === 'number') return latestReport.actions_taken
    return 0
  })()
  const winsCount    = latestReport?.wins?.length || 0
  const concernCount = latestReport?.concerns?.length || 0

  // ── Flagged products ───────────────────────────────────────────────────────
  const allFlagged   = products.filter(isFlagged)
  const flaggedSlice = allFlagged.slice(0, 4)
  const hasFlags     = flaggedSlice.length > 0

  // ── Store Pulse (2a) ───────────────────────────────────────────────────────
  const totalProducts  = products.length
  const outOfStock     = products.filter(p => p.inventory === 0).length
  const lowStockCount  = products.filter(p => p.inventory > 0 && p.inventory < 10).length
  const hasInvField    = products.some(p => p.inventory !== undefined)
  const totalInventory = hasInvField ? products.reduce((sum, p) => sum + (p.inventory || 0), 0) : null
  const showStorePulse = !fetchingProducts && totalProducts > 0

  // ── Product Spotlight — Recently Optimized (2c) ────────────────────────────
  const recentlyOptimized = (() => {
    const optLogs = logs.filter(l => l.action_type === 'optimize_listing').slice(0, 2)
    if (optLogs.length === 0) return []
    return optLogs.map(log => {
      const pid = log.data?.product_id
      const prod = products.find(p => String(p.id) === String(pid))
      return prod ? { log, prod } : null
    }).filter(Boolean)
  })()

  // ── "What to Do Next" banner (2d) — highest priority only ─────────────────
  const topPriority = (() => {
    // 1. Trial ending within 7 days
    if (user?.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(user.trial_ends_at) - Date.now()) / 86400000)
      if (daysLeft > 0 && daysLeft <= 7) return {
        type: 'warning',
        msg:  `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — upgrade to keep growing`,
        action: { label: 'Upgrade Now', to: '/pricing' },
      }
    }
    // 2. Payment failed
    if (['past_due', 'unpaid'].includes(user?.subscription_status)) return {
      type: 'critical',
      msg:  'Your last payment failed — update your card to keep Selora running',
      action: { label: 'Update Payment', to: '/settings' },
    }
    // Lower priorities only relevant when a store is active
    if (!activeStore) return null
    // 3. Concerns flagged
    if (concernCount > 0) return {
      type: 'warning',
      msg:  `Your agent flagged ${concernCount} item${concernCount !== 1 ? 's' : ''} that need${concernCount === 1 ? 's' : ''} attention`,
      action: { label: 'Review Now', to: '/reports' },
    }
    // 4. Agent hasn't run in 48 h
    if (!fetchingReports && !latestReport) return {
      type: 'neutral',
      msg:  "Your agent hasn't run yet — run it now to start growing your store",
      action: { label: 'Run Agent Now', onClick: runAgent },
    }
    if (latestReport && (Date.now() - new Date(latestReport.created_at).getTime() > 48 * 60 * 60 * 1000)) return {
      type: 'neutral',
      msg:  "Your agent hasn't run recently — run it now to check your store",
      action: { label: 'Run Agent Now', onClick: runAgent },
    }
    return null
  })()

  const bannerColors = {
    neutral:  { bg: 'var(--badge-success-bg)',      border: 'var(--g)',                      icon: '#5F8D76', text: 'var(--text-primary)' },
    warning:  { bg: 'var(--inventory-low-bg)',       border: 'var(--inventory-low-text)',     icon: '#D97706', text: 'var(--inventory-low-text)' },
    critical: { bg: 'var(--inventory-empty-bg, #FEF2F2)', border: '#DC2626',                 icon: '#DC2626', text: '#DC2626' },
  }

  return (
    <div style={s.page}>
      <GlobalStyles />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* ── GREETING ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={s.h1}>{getGreeting()}, {user?.user_metadata?.name || 'Seller'} 👋</h1>
            <p style={{ fontSize: '.85rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
              {activeStore
                ? (activeStore.shop_url ? `Connected to ${activeStore.shop_name}` : `Hosting native store: ${activeStore.shop_name}`)
                : 'Set up a store to get started'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeStore && (
              <button style={{ ...s.btnP, background: running ? '#7B907D' : c.green }} onClick={runAgent} disabled={running}>
                {running ? 'Agent running...' : 'Run Agent Now'}
              </button>
            )}
            <Link to="/connect" style={{ ...s.btnP, background: 'transparent', color: c.green, border: `1px solid ${c.green}` }}>
              + Set Up Store
            </Link>
          </div>
        </div>

        {/* ── NO STORES ─────────────────────────────────────────────────────── */}
        {stores.length === 0 && (
          <div style={{ ...s.card, ...s.empty }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.3rem', fontWeight: 500, color: c.dark, marginBottom: '.5rem' }}>
              No store set up yet
            </h2>
            <p style={{ marginBottom: '1.5rem', fontWeight: 300 }}>
              Connect your Shopify store or launch a native storefront, and Selora will start growing it tonight.
            </p>
            <Link to="/connect" style={s.btnP}>Set Up Your Store →</Link>
          </div>
        )}

        {/* ── SELECT STORE ──────────────────────────────────────────────────── */}
        {stores.length > 0 && !activeStore && (
          <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.3rem', fontWeight: 500, color: c.dark, marginBottom: '.5rem' }}>Select a Store</h2>
            <p style={{ color: c.muted, marginBottom: '1.5rem', fontWeight: 300 }}>
              Choose a store to view its growth analytics.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {stores.map(st => (
                <button key={st.id} onClick={() => setActiveStore(st)} style={s.btnP}>{st.shop_name}</button>
              ))}
            </div>
          </div>
        )}

        {activeStore && (
          <>
            {/* ── WHAT TO DO NEXT BANNER (2d) ───────────────────────────────── */}
            {topPriority && !bannerDismissed && (() => {
              const bc = bannerColors[topPriority.type]
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                  padding: '.9rem 1.1rem', marginBottom: '1.5rem',
                  background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: 10,
                }}>
                  <span style={{ color: bc.icon, display: 'flex', flexShrink: 0 }}><IconWarn /></span>
                  <span style={{ flex: 1, fontSize: '.85rem', color: c.dark, fontWeight: 500 }}>
                    {topPriority.msg}
                  </span>
                  {topPriority.action?.to && (
                    <Link to={topPriority.action.to} style={{ ...s.btnP, padding: '.45rem 1rem', fontSize: '.78rem', flexShrink: 0, background: bc.icon }}>
                      {topPriority.action.label}
                    </Link>
                  )}
                  {topPriority.action?.onClick && (
                    <button onClick={topPriority.action.onClick} disabled={running} style={{ ...s.btnP, padding: '.45rem 1rem', fontSize: '.78rem', flexShrink: 0, background: bc.icon }}>
                      {running ? 'Running...' : topPriority.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => setBannerDismissed(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, display: 'flex', padding: '.2rem', flexShrink: 0 }}
                    title="Dismiss"
                  >
                    <IconX />
                  </button>
                </div>
              )
            })()}

            {/* ── QUICK ACTIONS (1a: no duplicate Run Agent) ────────────────── */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <Link to="/reports" className="qa-card">
                <IconReport />
                View Last Report
              </Link>
              {hasFlags && (
                <Link to="/products" className="qa-card">
                  <IconWarn />
                  Review Flagged
                </Link>
              )}
              <Link to="/connect" className="qa-card">
                <IconLink />
                Manage Store
              </Link>
            </div>

            {/* ── STORE PULSE (2a) ──────────────────────────────────────────── */}
            {showStorePulse && (
              <div style={{ ...s.card, marginBottom: '1.5rem', padding: '1rem 1.4rem' }}>
                <div style={{ fontSize: '.68rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>
                  Store Pulse
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>

                  <div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.4rem', fontWeight: 400, color: c.dark, lineHeight: 1 }}>
                      {totalProducts}
                    </div>
                    <div style={{ fontSize: '.68rem', color: c.muted, marginTop: '.2rem' }}>Active Products</div>
                  </div>

                  {totalInventory !== null && (
                    <>
                      <div style={{ width: 1, height: 32, background: c.border }} />
                      <div>
                        <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.4rem', fontWeight: 400, color: c.dark, lineHeight: 1 }}>
                          {totalInventory.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '.68rem', color: c.muted, marginTop: '.2rem' }}>Total Units</div>
                      </div>
                    </>
                  )}

                  {outOfStock > 0 && (
                    <>
                      <div style={{ width: 1, height: 32, background: c.border }} />
                      <div>
                        <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--inventory-empty-text, #DC2626)', lineHeight: 1 }}>
                          {outOfStock}
                        </div>
                        <div style={{ fontSize: '.68rem', color: 'var(--inventory-empty-text, #DC2626)', marginTop: '.2rem', fontWeight: 500 }}>Out of Stock</div>
                      </div>
                    </>
                  )}

                  {lowStockCount > 0 && (
                    <>
                      <div style={{ width: 1, height: 32, background: c.border }} />
                      <div>
                        <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--inventory-low-text)', lineHeight: 1 }}>
                          {lowStockCount}
                        </div>
                        <div style={{ fontSize: '.68rem', color: 'var(--inventory-low-text)', marginTop: '.2rem', fontWeight: 500 }}>Low Stock</div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {/* ── LAST AGENT RUN SUMMARY + NEXT RUN LINE ────────────────────── */}
            <div style={{ ...s.card, marginBottom: '1.5rem' }} className="selora-card">
              {fetchingReports || fetchingLogs ? (
                <div>
                  <div style={{ height: 12, background: 'var(--bg-2)', borderRadius: 4, width: '28%', marginBottom: '.8rem' }} />
                  <div style={{ height: 18, background: 'var(--bg-2)', borderRadius: 4, width: '65%' }} />
                </div>
              ) : !latestReport ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '.72rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Last Agent Run</div>
                    <p style={{ color: c.muted, fontSize: '.88rem', fontWeight: 300 }}>No runs yet. Run the agent to see your first summary.</p>
                  </div>
                  <button style={s.btnP} onClick={runAgent} disabled={running}>
                    {running ? 'Agent Running...' : 'Run Agent Now'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>
                        Last Agent Run · {formatDate(latestReport.created_at)}
                      </div>
                      <p style={{ color: c.dark, fontSize: '.9rem', fontWeight: 400, lineHeight: 1.5 }}>
                        {buildSummaryLine()}
                      </p>
                    </div>
                    <Link to="/reports" style={{ fontSize: '.8rem', color: c.green, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      View Full Report →
                    </Link>
                  </div>
                  {/* Next run line */}
                  <div style={{ marginTop: '.85rem', paddingTop: '.75rem', borderTop: `1px solid ${c.border}`, fontSize: '.75rem', color: c.muted, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {getNextRunText(latestReport)}
                  </div>
                </>
              )}
            </div>

            {/* ── STAT CARDS (1d: real data wired) ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>

              <div style={s.mCard} className="selora-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <div style={s.mLbl}>Actions Taken</div>
                  <span style={{ color: c.green }}><IconSpark /></span>
                </div>
                <div style={s.mVal}>
                  {fetchingReports
                    ? <div style={{ height: 28, background: 'var(--bg-2)', borderRadius: 4, width: 40 }} />
                    : actionsTaken}
                </div>
              </div>

              <div style={s.mCard} className="selora-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <div style={s.mLbl}>Wins</div>
                  <span style={{ color: c.green }}><IconTrend /></span>
                </div>
                <div style={s.mVal}>
                  {fetchingReports
                    ? <div style={{ height: 28, background: 'var(--bg-2)', borderRadius: 4, width: 40 }} />
                    : winsCount}
                </div>
                {winsCount > 0 && <div style={{ fontSize: '.65rem', color: c.green, fontWeight: 600, marginTop: '.2rem' }}>↑ Growing</div>}
              </div>

              <div
                style={{ ...s.mCard, ...(concernCount > 0 ? { background: 'var(--inventory-low-bg)', borderColor: 'var(--inventory-low-text)' } : {}) }}
                className="selora-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <div style={{ ...s.mLbl, color: concernCount > 0 ? 'var(--inventory-low-text)' : c.muted }}>Concerns</div>
                  <span style={{ color: concernCount > 0 ? 'var(--inventory-low-text)' : c.muted }}><IconFlag /></span>
                </div>
                <div style={{ ...s.mVal, color: concernCount > 0 ? 'var(--inventory-low-text)' : c.dark }}>
                  {fetchingReports
                    ? <div style={{ height: 28, background: 'var(--bg-2)', borderRadius: 4, width: 40 }} />
                    : concernCount}
                </div>
                {concernCount > 0 && <div style={{ fontSize: '.65rem', color: 'var(--inventory-low-text)', fontWeight: 600, marginTop: '.2rem' }}>Needs attention</div>}
              </div>
            </div>

            {/* ── PRODUCT SPOTLIGHT — Recently Optimized (2c) ───────────────── */}
            {recentlyOptimized.length > 0 && (
              <div style={{ ...s.card, marginBottom: '1.5rem' }}>
                <div style={{ ...s.cardTit }}>Recently Optimized</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {recentlyOptimized.map(({ log, prod }) => (
                    <div
                      key={log.id || prod.id}
                      className="spotlight-card"
                      onClick={() => navigate(`/products/${prod.id}`)}
                    >
                      <div style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-2)', flexShrink: 0 }}>
                        {prod.image_url
                          ? <img src={getOptimizedImageUrl(prod.image_url, 108)} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>👗</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.title}
                        </div>
                        <div style={{ fontSize: '.75rem', color: c.muted, marginTop: '.2rem', lineHeight: 1.4 }}>
                          {log.data?.reason || log.reason || log.data?.change || 'Listing optimized by Selora'}
                        </div>
                      </div>
                      <div style={{ fontSize: '.68rem', color: c.muted, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: '.15rem' }}>
                        {formatTimeShort(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NEEDS YOUR ATTENTION ──────────────────────────────────────── */}
            {hasFlags && (
              <div style={{ ...s.card, marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ ...s.cardTit, marginBottom: 0 }}>Needs Your Attention</div>
                  {allFlagged.length > 4 && (
                    <Link to="/products" style={{ fontSize: '.75rem', color: c.green, textDecoration: 'none', fontWeight: 600 }}>
                      View all {allFlagged.length} flagged →
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {flaggedSlice.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => navigate(`/products/${prod.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem', background: 'var(--bg-0)', border: `1px solid ${c.border}`, borderRadius: 10, cursor: 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--inventory-low-text)'; e.currentTarget.style.background = 'var(--inventory-low-bg)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = 'var(--bg-0)' }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-2)', flexShrink: 0 }}>
                        {prod.image_url
                          ? <img src={getOptimizedImageUrl(prod.image_url, 96)} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👗</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.title}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--inventory-low-text)', marginTop: '.15rem', fontWeight: 500 }}>{getFlagReason(prod)}</div>
                      </div>
                      <button
                        style={{ background: 'none', border: '1px solid var(--inventory-low-text)', color: 'var(--inventory-low-text)', padding: '.3rem .8rem', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                        onClick={e => { e.stopPropagation(); navigate(`/products/${prod.id}`) }}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIVE COLLECTION ─────────────────────────────────────────── */}
            <div
              style={{ ...s.card, overflow: 'hidden', padding: '1.4rem 1.6rem' }}
              className="selora-card"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ ...s.cardTit, marginBottom: 0 }}>Active Collection</div>
                  {!fetchingProducts && products.length > 0 && (
                    <span style={{ fontSize: '.65rem', fontWeight: 700, background: 'var(--bg-2)', color: c.muted, padding: '.15rem .55rem', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {products.length} products
                    </span>
                  )}
                </div>
                <Link to="/products" style={{ fontSize: '.75rem', color: c.green, textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
              </div>

              {fetchingProducts ? (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ border: `1px solid ${c.border}`, borderRadius: 10, background: 'var(--bg-1)', width: 'calc(25% - .75rem)', flexShrink: 0, height: 210, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ aspectRatio: '1.15', width: '100%', background: 'var(--bg-2)' }} />
                      <div style={{ padding: '.65rem .8rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        <div style={{ height: 12, background: 'var(--bg-2)', borderRadius: 4, width: '80%' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ height: 12, background: 'var(--bg-2)', borderRadius: 4, width: '40%' }} />
                          <div style={{ height: 12, background: 'var(--bg-2)', borderRadius: 4, width: '30%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300 }}>No products found in this store.</p>
              ) : (
                <div style={{ overflow: 'hidden', width: '100%' }}>
                  <div style={{
                    display: 'flex', gap: '1rem',
                    transform: `translateX(calc(-${scrollIndex} * (25% + .25rem)))`,
                    transition: 'transform .7s cubic-bezier(.16,1,.3,1)',
                  }}>
                    {products.map((prod, index) => {
                      const flagged    = isFlagged(prod)
                      const hasInvBadge = prod.inventory < 10
                      return (
                        <div
                          key={prod.id}
                          onClick={() => navigate(`/products/${prod.id}`)}
                          style={{ border: `1px solid var(--border)`, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', width: 'calc(25% - .75rem)', flexShrink: 0 }}
                          className="selora-card"
                        >
                          <div style={{ aspectRatio: '1.15', width: '100%', overflow: 'hidden', background: 'var(--bg-2)', position: 'relative' }}>
                            {prod.image_url
                              ? <img src={getOptimizedImageUrl(prod.image_url, 300)} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: c.muted }}>👗</div>
                            }
                            {hasInvBadge && (
                              <span style={{ position: 'absolute', top: 6, left: 6, fontSize: '.55rem', fontWeight: 700, background: prod.inventory === 0 ? 'var(--inventory-empty-bg)' : 'var(--inventory-low-bg)', color: prod.inventory === 0 ? 'var(--inventory-empty-text)' : 'var(--inventory-low-text)', padding: '.12rem .35rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                {prod.inventory === 0 ? 'Out' : 'Low'}
                              </span>
                            )}
                            {flagged && !hasInvBadge && (
                              <span style={{ position: 'absolute', top: 6, right: 6, fontSize: '.55rem', fontWeight: 700, background: 'var(--inventory-low-bg)', color: 'var(--inventory-low-text)', padding: '.12rem .35rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                Review
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '.65rem .8rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '.2rem' }}>
                              {prod.title}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '.8rem', fontWeight: 700, color: c.dark }}>${parseFloat(prod.price).toFixed(2)}</span>
                              <span style={{ fontSize: '.65rem', color: c.muted }}>{prod.sales_last_30_days || 0} sold</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}