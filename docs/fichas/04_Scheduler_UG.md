# Planning · Scheduler UG
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Alto · Ola 3
Módulo hermano: Scheduler OP (Planning)
## Qué resuelve
Programa de mediano y largo plazo con Gantt y recursos.

## Alcance
Módulo para minería subterránea (CODEa Scheduler UG). Su hermano es Scheduler OP (fases, palas, camiones y botaderos del tajo); esta ficha NO cubre planificación de tajo abierto.

## Contexto
El programa de mina responde: qué labores y tajeos se excavan, en qué orden, con qué equipos y cuánto mineral llega a planta cada mes. Se arma como un diagrama de Gantt: cada actividad tiene duración, dependencias y recursos. En subterránea hay cuellos de botella claros: los avances de desarrollo deben terminar antes de que un tajeo pueda producir y los jumbos y scoops son pocos. Hoy se hace en Deswik.Sched, EPS, MS Project o Excel. Este módulo toma las labores del diseño, calcula duraciones, nivela recursos y entrega el plan por periodo.

## Usuarios
Ingeniero de planeamiento de mediano y largo plazo (arma y corre el programa); ingeniero senior (aprueba escenarios); jefe de mina (revisa cumplimiento de metas); finanzas (usa tonelajes y metros para el presupuesto).

## Glosario
- Actividad: Trabajo con duración, como avanzar 120 m de galería o minar un tajeo.
- Dependencia fin-inicio: Una actividad no empieza hasta que termine la anterior; puede tener desfase (lag).
- Ruta crítica (CPM): Cadena de actividades que define el plazo total.
- Holgura: Tiempo que una actividad puede retrasarse sin retrasar el proyecto.
- Tasa de avance: Metros por día de una labor, o toneladas por día de un tajeo.
- Recurso: Equipo o cuadrilla con capacidad limitada, por ejemplo un jumbo.
- Nivelación: Reprogramar actividades para no pasar la capacidad de los recursos.
- Jumbo: Equipo de perforación de frentes de avance.
- Scoop (LHD): Cargador de bajo perfil que extrae el mineral.
- Destino: Hacia dónde va el material: planta, pila o botadero.
- Escenario: Variante del programa para comparar.
- Rampa de desarrollo: Labor que no produce mineral pero abre acceso.
- Ciclo de avance: Perforar, cargar, disparar, ventilar, limpiar y sostener.
- Pila de mineral: Acopio de mineral en superficie o en cámaras.

## Flujo de uso
1. Paso 1: se importan las labores y tajeos de Designer UG con sus volúmenes, metros y atributos.
2. Paso 2: el sistema crea las actividades enlazadas al diseño; si el diseño cambia, se actualizan duración y recursos.
3. Paso 3: se definen tasas por tipo de actividad, calendarios y turnos.
4. Paso 4: se cargan los recursos (jumbos, scoops, camiones, cuadrillas) con su capacidad y disponibilidad.
5. Paso 5: se arman las dependencias; el sistema propone las de desarrollo antes de producción.
6. Paso 6: se importa o modela el movimiento de material (acarreo, desmonte, relleno) como insumo del programa.
7. Paso 7: se calcula la ruta crítica y se nivelan los recursos.
8. Paso 8: se optimiza la secuencia con reglas de prioridad o por VAN.
9. Paso 9: se asignan destinos y mezclas por periodo y se enlaza con Blend UG.
10. Paso 10: se comparan escenarios, también con animación 3D.
11. Paso 11: se aprueba el escenario base y se publica.
12. Paso 12: se exporta el plan mensual a Short-Term Planner UG, el aire requerido a Air Requirement, NPV a NPV Analyzer, y presupuesto a Budget UG.

## Funcionalidades: Actividades y diseño
- [ ] Crear actividades desde labores y tajeos del diseño con enlace dinámico: al cambiar el diseño se actualizan duraciones y recursos
- [ ] Actividad manual y hitos
- [ ] Plantillas de actividades por método de minado y por producto (lógica predefinida sin scripts)
- [ ] Dependencias fin-inicio, inicio-inicio y fin-fin con desfase
- [ ] Calendarios y turnos con feriados y paradas

## Funcionalidades: Gantt y cálculo
- [ ] Gantt interactivo con zoom, arrastre y filtro por nivel
- [ ] Ruta crítica y holguras
- [ ] Tasas por tipo de actividad y ciclo de avance
- [ ] Duración por cantidad y tasa con factores de disponibilidad
- [ ] Importar y exportar a MS Project y Excel

## Funcionalidades: Recursos
- [ ] Recursos con capacidad (jumbos, scoops, camiones, cuadrillas)
- [ ] Nivelación con recursos finitos por prioridad
- [ ] Utilización por periodo con alertas de sobrecarga
- [ ] Cuellos de botella por recurso
- [ ] Motor de acarreo: mina a planta con camiones y scoops (importar de Sim) para ajustar tasas

## Funcionalidades: Movimiento de material
- [ ] Modelar movimiento de material, botaderos de desmonte, relleno y acarreo, incluidos camiones eléctricos, troles y fajas, como insumo del programa
- [ ] Capacidad de chancado y de izaje
- [ ] Reglas de destino por ley de corte
- [ ] Tiempos de viaje y de ciclo por ruta

## Funcionalidades: Optimización y escenarios
- [ ] Optimización automática de la secuencia con reglas de prioridad
- [ ] Secuencia óptima por VAN con valor del tiempo
- [ ] Programación mediano plazo con restricciones y metas de producción
- [ ] Escenarios con comparación animada en 3D
- [ ] Plan por periodo (mes, trimestre, año) y por escenario

## Funcionalidades: Mezclas y destinos
- [ ] Destinos y mezclas por periodo con enlace a Blend UG
- [ ] Tonelaje por destino y periodo
- [ ] Ley y finos por periodo
- [ ] Entrega del plan de alimentación a la planta

## Funcionalidades: Integraciones y reportes
- [ ] Cadena integrada de planeamiento, corto plazo, acarreo, turno y mantenimiento con módulos CODEa
- [ ] Reportes por periodo: metros, toneladas, ley, finos, recursos
- [ ] Exportar plan a simulaciones dinámicas de pilas y stockpiles (METSIM)
- [ ] Importar y exportar de Deswik y otros por CSV y DXF

## Pantallas
- Gantt del programa
- Árbol de actividades y diseño enlazado
- Calendarios y turnos
- Recursos y utilización
- Ruta crítica y holguras
- Movimiento de material y acarreo
- Animación 3D del plan
- Comparación de escenarios
- Destinos y mezclas
- Reportes por periodo
- Exportar a MS Project y Excel

## Lógica y cálculos
- Duración (días) = cantidad / (tasa x disponibilidad x utilización). Ejemplo: 120 m de galería a 4,5 m/día con disponibilidad 0,85 = 120 / 3,825 = 31,4 días.
- Avance por disparo (m) = longitud de barreno x eficiencia (por ejemplo 3,0 m x 0,90 = 2,7 m); tasa = avance por disparo x disparos por día.
- CPM: ES = máximo(EF de predecesoras + desfase); EF = ES + duración; en reversa LF = mínimo(LS de sucesoras - desfase); LS = LF - duración; holgura = LS - ES; ruta crítica = holgura 0.
- Nivelación: método de programación serial; se ordena por prioridad y holgura, y cada actividad se coloca en el primer día en que sus predecesoras terminaron y hay capacidad del recurso.
- Capacidad por recurso = unidades x horas disponibles x rendimiento; sobrecarga = demanda - capacidad.
- Tonelaje por destino y periodo = suma de tonelaje de actividades asignadas a ese destino y a ese periodo; actividades que cruzan el periodo se prorratean por días.
- Ley del periodo = suma(t x g) / suma(t). Finos = suma(t x g).
- Ciclo de camión = carga + viaje cargado + descarga + viaje vacío + esperas; viaje (min) = distancia (m) / velocidad (m/min).
- VAN del plan = suma(flujo_t / (1 + r)^t), con r tasa de descuento por periodo.
- Optimización por prioridad: regla de despacho (por mayor valor por día de recurso); mejora por intercambio de pares con revisión de precedencias.

## Modelo de datos
- Actividad: id, nombre, tipo (desarrollo, produccion, relleno, servicio), labor_id, cantidad, unidad, tasa, duracion_dias, inicio, fin, prioridad, destino_id, escenario_id
- Dependencia: id, predecesora, sucesora, tipo (FS, SS, FF), desfase_dias
- Recurso: id, nombre, tipo, capacidad, unidad, disponibilidad_pct, calendario_id
- AsignacionRecurso: actividad_id, recurso_id, unidades, horas
- Calendario: id, nombre, turnos, feriados, horas_por_dia
- Escenario: id, nombre, base_id, estado, van_usd
- ResultadoPeriodo: escenario_id, periodo, metros, toneladas, ley, finos, destino_id, utilizacion_pct
- MovimientoMaterial: id, origen, destino, ruta, tiempo_ciclo_min, capacidad_t_dia, medio (camion, trole, faja)
- PlantillaActividad: id, metodo, producto, reglas_json
- Destino: id, nombre, tipo, capacidad_t_dia

## Validaciones
- No se permiten ciclos en las dependencias: Ciclo detectado entre A y B.
- Una actividad necesita cantidad y tasa mayores a cero.
- La disponibilidad entre 0 y 100 %.
- Un recurso no puede estar sobreasignado sin aviso en el reporte de nivelación.
- Fecha de inicio no anterior a la del proyecto.
- El destino debe tener capacidad definida.
- Si el diseño enlazado cambia, el sistema marca las actividades afectadas para recalcular.
- Un escenario aprobado no se edita sin crear una copia.

## Catálogos semilla
- Tipos de actividad: avance de galería, avance de rampa, chimenea, producción de tajeo, relleno, sostenimiento, ventilación.
- Tasas típicas por tipo de roca como ejemplo.
- Recursos: jumbo, scoop, camión de bajo perfil, perforadora de taladros largos, cuadrilla de sostenimiento.
- Calendarios: 14 x 7, 12 horas, parada anual (ejemplos).

## Entradas
- Labores y tajeos de Designer UG
- Formas de Stope Optimizer vía Designer UG
- Datos de acarreo de Sim
- Reglas de mezcla de Blend UG

## Salidas
- Plan mensual a Short-Term Planner UG
- VAN y flujos a NPV Analyzer
- Demanda a Air Requirement
- Plan de mezcla a Blend UG
- Plan de hundimiento a Cave Planner
- Presupuesto a Budget UG
- CSV, Excel y MS Project

## Integraciones entre módulos
- Recibe de: Resource UG (Geology), Designer UG (Planning), Sim UG (Data), Reserves UG (Planning), Blend UG (Planning), Cave Planner (Planning), Data Vault (Data)
- Entrega a: Short-Term Planner UG (Planning), NPV Analyzer (Economics), Air Requirement (Ventilation), Blend UG (Planning), Cave Planner (Planning), Budget UG (Economics)

## Integraciones externas y estándares
- MS Project y Excel: importar y exportar.
- Deswik y otros por CSV y DXF.
- METSIM (simulación dinámica de pilas): exportar el plan; integrar, no construir.
- Caterpillar RPMGlobal: referencia de la cadena integrada; CODEa cubre la cadena con sus propios módulos.

## Plataforma
Aplicación web con Gantt y motor de cálculo en servidor; trabajo de oficina con conexión.

## Roles y permisos
- Ingeniero de planeamiento: crear y editar programas
- Ingeniero senior: aprobar escenarios
- Jefe de mina: ver y comentar
- Finanzas: ver y exportar resultados

## Casos de prueba
- Galería de 120 m a 4,5 m/día con disponibilidad 0,85: 31,4 días.
- Red de 4 actividades A(5), B(3) después de A, C(4) después de A, D(2) después de B y C: ruta A-C-D de 11 días; holgura de B = 1.
- Dos actividades con un mismo jumbo en el mismo día: la nivelación mueve la de menor prioridad.
- Plan de 200 actividades con recursos nivelados y reporte mensual correcto.
- Cambio de diseño que alarga una galería 20 m: duración sube y se marca.
- Tonelaje por destino suma igual que el total del periodo.
- Dependencia circular A-B-A: se rechaza.

## Criterios de aceptación
- Plan de 200 actividades con recursos nivelados y reporte mensual correcto
- Recalcular un plan de 2 000 actividades en menos de 10 segundos
- Ruta crítica coincide con la de MS Project en un caso de prueba
- El cambio de diseño actualiza duraciones sin reingreso manual

## Notas para el desarrollador
- Usar días reales con calendario; no sumar semanas de 7 días con calendarios de 14 x 7 sin traducirlos.
- La nivelación con recursos finitos es difícil: la heurística es válida, no necesariamente óptima.
- El enlace con el diseño debe ser por id de objeto, no por nombre.
- Los troles y fajas se modelan como medios con capacidad propia, no como camiones.
- No construir un simulador de eventos discretos: importar de Sim.
- La mezcla en el programa se resuelve con Blend UG; no duplicar la optimización.

## Referencias técnicas
CPM y programación con recursos limitados (Project Management Institute); Hustrulid y Bullock, Underground Mining Methods; Hartman y Mutmansky, Introductory Mining Engineering.

## Software de referencia
- Deswik.Sched (Deswik)
- EPS (Datamine)
- MS Project (Microsoft)
- GEOVIA MineSched (Dassault Systèmes)
- Evolution Origin (Maptek)
- MinePlan Schedule Optimizer (Hexagon)
- MinePlan Activity Scheduler (Hexagon)
- XPAC Solutions (RPMGlobal)
- RPM MinePlanner (RPMGlobal)
- Micromine Alastri (Micromine)
- Minemax (Datamine)
- RPMGlobal (comprada en 2026) (Caterpillar)
- GEOVIA MineSched (Dassault)
- Datamine Task Scheduler (Datamine)
- Deswik Planning (Sched + IS) (Deswik)
- Deswik LHS (Deswik)
- Módulo de simulación dinámica (METSIM · integración)
- Micromine Beyond (Micromine)
- Micromine Advance (Micromine)
- Deswik (ver mapa propio) (Sandvik)

## Capacidades de la competencia que cubre
- Caterpillar · RPMGlobal (comprada en 2026): planeamiento, corto plazo, simulación de acarreo, turno y mantenimiento integrados
- Dassault · GEOVIA MineSched: secuencias, recursos, mezclas y destinos para UG y OP
- Datamine · Minemax: programación y optimización estratégica de la mina con VAN
- Datamine · EPS: programación de producción de mediano y corto plazo
- Datamine · Datamine Task Scheduler: Gantt de programación para subterránea y tajo abierto
- Deswik · Deswik Planning (Sched + IS): programación Gantt enlazada dinámicamente a los diseños, de modo que al cambiar un diseño se actualicen duraciones y recursos
- Deswik · Deswik LHS: modelar movimiento de material, botaderos y acarreo, incluidos camiones eléctricos, troles y fajas, como insumo del programa
- Hexagon · MinePlan Schedule Optimizer: programación óptima de mediano plazo con palas, rutas y destinos de material
- Hexagon · MinePlan Activity Scheduler: programación por actividades subterránea alimentada por los diseños
- Maptek · Evolution Origin: programación detallada desde vida de mina a corto plazo con acarreo, botaderos y mezclas
- METSIM · Módulo de simulación dinámica (integración): alimentar simulaciones dinámicas de pilas y stockpiles con el plan de mina
- Micromine · Micromine Beyond: diseño, optimización de pit y programación estratégica sobre una sola base de datos compartida
- Micromine · Micromine Advance: planificación integrada de minas subterráneas metálicas: diseño de labores y programa de producción
- RPMGlobal · XPAC Solutions: programación de mediano y largo plazo con soluciones por commodity y método de minado
- RPMGlobal · RPM MinePlanner: programación sin scripts con lógica predefinida por commodity y método de minado
- Sandvik · Deswik (ver mapa propio): diseño, programación y plan de corto plazo que dialogan con archivos de Deswik; NOVA para tajo abierto como referencia
