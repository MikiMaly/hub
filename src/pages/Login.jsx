import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const [tab, setTab] = useState('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const from = params.get('from') || '/private'
    if (document.cookie.split(';').some(c => c.trim().startsWith('hub_ui=1'))) {
      navigate(from, { replace: true })
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const payload = tab === 'password'
      ? { password }
      : { code: code.trim().toUpperCase() }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        navigate(params.get('from') || '/private', { replace: true })
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 500) {
          setError(data.error || 'Chyba serveru.')
        } else {
          setError(tab === 'password' ? 'Nesprávné heslo. Zkus to znovu.' : 'Neplatný kód pozvánky.')
        }
      }
    } catch {
      setError('Chyba připojení.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-noise" />
      <div className="login-orb" />

      <div className="login-wrapper">
        <Link to="/" className="login-back login-back--top">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Zpět na hlavní stránku
        </Link>

        <div className="login-card">
          <div className="login-shield-wrap">
            <div className="login-shield">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h1 className="login-title">Privátní sekce</h1>
            <p className="login-sub">Přihlaste se pro přístup k chráněnému obsahu</p>
          </div>

          <div className="login-tabs">
            <button type="button" className={`login-tab${tab === 'password' ? ' active' : ''}`} onClick={() => { setTab('password'); setError('') }}>Heslo</button>
            <button type="button" className={`login-tab${tab === 'code' ? ' active' : ''}`} onClick={() => { setTab('code'); setError('') }}>Pozvánka</button>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {tab === 'password' ? (
              <div className="field">
                <label className="field-label">Heslo</label>
                <div className="field-input-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="field-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="field-toggle-pw" onClick={() => setShowPw(p => !p)}>
                    {showPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div className="field">
                <label className="field-label">Kód pozvánky</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="ABCD-EF3G"
                  autoComplete="off"
                  spellCheck={false}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>
            )}
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn btn--full" disabled={loading}>
              {loading ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>
        </div>

        <div className="login-secure">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Zabezpečeno end-to-end šifrováním
        </div>
      </div>
    </div>
  )
}
