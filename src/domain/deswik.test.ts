import { describe, expect, it } from 'vitest'
import { aCSV, aDXF, aSurpac, leerCSV, leerDXF, validarPlan } from './deswik'

describe('Intercambio Deswik · CSV', () => {
  it('escribe y vuelve a leer comillas, comas y saltos de línea sin perder datos', () => {
    const filas = [{ labor: 'GL-3800', nota: 'dice "ok", sigue\notra línea', plan: 2.7 }]
    expect(leerCSV(aCSV(filas))).toEqual([{ labor: 'GL-3800', nota: 'dice "ok", sigue\notra línea', plan: '2.7' }])
  })

  it('acepta el CSV de Excel en español: separador ; y coma decimal', () => {
    expect(leerCSV('labor;plan\r\nGL-3800;3,1\r\n')).toEqual([{ labor: 'GL-3800', plan: '3,1' }])
  })

  const tareas = [
    { id: 't1', laborId: 'GL-3800', fecha: '2026-11-27', guardia: 'D' as const, plan: 2.7 },
    { id: 't2', laborId: 'GL-3800', fecha: '2026-11-25', guardia: 'D' as const, plan: 2.7 },
    { id: 't3', laborId: 'CX-3800-2', fecha: '2026-11-27', guardia: 'D' as const, plan: 2.7 },
  ]
  const ctx = {
    tareas,
    existe: (id: string) => ['GL-3800', 'CX-3800-2'].includes(id),
    editable: (fecha: string) => fecha >= '2026-11-26',
    habilitada: (id: string) => (id === 'CX-3800-2' ? 'falta ventilación' : null),
  }

  it('valida cada fila del plan importado y solo acepta las que se pueden programar', () => {
    const r = validarPlan(
      [
        { labor: 'GL-3800', fecha: '2026-11-27', guardia: 'D', plan: '3,1' },
        { labor: 'GL-3800', fecha: '2026-11-25', guardia: 'D', plan: '3' },
        { labor: 'XX-1', fecha: '2026-11-27', guardia: 'D', plan: '3' },
        { labor: 'GL-3800', fecha: '2026-11-27', guardia: 'D', plan: '0' },
        { labor: 'CX-3800-2', fecha: '2026-11-27', guardia: 'D', plan: '3' },
        { labor: 'GL-3800', fecha: '2026-11-28', guardia: 'N', plan: '3' },
      ],
      ctx,
    )
    expect(r.cambios).toEqual([{ fila: 2, tareaId: 't1', laborId: 'GL-3800', fecha: '2026-11-27', guardia: 'D', antes: 2.7, despues: 3.1 }])
    expect(r.rechazos.map((x) => [x.fila, x.motivo])).toEqual([
      [3, 'guardia ya ejecutada'],
      [4, 'labor desconocida: XX-1'],
      [5, 'plan debe ser mayor a cero'],
      [6, 'labor no habilitada: falta ventilación'],
      [7, 'sin tarea programada en esa guardia'],
    ])
  })

  it('una fila con el mismo plan no cambia nada ni se rechaza, aunque la guardia ya pasó', () => {
    expect(validarPlan([{ labor: 'GL-3800', fecha: '2026-11-25', guardia: 'D', plan: '2.7' }], ctx)).toEqual({ cambios: [], rechazos: [], error: null })
  })

  it('rechaza un archivo sin las columnas obligatorias', () => {
    expect(validarPlan([{ labor: 'GL-3800', cantidad: '3' }], ctx).error).toBe('Faltan columnas: fecha, guardia, plan')
  })
})

describe('Intercambio Deswik · DXF', () => {
  it('escribe una polilínea 3D por labor, en su capa, con las coordenadas de mina', () => {
    const dxf = aDXF([
      { id: 'GL-3800', tipo: 'Galería', eje: [[-40, -14, 3800], [420, -14, 3800]] },
      { id: 'TJ-3825-04', tipo: 'Tajeo', caja: [40, 95, 3805, 3845], y: 0 },
    ])
    expect(dxf.startsWith('0\nSECTION\n2\nENTITIES')).toBe(true)
    expect(dxf.trimEnd().endsWith('0\nEOF')).toBe(true)
    expect(dxf.match(/\nPOLYLINE\n/g)).toHaveLength(2)
    expect(dxf).toContain('8\nGALERIA\n')
    expect(dxf).toContain('8\nTAJEO\n')
    expect(dxf).toContain('10\n-40\n20\n-14\n30\n3800\n')
    expect(dxf.match(/\nVERTEX\n/g)).toHaveLength(2 + 4)
    expect(dxf).toContain('1\nTJ-3825-04\n')
  })
})

describe('CAD: DXF de ida y vuelta y strings de Surpac', () => {
  it('exportar y volver a importar DXF: geometría sin cambio mayor a 1 mm (ficha 02)', async () => {
    const { ejeDeTramos, esquinasTajeo } = await import('./designer')
    const eje = ejeDeTramos([220.123456, -14.98765, 3750.5], 17, [
      { tipo: 'recta', largo: 33.3333, gradiente: 12 },
      { tipo: 'curva', radio: 15, giro: 135, gradiente: -8 },
    ]).puntos
    const [piso] = esquinasTajeo({ x0: 380, largo: 30, zPiso: 3810, alto: 25, ancho: 8, buzamiento: 65, yCentro: 3 })
    const leidas = leerDXF(aDXF([{ id: 'DL-01', tipo: 'Rampa', eje }, { id: 'DT-01-PISO', tipo: 'Tajeo', eje: piso, cerrada: true }]))
    expect(leidas.map((l) => [l.id, l.capa, l.cerrada])).toEqual([['DL-01', 'RAMPA', false], ['DT-01-PISO', 'TAJEO', true]])
    const err = Math.max(...[eje, piso].flatMap((orig, k) => orig.flatMap((p, i) => p.map((v, j) => Math.abs(v - leidas[k].puntos[i][j])))))
    expect(leidas[0].puntos).toHaveLength(eje.length)
    expect(err).toBeLessThanOrEqual(0.001)
  })
  it('Surpac: Y antes que X, registro nulo por segmento y END al final', () => {
    const t = aSurpac('rampa', '26-Nov-26', [{ numero: 1, desc: 'DL-01, Rampa', segmentos: [[[10, 20, 30], [11, 21, 31]]] }]).split('\r\n')
    expect(t[0]).toBe('rampa, 26-Nov-26, ,CODEa Designer UG,')
    expect(t[1]).toBe('0, 20.000, 10.000, 30.000, 21.000, 11.000, 30.000')
    expect(t[2]).toBe('1, 20.000, 10.000, 30.000, DL-01  Rampa')
    expect(t[4]).toBe('0, 0.000, 0.000, 0.000,')
    expect(t[5]).toBe('0, 0.000, 0.000, 0.000, END')
  })
})
