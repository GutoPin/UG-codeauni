import { useMemo, useState } from 'react'
import { DIAS, estadoGuardia, GUARDIAS, type Tarea } from '../../data/minaPiloto'
import { agregado, cumplimientoPorLabor, cumplimientoPorSupervisor, fmt, nivelDe, pareto } from '../../derive'
import { useStore } from '../../store'
import { Cabecera, COLOR_NIVEL, diaCorto, Panel, Pct, Segmentos } from '../../ui/kit'
import { BASE, EJE, useEcharts } from '../../ui/useEcharts'

const SERIE_D = '#3987e5'
const SERIE_N = '#199e70'

function Tendencia({ tareas }: { tareas: Tarea[] }) {
  const opcion = useMemo(() => {
    // solo guardias terminadas: la guardia en curso aún no tiene su real completo
    const serie = (g: 'D' | 'N') => DIAS.map((d) => (estadoGuardia(d, g) === 'pasada' ? agregado(tareas.filter((t) => t.fecha === d && t.guardia === g)).pct : null))
    return {
      ...BASE,
      tooltip: { ...BASE.tooltip, trigger: 'axis', valueFormatter: (v: number | null) => (v == null ? 'sin reporte' : `${fmt(v)} %`) },
      legend: { top: 0, right: 0, textStyle: { color: '#a9b5b1' } },
      xAxis: { type: 'category', data: DIAS.map((d) => diaCorto(d)), ...EJE, splitLine: { show: false } },
      yAxis: { type: 'value', min: 50, max: 110, ...EJE, axisLabel: { color: '#84918d', formatter: '{value} %' } },
      series: (['D', 'N'] as const).map((g) => ({
        name: `Guardia ${GUARDIAS.find((x) => x.id === g)!.nombre.toLowerCase()}`,
        type: 'line',
        data: serie(g),
        connectNulls: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: g === 'D' ? SERIE_D : SERIE_N },
        itemStyle: { color: g === 'D' ? SERIE_D : SERIE_N, borderColor: '#171f1d', borderWidth: 2 },
        markLine:
          g === 'D'
            ? { silent: true, symbol: 'none', lineStyle: { color: '#84918d', type: 'dashed', width: 1 }, label: { color: '#84918d', formatter: 'meta 100 %', position: 'insideStartTop' }, data: [{ yAxis: 100 }] }
            : undefined,
      })),
    }
  }, [tareas])
  const ref = useEcharts(opcion)
  return <div ref={ref} className="h-[240px]" role="img" aria-label="Cumplimiento diario por guardia" />
}

function Pareto({ filas }: { filas: ReturnType<typeof pareto> }) {
  const opcion = useMemo(
    () => ({
      ...BASE,
      grid: { ...BASE.grid, top: 8, right: 72 },
      tooltip: { ...BASE.tooltip, trigger: 'item', formatter: (p: { name: string; value: number; dataIndex: number }) => `${p.name}<br/>${fmt(p.value)} min perdidos · acumulado ${fmt(filas[p.dataIndex].acumulado)} %` },
      xAxis: { type: 'value', ...EJE, axisLabel: { color: '#84918d', formatter: (v: number) => `${fmt(v)} min` } },
      yAxis: { type: 'category', inverse: true, data: filas.map((f) => f.causa), ...EJE, splitLine: { show: false }, axisLabel: { color: '#a9b5b1' } },
      series: [
        {
          type: 'bar',
          data: filas.map((f) => f.minutos),
          barWidth: 14,
          itemStyle: { color: '#3987e5', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#a9b5b1', formatter: (p: { value: number; dataIndex: number }) => `${fmt(p.value)} · ${fmt(filas[p.dataIndex].acumulado)} %` },
        },
      ],
    }),
    [filas],
  )
  const ref = useEcharts(opcion)
  return <div ref={ref} style={{ height: 44 + filas.length * 30 }} role="img" aria-label="Pareto de causas de desvío por minutos perdidos" />
}

export default function Cumplimiento() {
  const { tareas } = useStore()
  const [unidad, setUnidad] = useState<'m' | 't'>('m')
  const porLabor = cumplimientoPorLabor(tareas, unidad).filter((x) => x.n > 0)
  const porSup = cumplimientoPorSupervisor(tareas)
  const par = useMemo(() => pareto(tareas), [tareas])
  const total = par.reduce((s, x) => s + x.minutos, 0)
  const vitales = par.filter((_, i) => i === 0 || par[i - 1].acumulado < 80)

  return (
    <div className="pb-10">
      <Cabecera titulo="Cumplimiento del programa" />
      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        <Panel
          className="col-span-7 max-[1200px]:col-span-12"
          titulo="Por labor · plan contra real reportado"
          accion={
            <Segmentos
              etiqueta="Unidad"
              valor={unidad}
              onChange={setUnidad}
              opciones={[
                { v: 'm', l: 'Desarrollo (m)' },
                { v: 't', l: 'Producción (t)' },
              ]}
            />
          }
        >
          <ul className="divide-y divide-filete">
            {porLabor.map((x) => {
              const ancho = x.pct == null ? 0 : Math.min(x.pct, 120) / 1.2
              return (
                <li key={x.labor.id} className="grid grid-cols-[180px_1fr_150px_80px] items-center gap-3 px-4 py-2 text-[13px]">
                  <span className="truncate">
                    {x.labor.nombre}
                    <span className="block text-[11.5px] text-tinta-3">{x.reportadas} de {x.n} guardias reportadas</span>
                  </span>
                  <span className="relative h-2.5 bg-suelo rounded-sm" aria-hidden>
                    <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${ancho}%`, background: COLOR_NIVEL[nivelDe(x.pct)], opacity: 0.85 }} />
                    <span className="absolute -inset-y-1 w-px bg-tinta-3" style={{ left: `${100 / 1.2}%` }} />
                  </span>
                  <span className="text-right text-tinta-2">
                    {fmt(x.real, unidad === 'm' ? 1 : 0)} / {fmt(x.plan, unidad === 'm' ? 1 : 0)} {unidad}
                  </span>
                  <span className="text-right"><Pct pct={x.pct} /></span>
                </li>
              )
            })}
          </ul>
          <p className="px-4 py-2.5 border-t border-filete text-[12px] text-tinta-3">
            Solo cuentan las guardias con reporte: una guardia sin reporte queda vacía, no en cero. La raya vertical marca el 100 %.
          </p>
        </Panel>

        <div className="col-span-5 max-[1200px]:col-span-12 space-y-4">
          <Panel titulo="Por guardia">
            <div className="px-3 pt-3 pb-1">
              <Tendencia tareas={tareas} />
            </div>
          </Panel>
          <Panel titulo="Por supervisor">
            <table className="tabla w-full text-[13px]">
              <thead>
                <tr className="border-b border-filete [&>th]:py-2 [&>th]:px-4">
                  <th>Supervisor</th>
                  <th className="text-right">Reportadas</th>
                  <th className="text-right">Cumpl.</th>
                </tr>
              </thead>
              <tbody>
                {porSup.map((s) => (
                  <tr key={s.supervisor.id} className="border-b border-filete last:border-0 [&>td]:px-4 [&>td]:py-2">
                    <td>
                      {s.supervisor.nombre}
                      <span className="block text-[11.5px] text-tinta-3">{s.supervisor.area}</span>
                    </td>
                    <td className="text-right text-tinta-2">{s.reportadas} / {s.n}</td>
                    <td className="text-right"><Pct pct={s.pct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <Panel className="col-span-12" titulo="Pareto de causas de desvío" accion={<span className="text-[12px] text-tinta-3">{fmt(total)} min perdidos en la semana</span>}>
          <div className="grid grid-cols-[1fr_300px] max-[1000px]:grid-cols-1">
            <div className="px-3 py-3">
              {par.length ? <Pareto filas={par} /> : <p className="p-4 text-tinta-3">Aún no hay desvíos con causa registrada.</p>}
            </div>
            <div className="border-l border-filete max-[1000px]:border-l-0 max-[1000px]:border-t p-4 text-[13px]">
              <div className="rotulo mb-2">Pocas causas, la mayor parte de la pérdida</div>
              <p className="text-tinta-2">
                {vitales.map((v) => v.causa).join(', ')} explican el {fmt(vitales.at(-1)?.acumulado ?? 0)} % de los minutos perdidos.
              </p>
              <p className="text-tinta-3 text-[12px] mt-3">Cada barra: minutos perdidos por causa · el porcentaje es el acumulado hasta esa causa.</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
