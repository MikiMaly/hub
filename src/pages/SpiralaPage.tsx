import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Crosshair, Maximize2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { isAdmin, isAuthed } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, TopBar } from '../ui/brand'
import { DAY, type Category, type Hit, type Period, type Shape, SpiralRenderer, isoOf, msOf, todayISO } from '../lib/spiral'

// Modul Spirála: časová osa života jako kuželová spirála (engine v lib/spiral.ts).
// PROTOTYP. Data má každý uživatel v D1 (/api/spirala, jeden JSON na účet).
// Dřív žila jen v localStorage pod klíčem STORE — ty adminovi (jedinému, kdo
// Spirálu tehdy používal) při prvním otevření jednou přenesu na server.

const STORE = 'hub:spirala:v3'

// Barvy pruhů z palety identity (theme.css). Canvas potřebuje hex, ne CSS
// proměnnou, proto jsou tu opsané — při ladění palety upravit i tady.
const CATEGORIES: Category[] = [
  { id: 'bydleni', name: 'Bydlení', color: '#3ee0c3' },  // akvamarín
  { id: 'vztahy', name: 'Vztahy', color: '#e8336f' },    // malina
  { id: 'prace', name: 'Práce', color: '#f5a65b' },      // meruňka
  { id: 'skola', name: 'Škola', color: '#22c55e' },      // zelená
]

type Saved = { birth: string; shape: Shape; periods: Period[] }
const DEFAULTS: Saved = {
  birth: '2001-09-07',
  shape: { cone: 0.15, pitch: 0.14, band: 0.8 },
  periods: [],
}

function loadLocal(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* prázdné nebo nedostupné úložiště */
  }
  return null
}

async function saveRemote(data: Saved): Promise<void> {
  const res = await fetch('/api/spirala', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
}

async function loadRemote(): Promise<Saved> {
  const res = await fetch('/api/spirala')
  if (!res.ok) throw new Error(`${res.status}`)
  const body = (await res.json()) as { data: Saved | null }
  if (body.data) return { ...DEFAULTS, ...body.data }

  // Server je prázdný: jednorázová migrace z localStorage, jen pro admina —
  // na sdíleném prohlížeči by si jinak cizí účet natáhl moje data.
  const local = isAdmin() ? loadLocal() : null
  if (local) {
    await saveRemote(local)
    try {
      localStorage.removeItem(STORE)
    } catch {
      /* nevadí */
    }
    return local
  }
  return DEFAULTS
}

const fmt = (ms: number) =>
  new Date(ms).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const fmtShort = (iso: string) =>
  new Date(msOf(iso)).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
const uid = () => Math.random().toString(36).slice(2, 10)

function seasonName(ms: number) {
  const m = new Date(ms).getUTCMonth()
  return m === 11 || m <= 1 ? 'zima' : m <= 4 ? 'jaro' : m <= 7 ? 'léto' : 'podzim'
}

// ukázková data relativně k datu narození, jen na vyzkoušení vzhledu
function demoPeriods(birth: string): Period[] {
  const b = new Date(msOf(birth)).getUTCFullYear()
  const d = (y: number, m: number, day = 1) => isoOf(Date.UTC(b + y, m - 1, day))
  return [
    { id: uid(), cat: 'bydleni', title: 'U rodičů', start: birth, end: d(19, 8, 31) },
    { id: uid(), cat: 'bydleni', title: 'Kolej', start: d(19, 9), end: d(23, 6, 30) },
    { id: uid(), cat: 'bydleni', title: 'Podnájem', start: d(23, 7), end: d(31, 3, 31) },
    { id: uid(), cat: 'bydleni', title: 'Vlastní byt', start: d(31, 4), end: null },
    { id: uid(), cat: 'skola', title: 'Základka', start: d(6, 9), end: d(15, 6, 30) },
    { id: uid(), cat: 'skola', title: 'Gympl', start: d(15, 9), end: d(19, 5, 31) },
    { id: uid(), cat: 'skola', title: 'Vysoká', start: d(19, 9), end: d(24, 6, 30) },
    { id: uid(), cat: 'vztahy', title: 'Partnerka A', start: d(17, 4, 12), end: d(19, 11, 2) },
    { id: uid(), cat: 'vztahy', title: 'Partnerka B', start: d(22, 6, 20), end: d(27, 1, 15) },
    { id: uid(), cat: 'vztahy', title: 'Partnerka C', start: d(29, 9, 3), end: null },
    { id: uid(), cat: 'prace', title: 'Brigády', start: d(16, 7), end: d(16, 8, 31) },
    { id: uid(), cat: 'prace', title: 'Firma 1', start: d(24, 9), end: d(30, 12, 31) },
    { id: uid(), cat: 'prace', title: 'Firma 2', start: d(31, 2), end: null },
  ]
}

type Draft = { id: string | null; cat: string; title: string; start: string; end: string; ongoing: boolean; note: string }

export default function SpiralaPage() {
  const navigate = useNavigate()
  useDocumentTitle('Spirála · mmaly.cz')
  const [initial, setInitial] = useState<Saved | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/spirala')
      return
    }
    loadRemote()
      .then(setInitial)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)))
  }, [navigate])

  if (loadError) {
    return (
      <div className="hub-page">
        <TopBar section="privátní" />
        <div className="hub-container">
          <PageHeader back="/private" icon="🌀" title="Spirála" />
          <p className="px-4 py-3 rounded-xl bg-raspberry/10 border border-raspberry/25 text-raspberry text-sm">
            Nepodařilo se načíst data ({loadError}).
          </p>
        </div>
      </div>
    )
  }
  // Renderer se staví až nad načtenými daty, ať kamera sedí na správné datum narození.
  if (!initial) return null
  return <SpiralaView initial={initial} />
}

function SpiralaView({ initial }: { initial: Saved }) {
  const [data, setData] = useState<Saved>(initial)
  const [mark, setMark] = useState(false)
  const [hover, setHover] = useState<Hit | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saveError, setSaveError] = useState(false)

  // Ukládání s krátkým zpožděním — tah po pásu mění data mnohokrát za vteřinu.
  // Při odchodu ze stránky se rozjeté uložení dotáhne hned.
  const pending = useRef<Saved | null>(null)
  useEffect(() => {
    if (data === initial) return
    pending.current = data
    const t = setTimeout(() => {
      pending.current = null
      saveRemote(data).then(() => setSaveError(false), () => setSaveError(true))
    }, 700)
    return () => clearTimeout(t)
  }, [data, initial])
  useEffect(
    () => () => {
      if (pending.current) saveRemote(pending.current).catch(() => {})
    },
    [],
  )

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rRef = useRef<SpiralRenderer | null>(null)

  // inicializace rendereru
  useEffect(() => {
    const canvas = canvasRef.current!
    const r = new SpiralRenderer(canvas)
    r.categories = CATEGORIES
    rRef.current = r
    const ro = new ResizeObserver(() => {
      const box = wrapRef.current!.getBoundingClientRect()
      r.resize(box.width, box.height, window.devicePixelRatio || 1)
    })
    ro.observe(wrapRef.current!)
    return () => {
      ro.disconnect()
      r.destroy()
    }
  }, [])

  // změna narození / tvaru → přestavět geometrii; poprvé nasadit kameru na celý život
  useEffect(() => {
    const r = rRef.current!
    r.birth = data.birth
    r.shape = data.shape
    r.periods = data.periods
    r.rebuild()
    if (!r.fitted) {
      r.fitted = true
      const box = wrapRef.current!.getBoundingClientRect()
      r.resize(box.width, box.height, window.devicePixelRatio || 1)
      r.setCamera(r.fitCamera())
    }
    r.invalidate()
    // periods řeší samostatný efekt níž
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.birth, data.shape])

  useEffect(() => {
    const r = rRef.current!
    r.periods = data.periods
    r.rebuildFills()
    r.invalidate()
  }, [data.periods])

  // ---------- ovládání myší ----------
  const drag = useRef<{ x: number; y: number; mode: 'rotate' | 'pan' | 'select'; moved: boolean; lane: number } | null>(null)

  const local = (e: { clientX: number; clientY: number }) => {
    const b = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - b.left, e.clientY - b.top] as const
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const r = rRef.current!
    const [x, y] = local(e)
    canvasRef.current!.setPointerCapture(e.pointerId)
    const hit = r.pick(x, y)
    if (mark && hit && e.button === 0) {
      r.selection = [hit.u, hit.u]
      drag.current = { x, y, mode: 'select', moved: false, lane: hit.lane }
    } else {
      drag.current = { x, y, mode: e.button === 0 && !e.shiftKey ? 'rotate' : 'pan', moved: false, lane: 0 }
    }
    r.invalidate()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const r = rRef.current!
    const [x, y] = local(e)
    const d = drag.current
    if (d) {
      const dx = x - d.x
      const dy = y - d.y
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
      if (d.mode === 'rotate') {
        r.setCamera({ yaw: r.cam.yaw + dx * 0.007, el: r.cam.el + dy * 0.004 })
        d.x = x
        d.y = y
      } else if (d.mode === 'pan') {
        r.setCamera({ targetY: r.cam.targetY + (dy * r.cam.dist) / 900 })
        d.x = x
        d.y = y
      } else if (d.mode === 'select') {
        const hit = r.pick(x, y)
        if (hit && r.selection) r.selection = [r.selection[0], hit.u]
        r.invalidate()
      }
    }
    if (!d || d.mode === 'select') {
      const hit = r.pick(x, y)
      r.hoverU = hit ? hit.u : null
      setHover(hit)
      r.focusPeriod = hit?.periodId ?? null
      r.invalidate()
    }
  }

  const onPointerUp = () => {
    const r = rRef.current!
    const d = drag.current
    drag.current = null
    if (d?.mode === 'select' && r.selection) {
      const [a, b] = r.selection
      const s = isoOf(r.msAt(Math.min(a, b)))
      const en = isoOf(r.msAt(Math.max(a, b)))
      setDraft({ id: null, cat: CATEGORIES[d.lane]?.id ?? CATEGORIES[0].id, title: '', start: s, end: en, ongoing: false, note: '' })
    } else if (d && !d.moved && hover?.periodId) {
      openEdit(hover.periodId)
    }
  }

  const onLeave = () => {
    const r = rRef.current!
    r.hoverU = null
    r.focusPeriod = null
    setHover(null)
    r.invalidate()
  }

  // kolečko: zoom směrem k místu pod kurzorem (po výšce)
  useEffect(() => {
    const c = canvasRef.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = rRef.current!
      const k = Math.exp(e.deltaY * 0.0012)
      const [x, y] = local(e)
      const hit = r.pick(x, y)
      let targetY = r.cam.targetY
      if (hit) {
        const p = r.span
        const hy = r.height(Math.min(Math.max(hit.u, p.u0), p.uEnd), 0.5)
        targetY += (hy - targetY) * (1 - k) * (k < 1 ? 1 : 0.4)
      }
      r.setCamera({ dist: r.cam.dist * k, targetY })
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [])

  const onDouble = (e: React.MouseEvent) => {
    const r = rRef.current!
    const [x, y] = local(e)
    const hit = r.pick(x, y)
    if (hit) r.animateTo(r.focusCamera(hit.u))
  }

  // ---------- data ----------
  const openEdit = useCallback(
    (id: string) => {
      const p = data.periods.find((q) => q.id === id)
      if (!p) return
      setDraft({ id: p.id, cat: p.cat, title: p.title, start: p.start, end: p.end ?? todayISO(), ongoing: p.end === null, note: p.note ?? '' })
    },
    [data.periods],
  )

  const saveDraft = () => {
    if (!draft) return
    const start = draft.start <= draft.end || draft.ongoing ? draft.start : draft.end
    const end = draft.ongoing ? null : draft.start <= draft.end ? draft.end : draft.start
    const p: Period = { id: draft.id ?? uid(), cat: draft.cat, title: draft.title.trim() || 'Bez názvu', start, end, note: draft.note || undefined }
    setData((dd) => ({ ...dd, periods: draft.id ? dd.periods.map((q) => (q.id === draft.id ? p : q)) : [...dd.periods, p] }))
    closeDraft()
  }
  const deletePeriod = (id: string) => {
    setData((dd) => ({ ...dd, periods: dd.periods.filter((q) => q.id !== id) }))
    closeDraft()
  }
  const closeDraft = () => {
    setDraft(null)
    const r = rRef.current
    if (r) {
      r.selection = null
      r.invalidate()
    }
  }

  const focusPeriod = (p: Period) => {
    const r = rRef.current!
    const a = r.u(msOf(p.start))
    const b = r.u(p.end ? msOf(p.end) : msOf(todayISO()))
    r.focusPeriod = p.id
    r.animateTo(r.focusCamera((a + b) / 2))
  }

  const setShape = (k: keyof Shape, v: number) => setData((d) => ({ ...d, shape: { ...d.shape, [k]: v } }))

  const active = useMemo(() => {
    if (!hover) return []
    const iso = isoOf(hover.ms)
    return data.periods.filter((p) => p.start <= iso && (p.end === null || p.end >= iso))
  }, [hover, data.periods])

  const ageAt = (ms: number) => {
    const b = msOf(data.birth)
    return Math.floor((ms - b) / (365.2425 * DAY))
  }

  const grouped = CATEGORIES.map((c) => ({
    c,
    items: data.periods.filter((p) => p.cat === c.id).sort((a, b) => a.start.localeCompare(b.start)),
  }))

  return (
    <div className="hub-page">
      <TopBar section="privátní" />
      <div className="hub-container max-w-[1800px] pb-12">
        <PageHeader
          back="/private"
          icon="🌀"
          eyebrow="Prototyp"
          title="Spirála"
          subtitle={
            saveError ? (
              <span className="text-raspberry">Neuloženo, server neodpovídá. Zkusím to při další změně.</span>
            ) : (
              'Časová osa života · jedna otočka = jeden rok'
            )
          }
          aside={
          <>
            <label className="hub-chip px-3 py-1.5 gap-2">
              narození
              <input
                type="date"
                value={data.birth}
                max={todayISO()}
                onChange={(e) => e.target.value && setData((d) => ({ ...d, birth: e.target.value }))}
                className="bg-transparent text-foreground outline-none"
              />
            </label>
            <button
              onClick={() => setMark((m) => !m)}
              className={'hub-btn hub-btn-sm ' + (mark ? 'hub-btn-primary' : 'hub-btn-ghost')}
            >
              <Pencil className="w-3.5 h-3.5" /> {mark ? 'Zaznamenávám — táhni po pásu' : 'Zaznamenat'}
            </button>
            <button
              onClick={() => rRef.current && rRef.current.animateTo(rRef.current.fitCamera())}
              className="hub-btn hub-btn-sm hub-btn-ghost"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Celý život
            </button>
            <button
              onClick={() => {
                const r = rRef.current
                if (r) r.animateTo(r.focusCamera(r.span.uEnd))
              }}
              className="hub-btn hub-btn-sm hub-btn-ghost"
            >
              <Crosshair className="w-3.5 h-3.5" /> Dnes
            </button>
          </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="relative hub-card overflow-hidden">
            <div ref={wrapRef} className="h-[60vh] min-h-[420px]">
              <canvas
                ref={canvasRef}
                className="block w-full h-full touch-none"
                style={{ cursor: mark ? 'crosshair' : drag.current ? 'grabbing' : 'grab' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onLeave}
                onDoubleClick={onDouble}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {/* legenda pruhů: odspodu nahoru */}
            <div className="absolute left-3 bottom-3 flex flex-col-reverse gap-1 text-xs bg-background/70 backdrop-blur rounded-lg px-2.5 py-2 border border-border">
              {CATEGORIES.map((c) => (
                <span key={c.id} className="flex items-center gap-2">
                  <span className="w-3 h-2 rounded-sm" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
            <div className="absolute right-3 bottom-3 text-[0.7rem] text-muted-foreground bg-background/70 backdrop-blur rounded-lg px-2.5 py-1.5 border border-border text-right leading-relaxed">
              táhni = otáčení · kolečko = zoom · shift/pravé tlačítko = posun
              <br />
              dvojklik = přiblížit · klik na období = upravit
            </div>

            {hover && (
              <div className="absolute left-3 top-3 max-w-xs text-sm bg-background/85 backdrop-blur rounded-xl px-3 py-2.5 border border-border pointer-events-none">
                <div className="font-semibold">{fmt(hover.ms)}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {ageAt(hover.ms)} let · {seasonName(hover.ms)} · pruh {CATEGORIES[hover.lane]?.name}
                </div>
                {active.length === 0 && <div className="text-xs text-muted-foreground">nic zaznamenáno</div>}
                {active.map((p) => {
                  const c = CATEGORIES.find((q) => q.id === p.cat)
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c?.color }} />
                      <span className="text-muted-foreground">{c?.name}:</span> {p.title}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <section className="hub-card p-4">
              <h2 className="hub-label text-mint mb-3">Tvar spirály</h2>
              <Slider label="Kužel (růst šířky s věkem)" value={data.shape.cone} min={0} max={0.4} step={0.005} onChange={(v) => setShape('cone', v)} />
              <Slider label="Rozteč závitů" value={data.shape.pitch} min={0.03} max={0.4} step={0.005} onChange={(v) => setShape('pitch', v)} />
              <Slider label="Výška pásu" value={data.shape.band} min={0.3} max={0.95} step={0.01} onChange={(v) => setShape('band', v)} />
            </section>

            <section className="hub-card p-4 flex-1 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="hub-label text-mint">Období</h2>
                <div className="flex gap-1">
                  {data.periods.length === 0 && (
                    <button
                      onClick={() => setData((d) => ({ ...d, periods: demoPeriods(d.birth) }))}
                      className="hub-btn hub-btn-sm hub-btn-quiet"
                    >
                      ukázková data
                    </button>
                  )}
                  <button
                    onClick={() => setDraft({ id: null, cat: CATEGORIES[0].id, title: '', start: todayISO(), end: todayISO(), ongoing: true, note: '' })}
                    className="hub-btn hub-btn-sm hub-btn-soft"
                  >
                    <Plus className="w-3 h-3" /> přidat
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 max-h-[46vh] overflow-auto pr-1">
                {grouped.map(({ c, items }) => (
                  <div key={c.id}>
                    <div className="hub-label mb-1 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} /> {c.name}
                    </div>
                    {items.length === 0 && <div className="text-xs text-muted-foreground/60 pl-4">—</div>}
                    {items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => focusPeriod(p)}
                        onDoubleClick={() => openEdit(p.id)}
                        className="w-full text-left text-sm pl-4 py-1 rounded-md hover:bg-muted flex justify-between gap-2"
                        title="klik = najet na spirále, dvojklik = upravit"
                      >
                        <span className="truncate">{p.title}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {fmtShort(p.start)} – {p.end ? fmtShort(p.end) : 'dodnes'}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50" onClick={closeDraft}>
          <div className="w-full max-w-md hub-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="hub-title text-xl">{draft.id ? 'Upravit období' : 'Nové období'}</h3>
              <button onClick={closeDraft} className="hub-btn hub-btn-quiet hub-btn-icon" aria-label="Zavřít">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Kategorie">
                <select value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })} className={inputCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Název">
                <input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveDraft()} className={inputCls} placeholder="např. Praha – Vinohrady" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Od">
                  <input type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Do">
                  <input type="date" value={draft.end} disabled={draft.ongoing} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className={inputCls + ' disabled:opacity-40'} />
                </Field>
              </div>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={draft.ongoing} onChange={(e) => setDraft({ ...draft, ongoing: e.target.checked })} /> trvá dodnes
              </label>
              <Field label="Poznámka">
                <textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={2} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-between mt-5">
              {draft.id ? (
                <button onClick={() => deletePeriod(draft.id!)} className="hub-btn hub-btn-sm hub-btn-danger">
                  <Trash2 className="w-4 h-4" /> Smazat
                </button>
              ) : (
                <span />
              )}
              <button onClick={saveDraft} className="hub-btn hub-btn-primary">
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'hub-input'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="hub-label">{label}</span>
      {children}
    </label>
  )
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 mb-2.5">
      <span className="text-xs text-muted-foreground flex justify-between">
        {label} <span className="tabular-nums">{value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[var(--primary)]" />
    </label>
  )
}
