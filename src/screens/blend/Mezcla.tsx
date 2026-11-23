import { useEffect, useMemo, useState } from 'react'
import { fmt } from '../../derive'
import { aCSV } from '../../domain/deswik'
import { filasExportacion, resolverMezcla, type Problema, type ResultadoMezcla, type Solucion, type TipoFila } from '../../domain/mezcla'
import { ABIERTAS, armarProblema, realCerradas, useMezcla, type ParamMezcla } from '../../mezcla'
import { useReservas } from '../../reservas'
import { cargarSolver } from '../../solver'
import { useStore } from '../../store'
import { Boton, Cabecera, Campo, descargar, diaCorto, Icon, Panel, Segmentos } from '../../ui/kit'
import { BASE, EJE, useEcharts } from '../../ui/useEcharts'

const USD = (v: number) => (Math.abs(v) >= 1e6 ? `${fmt(v / 1e6, 2)} M USD` : `${fmt(v / 1e3, 1)} k USD`)
const nombreGuardia = (fecha: string, g: 'D' | 'N') => `${diaCorto(fecha)} ${g === 'D' ? 'día' : 'noche'}`
const ETIQUETA: Partial<Record<TipoFila, string>> = {
  pique: 'Pique',
  camiones: 'Camiones de bajo perfil',
  chimeneaSalida: 'Salida de la chimenea de traspaso',
  chimeneaCap: 'Capacidad de la chimenea de traspaso',
  plantaMax: 'Capacidad de planta',
  plantaMin: 'Alimentación mínima',
  leyMin: 'Ley mínima',
  leyMax: 'Ley máxima',
  dureza: 'Dureza máxima',
  as: 'Arsénico máximo',
  disponible: 'Mineral listo en',
}
// el costo sombra de un límite de calidad se muestra por un paso útil del límite, no por una unidad entera
const PASO: Partial<Record<TipoFila, [number, string]>> = { leyMin: [0.1, '0,1 g/t'], leyMax: [0.1, '0,1 g/t'], dureza: [0.1, '0,1 kWh/t'], as: [0.01, '0,01 % As'] }

type Resolver = (lp: string) => Solucion

export default function Mezcla() {
  const { tareas, habilitacion } = useStore()
  const eco = useReservas((s) => s.eco)
  const { p, set, alternarFuera, aprobado, aprobar, restablecer } = useMezcla()
  const [solve, setSolve] = useState<Resolver | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  useEffect(() => {
    cargarSolver()
      .then((h) => setSolve(() => (lp: string) => h.solve(lp) as Solucion))
      .catch((e) => setFallo(String(e)))
  }, [])

  const prob = useMemo(() => armarProblema(tareas, habilitacion, p, eco), [tareas, habilitacion, p, eco])
  const r = useMemo(() => (solve ? resolverMezcla(prob, solve) : null), [solve, prob])
  const cerradas = useMemo(() => realCerradas(tareas), [tareas])

  const campo = (k: keyof ParamMezcla, l: string, u: string, paso = 1, invalido = false) => (
    <Campo l={l} u={u} paso={paso} v={p[k] as number} onChange={(v) => set({ [k]: v })} invalido={invalido} />
  )
  const parametros = (
    <div className="col-span-3 max-[1300px]:col-span-12 space-y-4">
      <Panel titulo="Límites de planta">
        <div className="p-4 grid grid-cols-2 gap-3">
          {campo('plantaDia', 'Capacidad', 't/día', 100, !(p.plantaDia > 0))}
          {campo('plantaMinDia', 'Alimentación mínima', 't/día', 100, p.plantaMinDia > p.plantaDia)}
          {campo('leyMin', 'Ley mínima', 'g/t', 0.1, p.leyMin > p.leyMax)}
          {campo('leyMax', 'Ley máxima', 'g/t', 0.1, p.leyMin > p.leyMax)}
          {campo('durezaMax', 'Dureza máxima', 'kWh/t', 0.5)}
          {campo('asMax', 'Arsénico máximo', '%', 0.05)}
        </div>
        <p className="px-4 pb-3 text-[12px] text-tinta-3">Se aplican por guardia: la mitad de la capacidad diaria.</p>
      </Panel>
      <Panel titulo="Capacidad de transporte">
        <div className="p-4 grid grid-cols-3 gap-3">
          {campo('tph', 'Pique', 't/h', 5, !(p.tph > 0))}
          {campo('horas', 'Horas', 'h', 0.5)}
          {campo('dispPique', 'Dispon.', '', 0.05)}
        </div>
        <p className="px-4 -mt-1 text-[12px] text-tinta-3">
          {fmt(prob.transporte.pique)} t por guardia = t/h × horas efectivas × disponibilidad.
        </p>
        <div className="p-4 grid grid-cols-3 gap-3">
          {campo('camiones', 'Camiones', '', 1)}
          {campo('tViaje', 'Carga', 't', 1)}
          {campo('viajes', 'Viajes', '', 1)}
        </div>
        <p className="px-4 -mt-1 text-[12px] text-tinta-3">{fmt(prob.transporte.camiones)} t por guardia desde el NV 3750 hasta el pique.</p>
        <div className="p-4 grid grid-cols-2 gap-3">
          {campo('chimeneaCap', 'Chimenea: capacidad', 't', 50, !(p.chimeneaCap > 0))}
          {campo('chimeneaSalida', 'Salida por guardia', 't', 50)}
          {campo('chimeneaIni', 'Carga al empezar', 't', 50, p.chimeneaIni < 0 || p.chimeneaIni > p.chimeneaCap)}
          {campo('chimeneaLey', 'Ley de esa carga', 'g/t', 0.1)}
          {campo('costoCamion', 'Costo camión', 'USD/t', 0.1)}
          {campo('costoPique', 'Costo pique', 'USD/t', 0.1)}
        </div>
      </Panel>
      <Panel titulo="Objetivo">
        <div className="p-4 space-y-3">
          <Segmentos
            etiqueta="Objetivo del solver"
            valor={p.objetivo}
            onChange={(objetivo) => set({ objetivo, plantaMinDia: objetivo !== 'valor' && !p.plantaMinDia ? 2000 : p.plantaMinDia })}
            opciones={[
              { v: 'valor', l: 'Metal' },
              { v: 'desvio', l: 'Desvío de ley' },
              { v: 'costo', l: 'Costo' },
            ]}
          />
          {p.objetivo === 'desvio' && campo('leyObjetivo', 'Ley objetivo', 'g/t', 0.1)}
          <p className="text-[12px] text-tinta-3">
            {p.objetivo === 'valor'
              ? `Maximiza oro pagable (${fmt(eco.precio)} USD/g × ${fmt(eco.recPlanta)} % de recuperación, de Reserves UG) menos transporte.`
              : p.objetivo === 'desvio'
                ? 'Minimiza la distancia entre la ley de cada guardia y la objetivo, con la alimentación mínima exigida.'
                : 'Minimiza el costo de transporte entregando al menos la alimentación mínima.'}
          </p>
        </div>
      </Panel>
    </div>
  )

  const cabecera = (
    <Cabecera titulo="Mezcla y alimentación a planta" detalle={`Blend UG · ${ABIERTAS.length} guardias abiertas de la semana del STP · solver HiGHS`}>
      <Boton variante="fant" onClick={restablecer}>
        Restablecer valores
      </Boton>
    </Cabecera>
  )

  if (fallo || !r || !r.ok)
    return (
      <div className="pb-10">
        {cabecera}
        <div className="px-6 grid grid-cols-12 gap-4 items-start">
          {parametros}
          <Panel className="col-span-9 max-[1300px]:col-span-12" titulo={fallo ? 'No cargó el solver' : r ? 'No se puede resolver' : 'Cargando el solver…'}>
            {fallo ? (
              <p role="alert" className="p-4 text-[13px] text-critico">{fallo}</p>
            ) : r && !r.ok ? (
              <ul role="alert" className="p-4 space-y-1.5 text-[13px] text-critico">
                {r.errores.map((e) => (
                  <li key={e} className="flex items-center gap-2">
                    <Icon n="x" className="size-4" /> {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-[13px] text-tinta-2">HiGHS se carga solo en esta pantalla (WebAssembly, unos 4 MB).</p>
            )}
          </Panel>
        </div>
      </div>
    )

  const cumplen = r.periodos.filter((q, i) => q.t > 0 && !r.violadas.some((v) => v.periodo === i)).length
  const kpis: [string, string, string][] = [
    ['A planta', `${fmt(r.total.t)} t`, `${fmt(r.total.ley, 2)} g/t · ${fmt(r.total.finos / 31.1035)} oz contenidas`],
    [
      p.objetivo === 'valor' ? 'Valor del plan' : p.objetivo === 'costo' ? 'Costo de transporte' : 'Desvío total',
      p.objetivo === 'desvio' ? `${fmt(r.objetivo / Math.max(r.total.t, 1), 2)} g/t` : USD(r.objetivo),
      p.objetivo === 'desvio' ? 'desvío medio por tonelada' : p.objetivo === 'valor' ? 'oro pagable menos transporte' : 'camión y pique',
    ],
    ['Cumplimiento de mezcla', `${fmt((cumplen / r.periodos.length) * 100)} %`, `${cumplen} de ${r.periodos.length} guardias dentro de todos los límites`],
    ['Desmonte de frentes', `${fmt(r.periodos.reduce((s, q) => s + q.desmonte, 0))} t`, 'mineral de desarrollo bajo la ley mínima de la mezcla'],
  ]

  return (
    <div className="pb-10">
      {cabecera}
      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        {parametros}
        <div className="col-span-9 max-[1300px]:col-span-12 space-y-4">
          {r.elastica && (
            <div role="alert" className="flex items-start gap-3 text-[13px] bg-panel border border-critico/50 rounded px-4 py-3">
              <Icon n="alerta" className="size-4 text-critico mt-0.5 shrink-0" />
              <span>
                No hay mezcla que cumpla todos los límites. Este plan minimiza la suma de excesos (toneladas y toneladas × unidad de calidad, sin pesos por
                límite), así que suele ceder primero la calidad. Se rompen{' '}
                {[...new Set(r.violadas.map((v) => ETIQUETA[v.tipo]!.toLowerCase()))].join(', ')} en {new Set(r.violadas.map((v) => v.periodo)).size} guardias. Sin
                costos sombra: solo valen con todos los límites cumplidos.
              </span>
            </div>
          )}
          <div className="grid grid-cols-4 max-[1100px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
            {kpis.map(([l, v, d]) => (
              <div key={l} className="bg-panel px-4 py-3">
                <div className="rotulo">{l}</div>
                <div className="text-[22px] font-semibold titular mt-1">{v}</div>
                <div className="text-[11.5px] text-tinta-3 mt-0.5">{d}</div>
              </div>
            ))}
          </div>
          <Alertas r={r} p={p} />
          <PlanGuardias r={r} p={p} cerradas={cerradas} />
          <Fuentes r={r} fuera={p.fuera} alternar={alternarFuera} />
          <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 items-start">
            <Activas r={r} objetivo={p.objetivo} />
            <SinFuente prob={prob} r={r} solve={solve!} />
          </div>
          <Aprobacion r={r} p={p} aprobado={aprobado} aprobar={aprobar} />
        </div>
      </div>
    </div>
  )
}

function Alertas({ r, p }: { r: ResultadoMezcla; p: ParamMezcla }) {
  const agotan = r.porFuente.filter((x) => x.f.tipo !== 'Frente' && x.f.tipo !== 'Chimenea' && x.disponible > 0 && x.queda < 1)
  const llena = r.periodos.flatMap((q, i) => (q.chimenea >= 0.95 * p.chimeneaCap ? [ABIERTAS[i]] : []))
  const prox = Object.entries(r.periodos[0]?.aportes ?? {}).sort((a, b) => b[1] - a[1])
  return (
    <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 items-start">
      <Panel titulo={`${ABIERTAS[0].estado === 'actual' ? 'Guardia en curso' : 'Próxima guardia'} · ${nombreGuardia(ABIERTAS[0].fecha, ABIERTAS[0].g)}`}>
        <ol className="p-4 space-y-1 text-[13px]">
          {prox.map(([id, t], i) => {
            const f = r.porFuente.find((x) => x.f.id === id)!.f
            return (
              <li key={id} className="flex gap-3">
                <span className="text-tinta-3 w-4 text-right">{i + 1}</span>
                <span className="flex-1">
                  {f.nombre} <span className="text-tinta-3 text-[11.5px]">· {f.ruta === 'chimenea' ? 'por la chimenea' : 'en camión'}</span>
                </span>
                <span className="font-medium">{fmt(t)} t</span>
                <span className="text-tinta-2 w-16 text-right">{fmt(f.ley, 2)} g/t</span>
              </li>
            )
          })}
        </ol>
      </Panel>
      <Panel titulo="Alertas">
        <ul className="p-4 space-y-1.5 text-[13px]">
          {agotan.length > 0 && (
            <li className="text-tinta-2">
              El plan saca todo lo que el STP vuela en {agotan.map((x) => x.f.nombre).join(', ')}: más mineral listo ahí subiría el valor (ver costos sombra).
            </li>
          )}
          {llena.length > 0 && (
            <li className="flex items-start gap-2">
              <Icon n="alerta" className="size-4 text-alerta mt-0.5 shrink-0" /> La chimenea de traspaso llega al 95 % de su capacidad en {llena.length} guardias.
            </li>
          )}
          {!llena.length && (
            <li className="flex items-center gap-2 text-tinta-2">
              <Icon n="ok" className="size-4 text-bien" /> La chimenea de traspaso no llega a su límite en ninguna guardia.
            </li>
          )}
        </ul>
      </Panel>
    </div>
  )
}

function PlanGuardias({ r, p, cerradas }: { r: ResultadoMezcla; p: ParamMezcla; cerradas: ReturnType<typeof realCerradas> }) {
  const filas = [
    ...cerradas.map((q) => ({ nombre: nombreGuardia(q.fecha, q.g), cerrada: true, reportado: q.reportado, t: q.t, ley: q.ley, dureza: null as number | null, as: null as number | null, chimenea: null as number | null, i: -1 })),
    ...r.periodos.map((q, i) => ({ nombre: nombreGuardia(ABIERTAS[i].fecha, ABIERTAS[i].g), cerrada: false, reportado: true, t: q.t, ley: q.ley, dureza: q.dureza, as: q.as, chimenea: q.chimenea, i })),
  ]
  // las cerradas son mineral volado, no alimentación a planta: van en la tabla, no en los gráficos
  const abiertas = filas.filter((f) => !f.cerrada)
  const x = abiertas.map((f) => f.nombre)
  const tOp = useMemo(
    () => ({
      ...BASE,
      grid: { ...BASE.grid, top: 16, right: 16 },
      tooltip: { ...BASE.tooltip, trigger: 'axis', valueFormatter: (v: number) => (v == null ? 'sin reporte' : `${fmt(v)} t`) },
      xAxis: { type: 'category', data: x, ...EJE, axisLabel: { color: '#84918d', fontSize: 11, interval: 0, rotate: 30 } },
      yAxis: { type: 'value', ...EJE, axisLabel: { color: '#84918d', formatter: (v: number) => fmt(v) } },
      series: [
        {
          type: 'bar',
          name: 'A planta',
          barMaxWidth: 22,
          data: abiertas.map((f) => ({ value: f.t, itemStyle: { color: '#199e70', borderRadius: [4, 4, 0, 0] } })),
          markLine: {
            symbol: 'none',
            silent: true,
            label: { color: '#a9b5b1', position: 'end' },
            data: [
              { yAxis: p.plantaDia / 2, name: 'planta', lineStyle: { color: '#84918d', type: 'dashed' }, label: { show: false } },
              { yAxis: (p.tph * p.horas * p.dispPique), name: 'pique', lineStyle: { color: '#e8735a', type: 'dashed' }, label: { show: false } },
            ],
          },
        },
      ],
    }),
    [abiertas, x, p],
  )
  const leyOp = useMemo(
    () => ({
      ...BASE,
      grid: { ...BASE.grid, top: 16, right: 90 },
      tooltip: { ...BASE.tooltip, trigger: 'axis', valueFormatter: (v: number) => (v == null ? 'sin reporte' : `${fmt(v, 2)} g/t`) },
      xAxis: { type: 'category', data: x, ...EJE, axisLabel: { color: '#84918d', fontSize: 11, interval: 0, rotate: 30 } },
      yAxis: { type: 'value', min: 0, max: Math.ceil(p.leyMax + 1), ...EJE },
      series: [
        {
          type: 'line',
          name: 'Ley',
          data: abiertas.map((f) => (f.t > 0 ? +f.ley.toFixed(2) : null)),
          lineStyle: { width: 2, color: '#e9eeec' },
          itemStyle: { color: '#e9eeec' },
          symbolSize: 8,
          markLine: {
            symbol: 'none',
            silent: true,
            lineStyle: { color: '#84918d', type: 'dashed' },
            label: { color: '#a9b5b1', position: 'end' },
            data: [
              { yAxis: p.leyMin, label: { formatter: `mín ${fmt(p.leyMin, 1)}` } },
              { yAxis: p.leyMax, label: { formatter: `máx ${fmt(p.leyMax, 1)}` } },
            ],
          },
        },
      ],
    }),
    [abiertas, x, p],
  )
  const refT = useEcharts(tOp)
  const refL = useEcharts(leyOp)
  const fuera = (v: number | null, max: number) => v != null && v > max + 1e-6
  return (
    <Panel titulo="Plan de alimentación por guardia">
      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 px-4 pt-3">
        <div>
          <div className="text-[12.5px] text-tinta-2 mb-1">Toneladas a planta por guardia abierta · línea gris: planta · línea coral: pique</div>
          <div ref={refT} className="h-[220px]" role="img" aria-label="Toneladas a planta por guardia frente a la capacidad de planta y del pique" />
        </div>
        <div>
          <div className="text-[12.5px] text-tinta-2 mb-1">Ley de la mezcla (g/t)</div>
          <div ref={refL} className="h-[220px]" role="img" aria-label="Ley de la mezcla por guardia entre los límites de planta" />
        </div>
      </div>
      <div className="p-4 overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left rotulo border-b border-filete">
              <th className="px-2 py-2 font-semibold">Guardia</th>
              <th className="px-2 py-2 font-semibold text-right">Toneladas</th>
              <th className="px-2 py-2 font-semibold text-right">Ley g/t</th>
              <th className="px-2 py-2 font-semibold text-right">Dureza kWh/t</th>
              <th className="px-2 py-2 font-semibold text-right">As %</th>
              <th className="px-2 py-2 font-semibold text-right">Chimenea t</th>
              <th className="px-2 py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {filas.map((f) => {
              const viola = !f.cerrada && r.violadas.filter((v) => v.periodo === f.i)
              return (
                <tr key={f.nombre} className={f.cerrada ? 'text-tinta-3' : ''}>
                  <td className="px-2 py-1.5 first-letter:uppercase">{f.nombre}</td>
                  <td className="px-2 py-1.5 text-right">{f.reportado ? fmt(f.t) : '—'}</td>
                  <td className={`px-2 py-1.5 text-right ${!f.cerrada && f.t > 0 && (f.ley < p.leyMin - 1e-6 || f.ley > p.leyMax + 1e-6) ? 'text-critico' : ''}`}>
                    {f.reportado && f.t > 0 ? fmt(f.ley, 2) : '—'}
                  </td>
                  <td className={`px-2 py-1.5 text-right ${fuera(f.dureza, p.durezaMax) ? 'text-critico' : ''}`}>{f.dureza == null ? '—' : fmt(f.dureza, 1)}</td>
                  <td className={`px-2 py-1.5 text-right ${fuera(f.as, p.asMax) ? 'text-critico' : ''}`}>{f.as == null ? '—' : fmt(f.as, 2)}</td>
                  <td className="px-2 py-1.5 text-right">{f.chimenea == null ? '—' : fmt(f.chimenea)}</td>
                  <td className="px-2 py-1.5">
                    {f.cerrada ? (
                      f.reportado ? 'Cerrada · volado real' : 'Cerrada · sin reporte'
                    ) : viola && viola.length ? (
                      <span className="inline-flex items-center gap-1.5 text-critico">
                        <Icon n="x" className="size-3.5" /> Rompe {viola.map((v) => ETIQUETA[v.tipo]!.toLowerCase()).join(', ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-tinta-2">
                        <Icon n="ok" className="size-3.5 text-bien" /> Cumple
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-tinta-3">
          Las guardias cerradas no se editan ni entran al solver: muestran el mineral volado que el STP reporta como real en tajeos y frentes con ley; lo izado por el pique y la dureza y el arsénico medidos no se registran en la demo.
        </p>
      </div>
    </Panel>
  )
}

function Fuentes({ r, fuera, alternar }: { r: ResultadoMezcla; fuera: string[]; alternar: (id: string) => void }) {
  return (
    <Panel titulo="Fuentes de la semana">
      <div className="p-4 overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left rotulo border-b border-filete">
              <th className="px-2 py-2 font-semibold">Fuente</th>
              <th className="px-2 py-2 font-semibold">Ruta</th>
              <th className="px-2 py-2 font-semibold text-right">Ley g/t</th>
              <th className="px-2 py-2 font-semibold text-right">Dureza</th>
              <th className="px-2 py-2 font-semibold text-right">As %</th>
              <th className="px-2 py-2 font-semibold text-right">Disponible t</th>
              <th className="px-2 py-2 font-semibold text-right">A planta t</th>
              <th className="px-2 py-2 font-semibold text-right">Desmonte t</th>
              <th className="px-2 py-2 font-semibold text-right">Queda t</th>
              <th className="px-2 py-2 font-semibold">Agotada / fuera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {r.porFuente.map(({ f, planta, desmonte, queda, disponible }) => {
              const off = fuera.includes(f.id)
              return (
                <tr key={f.id} className={off ? 'text-tinta-3' : ''}>
                  <td className="px-2 py-1.5">
                    {f.nombre} <span className="text-tinta-3 text-[11.5px]">· {f.tipo} · NV {f.nivel}</span>
                  </td>
                  <td className="px-2 py-1.5 text-tinta-2">{f.enChimenea ? 'ya en la chimenea' : f.ruta === 'chimenea' ? 'chimenea → pique' : 'camión → pique'}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(f.ley, 2)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(f.dureza, 1)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(f.as, 2)}</td>
                  <td className="px-2 py-1.5 text-right">{off ? '—' : fmt(disponible)}</td>
                  <td className="px-2 py-1.5 text-right font-medium">{fmt(planta)}</td>
                  <td className="px-2 py-1.5 text-right">{f.obligatoria ? fmt(desmonte) : '—'}</td>
                  <td className="px-2 py-1.5 text-right">{f.obligatoria ? '—' : fmt(queda)}</td>
                  <td className="px-2 py-1.5">
                    <input type="checkbox" checked={off} onChange={() => alternar(f.id)} aria-label={`Marcar ${f.nombre} como agotada o fuera del plan`} className="accent-coral" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-tinta-3">
          Disponible: lo que el STP planea volar en las guardias abiertas, solo con la labor habilitada (ventilación, sostenimiento, re-ingreso). Lo volado que no
          sale espera en el tajeo; el mineral de los frentes se limpia en la guardia, a planta o a desmonte. Dureza y arsénico son sintéticos.
        </p>
      </div>
    </Panel>
  )
}

function Activas({ r, objetivo }: { r: ResultadoMezcla; objetivo: ParamMezcla['objetivo'] }) {
  const grupos = new Map<string, { titulo: string; valor: number; n: number; por: string }>()
  for (const a of r.activas) {
    const k = `${a.tipo}|${a.fuente ?? ''}`
    const paso = PASO[a.tipo]
    const nombre = a.tipo === 'disponible' ? `${ETIQUETA.disponible} ${r.porFuente.find((x) => x.f.id === a.fuente)?.f.nombre}` : ETIQUETA[a.tipo]!
    const g = grupos.get(k) ?? { titulo: nombre, valor: 0, n: 0, por: paso ? paso[1] : '1 t' }
    g.valor += a.valor * (paso ? paso[0] : 1)
    g.n += 1
    grupos.set(k, g)
  }
  const lista = [...grupos.values()].sort((a, b) => b.valor - a.valor)
  const unidad = objetivo === 'desvio' ? 't·g/t de desvío' : 'USD'
  return (
    <Panel titulo="Restricciones activas">
      <div className="p-4">
        {r.elastica ? (
          <p className="text-[13px] text-tinta-2">Sin costos sombra mientras haya límites rotos.</p>
        ) : !lista.length ? (
          <p className="text-[13px] text-tinta-2">Ninguna restricción limita el plan.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left rotulo border-b border-filete">
                <th className="py-2 font-semibold">Limita</th>
                <th className="py-2 font-semibold text-right">Guardias</th>
                <th className="py-2 font-semibold text-right">Costo sombra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-filete">
              {lista.map((g) => (
                <tr key={g.titulo}>
                  <td className="py-1.5">{g.titulo}</td>
                  <td className="py-1.5 text-right text-tinta-2">{g.n}</td>
                  <td className="py-1.5 text-right">
                    {fmt(g.valor, g.valor < 100 ? 1 : 0)} {unidad} <span className="text-tinta-3 text-[11.5px]">por {g.por}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-[12px] text-tinta-3">
          Cuánto mejora el objetivo de la semana si ese límite se afloja en el paso indicado en todas las guardias donde limita. Vale para cambios chicos.
        </p>
      </div>
    </Panel>
  )
}

function SinFuente({ prob, r, solve }: { prob: Problema; r: ResultadoMezcla; solve: Resolver }) {
  const filas = useMemo(
    () =>
      prob.fuentes
        .filter((f) => f.disp.some((x) => x > 0))
        .map((f) => {
          const x = resolverMezcla({ ...prob, fuentes: prob.fuentes.map((g) => (g.id === f.id ? { ...g, disp: g.disp.map(() => 0) } : g)) }, solve)
          return { f, x: x.ok ? x : null }
        }),
    [prob, solve],
  )
  const max = prob.objetivo === 'valor'
  return (
    <Panel titulo="Escenarios: si falta una fuente">
      <div className="p-4">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left rotulo border-b border-filete">
              <th className="py-2 font-semibold">Sin</th>
              <th className="py-2 font-semibold text-right">A planta t</th>
              <th className="py-2 font-semibold text-right">Ley g/t</th>
              <th className="py-2 font-semibold text-right">Cambio del objetivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {filas.map(({ f, x }) => (
              <tr key={f.id}>
                <td className="py-1.5">{f.nombre}</td>
                {!x ? (
                  <td colSpan={3} className="py-1.5 text-right text-critico">sin solución</td>
                ) : x.elastica ? (
                  <td colSpan={3} className="py-1.5 text-right text-critico">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon n="x" className="size-3.5" /> rompe límites
                    </span>
                  </td>
                ) : (
                  <>
                    <td className="py-1.5 text-right">{fmt(x.total.t)}</td>
                    <td className="py-1.5 text-right">{fmt(x.total.ley, 2)}</td>
                    <td className="py-1.5 text-right">
                      {(() => {
                        const d = max ? x.objetivo - r.objetivo : r.objetivo - x.objetivo
                        return `${d >= 0 ? '+' : '−'}${max || prob.objetivo === 'costo' ? USD(Math.abs(d)) : fmt(Math.abs(d))}`
                      })()}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-tinta-3">Cada fila vuelve a resolver la semana sin esa fuente; negativo es peor que el plan actual.</p>
      </div>
    </Panel>
  )
}

function Aprobacion({ r, p, aprobado, aprobar }: { r: ResultadoMezcla; p: ParamMezcla; aprobado: ReturnType<typeof useMezcla.getState>['aprobado']; aprobar: ReturnType<typeof useMezcla.getState>['aprobar'] }) {
  const [just, setJust] = useState('')
  const filas = filasExportacion(r).map((f, i) => ({ ...f, periodo: `${ABIERTAS[i].fecha} ${ABIERTAS[i].g === 'D' ? 'día' : 'noche'}` }))
  const clave = JSON.stringify([filas, p])
  const exige = r.violadas.length > 0
  const puede = !exige || just.trim().length >= 10
  const vigente = aprobado?.clave === clave
  return (
    <Panel titulo="Aprobación y exportación">
      <div className="p-4 space-y-3 text-[13px]">
        {aprobado && (
          <div role="status" className={`flex items-start gap-3 rounded px-4 py-2.5 bg-panel-2 border ${vigente ? 'border-bien/40' : 'border-alerta/50'}`}>
            <Icon n={vigente ? 'ok' : 'alerta'} className={`size-4 mt-0.5 shrink-0 ${vigente ? 'text-bien' : 'text-alerta'}`} />
            <span className="flex-1">
              Plan aprobado el {new Date(aprobado.fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}: {fmt(aprobado.t)} t a {fmt(aprobado.ley, 2)} g/t en{' '}
              {aprobado.filas.length} guardias.
              {aprobado.justificacion && <> Justificación: «{aprobado.justificacion}».</>}
              {!vigente && ' El plan en pantalla cambió desde entonces; lo exportado es el aprobado.'}
            </span>
            <Boton variante="sec" onClick={() => descargar('plan-alimentacion-aprobado.csv', aCSV(aprobado.filas), 'text/csv')}>
              Exportar CSV
            </Boton>
          </div>
        )}
        {exige && (
          <label className="block">
            <span className="block text-[12px] text-tinta-2 mb-1">El plan rompe límites de planta: escribe la justificación para aprobarlo</span>
            <textarea value={just} onChange={(e) => setJust(e.target.value)} rows={2} className="w-full bg-suelo border border-filete-2 rounded px-2 py-1.5 focus:border-coral outline-none" />
          </label>
        )}
        <div className="flex items-center gap-3">
          <span className="flex-1 text-tinta-2">
            Al aprobar se congela el plan por guardia (toneladas, ley, dureza y arsénico); el CSV sale de esa copia, en el formato de periodos que espera la planificación
            de planta.
          </span>
          <Boton
            variante="pri"
            onClick={() => {
              aprobar({ fecha: new Date().toISOString(), justificacion: exige ? just.trim() : '', violadas: r.violadas.length, filas, t: r.total.t, ley: r.total.ley, clave })
              setJust('')
            }}
            disabled={!puede || vigente}
          >
            {vigente ? 'Aprobado' : 'Aprobar plan'}
          </Boton>
        </div>
      </div>
    </Panel>
  )
}

