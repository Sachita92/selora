import { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = {
  green: '#5A8A67', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const s = {
  page:    { minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', color: '#2E3D30' },
  nav:     { background: c.card, borderBottom: `1px solid ${c.border}`, padding: '1rem 3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:    { fontSize: '1.2rem', fontWeight: 700, color: c.dark, textDecoration: 'none', fontFamily: 'Inter, sans-serif' },
  container: { maxWidth: 960, margin: '0 auto', padding: '4rem 2rem 6rem' },
  header:  { textAlign: 'center', marginBottom: '4rem' },
  tag:     { fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.14em', color: c.green, marginBottom: '.6rem' },
  title:   { fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: c.dark, letterSpacing: '-.4px', marginBottom: '1rem' },
  sub:     { fontSize: '1rem', color: c.muted, fontWeight: 300, maxWidth: 540, margin: '0 auto', lineHeight: 1.6 },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 20px rgba(90, 138, 103, 0.02)' },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, color: c.dark, marginBottom: '1.5rem' },
  formGroup: { marginBottom: '1.2rem' },
  label:   { display: 'block', fontSize: '.75rem', fontWeight: 600, color: '#2E3D30', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase' },
  input:   { width: '100%', padding: '.8rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.9rem', color: c.dark, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8', boxSizing: 'border-box', transition: 'all .2s' },
  textarea: { width: '100%', padding: '.8rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.9rem', color: c.dark, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8', boxSizing: 'border-box', height: 120, resize: 'vertical', transition: 'all .2s' },
  btn:     { width: '100%', padding: '.85rem', background: c.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s', marginTop: '.5rem' },
  channels: { display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' },
  channelItem: { display: 'flex', gap: '1rem', background: c.bg2, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem' },
  channelIcon: { fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  channelText: { fontSize: '.85rem', lineHeight: 1.6, fontWeight: 300, color: '#5A6B5C' },
  faqItem: { borderBottom: `1px solid ${c.border}`, padding: '1.2rem 0' },
  faqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  faqTitle: { fontSize: '.95rem', fontWeight: 500, color: c.dark },
  faqBody: { fontSize: '.86rem', color: '#5A6B5C', lineHeight: 1.8, fontWeight: 300, marginTop: '.8rem', transition: 'all .2s' },
  successBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#166534' },
}

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', storeUrl: '', subject: '', message: '' })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate sending email/ticket to backend support system
    setTimeout(() => {
      setLoading(false)
      setIsSubmitted(true)
    }, 1200)
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
      a: "Absolutely. By default, you can run the agent in 'Dry Run' mode. The AI will analyze your store and generate growth reports containing wins and concerns, but it will not push any changes to your live Shopify store until you turn live actions on."
    },
    {
      q: "Which e-commerce platforms are supported?",
      a: "Shopify is currently fully supported. We are in the process of getting SP-API approval for Amazon integration, which will be added as a platform option as soon as it is approved."
    }
  ]

  return (
    <div style={s.page}>
      
      {/* NAV */}
      <nav style={s.nav}>
        <Link to="/" style={s.logo}>
          Se<span style={{ color: c.green }}>lo</span>ra
        </Link>
        <Link to="/dashboard" style={{ fontSize: '.82rem', color: c.muted, textDecoration: 'none' }}>
          ← Go to Dashboard
        </Link>
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
                    placeholder="my-fashion-store.myshopify.com"
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

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '1.8rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.card, flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '.95rem', fontWeight: 700, color: c.dark }}>Se<span style={{ color: c.green }}>lo</span>ra</div>
        <div style={{ display: 'flex', gap: '1.8rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Support', href: '/support' },
            { label: 'Contact', href: '/support' },
          ].map(l => (
            <Link key={l.label} to={l.href} style={{ fontSize: '.74rem', color: c.muted, textDecoration: 'none', marginLeft: '1.8rem' }}>{l.label}</Link>
          ))}
        </div>
        <div style={{ fontSize: '.7rem', color: '#c0c8c1' }}>© 2025 Selora. All rights reserved.</div>
      </footer>

    </div>
  )
}
