// Sección longitudinal de la veta: el plano que el planeador lee todos los días, usado como mapa de estado.
import { LABORES, LABORES_SEMANA, NIVELES } from '../data/minaPiloto'
import { fmt, type Nivel } from '../derive'
import { COLOR_NIVEL, trazoNivel } from './kit'

const X0 = -85
const X1 = 440
const Z0 = 3730
const Z1 = 3915
const W = 560
const H = 250
const sx = (x: number) => ((x - X0) / (X1 - X0)) * W
const sz = (z: number) => H - ((z - Z0) / (Z1 - Z0)) * H

export default function SeccionLongitudinal({
  pct,
  niveles,
  seleccion,
  onHover,
  onSelect,
}: {
  pct: Record<string, number | null>
  niveles: Record<string, Nivel>
  seleccion?: string | null
  onHover?: (id: string | null) => void
  onSelect?: (id: string) => void
}) {
  const color = (id: string) => (LABORES_SEMANA.includes(id) ? COLOR_NIVEL[niveles[id] ?? 'vacio'] : 'var(--color-filete-2)')
  const props = (id: string) => ({
    onMouseEnter: () => onHover?.(id),
    onMouseLeave: () => onHover?.(null),
    onClick: () => onSelect?.(id),
    className: onSelect ? 'cursor-pointer' : undefined,
    role: onSelect ? 'button' : undefined,
    tabIndex: onSelect && LABORES_SEMANA.includes(id) ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onSelect?.(id),
    'aria-label': `${LABORES.find((l) => l.id === id)!.nombre}: ${pct[id] == null ? 'sin reporte' : `${fmt(pct[id])} %`}`,
  })
  return (
    <svg viewBox={`-52 -10 ${W + 60} ${H + 24}`} className="w-full h-auto block select-none" role="group" aria-label="Sección longitudinal de la veta con cumplimiento por labor">
      {NIVELES.map((z) => (
        <g key={z}>
          <line x1={0} x2={W} y1={sz(z)} y2={sz(z)} stroke="var(--color-filete)" strokeDasharray="2 4" />
          <text x={-6} y={sz(z) + 4} textAnchor="end" className="fill-tinta-3" fontSize={12}>
            NV {z}
          </text>
        </g>
      ))}
      {/* tajeos */}
      {LABORES.filter((l) => l.tipo === 'Tajeo').map((l) => {
        const [x0, x1, z0, z1] = l.caja!
        const sel = seleccion === l.id
        const activa = LABORES_SEMANA.includes(l.id)
        return (
          <g key={l.id} {...props(l.id)}>
            <rect
              x={sx(x0)}
              y={sz(z1)}
              width={sx(x1) - sx(x0)}
              height={sz(z0) - sz(z1)}
              rx={2}
              fill={color(l.id)}
              fillOpacity={sel ? 0.45 : activa ? 0.2 : 0.06}
              stroke={color(l.id)}
              strokeWidth={sel ? 2 : 1}
            />
            <text x={sx(x0) + 5} y={sz(z1) + 14} fontSize={11.5} className="fill-tinta-2" fontWeight={550}>
              {l.id.slice(3)}
            </text>
            {activa && (
              <>
                <path d={trazoNivel(niveles[l.id] ?? 'vacio')} transform={`translate(${sx(x0) + 4} ${sz(z1) + 19}) scale(0.68)`} fill="none" stroke={color(l.id)} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                <text x={sx(x0) + 19} y={sz(z1) + 31} fontSize={15} fontWeight={650} className="fill-tinta">
                  {pct[l.id] == null ? '—' : `${fmt(pct[l.id])}%`}
                </text>
              </>
            )}
          </g>
        )
      })}
      {/* desarrollo */}
      {LABORES.filter((l) => l.tipo !== 'Tajeo').map((l) => {
        const sel = seleccion === l.id
        const w = sel ? 5 : LABORES_SEMANA.includes(l.id) ? 3.5 : 2
        if (l.tipo === 'Rampa') {
          const zs = l.eje!.map((q) => q[2])
          const d = l.eje!.filter((_, i) => i % 24 === 0).map((q, i) => `${i ? 'L' : 'M'}${sx(q[0] - 10 + (i % 2) * 20).toFixed(1)},${sz(q[2]).toFixed(1)}`).join('')
          return (
            <g key={l.id} {...props(l.id)}>
              <path d={d} fill="none" stroke={color(l.id)} strokeWidth={w - 1} strokeLinejoin="round" />
              <text x={sx(-45)} y={sz(Math.max(...zs)) - 4} textAnchor="middle" fontSize={11.5} className="fill-tinta-2">
                Rampa
              </text>
            </g>
          )
        }
        const [a, b] = [l.eje![0], l.eje![l.eje!.length - 1]]
        return (
          <line key={l.id} {...props(l.id)} x1={sx(a[0])} x2={sx(b[0]) + (l.tipo === 'Crucero' ? 0.01 : 0)} y1={sz(a[2])} y2={sz(b[2]) - (l.tipo === 'Crucero' ? 6 : 0)} stroke={color(l.id)} strokeWidth={w} strokeLinecap="round" />
        )
      })}
    </svg>
  )
}
