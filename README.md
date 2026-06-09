# mmaly.cz — Hub

Osobní landing page na [mmaly.cz](https://mmaly.cz) s rozcestníkem na projekty a webové appky.

Hostováno na **Cloudflare Pages**. Stack: **React + Vite + TypeScript + Tailwind 4 + Framer Motion**. Privátní sekce chráněna heslem přes Cloudflare Pages Functions a invite-kód systém v KV.

---

## Struktura

```
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx       ← Hlavní landing — UPRAV ZDE pro projekty
│   │   ├── LoginPage.tsx      ← /login (heslo + invite kód)
│   │   ├── PrivatePage.tsx    ← /private (chráněná sekce)
│   │   └── InvitesPage.tsx    ← /private/invites (admin)
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
│       ├── login.js           ← POST /api/login {password|code} → set-cookie
│       ├── logout.js          ← POST /api/logout
│       ├── invite.js          ← GET/POST/DELETE /api/invite (KV-backed)
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

Pro lokální test **s Functions** (login, invite, KV):

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
| `INVITES` | HUB_INVITES |
| `SIGNALS` | HUB_SIGNALS |

### 3. Doména mmaly.cz

V Pages projektu → **Custom domains** → přidej `mmaly.cz` (a `www.mmaly.cz` s redirectem).

---

## Auth architektura

```
POST /api/login {password}   → admin
POST /api/login {code}       → invite code (KV lookup)
                ↓ úspěch nastaví:
                  hub_session=<payload>.<hmac>  (HttpOnly) — podepsaná session, nese roli (admin/user) + expiraci
                  hub_ui=1                      (JS read)  — client UX gate
                  hub_admin_ui=1                (JS read)  — admin UI hint (jen pro password login)

functions/_auth.js — podpis a ověření session (HMAC-SHA256, klíč = HUB_PASSWORD)
  ⚠ změna HUB_PASSWORD odhlásí všechny přihlášené (admin i invite)

functions/_middleware.js → /private/*
  - bez platné hub_session → 302 /login?from=...
  - /private/invites bez role admin → 302 /private
```

API endpointy (`/api/payments`, `/api/signals` GET, `/api/invite`) ověřují tutéž podepsanou
session. Webhooky (`/api/signals` POST, `/api/payment-proposals`) používají Bearer tokeny.
Klientský guard (`src/lib/auth.ts`) čte `hub_ui` / `hub_admin_ui` pro UX. Reálný gate je server middleware.
