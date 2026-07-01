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
  
  const [showProfile, setShowProfile]           = useState(false)
  const [headerAvatarOpen, setHeaderAvatarOpen]  = useState(false)
  const [sidebarOpen, setSidebarOpen]            = useState(window.innerWidth >= 768)
  const [isMobile, setIsMobile]                  = useState(window.innerWidth < 768)
  const [isCollapsed, setIsCollapsed]            = useState(true)
  const [rightPanelOpen, setRightPanelOpen]      = useState(false)
  const [panelRunning, setPanelRunning]          = useState(false)
  const [latestRunAt, setLatestRunAt]            = useState(null)

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

  // Close right panel on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && rightPanelOpen) setRightPanelOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [rightPanelOpen])

  // Fetch latest run timestamp for the right panel's next-run line
  useEffect(() => {
    if (!activeStore) { setLatestRunAt(null); return }
    fetch(`${API_URL}/api/stores/${activeStore.id}/reports`)
      .then(r => r.json())
      .then(d => setLatestRunAt(d.reports?.[0]?.created_at || null))
      .catch(() => {})
  }, [activeStore])
  
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

  // Run agent from the right panel
  const runAgentFromPanel = async () => {
    if (!activeStore || panelRunning) return
    setPanelRunning(true)
    try {
      await fetch(`${API_URL}/api/agent/run/${activeStore.id}?dry_run=false`, { method: 'POST' })
      setTimeout(() => {
        fetch(`${API_URL}/api/stores/${activeStore.id}/reports`)
          .then(r => r.json())
          .then(d => setLatestRunAt(d.reports?.[0]?.created_at || null))
          .catch(() => {})
        window.dispatchEvent(new CustomEvent('selora-action-taken', { detail: { storeId: activeStore.id } }))
        setPanelRunning(false)
      }, 6000)
    } catch (e) { console.error(e); setPanelRunning(false) }
  }

  // Next-run text derived from last run timestamp + ~60 min cycle
  const getNextRunText = () => {
    if (!latestRunAt) return 'Runs automatically every night'
    const next = new Date(new Date(latestRunAt).getTime() + 60 * 60 * 1000)
    const now  = new Date()
    if (next <= now) return 'Runs automatically every night'
    const mins = Math.floor((next - now) / 60000)
    if (mins < 60) return `Next run in ~${mins}m`
    return `Next run in ~${Math.floor(mins / 60)}h`
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      
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
            {
              name: 'Reports',
              path: '/reports',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              )
            },
            {
              name: 'Settings',
              path: '/settings',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/>
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

        {/* USER PROFILE — identity display only, actions are in the header dropdown */}
        <div style={{ borderTop: `1px solid ${c.border}` }}>
          {isCollapsed && !isMobile ? (
            // Collapsed: just the avatar circle as a visual anchor
            <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.green, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 600
              }} title={user.user_metadata?.name || user.email}>
                {(user.user_metadata?.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            // Expanded: avatar + name + email as static text
            <div style={{ padding: '.85rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.green, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 600, flexShrink: 0
              }}>
                {(user.user_metadata?.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.user_metadata?.name || 'Seller'}
                </div>
                <div style={{ fontSize: '.7rem', color: c.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── TOP HEADER BAR ──────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: c.card,
          borderBottom: `1px solid ${c.border}`,
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '.75rem',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>

          {/* Mobile: hamburger */}
          {isMobile && !sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.dark, display: 'flex', alignItems: 'center', padding: '.25rem', borderRadius: 6 }}
              title="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          {/* Store status pill */}
          {activeStore ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: 'var(--bg-2)', border: `1px solid ${c.border}`, borderRadius: 999, padding: '.28rem .85rem', flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.green, display: 'inline-block' }} className="pdot" />
              <span style={{ fontSize: '.78rem', fontWeight: 500, color: c.dark, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeStore.shop_name}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: 'var(--bg-2)', border: `1px solid ${c.border}`, borderRadius: 999, padding: '.28rem .85rem', flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
              <span style={{ fontSize: '.78rem', fontWeight: 500, color: c.muted, whiteSpace: 'nowrap' }}>No store connected</span>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Agent panel toggle — left of bell */}
          <button
            onClick={() => setRightPanelOpen(o => !o)}
            style={{
              background: rightPanelOpen ? c.green : 'none',
              border: rightPanelOpen ? 'none' : 'none',
              color: rightPanelOpen ? '#fff' : c.muted,
              display: 'flex', alignItems: 'center', padding: '.35rem .4rem',
              borderRadius: 8, transition: 'all 0.2s', flexShrink: 0, cursor: 'pointer',
            }}
            title={rightPanelOpen ? 'Close agent panel' : 'Open agent panel'}
            onMouseEnter={e => { if (!rightPanelOpen) e.currentTarget.style.color = c.dark }}
            onMouseLeave={e => { if (!rightPanelOpen) e.currentTarget.style.color = c.muted }}
          >
            {/* Bot / agent icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
              <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </button>

          {/* Notification bell */}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', padding: '.35rem', borderRadius: 8, transition: 'color 0.2s', flexShrink: 0 }}
            title="Notifications"
            onMouseEnter={e => e.currentTarget.style.color = c.dark}
            onMouseLeave={e => e.currentTarget.style.color = c.muted}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => setHeaderAvatarOpen(!headerAvatarOpen)}
              style={{
                width: 34, height: 34, borderRadius: '50%', background: c.green, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none',
              }}
              title={user.user_metadata?.name || 'Profile'}
            >
              {(user.user_metadata?.name || user.email || '?').charAt(0).toUpperCase()}
            </div>

            {headerAvatarOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setHeaderAvatarOpen(false)} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + .6rem)', right: 0,
                  width: 210, zIndex: 100,
                  background: 'var(--bg-1)', border: `1px solid ${c.border}`,
                  borderRadius: 12, padding: '.6rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
                }}>
                  <div style={{ padding: '.5rem .7rem', marginBottom: '.3rem' }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark }}>
                      {user.user_metadata?.name || 'Seller'}
                    </div>
                    <div style={{ fontSize: '.7rem', color: c.muted, marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${c.border}`, margin: '.3rem 0' }} />
                  {[
                    { label: 'Help & Support', path: '/support',
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    },
                  ].map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setHeaderAvatarOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem .7rem', borderRadius: 8, textDecoration: 'none', color: c.dark, fontSize: '.8rem', fontWeight: 500, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: c.muted, display: 'flex' }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: `1px solid ${c.border}`, margin: '.3rem 0' }} />
                  <button
                    onClick={handleSignOut}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem .7rem', borderRadius: 8, border: 'none', background: 'transparent', color: '#DC2626', fontSize: '.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── OUTLET ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>

      </div>

      {/* ─── RIGHT AGENT PANEL ─────────────────────────────────────────────── */}
      {/* Width-transition approach: panel is always in the flex row,
          width animates 0 → 280px so main content compresses, not overlaps. */}
      <div style={{
        width: rightPanelOpen ? 280 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}>
        {/* Inner wrapper keeps the panel at fixed 280px inside the collapsing outer */}
        <div style={{
          width: 280,
          height: '100vh',
          background: c.card,
          borderLeft: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Panel header */}
          <div style={{
            height: 62,
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Selora Agent</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeStore ? c.green : '#D97706', display: 'inline-block', flexShrink: 0 }} className="pdot" />
              <span style={{ fontSize: '.72rem', color: c.muted }}>{activeStore ? 'Active' : 'Paused'}</span>
            </div>
            <button
              onClick={() => setRightPanelOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, display: 'flex', padding: '.25rem', borderRadius: 6 }}
              title="Close panel"
              onMouseEnter={e => e.currentTarget.style.color = c.dark}
              onMouseLeave={e => e.currentTarget.style.color = c.muted}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.25rem', overflowY: 'auto' }}>

            {/* Agent avatar — large, centered */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${c.green}, #3D6B52)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', flexShrink: 0,
              boxShadow: '0 4px 20px rgba(95,141,118,0.3)',
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
                <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
              </svg>
            </div>

            {/* Store name + next run */}
            {activeStore && (
              <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: c.dark }}>
                  {activeStore.shop_name}
                </div>
              </div>
            )}
            <div style={{ fontSize: '.72rem', color: c.muted, textAlign: 'center', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {getNextRunText()}
            </div>

            {/* Run Agent Now CTA */}
            {activeStore && (
              <button
                onClick={runAgentFromPanel}
                disabled={panelRunning}
                style={{
                  width: '100%', padding: '.75rem', borderRadius: 10, border: 'none',
                  background: panelRunning ? '#7B907D' : c.green,
                  color: '#fff', fontSize: '.84rem', fontWeight: 600,
                  cursor: panelRunning ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                  transition: 'background 0.2s',
                  marginBottom: '.85rem',
                }}
              >
                {panelRunning ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Agent Running...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Run Agent Now
                  </>
                )}
              </button>
            )}

            {/* Spacer pushes placeholder to bottom */}
            <div style={{ flex: 1 }} />

            {/* Chat coming soon placeholder */}
            <div style={{
              textAlign: 'center', padding: '1rem',
              borderTop: `1px solid ${c.border}`,
              width: '100%',
            }}>
              <div style={{ fontSize: '.72rem', color: c.muted, lineHeight: 1.5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '.3rem' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Ask Selora anything — coming soon
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
