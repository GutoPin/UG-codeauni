# Planning · Short-Term Planner UG
Alcance: Solo subterránea (UG) · Reemplaza Excel o papel · Esfuerzo: Medio · Ola 1
Módulo hermano: Short-Term Planner OP (Planning)
## Qué resuelve
Programa semanal, diario y por guardia; cumplimiento plan vs. real.

## Alcance
Módulo para minería subterránea (CODEa Short-Term Planner UG). Su hermano es Short-Term Planner OP (bancos, palas y camiones de tajo abierto); esta ficha NO cubre control de bancos ni programa de tajo.

## Contexto
El programa de corto plazo baja el plan mensual de mina a lo que se hace cada semana, cada día y en cada guardia (turno): qué labores se perforan, qué se dispara, qué mineral se saca y con qué equipo y cuadrilla. Hoy se arma en Excel y se reparte en una pizarra, y se pierde cuando algo cambia. Este módulo arma ese programa, lo envía a los supervisores en tablet, mide el cumplimiento plan contra real y reprograma lo pendiente.

## Usuarios
Jefe de mina y planeamiento de corto plazo (arman el programa semanal y diario); jefes de guardia (reciben tareas y reportan); supervisores de perforación, voladura y sostenimiento (cumplen tareas); gerente de mina (ve cumplimiento).

## Glosario
- Corto plazo: Programa semanal, diario o por guardia.
- Guardia: Turno de trabajo de 8 a 12 horas.
- Labor: Frente de avance, tajeo, rampa o galería.
- Frente: Extremo de un túnel donde se perfora y dispara.
- Disparo: Voladura de una malla de taladros.
- Anillo: Abanico de taladros largos de un tajeo.
- Sostenimiento: Soporte de la roca (pernos, malla, shotcrete) tras la excavación.
- Cumplimiento: Real / plan, en %.
- Arrastre de pendientes: Pasar al siguiente periodo lo no cumplido.
- Tiempo de re-ingreso: Tiempo de ventilación tras un disparo antes de entrar.
- Causa de desvío: Motivo por el cual no se cumplió una tarea.
- Intervalo corto de control: Revisar el avance cada guardia para corregir.
- Hundimiento: Método de minería donde el mineral cae por gravedad por puntos de extracción.

## Flujo de uso
1. Paso 1: el planeador recibe del Scheduler UG las labores y metas del mes, o las carga a mano.
2. Paso 2: se crea el programa semanal por labor: avance, disparos, toneladas, metros perforados, sostenimiento.
3. Paso 3: el sistema revisa que cada labor tenga equipo, ventilación y sostenimiento habilitados.
4. Paso 4: se asignan equipo, cuadrilla y guardia a cada tarea, con sugerencias de Sim y de un optimizador.
5. Paso 5: se detallan los programas diario y de guardia, incluidos mantenimiento y tiempo de ventilación.
6. Paso 6: se publica y las tareas llegan en tablet al jefe de guardia, también sin señal.
7. Paso 7: el supervisor marca inicio, fin, cantidad y causa de desvío de cada tarea.
8. Paso 8: Shift UG y Face/Ring aportan el avance real y el sistema calcula el cumplimiento.
9. Paso 9: se reprograma con lo ejecutado: pendientes se arrastran y se reoptimiza con objetivos múltiples.
10. Paso 10: se informa la demanda de explosivos a Explosives UG y las labores activas a Air Requirement.
11. Paso 11: se revisa el tablero de cumplimiento y las causas de desvío.
12. Paso 12: en mina por hundimiento se programa el tiraje en equilibrio con el largo plazo.

## Funcionalidades: Programa
- [ ] Programa semanal por labor: avance, disparos, toneladas, metros perforados y sostenimiento
- [ ] Programa diario y por guardia; carga manual inicial sin depender de Scheduler
- [ ] Gantt de tareas para desarrollo, producción y mantenimiento con asignación de recursos y seguimiento (programación gráfica)
- [ ] Vista 3D del programa por guardia con avance real y optimizador
- [ ] Programación realizable de la guardia actual y la siguiente
- [ ] Plan mayor recibido de Scheduler y enviado a operación

## Funcionalidades: Asignación
- [ ] Asignación de equipo y cuadrilla por guardia con cuadrillas, tareas y ubicaciones enlazadas al modelo y diseño
- [ ] Asignación sugerida por Sim y por un optimizador con objetivos múltiples
- [ ] Gestión de tareas del turno con revisión del cumplimiento
- [ ] Alerta si la labor no tiene equipo o no está habilitada por ventilación o sostenimiento
- [ ] Programación operacional alineada a metas y restricciones

## Funcionalidades: Ejecución
- [ ] Tareas en tablet con inicio, fin y cantidad, en línea y sin señal
- [ ] Cada tarea medida con tiempos
- [ ] Reoptimización con lo real: reprogramar con los pendientes
- [ ] Planes con perforación y voladura vinculados a Face, Ring y Explosives
- [ ] Control de mineral por cortes y ruteo con reportes

## Funcionalidades: Seguimiento
- [ ] Tablero de cumplimiento diario plan vs. real, sin digitar
- [ ] Registro de la causa del desvío por labor
- [ ] Pareto de causas y cumplimiento por supervisor y guardia
- [ ] Planificación y reporte de producción
- [ ] Cadena unificada de plan, ejecución del turno y seguimiento

## Funcionalidades: Hundimiento
- [ ] Programa de tiraje de hundimiento por punto de extracción que equilibra corto y largo plazo
- [ ] Control diario por punto y guardia
- [ ] Restricciones de extracción y de cuadrillas

## Funcionalidades: Automatización e integración
- [ ] Entregar el plan y el turno a la automatización de equipos (Epiroc) y leer su estado
- [ ] Intercambio con archivos de Deswik por CSV y DXF
- [ ] Recomendaciones del agente de planeamiento
- [ ] Programa de la mezcla de corto plazo con Blend UG
- [ ] Cadena integrada de planeamiento, simulación de acarreo, turno y mantenimiento con módulos CODEa

## Pantallas
- Programa semanal por labor
- Gantt de tareas y recursos
- Vista 3D con avance real
- Programa de la guardia en tablet
- Asignación de equipo y cuadrilla
- Tablero de cumplimiento
- Causas de desvío y Pareto
- Reprogramación
- Tiraje de hundimiento
- Estado de la automatización

## Lógica y cálculos
- Cumplimiento (%) = real / plan x 100, por labor, por guardia y total. Ejemplo: plan 45 m de avance y real 36 m = 80 %.
- Capacidad del equipo = horas disponibles x rendimiento. Ejemplo: jumbo con 9 h útiles y rendimiento de 12 m de barreno por hora = 108 m de perforación por guardia.
- Ciclo de avance: perforar, cargar, disparar, ventilar, limpiar y sostener; tiempo total = suma de tiempos; disparos por guardia = piso(horas disponibles / tiempo de ciclo).
- Avance por disparo (m) = longitud de barreno x eficiencia; ejemplo 3,0 m x 0,90 = 2,7 m.
- Tonelaje de avance = sección (m2) x avance (m) x densidad. Ejemplo: 18 m2 x 2,7 m x 2,8 t/m3 = 136 t.
- Habilitación: una labor está habilitada si ventilación OK, sostenimiento previo cumplido, equipo asignado y tiempo de re-ingreso transcurrido.
- Arrastre: pendiente = plan - real si positivo; se suma a la meta del siguiente periodo con prioridad.
- Asignación: puntaje de tarea = peso prioridad + peso valor - peso tiempo de espera; se asigna por mayor puntaje respetando equipo, cuadrilla y habilitación (heurística de asignación).
- Reoptimización con objetivos múltiples: minimizar desvío de producción y de desarrollo, cumplir ley objetivo y balancear equipos.
- Tiraje por punto: plan = tasa por punto x días; control por punto comparando plan y real.

## Modelo de datos
- Programa: id, tipo (semanal, diario, guardia), fecha_inicio, fecha_fin, estado, version
- LaborProgramada: id, programa_id, labor_id, avance_m, disparos, toneladas_t, metros_perforados_m, sostenimiento_m, prioridad
- Asignacion: id, labor_programada_id, equipo_id, cuadrilla_id, guardia_id, hora_inicio, hora_fin
- Tarea: id, asignacion_id, tipo, cantidad_plan, cantidad_real, inicio_real, fin_real, estado
- Meta: id, periodo, indicador, valor
- CausaDesvio: id, tarea_id, causa_id, comentario, minutos_perdidos
- Habilitacion: labor_id, ventilacion_ok, sostenimiento_ok, equipo_ok, reingreso_hasta
- CumplimientoGuardia: guardia_id, plan, real, pct
- TirajePunto: punto_id, fecha, plan_t, real_t
- EstadoAutomatizacion: equipo_id, tarea_id, estado, fecha

## Validaciones
- No asignar el mismo equipo a dos tareas simultáneas.
- Una labor sin ventilación o sostenimiento habilitado no puede programarse: Labor no habilitada.
- Cantidad plan mayor a cero.
- Guardia y cuadrilla deben existir en Roster.
- Fecha del programa no anterior a hoy (salvo reprogramación).
- No cerrar tarea sin cantidad real y causa si hay desvío mayor al umbral.
- Un disparo no puede programarse sin explosivos asignados.
- Tiempo de re-ingreso respetado: no ingresar antes de que termine.

## Catálogos semilla
- Causas de desvío: falta de equipo, ventilación, sostenimiento, falta de explosivos, mantenimiento, ausencia de personal (ejemplos).
- Tipos de tarea: perforación, carguío, disparo, limpieza, sostenimiento, relleno.
- Guardias: día, noche, 12 horas.
- Umbral de desvío para exigir causa.

## Entradas
- Plan mensual de Scheduler UG
- Avance real de Shift UG, Face y Ring
- Disponibilidad de equipos de Maintenance
- Cuadrillas de Roster

## Salidas
- Tareas a Shift UG
- Objetivos a Face y Ring
- Demanda de explosivos a Explosives UG
- Labores activas a Air Requirement
- Mezcla de corto plazo a Blend UG

## Integraciones entre módulos
- Recibe de: Grade Control UG (Operations), Scheduler UG (Planning), Backfill (Mine Services), Sim UG (Data), Conformance UG (Survey), Blend UG (Planning), Cave Planner (Planning)
- Entrega a: Shift UG (Operations), Face (Blasting), Ring (Blasting), Explosives UG (Blasting), Air Requirement (Ventilation)

## Integraciones externas y estándares
- Epiroc Deep Automation: entregar plan y turno y leer su estado; automatización de terceros, integrar, no construir.
- Archivos de Deswik por CSV y DXF.
- Mensajería: integrar.

## Plataforma
Web para oficina y tablet para guardia, con modo offline: las tareas se leen y marcan sin señal, y se sincronizan por cola de cambios; conflictos se resuelven por campo con registro del último cambio.

## Roles y permisos
- Planeador: armar y publicar programas
- Jefe de guardia: ver tareas, marcar y registrar causas
- Supervisor: marcar tareas de su área
- Jefe de mina: ver y aprobar
- Gerente: ver tablero

## Casos de prueba
- Plan 45 m y real 36 m: 80 %.
- Barreno 3,0 m y eficiencia 0,90: 2,7 m por disparo; con sección 18 m2 y 2,8 t/m3: 136 t.
- Labor sin ventilación: no se programa.
- Equipo en dos tareas a la misma hora: error.
- Tarea marcada sin señal: queda en cola y se sincroniza sin duplicarse.
- Pendiente de 9 m arrastrado: aparece sumado al siguiente día.

## Criterios de aceptación
- Programa semanal armado en menos de 30 minutos
- Cumplimiento diario calculado sin digitar
- Sin señal no se pierde ninguna marca de tarea
- Recalcular reprogramación de 100 tareas en menos de 5 segundos

## Notas para el desarrollador
- Si Shift no reporta, el cumplimiento queda vacío; no inventar.
- Los tiempos de ventilación después del disparo son parámetro por labor.
- La asignación sugerida es una heurística; el jefe puede cambiarla.
- La automatización de terceros tiene su propio plan: aquí solo se entrega y se lee estado.
- El tiraje de hundimiento aplica solo si la mina es por hundimiento; si no, se oculta.
- Los cambios sin señal deben marcarse con hora local del dispositivo.

## Referencias técnicas
Control de intervalos cortos (short interval control); Hartman y Mutmansky, Introductory Mining Engineering. Tiempos de re-ingreso: validar con el reglamento de seguridad minera vigente.

## Software de referencia
- Datamine Task Scheduler (Datamine)
- Pitram (Micromine)
- Deswik OPS (Deswik)
- Evolution Epoch (Maptek)
- XECUTE (RPMGlobal)
- XACT (RPMGlobal)
- MinePlan Planner (Hexagon)
- MinePlan Activity Scheduler (Hexagon)
- Amine (Datamine)
- DELMIA Operational Mine Planning & Scheduling (Dassault Systèmes)
- RPMGlobal (comprada en 2026) (Caterpillar)
- Cave Operations Scheduler (Dassault)
- DELMIA Operational Mine Planning & Scheduling (Dassault)
- EPS (Datamine)
- SIMS (Datamine)
- Work Manager (Epiroc)
- Deep Automation (Epiroc · integración)
- Look Ahead (Komatsu)
- ShiftManager (RPMGlobal)
- Deswik (ver mapa propio) (Sandvik)
- OptiMine Scheduler (Sandvik)

## Capacidades de la competencia que cubre
- Caterpillar · RPMGlobal (comprada en 2026): planeamiento, corto plazo, simulación de acarreo, turno y mantenimiento integrados
- Dassault · Cave Operations Scheduler: programa de hundimiento que equilibra corto y largo plazo
- Dassault · DELMIA Operational Mine Planning & Scheduling: programación operacional alineada a metas y restricciones
- Datamine · EPS: programación de producción de mediano y corto plazo
- Datamine · Datamine Task Scheduler: Gantt de programación para subterránea y tajo abierto
- Datamine · Amine: planificación de corto plazo con herramientas de perforación y voladura
- Datamine · SIMS: planificación y reporte de producción
- Deswik · Deswik OPS: planificación de corto plazo con ejecución del turno y seguimiento del cumplimiento del plan en una sola cadena
- Epiroc · Work Manager: planificación de corto plazo y gestión de tareas del turno con revisión del cumplimiento
- Epiroc · Deep Automation (integración): entregar plan y turno que la automatización ejecuta y leer su estado
- Hexagon · MinePlan Planner: control de mineral y programación de corto plazo con cortes, ruteo y reportes
- Hexagon · MinePlan Activity Scheduler: programación por actividades subterránea alimentada por los diseños
- Komatsu · Look Ahead: ejecución de plan de corto plazo con varios objetivos y reoptimización con lo real
- Maptek · Evolution Epoch: programación de corto plazo por equipos, tareas, cuadrillas y ubicaciones enlazada al modelo y diseño
- RPMGlobal · XECUTE: programación de turno con vista 3D y optimizador, que recibe el plan mayor y envía a operación
- RPMGlobal · XACT: programación realizable del turno actual y el siguiente
- RPMGlobal · ShiftManager: planificación y ejecución del turno con cada tarea medida, en línea y offline
- Sandvik · Deswik (ver mapa propio): diseño, programación y plan de corto plazo que dialogan con archivos de Deswik; NOVA para tajo abierto como referencia
- Sandvik · OptiMine Scheduler: programación gráfica de desarrollo, producción y mantenimiento con asignación de recursos y seguimiento de actividades
