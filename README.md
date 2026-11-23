# CODEa Planning UG · demo

Demo web de la familia **Planning UG** de CODEa: el **Short-Term Planner UG** (módulo 1, hito H1) funcionando sobre una
**mina piloto sintética**, un visor 3D de la mina y las fórmulas de los módulos 2–7 como calculadoras con los casos de
prueba de sus fichas.

> Mina piloto sintética. Datos de demostración, no de una operación real.

## Correr

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # casos de prueba de las 7 fichas (vitest)
pnpm build      # chequeo de tipos + build de producción
pnpm lint
```

Todo corre en el navegador; el estado (programa, marcas, cola sin señal) se guarda en `localStorage`.
Para volver al estado inicial: borrar el almacenamiento del sitio.

## Qué hay

| Pantalla | Ruta | Qué muestra |
|---|---|---|
| Mina piloto | `#/` | Visor 3D, sección longitudinal con cumplimiento por labor, guardias de la semana, alertas |
| Visor 3D | `#/mina` | Modelo de bloques de la veta, rampa, galerías, cruceros, chimenea y tajeos |
| Programa semanal | `#/stp/programa` | Programa por labor: habilitación, avance, disparos, toneladas, perforación, sostenimiento; plan editable por guardia |
| Gantt de guardias | `#/stp/gantt` | Tareas por equipo en las 14 guardias; conflictos de equipo y reasignación |
| Cumplimiento | `#/stp/cumplimiento` | Plan contra real por labor, guardia y supervisor; Pareto de causas |
| Guardia en tablet | `#/stp/tablet` | Vista del jefe de guardia; marcas sin señal en cola, sincronización sin duplicar |
| Reprogramación | `#/stp/reprogramar` | Arrastre de pendientes y asignación sugerida por puntaje |
| Calculadoras | `#/modulo/<id>` | Designer, Reserves, Scheduler (CPM), Stope Optimizer (DP), Blend, Cave Planner |

## Estructura

```
src/domain/      fórmulas puras + pruebas con los valores de las fichas
src/data/        mina piloto sintética (generador determinista)
src/store.ts     estado (zustand + localStorage), cola sin señal
src/derive.ts    agregados: cumplimiento, Pareto, conflictos
src/screens/     pantallas
src/ui/          kit de interfaz, visor 3D, sección longitudinal
docs/            ROADMAP, RULES, DECISIONS, QUESTIONS, fichas
```
