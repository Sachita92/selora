import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'

/**
 * Legacy /login route — now a shim.
 * Redirects to the homepage and opens the Sign In modal.
 * Anyone with a bookmarked /login URL still gets the modal experience.
 */
export default function Login() {
  const { openAuthModal } = useAppContext()

  useEffect(() => {
    openAuthModal('login')
  }, [openAuthModal])

  return <Navigate to="/" replace />
}