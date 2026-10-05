import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Check, KeyRound, LogOut, UserRound } from 'lucide-react'
import { authError, fetchMe, isAuthed, logout, type Me } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, SiteFooter, TopBar } from '../ui/brand'

const MODULE_LABEL: Record<string, string> = {
  zalivka: 'Zálivka',
  spirala: 'Spirála',
  geckos: 'Gekoni',
  polymarket: 'Polymarket',
}

export default function AccountPage() {
  useDocumentTitle('Můj účet · mmaly.cz')
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [next2, setNext2] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/account', { replace: true })
      return
    }
    fetchMe().then((m) => {
      if (!m) navigate('/login?from=/private/account', { replace: true })
      else setMe(m)
    })
  }, [navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setDone(false)
    if (next !== next2) {
      setError('Nová hesla se neshodují.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      })
      if (res.ok) {
        setDone(true)
        setCurrent('')
        setNext('')
        setNext2('')
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(authError(data.error))
      }
    } catch {
      setError('Chyba připojení.')
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!me) return null

  return (
    <div className="hub-page">
      <TopBar
        section="privátní"
        actions={
          <button onClick={handleLogout} className="hub-btn hub-btn-danger">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Odhlásit</span>
          </button>
        }
      />

      <main className="hub-container max-w-3xl">
        <PageHeader
          back="/private"
          icon={<UserRound className="w-6 h-6" />}
          iconTone="aqua"
          eyebrow="Můj účet"
          title={<span className="font-mono">{me.username}</span>}
          subtitle={me.role === 'admin' ? 'Admin · přístup ke všemu' : 'Uživatel'}
        />

        <section className="hub-card p-5 sm:p-6 mb-6">
          <div className="hub-label mb-3">Povolené moduly</div>
          <div className="flex flex-wrap gap-2">
            {me.modules.length === 0 && <span className="text-sm text-muted-foreground">žádné</span>}
            {me.modules.map((m) => (
              <span key={m} className="hub-pill hub-pill-ok">{MODULE_LABEL[m] ?? m}</span>
            ))}
          </div>
        </section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hub-card p-5 sm:p-6">
          <h2 className="hub-title text-xl mb-1 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-aqua" /> Změna hesla
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Aspoň 10 znaků. Po změně se odhlásí všechna ostatní zařízení.
          </p>

          <form onSubmit={submit} className="grid gap-4 sm:max-w-md">
            <label>
              <span className="hub-label block mb-2">Současné heslo</span>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="hub-input" autoComplete="current-password" required />
            </label>
            <label>
              <span className="hub-label block mb-2">Nové heslo</span>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="hub-input" autoComplete="new-password" minLength={10} required />
            </label>
            <label>
              <span className="hub-label block mb-2">Nové heslo znovu</span>
              <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} className="hub-input" autoComplete="new-password" required />
            </label>

            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-raspberry/10 border border-raspberry/25 text-sm text-raspberry" role="alert">
                {error}
              </div>
            )}
            {done && (
              <div className="px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-sm text-primary flex items-center gap-2" role="status">
                <Check className="w-4 h-4" /> Heslo změněno.
              </div>
            )}

            <button type="submit" disabled={busy} className="hub-btn hub-btn-primary w-fit">
              Změnit heslo
            </button>
          </form>
        </motion.section>
      </main>

      <SiteFooter note={me.username} />
    </div>
  )
}
