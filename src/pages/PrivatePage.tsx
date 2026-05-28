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
      title: 'Správa pozvánek',
      description: 'Vytvárej a spravuj invite kódy pro přístup k privátní sekci.',
      tags: ['admin'],
      href: '/private/invites',
      badge: 'admin',
    }] : []),
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-primary" />
              <h1 style={{ fontSize: '3rem', fontWeight: 600 }}>Privátní projekty</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Interní nástroje a experimentální aplikace dostupné pouze přihlášeným uživatelům.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative p-8 rounded-2xl bg-card border border-border group-hover:border-primary/50 transition-all overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }}
                />

                <div className="relative z-10 flex items-start gap-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl shrink-0">
                    {card.id === 'invites' ? (
                      <Key className="w-7 h-7 text-primary" />
                    ) : (
                      <span>{card.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3
                        className="text-2xl text-primary"
                        style={{ fontWeight: 600 }}
                      >
                        {card.external ? (
                          <a
                            href={card.href}
                            className="hover:text-primary/80 inline-flex items-center gap-2"
                          >
                            {card.title}
                            <ExternalLink className="w-4 h-4 opacity-60" />
                          </a>
                        ) : (
                          <button
                            onClick={() => navigate(card.href)}
                            className="hover:text-primary/80 inline-flex items-center gap-2"
                          >
                            {card.title}
                            <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </h3>
                      {card.badge && (
                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs rounded-full bg-secondary text-foreground border border-border font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl text-foreground">mmaly</span>
            <span className="text-2xl text-primary">.cz</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 Mikoláš Malý — Private</p>
        </div>
      </footer>
    </div>
  )
}
