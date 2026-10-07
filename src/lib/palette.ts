// Ladění palety naživo (/brand). Přepsané barvy se ukládají do localStorage
// a aplikují na :root, takže platí na celém webu — ale jen v tomhle
// prohlížeči. Napevno se paleta mění v src/styles/theme.css (blok "Paleta").

const STORE = 'hub:palette-override:v1'

export type PaletteKey =
  | '--hub-green' | '--hub-green-deep' | '--hub-mint' | '--hub-aqua'
  | '--hub-raspberry' | '--hub-apricot'
  | '--hub-ink' | '--hub-ink-2' | '--hub-ink-3' | '--hub-ink-4'
  | '--hub-text' | '--hub-text-dim'

export type Palette = Record<PaletteKey, string>

export const PALETTE_KEYS: { key: PaletteKey; name: string; group: 'brand' | 'neutral' }[] = [
  { key: '--hub-green', name: 'Zelená', group: 'brand' },
  { key: '--hub-green-deep', name: 'Zelená tmavá', group: 'brand' },
  { key: '--hub-mint', name: 'Mint', group: 'brand' },
  { key: '--hub-aqua', name: 'Akvamarín', group: 'brand' },
  { key: '--hub-raspberry', name: 'Malina', group: 'brand' },
  { key: '--hub-apricot', name: 'Meruňka', group: 'brand' },
  { key: '--hub-ink', name: 'Pozadí', group: 'neutral' },
  { key: '--hub-ink-2', name: 'Karta', group: 'neutral' },
  { key: '--hub-ink-3', name: 'Input', group: 'neutral' },
  { key: '--hub-ink-4', name: 'Hover', group: 'neutral' },
  { key: '--hub-text', name: 'Text', group: 'neutral' },
  { key: '--hub-text-dim', name: 'Text tlumený', group: 'neutral' },
]

// Výchozí bod pro ladění. "Skleník" = to, co je teď v theme.css.
export const PRESETS: { name: string; note: string; palette: Palette }[] = [
  {
    name: 'Skleník',
    note: 'současná paleta',
    palette: {
      '--hub-green': '#22c55e', '--hub-green-deep': '#15803d', '--hub-mint': '#9ef0cc',
      '--hub-aqua': '#3ee0c3', '--hub-raspberry': '#e8336f', '--hub-apricot': '#f5a65b',
      '--hub-ink': '#070e0d', '--hub-ink-2': '#0c1715', '--hub-ink-3': '#12211e', '--hub-ink-4': '#1a2e2a',
      '--hub-text': '#e4f1ec', '--hub-text-dim': '#8ba59d',
    },
  },
  {
    name: 'Sytější',
    note: 'víc kontrastu a šťávy',
    palette: {
      '--hub-green': '#1ed760', '--hub-green-deep': '#109443', '--hub-mint': '#a8ffd9',
      '--hub-aqua': '#22f0cf', '--hub-raspberry': '#ff2a6d', '--hub-apricot': '#ffa043',
      '--hub-ink': '#040a09', '--hub-ink-2': '#0a1513', '--hub-ink-3': '#10201c', '--hub-ink-4': '#182e29',
      '--hub-text': '#eefaf5', '--hub-text-dim': '#90ada4',
    },
  },
  {
    name: 'Tlumený',
    note: 'klidnější, pastelovější',
    palette: {
      '--hub-green': '#45b874', '--hub-green-deep': '#2b7a4d', '--hub-mint': '#b9e6d2',
      '--hub-aqua': '#63cdb9', '--hub-raspberry': '#d4557d', '--hub-apricot': '#e2a774',
      '--hub-ink': '#0b1211', '--hub-ink-2': '#111b19', '--hub-ink-3': '#172522', '--hub-ink-4': '#20332f',
      '--hub-text': '#dde9e4', '--hub-text-dim': '#8a9f98',
    },
  },
  {
    name: 'Noční modř',
    note: 'pozadí do modra místo do zelena',
    palette: {
      '--hub-green': '#22c55e', '--hub-green-deep': '#15803d', '--hub-mint': '#9ef0cc',
      '--hub-aqua': '#3ee0c3', '--hub-raspberry': '#e8336f', '--hub-apricot': '#f5a65b',
      '--hub-ink': '#070b10', '--hub-ink-2': '#0d141b', '--hub-ink-3': '#131d26', '--hub-ink-4': '#1c2a36',
      '--hub-text': '#e6eef4', '--hub-text-dim': '#8c9db0',
    },
  },
]

export function loadOverride(): Partial<Palette> | null {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Partial<Palette>) : null
  } catch {
    return null
  }
}

export function applyPalette(p: Partial<Palette>): void {
  const root = document.documentElement
  for (const { key } of PALETTE_KEYS) {
    const v = p[key]
    if (v) root.style.setProperty(key, v)
    else root.style.removeProperty(key)
  }
}

export function saveOverride(p: Partial<Palette>): void {
  applyPalette(p)
  try {
    localStorage.setItem(STORE, JSON.stringify(p))
  } catch {
    /* bez úložiště platí jen do obnovení stránky */
  }
  window.dispatchEvent(new Event('hub:palette'))
}

export function clearOverride(): void {
  applyPalette({})
  try {
    localStorage.removeItem(STORE)
  } catch {
    /* nevadí */
  }
  window.dispatchEvent(new Event('hub:palette'))
}

/** Hodnota z theme.css (bez přepsání), pro porovnání a reset jedné barvy. */
export function basePalette(): Palette {
  return PRESETS[0].palette
}

// ---- kontrast (WCAG 2.x) ----------------------------------------------

function luminance(hex: string): number {
  const m = hex.replace('#', '')
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
