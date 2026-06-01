import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthContext, useAuthContext } from './context/AuthContext'
import StorePage from './pages/Store'
import LoginPage from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import StaffManagement from './pages/admin/StaffManagement'
import AdminSettings from './pages/admin/Settings'
import StoreDashboard from './pages/staff/StoreDashboard'
import ChangePassword from './pages/ChangePassword'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, profile, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="spinner" />
      </div>
    )
  }

  if (!user || !profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />
  if (profile.must_change_password && !window.location.pathname.startsWith('/change-password')) {
    return <Navigate to="/change-password" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><StoreDashboard /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><ChangePassword /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffManagement /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const auth = useAuth()
  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <AppRoutes />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
