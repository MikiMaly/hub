/**
 * POST /api/login
 * Body: { password } — admin heslo
 *    nebo { code }     — invite kód
 */
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { password, code } = body;
  const maxAge = 60 * 60 * 24 * 30;
  const secure = 'HttpOnly; Secure; SameSite=Lax';
  let authed = false;

  if (password) {
    const expected = env.HUB_PASSWORD;
    if (!expected) {
      return new Response(JSON.stringify({ error: 'Server misconfigured — set HUB_PASSWORD' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
    authed = password === expected;
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

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `hub_auth=1; Path=/; Max-Age=${maxAge}; ${secure}`);
  headers.append('Set-Cookie', `hub_ui=1; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
