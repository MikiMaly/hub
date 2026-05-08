import { Navigate, Outlet, useLocation } from 'react-router-dom'

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

export default function PrivateRoute() {
  const location = useLocation()
  if (getCookie('hub_ui') !== '1') {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <Outlet />
}
