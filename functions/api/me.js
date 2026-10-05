/**
 * GET /api/me — přihlášený uživatel { username, role, modules, pending_count? }.
 * Middleware sem pustí jen platnou session, uživatel je v data.user.
 */
import { json } from '../_users.js';

export async function onRequestGet({ env, data }) {
  const user = data.user;
  if (!user) return json({ error: 'Forbidden' }, 403);
  const out = { username: user.username, role: user.role, modules: user.modules };
  if (user.role === 'admin') {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE status = 'pending'`).first();
    out.pending_count = row?.n ?? 0;
  }
  return json(out);
}
