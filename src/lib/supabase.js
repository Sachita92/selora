const isExpectedAuthError = (args) => {
  return args.some(arg => {
    if (!arg) return false
    if (typeof arg === 'object') {
      const name = arg.name || arg.constructor?.name
      const msg = arg.message || ''
      const status = arg.status
      if (name === 'AuthApiError' && (msg.includes('Invalid Refresh Token') || msg.includes('Refresh Token Not Found') || status === 400)) {
        return true
      }
    }
    const str = String(arg)
    if (str.includes('AuthApiError') && (str.includes('Invalid Refresh Token') || str.includes('Refresh Token Not Found'))) {
      return true
    }
    return false
  })
}

const rawError = console.error
console.error = (...args) => {
  if (isExpectedAuthError(args)) {
    console.debug('[Auth Session Info] Handled expected token expiry')
    return
  }
  rawError.apply(console, args)
}

const rawWarn = console.warn
console.warn = (...args) => {
  if (isExpectedAuthError(args)) {
    return
  }
  rawWarn.apply(console, args)
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Disable Supabase's internal auto-refresh timer. When Chrome suspends an
    // inactive tab, this timer fires stale refresh requests on wake, causing
    // "Invalid Refresh Token: Already Used" loops. We take over 100% of token
    // refresh responsibility via the visibilitychange handler and the proactive
    // periodic interval in AppContext.jsx.
    autoRefreshToken: false,
    // Keep the session in localStorage so it survives page reloads.
    persistSession: true,
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn()
    },
  },
})