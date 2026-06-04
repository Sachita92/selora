import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useChat } from '../lib/ChatContext'
import { supabase } from '../lib/supabase'
import ChatWidget from './ChatWidget'

const c = {
  green: '#5A8A67', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SidebarLayout() {
  const { user, activeStore, logout } = useAppContext()
  const { sessionId, sessions, selectSession, setOpen, startNewSession } = useChat()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const [editName, setEditName] = useState(user?.user_metadata?.name || '')
  const [editUsername, setEditUsername] = useState(user?.user_metadata?.username || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Wait until user is loaded
  if (!user) return null

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  // Format time util
  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const { data, error } = await supabase.auth.updateUser({
      data: { name: editName, username: editUsername }
    })
    setSavingProfile(false)
    if (!error) {
      // Temporarily alert or just close
      // setShowProfile(false) // optional
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      
      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* ─── SIDEBAR ───────────────────────────────────────────────────────── */}
      <div style={{
        width: 280,
        background: c.card,
        borderRight: `1px solid ${c.border}`,
        display: sidebarOpen ? 'flex' : 'none',
        flexDirection: 'column',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        height: '100vh',
        zIndex: 50,
        top: 0, left: 0,
      }}>
        {/* LOGO & TOGGLE */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 600, color: c.dark, textDecoration: 'none' }}>
            Se<span style={{ color: c.green }}>lo</span>ra
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', padding: '.2rem' }}
            title="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        </div>

        {/* NAVIGATION */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {[
            { name: 'Dashboard', path: '/dashboard', icon: '📊' },
            { name: 'Products', path: '/products', icon: '🛍️' },
            { name: 'Connect', path: '/connect', icon: '🔗' },
            { name: 'Settings', path: '/settings', icon: '⚙️' },
          ].map(nav => {
            const active = location.pathname === nav.path
            return (
              <Link key={nav.name} to={nav.path} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .8rem',
                borderRadius: 8, textDecoration: 'none',
                background: active ? c.bg2 : 'transparent',
                color: active ? c.dark : c.muted,
                fontWeight: active ? 600 : 500,
                fontSize: '.85rem', transition: 'all .2s'
              }}>
                <span>{nav.icon}</span>
                {nav.name}
              </Link>
            )
          })}
        </div>

        {/* CHAT HISTORY */}
        <div style={{ padding: '1rem', borderTop: `1px solid ${c.border}`, flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Chat History
            </div>
            {/* The + New button was moved inside the chat widget, but keeping a quick icon here is nice */}
            <button 
              onClick={() => { startNewSession(activeStore?.id); setOpen(true) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.green, fontSize: '1rem' }}
              title="New Chat"
            >
              +
            </button>
          </div>
          
          {sessions.length === 0 ? (
            <p style={{ fontSize: '.75rem', color: c.muted, lineHeight: 1.6 }}>
              No chats yet. Click the agent widget to start.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {sessions.map((sess) => (
                <div 
                  key={sess.session_id} 
                  onClick={() => { selectSession(sess.session_id, activeStore?.id); setOpen(true) }}
                  style={{
                    padding: '.5rem .6rem',
                    background: sessionId === sess.session_id ? c.bg2 : 'transparent',
                    border: `1px solid ${sessionId === sess.session_id ? c.border : 'transparent'}`,
                    borderRadius: 6, cursor: 'pointer', transition: 'all .15s'
                  }}
                >
                  <div style={{ fontSize: '.75rem', color: c.dark, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sess.last_message?.length > 40 ? sess.last_message.substring(0, 40) + '...' : sess.last_message}
                  </div>
                  <div style={{ fontSize: '.65rem', color: c.muted, marginTop: '.2rem' }}>
                    {new Date(sess.last_active).toLocaleDateString()} {formatTime(sess.last_active)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBSCRIPTION */}
        <div style={{ padding: '1rem', borderTop: `1px solid ${c.border}`, background: c.bg2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.dark }}>
              {user.subscription_plan ? (user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)) : 'Free'} Plan
            </div>
            {(!user.subscription_plan || user.subscription_plan === 'free') && (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/billing/create-checkout`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_id: user.id, email: user.email, plan: 'growth' })
                    })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                    else alert("Stripe session creation failed")
                  } catch (e) { alert("Error launching checkout session") }
                }}
                style={{ background: c.green, color: '#fff', border: 'none', padding: '.2rem .6rem', borderRadius: 4, fontSize: '.65rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Upgrade
              </button>
            )}
          </div>
          <div style={{ fontSize: '.68rem', color: c.muted }}>
            {user.subscription_plan === 'free' || !user.subscription_plan ? 'Limit: 3 optimizations/mo' : 
             user.subscription_plan === 'growth' ? 'Limit: 30 optimizations/mo' : 'Unlimited optimizations'}
          </div>
          {user.stripe_customer_id && (
            <button 
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/billing/portal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id })
                  })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                } catch (e) { alert("Failed to open billing portal") }
              }}
              style={{ background: 'none', border: 'none', color: c.green, fontSize: '.7rem', cursor: 'pointer', padding: 0, marginTop: '.5rem', textDecoration: 'underline' }}
            >
              Manage Billing
            </button>
          )}
        </div>

        {/* USER PROFILE */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            style={{
              padding: '1rem', borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '.6rem',
              cursor: 'pointer', transition: 'background .2s', background: showProfile ? c.bg2 : 'transparent'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: c.green, color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 600
            }}>
              {(user.user_metadata?.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.user_metadata?.name || 'Seller'}
              </div>
              <div style={{ fontSize: '.7rem', color: c.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* POPOVER */}
          {showProfile && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowProfile(false)} />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + .5rem)', left: '1rem', right: '1rem', zIndex: 100,
                background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '1rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '.65rem', color: c.muted, marginBottom: '.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Name</label>
                    <input 
                      value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ width: '100%', padding: '.4rem .6rem', borderRadius: 6, border: `1px solid ${c.border}`, fontSize: '.75rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.65rem', color: c.muted, marginBottom: '.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Username</label>
                    <input 
                      value={editUsername} onChange={e => setEditUsername(e.target.value)}
                      style={{ width: '100%', padding: '.4rem .6rem', borderRadius: 6, border: `1px solid ${c.border}`, fontSize: '.75rem', outline: 'none' }}
                    />
                  </div>
                  <button 
                    onClick={handleSaveProfile} disabled={savingProfile}
                    style={{ background: c.green, color: '#fff', border: 'none', padding: '.4rem', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', marginTop: '.2rem' }}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '.8rem', marginBottom: '1rem', fontSize: '.72rem', color: c.muted, wordBreak: 'break-all' }}>
                  {user.email}
                </div>
                <button 
                  onClick={handleSignOut}
                  style={{
                    width: '100%', padding: '.5rem', border: `1px solid ${c.border}`, background: c.bg,
                    borderRadius: 6, fontSize: '.75rem', color: '#DC2626', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
        
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute', top: '1.2rem', left: '1.2rem', zIndex: 50,
              background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
              padding: '.4rem', cursor: 'pointer', color: c.dark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            title="Open sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        )}

        <div style={{ paddingTop: !sidebarOpen ? '3.5rem' : 0 }}>
          <Outlet />
        </div>
        <ChatWidget storeId={activeStore?.id} />
      </div>

    </div>
  )
}
