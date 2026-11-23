import { useState } from 'react'
import { fmt } from '../../derive'
import { ONZA } from '../../domain/reservas'
import { compararEscenarios, type FilaEscenario } from '../../domain/scheduler'
import { usePrograma } from '../../programa'
import { Boton, Icon, Panel } from '../../ui/kit'

const signo = (v: number, d = 0) => {
  const x = +v.toFixed(d)
  return `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt(Math.abs(x), d)}`
}
const FECHA = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Escenarios aprobados del programa y su comparación con el programa actual (ficha 04). */
export default function Escenarios({ filas, fin, meses }: { filas: FilaEscenario[]; fin: number; meses: { nombre: string; t: number; finos: number }[] }) {
  const { escenarios, aprobar, cargar } = usePrograma()
  const [nombre, setNombre] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [elegido, setElegido] = useState<number | null>(null)
  const base = escenarios.find((e) => e.numero === elegido) ?? escenarios[escenarios.length - 1]
  const cambios = base ? compararEscenarios(base.actividades, filas) : []
  const marcadas = cambios.filter((c) => c.marcada)
  const suma = (ms: typeof meses) => ms.reduce((s, m) => ({ t: s.t + m.t, finos: s.finos + m.finos }), { t: 0, finos: 0 })

  return (
    <Panel titulo="Escenarios">
      <form
        className="px-4 py-3 flex flex-wrap items-end gap-3 border-b border-filete"
        onSubmit={(e) => {
          e.preventDefault()
          const n = nombre.trim() || `Escenario ${escenarios.length + 1}`
          aprobar({ nombre: n, actividades: filas, fin, meses })
          setMsg(`«${n}» aprobado. Un escenario aprobado no se edita: se cargan sus parámetros y se aprueba otro.`)
          setNombre('')
        }}
      >
        <label className="flex-1 min-w-[240px]">
          <span className="block text-[12px] text-tinta-2 mb-1">Nombre del escenario</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="p. ej. Base 2027, tres jumbos"
            className="w-full h-8 bg-suelo border border-filete-2 rounded px-2 text-[13.5px] outline-none focus:border-coral"
          />
        </label>
        <Boton variante="pri" type="submit">
          <Icon n="candado" className="size-3.5" /> Aprobar escenario {escenarios.length + 1}
        </Boton>
      </form>
      {msg && (
        <p role="status" className="px-4 py-2.5 border-b border-filete text-[12.5px] text-tinta-2 flex gap-2">
          <Icon n="ok" className="size-4 shrink-0 text-bien" /> {msg}
        </p>
      )}
      {!base ? (
        <p className="px-4 py-3 text-[12.5px] text-tinta-3">
          Aún no hay escenarios. Aprobar guarda las tasas, los recursos y las fechas de cada actividad; luego todo cambio de diseño, tasa o recurso se compara
          contra él.
        </p>
      ) : (
        <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] max-[1300px]:grid-cols-1 divide-x divide-filete max-[1300px]:divide-x-0">
          <ul className="divide-y divide-filete self-start">
            {[...escenarios].reverse().map((e) => {
              const on = e.numero === base.numero
              const x = suma(e.meses)
              return (
                <li key={e.numero} className={`px-4 py-2 flex items-start gap-3 ${on ? 'bg-panel-2' : ''}`}>
                  <button onClick={() => setElegido(e.numero)} aria-pressed={on} className="flex-1 min-w-0 text-left cursor-pointer text-[13px]">
                    <span className={`font-medium ${on ? 'text-coral' : ''}`}>
                      {e.numero}. {e.nombre}
                    </span>
                    <span className="block text-[11.5px] text-tinta-3">
                      {FECHA.format(new Date(e.fecha))} · {e.autor} · {fmt(e.fin)} días · {fmt(x.t)} t · {fmt(x.finos / ONZA)} oz
                    </span>
                  </button>
                  <Boton variante="fant" className="whitespace-nowrap" onClick={() => cargar(e.numero)}>
                    Cargar parámetros
                  </Boton>
                </li>
              )
            })}
          </ul>
          <div>
            <h3 className="px-4 pt-3 text-[13px] font-semibold">
              Actual frente a {base.numero}. {base.nombre}
            </h3>
            <p className="px-4 pt-1 pb-2 text-[12.5px] text-tinta-2">
              Plazo {signo(fin - base.fin)} días · {signo(suma(meses).t - suma(base.meses).t)} t · {signo((suma(meses).finos - suma(base.meses).finos) / ONZA)} oz
              {marcadas.length > 0 && (
                <span className="text-alerta inline-flex items-center gap-1 ml-2">
                  <Icon n="alerta" className="size-3.5" /> {marcadas.length === 1 ? '1 actividad marcada' : `${marcadas.length} actividades marcadas`} por cambio de diseño
                </span>
              )}
            </p>
            {cambios.length === 0 ? (
              <p className="px-4 pb-3 text-[12.5px] text-tinta-3 flex items-center gap-1.5">
                <Icon n="ok" className="size-3.5 text-bien" /> El programa actual coincide con el escenario.
              </p>
            ) : (
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-panel">
                    <tr className="text-left rotulo border-y border-filete">
                      <th className="px-4 py-2 font-semibold">Actividad</th>
                      <th className="px-3 py-2 font-semibold text-right">Duración</th>
                      <th className="px-3 py-2 font-semibold text-right">Inicio</th>
                      <th className="px-4 py-2 font-semibold">Causa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {[...marcadas, ...cambios.filter((c) => !c.marcada)].map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-1.5">
                          {c.marcada && <Icon n="alerta" className="size-3.5 text-alerta inline mr-1.5 -mt-0.5" />}
                          {c.nombre}
                          {c.marcada && <span className="sr-only"> (marcada para recalcular)</span>}
                        </td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">
                          {c.dias[0] === c.dias[1] ? `${c.dias[1]} d` : `${c.dias[0]} → ${c.dias[1]} d`}
                        </td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">{c.corrimiento ? `${signo(c.corrimiento)} d` : '—'}</td>
                        <td className="px-4 py-1.5 text-tinta-2">{c.causa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
