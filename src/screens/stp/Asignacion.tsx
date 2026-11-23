import { useMemo, useState } from 'react'
import { AHORA, CUADRILLAS, DIAS, EQUIPOS, GUARDIAS, HORAS_GUARDIA, LABORES_SEMANA, estadoGuardia, type Guardia, type Tarea } from '../../data/minaPiloto'
import { conflictos, fmt, laborDe } from '../../derive'
import { estaHabilitada, sugerirAsignacion } from '../../domain/stp'
import { useStore } from '../../store'
import { Boton, Cabecera, diaCorto, Icon, Panel } from '../../ui/kit'

type Cambio = { id: string; equipoId: string }
const tipoDe = (equipoId: string) => EQUIPOS.find((e) => e.id === equipoId)!.tipo
// una tarea ya iniciada o cerrada no se reasigna: su equipo está en el frente
const fija = (t: Tarea) => t.estado !== 'pendiente'

// guardias que todavía se pueden asignar: la actual y las futuras
const OPCIONES = DIAS.flatMap((fecha) => GUARDIAS.map((g) => ({ fecha, guardia: g.id, nombre: g.nombre }))).filter(
  (o) => estadoGuardia(o.fecha, o.guardia) !== 'pasada',
)

const sel = 'h-8 w-full bg-suelo border rounded px-2 text-[13px] disabled:opacity-60 disabled:cursor-not-allowed'

export default function Asignacion() {
  const { tareas, habilitacion, asignar } = useStore()
  const [g, setG] = useState(OPCIONES[0])
  const [aviso, setAviso] = useState<{ texto: string; deshacer: Cambio[] | null; alerta: boolean } | null>(null)

  const choquesTodos = useMemo(() => conflictos(tareas), [tareas])
  const enGuardia = (o: { fecha: string; guardia: Guardia }) => tareas.filter((t) => t.fecha === o.fecha && t.guardia === o.guardia)
  const ts = enGuardia(g).sort((a, b) => a.inicio - b.inicio || a.laborId.localeCompare(b.laborId))
  const choques = new Set(ts.filter((t) => choquesTodos.has(t.id)).map((t) => t.id))
  const cuadrillas = CUADRILLAS.filter((c) => c.guardia === g.guardia)
  const hab = (laborId: string) => estaHabilitada(habilitacion[laborId], AHORA)

  // labores de la semana sin tarea en esta guardia: o no están habilitadas o nadie las tomó
  const sinAsignar = LABORES_SEMANA.filter((id) => !ts.some((t) => t.laborId === id)).map((id) => ({ l: laborDe(id), h: hab(id) }))

  const sugerir = () => {
    const r = sugerirAsignacion(ts, EQUIPOS, new Set(ts.filter(fija).map((t) => t.id)))
    const cambios = ts.filter((t) => r.asignacion[t.id] !== t.equipoId).map((t) => ({ id: t.id, equipoId: r.asignacion[t.id] }))
    const antes = choques.size
    const despues = conflictos(ts.map((t) => ({ ...t, equipoId: r.asignacion[t.id] }))).size
    asignar(cambios)
    const resto = r.sinResolver.length ? ` ${r.sinResolver.length} tareas no tienen otro equipo libre del mismo tipo: muévelas de hora en el Gantt.` : ''
    setAviso({
      texto: cambios.length
        ? `${cambios.length} ${cambios.length === 1 ? 'cambio' : 'cambios'} de equipo. Tareas en conflicto: ${antes} → ${despues}.${resto}`
        : `La asignación ya es realizable: ningún equipo está en dos frentes a la vez ni pasa sus horas útiles.${resto}`,
      deshacer: cambios.length ? ts.filter((t) => cambios.some((c) => c.id === t.id)).map((t) => ({ id: t.id, equipoId: t.equipoId })) : null,
      alerta: r.sinResolver.length > 0,
    })
  }

  return (
    <div className="pb-10">
      <Cabecera titulo="Asignación de equipo y cuadrilla">
        <Boton variante="pri" onClick={sugerir}>
          Sugerir asignación
        </Boton>
      </Cabecera>

      <div className="px-6 space-y-4">
        <div role="radiogroup" aria-label="Guardia" className="flex flex-wrap gap-1.5">
          {OPCIONES.map((o) => {
            const on = o.fecha === g.fecha && o.guardia === g.guardia
            const n = enGuardia(o).filter((t) => choquesTodos.has(t.id)).length
            return (
              <button
                key={o.fecha + o.guardia}
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setG(o)
                  setAviso(null)
                }}
                className={`h-9 px-3 rounded border text-[13px] inline-flex items-center gap-2 cursor-pointer transition-colors ${on ? 'bg-panel-2 border-tinta-3 text-tinta' : 'border-filete text-tinta-2 hover:text-tinta hover:border-filete-2'}`}
              >
                <span className="first-letter:uppercase">{diaCorto(o.fecha)}</span>
                <span className="text-tinta-3">{o.nombre.toLowerCase()}</span>
                {estadoGuardia(o.fecha, o.guardia) === 'actual' && <span className="text-[11px] font-semibold text-coral">ahora</span>}
                {n > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-critico">
                    <Icon n="x" className="size-3" />
                    {n}
                    <span className="sr-only"> tareas en conflicto</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {aviso && (
          <div role="status" className={`flex items-center gap-3 text-[13px] bg-panel border rounded px-4 py-2.5 ${aviso.alerta ? 'border-alerta/50' : 'border-bien/40'}`}>
            <Icon n={aviso.alerta ? 'alerta' : 'ok'} className={`size-4 shrink-0 ${aviso.alerta ? 'text-alerta' : 'text-bien'}`} />
            <span className="flex-1">{aviso.texto}</span>
            {aviso.deshacer && (
              <Boton
                variante="fant"
                onClick={() => {
                  asignar(aviso.deshacer!)
                  setAviso(null)
                }}
              >
                Deshacer
              </Boton>
            )}
          </div>
        )}
        {!aviso && choques.size > 0 && (
          <div role="alert" className="flex items-center gap-2.5 text-[13px] bg-panel border border-critico/50 rounded px-4 py-2.5">
            <Icon n="x" className="size-4 text-critico" />
            <span>
              <b className="font-semibold">{choques.size} tareas con un equipo en dos frentes a la vez.</b>{' '}
              <span className="text-tinta-2">Cambia el equipo a mano o usa «Sugerir asignación».</span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 items-start">
          <Panel className="col-span-8 max-[1200px]:col-span-12 overflow-hidden" titulo={`Tareas · ${diaCorto(g.fecha)} guardia ${g.nombre.toLowerCase()}`} accion={<span className="text-[12px] text-tinta-3">{ts.length} tareas</span>}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left rotulo border-b border-filete">
                  <th className="px-4 py-2 font-semibold">Labor</th>
                  <th className="px-2 py-2 font-semibold">Tarea</th>
                  <th className="px-2 py-2 font-semibold w-[205px]">Equipo</th>
                  <th className="px-2 py-2 font-semibold w-[130px]">Cuadrilla</th>
                  <th className="px-4 py-2 font-semibold w-[175px]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-filete">
                {ts.map((t) => {
                  const l = laborDe(t.laborId)
                  const h = hab(t.laborId)
                  const choca = choques.has(t.id)
                  return (
                    <tr key={t.id} className={choca ? 'bg-critico/[0.06]' : ''}>
                      <td className="px-4 py-2">
                        <div className="font-medium">{l.nombre}</div>
                        <div className="text-[11.5px] text-tinta-3">{l.tipo}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div>{t.tipo}</div>
                        <div className="text-[11.5px] text-tinta-3">
                          h {t.inicio}–{t.fin} · {fmt(t.plan, t.unidad === 'm' ? 1 : 0)} {t.unidad}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          aria-label={`Equipo para ${l.nombre}, horas ${t.inicio} a ${t.fin}`}
                          value={t.equipoId}
                          disabled={fija(t)}
                          title={fija(t) ? 'Tarea iniciada: su equipo ya está en el frente' : undefined}
                          onChange={(e) => {
                            asignar([{ id: t.id, equipoId: e.target.value }])
                            setAviso(null)
                          }}
                          className={`${sel} ${choca ? 'border-critico' : 'border-filete-2'}`}
                        >
                          {EQUIPOS.filter((e) => e.tipo === tipoDe(t.equipoId)).map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.id} · {e.modelo}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          aria-label={`Cuadrilla para ${l.nombre}, horas ${t.inicio} a ${t.fin}`}
                          value={t.cuadrillaId}
                          disabled={fija(t)}
                          onChange={(e) => asignar([{ id: t.id, cuadrillaId: e.target.value }])}
                          className={`${sel} border-filete-2`}
                        >
                          {cuadrillas.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-[12.5px]">
                        {choca ? (
                          <span className="inline-flex items-center gap-1 text-critico"><Icon n="x" className="size-3.5" />Equipo ocupado a esa hora</span>
                        ) : !h.ok ? (
                          <span className="inline-flex items-center gap-1 text-alerta"><Icon n="alerta" className="size-3.5" />No habilitada: {h.motivos.join(', ')}</span>
                        ) : fija(t) ? (
                          <span className="text-tinta-2">{t.estado === 'cerrada' ? 'Cerrada' : 'En curso'} · no se reasigna</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-tinta-2"><Icon n="ok" className="size-3.5 text-bien" />Lista</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>

          <div className="col-span-4 max-[1200px]:col-span-12 space-y-4">
            <Panel titulo="Carga de equipos en la guardia">
              <ul className="px-4 py-3 space-y-3">
                {EQUIPOS.map((e) => {
                  const mias = ts.filter((t) => t.equipoId === e.id)
                  const horas = mias.reduce((s, t) => s + t.fin - t.inicio, 0)
                  const pasa = horas > e.horasUtiles
                  return (
                    <li key={e.id}>
                      <div className="flex items-baseline justify-between text-[12.5px]">
                        <span>
                          <b className="font-semibold">{e.id}</b> <span className="text-tinta-3">{e.modelo}</span>
                        </span>
                        <span className={pasa ? 'text-alerta inline-flex items-center gap-1' : 'text-tinta-2'}>
                          {pasa && <Icon n="alerta" className="size-3.5" />}
                          {horas ? `${fmt(horas)} de ${fmt(e.horasUtiles)} h útiles` : 'libre'}
                        </span>
                      </div>
                      {/* las 12 h de la guardia; cada bloque es una tarea */}
                      <div className="relative h-3.5 mt-1 bg-suelo rounded-sm" aria-hidden>
                        {mias.map((t) => (
                          <span
                            key={t.id}
                            title={`${laborDe(t.laborId).nombre} · h ${t.inicio}–${t.fin}`}
                            className={`absolute top-0 h-full rounded-sm border border-panel ${choques.has(t.id) ? 'bg-critico' : 'bg-azul'}`}
                            style={{ left: `${(t.inicio / HORAS_GUARDIA) * 100}%`, width: `${((t.fin - t.inicio) / HORAS_GUARDIA) * 100}%` }}
                          />
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="px-4 pb-3 text-[11.5px] text-tinta-3">Barra = las {HORAS_GUARDIA} h de la guardia. En rojo, tareas que se pisan.</p>
            </Panel>

            <Panel titulo="Cuadrillas">
              <ul className="divide-y divide-filete text-[13px]">
                {cuadrillas.map((c) => {
                  const mias = ts.filter((t) => t.cuadrillaId === c.id)
                  return (
                    <li key={c.id} className="px-4 py-2.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-tinta-2">{mias.length} tareas</span>
                      </div>
                      <div className="text-[11.5px] text-tinta-3 truncate">{[...new Set(mias.map((t) => laborDe(t.laborId).id))].join(' · ') || 'Sin tareas'}</div>
                    </li>
                  )
                })}
              </ul>
            </Panel>

            {sinAsignar.length > 0 && (
              <Panel titulo="Labores sin asignar en esta guardia">
                <ul className="divide-y divide-filete text-[13px]">
                  {sinAsignar.map(({ l, h }) => (
                    <li key={l.id} className="px-4 py-2.5 flex items-start gap-2">
                      <Icon n="alerta" className="size-4 text-alerta shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">{l.nombre}</span>
                        <span className="block text-[11.5px] text-tinta-3">
                          {h.ok ? 'Habilitada, sin equipo ni cuadrilla: prográmala desde el Programa semanal' : `No habilitada: falta ${h.motivos.join(', ')}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
