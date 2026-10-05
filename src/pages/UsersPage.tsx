import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Ban, Check, Copy, KeyRound, LogOut, RotateCcw, Trash2, Users } from 'lucide-react'
import { isAdmin, isAuthed, logout, type ModuleKey } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, SiteFooter, TopBar } from '../ui/brand'

type User = {
  id: number
  username: string
  role: 'admin' | 'user'
  status: 'pending' | 'active' | 'disabled'
  modules: ModuleKey[]
  note: string | null
  created_at: string
  approved_at: string | null
  last_login_at: string | null
}

const MODULE_LABEL: Record<ModuleKey, string> = {
  zalivka: '🪴 Zálivka',
  spirala: '🌀 Spirála',
  geckos: '🦎 Gekoni',
  polymarket: '📊 Polymarket',
}

const STATUS: Record<User['status'], { label: string; pill: string }> = {
  pending: { label: 'čeká na schválení', pill: 'hub-pill-warn' },
  active: { label: 'aktivní', pill: 'hub-pill-ok' },
  disabled: { label: 'zablokovaný', pill: 'hub-pill-danger' },
}

const when = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
// D1 CURRENT_TIMESTAMP je "YYYY-MM-DD HH:MM:SS" v UTC bez zóny.
const fmt = (s: string | null) => (s ? when.format(new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')) : '—')

export default function UsersPage() {
  useDocumentTitle('Uživatelé · mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [modules, setModules] = useState<ModuleKey[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [tempPassword, setTempPassword] = useState<{ username: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/users')
    if (!res.ok) {
      setError(res.status === 403 ? 'Přístup jen pro admina.' : 'Nepodařilo se načíst uživatele.')
      return
    }
    const data = (await res.json()) as { users: User[]; modules: ModuleKey[] }
    setUsers(data.users)
    setModules(data.modules)
    setError('')
  }, [])

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/users', { replace: true })
      return
    }
    if (!isAdmin()) {
      navigate('/private', { replace: true })
      return
    }
    load().finally(() => setReady(true))
  }, [navigate, load])

  const act = async (u: User, action: string, extra: Record<string, unknown> = {}) => {
    setBusy(u.id)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, action, ...extra }),
      })
      const data = (await res.json().catch(() => ({}))) as { password?: string; error?: string }
      if (!res.ok) {
        setError(`Akce selhala (${data.error ?? res.status}).`)
        return
      }
      if (data.password) setTempPassword({ username: u.username, password: data.password })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const remove = async (u: User) => {
    if (!confirm(`Smazat účet ${u.username} i všechna jeho data? Nejde vrátit.`)) return
    setBusy(u.id)
    try {
      const res = await fetch(`/api/users?id=${u.id}`, { method: 'DELETE' })
      if (!res.ok) setError('Smazání selhalo.')
      await load()
    } finally {
      setBusy(null)
    }
  }

  const resetPassword = (u: User) => {
    if (!confirm(`Vygenerovat ${u.username} nové dočasné heslo? Odhlásí ho to ze všech zařízení.`)) return
    act(u, 'reset_password')
  }

  const toggleModule = (u: User, m: ModuleKey) => {
    const next = u.modules.includes(m) ? u.modules.filter((x) => x !== m) : [...u.modules, m]
    act(u, 'set_modules', { modules: next })
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard nemusí být k dispozici; heslo je vidět, jde opsat
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!ready) return null

  const pending = users.filter((u) => u.status === 'pending')
  const others = users.filter((u) => u.status !== 'pending')

  return (
    <div className="hub-page">
      <TopBar
        section="admin"
        sectionTone="raspberry"
        actions={
          <button onClick={handleLogout} className="hub-btn hub-btn-danger">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Odhlásit</span>
          </button>
        }
      />

      <main className="hub-container max-w-5xl">
        <PageHeader
          back="/private"
          icon={<Users className="w-6 h-6" />}
          iconTone="raspberry"
          eyebrow="Admin"
          title="Uživatelé"
          subtitle="Schvalování registrací a přístup k modulům. Každý uživatel vidí jen svoje data."
        />

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-raspberry/10 border border-raspberry/25 text-raspberry text-sm" role="alert">
            {error}
          </div>
        )}

        {tempPassword && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="hub-card hub-edge-info p-5 mb-6"
          >
            <div className="hub-label mb-2">Dočasné heslo pro {tempPassword.username}</div>
            <div className="flex items-center gap-3 flex-wrap">
              <code className="font-mono text-lg text-mint tracking-wider">{tempPassword.password}</code>
              <button onClick={() => copy(tempPassword.password)} className="hub-btn hub-btn-sm hub-btn-aqua">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Zkopírováno' : 'Zkopírovat'}
              </button>
              <button onClick={() => setTempPassword(null)} className="hub-btn hub-btn-sm hub-btn-quiet ml-auto">
                Hotovo
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ukazuje se jen teď, nikde se neukládá. Předej ho a ať si ho hned změní v Můj účet.
            </p>
          </motion.div>
        )}

        <section className="mb-10">
          <div className="hub-eyebrow hub-eyebrow-raspberry mb-4">Čeká na schválení · {pending.length}</div>
          {pending.length === 0 ? (
            <div className="hub-card p-6 text-sm text-muted-foreground">Žádné nové registrace.</div>
          ) : (
            <div className="grid gap-3">
              {pending.map((u) => (
                <div key={u.id} className="hub-card hub-edge-warn p-4 sm:p-5 flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-semibold text-mint">{u.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {u.note ? `„${u.note}" · ` : ''}registrace {fmt(u.created_at)}
                    </div>
                  </div>
                  <button disabled={busy === u.id} onClick={() => act(u, 'approve')} className="hub-btn hub-btn-primary">
                    <Check className="w-4 h-4" /> Schválit
                  </button>
                  <button disabled={busy === u.id} onClick={() => remove(u)} className="hub-btn hub-btn-danger">
                    <Trash2 className="w-4 h-4" /> Zamítnout
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="hub-eyebrow mb-4">Účty · {others.length}</div>
          <div className="grid gap-3">
            {others.map((u) => {
              const isAdminRow = u.role === 'admin'
              return (
                <div key={u.id} className={'hub-card p-4 sm:p-5 ' + (u.status === 'disabled' ? 'opacity-70' : '')}>
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="font-mono font-semibold text-mint">{u.username}</span>
                    {isAdminRow ? (
                      <span className="hub-pill hub-pill-danger font-mono uppercase tracking-[0.12em]">admin</span>
                    ) : (
                      <span className={'hub-pill ' + STATUS[u.status].pill}>{STATUS[u.status].label}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      naposledy přihlášen {fmt(u.last_login_at)}
                    </span>
                  </div>

                  {u.note && <p className="text-sm text-muted-foreground mb-3">„{u.note}"</p>}

                  {isAdminRow ? (
                    <p className="text-sm text-muted-foreground">Admin má přístup ke všem modulům.</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="hub-label mr-1">moduly</span>
                      {modules.map((m) => {
                        const on = u.modules.includes(m)
                        return (
                          <button
                            key={m}
                            disabled={busy === u.id}
                            onClick={() => toggleModule(u, m)}
                            aria-pressed={on}
                            className={'hub-btn hub-btn-sm ' + (on ? 'hub-btn-soft' : 'hub-btn-quiet border border-border')}
                          >
                            {on && <Check className="w-3.5 h-3.5" />}
                            {MODULE_LABEL[m]}
                          </button>
                        )
                      })}

                      <span className="flex gap-2 ml-auto">
                        <button
                          disabled={busy === u.id}
                          onClick={() => resetPassword(u)}
                          className="hub-btn hub-btn-sm hub-btn-ghost"
                          title="Vygenerovat dočasné heslo"
                        >
                          <KeyRound className="w-4 h-4" /> Reset hesla
                        </button>
                        {u.status === 'active' ? (
                          <button disabled={busy === u.id} onClick={() => act(u, 'disable')} className="hub-btn hub-btn-sm hub-btn-danger">
                            <Ban className="w-4 h-4" /> Zablokovat
                          </button>
                        ) : (
                          <button disabled={busy === u.id} onClick={() => act(u, 'enable')} className="hub-btn hub-btn-sm hub-btn-soft">
                            <RotateCcw className="w-4 h-4" /> Odblokovat
                          </button>
                        )}
                        <button
                          disabled={busy === u.id}
                          onClick={() => remove(u)}
                          className="hub-btn hub-btn-sm hub-btn-quiet hub-btn-icon hover:!text-raspberry"
                          aria-label={`Smazat ${u.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <SiteFooter note="admin" />
    </div>
  )
}
