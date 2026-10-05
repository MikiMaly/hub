/**
 * POST /api/login  { username, password }
 *
 * Bootstrap admina: dokud v DB není žádný admin, přihlášení libovolným platným
 * jménem a heslem HUB_PASSWORD založí admin účet s tímhle jménem a heslem
 * (heslo se uloží jako PBKDF2 hash) a přiřadí mu dosavadní rostliny ze Zálivky.
 * Jakmile admin existuje, HUB_PASSWORD už nepřihlásí nikoho — zůstává jen
 * podpisovým klíčem session.
 *
 * Rate limit: 10 pokusů / 15 min na jméno, 30 / 15 min na IP.
 */
import {
  burnPasswordCheck, clearHits, clientIp, ensureSchema, hashPassword, hit, json,
  normalizeUsername, secretEquals, sessionCookies, usernameError, verifyPassword,
} from '../_users.js';

const WINDOW = 15 * 60;

export async function onRequestPost({ request, env }) {
  if (!env.HUB_PASSWORD) return json({ error: 'Server misconfigured — set HUB_PASSWORD' }, 500);
  try {
    await ensureSchema(env);
  } catch (e) {
    return json({ error: `Server misconfigured — ${e.message}` }, 500);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || password.length > 256) return json({ error: 'invalid_credentials' }, 401);

  const ipOk = await hit(env, `login:ip:${clientIp(request)}`, 30, WINDOW);
  const userOk = await hit(env, `login:user:${username}`, 10, WINDOW);
  if (!ipOk || !userOk) return json({ error: 'too_many_attempts' }, 429);

  let user = await env.DB.prepare(`SELECT * FROM users WHERE username = ?`).bind(username).first();

  if (!user) {
    const hasAdmin = await env.DB.prepare(`SELECT 1 AS x FROM users WHERE role = 'admin' LIMIT 1`).first();
    if (!hasAdmin && !usernameError(username) && (await secretEquals(password, env.HUB_PASSWORD))) {
      user = await bootstrapAdmin(env, username, password);
    } else {
      await burnPasswordCheck(password);
      return json({ error: 'invalid_credentials' }, 401);
    }
  } else if (!(await verifyPassword(password, user))) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  // Stav prozrazuju až po správném hesle, takže neodhaluje nic navíc.
  if (user.status === 'pending') return json({ error: 'pending' }, 403);
  if (user.status !== 'active') return json({ error: 'disabled' }, 403);

  await clearHits(env, `login:user:${username}`);
  if (user.role === 'admin') {
    // Rostliny bez vlastníka vznikly přes starou verzi (produkce běží souběžně
    // s náhledem nad stejnou D1) — patří adminovi.
    await env.DB.prepare(`UPDATE plants SET owner_id = ? WHERE owner_id IS NULL`).bind(user.id).run();
  }
  await env.DB.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), user.id)
    .run();

  const headers = new Headers();
  for (const c of await sessionCookies(user, env)) headers.append('Set-Cookie', c);
  return json({ ok: true, username: user.username, role: user.role }, 200, headers);
}

async function bootstrapAdmin(env, username, password) {
  // Bez kontroly passwordError: HUB_PASSWORD si admin vybral dřív a nemusí
  // splňovat nová pravidla. Změnit si ho může v /private/account.
  const h = await hashPassword(password);
  const now = new Date().toISOString();
  const user = await env.DB.prepare(
    `INSERT INTO users (username, pass_hash, pass_salt, pass_iter, role, status, modules, approved_at)
     VALUES (?, ?, ?, ?, 'admin', 'active', '[]', ?)
     RETURNING *`
  )
    .bind(username, h.pass_hash, h.pass_salt, h.pass_iter, now)
    .first();
  // Rostliny z doby před účty patří adminovi.
  await env.DB.prepare(`UPDATE plants SET owner_id = ? WHERE owner_id IS NULL`).bind(user.id).run();
  return user;
}
