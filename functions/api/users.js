/**
 * Správa uživatelů (jen admin; middleware pouští jen roli admin).
 *
 * GET    /api/users            — seznam účtů
 * POST   /api/users            — { id, action, modules? }
 *          action: approve | disable | enable | set_modules | reset_password
 * DELETE /api/users?id=N       — smaže účet i všechna jeho data
 *
 * Adminův vlastní účet tu upravit nejde (ochrana proti zamčení sebe sama).
 */
import { MODULES, hashPassword, json, publicUser, randomPassword } from '../_users.js';

export async function onRequestGet({ env, data }) {
  if (data.user?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { results } = await env.DB.prepare(
    `SELECT * FROM users
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, created_at DESC`
  ).all();
  return json({ users: results.map(publicUser), modules: MODULES });
}

export async function onRequestPost({ request, env, data }) {
  if (data.user?.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const id = Number(body.id);
  if (!Number.isInteger(id)) return json({ error: 'missing_id' }, 400);
  if (id === data.user.id) return json({ error: 'cannot_modify_self' }, 400);

  const target = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
  if (!target) return json({ error: 'not_found' }, 404);
  if (target.role === 'admin') return json({ error: 'cannot_modify_admin' }, 400);

  const db = env.DB;
  let extra = {};
  switch (body.action) {
    case 'approve':
      await db.prepare(`UPDATE users SET status = 'active', approved_at = ? WHERE id = ?`)
        .bind(new Date().toISOString(), id).run();
      break;
    case 'disable':
      // session_version++ → okamžité odhlášení na všech zařízeních
      await db.prepare(`UPDATE users SET status = 'disabled', session_version = session_version + 1 WHERE id = ?`)
        .bind(id).run();
      break;
    case 'enable':
      await db.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).bind(id).run();
      break;
    case 'set_modules': {
      if (!Array.isArray(body.modules) || body.modules.some((m) => !MODULES.includes(m))) {
        return json({ error: 'invalid_modules' }, 400);
      }
      const unique = MODULES.filter((m) => body.modules.includes(m));
      await db.prepare(`UPDATE users SET modules = ? WHERE id = ?`).bind(JSON.stringify(unique), id).run();
      break;
    }
    case 'reset_password': {
      const password = randomPassword();
      const h = await hashPassword(password);
      await db.prepare(
        `UPDATE users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, session_version = session_version + 1
         WHERE id = ?`
      )
        .bind(h.pass_hash, h.pass_salt, h.pass_iter, id)
        .run();
      // Heslo se ukáže jen v téhle odpovědi, nikde se neukládá v čitelné podobě.
      extra = { password };
      break;
    }
    default:
      return json({ error: 'unknown_action' }, 400);
  }

  const updated = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
  return json({ user: publicUser(updated), ...extra });
}

export async function onRequestDelete({ request, env, data }) {
  if (data.user?.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return json({ error: 'missing_id' }, 400);
  if (id === data.user.id) return json({ error: 'cannot_modify_self' }, 400);

  const target = await env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(id).first();
  if (!target) return json({ error: 'not_found' }, 404);
  if (target.role === 'admin') return json({ error: 'cannot_modify_admin' }, 400);

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM watering_events WHERE plant_id IN (SELECT id FROM plants WHERE owner_id = ?)`).bind(id),
    env.DB.prepare(`DELETE FROM plants WHERE owner_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM spiral_state WHERE user_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id),
  ]);
  return json({ deleted: 1 });
}
