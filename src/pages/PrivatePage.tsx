import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, ExternalLink, Github, LogOut, UserRound, Users } from 'lucide-react'
import { fetchMe, isAuthed, logout, type Me, type ModuleKey } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageHeader, SiteFooter, TopBar } from '../ui/brand'

type ProjectCard = {
  id: string
  icon: string
  title: string
  description: string
  tags: string[]
  href: string
  external?: boolean
  badge?: string
  // Drobná dlaždice místo plné karty — pro nástroje, co se otevřou jednou za
  // čas a nezaslouží si stejné místo jako appka, kterou používám denně.
  small?: boolean
  // Modul, který kartu odemyká (viz functions/_users.js). Bez modulu = jen admin.
  module?: ModuleKey
}

const ALL_CARDS: ProjectCard[] = [
  {
    id: 'geckos',
    module: 'geckos',
    icon: '🦎',
    title: 'Pagekoni řasnatí',
    description:
      'Krmení (cvrčci, banán, antib, mast), mlžení terária, svlékání a historie péče o tři gekony.',
    tags: ['d1', 'react'],
    href: '/private/geckos',
  },
  {
    id: 'zalivka',
    module: 'zalivka',
    icon: '🪴',
    title: 'Zálivka',
    description:
      'Kdy a kolik zalévat — interval z druhu, květináče, světla a období, objem vody v ml a historie zálivek.',
    tags: ['d1', 'react'],
    href: '/private/zalivka',
  },
  {
    id: 'spirala',
    module: 'spirala',
    icon: '🌀',
    title: 'Spirála',
    description:
      'Časová osa života jako spirála — co, kde a s kým, rok po roce a stejná roční období nad sebou.',
    tags: ['prototyp', 'canvas'],
    href: '/private/spirala',
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Platby',
    description: 'Přehled opakovaných plateb s upozorněním na blížící se termíny.',
    tags: ['admin'],
    href: '/private/payments',
    badge: 'admin',
  },
  {
    id: 'polymarket',
    module: 'polymarket',
    icon: '📊',
    title: 'Polymarket Bot',
    description:
      'Live BTC signály z Gemini AI — RSI, EMA crossover, volume analýza pro Polymarket sázky.',
    tags: ['python', 'gemini'],
    href: '/private/polymarket.html',
    external: true,
  },
  {
    id: 'users',
    icon: '👥',
    title: 'Uživatelé',
    description: 'Schvalování registrací, moduly a přístupy.',
    tags: [],
    href: '/private/users',
    small: true,
  },
]

export default function PrivatePage() {
  useDocumentTitle('Privátní · mmaly.cz')
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private', { replace: true })
      return
    }
    fetchMe().then((m) => {
      // Cookie hub_ui může přežít session (zablokovaný účet, změna hesla
      // jinde) — server je zdroj pravdy, takže úklid a zpět na login.
      if (!m) {
        logout().finally(() => navigate('/login?from=/private', { replace: true }))
        return
      }
      setMe(m)
    })
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!me) return null

  const admin = me.role === 'admin'
  const cards = ALL_CARDS.filter((c) => (c.module ? me.modules.includes(c.module) : admin))

  const open = (card: ProjectCard) => {
    if (card.external) window.location.href = card.href
    else navigate(card.href)
  }

  const main = cards.filter((c) => !c.small)
  const tools = cards.filter((c) => c.small)

  return (
    <div className="hub-page">
      <TopBar
        section="privátní"
        actions={
          <>
            {admin && (
              <a
                href="https://github.com/MikiMaly"
                target="_blank"
                rel="noopener noreferrer"
                className="hub-btn hub-btn-ghost"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
            <Link to="/private/account" className="hub-btn hub-btn-ghost" title="Můj účet">
              <UserRound className="w-4 h-4" />
              <span className="hidden sm:inline font-mono">{me.username}</span>
            </Link>
            <button onClick={handleLogout} className="hub-btn hub-btn-danger">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Odhlásit</span>
            </button>
          </>
        }
      />

      <main className="hub-container">
        {/* Hlavička držená nízko, ať je mřížka vidět hned po načtení i na notebooku. */}
        <PageHeader
          eyebrow={admin ? 'Privátní sekce · admin' : 'Privátní sekce'}
          title={
            <>
              Ahoj{admin ? '' : `, ${me.username}`}<span className="text-raspberry">.</span> Co dnes?
            </>
          }
          subtitle={admin ? 'Interní nástroje dostupné jen přihlášeným.' : 'Tvoje moduly. Data v nich vidíš jen ty.'}
        />

        {cards.length === 0 && (
          <div className="hub-card p-8 text-center text-muted-foreground">
            Zatím nemáš povolený žádný modul.
          </div>
        )}

        {/* Mřížka místo seznamu pod sebou — na šířku monitoru se tak vejde všechno
            najednou a nemusím kvůli pěti položkám scrollovat celou stránku. */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {main.map((card, index) => (
            <motion.button
              key={card.id}
              onClick={() => open(card)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.06, 0.3) }}
              className="hub-card hub-card-hover group text-left p-6 sm:p-7 flex flex-col min-h-[12rem]"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className={'hub-icon-tile w-14 h-14 text-3xl ' + (card.badge ? 'hub-icon-tile-raspberry' : '')}>
                  {card.icon}
                </div>
                {card.external ? (
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-aqua transition-colors" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-aqua group-hover:translate-x-1 transition-all" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h2 className="hub-title text-2xl group-hover:text-mint transition-colors">{card.title}</h2>
                {card.badge && (
                  <span className="hub-pill hub-pill-danger font-mono uppercase tracking-[0.12em]">
                    {card.badge}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-5">{card.description}</p>

              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {card.tags.map((tag) => (
                    <span key={tag} className="hub-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Drobné nástroje (pozvánky) zvlášť jako řádek dlaždic pod mřížkou. */}
        {tools.length > 0 && (
          <div className="mt-10">
            <div className="hub-eyebrow hub-eyebrow-raspberry mb-4">Správa</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tools.map((card) => (
                <button
                  key={card.id}
                  onClick={() => open(card)}
                  className="hub-card hub-card-hover group text-left p-4 flex items-center gap-3"
                >
                  <div className="hub-icon-tile hub-icon-tile-raspberry w-10 h-10">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold group-hover:text-mint transition-colors flex items-center gap-2">
                      {card.title}
                      {card.id === 'users' && (me.pending_count ?? 0) > 0 && (
                        <span className="hub-pill hub-pill-danger tabular-nums">{me.pending_count} čeká</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{card.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-aqua shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter note={admin ? "privátní" : me.username} />
    </div>
  )
}
