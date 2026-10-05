import { Navigate, createBrowserRouter } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PrivatePage from './pages/PrivatePage'
import UsersPage from './pages/UsersPage'
import AccountPage from './pages/AccountPage'
import { geckoRoutes } from '@gekos/pages/routes'
import PaymentsPage from './pages/PaymentsPage'
import ZalivkaPage from './pages/ZalivkaPage'
import SpiralaPage from './pages/SpiralaPage'
import BrandPage from './pages/BrandPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/brand', element: <BrandPage /> },
  { path: '/private', element: <PrivatePage /> },
  { path: '/private/users', element: <UsersPage /> },
  { path: '/private/account', element: <AccountPage /> },
  // staré záložky z doby invite kódů
  { path: '/private/invites', element: <Navigate to="/private/users" replace /> },
  { path: '/private/payments', element: <PaymentsPage /> },
  { path: '/private/zalivka', element: <ZalivkaPage /> },
  { path: '/private/spirala', element: <SpiralaPage /> },
  ...geckoRoutes,
])
