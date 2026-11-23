import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AVANCE_DISPARO } from './data/minaPiloto'
import { entrega, type Datos } from './disenos'
import { duracion } from './domain/modulos'
import { nivelar, porPeriodo, type ActividadRecurso, type Colocada, type FilaEscenario } from './domain/scheduler'
import type { Diseno } from './domain/versiones'
import type { evaluarReservas } from './reservas'

export interface ParamPrograma {
  /** m/día, t/día, m³/día y disponibilidad (%) */
  tasas: { desarrollo: number; produccion: number; relleno: number; disp: number }
  /** unidades por recurso */
  recursos: Record<string, number>
  /** metros de preparación (subnivel y chimenea) por tajeo */
  prepMetros: number
}
export const PARAM_INICIAL: ParamPrograma = {
  tasas: { desarrollo: 2 * AVANCE_DISPARO, produccion: 400, relleno: 350, disp: 85 },
  recursos: { Jumbo: 2, Scoop: 2, 'Cuadrilla de relleno': 1 },
  prepMetros: 60,
}
/** Escenario aprobado: no se edita; para cambiarlo se cargan sus parámetros y se aprueba otro. */
export interface Escenario {
  numero: number
  nombre: string
  fecha: string
  autor: string
  parametros: ParamPrograma
  actividades: FilaEscenario[]
  fin: number
  meses: { nombre: string; t: number; finos: number }[]
}
const soloParametros = ({ tasas, recursos, prepMetros }: ParamPrograma): ParamPrograma => structuredClone({ tasas, recursos, prepMetros })

export const usePrograma = create<
  ParamPrograma & {
    escenarios: Escenario[]
    set: (p: Partial<ParamPrograma>) => void
    restablecer: () => void
    aprobar: (e: Omit<Escenario, 'numero' | 'fecha' | 'autor' | 'parametros'>) => void
    cargar: (numero: number) => void
  }
>()(
  persist(
    (set, get) => ({
      ...PARAM_INICIAL,
      escenarios: [],
      set: (p) => set(p),
      restablecer: () => set(soloParametros(PARAM_INICIAL)),
      aprobar: (e) =>
        set((s) => ({ escenarios: [...s.escenarios, { ...e, numero: s.escenarios.length + 1, fecha: new Date().toISOString(), autor: 'Ingeniero senior', parametros: soloParametros(s) }] })),
      cargar: (numero) => {
        const e = get().escenarios.find((x) => x.numero === numero)
        if (e) set(soloParametros(e.parametros))
      },
    }),
    { name: 'codea-planning-ug/programa', version: 1 },
  ),
)

// ── calendario: 7 días, dos guardias; paradas en feriados (ejemplo) ──
export const INICIO = '2026-12-01'
export const FERIADOS = ['2026-12-08', '2026-12-25', '2027-01-01', '2027-04-01', '2027-04-02', '2027-05-01', '2027-06-29', '2027-07-28', '2027-07-29', '2027-08-30', '2027-10-08', '2027-11-01', '2027-12-08', '2027-12-25', '2028-01-01']
const DIA = 86400e3
const T0 = Date.parse(`${INICIO}T00:00:00Z`)
export const isoDe = (d: number) => new Date(T0 + d * DIA).toISOString().slice(0, 10)
export const fechaDe = (d: number) => new Date(T0 + d * DIA)
const PARADAS = new Set(FERIADOS)
export const esParada = (d: number) => PARADAS.has(isoDe(d))

export type TipoActividad = 'Desarrollo' | 'Preparación' | 'Producción' | 'Relleno'
export interface ActividadMina extends ActividadRecurso {
  nombre: string
  tipo: TipoActividad
  nivel: number
  cantidad: number
  unidad: 'm' | 't' | 'm³'
  ley: number
  destino: 'Planta' | 'Desmonte' | 'Relleno'
  /** toneladas movidas */
  t: number
  /** objeto de diseño o tajeo al que está enlazada (por id, no por nombre) */
  enlace: string
}

const SECCION_PREP = 12
const DENSIDAD_ROCA = 2.8

/** Arma las actividades: desarrollo publicado en Designer UG y, por tajeo en reserva, preparación → producción → relleno. */
export function armarActividades(p: ParamPrograma, reservas: ReturnType<typeof evaluarReservas>, disenos: Diseno<Datos>[]) {
  const dur = (c: number, tasa: number) => duracion(c, tasa, p.tasas.disp / 100)
  const acts: ActividadMina[] = []
  for (const e of disenos.map(entrega)) {
    if (e?.datos.tipo !== 'labor') continue
    const z = e.datos.origen[2]
    acts.push({ id: `DES-${e.id}`, nombre: `${e.nombre} (v${e.version})`, tipo: 'Desarrollo', nivel: Math.round(z / 50) * 50, cantidad: e.resumen.largo, unidad: 'm', ley: 0, destino: 'Desmonte', t: e.resumen.t, dur: dur(e.resumen.largo, p.tasas.desarrollo), pred: [], recurso: 'Jumbo', prioridad: Number.MAX_SAFE_INTEGER, enlace: `${e.id}@v${e.version}` })
  }
  const enReserva = reservas.tajeos.filter((x) => x.estado === 'Reserva')
  const ultima = new Map<string, string>()
  // de abajo hacia arriba: el tajeo superior espera al inferior que se le traslapa (regla de secuencia de la demo)
  for (const x of [...enReserva].sort((a, b) => a.nivel - b.nivel)) {
    const debajo = enReserva.find((b) => b.nivel === x.nivel - 50 && b.t.x0 < x.t.x0 + x.t.largo && x.t.x0 < b.t.x0 + b.t.largo)
    const dProd = dur(x.recuperado, p.tasas.produccion)
    const prioridad = x.metal / dProd
    const base = { nivel: x.nivel, prioridad, enlace: x.origen === 'Mina piloto' ? x.id : `${x.id}@${x.origen.replace('Designer ', '')}` }
    const prep = `PRE-${x.id}`
    const prod = `PRO-${x.id}`
    const tPrep = p.prepMetros * SECCION_PREP * DENSIDAD_ROCA
    acts.push({ ...base, id: prep, nombre: `Preparación ${x.nombre}`, tipo: 'Preparación', cantidad: p.prepMetros, unidad: 'm', ley: 0, destino: 'Desmonte', t: tPrep, dur: dur(p.prepMetros, p.tasas.desarrollo), pred: [], recurso: 'Jumbo' })
    acts.push({ ...base, id: prod, nombre: `Producción ${x.nombre}`, tipo: 'Producción', cantidad: x.recuperado, unidad: 't', ley: x.ev.leyDiluida, destino: 'Planta', t: x.recuperado, dur: dProd, pred: [prep, ...(debajo ? [ultima.get(debajo.id)!] : [])], recurso: 'Scoop' })
    ultima.set(x.id, prod)
    if (x.metodo.id === 'cyr') {
      const m3 = x.recuperado / x.densidad
      acts.push({ ...base, id: `REL-${x.id}`, nombre: `Relleno ${x.nombre}`, tipo: 'Relleno', cantidad: m3, unidad: 'm³', ley: 0, destino: 'Relleno', t: 0, dur: dur(m3, p.tasas.relleno), pred: [prod], recurso: 'Cuadrilla de relleno' })
      ultima.set(x.id, `REL-${x.id}`)
    }
  }
  return acts
}

/** Programa nivelado con su plan mensual. Devuelve el error de validación en vez de lanzar. */
export function calcularPrograma(p: ParamPrograma, reservas: ReturnType<typeof evaluarReservas>, disenos: Diseno<Datos>[]) {
  const errores: string[] = []
  for (const [k, l] of [['desarrollo', 'desarrollo'], ['produccion', 'producción'], ['relleno', 'relleno']] as const)
    if (!(p.tasas[k] > 0)) errores.push(`La tasa de ${l} debe ser mayor que cero`)
  if (!(p.tasas.disp > 0 && p.tasas.disp <= 100)) errores.push('La disponibilidad va de 0 a 100 %')
  if (!(p.prepMetros > 0)) errores.push('La preparación por tajeo debe tener metros')
  if (errores.length) return { ok: false, errores } as const
  const acts = armarActividades(p, reservas, disenos)
  let niv: ReturnType<typeof nivelar>
  try {
    niv = nivelar(acts, p.recursos, esParada)
  } catch (e) {
    return { ok: false, errores: [(e as Error).message] } as const
  }
  const fin = Math.max(0, ...Object.values(niv.colocadas).map((c) => c.fin))
  const meses: { nombre: string; desde: number; hasta: number }[] = []
  for (let d = 0; d < fin; ) {
    const f = fechaDe(d)
    const sig = Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 1)
    const hasta = Math.round((sig - T0) / DIA)
    meses.push({ nombre: f.toISOString().slice(0, 7), desde: d, hasta })
    d = hasta
  }
  const col = (a: ActividadMina): Colocada => niv.colocadas[a.id]
  const periodos = porPeriodo(acts.map((a) => ({ ...a, dias: col(a).dias })), meses)
  const filas: FilaEscenario[] = acts.map((a) => ({ id: a.id, nombre: a.nombre, enlace: a.enlace, cantidad: a.cantidad, unidad: a.unidad, dias: col(a).dias.length, inicio: col(a).inicio, fin: col(a).fin }))
  return { ok: true, errores: [] as string[], acts, niv, fin, meses, periodos, filas } as const
}
