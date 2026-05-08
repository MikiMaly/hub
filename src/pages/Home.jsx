import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

const PUBLIC_APPS = [
  {
    title: 'Ultimate Video Downloader',
    desc: 'Stahuj videa z YouTube a stovek dalších zdrojů přes webové UI. Fronta, audio mód, paralelní stahování.',
    url: 'https://github.com/MikiMaly/py_video_grabber',
    icon: '/assets/uvd-icon.png',
    tag: 'python / yt-dlp',
    featured: true,
    downloads: [
      { label: 'Windows EXE', url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-win64.zip' },
      { label: 'macOS',       url: 'https://github.com/MikiMaly/py_video_grabber/releases/latest/download/UltimateVideoDownloader-macos.dmg' },
    ],
  },
]

function AppCard({ app }) {
  const icon = app.icon?.startsWith('/')
    ? <img src={app.icon} className="card-icon-img" alt="" />
    : <div className="card-icon">{app.icon || '🔗'}</div>

  const footer = app.downloads
    ? (
      <div className="card-footer">
        <span className="card-tag">{app.tag}</span>
        <div className="card-downloads">
          {app.downloads.map(d => (
            <a key={d.label} href={d.url} className="dl-btn" target="_blank" rel="noopener">⬇ {d.label}</a>
          ))}
        </div>
      </div>
    )
    : (
      <div className="card-footer">
        <span className="card-tag">{app.tag}</span>
        <svg className="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    )

  const inner = (
    <>
      {app.featured && <div className="card-badge-featured">Featured</div>}
      <div className="card-icon-wrap">{icon}</div>
      <h3 className="card-title">
        {app.downloads
          ? <a href={app.url} target="_blank" rel="noopener">{app.title}</a>
          : app.title}
      </h3>
      <p className="card-desc">{app.desc}</p>
      {footer}
    </>
  )

  if (app.downloads) {
    return <div className={`card${app.featured ? ' card--featured' : ''}`}>{inner}</div>
  }
  return (
    <a className={`card card--link${app.featured ? ' card--featured' : ''}`} href={app.url} target="_blank" rel="noopener">
      {inner}
    </a>
  )
}

export default function Home() {
  const isLoggedIn = getCookie('hub_ui') === '1'

  return (
    <>
      <Header showGithub />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-layout">
              <div className="hero-content">
                <div className="hero-eyebrow-pill">— MIKOLÁŠ MALÝ</div>
                <h1 className="hero-title">
                  Projekty<br />
                  <span className="hero-title-accent">&amp; Appky</span>
                </h1>
                <p className="hero-bio">
                  Tady bude krátké představení — co tě baví, na čem pracuješ a proč tato místa existují.
                </p>
                <div className="hero-links">
                  <a href="https://github.com/MikiMaly" target="_blank" rel="noopener" className="hero-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
              <div className="hero-avatar" aria-hidden="true">
                <div className="avatar-wrap">
                  <div className="avatar-spin-ring"></div>
                  <div className="avatar-inner">
                    <div className="avatar-icon-bg">
                      <svg className="avatar-code-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="apps">
          <div className="container">
            <div className="section-header-block">
              <h2 className="section-title">Veřejné appky</h2>
              <p className="section-subtitle">Open-source projekty a nástroje dostupné pro všechny</p>
            </div>
            <div className="grid grid--3col">
              {PUBLIC_APPS.length === 0
                ? <div className="card card--empty"><div className="card-icon">+</div><h3 className="card-title">Brzy</h3><p className="card-desc">Appky budou přibývat…</p></div>
                : PUBLIC_APPS.map(app => <AppCard key={app.title} app={app} />)
              }
            </div>
          </div>
        </section>

        <section className="section section--private">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Privátní</h2>
              <span className="badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Chráněno
              </span>
            </div>
            <div className="grid">
              <div className="card card--blurred">
                <div className="card-blur-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div className="card-icon-wrap"><div className="card-icon">🔐</div></div>
                <h3 className="card-title">Privátní appka</h3>
                <p className="card-desc">Přihlaste se pro přístup k privátním projektům.</p>
                <div className="card-footer"><span className="card-tag">—</span></div>
              </div>
              <div className="card card--blurred">
                <div className="card-blur-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div className="card-icon-wrap"><div className="card-icon">🚀</div></div>
                <h3 className="card-title">Privátní appka</h3>
                <p className="card-desc">Přihlaste se pro přístup k privátním projektům.</p>
                <div className="card-footer"><span className="card-tag">—</span></div>
              </div>
            </div>
            <div className="private-cta">
              <Link to={isLoggedIn ? '/private' : '/login'} className="btn btn--outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {isLoggedIn ? 'Přejít do privátní sekce' : 'Přihlásit se'}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
