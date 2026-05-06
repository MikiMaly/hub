/**
 * Middleware — ochrana /private/* routes
 * Nepřihlášený uživatel je přesměrován na /login.html
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/private')) {
    const cookie = request.headers.get('Cookie') || '';
    const isAuth = cookie.split(';').some(c => c.trim() === 'hub_auth=1');

    if (!isAuth) {
      const loginUrl = `/login.html?from=${encodeURIComponent(url.pathname)}`;
      return Response.redirect(new URL(loginUrl, request.url), 302);
    }
  }

  return next();
}
