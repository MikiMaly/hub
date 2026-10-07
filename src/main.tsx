import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { applyPalette, loadOverride } from './lib/palette'

// Paleta laděná na /brand (jen v tomhle prohlížeči) — dřív než první vykreslení.
const override = loadOverride()
if (override) applyPalette(override)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
