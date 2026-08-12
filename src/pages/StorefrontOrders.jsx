import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PackageIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.3 7l8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

const DollarIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export default function StorefrontOrders() {
  const { handle } = useParams()
  const [theme, setTheme] = useState(() => localStorage.getItem('sf-theme') || 'light')

  useEffect(() => {
    localStorage.setItem('sf-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const [store, setStore] = useState(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [errorStore, setErrorStore] = useState('')

  // Wallet and orders state
  const [walletConnected, setWalletConnected] = useState(false)
  const [buyerWallet, setBuyerWallet] = useState('')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [errorOrders, setErrorOrders] = useState('')

  // Load store config
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/selora-stores/public/${handle}`)
        if (!res.ok) throw new Error('Store not found')
        const data = await res.json()
        setStore(data.store)
      } catch (e) {
        setErrorStore(e.message)
      } finally {
        setLoadingStore(false)
      }
    }
    load()
  }, [handle])

  // Setup phantom state on mount or when window.solana is loaded
  useEffect(() => {
    const phantom = window.solana
    if (phantom?.isPhantom && phantom.isConnected && phantom.publicKey) {
      setWalletConnected(true)
      setBuyerWallet(phantom.publicKey.toString())
    }
  }, [])

  // Auto-fetch orders when wallet connects
  useEffect(() => {
    if (buyerWallet && store?.id) {
      fetchOrdersForWallet(buyerWallet, store.id)
    }
  }, [buyerWallet, store])

  const fetchOrdersForWallet = async (walletAddress, storeId) => {
    setLoadingOrders(true)
    setErrorOrders('')
    try {
      const res = await fetch(`${API}/api/stores/${storeId}/orders/by-wallet/${walletAddress}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      setErrorOrders(e.message)
    } finally {
      setLoadingOrders(false)
    }
  }

  const connectWallet = async () => {
    const phantom = window.solana
    if (!phantom || !phantom.isPhantom) {
      window.open('https://phantom.app/', '_blank')
      return
    }
    try {
      await phantom.connect()
      if (phantom.publicKey) {
        setWalletConnected(true)
        setBuyerWallet(phantom.publicKey.toString())
      }
    } catch (err) {
      setErrorOrders('Wallet connection cancelled.')
    }
  }

  const disconnectWallet = async () => {
    const phantom = window.solana
    if (phantom) {
      await phantom.disconnect()
    }
    setWalletConnected(false)
    setBuyerWallet('')
    setOrders([])
  }

  if (loadingStore) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAF8' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid #E4EBE5', borderTop: '3px solid #5A8A67', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    )
  }

  if (errorStore || !store) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ color: '#DC2626', marginBottom: '1rem' }}>Error</h1>
        <p>{errorStore || 'Store not found.'}</p>
        <Link to="/" style={{ color: '#5A8A67', textDecoration: 'none', fontWeight: 600 }}>Back to Selora Home</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sf-bg)', fontFamily: 'Inter, sans-serif' }} className={theme === 'dark' ? 'dark' : ''} data-theme={theme}>
      <style>{`
        :root, [data-theme='light'] {
          --sf-bg: #F6F1E8;
          --sf-text: #3D362B;
          --sf-text-primary: #3D362B;
          --sf-text-muted: #8A8072;
          --sf-border: #E4DCD0;
          --sf-surface: #EFE6D6;
          --sf-primary: #B08968;
          --sf-primary-hover: #9A7556;
          --sf-secondary: #EFE6D6;
          --sf-secondary-border: #E4DCD0;
          --sf-bg-dim: rgba(61, 54, 43, 0.25);
          --sf-nav-bg: rgba(246, 241, 232, 0.95);
          --sf-footer-bg: #F6F1E8;
          --sf-card-shadow: 0 12px 24px rgba(61, 54, 43, 0.08);

          /* Global index.css overrides inside light storefront */
          --text-primary: #3D362B;
          --text-muted: #8A8072;
          --border: #E4DCD0;
          --bg-2: #EFE6D6;
          --g: #B08968;
        }

        [data-theme='dark'] {
          --sf-bg: #121813;
          --sf-text: #BAC9BD;
          --sf-text-primary: #EAF2EB;
          --sf-text-muted: #8CA392;
          --sf-border: #2A382C;
          --sf-surface: #1B241D;
          --sf-primary: #6EAB7E;
          --sf-primary-hover: #83C093;
          --sf-secondary: #233025;
          --sf-secondary-border: #3A4F3E;
          --sf-bg-dim: rgba(0, 0, 0, 0.6);
          --sf-nav-bg: rgba(18, 24, 19, 0.92);
          --sf-footer-bg: #0D120E;
          --sf-card-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);

          /* Global index.css overrides inside dark storefront */
          --text-primary: #F2F3F1;
          --text-muted: #8A8D8A;
          --border: #2C2F30;
          --bg-2: #242627;
          --g: #6FBF8B;
        }

        .sf-orders-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        .sf-orders-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1025px) {
          .sf-orders-layout {
            grid-template-columns: 320px 1fr;
            align-items: start;
          }
          .sf-orders-sidebar {
            position: sticky;
            top: 100px;
          }
        }
      `}</style>
      
      {/* HEADER */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--sf-nav-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--sf-border)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to={`/store/${handle}`} style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--sf-text-primary)', textDecoration: 'none' }}>
              {store.name}
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to={`/store/${handle}`} style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--sf-text)', textDecoration: 'none' }}>
              Home
            </Link>
            <Link to={`/store/${handle}/orders`} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--sf-text-primary)', textDecoration: 'none' }}>
              My Orders
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--sf-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: 8,
                transition: 'all 0.2s',
              }}
              title="Toggle theme"
              className="sf-theme-toggle-btn"
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: 'var(--sf-text-primary)', margin: '0 0 .5rem' }}>
            My Orders
          </h1>
          <p style={{ color: 'var(--sf-text-muted)', fontSize: '1rem', margin: 0 }}>
            Connect your Solana wallet to view all past purchases at this store.
          </p>
        </div>

        {/* WALLET INTEGRATION BOX */}
        {!walletConnected ? (
          <div style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', boxShadow: 'var(--sf-card-shadow)' }}>
            <div style={{ color: 'var(--sf-primary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><path d="M12 14h.01"/><path d="M17 14h.01"/><path d="M7 14h.01"/><path d="M2 10h20"/></svg>
            </div>
            <button
              onClick={connectWallet}
              style={{
                background: 'var(--sf-text-primary)',
                color: 'var(--sf-bg)',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: 10,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background .2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.5rem'
              }}
            >
              Connect Wallet
            </button>
            <p style={{ fontSize: '.8rem', color: 'var(--sf-text-muted)', marginTop: '1rem', marginBottom: 0 }}>
              Supports Phantom browser extension.
            </p>
          </div>
        ) : (
          <div className="sf-orders-layout">
            
            {/* LEFT COLUMN: Sidebar (Wallet & Stats) */}
            <div className="sf-orders-sidebar">
              {/* Wallet Info Banner */}
              <div style={{ background: 'var(--sf-secondary)', border: '1px solid var(--sf-secondary-border)', borderRadius: 12, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--sf-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>Connected Wallet</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '.9rem', color: 'var(--sf-text-primary)', fontWeight: 500 }}>
                    {buyerWallet.slice(0, 8)}...{buyerWallet.slice(-8)}
                  </span>
                </div>
                <button 
                  onClick={disconnectWallet}
                  style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Disconnect
                </button>
              </div>

              {/* Summary Card */}
              {orders.length > 0 && !loadingOrders && !errorOrders && (
                <div style={{ 
                  background: 'var(--sf-surface)', 
                  border: '1px solid var(--sf-border)', 
                  borderRadius: 12, 
                  padding: '1.25rem 1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem', 
                  boxShadow: 'var(--sf-card-shadow)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--sf-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sf-primary)', flexShrink: 0 }}>
                      <PackageIcon size={18} color="var(--sf-primary)" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sf-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Total Orders</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sf-text-primary)' }}>
                        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', backgroundColor: 'var(--sf-border)' }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--sf-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sf-primary)', flexShrink: 0 }}>
                      <DollarIcon size={18} color="var(--sf-primary)" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sf-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Total Spent</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sf-primary)' }}>
                        USD {orders.reduce((sum, o) => o.status === 'paid' ? sum + Number(o.total_usd || 0) : sum, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Orders List */}
            <div className="sf-orders-list-wrap" style={{ minWidth: 0 }}>
              {/* ORDERS LIST */}
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <div style={{ width: 32, height: 32, border: '2px solid var(--sf-border)', borderTop: '2px solid var(--sf-primary)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
                <span style={{ color: 'var(--sf-text-muted)', fontSize: '.9rem' }}>Loading your orders...</span>
              </div>
            ) : errorOrders ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '1.25rem', color: '#DC2626', fontSize: '.9rem' }}>
                ⚠️ {errorOrders}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--sf-text-primary)', fontSize: '1.1rem', margin: '0 0 .25rem' }}>No orders found</p>
                <p style={{ color: 'var(--sf-text-muted)', fontSize: '.9rem', margin: 0 }}>This wallet hasn't made any purchases at this store yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => {
                  const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })

                  // Determine status badge color
                  const statusColors = theme === 'dark' ? {
                    paid: { bg: 'rgba(110, 171, 126, 0.15)', txt: 'var(--sf-primary)', label: 'Paid' },
                    pending: { bg: 'rgba(217, 119, 6, 0.15)', txt: '#FBBF24', label: 'Pending' },
                    failed: { bg: 'rgba(220, 38, 38, 0.15)', txt: '#F87171', label: 'Failed' }
                  } : {
                    paid: { bg: '#EAF6EC', txt: '#15803D', label: 'Paid' },
                    pending: { bg: '#FEF9C3', txt: '#A16207', label: 'Pending' },
                    failed: { bg: '#FEE2E2', txt: '#B91C1C', label: 'Failed' }
                  }
                  const badge = statusColors[order.status] || { bg: 'var(--sf-secondary)', txt: 'var(--sf-text-muted)', label: order.status }

                  // Determine active steps for progress bar based on status
                  const isPaid = order.status === 'paid'
                  const isProcessing = order.status === 'processing'
                  const isFulfilled = order.status === 'fulfilled'

                  return (
                    <div key={order.id} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--sf-card-shadow)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Order Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--sf-border)', paddingBottom: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '.8rem', color: 'var(--sf-text-muted)', display: 'block', marginBottom: '.25rem', fontWeight: 500 }}>
                            Order Date: {orderDate}
                          </span>
                          <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--sf-text-primary)' }}>
                            Order ID: <span style={{ fontFamily: 'monospace', fontWeight: 400 }}>#{order.id.slice(0, 8)}</span>
                          </span>
                        </div>
                        <span style={{ background: badge.bg, color: badge.txt, fontSize: '.75rem', fontWeight: 600, padding: '.35rem .75rem', borderRadius: 20 }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Status Progression Bar */}
                      {order.status && (
                        <div style={{ padding: '0.25rem 0 1rem 0', borderBottom: '1px solid var(--sf-border)' }}>
                          <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--sf-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1.25rem', marginTop: 0 }}>
                            Order Progress
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                            
                            {/* Connection line background */}
                            <div style={{ position: 'absolute', top: '10px', left: '16.6%', right: '16.6%', height: '2px', backgroundColor: 'var(--sf-border)', zIndex: 1 }}>
                              {/* Active filled line part */}
                              <div style={{ 
                                width: isFulfilled ? '100%' : (isProcessing ? '50%' : '0%'), 
                                height: '100%', 
                                backgroundColor: 'var(--sf-primary)', 
                                transition: 'width .3s' 
                              }} />
                            </div>

                            {/* Step 1: Paid */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: (isPaid || isProcessing || isFulfilled) ? 'var(--sf-primary)' : 'var(--sf-border)',
                                border: (isPaid || isProcessing || isFulfilled) ? '3px solid var(--sf-secondary)' : '3px solid var(--sf-surface)',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: (isPaid || isProcessing || isFulfilled) ? 600 : 500, marginTop: '.5rem', color: (isPaid || isProcessing || isFulfilled) ? 'var(--sf-text-primary)' : 'var(--sf-text-muted)' }}>Paid</span>
                            </div>

                            {/* Step 2: Processing (no-op for now) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: (isProcessing || isFulfilled) ? 'var(--sf-primary)' : 'var(--sf-border)',
                                border: (isProcessing || isFulfilled) ? '3px solid var(--sf-secondary)' : '3px solid var(--sf-surface)',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: (isProcessing || isFulfilled) ? 600 : 500, marginTop: '.5rem', color: (isProcessing || isFulfilled) ? 'var(--sf-text-primary)' : 'var(--sf-text-muted)' }}>Processing</span>
                            </div>

                            {/* Step 3: Fulfilled (no-op for now) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: isFulfilled ? 'var(--sf-primary)' : 'var(--sf-border)',
                                border: isFulfilled ? '3px solid var(--sf-secondary)' : '3px solid var(--sf-surface)',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: isFulfilled ? 600 : 500, marginTop: '.5rem', color: isFulfilled ? 'var(--sf-text-primary)' : 'var(--sf-text-muted)' }}>Fulfilled</span>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Purchased Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: idx < order.items.length - 1 ? '1rem' : '0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--sf-border)' : 'none' }}>
                            {/* Product Thumbnail / Fallback Placeholder */}
                            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.title} 
                                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--sf-border)', display: 'block' }} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="image-placeholder"
                                style={{ 
                                  position: 'absolute',
                                  inset: 0,
                                  backgroundColor: 'var(--sf-secondary)', 
                                  borderRadius: 8, 
                                  display: item.image_url ? 'none' : 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: 'var(--sf-text-muted)',
                                  border: '1px solid var(--sf-border)' 
                                }}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                              </div>
                            </div>

                            {/* Product Information */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '.9rem', margin: '0 0 .25rem', color: 'var(--sf-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title || 'Product'}
                              </p>
                              <p style={{ fontSize: '.8rem', color: 'var(--sf-text-muted)', margin: 0 }}>
                                Qty: {item.quantity} &bull; USD {Number(item.price).toFixed(2)} each
                              </p>
                            </div>

                            {/* Price Subtotal */}
                            <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--sf-text-primary)' }}>
                              USD {Number(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Paid & Solana Explorer Link */}
                      <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          {isPaid ? (
                            <a
                              href={order.signature 
                                ? `https://explorer.solana.com/tx/${order.signature}?cluster=devnet`
                                : `https://explorer.solana.com/address/${order.reference}?cluster=devnet`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '.35rem', 
                                background: 'var(--sf-secondary)', 
                                color: 'var(--sf-text-primary)', 
                                border: '1px solid var(--sf-secondary-border)', 
                                padding: '.5rem 1rem', 
                                borderRadius: 8, 
                                fontSize: '.8rem', 
                                fontWeight: 600, 
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                              }}
                              className="solana-explorer-btn"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sf-primary)' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                              Paid — view transaction ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '.8rem', color: 'var(--sf-text-muted)', fontStyle: 'italic' }}>Signature pending confirmation</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem' }}>
                          <span style={{ fontSize: '.85rem', color: 'var(--sf-text-muted)', fontWeight: 500 }}>Total Paid:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--sf-text-primary)' }}>
                            USD {Number(order.total_usd || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--sf-border)', padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--sf-footer-bg)', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', margin: '0 0 0.5rem' }}>
          &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--sf-text-muted)', opacity: 0.8, margin: 0 }}>
          Powered by <a href="/" style={{ color: 'var(--sf-text-muted)', textDecoration: 'none', fontWeight: 600 }}>Selora AI</a>
        </p>
      </footer>

    </div>
  )
}
