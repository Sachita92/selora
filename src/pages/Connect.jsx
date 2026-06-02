import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const s = {
  page:   { minHeight:'100vh', background:'#F8FAF8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:'2rem' },
  card:   { background:'#fff', border:'1px solid #E4EBE5', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:480 },
  logo:   { fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:600, color:'#1A271C', textDecoration:'none', display:'block', marginBottom:'2rem', textAlign:'center' },
  title:  { fontFamily:'Fraunces, serif', fontSize:'1.6rem', fontWeight:500, color:'#1A271C', marginBottom:'.4rem', letterSpacing:'-.3px' },
  sub:    { fontSize:'.85rem', color:'#7B907D', marginBottom:'2rem', fontWeight:300, lineHeight:1.7 },
  label:  { display:'block', fontSize:'.75rem', fontWeight:600, color:'#2E3D30', marginBottom:'.4rem', letterSpacing:'.04em', textTransform:'uppercase' },
  row:    { display:'flex', gap:'.5rem', marginBottom:'.5rem' },
  prefix: { padding:'.75rem 1rem', background:'#F1F5F1', border:'1px solid #E4EBE5', borderRadius:'8px 0 0 8px', fontSize:'.85rem', color:'#7B907D', whiteSpace:'nowrap', display:'flex', alignItems:'center' },
  input:  { flex:1, padding:'.75rem 1rem', border:'1px solid #E4EBE5', borderLeft:'none', borderRadius:'0 8px 8px 0', fontSize:'.9rem', color:'#1A271C', fontFamily:'Inter, sans-serif', outline:'none', background:'#FAFAF8' },
  hint:   { fontSize:'.75rem', color:'#7B907D', marginBottom:'1.5rem', fontWeight:300 },
  btn:    { width:'100%', padding:'.82rem', background:'#5A8A67', color:'#fff', border:'none', borderRadius:8, fontSize:'.9rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all .2s' },
  err:    { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.75rem 1rem', fontSize:'.82rem', color:'#DC2626', marginBottom:'1rem' },
  perms:  { background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'1.2rem', marginBottom:'1.5rem' },
}

const PERMISSIONS = [
  { icon:'💰', text:'Read and update product prices' },
  { icon:'📦', text:'Read orders and inventory levels' },
  { icon:'📊', text:'Access sales analytics and reports' },
  { icon:'✍️', text:'Update product titles and descriptions' },
]

export default function Connect() {
  const [shop, setShop]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [email, setEmail]     = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email)
      }
    })
  }, [])

  const handleConnect = (e) => {
    e.preventDefault()
    setError('')

    // Clean up the shop input
    let shopUrl = shop.trim()
      .replace('https://', '')
      .replace('http://', '')
      .replace('.myshopify.com', '')
      .trim()

    if (!shopUrl) {
      setError('Please enter your Shopify store URL')
      return
    }

    setLoading(true)

    // Redirect to backend OAuth install endpoint with user email
    window.location.href = `${API_URL}/install?shop=${shopUrl}.myshopify.com&email=${encodeURIComponent(email)}`
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          Se<span style={{color:'#5A8A67'}}>lo</span>ra
        </Link>

        <h1 style={s.title}>Connect your store</h1>
        <p style={s.sub}>
          Enter your Shopify store URL below. You'll be redirected to Shopify to approve access — it takes about 30 seconds.
        </p>

        {error && <div style={s.err}>{error}</div>}

        {/* Permissions preview */}
        <div style={s.perms}>
          <p style={{fontSize:'.75rem', fontWeight:600, color:'#166534', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.8rem'}}>
            Selora will be able to:
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
            {PERMISSIONS.map(p => (
              <div key={p.text} style={{display:'flex', alignItems:'center', gap:'.6rem', fontSize:'.82rem', color:'#2E3D30', fontWeight:300}}>
                <span>{p.icon}</span>{p.text}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleConnect}>
          <label style={s.label}>Your Shopify Store URL</label>
          <div style={s.row}>
            <div style={s.prefix}>https://</div>
            <input
              style={s.input}
              type="text"
              placeholder="your-store"
              value={shop}
              onChange={e => setShop(e.target.value)}
              required
            />
            <div style={{...s.prefix, borderLeft:'none', borderRadius:'0 8px 8px 0', background:'#F1F5F1'}}>.myshopify.com</div>
          </div>
          <p style={s.hint}>
            Find this in your Shopify admin URL. Example: <strong>my-fashion-store</strong>.myshopify.com
          </p>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Redirecting to Shopify...' : 'Connect Store →'}
          </button>
        </form>

        <p style={{fontSize:'.75rem', color:'#7B907D', textAlign:'center', marginTop:'1.2rem', lineHeight:1.6, fontWeight:300}}>
          🔒 Your store credentials are encrypted and never shared.<br/>
          You can disconnect at any time from your dashboard.
        </p>

        <div style={{borderTop:'1px solid #E4EBE5', marginTop:'1.5rem', paddingTop:'1.2rem', textAlign:'center'}}>
          <Link to="/dashboard" style={{fontSize:'.82rem', color:'#7B907D', textDecoration:'none'}}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}