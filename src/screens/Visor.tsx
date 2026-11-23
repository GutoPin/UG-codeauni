import { useState, type ReactNode } from 'react'
import { LABORES_SEMANA, NIVELES } from '../data/minaPiloto'
import { fmt, laborDe } from '../derive'
import { ir } from '../ruta'
import FichaLabor from '../ui/FichaLabor'
import Mina3D, { LEY_MAX, LEY_MIN, type Vista } from '../ui/Mina3D'
import { Boton, Cabecera, Icon, Panel, Pct, Segmentos } from '../ui/kit'
import { LeyendaEstados, useCumplimientoLabores } from './Inicio'

function Interruptor({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="h-8 px-2.5 rounded border border-filete-2 inline-flex items-center gap-2 text-[13px] text-tinta-2 hover:text-tinta cursor-pointer"
    >
      <span className={`w-7 h-4 rounded-full relative transition-colors ${on ? 'bg-coral' : 'bg-filete-2'}`}>
        <span className={`absolute top-0.5 size-3 rounded-full bg-tinta transition-[left] ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      {children}
    </button>
  )
}

/** Un renglón de la guía: dibujo pequeño de la pieza + qué es. */
const Pieza = ({ dibujo, titulo, children }: { dibujo: ReactNode; titulo: string; children: ReactNode }) => (
  <li className="grid grid-cols-[34px_1fr] gap-3 items-start">
    <svg viewBox="0 0 34 20" className="w-[34px] h-5 mt-0.5" aria-hidden>
      {dibujo}
    </svg>
    <div>
      <div className="text-[13px] text-tinta font-medium">{titulo}</div>
      <div className="text-[12px] text-tinta-3 leading-snug">{children}</div>
    </div>
  </li>
)

export default function Visor() {
  const { filas, niveles } = useCumplimientoLabores()
  const [verBloques, setVerBloques] = useState(true)
  const [verEquipos, setVerEquipos] = useState(true)
  const [autoRotar, setAutoRotar] = useState(false)
  const [vista, setVista] = useState<{ modo: Vista; n: number }>({ modo: '3d', n: 0 })
  const [resaltado, setResaltado] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)

  const porNivel = NIVELES.map((z) => ({ z, filas: filas.filter((f) => f.labor.nivel === z) })).filter((g) => g.filas.length)

  return (
    <div className="h-full flex flex-col">
      <Cabecera titulo="Visor 3D de la mina piloto" detalle="Pasa el mouse sobre cualquier pieza para saber qué es y cómo va · arrastra para girar · rueda para acercar">
        <Segmentos
          etiqueta="Punto de vista"
          valor={vista.modo}
          opciones={[
            { v: '3d', l: '3D' },
            { v: 'frente', l: 'Frente' },
            { v: 'planta', l: 'Desde arriba' },
          ]}
          onChange={(modo) => setVista((v) => ({ modo, n: v.n + 1 }))}
        />
        <Interruptor on={verBloques} onChange={setVerBloques}>Bloques de ley</Interruptor>
        <Interruptor on={verEquipos} onChange={setVerEquipos}>Equipos</Interruptor>
        <Interruptor on={autoRotar} onChange={setAutoRotar}>Girar</Interruptor>
      </Cabecera>

      <div className="flex-1 min-h-0 px-6 pb-6 grid grid-cols-[1fr_320px] max-[1100px]:grid-cols-1 gap-4">
        <div className="relative min-h-[520px] bg-panel border border-filete rounded overflow-hidden">
          <Mina3D
            niveles={niveles}
            verBloques={verBloques}
            verEquipos={verEquipos}
            autoRotar={autoRotar}
            seleccion={sel}
            resaltado={resaltado}
            vista={vista}
            onSelect={(id) => setSel(id || null)}
          />
          {sel && (
            <div className="absolute left-4 bottom-4 w-[320px] bg-suelo/95 border border-coral/60 rounded px-3.5 py-3">
              <FichaLabor
                id={sel}
                pie={
                  <div className="flex gap-2 mt-3">
                    <Boton variante="sec" onClick={() => ir('/stp/programa')}>
                      Ver en el programa <Icon n="flecha" className="size-3.5" />
                    </Boton>
                    <Boton variante="fant" onClick={() => setSel(null)}>
                      Soltar
                    </Boton>
                  </div>
                }
              />
            </div>
          )}
        </div>

        <aside className="min-h-0 overflow-y-auto space-y-4">
          <Panel titulo="Cómo leer la vista">
            <ul className="px-4 py-3 space-y-3">
              <Pieza titulo="Túneles" dibujo={<path d="M3 14 C 12 14, 18 6, 31 6" stroke="#a9b5b1" strokeWidth={4} strokeLinecap="round" fill="none" />}>
                Rampa en espiral, galerías a lo largo de cada nivel, cruceros y la chimenea vertical.
              </Pieza>
              <Pieza titulo="Tajeos" dibujo={<rect x={6} y={3} width={22} height={14} rx={1} fill="#a9b5b1" fillOpacity={0.35} stroke="#a9b5b1" />}>
                Las zonas de donde sale el mineral. Están entre dos niveles.
              </Pieza>
              <Pieza
                titulo="Bloques de ley"
                dibujo={[0, 1, 2, 3].map((i) => <rect key={i} x={3 + i * 7.5} y={6} width={6} height={8} rx={0.5} fill={['#3a2620', '#7a4a3a', '#c07a5f', '#ffa27f'][i]} />)}
              >
                El modelo de la veta en cubos de 5 m: más claro, más oro.
                <span className="flex items-center gap-1.5 mt-1">
                  {fmt(LEY_MIN, 1)}
                  <span className="h-1.5 w-20 rounded-sm" style={{ background: 'linear-gradient(90deg,#3a2620,#ffa27f)' }} />
                  {fmt(LEY_MAX)} g/t Au
                </span>
              </Pieza>
              <Pieza titulo="Equipos" dibujo={<path d="M17 3 23 10 17 17 11 10Z" fill="#e9eeec" />}>
                Jumbos y scoops trabajando ahora, en la guardia del jueves día.
              </Pieza>
              <li className="pt-2 border-t border-filete">
                <div className="text-[13px] text-tinta font-medium mb-1">El color es el cumplimiento de la semana</div>
                <LeyendaEstados />
                <div className="text-[12px] text-tinta-3 mt-1">En gris, lo que no está en el programa de esta semana.</div>
              </li>
            </ul>
          </Panel>

          <Panel titulo="Labores de la semana">
            <div className="py-1.5" onMouseLeave={() => setResaltado(null)}>
              {porNivel.map((g) => (
                <div key={g.z}>
                  <div className="rotulo px-4 pt-2 pb-1">Nivel {g.z}</div>
                  {g.filas.map((f) => (
                    <button
                      key={f.labor.id}
                      aria-pressed={sel === f.labor.id}
                      onMouseEnter={() => setResaltado(f.labor.id)}
                      onFocus={() => setResaltado(f.labor.id)}
                      onBlur={() => setResaltado(null)}
                      onClick={() => setSel(f.labor.id)}
                      className={`w-full px-4 py-1.5 flex items-center justify-between gap-3 text-left text-[13px] cursor-pointer hover:bg-panel-2 ${sel === f.labor.id ? 'bg-panel-2 shadow-[inset_2px_0_0_var(--color-coral)]' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{f.labor.nombre}</span>
                        <span className="block text-[11.5px] text-tinta-3">{laborDe(f.labor.id).tipo}</span>
                      </span>
                      <Pct pct={f.pct} />
                    </button>
                  ))}
                </div>
              ))}
              {LABORES_SEMANA.length === 0 && <p className="px-4 py-3 text-tinta-3">Sin labores programadas.</p>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
