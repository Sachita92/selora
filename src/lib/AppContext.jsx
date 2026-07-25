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
  // Ref to the fallback loading timer so fetchStores can cancel it early.
  const loadingTimeoutRef = useRef(null)
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
  // Keep latest Privy values accessible inside the stable onAuthStateChange closure.
  const readyRef = useRef(ready)
  const authenticatedRef = useRef(authenticated)
  useEffect(() => { readyRef.current = ready }, [ready])
  useEffect(() => { authenticatedRef.current = authenticated }, [authenticated])

  // Fallback: if the backend never responds (Render cold-start can take 10-30s),
  // force-clear loading after 10s so unauthenticated visitors see the nav.
  // Rules:
  //   • Gated on !authenticated — if Privy says the user is logged in, we're
  //     mid-sync; skip the force-clear and let the real fetch finish.
  //   • fetchStores cancels this timer early via loadingTimeoutRef when it
  //     resolves, so there's no stale setState race.
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (!authenticated) {
        // Safe to force-clear: visitor is genuinely not logged in.
        setLoading(false)
      }
      // If authenticated, the silent-sync will call fetchStores which
      // clears loading in its finally block — don't interfere.
    }, 10000)
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    }
  }, [authenticated])

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
      console.warn(
        `[Auth] Silent sync FAILED after 3 attempts — giving up and prompting for re-login.`
      )
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
      const attempt = syncAttemptsRef.current + 1
      console.log(`[Auth] Silent token recovery attempt ${attempt}/3 via Privy...`)
      syncAttemptsRef.current++
      const token = await getAccessToken()
      if (!token) throw new Error("Could not retrieve Privy token")

      // NOTE: Do NOT call supabase.auth.signOut() here.
      // Doing so fires onAuthStateChange(null) which sets mounted=false in the
      // subscription closure, causing the subsequent setSession() callback to be
      // silently dropped — leaving user stuck on the spinner forever.

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
        // setSession() returns { data: { session, user }, error } in Supabase v2.
        // We read the user directly from the return value rather than waiting for
        // onAuthStateChange, which may not fire if the subscription was rebuilt.
        const { data: sessionData, error: supabaseErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (supabaseErr) throw supabaseErr

        // Immediately update user so isMidSync resolves and ProtectedRoute
        // re-renders the dashboard without waiting for any secondary callbacks.
        const restoredUser = sessionData?.user ?? data.session.user ?? null
        if (restoredUser) {
          setUser(restoredUser)
        }

        console.log(`[Auth] Silent sync SUCCESS (attempt ${syncAttemptsRef.current}/3) — Supabase session restored.`)
        syncAttemptsRef.current = 0
        // Refresh stores/profile data in the background (non-blocking).
        fetchStores()
      } else {
        throw new Error("No session returned")
      }
    } catch (err) {
      console.error(`[Auth] Silent sync FAILED (attempt ${syncAttemptsRef.current}/3):`, err.message)
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
          if (!isLoggingOutRef.current && readyRef.current && authenticatedRef.current) {
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
  // Run once on mount. The subscription must never be torn down during a
  // sync cycle, so the dependency array is intentionally empty.
  // `ready` and `authenticated` are read via closure-captured refs where needed.
  }, [])

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
      // Deduplicate stores by ID (defensive guard against backend returning
      // the same store twice — e.g. skeleton row in stores + selora_stores merge)
      const seen = new Set()
      const uniqueStores = (data.stores || []).filter(s => {
        if (seen.has(s.id)) return false
        seen.add(s.id)
        return true
      })
      setStores(uniqueStores)
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
      // Cancel the fallback loading timeout — real data (or a real error) has
      // arrived, so we don't want the timer firing a redundant setLoading(false)
      // after the fact and potentially confusing state.
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
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
