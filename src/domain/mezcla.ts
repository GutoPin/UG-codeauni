// Blend UG (ficha 06): modelo lineal de mezcla por guardia. Arma el texto LP para un solver estándar y lee su solución.
// El solver se inyecta (HiGHS en la app y en las pruebas) para que el modelo quede puro.

export type TipoFuente = 'Tajeo' | 'Frente' | 'Acopio' | 'Chimenea'
/** Cómo llega a la planta: por la chimenea de traspaso (niveles superiores) o en camión de bajo perfil hasta el pique. */
export type Ruta = 'chimenea' | 'camion'

export interface FuenteMezcla {
  id: string
  nombre: string
  tipo: TipoFuente
  nivel: number
  ruta: Ruta
  ley: number
  /** índice de trabajo (kWh/t) */
  dureza: number
  /** arsénico (%) */
  as: number
  /** toneladas que quedan listas en cada periodo; lo no usado espera en la fuente (salvo frentes) */
  disp: number[]
  /** frente de avance: lo volado se limpia en el periodo, a planta o a desmonte */
  obligatoria?: boolean
  /** carga que ya está dentro de la chimenea al empezar */
  enChimenea?: boolean
}

export interface Limites {
  plantaMax: number
  plantaMin: number
  leyMin: number
  leyMax: number
  durezaMax: number
  asMax: number
}
export interface Transporte {
  /** t por periodo que sube el pique = t/h × horas × disponibilidad */
  pique: number
  chimeneaCap: number
  /** t por periodo que entrega el buzón de la chimenea */
  chimeneaSalida: number
  /** t por periodo que mueven los camiones = camiones × t por viaje × viajes */
  camiones: number
  costoCamion: number
  costoPique: number
}
export type Objetivo = 'valor' | 'desvio' | 'costo'
export interface Problema {
  periodos: string[]
  fuentes: FuenteMezcla[]
  limites: Limites
  transporte: Transporte
  objetivo: Objetivo
  /** USD por g de oro pagable = precio × recuperación */
  valorGramo: number
  /** ley objetivo para minimizar el desvío */
  leyObjetivo: number
}

export const capacidadPique = (tph: number, horas: number, disp: number) => tph * horas * disp
export const capacidadCamiones = (n: number, tViaje: number, viajes: number) => n * tViaje * viajes

export function validarProblema(p: Problema) {
  const e: string[] = []
  if (p.limites.leyMin > p.limites.leyMax) e.push('Límites de ley incoherentes')
  if (!(p.transporte.pique > 0)) e.push('La capacidad del pique debe ser mayor que 0 t')
  if (!(p.transporte.chimeneaCap > 0)) e.push('La capacidad de la chimenea debe ser mayor que 0 t')
  if (!(p.limites.plantaMax > 0)) e.push('Falta la capacidad de planta')
  if (p.objetivo !== 'valor' && !(p.limites.plantaMin > 0)) e.push('Con este objetivo hace falta una alimentación mínima: sin ella el plan vacío es el óptimo')
  if (p.limites.plantaMin > p.limites.plantaMax) e.push('La alimentación mínima supera la capacidad de planta')
  for (const f of p.fuentes) if (!Number.isFinite(f.ley) || !f.nivel) e.push(`${f.nombre} no tiene nivel o ley: no entra al solver`)
  const ini = p.fuentes.filter((f) => f.enChimenea).reduce((s, f) => s + f.disp[0], 0)
  if (ini < 0 || ini > p.transporte.chimeneaCap) e.push('El nivel de la chimenea no puede ser negativo ni superar su capacidad')
  return e
}

/** Términos lineales en formato LP: «+ 3 x1 - 2 x4», sin «+ -». */
const lin = (ts: [number, string][]) => {
  const s = ts
    .filter(([c]) => Math.abs(c) > 1e-12)
    .map(([c, v]) => `${c < 0 ? '-' : '+'} ${+Math.abs(c).toPrecision(12)} ${v}`)
    .join(' ')
  return s || '0 x0'
}

export type TipoFila = 'disponible' | 'frente' | 'balance' | 'chimeneaCap' | 'chimeneaSalida' | 'camiones' | 'pique' | 'plantaMax' | 'plantaMin' | 'leyMin' | 'leyMax' | 'dureza' | 'as' | 'desvio'
interface Fila {
  tipo: TipoFila
  periodo: number
  fuente?: string
  /** las de calidad y alimentación mínima admiten holgura penalizada en la corrida elástica */
  blanda: boolean
  holgura?: string
}

const PENA = 1e6

/** Arma el modelo. `elastico` agrega holguras penalizadas a las filas blandas para nombrar la violación. */
export function armarModelo(p: Problema, elastico = false) {
  const cols: string[] = []
  const meta: { fuente?: string; periodo?: number; tipo: 'x' | 'w' | 'o' | 'L' | 'd' | 's' }[] = []
  const nueva = (m: (typeof meta)[number]) => {
    const n = `x${cols.length}`
    cols.push(n)
    meta.push(m)
    return n
  }
  const P = p.periodos.length
  const x: Record<string, string[]> = {} // extraído hacia planta (o hacia la chimenea)
  const w: Record<string, string[]> = {} // frente a desmonte
  const o: Record<string, string[]> = {} // sale de la chimenea a planta
  const L: Record<string, string[]> = {} // queda en la chimenea al cerrar el periodo
  const sube = p.fuentes.filter((f) => f.ruta === 'chimenea')
  for (const f of p.fuentes) {
    x[f.id] = f.enChimenea ? [] : p.periodos.map((_, t) => nueva({ fuente: f.id, periodo: t, tipo: 'x' }))
    if (f.obligatoria) w[f.id] = p.periodos.map((_, t) => nueva({ fuente: f.id, periodo: t, tipo: 'w' }))
  }
  for (const f of sube) {
    o[f.id] = p.periodos.map((_, t) => nueva({ fuente: f.id, periodo: t, tipo: 'o' }))
    L[f.id] = p.periodos.map((_, t) => nueva({ fuente: f.id, periodo: t, tipo: 'L' }))
  }
  // lo que llega a planta de la fuente f en t
  const alPlanta = (f: FuenteMezcla, t: number) => (f.ruta === 'chimenea' ? o[f.id][t] : x[f.id][t])

  const filas: Fila[] = []
  const texto: string[] = []
  const fila = (f: Fila, expr: string, op: string, rhs: number) => {
    texto.push(` r${filas.length}: ${expr} ${op} ${+rhs.toPrecision(12)}`)
    filas.push(f)
  }
  const holguras: string[] = []
  const blanda = (f: Fila, ts: [number, string][], op: '<=' | '>=', rhs: number) => {
    let holgura: string | undefined
    if (elastico) {
      holgura = nueva({ periodo: f.periodo, tipo: 's' })
      holguras.push(holgura)
      ts = [...ts, [op === '<=' ? -1 : 1, holgura]]
    }
    fila({ ...f, blanda: true, holgura }, lin(ts), op, rhs)
  }

  for (const f of p.fuentes) {
    if (f.enChimenea) continue
    let acum = 0
    for (let t = 0; t < P; t++) {
      acum += f.disp[t]
      if (f.obligatoria) fila({ tipo: 'frente', periodo: t, fuente: f.id, blanda: false }, lin([[1, x[f.id][t]], [1, w[f.id][t]]]), '=', f.disp[t])
      // lo volado que no se usa sigue disponible en la fuente
      else fila({ tipo: 'disponible', periodo: t, fuente: f.id, blanda: false }, lin(x[f.id].slice(0, t + 1).map((v) => [1, v])), '<=', acum)
    }
  }
  for (let t = 0; t < P; t++) {
    // chimenea: nivel por fuente = anterior + ingreso − salida; el total no pasa la capacidad
    for (const f of sube) {
      const ingreso: [number, string][] = f.enChimenea ? [] : [[1, x[f.id][t]]]
      const previo: [number, string][] = t ? [[1, L[f.id][t - 1]]] : []
      const ini = t === 0 && f.enChimenea ? f.disp[0] : 0
      fila({ tipo: 'balance', periodo: t, fuente: f.id, blanda: false }, lin([[1, L[f.id][t]], [1, o[f.id][t]], ...ingreso.map(([c, v]) => [-c, v] as [number, string]), ...previo.map(([c, v]) => [-c, v] as [number, string])]), '=', ini)
    }
    if (sube.length) {
      fila({ tipo: 'chimeneaCap', periodo: t, blanda: false }, lin(sube.map((f) => [1, L[f.id][t]])), '<=', p.transporte.chimeneaCap)
      fila({ tipo: 'chimeneaSalida', periodo: t, blanda: false }, lin(sube.map((f) => [1, o[f.id][t]])), '<=', p.transporte.chimeneaSalida)
    }
    const camion = p.fuentes.filter((f) => f.ruta === 'camion')
    fila({ tipo: 'camiones', periodo: t, blanda: false }, lin(camion.map((f) => [1, x[f.id][t]])), '<=', p.transporte.camiones)
    const feed = p.fuentes.map((f) => [f, alPlanta(f, t)] as const)
    fila({ tipo: 'pique', periodo: t, blanda: false }, lin(feed.map(([, v]) => [1, v])), '<=', p.transporte.pique)
    fila({ tipo: 'plantaMax', periodo: t, blanda: false }, lin(feed.map(([, v]) => [1, v])), '<=', p.limites.plantaMax)
    if (p.limites.plantaMin > 0) blanda({ tipo: 'plantaMin', periodo: t, blanda: true }, feed.map(([, v]) => [1, v]), '>=', p.limites.plantaMin)
    blanda({ tipo: 'leyMin', periodo: t, blanda: true }, feed.map(([f, v]) => [f.ley - p.limites.leyMin, v]), '>=', 0)
    blanda({ tipo: 'leyMax', periodo: t, blanda: true }, feed.map(([f, v]) => [f.ley - p.limites.leyMax, v]), '<=', 0)
    blanda({ tipo: 'dureza', periodo: t, blanda: true }, feed.map(([f, v]) => [f.dureza - p.limites.durezaMax, v]), '<=', 0)
    blanda({ tipo: 'as', periodo: t, blanda: true }, feed.map(([f, v]) => [f.as - p.limites.asMax, v]), '<=', 0)
  }

  // objetivo
  let obj: [number, string][] = []
  let sentido = 'Maximize'
  const transporte = (t: number) =>
    p.fuentes.flatMap((f): [number, string][] => [
      [p.transporte.costoPique, alPlanta(f, t)],
      ...(f.ruta === 'camion' && !f.enChimenea ? ([[p.transporte.costoCamion, x[f.id][t]]] as [number, string][]) : []),
    ])
  if (p.objetivo === 'valor') {
    for (let t = 0; t < P; t++) {
      for (const f of p.fuentes) obj.push([f.ley * p.valorGramo, alPlanta(f, t)])
      obj.push(...transporte(t).map(([c, v]) => [-c, v] as [number, string]))
    }
  } else {
    sentido = 'Minimize'
    for (let t = 0; t < P; t++) {
      if (p.objetivo === 'costo') obj.push(...transporte(t))
      else {
        const dm = nueva({ periodo: t, tipo: 'd' })
        const dp = nueva({ periodo: t, tipo: 'd' })
        fila({ tipo: 'desvio', periodo: t, blanda: false }, lin([...p.fuentes.map((f) => [f.ley - p.leyObjetivo, alPlanta(f, t)] as [number, string]), [-1, dp], [1, dm]]), '=', 0)
        obj.push([1, dp], [1, dm])
      }
    }
  }
  if (elastico) obj.push(...holguras.map((s) => [sentido === 'Maximize' ? -PENA : PENA, s] as [number, string]))
  const lp = `${sentido}\n obj: ${lin(obj)}\nSubject To\n${texto.join('\n')}\nEnd`
  return { lp, cols, meta, filas, x, w, o, L, alPlanta }
}

/** Lo que necesitamos de la respuesta del solver (forma de HiGHS). */
export interface Solucion {
  Status: string
  ObjectiveValue: number
  Columns: Record<string, { Primal?: number }>
  Rows: { Primal?: number; Dual?: number }[]
}

const UNIDAD: Partial<Record<TipoFila, string>> = { leyMin: 'g/t', leyMax: 'g/t', dureza: 'kWh/t', as: '%' }

/** Resuelve: primero con límites duros; si no hay solución, otra vez elástica para nombrar qué límite se rompe. */
export function resolverMezcla(p: Problema, solve: (lp: string) => Solucion) {
  const errores = validarProblema(p)
  if (errores.length) return { ok: false as const, errores }
  let m = armarModelo(p)
  let s = solve(m.lp)
  let elastica = false
  if (s.Status !== 'Optimal') {
    elastica = true
    m = armarModelo(p, true)
    s = solve(m.lp)
    if (s.Status !== 'Optimal') return { ok: false as const, errores: [`El solver no encontró plan: ${s.Status}`] }
  }
  const v = (n: string | undefined) => (n ? Math.max(0, s.Columns[n]?.Primal ?? 0) : 0)
  const periodos = p.periodos.map((nombre, t) => {
    const aportes = p.fuentes.map((f) => ({ f, t: v(m.alPlanta(f, t)) })).filter((a) => a.t > 1e-6)
    const tt = aportes.reduce((s, a) => s + a.t, 0)
    const pond = (k: 'ley' | 'dureza' | 'as') => (tt ? aportes.reduce((s, a) => s + a.t * a.f[k], 0) / tt : 0)
    const nivel = p.fuentes.filter((f) => f.ruta === 'chimenea').reduce((s, f) => s + v(m.L[f.id][t]), 0)
    const desmonte = p.fuentes.filter((f) => f.obligatoria).reduce((s, f) => s + v(m.w[f.id][t]), 0)
    return { nombre, t: tt, ley: pond('ley'), dureza: pond('dureza'), as: pond('as'), chimenea: nivel, desmonte, aportes: Object.fromEntries(aportes.map((a) => [a.f.id, a.t])) }
  })
  const porFuente = p.fuentes.map((f) => {
    const planta = periodos.reduce((s, q) => s + (q.aportes[f.id] ?? 0), 0)
    const desmonte = f.obligatoria ? m.w[f.id].reduce((s, n) => s + v(n), 0) : 0
    const disponible = f.disp.reduce((a, b) => a + b, 0)
    return { f, planta, desmonte, queda: f.obligatoria ? 0 : Math.max(0, disponible - (f.enChimenea ? planta : m.x[f.id].reduce((s, n) => s + v(n), 0))), disponible }
  })

  // restricciones activas: duales de HiGHS; las de calidad se llevan a USD por unidad del límite (× toneladas del periodo)
  const activas = elastica
    ? []
    : m.filas.flatMap((fl, i) => {
        const d = s.Rows[i]?.Dual ?? 0
        if (Math.abs(d) < 1e-7 || fl.tipo === 'frente' || fl.tipo === 'desvio' || fl.tipo === 'balance') return []
        const tt = periodos[fl.periodo].t
        const calidad = fl.tipo in UNIDAD
        // subir un límite máximo de calidad en una unidad suma tt a su lado derecho; bajar uno mínimo, también
        const valor = calidad ? Math.abs(d) * tt : Math.abs(d)
        return [{ tipo: fl.tipo, periodo: fl.periodo, fuente: fl.fuente, dual: d, valor, unidad: UNIDAD[fl.tipo] ?? 't' }]
      })
  const violadas = m.filas.flatMap((fl) => (fl.holgura && v(fl.holgura) > 1e-6 ? [{ tipo: fl.tipo, periodo: fl.periodo }] : []))
  const total = periodos.reduce((a, q) => ({ t: a.t + q.t, finos: a.finos + q.t * q.ley }), { t: 0, finos: 0 })
  return {
    ok: true as const,
    errores: [] as string[],
    elastica,
    // sin la penalización de las holguras: el valor real del plan
    objetivo: s.ObjectiveValue + (p.objetivo === 'valor' ? 1 : -1) * PENA * m.filas.reduce((a, fl) => a + (fl.holgura ? v(fl.holgura) : 0), 0),
    periodos,
    porFuente,
    activas,
    violadas,
    total: { ...total, ley: total.t ? total.finos / total.t : 0 },
  }
}
export type ResultadoMezcla = Extract<ReturnType<typeof resolverMezcla>, { ok: true }>

/** Plan de alimentación por periodo, para planta (Metso DPM u hoja de cálculo). */
export const filasExportacion = (r: Pick<ResultadoMezcla, 'periodos'>) =>
  r.periodos.map((q) => ({
    periodo: q.nombre,
    toneladas_t: Math.round(q.t),
    ley_g_t: +q.ley.toFixed(2),
    dureza_kWh_t: +q.dureza.toFixed(1),
    arsenico_pct: +q.as.toFixed(3),
  }))
