import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { supabase } from './supabase'

const AppContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Retrieve Privy access token with up to 3 retries and a 5s timeout on each try
const getAccessTokenWithRetry = async (getAccessTokenFn, retries = 3, delayMs = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Auth] Retrieving Privy access token (attempt ${i + 1}/${retries})...`)
      const tokenPromise = getAccessTokenFn()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("getAccessToken call timed out")), 5000)
      )
      const token = await Promise.race([tokenPromise, timeoutPromise])
      if (token) {
        return token
      }
    } catch (err) {
      console.warn(`[Auth] getAccessToken attempt ${i + 1}/${retries} failed:`, err.message || err)
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
  }
  throw new Error("Could not retrieve Privy token after multiple attempts")
}

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
  const [connectStoreModalOpen, setConnectStoreModalOpen] = useState(false)
  const openConnectStoreModal = useCallback(() => setConnectStoreModalOpen(true), [])
  const closeConnectStoreModal = useCallback(() => setConnectStoreModalOpen(false), [])
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
      const token = await getAccessTokenWithRetry(getAccessToken)
      if (!token) throw new Error("Could not retrieve Privy token")

      // Decode and log JWT expiration/claims client-side
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          const now = Math.floor(Date.now() / 1000)
          if (import.meta.env.DEV) {
            console.log("[Auth] Client-decoded Privy Token Payload:", payload)
            console.log(`[Auth] Current time: ${now}, Token exp: ${payload.exp}, Diff: ${payload.exp - now}s (${payload.exp > now ? "Valid" : "EXPIRED"})`)
            console.log(`[Auth] Time since issued (iat): ${now - payload.iat}s`)
          }
        } else {
          console.warn("[Auth] Token does not have 3 parts: [Redacted]")
        }
      } catch (decodeErr) {
        console.error("[Auth] Failed to decode Privy JWT client-side:", decodeErr?.message || 'Unknown error')
      }

      const walletAddress = getWalletAddress(privyUser)

      const payload = {
        privy_token: token ? (token.substring(0, 15) + "...") : null,
        wallet_address: walletAddress,
      }
      if (import.meta.env.DEV) {
        console.log("[Auth] Sending privy-sync request with payload:", payload)
      }

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

      // Clone the response so we can log its text/body without consuming the stream
      try {
        const resClone = res.clone()
        const rawBody = await resClone.text()
        if (import.meta.env.DEV) {
          console.log(`[Auth] Received privy-sync response (status: ${res.status}):`, rawBody)
        }
      } catch (cloneErr) {
        console.error("[Auth] Failed to clone/read privy-sync response:", cloneErr?.message || 'Unknown error')
      }

      if (!res.ok) {
        throw new Error(`Sync failed with HTTP status ${res.status}`)
      }

      const data = await res.json()
      if (data.session) {
        if (import.meta.env.DEV) {
          console.log("[Auth] Invoking supabase.auth.setSession()...")
        }

        // 5-second timeout wrapper to prevent setSession from hanging indefinitely
        const setSessionPromise = supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("supabase.auth.setSession timed out after 5 seconds")), 5000)
        )

        const { data: sessionData, error: supabaseErr } = await Promise.race([
          setSessionPromise,
          timeoutPromise
        ])

        if (supabaseErr) throw supabaseErr

        if (import.meta.env.DEV) {
          console.log("[Auth] supabase.auth.setSession completed successfully.")
        }

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
      console.error(`[Auth] Silent sync FAILED (attempt ${syncAttemptsRef.current}/3) with error:`, err?.message || 'Unknown error')
      lastSyncFailureTimeRef.current = Date.now()
      handleSignOutAndPrompt()
    } finally {
      isSyncingRef.current = false
    }
  }, [ready, authenticated, privyUser, getAccessToken, getWalletAddress, handleSignOutAndPrompt])

  useEffect(() => {
    attemptSilentSyncRef.current = attemptSilentSync
  }, [attemptSilentSync])

  // Trigger silent sync automatically on startup once Privy resolves to ready & authenticated
  useEffect(() => {
    if (ready && authenticated && !user && !isLoggingOut) {
      console.log("[Auth] Privy resolved to ready and authenticated, but no Supabase session exists. Initiating silent sync...")
      attemptSilentSync()
    }
  }, [ready, authenticated, user, isLoggingOut, attemptSilentSync])

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
              setTimeout(() => {
                attemptSilentSyncRef.current()
              }, 0)
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
      authMessage, setAuthMessage,
      triggerSync: attemptSilentSync,
      connectStoreModalOpen, openConnectStoreModal, closeConnectStoreModal
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
