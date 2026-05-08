import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import PrivateDashboard from './pages/private/Dashboard'
import Invites from './pages/private/Invites'
import Polymarket from './pages/private/Polymarket'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/private" element={<PrivateRoute />}>
          <Route index element={<PrivateDashboard />} />
          <Route path="invites" element={<Invites />} />
          <Route path="polymarket" element={<Polymarket />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
