import { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = {
  green: '#5A8A67', green2: '#78A885', greenPale: '#EDF3EE',
  dark: '#1A271C', text: '#2E3D30', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
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
  { icon: '🎯', title: 'Personalized walkthrough', desc: 'We tailor the demo around your store, products, and growth goals — not a generic slideshow.' },
  { icon: '🤖', title: 'Live agent demonstration', desc: 'Watch Selora analyze a real fashion store in real time and show you exactly what it would do.' },
  { icon: '💡', title: 'Your questions answered', desc: 'Get direct answers from the team on pricing, integrations, limitations, and timelines.' },
  { icon: '🚀', title: 'Onboarding roadmap', desc: 'Walk away with a clear plan for getting your store set up and growing within 48 hours.' },
]

const TESTIMONIALS = [
  { q: 'The demo was the most useful 30 minutes I spent all month. I left knowing exactly how it would work for my boutique.', name: 'Priya M.', role: 'Boutique Owner' },
  { q: 'No fluff, no pressure. They showed me a live store optimization and I signed up the same day.', name: 'Sarah R.', role: 'Fashion Brand Founder' },
]

export default function BookDemo() {
  const [step, setStep] = useState(1) // 1 = form, 2 = time slot, 3 = confirmed
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', storeUrl: '',
    platform: '', teamSize: '', timezone: TIMEZONES[0], message: '',
  })
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

  const handleStep1 = (e) => {
    e.preventDefault()
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 1400)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', color: c.text }}>

      {/* NAV */}
      <nav style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '1rem 3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 700, color: c.dark, textDecoration: 'none' }}>
          Se<span style={{ color: c.green }}>lo</span>ra
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/support" style={{ fontSize: '.82rem', color: c.muted, textDecoration: 'none' }}>Support</Link>
          <Link to="/login" style={{ fontSize: '.82rem', background: c.green, color: '#fff', padding: '.45rem 1.1rem', borderRadius: 7, textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>
      </nav>

      {step === 3 ? (
        /* ── CONFIRMED ────────────────────────────────────────────────────── */
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
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
            {['Check your email for the calendar invite and video call link', 'Have your Shopify store URL ready', 'Think about your biggest growth goal right now'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontSize: '.84rem', color: '#166534', fontWeight: 300, lineHeight: 1.6, marginBottom: '.4rem' }}>
                <span style={{ fontWeight: 700, marginTop: '.05rem' }}>✓</span> {item}
              </div>
            ))}
          </div>

          <Link to="/" style={{ display: 'inline-block', padding: '.8rem 2rem', background: c.green, color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '.9rem', textDecoration: 'none' }}>
            Return to Homepage
          </Link>
        </div>

      ) : (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem 6rem' }}>

          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.14em', color: c.green, marginBottom: '.6rem' }}>
              {step === 1 ? 'Free, 30-Minute Session' : 'Pick a Time'}
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: c.dark, letterSpacing: '-.4px', marginBottom: '1rem' }}>
              {step === 1 ? 'See Selora grow your fashion store — live' : 'Choose your demo slot'}
            </h1>
            <p style={{ fontSize: '.95rem', color: c.muted, fontWeight: 300, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
              {step === 1
                ? "In 30 minutes, you'll see exactly how Selora would grow your specific store. No generic slides — a live walkthrough tailored to your collection."
                : `Selecting a time for ${formData.firstName ? formData.firstName + ' · ' : ''}${formData.email}`
              }
            </p>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginTop: '2rem' }}>
              {['Your details', 'Choose a time', 'Confirmed'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: step > i + 1 ? c.green : step === i + 1 ? c.green : c.border, border: `2px solid ${step >= i + 1 ? c.green : c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: step >= i + 1 ? '#fff' : c.muted, fontWeight: 700, transition: 'all .3s' }}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '.72rem', color: step === i + 1 ? c.dark : c.muted, fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ width: 32, height: 1, background: step > i + 1 ? c.green : c.border, transition: 'all .3s' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1fr 1fr' : '1fr', gap: '3rem', alignItems: 'start' }}>

            {step === 1 ? (
              <>
                {/* LEFT: DETAILS FORM */}
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.5rem' }}>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 500, color: c.dark, marginBottom: '1.8rem' }}>Tell us about your store</h2>
                  <form onSubmit={handleStep1}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <Field label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                      <Field label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <Field label="Work Email" name="email" type="email" value={formData.email} onChange={handleChange} required style={{ marginBottom: '1rem' }} />
                    <Field label="Store URL" name="storeUrl" placeholder="your-store.myshopify.com" value={formData.storeUrl} onChange={handleChange} style={{ marginBottom: '1rem' }} />

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Platform</label>
                      <select name="platform" value={formData.platform} onChange={handleChange} style={{ ...inputStyle, color: formData.platform ? c.dark : c.muted }} required>
                        <option value="" disabled>Select your platform</option>
                        <option>Shopify</option>
                        <option>Amazon</option>
                        <option>Both Shopify & Amazon</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Monthly Revenue</label>
                      <select name="teamSize" value={formData.teamSize} onChange={handleChange} style={{ ...inputStyle, color: formData.teamSize ? c.dark : c.muted }}>
                        <option value="" disabled>Select range</option>
                        <option>Under $1,000/mo</option>
                        <option>$1,000 – $5,000/mo</option>
                        <option>$5,000 – $20,000/mo</option>
                        <option>$20,000 – $100,000/mo</option>
                        <option>$100,000+/mo</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Timezone</label>
                      <select name="timezone" value={formData.timezone} onChange={handleChange} style={inputStyle}>
                        {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={labelStyle}>What's your biggest challenge right now? (Optional)</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="e.g. My products aren't selling well despite high traffic..."
                        style={{ ...inputStyle, height: 90, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                      />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '.9rem', background: c.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '.02em' }}>
                      Next — Pick a Time →
                    </button>
                  </form>
                </div>

                {/* RIGHT: WHAT YOU GET */}
                <div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 500, color: c.dark, marginBottom: '1.5rem' }}>What you'll get in 30 minutes</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                    {WHAT_YOU_GET.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '1rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem' }}>
                        <div style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark, marginBottom: '.3rem' }}>{item.title}</div>
                          <div style={{ fontSize: '.8rem', color: c.muted, lineHeight: 1.6, fontWeight: 300 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Social proof */}
                  <div>
                    <p style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: c.muted, marginBottom: '1rem' }}>From previous demos</p>
                    {TESTIMONIALS.map((t, i) => (
                      <div key={i} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem', marginBottom: '.8rem' }}>
                        <div style={{ color: c.green, fontSize: '.7rem', letterSpacing: 2, marginBottom: '.5rem' }}>★★★★★</div>
                        <p style={{ fontSize: '.8rem', color: c.muted, lineHeight: 1.75, fontStyle: 'italic', fontFamily: 'Fraunces, serif', marginBottom: '.7rem' }}>"{t.q}"</p>
                        <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.dark }}>{t.name}</div>
                        <div style={{ fontSize: '.68rem', color: c.muted }}>{t.role}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: c.greenPale, borderRadius: 12, padding: '1.2rem', marginTop: '1.2rem', display: 'flex', gap: '.8rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.3rem' }}>🔒</span>
                    <p style={{ fontSize: '.8rem', color: c.green, fontWeight: 300, lineHeight: 1.6 }}>
                      No commitment required. This is a free, no-pressure conversation — just us showing you what's possible for your store.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ── STEP 2: TIME SLOT ──────────────────────────────────── */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Date Picker */}
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2rem' }}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: c.dark, marginBottom: '1.2rem' }}>Select a date</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {getDates().map((date, i) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString()
                      return (
                        <button key={i} onClick={() => { setSelectedDate(date); setSelectedTime(null) }}
                          style={{ padding: '.85rem 1.2rem', background: isSelected ? c.green : c.bg2, color: isSelected ? '#fff' : c.dark, border: `1px solid ${isSelected ? c.green : c.border}`, borderRadius: 10, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left', fontWeight: isSelected ? 600 : 400, transition: 'all .2s' }}>
                          {formatDate(date)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Picker + Summary */}
                <div>
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: c.dark, marginBottom: '1.2rem' }}>
                      {selectedDate ? `Times for ${formatDate(selectedDate)}` : 'Select a date first'}
                    </h3>
                    {selectedDate ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                        {TIME_SLOTS.map(time => {
                          const isSelected = selectedTime === time
                          return (
                            <button key={time} onClick={() => setSelectedTime(time)}
                              style={{ padding: '.7rem', background: isSelected ? c.green : c.bg2, color: isSelected ? '#fff' : c.dark, border: `1px solid ${isSelected ? c.green : c.border}`, borderRadius: 8, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: isSelected ? 600 : 400, transition: 'all .2s' }}>
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '.85rem', color: c.muted, fontWeight: 300, textAlign: 'center', padding: '2rem 0' }}>← Pick a date to see available times</p>
                    )}
                  </div>

                  {/* Summary box */}
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '1.8rem' }}>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 500, color: c.dark, marginBottom: '1rem' }}>Your booking summary</h3>
                    {[
                      ['Name', `${formData.firstName} ${formData.lastName}`.trim() || '—'],
                      ['Email', formData.email || '—'],
                      ['Platform', formData.platform || '—'],
                      ['Date', selectedDate ? formatDate(selectedDate) : '—'],
                      ['Time', selectedTime || '—'],
                      ['Timezone', formData.timezone.split(' ')[0]],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', borderBottom: `1px solid ${c.border}`, paddingBottom: '.6rem' }}>
                        <span style={{ fontSize: '.78rem', color: c.muted }}>{label}</span>
                        <span style={{ fontSize: '.78rem', color: c.dark, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}

                    <button onClick={handleConfirm} disabled={!selectedDate || !selectedTime || loading}
                      style={{ width: '100%', marginTop: '.8rem', padding: '.9rem', background: selectedDate && selectedTime ? c.green : c.border, color: selectedDate && selectedTime ? '#fff' : c.muted, border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 700, cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'all .2s' }}>
                      {loading ? 'Confirming...' : 'Confirm Demo →'}
                    </button>

                    <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '.6rem', padding: '.7rem', background: 'transparent', color: c.muted, border: 'none', fontSize: '.82rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      ← Edit details
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '1.8rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.card, flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '.95rem', fontWeight: 700, color: c.dark }}>Se<span style={{ color: c.green }}>lo</span>ra</div>
        <div style={{ display: 'flex', gap: '1.8rem', flexWrap: 'wrap' }}>
          {[{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Support', href: '/support' }].map(l => (
            <Link key={l.label} to={l.href} style={{ fontSize: '.74rem', color: c.muted, textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
        <div style={{ fontSize: '.7rem', color: '#c0c8c1' }}>© 2025 Selora. All rights reserved.</div>
      </footer>

    </div>
  )
}

// ─── Field helper ────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '.72rem', fontWeight: 600,
  color: '#2E3D30', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase',
}
const inputStyle = {
  width: '100%', padding: '.78rem 1rem', border: '1px solid #E4EBE5',
  borderRadius: 8, fontSize: '.88rem', color: '#1A271C',
  fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8',
  boxSizing: 'border-box', transition: 'border .2s',
}
function Field({ label, name, type = 'text', value, onChange, placeholder, required, style }) {
  return (
    <div style={style}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={inputStyle}
      />
    </div>
  )
}
