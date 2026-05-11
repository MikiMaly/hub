# Changelog — mmaly.cz hub

## [react-port] — 2026-05-11
### Přidáno
- Plný port na **React + Vite + TypeScript + Tailwind 4 + Framer Motion** podle Figma „Enhanced Landing Page Design"
- Nová HomePage — animované gradient orby, parallax scroll, glassmorphism karty, tech ikony (Linux/CLI/Cloud/Code)
- Nová LoginPage — shield ikona, tabs Heslo/Pozvánka, eye toggle, animovaný spinner, napojeno na původní `/api/login`
- Nová PrivatePage — sticky nav, hero s orbem, full-width projekt karty, admin link pouze pro admina
- Nová InvitesPage v novém designu — tabulka kódů, copy-to-clipboard, animovaný success banner, mazání s confirmem
- Vite SPA build do `dist/`, SPA fallback v `public/_redirects`
- React Router 7 routy: `/`, `/login`, `/private`, `/private/invites`
- Klientský auth helper `src/lib/auth.ts` (getCookie/isAuthed/isAdmin/logout)

### Změněno
- `wrangler.toml`: `pages_build_output_dir = "dist"` (Vite build output)
- `functions/_middleware.js`: redirect `/login.html` → `/login` (React Router routa)
- README přepsán pro nový stack

### Odstraněno
- `index.html` (vanilla landing), `login.html`, `private/index.html`, `private/invites.html`
- `css/style.css`, `js/main.js`, `js/login.js`, `assets/` (přesunuto do `public/`)

### Pozn.
- Cloudflare Pages dashboard musí mít nastaveno: Build command `npm run build`, Output `dist`, `NODE_VERSION=20`
- `private/polymarket.html` zůstává jako stará HTML stránka — port do React v dalším PR

---

## [invites] — 2026-05-06
### Přidáno
- Multi-user invite kód systém — tab Heslo / Pozvánka na login stránce
- `/api/invite` endpoint — CRUD pro správu kódů (GET/POST/DELETE, chráněno admin heslem)
- `/private/invites.html` — admin stránka pro správu pozvánek
- Cloudflare KV binding `INVITES` pro ukládání invite kódů
- Admin-only přístup ke správě pozvánek — `hub_admin` cookie odděluje admina od invite uživatelů
- Karta "Správa pozvánek" viditelná pouze pro admina

### Opraveno
- Logout nyní maže i `hub_admin` a `hub_admin_ui` cookies

---

## [initial] — dříve
### Přidáno
- Veřejné appky — karta Ultimate Video Downloader s download tlačítky (Windows EXE, macOS DMG)
- Privátní sekce chráněná heslem (`HUB_PASSWORD` secret)
- Login stránka s přesměrováním
- Middleware ochrana `/private/*` routes
- Cloudflare Pages deployment
