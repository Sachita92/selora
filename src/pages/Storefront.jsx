import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useAuth } from '../lib/useAuth'
import { useSignAndSendTransaction, useWallets } from '@privy-io/react-auth/solana'
import { 
  address, 
  createSolanaRpc, 
  createTransactionMessage, 
  setTransactionMessageFeePayer, 
  setTransactionMessageLifetimeUsingBlockhash, 
  appendTransactionMessageInstructions, 
  compileTransaction, 
  getTransactionEncoder,
  AccountRole
} from '@solana/kit'
import { 
  findAssociatedTokenPda, 
  getTransferCheckedInstruction, 
  getCreateAssociatedTokenIdempotentInstructionAsync,
  TOKEN_PROGRAM_ADDRESS
} from '@solana-program/token'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getSession() {
  let id = sessionStorage.getItem('selora_sid')
  if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem('selora_sid', id) }
  return id
}

async function trackEvent(storeId, productId, eventType) {
  try {
    await fetch(`${API}/selora-stores/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, product_id: productId, event_type: eventType, session_id: getSession() }),
    })
  } catch (_) {}
}

const S = {
  page:      { minHeight: '100vh', background: '#F8FAF8', fontFamily: 'Inter, sans-serif', color: '#2E3D30' },
  nav:       { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,250,248,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E4EBE5', padding: '0 2rem' },
  navInner:  { maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand:     { fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 600, color: '#1A271C', textDecoration: 'none', letterSpacing: '-0.02em' },
  navRight:  { display: 'flex', alignItems: 'center', gap: '1rem' },
  badge:     { fontSize: '.72rem', fontWeight: 700, background: '#EDF3EE', color: '#5A8A67', padding: '.25rem .6rem', borderRadius: 20, letterSpacing: '.04em', textTransform: 'uppercase' },

  hero:      { position: 'relative', minHeight: 340, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' },
  heroBg:    { position: 'absolute', inset: 0, objectFit: 'cover', width: '100%', height: '100%' },
  heroOverlay:{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,39,28,.75) 30%, transparent)' },
  heroContent:{ position: 'relative', zIndex: 1, padding: '3rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' },
  heroTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 },
  heroSub:   { fontSize: '1rem', color: 'rgba(255,255,255,.8)', marginTop: '.75rem', fontWeight: 300 },
  heroPlaceholder:{ minHeight: 340, background: 'linear-gradient(135deg, #1A271C 0%, #5A8A67 100%)', display: 'flex', alignItems: 'flex-end', padding: '3rem 2rem' },
  heroTitleDark:{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.04em' },

  main:      { maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' },
  sectionTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 500, color: '#1A271C', marginBottom: '1.75rem', letterSpacing: '-0.03em' },

  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' },
  prodCard:  { background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E4EBE5', cursor: 'pointer', transition: 'all .25s' },
  imgWrap:   { position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#EDF3EE' },
  prodImg:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' },
  imgPlaceholder:{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', background: '#EDF3EE' },
  discBadge: { position: 'absolute', top: '.75rem', left: '.75rem', background: '#DC2626', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: 20 },
  soldBadge: { position: 'absolute', top: '.75rem', right: '.75rem', background: 'rgba(26,39,28,.7)', color: '#fff', fontSize: '.7rem', fontWeight: 600, padding: '.2rem .55rem', borderRadius: 20 },
  prodBody:  { padding: '1.1rem 1.25rem 1.25rem' },
  prodName:  { fontWeight: 600, fontSize: '.95rem', color: '#1A271C', marginBottom: '.35rem', lineHeight: 1.3 },
  priceRow:  { display: 'flex', alignItems: 'baseline', gap: '.5rem' },
  price:     { fontSize: '1.05rem', fontWeight: 700, color: '#5A8A67' },
  compareAt: { fontSize: '.85rem', color: '#7B907D', textDecoration: 'line-through' },
  tags:      { display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.6rem' },
  tag:       { fontSize: '.7rem', background: '#EDF3EE', color: '#5A8A67', padding: '.2rem .55rem', borderRadius: 20, fontWeight: 500 },

  // Product modal
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(26,39,28,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:     { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 800, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  modalImg:  { width: '100%', aspectRatio: '4/3', objectFit: 'cover', flexShrink: 0, borderRadius: '20px 20px 0 0' },
  modalBody: { padding: '2rem' },
  modalTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 500, color: '#1A271C', marginTop: 0, marginBottom: '.5rem', letterSpacing: '-0.03em' },
  modalDesc: { fontSize: '.9rem', color: '#7B907D', lineHeight: 1.7, marginBottom: '1.25rem' },
  modalPrice:{ fontSize: '1.4rem', fontWeight: 700, color: '#5A8A67', marginBottom: '1.25rem' },
  cartBtn:   { width: '100%', padding: '1rem', background: '#5A8A67', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .2s', letterSpacing: '.01em' },
  closeBtn:  { position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 10 },
  closeWrapper:{ position: 'relative' },

  footer:    { borderTop: '1px solid #E4EBE5', padding: '2rem 1.5rem', textAlign: 'center', marginTop: '4rem' },
  footerText:{ fontSize: '.8rem', color: '#7B907D' },

  spinner:   { display: 'inline-block', width: 28, height: 28, border: '2px solid #E4EBE5', borderTop: '2px solid #5A8A67', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  errPage:   { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' },
  errTitle:  { fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#1A271C', margin: 0 },
}

export default function Storefront() {
  const { handle } = useParams()
  const { openAuthModal } = useAppContext()
  const [store, setStore]     = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [selected, setSelected] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const trackedViews = useRef(new Set())

  const { wallets } = useWallets()
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const { login: connectWallet, logout: disconnectWallet, walletAddress } = useAuth()

  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutDetails, setCheckoutDetails] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [pollingInterval, setPollingInterval] = useState(null)
  const [verifyAttempts, setVerifyAttempts] = useState(0)

  const startPolling = (reference) => {
    if (pollingInterval) clearInterval(pollingInterval)
    let attempts = 0
    const maxAttempts = 24
    
    const interval = setInterval(async () => {
      attempts += 1
      setVerifyAttempts(attempts)
      
      try {
        const res = await fetch(`${API}/api/checkout/solana/verify/${reference}`)
        if (!res.ok) throw new Error("Failed to verify payment")
        
        const data = await res.json()
        if (data.status === 'confirmed') {
          clearInterval(interval)
          setPaymentStatus('confirmed')
          setCart([])
          trackEvent(store.id, null, 'purchase')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setPaymentStatus('failed')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setPaymentStatus('timeout')
        }
      } catch (err) {
        console.error("Polling verify error:", err)
      }
    }, 2500)
    setPollingInterval(interval)
  }

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/selora-stores/public/${handle}`)
        if (!res.ok) { const j = await res.json(); throw new Error(j.detail || 'Store not found') }
        const data = await res.json()
        setStore(data.store)
        setProducts(data.products || [])
      } catch(e) { setError(e.message) }
      finally { setLoading(false) }
    }
    load()
  }, [handle])

  function openProduct(p) {
    setSelected(p)
    setAddedToCart(false)
    if (!trackedViews.current.has(p.id)) {
      trackedViews.current.add(p.id)
      trackEvent(store.id, p.id, 'view')
    }
  }

  function handleAddToCart() {
    if (!selected) return
    trackEvent(store.id, selected.id, 'add_to_cart')
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === selected.id)
      if (existing) {
        return prev.map(item => item.product.id === selected.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product: selected, quantity: 1 }]
    })
    
    setAddedToCart(true)
    setTimeout(() => {
      setAddedToCart(false)
      setSelected(null)
      setIsCartOpen(true)
    }, 850)
  }

  const handleCheckoutInitiate = async () => {
    setCheckoutLoading(true)
    setPaymentError('')
    setPaymentStatus('pending')
    setVerifyAttempts(0)
    
    try {
      const activeWallet = wallets?.find(w => w.chainType === 'solana')?.address || null
      const cartPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
      
      const response = await fetch(`${API}/api/checkout/solana/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: store.id,
          buyer_wallet: activeWallet,
          cart: cartPayload
        })
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Failed to initiate checkout")
      }
      
      const data = await response.json()
      setCheckoutDetails(data)
      startPolling(data.reference)
      
    } catch (err) {
      console.error(err)
      setPaymentError(err.message || "Could not connect to payment gateway")
      setPaymentStatus(null)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleWalletPayment = async () => {
    setCheckoutLoading(true)
    setPaymentError('')
    
    try {
      const selectedWallet = wallets?.find(w => w.chainType === 'solana') || wallets?.[0]
      if (!selectedWallet) {
        throw new Error("Please connect your wallet first")
      }
      
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      const rpc = createSolanaRpc(rpcUrl)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()
      
      const buyerAddr = address(selectedWallet.address)
      const recipientAddr = address(checkoutDetails.recipient)
      const mintAddr = address(checkoutDetails.spl_token_mint)
      const referenceAddr = address(checkoutDetails.reference)
      
      const [sourceAta] = await findAssociatedTokenPda({
        mint: mintAddr,
        owner: buyerAddr,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
      })
      
      const [destAta] = await findAssociatedTokenPda({
        mint: mintAddr,
        owner: recipientAddr,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
      })
      
      const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
        mint: mintAddr,
        owner: recipientAddr,
        payer: buyerAddr,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
      })
      
      const amountInBaseUnits = BigInt(Math.round(checkoutDetails.amount_usdc * 1_000_000))
      const transferIx = getTransferCheckedInstruction({
        source: sourceAta,
        destination: destAta,
        authority: buyerAddr,
        amount: amountInBaseUnits,
        decimals: 6,
        mint: mintAddr,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
      })
      
      transferIx.accounts.push({
        address: referenceAddr,
        role: AccountRole.READONLY
      })
      
      let message = createTransactionMessage({ version: 0 })
      message = setTransactionMessageFeePayer(buyerAddr, message)
      message = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message)
      message = appendTransactionMessageInstructions([createAtaIx, transferIx], message)
      const transactionMessage = compileTransaction(message)
      
      const encodedTx = new Uint8Array(getTransactionEncoder().encode(transactionMessage))
      
      const result = await signAndSendTransaction({
        transaction: encodedTx,
        wallet: selectedWallet
      })
      
      console.log("Transaction sent with signature:", result.signature)
      
      if (checkoutDetails?.reference) {
        startPolling(checkoutDetails.reference)
      }
      
    } catch (err) {
      console.error("Wallet transaction failed:", err)
      let msg = err.message || "Failed to sign transaction"
      if (msg.includes("User rejected")) {
        msg = "Transaction was rejected in your wallet."
      } else if (msg.includes("insufficient balance") || msg.includes("0x1")) {
        msg = "Insufficient Devnet SOL or USDC balance to complete the transaction."
      }
      setPaymentError(msg)
    } finally {
      setCheckoutLoading(false)
    }
  }


  function pct(price, compare) {
    if (!compare || compare <= price) return null
    return Math.round((1 - price / compare) * 100)
  }

  if (loading) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={S.spinner} />
    </div>
  )

  if (error) return (
    <div style={S.page}>
      <div style={S.errPage}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize:'3rem' }}>🔍</div>
        <h1 style={S.errTitle}>Store not found</h1>
        <p style={{ color:'#7B907D', fontSize:'.95rem' }}>{error}</p>
        <Link to="/" style={{ color:'#5A8A67', fontWeight:600, textDecoration:'none', fontSize:'.9rem' }}>← Back to Selora</Link>
      </div>
    </div>
  )

  const currency = store.currency || 'USD'

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .sf-prod-card:hover { box-shadow: 0 12px 40px rgba(26,39,28,.12); transform: translateY(-4px); }
        .sf-prod-card:hover .sf-prod-img { transform: scale(1.04); }
        .sf-cart-btn:hover { background: #4a7a57 !important; }
        @media (max-width: 700px) {
          .sf-modal-inner { flex-direction: column !important; }
          .sf-modal-img { border-radius: 20px 20px 0 0 !important; }
        }
        
        /* Drawer styles */
        .sf-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,39,28,.45);
          backdrop-filter: blur(4px);
          z-index: 299;
        }
        .sf-drawer {
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          width: 420px;
          background: #fff;
          box-shadow: -10px 0 40px rgba(26,39,28,.15);
          z-index: 300;
          padding: 2rem 1.5rem;
          box-sizing: border-box;
          animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
          display: flex;
          flex-direction: column;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 500px) {
          .sf-drawer { width: 100%; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <a href="/" style={S.brand}>Se<span style={{ color:'#5A8A67' }}>lo</span>ra</a>
          <div style={S.navRight}>
            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                background: 'var(--gpale)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer',
                color: 'var(--g)',
                fontSize: '.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '.45rem',
                fontFamily: 'Inter, sans-serif',
                padding: '.4rem .85rem',
                borderRadius: 8,
                marginRight: '.5rem',
                transition: 'all 0.15s'
              }}
            >
              <span>🛒</span>
              <span>Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </button>
            <span style={S.badge}>✦ Selora Store</span>
            {walletAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '.82rem', color: '#7B907D', fontWeight: 500 }}>
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <button 
                  onClick={disconnectWallet}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B907D',
                  fontSize: '.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      {store.cover_image ? (
        <div style={S.hero}>
          <img src={store.cover_image} alt={store.name} style={S.heroBg} />
          <div style={S.heroOverlay} />
          <div style={S.heroContent}>
            <h1 style={S.heroTitle}>{store.name}</h1>
            {store.description && <p style={S.heroSub}>{store.description}</p>}
          </div>
        </div>
      ) : (
        <div style={S.heroPlaceholder}>
          <div>
            <h1 style={S.heroTitleDark}>{store.name}</h1>
            {store.description && <p style={{ ...S.heroSub, color:'rgba(255,255,255,.75)', marginTop:'.75rem' }}>{store.description}</p>}
          </div>
        </div>
      )}

      {/* Products */}
      <main style={S.main}>
        <h2 style={S.sectionTitle}>Collection</h2>

        {products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#7B907D' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🌿</div>
            <p style={{ fontWeight:600, color:'#1A271C', fontSize:'1.1rem', marginBottom:'.5rem' }}>Coming soon</p>
            <p style={{ fontSize:'.9rem', margin:0 }}>This store hasn't added any products yet.</p>
          </div>
        ) : (
          <div style={S.grid}>
            {products.map(p => {
              const disc = pct(p.price, p.compare_at_price)
              return (
                <div
                  key={p.id}
                  style={S.prodCard}
                  className="sf-prod-card"
                  onClick={() => openProduct(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key==='Enter' && openProduct(p)}
                >
                  <div style={S.imgWrap}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} style={S.prodImg} className="sf-prod-img" />
                      : <div style={S.imgPlaceholder}>👗</div>
                    }
                    {disc && <span style={S.discBadge}>-{disc}%</span>}
                    {p.inventory === 0 && <span style={S.soldBadge}>Sold out</span>}
                  </div>
                  <div style={S.prodBody}>
                    <p style={S.prodName}>{p.title}</p>
                    <div style={S.priceRow}>
                      <span style={S.price}>{currency} {Number(p.price).toFixed(2)}</span>
                      {p.compare_at_price && <span style={S.compareAt}>{currency} {Number(p.compare_at_price).toFixed(2)}</span>}
                    </div>
                    {p.tags?.length > 0 && (
                      <div style={S.tags}>
                        {p.tags.slice(0,3).map(t => <span key={t} style={S.tag}>{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        <p style={S.footerText}>
          Powered by <a href="/" style={{ color:'#5A8A67', textDecoration:'none', fontWeight:600 }}>Selora</a>
          {' '}· <a href="/login" onClick={e => { e.preventDefault(); openAuthModal('signup') }} style={{ color:'#7B907D', textDecoration:'none', cursor:'pointer' }}>Start your store free</a>
        </p>
      </footer>

      {/* Product Detail Modal */}
      {selected && (
        <div style={S.overlay} onClick={e => { if(e.target===e.currentTarget) setSelected(null) }}>
          <div style={S.modal}>
            <div style={{ position:'relative' }}>
              {selected.images?.[0]
                ? <img src={selected.images[0]} alt={selected.title} style={S.modalImg} className="sf-modal-img" />
                : <div style={{ ...S.modalImg, background:'linear-gradient(135deg,#EDF3EE,#C8DCC9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem' }}>👗</div>
              }
              <button style={S.closeBtn} onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div style={S.modalBody}>
              <h2 style={S.modalTitle}>{selected.title}</h2>
              {selected.description && <p style={S.modalDesc}>{selected.description}</p>}
              <div style={{ ...S.priceRow, marginBottom:'1.5rem' }}>
                <span style={{ ...S.price, fontSize:'1.5rem' }}>{currency} {Number(selected.price).toFixed(2)}</span>
                {selected.compare_at_price && (
                  <span style={{ ...S.compareAt, fontSize:'1rem' }}>{currency} {Number(selected.compare_at_price).toFixed(2)}</span>
                )}
                {pct(selected.price, selected.compare_at_price) && (
                  <span style={{ ...S.discBadge, position:'static', fontSize:'.78rem', verticalAlign:'middle' }}>
                    -{pct(selected.price, selected.compare_at_price)}% off
                  </span>
                )}
              </div>

              {selected.tags?.length > 0 && (
                <div style={{ ...S.tags, marginBottom:'1.5rem' }}>
                  {selected.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}
                </div>
              )}

              <p style={{ fontSize:'.82rem', color:'#7B907D', marginBottom:'1.25rem' }}>
                {selected.inventory > 0 ? `✅ ${selected.inventory} in stock` : '❌ Currently out of stock'}
              </p>

              <button
                className="sf-cart-btn"
                style={{ ...S.cartBtn, background: addedToCart ? '#166534' : '#5A8A67' }}
                onClick={handleAddToCart}
                disabled={selected.inventory === 0}
              >
                {addedToCart ? '✓ Added to Cart' : selected.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {selected.images?.length > 1 && (
                <div style={{ display:'flex', gap:'.5rem', marginTop:'1.25rem', flexWrap:'wrap' }}>
                  {selected.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${selected.title} ${i+1}`}
                      style={{ width:64, height:64, objectFit:'cover', borderRadius:8, border:'2px solid transparent', cursor:'pointer', transition:'border-color .15s' }}
                      onMouseOver={e => e.target.style.borderColor='#5A8A67'}
                      onMouseOut={e => e.target.style.borderColor='transparent'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCartOpen && (
        <>
          <div className="sf-drawer-overlay" onClick={() => {
            if (paymentStatus !== 'pending') {
              setIsCartOpen(false);
              if (pollingInterval) clearInterval(pollingInterval);
              setCheckoutDetails(null);
              setPaymentStatus(null);
            }
          }} />
          <div className="sf-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Your Bag</h2>
              <button 
                onClick={() => {
                  if (paymentStatus !== 'pending') {
                    setIsCartOpen(false);
                    if (pollingInterval) clearInterval(pollingInterval);
                    setCheckoutDetails(null);
                    setPaymentStatus(null);
                  }
                }}
                disabled={paymentStatus === 'pending'}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: paymentStatus === 'pending' ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</span>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>Your bag is empty</p>
                <p style={{ fontSize: '.85rem', margin: 0 }}>Browse the collection and add some items to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Cart Items List */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '.25rem' }} className="no-scrollbar">
                  {cart.map(item => (
                    <div key={item.product.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.title} style={{ width: 70, height: 85, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 70, height: 85, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: '1.5rem' }}>👗</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '.9rem', margin: '0 0 .25rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.title}</p>
                        <p style={{ fontSize: '.85rem', color: 'var(--g)', fontWeight: 700, margin: '0 0 .5rem' }}>{currency} {Number(item.product.price).toFixed(2)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <button 
                            onClick={() => {
                              setCart(prev => prev.map(x => x.product.id === item.product.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x));
                            }}
                            disabled={paymentStatus === 'pending'}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{item.quantity}</span>
                          <button 
                            onClick={() => {
                              setCart(prev => prev.map(x => x.product.id === item.product.id ? { ...x, quantity: x.quantity + 1 } : x));
                            }}
                            disabled={paymentStatus === 'pending'}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}
                          >
                            +
                          </button>
                          <button 
                            onClick={() => {
                              setCart(prev => prev.filter(x => x.product.id !== item.product.id));
                            }}
                            disabled={paymentStatus === 'pending'}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#DC2626', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout Summary & Action */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', background: '#fff', marginTop: 'auto', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                    <span>Total USD</span>
                    <span>{currency} {cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</span>
                  </div>

                  {paymentError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.75rem', fontSize: '.8rem', color: '#DC2626', marginBottom: '1rem', lineHeight: 1.4, textAlign: 'left' }}>
                      ⚠️ {paymentError}
                    </div>
                  )}

                  {!checkoutDetails ? (
                    <button
                      onClick={handleCheckoutInitiate}
                      disabled={checkoutLoading}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'var(--g)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: '.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '.5rem'
                      }}
                    >
                      {checkoutLoading ? (
                        <>
                          <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                          Preparing Payment...
                        </>
                      ) : (
                        <>Pay with Solana (USDC)</>
                      )}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', background: 'var(--bg-2)' }}>
                      {paymentStatus === 'pending' && (
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '.9rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>Solana Devnet Checkout</p>
                          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                            Transferring <strong>{checkoutDetails.amount_usdc.toFixed(2)} USDC</strong>
                          </p>

                          {/* Connected Wallet Button or Connect Wallet Action */}
                          {walletAddress ? (
                            <button
                              onClick={handleWalletPayment}
                              disabled={checkoutLoading}
                              style={{
                                width: '100%',
                                padding: '.75rem',
                                background: '#1A271C',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: '.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '.5rem',
                                marginBottom: '1rem'
                              }}
                            >
                              {checkoutLoading ? (
                                <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                              ) : (
                                "Pay with Connected Wallet"
                              )}
                            </button>
                          ) : (
                            <div style={{ marginBottom: '1rem' }}>
                              <button
                                onClick={connectWallet}
                                style={{
                                  width: '100%',
                                  padding: '.75rem',
                                  background: '#1A271C',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: '.85rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '.5rem',
                                  marginBottom: '.5rem'
                                }}
                              >
                                Connect Wallet to Pay
                              </button>
                              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                Connect your Solana wallet via Privy to pay directly on desktop, or scan below.
                              </p>
                            </div>
                          )}

                          {/* QR Code */}
                          <div style={{ background: '#fff', padding: '.75rem', borderRadius: 10, display: 'inline-block', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=1a271c&data=${encodeURIComponent(
                                `solana:${checkoutDetails.recipient}?amount=${checkoutDetails.amount_usdc}&spl-token=${checkoutDetails.spl_token_mint}&reference=${checkoutDetails.reference}&label=Selora%20Store&message=${encodeURIComponent(checkoutDetails.memo)}`
                              )}`} 
                              alt="Solana Pay QR Code" 
                              style={{ width: 180, height: 180, display: 'block' }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--g)', fontWeight: 500 }}>
                            <div style={{ width: 12, height: 12, border: '2px solid var(--g)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                            <span>Awaiting block confirmation ({verifyAttempts}/24)...</span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'confirmed' && (
                        <div style={{ padding: '1rem 0' }}>
                          <div style={{ fontSize: '3rem', color: 'var(--g)', marginBottom: '.5rem' }}>✓</div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 .25rem' }}>Payment Confirmed!</p>
                          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Your order has been placed successfully.</p>
                          <button
                            onClick={() => {
                              setIsCartOpen(false);
                              setCheckoutDetails(null);
                              setPaymentStatus(null);
                            }}
                            style={{ width: '100%', padding: '.7rem', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Continue Shopping
                          </button>
                        </div>
                      )}

                      {paymentStatus === 'timeout' && (
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '.9rem', margin: '0 0 .5rem', color: '#DC2626' }}>Verification Timeout</p>
                          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
                            Still waiting? Ensure your wallet transaction completed on Devnet, then re-check manually.
                          </p>
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <button
                              onClick={() => {
                                setVerifyAttempts(0);
                                if (checkoutDetails?.reference) {
                                  startPolling(checkoutDetails.reference);
                                  setPaymentStatus('pending');
                                }
                              }}
                              style={{ flex: 1, padding: '.6rem', border: '1.5px solid var(--g)', background: 'transparent', color: 'var(--g)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.8rem' }}
                            >
                              Check Again
                            </button>
                            <button
                              onClick={() => {
                                setCheckoutDetails(null);
                                setPaymentStatus(null);
                              }}
                              style={{ flex: 1, padding: '.6rem', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.8rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

