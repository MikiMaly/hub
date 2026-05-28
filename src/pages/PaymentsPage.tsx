import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  Edit2,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { isAdmin, isAuthed, logout } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type Payment = {
  id: string
  name: string
  amount: number
  dueDate: string
  recurringMonths: number
  status?: 'active' | 'pending'
  recurring?: boolean       // starý formát pro backward compat
  accountNumber?: string
  varSymbol?: string
  note?: string
  emailSubject?: string     // předmět emailu ze kterého byl návrh vytvořen
}

type FormData = {
  name: string
  amount: string
  dueDate: string
  recurringMonths: number
  accountNumber: string
  varSymbol: string
  note: string
}

const MONTHS_GEN = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
]

function getNextDueDate(p: Payment): Date {
  const base = new Date(p.dueDate + 'T00:00:00')
  // backward compat: starý bool recurring → měsíčně
  const months = p.recurringMonths ?? (p.recurring ? 1 : 0)
  if (!months) return base

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(base)
  while (due < now) {
    due.setMonth(due.getMonth() + months)
  }
  return due
}

function getDaysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
  return `${date.getDate()}. ${MONTHS_GEN[date.getMonth()]} ${date.getFullYear()}`
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('cs-CZ') + ' Kč'
}

function pluralDays(n: number): string {
  const a = Math.abs(n)
  if (a === 1) return 'den'
  if (a <= 4) return 'dny'
  return 'dní'
}

const EMPTY_FORM: FormData = { name: '', amount: '', dueDate: '', recurringMonths: 0, accountNumber: '', varSymbol: '', note: '' }

const NOISE_BG = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
  mixBlendMode: 'overlay' as const,
}

export default function PaymentsPage() {
  useDocumentTitle('Platby — mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments')
      if (!res.ok) { setError('Nepodařilo se načíst platby.'); return }
      setPayments((await res.json()) as Payment[])
      setError('')
    } catch {
      setError('Chyba připojení.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthed()) { navigate('/login?from=/private/payments', { replace: true }); return }
    if (!isAdmin()) { navigate('/private', { replace: true }); return }
    setReady(true)
    loadPayments()
  }, [navigate, loadPayments])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (p: Payment) => {
    setEditing(p)
    setForm({
      name: p.name,
      amount: String(p.amount),
      dueDate: p.dueDate,
      recurringMonths: p.recurringMonths ?? (p.recurring ? 1 : 0),
      accountNumber: p.accountNumber ?? '',
      varSymbol: p.varSymbol ?? '',
      note: p.note ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Zadej název.'); return }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError('Zadej platnou částku.')
      return
    }
    if (!form.dueDate) { setFormError('Zadej datum splatnosti.'); return }

    setSaving(true)
    setFormError('')

    const payload = {
      ...(editing && { id: editing.id }),
      name: form.name.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      recurringMonths: form.recurringMonths,
      ...(form.accountNumber.trim() && { accountNumber: form.accountNumber.trim() }),
      ...(form.varSymbol.trim() && { varSymbol: form.varSymbol.trim() }),
      ...(form.note.trim() && { note: form.note.trim() }),
    }

    try {
      const res = await fetch('/api/payments', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setFormError('Chyba při ukládání.'); return }
      setShowModal(false)
      await loadPayments()
    } catch {
      setFormError('Chyba připojení.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (p: Payment) => {
    try {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, status: 'active', recurringMonths: p.recurringMonths ?? 0 }),
      })
      await loadPayments()
    } catch {
      setError('Schválení selhalo.')
    }
  }

  const handleReject = async (p: Payment) => {
    try {
      await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      })
      await loadPayments()
    } catch {
      setError('Odmítnutí selhalo.')
    }
  }

  const handleDelete = async (p: Payment) => {
    if (!confirm(`Smazat platbu „${p.name}"?`)) return
    try {
      await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      })
      await loadPayments()
    } catch {
      setError('Smazání selhalo.')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!ready) return null

  const pending = payments.filter(p => p.status === 'pending')
  const active = payments.filter(p => p.status !== 'pending')

  const sorted = [...active].sort(
    (a, b) => getNextDueDate(a).getTime() - getNextDueDate(b).getTime(),
  )

  const upcomingSoon = sorted.filter(p => {
    const d = getDaysUntil(getNextDueDate(p))
    return d >= 0 && d <= 7
  }).length

  const monthlyTotal = active.reduce((s, p) => {
    const months = p.recurringMonths ?? (p.recurring ? 1 : 0)
    if (months === 1) return s + p.amount
    if (months === 3) return s + p.amount / 3
    return s
  }, 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/private')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zpět</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Platby
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Odhlásit</span>
          </button>
        </div>
      </motion.nav>

      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-primary" />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>Platby</h1>
              </div>
              <motion.button
                onClick={openAdd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Přidat platbu
              </motion.button>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Přehled plateb s upozorněním na blížící se termíny.
            </p>

            <div className="flex flex-wrap gap-3">
              {monthlyTotal > 0 && (
                <div className="px-4 py-2 rounded-xl bg-card border border-border text-sm">
                  <span className="text-muted-foreground">Průměrně měsíčně: </span>
                  <span className="font-medium">{formatAmount(Math.round(monthlyTotal))}</span>
                </div>
              )}
              {upcomingSoon > 0 && (
                <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">
                    {upcomingSoon} {upcomingSoon === 1 ? 'platba' : upcomingSoon <= 4 ? 'platby' : 'plateb'} do 7 dní
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {pending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 relative rounded-2xl bg-card border border-yellow-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={NOISE_BG} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-yellow-500/20">
                  <Mail className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">
                    Ke schválení ({pending.length})
                  </span>
                </div>
                {pending.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{p.name}</div>
                      {p.emailSubject && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate opacity-60">
                          z emailu: {p.emailSubject}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(new Date(p.dueDate + 'T00:00:00'))}
                        {p.accountNumber && <span className="ml-2">· č.ú. {p.accountNumber}</span>}
                        {p.varSymbol && <span>· VS {p.varSymbol}</span>}
                      </div>
                    </div>
                    <div className="font-medium text-primary shrink-0">
                      {formatAmount(p.amount)}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button
                        onClick={() => handleApprove(p)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-sm font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Přijmout
                      </motion.button>
                      <button
                        onClick={() => handleReject(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 text-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Odmítnout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl bg-card border border-border overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={NOISE_BG} />

            <div className="relative z-10">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground">Načítám…</div>
              ) : sorted.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  Žádné platby. Přidej první pomocí tlačítka výše.
                </div>
              ) : (
                <div>
                  {sorted.map((p, i) => {
                    const nextDue = getNextDueDate(p)
                    const days = getDaysUntil(nextDue)
                    const overdue = days < 0
                    const urgent = !overdue && days <= 3
                    const soon = !overdue && !urgent && days <= 7

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          overdue ? 'bg-destructive' :
                          urgent  ? 'bg-orange-500' :
                          soon    ? 'bg-yellow-500' :
                          'bg-primary/30'
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{p.name}</span>
                            {((p.recurringMonths ?? (p.recurring ? 1 : 0)) > 0) && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-muted-foreground border border-border">
                                <RefreshCw className="w-3 h-3" />
                                {(p.recurringMonths ?? 1) === 1 ? 'měsíčně' : 'čtvrtletně'}
                              </span>
                            )}
                            {(overdue || urgent || soon) && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                overdue ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                urgent  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                {overdue
                                  ? `Přes termín (${Math.abs(days)} ${pluralDays(days)})`
                                  : days === 0 ? 'Dnes!'
                                  : `Za ${days} ${pluralDays(days)}`}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(nextDue)}
                          </div>
                          {(p.accountNumber || p.varSymbol || p.note) && (
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 opacity-70">
                              {p.accountNumber && <span>č.ú. {p.accountNumber}</span>}
                              {p.varSymbol && <span>VS {p.varSymbol}</span>}
                              {p.note && <span>{p.note}</span>}
                            </div>
                          )}
                        </div>

                        <div className="font-medium text-primary shrink-0">
                          {formatAmount(p.amount)}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            aria-label="Upravit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Smazat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">
                  {editing ? 'Upravit platbu' : 'Přidat platbu'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm text-muted-foreground">Název</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="např. Spotify, Nájemné…"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm text-muted-foreground">Částka (Kč)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="např. 199"
                    className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm text-muted-foreground">
                    {form.recurringMonths > 0 ? 'Datum příští splatnosti' : 'Datum splatnosti'}
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm text-muted-foreground">Opakování</label>
                  <div className="flex gap-2">
                    {([
                      { value: 0, label: 'Jednorázová' },
                      { value: 1, label: 'Každý měsíc' },
                      { value: 3, label: 'Každé 3 měsíce' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, recurringMonths: opt.value }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.recurringMonths === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-sm text-muted-foreground">Číslo účtu</label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                      placeholder="123456789/0800"
                      className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm text-muted-foreground">Variabilní symbol</label>
                    <input
                      type="text"
                      value={form.varSymbol}
                      onChange={e => setForm(f => ({ ...f, varSymbol: e.target.value }))}
                      placeholder="1234567890"
                      className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm text-muted-foreground">Poznámka</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="nepovinné"
                    className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  >
                    Zrušit
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Ukládám…' : editing ? 'Uložit' : 'Přidat'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
