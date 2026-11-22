import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth'
import { HomePage } from '@/features/home'
import { SettingsPage } from '@/features/settings'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { GuestRoute } from '@/components/shared/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/components/shared/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
