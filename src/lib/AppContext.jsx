import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { supabase } from './supabase'

const AppContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AppProvider({ children }) {
  const { user: privyUser, authenticated, ready, getAccessToken } = usePrivy()
  const [authMessage, setAuthMessage] = useState(null)
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
  const attemptSilentSyncRef = useRef(null)
  const isLoggingOutRef = useRef(isLoggingOut)
  const syncAttemptsRef = useRef(0)
  const lastSyncFailureTimeRef = useRef(0)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    isLoggingOutRef.current = isLoggingOut
  }, [isLoggingOut])

  const getWalletAddress = useCallback((u) => {
    if (!u) return null
    if (u.wallet?.chainType === 'solana') {
      return u.wallet.address
    }
    const solanaAccount = u.linkedAccounts?.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana'
    )
    return solanaAccount?.address || null
  }, [])

  const handleSignOutAndPrompt = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (_) {}
    setUser(null)
    setStores([])
    setActiveStore(null)
    setAuthMessage("Please reconnect your wallet to continue")
    openAuthModal('login')
  }, [openAuthModal])

  const attemptSilentSync = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    if (syncAttemptsRef.current >= 3) {
      console.warn("Max silent sync attempts reached. Prompting for reconnect.")
      handleSignOutAndPrompt()
      isSyncingRef.current = false
      return
    }

    const timeSinceLastFailure = Date.now() - lastSyncFailureTimeRef.current
    if (timeSinceLastFailure < 10000) {
      console.warn("Prevented auth sync retry loop. Cooldown active.")
      isSyncingRef.current = false
      return
    }

    if (!ready || !authenticated || !privyUser) {
      handleSignOutAndPrompt()
      isSyncingRef.current = false
      return
    }
    try {
      console.log(`Attempting silent token recovery sync via Privy (Attempt ${syncAttemptsRef.current + 1})...`)
      syncAttemptsRef.current++
      const token = await getAccessToken()
      if (!token) throw new Error("Could not retrieve Privy token")

      // Sign out of Supabase first to clear stale/corrupted token data
      try {
        await supabase.auth.signOut()
      } catch (_) {}

      const walletAddress = getWalletAddress(privyUser)

      const res = await fetch(`${API_URL}/api/auth/privy-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privy_token: token,
          wallet_address: walletAddress,
        }),
      })

      if (!res.ok) {
        throw new Error("Sync failed")
      }

      const data = await res.json()
      if (data.session) {
        const { error: supabaseErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (supabaseErr) throw supabaseErr

        console.log("Silent recovery sync successful, Supabase session restored!")
        syncAttemptsRef.current = 0
        fetchStores()
      } else {
        throw new Error("No session returned")
      }
    } catch (err) {
      console.error("Silent recovery sync failed:", err)
      lastSyncFailureTimeRef.current = Date.now()
      handleSignOutAndPrompt()
    } finally {
      isSyncingRef.current = false
    }
  }, [ready, authenticated, privyUser, getAccessToken, getWalletAddress, handleSignOutAndPrompt])

  useEffect(() => {
    attemptSilentSyncRef.current = attemptSilentSync
  }, [attemptSilentSync])

  // Auth check & store fetch
  useEffect(() => {
    let mounted = true

    // Only subscribe once — guard against React Strict Mode double-invoke
    if (!authSubscriptionRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return
        if (!session) {
          setUser(null)
          setStores([])
          setActiveStore(null)
          setLoading(false)

          // Detect if Supabase session failed to refresh unexpectedly while Privy is still authenticated
          if (!isLoggingOutRef.current && ready && authenticated) {
            console.log("Session lost/expired unexpectedly while Privy is authenticated. Triggering silent sync...")
            if (attemptSilentSyncRef.current) {
              await attemptSilentSyncRef.current()
            }
          }
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
  }, [ready, authenticated])

  const fetchStores = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn("fetchStores session error (ignoring if expected refresh failure):", error.message)
        if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
          if (attemptSilentSyncRef.current) {
            await attemptSilentSyncRef.current()
          }
          return
        }
      }
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
  }, [])

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
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn("fetchOrders session error:", error.message)
      }
      const token = session ? session.access_token : ''
      if (!token) return
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
      isLoggingOut, setIsLoggingOut,
      authMessage, setAuthMessage
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
