import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { useChat } from '../lib/ChatContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) return url
  if (url.includes('cdn.shopify.com')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}width=${width}`
  }
  if (url.includes('images.unsplash.com')) {
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, `w=${width}`)
    }
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}w=${width}`
  }
  return url
}

const c = {
  green: '#5F8D76', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const s = {
  page: { minHeight: '100vh', padding: '2.5rem 2rem 5rem', background: 'radial-gradient(circle at top right, rgba(95, 141, 118, 0.04), transparent 45%), radial-gradient(circle at bottom left, rgba(95, 141, 118, 0.02), transparent 45%), #F8FAF8', fontFamily: 'Inter, sans-serif' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'none', border: `1px solid ${c.border}`, borderRadius: 8, padding: '.55rem 1rem', fontSize: '.8rem', color: c.muted, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'all 0.2s', marginBottom: '2rem' },
  container: { background: c.card, border: `1px solid ${c.border}`, borderRadius: 18, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.2fr', boxShadow: '0 8px 24px rgba(26, 39, 28, 0.04)', maxWidth: 1000, margin: '0 auto' },
  imageCol: { background: '#F1F4F2', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 450 },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  infoCol: { padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  badge: (bg, color) => ({ fontSize: '.65rem', fontWeight: 600, background: bg, color: color, padding: '.2rem .55rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.05em', display: 'inline-block' }),
  title: { fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 400, color: c.dark, margin: '1rem 0 .5rem', lineHeight: 1.2 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '.6rem', marginBottom: '1.5rem' },
  price: { fontSize: '1.6rem', fontWeight: 700, color: c.dark },
  comparePrice: { fontSize: '1.1rem', color: c.muted, textDecoration: 'line-through' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.8rem', background: '#F8FAF8', border: `1px solid ${c.border}`, borderRadius: 8, padding: '1rem', marginBottom: '1.8rem' },
  statItem: { textAlign: 'center' },
  statLabel: { fontSize: '.65rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.02em', fontWeight: 600 },
  statVal: { fontSize: '1.1rem', fontWeight: 600, color: c.dark, marginTop: '.2rem' },
  descSection: { marginBottom: '2rem' },
  descTitle: { fontSize: '.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, display: 'block', marginBottom: '.6rem' },
  descContent: { fontSize: '.84rem', color: c.dark, lineHeight: 1.6, fontWeight: 300 },
  actionRow: { borderTop: `1px solid ${c.border}`, paddingTop: '1.5rem', display: 'flex', gap: '.8rem' },
  btnP: { background: c.green, color: '#fff', border: 'none', padding: '.7rem 1.4rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', flex: 1 },
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeStore, products, fetchingProducts, loading: storeLoading } = useAppContext()
  const { sendMessage, setOpen } = useChat()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (storeLoading) {
      setLoading(true)
      return
    }

    if (!activeStore) {
      setLoading(false)
      setProduct(null)
      return
    }

    // Check cache first
    const cached = products.find(p => String(p.id) === String(id))
    if (cached) {
      setProduct(cached)
      setLoading(false)
      return
    }

    // If currently fetching, wait for it
    if (fetchingProducts) {
      setLoading(true)
      return
    }

    // Fallback fetch if not found and not fetching
    setLoading(true)
    fetch(`${API_URL}/api/stores/${activeStore.id}/products`)
      .then(res => res.json())
      .then(data => {
        const prod = data.products?.find(p => String(p.id) === String(id))
        setProduct(prod || null)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [activeStore, id, products, fetchingProducts, storeLoading])

  if (loading) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: c.muted, fontSize: '.9rem' }}>Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={s.page}>
        <button onClick={() => navigate('/products')} style={s.backBtn}>
          ← Back to Products
        </button>
        <div style={{ textAlign: 'center', padding: '4rem 0', color: c.muted }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', color: c.dark, marginBottom: '.5rem' }}>Product Not Found</h2>
          <p>We couldn't locate this product in the active store.</p>
        </div>
      </div>
    )
  }

  const inStock = product.inventory > 0

  return (
    <div style={s.page}>
      <button 
        onClick={() => navigate(-1)} 
        style={s.backBtn}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = c.green
          e.currentTarget.style.color = c.dark
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = c.border
          e.currentTarget.style.color = c.muted
        }}
      >
        ← Back
      </button>

      <div style={s.container}>
        {/* Left Column: Image */}
        <div style={s.imageCol}>
          {product.image_url ? (
            <img 
              src={getOptimizedImageUrl(product.image_url, 600)} 
              alt={product.title} 
              style={s.img} 
              fetchPriority="high"
              loading="eager"
            />
          ) : (
            <div style={{ fontSize: '5rem' }}>👗</div>
          )}
        </div>

        {/* Right Column: Info */}
        <div style={s.infoCol}>
          <div>
            {/* Tags */}
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <span style={s.badge(inStock ? '#E2EFE5' : '#FEF2F2', inStock ? c.green : '#DC2626')}>
                {inStock ? `${product.inventory} In Stock` : 'Out of Stock'}
              </span>
              <span style={s.badge('#F1F4F2', c.muted)}>
                {product.platform ? (product.platform === 'shopify' ? 'Shopify' : (product.platform === 'selora' ? 'Selora Native' : product.platform)) : 'Selora Native'}
              </span>
            </div>

            {/* Title */}
            <h1 style={s.title}>{product.title}</h1>

            {/* Price */}
            <div style={s.priceRow}>
              <span style={s.price}>${parseFloat(product.price).toFixed(2)}</span>
              {product.compare_at_price && (
                <span style={s.comparePrice}>${parseFloat(product.compare_at_price).toFixed(2)}</span>
              )}
            </div>

            {/* Stats Grid */}
            <div style={s.statsGrid}>
              <div style={s.statItem}>
                <div style={s.statLabel}>30d Sales</div>
                <div style={s.statVal}>{product.sales_last_30_days || 0}</div>
              </div>
              <div style={{ ...s.statItem, borderLeft: `1px solid ${c.border}`, borderRight: `1px solid ${c.border}` }}>
                <div style={s.statLabel}>30d Revenue</div>
                <div style={{ ...s.statVal, color: c.green }}>${parseFloat(product.revenue_last_30_days || 0).toFixed(0)}</div>
              </div>
              <div style={s.statItem}>
                <div style={s.statLabel}>Conversion</div>
                <div style={s.statVal}>{product.conversion_rate ? `${(product.conversion_rate * 100).toFixed(1)}%` : '1.8%'}</div>
              </div>
            </div>

            {/* Description */}
            <div style={s.descSection}>
              <span style={s.descTitle}>Description</span>
              <div 
                style={s.descContent}
                dangerouslySetInnerHTML={{ __html: product.description || 'No description available for this product.' }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div style={s.actionRow}>
            <button 
              onClick={() => {
                sendMessage(`Analyze conversion opportunities for product "${product.title}" (ID: ${product.id})`, activeStore.id)
                setOpen(true)
              }}
              style={s.btnP}
            >
              🤖 Optimize Listing via AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
