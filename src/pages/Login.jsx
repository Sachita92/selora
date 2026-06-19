import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'

const s = {
  pageWrapper: { minHeight:'100vh', background:'linear-gradient(170deg,#EEF4EF 0%,#F8FAF8 55%)', display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif', position: 'relative', overflow: 'hidden' },
  main:    { flex:1, padding:'7.5rem 1.5rem 4.5rem', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2 },
  card:    { background:'#fff', border:'1px solid #E4EBE5', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 18px 55px rgba(90,138,103,.08)' },
  logo:    { fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:600, color:'#1A271C', textDecoration:'none', display:'block', marginBottom:'2rem', textAlign:'center', letterSpacing:'-.3px' },
  title:   { fontFamily:'Fraunces, serif', fontSize:'1.6rem', fontWeight:500, color:'#1A271C', marginBottom:'.4rem', letterSpacing:'-.3px' },
  sub:     { fontSize:'.85rem', color:'#7B907D', marginBottom:'1.8rem', fontWeight:300, lineHeight:1.6 },
  label:   { display:'block', fontSize:'.75rem', fontWeight:600, color:'#2E3D30', marginBottom:'.4rem', letterSpacing:'.04em', textTransform:'uppercase' },
  input:   { width:'100%', padding:'.75rem 1rem', border:'1px solid #E4EBE5', borderRadius:8, fontSize:'.9rem', color:'#1A271C', fontFamily:'Inter, sans-serif', outline:'none', transition:'border .2s', background:'#FAFAF8' },
  btn:     { width:'100%', padding:'.82rem', background:'#5A8A67', color:'#fff', border:'none', borderRadius:8, fontSize:'.9rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all .2s', marginTop:'.5rem' },
  err:     { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', color:'#DC2626', marginBottom:'1rem' },
  divider: { display:'flex', alignItems:'center', gap:'1rem', margin:'1.5rem 0' },
  link:    { fontSize:'.82rem', color:'#5A8A67', textDecoration:'none', fontWeight:500 }
}

// ── Snowflake Canvas ─────────────────────────────────────────────────────────
function SnowCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const particlesRef = useRef([]);
  const PHI = 1.6180339887;
  const COUNT = 28;
  const COLOR = '#5A8A67';

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
    ctx.strokeStyle = COLOR;
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

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusPassword, setFocusPassword] = useState(false)
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const searchParams = new URLSearchParams(window.location.search)
  const plan = searchParams.get('plan')
  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (plan && plan !== 'free') {
          navigate(`/pricing?plan=${plan}`)
        } else {
          navigate('/dashboard')
        }
      }
    })
  }, [navigate, plan])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } else {
      if (plan && plan !== 'free') {
        navigate(`/pricing?plan=${plan}`)
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div style={s.pageWrapper}>
      <SnowCanvas />
      <style>{`
        .auth-nav-link-primary { color: #5A8A67; transition: color .2s; }
        .auth-nav-link-primary:hover { color: #4A7A57; }
        .auth-back-btn { transition: all .2s; }
        .auth-back-btn:hover { color: #1A271C !important; border-color: #5A8A67 !important; background: #FAFAF8 !important; }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-card-anim {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .auth-card-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .auth-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @media (max-width: 768px) {
          .auth-back-btn {
            top: 4.8rem !important;
            left: 1rem !important;
            padding: 0.3rem 0.6rem !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1rem 3.5rem",
        background: scrolled ? "rgba(248, 250, 248, 0.97)" : "rgba(248, 250, 248, 0.88)",
        backdropFilter:"blur(14px)", borderBottom:"1px solid #E4EBE5",
        transition:"background .3s",
      }}>
        <Link to="/" style={{ fontFamily:"Inter,sans-serif", fontSize:"1.2rem", fontWeight:700, letterSpacing:"-.3px", color:"#1A271C", textDecoration:"none" }}>
          Se<span style={{ color:"#5A8A67" }}>lo</span>ra
        </Link>
        <Link to="/support" className="auth-nav-link-primary" style={{ fontSize:".85rem", fontWeight:500, textDecoration:"none" }}>
          Docs & Support
        </Link>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <main style={s.main}>
        <Link to="/" style={{
          position: 'absolute', top: '5.5rem', left: '3.5rem', zIndex: 10,
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '.4rem .8rem', border: '1px solid #E4EBE5', borderRadius: 8,
          background: '#FFFFFF', color: '#7B907D', textDecoration: 'none',
          fontSize: '.8rem', fontWeight: 500, transition: 'all .2s',
          boxShadow: '0 2px 8px rgba(90,138,103,.03)'
        }} className="auth-back-btn">
          <span style={{ fontSize:"1rem", lineHeight: 0 }}>←</span> Back to Home
        </Link>
        <div style={s.card} className={`auth-card-anim ${shake ? 'auth-card-shake' : ''}`}>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.sub}>Sign in to your Selora account to manage your fashion stores.</p>

          {error && <div style={s.err}>{error}</div>}

          <form onSubmit={handleLogin}>
            {/* Email Group */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <input
                style={{
                  ...s.input,
                  padding: '1.2rem 1rem 0.5rem',
                  borderColor: emailValid ? '#166534' : (focusEmail ? '#5A8A67' : '#E4EBE5'),
                  background: focusEmail ? '#FFF' : '#FAFAF8',
                  boxShadow: focusEmail ? (emailValid ? '0 0 0 3px rgba(22,101,52,.15)' : '0 0 0 3px rgba(90,138,103,.1)') : 'none'
                }}
                type="email"
                placeholder=""
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
                required
                autoFocus
              />
              <label style={{
                position: 'absolute',
                left: '1rem',
                top: focusEmail || email ? '28%' : '50%',
                transform: 'translateY(-50%)',
                fontSize: focusEmail || email ? '.68rem' : '.85rem',
                fontWeight: focusEmail || email ? 600 : 300,
                color: emailValid ? '#166534' : (focusEmail || email ? '#5A8A67' : '#7B907D'),
                transition: 'all .2s ease',
                pointerEvents: 'none',
                textTransform: 'uppercase',
                letterSpacing: focusEmail || email ? '.04em' : 'normal'
              }}>Email Address</label>
            </div>

            {/* Password Group */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <input
                style={{
                  ...s.input,
                  padding: '1.2rem 2.8rem 0.5rem 1rem',
                  borderColor: focusPassword || password ? '#5A8A67' : '#E4EBE5',
                  background: focusPassword ? '#FFF' : '#FAFAF8',
                  boxShadow: focusPassword ? '0 0 0 3px rgba(90,138,103,.1)' : 'none'
                }}
                type={showPassword ? "text" : "password"}
                placeholder=""
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusPassword(true)}
                onBlur={() => setFocusPassword(false)}
                required
              />
              <label style={{
                position: 'absolute',
                left: '1rem',
                top: focusPassword || password ? '28%' : '50%',
                transform: 'translateY(-50%)',
                fontSize: focusPassword || password ? '.68rem' : '.85rem',
                fontWeight: focusPassword || password ? 600 : 300,
                color: focusPassword || password ? '#5A8A67' : '#7B907D',
                transition: 'all .2s ease',
                pointerEvents: 'none',
                textTransform: 'uppercase',
                letterSpacing: focusPassword || password ? '.04em' : 'normal'
              }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#7B907D',
                  cursor: 'pointer',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  zIndex: 3
                }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '1.1rem', height: '1.1rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '1.1rem', height: '1.1rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.8} />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem', marginTop: '-0.25rem' }}>
              <Link to="/forgot-password" style={{ ...s.link, fontSize: '.75rem' }}>Forgot password?</Link>
            </div>

            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
                  <span className="auth-spinner" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div style={{display:'flex', alignItems:'center', gap:'1rem', margin:'1.5rem 0'}}>
            <div style={{flex:1, height:1, background:'#E4EBE5'}}/>
            <span style={{fontSize:'.75rem', color:'#7B907D'}}>or</span>
            <div style={{flex:1, height:1, background:'#E4EBE5'}}/>
          </div>

          <p style={{ ...s.sub, textAlign: 'center', marginTop: '1.5rem', fontSize: '.85rem' }}>
            Don't have an account?{' '}
            <Link to={plan ? `/signup?plan=${plan}` : "/signup"} style={s.link}>Create one free</Link>
          </p>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop:"1px solid #E4EBE5", padding:"1.5rem 4rem",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        background:"#FFFFFF", flexWrap:"wrap", gap:"1rem",
        position:'relative', zIndex:2,
      }}>
        <div style={{ fontSize:".7rem", color:"#7B907D" }}>© {new Date().getFullYear()} Selora. All rights reserved.</div>
        <div style={{ display:"flex", gap:"1.5rem" }}>
          <Link to="/privacy" style={{ fontSize:".74rem", color:"#7B907D", textDecoration:"none" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize:".74rem", color:"#7B907D", textDecoration:"none" }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}