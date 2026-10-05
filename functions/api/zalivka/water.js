/**
 * GET    /api/zalivka/water?plant_id=N — historie zálivek rostliny (nejnovější první)
 * GET    /api/zalivka/water            — historie všech rostlin
 * POST   /api/zalivka/water            — zapíše zálivku {plant_id, ml?, note?, ts?}
 * DELETE /api/zalivka/water?id=N       — smaže zápis (překlik)
 *
 * Přístup hlídá middleware (modul 'zalivka'). Všechny dotazy jdou přes
 * plants.owner_id, takže cizí zálivky nejde číst, zapsat ani smazat.
 */

const LIMIT = 500;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function owner(data) {
  return data.user?.id ?? null;
}

export async function onRequestGet({ request, env, data }) {
  const uid = owner(data);
  if (uid === null) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  const plantParam = new URL(request.url).searchParams.get('plant_id');

  if (plantParam !== null) {
    const plantId = Number(plantParam);
    if (!Number.isInteger(plantId)) return json({ error: 'invalid_plant_id' }, 400);
    const { results } = await env.DB.prepare(
      `SELECT w.id, w.plant_id, w.ts, w.ml, w.note
       FROM watering_events w
       JOIN plants p ON p.id = w.plant_id
       WHERE w.plant_id = ? AND p.owner_id = ?
       ORDER BY w.ts DESC, w.id DESC
       LIMIT ?`
    )
      .bind(plantId, uid, LIMIT)
      .all();
    return json({ events: results });
  }

  const { results } = await env.DB.prepare(
    `SELECT w.id, w.plant_id, w.ts, w.ml, w.note
     FROM watering_events w
     JOIN plants p ON p.id = w.plant_id
     WHERE p.owner_id = ?
     ORDER BY w.ts DESC, w.id DESC
     LIMIT ?`
  )
    .bind(uid, LIMIT)
    .all();
  return json({ events: results });
}

export async function onRequestPost({ request, env, data }) {
  const uid = owner(data);
  if (uid === null) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const plantId = Number(body.plant_id);
  if (!Number.isInteger(plantId)) return json({ error: 'invalid_plant_id' }, 400);

  // Cizí klíč neověřuje D1 sám od sebe spolehlivě — radši se zeptám, ať
  // nevzniknou zálivky rostliny, která neexistuje.
  const exists = await env.DB.prepare(`SELECT 1 AS x FROM plants WHERE id = ? AND owner_id = ?`)
    .bind(plantId, uid)
    .first();
  if (!exists) return json({ error: 'unknown_plant' }, 404);

  const ts = typeof body.ts === 'string' && body.ts ? body.ts : new Date().toISOString();
  const ml = Number.isFinite(Number(body.ml)) && Number(body.ml) > 0 ? Math.round(Number(body.ml)) : null;
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : null;

  const event = await env.DB.prepare(
    `INSERT INTO watering_events (plant_id, ts, ml, note)
     VALUES (?, ?, ?, ?)
     RETURNING id, plant_id, ts, ml, note`
  )
    .bind(plantId, ts, ml, note)
    .first();

  return json({ event }, 201);
}

export async function onRequestDelete({ request, env, data }) {
  const uid = owner(data);
  if (uid === null) return json({ error: 'Forbidden' }, 403);
  if (!env.DB) return json({ error: 'D1 not bound' }, 500);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return json({ error: 'missing_id' }, 400);

  const res = await env.DB.prepare(
    `DELETE FROM watering_events
     WHERE id = ? AND plant_id IN (SELECT id FROM plants WHERE owner_id = ?)`
  )
    .bind(id, uid)
    .run();
  return json({ deleted: res.meta.changes });
}
