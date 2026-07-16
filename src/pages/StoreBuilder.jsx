import { useState, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { supabase } from '../lib/supabase'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const defaultCategories = [
  { id: 'cat_tops', name: 'Tops', image_url: '', link_target: '#category-tops' },
  { id: 'cat_bottoms', name: 'Bottoms', image_url: '', link_target: '#category-bottoms' },
  { id: 'cat_accessories', name: 'Accessories', image_url: '', link_target: '#category-accessories' },
  { id: 'cat_shoes', name: 'Shoes', image_url: '', link_target: '#category-shoes' }
]

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

function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      }, 'image/jpeg', 0.9)
    }
    image.onerror = (e) => reject(e)
  })
}

const S = {
  page:     { minHeight: '100vh', background: 'var(--bg-0)', fontFamily: 'Inter, sans-serif', color: 'var(--text-secondary)', transition: 'background-color 0.3s, color 0.3s' },
  inner:    { maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' },
  pageTitle:{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' },
  pageSub:  { fontSize: '.875rem', color: 'var(--text-muted)', marginTop: '.35rem', marginBottom: '2rem' },
  tabs:     { display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '2px solid var(--border)' },
  tab:      (a) => ({ padding: '.6rem 1.25rem', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', color: a ? 'var(--g)' : 'var(--text-muted)', borderBottom: a ? '2px solid var(--g)' : '2px solid transparent', marginBottom: -2, transition: 'all .15s', fontFamily: 'Inter, sans-serif' }),
  card:     { background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '2rem', marginBottom: '1.5rem', boxShadow: 'var(--card-shadow)' },
  cardTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: 0, marginBottom: '1.25rem' },
  label:    { display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.35rem', letterSpacing: '.04em', textTransform: 'uppercase' },
  input:    { width: '100%', padding: '.7rem .9rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.9rem', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--bg-0)', boxSizing: 'border-box', transition: 'all 0.15s' },
  textarea: { width: '100%', padding: '.7rem .9rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.9rem', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--bg-0)', boxSizing: 'border-box', resize: 'vertical', minHeight: 90, transition: 'all 0.15s' },
  select:   { width: '100%', padding: '.7rem .9rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.9rem', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'var(--bg-0)', boxSizing: 'border-box', transition: 'all 0.15s' },
  hint:     { fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.3rem', marginBottom: 0 },
  field:    { marginBottom: '1.2rem' },
  row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn:      { padding: '.72rem 1.5rem', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  btnGhost: { padding: '.72rem 1.5rem', background: 'transparent', color: 'var(--g)', border: '1.5px solid var(--g)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  btnSm:    { padding: '.4rem .8rem', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: 7, border: '1.5px solid var(--g)', background: 'transparent', color: 'var(--g)', transition: 'all .2s' },
  btnDanger:{ padding: '.4rem .8rem', background: 'transparent', color: 'var(--danger)', border: '1.5px solid var(--mr-undo-border)', borderRadius: 7, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s' },
  toggle:   { display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.3rem' },
  handlePrev:{ fontSize: '.82rem', color: 'var(--g)', marginTop: '.3rem', fontWeight: 500 },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' },
  prodCard: { background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'all .2s' },
  prodImg:  { width: '100%', aspectRatio: '4/5', objectFit: 'cover', background: 'var(--bg-2)', display: 'block' },
  prodBody: { padding: '1rem' },
  prodTitle:{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text-primary)', marginBottom: '.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  prodPrice:{ fontSize: '.85rem', color: 'var(--g)', fontWeight: 700, marginBottom: '.15rem' },
  prodMeta: { fontSize: '.72rem', color: 'var(--text-muted)' },
  prodActs: { display: 'flex', gap: '.5rem', marginTop: '.75rem' },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:    { background: 'var(--bg-1)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' },
  modalTitle:{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: 0, marginBottom: '1.5rem' },
  dropzone: (drag) => ({ border: `2px dashed ${drag ? 'var(--g)' : 'var(--border)'}`, borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: drag ? 'var(--bg-2)' : 'var(--bg-0)', transition: 'all .15s' }),
  thumbRow: { display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.75rem' },
  thumb:    { width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' },
  alert:    (t) => ({ padding: '.75rem 1rem', borderRadius: 8, fontSize: '.85rem', marginBottom: '1rem', background: t==='error'?'var(--mr-undo-bg)':'var(--badge-success-bg)', border:`1px solid ${t==='error'?'var(--mr-undo-border)':'var(--border-strong)'}`, color: t==='error'?'var(--mr-undo-color)':'var(--badge-success-text)' }),
  spinner:  { display: 'inline-block', width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--g)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  empty:    { textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' },
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

  const [form, setForm] = useState({ name:'', handle:'', description:'', cover_image:'', currency:'USD', is_public:true, categories: defaultCategories })
  const [handleEdited, setHandleEdited] = useState(false)

  const [heroSlots, setHeroSlots] = useState({
    main: { url: '', croppedUrl: '', croppedBlob: null, error: '', savedUrl: '' },
    left: { url: '', croppedUrl: '', croppedBlob: null, error: '', savedUrl: '' },
    right: { url: '', croppedUrl: '', croppedBlob: null, error: '', savedUrl: '' }
  })
  const [croppingRole, setCroppingRole] = useState(null)
  const [croppingUrl, setCroppingUrl] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await api('GET', '/selora-stores/me')
      if (res.store) {
        setStore(res.store)
        setForm({
          name: res.store.name,
          handle: res.store.handle,
          description: res.store.description || '',
          cover_image: res.store.cover_image || '',
          currency: res.store.currency,
          is_public: res.store.is_public,
          categories: (res.store.categories && res.store.categories.length > 0) ? res.store.categories : defaultCategories
        })
        setHeroSlots({
          main: { url: '', croppedUrl: res.store.hero_image_main || '', croppedBlob: null, error: '', savedUrl: res.store.hero_image_main || '' },
          left: { url: '', croppedUrl: res.store.hero_image_left || '', croppedBlob: null, error: '', savedUrl: res.store.hero_image_left || '' },
          right: { url: '', croppedUrl: res.store.hero_image_right || '', croppedBlob: null, error: '', savedUrl: res.store.hero_image_right || '' }
        })
        const pr = await api('GET', `/selora-stores/${res.store.id}/products`)
        setProducts(pr.products || [])
      }
    } catch(e) { setMsg({ type:'error', text:e.message }) }
    finally { setLoading(false) }
  }

  function onNameChange(val) {
    setForm(f => ({ ...f, name:val, handle: handleEdited ? f.handle : slugify(val) }))
  }

  const hasAllHeroImages = !!(heroSlots.main.croppedUrl && heroSlots.left.croppedUrl && heroSlots.right.croppedUrl)

  function handleFileSelect(file, role) {
    if (!file) return

    setHeroSlots(prev => ({
      ...prev,
      [role]: { ...prev[role], error: '' }
    }))

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setHeroSlots(prev => ({
        ...prev,
        [role]: { ...prev[role], error: 'Please upload a JPG, PNG, or WEBP image.' }
      }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setHeroSlots(prev => ({
        ...prev,
        [role]: { ...prev[role], error: 'This image is too large. Please upload something under 10MB.' }
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCroppingRole(role)
      setCroppingUrl(reader.result)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.onerror = () => {
      setHeroSlots(prev => ({
        ...prev,
        [role]: { ...prev[role], error: 'Something went wrong reading that image. Please try again.' }
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveCrop = async () => {
    if (!croppingRole) return
    try {
      const croppedBlob = await getCroppedImg(croppingUrl, croppedAreaPixels)
      const croppedUrl = URL.createObjectURL(croppedBlob)
      
      setHeroSlots(prev => ({
        ...prev,
        [croppingRole]: {
          ...prev[croppingRole],
          croppedUrl,
          croppedBlob,
          error: ''
        }
      }))
      
      setCroppingRole(null)
      setCroppingUrl(null)
    } catch (e) {
      setHeroSlots(prev => ({
        ...prev,
        [croppingRole]: {
          ...prev[croppingRole],
          error: 'Something went wrong reading that image. Please try again.'
        }
      }))
      setCroppingRole(null)
      setCroppingUrl(null)
    }
  }

  function addCategory() {
    const newCat = {
      id: `cat_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      name: '',
      image_url: '',
      link_target: ''
    }
    newCat.link_target = `#category-${newCat.id}`
    setForm(f => ({ ...f, categories: [...(f.categories || []), newCat] }))
  }

  function removeCategory(id) {
    setForm(f => ({ ...f, categories: (f.categories || []).filter(c => c.id !== id) }))
  }

  function updateCategoryField(id, field, value) {
    setForm(f => ({
      ...f,
      categories: (f.categories || []).map(c => {
        if (c.id === id) {
          const updated = { ...c, [field]: value }
          if (field === 'name' && (!c.link_target || c.link_target.startsWith('#category-'))) {
            updated.link_target = `#category-${slugify(value)}`
          }
          return updated
        }
        return c
      })
    }))
  }

  function moveCategory(index, direction) {
    const list = [...(form.categories || [])]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= list.length) return
    const temp = list[index]
    list[index] = list[targetIndex]
    list[targetIndex] = temp
    setForm(f => ({ ...f, categories: list }))
  }

  async function handleCategoryImageSelect(file, catId) {
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('This image is too large. Please upload something under 10MB.')
      return
    }
    
    setSaving(true)
    try {
      // 1. Immediately persist categories array to DB first
      const currentCategories = [...form.categories]
      const updatedStore = await api('PUT', `/selora-stores/${store.id}`, { ...form, categories: currentCategories })
      setStore(updatedStore)
      
      // 2. Upload the file
      const reader = new FileReader()
      const b64Promise = new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(file)
      })
      const b64 = await b64Promise
      
      const uploadRes = await api('POST', `/selora-stores/${store.id}/upload-category-image/${catId}`, {
        file_data: b64,
        content_type: file.type || 'image/jpeg'
      })
      
      // 3. Update categories with url and save again
      const nextCategories = currentCategories.map(c => c.id === catId ? { ...c, image_url: uploadRes.url } : c)
      setForm(f => ({ ...f, categories: nextCategories }))
      const finalStore = await api('PUT', `/selora-stores/${store.id}`, { ...form, categories: nextCategories })
      setStore(finalStore)
      
      setMsg({ type: 'ok', text: 'Category image uploaded successfully!' })
    } catch (err) {
      setMsg({ type: 'error', text: `Upload failed: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function saveSettings(e) {
    e.preventDefault()
    if (!store && !hasAllHeroImages) {
      return
    }
    if ((form.categories || []).length < 4) {
      setMsg({ type: 'error', text: 'You must configure at least 4 categories to save store settings.' })
      return
    }
    
    setSaving(true)
    setMsg(null)
    
    try {
      if (store) {
        // --- Store Update ---
        const u = await api('PUT', `/selora-stores/${store.id}`, form)
        setStore(u)
        
        let uploadErrorMsg = ''
        const rolesToUpload = ['main', 'left', 'right'].filter(r => heroSlots[r].croppedBlob)
        
        for (const role of rolesToUpload) {
          try {
            const blob = heroSlots[role].croppedBlob
            const reader = new FileReader()
            const b64Promise = new Promise((resolve) => {
              reader.onload = () => resolve(reader.result.split(',')[1])
              reader.readAsDataURL(blob)
            })
            const b64 = await b64Promise
            
            const res = await api('POST', `/selora-stores/${store.id}/upload-hero-image/${role}`, {
              file_data: b64,
              content_type: 'image/jpeg'
            })
            
            setHeroSlots(prev => ({
              ...prev,
              [role]: { ...prev[role], savedUrl: res.url, croppedBlob: null }
            }))
          } catch (err) {
            uploadErrorMsg += `Failed to upload ${role} hero image. `
          }
        }
        
        if (uploadErrorMsg) {
          setMsg({ type: 'error', text: `Store identity saved, but: ${uploadErrorMsg}` })
        } else {
          setMsg({ type: 'ok', text: 'Store settings saved!' })
        }
        
      } else {
        // --- Store Onboarding / Creation ---
        const c = await api('POST', '/selora-stores', form)
        
        const roles = ['main', 'left', 'right']
        let uploadFailedRole = null
        
        for (const role of roles) {
          try {
            const blob = heroSlots[role].croppedBlob
            const reader = new FileReader()
            const b64Promise = new Promise((resolve) => {
              reader.onload = () => resolve(reader.result.split(',')[1])
              reader.readAsDataURL(blob)
            })
            const b64 = await b64Promise
            
            const res = await api('POST', `/selora-stores/${c.id}/upload-hero-image/${role}`, {
              file_data: b64,
              content_type: 'image/jpeg'
            })
            
            setHeroSlots(prev => ({
              ...prev,
              [role]: { ...prev[role], savedUrl: res.url, croppedBlob: null }
            }))
          } catch (err) {
            uploadFailedRole = role
            break
          }
        }
        
        if (uploadFailedRole) {
          setStore(c)
          const roleLabel = uploadFailedRole === 'main' ? 'Main' : uploadFailedRole === 'left' ? 'Left' : 'Right'
          setMsg({
            type: 'error',
            text: `Your store was created, but ${roleLabel} image didn't upload. You can add it now or fix it later in Store Settings.`
          })
        } else {
          setStore(c)
          setMsg({ type: 'ok', text: 'Store created successfully!' })
          setTimeout(() => {
            window.location.href = `/store/${c.handle}`
          }, 1500)
        }
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
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
        input:focus, textarea:focus, select:focus { border-color: var(--g) !important; box-shadow: 0 0 0 3px var(--input-focus-shadow) !important; }
        .sb-prod-card:hover { box-shadow: var(--card-shadow-hover) !important; transform: translateY(-2px); }
        .sb-btn-primary:hover { background: var(--g2) !important; }
        .sb-btn-ghost:hover { background: var(--bg-2) !important; }
        @media (max-width: 640px) { .sb-row2 { grid-template-columns: 1fr !important; } }
      `}</style>
      <div style={S.inner}>
        <h1 style={S.pageTitle}>Store Builder</h1>
        <p style={S.pageSub}>
          {store
            ? <>Live at <a href={`/store/${store.handle}`} target="_blank" rel="noreferrer" style={{ color:'var(--g)', fontWeight:600, textDecoration:'none' }}>selora.fashion/store/{store.handle}</a> · <a href={`/store/${store.handle}`} target="_blank" rel="noreferrer" style={{ color:'var(--text-muted)', fontSize:'.8rem', textDecoration:'none' }}>Open storefront →</a></>
            : 'Set up your store in seconds. Your public storefront goes live instantly.'
          }
        </p>

        {msg && <div style={S.alert(msg.type)}>{msg.text}</div>}

        <div style={S.tabs}>
          {[['settings','Store Settings'],['products','Products']].map(([k,l]) => (
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
                <p style={S.handlePrev}>Link Preview: {storeUrl}</p>
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

              {/* Hero Stack Images Section */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <p style={{ ...S.cardTitle, marginBottom: '0.5rem' }}>Hero Stack Images *</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Selora's native storefront uses a premium 3-card stacked composition. Upload and crop exactly 3 images below.
                </p>

                {/* Inline Validation Warning for onboarding */}
                {!store && !hasAllHeroImages && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Upload and crop all 3 hero images to launch your store.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Slot 1: Main */}
                  <HeroImageSlot
                    role="main"
                    label="Main Image (Center)"
                    description="Front-facing card, straight-on focal point."
                    slotState={heroSlots.main}
                    onSelectFile={handleFileSelect}
                    onRemove={() => setHeroSlots(prev => ({ ...prev, main: { ...prev.main, url: '', croppedUrl: '', croppedBlob: null, error: '' } }))}
                  />
                  
                  {/* Slot 2: Left Accent */}
                  <HeroImageSlot
                    role="left"
                    label="Left Accent"
                    description="Rotated card placed behind-left."
                    slotState={heroSlots.left}
                    onSelectFile={handleFileSelect}
                    onRemove={() => setHeroSlots(prev => ({ ...prev, left: { ...prev.left, url: '', croppedUrl: '', croppedBlob: null, error: '' } }))}
                  />

                  {/* Slot 3: Right Accent */}
                  <HeroImageSlot
                    role="right"
                    label="Right Accent"
                    description="Rotated card placed behind-right."
                    slotState={heroSlots.right}
                    onSelectFile={handleFileSelect}
                    onRemove={() => setHeroSlots(prev => ({ ...prev, right: { ...prev.right, url: '', croppedUrl: '', croppedBlob: null, error: '' } }))}
                  />
                </div>

                {/* Live Stacked Preview */}
                {(heroSlots.main.croppedUrl || heroSlots.left.croppedUrl || heroSlots.right.croppedUrl) && (
                  <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', marginBottom: '2rem' }}>
                    <p style={{ ...S.label, marginBottom: '1rem', textAlign: 'center' }}>Live Hero Composition Preview</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', width: 140, height: 186 }}>
                              {/* Left Card */}
                        {heroSlots.left.croppedUrl && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 10,
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: 'rotate(-8deg) translateX(-40px) scale(0.92)',
                            transformOrigin: 'bottom center',
                            zIndex: 1,
                            background: '#1E3A2F'
                          }}>
                            <img src={heroSlots.left.croppedUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        {/* Right Card */}
                        {heroSlots.right.croppedUrl && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 10,
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: 'rotate(8deg) translateX(40px) scale(0.92)',
                            transformOrigin: 'bottom center',
                            zIndex: 1,
                            background: '#284E39'
                          }}>
                            <img src={heroSlots.right.croppedUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        {/* Main Card */}
                        {heroSlots.main.croppedUrl && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 10,
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(26,39,28,0.25)',
                            zIndex: 2,
                            background: '#EAE5D9'
                          }}>
                            <img src={heroSlots.main.croppedUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        {/* If none, empty stack preview */}
                        {!heroSlots.main.croppedUrl && !heroSlots.left.croppedUrl && !heroSlots.right.croppedUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', border: '2px dashed var(--border)', borderRadius: 10, color: 'var(--text-muted)' }}>
                            Empty
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Categories Section */}
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <p style={{ ...S.cardTitle, marginBottom: '0.5rem' }}>Shop by Category</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Manage store categories. Add as many as you'd like, drag or sort their display order, and optionally add images.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {(form.categories || []).map((cat, idx) => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      
                      {/* Reorder Up/Down */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(idx, -1)}
                          style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: 2, fontSize: '0.8rem' }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === (form.categories.length - 1)}
                          onClick={() => moveCategory(idx, 1)}
                          style={{ background: 'none', border: 'none', color: idx === (form.categories.length - 1) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === (form.categories.length - 1) ? 'not-allowed' : 'pointer', padding: 2, fontSize: '0.8rem' }}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Image Thumbnail / Overlay Upload */}
                      <div
                        onMouseEnter={e => { const overlay = e.currentTarget.querySelector('.cat-img-overlay'); if (overlay) overlay.style.opacity = '1' }}
                        onMouseLeave={e => { const overlay = e.currentTarget.querySelector('.cat-img-overlay'); if (overlay) overlay.style.opacity = '0' }}
                        style={{ position: 'relative', width: 50, height: 50, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        {cat.image_url ? (
                          <img src={cat.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          </span>
                        )}

                        {store ? (
                          <label className="cat-img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}>
                            UPLOAD
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: 'none' }}
                              onChange={e => { if (e.target.files?.[0]) handleCategoryImageSelect(e.target.files[0], cat.id) }}
                            />
                          </label>
                        ) : (
                          <div className="cat-img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.5rem', padding: '2px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                            Save first
                          </div>
                        )}
                      </div>

                      {/* Category Name */}
                      <div style={{ flex: 1 }}>
                        <input
                          style={{ ...S.input, padding: '0.5rem 0.75rem' }}
                          value={cat.name}
                          onChange={e => updateCategoryField(cat.id, 'name', e.target.value)}
                          placeholder="Category Name (e.g. Linen Dresses)"
                          required
                        />
                      </div>

                      {/* Browse Link Target */}
                      <div style={{ flex: 1 }}>
                        <input
                          style={{ ...S.input, padding: '0.5rem 0.75rem' }}
                          value={cat.link_target}
                          onChange={e => updateCategoryField(cat.id, 'link_target', e.target.value)}
                          placeholder="Link Target (e.g. #dresses)"
                          required
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1rem', cursor: 'pointer', padding: 4 }}
                        title="Delete"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>

                    </div>
                  ))}

                  {(form.categories || []).length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No categories added yet.</p>
                  )}

                  {(form.categories || []).length < 4 && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Please configure at least 4 categories (currently: {(form.categories || []).length}).
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addCategory}
                  className="sb-btn-ghost"
                  style={{ ...S.btnGhost, padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  + Add Category
                </button>
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
                    <input type="checkbox" id="sb_public" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public:e.target.checked }))} style={{ width:18, height:18, accentColor:'var(--g)', cursor:'pointer' }} />
                    <label htmlFor="sb_public" style={{ fontSize:'.875rem', cursor:'pointer', color:'var(--text-secondary)' }}>Make store publicly visible</label>
                  </div>
                </div>
              </div>
            </div>
            <button className="sb-btn-primary" style={S.btn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : (store ? 'Save Changes' : 'Create My Store')}
            </button>
          </form>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            {!store ? (
              <div style={S.card}>
                <p style={{ color:'var(--text-muted)', fontSize:'.9rem', margin:0 }}>Create your store in the Settings tab first, then come back to add products.</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                  <p style={{ color:'var(--text-muted)', fontSize:'.875rem', margin:0 }}>{products.length} product{products.length!==1?'s':''}</p>
                  <button className="sb-btn-primary" style={S.btn} onClick={() => { setEditProd(null); setShowModal(true) }}>+ Add Product</button>
                </div>

                {products.length === 0 ? (
                  <div style={S.empty}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.75rem', color: 'var(--text-muted)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </div>
                    <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'.4rem' }}>No products yet</p>
                    <p style={{ fontSize:'.875rem', margin:0 }}>Click "Add Product" to list your first item.</p>
                  </div>
                ) : (
                  <div style={S.grid}>
                    {products.map(p => (
                      <div key={p.id} style={S.prodCard} className="sb-prod-card">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.title} style={S.prodImg} />
                          : (
                            <div style={{ ...S.prodImg, display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--text-muted)' }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            </div>
                          )
                        }
                        <div style={S.prodBody}>
                          <p style={S.prodTitle}>{p.title}</p>
                          <p style={S.prodPrice}>{form.currency} {Number(p.price).toFixed(2)}</p>
                          <p style={S.prodMeta}>
                             {p.inventory} in stock · {p.is_active ? 'Active' : 'Inactive'}
                             <br />
                             Category: {form.categories?.find(c => c.id === p.category_id)?.name || 'Uncategorized'}
                          </p>
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
          categories={form.categories}
          onSave={onProductSaved}
          onClose={() => { setShowModal(false); setEditProd(null) }}
        />
      )}

      {croppingRole && (
        <div style={S.overlay} onClick={() => {
          setCroppingRole(null)
          setCroppingUrl(null)
        }}>
          <div style={{ ...S.modal, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ ...S.modalTitle, margin: 0 }}>Crop {croppingRole === 'main' ? 'Main' : croppingRole === 'left' ? 'Left' : 'Right'} Image</h3>
              <button
                type="button"
                onClick={() => {
                  setCroppingRole(null)
                  setCroppingUrl(null)
                }}
                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                X
              </button>
            </div>
            
            <div style={{ position: 'relative', width: '100%', height: 350, background: '#111', borderRadius: 8, overflow: 'hidden', marginBottom: '1.25rem' }}>
              <Cropper
                image={croppingUrl}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ ...S.label, marginBottom: '0.35rem' }}>Zoom: {zoom.toFixed(1)}x</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--g)' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="sb-btn-primary"
                style={{ ...S.btn, flex: 1 }}
                onClick={handleSaveCrop}
              >
                Save Crop
              </button>
              <button
                type="button"
                className="sb-btn-ghost"
                style={{ ...S.btnGhost, flex: 1 }}
                onClick={() => {
                  setCroppingRole(null)
                  setCroppingUrl(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeroImageSlot({ role, label, description, slotState, onSelectFile, onRemove }) {
  const fileRef = useRef()
  const [drag, setDrag] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
      
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.[0]) onSelectFile(e.dataTransfer.files[0], role) }}
        onClick={() => { if (!slotState.croppedUrl) fileRef.current.click() }}
        style={{
          border: `2px dashed ${drag ? 'var(--g)' : 'var(--border)'}`,
          borderRadius: 10,
          aspectRatio: '3/4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: slotState.croppedUrl ? 'default' : 'pointer',
          background: drag ? 'var(--bg-2)' : 'var(--bg-0)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.15s'
        }}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onSelectFile(e.target.files[0], role) }} />
        
        {slotState.croppedUrl ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img src={slotState.croppedUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              X
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Click or drag image</span>
          </div>
        )}
      </div>
      
      {slotState.error && (
        <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3 }}>
          {slotState.error}
        </span>
      )}
    </div>
  )
}

function ProductModal({ storeId, currency, initial, onSave, onClose, categories = [] }) {
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
    category_id: initial?.category_id || '',
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
        category_id: form.category_id || null,
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
          <div style={S.field}>
            <label style={S.label}>Category</label>
            {categories.length === 0 ? (
                <div style={{ ...S.input, background: 'var(--bg-2)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  No categories configured. Go to settings tab to create one.
                </div>
            ) : (
              <select style={S.select} value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}>
                <option value="">Uncategorized</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Unnamed Category'}</option>
                ))}
              </select>
            )}
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
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))} style={{ width:16,height:16,accentColor:'var(--g)',cursor:'pointer' }} />
                <span style={{ fontSize:'.875rem', color: 'var(--text-secondary)' }}>Active (visible in store)</span>
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
                ? <><div style={{ ...S.spinner, margin:'0 auto .5rem' }} /><p style={{ fontSize:'.85rem', color:'var(--text-muted)', margin:0 }}>Uploading...</p></>
                : <><p style={{ fontSize:'.9rem', color:'var(--text-muted)', margin:0 }}>Drop images here or click to browse</p><p style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:'.25rem', marginBottom:0 }}>Multiple images supported</p></>
              }
            </div>
            {form.images.length > 0 && (
              <div style={S.thumbRow}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={url} alt="" style={S.thumb} />
                    <button type="button" onClick={() => setForm(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))}
                      style={{ position:'absolute', top:-6, right:-6, background:'#DC2626', color:'#fff', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:11, lineHeight:'18px', padding:0 }}>X</button>
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
