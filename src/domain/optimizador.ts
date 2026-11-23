// Stope Optimizer (ficha 05): formas candidatas por fila, selección sin traslape por programación dinámica, pilares.
import { esfuerzoPilar, leyCorteEquilibrio, seleccionarFormas } from './modulos'

/** Una franja de 5 m a lo largo del rumbo dentro de una fila: lo que aporta a cualquier forma que la cubra. */
export interface Columna {
  /** borde inicial (m); la columna va de x0 a x0 + ancho */
  x0: number
  ancho: number
  tMineral: number
  finos: number
  /** estéril dentro del sólido + sobre-excavación (ELOS) de las dos paredes */
  tEsteril: number
}

export interface Economia {
  /** precio (USD/g) */
  P: number
  /** costo de venta (USD/g) */
  Cv: number
  /** recuperación de planta (0–1) */
  R: number
  /** costos por tonelada: mina, planta, administración (USD/t) */
  Cm: number
  Cp: number
  Cg: number
}
export interface Restricciones {
  lMin: number
  lMax: number
  pilarMin: number
  /** ley de corte aplicada a la ley diluida de la forma (g/t) */
  corte: number
  /** costo fijo de desarrollo por forma: metros de acceso × costo por metro */
  costoFijo: number
  leyEsteril: number
}

export interface FormaCandidata {
  id: string
  inicio: number
  fin: number
  tMineral: number
  tEsteril: number
  t: number
  ley: number
  finos: number
  valor: number
}

export const corteEquilibrio = (e: Economia) => leyCorteEquilibrio(e.Cm, e.Cp, e.Cg, e.P, e.Cv, e.R)

/** Valor = t × (g × R × (P − Cv) − Cp − Cg − Cm) − costo fijo de desarrollo (ficha 05). */
export const valorForma = (t: number, ley: number, e: Economia, costoFijo: number) => t * (ley * e.R * (e.P - e.Cv) - e.Cp - e.Cg - e.Cm) - costoFijo

/** Ancho de minado: si la veta es más angosta que el mínimo, la forma toma el mínimo y la diferencia es dilución. */
export const anchoForma = (potencia: number, anchoMin: number) => ({ ancho: Math.max(potencia, anchoMin), dilucion: Math.max(0, anchoMin - potencia) })

/**
 * Formas de una fila: cada inicio y largo entre L mín y L máx (en columnas enteras), con ley diluida ≥ corte y valor > 0.
 * `libre` dice si el tramo [inicio, fin] se puede minar (sin tajeos existentes cerca y con acceso).
 */
export function candidatas(fila: string, cols: Columna[], e: Economia, r: Restricciones, libre: (inicio: number, fin: number) => boolean) {
  const out: FormaCandidata[] = []
  for (let i = 0; i < cols.length; i++) {
    let tm = 0
    let te = 0
    let fi = 0
    for (let j = i; j < cols.length; j++) {
      tm += cols[j].tMineral
      te += cols[j].tEsteril
      fi += cols[j].finos
      const inicio = cols[i].x0
      const fin = cols[j].x0 + cols[j].ancho
      const largo = fin - inicio
      if (largo > r.lMax + 1e-9) break
      if (largo < r.lMin - 1e-9) continue
      const t = tm + te
      const finos = fi + te * r.leyEsteril
      const ley = t ? finos / t : 0
      if (ley < r.corte) continue
      const valor = valorForma(t, ley, e, r.costoFijo)
      if (valor <= 0 || !libre(inicio, fin)) continue
      out.push({ id: `${fila}:${inicio}:${fin}`, inicio, fin, tMineral: tm, tEsteril: te, t, ley, finos, valor })
    }
  }
  return out
}

/** Mejor combinación sin traslape y con pilar mínimo en una fila (programación dinámica exacta por fila). */
export const optimizarFila = (cands: FormaCandidata[], pilarMin: number) => {
  const r = seleccionarFormas(cands, pilarMin)
  return { valor: r.valor, formas: r.formas as FormaCandidata[] }
}

/**
 * Pilar entre dos tajeos de la misma fila por área tributaria: e = (La + Lb)/2 / ((La + Lb)/2 + w);
 * σp = σv / (1 − e); FS = resistencia / σp.
 */
export function pilarEntre(w: number, la: number, lb: number, sigmaV: number, resistencia: number) {
  const tramo = (la + lb) / 2
  const e = tramo / (tramo + w)
  return { e, ...esfuerzoPilar(sigmaV, e, resistencia) }
}

/** Ancho mínimo de pilar entre dos tajeos de largo L para cumplir el FS exigido; null si ningún ancho alcanza. */
export function pilarRecomendado(L: number, sigmaV: number, resistencia: number, fsMin: number) {
  const k = (sigmaV * fsMin) / resistencia
  return k >= 1 ? null : (L * k) / (1 - k)
}

/** σv = densidad × g × profundidad (MPa). */
export const sigmaV = (densidad: number, profundidad: number) => (densidad * 9.81 * profundidad) / 1000
