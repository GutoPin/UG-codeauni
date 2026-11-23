import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { fmt, nivelDe, type Nivel } from '../derive'

// Íconos dibujados a mano, trazo 1.5 en caja de 20.
const PATHS: Record<string, string> = {
  inicio: 'M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z',
  programa: 'M3 5h14M3 10h14M3 15h14M7 3v14',
  gantt: 'M3 4v12h14M6 7h6M8 10h7M5 13h5',
  asignacion: 'M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M2.5 16.5c0-2.6 2-4.5 4.5-4.5s4.5 1.9 4.5 4.5M13 6h4.5M13 10h4.5M14.5 14h3',
  cumplimiento: 'M4 16V9m4 7V5m4 11v-5m4 5V7',
  tablet: 'M5.5 2.5h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1M9 15h2',
  reprogramar: 'M15.5 7A6 6 0 1 0 16 12M16 3.5V7h-3.5',
  cubo: 'm10 2.5 6.5 3.7v7.6L10 17.5l-6.5-3.7V6.2zM10 10l6.5-3.8M10 10v7.5M10 10 3.5 6.2',
  designer: 'M3 17 9 4l3 6 5 1M9 4l-1.5 9H17',
  reserves: 'M3 6c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5S3 7.4 3 6m0 0v8c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M3 10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5',
  scheduler: 'M3 5.5h14v11H3zM3 9h14M7 3v4M13 3v4',
  stope: 'M4 15V6l4-2v13zm6 0V8l3-1.5L16 8v7z',
  blend: 'M4 4h5l-1 4h4l-1-4h5L13 16H7z',
  cave: 'M3 6h14M5 6v10M10 6v10M15 6v10M3 16h14',
  alerta: 'M10 3 18 17H2zM10 8v4m0 2.5v.5',
  ok: 'm4.5 10.5 3.5 3.5 7.5-8',
  x: 'M5 5l10 10M15 5 5 15',
  nube: 'M6 15.5a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 14.3 7a3.8 3.8 0 0 1 .2 8.5z',
  sinsenal: 'M6 15.5a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 14.3 7a3.8 3.8 0 0 1 .2 8.5zM3 3l14 14',
  flecha: 'M4 10h12m-4-4 4 4-4 4',
  intercambio: 'M4 7h12l-3.5-3.5M16 13H4l3.5 3.5',
  mas: 'M10 4v12M4 10h12',
  menos: 'M4 10h12',
  play: 'M6 4.5v11l9-5.5z',
  stop: 'M5 5h10v10H5z',
}
export function Icon({ n, className = 'size-4' }: { n: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[n]} />
    </svg>
  )
}

export const COLOR_NIVEL: Record<Nivel, string> = {
  bien: 'var(--color-bien)',
  alerta: 'var(--color-alerta)',
  critico: 'var(--color-critico)',
  vacio: 'var(--color-tinta-3)',
}
const TEXTO_NIVEL: Record<Nivel, string> = { bien: 'En meta', alerta: 'Bajo meta', critico: 'Crítico', vacio: 'Sin reporte' }
const ICONO_NIVEL: Record<Nivel, string> = { bien: 'ok', alerta: 'alerta', critico: 'x', vacio: 'nube' }
/** Trazo del ícono de estado, para dibujarlo dentro de otros SVG. */
export const trazoNivel = (n: Nivel) => PATHS[ICONO_NIVEL[n]]

/** Cumplimiento con estado: color + ícono + texto, nunca solo color. */
export function Pct({ pct, conTexto = false, className = '' }: { pct: number | null; conTexto?: boolean; className?: string }) {
  const n = nivelDe(pct)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`} style={{ color: COLOR_NIVEL[n] }}>
      <Icon n={ICONO_NIVEL[n]} className="size-3.5 shrink-0" />
      <span className="font-semibold">{pct == null ? '—' : `${fmt(pct)} %`}</span>
      {conTexto && <span className="text-tinta-2 font-normal">{TEXTO_NIVEL[n]}</span>}
    </span>
  )
}

export function Panel({ titulo, accion, children, className = '' }: { titulo?: ReactNode; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-panel border border-filete rounded ${className}`}>
      {titulo && (
        <header className="flex items-center justify-between gap-3 px-4 h-11 border-b border-filete">
          <h2 className="titular text-[15px]">{titulo}</h2>
          {accion}
        </header>
      )}
      {children}
    </section>
  )
}

export function Boton({
  variante = 'sec',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'pri' | 'sec' | 'fant' }) {
  const v = {
    pri: 'bg-coral text-[#1a0d09] hover:bg-[#f08a73] font-semibold',
    sec: 'bg-panel-2 border border-filete-2 text-tinta hover:border-tinta-3',
    fant: 'text-tinta-2 hover:text-tinta hover:bg-panel-2',
  }[variante]
  return (
    <button
      {...p}
      className={`inline-flex items-center gap-2 h-8 px-3 rounded text-[13px] transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${v} ${className}`}
    />
  )
}

export function Segmentos<T extends string>({ valor, opciones, onChange, etiqueta }: { valor: T; opciones: { v: T; l: string }[]; onChange: (v: T) => void; etiqueta: string }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex p-0.5 bg-suelo border border-filete rounded">
      {opciones.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={valor === o.v}
          onClick={() => onChange(o.v)}
          className={`h-7 px-2.5 rounded-sm text-[12.5px] cursor-pointer transition-colors ${valor === o.v ? 'bg-panel-2 text-tinta shadow-[0_1px_2px_rgb(0_0_0/.4)]' : 'text-tinta-3 hover:text-tinta-2'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export const Rotulo = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`rotulo ${className}`}>{children}</div>

const DIA_LARGO = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })
export const diaLargo = (fecha: string) => DIA_LARGO.format(new Date(`${fecha}T00:00:00`))
const DIA_CORTO = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' })
export const diaCorto = (fecha: string) => DIA_CORTO.format(new Date(`${fecha}T00:00:00`)).replace('.', '')

/** Cabecera de pantalla: título, contexto de semana/guardia y acciones. */
export function Cabecera({ titulo, detalle, children }: { titulo: string; detalle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-6 pt-6 pb-5">
      <div className="min-w-0">
        <h1 className="titular text-[26px] leading-tight">{titulo}</h1>
        <p className="text-tinta-2 mt-1 text-[13px]">
          {detalle ?? 'Semana 48 · 23–29 nov 2026 · ahora: jueves 26, guardia día, 09:40'}
        </p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

/** Campo numérico con unidad (mismo aspecto que las calculadoras). */
export function Campo({ l, v, u, paso = 1, onChange, invalido }: { l: string; v: number; u?: string; paso?: number; onChange: (n: number) => void; invalido?: boolean }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[12px] text-tinta-2 mb-1 truncate">{l}</span>
      <span className={`flex items-center bg-suelo border rounded h-8 focus-within:border-coral ${invalido ? 'border-critico' : 'border-filete-2'}`}>
        <input
          type="number"
          step={paso}
          value={Number.isNaN(v) ? '' : v}
          aria-invalid={invalido || undefined}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="w-full min-w-0 h-full bg-transparent px-2 text-[13.5px] outline-none"
        />
        {u && <span className="pr-2 text-[12px] text-tinta-3 whitespace-nowrap">{u}</span>}
      </span>
    </label>
  )
}
