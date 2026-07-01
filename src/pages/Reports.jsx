import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const c = {
  green: 'var(--g)', dark: 'var(--text-primary)', muted: 'var(--text-muted)',
  border: 'var(--border)', bg: 'var(--bg-0)', bg2: 'var(--bg-2)', card: 'var(--bg-1)',
}

const s = {
  page:    { minHeight: '100vh', background: 'var(--bg-0)', fontFamily: 'Inter, sans-serif' },
  h1:      { fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 500, color: c.dark, letterSpacing: '-.3px' },
  card:    { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '1.6rem', marginBottom: '1.5rem' },
  cardTit: { fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 500, color: c.dark, marginBottom: '1rem' },
  logItem: { display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .8rem', background: 'var(--bg-0)', borderRadius: 8, fontSize: '.78rem', border: `1px solid ${c.border}`, marginBottom: '.4rem' },
  time:    { color: c.muted, fontSize: '.68rem', marginLeft: 'auto', whiteSpace: 'nowrap', paddingLeft: '.6rem' },
}

// ─── Action icons ─────────────────────────────────────────────────────────────
const ICONS = {
  optimize_listing: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  reprice_product: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  restock_alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  generate_report: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
}

const DEFAULT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAction = (log) => {
  const type = log.action_type
  const data = log.data || {}
  const pName = data.product_title || data.product_name || log.reason || ''
  const map = {
    reprice_product:  pName ? `Repriced ${pName}` : 'Repriced product',
    optimize_listing: pName ? `Optimized listing for ${pName}` : 'Optimized listing',
    restock_alert:    pName ? `Restock alert: ${pName}` : 'Restock alert',
    generate_report:  'Generated daily growth report',
  }
  return map[type] || (type || 'Agent action').replace(/_/g, ' ')
}

const formatTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// Group consecutive runs of the same action_type; 3+ entries become one summary line
function groupLogs(logs) {
  const groups = []
  let i = 0
  while (i < logs.length) {
    const current = logs[i]
    let j = i + 1
    while (j < logs.length && logs[j].action_type === current.action_type) j++
    const count = j - i
    if (count >= 3) {
      groups.push({ type: 'group', action_type: current.action_type, count, first: logs[i], last: logs[j - 1] })
    } else {
      for (let k = i; k < j; k++) groups.push({ type: 'single', log: logs[k] })
    }
    i = j
  }
  return groups
}

function getGroupSummary(action_type, count) {
  const map = {
    optimize_listing: `Optimized ${count} listings`,
    reprice_product:  `Repriced ${count} products`,
    restock_alert:    `Sent ${count} restock alerts`,
    generate_report:  `Generated ${count} reports`,
  }
  return map[action_type] || `Performed ${count} ${(action_type || '').replace(/_/g, ' ')} actions`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const { activeStore } = useAppContext()
  const [logs, setLogs]       = useState([])
  const [reports, setReports] = useState([])
  const [fetchingLogs, setFetchingLogs]       = useState(false)
  const [fetchingReports, setFetchingReports] = useState(false)

  useEffect(() => {
    if (activeStore) {
      fetchLogs(activeStore.id)
      fetchReports(activeStore.id)
    } else {
      setLogs([])
      setReports([])
    }
  }, [activeStore])

  const fetchLogs = async (storeId) => {
    setFetchingLogs(true)
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/logs`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) { console.error(e) }
    finally { setFetchingLogs(false) }
  }

  const fetchReports = async (storeId) => {
    setFetchingReports(true)
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/reports`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (e) { console.error(e) }
    finally { setFetchingReports(false) }
  }

  const latestReport  = reports[0] || null
  const groupedLogs   = groupLogs(logs)

  return (
    <div style={s.page}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={s.h1}>Reports</h1>
          <p style={{ fontSize: '.85rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
            {latestReport
              ? `Last run: ${formatDate(latestReport.created_at)}`
              : activeStore ? 'No agent runs yet.' : 'No store connected.'}
          </p>
        </div>

        {!activeStore && (
          <div style={{ ...s.card, textAlign: 'center', padding: '3rem', color: c.muted }}>
            <p>Connect a store to see reports.</p>
            <Link to="/connect" style={{ display: 'inline-block', marginTop: '1rem', color: c.green, fontWeight: 600, textDecoration: 'none', fontSize: '.88rem' }}>
              Set Up a Store →
            </Link>
          </div>
        )}

        {activeStore && (
          <>
            {/* LATEST GROWTH REPORT */}
            <div style={s.card}>
              <div style={s.cardTit}>Latest Growth Report</div>

              {fetchingReports ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                  {[100, 95, 70, 85, 60].map((w, i) => (
                    <div key={i} style={{ height: 14, background: 'var(--bg-2)', borderRadius: 4, width: `${w}%` }} />
                  ))}
                </div>
              ) : !latestReport ? (
                <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300, lineHeight: 1.7 }}>
                  No reports yet. Run the agent to generate your first growth report.
                </p>
              ) : (
                <>
                  {latestReport.summary && (
                    <p style={{ fontSize: '.84rem', color: c.dark, lineHeight: 1.6, fontWeight: 300, marginBottom: '1.2rem' }}>
                      {latestReport.summary}
                    </p>
                  )}

                  {latestReport.wins?.length > 0 && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: c.green, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>
                        Wins
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        {latestReport.wins.map((w, i) => (
                          <div key={i} style={{ ...s.logItem, borderLeft: `2px solid ${c.green}`, borderRadius: '0 6px 6px 0', margin: 0 }}>
                            <span style={{ color: c.dark, fontSize: '.78rem' }}>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestReport.concerns?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--inventory-low-text)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>
                        Concerns
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        {latestReport.concerns.map((con, i) => (
                          <div key={i} style={{ ...s.logItem, borderLeft: '2px solid var(--inventory-low-text)', borderRadius: '0 6px 6px 0', margin: 0 }}>
                            <span style={{ color: c.dark, fontSize: '.78rem' }}>{con}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* AGENT ACTIVITY FEED */}
            <div style={s.card}>
              <div style={s.cardTit}>Agent Activity</div>

              {fetchingLogs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} style={{ ...s.logItem, margin: 0, height: 38 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-2)' }} />
                      <div style={{ height: 12, background: 'var(--bg-2)', borderRadius: 4, width: `${40 + n * 8}%` }} />
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <p style={{ fontSize: '.82rem', color: c.muted, fontWeight: 300, lineHeight: 1.7 }}>
                  No activity yet. Run the agent to see what Selora does to your store.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {groupedLogs.map((item, i) => {
                    if (item.type === 'group') {
                      return (
                        <div key={i} style={{ ...s.logItem, margin: 0, background: 'var(--bg-2)' }}>
                          <span style={{ color: c.green, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {ICONS[item.action_type] || DEFAULT_ICON}
                          </span>
                          <span style={{ flex: 1, color: c.dark, fontSize: '.78rem', fontWeight: 500 }}>
                            {getGroupSummary(item.action_type, item.count)}
                          </span>
                          <span style={s.time}>
                            {formatTime(item.first.created_at)}
                            {item.first.created_at !== item.last.created_at && ` – ${formatTime(item.last.created_at)}`}
                          </span>
                        </div>
                      )
                    }
                    return (
                      <div key={i} style={{ ...s.logItem, margin: 0 }}>
                        <span style={{ color: c.green, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {ICONS[item.log.action_type] || DEFAULT_ICON}
                        </span>
                        <span style={{ flex: 1, color: c.dark, fontSize: '.78rem' }}>
                          {formatAction(item.log)}
                        </span>
                        <span style={s.time}>{formatTime(item.log.created_at)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
