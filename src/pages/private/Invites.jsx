import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function Invites() {
  const [codes, setCodes] = useState(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadCodes() {
    const res = await fetch('/api/invite')
    if (res.status === 403) {
      setCodes([])
      setError('Přístup odepřen — přihlaste se jako admin.')
      return
    }
    setCodes(await res.json())
  }

  useEffect(() => { loadCodes() }, [])

  async function createCode() {
    if (!label.trim()) { setError('Zadej jméno.'); return }
    setError('')
    setCreating(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() }),
    })
    setCreating(false)
    if (!res.ok) { setError('Chyba.'); return }
    const { code } = await res.json()
    alert(`Kód vytvořen: ${code}`)
    setLabel('')
    loadCodes()
  }

  async function deleteCode(code) {
    if (!confirm(`Smazat kód ${code}?`)) return
    await fetch('/api/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    loadCodes()
  }

  return (
    <>
      <Header backTo="/private" backLabel="Zpět" showLogout />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <p className="hero-eyebrow">Admin</p>
              <h1 className="hero-title">Správa pozvánek</h1>
              <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                Vytvárej a spravuj invite kódy pro přístup k privátní sekci.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div id="tableWrap">
              {codes === null && <p className="inv-empty">Načítám…</p>}
              {codes !== null && codes.length === 0 && !error && <p className="inv-empty">Zatím žádné pozvánky.</p>}
              {codes !== null && codes.length > 0 && (
                <table className="inv-table">
                  <thead>
                    <tr><th>Kód</th><th>Jméno</th><th>Vytvořeno</th><th></th></tr>
                  </thead>
                  <tbody>
                    {codes.map(c => (
                      <tr key={c.code}>
                        <td><span className="inv-code">{c.code}</span></td>
                        <td>{c.label}</td>
                        <td>{c.created}</td>
                        <td><button className="inv-del" onClick={() => deleteCode(c.code)}>Smazat</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="inv-form">
              <div className="field">
                <label className="field-label">Jméno / popis</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="např. Kamarád Petr"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>
              <button className="btn" onClick={createCode} disabled={creating}>
                + Vytvořit kód
              </button>
            </div>
            {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
