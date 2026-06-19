import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { ChatProvider } from './lib/ChatContext'
import { AppProvider, useAppContext } from './lib/AppContext'
import ChatWidget from './components/ChatWidget'
import SidebarLayout from './components/SidebarLayout'

import Selora        from './Selora'
import Login         from './pages/Login'
import Signup        from './pages/Signup'
import Connect       from './pages/Connect'
import Dashboard     from './pages/Dashboard'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms         from './pages/Terms'
import Support       from './pages/Support'
import BookDemo      from './pages/BookDemo'
import Products      from './pages/Products'
import Settings      from './pages/Settings'
import ProductDetail from './pages/ProductDetail'
import FeaturesPage   from './pages/FeaturesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import PricingPage    from './pages/PricingPage'
import StoreBuilder   from './pages/StoreBuilder'
import Storefront     from './pages/Storefront'

// ─── Protected route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAppContext()

  if (loading) return null // still loading
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"        element={<Selora />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms"   element={<Terms />} />
            <Route path="/support" element={<Support />} />
            <Route path="/demo"         element={<BookDemo />} />
            <Route path="/features"     element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing"      element={<PricingPage />} />
            <Route path="/store/:handle" element={<Storefront />} />

            {/* Protected — standalone (own header/footer) */}
            <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />

            {/* Protected — wrapped in SidebarLayout */}
            <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/products"      element={<Products />} />
              <Route path="/products/:id"  element={<ProductDetail />} />
              <Route path="/settings"      element={<Settings />} />
              <Route path="/store-builder" element={<StoreBuilder />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalChatWidget />
        </BrowserRouter>
      </ChatProvider>
    </AppProvider>
  )
}

// ─── Global Chat Widget Wrapper ────────────────────────────────────────────────
function GlobalChatWidget() {
  const location = useLocation()
  const { activeStore } = useAppContext()
  const [demoStoreId, setDemoStoreId] = useState(null)

  useEffect(() => {
    if (!activeStore) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      fetch(`${API_URL}/api/public/stats`)
        .then(r => r.json())
        .then(d => {
          if (d?.demo_store_id) {
            setDemoStoreId(d.demo_store_id)
          }
        })
        .catch(e => console.error("Error loading public stats:", e))
    }
  }, [activeStore])

  // Don't show on public customer-facing storefronts
  if (location.pathname.startsWith('/store/')) return null

  const storeId = activeStore?.id || demoStoreId
  if (!storeId) return null

  return <ChatWidget storeId={storeId} isLandingPage={!activeStore} />
}