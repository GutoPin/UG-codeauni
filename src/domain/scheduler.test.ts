import { describe, expect, it } from 'vitest'
import { cpm } from './modulos'
import { nivelar, porPeriodo, type ActividadRecurso } from './scheduler'

const act = (id: string, dur: number, pred: string[] = [], o: Partial<ActividadRecurso> = {}): ActividadRecurso => ({ id, dur, pred, recurso: 'Jumbo', prioridad: 1, ...o })

describe('Scheduler UG (ficha 04)', () => {
  it('CPM con desfase: B empieza 2 días después de terminar A', () => {
    const r = cpm([act('A', 5), act('B', 3, ['A'], { desfase: { A: 2 } }), act('C', 4, ['A'])])
    expect(r.r.B.es).toBe(7)
    expect(r.fin).toBe(10)
    expect(r.critica).toEqual(['A', 'B'])
    expect(r.r.C.holgura).toBe(1)
  })
  it('ciclo A-B-A: «ciclo detectado entre A y B»', () => {
    expect(() => cpm([act('A', 1, ['B']), act('B', 1, ['A'])])).toThrow(/ciclo detectado entre [AB] y [AB]/)
  })
  it('dos actividades con un mismo jumbo el mismo día: la nivelación mueve la de menor prioridad', () => {
    const n = nivelar([act('A', 3, [], { prioridad: 1 }), act('B', 2, [], { prioridad: 5 })], { Jumbo: 1 })
    expect(n.colocadas.B).toMatchObject({ inicio: 0, fin: 2, retraso: 0 })
    expect(n.colocadas.A).toMatchObject({ inicio: 2, fin: 5, retraso: 2 })
    const dos = nivelar([act('A', 3), act('B', 2)], { Jumbo: 2 })
    expect([dos.colocadas.A.inicio, dos.colocadas.B.inicio]).toEqual([0, 0])
  })
  it('respeta predecesoras y salta las paradas del calendario', () => {
    const n = nivelar([act('A', 2), act('B', 3, ['A'], { recurso: 'Scoop' })], { Jumbo: 1, Scoop: 1 }, (d) => d === 3)
    expect(n.colocadas.B.dias).toEqual([2, 4, 5])
    expect(n.colocadas.B.fin).toBe(6)
  })
  it('un recurso sin unidades se rechaza', () => {
    expect(() => nivelar([act('A', 1)], { Jumbo: 0 })).toThrow(/no tiene unidades/)
  })
  it('plan de 200 actividades nivelado en menos de 1 s, sin pasar la capacidad', () => {
    const acts = Array.from({ length: 200 }, (_, i) => act(`A${i}`, 1 + (i % 7), i % 4 ? [`A${i - 1}`] : [], { recurso: i % 2 ? 'Jumbo' : 'Scoop', prioridad: i % 5 }))
    const t0 = performance.now()
    const n = nivelar(acts, { Jumbo: 2, Scoop: 3 })
    expect(performance.now() - t0).toBeLessThan(1000)
    expect(Math.max(...n.uso.get('Jumbo')!.filter(Boolean))).toBeLessThanOrEqual(2)
    expect(Math.max(...n.uso.get('Scoop')!.filter(Boolean))).toBeLessThanOrEqual(3)
    for (const a of acts) for (const p of a.pred) expect(n.colocadas[a.id].inicio).toBeGreaterThanOrEqual(n.colocadas[p].fin)
  })
  it('prorrateo por días; el tonelaje por destino suma igual que el total del periodo', () => {
    const per = porPeriodo(
      [
        { dias: [0, 1, 2, 3], cantidad: 400, unidad: 't', ley: 5, destino: 'Planta', t: 400 },
        { dias: [2, 3], cantidad: 10, unidad: 'm', ley: 0, destino: 'Desmonte', t: 336 },
      ],
      [
        { nombre: 'P1', desde: 0, hasta: 3 },
        { nombre: 'P2', desde: 3, hasta: 9 },
      ],
    )
    expect(per[0]).toMatchObject({ t: 300, m: 5, ley: 5, finos: 1500 })
    expect(per[1]).toMatchObject({ t: 100, m: 5 })
    for (const p of per) expect(Object.values(p.destinos).reduce((s, v) => s + v, 0)).toBeCloseTo(p.t + (p.destinos.Desmonte ?? 0), 9)
  })
})
