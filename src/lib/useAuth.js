import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { useAppContext } from './AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let justLoggedInFlag = false

export function useAuth() {
  const { user, login, logout: privyLogout, authenticated, ready, getAccessToken } = usePrivy()
  const { user: supabaseUser, setUser, setNameModal, setStores, setActiveStore, setIsLoggingOut } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const syncingRef = useRef(false)

  const loginWithFlag = useCallback(() => {
    justLoggedInFlag = true
    login()
  }, [login])

  // Extract Solana wallet address
  const walletAddress = useMemo(() => {
    if (!user) return null
    if (user.wallet?.chainType === 'solana') {
      return user.wallet.address
    }
    const solanaAccount = user.linkedAccounts?.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana'
    )
    return solanaAccount?.address || null
  }, [user])

  // Sync Privy authentication with our database and Supabase Auth
  const triggerSync = useCallback(async () => {
    if (!ready || !authenticated || !user) return
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("Could not retrieve Privy token")

      // Call backend to sync user / update wallet_address
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
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to sync authentication with backend")
      }

      const data = await res.json()
      if (data.session) {
        // Set Supabase session using access_token and refresh_token
        const { error: supabaseErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (supabaseErr) throw supabaseErr

        if (data.needs_display_name) {
          setNameModal({ open: true })
        } else {
          // Redirect to dashboard only if user is on dedicated auth pages, landing page, or just logged in
          const authPaths = ['/', '/login', '/signup']
          if (authPaths.includes(location.pathname) || justLoggedInFlag) {
            justLoggedInFlag = false
            navigate('/dashboard')
          }
        }
      }
    } catch (err) {
      console.error("Privy-Supabase auth sync failed:", err)
      setError(err.message || "Auth synchronization error")
    } finally {
      setSyncing(false)
      syncingRef.current = false
    }
  }, [ready, authenticated, user, walletAddress, location.pathname, navigate, setNameModal])

  // Sync Privy authentication automatically on load
  useEffect(() => {
    let active = true
    if (ready && authenticated && user && !supabaseUser) {
      triggerSync()
    }
    return () => {
      active = false
    }
  }, [ready, authenticated, user, supabaseUser, triggerSync])

  // Redirect to dashboard if session is already active and user visits public auth routes
  useEffect(() => {
    const authPaths = ['/', '/login', '/signup']
    if (supabaseUser && authPaths.includes(location.pathname)) {
      navigate('/dashboard')
    }
  }, [supabaseUser, location.pathname, navigate])

  // Reusable logout function that signs out of BOTH Privy and Supabase
  const logout = async () => {
    try {
      if (setIsLoggingOut) {
        setIsLoggingOut(true)
        setTimeout(() => setIsLoggingOut(false), 1500)
      }
      // 1. Force navigate to home page first so ProtectedRoutes unmount
      navigate('/')

      // 2. Log out of Privy
      try {
        await privyLogout()
      } catch (privyErr) {
        console.error("Privy logout failed:", privyErr)
      }
      
      // 3. Log out of Supabase
      try {
        await supabase.auth.signOut()
      } catch (supabaseErr) {
        console.error("Supabase logout failed:", supabaseErr)
      }
      
      // 4. Clear local states
      justLoggedInFlag = false
      setUser(null)
      if (setStores) setStores([])
      if (setActiveStore) setActiveStore(null)
      if (setNameModal) setNameModal({ open: false })
    } catch (e) {
      console.error("Error signing out:", e)
    }
  }

  return {
    user,
    login: loginWithFlag,
    logout,
    authenticated,
    ready,
    walletAddress,
    syncing,
    error,
    triggerSync,
  }
}
