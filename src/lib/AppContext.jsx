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
  const [nameModal, setNameModal] = useState({ open: false })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const openAuthModal = useCallback((mode = 'login', plan = null) => setAuthModal({ open: true, mode, plan }), [])
  const closeAuthModal = useCallback(() => setAuthModal({ open: false, mode: 'login', plan: null }), [])
  const [products, setProducts] = useState([])
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [productsStats, setProductsStats] = useState({ revenue: 0, orders: 0 })
  const [orders, setOrders] = useState([])
  const [fetchingOrders, setFetchingOrders] = useState(false)
  // Ref to prevent duplicate auth subscriptions in React Strict Mode
  const authSubscriptionRef = useRef(null)
  const initialFetchTriggered = useRef(false)

  // Auth check & store fetch
  useEffect(() => {
    let mounted = true

    // Only subscribe once — guard against React Strict Mode double-invoke
    if (!authSubscriptionRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return
        if (!session) {
          setUser(null)
          setStores([])
          setActiveStore(null)
          setLoading(false)
        } else {
          setUser(session.user)
          // Deduplicate parallel initial fetch
          if (!initialFetchTriggered.current) {
            initialFetchTriggered.current = true
            fetchStores()
          } else if (event !== 'INITIAL_SESSION') {
            fetchStores()
          }
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

  const fetchStores = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }
      const token = session.access_token
      const res = await fetch(`${API_URL}/api/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.status === 401) {
        console.warn('Unauthorized request to stores API, clearing local store state.')
        setStores([])
        setActiveStore(null)
        setLoading(false)
        return
      }
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

  const fetchProducts = async (storeId, forceRefresh = false, silent = false) => {
    if (!storeId) return
    if (!silent) setFetchingProducts(true)
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
      if (!silent) setFetchingProducts(false)
    }
  }

  const fetchOrders = async (storeId, silent = false) => {
    if (!storeId) return
    if (!silent) setFetchingOrders(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session ? session.access_token : ''
      const url = `${API_URL}/api/stores/${storeId}/orders`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    } finally {
      if (!silent) setFetchingOrders(false)
    }
  }

  // Fetch products & orders automatically when activeStore changes
  useEffect(() => {
    if (activeStore) {
      fetchProducts(activeStore.id)
      fetchOrders(activeStore.id)
    } else {
      setProducts([])
      setProductsStats({ revenue: 0, orders: 0 })
      setOrders([])
    }
  }, [activeStore])

  // Real-time background polling (every 10s) to keep inventory levels and new orders updated on the dashboard
  useEffect(() => {
    if (!activeStore) return
    const interval = setInterval(() => {
      fetchProducts(activeStore.id, false, true)
      fetchOrders(activeStore.id, true)
    }, 10000)
    return () => clearInterval(interval)
  }, [activeStore])

  const logout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    setUser(null)
    setStores([])
    setActiveStore(null)
    setTimeout(() => setIsLoggingOut(false), 1500)
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
      orders, setOrders,
      fetchingOrders,
      fetchOrders,
      authModal, openAuthModal, closeAuthModal,
      nameModal, setNameModal,
      isLoggingOut, setIsLoggingOut
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
