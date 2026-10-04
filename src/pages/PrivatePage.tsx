import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, ExternalLink, Github, Key, Lock, LogOut } from 'lucide-react'
import { isAdmin, isAuthed, logout } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'

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
}

export default function PrivatePage() {
  useDocumentTitle('Privátní — mmaly.cz')
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login?from=/private', { replace: true })
      return
    }
    setAdmin(isAdmin())
    setReady(true)
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!ready) return null

  const cards: ProjectCard[] = [
    {
      id: 'geckos',
      icon: '🦎',
      title: 'Pagekoni řasnatí',
      description:
        'Krmení (cvrčci, banán, antib, mast), mlžení terária, svlékání a historie péče o tři gekony.',
      tags: ['d1', 'react'],
      href: '/private/geckos',
    },
    {
      id: 'zalivka',
      icon: '🪴',
      title: 'Zálivka',
      description:
        'Kdy a kolik zalévat — interval z druhu, květináče, světla a období, objem vody v ml a historie zálivek.',
      tags: ['d1', 'react'],
      href: '/private/zalivka',
    },
    {
      id: 'spirala',
      icon: '🌀',
      title: 'Spirála',
      description:
        'Časová osa života jako spirála — co, kde a s kým, rok po roce a stejná roční období nad sebou.',
      tags: ['prototyp', 'canvas'],
      href: '/private/spirala',
    },
    ...(admin ? [{
      id: 'payments',
      icon: '💳',
      title: 'Platby',
      description: 'Přehled opakovaných plateb s upozorněním na blížící se termíny.',
      tags: ['admin'],
      href: '/private/payments',
      badge: 'admin',
    }] : []),
    {
      id: 'polymarket',
      icon: '📊',
      title: 'Polymarket Bot',
      description:
        'Live BTC signály z Gemini AI — RSI, EMA crossover, volume analýza pro Polymarket sázky.',
      tags: ['python', 'gemini'],
      href: '/private/polymarket.html',
      external: true,
    },
    ...(admin ? [{
      id: 'invites',
      icon: '🔑',
      title: 'Pozvánky',
      description: 'Invite kódy do privátní sekce.',
      tags: [],
      href: '/private/invites',
      small: true,
    }] : []),
  ]

  const open = (card: ProjectCard) => {
    if (card.external) window.location.href = card.href
    else navigate(card.href)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="text-xl text-foreground">mmaly</span>
              <span className="text-xl text-primary">.cz</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Privátní sekce
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/MikiMaly"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Odhlásit</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hlavička držená nízko, ať je mřížka vidět hned po načtení i na notebooku. */}
      <section className="pt-28 pb-6 px-6 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"
        />
        <div className="max-w-[1600px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Lock className="w-7 h-7 text-primary" />
                <h1 style={{ fontSize: '2.25rem', fontWeight: 600 }}>Privátní projekty</h1>
              </div>
              <p className="text-muted-foreground">
                Interní nástroje dostupné jen přihlášeným.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-12 px-6">
        {/* Mřížka místo seznamu pod sebou — na šířku monitoru se tak vejde všechno
            najednou a nemusím kvůli pěti položkám scrollovat celou stránku. */}
        <div className="max-w-[1600px] mx-auto grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.06, 0.3) }}
              whileHover={{ y: -3 }}
              className="group relative h-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <button
                onClick={() => open(card)}
                className={
                  'relative w-full h-full text-left rounded-2xl bg-card border border-border ' +
                  'group-hover:border-primary/50 transition-all overflow-hidden ' +
                  (card.small ? 'p-4' : 'p-6')
                }
              >
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }}
                />

                <div className="relative z-10 flex items-start gap-4">
                  <div
                    className={
                      'rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 ' +
                      'flex items-center justify-center shrink-0 ' +
                      (card.small ? 'w-9 h-9 text-lg' : 'w-12 h-12 text-2xl')
                    }
                  >
                    {card.id === 'invites' ? (
                      <Key className={card.small ? 'w-4 h-4 text-primary' : 'w-6 h-6 text-primary'} />
                    ) : (
                      <span>{card.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3
                        className={
                          'text-primary inline-flex items-center gap-1.5 ' +
                          (card.small ? 'text-base' : 'text-xl')
                        }
                        style={{ fontWeight: 600 }}
                      >
                        {card.title}
                        {card.external ? (
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        ) : (
                          <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                        )}
                      </h3>
                      {card.badge && (
                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <p
                      className={
                        'text-muted-foreground leading-relaxed ' +
                        (card.small ? 'text-xs' : 'text-sm mb-3')
                      }
                    >
                      {card.description}
                    </p>

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 text-xs rounded-full bg-secondary text-foreground border border-border font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-[1600px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl text-foreground">mmaly</span>
            <span className="text-xl text-primary">.cz</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 Mikoláš Malý — Private</p>
        </div>
      </footer>
    </div>
  )
}
