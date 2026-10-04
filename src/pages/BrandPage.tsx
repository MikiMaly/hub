import { useEffect, useState } from 'react'
import { ArrowRight, Droplet, Key, Plus, Trash2 } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { LogoMark, PageHeader, SiteFooter, TopBar, Wordmark } from '../ui/brand'

// Vzorník identity 2.0 ("Skleník"). Není nikde prolinkovaný, slouží k ladění
// palety: hex kódy se čtou živě z CSS proměnných v theme.css, takže co je
// tady, to platí na celém webu.

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
    setV(getComputedStyle(document.documentElement).getPropertyValue(token).trim())
  }, [token])
  return v
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
          eyebrow="Vizuální identita · návrh"
          title={
            <>
              Skleník<span className="text-raspberry">.</span>
            </>
          }
          subtitle="Tmavé sklo v noci, uvnitř roste zeleň. Zelená vede, mint a akvamarín ji chladí, malina je jediný teplý akcent."
        />

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
                Stavím věci, <span className="hub-text-aurora">co rostou.</span>
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
