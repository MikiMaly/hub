import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Droplet, History, Plus, Sprout, Trash2 } from 'lucide-react'
import { isAuthed } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, TopBar } from '../ui/brand'

// Modul Zálivka. Výpočetní model pochází z prototypu (artefakt 28. 7. 2026)
// a je zachovaný 1:1; data ale žijou v D1 (tabulky plants a watering_events,
// viz schema/zalivka.sql), ne v localStorage — aby seznam seděl na mobilu
// i na desktopu a aby šlo zpětně vidět, jestli se interval dodržuje.

const DAY = 86_400_000

type SpeciesKey =
  | 'sukulent' | 'kaktus' | 'stredomorska' | 'tropicka'
  | 'orchidej' | 'kapradina' | 'bylinka'
type MaterialKey = 'terakota' | 'plast' | 'glazura'
type LightKey = 'slunce' | 'neprime' | 'polostin' | 'stin'
type Status = 'over' | 'soon' | 'ok'

// base = dny mezi zálivkami ve vegetační sezóně
// frac = podíl objemu substrátu, který padne na jednu zálivku
const SPECIES: Record<SpeciesKey, { label: string; short: string; base: number; frac: number }> = {
  sukulent:     { label: 'Sukulent / tučnolist',                short: 'Sukulent',     base: 14, frac: 0.10 },
  kaktus:       { label: 'Kaktus',                              short: 'Kaktus',       base: 16, frac: 0.10 },
  stredomorska: { label: 'Středomořská (rozmarýn, oliva)',       short: 'Středomořská', base: 9,  frac: 0.13 },
  tropicka:     { label: 'Tropická pokojovka (monstera, potos)', short: 'Tropická',     base: 6,  frac: 0.15 },
  orchidej:     { label: 'Orchidej',                            short: 'Orchidej',     base: 8,  frac: 0.12 },
  kapradina:    { label: 'Kapradina / vlhkomilná (calathea)',    short: 'Kapradina',    base: 3,  frac: 0.20 },
  bylinka:      { label: 'Bylinka (bazalka, petržel)',           short: 'Bylinka',      base: 2,  frac: 0.20 },
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
  id: number
  name: string
  species: SpeciesKey
  pot_cm: number
  material: MaterialKey
  light: LightKey
  created_at: string
  last_ts: string | null
  water_count: number
}

type WateringEvent = {
  id: number
  plant_id: number
  ts: string
  ml: number | null
  note: string | null
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
  due: Date | null        // null = rostlina ještě nebyla zalita
  days: number | null
  status: Status
  season: { key: string; f: number }
  f: { base: number; pot: number; mat: number; light: number; season: number }
}

function compute(p: Plant, now = new Date()): Computed {
  const s = seasonInfo(now.getMonth())
  const dr = SPECIES[p.species]
  const interval = Math.max(
    1,
    Math.round(dr.base * potFactor(p.pot_cm) * MATERIALS[p.material].f * LIGHT[p.light].f * s.f),
  )

  // Objem substrátu ≈ π·(Ø/2)²·výška, výška ≈ 0.8·Ø. Z toho frac na zálivku,
  // zaokrouhleno na desítky ml — "zalít, dokud neodteče do misky".
  const volMl = Math.PI * (p.pot_cm / 2) ** 2 * (0.8 * p.pot_cm)
  const ml = Math.max(20, Math.round((volMl * dr.frac) / 10) * 10)

  const f = {
    base: dr.base, pot: potFactor(p.pot_cm),
    mat: MATERIALS[p.material].f, light: LIGHT[p.light].f, season: s.f,
  }

  // Založení rostliny není zálivka, takže bez jediného zápisu je termín "hned".
  if (!p.last_ts) return { interval, ml, due: null, days: null, status: 'over', season: s, f }

  const due = new Date(new Date(p.last_ts).getTime() + interval * DAY)
  const days = Math.ceil((due.getTime() - now.getTime()) / DAY)
  // Dnešní termín je stejně naléhavý jako prošlý — proto 0 padá do 'over'.
  const status: Status = days <= 0 ? 'over' : days <= 2 ? 'soon' : 'ok'

  return { interval, ml, due, days, status, season: s, f }
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

function relDays(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  if (d <= 0) return 'dnes'
  if (d === 1) return 'včera'
  // 7. pád, ne 2. — "před 9 dny", ne "před 9 dní".
  return `před ${d} dny`
}

const dayMonth = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' })
const dayMonthTime = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

function whenText(c: Computed): string {
  if (c.days === null) return 'ještě nezalito'
  if (c.days < 0) return `po termínu o ${Math.abs(c.days)} ${denWord(c.days)}`
  if (c.days === 0) return 'termín dnes'
  if (c.days === 1) return 'zítra'
  return `za ${c.days} ${denWord(c.days)}`
}

function bigText(c: Computed): string {
  if (c.days === null) return '—'
  if (c.days < 0) return `−${Math.abs(c.days)} d`
  if (c.days === 0) return 'dnes'
  return `${c.days} d`
}

const STATUS_LABEL: Record<Status, string> = { over: 'Zalít teď', soon: 'Brzy', ok: 'OK' }

const STATUS_PILL: Record<Status, string> = {
  over: 'hub-pill-danger',
  soon: 'hub-pill-warn',
  ok:   'hub-pill-ok',
}

const STATUS_EDGE: Record<Status, string> = {
  over: 'hub-edge-danger',
  soon: 'hub-edge-warn',
  ok:   'hub-edge-ok',
}

const STATUS_BIG: Record<Status, string> = {
  over: 'text-danger',
  soon: 'text-warning',
  ok:   'text-success',
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/zalivka${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json() as Promise<T>
}

export default function ZalivkaPage() {
  useDocumentTitle('Zálivka · mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [plants, setPlants] = useState<Plant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // historie: id rostliny → zápisy (undefined/null = ještě se načítá)
  const [openHistory, setOpenHistory] = useState<number | null>(null)
  const [history, setHistory] = useState<Record<number, WateringEvent[] | null>>({})

  // formulář
  const [fName, setFName] = useState('')
  const [fSpecies, setFSpecies] = useState<SpeciesKey>('tropicka')
  const [fPot, setFPot] = useState('18')
  const [fMaterial, setFMaterial] = useState<MaterialKey>('plast')
  const [fLight, setFLight] = useState<LightKey>('neprime')

  const load = useCallback(async () => {
    const r = await api<{ plants: Plant[] }>('')
    setPlants(r.plants)
  }, [])

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/zalivka', { replace: true })
      return
    }
    load()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setReady(true))
  }, [navigate, load])

  const season = useMemo(() => seasonInfo(new Date().getMonth()), [])

  const rows = useMemo(
    () =>
      plants
        .map((p) => ({ p, c: compute(p) }))
        // Nezalité rostliny napřed, pak podle toho, komu termín hoří nejvíc.
        .sort((a, b) => (a.c.days ?? -9999) - (b.c.days ?? -9999)),
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

  const loadHistory = useCallback(async (plantId: number) => {
    const r = await api<{ events: WateringEvent[] }>(`/water?plant_id=${plantId}`)
    setHistory((h) => ({ ...h, [plantId]: r.events }))
  }, [])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const water = (p: Plant, c: Computed) =>
    run(async () => {
      await api('/water', {
        method: 'POST',
        body: JSON.stringify({ plant_id: p.id, ml: c.ml }),
      })
      await load()
      if (openHistory === p.id) await loadHistory(p.id)
    })

  const removePlant = (id: number) =>
    run(async () => {
      await api(`?id=${id}`, { method: 'DELETE' })
      if (openHistory === id) setOpenHistory(null)
      await load()
    })

  const toggleHistory = (plantId: number) =>
    run(async () => {
      if (openHistory === plantId) {
        setOpenHistory(null)
        return
      }
      setOpenHistory(plantId)
      setHistory((h) => ({ ...h, [plantId]: null }))
      await loadHistory(plantId)
    })

  const removeEvent = (ev: WateringEvent) =>
    run(async () => {
      await api(`/water?id=${ev.id}`, { method: 'DELETE' })
      await Promise.all([load(), loadHistory(ev.plant_id)])
    })

  const add = () =>
    run(async () => {
      const pot = Number.parseInt(fPot, 10)
      await api('', {
        method: 'POST',
        body: JSON.stringify({
          name: fName.trim() || SPECIES[fSpecies].short,
          species: fSpecies,
          pot_cm: Number.isFinite(pot) ? Math.min(60, Math.max(6, pot)) : 18,
          material: fMaterial,
          light: fLight,
        }),
      })
      setFName('')
      await load()
    })

  if (!ready) return null

  return (
    <div className="hub-page">
      <TopBar section="privátní" />
      <div className="hub-container pb-12">
        <PageHeader
          back="/private"
          icon="🪴"
          eyebrow="Rostliny"
          title="Zálivka"
          subtitle="Kdy a kolik zalévat · trackování"
          aside={
            <span className="hub-chip px-3 py-1.5 tabular-nums">
              období <b className="text-mint font-semibold">{season.key}</b> · ×{season.f}
            </span>
          }
        />

        {error && (
          <p className="mb-5 px-4 py-3 rounded-xl bg-raspberry/10 border border-raspberry/25 text-raspberry text-sm" role="alert">
            Chyba: {error}
          </p>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          <Tile n={counts.over} k="Zalít teď" tone="over" />
          <Tile n={counts.soon} k="Brzy (1–2 dny)" tone="soon" />
          <Tile n={counts.ok} k="V pohodě" tone="ok" />
          <Tile n={plants.length} k="Rostlin celkem" tone="all" />
        </section>

        {/* Formulář je pořád rozbalený — na šířku monitoru se vejde do jedné řady
            a klikat na rozbalení pokaždé, když přibude rostlina, nemá smysl. */}
        <div className="hub-card mb-8">
          <div className="flex items-center gap-2 px-5 pt-4">
            <Plus className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold">Přidat rostlinu</span>
          </div>

            <div className="px-5 py-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-end">
              <Field label="Název">
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                  placeholder="např. Monstera u okna"
                  className="hub-input"
                />
              </Field>
              <Field label="Druh">
                <select
                  value={fSpecies}
                  onChange={(e) => setFSpecies(e.target.value as SpeciesKey)}
                  className="hub-input"
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
                  className="hub-input tabular-nums"
                />
              </Field>
              <Field label="Materiál">
                <select
                  value={fMaterial}
                  onChange={(e) => setFMaterial(e.target.value as MaterialKey)}
                  className="hub-input"
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
                  className="hub-input"
                >
                  {(Object.keys(LIGHT) as LightKey[]).map((k) => (
                    <option key={k} value={k}>{LIGHT[k].label}</option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button onClick={add} disabled={busy} className="hub-btn hub-btn-primary w-full">
                  Přidat rostlinu
                </button>
              </div>
            </div>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="hub-title text-xl">Moje rostliny</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {plants.length} {plantWord(plants.length)}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="hub-card p-8 text-center">
            <Sprout className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Zatím žádné rostliny — přidej si první nahoře.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-start">
            {rows.map(({ p, c }, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={'hub-card p-5 flex flex-col gap-3 ' + STATUS_EDGE[c.status]}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-semibold" title={p.name}>{p.name}</span>
                  <span className={'hub-pill font-mono uppercase tracking-[0.1em] shrink-0 ' + STATUS_PILL[c.status]}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{SPECIES[p.species].short}</span>
                  <span className="tabular-nums">Ø {p.pot_cm} cm</span>
                  <span>{MATERIALS[p.material].label}</span>
                  <span>{LIGHT[p.light].label}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className={'hub-num text-3xl font-semibold ' + STATUS_BIG[c.status]}>
                    {bigText(c)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {whenText(c)}{c.due ? ` · ${dayMonth.format(c.due)}` : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground hub-divider pt-2.5 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-aqua" />
                    <b className="text-aqua">≈ {c.ml} ml</b>
                  </span>
                  <span>á {c.interval} {denWord(c.interval)}</span>
                  <button
                    onClick={() => toggleHistory(p.id)}
                    className="inline-flex items-center gap-1 hover:text-mint"
                    aria-expanded={openHistory === p.id}
                  >
                    <History className="w-3 h-3" />
                    {p.water_count}× zalito
                  </button>
                </div>

                {openHistory === p.id && (
                  <div className="rounded-xl border border-border bg-secondary/60 p-3">
                    {!history[p.id] ? (
                      <p className="text-xs text-muted-foreground">Načítám…</p>
                    ) : history[p.id]!.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Zatím žádná zálivka.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-52 overflow-y-auto">
                        {history[p.id]!.map((ev) => (
                          <li key={ev.id} className="flex items-center gap-2 text-xs">
                            <Droplet className="w-3 h-3 text-aqua shrink-0" />
                            <span className="tabular-nums">{dayMonthTime.format(new Date(ev.ts))}</span>
                            {ev.ml !== null && (
                              <span className="text-muted-foreground tabular-nums">{ev.ml} ml</span>
                            )}
                            <button
                              onClick={() => removeEvent(ev)}
                              disabled={busy}
                              className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                              aria-label="Smazat zápis"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <details className="text-[0.7rem] text-muted-foreground">
                  <summary className="cursor-pointer">výpočet</summary>
                  <p className="mt-1.5 leading-relaxed tabular-nums">
                    {c.f.base} × {c.f.pot} (Ø) × {c.f.mat} (mat.) × {c.f.light} (světlo) ×{' '}
                    {c.f.season} ({c.season.key}) = <b className="text-foreground">{c.interval} {denWord(c.interval)}</b>{' '}
                    mezi zálivkami
                  </p>
                </details>

                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs text-muted-foreground">
                    {p.last_ts ? `naposledy ${relDays(p.last_ts)}` : 'ještě nezalito'}
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => water(p, c)} disabled={busy} className="hub-btn hub-btn-sm hub-btn-aqua">
                      <Droplet className="w-3 h-3" /> Zalít
                    </button>
                    <button
                      onClick={() => removePlant(p.id)}
                      disabled={busy}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
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

        <details className="mt-10 hub-card px-5">
          <summary className="cursor-pointer py-4 text-sm font-semibold hover:text-mint">
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
              <h3 className="hub-label text-mint mb-1">Základ (vegetační sezóna, dny)</h3>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Sukulent 14 · Kaktus 16 · Středomořská 9</li>
                <li>Tropická pokojovka 6 · Orchidej 8</li>
                <li>Kapradina / vlhkomilná 3 · Bylinka 2</li>
              </ul>
            </div>
            <div>
              <h3 className="hub-label text-mint mb-1">Korekce</h3>
              <ul className="list-disc pl-5 space-y-0.5">
                <li><b>Ø květináče:</b> &lt;13 cm ×0.8 · 13–20 ×1.0 · 20–28 ×1.2 · &gt;28 ×1.4 — větší = víc zásoby vody</li>
                <li><b>Materiál:</b> terakota ×0.85 (dýchá, schne rychleji) · plast ×1.0 · glazura ×1.1</li>
                <li><b>Světlo:</b> přímé slunce ×0.8 · nepřímé ×1.0 · polostín ×1.15 · stín ×1.3</li>
                <li><b>Období:</b> léto ×1.0 · jaro ×1.1 · podzim ×1.4 · <b>zima ×1.9</b> — vegetační klid</li>
              </ul>
            </div>
            <div>
              <h3 className="hub-label text-mint mb-1">Kolik vody</h3>
              <p>
                Objem substrátu ≈ π·(Ø/2)²·výška (výška ≈ 0.8·Ø), z toho 10 % u sukulentů až 20 %
                u kapradin a bylinek — tedy „zalít, dokud neodteče do misky". Doporučení se ukládá
                ke každé zálivce, takže historie nezlže, když později vyměníš květináč.
              </p>
            </div>
            <div>
              <h3 className="hub-label text-mint mb-1">Co dál</h3>
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
    tone === 'over' ? 'text-danger'
    : tone === 'soon' ? 'text-warning'
    : tone === 'ok' ? 'text-success'
    : 'text-mint'
  const edge =
    tone === 'over' ? 'hub-edge-danger'
    : tone === 'soon' ? 'hub-edge-warn'
    : tone === 'ok' ? 'hub-edge-ok'
    : 'hub-edge-info'
  return (
    <div className={'hub-card px-4 py-4 ' + edge}>
      <div className={'hub-num text-4xl font-semibold leading-none ' + color}>{n}</div>
      <div className="hub-label mt-2.5">{k}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="hub-label">{label}</span>
      {children}
    </label>
  )
}
