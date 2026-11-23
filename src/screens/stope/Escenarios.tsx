import { useMemo, useState } from 'react'
import { fmt } from '../../derive'
import type { Economia, Metodo } from '../../domain/reservas'
import type { Diseno } from '../../domain/versiones'
import type { Datos } from '../../disenos'
import { optimizar, useOptimizador, type Corrida, type ParamOptimizador } from '../../optimizador'
import { Boton, Icon, Panel } from '../../ui/kit'
import { BASE, EJE, useEcharts } from '../../ui/useEcharts'

const M = (usd: number) => `${fmt(usd / 1e6, 2)} M USD`
const signo = (v: number, d = 0) => {
  const x = +v.toFixed(d)
  return `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt(Math.abs(x), d)}`
}
const FECHA = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const PRECIOS = [0.8, 1, 1.2]
const EXTRA = [0, 0.5, 1, 2]
const CORTES = Array.from({ length: 17 }, (_, i) => i * 0.5)

function Curva({ titulo, x, y, actual, unidad, color }: { titulo: string; x: number[]; y: number[]; actual: number; unidad: string; color: string }) {
  const opcion = useMemo(
    () => ({
      ...BASE,
      grid: { ...BASE.grid, top: 12, right: 20 },
      tooltip: { ...BASE.tooltip, trigger: 'axis', formatter: (p: { axisValue: number; value: [number, number] }[]) => `Corte ${fmt(p[0].value[0], 1)} g/t<br/>${fmt(p[0].value[1], unidad === 'M USD' ? 2 : 0)} ${unidad}` },
      xAxis: { type: 'value', name: 'g/t', nameGap: 6, ...EJE, splitLine: { show: false } },
      yAxis: { type: 'value', ...EJE, axisLabel: { color: '#84918d', formatter: (v: number) => fmt(v) } },
      series: [
        {
          type: 'line',
          data: x.map((v, i) => [v, y[i]]),
          showSymbol: false,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          markLine: { symbol: 'none', silent: true, lineStyle: { color: '#e8735a', type: 'dashed' }, label: { color: '#a9b5b1', formatter: 'actual' }, data: [{ xAxis: actual }] },
        },
      ],
    }),
    [x, y, actual, unidad, color],
  )
  const ref = useEcharts(opcion)
  return (
    <div>
      <div className="text-[12.5px] text-tinta-2 mb-1">{titulo}</div>
      <div ref={ref} className="h-[180px]" role="img" aria-label={`${titulo} entre 0 y 8 g/t de corte`} />
    </div>
  )
}

/** Escenarios de precio y ley de corte, curva tonelaje-valor y corridas congeladas (ficha 05, pasos 9 y 10). */
export default function Escenarios({ r, params, metodos, eco, disenos }: { r: Corrida; params: ParamOptimizador; metodos: Record<string, Metodo>; eco: Economia; disenos: Diseno<Datos>[] }) {
  const { corridas, congelar, cargar } = useOptimizador()
  const [msg, setMsg] = useState<string | null>(null)
  const clave = JSON.stringify(params)
  const { grilla, curva } = useMemo(() => {
    const correr = (precio: number, corte: number) => {
      const x = optimizar(params, metodos, eco, disenos, { precio, corte })
      return x.ok ? x : null
    }
    const grilla = PRECIOS.flatMap((k) => {
      const precio = eco.precio * k
      const eq = optimizar(params, metodos, eco, disenos, { precio })
      if (!eq.ok) return []
      return EXTRA.map((d) => ({ precio, corte: eq.corteEq + d, extra: d, x: correr(precio, eq.corteEq + d) }))
    })
    const curva = CORTES.map((c) => correr(eco.precio, c))
    return { grilla, curva }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, metodos, eco, disenos])
  const curvaX = useMemo(() => CORTES.filter((_, i) => curva[i]), [curva])
  const curvaT = useMemo(() => curva.flatMap((x) => (x ? [x.total.t / 1000] : [])), [curva])
  const curvaV = useMemo(() => curva.flatMap((x) => (x ? [x.total.valor / 1e6] : [])), [curva])

  const guardar = (precio: number, corte: number, x: Corrida) => {
    const nombre = `${fmt(precio, 1)} USD/g · corte ${fmt(corte, 2)} g/t`
    congelar({
      nombre,
      precio,
      corte: +corte.toFixed(2),
      total: { n: x.total.n, valor: x.total.valor, t: x.total.t, ley: x.total.ley },
      formas: x.formas.map((f) => ({ id: f.id, nivel: f.nivel, inicio: f.inicio, fin: f.fin, t: f.t, ley: f.ley, valor: f.valor })),
    })
    setMsg(`Corrida «${nombre}» congelada. No se edita: se cargan sus parámetros y se congela otra.`)
  }

  return (
    <Panel titulo="Escenarios de precio y ley de corte">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="text-left rotulo border-b border-filete">
              <th className="px-4 py-2 font-semibold">Precio</th>
              <th className="px-3 py-2 font-semibold">Ley de corte</th>
              <th className="px-3 py-2 font-semibold text-right">Formas</th>
              <th className="px-3 py-2 font-semibold text-right">Toneladas</th>
              <th className="px-3 py-2 font-semibold text-right">Ley</th>
              <th className="px-3 py-2 font-semibold text-right">Valor</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-filete">
            {grilla.map((g) => {
              const actual = Math.abs(g.precio - eco.precio) < 1e-9 && Math.abs(g.corte - r.corte) < 0.005
              return (
                <tr key={`${g.precio}|${g.extra}`} className={actual ? 'bg-panel-2' : ''}>
                  <td className="px-4 py-1.5">
                    {fmt(g.precio, 1)} USD/g {g.precio !== eco.precio && <span className="text-tinta-3">({signo((g.precio / eco.precio - 1) * 100)} %)</span>}
                  </td>
                  <td className="px-3 py-1.5">
                    {fmt(g.corte, 2)} g/t <span className="text-tinta-3">{g.extra ? `equilibrio + ${fmt(g.extra, 1)}` : 'equilibrio'}</span>
                    {actual && <span className="text-coral text-[12px]"> · corrida actual</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">{g.x ? fmt(g.x.total.n) : '—'}</td>
                  <td className="px-3 py-1.5 text-right">{g.x ? `${fmt(g.x.total.t)} t` : '—'}</td>
                  <td className="px-3 py-1.5 text-right">{g.x?.total.t ? `${fmt(g.x.total.ley, 2)} g/t` : '—'}</td>
                  <td className="px-3 py-1.5 text-right">{g.x ? M(g.x.total.valor) : '—'}</td>
                  <td className="px-4 py-1 text-right">
                    {g.x && (
                      <Boton variante="fant" onClick={() => guardar(g.precio, g.corte, g.x!)}>
                        <Icon n="candado" className="size-3.5" /> Congelar
                      </Boton>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {msg && (
        <p role="status" className="px-4 py-2.5 border-t border-filete text-[12.5px] text-tinta-2 flex gap-2">
          <Icon n="ok" className="size-4 text-bien shrink-0" /> {msg}
        </p>
      )}

      <div className="px-4 py-3 border-t border-filete grid grid-cols-2 max-[900px]:grid-cols-1 gap-4">
        <Curva titulo="Mineral diluido por ley de corte (kt)" x={curvaX} y={curvaT} actual={r.corte} unidad="kt" color="#199e70" />
        <Curva titulo="Valor del plan por ley de corte (M USD)" x={curvaX} y={curvaV} actual={r.corte} unidad="M USD" color="#3987e5" />
      </div>
      <p className="px-4 pb-3 text-[11.5px] text-tinta-3">
        Cada punto repite la corrida completa con ese corte y el precio de Reserves UG. Subir el corte saca formas candidatas: el valor del plan nunca sube.
      </p>

      <div className="border-t border-filete">
        <h3 className="px-4 pt-3 text-[13px] font-semibold">Corridas congeladas</h3>
        {corridas.length === 0 ? (
          <p className="px-4 py-2 pb-3 text-[12.5px] text-tinta-3">Aún no hay corridas congeladas. Congela el escenario elegido desde la tabla.</p>
        ) : (
          <ul className="divide-y divide-filete mt-1">
            {[...corridas].reverse().map((c) => (
              <li key={c.numero} className="px-4 py-2 flex items-center gap-3 text-[13px]">
                <span className="flex-1 min-w-0">
                  <span className="font-medium">
                    {c.numero}. {c.nombre}
                  </span>
                  <span className="block text-[11.5px] text-tinta-3">
                    {FECHA.format(new Date(c.fecha))} · {c.autor} · {metodos[c.parametros.metodo]?.nombre ?? c.parametros.metodo} · {c.total.n} formas · {fmt(c.total.t)} t a{' '}
                    {fmt(c.total.ley, 2)} g/t · {M(c.total.valor)} · frente a la actual {signo((r.total.valor - c.total.valor) / 1e6, 2)} M USD
                  </span>
                </span>
                <Boton variante="fant" className="whitespace-nowrap" onClick={() => cargar(c.numero)}>
                  Cargar parámetros
                </Boton>
              </li>
            ))}
          </ul>
        )}
        <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
          Cargar trae método, dimensiones, pilares y ley de corte; el precio y los costos siguen siendo los de Reserves UG.
        </p>
      </div>
    </Panel>
  )
}
