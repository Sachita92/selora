import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function StorefrontOrders() {
  const { handle } = useParams()
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAF8', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248, 250, 248, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E4EBE5', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to={`/store/${handle}`} style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 700, color: '#1A271C', textDecoration: 'none' }}>
              {store.name}
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to={`/store/${handle}`} style={{ fontSize: '0.9rem', fontWeight: 500, color: '#3B5A44', textDecoration: 'none' }}>
              Home
            </Link>
            <Link to={`/store/${handle}/orders`} style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A271C', textDecoration: 'none' }}>
              My Orders
            </Link>
          </div>

          <div style={{ width: 40 }} /> {/* Spacer to align links */}
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: '#1A271C', margin: '0 0 .5rem' }}>
            My Orders
          </h1>
          <p style={{ color: '#7B907D', fontSize: '1rem', margin: 0 }}>
            Connect your Solana wallet to view all past purchases at this store.
          </p>
        </div>

        {/* WALLET INTEGRATION BOX */}
        {!walletConnected ? (
          <div style={{ background: '#fff', border: '1px solid #E4EBE5', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#5A8A67', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><path d="M12 14h.01"/><path d="M17 14h.01"/><path d="M7 14h.01"/><path d="M2 10h20"/></svg>
            </div>
            <button
              onClick={connectWallet}
              style={{
                background: '#1A271C',
                color: '#fff',
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
            <p style={{ fontSize: '.8rem', color: '#7B907D', marginTop: '1rem', marginBottom: 0 }}>
              Supports Phantom browser extension.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Wallet Info Banner */}
            <div style={{ background: '#EAF2EC', border: '1px solid #D2E3D6', borderRadius: 12, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '.8rem', color: '#5A8A67', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>Connected Wallet</span>
                <span style={{ fontFamily: 'monospace', fontSize: '.9rem', color: '#1A271C', fontWeight: 500 }}>
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

            {/* ORDERS LIST */}
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <div style={{ width: 32, height: 32, border: '2px solid #E4EBE5', borderTop: '2px solid #5A8A67', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
                <span style={{ color: '#7B907D', fontSize: '.9rem' }}>Loading your orders...</span>
              </div>
            ) : errorOrders ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '1.25rem', color: '#DC2626', fontSize: '.9rem' }}>
                ⚠️ {errorOrders}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #E4EBE5', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: '#1A271C', fontSize: '1.1rem', margin: '0 0 .25rem' }}>No orders found</p>
                <p style={{ color: '#7B907D', fontSize: '.9rem', margin: 0 }}>This wallet hasn't made any purchases at this store yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => {
                  const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })

                  // Determine status badge color
                  const statusColors = {
                    paid: { bg: '#EAF6EC', txt: '#15803D', label: 'Paid' },
                    pending: { bg: '#FEF9C3', txt: '#A16207', label: 'Pending' },
                    failed: { bg: '#FEE2E2', txt: '#B91C1C', label: 'Failed' }
                  }
                  const badge = statusColors[order.status] || { bg: '#F4F4F5', txt: '#71717A', label: order.status }

                  // Determine active steps for progress bar based on status
                  const isPaid = order.status === 'paid'
                  const isProcessing = order.status === 'processing'
                  const isFulfilled = order.status === 'fulfilled'

                  return (
                    <div key={order.id} style={{ background: '#fff', border: '1px solid #E4EBE5', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Order Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E4EBE5', paddingBottom: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '.8rem', color: '#7B907D', display: 'block', marginBottom: '.25rem', fontWeight: 500 }}>
                            Order Date: {orderDate}
                          </span>
                          <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#1A271C' }}>
                            Order ID: <span style={{ fontFamily: 'monospace', fontWeight: 400 }}>#{order.id.slice(0, 8)}</span>
                          </span>
                        </div>
                        <span style={{ background: badge.bg, color: badge.txt, fontSize: '.75rem', fontWeight: 600, padding: '.35rem .75rem', borderRadius: 20 }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Status Progression Bar */}
                      {order.status && (
                        <div style={{ padding: '0.25rem 0 1rem 0', borderBottom: '1px solid #E4EBE5' }}>
                          <p style={{ fontSize: '.75rem', fontWeight: 700, color: '#7B907D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1.25rem', marginTop: 0 }}>
                            Order Progress
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                            
                            {/* Connection line background */}
                            <div style={{ position: 'absolute', top: '10px', left: '16.6%', right: '16.6%', height: '2px', backgroundColor: '#E5E7EB', zIndex: 1 }}>
                              {/* Active filled line part */}
                              <div style={{ 
                                width: isFulfilled ? '100%' : (isProcessing ? '50%' : '0%'), 
                                height: '100%', 
                                backgroundColor: '#5A8A67', 
                                transition: 'width .3s' 
                              }} />
                            </div>

                            {/* Step 1: Paid */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: (isPaid || isProcessing || isFulfilled) ? '#5A8A67' : '#E5E7EB',
                                border: (isPaid || isProcessing || isFulfilled) ? '3px solid #EAF6EC' : '3px solid #fff',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: (isPaid || isProcessing || isFulfilled) ? 600 : 500, marginTop: '.5rem', color: (isPaid || isProcessing || isFulfilled) ? '#1A271C' : '#9CA3AF' }}>Paid</span>
                            </div>

                            {/* Step 2: Processing (no-op for now) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: (isProcessing || isFulfilled) ? '#5A8A67' : '#E5E7EB',
                                border: (isProcessing || isFulfilled) ? '3px solid #EAF6EC' : '3px solid #fff',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: (isProcessing || isFulfilled) ? 600 : 500, marginTop: '.5rem', color: (isProcessing || isFulfilled) ? '#1A271C' : '#9CA3AF' }}>Processing</span>
                            </div>

                            {/* Step 3: Fulfilled (no-op for now) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: isFulfilled ? '#5A8A67' : '#E5E7EB',
                                border: isFulfilled ? '3px solid #EAF6EC' : '3px solid #fff',
                                boxSizing: 'border-box'
                              }} />
                              <span style={{ fontSize: '.75rem', fontWeight: isFulfilled ? 600 : 500, marginTop: '.5rem', color: isFulfilled ? '#1A271C' : '#9CA3AF' }}>Fulfilled</span>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Purchased Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: idx < order.items.length - 1 ? '1rem' : '0', borderBottom: idx < order.items.length - 1 ? '1px solid #F0F4F1' : 'none' }}>
                            {/* Product Thumbnail / Fallback Placeholder */}
                            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.title} 
                                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #E4EBE5', display: 'block' }} 
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
                                  backgroundColor: '#F3F4F6', 
                                  borderRadius: 8, 
                                  display: item.image_url ? 'none' : 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: '#9CA3AF',
                                  border: '1px solid #E4EBE5' 
                                }}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                              </div>
                            </div>

                            {/* Product Information */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '.9rem', margin: '0 0 .25rem', color: '#1A271C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title || 'Product'}
                              </p>
                              <p style={{ fontSize: '.8rem', color: '#7B907D', margin: 0 }}>
                                Qty: {item.quantity} &bull; USD {Number(item.price).toFixed(2)} each
                              </p>
                            </div>

                            {/* Price Subtotal */}
                            <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#1A271C' }}>
                              USD {Number(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Paid & Solana Explorer Link */}
                      <div style={{ borderTop: '1px solid #E4EBE5', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          {order.signature ? (
                            <a
                              href={`https://explorer.solana.com/tx/${order.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '.35rem', 
                                background: '#F0F4F1', 
                                color: '#1A271C', 
                                border: '1px solid #D2E3D6', 
                                padding: '.5rem 1rem', 
                                borderRadius: 8, 
                                fontSize: '.8rem', 
                                fontWeight: 600, 
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                              }}
                              className="solana-explorer-btn"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5A8A67' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                              View transaction on Solana Explorer
                            </a>
                          ) : (
                            <span style={{ fontSize: '.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>Signature pending confirmation</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem' }}>
                          <span style={{ fontSize: '.85rem', color: '#7B907D', fontWeight: 500 }}>Total Paid:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A271C' }}>
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
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E4EBE5', padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#F8FAF8', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.8rem', color: '#7B907D', margin: '0 0 0.5rem' }}>
          &copy; {new Date().getFullYear()} {store.name}. All rights reserved. &bull;{' '}
          <Link to={`/store/${handle}/orders`} style={{ color: '#7B907D', textDecoration: 'none', fontWeight: 600 }}>
            My Orders
          </Link>
        </p>
        <p style={{ fontSize: '0.72rem', color: '#9AB49D', margin: 0 }}>
          Powered by <a href="/" style={{ color: '#7B907D', textDecoration: 'none', fontWeight: 600 }}>Selora AI</a>
        </p>
      </footer>

    </div>
  )
}
