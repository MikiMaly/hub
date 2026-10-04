# TODO — mmaly.cz hub

## Aktivní
- [ ] Zelená MM ikona webu (favicon) — svg/png ve stylu zeleného rebrandu
- [ ] Open Graph image 1200×630 (zatím se sdílí jen favicon)
- [ ] Port `private/polymarket.html` do React komponenty `/private/polymarket` (stejný design language)
- [ ] Hostovat UVD jako webapp na mmaly.cz — nejdřív pro uživatele s invite kódem (`/private/uvd`?), pak veřejně (`/uvd`)
- [ ] Mobile responsiveness review nového Figma portu (md:/lg: breakpointy)
- [ ] Mobile page optimization — projít všechny stránky (HomePage, PrivatePage, LoginPage, InvitesPage, gekos sub-app) na malých obrazovkách: padding/spacing, font-size škálování (h1 3rem → ~2rem na mobile), tap targety ≥44px, fixed header neukrojí obsah, žádný horizontální scroll, dropdown/select čitelnost, modaly/popovery
- [ ] A11y audit — aria-labels, keyboard nav, focus styles


- [ ] Napojit `uwd.mmaly.cz` — webapp pro online stahování videí (RPi4 + Cloudflare Tunnel)
- [ ] Server mód webappu (v7.2) — stahování na server + HTTP download pro uživatele

## Uživatelské účty a vlastní data (budoucnost)
Dnes session nese jen roli (`admin` / `user`), ne identitu člověka, a data jsou společná
(zatím nevadí, data jsou jen moje).
- [ ] Registrace uživatelů se **schválením adminem** — nový účet je "čeká na schválení", dokud ho nepovolím
- [ ] Session s identitou uživatele (`user_id` v payloadu)
- [ ] Karta "Pozvánky" v privátní sekci → předělat na **správu uživatelů / schvalování registrací**
- [ ] Až budou účty funkční, invite kódy zrušit (login tab "Pozvánka", `/api/invite`, KV `INVITES`)
- [ ] Zálivka per uživatel — sloupec `owner_id` v `plants` (+ filtr ve všech `/api/zalivka` dotazech)
- [ ] Spirála per uživatel — přesun z localStorage do D1 s `owner_id` (dnes jen v jednom prohlížeči)
- [ ] Rozhodnout u gekonů: zůstanou jen moje (skrýt pro user účty), nebo i read-only / sdílené

## Vylepšení (rozhodnuto pozdějc)

### Bezpečnost
- [ ] Rate limiting na `/api/login` — KV počítadlo per-IP, 5 pokusů / min, pak 429
- [ ] `public/_headers` se security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) — Cloudflare to nepřidá samo
- [ ] HMAC-signed session cookie místo `hub_auth=1` flagu (overkill pro single-user, ale čistší)

### Výkon
- [ ] Route-level code splitting přes `React.lazy()` — bundle je 418 kB, většinu nepotřebuje homepage návštěvník
- [ ] Preconnect + preload Google Fonts v `index.html` (eliminuje FOIT)
- [ ] Optimalizovat `uvd-icon.png` (SVG/WebP)

### UX / A11y
- [ ] `<MotionConfig reducedMotion="user">` — respektovat `prefers-reduced-motion`
- [ ] Error Boundary s decent fallback komponentou
- [ ] Skeleton states (InvitesPage „Načítám…" a budoucí datafetch)

### Dev tooling
- [ ] ESLint + Prettier + `prettier-plugin-tailwindcss`
- [ ] GitHub Actions CI — `npm run build` + `tsc --noEmit` na PR/push
- [ ] Husky + lint-staged pre-commit hook
- [ ] Refactor opakujících se patternů do `<Card>` a `<NoiseTextureBg>` (až budou víc než 4 stránky)

### SEO / observability
- [ ] Cloudflare Web Analytics snippet (privacy-first, no cookies) — registrovat v dashboardu, snippet do `index.html`
- [ ] Aktualizovat `public/sitemap.xml` `lastmod` při větších změnách (manuálně nebo přes build skript)

## Nápady / budoucnost
- [ ] ~~Invite kódy — single-use varianta~~ (odpadá, nahradí je účty se schválením)
- [ ] Zobrazit datum posledního použití kódu
- [ ] Více privátních appek v sekci
- [ ] Stats / activity feed na PrivatePage napojený na reálná data (Polymarket signals)
- [ ] Theme switcher dark/light (`theme.css` už má `.dark` selektor)
- [ ] WebSocket live updates pro Polymarket dashboard (CF Workers WS)
- [ ] Recharts vizualizace signálů na polymarket dashboardu
