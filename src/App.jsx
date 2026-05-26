import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Selora from './Selora'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Selora />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  )
}