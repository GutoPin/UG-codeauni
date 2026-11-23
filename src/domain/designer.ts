// Designer UG (ficha 02): constructor de labor por tramos y tajeo paramétrico evaluado contra el modelo de bloques.
import { areaHerradura, gradiente, hayInterferencia } from './modulos'

type V3 = [number, number, number]
const rad = (g: number) => (g * Math.PI) / 180

// ── Sección tipo ──────────────────────────────────────────────────
export type Forma = 'herradura' | 'rectangular' | 'circular'
export interface Seccion {
  forma: Forma
  /** ancho; en circular, el diámetro (m) */
  ancho: number
  /** herradura: alto de pared h_p; rectangular: alto total (m) */
  alto: number
  /** sobre-excavación planificada por pared y techo (m) */
  sobre: number
}

const areaBase = (f: Forma, w: number, h: number) =>
  f === 'herradura' ? areaHerradura(w, h) : f === 'rectangular' ? w * h : (Math.PI * w * w) / 4

/** Área de diseño y área con sobre-excavación (el piso no se sobre-excava). */
export function areaSeccion(s: Seccion) {
  const d = s.sobre
  const conSobre = s.forma === 'circular' ? areaBase('circular', s.ancho + 2 * d, 0) : areaBase(s.forma, s.ancho + 2 * d, s.forma === 'rectangular' ? s.alto + d : s.alto)
  return { area: areaBase(s.forma, s.ancho, s.alto), conSobre }
}

/** Contorno de la sección para dibujarla (x centrado, y desde el piso). */
export function contornoSeccion(f: Forma, w: number, h: number): [number, number][] {
  const r = w / 2
  if (f === 'rectangular') return [[-r, 0], [r, 0], [r, h], [-r, h]]
  const arco = (cy: number, desde: number, hasta: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const a = desde + ((hasta - desde) * i) / 24
      return [r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
    })
  if (f === 'circular') return arco(r, -Math.PI / 2, (3 * Math.PI) / 2)
  return [[-r, 0], [r, 0], ...arco(h, 0, Math.PI)]
}

// ── Eje por tramos ────────────────────────────────────────────────
export type Tramo =
  | { tipo: 'recta'; largo: number; gradiente: number }
  /** giro en grados: positivo a la izquierda */
  | { tipo: 'curva'; radio: number; giro: number; gradiente: number }

export interface Reglas {
  gradienteMax: number
  radioMin: number
}

/** Barre los tramos desde un origen y rumbo (grados, 0 = +x). Devuelve el eje muestreado cada ~2 m y los totales. */
export function ejeDeTramos(origen: V3, rumbo: number, tramos: Tramo[]) {
  const puntos: V3[] = [origen]
  let [x, y, z] = origen
  let th = rad(rumbo)
  const resumen = tramos.map((t) => {
    const lh = t.tipo === 'recta' ? t.largo : t.radio * rad(Math.abs(t.giro))
    const n = Math.max(1, Math.ceil(lh / 2))
    for (let i = 0; i < n; i++) {
      const dl = lh / n
      // en curva se avanza por la cuerda con el rumbo medio: el punto cae exacto sobre el arco
      const dth = t.tipo === 'curva' ? (Math.sign(t.giro) * dl) / t.radio : 0
      const cuerda = t.tipo === 'curva' && dth ? 2 * t.radio * Math.sin(Math.abs(dth) / 2) : dl
      x += cuerda * Math.cos(th + dth / 2)
      y += cuerda * Math.sin(th + dth / 2)
      th += dth
      z += (dl * t.gradiente) / 100
      puntos.push([x, y, z])
    }
    // gradiente recalculada desde la geometría: Δz / L horizontal × 100
    return { largo: lh, desnivel: (lh * t.gradiente) / 100, gradiente: lh ? gradiente((lh * t.gradiente) / 100, lh) : 0, zFin: z }
  })
  const largoH = resumen.reduce((s, r) => s + r.largo, 0)
  const largo3D = resumen.reduce((s, r) => s + Math.hypot(r.largo, r.desnivel), 0)
  return { puntos, resumen, largoH, largo3D, desnivel: z - origen[2] }
}

/** Reglas del proyecto, con los mensajes de la ficha 02. */
export function validarTramos(tramos: Tramo[], reglas: Reglas) {
  const errores: { tramo: number | null; msg: string }[] = []
  const largo = tramos.reduce((s, t) => s + (t.tipo === 'recta' ? t.largo : t.radio * rad(Math.abs(t.giro))), 0)
  if (!tramos.length || !(largo > 0)) errores.push({ tramo: null, msg: 'El eje debe tener al menos 2 vértices y longitud mayor que cero' })
  tramos.forEach((t, i) => {
    if (Math.abs(t.gradiente) > reglas.gradienteMax) errores.push({ tramo: i + 1, msg: `Gradiente fuera de límite en tramo ${i + 1}` })
    if (t.tipo === 'curva' && t.radio < reglas.radioMin) errores.push({ tramo: i + 1, msg: `Radio de giro insuficiente en tramo ${i + 1}` })
  })
  return errores
}

// ── Tajeo paramétrico ─────────────────────────────────────────────
export interface Tajeo {
  /** extremo inicial a lo largo del rumbo (m) */
  x0: number
  largo: number
  /** cota del piso (m) */
  zPiso: number
  alto: number
  /** ancho horizontal (m) */
  ancho: number
  /** buzamiento (°): 90 = vertical */
  buzamiento: number
  /** desplazamiento transversal del centro a media altura (m) */
  yCentro: number
}

/** Centro transversal del tajeo a la cota z: con buzamiento < 90° se corre al bajar. */
export const centroTajeo = (t: Tajeo, z: number) => t.yCentro + (z - (t.zPiso + t.alto / 2)) / Math.tan(rad(t.buzamiento))

/**
 * Fracción de cada bloque (cubo de lado `lado`) dentro del tajeo, por muestreo en 5 × 5 × 5 subbloques (ficha 02).
 * Luego tonelaje, ley, finos y dilución: estéril dentro del sólido + sobre-excavación d × área de pared.
 */
export function evaluarTajeo(
  t: Tajeo,
  bloques: { x: number; y: number; z: number; ley: number }[],
  o: { densidad: number; densidadEsteril: number; leyEsteril: number; sobre: number; lado?: number },
) {
  const lado = o.lado ?? 5
  const h = lado / 2
  const x1 = t.x0 + t.largo
  const z1 = t.zPiso + t.alto
  const dentro: { x: number; z: number; ley: number; fraccion: number }[] = []
  for (const b of bloques) {
    if (b.x + h <= t.x0 || b.x - h >= x1 || b.z + h <= t.zPiso || b.z - h >= z1) continue
    let n = 0
    for (let i = 0; i < 5; i++)
      for (let k = 0; k < 5; k++) {
        const x = b.x - h + (lado * (i + 0.5)) / 5
        const z = b.z - h + (lado * (k + 0.5)) / 5
        if (x < t.x0 || x > x1 || z < t.zPiso || z > z1) continue
        const c = centroTajeo(t, z)
        for (let j = 0; j < 5; j++) {
          const y = b.y - h + (lado * (j + 0.5)) / 5
          if (Math.abs(y - c) <= t.ancho / 2) n++
        }
      }
    if (n) dentro.push({ x: b.x, z: b.z, ley: b.ley, fraccion: n / 125 })
  }
  const volumen = t.largo * t.ancho * t.alto
  const vBloque = lado ** 3
  const vMineral = dentro.reduce((s, b) => s + b.fraccion * vBloque, 0)
  const tMineral = vMineral * o.densidad
  const finos = dentro.reduce((s, b) => s + b.fraccion * vBloque * o.densidad * b.ley, 0)
  const areaPared = (2 * t.largo * t.alto) / Math.sin(rad(t.buzamiento))
  const vEsteril = Math.max(0, volumen - vMineral) + o.sobre * areaPared
  const tEsteril = vEsteril * o.densidadEsteril
  const tTotal = tMineral + tEsteril
  return {
    volumen,
    bruto: volumen * o.densidad,
    bloques: dentro,
    tMineral,
    leyInSitu: tMineral ? finos / tMineral : 0,
    finos,
    tEsteril,
    dilucion: tMineral ? (tEsteril / tMineral) * 100 : 0,
    tDiluido: tTotal,
    leyDiluida: tTotal ? (finos + tEsteril * o.leyEsteril) / tTotal : 0,
  }
}

/** Traslape con otros tajeos y pilar contra las galerías de nivel (ficha 02: interferencia y validaciones). */
export function interferenciasTajeo(
  t: Tajeo,
  otros: { id: string; nombre: string; caja: [number, number, number, number] }[],
  niveles: number[],
  o: { pilarMin: number; altoGaleria: number; limites: [number, number, number, number] },
) {
  const out: string[] = []
  const x1 = t.x0 + t.largo
  const z1 = t.zPiso + t.alto
  if (!(t.largo > 0 && t.ancho > 0 && t.alto > 0)) out.push('Largo, ancho y alto deben ser mayores que cero')
  if (!(t.buzamiento > 0 && t.buzamiento <= 90)) out.push('El buzamiento debe estar entre 0° y 90°')
  const [lx0, lx1, lz0, lz1] = o.limites
  if (t.x0 < lx0 || x1 > lx1 || t.zPiso < lz0 || z1 > lz1) out.push('Parte del tajeo queda fuera del modelo de bloques: sin ley para evaluarla')
  for (const b of otros) {
    const [a0, a1, b0, b1] = b.caja
    if (t.x0 < a1 && a0 < x1 && t.zPiso < b1 && b0 < z1) out.push(`Se traslapa con ${b.nombre}`)
  }
  for (const nz of niveles) {
    // distancia vertical entre el centro del tajeo y el eje de la galería, contra el pilar mínimo
    const dist = Math.abs((t.zPiso + z1) / 2 - nz)
    if (hayInterferencia(dist, t.alto, o.altoGaleria, o.pilarMin)) {
      const pilar = dist - t.alto / 2 - o.altoGaleria / 2
      out.push(pilar < 0 ? `Corta la galería del NV ${nz}` : `Pilar de ${pilar.toFixed(1).replace('.', ',')} m con la galería del NV ${nz}; mínimo ${String(o.pilarMin).replace('.', ',')} m`)
    }
  }
  return out
}
