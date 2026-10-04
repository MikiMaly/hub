// Engine modulu Spirála: časová osa života jako kuželová spirála.
//
// Jedna otočka = jeden kalendářní rok. Úhel je podíl uplynulého roku, takže
// stejné datum (a tím i roční období, měsíc, den) leží ve všech letech přesně
// nad sebou. Výška a poloměr rostou s časem — dole narození, nahoře dnešek.
// Rozteč závitů roste spolu s poloměrem, takže nedávné roky jsou širší i vyšší
// (víc detailu), ale celý život je pořád vidět najednou.
//
// Kreslí se do Canvas 2D vlastní projekcí (bez three.js): pás je rozsekaný na
// úseky po 2 dnech, každý frame se promítnou a seřadí odzadu dopředu.

export type Category = { id: string; name: string; color: string }
export type Period = {
  id: string
  cat: string
  title: string
  start: string // YYYY-MM-DD
  end: string | null // null = trvá dodnes
  note?: string
}
export type Shape = {
  cone: number // přírůstek poloměru za rok (relativně k poloměru v roce narození)
  pitch: number // rozteč závitu jako násobek poloměru
  band: number // výška pásu jako podíl rozteče
}
export type Camera = { yaw: number; el: number; dist: number; targetY: number }
export type Hit = { u: number; ms: number; lane: number; periodId: string | null }

export const DAY = 86_400_000
const TAU = Math.PI * 2
const DIR = 1 // po směru hodinových ručiček při pohledu shora
const PHASE = -Math.PI / 2 // 1. leden vzadu, léto vpředu
const SEG_DAYS = 2

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const daysIn = (y: number) => (isLeap(y) ? 366 : 365)

export function msOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
export function isoOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}
export function todayISO(): string {
  const d = new Date()
  return isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// Barva podkladu podle ročního období (středy sezón: 15. 1., 15. 4., 15. 7., 15. 10.)
const SEASON_ANCHORS: [number, [number, number, number]][] = [
  [0.04, [74, 104, 150]], // zima
  [0.29, [86, 138, 96]], // jaro
  [0.54, [168, 146, 78]], // léto
  [0.79, [160, 100, 66]], // podzim
]
function seasonRGB(frac: number): [number, number, number] {
  const n = SEASON_ANCHORS.length
  for (let i = 0; i < n; i++) {
    const [fa, ca] = SEASON_ANCHORS[i]
    const [fbRaw, cb] = SEASON_ANCHORS[(i + 1) % n]
    const fb = fbRaw <= fa ? fbRaw + 1 : fbRaw
    let f = frac
    if (f < fa) f += 1
    if (f >= fa && f < fb) {
      const t = (f - fa) / (fb - fa)
      return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]
    }
  }
  return SEASON_ANCHORS[0][1]
}

function hexRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const rgb = (c: [number, number, number], s: number, a = 1) =>
  `rgba(${Math.min(255, c[0] * s) | 0},${Math.min(255, c[1] * s) | 0},${Math.min(255, c[2] * s) | 0},${a})`

const MONTHS_SHORT = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']

type Fill = { lane: number; f0: number; f1: number; color: [number, number, number]; pid: string }

export class SpiralRenderer {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1

  birth = '1990-01-01'
  shape: Shape = { cone: 0.15, pitch: 0.14, band: 0.8 }
  fitted = false
  categories: Category[] = []
  periods: Period[] = []
  cam: Camera = { yaw: 0, el: 0.2, dist: 30, targetY: 5 }

  hoverU: number | null = null
  selection: [number, number] | null = null
  focusPeriod: string | null = null

  // model
  private birthYear = 1990
  private u0 = 0
  private uEnd = 1
  // úseky
  private n = 0
  private world = new Float32Array(0) // 4 rohy × xyz: spodní A, spodní B, horní B, horní A
  private mid = new Float32Array(0) // xyz středu + normála (nx, nz)
  private ua = new Float32Array(0)
  private ub = new Float32Array(0)
  private startMs = new Float64Array(0)
  private base: [number, number, number][] = []
  private tick = new Int8Array(0) // 0 nic, 1 měsíc, 2 roční období, 3 rok
  private tickF = new Float32Array(0)
  private fills: (Fill[] | null)[] = []
  // svislé vodicí čáry (stejné datum v sousedních letech)
  private lines = new Float32Array(0)
  private lineKind = new Int8Array(0)
  private years: { u: number; label: string }[] = []
  // projekce posledního frame
  private scr = new Float32Array(0)
  private depth = new Float32Array(0)
  private facing = new Float32Array(0)
  private valid = new Uint8Array(0)
  private lineScr = new Float32Array(0)
  private lineDepth = new Float32Array(0)
  private order: number[] = []

  private raf = 0
  private anim: { from: Camera; to: Camera; t0: number; dur: number } | null = null
  onCamera?: () => void

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  // ---------- model ----------

  u(ms: number): number {
    const y = new Date(ms).getUTCFullYear()
    return y - this.birthYear + (ms - Date.UTC(y, 0, 1)) / (daysIn(y) * DAY)
  }
  msAt(u: number): number {
    const k = Math.floor(u)
    const y = this.birthYear + k
    return Date.UTC(y, 0, 1) + Math.floor((u - k) * daysIn(y)) * DAY
  }
  radius(u: number) {
    return 1 + this.shape.cone * u
  }
  // výška spodní hrany pásu: integrál rozteče pitch·r(u)
  height(u: number, level: number) {
    const { cone, pitch, band } = this.shape
    return pitch * (u + (cone * u * u) / 2) + level * band * pitch * this.radius(u)
  }
  private put(u: number, level: number, out: Float32Array, o: number) {
    const r = this.radius(u)
    const phi = DIR * TAU * u + PHASE
    out[o] = r * Math.cos(phi)
    out[o + 1] = this.height(u, level)
    out[o + 2] = r * Math.sin(phi)
  }
  get span() {
    return { u0: this.u0, uEnd: this.uEnd, birthYear: this.birthYear }
  }

  rebuild() {
    const bms = msOf(this.birth)
    this.birthYear = new Date(bms).getUTCFullYear()
    const endMs = msOf(todayISO()) + DAY
    this.u0 = this.u(bms)
    this.uEnd = this.u(endMs)

    const n = Math.max(1, Math.ceil((endMs - bms) / (SEG_DAYS * DAY)))
    this.n = n
    this.world = new Float32Array(n * 12)
    this.mid = new Float32Array(n * 5)
    this.ua = new Float32Array(n)
    this.ub = new Float32Array(n)
    this.startMs = new Float64Array(n)
    this.base = new Array(n)
    this.tick = new Int8Array(n)
    this.tickF = new Float32Array(n)
    this.scr = new Float32Array(n * 8)
    this.depth = new Float32Array(n)
    this.facing = new Float32Array(n)
    this.valid = new Uint8Array(n)

    for (let i = 0; i < n; i++) {
      const a = bms + i * SEG_DAYS * DAY
      const b = Math.min(a + SEG_DAYS * DAY, endMs)
      const ua = this.u(a)
      const ub = this.u(b)
      this.ua[i] = ua
      this.ub[i] = ub
      this.startMs[i] = a
      const o = i * 12
      this.put(ua, 0, this.world, o)
      this.put(ub, 0, this.world, o + 3)
      this.put(ub, 1, this.world, o + 6)
      this.put(ua, 1, this.world, o + 9)
      const um = (ua + ub) / 2
      const phi = DIR * TAU * um + PHASE
      const r = this.radius(um)
      this.mid[i * 5] = r * Math.cos(phi)
      this.mid[i * 5 + 1] = this.height(um, 0.5)
      this.mid[i * 5 + 2] = r * Math.sin(phi)
      this.mid[i * 5 + 3] = Math.cos(phi)
      this.mid[i * 5 + 4] = Math.sin(phi)
      this.base[i] = seasonRGB(um - Math.floor(um))
      // začátek měsíce uvnitř úseku?
      for (let k = 0; k < SEG_DAYS; k++) {
        const d = new Date(a + k * DAY)
        if (a + k * DAY >= b) break
        if (d.getUTCDate() === 1) {
          const m = d.getUTCMonth()
          this.tick[i] = m === 0 ? 3 : m % 3 === 2 ? 2 : 1
          this.tickF[i] = k / ((b - a) / DAY)
        }
      }
    }

    // vodicí čáry: začátek každého měsíce, od horní hrany pásu k dolní hraně o rok výš
    const lines: number[] = []
    const kinds: number[] = []
    const tmp = new Float32Array(6)
    const firstYear = this.birthYear
    const lastYear = new Date(endMs).getUTCFullYear()
    this.years = []
    for (let y = firstYear; y <= lastYear; y++) {
      const uy = y - firstYear
      if (uy >= this.u0 && uy <= this.uEnd) this.years.push({ u: uy, label: String(y) })
      for (let m = 0; m < 12; m++) {
        const ms = Date.UTC(y, m, 1)
        const u1 = this.u(ms)
        const ms2 = Date.UTC(y + 1, m, 1)
        const u2 = this.u(ms2)
        if (u1 < this.u0 || u2 > this.uEnd) continue
        this.put(u1, 1, tmp, 0)
        this.put(u2, 0, tmp, 3)
        lines.push(...tmp)
        kinds.push(m === 0 ? 3 : m % 3 === 2 ? 2 : 1)
      }
    }
    this.lines = new Float32Array(lines)
    this.lineKind = new Int8Array(kinds)
    this.lineScr = new Float32Array(kinds.length * 4)
    this.lineDepth = new Float32Array(kinds.length)

    this.rebuildFills()
  }

  rebuildFills() {
    const lanes = this.categories.length
    const laneOf = new Map(this.categories.map((c, i) => [c.id, i]))
    const today = msOf(todayISO()) + DAY
    const ps = this.periods
      .filter((p) => laneOf.has(p.cat))
      .map((p) => {
        const s = msOf(p.start)
        const e = p.end ? msOf(p.end) + DAY : today
        return {
          id: p.id,
          lane: laneOf.get(p.cat)!,
          u0: this.u(s),
          u1: this.u(Math.max(e, s + DAY)),
          color: hexRGB(this.categories[laneOf.get(p.cat)!].color),
        }
      })
    this.fills = new Array(this.n)
    for (let i = 0; i < this.n; i++) {
      const ua = this.ua[i]
      const ub = this.ub[i]
      let list: Fill[] | null = null
      for (const p of ps) {
        if (p.u1 <= ua || p.u0 >= ub || lanes === 0) continue
        const f0 = Math.max(0, (p.u0 - ua) / (ub - ua))
        const f1 = Math.min(1, (p.u1 - ua) / (ub - ua))
        ;(list ??= []).push({ lane: p.lane, f0, f1, color: p.color, pid: p.id })
      }
      this.fills[i] = list
    }
  }

  // ---------- kamera ----------

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.invalidate()
  }

  private get F() {
    return Math.min(this.w, this.h * 1.4) * 1.1
  }

  fitCamera(): Camera {
    const H = this.height(this.uEnd, 1) - this.height(this.u0, 0)
    const R = this.radius(this.uEnd)
    const F = this.F
    const dist = Math.max((H * F) / (this.h * 0.7), (2 * R * F) / (this.w * 0.72)) + R
    return { yaw: this.cam.yaw, el: 0.2, dist, targetY: this.height(this.u0, 0) + H * 0.5 }
  }

  focusCamera(u: number): Camera {
    // natočit tak, aby bod byl co nejblíž kameře (z1 minimální)
    const phi = DIR * TAU * u + PHASE
    const x = Math.cos(phi)
    const z = Math.sin(phi)
    let best = 0
    let bestZ = Infinity
    for (let k = 0; k < 360; k++) {
      const yw = (k / 360) * TAU
      const z1 = x * Math.sin(yw) + z * Math.cos(yw)
      if (z1 < bestZ) {
        bestZ = z1
        best = yw
      }
    }
    const yaw = this.cam.yaw + wrapAngle(best - this.cam.yaw)
    const r = this.radius(u)
    return { yaw, el: 0.3, dist: r * 4.5 + 2, targetY: this.height(u, 0.5) }
  }

  animateTo(to: Camera, dur = 650) {
    this.anim = { from: { ...this.cam }, to, t0: performance.now(), dur }
    this.invalidate()
  }

  setCamera(c: Partial<Camera>) {
    this.anim = null
    Object.assign(this.cam, c)
    this.cam.el = Math.max(-0.35, Math.min(1.45, this.cam.el))
    this.cam.dist = Math.max(0.6, Math.min(this.fitCamera().dist * 3, this.cam.dist))
    this.invalidate()
  }

  invalidate() {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.stepAnim()
      this.render()
    })
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }

  private stepAnim() {
    const a = this.anim
    if (!a) return
    const t = Math.min(1, (performance.now() - a.t0) / a.dur)
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const lerp = (x: number, y: number) => x + (y - x) * e
    this.cam = {
      yaw: lerp(a.from.yaw, a.to.yaw),
      el: lerp(a.from.el, a.to.el),
      // vzdálenost interpolovat logaritmicky, ať zoom působí plynule
      dist: Math.exp(lerp(Math.log(a.from.dist), Math.log(a.to.dist))),
      targetY: lerp(a.from.targetY, a.to.targetY),
    }
    if (t >= 1) this.anim = null
    else this.invalidate()
    this.onCamera?.()
  }

  // ---------- projekce ----------

  private pc = { x: 0, y: 0, d: 0, cx: 0, cy: 0 } // poslední projekce
  private project(x: number, y: number, z: number) {
    const { yaw, el, dist, targetY } = this.cam
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const ce = Math.cos(el)
    const se = Math.sin(el)
    const x1 = x * cy - z * sy
    const z1 = x * sy + z * cy
    const y1 = y - targetY
    const y2 = y1 * ce + z1 * se
    const z2 = -y1 * se + z1 * ce
    const d = dist + z2
    const F = this.F
    this.pc.cx = x1
    this.pc.cy = y2
    this.pc.d = d
    this.pc.x = this.w / 2 + (F * x1) / d
    this.pc.y = this.h / 2 - (F * y2) / d
    return d
  }

  projectU(u: number, level: number): { x: number; y: number; d: number } | null {
    const t = new Float32Array(3)
    this.put(u, level, t, 0)
    const d = this.project(t[0], t[1], t[2])
    if (d < 0.05) return null
    return { x: this.pc.x, y: this.pc.y, d }
  }

  // ---------- kreslení ----------

  render() {
    const ctx = this.ctx
    const { w, h } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (this.n === 0) return

    const { yaw, el } = this.cam
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const ce = Math.cos(el)
    const se = Math.sin(el)

    // úseky
    for (let i = 0; i < this.n; i++) {
      let ok = 1
      for (let k = 0; k < 4; k++) {
        const o = i * 12 + k * 3
        const d = this.project(this.world[o], this.world[o + 1], this.world[o + 2])
        if (d < 0.05) ok = 0
        this.scr[i * 8 + k * 2] = this.pc.x
        this.scr[i * 8 + k * 2 + 1] = this.pc.y
      }
      const m = i * 5
      this.depth[i] = this.project(this.mid[m], this.mid[m + 1], this.mid[m + 2])
      // normála pásu (radiálně ven) v prostoru kamery
      const nx = this.mid[m + 3]
      const nz = this.mid[m + 4]
      const nx1 = nx * cy - nz * sy
      const nz1 = nx * sy + nz * cy
      const ny2 = nz1 * se
      const nz2 = nz1 * ce
      const { cx, cy: py, d } = this.pc
      const len = Math.hypot(cx, py, d)
      this.facing[i] = -(nx1 * cx + ny2 * py + nz2 * d) / len
      const sx = this.scr[i * 8]
      const sy2 = this.scr[i * 8 + 1]
      // hrubý ořez mimo obraz
      if (sx < -w * 0.5 || sx > w * 1.5 || sy2 < -h * 0.5 || sy2 > h * 1.5) ok = 0
      this.valid[i] = ok
    }
    // vodicí čáry
    const nl = this.lineKind.length
    for (let j = 0; j < nl; j++) {
      const o = j * 6
      const d1 = this.project(this.lines[o], this.lines[o + 1], this.lines[o + 2])
      this.lineScr[j * 4] = this.pc.x
      this.lineScr[j * 4 + 1] = this.pc.y
      const d2 = this.project(this.lines[o + 3], this.lines[o + 4], this.lines[o + 5])
      this.lineScr[j * 4 + 2] = this.pc.x
      this.lineScr[j * 4 + 3] = this.pc.y
      this.lineDepth[j] = d1 < 0.05 || d2 < 0.05 ? -1 : (d1 + d2) / 2
    }

    const order: number[] = []
    for (let i = 0; i < this.n; i++) if (this.valid[i]) order.push(i)
    for (let j = 0; j < nl; j++) if (this.lineDepth[j] > 0) order.push(this.n + j)
    const depthOf = (k: number) => (k < this.n ? this.depth[k] : this.lineDepth[k - this.n])
    order.sort((a, b) => depthOf(b) - depthOf(a))
    this.order = order

    const lanes = Math.max(1, this.categories.length)
    const S = this.scr
    const sel = this.selection ? [Math.min(...this.selection), Math.max(...this.selection)] : null

    for (const k of order) {
      if (k >= this.n) {
        const j = k - this.n
        const kind = this.lineKind[j]
        ctx.strokeStyle =
          kind === 3 ? 'rgba(226,232,240,0.30)' : kind === 2 ? 'rgba(226,232,240,0.20)' : 'rgba(226,232,240,0.08)'
        ctx.lineWidth = kind >= 2 ? 1 : 0.7
        ctx.beginPath()
        ctx.moveTo(this.lineScr[j * 4], this.lineScr[j * 4 + 1])
        ctx.lineTo(this.lineScr[j * 4 + 2], this.lineScr[j * 4 + 3])
        ctx.stroke()
        continue
      }
      const i = k
      const o = i * 8
      const ax = S[o], ay = S[o + 1], bx = S[o + 2], by = S[o + 3]
      const cx = S[o + 4], cyy = S[o + 5], dx = S[o + 6], dy = S[o + 7]
      const f = this.facing[i]
      const front = f > 0
      const shade = front ? 0.6 + 0.5 * f : 0.42 + 0.12 * -f
      const alpha = front ? 1 : 0.78

      // podklad, mírně přetažený přes další úsek proti švům
      const ex = 0.18
      ctx.fillStyle = rgb(this.base[i], shade * (front ? 0.62 : 0.5), alpha)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx + (bx - ax) * ex, by + (by - ay) * ex)
      ctx.lineTo(cx + (cx - dx) * ex, cyy + (cyy - dy) * ex)
      ctx.lineTo(dx, dy)
      ctx.closePath()
      ctx.fill()

      // období v pruzích
      const fl = this.fills[i]
      if (fl) {
        for (const fi of fl) {
          const g = 0.07
          const l0 = (fi.lane + g) / lanes
          const l1 = (fi.lane + 1 - g) / lanes
          const e0 = fi.f0
          const e1 = Math.min(1 + ex, fi.f1 === 1 ? 1 + ex : fi.f1)
          const P = (fu: number, lv: number) => {
            const bxu = ax + (bx - ax) * fu
            const byu = ay + (by - ay) * fu
            const txu = dx + (cx - dx) * fu
            const tyu = dy + (cyy - dy) * fu
            return [bxu + (txu - bxu) * lv, byu + (tyu - byu) * lv]
          }
          const p1 = P(e0, l0), p2 = P(e1, l0), p3 = P(e1, l1), p4 = P(e0, l1)
          const hi = this.focusPeriod === fi.pid ? 1.35 : 1
          ctx.fillStyle = rgb(fi.color, shade * hi, alpha)
          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.lineTo(p3[0], p3[1])
          ctx.lineTo(p4[0], p4[1])
          ctx.closePath()
          ctx.fill()
        }
      }

      // značky měsíců / ročních období / roků
      const t = this.tick[i]
      const segLen = Math.hypot(bx - ax, by - ay)
      if (t) {
        const tf = this.tickF[i]
        const x0 = ax + (bx - ax) * tf, y0 = ay + (by - ay) * tf
        const x1 = dx + (cx - dx) * tf, y1 = dy + (cyy - dy) * tf
        ctx.strokeStyle = t === 3 ? 'rgba(255,255,255,0.85)' : t === 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)'
        ctx.lineWidth = t === 3 ? 1.6 : 1
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      // detail při přiblížení: týdny a dny
      const perDay = segLen / SEG_DAYS
      if (front && perDay > 3) {
        for (let dd = 0; dd < SEG_DAYS; dd++) {
          const ms = this.startMs[i] + dd * DAY
          const dow = (Math.floor(ms / DAY) + 4) % 7 // 1. 1. 1970 byl čtvrtek
          const isMon = dow === 1
          if (!isMon && perDay < 7) continue
          const tf = dd / SEG_DAYS
          const x0 = ax + (bx - ax) * tf, y0 = ay + (by - ay) * tf
          const x1 = dx + (cx - dx) * tf, y1 = dy + (cyy - dy) * tf
          const len = isMon ? 0.22 : 0.1
          ctx.strokeStyle = isMon ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x0 + (x1 - x0) * len, y0 + (y1 - y0) * len)
          ctx.stroke()
          if (perDay > 22) {
            const day = new Date(ms).getUTCDate()
            ctx.fillStyle = 'rgba(255,255,255,0.55)'
            ctx.font = `${Math.min(11, perDay * 0.4)}px system-ui, sans-serif`
            ctx.fillText(String(day), x0 + (x1 - x0) * 0.12 + 2, y0 + (y1 - y0) * 0.12)
          }
        }
      }

      // výběr
      if (sel && this.ub[i] > sel[0] && this.ua[i] < sel[1]) {
        const s0 = Math.max(0, (sel[0] - this.ua[i]) / (this.ub[i] - this.ua[i]))
        const s1 = Math.min(1, (sel[1] - this.ua[i]) / (this.ub[i] - this.ua[i]))
        ctx.fillStyle = 'rgba(255,255,255,0.38)'
        ctx.beginPath()
        ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0)
        ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1)
        ctx.lineTo(dx + (cx - dx) * s1, dy + (cyy - dy) * s1)
        ctx.lineTo(dx + (cx - dx) * s0, dy + (cyy - dy) * s0)
        ctx.closePath()
        ctx.fill()
      }
    }

    this.drawLabels()
    this.drawArrow()
    this.drawHover()
  }

  private drawLabels() {
    const ctx = this.ctx
    ctx.textBaseline = 'middle'
    // roky u 1. ledna; při malé rozteči jen každý pátý
    for (const { u, label } of this.years) {
      const a = this.projectU(u, 0.5)
      const b = this.projectU(u + 1, 0.5)
      if (!a) continue
      const gap = b ? Math.abs(b.y - a.y) : 99
      const y = Number(label)
      if (gap < 9 && y % 5 !== 0) continue
      if (gap < 4 && y % 10 !== 0) continue
      const r = this.radius(u)
      const t = new Float32Array(3)
      this.put(u, 0.5, t, 0)
      // popisek posunout radiálně ven, ať nesedí na pásu
      const k = (r + 0.35 * (1 + u * 0.02)) / r
      this.project(t[0] * k, t[1], t[2] * k)
      const size = Math.max(9, Math.min(14, gap * 0.55))
      ctx.font = `600 ${size}px system-ui, sans-serif`
      ctx.fillStyle = y % 10 === 0 ? 'rgba(241,245,249,0.95)' : 'rgba(203,213,225,0.7)'
      ctx.textAlign = 'center'
      ctx.fillText(label, this.pc.x, this.pc.y)
    }
    // názvy měsíců nad posledním závitem
    const last = Math.floor(this.uEnd - 1e-6)
    for (let m = 0; m < 12; m++) {
      const y = this.birthYear + last
      const um = this.u(Date.UTC(y, m, 15))
      const uu = um > this.uEnd ? um - 1 : um
      if (uu < this.u0) continue
      const p = this.projectU(uu, 1.25)
      if (!p) continue
      ctx.font = '500 11px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(203,213,225,0.75)'
      ctx.textAlign = 'center'
      ctx.fillText(MONTHS_SHORT[m], p.x, p.y)
    }
    // narození
    const b = this.projectU(this.u0, -0.35)
    if (b) {
      ctx.font = '600 11px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(241,245,249,0.85)'
      ctx.textAlign = 'center'
      ctx.fillText('narození', b.x, b.y)
    }
  }

  // šipka na konci (dnešek), jako na referenčním obrázku
  private drawArrow() {
    const u = this.uEnd
    const len = (this.shape.band * this.shape.pitch * 1.3) / TAU
    const pts: [number, number][] = []
    for (const [uu, lv] of [
      [u, -0.25],
      [u + len, 0.5],
      [u, 1.25],
    ] as [number, number][]) {
      const p = this.projectU(uu, lv)
      if (!p) return
      pts.push([p.x, p.y])
    }
    const ctx = this.ctx
    // vzadu (za pásem) jen tlumeně, kreslí se mimo řazení podle hloubky
    ctx.fillStyle = this.facing[this.n - 1] > 0 ? 'rgba(241,245,249,0.92)' : 'rgba(241,245,249,0.25)'
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    ctx.lineTo(pts[1][0], pts[1][1])
    ctx.lineTo(pts[2][0], pts[2][1])
    ctx.closePath()
    ctx.fill()
  }

  // stejný den roku ve všech letech: ukazuje, co leží nad sebou
  private drawHover() {
    if (this.hoverU === null) return
    const ctx = this.ctx
    const frac = this.hoverU - Math.floor(this.hoverU)
    for (let k = Math.floor(this.u0); k <= Math.ceil(this.uEnd); k++) {
      const u = k + frac
      if (u < this.u0 || u > this.uEnd) continue
      const a = this.projectU(u, 0)
      const b = this.projectU(u, 1)
      if (!a || !b) continue
      const isCur = Math.abs(u - this.hoverU) < 1e-6
      ctx.strokeStyle = isCur ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)'
      ctx.lineWidth = isCur ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  // ---------- výběr myší ----------

  pick(px: number, py: number): Hit | null {
    const S = this.scr
    for (let q = this.order.length - 1; q >= 0; q--) {
      const i = this.order[q]
      if (i >= this.n) continue
      const o = i * 8
      const xs = [S[o], S[o + 2], S[o + 4], S[o + 6]]
      const ys = [S[o + 1], S[o + 3], S[o + 5], S[o + 7]]
      if (!inQuad(px, py, xs, ys)) continue
      // poloha uvnitř úseku: podél (t) a napříč pásem (v)
      const ex = xs[1] - xs[0], ey = ys[1] - ys[0]
      const t = clamp01(((px - xs[0]) * ex + (py - ys[0]) * ey) / (ex * ex + ey * ey || 1))
      const bx = xs[0] + ex * t, by = ys[0] + ey * t
      const tx = xs[3] + (xs[2] - xs[3]) * t, ty = ys[3] + (ys[2] - ys[3]) * t
      const vx = tx - bx, vy = ty - by
      const v = clamp01(((px - bx) * vx + (py - by) * vy) / (vx * vx + vy * vy || 1))
      const u = this.ua[i] + (this.ub[i] - this.ua[i]) * t
      const lanes = Math.max(1, this.categories.length)
      const lane = Math.min(lanes - 1, Math.floor(v * lanes))
      let periodId: string | null = null
      for (const f of this.fills[i] ?? []) if (f.lane === lane && t >= f.f0 && t <= f.f1) periodId = f.pid
      return { u, ms: this.msAt(u), lane, periodId }
    }
    return null
  }
}

function inQuad(px: number, py: number, xs: number[], ys: number[]) {
  let sign = 0
  for (let k = 0; k < 4; k++) {
    const x1 = xs[k], y1 = ys[k], x2 = xs[(k + 1) % 4], y2 = ys[(k + 1) % 4]
    const c = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)
    if (c === 0) continue
    const s = c > 0 ? 1 : -1
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
function wrapAngle(a: number) {
  return ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI
}
