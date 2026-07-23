import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useChat } from '../lib/ChatContext'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'
import { useAuth } from '../lib/useAuth'

const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getGreeting = () => {
  const hr = new Date().getHours()
  if (hr < 12) return 'Good morning'
  if (hr < 18) return 'Good afternoon'
  return 'Good evening'
}

const getDisplayName = (u) => {
  if (!u) return 'Seller'
  const nameVal = u.display_name || u.user_metadata?.display_name || u.user_metadata?.name
  if (nameVal) return nameVal
  if (u.email && !u.email.endsWith('@selora.io')) return u.email
  if (u.wallet_address) {
    const w = u.wallet_address
    return w.length > 8 ? `${w.slice(0, 4)}...${w.slice(-4)}` : w
  }
  if (u.email) return u.email
  return 'Seller'
}

export default function SidebarLayout() {
  const { user, stores, activeStore, setActiveStore, orders } = useAppContext()
  const { logout } = useAuth()
  const { messages, loading: chatLoading, sendMessage, loadHistory, loadSessions, sessionId, sessions, selectSession, setOpen, startNewSession, deleteSession, renameSession, pinSession, pendingDelete, setPendingDelete } = useChat()
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
  
  const [lastCheckedTime, setLastCheckedTime] = useState(() => {
    if (!activeStore) return new Date().toISOString()
    const saved = localStorage.getItem(`last_checked_orders_${activeStore.id}`)
    if (!saved) {
      const nowStr = new Date().toISOString()
      localStorage.setItem(`last_checked_orders_${activeStore.id}`, nowStr)
      return nowStr
    }
    return saved
  })

  useEffect(() => {
    if (activeStore) {
      const saved = localStorage.getItem(`last_checked_orders_${activeStore.id}`)
      if (!saved) {
        const nowStr = new Date().toISOString()
        localStorage.setItem(`last_checked_orders_${activeStore.id}`, nowStr)
        setLastCheckedTime(nowStr)
      } else {
        setLastCheckedTime(saved)
      }
    }
  }, [activeStore])

  const unreadCount = activeStore && orders
    ? orders.filter(o => o.status === 'paid' && new Date(o.created_at) > new Date(lastCheckedTime)).length
    : 0

  const handleNotificationsClick = () => {
    if (!activeStore) return
    const nowStr = new Date().toISOString()
    localStorage.setItem(`last_checked_orders_${activeStore.id}`, nowStr)
    setLastCheckedTime(nowStr)
  }

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

  const [inputText, setInputText] = useState('')
  const [agentCardCollapsed, setAgentCardCollapsed] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [renamingSessionId, setRenamingSessionId] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const messagesEndRef = useRef(null)

  // Load chat history and sessions when active store changes
  useEffect(() => {
    if (activeStore) {
      loadHistory(activeStore.id)
      loadSessions(activeStore.id)
    }
  }, [activeStore])

  // Scroll to bottom of message list on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || chatLoading || !activeStore) return

    const text = inputText.trim()
    setInputText('')

    // Cross-store detection: if user mentions a different store by name, switch to it first
    if (stores?.length > 1) {
      const lowerText = text.toLowerCase()
      const mentionedStore = stores.find(st => {
        const name = (st.shop_name || '').toLowerCase().trim()
        return name && name !== (activeStore?.shop_name || '').toLowerCase().trim() && lowerText.includes(name)
      })
      if (mentionedStore) {
        setActiveStore(mentionedStore)
        navigate('/dashboard')
        await sendMessage(text, mentionedStore.id)
        return
      }
    }

    sendMessage(text, activeStore.id)
  }

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
      <style>{`
        @media (max-width: 768px) {
          .sf-dashboard-header {
            padding: 0 0.5rem !important;
            gap: 0.35rem !important;
          }
          .sf-store-status-name {
            max-width: 80px !important;
          }
          .sf-store-status-pill {
            padding: 0.25rem 0.5rem !important;
            gap: 0.3rem !important;
          }
          .sf-agent-panel-outer {
            display: none !important;
          }
          .sf-agent-panel-outer.open {
            display: flex !important;
            width: 100vw !important;
            position: fixed !important;
            right: 0 !important;
            top: 0 !important;
            z-index: 1000 !important;
          }
          .sf-agent-panel-inner {
            width: 100vw !important;
          }
        }
        @media (max-width: 480px) {
          .sf-store-status-name {
            max-width: 50px !important;
          }
        }
      `}</style>
      
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
              name: 'Orders', 
              path: '/orders', 
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <path d="M12 11h4"></path>
                  <path d="M12 16h4"></path>
                  <path d="M8 11h.01"></path>
                  <path d="M8 16h.01"></path>
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
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )
            },
            {
              name: 'Connect Store',
              path: '/connect',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
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
                const platformLabel = store.platform === 'selora' ? 'Selora' : 'Shopify';
                const platformColor = store.platform === 'selora' ? '#5A8A67' : '#96bf48';

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
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span 
                        style={{
                          fontSize: '.62rem',
                          fontWeight: 700,
                          padding: '.15rem .35rem',
                          borderRadius: 4,
                          background: store.platform === 'selora' ? 'rgba(90,138,103,0.1)' : 'rgba(150,191,72,0.1)',
                          color: platformColor,
                          textTransform: 'uppercase',
                          letterSpacing: '.02em',
                          flexShrink: 0
                        }}
                      >
                        {platformLabel}
                      </span>
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

        {/* Spacer to push profile to bottom */}
        <div style={{ flex: 1 }} />

        {/* USER PROFILE — identity display only, actions are in the header dropdown */}
        <div style={{ borderTop: `1px solid ${c.border}` }}>
          {isCollapsed && !isMobile ? (
            // Collapsed: just the avatar circle as a visual anchor
            <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.green, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 600
              }} title={`${user.user_metadata?.name || 'Seller'} (${user.subscription_plan ? (user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)) : 'Free'})`}>
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
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: c.dark, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <span>{user.user_metadata?.name || 'Seller'}</span>
                  <span style={{
                    fontSize: '.68rem',
                    color: 'var(--g)',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    flexShrink: 0
                  }}>
                    ({user.subscription_plan || 'free'})
                  </span>
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
        }} className="sf-dashboard-header">

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

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Inline Greeting */}
          {!isMobile && user && (
            <span style={{ 
              fontSize: '1.05rem', 
              color: 'var(--text-primary)', 
              fontWeight: 700,
              marginRight: '1rem', 
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px'
            }}>
              {getGreeting()}, {getDisplayName(user)}
            </span>
          )}

          {/* Agent panel toggle — Replaced arrow with agent avatar */}
          <button
            onClick={() => {
              setRightPanelOpen(!rightPanelOpen);
              if (!rightPanelOpen) {
                setShowHistory(false);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '.25rem',
              borderRadius: '50%',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            title={rightPanelOpen ? "Close agent panel" : "Open agent panel"}
          >
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: rightPanelOpen ? 'rgba(90, 138, 103, 0.18)' : 'var(--bg-2)',
              border: `1px solid ${rightPanelOpen ? 'var(--g)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.05rem',
              transition: 'all 0.2s',
              boxShadow: rightPanelOpen ? '0 0 8px rgba(90, 138, 103, 0.25)' : 'none',
            }}>
              🤖
            </div>
          </button>

          {/* Notification bell */}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', padding: '.35rem', borderRadius: 8, transition: 'color 0.2s', flexShrink: 0, position: 'relative' }}
            title="Notifications"
            onClick={handleNotificationsClick}
            onMouseEnter={e => e.currentTarget.style.color = c.dark}
            onMouseLeave={e => e.currentTarget.style.color = c.muted}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#DC2626',
                color: '#fff',
                borderRadius: '50%',
                width: 14,
                height: 14,
                fontSize: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 4px rgba(220, 38, 38, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
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
                    { label: 'View Profile', path: '/profile',
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    },
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

           {/* Store status pill (moved to right after profile avatar) */}
          {activeStore ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: 'var(--bg-2)', border: `1px solid ${c.border}`, borderRadius: 999, padding: '.28rem .85rem', flexShrink: 0 }} className="sf-store-status-pill">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.green, display: 'inline-block' }} className="pdot" />
              <span style={{ fontSize: '.78rem', fontWeight: 500, color: c.dark, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} className="sf-store-status-name">
                {activeStore.shop_name}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: 'var(--bg-2)', border: `1px solid ${c.border}`, borderRadius: 999, padding: '.28rem .85rem', flexShrink: 0 }} className="sf-store-status-pill">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
              <span style={{ fontSize: '.78rem', fontWeight: 500, color: c.muted, whiteSpace: 'nowrap' }} className="sf-store-status-name">No store connected</span>
            </div>
          )}
        </header>

        {/* ── OUTLET ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>

      </div>

      {/* ─── RIGHT AGENT PANEL ─────────────────────────────────────────────── */}
      {/* Width-transition approach: panel is always in the flex row,
          width animates 0 → 380px so main content compresses, not overlaps. */}
      <div style={{
        width: rightPanelOpen ? 380 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }} className={"sf-agent-panel-outer" + (rightPanelOpen ? " open" : "")}>
        {/* Inner wrapper keeps the panel at fixed 380px inside the collapsing outer */}
        <div style={{
          width: 380,
          height: '100vh',
          background: c.card,
          borderLeft: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }} className="sf-agent-panel-inner">

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
              {showHistory ? (
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: c.green,
                    fontSize: '.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.2rem',
                    padding: '0', marginRight: '.5rem'
                  }}
                >
                  ← Chat
                </button>
              ) : (
                <>
                  <span style={{ fontSize: '.88rem', fontWeight: 600, color: c.dark }}>Selora Agent</span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeStore ? c.green : '#D97706', display: 'inline-block', flexShrink: 0 }} className="pdot" />
                  <span style={{ fontSize: '.72rem', color: c.muted }}>{activeStore ? 'Active' : 'Paused'}</span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <button
                onClick={() => {
                  const next = !showHistory
                  setShowHistory(next)
                  if (next && activeStore) {
                    loadSessions(activeStore.id)
                  }
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: showHistory ? c.green : c.muted,
                  display: 'flex', padding: '.3rem', borderRadius: 6,
                  alignItems: 'center', justifyContent: 'center'
                }}
                title={showHistory ? "Show Active Chat" : "Chat History"}
                onMouseEnter={e => { if(!showHistory) e.currentTarget.style.color = c.dark }}
                onMouseLeave={e => { if(!showHistory) e.currentTarget.style.color = c.muted }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
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
          </div>



          {/* Panel body */}
          {showHistory ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }} className="no-scrollbar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.8rem' }}>
                <div style={{ fontSize: '.75rem', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Chat History
                </div>
                <button 
                  onClick={() => { startNewSession(activeStore?.id); setShowHistory(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.green, fontSize: '.75rem', fontWeight: 600 }}
                  title="New Chat"
                >
                  + New Chat
                </button>
              </div>
              
              {sessions.length === 0 ? (
                <p style={{ fontSize: '.75rem', color: c.muted, lineHeight: 1.6 }}>
                  No chats yet. Ask the agent anything to start.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {sessions.map((sess) => {
                    const isEditing = renamingSessionId === sess.session_id
                    const isDeletingConfirm = deletingSessionId === sess.session_id
                    const isMenuOpen = activeMenuSessionId === sess.session_id
                    
                    return (
                      <div 
                        key={sess.session_id} 
                        style={{
                          padding: '.6rem .75rem',
                          background: sessionId === sess.session_id ? c.bg2 : 'transparent',
                          border: `1px solid ${sessionId === sess.session_id ? c.border : 'transparent'}`,
                          borderRadius: 8, 
                          transition: 'all .15s',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '.5rem',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          if (sessionId !== sess.session_id) e.currentTarget.style.background = c.bg2
                        }}
                        onMouseLeave={(e) => {
                          if (sessionId !== sess.session_id) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {isEditing ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.3rem' }} onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameText}
                              onChange={e => setRenameText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  renameSession(sess.session_id, activeStore?.id, renameText)
                                  setRenamingSessionId(null)
                                } else if (e.key === 'Escape') {
                                  setRenamingSessionId(null)
                                }
                              }}
                              autoFocus
                              style={{
                                flex: 1,
                                fontSize: '.78rem',
                                padding: '.2rem .4rem',
                                borderRadius: 4,
                                border: `1px solid ${c.green}`,
                                outline: 'none',
                                background: 'var(--bg-0)',
                                color: c.dark,
                              }}
                            />
                            <button
                              onClick={() => {
                                renameSession(sess.session_id, activeStore?.id, renameText)
                                setRenamingSessionId(null)
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.green, padding: '.2rem', display: 'flex', alignItems: 'center' }}
                              title="Save"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={() => setRenamingSessionId(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: '.2rem', display: 'flex', alignItems: 'center' }}
                              title="Cancel"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ) : isDeletingConfirm ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.3rem' }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: '.75rem', color: '#EF4444', fontWeight: 500 }}>Confirm delete?</span>
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button
                                onClick={() => {
                                  deleteSession(sess.session_id, activeStore?.id)
                                  setDeletingSessionId(null)
                                }}
                                style={{
                                  background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer',
                                  padding: '.2rem .5rem', borderRadius: 4, fontSize: '.7rem', fontWeight: 600
                                }}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeletingSessionId(null)}
                                style={{
                                  background: 'none', border: `1px solid ${c.border}`, color: c.dark, cursor: 'pointer',
                                  padding: '.2rem .5rem', borderRadius: 4, fontSize: '.7rem', fontWeight: 500
                                }}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Clickable Area to Select Session */}
                            <div 
                              onClick={() => { selectSession(sess.session_id, activeStore?.id); setShowHistory(false); }}
                              style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                            >
                              <div style={{ fontSize: '.78rem', color: c.dark, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                                {sess.pinned && (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: c.green, transform: 'rotate(45deg)', flexShrink: 0 }} title="Pinned">
                                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6l1.3 1.5 1.3-1.5v-6H18v-2l-2-2z"></path>
                                  </svg>
                                )}
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {sess.title || (sess.last_message?.length > 40 ? sess.last_message.substring(0, 40) + '...' : sess.last_message || 'Empty conversation')}
                                </span>
                              </div>
                              <div style={{ fontSize: '.65rem', color: c.muted, marginTop: '.2rem' }}>
                                {new Date(sess.last_active).toLocaleDateString()} {formatTime(sess.last_active)}
                              </div>
                            </div>
                            
                            {/* 3-Dot Button */}
                            <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setActiveMenuSessionId(isMenuOpen ? null : sess.session_id)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: isMenuOpen ? c.dark : c.muted,
                                  padding: '.3rem', borderRadius: 4,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                className="three-dots-btn"
                                title="Conversation Actions"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                              </button>
                              
                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <>
                                  {/* Menu Overlay Backdrop to close menu */}
                                  <div 
                                    onClick={() => setActiveMenuSessionId(null)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 998, cursor: 'default' }} 
                                  />
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      right: 0,
                                      background: 'var(--bg-1)',
                                      border: `1px solid ${c.border}`,
                                      borderRadius: 6,
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                      zIndex: 999,
                                      minWidth: 100,
                                      padding: '.25rem 0',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      marginTop: '2px'
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        pinSession(sess.session_id, activeStore?.id, !sess.pinned)
                                        setActiveMenuSessionId(null)
                                      }}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: c.dark, fontSize: '.72rem', padding: '.4rem .8rem',
                                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.4rem',
                                        fontFamily: 'Inter, sans-serif'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = c.bg2}
                                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                      {sess.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRenameText(sess.title || sess.last_message || '')
                                        setRenamingSessionId(sess.session_id)
                                        setActiveMenuSessionId(null)
                                      }}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: c.dark, fontSize: '.72rem', padding: '.4rem .8rem',
                                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.4rem',
                                        fontFamily: 'Inter, sans-serif'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = c.bg2}
                                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingSessionId(sess.session_id)
                                        setActiveMenuSessionId(null)
                                      }}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#EF4444', fontSize: '.72rem', padding: '.4rem .8rem',
                                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.4rem',
                                        fontWeight: 500, fontFamily: 'Inter, sans-serif'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = c.bg2}
                                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Panel body (Scrollable Message Thread) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem', gap: '0.8rem', width: '100%', boxSizing: 'border-box' }} className="no-scrollbar">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: msg.role === 'user' ? 'var(--g)' : 'var(--bg-2)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '.75rem .95rem',
                      fontSize: '.82rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      boxShadow: msg.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{
                    alignSelf: 'flex-start',
                    background: 'var(--bg-2)',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '.75rem .95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.3rem',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.muted, animation: 'pulse 1.2s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.muted, animation: 'pulse 1.2s infinite 0.2s' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.muted, animation: 'pulse 1.2s infinite 0.4s' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Delete Confirmation Banner */}
              {pendingDelete && (
                <div style={{
                  margin: '0 1rem 0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#EF4444' }}>
                    Confirm deletion
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Are you sure you want to permanently delete this product? This cannot be undone.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button
                      onClick={() => { setPendingDelete(null); setInputText('yes, delete it'); setTimeout(() => document.getElementById('sidebar-chat-form')?.requestSubmit(), 50) }}
                      style={{ flex: 1, padding: '.45rem', borderRadius: 7, border: 'none', background: '#EF4444', color: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Yes, Delete It
                    </button>
                    <button
                      onClick={() => { setPendingDelete(null); sendMessage('cancel', activeStore?.id) }}
                      style={{ flex: 1, padding: '.45rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text-primary)', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form id="sidebar-chat-form" onSubmit={handleSend} style={{ padding: '.85rem 1rem', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '.5rem', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: c.card, flexShrink: 0 }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Ask Selora anything..."
                  style={{
                    flex: 1,
                    padding: '.6rem .85rem',
                    borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    fontSize: '.82rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    background: 'var(--bg-0)',
                    color: c.dark,
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputText.trim()}
                  style={{
                    background: inputText.trim() ? c.green : 'transparent',
                    border: 'none',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    color: inputText.trim() ? '#fff' : c.muted,
                    padding: '.5rem',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
        </div>

      </div>
  )
}
