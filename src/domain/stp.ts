// Short-Term Planner UG — fórmulas de fichas/01_Short_Term_Planner_UG.md (Lógica y cálculos).

/** Cumplimiento (%) = real / plan x 100. Sin reporte (null) => null: "no inventar". */
export function cumplimiento(plan: number, real: number | null): number | null {
  if (real == null || plan <= 0) return null
  return (real / plan) * 100
}

/** Capacidad del equipo por guardia = horas disponibles x rendimiento. */
export const capacidadEquipo = (horas: number, rendimientoPorHora: number) => horas * rendimientoPorHora

/** Disparos por guardia = piso(horas disponibles / tiempo de ciclo). */
export const disparosPorGuardia = (horas: number, horasCiclo: number) => Math.floor(horas / horasCiclo)

/** Avance por disparo (m) = longitud de barreno x eficiencia. */
export const avancePorDisparo = (barreno: number, eficiencia: number) => barreno * eficiencia

/** Tonelaje de avance (t) = sección (m2) x avance (m) x densidad (t/m3). */
export const tonelajeAvance = (seccion: number, avance: number, densidad: number) => seccion * avance * densidad

export interface Habilitacion {
  ventilacionOk: boolean
  sostenimientoOk: boolean
  equipoOk: boolean
  /** ISO local; null si no hay disparo reciente. */
  reingresoHasta: string | null
}

/** Una labor está habilitada si ventilación OK, sostenimiento previo, equipo asignado y re-ingreso transcurrido. */
export function estaHabilitada(h: Habilitacion, ahora: Date) {
  const motivos: string[] = []
  if (!h.ventilacionOk) motivos.push('ventilación')
  if (!h.sostenimientoOk) motivos.push('sostenimiento')
  if (!h.equipoOk) motivos.push('equipo')
  if (h.reingresoHasta && new Date(h.reingresoHasta) > ahora) motivos.push('re-ingreso')
  return { ok: motivos.length === 0, motivos }
}

export interface Intervalo {
  id: string
  equipoId: string
  inicio: number
  fin: number
}

/** Ids de tareas donde el mismo equipo se solapa en el tiempo (validación: no asignar un equipo a dos tareas simultáneas). */
export function conflictosEquipo(tareas: Intervalo[]): Set<string> {
  const out = new Set<string>()
  const porEquipo = Map.groupBy(tareas, (t) => t.equipoId)
  for (const lista of porEquipo.values()) {
    const ord = [...lista].sort((a, b) => a.inicio - b.inicio)
    for (let i = 0; i < ord.length; i++)
      for (let j = i + 1; j < ord.length && ord[j].inicio < ord[i].fin; j++) {
        out.add(ord[i].id)
        out.add(ord[j].id)
      }
  }
  return out
}

/** Arrastre: pendiente = plan - real si positivo; se suma a la meta del siguiente periodo. */
export function arrastrarPendientes(filas: { laborId: string; plan: number; real: number; planSiguiente: number }[]) {
  return filas.map((f) => {
    const pendiente = Math.max(0, +(f.plan - f.real).toFixed(3))
    return { laborId: f.laborId, pendiente, planSiguiente: +(f.planSiguiente + pendiente).toFixed(3) }
  })
}

/** Puntaje de tarea = peso prioridad + peso valor - peso tiempo de espera (heurística; el jefe puede cambiarla). */
export function puntajeTarea(
  t: { prioridad: number; valor: number; espera: number },
  pesos: { prioridad: number; valor: number; espera: number },
) {
  return pesos.prioridad * t.prioridad + pesos.valor * t.valor - pesos.espera * t.espera
}

export interface Marca {
  /** id único generado en el dispositivo: hace idempotente la sincronización. */
  id: string
  tareaId: string
  cantidadReal: number
}

/** Aplica la cola de marcas offline una sola vez por id. */
export function aplicarCola(reales: Record<string, number>, cola: Marca[], aplicadas: Set<string>) {
  const r = { ...reales }
  const hechas = new Set(aplicadas)
  for (const m of cola) {
    if (hechas.has(m.id)) continue
    hechas.add(m.id)
    r[m.tareaId] = +((r[m.tareaId] ?? 0) + m.cantidadReal).toFixed(3)
  }
  return { reales: r, aplicadas: hechas }
}

/**
 * Asignación sugerida (heurística voraz): recorre las tareas por hora de inicio; mantiene el equipo actual si está
 * libre y con horas útiles, si no toma el equipo libre del mismo tipo con menos carga. Las tareas fijas no se tocan.
 * shortcut: voraz, no óptimo global; cambiar por un optimizador multiobjetivo (ficha 01) cuando haya costos reales.
 */
export function sugerirAsignacion(
  tareas: Intervalo[],
  equipos: { id: string; tipo: string; horasUtiles: number }[],
  fijas: Set<string> = new Set(),
) {
  const ocupado = new Map<string, Intervalo[]>(equipos.map((e) => [e.id, []]))
  const carga = new Map<string, number>(equipos.map((e) => [e.id, 0]))
  const asignacion: Record<string, string> = {}
  const tomar = (t: Intervalo, equipoId: string) => {
    asignacion[t.id] = equipoId
    ocupado.get(equipoId)?.push(t)
    carga.set(equipoId, (carga.get(equipoId) ?? 0) + t.fin - t.inicio)
  }
  const libre = (id: string, t: Intervalo) => !(ocupado.get(id) ?? []).some((o) => o.inicio < t.fin && t.inicio < o.fin)
  const cabe = (id: string, t: Intervalo) => (carga.get(id) ?? 0) + t.fin - t.inicio <= (equipos.find((e) => e.id === id)?.horasUtiles ?? Infinity)

  for (const t of tareas.filter((x) => fijas.has(x.id))) tomar(t, t.equipoId)
  const sinResolver: string[] = []
  let cambios = 0
  for (const t of tareas.filter((x) => !fijas.has(x.id)).sort((a, b) => a.inicio - b.inicio)) {
    if (libre(t.equipoId, t) && cabe(t.equipoId, t)) {
      tomar(t, t.equipoId)
      continue
    }
    const tipo = equipos.find((e) => e.id === t.equipoId)?.tipo
    const libres = equipos
      .filter((e) => e.tipo === tipo && e.id !== t.equipoId && libre(e.id, t))
      .sort((a, b) => Number(cabe(b.id, t)) - Number(cabe(a.id, t)) || carga.get(a.id)! - carga.get(b.id)!)
    const destino = libres[0]?.id ?? (libre(t.equipoId, t) ? t.equipoId : null)
    if (destino == null) {
      sinResolver.push(t.id)
      tomar(t, t.equipoId)
    } else {
      if (destino !== t.equipoId) cambios++
      tomar(t, destino)
    }
  }
  return { asignacion, cambios, sinResolver }
}
