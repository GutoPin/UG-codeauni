import { useState } from 'react'
import { fmt } from '../../derive'
import { areaSeccion, contornoSeccion, ejeDeTramos, validarTramos, type Forma, type Reglas, type Seccion, type Tramo } from '../../domain/designer'
import { Boton, Cabecera, Campo, Icon, Panel, Segmentos } from '../../ui/kit'

// Biblioteca de secciones tipo (catálogo semilla de la ficha 02). Herradura: alto total = pared + medio ancho.
const BIBLIOTECA: { n: string; s: Seccion }[] = [
  { n: 'Herradura 4 × 4', s: { forma: 'herradura', ancho: 4, alto: 2, sobre: 0.15 } },
  { n: 'Herradura 3,5 × 3,5', s: { forma: 'herradura', ancho: 3.5, alto: 1.75, sobre: 0.15 } },
  { n: 'Rampa 5 × 4,5', s: { forma: 'herradura', ancho: 5, alto: 2, sobre: 0.2 } },
  { n: 'Chimenea 2,4 × 2,4', s: { forma: 'rectangular', ancho: 2.4, alto: 2.4, sobre: 0.1 } },
]

const RAMPA: Tramo[] = [
  { tipo: 'recta', largo: 40, gradiente: 12 },
  { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
  { tipo: 'recta', largo: 40, gradiente: 12 },
  { tipo: 'curva', radio: 15, giro: 180, gradiente: 12 },
  { tipo: 'recta', largo: 40, gradiente: 12 },
]

function SeccionSVG({ s }: { s: Seccion }) {
  const dis = contornoSeccion(s.forma, s.ancho, s.alto)
  const sob = contornoSeccion(s.forma, s.ancho + 2 * s.sobre, s.forma === 'rectangular' ? s.alto + s.sobre : s.alto)
  const alto = Math.max(...sob.map((p) => p[1]))
  const ancho = s.ancho + 2 * s.sobre
  const k = 150 / Math.max(alto, ancho)
  const d = (ps: [number, number][]) => ps.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * k).toFixed(1)},${(-y * k).toFixed(1)}`).join('') + 'Z'
  return (
    <svg viewBox={`${-90} ${-alto * k - 14} 180 ${alto * k + 48}`} className="w-full max-w-[240px] mx-auto block" role="img" aria-label={`Sección ${s.forma} de ${fmt(s.ancho, 1)} m de ancho`}>
      <path d={d(sob)} fill="none" stroke="var(--color-alerta)" strokeDasharray="3 3" strokeWidth={1.2} />
      <path d={d(dis)} fill="var(--color-azul)" fillOpacity={0.18} stroke="var(--color-azul)" strokeWidth={1.6} />
      <line x1={(-s.ancho / 2) * k} x2={(s.ancho / 2) * k} y1={14} y2={14} stroke="var(--color-tinta-3)" />
      <text x={0} y={27} textAnchor="middle" fontSize={11} className="fill-tinta-2">
        {fmt(s.ancho, 2)} m
      </text>
    </svg>
  )
}

export default function Labor() {
  const [seccion, setSeccion] = useState<Seccion>(BIBLIOTECA[2].s)
  const [reglas, setReglas] = useState<Reglas>({ gradienteMax: 15, radioMin: 12 })
  const [densidad, setDensidad] = useState(2.8)
  const [cota, setCota] = useState(3750)
  const [tramos, setTramos] = useState<Tramo[]>(RAMPA)

  const area = areaSeccion(seccion)
  const eje = ejeDeTramos([0, 0, cota], 0, tramos)
  const errores = validarTramos(tramos, reglas)
  const malos = new Set(errores.map((e) => e.tramo))
  const cambiar = (i: number, t: Partial<Tramo>) => setTramos(tramos.map((x, j) => (j === i ? ({ ...x, ...t } as Tramo) : x)))

  // vista en planta y perfil longitudinal del eje
  const xs = eje.puntos.map((p) => p[0])
  const ys = eje.puntos.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs) - 8, Math.max(...xs) + 8, Math.min(...ys) - 8, Math.max(...ys) + 8]
  const kp = Math.min(300 / (x1 - x0), 220 / (y1 - y0))
  const altoP = (y1 - y0) * kp + 20
  let acum = 0
  const perfil = eje.puntos.map((p, i) => {
    if (i) acum += Math.hypot(p[0] - eje.puntos[i - 1][0], p[1] - eje.puntos[i - 1][1])
    return [acum, p[2]] as const
  })
  const zMin = cota
  const zMax = Math.max(cota + 1, ...eje.puntos.map((p) => p[2]))
  const sxP = (d: number) => (d / Math.max(1, acum)) * 380
  const szP = (z: number) => 150 - ((z - zMin) / (zMax - zMin)) * 130
  // tramo de cada punto del eje, para pintar en rojo los que violan una regla
  const tramoDe: number[] = [0]
  tramos.forEach((t, i) => {
    const lh = t.tipo === 'recta' ? t.largo : (t.radio * Math.PI * Math.abs(t.giro)) / 180
    for (let k = 0; k < Math.max(1, Math.ceil(lh / 2)); k++) tramoDe.push(i + 1)
  })
  const trazos = (f: (p: (typeof eje.puntos)[number], i: number) => string) =>
    tramos.map((_, t) => {
      const idx = eje.puntos.map((_, i) => i).filter((i) => tramoDe[i] === t + 1 || tramoDe[i + 1] === t + 1)
      return { t: t + 1, d: idx.map((i, k) => `${k ? 'L' : 'M'}${f(eje.puntos[i], i)}`).join('') }
    })

  const volumen = area.area * eje.largo3D
  const volumenSobre = area.conSobre * eje.largo3D

  return (
    <div className="pb-10">
      <Cabecera titulo="Constructor de labor" detalle="Designer UG · eje por tramos con sección tipo y reglas del proyecto validadas mientras se dibuja" />
      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        <div className="col-span-4 max-[1200px]:col-span-12 space-y-4">
          <Panel titulo="Sección tipo">
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {BIBLIOTECA.map((b) => (
                  <button
                    key={b.n}
                    onClick={() => setSeccion(b.s)}
                    className={`h-7 px-2.5 rounded border text-[12px] cursor-pointer transition-colors ${JSON.stringify(b.s) === JSON.stringify(seccion) ? 'border-tinta-3 bg-panel-2 text-tinta' : 'border-filete text-tinta-2 hover:text-tinta'}`}
                  >
                    {b.n}
                  </button>
                ))}
              </div>
              <Segmentos<Forma>
                etiqueta="Forma de la sección"
                valor={seccion.forma}
                onChange={(forma) => setSeccion({ ...seccion, forma })}
                opciones={[
                  { v: 'herradura', l: 'Herradura' },
                  { v: 'rectangular', l: 'Rectangular' },
                  { v: 'circular', l: 'Circular' },
                ]}
              />
              <div className="grid grid-cols-3 gap-2">
                <Campo l={seccion.forma === 'circular' ? 'Diámetro' : 'Ancho'} u="m" paso={0.1} v={seccion.ancho} onChange={(ancho) => setSeccion({ ...seccion, ancho })} invalido={!(seccion.ancho > 0)} />
                {seccion.forma !== 'circular' && (
                  <Campo l={seccion.forma === 'herradura' ? 'Alto de pared' : 'Alto'} u="m" paso={0.1} v={seccion.alto} onChange={(alto) => setSeccion({ ...seccion, alto })} invalido={!(seccion.alto >= 0)} />
                )}
                <Campo l="Sobre-excavación" u="m" paso={0.05} v={seccion.sobre} onChange={(sobre) => setSeccion({ ...seccion, sobre })} />
              </div>
              <SeccionSVG s={seccion} />
              <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
                <div>
                  <dt className="text-tinta-3">Área de diseño</dt>
                  <dd className="titular text-[18px]">
                    {fmt(area.area, 2)} <span className="text-[12px] text-tinta-3 font-normal">m²</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-tinta-3 inline-flex items-center gap-1.5">
                    <span className="w-3 border-t border-dashed border-alerta" aria-hidden /> Con sobre-excavación
                  </dt>
                  <dd className="titular text-[18px]">
                    {fmt(area.conSobre, 2)} <span className="text-[12px] text-tinta-3 font-normal">m²</span>
                  </dd>
                </div>
              </dl>
              {seccion.forma === 'herradura' && <p className="text-[11.5px] text-tinta-3">A = w · h_p + π · w² / 8. El piso no se sobre-excava.</p>}
            </div>
          </Panel>

          <Panel titulo="Reglas del proyecto">
            <div className="p-4 grid grid-cols-3 gap-2">
              <Campo l="Gradiente máx." u="%" paso={0.5} v={reglas.gradienteMax} onChange={(gradienteMax) => setReglas({ ...reglas, gradienteMax })} />
              <Campo l="Radio mínimo" u="m" v={reglas.radioMin} onChange={(radioMin) => setReglas({ ...reglas, radioMin })} />
              <Campo l="Densidad roca" u="t/m³" paso={0.1} v={densidad} onChange={setDensidad} />
            </div>
          </Panel>
        </div>

        <div className="col-span-8 max-[1200px]:col-span-12 space-y-4">
          <Panel
            titulo="Eje por tramos"
            accion={
              <div className="flex gap-1.5">
                <Boton variante="sec" onClick={() => setTramos([...tramos, { tipo: 'recta', largo: 30, gradiente: 12 }])}>
                  + Recta
                </Boton>
                <Boton variante="sec" onClick={() => setTramos([...tramos, { tipo: 'curva', radio: 15, giro: 90, gradiente: 12 }])}>
                  + Curva
                </Boton>
              </div>
            }
          >
            <div className="px-4 pt-3 grid grid-cols-[140px_1fr] gap-3 items-end">
              <Campo l="Cota de inicio" u="m" v={cota} onChange={setCota} />
              <p className="text-[12px] text-tinta-3 pb-1.5">Giro positivo a la izquierda. La gradiente se valida contra la máxima y el radio contra el mínimo del equipo de diseño.</p>
            </div>
            <table className="w-full text-[13px] mt-2">
              <thead>
                <tr className="text-left rotulo border-y border-filete">
                  <th className="px-4 py-2 font-semibold w-10">#</th>
                  <th className="px-2 py-2 font-semibold">Tramo</th>
                  <th className="px-2 py-2 font-semibold text-right">Largo horiz.</th>
                  <th className="px-2 py-2 font-semibold text-right">Desnivel</th>
                  <th className="px-2 py-2 font-semibold text-right">Cota final</th>
                  <th className="px-4 py-2 font-semibold w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-filete">
                {tramos.map((t, i) => {
                  const r = eje.resumen[i]
                  return (
                    <tr key={i} className={malos.has(i + 1) ? 'bg-critico/[0.06]' : ''}>
                      <td className="px-4 py-2 text-tinta-3">{i + 1}</td>
                      <td className="px-2 py-2">
                        <div className="grid grid-cols-[repeat(3,minmax(0,110px))] gap-2 items-end">
                          {t.tipo === 'recta' ? (
                            <Campo l="Recta · largo" u="m" v={t.largo} onChange={(largo) => cambiar(i, { largo })} invalido={!(t.largo > 0)} />
                          ) : (
                            <>
                              <Campo l="Curva · radio" u="m" v={t.radio} onChange={(radio) => cambiar(i, { radio })} invalido={t.radio < reglas.radioMin} />
                              <Campo l="Giro" u="°" paso={15} v={t.giro} onChange={(giro) => cambiar(i, { giro })} />
                            </>
                          )}
                          <Campo l="Gradiente" u="%" paso={0.5} v={t.gradiente} onChange={(gradiente) => cambiar(i, { gradiente })} invalido={Math.abs(t.gradiente) > reglas.gradienteMax} />
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">{fmt(r.largo, 1)} m</td>
                      <td className="px-2 py-2 text-right">{fmt(r.desnivel, 2)} m</td>
                      <td className="px-2 py-2 text-right">{fmt(r.zFin, 1)}</td>
                      <td className="px-4 py-2">
                        <button aria-label={`Quitar tramo ${i + 1}`} onClick={() => setTramos(tramos.filter((_, j) => j !== i))} className="text-tinta-3 hover:text-critico cursor-pointer">
                          <Icon n="x" className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {errores.length > 0 ? (
              <ul role="alert" className="px-4 py-2.5 border-t border-filete space-y-1 text-[13px] text-critico">
                {errores.map((e) => (
                  <li key={e.msg} className="flex items-center gap-2">
                    <Icon n="x" className="size-4" /> {e.msg}
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status" className="px-4 py-2.5 border-t border-filete text-[13px] text-tinta-2 flex items-center gap-2">
                <Icon n="ok" className="size-4 text-bien" /> El eje cumple las reglas del proyecto.
              </p>
            )}
          </Panel>

          <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
            {[
              ['Longitud del eje', fmt(eje.largo3D, 1), 'm'],
              ['Desnivel', fmt(eje.desnivel, 2), `m · cota ${fmt(cota + eje.desnivel, 1)}`],
              ['Volumen (A × L)', fmt(volumen), `m³ · ${fmt(volumenSobre)} con sobre-exc.`],
              ['Roca a extraer', fmt(volumenSobre * densidad), 't con sobre-excavación'],
            ].map(([l, v, u]) => (
              <div key={l} className="bg-panel px-4 py-3">
                <div className="rotulo">{l}</div>
                <div className="titular text-[22px] mt-1">{v}</div>
                <div className="text-[11.5px] text-tinta-3">{u}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 max-[900px]:grid-cols-1 gap-4">
            <Panel titulo="Planta">
              <svg viewBox={`0 0 320 ${altoP}`} className="w-full block" role="img" aria-label="Eje de la labor en planta">
                <g transform={`translate(10 ${altoP - 10}) scale(1 -1)`}>
                  {trazos((p) => `${((p[0] - x0) * kp).toFixed(1)},${((p[1] - y0) * kp).toFixed(1)}`).map((s) => (
                    <path key={s.t} d={s.d} fill="none" stroke={malos.has(s.t) ? 'var(--color-critico)' : 'var(--color-azul)'} strokeWidth={Math.max(2, seccion.ancho * kp)} strokeOpacity={0.35} strokeLinejoin="round" />
                  ))}
                  {trazos((p) => `${((p[0] - x0) * kp).toFixed(1)},${((p[1] - y0) * kp).toFixed(1)}`).map((s) => (
                    <path key={s.t} d={s.d} fill="none" stroke={malos.has(s.t) ? 'var(--color-critico)' : 'var(--color-tinta)'} strokeWidth={1.2} />
                  ))}
                  <circle cx={(0 - x0) * kp} cy={(0 - y0) * kp} r={4} fill="var(--color-coral)" />
                </g>
              </svg>
              <p className="px-4 pb-3 text-[11.5px] text-tinta-3">Punto coral = inicio. Ancho dibujado a escala de la sección.</p>
            </Panel>
            <Panel titulo="Perfil longitudinal">
              <svg viewBox="-40 0 430 175" className="w-full block" role="img" aria-label="Perfil de cota a lo largo del eje">
                {[zMin, (zMin + zMax) / 2, zMax].map((z) => (
                  <g key={z}>
                    <line x1={0} x2={380} y1={szP(z)} y2={szP(z)} stroke="var(--color-filete)" strokeDasharray="2 4" />
                    <text x={-6} y={szP(z) + 4} textAnchor="end" fontSize={11} className="fill-tinta-3">
                      {fmt(z, 0)}
                    </text>
                  </g>
                ))}
                {trazos((_, i) => `${sxP(perfil[i][0]).toFixed(1)},${szP(perfil[i][1]).toFixed(1)}`).map((s) => (
                  <path key={s.t} d={s.d} fill="none" stroke={malos.has(s.t) ? 'var(--color-critico)' : 'var(--color-azul)'} strokeWidth={2} />
                ))}
                <text x={380} y={168} textAnchor="end" fontSize={11} className="fill-tinta-3">
                  {fmt(acum, 0)} m horizontales
                </text>
              </svg>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
