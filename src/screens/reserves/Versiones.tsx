import { useState } from 'react'
import { fmt } from '../../derive'
import { compararReservas, ONZA, type FilaVersion } from '../../domain/reservas'
import { useReservas } from '../../reservas'
import { Boton, Icon, Panel } from '../../ui/kit'

const totales = (fs: FilaVersion[]) => {
  const r = fs.filter((f) => f.estado === 'Reserva')
  const t = r.reduce((s, f) => s + f.t, 0)
  const metal = r.reduce((s, f) => s + f.metal, 0)
  return { t, metal, ley: t ? metal / t : 0 }
}
const signo = (v: number, d = 0) => {
  const x = +v.toFixed(d)
  return `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt(Math.abs(x), d)}`
}
const FECHA = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Versiones congeladas de reservas y su comparación con la evaluación actual (ficha 03). */
export default function Versiones({ actual }: { actual: FilaVersion[] }) {
  const { versiones, congelar, cargar } = useReservas()
  const [comentario, setComentario] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [elegida, setElegida] = useState<number | null>(null)
  const base = versiones.find((v) => v.numero === elegida) ?? versiones[versiones.length - 1]
  const cambios = base ? compararReservas(base.tajeos, actual) : []
  const [a, b] = [base && totales(base.tajeos), totales(actual)]

  return (
    <Panel titulo="Versiones de reservas">
      <form
        className="px-4 py-3 flex flex-wrap items-end gap-3 border-b border-filete"
        onSubmit={(e) => {
          e.preventDefault()
          const err = congelar(comentario.trim(), actual)
          setMsg(err ? { ok: false, t: err } : { ok: true, t: `Versión ${versiones.length + 1} congelada. Para cambiarla se cargan sus parámetros y se congela otra.` })
          if (!err) setComentario('')
        }}
      >
        <label className="flex-1 min-w-[260px]">
          <span className="block text-[12px] text-tinta-2 mb-1">Comentario de la versión</span>
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="p. ej. Taladros largos en NV 3850"
            className="w-full h-8 bg-suelo border border-filete-2 rounded px-2 text-[13.5px] outline-none focus:border-coral"
          />
        </label>
        <Boton variante="pri" type="submit">
          <Icon n="candado" className="size-3.5" /> Congelar versión {versiones.length + 1}
        </Boton>
      </form>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`px-4 py-2.5 border-b border-filete text-[12.5px] flex gap-2 ${msg.ok ? 'text-tinta-2' : 'text-critico'}`}>
          <Icon n={msg.ok ? 'ok' : 'x'} className={`size-4 shrink-0 ${msg.ok ? 'text-bien' : ''}`} /> {msg.t}
        </p>
      )}

      {versiones.length === 0 ? (
        <p className="px-4 py-3 text-[12.5px] text-tinta-3">
          Aún no hay versiones. Congelar guarda los parámetros y la reserva de cada tajeo; luego cada cambio se compara contra ella.
        </p>
      ) : (
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] max-[1300px]:grid-cols-1 divide-x divide-filete max-[1300px]:divide-x-0">
          <table className="w-full text-[13px] self-start">
            <thead>
              <tr className="text-left rotulo border-b border-filete">
                <th className="px-4 py-2 font-semibold">Versión</th>
                <th className="px-3 py-2 font-semibold text-right">Reserva</th>
                <th className="px-4 py-2 font-semibold text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-filete">
              {[...versiones].reverse().map((v) => {
                const x = totales(v.tajeos)
                const on = v.numero === base?.numero
                return (
                  <tr key={v.numero} className={on ? 'bg-panel-2' : ''}>
                    <td className="px-4 py-2">
                      <button onClick={() => setElegida(v.numero)} aria-pressed={on} className="text-left cursor-pointer">
                        <span className={`font-medium ${on ? 'text-coral' : ''}`}>v{v.numero}</span>{' '}
                        <span className="text-tinta-3 text-[11.5px]">
                          {FECHA.format(new Date(v.fecha))} · {v.autor}
                        </span>
                        {v.comentario && <span className="block text-[12px] text-tinta-2">{v.comentario}</span>}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {fmt(x.t)} t<span className="block text-[11.5px] text-tinta-3">{fmt(x.ley, 2)} g/t · {fmt(x.metal / ONZA)} oz</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Boton variante="fant" className="whitespace-nowrap" title="Vuelve a estos parámetros para preparar una nueva versión" onClick={() => cargar(v.numero)}>
                        Cargar parámetros
                      </Boton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {base && a && (
            <div>
              <h3 className="px-4 pt-3 text-[13px] font-semibold">Actual frente a v{base.numero}</h3>
              <p className="px-4 pt-1 pb-2 text-[12.5px] text-tinta-2">
                {signo(b.t - a.t)} t · {signo(b.ley - a.ley, 2)} g/t · {signo((b.metal - a.metal) / ONZA)} oz
              </p>
              {cambios.length === 0 ? (
                <p className="px-4 pb-3 text-[12.5px] text-tinta-3 flex items-center gap-1.5">
                  <Icon n="ok" className="size-3.5 text-bien" /> La evaluación actual coincide con v{base.numero}.
                </p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left rotulo border-y border-filete">
                      <th className="px-4 py-2 font-semibold">Tajeo</th>
                      <th className="px-3 py-2 font-semibold text-right">Δ reserva</th>
                      <th className="px-3 py-2 font-semibold text-right">Δ oro</th>
                      <th className="px-4 py-2 font-semibold">Causa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {cambios.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-1.5">{c.nombre}</td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">{signo(c.dt)} t</td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">{signo(c.dMetal / ONZA)} oz</td>
                        <td className="px-4 py-1.5 text-tinta-2">{c.causa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
