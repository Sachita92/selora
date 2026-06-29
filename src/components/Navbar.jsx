import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAppContext } from '../lib/AppContext'
import { useDarkMode } from '../hooks/useDarkMode'

export default function Navbar() {
  const { user } = useAppContext()
  const [darkMode, toggleTheme] = useDarkMode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

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
        .site-nav-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
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
          <div className="site-nav-actions-desktop" style={{ display: 'flex', gap: '0.6rem' }}>
            {user ? (
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
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-btn-desktop site-nav-link"
                  style={{ fontSize: '.82rem', fontWeight: 500, alignSelf: 'center', padding: 0 }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
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
                  Get Started Free
                </Link>
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
          {user ? (
            <Link
              to="/dashboard"
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <Link
                to="/login"
                style={{
                  fontSize: '.85rem',
                  fontWeight: 500,
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '0.4rem 0'
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
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
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
