# Changelog — mmaly.cz hub

## [aktuální] — 2026-05-06
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
