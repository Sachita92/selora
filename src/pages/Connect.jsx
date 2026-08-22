import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SHOPIFY_PERMS = [
  'Read and update product prices',
  'Read orders and inventory levels',
  'Access sales analytics and reports',
  'Update product titles and descriptions',
]

const STEPS = [
  { n: '01', title: 'Enter your URL',      desc: 'Type your Shopify store handle.' },
  { n: '02', title: 'Approve in Shopify',  desc: 'Grant Selora access — 30 seconds.' },
  { n: '03', title: 'Start growing',       desc: 'Your AI agent activates immediately.' },
]

const SELORA_BENEFITS = [
  'Free hosting & custom subdomain',
  'Instant product listing creation',
  'Built-in Stripe checkout integration',
  'Pre-configured marketing optimizations',
]

const CREATE_STEPS = [
  { n: '01', title: 'Pick store name',     desc: 'Choose your custom subdomain.' },
  { n: '02', title: 'Add products',        desc: 'Upload items or generate with AI.' },
  { n: '03', title: 'Launch & grow',       desc: 'Accept payments & scale automatically.' },
]

function Check() {
  return (
    <div style={{ 
      width:15, height:15, borderRadius:'50%', flexShrink:0, 
      background: 'var(--check-bg)', 
      border: 'var(--check-border)', 
      display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' 
    }}>
      <svg width="7" height="5" viewBox="0 0 8 6" fill="none">
        <path d="M1 3L3 5L7 1" stroke="var(--check-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Connect() {
  const { user, activeStore, openAuthModal } = useAppContext()
  const [demoStoreId, setDemoStoreId] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const navigate              = useNavigate()
  const [shop, setShop]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [ready, setReady]     = useState(false)
  const [darkMode, toggleTheme] = useDarkMode()
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showCreateSteps, setShowCreateSteps] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!activeStore) {
      fetch(`${API_URL}/api/public/stats`)
        .then(r => r.json())
        .then(d => {
          if (d?.demo_store_id) {
            setDemoStoreId(d.demo_store_id)
          }
        })
        .catch(e => console.error("Error loading public stats:", e))
    }
  }, [activeStore])

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 40)
    return () => clearTimeout(t)
  }, [])

  const handleConnect = async (e) => {
    e.preventDefault()
    setError('')
    let shopUrl = shop.trim().replace('https://','').replace('http://','').replace('.myshopify.com','').trim()
    if (!shopUrl) { setError('Please enter your Shopify store URL'); return }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const res = await fetch(`${API_URL}/install?shop=${encodeURIComponent(shopUrl + '.myshopify.com')}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Could not start the Shopify install')
      const data = await res.json()
      window.location.href = data.install_url
    } catch (err) {
      setError(err.message || 'Could not start the Shopify install')
      setLoading(false)
    }
  }

  const anim = (name, delay=0, dur=460) =>
    ready ? { animation:`${name} ${dur}ms cubic-bezier(.22,.68,0,1.1) ${delay}ms both` } : { opacity:0 }

  return (
    <div style={{ minHeight:'100vh', background:'var(--canvas-bg)', fontFamily:'Inter, sans-serif', display:'flex', flexDirection:'column', position:'relative', transition:'background 0.35s ease' }}>
      
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1rem 3.5rem",
        background: scrolled ? 'var(--nav-bg-scrolled)' : 'var(--nav-bg)',
        backdropFilter:"blur(14px)", borderBottom:'1px solid var(--nav-border)',
        transition:"background .3s, border-color .3s",
        ...anim('fadeIn', 0, 300)
      }}>
        <Link to="/" style={{ fontFamily:"Inter,sans-serif", fontSize:"1.2rem", fontWeight:700, letterSpacing:"-.3px", color:'var(--logo-text)', textDecoration:"none", transition:'color 0.3s' }}>
          Se<span style={{ color:"#5A8A67" }}>lo</span>ra
        </Link>
        <div className="nav-links" style={{ display:"flex", alignItems:"center" }}>
          {[
            { label: "Features", path: "/features" },
            { label: "How It Works", path: "/how-it-works" },
            { label: "Pricing", path: "/pricing" }
          ].map(item => (
            <Link key={item.label} to={item.path} className="cn-nav-link" style={{ fontSize:".82rem", fontWeight:500, textDecoration:"none", marginLeft:"2rem", transition:'color 0.3s' }}>{item.label}</Link>
          ))}
          <Link to="/demo" className="cn-nav-link-primary" style={{ fontSize:".82rem", fontWeight:500, textDecoration:"none", marginLeft:"2rem", transition:'color 0.3s' }}>Book a Demo</Link>
        </div>
        <div style={{ display:"flex", gap:".7rem", alignItems:"center" }}>
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="cn-theme-toggle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
              marginRight: '.5rem'
            }}
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '1.2rem', height: '1.2rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91l1.59 1.59M3 12h2.25m13.5 0H21m-16.05 6.05l1.59-1.59m10.91-10.91l1.59-1.59M12 7.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '1.2rem', height: '1.2rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 4.5 0 8.35-3.09 9.502-7.248Z" />
              </svg>
            )}
          </button>

          {user ? (
            <Link to="/dashboard" className="cn-shopify-btn" style={{ padding:".5rem 1.3rem", borderRadius:7, fontSize:".82rem", fontWeight:600, textDecoration:"none", fontFamily:"Inter,sans-serif", display:'inline-flex', alignItems:'center' }}>
              Dashboard
            </Link>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} className="cn-nav-link" style={{ fontSize:".82rem", fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'color 0.3s' }}>Sign In</button>
              <button onClick={() => openAuthModal('signup')} className="cn-shopify-btn" style={{ padding:".5rem 1.3rem", borderRadius:7, fontSize:".82rem", fontWeight:600, border:'none', cursor:'pointer', fontFamily:"Inter,sans-serif", display:'inline-flex', alignItems:'center' }}>
                Get Started Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-8 pt-28 pb-16 flex flex-col justify-center relative z-10">

        {/* Page Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', ...anim('fadeIn', 60) }}>
          <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--g)', marginBottom: '.3rem' }}>
            Onboarding
          </p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, color: 'var(--title-text)', margin: '0 0 .5rem', letterSpacing: '-.025em' }}>
            Choose how to get started
          </h1>
          <p style={{ fontSize: '.85rem', color: 'var(--muted-text)', margin: 0, fontWeight: 300 }}>
            Connect your existing Shopify store or build a new storefront directly on Selora.
          </p>
        </div>

        {/* Two-column layout container with central OR divider */}
        <div style={{ position: 'relative', width: '100%' }}>

          {/* Central OR divider badge */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} className="hidden md:flex">
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border)',
              borderRadius: 99,
              padding: '.35rem .8rem',
              fontSize: '.7rem',
              fontWeight: 700,
              color: 'var(--sub-text)',
              letterSpacing: '.08em',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
              OR
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch w-full">

            {/* Left card: Connect Shopify */}
            <div className="cn-card" style={{
              borderRadius:20,
              overflow:'hidden',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              height: '100%',
              ...anim('fadeUp', 120),
            }}>
              {/* Top Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Hero band */}
                <div style={{ background:'var(--card-header-bg)', borderBottom:'var(--card-header-border)', padding:'1.5rem 1.75rem', position:'relative', overflow:'hidden', transition:'background 0.35s, border-color 0.35s' }}>
                  <div style={{ position:'absolute', top:-50, right:-50, width:160, height:160, borderRadius:'50%', border: 'var(--circle-border-outer)' }} />
                  <div style={{ position:'absolute', top:-25, right:-25, width:100, height:100, borderRadius:'50%', border: 'var(--circle-border-inner)' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background: 'var(--existing-store-badge-bg)', border: 'var(--existing-store-badge-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background-color 0.3s, border-color 0.3s' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 10C3 6.13 6.13 3 10 3s7 3.13 7 7-3.13 7-7 7-7-3.13-7-7Z" stroke="var(--existing-store-badge-svg)" strokeWidth="1.3"/>
                        <path d="M10 7v3l2 2" stroke="var(--existing-store-badge-svg-sec)" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--existing-store-badge)', marginBottom:'.2rem', marginTop:0 }}>Existing store</p>
                      <h2 style={{ fontFamily:'Fraunces, serif', fontSize:'1.25rem', fontWeight:500, color:'var(--title-text)', margin:0, letterSpacing:'-.025em', transition:'color 0.3s' }}>Connect Shopify</h2>
                    </div>
                  </div>
                  <p style={{ fontSize:'.8rem', color:'var(--body-text)', margin:'.75rem 0 0', fontWeight:300, lineHeight:1.5, transition:'color 0.3s' }}>
                    Connect your Shopify store handle and approve access in 30 seconds.
                  </p>
                </div>

                {/* Permissions & How It Works Toggle inside tight container */}
                <div style={{ padding:'1.5rem 1.75rem 0', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  
                  {/* Permissions Section (Compact 2x2 grid) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    <p style={{ fontSize:'.65rem', fontWeight:700, color:'var(--sub-text)', textTransform:'uppercase', letterSpacing:'.1em', margin:0, transition:'color 0.3s' }}>
                      Selora will be able to:
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.4rem .8rem' }}>
                      {SHOPIFY_PERMS.map(p => (
                        <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:'.4rem' }}>
                          <Check />
                          <span style={{ fontSize:'.76rem', color:'var(--body-text)', fontWeight:300, lineHeight:1.35, transition:'color 0.3s' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expandable "See how this works ▾" Toggle */}
                  <div style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '.85rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowHowItWorks(prev => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '.75rem',
                        fontWeight: 600,
                        color: 'var(--g)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '.3rem',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {showHowItWorks ? 'Hide steps ▴' : 'See how this works ▾'}
                    </button>

                    {showHowItWorks && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem', animation: 'fadeIn 0.25s ease-in-out' }}>
                        {STEPS.map((s, i) => (
                          <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '.4rem' }}>
                              {i > 0 && <div style={{ flex: 1, height: 1, background: 'var(--step-bar)' }} />}
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--step-number-bg)', border: '1px solid var(--step-number-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 700, color: 'var(--step-number-text)', flexShrink: 0 }}>{s.n}</div>
                              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--step-bar)' }} />}
                            </div>
                            <p style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--step-title)', margin: '0 0 .1rem', textAlign: 'center' }}>{s.title}</p>
                            <p style={{ fontSize: '.65rem', color: 'var(--step-desc)', margin: 0, fontWeight: 300, lineHeight: 1.3, textAlign: 'center' }}>{s.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Bottom Form Section */}
              <div style={{ padding:'1.5rem 1.75rem 1.75rem' }}>
                <div style={{ height:1, background:'var(--divider-color)', marginBottom:'1.25rem', transition:'background-color 0.3s' }} />
                {/* Form */}
                {error && (
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.55rem .8rem', fontSize:'.78rem', color:'#DC2626', marginBottom:'.85rem' }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleConnect} style={{ display:'flex', flexDirection:'column', gap:'.35rem' }}>
                  <div style={{ display:'flex', gap:'.75rem', alignItems:'flex-end', flexWrap:'wrap' }}>
                    <div style={{ flex:'1 1 240px' }}>
                      <label style={{ display:'block', fontSize:'.65rem', fontWeight:700, color:'var(--sub-text)', marginBottom:'.35rem', letterSpacing:'.09em', textTransform:'uppercase', transition:'color 0.3s' }}>
                        Store Handle
                      </label>
                      <div style={{ display:'flex', borderRadius:9, border:'1px solid var(--input-border)', overflow:'hidden', transition:'border-color 0.3s' }}>
                        <span style={{ padding:'.65rem .75rem', background:'var(--input-prefix-bg)', fontSize:'.75rem', color:'var(--input-prefix-text)', whiteSpace:'nowrap', display:'flex', alignItems:'center', borderRight:'1px solid var(--input-border)', transition:'background-color 0.3s, border-color 0.3s, color 0.3s' }}>https://</span>
                        <input
                          className="cn-input-field"
                          type="text"
                          placeholder="your-store"
                          value={shop}
                          onChange={e => setShop(e.target.value)}
                          required
                          style={{ flex:1, padding:'.65rem .75rem', border:'none', fontSize:'.85rem', color:'var(--input-text)', fontFamily:'Inter, sans-serif', background:'var(--input-bg)', minWidth:0, transition:'background-color 0.3s, color 0.3s' }}
                        />
                        <span style={{ padding:'.65rem .75rem', background:'var(--input-prefix-bg)', fontSize:'.75rem', color:'var(--input-prefix-text)', whiteSpace:'nowrap', display:'flex', alignItems:'center', borderLeft:'1px solid var(--input-border)', transition:'background-color 0.3s, border-color 0.3s, color 0.3s' }}>.myshopify.com</span>
                      </div>
                    </div>
                    <button
                      className="cn-shopify-btn"
                      type="submit"
                      disabled={loading}
                      style={{ 
                        flex:'0 0 auto', padding:'.65rem 1.3rem', height:42, 
                        borderRadius:9, fontSize:'.85rem', fontWeight:600, 
                        cursor:loading?'not-allowed':'pointer', fontFamily:'Inter, sans-serif', 
                        opacity:loading?.7:1, letterSpacing:'.01em', minWidth:120,
                      }}
                    >
                      {loading ? 'Connecting…' : 'Connect Store'}
                    </button>
                  </div>
                  <p style={{ fontSize:'.68rem', color:'var(--muted-text)', margin:'.25rem 0 0', fontWeight:300, transition:'color 0.3s' }}>
                    Example: <strong style={{ fontWeight:500, color:'var(--body-text)' }}>my-fashion-store</strong>.myshopify.com
                  </p>
                </form>
              </div>
            </div>

            {/* Right card: Create Selora Store */}
            <div className="cn-card" style={{
              borderRadius:20,
              overflow:'hidden',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              height: '100%',
              ...anim('popIn', 180, 350),
            }}>

              {/* Top Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Hero band */}
                <div style={{ background:'var(--card-header-bg)', borderBottom:'var(--card-header-border)', padding:'1.5rem 1.75rem', position:'relative', overflow:'hidden', transition:'background 0.35s, border-color 0.35s' }}>
                  <div style={{ position:'absolute', top:-50, right:-50, width:140, height:140, borderRadius:'50%', border: 'var(--circle-border-outer)' }} />
                  <div style={{ position:'absolute', top:-25, right:-25, width:90, height:90, borderRadius:'50%', border: 'var(--circle-border-inner)' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background: 'var(--existing-store-badge-bg)', border: 'var(--existing-store-badge-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background-color 0.3s, border-color 0.3s' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2 17h16M3 9.5L10 3l7 6.5M4 17V9.5h12V17" stroke="var(--existing-store-badge-svg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 17v-4h4v4" stroke="var(--existing-store-badge-svg-sec)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--existing-store-badge)', marginBottom:'.2rem', marginTop:0 }}>No store yet</p>
                      <h2 style={{ fontFamily:'Fraunces, serif', fontSize:'1.25rem', fontWeight:500, color:'var(--title-text)', margin:0, letterSpacing:'-.025em', transition:'color 0.3s' }}>Create Store</h2>
                    </div>
                  </div>
                  <p style={{ fontSize:'.8rem', color:'var(--body-text)', margin:'.75rem 0 0', fontWeight:300, lineHeight:1.5, transition:'color 0.3s' }}>
                    Setup a native storefront on Selora instantly with built-in AI tools.
                  </p>
                </div>

                {/* Body benefits & steps inside matching tight container */}
                <div style={{ padding:'1.5rem 1.75rem 0', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  
                  {/* Benefits Grid (Compact 2x2) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    <p style={{ fontSize:'.65rem', fontWeight:700, color:'var(--sub-text)', textTransform:'uppercase', letterSpacing:'.1em', margin:0, transition:'color 0.3s' }}>
                      Selora Store includes:
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.4rem .8rem' }}>
                      {SELORA_BENEFITS.map(b => (
                        <div key={b} style={{ display:'flex', alignItems:'flex-start', gap:'.4rem' }}>
                          <Check />
                          <span style={{ fontSize:'.76rem', color:'var(--body-text)', fontWeight:300, lineHeight:1.35, transition:'color 0.3s' }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expandable "See how this works ▾" Toggle for Create Store structural symmetry */}
                  <div style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '.85rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateSteps(prev => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '.75rem',
                        fontWeight: 600,
                        color: 'var(--g)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '.3rem',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {showCreateSteps ? 'Hide steps ▴' : 'See creation steps ▾'}
                    </button>

                    {showCreateSteps && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem', animation: 'fadeIn 0.25s ease-in-out' }}>
                        {CREATE_STEPS.map((s, i) => (
                          <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '.4rem' }}>
                              {i > 0 && <div style={{ flex: 1, height: 1, background: 'var(--step-bar)' }} />}
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--step-number-bg)', border: '1px solid var(--step-number-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 700, color: 'var(--step-number-text)', flexShrink: 0 }}>{s.n}</div>
                              {i < CREATE_STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--step-bar)' }} />}
                            </div>
                            <p style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--step-title)', margin: '0 0 .1rem', textAlign: 'center' }}>{s.title}</p>
                            <p style={{ fontSize: '.65rem', color: 'var(--step-desc)', margin: 0, fontWeight: 300, lineHeight: 1.3, textAlign: 'center' }}>{s.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Bottom Action Section matching height of left card form section */}
              <div style={{ padding:'1.5rem 1.75rem 1.75rem' }}>
                <div style={{ height:1, background:'var(--divider-color)', marginBottom:'1.25rem', transition:'background-color 0.3s' }} />
                <button
                  className="cn-selora-btn"
                  onClick={() => navigate('/store-builder')}
                  style={{ 
                    width:'100%', height:42, 
                    borderRadius:9, fontSize:'.85rem', fontWeight:600, cursor:'pointer', 
                    fontFamily:'Inter, sans-serif', letterSpacing:'.01em', textAlign:'center',
                    display:'inline-flex', alignItems:'center', justifyContent:'center'
                  }}
                >
                  Create store →
                </button>
                <p style={{ fontSize:'.68rem', color:'var(--muted-text)', margin:'.4rem 0 0', fontWeight:300, textAlign:'center', transition:'color 0.3s' }}>
                  Includes free subdomain & hosting · Ready in 60s
                </p>
              </div>

            </div>

          </div>
        </div>

        <p style={{ fontSize:'.75rem', color:'var(--muted-text)', textAlign:'center', marginTop:'2.5rem', fontWeight:300, transition:'color 0.3s' }}>
          Encrypted · Disconnect anytime
        </p>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop:'1px solid var(--footer-border)', padding:"2rem 4rem",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        background:'var(--footer-bg)', flexWrap:"wrap", gap:"1rem",
        position:'relative', zIndex:2,
        transition:'background-color 0.35s, border-color 0.35s',
        ...anim('fadeIn', 400, 350)
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily:"Inter,sans-serif", fontSize:".95rem", fontWeight:700, color:'var(--logo-text)', transition:'color 0.3s' }}>
            Se<span style={{ color:"#5A8A67" }}>lo</span>ra
          </div>
        </Link>
        <div>
          {[{l:"Privacy Policy",h:"/privacy"},{l:"Terms of Service",h:"/terms"},{l:"Support",h:"/support"},{l:"Docs",h:"#"},{l:"Contact",h:"/support"}].map(item=>(
            <Link key={item.l} to={item.h} className="cn-footer-link" style={{ fontSize:".74rem", textDecoration:"none", marginLeft:"1.8rem", transition:'color 0.3s' }}>{item.l}</Link>
          ))}
        </div>
        <div style={{ fontSize:".7rem", color:'var(--footer-text)', transition:'color 0.3s' }}>© {new Date().getFullYear()} Selora. All rights reserved.</div>
      </footer>
    </div>
  )
}
