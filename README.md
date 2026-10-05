# mmaly.cz — Hub

Osobní landing page na [mmaly.cz](https://mmaly.cz) s rozcestníkem na projekty a webové appky.

Hostováno na **Cloudflare Pages**. Stack: **React + Vite + TypeScript + Tailwind 4 + Framer Motion**. Privátní sekce s uživatelskými účty (registrace se schválením adminem) přes Cloudflare Pages Functions a D1.

---

## Struktura

```
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx       ← Hlavní landing — UPRAV ZDE pro projekty
│   │   ├── LoginPage.tsx      ← /login (přihlášení + registrace)
│   │   ├── PrivatePage.tsx    ← /private (chráněná sekce)
│   │   ├── UsersPage.tsx      ← /private/users (admin: schvalování, moduly)
│   │   └── AccountPage.tsx    ← /private/account (změna hesla)
│   ├── lib/auth.ts            ← cookie helpers (getCookie, isAuthed, isAdmin)
│   ├── styles/                ← Tailwind + design tokens
│   ├── routes.tsx             ← React Router config
│   ├── App.tsx, main.tsx
├── public/
│   ├── _redirects             ← SPA fallback /* → /index.html 200
│   ├── favicon.png
│   └── uvd-icon.png
├── private/
│   └── polymarket.html        ← stará HTML stránka (port do React: TODO)
├── functions/
│   ├── _middleware.js         ← Chrání /private/* (server-side cookie check)
│   └── api/
│       ├── login.js           ← POST /api/login {username, password} → set-cookie
│       ├── logout.js          ← POST /api/logout
│       ├── register.js, me.js, users.js, spirala.js, account/password.js
│       ├── polymarket.js
│       └── signals.js
├── index.html                 ← SPA shell
├── package.json, vite.config.ts, tsconfig*.json
└── wrangler.toml              ← pages_build_output_dir = "dist"
```

---

## Lokální vývoj

```bash
npm install
npm run dev               # Vite na http://localhost:5173 (jen UI, bez API)
```

Pro lokální test **s Functions** (login, účty, D1):

```bash
npm run build
echo "HUB_PASSWORD=moje-heslo" > .dev.vars
npx wrangler pages dev dist     # http://localhost:8788
```

---

## Přidání appky

### Veřejná appka
Otevři [`src/pages/HomePage.tsx`](src/pages/HomePage.tsx) a přidej do pole `projects`:

```tsx
{
  id: 99,
  icon: '🚀',                       // emoji nebo '/cesta-k-ikoně.png'
  iconType: 'emoji',                // 'emoji' | 'image'
  title: 'Název appky',
  description: 'Co appka dělá.',
  tags: ['python'],
  status: 'public',
  gradient: 'from-blue-500/20 to-cyan-500/20',
  href: 'https://github.com/user/repo',
  downloads: [
    { label: 'Windows EXE', url: 'https://.../app-win64.zip' },
  ],
}
```

### Privátní appka
Otevři [`src/pages/PrivatePage.tsx`](src/pages/PrivatePage.tsx) a přidej do pole `cards`.

---

## Nasazení

### 1. Cloudflare Pages projekt

1. **[dash.cloudflare.com](https://dash.cloudflare.com)** → Workers & Pages → **Create** → **Pages** → **Connect to Git** → `MikiMaly/hub`
2. Build settings:
   - **Framework preset:** Vite (nebo None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist` (přepíše to i `wrangler.toml`)
   - **Node version:** `20` (přidej env var `NODE_VERSION=20`)

### 2. Secret + KV bindings

V Pages projektu → **Settings → Environment variables**:

| Variable | Type | Value |
|---|---|---|
| `HUB_PASSWORD` | Secret | tvoje admin heslo |
| `NODE_VERSION` | Plain | `20` |
| `BOT_SECRET` | Secret | (pro Polymarket bot) |

KV bindings (`Settings → Functions → KV namespace bindings`):

| Binding name | KV namespace |
|---|---|
| `SIGNALS` | HUB_SIGNALS |

### 3. Doména mmaly.cz

V Pages projektu → **Custom domains** → přidej `mmaly.cz` (a `www.mmaly.cz` s redirectem).

---

## Auth architektura

Uživatelské účty v D1 (tabulka `users`, schema si funkce zakládají samy, reference
`schema/users.sql`). Logika: `functions/_users.js`, podpis session: `functions/_auth.js`.

```
POST /api/register {username, password, note?}  → účet 'pending' (čeká na schválení)
POST /api/login    {username, password}          → session cookie
                ↓ úspěch nastaví:
                  hub_session=<payload>.<hmac>  (HttpOnly) — {uid, role, sv, exp}, HMAC-SHA256, klíč = HUB_PASSWORD
                  hub_ui=1 / hub_admin_ui=1      (JS read)  — jen UX nápověda pro klienta

functions/_middleware.js → /private/* a datová API
  - každý request ověří session proti D1: účet existuje, je 'active', session_version sedí
    (zablokování účtu nebo změna hesla tak platí okamžitě)
  - moduly: zalivka, spirala, geckos, polymarket — nový účet má zalivka + spirala,
    admin má všechno; cesta bez modulu → stránka 302 /private, API 403 JSON
  - jen admin: /private/users, /private/payments, /api/users, /api/payments
  - ověřený uživatel jde do funkcí v context.data.user
```

- **Hesla:** PBKDF2-SHA256, 100 000 iterací, 16 B sůl per účet; v DB jen hash.
- **Rate limit (D1 `login_attempts`):** login 10 / 15 min na jméno a 30 / 15 min na IP,
  registrace 5 / h na IP, max 20 čekajících účtů.
- **Data per uživatel:** Zálivka přes `plants.owner_id`, Spirála `spiral_state.user_id`.
  Gekoni jsou jen adminovi (modul geckos se dá povolit ručně, data jsou sdílená).
- **Správa:** `/private/users` (schválit, zablokovat, moduly, reset hesla na dočasné, smazat
  i s daty), `/private/account` (změna vlastního hesla, odhlásí ostatní zařízení).
- **Bootstrap admina:** dokud v DB není admin, přihlášení jménem (např. `miki`) a heslem
  `HUB_PASSWORD` založí admin účet a přiřadí mu dosavadní rostliny. Potom už `HUB_PASSWORD`
  nikoho nepřihlásí, zůstává jen podpisovým klíčem (pozor: jeho změna odhlásí všechny).
- **Zapomenuté admin heslo:** smazat admin řádek
  (`npx wrangler d1 execute gekos --remote --command "DELETE FROM users WHERE role='admin'"`),
  znovu bootstrap a pak převést rostliny na nové id:
  `UPDATE plants SET owner_id = <nové id> WHERE owner_id = <staré id>`.
- **Webhooky** (`/api/signals` POST, `/api/payment-proposals`) dál jedou na Bearer tokeny.
