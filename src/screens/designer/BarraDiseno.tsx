import { useState } from 'react'
import { useDisenos, type Tipo } from '../../disenos'
import { estadoDiseno, ultima } from '../../domain/versiones'
import { ir } from '../../ruta'
import { Boton, Icon } from '../../ui/kit'

/** Si lo abierto se puede editar: diseño nuevo, o la última versión de un diseño en borrador. */
export function useEditable(tipo: Tipo) {
  const { disenos, [tipo]: a } = useDisenos()
  const d = disenos.find((x) => x.id === a.id)
  return !d || (a.numero === ultima(d).numero && !ultima(d).congelada)
}

/** Barra del diseño abierto: nombre, versiones, guardar, congelar y nueva versión (ficha 02). */
export default function BarraDiseno({ tipo }: { tipo: Tipo }) {
  const s = useDisenos()
  const a = s[tipo]
  const d = s.disenos.find((x) => x.id === a.id)
  const [nombre, setNombre] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const editable = useEditable(tipo)
  const v = d?.versiones.find((x) => x.numero === a.numero)
  const sucio = !!v && JSON.stringify(v.datos) !== JSON.stringify(a.datos)
  const aviso = (ok: boolean, t: string) => setMsg({ ok, t })

  return (
    <>
    <p className="hidden print:block mx-6 mb-3 text-[13px] text-tinta-2">
      {d ? `${d.nombre} · v${a.numero}${v?.congelada ? ' congelada' : ' en borrador'}${sucio ? ' con cambios sin guardar' : ''} · ${d.id}` : 'Diseño sin guardar'} · impreso {new Date().toLocaleString('es-PE')}
    </p>
    <div className="print:hidden mx-6 mb-4 bg-panel border border-filete rounded px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
      {d ? (
        <>
          <span className="font-semibold">{d.nombre}</span>
          <span className="flex items-center gap-1" role="group" aria-label="Versiones">
            {d.versiones.map((x) => (
              <button
                key={x.numero}
                onClick={() => s.abrir(d.id, x.numero)}
                aria-pressed={x.numero === a.numero}
                title={`${x.comentario} · ${x.fecha} · ${x.autor}`}
                className={`h-6 px-2 rounded border text-[12px] inline-flex items-center gap-1 cursor-pointer ${x.numero === a.numero ? 'border-tinta-3 bg-panel-2 text-tinta' : 'border-filete text-tinta-3 hover:text-tinta'}`}
              >
                {x.congelada && <Icon n="candado" className="size-3" />}v{x.numero}
              </button>
            ))}
          </span>
          <span className={`inline-flex items-center gap-1.5 ${estadoDiseno(d) === 'congelado' ? 'text-azul' : 'text-tinta-2'}`}>
            <Icon n={estadoDiseno(d) === 'congelado' ? 'candado' : 'designer'} className="size-3.5" />
            {estadoDiseno(d) === 'congelado' ? 'Congelado' : 'Borrador'}
            {d.publicada != null && <span className="text-bien"> · v{d.publicada} publicada</span>}
          </span>
          {sucio && editable && <span className="text-alerta inline-flex items-center gap-1.5"><Icon n="alerta" className="size-3.5" /> Cambios sin guardar</span>}
          {!editable && <span className="text-tinta-3">Solo lectura: una versión congelada no se edita.</span>}
          <span className="ml-auto flex gap-1.5">
            {editable && (
              <>
                <Boton variante="sec" disabled={!sucio} onClick={() => { const e = s.guardar(tipo); aviso(!e, e ?? `Guardado en v${a.numero}`) }}>
                  Guardar
                </Boton>
                <Boton variante="sec" disabled={sucio} title={sucio ? 'Guarda antes de congelar' : 'Rol: ingeniero senior de planeamiento'} onClick={() => { s.congelar(d.id); aviso(true, `v${a.numero} congelada como versión oficial`) }}>
                  <Icon n="candado" className="size-3.5" /> Congelar v{a.numero}
                </Boton>
              </>
            )}
            {!editable && (
              <Boton variante="pri" onClick={() => { s.nuevaVersion(tipo, `Desde v${a.numero}`); aviso(true, `v${ultima(d).numero + 1} creada desde v${a.numero}: ya se puede editar`) }}>
                Nueva versión desde v{a.numero}
              </Boton>
            )}
            <Boton variante="fant" title="Planta, perfil y secciones de esta versión" onClick={() => window.print()}>
              Imprimir plano
            </Boton>
            <Boton variante="fant" onClick={() => ir('/designer/proyecto')}>
              Proyecto
            </Boton>
            <Boton variante="fant" onClick={() => { s.nuevo(tipo); setMsg(null) }}>
              Nuevo
            </Boton>
          </span>
        </>
      ) : (
        <>
          <span className="text-tinta-2">Diseño nuevo, sin guardar</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={tipo === 'labor' ? 'Nombre, p. ej. Rampa 3750-3775' : 'Nombre, p. ej. Tajeo 3825-09'}
            aria-label="Nombre del diseño"
            className="h-8 w-64 bg-suelo border border-filete-2 rounded px-2 outline-none focus:border-coral"
          />
          <Boton variante="pri" onClick={() => { s.guardar(tipo, nombre); setNombre(''); aviso(true, 'Diseño guardado como v1 en borrador') }}>
            Guardar como v1
          </Boton>
          <Boton variante="fant" className="ml-auto" onClick={() => ir('/designer/proyecto')}>
            Proyecto
          </Boton>
        </>
      )}
      {msg && (
        <p role="status" className={`basis-full inline-flex items-center gap-1.5 text-[12.5px] ${msg.ok ? 'text-tinta-2' : 'text-critico'}`}>
          <Icon n={msg.ok ? 'ok' : 'x'} className={`size-3.5 ${msg.ok ? 'text-bien' : ''}`} /> {msg.t}
        </p>
      )}
    </div>
    </>
  )
}
