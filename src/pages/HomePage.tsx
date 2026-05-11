import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight,
  Cloud,
  Code2,
  Download,
  Github,
  Lock,
  Server,
  Terminal,
  Zap,
} from 'lucide-react'

type DownloadLink = { label: string; url: string }

type Project = {
  id: number
  icon: string
  iconType?: 'image' | 'emoji'
  title: string
  description: string
  tags: string[]
  downloads?: DownloadLink[]
  status: 'public' | 'private'
  featured?: boolean
  gradient: string
  href?: string
}

const projects: Project[] = [
  {
    id: 1,
    icon: '/uvd-icon.png',
    iconType: 'image',
    title: 'Ultimate Video Downloader',
    description:
      'Stahuj videa z YouTube a stovek dalších zdrojů přes webové UI. Fronta, audio mód, paralelní stahování.',
    tags: ['python', 'yt-dlp'],
    downloads: [
      {
        label: 'Windows EXE',
        url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-win64.zip',
      },
      {
        label: 'macOS',
        url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-macos.dmg',
      },
    ],
    status: 'public',
    featured: true,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    href: 'https://github.com/MikiMaly/py_video_grabber',
  },
  {
    id: 2,
    icon: '✨',
    iconType: 'emoji',
    title: 'Brzy',
    description: 'Další open-source projekty a nástroje budou přibývat. Sleduj GitHub pro novinky.',
    tags: ['coming soon'],
    status: 'public',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 3,
    icon: '📊',
    iconType: 'emoji',
    title: 'Polymarket Bot',
    description: 'Live BTC signály z Gemini AI — RSI, EMA crossover, volume analýza pro Polymarket sázky.',
    tags: ['python', 'gemini'],
    status: 'private',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
]

const techIcons = [
  { Icon: Server, label: 'Linux', delay: 0 },
  { Icon: Terminal, label: 'CLI', delay: 0.1 },
  { Icon: Cloud, label: 'Cloud', delay: 0.2 },
  { Icon: Code2, label: 'Code', delay: 0.3 },
]

function ProjectIcon({ project }: { project: Project }) {
  if (project.iconType === 'image') {
    return <img src={project.icon} alt="" className="w-10 h-10 object-contain" />
  }
  return <span className="text-3xl">{project.icon}</span>
}

export default function HomePage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const publicProjects = projects.filter((p) => p.status === 'public')
  const privateProjects = projects.filter((p) => p.status === 'private')

  return (
    <div className="min-h-screen bg-background text-foreground" ref={containerRef}>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/30 group-hover:bg-primary/50 transition-all" />
              <span className="text-xl relative z-10 text-foreground">mmaly</span>
            </div>
            <span className="text-xl text-primary font-semibold">.cz</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/MikiMaly"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-muted transition-colors backdrop-blur-sm"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </motion.a>
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
              aria-label="Přihlášení"
            >
              <Lock className="w-4 h-4 text-primary" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px]"
        />

        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)',
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
          style={{ y, opacity }}
          className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10"
        >
          <div className="text-center max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <span
                className="block text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent"
                style={{ fontWeight: 700, lineHeight: 1.1 }}
              >
                Mikoláš Malý
              </span>
              <span
                className="block text-3xl lg:text-4xl text-muted-foreground"
                style={{ fontWeight: 400, lineHeight: 1.5 }}
              >
                <span className="text-primary font-semibold">IT Professional</span> ·{' '}
                <span className="text-primary font-semibold">Linux admin</span> ·{' '}
                <span className="text-primary font-semibold">SW dev</span> ·{' '}
                <span className="text-primary font-semibold">Cloud Engineer</span>
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-16 mt-12"
            >
              <motion.a
                href="https://github.com/MikiMaly"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">Prozkoumat GitHub</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-secondary/50 hover:bg-muted transition-all backdrop-blur-sm border border-border"
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">Privátní projekty</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex items-center justify-center gap-8"
            >
              {techIcons.map(({ Icon, label, delay }, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + delay }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-primary"
            />
          </motion.div>
        </motion.div>
      </section>

      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Veřejné projekty</span>
            </div>
            <h2 className="text-5xl lg:text-6xl mb-6" style={{ fontWeight: 700 }}>
              Otevřené appky
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Open-source projekty a nástroje dostupné pro všechny
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {publicProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${project.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                {project.featured && (
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="absolute -top-3 right-4 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold z-20 shadow-lg pointer-events-none"
                  >
                    ⭐ Featured
                  </motion.div>
                )}

                <div className="relative p-8 rounded-2xl bg-card border border-border group-hover:border-primary/50 transition-all overflow-hidden h-full">
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                      mixBlendMode: 'overlay',
                    }}
                  />

                  <div className="relative z-10">
                    <div className="mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
                        <ProjectIcon project={project} />
                      </div>
                    </div>

                    <h3
                      className="text-2xl mb-3 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {project.href ? (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 inline-flex items-center gap-2"
                        >
                          {project.title}
                          <Github className="w-4 h-4 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-foreground">{project.title}</span>
                      )}
                    </h3>

                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs rounded-full bg-secondary text-foreground border border-border font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {project.downloads && project.downloads.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                        {project.downloads.map((dl, i) => (
                          <a
                            key={i}
                            href={dl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {dl.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Vyžaduje přihlášení</span>
            </div>
            <h2 className="text-5xl lg:text-6xl mb-6" style={{ fontWeight: 700 }}>
              Privátní sekce
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interní nástroje a experimentální aplikace
            </p>
          </motion.div>

          <div className="flex justify-center mb-12">
            <div className="grid md:grid-cols-1 gap-8 max-w-md w-full">
              {privateProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="relative p-8 rounded-2xl bg-card border border-border overflow-hidden backdrop-blur-sm">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                        mixBlendMode: 'overlay',
                      }}
                    />

                    <div className="absolute inset-0 backdrop-blur-[3px] bg-background/20 flex items-center justify-center z-10">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-4 rounded-full bg-primary/10 border border-primary/20"
                      >
                        <Lock className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>

                    <div className="blur-[2px] select-none">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6">
                        <ProjectIcon project={project} />
                      </div>
                      <h3 className="text-xl mb-3" style={{ fontWeight: 600 }}>
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded-full bg-secondary text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary/10 border-2 border-primary/20 text-primary hover:bg-primary/20 transition-all backdrop-blur-sm"
            >
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Odemknout privátní projekty</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-border relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl text-foreground font-semibold">mmaly</span>
              <span className="text-3xl text-primary font-bold">.cz</span>
            </div>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Code2 className="w-4 h-4" />© 2026 Mikoláš Malý
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
