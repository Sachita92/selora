import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AppContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [stores, setStores] = useState([])
  const [activeStore, setActiveStore] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auth check & store fetch
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        setUser(session.user)
        fetchStores(session.user.email)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setStores([])
        setActiveStore(null)
      } else {
        setUser(session.user)
        fetchStores(session.user.email)
      }
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchStores = async (email) => {
    try {
      const res = await fetch(`${API_URL}/api/stores?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setStores(data.stores || [])
      if (data.user) {
        // Merge DB user info (subscription plan, etc.) with Supabase auth user
        setUser(prev => ({ ...prev, ...data.user }))
      }
      if (data.stores && data.stores.length > 0) {
        // Only set active store if we don't have one, or if it's not in the list
        setActiveStore(prev => {
          if (!prev) return data.stores[0]
          const exists = data.stores.find(s => s.id === prev.id)
          return exists ? exists : data.stores[0]
        })
      } else {
        setActiveStore(null)
      }
    } catch (e) {
      console.error('Failed to fetch stores:', e)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setStores([])
    setActiveStore(null)
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      stores, setStores,
      activeStore, setActiveStore,
      loading, logout,
      fetchStores
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
