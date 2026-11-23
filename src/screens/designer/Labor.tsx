import { useState } from 'react'
import { LABORES } from '../../data/minaPiloto'
import { useDisenos, vetaY, type ClaseLabor } from '../../disenos'
import { fmt } from '../../derive'
import { areaSeccion, contornoSeccion, crucesEje, ejeDeTramos, moverVertice, validarTramos, type Forma, type Obstaculo, type Seccion, type Tramo } from '../../domain/designer'
import { Boton, Cabecera, Campo, Icon, Panel, Segmentos } from '../../ui/kit'
import BarraDiseno, { useEditable } from './BarraDiseno'

// Biblioteca de secciones tipo (catálogo semilla de la ficha 02). Herradura: alto total = pared + medio ancho.
const BIBLIOTECA: { n: string; s: Seccion }[] = [
  { n: 'Herradura 4 × 4', s: { forma: 'herradura', ancho: 4, alto: 2, sobre: 0.15 } },
  { n: 'Herradura 3,5 × 3,5', s: { forma: 'herradura', ancho: 3.5, alto: 1.75, sobre: 0.15 } },
  { n: 'Rampa 5 × 4,5', s: { forma: 'herradura', ancho: 5, alto: 2, sobre: 0.2 } },
  { n: 'Chimenea 2,4 × 2,4', s: { forma: 'rectangular', ancho: 2.4, alto: 2.4, sobre: 0.1 } },
]

// labores existentes de la mina piloto como obstáculos (tajeos: losa de 6 m centrada en la veta, como en el visor 3D)
const OBSTACULOS: Obstaculo[] = LABORES.map((l) =>
  l.caja
    ? { nombre: l.nombre, caja: [l.caja[0], l.caja[1], vetaY((l.caja[2] + l.caja[3]) / 2) - 3, vetaY((l.caja[2] + l.caja[3]) / 2) + 3, l.caja[2], l.caja[3]] }
    : { nombre: l.nombre, eje: l.eje, r: Math.sqrt(l.seccion) / 2 },
)

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
  const { labor, editar } = useDisenos()
  const editable = useEditable('labor')
  const dl = labor.datos
  const { seccion, reglas, densidad, tramos, rumbo } = dl
  const [ox, oy, cota] = dl.origen
  const set = (p: Partial<typeof dl>) => editar({ ...dl, ...p })
  const setSeccion = (seccion: Seccion) => set({ seccion })
  const setTramos = (tramos: Tramo[]) => set({ tramos })

  const area = areaSeccion(seccion)
  const eje = ejeDeTramos(dl.origen, rumbo, tramos)
  const errores = validarTramos(tramos, reglas)
  const cruces = crucesEje(eje.puntos, eje.tramoDe, Math.sqrt(area.conSobre / Math.PI), OBSTACULOS, dl.pilarMin)
  const malos = new Set([...errores.map((e) => e.tramo), ...cruces.filter((c) => c.grave).map((c) => c.tramo)])
  const [arrastre, setArrastre] = useState<{ i: number; vista: { x0: number; y0: number; kp: number; altoP: number } } | null>(null)
  const cambiar = (i: number, t: Partial<Tramo>) => setTramos(tramos.map((x, j) => (j === i ? ({ ...x, ...t } as Tramo) : x)))
  const mover = (i: number, d: -1 | 1) => {
    const n = [...tramos]
    ;[n[i], n[i + d]] = [n[i + d], n[i]]
    setTramos(n)
  }

  // vista en planta y perfil longitudinal del eje
  const xs = eje.puntos.map((p) => p[0])
  const ys = eje.puntos.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs) - 8, Math.max(...xs) + 8, Math.min(...ys) - 8, Math.max(...ys) + 8]
  // mientras se arrastra un vértice la escala queda fija, así el punto sigue al puntero
  const { x0: px0, y0: py0, kp, altoP } = arrastre?.vista ?? { x0, y0, kp: Math.min(300 / (x1 - x0), 220 / (y1 - y0)), altoP: (y1 - y0) * Math.min(300 / (x1 - x0), 220 / (y1 - y0)) + 20 }
  const aPlanta = (x: number, y: number) => `${((x - px0) * kp).toFixed(1)},${((y - py0) * kp).toFixed(1)}`
  const aMundo = (e: React.PointerEvent<SVGSVGElement>) => {
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(e.currentTarget.getScreenCTM()!.inverse())
    return [(q.x - 10) / kp + px0, (altoP - 10 - q.y) / kp + py0] as const
  }
  const finTramo = tramos.map((_, i) => eje.tramoDe.lastIndexOf(i + 1))
  let acum = 0
  const perfil = eje.puntos.map((p, i) => {
    if (i) acum += Math.hypot(p[0] - eje.puntos[i - 1][0], p[1] - eje.puntos[i - 1][1])
    return [acum, p[2]] as const
  })
  const zMin = Math.min(cota, ...eje.puntos.map((p) => p[2]))
  const zMax = Math.max(cota + 1, ...eje.puntos.map((p) => p[2]))
  const sxP = (d: number) => (d / Math.max(1, acum)) * 380
  const szP = (z: number) => 150 - ((z - zMin) / (zMax - zMin)) * 130
  // tramo de cada punto del eje, para pintar en rojo los que violan una regla
  const tramoDe = eje.tramoDe
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
      <BarraDiseno tipo="labor" />
      <fieldset disabled={!editable} className="min-w-0 px-6 grid grid-cols-12 gap-4 items-start [&_input:disabled]:opacity-60">
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
            <div className="p-4 grid grid-cols-2 gap-2">
              <Campo l="Gradiente máx." u="%" paso={0.5} v={reglas.gradienteMax} onChange={(gradienteMax) => set({ reglas: { ...reglas, gradienteMax } })} />
              <Campo l="Radio mínimo" u="m" v={reglas.radioMin} onChange={(radioMin) => set({ reglas: { ...reglas, radioMin } })} />
              <Campo l="Densidad roca" u="t/m³" paso={0.1} v={densidad} onChange={(densidad) => set({ densidad })} />
              <Campo l="Pilar mínimo" u="m" paso={0.5} v={dl.pilarMin} onChange={(pilarMin) => set({ pilarMin })} />
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
            <div className="px-4 pt-3 space-y-2.5">
              <Segmentos<ClaseLabor>
                etiqueta="Tipo de labor"
                valor={dl.clase}
                onChange={(clase) => set({ clase })}
                opciones={(['Rampa', 'Galería', 'Crucero', 'Chimenea'] as const).map((v) => ({ v, l: v }))}
              />
              <div className="grid grid-cols-[repeat(4,minmax(0,120px))_1fr] gap-2 items-end">
                <Campo l="Inicio x (rumbo)" u="m" paso={5} v={ox} onChange={(x) => set({ origen: [x, oy, cota] })} />
                <Campo l="Inicio y" u="m" paso={5} v={oy} onChange={(y) => set({ origen: [ox, y, cota] })} />
                <Campo l="Cota de inicio" u="m" v={cota} onChange={(z) => set({ origen: [ox, oy, z] })} />
                <Campo l="Rumbo inicial" u="°" paso={15} v={rumbo} onChange={(rumbo) => set({ rumbo })} />
                <p className="text-[12px] text-tinta-3 pb-1.5">Coordenadas de la mina piloto: x a lo largo de la veta, y transversal. Rumbo 0° = +x; giro positivo a la izquierda.</p>
              </div>
            </div>
            <table className="w-full text-[13px] mt-2">
              <thead>
                <tr className="text-left rotulo border-y border-filete">
                  <th className="px-4 py-2 font-semibold w-10">#</th>
                  <th className="px-2 py-2 font-semibold">Tramo</th>
                  <th className="px-2 py-2 font-semibold text-right">Largo horiz.</th>
                  <th className="px-2 py-2 font-semibold text-right">Desnivel</th>
                  <th className="px-2 py-2 font-semibold text-right">Cota final</th>
                  <th className="px-3 py-2 font-semibold w-[120px]" />
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
                      <td className="px-3 py-2">
                        <div className="flex gap-0.5 text-tinta-3">
                          {(
                            [
                              ['arriba', `Subir tramo ${i + 1}`, () => mover(i, -1), i === 0],
                              ['abajo', `Bajar tramo ${i + 1}`, () => mover(i, 1), i === tramos.length - 1],
                              ['mas', `Insertar recta después del tramo ${i + 1}`, () => setTramos([...tramos.slice(0, i + 1), { tipo: 'recta', largo: 20, gradiente: t.gradiente }, ...tramos.slice(i + 1)]), false],
                            ] as const
                          ).map(([n, l, f, off]) => (
                            <button key={n} aria-label={l} title={l} disabled={off} onClick={f} className="p-1 rounded hover:text-tinta hover:bg-panel-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none">
                              <Icon n={n} className="size-3.5" />
                            </button>
                          ))}
                          <button aria-label={`Quitar tramo ${i + 1}`} title={`Quitar tramo ${i + 1}`} onClick={() => setTramos(tramos.filter((_, j) => j !== i))} className="p-1 rounded hover:text-critico hover:bg-panel-2 cursor-pointer">
                            <Icon n="x" className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {errores.length + cruces.length > 0 ? (
              <ul role="alert" className="px-4 py-2.5 border-t border-filete space-y-1 text-[13px]">
                {[...errores.map((e) => ({ msg: e.msg, grave: true })), ...cruces].map((e) => (
                  <li key={e.msg} className={`flex items-center gap-2 ${e.grave ? 'text-critico' : 'text-alerta'}`}>
                    <Icon n={e.grave ? 'x' : 'alerta'} className="size-4 shrink-0" /> {e.msg}
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status" className="px-4 py-2.5 border-t border-filete text-[13px] text-tinta-2 flex items-center gap-2">
                <Icon n="ok" className="size-4 text-bien" /> El eje cumple las reglas del proyecto y no cruza otras labores.
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
              <svg
                viewBox={`0 0 320 ${altoP}`}
                className={`w-full block touch-none ${arrastre ? 'cursor-grabbing' : ''}`}
                role="img"
                aria-label="Eje de la labor en planta, con las labores existentes en gris"
                onPointerMove={(e) => {
                  if (!arrastre) return
                  const [x, y] = aMundo(e)
                  const r = eje.resumen[arrastre.i]
                  setTramos(tramos.map((t, j) => (j === arrastre.i ? moverVertice(t, r.inicio, r.rumboInicio, x, y) : t)))
                }}
                onPointerUp={() => setArrastre(null)}
                onLostPointerCapture={() => setArrastre(null)}
              >
                <g transform={`translate(10 ${altoP - 10}) scale(1 -1)`}>
                  {OBSTACULOS.filter((o) => {
                    // en planta solo las labores a menos de 15 m de cota del diseño
                    const zs = o.caja ? [o.caja[4], o.caja[5]] : o.eje!.map((p) => p[2])
                    return Math.min(...zs) < zMax + 15 && Math.max(...zs) > zMin - 15
                  }).map((o) =>
                    o.caja ? (
                      <rect key={o.nombre} x={(o.caja[0] - px0) * kp} y={(o.caja[2] - py0) * kp} width={(o.caja[1] - o.caja[0]) * kp} height={(o.caja[3] - o.caja[2]) * kp} fill="var(--color-tinta-3)" fillOpacity={0.12} stroke="var(--color-tinta-3)" strokeOpacity={0.4} />
                    ) : (
                      <path key={o.nombre} d={o.eje!.map((p, i) => `${i ? 'L' : 'M'}${aPlanta(p[0], p[1])}`).join('')} fill="none" stroke="var(--color-tinta-3)" strokeOpacity={0.45} strokeWidth={Math.max(1.5, 2 * o.r! * kp)} />
                    ),
                  )}
                  {trazos((p) => aPlanta(p[0], p[1])).map((s) => (
                    <path key={s.t} d={s.d} fill="none" stroke={malos.has(s.t) ? 'var(--color-critico)' : 'var(--color-azul)'} strokeWidth={Math.max(2, seccion.ancho * kp)} strokeOpacity={0.35} strokeLinejoin="round" />
                  ))}
                  {trazos((p) => aPlanta(p[0], p[1])).map((s) => (
                    <path key={s.t} d={s.d} fill="none" stroke={malos.has(s.t) ? 'var(--color-critico)' : 'var(--color-tinta)'} strokeWidth={1.2} />
                  ))}
                  <circle cx={(ox - px0) * kp} cy={(oy - py0) * kp} r={4} fill="var(--color-coral)" />
                  {editable &&
                    finTramo.map((k, i) => (
                      <circle
                        key={i}
                        cx={(eje.puntos[k][0] - px0) * kp}
                        cy={(eje.puntos[k][1] - py0) * kp}
                        r={5}
                        fill="var(--color-panel)"
                        stroke={arrastre?.i === i ? 'var(--color-coral)' : 'var(--color-tinta)'}
                        strokeWidth={1.5}
                        className="cursor-grab"
                        onPointerDown={(e) => {
                          e.currentTarget.ownerSVGElement!.setPointerCapture(e.pointerId)
                          setArrastre({ i, vista: { x0: px0, y0: py0, kp, altoP } })
                        }}
                      >
                        <title>{`Arrastrar el final del tramo ${i + 1}`}</title>
                      </circle>
                    ))}
                </g>
              </svg>
              <p className="px-4 pb-3 text-[11.5px] text-tinta-3">Punto coral = inicio. Arrastra los círculos para mover el final de cada tramo: la recta cambia su largo y la curva su giro. En gris, las labores existentes.</p>
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
      </fieldset>
    </div>
  )
}
