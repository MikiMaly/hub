# mmaly.cz hub

Osobní web na mmaly.cz: React + Vite + TypeScript + Tailwind 4, hosting Cloudflare Pages
(Pages Functions v `functions/`, KV, D1). Gekos je git submodul (`gekos/`, vlastní repo).
Podrobnosti o struktuře, deployi a auth jsou v `README.md`, plán v `TODO.md`.

Jazyk: UI texty, komentáře i commity česky.

## Publikum

- `/` je vizitka pro veřejnost a potenciální zaměstnavatele: profesionálně, bez osobních
  údajů a bez lokality, z privátní sekce nanejvýš zamčené názvy modulů.
- `/private/*` je hlavně pro mě (admin). Ostatní jen se schváleným účtem, vidí jen
  povolené moduly a jen svoje data.

## Vizuální identita 2.0 „Skleník" (závazné)

Plný popis: `design/identity-2.0.md`, živý vzorník: `/brand`.

- **Barvy jen přes tokeny.** Hex kódy existují jedině v `src/styles/theme.css` (blok
  „Paleta"). Ve třídách používej `primary`, `mint`, `aqua`, `raspberry`, `apricot`,
  `success`, `warning`, `danger`, `info` (např. `text-mint`, `bg-aqua/10`,
  `border-raspberry/25`). Nikdy přímé Tailwind barvy (`blue-500`, `red-600`, `amber-…`).
  Výjimky, kde hex musí být opsaný: `public/favicon.svg` a pruhy Spirály
  (`src/pages/SpiralaPage.tsx`, canvas). Při změně palety upravit i je.
- **Sémantika:** OK = zelená, brzy/varování = meruňka, urgentní/chyba/mazání = malina,
  voda/info/odkazy/focus = akvamarín, admin věci = malina.
- **Komponenty:** stránku stav z `.hub-page` + `TopBar` / `PageHeader` / `SiteFooter`
  (`src/ui/brand.tsx`) a obsah z tříd `.hub-card`, `.hub-btn-*`, `.hub-input`,
  `.hub-pill-*`, `.hub-chip`, `.hub-icon-tile`, `.hub-eyebrow`, `.hub-label`,
  `.hub-segment`, `.hub-toast` (definice v `theme.css`). Nové vzory přidávej do
  `theme.css`, ne inline do stránky.
- **Typografie:** nadpisy Space Grotesk (`.hub-title`, `.hub-display`), text Inter,
  popisky a kódy JetBrains Mono (`.hub-label`, `.hub-eyebrow`, `.hub-chip`).
- **Podpis:** malinová tečka (`mmaly.cz`, nadpisy typu `Ahoj.`), střídmě.
- Platby (`PaymentsPage.tsx`) a Polymarket (`public/private/polymarket.html`) ještě
  nejsou v nové identitě; při funkčním předělání je převést.

## Submodul gekos

Gekos UI se kompiluje v hubu, ale má vlastní typecheck, takže nesmí importovat React
komponenty z hubu. Používá jen CSS třídy `.hub-*` a vlastní `GeckoShell`. Změna v gekos =
commit a push v gekos repu, pak v hubu commit nového ukazatele submodulu.
