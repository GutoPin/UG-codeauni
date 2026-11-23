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

  it('valida parámetros', () => {
    const e = optimizar({ ...PARAM_OPT, lMin: 70 }, METODOS_INICIALES, ECO_INICIAL, [])
    expect(e.ok).toBe(false)
    expect(e.errores).toContain('El largo mínimo no puede superar al máximo')
    expect(optimizar({ ...PARAM_OPT, venta: 80 }, METODOS_INICIALES, ECO_INICIAL, []).errores[0]).toMatch(/^Error de precio/)
  })
})
