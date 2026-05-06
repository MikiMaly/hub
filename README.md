# mmaly.cz — Hub

Osobní landing page na [mmaly.cz](https://mmaly.cz) s rozcestníkem na projekty a webové appky.

Hostováno na **Cloudflare Pages**. Privátní sekce chráněna heslem přes Cloudflare Pages Functions.

---

## Struktura

```
├── index.html              ← Hlavní landing page (veřejná)
├── login.html              ← Přihlašovací stránka
├── private/
│   └── index.html          ← Privátní sekce (chráněná)
├── css/style.css
├── js/
│   ├── main.js             ← Seznam appek — UPRAV ZDE
│   └── login.js
├── functions/
│   ├── _middleware.js      ← Chrání /private/* (server-side)
│   └── api/
│       ├── login.js        ← POST /api/login
│       └── logout.js       ← POST /api/logout
└── wrangler.toml           ← Cloudflare konfigurace
```

---

## Přidání appky

### Veřejná appka
Otevři `js/main.js` a přidej do pole `PUBLIC_APPS`:

```js
{
  title: "Název appky",
  desc: "Co appka dělá.",
  url: "https://app.mmaly.cz",
  icon: "🚀",     // emoji nebo text
  tag: "python",  // technologie / label
}
```

### Privátní appka
Otevři `private/index.html` a přidej HTML kartu do `<div id="privateGrid">`:

```html
<a href="https://privatni.mmaly.cz" class="card card--link" target="_blank" rel="noopener">
  <div class="card-icon">🔒</div>
  <h3 class="card-title">Název</h3>
  <p class="card-desc">Popis appky.</p>
  <div class="card-footer">
    <span class="card-tag">python</span>
    <svg class="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </div>
</a>
```

---

## Nasazení: krok za krokem

### 1. Cloudflare Pages projekt

1. Jdi na **[dash.cloudflare.com](https://dash.cloudflare.com)** → Workers & Pages → **Create**
2. Záložka **Pages** → **Connect to Git** → vyber `MikiMaly/hub`
3. Build settings:
   - Framework preset: `None`
   - Build command: *(prázdné)*
   - Build output directory: `/` nebo `.` (prázdné)
4. Klikni **Save and Deploy** — první deploy proběhne z `main` větve

### 2. Nastavení hesla (Secret)

V Cloudflare Pages projektu → **Settings → Environment variables**:

| Variable name | Type | Value |
|---|---|---|
| `HUB_PASSWORD` | **Secret** | tvoje heslo |

Nastav pro obě prostředí (Production + Preview).

### 3. Doména mmaly.cz

> Předpoklad: doména mmaly.cz je přidána v Cloudflare jako zóna (Nameservery přesměrovány na Cloudflare).

1. V Pages projektu → **Custom domains** → **Set up a custom domain**
2. Zadej `mmaly.cz` → Cloudflare automaticky přidá DNS záznamy
3. Přidej i `www.mmaly.cz` a nastav redirect `www` → `mmaly.cz`:
   - DNS → přidej CNAME: `www` → `mmaly.cz` (proxied)
   - Rules → Redirect Rules → `www.mmaly.cz/*` → `https://mmaly.cz/$1` (301)

### 4. Subdomény pro jednotlivé appky

Každá appka žije ve svém vlastním Cloudflare Pages projektu (nebo Workers).
Subdoména se nastaví jednoduše:

**A) Appka je na Cloudflare Pages:**
1. V Pages projektu té appky → **Custom domains** → přidej `appka.mmaly.cz`
2. Cloudflare automaticky přidá CNAME záznam

**B) Appka běží jinde (VPS, Railway, Render...):**
1. DNS v Cloudflare → **Add record**:
   ```
   Type:  CNAME
   Name:  appka
   Target: appka.railway.app   (nebo jiný hostname)
   Proxy: záleží — pokud chceš Cloudflare proxy (ochrana/cache), zapni; jinak vypni
   ```

**Příklady subdomén:**
```
mmaly.cz          → hub (tento repo)
chat.mmaly.cz     → chat appka
admin.mmaly.cz    → admin panel (privátní)
api.mmaly.cz      → backend API
```

### 5. GitHub Secrets pro Actions deploy

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Kde ho najdeš |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → template "Edit Cloudflare Pages" |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → pravý sidebar → Account ID |

---

## Lokální vývoj

```bash
# Vytvoř soubor s heslem (není v gitu)
echo "HUB_PASSWORD=moje-heslo" > .dev.vars

# Spusť lokální server s Functions
npx wrangler pages dev .
```

Otevři [http://localhost:8788](http://localhost:8788).

---

## Auth architektura

```
Přihlášení → POST /api/login → nastaví 2 cookies:
  hub_auth=1  (HttpOnly)  → čte middleware, chrání /private/*
  hub_ui=1    (JS-readable) → čte main.js, zobrazí admin odkaz v UI

Middleware (_middleware.js) → při každém requestu na /private/*
  zkontroluje hub_auth cookie (server-side)
  → pokud chybí: redirect na /login.html
  → pokud existuje: propustí dál
```
