import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppContext } from '../lib/AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NameCollectionModal() {
  const navigate = useNavigate()
  const { nameModal, setNameModal, setUser } = useAppContext()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!nameModal?.open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Display name is required')
      return
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError('Display name must be between 2 and 50 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Get the current Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication session not found. Please log in again.')
      }

      // 2. Call PATCH /api/auth/profile
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ display_name: trimmedName })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to update profile')
      }

      // 3. Update the user state locally
      setUser(prev => ({
        ...prev,
        display_name: trimmedName,
        user_metadata: {
          ...prev?.user_metadata,
          display_name: trimmedName,
          name: trimmedName
        }
      }))

      // 4. Close the modal and navigate to dashboard
      setNameModal({ open: false })
      navigate('/dashboard')
    } catch (err) {
      console.error('Error setting display name:', err)
      setError(err.message || 'An error occurred while saving your name')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 20, 12, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-1, #ffffff)',
        border: '1px solid var(--border, #E4EBE5)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
        borderRadius: 16,
        padding: '2.5rem',
        maxWidth: 420,
        width: '90%',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
        <h2 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '1.6rem',
          fontWeight: 500,
          color: 'var(--text-primary, #1A271C)',
          margin: '0 0 0.5rem 0'
        }}>
          What should we call you?
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted, #7B907D)',
          lineHeight: 1.5,
          margin: '0 0 1.8rem 0',
          fontWeight: 300
        }}>
          Please enter your name to customize your Selora assistant and set up your dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '1.2rem', textAlign: 'left' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Your name or brand"
              autoFocus
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                border: error ? '1px solid #DC2626' : '1px solid var(--border, #E4EBE5)',
                borderRadius: 8,
                fontSize: '0.9rem',
                outline: 'none',
                background: 'var(--bg-2, #FAFAF8)',
                color: 'var(--text-primary, #1A271C)',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
                transition: 'border 0.2s, background 0.2s'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--inventory-empty-bg, #FEF2F2)',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.8rem',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              marginBottom: '1.2rem',
              textAlign: 'left',
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--g, #5F8D76)',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving name...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
