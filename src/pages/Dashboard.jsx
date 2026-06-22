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
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, `w=${width}`)
    }
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}w=${width}`
  }
  return url
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = {
  green: '#5F8D76', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const s = {
  page:    { minHeight:'100vh', background:'radial-gradient(circle at top right, rgba(95, 141, 118, 0.04), transparent 45%), radial-gradient(circle at bottom left, rgba(95, 141, 118, 0.02), transparent 45%), #F8FAF8', fontFamily:'Inter, sans-serif' },
  nav:     { background:c.card, borderBottom:`1px solid ${c.border}`, padding:'.9rem 2.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:    { fontFamily:'Fraunces, serif', fontSize:'1.1rem', fontWeight:600, color:c.dark, textDecoration:'none' },
  navRight:{ display:'flex', alignItems:'center', gap:'1rem' },
  email:   { fontSize:'.78rem', color:c.muted },
  signout: { fontSize:'.78rem', color:c.muted, background:'none', border:`1px solid ${c.border}`, padding:'.35rem .8rem', borderRadius:6, cursor:'pointer', fontFamily:'Inter, sans-serif' },
  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' },
  h1:      { fontFamily:'Fraunces, serif', fontSize:'1.8rem', fontWeight:500, color:c.dark, letterSpacing:'-.3px' },
  btnP:    { background:c.green, color:'#fff', border:'none', padding:'.65rem 1.4rem', borderRadius:8, fontSize:'.82rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', textDecoration:'none', display:'inline-block' },
  card:    { background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:'1.6rem', position:'relative', transition:'all 0.2s ease' },
  cardTit: { fontFamily:'Fraunces, serif', fontSize:'1rem', fontWeight:500, color:c.dark, marginBottom:'1rem' },
  metric:  { background:c.card, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.1rem' },
  mVal:    { fontFamily:'Fraunces, serif', fontSize:'1.5rem', fontWeight:500, color:c.dark, letterSpacing:'-.3px' },
  mLbl:    { fontSize:'.65rem', color:c.muted, textTransform:'uppercase', letterSpacing:'.08em', marginTop:'.2rem' },
  mChg:    { fontSize:'.7rem', color:c.green, fontWeight:600, marginTop:'.2rem' },
  tag:     { fontSize:'.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.12em', color:c.green, marginBottom:'.5rem' },
  logItem: { display:'flex', alignItems:'center', gap:'.6rem', padding:'.55rem .7rem', background:c.card, borderRadius:7, fontSize:'.78rem', border:`1px solid ${c.border}`, marginBottom:'.4rem', transition:'all 0.2s' },
  dot:     { width:5, height:5, borderRadius:'50%', background:c.green, flexShrink:0 },
  time:    { color:c.muted, fontSize:'.68rem', marginLeft:'auto' },
  store:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.2rem', background:c.card, borderRadius:10, border:`1px solid ${c.border}`, marginBottom:'.6rem', cursor:'pointer', transition:'all 0.2s' },
  badge:   { fontSize:'.65rem', fontWeight:600, background:'#DCFCE7', color:'#166534', padding:'.2rem .6rem', borderRadius:999, textTransform:'uppercase', letterSpacing:'.06em' },
  empty:   { textAlign:'center', padding:'3rem 1rem', color:c.muted, fontSize:'.88rem', fontWeight:300, lineHeight:1.7 },
  
  metricCard: {
    background: '#FFFFFF',
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    padding: '1.2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.25s ease',
  },
  metricValue: {
    fontFamily: 'Fraunces, serif',
    fontSize: '1.8rem',
    fontWeight: 400,
    color: c.dark,
    margin: '.3rem 0',
  },
  metricLabel: {
    fontSize: '.68rem',
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontWeight: 600,
  },
  metricChange: {
    fontSize: '.72rem',
    fontWeight: 500,
  },
  actionItem: {
    background: '#FFFFFF',
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: '1rem',
    transition: 'all 0.25s ease',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '.82rem',
    marginBottom: '.4rem',
  },
  actionBadge: {
    fontSize: '.68rem',
    fontWeight: 600,
    background: '#F1F4F2',
    color: c.green,
    padding: '.2rem .5rem',
    borderRadius: 4,
  },
  actionBody: {
    fontSize: '.78rem',
    color: c.muted,
    lineHeight: 1.4,
  }
}

const GlobalStyles = () => (
  <style>{`
    .selora-card {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .selora-card:hover {
      transform: translateY(-3px);
      border-color: #5F8D76 !important;
      box-shadow: 0 8px 24px rgba(95, 141, 118, 0.06) !important;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
    }
    .pdot {
      animation: pulse 2s infinite;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
)

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, stores, activeStore, setActiveStore, loading, products, fetchingProducts, fetchProducts } = useAppContext()
  const { sendMessage, setOpen } = useChat()
  const [logs, setLogs]         = useState([])
  const [reports, setReports]   = useState([])
  const [fetchingLogs, setFetchingLogs] = useState(false)
  const [fetchingReports, setFetchingReports] = useState(false)
  const [running, setRunning]   = useState(false)
  const [scrollIndex, setScrollIndex] = useState(0)
  const [isHovered, setIsHovered]     = useState(false)

  // Redirect to pricing checkout if plan parameter is specified
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const plan = searchParams.get('plan')
    if (plan && plan !== 'free') {
      navigate(`/pricing?plan=${plan}`, { replace: true })
    }
  }, [navigate])

  // ── Fetch logs and reports when active store changes ───────────
  useEffect(() => {
    if (activeStore) {
      fetchLogs(activeStore.id)
      fetchReports(activeStore.id)
      setScrollIndex(0)
    } else {
      setLogs([])
      setReports([])
      setScrollIndex(0)
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
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingLogs(false)
    }
  }

  const fetchReports = async (storeId) => {
    setFetchingReports(true)
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/reports`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingReports(false)
    }
  }

  // ── Autoplay product rotation carousel ──────────────────────────────────────
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

  // ── Run agent ───────────────────────────────────────────────────────────────
  const runAgent = async () => {
    if (!activeStore) return
    setRunning(true)
    try {
      await fetch(`${API_URL}/api/agent/run/${activeStore.id}?dry_run=false`, { method:'POST' })
      setTimeout(() => {
        fetchLogs(activeStore.id)
        fetchReports(activeStore.id)
        fetchProducts(activeStore.id, true)
        setRunning(false)
      }, 6000)
    } catch (e) {
      console.error(e)
      setRunning(false)
    }
  }

  const handleUpgrade = () => {
    navigate('/pricing')
  }

  const formatAction = (log) => {
    const type = log.action_type
    const data = log.data || {}
    const pName = data.product_title || data.product_name || log.reason || ''
    
    const map = {
      reprice_product: pName ? `Repriced ${pName}` : 'Repriced product',
      optimize_listing: pName ? `Optimized listing for ${pName}` : 'Optimized listing',
      restock_alert: pName ? `Restock alert: ${pName}` : 'Restock alert',
      generate_report: 'Generated daily growth report',
    }
    return map[type] || type
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div style={{...s.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <p style={{color:c.muted, fontSize:'.9rem'}}>Loading your dashboard...</p>
      </div>
    )
  }

  const latestReport = reports[0] || null

  return (
    <div style={s.page}>
      <GlobalStyles />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h1 style={s.h1}>
              {getGreeting()}, {user?.user_metadata?.name || 'Seller'} 👋
            </h1>
            <p style={{fontSize:'.85rem', color:c.muted, marginTop:'.3rem', fontWeight:300}}>
              {activeStore ? (activeStore.shop_url ? `Connected to ${activeStore.shop_name} (${activeStore.shop_url})` : `Hosting native store: ${activeStore.shop_name}`) : 'Set up a store to get started'}
            </p>
          </div>
          <div style={{display:'flex', gap:'.8rem', flexWrap:'wrap'}}>
            {activeStore && (
              <button
                style={{...s.btnP, background:running?'#7B907D':c.green}}
                onClick={runAgent}
                disabled={running}
              >
                {running ? 'Agent running...' : 'Run Agent Now'}
              </button>
            )}
            <Link to="/connect" style={{...s.btnP, background:'transparent', color:c.green, border:`1px solid ${c.green}`}}>
              + Set Up Store
            </Link>
          </div>
        </div>

        {/* NO STORES STATE */}
        {stores.length === 0 && (
          <div style={{...s.card, ...s.empty}}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🌱</div>
            <h2 style={{fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:500, color:c.dark, marginBottom:'.5rem'}}>
              No store set up yet
            </h2>
            <p style={{marginBottom:'1.5rem', fontWeight:300}}>
              Connect your Shopify store or launch a new native storefront, and Selora will start growing it tonight.
            </p>
            <Link to="/connect" style={s.btnP}>Set Up Your Store →</Link>
          </div>
        )}

        {/* STORE SELECTED STATE */}
        {stores.length > 0 && !activeStore && (
          <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 500, color: c.dark, marginBottom: '.5rem' }}>
              Select a Store
            </h2>
            <p style={{ color: c.muted, marginBottom: '1.5rem', fontWeight: 300 }}>
              Please select a store from the list to view its growth analytics and activity logs.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {stores.map(s => (
                <button key={s.id} onClick={() => setActiveStore(s)} style={s.btnP}>
                  {s.shop_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeStore && (
          <>
            {/* 2. ACTIVE COLLECTION CAROUSEL (COMPACT) */}
            <div 
              style={{ ...s.card, marginBottom: '1.5rem', overflow: 'hidden', padding: '1.4rem 1.6rem' }} 
              className="selora-card"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ ...s.cardTit, marginBottom: 0 }}>Active Collection</div>
                <Link to="/products" style={{ fontSize: '.75rem', color: c.green, textDecoration: 'none', fontWeight: 600 }}>View catalog →</Link>
              </div>
              {fetchingProducts ? (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} style={{ border: `1px solid ${c.border}`, borderRadius: 10, background: '#fff', width: 'calc(25% - 0.75rem)', flexShrink: 0, height: 210, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ aspectRatio: '1.15', width: '100%', background: '#F1F4F2' }} />
                      <div style={{ padding: '.65rem .8rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        <div style={{ height: 12, background: '#F1F4F2', borderRadius: 4, width: '80%' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ height: 12, background: '#F1F4F2', borderRadius: 4, width: '40%' }} />
                          <div style={{ height: 12, background: '#F1F4F2', borderRadius: 4, width: '30%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300 }}>No products found in this store.</p>
              ) : (
                <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    transform: `translateX(calc(-${scrollIndex} * (25% + 0.25rem)))`, 
                    transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    {products.map((prod, index) => (
                      <div 
                        key={prod.id} 
                        onClick={() => navigate(`/products/${prod.id}`)}
                        style={{ 
                          border: `1px solid ${c.border}`, 
                          borderRadius: 10, 
                          overflow: 'hidden', 
                          background: '#fff', 
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          width: 'calc(25% - 0.75rem)',
                          flexShrink: 0,
                        }}
                        className="selora-card"
                      >
                        <div style={{ aspectRatio: '1.15', width: '100%', overflow: 'hidden', background: '#F1F4F2', position: 'relative' }}>
                          {prod.image_url ? (
                            <img 
                              src={getOptimizedImageUrl(prod.image_url, 300)} 
                              alt={prod.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              fetchPriority={index === 0 ? "high" : "auto"}
                              loading={index === 0 ? "eager" : "lazy"}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: c.muted }}>
                              👗
                            </div>
                          )}
                          {prod.inventory < 10 && (
                            <span style={{ 
                              position: 'absolute', 
                              top: 6, 
                              left: 6, 
                              fontSize: '.55rem', 
                              fontWeight: 700, 
                              background: prod.inventory === 0 ? '#FEF2F2' : '#FFFBEB', 
                              color: prod.inventory === 0 ? '#DC2626' : '#D97706', 
                              padding: '.12rem .35rem', 
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              letterSpacing: '.05em'
                            }}>
                              {prod.inventory === 0 ? 'Out' : 'Low'}
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '.65rem .8rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '.2rem' }}>
                            {prod.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '.8rem', fontWeight: 700, color: c.dark }}>
                              ${parseFloat(prod.price).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '.65rem', color: c.muted }}>
                              {prod.sales_last_30_days || 0} sold
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. METRICS GRID */}
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem'}}>
                <div style={{ ...s.metricCard, padding: '1rem' }} className="selora-card">
                  <div style={{ ...s.metricValue, fontSize: '1.4rem' }}>
                    {fetchingReports ? (
                      <div style={{ height: 24, background: '#F1F4F2', borderRadius: 4, width: 40, margin: '.3rem 0' }} />
                    ) : (
                      latestReport?.actions_taken?.length || 0
                    )}
                  </div>
                  <div style={{ ...s.metricLabel, fontSize: '.62rem' }}>Actions Taken</div>
                </div>
                <div style={{ ...s.metricCard, padding: '1rem' }} className="selora-card">
                  <div style={{ ...s.metricValue, fontSize: '1.4rem' }}>
                    {fetchingReports ? (
                      <div style={{ height: 24, background: '#F1F4F2', borderRadius: 4, width: 40, margin: '.3rem 0' }} />
                    ) : (
                      latestReport?.wins?.length || 0
                    )}
                  </div>
                  <div style={{ ...s.metricLabel, fontSize: '.62rem' }}>Wins</div>
                  <div style={{ fontSize: '.65rem', color: c.green, fontWeight: 600, marginTop: '.2rem' }}>↑ Growing</div>
                </div>
                <div style={{ ...s.metricCard, padding: '1rem' }} className="selora-card">
                  <div style={{ ...s.metricValue, fontSize: '1.4rem' }}>
                    {fetchingReports ? (
                      <div style={{ height: 24, background: '#F1F4F2', borderRadius: 4, width: 40, margin: '.3rem 0' }} />
                    ) : (
                      latestReport?.concerns?.length || 0
                    )}
                  </div>
                  <div style={{ ...s.metricLabel, fontSize: '.62rem' }}>Concerns</div>
                </div>
              </div>
            </div>

            {/* 4. TWO COLUMNS (1fr 1fr - EQUAL WIDTH) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* LEFT COLUMN: AGENT ACTIVITY */}
              <div style={s.card} className="selora-card">
                <div style={{ ...s.cardTit, marginBottom: '1rem' }}>Agent Activity</div>
                {fetchingLogs ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} style={{ ...s.logItem, margin: 0, padding: '.5rem .6rem', height: 35 }}>
                        <div style={s.dot} />
                        <div style={{ height: 12, background: '#F1F4F2', borderRadius: 4, width: '60%' }} />
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300, lineHeight: 1.7 }}>
                    No activity yet. Run the agent to see what Selora does to your store.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {logs.slice(0, 10).map((log, i) => (
                      <div key={i} style={{ ...s.logItem, margin: 0, padding: '.5rem .6rem' }}>
                        <div style={s.dot} />
                        <span style={{ flex: 1, color: c.dark, fontSize: '.78rem' }}>
                          {formatAction(log)}
                        </span>
                        <span style={s.time}>{formatTime(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: LATEST GROWTH REPORT */}
              <div style={s.card} className="selora-card">
                <div style={{ ...s.cardTit, marginBottom: '1rem' }}>Latest Growth Report</div>
                {fetchingReports ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                    <div style={{ height: 14, background: '#F1F4F2', borderRadius: 4, width: '100%' }} />
                    <div style={{ height: 14, background: '#F1F4F2', borderRadius: 4, width: '95%' }} />
                    <div style={{ height: 14, background: '#F1F4F2', borderRadius: 4, width: '70%' }} />
                  </div>
                ) : !latestReport ? (
                  <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300, lineHeight: 1.7 }}>
                    No reports yet. Run the agent to generate your first growth report.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: '.8rem', color: c.dark, lineHeight: 1.5, fontWeight: 300, marginBottom: '1rem' }}>
                      {latestReport.summary}
                    </p>

                    {latestReport.wins?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: c.green, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Wins</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                          {latestReport.wins.map((w, i) => (
                            <div key={i} style={{ ...s.logItem, borderLeft: `2px solid ${c.green}`, borderRadius: '0 6px 6px 0', margin: 0, padding: '.45rem .6rem' }}>
                              <span style={{ color: c.dark, fontSize: '.78rem' }}>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {latestReport.concerns?.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Concerns</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                          {latestReport.concerns.map((con, i) => (
                            <div key={i} style={{ ...s.logItem, borderLeft: '2px solid #D97706', borderRadius: '0 6px 6px 0', margin: 0, padding: '.45rem .6rem' }}>
                              <span style={{ color: c.dark, fontSize: '.78rem' }}>{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </>
        )}



      </div>
    </div>
  )
}