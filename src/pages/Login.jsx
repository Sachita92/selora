import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page:    { minHeight:'100vh', background:'linear-gradient(170deg,#EEF4EF 0%,#F8FAF8 55%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'2rem', position:'relative' },
  card:    { background:'#fff', border:'1px solid #E4EBE5', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 18px 55px rgba(90,138,103,.08)' },
  logo:    { fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:600, color:'#1A271C', textDecoration:'none', display:'block', marginBottom:'2rem', textAlign:'center', letterSpacing:'-.3px' },
  title:   { fontFamily:'Fraunces, serif', fontSize:'1.6rem', fontWeight:500, color:'#1A271C', marginBottom:'.4rem', letterSpacing:'-.3px' },
  sub:     { fontSize:'.85rem', color:'#7B907D', marginBottom:'1.8rem', fontWeight:300, lineHeight:1.6 },
  label:   { display:'block', fontSize:'.75rem', fontWeight:600, color:'#2E3D30', marginBottom:'.4rem', letterSpacing:'.04em', textTransform:'uppercase' },
  input:   { width:'100%', padding:'.75rem 1rem', border:'1px solid #E4EBE5', borderRadius:8, fontSize:'.9rem', color:'#1A271C', fontFamily:'Inter, sans-serif', outline:'none', transition:'border .2s', background:'#FAFAF8' },
  btn:     { width:'100%', padding:'.82rem', background:'#5A8A67', color:'#fff', border:'none', borderRadius:8, fontSize:'.9rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all .2s', marginTop:'.5rem' },
  err:     { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', color:'#DC2626', marginBottom:'1rem' },
  divider: { display:'flex', alignItems:'center', gap:'1rem', margin:'1.5rem 0' },
  link:    { fontSize:'.82rem', color:'#5A8A67', textDecoration:'none', fontWeight:500 },
  backBtn: { position:'absolute', top:'2rem', left:'2.5rem', fontSize:'.85rem', color:'#7B907D', textDecoration:'none', fontWeight:500, display:'flex', alignItems:'center', gap:'.4rem', transition:'color .2s' }
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard')
      }
    })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
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

        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your Selora account to manage your fashion stores.</p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={handleLogin}>
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

          <div style={{marginBottom:'1.2rem'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.4rem'}}>
              <label style={s.label}>Password</label>
              <Link to="/forgot-password" style={{...s.link, fontSize:'.72rem'}}>Forgot password?</Link>
            </div>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={s.divider}>
          <div style={{flex:1, height:1, background:'#E4EBE5'}}/>
          <span style={{fontSize:'.75rem', color:'#7B907D'}}>or</span>
          <div style={{flex:1, height:1, background:'#E4EBE5'}}/>
        </div>

        <p style={{textAlign:'center', fontSize:'.84rem', color:'#7B907D'}}>
          Don't have an account?{' '}
          <Link to="/signup" style={s.link}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}