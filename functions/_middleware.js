/**
 * Middleware — přihlášení, moduly a admin přístup pro /private/* a datová API.
 *
 * Každý chráněný request ověří session proti D1 (getUser: podpis, účet
 * existuje, je aktivní, session_version sedí), takže zablokování účtu nebo
 * změna hesla platí okamžitě. Ověřený uživatel jde dál v context.data.user.
 *
 * Stránka bez přístupu dostane redirect, API dostane 403 JSON — fetch z
 * prohlížeče by redirect na přihlašovací stránku jen spolkl a tvářil se, že
 * odpověď je v pořádku.
 *
 * Mimo tenhle seznam schválně zůstává: /api/login, /api/register, /api/logout
 * (musí jít bez přihlášení), /api/signals POST a /api/payment-proposals (bearer
 * token pro boty) a /api/signals GET, který si modul hlídá sám.
 */
import { getUser, json } from './_users.js';

// cesta → modul, který ji odemyká. Admin má všechny moduly.
const MODULE_PATHS = [
  ['/private/geckos', 'geckos'],
  ['/api/geckos', 'geckos'],
  ['/private/zalivka', 'zalivka'],
  ['/api/zalivka', 'zalivka'],
  ['/private/spirala', 'spirala'],
  ['/api/spirala', 'spirala'],
  ['/private/polymarket', 'polymarket'],
  ['/api/polymarket', 'polymarket'],
];

const ADMIN_PATHS = ['/private/users', '/private/payments', '/api/users', '/api/payments'];

// Stačí jakýkoli aktivní účet.
const USER_API = ['/api/me', '/api/account'];

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

const under = (path, prefix) =>
  path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '.');

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);
  const path = normalizedPath(url);

  const isPage = under(path, '/private');
  const isApi = path.startsWith('/api/');
  const module = MODULE_PATHS.find(([p]) => under(path, p))?.[1];
  const adminOnly = ADMIN_PATHS.some((p) => under(path, p));
  const userApi = USER_API.some((p) => under(path, p));

  if (!isPage && !module && !adminOnly && !userApi) return next();

  let user;
  try {
    user = await getUser(request, env);
  } catch (e) {
    return json({ error: `Server error — ${e.message}` }, 500);
  }

  const deny = (toLogin) => {
    // Neplatná session → smazat i UX cookies hub_ui / hub_admin_ui. Bez toho
    // login stránka věřila hub_ui=1, poslala prohlížeč zpět na /private a ten
    // sem — nekonečná smyčka přesměrování (typicky cookies z doby před účty).
    const headers = new Headers();
    if (toLogin) {
      headers.append('Set-Cookie', 'hub_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
      headers.append('Set-Cookie', 'hub_ui=; Path=/; Max-Age=0; Secure; SameSite=Lax');
      headers.append('Set-Cookie', 'hub_admin_ui=; Path=/; Max-Age=0; Secure; SameSite=Lax');
    }
    if (isApi) return json({ error: 'Forbidden' }, 403, headers);
    const target = toLogin ? `/login?from=${encodeURIComponent(url.pathname)}` : '/private';
    headers.set('Location', new URL(target, request.url).toString());
    return new Response(null, { status: 302, headers });
  };

  if (!user) return deny(true);
  if (adminOnly && user.role !== 'admin') return deny(false);
  if (module && !user.modules.includes(module)) return deny(false);

  data.user = user;
  return next();
}
