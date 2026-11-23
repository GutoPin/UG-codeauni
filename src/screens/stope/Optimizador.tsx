import { useMemo, useState } from 'react'
import { fmt } from '../../derive'
import { aCSV } from '../../domain/deswik'
import { evaluarTajeo } from '../../domain/designer'
import { BLOQUES, useDisenos } from '../../disenos'
import { datosDeForma, FILAS, optimizar, PARAM_OPT, useOptimizador, type Corrida, type FormaOpt, type ParamOptimizador } from '../../optimizador'
import { useReservas } from '../../reservas'
import { ir } from '../../ruta'
import { Boton, Cabecera, Campo, descargar, Icon, Panel } from '../../ui/kit'
import Escenarios from './Escenarios'

// mismos extremos que el visor 3D (colorLey en Mina3D, que no se importa aquí para no cargar three)
const LEY_MIN = 2.5
const LEY_MAX = 11
const BAJA = [0x3a, 0x26, 0x20]
const ALTA = [0xff, 0xa2, 0x7f]
const colorLey = (g: number) => {
  const k = Math.min(1, Math.max(0, (g - LEY_MIN) / (LEY_MAX - LEY_MIN)))
  return `rgb(${BAJA.map((c, i) => Math.round(c + (ALTA[i] - c) * k)).join(' ')})`
}
const M = (usd: number) => `${fmt(usd / 1e6, 2)} M USD`

// sección longitudinal: x a lo largo del rumbo, z cota
const X0 = -12.5
const X1 = 432.5
const Z0 = 3745
const Z1 = 3905
const W = 900
const H = (W * (Z1 - Z0)) / (X1 - X0)
const sx = (x: number) => ((x - X0) / (X1 - X0)) * W
const sz = (z: number) => H - ((z - Z0) / (Z1 - Z0)) * H

// la capa de bloques no cambia: se arma una vez y no se repinta al pasar el cursor
const CAPA_BLOQUES = BLOQUES.filter((b) => b.x >= X0 && b.x <= X1 && b.z >= Z0 && b.z <= Z1).map((b) => (
  <rect key={`${b.x}|${b.z}`} x={sx(b.x - 2.5)} y={sz(b.z + 2.5)} width={sx(5) - sx(0)} height={sz(0) - sz(5)} fill={colorLey(b.ley)} opacity={0.55} />
))

export default function Optimizador() {
  const p = useOptimizador()
  const { metodos, eco, asignar } = useReservas()
  const { disenos, importar } = useDisenos()
  const params: ParamOptimizador = Object.fromEntries(Object.keys(PARAM_OPT).map((k) => [k, p[k as keyof ParamOptimizador]])) as unknown as ParamOptimizador
  const clave = JSON.stringify(params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const r = useMemo(() => optimizar(params, metodos, eco, disenos), [clave, metodos, eco, disenos])
  const [foco, setFoco] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const campo = (k: keyof ParamOptimizador, l: string, u: string, paso = 1) => (
    <Campo l={l} u={u} paso={paso} v={p[k] as number} onChange={(v) => p.set({ [k]: v })} invalido={!Number.isFinite(p[k] as number)} />
  )
  const metodo = metodos[p.metodo]
  const parametros = (
    <div className="col-span-3 max-[1300px]:col-span-12 space-y-4">
      <Panel titulo="Método y economía" accion={<Boton variante="fant" onClick={p.restablecer}>Restablecer</Boton>}>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="block text-[12px] text-tinta-2 mb-1">Método de minado</span>
            <select value={p.metodo} onChange={(e) => p.set({ metodo: e.target.value })} className="w-full h-8 bg-suelo border border-filete-2 rounded px-2 text-[13px]">
              {Object.values(metodos).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          {metodo && (
            <p className="text-[12px] text-tinta-3">
              Ancho mínimo {fmt(metodo.anchoMin, 1)} m · ELOS {fmt(metodo.sobre, 1)} m por pared · mina {fmt(metodo.costoMina)} USD/t. Precio {fmt(eco.precio)} USD/g,
              planta {fmt(eco.recPlanta)} % y {fmt(eco.costoPlanta)} + {fmt(eco.costoAdm)} USD/t de planta y administración.{' '}
              <button className="underline text-tinta-2 cursor-pointer" onClick={() => ir('/reserves')}>
                Se editan en Reserves UG
              </button>
              .
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {campo('venta', 'Costo de venta', 'USD/g', 0.1)}
            <Campo
              l="Ley de corte"
              u="g/t"
              paso={0.1}
              v={p.corte ?? (r.ok ? +r.corteEq.toFixed(2) : 0)}
              onChange={(v) => p.set({ corte: v })}
              invalido={p.corte != null && !(p.corte > 0)}
            />
          </div>
          <p className="text-[12px] text-tinta-3 flex items-center gap-2">
            {p.corte == null ? (
              'Ley de corte de equilibrio = (Cm + Cp + Cg) / ((P − Cv) × R).'
            ) : (
              <>
                Ley de corte manual.
                <Boton variante="fant" onClick={() => p.set({ corte: null })}>
                  Usar la de equilibrio
                </Boton>
              </>
            )}
          </p>
        </div>
      </Panel>
      <Panel titulo="Dimensiones">
        <div className="p-4 grid grid-cols-2 gap-3">
          {campo('alto', 'Altura del tajeo', 'm', 5)}
          {campo('pilarMin', 'Pilar mínimo', 'm', 2.5)}
          {campo('lMin', 'Largo mínimo', 'm', 5)}
          {campo('lMax', 'Largo máximo', 'm', 5)}
          {campo('metrosAcceso', 'Acceso por forma', 'm', 5)}
          {campo('costoMetro', 'Costo de desarrollo', 'USD/m', 100)}
        </div>
        <label className="px-4 pb-3 flex items-start gap-2 text-[12.5px] text-tinta-2 cursor-pointer">
          <input type="checkbox" checked={p.respetar} onChange={(e) => p.set({ respetar: e.target.checked })} className="accent-coral mt-0.5" />
          Respetar los tajeos ya diseñados (mina y publicados en Designer). Sin esto, la corrida sirve solo para comparar disposiciones.
        </label>
      </Panel>
      <Panel titulo="Pilares">
        <div className="p-4 grid grid-cols-2 gap-3">
          {campo('superficie', 'Cota de superficie', 'm', 10)}
          {campo('resistencia', 'Resistencia del pilar', 'MPa')}
          {campo('fsMin', 'FS exigido', '', 0.1)}
        </div>
        {r.ok && (
          <p className="px-4 pb-3 text-[12px] text-tinta-3">
            {r.recomendado == null ? (
              'Con esa resistencia ningún ancho de pilar alcanza el FS exigido en el nivel más profundo.'
            ) : (
              <>
                Entre dos tajeos de {fmt(p.lMax)} m en el nivel más profundo, el FS exigido pide un pilar de {fmt(r.recomendado, 1)} m.{' '}
                <button className="underline text-tinta-2 cursor-pointer" onClick={() => p.set({ pilarMin: Math.ceil(r.recomendado! / 2.5) * 2.5 })}>
                  Usar {fmt(Math.ceil(r.recomendado / 2.5) * 2.5, 1)} m
                </button>
              </>
            )}
          </p>
        )}
      </Panel>
    </div>
  )

  if (!r.ok)
    return (
      <div className="pb-10">
        <Cabecera titulo="Optimizador de tajeos" detalle="Stope Optimizer" />
        <div className="px-6 grid grid-cols-12 gap-4 items-start">
          {parametros}
          <Panel className="col-span-9 max-[1300px]:col-span-12" titulo="No se puede correr">
            <ul role="alert" className="p-4 space-y-1.5 text-[13px] text-critico">
              {r.errores.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <Icon n="x" className="size-4" /> {e}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    )

  const convertida = (f: FormaOpt) => disenos.find((d) => d.origen === f.clave)
  const convertir = (f: FormaOpt) => {
    if (convertida(f)) return
    const datos = datosDeForma(f, params, r)
    const id = importar(`Forma ${f.id} (Stope Optimizer)`, datos, f.clave)
    asignar(id, p.metodo)
    const ev = evaluarTajeo(datos.t, BLOQUES, datos.ev)
    setAviso(
      `${f.id} pasó a Designer UG como ${id}, en borrador. Diferencia de tonelaje con la forma: ${fmt((Math.abs(ev.tDiluido - f.t) / f.t) * 100, 1)} %. Al publicarlo en Proyecto y versiones entra a Reserves UG y al programa de mina.`,
    )
  }
  const exportar = () =>
    descargar(
      'formas_stope_optimizer.csv',
      '﻿' +
        aCSV(
          r.formas.map((f) => ({
            Forma: f.id,
            Nivel: f.nivel,
            X_desde: f.inicio,
            X_hasta: f.fin,
            Largo_m: f.largo,
            Alto_m: p.alto,
            Ancho_m: r.ancho,
            Toneladas: Math.round(f.t),
            Ley_gt: +f.ley.toFixed(2),
            Dilucion_pct: +f.dilucion.toFixed(1),
            Valor_USD: Math.round(f.valor),
            Pilar_bajo_FS: f.pilarBajo ? 'sí' : 'no',
          })),
        ),
      'text/csv;charset=utf-8',
    )

  return (
    <div className="pb-10">
      <Cabecera titulo="Optimizador de tajeos" detalle="Stope Optimizer · formas por ley de corte sobre el modelo de bloques de la veta, de 5 m">
        <Boton variante="sec" onClick={exportar}>
          Exportar CSV
        </Boton>
      </Cabecera>
      <div className="px-6 space-y-4">
        <div className="grid grid-cols-4 max-[1100px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
          {[
            ['Valor del plan', M(r.total.valor), `${r.total.n} formas de ${fmt(r.candidatas)} candidatas`],
            ['Mineral diluido', `${fmt(r.total.t)} t`, `${fmt(r.total.ley, 2)} g/t · dilución ${fmt(r.total.dilucion, 1)} %`],
            ['Ley de corte', `${fmt(r.corte, 2)} g/t`, p.corte == null ? 'de equilibrio' : `manual · equilibrio ${fmt(r.corteEq, 2)} g/t`],
            ['Desarrollo de acceso', `${fmt(r.total.metros)} m`, r.total.t ? `${fmt(r.total.metros / (r.total.t / 1000), 1)} m por kt` : '—'],
          ].map(([l, v, d]) => (
            <div key={l} className="bg-panel px-4 py-3">
              <div className="rotulo">{l}</div>
              <div className="text-[22px] font-semibold titular mt-1">{v}</div>
              <div className="text-[11.5px] text-tinta-3 mt-0.5">{d}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 items-start">
          {parametros}
          <div className="col-span-9 max-[1300px]:col-span-12 space-y-4">
            <Seccion r={r} p={params} foco={foco} setFoco={setFoco} />
            <Formas r={r} foco={foco} setFoco={setFoco} convertida={convertida} convertir={convertir} respetar={p.respetar} aviso={aviso} />
            <Pilares r={r} fsMin={p.fsMin} />
            <Escenarios r={r} params={params} metodos={metodos} eco={eco} disenos={disenos} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Seccion({ r, p, foco, setFoco }: { r: Corrida; p: ParamOptimizador; foco: string | null; setFoco: (id: string | null) => void }) {
  const vMax = Math.max(1, ...r.formas.map((f) => f.valor))
  const f = r.formas.find((x) => x.id === foco)
  const ex = r.filas.flatMap((x) => x.enFila).find((x) => x.id === foco)
  return (
    <Panel titulo="Sección longitudinal de la veta">
      <p className="px-4 py-2 border-b border-filete text-[12.5px] min-h-[38px] text-tinta-2" aria-live="polite">
        {f ? (
          <>
            <b className="text-tinta font-medium">{f.id}</b> · NV {f.nivel} · x {fmt(f.inicio, 1)} → {fmt(f.fin, 1)} m ({fmt(f.largo)} m) · {fmt(f.t)} t a {fmt(f.ley, 2)} g/t · dilución{' '}
            {fmt(f.dilucion, 1)} % · {M(f.valor)}
            {f.pilarBajo && <span className="text-critico"> · pilar bajo el FS exigido</span>}
          </>
        ) : ex ? (
          <>
            <b className="text-tinta font-medium">{ex.nombre}</b> · tajeo ya diseñado · x {fmt(ex.x0)} → {fmt(ex.x1)} m
          </>
        ) : (
          'Pasa el cursor o el foco por una forma para ver su detalle.'
        )}
      </p>
      <div className="px-4 py-3">
        <svg viewBox={`-62 -6 ${W + 70} ${H + 30}`} className="w-full h-auto block select-none" role="group" aria-label="Formas propuestas sobre el modelo de bloques">
          {CAPA_BLOQUES}
          {[...FILAS, 3900].map((n) => (
            <g key={n}>
              <line x1={0} x2={W} y1={sz(n)} y2={sz(n)} stroke="var(--color-tinta-3)" strokeDasharray="3 4" />
              <text x={-8} y={sz(n) + 4} textAnchor="end" className="fill-tinta-3" fontSize={12}>
                NV {n}
              </text>
            </g>
          ))}
          {r.filas.flatMap((fila) =>
            fila.enFila.map((o) => (
              <rect
                key={o.id}
                x={sx(o.x0)}
                y={sz(o.z1)}
                width={sx(o.x1) - sx(o.x0)}
                height={sz(o.z0) - sz(o.z1)}
                fill="var(--color-suelo)"
                fillOpacity={0.7}
                stroke="var(--color-tinta-3)"
                strokeWidth={foco === o.id ? 2 : 1}
                onMouseEnter={() => setFoco(o.id)}
                onMouseLeave={() => setFoco(null)}
              />
            )),
          )}
          {r.formas.map((x) => {
            const y0 = sz(x.nivel + 5 + p.alto)
            const h = sz(x.nivel + 5) - y0
            return (
              <g
                key={x.id}
                tabIndex={0}
                role="button"
                aria-label={`${x.id}: ${fmt(x.t)} t a ${fmt(x.ley, 2)} g/t, ${M(x.valor)}${x.pilarBajo ? ', pilar bajo el FS exigido' : ''}`}
                onMouseEnter={() => setFoco(x.id)}
                onMouseLeave={() => setFoco(null)}
                onFocus={() => setFoco(x.id)}
                onBlur={() => setFoco(null)}
                className="outline-none"
              >
                <rect
                  x={sx(x.inicio)}
                  y={y0}
                  width={sx(x.fin) - sx(x.inicio)}
                  height={h}
                  fill="#199e70"
                  fillOpacity={0.3 + 0.6 * (x.valor / vMax)}
                  stroke={foco === x.id ? 'var(--color-coral)' : x.pilarBajo ? 'var(--color-critico)' : 'var(--color-tinta)'}
                  strokeWidth={foco === x.id ? 2.5 : 1.25}
                  strokeDasharray={x.pilarBajo && foco !== x.id ? '5 3' : undefined}
                />
                {sx(x.fin) - sx(x.inicio) > 52 && (
                  <text x={(sx(x.inicio) + sx(x.fin)) / 2} y={y0 + h / 2 + 4} textAnchor="middle" fontSize={11} className="fill-tinta pointer-events-none">
                    {x.id.slice(3)}
                  </text>
                )}
              </g>
            )
          })}
          {[0, 100, 200, 300, 400].map((x) => (
            <text key={x} x={sx(x)} y={H + 18} textAnchor="middle" className="fill-tinta-3" fontSize={11}>
              {x} m
            </text>
          ))}
        </svg>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11.5px] text-tinta-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-12 h-2.5 rounded-sm" style={{ background: `linear-gradient(90deg, ${colorLey(LEY_MIN)}, ${colorLey(LEY_MAX)})` }} />
            Ley del bloque {fmt(LEY_MIN, 1)} → {fmt(LEY_MAX)} g/t
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-2.5 rounded-sm bg-aqua/80 ring-1 ring-tinta" /> Forma propuesta (más intensa = más valor)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-2.5 rounded-sm bg-suelo ring-1 ring-tinta-3" /> Tajeo ya diseñado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-2.5 rounded-sm border border-dashed border-critico" /> Pilar bajo el FS exigido
          </span>
        </div>
      </div>
      <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
        Cada nivel es una fila: piso 5 m sobre la galería y {fmt(p.alto)} m de alto. En cada fila se prueban todos los inicios y largos de {fmt(p.lMin)} a{' '}
        {fmt(p.lMax)} m; se quedan las formas con ley diluida ≥ corte, valor positivo y acceso desde la galería, y la programación dinámica elige la mejor
        combinación sin traslape y con {fmt(p.pilarMin, 1)} m de pilar.
      </p>
    </Panel>
  )
}

function Formas({
  r,
  foco,
  setFoco,
  convertida,
  convertir,
  respetar,
  aviso,
}: {
  r: Corrida
  foco: string | null
  setFoco: (id: string | null) => void
  convertida: (f: FormaOpt) => { id: string; publicada: number | null } | undefined
  convertir: (f: FormaOpt) => void
  respetar: boolean
  aviso: string | null
}) {
  return (
    <Panel titulo="Formas y conversión a Designer UG">
      {!respetar && (
        <p className="px-4 py-2.5 border-b border-filete text-[12.5px] text-tinta-2 flex gap-2">
          <Icon n="alerta" className="size-4 text-alerta shrink-0" />
          Corrida para comparar: ignora los tajeos ya diseñados, así que sus formas se traslapan con ellos y no se convierten. Disposición actual de la mina
          con la misma economía: {M(r.actual.valor)} en {fmt(r.actual.t)} t; esta disposición: {M(r.total.valor)} en {fmt(r.total.t)} t, con{' '}
          {r.formas.filter((f) => f.pilarBajo).length} de {r.formas.length} formas junto a un pilar bajo el FS exigido.
        </p>
      )}
      {aviso && (
        <p role="status" className="px-4 py-2.5 border-b border-filete text-[12.5px] text-tinta-2 flex gap-2">
          <Icon n="ok" className="size-4 text-bien shrink-0" /> {aviso}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="text-left rotulo border-b border-filete">
              <th className="px-4 py-2 font-semibold">Forma</th>
              <th className="px-3 py-2 font-semibold text-right">Tramo</th>
              <th className="px-3 py-2 font-semibold text-right">Toneladas</th>
              <th className="px-3 py-2 font-semibold text-right">Ley</th>
              <th className="px-3 py-2 font-semibold text-right">Dilución</th>
              <th className="px-3 py-2 font-semibold text-right">Valor</th>
              <th className="px-3 py-2 font-semibold">Pilar</th>
              <th className="px-4 py-2 font-semibold text-right">Designer UG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {r.formas.map((f) => {
              const d = convertida(f)
              return (
                <tr key={f.id} onMouseEnter={() => setFoco(f.id)} onMouseLeave={() => setFoco(null)} className={foco === f.id ? 'bg-panel-2' : ''}>
                  <td className="px-4 py-1.5">
                    {f.id} <span className="text-tinta-3">· NV {f.nivel}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {fmt(f.inicio, 1)} → {fmt(f.fin, 1)} m
                  </td>
                  <td className="px-3 py-1.5 text-right">{fmt(f.t)} t</td>
                  <td className="px-3 py-1.5 text-right">{fmt(f.ley, 2)} g/t</td>
                  <td className="px-3 py-1.5 text-right">{fmt(f.dilucion, 1)} %</td>
                  <td className="px-3 py-1.5 text-right">{M(f.valor)}</td>
                  <td className="px-3 py-1.5">
                    {f.pilarBajo ? (
                      <span className="inline-flex items-center gap-1 text-critico">
                        <Icon n="alerta" className="size-3.5" /> FS bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-tinta-2">
                        <Icon n="ok" className="size-3.5 text-bien" /> Cumple
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-1 text-right">
                    {d ? (
                      <span className="text-[12px] text-tinta-2">
                        {d.id} · {d.publicada ? `publicado v${d.publicada}` : 'borrador'}
                      </span>
                    ) : (
                      <Boton variante="fant" disabled={!respetar} title={respetar ? undefined : 'Solo para comparar: se traslapa con tajeos existentes'} onClick={() => convertir(f)}>
                        Convertir
                      </Boton>
                    )}
                  </td>
                </tr>
              )
            })}
            <tr className="font-semibold border-t border-filete-2">
              <td className="px-4 py-2">Total</td>
              <td />
              <td className="px-3 py-2 text-right">{fmt(r.total.t)} t</td>
              <td className="px-3 py-2 text-right">{fmt(r.total.ley, 2)} g/t</td>
              <td className="px-3 py-2 text-right">{fmt(r.total.dilucion, 1)} %</td>
              <td className="px-3 py-2 text-right">{M(r.total.valor)}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
        Ancho de la forma {fmt(r.ancho, 1)} m (veta de 5 m{r.anchoExtra ? `, más ${fmt(r.anchoExtra, 1)} m por el ancho mínimo del método` : ''}). Valor = t × (ley ×
        R × (P − Cv) − Cp − Cg − Cm) − acceso × costo por metro, sobre toneladas diluidas. La forma convertida es el mismo sólido: Designer UG y Reserves UG
        dan las mismas toneladas y ley diluidas, y Reserves descuenta después su factor de pilar y la recuperación del método.
      </p>
    </Panel>
  )
}

function Pilares({ r, fsMin }: { r: Corrida; fsMin: number }) {
  return (
    <Panel titulo="Pilares entre tajeos">
      <div className="overflow-x-auto max-h-[320px]">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead className="sticky top-0 bg-panel">
            <tr className="text-left rotulo border-b border-filete">
              <th className="px-4 py-2 font-semibold">Entre</th>
              <th className="px-3 py-2 font-semibold text-right">Ancho</th>
              <th className="px-3 py-2 font-semibold text-right normal-case">σv</th>
              <th className="px-3 py-2 font-semibold text-right">Extracción</th>
              <th className="px-3 py-2 font-semibold text-right normal-case">σp</th>
              <th className="px-4 py-2 font-semibold">FS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {r.pilares.map((x) => (
              <tr key={x.ids.join()}>
                <td className="px-4 py-1.5">
                  {x.a} · {x.b} <span className="text-tinta-3">· NV {x.nivel}</span>
                </td>
                <td className="px-3 py-1.5 text-right">{fmt(x.ancho, 1)} m</td>
                <td className="px-3 py-1.5 text-right">{fmt(x.sigmaV, 1)} MPa</td>
                <td className="px-3 py-1.5 text-right">{fmt(x.e * 100)} %</td>
                <td className="px-3 py-1.5 text-right">{fmt(x.sigmaP, 1)} MPa</td>
                <td className="px-4 py-1.5">
                  <span className={`inline-flex items-center gap-1 ${x.ok ? '' : 'text-critico'}`}>
                    <Icon n={x.ok ? 'ok' : 'alerta'} className={`size-3.5 ${x.ok ? 'text-bien' : ''}`} /> {fmt(x.fs, 2)} {x.ok ? 'cumple' : `bajo ${fmt(fsMin, 1)}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
        Área tributaria: σv = densidad × g × profundidad; extracción e = largo medio / (largo medio + pilar); σp = σv / (1 − e); FS = resistencia / σp. La
        resistencia la aporta el geomecánico; la profundidad sale de la cota de superficie supuesta.
      </p>
    </Panel>
  )
}
