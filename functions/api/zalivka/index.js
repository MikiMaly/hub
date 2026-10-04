/**
 * GET    /api/zalivka      — seznam rostlin + kdy naposledy zalito a kolikrát
 * POST   /api/zalivka      — přidá rostlinu
 * DELETE /api/zalivka?id=N — smaže rostlinu i její historii zálivek
 *
 * Vyžaduje platnou session (admin i user). Middleware hlídá jen stránky
 * /private/*, API endpointy si ověření musí udělat samy.
 */
import { getSession } from '../../_auth.js';

const SPECIES = ['sukulent', 'kaktus', 'stredomorska', 'tropicka', 'orchidej', 'kapradina', 'bylinka'];
const MATERIALS = ['terakota', 'plast', 'glazura'];
const LIGHT = ['slunce', 'neprime', 'polostin', 'stin'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authed(request, env) {
  return (await getSession(request, env)) !== null;
}

export async function onRequestGet({ request, env }) {
  if (!(await authed(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  // last_ts/water_count poddotazy místo GROUP BY — rostlina bez jediné zálivky
  // musí v seznamu zůstat (s last_ts = null, UI to ukáže jako "ještě nezalito").
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.species, p.pot_cm, p.material, p.light, p.created_at,
            (SELECT MAX(ts) FROM watering_events w WHERE w.plant_id = p.id) AS last_ts,
            (SELECT COUNT(*) FROM watering_events w WHERE w.plant_id = p.id) AS water_count
     FROM plants p
     ORDER BY p.id`
  ).all();

  return json({ plants: results });
}

export async function onRequestPost({ request, env }) {
  if (!(await authed(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const name = String(body.name ?? '').trim();
  if (!name) return json({ error: 'missing_name' }, 400);
  if (name.length > 80) return json({ error: 'name_too_long' }, 400);
  if (!SPECIES.includes(body.species)) return json({ error: 'invalid_species' }, 400);
  if (!MATERIALS.includes(body.material)) return json({ error: 'invalid_material' }, 400);
  if (!LIGHT.includes(body.light)) return json({ error: 'invalid_light' }, 400);

  const pot = Number(body.pot_cm);
  if (!Number.isFinite(pot) || pot < 6 || pot > 60) return json({ error: 'invalid_pot_cm' }, 400);

  const plant = await env.DB.prepare(
    `INSERT INTO plants (name, species, pot_cm, material, light)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id, name, species, pot_cm, material, light, created_at`
  )
    .bind(name, body.species, Math.round(pot), body.material, body.light)
    .first();

  // Nová rostlina nemá žádnou zálivku — vědomě. Založení ≠ zalití, takže UI ji
  // ukáže jako "ještě nezalito" a první klik na Zalít nastartuje interval.
  return json({ plant: { ...plant, last_ts: null, water_count: 0 } }, 201);
}

export async function onRequestDelete({ request, env }) {
  if (!(await authed(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return json({ error: 'missing_id' }, 400);

  // Historii mažu explicitně — na ON DELETE CASCADE se nespoléhám, schema ho
  // nedeklaruje a osiřelé řádky by se jinak hromadily.
  const [, deleted] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM watering_events WHERE plant_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM plants WHERE id = ?`).bind(id),
  ]);

  return json({ deleted: deleted.meta.changes });
}
