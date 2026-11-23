---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

## Scope

App shell de CODEa Planning UG (todas las pantallas). Modo: **Operate**. Construcción code-led (sin generación de imágenes).

## Audience and task

Planeador de corto plazo y jefe de mina en oficina (monitor grande); jefe de guardia en tablet bajo tierra. Tarea: armar el programa semanal, ver qué labores no están habilitadas, ver el cumplimiento plan vs. real y sus causas, marcar tareas sin señal.

## Direction contract

THESIS: El plano de mina es la interfaz de estado. El cumplimiento se lee sobre la sección longitudinal de la veta (niveles 3900–3750 como renglones, labores y tajeos como piezas), no en tarjetas de KPI. Rechaza el dashboard SaaS genérico de tarjetas iguales con número grande.

OWN-WORLD: Identidad CODEa del plan de trabajo: suelo casi negro verdoso (#111615), paneles #18201e con filetes de 1px #26302d, texto #e9eeec / #a3b0ac, coral CODEa #e8735a para acción y selección. Estados reservados (bien #0ca30c, alerta #fab219, crítico #d03b3b) siempre con ícono y texto. Ley de mineral en rampa secuencial de un solo tono (ámbar→coral). Tipografía Archivo (ancho variable): semicondensada para títulos y encabezados de tabla, normal para cuerpo, cifras tabulares. Densidad alta, esquinas de 4px, sin sombras decorativas.

STORY: El visitante entiende en segundos cómo va la semana en la mina piloto, ve qué labor está fuera y por qué, y entra a corregir el programa o a marcar la guardia.

FIRST VIEWPORT: Barra lateral izquierda fija (marca CODEa Planning UG, 7 módulos con su Ola, STP con subvistas). Área de trabajo: título "Mina piloto UG · Semana 48" con selector de guardia; a la izquierda 60% el visor 3D de la mina (veta por ley, rampa, galerías por nivel, tajeos teñidos por cumplimiento); a la derecha la sección longitudinal compacta con el cumplimiento por labor y una franja de 4 cifras de la semana (avance m, toneladas, disparos, cumplimiento) con su historia diaria. Debajo, la lista de alertas de habilitación. Acción primaria: "Abrir programa semanal".

FORM: Sección longitudinal de mina como mapa de estado (signature move), presente en Inicio y como minimapa en Programa; seed: none (pinned) — el usuario eligió "Sala de control oscura (Fondo casi negro como la portada del PDF de CODEa, acento coral/naranja, tipografía técnica, datos densos y 3D luminoso)".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Datos reales de una mina piloto; logo de CODEa (no hay archivo: se usa el nombre en texto).

## ADAPTATIONS (after finish review)
- Crítico is `#ff5470` (5.4:1 on panel), not `#d03b3b` (3.5:1, failed contrast) and not `#f06a5f` (6° from coral). Reason: contrast and separation from the coral action accent.
- Coral is reserved for action, selection, the "ahora" marker and the current shift. Data series use the validated pair azul `#3987e5` (desarrollo, guardia día, single-series bars) and aqua `#199e70` (producción, guardia noche); validated with the dataviz script on `#171f1d`.
- Known collision: the ley ramp (`#3a2620`→`#ffa27f`) shares warm hues with alerta/crítico. In 3D, state lives on near-opaque emissive tajeos and tubes; ley lives on the matte block field behind them.
- Seed: the user pinned the world ("Sala de control oscura") in the scope question, not the first viewport; the concept roll was skipped because the build was code-led on a pinned direction.
- Programa has no metric strip: totals are a `<tfoot>` row of the program table.
- Not built: the first-viewport guardia selector the finish review flagged. Inicio still opens on the fixed demo shift (jueves 26, día).
- Aqua `#199e70` vs bien `#2bb52b` is ΔE 11,3 (below 15). Accepted because they never share a chart: aqua lives only in the Gantt and the Tendencia line, status green only on `Pct` and status bars, always with an icon.
