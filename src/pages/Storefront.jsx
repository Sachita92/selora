import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useAuth } from '../lib/useAuth'


const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEBUG_PAYMENTS = import.meta.env.DEV
const logPayment = (...args) => { if (DEBUG_PAYMENTS) console.log(...args) }
const warnPayment = (...args) => { if (DEBUG_PAYMENTS) console.warn(...args) }
const errorPayment = (...args) => { if (DEBUG_PAYMENTS) console.error(...args) }

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

function deepMerge(target, source) {
  if (!source) return target;
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
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
  modal:     { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 800, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalImg:  { width: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' },
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

// --- SVG Icons for Template ---
const LeafIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 8.5C17 15 15 18 11 20Z" />
    <path d="M19 2c-2.26 4.33-5.27 7.14-8 10" />
  </svg>
)

const TruckIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const ArrowPathIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
)

const ShieldIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const BagIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

function renderIcon(name, size = 20, color = "currentColor") {
  switch (name) {
    case 'leaf': return <LeafIcon size={size} color={color} />;
    case 'truck': return <TruckIcon size={size} color={color} />;
    case 'arrow-path': return <ArrowPathIcon size={size} color={color} />;
    case 'shield': return <ShieldIcon size={size} color={color} />;
    case 'bag': return <BagIcon size={size} color={color} />;
    default: return <LeafIcon size={size} color={color} />;
  }
}

// --- Default Template Data (easily swappable/overridden by seller settings) ---
const defaultTemplateData = {
  header: {
    logoName: "Selora",
    navLinks: [
      { label: "Home", url: "#" },
      { label: "Collections", url: "#" },
      { label: "New In", url: "#" },
      { label: "About", url: "#" }
    ]
  },
  hero: {
    eyebrow: "NEW SEASON ARRIVALS",
    title: "Dress Like the\nPerson You're\nBecoming",
    subtitle: "Curated fashion, AI-optimized for you — discover pieces that sell themselves.",
    ctaPrimaryText: "Shop the Collection",
    ctaPrimaryUrl: "#new-arrivals",
    ctaSecondaryText: "Explore Lookbook",
    ctaSecondaryUrl: "#brand-story",
    image: "/hero-dress.png", // fallback or default image from public
    trustBar: [
      { icon: "leaf", label: "Sustainably Curated" },
      { icon: "truck", label: "Free Shipping over $75" },
      { icon: "arrow-path", label: "Easy 30-Day Returns" },
      { icon: "shield", label: "Secure Checkout" }
    ]
  },
  categories: {
    eyebrow: "EXPLORE",
    title: "Shop by Category",
    items: [
      { name: "Tops & Blouses", color: "#1A271C", textColor: "#ffffff", image: null, url: "#" },
      { name: "Dresses", color: "#E5D9C4", textColor: "#1A271C", image: null, url: "#" },
      { name: "Outerwear", color: "#82A996", textColor: "#ffffff", image: null, url: "#" },
      { name: "Accessories", color: "#3B5A44", textColor: "#ffffff", image: null, url: "#" }
    ]
  },
  newArrivals: {
    eyebrow: "HANDPICKED FOR YOU",
    title: "New Arrivals",
    viewAllText: "View All Products",
    viewAllUrl: "#",
    items: [
      { id: "sample-1", title: "Linen Wrap Dress", category: "DRESSES", price: 89.00, images: [] },
      { id: "sample-2", title: "Cotton Blazer", category: "OUTERWEAR", price: 145.00, images: [] },
      { id: "sample-3", title: "Silk Midi Skirt", category: "BOTTOMS", price: 112.00, images: [] },
      { id: "sample-4", title: "Knit Cardigan", category: "TOPS", price: 78.00, images: [] }
    ]
  },
  brandStory: {
    eyebrow: "OUR STORY",
    title: "Timeless designs, sustainably crafted",
    subtitle: "We curate timeless, high-quality essentials designed to elevate your everyday. Crafted with sustainable materials and attention to detail, each piece is selected to last.",
    ctaText: "Learn About Us",
    ctaUrl: "#",
    image: null, // slot for brand photo
    aiBadgeText: "SELORA AI OPTIMIZED"
  },
  newsletter: {
    eyebrow: "STAY IN THE LOOP",
    title: "Get first access to new drops",
    subtitle: "New arrivals, exclusive pieces, and styling tips — delivered to your inbox.",
    buttonText: "Subscribe",
    inputPlaceholder: "Enter your email address"
  }
}

// --- Reusable ProductCard Component ---
function ProductCard({ product, isSample = false, isAdded = false, onProductClick, onAddToCart, resolvedCategoryName, currency = 'USD' }) {
  const hasImage = product.images && product.images.length > 0;

  return (
    <div
      onClick={() => !isSample && onProductClick && onProductClick(product)}
      style={{
        cursor: isSample ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #E4EBE5',
        transition: 'all 0.3s ease',
      }}
      className={isSample ? "" : "sf-prod-card"}
    >
      {/* Image Wrapper */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: '#F8FAF8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            className="sf-prod-img"
          />
        ) : (
          <div style={{ color: '#5A8A67', opacity: 0.45 }}>
            <LeafIcon size={48} color="#5A8A67" />
          </div>
        )}

        {/* Sample Badge */}
        {isSample && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#EDF3EE', border: '1px solid #C7DACB', color: '#5A8A67', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4, letterSpacing: '0.04em', zIndex: 10 }}>
            SAMPLE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5A8A67', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {resolvedCategoryName}
          </span>
          <h4 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 500, color: '#1A271C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.title}
          </h4>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1A271C' }}>
            {currency} {Number(product.price).toFixed(2)}
          </span>
        </div>

        {/* Add to Bag Button / Sample Badge */}
        {isSample ? (
          <div
            style={{
              background: '#EDF3EE',
              color: '#5A8A67',
              border: '1px solid #C7DACB',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 4,
              letterSpacing: '0.04em',
              flexShrink: 0,
              textTransform: 'uppercase'
            }}
          >
            Sample
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) onAddToCart(product);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isAdded ? '#1E3A2F' : '#5A8A67',
              color: '#ffffff',
              border: 'none',
              borderRadius: isAdded ? '8px' : '50%',
              width: isAdded ? 'auto' : 32,
              height: 32,
              padding: isAdded ? '0 0.75rem' : 0,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {isAdded ? (
              <span>Added ✓</span>
            ) : (
              <BagIcon size={14} color="#ffffff" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Reusable ProductGrid Component ---
function ProductGrid({ products, isSample = false, onProductClick, onAddToCart, currency = 'USD', categories = [] }) {
  const [addedMap, setAddedMap] = useState({})

  const handleAddClick = (prod) => {
    if (isSample) return;
    if (onAddToCart) onAddToCart(prod);
    setAddedMap(prev => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  return (
    <div className="sf-product-grid">
      {products.map((p) => {
        const isAdded = !!addedMap[p.id];
        const resolvedCategoryName = isSample
          ? (p.category || 'FASHION').toUpperCase()
          : (categories?.find(c => c.id === p.category_id)?.name || 'Uncategorized').toUpperCase();

        return (
          <ProductCard
            key={p.id}
            product={p}
            isSample={isSample}
            isAdded={isAdded}
            onProductClick={onProductClick}
            onAddToCart={handleAddClick}
            resolvedCategoryName={resolvedCategoryName}
            currency={currency}
          />
        );
      })}
    </div>
  );
}

export default function Storefront({ previewData = null }) {
  const { handle } = useParams()
  const { openAuthModal } = useAppContext()
  const [store, setStore]     = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const trackedViews = useRef(new Set())

  const triggerEvent = (prodId, type) => {
    if (previewData) return;
    if (store?.id) trackEvent(store.id, prodId, type);
  };
  const [selected, setSelected] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const { login: connectWallet, logout: disconnectWallet, walletAddress } = useAuth()

  // Track whether Phantom is installed and connected (for the direct-pay button)
  const [phantomConnected, setPhantomConnected] = useState(() => !!(window.solana?.isPhantom && window.solana?.isConnected))

  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutDetails, setCheckoutDetails] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [pollingInterval, setPollingInterval] = useState(null)
  const [verifyAttempts, setVerifyAttempts] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState([])
  const [txSignature, setTxSignature] = useState('')

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
          setTxSignature(data.signature || '')
          setPurchasedItems([...cart])
          setPaymentStatus('confirmed')
          setCart([])
          triggerEvent(null, 'purchase')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setPaymentStatus('failed')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setPaymentStatus('timeout')
        }
      } catch (err) {
        errorPayment("Polling verify error:", err)
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
    if (previewData) {
      setStore(previewData.store)
      setProducts(previewData.products || [])
      setLoading(false)
      return
    }
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
  }, [handle, previewData])

  useEffect(() => {
    if (store) {
      document.title = store.name || "Selora Store"
      if (!previewData) {
        trackEvent(store.id, null, 'view')
      }
    }
  }, [store, previewData])

  function openProduct(p) {
    setSelected(p)
    setAddedToCart(false)
    setActiveImageIdx(0)
    if (!trackedViews.current.has(p.id)) {
      trackedViews.current.add(p.id)
      triggerEvent(p.id, 'view')
    }
  }

  function handleAddToCart() {
    if (!selected) return
    triggerEvent(selected.id, 'add_to_cart')
    
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
    if (previewData) {
      alert("Checkout is disabled in preview mode");
      return;
    }
    setCheckoutLoading(true)
    setPaymentError('')
    setPaymentStatus('pending')
    setVerifyAttempts(0)
    
    try {
      const activeWallet = window.solana?.publicKey?.toString() || null
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
      // ⚠️ Do NOT start polling here — polling only starts after the wallet
      // transaction is actually sent (in handleWalletPayment). Starting it here
      // burns all 24 poll attempts before the user even clicks Pay.
      
    } catch (err) {
      errorPayment(err)
      setPaymentError(err.message || "Could not connect to payment gateway")
      setPaymentStatus(null)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleWalletPayment = async () => {
    logPayment('[Payment] handleWalletPayment called, checkoutDetails:', checkoutDetails)
    setCheckoutLoading(true)
    setPaymentError('')

    try {
      // ── 1. Connect to Phantom via the injected provider ─────────────────────
      const phantom = window.solana
      if (!phantom || !phantom.isPhantom) {
        throw new Error("Phantom wallet not found. Please install the Phantom browser extension.")
      }
      if (!phantom.isConnected) {
        await phantom.connect()
      }
      const buyerPubkey = phantom.publicKey
      if (!buyerPubkey) {
        throw new Error("Could not read Phantom public key. Make sure Phantom is unlocked.")
      }
      setPhantomConnected(true)

      logPayment('[Payment] Loading Solana SDK...')
      const [
        { Connection, PublicKey, TransactionMessage, VersionedTransaction },
        { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
          createTransferCheckedInstruction, TOKEN_PROGRAM_ID, getMint },
      ] = await Promise.all([
        import('@solana/web3.js'),
        import('@solana/spl-token'),
      ])
      logPayment('[Payment] SDK loaded ✓')

      // ── 3. Set up connection and keys ────────────────────────────────────────
      // IMPORTANT: Use backend proxy for all RPC calls — api.devnet.solana.com
      // cannot be called directly from the browser (CORS preflight failures).
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL ||
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/rpc/solana`
      const wsUrl = rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost')
        ? 'wss://api.devnet.solana.com/'
        : undefined
      logPayment('[Payment] RPC (via proxy):', rpcUrl)
      logPayment('[Payment] WS Endpoint:', wsUrl || 'Auto-derived')
      logPayment('[Payment] Mint:', checkoutDetails.spl_token_mint)
      logPayment('[Payment] Recipient:', checkoutDetails.recipient)
      logPayment('[Payment] Reference:', checkoutDetails.reference)
      logPayment('[Payment] Amount USDC:', checkoutDetails.amount_usdc)
      const conn      = new Connection(rpcUrl, { commitment: 'confirmed', wsEndpoint: wsUrl })
      const mintPk    = new PublicKey(checkoutDetails.spl_token_mint)
      const recipient = new PublicKey(checkoutDetails.recipient)
      const reference = new PublicKey(checkoutDetails.reference)

      let decimals = 6
      try {
        const mintInfo = await getMint(conn, mintPk)
        decimals = mintInfo.decimals
        logPayment('[Payment] Mint decimals from chain:', decimals)
      } catch (_) {
        warnPayment('[Payment] Could not fetch mint info, using decimals=6')
      }

      const sourceAta = getAssociatedTokenAddressSync(mintPk, buyerPubkey, false, TOKEN_PROGRAM_ID)
      const destAta   = getAssociatedTokenAddressSync(mintPk, recipient,   false, TOKEN_PROGRAM_ID)
      logPayment('[Payment] Source ATA:', sourceAta.toString())
      logPayment('[Payment] Dest ATA:', destAta.toString())

      const amountRaw = BigInt(Math.round(checkoutDetails.amount_usdc * Math.pow(10, decimals)))
      logPayment('[Payment] Amount raw:', amountRaw.toString())

      const createDestAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        buyerPubkey, destAta, recipient, mintPk, TOKEN_PROGRAM_ID
      )
      const transferIx = createTransferCheckedInstruction(
        sourceAta, mintPk, destAta,
        buyerPubkey,
        amountRaw, decimals, [], TOKEN_PROGRAM_ID
      )
      transferIx.keys.push({ pubkey: reference, isSigner: false, isWritable: false })
      logPayment('[Payment] Instructions built ✓')

      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed')
      logPayment('[Payment] Blockhash:', blockhash)
      const txMsg = new TransactionMessage({
        payerKey: buyerPubkey,
        recentBlockhash: blockhash,
        instructions: [createDestAtaIx, transferIx],
      }).compileToV0Message()
      const versionedTx = new VersionedTransaction(txMsg)
      logPayment('[Payment] VersionedTransaction built ✓')

      logPayment('[Payment] Calling phantom.signAndSendTransaction...')
      const { signature } = await phantom.signAndSendTransaction(versionedTx)
      logPayment('[Payment] Transaction sent ✓ signature:', signature)

      logPayment('[Payment] Waiting for on-chain confirmation...')
      await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
      logPayment('[Payment] Transaction confirmed ✓')

      if (checkoutDetails?.reference) {
        startPolling(checkoutDetails.reference)
      }

    } catch (err) {
      errorPayment('[Payment] FAILED at step above ↑', err)
      let msg = err.message || "Failed to sign transaction"
      if (msg.includes("User rejected") || msg.includes("rejected") || msg.includes("cancelled")) {
        msg = "Transaction was cancelled in Phantom."
      } else if (msg.includes("insufficient") || msg.includes("0x1") || msg.includes("balance") || msg.includes("0 lamports")) {
        msg = "Insufficient USDC-Dev or SOL balance. Make sure Phantom has USDC-Dev from spl-token-faucet.com."
      } else if (msg.includes("TokenAccountNotFound") || msg.includes("Account does not exist")) {
        msg = "USDC-Dev token account not found. Make sure you received USDC-Dev from spl-token-faucet.com."
      }
      setPaymentError(msg + (err.message && msg !== err.message ? ` — ${err.message}` : ''))
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
        <div style={{ color: '#5A8A67', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h1 style={S.errTitle}>Store not found</h1>
        <p style={{ color:'#7B907D', fontSize:'.95rem' }}>{error}</p>
        <Link to="/" style={{ color:'#5A8A67', fontWeight:600, textDecoration:'none', fontSize:'.9rem' }}>← Back to Selora</Link>
      </div>
    </div>
  )

  const currency = store.currency || 'USD'
  const template = deepMerge(defaultTemplateData, store?.template_data)

  const imgMain = store.hero_image_main
  const imgLeft = store.hero_image_left
  const imgRight = store.hero_image_right
  const hasAnyHero = !!(imgMain || imgLeft || imgRight)

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .sf-prod-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .sf-prod-card:hover {
          box-shadow: 0 12px 30px rgba(26,39,28,0.08) !important;
          transform: translateY(-4px);
        }
        .sf-prod-card:hover .sf-prod-img {
          transform: scale(1.04);
        }
        .sf-cat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(26,39,28,0.12);
        }
        .sf-bag-btn:hover {
          background-color: #EDF3EE !important;
        }
        .sf-hero-btn-primary:hover {
          background-color: #719683 !important;
          transform: translateY(-1px);
        }
        .sf-hero-btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.7) !important;
        }
        .sf-nav-link:hover {
          color: #1A271C !important;
        }
        .sf-newsletter-btn:hover {
          background-color: #9EC0AF !important;
        }
        
        /* Grid definitions & Responsive breakpoints */
        .sf-trust-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background-color: #F8FAF8;
          border-bottom: 1px solid #E4EBE5;
          padding: 1.5rem 1rem;
        }
        .sf-trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.5rem 1.5rem;
          transition: background-color 0.2s ease;
        }
        .sf-trust-item:hover {
          background-color: rgba(90, 138, 103, 0.05);
        }
        .sf-trust-item:not(:last-child) {
          border-right: 1px solid #E4EBE5;
        }
        @media (max-width: 768px) {
          .sf-trust-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          .sf-trust-item {
            border-right: none !important;
          }
          .sf-trust-item:nth-child(odd) {
            border-right: 1px solid #E4EBE5 !important;
          }
        }
        @media (max-width: 480px) {
          .sf-trust-bar {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          .sf-trust-item {
            border-right: none !important;
          }
        }

        .sf-hero-section {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          background-color: #1A271C;
          color: #ffffff;
        }
        .sf-hero-left {
          padding: 5rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.5rem;
        }
        .sf-hero-right {
          position: relative;
          min-height: 400px;
        }
        .sf-hero-image-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .sf-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sf-hero-stack-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #131d15;
          overflow: hidden;
          padding: 2rem;
        }
        .sf-hero-stack {
          position: relative;
          width: 250px;
          height: 333px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sf-hero-card {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          background-color: #EAE5D9;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom center;
        }
        .sf-hero-card-left {
          --base-rot: -10deg;
          --base-tx: -65px;
          z-index: 1;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          background-color: #1E3A2F;
          animation: sway-left 6s ease-in-out infinite;
        }
        .sf-hero-card-right {
          --base-rot: 10deg;
          --base-tx: 65px;
          z-index: 1;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          background-color: #284E39;
          animation: sway-right 6.5s ease-in-out infinite;
        }
        .sf-hero-card-main {
          z-index: 2;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          background-color: #EAE5D9;
          animation: float-main 5s ease-in-out infinite;
        }
        .sf-hero-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sf-hero-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: rgba(255,255,255,0.02);
          border: 2px dashed rgba(255,255,255,0.12);
          margin: 2rem;
          border-radius: 16px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          padding: 1.5rem;
        }
        .sf-hero-placeholder-icon {
          font-size: 3rem;
          color: rgba(255,255,255,0.2);
        }

        @keyframes sway-left {
          0%, 100% { transform: rotate(var(--base-rot)) translateX(var(--base-tx)) scale(0.92); }
          50% { transform: rotate(calc(var(--base-rot) - 2.5deg)) translateX(var(--base-tx)) scale(0.92); }
        }
        @keyframes sway-right {
          0%, 100% { transform: rotate(var(--base-rot)) translateX(var(--base-tx)) scale(0.92); }
          50% { transform: rotate(calc(var(--base-rot) + 2.5deg)) translateX(var(--base-tx)) scale(0.92); }
        }
        @keyframes float-main {
          0%, 100% { transform: rotate(0deg) translateY(0) scale(1); }
          50% { transform: rotate(1.5deg) translateY(-5px) scale(1.01); }
        }

        @media (max-width: 768px) {
          .sf-hero-section {
            grid-template-columns: 1fr;
          }
          .sf-hero-left {
            padding: 4rem 1.5rem;
            gap: 1.25rem;
          }
          .sf-hero-right {
            min-height: 350px;
            height: 350px;
          }
          .sf-hero-stack {
            width: 170px;
            height: 227px;
          }
          .sf-hero-card-left {
            --base-rot: -8deg;
            --base-tx: -45px;
          }
          .sf-hero-card-right {
            --base-rot: 8deg;
            --base-tx: 45px;
          }
        }

        .sf-category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .sf-product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .sf-product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .sf-product-grid {
            grid-template-columns: 1fr;
          }
        }

        .sf-brand-story {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .sf-brand-story {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        @media (max-width: 500px) {
          .sf-newsletter-form {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .sf-newsletter-input, .sf-newsletter-btn {
            width: 100% !important;
          }
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
        @media (max-width: 640px) {
          .sf-nav-links {
            display: none !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248, 250, 248, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E4EBE5', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: logo/name */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#" style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 700, color: '#1A271C', textDecoration: 'none', letterSpacing: '-0.02em', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }} title={store.name || "Selora"}>
              {store.name || "Selora"}
            </a>
          </div>

          {/* Center: nav links */}
          <div style={{ display: 'flex', gap: '2rem' }} className="sf-nav-links">
            {template.header.navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#3B5A44',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                className="sf-nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Bag */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#1A271C',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                borderRadius: 8,
                transition: 'all 0.2s',
              }}
              className="sf-bag-btn"
            >
              <BagIcon size={18} color="#1A271C" />
              <span>Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="sf-hero-section">
        {/* Left Half: Headline, Paragraph, CTAs */}
        <div className="sf-hero-left">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82A996', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {template.hero.eyebrow}
          </span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 500, color: '#ffffff', margin: 0, lineHeight: 1.1, whiteSpace: 'pre-line' }}>
            {template.hero.title}
          </h1>
          <p style={{ fontSize: '1rem', color: '#B8BCB8', lineHeight: 1.6, margin: '0.5rem 0 1rem' }}>
            {store.description !== null && store.description !== undefined ? store.description : template.hero.subtitle}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <a
              href={template.hero.ctaPrimaryUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.75rem',
                backgroundColor: '#82A996',
                color: '#1A271C',
                borderRadius: 30,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
              className="sf-hero-btn-primary"
            >
              {template.hero.ctaPrimaryText} &rarr;
            </a>
            <a
              href={template.hero.ctaSecondaryUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.75rem',
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderRadius: 30,
                border: '1.5px solid rgba(255,255,255,0.4)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
              className="sf-hero-btn-secondary"
            >
              {template.hero.ctaSecondaryText}
            </a>
          </div>
        </div>

        {/* Right Half: Stacked Card Composition or Placeholder */}
        <div className="sf-hero-right">
          {hasAnyHero ? (
            <div className="sf-hero-stack-container">
              <div className="sf-hero-stack">
                {/* Left Card */}
                {imgLeft && (
                  <div className="sf-hero-card sf-hero-card-left">
                    <img src={imgLeft} alt="" />
                  </div>
                )}
                {/* Right Card */}
                {imgRight && (
                  <div className="sf-hero-card sf-hero-card-right">
                    <img src={imgRight} alt="" />
                  </div>
                )}
                {/* Main Card */}
                {imgMain && (
                  <div className="sf-hero-card sf-hero-card-main">
                    <img src={imgMain} alt="" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sf-hero-placeholder">
              <div className="sf-hero-placeholder-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><LeafIcon size={48} color="rgba(255,255,255,0.2)" /></div>
              <p style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500 }}>Add your hero images</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
                Go to the store builder settings tab to complete onboarding
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TRUST BAR */}
      <div className="sf-trust-bar">
        {template.hero.trustBar.map((item, idx) => (
          <div key={idx} className="sf-trust-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A2F' }}>
              {renderIcon(item.icon, 20, '#1E3A2F')}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E3A2F', fontFamily: 'Inter, sans-serif' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 1.5rem' }}>
        
        {/* SHOP BY CATEGORY */}
        <section style={{ marginBottom: '6rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A8A67', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            {template.categories.eyebrow}
          </span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, color: '#1A271C', margin: '0 0 2rem' }}>
            {template.categories.title}
          </h2>

          <div className="sf-category-grid">
            {(() => {
              const isCustom = store && store.categories !== null && store.categories !== undefined;
              const items = isCustom ? store.categories : template.categories.items;
              const dynamicColors = [
                { bg: '#1A271C', text: '#EAE5D9' },
                { bg: '#EAE5D9', text: '#1A271C' },
                { bg: '#8D9B8E', text: '#1E3A2F' },
                { bg: '#3D4A3E', text: '#EAE5D9' }
              ];
              return items.map((item, idx) => {
                const imageUrl = isCustom ? item.image_url : item.image;
                const colorIndex = idx % dynamicColors.length;
                const fallbackBg = isCustom ? dynamicColors[colorIndex].bg : (item.color || '#EAE5D9');
                const catTextColor = imageUrl ? '#ffffff' : (isCustom ? dynamicColors[colorIndex].text : (item.textColor || '#ffffff'));
                const linkTarget = isCustom ? item.link_target : item.link;

                return (
                  <a
                    key={item.id || idx}
                    href={linkTarget || '#'}
                    style={{
                      backgroundColor: fallbackBg,
                      backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      borderRadius: 16,
                      aspectRatio: '4/3',
                      padding: '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none'
                    }}
                    className="sf-cat-card"
                  >
                    {imageUrl && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 16, zIndex: 1 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', color: catTextColor, margin: '0 0 0.5rem', fontWeight: 400 }}>
                        {item.name}
                      </h3>
                      <span style={{ color: catTextColor, opacity: 0.85, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Browse &rarr;
                      </span>
                    </div>
                  </a>
                )
              });
            })()}
          </div>
        </section>

        {/* NEW ARRIVALS / PRODUCT GRID */}
        <section id="new-arrivals" style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A8A67', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                {template.newArrivals.eyebrow}
              </span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, color: '#1A271C', margin: 0 }}>
                {template.newArrivals.title}
              </h2>
            </div>
            <a href={template.newArrivals.viewAllUrl} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#5A8A67', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {template.newArrivals.viewAllText} &rarr;
            </a>
          </div>

          <ProductGrid
            products={products.length > 0 ? products.slice(0, 4) : template.newArrivals.items}
            isSample={products.length === 0}
            categories={store?.categories}
            onProductClick={openProduct}
            onAddToCart={(prod) => {
              triggerEvent(prod.id, 'add_to_cart');
              setCart(prev => {
                const existing = prev.find(item => item.product.id === prod.id);
                if (existing) {
                  return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                return [...prev, { product: prod, quantity: 1 }];
              });
            }}
            currency={currency}
          />
        </section>

        {/* BRAND STORY */}
        <section id="brand-story" className="sf-brand-story" style={{ marginBottom: '2rem' }}>
          {/* Left half: Brand Photo */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1.1/1', background: '#F5F3E9', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {(store.cover_image || template.brandStory.image) ? (
              <img src={store.cover_image || template.brandStory.image} alt="Brand Story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#7B907D' }}>
                <LeafIcon size={40} color="#7B907D" />
                <p style={{ margin: '0.5rem 0 0', fontWeight: 500, fontSize: '0.9rem' }}>Brand Photo</p>
              </div>
            )}
            {/* Small Optimized Badge */}
            {template.brandStory.showAiBadge !== false && (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#EDF3EE', border: '1px solid #C7DACB', color: '#5A8A67', fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: 4, letterSpacing: '0.04em', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {template.brandStory.aiBadgeText || "SELORA AI OPTIMIZED"}
              </div>
            )}
          </div>

          {/* Right half: Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A8A67', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {template.brandStory.eyebrow}
            </span>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 500, color: '#1A271C', margin: 0, lineHeight: 1.15 }}>
              {template.brandStory.title}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#7B907D', lineHeight: 1.7, margin: '0.5rem 0' }}>
              {template.brandStory.subtitle}
            </p>
            <a href={template.brandStory.ctaUrl} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: '#5A8A67', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {template.brandStory.ctaText} &rarr;
            </a>
          </div>
        </section>

      </main>

      {/* NEWSLETTER / FOOTER BAND */}
      <section style={{ backgroundColor: '#1A271C', color: '#ffffff', padding: '5rem 2rem', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} className="sf-newsletter-section">
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82A996', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {template.newsletter.eyebrow}
          </span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            {template.newsletter.title}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 1rem' }}>
            {template.newsletter.subtitle}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }} style={{ display: 'flex', width: '100%', maxWidth: 500, gap: '0.75rem', marginTop: '0.5rem' }} className="sf-newsletter-form">
            <input
              type="email"
              placeholder={template.newsletter.inputPlaceholder}
              required
              style={{
                flex: 1,
                padding: '0.85rem 1.25rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              className="sf-newsletter-input"
            />
            <button
              type="submit"
              style={{
                padding: '0.85rem 2rem',
                borderRadius: 8,
                background: '#82A996',
                color: '#1A271C',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                transition: 'background-color 0.2s',
              }}
              className="sf-newsletter-btn"
            >
              {template.newsletter.buttonText}
            </button>
          </form>
        </div>
      </section>

      {/* Platform Attribution Footer */}
      <footer style={{ borderTop: '1px solid #E4EBE5', padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#F8FAF8' }}>
        <p style={{ fontSize: '0.8rem', color: '#7B907D', margin: '0 0 0.5rem' }}>
          &copy; {new Date().getFullYear()} {store.name || "Selora Store"}. All rights reserved.
        </p>
        <p style={{ fontSize: '0.72rem', color: '#9AB49D', margin: 0 }}>
          Powered by <a href="/" style={{ color: '#7B907D', textDecoration: 'none', fontWeight: 600 }}>Selora AI</a>
        </p>
      </footer>

      {/* Product Detail Modal */}
      {selected && (
        <div style={S.overlay} onClick={e => { if(e.target===e.currentTarget) setSelected(null) }}>
          <div style={S.modal}>
            {/* Pinned Close Button */}
            <button style={{ ...S.closeBtn, position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }} onClick={() => setSelected(null)} aria-label="Close">X</button>
            
            {/* Scrollable Container */}
            <div className="sf-modal-scrollable" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Image Area with Centering & Aspect Fit */}
              <div style={{ position:'relative', width: '100%', background: '#F8FAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.images?.[activeImageIdx] || selected.images?.[0] ? (
                  <img
                    src={selected.images[activeImageIdx] || selected.images[0]}
                    alt={selected.title}
                    style={{
                      width: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    className="sf-modal-img"
                  />
                ) : (
                  <div style={{ width: '100%', height: '40vh', minHeight: 250, maxHeight: '60vh', background:'linear-gradient(135deg,#EDF3EE,#C8DCC9)', display:'flex', alignItems:'center', justifyContent:'center', color: '#5A8A67' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
              </div>

              {/* Scrollable Modal Info Body */}
              <div style={S.modalBody}>
                <h2 style={S.modalTitle}>{selected.title}</h2>
                
                <div style={{ ...S.priceRow, marginBottom:'1.25rem' }}>
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

                {selected.description && <p style={S.modalDesc}>{selected.description}</p>}

                {selected.tags?.length > 0 && (
                  <div style={{ ...S.tags, marginBottom:'1.5rem' }}>
                    {selected.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}
                  </div>
                )}

                {/* Multiple Image Variant Selection */}
                {selected.images?.length > 1 && (
                  <div style={{ display:'flex', gap:'.5rem', marginTop:'.5rem', marginBottom: '.5rem', flexWrap:'wrap' }}>
                    {selected.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${selected.title} ${i+1}`}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: `2px solid ${activeImageIdx === i ? '#5A8A67' : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'border-color .15s'
                        }}
                        onClick={() => setActiveImageIdx(i)}
                        onMouseOver={e => { if (activeImageIdx !== i) e.target.style.borderColor='#C7DACB' }}
                        onMouseOut={e => { if (activeImageIdx !== i) e.target.style.borderColor='transparent' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Action Footer Bar */}
            <div style={{ borderTop: '1px solid #E4EBE5', padding: '1.25rem 2rem', background: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#1A271C', fontWeight: 600 }}>Stock Availability</span>
                <p style={{ fontSize:'.82rem', color:'#7B907D', margin: 0 }}>
                  {selected.inventory > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                      {selected.inventory} in stock
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                      Currently out of stock
                    </span>
                  )}
                </p>
              </div>

              <button
                className="sf-cart-btn"
                style={{ ...S.cartBtn, background: addedToCart ? '#166534' : '#5A8A67', margin: 0 }}
                onClick={handleAddToCart}
                disabled={selected.inventory === 0}
              >
                {addedToCart ? 'Added to Cart' : selected.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
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
                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: paymentStatus === 'pending' ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}
              >
                X
              </button>
            </div>

            {paymentStatus === 'confirmed' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                <div style={{ color: 'var(--g)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 .5rem' }}>Payment Successful!</h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
                  Your order is being processed. You'll receive updates on your order status.
                </p>

                {/* Order Summary box */}
                <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', background: 'var(--bg-2)', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 .5rem' }}>Order Details</p>
                  <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 .75rem' }}>
                    Order ID: <span style={{ fontFamily: 'monospace', fontWeight: 400 }}>#{checkoutDetails?.order_id?.slice(0, 8) || '...'}</span>
                  </p>
                  
                  {/* Items purchased list */}
                  <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '.75rem 0', margin: '.75rem 0' }}>
                    {purchasedItems.map(item => (
                      <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.4rem', color: 'var(--text-primary)' }}>
                        <span style={{ fontWeight: 500 }}>{item.product.title} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                        <span style={{ fontWeight: 600 }}>{currency} {(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>
                    <span>Total Paid</span>
                    <span>{currency} {Number(checkoutDetails?.amount_usdc || 0).toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Trust signal / Explorer link */}
                {txSignature && (
                  <div style={{ marginBottom: '1.5rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    <span>Transaction signature: </span>
                    <a 
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--g)', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all', display: 'block', marginTop: '.25rem' }}
                    >
                      {txSignature.slice(0, 8)}...{txSignature.slice(-8)} ↗
                    </a>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCheckoutDetails(null);
                    setPaymentStatus(null);
                    setPurchasedItems([]);
                    setTxSignature('');
                  }}
                  style={{ width: '100%', padding: '.85rem', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'background .2s' }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ color: '#5A8A67', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
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
                        <div style={{ width: 70, height: 85, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#5A8A67' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
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
                          {(phantomConnected || window.solana?.isPhantom) ? (
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
                                onClick={async () => {
                                  const phantom = window.solana
                                  if (!phantom || !phantom.isPhantom) {
                                    window.open('https://phantom.app/', '_blank')
                                    return
                                  }
                                  try {
                                    await phantom.connect()
                                    setPhantomConnected(true)
                                  } catch (e) {
                                    setPaymentError('Could not connect Phantom. Make sure it is unlocked.')
                                  }
                                }}
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
                                {window.solana?.isPhantom ? 'Connect Phantom to Pay' : 'Install Phantom Wallet'}
                              </button>
                              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                {window.solana?.isPhantom
                                  ? 'Click to connect your Phantom wallet, then pay.'
                                  : 'Or scan the QR code below with your Solana wallet app.'}
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

