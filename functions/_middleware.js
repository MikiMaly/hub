/**
 * Middleware — ochrana /private/* stránek a datových API.
 *
 * Stránka bez session dostane redirect na /login, API dostane 403 JSON —
 * fetch z prohlížeče by redirect na přihlašovací stránku jen spolkl a tvářil
 * se, že odpověď je v pořádku.
 */
import { getSession } from './_auth.js';

// API prefixy, kterým stačí jakákoli platná session (admin i user). Hlídá je
// middleware, takže to platí i pro endpointy, které pod nimi teprve přibydou.
//
// Zbytek /api/* tady schválně NENÍ: /api/payments a /api/invite chtějí rovnou
// roli admin, /api/signals POST a /api/payment-proposals jedou na bearer token
// pro boty, a /api/login s /api/logout musí být dostupné nepřihlášenému.
// Všechny si to ověřují samy a přísněji, než by uměl tenhle seznam.
const SESSION_API = ['/api/geckos', '/api/zalivka'];

// url.pathname nechává %2F zakódované a nesesypává zdvojená lomítka, takže
// /api/geckos%2Fmisting ani //api//geckos by na holý prefix nesedly. Jestli by
// Pages takovou cestu na funkci vůbec nasměroval nevím a nechci na tom stavět —
// porovnávám až normalizovaný tvar.
function normalizedPath(url) {
  let p = url.pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    // Rozbité procentové kódování — nechám původní tvar, ten se stejně nikam netrefí.
  }
  // new RegExp misto literalu — zpetne lomitko v regexu si cestou editace
  // uz jednou zmizelo a rozbilo build Functions.
  return p.replace(new RegExp('/{2,}', 'g'), '/');
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const path = normalizedPath(url);

  if (SESSION_API.some((p) => path === p || path.startsWith(p + '/'))) {
    if (!(await getSession(request, env))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path.startsWith('/private')) {
    const session = await getSession(request, env);

    if (!session) {
      const loginUrl = `/login?from=${encodeURIComponent(url.pathname)}`;
      return Response.redirect(new URL(loginUrl, request.url), 302);
    }

    if (path.startsWith('/private/invites') && session.role !== 'admin') {
      return Response.redirect(new URL('/private/', request.url), 302);
    }
  }

  return next();
}
