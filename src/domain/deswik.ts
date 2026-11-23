// Intercambio con Deswik por archivos (ficha 01: «Archivos de Deswik por CSV y DXF»).
// CSV de intercambio: separador coma, punto decimal y fechas AAAA-MM-DD; al leer también acepta el CSV de Excel
// en español (punto y coma, coma decimal).

type Fila = Record<string, string | number | null | undefined>

const celda = (v: Fila[string]) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function aCSV(filas: Fila[]) {
  if (!filas.length) return ''
  const cols = Object.keys(filas[0])
  return [cols.join(','), ...filas.map((f) => cols.map((c) => celda(f[c])).join(','))].join('\r\n') + '\r\n'
}

/** Lee CSV con comillas (RFC 4180). Detecta el separador por la primera línea. Devuelve filas como texto. */
export function leerCSV(texto: string): Record<string, string>[] {
  const t = texto.replace(/^﻿/, '')
  const primera = t.slice(0, t.search(/\r?\n|$/))
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ';' : ','
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ''
  let comillas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') (campo += '"'), i++
      else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === sep) fila.push(campo), (campo = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      fila.push(campo)
      filas.push(fila)
      fila = []
      campo = ''
    } else campo += c
  }
  if (campo || fila.length) fila.push(campo), filas.push(fila)
  const [cab, ...resto] = filas.filter((f) => f.some((x) => x.trim() !== ''))
  if (!cab) return []
  const cols = cab.map((c) => c.trim().toLowerCase())
  return resto.map((f) => Object.fromEntries(cols.map((c, i) => [c, (f[i] ?? '').trim()])))
}

export interface CambioPlan {
  /** línea del archivo (la cabecera es la 1) */
  fila: number
  tareaId: string
  laborId: string
  fecha: string
  guardia: 'D' | 'N'
  antes: number
  despues: number
}

const OBLIGATORIAS = ['labor', 'fecha', 'guardia', 'plan']

/** Valida un plan importado fila por fila; solo pasan las que se pueden programar (reglas de la ficha 01). */
export function validarPlan(
  filas: Record<string, string>[],
  ctx: {
    tareas: { id: string; laborId: string; fecha: string; guardia: 'D' | 'N'; plan: number }[]
    existe: (laborId: string) => boolean
    editable: (fecha: string, guardia: 'D' | 'N') => boolean
    /** null si está habilitada al inicio de esa guardia; si no, el motivo */
    habilitada: (laborId: string, fecha: string, guardia: 'D' | 'N') => string | null
  },
) {
  const cambios: CambioPlan[] = []
  const rechazos: { fila: number; motivo: string }[] = []
  if (!filas.length) return { cambios, rechazos, error: 'El archivo no tiene filas de datos' }
  const faltan = OBLIGATORIAS.filter((c) => !(c in filas[0]))
  if (faltan.length) return { cambios, rechazos, error: `Faltan columnas: ${faltan.join(', ')}` }

  filas.forEach((f, i) => {
    const fila = i + 2
    const no = (motivo: string) => rechazos.push({ fila, motivo })
    const laborId = f.labor.toUpperCase()
    const g = f.guardia.trim().toUpperCase()[0]
    const plan = Number(f.plan.replace(/\s/g, '').replace(',', '.') || NaN)
    if (!ctx.existe(laborId)) return no(`labor desconocida: ${f.labor}`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha)) return no('fecha debe ser AAAA-MM-DD')
    if (g !== 'D' && g !== 'N') return no('guardia debe ser D (día) o N (noche)')
    if (!(plan > 0)) return no('plan debe ser mayor a cero')
    const t = ctx.tareas.find((x) => x.laborId === laborId && x.fecha === f.fecha && x.guardia === g)
    // una fila sin cambio no se valida: reimportar el programa completo exportado no debe dar rechazos
    if (t && Math.abs(t.plan - plan) < 1e-9) return
    if (!ctx.editable(f.fecha, g)) return no('guardia ya ejecutada')
    const motivo = ctx.habilitada(laborId, f.fecha, g)
    if (motivo) return no(`labor no habilitada: ${motivo}`)
    if (!t) return no('sin tarea programada en esa guardia')
    // si una labor y guardia aparece dos veces, vale la última fila
    const previo = cambios.findIndex((c) => c.tareaId === t.id)
    if (previo >= 0) cambios.splice(previo, 1)
    cambios.push({ fila, tareaId: t.id, laborId, fecha: f.fecha, guardia: g, antes: t.plan, despues: plan })
  })
  return { cambios, rechazos, error: null }
}

// ── DXF ──────────────────────────────────────────────────────────
type P3 = [number, number, number]
export interface PiezaDXF {
  id: string
  tipo: string
  eje?: P3[]
  /** tajeo: [xmin, xmax, zmin, zmax] en el plano de la veta, a la distancia transversal y */
  caja?: [number, number, number, number]
  y?: number
}

const n = (v: number) => String(+v.toFixed(3))
const capa = (tipo: string) => tipo.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()

/** DXF ASCII R12 (solo sección ENTITIES): una POLYLINE 3D por labor en la capa de su tipo y un TEXT con su código. */
export function aDXF(piezas: PiezaDXF[]) {
  const out: (string | number)[] = [0, 'SECTION', 2, 'ENTITIES']
  for (const p of piezas) {
    const ly = capa(p.tipo)
    const pts: P3[] = p.caja
      ? [
          [p.caja[0], p.y ?? 0, p.caja[2]],
          [p.caja[1], p.y ?? 0, p.caja[2]],
          [p.caja[1], p.y ?? 0, p.caja[3]],
          [p.caja[0], p.y ?? 0, p.caja[3]],
        ]
      : (p.eje ?? [])
    if (!pts.length) continue
    // 70 = 8: polilínea 3D; +1: cerrada (contorno del tajeo)
    out.push(0, 'POLYLINE', 8, ly, 66, 1, 10, 0, 20, 0, 30, 0, 70, p.caja ? 9 : 8)
    for (const [x, y, z] of pts) out.push(0, 'VERTEX', 8, ly, 10, n(x), 20, n(y), 30, n(z), 70, 32)
    out.push(0, 'SEQEND', 8, ly)
    const [x, y, z] = p.caja ? [(p.caja[0] + p.caja[1]) / 2, p.y ?? 0, (p.caja[2] + p.caja[3]) / 2] : pts[0]
    out.push(0, 'TEXT', 8, ly, 10, n(x), 20, n(y), 30, n(z), 40, 3, 1, p.id)
  }
  out.push(0, 'ENDSEC', 0, 'EOF')
  return out.join('\n') + '\n'
}
