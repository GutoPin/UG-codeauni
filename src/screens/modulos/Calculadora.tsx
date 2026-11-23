import { useState, type ReactNode } from 'react'
import { fmt } from '../../derive'
import * as m from '../../domain/modulos'
import { Cabecera, Icon, Panel } from '../../ui/kit'

export interface Modulo {
  id: string
  nombre: string
  ola: number
}
export const MODULOS: Modulo[] = [
  { id: 'designer', nombre: 'Designer UG', ola: 3 },
  { id: 'reserves', nombre: 'Reserves UG', ola: 3 },
  { id: 'scheduler', nombre: 'Scheduler UG', ola: 3 },
  { id: 'stope', nombre: 'Stope Optimizer', ola: 4 },
  { id: 'blend', nombre: 'Blend UG', ola: 4 },
  { id: 'cave', nombre: 'Cave Planner', ola: 4 },
]

type X = Record<string, number>
interface Entrada {
  k: string
  l: string
  u?: string
  v: number
  paso?: number
}
interface Salida {
  l: string
  v: number | string
  u?: string
  d?: number
}
interface Calculo {
  titulo: string
  formula: string
  entradas: Entrada[]
  calcular: (x: X) => Salida[]
  /** Caso de prueba de la ficha: se ejecuta en vivo contra la fórmula, no es un resultado fijo. */
  prueba: { texto: string; ok: () => boolean }
}
const cerca = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

const FICHAS: Record<string, { resuelve: string; ficha: string; calculos: Calculo[] }> = {
  designer: {
    resuelve: 'CAD minero subterráneo: rampas, galerías y tajeos. Aquí, las fórmulas de geometría que el diseño usará por debajo.',
    ficha: '02_Designer_UG.md',
    calculos: [
      {
        titulo: 'Sección en herradura',
        formula: 'A = w × hₚ + π w² / 8',
        entradas: [
          { k: 'w', l: 'Ancho w', u: 'm', v: 4, paso: 0.1 },
          { k: 'hp', l: 'Altura de pared hₚ', u: 'm', v: 3, paso: 0.1 },
        ],
        calcular: (x) => [{ l: 'Área', v: m.areaHerradura(x.w, x.hp), u: 'm²', d: 2 }],
        prueba: { texto: 'w 4 m, hₚ 3 m → 18,28 m²', ok: () => cerca(m.areaHerradura(4, 3), 18.28, 0.005) },
      },
      {
        titulo: 'Tramo recto de rampa',
        formula: 'Δz = L × g / 100 · error si g > g máx',
        entradas: [
          { k: 'L', l: 'Largo horizontal', u: 'm', v: 100 },
          { k: 'g', l: 'Gradiente', u: '%', v: 12, paso: 0.5 },
          { k: 'gMax', l: 'Gradiente máximo', u: '%', v: 15, paso: 0.5 },
        ],
        calcular: (x) => [{ l: 'Desnivel', v: m.desnivelRampa(x.L, x.g, x.gMax), u: 'm', d: 2 }],
        prueba: {
          texto: '100 m a 12 % → 12 m; con máxima 10 % → error',
          ok: () => {
            try {
              m.desnivelRampa(100, 12, 10)
              return false
            } catch {
              return m.desnivelRampa(100, 12, 15) === 12
            }
          },
        },
      },
      {
        titulo: 'Curva de rampa',
        formula: 'arco = R × θ · Δz = arco × g / 100',
        entradas: [
          { k: 'R', l: 'Radio', u: 'm', v: 15 },
          { k: 'th', l: 'Ángulo', u: '°', v: 180, paso: 5 },
          { k: 'g', l: 'Gradiente', u: '%', v: 12, paso: 0.5 },
        ],
        calcular: (x) => {
          const c = m.curvaRampa(x.R, x.th, x.g)
          return [
            { l: 'Largo de arco', v: c.arco, u: 'm', d: 1 },
            { l: 'Desnivel', v: c.desnivel, u: 'm', d: 2 },
          ]
        },
        prueba: { texto: 'R 15 m, 180°, 12 % → 47,1 m y 5,65 m', ok: () => cerca(m.curvaRampa(15, 180, 12).arco, 47.1, 0.05) && cerca(m.curvaRampa(15, 180, 12).desnivel, 5.65, 0.005) },
      },
      {
        titulo: 'Tajeo paramétrico',
        formula: 't = largo × ancho × alto × densidad',
        entradas: [
          { k: 'l', l: 'Largo', u: 'm', v: 30 },
          { k: 'a', l: 'Ancho', u: 'm', v: 8, paso: 0.5 },
          { k: 'h', l: 'Alto', u: 'm', v: 25 },
          { k: 'd', l: 'Densidad', u: 't/m³', v: 2.9, paso: 0.1 },
        ],
        calcular: (x) => [{ l: 'Tonelaje', v: m.tonelajeTajeo(x.l, x.a, x.h, x.d), u: 't' }],
        prueba: { texto: '30 × 8 × 25 a 2,9 → 17 400 t', ok: () => cerca(m.tonelajeTajeo(30, 8, 25, 2.9), 17400, 1e-6) },
      },
      {
        titulo: 'Interferencia entre labores',
        formula: 'distancia entre ejes − semisecciones < pilar mínimo',
        entradas: [
          { k: 'dist', l: 'Distancia entre ejes', u: 'm', v: 5, paso: 0.5 },
          { k: 'a1', l: 'Ancho labor 1', u: 'm', v: 4, paso: 0.5 },
          { k: 'a2', l: 'Ancho labor 2', u: 'm', v: 4, paso: 0.5 },
          { k: 'p', l: 'Pilar mínimo', u: 'm', v: 3, paso: 0.5 },
        ],
        calcular: (x) => [
          { l: 'Pilar real', v: x.dist - x.a1 / 2 - x.a2 / 2, u: 'm', d: 1 },
          { l: 'Resultado', v: m.hayInterferencia(x.dist, x.a1, x.a2, x.p) ? 'Interfieren' : 'Sin interferencia' },
        ],
        prueba: { texto: 'ejes a 5 m, secciones de 4 m, pilar 3 m → interfieren', ok: () => m.hayInterferencia(5, 4, 4, 3) },
      },
    ],
  },
  reserves: {
    resuelve: 'Tonelaje, ley y categoría por labor sobre los diseños, con dilución y recuperación de veta angosta.',
    ficha: '03_Reserves_UG.md',
    calculos: [
      {
        titulo: 'Ancho de minado y dilución',
        formula: 'ancho = máx(veta, mínimo) · dilución = (ancho − veta) / veta',
        entradas: [
          { k: 'veta', l: 'Potencia de veta', u: 'm', v: 0.6, paso: 0.05 },
          { k: 'min', l: 'Ancho mínimo de minado', u: 'm', v: 1.2, paso: 0.05 },
        ],
        calcular: (x) => {
          const a = m.anchoMinado(x.veta, x.min)
          return [
            { l: 'Ancho de minado', v: a, u: 'm', d: 2 },
            { l: 'Dilución planificada', v: m.dilucionPlanificada(a, x.veta), u: '%', d: 1 },
          ]
        },
        prueba: { texto: 'veta 0,6 m, mínimo 1,2 m → 1,2 m y 100 %', ok: () => m.anchoMinado(0.6, 1.2) === 1.2 && cerca(m.dilucionPlanificada(1.2, 0.6), 100, 1e-6) },
      },
      {
        titulo: 'Mineral diluido y recuperado',
        formula: 't dil = t × (1 + D) · ley = (t × ley + t D × ley desm.) / t dil',
        entradas: [
          { k: 't', l: 'Mineral in situ', u: 't', v: 1000, paso: 50 },
          { k: 'ley', l: 'Ley', u: 'g/t', v: 8, paso: 0.1 },
          { k: 'D', l: 'Dilución', u: '%', v: 25 },
          { k: 'ld', l: 'Ley del desmonte', u: 'g/t', v: 0, paso: 0.1 },
          { k: 'rec', l: 'Recuperación de minado', u: '%', v: 85 },
        ],
        calcular: (x) => {
          const d = m.mineralDiluido(x.t, x.ley, x.D, x.ld)
          return [
            { l: 'Mineral diluido', v: d.t, u: 't' },
            { l: 'Ley diluida', v: d.ley, u: 'g/t', d: 2 },
            { l: 'Mineral recuperado', v: m.mineralRecuperado(d.t, x.rec), u: 't', d: 1 },
          ]
        },
        prueba: {
          texto: '1 000 t a 8,0 con 25 % → 1 250 t a 6,4; al 85 % → 1 062,5 t',
          ok: () => {
            const d = m.mineralDiluido(1000, 8, 25, 0)
            return d.t === 1250 && cerca(d.ley, 6.4, 1e-6) && cerca(m.mineralRecuperado(1250, 85), 1062.5, 1e-6)
          },
        },
      },
      {
        titulo: 'Ley de corte',
        formula: 'ley corte = costo / (precio × recuperación planta)',
        entradas: [
          { k: 'c', l: 'Costo total', u: 'US$/t', v: 105 },
          { k: 'p', l: 'Precio', u: 'US$/g', v: 65 },
          { k: 'r', l: 'Recuperación planta', u: '', v: 0.9, paso: 0.01 },
          { k: 'ley', l: 'Ley del bloque', u: 'g/t', v: 1.5, paso: 0.1 },
        ],
        calcular: (x) => {
          const lc = m.leyCorte(x.c, x.p, x.r)
          return [
            { l: 'Ley de corte', v: lc, u: 'g/t', d: 2 },
            { l: 'Bloque', v: x.ley >= lc ? 'Entra a reservas' : 'No entra' },
          ]
        },
        prueba: { texto: '105 / (65 × 0,90) → 1,79 g/t; 1,5 g/t no entra', ok: () => cerca(m.leyCorte(105, 65, 0.9), 1.79, 0.005) && 1.5 < m.leyCorte(105, 65, 0.9) },
      },
      {
        titulo: 'Pilar dejado',
        formula: 'dejado = t × factor · evaluable = t − dejado',
        entradas: [
          { k: 't', l: 'Tajeo', u: 't', v: 15660, paso: 10 },
          { k: 'f', l: 'Factor de pilar', u: '%', v: 10 },
        ],
        calcular: (x) => {
          const p = m.pilar(x.t, x.f)
          return [
            { l: 'Dejado en pilar', v: p.dejado, u: 't' },
            { l: 'Evaluable', v: p.evaluable, u: 't' },
          ]
        },
        prueba: { texto: '10 % de 15 660 t → 1 566 y 14 094 t', ok: () => cerca(m.pilar(15660, 10).dejado, 1566, 1e-6) && cerca(m.pilar(15660, 10).evaluable, 14094, 1e-6) },
      },
    ],
  },
  scheduler: {
    resuelve: 'Programa de mediano y largo plazo con Gantt, recursos y ruta crítica.',
    ficha: '04_Scheduler_UG.md',
    calculos: [
      {
        titulo: 'Duración de una labor',
        formula: 'días = cantidad / (rendimiento × disponibilidad)',
        entradas: [
          { k: 'q', l: 'Cantidad', u: 'm', v: 120 },
          { k: 'r', l: 'Rendimiento', u: 'm/día', v: 4.5, paso: 0.1 },
          { k: 'd', l: 'Disponibilidad', u: '', v: 0.85, paso: 0.01 },
        ],
        calcular: (x) => [{ l: 'Duración', v: m.duracion(x.q, x.r, x.d), u: 'días', d: 1 }],
        prueba: { texto: '120 m a 4,5 m/día con 0,85 → 31,4 días', ok: () => cerca(m.duracion(120, 4.5, 0.85), 31.4, 0.05) },
      },
    ],
  },
  stope: {
    resuelve: 'Formas óptimas de tajeo por ley de corte, con dilución por paredes y pilares estables.',
    ficha: '05_Stope_Optimizer.md',
    calculos: [
      {
        titulo: 'Ley de corte de equilibrio',
        formula: '(C mina + C planta + C G&A) / ((P − C venta) × R)',
        entradas: [
          { k: 'cm', l: 'Costo mina', u: 'US$/t', v: 35 },
          { k: 'cp', l: 'Costo planta', u: 'US$/t', v: 18 },
          { k: 'cg', l: 'Costo G&A', u: 'US$/t', v: 7 },
          { k: 'p', l: 'Precio', u: 'US$/g', v: 60 },
          { k: 'cv', l: 'Costo de venta', u: 'US$/g', v: 0.5, paso: 0.1 },
          { k: 'r', l: 'Recuperación', u: '', v: 0.9, paso: 0.01 },
        ],
        calcular: (x) => [{ l: 'Ley de corte', v: m.leyCorteEquilibrio(x.cm, x.cp, x.cg, x.p, x.cv, x.r), u: 'g/t', d: 2 }],
        prueba: { texto: '35 + 18 + 7 con 60 − 0,5 y 0,90 → 1,12 g/t', ok: () => cerca(m.leyCorteEquilibrio(35, 18, 7, 60, 0.5, 0.9), 1.12, 0.005) },
      },
      {
        titulo: 'Dilución por paredes (ELOS)',
        formula: 't = área de pared × ELOS × paredes × densidad',
        entradas: [
          { k: 'a', l: 'Área de pared', u: 'm²', v: 400, paso: 10 },
          { k: 'e', l: 'ELOS', u: 'm', v: 0.5, paso: 0.05 },
          { k: 'd', l: 'Densidad', u: 't/m³', v: 2.8, paso: 0.1 },
        ],
        calcular: (x) => [{ l: 'Dilución', v: m.dilucionELOS(x.a, x.e, x.d), u: 't' }],
        prueba: { texto: '400 m², ELOS 0,5, 2,8 → 1 120 t', ok: () => cerca(m.dilucionELOS(400, 0.5, 2.8), 1120, 1e-6) },
      },
      {
        titulo: 'Esfuerzo y factor de seguridad del pilar',
        formula: 'σp = σv / (1 − e) · FS = resistencia / σp',
        entradas: [
          { k: 's', l: 'Esfuerzo vertical σv', u: 'MPa', v: 12 },
          { k: 'e', l: 'Extracción e', u: '', v: 0.6, paso: 0.05 },
          { k: 'c', l: 'Resistencia del pilar', u: 'MPa', v: 45 },
        ],
        calcular: (x) => {
          const p = m.esfuerzoPilar(x.s, x.e, x.c)
          return [
            { l: 'Esfuerzo en pilar', v: p.sigmaP, u: 'MPa', d: 1 },
            { l: 'Factor de seguridad', v: p.fs, u: '', d: 2 },
          ]
        },
        prueba: { texto: 'σv 12, e 0,6 → σp 30 MPa; resistencia 45 → FS 1,5', ok: () => cerca(m.esfuerzoPilar(12, 0.6, 45).sigmaP, 30, 1e-6) && cerca(m.esfuerzoPilar(12, 0.6, 45).fs, 1.5, 1e-6) },
      },
    ],
  },
  blend: {
    resuelve: 'Mezcla y alimentación a planta: ley, dureza y contaminantes por periodo, con la capacidad de pique y chimeneas.',
    ficha: '06_Blend_UG.md',
    calculos: [
      {
        titulo: 'Ley de la mezcla',
        formula: 'ley = Σ(t × ley) / Σ t',
        entradas: [
          { k: 't1', l: 'Fuente 1', u: 't', v: 400, paso: 10 },
          { k: 'v1', l: 'Ley fuente 1', u: 'g/t', v: 9, paso: 0.1 },
          { k: 't2', l: 'Fuente 2', u: 't', v: 600, paso: 10 },
          { k: 'v2', l: 'Ley fuente 2', u: 'g/t', v: 5, paso: 0.1 },
        ],
        calcular: (x) => [
          { l: 'Ley de la mezcla', v: m.ponderado([{ t: x.t1, v: x.v1 }, { t: x.t2, v: x.v2 }]), u: 'g/t', d: 2 },
          { l: 'Total', v: x.t1 + x.t2, u: 't' },
        ],
        prueba: {
          texto: '400 t a 9,0 + 600 t a 5,0 → 6,6 g/t (mismo cálculo: 0,5 % As y 15,2 kWh/t)',
          ok: () =>
            cerca(m.ponderado([{ t: 400, v: 9 }, { t: 600, v: 5 }]), 6.6, 1e-6) &&
            cerca(m.ponderado([{ t: 500, v: 0.8 }, { t: 500, v: 0.2 }]), 0.5, 1e-6) &&
            cerca(m.ponderado([{ t: 600, v: 14 }, { t: 400, v: 17 }]), 15.2, 1e-6),
        },
      },
      {
        titulo: 'Pique y camiones',
        formula: 'capacidad = t/h × horas × disponibilidad · camiones = ⌈t / (cap × viajes)⌉',
        entradas: [
          { k: 'tph', l: 'Pique', u: 't/h', v: 90 },
          { k: 'h', l: 'Horas por guardia', u: 'h', v: 6 },
          { k: 'd', l: 'Disponibilidad', u: '', v: 0.85, paso: 0.01 },
          { k: 'q', l: 'Tonelaje a transportar', u: 't', v: 460, paso: 10 },
          { k: 'cap', l: 'Capacidad del camión', u: 't', v: 12 },
          { k: 'v', l: 'Viajes por camión', u: '', v: 10 },
        ],
        calcular: (x) => [
          { l: 'Capacidad del pique', v: m.capacidadPique(x.tph, x.h, x.d), u: 't', d: 0 },
          { l: 'Camiones necesarios', v: m.camionesNecesarios(x.q, x.cap, x.v), u: '' },
        ],
        prueba: { texto: '90 t/h × 6 h × 0,85 → 459 t; 460 t con 12 t × 10 viajes → 4 camiones', ok: () => cerca(m.capacidadPique(90, 6, 0.85), 459, 1e-6) && m.camionesNecesarios(460, 12, 10) === 4 },
      },
      {
        titulo: 'Chimenea de traspaso',
        formula: 'ingreso admitido = mín(ingreso, capacidad − nivel + extracción)',
        entradas: [
          { k: 'c', l: 'Capacidad', u: 't', v: 800, paso: 10 },
          { k: 'n', l: 'Nivel actual', u: 't', v: 700, paso: 10 },
          { k: 'i', l: 'Ingreso pedido', u: 't', v: 300, paso: 10 },
          { k: 'e', l: 'Extracción', u: 't', v: 0, paso: 10 },
        ],
        calcular: (x) => {
          const a = m.ingresoChimenea(x.c, x.n, x.i, x.e)
          return [
            { l: 'Ingreso admitido', v: a, u: 't' },
            { l: 'Rechazado', v: x.i - a, u: 't' },
          ]
        },
        prueba: { texto: '800 t con 700 t e ingreso de 300 t → solo 100 t', ok: () => m.ingresoChimenea(800, 700, 300, 0) === 100 },
      },
    ],
  },
  cave: {
    resuelve: 'Minería por hundimiento: huella, tiraje por punto de extracción y programa. Solo bajo demanda.',
    ficha: '07_Cave_Planner.md',
    calculos: [
      {
        titulo: 'Columna sobre un punto de extracción',
        formula: 't = alto × lado × lado × densidad · entrada de dilución al % de extracción',
        entradas: [
          { k: 'h', l: 'Altura de columna', u: 'm', v: 60 },
          { k: 'a', l: 'Lado 1', u: 'm', v: 15 },
          { k: 'b', l: 'Lado 2', u: 'm', v: 15 },
          { k: 'd', l: 'Densidad', u: 't/m³', v: 2.7, paso: 0.1 },
          { k: 'pd', l: 'Entrada de dilución', u: '%', v: 70 },
        ],
        calcular: (x) => {
          const t = m.tonelajeColumna(x.h, x.a, x.b, x.d)
          return [
            { l: 'Tonelaje de columna', v: t, u: 't' },
            { l: 'Entra dilución a las', v: (t * x.pd) / 100, u: 't' },
          ]
        },
        prueba: { texto: '60 × 15 × 15 a 2,7 → 36 450 t; al 70 % → 25 515 t', ok: () => cerca(m.tonelajeColumna(60, 15, 15, 2.7), 36450, 1e-6) && cerca(m.tonelajeColumna(60, 15, 15, 2.7) * 0.7, 25515, 1e-6) },
      },
      {
        titulo: 'Radio hidráulico de la huella',
        formula: 'RH = área / perímetro',
        entradas: [
          { k: 'l', l: 'Largo', u: 'm', v: 200, paso: 10 },
          { k: 'a', l: 'Ancho', u: 'm', v: 200, paso: 10 },
        ],
        calcular: (x) => [{ l: 'Radio hidráulico', v: m.radioHidraulico(x.l, x.a), u: 'm', d: 1 }],
        prueba: { texto: 'huella 200 × 200 → 50 m', ok: () => m.radioHidraulico(200, 200) === 50 },
      },
    ],
  },
}

function Insignia({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span className={`inline-flex items-start gap-1.5 text-[12px] ${ok ? 'text-bien' : 'text-critico'}`}>
      <Icon n={ok ? 'ok' : 'x'} className="size-3.5 mt-px shrink-0" />
      <span>
        <b className="font-semibold">{ok ? 'Caso de la ficha correcto' : 'Caso de la ficha falla'}</b>
        <span className="text-tinta-3"> · {texto}</span>
      </span>
    </span>
  )
}

function Tarjeta({ c }: { c: Calculo }) {
  const base = Object.fromEntries(c.entradas.map((e) => [e.k, e.v]))
  const [x, setX] = useState<X>(base)
  const cambiado = c.entradas.some((e) => x[e.k] !== e.v)
  let salidas: Salida[] = []
  let error: string | null = null
  try {
    salidas = c.calcular(x)
    if (salidas.some((s) => typeof s.v === 'number' && !Number.isFinite(s.v))) error = 'Revisa las entradas: el resultado no es un número.'
  } catch (e) {
    error = (e as Error).message
  }
  const ok = c.prueba.ok()

  return (
    <Panel
      titulo={c.titulo}
      accion={
        cambiado && (
          <button className="text-[12px] text-tinta-3 hover:text-tinta cursor-pointer" onClick={() => setX(base)}>
            Volver al caso de la ficha
          </button>
        )
      }
    >
      <div className="px-4 pt-2.5 text-[12.5px] text-tinta-3">{c.formula}</div>
      <div className="grid grid-cols-[1fr_auto] max-[700px]:grid-cols-1 gap-x-6 gap-y-4 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {c.entradas.map((e) => (
            <label key={e.k} className="block">
              <span className="block text-[12px] text-tinta-2 mb-1 truncate">{e.l}</span>
              <span className="flex items-center bg-suelo border border-filete-2 rounded h-9 focus-within:border-coral">
                <input
                  type="number"
                  step={e.paso ?? 1}
                  value={Number.isNaN(x[e.k]) ? '' : x[e.k]}
                  onChange={(ev) => setX({ ...x, [e.k]: ev.target.valueAsNumber })}
                  className="w-full min-w-0 h-full bg-transparent px-2.5 text-[14px] outline-none"
                />
                {e.u && <span className="pr-2.5 text-[12px] text-tinta-3 whitespace-nowrap">{e.u}</span>}
              </span>
            </label>
          ))}
        </div>
        <div className="min-w-[200px] border-l border-filete pl-6 max-[700px]:border-l-0 max-[700px]:pl-0 space-y-2.5" aria-live="polite">
          {error ? (
            <p className="text-critico text-[13px] flex gap-1.5">
              <Icon n="alerta" className="size-4 shrink-0" /> {error}
            </p>
          ) : (
            salidas.map((s, i) => (
              <div key={s.l}>
                <div className="rotulo">{s.l}</div>
                <div className={`titular ${i === 0 ? 'text-[26px]' : 'text-[18px]'}`}>
                  {typeof s.v === 'number' ? fmt(s.v, s.d ?? 0) : s.v}
                  {s.u && <span className="text-[13px] text-tinta-3 font-normal"> {s.u}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-filete">
        <Insignia ok={ok} texto={c.prueba.texto} />
      </div>
    </Panel>
  )
}

const RED_FICHA: m.Actividad[] = [
  { id: 'A', dur: 5, pred: [] },
  { id: 'B', dur: 3, pred: ['A'] },
  { id: 'C', dur: 4, pred: ['A'] },
  { id: 'D', dur: 2, pred: ['B', 'C'] },
]
function pruebaCPM() {
  const c = m.cpm(RED_FICHA)
  if (!(c.fin === 11 && c.critica.join('-') === 'A-C-D' && c.r.B.holgura === 1)) return false
  try {
    m.cpm([{ id: 'A', dur: 1, pred: ['B'] }, { id: 'B', dur: 1, pred: ['A'] }])
    return false
  } catch {
    return true
  }
}
const FORMAS_FICHA: m.Forma[] = [
  { id: '1', inicio: 0, fin: 10, valor: 10 },
  { id: '2', inicio: 5, fin: 15, valor: 8 },
  { id: '3', inicio: 20, fin: 30, valor: 12 },
]
function pruebaDP() {
  const c = m.seleccionarFormas(FORMAS_FICHA)
  return c.valor === 22 && c.formas.map((f) => f.id).join() === '1,3'
}

/** Red de actividades editable con ruta crítica (CPM) y mini-Gantt. */
function RedCPM() {
  const [acts, setActs] = useState(RED_FICHA)
  const [ciclo, setCiclo] = useState(false)
  const red = ciclo ? acts.map((a) => (a.id === 'A' ? { ...a, pred: ['D'] } : a)) : acts
  let r: ReturnType<typeof m.cpm> | null = null
  let error: string | null = null
  try {
    r = m.cpm(red)
  } catch (e) {
    error = (e as Error).message
  }
  const ok = pruebaCPM()
  const escala = r ? 100 / Math.max(r.fin, 1) : 0

  return (
    <Panel titulo="Ruta crítica (CPM)" accion={<label className="text-[12px] text-tinta-2 inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-coral" checked={ciclo} onChange={(e) => setCiclo(e.target.checked)} />Probar dependencia circular (A depende de D)</label>}>
      <div className="p-4 space-y-2">
        {red.map((a) => {
          const x = r?.r[a.id]
          const critica = r?.critica.includes(a.id)
          return (
            <div key={a.id} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-[13px]">
              <label className="flex items-center gap-2">
                <span className="w-24">
                  Actividad <b>{a.id}</b>
                  <span className="block text-[11px] text-tinta-3">{a.pred.length ? `después de ${a.pred.join(', ')}` : 'inicio'}</span>
                </span>
                <input
                  type="number"
                  min={1}
                  aria-label={`Duración ${a.id} en días`}
                  value={a.dur}
                  onChange={(e) => setActs(acts.map((y) => (y.id === a.id ? { ...y, dur: Math.max(0, e.target.valueAsNumber || 0) } : y)))}
                  className="w-14 h-8 bg-suelo border border-filete-2 rounded px-2 text-right"
                />
              </label>
              <div className="relative h-7 bg-suelo rounded-sm">
                {x && (
                  <>
                    <div className="absolute inset-y-0 rounded-sm" style={{ left: `${x.es * escala}%`, width: `${(x.ef - x.es) * escala}%`, background: critica ? 'var(--color-azul)' : 'var(--color-tinta-3)' }} />
                    {x.holgura > 0 && (
                      <div className="absolute inset-y-2 border border-dashed border-tinta-3 rounded-sm" style={{ left: `${x.ef * escala}%`, width: `${x.holgura * escala}%` }} />
                    )}
                  </>
                )}
              </div>
              <span className="text-[12px] text-tinta-2">{x ? `días ${x.es}–${x.ef}${x.holgura ? ` · holgura ${x.holgura}` : ' · crítica'}` : '—'}</span>
            </div>
          )
        })}
        {error ? (
          <p className="text-critico text-[13px] flex items-center gap-1.5 pt-1">
            <Icon n="alerta" className="size-4" /> {error}: la red no se puede programar.
          </p>
        ) : (
          <p className="text-[13px] text-tinta-2 pt-1">
            Ruta crítica <b className="text-tinta">{r!.critica.join(' → ')}</b> · fin en <b className="text-tinta">{r!.fin} días</b>
          </p>
        )}
        <div className="flex gap-4 text-[12px] text-tinta-3 pt-1">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-azul" />Crítica</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-tinta-3" />Con holgura</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-4 h-2.5 rounded-sm border border-dashed border-tinta-3" />Holgura</span>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-filete">
        <Insignia ok={ok} texto="A 5, B 3, C 4, D 2 → ruta A-C-D de 11 días, holgura de B = 1; ciclo A-B-A rechazado" />
      </div>
    </Panel>
  )
}

/** Selección de formas de tajeo sin traslape, por programación dinámica. */
function FormasDP() {
  const [formas, setFormas] = useState(FORMAS_FICHA)
  const [pilarMin, setPilarMin] = useState(0)
  const r = m.seleccionarFormas(formas, pilarMin)
  const ok = pruebaDP()
  const elegida = new Set(r.formas.map((f) => f.id))

  return (
    <Panel titulo="Formas sin traslape (programación dinámica)">
      <div className="p-4">
        {/* viewBox en píxeles con altura fija: el texto no escala con el ancho */}
        <svg viewBox="-10 0 1060 150" preserveAspectRatio="xMinYMid meet" className="w-full h-[150px]" role="img" aria-label="Formas candidatas a lo largo del rumbo; resaltadas las elegidas">
          {[0, 10, 20, 30].map((v) => (
            <g key={v}>
              <line x1={v * 34} x2={v * 34} y1={4} y2={124} stroke="var(--color-filete)" />
              <text x={v * 34} y={142} fontSize={12} textAnchor={v === 30 ? 'end' : 'middle'} className="fill-tinta-3">{v} m</text>
            </g>
          ))}
          {formas.map((f, i) => (
            <g key={f.id}>
              <rect x={f.inicio * 34} y={8 + i * 38} width={(f.fin - f.inicio) * 34} height={30} rx={3} fill={elegida.has(f.id) ? 'color-mix(in oklab, var(--color-azul) 55%, var(--color-panel))' : 'var(--color-panel-2)'} stroke={elegida.has(f.id) ? 'var(--color-azul)' : 'var(--color-filete-2)'} />
              <text x={f.inicio * 34 + 10} y={28 + i * 38} fontSize={13} className="fill-tinta" fontWeight={600}>
                Forma {f.id} · {f.valor} k US${elegida.has(f.id) ? ' · elegida' : ''}
              </text>
            </g>
          ))}
        </svg>
        <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-3 mt-3">
          {formas.map((f) => (
            <label key={f.id} className="block text-[12px]">
              <span className="text-tinta-2">Valor forma {f.id} (k US$)</span>
              <input type="number" value={f.valor} onChange={(e) => setFormas(formas.map((y) => (y.id === f.id ? { ...y, valor: e.target.valueAsNumber || 0 } : y)))} className="mt-1 w-full h-8 bg-suelo border border-filete-2 rounded px-2" />
            </label>
          ))}
          <label className="block text-[12px]">
            <span className="text-tinta-2">Pilar mínimo (m)</span>
            <input type="number" min={0} value={pilarMin} onChange={(e) => setPilarMin(Math.max(0, e.target.valueAsNumber || 0))} className="mt-1 w-full h-8 bg-suelo border border-filete-2 rounded px-2" />
          </label>
        </div>
        <p className="text-[13px] text-tinta-2 mt-3">
          Elige <b className="text-tinta">{r.formas.map((f) => `forma ${f.id}`).join(' y ') || 'ninguna'}</b> con un valor de <b className="text-tinta">{fmt(r.valor)} k US$</b>.
        </p>
      </div>
      <div className="px-4 py-2.5 border-t border-filete">
        <Insignia ok={ok} texto="valores 10, 8 y 12 con 1 y 2 traslapadas → elige 1 y 3 = 22" />
      </div>
    </Panel>
  )
}

const EXTRA: Record<string, { vista: ReactNode; ok: () => boolean }> = {
  scheduler: { vista: <RedCPM />, ok: pruebaCPM },
  stope: { vista: <FormasDP />, ok: pruebaDP },
}

export default function Calculadora({ modulo }: { modulo: Modulo }) {
  const f = FICHAS[modulo.id]
  const extra = EXTRA[modulo.id]
  const total = f.calculos.length + (extra ? 1 : 0)
  const verdes = f.calculos.filter((c) => c.prueba.ok()).length + (extra?.ok() ? 1 : 0)
  return (
    <div className="pb-10">
      <Cabecera titulo={modulo.nombre} detalle={`Ola ${modulo.ola} · ${f.resuelve}`}>
        <span className="text-[12.5px] text-tinta-2 inline-flex items-center gap-1.5">
          <Icon n={verdes === total ? 'ok' : 'alerta'} className={`size-4 ${verdes === total ? 'text-bien' : 'text-critico'}`} /> {verdes} de {total} casos de la ficha correctos
        </span>
      </Cabecera>
      <div className="px-6 space-y-4 max-w-[1200px]">
        <p className="text-[12.5px] text-tinta-3 -mt-1">
          Calculadora de la ficha <span className="text-tinta-2">{f.ficha}</span>. El módulo completo (diseño, interfaz y flujo) llega en su ola; aquí se adelantan sus fórmulas con pruebas.
        </p>
        {extra?.vista}
        <div className="grid grid-cols-2 max-[1300px]:grid-cols-1 gap-4">
          {f.calculos.map((c) => (
            <Tarjeta key={c.titulo} c={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
