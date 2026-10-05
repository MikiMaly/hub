# TODO — mmaly.cz hub

## Aktivní
- [ ] Zelená MM ikona webu (favicon) — svg/png ve stylu zeleného rebrandu
- [ ] Open Graph image 1200×630 (zatím se sdílí jen favicon)
- [ ] Port `private/polymarket.html` do React komponenty `/private/polymarket` (stejný design language)
- [ ] Hostovat UVD jako webapp na mmaly.cz — nejdřív jako modul pro schválené účty (`/private/uvd`?), pak veřejně (`/uvd`)
- [ ] Mobile responsiveness review nového Figma portu (md:/lg: breakpointy)
- [ ] Mobile page optimization — projít všechny stránky (HomePage, PrivatePage, LoginPage, UsersPage, gekos sub-app) na malých obrazovkách: padding/spacing, font-size škálování (h1 3rem → ~2rem na mobile), tap targety ≥44px, fixed header neukrojí obsah, žádný horizontální scroll, dropdown/select čitelnost, modaly/popovery
- [ ] A11y audit — aria-labels, keyboard nav, focus styles


- [ ] Napojit `uwd.mmaly.cz` — webapp pro online stahování videí (RPi4 + Cloudflare Tunnel)
- [ ] Server mód webappu (v7.2) — stahování na server + HTTP download pro uživatele

## Uživatelské účty (hotovo), zbývá
- [x] Registrace se schválením, login jméno + heslo, PBKDF2, moduly per uživatel, Zálivka a Spirála per uživatel, správa uživatelů místo pozvánek
- [ ] Smazat KV namespace HUB_INVITES v Cloudflare dashboardu (binding už ve wrangler.toml není)
- [ ] Upozornění na novou registraci (mail / Telegram), ať nemusím koukat do /private/users
- [ ] Gekoni pro jiné uživatele: dnes modul geckos ukáže moje gekony; kdyby měl mít někdo vlastní, potřebuje gekos `owner_id`

## Vylepšení (rozhodnuto pozdějc)

### Bezpečnost
- [x] Rate limiting na `/api/login` (D1, per jméno i IP)
- [ ] `public/_headers` se security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) — Cloudflare to nepřidá samo
- [x] HMAC-signed session cookie

### Výkon
- [ ] Route-level code splitting přes `React.lazy()` — bundle je 418 kB, většinu nepotřebuje homepage návštěvník
- [ ] Preconnect + preload Google Fonts v `index.html` (eliminuje FOIT)
- [ ] Optimalizovat `uvd-icon.png` (SVG/WebP)

### UX / A11y
- [ ] `<MotionConfig reducedMotion="user">` — respektovat `prefers-reduced-motion`
- [ ] Error Boundary s decent fallback komponentou
- [ ] Skeleton states (UsersPage a budoucí datafetch)

### Dev tooling
- [ ] ESLint + Prettier + `prettier-plugin-tailwindcss`
- [ ] GitHub Actions CI — `npm run build` + `tsc --noEmit` na PR/push
- [ ] Husky + lint-staged pre-commit hook
- [ ] Refactor opakujících se patternů do `<Card>` a `<NoiseTextureBg>` (až budou víc než 4 stránky)

### SEO / observability
- [ ] Cloudflare Web Analytics snippet (privacy-first, no cookies) — registrovat v dashboardu, snippet do `index.html`
- [ ] Aktualizovat `public/sitemap.xml` `lastmod` při větších změnách (manuálně nebo přes build skript)

## Nápady / budoucnost
- [ ] Více privátních appek v sekci
- [ ] Stats / activity feed na PrivatePage napojený na reálná data (Polymarket signals)
- [ ] Theme switcher dark/light (`theme.css` už má `.dark` selektor)
- [ ] WebSocket live updates pro Polymarket dashboard (CF Workers WS)
- [ ] Recharts vizualizace signálů na polymarket dashboardu
