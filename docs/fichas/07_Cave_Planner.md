# Planning · Cave Planner
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Muy alto · Ola 4
## Qué resuelve
Minería por hundimiento: huella, tiraje por punto de extracción y programa. Solo bajo demanda (nicho).

## Alcance
Módulo solo para minería subterránea por hundimiento (CODEa Cave Planner), sin hermano en tajo abierto. No cubre simulación de flujo de material (se integra) ni minería por tajeos con relleno.

## Contexto
En minería por hundimiento (block caving o sublevel caving) se socava la base de un bloque de roca para que se rompa y caiga solo; el mineral se extrae por puntos de extracción bajo el bloque. El reto es sacar el mineral de forma pareja para que no entre estéril antes de tiempo. Hoy se usa software especializado (PCBC, PCSLC, CaveLogic, Deswik Caving) o Excel. Este módulo define la huella, calcula el tonelaje y ley de cada punto, programa el tiraje y compara el real. Es un nicho: se construye solo si el cliente lo pide.

## Usuarios
Ingeniero de planeamiento de minas por hundimiento (programa el tiraje); geomecánico (aporta límites de tasa y hundibilidad); supervisor de tiraje (ejecuta y reporta); jefe de mina. Solo se construye bajo demanda de un cliente.

## Glosario
- Hundimiento (caving): Método en que el mineral cae por gravedad al socavar su base.
- Block caving: Hundimiento de un bloque grande.
- Sublevel caving: Hundimiento por subniveles.
- Huella (footprint): Área en planta que se socava y explota.
- Nivel de producción: Nivel donde están los puntos de extracción.
- Punto de extracción: Boca por donde se retira el mineral con scoop.
- Columna de tiraje: Roca sobre un punto que sale por él.
- Tiraje: Extracción del mineral.
- Altura económica de columna: Altura hasta donde el valor de la columna es positivo.
- Dilución: Estéril que entra con el mineral.
- Punto de entrada de dilución: Porcentaje de columna extraída a partir del cual entra estéril.
- Hundibilidad: Facilidad con que la roca se rompe.
- Radio hidráulico: Área / perímetro de la huella.
- Tiraje uniforme: Extracción pareja entre puntos vecinos.

## Flujo de uso
1. Paso 1: se importan el modelo de bloques y el diseño de huella y nivel de producción.
2. Paso 2: se define la malla de puntos de extracción.
3. Paso 3: se calculan las columnas de mineral sobre cada punto.
4. Paso 4: se evalúan distintas huellas y niveles para elegir la de mayor valor.
5. Paso 5: se fijan la tasa máxima de tiraje y el punto de entrada de dilución por punto.
6. Paso 6: opcional, se importan resultados de simulación de flujo (MassFlow).
7. Paso 7: se programa el inicio de tiraje de cada punto y el tiraje por periodo.
8. Paso 8: se calcula tonelaje, ley y dilución por punto, sector y periodo.
9. Paso 9: se envía el programa a Scheduler UG y Short-Term Planner UG.
10. Paso 10: cada turno se carga el tiraje real desde Shift y se compara.
11. Paso 11: se reconcilia la ley real contra la predicha por punto.
12. Paso 12: se reprograma con lo real.

## Funcionalidades: Huella y puntos
- [ ] Selección de huella y nivel óptimo para minas por hundimiento por valor de columnas
- [ ] Huella (footprint) y malla de puntos de extracción por nivel de producción
- [ ] Radio hidráulico de la huella y comprobación contra hundibilidad
- [ ] Diseño de huella y planificación de minería por hundimiento

## Funcionalidades: Columnas y valor
- [ ] Columna de mineral sobre cada punto desde el modelo de bloques
- [ ] Tonelaje y ley de cabeza por punto
- [ ] Flujo de mineral en el tiraje por punto de extracción para block caving y sublevel caving
- [ ] Altura económica de columna

## Funcionalidades: Programa de tiraje
- [ ] Plan de tiraje por punto y periodo con tasa máxima
- [ ] Control de tiraje uniforme entre vecinos
- [ ] Programa de apertura de puntos y secuencia de hundimiento
- [ ] Programación de producción con restricciones de extracción
- [ ] Programa que equilibra corto y largo plazo

## Funcionalidades: Dilución
- [ ] Entrada de dilución por punto con punto de entrada configurable
- [ ] Reconciliación de ley real contra predicha por punto
- [ ] Importar resultados de simulación de flujo de tiraje (MassFlow) como referencia

## Funcionalidades: Control diario
- [ ] Control diario de tiraje por punto y turno
- [ ] Comparación del tiraje real (Shift) con el plan
- [ ] Alertas por punto fuera de rango

## Funcionalidades: Reportes
- [ ] Reporte por periodo de tonelaje, ley y dilución por sector
- [ ] Entrega a Scheduler UG y Short-Term Planner UG
- [ ] Mapas de calor de tiraje y ley

## Pantallas
- Huella y malla de puntos
- Columnas de mineral por punto
- Selección de huella y nivel
- Plan de tiraje por punto
- Control diario por turno
- Dilución y reconciliación
- Mapa de calor del nivel de producción
- Reporte por sector
- Importar simulación de flujo

## Lógica y cálculos
- Tonelaje de columna = suma de bloques de la columna x densidad x fracción de extracción.
- Ley de cabeza del punto = suma(t_i g_i) / suma(t_i) sobre lo extraído.
- Radio hidráulico = área de la huella (m2) / perímetro (m); ejemplo 200 m x 200 m: 40 000 / 800 = 50 m. Debe superar el mínimo del geomecánico (validar).
- Altura económica de columna: se suman los valores de bloque desde la base hacia arriba; la altura es el punto de máximo valor acumulado.
- Valor de columna = suma(valor de bloque) - costos de desarrollo del punto; la huella óptima maximiza la suma sobre sus puntos.
- Tasa de tiraje = toneladas extraídas / día por punto <= límite del geomecánico (validar).
- Dilución: se activa cuando la altura extraída acumulada de la columna supera el punto de entrada de dilución configurado; después, la fracción de estéril se toma de una tabla (de la simulación de flujo) o de un modelo lineal por tramos.
- Tiraje uniforme: extraer primero de los puntos con menor altura extraída relativa a su vecindad; diferencia máxima con vecinos <= parámetro.
- Ejemplo: columna de 60 m x 15 m x 15 m a 2,7 t/m3 = 36 450 t; si el punto de entrada de dilución es 70 %, entra estéril después de 25 515 t.
- Reconciliación: error de ley = ley real - ley predicha por punto; error medio y desviación por sector.

## Modelo de datos
- Huella: id, nivel_id, poligono, area_m2, radio_hidraulico_m, estado
- PuntoExtraccion: id, x, y, z, huella_id, estado, fecha_apertura
- Columna: punto_id, altura_m, tonelaje_t, ley, valor_usd
- PlanTiraje: punto_id, periodo, toneladas_t
- TirajeReal: punto_id, fecha, guardia_id, toneladas_t
- ParametrosDilucion: id, punto_entrada_pct, tabla_dilucion (porcentaje extraído, porcentaje de estéril)
- LimiteTasa: dominio, tasa_max_t_dia
- ReconciliacionLey: punto_id, periodo, ley_predicha, ley_real, error
- ResultadoFlujo: id, fuente (MassFlow), punto_id, curva

## Validaciones
- Tasa de tiraje planificada no puede exceder el límite del geomecánico: Tasa excede el límite en punto X.
- Radio hidráulico menor al mínimo: la huella se marca como no hundible.
- Punto sin columna (sin mineral) se marca inactivo.
- Punto de entrada de dilución entre 0 y 100 %.
- Diferencia entre vecinos mayor al parámetro: alerta de tiraje no uniforme.
- Tiraje real no puede superar la columna del punto.
- El tonelaje de plan mensual igual a la suma de puntos.
- Los límites de tasa y hundibilidad se cargan por dominio y se validan con el estudio geotécnico.

## Catálogos semilla
- Métodos: block caving, panel caving, sublevel caving.
- Estados del punto: sin abrir, abierto, en tiraje, agotado, cerrado.
- Tabla de dilución por tipo de roca.
- Límites de tasa por dominio geomecánico (valores del cliente).

## Entradas
- Modelo de bloques de Resource
- Diseño de Designer UG
- Tiraje real de Shift UG
- Resultados de simulación de flujo (MassFlow)

## Salidas
- Programa de tiraje a Scheduler UG
- Plan diario a Short-Term Planner UG
- Reportes de dilución

## Integraciones entre módulos
- Recibe de: Scheduler UG (Planning)
- Entrega a: Scheduler UG (Planning), Short-Term Planner UG (Planning)

## Integraciones externas y estándares
- Itasca MassFlow: importar resultados de simulación de flujo de tiraje; integrar, no construir el simulador.
- PCBC, PCSLC, CaveLogic, Deswik Caving: se toma su alcance como referencia; importar sus tablas por CSV.
- CSV y DXF para huellas y puntos.

## Plataforma
Web con motor de cálculo en Python y tablet offline para control de tiraje; solo bajo demanda.

## Roles y permisos
- Planeador de hundimiento: crear huella y programa
- Geomecánico: editar límites de tasa y hundibilidad
- Supervisor de tiraje: registrar tiraje
- Jefe de mina: ver y aprobar

## Casos de prueba
- Columna 60 x 15 x 15 m a 2,7 t/m3: 36 450 t y entrada de dilución a 25 515 t con 70 %.
- Huella de 200 x 200 m: radio hidráulico 50 m.
- Plan de 100 puntos con tonelaje y ley de cabeza iguales (+-2 %) a una hoja de control.
- Punto con tasa mayor al límite: se marca.
- Tiraje real mayor que la columna: error.
- Dos vecinos con diferencia de altura mayor al parámetro: alerta.

## Criterios de aceptación
- Plan de tiraje de 100 puntos con tonelaje y ley de cabeza iguales (+-2 %) a una hoja de control
- Reconciliación por punto con error medio calculado
- Control diario sin pérdida de datos con tablet offline

## Notas para el desarrollador
- Es un nicho: construir solo con pedido de un cliente.
- No intentar simular el flujo gravitacional: integrar un simulador.
- La dilución real depende de la roca y del patrón de tiraje; los parámetros los pone el geomecánico.
- Los límites de tasa y el radio hidráulico mínimo son del estudio geotécnico: validar antes de usarlos.
- El orden de apertura de puntos cambia el resultado: mantener la secuencia como dato.

## Referencias técnicas
Laubscher, Cave Mining Handbook; Brown, Block Caving Geomechanics; métodos de hundimiento por bloques y por subniveles.

## Software de referencia
- Cave Scheduler (rol Surpac) (Dassault Systèmes)
- Cave Operations Scheduler (Dassault Systèmes)
- Cave Management System (rol Surpac) (Dassault Systèmes)
- GEOVIA PCBC (Dassault)
- GEOVIA PCSLC (Dassault)
- Footprint Finder (Dassault)
- Cave Scheduler (rol Surpac) (Dassault)
- Cave Operations Scheduler (Dassault)
- Cave Management System (rol Surpac) (Dassault)
- Deswik Caving (Deswik)
- MassFlow (Itasca · integración)
- CaveLogic (Maptek)

## Capacidades de la competencia que cubre
- Dassault · GEOVIA PCBC: planificación de block caving con flujo de mineral en el tiraje por punto de extracción
- Dassault · GEOVIA PCSLC: simulación de tiraje en sublevel caving
- Dassault · Footprint Finder: selección de huella y nivel óptimo para minas por hundimiento
- Dassault · Cave Scheduler (rol Surpac): programación de producción de hundimiento con restricciones de extracción
- Dassault · Cave Operations Scheduler: programa de hundimiento que equilibra corto y largo plazo
- Dassault · Cave Management System (rol Surpac): control diario de tiraje por punto de extracción y turno
- Deswik · Deswik Caving: planificación de minería por hundimiento: huella, puntos de extracción y programa de tiraje
- Itasca · MassFlow (integración): importar resultados de simulación de flujo de tiraje por punto de extracción como referencia del programa de tiraje
- Maptek · CaveLogic: diseño de huella y planificación de minería por hundimiento
