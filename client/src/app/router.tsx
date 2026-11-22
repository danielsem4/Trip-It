import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth'
import { HomePage } from '@/features/home'
import {
  TRIP_SECTIONS,
  TripHomePage,
  TripLayout,
  TripSectionPlaceholderPage,
} from '@/features/trips'
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
          {
            path: '/trips/:id',
            element: <TripLayout />,
            children: [
              { index: true, element: <TripHomePage /> },
              ...TRIP_SECTIONS.map(({ key }) => ({
                path: key,
                element: <TripSectionPlaceholderPage section={key} />,
              })),
              { path: '*', element: <NotFoundPage /> },
            ],
          },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
