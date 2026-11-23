// Diseños del Designer UG: almacenamiento propio, así «Reiniciar demo» y los cambios de la mina piloto no los borran.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generarBloques } from './data/minaPiloto'
import { areaSeccion, ejeDeTramos, esquinasTajeo, evaluarTajeo, validarTramos, type Reglas, type Seccion, type Tajeo, type Tramo } from './domain/designer'
import { congelar, crear, guardar, nuevaVersion, publicar, ultima, type Diseno } from './domain/versiones'

export type ClaseLabor = 'Rampa' | 'Galería' | 'Crucero' | 'Chimenea'
export interface DatosLabor {
  tipo: 'labor'
  clase: ClaseLabor
  seccion: Seccion
  reglas: Reglas
  densidad: number
  pilarMin: number
  /** inicio del eje en coordenadas de mina (x rumbo de veta, y transversal, z cota) */
  origen: [number, number, number]
  /** rumbo inicial en grados, 0 = +x */
  rumbo: number
  tramos: Tramo[]
}
export interface EvalTajeo {
  densidad: number
  densidadEsteril: number
  leyEsteril: number
  sobre: number
  pilarMin: number
  leyCorte: number
}
export interface DatosTajeo {
  tipo: 'tajeo'
  t: Tajeo
  ev: EvalTajeo
}
export type Datos = DatosLabor | DatosTajeo
export type Tipo = Datos['tipo']

export const vetaY = (z: number) => 3 * Math.sin(z / 30)

export const LABOR_INICIAL: DatosLabor = {
  tipo: 'labor',
  clase: 'Rampa',
  seccion: { forma: 'herradura', ancho: 5, alto: 2, sobre: 0.2 },
  reglas: { gradienteMax: 15, radioMin: 12 },
  densidad: 2.8,
  pilarMin: 3,
  // arranca al final de la galería del NV 3750 y sube en zigzag
  origen: [220, -14, 3750],
  rumbo: 0,
  tramos: [
    { tipo: 'recta', largo: 40, gradiente: 12 },
    { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
    { tipo: 'recta', largo: 40, gradiente: 12 },
    { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
    { tipo: 'recta', largo: 40, gradiente: 12 },
  ],
}
// hueco libre de ley alta en el bloque 3800-3850, con las medidas del caso de la ficha (30 × 8 × 25)
export const TAJEO_INICIAL: DatosTajeo = {
  tipo: 'tajeo',
  t: { x0: 380, largo: 30, zPiso: 3810, alto: 25, ancho: 8, buzamiento: 90, yCentro: 3 },
  ev: { densidad: 2.9, densidadEsteril: 2.7, leyEsteril: 0.3, sobre: 0.5, pilarMin: 3, leyCorte: 2.5 },
}

export const BLOQUES = generarBloques()

/** Cifras de una versión para listar y comparar. Labor: roca con sobre-excavación; tajeo: mineral diluido. */
export function resumen(d: Datos) {
  if (d.tipo === 'labor') {
    const e = ejeDeTramos(d.origen, d.rumbo, d.tramos)
    const a = areaSeccion(d.seccion)
    return { largo: e.largo3D, volumen: a.area * e.largo3D, t: a.conSobre * e.largo3D * d.densidad, ley: null, dilucion: null, errores: validarTramos(d.tramos, d.reglas).length }
  }
  const r = evaluarTajeo(d.t, BLOQUES, d.ev)
  return { largo: d.t.largo, volumen: r.volumen, t: r.tDiluido, ley: r.leyDiluida, dilucion: r.dilucion, errores: 0 }
}

/** Geometría para exportar: labor = eje 3D en la capa de su tipo; tajeo = contornos de piso y techo cerrados. */
export function piezasCAD(id: string, d: Datos) {
  if (d.tipo === 'labor') return [{ id, tipo: d.clase, eje: ejeDeTramos(d.origen, d.rumbo, d.tramos).puntos, cerrada: false }]
  const [piso, techo] = esquinasTajeo(d.t)
  return [
    { id: `${id}-PISO`, tipo: 'Tajeo', eje: piso, cerrada: true },
    { id: `${id}-TECHO`, tipo: 'Tajeo', eje: techo, cerrada: true },
  ]
}

const AUTOR = 'Ingeniero de planeamiento'
const SENIOR = 'Ingeniero senior de planeamiento'
const hoy = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

/** Lo que está abierto en el editor: un diseño guardado (id y versión) o uno nuevo sin guardar. */
export interface Abierto<D> {
  id: string | null
  numero: number | null
  datos: D
}

interface Estado {
  disenos: Diseno<Datos>[]
  labor: Abierto<DatosLabor>
  tajeo: Abierto<DatosTajeo>
  editar: (d: Datos) => void
  abrir: (id: string, numero: number) => void
  nuevo: (tipo: Tipo) => void
  /** guarda en la versión abierta (crea el diseño si es nuevo); devuelve un error si no se puede */
  guardar: (tipo: Tipo, nombre?: string) => string | null
  nuevaVersion: (tipo: Tipo, comentario: string) => void
  congelar: (id: string) => void
  publicar: (id: string, numero: number) => string | null
  borrar: (id: string) => void
}

export const useDisenos = create<Estado>()(
  persist(
    (set, get) => {
      const reemplazar = (d: Diseno<Datos>) => set((s) => ({ disenos: s.disenos.map((x) => (x.id === d.id ? d : x)) }))
      const abierto = (tipo: Tipo): Abierto<Datos> => get()[tipo]
      return {
        disenos: [],
        labor: { id: null, numero: null, datos: LABOR_INICIAL },
        tajeo: { id: null, numero: null, datos: TAJEO_INICIAL },
        editar: (d) => set((s) => ({ [d.tipo]: { ...s[d.tipo], datos: d } })),
        abrir: (id, numero) => {
          const d = get().disenos.find((x) => x.id === id)
          const v = d?.versiones.find((x) => x.numero === numero)
          if (v) set({ [v.datos.tipo]: { id, numero, datos: v.datos } })
        },
        nuevo: (tipo) => set({ [tipo]: { id: null, numero: null, datos: tipo === 'labor' ? LABOR_INICIAL : TAJEO_INICIAL } }),
        guardar: (tipo, nombre) => {
          const a = abierto(tipo)
          if (!a.id) {
            const n = get().disenos.filter((x) => ultima(x).datos.tipo === tipo).length + 1
            const id = `${tipo === 'labor' ? 'DL' : 'DT'}-${String(n).padStart(2, '0')}-${Date.now().toString(36).slice(-4)}`
            const d = crear<Datos>(id, nombre?.trim() || `${tipo === 'labor' ? (a.datos as DatosLabor).clase : 'Tajeo'} en diseño ${n}`, a.datos, hoy(), AUTOR)
            set((s) => ({ disenos: [...s.disenos, d], [tipo]: { ...a, id, numero: 1 } }))
            return null
          }
          const d = get().disenos.find((x) => x.id === a.id)!
          if (a.numero !== ultima(d).numero) return 'Solo se edita la última versión: abre la última o crea una nueva'
          const r = guardar(d, a.datos, hoy())
          if (typeof r === 'string') return r
          reemplazar(nombre?.trim() ? { ...r, nombre: nombre.trim() } : r)
          return null
        },
        nuevaVersion: (tipo, comentario) => {
          const a = abierto(tipo)
          const d = get().disenos.find((x) => x.id === a.id)
          if (!d) return
          const r = nuevaVersion(d, a.datos, comentario, hoy(), AUTOR)
          reemplazar(r)
          set({ [tipo]: { ...a, numero: ultima(r).numero } })
        },
        congelar: (id) => {
          const d = get().disenos.find((x) => x.id === id)
          if (d) reemplazar(congelar(d, SENIOR, hoy()))
        },
        publicar: (id, numero) => {
          const d = get().disenos.find((x) => x.id === id)
          if (!d) return 'Diseño no encontrado'
          const r = publicar(d, numero)
          if (typeof r === 'string') return r
          reemplazar(r)
          return null
        },
        borrar: (id) =>
          set((s) => ({
            disenos: s.disenos.filter((x) => x.id !== id),
            labor: s.labor.id === id ? { id: null, numero: null, datos: s.labor.datos } : s.labor,
            tajeo: s.tajeo.id === id ? { id: null, numero: null, datos: s.tajeo.datos } : s.tajeo,
          })),
      }
    },
    { name: 'codea-planning-ug/disenos', version: 1 },
  ),
)
