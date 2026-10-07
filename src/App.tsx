import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router'
import { Palette, X } from 'lucide-react'
import { router } from './routes'
import { clearOverride, loadOverride } from './lib/palette'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PaletteBadge />
    </>
  )
}

// Připomínka, že tenhle prohlížeč ukazuje paletu laděnou na /brand, ne tu z webu.
function PaletteBadge() {
  const [active, setActive] = useState(() => loadOverride() !== null)
  useEffect(() => {
    const update = () => setActive(loadOverride() !== null)
    window.addEventListener('hub:palette', update)
    return () => window.removeEventListener('hub:palette', update)
  }, [])
  if (!active) return null
  return (
    <div className="hub-toast fixed bottom-4 left-4 z-50 !gap-3">
      <a href="/brand#ladeni" className="inline-flex items-center gap-2 hover:text-mint">
        <Palette className="w-4 h-4 text-aqua" />
        Laděná paleta (jen tady)
      </a>
      <button onClick={clearOverride} className="text-muted-foreground hover:text-raspberry" aria-label="Vrátit paletu z webu" title="Vrátit paletu z webu">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
