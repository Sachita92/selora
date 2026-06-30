import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../lib/AppContext'

/**
 * Legacy /signup route — now a shim.
 * Redirects to the homepage and opens the Sign Up modal.
 * Anyone with a bookmarked /signup URL still gets the modal experience.
 */
export default function Signup() {
  const { openAuthModal } = useAppContext()

  useEffect(() => {
    openAuthModal('signup')
  }, [openAuthModal])

  return <Navigate to="/" replace />
}