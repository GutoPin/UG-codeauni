import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AHORA, AVANCE_DISPARO, HABILITACION_INICIAL, DIAS, LABORES, estadoGuardia, generarTareas, type Causa, type HabilitacionLabor, type Tarea } from './data/minaPiloto'
import { aplicarCola, arrastrarPendientes, estaHabilitada } from './domain/stp'

export interface MarcaCola {
  /** id generado en el dispositivo: la sincronización es idempotente por id */
  id: string
  tareaId: string
  tipo: 'inicio' | 'avance' | 'cierre'
  cantidad: number
  causa: Causa | null
  /** hora local del dispositivo (ficha: los cambios sin señal se marcan con hora local) */
  horaLocal: string
}

interface Estado {
  tareas: Tarea[]
  habilitacion: Record<string, HabilitacionLabor>
  online: boolean
  cola: MarcaCola[]
  aplicadas: string[]
  ultimaSync: string | null
  setPlan: (tareaId: string, plan: number) => void
  setEquipo: (tareaId: string, equipoId: string) => void
  asignar: (cambios: { id: string; equipoId?: string; cuadrillaId?: string }[]) => void
  setHabilitacion: (laborId: string, patch: Partial<HabilitacionLabor>) => void
  marcar: (m: Omit<MarcaCola, 'id' | 'horaLocal'>) => void
  setOnline: (v: boolean) => void
  sincronizar: () => void
  arrastrar: (fecha: string) => number
  programarLabor: (laborId: string) => number
  reiniciar: () => void
}

const horaLocal = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 19)
}

const inicial = () => ({
  tareas: generarTareas(),
  habilitacion: structuredClone(HABILITACION_INICIAL),
  online: true,
  cola: [] as MarcaCola[],
  aplicadas: [] as string[],
  ultimaSync: null as string | null,
})

export const useStore = create<Estado>()(
  persist(
    (set, get) => ({
      ...inicial(),
      setPlan: (tareaId, plan) => {
        if (!(plan > 0)) return // validación de la ficha: cantidad plan mayor a cero
        set((s) => ({ tareas: s.tareas.map((t) => (t.id === tareaId ? { ...t, plan } : t)) }))
      },
      setEquipo: (tareaId, equipoId) =>
        set((s) => ({ tareas: s.tareas.map((t) => (t.id === tareaId ? { ...t, equipoId } : t)) })),
      asignar: (cambios) => {
        const porId = new Map(cambios.map((c) => [c.id, c]))
        set((s) => ({ tareas: s.tareas.map((t) => (porId.has(t.id) ? { ...t, ...porId.get(t.id) } : t)) }))
      },
      setHabilitacion: (laborId, patch) =>
        set((s) => ({ habilitacion: { ...s.habilitacion, [laborId]: { ...s.habilitacion[laborId], ...patch } } })),
      marcar: (m) => {
        set((s) => ({ cola: [...s.cola, { ...m, id: crypto.randomUUID(), horaLocal: horaLocal() }] }))
        if (get().online) get().sincronizar()
      },
      setOnline: (v) => {
        set({ online: v })
        if (v) get().sincronizar()
      },
      sincronizar: () => {
        const s = get()
        if (!s.cola.length) return
        const reales = Object.fromEntries(s.tareas.filter((t) => t.real != null).map((t) => [t.id, t.real!]))
        const avances = s.cola.filter((m) => m.tipo === 'avance').map((m) => ({ id: m.id, tareaId: m.tareaId, cantidadReal: m.cantidad }))
        const r = aplicarCola(reales, avances, new Set(s.aplicadas))
        const nuevas = s.cola.filter((m) => !s.aplicadas.includes(m.id))
        const tareas = s.tareas.map((t) => {
          const mias = nuevas.filter((m) => m.tareaId === t.id)
          if (!mias.length) return t
          const cierre = mias.find((m) => m.tipo === 'cierre')
          const real = r.reales[t.id] ?? t.real
          // shortcut: minutos perdidos estimados como desvío × duración; reemplazar por el tiempo que reporte el jefe de guardia
          const perdidos = cierre?.causa && real != null ? Math.round(Math.max(0, 1 - real / t.plan) * (t.fin - t.inicio) * 60) : t.minutosPerdidos
          return {
            ...t,
            real,
            minutosPerdidos: perdidos,
            estado: cierre ? ('cerrada' as const) : ('en curso' as const),
            causa: cierre?.causa ?? t.causa,
          }
        })
        set({
          tareas,
          aplicadas: [...new Set([...r.aplicadas, ...nuevas.map((m) => m.id)])],
          cola: [],
          ultimaSync: horaLocal(),
        })
      },
      arrastrar: (fecha) => {
        const s = get()
        let total = 0
        const tareas = s.tareas.map((t) => ({ ...t }))
        for (const t of tareas.filter((x) => x.fecha === fecha && x.real != null && x.pendienteArrastrado == null)) {
          // destino: la próxima guardia futura de la misma labor y turno; un día ya reportado no cambia su meta
          const destino = tareas.find((x) => x.fecha > fecha && x.guardia === t.guardia && x.laborId === t.laborId && estadoGuardia(x.fecha, x.guardia) === 'futura')
          if (!destino) continue
          const [a] = arrastrarPendientes([{ laborId: t.laborId, plan: t.plan, real: t.real!, planSiguiente: destino.plan }])
          if (a.pendiente <= 0) continue
          destino.plan = a.planSiguiente
          destino.arrastre = +((destino.arrastre ?? 0) + a.pendiente).toFixed(2)
          t.pendienteArrastrado = a.pendiente
          total++
        }
        set({ tareas })
        return total
      },
      programarLabor: (laborId) => {
        const s = get()
        const l = LABORES.find((x) => x.id === laborId)!
        // validación de la ficha: una labor no habilitada no puede programarse
        if (!estaHabilitada(s.habilitacion[laborId], AHORA).ok) return 0
        const nuevas: Tarea[] = []
        let n = s.tareas.length
        for (const fecha of DIAS)
          for (const g of ['D', 'N'] as const) {
            if (estadoGuardia(fecha, g) !== 'futura') continue
            if (s.tareas.some((t) => t.laborId === laborId && t.fecha === fecha && t.guardia === g)) continue
            nuevas.push({
              id: `T${++n}-${laborId}`,
              laborId,
              fecha,
              guardia: g,
              tipo: l.tipo === 'Tajeo' ? 'Limpieza' : 'Perforación',
              unidad: l.tipo === 'Tajeo' ? 't' : 'm',
              plan: l.tipo === 'Tajeo' ? 200 : AVANCE_DISPARO,
              real: null,
              equipoId: l.tipo === 'Tajeo' ? 'SC-02' : 'JB-03',
              cuadrillaId: g === 'D' ? 'CB' : 'CD',
              inicio: 8,
              fin: 12,
              estado: 'pendiente',
              causa: null,
              minutosPerdidos: 0,
            })
          }
        set({ tareas: [...s.tareas, ...nuevas] })
        return nuevas.length
      },
      reiniciar: () => set(inicial()),
    }),
    { name: 'codea-planning-ug/v1', version: 2 } // subir la versión al cambiar la mina piloto: descarta datos guardados viejos,
  ),
)
