import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check,
  Copy,
  Key,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react'
import { isAdmin, isAuthed, logout } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, SiteFooter, TopBar } from '../ui/brand'

type InviteCode = {
  code: string
  label: string
  created: string
}

export default function InvitesPage() {
  useDocumentTitle('Pozvánky · mmaly.cz')
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
          icon={<Key className="w-6 h-6" />}
          iconTone="raspberry"
          eyebrow="Admin"
          title="Správa pozvánek"
          subtitle="Vytvářej a spravuj invite kódy pro přístup k privátní sekci."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="hub-card p-5 sm:p-6 mb-6"
        >
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex-1">
              <span className="hub-label block mb-2">Jméno / popis</span>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="např. Kamarád Petr"
                className="hub-input hub-input-lg"
              />
            </label>
            <button
              type="submit"
              disabled={creating || !label.trim()}
              className="hub-btn hub-btn-primary hub-btn-lg"
            >
              {creating ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Vytvořit kód
            </button>
          </form>

          <AnimatePresence>
            {justCreated && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="hub-label mb-1">Nový kód vytvořen</div>
                    <code className="font-mono text-mint text-lg tracking-[0.25em]">{justCreated}</code>
                  </div>
                  <button onClick={() => handleCopy(justCreated)} className="hub-btn hub-btn-sm hub-btn-soft">
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
              className="mt-4 px-3 py-2.5 rounded-xl bg-raspberry/10 border border-raspberry/25 text-raspberry text-sm"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hub-card overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Načítám…</div>
          ) : codes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Zatím žádné pozvánky.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3.5 hub-label font-medium">Kód</th>
                    <th className="text-left px-5 py-3.5 hub-label font-medium">Jméno</th>
                    <th className="text-left px-5 py-3.5 hub-label font-medium">Vytvořeno</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr
                      key={c.code}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-mint tracking-[0.2em]">{c.code}</code>
                          <button
                            onClick={() => handleCopy(c.code)}
                            className="hub-btn hub-btn-quiet hub-btn-icon !min-h-8 !w-8"
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
                      <td className="px-5 py-3.5">{c.label}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-sm tabular-nums">{c.created}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => handleDelete(c.code)} className="hub-btn hub-btn-sm hub-btn-danger">
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
        </motion.div>
      </main>

      <SiteFooter note="admin" />
    </div>
  )
}
