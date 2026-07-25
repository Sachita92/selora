import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { ChatProvider } from './lib/ChatContext'
import { AppProvider, useAppContext } from './lib/AppContext'
import { usePrivy } from '@privy-io/react-auth'
import ChatWidget from './components/ChatWidget'
import SidebarLayout from './components/SidebarLayout'
import AuthModal from './components/AuthModal'
import NameCollectionModal from './components/NameCollectionModal'
import PrivyProviderWrapper from './components/PrivyProviderWrapper'

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
import StorefrontOrders from './pages/StorefrontOrders'
import Reports        from './pages/Reports'
import Profile        from './pages/Profile'
import Orders         from './pages/Orders'

// ─── Full-page loading spinner shown while auth state is resolving ───────────
function SyncingSpinner({ label = 'Reconnecting\u2026' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
      background: 'var(--bg, #F8FAF8)', fontFamily: 'Inter, sans-serif', zIndex: 9999,
    }}>
      <style>{`
        @keyframes _pr-spin { to { transform: rotate(360deg) } }
        ._pr-ring {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3px solid var(--border, #E4EBE5);
          border-top-color: var(--g, #5A8A67);
          animation: _pr-spin .75s linear infinite;
        }
      `}</style>
      <div className="_pr-ring" />
      <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted, #6B7280)', fontWeight: 500 }}>
        {label}
      </p>
    </div>
  )
}

// ─── Protected route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading, openAuthModal, isLoggingOut } = useAppContext()
  const { authenticated, ready } = usePrivy()

  // True while Privy SDK is booting or AppContext first fetchStores is in-flight.
  const isInitialLoad = !ready || loading

  // True when Privy is still authenticated but the Supabase session has lapsed
  // and the silent-sync is in the process of restoring it.
  const isMidSync = ready && authenticated && !user

  useEffect(() => {
    // Only open the auth modal when we are definitively not authenticated anywhere.
    if (!isInitialLoad && !isMidSync && !user && !isLoggingOut) {
      openAuthModal('login')
    }
  }, [isInitialLoad, isMidSync, user, openAuthModal, isLoggingOut])

  // Show a branded spinner instead of a blank white page while loading / syncing.
  if (isInitialLoad) return <SyncingSpinner label="Loading\u2026" />
  if (isMidSync)     return <SyncingSpinner label="Reconnecting session\u2026" />
  if (!user) return <Navigate to="/" replace />
  return children
}

// ─── Auth shim: redirect old bookmarked /login and /signup to / with modal ───
function AuthShim({ mode }) {
  const { openAuthModal } = useAppContext()
  useEffect(() => { openAuthModal(mode) }, [mode, openAuthModal])
  return <Navigate to="/" replace />
}


// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <PrivyProviderWrapper>
      <AppProvider>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/"        element={<Selora />} />
              <Route path="/login"   element={<AuthShim mode="login" />} />
              <Route path="/signup"  element={<AuthShim mode="signup" />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms"   element={<Terms />} />
              <Route path="/support" element={<Support />} />
              <Route path="/demo"         element={<BookDemo />} />
              <Route path="/features"     element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/pricing"      element={<PricingPage />} />
              <Route path="/store/:handle" element={<Storefront key="sf-home" />} />
              <Route path="/store/:handle/product/:productId" element={<Storefront key="sf-pdp" />} />
              <Route path="/store/:handle/category/:categoryId" element={<Storefront key="sf-cat" />} />
              <Route path="/store/:handle/orders" element={<StorefrontOrders />} />

              {/* Protected — standalone (own header/footer) */}
              <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />

              {/* Protected — wrapped in SidebarLayout */}
              <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
                <Route path="/dashboard"     element={<Dashboard />} />
                <Route path="/products"      element={<Products />} />
                <Route path="/products/:id"  element={<ProductDetail />} />
                <Route path="/orders"        element={<Orders />} />
                <Route path="/settings"      element={<Settings />} />
                <Route path="/reports"       element={<Reports />} />
                <Route path="/store-builder" element={<StoreBuilder />} />
                <Route path="/profile"       element={<Profile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <AuthModal />
            <NameCollectionModal />
            <GlobalChatWidget />
          </BrowserRouter>
        </ChatProvider>
      </AppProvider>
    </PrivyProviderWrapper>
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

  // Don't show on authenticated dashboard routes — the right panel replaces it there
  const dashboardPaths = ['/dashboard', '/products', '/settings', '/reports', '/store-builder']
  if (dashboardPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) return null

  const storeId = activeStore?.id || demoStoreId
  if (!storeId) return null

  return <ChatWidget storeId={storeId} isLandingPage={!activeStore} />
}