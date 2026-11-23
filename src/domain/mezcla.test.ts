import highsLoader from 'highs'
import { beforeAll, describe, expect, it } from 'vitest'
import { armarModelo, capacidadCamiones, capacidadPique, filasExportacion, resolverMezcla, type FuenteMezcla, type Problema, type Solucion } from './mezcla'

let solve: (lp: string) => Solucion
beforeAll(async () => {
  const h = await highsLoader()
  solve = (lp) => h.solve(lp) as Solucion
})

const fuente = (id: string, ley: number, t: number[], extra: Partial<FuenteMezcla> = {}): FuenteMezcla => ({
  id, nombre: id, tipo: 'Tajeo', nivel: 3750, ruta: 'camion', ley, dureza: 14, as: 0.2, disp: t, ...extra,
})
const base = (fuentes: FuenteMezcla[], cambios: Partial<Problema> = {}): Problema => ({
  periodos: fuentes[0].disp.map((_, i) => `P${i + 1}`),
  fuentes,
  limites: { plantaMax: 1e5, plantaMin: 0, leyMin: 0, leyMax: 100, durezaMax: 100, asMax: 100 },
  transporte: { pique: 1e5, chimeneaCap: 800, chimeneaSalida: 1e5, camiones: 1e5, costoCamion: 0, costoPique: 0 },
  objetivo: 'valor',
  valorGramo: 58.5,
  leyObjetivo: 6,
  ...cambios,
})
const ok = (r: ReturnType<typeof resolverMezcla>) => {
  if (!r.ok) throw new Error(r.errores.join())
  return r
}

describe('Blend UG: casos de la ficha resueltos con el solver', () => {
  it('400 t a 9,0 g/t y 600 t a 5,0 g/t dan 6,6 g/t', () => {
    const r = ok(resolverMezcla(base([fuente('A', 9, [400]), fuente('B', 5, [600])]), solve))
    expect(r.periodos[0].t).toBeCloseTo(1000)
    expect(r.periodos[0].ley).toBeCloseTo(6.6)
  })

  it('arsénico 0,8 % y 0,2 %: 0,5 % cumple 0,6; con 0,4 y 1 000 t exigidas no hay plan y se nombra el límite', () => {
    const f = [fuente('A', 6, [500], { as: 0.8 }), fuente('B', 6, [500], { as: 0.2 })]
    const r = ok(resolverMezcla(base(f, { limites: { ...base(f).limites, asMax: 0.6 } }), solve))
    expect(r.periodos[0].as).toBeCloseTo(0.5)
    expect(r.elastica).toBe(false)
    const malo = ok(resolverMezcla(base(f, { limites: { ...base(f).limites, asMax: 0.4, plantaMin: 1000 } }), solve))
    expect(malo.elastica).toBe(true)
    expect(malo.violadas.map((v) => v.tipo)).toContain('as')
    expect(malo.activas).toEqual([])
    // el valor informado no lleva la penalización de las holguras
    expect(malo.objetivo).toBeGreaterThan(0)
    expect(malo.objetivo).toBeLessThan(1000 * 6 * 58.5 + 1)
    // sin exigir tonelaje, el solver recorta la fuente con arsénico: 500 t a 0,2 % + 250 t a 0,8 % = 0,4 %
    const recorta = ok(resolverMezcla(base(f, { limites: { ...base(f).limites, asMax: 0.4 } }), solve))
    expect(recorta.periodos[0].aportes.A).toBeCloseTo(250)
  })

  it('pique de 90 t/h, 6 h y 0,85: 459 t por turno; un plan de 600 t baja a 459 t', () => {
    const pique = capacidadPique(90, 6, 0.85)
    expect(pique).toBeCloseTo(459)
    const r = ok(resolverMezcla(base([fuente('A', 6, [600])], { transporte: { ...base([fuente('A', 6, [1])]).transporte, pique } }), solve))
    expect(r.periodos[0].t).toBeCloseTo(459)
    expect(r.activas.some((a) => a.tipo === 'pique')).toBe(true)
  })

  it('camiones de bajo perfil: 4 × 12 t × 10 viajes = 480 t', () => {
    expect(capacidadCamiones(4, 12, 10)).toBe(480)
  })

  it('la chimenea nunca pasa su capacidad: con 700 de 800 t y 100 t de salida, entran como mucho 200 t', () => {
    const f = [
      fuente('carga', 2, [700], { ruta: 'chimenea', enChimenea: true, nivel: 3800 }),
      fuente('A', 9, [300, 0], { ruta: 'chimenea', nivel: 3850 }),
    ]
    f[0].disp = [700, 0]
    const r = ok(resolverMezcla(base(f, { transporte: { ...base(f).transporte, chimeneaSalida: 100 } }), solve))
    const m = armarModelo(base(f))
    expect(m.x.A.length).toBe(2)
    for (const q of r.periodos) expect(q.chimenea).toBeLessThanOrEqual(800 + 1e-6)
    // nivel = 700 + ingreso − salida <= 800 en la primera guardia
    expect(r.periodos[0].chimenea).toBeLessThanOrEqual(800 + 1e-6)
    expect(r.periodos.every((q) => q.t <= 100 + 1e-6)).toBe(true)
  })

  it('una fuente agotada (0 t disponibles) sale del plan', () => {
    const r = ok(resolverMezcla(base([fuente('A', 9, [0, 0]), fuente('B', 5, [300, 300])]), solve))
    expect(r.porFuente.find((x) => x.f.id === 'A')!.planta).toBe(0)
    expect(r.periodos.every((q) => !q.aportes.A)).toBe(true)
  })

  it('lo volado y no llevado espera en el tajeo; el frente se limpia a planta o a desmonte', () => {
    const f = [fuente('A', 9, [500, 0]), fuente('F', 1, [100, 100], { tipo: 'Frente', obligatoria: true })]
    const r = ok(resolverMezcla(base(f, { transporte: { ...base(f).transporte, pique: 300 }, limites: { ...base(f).limites, leyMin: 3 } }), solve))
    expect(r.porFuente.find((x) => x.f.id === 'A')!.planta).toBeCloseTo(500)
    const fr = r.porFuente.find((x) => x.f.id === 'F')!
    expect(fr.planta + fr.desmonte).toBeCloseTo(200)
  })

  it('el costo sombra del pique es lo que gana el objetivo al subirlo una tonelada', () => {
    const f = [fuente('A', 9, [500]), fuente('B', 5, [500])]
    const p = base(f, { transporte: { ...base(f).transporte, pique: 600, costoCamion: 2 } })
    const r = ok(resolverMezcla(p, solve))
    const r1 = ok(resolverMezcla({ ...p, transporte: { ...p.transporte, pique: 601 } }, solve))
    const sombra = r.activas.find((a) => a.tipo === 'pique')!
    expect(sombra.valor).toBeCloseTo(r1.objetivo - r.objetivo, 6)
    expect(sombra.valor).toBeCloseTo(5 * 58.5 - 2, 6)
  })

  it('el costo sombra de un límite de calidad va en USD por unidad del límite', () => {
    const f = [fuente('A', 9, [500], { as: 0.8 }), fuente('B', 5, [500], { as: 0.2 })]
    const p = base(f, { limites: { ...base(f).limites, asMax: 0.4 } })
    const r = ok(resolverMezcla(p, solve))
    const d = 1e-4
    const r1 = ok(resolverMezcla({ ...p, limites: { ...p.limites, asMax: 0.4 + d } }, solve))
    const s = r.activas.find((a) => a.tipo === 'as')!
    expect(s.unidad).toBe('%')
    expect(s.valor * d).toBeCloseTo(r1.objetivo - r.objetivo, 1)
  })

  it('minimizar desvío o costo exige alimentación mínima', () => {
    const p = base([fuente('A', 9, [500])], { objetivo: 'costo' })
    const r = resolverMezcla(p, solve)
    expect(r.ok).toBe(false)
    const r2 = ok(resolverMezcla({ ...p, objetivo: 'desvio', leyObjetivo: 6, limites: { ...p.limites, plantaMin: 400 } }, solve))
    expect(r2.periodos[0].t).toBeGreaterThanOrEqual(400 - 1e-6)
  })

  it('valida límites incoherentes y capacidades nulas', () => {
    const p = base([fuente('A', 9, [500])])
    const r = resolverMezcla({ ...p, limites: { ...p.limites, leyMin: 8, leyMax: 6 }, transporte: { ...p.transporte, pique: 0 } }, solve)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errores).toEqual(expect.arrayContaining(['Límites de ley incoherentes', 'La capacidad del pique debe ser mayor que 0 t']))
  })

  it('31 periodos diarios dan 31 filas exportadas; 20 fuentes por 31 periodos en menos de 60 s', () => {
    const f = Array.from({ length: 20 }, (_, i) =>
      fuente(`F${i}`, 2 + (i % 9), Array.from({ length: 31 }, (_, k) => 50 + ((i * 7 + k * 13) % 60)), { as: 0.1 + (i % 5) * 0.15, ruta: i % 2 ? 'chimenea' : 'camion', nivel: 3800 }),
    )
    const t0 = performance.now()
    const r = ok(resolverMezcla(base(f, { limites: { ...base(f).limites, plantaMax: 900, asMax: 0.4 }, transporte: { ...base(f).transporte, chimeneaSalida: 400 } }), solve))
    expect(performance.now() - t0).toBeLessThan(60_000)
    const filas = filasExportacion(r)
    expect(filas).toHaveLength(31)
    expect(filas.every((x) => x.arsenico_pct <= 0.4 + 1e-3 && x.toneladas_t <= 900)).toBe(true)
  })
})
