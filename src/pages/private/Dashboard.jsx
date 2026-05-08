import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

export default function Dashboard() {
  const isAdmin = getCookie('hub_admin_ui') === '1'

  return (
    <>
      <Header backTo="/" backLabel="Domů" showGithub showLogout />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <p className="hero-eyebrow">Privátní sekce</p>
              <h1 className="hero-title">Moje appky</h1>
              <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                Interní nástroje a projekty za přihlášením.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="grid">
              {isAdmin && (
                <Link className="card card--link" to="/private/invites">
                  <div className="card-icon-wrap"><div className="card-icon">🔑</div></div>
                  <h3 className="card-title">Správa pozvánek</h3>
                  <p className="card-desc">Vytvárej a spravuj invite kódy pro přístup k privátní sekci.</p>
                  <div className="card-footer">
                    <span className="card-tag">admin</span>
                    <svg className="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              )}

              <Link className="card card--link" to="/private/polymarket">
                <div className="card-icon-wrap"><div className="card-icon">📊</div></div>
                <h3 className="card-title">Polymarket Bot</h3>
                <p className="card-desc">Live BTC signály z Gemini AI — RSI, EMA crossover, volume analýza pro Polymarket sázky.</p>
                <div className="card-footer">
                  <span className="card-tag">python / gemini</span>
                  <svg className="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>

              <a className="card card--link" href="https://uwd.mmaly.cz" target="_blank" rel="noopener">
                <div className="card-icon-wrap"><img src="/assets/uvd-icon.png" className="card-icon-img" alt="" /></div>
                <h3 className="card-title">Ultimate Video Downloader</h3>
                <p className="card-desc">Stahuj videa z YouTube a stovek dalších zdrojů přes webové UI. Fronta, audio mód, paralelní stahování.</p>
                <div className="card-footer">
                  <span className="card-tag">python / yt-dlp</span>
                  <svg className="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
