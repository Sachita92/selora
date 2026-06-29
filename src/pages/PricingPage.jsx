import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useDarkMode } from '../hooks/useDarkMode'
import Navbar from '../components/Navbar'

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
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
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
  color: 'var(--text-muted)',
  fontWeight: 300,
  zIndex: 10,
  lineHeight: 1,
}

const c = {
  g: 'var(--g)', g2: 'var(--g2)', gpale: 'var(--gpale)',
  bg: 'var(--bg)', bg2: 'var(--bg2)',
  border: 'var(--border)', dark: 'var(--dark)', text: 'var(--text)', muted: 'var(--muted)',
  card: 'var(--card-bg)'
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
  { q: 'What happens if I exceed my monthly optimization limit?', a: 'If you reach your monthly optimization limit, Selora will pause automated actions until the next billing cycle. You will be notified in advance and can upgrade your plan at any time to unlock additional optimizations immediately.' },
]



export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' or 'annual'
  const [activeFaq, setActiveFaq] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [checkoutPlan, setCheckoutPlan] = useState(null) // { slug, period }
  const [showComparison, setShowComparison] = useState(false)

  const handlePlanSelect = (planSlug, periodOverride) => {
    if (user && (user.subscription_plan || 'free') === planSlug && (user.subscription_status === 'active' || user.subscription_status === 'trialing')) {
      alert("You are already subscribed to this plan!")
      return
    }

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
    <div className="landing-page" style={{fontFamily:'Inter, sans-serif', background:c.bg, minHeight:'100vh', color:c.text}}>
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
        .checkout-input {
          width: 100%;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 15px;
          color: var(--text-primary);
          transition: all 0.2s ease;
          outline: none;
          font-family: 'Inter', sans-serif;
        }
        .checkout-input:focus {
          border-color: var(--g);
          box-shadow: 0 0 0 3px rgba(90, 138, 103, 0.15);
        }
        .checkout-select {
          width: 100%;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 15px;
          color: var(--text-primary);
          transition: all 0.2s ease;
          outline: none;
          font-family: 'Inter', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237B907D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
        }
        .checkout-select:focus {
          border-color: var(--g);
          box-shadow: 0 0 0 3px rgba(90, 138, 103, 0.15);
        }
      `}</style>
      <Navbar />


        {/* HERO & PRICING CARDS SECTION */}
        <div style={{background:'var(--bg2)', paddingTop:'6.5rem', paddingBottom:'4rem'}}>
          <div className="site-page-container">
            {/* HERO TEXT */}
            <div style={{textAlign:'center', marginBottom:'1.8rem'}}>
              <div style={{maxWidth: '640px', width: '100%', margin: '0 auto'}}>
                <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.5rem,3.2vw,2.5rem)',fontWeight:500,lineHeight:1.15,letterSpacing:'-.3px',color:c.dark,margin:'0 0 .8rem'}}>
                  Grow your collection, <em style={{fontStyle:'italic',color:c.g}}>pay as you scale</em>
                </h1>
                <p style={{fontSize:'.88rem',color:c.muted,lineHeight:1.8,fontWeight:300,margin:0}}>
                  Start free, scale when you're ready. 14-day free trial on paid tiers. Cancel anytime.
                </p>
              </div>
            </div>

            {/* Billing Switch */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{display:'inline-flex',background:'var(--card-bg)',border:`1px solid ${c.border}`,borderRadius:20,padding:'.25rem',alignItems:'center',gap:'.2rem'}}>
              <button 
                onClick={() => setBillingPeriod('monthly')}
                style={{
                  background: billingPeriod === 'monthly' ? 'var(--bg2)' : 'transparent',
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
                  background: billingPeriod === 'annual' ? 'var(--bg2)' : 'transparent',
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
            <div className="pricing-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem'}}>
            {PLANS.map(plan => {
              const basePrice = parseFloat(plan.price)
              const displayedPrice = basePrice === 0 
                ? 'Free' 
                : (billingPeriod === 'annual' ? (basePrice * 0.8).toFixed(2) : basePrice.toFixed(2))

              const isCurrentPlan = user && 
                (user.subscription_plan || 'free') === plan.slug && 
                (user.subscription_status === 'active' || user.subscription_status === 'trialing')

              return (
                <div 
                  key={plan.name}
                  className={plan.feat ? "price-card feat" : "price-card"}
                  style={{
                    background: 'var(--card-bg)', border: plan.feat ? `2px solid ${c.g}` : `1px solid ${c.border}`,
                    borderRadius: 16, padding: '2.5rem 2rem', position: 'relative', display: 'flex',
                    flexDirection: 'column', transition: 'all .25s ease-in-out',
                    boxShadow: plan.feat ? '0 12px 40px rgba(90,138,103,.12)' : 'none'
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
                    disabled={isCurrentPlan || checkoutLoading !== null}
                    style={{
                      display: 'block', width: '100%', padding: '.8rem', borderRadius: 8,
                      fontWeight: 600, fontSize: '.85rem', 
                      cursor: (isCurrentPlan || checkoutLoading !== null) ? 'not-allowed' : 'pointer', 
                      fontFamily: 'Inter,sans-serif', textAlign: 'center', transition: 'all .25s',
                      background: isCurrentPlan ? 'var(--bg-2)' : (plan.feat ? c.g : 'transparent'),
                      color: isCurrentPlan ? 'var(--text-muted)' : (plan.feat ? '#fff' : c.dark),
                      border: isCurrentPlan ? '1px solid var(--border)' : (plan.feat ? `1px solid ${c.g}` : `1px solid ${c.border}`),
                      boxShadow: (!isCurrentPlan && plan.feat) ? '0 4px 18px rgba(90,138,103,.25)' : 'none',
                      outline: 'none', opacity: checkoutLoading !== null ? 0.7 : 1
                    }}
                  >
                    {isCurrentPlan ? 'Current Plan' : (checkoutLoading === plan.slug ? 'Redirecting...' : plan.cta)}
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
              background: 'var(--card-bg)',
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '3.5rem 3rem',
              boxShadow: 'none',
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
        <div style={{background:c.bg2,borderTop:`1px solid ${c.border}`,padding:'4rem 0'}}>
          <div className="site-page-container">
            <div style={{textAlign: 'center', marginBottom: '3rem'}}>
              <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:c.g,marginBottom:'.7rem'}}>Questions</p>
              <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.35rem,3vw,2.2rem)',fontWeight:500,color:c.dark,letterSpacing:'-.3px'}}>Pricing FAQ</h2>
            </div>
            <div className="site-faq-grid">
              {FAQS.map((faq, i) => {
                const isOpen = activeFaq === i
                return (
                  <div 
                    key={i} 
                    style={{
                      background: 'var(--card-bg)', 
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
        <div style={{textAlign:'center',padding:'2.5rem 4rem',background:'linear-gradient(140deg,#1A271C 0%,#233329 100%)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(90,138,103,.12),transparent)',pointerEvents:'none'}} />
          <div style={{position:'relative'}}>
            <p style={{fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.14em',color:'#86EFAC',marginBottom:'.7rem'}}>Ready to start?</p>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(1.5rem,3.5vw,2.8rem)',fontWeight:500,color:'#fff',marginBottom:'1rem',lineHeight:1.15,letterSpacing:'-.3px'}}>
              Set up Selora and watch your <em style={{color:'#86EFAC',fontStyle:'italic'}}>collection grow</em>
            </h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:'.9rem',marginBottom:'2.2rem',fontWeight:300,lineHeight:1.7}}>
              14-day free trial on paid plans — cancel anytime.
            </p>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link to={user ? "/dashboard" : "/signup"} style={{background:'#86EFAC',color:c.dark,padding:'.8rem 2rem',borderRadius:8,fontSize:'.92rem',fontWeight:600,textDecoration:'none',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 20px rgba(134,239,172,.2)'}}>
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
        {checkoutPlan && (
          <CheckoutModal 
            planSlug={checkoutPlan.slug} 
            billingPeriod={checkoutPlan.period} 
            onClose={() => setCheckoutPlan(null)} 
            user={user}
          />
        )}
      </div>
  )
}

function CheckoutForm({ onClose, priceAmount, billingPeriod, planName, clientSecret }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAppContext()
  const [errorMessage, setErrorMessage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [textColor, setTextColor] = useState('#1A271C')
  const [mutedColor, setMutedColor] = useState('#7B907D')
  
  // Custom inputs state
  const [nameOnCard, setNameOnCard] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('US')

  const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AS', name: 'American Samoa' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AI', name: 'Anguilla' },
    { code: 'AQ', name: 'Antarctica' },
    { code: 'AG', name: 'Antigua & Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AW', name: 'Aruba' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BM', name: 'Bermuda' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia & Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BV', name: 'Bouvet Island' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IO', name: 'British Indian Ocean Territory' },
    { code: 'VG', name: 'British Virgin Islands' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'BQ', name: 'Caribbean Netherlands' },
    { code: 'KY', name: 'Cayman Islands' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CX', name: 'Christmas Island' },
    { code: 'CC', name: 'Cocos (Keeling) Islands' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo - Brazzaville' },
    { code: 'CD', name: 'Congo - Kinshasa' },
    { code: 'CK', name: 'Cook Islands' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CW', name: 'Curaçao' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'CI', name: 'Côte d’Ivoire' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FK', name: 'Falkland Islands' },
    { code: 'FO', name: 'Faroe Islands' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GF', name: 'French Guiana' },
    { code: 'PF', name: 'French Polynesia' },
    { code: 'TF', name: 'French Southern Territories' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GI', name: 'Gibraltar' },
    { code: 'GR', name: 'Greece' },
    { code: 'GL', name: 'Greenland' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'GU', name: 'Guam' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GG', name: 'Guernsey' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HM', name: 'Heard & McDonald Islands' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HK', name: 'Hong Kong SAR China' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IM', name: 'Isle of Man' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JE', name: 'Jersey' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MO', name: 'Macao SAR China' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MS', name: 'Montserrat' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar (Burma)' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NC', name: 'New Caledonia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NU', name: 'Niue' },
    { code: 'NF', name: 'Norfolk Island' },
    { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'MP', name: 'Northern Mariana Islands' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PS', name: 'Palestinian Territories' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PN', name: 'Pitcairn Islands' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'RE', name: 'Réunion' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SX', name: 'Sint Maarten' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'GS', name: 'South Georgia & South Sandwich Islands' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'BL', name: 'St. Barthélemy' },
    { code: 'SH', name: 'St. Helena' },
    { code: 'KN', name: 'St. Kitts & Nevis' },
    { code: 'LC', name: 'St. Lucia' },
    { code: 'MF', name: 'St. Martin' },
    { code: 'PM', name: 'St. Pierre & Miquelon' },
    { code: 'VC', name: 'St. Vincent & Grenadines' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SJ', name: 'Svalbard & Jan Mayen' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'ST', name: 'São Tomé & Príncipe' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TK', name: 'Tokelau' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad & Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TC', name: 'Turks & Caicos Islands' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UM', name: 'U.S. Outlying Islands' },
    { code: 'VI', name: 'U.S. Virgin Islands' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'WF', name: 'Wallis & Futuna' },
    { code: 'EH', name: 'Western Sahara' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
    { code: 'AX', name: 'Åland Islands' },
  ]

  useEffect(() => {
    const bodyStyle = window.getComputedStyle(document.documentElement)
    const textVal = bodyStyle.getPropertyValue('--text-primary').trim()
    const mutedVal = bodyStyle.getPropertyValue('--text-muted').trim()
    if (textVal) setTextColor(textVal)
    if (mutedVal) setMutedColor(mutedVal)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      setErrorMessage("Could not load card input fields.")
      setIsProcessing(false)
      return
    }

    const isSetup = clientSecret && clientSecret.startsWith('seti_')
    const confirmMethod = isSetup 
      ? stripe.confirmCardSetup.bind(stripe) 
      : stripe.confirmCardPayment.bind(stripe)

    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const { error } = await confirmMethod(clientSecret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: nameOnCard,
          email: user?.email || '',
          address: {
            postal_code: postalCode,
            country: country,
          }
        }
      },
      return_url: `${frontendUrl}/dashboard?billing_status=success`,
    })

    if (error) {
      let msg = error.message || "An unexpected card error occurred."
      if (error.code === 'card_declined') {
        msg = "Your card was declined — try a different card or contact your bank."
      } else if (error.code === 'insufficient_funds') {
        msg = "Your card has insufficient funds — please load funds or use a different card."
      } else if (error.code === 'expired_card') {
        msg = "Your card has expired — please try a different card."
      } else if (error.code === 'incorrect_cvc') {
        msg = "Incorrect security code (CVC) — please verify and try again."
      }
      setErrorMessage(msg)
      setIsProcessing(false)
    } else {
      // Success! Redirect to the dashboard
      window.location.href = `${frontendUrl}/dashboard?billing_status=success`
    }
  }

  const formattedPrice = priceAmount ? priceAmount.toFixed(2) : '9.99'
  const billingCycleText = billingPeriod === 'annual' ? 'year' : 'month'
  const finalBillingDetail = billingPeriod === 'annual' 
    ? `Billed annually ($${(parseFloat(formattedPrice) * 12).toFixed(2)}/year)` 
    : `Billed monthly`

  const elementOptions = {
    style: {
      base: {
        color: textColor,
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        '::placeholder': {
          color: mutedColor,
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  }

  const inputContainerStyle = (field) => ({
    background: 'var(--bg-1)',
    border: `1px solid ${focusedField === field ? 'var(--g)' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '.75rem 1rem',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(90, 138, 103, 0.15)' : 'none',
  })

  const labelStyle = {
    display: 'block',
    fontSize: '.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '.4rem',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', justifyContent: 'center' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '.8rem' }}>
          <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 500, color: 'var(--dark)' }}>Secure Card Payment</h3>
          <span style={{ fontSize: '.7rem', background: 'var(--gpale)', color: 'var(--g)', fontWeight: 700, padding: '.25rem .6rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            🔒 Stripe Secured
          </span>
        </div>

        {/* Custom Card Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Name on Card */}
          <div>
            <label style={labelStyle}>Name on Card</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. John Doe" 
              className="checkout-input"
              value={nameOnCard}
              onChange={e => setNameOnCard(e.target.value)}
            />
          </div>

          {/* Card Number */}
          <div>
            <label style={labelStyle}>Card Number</label>
            <div style={inputContainerStyle('number')}>
              <CardNumberElement 
                options={elementOptions} 
                onFocus={() => setFocusedField('number')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          {/* Expiry and CVC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>Expiration Date</label>
              <div style={inputContainerStyle('expiry')}>
                <CardExpiryElement 
                  options={elementOptions} 
                  onFocus={() => setFocusedField('expiry')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Security Code (CVC)</label>
              <div style={inputContainerStyle('cvc')}>
                <CardCvcElement 
                  options={elementOptions} 
                  onFocus={() => setFocusedField('cvc')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>
          </div>

          {/* Country and Postal Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>Country</label>
              <select 
                className="checkout-select"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} style={{background: 'var(--bg-1)', color: 'var(--text-primary)'}}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Postal / ZIP Code</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 44600" 
                className="checkout-input"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ color: '#ef4444', fontSize: '.8rem', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 8, padding: '.8rem 1rem', lineHeight: 1.4 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div>
        <button 
          type="submit" 
          disabled={!stripe || isProcessing}
          style={{
            background: 'var(--g)',
            color: '#fff',
            border: 'none',
            padding: '.95rem 1.5rem',
            borderRadius: 8,
            fontSize: '.95rem',
            fontWeight: 700,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.75 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Inter,sans-serif',
            width: '100%',
            boxShadow: '0 4px 18px rgba(90, 138, 103, 0.2)'
          }}
        >
          {isProcessing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className="spin-spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              Starting trial...
            </div>
          ) : `Start 14-Day Free Trial`}
        </button>

        <p style={{ fontSize: '.76rem', color: 'var(--muted)', textAlign: 'center', marginTop: '.6rem', lineHeight: 1.4, fontWeight: 300 }}>
          Then ${formattedPrice}/{billingCycleText} after your trial ends. {finalBillingDetail}. Cancel anytime in 1 click.
        </p>
      </div>

      {/* Trust Badges */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', textAlign: 'center' }}>
        {[
          { icon: '🔒', label: 'SSL Encrypted' },
          { icon: '✓', label: 'Cancel Anytime' },
          { icon: '✓', label: '14-Day Trial' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem' }}>
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span style={{ fontSize: '.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </form>
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
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.25; }
        }
        .shimmer-element {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        
        <div className="checkout-split" style={{ display: 'grid', gridTemplateColumns: '4.2fr 5.8fr', minHeight: '520px' }}>
          {/* LEFT SIDEBAR */}
          <div style={{ padding: '2.5rem', background: 'var(--bg-0)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--g)', display: 'block', marginBottom: '.4rem' }}>Your Plan</span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.9rem', fontWeight: 500, color: 'var(--dark)', letterSpacing: '-.5px' }}>{planInfo.name}</h2>
              <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.3rem', fontWeight: 300, lineHeight: 1.5 }}>Native checkouts are fully secured and encrypted by Stripe.</p>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 600, color: 'var(--dark)', fontFamily: 'Fraunces, serif', display: 'flex', alignItems: 'baseline', gap: '.1rem' }}>
                ${priceAmount.toFixed(2)}<span style={{ fontSize: '.88rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', marginTop: '.3rem', fontWeight: 500 }}>{periodLabel}</div>
              {billingPeriod === 'annual' && (
                <div style={{ fontSize: '.68rem', color: 'var(--g)', fontWeight: 700, marginTop: '.5rem', background: 'var(--gpale)', padding: '.2rem .5rem', borderRadius: 4, display: 'inline-block' }}>
                  Save 20% with annual billing
                </div>
              )}
            </div>

            {/* Timeline: What happens next */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>What happens next</span>
              <div style={{ display: 'flex', gap: '.6rem', fontSize: '.78rem', lineHeight: 1.4, fontWeight: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', color: '#fff', fontWeight: 700 }}>1</div>
                  <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 12, marginTop: 4 }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>Today</strong>: Start your 14-day free trial. Instant access to all features.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', fontSize: '.78rem', lineHeight: 1.4, fontWeight: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', color: 'var(--text-muted)', fontWeight: 700 }}>2</div>
                  <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 12, marginTop: 4 }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>Day 14</strong>: Trial ends. Charged ${priceAmount.toFixed(2)}. Cancel anytime before this date to avoid charges.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', fontSize: '.78rem', lineHeight: 1.4, fontWeight: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', color: 'var(--text-muted)', fontWeight: 700 }}>3</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>Cancel anytime</strong>: Stop your subscription in 1 click from dashboard settings.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 300 }}>
                PCI-DSS Compliant. We never store or handle your credit card data.
              </span>
            </div>
          </div>

          {/* RIGHT PANEL (Checkout Form) */}
          <div style={{ padding: '3.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg2)' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem' }}>
                <div className="shimmer-element" style={{ height: 24, width: '45%', background: 'var(--border)', borderRadius: 4 }} />
                <div style={{ height: 1, width: '100%', background: 'var(--border)', marginBottom: '.5rem' }} />
                <div className="shimmer-element" style={{ height: 95, width: '100%', background: 'var(--border)', borderRadius: 8 }} />
                <div className="shimmer-element" style={{ height: 42, width: '100%', background: 'var(--border)', borderRadius: 8 }} />
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <span style={{ fontSize: '2.2rem' }}>⚠️</span>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: '.5rem 0 .2rem 0', color: 'var(--dark)' }}>Failed to load checkout</h3>
                <p style={{ fontSize: '.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error}</p>
                <button onClick={onClose} style={{ background: 'var(--g)', color: '#fff', border: 'none', padding: '.6rem 1.4rem', borderRadius: 6, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>Close Modal</button>
              </div>
            ) : (
              clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm onClose={onClose} priceAmount={priceAmount} billingPeriod={billingPeriod} planName={planInfo.name} clientSecret={clientSecret} />
                </Elements>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
