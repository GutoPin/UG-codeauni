import { lazy, Suspense, useMemo, useState } from 'react'
import { AVANCE_DISPARO, DIAS, estadoGuardia, GUARDIAS, LABORES_SEMANA, resumenLabor } from '../data/minaPiloto'
import { agregado, alertasHabilitacion, conflictos, cumplimientoPorLabor, fmt, laborDe, nivelDe, type Nivel } from '../derive'
import { useStore } from '../store'
import { Boton, Cabecera, COLOR_NIVEL, diaCorto, Icon, Panel, Pct } from '../ui/kit'
import SeccionLongitudinal from '../ui/SeccionLongitudinal'
import FichaLabor from '../ui/FichaLabor'
import { ir } from '../ruta'

const Mina3D = lazy(() => import('../ui/Mina3D'))

export function useCumplimientoLabores() {
  const tareas = useStore((s) => s.tareas)
  return useMemo(() => {
    const filas = cumplimientoPorLabor(tareas)
    const pct = Object.fromEntries(filas.map((f) => [f.labor.id, f.pct]))
    const niveles = Object.fromEntries(filas.map((f) => [f.labor.id, nivelDe(f.pct)])) as Record<string, Nivel>
    return { filas, pct, niveles }
  }, [tareas])
}

export function LeyendaEstados() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-tinta-2">
      {(
        [
          ['bien', '≥ 90 %'],
          ['alerta', '70–90 %'],
          ['critico', '< 70 %'],
          ['vacio', 'Sin reporte'],
        ] as const
      ).map(([n, l]) => (
        <span key={n} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: COLOR_NIVEL[n] }} />
          {l}
        </span>
      ))}
    </div>
  )
}

export default function Inicio() {
  const tareas = useStore((s) => s.tareas)
  const hab = useStore((s) => s.habilitacion)
  const { pct, niveles } = useCumplimientoLabores()
  const [hover, setHover] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const foco = hover ?? sel
  const alertas = alertasHabilitacion(hab)
  const choques = conflictos(tareas)
  const tareasChoque = tareas.filter((t) => choques.has(t.id))

  const dev = agregado(tareas.filter((t) => t.unidad === 'm'))
  const min = agregado(tareas.filter((t) => t.unidad === 't'))
  const planDev = tareas.filter((t) => t.unidad === 'm').reduce((s, t) => s + t.plan, 0)
  const desarrollos = LABORES_SEMANA.map(laborDe).filter((l) => l.tipo !== 'Tajeo')
  const disparosPlan = desarrollos.reduce((s, l) => s + resumenLabor(l, tareas).disparos, 0)
  const disparosReal = desarrollos.reduce((s, l) => s + Math.floor((resumenLabor(l, tareas).real ?? 0) / (l.tipo === 'Chimenea' ? 1.8 : AVANCE_DISPARO)), 0)
  const planMin = tareas.filter((t) => t.unidad === 't').reduce((s, t) => s + t.plan, 0)
  const total = agregado(tareas)

  return (
    <div className="pb-10">
      <Cabecera titulo="Mina piloto UG">
        <Boton variante="sec" onClick={() => ir('/stp/tablet')}>
          <Icon n="tablet" /> Marcar guardia
        </Boton>
        <Boton variante="pri" onClick={() => ir('/stp/programa')}>
          Abrir programa semanal <Icon n="flecha" />
        </Boton>
      </Cabecera>

      <div className="px-6 grid grid-cols-12 gap-4">
        <Panel className="col-span-7 max-[1200px]:col-span-12 relative overflow-hidden entra">
          <div className="h-[520px] max-[1200px]:h-[420px]">
            <Suspense fallback={<div className="size-full grid place-items-center text-tinta-3">Cargando visor 3D…</div>}>
              <Mina3D niveles={niveles} seleccion={sel} resaltado={hover} onSelect={(id) => setSel(id || null)} />
            </Suspense>
          </div>
          <div className="absolute left-4 top-3.5 pointer-events-none">
            <h2 className="titular text-[15px]">Veta, labores y tajeos</h2>
            <p className="text-[12px] text-tinta-3">Pasa el mouse sobre una pieza para saber qué es · clic para fijarla</p>
          </div>
          {sel && (
            <div className="absolute left-4 bottom-4 w-[300px] bg-suelo/95 border border-coral/60 rounded px-3.5 py-3">
              <FichaLabor id={sel} />
            </div>
          )}
          <div className="absolute right-4 bottom-4 text-[11.5px] text-tinta-2 bg-suelo/80 rounded px-3 py-2 space-y-1.5 border border-filete">
            <div className="flex items-center gap-2">
              Ley Au
              <span className="text-tinta-3">2,5</span>
              <span className="h-2 w-24 rounded-sm" style={{ background: 'linear-gradient(90deg,#3a2620,#ffa27f)' }} />
              <span className="text-tinta-3">11 g/t</span>
            </div>
            <div className="text-tinta-3">Labores y tajeos: color de cumplimiento</div>
          </div>
        </Panel>

        <div className="col-span-5 max-[1200px]:col-span-12 flex flex-col gap-4">
          <Panel titulo="Cumplimiento por labor" accion={<span className="text-[12px] text-tinta-3">Sección longitudinal · lun–mié reportados</span>} className="entra">
            <div className="px-4 pt-3 pb-2">
              <SeccionLongitudinal pct={pct} niveles={niveles} seleccion={foco} onHover={setHover} onSelect={(id) => setSel(sel === id ? null : id)} />
            </div>
            <div className="px-4 pb-3.5">
              <LeyendaEstados />
            </div>
          </Panel>

          <Panel titulo="Guardias de la semana" accion={<Pct pct={total.pct} />} className="entra">
            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 p-4 pt-3">
              <div className="space-y-1.5 text-[11.5px] text-tinta-2 pr-1">
                <div className="h-[17px]" />
                <div className="h-11 flex items-center">Día</div>
                <div className="h-11 flex items-center">Noche</div>
              </div>
              {DIAS.map((d) => (
                <div key={d} className="space-y-1.5">
                  <div className="text-[11.5px] text-tinta-3 text-center capitalize">{diaCorto(d)}</div>
                  {GUARDIAS.map((g) => {
                    const est = estadoGuardia(d, g.id)
                    const a = agregado(tareas.filter((t) => t.fecha === d && t.guardia === g.id))
                    const n = nivelDe(a.pct)
                    const sinRep = est === 'pasada' && a.reportadas < a.n
                    return (
                      <a
                        key={g.id}
                        href="#/stp/cumplimiento"
                        title={`${diaCorto(d)} guardia ${g.nombre.toLowerCase()}: ${est === 'futura' ? 'programada' : a.pct == null ? 'sin reporte' : `${fmt(a.pct)} %`}${sinRep ? ` · ${a.n - a.reportadas} tareas sin reporte` : ''}`}
                        className="block h-11 rounded-sm border text-center transition-colors hover:border-tinta-3"
                        style={
                          est === 'futura'
                            ? { borderColor: 'var(--color-filete)', borderStyle: 'dashed' }
                            : est === 'actual'
                              ? { borderColor: 'var(--color-coral)' }
                              : { borderColor: 'transparent', background: `color-mix(in oklab, ${COLOR_NIVEL[n]} 16%, transparent)` }
                        }
                      >
                        <div className="text-[13px] font-semibold h-full flex items-center justify-center">
                          {est === 'futura' ? <span className="sr-only">programada</span> : est === 'actual' ? <span className="text-coral">ahora</span> : <Pct pct={a.pct} />}
                          {sinRep && <span className="text-tinta-2">*</span>}
                        </div>
                      </a>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="px-4 pb-3 -mt-1 text-[11.5px] text-tinta-3">* guardia con tareas sin reporte de Shift: no se cuentan como cero.</p>
          </Panel>
        </div>

        <Panel titulo="Avance de la semana" className="col-span-5 max-[1200px]:col-span-12 entra">
          <table className="tabla w-full text-[13px]">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2.5">Indicador</th>
                <th className="px-2 py-2.5 text-right">Plan semana</th>
                <th className="px-2 py-2.5 text-right">Real a la fecha</th>
                <th className="px-4 py-2.5 text-right">Cumpl.</th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-filete">
              <tr>
                <td className="px-4 py-2.5">Avance de desarrollo</td>
                <td className="px-2 text-right">{fmt(planDev, 1)} m</td>
                <td className="px-2 text-right">{fmt(dev.real, 1)} m</td>
                <td className="px-4 text-right"><Pct pct={dev.pct} /></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Mineral de tajeos</td>
                <td className="px-2 text-right">{fmt(planMin)} t</td>
                <td className="px-2 text-right">{fmt(min.real)} t</td>
                <td className="px-4 text-right"><Pct pct={min.pct} /></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Disparos de desarrollo</td>
                <td className="px-2 text-right">{fmt(disparosPlan)}</td>
                <td className="px-2 text-right">{fmt(disparosReal)}</td>
                <td className="px-4 text-right"><Pct pct={dev.pct} /></td>
              </tr>
              <tr className="font-semibold">
                <td className="px-4 py-2.5">Semana, ponderado por tareas</td>
                <td className="px-2 text-right">{tareas.length} tareas</td>
                <td className="px-2 text-right">{total.reportadas} reportadas</td>
                <td className="px-4 text-right"><Pct pct={total.pct} /></td>
              </tr>
            </tbody>
          </table>
          <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
            Metros y toneladas se miden por separado; el cumplimiento total pondera ambos por número de tareas.
          </p>
        </Panel>

        <Panel titulo="Labores no habilitadas" accion={<span className="text-[12px] text-alerta font-semibold inline-flex items-center gap-1"><Icon n={alertas.length ? 'alerta' : 'ok'} className="size-3.5" />{alertas.length}<span className="sr-only"> labores no habilitadas</span></span>} className="col-span-4 max-[1200px]:col-span-6 max-[760px]:col-span-12 entra">
          <ul className="divide-y divide-filete">
            {alertas.map((a) => (
              <li key={a.labor.id} className="px-4 py-2.5 flex items-start gap-3">
                <Icon n="alerta" className="size-4 text-alerta mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px]">{a.labor.nombre}</div>
                  <div className="text-[12px] text-tinta-3">
                    Falta: {a.motivos.join(', ')}
                    {a.hab.reingresoHasta && a.motivos.includes('re-ingreso') && ` · re-ingreso a las ${a.hab.reingresoHasta.slice(11, 16)}`}
                  </div>
                </div>
              </li>
            ))}
            {!alertas.length && <li className="px-4 py-6 text-tinta-3 text-[13px]">Todas las labores del programa están habilitadas.</li>}
          </ul>
        </Panel>

        <Panel titulo="Conflictos de equipo" accion={<span className={`text-[12px] font-semibold inline-flex items-center gap-1 ${tareasChoque.length ? 'text-critico' : 'text-bien'}`}><Icon n={tareasChoque.length ? 'x' : 'ok'} className="size-3.5" />{tareasChoque.length}<span className="sr-only"> tareas en conflicto</span></span>} className="col-span-3 max-[1200px]:col-span-6 max-[760px]:col-span-12 entra">
          <ul className="divide-y divide-filete">
            {tareasChoque.map((t) => (
              <li key={t.id} className="px-4 py-2.5">
                <a href="#/stp/gantt" className="flex items-start gap-3 hover:text-tinta">
                  <Icon n="x" className="size-4 text-critico mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[13px]">
                      {t.equipoId} en {laborDe(t.laborId).nombre}
                    </span>
                    <span className="block text-[12px] text-tinta-3 capitalize">
                      {diaCorto(t.fecha)} · guardia {t.guardia === 'D' ? 'día' : 'noche'} · h {t.inicio}–{t.fin}
                    </span>
                  </span>
                </a>
              </li>
            ))}
            {!tareasChoque.length && <li className="px-4 py-6 text-tinta-3 text-[13px]">Ningún equipo está en dos tareas a la vez.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
