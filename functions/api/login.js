/**
 * POST /api/login
 * Body: { password: string }
 * Nastaví HttpOnly cookie hub_auth=1 pokud heslo sedí.
 * Heslo se nastavuje jako Cloudflare Pages secret: HUB_PASSWORD
 */
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { password } = body;
  const expected = env.HUB_PASSWORD;

  if (!expected) {
    return new Response('Server misconfigured — set HUB_PASSWORD secret', { status: 500 });
  }

  if (password !== expected) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const maxAge = 60 * 60 * 24 * 30; // 30 dní
  const secure = 'HttpOnly; Secure; SameSite=Lax';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  // HttpOnly cookie — čte ji pouze middleware (ochrana /private/*)
  headers.append('Set-Cookie', `hub_auth=1; Path=/; Max-Age=${maxAge}; ${secure}`);
  // JS-readable cookie — pouze pro UI stav (skrytí/zobrazení odkazů)
  headers.append('Set-Cookie', `hub_ui=1; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
