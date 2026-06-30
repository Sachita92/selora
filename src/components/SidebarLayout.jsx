import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useChat } from '../lib/ChatContext'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'

const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SidebarLayout() {
  const { user, stores, activeStore, setActiveStore, logout } = useAppContext()
  const { sessionId, sessions, selectSession, setOpen, startNewSession } = useChat()
  const navigate = useNavigate()
  const location = useLocation()
  const [darkMode, toggleTheme] = useDarkMode()
  
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setIsCollapsed(true)
    }
  }, [location.pathname])
  
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

      {/* ─── SIDEBAR CONTAINER SPACER (Desktop only) ────────────────────────── */}
      {!isMobile && sidebarOpen && (
        <div style={{ width: 76, flexShrink: 0, height: '100vh' }} />
      )}

      {/* ─── SIDEBAR ───────────────────────────────────────────────────────── */}
      <div 
        onMouseEnter={() => { if (!isMobile) setIsCollapsed(false) }}
        onMouseLeave={() => { if (!isMobile) setIsCollapsed(true) }}
        style={{
          width: isMobile ? 280 : (isCollapsed ? 76 : 280),
          background: c.card,
          borderRight: `1px solid ${c.border}`,
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'absolute',
          height: '100vh',
          zIndex: 51,
          top: 0, left: 0,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: (!isMobile && !isCollapsed) ? '6px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {/* LOGO & TOGGLE */}
        <div style={{ 
          padding: '1.2rem 1.5rem', 
          borderBottom: `1px solid ${c.border}`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
          height: '62px',
          boxSizing: 'border-box'
        }}>
          {isCollapsed && !isMobile ? (
            <Link to="/" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 700, color: c.green, textDecoration: 'none' }}>
              Se
            </Link>
          ) : (
            <Link to="/" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 600, color: c.dark, textDecoration: 'none' }}>
              Se<span style={{ color: c.green }}>lo</span>ra
            </Link>
          )}
          
          <button 
            onClick={() => isMobile ? setSidebarOpen(false) : setIsCollapsed(!isCollapsed)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: c.muted, 
              display: 'flex', 
              alignItems: 'center', 
              padding: '.25rem',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            title={isMobile ? "Close sidebar" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
            onMouseEnter={(e) => e.currentTarget.style.background = c.bg2}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {isMobile ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            ) : isCollapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            )}
          </button>
        </div>
        {/* NAVIGATION */}
        <div style={{ padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {[
            { 
              name: 'Dashboard', 
              path: '/dashboard', 
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                  <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                  <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
              )
            },
            { 
              name: 'Products', 
              path: '/products', 
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              )
            },
          ].map(nav => {
            const active = location.pathname === nav.path
            return (
              <Link 
                key={nav.name} 
                to={nav.path} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                  gap: isCollapsed && !isMobile ? '0' : '.75rem', 
                  padding: isCollapsed && !isMobile ? '.75rem' : '.65rem 1rem',
                  borderRadius: 10, 
                  textDecoration: 'none',
                  background: active ? 'var(--bg-2)' : 'transparent',
                  color: active ? c.dark : c.muted,
                  fontWeight: active ? 600 : 500,
                  fontSize: '.88rem', 
                  transition: 'all 0.2s ease',
                  borderLeft: active ? `3px solid ${c.green}` : '3px solid transparent',
                  borderTopLeftRadius: active ? 0 : 10,
                  borderBottomLeftRadius: active ? 0 : 10,
                  boxShadow: 'none',
                }}
                title={isCollapsed && !isMobile ? nav.name : undefined}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = c.bg2
                    e.currentTarget.style.color = c.dark
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = c.muted
                  }
                }}
              >
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: active ? c.green : c.muted,
                  transition: 'color 0.2s'
                }}>
                  {nav.icon}
                </span>
                {(!isCollapsed || isMobile) && <span>{nav.name}</span>}
              </Link>
            )
          })}

          {/* Theme Toggler Link-styled Button */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
              gap: isCollapsed && !isMobile ? '0' : '.75rem',
              padding: isCollapsed && !isMobile ? '.75rem' : '.65rem 1rem',
              borderRadius: 10,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.muted,
              fontWeight: 500,
              fontSize: '.88rem',
              transition: 'all 0.2s ease',
              width: '100%',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'left'
            }}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.bg2
              e.currentTarget.style.color = c.dark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = c.muted
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {darkMode ? (
                // Sun Icon
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                // Moon Icon
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </span>
            {(!isCollapsed || isMobile) && <span style={{ marginLeft: isCollapsed && !isMobile ? '0' : '.75rem' }}>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>

        {/* CONNECTED STORES */}
        {(!isCollapsed || isMobile) ? (
          <div style={{ padding: '1rem', borderTop: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Connected Stores
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxHeight: '110px', overflowY: 'auto' }} className="no-scrollbar">
              {stores.map(store => {
                const isActive = activeStore?.id === store.id;
                return (
                  <div 
                    key={store.id}
                    onClick={() => setActiveStore(store)}
                    style={{
                      padding: '.4rem .5rem',
                      background: isActive ? 'var(--bg-2)' : 'transparent',
                      border: `1px solid ${isActive ? c.border : 'transparent'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all .15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = c.bg2;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.78rem', color: c.dark, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {store.shop_name}
                      </div>
                    </div>
                    {isActive && (
                      <span 
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: c.green,
                          marginLeft: '.4rem',
                        }}
                        className="pdot"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Collapsed representation */
          <div style={{ padding: '1rem 0', borderTop: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem' }}>
            {stores.map(store => {
              const isActive = activeStore?.id === store.id;
              if (!isActive) return null;
              return (
                <div 
                  key={store.id}
                  onClick={() => {
                    const idx = stores.findIndex(s => s.id === store.id);
                    const nextStore = stores[(idx + 1) % stores.length];
                    setActiveStore(nextStore);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: c.green,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={`Active: ${store.shop_name} (Click to switch)`}
                >
                  {store.shop_name.charAt(0).toUpperCase()}
                </div>
              );
            })}
          </div>
        )}

        {/* CHAT HISTORY */}
        {isCollapsed && !isMobile ? (
          <div style={{ padding: '1.2rem 0', borderTop: `1px solid ${c.border}`, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => { startNewSession(activeStore?.id); setOpen(true) }}
              style={{ 
                background: c.bg2, 
                border: `1px solid ${c.border}`, 
                cursor: 'pointer', 
                color: c.green, 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="New Chat Session"
              onMouseEnter={(e) => e.currentTarget.style.background = '#EAF2EC'}
              onMouseLeave={(e) => e.currentTarget.style.background = c.bg2}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem', borderTop: `1px solid ${c.border}`, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Chat History
              </div>
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
        )}

        {/* SUBSCRIPTION */}
        {isCollapsed && !isMobile ? (
          <div 
            onClick={() => {
              if (!user.subscription_plan || user.subscription_plan === 'free') {
                navigate('/pricing')
              } else {
                navigate('/settings?tab=billing')
              }
            }}
            style={{ 
              padding: '1.2rem 0', 
              borderTop: `1px solid ${c.border}`, 
              background: c.bg2,
              display: 'flex',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title={`${user.subscription_plan ? (user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)) : 'Free'} Plan — Click to Manage`}
            onMouseEnter={(e) => e.currentTarget.style.background = '#EAF2EC'}
            onMouseLeave={(e) => e.currentTarget.style.background = c.bg2}
          >
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: user.subscription_plan && user.subscription_plan !== 'free' ? 'var(--badge-upgrade-bg)' : 'var(--badge-success-bg)', 
              color: user.subscription_plan && user.subscription_plan !== 'free' ? 'var(--badge-upgrade-text)' : 'var(--badge-success-text)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '.85rem', 
              fontWeight: 700 
            }}>
              {user.subscription_plan && user.subscription_plan !== 'free' ? 'G' : 'F'}
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', borderTop: `1px solid ${c.border}`, background: c.bg2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.dark }}>
                {user.subscription_plan ? (user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)) : 'Free'} Plan
              </div>
              {(!user.subscription_plan || user.subscription_plan === 'free') && (
                <button 
                  onClick={() => navigate('/pricing')}
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
                onClick={() => navigate('/settings?tab=billing')}
                style={{ background: 'none', border: 'none', color: c.green, fontSize: '.7rem', cursor: 'pointer', padding: 0, marginTop: '.5rem', textDecoration: 'underline' }}
              >
                Manage Billing
              </button>
            )}
          </div>
        )}

        {/* USER PROFILE */}
        <div style={{ position: 'relative' }}>
          {isCollapsed && !isMobile ? (
            <div 
              onClick={() => setShowProfile(!showProfile)}
              style={{
                padding: '1.2rem 0', 
                borderTop: `1px solid ${c.border}`, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                cursor: 'pointer', 
                transition: 'background .2s', 
                background: showProfile ? c.bg2 : 'transparent'
              }}
              title={user.user_metadata?.name || 'Seller Profile'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.green, color: '#fff', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 600
              }}>
                {(user.user_metadata?.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
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
          )}

          {/* POPOVER */}
          {showProfile && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowProfile(false)} />
              <div style={{
                position: 'absolute', 
                bottom: 'calc(100% + .5rem)', 
                left: isCollapsed && !isMobile ? '0.5rem' : '1rem', 
                right: isCollapsed && !isMobile ? 'auto' : '1rem',
                width: isCollapsed && !isMobile ? '230px' : 'auto',
                zIndex: 100,
                background: 'var(--bg-1)', border: `1px solid ${c.border}`, borderRadius: 12, padding: '1rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
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
                 <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.4rem',
                    width: '100%',
                    padding: '.5rem',
                    border: `1px solid ${c.border}`,
                    background: 'var(--bg-1)',
                    borderRadius: 6,
                    fontSize: '.75rem',
                    color: c.dark,
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    marginBottom: '.4rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.bg2;
                  }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'var(--bg-1)';
                   }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Account Settings
                </Link>
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
      </div>

    </div>
  )
}
