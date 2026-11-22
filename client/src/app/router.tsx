import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth'
import { HomePage } from '@/features/home'
import { InvitePage, TripLayout } from '@/features/trips'
import { TripOverviewPage } from '@/features/tripOverview'
import { FlightsPage } from '@/features/flights'
import { StaysPage } from '@/features/stays'
import { TransportPage } from '@/features/transport'
import { NewSectionPage, PlacesPage } from '@/features/places'
import { BudgetPage } from '@/features/budget'
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
      { path: '/invite/:token', element: <InvitePage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          {
            path: '/trips/:id',
            element: <TripLayout />,
            children: [
              { index: true, element: <TripOverviewPage /> },
              { path: 'flights', element: <FlightsPage /> },
              { path: 'stays', element: <StaysPage /> },
              { path: 'budget', element: <BudgetPage /> },
              { path: 'attractions', element: <PlacesPage kind="ATTRACTIONS" /> },
              { path: 'restaurants', element: <PlacesPage kind="RESTAURANTS" /> },
              { path: 'transport', element: <TransportPage /> },
              { path: 'sections/new', element: <NewSectionPage /> },
              { path: 'sections/:sectionId', element: <PlacesPage /> },
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
