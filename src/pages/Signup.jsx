import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page:  { minHeight:'100vh', background:'linear-gradient(170deg,#EEF4EF 0%,#F8FAF8 55%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'2rem', position:'relative' },
  card:  { background:'#fff', border:'1px solid #E4EBE5', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 18px 55px rgba(90,138,103,.08)' },
  logo:  { fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:600, color:'#1A271C', textDecoration:'none', display:'block', marginBottom:'2rem', textAlign:'center', letterSpacing:'-.3px' },
  title: { fontFamily:'Fraunces, serif', fontSize:'1.6rem', fontWeight:500, color:'#1A271C', marginBottom:'.4rem', letterSpacing:'-.3px' },
  sub:   { fontSize:'.85rem', color:'#7B907D', marginBottom:'1.8rem', fontWeight:300, lineHeight:1.6 },
  label: { display:'block', fontSize:'.75rem', fontWeight:600, color:'#2E3D30', marginBottom:'.4rem', letterSpacing:'.04em', textTransform:'uppercase' },
  input: { width:'100%', padding:'.75rem 1rem', border:'1px solid #E4EBE5', borderRadius:8, fontSize:'.9rem', color:'#1A271C', fontFamily:'Inter, sans-serif', outline:'none', transition:'border .2s', background:'#FAFAF8' },
  btn:   { width:'100%', padding:'.82rem', background:'#5A8A67', color:'#fff', border:'none', borderRadius:8, fontSize:'.9rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all .2s', marginTop:'.5rem' },
  err:   { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', color:'#DC2626', marginBottom:'1rem' },
  ok:    { background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', color:'#166534', marginBottom:'1rem' },
  link:  { fontSize:'.82rem', color:'#5A8A67', textDecoration:'none', fontWeight:500 },
  backBtn: { position:'absolute', top:'2rem', left:'2.5rem', fontSize:'.85rem', color:'#7B907D', textDecoration:'none', fontWeight:500, display:'flex', alignItems:'center', gap:'.4rem', transition:'color .2s' }
}

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          username: username,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={s.page}>
        <Link to="/" style={s.backBtn} onMouseOver={e=>e.currentTarget.style.color='#1A271C'} onMouseOut={e=>e.currentTarget.style.color='#7B907D'}>
          ← Back to Selora
        </Link>
        <div style={s.card}>
          <Link to="/" style={s.logo}>Se<span style={{color:'#5A8A67'}}>lo</span>ra</Link>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'1rem'}}>✉️</div>
            <h2 style={{fontFamily:'Fraunces, serif', fontSize:'1.4rem', fontWeight:500, color:'#1A271C', marginBottom:'.6rem'}}>Check your email</h2>
            <p style={{fontSize:'.85rem', color:'#7B907D', lineHeight:1.7, marginBottom:'1.5rem', fontWeight:300}}>
              We sent a confirmation link to <strong style={{color:'#1A271C'}}>{email}</strong>.<br/>
              Click it to activate your account.
            </p>
            <Link to="/login" style={{...s.link, fontSize:'.85rem'}}>Back to sign in →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <Link to="/" style={s.backBtn} onMouseOver={e=>e.currentTarget.style.color='#1A271C'} onMouseOut={e=>e.currentTarget.style.color='#7B907D'}>
        ← Back to Selora
      </Link>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          Se<span style={{color:'#5A8A67'}}>lo</span>ra
        </Link>

        <h1 style={s.title}>Start growing for free</h1>
        <p style={s.sub}>Create your Selora account. No credit card needed — 14-day free trial included.</p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={handleSignup}>
          <div style={{marginBottom:'1rem'}}>
            <label style={s.label}>Full Name</label>
            <input
              style={s.input}
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div style={{marginBottom:'1rem'}}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              type="text"
              placeholder="janedoe"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{marginBottom:'1rem'}}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{marginBottom:'1rem'}}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{marginBottom:'1.2rem'}}>
            <label style={s.label}>Confirm Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>

          <p style={{fontSize:'.72rem', color:'#7B907D', textAlign:'center', marginTop:'1rem', lineHeight:1.6}}>
            By signing up you agree to our{' '}
            <Link to="/terms" style={s.link}>Terms</Link> and{' '}
            <Link to="/privacy" style={s.link}>Privacy Policy</Link>.
          </p>
        </form>

        <div style={{borderTop:'1px solid #E4EBE5', marginTop:'1.5rem', paddingTop:'1.5rem', textAlign:'center'}}>
          <p style={{fontSize:'.84rem', color:'#7B907D'}}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}