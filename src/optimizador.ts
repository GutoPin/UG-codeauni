import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BLOQUES, entrega, vetaY, type Datos, type DatosTajeo } from './disenos'
import { evaluarTajeo, type Tajeo } from './domain/designer'
import { anchoForma, candidatas, corteEquilibrio, optimizarFila, pilarEntre, pilarRecomendado, sigmaV, valorForma, type Columna, type Economia } from './domain/optimizador'
import { validarMetodo, type Economia as EcoReservas, type Metodo } from './domain/reservas'
import type { Diseno } from './domain/versiones'
import { conAcceso, DENSIDAD_ESTERIL, LEY_ESTERIL, POTENCIA, TAJEOS_MINA } from './reservas'

export interface ParamOptimizador {
  /** método de Reserves UG: da ancho mínimo, ELOS y costo de mina */
  metodo: string
  /** altura del tajeo sobre el piso (m); el piso queda 5 m sobre la galería del nivel */
  alto: number
  lMin: number
  lMax: number
  pilarMin: number
  metrosAcceso: number
  costoMetro: number
  /** costo de venta (USD/g) */
  venta: number
  /** ley de corte manual; null = equilibrio */
  corte: number | null
  /** no proponer formas sobre los tajeos de la mina ni sobre los publicados en Designer */
  respetar: boolean
  superficie: number
  resistencia: number
  fsMin: number
}
export const PARAM_OPT: ParamOptimizador = {
  metodo: 'cyr',
  alto: 40,
  lMin: 15,
  lMax: 60,
  pilarMin: 10,
  metrosAcceso: 25,
  costoMetro: 2500,
  venta: 0,
  corte: null,
  respetar: true,
  superficie: 4150,
  resistencia: 60,
  fsMin: 1.4,
}
export const FILAS = [3750, 3800, 3850]
const DENSIDAD = 2.9
const LADO = 5
const X_INI = -12.5
const X_FIN = 432.5

const cache = new Map<string, Columna[]>()
/** Columnas de 5 m de una fila, evaluadas con el mismo cálculo que Designer y Reserves (suman exacto al tajeo entero). */
function columnas(nivel: number, alto: number, ancho: number, sobre: number) {
  const k = `${nivel}|${alto}|${ancho}|${sobre}`
  const hit = cache.get(k)
  if (hit) return hit
  const cols: Columna[] = []
  for (let x0 = X_INI; x0 + LADO <= X_FIN + 1e-9; x0 += LADO) {
    const ev = evaluarTajeo(tajeoDe(nivel, x0, x0 + LADO, alto, ancho), BLOQUES, { densidad: DENSIDAD, densidadEsteril: DENSIDAD_ESTERIL, leyEsteril: LEY_ESTERIL, sobre })
    cols.push({ x0, ancho: LADO, tMineral: ev.tMineral, finos: ev.finos, tEsteril: ev.tEsteril })
  }
  cache.set(k, cols)
  return cols
}

export const tajeoDe = (nivel: number, x0: number, x1: number, alto: number, ancho: number): Tajeo => {
  const zPiso = nivel + 5
  return { x0, largo: x1 - x0, zPiso, alto, ancho, buzamiento: 90, yCentro: +vetaY(zPiso + alto / 2).toFixed(2) }
}

export function validarOptimizador(p: ParamOptimizador, m: Metodo | undefined, eco: EcoReservas) {
  const out: string[] = []
  if (!m) return ['Elija un método de minado']
  out.push(...validarMetodo(m).map((e) => `${m.nombre}: ${e}`))
  if (!(p.alto > 0 && p.alto <= 40 && p.alto % LADO === 0)) out.push('La altura del tajeo va de 5 a 40 m, en múltiplos de 5 m (tamaño del bloque)')
  if (!(p.lMin > 0 && p.lMin % LADO === 0 && p.lMax % LADO === 0)) out.push('Los largos mínimo y máximo son positivos y múltiplos de 5 m')
  if (!(p.lMin <= p.lMax)) out.push('El largo mínimo no puede superar al máximo')
  if (!(p.pilarMin >= 0)) out.push('El pilar mínimo no puede ser negativo')
  if (p.corte != null && !(p.corte > 0)) out.push('La ley de corte debe ser mayor que cero')
  if (!(eco.precio > p.venta)) out.push('Error de precio: el precio debe superar el costo de venta')
  if (!(p.metrosAcceso >= 0 && p.costoMetro >= 0)) out.push('Los metros de acceso y su costo no pueden ser negativos')
  if (!(p.resistencia > 0 && p.fsMin > 0)) out.push('Faltan la resistencia del pilar y el factor de seguridad exigido')
  if (!(p.superficie > 3900)) out.push('La cota de superficie debe quedar sobre el nivel 3900')
  return out
}

interface Ocupado {
  id: string
  nombre: string
  nivel: number
  x0: number
  x1: number
}
/** Tajeos ya diseñados que cuentan en Reserves UG: los de la mina y los publicados en Designer. */
function ocupados(disenos: Diseno<Datos>[]): Ocupado[] {
  return [
    ...TAJEOS_MINA.map((l) => ({ id: l.id, nombre: l.nombre, nivel: l.nivel, x0: l.caja![0], x1: l.caja![1] })),
    ...disenos
      .map(entrega)
      .flatMap((e) => (e?.datos.tipo === 'tajeo' ? [{ id: e.id, nombre: e.nombre, nivel: Math.floor((e.datos.t.zPiso - 3750) / 50) * 50 + 3750, x0: e.datos.t.x0, x1: e.datos.t.x0 + e.datos.t.largo }] : [])),
  ]
}

/** Corre el optimizador. `sobre` permite repetir la corrida con otro precio o ley de corte (escenarios). */
export function optimizar(p: ParamOptimizador, metodos: Record<string, Metodo>, eco: EcoReservas, disenos: Diseno<Datos>[], sobre: { precio?: number; corte?: number } = {}) {
  const m = metodos[p.metodo]
  const errores = validarOptimizador(p, m, eco)
  if (errores.length) return { ok: false, errores } as const
  const e: Economia = { P: sobre.precio ?? eco.precio, Cv: p.venta, R: eco.recPlanta / 100, Cm: m.costoMina, Cp: eco.costoPlanta, Cg: eco.costoAdm }
  const corteEq = corteEquilibrio(e)
  const corte = sobre.corte ?? p.corte ?? corteEq
  const { ancho, dilucion: anchoExtra } = anchoForma(POTENCIA, m.anchoMin)
  const costoFijo = p.metrosAcceso * p.costoMetro
  const existentes = ocupados(disenos)

  const filas = FILAS.map((nivel) => {
    const cols = columnas(nivel, p.alto, ancho, m.sobre)
    const enFila = existentes.filter((o) => o.nivel === nivel)
    const libre = (a: number, b: number) =>
      conAcceso(tajeoDe(nivel, a, b, p.alto, ancho)) && (!p.respetar || !enFila.some((o) => a < o.x1 + p.pilarMin && b > o.x0 - p.pilarMin))
    const cands = candidatas(String(nivel), cols, e, { lMin: p.lMin, lMax: p.lMax, pilarMin: p.pilarMin, corte, costoFijo, leyEsteril: LEY_ESTERIL }, libre)
    const r = optimizarFila(cands, p.pilarMin)
    const zMedio = nivel + 5 + p.alto / 2
    const sv = sigmaV(2.8, p.superficie - zMedio)
    return { nivel, candidatas: cands.length, sv, enFila, formas: r.formas.sort((a, b) => a.inicio - b.inicio) }
  })

  const formas = filas.flatMap((f) =>
    f.formas.map((x, i) => ({
      ...x,
      id: `SO-${f.nivel + 25}-${String(i + 1).padStart(2, '0')}`,
      clave: `${f.nivel}:${x.inicio}:${x.fin}:${p.alto}:${ancho}`,
      nivel: f.nivel,
      largo: x.fin - x.inicio,
      dilucion: x.tMineral ? (x.tEsteril / x.tMineral) * 100 : 0,
    })),
  )
  type F = (typeof formas)[number]

  // pilares entre excavaciones vecinas de la misma fila donde al menos una es forma nueva
  const pilares = filas.flatMap((f) => {
    const nuevas = formas.filter((x) => x.nivel === f.nivel)
    const todas: { id: string; nombre: string; x0: number; x1: number; nueva: boolean }[] = [
      ...nuevas.map((x) => ({ id: x.id, nombre: x.id, x0: x.inicio, x1: x.fin, nueva: true })),
      ...(p.respetar ? f.enFila.map((o) => ({ ...o, nueva: false })) : []),
    ].sort((a, b) => a.x0 - b.x0)
    return todas.slice(1).flatMap((b, i) => {
      const a = todas[i]
      if (!a.nueva && !b.nueva) return []
      const w = b.x0 - a.x1
      const r = pilarEntre(w, a.x1 - a.x0, b.x1 - b.x0, f.sv, p.resistencia)
      return [{ nivel: f.nivel, a: a.nombre, b: b.nombre, ids: [a.id, b.id], ancho: w, sigmaV: f.sv, ...r, ok: r.fs >= p.fsMin }]
    })
  })
  const flojas = new Set(pilares.filter((x) => !x.ok).flatMap((x) => x.ids))
  const conPilar = formas.map((x) => ({ ...x, pilarBajo: flojas.has(x.id) }))

  const suma = (xs: F[]) => {
    const t = xs.reduce((s, x) => s + x.t, 0)
    const finos = xs.reduce((s, x) => s + x.finos, 0)
    const tMineral = xs.reduce((s, x) => s + x.tMineral, 0)
    return { n: xs.length, valor: xs.reduce((s, x) => s + x.valor, 0), t, finos, ley: t ? finos / t : 0, tMineral, dilucion: tMineral ? ((t - tMineral) / tMineral) * 100 : 0 }
  }
  const total = { ...suma(formas), metros: formas.length * p.metrosAcceso }

  // la disposición actual de la mina con la misma economía, para comparar
  const actual = TAJEOS_MINA.reduce(
    (s, l) => {
      const ev = evaluarTajeo({ ...tajeoDe(l.nivel, l.caja![0], l.caja![1], l.caja![3] - l.caja![2], ancho), zPiso: l.caja![2] }, BLOQUES, {
        densidad: DENSIDAD,
        densidadEsteril: DENSIDAD_ESTERIL,
        leyEsteril: LEY_ESTERIL,
        sobre: m.sobre,
      })
      return { valor: s.valor + valorForma(ev.tDiluido, ev.leyDiluida, e, costoFijo), t: s.t + ev.tDiluido }
    },
    { valor: 0, t: 0 },
  )

  const svMax = Math.max(...filas.map((f) => f.sv))
  return {
    ok: true,
    errores: [] as string[],
    metodo: m,
    e,
    corte,
    corteEq,
    ancho,
    anchoExtra,
    filas,
    formas: conPilar,
    pilares,
    total,
    actual,
    recomendado: pilarRecomendado(p.lMax, svMax, p.resistencia, p.fsMin),
    candidatas: filas.reduce((s, f) => s + f.candidatas, 0),
  } as const
}
export type Corrida = Extract<ReturnType<typeof optimizar>, { ok: true }>
export type FormaOpt = Corrida['formas'][number]

/** Datos de tajeo para Designer UG a partir de una forma: mismo sólido, mismos parámetros de evaluación. */
export const datosDeForma = (f: FormaOpt, p: ParamOptimizador, r: Corrida): DatosTajeo => ({
  tipo: 'tajeo',
  t: tajeoDe(f.nivel, f.inicio, f.fin, p.alto, r.ancho),
  ev: { densidad: DENSIDAD, densidadEsteril: DENSIDAD_ESTERIL, leyEsteril: LEY_ESTERIL, sobre: r.metodo.sobre, pilarMin: p.pilarMin, leyCorte: +r.corte.toFixed(2) },
})

/** Corrida congelada: parámetros y resultado. No se edita; para cambiarla se cargan sus parámetros y se congela otra. */
export interface CorridaGuardada {
  numero: number
  nombre: string
  fecha: string
  autor: string
  parametros: ParamOptimizador
  precio: number
  corte: number
  total: { n: number; valor: number; t: number; ley: number }
  formas: { id: string; nivel: number; inicio: number; fin: number; t: number; ley: number; valor: number }[]
}

export const useOptimizador = create<
  ParamOptimizador & {
    corridas: CorridaGuardada[]
    set: (p: Partial<ParamOptimizador>) => void
    restablecer: () => void
    congelar: (c: Omit<CorridaGuardada, 'numero' | 'fecha' | 'autor' | 'parametros'>) => void
    cargar: (numero: number) => void
  }
>()(
  persist(
    (set, get) => {
      const solo = (s: ParamOptimizador): ParamOptimizador => {
        const out = {} as Record<string, unknown>
        for (const k of Object.keys(PARAM_OPT)) out[k] = s[k as keyof ParamOptimizador]
        return structuredClone(out) as unknown as ParamOptimizador
      }
      return {
        ...PARAM_OPT,
        corridas: [],
        set: (p) => set(p),
        restablecer: () => set(PARAM_OPT),
        congelar: (c) =>
          set((s) => ({ corridas: [...s.corridas, { ...c, numero: s.corridas.length + 1, fecha: new Date().toISOString(), autor: 'Ingeniero senior', parametros: { ...solo(s), corte: c.corte } }] })),
        cargar: (numero) => {
          const c = get().corridas.find((x) => x.numero === numero)
          if (c) set(solo(c.parametros))
        },
      }
    },
    { name: 'codea-planning-ug/optimizador', version: 1 },
  ),
)
