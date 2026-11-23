import { leyCorte, mineralRecuperado, pilar } from './modulos'

// ── Reserves UG (03): reserva por tajeo sobre su evaluación in situ ─────────
export interface Metodo {
  id: string
  nombre: string
  /** ancho mínimo de minado (m) */
  anchoMin: number
  /** sobre-rotura por pared: dilución no planificada (m) */
  sobre: number
  /** recuperación minera (%) */
  recuperacion: number
  /** mineral dejado en pilares (%) */
  factorPilar: number
  /** costo de mina (US$/t) */
  costoMina: number
}
export interface Economia {
  /** US$/g */
  precio: number
  /** recuperación de planta (%) */
  recPlanta: number
  costoPlanta: number
  costoAdm: number
}

/** Ley de corte del método (g/t) = costo mina + planta + administración / (precio × recuperación de planta). */
export const leyCorteMetodo = (m: Metodo, e: Economia) => leyCorte(m.costoMina + e.costoPlanta + e.costoAdm, e.precio, e.recPlanta / 100)
/** Ley de corte de desarrollo: el avance ya paga la mina, el material solo paga planta y administración. */
export const leyCorteDesarrollo = (e: Economia) => leyCorte(e.costoPlanta + e.costoAdm, e.precio, e.recPlanta / 100)

export function validarMetodo(m: Metodo) {
  const out: string[] = []
  if (!(m.anchoMin > 0)) out.push('Defina el ancho mínimo')
  for (const [k, n] of [['recuperacion', 'La recuperación'], ['factorPilar', 'El factor de pilar']] as const)
    if (!(m[k] >= 0 && m[k] <= 100)) out.push(`${n} va de 0 a 100 %`)
  if (!(m.sobre >= 0)) out.push('La sobre-rotura no puede ser negativa')
  return out
}

export type Estado = 'Reserva' | 'Bajo ley de corte' | 'Sin acceso'

/** Del mineral diluido a la reserva: se resta el pilar, se aplica la recuperación y se compara con la ley de corte. */
export function reservaTajeo(tDiluido: number, leyDiluida: number, m: Metodo, corte: number, acceso: boolean) {
  const { dejado, evaluable } = pilar(tDiluido, m.factorPilar)
  const recuperado = mineralRecuperado(evaluable, m.recuperacion)
  const estado: Estado = !acceso ? 'Sin acceso' : leyDiluida >= corte ? 'Reserva' : 'Bajo ley de corte'
  return { pilar: dejado, recuperado, metal: recuperado * leyDiluida, estado }
}

export type Categoria = 'Probada' | 'Probable'
/** Un tajeo hereda la categoría más baja de los bloques que toca (regla de la ficha). */
export const categoriaTajeo = (cats: Categoria[]): Categoria => (cats.includes('Probable') || !cats.length ? 'Probable' : 'Probada')

export const ONZA = 31.1035

/** Fila de un tajeo tal como queda guardada en una versión de reservas. */
export interface FilaVersion {
  id: string
  nombre: string
  metodo: string
  categoria: Categoria
  estado: Estado
  /** mineral recuperado (t) y metal (g) */
  t: number
  metal: number
}

/** Cambio de reserva por tajeo entre dos versiones, con su causa (ficha 03: comparación de versiones). */
export function compararReservas(antes: FilaVersion[], ahora: FilaVersion[]) {
  const ids = [...new Set([...antes, ...ahora].map((f) => f.id))]
  const enReserva = (f?: FilaVersion) => (f?.estado === 'Reserva' ? f : { t: 0, metal: 0 })
  return ids.flatMap((id) => {
    const a = antes.find((f) => f.id === id)
    const b = ahora.find((f) => f.id === id)
    const dt = enReserva(b).t - enReserva(a).t
    const dMetal = enReserva(b).metal - enReserva(a).metal
    if (Math.abs(dt) < 0.5 && Math.abs(dMetal) < 0.5) return []
    const causas = !a ? ['Tajeo nuevo'] : !b ? ['Tajeo retirado'] : []
    if (a && b) {
      if (a.estado !== b.estado) causas.push(`${a.estado} → ${b.estado}`)
      if (a.metodo !== b.metodo) causas.push(`método: ${a.metodo} → ${b.metodo}`)
      if (a.categoria !== b.categoria) causas.push(`categoría: ${a.categoria} → ${b.categoria}`)
      if (!causas.length) causas.push('parámetros del método o económicos')
    }
    return [{ id, nombre: (b ?? a)!.nombre, dt, dMetal, causa: causas.join(' · ') }]
  })
}
