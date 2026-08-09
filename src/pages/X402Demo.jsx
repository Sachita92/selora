import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useDarkMode } from '../hooks/useDarkMode'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COOLDOWN_S = 15

// ─── Inline styles scoped to the page ────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-0)',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', sans-serif",
  },
  hero: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '4.8rem 1.5rem 1rem',
    textAlign: 'center',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    background: 'var(--g-tint)',
    border: '1px solid var(--border-strong)',
    color: 'var(--g)',
    padding: '0.25rem 0.85rem',
    borderRadius: 999,
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.8rem',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--g)',
    display: 'inline-block',
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(1.25rem, 2.8vw, 1.85rem)',
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  sub: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    maxWidth: 620,
    margin: '0 auto 1.2rem',
    fontWeight: 300,
  },
  card: {
    width: '100%',
    background: 'var(--bg-1)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
  },
  cardHeader: {
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border)',
    padding: '0.9rem 1.6rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  trafficLights: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  cardBody: {
    padding: '2.4rem 2.2rem',
  },
  balanceBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.85rem 1.2rem',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    marginBottom: '1.6rem',
    flexWrap: 'wrap',
  },
  balanceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
  },
  balanceLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  balanceValue: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--g)',
    fontFamily: "'Fraunces', serif",
  },
  balanceSub: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  btn: {
    background: 'var(--g)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '0.85rem 2.2rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 18px rgba(90,138,103,0.35)',
    position: 'relative',
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    marginBottom: '1rem',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.9rem',
    padding: '0.95rem 0',
    borderBottom: '1px solid var(--border)',
    transition: 'all 0.3s',
  },
  stepRowLast: {
    borderBottom: 'none',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
    fontSize: '0.8rem',
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepLabel: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.2rem',
    lineHeight: 1.4,
  },
  stepDetail: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },
  resultBox: {
    background: 'var(--g-tint)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12,
    padding: '1.2rem 1.4rem',
    marginTop: '0.5rem',
  },
  resultLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--g)',
    marginBottom: '0.5rem',
  },
  resultText: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },
  explorerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: 'var(--g)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.82rem',
    marginTop: '0.8rem',
    padding: '0.4rem 0.9rem',
    background: 'var(--g-tint)',
    borderRadius: 8,
    border: '1px solid var(--border-strong)',
    transition: 'all 0.2s',
  },
  errorBox: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: 10,
    padding: '0.9rem 1.2rem',
    marginTop: '0.5rem',
    fontSize: '0.82rem',
    color: '#ef4444',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },
  infoBar: {
    marginTop: '1.8rem',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  infoPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.76rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
}

// ─── Step config ──────────────────────────────────────────────────────────────
const STEP_DEFS = [
  { n: 0, label: 'Wallet' },
  { n: 1, label: '402 Challenge' },
  { n: 2, label: 'Sign Payment' },
  { n: 3, label: 'Submit & Verify' },
  { n: 4, label: 'On-Chain Confirm' },
]

function StepIcon({ state }) {
  if (state === 'done') return (
    <div style={{ ...S.stepIcon, background: 'rgba(111,191,139,0.15)', color: 'var(--g)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
  if (state === 'error') return (
    <div style={{ ...S.stepIcon, background: 'rgba(220,38,38,0.12)', color: '#ef4444' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  )
  if (state === 'active') return (
    <div style={{ ...S.stepIcon, background: 'rgba(111,191,139,0.1)', color: 'var(--g)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-9-9" />
      </svg>
    </div>
  )
  return (
    <div style={{ ...S.stepIcon, background: 'var(--bg-2)', color: 'var(--text-muted)' }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
        <circle cx="4" cy="4" r="3" />
      </svg>
    </div>
  )
}

const INFO_PILLS = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    text: 'Real USDC on Solana Devnet',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    text: 'Test wallet — not your funds',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" />
        <line x1="16" y1="16" x2="16.01" y2="16" />
      </svg>
    ),
    text: 'Fully autonomous, no human step',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
    text: 'Verifiable on-chain',
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function X402Demo() {
  useDarkMode()

  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [payerPubkey, setPayerPubkey] = useState('')

  // Step state: map of stepN → { label, detail, state: 'idle'|'active'|'done'|'error' }
  const [steps, setSteps] = useState({})
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState(null)   // { tx_sig, explorer_url, ai_response, balance_after }
  const [globalError, setGlobalError] = useState(null)

  // Cooldown
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef(null)

  useEffect(() => {
    const fetchBalance = async () => {
      const urlsToTry = [
        `${API_URL}/api/x402/payer-balance`,
        'http://localhost:8000/api/x402/payer-balance',
        'http://127.0.0.1:8000/api/x402/payer-balance',
      ]
      for (const url of urlsToTry) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            const d = await res.json()
            if (d.success && d.balance_usdc !== null && d.balance_usdc !== undefined) {
              setBalance(d.balance_usdc)
              setPayerPubkey(d.pubkey || '')
              setBalanceLoading(false)
              return
            }
          }
        } catch (_) {}
      }
      setBalanceLoading(false)
    }
    fetchBalance()
  }, [])

  function startCooldown() {
    setCooldown(COOLDOWN_S)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function resetDemo() {
    setSteps({})
    setFinished(false)
    setResult(null)
    setGlobalError(null)
  }

  function setStep(n, label, detail, state) {
    setSteps(prev => ({
      ...prev,
      [n]: { label, detail, state },
    }))
  }

  async function runDemo() {
    if (running || cooldown > 0) return
    resetDemo()
    setRunning(true)
    setGlobalError(null)

    // Mark all steps idle
    STEP_DEFS.forEach(s => setStep(s.n, s.label, null, 'idle'))

    try {
      const resp = await fetch(`${API_URL}/api/x402/demo-run`, { method: 'POST' })

      if (resp.status === 429) {
        const err = await resp.json()
        setGlobalError(err.detail || 'Cooldown active — please wait.')
        setRunning(false)
        return
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        setGlobalError(err.detail || `Server error: ${resp.status}`)
        setRunning(false)
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() // keep partial line in buffer

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            const { step, label, detail, done: isDone, error: isError,
              tx_sig, explorer_url, ai_response, balance_after } = msg

            const state = isError ? 'error' : isDone ? 'done' : 'active'
            setStep(step, label, detail, state)

            if (isDone && !isError) {
              // mark all prior steps as done too
              for (let i = 0; i < step; i++) {
                setSteps(prev => ({
                  ...prev,
                  [i]: { ...prev[i], state: prev[i]?.state === 'error' ? 'error' : 'done' },
                }))
              }

              if (step === 4) {
                setResult({ tx_sig, explorer_url, ai_response, balance_after })
                setFinished(true)
                if (balance_after !== null && balance_after !== undefined) {
                  setBalance(balance_after)
                }
              }
            }

            if (isError) {
              setFinished(true)
              break
            }
          } catch (_) { /* malformed line, skip */ }
        }
      }
    } catch (err) {
      setGlobalError(err.message || 'Network error')
    } finally {
      setRunning(false)
      startCooldown()
    }
  }

  const isDisabled = running || cooldown > 0

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes shimmer { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(280%) skewX(-15deg)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }
        .x402-btn:not(:disabled):hover { background: #4a7a57 !important; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(90,138,103,0.4) !important; }
        .x402-btn::after { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:translateX(-100%) skewX(-15deg); }
        .x402-btn:not(:disabled):hover::after { animation: shimmer 0.55s ease forwards; }
        .x402-explorer:hover { background: var(--g) !important; color: #fff !important; }
        .x402-step-row { animation: fadeUp 0.35s ease both; }
        .x402-result-box { animation: fadeUp 0.45s ease both; }

        .x402-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.2rem;
          align-items: start;
        }

        @media (max-width: 980px) {
          .x402-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <div style={S.hero}>
        <div style={S.eyebrow}>
          <span style={S.dot} />
          Live x402 Protocol Demo · Solana Devnet
        </div>
        <h1 style={S.h1}>
          Watch an AI agent pay <em style={{ fontStyle: 'italic', color: 'var(--g)' }}>another AI agent</em> — live, on-chain
        </h1>
        <p style={S.sub}>
          The x402 protocol lets software pay for API access autonomously using USDC on Solana — no humans or manual approval prompts required.
        </p>
      </div>

      {/* ── Two-Column Main Content Container ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto 5rem', padding: '0 2rem' }}>
        <div className="x402-two-col">

          {/* Column 1: Interactive Demo Card + Info Pills */}
          <div>
            <div style={S.card}>

              {/* Card chrome bar */}
              <div style={S.cardHeader}>
                <div style={S.trafficLights}>
                  {['#f87171', '#fbbf24', '#4ade80'].map(c => (
                    <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                  ))}
                  <span style={{ marginLeft: '0.7rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Selora · x402 Agent Payment Loop
                  </span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: 'var(--g-tint)', border: '1px solid var(--border-strong)',
                  color: 'var(--g)', padding: '0.28rem 0.8rem', borderRadius: 999,
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--g)',
                    animation: 'pulse-dot 2s infinite',
                    display: 'inline-block',
                  }} />
                  Solana Devnet
                </div>
              </div>

              <div style={S.cardBody}>

                {/* Balance bar */}
                <div style={S.balanceBar}>
                  <div style={S.balanceLeft}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--g-tint)', border: '1px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--g)', flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <div style={S.balanceLabel}>Payer Wallet Balance</div>
                      <div style={S.balanceValue}>
                        {balanceLoading
                          ? '—'
                          : balance !== null
                            ? `${balance.toFixed(4)} USDC`
                            : 'Unavailable'}
                      </div>
                      <div style={S.balanceSub}>
                        {payerPubkey
                          ? `${payerPubkey.slice(0, 8)}…${payerPubkey.slice(-6)} · Devnet`
                          : 'Test payer wallet · Solana Devnet'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: balance !== null && balance < 0.01 ? '#ef4444' : 'var(--text-muted)',
                    fontWeight: 500,
                    textAlign: 'right',
                  }}>
                    {balance !== null && balance < 0.01
                      ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Low balance
                        </span>
                      )
                      : '~$0.001 USDC per run'}
                  </div>
                </div>

                {/* Steps timeline */}
                <div style={S.stepsContainer}>
                  {STEP_DEFS.map((def, idx) => {
                    const s = steps[def.n]
                    const state = s?.state || 'idle'
                    const isLast = idx === STEP_DEFS.length - 1

                    return (
                      <div
                        key={def.n}
                        className="x402-step-row"
                        style={{
                          ...S.stepRow,
                          ...(isLast ? S.stepRowLast : {}),
                          opacity: state === 'idle' ? 0.42 : 1,
                        }}
                      >
                        <StepIcon state={state} />
                        <div style={S.stepContent}>
                          <div style={{
                            ...S.stepLabel,
                            color: state === 'error' ? '#ef4444'
                              : state === 'done' ? 'var(--g)'
                                : state === 'active' ? 'var(--text-primary)'
                                  : 'var(--text-muted)',
                          }}>
                            {s?.label || def.label}
                          </div>
                          {s?.detail && state !== 'error' && (
                            <div style={S.stepDetail}>{s.detail}</div>
                          )}
                          {s?.detail && state === 'error' && (
                            <div style={S.errorBox}>{s.detail}</div>
                          )}

                          {/* Final result box */}
                          {def.n === 4 && state === 'done' && result && (
                            <div className="x402-result-box" style={S.resultBox}>
                              {result.ai_response && (
                                <>
                                  <div style={S.resultLabel}>AI Response</div>
                                  <div style={S.resultText}>{result.ai_response}</div>
                                </>
                              )}
                              {result.explorer_url && result.tx_sig ? (
                                <a
                                  href={result.explorer_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="x402-explorer"
                                  style={S.explorerLink}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  Verify on Solana Explorer ↗
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', opacity: 0.7 }}>
                                    {result.tx_sig.slice(0, 12)}…
                                  </span>
                                </a>
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                  Transaction signature not returned in response headers — check backend logs for the on-chain tx.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Global error */}
                {globalError && (
                  <div style={{ ...S.errorBox, marginTop: '0.5rem' }}>
                    {globalError}
                  </div>
                )}

                {/* CTA row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button
                    id="x402-simulate-btn"
                    className="x402-btn"
                    style={{
                      ...S.btn,
                      ...(isDisabled ? S.btnDisabled : {}),
                    }}
                    onClick={runDemo}
                    disabled={isDisabled}
                  >
                    {running ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-9-9" />
                        </svg>
                        Running…
                      </>
                    ) : finished ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Run Again
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Simulate Agent Payment
                      </>
                    )}
                  </button>

                  {cooldown > 0 && !running && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Next run in {cooldown}s
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* Info pills */}
            <div style={S.infoBar}>
              {INFO_PILLS.map((pill) => (
                <div key={pill.text} style={S.infoPill}>
                  {pill.icon}
                  <span>{pill.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Explanatory Card ("What's happening under the hood") */}
          <div>
            <div style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '2.4rem 2.2rem',
              boxShadow: '0 8px 48px rgba(0,0,0,0.12)',
            }}>
              <h2 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '1.4rem',
              }}>
                What's happening under the hood
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                {[
                  ['1', 'Agent calls the gated endpoint with no payment → receives HTTP 402 with a machine-readable PAYMENT-REQUIRED header encoding the price, recipient, and network.'],
                  ['2', 'Agent decodes the payment requirements, builds a USDC SPL token transfer on Solana devnet, signs it with the payer keypair — all without opening any wallet UI.'],
                  ['3', 'Agent re-sends the original request with the signed transaction embedded in the PAYMENT-SIGNATURE header.'],
                  ['4', 'Server verifies and settles the payment via the x402.org facilitator, then returns the AI response with a PAYMENT-RESPONSE header containing the on-chain transaction ID.'],
                ].map(([n, desc]) => (
                  <div key={n} style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    padding: '1.1rem 1.3rem',
                    background: 'var(--bg-2)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--g-tint)', border: '1px solid var(--border-strong)',
                      color: 'var(--g)', fontSize: '0.75rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>{n}</div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.68, margin: 0 }}>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1.6rem',
                padding: '1rem 1.2rem',
                background: 'var(--bg-2)',
                borderRadius: 10,
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                borderLeft: '3px solid var(--g)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                lineHeight: 1.6,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>This is the x402 protocol — an open standard for machine-to-machine HTTP payments. No custody, no approval prompts, no intermediary accounts — just a signed transaction in a header.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
