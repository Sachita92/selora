import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ChatWidget from '../components/ChatWidget'
import { useAppContext } from '../lib/AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const c = {
  green: '#5A8A67', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const s = {
  body:    { maxWidth: 1200, margin: '0 auto' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  h1:      { fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px' },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' },
  th:      { padding: '.85rem 1.2rem', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: c.muted, background: c.bg2, borderBottom: `1px solid ${c.border}`, textAlign: 'left', whiteSpace: 'nowrap' },
  td:      { padding: '.95rem 1.2rem', fontSize: '.84rem', color: c.dark, borderBottom: `1px solid ${c.border}`, verticalAlign: 'middle' },
  badge:   (color) => ({ fontSize: '.62rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', ...color }),
  pill:    { display: 'inline-block', padding: '.18rem .6rem', borderRadius: 6, fontSize: '.72rem', fontWeight: 600 },
  btnP:    { background: c.green, color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'none', display: 'inline-block' },
  search:  { padding: '.65rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.88rem', fontFamily: 'Inter, sans-serif', outline: 'none', background: c.bg, width: 240, color: c.dark },
  select:  { padding: '.65rem 1rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.85rem', fontFamily: 'Inter, sans-serif', outline: 'none', background: c.bg, color: c.dark, cursor: 'pointer' },
  empty:   { textAlign: 'center', padding: '4rem 1rem', color: c.muted, fontSize: '.9rem', fontWeight: 300 },
  stat:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.2rem 1.6rem' },
  statVal: { fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px' },
  statLbl: { fontSize: '.65rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '.2rem' },
}

export default function Products() {
  const navigate = useNavigate()
  const { user, stores, activeStore, setActiveStore, products, fetchingProducts, productsStats, fetchProducts } = useAppContext()
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('revenue')
  const [filterBy, setFilterBy] = useState('all')

  const fetching = fetchingProducts
  const stats = productsStats

  useEffect(() => {
    const handleActionTaken = (e) => {
      if (activeStore && e.detail?.storeId === activeStore.id) {
        fetchProducts(activeStore.id, true)
      }
    }
    window.addEventListener('selora-action-taken', handleActionTaken)
    return () => window.removeEventListener('selora-action-taken', handleActionTaken)
  }, [activeStore, fetchProducts])

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Filtering + sorting
  const filtered = products
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
      if (filterBy === 'low_stock') return matchesSearch && p.inventory < 10
      if (filterBy === 'no_sales')  return matchesSearch && p.sales_last_30_days === 0
      if (filterBy === 'top')       return matchesSearch && p.sales_last_30_days > 0
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue_last_30_days - a.revenue_last_30_days
      if (sortBy === 'sales')   return b.sales_last_30_days - a.sales_last_30_days
      if (sortBy === 'price')   return b.price - a.price
      if (sortBy === 'stock')   return a.inventory - b.inventory
      if (sortBy === 'name')    return a.title.localeCompare(b.title)
      return 0
    })

  const inventoryColor = (qty) => {
    if (qty === 0)  return { background: '#FEF2F2', color: '#DC2626' }
    if (qty < 10)   return { background: '#FFFBEB', color: '#D97706' }
    return { background: '#F0FDF4', color: '#166534' }
  }

  const salesLabel = (sales) => {
    if (sales === 0) return { label: 'No sales', bg: '#F3F4F6', color: '#6B7280' }
    if (sales < 5)   return { label: `${sales} sold`, bg: '#EFF6FF', color: '#1D4ED8' }
    return { label: `${sales} sold`, bg: '#F0FDF4', color: '#166534' }
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h1 style={s.h1}>{activeStore ? `${activeStore.shop_name} · Products` : 'Products'}</h1>
            <p style={{ fontSize: '.84rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
              {fetching ? 'Syncing live from Shopify...' : `${products.length} products`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {stores.length > 1 && (
              <select style={s.select} value={activeStore?.id || ''} onChange={e => {
                const store = stores.find(s => s.id === e.target.value)
                setActiveStore(store)
                fetchProducts(store.id)
              }}>
                {stores.map(st => <option key={st.id} value={st.id}>{st.shop_name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* STATS */}
        {!fetching && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Products', val: products.length },
              { label: 'Revenue (30d)', val: `$${stats.revenue.toFixed(0)}` },
              { label: 'Orders (30d)', val: stats.orders },
              { label: 'Low Stock', val: products.filter(p => p.inventory < 10).length },
            ].map(({ label, val }) => (
              <div key={label} style={s.stat}>
                <div style={s.statVal}>{val}</div>
                <div style={s.statLbl}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.search}
          />
          <select style={s.select} value={filterBy} onChange={e => setFilterBy(e.target.value)}>
            <option value="all">All products</option>
            <option value="top">Top sellers</option>
            <option value="low_stock">Low stock (&lt;10)</option>
            <option value="no_sales">No sales (30d)</option>
          </select>
          <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="revenue">Sort: Revenue</option>
            <option value="sales">Sort: Sales</option>
            <option value="price">Sort: Price</option>
            <option value="stock">Sort: Stock (low first)</option>
            <option value="name">Sort: Name</option>
          </select>
          <span style={{ fontSize: '.78rem', color: c.muted, marginLeft: 'auto' }}>
            {filtered.length} of {products.length} products
          </span>
        </div>

        {/* TABLE */}
        {fetching ? (
          <div style={{ ...s.card, ...s.empty }}>
            <div style={{ fontSize: '2rem', marginBottom: '.8rem' }}>⏳</div>
            <p>Fetching live product data from Shopify...</p>
          </div>
        ) : activeStore && products.length === 0 ? (
          <div style={{ ...s.card, ...s.empty }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p>No products found in this store.</p>
          </div>
        ) : !activeStore ? (
          <div style={{ ...s.card, ...s.empty }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <p>No store connected yet.</p>
            <Link to="/connect" style={{ ...s.btnP, marginTop: '1rem', display: 'inline-block' }}>Connect a Store</Link>
          </div>
        ) : (
          <div className="overflow-x-auto" style={s.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['Product', 'Price', 'Stock', 'Sales (30d)', 'Revenue (30d)', 'Status'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const sl = salesLabel(p.sales_last_30_days)
                    const ic = inventoryColor(p.inventory)
                    const isLast = i === filtered.length - 1
                    const tdStyle = { ...s.td, borderBottom: isLast ? 'none' : s.td.borderBottom }
                    return (
                      <tr key={p.id} style={{ transition: 'background .15s', cursor: 'pointer' }}
                        onClick={() => navigate(`/products/${p.id}`)}
                        onMouseEnter={e => e.currentTarget.style.background = c.bg2}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, maxWidth: 280 }}>
                          <div style={{ fontWeight: 500, color: c.dark, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{p.title}</div>
                          <div style={{ fontSize: '.7rem', color: c.muted, marginTop: '.15rem', fontFamily: 'monospace' }}>ID: {p.id}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: c.dark }}>${parseFloat(p.price).toFixed(2)}</span>
                          {p.compare_at_price && (
                            <span style={{ fontSize: '.72rem', color: c.muted, textDecoration: 'line-through', marginLeft: '.4rem' }}>
                              ${parseFloat(p.compare_at_price).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ ...s.pill, ...ic }}>{p.inventory} units</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ ...s.pill, background: sl.bg, color: sl.color }}>{sl.label}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: p.revenue_last_30_days > 0 ? 600 : 400, color: p.revenue_last_30_days > 0 ? c.dark : c.muted }}>
                            ${parseFloat(p.revenue_last_30_days).toFixed(2)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {p.inventory === 0 ? (
                            <span style={{ ...s.pill, background: '#FEF2F2', color: '#DC2626' }}>Out of stock</span>
                          ) : p.inventory < 10 && p.sales_last_30_days > 0 ? (
                            <span style={{ ...s.pill, background: '#FFFBEB', color: '#D97706' }}>⚠️ Restock soon</span>
                          ) : p.sales_last_30_days === 0 ? (
                            <span style={{ ...s.pill, background: '#F3F4F6', color: '#6B7280' }}>Slow mover</span>
                          ) : (
                            <span style={{ ...s.pill, background: '#F0FDF4', color: '#166534' }}>✓ Active</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        )}
      </div>
      <ChatWidget storeId={activeStore?.id} />
    </div>
  )
}
