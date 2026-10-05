/**
 * GET /api/spirala — uložený stav Spirály přihlášeného uživatele ({ data } nebo { data: null })
 * PUT /api/spirala — uloží stav { birth, shape, periods }
 *
 * Celý stav je jeden JSON na uživatele: Spirála je zatím prototyp a tvar dat
 * se ještě mění, rozpad do tabulek přijde, až se ustálí.
 */
import { json } from '../_users.js';

const MAX_BYTES = 256 * 1024;

export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ error: 'Forbidden' }, 403);
  const row = await env.DB.prepare(`SELECT data, updated_at FROM spiral_state WHERE user_id = ?`)
    .bind(data.user.id)
    .first();
  if (!row) return json({ data: null });
  return json({ data: JSON.parse(row.data), updated_at: row.updated_at });
}

export async function onRequestPut({ request, env, data }) {
  if (!data.user) return json({ error: 'Forbidden' }, 403);

  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: 'too_large' }, 413);

  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'bad_request' }, 400); }
  if (
    !body || typeof body !== 'object' ||
    typeof body.birth !== 'string' ||
    !body.shape || typeof body.shape !== 'object' ||
    !Array.isArray(body.periods)
  ) {
    return json({ error: 'invalid_shape' }, 400);
  }

  const clean = JSON.stringify({ birth: body.birth, shape: body.shape, periods: body.periods });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO spiral_state (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  )
    .bind(data.user.id, clean, now)
    .run();
  return json({ ok: true, updated_at: now });
}
