/**
 * POST /api/account/password  { current, next }
 *
 * Změna vlastního hesla. Zvýší session_version, takže se odhlásí všechna
 * ostatní zařízení; tomuhle prohlížeči rovnou vydá novou cookie.
 */
import {
  hashPassword, hit, json, passwordError, sessionCookies, verifyPassword,
} from '../../_users.js';

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Forbidden' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  if (!(await hit(env, `password:user:${data.user.id}`, 10, 15 * 60))) {
    return json({ error: 'too_many_attempts' }, 429);
  }

  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(data.user.id).first();
  if (!user || typeof body.current !== 'string' || !(await verifyPassword(body.current, user))) {
    return json({ error: 'wrong_password' }, 403);
  }

  const pErr = passwordError(body.next, user.username);
  if (pErr) return json({ error: pErr }, 400);
  if (body.next === body.current) return json({ error: 'same_password' }, 400);

  const h = await hashPassword(body.next);
  const updated = await env.DB.prepare(
    `UPDATE users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, session_version = session_version + 1
     WHERE id = ? RETURNING *`
  )
    .bind(h.pass_hash, h.pass_salt, h.pass_iter, user.id)
    .first();

  const headers = new Headers();
  for (const c of await sessionCookies(updated, env)) headers.append('Set-Cookie', c);
  return json({ ok: true }, 200, headers);
}
