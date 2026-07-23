import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'

// ── Detect current dark mode from the html element class ─────────────────────
function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

// ── Theme token helper ────────────────────────────────────────────────────────
function t(dark) {
  return {
    // surfaces
    backdrop:    dark ? 'rgba(0,0,0,0.65)'             : 'rgba(10,20,12,0.45)',
    card:        dark ? '#121A14'                       : '#ffffff',
    cardBorder:  dark ? '1px solid #2E3D30'            : '1px solid #E4EBE5',
    cardShadow:  dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 32px 80px rgba(10,25,15,.18)',
    // inputs
    inputBg:     dark ? '#1B261D'  : '#FAFAF8',
    inputBgFocus:dark ? '#243024'  : '#fff',
    inputBorder: dark ? '#2E3D30'  : '#E4EBE5',
    inputBorderFocus: dark ? '#6FBF8B' : '#5A8A67',
    inputBorderValid: dark ? '#6FBF8B' : '#166534',
    inputText:   dark ? '#F4F9F5'  : '#1A271C',
    shadowFocus: dark ? 'rgba(111,191,139,.15)' : 'rgba(90,138,103,.1)',
    shadowValid: dark ? 'rgba(111,191,139,.2)'  : 'rgba(22,101,52,.15)',
    // text
    title:       dark ? '#F4F9F5'  : '#1A271C',
    sub:         dark ? '#7FA189'  : '#7B907D',
    label:       dark ? '#6FBF8B'  : '#5A8A67',
    labelValid:  dark ? '#6FBF8B'  : '#166534',
    labelDefault:dark ? '#7FA189'  : '#7B907D',
    // accents
    green:       dark ? '#6FBF8B'  : '#5A8A67',
    greenHover:  dark ? '#8FD4A8'  : '#4a7a57',
    // divider
    divider:     dark ? '#2E3D30'  : '#E4EBE5',
    dividerText: dark ? '#7FA189'  : '#7B907D',
    // secondary button (google)
    googleBg:    dark ? '#1B261D'  : '#fff',
    googleBgHover: dark ? '#243024' : '#FAFAF8',
    googleBorder:dark ? '#2E3D30'  : '#E4EBE5',
    googleBorderHover: dark ? '#6FBF8B' : '#5A8A67',
    googleText:  dark ? '#F4F9F5'  : '#1A271C',
    // close btn
    closeBg:     dark ? '#1B261D'  : 'transparent',
    closeBgHover:dark ? '#243024'  : '#F0F0EE',
    closeColor:  dark ? '#7FA189'  : '#7B907D',
    closeColorHover: dark ? '#F4F9F5' : '#1A271C',
    // logo
    logoBrand:   dark ? '#F4F9F5'  : '#1A271C',
    // error/link
    errBg:       dark ? 'rgba(220,38,38,.12)'   : '#FEF2F2',
    errBorder:   dark ? 'rgba(220,38,38,.3)'    : '#FECACA',
    errText:     dark ? '#F87171'               : '#DC2626',
    linkColor:   dark ? '#6FBF8B'  : '#5A8A67',
    // terms text
    termsText:   dark ? '#7FA189'  : '#7B907D',
    eyeColor:    dark ? '#7FA189'  : '#7B907D',
    successBg:   dark ? 'rgba(111,191,139,.1)'  : '#F0FDF4',
    successColor:dark ? '#6FBF8B'               : '#5A8A67',
  }
}

// ── Floating Label Input ──────────────────────────────────────────────────────
function FloatInput({ label, type = 'text', value, onChange, valid, suffix, autoFocus, dark }) {
  const [focus, setFocus] = useState(false)
  const T = t(dark)
  const active = focus || !!value
  return (
    <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        autoFocus={autoFocus}
        required
        style={{
          width: '100%',
          border: `1px solid ${valid ? T.inputBorderValid : focus ? T.inputBorderFocus : T.inputBorder}`,
          borderRadius: 8,
          fontSize: '.9rem',
          color: T.inputText,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          transition: 'border .2s, box-shadow .2s, background .2s',
          background: focus ? T.inputBgFocus : T.inputBg,
          padding: suffix ? '1.2rem 2.8rem 0.5rem 1rem' : '1.2rem 1rem 0.5rem',
          boxSizing: 'border-box',
          boxShadow: focus
            ? valid ? `0 0 0 3px ${T.shadowValid}` : `0 0 0 3px ${T.shadowFocus}`
            : 'none',
        }}
      />
      <label style={{
        position: 'absolute',
        left: '1rem',
        top: active ? '28%' : '50%',
        transform: 'translateY(-50%)',
        fontSize: active ? '.65rem' : '.85rem',
        fontWeight: active ? 600 : 300,
        color: valid ? T.labelValid : active ? T.label : T.labelDefault,
        transition: 'all .18s ease',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        letterSpacing: active ? '.04em' : 'normal',
      }}>{label}</label>
      {suffix && (
        <div style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

// ── Eye toggle SVGs ───────────────────────────────────────────────────────────
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

function EyeBtn({ show, toggle, color }) {
  return (
    <button type="button" onClick={toggle} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
    }}>{show ? <EyeOff /> : <EyeOn />}</button>
  )
}

// ── Password strength bar ─────────────────────────────────────────────────────
function StrengthBar({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const color = score <= 1 ? '#DC2626' : score === 2 ? '#F59E0B' : score === 3 ? '#16A34A' : '#166534'
  return (
    <div style={{ display: 'flex', gap: 3, height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: '1rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ flex: 1, background: i <= score ? color : '#E4EBE5', transition: 'background .3s' }} />
      ))}
    </div>
  )
}

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

// ── Switch mode button ────────────────────────────────────────────────────────
function SwitchBtn({ onClick, children, color }) {
  return (
    <button type="button" onClick={onClick} style={{
      color, fontWeight: 600, background: 'none', border: 'none',
      cursor: 'pointer', fontSize: '.82rem', padding: 0,
      fontFamily: 'Inter, sans-serif',
    }}>{children}</button>
  )
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ plan, onSuccess, onSwitch, dark }) {
  const T = t(dark)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message); setLoading(false)
      setShake(true); setTimeout(() => setShake(false), 500)
    } else {
      onSuccess(data.user, plan)
    }
  }

  async function handleGoogle() {
    const redirectTo = plan
      ? `${window.location.origin}/dashboard?plan=${plan}`
      : `${window.location.origin}/dashboard`
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  return (
    <div className={shake ? 'am-shake' : ''}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 500, color: T.title, marginBottom: '.3rem', letterSpacing: '-.3px' }}>
        Welcome back
      </h2>
      <p style={{ fontSize: '.83rem', color: T.sub, marginBottom: '1.6rem', fontWeight: 300, lineHeight: 1.6 }}>
        Sign in to your Selora account.
      </p>

      {error && (
        <div style={{ background: T.errBg, border: `1px solid ${T.errBorder}`, borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: T.errText, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <FloatInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} valid={emailValid} autoFocus dark={dark} />
        <FloatInput
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          suffix={<EyeBtn show={showPw} toggle={() => setShowPw(v => !v)} color={T.eyeColor} />}
          dark={dark}
        />
        <div style={{ textAlign: 'right', marginTop: '-0.4rem', marginBottom: '1.2rem' }}>
          <a href="/forgot-password" style={{ fontSize: '.75rem', color: T.linkColor, textDecoration: 'none' }}>Forgot password?</a>
        </div>
        <button type="submit" className="am-btn" disabled={loading} style={{ background: T.green }}>
          {loading ? <><span className="am-spinner" /> Signing in…</> : 'Sign In'}
        </button>
      </form>

      <div className="am-divider" style={{ '--am-div-color': T.divider, '--am-div-text': T.dividerText }}>
        <div style={{ flex: 1, height: 1, background: T.divider }} />
        <span style={{ fontSize: '.75rem', color: T.dividerText }}>or</span>
        <div style={{ flex: 1, height: 1, background: T.divider }} />
      </div>

      <button type="button" onClick={handleGoogle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
        padding: '.72rem 1rem', border: `1px solid ${T.googleBorder}`, borderRadius: 8,
        background: T.googleBg, color: T.googleText, fontSize: '.88rem', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.googleBorderHover; e.currentTarget.style.background = T.googleBgHover }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.googleBorder; e.currentTarget.style.background = T.googleBg }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p style={{ fontSize: '.82rem', color: T.sub, textAlign: 'center', marginTop: '1.4rem' }}>
        Don't have an account?{' '}
        <SwitchBtn onClick={onSwitch} color={T.linkColor}>Create one free</SwitchBtn>
      </p>
    </div>
  )
}

// ── Signup Form ───────────────────────────────────────────────────────────────
function SignupForm({ plan, onSuccess, onSwitch, dark }) {
  const T = t(dark)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [accountExists, setAccountExists] = useState(false)
  const [shake, setShake] = useState(false)

  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const nameValid = name && name.trim().length >= 2
  const confirmValid = confirm && password === confirm

  async function handleSignup(e) {
    e.preventDefault(); setError('')
    if (password !== confirm) {
      setError('Passwords do not match'); setShake(true); setTimeout(() => setShake(false), 500); return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters'); setShake(true); setTimeout(() => setShake(false), 500); return
    }
    setLoading(true)
    const emailRedirectTo = plan
      ? `${window.location.origin}/dashboard?plan=${plan}`
      : `${window.location.origin}/dashboard`
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo }
    })
    if (error) {
      setError(error.message); setLoading(false)
      setShake(true); setTimeout(() => setShake(false), 500)
    } else if (data?.user?.identities?.length === 0) {
      // Supabase silently succeeds but returns empty identities when the email
      // is already registered — this is by design to prevent email enumeration.
      setAccountExists(true); setLoading(false)
    } else {
      setSuccess(true); setLoading(false)
    }
  }

  async function handleGoogle() {
    const redirectTo = plan
      ? `${window.location.origin}/dashboard?plan=${plan}`
      : `${window.location.origin}/dashboard`
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  // ── Account already exists ────────────────────────────────────────────────
  if (accountExists) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: dark ? 'rgba(111,191,139,.1)' : '#EEF4EF', color: T.green, marginBottom: '1.2rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '1.8rem', height: '1.8rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, color: T.title, marginBottom: '.5rem' }}>You already have an account</h2>
        <p style={{ fontSize: '.85rem', color: T.sub, lineHeight: 1.7, marginBottom: '1.6rem', fontWeight: 300 }}>
          <strong style={{ color: T.title }}>{email}</strong> is already registered with Selora.<br />
          Sign in to continue.
        </p>
        <button
          type="button"
          className="am-btn"
          style={{ background: T.green, marginBottom: '1rem' }}
          onClick={onSwitch}
        >
          Sign In Instead
        </button>
        <p style={{ fontSize: '.82rem', color: T.sub }}>
          <SwitchBtn onClick={() => setAccountExists(false)} color={T.linkColor}>← Try a different email</SwitchBtn>
        </p>
      </div>
    )
  }

  // ── Email sent confirmation ───────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: T.successBg, color: T.successColor, marginBottom: '1.2rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '1.8rem', height: '1.8rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, color: T.title, marginBottom: '.6rem' }}>Check your email</h2>
        <p style={{ fontSize: '.85rem', color: T.sub, lineHeight: 1.7, marginBottom: '1.5rem', fontWeight: 300 }}>
          We sent a confirmation link to <strong style={{ color: T.title }}>{email}</strong>.<br />
          Click it to activate your account.
        </p>
        <SwitchBtn onClick={onSwitch} color={T.linkColor}>Back to sign in →</SwitchBtn>
      </div>
    )
  }

  return (
    <div className={shake ? 'am-shake' : ''}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 500, color: T.title, marginBottom: '.3rem', letterSpacing: '-.3px' }}>
        Start growing for free
      </h2>
      <p style={{ fontSize: '.83rem', color: T.sub, marginBottom: '1.6rem', fontWeight: 300, lineHeight: 1.6 }}>
        Create your account — 14-day free trial, no credit card needed.
      </p>

      {error && (
        <div style={{ background: T.errBg, border: `1px solid ${T.errBorder}`, borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: T.errText, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup}>
        <FloatInput label="Full Name" value={name} onChange={e => setName(e.target.value)} valid={nameValid} autoFocus dark={dark} />
        <FloatInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} valid={emailValid} dark={dark} />
        <FloatInput
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          suffix={<EyeBtn show={showPw} toggle={() => setShowPw(v => !v)} color={T.eyeColor} />}
          dark={dark}
        />
        <StrengthBar password={password} />
        <FloatInput
          label="Confirm Password"
          type={showCf ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          valid={confirmValid}
          suffix={<EyeBtn show={showCf} toggle={() => setShowCf(v => !v)} color={T.eyeColor} />}
          dark={dark}
        />
        <button type="submit" className="am-btn" disabled={loading} style={{ background: T.green }}>
          {loading ? <><span className="am-spinner" /> Creating account…</> : 'Create Free Account'}
        </button>
      </form>

      <p style={{ fontSize: '.72rem', color: T.termsText, textAlign: 'center', marginTop: '.8rem', lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/terms" style={{ color: T.linkColor, textDecoration: 'none' }}>Terms</a> and{' '}
        <a href="/privacy" style={{ color: T.linkColor, textDecoration: 'none' }}>Privacy Policy</a>.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0' }}>
        <div style={{ flex: 1, height: 1, background: T.divider }} />
        <span style={{ fontSize: '.75rem', color: T.dividerText }}>or</span>
        <div style={{ flex: 1, height: 1, background: T.divider }} />
      </div>

      <button type="button" onClick={handleGoogle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
        padding: '.72rem 1rem', border: `1px solid ${T.googleBorder}`, borderRadius: 8,
        background: T.googleBg, color: T.googleText, fontSize: '.88rem', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.googleBorderHover; e.currentTarget.style.background = T.googleBgHover }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.googleBorder; e.currentTarget.style.background = T.googleBg }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p style={{ fontSize: '.82rem', color: T.sub, textAlign: 'center', marginTop: '1.4rem' }}>
        Already have an account?{' '}
        <SwitchBtn onClick={onSwitch} color={T.linkColor}>Sign in</SwitchBtn>
      </p>
    </div>
  )
}

// ── AuthModal ─────────────────────────────────────────────────────────────────
export default function AuthModal() {
  const { authModal, closeAuthModal, authMessage, setAuthMessage } = useAppContext()
  const { open, mode, plan } = authModal
  const [currentMode, setCurrentMode] = useState(mode)
  const navigate = useNavigate()
  const dark = useIsDark()

  const T = t(dark)

  const handleClose = useCallback(() => {
    if (setAuthMessage) setAuthMessage(null)
    closeAuthModal()
  }, [closeAuthModal, setAuthMessage])

  // Sync mode when opened with a specific mode
  useEffect(() => {
    if (open) setCurrentMode(mode)
  }, [open, mode])

  // Scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  function handleSuccess(user, plan) {
    handleClose()
    if (plan && plan !== 'free') {
      navigate(`/pricing?plan=${plan}`)
    } else {
      navigate('/dashboard')
    }
  }

  function switchMode() {
    setCurrentMode(m => m === 'login' ? 'signup' : 'login')
  }

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes amBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes amCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes amSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes amShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .am-shake { animation: amShake 0.4s ease-in-out; }
        .am-btn {
          width: 100%;
          padding: .82rem;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: .9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: Inter, sans-serif;
          transition: filter .2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          box-sizing: border-box;
        }
        .am-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .am-btn:disabled { opacity: .7; cursor: not-allowed; }
        .am-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: amSpin .6s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        .am-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: .35rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .15s;
          line-height: 0;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: T.backdrop,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'amBackdropIn .25s ease forwards',
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={currentMode === 'login' ? 'Sign In' : 'Create Account'}
        style={{
          position: 'fixed', inset: 0, zIndex: 9001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', pointerEvents: 'none',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            background: T.card,
            border: T.cardBorder,
            borderRadius: 18,
            padding: '2.4rem 2.4rem 2rem',
            width: '100%',
            maxWidth: 500,
            boxShadow: T.cardShadow,
            position: 'relative',
            animation: 'amCardIn .3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            maxHeight: '90vh',
            overflowY: 'auto',
            fontFamily: 'Inter, sans-serif',
            transition: 'background .25s, border-color .25s',
          }}
        >
          {/* Close button */}
          <button
            className="am-close"
            onClick={handleClose}
            aria-label="Close"
            style={{ color: T.closeColor }}
            onMouseEnter={e => { e.currentTarget.style.background = T.closeBgHover; e.currentTarget.style.color = T.closeColorHover }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.closeColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-.3px', color: T.logoBrand }}>
              Se<span style={{ color: T.green }}>lo</span>ra
            </span>
          </div>

          {authMessage && (
            <div style={{ background: T.successBg, border: `1px solid ${T.successColor}`, borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: T.successColor, marginBottom: '1.2rem', textAlign: 'center', fontWeight: 500 }}>
              {authMessage}
            </div>
          )}

          {currentMode === 'login'
            ? <LoginForm  plan={plan} onSuccess={handleSuccess} onSwitch={switchMode} dark={dark} />
            : <SignupForm plan={plan} onSuccess={handleSuccess} onSwitch={switchMode} dark={dark} />
          }
        </div>
      </div>
    </>
  )
}
