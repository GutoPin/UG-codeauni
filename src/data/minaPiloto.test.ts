import { expect, it } from 'vitest'
import { conflictos } from '../derive'
import { generarTareas } from './minaPiloto'

it('la mina piloto solo trae el conflicto de equipo de demostración (JB-01 en tres frentes el viernes, guardia día)', () => {
  const ts = generarTareas()
  const c = conflictos(ts)
  expect(c.size).toBe(3)
  expect(ts.filter((t) => c.has(t.id)).every((t) => t.fecha === '2026-11-27' && t.guardia === 'D')).toBe(true)
})
