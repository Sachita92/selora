import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'
import { supabase } from '../lib/supabase'

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

// ─── Health Check Components ──────────────────────────────────────────────────

const SEVERITY_META = {
  critical: { color: '#DC2626', bg: 'rgba(220,38,38,.07)', border: 'rgba(220,38,38,.2)', label: 'Critical', dot: '#DC2626' },
  warning:  { color: '#D97706', bg: 'rgba(217,119,6,.07)',  border: 'rgba(217,119,6,.2)',  label: 'Warning',  dot: '#D97706' },
  info:     { color: '#2563EB', bg: 'rgba(37,99,235,.07)',  border: 'rgba(37,99,235,.2)',  label: 'Info',     dot: '#2563EB' },
}

function ScoreRing({ score }) {
  const size = 120
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#5A8A67' : score >= 60 ? '#D97706' : '#DC2626'
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
          {score}
        </span>
        <span style={{ fontSize: '.62rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          / 100
        </span>
        <span style={{
          fontSize: '.7rem', fontWeight: 700, color, marginTop: '.1rem',
          background: color + '18', padding: '.05rem .35rem', borderRadius: 4,
        }}>
          {grade}
        </span>
      </div>
    </div>
  )
}

function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const meta = SEVERITY_META[issue.severity] || SEVERITY_META.info
  const hasAffected = issue.affected_products?.length > 0

  return (
    <div style={{
      background: meta.bg, border: `1px solid ${meta.border}`,
      borderRadius: 10, padding: '.85rem 1rem', marginBottom: '.55rem',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem', cursor: hasAffected ? 'pointer' : 'default' }}
        onClick={() => hasAffected && setExpanded(!expanded)}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: meta.dot,
          flexShrink: 0, marginTop: '.42rem',
        }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '.82rem', color: c.dark, fontWeight: 500, lineHeight: 1.5 }}>
            {issue.message}
          </span>
          {hasAffected && (
            <span style={{
              fontSize: '.67rem', color: meta.color, fontWeight: 600,
              marginLeft: '.5rem', userSelect: 'none',
            }}>
              {expanded ? '▲ hide' : `▼ ${issue.affected_count} item${issue.affected_count !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <span style={{
          fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
          background: meta.color + '22', color: meta.color, padding: '.15rem .45rem',
          borderRadius: 5, flexShrink: 0,
        }}>
          {meta.label}
        </span>
      </div>
      {expanded && hasAffected && (
        <div style={{ marginTop: '.6rem', paddingLeft: '1.35rem', display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
          {issue.affected_products.map((name, i) => (
            <span key={i} style={{
              fontSize: '.72rem', fontWeight: 500, color: meta.color,
              background: meta.color + '18', padding: '.2rem .5rem', borderRadius: 5,
            }}>
              {name}
            </span>
          ))}
          {issue.affected_count > issue.affected_products.length && (
            <span style={{ fontSize: '.72rem', color: c.muted, padding: '.2rem .4rem' }}>
              + {issue.affected_count - issue.affected_products.length} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function HealthReport({ report, onRerun, running }) {
  const critical = report.issues.filter(i => i.severity === 'critical')
  const warnings  = report.issues.filter(i => i.severity === 'warning')
  const info      = report.issues.filter(i => i.severity === 'info')
  const checkedAt = report.checked_at
    ? new Date(report.checked_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      {/* Score + summary */}
      <div style={{ ...s.card, background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <ScoreRing score={report.score} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>
              Store Health Score
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: c.dark, lineHeight: 1.5, marginBottom: '.7rem' }}>
              {report.summary}
            </div>
            {/* Counters */}
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Critical', count: report.issues_critical, color: '#DC2626', bg: 'rgba(220,38,38,.08)' },
                { label: 'Warnings', count: report.issues_warnings, color: '#D97706', bg: 'rgba(217,119,6,.08)' },
                { label: 'Info',     count: report.issues_info,     color: '#2563EB', bg: 'rgba(37,99,235,.08)' },
              ].map(({ label, count, color, bg }) => (
                <span key={label} style={{
                  fontSize: '.7rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 6,
                  background: bg, color,
                }}>
                  {count} {label}
                </span>
              ))}
              <span style={{ fontSize: '.68rem', color: c.muted, alignSelf: 'center' }}>
                {report.total_products} products analyzed
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', alignItems: 'flex-end' }}>
            <button
              onClick={onRerun}
              disabled={running}
              style={{
                background: 'var(--g)', color: '#fff', border: 'none',
                padding: '.55rem 1.1rem', borderRadius: 9, fontSize: '.8rem',
                fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter,sans-serif', opacity: running ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'opacity .15s',
              }}
            >
              {running ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Running…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Re-run Check
                </>
              )}
            </button>
            {checkedAt && (
              <span style={{ fontSize: '.65rem', color: c.muted }}>Last checked: {checkedAt}</span>
            )}
          </div>
        </div>
      </div>

      {/* Issues */}
      {(critical.length > 0 || warnings.length > 0 || info.length > 0) && (
        <div style={s.card}>
          <div style={s.cardTit}>Issues Found</div>

          {critical.length > 0 && (
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>
                🔴 Critical
              </div>
              {critical.map((issue, i) => <IssueCard key={i} issue={issue} />)}
            </div>
          )}

          {warnings.length > 0 && (
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>
                🟡 Warnings
              </div>
              {warnings.map((issue, i) => <IssueCard key={i} issue={issue} />)}
            </div>
          )}

          {info.length > 0 && (
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>
                🔵 Info
              </div>
              {info.map((issue, i) => <IssueCard key={i} issue={issue} />)}
            </div>
          )}
        </div>
      )}

      {/* Healthy areas */}
      {report.healthy_areas?.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTit}>✅ Healthy Areas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {report.healthy_areas.map((area, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.55rem .8rem', background: 'rgba(90,138,103,.06)',
                border: '1px solid rgba(90,138,103,.15)', borderRadius: 8,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: '.8rem', color: c.dark }}>{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {report.recommendations?.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTit}>AI Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {report.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--g)',
                  color: '#fff', fontSize: '.68rem', fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '.12rem',
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '.82rem', color: c.dark, lineHeight: 1.6, paddingTop: '.12rem' }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable checks */}
      {report.unavailable_checks?.length > 0 && (
        <div style={{ ...s.card, opacity: 0.7 }}>
          <div style={{ fontSize: '.68rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.6rem' }}>
            Checks Not Evaluated
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            {report.unavailable_checks.map((note, i) => (
              <div key={i} style={{ fontSize: '.75rem', color: c.muted, lineHeight: 1.5 }}>— {note}</div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const { activeStore } = useAppContext()
  const [activeTab, setActiveTab] = useState('growth')  // 'growth' | 'activity' | 'health'

  // Growth report state
  const [logs, setLogs]       = useState([])
  const [reports, setReports] = useState([])
  const [fetchingLogs, setFetchingLogs]       = useState(false)
  const [fetchingReports, setFetchingReports] = useState(false)

  // Health check state
  const [healthReport, setHealthReport]   = useState(null)
  const [fetchingHealth, setFetchingHealth] = useState(false)
  const [healthError, setHealthError]     = useState('')

  useEffect(() => {
    if (activeStore) {
      fetchLogs(activeStore.id)
      fetchReports(activeStore.id)
    } else {
      setLogs([])
      setReports([])
      setHealthReport(null)
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

  const runHealthCheck = useCallback(async () => {
    if (!activeStore || fetchingHealth) return
    setFetchingHealth(true)
    setHealthError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/stores/${activeStore.id}/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Health check failed')
      }
      const data = await res.json()
      setHealthReport(data.report)
    } catch (e) {
      console.error(e)
      setHealthError(e.message || 'Failed to run health check')
    } finally {
      setFetchingHealth(false)
    }
  }, [activeStore, fetchingHealth])

  // Auto-run health check when switching to health tab and no report yet
  useEffect(() => {
    if (activeTab === 'health' && activeStore && !healthReport && !fetchingHealth) {
      runHealthCheck()
    }
  }, [activeTab, activeStore])

  const latestReport = reports[0] || null
  const groupedLogs  = groupLogs(logs)

  const TAB_STYLE = (active) => ({
    padding: '.5rem 1.1rem', borderRadius: 8, border: 'none',
    background: active ? 'var(--bg-2)' : 'transparent',
    color: active ? c.dark : c.muted,
    fontWeight: active ? 600 : 500, fontSize: '.84rem',
    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
    transition: 'all .15s',
  })

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={s.h1}>Reports</h1>
          <p style={{ fontSize: '.85rem', color: c.muted, marginTop: '.3rem', fontWeight: 300 }}>
            {latestReport
              ? `Last agent run: ${formatDate(latestReport.created_at)}`
              : activeStore ? 'No agent runs yet.' : 'No store connected.'}
          </p>
        </div>

        {/* TABS */}
        {activeStore && (
          <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1.5rem', background: 'var(--bg-1)', border: `1px solid ${c.border}`, borderRadius: 10, padding: '.3rem', width: 'fit-content' }}>
            {[
              { id: 'growth',   label: 'Growth Report' },
              { id: 'activity', label: 'Agent Activity' },
              { id: 'health',   label: '🩺 Store Health' },
            ].map(tab => (
              <button key={tab.id} style={TAB_STYLE(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!activeStore && (
          <div style={{ ...s.card, textAlign: 'center', padding: '3rem', color: c.muted }}>
            <p>Connect a store to see reports.</p>
            <Link to="/connect" style={{ display: 'inline-block', marginTop: '1rem', color: c.green, fontWeight: 600, textDecoration: 'none', fontSize: '.88rem' }}>
              Set Up a Store →
            </Link>
          </div>
        )}

        {activeStore && activeTab === 'growth' && (
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
                    <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: c.green, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>Wins</h4>
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
                    <h4 style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--inventory-low-text)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>Concerns</h4>
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
        )}

        {activeStore && activeTab === 'activity' && (
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
        )}

        {activeStore && activeTab === 'health' && (
          <>
            {fetchingHealth && !healthReport && (
              <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🩺</div>
                <div style={{ fontSize: '.9rem', fontWeight: 600, color: c.dark, marginBottom: '.3rem' }}>
                  Running Store Health Check…
                </div>
                <div style={{ fontSize: '.78rem', color: c.muted }}>
                  Analyzing {activeStore.shop_name}'s catalog for issues
                </div>
              </div>
            )}

            {healthError && !fetchingHealth && (
              <div style={{ ...s.card, background: 'rgba(220,38,38,.05)', borderColor: 'rgba(220,38,38,.2)' }}>
                <div style={{ fontSize: '.84rem', color: '#DC2626', marginBottom: '.8rem' }}>
                  ⚠️ {healthError}
                </div>
                <button
                  onClick={runHealthCheck}
                  style={{
                    background: 'var(--g)', color: '#fff', border: 'none',
                    padding: '.55rem 1.2rem', borderRadius: 8, fontSize: '.82rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {!healthReport && !fetchingHealth && !healthError && (
              <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🩺</div>
                <div style={{ fontSize: '.9rem', fontWeight: 600, color: c.dark, marginBottom: '.5rem' }}>
                  Run a Store Health Check
                </div>
                <div style={{ fontSize: '.82rem', color: c.muted, marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto .8rem' }}>
                  Selora will inspect your full catalog for content gaps, inventory issues, SEO problems, and conversion opportunities.
                </div>
                <button
                  onClick={runHealthCheck}
                  style={{
                    background: 'var(--g)', color: '#fff', border: 'none',
                    padding: '.65rem 1.5rem', borderRadius: 9, fontSize: '.85rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}
                >
                  Run Health Check
                </button>
              </div>
            )}

            {healthReport && (
              <HealthReport
                report={healthReport}
                onRerun={runHealthCheck}
                running={fetchingHealth}
              />
            )}
          </>
        )}

      </div>
    </div>
  )
}
