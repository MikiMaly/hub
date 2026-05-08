/**
 * GET /api/polymarket — vrátí aktuální btc-updown-5m a btc-updown-15m trhy z Polymarket
 * Nevyžaduje autentizaci (veřejná data), ale musí být přihlášen hub_auth cookie.
 */

const GAMMA_API = 'https://gamma-api.polymarket.com';

function marketSlug(intervalSec, offset = 0) {
  const now = Math.floor(Date.now() / 1000);
  const start = Math.floor(now / intervalSec) * intervalSec + offset;
  const label = intervalSec === 300 ? '5m' : '15m';
  return `btc-updown-${label}-${start}`;
}

async function fetchMarket(slug) {
  try {
    const r = await fetch(`${GAMMA_API}/events?slug=${slug}`);
    if (!r.ok) return null;
    const events = await r.json();
    if (!events.length) return null;
    const event = events[0];
    const markets = event.markets || [];
    if (!markets.length) return null;
    const market = markets[0];
    const prices = market.outcomePrices || [];
    let yes = null, no = null;
    try {
      yes = Math.round(parseFloat(prices[0]) * 1000) / 1000;
      no  = Math.round(parseFloat(prices[1]) * 1000) / 1000;
    } catch {}
    const endTs = market.endDateIso || event.endDate || null;
    return {
      slug,
      question: event.title || slug,
      yes,
      no,
      active: event.active !== false,
      end_date: endTs,
    };
  } catch {
    return null;
  }
}

async function trySlugs(slugs) {
  for (const slug of slugs) {
    const m = await fetchMarket(slug);
    if (m) return m;
  }
  return null;
}

export async function onRequestGet({ request }) {
  const cookie = request.headers.get('Cookie') || '';
  const isAuth = cookie.split(';').map(c => c.trim()).some(c => c === 'hub_auth=1');
  if (!isAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const [m5m, m15m] = await Promise.all([
    trySlugs([marketSlug(300), marketSlug(300, -300)]),
    trySlugs([marketSlug(900), marketSlug(900, -900)]),
  ]);

  const markets = [m5m, m15m].filter(Boolean);
  return new Response(JSON.stringify({ markets, fetched_at: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
