import { describe, expect, it } from 'vitest'
import { armar, indicadores, puntaje, reoptimizar, type Variable } from './reoptimizar'

const metas = { t: 3000, m: 40, ley: 6.5 }
const fijo = { t: 1000, m: 12, tLey: 1000 * 5 }
const pesos = { produccion: 10, desarrollo: 10, ley: 10, balance: 2 }

// 4 guardias futuras: dos tajeos por scoop (ley baja y alta) y dos frentes por jumbo
function semana(): Variable[] {
  const v: Variable[] = []
  for (let g = 0; g < 4; g++) {
    ;[['SC-01', 3.2], ['SC-01', 8.6], ['SC-02', 4.8], ['SC-02', 9.2]].forEach(([eq, ley], k) =>
      v.push({ id: `t${g}${k}`, grupo: `${g}t`, equipoId: eq as string, unidad: 't', ley: ley as number, plan: 200, min: 100, max: 300, paso: 10 }),
    )
    ;['JB-01', 'JB-02'].forEach((eq, k) => v.push({ id: `m${g}${k}`, grupo: `${g}m`, equipoId: eq, unidad: 'm', ley: 0, plan: 2.7, min: 2.7, max: 5.4, paso: 2.7 }))
  }
  return v
}

describe('Reoptimización con objetivos múltiples', () => {
  it('nunca empeora el puntaje y respeta límites y pasos', () => {
    const vars = semana()
    const r = reoptimizar(vars, fijo, metas, pesos)
    expect(puntaje(r.despues, pesos)).toBeLessThan(puntaje(r.antes, pesos))
    r.plan.forEach((p, i) => {
      expect(p).toBeGreaterThanOrEqual(vars[i].min)
      expect(p).toBeLessThanOrEqual(vars[i].max)
      const k = (p - vars[i].plan) / vars[i].paso
      expect(Math.abs(k - Math.round(k))).toBeLessThan(1e-6)
    })
  })

  it('con peso solo en un objetivo, ese objetivo mejora', () => {
    const cero = { produccion: 0, desarrollo: 0, ley: 0, balance: 0 }
    for (const k of ['produccion', 'desarrollo', 'ley'] as const) {
      const r = reoptimizar(semana(), fijo, metas, { ...cero, [k]: 1 })
      expect(Math.abs(r.despues[k])).toBeLessThan(Math.abs(r.antes[k]))
    }
    // ley 6,5 pedida con mezcla actual ~6,3: pasa toneladas a los tajeos de ley alta
    const r = reoptimizar(semana(), fijo, metas, { ...cero, ley: 1 })
    expect(r.despues.leyMezcla).toBeCloseTo(6.5, 1)
  })

  it('una tarea con min = max no se mueve', () => {
    const vars = semana().map((v) => (v.unidad === 't' && v.ley > 9 ? { ...v, min: 200, max: 200 } : v))
    const r = reoptimizar(vars, fijo, metas, pesos)
    vars.forEach((v, i) => v.min === v.max && expect(r.plan[i]).toBe(200))
  })

  it('es determinista', () => {
    expect(reoptimizar(semana(), fijo, metas, pesos).plan).toEqual(reoptimizar(semana(), fijo, metas, pesos).plan)
  })

  it('el balance mide la diferencia de carga entre equipos del mismo grupo', () => {
    const v = semana().slice(0, 4)
    expect(indicadores(v, [200, 200, 200, 200], fijo, metas).balance).toBe(0)
    expect(indicadores(v, [300, 300, 100, 100], fijo, metas).balance).toBeCloseTo(0.5)
  })

  it('armar: futuras son variables, pasadas sin reporte no cuentan, no habilitadas quedan fijas', () => {
    const base = { equipoId: 'SC-01', unidad: 't' as const, laborId: 'TJ', guardia: 'D' as const }
    const { vars, fijo: f } = armar(
      [
        { ...base, id: 'a', fecha: 'pasada', plan: 200, real: 150 },
        { ...base, id: 'b', fecha: 'pasada', plan: 200, real: null },
        { ...base, id: 'c', fecha: 'actual', plan: 200, real: 70 },
        { ...base, id: 'd', fecha: 'futura', plan: 200, real: null, arrastre: 50 },
        { ...base, id: 'e', fecha: 'futura', plan: 200, real: null, laborId: 'NO' },
      ],
      { estado: (f) => f as 'pasada', ley: () => 5, disparo: () => 2.7, habilitada: (l) => l !== 'NO' },
    )
    expect(f).toEqual({ t: 350, m: 0, tLey: 1750 })
    expect(vars.map((v) => [v.id, v.min, v.max])).toEqual([['d', 100, 300], ['e', 200, 200]])
  })

  it('criterio de aceptación: 100 tareas en menos de 5 s', () => {
    const vars = Array.from({ length: 25 }, () => semana()).flat().slice(0, 100).map((v, i) => ({ ...v, id: `x${i}`, grupo: `${Math.floor(i / 6)}${v.unidad}` }))
    const t0 = performance.now()
    reoptimizar(vars, { t: 0, m: 0, tLey: 0 }, { t: 22000, m: 120, ley: 6.5 }, pesos)
    expect(performance.now() - t0).toBeLessThan(5000)
  })
})
