/**
 * POST /api/payment-proposals — vytvoří návrh platby ke schválení
 * Volá Google Apps Script (nebo jiná automatizace), nevyžaduje cookie.
 * Vyžaduje: Authorization: Bearer <PAYMENTS_WEBHOOK_SECRET>
 *
 * Body (parsovaný): { name, amount, dueDate?, recurringMonths?, note?, emailSubject? }
 * Body (surový email): { emailFrom, emailSubject, emailBody } → AI extrakce
 */

const PAYMENTS_KEY = 'payments:list';

// Od nejlevnějšího. Na další se přejde jen když model spadne nebo vrátí
// nepoužitelný výstup — ne když věcně rozhodne, že platba v mailu není.
const AI_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

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

/** Vrací { data } při úspěchu, jinak { reason, raw } pro diagnostiku. */
async function parseWithAI(env, emailFrom, emailSubject, emailBody) {
  const messages = [
    { role: 'system', content: AI_SYSTEM },
    {
      role: 'user',
      content: `Od: ${emailFrom}\nPředmět: ${emailSubject}\n\n${emailBody.slice(0, 3000)}`,
    },
  ];

  let last = { reason: 'no_models_tried', raw: '' };

  for (const model of AI_MODELS) {
    let result;
    try {
      result = await env.AI.run(model, { messages, max_tokens: 300 });
    } catch (e) {
      last = { reason: 'ai_call_failed', raw: String(e?.message ?? e), model };
      continue; // model je zrušený/přetížený → zkus další
    }

    // .response nemusí být řetězec (podle modelu i objekt) — vždy převést.
    const rawResponse = result?.response;
    const text = typeof rawResponse === 'string'
      ? rawResponse
      : JSON.stringify(rawResponse ?? result ?? '');

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) {
      last = { reason: 'no_json_in_response', raw: text.slice(0, 500), model };
      continue; // nepoužitelný výstup → zkus chytřejší model
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      last = { reason: 'invalid_json', raw: match[0].slice(0, 500), model };
      continue;
    }

    // Věcné rozhodnutí modelu — eskalovat nemá smysl, jen by to stálo navíc.
    if (parsed.error) {
      return { reason: 'model_says_no_payment', raw: match[0].slice(0, 500), model };
    }

    if (!parsed.name || parsed.amount == null) {
      last = { reason: 'missing_fields', raw: match[0].slice(0, 500), model };
      continue;
    }

    return { data: parsed, model };
  }

  return last;
}

export async function onRequestPost(context) {
  try {
    return await handlePost(context);
  } catch (e) {
    // Bez tohohle vrací Cloudflare neprůhlednou chybu 1101.
    return json({ error: 'unhandled', message: String(e?.message ?? e), stack: String(e?.stack ?? '').slice(0, 800) }, 500);
  }
}

async function handlePost({ request, env }) {
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
    if (!env.AI) {
      return json({ error: 'Workers AI binding "AI" not configured in Cloudflare Pages' }, 503);
    }
    const parsed = await parseWithAI(env, body.emailFrom ?? '', body.emailSubject ?? '', body.emailBody);
    if (!parsed.data) {
      return json({ error: 'no payment parsed', reason: parsed.reason, raw: parsed.raw, model: parsed.model }, 422);
    }
    fields = {
      ...parsed.data,
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
