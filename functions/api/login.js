/**
 * POST /api/login
 * Body: { password } — admin heslo
 *    nebo { code }     — invite kód
 */
import { signSession, SESSION_COOKIE } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { password, code } = body;
  const maxAge = 60 * 60 * 24 * 30;
  let authed = false;

  // HUB_PASSWORD slouží i jako podpisový klíč session cookie
  if (!env.HUB_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Server misconfigured — set HUB_PASSWORD' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (password) {
    authed = password === env.HUB_PASSWORD;
  } else if (code) {
    if (!env.INVITES) {
      return new Response(JSON.stringify({ error: 'Server misconfigured — KV not bound' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
    const invite = await env.INVITES.get(`invite:${code.trim().toUpperCase()}`);
    authed = invite !== null;
  }

  if (!authed) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const role = password ? 'admin' : 'user';
  const session = await signSession(role, env.HUB_PASSWORD, maxAge);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `${SESSION_COOKIE}=${session}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`);
  headers.append('Set-Cookie', `hub_ui=1; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`);
  if (role === 'admin') {
    headers.append('Set-Cookie', `hub_admin_ui=1; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`);
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
