import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { useAppContext } from './AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let justLoggedInFlag = false

export function setJustLoggedIn(flag = true) {
  justLoggedInFlag = flag
}

export function useAuth() {
  const { user, login, logout: privyLogout, authenticated, ready, getAccessToken } = usePrivy()
  const { user: supabaseUser, setUser, setNameModal, setStores, setActiveStore, setIsLoggingOut, triggerSync } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const syncingRef = useRef(false)

  const loginWithFlag = useCallback(() => {
    console.log('[Auth Flow] User initiated Privy login/signup')
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

  // Redirect to dashboard whenever session becomes active after login/signup action or on dedicated auth route
  useEffect(() => {
    const authPaths = ['/login', '/signup']
    if (supabaseUser && (justLoggedInFlag || authPaths.includes(location.pathname))) {
      console.log(`[Auth Flow] Session active for ${supabaseUser.email || supabaseUser.id}. Navigating to /dashboard (justLoggedIn: ${justLoggedInFlag}, path: ${location.pathname})`)
      justLoggedInFlag = false
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
