import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'

// ─── Constants & Styles ──────────────────────────────────────────────────────
const c = {
  g: 'var(--g)', g2: 'var(--g2)', gpale: 'var(--gpale)',
  bg: 'var(--bg)', bg2: 'var(--bg2)',
  border: 'var(--border)', dark: 'var(--dark)', text: 'var(--text)', muted: 'var(--muted)',
  card: 'var(--card-bg)',
}

// ─── SVG Icons (No Emojis) ───────────────────────────────────────────────────
function ShopifyIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function WooCommerceIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

// ─── Timeline icons ───
function LeafIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5.6 9.8A7 7 0 0 1 11 20z" />
      <path d="M19 2c-2.26 4.33-5.27 7.14-8 8" />
    </svg>
  )
}

function TrendUpIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function RocketIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
      <path d="M12 2C6 2 2 6 2 12c0 2.5 1.5 4.5 3.5 5.5l1.5-1.5C6.5 15.5 6 14 6 12c0-3.5 2.5-6 6-6s6 2.5 6 6c0 2-.5 3.5-1 4l1.5 1.5c2-1 3.5-3 3.5-5.5 0-6-4-10-10-10z" />
      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  )
}

function CheckIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function InventoryIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function AdIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M23 9c0 2.5-2 4.5-4.5 4.5" />
      <path d="M19 12c0 1.5-1 2.5-2.5 2.5" />
    </svg>
  )
}

function SparklesIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5z" />
    </svg>
  )
}

function TargetIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function ChevronDownIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ transition: 'transform 0.25s ease', ...style }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Reveal Animation Component ──────────────────────────────────────────────
function Reveal({ children, delay = 0, duration = 600, offset = 16, style = {} }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setIsVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : `translateY(${offset}px)`,
      transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      willChange: 'transform, opacity', ...style
    }}>{children}</div>
  );
}

// ─── Navigation Header ───────────────────────────────────────────────────────
function PageNav() {
  const { user } = useAppContext()
  const [darkMode, toggleTheme] = useDarkMode()
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 3.5rem',background:'var(--nav-bg)',backdropFilter:'blur(14px)',borderBottom:`1px solid var(--border)`,fontFamily:'Inter,sans-serif'}}>
      <Link to="/" style={{fontFamily:'Inter,sans-serif',fontSize:'1.2rem',fontWeight:700,letterSpacing:'-.3px',color:'var(--dark)',textDecoration:'none'}}>
        Se<span style={{color:'var(--g)'}}>lo</span>ra
      </Link>
      <div style={{display:'flex',gap:'2rem',alignItems:'center',fontSize:'.82rem'}}>
        <Link to="/features" className="cn-nav-link" style={{color:'var(--nav-link)',textDecoration:'none',fontWeight:500}}>Features</Link>
        <Link to="/how-it-works" style={{fontWeight:600,color:'var(--dark)',textDecoration:'none',borderBottom:`2px solid var(--g)`,paddingBottom:'.15rem'}}>How It Works</Link>
        <Link to="/pricing" className="cn-nav-link" style={{color:'var(--nav-link)',textDecoration:'none',fontWeight:500}}>Pricing</Link>
        <Link to="/demo" style={{color:'var(--g)',textDecoration:'none',fontWeight:500}}>Book a Demo</Link>
      </div>
      <div style={{display:'flex',gap:'.7rem',alignItems:'center'}}>
        <button
          className="cn-theme-toggle"
          onClick={toggleTheme}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:".25rem",borderRadius:6}}
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        {user ? (
          <Link to="/dashboard" style={{background:'var(--g)',color:'#fff',padding:'.5rem 1.3rem',borderRadius:7,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="cn-nav-link" style={{fontSize:'.82rem',fontWeight:500,color:'var(--nav-link)',textDecoration:'none'}}>Sign In</Link>
            <Link to="/signup" style={{background:'var(--g)',color:'#fff',padding:'.5rem 1.3rem',borderRadius:7,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── Shopify Connect Demo (Step 1) ───────────────────────────────────────────
function ShopifyConnectDemo({ c }) {
  const { user, activeStore, products } = useAppContext()
  const [activeTab, setActiveTab] = useState('shopify')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('typing')
  const [productsSynced, setProductsSynced] = useState(0)
  const [stepCheck, setStepCheck] = useState({ products: false, orders: false, ready: false })

  // Native store preview states
  const [nativeName, setNativeName] = useState('')
  const [nativeHandle, setNativeHandle] = useState('')
  const [nativeStatus, setNativeStatus] = useState('typing')
  const [selectedTheme, setSelectedTheme] = useState('sage')

  const hasRealStore = !!(user && activeStore)
  const targetUrl = hasRealStore ? (activeStore.shop_url || 'your-brand.myshopify.com') : 'your-brand.myshopify.com'
  const displayProductCount = (hasRealStore && products && products.length > 0) ? products.length : 1248

  const targetName = 'Verdant Label'
  const targetHandle = 'verdant-label'

  useEffect(() => {
    let active = true
    let timeouts = []
    let interval = null

    const runShopifySequence = async () => {
      setStatus('typing')
      setUrl('')
      setProductsSynced(0)
      setStepCheck({ products: false, orders: false, ready: false })

      for (let i = 0; i <= targetUrl.length; i++) {
        if (!active) return
        await new Promise(r => {
          const t = setTimeout(r, 60 + Math.random() * 40)
          timeouts.push(t)
        })
        setUrl(targetUrl.slice(0, i))
      }

      if (!active) return
      await new Promise(r => {
        const t = setTimeout(r, 800)
        timeouts.push(t)
      })

      if (!active) return
      setStatus('connecting')
      await new Promise(r => {
        const t = setTimeout(r, 1800)
        timeouts.push(t)
      })

      if (!active) return
      setStatus('connected')

      const start = Date.now()
      const duration = 1200

      await new Promise(r => {
        interval = setInterval(() => {
          const elapsed = Date.now() - start
          if (elapsed >= duration) {
            setProductsSynced(displayProductCount)
            clearInterval(interval)
            r()
          } else {
            const val = Math.floor((elapsed / duration) * displayProductCount)
            setProductsSynced(val)
          }
        }, 30)
      })

      if (!active) return
      setStepCheck(prev => ({ ...prev, products: true }))

      await new Promise(r => {
        const t = setTimeout(r, 400)
        timeouts.push(t)
      })
      if (!active) return
      setStepCheck(prev => ({ ...prev, orders: true }))

      await new Promise(r => {
        const t = setTimeout(r, 400)
        timeouts.push(t)
      })
      if (!active) return
      setStepCheck(prev => ({ ...prev, ready: true }))

      await new Promise(r => {
        const t = setTimeout(r, 6000)
        timeouts.push(t)
      })

      if (!active) return
      runShopifySequence()
    }

    const runNativeSequence = async () => {
      setNativeStatus('typing')
      setNativeName('')
      setNativeHandle('')

      await new Promise(r => {
        const t = setTimeout(r, 600)
        timeouts.push(t)
      })

      // Type name
      for (let i = 0; i <= targetName.length; i++) {
        if (!active) return
        await new Promise(r => {
          const t = setTimeout(r, 40 + Math.random() * 20)
          timeouts.push(t)
        })
        setNativeName(targetName.slice(0, i))
      }

      // Type handle
      for (let i = 0; i <= targetHandle.length; i++) {
        if (!active) return
        await new Promise(r => {
          const t = setTimeout(r, 30 + Math.random() * 15)
          timeouts.push(t)
        })
        setNativeHandle(targetHandle.slice(0, i))
      }

      await new Promise(r => {
        const t = setTimeout(r, 800)
        timeouts.push(t)
      })

      if (!active) return
      setNativeStatus('creating')
      
      await new Promise(r => {
        const t = setTimeout(r, 1500)
        timeouts.push(t)
      })

      if (!active) return
      setNativeStatus('created')

      await new Promise(r => {
        const t = setTimeout(r, 6000)
        timeouts.push(t)
      })

      if (!active) return
      runNativeSequence()
    }

    if (activeTab === 'shopify') {
      runShopifySequence()
    } else {
      runNativeSequence()
    }

    return () => {
      active = false
      timeouts.forEach(t => clearTimeout(t))
      if (interval) clearInterval(interval)
    }
  }, [activeTab, displayProductCount, targetUrl])

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      {/* Title block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem' }}>
        <div style={{ background: c.gpale, padding: '.5rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShopifyIcon size={20} color={c.g} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Shopify Integration</div>
          <div style={{ fontSize: '.72rem', color: c.muted }}>Link your store in one click</div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{
        display: 'flex',
        background: c.bg2,
        borderRadius: 8,
        padding: '2px',
        marginBottom: '1.2rem',
        border: `1px solid ${c.border}`
      }}>
        <button
          onClick={() => setActiveTab('shopify')}
          type="button"
          style={{
            flex: 1,
            padding: '.4rem',
            border: 'none',
            background: activeTab === 'shopify' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'shopify' ? c.dark : c.muted,
            fontSize: '.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: 'Inter,sans-serif',
            transition: 'all 0.2s'
          }}
        >
          Connect Shopify
        </button>
        <button
          onClick={() => setActiveTab('native')}
          type="button"
          style={{
            flex: 1,
            padding: '.4rem',
            border: 'none',
            background: activeTab === 'native' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'native' ? c.dark : c.muted,
            fontSize: '.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: 'Inter,sans-serif',
            transition: 'all 0.2s'
          }}
        >
          Create New Store
        </button>
      </div>

      {/* Shopify Integration Tab Content */}
      {activeTab === 'shopify' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {(status === 'typing' || status === 'connecting') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  readOnly
                  value={url}
                  style={{
                    width: '100%', padding: '.7rem .9rem', borderRadius: 8, border: `1px solid ${status === 'connecting' ? c.g : c.border}`,
                    fontSize: '.82rem', fontFamily: 'Inter,sans-serif', outline: 'none', background: 'var(--input-bg)',
                    color: c.dark, boxSizing: 'border-box'
                  }}
                />
                {status === 'typing' && (
                  <span className="caret-blink" style={{
                    position: 'absolute', left: `${url.length * 7.2 + 18}px`, top: '12px',
                    width: '2px', height: '14px', background: c.g
                  }} />
                )}
              </div>
              <button 
                type="button"
                style={{
                  background: status === 'connecting' ? c.gpale : c.g, 
                  color: status === 'connecting' ? c.g : '#fff', 
                  border: 'none', borderRadius: 8, padding: '.7rem',
                  fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem'
                }}
              >
                {status === 'connecting' ? (
                  <>
                    <span className="spin-spinner" style={{
                      width: 14, height: 14, border: `2px solid ${c.gpale}`, borderTop: `2px solid ${c.g}`,
                      borderRadius: '50%'
                    }} />
                    Connecting...
                  </>
                ) : 'Connect Store'}
              </button>
            </div>
          )}

          {status === 'connected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ background: c.gpale, border: `1px solid ${c.border}`, borderRadius: 8, padding: '.8rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ color: c.g, display: 'flex', alignItems: 'center' }}>
                  <CheckIcon size={16} />
                </div>
                <div style={{ fontSize: '.78rem', color: c.dark, fontWeight: 500, textAlign: 'left' }}>
                  Connected to <span style={{ fontWeight: 600 }}>{url}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark, opacity: stepCheck.products ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  <span style={{ color: stepCheck.products ? c.g : c.muted }}>{stepCheck.products ? '✓' : '○'}</span>
                  <span>{productsSynced.toLocaleString()} Products Synced</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark, opacity: stepCheck.orders ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  <span style={{ color: stepCheck.orders ? c.g : c.muted }}>{stepCheck.orders ? '✓' : '○'}</span>
                  <span>Order History Imported</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark, opacity: stepCheck.ready ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  <span style={{ color: stepCheck.ready ? c.g : c.muted }}>{stepCheck.ready ? '✓' : '○'}</span>
                  <span>Agent Status: <span style={{ color: c.g, fontWeight: 600 }}>Ready</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Native Storefront Setup Tab Content */}
      {activeTab === 'native' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem', animation: 'fadeUp 0.3s ease both' }}>
          {(nativeStatus === 'typing' || nativeStatus === 'creating') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '.68rem', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '.25rem' }}>Store Name</label>
                <input 
                  type="text" 
                  readOnly
                  value={nativeName}
                  style={{
                    width: '100%', padding: '.55rem .7rem', borderRadius: 8, border: `1px solid ${c.border}`,
                    fontSize: '.78rem', fontFamily: 'Inter,sans-serif', outline: 'none', background: 'var(--input-bg)',
                    color: c.dark, boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '.68rem', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '.25rem' }}>Store Domain</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    readOnly
                    value={nativeHandle}
                    style={{
                      flex: 1, padding: '.55rem .7rem', borderRadius: '8px 0 0 8px', border: `1px solid ${c.border}`,
                      borderRight: 'none', fontSize: '.78rem', fontFamily: 'Inter,sans-serif', outline: 'none',
                      background: 'var(--input-bg)', color: c.dark, boxSizing: 'border-box', minWidth: 0
                    }}
                  />
                  <span style={{
                    padding: '.55rem .7rem', background: c.bg2, border: `1px solid ${c.border}`,
                    borderRadius: '0 8px 8px 0', fontSize: '.72rem', color: c.muted, fontWeight: 500
                  }}>
                    .selora.co
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '.68rem', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '.35rem' }}>Store Theme</label>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  {[
                    { id: 'sage', label: 'Sage Minimal', color: '#5A8A67' },
                    { id: 'onyx', label: 'Warm Onyx', color: '#1A271C' },
                    { id: 'silk', label: 'Silk Ivory', color: '#F4EBE1' }
                  ].map(t => {
                    const isSelected = selectedTheme === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        type="button"
                        style={{
                          flex: 1, padding: '.4rem', borderRadius: 6, border: `1px solid ${isSelected ? c.g : c.border}`,
                          background: isSelected ? c.gpale : c.card, color: c.dark, fontSize: '.68rem',
                          cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.3rem'
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '.62rem', fontWeight: isSelected ? 600 : 400 }}>{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="button"
                style={{
                  background: nativeStatus === 'creating' ? c.gpale : c.g, 
                  color: nativeStatus === 'creating' ? c.g : '#fff', 
                  border: 'none', borderRadius: 8, padding: '.65rem',
                  fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                  marginTop: '.4rem'
                }}
              >
                {nativeStatus === 'creating' ? (
                  <>
                    <span className="spin-spinner" style={{
                      width: 14, height: 14, border: `2px solid ${c.gpale}`, borderTop: `2px solid ${c.g}`,
                      borderRadius: '50%'
                    }} />
                    Creating Storefront...
                  </>
                ) : 'Launch Storefront'}
              </button>
            </div>
          )}

          {nativeStatus === 'created' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ background: c.gpale, border: `1px solid ${c.border}`, borderRadius: 8, padding: '.8rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ color: c.g, display: 'flex', alignItems: 'center' }}>
                  <CheckIcon size={16} />
                </div>
                <div style={{ fontSize: '.78rem', color: c.dark, fontWeight: 500, textAlign: 'left' }}>
                  Storefront Launched Successfully!
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark }}>
                  <span style={{ color: c.g }}>✓</span>
                  <span>Domain: <span style={{ fontWeight: 600 }}>{targetHandle}.selora.co</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark }}>
                  <span style={{ color: c.g }}>✓</span>
                  <span>Theme Applied: <span style={{ fontWeight: 600 }}>Sage Minimal</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: c.dark }}>
                  <span style={{ color: c.g }}>✓</span>
                  <span>Agent Sync Status: <span style={{ color: c.g, fontWeight: 600 }}>Ready & Scanning</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Goals Setup Demo (Step 2) ───────────────────────────────────────────────
function GoalsSetupDemo({ c }) {
  const [selected, setSelected] = useState([])
  const [typedText, setTypedText] = useState('')
  const [phase, setPhase] = useState(0)

  const summaryText = "Selora will prioritize revenue growth while maintaining healthy profit margins."

  useEffect(() => {
    let active = true
    let timeouts = []

    const runSequence = async () => {
      if (!active) return
      setSelected([])
      setTypedText('')
      setPhase(0)

      await new Promise(r => {
        const t = setTimeout(r, 1200)
        timeouts.push(t)
      })

      if (!active) return
      setPhase(1)
      setSelected(['rev'])

      await new Promise(r => {
        const t = setTimeout(r, 1000)
        timeouts.push(t)
      })

      if (!active) return
      setPhase(2)
      setSelected(['rev', 'margin'])

      await new Promise(r => {
        const t = setTimeout(r, 1200)
        timeouts.push(t)
      })

      if (!active) return
      setPhase(3)
      for (let i = 0; i <= summaryText.length; i++) {
        if (!active) return
        await new Promise(r => {
          const t = setTimeout(r, 35)
          timeouts.push(t)
        })
        setTypedText(summaryText.slice(0, i))
      }

      if (!active) return
      setPhase(4)

      await new Promise(r => {
        const t = setTimeout(r, 6000)
        timeouts.push(t)
      })

      if (!active) return
      runSequence()
    }

    runSequence()

    return () => {
      active = false
      timeouts.forEach(t => clearTimeout(t))
    }
  }, [])

  const goals = [
    { id: 'rev', label: 'Maximize Total Revenue', icon: <TrendUpIcon size={18} />, desc: 'Prioritizes sales volume and store traffic.' },
    { id: 'margin', label: 'Improve Profit Margins', icon: <TargetIcon size={18} />, desc: 'Focuses on higher margins and price optimization.' },
    { id: 'inv', label: 'Clear Slow Inventory', icon: <InventoryIcon size={18} />, desc: 'Reduces prices of slow-moving items.' },
    { id: 'ad', label: 'Optimize Ad Budget', icon: <AdIcon size={18} />, desc: 'Reallocates ad dollars away from failing items.' }
  ]

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.6rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark, marginBottom: '.3rem', textAlign: 'left' }}>Tailor Agent Objectives</div>
      <div style={{ fontSize: '.72rem', color: c.muted, marginBottom: '1rem', textAlign: 'left' }}>Toggle goals to customize Selora's nightly algorithms</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.2rem' }}>
        {goals.map((g, idx) => {
          const isActive = selected.includes(g.id)
          return (
            <div 
              key={g.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.7rem 1rem',
                borderRadius: 10, 
                border: `1px solid ${isActive ? c.g : c.border}`,
                background: isActive ? c.gpale : c.bg2, 
                transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: isActive ? '0 4px 12px rgba(90,138,103,0.1)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: `fadeUp 0.4s ease both ${idx * 0.1}s`
              }}
            >
              <div style={{ color: isActive ? c.g : c.muted, display: 'flex', alignItems: 'center' }}>
                {g.icon}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: c.dark }}>{g.label}</div>
                <div style={{ fontSize: '.62rem', color: c.muted, fontWeight: 300 }}>{g.desc}</div>
              </div>
              <div style={{
                width: 16, height: 16, borderRadius: 4, border: `1px solid ${isActive ? c.g : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? c.g : c.card, color: '#fff', fontSize: '.6rem'
              }}>
                {isActive && <CheckIcon size={10} color="#fff" />}
              </div>
            </div>
          )
        })}
      </div>

      {(phase >= 3) && (
        <div style={{ 
          background: c.bg2, 
          borderRadius: 8, 
          padding: '.8rem 1rem', 
          border: `1px solid ${c.border}`, 
          fontSize: '.72rem', 
          color: c.text, 
          textAlign: 'left',
          animation: 'fadeUp 0.4s ease both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontWeight: 600, color: c.g, marginBottom: '.3rem' }}>
            <SparklesIcon size={14} color={c.g} />
            <span>AI Goal Alignment</span>
          </div>
          <div style={{ position: 'relative', minHeight: '34px', lineHeight: 1.5, color: c.dark }}>
            {typedText}
            {phase === 3 && (
              <span className="caret-blink" style={{
                display: 'inline-block', width: '2px', height: '12px', background: c.g, marginLeft: '2px', verticalAlign: 'middle'
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Morning Report Demo (Step 3) ────────────────────────────────────────────
function MorningReportDemo({ c }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [sales, setSales] = useState(0)

  const items = [
    { id: 1, action: 'Optimized listing copy', item: 'Silk Wrap Dress', reason: 'High summer search volume', icon: <SparklesIcon size={14} /> },
    { id: 2, action: 'Updated price to $89', item: 'Floral Maxi Dress', reason: 'Marginal elasticity analysis', icon: <TargetIcon size={14} /> },
    { id: 3, action: 'Shifted $20 ad budget', item: 'Linen Shorts', reason: 'High conversion, low stock risk', icon: <AdIcon size={14} /> },
    { id: 4, action: 'Replenishment alert', item: 'Leather Jacket', reason: 'Low stock velocity check', icon: <InventoryIcon size={14} /> }
  ]

  useEffect(() => {
    let active = true
    let timeouts = []
    let intervalRev = null
    let intervalSales = null

    const runSequence = async () => {
      if (!active) return
      setVisibleCount(0)
      setRevenue(0)
      setSales(0)

      for (let i = 1; i <= items.length; i++) {
        await new Promise(r => {
          const t = setTimeout(r, 800)
          timeouts.push(t)
        })
        if (!active) return
        setVisibleCount(i)
      }

      await new Promise(r => {
        const t = setTimeout(r, 400)
        timeouts.push(t)
      })

      if (!active) return

      const duration = 1200
      const start = Date.now()
      
      const p1 = new Promise(r => {
        intervalRev = setInterval(() => {
          const elapsed = Date.now() - start
          if (elapsed >= duration) {
            setRevenue(18)
            clearInterval(intervalRev)
            r()
          } else {
            setRevenue(Math.floor((elapsed / duration) * 18))
          }
        }, 30)
      })

      const p2 = new Promise(r => {
        intervalSales = setInterval(() => {
          const elapsed = Date.now() - start
          if (elapsed >= duration) {
            setSales(4850)
            clearInterval(intervalSales)
            r()
          } else {
            setSales(Math.floor((elapsed / duration) * 4850))
          }
        }, 30)
      })

      await Promise.all([p1, p2])

      await new Promise(r => {
        const t = setTimeout(r, 6000)
        timeouts.push(t)
      })

      if (!active) return
      runSequence()
    }

    runSequence()

    return () => {
      active = false
      timeouts.forEach(t => clearTimeout(t))
      if (intervalRev) clearInterval(intervalRev)
      if (intervalSales) clearInterval(intervalSales)
    }
  }, [])

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.6rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Overnight Growth Log</div>
          <div style={{ fontSize: '.72rem', color: c.muted }}>Review automated actions</div>
        </div>
        <div style={{ background: c.gpale, color: c.g, fontSize: '.68rem', padding: '.25rem .6rem', borderRadius: 20, fontWeight: 700 }}>
          {visibleCount} Actions
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.2rem', minHeight: '232px' }}>
        {items.map((item, idx) => {
          const isVisible = idx < visibleCount
          return (
            <div 
              key={item.id}
              style={{
                padding: '.7rem .9rem', 
                borderRadius: 10, 
                border: `1px solid ${c.border}`,
                background: c.bg2,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '.7rem',
                textAlign: 'left'
              }}
            >
              <div style={{ color: c.g, background: c.gpale, padding: '.35rem', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: c.dark }}>
                  {item.action} <span style={{ fontWeight: 400, color: c.muted }}>· {item.item}</span>
                </div>
                <div style={{ fontSize: '.62rem', color: c.muted, marginTop: '.1rem' }}>
                  {item.reason}
                </div>
              </div>
              <div style={{ color: c.g, display: 'flex', alignItems: 'center' }}>
                <CheckIcon size={14} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '.6rem', borderTop: `1px solid ${c.border}`, paddingTop: '1rem' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: c.dark }}>+{revenue}%</div>
          <div style={{ fontSize: '.58rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Daily Revenue</div>
        </div>
        <div style={{ width: 1, background: c.border }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: c.dark }}>${sales.toLocaleString()}</div>
          <div style={{ fontSize: '.58rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Sales Generated</div>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline Preview Cards ──────────────────────────────────────────────────
function Day1Preview({ c }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '0.8rem 1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
      fontSize: '.75rem',
      fontFamily: 'Inter,sans-serif',
      color: c.dark,
      width: '300px',
      minWidth: '300px',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
        <span>Connection Checklist</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: '#10B981', fontWeight: 500 }}>
          <span>✓</span> <span>Catalog mapped</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: '#10B981', fontWeight: 500 }}>
          <span>✓</span> <span>Diagnostics started</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: c.muted }}>
          <span className="spin-spinner" style={{ 
            width: 10, 
            height: 10, 
            border: `1.5px solid ${c.border}`, 
            borderTop: `1.5px solid ${c.g}`, 
            borderRadius: '50%',
            display: 'inline-block'
          }} />
          <span>Scan in progress</span>
        </div>
      </div>
    </div>
  )
}

function Day2Preview({ c }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '0.8rem 1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
      fontSize: '.75rem',
      fontFamily: 'Inter,sans-serif',
      color: c.dark,
      width: '300px',
      minWidth: '300px',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '.5rem', color: c.g, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        <SparklesIcon size={12} color={c.g} />
        <span>Price Optimization</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: '.72rem' }}>Linen Wrap Dress</div>
        <div style={{ color: c.muted, fontSize: '.65rem' }}>Original rate: Standard</div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '.3rem', 
          fontWeight: 600, 
          color: c.g, 
          background: c.gpale, 
          padding: '.2rem .5rem', 
          borderRadius: 4, 
          width: 'fit-content', 
          marginTop: '.3rem',
          fontSize: '.68rem'
        }}>
          <span>Price adjusted ↓</span>
        </div>
      </div>
    </div>
  )
}

function Day3Preview({ c }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '0.8rem 1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
      fontSize: '.75rem',
      fontFamily: 'Inter,sans-serif',
      color: c.dark,
      width: '300px',
      minWidth: '300px',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <AdIcon size={12} color={c.muted} />
        <span>Ad Budget Shift</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.68rem' }}>
          <span style={{ color: c.muted }}>Slow Sellers</span>
          <span style={{ color: '#EF4444', fontWeight: 500 }}>- Budget cut</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '.2rem 0', 
          color: c.g, 
          fontWeight: 600,
          fontSize: '.68rem',
          gap: '.2rem'
        }}>
          <span>Reallocated</span>
          <span>→</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.68rem' }}>
          <span style={{ fontWeight: 500 }}>Trending Maxi</span>
          <span style={{ color: '#10B981', fontWeight: 600 }}>+ Active push</span>
        </div>
      </div>
    </div>
  )
}

function Day4Preview({ c }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '0.8rem 1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
      fontSize: '.75rem',
      fontFamily: 'Inter,sans-serif',
      color: c.dark,
      width: '300px',
      minWidth: '300px',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '.4rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <RocketIcon size={12} color={c.g} />
        <span>Weekly Growth Report</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', fontSize: '.68rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: c.muted }}>Total Revenue:</span>
          <span style={{ color: '#10B981', fontWeight: 600 }}>Positive Growth</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: c.muted }}>Ad Spend waste:</span>
          <span style={{ color: '#10B981', fontWeight: 600 }}>Decreased</span>
        </div>
      </div>
    </div>
  )
}

// ─── First Week Milestone Timeline ──────────────────────────────────────────
function FirstWeekTimeline({ c }) {
  const milestones = [
    { 
      day: 'Day 1', 
      title: 'Store Connection & Sync', 
      text: 'Selora connects to your store, maps your entire collection, and begins deep diagnostic scans of listings, traffic, and prices.',
      icon: <LeafIcon size={16} /> 
    },
    { 
      day: 'Day 2', 
      title: 'First AI Optimizations', 
      text: 'The agent deploys initial price adjustments based on seasonal demand, and starts rewriting low-converting product descriptions.',
      icon: <SparklesIcon size={16} /> 
    },
    { 
      day: 'Day 3–4', 
      title: 'Active Ad Allocation', 
      text: 'Selora begins shifting advertising budget from underperforming items to active trendsetters to prevent wasted ad spend.',
      icon: <TrendUpIcon size={16} /> 
    },
    { 
      day: 'Day 7', 
      title: 'First Weekly Growth Report', 
      text: 'Receive a plain-English summary of revenue gained, actions taken, and the optimal strategy roadmap for the coming week.',
      icon: <RocketIcon size={16} /> 
    },
  ]

  return (
    <div style={{ position: 'relative', paddingLeft: '2.5rem', marginTop: '2.5rem', maxWidth: '1200px', margin: '2.5rem auto 0' }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute', left: 14, top: 16, bottom: 16, width: 2, background: c.border
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {milestones.map((item, i) => (
          <Reveal key={item.day} delay={i * 100}>
            <div style={{ position: 'relative', display: 'flex', gap: '1.8rem', alignItems: 'flex-start', textAlign: 'left' }}>
              {/* Timeline Node */}
              <div style={{
                position: 'absolute', left: -40, top: 2,
                width: 30, height: 30, borderRadius: '50%',
                background: c.card, border: `2px solid ${c.g}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.g, zIndex: 2
              }}>
                {item.icon}
              </div>

              <div className="hiw-timeline-grid" style={{ flex: 1, width: '100%' }}>
                {/* Text column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.4rem' }}>
                    <span style={{ 
                      background: c.gpale, color: c.g, padding: '.25rem .7rem', 
                      borderRadius: 4, fontSize: '.72rem', fontWeight: 700, 
                      fontFamily: 'Inter,sans-serif' 
                    }}>
                      {item.day}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: c.dark }}>
                      {item.title}
                    </h4>
                  </div>
                  <p style={{ fontSize: '.88rem', color: c.muted, lineHeight: 1.75, fontWeight: 300, margin: 0 }}>
                    {item.text}
                  </p>
                </div>

                {/* Preview card column */}
                <div className="hiw-timeline-card-col">
                  {i === 0 && <Day1Preview c={c} />}
                  {i === 1 && <Day2Preview c={c} />}
                  {i === 2 && <Day3Preview c={c} />}
                  {i === 3 && <Day4Preview c={c} />}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-Checklist Component (Steps 1 & 3 outcome list) ──────────────────────────
function SubChecklist({ items, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '1.2rem', textAlign: 'left' }}>
      {items.map((text, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', fontSize: '.82rem', color: c.text }}>
          <div style={{ color: c.g, marginTop: '2px', display: 'inline-flex', alignItems: 'center' }}>
            <CheckIcon size={14} />
          </div>
          <span style={{ fontWeight: 300 }}>{text}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Before / After Copywriting Toggle (Step 2) ──────────────────────────────
function BeforeAfterToggle({ c }) {
  const [activeTab, setActiveTab] = useState('raw')

  const rawDesc = "Linen dress. 100% linen. Sage green. Side pockets. Machine wash cold."
  const aiDesc = "Effortless sage green linen dress — crafted from breathable organic flax, detailed with functional side pockets. Perfect for warm-weather garden gatherings or casual weekend wear."

  return (
    <div style={{ 
      marginTop: '1.5rem', 
      border: `1px solid ${c.border}`, 
      borderRadius: 12, 
      background: 'var(--card-bg)', 
      overflow: 'hidden', 
      textAlign: 'left',
      boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
    }}>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: `1px solid ${c.border}`, 
        background: c.bg2,
        padding: '2px'
      }}>
        <button 
          onClick={() => setActiveTab('raw')}
          style={{
            flex: 1,
            padding: '.5rem',
            border: 'none',
            background: activeTab === 'raw' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'raw' ? c.dark : c.muted,
            fontSize: '.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '6px',
            fontFamily: 'Inter,sans-serif',
            transition: 'all 0.2s'
          }}
        >
          Raw Description
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          style={{
            flex: 1,
            padding: '.5rem',
            border: 'none',
            background: activeTab === 'ai' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'ai' ? c.dark : c.muted,
            fontSize: '.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '6px',
            fontFamily: 'Inter,sans-serif',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.3rem'
          }}
        >
          <SparklesIcon size={12} color={activeTab === 'ai' ? c.g : c.muted} />
          Selora AI Output
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '1rem', minHeight: '80px', position: 'relative' }}>
        {activeTab === 'raw' ? (
          <div style={{ 
            fontSize: '.78rem', 
            color: c.muted, 
            lineHeight: 1.6, 
            fontFamily: 'Inter,sans-serif',
            animation: 'fadeUp 0.3s ease both'
          }}>
            <span style={{ fontWeight: 600, color: c.dark }}>Product Details:</span> {rawDesc}
          </div>
        ) : (
          <div style={{ 
            fontSize: '.78rem', 
            color: c.dark, 
            lineHeight: 1.6, 
            fontFamily: 'Inter,sans-serif',
            animation: 'fadeUp 0.3s ease both'
          }}>
            <span style={{ fontWeight: 600, color: c.g }}>AI Optimized Copy:</span> <span style={{ fontStyle: 'italic' }}>{aiDesc}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FAQ Constants ──────────────────────────────────────────────────────────
const FAQ = [
  { q: 'How long does setup take?', a: 'Under 5 minutes. Just connect your Shopify store or launch a brand-new native storefront on Selora, set your goals, and Selora handles the rest.' },
  { q: 'Do I need technical skills?', a: 'Not at all. Selora is built for fashion sellers, not developers. Everything is plain English, no code required.' },
  { q: 'Will Selora change things without my approval?', a: 'You\'re always in control. You can set Selora to auto-apply changes, or require approval before any action is taken.' },
  { q: 'What if I want to pause Selora?', a: 'One click. You can pause or resume the agent at any time from your dashboard.' },
  { q: 'How quickly will I see results?', a: 'Most sellers see their first improvements within 48 hours. Significant growth typically happens within the first 2 weeks.' },
  { q: 'Can I connect my own custom domain?', a: 'Yes, you can easily link your custom domain (e.g., yourbrand.com) in your storefront settings at any time.' },
]

// ─── Steps Array ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Set Up Your Store',
    desc: 'Connect your existing Shopify store in one click, or launch a new storefront on Selora — either way, it starts working immediately.',
    detail: 'Simply enter your Shopify store URL to connect, or create a brand-new native storefront directly on Selora. We sync your existing product catalog, orders, and ads, or host your brand-new collection instantly. Setup takes under 5 minutes.',
    checklist: [
      "Product catalog — titles, photos, pricing, variants",
      "Order history — so Selora knows what's already selling",
      "Inventory levels — so it never promotes sold-out items"
    ]
  },
  {
    num: '02',
    title: 'Set Your Goals',
    desc: 'More revenue? Better margins? Less wasted ad spend? Selora builds a growth plan around your collection.',
    detail: 'Tell Selora what matters most — whether it\'s growing revenue, improving profit margins, clearing slow-moving inventory, or reducing wasted ad spend. Selora tailors its optimization strategy to your specific goals.',
  },
  {
    num: '03',
    title: 'Wake Up to Growth',
    desc: 'Every morning you get a simple report — what grew, what was fixed, and what\'s next for your collection.',
    detail: 'While you sleep, Selora works. It reprices products, rewrites listings, reallocates ad budget, and monitors inventory. Every morning you wake up to a clear, plain-English report of everything that happened.',
    checklist: [
      "Reprices items as demand shifts",
      "Reallocates ad budget away from underperformers",
      "Watches inventory levels continuously",
      "Compiles everything into your morning report"
    ]
  },
]

// ─── FAQ Accordion Item Component ───────────────────────────────────────────
function FAQItem({ item, isOpen, onToggle, c }) {
  return (
    <div 
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: '1.2rem 1.4rem',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'left',
        boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.015)' : 'none'
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '.9rem', fontWeight: 600, color: c.dark, lineHeight: 1.4 }}>{item.q}</div>
        <ChevronDownIcon 
          size={16} 
          color={c.muted} 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
        />
      </div>
      
      <div style={{
        maxHeight: isOpen ? '200px' : '0px',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease, opacity 0.25s ease, margin-top 0.25s ease',
        marginTop: isOpen ? '.6rem' : '0px'
      }}>
        <p style={{ fontSize: '.82rem', color: c.muted, lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
          {item.a}
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const { user } = useAppContext()
  const containerRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="landing-page" style={{fontFamily:'Inter, sans-serif', background:c.bg, minHeight:'100vh'}}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes caret {
          50% { opacity: 0; }
        }
        .caret-blink {
          animation: caret 0.8s step-end infinite;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hiw-page-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          box-sizing: border-box;
        }
        .hiw-step-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.2rem 2.8rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }
        .hiw-step-row {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 3.5rem;
          align-items: center;
          z-index: 2;
        }
        .hiw-timeline-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 5rem;
          align-items: start;
        }
        .hiw-timeline-card-col {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
        }
        .hiw-faq-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.2rem;
          align-items: start;
        }
        @media (min-width: 769px) {
          .hiw-faq-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .hiw-timeline-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .hiw-timeline-card-col {
            justify-content: flex-start;
          }
        }
        @media (max-width: 900px) {
          .hiw-step-card {
            padding: 2rem 1.5rem;
          }
          .hiw-step-row {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          /* Neutralize alternating layout direction on mobile */
          .hiw-step-row.row-even {
            direction: ltr !important;
          }
          .hiw-step-row.row-even > div {
            direction: ltr !important;
          }
        }
      `}</style>
      <PageNav />

      {/* HERO */}
      <div style={{paddingTop:'6.3rem',paddingBottom:'1.5rem',background:'var(--bg2)'}}>
        <div className="hiw-page-container" style={{textAlign: 'left'}}>
          <div style={{maxWidth: '760px', width: '100%'}}>
            <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,margin:'0 0 .8rem'}}>
              Three steps to a <em style={{fontStyle:'italic',color:c.g}}>self-growing collection</em>
            </h1>
            <p style={{fontSize:'.88rem',color:c.muted,lineHeight:1.8,fontWeight:300,margin:0}}>
              No technical setup. Built for fashion sellers, not developers. Start growing in under 5 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* STEPS CONTAINER */}
      <div style={{ background: 'var(--bg2)', position: 'relative' }}>
        <div ref={containerRef} className="hiw-page-container" style={{ position: 'relative', paddingTop: '1rem', paddingBottom: '3rem' }}>
          
          {/* Render individual steps */}
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0
            const stepLink = i === 0 ? (user ? '/connect' : '/signup') : (i === 1 ? (user ? '/settings' : '/signup') : (user ? '/dashboard' : '/signup'))
            
            return (
              <div 
                key={step.num}
                className="hiw-step-card"
              >
                <div 
                  className={`hiw-step-row ${isEven ? 'row-odd' : 'row-even'}`}
                  style={{ direction: isEven ? 'ltr' : 'rtl' }}
                >
                  
                  {/* Text column */}
                  <div style={{ direction: 'ltr' }}>
                    <Reveal delay={100}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: c.g }}>Step {step.num}</span>
                      </div>
                      <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px', marginBottom: '1.2rem' }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize: '.88rem', color: c.muted, lineHeight: 1.8, fontWeight: 300, marginBottom: '2rem' }}>
                        {step.detail}
                      </p>

                      {/* Content Additions (checklists / toggle cards) */}
                      {i === 0 && <SubChecklist items={step.checklist} c={c} />}
                      {i === 1 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <BeforeAfterToggle c={c} />
                        </div>
                      )}
                      {i === 2 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <SubChecklist items={step.checklist} c={c} />
                        </div>
                      )}

                      <div style={{ marginTop: '2rem' }}>
                        <Link to={stepLink} style={{ background: c.g, color: '#fff', padding: '.7rem 1.6rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter,sans-serif', boxShadow: '0 4px 18px rgba(90,138,103,.2)' }}>
                          {i === 0 ? 'Set Up Your Store' : i === 1 ? 'Configure Goals' : 'Start Growing'} →
                        </Link>
                      </div>
                    </Reveal>
                  </div>

                  {/* Interactive Mockup column */}
                  <div style={{ direction: 'ltr', width: '100%', maxWidth: 440, margin: '0 auto' }}>
                    <Reveal delay={200}>
                      {i === 0 && <ShopifyConnectDemo c={c} />}
                      {i === 1 && <GoalsSetupDemo c={c} />}
                      {i === 2 && <MorningReportDemo c={c} />}
                    </Reveal>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* WEEK TIMELINE */}
      <div style={{background:c.card,borderTop:`1px solid ${c.border}`,padding:'4rem 0'}}>
        <div className="hiw-page-container" style={{textAlign:'center'}}>
          <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>What Happens Next</p>
          <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,marginBottom:'1rem',letterSpacing:'-.3px'}}>
            Your first week with Selora
          </h2>
          <p style={{fontSize:'.88rem',color:c.muted,fontWeight:300,lineHeight:1.7,maxWidth:480,margin:'0 auto 2.5rem'}}>
            A timeline of milestones as the agent integrates and begins boosting your store performance.
          </p>

          <FirstWeekTimeline c={c} />

          <p style={{ fontSize: '.72rem', color: c.muted, marginTop: '2.5rem', fontWeight: 300, fontStyle: 'italic' }}>
            *Previews are illustrative of the Selora agent's optimization steps.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div style={{background:c.bg2,borderTop:`1px solid ${c.border}`,padding:'4rem 0'}}>
        <div className="hiw-page-container">
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>FAQ</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>Common questions</h2>
          </div>
          <div className="hiw-faq-grid">
            {FAQ.map((item, i) => (
              <FAQItem 
                key={i} 
                item={item} 
                isOpen={openFaq === i} 
                onToggle={() => setOpenFaq(openFaq === i ? null : i)} 
                c={c} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:'3rem 0',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden',textAlign:'center'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
        <div className="hiw-page-container" style={{position:'relative'}}>
          <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
            Ready to start? It takes <em style={{color:'#86EFAC',fontStyle:'italic'}}>5 minutes</em>
          </h2>
          <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7,maxWidth:480,margin:'0 auto 2.2rem'}}>
            Free trial — no credit card required.
          </p>
          <Link to={user ? '/dashboard' : '/signup'} style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2.2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 20px rgba(134,239,172,.25)'}}>
            {user ? 'Go to Dashboard' : 'Get Started Free'} →
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${c.border}`,padding:'2.5rem 4rem',display:'flex',justifyContent:'space-between',alignItems:'center',background:c.card,flexWrap:'wrap',gap:'1rem'}}>
        <Link to="/" style={{fontFamily:'Inter,sans-serif',fontSize:'.95rem',fontWeight:700,color:c.dark,textDecoration:'none'}}>
          Se<span style={{color:c.g}}>lo</span>ra
        </Link>
        <div>
          {[{l:"Privacy Policy",h:"/privacy"},{l:"Terms of Service",h:"/terms"},{l:"Support",h:"/support"},{l:"Docs",h:"#"},{l:"Contact",h:"/support"}].map(item=>(
            <Link key={item.l} to={item.h} style={{fontSize:'.74rem',color:c.muted,textDecoration:'none',marginLeft:'1.8rem'}}>{item.l}</Link>
          ))}
        </div>
        <div style={{fontSize:'.7rem',color:'#c0c8c1'}}>© 2025 Selora. All rights reserved.</div>
      </footer>
    </div>
  )
}
