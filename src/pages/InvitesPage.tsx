import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Check,
  Copy,
  Key,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react'
import { isAdmin, isAuthed, logout } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type InviteCode = {
  code: string
  label: string
  created: string
}

export default function InvitesPage() {
  useDocumentTitle('Pozvánky — mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invite')
      if (res.status === 403) {
        setError('Přístup odepřen — přihlas se jako admin.')
        setCodes([])
        return
      }
      if (!res.ok) {
        setError('Nepodařilo se načíst kódy.')
        return
      }
      const data = (await res.json()) as InviteCode[]
      setCodes(data)
      setError('')
    } catch {
      setError('Chyba připojení.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private/invites', { replace: true })
      return
    }
    if (!isAdmin()) {
      navigate('/private', { replace: true })
      return
    }
    setReady(true)
    loadCodes()
  }, [navigate, loadCodes])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      setError('Zadej jméno nebo popis.')
      return
    }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      })
      if (!res.ok) {
        setError('Chyba při vytváření.')
        return
      }
      const data = (await res.json()) as { code: string }
      setJustCreated(data.code)
      setLabel('')
      await loadCodes()
    } catch {
      setError('Chyba připojení.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`Smazat kód ${code}?`)) return
    try {
      await fetch('/api/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (justCreated === code) setJustCreated(null)
      await loadCodes()
    } catch {
      setError('Smazání selhalo.')
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000)
    } catch {
      // clipboard API might be unavailable on http localhost; ignore
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!ready) return null

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
              <Key className="w-3 h-3" />
              Admin
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
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-8 h-8 text-primary" />
              <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>Správa pozvánek</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Vytvárej a spravuj invite kódy pro přístup k privátní sekci.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative p-6 rounded-2xl bg-card border border-border overflow-hidden mb-8"
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
              }}
            />
            <form onSubmit={handleCreate} className="relative z-10 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="label" className="block mb-2 text-sm text-muted-foreground">
                  Jméno / popis
                </label>
                <input
                  id="label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="např. Kamarád Petr"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <motion.button
                type="submit"
                disabled={creating || !label.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="sm:self-end flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                <span>Vytvořit kód</span>
              </motion.button>
            </form>

            <AnimatePresence>
              {justCreated && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="relative z-10 overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground mb-1">Nový kód vytvořen</div>
                      <code className="font-mono text-primary text-lg tracking-widest">
                        {justCreated}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy(justCreated)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm transition-colors"
                    >
                      {copied === justCreated ? (
                        <>
                          <Check className="w-4 h-4" />
                          Zkopírováno
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Zkopírovat
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl bg-card border border-border overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
              }}
            />

            <div className="relative z-10">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground">Načítám…</div>
              ) : codes.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  Zatím žádné pozvánky.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Kód
                        </th>
                        <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Jméno
                        </th>
                        <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Vytvořeno
                        </th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => (
                        <tr
                          key={c.code}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-primary tracking-widest">
                                {c.code}
                              </code>
                              <button
                                onClick={() => handleCopy(c.code)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Zkopírovat kód"
                              >
                                {copied === c.code ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground">{c.label}</td>
                          <td className="px-6 py-4 text-muted-foreground text-sm">{c.created}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(c.code)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Smazat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
