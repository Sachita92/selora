import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'
import Navbar from '../components/Navbar'

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

const iconMapLarge = {
  tag: <TagIcon size={22} color="var(--g)" />,
  pencil: <PencilIcon size={22} color="var(--g)" />,
  megaphone: <MegaphoneIcon size={22} color="var(--g)" />,
  chart: <ChartIcon size={22} color="var(--g)" />,
  box: <BoxIcon size={22} color="var(--g)" />,
  shield: <ShieldIcon size={22} color="var(--g)" />,
}

// ─── Shared ──────────────────────────────────────────────────────────────────
const c = {
  g: 'var(--g)', g2: 'var(--g2)', gpale: 'var(--gpale)',
  bg: 'var(--bg)', bg2: 'var(--bg2)',
  border: 'var(--border)', dark: 'var(--dark)', text: 'var(--text)', muted: 'var(--muted)',
  card: 'var(--card-bg)',
}

const FEATURES = [
  {
    icon: 'tag', title: 'Fashion-Smart Pricing',
    desc: 'Selora understands seasonality and trends. It adjusts prices at exactly the right moment — peak season, end of season, or when a style is trending.',
    detail: 'Selora monitors competitor pricing, seasonal demand signals, and your own sell-through rate to recommend or auto-apply price changes. Whether it\'s a winter clearance or a trending summer piece, your pricing is always optimized for maximum revenue.',
    bullets: ['Automatic seasonal repricing', 'Competitor price monitoring', 'Margin-aware adjustments', 'Trend-based surge pricing'],
  },
  {
    icon: 'pencil', title: 'Listings That Convert',
    desc: 'Weak listings kill fashion sales. Selora rewrites titles and descriptions with styling tips, fit guidance, and occasion copy that makes buyers act.',
    detail: 'Selora analyzes your existing product descriptions and rewrites them using fashion-specific language that converts. It adds styling suggestions, fit guidance, and occasion-based copy — the kind of detail that turns browsers into buyers.',
    bullets: ['AI-powered copy rewriting', 'Styling tips & occasion copy', 'SEO-optimized titles', 'A/B tested descriptions'],
  },
  {
    icon: 'megaphone', title: 'Smarter Ad Spend',
    desc: 'Stop burning budget on ads that don\'t convert. Selora shifts your spend toward the pieces that are actually selling — automatically.',
    detail: 'Selora connects to your ad platforms and continuously monitors which products are converting and which are wasting budget. It reallocates spend in real time, pausing underperformers and boosting winners.',
    bullets: ['Real-time budget reallocation', 'Automatic pause on low ROAS ads', 'Product-level performance tracking', 'Cross-platform optimization'],
  },
  {
    icon: 'chart', title: 'Collection Analytics',
    desc: 'See which pieces are your stars and which are slow movers. Plain English insights — no confusing dashboards to decode.',
    detail: 'No more decoding complex analytics dashboards. Selora gives you a clear, plain-English summary of your collection performance every morning — what\'s selling, what\'s stalling, and what needs attention.',
    bullets: ['Plain-English daily reports', 'Star vs. slow-mover identification', 'Revenue attribution per product', 'Trend detection & forecasting'],
  },
  {
    icon: 'box', title: 'Never Sell Out',
    desc: 'Selora tracks sell velocity per piece and warns you before you run out — so you never lose a sale to an empty size grid.',
    detail: 'Running out of your bestseller during peak demand is the worst feeling. Selora tracks how fast each SKU is selling and sends you restock alerts well before you hit zero — so your customers always find what they want.',
    bullets: ['Per-SKU sell velocity tracking', 'Predictive restock alerts', 'Size-grid gap detection', 'Supplier lead time awareness'],
  },
  {
    icon: 'shield', title: 'You\'re Always in Control',
    desc: 'Every action Selora takes is logged and explained. Approve, adjust, or pause anything — it\'s your collection, always.',
    detail: 'Selora is transparent by design. Every optimization, price change, and ad adjustment is logged with a clear explanation. You can approve actions before they run, set guardrails, or pause the agent any time.',
    bullets: ['Full action audit log', 'Approval workflows', 'Custom guardrails & limits', 'One-click pause / resume'],
  },
]

// ─── Navbar (shared with landing page) ───────────────────────────────────────


export default function FeaturesPage() {
  const { user } = useAppContext()
  const scrollTo = (title) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Flash highlight the detail heading
      const heading = el.querySelector('.detail-heading');
      if (heading) {
        heading.classList.remove('heading-highlight');
        void heading.offsetWidth; // Trigger reflow to restart animation
        heading.classList.add('heading-highlight');
      }
    }
  }

  return (
    <div className="landing-page" style={{fontFamily:'Inter, sans-serif', background:c.bg, minHeight:'100vh'}}>
      <style>{`
        .interactive-feat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.8rem;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .interactive-feat-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: none;
        }
        .interactive-feat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--g), var(--g2));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .interactive-feat-card:hover::before {
          opacity: 1;
        }
        .interactive-feat-card:hover .cn-view-details-arrow {
          transform: translateX(4px);
        }
        .detail-heading {
          padding: 0.2rem 0.6rem;
          margin-left: -0.6rem;
          border-radius: 6px;
          display: inline-block;
        }
        @keyframes headingFlash {
          0% { background-color: transparent; }
          30% { background-color: var(--gpale); }
          100% { background-color: transparent; }
        }
        .heading-highlight {
          animation: headingFlash 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (max-width: 900px) {
          .feat-detail-grid { grid-template-columns:1fr !important; }
          .feat-page-nav-links { display:none !important; }
        }
      `}</style>
      <Navbar />


        {/* HERO & OVERVIEW CARDS SECTION */}
        <div style={{background:'var(--bg2)', paddingTop:'6.5rem', paddingBottom:'4rem'}}>
          <div className="site-page-container">
            {/* HERO TEXT */}
            <div style={{textAlign:'center', marginBottom:'1.8rem'}}>
              <div style={{maxWidth: '640px', width: '100%', margin: '0 auto'}}>
                <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.5rem,3.2vw,2.5rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,margin:'0 0 .8rem'}}>
                  Everything your fashion store needs to <em style={{fontStyle:'italic',color:c.g}}>grow automatically</em>
                </h1>
                <p style={{fontSize:'.88rem',color:c.muted,lineHeight:1.8,fontWeight:300,margin:0}}>
                  Six powerful AI tools — built exclusively for fashion sellers. No setup, no dashboards to decode.
                </p>
              </div>
            </div>

            {/* FEATURE CARDS OVERVIEW */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.2rem'}} className="feat-detail-grid">
              {FEATURES.map(f => (
                <div 
                  key={f.title} 
                  className="interactive-feat-card"
                  onClick={() => scrollTo(f.title)}
                >
                  <div style={{width:40,height:40,background:c.gpale,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.1rem'}}>{iconMap[f.icon]}</div>
                  <h3 style={{fontSize:'.92rem',fontWeight:600,marginBottom:'.45rem',color:c.dark}}>{f.title}</h3>
                  <p style={{fontSize:'.8rem',color:c.muted,lineHeight:1.7,fontWeight:300,marginBottom:'.8rem'}}>{f.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--g)', fontWeight: 500, marginTop: 'auto' }}>
                    View details <span style={{ transition: 'transform 0.2s ease-in-out', display: 'inline-block' }} className="cn-view-details-arrow">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILED FEATURE BREAKDOWNS */}
        {FEATURES.map((f, i) => {
          const id = f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return (
            <div 
              key={f.title} 
              id={id} 
              style={{
                borderTop:`1px solid ${c.border}`,
                background:i % 2 === 0 ? c.bg : c.bg2,
                scrollMarginTop: '80px'
              }}
            >
              <div className="site-page-container feat-detail-grid" style={{padding:'5rem 1.5rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center',direction:i % 2 === 0 ? 'ltr' : 'rtl'}}>
                
                {/* Text side */}
                <div style={{direction:'ltr'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'1.2rem'}}>
                    <div style={{width:44,height:44,background:c.gpale,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>{iconMapLarge[f.icon]}</div>
                    <h2 className="detail-heading" style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.3rem, 4vw, 1.6rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>{f.title}</h2>
                  </div>
                  <p style={{fontSize:'.88rem',color:c.muted,lineHeight:1.8,fontWeight:300,marginBottom:'1.5rem'}}>{f.detail}</p>
                  <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'.6rem'}}>
                    {f.bullets.map(b => (
                      <li key={b} style={{fontSize:'.82rem',color:c.text,display:'flex',alignItems:'center',gap:'.5rem',fontWeight:400}}>
                        <span style={{color:c.g,fontWeight:700,fontSize:'.9rem'}}>✓</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div style={{direction:'ltr',background:c.card,border:`1px solid ${c.border}`,borderRadius:16,padding:'2rem',boxShadow:'0 8px 30px rgba(90,138,103,.06)'}}>
                  <div style={{background:c.bg2,borderRadius:10,padding:'1.5rem',border:`1px solid ${c.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'1rem'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:c.g}} />
                      <span style={{fontSize:'.72rem',fontWeight:600,color:c.muted,textTransform:'uppercase',letterSpacing:'.08em'}}>{f.title} · Live</span>
                    </div>
                    <div style={{fontSize:'2rem',fontWeight:600,fontFamily:'Fraunces,serif',color:c.dark,marginBottom:'.3rem',letterSpacing:'-.3px'}}>
                      {i === 0 ? '+18%' : i === 1 ? '2.4x' : i === 2 ? '-34%' : i === 3 ? '12' : i === 4 ? '0' : '47'}
                    </div>
                    <div style={{fontSize:'.7rem',color:c.muted,textTransform:'uppercase',letterSpacing:'.06em'}}>
                      {i === 0 ? 'Revenue increase this month' : i === 1 ? 'Conversion rate improvement' : i === 2 ? 'Wasted ad spend reduced' : i === 3 ? 'Insights generated today' : i === 4 ? 'Stockouts this quarter' : 'Actions logged this week'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* CTA */}
        <div style={{textAlign:'center',padding:'2.5rem 4rem',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
          <div style={{position:'relative'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:'#86EFAC',marginBottom:'.7rem'}}>Ready to grow?</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.5rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
              Start using all six features <em style={{color:'#86EFAC',fontStyle:'italic'}}>for free</em>
            </h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7}}>
              14-day free trial — no credit card needed.
            </p>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link to={user ? "/dashboard" : "/signup"} style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
                {user ? "Go to Dashboard" : "Get Started Free"} →
              </Link>
              <Link to="/demo" style={{background:'transparent',color:'rgba(255,255,255,.6)',border:'1px solid rgba(255,255,255,.18)',padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:500,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
                Book a Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{borderTop:`1px solid ${c.border}`,padding:'2rem 4rem',display:'flex',justifyContent:'space-between',alignItems:'center',background:c.card,flexWrap:'wrap',gap:'1rem'}}>
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
