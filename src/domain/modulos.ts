// Fórmulas de los módulos 2–7, tomadas de la sección "Lógica y cálculos" de cada ficha.

// ── Designer UG (02) ──────────────────────────────────────────────
/** Área de sección herradura: A = w·h_p + π·w²/8. */
export const areaHerradura = (w: number, hp: number) => w * hp + (Math.PI * w * w) / 8
/** Gradiente (%) = Δz / L_horizontal x 100. */
export const gradiente = (dz: number, lh: number) => (dz / lh) * 100
/** Desnivel de un tramo recto con gradiente g (%). Error si g supera la máxima del proyecto. */
export function desnivelRampa(lh: number, g: number, gMax: number) {
  if (g > gMax) throw new Error(`Gradiente ${g} % supera la máxima de ${gMax} %`)
  return (lh * g) / 100
}
/** Curva de rampa: arco = R·θ; desnivel = gradiente·R·θ. */
export function curvaRampa(R: number, grados: number, g: number) {
  const arco = R * ((grados * Math.PI) / 180)
  return { arco, desnivel: (arco * g) / 100 }
}
/** Tonelaje de bloque = V_bloque x fracción x densidad. */
export const tonelajeBloque = (dx: number, dy: number, dz: number, fraccion: number, densidad: number) =>
  dx * dy * dz * fraccion * densidad
/** Tajeo paramétrico: largo x ancho x altura x densidad. */
export const tonelajeTajeo = (largo: number, ancho: number, alto: number, densidad: number) =>
  largo * ancho * alto * densidad
/** Interferencia: distancia entre ejes menos semisecciones < pilar mínimo. */
export const hayInterferencia = (distEjes: number, ancho1: number, ancho2: number, pilarMin: number) =>
  distEjes - ancho1 / 2 - ancho2 / 2 < pilarMin

// ── Reserves UG (03) ──────────────────────────────────────────────
export const anchoMinado = (veta: number, minimo: number) => Math.max(veta, minimo)
export const dilucionPlanificada = (anchoMin: number, veta: number) => ((anchoMin - veta) / veta) * 100
export function mineralDiluido(t: number, ley: number, dilucionPct: number, leyDesmonte: number) {
  const tDil = t * (dilucionPct / 100)
  const total = t + tDil
  return { t: total, ley: (t * ley + tDil * leyDesmonte) / total }
}
export const mineralRecuperado = (t: number, recuperacionPct: number) => (t * recuperacionPct) / 100
/** Ley de corte (g/t) = costo total (US$/t) / (precio (US$/g) x recuperación de planta). */
export const leyCorte = (costo: number, precio: number, recPlanta: number) => costo / (precio * recPlanta)
export function pilar(tTajeo: number, factorPct: number) {
  const dejado = (tTajeo * factorPct) / 100
  return { dejado, evaluable: tTajeo - dejado }
}

// ── Scheduler UG (04) ─────────────────────────────────────────────
/** Duración (días) = cantidad / (tasa x disponibilidad x utilización). */
export const duracion = (cantidad: number, tasa: number, disp: number, util = 1) => cantidad / (tasa * disp * util)

export interface Actividad {
  id: string
  dur: number
  pred: string[]
}
export interface ResultadoCPM {
  es: number
  ef: number
  ls: number
  lf: number
  holgura: number
}

/** CPM fin-inicio sin desfase. Lanza error ante dependencia circular. */
export function cpm(acts: Actividad[]) {
  const byId = new Map(acts.map((a) => [a.id, a]))
  const orden: string[] = []
  const estado = new Map<string, 1 | 2>()
  const visitar = (id: string) => {
    if (estado.get(id) === 2) return
    if (estado.get(id) === 1) throw new Error(`Dependencia circular en ${id}`)
    estado.set(id, 1)
    for (const p of byId.get(id)!.pred) visitar(p)
    estado.set(id, 2)
    orden.push(id)
  }
  acts.forEach((a) => visitar(a.id))

  const r: Record<string, ResultadoCPM> = {}
  for (const id of orden) {
    const a = byId.get(id)!
    const es = Math.max(0, ...a.pred.map((p) => r[p].ef))
    r[id] = { es, ef: es + a.dur, ls: 0, lf: 0, holgura: 0 }
  }
  const fin = Math.max(...Object.values(r).map((x) => x.ef))
  for (const id of [...orden].reverse()) {
    const sucesoras = acts.filter((a) => a.pred.includes(id))
    const lf = sucesoras.length ? Math.min(...sucesoras.map((s) => r[s.id].ls)) : fin
    const x = r[id]
    x.lf = lf
    x.ls = lf - byId.get(id)!.dur
    x.holgura = x.ls - x.es
  }
  const critica = orden.filter((id) => r[id].holgura === 0)
  return { r, fin, critica }
}

// ── Stope Optimizer (05) ──────────────────────────────────────────
/** Ley de corte de equilibrio = (Cm + Cp + Cg) / ((P - Cv) x R). */
export const leyCorteEquilibrio = (Cm: number, Cp: number, Cg: number, P: number, Cv: number, R: number) =>
  (Cm + Cp + Cg) / ((P - Cv) * R)
/** Dilución por pared (t) = ELOS x A_pared x paredes x densidad. */
export const dilucionELOS = (aPared: number, elos: number, densidad: number, paredes = 2) =>
  aPared * elos * paredes * densidad

export interface Forma {
  id: string
  inicio: number
  fin: number
  valor: number
}
/** Selección sin traslape: programación dinámica de intervalos ponderados, con pilar mínimo entre formas. */
export function seleccionarFormas(formas: Forma[], pilarMin = 0) {
  const f = [...formas].filter((x) => x.valor > 0).sort((a, b) => a.fin - b.fin)
  const best: number[] = [0]
  const elegido: Forma[][] = [[]]
  for (let k = 0; k < f.length; k++) {
    let p = k - 1
    while (p >= 0 && f[p].fin + pilarMin > f[k].inicio) p--
    const tomar = f[k].valor + best[p + 1]
    if (tomar > best[k]) {
      best.push(tomar)
      elegido.push([...elegido[p + 1], f[k]])
    } else {
      best.push(best[k])
      elegido.push(elegido[k])
    }
  }
  return { valor: best[f.length], formas: elegido[f.length] }
}
/** Esfuerzo de pilar por área tributaria: σp = σv / (1 - e); FS = resistencia / σp. */
export function esfuerzoPilar(sigmaV: number, e: number, resistencia: number) {
  const sigmaP = sigmaV / (1 - e)
  return { sigmaP, fs: resistencia / sigmaP }
}

// ── Blend UG (06) ─────────────────────────────────────────────────
/** Promedio ponderado por tonelaje: ley, contaminante o dureza de la mezcla. */
export const ponderado = (fuentes: { t: number; v: number }[]) =>
  fuentes.reduce((s, f) => s + f.t * f.v, 0) / fuentes.reduce((s, f) => s + f.t, 0)
export const capacidadPique = (tph: number, horas: number, disp: number) => tph * horas * disp
export const camionesNecesarios = (t: number, capViaje: number, viajes: number) => Math.ceil(t / (capViaje * viajes))
/** Chimenea de traspaso: ingreso admitido sin superar la capacidad. */
export const ingresoChimenea = (capacidad: number, nivel: number, ingreso: number, extraccion: number) =>
  Math.max(0, Math.min(ingreso, capacidad - nivel + extraccion))

// ── Cave Planner (07) ─────────────────────────────────────────────
export const tonelajeColumna = (alto: number, lado1: number, lado2: number, densidad: number, fraccion = 1) =>
  alto * lado1 * lado2 * densidad * fraccion
export const radioHidraulico = (largo: number, ancho: number) => (largo * ancho) / (2 * (largo + ancho))
