import { describe, expect, it } from 'vitest'
import { congelar, crear, estadoDiseno, guardar, MSG_CONGELADA, nuevaVersion, publicar, ultima } from './versiones'

describe('versiones del diseño', () => {
  const d0 = crear('D1', 'Rampa', { largo: 10 }, '2026-11-26', 'Ingeniero')
  it('guarda sobre el borrador y no crea versión', () => {
    const d = guardar(d0, { largo: 12 }, '2026-11-27')
    expect(typeof d).toBe('object')
    if (typeof d === 'string') return
    expect(d.versiones).toHaveLength(1)
    expect(ultima(d).datos.largo).toBe(12)
  })
  it('una versión congelada no se edita: crear nueva versión', () => {
    const c = congelar(d0, 'Senior', '2026-11-27')
    expect(estadoDiseno(c)).toBe('congelado')
    expect(guardar(c, { largo: 99 }, '2026-11-28')).toBe(MSG_CONGELADA)
    const n = nuevaVersion(c, { largo: 99 }, 'ajuste', '2026-11-28', 'Ingeniero')
    expect(n.versiones.map((v) => v.numero)).toEqual([1, 2])
    expect(n.versiones[0].datos.largo).toBe(10)
    expect(estadoDiseno(n)).toBe('borrador')
  })
  it('solo publica versiones congeladas', () => {
    expect(publicar(d0, 1)).toBe('Solo se publica una versión congelada')
    const p = publicar(congelar(d0, 'Senior', 'x'), 1)
    expect(typeof p !== 'string' && p.publicada).toBe(1)
  })
})
