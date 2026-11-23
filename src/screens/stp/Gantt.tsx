import { useMemo, useState } from 'react'
import { AHORA, DIAS, EQUIPOS, GUARDIAS, HORAS_GUARDIA, type Tarea } from '../../data/minaPiloto'
import { conflictos, fmt, laborDe } from '../../derive'
import { cumplimiento } from '../../domain/stp'
import { useStore } from '../../store'
import { Boton, Cabecera, diaCorto, Icon, Panel, Pct, Segmentos } from '../../ui/kit'

const PX_H = 8 // píxeles por hora
const T0 = new Date(`${DIAS[0]}T07:00:00`).getTime()
const horaAbs = (t: Tarea) => (new Date(`${t.fecha}T00:00:00`).getTime() - T0) / 3600e3 + (t.guardia === 'D' ? 7 : 19) + t.inicio
const ANCHO = 7 * 24 * PX_H
const AHORA_X = ((AHORA.getTime() - T0) / 3600e3) * PX_H

// Series categóricas validadas contra el panel oscuro (dataviz): desarrollo azul, producción aqua. Coral queda para acción.
const SERIE = { m: '#3987e5', t: '#199e70' }

export default function Gantt() {
  const { tareas, setEquipo } = useStore()
  const [filtro, setFiltro] = useState<'todo' | 'm' | 't'>('todo')
  const [selId, setSelId] = useState<string | null>(null)
  const choques = useMemo(() => conflictos(tareas), [tareas])
  const visibles = tareas.filter((t) => filtro === 'todo' || t.unidad === filtro)
  const equipos = EQUIPOS.filter((e) => visibles.some((t) => t.equipoId === e.id) || e.tipo === 'Jumbo' || e.tipo === 'Scoop')
  const sel = tareas.find((t) => t.id === selId)
  const usoEquipo = (id: string) => tareas.filter((t) => t.equipoId === id).reduce((s, t) => s + (t.fin - t.inicio), 0)

  return (
    <div className="pb-10">
      <Cabecera titulo="Gantt de guardias">
        <Segmentos
          etiqueta="Tipo de tarea"
          valor={filtro}
          onChange={setFiltro}
          opciones={[
            { v: 'todo', l: 'Todo' },
            { v: 'm', l: 'Desarrollo' },
            { v: 't', l: 'Producción' },
          ]}
        />
      </Cabecera>
      <div className="px-6 space-y-4">
        {choques.size > 0 && (
          <div role="alert" className="flex items-center gap-2.5 text-[13px] bg-panel border border-critico/50 rounded px-4 py-2.5">
            <Icon n="x" className="size-4 text-critico" />
            <span>
              <b className="font-semibold">{choques.size} tareas con equipo en dos lugares a la vez.</b>{' '}
              <span className="text-tinta-2">Selecciona una barra marcada y asígnale otro equipo.</span>
            </span>
          </div>
        )}
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-[190px_1fr]">
            <div className="border-r border-filete">
              <div className="h-14 border-b border-filete px-4 flex items-end pb-2 rotulo">Equipo</div>
              {equipos.map((e) => (
                <div key={e.id} className="h-12 px-4 flex flex-col justify-center border-b border-filete last:border-0">
                  <div className="text-[13px] font-medium">{e.id}</div>
                  <div className="text-[11.5px] text-tinta-3 truncate">
                    {e.modelo} · {fmt((usoEquipo(e.id) / (14 * e.horasUtiles)) * 100)} % uso
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div style={{ width: ANCHO }} className="relative">
                <div className="h-14 border-b border-filete flex">
                  {DIAS.map((d) => (
                    <div key={d} style={{ width: 24 * PX_H }} className="border-l border-filete first:border-0">
                      <div className="text-[12px] text-tinta-2 px-2 pt-1.5 capitalize">{diaCorto(d)}</div>
                      <div className="flex text-[10.5px] text-tinta-3 mt-1">
                        {GUARDIAS.map((g) => (
                          <div key={g.id} style={{ width: HORAS_GUARDIA * PX_H }} className="px-2">
                            {g.nombre} {String(g.inicioHora).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {equipos.map((e) => (
                  <div key={e.id} className="h-12 relative border-b border-filete last:border-0">
                    {Array.from({ length: 14 }, (_, i) => (
                      <div key={i} className={`absolute top-0 bottom-0 ${i % 2 ? 'bg-suelo/40' : ''}`} style={{ left: i * 12 * PX_H, width: 12 * PX_H }} />
                    ))}
                    {visibles
                      .filter((t) => t.equipoId === e.id)
                      .map((t) => {
                        const x = horaAbs(t) * PX_H
                        const w = (t.fin - t.inicio) * PX_H - 2
                        const choque = choques.has(t.id)
                        // tareas en conflicto se solapan: van en carriles para poder elegir cada una
                        const grupo = choque ? visibles.filter((o) => choques.has(o.id) && o.equipoId === t.equipoId && o.fecha === t.fecha && o.guardia === t.guardia) : [t]
                        const alto = 40 / grupo.length
                        const c = cumplimiento(t.plan, t.real)
                        const lleno = t.real == null ? 0 : Math.min(1, t.real / t.plan)
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelId(t.id)}
                            title={`${laborDe(t.laborId).nombre} · ${t.tipo} · plan ${fmt(t.plan, 1)} ${t.unidad}${c != null ? ` · ${fmt(c)} %` : ''}${choque ? ' · CONFLICTO' : ''}`}
                            aria-label={`${t.laborId} ${t.tipo}${choque ? ', conflicto de equipo' : ''}`}
                            className="absolute rounded-[3px] overflow-hidden cursor-pointer transition-[filter] hover:brightness-125"
                            style={{
                              top: grupo.length > 1 ? 4 + grupo.indexOf(t) * alto : 10,
                              height: grupo.length > 1 ? alto - 2 : 28,
                              left: x + 1,
                              width: w,
                              background: `color-mix(in oklab, ${SERIE[t.unidad]} ${t.estado === 'pendiente' && t.real == null ? 22 : 38}%, var(--color-panel))`,
                              outline: choque ? '2px solid var(--color-critico)' : selId === t.id ? '2px solid var(--color-tinta)' : 'none',
                              outlineOffset: -1,
                            }}
                          >
                            <span className="absolute inset-y-0 left-0" style={{ width: `${lleno * 100}%`, background: SERIE[t.unidad], opacity: 0.55 }} />
                          </button>
                        )
                      })}
                  </div>
                ))}
                <div className="absolute top-14 bottom-0 w-px bg-coral pointer-events-none" style={{ left: AHORA_X }}>
                  <span className="absolute -top-0 left-1 text-[10.5px] text-coral font-semibold whitespace-nowrap bg-panel px-0.5">ahora</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 border-t border-filete text-[12px] text-tinta-2">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SERIE.m }} />Desarrollo (m)</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SERIE.t }} />Producción (t)</span>
            <span>Relleno de la barra = avance real sobre el plan</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm outline-2 outline-critico" />Conflicto de equipo</span>
          </div>
        </Panel>

        {sel && (
          <Panel titulo={`${laborDe(sel.laborId).nombre} · ${sel.tipo}`} accion={<Boton variante="fant" onClick={() => setSelId(null)} aria-label="Cerrar detalle"><Icon n="x" /></Boton>}>
            <div className="grid grid-cols-5 max-[900px]:grid-cols-2 gap-4 p-4 text-[13px]">
              <div>
                <div className="rotulo">Guardia</div>
                <div className="mt-1 capitalize">{diaCorto(sel.fecha)} · {sel.guardia === 'D' ? 'día' : 'noche'} · h {sel.inicio}–{sel.fin}</div>
              </div>
              <div>
                <div className="rotulo">Plan / real</div>
                <div className="mt-1">{fmt(sel.plan, 1)} / {fmt(sel.real, 1)} {sel.unidad}</div>
              </div>
              <div>
                <div className="rotulo">Cumplimiento</div>
                <div className="mt-1"><Pct pct={cumplimiento(sel.plan, sel.real)} conTexto /></div>
              </div>
              <div>
                <div className="rotulo">Causa de desvío</div>
                <div className="mt-1">{sel.causa ?? '—'}</div>
              </div>
              <label className="block">
                <span className="rotulo block">Equipo asignado</span>
                <select
                  value={sel.equipoId}
                  onChange={(e) => setEquipo(sel.id, e.target.value)}
                  className={`mt-1 h-8 w-full bg-suelo border rounded px-2 ${choques.has(sel.id) ? 'border-critico' : 'border-filete-2'}`}
                >
                  {EQUIPOS.filter((e) => e.tipo === EQUIPOS.find((x) => x.id === sel.equipoId)!.tipo).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} · {e.modelo}
                    </option>
                  ))}
                </select>
                {choques.has(sel.id) && <span className="block text-[12px] text-critico mt-1">Este equipo ya tiene otra tarea en ese horario.</span>}
              </label>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
