import { useEffect, useState } from 'react'

// Refleja si el propio equipo tiene interfaz de red activa (cable/Wi-Fi) — `navigator.onLine` no
// garantiza que haya internet real, pero sí refleja de forma confiable cuando el sistema
// operativo desconecta la interfaz por completo. Se usa solo para elegir el texto correcto en
// `ServidorMantenimiento` (sin internet vs servidor caído con red presente); el bloqueo en sí lo
// sigue decidiendo exclusivamente el heartbeat contra el backend (ver useSaludServidor/servidorStore) —
// un navegador no puede distinguir "sin red" de "servidor no responde" a nivel de fetch/XHR,
// ambos dan el mismo error sin `response`.
export function useNavigatorOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const marcarOnline = () => setOnline(true)
    const marcarOffline = () => setOnline(false)
    window.addEventListener('online', marcarOnline)
    window.addEventListener('offline', marcarOffline)
    return () => {
      window.removeEventListener('online', marcarOnline)
      window.removeEventListener('offline', marcarOffline)
    }
  }, [])

  return online
}
