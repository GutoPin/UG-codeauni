import type { ReactNode } from 'react'
import { AHORA, EQUIPOS, GUARDIA_ACTUAL, SUPERVISORES, type Labor, type TipoLabor } from '../data/minaPiloto'
import { fmt, laborDe } from '../derive'
import { cumplimiento, estaHabilitada } from '../domain/stp'
import { useStore } from '../store'
import { Icon, Pct } from './kit'

/** Qué es cada pieza de la mina, en palabras de quien no es minero. */
export const QUE_ES: Record<TipoLabor, (l: Labor) => string> = {
  Rampa: () => 'Acceso en espiral que une todos los niveles: por aquí bajan equipos y personal.',
  Galería: (l) => `Túnel principal que corre a lo largo de la veta en el nivel ${l.nivel}.`,
  Crucero: (l) => `Túnel corto que cruza desde la galería hasta la veta, nivel ${l.nivel}.`,
  Chimenea: () => 'Conducto vertical entre los niveles 3800 y 3850, para ventilación y paso de mineral.',
  Tajeo: (l) => `Zona donde se extrae el mineral, entre los niveles ${l.nivel} y ${l.nivel + 50}.`,
}

const Fila = ({ k, children }: { k: string; children: ReactNode }) => (
  <>
    <dt className="text-tinta-3">{k}</dt>
    <dd className="text-tinta text-right">{children}</dd>
  </>
)

/** Ficha de una labor: qué es, cómo va la semana, qué pasa en la guardia actual y si está habilitada. */
export default function FichaLabor({ id, pie }: { id: string; pie?: ReactNode }) {
  const tareas = useStore((s) => s.tareas)
  const hab = useStore((s) => s.habilitacion[id])
  const l = laborDe(id)
  const ts = tareas.filter((t) => t.laborId === id)
  const u = l.tipo === 'Tajeo' ? 't' : 'm'
  const d = u === 'm' ? 1 : 0
  const rep = ts.filter((t) => t.real != null)
  const real = rep.reduce((s, t) => s + t.real!, 0)
  const planRep = rep.reduce((s, t) => s + t.plan, 0)
  const planSemana = ts.reduce((s, t) => s + t.plan, 0)
  const ahora = ts.filter((t) => t.fecha === GUARDIA_ACTUAL.fecha && t.guardia === GUARDIA_ACTUAL.guardia)
  const h = hab ? estaHabilitada(hab, AHORA) : null

  return (
    <div className="text-[12.5px] leading-snug">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="titular text-[15px]">{l.nombre}</div>
          <div className="text-tinta-3 text-[12px]">{l.tipo} · {l.id}</div>
        </div>
        {ts.length > 0 && <Pct pct={cumplimiento(planRep, rep.length ? real : null)} className="text-[13px] mt-0.5" />}
      </div>
      <p className="text-tinta-2 mt-1.5">{QUE_ES[l.tipo](l)}</p>

      {ts.length === 0 ? (
        <p className="mt-2 pt-2 border-t border-filete text-tinta-3">Fuera del programa de esta semana: terminada o en espera.</p>
      ) : (
        <dl className="mt-2 pt-2 border-t border-filete grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <Fila k="Real a la fecha">
            {fmt(rep.length ? real : null, d)} de {fmt(planRep, d)} {u}
          </Fila>
          <Fila k="Plan de la semana">
            {fmt(planSemana, d)} {u}
          </Fila>
          {ahora.map((t) => (
            <Fila key={t.id} k={`Ahora, h ${t.inicio}–${t.fin}`}>
              {t.equipoId} · {t.tipo.toLowerCase()} · {t.estado === 'pendiente' ? 'pendiente' : `${fmt(t.real ?? 0, d)} / ${fmt(t.plan, d)} ${u}`}
            </Fila>
          ))}
          {h && (
            <Fila k="Habilitación">
              {h.ok ? (
                <span className="inline-flex items-center gap-1 text-bien"><Icon n="ok" className="size-3.5" />habilitada</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-alerta"><Icon n="alerta" className="size-3.5" />falta {h.motivos.join(', ')}</span>
              )}
            </Fila>
          )}
          {l.ley > 0 && <Fila k="Ley">{fmt(l.ley, 2)} g/t Au</Fila>}
          <Fila k="Supervisor">{SUPERVISORES.find((s) => s.id === l.supervisorId)?.nombre}</Fila>
        </dl>
      )}
      {pie}
    </div>
  )
}

export const modeloEquipo = (id: string) => EQUIPOS.find((e) => e.id === id)?.modelo ?? id
