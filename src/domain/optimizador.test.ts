import { describe, expect, it } from 'vitest'
import { anchoForma, candidatas, corteEquilibrio, optimizarFila, pilarEntre, pilarRecomendado, type Columna } from './optimizador'
import { dilucionELOS, esfuerzoPilar } from './modulos'

const eco = { P: 60, Cv: 0.5, R: 0.9, Cm: 35, Cp: 18, Cg: 7 }

describe('casos de la ficha 05', () => {
  it('ley de corte de equilibrio 1,12 g/t', () => expect(corteEquilibrio(eco)).toBeCloseTo(1.12, 2))
  it('paredes de 400 m² y ELOS 0,5 m a 2,8 t/m³: 1 120 t de dilución', () => expect(dilucionELOS(400, 0.5, 2.8)).toBeCloseTo(1120))
  it('veta de 1,2 m con ancho mínimo 2,0 m: forma de 2,0 m y 0,8 m de dilución', () => {
    const a = anchoForma(1.2, 2)
    expect(a.ancho).toBe(2)
    expect(a.dilucion).toBeCloseTo(0.8)
  })
  it('pilar con σv 12 MPa y e = 0,6: σp 30 MPa; con 45 MPa, FS 1,5', () => {
    const p = esfuerzoPilar(12, 0.6, 45)
    expect(p.sigmaP).toBeCloseTo(30)
    expect(p.fs).toBeCloseTo(1.5)
  })
})

// fila sintética: 5 m por columna, ley variable
const fila = (leyes: number[]): Columna[] => leyes.map((g, i) => ({ x0: i * 5, ancho: 5, tMineral: 362.5, finos: 362.5 * g, tEsteril: 50 }))
const r = { lMin: 10, lMax: 25, pilarMin: 5, corte: 0, costoFijo: 20_000, leyEsteril: 0.3 }

describe('formas por fila', () => {
  const cols = fila([1, 6, 7, 8, 2, 1, 9, 9, 3, 0.5, 5, 6, 7, 1])
  const cands = candidatas('F', cols, eco, r, () => true)

  it('las candidatas respetan largo, corte y valor positivo', () => {
    expect(cands.length).toBeGreaterThan(0)
    for (const c of cands) {
      expect(c.fin - c.inicio).toBeGreaterThanOrEqual(r.lMin)
      expect(c.fin - c.inicio).toBeLessThanOrEqual(r.lMax)
      expect(c.valor).toBeGreaterThan(0)
    }
  })

  it('la programación dinámica da el mismo valor que la fuerza bruta', () => {
    let mejor = 0
    const n = cands.length
    // fuerza bruta por búsqueda en profundidad sobre combinaciones compatibles
    const orden = [...cands].sort((a, b) => a.inicio - b.inicio)
    const dfs = (k: number, finUltimo: number, v: number) => {
      mejor = Math.max(mejor, v)
      for (let i = k; i < n; i++) if (orden[i].inicio >= finUltimo + r.pilarMin) dfs(i + 1, orden[i].fin, v + orden[i].valor)
    }
    dfs(0, -Infinity, 0)
    const dp = optimizarFila(cands, r.pilarMin)
    expect(dp.valor).toBeCloseTo(mejor, 6)
    const fs = [...dp.formas].sort((a, b) => a.inicio - b.inicio)
    fs.slice(1).forEach((f, i) => expect(f.inicio - fs[i].fin).toBeGreaterThanOrEqual(r.pilarMin))
  })

  it('subir la ley de corte nunca sube el valor total', () => {
    let antes = Infinity
    for (const corte of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const v = optimizarFila(candidatas('F', cols, eco, { ...r, corte }, () => true), r.pilarMin).valor
      expect(v).toBeLessThanOrEqual(antes + 1e-6)
      antes = v
    }
  })

  it('no propone formas en tramos ocupados', () => {
    const libres = candidatas('F', cols, eco, r, (a, b) => b <= 20 || a >= 40)
    expect(libres.every((c) => c.fin <= 20 || c.inicio >= 40)).toBe(true)
  })
})

describe('pilares', () => {
  it('FS por área tributaria y ancho recomendado que lo cumple justo', () => {
    const w = pilarRecomendado(40, 8, 60, 1.4)!
    expect(pilarEntre(w, 40, 40, 8, 60).fs).toBeCloseTo(1.4, 6)
    expect(pilarEntre(5, 60, 60, 12, 60).fs).toBeLessThan(1)
    expect(pilarRecomendado(40, 50, 60, 1.4)).toBeNull()
  })
})
