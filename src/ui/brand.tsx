import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

// Stavební kameny identity 2.0 ("Skleník"). Barvy a tvary drží theme.css
// (třídy .hub-*), tady je jen struktura, aby každá stránka měla stejnou
// lištu, hlavičku a patičku. Gekos submodul používá stejné CSS třídy přímo.

// Logo: písmeno "m" ze dvou oblouků jako klíčící výhonek v přechodu
// zelená -> akvamarín -> mint, malinová tečka je tečka z "mmaly.cz".
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="hub-aurora" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--hub-green)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--hub-aqua)' }} />
          <stop offset="1" style={{ stopColor: 'var(--hub-mint)' }} />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" style={{ fill: 'var(--hub-ink-2)' }} stroke="url(#hub-aurora)" strokeOpacity="0.55" strokeWidth="1.5" />
      <path
        d="M7.5 22.5V13.5a3.75 3.75 0 0 1 7.5 0v9M15 13.5a3.75 3.75 0 0 1 7.5 0v9"
        stroke="url(#hub-aurora)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.25" cy="22.25" r="1.9" style={{ fill: 'var(--hub-raspberry)' }} />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={'font-display font-semibold tracking-tight ' + className}>
      mmaly<span className="text-raspberry">.</span>
      <span className="text-primary">cz</span>
    </span>
  )
}

export function BrandLink({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group shrink-0" aria-label="mmaly.cz domů">
      <LogoMark size={30} className="transition-transform duration-300 group-hover:-rotate-6" />
      <Wordmark className="text-lg" />
    </Link>
  )
}

// Horní lišta pro všechny stránky. `section` je štítek vedle loga
// (např. "privátní", "admin"), `actions` pravá strana.
export function TopBar({
  section,
  sectionTone = 'green',
  actions,
  wide = true,
}: {
  section?: ReactNode
  sectionTone?: 'green' | 'raspberry'
  actions?: ReactNode
  wide?: boolean
}) {
  return (
    <header className="hub-topbar">
      <div className={(wide ? 'hub-container' : 'max-w-6xl mx-auto px-4 sm:px-6') + ' h-16 flex items-center justify-between gap-3'}>
        <div className="flex items-center gap-3 min-w-0">
          <BrandLink />
          {section && (
            <span
              className={
                'hidden sm:inline-flex hub-pill font-mono uppercase tracking-[0.12em] ' +
                (sectionTone === 'raspberry' ? 'hub-pill-danger' : 'hub-pill-ok')
              }
            >
              {section}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  )
}

// Hlavička podstránky: odkaz zpět, ikonová dlaždice, titulek, podtitulek
// a volitelný obsah vpravo (meta, filtry, tlačítka).
export function PageHeader({
  back,
  backLabel = 'Zpět',
  icon,
  iconTone,
  eyebrow,
  title,
  subtitle,
  aside,
}: {
  back?: string
  backLabel?: string
  icon?: ReactNode
  iconTone?: 'aqua' | 'raspberry'
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="pt-6 pb-6">
      {back && (
        <Link to={back} className="hub-back mb-5">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className={'hub-icon-tile text-2xl ' + (iconTone ? `hub-icon-tile-${iconTone}` : '')}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <div className="hub-eyebrow mb-1.5">{eyebrow}</div>}
            <h1 className="hub-title text-3xl sm:text-4xl">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        {aside && <div className="flex items-center gap-2 flex-wrap">{aside}</div>}
      </div>
    </div>
  )
}

export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="hub-container py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} />
          <Wordmark />
        </div>
        <p className="hub-label">
          © 2026 Mikoláš Malý{note ? ` · ${note}` : ''}
        </p>
      </div>
    </footer>
  )
}
