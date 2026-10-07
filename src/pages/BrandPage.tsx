import { useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, Droplet, Key, Plus, RotateCcw, Trash2 } from 'lucide-react'
import {
  PALETTE_KEYS, PRESETS, basePalette, clearOverride, contrast, loadOverride, saveOverride,
  type Palette, type PaletteKey,
} from '../lib/palette'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { LogoMark, PageHeader, SiteFooter, TopBar, Wordmark } from '../ui/brand'

// Vzorník identity 2.0 ("Skleník"). Není nikde prolinkovaný, slouží k ladění
// palety: hex kódy se čtou živě z CSS proměnných, takže co je tady, to platí
// na celém webu. Panel "Ladění" přepisuje paletu jen v tomhle prohlížeči
// (lib/palette.ts); napevno se mění v theme.css.

const SWATCHES: { token: string; name: string; role: string }[] = [
  { token: '--hub-green', name: 'Zelená', role: 'značka, primární akce, stav OK' },
  { token: '--hub-mint', name: 'Mint', role: 'eyebrow, popisky, jemná zvýraznění' },
  { token: '--hub-aqua', name: 'Akvamarín', role: 'voda, info, odkazy, hover, focus' },
  { token: '--hub-raspberry', name: 'Malina', role: 'akcent, admin, chyba, "zalít teď"' },
  { token: '--hub-apricot', name: 'Meruňka', role: 'varování, "brzy"' },
  { token: '--hub-green-deep', name: 'Zelená tmavá', role: 'stisk, tmavé plochy značky' },
]

const NEUTRALS: { token: string; name: string }[] = [
  { token: '--hub-ink', name: 'Ink · pozadí' },
  { token: '--hub-ink-2', name: 'Ink 2 · karta' },
  { token: '--hub-ink-3', name: 'Ink 3 · input' },
  { token: '--hub-ink-4', name: 'Ink 4 · hover' },
  { token: '--hub-text-dim', name: 'Text dim' },
  { token: '--hub-text', name: 'Text' },
]

function useCssVar(token: string): string {
  const [v, setV] = useState('')
  useEffect(() => {
    const read = () => setV(getComputedStyle(document.documentElement).getPropertyValue(token).trim())
    read()
    window.addEventListener('hub:palette', read)
    return () => window.removeEventListener('hub:palette', read)
  }, [token])
  return v
}

const HEX_RE = /^#[0-9a-f]{6}$/i

// Kontrast textu na kartě (ink-2) a textu na zeleném tlačítku. WCAG AA:
// 4.5 pro běžný text, 3 pro velký text a ikony.
const CONTRAST_CHECKS: { fg: PaletteKey | 'btn'; bg: PaletteKey; label: string }[] = [
  { fg: '--hub-text', bg: '--hub-ink-2', label: 'Text na kartě' },
  { fg: '--hub-text-dim', bg: '--hub-ink-2', label: 'Tlumený text na kartě' },
  { fg: '--hub-mint', bg: '--hub-ink-2', label: 'Mint na kartě' },
  { fg: '--hub-aqua', bg: '--hub-ink-2', label: 'Akvamarín na kartě' },
  { fg: '--hub-green', bg: '--hub-ink-2', label: 'Zelená na kartě' },
  { fg: '--hub-raspberry', bg: '--hub-ink-2', label: 'Malina na kartě' },
  { fg: '--hub-apricot', bg: '--hub-ink-2', label: 'Meruňka na kartě' },
  { fg: 'btn', bg: '--hub-green', label: 'Text na zeleném tlačítku' },
]

function diffFromBase(p: Palette): Partial<Palette> {
  const base = basePalette()
  const out: Partial<Palette> = {}
  for (const { key } of PALETTE_KEYS) if (p[key].toLowerCase() !== base[key].toLowerCase()) out[key] = p[key]
  return out
}

function PaletteTuner() {
  const [p, setP] = useState<Palette>(() => ({ ...basePalette(), ...(loadOverride() ?? {}) }))
  const [drafts, setDrafts] = useState<Partial<Record<PaletteKey, string>>>({})
  const [copied, setCopied] = useState(false)

  const commit = (next: Palette) => {
    setP(next)
    const d = diffFromBase(next)
    if (Object.keys(d).length === 0) clearOverride()
    else saveOverride(d)
  }

  const setColor = (key: PaletteKey, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }))
    if (HEX_RE.test(value)) commit({ ...p, [key]: value.toLowerCase() })
  }

  const usePreset = (preset: Palette) => {
    setDrafts({})
    commit({ ...preset })
  }

  const reset = () => usePreset(basePalette())

  const text = PALETTE_KEYS.map(({ key, name }) => `${key}: ${p[key]};  /* ${name} */`).join('\n')
  const changed = Object.keys(diffFromBase(p)).length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* text je vidět níž, jde označit ručně */
    }
  }

  const row = (group: 'brand' | 'neutral') =>
    PALETTE_KEYS.filter((k) => k.group === group).map(({ key, name }) => {
      const base = basePalette()[key]
      const isChanged = p[key].toLowerCase() !== base.toLowerCase()
      return (
        <label key={key} className="hub-card p-3 flex items-center gap-3">
          <input
            type="color"
            value={p[key]}
            onChange={(e) => setColor(key, e.target.value)}
            className="w-12 h-12 shrink-0 rounded-lg cursor-pointer bg-transparent border border-border"
            aria-label={name}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              {name}
              {isChanged && <span className="hub-pill hub-pill-info">upraveno</span>}
            </div>
            <input
              value={drafts[key] ?? p[key]}
              onChange={(e) => setColor(key, e.target.value.trim())}
              onBlur={() => setDrafts((d) => ({ ...d, [key]: undefined }))}
              className="hub-input !min-h-8 !py-1 mt-1 font-mono text-xs"
              spellCheck={false}
            />
            {isChanged && <div className="hub-label mt-1 normal-case tracking-normal">původně {base}</div>}
          </div>
        </label>
      )
    })

  return (
    <section id="ladeni" className="mb-14 scroll-mt-20">
      <div className="hub-eyebrow mb-2">Ladění palety</div>
      <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
        Změny se hned projeví na celém webu, ale <b className="text-foreground">jen v tomhle prohlížeči</b>.
        Projdi si s nimi homepage, Zálivku i gekony, a až to sedí, zkopíruj paletu a pošli mi ji. Zapíšu ji
        napevno.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map((pr) => (
          <button key={pr.name} onClick={() => usePreset(pr.palette)} className="hub-btn hub-btn-sm hub-btn-ghost" title={pr.note}>
            <span className="flex -space-x-1">
              {(['--hub-green', '--hub-aqua', '--hub-raspberry', '--hub-ink-2'] as PaletteKey[]).map((k) => (
                <span key={k} className="w-3.5 h-3.5 rounded-full border border-border-strong" style={{ background: pr.palette[k] }} />
              ))}
            </span>
            {pr.name}
          </button>
        ))}
        <span className="flex-1" />
        <button onClick={reset} disabled={changed === 0} className="hub-btn hub-btn-sm hub-btn-quiet">
          <RotateCcw className="w-4 h-4" /> Vrátit paletu z webu
        </button>
        <button onClick={copy} className="hub-btn hub-btn-sm hub-btn-primary">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Zkopírováno' : 'Zkopírovat paletu'}
        </button>
      </div>

      <div className="hub-label mb-2">Barvy značky</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-5">{row('brand')}</div>
      <div className="hub-label mb-2">Pozadí a text</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-5">{row('neutral')}</div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="hub-card p-4">
          <div className="hub-label mb-3">Čitelnost (WCAG kontrast)</div>
          <ul className="space-y-1.5 text-sm">
            {CONTRAST_CHECKS.map((c) => {
              const fg = c.fg === 'btn' ? '#04110a' : p[c.fg]
              const r = contrast(fg, p[c.bg])
              const tone = r >= 4.5 ? 'hub-pill-ok' : r >= 3 ? 'hub-pill-warn' : 'hub-pill-danger'
              const verdict = r >= 4.5 ? 'OK' : r >= 3 ? 'jen velký text' : 'nečitelné'
              return (
                <li key={c.label} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded grid place-items-center text-[0.65rem] font-bold shrink-0" style={{ background: p[c.bg], color: fg }}>
                    Aa
                  </span>
                  <span className="flex-1">{c.label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.toFixed(1)}:1</span>
                  <span className={'hub-pill ' + tone}>{verdict}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="hub-card p-4">
          <div className="hub-label mb-3">K odeslání {changed > 0 ? `(změněno ${changed})` : '(beze změny)'}</div>
          <pre className="text-xs font-mono text-mint whitespace-pre-wrap leading-relaxed select-all">{text}</pre>
        </div>
      </div>
    </section>
  )
}

function Swatch({ token, name, role }: { token: string; name: string; role?: string }) {
  const hex = useCssVar(token)
  return (
    <div className="hub-card overflow-hidden">
      <div className="h-24" style={{ background: `var(${token})` }} />
      <div className="p-4">
        <div className="font-semibold">{name}</div>
        <div className="font-mono text-sm text-mint mt-0.5">{hex}</div>
        <div className="hub-label mt-1 normal-case tracking-normal">{token}</div>
        {role && <p className="text-xs text-muted-foreground mt-2">{role}</p>}
      </div>
    </div>
  )
}

export default function BrandPage() {
  useDocumentTitle('Identita 2.0 · mmaly.cz')

  return (
    <div className="hub-page">
      <TopBar section="identita 2.0" />
      <main className="hub-container max-w-6xl">
        <PageHeader
          back="/"
          backLabel="Domů"
          eyebrow="Vizuální identita"
          title={
            <>
              Skleník<span className="text-raspberry">.</span>
            </>
          }
          subtitle="Tmavé sklo v noci, uvnitř roste zeleň. Zelená vede, mint a akvamarín ji chladí, malina je jediný teplý akcent."
        />

        <PaletteTuner />

        <section className="mb-14">
          <div className="hub-eyebrow mb-4">Logo</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="hub-card p-8 grid place-items-center">
              <LogoMark size={96} />
            </div>
            <div className="hub-card p-8 grid place-items-center">
              <div className="flex items-center gap-3">
                <LogoMark size={44} />
                <Wordmark className="text-3xl" />
              </div>
            </div>
            <div className="hub-card p-6 text-sm text-muted-foreground leading-relaxed">
              Písmeno <b className="text-foreground">m</b> ze dvou oblouků jako klíčící výhonek v přechodu
              zelená → akvamarín → mint. Malinová tečka je tečka z <b className="text-foreground">mmaly.cz</b>{' '}
              a vrací se všude, kde se něco "dotečkuje": nadpisy, logo, akcent.
            </div>
          </div>
        </section>

        <section className="mb-14">
          <div className="hub-eyebrow mb-4">Barvy značky</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SWATCHES.map((s) => (
              <Swatch key={s.token} {...s} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="hub-card overflow-hidden">
              <div className="h-16" style={{ background: 'var(--hub-aurora)' }} />
              <div className="p-4 text-sm"><b>Aurora</b> · <span className="font-mono text-mint">--hub-aurora</span> · hero titulky, logo</div>
            </div>
            <div className="hub-card overflow-hidden">
              <div className="h-16" style={{ background: 'var(--hub-bloom)' }} />
              <div className="p-4 text-sm"><b>Bloom</b> · <span className="font-mono text-mint">--hub-bloom</span> · výjimečně, jen akcent</div>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <div className="hub-eyebrow mb-4">Neutrály</div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {NEUTRALS.map((s) => (
              <Swatch key={s.token} {...s} />
            ))}
          </div>
        </section>

        <section className="mb-14">
          <div className="hub-eyebrow mb-4">Typografie</div>
          <div className="hub-card p-6 sm:p-8 space-y-6">
            <div>
              <div className="hub-label mb-2">Display · Space Grotesk 700</div>
              <div className="hub-display text-5xl sm:text-6xl">
                Mikoláš <span className="hub-text-aurora">Malý</span>
                <span className="text-raspberry">.</span>
              </div>
            </div>
            <div>
              <div className="hub-label mb-2">Titulek · Space Grotesk 600</div>
              <div className="hub-title text-3xl">Privátní projekty</div>
            </div>
            <div>
              <div className="hub-label mb-2">Text · Inter 400 / 500</div>
              <p className="text-muted-foreground max-w-2xl">
                Interval mezi zálivkami je základ podle druhu násobený korekcemi za velikost a materiál
                květináče, světlo a roční období.
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="hub-label mb-2">Eyebrow · JetBrains Mono</div>
                <div className="hub-eyebrow">01 · Veřejné projekty</div>
              </div>
              <div>
                <div className="hub-label mb-2">Čísla · .hub-num</div>
                <div className="hub-num text-4xl font-semibold text-success">12 d</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <div className="hub-eyebrow mb-4">Komponenty</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="hub-card p-6 space-y-4">
              <div className="hub-label">Tlačítka</div>
              <div className="flex flex-wrap gap-2">
                <button className="hub-btn hub-btn-primary"><Plus className="w-4 h-4" /> Primary</button>
                <button className="hub-btn hub-btn-soft">Soft</button>
                <button className="hub-btn hub-btn-aqua"><Droplet className="w-4 h-4" /> Aqua</button>
                <button className="hub-btn hub-btn-ghost">Ghost</button>
                <button className="hub-btn hub-btn-quiet">Quiet</button>
                <button className="hub-btn hub-btn-danger"><Trash2 className="w-4 h-4" /> Danger</button>
              </div>
              <div className="hub-label pt-2">Stavy</div>
              <div className="flex flex-wrap gap-2">
                <span className="hub-pill hub-pill-ok">OK</span>
                <span className="hub-pill hub-pill-warn">Brzy</span>
                <span className="hub-pill hub-pill-danger">Zalít teď</span>
                <span className="hub-pill hub-pill-info">Info</span>
                <span className="hub-pill hub-pill-neutral">Neutrál</span>
                <span className="hub-chip">tag</span>
              </div>
              <div className="hub-label pt-2">Formulář</div>
              <div className="flex gap-2">
                <input className="hub-input" placeholder="Input s focus kroužkem v akvamarínu" />
                <div className="hub-segment shrink-0">
                  <button aria-pressed="true">A</button>
                  <button aria-pressed="false">B</button>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="hub-card hub-card-hover p-6 flex items-start gap-4">
                <div className="hub-icon-tile w-14 h-14 text-3xl">🪴</div>
                <div className="flex-1">
                  <div className="hub-title text-2xl">Karta appky</div>
                  <p className="text-sm text-muted-foreground mt-1">Najeď myší: hrana se rozsvítí akvamarínem.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-aqua" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="hub-card hub-edge-danger p-4">
                  <div className="hub-num text-3xl font-semibold text-danger">2</div>
                  <div className="hub-label mt-2">Zalít teď</div>
                </div>
                <div className="hub-card hub-edge-warn p-4">
                  <div className="hub-num text-3xl font-semibold text-warning">1</div>
                  <div className="hub-label mt-2">Brzy</div>
                </div>
                <div className="hub-card hub-edge-ok p-4">
                  <div className="hub-num text-3xl font-semibold text-success">9</div>
                  <div className="hub-label mt-2">V pohodě</div>
                </div>
              </div>
              <div className="hub-card p-4 flex items-center gap-3">
                <div className="hub-icon-tile hub-icon-tile-raspberry w-10 h-10"><Key className="w-4 h-4" /></div>
                <div className="text-sm">Admin věci nesou malinu.</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter note="identita 2.0" />
    </div>
  )
}
