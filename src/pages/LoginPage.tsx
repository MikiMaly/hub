import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from 'lucide-react'
import { isAuthed } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { LogoMark, TopBar } from '../ui/brand'

type Tab = 'password' | 'code'

export default function LoginPage() {
  useDocumentTitle('Přihlášení · mmaly.cz')
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from = searchParams.get('from') || '/private'

  useEffect(() => {
    if (isAuthed()) {
      window.location.replace(from)
    }
  }, [from])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const payload =
      tab === 'password'
        ? { password }
        : { code: code.trim().toUpperCase() }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        window.location.href = from
        return
      }

      if (res.status === 500) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Chyba serveru.')
      } else {
        setError(tab === 'password' ? 'Nesprávné heslo. Zkus to znovu.' : 'Neplatný kód pozvánky.')
      }
      setIsLoading(false)
    } catch {
      setError('Chyba připojení.')
      setIsLoading(false)
    }
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setError('')
  }

  return (
    <div className="hub-page flex flex-col">
      <TopBar
        actions={
          <Link to="/" className="hub-btn hub-btn-quiet">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Zpět na hlavní stránku</span>
          </Link>
        }
      />

      <main className="flex-1 grid place-items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="hub-card p-6 sm:p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
                className="mx-auto mb-5 w-fit"
              >
                <LogoMark size={56} />
              </motion.div>
              <div className="hub-eyebrow mb-2">Privátní sekce</div>
              <h1 className="hub-title text-3xl mb-2">Vítej zpátky</h1>
              <p className="text-sm text-muted-foreground">Přihlas se heslem nebo kódem z pozvánky.</p>
            </div>

            <div className="hub-segment w-full mb-6" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'password'}
                onClick={() => switchTab('password')}
              >
                Heslo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'code'}
                onClick={() => switchTab('code')}
              >
                Pozvánka
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {tab === 'password' ? (
                <div>
                  <label htmlFor="password" className="hub-label block mb-2">
                    Heslo
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="hub-input hub-input-lg pr-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-mint transition-colors"
                      aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="code" className="hub-label block mb-2">
                    Kód pozvánky
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="hub-input hub-input-lg font-mono uppercase tracking-[0.3em] text-center text-mint"
                    placeholder="ABCD-EF3G"
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                    required
                  />
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2.5 rounded-xl bg-raspberry/10 border border-raspberry/25 text-sm text-raspberry"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" disabled={isLoading} className="hub-btn hub-btn-primary hub-btn-lg w-full">
                {isLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    Ověřuji…
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Přihlásit se
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 hub-label">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Šifrované spojení · podepsaná session
          </p>
        </motion.div>
      </main>
    </div>
  )
}
