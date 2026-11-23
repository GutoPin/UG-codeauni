// Cálculos derivados del estado para las pantallas. Solo llama a src/domain.
import { AHORA, LABORES, LABORES_SEMANA, SUPERVISORES, type Tarea, type HabilitacionLabor } from './data/minaPiloto'
import { conflictosEquipo, cumplimiento, estaHabilitada } from './domain/stp'

export const laborDe = (id: string) => LABORES.find((l) => l.id === id)!

/**
 * Suma plan/real solo de tareas con reporte: lo no reportado no cuenta como 0.
 * Metros y toneladas no se suman entre sí: el % total pondera el % de cada unidad por su número de tareas.
 */
export function agregado(ts: Tarea[]) {
  const rep = ts.filter((t) => t.real != null)
  const porUnidad = [...Map.groupBy(rep, (t) => t.unidad).values()].map((g) => {
    const plan = g.reduce((s, t) => s + t.plan, 0)
    return { n: g.length, plan, real: g.reduce((s, t) => s + (t.real ?? 0), 0), unidad: g[0].unidad }
  })
  const unica = porUnidad.length === 1 ? porUnidad[0] : null
  const pct = rep.length
    ? porUnidad.reduce((s, u) => s + (cumplimiento(u.plan, u.real) ?? 0) * u.n, 0) / rep.length
    : null
  return { plan: unica?.plan ?? null, real: unica?.real ?? null, unidad: unica?.unidad ?? null, pct, n: ts.length, reportadas: rep.length }
}

export type Nivel = 'bien' | 'alerta' | 'critico' | 'vacio'
export const nivelDe = (pct: number | null): Nivel =>
  pct == null ? 'vacio' : pct >= 90 ? 'bien' : pct >= 70 ? 'alerta' : 'critico'

export function cumplimientoPorLabor(tareas: Tarea[], unidad?: 'm' | 't') {
  return LABORES_SEMANA.map((id) => ({ labor: laborDe(id), ...agregado(tareas.filter((t) => t.laborId === id && (!unidad || t.unidad === unidad))) }))
}

export function cumplimientoPorSupervisor(tareas: Tarea[]) {
  return SUPERVISORES.map((s) => ({
    supervisor: s,
    ...agregado(tareas.filter((t) => laborDe(t.laborId).supervisorId === s.id)),
  }))
}

export function pareto(tareas: Tarea[]) {
  const m = new Map<string, { causa: string; minutos: number; tareas: number }>()
  for (const t of tareas) {
    if (!t.causa) continue
    const x = m.get(t.causa) ?? { causa: t.causa, minutos: 0, tareas: 0 }
    x.minutos += t.minutosPerdidos
    x.tareas++
    m.set(t.causa, x)
  }
  const lista = [...m.values()].sort((a, b) => b.minutos - a.minutos)
  const total = lista.reduce((s, x) => s + x.minutos, 0)
  let acum = 0
  return lista.map((x) => ({ ...x, acumulado: total ? ((acum += x.minutos) / total) * 100 : 0 }))
}

export function alertasHabilitacion(hab: Record<string, HabilitacionLabor>) {
  return LABORES_SEMANA.map((id) => ({ labor: laborDe(id), ...estaHabilitada(hab[id], AHORA), hab: hab[id] })).filter((x) => !x.ok)
}

const HORA = { D: 7, N: 19 }
/** Conflictos de equipo: horas absolutas desde el inicio de la semana. */
export function conflictos(tareas: Tarea[]) {
  return conflictosEquipo(
    tareas.map((t) => {
      const base = (new Date(`${t.fecha}T00:00:00`).getTime() / 3600e3) + HORA[t.guardia]
      return { id: t.id, equipoId: t.equipoId, inicio: base + t.inicio, fin: base + t.fin }
    }),
  )
}

export const fmt = (n: number | null | undefined, d = 0) =>
  n == null ? '—' : // estilo de las fichas (SI): coma decimal y espacio de miles, p. ej. 36 450 t y 2,7 m
  n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

/** Lee un número escrito como lo muestra fmt («2,7», «1 200») o con punto («2.7»); NaN si no es número. */
export const leerNumero = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.') || NaN)
