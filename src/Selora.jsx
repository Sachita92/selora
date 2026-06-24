import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "./lib/AppContext";
import { useDarkMode } from "./hooks/useDarkMode";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    :root {
      --g: #5A8A67; --g2: #78A885; --gpale: #EDF3EE;
      --bg: #F8FAF8; --bg2: #F1F5F1;
      --border: #E4EBE5; --border-strong: #C7DACB; --dark: #1A271C; --text: #2E3D30; --muted: #7B907D;
      --trust-color: var(--text-secondary, #3B5A44);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; font-size: 15px; }
    h1, h2, h3 { font-family: 'Fraunces', serif; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.7)} }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes growBar { from{width:0} to{width:100%} }
    @keyframes shimmer { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(260%) skewX(-15deg)} }

    .au  { animation: fadeUp .65s ease both; }
    .au1 { animation: fadeUp .65s .08s ease both; }
    .au2 { animation: fadeUp .65s .18s ease both; }
    .au3 { animation: fadeUp .65s .28s ease both; }
    .au4 { animation: fadeUp .65s .42s ease both; }
    .pdot  { animation: pulse 2.2s infinite; }
    .float { animation: float 4.5s ease-in-out infinite; }

    .feat-card { background:var(--bg-1,#fff); border:1px solid var(--border); border-radius:14px; padding:2.6rem 2.2rem; transition:border-color 0.2s ease, transform 0.2s ease; position:relative; overflow:hidden; }
    .feat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--g),var(--g2)); opacity:0; transition:opacity .3s; }
    .feat-card:hover { border-color:var(--border-strong); transform:translateY(-2px); }
    .feat-card:hover::before { opacity:1; }

    .step-line { display:flex; gap:1.1rem; padding:1.5rem 0; border-bottom:1px solid var(--border); }
    .step-line:last-child { border-bottom:none; }

    .price-card { background:var(--bg-1,#fff); border:1px solid var(--border); border-radius:16px; padding:2rem; position:relative; transition:border-color 0.2s ease, transform 0.2s ease; }
    .price-card:hover { border-color:var(--border-strong); transform:translateY(-2px); }
    .price-card.feat { border-color:var(--g); background:linear-gradient(140deg,var(--bg-1,#fff),#F3F8F4); }
    .price-card.feat::before { content:'Most popular'; position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:var(--g); color:#fff; font-size:.6rem; font-weight:700; letter-spacing:.08em; padding:.28rem .9rem; border-radius:999px; text-transform:uppercase; font-family:'Inter',sans-serif; }

    .testi-card { background:var(--bg-1,#fff); border:1px solid var(--border); border-radius:13px; padding:1.6rem; transition:border-color 0.2s ease, transform 0.2s ease; }
    .testi-card:hover { border-color:var(--border-strong); transform:translateY(-2px); }

    .faq-item { border-bottom:1px solid var(--border); }
    .faq-item:last-child { border-bottom:none; }
    .faq-btn { width:100%; background:none; border:none; cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:1.3rem 0; text-align:left; gap:1rem; }
    .faq-chevron { width:18px; height:18px; transition:transform .25s ease; color:var(--muted); flex-shrink:0; }
    .faq-chevron.open { transform:rotate(180deg); }
    .faq-body { overflow:hidden; transition:max-height .3s ease, opacity .25s ease; }

    .integ-card { background:var(--bg-1,#fff); border:1px solid var(--border); border-radius:14px; transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease; text-decoration:none; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; text-align:left; padding:1.5rem; }
    .integ-card:hover { transform:translateY(-5px); border-color:var(--g); box-shadow:0 12px 30px rgba(90,138,103,0.08); }
    .integ-card.disabled { cursor:default; }
    .integ-card.disabled:hover { transform:none; border-color:var(--border); box-shadow:none; }
    .marquee-container { overflow:hidden; width:100%; position:relative; margin:2.2rem 0; mask-image:linear-gradient(to right, transparent, #000 12%, #000 88%, transparent); -webkit-mask-image:linear-gradient(to right, transparent, #000 12%, #000 88%, transparent); padding: 0.5rem 0; }
    .marquee-track { display:flex; gap:1.1rem; width:max-content; animation: marquee-scroll 30s linear infinite; }
    .marquee-track:hover { animation-play-state: paused; }
    @keyframes marquee-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }


    @media (max-width: 900px) {
      .nav-links { display:none !important; }
      .two-col, .how-grid, .feat-inner, .price-inner, .testi-inner { grid-template-columns:1fr !important; }
      .hero-grid { grid-template-columns:1fr !important; }
      .hero-visual { display:none !important; }
      .footer-grid { grid-template-columns:1fr 1fr !important; }
      .mob-pad { padding-left:1.2rem !important; padding-right:1.2rem !important; }
      .mob-vpad { padding-top:3.5rem !important; padding-bottom:3.5rem !important; }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns:1fr !important; }
      .stats-bar { gap:1.5rem !important; }
    }
    @media (max-width: 480px) {
      .nav-btn-text-long { display: none; }
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }
    .skeleton-pulse {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
  `}</style>
);

// ─── Snowflake Canvas ─────────────────────────────────────────────────────────
function SnowCanvas({ color }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const particlesRef = useRef([]);
  const colorRef = useRef(color || 'rgba(90, 138, 103, 0.45)');
  const PHI = 1.6180339887;
  const COUNT = 20;

  useEffect(() => {
    colorRef.current = color || 'rgba(90, 138, 103, 0.45)';
  }, [color]);

  function goldenX(i, w) { return (((i * PHI) % 1) * 0.88 + 0.06) * w; }

  function drawArm(ctx, len) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
    const b1 = len * 0.38, b2 = len * 0.62, bl = len * 0.22;
    [-b1, -b2].forEach(by => {
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(bl * 0.7, by - bl * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(-bl * 0.7, by - bl * 0.7); ctx.stroke();
    });
  }

  function drawSnowflake(ctx, x, y, size, angle, opacity) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.globalAlpha = opacity; ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = 1; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate((Math.PI / 3) * i); drawArm(ctx, size); ctx.restore();
    }
    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    const w = canvas.width || 800; const h = canvas.height || 600;
    particlesRef.current = Array.from({ length: COUNT }, (_, i) => ({
      baseX: goldenX(i, w), x: goldenX(i, w), y: Math.random() * h,
      size: 5 + Math.random() * 9, speed: 3 + Math.random() * 3,
      swayAmp: 4 + Math.random() * 6, swayFreq: 0.25 + Math.random() * 0.35,
      spinSpeed: (Math.random() - 0.5) * 0.4, angle: Math.random() * Math.PI * 2,
      opacity: 0.18 + Math.random() * 0.18, phase: Math.random() * Math.PI * 2,
    }));
    function animate(ts) {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      particlesRef.current.forEach(p => {
        p.y += p.speed * dt; p.angle += p.spinSpeed * dt;
        p.x = p.baseX + Math.sin(ts / 1000 * p.swayFreq * Math.PI * 2 + p.phase) * p.swayAmp;
        if (p.y - p.size > H) { p.y = -p.size * 2; p.baseX = goldenX(Math.random() * COUNT | 0, W); }
        drawSnowflake(ctx, p.x, p.y, p.size, p.angle, p.opacity);
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    eyebrow: "AI Growth Agent for Fashion",
    h1: ["Your Fashion Store Grows", "While You Sleep"],
    italic: 1,
    p: "Selora is built exclusively for fashion sellers. It handles pricing, listings, ads, and inventory — automatically, every night.",
    cta: "Start Growing for Free →", cta2: "See How It Works",
  },
  {
    eyebrow: "Listing Intelligence",
    h1: ["Fashion listings that turn", "browsers into buyers"],
    italic: 1,
    p: "Selora rewrites your titles and descriptions with styling tips, fit guidance, and occasion copy — the kind of copy that actually converts.",
    cta: "See It in Action", cta2: "Learn More",
  },
  {
    eyebrow: "Inventory Intelligence",
    h1: ["Never lose a sale to an empty", " rack again"],
    italic: 2,
    p: "Selora tracks how fast each piece sells and warns you before you run out — so your bestsellers are always there when customers want them.",
    cta: "Start for Free", cta2: "Book a Demo",
  },
];

const STATS = [
  { num: "12K+", label: "Stores Growing" },
  { num: "$2B+", label: "Revenue Grown" },
  { num: "3.8x", label: "Avg Growth Rate" },
  { num: "99%",  label: "Uptime" },
];

const FEATURES = [
  { icon:"💰", title:"Fashion-Smart Pricing",      desc:"Selora understands seasonality and trends. It adjusts prices at exactly the right moment — peak season, end of season, or when a style is trending." },
  { icon:"✍️", title:"Listings That Convert",       desc:"Weak listings kill fashion sales. Selora rewrites titles and descriptions with styling tips, fit guidance, and occasion copy that makes buyers act." },
  { icon:"📣", title:"Smarter Ad Spend",            desc:"Stop burning budget on ads that don't convert. Selora shifts your spend toward the pieces that are actually selling — automatically." },
  { icon:"📊", title:"Collection Analytics",        desc:"See which pieces are your stars and which are slow movers. Plain English insights — no confusing dashboards to decode." },
  { icon:"📦", title:"Never Sell Out",              desc:"Selora tracks sell velocity per piece and warns you before you run out — so you never lose a sale to an empty size grid." },
  { icon:"🛡️", title:"You're Always in Control",   desc:"Every action Selora takes is logged and explained. Approve, adjust, or pause anything — it's your collection, always." },
];

const STEPS = [
  { title:"Set Up Your Store",     desc:"Connect your existing Shopify store in one click, or launch a new storefront on Selora — either way, it starts working immediately." },
  { title:"Set Your Goals",         desc:"More revenue? Better margins? Less wasted ad spend? Selora builds a growth plan around your collection." },
  { title:"Wake Up to Growth",      desc:"Every morning you get a simple report — what grew, what was fixed, and what's next for your collection." },
];

const SHOWCASE_EXAMPLES = [
  { before: "Floral wrap dress. 100% rayon. S, M, L. Machine washable.",   after: "Effortless floral wrap dress — flowy, flattering, brunch-to-backyard.",         bgImage: "/hero-dress.png",  bgPos: "center 30%" },
  { before: "Woolen sweater. Sage green. Oversized fit. Hand wash.",         after: "Cozy sage green woolen sweater — warm, oversized, fireside-ready.",         bgImage: "/hero-blazer.png", bgPos: "center 40%" },
  { before: "Leather boots. Black. Size 6-10. rubber sole. round toe.",     after: "Handcrafted black leather boots — weather-resistant, all-day cushioned walk.", bgImage: "/hero-boots.png",  bgPos: "center 45%" },
];

const PLANS = [
  { name:"Free",   price:"0",     slug:"free",   desc:"Get started at no cost. Perfect for exploring what Selora can do.",                   features:["1 Store","Up to 50 Products","3 Optimizations / mo","Basic Reports","Community Support"],                                    feat:false, cta:"Get Started Free" },
  { name:"Growth", price:"9.99",  slug:"growth", desc:"For fashion sellers ready to accelerate with AI-powered growth.",                     features:["1 Store","Unlimited Products","30 Optimizations / mo","Full Growth Agent","Auto Pricing","Listing Rewriter","Email Support"], feat:true,  cta:"Start Free Trial" },
  { name:"Scale",  price:"29.99", slug:"scale",  desc:"For established brands scaling across multiple stores.",                              features:["3 Stores","Unlimited Products","Unlimited Optimizations","Priority Support","Ad Optimization","Early pay.sh Access"],          feat:false, cta:"Upgrade to Scale" },
];

const FAQS = [
  { q: "How long does setup take?", a: "Under 5 minutes. Connect your Shopify store or launch a new native storefront on Selora, set your goals, and Selora handles the rest." },
  { q: "Do I need technical skills?", a: "Not at all. Selora is built for fashion sellers, not developers. Everything is plain English — no code required." },
  { q: "Will Selora change things without my approval?", a: "You're always in control. You can set Selora to auto-apply changes, or require your approval before any action is taken." },
  { q: "Is my customer data safe?", a: "Yes. Selora never stores or accesses individual customer personal data. We only load order metrics and product data — no names, emails, or payment information." },
  { q: "What if I want to pause Selora?", a: "One click. You can pause or resume the agent at any time from your dashboard." },
  { q: "How quickly will I see results?", a: "Most sellers see their first improvements within 48 hours. Significant growth typically happens within the first 2 weeks." },
  { q: "Which platforms are supported?", a: "Shopify is fully supported today. You can also launch a native Selora storefront directly — no third-party platform required." },
];

const ACTIVITY = [
  { text:"Repriced Floral Wrap Dress — peak season", time:"2am" },
  { text:"Rewrote Woolen Sweater listing — CTR up",    time:"3am" },
  { text:"Paused 2 low-performing ads · saved $18",  time:"4am" },
  { text:"Restock alert: Cargo Pants — 3 units left", time:"6am" },
];

// ─── Shared primitives ────────────────────────────────────────────────────────
const Tag   = ({children, center, style}) => <p style={{fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".14em",color:"var(--g)",marginBottom:".7rem",fontFamily:"Inter,sans-serif",textAlign:center?"center":undefined,...style}}>{children}</p>;
const Title = ({children, center, style}) => <h2 style={{fontFamily:"Fraunces,serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",fontWeight:500,lineHeight:1.15,letterSpacing:"-.3px",marginBottom:".7rem",color:"var(--dark)",textAlign:center?"center":undefined,...style}}>{children}</h2>;
const Sub   = ({children, center, style}) => <p style={{fontSize:".9rem",color:"var(--muted)",lineHeight:1.8,fontWeight:300,textAlign:center?"center":undefined,...style}}>{children}</p>;
const BtnP  = ({children, style, onClick}) => <button onClick={onClick} style={{background:"var(--g)",color:"#fff",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 18px rgba(90,138,103,.28)",transition:"all .2s",...style}}>{children}</button>;
const BtnS  = ({children, style, onClick}) => <button onClick={onClick} style={{background:"var(--bg-1,#fff)",color:"var(--dark)",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:500,border:"1px solid var(--border)",cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .2s",...style}}>{children}</button>;

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

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ scrolled, darkMode, onToggleDark }) {
  const { user } = useAppContext();
  return (
    <nav style={{
      position:"fixed",top:0,left:0,right:0,zIndex:100,
      background:scrolled?"var(--nav-bg-scrolled,rgba(248,250,248,.97))":"var(--nav-bg,rgba(248,250,248,.88))",
      backdropFilter:"blur(14px)",
      borderBottom:"1px solid var(--border)",
      transition:"background .3s"
    }}>
      <div className="mob-pad" style={{
        maxWidth:1400, margin:"0 auto", padding:"1rem 2rem",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <Link to="/" style={{textDecoration:"none"}}>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.2rem",fontWeight:700,letterSpacing:"-.3px",color:"var(--dark)"}}>
            Se<span style={{color:"var(--g)"}}>lo</span>ra
          </div>
        </Link>
        <div className="nav-links" style={{display:"flex",alignItems:"center"}}>
          {[
            { label: "Features", path: "/features" },
            { label: "How It Works", path: "/how-it-works" },
            { label: "Pricing", path: "/pricing" }
          ].map(item => (
            <Link key={item.label} to={item.path} style={{fontSize:".82rem",fontWeight:500,color:"var(--muted)",textDecoration:"none",marginLeft:"2rem"}}>{item.label}</Link>
          ))}
          <Link to="/demo" style={{fontSize:".82rem",fontWeight:500,color:"var(--g)",textDecoration:"none",marginLeft:"2rem"}}>Book a Demo</Link>
        </div>
        <div style={{display:"flex",gap:".7rem",alignItems:"center"}}>
          <button className="cn-theme-toggle" onClick={onToggleDark} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:".25rem",borderRadius:6}}>
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
            <Link to="/dashboard" style={{background:"var(--g)",color:"#fff",padding:".5rem 1.3rem",borderRadius:7,fontSize:".82rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" style={{fontSize:".82rem",fontWeight:500,color:"var(--muted)",textDecoration:"none"}}>Sign In</Link>
              <Link to="/signup" style={{background:"var(--g)",color:"#fff",padding:".5rem 1.3rem",borderRadius:7,fontSize:".82rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
                Get Started<span className="nav-btn-text-long"> Free</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Three-stage AI Card (Hero right column) ──────────────────────────────────
const CHECKLIST = ["Material & Fabric", "Style & Silhouette", "Fit & Sizing", "Occasion & Styling", "SEO Keywords"];

function AIRewriteCard({ exampleIdx, onCycle }) {
  const [stage, setStage] = useState(0); // 0=before, 1=analyzing, 2=after
  const [progress, setProgress] = useState(0);
  const [checkedItems, setCheckedItems] = useState([]);
  const stageRef = useRef(0);
  const timerRef = useRef(null);

  const example = SHOWCASE_EXAMPLES[exampleIdx];

  const runCycle = () => {
    stageRef.current = 0;
    setStage(0);
    setProgress(0);
    setCheckedItems([]);

    // Show "before" for 2.2s, then analyze
    timerRef.current = setTimeout(() => {
      stageRef.current = 1;
      setStage(1);
      let p = 0;
      let itemIdx = 0;
      const interval = setInterval(() => {
        p += 2;
        setProgress(p);
        if (p === 20 || p === 40 || p === 58 || p === 76 || p === 90) {
          setCheckedItems(prev => {
            const next = [...prev, CHECKLIST[itemIdx]];
            itemIdx++;
            return next;
          });
        }
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            stageRef.current = 2;
            setStage(2);
          }, 180);
        }
      }, 40);

      // After showing result for 2.8s, cycle to next example
      timerRef.current = setTimeout(() => {
        onCycle((exampleIdx + 1) % SHOWCASE_EXAMPLES.length);
      }, 2200 + 40 * 55 + 2800);
    }, 2200);
  };

  useEffect(() => {
    runCycle();
    return () => clearTimeout(timerRef.current);
  }, [exampleIdx]);

  return (
    <div className="float" style={{background:"var(--bg-1,#fff)",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 18px 55px rgba(90,138,103,.11)",fontFamily:"Inter,sans-serif",minHeight:320}}>
      {/* Header bar */}
      <div style={{background:"var(--bg2,#F1F5F1)",borderBottom:"1px solid var(--border)",padding:".75rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
          {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
          <span style={{marginLeft:".7rem",fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Listing Intelligence</span>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",background:"var(--gpale,#EDF3EE)",border:"1px solid var(--border)",color:"var(--g)",padding:".28rem .8rem",borderRadius:999,fontSize:".68rem",fontWeight:600,letterSpacing:".04em",fontFamily:"Inter,sans-serif"}}>
          Live demo
        </div>
      </div>

      {/* Stage content */}
      <div style={{padding:"1.3rem"}}>
        {/* Stage label */}
        <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:"1rem"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:stage===0?"var(--muted)":stage===1?"#f59e0b":"var(--g)",transition:"background .3s"}}/>
          <span style={{fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:stage===0?"var(--muted)":stage===1?"#f59e0b":"var(--g)",transition:"color .3s"}}>
            {stage===0?"Original listing":stage===1?"AI is analyzing...":"AI-optimized result"}
          </span>
        </div>

        {/* Before */}
        {stage === 0 && (
          <div style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border)",minHeight:72,transition:"opacity .3s"}}>
            <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{example.before}</p>
          </div>
        )}

        {/* Analyzing */}
        {stage === 1 && (
          <div>
            <div style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border)",marginBottom:"1rem"}}>
              <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300,opacity:.5}}>{example.before}</p>
            </div>
            {/* Progress bar */}
            <div style={{height:3,background:"var(--border)",borderRadius:999,marginBottom:"1rem",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,var(--g),var(--g2))",borderRadius:999,transition:"width .04s linear"}}/>
            </div>
            {/* Checklist */}
            <div style={{display:"flex",flexDirection:"column",gap:".4rem"}}>
              {CHECKLIST.map(item => {
                const done = checkedItems.includes(item);
                return (
                  <div key={item} style={{display:"flex",alignItems:"center",gap:".55rem",fontSize:".75rem",color:done?"var(--g)":"var(--muted)",fontWeight:done?600:300,transition:"color .2s"}}>
                    <span style={{width:14,height:14,borderRadius:3,border:`1px solid ${done?"var(--g)":"var(--border)"}`,background:done?"var(--g)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                      {done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* After */}
        {stage === 2 && (
          <div style={{background:"var(--gpale,#EDF3EE)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border-strong,#C7DACB)",animation:"fadeUp .35s ease both",minHeight:72}}>
            <p style={{fontSize:".88rem",color:"var(--g)",lineHeight:1.7,fontWeight:500}}>{example.after}</p>
            <div style={{marginTop:".7rem",display:"flex",alignItems:"center",gap:".35rem",fontSize:".65rem",color:"var(--g)",fontWeight:600,opacity:.8}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Optimized — ready to publish
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ darkMode }) {
  const { user } = useAppContext();
  const [exampleIdx, setExampleIdx] = useState(0);

  const TRUST_ITEMS = [
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M12 7a2 2 0 1 0-2-2m2 2l8 5c.6.4.7 1.2.3 1.8-.2.3-.5.5-.8.5H4c-.7 0-1.2-.5-1.2-1.2 0-.3.1-.7.4-.9l8.8-5.2z"/></svg>, text: "Built for fashion" },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 13"/></svg>, text: "Ready in 5 minutes" },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Bank-level security" },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, text: "Human support" },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>, text: "Cancel anytime" },
  ];

  return (
    <div style={{position:"relative",overflow:"hidden",paddingTop:"8rem",paddingBottom:"6rem"}}>

      {/* Per-product background images — cross-fade with card cycle */}
      {SHOWCASE_EXAMPLES.map((ex, i) => (
        <img
          key={ex.bgImage}
          src={ex.bgImage}
          alt=""
          aria-hidden="true"
          style={{
            position:"absolute", inset:0,
            width:"100%", height:"100%",
            objectFit:"cover", objectPosition: ex.bgPos,
            display:"block",
            opacity: i === exampleIdx ? (darkMode ? 0.28 : 0.38) : 0,
            transition:"opacity 0.45s ease",
            zIndex: 0,
          }}
        />
      ))}

      {/* Overlay to dim backdrop images and ensure text readability */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"linear-gradient(170deg, var(--bg2,#EEF4EF) 0%, var(--bg,#F8FAF8) 100%)",
        opacity: 0.76,
      }}/>

      <div className="hero-grid" style={{position:"relative",zIndex:2,maxWidth:1400,margin:"0 auto",padding:"0 2rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6rem",alignItems:"center"}}>

        {/* Left: single static headline */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center"}}>
          {/* Eyebrow badge */}
          <div className="au" style={{display:"inline-flex",alignItems:"center",gap:".45rem",background:"var(--bg-1,#fff)",border:"1px solid var(--border)",color:"var(--g)",padding:".35rem 1rem",borderRadius:999,fontSize:".72rem",fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",marginBottom:"1.5rem",boxShadow:"0 2px 10px rgba(90,138,103,.08)",fontFamily:"Inter,sans-serif"}}>
            <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"var(--g)"}}/>
            AI Growth Agent for Fashion
          </div>
          {/* Headline */}
          <h1 className="au1" style={{fontFamily:"Cormorant Garamond,serif",fontSize:"clamp(2rem,5vw,3.5rem)",fontWeight:500,lineHeight:1.1,letterSpacing:"-.5px",maxWidth:560,marginBottom:"1.1rem",color:"var(--dark)"}}>
            Your Fashion Store Grows<br/><em style={{fontStyle:"italic",color:"var(--g)"}}>While You Sleep</em>
          </h1>
          {/* Sub */}
          <p className="au2" style={{fontSize:"1rem",color:"var(--muted)",maxWidth:440,lineHeight:1.8,marginBottom:"1.8rem",fontWeight:300}}>
            Selora is built exclusively for fashion sellers. It handles pricing, listings, ads, and inventory — automatically, every night.
          </p>
          {/* CTAs */}
          <div className="au3" style={{display:"flex",gap:".9rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
            <Link to={user ? "/dashboard" : "/signup"} style={{textDecoration:"none"}}>
              <BtnP>{user ? "Go to Dashboard →" : "Start Growing for Free →"}</BtnP>
            </Link>
            <Link to="/how-it-works" style={{textDecoration:"none"}}><BtnS>See How It Works</BtnS></Link>
          </div>
          {/* Trust strip */}
          <div className="au4" style={{display:"flex",alignItems:"center",gap:"1.2rem",flexWrap:"wrap"}}>
            {TRUST_ITEMS.map(({icon,text}) => (
              <div key={text} style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".73rem",color:"var(--trust-color,var(--muted))",fontWeight:400}}>
                {icon}{text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Rewrite Card */}
        <div className="hero-visual" style={{width:"100%",maxWidth:440,margin:"0 auto"}}>
          <AIRewriteCard exampleIdx={exampleIdx} onCycle={setExampleIdx} />
        </div>
      </div>
    </div>
  );
}


// ─── Stats Bar ────────────────────────────────────────────────────────────────
// ─── Stats Bar ─── Rolling Number digit-by-digit animation ───────────────────
function RollingNumber({ value }) {
  const valueStr = String(value);
  return (
    <span style={{ display: "inline-flex", overflow: "hidden", lineHeight: 1 }}>
      {valueStr.split("").map((char, idx) => {
        if (/[0-9]/.test(char)) {
          const digit = parseInt(char, 10);
          return (
            <span
              key={idx}
              style={{
                display: "inline-block",
                height: "1.35rem",
                width: "0.62em",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: `translateY(-${digit * 10}%)`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} style={{ height: "1.35rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        }
        return <span key={idx} style={{ display: "inline-block" }}>{char}</span>;
      })}
    </span>
  );
}



// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  return (
    <div style={{background:"var(--bg2,#F1F5F1)",borderTop:"1px solid var(--border-strong)"}}>
      <section className="mob-pad mob-vpad" style={{padding:"4.5rem 2rem",maxWidth:1400,margin:"0 auto"}}>
        <div style={{textAlign:"center",maxWidth:540,margin:"0 auto 2.5rem"}}>
          <Tag center>What Selora Does</Tag>
          <Title center>Six ways your collection<br/>grows every day</Title>
          <Sub center>Each runs automatically — built specifically for the fashion industry.</Sub>
        </div>
        <div className="feat-inner" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.1rem"}}>
          {FEATURES.map((f, idx) => (
            <Reveal key={f.title} delay={idx * 70} style={{height:"100%"}}>
              <div className="feat-card" style={{height:"100%"}}>
                <div style={{width:38,height:38,background:"var(--gpale,#EDF3EE)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",marginBottom:"1rem"}}>{f.icon}</div>
                <h3 style={{fontSize:".9rem",fontWeight:600,marginBottom:".4rem",color:"var(--dark)",fontFamily:"Inter,sans-serif"}}>{f.title}</h3>
                <p style={{fontSize:".79rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Dashboard (Dashboard preview — business logic untouched) ─────────────────
function getUTCDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) d.setUTCDate(d.getUTCDate() + offsetDays);
  const yyyy = d.getUTCFullYear(), mm = String(d.getUTCMonth() + 1).padStart(2, '0'), dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function cyrb128(str) {
  let h1 = 1779033703, h2 = 302473470, h3 = 3362450863, h4 = 50249225;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}
function mulberry32(a) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function getFallbackDashboardData() {
  const todayStr = getUTCDateString(0), yesterdayStr = getUTCDateString(-1);
  const rngToday = mulberry32(cyrb128(todayStr)[0]);
  const revToday = Math.round(3000 + rngToday() * 3000), ordersToday = Math.round(150 + rngToday() * 150), convToday = Math.round((2.5 + rngToday() * 1.5) * 100) / 100;
  const rngYesterday = mulberry32(cyrb128(yesterdayStr)[0]);
  const revYesterday = Math.round(3000 + rngYesterday() * 3000), ordersYesterday = Math.round(150 + rngYesterday() * 150), convYesterday = Math.round((2.5 + rngYesterday() * 1.5) * 100) / 100;
  return {
    revenue: revToday, revenueDeltaPct: Math.round(((revToday-revYesterday)/revYesterday)*1000)/10,
    orders: ordersToday, ordersDeltaPct: Math.round(((ordersToday-ordersYesterday)/ordersYesterday)*1000)/10,
    conversionPct: convToday, conversionDeltaPts: Math.round((convToday-convYesterday)*100)/100,
    activity: [
      { action: "Optimized listing", product: "Floral wrap dress", time: "2:00 AM" },
      { action: "Adjusted price", product: "Leather boots", time: "3:15 AM" },
      { action: "Restocked alert", product: "Woolen sweater", time: "5:30 AM" },
      { action: "Generated growth report", product: null, time: "7:00 AM" }
    ]
  };
}
const FALLBACK_DASHBOARD_DATA = getFallbackDashboardData();
const SkeletonMetric = () => (
  <div style={{background:"var(--bg2)",borderRadius:9,padding:".85rem",border:"1px solid var(--border)",display:"flex",flexDirection:"column",gap:".35rem"}}>
    <div className="skeleton-pulse" style={{width:"60%",height:"1.25rem",background:"var(--border)",borderRadius:4}}/>
    <div className="skeleton-pulse" style={{width:"40%",height:".62rem",background:"var(--border)",borderRadius:3}}/>
    <div className="skeleton-pulse" style={{width:"50%",height:".65rem",background:"var(--border)",borderRadius:3}}/>
  </div>
);
const SkeletonActivityRow = ({ isLast }) => (
  <div className="skeleton-pulse" style={{display:"flex",alignItems:"center",gap:".6rem",padding:".55rem .7rem",background:"var(--bg2)",borderRadius:7,border:"1px solid var(--border)",marginBottom:isLast?0:".45rem"}}>
    <div style={{width:5,height:5,borderRadius:"50%",background:"var(--border)",flexShrink:0}}/>
    <div style={{flex:1,height:".72rem",background:"var(--border)",borderRadius:3}}/>
    <div style={{width:30,height:".65rem",background:"var(--border)",borderRadius:3}}/>
  </div>
);

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/landing/demo-dashboard')
      .then(r => { if (!r.ok) throw new Error("API error"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error("Fallback:", e); setData(getFallbackDashboardData()); setLoading(false); });
  }, []);

  const activityList = data?.activity || FALLBACK_DASHBOARD_DATA.activity;
  const revValue = "$" + (data?.revenue ?? FALLBACK_DASHBOARD_DATA.revenue).toLocaleString();
  const revDeltaVal = data?.revenueDeltaPct ?? FALLBACK_DASHBOARD_DATA.revenueDeltaPct;
  const revDeltaStr = (revDeltaVal >= 0 ? "↑ " : "↓ ") + Math.abs(revDeltaVal).toFixed(0) + "% today";
  const ordValue = (data?.orders ?? FALLBACK_DASHBOARD_DATA.orders).toLocaleString();
  const ordDeltaVal = data?.ordersDeltaPct ?? FALLBACK_DASHBOARD_DATA.ordersDeltaPct;
  const ordDeltaStr = (ordDeltaVal >= 0 ? "↑ " : "↓ ") + Math.abs(ordDeltaVal).toFixed(0) + "% today";
  const convValue = (data?.conversionPct ?? FALLBACK_DASHBOARD_DATA.conversionPct).toFixed(1) + "%";
  const convDeltaVal = data?.conversionDeltaPts ?? FALLBACK_DASHBOARD_DATA.conversionDeltaPts;
  const convDeltaStr = (convDeltaVal >= 0 ? "↑ " : "↓ ") + Math.abs(convDeltaVal).toFixed(1) + "% today";
  const metrics = [
    { v: revValue, l: "Revenue", c: revDeltaStr },
    { v: ordValue, l: "Orders", c: ordDeltaStr },
    { v: convValue, l: "Conv.", c: convDeltaStr }
  ];
  const cardContent = (
    <>
      <div style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:".8rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:".6rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
          {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
          <span style={{marginLeft:".7rem",fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Fashion Dashboard</span>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",background:"var(--gpale)",border:"1px solid var(--border)",color:"var(--g)",padding:".35rem 1rem",borderRadius:999,fontSize:".75rem",fontWeight:600,letterSpacing:".05em",fontFamily:"Inter,sans-serif"}}>
          Demo data
        </div>
      </div>
      <div style={{padding:"1.3rem"}}>
        <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>This Morning's Growth</p>
        {loading ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".7rem",marginBottom:"1.1rem"}}>
            <SkeletonMetric/><SkeletonMetric/><SkeletonMetric/>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".7rem",marginBottom:"1.1rem"}}>
            {metrics.map(({v,l,c}) => (
              <div key={l} style={{background:"var(--bg2)",borderRadius:9,padding:".85rem",border:"1px solid var(--border)"}}>
                <div style={{fontSize:"1.25rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",letterSpacing:"-.3px"}}>{v}</div>
                <div style={{fontSize:".62rem",color:"var(--muted)",marginTop:".15rem",textTransform:"uppercase",letterSpacing:".05em"}}>{l}</div>
                <div style={{fontSize:".65rem",color:"var(--g)",fontWeight:600,marginTop:".25rem"}}>{c}</div>
              </div>
            ))}
          </div>
        )}
        <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>What Selora Did Overnight</p>
        {loading ? (
          <><SkeletonActivityRow/><SkeletonActivityRow/><SkeletonActivityRow/><SkeletonActivityRow isLast={true}/></>
        ) : activityList.slice(0,4).map((a,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:".6rem",padding:".55rem .7rem",background:"var(--bg2)",borderRadius:7,fontSize:".72rem",border:"1px solid var(--border)",marginBottom:i<3?".45rem":0}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"var(--g)",flexShrink:0}}/>
            <span style={{flex:1,color:"var(--text)"}}>{a.action}{a.product ? ` · ${a.product}` : ""}</span>
            <span style={{color:"var(--muted)",fontSize:".65rem"}}>{a.time}</span>
          </div>
        ))}
      </div>
    </>
  );
  return (
    <div className="float" style={{background:"var(--bg-1,#fff)",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 18px 55px rgba(90,138,103,.11)"}}>
      {cardContent}
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <div style={{background:"var(--bg,#F8FAF8)",borderTop:"1px solid var(--border-strong)"}}>
      <div className="how-grid mob-pad" style={{maxWidth:1400,margin:"0 auto",padding:"4.5rem 2rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5rem",alignItems:"center"}}>
        <div>
          <Tag>How It Works</Tag>
          <Title>Three steps to a<br/>self-growing collection</Title>
          <Sub style={{marginBottom:"2.5rem"}}>No technical setup. Built for fashion sellers, not developers.</Sub>
          <div>
            {STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="step-line">
                  <div style={{width:30,height:30,minWidth:30,background:"var(--g)",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".72rem",fontWeight:700}}>{i+1}</div>
                  <div>
                    <h4 style={{fontSize:".88rem",fontWeight:600,marginBottom:".3rem",color:"var(--dark)",fontFamily:"Inter,sans-serif"}}>{step.title}</h4>
                    <p style={{fontSize:".79rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Dashboard />
      </div>
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const { user } = useAppContext();
  return (
    <div style={{background:"var(--bg2,#F1F5F1)",borderTop:"1px solid var(--border-strong)"}}>
      <section className="mob-pad mob-vpad" style={{padding:"4.5rem 2rem",maxWidth:1400,margin:"0 auto"}}>
        <div style={{textAlign:"center",maxWidth:500,margin:"0 auto 2.8rem"}}>
          <Tag center>Pricing</Tag>
          <Title center>Grow your collection,<br/>pay as you scale</Title>
          <Sub center>Start free. No contracts, no hidden fees, no surprises.</Sub>
        </div>
        <div className="price-inner" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.3rem"}}>
          {PLANS.map((plan, idx) => {
            const getLinkTarget = () => user
              ? (plan.slug === 'free' ? '/dashboard' : `/pricing?plan=${plan.slug}`)
              : (plan.slug === 'free' ? '/signup' : `/signup?plan=${plan.slug}`);
            return (
              <Reveal key={plan.name} delay={idx * 80} style={{height:"100%"}}>
                <div className={`price-card${plan.feat?" feat":""}`} style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:plan.feat?"rgba(26,39,28,.5)":"var(--muted)",marginBottom:".8rem",fontFamily:"Inter,sans-serif"}}>{plan.name}</div>
                    {plan.price === "0" ? (
                      <div style={{fontSize:"2.5rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",lineHeight:1,letterSpacing:"-.5px"}}>Free</div>
                    ) : (
                      <div style={{fontSize:"2.5rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",lineHeight:1,letterSpacing:"-.5px"}}>
                        <sup style={{fontSize:"1rem",verticalAlign:"super",color:"var(--g)"}}>$</sup>{plan.price}
                        <span style={{fontSize:".8rem",color:"var(--muted)",fontWeight:400,fontFamily:"Inter,sans-serif"}}>/mo</span>
                      </div>
                    )}
                    <p style={{fontSize:".78rem",color:"var(--muted)",margin:".65rem 0 1.2rem",fontWeight:300,lineHeight:1.6}}>{plan.desc}</p>
                    <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:".55rem",marginBottom:"1.6rem"}}>
                      {plan.features.map(f => (
                        <li key={f} style={{fontSize:".78rem",color:"var(--text)",display:"flex",alignItems:"center",gap:".5rem",fontWeight:300}}>
                          <span style={{color:"var(--g)",fontWeight:700}}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to={getLinkTarget()} style={{display:"block",width:"100%",padding:".72rem",borderRadius:8,fontWeight:600,fontSize:".82rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textAlign:"center",textDecoration:"none",transition:"all .2s",...(plan.feat?{background:"var(--g)",color:"#fff",border:"1px solid var(--g)"}:{background:"transparent",color:"var(--dark)",border:"1px solid var(--border)"})}}>
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Testimonial — two-column: text left, image right, auto-fade carousel ──────
const TESTIMONIALS = [
  {
    quote:  "Selora found the words I never could for my collection. My listings finally sound like the pieces themselves.",
    author: "Founder, independent fashion label",
    image:  "/sweater.png",
    pos:    "center 30%",
  },
  {
    quote:  "I stopped dreading Monday mornings. Selora's overnight report tells me exactly what happened and what to do next — in plain English.",
    author: "Owner, womenswear boutique",
    image:  "/leather-jacket.png",
    pos:    "center 25%",
  },
  {
    quote:  "My bestseller sold out before I even noticed the trend. Selora caught it first and flagged a restock in time. That alone paid for a year.",
    author: "Designer, sustainable fashion brand",
    image:  "/trench-coat.png",
    pos:    "center 30%",
  },
];

function Testimonial({ darkMode }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % TESTIMONIALS.length);
        setFading(false);
      }, 380);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const t = TESTIMONIALS[current];

  return (
    <div style={{
      background: darkMode ? "#000" : "#fff",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div className="two-col" style={{
        maxWidth: 1400, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        minHeight: 230,
      }}>
        {/* LEFT — quote panel */}
        <div
          style={{
            padding: "2rem 2rem",
            display: "flex", flexDirection: "column", justifyContent: "center",
            opacity: fading ? 0 : 1,
            transform: fading ? "translateX(-10px)" : "translateX(0)",
            transition: "opacity 0.38s ease, transform 0.38s ease",
          }}
        >
          <div style={{color: darkMode ? "#86EFAC" : "var(--g)", fontSize: ".85rem", marginBottom: ".9rem", letterSpacing: 3}}>★★★★★</div>
          <blockquote style={{
            fontFamily: "Fraunces,serif",
            fontSize: "clamp(1rem,1.8vw,1.4rem)",
            fontWeight: 400, fontStyle: "italic",
            lineHeight: 1.55, letterSpacing: "-.15px",
            color: "var(--dark)", marginBottom: "1.3rem",
            borderLeft: "none", padding: 0,
          }}>
            "{t.quote}"
          </blockquote>
          <div style={{fontSize: ".72rem", color: "var(--muted)", fontFamily: "Inter,sans-serif", fontWeight: 300, letterSpacing: ".04em"}}>
            — {t.author}
          </div>
        </div>

        {/* RIGHT — image cross-fades */}
        <div style={{position: "relative", overflow: "hidden", minHeight: 200}}>
          {TESTIMONIALS.map((slide, i) => (
            <img
              key={slide.image}
              src={slide.image}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: slide.pos,
                display: "block",
                opacity: i === current ? 1 : 0,
                transition: "opacity 0.65s ease",
                zIndex: i === current ? 1 : 0,
              }}
            />
          ))}
          {/* left-edge gradient blending into panel */}
          <div style={{
            position: "absolute", inset: 0,
            background: darkMode
              ? "linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 28%)"
              : "linear-gradient(to right, rgba(255,255,255,0.6) 0%, transparent 28%)",
            zIndex: 2, pointerEvents: "none"
          }}/>
        </div>
      </div>
    </div>
  );
}


// ─── ConnectSection ───────────────────────────────────────────────────────────
// ─── ConnectSection ───────────────────────────────────────────────────────────
function ShopifyLogo() {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 150 162" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ marginRight: "10px", flexShrink: 0 }}
    >
      <path d="M100.5 25.1C95.9 24.5 91.1 27.5 89.8 32.1L73 96.2L126.2 35.8L100.5 25.1Z" fill="#95BF47"/>
      <path d="M132.8 53L73 36.5L20.3 95.7L45.3 158C47 162.3 51.2 165 55.7 165H122.4C127.4 165 131.8 161.8 133.3 157L151.7 92.2C153.5 86 151.7 79.3 147.4 75L132.8 53Z" fill="#5E8E3E"/>
      <path d="M69.3 37.3C67.6 39.2 66.8 41.9 67.1 44.6L72 86.4C72.3 88.6 74.1 90.2 76.2 90.5C76.5 90.5 76.8 90.5 77.1 90.5C79 90.5 80.8 89.2 81.3 87.3L87.8 60.7L69.3 37.3Z" fill="#95BF47"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="var(--g, #6FBF8B)" 
      stroke="var(--g, #6FBF8B)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ marginRight: "10px", flexShrink: 0 }}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function WooCommerceLogo() {
  return (
    <svg 
      width="22" 
      height="15" 
      viewBox="0 0 56 32" 
      fill="#96588a" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ marginRight: "10px", flexShrink: 0 }}
    >
      <path d="M49.2 1.6C46.8.6 44.2 0 41.5 0c-5.8 0-10.8 2.7-14 6.8C24.3 2.7 19.3 0 13.5 0c-2.7 0-5.3.6-7.7 1.6L0 12.8v11.7l8 5.9h40l8-5.9V12.8l-6.8-11.2zm-28 17.9L16 11.2l-5.2 8.3c-.6.9-1.6 1.4-2.7 1.4H4.8l7.2-11.5c1-1.6 2.8-2.6 4.7-2.6s3.7 1 4.7 2.6l7.2 11.5H23.9c-1.1 0-2.1-.5-2.7-1.4zm23.6 0l-5.2-8.3-5.2 8.3c-.6.9-1.6 1.4-2.7 1.4h-4.3l7.2-11.5c1-1.6 2.8-2.6 4.7-2.6s3.7 1 4.7 2.6l7.2 11.5h-4.3c-1.1.1-2.1-.4-2.7-1.4z"/>
    </svg>
  );
}

function AmazonLogo() {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginRight: '10px', height: '18px', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '0.92rem', color: 'var(--dark)', letterSpacing: '-0.3px', lineHeight: 1 }}>
        a
      </span>
      <svg width="12" height="4" viewBox="0 0 12 4" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-2px' }}>
        <path d="M1 1C4 2.5 8 2.5 11 1" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function EtsyLogo() {
  return (
    <span style={{ fontFamily: '"Georgia", serif', fontSize: '1.05rem', fontWeight: 'bold', color: '#D5641C', marginRight: '10px', flexShrink: 0 }}>
      E
    </span>
  );
}

function ConnectSection() {
  const { user } = useAppContext();
  const [stores, setStores] = useState(12491);
  const [revenue, setRevenue] = useState(2148591248);
  const [growth, setGrowth] = useState(3.8271);
  const [uptime, setUptime] = useState(99.9994);

  useEffect(() => {
    // 1. Stores: ticks up by 1 store every 5 seconds
    const storesInterval = setInterval(() => {
      setStores(s => s + 1);
    }, 5000);

    // 2. Revenue: ticks up by a random sale amount ($120 - $340) every 2 seconds
    const revenueInterval = setInterval(() => {
      setRevenue(r => r + Math.floor(120 + Math.random() * 220));
    }, 2000);

    // 3. Growth Rate: fluctuates slightly every 4 seconds
    const growthInterval = setInterval(() => {
      setGrowth(g => {
        const delta = Math.random() > 0.4 ? 0.0001 : -0.0001;
        return Math.max(3.8000, Math.min(3.9000, g + delta));
      });
    }, 4000);

    // 4. Uptime: fluctuates between 99.9990% and 99.9999% every 6 seconds
    const uptimeInterval = setInterval(() => {
      setUptime(u => {
        const target = 99.999 + Math.random() * 0.0009;
        return Math.round(target * 10000) / 10000;
      });
    }, 6000);

    return () => {
      clearInterval(storesInterval);
      clearInterval(revenueInterval);
      clearInterval(growthInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const INTEGRATIONS = [
    {
      title: "Shopify",
      desc: "One-click connect",
      icon: <ShopifyLogo />,
      isStandout: false,
      isComingSoon: false,
    },
    {
      title: "Create your Store",
      desc: "Launch with Selora",
      icon: <SparkleIcon />,
      isStandout: true,
      isComingSoon: false,
    },
    {
      title: "WooCommerce",
      desc: "Sync products",
      icon: <WooCommerceLogo />,
      isStandout: false,
      isComingSoon: true,
    },
    {
      title: "Amazon",
      desc: "Optimize listings",
      icon: <AmazonLogo />,
      isStandout: false,
      isComingSoon: true,
    },
    {
      title: "Etsy",
      desc: "Improve SEO",
      icon: <EtsyLogo />,
      isStandout: false,
      isComingSoon: true,
    }
  ];

  return (
    <div style={{ background: "var(--bg-1,#fff)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="mob-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "4rem 2rem" }}>
        
        {/* Centered Heading */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--g)", textTransform: "uppercase", letterSpacing: ".1em", display: "block", fontFamily: "Inter,sans-serif", marginBottom: "0.4rem" }}>
            SETUP & INTEGRATIONS
          </span>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "2.1rem", fontWeight: 500, color: "var(--dark)", lineHeight: 1.2, letterSpacing: "-.3px" }}>
            Trusted by Fashion Sellers Worldwide
          </h2>
        </div>

        {/* Infinite Marquee Scroll */}
        <div className="marquee-container au">
          <div className="marquee-track">
            {[...INTEGRATIONS, ...INTEGRATIONS].map((card, idx) => {
              const isStandout = card.isStandout;
              const isComingSoon = card.isComingSoon;
              const borderStyle = isStandout 
                ? "1px solid var(--g)" 
                : "1px solid var(--border)";
              const bgStyle = isStandout 
                ? "linear-gradient(135deg, var(--bg-1, #fff), var(--gpale, #EDF3EE))" 
                : "var(--bg-1, #fff)";

              const content = (
                <>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    {card.icon}
                    <span style={{ fontWeight: 600, fontSize: "1.05rem", color: isStandout ? "var(--g)" : "var(--dark)", fontFamily: "Inter, sans-serif" }}>
                      {card.title}
                    </span>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: ".85rem", lineHeight: 1.4, fontWeight: 300, paddingLeft: "28px", marginTop: "0.25rem" }}>
                    {card.desc}
                  </div>
                  {isComingSoon && (
                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: "28px", marginTop: "0.4rem" }}>
                      Coming soon
                    </div>
                  )}
                </>
              );

              if (isComingSoon) {
                return (
                  <div 
                    key={idx} 
                    className="integ-card disabled"
                    style={{
                      border: borderStyle,
                      background: bgStyle,
                      opacity: 0.75,
                      minHeight: "115px",
                      width: "240px",
                      flexShrink: 0,
                    }}
                  >
                    {content}
                  </div>
                );
              }

              const getLinkTarget = () => {
                if (user) {
                  return card.title === "Create your Store" ? "/store-builder" : "/connect";
                }
                return "/signup";
              };

              return (
                <Link 
                  key={idx} 
                  to={getLinkTarget()} 
                  className="integ-card"
                  style={{
                    border: borderStyle,
                    background: bgStyle,
                    minHeight: "115px",
                    width: "240px",
                    flexShrink: 0,
                  }}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Metrics Row */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          fontSize: "0.85rem",
          color: "var(--muted)",
          fontFamily: "Inter, sans-serif",
          marginTop: "2.5rem",
          borderTop: "1px solid var(--border)",
          paddingTop: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--dark)", marginRight: "4px", fontVariantNumeric: "tabular-nums" }}>
              <RollingNumber value={stores.toLocaleString()} />+
            </span>
            <span>Stores</span>
          </div>
          <span style={{ color: "var(--border-strong)" }}>•</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--dark)", marginRight: "4px", fontVariantNumeric: "tabular-nums" }}>
              $<RollingNumber value={revenue.toLocaleString()} />+
            </span>
            <span>Revenue</span>
          </div>
          <span style={{ color: "var(--border-strong)" }}>•</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--dark)", marginRight: "4px", fontVariantNumeric: "tabular-nums" }}>
              <RollingNumber value={uptime.toFixed(4)} />%
            </span>
            <span>Uptime</span>
          </div>
          <span style={{ color: "var(--border-strong)" }}>•</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--dark)", marginRight: "4px", fontVariantNumeric: "tabular-nums" }}>
              <RollingNumber value={growth.toFixed(4)} />x
            </span>
            <span>Avg Growth</span>
          </div>
        </div>

      </div>
    </div>
  );
}


// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  const { user } = useAppContext();
  return (
    <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(140deg,#1A271C 0%,#233329 100%)",borderTop:"1px solid var(--border-strong)"}}>
      {/* CTA gradient is intentionally hardcoded dark-forest — it stays dark in both light and dark page modes.
          Do NOT replace #1A271C with var(--dark): in dark mode that alias resolves to near-white (text-primary). */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"3.5rem 2rem",position:"relative",textAlign:"center"}}>
        <Tag center style={{color:"#86EFAC"}}>Start Growing Today</Tag>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:"clamp(2rem,4vw,3rem)",fontWeight:500,color:"#fff",margin:".5rem 0 1rem",lineHeight:1.15,letterSpacing:"-.3px"}}>
          Every night, Selora works.<br/>
          <em style={{color:"#86EFAC",fontStyle:"italic"}}>Every morning, your collection grows.</em>
        </h2>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:".9rem",marginBottom:"2.2rem",fontWeight:300,lineHeight:1.8}}>
          Join 12,000+ fashion sellers already growing with Selora.<br/>14-day free trial — no credit card needed.
        </p>
        <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
          <Link to={user ? "/dashboard" : "/signup"} style={{background:"#86EFAC",color:"#1A271C",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 20px rgba(134,239,172,.25)"}}>
            {user ? "Go to Dashboard →" : "Start Growing for Free →"}
          </Link>
          <Link to="/demo" style={{background:"transparent",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.18)",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:500,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
            Book a Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState('idle'); // idle | loading | success | error

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubState('loading');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSubState('success');
      } else {
        setSubState('error');
      }
    } catch {
      setSubState('error');
    }
  };

  const FOOTER_COLS = [
    {
      heading: "Product",
      links: [
        { label: "Features", path: "/features" },
        { label: "How It Works", path: "/how-it-works" },
        { label: "Pricing", path: "/pricing" },
        { label: "Book a Demo", path: "/demo" },
      ]
    },
    {
      heading: "Company",
      links: [
        { label: "About", path: "#" },
        { label: "Blog", path: "#" },
        { label: "Careers", path: "#" },
        { label: "Press", path: "#" },
      ]
    },
    {
      heading: "Resources",
      links: [
        { label: "Docs", path: "#" },
        { label: "Support", path: "/support" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Terms of Service", path: "/terms" },
      ]
    },
  ];

  return (
    <footer style={{borderTop:"1px solid var(--border-strong)",background:"var(--bg-1,#fff)"}}>
      <div className="mob-pad" style={{maxWidth:1400,margin:"0 auto",padding:"3.5rem 2rem 2rem"}}>
        {/* Top row: logo + cols + newsletter */}
        <div className="footer-grid" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1.8fr",gap:"2.5rem",marginBottom:"2.5rem"}}>
          {/* Brand */}
          <div>
            <Link to="/" style={{textDecoration:"none"}}>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.1rem",fontWeight:700,letterSpacing:"-.3px",color:"var(--dark)",marginBottom:".7rem"}}>
                Se<span style={{color:"var(--g)"}}>lo</span>ra
              </div>
            </Link>
            <p style={{fontSize:".78rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300,maxWidth:200}}>
              AI-powered growth for fashion sellers. Works while you sleep.
            </p>
          </div>
          {/* Nav columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <div style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".12em",color:"var(--text)",marginBottom:".9rem",fontFamily:"Inter,sans-serif"}}>{col.heading}</div>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:".55rem"}}>
                {col.links.map(lk => (
                  <li key={lk.label}>
                    <Link to={lk.path} style={{fontSize:".78rem",color:"var(--muted)",textDecoration:"none",fontWeight:300,transition:"color .2s"}}
                      onMouseEnter={e => e.target.style.color="var(--dark)"}
                      onMouseLeave={e => e.target.style.color="var(--muted)"}
                    >{lk.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* Newsletter */}
          <div>
            <div style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".12em",color:"var(--text)",marginBottom:".9rem",fontFamily:"Inter,sans-serif"}}>Stay Updated</div>
            <p style={{fontSize:".75rem",color:"var(--muted)",marginBottom:".9rem",lineHeight:1.6,fontWeight:300}}>Growth tips, feature releases, and fashion seller stories.</p>
            {subState === 'success' ? (
              <div style={{background:"var(--gpale,#EDF3EE)",border:"1px solid var(--border-strong)",borderRadius:8,padding:".75rem 1rem",fontSize:".78rem",color:"var(--g)",fontWeight:500}}>
                ✓ You're on the list — we'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={subState === 'loading'}
                  style={{padding:".7rem .9rem",borderRadius:8,border:"1px solid var(--border)",fontSize:".8rem",fontFamily:"Inter,sans-serif",background:"var(--bg,#F8FAF8)",color:"var(--dark)",outline:"none",width:"100%"}}
                />
                <button type="submit" disabled={subState === 'loading'}
                  style={{padding:".65rem",borderRadius:8,background:"var(--g)",color:"#fff",border:"none",fontSize:".8rem",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"opacity .2s",opacity:subState==='loading'?0.7:1}}>
                  {subState === 'loading' ? "Subscribing…" : "Subscribe"}
                </button>
                {subState === 'error' && <p style={{fontSize:".72rem",color:"#C97168",margin:0}}>Something went wrong — try again.</p>}
              </form>
            )}
          </div>
        </div>
        {/* Bottom divider + copyright */}
        <div style={{borderTop:"1px solid var(--border)",paddingTop:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"}}>
          <div style={{fontSize:".7rem",color:"var(--muted)"}}>© 2025 Selora. All rights reserved.</div>
          <div style={{display:"flex",gap:"1.5rem"}}>
            {[{l:"Privacy Policy",h:"/privacy"},{l:"Terms",h:"/terms"},{l:"Contact",h:"/support"}].map(item => (
              <Link key={item.l} to={item.h} style={{fontSize:".7rem",color:"var(--muted)",textDecoration:"none"}}>{item.l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Selora() {
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, toggleTheme] = useDarkMode();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="landing-page">
      <GlobalStyles/>
      <Navbar scrolled={scrolled} darkMode={darkMode} onToggleDark={toggleTheme}/>
      <Hero darkMode={darkMode}/>
      <ConnectSection/>
      <Features/>
      <HowItWorks/>
      <Pricing/>
      <Testimonial darkMode={darkMode}/>
      <CTA/>
      <Footer/>
    </div>
  );
}