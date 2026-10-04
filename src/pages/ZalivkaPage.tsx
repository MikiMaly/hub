import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Droplet, Plus, Sprout, Trash2 } from 'lucide-react'
import { isAuthed } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'

// Port prototypu "Zálivka" (artefakt z 28. 7. 2026) do hubu. Výpočetní model
// je zachovaný 1:1, jen je přepsaný do Reactu a obarvený theme tokeny hubu.
//
// POZOR: data žijou v localStorage, tedy per prohlížeč. Na mobilu uvidíš jiné
// rostliny než na desktopu a smazaná data se nevrátí. Na trvalé úložiště to
// chce D1 tabulky + Pages Functions, stejně jako to má gekos.

const DAY = 86_400_000
const STORAGE_KEY = 'zalivka.v1'

type SpeciesKey =
  | 'sukulent' | 'kaktus' | 'stredomorska' | 'tropicka'
  | 'orchidej' | 'kapradina' | 'bylinka'
type MaterialKey = 'terakota' | 'plast' | 'glazura'
type LightKey = 'slunce' | 'neprime' | 'polostin' | 'stin'
type Status = 'over' | 'soon' | 'ok'

// base = dny mezi zálivkami ve vegetační sezóně
// frac = podíl objemu substrátu, který padne na jednu zálivku
const SPECIES: Record<SpeciesKey, { label: string; short: string; base: number; frac: number }> = {
  sukulent:     { label: 'Sukulent / tučnolist',                    short: 'Sukulent',      base: 14, frac: 0.10 },
  kaktus:       { label: 'Kaktus',                                  short: 'Kaktus',        base: 16, frac: 0.10 },
  stredomorska: { label: 'Středomořská (rozmarýn, oliva)',           short: 'Středomořská', base: 9,  frac: 0.13 },
  tropicka:     { label: 'Tropická pokojovka (monstera, potos)',     short: 'Tropická',      base: 6,  frac: 0.15 },
  orchidej:     { label: 'Orchidej',                                short: 'Orchidej',      base: 8,  frac: 0.12 },
  kapradina:    { label: 'Kapradina / vlhkomilná (calathea)',        short: 'Kapradina',     base: 3,  frac: 0.20 },
  bylinka:      { label: 'Bylinka (bazalka, petržel)',               short: 'Bylinka',       base: 2,  frac: 0.20 },
}

const MATERIALS: Record<MaterialKey, { label: string; f: number }> = {
  terakota: { label: 'Terakota', f: 0.85 },      // dýchá, schne rychleji
  plast:    { label: 'Plast', f: 1.0 },
  glazura:  { label: 'Glazovaná keramika', f: 1.1 },
}

const LIGHT: Record<LightKey, { label: string; f: number }> = {
  slunce:   { label: 'Přímé slunce (jih)', f: 0.8 },
  neprime:  { label: 'Světlo nepřímé', f: 1.0 },
  polostin: { label: 'Polostín', f: 1.15 },
  stin:     { label: 'Stín (sever)', f: 1.3 },
}

type Plant = {
  id: string
  name: string
  druh: SpeciesKey
  pot: number           // Ø květináče v cm
  mat: MaterialKey
  light: LightKey
  last: number          // timestamp poslední zálivky
  log: number           // kolikrát zalito celkem
}

function seasonInfo(month: number): { key: string; f: number } {
  if (month >= 5 && month <= 7) return { key: 'léto', f: 1.0 }
  if (month >= 2 && month <= 4) return { key: 'jaro', f: 1.1 }
  if (month >= 8 && month <= 10) return { key: 'podzim', f: 1.4 }
  return { key: 'zima', f: 1.9 }    // vegetační klid, zalévat výrazně méně
}

// Větší květináč = víc zásoby vody = delší interval.
function potFactor(d: number): number {
  if (d < 13) return 0.8
  if (d < 20) return 1.0
  if (d < 28) return 1.2
  return 1.4
}

type Computed = {
  interval: number
  ml: number
  due: Date
  days: number
  status: Status
  season: { key: string; f: number }
  f: { base: number; pot: number; mat: number; light: number; season: number }
}

function compute(p: Plant, now = new Date()): Computed {
  const s = seasonInfo(now.getMonth())
  const dr = SPECIES[p.druh]
  const interval = Math.max(
    1,
    Math.round(dr.base * potFactor(p.pot) * MATERIALS[p.mat].f * LIGHT[p.light].f * s.f),
  )

  // Objem substrátu ≈ π·(Ø/2)²·výška, výška ≈ 0.8·Ø. Z toho frac na zálivku,
  // zaokrouhleno na desítky ml — "zalít, dokud neodteče do misky".
  const volMl = Math.PI * (p.pot / 2) ** 2 * (0.8 * p.pot)
  const ml = Math.max(20, Math.round((volMl * dr.frac) / 10) * 10)

  const due = new Date(p.last + interval * DAY)
  const days = Math.ceil((due.getTime() - now.getTime()) / DAY)
  // Dnešní termín je stejně naléhavý jako prošlý — proto 0 padá do 'over'.
  const status: Status = days <= 0 ? 'over' : days <= 2 ? 'soon' : 'ok'

  return {
    interval, ml, due, days, status, season: s,
    f: { base: dr.base, pot: potFactor(p.pot), mat: MATERIALS[p.mat].f, light: LIGHT[p.light].f, season: s.f },
  }
}

function newId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function seedPlants(): Plant[] {
  const t = Date.now()
  return [
    { id: newId(), name: 'Monstera u okna',        druh: 'tropicka',  pot: 22, mat: 'plast',    light: 'neprime',  last: t - 6 * DAY, log: 6 },
    { id: newId(), name: 'Echeverie',              druh: 'sukulent',  pot: 11, mat: 'terakota', light: 'slunce',   last: t - 9 * DAY, log: 3 },
    { id: newId(), name: 'Kapradina v koupelně',   druh: 'kapradina', pot: 16, mat: 'plast',    light: 'polostin', last: t - 1 * DAY, log: 12 },
    { id: newId(), name: 'Bazalka',                druh: 'bylinka',   pot: 13, mat: 'plast',    light: 'slunce',   last: t - 2 * DAY, log: 8 },
    { id: newId(), name: 'Fíkus Benjamin',         druh: 'tropicka',  pot: 26, mat: 'glazura',  light: 'neprime',  last: t - 3 * DAY, log: 5 },
    { id: newId(), name: 'Orchidej Phalaenopsis',  druh: 'orchidej',  pot: 12, mat: 'plast',    light: 'neprime',  last: t - 5 * DAY, log: 9 },
  ]
}

function loadPlants(): Plant[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Plant[]) : null
  } catch {
    return null    // privátní okno, zakázané site data — jedeme dál bez historie
  }
}

function denWord(n: number): string {
  const a = Math.abs(n)
  if (a === 1) return 'den'
  if (a >= 2 && a <= 4) return 'dny'
  return 'dní'
}

function plantWord(n: number): string {
  if (n === 1) return 'rostlina'
  if (n >= 2 && n <= 4) return 'rostliny'
  return 'rostlin'
}

function relDays(t: number): string {
  const d = Math.floor((Date.now() - t) / DAY)
  if (d <= 0) return 'dnes'
  if (d === 1) return 'včera'
  // 7. pád, ne 2. — "před 9 dny", ne "před 9 dní" (denWord dává tvar pro "za N…").
  return `před ${d} dny`
}

const dayMonth = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' })

function whenText(c: Computed): string {
  if (c.days < 0) return `po termínu o ${Math.abs(c.days)} ${denWord(c.days)}`
  if (c.days === 0) return 'termín dnes'
  if (c.days === 1) return 'zítra'
  return `za ${c.days} ${denWord(c.days)}`
}

function bigText(c: Computed): string {
  if (c.days < 0) return `−${Math.abs(c.days)} d`
  if (c.days === 0) return 'dnes'
  return `${c.days} d`
}

const STATUS_LABEL: Record<Status, string> = { over: 'Zalít teď', soon: 'Brzy', ok: 'OK' }

const STATUS_PILL: Record<Status, string> = {
  over: 'bg-destructive/15 text-destructive',
  soon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  ok:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
}

const STATUS_BORDER: Record<Status, string> = {
  over: 'border-l-destructive',
  soon: 'border-l-amber-500',
  ok:   'border-l-emerald-500',
}

const STATUS_BIG: Record<Status, string> = {
  over: 'text-destructive',
  soon: 'text-amber-600 dark:text-amber-400',
  ok:   'text-emerald-600 dark:text-emerald-400',
}

export default function ZalivkaPage() {
  useDocumentTitle('Zálivka — mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [plants, setPlants] = useState<Plant[]>([])
  const [addOpen, setAddOpen] = useState(false)

  // formulář
  const [fName, setFName] = useState('')
  const [fDruh, setFDruh] = useState<SpeciesKey>('tropicka')
  const [fPot, setFPot] = useState('18')
  const [fMat, setFMat] = useState<MaterialKey>('plast')
  const [fLight, setFLight] = useState<LightKey>('neprime')

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/zalivka', { replace: true })
      return
    }
    // Prázdno, ne ukázka — rostliny si naklikám sám. Demo sedmikrásky
    // jsou pod tlačítkem v prázdném stavu, kdyby si chtěl někdo osahat výpočet.
    setPlants(loadPlants() ?? [])
    setReady(true)
  }, [navigate])

  const persist = useCallback((next: Plant[]) => {
    setPlants(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Úložiště nejde zapsat (privátní okno) — stav zůstane jen v paměti.
    }
  }, [])

  const season = useMemo(() => seasonInfo(new Date().getMonth()), [])

  const rows = useMemo(
    () =>
      plants
        .map((p) => ({ p, c: compute(p) }))
        .sort((a, b) => a.c.days - b.c.days),
    [plants],
  )

  const counts = useMemo(() => {
    let over = 0, soon = 0, ok = 0
    for (const { c } of rows) {
      if (c.status === 'over') over++
      else if (c.status === 'soon') soon++
      else ok++
    }
    return { over, soon, ok }
  }, [rows])

  const water = (id: string) => {
    persist(
      plants.map((p) =>
        p.id === id ? { ...p, last: Date.now(), log: (p.log ?? 0) + 1 } : p,
      ),
    )
  }

  const remove = (id: string) => {
    persist(plants.filter((p) => p.id !== id))
  }

  const add = () => {
    const pot = Number.parseInt(fPot, 10)
    const name = fName.trim() || SPECIES[fDruh].short
    persist([
      ...plants,
      {
        id: newId(),
        name,
        druh: fDruh,
        pot: Number.isFinite(pot) ? Math.min(60, Math.max(6, pot)) : 18,
        mat: fMat,
        light: fLight,
        last: Date.now(),
        log: 0,
      },
    ])
    setFName('')
    setAddOpen(false)
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/private')}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět
        </button>

        <header className="flex items-end justify-between gap-4 flex-wrap mb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-2xl shrink-0">
              🪴
            </div>
            <div>
              <h1 className="text-3xl" style={{ fontWeight: 600 }}>Zálivka</h1>
              <p className="text-sm text-muted-foreground">Kdy a kolik zalévat · trackování</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums px-3 py-1.5 rounded-full border border-border bg-card">
            období: <b className="text-primary">{season.key}</b> · násobič ×{season.f}
          </span>
        </header>

        <p className="text-xs text-muted-foreground mb-7">
          Data se ukládají v tomhle prohlížeči — na jiném zařízení uvidíš jiný seznam.
        </p>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          <Tile n={counts.over} k="Zalít teď" tone="over" />
          <Tile n={counts.soon} k="Brzy (1–2 dny)" tone="soon" />
          <Tile n={counts.ok} k="V pohodě" tone="ok" />
          <Tile n={plants.length} k="Rostlin celkem" tone="all" />
        </section>

        <div className="rounded-2xl border border-border bg-card mb-7">
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="flex items-center gap-2 w-full px-5 py-4 text-left"
            aria-expanded={addOpen}
          >
            <Plus className="w-4 h-4 text-primary shrink-0" />
            <span style={{ fontWeight: 600 }}>Přidat rostlinu</span>
            <span className="ml-auto text-muted-foreground">{addOpen ? '−' : '+'}</span>
          </button>

          {addOpen && (
            <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Název">
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                  placeholder="např. Monstera u okna"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                />
              </Field>
              <Field label="Druh">
                <select
                  value={fDruh}
                  onChange={(e) => setFDruh(e.target.value as SpeciesKey)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                >
                  {(Object.keys(SPECIES) as SpeciesKey[]).map((k) => (
                    <option key={k} value={k}>{SPECIES[k].label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ø květináče (cm)">
                <input
                  type="number" min={6} max={60}
                  value={fPot}
                  onChange={(e) => setFPot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm tabular-nums"
                />
              </Field>
              <Field label="Materiál">
                <select
                  value={fMat}
                  onChange={(e) => setFMat(e.target.value as MaterialKey)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                >
                  {(Object.keys(MATERIALS) as MaterialKey[]).map((k) => (
                    <option key={k} value={k}>{MATERIALS[k].label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Umístění / světlo">
                <select
                  value={fLight}
                  onChange={(e) => setFLight(e.target.value as LightKey)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                >
                  {(Object.keys(LIGHT) as LightKey[]).map((k) => (
                    <option key={k} value={k}>{LIGHT[k].label}</option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button
                  onClick={add}
                  className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Přidat rostlinu
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-base" style={{ fontWeight: 600 }}>Moje rostliny</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {plants.length} {plantWord(plants.length)}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Sprout className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Zatím žádné rostliny.
            </p>
            <button
              onClick={() => persist(seedPlants())}
              className="px-4 py-2 rounded-lg border border-border text-sm text-primary hover:bg-muted"
            >
              Načíst ukázku
            </button>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ p, c }, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={
                  'rounded-2xl bg-card border border-border border-l-4 p-5 flex flex-col gap-3 ' +
                  STATUS_BORDER[c.status]
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span
                    className={
                      'text-[0.68rem] uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ' +
                      STATUS_PILL[c.status]
                    }
                    style={{ fontWeight: 600 }}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{SPECIES[p.druh].short}</span>
                  <span className="tabular-nums">Ø {p.pot} cm</span>
                  <span>{MATERIALS[p.mat].label}</span>
                  <span>{LIGHT[p.light].label}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className={'text-2xl tabular-nums ' + STATUS_BIG[c.status]} style={{ fontWeight: 600 }}>
                    {bigText(c)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {whenText(c)} · {dayMonth.format(c.due)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground border-t border-dashed border-border pt-2.5 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Droplet className="w-3 h-3" />
                    <b className="text-primary">≈ {c.ml} ml</b>
                  </span>
                  <span>á {c.interval} {denWord(c.interval)}</span>
                  <span>✓ {p.log ?? 0}× zalito</span>
                </div>

                <details className="text-[0.7rem] text-muted-foreground">
                  <summary className="cursor-pointer">výpočet</summary>
                  <p className="mt-1.5 leading-relaxed tabular-nums">
                    {c.f.base} × {c.f.pot} (Ø) × {c.f.mat} (mat.) × {c.f.light} (světlo) ×{' '}
                    {c.f.season} ({c.season.key}) = <b className="text-foreground">{c.interval} {denWord(c.interval)}</b>{' '}
                    mezi zálivkami
                  </p>
                </details>

                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs text-muted-foreground">naposledy {relDays(p.last)}</span>
                  <span className="flex items-center gap-1">
                    <button
                      onClick={() => water(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 inline-flex items-center gap-1"
                      style={{ fontWeight: 600 }}
                    >
                      <Droplet className="w-3 h-3" /> Zalít
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Smazat ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              </motion.div>
            ))}
          </section>
        )}

        <details className="mt-8 rounded-2xl border border-border bg-secondary/40 px-5">
          <summary className="cursor-pointer py-4 text-sm" style={{ fontWeight: 600 }}>
            Jak modul počítá zálivku
          </summary>
          <div className="pb-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Interval mezi zálivkami je <b>základ podle druhu</b> násobený korekcemi za velikost
              a materiál květináče, světlo a roční období:
            </p>
            <p className="tabular-nums text-foreground">
              interval = základ × Ø-květináč × materiál × světlo × období
            </p>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-foreground mb-1">Základ (vegetační sezóna, dny)</h3>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Sukulent 14 · Kaktus 16 · Středomořská 9</li>
                <li>Tropická pokojovka 6 · Orchidej 8</li>
                <li>Kapradina / vlhkomilná 3 · Bylinka 2</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-foreground mb-1">Korekce</h3>
              <ul className="list-disc pl-5 space-y-0.5">
                <li><b>Ø květináče:</b> &lt;13 cm ×0.8 · 13–20 ×1.0 · 20–28 ×1.2 · &gt;28 ×1.4 — větší = víc zásoby vody</li>
                <li><b>Materiál:</b> terakota ×0.85 (dýchá, schne rychleji) · plast ×1.0 · glazura ×1.1</li>
                <li><b>Světlo:</b> přímé slunce ×0.8 · nepřímé ×1.0 · polostín ×1.15 · stín ×1.3</li>
                <li><b>Období:</b> léto ×1.0 · jaro ×1.1 · podzim ×1.4 · <b>zima ×1.9</b> — vegetační klid</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-foreground mb-1">Kolik vody</h3>
              <p>
                Objem substrátu ≈ π·(Ø/2)²·výška (výška ≈ 0.8·Ø), z toho 10 % u sukulentů až 20 %
                u kapradin a bylinek — tedy „zalít, dokud neodteče do misky".
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-foreground mb-1">Co dál</h3>
              <p>
                Až bude čidlo vlhkosti půdy (kapacitní senzor přes ESPHome/MQTT), plán se přepne
                z „podle kalendáře" na „podle reality": zaleje se, až vlhkost klesne pod práh,
                a interval zůstane jen jako predikce a pojistka.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

function Tile({ n, k, tone }: { n: number; k: string; tone: Status | 'all' }) {
  const color =
    tone === 'over' ? 'text-destructive'
    : tone === 'soon' ? 'text-amber-600 dark:text-amber-400'
    : tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-primary'
  const bar =
    tone === 'over' ? 'bg-destructive'
    : tone === 'soon' ? 'bg-amber-500'
    : tone === 'ok' ? 'bg-emerald-500'
    : 'bg-primary'
  return (
    <div className="relative rounded-2xl border border-border bg-card px-4 py-3.5 overflow-hidden">
      <span className={'absolute left-0 top-0 bottom-0 w-1 ' + bar} aria-hidden />
      <div className={'text-3xl tabular-nums leading-none ' + color} style={{ fontWeight: 600 }}>{n}</div>
      <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mt-2">{k}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
