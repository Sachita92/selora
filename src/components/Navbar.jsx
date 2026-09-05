import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useLayoutEffect } from 'react'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { useAuth } from '../lib/useAuth'

export default function Navbar() {
  const { user, openAuthModal, loading } = useAppContext()
  const { login, logout, authenticated, ready, triggerSync } = useAuth()
  // Signed-in truth is the Supabase session `user` from AppContext — the same
  // source the hero CTA reads. Privy `authenticated` without a user means the
  // wallet bridge is still resolving into a Supabase session (privy-sync), so
  // until either restore path settles, show neither button set.
  const isCheckingSession = !user && (!ready || loading || authenticated)
  const [darkMode, toggleTheme] = useDarkMode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Transparent while the landing hero is under the nav, solid once it isn't.
  // Optimistic default — the landing loads at the top of the hero.
  const [overHero, setOverHero] = useState(true)
  // The 300ms transition switches on only after the initial state has been
  // painted, so a mid-page reload snaps to the right look instead of fading
  // into it. Routes without a hero never set it: they are solid throughout,
  // nothing ever changes, so no transition is needed.
  const [settled, setSettled] = useState(false)
  const location = useLocation()

  // No scroll listener. The hero renders a [data-nav-sentinel] strip spanning
  // its full height minus the nav height; the nav is transparent while any of
  // that strip is in the viewport and solid once its bottom edge (hero bottom
  // minus nav height) clears the top. Because the strip starts at the top of
  // the page there is no third "below the fold" state, so a single frame of
  // fast scrolling can't jump past it without a callback. Resizes re-evaluate
  // automatically — the observer tracks geometry, not scroll events.
  // useLayoutEffect: the observer's first callback lands after the first
  // paint, so the initial state is measured synchronously to get that paint
  // right.
  useLayoutEffect(() => {
    const sentinel = document.querySelector('[data-nav-sentinel]')
    // Measure-then-set is the documented useLayoutEffect pattern; it is the
    // one thing that makes the first paint correct, so the compiler-era lint
    // heuristic is waived for this single line.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverHero(!!sentinel && sentinel.getBoundingClientRect().bottom > 0)
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      // Entries from several frames can arrive batched; the last one is current.
      setOverHero(entries[entries.length - 1].isIntersecting)
      setSettled(true)
    }, { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [location.pathname])

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

  // Solid whenever the hero isn't under the nav. The open mobile drawer forces
  // solid so it never hangs off a glass bar.
  const solid = !overHero || isMenuOpen

  return (
    <nav
      className={`site-nav${solid ? ' is-solid' : ''}${settled ? ' is-settled' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        fontFamily: 'var(--font-body)'
      }}
    >
      <style>{`
        .site-nav {
          background-color: transparent;
          border-bottom: 1px solid transparent;
          box-shadow: none;
        }
        .site-nav.is-settled {
          transition:
            background-color .3s cubic-bezier(0.16, 1, 0.3, 1),
            border-color .3s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow .3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .site-nav.is-solid {
          background-color: var(--nav-bg-scrolled, rgba(248, 250, 248, 0.97));
          border-bottom-color: var(--nav-border, var(--border));
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        @media (prefers-reduced-motion: reduce) {
          .site-nav.is-settled { transition: none; }
        }
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
          <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-.3px', color: 'var(--dark)', fontFamily: 'var(--font-body)' }}>
            Se<span style={{ color: 'var(--g)' }}>lo</span>ra
          </div>
        </Link>

        {/* Desktop links */}
        <div className="site-nav-links-desktop">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`site-nav-link ${isLinkActive(link.path) ? 'active' : ''}`}
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
            ) : user ? (
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
                  Go to Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="nav-btn-desktop"
                  style={{
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: '1.5px solid var(--border-strong)',
                    padding: '.5rem 1.2rem',
                    borderRadius: 7,
                    fontSize: '.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--dark)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
                >
                  Sign out
                </button>
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
                    border: '1.5px solid var(--border-strong)',
                    padding: '.5rem 1.2rem',
                    borderRadius: 7,
                    fontSize: '.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
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
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
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
                    fontFamily: 'var(--font-body)',
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
          ) : user ? (
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
                Go to Dashboard
              </Link>
              <button
                onClick={() => { logout(); setIsMenuOpen(false) }}
                style={{
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: '1.5px solid var(--border-strong)',
                  padding: '.6rem 1rem',
                  borderRadius: 7,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  textAlign: 'center'
                }}
              >
                Sign out
              </button>
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
                  border: '1.5px solid var(--border-strong)',
                  padding: '.6rem 1rem',
                  borderRadius: 7,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
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
                  fontFamily: 'var(--font-body)',
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
