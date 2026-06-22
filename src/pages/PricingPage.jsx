import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26, 39, 28, 0.45)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '2rem',
}

const modalStyle = {
  background: '#fff',
  border: '1px solid #E4EBE5',
  borderRadius: 16,
  width: '100%',
  maxWidth: 1000,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 64px rgba(26,39,28,.15)',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
}

const closeBtnStyle = {
  position: 'absolute',
  top: '1.2rem',
  right: '1.5rem',
  background: 'none',
  border: 'none',
  fontSize: '1.8rem',
  cursor: 'pointer',
  color: '#7B907D',
  fontWeight: 300,
  zIndex: 10,
  lineHeight: 1,
}

const c = {
  g: '#5A8A67', g2: '#78A885', gpale: '#EDF3EE',
  bg: '#F8FAF8', bg2: '#F1F5F1',
  border: '#E4EBE5', dark: '#1A271C', text: '#2E3D30', muted: '#7B907D',
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
    price: '9.99',
    desc: 'Designed for active fashion stores looking to scale operations.',
    features: ['1 Store connection', 'Unlimited products', '30 optimizations / month', 'Full overnight growth agent', 'Automatic smart pricing', 'AI listing rewriter', 'Standard email support'],
    cta: 'Start Free Trial',
    feat: true,
    slug: 'growth',
  },
  {
    name: 'Scale',
    price: '29.99',
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
  { q: 'How does store setup work?', a: 'You can connect an existing Shopify store securely in under 2 minutes, or create a brand-new native storefront directly on Selora. We only ask for the permissions necessary to manage products and analyze campaigns, and all store data is encrypted securely.' },
  { q: 'Are there any setup fees or hidden costs?', a: 'No setup fees, contracts, or hidden transaction charges. You only pay the flat monthly rate indicated for your chosen plan.' },
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
        <Link to="/how-it-works" style={{color:c.muted,textDecoration:'none',fontWeight:500}}>How It Works</Link>
        <Link to="/pricing" style={{fontWeight:600,color:c.dark,textDecoration:'none',borderBottom:`2px solid ${c.g}`,paddingBottom:'.15rem'}}>Pricing</Link>
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

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' or 'annual'
  const [activeFaq, setActiveFaq] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [checkoutPlan, setCheckoutPlan] = useState(null) // { slug, period }
  const [showComparison, setShowComparison] = useState(false)

  const handlePlanSelect = (planSlug, periodOverride) => {
    if (planSlug === 'free') {
      if (user) {
        navigate('/dashboard')
      } else {
        navigate('/signup')
      }
      return
    }

    const activePeriod = periodOverride || billingPeriod

    if (user) {
      setCheckoutPlan({ slug: planSlug, period: activePeriod })
    } else {
      navigate(`/signup?plan=${planSlug}${activePeriod === 'annual' ? '&period=annual' : ''}`)
    }
  }

  // Auto-checkout if plan is passed in query string and user is logged in
  useEffect(() => {
    if (user && checkoutPlan === null) {
      const searchParams = new URLSearchParams(window.location.search)
      const plan = searchParams.get('plan')
      const period = searchParams.get('period') || 'monthly'
      if (plan && plan !== 'free') {
        const activePeriod = period === 'annual' || period === 'yearly' ? 'annual' : 'monthly'
        if (activePeriod === 'annual') {
          setBillingPeriod('annual')
        }
        // Clear parameter from URL so it doesn't trigger repeatedly if user cancels/returns
        navigate(window.location.pathname, { replace: true })
        setCheckoutPlan({ slug: plan, period: activePeriod })
      }
    }
  }, [user, navigate, checkoutPlan])

  return (
    <>
      <style>{`
        @keyframes pricingSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
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
              const basePrice = parseFloat(plan.price)
              const displayedPrice = basePrice === 0 
                ? 'Free' 
                : (billingPeriod === 'annual' ? (basePrice * 0.8).toFixed(2) : basePrice.toFixed(2))

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
                      {displayedPrice === 'Free' ? 'Free' : `$${displayedPrice}`}
                    </span>
                    {displayedPrice !== 'Free' && (
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
                  
                  <button 
                    onClick={() => handlePlanSelect(plan.slug)}
                    disabled={checkoutLoading !== null}
                    style={{
                      display: 'block', width: '100%', padding: '.8rem', borderRadius: 8,
                      fontWeight: 600, fontSize: '.85rem', cursor: checkoutLoading !== null ? 'not-allowed' : 'pointer', 
                      fontFamily: 'Inter,sans-serif', textAlign: 'center', transition: 'all .25s',
                      background: plan.feat ? c.g : 'transparent',
                      color: plan.feat ? '#fff' : c.dark,
                      border: plan.feat ? `1px solid ${c.g}` : `1px solid ${c.border}`,
                      boxShadow: plan.feat ? '0 4px 18px rgba(90,138,103,.25)' : 'none',
                      outline: 'none', opacity: checkoutLoading !== null ? 0.7 : 1
                    }}
                  >
                    {checkoutLoading === plan.slug ? 'Redirecting...' : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Toggle Button */}
          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <button
              onClick={() => setShowComparison(prev => !prev)}
              style={{
                background: 'none',
                border: `1px solid ${c.border}`,
                borderRadius: 24,
                padding: '.6rem 1.8rem',
                fontSize: '.82rem',
                color: c.g,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter,sans-serif',
                outline: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = c.gpale; e.currentTarget.style.borderColor = c.g }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = c.border }}
            >
              {showComparison ? 'Hide Detailed Comparison ▲' : 'Compare Detailed Features ▼'}
            </button>
          </div>

          {/* Collapsible Comparison Table */}
          {showComparison && (
            <div style={{
              marginTop: '3.5rem',
              background: '#fff',
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '3.5rem 3rem',
              boxShadow: '0 8px 30px rgba(0,0,0,.03)',
              animation: 'pricingSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both'
            }}>
              <div style={{maxWidth: 900, margin: '0 auto'}}>
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
          )}
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

      {checkoutPlan && (
        <CheckoutModal 
          planSlug={checkoutPlan.slug} 
          billingPeriod={checkoutPlan.period} 
          onClose={() => setCheckoutPlan(null)} 
          user={user}
        />
      )}
    </>
  )
}

function CheckoutModal({ planSlug, billingPeriod, onClose, user }) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const planInfo = PLANS.find(p => p.slug === planSlug)

  useEffect(() => {
    if (!planSlug || !planInfo) {
      setError('Invalid plan selected.')
      setLoading(false)
      return
    }

    const initCheckout = async () => {
      try {
        const res = await fetch(`${API_URL}/api/billing/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            plan: planSlug,
            billing_period: billingPeriod
          })
        })
        const data = await res.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.detail || 'Failed to initialize payment session')
        }
      } catch (e) {
        setError('Could not connect to payment servers.')
      } finally {
        setLoading(false)
      }
    }

    initCheckout()
  }, [planSlug, planInfo, user, billingPeriod])

  if (!planInfo) return null

  const basePrice = parseFloat(planInfo.price)
  const priceAmount = billingPeriod === 'annual' ? (basePrice * 0.8) : basePrice
  const priceLabel = billingPeriod === 'annual' ? `$${priceAmount.toFixed(2)}/month` : `$${priceAmount.toFixed(2)}/month`
  const yearlyTotal = priceAmount * 12
  const periodLabel = billingPeriod === 'annual' ? `Billed annually ($${yearlyTotal.toFixed(2)}/year)` : 'Billed monthly'

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        
        <div className="checkout-split" style={{ display: 'grid', gridTemplateColumns: '4.2fr 5.8fr', minHeight: '500px' }}>
          {/* LEFT SIDEBAR */}
          <div style={{ padding: '2.5rem', background: '#F8FAF8', borderRight: '1px solid #E4EBE5', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#5A8A67', display: 'block', marginBottom: '.4rem' }}>Your Subscription</span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 500, color: '#1A271C', letterSpacing: '-.5px' }}>{planInfo.name}</h2>
              <p style={{ fontSize: '.78rem', color: '#7B907D', marginTop: '.3rem', fontWeight: 300, lineHeight: 1.5 }}>Native checkouts are fully secured and encrypted by Stripe.</p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E4EBE5', borderRadius: 12, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1A271C', fontFamily: 'Fraunces, serif' }}>{priceLabel}</div>
              <div style={{ fontSize: '.72rem', color: '#7B907D', marginTop: '.2rem' }}>{periodLabel}</div>
              {billingPeriod === 'annual' && (
                <div style={{ fontSize: '.68rem', color: '#5A8A67', fontWeight: 600, marginTop: '.4rem', background: '#EDF3EE', padding: '.2rem .5rem', borderRadius: 4, display: 'inline-block' }}>
                  Save 20% with annual billing
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#1A271C', marginBottom: '.6rem' }}>Features Included:</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {planInfo.features.map(f => (
                  <li key={f} style={{ fontSize: '.78rem', color: '#2E3D30', display: 'flex', gap: '.4rem', alignItems: 'center', fontWeight: 300 }}>
                    <span style={{ color: '#5A8A67', fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginTop: 'auto', borderTop: '1px solid #E4EBE5', paddingTop: '1.2rem' }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span style={{ fontSize: '.68rem', color: '#7B907D', lineHeight: 1.4, fontWeight: 300 }}>
                PCI-DSS Compliant. We never store or handle your credit card data.
              </span>
            </div>
          </div>

          {/* RIGHT PANEL (Checkout Form) */}
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ width: 32, height: 32, border: '2.5px solid #EDF3EE', borderTopColor: '#5A8A67', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem', color: '#7B907D', fontSize: '.8rem' }}>Initializing Stripe secure frame...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', margin: '.5rem 0' }}>Failed to load checkout</h3>
                <p style={{ fontSize: '.8rem', color: '#7B907D', marginBottom: '1.5rem' }}>{error}</p>
                <button onClick={onClose} style={{ background: '#5A8A67', color: '#fff', border: 'none', padding: '.5rem 1.2rem', borderRadius: 6, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>Close Modal</button>
              </div>
            ) : (
              clientSecret && (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
