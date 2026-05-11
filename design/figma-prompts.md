# Figma / AI prompty pro mmaly.cz design assety

Co tady chybí: **favicon (MM monogram)** a **Open Graph image (1200×630)**. Tady jsou
prompty laděné pro Figma Make / Figma AI a obecné image-gen modely. Brand kontext
níže používej v každém promptu, ať si modely nemusí vymýšlet vlastní paletu.

---

## Brand kontext (kopíruj do každého promptu)

```
Brand: mmaly.cz — personal hub of Mikoláš Malý (IT Professional, Linux admin,
       Software Developer, Cloud Engineer).

Visual identity:
  - Dark, modern, technical, with subtle glassmorphism
  - Background:  #0a0e1a  (near-black blue)
  - Card / surface: #131825
  - Primary accent: #22c55e (Tailwind green-500)
  - Secondary accent: #3b82f6 (Tailwind blue-500) — used very sparingly
  - Text on dark: #e5e7eb
  - Muted text: #94a3b8

Typography:
  - Headlines: Inter, weight 700, tight leading
  - Body / UI: Inter, weight 400–500
  - Code / monospace: JetBrains Mono

Style cues (already used across the site):
  - Soft animated gradient orbs (green + blue, blurred ~120px)
  - Subtle 60px square grid mask, very low opacity
  - Fine SVG fractal-noise texture overlay (~5–10% opacity, overlay blend)
  - Rounded corners (radius 12–24px)
  - Lots of negative space, no hard borders — uses rgba(255,255,255,0.1)
```

---

## 1. Favicon — MM monogram

### Specifikace
- **Format**: SVG (vector master) → exporty `favicon.png` 32×32, `favicon-192.png`,
  `favicon-512.png`, `apple-touch-icon.png` 180×180
- **Použití**: prohlížečový tab, PWA, fallback OG image
- **Critical constraint**: musí být čitelné v 16×16 — žádné jemné detaily, gradient
  jen pokud nezničí čitelnost; testovat zmenšením

### Figma Make / Figma AI prompt (EN)

```
Design a square app icon for "mmaly.cz" personal developer hub.

Layout:
  - 512×512 canvas, central glyph reading "MM" (two capital M letters)
  - "MM" rendered in Inter Bold, custom-tracked tight so the letters
    almost touch; or a custom ligature where the two M's share their
    middle leg
  - Glyph fills ~60% of the canvas, centered, generous padding

Container:
  - Rounded square background, corner radius ~22% of side (iOS-style)
  - Background: solid #0a0e1a OR a subtle linear gradient from #0a0e1a
    (top-left) to #131825 (bottom-right)
  - Optional: 1px inner stroke at rgba(34,197,94,0.15) for definition

Glyph color:
  - Solid #22c55e
  - OR a vertical linear gradient #22c55e → #16a34a for slight depth
  - No outer glow (it disappears at 16×16)

Constraints:
  - Must remain legible at 16×16 — no fine strokes under 12px at canvas size
  - No noise texture, no grid, no decorative elements — just glyph + container
  - Provide both light-on-dark (primary) and dark-on-light (secondary) variants

Deliver as SVG with named layers: "Background", "Glyph".
```

### Image-gen prompt (Midjourney / DALL-E / Firefly)

```
Minimalist app icon, "MM" monogram, two capital letter M's interlocked,
flat vector design, vibrant emerald green #22c55e glyph on near-black
#0a0e1a rounded-square background, iOS-style 22% corner radius,
Inter Bold typography, centered, generous padding, no shadows, no glow,
no noise, clean and readable at 16x16 pixels, professional developer
brand mark, vector style --ar 1:1 --style raw
```

---

## 2. Open Graph image — link preview

### Specifikace
- **Rozměry**: 1200×630 px (Twitter Summary Large Image / Facebook OG)
- **Format**: PNG nebo high-quality JPG (~150–250 KB)
- **Použití**: `<meta property="og:image">` v `index.html`, zobrazí se v Discord,
  Slack, X, LinkedIn, Facebook
- **Critical constraint**: čitelné při zmenšení na ~320×167 (Discord embed) —
  centrální text nesmí být menší než 60px v 1200×630 originále

### Figma Make / Figma AI prompt (EN)

```
Design an Open Graph social preview image for "mmaly.cz", a personal hub
of a software engineer.

Canvas: 1200×630 px, full-bleed dark background #0a0e1a.

Layered composition (back to front):
  1. Background fill #0a0e1a
  2. Two animated-style gradient orbs (rendered static):
     - Top-left:    400×400 circle, fill #22c55e at 20% opacity, blur 120px
     - Bottom-right: 400×400 circle, fill #3b82f6 at 20% opacity, blur 120px
  3. Faint 60px square grid pattern over the full canvas, lines at
     rgba(34,197,94,0.08), 1px thick, masked by an elliptical fade
     (80% width, 50% height, centered) — same as the site hero
  4. Fine fractal-noise texture overlay, ~8% opacity, blend mode "overlay"
  5. Content (centered horizontally, vertically centered as a group):
     - Small pill badge, top of group: rounded-full, bg rgba(34,197,94,0.10),
       1px border rgba(34,197,94,0.20), 12px vertical padding, 24px horizontal.
       Inside: small sparkle/dot icon + text "Mikoláš Malý" in #22c55e,
       Inter Medium 24px
     - Headline (largest): "mmaly.cz"
       Font: Inter Bold, ~140px
       Color: linear gradient text fill, left-to-right #e5e7eb → #22c55e
     - Subline: "IT Professional · Linux admin · SW dev · Cloud Engineer"
       Font: Inter Regular, 36px
       Color: #94a3b8 (muted); the four role labels in #22c55e

Padding:
  - 80px from all edges to content
  - Group is visually centered, but slightly higher than geometric center
    (about 45% from top) — leaves breathing room for the platform's UI
    overlay (Discord adds title bar at bottom)

Constraints:
  - No logo mark needed (the homepage IS the brand). Optional: tiny MM
    monogram top-left at 64×64 if delivered as a variant
  - Avoid placing anything critical in the bottom 80px (often cropped)
  - Test legibility at 320×167 — headline must read clearly
```

### Image-gen prompt (Midjourney / DALL-E / Firefly)

Image-gen modely si neporadí s přesným textem. Tenhle prompt vygeneruje **pozadí**;
text se musí doplnit přes Figma / Photoshop / Canva top layer.

```
Dark futuristic developer brand background, near-black #0a0e1a base,
soft glowing emerald green orb top-left, soft glowing blue orb bottom-right,
both heavily blurred and bokeh-like, subtle thin green grid pattern overlay
fading to edges, fine film grain noise, glassmorphism atmosphere,
minimalist, professional, no text, no logos, ultra-clean composition,
plenty of negative space in the center for typography overlay
--ar 1200:630 --style raw --quality 2
```

Pak v Figmě / editoru přidej text layer s headline "mmaly.cz" + subline (viz
Figma prompt výše).

---

## Workflow doporučení

1. **Vygeneruj favicon první** — odsud máš MM glyph který se dá použít i v OG
   image jako malý mark vlevo nahoře.
2. **Exportuj favicon** ve 4 velikostech, dej do `public/`:
   - `favicon.svg` (master)
   - `favicon.png` (32×32) — přepíše stávající
   - `favicon-192.png`, `favicon-512.png` (pro PWA manifest, až bude)
   - `apple-touch-icon.png` (180×180)
3. **Aktualizuj `index.html`**:
   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
   ```
4. **OG image** — exportuj jako `og.png` (1200×630), dej do `public/og.png`,
   aktualizuj `<meta property="og:image" content="https://mmaly.cz/og.png" />`
5. Otestuj sdílení přes [opengraph.xyz](https://www.opengraph.xyz/) nebo
   Twitter Card Validator / Facebook Sharing Debugger.
