import { useEffect, useState } from 'react'

// shortcut: enrutado por hash sin librería; pasar a un router cuando haya rutas con parámetros anidados.
export function useRuta() {
  const [r, setR] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    const f = () => {
      setR(location.hash.slice(1) || '/')
      document.querySelector('main')?.scrollTo(0, 0)
    }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return r
}
export const ir = (ruta: string) => (location.hash = ruta)
