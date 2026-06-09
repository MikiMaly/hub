/**
 * GET    /api/payments  — vrátí seznam plateb (vyžaduje admin session)
 * POST   /api/payments  — vytvoří platbu (vyžaduje admin session)
 * PUT    /api/payments  — aktualizuje platbu podle id (vyžaduje admin session)
 * DELETE /api/payments  — smaže platbu podle id (vyžaduje admin session)
 */
import { getSession } from '../_auth.js';

const PAYMENTS_KEY = 'payments:list';

async function isAdmin(request, env) {
  const session = await getSession(request, env);
  return session?.role === 'admin';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.PAYMENTS) return json({ error: 'KV not bound' }, 500);

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  return json(raw ? JSON.parse(raw) : []);
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.PAYMENTS) return json({ error: 'KV not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  if (!body.name || !body.amount || !body.dueDate) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const payment = {
    id: crypto.randomUUID(),
    name: String(body.name).trim(),
    amount: Number(body.amount),
    dueDate: String(body.dueDate),
    recurringMonths: Number(body.recurringMonths ?? 0),
    ...(body.accountNumber && { accountNumber: String(body.accountNumber).trim() }),
    ...(body.varSymbol && { varSymbol: String(body.varSymbol).trim() }),
    ...(body.note && { note: String(body.note).trim() }),
  };

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  const payments = raw ? JSON.parse(raw) : [];
  payments.push(payment);
  await env.PAYMENTS.put(PAYMENTS_KEY, JSON.stringify(payments));

  return json(payment, 201);
}

export async function onRequestPut({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.PAYMENTS) return json({ error: 'KV not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  if (!body.id) return json({ error: 'Missing id' }, 400);

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  const payments = raw ? JSON.parse(raw) : [];
  const idx = payments.findIndex(p => p.id === body.id);
  if (idx === -1) return json({ error: 'Not found' }, 404);

  payments[idx] = {
    id: body.id,
    status: body.status ?? 'active',
    name: String(body.name).trim(),
    amount: Number(body.amount),
    dueDate: String(body.dueDate),
    recurringMonths: Number(body.recurringMonths ?? 0),
    ...(body.accountNumber && { accountNumber: String(body.accountNumber).trim() }),
    ...(body.varSymbol && { varSymbol: String(body.varSymbol).trim() }),
    ...(body.note && { note: String(body.note).trim() }),
    ...(body.emailSubject && { emailSubject: String(body.emailSubject).trim() }),
  };

  await env.PAYMENTS.put(PAYMENTS_KEY, JSON.stringify(payments));
  return json(payments[idx]);
}

export async function onRequestDelete({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'Forbidden' }, 403);
  if (!env.PAYMENTS) return json({ error: 'KV not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  if (!body.id) return json({ error: 'Missing id' }, 400);

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  const payments = raw ? JSON.parse(raw) : [];
  await env.PAYMENTS.put(PAYMENTS_KEY, JSON.stringify(payments.filter(p => p.id !== body.id)));

  return json({ ok: true });
}
