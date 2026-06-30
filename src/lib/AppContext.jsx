import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

const AppContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [stores, setStores] = useState([])
  const [activeStore, setActiveStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', plan: null })
  const openAuthModal = useCallback((mode = 'login', plan = null) => setAuthModal({ open: true, mode, plan }), [])
  const closeAuthModal = useCallback(() => setAuthModal({ open: false, mode: 'login', plan: null }), [])
  const [products, setProducts] = useState([])
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [productsStats, setProductsStats] = useState({ revenue: 0, orders: 0 })
  // Ref to prevent duplicate auth subscriptions in React Strict Mode
  const authSubscriptionRef = useRef(null)

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

    // Only subscribe once — guard against React Strict Mode double-invoke
    if (!authSubscriptionRef.current) {
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
      authSubscriptionRef.current = subscription
    }

    return () => {
      mounted = false
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe()
        authSubscriptionRef.current = null
      }
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

  const fetchProducts = async (storeId, forceRefresh = false) => {
    if (!storeId) return
    setFetchingProducts(true)
    try {
      const url = `${API_URL}/api/stores/${storeId}/products${forceRefresh ? '?force_refresh=true' : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setProducts(data.products || [])
      setProductsStats({
        revenue: data.total_revenue_30d || 0,
        orders: data.total_orders_30d || 0
      })
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setFetchingProducts(false)
    }
  }

  // Fetch products automatically in the background when activeStore changes
  useEffect(() => {
    if (activeStore) {
      fetchProducts(activeStore.id)
    } else {
      setProducts([])
      setProductsStats({ revenue: 0, orders: 0 })
    }
  }, [activeStore])

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
      fetchStores,
      products, setProducts,
      fetchingProducts,
      productsStats, setProductsStats,
      fetchProducts,
      authModal, openAuthModal, closeAuthModal
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
