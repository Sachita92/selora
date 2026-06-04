import { Link } from 'react-router-dom'
import { useState } from 'react'

const c = {
  g: '#5A8A67', g2: '#78A885', gpale: '#EDF3EE',
  bg: '#F8FAF8', bg2: '#F1F5F1',
  border: '#E4EBE5', dark: '#1A271C', text: '#2E3D30', muted: '#7B907D',
}

const PLANS = [
  {
    name: 'Free',
    price: '0',
    desc: 'Perfect for small stores starting out or testing the waters.',
    features: ['1 Store connection', 'Up to 50 active products', '3 optimizations / month', 'Basic daily report', 'Community support'],
    cta: 'Get Started Free',
    feat: false,
    slug: 'free',
  },
  {
    name: 'Growth',
    price: '29',
    desc: 'Designed for active fashion stores looking to scale operations.',
    features: ['1 Store connection', 'Unlimited products', '30 optimizations / month', 'Full overnight growth agent', 'Automatic smart pricing', 'AI listing rewriter', 'Standard email support'],
    cta: 'Start Free Trial',
    feat: true,
    slug: 'growth',
  },
  {
    name: 'Scale',
    price: '79',
    desc: 'For larger brands running multiple storefronts and campaigns.',
    features: ['3 Store connections', 'Unlimited products', 'Unlimited optimizations', 'Priority email & chat support', 'Dynamic ad budget reallocation', 'Early product access', 'Custom pricing guardrails'],
    cta: 'Upgrade to Scale',
    feat: false,
    slug: 'scale',
  },
]

const COMPARISON = [
  { category: 'General', items: [
    { name: 'Store Connections', free: '1 Store', growth: '1 Store', scale: 'Up to 3 Stores' },
    { name: 'Active Products', free: '50 Products', growth: 'Unlimited', scale: 'Unlimited' },
    { name: 'Optimizations', free: '3 / mo', growth: '30 / mo', scale: 'Unlimited' },
  ]},
  { category: 'AI Intelligence', items: [
    { name: 'Daily Performance Reports', free: '✓ (Basic)', growth: '✓ (Detailed)', scale: '✓ (Advanced)' },
    { name: 'Overnight Growth Agent', free: '—', growth: '✓', scale: '✓' },
    { name: 'Smart Repricing', free: '—', growth: '✓', scale: '✓' },
    { name: 'AI Listing Rewrites', free: '—', growth: '✓', scale: '✓' },
    { name: 'Ad Budget Optimizer', free: '—', freeLabel: '—', growth: '—', growthLabel: '—', scale: '✓' },
  ]},
  { category: 'Support & Access', items: [
    { name: 'Support Level', free: 'Community', growth: 'Email Support', scale: 'Priority 24/7' },
    { name: 'Custom Guardrails', free: '—', growth: '—', scale: '✓' },
    { name: 'Early Feature Access', free: '—', growth: '—', scale: '✓' },
  ]},
]

const FAQS = [
  { q: 'Is there a free trial for paid plans?', a: 'Yes! The Growth and Scale plans come with a 14-day free trial. No credit card is required to start, and you can cancel anytime before your trial ends.' },
  { q: 'Can I change my plan later?', a: 'Absolutely. You can upgrade, downgrade, or cancel your subscription directly from your settings dashboard at any time. If you downgrade, your changes will apply to the next billing cycle.' },
  { q: 'What counts as an "optimization"?', a: 'An optimization is a distinct automated action taken by Selora to improve your store. This includes adjusting a product\'s price based on trends, rewriting a description for better SEO/conversion, or shifting budget for a low-performing ad campaign.' },
  { q: 'How does store linking work?', a: 'Selora integrates directly with Shopify via a secure API connection. It takes under 2 minutes to authorize Selora. We only ask for the permissions necessary to manage products and analyze ad campaigns, and your store data is encrypted securely.' },
  { q: 'Are there any setup fees or hidden costs?', a: 'No setup fees, contracts, or hidden transaction charges. You only pay the flat monthly rate indicated for your chosen plan.' },
]

function PageNav() {
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 3.5rem',background:'rgba(248,250,248,.97)',backdropFilter:'blur(14px)',borderBottom:`1px solid ${c.border}`,fontFamily:'Inter,sans-serif'}}>
      <Link to="/" style={{fontFamily:'Inter,sans-serif',fontSize:'1.2rem',fontWeight:700,letterSpacing:'-.3px',color:c.dark,textDecoration:'none'}}>
        Se<span style={{color:c.g}}>lo</span>ra
      </Link>
      <div style={{display:'flex',gap:'2rem',alignItems:'center',fontSize:'.82rem'}}>
        <Link to="/features" style={{color:c.muted,textDecoration:'none',fontWeight:500}}>Features</Link>
        <Link to="/how-it-works" style={{color:c.muted,textDecoration:'none',fontWeight:500}}>How It Works</Link>
        <Link to="/pricing" style={{fontWeight:600,color:c.dark,textDecoration:'none',borderBottom:`2px solid ${c.g}`,paddingBottom:'.15rem'}}>Pricing</Link>
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

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' or 'annual'
  const [activeFaq, setActiveFaq] = useState(null)

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns:1fr !important; }
          .comparison-table-wrapper { overflow-x: auto; }
          .comparison-table { min-width: 600px; }
        }
      `}</style>
      <PageNav />
      <div style={{fontFamily:'Inter, sans-serif', background:c.bg, minHeight:'100vh', color:c.text}}>

        {/* HERO & PRICING CARDS SECTION */}
        <div style={{background:'linear-gradient(170deg,#EEF4EF 0%,#F8FAF8 70%)', paddingTop:'6rem', paddingBottom:'4rem'}}>
          <div style={{textAlign:'center'}}>
            <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3.2vw,2.5rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,maxWidth:650,margin:'0 auto .8rem'}}>
              Grow your collection, <em style={{fontStyle:'italic',color:c.g}}>pay as you scale</em>
            </h1>
            <p style={{fontSize:'.85rem',color:c.muted,maxWidth:520,margin:'0 auto 1.2rem',lineHeight:1.8,fontWeight:300}}>
              Start free, scale when you're ready. 14-day free trial on paid tiers. Cancel anytime.
            </p>

            {/* Billing Switch */}
            <div style={{display:'inline-flex',background:c.bg2,border:`1px solid ${c.border}`,borderRadius:20,padding:'.25rem',alignItems:'center',gap:'.2rem',marginBottom:'2.2rem'}}>
              <button 
                onClick={() => setBillingPeriod('monthly')}
                style={{
                  background: billingPeriod === 'monthly' ? '#fff' : 'transparent',
                  color: billingPeriod === 'monthly' ? c.dark : c.muted,
                  border: 'none', borderRadius: 16, padding: '.4rem 1.2rem', fontSize: '.78rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all .25s', fontFamily: 'Inter,sans-serif'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingPeriod('annual')}
                style={{
                  background: billingPeriod === 'annual' ? '#fff' : 'transparent',
                  color: billingPeriod === 'annual' ? c.dark : c.muted,
                  border: 'none', borderRadius: 16, padding: '.4rem 1.2rem', fontSize: '.78rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all .25s', fontFamily: 'Inter,sans-serif',
                  display: 'flex', alignItems: 'center', gap: '.4rem'
                }}
              >
                Yearly <span style={{background:c.gpale,color:c.g,fontSize:'.65rem',padding:'.1rem .4rem',borderRadius:99,fontWeight:700}}>Save 20%</span>
              </button>
            </div>
          </div>

          {/* PRICING CARDS */}
          <div style={{maxWidth:1160,margin:'0 auto',padding:'0 4rem'}}>
            <div className="pricing-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem'}}>
            {PLANS.map(plan => {
              const basePrice = parseInt(plan.price)
              const displayedPrice = billingPeriod === 'annual' 
                ? Math.round(basePrice * 0.8) 
                : basePrice

              return (
                <div 
                  key={plan.name} 
                  style={{
                    background: '#fff', border: plan.feat ? `2px solid ${c.g}` : `1px solid ${c.border}`,
                    borderRadius: 16, padding: '2.5rem 2rem', position: 'relative', display: 'flex',
                    flexDirection: 'column', transition: 'all .2s',
                    boxShadow: plan.feat ? '0 12px 40px rgba(90,138,103,.12)' : '0 4px 20px rgba(0,0,0,.02)'
                  }}
                >
                  {plan.feat && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: c.g, color: '#fff', fontSize: '.68rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.08em', padding: '.3rem .9rem',
                      borderRadius: 999, fontFamily: 'Inter,sans-serif'
                    }}>
                      Most Popular
                    </div>
                  )}
                  
                  <div style={{fontSize:'.82rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:plan.feat ? c.g : c.muted,marginBottom:'.6rem'}}>{plan.name}</div>
                  
                  <div style={{display:'flex',alignItems:'baseline',marginBottom:'.8rem'}}>
                    <span style={{fontFamily:'Fraunces,serif',fontSize:'2.8rem',fontWeight:500,color:c.dark,letterSpacing:'-1px'}}>
                      {displayedPrice === 0 ? 'Free' : `$${displayedPrice}`}
                    </span>
                    {displayedPrice > 0 && (
                      <span style={{fontSize:'.82rem',color:c.muted,marginLeft:'.25rem'}}>/month</span>
                    )}
                  </div>
                  
                  <p style={{fontSize:'.8rem',color:c.muted,lineHeight:1.6,fontWeight:300,marginBottom: '1.8rem', minHeight: 48}}>{plan.desc}</p>
                  
                  <div style={{borderBottom:`1px solid ${c.border}`,marginBottom:'1.8rem'}} />
                  
                  <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'.7rem',marginBottom:'2.5rem',flex:1}}>
                    {plan.features.map(f => (
                      <li key={f} style={{fontSize:'.8rem',color:c.text,display:'flex',alignItems:'flex-start',gap:'.5rem',fontWeight:300,lineHeight:1.4}}>
                        <span style={{color:c.g,fontWeight:700,fontSize:'.9rem',lineHeight:1.1}}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    to="/signup" 
                    style={{
                      display: 'block', width: '100%', padding: '.8rem', borderRadius: 8,
                      fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                      textAlign: 'center', textDecoration: 'none', transition: 'all .25s',
                      background: plan.feat ? c.g : 'transparent',
                      color: plan.feat ? '#fff' : c.dark,
                      border: plan.feat ? `1px solid ${c.g}` : `1px solid ${c.border}`,
                      boxShadow: plan.feat ? '0 4px 18px rgba(90,138,103,.25)' : 'none'
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>

        {/* DETAILED COMPARISON TABLE */}
        <div style={{background: '#fff', borderTop: `1px solid ${c.border}`, padding: '5.5rem 4rem'}}>
          <div style={{maxWidth: 900, margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '3.5rem'}}>
              <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>Comparison</p>
              <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>Feature comparison</h2>
            </div>

            <div className="comparison-table-wrapper">
              <table className="comparison-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'.82rem',textAlign:'left'}}>
                <thead>
                  <tr style={{borderBottom:`2px solid ${c.border}`}}>
                    <th style={{padding:'1rem .5rem',fontWeight:600,color:c.dark,width:'40%'}}>Features</th>
                    <th style={{padding:'1rem .5rem',fontWeight:600,color:c.dark,width:'20%'}}>Free</th>
                    <th style={{padding:'1rem .5rem',fontWeight:600,color:c.dark,width:'20%'}}>Growth</th>
                    <th style={{padding:'1rem .5rem',fontWeight:600,color:c.dark,width:'20%'}}>Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(cat => (
                    <tr key={cat.category}>
                      <td colSpan={4} style={{padding:0}}>
                        <table style={{width:'100%',borderCollapse:'collapse'}}>
                          <tbody>
                            <tr>
                              <td colSpan={4} style={{padding:'1.5rem .5rem .5rem',fontWeight:700,color:c.g,textTransform:'uppercase',letterSpacing:'.06em',fontSize:'.68rem'}}>
                                {cat.category}
                              </td>
                            </tr>
                            {cat.items.map((row, idx) => (
                              <tr key={idx} style={{borderBottom:`1px solid ${c.border}`}}>
                                <td style={{padding:'.9rem .5rem',color:c.dark,width:'40%',fontWeight:500}}>{row.name}</td>
                                <td style={{padding:'.9rem .5rem',color:c.text,width:'20%'}}>{row.free}</td>
                                <td style={{padding:'.9rem .5rem',color:c.text,width:'20%'}}>{row.growth}</td>
                                <td style={{padding:'.9rem .5rem',color:c.text,width:'20%',fontWeight:row.scale.includes('Priority') || row.scale === '✓' ? 600 : 400}}>{row.scale}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ ACCORDION */}
        <div style={{background:c.bg2,borderTop:`1px solid ${c.border}`,padding:'5.5rem 4rem'}}>
          <div style={{maxWidth: 740, margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '3rem'}}>
              <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>Questions</p>
              <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>Pricing FAQ</h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.8rem'}}>
              {FAQS.map((faq, i) => {
                const isOpen = activeFaq === i
                return (
                  <div 
                    key={i} 
                    style={{
                      background: '#fff', 
                      border: `1px solid ${c.border}`, 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      transition: 'all .25s ease-in-out',
                      boxShadow: isOpen ? '0 8px 24px rgba(90,138,103,.05)' : 'none'
                    }}
                  >
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        padding: '1.4rem 1.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: c.dark,
                        fontFamily: 'Inter,sans-serif',
                        outline: 'none'
                      }}
                    >
                      <span style={{fontSize:'.9rem',fontWeight:600,color:isOpen ? c.g : c.dark,transition:'color .2s'}}>{faq.q}</span>
                      <span style={{
                        fontSize: '.75rem', 
                        color: isOpen ? c.g : c.muted, 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform .25s ease-in-out',
                        lineHeight: 1
                      }}>
                        ▼
                      </span>
                    </button>
                    <div 
                      style={{
                        maxHeight: isOpen ? '160px' : '0px',
                        opacity: isOpen ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height .25s ease-in-out, opacity .25s ease-in-out',
                      }}
                    >
                      <p style={{
                        fontSize: '.82rem',
                        color: c.muted,
                        lineHeight: 1.7,
                        fontWeight: 300,
                        padding: '0 1.6rem 1.4rem 1.6rem',
                        borderTop: `1px solid ${isOpen ? c.border : 'transparent'}`,
                        transition: 'border-color .25s ease-in-out'
                      }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{textAlign:'center',padding:'6rem 4rem',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
          <div style={{position:'relative'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:'#86EFAC',marginBottom:'.7rem'}}>Ready to start?</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
              Set up Selora and watch your <em style={{color:'#86EFAC',fontStyle:'italic'}}>collection grow</em>
            </h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7}}>
              14-day free trial on paid plans — cancel anytime.
            </p>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link to="/signup" style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 20px rgba(134,239,172,.2)'}}>
                Get Started Free →
              </Link>
              <Link to="/demo" style={{background:'transparent',color:'rgba(255,255,255,.6)',border:'1px solid rgba(255,255,255,.18)',padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:500,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>
                Book a Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
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
