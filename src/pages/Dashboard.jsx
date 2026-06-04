import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = {
  green: '#5A8A67', dark: '#1A271C', muted: '#7B907D',
  border: '#E4EBE5', bg: '#F8FAF8', bg2: '#F1F5F1', card: '#fff',
}

const s = {
  page:    { minHeight:'100vh', background:c.bg, fontFamily:'Inter, sans-serif' },
  nav:     { background:c.card, borderBottom:`1px solid ${c.border}`, padding:'.9rem 2.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:    { fontFamily:'Fraunces, serif', fontSize:'1.1rem', fontWeight:600, color:c.dark, textDecoration:'none' },
  navRight:{ display:'flex', alignItems:'center', gap:'1rem' },
  email:   { fontSize:'.78rem', color:c.muted },
  signout: { fontSize:'.78rem', color:c.muted, background:'none', border:`1px solid ${c.border}`, padding:'.35rem .8rem', borderRadius:6, cursor:'pointer', fontFamily:'Inter, sans-serif' },
  body:    { maxWidth:1100, margin:'0 auto', padding:'2.5rem 2rem' },
  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' },
  h1:      { fontFamily:'Fraunces, serif', fontSize:'1.8rem', fontWeight:500, color:c.dark, letterSpacing:'-.3px' },
  btnP:    { background:c.green, color:'#fff', border:'none', padding:'.65rem 1.4rem', borderRadius:8, fontSize:'.82rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', textDecoration:'none', display:'inline-block' },
  card:    { background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:'1.6rem' },
  cardTit: { fontFamily:'Fraunces, serif', fontSize:'1rem', fontWeight:500, color:c.dark, marginBottom:'1rem' },
  grid3:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  metric:  { background:c.bg2, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.1rem' },
  mVal:    { fontFamily:'Fraunces, serif', fontSize:'1.5rem', fontWeight:500, color:c.dark, letterSpacing:'-.3px' },
  mLbl:    { fontSize:'.65rem', color:c.muted, textTransform:'uppercase', letterSpacing:'.08em', marginTop:'.2rem' },
  mChg:    { fontSize:'.7rem', color:c.green, fontWeight:600, marginTop:'.2rem' },
  tag:     { fontSize:'.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.12em', color:c.green, marginBottom:'.5rem' },
  logItem: { display:'flex', alignItems:'center', gap:'.6rem', padding:'.55rem .7rem', background:c.bg2, borderRadius:7, fontSize:'.78rem', border:`1px solid ${c.border}`, marginBottom:'.4rem' },
  dot:     { width:5, height:5, borderRadius:'50%', background:c.green, flexShrink:0 },
  time:    { color:c.muted, fontSize:'.68rem', marginLeft:'auto' },
  store:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.2rem', background:c.bg2, borderRadius:10, border:`1px solid ${c.border}`, marginBottom:'.6rem', cursor:'pointer' },
  badge:   { fontSize:'.65rem', fontWeight:600, background:'#DCFCE7', color:'#166534', padding:'.2rem .6rem', borderRadius:999, textTransform:'uppercase', letterSpacing:'.06em' },
  empty:   { textAlign:'center', padding:'3rem 1rem', color:c.muted, fontSize:'.88rem', fontWeight:300, lineHeight:1.7 },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, stores, activeStore, loading } = useAppContext()
  const [logs, setLogs]         = useState([])
  const [reports, setReports]   = useState([])
  const [running, setRunning]   = useState(false)

  // ── Fetch logs & reports when active store changes ──────────────────────────
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
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/logs`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) { console.error(e) }
  }

  const fetchReports = async (storeId) => {
    try {
      const res  = await fetch(`${API_URL}/api/stores/${storeId}/reports`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (e) { console.error(e) }
  }

  // ── Run agent ───────────────────────────────────────────────────────────────
  const runAgent = async () => {
    if (!activeStore) return
    setRunning(true)
    try {
      await fetch(`${API_URL}/api/agent/run/${activeStore.id}?dry_run=false`, { method:'POST' })
      setTimeout(() => {
        fetchLogs(activeStore.id)
        fetchReports(activeStore.id)
        setRunning(false)
      }, 6000)
    } catch (e) {
      console.error(e)
      setRunning(false)
    }
  }

  // ── Format action type ────────────────────────────────────────────────────
  const formatAction = (type) => {
    const map = {
      reprice_product:  '💰 Repriced product',
      optimize_listing: '✍️ Optimized listing',
      restock_alert:    '📦 Restock alert',
      generate_report:  '📊 Generated report',
    }
    return map[type] || type
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }

  if (loading) {
    return (
      <div style={{...s.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <p style={{color:c.muted, fontSize:'.9rem'}}>Loading your dashboard...</p>
      </div>
    )
  }

  const latestReport = reports[0] || null

  return (
    <div style={s.page}>
      <div style={s.body}>

        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h1 style={s.h1}>
              {activeStore ? `${activeStore.shop_name}` : 'Your Dashboard'}
            </h1>
            <p style={{fontSize:'.85rem', color:c.muted, marginTop:'.3rem', fontWeight:300}}>
              {activeStore ? `Connected to ${activeStore.shop_url}` : 'Connect a store to get started'}
            </p>
          </div>
          <div style={{display:'flex', gap:'.8rem', flexWrap:'wrap'}}>
            {activeStore && (
              <button
                style={{...s.btnP, background:running?'#7B907D':c.green}}
                onClick={runAgent}
                disabled={running}
              >
                {running ? '🤖 Agent running...' : '▶ Run Agent Now'}
              </button>
            )}
            <Link to="/connect" style={{...s.btnP, background:'transparent', color:c.green, border:`1px solid ${c.border}`}}>
              + Connect Store
            </Link>
          </div>
        </div>

        {/* NO STORES STATE */}
        {stores.length === 0 && (
          <div style={{...s.card, ...s.empty}}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🌱</div>
            <h2 style={{fontFamily:'Fraunces, serif', fontSize:'1.3rem', fontWeight:500, color:c.dark, marginBottom:'.5rem'}}>
              No stores connected yet
            </h2>
            <p style={{marginBottom:'1.5rem'}}>
              Connect your Shopify store and Selora will start growing it tonight.
            </p>
            <Link to="/connect" style={s.btnP}>Connect Your Store →</Link>
          </div>
        )}

        {activeStore && (
          <>
            {/* METRICS */}
            {latestReport && (
              <div style={{marginBottom:'1.5rem'}}>
                <div style={s.tag}>Latest Report</div>
                <div style={s.grid3}>
                  <div style={s.metric}>
                    <div style={s.mVal}>{latestReport.actions_taken?.length || 0}</div>
                    <div style={s.mLbl}>Actions Taken</div>
                  </div>
                  <div style={s.metric}>
                    <div style={s.mVal}>{latestReport.wins?.length || 0}</div>
                    <div style={s.mLbl}>Wins</div>
                    <div style={s.mChg}>↑ Growing</div>
                  </div>
                  <div style={s.metric}>
                    <div style={s.mVal}>{latestReport.concerns?.length || 0}</div>
                    <div style={s.mLbl}>Concerns</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>

              {/* AGENT ACTIVITY */}
              <div style={s.card}>
                <div style={s.cardTit}>🤖 Agent Activity</div>
                {logs.length === 0 ? (
                  <p style={{fontSize:'.82rem', color:c.muted, fontWeight:300, lineHeight:1.7}}>
                    No activity yet. Run the agent to see what Selora does to your store.
                  </p>
                ) : (
                  logs.slice(0,10).map((log, i) => (
                    <div key={i} style={s.logItem}>
                      <div style={s.dot}/>
                      <span style={{flex:1, color:c.dark}}>{formatAction(log.action_type)}</span>
                      <span style={s.time}>{formatTime(log.created_at)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* LATEST REPORT */}
              <div style={s.card}>
                <div style={s.cardTit}>📊 Latest Growth Report</div>
                {!latestReport ? (
                  <p style={{fontSize:'.82rem', color:c.muted, fontWeight:300, lineHeight:1.7}}>
                    No reports yet. Run the agent to generate your first growth report.
                  </p>
                ) : (
                  <>
                    <p style={{fontSize:'.82rem', color:c.muted, lineHeight:1.75, fontWeight:300, marginBottom:'1rem'}}>
                      {latestReport.summary}
                    </p>

                    {latestReport.wins?.length > 0 && (
                      <>
                        <p style={{fontSize:'.7rem', fontWeight:700, color:c.green, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem'}}>✅ Wins</p>
                        {latestReport.wins.map((w,i) => (
                          <div key={i} style={{...s.logItem, background:'#F0FDF4', borderColor:'#BBF7D0'}}>
                            <div style={{...s.dot, background:'#166534'}}/>
                            <span style={{flex:1, color:'#166534'}}>{w}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {latestReport.concerns?.length > 0 && (
                      <>
                        <p style={{fontSize:'.7rem', fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'.08em', margin:'.8rem 0 .5rem'}}>⚠️ Concerns</p>
                        {latestReport.concerns.map((c,i) => (
                          <div key={i} style={{...s.logItem, background:'#FFFBEB', borderColor:'#FDE68A'}}>
                            <div style={{...s.dot, background:'#D97706'}}/>
                            <span style={{flex:1, color:'#92400E'}}>{c}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* CHAT SESSIONS & CONVERSATION HISTORY */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem', marginTop:'1.5rem'}}>
              
              {/* CONNECTED STORES */}
              <div style={s.card}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                  <div style={s.cardTit}>🛍️ Connected Stores</div>
                  <Link to="/connect" style={{fontSize:'.78rem', color:c.green, textDecoration:'none', fontWeight:500}}>+ Add store</Link>
                </div>
                {stores.map(store => (
                  <div key={store.id} style={{...s.store, borderColor: activeStore?.id===store.id ? c.green : c.border}}>
                    <div>
                      <div style={{fontSize:'.88rem', fontWeight:600, color:c.dark}}>{store.shop_name}</div>
                      <div style={{fontSize:'.72rem', color:c.muted, marginTop:'.15rem'}}>{store.shop_url}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'.6rem'}}>
                      <span style={s.badge}>Active</span>
                      <span style={{fontSize:'.68rem', color:c.muted}}>
                        {store.last_synced_at ? `Last synced ${formatTime(store.last_synced_at)}` : 'Never synced'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}