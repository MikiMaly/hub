/**
 * POST /api/register  { username, password, note? }
 *
 * Založí účet ve stavu 'pending'. Přihlásit se jde až po schválení adminem
 * (/private/users). Výchozí moduly: Zálivka a Spirála.
 *
 * Ochrana proti zahlcení: 5 registrací / hodinu na IP a nejvýš 20 čekajících
 * účtů naráz.
 */
import {
  clientIp, ensureSchema, hashPassword, hit, json, normalizeUsername, passwordError, usernameError,
  DEFAULT_MODULES,
} from '../_users.js';

const MAX_PENDING = 20;

export async function onRequestPost({ request, env }) {
  try {
    await ensureSchema(env);
  } catch (e) {
    return json({ error: `Server misconfigured — ${e.message}` }, 500);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const username = normalizeUsername(body.username);
  const uErr = usernameError(username);
  if (uErr) return json({ error: uErr }, 400);
  const pErr = passwordError(body.password, username);
  if (pErr) return json({ error: pErr }, 400);
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : null;

  if (!(await hit(env, `register:ip:${clientIp(request)}`, 5, 60 * 60))) {
    return json({ error: 'too_many_attempts' }, 429);
  }

  const pending = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE status = 'pending'`).first();
  if ((pending?.n ?? 0) >= MAX_PENDING) return json({ error: 'registrations_paused' }, 503);

  const exists = await env.DB.prepare(`SELECT 1 AS x FROM users WHERE username = ?`).bind(username).first();
  if (exists) return json({ error: 'username_taken' }, 409);

  const h = await hashPassword(body.password);
  try {
    await env.DB.prepare(
      `INSERT INTO users (username, pass_hash, pass_salt, pass_iter, role, status, modules, note)
       VALUES (?, ?, ?, ?, 'user', 'pending', ?, ?)`
    )
      .bind(username, h.pass_hash, h.pass_salt, h.pass_iter, JSON.stringify(DEFAULT_MODULES), note)
      .run();
  } catch (e) {
    if (String(e?.message ?? e).includes('UNIQUE')) return json({ error: 'username_taken' }, 409);
    throw e;
  }

  return json({ ok: true, status: 'pending' }, 201);
}
