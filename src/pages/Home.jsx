import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { Lock, ArrowRight, Sparkles, Zap, Terminal, Database, Cloud, Cpu } from 'lucide-react'

const Github = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)
import Header from '../components/Header'
import Footer from '../components/Footer'

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

const PUBLIC_PROJECTS = [
  {
    id: 1,
    icon: 'UVD',
    title: 'Ultimate Video Downloader',
    description: 'Stahuj videa z YouTube a stovek dalších zdrojů přes webové UI. Fronta, audio mód, paralelní stahování.',
    tags: ['python', 'yt-dlp'],
    platforms: ['Windows EXE', 'macOS'],
    featured: true,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    url: 'https://github.com/MikiMaly/py_video_grabber',
    downloads: [
      { label: 'Windows EXE', url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-win64.zip' },
      { label: 'macOS', url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-macos.dmg' },
    ],
  },
]

const TECH_ICONS = [
  { Icon: Terminal, label: 'CLI Tools' },
  { Icon: Database, label: 'Databases' },
  { Icon: Cloud, label: 'Cloud' },
  { Icon: Cpu, label: 'AI/ML' },
]

export default function Home() {
  const navigate = useNavigate()
  const isLoggedIn = getCookie('hub_ui') === '1'
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div className="min-h-screen bg-background text-foreground" ref={containerRef}>
      <Header showGithub />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)',
          }} />
        </div>

        {/* Noise */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Software Engineer & Creator</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <span className="block text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent font-bold" style={{ lineHeight: 1.1 }}>
                Mikoláš Malý
              </span>
              <span className="block text-2xl lg:text-3xl text-muted-foreground font-normal" style={{ lineHeight: 1.5 }}>
                <span className="text-primary font-semibold">IT Professional</span> ·{' '}
                <span className="text-primary font-semibold">Linux admin</span> ·{' '}
                <span className="text-primary font-semibold">SW dev</span> ·{' '}
                <span className="text-primary font-semibold">Cloud Engineer</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Od produktivních nástrojů přes webové aplikace až po ML experimenty.
              Všechno s láskou k detailu a čistému kódu.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 mb-16"
            >
              <motion.a
                href="https://github.com/MikiMaly"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 no-underline font-semibold"
              >
                <Github />
                Prozkoumat GitHub
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.button
                onClick={() => navigate(isLoggedIn ? '/private' : '/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-secondary hover:bg-muted transition-all border-2 border-border hover:border-primary/40 font-semibold"
              >
                <Lock className="w-5 h-5 text-primary" />
                {isLoggedIn ? 'Privátní sekce' : 'Privátní projekty'}
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
              className="flex items-center justify-center gap-8"
            >
              {TECH_ICONS.map(({ Icon, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex flex-col items-center gap-2 group cursor-default"
                >
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 group-hover:border-primary/50 transition-all backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-primary"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Public Projects */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Veřejné projekty</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6">Otevřené appky</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Open-source projekty a nástroje dostupné pro všechny
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PUBLIC_PROJECTS.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className={`group relative${project.featured ? ' md:col-span-2 lg:col-span-2' : ''}`}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${project.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all overflow-hidden h-full flex flex-col">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }} />
                  {project.featured && (
                    <div className="absolute -top-3 -right-3 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold z-20 shadow-lg">
                      ⭐ Featured
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                        {project.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-primary group-hover:text-primary/80 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed flex-1">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 text-xs rounded-full bg-secondary text-foreground border border-border font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {project.downloads ? (
                      <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
                        {project.downloads.map(d => (
                          <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:border-primary/40 border border-border transition-colors no-underline"
                          >
                            ⬇ {d.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-4 border-t border-border">
                        {project.platforms.map(p => (
                          <span key={p} className="px-3 py-1 text-xs rounded-full bg-muted/50 text-muted-foreground">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Coming soon */}
            {[1, 2].map(i => (
              <motion.div
                key={`soon-${i}`}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: (PUBLIC_PROJECTS.length + i) * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="p-8 rounded-2xl border border-dashed border-border/50 bg-card/30 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[200px]">
                  <div className="text-4xl mb-4">+</div>
                  <p className="text-muted-foreground text-sm">Brzy…</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Private Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Vyžaduje přihlášení</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6">Privátní sekce</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Exkluzivní projekty, interní nástroje a experimentální aplikace
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: '📊', title: 'Polymarket Bot', tags: ['python', 'openrouter'] },
              { icon: '🔑', title: 'Invite Manager', tags: ['cloudflare', 'kv'] },
              { icon: '🚀', title: 'Další projekty', tags: ['soon'] },
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="relative p-8 rounded-2xl bg-card border border-border overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }} />
                  <div className="absolute inset-0 backdrop-blur-[3px] bg-background/20 flex items-center justify-center z-10">
                    <motion.div whileHover={{ scale: 1.1 }} className="p-4 rounded-full bg-primary/10 border border-primary/20">
                      <Lock className="w-8 h-8 text-primary" />
                    </motion.div>
                  </div>
                  <div className="blur-[2px] select-none">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl mb-6">
                      {project.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 text-xs rounded-full bg-secondary text-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              onClick={() => navigate(isLoggedIn ? '/private' : '/login')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary/10 border-2 border-primary/20 text-primary hover:bg-primary/20 transition-all backdrop-blur-sm font-semibold"
            >
              <Lock className="w-5 h-5" />
              {isLoggedIn ? 'Přejít do privátní sekce' : 'Odemknout privátní projekty'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
