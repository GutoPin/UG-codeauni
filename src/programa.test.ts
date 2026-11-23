import { describe, expect, it } from 'vitest'
import { calcularPrograma, esParada, isoDe, PARAM_INICIAL } from './programa'
import { ECO_INICIAL, evaluarReservas, METODOS_INICIALES } from './reservas'

const reservas = evaluarReservas({ metodos: METODOS_INICIALES, eco: ECO_INICIAL, asignacion: { 'TJ-3875-01': 'tl', 'TJ-3875-02': 'tl', 'TJ-3875-03': 'tl' } }, [])

describe('programa de mina desde Reserves UG', () => {
  const r = calcularPrograma(PARAM_INICIAL, reservas, [])
  if (!r.ok) throw new Error(r.errores.join())
  const c = (id: string) => r.niv.colocadas[id]
  it('cada tajeo en reserva: preparación → producción (→ relleno en corte y relleno)', () => {
    const n = reservas.tajeos.filter((x) => x.estado === 'Reserva').length
    expect(r.acts.filter((a) => a.tipo === 'Producción')).toHaveLength(n)
    expect(r.acts.filter((a) => a.tipo === 'Relleno')).toHaveLength(reservas.tajeos.filter((x) => x.estado === 'Reserva' && x.metodo.id === 'cyr').length)
    expect(c('PRO-TJ-3825-04').inicio).toBeGreaterThanOrEqual(c('PRE-TJ-3825-04').fin)
  })
  it('el tajeo superior espera al inferior que se le traslapa', () => {
    expect(c('PRO-TJ-3825-04').inicio).toBeGreaterThanOrEqual(c('REL-TJ-3775-07').fin)
  })
  it('el plan mensual suma todo el mineral y nadie trabaja en feriado', () => {
    const t = r.periodos.reduce((s, p) => s + p.t, 0)
    expect(t).toBeCloseTo(r.acts.filter((a) => a.tipo === 'Producción').reduce((s, a) => s + a.t, 0), 3)
    expect(Object.values(r.niv.colocadas).flatMap((x) => x.dias).some(esParada)).toBe(false)
    expect(isoDe(24)).toBe('2026-12-25')
  })
  it('sin scoops: error legible, no excepción', () => {
    const e = calcularPrograma({ ...PARAM_INICIAL, recursos: { ...PARAM_INICIAL.recursos, Scoop: 0 } }, reservas, [])
    expect(e.errores[0]).toMatch(/Scoop.*no tiene unidades/)
  })
})
