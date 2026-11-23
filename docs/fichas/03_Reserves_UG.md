# Planning · Reserves UG
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Medio · Ola 3
Módulo hermano: Reserves OP (Planning)
## Qué resuelve
Evaluación y agregación de reservas sobre los diseños: tonelaje, ley y categoría por labor, banco y fase.

## Alcance
Solo minería subterránea: reservas por labor, tajeo, nivel y bloque de veta, con dilución y recuperación de método de minado. El hermano para tajo abierto es Reserves OP (PLA1O). Esta ficha NO cubre bancos, fases, ratio de desbroce ni botaderos.

## Contexto
Un recurso es lo que hay en la roca; una reserva es la parte que se puede sacar con ganancia después de aplicar el método de minado. En una veta angosta subterránea esa diferencia es grande: para entrar a la veta hay que cortar más ancho que la veta (dilución con desmonte), se dejan pilares de roca sin minar, y parte del mineral queda atrás (pérdida). Hoy el planeador toma los diseños de tajeos del CAD, los cruza con el modelo de bloques y calcula todo en Excel. Este módulo lo hace sobre cada tajeo y cada labor de desarrollo, con el ancho mínimo de minado, la dilución y la recuperación del método elegido, y entrega reservas por tajeo, nivel y periodo, con trazabilidad de la versión.

## Usuarios
Planeador de mina subterránea (corre la evaluación y publica reservas); ingeniero de tajeos (define forma, ancho de minado y dilución de cada tajeo); geólogo (revisa categoría y ley); gerente de planeamiento (aprueba la versión de reservas); finanzas (usa el tonelaje y ley en el flujo de caja).

## Glosario
- Reserva: Parte del recurso que es económicamente extraíble, después de aplicar dilución, pérdidas y ley de corte.
- Tajeo: Forma 3D de donde se extrae mineral en la veta o cuerpo. Es la unidad de reserva en subterránea.
- Ancho mínimo de minado: Espesor mínimo (m) que permite trabajar el equipo en el tajeo. Si la veta es más angosta se corta hasta este ancho.
- Dilución: Desmonte que se mezcla con el mineral al volar. Se expresa en % sobre el mineral o como metros extra de caja.
- Dilución planificada: Desmonte incluido por diseño porque la veta es más angosta que el ancho mínimo.
- Dilución no planificada: Sobre-rotura de las cajas (paredes) fuera del diseño.
- Recuperación minera: Porcentaje del mineral del tajeo que sí se extrae; el resto queda en pilares, pisos o rellenos.
- Pilar: Columna de mineral que se deja sin minar para sostener la labor.
- Ley de corte: Ley mínima (g/t, % o equivalente) bajo la cual un tajeo no paga su costo.
- Ley equivalente: Ley que suma varios metales a un solo valor usando precios y recuperaciones.
- Categoría de reserva: Probada o probable, según la confianza del recurso del que proviene.
- Labor de desarrollo: Galería, crucero o rampa que se excava para llegar a los tajeos; su roca puede ser mineral o desmonte.
- Cámara: Método de minado con espacios grandes y pilares; aplica a cuerpos anchos.
- Corte y relleno: Método de minado en tajadas horizontales que luego se rellenan; típico en vetas angostas.
- Versión de reservas: Corrida congelada con sus parámetros, para auditar.

## Flujo de uso
1. Paso 1: el planeador elige la versión de recursos (modelo de bloques de Resource UG) y los diseños aprobados de Designer UG.
2. Paso 2: el ingeniero de tajeos asigna a cada tajeo el método (corte y relleno, subniveles, cámaras) con su ancho mínimo, dilución y recuperación.
3. Paso 3: se definen parámetros económicos: precios, recuperación metalúrgica, costos de minado, planta y administración, y se calcula la ley de corte por método.
4. Paso 4: el módulo cruza cada tajeo con los bloques y obtiene tonelaje y ley in situ por tajeo.
5. Paso 5: se aplica ancho mínimo, dilución y recuperación y se obtiene el mineral minable por tajeo.
6. Paso 6: se corre el optimizador de tajeos sobre el modelo para proponer formas que maximicen valor sobre la ley de corte.
7. Paso 7: se descartan los tajeos bajo ley de corte y se marcan los pilares y zonas aisladas inaccesibles.
8. Paso 8: se evalúan por separado las labores de desarrollo (mineral o desmonte).
9. Paso 9: se agrega por tajeo, labor, nivel, método, categoría y periodo en reservas utilizables.
10. Paso 10: el geólogo revisa la categoría y marca restricciones (zonas de poca confianza).
11. Paso 11: el planeador compara con la versión anterior y con lo extraído según Reconcile; explica diferencias.
12. Paso 12: el gerente aprueba y congela la versión; se publica a Scheduler UG y NPV Analyzer.

## Funcionalidades: Evaluación de tajeos y labores
- [ ] Cruzar cada tajeo y labor de desarrollo con el modelo de bloques de veta para obtener tonelaje y ley in situ (MinePlan Reserves: cálculo de reservas sobre los diseños)
- [ ] Ancho mínimo de minado por método y recorte a ese ancho
- [ ] Dilución planificada y no planificada por tajeo, con valores por defecto del método y ajuste manual
- [ ] Recuperación minera por método y por tipo de tajeo (con o sin pilar)
- [ ] Evaluar labores de desarrollo: mineral o desmonte según su ley contra la ley de corte
- [ ] Ley equivalente para varios metales con precios y recuperaciones

## Funcionalidades: Optimización de tajeos (Studio UG)
- [ ] Optimizador de tajeos sobre el modelo: formas que superan la ley de corte con ancho mínimo y altura de nivel (Datamine Studio UG: diseño y reservas subterráneas con optimizador de tajeos)
- [ ] Comparar la forma optimizada con el diseño y ver el valor ganado o perdido
- [ ] Reglas de pilares y distancia a labores existentes

## Funcionalidades: Agregación de reservas
- [ ] Agregar tajeos y labores evaluados en reservas de mina por labor, nivel, método y periodo (Deswik Agg)
- [ ] Agregación por categoría (probada, probable) y por zona geotécnica
- [ ] Reserva de mina tabulada con tonelaje, ley, metal contenido y recuperación
- [ ] Marcar tajeos con acceso pendiente, bajo ley de corte o con restricciones

## Funcionalidades: Parámetros, versiones y trazabilidad
- [ ] Parámetros económicos y de método guardados con cada versión
- [ ] Congelar versión aprobada y compararla con otra versión
- [ ] Trazabilidad: de cada total hasta el tajeo, el bloque y el parámetro usado
- [ ] Cálculo de ley de corte por método y por zona

## Funcionalidades: Conciliación y reportes
- [ ] Comparar reservas con la producción real de Reconcile por tajeo (tonelaje, ley, dilución real)
- [ ] Reporte de reservas por nivel y por método en Excel y PDF
- [ ] Estructura de reporte compatible con códigos internacionales; validar la norma vigente

## Funcionalidades: Trabajo sin señal
- [ ] Consultar la última versión congelada de reservas en tablet bajo tierra, solo lectura
- [ ] Ajustes de dilución observada por el geólogo en el tajeo quedan en cola y se sincronizan al volver la señal

## Pantallas
- Parámetros por método: ancho mínimo, dilución, recuperación y ley de corte por método de minado
- Evaluación de tajeos: lista con tonelaje, ley, ancho y dilución por tajeo
- Tajeo 3D: forma, bloques y pilares sobre las labores de cada nivel
- Optimizador de tajeos: formas propuestas, valor y comparación con el diseño
- Reservas por nivel y método: tablas agregadas con categoría
- Labores de desarrollo: mineral y desmonte por labor
- Comparación de versiones: cambio de tonelaje y ley con causas
- Conciliación con Reconcile: plan contra extraído por tajeo
- Modo tablet sin señal: reserva del tajeo y registro de dilución observada

## Lógica y cálculos
- Tonelaje in situ del tajeo (t) = volumen de la forma en el modelo (m3) x densidad (t/m3). Ejemplo: 5 400 m3 x 2,9 = 15 660 t.
- Ancho de minado (m) = máximo entre ancho de veta (m) y ancho mínimo de minado (m). Ejemplo: veta de 0,6 m y mínimo de 1,2 m: se mina 1,2 m.
- Dilución planificada (%) = (ancho de minado - ancho de veta) / ancho de veta x 100. Con 1,2 m y 0,6 m: 100 %.
- Mineral diluido (t) = mineral in situ (t) x (1 + dilución total / 100). Ley diluida = (mineral x ley + desmonte diluido x ley del desmonte) / mineral diluido. Ejemplo: 1 000 t a 8,0 g/t con 25 % de dilución a 0 g/t: 1 250 t a 6,4 g/t.
- Mineral recuperado (t) = mineral diluido (t) x recuperación minera (%) / 100. Ejemplo: 1 250 t con 85 %: 1 062,5 t.
- Metal contenido (g) = mineral recuperado (t) x ley diluida (g/t). 1 062,5 t x 6,4 g/t = 6 800 g.
- Ley de corte (g/t) = costo total de mina + planta + administración (US$/t) / (precio (US$/g) x recuperación de planta (decimal)). Ejemplo: 105 US$/t / (65 US$/g x 0,90) = 1,79 g/t.
- Un tajeo entra a reservas si su ley diluida >= ley de corte del método y tiene acceso desde una labor existente o planificada.
- Pilar: mineral dejado = factor de pilar (%) x mineral del tajeo; se resta de la reserva y no se recupera. Ejemplo: 10 % de 15 660 t = 1 566 t.
- Ley equivalente = ley del metal 1 + suma(ley del metal i x factor i), con factor i = precio_i x recuperación_i / (precio_1 x recuperación_1).
- Probada o probable: un tajeo hereda la categoría del recurso medido o indicado del que proviene; si mezcla, toma la categoría más baja presente (regla configurable).
- Conciliación (%) = (tonelaje real extraído - tonelaje reserva) / tonelaje reserva x 100 por tajeo.

## Modelo de datos
- ParámetrosMétodo: id, versión_id, método (corte y relleno, subniveles, cámaras), ancho_mínimo_m, dilución_%, recuperación_%, factor_pilar_%, ley_corte_g_t
- TajeoEvaluado: id, versión_id, nivel, nombre, volumen_m3, densidad_t_m3, ancho_veta_m, ancho_minado_m, tonelaje_insitu_t, ley_insitu, categoría
- ReservaTajeo: tajeo_id, versión_id, mineral_diluido_t, ley_diluida, mineral_recuperado_t, metal_contenido_g, estado (reserva, bajo ley, sin acceso)
- LaborDesarrolloEval: labor_id, versión_id, metros_m, tonelaje_t, ley, destino (mineral, desmonte)
- VersiónReservas: id, nombre, fecha, recurso_versión, diseño_versión, estado (borrador, aprobada, congelada), aprobada_por
- ParámetrosEconómicos: versión_id, precio_metal, recuperación_planta_%, costo_mina_us_t, costo_planta_us_t, costo_adm_us_t
- PropuestaOptimizador: id, versión_id, forma_ref, valor_us, tonelaje_t, ley, difiere_de_diseño
- ReservaAgregada: versión_id, nivel, método, categoría, periodo, tonelaje_t, ley, metal_g
- ConciliaciónTajeo: tajeo_id, tonelaje_real_t, ley_real, dilución_real_%, diferencia_%
- DilucionObservada: tajeo_id, observador_id, sobre-rotura_m, fecha_hora, sync_estado

## Validaciones
- El ancho mínimo de minado debe ser mayor que 0 m; si no, "Defina el ancho mínimo".
- La recuperación y la dilución van de 0 a 100 %; fuera de rango se rechazan.
- La densidad debe ser mayor que 0 t/m3; si falta, "Falta densidad del tajeo".
- El tajeo debe tener nivel asignado; si no, "Asigne nivel".
- No se aprueba una versión sin recurso, diseño y parámetros económicos completos.
- No se modifica una versión congelada; se crea una nueva.
- Un tajeo que cruza dos categorías debe aplicar la regla de categoría o pedir decisión.
- La dilución observada no puede ser negativa; la sobre-rotura se registra en metros.

## Catálogos semilla
- Métodos de minado: corte y relleno, subniveles con taladros largos, cámaras y pilares, hundimiento por bloques (ejemplos)
- Categorías: probada, probable
- Destinos de labor: mineral, desmonte, relleno
- Zonas geotécnicas: roca buena, regular, mala (afectan dilución y pilar)

## Entradas
- Tajeos y labores de Designer UG
- Modelo de bloques de Resource UG
- Extracción real por tajeo desde Reconcile
- Precios y costos desde Budget UG y Unit Cost UG

## Salidas
- Reservas por tajeo y periodo a C3U Scheduler UG
- Reserva y ley a C5 NPV Analyzer
- Reportes en Excel y PDF a L2 Reports

## Integraciones entre módulos
- Recibe de: Resource UG (Geology), Designer UG (Planning), Stope Optimizer (Planning)
- Entrega a: Scheduler UG (Planning), NPV Analyzer (Economics)

## Integraciones externas y estándares
- Excel y PDF: exportar.
- Formato de modelos de bloques y de sólidos de otros paquetes (Datamine, Deswik, MinePlan) por archivo: integrar, no construir.
- Códigos JORC y NI 43-101: se sigue su estructura de reporte; validar con el texto vigente de la norma peruana aplicable.
- Solver estándar para el optimizador de tajeos: integrar, no construir un solver propio.

## Plataforma
Web en oficina con cálculo en servidor sobre modelos de bloques; tablet sin conexión para consultar reservas del tajeo y registrar dilución observada, con cola de cambios que prioriza el último cambio por campo.

## Roles y permisos
- Planeador: correr evaluación y publicar
- Ingeniero de tajeos: editar parámetros por método y revisar formas
- Geólogo: revisar categorías y registrar dilución observada
- Gerente de planeamiento: aprobar y congelar versión
- Finanzas: solo lectura

## Casos de prueba
- Veta de 0,6 m con mínimo de 1,2 m: ancho de minado 1,2 m y dilución planificada 100 %.
- 1 000 t a 8,0 g/t con 25 % de dilución a 0 g/t: 1 250 t a 6,4 g/t.
- 1 250 t con recuperación de 85 %: 1 062,5 t recuperadas.
- Costo 105 US$/t, precio 65 US$/g y recuperación 0,90: ley de corte 1,79 g/t; un tajeo de 1,5 g/t no entra a reservas.
- Tajeo de 15 660 t con 10 % de pilar: 1 566 t dejadas y 14 094 t evaluables.
- Versión congelada: no permite cambiar la dilución; pide crear versión nueva.
- Dilución observada de 0,3 m cargada sin señal: se sincroniza una vez al volver la señal.

## Criterios de aceptación
- Cada total de reserva se puede abrir hasta el tajeo y el parámetro que lo produjo.
- Una evaluación de 300 tajeos termina en menos de 5 minutos.
- Las diferencias contra la versión anterior se explican por cambio de parámetro, diseño o recurso.
- La conciliación por tajeo coincide con Reconcile.

## Notas para el desarrollador
- En veta angosta lo que manda es el ancho de minado: no usar solo el ancho de veta.
- Dilución en % y dilución en metros de caja no son lo mismo; guardar ambas con unidad.
- Los pilares y las zonas aisladas pueden salir de reservas aunque tengan ley.
- La ley de corte cambia con el método; no usar una sola.
- El desarrollo en desmonte no suma reserva de mineral, pero sí costo.
- Investigar formato de sólidos de tajeo y el algoritmo estándar de optimización de tajeos antes de implementar.
- La clasificación JORC o NI 43-101 no se codifica de memoria: tomar reglas como datos y validar con el texto vigente.

## Referencias técnicas
Métodos de minado subterráneo (corte y relleno, subniveles, cámaras); estimación de dilución (equivalent linear overbreak slough) como referencia; códigos JORC y NI 43-101 (validar con el texto vigente).

## Software de referencia
- MinePlan Reserves (Hexagon)
- Deswik Agg (Deswik)
- Studio UG (Datamine)

## Capacidades de la competencia que cubre
- Datamine · Studio UG: diseño y reservas subterráneas con optimizador de tajeos
- Deswik · Deswik Agg: agregar reservas evaluadas sobre los diseños en reservas de mina utilizables por labor, banco o fase
- Hexagon · MinePlan Reserves: cálculo de reservas sobre los diseños
