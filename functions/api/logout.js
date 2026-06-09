/**
 * POST /api/logout — smaže session cookie
 */
export async function onRequestPost() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', 'hub_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  headers.append('Set-Cookie', 'hub_ui=; Path=/; Max-Age=0; Secure; SameSite=Lax');
  headers.append('Set-Cookie', 'hub_admin_ui=; Path=/; Max-Age=0; Secure; SameSite=Lax');
  // úklid cookies ze staré (nepodepsané) auth verze
  headers.append('Set-Cookie', 'hub_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  headers.append('Set-Cookie', 'hub_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
