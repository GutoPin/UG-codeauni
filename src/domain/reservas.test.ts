import { describe, expect, it } from 'vitest'
import { categoriaTajeo, compararReservas, leyCorteDesarrollo, leyCorteMetodo, reservaTajeo, validarMetodo, type FilaVersion, type Metodo } from './reservas'

const CYR: Metodo = { id: 'cyr', nombre: 'Corte y relleno', anchoMin: 1.2, sobre: 0.3, recuperacion: 85, factorPilar: 0, costoMina: 70 }
const ECO = { precio: 65, recPlanta: 90, costoPlanta: 25, costoAdm: 10 }

describe('Reserves UG (ficha 03)', () => {
  it('ley de corte: 105 US$/t / (65 US$/g × 0,90) = 1,79 g/t; desarrollo solo paga planta y administración', () => {
    expect(leyCorteMetodo(CYR, ECO)).toBeCloseTo(1.795, 3)
    expect(leyCorteDesarrollo(ECO)).toBeCloseTo(35 / 58.5, 6)
  })
  it('1 250 t diluidas a 6,4 g/t con 85 % de recuperación: 1 062,5 t y 6 800 g', () => {
    const r = reservaTajeo(1250, 6.4, CYR, 1.79, true)
    expect(r.recuperado).toBeCloseTo(1062.5, 6)
    expect(r.metal).toBeCloseTo(6800, 6)
    expect(r.estado).toBe('Reserva')
  })
  it('pilar del 10 % de 15 660 t: 1 566 t que no se recuperan', () => {
    const r = reservaTajeo(15660, 3, { ...CYR, factorPilar: 10, recuperacion: 100 }, 1.79, true)
    expect(r.pilar).toBeCloseTo(1566, 6)
    expect(r.recuperado).toBeCloseTo(14094, 6)
  })
  it('bajo ley de corte y sin acceso no entran a reservas', () => {
    expect(reservaTajeo(1000, 1.5, CYR, 1.79, true).estado).toBe('Bajo ley de corte')
    expect(reservaTajeo(1000, 9, CYR, 1.79, false).estado).toBe('Sin acceso')
  })
  it('un tajeo que mezcla categorías toma la más baja', () => {
    expect(categoriaTajeo(['Probada', 'Probada'])).toBe('Probada')
    expect(categoriaTajeo(['Probada', 'Probable'])).toBe('Probable')
  })
  it('validaciones: ancho mínimo > 0 y porcentajes de 0 a 100', () => {
    expect(validarMetodo(CYR)).toEqual([])
    expect(validarMetodo({ ...CYR, anchoMin: 0, recuperacion: 120 })).toEqual(['Defina el ancho mínimo', 'La recuperación va de 0 a 100 %'])
  })
})

describe('comparación de versiones de reservas', () => {
  const f = (id: string, o: Partial<FilaVersion> = {}): FilaVersion => ({ id, nombre: id, metodo: 'Corte y relleno', categoria: 'Probada', estado: 'Reserva', t: 1000, metal: 5000, ...o })
  it('explica cada cambio y omite los tajeos que no cambian', () => {
    const c = compararReservas(
      [f('A'), f('B'), f('C'), f('D')],
      [f('A'), f('B', { metodo: 'Taladros largos', t: 1200, metal: 5100 }), f('C', { estado: 'Bajo ley de corte' }), f('E', { t: 300, metal: 900 })],
    )
    expect(c).toEqual([
      { id: 'B', nombre: 'B', dt: 200, dMetal: 100, causa: 'método: Corte y relleno → Taladros largos' },
      { id: 'C', nombre: 'C', dt: -1000, dMetal: -5000, causa: 'Reserva → Bajo ley de corte' },
      { id: 'D', nombre: 'D', dt: -1000, dMetal: -5000, causa: 'Tajeo retirado' },
      { id: 'E', nombre: 'E', dt: 300, dMetal: 900, causa: 'Tajeo nuevo' },
    ])
  })
})
