import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import './index.css'
import App from './App.tsx'

// mensajes de error nativos de zod (invalid_type, too_small, etc.) en español para toda la
// app — antes se filtraban en inglés ("Invalid input: expected number...") en cualquier schema
// que no personalizara el mensaje a mano; esto lo resuelve una sola vez, global, en vez de
// perseguir campo por campo cada vez que aparece uno sin traducir
z.config(z.locales.es())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
