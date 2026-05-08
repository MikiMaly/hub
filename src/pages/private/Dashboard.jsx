import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Lock, Activity, TrendingUp, Zap, BarChart2, ExternalLink, ArrowRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

function timeAgo(timestamp) {
  if (!timestamp) return '—'
  let date
  if (typeof timestamp === 'number') {
    date = new Date(timestamp > 1e10 ? timestamp : timestamp * 1000)
  } else {
    const s = String(timestamp).trim()
    date = new Date(/[TZ]/i.test(s) ? s : s.replace(' ', 'T') + 'Z')
  }
  if (isNaN(date.getTime())) return '—'
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Dashboard() {
  const isAdmin = getCookie('hub_admin_ui') === '1'
  const navigate = useNavigate()

  const [signals, setSignals] = useState([])
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/signals').then(r => r.ok ? r.json() : []),
      fetch('/api/polymarket').then(r => r.ok ? r.json() : { markets: [] }),
    ]).then(([sigs, mkt]) => {
      setSignals(sigs)
      setMarkets(mkt.markets || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const total = signals.length
  const up = signals.filter(s => s.action === 'BUY_UP').length
  const down = signals.filter(s => s.action === 'BUY_DOWN').length
  const activeMarkets = markets.filter(m => m.active).length
  const recentSignals = signals.slice(0, 6)

  const stats = [
    { label: 'Celkem signálů', value: loading ? '…' : total, icon: BarChart2, note: `${up} UP · ${down} DOWN` },
    { label: 'Live trhy', value: loading ? '…' : activeMarkets, icon: Activity, note: 'Polymarket BTC' },
    { label: 'Bot status', value: 'Aktivní', icon: Zap, note: 'OpenRouter AI' },
    { label: 'Projekty', value: isAdmin ? '3' : '2', icon: TrendingUp, note: 'V produkci' },
  ]

  const projects = [
    {
      icon: '📊',
      title: 'Polymarket Bot',
      description: 'Live BTC signály generované OpenRouter AI na základě technické analýzy (RSI, EMA, volume) + Polymarket YES/NO cen.',
      fullDescription: 'Python bot připojený na Binance WebSocket stream. Každé 2 minuty analyzuje indikátory a volá AI model pro generování trading signálů.',
      tags: ['python', 'openrouter', 'binance', 'cloudflare kv'],
      status: 'production',
      stats: { 'Signálů': loading ? '…' : total, 'Live trhy': loading ? '…' : activeMarkets, 'Interval': '2 min' },
      to: '/private/polymarket',
    },
    {
      icon: '📹',
      title: 'Ultimate Video Downloader',
      description: 'Webové UI pro stahování videí z YouTube a stovek dalších zdrojů. Fronta, audio mód, paralelní stahování.',
      fullDescription: 'Python aplikace s yt-dlp backendem a webovým frontendem. Dostupná jako desktop app pro Windows a macOS.',
      tags: ['python', 'yt-dlp', 'flask'],
      status: 'production',
      stats: { Platforma: 'Win · Mac', Zdroje: '1000+', Verze: 'latest' },
      href: 'https://uwd.mmaly.cz',
    },
    ...(isAdmin ? [{
      icon: '🔑',
      title: 'Správa pozvánek',
      description: 'Vytváří a spravuje invite kódy pro přístup k privátní sekci. Uloženo v Cloudflare KV.',
      fullDescription: 'Admin nástroj pro generování jednorázových invite kódů ve formátu XXXX-XXXX.',
      tags: ['cloudflare', 'kv', 'admin'],
      status: 'admin',
      stats: { Storage: 'CF KV', Format: 'XXXX-XXXX', Přístup: 'Admin' },
      to: '/private/invites',
    }] : []),
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header backTo="/" backLabel="Domů" showGithub showLogout />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-primary" />
              <h1 className="text-4xl lg:text-5xl font-semibold">Privátní projekty</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Interní nástroje a projekty dostupné pouze autorizovaným uživatelům.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                  mixBlendMode: 'overlay',
                }} />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-semibold mb-1 relative z-10">{stat.value}</div>
                <div className="text-xs text-muted-foreground relative z-10">{stat.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Projects */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-6">Všechny projekty</h2>
              <div className="space-y-6">
                {projects.map((project, i) => {
                  const inner = (
                    <>
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                        mixBlendMode: 'overlay',
                      }} />
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                            {project.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{project.title}</h3>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              project.status === 'production' ? 'bg-primary/10 text-primary' :
                              project.status === 'admin' ? 'bg-chart-4/10 text-amber-400' : 'bg-muted text-muted-foreground'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                        </div>
                        {project.href ? (
                          <a href={project.href} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors relative z-20"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all relative z-20" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 relative z-10">{project.description}</p>
                      <p className="text-sm mb-4 relative z-10">{project.fullDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                        {project.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs rounded bg-secondary text-foreground">{tag}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border relative z-10">
                        {Object.entries(project.stats).map(([key, val]) => (
                          <div key={key}>
                            <div className="text-xs text-muted-foreground mb-1">{key}</div>
                            <div className="text-sm font-semibold">{val}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )

                  const className = "p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group relative overflow-hidden cursor-pointer"

                  return (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    >
                      {project.to ? (
                        <Link to={project.to} className={className + ' block no-underline text-foreground'}>
                          {inner}
                        </Link>
                      ) : (
                        <div className={className}>{inner}</div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent signals feed */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-xl bg-card border border-border relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                  mixBlendMode: 'overlay',
                }} />
                <h3 className="font-semibold mb-4 flex items-center gap-2 relative z-10">
                  <Activity className="w-5 h-5 text-primary" />
                  Poslední signály
                </h3>
                <div className="space-y-3 relative z-10">
                  {loading && <p className="text-sm text-muted-foreground">Načítám…</p>}
                  {!loading && recentSignals.length === 0 && (
                    <p className="text-sm text-muted-foreground">Žádné signály.</p>
                  )}
                  {recentSignals.map((s, i) => {
                    const isUp = s.action === 'BUY_UP'
                    const isDown = s.action === 'BUY_DOWN'
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                          isUp ? 'bg-primary/10 text-primary' : isDown ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isUp ? '↑' : isDown ? '↓' : '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {isUp ? 'BUY UP' : isDown ? 'BUY DOWN' : 'SKIP'} · {Math.round(s.confidence * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground truncate">${Number(s.btc_price).toLocaleString('cs-CZ')}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(s.timestamp)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {recentSignals.length > 0 && (
                  <Link to="/private/polymarket" className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm no-underline text-foreground relative z-10">
                    Zobrazit vše <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="p-6 rounded-xl bg-card border border-border relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                  mixBlendMode: 'overlay',
                }} />
                <h3 className="font-semibold mb-4 relative z-10">Rychlé akce</h3>
                <div className="space-y-2 relative z-10">
                  <Link to="/private/polymarket"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm no-underline font-medium"
                  >
                    📊 Polymarket dashboard
                  </Link>
                  <a href="https://uwd.mmaly.cz" target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm no-underline text-foreground"
                  >
                    📹 Otevřít UVD <ExternalLink className="w-3 h-3" />
                  </a>
                  {isAdmin && (
                    <Link to="/private/invites"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm no-underline text-foreground"
                    >
                      🔑 Správa pozvánek
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
