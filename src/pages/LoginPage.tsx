import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Check, Eye, EyeOff, Lock, Shield, UserPlus } from 'lucide-react'
import { authError, isAuthed } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { LogoMark, TopBar } from '../ui/brand'

type Tab = 'login' | 'register'

export default function LoginPage() {
  useDocumentTitle('Přihlášení · mmaly.cz')
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('register') !== null ? 'register' : 'login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [note, setNote] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
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

    if (tab === 'register' && password !== password2) {
      setError('Hesla se neshodují.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(tab === 'login' ? '/api/login' : '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tab === 'login'
            ? { username: username.trim(), password }
            : { username: username.trim(), password, note: note.trim() || undefined },
        ),
      })

      if (res.ok) {
        if (tab === 'login') {
          window.location.href = from
          return
        }
        setRegistered(true)
        setPassword('')
        setPassword2('')
        setIsLoading(false)
        return
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(authError(data.error, res.status >= 500 ? 'Chyba serveru.' : 'Nepovedlo se.'))
      setIsLoading(false)
    } catch {
      setError('Chyba připojení.')
      setIsLoading(false)
    }
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setError('')
    setRegistered(false)
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
              <h1 className="hub-title text-3xl mb-2">{tab === 'login' ? 'Vítej zpátky' : 'Nový účet'}</h1>
              <p className="text-sm text-muted-foreground">
                {tab === 'login'
                  ? 'Přihlas se svým jménem a heslem.'
                  : 'Po registraci účet ručně schválím, pak se můžeš přihlásit.'}
              </p>
            </div>

            <div className="hub-segment w-full mb-6" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => switchTab('login')}>
                Přihlášení
              </button>
              <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => switchTab('register')}>
                Registrace
              </button>
            </div>

            {registered ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25"
                role="status"
              >
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Registrace odeslána</div>
                  <p className="text-muted-foreground">
                    Účet <b className="text-mint font-mono">{username.trim().toLowerCase()}</b> čeká na schválení.
                    Až ho povolím, přihlásíš se tady jménem a heslem.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="hub-label block mb-2">
                    Uživatelské jméno
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="hub-input hub-input-lg font-mono"
                    placeholder="např. petr"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    required
                  />
                </div>

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
                      placeholder="••••••••••"
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      minLength={tab === 'register' ? 10 : undefined}
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
                  {tab === 'register' && (
                    <p className="text-xs text-muted-foreground mt-1.5">Aspoň 10 znaků, nesmí obsahovat jméno.</p>
                  )}
                </div>

                {tab === 'register' && (
                  <>
                    <div>
                      <label htmlFor="password2" className="hub-label block mb-2">
                        Heslo znovu
                      </label>
                      <input
                        id="password2"
                        type={showPassword ? 'text' : 'password'}
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        className="hub-input hub-input-lg"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="note" className="hub-label block mb-2">
                        Kdo jsi? <span className="normal-case tracking-normal">(nepovinné)</span>
                      </label>
                      <input
                        id="note"
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="hub-input"
                        placeholder="ať vím, koho schvaluju"
                        maxLength={200}
                      />
                    </div>
                  </>
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
                      {tab === 'login' ? 'Ověřuji…' : 'Odesílám…'}
                    </>
                  ) : tab === 'login' ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Přihlásit se
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Zaregistrovat
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 hub-label">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Šifrované spojení · hesla jen jako hash
          </p>
        </motion.div>
      </main>
    </div>
  )
}
