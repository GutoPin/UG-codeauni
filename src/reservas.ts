import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LABORES, NIVELES, type V3 } from './data/minaPiloto'
import { BLOQUES, entrega, vetaY, type Datos } from './disenos'
import { evaluarTajeo, type Tajeo } from './domain/designer'
import { categoriaTajeo, leyCorteDesarrollo, leyCorteMetodo, reservaTajeo, type Categoria, type Economia, type Metodo } from './domain/reservas'
import type { Diseno } from './domain/versiones'

export const METODOS_INICIALES: Record<string, Metodo> = {
  cyr: { id: 'cyr', nombre: 'Corte y relleno', anchoMin: 3, sobre: 0.3, recuperacion: 95, factorPilar: 5, costoMina: 70 },
  tl: { id: 'tl', nombre: 'Taladros largos', anchoMin: 6, sobre: 0.6, recuperacion: 88, factorPilar: 10, costoMina: 45 },
}
export const ECO_INICIAL: Economia = { precio: 65, recPlanta: 90, costoPlanta: 25, costoAdm: 10 }
/** Potencia de la veta en el modelo de bloques (bloques de 5 m centrados en la veta). */
export const POTENCIA = 5
// shortcut: la mina piloto no trae categoría de recurso; se supone medido hasta x = 260 m (malla de sondajes cerrada), indicado más allá. Tomarla de Resource UG.
export const LIMITE_MEDIDO = 260
const DENSIDAD_ESTERIL = 2.7
const LEY_ESTERIL = 0.3

interface Parametros {
  metodos: Record<string, Metodo>
  eco: Economia
  /** método por tajeo */
  asignacion: Record<string, string>
}

const TAJEOS_MINA = LABORES.filter((l) => l.tipo === 'Tajeo')
const ASIGNACION_INICIAL = Object.fromEntries(TAJEOS_MINA.map((l) => [l.id, l.nivel === 3850 ? 'tl' : 'cyr']))

export const useReservas = create<Parametros & { setMetodo: (id: string, m: Partial<Metodo>) => void; setEco: (e: Partial<Economia>) => void; asignar: (tajeo: string, metodo: string) => void; restablecer: () => void }>()(
  persist(
    (set) => ({
      metodos: METODOS_INICIALES,
      eco: ECO_INICIAL,
      asignacion: ASIGNACION_INICIAL,
      setMetodo: (id, m) => set((s) => ({ metodos: { ...s.metodos, [id]: { ...s.metodos[id], ...m } } })),
      setEco: (e) => set((s) => ({ eco: { ...s.eco, ...e } })),
      asignar: (tajeo, metodo) => set((s) => ({ asignacion: { ...s.asignacion, [tajeo]: metodo } })),
      restablecer: () => set({ metodos: METODOS_INICIALES, eco: ECO_INICIAL, asignacion: ASIGNACION_INICIAL }),
    }),
    { name: 'codea-planning-ug/reservas', version: 1 },
  ),
)

const largo = (eje: V3[]) => eje.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - eje[i][0], p[1] - eje[i][1], p[2] - eje[i][2]), 0)
const nivelDe = (z: number) => Math.max(NIVELES[NIVELES.length - 1], ...NIVELES.filter((n) => n <= z + 0.001))
const GALERIAS = LABORES.filter((l) => l.tipo === 'Galería')
/** Acceso: el piso del tajeo queda a ≤ 10 m sobre una galería de nivel que llega a su tramo. */
const conAcceso = (t: Tajeo) =>
  GALERIAS.some((g) => {
    const xs = g.eje!.map((p) => p[0])
    return t.zPiso - g.nivel >= 0 && t.zPiso - g.nivel <= 10 && Math.min(...xs) <= t.x0 + t.largo && Math.max(...xs) >= t.x0
  })

/** Evalúa los tajeos de la mina y los publicados por Designer UG, y las labores de desarrollo. */
export function evaluarReservas(p: Parametros, disenos: Diseno<Datos>[]) {
  const publicados = disenos.map(entrega).filter((e) => e != null)
  const fuentes = [
    ...TAJEOS_MINA.map((l) => {
      const [x0, x1, z0, z1] = l.caja!
      const t: Tajeo = { x0, largo: x1 - x0, zPiso: z0, alto: z1 - z0, ancho: POTENCIA, buzamiento: 90, yCentro: +vetaY((z0 + z1) / 2).toFixed(2) }
      return { id: l.id, nombre: l.nombre, origen: 'Mina piloto', nivel: l.nivel, t, densidad: l.densidad, densidadEsteril: DENSIDAD_ESTERIL, leyEsteril: LEY_ESTERIL, acceso: true }
    }),
    ...publicados.flatMap((e) =>
      e.datos.tipo === 'tajeo' ? [{ id: e.id, nombre: e.nombre, origen: `Designer v${e.version}`, nivel: nivelDe(e.datos.t.zPiso), t: e.datos.t, ...e.datos.ev, acceso: conAcceso(e.datos.t) }] : [],
    ),
  ]
  const tajeos = fuentes.map((f) => {
    const m = p.metodos[p.asignacion[f.id] ?? 'cyr']
    const ancho = Math.max(f.t.ancho, m.anchoMin)
    const ev = evaluarTajeo({ ...f.t, ancho }, BLOQUES, { densidad: f.densidad, densidadEsteril: f.densidadEsteril, leyEsteril: f.leyEsteril, sobre: m.sobre })
    const corte = leyCorteMetodo(m, p.eco)
    const categoria: Categoria = categoriaTajeo(ev.bloques.map((b) => (b.x <= LIMITE_MEDIDO ? 'Probada' : 'Probable')))
    return { ...f, metodo: m, ancho, ev, corte, categoria, ...reservaTajeo(ev.tDiluido, ev.leyDiluida, m, corte, f.acceso) }
  })

  const corteDes = leyCorteDesarrollo(p.eco)
  const desarrollo = [
    ...LABORES.filter((l) => l.tipo !== 'Tajeo').map((l) => {
      const metros = largo(l.eje!)
      return { id: l.id, nombre: l.nombre, tipo: l.tipo as string, origen: 'Mina piloto', metros, t: metros * l.seccion * l.densidad, ley: l.ley }
    }),
    ...publicados.flatMap((e) => (e.datos.tipo === 'labor' ? [{ id: e.id, nombre: e.nombre, tipo: e.datos.clase as string, origen: `Designer v${e.version}`, metros: e.resumen.largo, t: e.resumen.t, ley: 0 }] : [])),
  ].map((d) => ({ ...d, destino: d.ley >= corteDes ? ('Mineral' as const) : ('Desmonte' as const) }))

  const grupos = new Map<string, { nivel: number; metodo: string; categoria: Categoria; n: number; t: number; metal: number }>()
  for (const x of tajeos.filter((x) => x.estado === 'Reserva')) {
    const k = `${x.nivel}|${x.metodo.nombre}|${x.categoria}`
    const g = grupos.get(k) ?? { nivel: x.nivel, metodo: x.metodo.nombre, categoria: x.categoria, n: 0, t: 0, metal: 0 }
    g.n++
    g.t += x.recuperado
    g.metal += x.metal
    grupos.set(k, g)
  }
  const agregado = [...grupos.values()].sort((a, b) => b.nivel - a.nivel || a.metodo.localeCompare(b.metodo) || a.categoria.localeCompare(b.categoria))
  return { tajeos, desarrollo, corteDes, agregado }
}
