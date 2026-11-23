// Versiones del diseño (ficha 02): cada guardado vive en una versión; una versión congelada no se edita.
export interface Version<D> {
  numero: number
  fecha: string
  autor: string
  congelada: boolean
  comentario: string
  datos: D
}
export interface Diseno<D> {
  id: string
  nombre: string
  versiones: Version<D>[]
  /** número de la versión publicada a los otros módulos */
  publicada: number | null
}

export const MSG_CONGELADA = 'Una versión congelada no se edita: crear nueva versión'
export const ultima = <D>(d: Diseno<D>) => d.versiones[d.versiones.length - 1]
export const estadoDiseno = <D>(d: Diseno<D>) => (ultima(d).congelada ? 'congelado' : 'borrador')

export const crear = <D>(id: string, nombre: string, datos: D, fecha: string, autor: string): Diseno<D> => ({
  id,
  nombre,
  publicada: null,
  versiones: [{ numero: 1, fecha, autor, congelada: false, comentario: 'Versión inicial', datos }],
})

/** Sobrescribe la última versión si sigue en borrador; si no, devuelve el mensaje de la ficha. */
export function guardar<D>(d: Diseno<D>, datos: D, fecha: string): Diseno<D> | string {
  const u = ultima(d)
  if (u.congelada) return MSG_CONGELADA
  return { ...d, versiones: [...d.versiones.slice(0, -1), { ...u, datos, fecha }] }
}

export const nuevaVersion = <D>(d: Diseno<D>, datos: D, comentario: string, fecha: string, autor: string): Diseno<D> => ({
  ...d,
  versiones: [...d.versiones, { numero: ultima(d).numero + 1, fecha, autor, congelada: false, comentario, datos }],
})

export function congelar<D>(d: Diseno<D>, autor: string, fecha: string): Diseno<D> {
  const u = ultima(d)
  return { ...d, versiones: [...d.versiones.slice(0, -1), { ...u, congelada: true, autor, fecha }] }
}

/** Solo una versión congelada se publica a Scheduler y Reserves (ficha 02, pasos 10 y 11). */
export function publicar<D>(d: Diseno<D>, numero: number): Diseno<D> | string {
  const v = d.versiones.find((x) => x.numero === numero)
  if (!v) return `No existe la versión ${numero}`
  if (!v.congelada) return 'Solo se publica una versión congelada'
  return { ...d, publicada: numero }
}
