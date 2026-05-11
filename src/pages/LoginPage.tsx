import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from 'lucide-react'
import { isAuthed } from '../lib/auth'

type Tab = 'password' | 'code'

export default function LoginPage() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 197, 94, 0.05) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none"
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na hlavní stránku</span>
          </button>

          <div className="p-8 rounded-2xl bg-card border border-border relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
              }}
            />

            <div className="text-center mb-8 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center"
              >
                <Shield className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 600 }}>
                Privátní sekce
              </h1>
              <p className="text-muted-foreground">Přihlaste se pro přístup k chráněnému obsahu</p>
            </div>

            <div className="flex gap-1 mb-6 p-1 rounded-lg bg-secondary/40 border border-border relative z-10">
              <button
                type="button"
                onClick={() => switchTab('password')}
                className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
                  tab === 'password'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Heslo
              </button>
              <button
                type="button"
                onClick={() => switchTab('code')}
                className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
                  tab === 'code'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pozvánka
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {tab === 'password' ? (
                <div>
                  <label htmlFor="password" className="block mb-2">
                    Heslo
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="code" className="block mb-2">
                    Kód pozvánky
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none transition-colors font-mono uppercase tracking-widest"
                    placeholder="ABCD-EF3G"
                    autoComplete="off"
                    spellCheck={false}
                    required
                  />
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    <span>Ověřování...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Přihlásit se</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Zabezpečeno end-to-end šifrováním</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
