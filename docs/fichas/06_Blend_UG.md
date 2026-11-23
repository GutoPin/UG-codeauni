# Planning · Blend UG
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Alto · Ola 4
Módulo hermano: Blend OP (Planning)
## Qué resuelve
Optimización de mezclas y alimentación a planta: ley, dureza y contaminantes por periodo.

## Alcance
Solo minería subterránea: mezcla entre tajeos, frentes de avance y acopios de interior, con pocas fuentes activas y transporte limitado por pique o rampa. El hermano para tajo abierto es Blend OP (PLA2O). Esta ficha NO cubre bancos, palas, fases ni chancado primario de tajo.

## Contexto
La planta pide una alimentación estable: ley, dureza y contaminantes dentro de rangos. En una mina subterránea de vetas la alimentación sale de pocos tajeos y frentes a la vez; cada uno con ley muy variable y tonelaje pequeño por guardia. Si un tajeo de ley alta se termina o una chimenea de traspaso se llena, el plan se cae. Hoy se arma la mezcla en Excel con solver, a mano cada semana. Este módulo decide cuánto sacar de cada tajeo y frente en cada periodo para cumplir los límites de la planta, respetando capacidades de tolva, de pique o rampa y de los camiones de bajo perfil, y entrega el plan de alimentación a Scheduler UG y a la planificación de la planta.

## Usuarios
Planeador de mezcla subterránea (arma el plan de alimentación por periodo); planeador de corto plazo (ajusta la mezcla por guardia con los frentes disponibles); jefe de planta (fija límites de ley, dureza y contaminantes); despacho de mina (mueve mineral por rampa o pique); jefe de operaciones (aprueba el plan).

## Glosario
- Mezcla (blend): Combinación de mineral de varias fuentes para que el total cumpla ley, dureza y contaminantes.
- Fuente: Origen del mineral: un tajeo, un frente de avance o un acopio subterráneo.
- Alimentación a planta: Tonelaje por periodo y calidad que entra al chancado o molino.
- Chimenea de traspaso (ore pass): Chimenea por donde el mineral cae de un nivel a otro; tiene capacidad limitada y puede atorarse.
- Pique: Labor vertical equipada con izaje para subir mineral a superficie; tiene capacidad de t/h.
- Tolva: Depósito que amortigua el flujo; las hay de nivel y de superficie.
- Camión de bajo perfil: Camión diseñado para galerías de poca altura; mueve poco volumen por viaje.
- Contaminante: Elemento indeseado (arsénico, antimonio, mercurio, plomo, según el mineral) con límite en planta o en el contrato.
- Dureza: Resistencia del mineral a la molienda, medida por índice de trabajo (kWh/t); afecta el rendimiento del molino.
- Ley equivalente: Ley que suma varios metales de la veta en una sola cifra.
- Frente: Punto de avance de una galería, donde se perfora y vuela; produce mineral o desmonte de desarrollo.
- Acopio de interior: Pila de mineral temporal bajo tierra o en la boca de mina.
- Restricción: Límite que el plan no debe romper: capacidad, ley mínima o máxima, contaminante.
- Plan de alimentación: Tabla por periodo con tonelaje y calidad de lo que recibirá la planta.

## Flujo de uso
1. Paso 1: el planeador elige el horizonte (mes, semana o guardia) y la versión de reservas de Reserves UG.
2. Paso 2: el módulo toma las fuentes disponibles: tajeos con mineral listo, frentes de avance y acopios de interior desde Stockpiles UG.
3. Paso 3: el jefe de planta carga los límites: ley mínima y máxima, dureza, contaminantes y tonelaje de planta.
4. Paso 4: el despacho de mina carga la capacidad de los medios: t/h del pique, capacidad de chimeneas de traspaso, tolvas y número de camiones de bajo perfil.
5. Paso 5: se define el objetivo: maximizar metal, minimizar desvío de ley o minimizar costo de transporte.
6. Paso 6: el solver propone toneladas por fuente y periodo.
7. Paso 7: el planeador revisa tajeos con baja disponibilidad (relleno, ventilación, sostenimiento pendientes) y ajusta.
8. Paso 8: se revisan los periodos donde alguna restricción quedó al límite y se prueban alternativas.
9. Paso 9: se asignan destinos: planta, acopio de interior, desmonte, relleno.
10. Paso 10: el jefe de operaciones aprueba; el plan pasa a Scheduler UG y a Short-Term Planner UG.
11. Paso 11: se exporta el plan de alimentación por periodo a la planificación de producción de planta.
12. Paso 12: cada guardia se compara lo entregado con lo planificado (Grade Control) y se reajusta la mezcla del turno siguiente.

## Funcionalidades: Modelo de mezcla subterránea
- [ ] Fuentes: tajeos, frentes de avance y acopios de interior con tonelaje disponible y ley por periodo
- [ ] Restricciones de planta: ley mínima y máxima, dureza, contaminantes y tonelaje de alimentación (GEOVIA MineSched: secuencias, recursos, mezclas y destinos para UG)
- [ ] Restricciones de transporte: capacidad del pique, de chimeneas de traspaso, de tolvas y de camiones de bajo perfil
- [ ] Disponibilidad por tajeo según relleno, ventilación y sostenimiento
- [ ] Reglas de campo: no mezclar dos tajeos de contaminante alto en la misma guardia
- [ ] Objetivos configurables: metal, desvío de ley, costo

## Funcionalidades: Optimización de mezclas y flujo
- [ ] Optimizar la mezcla y el flujo de material por la red de labores, pique, tolvas y planta (Deswik Blend)
- [ ] Resolver con solver estándar para varios periodos a la vez
- [ ] Mostrar qué restricción limita el resultado y su costo sombra
- [ ] Comparar escenarios de mezcla (sin un tajeo, con un acopio adicional)

## Funcionalidades: Cadena de mina a mercado
- [ ] Seguir tonelaje y ley desde el tajeo hasta el despacho de concentrado o venta, con acopios en cada etapa (Deswik BOLT: cadena de mina a mercado)
- [ ] Cumplimiento de calidad contractual de la venta: ley mínima y contaminantes con penalidad
- [ ] Programa de despachos por periodo con stock entre mina, planta y puerto, de alcance básico por mezclas y despachos

## Funcionalidades: Plan de alimentación y destinos
- [ ] Plan de alimentación por periodo con tonelaje, ley, dureza y contaminantes
- [ ] Destinos por fuente: planta, acopio de interior, desmonte, relleno
- [ ] Exportar el plan a Metso Digital Production Management (antes Geminex) como entrada a la planificación de planta
- [ ] Plan del turno para el despacho con orden de tajeos y frentes

## Funcionalidades: Ajuste y seguimiento
- [ ] Re-optimizar por guardia con lo realmente extraído y el estado de chimeneas y tolvas
- [ ] Comparar mezcla real y planificada por periodo
- [ ] Alertas cuando un tajeo se agota o una chimenea de traspaso llega a su límite

## Funcionalidades: Trabajo sin señal
- [ ] Ver el plan del turno y registrar fuentes agotadas desde tablet bajo tierra, con cola de cambios
- [ ] Al volver la señal la re-optimización toma lo registrado; si dos usuarios cambian la misma fuente, prevalece el último y se avisa

## Pantallas
- Fuentes del periodo: tajeos, frentes y acopios con tonelaje y ley
- Límites de planta: ley, dureza, contaminantes y capacidad
- Capacidad de transporte: pique, chimeneas de traspaso, tolvas y camiones de bajo perfil
- Resultado de mezcla: toneladas por fuente y periodo con ley resultante
- Restricciones activas: cuáles limitan el plan y cuánto valen
- Escenarios: comparación entre mezclas alternativas
- Cadena mina a mercado: stock y despacho por periodo
- Plan de alimentación: tabla a exportar a planta
- Plan del turno en tablet sin señal: fuentes, orden y registro de agotadas

## Lógica y cálculos
- Ley de mezcla (g/t) = suma(toneladas_i x ley_i) / suma(toneladas_i) sobre los tajeos y frentes i del periodo. Ejemplo: 400 t a 9,0 g/t y 600 t a 5,0 g/t: (3 600 + 3 000) / 1 000 = 6,6 g/t.
- Contaminante de mezcla (ppm o %) = suma(t_i x c_i) / suma(t_i). Ejemplo: 500 t a 0,8 % As y 500 t a 0,2 % As: 0,5 % As, y el límite de planta de 0,6 % se cumple.
- Dureza de mezcla (kWh/t) = suma(t_i x W_i) / suma(t_i), con índice de trabajo W_i por fuente. Ejemplo: 600 t a 14 y 400 t a 17: 15,2 kWh/t.
- Restricción de tonelaje: suma(t_i) del periodo <= capacidad de planta (t/periodo). Ejemplo: 1 500 t/día.
- Capacidad de pique en el turno (t) = t/h nominales x horas efectivas x disponibilidad. Ejemplo: 90 t/h x 6 h x 0,85 = 459 t.
- Camiones de bajo perfil necesarios = toneladas a mover / (capacidad por viaje (t) x viajes por turno). Ejemplo: 460 t / (12 t x 10 viajes) = 3,8, es decir 4 camiones.
- Chimenea de traspaso: nivel_final (t) = nivel_inicial + ingreso - extracción, con 0 <= nivel_final <= capacidad. Si supera la capacidad, el solver reduce ingreso desde ese nivel.
- Modelo de optimización: variable t_(i,p) = toneladas de la fuente i en el periodo p; maximizar suma(t_(i,p) x ley_i x recuperación x precio) - costo de transporte, sujeto a las restricciones de ley, dureza, contaminante, capacidad y t_(i,p) <= disponible_(i,p).
- Penalidad contractual por contaminante (US$/t) = (contenido - límite) x tarifa por unidad, solo si contenido > límite; los valores de tarifa son datos del contrato.
- Cumplimiento de mezcla (%) = periodos que cumplen todos los límites / periodos evaluados x 100.
- Desvío de ley (%) = (ley real alimentada - ley planificada) / ley planificada x 100.

## Modelo de datos
- FuenteMezcla: id, tipo (tajeo, frente, acopio), nivel, nombre, ley_g_t, dureza_kWh_t, contaminantes (json), disponible_t, periodo
- LímitePlanta: id, periodo, ley_min, ley_max, dureza_max_kWh_t, contaminante, límite, capacidad_t_periodo
- CapacidadTransporte: id, tipo (pique, chimenea de traspaso, tolva, camión bajo perfil), nombre, capacidad_t, t_h, disponibilidad_%
- PlanMezcla: id, versión_id, periodo, fuente_id, toneladas_t, destino, ley_resultante
- VersiónMezcla: id, nombre, horizonte (mes, semana, guardia), reservas_versión, estado (borrador, aprobada), aprobada_por
- RestricciónActiva: plan_id, restricción, valor, holgura, costo_sombra
- Escenario: id, plan_id, nombre, cambios (json), valor_objetivo
- DespachoMercado: id, periodo, producto, toneladas_t, ley, contaminantes, penalidad_us
- AlimentaciónReal: periodo, guardia_id, toneladas_t, ley_real, dureza_real, contaminantes_reales
- NivelTraspaso: chimenea_id, fecha_hora, nivel_t, capacidad_t

## Validaciones
- Las toneladas por fuente y periodo no pueden superar el disponible; "Supera el disponible del tajeo".
- Ley mínima no puede ser mayor que la máxima; "Límites de ley incoherentes".
- Toda fuente debe tener nivel y ley; si falta, no entra al solver.
- La capacidad del pique y de las chimeneas debe ser mayor que 0 t.
- No se aprueba un plan con restricción violada sin una justificación escrita.
- No se editan toneladas de un periodo ya cerrado; se crea una versión nueva.
- El nivel de una chimenea de traspaso no puede ser negativo ni superar su capacidad.
- Un tajeo sin relleno, ventilación o sostenimiento aprobado queda no disponible hasta cambiarlo.

## Catálogos semilla
- Tipos de fuente: tajeo, frente de avance, acopio de interior (ejemplos)
- Medios de transporte: pique, rampa con camión de bajo perfil, chimenea de traspaso, tolva
- Contaminantes: arsénico, antimonio, mercurio, plomo, zinc (ejemplos; los límites los fija la planta o el contrato)
- Objetivos: maximizar metal, minimizar desvío de ley, minimizar costo de transporte

## Entradas
- Acopios desde LOG1U Stockpiles UG
- Leyes de Grade Control
- Reservas de PLA1U Reserves UG
- Parámetros de planta de PRO3 Mine-to-Mill
- Ensayos de LAB2 Met Tests

## Salidas
- Plan de mezcla a C3U Scheduler UG
- Mezcla por guardia a C4U Short-Term Planner UG
- Leyes planificadas a PRO3 Mine-to-Mill
- Plan de alimentación a LOG1U Stockpiles UG

## Integraciones entre módulos
- Recibe de: Scheduler UG (Planning), Stockpiles UG (Logistics), Mine-to-Mill (Process)
- Entrega a: Scheduler UG (Planning), Short-Term Planner UG (Planning), Mine-to-Mill (Process), Stockpiles UG (Logistics)

## Integraciones externas y estándares
- Metso Digital Production Management (antes Geminex): exportar el plan de alimentación por periodo; DPM planifica la planta y CODEa entrega el mineral planificado desde la mina subterránea.
- Solver estándar (HiGHS, OR-Tools, scipy): integrar, no construir.
- Tarifas y penalidades de contratos de venta: se cargan como datos; validar con el contrato vigente.
- Sensores de nivel de tolva o de pesaje: solo se importan sus lecturas.

## Plataforma
Web con solver en servidor para plan mensual y semanal; tablet sin conexión para el plan del turno y registro de fuentes agotadas, con cola de sincronización.

## Roles y permisos
- Planeador de mezcla: correr y comparar escenarios
- Planeador de corto plazo: ajustar el plan de la guardia
- Jefe de planta: definir límites de planta
- Despacho de mina: registrar capacidad y estado de pique, chimeneas y camiones
- Jefe de operaciones: aprobar

## Casos de prueba
- 400 t a 9,0 g/t y 600 t a 5,0 g/t: ley de mezcla 6,6 g/t.
- 500 t a 0,8 % As y 500 t a 0,2 % As: 0,5 %; con límite 0,6 % cumple, con límite 0,4 % se rechaza.
- Pique de 90 t/h, 6 h y disponibilidad 0,85: 459 t por turno; plan de 600 t reduce a 459 t.
- 460 t por turno con camiones de 12 t y 10 viajes: se piden 4 camiones.
- Chimenea con capacidad 800 t, nivel 700 t e ingreso de 300 t sin extracción: ingreso limitado a 100 t.
- Tajeo de 9,0 g/t marcado agotado sin señal: al sincronizar, la mezcla se recalcula sin esa fuente.
- Plan exportado a Metso DPM con 31 periodos diarios: 31 filas con tonelaje, ley, dureza y contaminantes.

## Criterios de aceptación
- El plan semanal de 20 fuentes se resuelve en menos de 60 segundos.
- Ningún plan aprobado viola un límite sin justificación.
- El plan exportado coincide con el plan aprobado en tonelaje y ley.
- Sin señal no se pierde ningún registro de fuente agotada.

## Notas para el desarrollador
- Pocas fuentes y poco tonelaje por guardia: la ley puede variar mucho de turno a turno; planear con rango, no con un solo número.
- La chimenea de traspaso es un tanque con capacidad: modelarla con nivel, no como un camino ilimitado.
- El pique y la tolva limitan por hora; no solo por día.
- Cuidar el mineral de desarrollo: sale de los frentes de avance y también cuenta como fuente.
- Un tajeo con ley alta pero sin acceso o relleno no es una fuente utilizable.
- BOLT es nicho de grandes exportadoras: implementar solo cadena básica de mezclas y despachos.
- No codificar penalidades ni límites de memoria: son datos de contrato y de planta.

## Referencias técnicas
Programación lineal para mezclas; planeamiento de producción subterránea con vetas; control de contaminantes en concentrados según contrato (validar con el contrato vigente).

## Software de referencia
- Evolution Origin (Maptek)
- GEOVIA MineSched (Dassault Systèmes)
- MinePlan Schedule Optimizer (Hexagon)
- GEOVIA MineSched (Dassault)
- Deswik Blend (Deswik)
- Deswik BOLT (Deswik)
- Metso Digital Production Management (antes Geminex) (Metso · integración)

## Capacidades de la competencia que cubre
- Dassault · GEOVIA MineSched: secuencias, recursos, mezclas y destinos para UG y OP
- Deswik · Deswik Blend: optimizar mezclas y flujo de material por la red de mina y proceso hacia la planta
- Deswik · Deswik BOLT: optimizar la cadena de mina a mercado: producción, proceso, stocks, logística y venta
- Metso · Metso Digital Production Management (antes Geminex) (integración): exportar el plan de alimentación por periodo (tonelaje, ley, dureza, contaminantes) como entrada a la planificación de producción de planta
