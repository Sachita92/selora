import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAppContext } from '../lib/AppContext'

const c = {
  g: '#5A8A67', g2: '#78A885', gpale: '#EDF3EE',
  bg: '#F8FAF8', bg2: '#F1F5F1',
  border: '#E4EBE5', dark: '#1A271C', text: '#2E3D30', muted: '#7B907D',
}

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Store',
    desc: 'Link Selora in one click. It reads your collection, orders, and ads — and starts working immediately.',
    detail: 'Simply enter your Shopify store URL and authorize Selora. We read your product catalog, order history, and ad account data to build a complete picture of your business. Setup takes under 5 minutes — no developer needed.',
    icon: '🔗',
  },
  {
    num: '02',
    title: 'Set Your Goals',
    desc: 'More revenue? Better margins? Less wasted ad spend? Selora builds a growth plan around your collection.',
    detail: 'Tell Selora what matters most — whether it\'s growing revenue, improving profit margins, clearing slow-moving inventory, or reducing wasted ad spend. Selora tailors its optimization strategy to your specific goals.',
    icon: '🎯',
  },
  {
    num: '03',
    title: 'Wake Up to Growth',
    desc: 'Every morning you get a simple report — what grew, what was fixed, and what\'s next for your collection.',
    detail: 'While you sleep, Selora works. It reprices products, rewrites listings, reallocates ad budget, and monitors inventory. Every morning you wake up to a clear, plain-English report of everything that happened.',
    icon: '☀️',
  },
]

const FAQ = [
  { q: 'How long does setup take?', a: 'Under 5 minutes. Just connect your Shopify store and set your goals — Selora handles the rest.' },
  { q: 'Do I need technical skills?', a: 'Not at all. Selora is built for fashion sellers, not developers. Everything is plain English, no code required.' },
  { q: 'Will Selora change things without my approval?', a: 'You\'re always in control. You can set Selora to auto-apply changes, or require approval before any action is taken.' },
  { q: 'What if I want to pause Selora?', a: 'One click. You can pause or resume the agent at any time from your dashboard.' },
  { q: 'How quickly will I see results?', a: 'Most sellers see their first improvements within 48 hours. Significant growth typically happens within the first 2 weeks.' },
]

function PageNav() {
  const { user } = useAppContext()
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 3.5rem',background:'rgba(248,250,248,.97)',backdropFilter:'blur(14px)',borderBottom:`1px solid ${c.border}`,fontFamily:'Inter,sans-serif'}}>
      <Link to="/" style={{fontFamily:'Inter,sans-serif',fontSize:'1.2rem',fontWeight:700,letterSpacing:'-.3px',color:c.dark,textDecoration:'none'}}>
        Se<span style={{color:c.g}}>lo</span>ra
      </Link>
      <div style={{display:'flex',gap:'2rem',alignItems:'center',fontSize:'.82rem'}}>
        <Link to="/features" style={{color:c.muted,textDecoration:'none',fontWeight:500}}>Features</Link>
        <Link to="/how-it-works" style={{fontWeight:600,color:c.dark,textDecoration:'none',borderBottom:`2px solid ${c.g}`,paddingBottom:'.15rem'}}>How It Works</Link>
        <Link to="/pricing" style={{color:c.muted,textDecoration:'none',fontWeight:500}}>Pricing</Link>
        <Link to="/demo" style={{color:c.g,textDecoration:'none',fontWeight:500}}>Book a Demo</Link>
      </div>
      <div style={{display:'flex',gap:'.7rem',alignItems:'center'}}>
        {user ? (
          <Link to="/dashboard" style={{background:c.g,color:'#fff',padding:'.5rem 1.3rem',borderRadius:7,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" style={{fontSize:'.82rem',fontWeight:500,color:c.muted,textDecoration:'none'}}>Sign In</Link>
            <Link to="/signup" style={{background:c.g,color:'#fff',padding:'.5rem 1.3rem',borderRadius:7,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── Shopify Connect Mock Demo ───────────────────────────────────────────────
function ShopifyConnectDemo({ c }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')

  const handleConnect = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('connecting')
    setTimeout(() => {
      setStatus('connected')
    }, 1500)
  }

  const handleReset = () => {
    setUrl('')
    setStatus('idle')
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.8rem', boxShadow: '0 8px 30px rgba(90,138,103,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem' }}>
        <span style={{ fontSize: '1.8rem' }}>🛍️</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Shopify Integration</div>
          <div style={{ fontSize: '.72rem', color: c.muted }}>Link your store in one click</div>
        </div>
      </div>

      {status === 'idle' && (
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          <input 
            type="text" 
            placeholder="your-store.myshopify.com" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              width: '100%', padding: '.7rem .9rem', borderRadius: 8, border: `1px solid ${c.border}`,
              fontSize: '.82rem', fontFamily: 'Inter,sans-serif', outline: 'none', background: '#FAFAF8',
              color: c.dark, boxSizing: 'border-box'
            }}
            required
          />
          <button 
            type="submit"
            style={{
              background: c.g, color: '#fff', border: 'none', borderRadius: 8, padding: '.7rem',
              fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              boxShadow: '0 4px 14px rgba(90,138,103,.2)', transition: 'all .2s'
            }}
          >
            Connect Store
          </button>
        </form>
      )}

      {status === 'connecting' && (
        <div style={{ textAlign: 'center', padding: '1.2rem 0' }}>
          <div style={{
            width: 24, height: 24, border: `2px solid ${c.gpale}`, borderTop: `2px solid ${c.g}`,
            borderRadius: '50%', margin: '0 auto .8rem', animation: 'spin .8s linear infinite'
          }} />
          <p style={{ fontSize: '.8rem', color: c.muted, fontWeight: 300 }}>Syncing product catalog...</p>
        </div>
      )}

      {status === 'connected' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ background: c.gpale, border: `1px solid #BBF7D0`, borderRadius: 8, padding: '.8rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ color: c.g, fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            <div style={{ fontSize: '.78rem', color: c.dark, fontWeight: 500, textAlign: 'left' }}>
              Connected to <span style={{ fontWeight: 600 }}>{url}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div style={{ background: c.bg2, borderRadius: 8, padding: '.6rem', textAlign: 'center', border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: c.dark }}>247</div>
              <div style={{ fontSize: '.6rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Products Synced</div>
            </div>
            <div style={{ background: c.bg2, borderRadius: 8, padding: '.6rem', textAlign: 'center', border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: c.dark }}>Ready</div>
              <div style={{ fontSize: '.6rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Agent Status</div>
            </div>
          </div>
          <button 
            onClick={handleReset}
            style={{
              background: 'transparent', color: c.muted, border: 'none', fontSize: '.72rem',
              cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Inter,sans-serif', alignSelf: 'center'
            }}
          >
            Disconnect store
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Goals Setup Mock Demo ───────────────────────────────────────────────────
const GOALS_LIST = [
  { id: 'rev', label: 'Maximize Total Revenue', icon: '📈', desc: 'Prioritizes sales volume and store traffic.' },
  { id: 'margin', label: 'Improve Profit Margins', icon: '💰', desc: 'Focuses on higher margins and price optimization.' },
  { id: 'inv', label: 'Clear Slow Inventory', icon: '📦', desc: 'Reduces prices of slow-moving items to clear space.' },
  { id: 'ad', label: 'Optimize Ad Budget', icon: '📣', desc: 'Reallocates ad dollars away from failing items.' }
]

function GoalsSetupDemo({ c }) {
  const [selected, setSelected] = useState(['rev', 'margin'])

  const toggleGoal = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.6rem', boxShadow: '0 8px 30px rgba(90,138,103,.04)' }}>
      <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark, marginBottom: '.3rem', textAlign: 'left' }}>Tailor Agent Objectives</div>
      <div style={{ fontSize: '.72rem', color: c.muted, marginBottom: '1rem', textAlign: 'left' }}>Toggle goals to customize Selora's nightly algorithms</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.2rem' }}>
        {GOALS_LIST.map(g => {
          const isActive = selected.includes(g.id)
          return (
            <div 
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.7rem 1rem',
                borderRadius: 10, border: `1px solid ${isActive ? c.g : c.border}`,
                background: isActive ? c.gpale : '#FAFAF8', cursor: 'pointer',
                transition: 'all .2s ease-in-out'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: c.dark }}>{g.label}</div>
                <div style={{ fontSize: '.62rem', color: c.muted, fontWeight: 300 }}>{g.desc}</div>
              </div>
              <div style={{
                width: 16, height: 16, borderRadius: 4, border: `1px solid ${isActive ? c.g : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? c.g : '#fff', color: '#fff', fontSize: '.6rem', fontWeight: 'bold'
              }}>
                {isActive && '✓'}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: c.bg2, borderRadius: 8, padding: '.6rem .8rem', border: `1px solid ${c.border}`, fontSize: '.72rem', color: c.text, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <span style={{ color: c.g }}>⚡</span>
        <span style={{ textAlign: 'left' }}>Selora will deploy <span style={{ fontWeight: 600, color: c.g }}>{selected.length} strategies</span> overnight.</span>
      </div>
    </div>
  )
}

// ─── Morning Report Mock Demo ─────────────────────────────────────────────────
const MOCK_ACTIONS = [
  { id: 1, action: 'Repriced Silk Wrap Dress to $89', reason: 'Summer seasonal demand surge', active: true },
  { id: 2, action: 'Updated Floral Maxi description', reason: 'Occasion terms: wedding guest', active: true },
  { id: 3, action: 'Shifted $20 ad budget to Linen Shorts', reason: 'High converting, low stockout risk', active: true }
]

function MorningReportDemo({ c }) {
  const [actions, setActions] = useState(MOCK_ACTIONS)

  const toggleAction = (id) => {
    setActions(prev => 
      prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
    )
  }

  const activeCount = actions.filter(a => a.active).length

  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.6rem', boxShadow: '0 8px 30px rgba(90,138,103,.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Overnight Growth Log</div>
          <div style={{ fontSize: '.72rem', color: c.muted }}>Review and approve actions</div>
        </div>
        <div style={{ background: c.gpale, color: c.g, fontSize: '.68rem', padding: '.25rem .6rem', borderRadius: 20, fontWeight: 700 }}>
          {activeCount} Actions
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1rem' }}>
        {actions.map(act => (
          <div 
            key={act.id}
            style={{
              padding: '.7rem .9rem', borderRadius: 10, border: `1px solid ${c.border}`,
              background: act.active ? '#fff' : '#FAFAF8',
              opacity: act.active ? 1 : 0.65,
              transition: 'all .25s ease',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem'
            }}
          >
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '.78rem', fontWeight: 600, color: act.active ? c.dark : c.muted, textDecoration: act.active ? 'none' : 'line-through' }}>
                {act.action}
              </div>
              <div style={{ fontSize: '.62rem', color: c.muted, marginTop: '.1rem' }}>
                💡 {act.reason}
              </div>
            </div>
            <button
              onClick={() => toggleAction(act.id)}
              style={{
                border: `1px solid ${act.active ? '#FCA5A5' : c.border}`,
                background: act.active ? '#FEF2F2' : '#F3F4F6',
                color: act.active ? '#EF4444' : c.dark,
                borderRadius: 6, padding: '.3rem .6rem', fontSize: '.68rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                transition: 'all .2s'
              }}
            >
              {act.active ? 'Undo' : 'Approve'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.6rem', borderTop: `1px solid ${c.border}`, paddingTop: '1rem' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: c.dark }}>+18%</div>
          <div style={{ fontSize: '.58rem', color: c.muted, textTransform: 'uppercase' }}>Daily Revenue</div>
        </div>
        <div style={{ width: 1, background: c.border }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: c.dark }}>$4.8K</div>
          <div style={{ fontSize: '.58rem', color: c.muted, textTransform: 'uppercase' }}>Sales Generated</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .hiw-grid { grid-template-columns:1fr !important; gap: 2rem !important; }
        }
      `}</style>
      <PageNav />
      <div style={{fontFamily:'Inter, sans-serif', background:c.bg, minHeight:'100vh'}}>

        {/* HERO */}
        <div style={{paddingTop:'6rem',paddingBottom:'2.5rem',textAlign:'center',background:'linear-gradient(170deg,#EEF4EF 0%,#F8FAF8 55%)'}}>
          <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3.2vw,2.5rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,maxWidth:650,margin:'0 auto .8rem'}}>
            Three steps to a <em style={{fontStyle:'italic',color:c.g}}>self-growing collection</em>
          </h1>
          <p style={{fontSize:'.85rem',color:c.muted,maxWidth:520,margin:'0 auto 1.5rem',lineHeight:1.8,fontWeight:300}}>
            No technical setup. Built for fashion sellers, not developers. Start growing in under 5 minutes.
          </p>
        </div>

        {/* STEPS — detailed */}
        {STEPS.map((step, i) => (
          <div key={step.num} style={{borderTop: i === 0 ? 'none' : `1px solid ${c.border}`, background: i % 2 === 0 ? '#fff' : c.bg2}}>
            <div className="hiw-grid" style={{maxWidth:1160,margin:'0 auto',padding: i === 0 ? '1rem 4rem 3.5rem 4rem' : '3.5rem 4rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center',direction: i % 2 === 0 ? 'ltr' : 'rtl'}}>
              
              {/* Text side */}
              <div style={{direction:'ltr'}}>
                <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
                  <div style={{width:48,height:48,background:c.g,color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.85rem',fontWeight:700,fontFamily:'Inter,sans-serif'}}>{step.num}</div>
                  <h2 style={{fontFamily:'Fraunces,serif',fontSize:'1.6rem',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>{step.title}</h2>
                </div>
                <p style={{fontSize:'.88rem',color:c.muted,lineHeight:1.85,fontWeight:300,marginBottom:'2rem'}}>{step.detail}</p>
                <Link to="/signup" style={{background:c.g,color:'#fff',padding:'.7rem 1.6rem',borderRadius:8,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 18px rgba(90,138,103,.2)'}}>
                  {i === 0 ? 'Connect Your Store →' : i === 1 ? 'Set Your Goals →' : 'Start Growing →'}
                </Link>
              </div>

              {/* Visual side (Interactive Mockups) */}
              <div style={{direction:'ltr', width: '100%', maxWidth: 440, margin: '0 auto'}}>
                {i === 0 && <ShopifyConnectDemo c={c} />}
                {i === 1 && <GoalsSetupDemo c={c} />}
                {i === 2 && <MorningReportDemo c={c} />}
              </div>
            </div>
          </div>
        ))}

        {/* TIMELINE */}
        <div style={{background:'#fff',borderTop:`1px solid ${c.border}`,padding:'5.5rem 4rem'}}>
          <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>What Happens Next</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,marginBottom:'3rem',letterSpacing:'-.3px'}}>
              Your first week with Selora
            </h2>
            {[
              { day: 'Day 1', text: 'Connect your store. Selora scans your catalog and begins analysis.' },
              { day: 'Day 2', text: 'First optimizations begin — pricing adjustments and listing rewrites.' },
              { day: 'Day 3-4', text: 'Ad spend reallocation kicks in. You see your first growth report.' },
              { day: 'Day 5-7', text: 'Full optimization running. Revenue trends start climbing.' },
            ].map((item, i) => (
              <div key={item.day} style={{display:'flex',gap:'1.5rem',alignItems:'flex-start',textAlign:'left',padding:'1.2rem 0',borderBottom: i < 3 ? `1px solid ${c.border}` : 'none'}}>
                <div style={{background:c.gpale,color:c.g,padding:'.4rem 1rem',borderRadius:8,fontSize:'.75rem',fontWeight:700,whiteSpace:'nowrap',fontFamily:'Inter,sans-serif'}}>{item.day}</div>
                <p style={{fontSize:'.88rem',color:c.text,lineHeight:1.7,fontWeight:300}}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{background:c.bg2,borderTop:`1px solid ${c.border}`,padding:'5.5rem 4rem'}}>
          <div style={{maxWidth:740,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>FAQ</p>
              <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>Common questions</h2>
            </div>
            {FAQ.map((item, i) => (
              <div key={i} style={{background:'#fff',border:`1px solid ${c.border}`,borderRadius:12,padding:'1.4rem 1.6rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'.9rem',fontWeight:600,color:c.dark,marginBottom:'.5rem'}}>{item.q}</div>
                <p style={{fontSize:'.82rem',color:c.muted,lineHeight:1.7,fontWeight:300}}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{textAlign:'center',padding:'6rem 4rem',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
          <div style={{position:'relative'}}>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
              Ready to start? It takes <em style={{color:'#86EFAC',fontStyle:'italic'}}>5 minutes</em>
            </h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7}}>
              Free trial — no credit card required.
            </p>
            <Link to="/signup" style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
              Get Started Free →
            </Link>
          </div>
        </div>

        <footer style={{borderTop:`1px solid ${c.border}`,padding:'2rem 4rem',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',flexWrap:'wrap',gap:'1rem'}}>
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
    </>
  )
}
