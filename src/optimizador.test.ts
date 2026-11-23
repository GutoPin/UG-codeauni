import { describe, expect, it } from 'vitest'
import { BLOQUES } from './disenos'
import { evaluarTajeo } from './domain/designer'
import { datosDeForma, optimizar, PARAM_OPT } from './optimizador'
import { ECO_INICIAL, METODOS_INICIALES, TAJEOS_MINA } from './reservas'

const correr = (p = PARAM_OPT) => {
  const r = optimizar(p, METODOS_INICIALES, ECO_INICIAL, [])
  if (!r.ok) throw new Error(r.errores.join())
  return r
}

describe('optimizador sobre la mina piloto', () => {
  const r = correr()

  it('propone formas que cumplen ancho, largo y pilar, sin tocar tajeos existentes', () => {
    expect(r.formas.length).toBeGreaterThan(0)
    for (const f of r.formas) {
      expect(r.ancho).toBeGreaterThanOrEqual(METODOS_INICIALES.cyr.anchoMin)
      expect(f.largo).toBeGreaterThanOrEqual(PARAM_OPT.lMin)
      expect(f.largo).toBeLessThanOrEqual(PARAM_OPT.lMax)
      expect(f.ley).toBeGreaterThanOrEqual(r.corte)
      for (const l of TAJEOS_MINA.filter((l) => l.nivel === f.nivel)) expect(f.inicio >= l.caja![1] + PARAM_OPT.pilarMin || f.fin <= l.caja![0] - PARAM_OPT.pilarMin).toBe(true)
    }
    for (const n of [3750, 3800, 3850]) {
      const fs = r.formas.filter((f) => f.nivel === n)
      fs.slice(1).forEach((f, i) => expect(f.inicio - fs[i].fin).toBeGreaterThanOrEqual(PARAM_OPT.pilarMin))
    }
  })

  it('la forma convertida a tajeo de Designer pierde menos de 1 % de tonelaje', () => {
    for (const f of r.formas) {
      const d = datosDeForma(f, PARAM_OPT, r)
      const ev = evaluarTajeo(d.t, BLOQUES, d.ev)
      expect(Math.abs(ev.tDiluido - f.t) / f.t).toBeLessThan(0.01)
    }
  })

  it('sin respetar los tajeos existentes, el valor no baja; con más ancho mínimo, la dilución sube', () => {
    expect(correr({ ...PARAM_OPT, respetar: false }).total.valor).toBeGreaterThanOrEqual(r.total.valor)
    const tl = correr({ ...PARAM_OPT, metodo: 'tl' })
    expect(tl.anchoExtra).toBeCloseTo(1)
    expect(tl.total.dilucion).toBeGreaterThan(r.total.dilucion)
  })

  it('un tajeo publicado en Designer bloquea su tramo, también si cruza la línea de nivel', () => {
    const ev = { densidad: 2.9, densidadEsteril: 2.7, leyEsteril: 0.3, sobre: 0.3, pilarMin: 3, leyCorte: 2 }
    const t = { x0: 380, largo: 40, zPiso: 3840, alto: 30, ancho: 5, buzamiento: 90, yCentro: 0 }
    const d = [{ id: 'DT-X', nombre: 'Tajeo publicado', publicada: 1, versiones: [{ numero: 1, fecha: '', autor: '', congelada: true, comentario: '', datos: { tipo: 'tajeo' as const, ev, t } }] }]
    const x = optimizar(PARAM_OPT, METODOS_INICIALES, ECO_INICIAL, d)
    if (!x.ok) throw new Error(x.errores.join())
    for (const n of [3800, 3850])
      for (const f of x.formas.filter((f) => f.nivel === n)) expect(f.inicio >= t.x0 + t.largo + PARAM_OPT.pilarMin || f.fin <= t.x0 - PARAM_OPT.pilarMin).toBe(true)
    expect(x.formas.some((f) => f.nivel === 3800 && f.fin > 380)).toBe(false)
  })

  it('valida parámetros', () => {
    const e = optimizar({ ...PARAM_OPT, lMin: 70 }, METODOS_INICIALES, ECO_INICIAL, [])
    expect(e.ok).toBe(false)
    expect(e.errores).toContain('El largo mínimo no puede superar al máximo')
    expect(optimizar({ ...PARAM_OPT, venta: 80 }, METODOS_INICIALES, ECO_INICIAL, []).errores[0]).toMatch(/^Error de precio/)
  })
})
