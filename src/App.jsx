import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { ChatProvider } from './lib/ChatContext'
import { AppProvider, useAppContext } from './lib/AppContext'
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
import FeaturesPage   from './pages/FeaturesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import PricingPage    from './pages/PricingPage'

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

            {/* Protected — wrapped in SidebarLayout */}
            <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
              <Route path="/connect"   element={<Connect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products"  element={<Products />} />
              <Route path="/settings"  element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AppProvider>
  )
}