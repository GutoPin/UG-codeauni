// Valores tomados de fichas/01_Short_Term_Planner_UG.md (Casos de prueba y Lógica), nunca del propio código.
import { describe, expect, it } from 'vitest'
import {
  aplicarCola,
  arrastrarPendientes,
  avancePorDisparo,
  capacidadEquipo,
  conflictosEquipo,
  cumplimiento,
  disparosPorGuardia,
  estaHabilitada,
  puntajeTarea,
  tonelajeAvance,
} from './stp'

describe('Short-Term Planner UG', () => {
  it('cumplimiento: plan 45 m y real 36 m = 80 %', () => {
    expect(cumplimiento(45, 36)).toBe(80)
  })
  it('cumplimiento sin reporte queda vacío, no 0', () => {
    expect(cumplimiento(45, null)).toBeNull()
  })
  it('avance por disparo: 3,0 m x 0,90 = 2,7 m', () => {
    expect(avancePorDisparo(3.0, 0.9)).toBeCloseTo(2.7, 6)
  })
  it('tonelaje de avance: 18 m2 x 2,7 m x 2,8 t/m3 = 136 t', () => {
    expect(Math.round(tonelajeAvance(18, 2.7, 2.8))).toBe(136)
  })
  it('capacidad de jumbo: 9 h x 12 m/h = 108 m por guardia', () => {
    expect(capacidadEquipo(9, 12)).toBe(108)
  })
  it('disparos por guardia = piso(horas / ciclo)', () => {
    expect(disparosPorGuardia(10, 4.5)).toBe(2)
  })
  it('labor sin ventilación: no se programa', () => {
    const ahora = new Date('2026-11-23T08:00:00')
    expect(
      estaHabilitada({ ventilacionOk: false, sostenimientoOk: true, equipoOk: true, reingresoHasta: null }, ahora).ok,
    ).toBe(false)
    expect(
      estaHabilitada({ ventilacionOk: true, sostenimientoOk: true, equipoOk: true, reingresoHasta: null }, ahora).ok,
    ).toBe(true)
  })
  it('re-ingreso no transcurrido: labor no habilitada', () => {
    const ahora = new Date('2026-11-23T08:00:00')
    const r = estaHabilitada(
      { ventilacionOk: true, sostenimientoOk: true, equipoOk: true, reingresoHasta: '2026-11-23T08:30:00' },
      ahora,
    )
    expect(r.ok).toBe(false)
    expect(r.motivos).toContain('re-ingreso')
  })
  it('equipo en dos tareas a la misma hora: error', () => {
    const c = conflictosEquipo([
      { id: 'a', equipoId: 'J1', inicio: 0, fin: 4 },
      { id: 'b', equipoId: 'J1', inicio: 3, fin: 6 },
      { id: 'c', equipoId: 'J1', inicio: 6, fin: 8 },
      { id: 'd', equipoId: 'S1', inicio: 0, fin: 8 },
    ])
    expect([...c].sort()).toEqual(['a', 'b'])
  })
  it('pendiente de 9 m arrastrado: aparece sumado al siguiente día', () => {
    const r = arrastrarPendientes([{ laborId: 'GA-3900', plan: 45, real: 36, planSiguiente: 40 }])
    expect(r[0]).toEqual({ laborId: 'GA-3900', pendiente: 9, planSiguiente: 49 })
  })
  it('sobrecumplimiento no genera pendiente negativo', () => {
    expect(arrastrarPendientes([{ laborId: 'x', plan: 10, real: 12, planSiguiente: 10 }])[0].pendiente).toBe(0)
  })
  it('puntaje de asignación = prioridad + valor - espera', () => {
    expect(puntajeTarea({ prioridad: 3, valor: 2, espera: 1 }, { prioridad: 10, valor: 5, espera: 2 })).toBe(38)
  })
  it('tarea marcada sin señal: se sincroniza sin duplicarse', () => {
    const cola = [
      { id: 'm1', tareaId: 't1', cantidadReal: 2.7 },
      { id: 'm1', tareaId: 't1', cantidadReal: 2.7 },
      { id: 'm2', tareaId: 't2', cantidadReal: 1.5 },
    ]
    const r = aplicarCola({ t1: 0, t2: 0 }, cola, new Set())
    expect(r.reales).toEqual({ t1: 2.7, t2: 1.5 })
    // reenviar la misma cola no vuelve a sumar
    const r2 = aplicarCola(r.reales, cola, r.aplicadas)
    expect(r2.reales).toEqual({ t1: 2.7, t2: 1.5 })
  })
})

it('lee números en el formato de la pantalla (coma decimal, espacio de miles) y con punto', async () => {
  const { leerNumero } = await import('../derive')
  expect(leerNumero('2,7')).toBe(2.7)
  expect(leerNumero('2.7')).toBe(2.7)
  expect(leerNumero('1 200')).toBe(1200)
  expect(leerNumero('abc')).toBeNaN()
  expect(leerNumero('')).toBeNaN()
})

describe('Asignación sugerida de equipos', () => {
  const equipos = [
    { id: 'JB-01', tipo: 'Jumbo', horasUtiles: 9 },
    { id: 'JB-02', tipo: 'Jumbo', horasUtiles: 9 },
    { id: 'SC-01', tipo: 'Scoop', horasUtiles: 9 },
  ]

  it('resuelve un equipo en dos tareas a la vez con otro equipo libre del mismo tipo, sin tocar lo que ya funciona', async () => {
    const { sugerirAsignacion, conflictosEquipo } = await import('./stp')
    const tareas = [
      { id: 'a', equipoId: 'JB-01', inicio: 0, fin: 3 },
      { id: 'b', equipoId: 'JB-01', inicio: 2, fin: 5 },
      { id: 'c', equipoId: 'SC-01', inicio: 0, fin: 3 },
    ]
    const r = sugerirAsignacion(tareas, equipos)
    expect(r.asignacion).toEqual({ a: 'JB-01', b: 'JB-02', c: 'SC-01' })
    expect(r.cambios).toBe(1)
    expect(r.sinResolver).toEqual([])
    expect(conflictosEquipo(tareas.map((t) => ({ ...t, equipoId: r.asignacion[t.id] }))).size).toBe(0)
  })

  it('no cambia una tarea fija (en curso o cerrada) y nunca cambia el tipo de equipo', async () => {
    const { sugerirAsignacion } = await import('./stp')
    const tareas = [
      { id: 'a', equipoId: 'SC-01', inicio: 0, fin: 3 },
      { id: 'b', equipoId: 'SC-01', inicio: 1, fin: 4 },
    ]
    const r = sugerirAsignacion(tareas, equipos, new Set(['b']))
    expect(r.asignacion.b).toBe('SC-01')
    // no hay otro scoop: queda sin resolver en vez de asignarle un jumbo
    expect(r.asignacion.a).toBe('SC-01')
    expect(r.sinResolver).toEqual(['a'])
  })

  it('criterio de aceptación: recalcula 100 tareas en menos de 5 segundos', async () => {
    const { sugerirAsignacion, arrastrarPendientes } = await import('./stp')
    const muchos = Array.from({ length: 8 }, (_, i) => ({ id: `JB-${i}`, tipo: 'Jumbo', horasUtiles: 9 }))
    const tareas = Array.from({ length: 100 }, (_, i) => ({ id: `t${i}`, equipoId: 'JB-0', inicio: (i * 7) % 160, fin: ((i * 7) % 160) + 3 }))
    const t0 = performance.now()
    arrastrarPendientes(tareas.map((t) => ({ laborId: t.id, plan: 2.7, real: 1.9, planSiguiente: 2.7 })))
    const r = sugerirAsignacion(tareas, muchos)
    expect(performance.now() - t0).toBeLessThan(5000)
    expect(r.sinResolver).toEqual([])
  })
})
