import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// helpers
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail || 'Request failed')
  return json
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const S = {
  page:     { minHeight: '100vh', background: '#F8FAF8', fontFamily: 'Inter, sans-serif', color: '#2E3D30' },
  inner:    { maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' },
  pageTitle:{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: '#1A271C', margin: 0, letterSpacing: '-0.03em' },
  pageSub:  { fontSize: '.875rem', color: '#7B907D', marginTop: '.35rem', marginBottom: '2rem' },
  tabs:     { display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '2px solid #E4EBE5' },
  tab:      (a) => ({ padding: '.6rem 1.25rem', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', color: a ? '#5A8A67' : '#7B907D', borderBottom: a ? '2px solid #5A8A67' : '2px solid transparent', marginBottom: -2, transition: 'all .15s', fontFamily: 'Inter, sans-serif' }),
  card:     { background: '#fff', border: '1px solid #E4EBE5', borderRadius: 14, padding: '2rem', marginBottom: '1.5rem' },
  cardTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: '#1A271C', marginTop: 0, marginBottom: '1.25rem' },
  label:    { display: 'block', fontSize: '.75rem', fontWeight: 600, color: '#2E3D30', marginBottom: '.35rem', letterSpacing: '.04em', textTransform: 'uppercase' },
  input:    { width: '100%', padding: '.7rem .9rem', border: '1px solid #E4EBE5', borderRadius: 8, fontSize: '.9rem', color: '#1A271C', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '.7rem .9rem', border: '1px solid #E4EBE5', borderRadius: 8, fontSize: '.9rem', color: '#1A271C', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8', boxSizing: 'border-box', resize: 'vertical', minHeight: 90 },
  select:   { width: '100%', padding: '.7rem .9rem', border: '1px solid #E4EBE5', borderRadius: 8, fontSize: '.9rem', color: '#1A271C', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#FAFAF8', boxSizing: 'border-box' },
  hint:     { fontSize: '.75rem', color: '#7B907D', marginTop: '.3rem', marginBottom: 0 },
  field:    { marginBottom: '1.2rem' },
  row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn:      { padding: '.72rem 1.5rem', background: '#5A8A67', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  btnGhost: { padding: '.72rem 1.5rem', background: 'transparent', color: '#5A8A67', border: '1.5px solid #5A8A67', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnSm:    { padding: '.4rem .8rem', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: 7, border: '1.5px solid #5A8A67', background: 'transparent', color: '#5A8A67' },
  btnDanger:{ padding: '.4rem .8rem', background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 7, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  toggle:   { display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.3rem' },
  handlePrev:{ fontSize: '.82rem', color: '#5A8A67', marginTop: '.3rem', fontWeight: 500 },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' },
  prodCard: { background: '#fff', border: '1px solid #E4EBE5', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow .2s, transform .2s' },
  prodImg:  { width: '100%', aspectRatio: '4/5', objectFit: 'cover', background: '#EDF3EE', display: 'block' },
  prodBody: { padding: '1rem' },
  prodTitle:{ fontWeight: 600, fontSize: '.875rem', color: '#1A271C', marginBottom: '.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  prodPrice:{ fontSize: '.85rem', color: '#5A8A67', fontWeight: 700, marginBottom: '.15rem' },
  prodMeta: { fontSize: '.72rem', color: '#7B907D' },
  prodActs: { display: 'flex', gap: '.5rem', marginTop: '.75rem' },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(26,39,28,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:    { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' },
  modalTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 500, color: '#1A271C', marginTop: 0, marginBottom: '1.5rem' },
  dropzone: (drag) => ({ border: `2px dashed ${drag ? '#5A8A67' : '#E4EBE5'}`, borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: drag ? '#EDF3EE' : '#FAFAF8', transition: 'all .15s' }),
  thumbRow: { display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.75rem' },
  thumb:    { width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #E4EBE5' },
  alert:    (t) => ({ padding: '.75rem 1rem', borderRadius: 8, fontSize: '.85rem', marginBottom: '1rem', background: t==='error'?'#FEF2F2':'#F0FDF4', border:`1px solid ${t==='error'?'#FECACA':'#BBF7D0'}`, color: t==='error'?'#DC2626':'#166534' }),
  spinner:  { display: 'inline-block', width: 20, height: 20, border: '2px solid #E4EBE5', borderTop: '2px solid #5A8A67', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  empty:    { textAlign: 'center', padding: '3.5rem 1rem', color: '#7B907D' },
}

export default function StoreBuilder() {
  const [tab, setTab]         = useState('settings')
  const [store, setStore]     = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editProd, setEditProd]   = useState(null)

  const [form, setForm] = useState({ name:'', handle:'', description:'', cover_image:'', currency:'USD', is_public:true })
  const [handleEdited, setHandleEdited] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await api('GET', '/selora-stores/me')
      if (res.store) {
        setStore(res.store)
        setForm({ name:res.store.name, handle:res.store.handle, description:res.store.description||'', cover_image:res.store.cover_image||'', currency:res.store.currency, is_public:res.store.is_public })
        const pr = await api('GET', `/selora-stores/${res.store.id}/products`)
        setProducts(pr.products || [])
      }
    } catch(e) { setMsg({ type:'error', text:e.message }) }
    finally { setLoading(false) }
  }

  function onNameChange(val) {
    setForm(f => ({ ...f, name:val, handle: handleEdited ? f.handle : slugify(val) }))
  }

  async function saveSettings(e) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      if (store) {
        const u = await api('PUT', `/selora-stores/${store.id}`, form)
        setStore(u); setMsg({ type:'ok', text:'Store settings saved!' })
      } else {
        const c = await api('POST', '/selora-stores', form)
        setStore(c); setMsg({ type:'ok', text:'Store created! Your storefront is now live.' })
      }
    } catch(e) { setMsg({ type:'error', text:e.message }) }
    finally { setSaving(false) }
  }

  async function deleteProd(id) {
    if (!window.confirm('Delete this product permanently?')) return
    try {
      await api('DELETE', `/selora-stores/${store.id}/products/${id}`)
      setProducts(p => p.filter(x => x.id !== id))
    } catch(e) { setMsg({ type:'error', text:e.message }) }
  }

  function onProductSaved(p) {
    setProducts(ps => editProd ? ps.map(x => x.id===p.id ? p : x) : [...ps, p])
    setShowModal(false)
    setMsg({ type:'ok', text: editProd ? 'Product updated!' : 'Product added!' })
    setEditProd(null)
  }

  const storeUrl = `${window.location.origin}/store/${form.handle || '...'}`

  if (loading) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={S.spinner} />
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, textarea:focus, select:focus { border-color: #5A8A67 !important; box-shadow: 0 0 0 3px rgba(90,138,103,.12); }
        .sb-prod-card:hover { box-shadow: 0 6px 24px rgba(90,138,103,.14); transform: translateY(-2px); }
        .sb-btn-primary:hover { background: #4a7a57 !important; }
        .sb-btn-ghost:hover { background: #EDF3EE !important; }
        @media (max-width: 640px) { .sb-row2 { grid-template-columns: 1fr !important; } }
      `}</style>
      <div style={S.inner}>
        <h1 style={S.pageTitle}>Store Builder</h1>
        <p style={S.pageSub}>
          {store
            ? <>Live at <a href={`/store/${store.handle}`} target="_blank" rel="noreferrer" style={{ color:'#5A8A67', fontWeight:600, textDecoration:'none' }}>selora.fashion/store/{store.handle}</a> · <a href={`/store/${store.handle}`} target="_blank" rel="noreferrer" style={{ color:'#7B907D', fontSize:'.8rem', textDecoration:'none' }}>Open storefront →</a></>
            : 'Set up your store in seconds. Your public storefront goes live instantly.'
          }
        </p>

        {msg && <div style={S.alert(msg.type)}>{msg.text}</div>}

        <div style={S.tabs}>
          {[['settings','⚙️  Store Settings'],['products','🛍️  Products']].map(([k,l]) => (
            <button key={k} style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <form onSubmit={saveSettings}>
            <div style={S.card}>
              <p style={S.cardTitle}>Store Identity</p>
              <div style={S.field}>
                <label style={S.label}>Store Name</label>
                <input style={S.input} value={form.name} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Luna Mode" required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Handle (URL Slug)</label>
                <input
                  style={S.input}
                  value={form.handle}
                  onChange={e => { setHandleEdited(true); setForm(f => ({ ...f, handle: slugify(e.target.value) })) }}
                  placeholder="luna-mode"
                  required
                />
                <p style={S.handlePrev}>🔗 {storeUrl}</p>
              </div>
              <div style={S.field}>
                <label style={S.label}>Tagline / Description</label>
                <textarea style={S.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} placeholder="A short sentence about your brand..." />
              </div>
              <div style={S.field}>
                <label style={S.label}>Cover Image URL</label>
                <input style={S.input} value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image:e.target.value }))} placeholder="https://..." />
                <p style={S.hint}>Paste any image URL for your store banner.</p>
              </div>
              <div style={{ ...S.row2 }} className="sb-row2">
                <div style={S.field}>
                  <label style={S.label}>Currency</label>
                  <select style={S.select} value={form.currency} onChange={e => setForm(f => ({ ...f, currency:e.target.value }))}>
                    {['USD','EUR','GBP','PKR','INR','AED','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ ...S.field }}>
                  <label style={S.label}>Visibility</label>
                  <div style={S.toggle}>
                    <input type="checkbox" id="sb_public" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public:e.target.checked }))} style={{ width:18, height:18, accentColor:'#5A8A67', cursor:'pointer' }} />
                    <label htmlFor="sb_public" style={{ fontSize:'.875rem', cursor:'pointer', color:'#2E3D30' }}>Make store publicly visible</label>
                  </div>
                </div>
              </div>
            </div>
            <button className="sb-btn-primary" style={S.btn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : (store ? 'Save Changes' : '✨ Create My Store')}
            </button>
          </form>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            {!store ? (
              <div style={S.card}>
                <p style={{ color:'#7B907D', fontSize:'.9rem', margin:0 }}>💡 Create your store in the Settings tab first, then come back to add products.</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                  <p style={{ color:'#7B907D', fontSize:'.875rem', margin:0 }}>{products.length} product{products.length!==1?'s':''}</p>
                  <button className="sb-btn-primary" style={S.btn} onClick={() => { setEditProd(null); setShowModal(true) }}>+ Add Product</button>
                </div>

                {products.length === 0 ? (
                  <div style={S.empty}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🛍️</div>
                    <p style={{ fontWeight:600, color:'#1A271C', marginBottom:'.4rem' }}>No products yet</p>
                    <p style={{ fontSize:'.875rem', margin:0 }}>Click "Add Product" to list your first item.</p>
                  </div>
                ) : (
                  <div style={S.grid}>
                    {products.map(p => (
                      <div key={p.id} style={S.prodCard} className="sb-prod-card">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.title} style={S.prodImg} />
                          : <div style={{ ...S.prodImg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>👗</div>
                        }
                        <div style={S.prodBody}>
                          <p style={S.prodTitle}>{p.title}</p>
                          <p style={S.prodPrice}>{form.currency} {Number(p.price).toFixed(2)}</p>
                          <p style={S.prodMeta}>{p.inventory} in stock · {p.is_active ? '✅ Active' : '⏸ Inactive'}</p>
                          <div style={S.prodActs}>
                            <button className="sb-btn-ghost" style={S.btnSm} onClick={() => { setEditProd(p); setShowModal(true) }}>Edit</button>
                            <button style={S.btnDanger} onClick={() => deleteProd(p.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          storeId={store?.id}
          currency={form.currency}
          initial={editProd}
          onSave={onProductSaved}
          onClose={() => { setShowModal(false); setEditProd(null) }}
        />
      )}
    </div>
  )
}

function ProductModal({ storeId, currency, initial, onSave, onClose }) {
  const isEdit = !!initial
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    price: initial?.price || '',
    compare_at_price: initial?.compare_at_price || '',
    inventory: initial?.inventory ?? 0,
    tags: (initial?.tags || []).join(', '),
    is_active: initial?.is_active ?? true,
    images: initial?.images || [],
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')
  const [dragOver, setDragOver]   = useState(false)
  const fileInput = useRef()

  async function uploadFiles(files) {
    if (!files?.length) return
    setUploading(true)
    try {
      const urls = []
      for (const file of Array.from(files)) {
        const b64 = await toBase64(file)
        const res = await api('POST', `/selora-stores/${storeId}/upload-image`, {
          file_data: b64,
          file_name: file.name,
          content_type: file.type || 'image/jpeg',
        })
        urls.push(res.url)
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    } catch(e) { setErr(`Upload failed: ${e.message}`) }
    finally { setUploading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        inventory: parseInt(form.inventory, 10),
        images: form.images,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_active: form.is_active,
      }
      const result = isEdit
        ? await api('PUT', `/selora-stores/${storeId}/products/${initial.id}`, payload)
        : await api('POST', `/selora-stores/${storeId}/products`, payload)
      onSave(result)
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={S.overlay} onClick={e => { if(e.target===e.currentTarget) onClose() }}>
      <div style={S.modal}>
        <h2 style={S.modalTitle}>{isEdit ? 'Edit Product' : 'New Product'}</h2>
        {err && <div style={S.alert('error')}>{err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Title *</label>
            <input style={S.input} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
          </div>
          <div style={S.field}>
            <label style={S.label}>Description</label>
            <textarea style={S.textarea} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Describe this product..." />
          </div>
          <div style={{ ...S.row2 }} className="sb-row2">
            <div style={S.field}>
              <label style={S.label}>Price ({currency}) *</label>
              <input style={S.input} type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} required />
            </div>
            <div style={S.field}>
              <label style={S.label}>Compare-at Price</label>
              <input style={S.input} type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => setForm(f=>({...f,compare_at_price:e.target.value}))} placeholder="Optional" />
            </div>
          </div>
          <div style={{ ...S.row2 }} className="sb-row2">
            <div style={S.field}>
              <label style={S.label}>Inventory</label>
              <input style={S.input} type="number" min="0" value={form.inventory} onChange={e => setForm(f=>({...f,inventory:e.target.value}))} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Status</label>
              <div style={S.toggle}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))} style={{ width:16,height:16,accentColor:'#5A8A67',cursor:'pointer' }} />
                <span style={{ fontSize:'.875rem' }}>Active (visible in store)</span>
              </div>
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tags</label>
            <input style={S.input} value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} placeholder="summer, dress, floral" />
            <p style={S.hint}>Comma-separated</p>
          </div>

          <div style={S.field}>
            <label style={S.label}>Product Images</label>
            <div
              style={S.dropzone(dragOver)}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
              onClick={() => fileInput.current.click()}
            >
              <input ref={fileInput} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={e => uploadFiles(e.target.files)} />
              {uploading
                ? <><div style={{ ...S.spinner, margin:'0 auto .5rem' }} /><p style={{ fontSize:'.85rem', color:'#7B907D', margin:0 }}>Uploading...</p></>
                : <><p style={{ fontSize:'.9rem', color:'#7B907D', margin:0 }}>📷 Drop images here or click to browse</p><p style={{ fontSize:'.75rem', color:'#7B907D', marginTop:'.25rem', marginBottom:0 }}>Multiple images supported</p></>
              }
            </div>
            {form.images.length > 0 && (
              <div style={S.thumbRow}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={url} alt="" style={S.thumb} />
                    <button type="button" onClick={() => setForm(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))}
                      style={{ position:'absolute', top:-6, right:-6, background:'#DC2626', color:'#fff', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:11, lineHeight:'18px', padding:0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:'.75rem', marginTop:'.5rem' }}>
            <button className="sb-btn-primary" style={S.btn} type="submit" disabled={saving||uploading}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
            <button className="sb-btn-ghost" style={S.btnGhost} type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
