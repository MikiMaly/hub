/**
 * Middleware — ochrana /private/* routes
 * Nepřihlášený uživatel je přesměrován na /login.html
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/private')) {
    const cookie = request.headers.get('Cookie') || '';
    const cookies = cookie.split(';').map(c => c.trim());
    const isAuth = cookies.some(c => c === 'hub_auth=1');
    const isAdmin = cookies.some(c => c === 'hub_admin=1');

    if (!isAuth) {
      const loginUrl = `/login.html?from=${encodeURIComponent(url.pathname)}`;
      return Response.redirect(new URL(loginUrl, request.url), 302);
    }

    if (url.pathname.startsWith('/private/invites') && !isAdmin) {
      return Response.redirect(new URL('/private/', request.url), 302);
    }
  }

  return next();
}
