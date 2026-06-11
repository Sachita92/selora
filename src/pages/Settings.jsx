import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ChatWidget from '../components/ChatWidget'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const c = {
  green: '#5A8A67', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
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
  success: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#166534', marginBottom: '1rem' },
  danger:  { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#DC2626', marginBottom: '1rem' },
}

// Toggle switch component
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? c.green : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: value ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser]               = useState(null)
  const [stores, setStores]           = useState([])
  const [activeStore, setActiveStore] = useState(null)
  const [settings, setSettings]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  const [activeTab, setActiveTab] = useState('agent') // 'agent' or 'billing'
  const [billingHistory, setBillingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

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

  const handleManageSubscription = async () => {
    if (!user) return
    setPortalLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/billing/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.detail || 'Failed to open customer portal')
      }
    } catch (e) {
      console.error(e)
      alert('Error connecting to billing servers.')
    } finally {
      setPortalLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'billing' && user) {
      fetchBillingHistory(user.email)
    }
  }, [activeTab, user])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      fetchStores(session.user.email)
    })
  }, [])

  const fetchStores = async (email) => {
    try {
      const res  = await fetch(`${API_URL}/api/stores?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setStores(data.stores || [])
      if (data.user) {
        setUser(prev => ({ ...prev, ...data.user }))
      }
      if (data.stores?.length > 0) {
        setActiveStore(data.stores[0])
        fetchSettings(data.stores[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

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
        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: c.green, marginBottom: '.5rem', display: 'block' }}>Current Plan</span>
              <h2 style={{ ...s.sTitle, fontSize: '1.4rem', marginBottom: '.3rem' }}>{getPlanName(plan)}</h2>
              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginTop: '.4rem' }}>
                <span style={{
                  fontSize: '.65rem', fontWeight: 600, padding: '.2rem .6rem', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em',
                  background: status === 'active' ? '#DCFCE7' : '#FEF2F2',
                  color: status === 'active' ? '#166534' : '#DC2626'
                }}>
                  {status}
                </span>
                {periodEnd && status === 'active' && (
                  <span style={{ fontSize: '.75rem', color: c.muted, fontWeight: 300 }}>
                    Renews on {formatDate(periodEnd)}
                  </span>
                )}
              </div>
            </div>

            {plan !== 'free' ? (
              <button 
                onClick={handleManageSubscription}
                disabled={portalLoading}
                style={s.btnP}
              >
                {portalLoading ? 'Redirecting...' : 'Manage Subscription'}
              </button>
            ) : (
              <Link to="/pricing" style={{ ...s.btnP, textDecoration: 'none' }}>
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>

        {/* BILLING HISTORY TABLE */}
        <div style={s.section}>
          <div style={s.sTitle}>Billing & Payment History</div>
          <div style={s.sSub}>View your transaction records and lifecycle subscription status changes.</div>

          {loadingHistory ? (
            <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300 }}>Loading history...</p>
          ) : billingHistory.length === 0 ? (
            <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300 }}>No billing history found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${c.border}` }}>
                    <th style={{ padding: '.8rem .4rem', fontWeight: 600, color: c.dark }}>Date</th>
                    <th style={{ padding: '.8rem .4rem', fontWeight: 600, color: c.dark }}>Event</th>
                    <th style={{ padding: '.8rem .4rem', fontWeight: 600, color: c.dark }}>Amount</th>
                    <th style={{ padding: '.8rem .4rem', fontWeight: 600, color: c.dark, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((event) => {
                    const obj = event.details || {}
                    const amountCents = obj.amount_total
                    const amountVal = amountCents ? `$${(amountCents / 100).toFixed(2)}` : '—'
                    
                    const formatEventName = (type) => {
                      const map = {
                        checkout_session_completed: 'Checkout Completed',
                        subscription_active: 'Subscription Activated',
                        subscription_deleted: 'Subscription Cancelled',
                        subscription_past_due: 'Subscription Past Due',
                      }
                      return map[type] || type.replace(/_/g, ' ')
                    }

                    return (
                      <tr key={event.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                        <td style={{ padding: '.8rem .4rem', color: c.text, fontWeight: 300 }}>
                          {formatDate(event.created_at)}
                        </td>
                        <td style={{ padding: '.8rem .4rem', color: c.dark, fontWeight: 500 }}>
                          {formatEventName(event.event_type)}
                        </td>
                        <td style={{ padding: '.8rem .4rem', color: c.text, fontWeight: 500 }}>
                          {amountVal}
                        </td>
                        <td style={{ padding: '.8rem .4rem', color: c.green, fontWeight: 600, textAlign: 'right', textTransform: 'capitalize' }}>
                          Success
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading || !settings) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: c.muted, fontSize: '.9rem' }}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={s.h1}>Agent Settings</h1>
          <p style={{ fontSize: '.85rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
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
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: `1px solid ${c.border}`, marginBottom: '2rem', paddingBottom: '.2rem' }}>
          <button 
            onClick={() => setActiveTab('agent')}
            style={{
              background: 'none', border: 'none', paddingBottom: '.6rem', fontSize: '.9rem',
              fontWeight: activeTab === 'agent' ? 600 : 400,
              color: activeTab === 'agent' ? c.green : c.muted,
              borderBottom: activeTab === 'agent' ? `2px solid ${c.green}` : 'none',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}
          >
            Agent Configuration
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            style={{
              background: 'none', border: 'none', paddingBottom: '.6rem', fontSize: '.9rem',
              fontWeight: activeTab === 'billing' ? 600 : 400,
              color: activeTab === 'billing' ? c.green : c.muted,
              borderBottom: activeTab === 'billing' ? `2px solid ${c.green}` : 'none',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}
          >
            Billing & Plan
          </button>
        </div>

        {activeTab === 'agent' ? (
          <>
            {saved  && <div style={s.success}>✓ Settings saved successfully.</div>}
            {error  && <div style={s.danger}>{error}</div>}

        {/* SECTION: Goal */}
        <div style={s.section}>
          <div style={s.sTitle}>Growth Goal</div>
          <div style={s.sSub}>Tell Selora what you're optimizing for. This shapes every decision the agent makes.</div>
          <div style={s.row}>
            <div>
              <div style={s.label}>Primary Goal</div>
              <div style={s.hint}>What should the agent optimize for above all else?</div>
            </div>
            <select style={s.select} value={settings.goal} onChange={e => update('goal', e.target.value)}>
              <option value="maximize_revenue">Maximize Revenue</option>
              <option value="maximize_profit">Maximize Profit Margin</option>
              <option value="increase_conversion">Increase Conversion Rate</option>
              <option value="clear_inventory">Clear Slow Inventory</option>
            </select>
          </div>
        </div>

        {/* SECTION: Agent Behaviour */}
        <div style={s.section}>
          <div style={s.sTitle}>Agent Behaviour</div>
          <div style={s.sSub}>Control what actions the agent is allowed to take autonomously.</div>

          {[
            { key: 'auto_reprice', label: 'Auto-reprice products', hint: 'Agent automatically adjusts prices based on sales velocity and season.' },
            { key: 'auto_optimize_listings', label: 'Auto-optimize listings', hint: 'Agent rewrites weak titles and descriptions with fashion-forward copy.' },
            { key: 'dry_run', label: 'Dry run mode', hint: 'Agent analyzes and reports but makes NO real changes to your store.' },
          ].map(({ key, label, hint }, i, arr) => (
            <div key={key} style={{ ...s.row, borderBottom: i < arr.length - 1 ? s.row.borderBottom : 'none' }}>
              <div>
                <div style={s.label}>{label}</div>
                <div style={s.hint}>{hint}</div>
              </div>
              <Toggle value={settings[key]} onChange={v => update(key, v)} />
            </div>
          ))}
        </div>

        {/* SECTION: Pricing Limits */}
        <div style={s.section}>
          <div style={s.sTitle}>Pricing Guardrails</div>
          <div style={s.sSub}>Set hard limits on how much the agent can raise or lower any product's price in a single cycle.</div>

          {[
            { key: 'max_price_increase_pct', label: 'Max price increase', hint: 'Maximum % the agent can raise a price per cycle.', unit: '%' },
            { key: 'max_price_decrease_pct', label: 'Max price decrease', hint: 'Maximum % the agent can lower a price per cycle.', unit: '%' },
          ].map(({ key, label, hint, unit }, i, arr) => (
            <div key={key} style={{ ...s.row, borderBottom: i < arr.length - 1 ? s.row.borderBottom : 'none' }}>
              <div>
                <div style={s.label}>{label}</div>
                <div style={s.hint}>{hint}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <input
                  type="number" min={1} max={100}
                  value={settings[key]}
                  onChange={e => update(key, Number(e.target.value))}
                  style={s.input}
                />
                <span style={{ fontSize: '.85rem', color: c.muted }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION: Inventory */}
        <div style={s.section}>
          <div style={s.sTitle}>Inventory Alerts</div>
          <div style={s.sSub}>Control when the agent flags products as running low on stock.</div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <div>
              <div style={s.label}>Restock alert threshold</div>
              <div style={s.hint}>Alert when inventory drops below this many units AND the product has recent sales.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <input
                type="number" min={1} max={500}
                value={settings.restock_alert_threshold}
                onChange={e => update('restock_alert_threshold', Number(e.target.value))}
                style={s.input}
              />
              <span style={{ fontSize: '.85rem', color: c.muted }}>units</span>
            </div>
          </div>
        </div>

        {/* SECTION: Schedule */}
        <div style={s.section}>
          <div style={s.sTitle}>Run Schedule</div>
          <div style={s.sSub}>How often should the Selora agent analyze and act on your store?</div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <div>
              <div style={s.label}>Agent run frequency</div>
              <div style={s.hint}>How often the agent runs its full analysis cycle.</div>
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
        <div style={{ ...s.section, border: '1px solid #FECACA' }}>
          <div style={{ ...s.sTitle, color: '#DC2626' }}>Danger Zone</div>
          <div style={s.sSub}>These actions are irreversible. Please be certain before proceeding.</div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <div>
              <div style={s.label}>Disconnect store</div>
              <div style={s.hint}>Removes this store from Selora. Your Shopify store is unaffected.</div>
            </div>
            <button style={{ ...s.btnS, color: '#DC2626', border: '1px solid #FECACA' }}>
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
      <ChatWidget storeId={activeStore?.id} />
    </div>
  )
}
