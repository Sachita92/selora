import { Link } from 'react-router-dom'

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
        <Link to="/login" style={{fontSize:'.82rem',fontWeight:500,color:c.muted,textDecoration:'none'}}>Sign In</Link>
        <Link to="/signup" style={{background:c.g,color:'#fff',padding:'.5rem 1.3rem',borderRadius:7,fontSize:'.82rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
          Get Started Free
        </Link>
      </div>
    </nav>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .hiw-grid { grid-template-columns:1fr !important; }
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
          <div key={step.num} style={{borderTop:`1px solid ${c.border}`,background: i % 2 === 0 ? '#fff' : c.bg2}}>
            <div className="hiw-grid" style={{maxWidth:1160,margin:'0 auto',padding:'3.5rem 4rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center',direction: i % 2 === 0 ? 'ltr' : 'rtl'}}>
              
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

              {/* Visual side */}
              <div style={{direction:'ltr',background:c.bg,border:`1px solid ${c.border}`,borderRadius:18,padding:'2.5rem',boxShadow:'0 12px 40px rgba(90,138,103,.07)'}}>
                <div style={{fontSize:'3.5rem',textAlign:'center',marginBottom:'1.2rem'}}>{step.icon}</div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Fraunces,serif',fontSize:'1.3rem',fontWeight:500,color:c.dark,marginBottom:'.5rem'}}>{step.title}</div>
                  <p style={{fontSize:'.82rem',color:c.muted,lineHeight:1.7,fontWeight:300}}>{step.desc}</p>
                </div>
                <div style={{marginTop:'1.5rem',background:'#fff',borderRadius:10,padding:'1rem',border:`1px solid ${c.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.4rem',marginBottom:'.6rem'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:c.g}} />
                    <span style={{fontSize:'.65rem',fontWeight:600,color:c.muted,textTransform:'uppercase',letterSpacing:'.06em'}}>
                      {i === 0 ? 'Connection Status' : i === 1 ? 'Goal Configuration' : 'Morning Report'}
                    </span>
                  </div>
                  <div style={{fontSize:'.78rem',color:c.text,fontWeight:500}}>
                    {i === 0 ? '✓ Store connected · 247 products synced' : i === 1 ? '✓ Revenue growth + margin optimization' : '✓ 4 actions taken · $4,821 revenue'}
                  </div>
                </div>
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
