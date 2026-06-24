import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'

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

// ── Snowflake Canvas ─────────────────────────────────────────────────────────
function SnowCanvas({ color }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const particlesRef = useRef([]);
  const colorRef = useRef(color);
  const PHI = 1.6180339887;
  const COUNT = 28;

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  function goldenX(i, w) {
    return (((i * PHI) % 1) * 0.88 + 0.06) * w;
  }

  function drawArm(ctx, len) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
    const b1 = len * 0.38, b2 = len * 0.62, bl = len * 0.22;
    [-b1, -b2].forEach(by => {
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(bl * 0.7, by - bl * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(-bl * 0.7, by - bl * 0.7); ctx.stroke();
    });
  }

  function drawSnowflake(ctx, x, y, size, angle, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = colorRef.current || '#5A8A67';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);
      drawArm(ctx, size);
      ctx.restore();
    }
    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const w = canvas.width || 1200;
    const h = canvas.height || 800;
    particlesRef.current = Array.from({ length: COUNT }, (_, i) => ({
      baseX: goldenX(i, w),
      x: goldenX(i, w),
      y: Math.random() * h,
      size: 5 + Math.random() * 9,
      speed: 3 + Math.random() * 3,
      swayAmp: 4 + Math.random() * 6,
      swayFreq: 0.25 + Math.random() * 0.35,
      spinSpeed: (Math.random() - 0.5) * 0.4,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.22 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
    }));

    function animate(ts) {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      particlesRef.current.forEach(p => {
        p.y += p.speed * dt;
        p.angle += p.spinSpeed * dt;
        p.x = p.baseX + Math.sin(ts / 1000 * p.swayFreq * Math.PI * 2 + p.phase) * p.swayAmp;
        if (p.y - p.size > H) {
          p.y = -p.size * 2;
          p.baseX = goldenX(Math.random() * COUNT | 0, W);
        }
        drawSnowflake(ctx, p.x, p.y, p.size, p.angle, p.opacity);
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }}
    />
  );
}

function Check() {
  return (
    <div style={{ 
      width:17, height:17, borderRadius:'50%', flexShrink:0, 
      background: 'var(--check-bg)', 
      border: 'var(--check-border)', 
      display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' 
    }}>
      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
        <path d="M1 3L3 5L7 1" stroke="var(--check-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Connect() {
  const { user, activeStore } = useAppContext()
  const [demoStoreId, setDemoStoreId] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const navigate              = useNavigate()
  const [shop, setShop]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [email, setEmail]     = useState('')
  const [ready, setReady]     = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const theme = localStorage.getItem('selora-theme')
    return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })
  const [snowflakeColor, setSnowflakeColor] = useState('#5A8A67')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    // Resolve snowflake color dynamically from CSS custom properties
    const color = getComputedStyle(document.documentElement).getPropertyValue('--snowflake-color').trim()
    if (color) {
      setSnowflakeColor(color)
    }
  }, [darkMode])

  const toggleTheme = () => {
    const nextMode = !darkMode
    setDarkMode(nextMode)
    localStorage.setItem('selora-theme', nextMode ? 'dark' : 'light')
  }

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
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) setEmail(session.user.email)
    })
    const t = setTimeout(() => setReady(true), 40)
    return () => clearTimeout(t)
  }, [])

  const handleConnect = (e) => {
    e.preventDefault()
    setError('')
    let shopUrl = shop.trim().replace('https://','').replace('http://','').replace('.myshopify.com','').trim()
    if (!shopUrl) { setError('Please enter your Shopify store URL'); return }
    setLoading(true)
    window.location.href = `${API_URL}/install?shop=${shopUrl}.myshopify.com&email=${encodeURIComponent(email)}`
  }

  const anim = (name, delay=0, dur=460) =>
    ready ? { animation:`${name} ${dur}ms cubic-bezier(.22,.68,0,1.1) ${delay}ms both` } : { opacity:0 }

  return (
    <div style={{ minHeight:'100vh', background:'var(--canvas-bg)', fontFamily:'Inter, sans-serif', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', transition:'background 0.35s ease' }}>
      {/* Snowflake canvas background */}
      <SnowCanvas color={snowflakeColor} />

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
              // Sun Icon (click to go back to light mode)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '1.2rem', height: '1.2rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91l1.59 1.59M3 12h2.25m13.5 0H21m-16.05 6.05l1.59-1.59m10.91-10.91l1.59-1.59M12 7.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5Z" />
              </svg>
            ) : (
              // Moon Icon (click to go to dark mode)
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
              <Link to="/login" className="cn-nav-link" style={{ fontSize:".82rem", fontWeight:500, textDecoration:"none", transition:'color 0.3s' }}>Sign In</Link>
              <Link to="/signup" className="cn-shopify-btn" style={{ padding:".5rem 1.3rem", borderRadius:7, fontSize:".82rem", fontWeight:600, textDecoration:"none", fontFamily:"Inter,sans-serif", display:'inline-flex', alignItems:'center' }}>
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-8 pt-28 pb-16 flex flex-col justify-center relative z-10">

        {/* Two-column layout container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">

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
              <div style={{ background:'var(--card-header-bg)', borderBottom:'var(--card-header-border)', padding:'1.75rem 2rem', position:'relative', overflow:'hidden', transition:'background 0.35s, border-color 0.35s' }}>
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
                    <h2 style={{ fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:500, color:'var(--title-text)', margin:0, letterSpacing:'-.025em', transition:'color 0.3s' }}>Connect Shopify</h2>
                  </div>
                </div>
                <p style={{ fontSize:'.8rem', color:'var(--body-text)', margin:'.9rem 0 0', fontWeight:300, lineHeight:1.55, transition:'color 0.3s' }}>
                  Enter your store URL and approve Selora access in Shopify. Takes about 30 seconds.
                </p>
              </div>

              {/* Steps & Permissions content inside a loose container (gap: 1.75rem) */}
              <div style={{ padding:'2rem 2rem 0', display:'flex', flexDirection:'column', gap:'1.75rem' }}>
                {/* Steps Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize:'.65rem', fontWeight:700, color:'var(--sub-text)', textTransform:'uppercase', letterSpacing:'.1em', margin:0, transition:'color 0.3s' }}>
                    How it works
                  </p>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem' }}>
                    {STEPS.map((s,i) => (
                      <div key={s.n} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', width:'100%', marginBottom:'.6rem' }}>
                          {i>0 && <div style={{ flex:1, height:1, background:'var(--step-bar)', marginRight:'.3rem', transition:'background-color 0.3s' }} />}
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--step-number-bg)', border:'1.5px solid var(--step-number-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.63rem', fontWeight:700, color:'var(--step-number-text)', flexShrink:0, transition:'background-color 0.3s, border-color 0.3s' }}>{s.n}</div>
                          {i<STEPS.length-1 && <div style={{ flex:1, height:1, background:'var(--step-bar)', marginLeft:'.3rem', transition:'background-color 0.3s' }} />}
                        </div>
                        <p style={{ fontSize:'.75rem', fontWeight:600, color:'var(--step-title)', margin:'0 0 .12rem', textAlign:'center', transition:'color 0.3s' }}>{s.title}</p>
                        <p style={{ fontSize:'.7rem', color:'var(--step-desc)', margin:0, fontWeight:300, lineHeight:1.4, textAlign:'center', padding:'0 .25rem', transition:'color 0.3s' }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ height:1, background:'var(--divider-color)', transition:'background-color 0.3s' }} />

                {/* Permissions Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize:'.65rem', fontWeight:700, color:'var(--sub-text)', textTransform:'uppercase', letterSpacing:'.1em', margin:0, transition:'color 0.3s' }}>
                    Selora will be able to:
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem 1.25rem' }}>
                    {SHOPIFY_PERMS.map(p => (
                      <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem' }}>
                        <Check />
                        <span style={{ fontSize:'.79rem', color:'var(--body-text)', fontWeight:300, lineHeight:1.45, transition:'color 0.3s' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Section */}
            <div style={{ padding:'0 2rem 2rem' }}>
              <div style={{ height:1, background:'var(--divider-color)', marginBottom:'1.5rem', transition:'background-color 0.3s' }} />
              {/* Form */}
              {error && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.65rem .9rem', fontSize:'.82rem', color:'#DC2626', marginBottom:'1rem' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleConnect} style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                <div style={{ display:'flex', gap:'.75rem', alignItems:'flex-end', flexWrap:'wrap' }}>
                  <div style={{ flex:'1 1 300px' }}>
                    <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, color:'var(--sub-text)', marginBottom:'.4rem', letterSpacing:'.09em', textTransform:'uppercase', transition:'color 0.3s' }}>
                      Connect your store
                    </label>
                    <div style={{ display:'flex', borderRadius:9, border:'1px solid var(--input-border)', overflow:'hidden', transition:'border-color 0.3s' }}>
                      <span style={{ padding:'.75rem .85rem', background:'var(--input-prefix-bg)', fontSize:'.78rem', color:'var(--input-prefix-text)', whiteSpace:'nowrap', display:'flex', alignItems:'center', borderRight:'1px solid var(--input-border)', transition:'background-color 0.3s, border-color 0.3s, color 0.3s' }}>https://</span>
                      <input
                        className="cn-input-field"
                        type="text"
                        placeholder="your-store"
                        value={shop}
                        onChange={e => setShop(e.target.value)}
                        required
                        style={{ flex:1, padding:'.75rem .85rem', border:'none', fontSize:'.875rem', color:'var(--input-text)', fontFamily:'Inter, sans-serif', background:'var(--input-bg)', minWidth:0, transition:'background-color 0.3s, color 0.3s' }}
                      />
                      <span style={{ padding:'.75rem .85rem', background:'var(--input-prefix-bg)', fontSize:'.78rem', color:'var(--input-prefix-text)', whiteSpace:'nowrap', display:'flex', alignItems:'center', borderLeft:'1px solid var(--input-border)', transition:'background-color 0.3s, border-color 0.3s, color 0.3s' }}>.myshopify.com</span>
                    </div>
                  </div>
                  <button
                    className="cn-shopify-btn"
                    type="submit"
                    disabled={loading}
                    style={{ 
                      flex:'0 0 auto', padding:'.75rem 1.5rem', height:46, 
                      borderRadius:9, fontSize:'.875rem', fontWeight:600, 
                      cursor:loading?'not-allowed':'pointer', fontFamily:'Inter, sans-serif', 
                      opacity:loading?.7:1, letterSpacing:'.01em', minWidth:130,
                    }}
                  >
                    {loading ? 'Connecting…' : 'Connect Store'}
                  </button>
                </div>
                <p style={{ fontSize:'.71rem', color:'var(--muted-text)', margin:'.25rem 0 0', fontWeight:300, transition:'color 0.3s' }}>
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
            ...anim('popIn', 180, 350),
          }}>

            {/* Hero band */}
            <div style={{ background:'var(--card-header-bg)', borderBottom:'var(--card-header-border)', padding:'1.75rem 1.5rem', position:'relative', overflow:'hidden', transition:'background 0.35s, border-color 0.35s' }}>
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
                  <h2 style={{ fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:500, color:'var(--title-text)', margin:0, letterSpacing:'-.025em', transition:'color 0.3s' }}>Create Store</h2>
                </div>
              </div>
              <p style={{ fontSize:'.8rem', color:'var(--body-text)', margin:'.9rem 0 0', fontWeight:300, lineHeight:1.55, transition:'color 0.3s' }}>
                Setup a native storefront on Selora instantly.
              </p>
            </div>

            {/* Body benefits */}
            <div style={{ padding:'2rem', flex:1, display:'flex', flexDirection:'column', gap:'1.75rem' }}>
              <div>
                <p style={{ fontSize:'.85rem', color:'var(--body-text)', fontWeight:300, lineHeight:1.6, margin:'0 0 1.25rem', transition:'color 0.3s' }}>
                  Launch your own fashion catalog directly on Selora. Fully integrated checkout and AI scaling tools ready instantly.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                  {SELORA_BENEFITS.map(b => (
                    <div key={b} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem' }}>
                      <Check />
                      <span style={{ fontSize:'.79rem', color:'var(--body-text)', fontWeight:300, lineHeight:1.35, transition:'color 0.3s' }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  className="cn-selora-btn"
                  onClick={() => navigate('/store-builder')}
                  style={{ 
                    width:'100%', padding:'.85rem', 
                    borderRadius:9, fontSize:'.875rem', fontWeight:600, cursor:'pointer', 
                    fontFamily:'Inter, sans-serif', letterSpacing:'.01em', textAlign:'center',
                  }}
                >
                  Create store →
                </button>
              </div>
            </div>

          </div>

        </div>
        <p style={{ fontSize:'.75rem', color:'var(--muted-text)', textAlign:'center', marginTop:'2rem', fontWeight:300, transition:'color 0.3s' }}>
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
