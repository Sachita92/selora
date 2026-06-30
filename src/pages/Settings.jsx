import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const s = {
  page:    { minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' },
  nav:     { background: c.card, borderBottom: `1px solid ${c.border}`, padding: '.9rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:    { fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600, color: c.dark, textDecoration: 'none' },
  body:    { maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 5rem' },
  h1:      { fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px' },
  section: { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '2rem', marginBottom: '1.5rem' },
  sTitle:  { fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: c.dark, marginBottom: '.4rem' },
  sSub:    { fontSize: '.8rem', color: c.muted, fontWeight: 300, marginBottom: '1.5rem', lineHeight: 1.6 },
  row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: `1px solid ${c.border}` },
  label:   { fontSize: '.88rem', fontWeight: 500, color: c.dark },
  hint:    { fontSize: '.75rem', color: c.muted, fontWeight: 300, marginTop: '.2rem' },
  input:   { padding: '.55rem .9rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.88rem', fontFamily: 'Inter, sans-serif', outline: 'none', background: c.bg, color: c.dark, width: 110, textAlign: 'right' },
  select:  { padding: '.55rem .9rem', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '.85rem', fontFamily: 'Inter, sans-serif', outline: 'none', background: c.bg, color: c.dark, cursor: 'pointer' },
  btnP:    { background: c.green, color: '#fff', border: 'none', padding: '.75rem 1.8rem', borderRadius: 8, fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnS:    { background: 'transparent', color: c.muted, border: `1px solid ${c.border}`, padding: '.75rem 1.8rem', borderRadius: 8, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  success: { background: 'rgba(22, 101, 52, 0.06)', border: '1px solid rgba(22, 101, 52, 0.15)', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#166534', marginBottom: '1rem' },
  danger:  { background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#DC2626', marginBottom: '1rem' },
}

// Toggle switch component
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--g)' : 'var(--bg-3)',
        border: '1px solid var(--border)',
        cursor: 'pointer', position: 'relative',
        transition: 'all .25s cubic-bezier(0.16, 1, 0.3, 1)', flexShrink: 0,
        boxShadow: value ? '0 0 10px rgba(90, 138, 103, 0.18)' : 'none'
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'all .25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,.15)'
      }} />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, stores, activeStore, setActiveStore } = useAppContext()
  const [settings, setSettings]       = useState(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  const [activeTab, setActiveTab] = useState('agent') // 'agent' or 'billing'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab === 'billing') {
      setActiveTab('billing')
    } else if (tab === 'agent') {
      setActiveTab('agent')
    }
  }, [location.search])

  const [billingHistory, setBillingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [subscriptions, setSubscriptions] = useState([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
  const [pendingCancels, setPendingCancels] = useState([])
  const [savingBilling, setSavingBilling] = useState(false)

  // Fetch billing history
  const fetchBillingHistory = async (email) => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`${API_URL}/api/billing/history?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setBillingHistory(data.history || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch Stripe subscriptions
  const fetchSubscriptions = async (email) => {
    setLoadingSubscriptions(true)
    try {
      const res = await fetch(`${API_URL}/api/billing/subscriptions?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setSubscriptions(data.subscriptions || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  // Toggle cancellation queue locally
  const togglePendingCancel = (subId) => {
    setPendingCancels(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    )
  }

  // Save all queued cancellations to the backend API
  const saveBillingChanges = async () => {
    if (pendingCancels.length === 0) return
    if (!window.confirm("Are you sure you want to save these changes and cancel the selected subscription(s)?")) return
    setSavingBilling(true)
    try {
      for (const subId of pendingCancels) {
        const res = await fetch(`${API_URL}/api/billing/cancel-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subId })
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.detail || "Failed to cancel subscription")
        }
      }
      alert("Billing changes saved successfully. Selected subscription(s) scheduled to cancel.")
      setPendingCancels([])
      if (user) {
        fetchSubscriptions(user.email)
      }
    } catch (e) {
      console.error(e)
      alert(`Error saving changes: ${e.message || e}`)
    } finally {
      setSavingBilling(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'billing' && user?.email) {
      fetchBillingHistory(user.email)
      fetchSubscriptions(user.email)
      setPendingCancels([])
    }
  }, [activeTab, user])

  useEffect(() => {
    if (activeStore) {
      fetchSettings(activeStore.id)
    }
  }, [activeStore])

  const fetchSettings = async (storeId) => {
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/settings`)
      const data = await res.json()
      setSettings(data.settings)
    } catch (e) {
      console.error(e)
    }
  }

  const saveSettings = async () => {
    if (!activeStore || !settings) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/stores/${activeStore.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  const renderBillingTab = () => {
    const plan = user?.subscription_plan || 'free'
    const status = user?.subscription_status || 'inactive'
    const periodEnd = user?.subscription_current_period_end

    const getPlanName = (p) => {
      const map = { free: 'Free Tier', growth: 'Growth Plan', scale: 'Scale Plan' }
      return map[p] || p
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '—'
      try {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      } catch (e) { return dateStr }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* CURRENT PLAN CARD */}
        <div className="settings-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--g)', marginBottom: '.5rem', display: 'block' }}>Current Plan</span>
              <h2 style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '.3rem' }}>{getPlanName(plan)}</h2>
              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginTop: '.4rem' }}>
                <span style={{
                  fontSize: '.65rem', fontWeight: 600, padding: '.2rem .6rem', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em',
                  background: status === 'active' ? 'rgba(22, 101, 52, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                  color: status === 'active' ? '#166534' : '#DC2626'
                }}>
                  {status}
                </span>
                {periodEnd && status === 'active' && (
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 300 }}>
                    Renews on {formatDate(periodEnd)}
                  </span>
                )}
              </div>
            </div>
            
            {plan === 'free' && (
              <Link to="/pricing" style={{ ...s.btnP, textDecoration: 'none' }}>
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>

        {/* ACTIVE SUBSCRIPTIONS */}
        {plan !== 'free' && (
          <div className="settings-section">
            <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Active Stripe Subscriptions</div>
            <div style={s.sSub}>Manage and cancel your active recurring payment plans.</div>
            
            {loadingSubscriptions ? (
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', fontWeight: 300 }}>Loading active subscriptions...</p>
            ) : subscriptions.length === 0 ? (
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', fontWeight: 300 }}>No active subscriptions found in Stripe.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subscriptions.map(sub => {
                  const isPendingCancel = pendingCancels.includes(sub.id)
                  return (
                    <div key={sub.id} style={{ 
                      padding: '1.2rem', 
                      border: `1px solid var(--border)`, 
                      borderRadius: 12, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      background: (sub.cancel_at_period_end || isPendingCancel) ? 'var(--bg-0)' : 'var(--bg-1)',
                      transition: 'all 0.2s'
                    }}>
                      <div>
                        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.plan_name}</h4>
                          {isPendingCancel && (
                            <span style={{ fontSize: '.65rem', fontWeight: 600, padding: '.15rem .45rem', borderRadius: 4, background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' }}>
                              Pending Cancel
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.2rem', fontWeight: 300 }}>
                          Amount: ${sub.amount.toFixed(2)} / {sub.interval}
                        </p>
                        {sub.card_last4 && (
                          <p style={{ fontSize: '.78rem', color: 'var(--g)', marginTop: '.4rem', fontWeight: 500 }}>
                            💳 Paid via {sub.card_brand} ending in {sub.card_last4}
                          </p>
                        )}
                        <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.4rem', fontWeight: 300 }}>
                          {sub.cancel_at_period_end ? (
                            <span style={{ color: '#DC2626', fontWeight: 500 }}>
                              Expires on {formatDate(sub.current_period_end)} (Cancellation Pending)
                            </span>
                          ) : isPendingCancel ? (
                            <span style={{ color: '#DC2626', fontWeight: 500 }}>
                              Will expire on {formatDate(sub.current_period_end)} (unsaved changes)
                            </span>
                          ) : (
                            <span>Renews on {formatDate(sub.current_period_end)}</span>
                          )}
                        </p>
                      </div>

                      <div>
                        {sub.cancel_at_period_end ? (
                          <button 
                            disabled 
                            style={{ 
                              ...s.btnS, 
                              background: 'var(--bg-2)', 
                              color: 'var(--text-muted)', 
                              border: `1px solid var(--border)`,
                              cursor: 'not-allowed',
                              fontSize: '.8rem',
                              padding: '.5rem 1rem'
                            }}
                          >
                            Cancellation Scheduled
                          </button>
                        ) : (
                          <button 
                            onClick={() => togglePendingCancel(sub.id)}
                            style={{ 
                              ...s.btnS, 
                              background: 'transparent', 
                              color: isPendingCancel ? 'var(--text-primary)' : '#DC2626', 
                              border: isPendingCancel ? `1px solid var(--border)` : '1px solid rgba(220, 38, 38, 0.25)',
                              fontSize: '.8rem',
                              padding: '.5rem 1rem',
                              fontWeight: 500
                            }}
                          >
                            {isPendingCancel ? 'Undo Cancel' : 'Cancel Subscription'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* BILLING HISTORY TABLE */}
        <div className="settings-section">
          <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Billing & Payment History</div>
          <div style={s.sSub}>View your transaction records and lifecycle subscription status changes.</div>
          
          {loadingHistory ? (
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', fontWeight: 300 }}>Loading history...</p>
          ) : billingHistory.length === 0 ? (
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', fontWeight: 300 }}>No billing history events found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="billing-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map(evt => {
                    const amountStr = evt.amount ? `$${evt.amount.toFixed(2)}` : '—'
                    return (
                      <tr key={evt.id}>
                        <td style={{ fontWeight: 300 }}>
                          {formatDate(evt.created_at)}
                        </td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {evt.event_name}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>
                          {amountStr}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`status-pill ${evt.status === 'success' ? 'success' : 'pending'}`}>
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SAVE BILLING CHANGES BUTTON AT THE BOTTOM */}
        {plan !== 'free' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            {pendingCancels.length > 0 && (
              <button 
                style={s.btnS} 
                onClick={() => setPendingCancels([])}
                disabled={savingBilling}
              >
                Discard Changes
              </button>
            )}
            <button 
              style={s.btnP} 
              onClick={saveBillingChanges} 
              disabled={pendingCancels.length === 0 || savingBilling}
            >
              {savingBilling ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const loading = !activeStore || (activeTab === 'agent' && !settings)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)', transition: 'background-color .35s, color .35s' }}>
      <style>{`
        /* Glassmorphism sections */
        .settings-section {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.2rem;
          margin-bottom: 1.8rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .settings-section:hover {
          box-shadow: 0 12px 32px rgba(90, 138, 103, 0.04);
          border-color: var(--border-strong);
        }

        /* Clickable Goal Cards Grid */
        .goal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
          margin-top: 1.2rem;
        }
        @media (max-width: 640px) {
          .goal-grid {
            grid-template-columns: 1fr;
          }
        }
        .goal-card {
          background: var(--bg-1);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 1.2rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: left;
        }
        .goal-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-strong);
        }
        .goal-card.active {
          border-color: var(--g);
          background: var(--g-tint);
          box-shadow: 0 4px 16px rgba(90, 138, 103, 0.08);
        }
        .goal-icon {
          font-size: 1.3rem;
        }
        .goal-title {
          font-family: 'Fraunces', serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        .goal-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
          line-height: 1.45;
          font-weight: 300;
        }

        /* Premium Range Sliders */
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          width: 100%;
          max-width: 320px;
        }
        .slider-input {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-2);
          outline: none;
          transition: background 0.2s;
        }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--g);
          cursor: pointer;
          border: 2px solid var(--bg-1);
          box-shadow: 0 2px 6px rgba(90, 138, 103, 0.3);
          transition: transform 0.15s;
        }
        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .slider-bubble {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--g);
          background: var(--g-tint);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          align-self: center;
        }

        /* Tab Active styling */
        .settings-tab-btn {
          background: transparent;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          padding: 0.6rem 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .settings-tab-btn.active {
          font-weight: 600;
          color: var(--g) !important;
          border-bottom: 2px solid var(--g) !important;
        }

        /* Billing history table */
        .billing-table th {
          padding: 1rem 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          border-bottom: 1.5px solid var(--border);
        }
        .billing-table td {
          padding: 1rem 0.8rem;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
        }
        .billing-table tr:hover td {
          background: rgba(90, 138, 103, 0.015);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-pill.success {
          background: rgba(22, 101, 52, 0.08);
          color: #166534;
        }
        .status-pill.pending {
          background: rgba(180, 83, 9, 0.08);
          color: #b45309;
        }
      `}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ ...s.h1, color: 'var(--text-primary)' }}>Agent Settings</h1>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.3rem', fontWeight: 300 }}>
            Configure how Selora manages {activeStore?.shop_name || 'your store'}.
          </p>
          {stores.length > 1 && (
            <select style={{ ...s.select, marginTop: '.8rem' }} value={activeStore?.id || ''} onChange={e => {
              const st = stores.find(s => s.id === e.target.value)
              setActiveStore(st)
              fetchSettings(st.id)
            }}>
              {stores.map(st => <option key={st.id} value={st.id}>{st.shop_name}</option>)}
            </select>
          )}
        </div>

        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: `1px solid var(--border)`, marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('agent')}
            className={`settings-tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            Agent Configuration
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`settings-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            Billing & Plan
          </button>
        </div>

        {loading ? (
          <div className="settings-section" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Loading configuration settings...</p>
          </div>
        ) : activeTab === 'agent' ? (
          <>
            {saved  && <div style={s.success}>✓ Settings saved successfully.</div>}
            {error  && <div style={s.danger}>{error}</div>}

            {/* SECTION: Goal */}
            <div className="settings-section">
              <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Growth Goal</div>
              <div style={s.sSub}>Tell Selora what you're optimizing for. This shapes every decision the agent makes.</div>
              <div className="goal-grid">
                {[
                  { 
                    value: 'maximize_revenue', 
                    label: 'Maximize Revenue', 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--g)' }}>
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    ), 
                    desc: 'Optimize pricing and descriptions to drive absolute top-line sales growth.' 
                  },
                  { 
                    value: 'maximize_profit', 
                    label: 'Maximize Profit', 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--g)' }}>
                        <path d="M6 3h12l4 6-10 13L2 9z"></path>
                        <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                        <path d="M2 9h20"></path>
                      </svg>
                    ), 
                    desc: 'Prioritize higher profit margins by avoiding excessive discounting.' 
                  },
                  { 
                    value: 'increase_conversion', 
                    label: 'Boost Conversions', 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--g)' }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    ), 
                    desc: 'Optimize dynamic offers and descriptions to convert store visitors faster.' 
                  },
                  { 
                    value: 'clear_inventory', 
                    label: 'Clear Inventory', 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--g)' }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    ), 
                    desc: 'Aggressively discount slow-moving stock to clear up warehouse capital.' 
                  }
                ].map(item => (
                  <div 
                    key={item.value} 
                    className={`goal-card ${settings.goal === item.value ? 'active' : ''}`}
                    onClick={() => update('goal', item.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span className="goal-icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                      <span className="goal-title">{item.label}</span>
                    </div>
                    <div className="goal-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: Agent Behaviour */}
            <div className="settings-section">
              <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Agent Behaviour</div>
              <div style={s.sSub}>Control what actions the agent is allowed to take autonomously.</div>

              {[
                { key: 'auto_reprice', label: 'Auto-reprice products', hint: 'Agent automatically adjusts prices based on sales velocity and season.' },
                { key: 'auto_optimize_listings', label: 'Auto-optimize listings', hint: 'Agent rewrites weak titles and descriptions with fashion-forward copy.' },
                { key: 'dry_run', label: 'Dry run mode', hint: 'Agent analyzes and reports but makes NO real changes to your store.' },
              ].map(({ key, label, hint }, i, arr) => (
                <div key={key} style={{ ...s.row, borderBottom: i < arr.length - 1 ? s.row.borderBottom : 'none' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ ...s.label, color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ ...s.hint, color: 'var(--text-muted)' }}>{hint}</div>
                  </div>
                  <Toggle value={settings[key]} onChange={v => update(key, v)} />
                </div>
              ))}
            </div>

            {/* SECTION: Pricing Limits */}
            <div className="settings-section">
              <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Pricing Guardrails</div>
              <div style={s.sSub}>Set hard limits on how much the agent can raise or lower any product's price in a single cycle.</div>

              {[
                { key: 'max_price_increase_pct', label: 'Max price increase limit', hint: 'Maximum % the agent can raise a price per cycle.', min: 1, max: 100 },
                { key: 'max_price_decrease_pct', label: 'Max price decrease limit', hint: 'Maximum % the agent can lower a price per cycle.', min: 1, max: 100 },
              ].map(({ key, label, hint, min, max }, i, arr) => (
                <div key={key} style={{ ...s.row, borderBottom: i < arr.length - 1 ? s.row.borderBottom : 'none' }}>
                  <div style={{ flex: 1, paddingRight: '1.5rem', textAlign: 'left' }}>
                    <div style={{ ...s.label, color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ ...s.hint, color: 'var(--text-muted)' }}>{hint}</div>
                  </div>
                  <div className="slider-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{min}%</span>
                      <span className="slider-bubble">{settings[key]}%</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{max}%</span>
                    </div>
                    <input
                      type="range" 
                      min={min} 
                      max={max}
                      value={settings[key] || min}
                      onChange={e => update(key, Number(e.target.value))}
                      className="slider-input"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION: Inventory */}
            <div className="settings-section">
              <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Inventory Alerts</div>
              <div style={s.sSub}>Control when the agent flags products as running low on stock.</div>
              <div style={{ ...s.row, borderBottom: 'none' }}>
                <div style={{ flex: 1, paddingRight: '1.5rem', textAlign: 'left' }}>
                  <div style={{ ...s.label, color: 'var(--text-primary)' }}>Restock alert threshold</div>
                  <div style={{ ...s.hint, color: 'var(--text-muted)' }}>Alert when inventory drops below this many units AND the product has recent sales.</div>
                </div>
                <div className="slider-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>1 unit</span>
                    <span className="slider-bubble">{settings.restock_alert_threshold} units</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>100 units</span>
                  </div>
                  <input
                    type="range" 
                    min={1} 
                    max={100}
                    value={settings.restock_alert_threshold || 10}
                    onChange={e => update('restock_alert_threshold', Number(e.target.value))}
                    className="slider-input"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: Schedule */}
            <div className="settings-section">
              <div style={{ ...s.sTitle, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '.4rem' }}>Run Schedule</div>
              <div style={s.sSub}>How often should the Selora agent analyze and act on your store?</div>
              <div style={{ ...s.row, borderBottom: 'none' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ ...s.label, color: 'var(--text-primary)' }}>Agent run frequency</div>
                  <div style={{ ...s.hint, color: 'var(--text-muted)' }}>How often the agent runs its full analysis cycle.</div>
                </div>
                <select style={s.select} value={settings.run_frequency_hours} onChange={e => update('run_frequency_hours', Number(e.target.value))}>
                  <option value={6}>Every 6 hours</option>
                  <option value={12}>Every 12 hours</option>
                  <option value={24}>Once a day (recommended)</option>
                  <option value={48}>Every 2 days</option>
                  <option value={168}>Once a week</option>
                </select>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="settings-section" style={{ border: '1px solid rgba(220, 38, 38, 0.22)' }}>
              <div style={{ ...s.sTitle, color: '#DC2626', fontSize: '1.2rem', marginBottom: '.4rem' }}>Danger Zone</div>
              <div style={s.sSub}>These actions are irreversible. Please be certain before proceeding.</div>
              <div style={{ ...s.row, borderBottom: 'none' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ ...s.label, color: 'var(--text-primary)' }}>Disconnect store</div>
                  <div style={{ ...s.hint, color: 'var(--text-muted)' }}>
                    Removes this store from Selora. {activeStore?.platform === 'selora' ? 'Your storefront and its data are not recoverable after this.' : 'Your Shopify store is unaffected.'}
                  </div>
                </div>
                <button style={{ ...s.btnS, color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.25)', background: 'rgba(220, 38, 38, 0.04)' }}>
                  Disconnect Store
                </button>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button style={s.btnS} onClick={() => fetchSettings(activeStore.id)}>Discard changes</button>
              <button style={s.btnP} onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </>
        ) : (
          renderBillingTab()
        )}

      </div>
    </div>
  )
}
