import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  // Remembers where they were headed (an invite link, say) for after they sign in.
  const from = location.pathname + location.search
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from }} />
}
