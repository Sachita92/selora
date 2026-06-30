import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ─── Shared Styles & Constants ───────────────────────────────────────────────
const c = {
  green: 'var(--g)', green2: 'var(--g2)', greenPale: 'var(--gpale)',
  dark: 'var(--dark)', text: 'var(--text)', muted: 'var(--muted)',
  border: 'var(--border)', bg: 'var(--bg)', bg2: 'var(--bg2)', card: 'var(--card-bg)',
}

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

const TIMEZONES = [
  'Asia/Kathmandu (NPT)', 'Asia/Kolkata (IST)', 'Europe/London (GMT)',
  'America/New_York (EST)', 'America/Los_Angeles (PST)', 'Asia/Dubai (GST)',
]

const WHAT_YOU_GET = [
  { iconType: 'target', title: 'Personalized walkthrough', desc: 'We tailor the demo around your store, products, and growth goals — not a generic slideshow.' },
  { iconType: 'monitor', title: 'Live agent demonstration', desc: 'Watch Selora analyze a real fashion store in real time and show you exactly what it would do.' },
  { iconType: 'chat', title: 'Your questions answered', desc: 'Get direct answers from the team on pricing, integrations, limitations, and timelines.' },
  { iconType: 'map', title: 'Onboarding roadmap', desc: 'Walk away with a clear plan for getting your store set up and growing within 48 hours.' },
]

// ─── SVG Icons (No Emojis, Premium Line Art) ──────────────────────────────────
function TargetIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function MonitorIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function ChatIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MapIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function UserIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LockIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ChevronDownIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}


const iconMap = {
  target: <TargetIcon size={20} color="var(--g)" />,
  monitor: <MonitorIcon size={20} color="var(--g)" />,
  chat: <ChatIcon size={20} color="var(--g)" />,
  map: <MapIcon size={20} color="var(--g)" />,
}

export default function BookDemo() {
  const [darkMode, toggleTheme] = useDarkMode()
  const [step, setStep] = useState(1) // 1 = form, 2 = time slot, 3 = confirmed
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', storeUrl: '',
    platform: '', teamSize: '', timezone: TIMEZONES[0], message: '',
  })
  
  const [selectedChallenges, setSelectedChallenges] = useState([])
  const [otherText, setOtherText] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [loading, setLoading] = useState(false)

  // Generate next 7 business days
  const getDates = () => {
    const dates = []
    const now = new Date()
    let d = new Date(now)
    d.setDate(d.getDate() + 1)
    while (dates.length < 7) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) {
        dates.push(new Date(d))
      }
      d.setDate(d.getDate() + 1)
    }
    return dates
  }

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChallengeToggle = (challenge) => {
    let next
    if (selectedChallenges.includes(challenge)) {
      next = selectedChallenges.filter(c => c !== challenge)
    } else {
      next = [...selectedChallenges, challenge]
    }
    setSelectedChallenges(next)
    
    const challengesStr = next.join(', ')
    const finalMessage = otherText 
      ? (challengesStr ? `${challengesStr}. Details: ${otherText}` : otherText)
      : challengesStr
    setFormData(prev => ({ ...prev, message: finalMessage }))
  }

  const handleOtherTextChange = (e) => {
    const text = e.target.value
    setOtherText(text)
    const challengesStr = selectedChallenges.join(', ')
    const finalMessage = text
      ? (challengesStr ? `${challengesStr}. Details: ${text}` : text)
      : challengesStr
    setFormData(prev => ({ ...prev, message: finalMessage }))
  }

  const handleStep1 = (e) => {
    e.preventDefault()
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return
    setLoading(true)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    const offset = selectedDate.getTimezoneOffset()
    const formattedDate = new Date(selectedDate.getTime() - (offset*60*1000)).toISOString().split('T')[0]

    try {
      const res = await fetch(`${API_URL}/api/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          booking_date: formattedDate,
          booking_time: selectedTime,
        }),
      })
      if (res.ok) {
        setStep(3)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const err = await res.json()
        alert(`Failed to book demo: ${err.detail || 'Server error'}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to connect to the backend server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', color: c.text }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cn-demo-input {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cn-demo-input:focus {
          border-color: var(--g) !important;
          box-shadow: 0 0 0 2.5px var(--gpale) !important;
        }
        .cn-demo-btn {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cn-demo-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }
        .cn-demo-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cn-demo-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-strong) !important;
        }
        .cn-scheduler-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 2.2rem;
          align-items: start;
        }
        .cn-secondary-btn {
          transition: all 0.2s ease-in-out;
        }
        .cn-secondary-btn:hover {
          border-color: var(--g) !important;
          color: var(--dark) !important;
          background-color: var(--bg2) !important;
        }
        @media (max-width: 768px) {
          .cn-scheduler-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }
      `}</style>

      <Navbar />

      {step === 3 ? (
        /* ── CONFIRMED ────────────────────────────────────────────────────── */
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
          <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: c.green, marginBottom: '.6rem' }}>You're all set</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.4rem', fontWeight: 500, color: c.dark, marginBottom: '1rem', letterSpacing: '-.3px' }}>Demo booked!</h1>
          <p style={{ fontSize: '.95rem', color: c.muted, lineHeight: 1.8, fontWeight: 300, marginBottom: '2.5rem' }}>
            We've sent a calendar invite to <strong style={{ color: c.dark }}>{formData.email}</strong>.<br/>
            Your 30-minute demo is confirmed for:
          </p>

          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Date', value: formatDate(selectedDate) },
                { label: 'Time', value: selectedTime },
                { label: 'Timezone', value: formData.timezone.split(' ')[0] },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: c.muted, marginBottom: '.4rem', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '.95rem', fontWeight: 600, color: c.dark }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: c.greenPale, border: `1px solid #BBF7D0`, borderRadius: 12, padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.8rem' }}>Before the demo</p>
            {['Check your email for the calendar invite and video call link', 'Have your Shopify store URL ready (or think of a name for your new storefront)', 'Think about your biggest growth goal right now'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontSize: '.84rem', color: '#166534', fontWeight: 300, lineHeight: 1.6, marginBottom: '.4rem' }}>
                <span style={{ fontWeight: 700, marginTop: '.05rem' }}>✓</span> {item}
              </div>
            ))}
          </div>

          <Link to="/" className="cn-demo-btn" style={{ display: 'inline-block', padding: '.8rem 2rem', background: c.green, color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '.9rem', textDecoration: 'none' }}>
            Return to Homepage
          </Link>
        </div>

) : (
        <div>
          {/* HERO */}
          <div style={{ background: 'var(--bg)', paddingTop: '5.2rem', paddingBottom: '1.2rem' }}>
            <div className="site-page-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Center Column: Hero text and progress indicator */}
                <div style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                    <div style={{ maxWidth: '760px', width: '100%', margin: '0 auto' }}>
                      <p style={{ fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.14em', color: c.green, marginBottom: '.5rem' }}>
                        {step === 1 ? 'Free, 30-Minute Session' : 'Pick a Slot'}
                      </p>
                      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.3rem, 2.8vw, 2.1rem)', fontWeight: 500, color: c.dark, letterSpacing: '-.3px', marginBottom: '0.8rem', lineHeight: 1.1 }}>
                        {step === 1 ? 'See Selora grow your fashion store — live' : 'Choose your demo slot'}
                      </h1>
                      <div style={{ fontSize: '.95rem', color: c.muted, fontWeight: 300, lineHeight: 1.65 }}>
                        {step === 1 ? (
                          <div>
                            In 30 minutes, you'll see exactly how Selora would grow your specific store. No generic slides — a live walkthrough tailored to your collection.
                            <div style={{ fontSize: '.82rem', color: 'var(--g)', fontWeight: 600, marginTop: '.5rem' }}>
                              Already selling somewhere, or starting fresh? Either way, we'll show you exactly how Selora fits your store.
                            </div>
                          </div>
                        ) : (
                          `Selecting a slot for ${formData.firstName ? formData.firstName + ' · ' : ''}${formData.email}`
                        )}
                      </div>
                    </div>
                  </div>
 
                  {/* Step progress indicator line */}
                  <div style={{ position: 'relative', maxWidth: '380px', margin: '0 auto' }}>
                    {/* Progress track line */}
                    <div style={{ position: 'absolute', top: '11px', left: '20px', right: '20px', height: '2px', background: 'var(--border)', zIndex: 1 }} />
                    {/* Animated fill line */}
                    <div style={{ 
                      position: 'absolute', top: '11px', left: '20px', 
                      width: step === 1 ? '0%' : '100%', 
                      height: '2px', background: 'var(--g)', zIndex: 2,
                      transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />
 
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
                      {[
                        { label: 'Your Details', num: 1 },
                        { label: 'Choose Slot', num: 2 },
                      ].map((item, i) => {
                        const isActive = step >= item.num
                        const isCurrent = step === item.num
                        return (
                          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', width: '90px' }}>
                            <div style={{ 
                              width: 22, height: 22, borderRadius: '50%', 
                              background: isActive ? 'var(--g)' : 'var(--card-bg)', 
                              border: `2px solid ${isActive ? 'var(--g)' : 'var(--border)'}`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              fontSize: '.65rem', color: isActive ? '#fff' : 'var(--muted)', 
                              fontWeight: 700, transition: 'all .3s' 
                            }}>
                              {step > item.num ? '✓' : item.num}
                            </div>
                            <span style={{ 
                              fontSize: '.7rem', 
                              color: isCurrent ? 'var(--dark)' : 'var(--muted)', 
                              fontWeight: isCurrent ? 600 : 400,
                              whiteSpace: 'nowrap',
                              transition: 'color .3s'
                            }}>
                              {item.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT BODY */}
          <div className="site-page-container" style={{ paddingTop: '1.5rem', paddingBottom: '6rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1.1fr 0.9fr' : '1fr', gap: '3rem', alignItems: 'start' }}>

            {step === 1 ? (
              <>
                {/* LEFT: DETAILS FORM */}
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderTop: '4px solid var(--g)', borderRadius: 16, padding: '3.2rem', boxShadow: '0 20px 48px rgba(90, 138, 103, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.8rem' }}>
                    <span style={{ width: '6px', height: '18px', background: 'var(--g)', borderRadius: '3px', display: 'inline-block' }}></span>
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.45rem', fontWeight: 500, color: c.dark, margin: 0, textAlign: 'left' }}>Tell us about your store</h2>
                  </div>
                  <form onSubmit={handleStep1}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                      <Field label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                      <Field label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <Field label="Work Email" name="email" type="email" value={formData.email} onChange={handleChange} required style={{ marginBottom: '1.5rem' }} />
                    <Field label="Store URL (Optional)" name="storeUrl" placeholder="your-store.myshopify.com" value={formData.storeUrl} onChange={handleChange} style={{ marginBottom: '1.5rem' }} />

                    {/* Platform Selection Chips */}
                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>E-Commerce Platform</label>
                        {formData.platform && (
                          <span style={{ fontSize: '.78rem', color: 'var(--g)', fontWeight: 700, animation: 'fadeUp 0.2s ease both' }}>✓</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.6rem', marginTop: '.3rem' }}>
                        {[
                          { id: 'Shopify', label: 'Shopify' },
                          { id: 'WooCommerce', label: 'WooCommerce' },
                          { id: 'Amazon', label: 'Amazon' },
                          { id: 'Etsy', label: 'Etsy' },
                          { id: 'Selora Store', label: 'Selora Store' },
                          { id: 'Other', label: 'Other' }
                        ].map(p => {
                          const isSelected = formData.platform === p.id
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, platform: p.id }))}
                              style={{
                                padding: '.8rem .5rem',
                                borderRadius: 8,
                                border: `1px solid ${isSelected ? 'var(--g)' : 'var(--border)'}`,
                                background: isSelected ? 'var(--gpale)' : 'var(--card-bg)',
                                color: 'var(--dark)',
                                fontSize: '.82rem',
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                fontFamily: 'Inter,sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              className="cn-demo-btn"
                            >
                              {p.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Monthly Revenue select */}
                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Monthly Revenue</label>
                        {formData.teamSize && (
                          <span style={{ fontSize: '.78rem', color: 'var(--g)', fontWeight: 700, animation: 'fadeUp 0.2s ease both' }}>✓</span>
                        )}
                      </div>
                      <select name="teamSize" value={formData.teamSize} onChange={handleChange} style={{ ...inputStyle, color: formData.teamSize ? c.dark : c.muted }} className="cn-demo-input" required>
                        <option value="" disabled>Select range</option>
                        <option>Under $1,000/mo</option>
                        <option>$1,000 – $5,000/mo</option>
                        <option>$5,000 – $20,000/mo</option>
                        <option>$20,000 – $100,000/mo</option>
                        <option>$100,000+/mo</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                      <label style={labelStyle}>Timezone</label>
                      <select name="timezone" value={formData.timezone} onChange={handleChange} style={inputStyle} className="cn-demo-input">
                        {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>

                    {/* Challenge Chips */}
                    <div style={{ marginBottom: '1.8rem', textAlign: 'left' }}>
                      <label style={labelStyle}>What do you want help with?</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem', marginBottom: '.6rem' }}>
                        {[
                          'More Sales', 'SEO', 'Pricing', 'Ads', 'Inventory', 'Conversion', 'Other'
                        ].map(ch => {
                          const isSelected = selectedChallenges.includes(ch)
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => handleChallengeToggle(ch)}
                              style={{
                                padding: '.55rem 1rem',
                                borderRadius: 20,
                                border: `1px solid ${isSelected ? 'var(--g)' : 'var(--border)'}`,
                                background: isSelected ? 'var(--gpale)' : 'var(--card-bg)',
                                color: 'var(--dark)',
                                fontSize: '.82rem',
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                fontFamily: 'Inter,sans-serif'
                              }}
                              className="cn-demo-btn"
                            >
                              {ch}
                            </button>
                          )
                        })}
                      </div>

                      {selectedChallenges.includes('Other') && (
                        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
                          <label style={{ ...labelStyle, textTransform: 'none', fontSize: '.74rem', marginTop: '.7rem' }}>Please specify details</label>
                          <textarea
                             value={otherText}
                             onChange={handleOtherTextChange}
                             placeholder="e.g. My products aren't selling well despite high traffic..."
                             style={{ ...inputStyle, height: 90, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                             className="cn-demo-input"
                          />
                        </div>
                      )}
                    </div>

                    {/* Time Slot Select Notice */}
                    <div style={{ 
                      background: 'var(--bg2)', 
                      border: `1px solid var(--border)`, 
                      borderRadius: 10, 
                      padding: '1.2rem 1.4rem', 
                      fontSize: '.86rem', 
                      color: 'var(--muted)',
                      display: 'flex',
                      gap: '.6rem',
                      alignItems: 'flex-start',
                      marginBottom: '1.8rem',
                      textAlign: 'left'
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '-2px' }}>📅</span>
                      <div style={{ lineHeight: 1.5, fontWeight: 300 }}>
                        Demos are <strong style={{ color: 'var(--dark)' }}>30 minutes</strong> long. On the next step, you can select any open time slot that works for you this week in your local timezone.
                      </div>
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '1.05rem', background: c.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '.02em', boxShadow: '0 4px 18px rgba(90,138,103,.2)' }} className="cn-demo-btn">
                      Choose My Demo Time →
                    </button>
                  </form>
                </div>

                {/* RIGHT: WHAT YOU GET (Sticky Sidebar) */}
                <div style={{ position: 'sticky', top: '6.5rem' }}>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.45rem', fontWeight: 500, color: c.dark, marginBottom: '1.8rem', textAlign: 'left' }}>What you'll get in 30 minutes</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.2rem' }}>
                    {WHAT_YOU_GET.map((item, i) => {
                       const isMonitor = item.iconType === 'monitor'
                       return (
                         <div key={i} className="cn-demo-card" style={{ display: 'flex', flexDirection: 'column', background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.6rem 1.8rem', gap: '1rem' }}>
                           <div style={{ display: 'flex', gap: '1.2rem' }}>
                             <div style={{ 
                               width: 44, height: 44, borderRadius: '50%', background: c.greenPale,
                               display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                             }}>
                               {iconMap[item.iconType]}
                             </div>
                             <div>
                               <div style={{ fontSize: '.95rem', fontWeight: 600, color: c.dark, marginBottom: '.4rem', textAlign: 'left' }}>{item.title}</div>
                               <div style={{ fontSize: '.86rem', color: c.muted, lineHeight: 1.6, fontWeight: 300, textAlign: 'left' }}>{item.desc}</div>
                             </div>
                           </div>

                           {/* Mini Dashboard Preview for Live Agent Demonstration */}
                           {isMonitor && (
                             <div style={{ 
                               background: 'var(--bg2)', border: `1px solid ${c.border}`, borderRadius: 8,
                               padding: '.8rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem',
                               fontSize: '.72rem', fontFamily: 'Inter,sans-serif', textAlign: 'left',
                               animation: 'fadeUp 0.4s ease both', color: 'var(--dark)'
                             }}>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'var(--muted)', fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 500 }}>Revenue</span>
                                 <span style={{ color: 'var(--g)', fontWeight: 600 }}>↑ trending up</span>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'var(--muted)', fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 500 }}>Listings optimized</span>
                                 <span style={{ color: 'var(--dark)', fontWeight: 600 }}>active this week</span>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'var(--muted)', fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 500 }}>Inventory Alerts</span>
                                 <span style={{ color: 'var(--dark)', fontWeight: 600 }}>scanning active</span>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'var(--muted)', fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 500 }}>Price adjustments</span>
                                 <span style={{ color: 'var(--g)', fontWeight: 600 }}>enabled</span>
                               </div>
                             </div>
                           )}
                         </div>
                       )
                     })}
                  </div>

                  {/* Demo Host Card */}
                  <div className="cn-demo-card" style={{ 
                    background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
                    padding: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'center'
                  }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: '50%', background: c.greenPale, color: c.green,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <UserIcon size={22} color="var(--g)" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: c.muted, marginBottom: '.2rem' }}>Your Demo Host</div>
                      <div style={{ fontSize: '.96rem', fontWeight: 600, color: c.dark }}>Sachita</div>
                      <div style={{ fontSize: '.78rem', color: c.muted, fontWeight: 300 }}>Founder of Selora · 30-minute personalized session</div>
                    </div>
                  </div>

                  {/* Trust Box Notice */}
                  <div style={{ 
                    background: c.greenPale, border: `1px solid #BBF7D0`, borderRadius: 12, 
                    padding: '1.2rem 1.4rem', marginTop: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start'
                  }}>
                    <div style={{ color: c.green, marginTop: '2px' }}>
                      <LockIcon size={18} color="var(--g)" />
                    </div>
                    <div style={{ textAlign: 'left', fontSize: '.84rem', color: '#166534', lineHeight: 1.55 }}>
                      <div style={{ fontWeight: 600, marginBottom: '.4rem' }}>Our Demo Commitment:</div>
                      <div style={{ fontWeight: 300 }}>
                        • Your information is never shared.<br />
                        • No sales pressure.<br />
                        • No contracts.<br />
                        • Just a personalized growth strategy.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ── STEP 2: TIME SLOT ──────────────────────────────────── */
              <div className="cn-scheduler-grid" style={{ animation: 'fadeUp 0.35s ease both' }}>
                {/* Date Picker */}
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.5rem' }}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 500, color: c.dark, marginBottom: '1.5rem', textAlign: 'left' }}>Select a date</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                    {getDates().map((date, i) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString()
                      return (
                        <button key={i} onClick={() => { setSelectedDate(date); setSelectedTime(null) }}
                          style={{ padding: '1rem 1.4rem', background: isSelected ? c.green : c.bg2, color: isSelected ? '#fff' : c.dark, border: `1px solid ${isSelected ? c.green : c.border}`, borderRadius: 10, fontSize: '.92rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left', fontWeight: isSelected ? 600 : 400, transition: 'all .2s' }}
                          className="cn-demo-btn"
                        >
                          {formatDate(date)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Picker + Summary Column */}
                <div>
                  {/* Time Picker */}
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.5rem', marginBottom: '1.8rem' }}>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 500, color: c.dark, marginBottom: '1.5rem', textAlign: 'left' }}>
                      {selectedDate ? `Times for ${formatDate(selectedDate)}` : 'Select a date first'}
                    </h3>
                    {selectedDate ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                        {TIME_SLOTS.map(time => {
                          const isSelected = selectedTime === time
                          return (
                            <button key={time} onClick={() => setSelectedTime(time)}
                              style={{ padding: '.8rem 1.1rem', background: isSelected ? c.green : c.bg2, color: isSelected ? '#fff' : c.dark, border: `1px solid ${isSelected ? c.green : c.border}`, borderRadius: 8, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: isSelected ? 600 : 400, transition: 'all .2s' }}
                              className="cn-demo-btn"
                            >
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '.9rem', color: c.muted, fontWeight: 300, textAlign: 'center', padding: '2.5rem 0' }}>← Pick a date to see available times</p>
                    )}
                  </div>

                  {/* Summary box */}
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.2rem' }}>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 500, color: c.dark, marginBottom: '1.2rem', textAlign: 'left' }}>Your booking summary</h3>
                    {[
                      ['Name', `${formData.firstName} ${formData.lastName}`.trim() || '—'],
                      ['Email', formData.email || '—'],
                      ['Platform', formData.platform || '—'],
                      ['Date', selectedDate ? formatDate(selectedDate) : '—'],
                      ['Time', selectedTime || '—'],
                      ['Timezone', formData.timezone.split(' ')[0]],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.7rem', borderBottom: `1px solid ${c.border}`, paddingBottom: '.7rem' }}>
                        <span style={{ fontSize: '.84rem', color: c.muted }}>{label}</span>
                        <span style={{ fontSize: '.84rem', color: c.dark, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}

                    <button onClick={handleConfirm} disabled={!selectedDate || !selectedTime || loading}
                      style={{ width: '100%', marginTop: '1rem', padding: '1.05rem', background: selectedDate && selectedTime ? c.green : c.border, color: selectedDate && selectedTime ? '#fff' : c.muted, border: 'none', borderRadius: 8, fontSize: '.95rem', fontWeight: 700, cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'all .2s' }}
                      className="cn-demo-btn"
                    >
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                          <span className="spin-spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                          Confirming...
                        </div>
                      ) : 'Confirm Demo →'}
                    </button>

                    <button 
                      onClick={() => setStep(1)} 
                      style={{ 
                        width: '100%', 
                        marginTop: '.8rem', 
                        padding: '.65rem', 
                        background: 'transparent', 
                        color: 'var(--muted)', 
                        border: '1px solid var(--border-strong)', 
                        borderRadius: 8, 
                        fontSize: '.82rem', 
                        fontWeight: 500, 
                        cursor: 'pointer', 
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.2s'
                      }}
                      className="cn-secondary-btn"
                    >
                      ← Edit details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <Footer />

    </div>
  )
}

// ─── Field Helper Component ──────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '.78rem', fontWeight: 600,
  color: 'var(--text)', marginBottom: '.5rem', letterSpacing: '.05em', textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%', padding: '.9rem 1.1rem', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: '.92rem', color: 'var(--text-primary)',
  fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--input-bg)',
  boxSizing: 'border-box', transition: 'border .2s',
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required, style }) {
  const isValid = required ? (value && value.trim().length > 0 && (type !== 'email' || value.includes('@'))) : true
  return (
    <div style={style} className="cn-demo-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
        {required && value && isValid && (
          <span style={{ fontSize: '.75rem', color: 'var(--g)', fontWeight: 700, animation: 'fadeUp 0.2s ease both' }}>✓</span>
        )}
      </div>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={inputStyle}
        className="cn-demo-input"
      />
    </div>
  )
}
