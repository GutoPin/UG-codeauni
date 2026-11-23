import { useMemo } from 'react'
import { LABORES, LARGO_VETA, NIVELES, generarBloques } from '../../data/minaPiloto'
import { fmt } from '../../derive'
import { TAJEO_INICIAL, useDisenos, vetaY } from '../../disenos'
import { centroTajeo, evaluarTajeo, interferenciasTajeo, type Tajeo as T } from '../../domain/designer'
import { Boton, Cabecera, Campo, Icon, Panel } from '../../ui/kit'
import BarraDiseno, { useEditable } from './BarraDiseno'

const BLOQUES = generarBloques()
// mismos límites que el generador del modelo de bloques (centros ± medio bloque)
const LIMITES: [number, number, number, number] = [-12.5, LARGO_VETA + 12.5, 3732.5, 3917.5]
const TAJEOS = LABORES.filter((l) => l.tipo === 'Tajeo').map((l) => ({ id: l.id, nombre: l.nombre, caja: l.caja! }))

// misma rampa de ley que el visor 3D (#3a2620 → #ffa27f entre 2,5 y 11 g/t)
const colorLey = (ley: number) => {
  const k = Math.min(1, Math.max(0, (ley - 2.5) / 8.5))
  const c = (a: number, b: number) => Math.round(a + (b - a) * k)
  return `rgb(${c(0x3a, 0xff)} ${c(0x26, 0xa2)} ${c(0x20, 0x7f)})`
}

// sección longitudinal (x, z) a escala
const X0 = -15
const X1 = 435
const Z0 = 3730
const Z1 = 3920
const W = 900
const H = (W * (Z1 - Z0)) / (X1 - X0)
const sx = (x: number) => ((x - X0) / (X1 - X0)) * W
const sz = (z: number) => H - ((z - Z0) / (Z1 - Z0)) * H

export default function Tajeo() {
  const { tajeo, editar } = useDisenos()
  const editable = useEditable('tajeo')
  const { t, ev } = tajeo.datos
  const setT = (t: T) => editar({ ...tajeo.datos, t })
  const setEv = (e: typeof ev) => editar({ ...tajeo.datos, ev: e })
  const r = evaluarTajeo(t, BLOQUES, ev)
  const avisos = interferenciasTajeo(t, TAJEOS, NIVELES, { pilarMin: ev.pilarMin, altoGaleria: 4, limites: LIMITES })
  const p = (k: keyof T, l: string, u: string, paso = 1) => <Campo key={k} l={l} u={u} paso={paso} v={t[k]} onChange={(v) => setT({ ...t, [k]: v })} invalido={!Number.isFinite(t[k])} />
  const e = (k: keyof typeof ev, l: string, u: string, paso = 0.1) => <Campo key={k} l={l} u={u} paso={paso} v={ev[k]} onChange={(v) => setEv({ ...ev, [k]: v })} />
  const rentable = r.leyDiluida >= ev.leyCorte

  const fondo = useMemo(
    () =>
      BLOQUES.map((b) => (
        <rect key={`${b.x}|${b.z}`} x={sx(b.x - 2.5)} y={sz(b.z + 2.5)} width={sx(5) - sx(0) + 0.3} height={sz(0) - sz(5) + 0.3} fill={colorLey(b.ley)} />
      )),
    [],
  )

  // sección transversal a media longitud: la veta ondula con la cota, el tajeo es un paralelogramo con su buzamiento
  const zs = [t.zPiso - 15, t.zPiso + t.alto + 15]
  const tsx = (y: number) => 110 + y * 9
  const tsz = (z: number) => 8 + ((zs[1] - z) / (zs[1] - zs[0])) * 184
  const veta = Array.from({ length: 41 }, (_, i) => zs[0] + ((zs[1] - zs[0]) * i) / 40)
  const caja = [
    [centroTajeo(t, t.zPiso) - t.ancho / 2, t.zPiso],
    [centroTajeo(t, t.zPiso) + t.ancho / 2, t.zPiso],
    [centroTajeo(t, t.zPiso + t.alto) + t.ancho / 2, t.zPiso + t.alto],
    [centroTajeo(t, t.zPiso + t.alto) - t.ancho / 2, t.zPiso + t.alto],
  ]

  return (
    <div className="pb-10">
      <Cabecera titulo="Tajeo paramétrico" detalle="Designer UG · sólido por parámetros evaluado contra el modelo de bloques de la mina piloto" />
      <BarraDiseno tipo="tajeo" />
      <fieldset disabled={!editable} className="min-w-0 px-6 grid grid-cols-12 gap-4 items-start [&_input:disabled]:opacity-60">
        <div className="col-span-4 max-[1200px]:col-span-12 space-y-4">
          <Panel
            titulo="Geometría"
            accion={
              <Boton variante="fant" onClick={() => setT(TAJEO_INICIAL.t)}>
                Restablecer
              </Boton>
            }
          >
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {p('largo', 'Largo', 'm')}
              {p('alto', 'Alto', 'm')}
              {p('ancho', 'Ancho horizontal', 'm', 0.5)}
              {p('buzamiento', 'Buzamiento', '°', 5)}
              {p('x0', 'Inicio a lo largo', 'm', 5)}
              {p('zPiso', 'Cota del piso', 'm', 5)}
              {p('yCentro', 'Centro transversal', 'm', 0.5)}
              <div className="flex items-end">
                <Boton variante="sec" onClick={() => setT({ ...t, yCentro: +vetaY(t.zPiso + t.alto / 2).toFixed(1) })}>
                  Centrar en la veta
                </Boton>
              </div>
            </div>
          </Panel>
          <Panel titulo="Parámetros de evaluación">
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {e('densidad', 'Densidad mineral', 't/m³')}
              {e('densidadEsteril', 'Densidad estéril', 't/m³')}
              {e('leyEsteril', 'Ley del estéril', 'g/t')}
              {e('sobre', 'Sobre-exc. por pared', 'm', 0.05)}
              {e('pilarMin', 'Pilar mínimo', 'm', 0.5)}
              {e('leyCorte', 'Ley de corte', 'g/t')}
            </div>
          </Panel>
        </div>

        <div className="col-span-8 max-[1200px]:col-span-12 space-y-4">
          <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
            {[
              ['Bruto (L × A × H × ρ)', `${fmt(r.bruto)} t`, `${fmt(r.volumen)} m³`],
              ['Mineral in situ', `${fmt(r.tMineral)} t`, `${fmt(r.leyInSitu, 2)} g/t · ${fmt(r.finos / 31.1035)} oz`],
              ['Dilución', `${fmt(r.dilucion, 1)} %`, `${fmt(r.tEsteril)} t de estéril`],
              ['Mineral diluido', `${fmt(r.tDiluido)} t`, `${fmt(r.leyDiluida, 2)} g/t`],
            ].map(([l, v, u]) => (
              <div key={l} className="bg-panel px-4 py-3">
                <div className="rotulo">{l}</div>
                <div className="titular text-[22px] mt-1">{v}</div>
                <div className="text-[11.5px] text-tinta-3">{u}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]" aria-live="polite">
            <span className={`inline-flex items-center gap-1.5 ${rentable ? 'text-bien' : 'text-alerta'}`}>
              <Icon n={rentable ? 'ok' : 'alerta'} className="size-4" />
              {rentable ? 'Sobre la ley de corte' : 'Bajo la ley de corte'}: {fmt(r.leyDiluida, 2)} frente a {fmt(ev.leyCorte, 2)} g/t
            </span>
            {avisos.length === 0 && (
              <span className="inline-flex items-center gap-1.5 text-tinta-2">
                <Icon n="ok" className="size-4 text-bien" /> Sin traslapes y con pilar suficiente
              </span>
            )}
          </div>
          {avisos.length > 0 && (
            <ul role="alert" className="bg-panel border border-critico/50 rounded px-4 py-2.5 space-y-1 text-[13px]">
              {avisos.map((a) => (
                <li key={a} className="flex items-center gap-2 text-critico">
                  <Icon n="x" className="size-4" /> {a}
                </li>
              ))}
            </ul>
          )}

          <Panel titulo="Sección longitudinal · modelo de bloques por ley">
            <svg viewBox={`-52 -6 ${W + 60} ${H + 14}`} className="w-full block select-none" role="img" aria-label="Modelo de bloques de la veta con los tajeos existentes y el tajeo en diseño">
              {fondo}
              {NIVELES.map((z) => (
                <g key={z}>
                  <line x1={0} x2={W} y1={sz(z)} y2={sz(z)} stroke="var(--color-tinta-3)" strokeOpacity={0.6} strokeWidth={4 * (W / (X1 - X0))} />
                  <text x={-6} y={sz(z) + 4} textAnchor="end" fontSize={12} className="fill-tinta-3">
                    NV {z}
                  </text>
                </g>
              ))}
              {TAJEOS.map((b) => (
                <g key={b.id}>
                  <rect x={sx(b.caja[0])} y={sz(b.caja[3])} width={sx(b.caja[1]) - sx(b.caja[0])} height={sz(b.caja[2]) - sz(b.caja[3])} fill="var(--color-suelo)" fillOpacity={0.55} stroke="var(--color-tinta-2)" strokeWidth={1} />
                  <text x={sx(b.caja[0]) + 4} y={sz(b.caja[3]) + 13} fontSize={11} className="fill-tinta-2">
                    {b.id.slice(3)}
                  </text>
                </g>
              ))}
              <rect
                x={sx(t.x0)}
                y={sz(t.zPiso + t.alto)}
                width={Math.max(0, sx(t.x0 + t.largo) - sx(t.x0))}
                height={Math.max(0, sz(t.zPiso) - sz(t.zPiso + t.alto))}
                fill="var(--color-suelo)"
                fillOpacity={0.15}
                stroke={avisos.length ? 'var(--color-critico)' : 'var(--color-tinta)'}
                strokeWidth={2.5}
              />
              <text x={sx(t.x0)} y={sz(t.zPiso + t.alto) - 5} fontSize={12} fontWeight={600} className="fill-tinta">
                Nuevo tajeo
              </text>
            </svg>
            <div className="px-4 pb-3 flex items-center gap-3 text-[11.5px] text-tinta-3">
              <span>Ley</span>
              <span className="h-2 w-32 rounded-sm" style={{ background: `linear-gradient(90deg, ${colorLey(2.5)}, ${colorLey(11)})` }} aria-hidden />
              <span>2,5 → 11 g/t</span>
              <span className="ml-auto">Bloques de 5 m. Franjas grises: galerías de nivel.</span>
            </div>
          </Panel>

          <Panel titulo="Sección transversal">
            <div className="grid grid-cols-[220px_1fr] max-[700px]:grid-cols-1 gap-4 p-4 items-center">
              <svg viewBox="0 0 220 200" className="w-full block" role="img" aria-label={`Sección transversal: veta y tajeo con buzamiento ${t.buzamiento}°`}>
                <path
                  d={
                    veta.map((z, i) => `${i ? 'L' : 'M'}${tsx(vetaY(z) - 2.5).toFixed(1)},${tsz(z).toFixed(1)}`).join('') +
                    [...veta].reverse().map((z) => `L${tsx(vetaY(z) + 2.5).toFixed(1)},${tsz(z).toFixed(1)}`).join('') +
                    'Z'
                  }
                  fill={colorLey(r.leyInSitu || 6)}
                  fillOpacity={0.85}
                />
                <path d={caja.map(([y, z], i) => `${i ? 'L' : 'M'}${tsx(y).toFixed(1)},${tsz(z).toFixed(1)}`).join('') + 'Z'} fill="var(--color-coral)" fillOpacity={0.15} stroke="var(--color-coral)" strokeWidth={2} />
              </svg>
              <p className="text-[12.5px] text-tinta-2 leading-relaxed">
                La veta (en color) tiene 5 m de potencia y ondula con la cota. Lo que el tajeo corta fuera de ella es estéril: se suma a la sobre-excavación de{' '}
                {fmt(ev.sobre, 2)} m por pared y diluye la ley. Bajar el ancho o centrar el tajeo en la veta reduce la dilución; un buzamiento que no sigue la veta
                deja mineral fuera.
              </p>
            </div>
          </Panel>
        </div>
      </fieldset>
    </div>
  )
}
