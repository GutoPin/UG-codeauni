import { useState } from 'react'
import { AVANCE_DISPARO, METAS_SEMANA, estadoGuardia, inicioGuardia } from '../../data/minaPiloto'
import { fmt, laborDe } from '../../derive'
import { armar, reoptimizar, type Indicadores, type Pesos } from '../../domain/reoptimizar'
import { estaHabilitada } from '../../domain/stp'
import { useStore } from '../../store'
import { Boton, diaCorto, Icon, Panel } from '../../ui/kit'

type Cambio = { id: string; antes: number; despues: number }
const pct = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt(Math.abs(x) * 100, 1)} %`

const OBJETIVOS: { k: keyof Pesos; titulo: string; valor: (x: Indicadores) => string; meta: string }[] = [
  { k: 'produccion', titulo: 'Producción', valor: (x) => `${fmt(x.t)} t`, meta: `meta ${fmt(METAS_SEMANA.t)} t` },
  { k: 'desarrollo', titulo: 'Desarrollo', valor: (x) => `${fmt(x.m, 1)} m`, meta: `meta ${fmt(METAS_SEMANA.m, 1)} m` },
  { k: 'ley', titulo: 'Ley de la mezcla', valor: (x) => `${fmt(x.leyMezcla, 2)} g/t`, meta: `objetivo ${fmt(METAS_SEMANA.ley, 1)} g/t` },
  { k: 'balance', titulo: 'Balance de equipos', valor: (x) => `${fmt(x.balance * 100, 1)} %`, meta: 'diferencia media de carga entre equipos del mismo tipo' },
]

export default function Reoptimizar() {
  const { tareas, habilitacion, setPlan } = useStore()
  const [pesos, setPesos] = useState<Pesos>({ produccion: 10, desarrollo: 10, ley: 6, balance: 2 })
  const [res, setRes] = useState<{ antes: Indicadores; despues: Indicadores; cambios: Cambio[] } | null>(null)
  const [aplicado, setAplicado] = useState<Cambio[] | null>(null)

  const modelo = () =>
    armar(tareas, {
      estado: estadoGuardia,
      ley: (id) => laborDe(id).ley,
      disparo: (id) => (laborDe(id).tipo === 'Chimenea' ? 1.8 : AVANCE_DISPARO),
      habilitada: (id, fecha, g) => estaHabilitada(habilitacion[id], inicioGuardia(fecha, g)).ok,
    })
  const { vars, fijo } = modelo()
  const hoy = reoptimizar(vars, fijo, METAS_SEMANA, pesos, 0).antes
  const fijas = vars.filter((v) => v.min === v.max).length

  const correr = () => {
    const r = reoptimizar(vars, fijo, METAS_SEMANA, pesos)
    const cambios = vars.flatMap((v, i) => (Math.abs(r.plan[i] - v.plan) > 1e-6 ? [{ id: v.id, antes: v.plan, despues: r.plan[i] }] : []))
    // el deshacer de lo ya aplicado sigue disponible mientras se mira otra propuesta
    setRes({ antes: r.antes, despues: r.despues, cambios })
  }

  return (
    <Panel
      className="col-span-12"
      titulo="Reoptimización del resto de la semana"
      accion={
        <Boton variante="pri" onClick={correr}>
          Reoptimizar
        </Boton>
      }
    >
      <p className="px-4 pt-3 text-[13px] text-tinta-2 max-w-[90ch]">
        Ajusta el plan de las {vars.length} tareas de guardias futuras para acercar la semana a sus metas, contando lo ya ejecutado. Desarrollo se mueve
        por disparos enteros y tajeos de a 10 t; equipo y horario no cambian.
        {fijas > 0 && ` ${fijas} tareas de labores no habilitadas quedan fijas.`} Es una heurística de búsqueda local: sugiere, no decide.
      </p>

      <div className="grid grid-cols-4 max-[1100px]:grid-cols-2 gap-px bg-filete border-y border-filete mt-3">
        {OBJETIVOS.map((o) => {
          const x = res ? res.despues : hoy
          return (
            <div key={o.k} className="bg-panel px-4 py-3 space-y-2">
              <div className="rotulo">{o.titulo}</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                {res && <span className="text-[13px] text-tinta-3 line-through decoration-tinta-3/60">{o.valor(res.antes)}</span>}
                <span className="text-[20px] font-semibold titular">{o.valor(x)}</span>
                {o.k !== 'balance' && <span className={`text-[12.5px] ${Math.abs(x[o.k]) <= 0.02 ? 'text-bien' : 'text-tinta-2'}`}>{pct(x[o.k])}</span>}
              </div>
              <div className="text-[11.5px] text-tinta-3">{o.meta}</div>
              <label className="block text-[12px] pt-1">
                <span className="flex justify-between text-tinta-2">
                  Peso <b className="text-tinta font-semibold">{pesos[o.k]}</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={pesos[o.k]}
                  aria-label={`Peso de ${o.titulo.toLowerCase()}`}
                  onChange={(e) => {
                    setPesos({ ...pesos, [o.k]: +e.target.value })
                    setRes(null)
                  }}
                  className="w-full accent-coral mt-1"
                />
              </label>
            </div>
          )
        })}
      </div>

      <div className="p-4 space-y-3">
        {aplicado && (
          <div role="status" className="flex items-center gap-3 text-[13px] bg-panel-2 border border-bien/40 rounded px-4 py-2.5">
            <Icon n="ok" className="size-4 text-bien shrink-0" />
            <span className="flex-1">{aplicado.length} planes actualizados. Se ven en el programa semanal y en el Gantt.</span>
            <Boton
              variante="fant"
              onClick={() => {
                aplicado.forEach((c) => setPlan(c.id, c.antes))
                setAplicado(null)
                setRes(null)
              }}
            >
              Deshacer
            </Boton>
          </div>
        )}

        {!res && !aplicado && <p className="text-[12.5px] text-tinta-3">Ajusta los pesos según lo que más importe esta semana y pulsa «Reoptimizar» para ver la propuesta antes de aplicarla.</p>}

        {res &&
          (res.cambios.length === 0 ? (
            <p role="status" className="flex items-center gap-2 text-[13px] text-tinta-2">
              <Icon n="ok" className="size-4 text-bien" /> Con estos pesos el programa actual ya es el mejor que encuentra la heurística.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 text-[13px]">
                <span className="flex-1 text-tinta-2">{res.cambios.length} tareas cambian su plan.</span>
                <Boton variante="fant" onClick={() => setRes(null)}>
                  Descartar
                </Boton>
                <Boton
                  variante="pri"
                  onClick={() => {
                    res.cambios.forEach((c) => setPlan(c.id, c.despues))
                    setAplicado(res.cambios)
                    setRes(null)
                  }}
                >
                  Aplicar {res.cambios.length} cambios
                </Boton>
              </div>
              <div className="border border-filete rounded max-h-[340px] overflow-auto">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-panel">
                    <tr className="text-left rotulo border-b border-filete">
                      <th className="px-3 py-2 font-semibold">Labor</th>
                      <th className="px-3 py-2 font-semibold">Guardia</th>
                      <th className="px-3 py-2 font-semibold">Equipo</th>
                      <th className="px-3 py-2 font-semibold text-right">Plan actual</th>
                      <th className="px-3 py-2 font-semibold text-right">Propuesto</th>
                      <th className="px-3 py-2 font-semibold text-right">Cambio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {res.cambios.map((c) => {
                      const t = tareas.find((x) => x.id === c.id)!
                      const l = laborDe(t.laborId)
                      const d = t.unidad === 'm' ? 1 : 0
                      const delta = c.despues - c.antes
                      return (
                        <tr key={c.id}>
                          <td className="px-3 py-1.5">
                            {l.nombre}
                            {t.unidad === 't' && <span className="text-tinta-3 text-[11.5px]"> · {fmt(l.ley, 1)} g/t</span>}
                          </td>
                          <td className="px-3 py-1.5 text-tinta-2 first-letter:uppercase">
                            {diaCorto(t.fecha)} {t.guardia === 'D' ? 'día' : 'noche'}
                          </td>
                          <td className="px-3 py-1.5 text-tinta-2">{t.equipoId}</td>
                          <td className="px-3 py-1.5 text-right text-tinta-2">
                            {fmt(c.antes, d)} {t.unidad}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium">
                            {fmt(c.despues, d)} {t.unidad}
                          </td>
                          <td className="px-3 py-1.5 text-right text-tinta-2">
                            {delta > 0 ? '+' : '−'}
                            {fmt(Math.abs(delta), d)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </div>
    </Panel>
  )
}
