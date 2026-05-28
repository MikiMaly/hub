import { createBrowserRouter } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PrivatePage from './pages/PrivatePage'
import InvitesPage from './pages/InvitesPage'
import { geckoRoutes } from '@gekos/pages/routes'
import PaymentsPage from './pages/PaymentsPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/private', element: <PrivatePage /> },
  { path: '/private/invites', element: <InvitesPage /> },
  { path: '/private/payments', element: <PaymentsPage /> },
  ...geckoRoutes,
])
