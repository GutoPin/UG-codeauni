import { useState } from 'react'
import { AHORA, DIAS, estadoGuardia, LABORES_SEMANA } from '../../data/minaPiloto'
import { fmt, laborDe } from '../../derive'
import { estaHabilitada, puntajeTarea } from '../../domain/stp'
import { useStore } from '../../store'
import { Boton, Cabecera, diaLargo, Icon, Panel } from '../../ui/kit'
import Reoptimizar from './Reoptimizar'

const PRIORIDAD: Record<string, number> = { Rampa: 3, Galería: 3, Crucero: 2, Chimenea: 2, Tajeo: 2 }

export default function Reprogramar() {
  const { tareas, habilitacion, arrastrar } = useStore()
  const [aviso, setAviso] = useState<string | null>(null)
  const [pesos, setPesos] = useState({ prioridad: 10, valor: 5, espera: 2 })
  const pasados = DIAS.filter((d) => estadoGuardia(d, 'N') === 'pasada')

  // Pendiente por día: plan − real de tareas reportadas que no se cumplieron.
  const pendientes = pasados.map((d) => {
    const ts = tareas.filter((t) => t.fecha === d && t.real != null && t.plan - t.real > 0.001)
    return { d, ts, hechas: ts.filter((t) => t.pendienteArrastrado != null).length }
  })

  // Candidatas para la próxima guardia: labores con pendiente acumulado, puntuadas con la heurística de la ficha.
  const candidatas = LABORES_SEMANA.map((id) => {
    const l = laborDe(id)
    const ts = tareas.filter((t) => t.laborId === id && t.real != null)
    const plan = ts.reduce((s, t) => s + t.plan, 0)
    const pendiente = ts.reduce((s, t) => s + Math.max(0, t.plan - t.real!), 0)
    const h = estaHabilitada(habilitacion[id], AHORA)
    const reingreso = habilitacion[id].reingresoHasta ? Math.max(0, (new Date(habilitacion[id].reingresoHasta!).getTime() - AHORA.getTime()) / 3600e3) : 0
    const espera = h.ok ? 0 : h.motivos.length === 1 && h.motivos[0] === 're-ingreso' ? reingreso : 12
    const f = { prioridad: PRIORIDAD[l.tipo] ?? 1, valor: plan ? (pendiente / plan) * 10 : 0, espera }
    return { l, h, pendiente, f, puntaje: puntajeTarea(f, pesos) }
  })
    .filter((c) => c.pendiente > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
  const max = Math.max(1, ...candidatas.map((c) => c.puntaje))

  return (
    <div className="pb-10">
      <Cabecera titulo="Reprogramación con lo ejecutado" />
      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        <Panel className="col-span-5 max-[1200px]:col-span-12" titulo="Arrastre de pendientes">
          <p className="px-4 pt-3 text-[13px] text-tinta-2">
            Pendiente = plan − real, si es positivo. Se suma a la meta de la próxima guardia aún no ejecutada de la misma labor y turno.
          </p>
          <ul className="divide-y divide-filete mt-2">
            {pendientes.map(({ d, ts, hechas }) => {
              const pend = (u: 'm' | 't') => ts.filter((t) => t.unidad === u).reduce((s, t) => s + (t.plan - t.real!), 0)
              const texto = [pend('m') && `${fmt(pend('m'), 1)} m`, pend('t') && `${fmt(pend('t'))} t`].filter(Boolean).join(' · ')
              const listo = ts.length > 0 && hechas === ts.length
              return (
                <li key={d} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium first-letter:uppercase">{diaLargo(d)}</div>
                    <div className="text-[12px] text-tinta-3">
                      {ts.length ? `${ts.length} tareas por debajo del plan · ${texto} pendientes` : 'Sin pendientes'}
                    </div>
                  </div>
                  {listo ? (
                    <span className="text-[12px] text-bien inline-flex items-center gap-1">
                      <Icon n="ok" className="size-3.5" /> Arrastrado
                    </span>
                  ) : (
                    <Boton
                      variante="sec"
                      disabled={!ts.length}
                      onClick={() => {
                        const n = arrastrar(d)
                        setAviso(`${n} pendientes de ${diaLargo(d)} pasaron a la próxima guardia sin ejecutar de cada labor. Se ven con «+» en el programa semanal.`)
                      }}
                    >
                      Arrastrar <Icon n="flecha" className="size-3.5" />
                    </Boton>
                  )}
                </li>
              )
            })}
          </ul>
          {aviso && (
            <p role="status" className="px-4 py-2.5 border-t border-filete text-[12.5px] text-tinta-2 flex gap-2">
              <Icon n="ok" className="size-4 text-bien shrink-0" /> {aviso}
            </p>
          )}
        </Panel>

        <Panel className="col-span-7 max-[1200px]:col-span-12" titulo="Asignación sugerida para la próxima guardia">
          <div className="px-4 py-3 border-b border-filete grid grid-cols-3 gap-4">
            {(
              [
                ['prioridad', 'Peso prioridad'],
                ['valor', 'Peso valor (pendiente)'],
                ['espera', 'Peso espera'],
              ] as const
            ).map(([k, et]) => (
              <label key={k} className="block text-[12px]">
                <span className="flex justify-between text-tinta-2">
                  {et} <b className="text-tinta font-semibold">{pesos[k]}</b>
                </span>
                <input type="range" min={0} max={20} value={pesos[k]} onChange={(e) => setPesos({ ...pesos, [k]: +e.target.value })} className="w-full accent-coral mt-1" />
              </label>
            ))}
          </div>
          <ol className="divide-y divide-filete">
            {candidatas.map((c, i) => (
              <li key={c.l.id} className="px-4 py-2.5 grid grid-cols-[24px_1fr_160px_64px] items-center gap-3 text-[13px]">
                <span className="text-tinta-3 titular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.l.nombre}</span>
                  <span className="block text-[11.5px] text-tinta-3 truncate">
                    prioridad {c.f.prioridad} · pendiente {fmt(c.pendiente, c.l.tipo === 'Tajeo' ? 0 : 1)} {c.l.tipo === 'Tajeo' ? 't' : 'm'}
                    {c.f.espera > 0 && <span className="text-alerta"> · espera {fmt(c.f.espera, 1)} h ({c.h.motivos.join(', ')})</span>}
                  </span>
                </span>
                <span className="h-2 bg-suelo rounded-sm overflow-hidden" aria-hidden>
                  <span className="block h-full bg-azul rounded-sm" style={{ width: `${Math.max(0, (c.puntaje / max) * 100)}%` }} />
                </span>
                <span className="text-right titular">{fmt(c.puntaje, 1)}</span>
              </li>
            ))}
          </ol>
          <p className="px-4 py-2.5 border-t border-filete text-[12px] text-tinta-3">
            Puntaje = peso prioridad × prioridad + peso valor × valor − peso espera × horas de espera. Es una sugerencia: el jefe de guardia
            puede cambiarla. Labores no habilitadas cargan su espera (re-ingreso o 12 h si falta ventilación, sostenimiento o equipo).
          </p>
        </Panel>

        <Reoptimizar />
      </div>
    </div>
  )
}
