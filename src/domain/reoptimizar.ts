// Reoptimización con objetivos múltiples (ficha 01): minimizar desvío de producción y de desarrollo, cumplir la ley
// objetivo y balancear equipos. Las variables son el plan de cada tarea futura; equipo, horas y labor no cambian
// (eso es la pantalla de Asignación).
// shortcut: búsqueda local voraz sobre una suma ponderada, no un óptimo de Pareto; cambiar por un solver (MILP)
// cuando haya costos y capacidades reales de la operación.

export interface Variable {
  id: string
  /** grupo de balance: misma guardia y mismo tipo de equipo */
  grupo: string
  equipoId: string
  unidad: 'm' | 't'
  /** g/t; solo cuenta para la mezcla si unidad = 't' */
  ley: number
  plan: number
  min: number
  max: number
  /** el plan se mueve en múltiplos de este paso desde su valor actual */
  paso: number
}

/** Lo ya ejecutado o comprometido (guardias pasadas y la actual): no se mueve, pero cuenta para las metas. */
export interface Fijo {
  t: number
  m: number
  /** toneladas × ley de lo fijo */
  tLey: number
}

export interface Metas {
  t: number
  m: number
  ley: number
}

export interface Pesos {
  produccion: number
  desarrollo: number
  ley: number
  balance: number
}

/** Desvíos relativos con signo (0 = en la meta); balance = coeficiente de variación medio entre equipos de un grupo. */
export interface Indicadores {
  produccion: number
  desarrollo: number
  ley: number
  balance: number
  t: number
  m: number
  leyMezcla: number
}

export function indicadores(vars: Variable[], plan: number[], fijo: Fijo, metas: Metas): Indicadores {
  let t = fijo.t
  let m = fijo.m
  let tLey = fijo.tLey
  const cargas = new Map<string, Map<string, number>>()
  vars.forEach((v, i) => {
    if (v.unidad === 't') (t += plan[i]), (tLey += plan[i] * v.ley)
    else m += plan[i]
    const g = cargas.get(v.grupo) ?? cargas.set(v.grupo, new Map()).get(v.grupo)!
    g.set(v.equipoId, (g.get(v.equipoId) ?? 0) + plan[i])
  })
  let cv = 0
  let n = 0
  for (const g of cargas.values()) {
    if (g.size < 2) continue
    const xs = [...g.values()]
    const media = xs.reduce((s, x) => s + x, 0) / xs.length
    cv += Math.sqrt(xs.reduce((s, x) => s + (x - media) ** 2, 0) / xs.length) / media
    n++
  }
  const leyMezcla = t ? tLey / t : 0
  return {
    produccion: (t - metas.t) / metas.t,
    desarrollo: (m - metas.m) / metas.m,
    ley: (leyMezcla - metas.ley) / metas.ley,
    balance: n ? cv / n : 0,
    t,
    m,
    leyMezcla,
  }
}

export const puntaje = (x: Indicadores, p: Pesos) =>
  p.produccion * x.produccion ** 2 + p.desarrollo * x.desarrollo ** 2 + p.ley * x.ley ** 2 + p.balance * x.balance ** 2

const cvDe = (xs: number[]) => {
  const media = xs.reduce((s, x) => s + x, 0) / xs.length
  return media ? Math.sqrt(xs.reduce((s, x) => s + (x - media) ** 2, 0) / xs.length) / media : 0
}

/**
 * Mejora el puntaje moviendo un paso una tarea, o pasando un paso de toneladas de un tajeo a otro (cambia la ley de
 * la mezcla sin cambiar la producción). Toma siempre la mejor jugada; termina cuando ninguna mejora.
 * Evalúa cada jugada de forma incremental (totales + solo los grupos tocados) para cumplir 100 tareas en < 5 s.
 */
export function reoptimizar(vars: Variable[], fijo: Fijo, metas: Metas, pesos: Pesos, maxIter = 400) {
  const plan = vars.map((v) => v.plan)
  // índices de grupo y de equipo dentro del grupo
  const grupos = [...new Set(vars.map((v) => v.grupo))]
  const eqs = grupos.map((g) => [...new Set(vars.filter((v) => v.grupo === g).map((v) => v.equipoId))])
  const gi = vars.map((v) => grupos.indexOf(v.grupo))
  const ei = vars.map((v, i) => eqs[gi[i]].indexOf(v.equipoId))
  const carga = eqs.map((e) => e.map(() => 0))
  vars.forEach((_, i) => (carga[gi[i]][ei[i]] += plan[i]))
  const cv = carga.map((c) => (c.length > 1 ? cvDe(c) : 0))
  const nBal = carga.filter((c) => c.length > 1).length
  let t = fijo.t
  let m = fijo.m
  let tLey = fijo.tLey
  vars.forEach((v, i) => (v.unidad === 't' ? ((t += plan[i]), (tLey += plan[i] * v.ley)) : (m += plan[i])))
  let sumCv = cv.reduce((s, x) => s + x, 0)

  const costo = (T: number, M: number, TL: number, S: number) => {
    const ley = T ? TL / T : 0
    return (
      pesos.produccion * ((T - metas.t) / metas.t) ** 2 +
      pesos.desarrollo * ((M - metas.m) / metas.m) ** 2 +
      pesos.ley * ((ley - metas.ley) / metas.ley) ** 2 +
      pesos.balance * (nBal ? S / nBal : 0) ** 2
    )
  }
  // aplica (o deshace con signo -1) una jugada sobre los totales; devuelve la suma de CV resultante
  const mover = (movs: [number, number][]) => {
    const tocados = new Set<number>()
    for (const [i, d] of movs) {
      plan[i] += d
      carga[gi[i]][ei[i]] += d
      if (vars[i].unidad === 't') (t += d), (tLey += d * vars[i].ley)
      else m += d
      tocados.add(gi[i])
    }
    for (const g of tocados) {
      if (carga[g].length < 2) continue
      const nuevo = cvDe(carga[g])
      sumCv += nuevo - cv[g]
      cv[g] = nuevo
    }
  }
  const cabe = (i: number, d: number) => plan[i] + d >= vars[i].min - 1e-9 && plan[i] + d <= vars[i].max + 1e-9
  const libres = vars.map((_, i) => i).filter((i) => vars[i].max - vars[i].min >= vars[i].paso - 1e-9)
  const tajeos = libres.filter((i) => vars[i].unidad === 't')

  let actual = costo(t, m, tLey, sumCv)
  for (let it = 0; it < maxIter; it++) {
    let mejor = actual - 1e-12
    let jugada: [number, number][] | null = null
    const probar = (movs: [number, number][]) => {
      mover(movs)
      const c = costo(t, m, tLey, sumCv)
      mover(movs.map(([i, d]) => [i, -d]))
      if (c < mejor) (mejor = c), (jugada = movs)
    }
    for (const i of libres) for (const d of [vars[i].paso, -vars[i].paso]) if (cabe(i, d)) probar([[i, d]])
    for (const i of tajeos)
      for (const j of tajeos) {
        const d = Math.min(vars[i].paso, vars[j].paso)
        if (i !== j && cabe(i, d) && cabe(j, -d)) probar([[i, d], [j, -d]])
      }
    if (!jugada) break
    mover(jugada)
    actual = mejor
  }
  const final = plan.map((p) => +p.toFixed(3))
  return {
    plan: final,
    antes: indicadores(vars, vars.map((v) => v.plan), fijo, metas),
    despues: indicadores(vars, final, fijo, metas),
  }
}

type TareaLike = {
  id: string
  laborId: string
  fecha: string
  guardia: 'D' | 'N'
  unidad: 'm' | 't'
  plan: number
  real: number | null
  equipoId: string
  arrastre?: number
}

/** Pasa el programa a variables: guardias futuras se mueven; pasadas (con reporte) y la actual quedan fijas. */
export function armar(
  tareas: TareaLike[],
  o: {
    estado: (fecha: string, g: 'D' | 'N') => 'pasada' | 'actual' | 'futura'
    ley: (laborId: string) => number
    /** avance de un disparo en la labor (m) */
    disparo: (laborId: string) => number
    /** habilitada al inicio de esa guardia */
    habilitada: (laborId: string, fecha: string, g: 'D' | 'N') => boolean
  },
) {
  const fijo: Fijo = { t: 0, m: 0, tLey: 0 }
  const vars: Variable[] = []
  for (const x of tareas) {
    const e = o.estado(x.fecha, x.guardia)
    if (e !== 'futura') {
      // una guardia pasada sin reporte no se cuenta: ni como cero ni como plan
      const q = e === 'pasada' ? x.real : x.plan
      if (q == null) continue
      if (x.unidad === 't') (fijo.t += q), (fijo.tLey += q * o.ley(x.laborId))
      else fijo.m += q
      continue
    }
    const arr = x.arrastre ?? 0
    // shortcut: límites por tarea fijos (desarrollo 1–2 disparos, tajeo 100–300 t) porque los rendimientos de la mina
    // piloto no cuadran con su plan (ver QUESTIONS.md); reemplazar por la capacidad real del equipo y del punto de carga.
    const d = o.disparo(x.laborId)
    let [min, max, paso] = x.unidad === 'm' ? [Math.max(d, arr), 2 * d + arr, d] : [Math.max(100, arr), 300, 10]
    if (!o.habilitada(x.laborId, x.fecha, x.guardia)) min = max = x.plan
    vars.push({
      id: x.id,
      grupo: `${x.fecha}|${x.guardia}|${x.unidad}`,
      equipoId: x.equipoId,
      unidad: x.unidad,
      ley: x.unidad === 't' ? o.ley(x.laborId) : 0,
      plan: x.plan,
      min: Math.min(min, x.plan),
      max: Math.max(max, x.plan),
      paso,
    })
  }
  return { vars, fijo }
}
