import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  Cloud,
  Code2,
  Download,
  Github,
  Lock,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { SiteFooter, TopBar } from '../ui/brand'

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
  },
]

// Co je za zámkem — jen názvy, ať návštěvník tuší, co privátní sekce umí.
const privateTeasers = [
  { icon: '🦎', title: 'Gekoni' },
  { icon: '🪴', title: 'Zálivka' },
  { icon: '🌀', title: 'Spirála' },
]

const roles = ['IT Professional', 'Linux admin', 'Cloud Engineer', 'SW dev']

const stack = [
  { Icon: Server, label: 'Linux' },
  { Icon: Terminal, label: 'CLI' },
  { Icon: Cloud, label: 'Cloud' },
  { Icon: Code2, label: 'Code' },
]

function ProjectIcon({ project }: { project: Project }) {
  if (project.iconType === 'image') {
    return <img src={project.icon} alt="" className="w-8 h-8 object-contain" />
  }
  return <span className="text-2xl">{project.icon}</span>
}

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
}

export default function HomePage() {
  useDocumentTitle('mmaly.cz · projekty a appky')

  const publicProjects = projects.filter((p) => p.status === 'public')

  return (
    <div className="hub-page">
      <TopBar
        actions={
          <>
            <a
              href="https://github.com/MikiMaly"
              target="_blank"
              rel="noopener noreferrer"
              className="hub-btn hub-btn-ghost"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link to="/login" className="hub-btn hub-btn-soft" aria-label="Přihlášení">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Přihlásit</span>
            </Link>
          </>
        }
      />

      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="hub-container pt-20 sm:pt-28 pb-20">
        <div className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hub-eyebrow mb-6"
          >
            Osobní hub · Praha
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="hub-display text-[2.75rem] sm:text-7xl lg:text-8xl"
          >
            Mikoláš <span className="hub-text-aurora">Malý</span>
            <span className="text-raspberry">.</span>
          </motion.h1>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {roles.map((r) => (
              <li key={r} className="hub-chip text-[0.75rem] px-3 py-1 text-mint">
                {r}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a
              href="https://github.com/MikiMaly"
              target="_blank"
              rel="noopener noreferrer"
              className="hub-btn hub-btn-primary hub-btn-lg group"
            >
              <Github className="w-5 h-5" />
              Prozkoumat GitHub
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link to="/login" className="hub-btn hub-btn-ghost hub-btn-lg">
              <Lock className="w-5 h-5" />
              Privátní projekty
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex items-center gap-6 text-muted-foreground"
          >
            <span className="hub-label">stack</span>
            <span className="h-px w-10 bg-border-strong" />
            {stack.map(({ Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-sm hover:text-mint transition-colors">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---- Veřejné projekty -------------------------------------------- */}
      <section className="hub-container py-16">
        <motion.div {...rise} className="mb-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="hub-eyebrow mb-3">01 · Veřejné projekty</div>
            <h2 className="hub-title text-4xl sm:text-5xl">Otevřené appky</h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Open-source projekty a nástroje dostupné pro všechny.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {publicProjects.map((project, index) => (
            <motion.article
              key={project.id}
              {...rise}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="hub-card hub-card-hover p-6 sm:p-8 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="hub-icon-tile w-14 h-14">
                  <ProjectIcon project={project} />
                </div>
                {project.featured && (
                  <span className="hub-pill hub-pill-danger font-mono uppercase tracking-[0.12em]">
                    <Sparkles className="w-3 h-3" /> featured
                  </span>
                )}
              </div>

              <h3 className="hub-title text-2xl mb-2">
                {project.href ? (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-mint transition-colors"
                  >
                    {project.title}
                    <ArrowUpRight className="w-5 h-5 text-aqua" />
                  </a>
                ) : (
                  project.title
                )}
              </h3>

              <p className="text-muted-foreground leading-relaxed mb-6">{project.description}</p>

              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tags.map((tag) => (
                  <span key={tag} className="hub-chip">
                    {tag}
                  </span>
                ))}
              </div>

              {project.downloads && project.downloads.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-5 mt-5 hub-divider">
                  {project.downloads.map((dl) => (
                    <a
                      key={dl.url}
                      href={dl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hub-btn hub-btn-sm hub-btn-aqua"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {dl.label}
                    </a>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </section>

      {/* ---- Privátní sekce --------------------------------------------- */}
      <section className="hub-container py-16">
        <motion.div {...rise} className="hub-card overflow-hidden">
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            <div className="p-8 sm:p-12">
              <div className="hub-eyebrow hub-eyebrow-raspberry mb-3">02 · Vyžaduje přihlášení</div>
              <h2 className="hub-title text-4xl sm:text-5xl mb-4">Privátní sekce</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Interní nástroje a experimenty, ke kterým se dostaneš s heslem nebo pozvánkou.
              </p>
              <Link to="/login" className="hub-btn hub-btn-primary hub-btn-lg group">
                <Lock className="w-5 h-5" />
                Odemknout
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* zamčené dlaždice: skleněné tabule s rozmazaným obsahem */}
            <div className="relative p-8 sm:p-12 border-t lg:border-t-0 lg:border-l border-border bg-secondary/40">
              <div className="grid gap-3">
                {privateTeasers.map((t, i) => (
                  <motion.div
                    key={t.title}
                    {...rise}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card/70 px-4 py-3"
                  >
                    <div className="hub-icon-tile w-10 h-10 text-xl">{t.icon}</div>
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-auto h-2 w-24 rounded-full bg-muted blur-[1px]" aria-hidden />
                    <Lock className="w-4 h-4 text-raspberry/80 shrink-0" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  )
}
