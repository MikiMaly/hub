/**
 * GET    /api/invite?adminpw=X        — seznam kódů
 * POST   /api/invite { adminpw, label } — vytvoř kód
 * DELETE /api/invite { adminpw, code }  — smaž kód
 */

import { getSession } from '../_auth.js';

async function checkAdmin(env, pw, request) {
  const session = await getSession(request, env);
  if (session?.role === 'admin') return true;
  return !!env.HUB_PASSWORD && pw === env.HUB_PASSWORD;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = crypto.getRandomValues(new Uint8Array(8));
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[rand[i] % chars.length]; // 256 % 32 === 0 → bez modulo biasu
  }
  return code; // např. ABCD-EF3G
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!(await checkAdmin(env, url.searchParams.get('adminpw'), request))) {
    return new Response('Forbidden', { status: 403 });
  }
  const list = await env.INVITES.list({ prefix: 'invite:' });
  const codes = await Promise.all(list.keys.map(async k => {
    const val = await env.INVITES.get(k.name);
    return { code: k.name.replace('invite:', ''), ...JSON.parse(val) };
  }));
  return new Response(JSON.stringify(codes), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }
  if (!(await checkAdmin(env, body.adminpw, request))) return new Response('Forbidden', { status: 403 });

  const code = generateCode();
  await env.INVITES.put(`invite:${code}`, JSON.stringify({
    label: (body.label || '').trim() || 'Unnamed',
    created: new Date().toISOString().split('T')[0],
  }));
  return new Response(JSON.stringify({ ok: true, code }), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestDelete({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }
  if (!(await checkAdmin(env, body.adminpw, request))) return new Response('Forbidden', { status: 403 });

  await env.INVITES.delete(`invite:${body.code.trim().toUpperCase()}`);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
