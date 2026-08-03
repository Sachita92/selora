import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAppContext } from "../lib/AppContext"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function ConnectStoreModal({ isOpen, onClose }) {
  const { user } = useAppContext()
  const navigate = useNavigate()

  // ── Functional state (verbatim from Connect.jsx) ──────────────────────────
  const [shop, setShop]       = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [email, setEmail]     = useState("")

  // Populate email + reset form each time modal opens
  useEffect(() => {
    if (!isOpen) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setEmail(session.user.email)
    })
    setShop("")
    setError("")
    setLoading(false)
  }, [isOpen])

  // ── Scroll lock — restore previous value on unmount/close ─────────────────
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  // ── Shopify connect (verbatim from Connect.jsx) ───────────────────────────
  const handleConnect = (e) => {
    e.preventDefault()
    setError("")
    let shopUrl = shop.trim()
      .replace("https://", "").replace("http://", "")
      .replace(".myshopify.com", "").trim()
    if (!shopUrl) { setError("Please enter your Shopify store URL"); return }
    setLoading(true)
    window.location.href = `${API_URL}/install?shop=${shopUrl}.myshopify.com&email=${encodeURIComponent(email)}`
  }

  // ── Create native store ───────────────────────────────────────────────────
  const handleCreateStore = () => {
    onClose()
    navigate("/store-builder")
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10, 18, 12, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 8000,
        }}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up your store"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 8001,
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 18,
          background: "var(--modal-bg, var(--bg-1, #fff))",
          border: "1px solid var(--border, #E4EBE5)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          fontFamily: "Inter, sans-serif",
          animation: "csm-in 0.22s cubic-bezier(.22,.68,0,1.15) both",
        }}
      >
        <style>{`
          @keyframes csm-in {
            from { opacity: 0; transform: translate(-50%, -52%) scale(.96); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes csm-spin { to { transform: rotate(360deg); } }
          .csm-option {
            border: 1px solid var(--border, #E4EBE5);
            border-radius: 12px;
            padding: 1.1rem 1.25rem;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .csm-option:focus-within {
            border-color: var(--g, #5A8A67);
            box-shadow: 0 0 0 3px rgba(90,138,103,.12);
          }
          .csm-btn-primary {
            width: 100%; padding: .62rem 1rem;
            background: var(--g, #5A8A67); color: #fff;
            border: none; border-radius: 9px;
            font-size: .85rem; font-weight: 600;
            cursor: pointer; font-family: Inter, sans-serif;
            display: inline-flex; align-items: center; justify-content: center;
            gap: .4rem; transition: opacity 0.15s;
          }
          .csm-btn-primary:hover:not(:disabled) { opacity: .88; }
          .csm-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
          .csm-btn-secondary {
            width: 100%; padding: .62rem 1rem;
            background: transparent;
            color: var(--text-primary, #1A2B1C);
            border: 1px solid var(--border, #E4EBE5);
            border-radius: 9px;
            font-size: .85rem; font-weight: 600;
            cursor: pointer; font-family: Inter, sans-serif;
            display: inline-flex; align-items: center; justify-content: center;
            gap: .4rem; transition: background 0.15s, border-color 0.15s;
          }
          .csm-btn-secondary:hover { background: var(--bg-2, #F3F7F4); border-color: var(--g, #5A8A67); }
          .csm-input {
            width: 100%; padding: .6rem .85rem;
            border: 1px solid var(--border, #E4EBE5);
            border-radius: 8px;
            background: var(--bg-0, #F8FAF8);
            color: var(--text-primary, #1A2B1C);
            font-family: Inter, sans-serif; font-size: .83rem;
            outline: none; box-sizing: border-box;
            transition: border-color 0.15s;
          }
          .csm-input:focus { border-color: var(--g, #5A8A67); }
          .csm-input::placeholder { color: var(--text-muted, #8B9D8E); }
          .csm-close-btn {
            background: none; border: none; cursor: pointer;
            color: var(--text-muted, #8B9D8E); padding: .3rem;
            border-radius: 6px; display: flex; align-items: center; justify-content: center;
            transition: color 0.15s, background 0.15s;
          }
          .csm-close-btn:hover { color: var(--text-primary, #1A2B1C); background: var(--bg-2, #F3F7F4); }
        `}</style>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem .75rem",
          borderBottom: "1px solid var(--border, #E4EBE5)",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g, #5A8A67)" }}>
              Onboarding
            </p>
            <h2 style={{ margin: ".15rem 0 0", fontFamily: "Fraunces, serif", fontSize: "1.1rem", fontWeight: 500, color: "var(--text-primary, #1A2B1C)", letterSpacing: "-.02em" }}>
              Set up your store
            </h2>
          </div>
          <button className="csm-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Option 1 — Connect Shopify */}
          <div className="csm-option">
            <div style={{ display: "flex", alignItems: "center", gap: ".55rem", marginBottom: ".2rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g, #5A8A67)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-primary, #1A2B1C)" }}>
                Connect Shopify
              </span>
            </div>
            <p style={{ margin: "0 0 .85rem", fontSize: ".78rem", color: "var(--text-muted, #8B9D8E)", fontWeight: 300, lineHeight: 1.4 }}>
              Sync your existing store in 30 seconds
            </p>
            <form onSubmit={handleConnect} style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
              <input
                className="csm-input"
                type="text"
                placeholder="yourstore.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {error && (
                <p style={{ margin: 0, fontSize: ".73rem", color: "#DC2626", fontWeight: 400 }}>
                  {error}
                </p>
              )}
              <button type="submit" className="csm-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "csm-spin .65s linear infinite" }} />
                    Connecting&hellip;
                  </>
                ) : "Connect Store →"}
              </button>
            </form>
          </div>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border, #E4EBE5)" }} />
            <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--text-muted, #8B9D8E)", letterSpacing: ".06em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--border, #E4EBE5)" }} />
          </div>

          {/* Option 2 — Create Native Store */}
          <div className="csm-option">
            <div style={{ display: "flex", alignItems: "center", gap: ".55rem", marginBottom: ".2rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g, #5A8A67)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-primary, #1A2B1C)" }}>
                Create Native Store
              </span>
            </div>
            <p style={{ margin: "0 0 .85rem", fontSize: ".78rem", color: "var(--text-muted, #8B9D8E)", fontWeight: 300, lineHeight: 1.4 }}>
              Launch a new storefront hosted by Selora
            </p>
            <button type="button" className="csm-btn-primary" onClick={handleCreateStore}>
              Create Store →
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
