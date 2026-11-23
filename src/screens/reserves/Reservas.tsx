import { fmt } from '../../derive'
import { aCSV } from '../../domain/deswik'
import { leyCorteMetodo, ONZA, validarMetodo, type Estado, type Metodo } from '../../domain/reservas'
import { useDisenos } from '../../disenos'
import { evaluarReservas, LIMITE_MEDIDO, POTENCIA, useReservas } from '../../reservas'
import { Boton, Cabecera, Campo, descargar, Icon, Panel } from '../../ui/kit'

const ESTADO: Record<Estado, { i: string; c: string }> = {
  Reserva: { i: 'ok', c: 'text-bien' },
  'Bajo ley de corte': { i: 'alerta', c: 'text-alerta' },
  'Sin acceso': { i: 'x', c: 'text-critico' },
}
const th = 'px-3 py-2 font-semibold text-right'
const td = 'px-3 py-1.5 text-right'

export default function Reservas() {
  const p = useReservas()
  const { disenos } = useDisenos()
  const r = evaluarReservas(p, disenos)
  const reserva = r.tajeos.filter((x) => x.estado === 'Reserva')
  const t = reserva.reduce((s, x) => s + x.recuperado, 0)
  const metal = reserva.reduce((s, x) => s + x.metal, 0)
  const mineralDes = r.desarrollo.filter((d) => d.destino === 'Mineral')
  const exportar = () =>
    descargar(
      'reservas_tajeos.csv',
      '﻿' +
        aCSV(
          r.tajeos.map((x) => ({
            tajeo: x.id,
            nombre: x.nombre,
            origen: x.origen,
            nivel: x.nivel,
            metodo: x.metodo.nombre,
            ancho_minado_m: x.ancho,
            insitu_t: Math.round(x.ev.tMineral),
            ley_insitu_gt: +x.ev.leyInSitu.toFixed(2),
            dilucion_pct: +x.ev.dilucion.toFixed(1),
            diluido_t: Math.round(x.ev.tDiluido),
            ley_diluida_gt: +x.ev.leyDiluida.toFixed(2),
            pilar_t: Math.round(x.pilar),
            recuperado_t: Math.round(x.recuperado),
            metal_g: Math.round(x.metal),
            ley_corte_gt: +x.corte.toFixed(2),
            categoria: x.categoria,
            estado: x.estado,
          })),
        ),
      'text/csv;charset=utf-8',
    )

  return (
    <div className="pb-10">
      <Cabecera titulo="Reservas de la mina" detalle="Reserves UG · tajeos de la mina piloto y tajeos publicados por Designer UG, contra el modelo de bloques">
        <Boton variante="fant" onClick={p.restablecer}>
          Restablecer parámetros
        </Boton>
        <Boton variante="sec" onClick={exportar}>
          Exportar CSV
        </Boton>
      </Cabecera>

      <div className="px-6 space-y-4">
        <div className="grid grid-cols-4 max-[1100px]:grid-cols-2 gap-px bg-filete border border-filete rounded overflow-hidden">
          {[
            ['Reserva de tajeos', `${fmt(t)} t`, `${reserva.length} de ${r.tajeos.length} tajeos sobre la ley de corte`],
            ['Ley diluida', `${fmt(t ? metal / t : 0, 2)} g/t`, 'ponderada por tonelaje recuperado'],
            ['Oro contenido', `${fmt(metal / ONZA)} oz`, `${fmt(metal / 1000, 1)} kg`],
            ['Mineral de desarrollo', `${fmt(mineralDes.reduce((s, d) => s + d.t, 0))} t`, `${mineralDes.length} labores sobre ${fmt(r.corteDes, 2)} g/t`],
          ].map(([l, v, d]) => (
            <div key={l} className="bg-panel px-4 py-3">
              <div className="rotulo">{l}</div>
              <div className="text-[22px] font-semibold titular mt-1">{v}</div>
              <div className="text-[11.5px] text-tinta-3 mt-0.5">{d}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4 max-[1200px]:col-span-12 space-y-4">
            {Object.values(p.metodos).map((m) => (
              <PanelMetodo key={m.id} m={m} corte={leyCorteMetodo(m, p.eco)} />
            ))}
            <Panel titulo="Parámetros económicos">
              <div className="p-4 grid grid-cols-2 gap-3">
                <Campo l="Precio del oro" u="US$/g" paso={0.5} v={p.eco.precio} onChange={(v) => p.setEco({ precio: v })} invalido={!(p.eco.precio > 0)} />
                <Campo l="Recuperación de planta" u="%" v={p.eco.recPlanta} onChange={(v) => p.setEco({ recPlanta: v })} invalido={!(p.eco.recPlanta > 0 && p.eco.recPlanta <= 100)} />
                <Campo l="Costo de planta" u="US$/t" v={p.eco.costoPlanta} onChange={(v) => p.setEco({ costoPlanta: v })} />
                <Campo l="Costo de administración" u="US$/t" v={p.eco.costoAdm} onChange={(v) => p.setEco({ costoAdm: v })} />
              </div>
              <p className="px-4 pb-3 text-[12px] text-tinta-3">
                Ley de corte = costo total / (precio × recuperación de planta). En desarrollo el avance ya paga la mina: su corte es {fmt(r.corteDes, 2)} g/t.
              </p>
            </Panel>
          </div>

          <div className="col-span-8 max-[1200px]:col-span-12 space-y-4">
            <Panel titulo="Evaluación de tajeos">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] whitespace-nowrap">
                  <thead>
                    <tr className="text-left rotulo border-b border-filete">
                      <th className="px-3 py-2 font-semibold">Tajeo</th>
                      <th className="px-3 py-2 font-semibold">Método</th>
                      <th className={th}>Ancho</th>
                      <th className={th}>In situ</th>
                      <th className={th}>Dilución</th>
                      <th className={th}>Diluido</th>
                      <th className={th}>Recuperado</th>
                      <th className="px-3 py-2 font-semibold">Categoría</th>
                      <th className="px-3 py-2 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {r.tajeos.map((x) => (
                      <tr key={x.id} className={x.estado === 'Reserva' ? '' : 'text-tinta-2'}>
                        <td className="px-3 py-1.5">
                          <span className="block font-medium text-tinta">{x.nombre}</span>
                          <span className="block text-[11.5px] text-tinta-3">
                            {x.origen} · NV {x.nivel}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            aria-label={`Método de ${x.nombre}`}
                            value={x.metodo.id}
                            onChange={(e) => p.asignar(x.id, e.target.value)}
                            className="h-8 bg-suelo border border-filete-2 rounded px-2 text-[13px]"
                          >
                            {Object.values(p.metodos).map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={td}>{fmt(x.ancho, 1)} m</td>
                        <td className={td}>
                          {fmt(x.ev.tMineral)} t<span className="block text-[11.5px] text-tinta-3">{fmt(x.ev.leyInSitu, 2)} g/t</span>
                        </td>
                        <td className={td}>{fmt(x.ev.dilucion, 1)} %</td>
                        <td className={td}>
                          {fmt(x.ev.tDiluido)} t<span className="block text-[11.5px] text-tinta-3">{fmt(x.ev.leyDiluida, 2)} g/t</span>
                        </td>
                        <td className={td}>
                          <span className="text-tinta">{fmt(x.recuperado)} t</span>
                          <span className="block text-[11.5px] text-tinta-3">pilar {fmt(x.pilar)} t</span>
                        </td>
                        <td className="px-3 py-1.5">{x.categoria}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex items-center gap-1.5 ${ESTADO[x.estado].c}`}>
                            <Icon n={ESTADO[x.estado].i} className="size-3.5" />
                            {x.estado}
                          </span>
                          {x.estado === 'Bajo ley de corte' && <span className="block text-[11.5px] text-tinta-3">corte {fmt(x.corte, 2)} g/t</span>}
                          {x.estado === 'Sin acceso' && <span className="block text-[11.5px] text-tinta-3">sin galería de nivel bajo el piso</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3 max-w-[110ch]">
                Ley del modelo de bloques (no la ley de la labor que usa el programa semanal). Ancho = máx(veta de {POTENCIA} m, ancho mínimo del método). Recuperado = (diluido −
                pilar) × recuperación. Categoría: zona medida hasta x = {LIMITE_MEDIDO} m (supuesto de la demo); un tajeo que toca bloques indicados es probable.
              </p>
            </Panel>

            <Panel titulo="Reservas por nivel, método y categoría">
              {r.agregado.length ? (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left rotulo border-b border-filete">
                      <th className="px-4 py-2 font-semibold">Nivel</th>
                      <th className="px-3 py-2 font-semibold">Método</th>
                      <th className="px-3 py-2 font-semibold">Categoría</th>
                      <th className={th}>Tajeos</th>
                      <th className={th}>Toneladas</th>
                      <th className={th}>Ley</th>
                      <th className="px-4 py-2 font-semibold text-right">Oro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-filete">
                    {r.agregado.map((g) => (
                      <tr key={`${g.nivel}${g.metodo}${g.categoria}`}>
                        <td className="px-4 py-1.5">NV {g.nivel}</td>
                        <td className="px-3 py-1.5">{g.metodo}</td>
                        <td className="px-3 py-1.5">{g.categoria}</td>
                        <td className={td}>{g.n}</td>
                        <td className={td}>{fmt(g.t)} t</td>
                        <td className={td}>{fmt(g.metal / g.t, 2)} g/t</td>
                        <td className="px-4 py-1.5 text-right">{fmt(g.metal / ONZA)} oz</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t border-filete-2">
                      <td className="px-4 py-2" colSpan={3}>
                        Total
                      </td>
                      <td className="px-3 py-2 text-right">{reserva.length}</td>
                      <td className="px-3 py-2 text-right">{fmt(t)} t</td>
                      <td className="px-3 py-2 text-right">{fmt(t ? metal / t : 0, 2)} g/t</td>
                      <td className="px-4 py-2 text-right">{fmt(metal / ONZA)} oz</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-3 text-[13px] text-tinta-2">Ningún tajeo supera su ley de corte con estos parámetros.</p>
              )}
            </Panel>

            <Panel titulo="Labores de desarrollo">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left rotulo border-b border-filete">
                    <th className="px-4 py-2 font-semibold">Labor</th>
                    <th className={th}>Metros</th>
                    <th className={th}>Toneladas</th>
                    <th className={th}>Ley</th>
                    <th className="px-4 py-2 font-semibold">Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-filete">
                  {r.desarrollo.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-1.5">
                        {d.nombre} <span className="text-[11.5px] text-tinta-3">· {d.origen}</span>
                      </td>
                      <td className={td}>{fmt(d.metros, 1)} m</td>
                      <td className={td}>{fmt(d.t)} t</td>
                      <td className={td}>{d.ley ? `${fmt(d.ley, 2)} g/t` : '—'}</td>
                      <td className="px-4 py-1.5">
                        <span className={`inline-flex items-center gap-1.5 ${d.destino === 'Mineral' ? 'text-bien' : 'text-tinta-2'}`}>
                          <Icon n={d.destino === 'Mineral' ? 'ok' : 'menos'} className="size-3.5" />
                          {d.destino}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-2.5 border-t border-filete text-[11.5px] text-tinta-3">
                Toneladas = metros × sección × densidad. Ley de la labor según el programa; los diseños aún no tienen ley y van a desmonte.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}

function PanelMetodo({ m, corte }: { m: Metodo; corte: number }) {
  const set = useReservas((s) => s.setMetodo)
  const errores = validarMetodo(m)
  const c = (k: keyof Metodo, l: string, u: string, paso = 1) => (
    <Campo l={l} u={u} paso={paso} v={m[k] as number} onChange={(v) => set(m.id, { [k]: v })} invalido={!Number.isFinite(m[k] as number)} />
  )
  return (
    <Panel titulo={m.nombre} accion={<span className="text-[12.5px] text-tinta-2">corte {fmt(corte, 2)} g/t</span>}>
      <div className="p-4 grid grid-cols-2 gap-3">
        {c('anchoMin', 'Ancho mínimo', 'm', 0.1)}
        {c('sobre', 'Sobre-rotura por pared', 'm', 0.1)}
        {c('recuperacion', 'Recuperación minera', '%')}
        {c('factorPilar', 'Mineral en pilares', '%')}
        {c('costoMina', 'Costo de mina', 'US$/t')}
      </div>
      {errores.length > 0 && (
        <ul role="alert" className="px-4 pb-3 space-y-1 text-[12.5px] text-critico">
          {errores.map((e) => (
            <li key={e} className="flex items-center gap-1.5">
              <Icon n="x" className="size-3.5" /> {e}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
