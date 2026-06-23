import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'

// ─── Shared ──────────────────────────────────────────────────────────────────
const c = {
  g: 'var(--g)', g2: 'var(--g2)', gpale: 'var(--gpale)',
  bg: 'var(--bg)', bg2: 'var(--bg2)',
  border: 'var(--border)', dark: 'var(--dark)', text: 'var(--text)', muted: 'var(--muted)',
  card: 'var(--card-bg)',
}

const FEATURES = [
  {
    icon: '💰', title: 'Fashion-Smart Pricing',
    desc: 'Selora understands seasonality and trends. It adjusts prices at exactly the right moment — peak season, end of season, or when a style is trending.',
    detail: 'Selora monitors competitor pricing, seasonal demand signals, and your own sell-through rate to recommend or auto-apply price changes. Whether it\'s a winter clearance or a trending summer piece, your pricing is always optimized for maximum revenue.',
    bullets: ['Automatic seasonal repricing', 'Competitor price monitoring', 'Margin-aware adjustments', 'Trend-based surge pricing'],
  },
  {
    icon: '✍️', title: 'Listings That Convert',
    desc: 'Weak listings kill fashion sales. Selora rewrites titles and descriptions with styling tips, fit guidance, and occasion copy that makes buyers act.',
    detail: 'Selora analyzes your existing product descriptions and rewrites them using fashion-specific language that converts. It adds styling suggestions, fit guidance, and occasion-based copy — the kind of detail that turns browsers into buyers.',
    bullets: ['AI-powered copy rewriting', 'Styling tips & occasion copy', 'SEO-optimized titles', 'A/B tested descriptions'],
  },
  {
    icon: '📣', title: 'Smarter Ad Spend',
    desc: 'Stop burning budget on ads that don\'t convert. Selora shifts your spend toward the pieces that are actually selling — automatically.',
    detail: 'Selora connects to your ad platforms and continuously monitors which products are converting and which are wasting budget. It reallocates spend in real time, pausing underperformers and boosting winners.',
    bullets: ['Real-time budget reallocation', 'Automatic pause on low ROAS ads', 'Product-level performance tracking', 'Cross-platform optimization'],
  },
  {
    icon: '📊', title: 'Collection Analytics',
    desc: 'See which pieces are your stars and which are slow movers. Plain English insights — no confusing dashboards to decode.',
    detail: 'No more decoding complex analytics dashboards. Selora gives you a clear, plain-English summary of your collection performance every morning — what\'s selling, what\'s stalling, and what needs attention.',
    bullets: ['Plain-English daily reports', 'Star vs. slow-mover identification', 'Revenue attribution per product', 'Trend detection & forecasting'],
  },
  {
    icon: '📦', title: 'Never Sell Out',
    desc: 'Selora tracks sell velocity per piece and warns you before you run out — so you never lose a sale to an empty size grid.',
    detail: 'Running out of your bestseller during peak demand is the worst feeling. Selora tracks how fast each SKU is selling and sends you restock alerts well before you hit zero — so your customers always find what they want.',
    bullets: ['Per-SKU sell velocity tracking', 'Predictive restock alerts', 'Size-grid gap detection', 'Supplier lead time awareness'],
  },
  {
    icon: '🛡️', title: 'You\'re Always in Control',
    desc: 'Every action Selora takes is logged and explained. Approve, adjust, or pause anything — it\'s your collection, always.',
    detail: 'Selora is transparent by design. Every optimization, price change, and ad adjustment is logged with a clear explanation. You can approve actions before they run, set guardrails, or pause the agent any time.',
    bullets: ['Full action audit log', 'Approval workflows', 'Custom guardrails & limits', 'One-click pause / resume'],
  },
]

// ─── Navbar (shared with landing page) ───────────────────────────────────────
function PageNav() {
  const { user } = useAppContext()
  const [darkMode, toggleTheme] = useDarkMode()
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 3.5rem',background:'var(--nav-bg)',backdropFilter:'blur(14px)',borderBottom:`1px solid var(--border)`,fontFamily:'Inter,sans-serif'}}>
      <Link to="/" style={{fontFamily:'Inter,sans-serif',fontSize:'1.2rem',fontWeight:700,letterSpacing:'-.3px',color:'var(--dark)',textDecoration:'none'}}>
        Se<span style={{color:'var(--g)'}}>lo</span>ra
      </Link>
      <div style={{display:'flex',gap:'2rem',alignItems:'center',fontSize:'.82rem'}}>
        <Link to="/features" style={{fontWeight:600,color:'var(--dark)',textDecoration:'none',borderBottom:`2px solid var(--g)`,paddingBottom:'.15rem'}}>Features</Link>
        <Link to="/how-it-works" className="cn-nav-link" style={{color:'var(--nav-link)',textDecoration:'none',fontWeight:500}}>How It Works</Link>
        <Link to="/pricing" className="cn-nav-link" style={{color:'var(--nav-link)',textDecoration:'none',fontWeight:500}}>Pricing</Link>
        <Link to="/demo" style={{color:'var(--g)',textDecoration:'none',fontWeight:500}}>Book a Demo</Link>
      </div>
      <div style={{display:'flex',gap:'.7rem',alignItems:'center'}}>
        {/* Dark-mode toggle */}
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

export default function FeaturesPage() {
  const scrollTo = (title) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        @media (max-width: 900px) {
          .feat-detail-grid { grid-template-columns:1fr !important; }
          .feat-page-nav-links { display:none !important; }
        }
      `}</style>
      <PageNav />


        {/* HERO & OVERVIEW CARDS SECTION */}
        <div style={{background:'linear-gradient(170deg,var(--bg-2) 0%,var(--bg) 70%)', paddingTop:'6rem', paddingBottom:'4rem'}}>
          <div style={{textAlign:'center'}}>
            <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3.2vw,2.5rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,marginBottom:'.8rem',maxWidth:650,margin:'0 auto .8rem'}}>
              Everything your fashion store needs to <em style={{fontStyle:'italic',color:c.g}}>grow automatically</em>
            </h1>
            <p style={{fontSize:'.85rem',color:c.muted,maxWidth:520,margin:'0 auto 1.8rem',lineHeight:1.8,fontWeight:300}}>
              Six powerful AI tools — built exclusively for fashion sellers. No setup, no dashboards to decode.
            </p>
          </div>

          {/* FEATURE CARDS OVERVIEW */}
          <div style={{maxWidth:1160,margin:'0 auto',padding:'0 4rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.2rem'}} className="feat-detail-grid">
              {FEATURES.map(f => (
                <div 
                  key={f.title} 
                  className="interactive-feat-card"
                  onClick={() => scrollTo(f.title)}
                >
                  <div style={{width:40,height:40,background:c.gpale,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',marginBottom:'1.1rem'}}>{f.icon}</div>
                  <h3 style={{fontSize:'.92rem',fontWeight:600,marginBottom:'.45rem',color:c.dark}}>{f.title}</h3>
                  <p style={{fontSize:'.8rem',color:c.muted,lineHeight:1.7,fontWeight:300}}>{f.desc}</p>
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
              <div className="feat-detail-grid" style={{maxWidth:1160,margin:'0 auto',padding:'5rem 4rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center',direction:i % 2 === 0 ? 'ltr' : 'rtl'}}>
                
                {/* Text side */}
                <div style={{direction:'ltr'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'1.2rem'}}>
                    <div style={{width:44,height:44,background:c.gpale,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{f.icon}</div>
                    <h2 style={{fontFamily:'Fraunces,serif',fontSize:'1.6rem',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>{f.title}</h2>
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
        <div style={{textAlign:'center',padding:'4rem 4rem',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
          <div style={{position:'relative'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:'#86EFAC',marginBottom:'.7rem'}}>Ready to grow?</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
              Start using all six features <em style={{color:'#86EFAC',fontStyle:'italic'}}>for free</em>
            </h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7}}>
              14-day free trial — no credit card needed.
            </p>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link to="/signup" style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
                Get Started Free →
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
