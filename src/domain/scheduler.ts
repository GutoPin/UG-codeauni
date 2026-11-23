import { cpm, type Actividad } from './modulos'

// ── Scheduler UG (04): nivelación con recursos finitos y plan por periodo ──
export interface ActividadRecurso extends Actividad {
  recurso: string
  /** mayor = se programa antes cuando compiten por el recurso */
  prioridad: number
}
export interface Colocada {
  /** primer día de trabajo (índice desde el inicio del programa) */
  inicio: number
  /** día siguiente al último de trabajo */
  fin: number
  /** días de trabajo efectivos (saltan las paradas) */
  dias: number[]
  /** días que la actividad esperó por el recurso, ya listas sus predecesoras */
  retraso: number
}

/**
 * Programación serial (ficha 04): entre las actividades con predecesoras ya colocadas se toma la de mayor prioridad
 * (desempate: menor holgura CPM) y se coloca en el primer día en que sus predecesoras terminaron y el recurso tiene
 * una unidad libre durante toda su duración. Las paradas del calendario no cuentan como días de trabajo.
 * shortcut: duraciones redondeadas a días enteros y sin interrupción por el recurso; pasar a turnos si hace falta más detalle.
 */
export function nivelar(acts: ActividadRecurso[], capacidad: Record<string, number>, parada: (dia: number) => boolean = () => false) {
  const { r } = cpm(acts)
  for (const a of acts) if (!((capacidad[a.recurso] ?? 0) >= 1)) throw new Error(`El recurso ${a.recurso} de ${a.id} no tiene unidades`)
  const uso = new Map<string, number[]>()
  const out: Record<string, Colocada> = {}
  const pend = new Set(acts.map((a) => a.id))
  const habil = (d: number) => {
    while (parada(d)) d++
    return d
  }
  while (pend.size) {
    const a = acts
      .filter((x) => pend.has(x.id) && x.pred.every((p) => out[p]))
      .sort((x, y) => y.prioridad - x.prioridad || r[x.id].holgura - r[y.id].holgura || x.id.localeCompare(y.id))[0]
    const n = Math.max(1, Math.ceil(a.dur - 1e-9))
    const u = uso.get(a.recurso) ?? []
    uso.set(a.recurso, u)
    const listo = habil(Math.ceil(Math.max(0, ...a.pred.map((p) => out[p].fin + (a.desfase?.[p] ?? 0)))))
    for (let s = listo; ; s = habil(s + 1)) {
      const dias: number[] = []
      for (let d = s; dias.length < n; d++) {
        if (parada(d)) continue
        if ((u[d] ?? 0) >= capacidad[a.recurso]) break
        dias.push(d)
      }
      if (dias.length < n) continue
      for (const d of dias) u[d] = (u[d] ?? 0) + 1
      out[a.id] = { inicio: s, fin: dias[n - 1] + 1, dias, retraso: s - listo }
      break
    }
    pend.delete(a.id)
  }
  return { colocadas: out, uso, cpm: r }
}

export interface Aporte {
  dias: number[]
  cantidad: number
  unidad: 'm' | 't' | 'm³'
  /** g/t, solo para toneladas */
  ley: number
  destino: string
  /** toneladas que mueve (desarrollo: roca; producción: mineral) */
  t: number
}

/** Plan por periodo: cada actividad reparte su cantidad por igual en sus días de trabajo (prorrateo por días). */
export function porPeriodo(acts: Aporte[], periodos: { nombre: string; desde: number; hasta: number }[]) {
  return periodos.map((p) => {
    const x = { nombre: p.nombre, m: 0, t: 0, finos: 0, relleno: 0, destinos: {} as Record<string, number> }
    for (const a of acts) {
      const f = a.dias.filter((d) => d >= p.desde && d < p.hasta).length / a.dias.length
      if (!f) continue
      if (a.unidad === 'm') x.m += a.cantidad * f
      if (a.unidad === 'm³') x.relleno += a.cantidad * f
      x.destinos[a.destino] = (x.destinos[a.destino] ?? 0) + a.t * f
      if (a.unidad === 't') {
        x.t += a.t * f
        x.finos += a.t * f * a.ley
      }
    }
    return { ...x, ley: x.t ? x.finos / x.t : 0 }
  })
}
