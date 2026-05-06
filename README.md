# mmaly.cz — Hub

Osobní landing page na [mmaly.cz](https://mmaly.cz) s rozcestníkem na projekty a webové appky.

Hostováno na **Cloudflare Pages**. Privátní sekce chráněna heslem přes Cloudflare Pages Functions.

## Struktura

```
├── index.html          # Hlavní landing page (veřejná)
├── login.html          # Přihlašovací stránka
├── private/
│   └── index.html      # Privátní sekce (chráněná)
├── css/
│   └── style.css
├── js/
│   ├── main.js         # Logika landing page + seznam appek
│   └── login.js
├── functions/
│   ├── _middleware.js  # Auth ochrana /private/*
│   └── api/
│       ├── login.js    # POST /api/login
│       └── logout.js   # POST /api/logout
└── .github/
    └── workflows/
        └── deploy.yml  # Auto-deploy na Cloudflare Pages
```

## Přidání appky

Otevři [js/main.js](js/main.js) a přidej objekt do pole `PUBLIC_APPS`:

```js
{
  title: "Název appky",
  desc: "Co appka dělá.",
  url: "https://...",
  icon: "🚀",
  tag: "python",
}
```

Pro privátní appky uprav [private/index.html](private/index.html) stejným způsobem.

## Deployment

### 1. Cloudflare Pages projekt
- Jdi na [Cloudflare Pages](https://pages.cloudflare.com/)
- **Create project → Connect to Git** → vyber `MikiMaly/hub`
- Build settings: Framework = `None`, Output directory = `/` (nebo prázdné)
- Přidej **Secret**: `HUB_PASSWORD` = tvoje heslo pro admin sekci

### 2. GitHub Secrets (pro Actions deploy)
Přidej do Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN` — API token z Cloudflare dashboardu (Permissions: Pages:Edit)
- `CLOUDFLARE_ACCOUNT_ID` — Account ID z Cloudflare dashboardu

### 3. Doména mmaly.cz
V Cloudflare Pages → Custom domains → přidej `mmaly.cz` a `www.mmaly.cz`.

## Lokální vývoj

```bash
npx wrangler pages dev .
```
