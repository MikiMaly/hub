/**
 * Middleware — ochrana /private/* routes
 * Nepřihlášený uživatel je přesměrován na /login.html
 */
import { getSession } from './_auth.js';

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/private')) {
    const session = await getSession(request, env);

    if (!session) {
      const loginUrl = `/login?from=${encodeURIComponent(url.pathname)}`;
      return Response.redirect(new URL(loginUrl, request.url), 302);
    }

    if (url.pathname.startsWith('/private/invites') && session.role !== 'admin') {
      return Response.redirect(new URL('/private/', request.url), 302);
    }
  }

  return next();
}
