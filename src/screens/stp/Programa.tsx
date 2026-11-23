import { useMemo, useState } from 'react'
import { AHORA, DIAS, estadoGuardia, EQUIPOS, LABORES_SEMANA, resumenLabor, type HabilitacionLabor } from '../../data/minaPiloto'
import { agregado, conflictos, fmt, laborDe, leerNumero } from '../../derive'
import { estaHabilitada } from '../../domain/stp'
import { useStore } from '../../store'
import { Boton, Cabecera, diaCorto, Icon, Panel, Pct, Segmentos } from '../../ui/kit'
import SeccionLongitudinal from '../../ui/SeccionLongitudinal'
import { useCumplimientoLabores } from '../Inicio'

const CHEQUEOS: { k: keyof HabilitacionLabor; l: string }[] = [
  { k: 'ventilacionOk', l: 'Vent.' },
  { k: 'sostenimientoOk', l: 'Sost.' },
  { k: 'equipoOk', l: 'Equipo' },
]

export default function Programa() {
  const { tareas, habilitacion, setHabilitacion, setPlan, programarLabor } = useStore()
  const { pct, niveles } = useCumplimientoLabores()
  const [vista, setVista] = useState<'semana' | string>('semana')
  const [hover, setHover] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const choques = useMemo(() => conflictos(tareas), [tareas])

  const filas = LABORES_SEMANA.map((id) => {
    const l = laborDe(id)
    const h = estaHabilitada(habilitacion[id], AHORA)
    return { l, h, r: resumenLabor(l, tareas), ts: tareas.filter((t) => t.laborId === id) }
  })
  const tot = filas.reduce(
    (s, f) => ({ avance: s.avance + f.r.avance, disparos: s.disparos + f.r.disparos, toneladas: s.toneladas + f.r.toneladas, perforados: s.perforados + f.r.perforados, sostenimiento: s.sostenimiento + f.r.sostenimiento }),
    { avance: 0, disparos: 0, toneladas: 0, perforados: 0, sostenimiento: 0 },
  )
  const dia = vista === 'semana' ? null : vista
  const totalPct = agregado(tareas.filter((t) => LABORES_SEMANA.includes(t.laborId))).pct

  return (
    <div className="pb-10">
      <Cabecera titulo="Programa semanal por labor">
        <Segmentos
          etiqueta="Vista del programa"
          valor={vista}
          onChange={setVista}
          opciones={[{ v: 'semana', l: 'Semana' }, ...DIAS.map((d) => ({ v: d, l: diaCorto(d) }))]}
        />
      </Cabecera>

      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        <Panel className="col-span-7 max-[1200px]:col-span-12" titulo="Ubicación en la sección longitudinal">
          <div className="px-4 py-3">
            <SeccionLongitudinal pct={pct} niveles={niveles} seleccion={hover} onHover={setHover} />
          </div>
        </Panel>

        <Panel className="col-span-5 max-[1200px]:col-span-12" titulo="Cómo se calcula">
          <ul className="px-4 py-3 space-y-2 text-[13px] text-tinta-2">
            <li>Avance por disparo = barreno 3,0 m × eficiencia 0,90 = <b className="text-tinta">2,7 m</b>.</li>
            <li>Tonelaje = sección × avance × densidad.</li>
            <li>Perforación = disparos × 38 taladros × 3,0 m.</li>
            <li>Una labor sin ventilación, sostenimiento, equipo o con re-ingreso pendiente no se programa: toca un chequeo para cambiarlo.</li>
            <li>Un número en rojo con <Icon n="x" className="size-3 inline text-critico" /> es un equipo asignado a dos tareas a la vez.</li>
          </ul>
        </Panel>

        {aviso && (
          <div role="status" className="col-span-12 flex items-center gap-2 text-[13px] bg-panel border border-filete rounded px-4 py-2.5">
            <Icon n="ok" className="size-4 text-bien" /> {aviso}
            <button className="ml-auto text-tinta-3 hover:text-tinta cursor-pointer" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
              <Icon n="x" />
            </button>
          </div>
        )}

        <Panel className="col-span-12 overflow-x-auto">
          <table className="tabla w-full text-[13px] min-w-[1080px]">
            <thead className="sticky top-0 bg-panel">
              <tr className="[&>th]:py-2.5 [&>th]:px-2 border-b border-filete">
                <th className="!pl-4">Labor</th>
                <th>Habilitación</th>
                {dia ? (
                  <>
                    <th className="text-right">Guardia día</th>
                    <th className="text-right">Guardia noche</th>
                    <th>Equipo</th>
                    <th className="text-right">Real</th>
                  </>
                ) : (
                  <>
                    <th className="text-right">Avance m</th>
                    <th className="text-right">Disp.</th>
                    <th className="text-right">Ton. t</th>
                    <th className="text-right">Perf. m</th>
                    <th className="text-right">Sost. m</th>
                    {DIAS.map((d) => (
                      <th key={d} className="text-right capitalize">
                        {diaCorto(d)}
                      </th>
                    ))}
                  </>
                )}
                <th className="text-right !pr-4">Cumpl.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ l, h, r, ts }) => (
                <tr
                  key={l.id}
                  onMouseEnter={() => setHover(l.id)}
                  onMouseLeave={() => setHover(null)}
                  className={`border-b border-filete last:border-0 transition-colors ${hover === l.id ? 'bg-panel-2' : ''}`}
                >
                  <td className="pl-4 pr-2 py-2">
                    <div className="font-medium">{l.nombre}</div>
                    <div className="text-[11.5px] text-tinta-3">
                      {l.id} · {l.tipo} · NV {l.nivel} · plan en {l.tipo === 'Tajeo' ? 't' : 'm'}
                    </div>
                  </td>
                  <td className="px-2">
                    <div className="flex items-center gap-1">
                      {CHEQUEOS.map(({ k, l: et }) => {
                        const ok = habilitacion[l.id][k] as boolean
                        return (
                          <button
                            key={k}
                            onClick={() => setHabilitacion(l.id, { [k]: !ok })}
                            aria-pressed={ok}
                            title={`${et}: ${ok ? 'habilitado' : 'no habilitado'} (clic para cambiar)`}
                            className={`h-6 px-1.5 rounded-sm text-[11px] border cursor-pointer inline-flex items-center gap-1 ${ok ? 'border-filete text-tinta-3 hover:text-tinta-2' : 'border-alerta/60 text-alerta bg-alerta/10'}`}
                          >
                            <Icon n={ok ? 'ok' : 'x'} className="size-3" />
                            {et}
                          </button>
                        )
                      })}
                    </div>
                    {!h.ok && (
                      <div className="text-[11.5px] text-alerta mt-1 flex items-center gap-1">
                        <Icon n="alerta" className="size-3" /> Labor no habilitada
                        {habilitacion[l.id].reingresoHasta && h.motivos.includes('re-ingreso') && ` · re-ingreso ${habilitacion[l.id].reingresoHasta!.slice(11, 16)}`}
                      </div>
                    )}
                    {h.ok && ts.length === 0 && (
                      <Boton
                        variante="sec"
                        className="mt-1 !h-6 text-[11.5px]"
                        onClick={() => {
                          const n = programarLabor(l.id)
                          setAviso(`${l.nombre}: ${n} guardias programadas.`)
                        }}
                      >
                        <Icon n="mas" className="size-3" /> Programar labor
                      </Boton>
                    )}
                  </td>
                  {dia ? (
                    <>
                      {(['D', 'N'] as const).map((g) => {
                        const t = ts.find((x) => x.fecha === dia && x.guardia === g)
                        if (!t) return <td key={g} className="px-2 text-right text-tinta-3">—</td>
                        const editable = estadoGuardia(dia, g) === 'futura'
                        return (
                          <td key={g} className="px-2 text-right">
                            <label className="inline-flex items-center gap-1.5">
                              <span className="sr-only">Plan {l.nombre} guardia {g === 'D' ? 'día' : 'noche'}</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!editable || !h.ok}
                                defaultValue={fmt(t.plan, t.unidad === 'm' ? 1 : 0)}
                                key={t.plan}
                                onBlur={(e) => {
                                  const n = leerNumero(e.target.value)
                                  // validación de la ficha: plan mayor a cero; si no, se repone el valor guardado
                                  if (n > 0) setPlan(t.id, n)
                                  else e.target.value = fmt(t.plan, t.unidad === 'm' ? 1 : 0)
                                }}
                                className={`w-20 h-7 text-right bg-suelo border rounded-sm px-1.5 disabled:opacity-50 disabled:border-transparent ${choques.has(t.id) ? 'border-critico' : 'border-filete-2'}`}
                              />
                              <span className="text-tinta-3 text-[12px] w-3 text-left">{t.unidad}</span>
                            </label>
                          </td>
                        )
                      })}
                      <td className="px-2">
                        {ts
                          .filter((x) => x.fecha === dia)
                          .map((t) => (
                            <div key={t.id} className={`text-[12px] ${choques.has(t.id) ? 'text-critico' : 'text-tinta-2'}`} title={EQUIPOS.find((e) => e.id === t.equipoId)?.modelo}>
                              {t.guardia} · {t.equipoId}
                              {choques.has(t.id) && ' · en dos tareas'}
                            </div>
                          ))}
                      </td>
                      <td className="px-2 text-right text-tinta-2">
                        {fmt(
                          ts.filter((x) => x.fecha === dia && x.real != null).reduce((s, x) => s + (x.real ?? 0), 0) || null,
                          r.avance ? 1 : 0,
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 text-right">{fmt(r.avance || null, 1)}</td>
                      <td className="px-2 text-right">{fmt(r.disparos || null)}</td>
                      <td className="px-2 text-right">{fmt(r.toneladas || null)}</td>
                      <td className="px-2 text-right">{fmt(r.perforados || null)}</td>
                      <td className="px-2 text-right">{fmt(r.sostenimiento || null, 1)}</td>
                      {DIAS.map((d) => {
                        const dts = ts.filter((t) => t.fecha === d)
                        const plan = dts.reduce((s, t) => s + t.plan, 0)
                        const choque = dts.some((t) => choques.has(t.id))
                        const arr = dts.reduce((s, t) => s + (t.arrastre ?? 0), 0)
                        return (
                          <td key={d} className="px-2 text-right">
                            <button
                              onClick={() => setVista(d)}
                              className={`tabular-nums cursor-pointer hover:text-tinta ${plan ? (choque ? 'text-critico font-semibold' : 'text-tinta-2') : 'text-tinta-3'}`}
                              title={choque ? 'Conflicto de equipo: un equipo en dos tareas a la vez' : 'Ver el día'}
                              aria-label={`${diaCorto(d)}: plan ${plan ? fmt(plan, 1) : 'sin tareas'}${choque ? ', conflicto de equipo' : ''}`}
                            >
                              {choque && <Icon n="x" className="size-3 inline mr-0.5 -mt-0.5" />}
                              {plan ? fmt(plan, l.tipo === 'Tajeo' ? 0 : 1) : '—'}
                              {arr > 0 && <span className="text-tinta" title={`incluye ${fmt(arr, 1)} arrastrado`}>+</span>}
                            </button>
                          </td>
                        )
                      })}
                    </>
                  )}
                  <td className="pr-4 pl-2 text-right">
                    <Pct pct={pct[l.id] ?? null} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-filete-2 font-semibold [&>td]:py-2.5">
                <td className="pl-4 pr-2" colSpan={2}>Total de la semana</td>
                {dia ? (
                  <td colSpan={4} />
                ) : (
                  <>
                    <td className="px-2 text-right">{fmt(tot.avance, 1)}</td>
                    <td className="px-2 text-right">{fmt(tot.disparos)}</td>
                    <td className="px-2 text-right">{fmt(tot.toneladas)}</td>
                    <td className="px-2 text-right">{fmt(tot.perforados)}</td>
                    <td className="px-2 text-right">{fmt(tot.sostenimiento, 1)}</td>
                    <td colSpan={DIAS.length} />
                  </>
                )}
                <td className="pr-4 pl-2 text-right"><Pct pct={totalPct} /></td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      </div>
    </div>
  )
}
