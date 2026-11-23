import { useState } from 'react'
import { LABORES, SEMANA, estadoGuardia, inicioGuardia } from '../../data/minaPiloto'
import { fmt, laborDe } from '../../derive'
import { aCSV, aDXF, leerCSV, validarPlan, type CambioPlan } from '../../domain/deswik'
import { estaHabilitada } from '../../domain/stp'
import { ir } from '../../ruta'
import { useStore } from '../../store'
import { Boton, Cabecera, diaCorto, Icon, Panel } from '../../ui/kit'

function descargar(nombre: string, texto: string, tipo: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }))
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}

const CAPAS = ['Rampa', 'Galería', 'Crucero', 'Chimenea', 'Tajeo'] as const

type Lectura = { nombre: string; cambios: CambioPlan[]; rechazos: { fila: number; motivo: string }[]; error: string | null }

export default function Intercambio() {
  const { tareas, habilitacion, setPlan } = useStore()
  const [lectura, setLectura] = useState<Lectura | null>(null)
  const [aplicado, setAplicado] = useState<CambioPlan[] | null>(null)
  const [sobre, setSobre] = useState(false)

  const exportarPrograma = () => {
    const filas = tareas.map((t) => {
      const l = laborDe(t.laborId)
      return {
        labor: t.laborId,
        tipo_labor: l.tipo,
        nivel: l.nivel,
        fecha: t.fecha,
        guardia: t.guardia,
        inicio_h: t.inicio,
        fin_h: t.fin,
        tarea: t.tipo,
        equipo: t.equipoId,
        cuadrilla: t.cuadrillaId,
        plan: t.plan,
        unidad: t.unidad,
        real: t.real,
        estado: t.estado,
        causa: t.causa,
      }
    })
    // BOM: Excel abre el UTF-8 con tildes correctas
    descargar(`programa_semana_${SEMANA.numero}.csv`, '﻿' + aCSV(filas), 'text/csv;charset=utf-8')
  }

  const exportarDXF = () => {
    const piezas = LABORES.map((l) => ({ id: l.id, tipo: l.tipo, eje: l.eje, caja: l.caja, y: l.caja ? +(3 * Math.sin((l.caja[2] + l.caja[3]) / 60)).toFixed(2) : undefined }))
    descargar('mina_piloto_labores.dxf', aDXF(piezas), 'application/dxf')
  }

  const leer = (nombre: string, texto: string) => {
    const r = validarPlan(leerCSV(texto), {
      tareas,
      existe: (id) => LABORES.some((l) => l.id === id),
      editable: (fecha, g) => estadoGuardia(fecha, g) !== 'pasada',
      // se juzga al inicio de la guardia: un re-ingreso que vence hoy no bloquea las guardias siguientes
      habilitada: (id, fecha, g) => {
        const h = habilitacion[id] && estaHabilitada(habilitacion[id], inicioGuardia(fecha, g))
        return h && !h.ok ? `falta ${h.motivos.join(', ')}` : null
      },
    })
    setAplicado(null)
    setLectura({ nombre, ...r })
  }

  // Ejemplo de plan mensual recibido: sube 10 % el plan de las galerías y trae tres filas que deben rechazarse.
  const ejemplo = () => {
    const futuras = tareas.filter((t) => t.laborId.startsWith('GL') && estadoGuardia(t.fecha, t.guardia) === 'futura')
    const filas = [
      ...futuras.map((t) => ({ labor: t.laborId, fecha: t.fecha, guardia: t.guardia, plan: String(+(t.plan * 1.1).toFixed(2)).replace('.', ',') })),
      { labor: 'GL-3800', fecha: '2026-11-24', guardia: 'D', plan: '3,0' },
      { labor: 'CX-3800-2', fecha: '2026-11-28', guardia: 'D', plan: '2,7' },
      { labor: 'GL-3700', fecha: '2026-11-28', guardia: 'D', plan: '2,7' },
    ]
    const csv = ['labor;fecha;guardia;plan', ...filas.map((f) => `${f.labor};${f.fecha};${f.guardia};${f.plan}`)].join('\r\n')
    leer('ejemplo_plan_mensual.csv', csv)
  }

  const aplicar = () => {
    if (!lectura) return
    lectura.cambios.forEach((c) => setPlan(c.tareaId, c.despues))
    setAplicado(lectura.cambios)
    setLectura(null)
  }

  const capas = CAPAS.map((t) => ({ t, n: LABORES.filter((l) => l.tipo === t).length }))

  return (
    <div className="pb-10">
      <Cabecera titulo="Intercambio con Deswik" detalle="Programa y geometría por archivo: CSV para el plan, DXF para las labores" />
      <div className="px-6 grid grid-cols-12 gap-4 items-start">
        <Panel className="col-span-6 max-[1100px]:col-span-12" titulo="Exportar programa · CSV">
          <div className="px-4 py-3 text-[13px] text-tinta-2 space-y-3">
            <p>
              Las {tareas.length} tareas de la semana {SEMANA.numero}: labor, nivel, fecha, guardia, horas, tarea, equipo, cuadrilla, plan, real,
              estado y causa. Separador coma, punto decimal y fechas AAAA-MM-DD.
            </p>
            <Boton variante="sec" onClick={exportarPrograma}>
              Descargar programa_semana_{SEMANA.numero}.csv
            </Boton>
          </div>
        </Panel>

        <Panel className="col-span-6 max-[1100px]:col-span-12" titulo="Exportar geometría · DXF">
          <div className="px-4 py-3 text-[13px] text-tinta-2 space-y-3">
            <p>Polilíneas 3D por labor en coordenadas de mina (x rumbo, y transversal, z cota), una capa por tipo y el código de cada labor como texto.</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
              {capas.map(({ t, n }) => (
                <li key={t}>
                  <span className="text-tinta font-medium">{t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()}</span>{' '}
                  <span className="text-tinta-3">{n}</span>
                </li>
              ))}
            </ul>
            <Boton variante="sec" onClick={exportarDXF}>
              Descargar mina_piloto_labores.dxf
            </Boton>
          </div>
        </Panel>

        <Panel
          className="col-span-12"
          titulo="Importar plan · CSV"
          accion={
            <Boton variante="fant" onClick={ejemplo}>
              Probar con un ejemplo
            </Boton>
          }
        >
          <div className="p-4 space-y-4">
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setSobre(true)
              }}
              onDragLeave={() => setSobre(false)}
              onDrop={async (e) => {
                e.preventDefault()
                setSobre(false)
                const f = e.dataTransfer.files[0]
                if (f) leer(f.name, await f.text())
              }}
              className={`flex flex-col items-center justify-center gap-1.5 h-28 rounded border border-dashed cursor-pointer text-[13px] transition-colors ${sobre ? 'border-coral bg-coral/5' : 'border-filete-2 hover:border-tinta-3'}`}
            >
              <span className="text-tinta">Arrastra un CSV aquí o haz clic para elegirlo</span>
              <span className="text-tinta-3 text-[12px]">
                Columnas obligatorias: labor, fecha, guardia, plan. Sirve el mismo programa exportado arriba con la columna plan cambiada.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) leer(f.name, await f.text())
                  e.target.value = ''
                }}
              />
            </label>

            {aplicado && (
              <div role="status" className="flex items-center gap-3 text-[13px] bg-panel-2 border border-bien/40 rounded px-4 py-2.5">
                <Icon n="ok" className="size-4 text-bien shrink-0" />
                <span className="flex-1">{aplicado.length} planes actualizados en el programa semanal.</span>
                <Boton variante="sec" onClick={() => ir('/stp/programa')}>
                  Ver programa <Icon n="flecha" className="size-3.5" />
                </Boton>
                <Boton
                  variante="fant"
                  onClick={() => {
                    aplicado.forEach((c) => setPlan(c.tareaId, c.antes))
                    setAplicado(null)
                  }}
                >
                  Deshacer
                </Boton>
              </div>
            )}

            {lectura &&
              (lectura.error ? (
                <p role="alert" className="flex items-center gap-2 text-[13px] text-critico">
                  <Icon n="x" className="size-4" /> {lectura.nombre}: {lectura.error}
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                    <span className="text-tinta font-medium">{lectura.nombre}</span>
                    <span className="inline-flex items-center gap-1.5 text-bien">
                      <Icon n="ok" className="size-4" />
                      {lectura.cambios.length} cambios listos
                    </span>
                    {lectura.rechazos.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-alerta">
                        <Icon n="alerta" className="size-4" />
                        {lectura.rechazos.length} filas rechazadas
                      </span>
                    )}
                    <span className="flex-1" />
                    <Boton variante="fant" onClick={() => setLectura(null)}>
                      Descartar
                    </Boton>
                    <Boton variante="pri" disabled={!lectura.cambios.length} onClick={aplicar}>
                      Aplicar {lectura.cambios.length} cambios
                    </Boton>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-7 max-[1100px]:col-span-12 border border-filete rounded overflow-hidden">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-left rotulo border-b border-filete">
                            <th className="px-3 py-2 font-semibold">Fila</th>
                            <th className="px-3 py-2 font-semibold">Labor</th>
                            <th className="px-3 py-2 font-semibold">Guardia</th>
                            <th className="px-3 py-2 font-semibold text-right">Plan actual</th>
                            <th className="px-3 py-2 font-semibold text-right">Nuevo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-filete">
                          {lectura.cambios.map((c) => {
                            const d = laborDe(c.laborId).tipo === 'Tajeo' ? 0 : 1
                            const u = d ? 'm' : 't'
                            return (
                              <tr key={c.tareaId}>
                                <td className="px-3 py-1.5 text-tinta-3">{c.fila}</td>
                                <td className="px-3 py-1.5">{laborDe(c.laborId).nombre}</td>
                                <td className="px-3 py-1.5 text-tinta-2 first-letter:uppercase">
                                  {diaCorto(c.fecha)} {c.guardia === 'D' ? 'día' : 'noche'}
                                </td>
                                <td className="px-3 py-1.5 text-right text-tinta-2">{fmt(c.antes, d)} {u}</td>
                                <td className="px-3 py-1.5 text-right font-medium">
                                  {fmt(c.despues, d)} {u}
                                </td>
                              </tr>
                            )
                          })}
                          {!lectura.cambios.length && (
                            <tr>
                              <td colSpan={5} className="px-3 py-3 text-tinta-3">Ninguna fila cambia el plan.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {lectura.rechazos.length > 0 && (
                      <div className="col-span-5 max-[1100px]:col-span-12 border border-alerta/40 rounded">
                        <div className="px-3 py-2 rotulo border-b border-filete">No se importan</div>
                        <ul className="divide-y divide-filete text-[13px]">
                          {lectura.rechazos.map((r) => (
                            <li key={r.fila} className="px-3 py-1.5 flex gap-3">
                              <span className="text-tinta-3 w-10 shrink-0">fila {r.fila}</span>
                              <span className="text-tinta-2">{r.motivo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
