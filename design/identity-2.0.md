# mmaly.cz 2.0 — vizuální identita „Skleník"

Stav: **schváleno** 5. 10. 2026. Přesné hex kódy palety se ještě doladí.
Závazná pravidla pro kód jsou shrnutá v `CLAUDE.md` hubu i gekos; tady je plný popis.
Živý vzorník: **`/brand`** (hex kódy čte přímo z CSS, takže vždy sedí).

## Koncept

Tmavé sklo v noci, uvnitř roste zeleň. Projekty, rostliny i gekoni jsou věci,
co rostou. Zelená vede, mint a akvamarín ji chladí, malina je jediný teplý
akcent. Žádné modré/fialové orby z verze 1, žádné náhodné Tailwind barvy.

## Publikum (ovlivňuje tón a obsah)

- **Veřejná landing page (`/`)** je pro veřejnost a potenciální zaměstnavatele.
  Profesionální vizitka: kdo jsem, co umím, veřejné projekty. Žádné osobní údaje
  ani lokalita (např. "Praha"), žádné soukromé věci z privátní sekce kromě
  zamčených názvů.
- **Privátní sekce (`/private`)** je primárně pro mě (admin).
  Tón může být osobní a neformální ("Ahoj. Co dnes?").
- **Ostatní lidé** se do privátní sekce dostanou jen s vlastním účtem, který
  schválím. Vidí jen moduly, které mají povolené, a jen svoje data.

## Paleta (jediný zdroj: `src/styles/theme.css`, blok „Paleta")

| Token | Hex (k doladění) | Role |
|---|---|---|
| `--hub-green` | `#22c55e` | značka, primární akce, stav OK (zachováno z v1) |
| `--hub-green-deep` | `#15803d` | stisk, tmavé plochy značky |
| `--hub-mint` | `#9ef0cc` | eyebrow, popisky, jemná zvýraznění, hover textu |
| `--hub-aqua` | `#3ee0c3` | akvamarín: voda, info, odkazy, focus, hover hran |
| `--hub-raspberry` | `#e8336f` | malina: akcent, admin, chyba, mazání, „hoří" |
| `--hub-apricot` | `#f5a65b` | meruňka: varování, „brzy" |
| `--hub-ink` … `--hub-ink-4` | `#070e0d` `#0c1715` `#12211e` `#1a2e2a` | pozadí, karta, input, hover |
| `--hub-text` / `--hub-text-dim` | `#e4f1ec` / `#8ba59d` | text / sekundární text |

Přechody: `--hub-aurora` (zelená → akvamarín → mint) pro hero a logo,
`--hub-bloom` (malina) jen výjimečně.

**Hex kódy jsou opsané ještě na dvou místech**, kde CSS proměnná nejde použít:
`public/favicon.svg` a barvy pruhů v `src/pages/SpiralaPage.tsx` (canvas).
Při ladění palety upravit i tam.

## Sémantika barev (pravidla)

- Stav: OK = `success` (zelená), brzy = `warning` (meruňka), urgentní/chyba = `danger` (malina), info/voda = `info` (akvamarín).
- Všechno o vodě (zálivka, mlžení, rosič) je akvamarín.
- Admin věci (pozvánky, platby, štítek admin) nesou malinu.
- V komponentách **nikdy** přímé Tailwind barvy (`blue-500`, `red-600`, `amber-…`).
  Jen tokeny: `text-mint`, `bg-aqua/10`, `border-raspberry/25`, `text-success`, `text-warning`, `text-danger`, `text-primary` …
- Výjimka: data (barva gekona `color_hex`) se kreslí, jak jsou.

## Typografie

- Display / nadpisy: **Space Grotesk** 600–700, těsný letter-spacing (`.hub-display`, `.hub-title`, h1–h3 automaticky)
- Text a UI: **Inter** 400–600
- Mono: **JetBrains Mono** pro kódy, štítky, `.hub-eyebrow` a `.hub-label` (uppercase, široké prostrkání)
- Čísla ve statistikách: `.hub-num` (tabulková čísla v display fontu)

## Podpisy identity

- **Malinová tečka**: `mmaly.cz` má tečku malinovou, hlavní nadpisy často končí malinovou tečkou (`Mikoláš Malý.`, `Skleník.`, `Ahoj. Co dnes?`). Střídmě, max 1× na obrazovku.
- **Eyebrow** nad sekcí: mono, uppercase, zelená svítící tečka (`.hub-eyebrow`, malinová varianta `.hub-eyebrow-raspberry`).
- **Skleněné tabule**: jemná mřížka 56 px s maskou nahoře + záře zelená/akvamarín/malina (`.hub-page`).
- **Logo**: „m" ze dvou oblouků jako výhonek v aurora přechodu, malinová tečka vpravo dole (`LogoMark`, `/favicon.svg`).

## Komponenty

CSS třídy (v `theme.css`, `@layer components`) — použitelné z hubu i submodulů:

| Třída | Použití |
|---|---|
| `.hub-page` | kořen každé stránky (pozadí, mřížka, záře) |
| `.hub-container` | šířka obsahu + gutter 16/24/40 px |
| `.hub-topbar` | sticky lišta |
| `.hub-card`, `.hub-card-hover` | karta (matné sklo), hover rozsvítí hranu akvamarínem |
| `.hub-edge-ok/warn/danger/info` | barevný proužek vlevo na stavové kartě |
| `.hub-btn` + `-primary/-soft/-aqua/-ghost/-quiet/-danger`, velikosti `-sm/-lg/-icon` | tlačítka |
| `.hub-input`, `.hub-input-lg` | inputy/selecty, focus kroužek akvamarín |
| `.hub-segment` | taby/filtry (aktivní tlačítko `aria-pressed`/`aria-selected="true"`) |
| `.hub-chip` | technický tag (mono) |
| `.hub-pill-ok/warn/danger/info/neutral` | stavový štítek |
| `.hub-icon-tile` (+ `-raspberry`, `-aqua`) | ikona appky/sekce |
| `.hub-eyebrow`, `.hub-label`, `.hub-title`, `.hub-display`, `.hub-num`, `.hub-text-aurora` | typografie |
| `.hub-back`, `.hub-divider`, `.hub-toast` | odkaz zpět, čárkovaný oddělovač, undo toast |

React (jen hub): `src/ui/brand.tsx` — `LogoMark`, `Wordmark`, `TopBar`, `PageHeader`, `SiteFooter`.
Gekos má vlastní `GeckoShell` složený z týchž CSS tříd (nemůže importovat z hubu kvůli vlastnímu typechecku).

## Kostra stránky

```tsx
<div className="hub-page">
  <TopBar section="privátní" actions={...} />
  <main className="hub-container">
    <PageHeader back="/private" icon="🪴" eyebrow="Rostliny" title="Zálivka" subtitle="..." aside={...} />
    ...karty .hub-card...
  </main>
  <SiteFooter />
</div>
```

## Mimo redesign (záměrně)

- Polymarket bot (`public/private/polymarket.html`) a Platby (`PaymentsPage.tsx`) zůstaly beze změny,
  předělají se funkčně rovnou podle této identity. Platby díky sdíleným tokenům už teď
  dědí nové barvy pozadí/karet/primární zelené (ne nové komponenty), Polymarket má
  vlastní `public/css/style.css` a nezměnil se vůbec.
