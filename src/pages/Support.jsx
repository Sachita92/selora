import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import Footer from '../components/Footer'

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = {
  green: 'var(--g)', dark: 'var(--dark)', muted: 'var(--muted)',
  border: 'var(--border)', bg: 'var(--bg)', bg2: 'var(--bg2)', card: 'var(--card-bg)',
}

const s = {
  page:    { minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', color: 'var(--text)' },
  nav:     { background: 'var(--nav-bg)', borderBottom: `1px solid var(--border)`, padding: '1rem 3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(14px)' },
  logo:    { fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', textDecoration: 'none', fontFamily: 'Inter, sans-serif' },
  container: { width: '100%', maxWidth: 1280, margin: '0 auto', padding: '4rem 1.5rem 6rem', boxSizing: 'border-box' },
  header:  { textAlign: 'center', marginBottom: '4rem' },
  tag:     { fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.14em', color: c.green, marginBottom: '.6rem' },
  title:   { fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: 'var(--dark)', letterSpacing: '-.4px', marginBottom: '1rem' },
  sub:     { fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 300, maxWidth: 540, margin: '0 auto', lineHeight: 1.6 },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.5rem', boxShadow: 'none' },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, color: 'var(--dark)', marginBottom: '1.5rem' },
  formGroup: { marginBottom: '1.2rem' },
  label:   { display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase' },
  input:   { width: '100%', padding: '.8rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.9rem', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', transition: 'all .2s' },
  textarea: { width: '100%', padding: '.8rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.9rem', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--input-bg)', boxSizing: 'border-box', height: 120, resize: 'vertical', transition: 'all .2s' },
  btn:     { width: '100%', padding: '.85rem', background: c.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s', marginTop: '.5rem' },
  channels: { display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' },
  channelItem: { display: 'flex', gap: '1rem', background: c.bg2, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem' },
  channelIcon: { fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  channelText: { fontSize: '.85rem', lineHeight: 1.6, fontWeight: 300, color: 'var(--text-secondary)' },
  faqItem: { borderBottom: `1px solid ${c.border}`, padding: '1.2rem 0' },
  faqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  faqTitle: { fontSize: '.95rem', fontWeight: 500, color: 'var(--dark)' },
  faqBody: { fontSize: '.86rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 300, marginTop: '.8rem', transition: 'all .2s' },
  successBox: { background: 'var(--gpale)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '2rem', textAlign: 'center', color: 'var(--g)' },
}

export default function Support() {
  const [darkMode, toggleTheme] = useDarkMode()
  const [formData, setFormData] = useState({ name: '', email: '', storeUrl: '', subject: '', message: '' })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setIsSubmitted(true)
      } else {
        const err = await res.json()
        alert(`Failed to send message: ${err.detail || 'Server error'}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to connect to the backend server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleFaq = (index) => {
    setExpandedFaq(prev => (prev === index ? null : index))
  }

  const FAQS = [
    {
      q: "How does the Selora AI agent optimize my store?",
      a: "Selora connects via API to inspect products and orders. It analyzes sales velocity, inventory counts, and copywriting quality. It automatically adjusts pricing (within bounds you configure) and updates titles and descriptions to include fit, occasion, and styling details. At the end of every cycle, it writes a detailed report highlighting wins and recommendations."
    },
    {
      q: "Is my customer data safe?",
      a: "Yes. Selora never requests, stores, or accesses individual customer personal data (PII) like names, email addresses, or phone numbers. We filter the API endpoints to load only order metrics and item data, ensuring maximum security and compliance."
    },
    {
      q: "Can I run the agent in test mode?",
      a: "Absolutely. By default, you can run the agent in 'Dry Run' mode. The AI will analyze your store and generate growth reports containing wins and concerns, but it will not push any live changes until you turn live actions on."
    },
    {
      q: "Which e-commerce platforms are supported?",
      a: "Shopify is currently fully supported. We are in the process of getting SP-API approval for Amazon integration, which will be added as a platform option as soon as it is approved."
    }
  ]

  return (
    <div className="landing-page" style={s.page}>
      
      {/* NAV */}
      <nav style={s.nav}>
        <Link to="/" style={s.logo}>
          Se<span style={{ color: 'var(--g)' }}>lo</span>ra
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
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
          <Link to="/dashboard" className="cn-nav-link" style={{ fontSize: '.82rem', color: 'var(--nav-link)', textDecoration: 'none' }}>
            ← Go to Dashboard
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={s.container}>
        
        {/* HEADER */}
        <div style={s.header}>
          <p style={s.tag}>Help & Support</p>
          <h1 style={s.title}>Get in Touch</h1>
          <p style={s.sub}>
            Have questions about connecting your store, configuring optimization rules, or managing your account? We're here to help.
          </p>
        </div>

        {/* GRID */}
        <div style={s.grid}>
          
          {/* LEFT: INFO & FAQS */}
          <div>
            <div style={s.channels}>
              <div style={s.channelItem}>
                <div style={s.channelIcon}>✉️</div>
                <div style={s.channelText}>
                  <strong style={{ color: c.dark }}>Email Support</strong><br />
                  Send us an email at <a href="mailto:support@selora.com" style={{ color: c.green, textDecoration: 'none', fontWeight: 500 }}>support@selora.com</a>. We typically reply within 12–24 hours.
                </div>
              </div>

              <div style={s.channelItem}>
                <div style={s.channelIcon}>⏰</div>
                <div style={s.channelText}>
                  <strong style={{ color: c.dark }}>Support Hours</strong><br />
                  Our team is active Monday through Friday, 9:00 AM to 6:00 PM (NPT). We monitor critical system alerts 24/7.
                </div>
              </div>
            </div>

            <div style={{ ...s.cardTitle, marginBottom: '0.8rem' }}>Frequently Asked Questions</div>
            <div style={{ marginBottom: '2rem' }}>
              {FAQS.map((faq, index) => (
                <div key={index} style={s.faqItem}>
                  <div style={s.faqHeader} onClick={() => toggleFaq(index)}>
                    <span style={s.faqTitle}>{faq.q}</span>
                    <span style={{ fontSize: '.8rem', color: c.muted }}>
                      {expandedFaq === index ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedFaq === index && (
                    <div style={s.faqBody}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: CONTACT FORM */}
          <div style={s.card}>
            {isSubmitted ? (
              <div style={s.successBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, marginBottom: '.5rem', color: '#166534' }}>
                  Support Ticket Received
                </h2>
                <p style={{ fontSize: '.88rem', lineHeight: 1.6, fontWeight: 300, color: '#166534', marginBottom: '1.5rem' }}>
                  Thank you for reaching out! A member of our support team will review your message and get back to you shortly.
                </p>
                <button 
                  style={{ ...s.btn, background: '#166534' }} 
                  onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', storeUrl: '', subject: '', message: '' }) }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={s.cardTitle}>Send a Message</h2>
                
                <div style={s.formGroup}>
                  <label style={s.label}>Your Name</label>
                  <input
                    style={s.input}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={s.input}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Shop URL (Optional)</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="your-store-name"
                    name="storeUrl"
                    value={formData.storeUrl}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Subject</label>
                  <input
                    style={s.input}
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Message</label>
                  <textarea
                    style={s.textarea}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? 'Sending Message...' : 'Submit Support Ticket'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      <Footer />

    </div>
  )
}
