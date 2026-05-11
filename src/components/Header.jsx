import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Lock, LogOut, ArrowLeft } from 'lucide-react'

const Github = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

export default function Header({ backTo, backLabel, showGithub = false, showLogout = false }) {
  const navigate = useNavigate()
  const isLoggedIn = getCookie('hub_ui') === '1'

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    navigate('/')
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link to="/" className="flex items-center gap-1 no-underline">
            <span className="font-mono text-xl font-medium text-foreground">mmaly</span>
            <span className="font-mono text-xl font-semibold text-primary">.cz</span>
          </Link>
        </motion.div>

        <nav className="flex items-center gap-3">
          {backTo && (
            <Link
              to={backTo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel || 'Zpět'}
            </Link>
          )}
          {showGithub && (
            <motion.a
              href="https://github.com/MikiMaly"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm no-underline text-foreground border border-border"
            >
              <Github />
              GitHub
            </motion.a>
          )}
          {showLogout ? (
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
              title="Odhlásit se"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={isLoggedIn ? '/private' : '/login'}
                className="flex p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/30 no-underline"
              >
                <Lock className="w-5 h-5 text-primary" />
              </Link>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  )
}
