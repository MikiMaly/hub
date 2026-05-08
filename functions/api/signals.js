/**
 * GET  /api/signals  — vrátí posledních 200 signálů (vyžaduje hub_auth cookie)
 * POST /api/signals  — uloží nový signál (vyžaduje Authorization: Bearer <BOT_SECRET>)
 */

const SIGNALS_KEY = 'signals:list';
const MAX_SIGNALS = 200;

export async function onRequestGet({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const isAuth = cookie.split(';').map(c => c.trim()).some(c => c === 'hub_auth=1');
  if (!isAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const raw = await env.SIGNALS.get(SIGNALS_KEY);
  const signals = raw ? JSON.parse(raw) : [];

  return new Response(JSON.stringify(signals), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const secret = env.BOT_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('Forbidden', { status: 403 });
  }

  let signal;
  try {
    signal = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const raw = await env.SIGNALS.get(SIGNALS_KEY);
  const signals = raw ? JSON.parse(raw) : [];
  signals.unshift(signal);
  if (signals.length > MAX_SIGNALS) signals.splice(MAX_SIGNALS);

  await env.SIGNALS.put(SIGNALS_KEY, JSON.stringify(signals));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
