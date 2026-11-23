import { describe, expect, it } from 'vitest'
import { areaSeccion, crucesEje, ejeDeTramos, evaluarTajeo, interferenciasTajeo, moverVertice, validarTramos, type Tajeo } from './designer'

describe('Designer UG · constructor de labor', () => {
  it('herradura w 4, h_p 3: 18,28 m²; con 0,2 m de sobre-excavación crece', () => {
    const a = areaSeccion({ forma: 'herradura', ancho: 4, alto: 3, sobre: 0.2 })
    expect(a.area).toBeCloseTo(18.28, 2)
    expect(a.conSobre).toBeCloseTo(4.4 * 3 + (Math.PI * 4.4 ** 2) / 8, 6)
  })

  it('curva R 15 m, 180°, 12 %: arco 47,1 m, desnivel 5,65 m y vuelve en sentido contrario', () => {
    const e = ejeDeTramos([0, 0, 3750], 0, [{ tipo: 'curva', radio: 15, giro: 180, gradiente: 12 }])
    expect(e.largoH).toBeCloseTo(47.1, 1)
    expect(e.desnivel).toBeCloseTo(5.65, 2)
    const [x, y] = e.puntos.at(-1)!
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(30, 6)
  })

  it('recta 50 m al 12 %: sube 6 m; V = A × L', () => {
    const e = ejeDeTramos([0, 0, 0], 90, [{ tipo: 'recta', largo: 50, gradiente: 12 }])
    expect(e.desnivel).toBeCloseTo(6, 6)
    expect(e.resumen[0].gradiente).toBeCloseTo(12, 6)
    expect(e.largo3D * 18.28).toBeCloseTo(Math.hypot(50, 6) * 18.28, 6)
  })

  it('reglas: gradiente sobre la máxima y radio bajo el mínimo, con el mensaje de la ficha', () => {
    const r = validarTramos(
      [
        { tipo: 'recta', largo: 40, gradiente: 12 },
        { tipo: 'curva', radio: 10, giro: 90, gradiente: 16 },
      ],
      { gradienteMax: 15, radioMin: 12 },
    )
    expect(r.map((e) => e.msg)).toEqual(['Gradiente fuera de límite en tramo 2', 'Radio de giro insuficiente en tramo 2'])
    expect(validarTramos([], { gradienteMax: 15, radioMin: 12 })[0].msg).toMatch(/al menos 2 vértices/)
  })
})

describe('Designer UG · tajeo paramétrico', () => {
  // veta de un bloque de espesor (5 m) en y = 0, ley 6 g/t
  const veta = Array.from({ length: 20 }, (_, i) => Array.from({ length: 10 }, (_, k) => ({ x: 2.5 + i * 5, y: 0, z: 2.5 + k * 5, ley: 6 }))).flat()
  const o = { densidad: 2.9, densidadEsteril: 2.7, leyEsteril: 0, sobre: 0 }
  const base: Tajeo = { x0: 0, largo: 30, zPiso: 0, alto: 25, ancho: 5, buzamiento: 90, yCentro: 0 }

  it('30 × 8 × 25 a 2,9 t/m³: 6 000 m³ y 17 400 t brutos', () => {
    const r = evaluarTajeo({ ...base, ancho: 8 }, veta, o)
    expect(r.volumen).toBe(6000)
    expect(r.bruto).toBeCloseTo(17400, 6)
  })

  it('tajeo del ancho de la veta: todo mineral, sin dilución', () => {
    const r = evaluarTajeo(base, veta, o)
    expect(r.tMineral).toBeCloseTo(30 * 25 * 5 * 2.9, 6)
    expect(r.leyInSitu).toBeCloseTo(6, 6)
    expect(r.dilucion).toBeCloseTo(0, 6)
  })

  it('más ancho que la veta: el estéril dentro y la sobre-excavación diluyen la ley', () => {
    const r = evaluarTajeo({ ...base, ancho: 8 }, veta, { ...o, sobre: 0.5 })
    const tEst = (3 * 30 * 25 + 0.5 * 2 * 30 * 25) * 2.7
    expect(r.tEsteril).toBeCloseTo(tEst, 6)
    expect(r.leyDiluida).toBeCloseTo((r.finos) / (r.tMineral + tEst), 6)
    expect(r.leyDiluida).toBeLessThan(6)
  })

  it('con buzamiento que no sigue la veta se pierde mineral', () => {
    const r = evaluarTajeo({ ...base, buzamiento: 60 }, veta, o)
    expect(r.tMineral).toBeLessThan(30 * 25 * 5 * 2.9)
  })

  it('interferencias: traslape con otro tajeo y pilar insuficiente con la galería', () => {
    const msgs = interferenciasTajeo(
      { ...base, x0: 40, zPiso: 3804, alto: 30 },
      [{ id: 'TJ', nombre: 'Tajeo 3825-04', caja: [40, 95, 3805, 3845] }],
      [3800, 3850],
      { pilarMin: 3, altoGaleria: 4, limites: [-10, 430, 3735, 3915] },
    )
    expect(msgs).toEqual(['Se traslapa con Tajeo 3825-04', 'Pilar de 2,0 m con la galería del NV 3800; mínimo 3 m'])
  })
})

describe('edición del eje y cruces', () => {
  it('mover vértice: recta toma la proyección, curva el ángulo', () => {
    expect(moverVertice({ tipo: 'recta', largo: 10, gradiente: 0 }, [0, 0, 0], 0, 25.4, 7)).toMatchObject({ largo: 25 })
    // curva a la izquierda R10 desde el origen hacia +x: el centro está en (0, 10); el punto (10, 10) es un giro de 90°
    expect(moverVertice({ tipo: 'curva', radio: 10, giro: 45, gradiente: 0 }, [0, 0, 0], 0, 10, 10)).toMatchObject({ giro: 90 })
    expect(moverVertice({ tipo: 'curva', radio: 10, giro: -45, gradiente: 0 }, [0, 0, 0], 0, 10, -10)).toMatchObject({ giro: -90 })
  })
  const recta = (largo: number, g = 0) => ejeDeTramos([0, 0, 100], 0, [{ tipo: 'recta', largo, gradiente: g }])
  it('cruce a nivel con una galería: propone intersección', () => {
    const e = recta(40)
    const c = crucesEje(e.puntos, e.tramoDe, 2, [{ nombre: 'Galería G', eje: [[20, -30, 100], [20, 30, 100]], r: 2 }], 3)
    expect(c).toHaveLength(1)
    expect(c[0].msg).toBe('Cruza Galería G en tramo 1 (cota 100,0): se propone intersección')
    expect(c[0].grave).toBe(false)
  })
  it('pasa sobre una galería con pilar insuficiente', () => {
    const e = recta(40)
    // galería 6 m más abajo: hueco = 6 − 2 − 2 = 2 m < 3 m
    const c = crucesEje(e.puntos, e.tramoDe, 2, [{ nombre: 'Galería G', eje: [[20, -30, 94], [20, 30, 94]], r: 2 }], 3)
    expect(c[0].msg).toBe('Pilar de 2,0 m con Galería G en tramo 1; mínimo 3 m')
    expect(crucesEje(e.puntos, e.tramoDe, 2, [{ nombre: 'G', eje: [[20, -30, 90], [20, 30, 90]], r: 2 }], 3)).toHaveLength(0)
  })
  it('la rampa en zigzag no se cruza consigo misma; un lazo plano sí', () => {
    const z = ejeDeTramos([0, 0, 0], 0, [
      { tipo: 'recta', largo: 40, gradiente: 12 },
      { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
      { tipo: 'recta', largo: 40, gradiente: 12 },
      { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
      { tipo: 'recta', largo: 40, gradiente: 12 },
    ])
    expect(crucesEje(z.puntos, z.tramoDe, 2.5, [], 3)).toHaveLength(0)
    const lazo = ejeDeTramos([0, 0, 0], 0, [
      { tipo: 'recta', largo: 30, gradiente: 0 },
      { tipo: 'curva', radio: 12, giro: 270, gradiente: 0 },
      { tipo: 'recta', largo: 40, gradiente: 0 },
    ])
    expect(crucesEje(lazo.puntos, lazo.tramoDe, 2.5, [], 3).some((c) => c.msg.startsWith('El eje se cruza consigo mismo entre los tramos 1 y 3'))).toBe(true)
  })
})
