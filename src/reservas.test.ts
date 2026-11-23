import { describe, expect, it } from 'vitest'
import { TAJEO_INICIAL } from './disenos'
import { ECO_INICIAL, evaluarReservas, METODOS_INICIALES } from './reservas'

describe('evaluación de reservas de la mina piloto', () => {
  const p = { metodos: METODOS_INICIALES, eco: ECO_INICIAL, asignacion: {} as Record<string, string> }
  const r = evaluarReservas(p, [])
  it('evalúa los 8 tajeos y la agregación suma lo que está en reserva', () => {
    expect(r.tajeos).toHaveLength(8)
    const enReserva = r.tajeos.filter((x) => x.estado === 'Reserva')
    expect(r.agregado.reduce((s, g) => s + g.t, 0)).toBeCloseTo(enReserva.reduce((s, x) => s + x.recuperado, 0), 6)
  })
  it('un ancho mínimo mayor que la veta diluye: taladros largos (6 m) contra corte y relleno (3 m) sobre 5 m de veta', () => {
    const tl = evaluarReservas({ ...p, asignacion: { 'TJ-3825-04': 'tl' } }, []).tajeos.find((x) => x.id === 'TJ-3825-04')!
    const cyr = r.tajeos.find((x) => x.id === 'TJ-3825-04')!
    expect(cyr.ancho).toBe(5)
    expect(tl.ancho).toBe(6)
    expect(tl.ev.dilucion).toBeGreaterThan(cyr.ev.dilucion)
  })
  it('un tajeo publicado por Designer entra con su versión; uno sin galería bajo el piso queda sin acceso', () => {
    const v = (t = TAJEO_INICIAL.t) => ({ numero: 2, fecha: '', autor: '', congelada: true, comentario: '', datos: { ...TAJEO_INICIAL, t } })
    const ds = [
      { id: 'DT-01', nombre: 'Tajeo nuevo', versiones: [v()], publicada: 2 },
      { id: 'DT-02', nombre: 'Tajeo colgado', versiones: [v({ ...TAJEO_INICIAL.t, zPiso: 3825 })], publicada: 2 },
      { id: 'DT-03', nombre: 'Borrador', versiones: [v()], publicada: null },
    ]
    const x = evaluarReservas(p, ds).tajeos.slice(8)
    expect(x.map((t) => [t.id, t.origen, t.nivel, t.estado === 'Sin acceso'])).toEqual([
      ['DT-01', 'Designer v2', 3800, false],
      ['DT-02', 'Designer v2', 3800, true],
    ])
  })
})
