import { useState } from 'react'
import { useAppContext } from '../lib/AppContext'

// Colour tokens matching Dashboard
const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const s = {
  page:    { minHeight: '100vh', background: 'radial-gradient(circle at top right,rgba(95,141,118,.04),transparent 45%),var(--bg-0)', fontFamily: 'Inter,sans-serif', padding: '2rem' },
  h1:      { fontFamily: 'Fraunces,serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px', margin: 0 },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '1.6rem', position: 'relative' },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(26,39,28,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:    { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--border)' },
  modalTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: 0, marginBottom: '1.5rem' },
  spinner:  { display: 'inline-block', width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--g)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
}

function getRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  return `${diffDay}d ago`
}

export default function Orders() {
  const { orders, fetchingOrders, activeStore } = useAppContext()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filter, setFilter] = useState('all') // all, paid, pending, failed
  const [search, setSearch] = useState('')

  const filteredOrders = (orders || []).filter(order => {
    // Filter by status
    if (filter !== 'all' && order.status !== filter) return false

    // Search by buyer wallet or product titles
    if (search.trim()) {
      const q = search.toLowerCase()
      const walletMatch = (order.buyer_wallet || '').toLowerCase().includes(q)
      const itemMatch = (order.items || []).some(item => (item.title || '').toLowerCase().includes(q))
      return walletMatch || itemMatch
    }
    return true
  })

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sf-order-row-hover:hover { background: var(--bg-2); }
        .sf-tab-btn {
          background: none; border: none; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 500; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.15s;
        }
        .sf-tab-btn.active {
          color: var(--g); border-bottom-color: var(--g); font-weight: 600;
        }
        .sf-search-input {
          padding: 0.5rem 0.75rem; font-size: 0.82rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-1); color: var(--text-primary); outline: none; transition: border-color 0.15s; width: 240px;
        }
        .sf-search-input:focus {
          border-color: var(--g);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={s.h1}>Orders History</h1>
          <p style={{ fontSize: '0.8rem', color: c.muted, margin: '0.25rem 0 0 0' }}>
            Manage and view transactions for {activeStore?.shop_name || 'your store'}
          </p>
        </div>
      </div>

      <div style={s.card}>
        {/* Filters and Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFilter('all')} className={`sf-tab-btn ${filter === 'all' ? 'active' : ''}`}>All</button>
            <button onClick={() => setFilter('paid')} className={`sf-tab-btn ${filter === 'paid' ? 'active' : ''}`}>Confirmed</button>
            <button onClick={() => setFilter('pending')} className={`sf-tab-btn ${filter === 'pending' ? 'active' : ''}`}>Pending</button>
            <button onClick={() => setFilter('failed')} className={`sf-tab-btn ${filter === 'failed' ? 'active' : ''}`}>Failed</button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search by wallet or product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sf-search-input"
            />
          </div>
        </div>

        {fetchingOrders ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '3rem 0', justifyContent: 'center' }}>
            <div style={s.spinner} />
            <span style={{ fontSize: '0.85rem', color: c.muted }}>Loading order history...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: c.muted }}>
            <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              {search || filter !== 'all' ? 'No orders match your filter criteria.' : 'No orders yet — orders will appear here once customers start buying.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: c.muted }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Products</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Buyer Wallet</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const lineItems = order.items || []
                  const prodNames = lineItems.map(item => `${item.title} (x${item.quantity})`).join(', ')
                  const wallet = order.buyer_wallet || 'Anonymous'
                  const truncatedWallet = wallet !== 'Anonymous' ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 6)}` : 'Anonymous'
                  const relativeTime = getRelativeTime(order.created_at)

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      className="sf-order-row-hover"
                    >
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 500, color: c.dark, maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={prodNames}>
                        {prodNames || 'Unnamed Item'}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: c.green }}>
                        ${Number(order.total_usd).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', color: c.muted, fontFamily: 'monospace' }} title={wallet}>
                        {truncatedWallet}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: 12,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: order.status === 'paid' ? 'var(--badge-success-bg, #DCFCE7)' : order.status === 'failed' ? 'var(--inventory-empty-bg, #FEF2F2)' : 'var(--inventory-low-bg, #FFFBEB)',
                          color: order.status === 'paid' ? 'var(--badge-success-text, #166534)' : order.status === 'failed' ? 'var(--inventory-empty-text, #DC2626)' : 'var(--inventory-low-text, #D97706)'
                        }}>
                          {order.status === 'paid' ? 'Confirmed' : order.status === 'failed' ? 'Failed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', color: c.muted }}>
                        {relativeTime}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div style={s.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={{ ...s.modal, maxWidth: 500, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ ...s.modalTitle, margin: 0 }}>Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
              {/* Order Status Badge & Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-0)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ color: c.muted, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                    Order Total
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.green }}>
                    ${Number(selectedOrder.total_usd).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: selectedOrder.status === 'paid' ? 'var(--badge-success-bg, #DCFCE7)' : selectedOrder.status === 'failed' ? 'var(--inventory-empty-bg, #FEF2F2)' : 'var(--inventory-low-bg, #FFFBEB)',
                    color: selectedOrder.status === 'paid' ? 'var(--badge-success-text, #166534)' : selectedOrder.status === 'failed' ? 'var(--inventory-empty-text, #DC2626)' : 'var(--inventory-low-text, #D97706)'
                  }}>
                    {selectedOrder.status === 'paid' ? 'Confirmed' : selectedOrder.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Order Meta Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ display: 'block', color: c.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Buyer Wallet Address
                  </span>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', display: 'block', background: 'var(--bg-2)', padding: '0.5rem 0.75rem', borderRadius: 6, color: c.dark }}>
                    {selectedOrder.buyer_wallet || 'Anonymous'}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', color: c.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Transaction Reference (Signature)
                  </span>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', display: 'block', background: 'var(--bg-2)', padding: '0.5rem 0.75rem', borderRadius: 6, color: c.muted }}>
                    {selectedOrder.reference || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', color: c.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Date / Time
                    </span>
                    <span style={{ color: c.dark }}>
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <span style={{ display: 'block', color: c.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Items Ordered
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: c.dark }}>{item.title}</span>
                        <span style={{ color: c.muted, marginLeft: '0.5rem' }}>x{item.quantity}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: c.dark }}>
                        ${Number(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
