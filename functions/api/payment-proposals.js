/**
 * POST /api/payment-proposals — vytvoří návrh platby ke schválení
 * Volá Make.com (nebo jiná automatizace), nevyžaduje cookie.
 * Vyžaduje: Authorization: Bearer <PAYMENTS_WEBHOOK_SECRET>
 *
 * Body: { name, amount, dueDate?, recurringMonths?, accountNumber?, varSymbol?, note?, emailSubject? }
 */

const PAYMENTS_KEY = 'payments:list';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const secret = env.PAYMENTS_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return json({ error: 'Forbidden' }, 403);
  }
  if (!env.PAYMENTS) return json({ error: 'KV not bound' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  if (!body.name || !body.amount) {
    return json({ error: 'Missing name or amount' }, 400);
  }

  const proposal = {
    id: crypto.randomUUID(),
    status: 'pending',
    name: String(body.name).trim(),
    amount: Number(body.amount),
    dueDate: body.dueDate || new Date().toISOString().split('T')[0],
    recurringMonths: Number(body.recurringMonths ?? 0),
    ...(body.accountNumber && { accountNumber: String(body.accountNumber).trim() }),
    ...(body.varSymbol && { varSymbol: String(body.varSymbol).trim() }),
    ...(body.note && { note: String(body.note).trim() }),
    ...(body.emailSubject && { emailSubject: String(body.emailSubject).trim() }),
  };

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  const payments = raw ? JSON.parse(raw) : [];
  payments.push(proposal);
  await env.PAYMENTS.put(PAYMENTS_KEY, JSON.stringify(payments));

  return json(proposal, 201);
}
