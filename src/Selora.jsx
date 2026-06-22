import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "./lib/AppContext";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    :root {
      --g: #5A8A67; --g2: #78A885; --gpale: #EDF3EE;
      --bg: #F8FAF8; --bg2: #F1F5F1;
      --border: #E4EBE5; --dark: #1A271C; --text: #2E3D30; --muted: #7B907D;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; font-size: 15px; }
    h1, h2, h3 { font-family: 'Fraunces', serif; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.7)} }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

    .au  { animation: fadeUp .65s ease both; }
    .au1 { animation: fadeUp .65s .08s ease both; }
    .au2 { animation: fadeUp .65s .18s ease both; }
    .au3 { animation: fadeUp .65s .28s ease both; }
    .au4 { animation: fadeUp .65s .42s ease both; }
    .pdot  { animation: pulse 2.2s infinite; }
    .float { animation: float 4.5s ease-in-out infinite; }

    .slide { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:4.5rem 2rem 3rem; opacity:0; transform:translateY(16px); transition:opacity 0.45s ease, transform 0.45s ease; pointer-events:none; z-index:2; }
    .slide.active { opacity:1; transform:translateY(0); pointer-events:all; }
    // .slide-dot { width:20px; height:2px; background:rgba(90,138,103,.25); border:none; cursor:pointer; transition:all .35s; padding:0; }
    // .slide-dot.active { background:var(--g); width:36px; }

    .feat-card { background:#fff; border:1px solid var(--border); border-radius:14px; padding:1.8rem; transition:all .22s; position:relative; overflow:hidden; }
    .feat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--g),var(--g2)); opacity:0; transition:opacity .3s; }
    .feat-card:hover { border-color:var(--g); transform:translateY(-3px); box-shadow:0 8px 28px rgba(90,138,103,.09); }
    .feat-card:hover::before { opacity:1; }

    .step-line { display:flex; gap:1.1rem; padding:1.5rem 0; border-bottom:1px solid var(--border); }
    .step-line:last-child { border-bottom:none; }

    .price-card { background:#fff; border:1px solid var(--border); border-radius:14px; padding:2rem; position:relative; transition:all .2s; }
    .price-card:hover { transform:translateY(-3px); box-shadow:0 10px 36px rgba(90,138,103,.1); }
    .price-card.feat { border-color:var(--g); background:linear-gradient(140deg,#fff,#F3F8F4); }
    .price-card.feat::before { content:'Most popular'; position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:var(--g); color:#fff; font-size:.6rem; font-weight:700; letter-spacing:.08em; padding:.28rem .9rem; border-radius:999px; text-transform:uppercase; font-family:'Inter',sans-serif; }

    .testi-card { background:#fff; border:1px solid var(--border); border-radius:13px; padding:1.6rem; transition:all .2s; }
    .testi-card:hover { border-color:var(--g); box-shadow:0 5px 20px rgba(90,138,103,.07); }

    @media (max-width: 900px) {
      .nav-links { display:none !important; }
      .two-col, .how-grid, .feat-inner, .price-inner, .testi-inner { grid-template-columns:1fr !important; }
      .slide { padding:6rem 1.2rem 3rem; }
      .mob-pad { padding-left:1.2rem !important; padding-right:1.2rem !important; }
      .mob-vpad { padding-top:3.5rem !important; padding-bottom:3.5rem !important; }
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
      size: 5+ Math.random() * 9,
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
  { title:"Connect Your Store",     desc:"Link Selora in one click. It reads your collection, orders, and ads — and starts working immediately." },
  { title:"Set Your Goals",         desc:"More revenue? Better margins? Less wasted ad spend? Selora builds a growth plan around your collection." },
  { title:"Wake Up to Growth",      desc:"Every morning you get a simple report — what grew, what was fixed, and what's next for your collection." },
];

const ACTIVITY = [
  { text:"Repriced Floral Wrap Dress — peak season", time:"2am" },
  { text:"Rewrote Linen Blazer listing — CTR up",    time:"3am" },
  { text:"Paused 2 low-performing ads · saved $18",  time:"4am" },
  { text:"Restock alert: Cargo Pants — 3 units left", time:"6am" },
];

const PLANS = [
  { name:"Free",       price:"0",    slug:"free",   desc:"Get started at no cost. Perfect for exploring what Selora can do.",              features:["1 Store","Up to 50 Products","3 Optimizations / mo","Basic Reports","Community Support"],                                    feat:false, cta:"Get Started Free" },
  { name:"Growth",     price:"9.99", slug:"growth", desc:"For fashion sellers ready to accelerate with AI-powered growth.",                features:["1 Store","Unlimited Products","30 Optimizations / mo","Full Growth Agent","Auto Pricing","Listing Rewriter","Email Support"], feat:true,  cta:"Start Free Trial" },
  { name:"Scale",      price:"29.99", slug:"scale",  desc:"For established brands scaling across multiple stores.",                         features:["3 Stores","Unlimited Products","Unlimited Optimizations","Priority Support","Ad Optimization","Early pay.sh Access"],          feat:false, cta:"Upgrade to Scale" },
];

const TESTIMONIALS = [
  { q:"I run a small fashion boutique and was manually updating prices every week. Selora handles it automatically and my revenue went up 40% in the first month.", name:"Priya M.",  role:"Boutique owner" },
  { q:"The listing rewriter is incredible. It turned my boring product descriptions into actual fashion copy that sells. My conversion rate doubled.",               name:"Sarah R.", role:"Fashion brand founder" },
  { q:"Selora warned me I was about to sell out of my bestselling dress before I even noticed. Restocked in time and didn't lose a single sale.",                   name:"Aisha K.", role:"Womenswear seller" },
];

// ─── Shared primitives ────────────────────────────────────────────────────────
const Tag   = ({children,center,style}) => <p style={{fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".14em",color:"var(--g)",marginBottom:".7rem",fontFamily:"Inter,sans-serif",textAlign:center?"center":undefined,...style}}>{children}</p>;
const Title = ({children,center,style}) => <h2 style={{fontFamily:"Fraunces,serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",fontWeight:500,lineHeight:1.15,letterSpacing:"-.3px",marginBottom:".7rem",color:"var(--dark)",textAlign:center?"center":undefined,...style}}>{children}</h2>;
const Sub   = ({children,center,style}) => <p style={{fontSize:".9rem",color:"var(--muted)",lineHeight:1.8,fontWeight:300,textAlign:center?"center":undefined,...style}}>{children}</p>;
const BtnP  = ({children,style,onClick}) => <button onClick={onClick} style={{background:"var(--g)",color:"#fff",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 18px rgba(90,138,103,.28)",transition:"all .2s",...style}}>{children}</button>;
const BtnS  = ({children,style,onClick}) => <button onClick={onClick} style={{background:"#fff",color:"var(--dark)",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:500,border:"1px solid var(--border)",cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .2s",...style}}>{children}</button>;

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({scrolled}) {
  const { user } = useAppContext();
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 3.5rem",background:scrolled?"rgba(248,250,248,.97)":"rgba(248,250,248,.88)",backdropFilter:"blur(14px)",borderBottom:"1px solid var(--border)",transition:"background .3s"}}>
      <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.2rem",fontWeight:700,letterSpacing:"-.3px",color:"var(--dark)"}}>
        Se<span style={{color:"var(--g)"}}>lo</span>ra
      </div>
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
        {user ? (
          <Link to="/dashboard" style={{background:"var(--g)",color:"#fff",padding:".5rem 1.3rem",borderRadius:7,fontSize:".82rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" style={{fontSize:".82rem",fontWeight:500,color:"var(--muted)",textDecoration:"none"}}>Sign In</Link>
            <Link to="/signup" style={{background:"var(--g)",color:"#fff",padding:".5rem 1.3rem",borderRadius:7,fontSize:".82rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const total = SLIDES.length;

  const EXIT_MS = 450;

  const advance = (next) => {
    setExiting(true);
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setCurrent(next);
      setExiting(false);
    }, EXIT_MS);
  };

  const goTo = (n) => advance(((n % total) + total) % total);

  const startAuto = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => advance(c => (c + 1) % total), 6500);
  };

  useEffect(() => {
    startAuto();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  return (
    <div style={{position:"relative",minHeight:620,overflow:"hidden",background:"linear-gradient(170deg,#EEF4EF 0%,var(--bg) 55%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {/* Snowflake canvas */}
      <SnowCanvas />

      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div key={i} className={`slide${current === i && !exiting ? " active" : ""}`}>
          {/* Badge */}
          <div className="au" style={{display:"inline-flex",alignItems:"center",gap:".45rem",background:"#fff",border:"1px solid var(--border)",color:"var(--g)",padding:".35rem 1rem",borderRadius:999,fontSize:".72rem",fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",marginBottom:"1.8rem",boxShadow:"0 2px 10px rgba(90,138,103,.08)",fontFamily:"Inter,sans-serif"}}>
            <span className="pdot" style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"var(--g)"}}/>
            {slide.eyebrow}
          </div>

          {/* Headline */}
          <h1 className="au1" style={{fontFamily:"Cormorant Garamond,serif",fontSize:"clamp(2rem,8vw,4rem)",fontWeight:500,lineHeight:1.08,letterSpacing:"-.5px",maxWidth:750,marginBottom:"1.3rem",color:"var(--dark)"}}>
            {slide.h1.map((line, li) => (
              <span key={li}>
                {li === slide.italic
                  ? <em style={{fontStyle:"italic",color:"var(--g)"}}>{line}</em>
                  : line}
                {li < slide.h1.length - 1 && <br/>}
              </span>
            ))}
          </h1>

          {/* Sub */}
          <p className="au2" style={{fontSize:"1.55rem",color:"var(--muted)",maxWidth:480,lineHeight:1.8,marginBottom:"2.2rem",fontWeight:100}}>
            {slide.p}
          </p>

          {/* Buttons */}
          <div className="au3" style={{display:"flex",gap:".9rem",flexWrap:"wrap",justifyContent:"center"}}>
            <Link 
              to={slide.cta === "See It in Action" ? "/demo" : "/signup"} 
              style={{ textDecoration: "none" }}
            >
              <BtnP>{slide.cta}</BtnP>
            </Link>
            <Link 
              to={
                slide.cta2 === "See How It Works" 
                  ? "/how-it-works" 
                  : slide.cta2 === "Learn More" 
                    ? "/features" 
                    : "/demo"
              } 
              style={{ textDecoration: "none" }}
            >
              <BtnS>{slide.cta2}</BtnS>
            </Link>
          </div>
        </div>
      ))}

      {/* Slide dots only — no arrows, no progress bar */}
      <div style={{position:"absolute",bottom:"2.5rem",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:"1rem",zIndex:10}}>
        {SLIDES.map((_,i) => (
          <button key={i} className={`slide-dot${current===i?" active":""}`} onClick={()=>{goTo(i);startAuto();}}/>
        ))}
      </div>
    </div>
  );
}

// ─── Trust ────────────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className="au4" style={{background:"#fff",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"0.6rem 4rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"1.5rem",flexWrap:"wrap"}}>
      {[["👗","Built for fashion"],["⚡","Ready in 5 minutes"],["🔒","Bank-level security"],["💬","Human support"],["🔄","Cancel anytime"]].map(([icon,text])=>(
        <div key={text} style={{display:"flex",alignItems:"center",gap:".4rem",fontSize:".78rem",color:"var(--muted)",fontWeight:400}}>
          <span style={{fontSize:"14px"}}>{icon}</span>{text}
        </div>
      ))}
    </div>
  );
}

// ─── Listing Showcase ─────────────────────────────────────────────────────────
const SHOWCASE_EXAMPLES = [
  {
    before: "Floral wrap dress. 100% rayon. S, M, L. Machine washable.",
    after: "Effortless floral wrap dress — flowy, flattering, brunch-to-backyard."
  },
  {
    before: "Linen blazer. White color. Slim fit. Dry clean only.",
    after: "Classic white linen blazer — breathable, crisp, sunset-dinner ready."
  },
  {
    before: "Leather boots. Black. Size 6-10. rubber sole. round toe.",
    after: "Handcrafted black leather boots — weather-resistant, all-day cushioned walk."
  }
];

function ListingShowcase() {
  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % SHOWCASE_EXAMPLES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const example = SHOWCASE_EXAMPLES[currentExample];

  return (
    <div className="mob-pad mob-vpad" style={{ padding: "4rem 2rem 2rem", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--gpale)",
        border: "1px solid var(--border)",
        color: "var(--g)",
        padding: ".35rem 1rem",
        borderRadius: 999,
        fontSize: ".75rem",
        fontWeight: 600,
        letterSpacing: ".05em",
        marginBottom: "1rem",
        fontFamily: "Inter, sans-serif"
      }}>
        Demo data
      </div>

      {/* Labels "before" and "after" */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 936,
        marginBottom: ".25rem",
        padding: "0 .25rem",
        fontFamily: "Inter, sans-serif"
      }}>
        <span style={{
          fontSize: ".75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "var(--muted)"
        }}>
          before
        </span>
        <span style={{
          fontSize: ".75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "var(--g)"
        }}>
          after (AI Optimized)
        </span>
      </div>

      {/* Sweep Strip Container */}
      <div key={currentExample} style={{
        position: "relative",
        width: "100%",
        maxWidth: 936,
        height: 80,
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--bg)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        marginBottom: "0.8rem"
      }}>
        {/* Base Layer: Before Text */}
        <div style={{
          padding: "0 2rem",
          fontSize: ".9rem",
          color: "var(--muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          width: "100%",
          fontFamily: "Inter, sans-serif"
        }}>
          {example.before}
        </div>

        {/* Mask Layer: After Text */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "0%",
          overflow: "hidden",
          background: "var(--g-tint)",
          animation: "sweepW 6s ease-in-out infinite"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 936,
            padding: "0 2rem",
            fontSize: ".9rem",
            fontWeight: 500,
            color: "var(--g)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            fontFamily: "Inter, sans-serif"
          }}>
            {example.after}
          </div>
        </div>

        {/* Divider Line */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "0%",
          width: 2,
          background: "var(--g)",
          animation: "sweepL 6s ease-in-out infinite",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* Circular Handle */}
          <div style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--g-tint)",
            border: "1px solid var(--g)",
            boxShadow: "0 2px 8px rgba(90, 138, 103, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            color: "var(--g)",
            cursor: "ew-resize",
            userSelect: "none"
          }}>
            <span style={{ fontSize: "8px", fontWeight: "bold", display: "flex", gap: "2px" }}>
              <span>◀</span>
              <span>▶</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats chips in their own row with top border */}
      <div style={{
        width: "100%",
        maxWidth: 936,
        borderTop: "1px solid var(--border)",
        paddingTop: "0.8rem",
        display: "flex",
        justifyContent: "space-around",
        gap: "2rem",
        flexWrap: "wrap"
      }}>
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 500,
            color: "var(--dark)",
            fontFamily: "'Cormorant Garamond', serif",
            lineHeight: 1
          }}>
            3.8x
          </div>
          <div style={{
            fontSize: ".75rem",
            color: "var(--muted)",
            marginTop: ".35rem",
            fontFamily: "Inter, sans-serif"
          }}>
            avg growth rate
          </div>
        </div>

        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 500,
            color: "var(--dark)",
            fontFamily: "'Cormorant Garamond', serif",
            lineHeight: 1
          }}>
            99%
          </div>
          <div style={{
            fontSize: ".75rem",
            color: "var(--muted)",
            marginTop: ".35rem",
            fontFamily: "Inter, sans-serif"
          }}>
            uptime
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="mob-pad mob-vpad" style={{padding:"1.8rem 4rem 5.5rem",maxWidth:1160,margin:"0 auto"}}>
      <div style={{textAlign:"center",maxWidth:540,margin:"0 auto 2rem"}}>
        <Tag center>What Selora Does</Tag>
        <Title center>Six ways your collection<br/>grows every day</Title>
        <Sub center>Each runs automatically — built specifically for the fashion industry.</Sub>
      </div>
      <div className="feat-inner" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.2rem"}}>
        {FEATURES.map(f=>(
          <div key={f.title} className="feat-card">
            <div style={{width:40,height:40,background:"var(--gpale)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",marginBottom:"1.1rem"}}>{f.icon}</div>
            <h3 style={{fontSize:".92rem",fontWeight:600,marginBottom:".45rem",color:"var(--dark)",fontFamily:"Inter,sans-serif"}}>{f.title}</h3>
            <p style={{fontSize:".8rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
// Helper functions for date-seeded PRNG fallback
function getUTCDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setUTCDate(d.getUTCDate() + offsetDays);
  }
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function cyrb128(str) {
  let h1 = 1779033703, h2 = 302473470, h3 = 3362450863, h4 = 50249225;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function getFallbackDashboardData() {
  const todayStr = getUTCDateString(0);
  const yesterdayStr = getUTCDateString(-1);

  const seedToday = cyrb128(todayStr)[0];
  const seedYesterday = cyrb128(yesterdayStr)[0];

  const rngToday = mulberry32(seedToday);
  const revToday = Math.round(3000 + rngToday() * 3000);
  const ordersToday = Math.round(150 + rngToday() * 150);
  const convToday = Math.round((2.5 + rngToday() * 1.5) * 100) / 100;

  const rngYesterday = mulberry32(seedYesterday);
  const revYesterday = Math.round(3000 + rngYesterday() * 3000);
  const ordersYesterday = Math.round(150 + rngYesterday() * 150);
  const convYesterday = Math.round((2.5 + rngYesterday() * 1.5) * 100) / 100;

  const revenueDelta = ((revToday - revYesterday) / revYesterday) * 100;
  const ordersDelta = ((ordersToday - ordersYesterday) / ordersYesterday) * 100;
  const conversionDelta = convToday - convYesterday;

  return {
    revenue: revToday,
    revenueDeltaPct: Math.round(revenueDelta * 10) / 10,
    orders: ordersToday,
    ordersDeltaPct: Math.round(ordersDelta * 10) / 10,
    conversionPct: convToday,
    conversionDeltaPts: Math.round(conversionDelta * 100) / 100,
    activity: [
      { action: "Optimized listing", product: "Floral wrap dress", time: "2:00 AM" },
      { action: "Adjusted price", product: "Leather boots", time: "3:15 AM" },
      { action: "Restocked alert", product: "Linen blazer", time: "5:30 AM" },
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
  <div className="skeleton-pulse" style={{display:"flex",alignItems:"center",gap:".6rem",padding:".55rem .7rem",background:"var(--bg2)",borderRadius:7,border:"1px solid var(--border)",marginBottom:isLast ? 0 : ".45rem"}}>
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
      .then(r => {
        if (!r.ok) throw new Error("API responded with an error");
        return r.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching demo dashboard data, loading fallback:", e);
        setData(getFallbackDashboardData());
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="float" style={{background:"#fff",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 18px 55px rgba(90,138,103,.11)"}}>
        <div style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:".8rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:".6rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
            {["#f87171","#fbbf24","#4ade80"].map(c=><div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
            <span style={{marginLeft:".7rem",fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Fashion Dashboard</span>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            background: "var(--gpale)",
            border: "1px solid var(--border)",
            color: "var(--g)",
            padding: ".35rem 1rem",
            borderRadius: 999,
            fontSize: ".75rem",
            fontWeight: 600,
            letterSpacing: ".05em",
            fontFamily: "Inter, sans-serif"
          }}>
            Demo data
          </div>
        </div>
        <div style={{padding:"1.3rem"}}>
          <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>This Morning's Growth</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".7rem",marginBottom:"1.1rem"}}>
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </div>
          <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>What Selora Did Overnight</p>
          <SkeletonActivityRow />
          <SkeletonActivityRow />
          <SkeletonActivityRow />
          <SkeletonActivityRow isLast={true} />
        </div>
      </div>
    );
  }

  // Ensure activity is defined
  const activityList = data?.activity || FALLBACK_DASHBOARD_DATA.activity;

  // Formatting strings dynamically
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

  return (
    <div className="float" style={{background:"#fff",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 18px 55px rgba(90,138,103,.11)"}}>
      <div style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:".8rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:".6rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
          {["#f87171","#fbbf24","#4ade80"].map(c=><div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
          <span style={{marginLeft:".7rem",fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Fashion Dashboard</span>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          background: "var(--gpale)",
          border: "1px solid var(--border)",
          color: "var(--g)",
          padding: ".35rem 1rem",
          borderRadius: 999,
          fontSize: ".75rem",
          fontWeight: 600,
          letterSpacing: ".05em",
          fontFamily: "Inter, sans-serif"
        }}>
          Demo data
        </div>
      </div>
      <div style={{padding:"1.3rem"}}>
        <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>This Morning's Growth</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".7rem",marginBottom:"1.1rem"}}>
          {metrics.map(({v,l,c})=>(
            <div key={l} style={{background:"var(--bg2)",borderRadius:9,padding:".85rem",border:"1px solid var(--border)"}}>
              <div style={{fontSize:"1.25rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",letterSpacing:"-.3px"}}>{v}</div>
              <div style={{fontSize:".62rem",color:"var(--muted)",marginTop:".15rem",textTransform:"uppercase",letterSpacing:".05em"}}>{l}</div>
              <div style={{fontSize:".65rem",color:"var(--g)",fontWeight:600,marginTop:".25rem"}}>{c}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:".68rem",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".8rem"}}>What Selora Did Overnight</p>
        {activityList.slice(0, 4).map((a,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:".6rem",padding:".55rem .7rem",background:"var(--bg2)",borderRadius:7,fontSize:".72rem",border:"1px solid var(--border)",marginBottom:i<3?".45rem":0}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"var(--g)",flexShrink:0}}/>
            <span style={{flex:1,color:"var(--text)"}}>
              {a.action}{a.product ? ` · ${a.product}` : ""}
            </span>
            <span style={{color:"var(--muted)",fontSize:".65rem"}}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <div style={{background:"var(--bg2)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"5.5rem 0"}}>
      <div className="how-grid mob-pad" style={{maxWidth:1160,margin:"0 auto",padding:"0 4rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5rem",alignItems:"center"}}>
        <div>
          <Tag>How It Works</Tag>
          <Title>Three steps to a<br/>self-growing collection</Title>
          <Sub style={{marginBottom:"2.5rem"}}>No technical setup. Built for fashion sellers, not developers.</Sub>
          <div>
            {STEPS.map((step,i)=>(
              <div key={i} className="step-line">
                <div style={{width:30,height:30,minWidth:30,background:"var(--g)",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".72rem",fontWeight:700}}>{i+1}</div>
                <div>
                  <h4 style={{fontSize:".88rem",fontWeight:600,marginBottom:".3rem",color:"var(--dark)",fontFamily:"Inter,sans-serif"}}>{step.title}</h4>
                  <p style={{fontSize:".79rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{step.desc}</p>
                </div>
              </div>
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
    <section className="mob-pad mob-vpad" style={{padding:"5.5rem 4rem",maxWidth:1160,margin:"0 auto",borderTop:"1px solid var(--border)"}}>
      <div style={{textAlign:"center",maxWidth:500,margin:"0 auto"}}>
        <Tag center>Pricing</Tag>
        <Title center>Grow your collection,<br/>pay as you scale</Title>
        <Sub center>Start free. No contracts, no hidden fees, no surprises.</Sub>
      </div>
      <div className="price-inner" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.3rem",marginTop:"3rem"}}>
        {PLANS.map(plan => {
          const getLinkTarget = () => {
            if (user) {
              return plan.slug === 'free' ? '/dashboard' : `/pricing?plan=${plan.slug}`;
            } else {
              return plan.slug === 'free' ? '/signup' : `/signup?plan=${plan.slug}`;
            }
          };

          return (
            <div key={plan.name} className={`price-card${plan.feat?" feat":""}`}>
              <div style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:plan.feat?"rgba(26,39,28,.5)":"var(--muted)",marginBottom:".8rem",fontFamily:"Inter,sans-serif"}}>{plan.name}</div>
              {plan.price === "0" ? (
                <div style={{fontSize:"2.5rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",lineHeight:1,letterSpacing:"-.5px"}}>
                  Free
                </div>
              ) : (
                <div style={{fontSize:"2.5rem",fontWeight:600,color:"var(--dark)",fontFamily:"Fraunces,serif",lineHeight:1,letterSpacing:"-.5px"}}>
                  <sup style={{fontSize:"1rem",verticalAlign:"super",color:"var(--g)"}}>$</sup>{plan.price}
                  <span style={{fontSize:".8rem",color:"var(--muted)",fontWeight:400,fontFamily:"Inter,sans-serif"}}>/mo</span>
                </div>
              )}
              <p style={{fontSize:".78rem",color:"var(--muted)",margin:".65rem 0 1.2rem",fontWeight:300,lineHeight:1.6}}>{plan.desc}</p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:".55rem",marginBottom:"1.6rem"}}>
                {plan.features.map(f=>(
                  <li key={f} style={{fontSize:".78rem",color:"var(--text)",display:"flex",alignItems:"center",gap:".5rem",fontWeight:300}}>
                    <span style={{color:"var(--g)",fontWeight:700}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link to={getLinkTarget()} style={{display:"block",width:"100%",padding:".72rem",borderRadius:8,fontWeight:600,fontSize:".82rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textAlign:"center",textDecoration:"none",transition:"all .2s",...(plan.feat?{background:"var(--g)",color:"#fff",border:"1px solid var(--g)",boxShadow:"0 4px 18px rgba(90,138,103,.28)"}:{background:"transparent",color:"var(--dark)",border:"1px solid var(--border)"})}}>
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <div style={{background:"var(--bg2)",borderTop:"1px solid var(--border)",padding:"5.5rem 0"}}>
      <div className="mob-pad" style={{maxWidth:1160,margin:"0 auto",padding:"0 4rem"}}>
        <div style={{textAlign:"center",marginBottom:"3rem"}}>
          <Tag center>From Real Sellers</Tag>
          <Title center>Collections that bloom with Selora</Title>
        </div>
        <div className="testi-inner" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.2rem"}}>
          {TESTIMONIALS.map(t=>(
            <div key={t.name} className="testi-card">
              <div style={{color:"var(--g)",fontSize:".82rem",marginBottom:".7rem",letterSpacing:2}}>★★★★★</div>
              <p style={{fontSize:".81rem",color:"var(--muted)",lineHeight:1.8,fontWeight:300,marginBottom:"1.2rem",fontStyle:"italic",fontFamily:"Fraunces,serif"}}>"{t.q}"</p>
              <div style={{fontSize:".78rem",fontWeight:600,color:"var(--dark)",fontFamily:"Inter,sans-serif"}}>{t.name}</div>
              <div style={{fontSize:".68rem",color:"var(--muted)"}}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <div style={{textAlign:"center",padding:"6rem 4rem",position:"relative",overflow:"hidden",background:"linear-gradient(140deg,var(--dark) 0%,#233329 100%)"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <Tag center style={{color:"#86EFAC"}}>Start Growing Today</Tag>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:"clamp(2rem,4vw,3rem)",fontWeight:500,color:"#fff",margin:".5rem 0 1rem",lineHeight:1.15,letterSpacing:"-.3px"}}>
          Every night, Selora works.<br/>
          <em style={{color:"#86EFAC",fontStyle:"italic"}}>Every morning, your collection grows.</em>
        </h2>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:".9rem",marginBottom:"2.2rem",fontWeight:300,lineHeight:1.8}}>
          Join 12,000+ fashion sellers already growing with Selora.<br/>14-day free trial — no credit card needed.
        </p>
        <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
          <Link to="/signup" style={{background:"#86EFAC",color:"var(--dark)",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 20px rgba(134,239,172,.25)"}}>
          Start Growing for Free →
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
  return (
    <footer style={{borderTop:"1px solid var(--border)",padding:"2rem 4rem",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",flexWrap:"wrap",gap:"1rem"}}>
      <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--dark)"}}>
        Se<span style={{color:"var(--g)"}}>lo</span>ra
      </div>
      <div>
        {[{l:"Privacy Policy",h:"/privacy"},{l:"Terms of Service",h:"/terms"},{l:"Support",h:"/support"},{l:"Docs",h:"#"},{l:"Contact",h:"/support"}].map(item=>(
          <Link key={item.l} to={item.h} style={{fontSize:".74rem",color:"var(--muted)",textDecoration:"none",marginLeft:"1.8rem"}}>{item.l}</Link>
        ))}
      </div>
      <div style={{fontSize:".7rem",color:"#c0c8c1"}}>© 2025 Selora. All rights reserved.</div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Selora() {
  const [scrolled, setScrolled] = useState(false);
  const [publicStats, setPublicStats] = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    
    // Fetch stats
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/public/stats')
      .then(r => r.json())
      .then(d => setPublicStats(d))
      .catch(e => console.error("Error loading public stats:", e));

    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <GlobalStyles/>
      <Navbar scrolled={scrolled}/>
      <Hero/>
      <TrustBar/>
      <ListingShowcase />
      <Features/>
      <HowItWorks />
      <Pricing/>
      <Testimonials/>
      <CTA/>
      <Footer/>
    </>
  );
}