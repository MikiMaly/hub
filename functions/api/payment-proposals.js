/**
 * POST /api/payment-proposals — vytvoří návrh platby ke schválení
 * Volá Google Apps Script (nebo jiná automatizace), nevyžaduje cookie.
 * Vyžaduje: Authorization: Bearer <PAYMENTS_WEBHOOK_SECRET>
 *
 * Body (parsovaný): { name, amount, dueDate?, recurringMonths?, note?, emailSubject? }
 * Body (surový email): { emailFrom, emailSubject, emailBody } → AI extrakce
 */

const PAYMENTS_KEY = 'payments:list';

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const AI_SYSTEM = `Jsi extraktor platebních informací z emailů. Vrať POUZE validní JSON bez markdown bloků:
{"name":"název služby","amount":123,"dueDate":"YYYY-MM-DD","note":"stručná poznámka"}

Pravidla:
- name: krátký název max 30 znaků, např. "iCloud 50GB", "Spotify Premium", "Vodafone faktura", "Generali pojištění"
- amount: číslo v CZK (EUR×25, USD×23)
- dueDate: datum splatnosti, nebo datum stržení pokud jde o potvrzení platby
- note: jedna věta s číslem faktury, obdobím apod. (nebo prázdný řetězec)
- Pokud email neobsahuje žádnou platbu, vrať: {"error":"no payment"}`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function parseWithAI(env, emailFrom, emailSubject, emailBody) {
  if (!env.AI) return null;
  try {
    const result = await env.AI.run(AI_MODEL, {
      messages: [
        { role: 'system', content: AI_SYSTEM },
        {
          role: 'user',
          content: `Od: ${emailFrom}\nPředmět: ${emailSubject}\n\n${emailBody.slice(0, 3000)}`,
        },
      ],
    });
    const text = result?.response ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed.error) return null;
    return parsed;
  } catch {
    return null;
  }
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

  // Pokud přišel surový email, zkus AI parsing
  let fields = body;
  if (body.emailBody && (!body.name || !body.amount)) {
    const parsed = await parseWithAI(env, body.emailFrom ?? '', body.emailSubject ?? '', body.emailBody);
    if (!parsed) {
      return json({ error: 'AI parsing failed or no payment found in email' }, 422);
    }
    fields = {
      ...parsed,
      emailSubject: body.emailSubject,
    };
  }

  if (!fields.name || !fields.amount) {
    return json({ error: 'Missing name or amount' }, 400);
  }

  const proposal = {
    id: crypto.randomUUID(),
    status: 'pending',
    name: String(fields.name).trim(),
    amount: Number(fields.amount),
    dueDate: fields.dueDate || new Date().toISOString().split('T')[0],
    recurringMonths: Number(fields.recurringMonths ?? 0),
    ...(fields.accountNumber && { accountNumber: String(fields.accountNumber).trim() }),
    ...(fields.varSymbol && { varSymbol: String(fields.varSymbol).trim() }),
    ...(fields.note && { note: String(fields.note).trim() }),
    ...(fields.emailSubject && { emailSubject: String(fields.emailSubject).trim() }),
  };

  const raw = await env.PAYMENTS.get(PAYMENTS_KEY);
  const payments = raw ? JSON.parse(raw) : [];
  payments.push(proposal);
  await env.PAYMENTS.put(PAYMENTS_KEY, JSON.stringify(payments));

  return json(proposal, 201);
}
