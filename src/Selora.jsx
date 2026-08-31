import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "./lib/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroBackground from "./components/HeroBackground";
import HeroBackgroundShader from "./components/HeroBackgroundShader";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function TagIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
    </svg>
  )
}

function PencilIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  )
}

function MegaphoneIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M23 9c0 2.5-2 4.5-4.5 4.5" />
      <path d="M19 12c0 1.5-1 2.5-2.5 2.5" />
    </svg>
  )
}

function ChartIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function BoxIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function ShieldIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

const iconMap = {
  tag: <TagIcon size={18} color="var(--g)" />,
  pencil: <PencilIcon size={18} color="var(--g)" />,
  megaphone: <MegaphoneIcon size={18} color="var(--g)" />,
  chart: <ChartIcon size={18} color="var(--g)" />,
  box: <BoxIcon size={18} color="var(--g)" />,
  shield: <ShieldIcon size={18} color="var(--g)" />,
}

// ─── Global Styles ────────────────────────────────────────────────────────────
// Design tokens live in src/index.css (:root / .dark) — this block holds only
// landing-scoped resets, keyframes, and layout classes.
const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; font-size: 15px; }
    h1, h2, h3 { font-family: 'Fraunces', serif; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

    .au  { animation: fadeUp .65s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .au1 { animation: fadeUp .65s .08s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .au2 { animation: fadeUp .65s .18s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .au3 { animation: fadeUp .65s .28s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .au4 { animation: fadeUp .65s .42s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .float { animation: float 4.5s ease-in-out infinite; }

    .hero-viewport {
      position: relative; z-index: 2;
      min-height: calc(100vh - var(--nav-h, 68px));
      min-height: calc(100svh - var(--nav-h, 68px));
      display: flex; align-items: center;
      padding: 3rem 0 4.5rem;
    }
    .hero-stage { animation: fadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) both; }

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
      .two-col, .how-grid, .feat-inner, .price-inner, .testi-inner { grid-template-columns:1fr !important; }
      .hero-grid { grid-template-columns:1fr !important; gap:2.5rem !important; }
      .footer-grid { grid-template-columns:1fr 1fr !important; }
      .mob-pad { padding-left:1.2rem !important; padding-right:1.2rem !important; }
      .mob-vpad { padding-top:3.5rem !important; padding-bottom:3.5rem !important; }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns:1fr !important; }
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }
    .skeleton-pulse {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .au, .au1, .au2, .au3, .au4, .hero-stage, .float, .marquee-track { animation: none; }
    }
  `}</style>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:"tag", title:"Fashion-Smart Pricing",      desc:"Selora understands seasonality and trends. It adjusts prices at exactly the right moment — peak season, end of season, or when a style is trending." },
  { icon:"pencil", title:"Listings That Convert",       desc:"Weak listings kill fashion sales. Selora rewrites titles and descriptions with styling tips, fit guidance, and occasion copy that makes buyers act." },
  { icon:"megaphone", title:"Smarter Ad Spend",            desc:"Stop burning budget on ads that don't convert. Selora shifts your spend toward the pieces that are actually selling — automatically." },
  { icon:"chart", title:"Collection Analytics",        desc:"See which pieces are your stars and which are slow movers. Plain English insights — no confusing dashboards to decode." },
  { icon:"box", title:"Never Sell Out",              desc:"Selora tracks sell velocity per piece and warns you before you run out — so you never lose a sale to an empty size grid." },
  { icon:"shield", title:"You're Always in Control",   desc:"Every action Selora takes is logged and explained. Approve, adjust, or pause anything — it's your collection, always." },
];

const STEPS = [
  { title:"Set Up Your Store",     desc:"Connect your existing Shopify store in one click, or launch a new storefront on Selora — either way, it starts working immediately." },
  { title:"Set Your Goals",         desc:"More revenue? Better margins? Less wasted ad spend? Selora builds a growth plan around your collection." },
  { title:"Wake Up to Growth",      desc:"Every morning you get a simple report — what grew, what was fixed, and what's next for your collection." },
];

const SHOWCASE_EXAMPLES = [
  { before: "Dark floral wrap dress. 100% rayon. S, M, L. Machine washable.", after: "Moody floral wrap dress — fluid drape, effortless from dusk to dinner.",     bgImage: "/hero-dress-dark.webp", bgPos: "center 30%" },
  { before: "Cable knit sweater. Grey. Oversized fit. Hand wash.",              after: "Cloud-grey cable knit — heavyweight wool, made for slow mornings.",         bgImage: "/hero-knit-dark.webp",  bgPos: "center 40%" },
  { before: "Leather boots. Black. Size 6-10. rubber sole. round toe.",     after: "Handcrafted black leather boots — weather-resistant, all-day cushioned walk.", bgImage: "/hero-boots.webp",  bgPos: "center 45%" },
];

// The one product compact layouts show. Nothing drives the master clock there
// (the compact card is static), so the background is deliberately a single
// still — and the compact card shows the same listing, keeping the
// card↔background pairing. The dress: subject centred where the light pools,
// so it survives both the portrait crop and the scrim.
const MOBILE_PRODUCT_INDEX = 0;

const PLANS = [
  { name:"Free",   price:"0",     slug:"free",   desc:"Get started at no cost. Perfect for exploring what Selora can do.",                   features:["1 Store","Up to 50 Products","3 Optimizations / mo","Basic Reports","Community Support"],                                    feat:false, cta:"Get Started Free" },
  { name:"Growth", price:"4.99",  slug:"growth", desc:"For fashion sellers ready to accelerate with AI-powered growth.",                     features:["1 Store","Unlimited Products","30 Optimizations / mo","Full Growth Agent","Auto Pricing","Listing Rewriter","Email Support"], feat:true,  cta:"Upgrade to Growth" },
  { name:"Scale",  price:"19.99", slug:"scale",  desc:"For established brands scaling across multiple stores.",                              features:["3 Stores","Unlimited Products","Unlimited Optimizations","Priority Support","Ad Optimization","Early pay.sh Access"],          feat:false, cta:"Upgrade to Scale" },
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

// Reactive media-query hook — used for the compact-card breakpoint and the
// prefers-reduced-motion guard so no hidden component ever runs timers.
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// ─── Three-stage AI Card (Hero right column) ──────────────────────────────────
const CHECKLIST = ["Material & Fabric", "Style & Silhouette", "Fit & Sizing", "Occasion & Styling", "SEO Keywords"];

// Result-stage footer, stamped in one item at a time on the master clock.
const FOOTER_STAMPS = ["Optimized", "Published to store", "2 more queued"];

// All demo-card timing lives here. The card is the hero's MASTER CLOCK: every
// timed change on the hero — including the background layer — is driven by
// onAdvance from this one timeline. Durations are explicit and additive; no
// derived arithmetic to drift out of sync with the intervals it describes.
const CARD_TIMING = {
  beforeHold: 2400,   // dwell on "Original listing"
  analyzeMs: 2000,    // "AI is analyzing" progress sweep
  analyzeTick: 40,    // progress repaint interval
  resultDelay: 200,   // beat between 100% and the result stage
  streamChar: 18,     // ms per streamed character of the optimized copy
  resultHold: 4000,   // dwell after streaming (+800ms so the footer stamps
                      // land and still get a beat of rest before advancing)
  stampDelay: 350,    // beat after the stream before the first footer stamp
  stampStep: 260,     // spacing between successive footer stamps
};

// Remounts the cycle per product (and per motion preference) via key, so every
// cycle starts from clean initial state — no setState-in-effect resets.
function AIRewriteCard({ productIdx, onAdvance, reducedMotion }) {
  return (
    <AIRewriteCardCycle
      key={`${productIdx}-${reducedMotion}`}
      productIdx={productIdx}
      onAdvance={onAdvance}
      reducedMotion={reducedMotion}
    />
  );
}

function AIRewriteCardCycle({ productIdx, onAdvance, reducedMotion }) {
  const example = SHOWCASE_EXAMPLES[productIdx];
  // Reduced motion rests on the finished state from the first render on.
  const [stage, setStage] = useState(reducedMotion ? "result" : "before"); // before | analyzing | result
  const [progress, setProgress] = useState(reducedMotion ? 100 : 0);
  const [streamed, setStreamed] = useState(reducedMotion ? example.after.length : 0);
  const [stampCount, setStampCount] = useState(reducedMotion ? FOOTER_STAMPS.length : 0);

  // Checklist state derives from progress — one clock, no parallel thresholds.
  const checkedCount = Math.floor((progress / 100) * CHECKLIST.length);
  const streamDone = streamed >= example.after.length;

  useEffect(() => {
    // Reduced motion: no timers, no cycling.
    if (reducedMotion) return;

    const T = CARD_TIMING;
    const timers = [];
    const intervals = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const clearAllIntervals = () => { intervals.forEach(clearInterval); intervals.length = 0; };

    const streamStart = T.beforeHold + T.analyzeMs + T.resultDelay;
    const streamMs = example.after.length * T.streamChar;

    // Progress and streaming derive from wall-clock elapsed time, not tick
    // counts — dropped/coalesced timer ticks self-correct instead of leaving
    // the bar or the copy frozen short of complete.
    at(T.beforeHold, () => {
      setStage("analyzing");
      const start = Date.now();
      intervals.push(setInterval(() => {
        setProgress(() => Math.min(Math.round(((Date.now() - start) / T.analyzeMs) * 100), 100));
      }, T.analyzeTick));
    });
    at(streamStart, () => {
      clearAllIntervals();
      setStage("result");
      const start = Date.now();
      intervals.push(setInterval(() => {
        setStreamed(() => Math.min(Math.floor((Date.now() - start) / T.streamChar), example.after.length));
      }, T.streamChar));
    });
    at(streamStart + streamMs + 400, clearAllIntervals);
    // Footer stamps in after streaming — same clock, no derived state.
    FOOTER_STAMPS.forEach((_, i) => {
      at(streamStart + streamMs + T.stampDelay + i * T.stampStep, () => setStampCount(i + 1));
    });
    at(streamStart + streamMs + T.resultHold, () => {
      onAdvance((productIdx + 1) % SHOWCASE_EXAMPLES.length);
    });

    return () => { timers.forEach(clearTimeout); clearAllIntervals(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIdx, reducedMotion]);

  return (
    <div style={{background:"var(--bg-1,#fff)",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 18px 55px rgba(90,138,103,.11)",fontFamily:"Inter,sans-serif"}}>
      {/* Header bar */}
      <div style={{background:"var(--bg2,#F1F5F1)",borderBottom:"1px solid var(--border)",padding:".75rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
          {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
          <span style={{marginLeft:".7rem",fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Listing Intelligence</span>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",background:"var(--gpale,#EDF3EE)",border:"1px solid var(--border)",color:"var(--g)",padding:".28rem .8rem",borderRadius:999,fontSize:".68rem",fontWeight:600,letterSpacing:".04em",fontFamily:"Inter,sans-serif"}}>
          Watch it work
        </div>
      </div>

      {/* Stage content */}
      <div style={{padding:"1.3rem"}}>
        {/* Stage label */}
        <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:"1rem"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:stage==="before"?"var(--muted)":stage==="analyzing"?"#f59e0b":"var(--g)",transition:"background .3s"}}/>
          <span style={{fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:stage==="before"?"var(--muted)":stage==="analyzing"?"#f59e0b":"var(--g)",transition:"color .3s"}}>
            {stage==="before"?"Original listing":stage==="analyzing"?"AI is analyzing...":"AI-optimized result"}
          </span>
        </div>

        {/* Stage area held at the result stage's natural height (189px measured
            at the card's 500px width); the other stages are tuned to sit just
            inside it, so the result leaves no void and stages don't jump. */}
        <div style={{minHeight:189}}>
          {/* Before */}
          {stage === "before" && (
            <div className="hero-stage" style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border)",minHeight:72}}>
              <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300}}>{example.before}</p>
            </div>
          )}

          {/* Analyzing */}
          {stage === "analyzing" && (
            <div className="hero-stage">
              <div style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border)",marginBottom:".7rem"}}>
                <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300,opacity:.5}}>{example.before}</p>
              </div>
              {/* Progress bar */}
              <div style={{height:3,background:"var(--border)",borderRadius:999,marginBottom:".7rem",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,var(--g),var(--g2))",borderRadius:999,transition:"width .12s linear"}}/>
              </div>
              {/* Checklist */}
              <div style={{display:"flex",flexDirection:"column",gap:".25rem"}}>
                {CHECKLIST.map((item, i) => {
                  const done = i < checkedCount;
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

          {/* Result — original dimmed and struck up top, the optimized copy
              streaming in the centre, the footer stamping in on the master
              clock once the stream lands */}
          {stage === "result" && (
            <div className="hero-stage">
              <div style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border)",marginBottom:"1rem"}}>
                <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.7,fontWeight:300,opacity:.5,textDecoration:"line-through"}}>{example.before}</p>
              </div>
              <div style={{background:"var(--gpale,#EDF3EE)",borderRadius:10,padding:"1rem 1.1rem",border:"1px solid var(--border-strong,#C7DACB)",minHeight:72}}>
                <p style={{fontSize:".88rem",color:"var(--g)",lineHeight:1.7,fontWeight:500}}>
                  {example.after.slice(0, streamed)}
                  {!streamDone && <span aria-hidden="true" style={{opacity:.6}}>▍</span>}
                </p>
              </div>
              <div style={{marginTop:"1rem",display:"flex",alignItems:"center",flexWrap:"wrap",columnGap:".5rem",rowGap:".3rem",fontSize:".68rem",fontWeight:600,minHeight:18}}>
                {FOOTER_STAMPS.map((text, i) => (
                  <span key={text} style={{
                    display:"inline-flex",alignItems:"center",gap:".32rem",
                    color: i === 0 ? "var(--g)" : "var(--muted)",
                    opacity: stampCount > i ? (i === 0 ? 1 : .85) : 0,
                    transform: stampCount > i ? "none" : "scale(1.15)",
                    transition:"opacity .3s ease, transform .3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}>
                    {i === 0
                      ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span aria-hidden="true" style={{opacity:.55}}>·</span>}
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile hero card: one static before→after pair. No timers, no hidden clock —
// on compact layouts this replaces AIRewriteCard entirely.
function CompactRewriteCard() {
  const example = SHOWCASE_EXAMPLES[MOBILE_PRODUCT_INDEX];
  return (
    <div style={{background:"var(--bg-1,#fff)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",boxShadow:"0 14px 44px rgba(90,138,103,.11)",fontFamily:"Inter,sans-serif",width:"100%",maxWidth:440,margin:"0 auto"}}>
      <div style={{background:"var(--bg2,#F1F5F1)",borderBottom:"1px solid var(--border)",padding:".7rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:".72rem",color:"var(--muted)",fontWeight:600}}>Selora · Listing Intelligence</span>
        <span style={{display:"inline-flex",alignItems:"center",background:"var(--gpale,#EDF3EE)",border:"1px solid var(--border)",color:"var(--g)",padding:".24rem .7rem",borderRadius:999,fontSize:".66rem",fontWeight:600,letterSpacing:".04em"}}>
          Watch it work
        </span>
      </div>
      <div style={{padding:"1.1rem"}}>
        <p style={{fontSize:".64rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",marginBottom:".45rem"}}>Original listing</p>
        <div style={{background:"var(--bg2,#F1F5F1)",borderRadius:10,padding:".8rem .9rem",border:"1px solid var(--border)"}}>
          <p style={{fontSize:".82rem",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>{example.before}</p>
        </div>
        <div style={{display:"flex",justifyContent:"center",padding:".55rem 0",color:"var(--g)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </div>
        <p style={{fontSize:".64rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:"var(--g)",marginBottom:".45rem"}}>AI-optimized</p>
        <div style={{background:"var(--gpale,#EDF3EE)",borderRadius:10,padding:".8rem .9rem",border:"1px solid var(--border-strong,#C7DACB)"}}>
          <p style={{fontSize:".85rem",color:"var(--g)",lineHeight:1.6,fontWeight:500}}>{example.after}</p>
          <div style={{marginTop:".55rem",display:"flex",alignItems:"center",gap:".35rem",fontSize:".64rem",color:"var(--g)",fontWeight:600,opacity:.8}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Optimized — ready to publish
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// Three trust items only — each one verifiable in the product (fashion-only
// positioning, the FAQ's under-5-minute setup, one-click pause/cancel).
const TRUST_ITEMS = [
  { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M12 7a2 2 0 1 0-2-2m2 2l8 5c.6.4.7 1.2.3 1.8-.2.3-.5.5-.8.5H4c-.7 0-1.2-.5-1.2-1.2 0-.3.1-.7.4-.9l8.8-5.2z"/></svg>, text: "Built for fashion" },
  { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 13"/></svg>, text: "Ready in 5 minutes" },
  { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>, text: "Cancel anytime" },
];

// Hero background bake-off registry. Every variant takes the same props;
// unknown or absent ?bg= falls back to the photo layer.
const BG_VARIANTS = { photos: HeroBackground, shader: HeroBackgroundShader };

function Hero() {
  const { user, openAuthModal } = useAppContext();
  // Master-clock state: AIRewriteCard advances it; the background layer and
  // the card both read it. Nothing else on the hero owns a timer.
  const [productIdx, setProductIdx] = useState(0);
  const isCompact = useMediaQuery("(max-width: 900px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // Compact: frozen on one product — a single <img>, so the other two never
  // download. Desktop: the full set, cross-faded by the clock.
  const bgProducts = isCompact ? [SHOWCASE_EXAMPLES[MOBILE_PRODUCT_INDEX]] : SHOWCASE_EXAMPLES;
  const bgIndex = isCompact ? 0 : productIdx;
  // Bake-off knob: ?bg= picks the background variant per page load. Read
  // straight off the URL — dev-time comparison state, not routed state.
  const BgLayer = BG_VARIANTS[new URLSearchParams(window.location.search).get("bg")] || HeroBackground;

  return (
    <section style={{position:"relative",overflow:"hidden",paddingTop:"var(--nav-h, 68px)"}}>

      {/* Swappable background layer — pick with ?bg= (photos default | shader) */}
      <BgLayer products={bgProducts} activeIndex={bgIndex} reducedMotion={reducedMotion} />

      {/* Scrim — owned by the hero, not the background variant. Gently
          directional: densest over the text column, opening toward the card so
          the product reads as mood and texture on that side. Average density
          stays ≈ the old uniform 0.76 — direction is the change, not darkness. */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"linear-gradient(97deg, color-mix(in srgb, var(--bg2,#EEF4EF) 84%, transparent) 0%, color-mix(in srgb, var(--bg,#F8FAF8) 76%, transparent) 48%, color-mix(in srgb, var(--bg,#F8FAF8) 64%, transparent) 100%)",
      }}/>

      {/* Exit — fade the hero into ConnectSection's background, no hard band */}
      <div style={{
        position:"absolute", left:0, right:0, bottom:0, height:140, zIndex:1, pointerEvents:"none",
        background:"linear-gradient(to bottom, transparent, var(--bg-1, #fff))",
      }}/>

      {/* Nav sentinel — Navbar observes this. It spans the hero minus the nav
          height, so its bottom edge leaves the viewport exactly when the hero's
          bottom edge passes under the nav: that is the transparent→solid flip. */}
      <div data-nav-sentinel="" aria-hidden="true" style={{position:"absolute",top:0,left:0,width:1,bottom:"var(--nav-h, 68px)",pointerEvents:"none"}}/>

      {/* Fills the first viewport: --nav-h padding above + this min-height */}
      <div className="hero-viewport">
        <div className="hero-grid" style={{width:"100%",maxWidth:1400,margin:"0 auto",padding:"0 2rem",display:"grid",gridTemplateColumns:"1.15fr 1fr",gap:"6rem",alignItems:"center"}}>

          {/* Left: single static headline */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center"}}>
            {/* Eyebrow badge */}
            <div className="au" style={{display:"inline-flex",alignItems:"center",gap:".45rem",background:"var(--bg-1,#fff)",border:"1px solid var(--border)",color:"var(--g)",padding:".35rem 1rem",borderRadius:999,fontSize:".72rem",fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",marginBottom:"1.5rem",boxShadow:"0 2px 10px rgba(90,138,103,.08)",fontFamily:"Inter,sans-serif"}}>
              <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"var(--g)"}}/>
              AI Growth Agent for Fashion
            </div>
            {/* Headline */}
            {/* Cormorant 400 by design — the display H1 runs lighter than the
                Fraunces the rest of the page uses; both faces are loaded. */}
            <h1 className="au1" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.8rem,4.6vw,3.75rem)",fontWeight:400,lineHeight:1.08,letterSpacing:"-.5px",maxWidth:700,marginBottom:"1.1rem",color:"var(--dark)"}}>
              Your Fashion Store Grows<br/><em style={{fontStyle:"italic",color:"var(--g)"}}>While You Sleep</em>
            </h1>
            {/* Sub */}
            <p className="au2" style={{fontSize:"1rem",color:"var(--muted)",maxWidth:440,lineHeight:1.8,marginBottom:"1.8rem",fontWeight:300}}>
              Selora is built exclusively for fashion sellers. It handles pricing, listings, ads, and inventory — automatically, every night.
            </p>
            {/* CTAs */}
            <div className="au3" style={{display:"flex",gap:".9rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
              {user
                ? <Link to="/dashboard" style={{textDecoration:"none"}}><BtnP>Go to Dashboard →</BtnP></Link>
                : <BtnP onClick={() => openAuthModal('signup')}>Start Growing for Free →</BtnP>
              }
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

          {/* Right: full demo card on desktop; static compact card on mobile.
              Conditional render (not CSS hiding) so no unmounted-looking
              component keeps timers alive. */}
          {isCompact
            ? <div className="au4"><CompactRewriteCard /></div>
            : <div className="hero-visual" style={{width:"100%",maxWidth:500,margin:"0 auto"}}>
                <AIRewriteCard productIdx={productIdx} onAdvance={setProductIdx} reducedMotion={reducedMotion} />
              </div>
          }
        </div>
      </div>
    </section>
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
                <div style={{width:38,height:38,background:"var(--gpale,#EDF3EE)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"}}>{iconMap[f.icon]}</div>
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
  const { user, openAuthModal } = useAppContext();
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
              : null;
            const linkTarget = getLinkTarget();
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
                  {linkTarget
                    ? <Link to={linkTarget} style={{display:"block",width:"100%",padding:".72rem",borderRadius:8,fontWeight:600,fontSize:".82rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textAlign:"center",textDecoration:"none",transition:"all .2s",...(plan.feat?{background:"var(--g)",color:"#fff",border:"1px solid var(--g)"}:{background:"transparent",color:"var(--dark)",border:"1px solid var(--border)"}),boxSizing:'border-box'}}>
                        {plan.cta}
                      </Link>
                    : <button onClick={() => openAuthModal(plan.slug === 'free' ? 'signup' : 'signup', plan.slug === 'free' ? null : plan.slug)} style={{display:"block",width:"100%",padding:".72rem",borderRadius:8,fontWeight:600,fontSize:".82rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textAlign:"center",border:"none",transition:"all .2s",...(plan.feat?{background:"var(--g)",color:"#fff"}:{background:"transparent",color:"var(--dark)",border:"1px solid var(--border)"}),boxSizing:'border-box'}}>
                        {plan.cta}
                      </button>
                  }
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

function Testimonial() {
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
      background: "var(--testimonial-bg)",
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
          <div style={{color: "var(--testimonial-stars)", fontSize: ".85rem", marginBottom: ".9rem", letterSpacing: 3}}>★★★★★</div>
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
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, var(--testimonial-overlay) 0%, transparent 28%)",
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
  const { user, openAuthModal } = useAppContext();
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
      setUptime(() => {
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
    // No top border — the hero's exit gradient fades into this background
    <div style={{ background: "var(--bg-1,#fff)", borderBottom: "1px solid var(--border)" }}>
      <div className="mob-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "4rem 2rem" }}>
        
        {/* Centered Heading */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--g)", textTransform: "uppercase", letterSpacing: ".1em", display: "block", fontFamily: "Inter,sans-serif", marginBottom: "0.4rem" }}>
            SETUP & INTEGRATIONS
          </span>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "clamp(1.4rem, 4vw, 2.1rem)", fontWeight: 500, color: "var(--dark)", lineHeight: 1.2, letterSpacing: "-.3px" }}>
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
                return null;
              };
              const linkTarget = getLinkTarget();

              return (
                linkTarget
                  ? <Link key={idx} to={linkTarget} className="integ-card" style={{ border: borderStyle, background: bgStyle, minHeight: "115px", width: "240px", flexShrink: 0 }}>
                      {content}
                    </Link>
                  : <button key={idx} onClick={() => openAuthModal('signup')} className="integ-card" style={{ border: borderStyle, background: bgStyle, minHeight: "115px", width: "240px", flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      {content}
                    </button>
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
  const { user, openAuthModal } = useAppContext();
  return (
    <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(140deg,#1A271C 0%,#233329 100%)",borderTop:"1px solid var(--border-strong)"}}>
      {/* CTA gradient is intentionally hardcoded dark-forest — it stays dark in both light and dark page modes.
          Do NOT replace #1A271C with var(--dark): in dark mode that alias resolves to near-white (text-primary). */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)",pointerEvents:"none"}}/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"3.5rem 2rem",position:"relative",textAlign:"center"}}>
        <Tag center style={{color:"#86EFAC"}}>Start Growing Today</Tag>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:"clamp(1.6rem,4vw,3rem)",fontWeight:500,color:"#fff",margin:".5rem 0 1rem",lineHeight:1.15,letterSpacing:"-.3px"}}>
          Every night, Selora works.<br/>
          <em style={{color:"#86EFAC",fontStyle:"italic"}}>Every morning, your collection grows.</em>
        </h2>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:".9rem",marginBottom:"2.2rem",fontWeight:300,lineHeight:1.8}}>
          Join 12,000+ fashion sellers already growing with Selora.<br/>14-day free trial — no credit card needed.
        </p>
        <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
          {user
            ? <Link to="/dashboard" style={{background:"#86EFAC",color:"#1A271C",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,textDecoration:"none",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 20px rgba(134,239,172,.25)"}}>
                Go to Dashboard →
              </Link>
            : <button onClick={() => openAuthModal('signup')} style={{background:"#86EFAC",color:"#1A271C",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",boxShadow:"0 4px 20px rgba(134,239,172,.25)"}}>
                Start Growing for Free →
              </button>
          }
          <Link to="/demo" style={{background:"transparent",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.18)",padding:".8rem 2rem",borderRadius:8,fontSize:".92rem",fontWeight:500,textDecoration:"none",fontFamily:"Inter,sans-serif"}}>
            Book a Demo
          </Link>
        </div>
      </div>
    </div>
  );
}


// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Selora() {
  return (
    <div className="landing-page">
      <GlobalStyles/>
      <Navbar />
      <Hero/>
      <ConnectSection/>
      <Features/>
      <HowItWorks/>
      <Pricing/>
      <Testimonial/>
      <CTA/>
      <Footer/>
    </div>
  );
}