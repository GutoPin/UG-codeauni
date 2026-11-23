import { useState } from 'react'
import { fmt } from '../../derive'
import { resumen, useDisenos, type Datos } from '../../disenos'
import { estadoDiseno, ultima, type Diseno } from '../../domain/versiones'
import { ir } from '../../ruta'
import { Boton, Cabecera, Icon, Panel } from '../../ui/kit'

const nombreTipo = (d: Datos) => (d.tipo === 'labor' ? d.clase : 'Tajeo')
const delta = (a: number | null, b: number | null, dec = 0) => {
  if (a == null || b == null || Math.abs(b - a) < 10 ** -dec / 2) return null
  return `${b > a ? '+' : '−'}${fmt(Math.abs(b - a), dec)}`
}

function Versiones({ d }: { d: Diseno<Datos> }) {
  const filas = d.versiones.map((v) => ({ v, r: resumen(v.datos) }))
  const tajeo = ultima(d).datos.tipo === 'tajeo'
  const col = (k: 'largo' | 'volumen' | 't' | 'ley' | 'dilucion', dec: number, u: string) =>
    filas.map(({ r }, i) => {
      const prev = i ? filas[i - 1].r[k] : null
      const dd = delta(prev, r[k], dec)
      return (
        <td key={i} className="px-3 py-2 text-right whitespace-nowrap">
          {r[k] == null ? '—' : `${fmt(r[k], dec)} ${u}`}
          {dd && <span className="block text-[11.5px] text-tinta-3">{dd} frente a v{i}</span>}
        </td>
      )
    })
  const filasTabla: [string, React.ReactNode[]][] = [
    ['Longitud', col('largo', 1, 'm')],
    ['Volumen', col('volumen', 0, 'm³')],
    [tajeo ? 'Mineral diluido' : 'Roca a extraer', col('t', 0, 't')],
    ...(tajeo ? ([['Ley diluida', col('ley', 2, 'g/t')], ['Dilución', col('dilucion', 1, '%')]] as [string, React.ReactNode[]][]) : []),
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-filete">
            <th className="px-4 py-2 text-left rotulo font-semibold">Versión</th>
            {filas.map(({ v }) => (
              <th key={v.numero} className="px-3 py-2 text-right font-normal align-bottom">
                <span className="inline-flex items-center gap-1 font-semibold">
                  {v.congelada && <Icon n="candado" className="size-3.5 text-azul" />}v{v.numero}
                  {d.publicada === v.numero && <span className="text-bien text-[11.5px] font-normal"> · publicada</span>}
                </span>
                <span className="block text-[11.5px] text-tinta-3">{v.fecha}</span>
                <span className="block text-[11.5px] text-tinta-3 truncate max-w-[180px] ml-auto" title={v.autor}>
                  {v.comentario}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-filete">
          {filasTabla.map(([l, celdas]) => (
            <tr key={l}>
              <th className="px-4 py-2 text-left font-normal text-tinta-2">{l}</th>
              {celdas}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Proyecto() {
  const s = useDisenos()
  const [sel, setSel] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const elegido = s.disenos.find((x) => x.id === sel) ?? s.disenos[0]

  const abrir = (d: Diseno<Datos>) => {
    s.abrir(d.id, ultima(d).numero)
    ir(ultima(d).datos.tipo === 'labor' ? '/designer/labor' : '/designer/tajeo')
  }

  return (
    <div className="pb-10">
      <Cabecera titulo="Proyecto de diseño" detalle="Designer UG · versiones, congelado y publicación a los otros módulos" />
      <div className="px-6 space-y-4">
        <Panel titulo="Diseños del proyecto">
          {s.disenos.length === 0 ? (
            <div className="p-6 text-[13px] text-tinta-2 space-y-3">
              <p>Todavía no hay diseños guardados. Dibuja una labor o un tajeo y pulsa «Guardar como v1».</p>
              <div className="flex gap-2">
                <Boton variante="sec" onClick={() => ir('/designer/labor')}>Constructor de labor</Boton>
                <Boton variante="sec" onClick={() => ir('/designer/tajeo')}>Tajeo paramétrico</Boton>
              </div>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left rotulo border-b border-filete">
                  <th className="px-4 py-2 font-semibold">Diseño</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Versiones</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold text-right">Toneladas (última)</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-filete">
                {s.disenos.map((d) => {
                  const u = ultima(d)
                  const r = resumen(u.datos)
                  const congelado = estadoDiseno(d) === 'congelado'
                  return (
                    <tr key={d.id} className={d.id === elegido?.id ? 'bg-panel-2' : ''}>
                      <td className="px-4 py-2">
                        <button className="font-medium hover:underline cursor-pointer text-left" onClick={() => setSel(d.id)}>
                          {d.nombre}
                        </button>
                        <span className="block text-[11.5px] text-tinta-3">{d.id}</span>
                      </td>
                      <td className="px-3 py-2 text-tinta-2">{nombreTipo(u.datos)}</td>
                      <td className="px-3 py-2 text-tinta-2">{d.versiones.length}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1.5 ${congelado ? 'text-azul' : 'text-tinta-2'}`}>
                          <Icon n={congelado ? 'candado' : 'designer'} className="size-3.5" /> {congelado ? `v${u.numero} congelada` : `v${u.numero} en borrador`}
                        </span>
                        {d.publicada != null && (
                          <span className="block text-[11.5px] text-bien">
                            <Icon n="ok" className="size-3 inline" /> v{d.publicada} publicada
                          </span>
                        )}
                        {r.errores > 0 && <span className="block text-[11.5px] text-critico">{r.errores} reglas sin cumplir</span>}
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(r.t)} t</td>
                      <td className="px-4 py-2">
                        <span className="flex justify-end gap-1.5">
                          <Boton variante="fant" onClick={() => abrir(d)}>
                            Abrir
                          </Boton>
                          <Boton
                            variante="sec"
                            disabled={!congelado || d.publicada === u.numero}
                            title={congelado ? 'Entrega labores a Scheduler y tonelaje a Reserves' : 'Solo se publica una versión congelada'}
                            onClick={() => {
                              const e = s.publicar(d.id, u.numero)
                              setMsg({ ok: !e, t: e ?? `${d.nombre} v${u.numero} publicada a Scheduler UG y Reserves UG` })
                            }}
                          >
                            Publicar v{u.numero}
                          </Boton>
                          <button aria-label={`Quitar ${d.nombre}`} className="px-1.5 text-tinta-3 hover:text-critico cursor-pointer" onClick={() => s.borrar(d.id)}>
                            <Icon n="x" className="size-4" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {msg && (
            <p role="status" className={`px-4 py-2.5 border-t border-filete text-[12.5px] inline-flex items-center gap-1.5 w-full ${msg.ok ? 'text-tinta-2' : 'text-critico'}`}>
              <Icon n={msg.ok ? 'ok' : 'x'} className={`size-3.5 ${msg.ok ? 'text-bien' : ''}`} /> {msg.t}
            </p>
          )}
        </Panel>

        {elegido && (
          <Panel titulo={`Comparación de versiones · ${elegido.nombre}`}>
            <Versiones d={elegido} />
          </Panel>
        )}
      </div>
    </div>
  )
}
