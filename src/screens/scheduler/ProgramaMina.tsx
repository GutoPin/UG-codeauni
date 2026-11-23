import { useState } from 'react'
import { fmt } from '../../derive'
import { aCSV } from '../../domain/deswik'
import { ONZA } from '../../domain/reservas'
import { useDisenos } from '../../disenos'
import { calcularPrograma, esParada, FERIADOS, fechaDe, isoDe, usePrograma, type ActividadMina, type TipoActividad } from '../../programa'
import { evaluarReservas, useReservas } from '../../reservas'
import { Boton, Cabecera, Campo, descargar, Icon, Panel, Segmentos } from '../../ui/kit'

const COLOR: Record<TipoActividad, string> = { Desarrollo: '#3987e5', Preparación: '#3987e5', Producción: '#199e70', Relleno: '#84918d' }
const MES = new Intl.DateTimeFormat('es-PE', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const FECHA = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const mesDe = (ym: string) => MES.format(new Date(`${ym}-01T00:00:00Z`)).replace('.', '')
const UNIDAD_DEC = { m: 1, t: 0, 'm³': 0 }

export default function ProgramaMina() {
  const p = usePrograma()
  const res = useReservas()
  const { disenos } = useDisenos()
  const reservas = evaluarReservas(res, disenos)
  const r = calcularPrograma(p, reservas, disenos)
  const [nivel, setNivel] = useState('todos')
  const [foco, setFoco] = useState<ActividadMina | null>(null)

  const tasa = (k: keyof typeof p.tasas, l: string, u: string, paso = 1) => (
    <Campo l={l} u={u} paso={paso} v={p.tasas[k]} onChange={(v) => p.set({ tasas: { ...p.tasas, [k]: v } })} invalido={!(p.tasas[k] > 0)} />
  )
  const parametros = (
    <div className="col-span-3 max-[1300px]:col-span-12 space-y-4">
      <Panel titulo="Tasas" accion={<Boton variante="fant" onClick={p.restablecer}>Restablecer</Boton>}>
        <div className="p-4 grid grid-cols-2 gap-3">
          {tasa('desarrollo', 'Avance de desarrollo', 'm/día', 0.1)}
          {tasa('produccion', 'Producción por tajeo', 't/día', 10)}
          {tasa('relleno', 'Relleno', 'm³/día', 10)}
          {tasa('disp', 'Disponibilidad', '%')}
          <Campo l="Preparación por tajeo" u="m" v={p.prepMetros} onChange={(v) => p.set({ prepMetros: v })} invalido={!(p.prepMetros > 0)} />
        </div>
        <p className="px-4 pb-3 text-[12px] text-tinta-3">Duración = cantidad / (tasa × disponibilidad), en días de trabajo.</p>
      </Panel>
      <Panel titulo="Recursos">
        <div className="p-4 grid grid-cols-2 gap-3">
          {Object.entries(p.recursos).map(([k, v]) => (
            <Campo key={k} l={k} u="unid." v={v} onChange={(n) => p.set({ recursos: { ...p.recursos, [k]: n } })} invalido={!(v >= 1)} />
          ))}
        </div>
        <p className="px-4 pb-3 text-[12px] text-tinta-3">Cada actividad ocupa una unidad de su recurso mientras dura.</p>
      </Panel>
      <Panel titulo="Calendario">
        <p className="px-4 py-3 text-[12.5px] text-tinta-2">
          Desde el {FECHA.format(fechaDe(0))}, 7 días por semana en dos guardias de 12 h. Paradas en feriados ({FERIADOS.length} días de ejemplo): no
          cuentan como días de trabajo.
        </p>
      </Panel>
    </div>
  )

  if (!r.ok)
    return (
      <div className="pb-10">
        <Cabecera titulo="Programa de mina" detalle="Scheduler UG" />
        <div className="px-6 grid grid-cols-12 gap-4 items-start">
          {parametros}
          <Panel className="col-span-9 max-[1300px]:col-span-12" titulo="No se puede programar">
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

  const { acts, niv, fin, meses, periodos } = r
  const critica = new Set(Object.entries(niv.cpm).flatMap(([id, x]) => (Math.abs(x.holgura) < 1e-6 ? [id] : [])))
  const niveles = [...new Set(acts.map((a) => a.nivel))].sort((a, b) => b - a)
  const vista = acts.filter((a) => nivel === 'todos' || a.nivel === +nivel).sort((a, b) => niv.colocadas[a.id].inicio - niv.colocadas[b.id].inicio || a.id.localeCompare(b.id))
  const x = (d: number) => `${(d / fin) * 100}%`
  const tot = periodos.reduce((s, q) => ({ m: s.m + q.m, t: s.t + q.t, finos: s.finos + q.finos, des: s.des + (q.destinos.Desmonte ?? 0), rel: s.rel + q.relleno }), { m: 0, t: 0, finos: 0, des: 0, rel: 0 })
  const movidas = acts.filter((a) => niv.colocadas[a.id].retraso > 0)
  const espera = Object.keys(p.recursos).map((k) => ({ k, dias: movidas.filter((a) => a.recurso === k).reduce((s, a) => s + niv.colocadas[a.id].retraso, 0) }))
  const cuello = espera.reduce((a, b) => (b.dias > a.dias ? b : a), espera[0])
  const util = (k: string, m: { desde: number; hasta: number }) => {
    let usado = 0
    let habiles = 0
    for (let d = m.desde; d < Math.min(m.hasta, fin); d++) {
      if (esParada(d)) continue
      habiles++
      usado += niv.uso.get(k)?.[d] ?? 0
    }
    return habiles ? usado / (habiles * p.recursos[k]) : 0
  }
  const fechaFin = (a: ActividadMina) => isoDe(niv.colocadas[a.id].fin - 1)

  const exportar = () => {
    const n = new Map(acts.map((a, i) => [a.id, i + 1]))
    descargar(
      'programa_mina.csv',
      '﻿' +
        aCSV(
          acts.map((a) => ({
            Id: n.get(a.id)!,
            Nombre: a.nombre,
            Duracion: `${niv.colocadas[a.id].dias.length}d`,
            Comienzo: isoDe(niv.colocadas[a.id].inicio),
            Fin: fechaFin(a),
            Predecesoras: a.pred.map((q) => n.get(q)).join(';'),
            Recurso: a.recurso,
            Tipo: a.tipo,
            Nivel: a.nivel,
            Cantidad: +a.cantidad.toFixed(1),
            Unidad: a.unidad,
            Ley_gt: a.ley ? +a.ley.toFixed(2) : '',
            Enlace: a.enlace,
          })),
        ),
      'text/csv;charset=utf-8',
    )
  }

  return (
    <div className="pb-10">
      <Cabecera titulo="Programa de mina" detalle="Scheduler UG · mediano plazo con recursos nivelados · actividades desde Reserves UG y Designer UG">
        <Boton variante="sec" title="Id, nombre, duración, comienzo, fin y predecesoras: columnas que importa MS Project" onClick={exportar}>
          Exportar CSV
        </Boton>
      </Cabecera>
      <div className="px-6 space-y-4">
        <div className="grid grid-cols-4 max-[1100px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
          {[
            ['Fin del programa', FECHA.format(fechaDe(fin - 1)), `${fmt(fin)} días · ${acts.length} actividades`],
            ['Mineral a planta', `${fmt(tot.t)} t`, `${fmt(tot.t ? tot.finos / tot.t : 0, 2)} g/t`],
            ['Oro', `${fmt(tot.finos / ONZA)} oz`, 'producción recuperada de Reserves UG'],
            ['Desarrollo y preparación', `${fmt(tot.m, 0)} m`, `${fmt(tot.des)} t de desmonte`],
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
            <Panel
              titulo="Gantt del programa"
              accion={<Segmentos etiqueta="Nivel" valor={nivel} onChange={setNivel} opciones={[{ v: 'todos', l: 'Todos' }, ...niveles.map((n) => ({ v: String(n), l: `NV ${n}` }))]} />}
            >
              <p className="px-4 py-2 border-b border-filete text-[12.5px] min-h-[38px] text-tinta-2" aria-live="polite">
                {foco ? (
                  <>
                    <b className="text-tinta font-medium">{foco.nombre}</b> · {fmt(foco.cantidad, UNIDAD_DEC[foco.unidad])} {foco.unidad} · {FECHA.format(fechaDe(niv.colocadas[foco.id].inicio))} →{' '}
                    {FECHA.format(fechaDe(niv.colocadas[foco.id].fin - 1))} · {niv.colocadas[foco.id].dias.length} días · {foco.recurso} · holgura CPM {fmt(niv.cpm[foco.id].holgura, 1)} d
                    {niv.colocadas[foco.id].retraso > 0 && <span className="text-alerta"> · esperó {niv.colocadas[foco.id].retraso} d por {foco.recurso}</span>}
                  </>
                ) : (
                  'Pasa el cursor o el foco por una barra para ver su detalle.'
                )}
              </p>
              <div className="px-4 py-3">
                <div className="grid grid-cols-[230px_1fr] text-[11px] text-tinta-3">
                  <span />
                  <div className="relative h-5">
                    {meses.map((m, i) => (
                      <span key={m.nombre} className="absolute top-0 border-l border-filete pl-1 h-full whitespace-nowrap" style={{ left: x(m.desde) }}>
                        {/* una etiqueta cada ~60 px: el track mide ~720 px en escritorio */}
                        {i % Math.ceil(fin / 360) === 0 && fin - m.desde > 25 ? mesDe(m.nombre) : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <ul>
                  {vista.map((a) => {
                    const c = niv.colocadas[a.id]
                    const crit = critica.has(a.id)
                    return (
                      <li key={a.id} className="grid grid-cols-[230px_1fr] items-center h-7 text-[12.5px]">
                        <span className="truncate pr-3">
                          {a.nombre}
                          {crit && <span className="text-critico text-[11px]"> · crítica</span>}
                        </span>
                        <div className="relative h-full">
                          {meses.map((m) => (
                            <span key={m.nombre} className="absolute inset-y-0 border-l border-filete/60" style={{ left: x(m.desde) }} aria-hidden />
                          ))}
                          {c.retraso > 0 && (
                            <span className="absolute top-[9px] h-[10px] border border-dashed border-alerta/70 rounded-sm" style={{ left: x(c.inicio - c.retraso), width: x(c.retraso) }} aria-hidden />
                          )}
                          <button
                            onMouseEnter={() => setFoco(a)}
                            onFocus={() => setFoco(a)}
                            aria-label={`${a.nombre}: ${isoDe(c.inicio)} a ${fechaFin(a)}`}
                            className={`absolute top-[6px] h-4 rounded-sm cursor-default outline-none focus-visible:ring-2 focus-visible:ring-coral ${crit ? 'ring-1 ring-critico' : ''} ${foco?.id === a.id ? 'brightness-125' : ''}`}
                            style={{ left: x(c.inicio), width: `max(3px, ${x(c.fin - c.inicio)})`, background: COLOR[a.tipo] }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[11.5px] text-tinta-2">
                  {(['Desarrollo', 'Producción', 'Relleno'] as const).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm" style={{ background: COLOR[t] }} />
                      {t === 'Desarrollo' ? 'Desarrollo y preparación' : t}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-2.5 rounded-sm ring-1 ring-critico" /> Ruta crítica (CPM sin límite de recursos)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-2.5 rounded-sm border border-dashed border-alerta/70" /> Espera por recurso
                  </span>
                </div>
              </div>
              <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
                Reglas: preparación antes de producción; en corte y relleno, relleno después de producir; un tajeo produce cuando terminó el tajeo de abajo que se
                le traslapa. Prioridad = oro por día de scoop.
              </p>
            </Panel>

            <Panel titulo="Recursos y utilización por mes">
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] whitespace-nowrap">
                  <thead>
                    <tr className="text-left rotulo border-b border-filete">
                      <th className="px-4 py-2 font-semibold">Recurso</th>
                      {meses.map((m) => (
                        <th key={m.nombre} className="px-2 py-2 font-semibold text-right">
                          {mesDe(m.nombre)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {Object.keys(p.recursos).map((k) => (
                      <tr key={k}>
                        <td className="px-4 py-1.5">
                          {k} <span className="text-tinta-3">× {p.recursos[k]}</span>
                        </td>
                        {meses.map((m) => {
                          const u = util(k, m)
                          return (
                            <td key={m.nombre} className="px-2 py-1.5 text-right" style={{ background: `rgb(25 158 112 / ${u * 0.35})` }}>
                              {u ? `${fmt(u * 100)} %` : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p role="status" className="px-4 py-2.5 border-t border-filete text-[12.5px] text-tinta-2 flex gap-2">
                {movidas.length ? (
                  <>
                    <Icon n="alerta" className="size-4 text-alerta shrink-0" />
                    La nivelación movió {movidas.length} actividades. Cuello de botella: {cuello.k} ({fmt(cuello.dias)} días de espera en total
                    {espera.filter((e) => e.dias && e !== cuello).map((e) => `; ${e.k}: ${fmt(e.dias)}`).join('')}).
                  </>
                ) : (
                  <>
                    <Icon n="ok" className="size-4 text-bien shrink-0" /> Ninguna actividad esperó por un recurso.
                  </>
                )}
              </p>
            </Panel>

            <Panel titulo="Plan por mes">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] whitespace-nowrap">
                  <thead>
                    <tr className="text-left rotulo border-b border-filete">
                      <th className="px-4 py-2 font-semibold">Mes</th>
                      <th className="px-3 py-2 font-semibold text-right">Desarrollo</th>
                      <th className="px-3 py-2 font-semibold text-right">Planta</th>
                      <th className="px-3 py-2 font-semibold text-right">Ley</th>
                      <th className="px-3 py-2 font-semibold text-right">Oro</th>
                      <th className="px-3 py-2 font-semibold text-right">Desmonte</th>
                      <th className="px-4 py-2 font-semibold text-right">Relleno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {periodos.map((q) => (
                      <tr key={q.nombre}>
                        <td className="px-4 py-1.5 first-letter:uppercase">{mesDe(q.nombre)}</td>
                        <td className="px-3 py-1.5 text-right">{q.m ? `${fmt(q.m, 1)} m` : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{q.t ? `${fmt(q.t)} t` : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{q.t ? `${fmt(q.ley, 2)} g/t` : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{q.finos ? `${fmt(q.finos / ONZA)} oz` : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{q.destinos.Desmonte ? `${fmt(q.destinos.Desmonte)} t` : '—'}</td>
                        <td className="px-4 py-1.5 text-right">{q.relleno ? `${fmt(q.relleno)} m³` : '—'}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t border-filete-2">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-3 py-2 text-right">{fmt(tot.m, 1)} m</td>
                      <td className="px-3 py-2 text-right">{fmt(tot.t)} t</td>
                      <td className="px-3 py-2 text-right">{fmt(tot.t ? tot.finos / tot.t : 0, 2)} g/t</td>
                      <td className="px-3 py-2 text-right">{fmt(tot.finos / ONZA)} oz</td>
                      <td className="px-3 py-2 text-right">{fmt(tot.des)} t</td>
                      <td className="px-4 py-2 text-right">{fmt(tot.rel)} m³</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
                Cada actividad reparte su cantidad por igual entre sus días de trabajo. Planta: producción de tajeos; desmonte: desarrollo y preparación.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
