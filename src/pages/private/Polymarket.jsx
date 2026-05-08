import { useState, useEffect, useCallback } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

function Badge({ action }) {
  const map = {
    BUY_UP:   ['badge badge--up',   '🟢 BUY UP'],
    BUY_DOWN: ['badge badge--down', '🔴 BUY DOWN'],
    SKIP:     ['badge badge--skip', '⚪ SKIP'],
  }
  const [cls, label] = map[action] || ['badge badge--skip', action]
  return <span className={cls}>{label}</span>
}

function ConfidenceBar({ conf }) {
  const pct = Math.round(conf * 100)
  const color = pct >= 75 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--text-muted)'
  return (
    <div className="confidence-bar">
      <div className="confidence-bar__track">
        <div className="confidence-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="confidence-bar__label">{pct}%</span>
    </div>
  )
}

function MarketCard({ market }) {
  const labelMap = { 'btc-updown-5m': '5 min', 'btc-updown-15m': '15 min' }
  const labelKey = market.slug?.startsWith('btc-updown-5m') ? 'btc-updown-5m' : 'btc-updown-15m'
  const label = labelMap[labelKey] || labelKey
  const yesVal = market.yes != null ? (market.yes * 100).toFixed(1) + '%' : '—'
  const noVal  = market.no  != null ? (market.no  * 100).toFixed(1) + '%' : '—'
  const endStr = market.end_date
    ? new Date(market.end_date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
    : ''

  return (
    <div className="market-card">
      <div className="market-card__label">
        {market.active && <span className="live-dot" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />}
        {label}
      </div>
      <div className="market-card__question">{market.question}</div>
      <div className="market-card__prices">
        <div className="market-price">
          <span className="market-price__label">YES</span>
          <span className="market-price__value market-price__value--yes">{yesVal}</span>
        </div>
        <div className="market-price">
          <span className="market-price__label">NO</span>
          <span className="market-price__value market-price__value--no">{noVal}</span>
        </div>
      </div>
      {endStr && <div className="market-card__footer">Expirace: {endStr}</div>}
    </div>
  )
}

export default function Polymarket() {
  const [signals, setSignals] = useState([])
  const [markets, setMarkets] = useState([])
  const [filter, setFilter] = useState('all')
  const [signalsTime, setSignalsTime] = useState('Načítám…')
  const [marketsTime, setMarketsTime] = useState('')
  const [signalsError, setSignalsError] = useState(false)
  const [marketsError, setMarketsError] = useState(false)

  const loadSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/signals')
      if (!res.ok) throw new Error(res.status)
      setSignals(await res.json())
      setSignalsTime('Aktualizováno ' + new Date().toLocaleTimeString('cs-CZ'))
      setSignalsError(false)
    } catch {
      setSignalsTime('Chyba načítání')
      setSignalsError(true)
    }
  }, [])

  const loadMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/polymarket')
      if (!res.ok) throw new Error(res.status)
      const data = await res.json()
      setMarkets(data.markets || [])
      setMarketsTime('Aktualizováno ' + new Date().toLocaleTimeString('cs-CZ'))
      setMarketsError(false)
    } catch {
      setMarketsTime('Chyba načítání')
      setMarketsError(true)
    }
  }, [])

  useEffect(() => {
    loadSignals()
    loadMarkets()
    const s = setInterval(loadSignals, 60_000)
    const m = setInterval(loadMarkets, 60_000)
    return () => { clearInterval(s); clearInterval(m) }
  }, [loadSignals, loadMarkets])

  const filtered = filter === 'all' ? signals : signals.filter(s => s.action === filter)

  const up   = signals.filter(s => s.action === 'BUY_UP').length
  const down = signals.filter(s => s.action === 'BUY_DOWN').length
  const skip = signals.filter(s => s.action === 'SKIP').length
  const actionable = signals.filter(s => s.action !== 'SKIP')
  const avgConf = actionable.length
    ? Math.round(actionable.reduce((a, s) => a + s.confidence, 0) / actionable.length * 100) + '%'
    : '—'

  return (
    <>
      <Header backTo="/private" backLabel="Zpět" showLogout />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <p className="hero-eyebrow">Privátní sekce</p>
              <h1 className="hero-title">Polymarket Bot</h1>
              <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                Live BTC signály generované OpenRouter AI na základě technické analýzy + Polymarket YES/NO cen.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">

            <div className="section-label">
              <span className="live-dot" />
              Sledované trhy
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {marketsTime}
              </span>
            </div>

            <div className="markets-grid">
              {markets.length === 0 && !marketsError && (
                <>
                  <div className="market-card market-card--loading">
                    <div className="market-card__label">5 min</div>
                    <div className="market-card__question">Načítám…</div>
                  </div>
                  <div className="market-card market-card--loading">
                    <div className="market-card__label">15 min</div>
                    <div className="market-card__question">Načítám…</div>
                  </div>
                </>
              )}
              {marketsError && (
                <div className="market-card">
                  <div className="market-card__question" style={{ color: 'var(--text-muted)' }}>Chyba načítání trhů.</div>
                </div>
              )}
              {markets.map((m, i) => <MarketCard key={i} market={m} />)}
            </div>

            <div className="stats-row">
              {[
                { label: 'Celkem signálů', value: signals.length || '—', style: {} },
                { label: 'BUY UP',  value: up  || '—', style: { color: 'var(--green)' } },
                { label: 'BUY DOWN', value: down || '—', style: { color: 'var(--red)' } },
                { label: 'SKIP', value: skip || '—', style: { color: 'var(--text-muted)' } },
                { label: 'Průměrná confidence', value: avgConf, style: {} },
              ].map(({ label, value, style }) => (
                <div key={label} className="stat-card">
                  <div className="stat-card__label">{label}</div>
                  <div className="stat-card__value" style={style}>{value}</div>
                </div>
              ))}
            </div>

            <div className="section-header">
              <div className="filters">
                {['all', 'BUY_UP', 'BUY_DOWN', 'SKIP'].map(f => (
                  <button
                    key={f}
                    className={`filter-btn${filter === f ? ' active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'Vše' : f === 'BUY_UP' ? '🟢 BUY UP' : f === 'BUY_DOWN' ? '🔴 BUY DOWN' : '⚪ Skip'}
                  </button>
                ))}
              </div>
              <span className="refresh-info">{signalsTime}</span>
            </div>

            <div className="table-wrap">
              <table className="signal-table">
                <thead>
                  <tr>
                    <th>Čas (UTC)</th>
                    <th>Cena BTC</th>
                    <th>Signál</th>
                    <th>Confidence</th>
                    <th>Zdůvodnění</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state__icon">{signalsError ? '⚠️' : signals.length === 0 ? '⏳' : '📭'}</div>
                          {signalsError ? 'Chyba načítání signálů.' : signals.length === 0 ? 'Načítám signály…' : 'Žádné signály pro tento filtr.'}
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((s, i) => (
                    <tr key={i}>
                      <td className="time-cell">{s.timestamp || '—'}</td>
                      <td className="price-cell">${Number(s.btc_price).toLocaleString('cs-CZ')}</td>
                      <td><Badge action={s.action} /></td>
                      <td><ConfidenceBar conf={s.confidence} /></td>
                      <td><div className="reasoning">{s.reasoning || '—'}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
