import { lazy, Suspense, type ReactNode } from 'react'
import { useRuta } from './ruta'
import { useStore } from './store'
import { Icon } from './ui/kit'
import Inicio from './screens/Inicio'
import Programa from './screens/stp/Programa'
import Gantt from './screens/stp/Gantt'
import Asignacion from './screens/stp/Asignacion'
import Tablet from './screens/stp/Tablet'
import Reprogramar from './screens/stp/Reprogramar'
import Intercambio from './screens/stp/Intercambio'
import Calculadora, { MODULOS } from './screens/modulos/Calculadora'
import DisenoLabor from './screens/designer/Labor'
import DisenoTajeo from './screens/designer/Tajeo'
import DisenoProyecto from './screens/designer/Proyecto'

const Visor = lazy(() => import('./screens/Visor'))
// echarts solo se descarga al abrir Cumplimiento
const Cumplimiento = lazy(() => import('./screens/stp/Cumplimiento'))


const STP = [
  { r: '/stp/programa', l: 'Programa semanal', i: 'programa' },
  { r: '/stp/gantt', l: 'Gantt de guardias', i: 'gantt' },
  { r: '/stp/asignacion', l: 'Asignación', i: 'asignacion' },
  { r: '/stp/cumplimiento', l: 'Cumplimiento', i: 'cumplimiento' },
  { r: '/stp/tablet', l: 'Guardia en tablet', i: 'tablet' },
  { r: '/stp/reprogramar', l: 'Reprogramación', i: 'reprogramar' },
  { r: '/stp/intercambio', l: 'Archivos Deswik', i: 'intercambio' },
]

const DESIGNER = [
  { r: '/designer/labor', l: 'Constructor de labor', i: 'designer' },
  { r: '/designer/tajeo', l: 'Tajeo paramétrico', i: 'cubo' },
  { r: '/designer/proyecto', l: 'Proyecto y versiones', i: 'proyecto' },
]

function Enlace({ r, actual, icono, children, sub }: { r: string; actual: string; icono: string; children: ReactNode; sub?: ReactNode }) {
  const on = actual === r
  return (
    <a
      href={`#${r}`}
      aria-current={on ? 'page' : undefined}
      className={`group flex items-center gap-2.5 h-8 px-2.5 rounded text-[13px] transition-colors ${on ? 'bg-panel-2 text-tinta' : 'text-tinta-2 hover:text-tinta hover:bg-panel'}`}
    >
      <Icon n={icono} className={`size-4 shrink-0 ${on ? 'text-coral' : 'text-tinta-3 group-hover:text-tinta-2'}`} />
      <span className="truncate flex-1">{children}</span>
      {sub}
    </a>
  )
}

export default function App() {
  const ruta = useRuta()
  const { online, cola, reiniciar } = useStore()
  const pantalla = (() => {
    if (ruta === '/') return <Inicio />
    if (ruta === '/stp/programa') return <Programa />
    if (ruta === '/stp/gantt') return <Gantt />
    if (ruta === '/stp/asignacion') return <Asignacion />
    if (ruta === '/stp/cumplimiento') return <Suspense><Cumplimiento /></Suspense>
    if (ruta === '/stp/tablet') return <Tablet />
    if (ruta === '/stp/reprogramar') return <Reprogramar />
    if (ruta === '/stp/intercambio') return <Intercambio />
    if (ruta === '/designer/labor') return <DisenoLabor />
    if (ruta === '/designer/tajeo') return <DisenoTajeo />
    if (ruta === '/designer/proyecto') return <DisenoProyecto />
    if (ruta === '/mina') return <Suspense><Visor /></Suspense>
    const m = MODULOS.find((x) => `/modulo/${x.id}` === ruta)
    if (m) return <Calculadora key={m.id} modulo={m} />
    return <Inicio />
  })()

  return (
    <div className="h-dvh grid grid-cols-[232px_1fr] max-[900px]:grid-cols-[1fr]">
      <aside className="border-r border-filete bg-suelo flex flex-col min-h-0 max-[900px]:hidden">
        <a href="#/" className="flex items-baseline gap-2 px-4 pt-5 pb-4">
          <span className="titular text-[19px] tracking-tight">
            CODE<span className="text-coral">a</span>
          </span>
          <span className="text-tinta-2 text-[13px]">Planning UG</span>
        </a>
        <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-5" aria-label="Módulos">
          <div className="space-y-0.5">
            <Enlace r="/" actual={ruta} icono="inicio">Mina piloto</Enlace>
            <Enlace r="/mina" actual={ruta} icono="cubo">Visor 3D</Enlace>
          </div>
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span className="rotulo">Short-Term Planner UG</span>
              <span className="text-[10.5px] text-tinta-2 font-semibold" title="Hito 1 del plan de trabajo">H1</span>
            </div>
            <div className="space-y-0.5">
              {STP.map((s) => (
                <Enlace key={s.r} r={s.r} actual={ruta} icono={s.i} sub={s.r === '/stp/tablet' && cola.length > 0 ? <span className="text-[11px] text-alerta font-semibold inline-flex items-center gap-1"><Icon n="sinsenal" className="size-3" />{cola.length}<span className="sr-only"> marcas en cola</span></span> : undefined}>
                  {s.l}
                </Enlace>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span className="rotulo">Designer UG</span>
              <span className="text-[10.5px] text-tinta-2 font-semibold" title="Hito 2 del plan de trabajo">H2</span>
            </div>
            <div className="space-y-0.5">
              {DESIGNER.map((s) => (
                <Enlace key={s.r} r={s.r} actual={ruta} icono={s.i}>
                  {s.l}
                </Enlace>
              ))}
            </div>
          </div>
          <div>
            <div className="px-2.5 mb-1.5 rotulo">Calculadoras de la familia</div>
            <div className="space-y-0.5">
              {MODULOS.map((m) => (
                <Enlace key={m.id} r={`/modulo/${m.id}`} actual={ruta} icono={m.id} sub={<span className="text-[10.5px] text-tinta-3">Ola {m.ola}</span>}>
                  {m.nombre}
                </Enlace>
              ))}
            </div>
          </div>
        </nav>
        <div className="border-t border-filete px-4 py-3 text-[11.5px] text-tinta-3 leading-snug">
          <div className="flex items-center gap-1.5 text-tinta-2 mb-1">
            <Icon n={online ? 'nube' : 'sinsenal'} className={`size-3.5 ${online ? 'text-bien' : 'text-alerta'}`} />
            {online ? 'En línea' : `Sin señal · ${cola.length} en cola`}
          </div>
          Mina piloto sintética. Datos de demostración, no de una operación real.
          <button
            onClick={() => confirm('¿Volver la mina piloto a su estado inicial? Se pierden los cambios guardados en este navegador.') && reiniciar()}
            className="block mt-2 text-tinta-2 hover:text-coral underline underline-offset-2 cursor-pointer"
          >
            Reiniciar demo
          </button>
        </div>
      </aside>
      <main className="min-w-0 overflow-y-auto">{pantalla}</main>
    </div>
  )
}
