# Roadmap

Hitos del *Plan de trabajo Planning UG*. Esta entrega es una **demo** pedida para mostrar avance; el plan pide
módulos completos («Nada de MVP»), así que nada de lo de abajo cuenta como hito cerrado hasta cumplir su
definición de hecho (sección 6 del plan) y la aprobación del ingeniero de minas.

| Hito | Módulo | Estado |
|---|---|---|
| H0 | Fase 0 · Fundación | Parcial: repo, pruebas, mina piloto sintética, docs. Falta CI, contratos de datos, motor 3D común, REPORTS.md |
| ▶ H1 | Short-Term Planner UG | Demo funcional en navegador (ver abajo) |
| H2 | Designer UG | Empezado: constructor de labor por tramos y tajeo paramétrico evaluado contra el modelo de bloques (ver abajo) |
| H3 | Reserves UG | Solo fórmulas + calculadora |
| H4 | Scheduler UG | Fórmulas + CPM con mini-Gantt |
| H5 | Stope Optimizer | Fórmulas + selección de formas por DP |
| H6 | Blend UG | Solo fórmulas + calculadora |
| H7 | Cave Planner | Solo fórmulas + calculadora |

## H1 · qué hay y qué falta

Hecho (demo): programa semanal por labor y guardia, habilitación (ventilación, sostenimiento, equipo, re-ingreso),
conflicto de equipo, asignación de equipo y cuadrilla por guardia con sugerencia (heurística voraz que resuelve
conflictos sin cambiar el tipo de equipo ni tocar tareas iniciadas), cumplimiento plan/real con «sin reporte» vacío, Pareto de causas, tablet con cola sin señal
idempotente, causa obligatoria sobre el umbral de desvío, arrastre de pendientes, puntaje de asignación, reoptimización del resto de la semana con cuatro objetivos (producción, desarrollo, ley de mezcla y balance de
equipos, con pesos ajustables, vista previa y deshacer), intercambio con Deswik por archivo (exporta programa CSV y
geometría DXF R12 por capas; importa plan CSV validando cada fila con las reglas de la ficha, con vista previa y deshacer).

Falta para cerrar H1: backend y base de datos (modelo de datos del backlog), usuarios y roles, envío real a tablets
(PWA/service worker), integraciones en vivo (Shift, Epiroc), validar el CSV/DXF con un archivo real de Deswik, tiraje de hundimiento,
un solver real para la reoptimización (hoy búsqueda local sobre suma ponderada), demostración al ingeniero.

Criterio «recalcular 100 tareas en menos de 5 s»: cubierto por una prueba (`stp.test.ts`) sobre arrastre +
asignación; falta medirlo con el backend real.

Visor 3D: corte de roca con superficie, túneles con sombra y luminarias. Baja solo a modo ligero (sin sombras,
relieve ni velo) si no sostiene ~24 fps; medido en GPU por software: 9,5 → 16 fps.

## H2 · Designer UG: qué hay y qué falta

Hecho (demo): biblioteca de secciones tipo del catálogo con área y sobre-excavación; constructor de labor por tramos
(rectas y curvas) con gradiente máxima y radio mínimo validados mientras se dibuja, con los mensajes de la ficha, planta,
perfil, V = A × L y toneladas; tajeo paramétrico (largo, ancho, alto, buzamiento) evaluado contra el modelo de bloques
por muestreo en 5 × 5 × 5 subbloques: tonelaje, ley, finos, dilución (estéril dentro + sobre-excavación × área de pared),
ley de corte, traslape con otros tajeos y pilar contra las galerías de nivel.

Falta: guardar el diseño como registros con versiones y congelado, edición de vértices del eje, intersecciones
automáticas, motor 3D común (hoy el diseño no aparece en el visor 3D), consultas espaciales, servicios, planos,
intercambio DXF/Surpac/OMF, entrega a Scheduler y Reserves, diseño automático desde Stope Optimizer.
