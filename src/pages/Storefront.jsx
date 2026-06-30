import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'

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
    trackEvent(store.id, selected.id, 'add_to_cart')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
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
      `}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <a href="/" style={S.brand}>Se<span style={{ color:'#5A8A67' }}>lo</span>ra</a>
          <div style={S.navRight}>
            <span style={S.badge}>✦ Selora Store</span>
            <a href="/login" onClick={e => { e.preventDefault(); openAuthModal('login') }} style={{ fontSize:'.82rem', color:'#7B907D', textDecoration:'none', fontWeight:500, cursor:'pointer' }}>Sign in</a>
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
    </div>
  )
}
