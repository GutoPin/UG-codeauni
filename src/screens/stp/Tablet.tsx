import { useState } from 'react'
import { CAUSAS, EQUIPOS, GUARDIA_ACTUAL, UMBRAL_DESVIO, type Causa, type Tarea } from '../../data/minaPiloto'
import { fmt, laborDe, leerNumero } from '../../derive'
import { cumplimiento } from '../../domain/stp'
import { useStore, type MarcaCola } from '../../store'
import { Boton, Cabecera, Icon, Pct } from '../../ui/kit'

const ETIQUETA: Record<MarcaCola['tipo'], string> = { inicio: 'Inicio', avance: 'Avance', cierre: 'Cierre' }

function Tarjeta({ t, enCola }: { t: Tarea; enCola: MarcaCola[] }) {
  const marcar = useStore((s) => s.marcar)
  const paso = t.unidad === 'm' ? 0.9 : 20
  const [cantidad, setCantidad] = useState(paso)
  const [texto, setTexto] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [causa, setCausa] = useState<Causa | ''>('')
  const l = laborDe(t.laborId)
  const real = (t.real ?? 0) + enCola.filter((m) => m.tipo === 'avance').reduce((s, m) => s + m.cantidad, 0)
  const iniciada = t.estado !== 'pendiente' || enCola.some((m) => m.tipo === 'inicio')
  const cerrada = t.estado === 'cerrada' || enCola.some((m) => m.tipo === 'cierre')
  const pct = cumplimiento(t.plan, iniciada ? real : null)
  // el color de estado se reserva para tareas cerradas: a media guardia un % bajo es normal
  const exigeCausa = pct != null && pct < 100 - UMBRAL_DESVIO

  return (
    <article className={`bg-panel border rounded flex flex-col ${cerrada ? 'border-filete opacity-70' : 'border-filete-2'}`}>
      <header className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="titular text-[19px]">{l.nombre}</h2>
          <p className="text-[13px] text-tinta-2 mt-0.5">
            {t.tipo} · {t.equipoId} {EQUIPOS.find((e) => e.id === t.equipoId)?.modelo.toLowerCase()} · h {t.inicio}–{t.fin}
          </p>
        </div>
        <span className={`text-[12px] font-semibold px-2 py-1 rounded-sm ${cerrada ? 'bg-panel-2 text-tinta-2' : iniciada ? 'bg-azul/15 text-[#8dbcf3]' : 'bg-suelo text-tinta-3'}`}>
          {cerrada ? 'Cerrada' : iniciada ? 'En curso' : 'Pendiente'}
        </span>
      </header>

      <div className="px-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[28px] titular">
            {fmt(iniciada ? real : null, t.unidad === 'm' ? 1 : 0)}
            <span className="text-[15px] text-tinta-3 font-normal"> / {fmt(t.plan, t.unidad === 'm' ? 1 : 0)} {t.unidad}</span>
          </span>
          {cerrada ? <Pct pct={pct} className="text-[15px] font-semibold" /> : <span className="text-[14px] text-tinta-2">{pct == null ? 'sin iniciar' : `${fmt(pct)} % del plan`}</span>}
        </div>
        <div className="h-2 bg-suelo rounded-sm mt-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={t.plan} aria-valuenow={real} aria-label="Avance real sobre el plan">
          <div className="h-full bg-azul rounded-sm transition-[width] duration-300" style={{ width: `${Math.min(100, (real / t.plan) * 100)}%` }} />
        </div>
        {enCola.length > 0 && (
          <p className="text-[12px] text-alerta mt-2 flex items-center gap-1.5">
            <Icon n="sinsenal" className="size-3.5" /> {enCola.length} {enCola.length === 1 ? 'marca' : 'marcas'} en cola, se enviarán al volver la señal
          </p>
        )}
      </div>

      <div className="mt-auto px-5 pb-5 pt-4">
        {!iniciada && (
          <Boton variante="pri" className="w-full !h-[48px] text-[15px]" onClick={() => marcar({ tareaId: t.id, tipo: 'inicio', cantidad: 0, causa: null })}>
            <Icon n="play" /> Iniciar tarea
          </Boton>
        )}
        {iniciada && !cerrada && !cerrando && (
          <div className="flex gap-2">
            <div role="group" aria-label={`Cantidad de avance en ${t.unidad}`} className="flex items-center bg-suelo border border-filete-2 rounded h-[48px]">
              <button className="w-11 h-full text-[20px] text-tinta-2 cursor-pointer" onClick={() => setCantidad((c) => Math.max(paso, +(c - paso).toFixed(2)))} aria-label="Menos"><Icon n="menos" className="size-4 mx-auto" /></button>
              <input type="text" inputMode="decimal" aria-label={`Cantidad en ${t.unidad}`} value={texto ?? fmt(cantidad, t.unidad === 'm' ? 1 : 0)} onFocus={() => setTexto(fmt(cantidad, t.unidad === 'm' ? 1 : 0))} onChange={(e) => { setTexto(e.target.value); const n = leerNumero(e.target.value); if (Number.isFinite(n)) setCantidad(n) }} onBlur={() => setTexto(null)} className="w-14 h-full bg-transparent text-center text-[16px]" />
              <button className="w-11 h-full text-[20px] text-tinta-2 cursor-pointer" onClick={() => setCantidad((c) => +(c + paso).toFixed(2))} aria-label="Más"><Icon n="mas" className="size-4 mx-auto" /></button>
            </div>
            <Boton variante="sec" className="flex-1 !h-[48px] text-[15px]" disabled={!(cantidad > 0)} onClick={() => marcar({ tareaId: t.id, tipo: 'avance', cantidad, causa: null })}>
              Sumar {t.unidad}
            </Boton>
            <Boton variante="fant" className="!h-[48px] text-[15px] border border-filete-2" onClick={() => setCerrando(true)}>
              <Icon n="stop" /> Cerrar
            </Boton>
          </div>
        )}
        {cerrando && !cerrada && (
          <div className="space-y-2.5">
            {exigeCausa ? (
              <label className="block">
                <span className="text-[13px] text-alerta flex items-center gap-1.5 mb-1.5">
                  <Icon n="alerta" className="size-4" /> Desvío mayor a {UMBRAL_DESVIO} %: indica la causa para cerrar
                </span>
                <select value={causa} onChange={(e) => setCausa(e.target.value as Causa)} className="w-full h-[48px] bg-suelo border border-filete-2 rounded px-3 text-[15px]">
                  <option value="">Elegir causa…</option>
                  {CAUSAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-[13px] text-tinta-2">Dentro del umbral de {UMBRAL_DESVIO} %: no requiere causa.</p>
            )}
            <div className="flex gap-2">
              <Boton variante="fant" className="!h-[48px] text-[15px]" onClick={() => setCerrando(false)}>
                Volver
              </Boton>
              <Boton
                variante="pri"
                className="flex-1 !h-[48px] text-[15px]"
                disabled={exigeCausa && !causa}
                onClick={() => {
                  marcar({ tareaId: t.id, tipo: 'cierre', cantidad: 0, causa: causa || null })
                  setCerrando(false)
                }}
              >
                <Icon n="ok" /> Confirmar cierre
              </Boton>
            </div>
          </div>
        )}
        {cerrada && <p className="text-[13px] text-tinta-2">Cerrada{t.causa ? ` · causa: ${t.causa}` : ''}.</p>}
      </div>
    </article>
  )
}

export default function Tablet() {
  const { tareas, online, setOnline, cola, ultimaSync, sincronizar } = useStore()
  const guardia = tareas.filter((t) => t.fecha === GUARDIA_ACTUAL.fecha && t.guardia === GUARDIA_ACTUAL.guardia)

  return (
    <div className="pb-10">
      <Cabecera titulo="Guardia en tablet" detalle="Jueves 26 · guardia día 07:00–19:00 · jefe de guardia R. Quispe">
        <button
          role="switch"
          aria-checked={!online}
          onClick={() => setOnline(!online)}
          className={`h-10 px-3.5 rounded border inline-flex items-center gap-2 text-[14px] cursor-pointer ${online ? 'border-filete-2 text-tinta-2 hover:text-tinta' : 'border-alerta/70 text-alerta bg-alerta/10'}`}
        >
          <Icon n={online ? 'nube' : 'sinsenal'} className="size-4" />
          {online ? 'Simular sin señal' : 'Sin señal · tocar para reconectar'}
        </button>
      </Cabecera>
      <div className="px-6 grid grid-cols-[1fr_300px] max-[1100px]:grid-cols-1 gap-4 items-start">
        <div className="grid grid-cols-2 max-[760px]:grid-cols-1 gap-4">
          {guardia.map((t) => (
            <Tarjeta key={t.id} t={t} enCola={cola.filter((m) => m.tareaId === t.id)} />
          ))}
        </div>
        <aside className="bg-panel border border-filete rounded" aria-label="Cola de sincronización">
          <header className="px-4 h-11 flex items-center justify-between border-b border-filete">
            <h2 className="titular text-[15px]">Cola sin señal</h2>
            <span className="text-[12px] text-tinta-3">{cola.length} pendientes</span>
          </header>
          {cola.length ? (
            <ol className="divide-y divide-filete text-[13px]">
              {cola.map((m) => (
                <li key={m.id} className="px-4 py-2">
                  <div className="flex justify-between">
                    <span>{ETIQUETA[m.tipo]} · {laborDe(tareas.find((t) => t.id === m.tareaId)!.laborId).id}</span>
                    <span className="text-tinta-2">{m.tipo === 'avance' ? `+${fmt(m.cantidad, 1)}` : m.causa ?? ''}</span>
                  </div>
                  <div className="text-[11.5px] text-tinta-3">hora local {m.horaLocal.slice(11, 19)} · id {m.id.slice(0, 8)}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-4 py-4 text-[13px] text-tinta-3">
              Sin marcas pendientes. Activa «Simular sin señal», registra avances y vuelve a conectar: cada marca se aplica una sola vez.
            </p>
          )}
          <footer className="px-4 py-3 border-t border-filete text-[12px] text-tinta-3 flex items-center justify-between gap-2">
            <span>Última sincronización: {ultimaSync ? ultimaSync.slice(11, 19) : '—'}</span>
            {online && cola.length > 0 && (
              <Boton variante="sec" onClick={sincronizar}>
                Sincronizar
              </Boton>
            )}
          </footer>
        </aside>
      </div>
    </div>
  )
}
