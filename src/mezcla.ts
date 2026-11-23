// Blend UG sobre la mina piloto: fuentes de la semana del STP, parámetros de planta y transporte, y plan aprobado.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DIAS, inicioGuardia, estadoGuardia, LABORES_SEMANA, type Guardia, type Tarea } from './data/minaPiloto'
import { laborDe } from './derive'
import { capacidadCamiones, capacidadPique, type FuenteMezcla, type Objetivo, type Problema } from './domain/mezcla'
import type { Economia } from './domain/reservas'
import { estaHabilitada, tonelajeAvance, type Habilitacion } from './domain/stp'

// shortcut: la mina piloto no trae dureza ni arsénico; valores sintéticos por fuente hasta tener ensayos de Grade Control / Met Tests (QUESTIONS 19)
export const CALIDAD: Record<string, { dureza: number; as: number }> = {
  'TJ-3875-01': { dureza: 13.5, as: 0.1 },
  'TJ-3875-03': { dureza: 15.5, as: 0.6 },
  'TJ-3825-04': { dureza: 14.5, as: 0.2 },
  'TJ-3825-06': { dureza: 14, as: 0.15 },
  'TJ-3775-07': { dureza: 16.5, as: 0.35 },
  'TJ-3775-08': { dureza: 17, as: 0.85 },
  'GL-3750': { dureza: 13, as: 0.1 },
  'GL-3800': { dureza: 13, as: 0.1 },
  'AC-3750': { dureza: 14, as: 0.3 },
  CARGA: { dureza: 14.5, as: 0.25 },
}
/** Acopio de interior junto al echadero del NV 3750 (sintético; lo daría Stockpiles UG). */
export const ACOPIO = { id: 'AC-3750', nombre: 'Acopio NV 3750', t: 1500, ley: 3.4 }

export interface ParamMezcla {
  plantaDia: number
  plantaMinDia: number
  leyMin: number
  leyMax: number
  durezaMax: number
  asMax: number
  tph: number
  horas: number
  dispPique: number
  camiones: number
  tViaje: number
  viajes: number
  chimeneaCap: number
  chimeneaIni: number
  chimeneaLey: number
  chimeneaSalida: number
  costoCamion: number
  costoPique: number
  objetivo: Objetivo
  leyObjetivo: number
  /** fuentes marcadas agotadas o fuera del plan */
  fuera: string[]
}
export const PARAM_MEZCLA: ParamMezcla = {
  plantaDia: 2400,
  plantaMinDia: 0,
  leyMin: 4,
  leyMax: 9,
  durezaMax: 16,
  asMax: 0.4,
  tph: 120,
  horas: 11,
  dispPique: 0.85,
  camiones: 4,
  tViaje: 12,
  viajes: 10,
  chimeneaCap: 600,
  chimeneaIni: 350,
  chimeneaLey: 4.1,
  chimeneaSalida: 700,
  costoCamion: 1.8,
  costoPique: 1.2,
  objetivo: 'valor',
  leyObjetivo: 6.5,
  fuera: [],
}

export interface Guardia_ {
  fecha: string
  g: Guardia
  nombre: string
  estado: 'pasada' | 'actual' | 'futura'
}
export const GUARDIAS: Guardia_[] = DIAS.flatMap((fecha) =>
  (['D', 'N'] as const).map((g) => ({ fecha, g, nombre: `${fecha.slice(8)} ${g === 'D' ? 'día' : 'noche'}`, estado: estadoGuardia(fecha, g) })),
)
export const ABIERTAS = GUARDIAS.filter((q) => q.estado !== 'pasada')

/** toneladas de mineral que deja una tarea: tajeo en t; frente de galería en m × sección × densidad */
const tonTarea = (t: Tarea, real = false) => {
  const v = real ? t.real : t.plan
  if (v == null) return null
  const l = laborDe(t.laborId)
  return t.unidad === 't' ? v : tonelajeAvance(l.seccion, v, l.densidad)
}
const esFuente = (id: string) => {
  const l = laborDe(id)
  return l.ley > 0 && (l.tipo === 'Tajeo' || l.tipo === 'Galería')
}
export const FUENTES_SEMANA = LABORES_SEMANA.filter(esFuente)

/** Fuentes del periodo: lo que el STP planea volar en cada guardia abierta, solo si la labor está habilitada. */
export function armarProblema(tareas: Tarea[], habilitacion: Record<string, Habilitacion>, p: ParamMezcla, eco: Economia): Problema {
  const fuentes: FuenteMezcla[] = FUENTES_SEMANA.map((id) => {
    const l = laborDe(id)
    const disp = ABIERTAS.map((q) =>
      estaHabilitada(habilitacion[id], inicioGuardia(q.fecha, q.g)).ok
        ? tareas.filter((t) => t.laborId === id && t.fecha === q.fecha && t.guardia === q.g).reduce((s, t) => s + (tonTarea(t) ?? 0), 0)
        : 0,
    )
    return {
      id,
      nombre: l.nombre,
      tipo: l.tipo === 'Tajeo' ? 'Tajeo' : 'Frente',
      nivel: l.nivel,
      // de los niveles superiores el mineral baja por la chimenea de traspaso directo al echadero del pique; el NV 3750 lo lleva en camión
      ruta: l.nivel > 3750 ? 'chimenea' : 'camion',
      ley: l.ley,
      ...CALIDAD[id],
      disp,
      obligatoria: l.tipo !== 'Tajeo',
    }
  })
  fuentes.push(
    { id: ACOPIO.id, nombre: ACOPIO.nombre, tipo: 'Acopio', nivel: 3750, ruta: 'camion', ley: ACOPIO.ley, ...CALIDAD[ACOPIO.id], disp: ABIERTAS.map((_, i) => (i ? 0 : ACOPIO.t)) },
    { id: 'CARGA', nombre: 'Carga en la chimenea', tipo: 'Chimenea', nivel: 3800, ruta: 'chimenea', ley: p.chimeneaLey, ...CALIDAD.CARGA, disp: ABIERTAS.map((_, i) => (i ? 0 : p.chimeneaIni)), enChimenea: true },
  )
  for (const f of fuentes) if (p.fuera.includes(f.id)) f.disp = f.disp.map(() => 0)
  return {
    periodos: ABIERTAS.map((q) => q.nombre),
    fuentes,
    limites: { plantaMax: p.plantaDia / 2, plantaMin: p.plantaMinDia / 2, leyMin: p.leyMin, leyMax: p.leyMax, durezaMax: p.durezaMax, asMax: p.asMax },
    transporte: {
      pique: capacidadPique(p.tph, p.horas, p.dispPique),
      chimeneaCap: p.chimeneaCap,
      chimeneaSalida: p.chimeneaSalida,
      camiones: capacidadCamiones(p.camiones, p.tViaje, p.viajes),
      costoCamion: p.costoCamion,
      costoPique: p.costoPique,
    },
    objetivo: p.objetivo,
    valorGramo: eco.precio * (eco.recPlanta / 100),
    leyObjetivo: p.leyObjetivo,
  }
}

/** Guardias ya cerradas: lo que el STP reporta como real (mineral de tajeos y frentes con ley), sin inventar. */
export function realCerradas(tareas: Tarea[]) {
  return GUARDIAS.filter((q) => q.estado === 'pasada').map((q) => {
    const ts = tareas.filter((t) => t.fecha === q.fecha && t.guardia === q.g && esFuente(t.laborId))
    const con = ts.flatMap((t) => {
      const v = tonTarea(t, true)
      return v == null ? [] : [{ t: v, ley: laborDe(t.laborId).ley }]
    })
    const tt = con.reduce((s, x) => s + x.t, 0)
    return { ...q, reportado: con.length > 0, t: tt, ley: tt ? con.reduce((s, x) => s + x.t * x.ley, 0) / tt : 0, faltan: ts.length - con.length }
  })
}

export interface PlanAprobado {
  fecha: string
  justificacion: string
  violadas: number
  filas: Record<string, string | number>[]
  t: number
  ley: number
  clave: string
}

export const useMezcla = create<{
  p: ParamMezcla
  aprobado: PlanAprobado | null
  set: (c: Partial<ParamMezcla>) => void
  alternarFuera: (id: string) => void
  aprobar: (a: PlanAprobado) => void
  restablecer: () => void
}>()(
  persist(
    (set) => ({
      p: PARAM_MEZCLA,
      aprobado: null,
      set: (c) => set((s) => ({ p: { ...s.p, ...c } })),
      alternarFuera: (id) => set((s) => ({ p: { ...s.p, fuera: s.p.fuera.includes(id) ? s.p.fuera.filter((x) => x !== id) : [...s.p.fuera, id] } })),
      aprobar: (a) => set({ aprobado: a }),
      restablecer: () => set({ p: PARAM_MEZCLA }),
    }),
    { name: 'codea-planning-ug/mezcla', merge: (g, a) => ({ ...a, ...(g as object), p: { ...PARAM_MEZCLA, ...(g as { p?: ParamMezcla })?.p } }) },
  ),
)
