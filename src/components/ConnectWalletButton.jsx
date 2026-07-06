import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function ConnectWalletButton() {
  const { login, logout, authenticated, ready, walletAddress, syncing } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!ready) {
    return (
      <button
        disabled
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '.4rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '.55rem 1rem',
          fontSize: '.82rem',
          color: 'var(--text-muted)',
          cursor: 'not-allowed',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        Initializing...
      </button>
    )
  }

  if (syncing) {
    return (
      <button
        disabled
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '.4rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '.55rem 1rem',
          fontSize: '.82rem',
          color: 'var(--text-muted)',
          cursor: 'not-allowed',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        Syncing Auth...
      </button>
    )
  }

  if (!authenticated || !walletAddress) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
        <button
          onClick={login}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.4rem',
            background: 'var(--g)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '.55rem 1.1rem',
            fontSize: '.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(95, 141, 118, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(95, 141, 118, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(95, 141, 118, 0.2)'
          }}
        >
          Connect Wallet
        </button>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.1rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
          Don't have a Solana wallet ready? Get <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g)', textDecoration: 'underline' }}>Phantom</a> or <a href="https://solflare.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g)', textDecoration: 'underline' }}>Solflare</a> and create a Solana account.
        </span>
      </div>
    )
  }

  const truncatedAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setIsOpen(false)
    // Small native alert or toast could be added here
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '.5rem',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '.55rem 1rem',
          fontSize: '.82rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-2)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'var(--bg-1)'
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g)', display: 'inline-block' }} />
        {truncatedAddress}
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
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + .5rem)',
            right: 0,
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: 150,
            overflow: 'hidden',
            padding: '.4rem 0'
          }}
        >
          <button
            onClick={handleCopy}
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
          
          <div style={{ height: 1, background: 'var(--border)', margin: '.4rem 0' }} />

          <button
            onClick={logout}
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
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
