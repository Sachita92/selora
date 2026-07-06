import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { useAuth } from '../lib/useAuth'

export default function Navbar() {
  const { user, openAuthModal, loading } = useAppContext()
  const { login, logout, authenticated, ready, walletAddress, user: privyUser, triggerSync, syncing } = useAuth()
  const isCheckingSession = !ready || loading || syncing
  const [darkMode, toggleTheme] = useDarkMode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)
  const location = useLocation()

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
        setIsMobileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Track scroll state self-contained
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-close menu on route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const links = [
    { label: 'Features', path: '/features' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Book a Demo', path: '/demo' }
  ]

  const isLinkActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: scrolled ? 'var(--nav-bg-scrolled, rgba(248, 250, 248, 0.97))' : 'var(--nav-bg, rgba(248, 250, 248, 0.88))',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, border-color 0.3s',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(90deg, var(--bg-2, #f3f4f6) 25%, var(--border, #e5e7eb) 50%, var(--bg-2, #f3f4f6) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .site-nav-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }
        .site-nav-links-desktop {
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 0.82rem;
        }
        .site-nav-link {
          color: var(--muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          position: relative;
          padding-bottom: 0.25rem;
        }
        .site-nav-link:hover {
          color: var(--dark);
        }
        .site-nav-link.active {
          color: var(--dark);
          font-weight: 600;
        }
        .site-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--g);
          border-radius: 99px;
        }
        .site-nav-link-demo {
          color: var(--g);
          font-weight: 600 !important;
        }
        .site-nav-actions-desktop {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .site-nav-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--dark);
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .site-nav-hamburger:hover {
          background-color: var(--bg2);
        }
        .site-nav-mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--nav-bg-scrolled, rgba(248, 250, 248, 0.98));
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          flex-direction: column;
          padding: 1.5rem;
          gap: 1.1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          animation: navSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .site-nav-links-desktop, .site-nav-actions-desktop .nav-btn-desktop {
            display: none !important;
          }
          .site-nav-hamburger {
            display: flex;
          }
          .site-nav-mobile-menu.open {
            display: flex;
          }
        }
      `}</style>

      <div className="site-nav-container">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-.3px', color: 'var(--dark)', fontFamily: 'Inter, sans-serif' }}>
            Se<span style={{ color: 'var(--g)' }}>lo</span>ra
          </div>
        </Link>

        {/* Desktop links */}
        <div className="site-nav-links-desktop">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`site-nav-link ${isLinkActive(link.path) ? 'active' : ''} ${link.label === 'Book a Demo' ? 'site-nav-link-demo' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions & Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Dark Mode toggle */}
          <button
            className="cn-theme-toggle"
            onClick={toggleTheme}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '.35rem',
              borderRadius: 6,
              color: 'var(--dark)'
            }}
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Desktop Auth Actions */}
          <div className="site-nav-actions-desktop" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {isCheckingSession ? (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <div className="skeleton-shimmer" style={{ width: 90, height: 36, borderRadius: 7 }} />
                <div className="skeleton-shimmer" style={{ width: 130, height: 36, borderRadius: 7 }} />
              </div>
            ) : authenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="nav-btn-desktop"
                  style={{
                    background: 'var(--g)',
                    color: '#fff',
                    padding: '.5rem 1.2rem',
                    borderRadius: 7,
                    fontSize: '.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s'
                  }}
                >
                  Dashboard
                </Link>
                {/* Dropdown Auth Button */}
                <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 7,
                      padding: '.5rem 1.2rem',
                      fontSize: '.82rem',
                      fontWeight: 600,
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--dark)'
                      e.currentTarget.style.background = 'var(--bg2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      if (!isDropdownOpen) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g)', display: 'inline-block' }} />
                    {privyUser?.email?.address 
                      ? (privyUser.email.address.length > 18 ? privyUser.email.address.slice(0, 15) + '...' : privyUser.email.address)
                      : (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Logged In')}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        marginLeft: '.2rem',
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + .5rem)',
                        right: 0,
                        background: 'var(--bg-1, #fff)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: 160,
                        overflow: 'hidden',
                        padding: '.4rem 0'
                      }}
                    >
                      {walletAddress && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(walletAddress)
                            setIsDropdownOpen(false)
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            padding: '.6rem 1rem',
                            fontSize: '.8rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.5rem',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy Address
                        </button>
                      )}

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '.6rem 1rem',
                          fontSize: '.8rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '.5rem',
                          fontFamily: 'Inter, sans-serif',
                          textDecoration: 'none',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        View Profile
                      </Link>

                      <div style={{ height: 1, background: 'var(--border)', margin: '.4rem 0' }} />

                      <button
                        onClick={() => {
                          logout()
                          setIsDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '.6rem 1rem',
                          fontSize: '.8rem',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '.5rem',
                          fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (authenticated) {
                      triggerSync()
                    } else {
                      login()
                    }
                  }}
                  className="nav-btn-desktop"
                  style={{
                    background: 'transparent',
                    color: 'var(--dark)',
                    border: '1.5px solid var(--border)',
                    padding: '.5rem 1.2rem',
                    borderRadius: 7,
                    fontSize: '.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dark)'
                    e.currentTarget.style.background = 'var(--bg-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="nav-btn-desktop"
                  style={{
                    background: 'var(--g)',
                    color: '#fff',
                    padding: '.5rem 1.2rem',
                    borderRadius: 7,
                    fontSize: '.82rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'opacity 0.2s'
                  }}
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* Hamburger Menu Icon */}
          <button
            className="site-nav-hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        <div className={`site-nav-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              style={{
                fontSize: '0.92rem',
                fontWeight: isLinkActive(link.path) ? '600' : '400',
                color: isLinkActive(link.path) ? 'var(--dark)' : 'var(--muted)',
                textDecoration: 'none',
                padding: '0.3rem 0',
                borderBottom: isLinkActive(link.path) ? '1px solid var(--g)' : 'none',
                display: 'inline-block',
                width: 'fit-content'
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ height: '1px', background: 'var(--border)', margin: '0.3rem 0' }} />
          {isCheckingSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
              <div className="skeleton-shimmer" style={{ width: '100%', height: 36, borderRadius: 7 }} />
            </div>
          ) : authenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  background: 'var(--g)',
                  color: '#fff',
                  padding: '.6rem 1rem',
                  borderRadius: 7,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Dashboard
              </Link>
              {/* Mobile Dropdown */}
              <div ref={mobileDropdownRef} style={{ position: 'relative', width: '100%' }}>
                <button
                  onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    padding: '.6rem 1rem',
                    fontSize: '.85rem',
                    fontWeight: 600,
                    color: 'var(--dark)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g)', display: 'inline-block' }} />
                  {privyUser?.email?.address 
                    ? (privyUser.email.address.length > 18 ? privyUser.email.address.slice(0, 15) + '...' : privyUser.email.address)
                    : (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Logged In')}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      marginLeft: '.2rem',
                      transform: isMobileDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isMobileDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + .5rem)',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-1, #fff)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      overflow: 'hidden',
                      padding: '.4rem 0'
                    }}
                  >
                    {walletAddress && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress)
                          setIsMobileDropdownOpen(false)
                          setIsMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '.6rem 1rem',
                          fontSize: '.8rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '.5rem',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Address
                      </button>
                    )}

                    <Link
                      to="/settings"
                      onClick={() => {
                        setIsMobileDropdownOpen(false)
                        setIsMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '.6rem 1rem',
                        fontSize: '.8rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                        fontFamily: 'Inter, sans-serif',
                        textDecoration: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      View Profile
                    </Link>

                    <div style={{ height: 1, background: 'var(--border)', margin: '.4rem 0' }} />

                    <button
                      onClick={() => {
                        logout()
                        setIsMobileDropdownOpen(false)
                        setIsMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '.6rem 1rem',
                        fontSize: '.8rem',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                onClick={() => {
                  if (authenticated) {
                    triggerSync()
                  } else {
                    login()
                  }
                  setIsMenuOpen(false)
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--dark)',
                  border: '1.5px solid var(--border)',
                  padding: '.6rem 1rem',
                  borderRadius: 7,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'center'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { openAuthModal('signup'); setIsMenuOpen(false) }}
                style={{
                  background: 'var(--g)',
                  color: '#fff',
                  padding: '.6rem 1rem',
                  borderRadius: 7,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'center'
                }}
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
