/**
 * POST /api/logout — smaže auth cookie
 */
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'hub_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
    },
  });
}
