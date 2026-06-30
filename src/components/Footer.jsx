import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subState, setSubState] = useState('idle') // idle | loading | success | error

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubState('loading')
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setSubState('success')
      } else {
        setSubState('error')
      }
    } catch {
      setSubState('error')
    }
  }

  const FOOTER_COLS = [
    {
      heading: "Product",
      links: [
        { label: "Features", path: "/features" },
        { label: "How It Works", path: "/how-it-works" },
        { label: "Pricing", path: "/pricing" },
        { label: "Book a Demo", path: "/demo" },
      ]
    },
    {
      heading: "Company",
      links: [
        { label: "About", path: "#" },
        { label: "Blog", path: "#" },
        { label: "Careers", path: "#" },
        { label: "Press", path: "#" },
      ]
    },
    {
      heading: "Resources",
      links: [
        { label: "Docs", path: "#" },
        { label: "Support", path: "/support" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Terms of Service", path: "/terms" },
      ]
    },
  ]

  return (
    <footer style={{ borderTop: "1px solid var(--border-strong)", background: "var(--bg-1,#fff)", width: "100%" }}>
      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="mob-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "3.5rem 2rem 2rem", boxSizing: "border-box" }}>
        {/* Top row: logo + cols + newsletter */}
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.8fr", gap: "2.5rem", marginBottom: "2.5rem" }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ textDecoration: "none" }}>
              <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-.3px", color: "var(--dark)", marginBottom: ".7rem" }}>
                Se<span style={{ color: "var(--g)" }}>lo</span>ra
              </div>
            </Link>
            <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.7, fontWeight: 300, maxWidth: 200 }}>
              AI-powered growth for fashion sellers. Works while you sleep.
            </p>
          </div>
          {/* Nav columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text)", marginBottom: ".9rem", fontFamily: "Inter,sans-serif" }}>{col.heading}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: ".55rem", padding: 0, margin: 0 }}>
                {col.links.map(lk => (
                  <li key={lk.label}>
                    <Link to={lk.path} style={{ fontSize: ".78rem", color: "var(--muted)", textDecoration: "none", fontWeight: 300, transition: "color .2s" }}
                      onMouseEnter={e => e.target.style.color = "var(--dark)"}
                      onMouseLeave={e => e.target.style.color = "var(--muted)"}
                    >{lk.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* Newsletter */}
          <div>
            <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text)", marginBottom: ".9rem", fontFamily: "Inter,sans-serif" }}>Stay Updated</div>
            <p style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: ".9rem", lineHeight: 1.6, fontWeight: 300 }}>Growth tips, feature releases, and fashion seller stories.</p>
            {subState === 'success' ? (
              <div style={{ background: "var(--gpale,#EDF3EE)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: ".75rem 1rem", fontSize: ".78rem", color: "var(--g)", fontWeight: 500 }}>
                ✓ You're on the list — we'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={subState === 'loading'}
                  style={{ padding: ".7rem .9rem", borderRadius: 8, border: "1px solid var(--border)", fontSize: ".8rem", fontFamily: "Inter,sans-serif", background: "var(--bg,#F8FAF8)", color: "var(--dark)", outline: "none", width: "100%", boxSizing: "border-box" }}
                />
                <button type="submit" disabled={subState === 'loading'}
                  style={{ padding: ".65rem", borderRadius: 8, background: "var(--g)", color: "#fff", border: "none", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif", transition: "opacity .2s", opacity: subState === 'loading' ? 0.7 : 1 }}>
                  {subState === 'loading' ? "Subscribing…" : "Subscribe"}
                </button>
                {subState === 'error' && <p style={{ fontSize: ".72rem", color: "#C97168", margin: 0 }}>Something went wrong — try again.</p>}
              </form>
            )}
          </div>
        </div>
        {/* Bottom divider + copyright */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>© {new Date().getFullYear()} Selora. All rights reserved.</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ l: "Privacy Policy", h: "/privacy" }, { l: "Terms", h: "/terms" }, { l: "Contact", h: "/support" }].map(item => (
              <Link key={item.l} to={item.h} style={{ fontSize: ".7rem", color: "var(--muted)", textDecoration: "none" }}>{item.l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
