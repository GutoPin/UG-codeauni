import highsLoader from 'highs'
import { beforeAll, describe, expect, it } from 'vitest'
import { generarTareas, HABILITACION_INICIAL } from './data/minaPiloto'
import { resolverMezcla, type Solucion } from './domain/mezcla'
import { ABIERTAS, armarProblema, PARAM_MEZCLA, realCerradas } from './mezcla'
import { ECO_INICIAL } from './reservas'

let solve: (lp: string) => Solucion
beforeAll(async () => {
  const h = await highsLoader()
  solve = (lp) => h.solve(lp) as Solucion
})

describe('Blend UG sobre la semana del STP', () => {
  const tareas = generarTareas()
  it('la corrida por defecto es factible, cumple los límites y tiene algún límite de transporte y de calidad activo', () => {
    const p = armarProblema(tareas, HABILITACION_INICIAL, PARAM_MEZCLA, ECO_INICIAL)
    expect(p.periodos).toHaveLength(ABIERTAS.length)
    const r = resolverMezcla(p, solve)
    if (!r.ok) throw new Error(r.errores.join())
    expect(r.elastica).toBe(false)
    for (const q of r.periodos) {
      expect(q.t).toBeLessThanOrEqual(PARAM_MEZCLA.plantaDia / 2 + 1e-6)
      expect(q.as).toBeLessThanOrEqual(PARAM_MEZCLA.asMax + 1e-6)
      if (q.t > 1) expect(q.ley).toBeGreaterThanOrEqual(PARAM_MEZCLA.leyMin - 1e-6)
    }
    const tipos = new Set(r.activas.map((a) => a.tipo))
    expect(['pique', 'camiones', 'chimeneaSalida', 'chimeneaCap', 'plantaMax'].some((t) => tipos.has(t as never))).toBe(true)
    expect(['as', 'leyMin', 'leyMax', 'dureza'].some((t) => tipos.has(t as never))).toBe(true)
  })

  it('una labor no habilitada no aporta fuente; las guardias cerradas muestran solo lo reportado', () => {
    const id = 'TJ-3775-08'
    const p = armarProblema(tareas, { ...HABILITACION_INICIAL, [id]: { ...HABILITACION_INICIAL[id], ventilacionOk: false } }, PARAM_MEZCLA, ECO_INICIAL)
    expect(p.fuentes.find((f) => f.id === id)!.disp.every((x) => x === 0)).toBe(true)
    const sinReal = realCerradas(tareas.map((t) => ({ ...t, real: null })))
    expect(sinReal.every((q) => !q.reportado && q.t === 0)).toBe(true)
  })
})
