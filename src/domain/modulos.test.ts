// Casos de prueba de fichas/02..07 con los valores de la ficha.
import { describe, expect, it } from 'vitest'
import * as m from './modulos'

describe('Designer UG', () => {
  it('rampa de 100 m con 12 %: desnivel 12 m; con máxima 10 % da error', () => {
    expect(m.desnivelRampa(100, 12, 15)).toBe(12)
    expect(() => m.desnivelRampa(100, 12, 10)).toThrow()
  })
  it('curva R 15 m, 180°, 12 %: arco 47,1 m y desnivel 5,65 m', () => {
    const c = m.curvaRampa(15, 180, 12)
    expect(c.arco).toBeCloseTo(47.1, 1)
    expect(c.desnivel).toBeCloseTo(5.65, 2)
  })
  it('herradura w 4, h_p 3: 18,28 m2', () => expect(m.areaHerradura(4, 3)).toBeCloseTo(18.28, 2))
  it('gradiente: 6 m en 50 m = 12 %', () => expect(m.gradiente(6, 50)).toBeCloseTo(12, 6))
  it('bloque 5x5x5 con 60 % y 2,8: 210 t', () => expect(m.tonelajeBloque(5, 5, 5, 0.6, 2.8)).toBeCloseTo(210, 6))
  it('tajeo 30x8x25 a 2,9: 17 400 t', () => expect(m.tonelajeTajeo(30, 8, 25, 2.9)).toBeCloseTo(17400, 6))
  it('galerías a 5 m, sección 4 m, pilar 3 m: interferencia', () =>
    expect(m.hayInterferencia(5, 4, 4, 3)).toBe(true))
})

describe('Reserves UG', () => {
  it('veta 0,6 con mínimo 1,2: ancho 1,2 y dilución 100 %', () => {
    const a = m.anchoMinado(0.6, 1.2)
    expect(a).toBe(1.2)
    expect(m.dilucionPlanificada(a, 0.6)).toBeCloseTo(100, 6)
  })
  it('1 000 t a 8,0 g/t con 25 % a 0 g/t: 1 250 t a 6,4 g/t', () => {
    const d = m.mineralDiluido(1000, 8, 25, 0)
    expect(d.t).toBe(1250)
    expect(d.ley).toBeCloseTo(6.4, 6)
  })
  it('1 250 t con 85 %: 1 062,5 t', () => expect(m.mineralRecuperado(1250, 85)).toBeCloseTo(1062.5, 6))
  it('ley de corte 105 / (65 x 0,90) = 1,79 g/t; 1,5 g/t no entra', () => {
    const lc = m.leyCorte(105, 65, 0.9)
    expect(lc).toBeCloseTo(1.79, 2)
    expect(1.5 >= lc).toBe(false)
  })
  it('pilar 10 % de 15 660 t: 1 566 dejadas y 14 094 evaluables', () => {
    const p = m.pilar(15660, 10)
    expect(p.dejado).toBeCloseTo(1566, 6)
    expect(p.evaluable).toBeCloseTo(14094, 6)
  })
})

describe('Scheduler UG', () => {
  it('galería de 120 m a 4,5 m/día con 0,85: 31,4 días', () =>
    expect(m.duracion(120, 4.5, 0.85)).toBeCloseTo(31.4, 1))
  it('red A(5) B(3) C(4) D(2): ruta A-C-D de 11 días, holgura B = 1', () => {
    const r = m.cpm([
      { id: 'A', dur: 5, pred: [] },
      { id: 'B', dur: 3, pred: ['A'] },
      { id: 'C', dur: 4, pred: ['A'] },
      { id: 'D', dur: 2, pred: ['B', 'C'] },
    ])
    expect(r.fin).toBe(11)
    expect(r.critica).toEqual(['A', 'C', 'D'])
    expect(r.r.B.holgura).toBe(1)
  })
  it('dependencia circular A-B-A: se rechaza', () =>
    expect(() =>
      m.cpm([
        { id: 'A', dur: 1, pred: ['B'] },
        { id: 'B', dur: 1, pred: ['A'] },
      ]),
    ).toThrow(/circular/))
})

describe('Stope Optimizer', () => {
  it('ley de corte de equilibrio: 1,12 g/t', () =>
    expect(m.leyCorteEquilibrio(35, 18, 7, 60, 0.5, 0.9)).toBeCloseTo(1.12, 2))
  it('paredes 400 m2, ELOS 0,5, 2,8 t/m3: 1 120 t', () => expect(m.dilucionELOS(400, 0.5, 2.8)).toBeCloseTo(1120, 6))
  it('veta 1,2 con mínimo 2,0: forma de 2,0 y dilución por 0,8', () => {
    const a = m.anchoMinado(1.2, 2.0)
    expect(a).toBe(2)
    expect(a - 1.2).toBeCloseTo(0.8, 6)
  })
  it('DP 10/8/12 con 1-2 traslapadas: elige 1 y 3 con 22', () => {
    const r = m.seleccionarFormas([
      { id: '1', inicio: 0, fin: 10, valor: 10 },
      { id: '2', inicio: 5, fin: 15, valor: 8 },
      { id: '3', inicio: 20, fin: 30, valor: 12 },
    ])
    expect(r.valor).toBe(22)
    expect(r.formas.map((f) => f.id)).toEqual(['1', '3'])
  })
  it('pilar σv 12 MPa, e 0,6: σp 30 MPa; resistencia 45: FS 1,5', () => {
    const p = m.esfuerzoPilar(12, 0.6, 45)
    expect(p.sigmaP).toBeCloseTo(30, 6)
    expect(p.fs).toBeCloseTo(1.5, 6)
  })
})

describe('Blend UG', () => {
  it('400 t a 9,0 y 600 t a 5,0: 6,6 g/t', () =>
    expect(m.ponderado([{ t: 400, v: 9 }, { t: 600, v: 5 }])).toBeCloseTo(6.6, 6))
  it('500 t a 0,8 % As y 500 t a 0,2 %: 0,5 %', () =>
    expect(m.ponderado([{ t: 500, v: 0.8 }, { t: 500, v: 0.2 }])).toBeCloseTo(0.5, 6))
  it('dureza 600 t a 14 y 400 t a 17: 15,2 kWh/t', () =>
    expect(m.ponderado([{ t: 600, v: 14 }, { t: 400, v: 17 }])).toBeCloseTo(15.2, 6))
  it('pique 90 t/h, 6 h, 0,85: 459 t', () => expect(m.capacidadPique(90, 6, 0.85)).toBeCloseTo(459, 6))
  it('460 t con camiones de 12 t y 10 viajes: 4 camiones', () => expect(m.camionesNecesarios(460, 12, 10)).toBe(4))
  it('chimenea 800 t, nivel 700, ingreso 300 sin extracción: 100 t', () =>
    expect(m.ingresoChimenea(800, 700, 300, 0)).toBe(100))
})

describe('Cave Planner', () => {
  it('columna 60x15x15 a 2,7: 36 450 t; dilución al 70 % = 25 515 t', () => {
    const t = m.tonelajeColumna(60, 15, 15, 2.7)
    expect(t).toBeCloseTo(36450, 6)
    expect(t * 0.7).toBeCloseTo(25515, 6)
  })
  it('huella 200 x 200: radio hidráulico 50 m', () => expect(m.radioHidraulico(200, 200)).toBe(50))
})
