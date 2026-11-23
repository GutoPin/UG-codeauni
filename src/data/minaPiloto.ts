// Mina piloto UG — datos SINTÉTICOS de demostración (Fase 0 del plan de trabajo).
// Determinista: misma semilla, misma mina. Nada aquí es de una mina real.
import { avancePorDisparo, tonelajeAvance } from '../domain/stp'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Calendario de la demo ─────────────────────────────────────────
// shortcut: reloj fijo para que la demo sea reproducible; usar la fecha real cuando haya datos de Shift UG.
export const AHORA = new Date('2026-11-26T09:40:00')
export const SEMANA = { numero: 48, inicio: '2026-11-23', fin: '2026-11-29' }
export const DIAS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date('2026-11-23T00:00:00')
  d.setDate(d.getDate() + i)
  return d.toISOString().slice(0, 10)
})
export type Guardia = 'D' | 'N'
export const GUARDIAS: { id: Guardia; nombre: string; inicioHora: number }[] = [
  { id: 'D', nombre: 'Día', inicioHora: 7 },
  { id: 'N', nombre: 'Noche', inicioHora: 19 },
]
export const HORAS_GUARDIA = 12
/** Guardia en curso según el reloj de la demo. */
export const GUARDIA_ACTUAL = { fecha: '2026-11-26', guardia: 'D' as Guardia }

export function inicioGuardia(fecha: string, g: Guardia) {
  const d = new Date(`${fecha}T00:00:00`)
  d.setHours(g === 'D' ? 7 : 19)
  return d
}
export const estadoGuardia = (fecha: string, g: Guardia): 'pasada' | 'actual' | 'futura' => {
  const ini = inicioGuardia(fecha, g).getTime()
  const fin = ini + HORAS_GUARDIA * 3600e3
  const t = AHORA.getTime()
  return t >= fin ? 'pasada' : t >= ini ? 'actual' : 'futura'
}

// ── Catálogos semilla (ficha 01) ──────────────────────────────────
export const CAUSAS = [
  'Falta de equipo',
  'Ventilación',
  'Sostenimiento',
  'Falta de explosivos',
  'Mantenimiento',
  'Ausencia de personal',
] as const
export type Causa = (typeof CAUSAS)[number]
export const TIPOS_TAREA = ['Perforación', 'Carguío', 'Disparo', 'Limpieza', 'Sostenimiento', 'Relleno'] as const
/** Umbral de desvío (%) sobre el cual cerrar una tarea exige causa. */
export const UMBRAL_DESVIO = 10

export const SUPERVISORES = [
  { id: 'SV1', nombre: 'R. Quispe', area: 'Perforación y voladura' },
  { id: 'SV2', nombre: 'M. Huamán', area: 'Producción' },
  { id: 'SV3', nombre: 'L. Condori', area: 'Sostenimiento' },
]
export const CUADRILLAS = [
  { id: 'CA', nombre: 'Cuadrilla A', guardia: 'D' as Guardia },
  { id: 'CB', nombre: 'Cuadrilla B', guardia: 'D' as Guardia },
  { id: 'CC', nombre: 'Cuadrilla C', guardia: 'N' as Guardia },
  { id: 'CD', nombre: 'Cuadrilla D', guardia: 'N' as Guardia },
]

export type TipoEquipo = 'Jumbo' | 'Scoop' | 'Camión bajo perfil' | 'Empernador'
export interface Equipo {
  id: string
  tipo: TipoEquipo
  modelo: string
  horasUtiles: number
  rendimiento: number
  unidad: string
}
export const EQUIPOS: Equipo[] = [
  { id: 'JB-01', tipo: 'Jumbo', modelo: 'Jumbo 1 brazo', horasUtiles: 9, rendimiento: 12, unidad: 'm barreno/h' },
  { id: 'JB-02', tipo: 'Jumbo', modelo: 'Jumbo 1 brazo', horasUtiles: 9, rendimiento: 12, unidad: 'm barreno/h' },
  { id: 'JB-03', tipo: 'Jumbo', modelo: 'Jumbo taladros largos', horasUtiles: 9, rendimiento: 18, unidad: 'm barreno/h' },
  { id: 'SC-01', tipo: 'Scoop', modelo: 'Scoop 4,2 yd³', horasUtiles: 9, rendimiento: 55, unidad: 't/h' },
  { id: 'SC-02', tipo: 'Scoop', modelo: 'Scoop 4,2 yd³', horasUtiles: 9, rendimiento: 55, unidad: 't/h' },
  { id: 'CB-01', tipo: 'Camión bajo perfil', modelo: 'Camión 20 t', horasUtiles: 9, rendimiento: 40, unidad: 't/h' },
  { id: 'EM-01', tipo: 'Empernador', modelo: 'Empernador', horasUtiles: 9, rendimiento: 6, unidad: 'm/h' },
]

// ── Geometría (coordenadas de mina: x rumbo, y transversal, z cota) ──
export const NIVELES = [3900, 3850, 3800, 3750]
export const LARGO_VETA = 420
export type V3 = [number, number, number]

export type TipoLabor = 'Rampa' | 'Galería' | 'Crucero' | 'Chimenea' | 'Tajeo'
export interface Labor {
  id: string
  nombre: string
  tipo: TipoLabor
  nivel: number
  supervisorId: string
  seccion: number // m2
  densidad: number // t/m3
  ley: number // g/t Au
  /** desarrollo: eje; tajeo: caja [xmin, xmax, zmin, zmax] */
  eje?: V3[]
  caja?: [number, number, number, number]
  reingresoHoras: number
}

const rampa: V3[] = (() => {
  const pts: V3[] = []
  const R = 18
  const vueltas = 10
  for (let i = 0; i <= vueltas * 24; i++) {
    const th = (i / 24) * Math.PI * 2
    pts.push([-55 + R * Math.cos(th), -40 + R * Math.sin(th), 3745 + (160 * i) / (vueltas * 24)])
  }
  return pts
})()

export const LABORES: Labor[] = [
  { id: 'RP-01', nombre: 'Rampa principal', tipo: 'Rampa', nivel: 3750, supervisorId: 'SV1', seccion: 18, densidad: 2.8, ley: 0, eje: rampa, reingresoHoras: 0.75 },
  ...NIVELES.map((z, i): Labor => ({
    id: `GL-${z}`,
    nombre: `Galería ${z} ${i % 2 ? 'S' : 'N'}`,
    tipo: 'Galería',
    nivel: z,
    supervisorId: 'SV1',
    seccion: 12,
    densidad: 2.8,
    ley: 1.2 + i * 0.4,
    eje: [
      [-40, -14, z],
      [z === 3750 ? 220 : LARGO_VETA, -14, z],
    ],
    reingresoHoras: 0.5,
  })),
  ...NIVELES.flatMap((z, i) =>
    [80, 240].map((x, k): Labor => ({
      id: `CX-${z}-${k + 1}`,
      nombre: `Crucero ${z}-${k + 1}`,
      tipo: 'Crucero',
      nivel: z,
      supervisorId: 'SV3',
      seccion: 12,
      densidad: 2.8,
      ley: 0,
      eje: [
        [x, -14, z],
        [x + 4, 3, z],
      ],
      reingresoHoras: 0.5 + ((i + k) % 2) * 0.25,
    })),
  ),
  { id: 'CH-3800', nombre: 'Chimenea 3800-3850', tipo: 'Chimenea', nivel: 3800, supervisorId: 'SV3', seccion: 4, densidad: 2.8, ley: 0, eje: [[160, -8, 3800], [160, -8, 3850]], reingresoHoras: 1 },
  ...[
    [3850, 3900, 20, 70],
    [3850, 3900, 110, 165],
    [3850, 3900, 200, 250],
    [3800, 3850, 40, 95],
    [3800, 3850, 140, 190],
    [3800, 3850, 230, 290],
    [3750, 3800, 60, 115],
    [3750, 3800, 150, 200],
  ].map(([z0, z1, x0, x1], i): Labor => ({
    id: `TJ-${z0 + 25}-${String(i + 1).padStart(2, '0')}`,
    nombre: `Tajeo ${z0 + 25}-${String(i + 1).padStart(2, '0')}`,
    tipo: 'Tajeo',
    nivel: z0,
    supervisorId: 'SV2',
    seccion: 0,
    densidad: 2.9,
    ley: +(3.2 + ((i * 2.71) % 6.5)).toFixed(2),
    caja: [x0, x1, z0 + 5, z1 - 5],
    reingresoHoras: 1,
  })),
]

/** Labores que entran al programa de esta semana (el resto ya está terminado o en espera). */
export const LABORES_SEMANA = [
  'RP-01', 'GL-3750', 'CX-3750-1', 'CX-3800-2', 'CH-3800', 'GL-3800',
  'TJ-3875-01', 'TJ-3875-03', 'TJ-3825-04', 'TJ-3825-06', 'TJ-3775-07', 'TJ-3775-08',
]

export interface HabilitacionLabor {
  ventilacionOk: boolean
  sostenimientoOk: boolean
  equipoOk: boolean
  reingresoHasta: string | null
}
export const HABILITACION_INICIAL: Record<string, HabilitacionLabor> = Object.fromEntries(
  LABORES_SEMANA.map((id) => [id, { ventilacionOk: true, sostenimientoOk: true, equipoOk: true, reingresoHasta: null }]),
)
// Estados que la demo debe mostrar (ficha: alerta si la labor no está habilitada).
HABILITACION_INICIAL['CX-3800-2'] = { ventilacionOk: false, sostenimientoOk: true, equipoOk: true, reingresoHasta: null }
HABILITACION_INICIAL['TJ-3775-08'] = { ventilacionOk: true, sostenimientoOk: true, equipoOk: true, reingresoHasta: '2026-11-26T10:15:00' }
HABILITACION_INICIAL['CH-3800'] = { ventilacionOk: true, sostenimientoOk: false, equipoOk: true, reingresoHasta: null }

// ── Parámetros de ciclo (ficha 01: avance por disparo y tonelaje de avance) ──
export const BARRENO = 3.0
export const EFICIENCIA = 0.9
export const TALADROS_FRENTE = 38
export const AVANCE_DISPARO = avancePorDisparo(BARRENO, EFICIENCIA) // 2,7 m

// ── Tareas ────────────────────────────────────────────────────────
export interface Tarea {
  id: string
  laborId: string
  fecha: string
  guardia: Guardia
  tipo: (typeof TIPOS_TAREA)[number]
  unidad: 'm' | 't'
  plan: number
  real: number | null
  equipoId: string
  cuadrillaId: string
  /** horas desde el inicio de la guardia */
  inicio: number
  fin: number
  estado: 'pendiente' | 'en curso' | 'cerrada'
  causa: Causa | null
  minutosPerdidos: number
  /** meta recibida por arrastre desde el día anterior */
  arrastre?: number
  /** pendiente ya pasado al día siguiente */
  pendienteArrastrado?: number
}

const equipoDesarrollo = ['JB-01', 'JB-02']
const equipoTajeo = ['SC-01', 'SC-02']
const devs = LABORES_SEMANA.filter((id) => !id.startsWith('TJ') && id !== 'CX-3800-2')
const tajeos = LABORES_SEMANA.filter((id) => id.startsWith('TJ'))

export function generarTareas(): Tarea[] {
  const r = rng(48)
  const tareas: Tarea[] = []
  let n = 0
  DIAS.forEach((fecha) =>
    GUARDIAS.forEach(({ id: g }) => {
      const cuad = CUADRILLAS.filter((c) => c.guardia === g)
      const estado = estadoGuardia(fecha, g)
      LABORES_SEMANA.forEach((laborId, li) => {
        const l = LABORES.find((x) => x.id === laborId)!
        const dev = l.tipo !== 'Tajeo'
        if (laborId === 'CX-3800-2' || (laborId === 'CH-3800' && g === 'N')) return
        const plan = dev
          ? l.tipo === 'Chimenea'
            ? 1.8
            : AVANCE_DISPARO
          : 180 + Math.round(r() * 8) * 10
        // Reparto secuencial: cada equipo hace hasta 3 tareas de 4 h por guardia, sin solaparse.
        const k = (dev ? devs : tajeos).indexOf(laborId)
        const equipoId = dev ? equipoDesarrollo[Math.floor(k / 3)] : equipoTajeo[Math.floor(k / 3)]
        const slot = k % 3
        const inicio = slot * 4
        const t: Tarea = {
          id: `T${++n}`,
          laborId,
          fecha,
          guardia: g,
          tipo: dev ? 'Perforación' : 'Limpieza',
          unidad: dev ? 'm' : 't',
          plan: +plan.toFixed(2),
          real: null,
          equipoId,
          cuadrillaId: cuad[li % cuad.length].id,
          inicio,
          fin: inicio + 3,
          estado: estado === 'futura' ? 'pendiente' : estado === 'actual' ? (slot === 0 ? 'en curso' : 'pendiente') : 'cerrada',
          causa: null,
          minutosPerdidos: 0,
        }
        if (estado === 'pasada') {
          // Una guardia sin reporte de Shift: el cumplimiento queda vacío ("no inventar").
          const sinReporte = fecha === '2026-11-24' && g === 'N' && li % 4 === 1
          if (sinReporte) {
            t.estado = 'pendiente'
          } else {
            const x = r()
            const factor = x < 0.62 ? 0.95 + r() * 0.12 : x < 0.85 ? 0.6 + r() * 0.3 : r() * 0.4
            t.real = +(t.plan * factor).toFixed(dev ? 2 : 0)
            if ((t.real / t.plan) * 100 < 100 - UMBRAL_DESVIO) {
              const pesos = [0.28, 0.12, 0.1, 0.08, 0.3, 0.12]
              let y = r()
              let ci = 0
              while (y > pesos[ci]) y -= pesos[ci++]
              t.causa = CAUSAS[Math.min(ci, CAUSAS.length - 1)]
              t.minutosPerdidos = Math.round((1 - t.real / t.plan) * 600 + r() * 30)
            }
          }
        }
        if (estado === 'actual' && slot === 0) t.real = dev ? 1.1 : 70
        tareas.push(t)
      })
    }),
  )
  // Conflicto deliberado para la demo: JB-02 en dos frentes a la vez el viernes, guardia día.
  const a = tareas.find((t) => t.fecha === '2026-11-27' && t.guardia === 'D' && t.laborId === 'GL-3750')!
  const b = tareas.find((t) => t.fecha === '2026-11-27' && t.guardia === 'D' && t.laborId === 'GL-3800')!
  b.equipoId = a.equipoId
  b.inicio = a.inicio + 2
  b.fin = b.inicio + 4
  console.assert(a.equipoId === b.equipoId, 'conflicto de demo')
  return tareas
}

/** Totales de programa semanal por labor (ficha: avance, disparos, toneladas, m perforados, sostenimiento). */
export function resumenLabor(l: Labor, tareas: Tarea[]) {
  const ts = tareas.filter((t) => t.laborId === l.id)
  const plan = ts.reduce((s, t) => s + t.plan, 0)
  const reportadas = ts.filter((t) => t.real != null)
  const real = reportadas.length ? reportadas.reduce((s, t) => s + (t.real ?? 0), 0) : null
  const planReportado = reportadas.reduce((s, t) => s + t.plan, 0)
  if (l.tipo === 'Tajeo')
    return { avance: 0, disparos: Math.ceil(plan / 450), toneladas: plan, perforados: Math.ceil(plan / 450) * 6 * 15, sostenimiento: 0, plan, real, planReportado }
  const disparos = Math.round(plan / (l.tipo === 'Chimenea' ? 1.8 : AVANCE_DISPARO))
  return {
    avance: plan,
    disparos,
    toneladas: tonelajeAvance(l.seccion, plan, l.densidad),
    perforados: disparos * TALADROS_FRENTE * BARRENO,
    sostenimiento: l.tipo === 'Chimenea' ? 0 : plan,
    plan,
    real,
    planReportado,
  }
}

// ── Modelo de bloques de la veta (submuestreado para el visor) ──────
// shortcut: ~5 000 bloques de 5 m; el plan pide ≈50 000 — generar el modelo completo cuando se acuerde el formato con Geology (OMF/CSV).
export interface Bloque {
  x: number
  y: number
  z: number
  ley: number
}
export function generarBloques(): Bloque[] {
  const out: Bloque[] = []
  const lento = (x: number, z: number) =>
    2.2 +
    3.4 * Math.sin(x / 55) * Math.cos(z / 40) +
    2.6 * Math.sin((x + z) / 23) +
    1.8 * Math.cos(x / 17 - z / 31)
  for (let x = -10; x <= LARGO_VETA + 10; x += 5)
    for (let z = 3735; z <= 3915; z += 5) {
      const ley = Math.max(0.2, lento(x, z) + 2.5)
      const desplaz = 3 * Math.sin(z / 30) // la veta ondula con la cota
      out.push({ x, y: desplaz, z, ley: +ley.toFixed(2) })
    }
  return out
}

/**
 * Metas de la semana (ficha 01, Meta: periodo, indicador, valor). Producción y desarrollo = el programa original de la
 * semana; la ley objetivo la pide la planta (valor de demostración, ver QUESTIONS.md).
 */
export const METAS_SEMANA = (() => {
  const ts = generarTareas()
  const suma = (u: 'm' | 't') => +ts.filter((t) => t.unidad === u).reduce((s, t) => s + t.plan, 0).toFixed(1)
  return { t: suma('t'), m: suma('m'), ley: 6.5 }
})()
