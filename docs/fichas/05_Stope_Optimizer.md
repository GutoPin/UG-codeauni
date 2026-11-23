# Planning · Stope Optimizer
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Muy alto · Ola 4
## Qué resuelve
Formas óptimas de tajeo por ley de corte.

## Alcance
Módulo solo para minería subterránea (CODEa Stope Optimizer); no tiene hermano en tajo abierto (allí el equivalente es Pit Optimizer). No cubre el diseño detallado de accesos, que hace Designer UG, ni minería por hundimiento (Cave Planner).

## Contexto
En una mina subterránea de vetas o cuerpos, el mineral se extrae en tajeos: bloques grandes de roca de forma regular. Dónde poner cada tajeo y qué dimensiones darle cambia mucho el valor: si es muy ancho, se diluye con estéril; si es angosto, se deja mineral. Hoy se hace a mano en el CAD, o con software como Datamine MSO o Deswik SO que, dada una ley de corte y las dimensiones permitidas, buscan las formas de tajeo que más valor aportan. Este módulo hace esa búsqueda y entrega formas listas para convertirse en diseño.

## Usuarios
Ingeniero de planeamiento senior (define parámetros y elige la disposición de tajeos); geomecánico (aporta dimensiones máximas, pilares y dilución esperada); ingeniero de reservas (usa los resultados); ingeniero de diseño (convierte las formas en tajeos con accesos).

## Glosario
- Tajeo: Bloque de roca mineralizada que se extrae de una vez o por etapas.
- Forma de tajeo: Sólido 3D que propone el optimizador como tajeo.
- Ley de corte: Ley mínima para que un bloque pague su extracción; se calcula con costos y precio.
- Ancho mínimo de minado: Ancho mínimo de excavación posible con el equipo; si la veta es más angosta se diluye.
- Subnivel: Nivel intermedio de perforación entre los niveles principales.
- Rumbo y buzamiento: Orientación y pendiente de la veta o cuerpo.
- Pilar: Roca que se deja sin extraer para sostener la mina.
- ELOS: Sobre-excavación lineal equivalente: espesor medio de roca que se desprende de la pared del tajeo (m).
- Dilución: Roca estéril que se mezcla con el mineral.
- Hastial colgante y yacente: Pared de roca encima y debajo de una veta inclinada.
- Programación dinámica: Método para elegir la mejor combinación de piezas sin traslape.
- Altura de subnivel: Distancia vertical entre subniveles.
- Corte y relleno: Método que extrae por franjas y rellena el vacío.
- Cámaras y pilares: Método que deja pilares de mineral en una malla.

## Flujo de uso
1. Paso 1: se elige el modelo de bloques (con ley, densidad, categoría) y la zona o dominio.
2. Paso 2: se calcula o ingresa la ley de corte con precio, costos y recuperación.
3. Paso 3: se elige el método de minado (subniveles, corte y relleno, cámaras y pilares) y sus dimensiones permitidas.
4. Paso 4: se fijan ancho mínimo, pilares y dilución (ELOS) por pared.
5. Paso 5: el optimizador recorre el modelo en cortes regulares alineados al rumbo.
6. Paso 6: en cada nivel resuelve la mejor secuencia de formas sin traslape y con pilar.
7. Paso 7: se consolidan los niveles, se suavizan las formas contiguas y se descartan las que no cumplen el valor mínimo.
8. Paso 8: se muestran tonelaje, ley, valor y dilución por forma y total.
9. Paso 9: se corren escenarios de precio y ley de corte y se comparan.
10. Paso 10: el ingeniero elige un escenario y lo congela.
11. Paso 11: envía las formas a Designer UG para generar el diseño automático del tajeo con accesos y subniveles.
12. Paso 12: envía tonelaje y ley a Reserves UG.

## Funcionalidades: Parámetros
- [ ] Ley de corte por equilibrio con precio, costos y recuperación
- [ ] Ancho mínimo, largo mínimo y máximo, altura y buzamiento mínimo por método
- [ ] Espaciado entre subniveles y altura del tajeo
- [ ] Dilución por pared (ELOS) y por contacto
- [ ] Pilares: tamaño mínimo entre tajeos y verificación de factor de seguridad

## Funcionalidades: Optimización de formas
- [ ] Optimización de formas de tajeo por ley de corte para tajeo por subniveles en vetas
- [ ] Varios métodos de minado: subniveles, corte y relleno, cámaras y pilares
- [ ] Selección de la mejor combinación sin traslape por programación dinámica
- [ ] Suavizado entre formas contiguas
- [ ] Valor por forma con costos fijos de desarrollo y variables

## Funcionalidades: Escenarios
- [ ] Escenarios de precio y de ley de corte con comparación
- [ ] Selección y comparación de disposiciones de tajeos con la mejor ley de corte
- [ ] Curva tonelaje-valor por ley de corte
- [ ] Escenarios con distintas dimensiones y métodos

## Funcionalidades: Pilares
- [ ] Optimización de pilares: ancho que equilibra mineral perdido y seguridad
- [ ] Esfuerzo del pilar por área tributaria y factor de seguridad
- [ ] Reglas de pilares por dominio geotécnico

## Funcionalidades: Diseño automático
- [ ] Convertir cada forma en un tajeo con sólido editable en Designer UG
- [ ] Generar accesos, subniveles y cortes de perforación a partir de la forma
- [ ] Preparación de la lista de labores de desarrollo y sus metros

## Funcionalidades: Reservas
- [ ] Reporte de tonelaje y ley por forma y por nivel
- [ ] Datos para Reserves UG con dilución y pérdida
- [ ] Reporte de metros de desarrollo por tonelada

## Funcionalidades: Visor y exportes
- [ ] Visor 3D con las formas coloreadas por valor
- [ ] Exportar sólidos a DXF y OMF

## Pantallas
- Parámetros de optimización
- Corrida y progreso
- Visor 3D de formas
- Tabla de formas con tonelaje, ley, valor y dilución
- Curva tonelaje-valor por ley de corte
- Comparación de escenarios
- Pilares: esfuerzo y factor de seguridad
- Convertir a diseño en Designer
- Historial de corridas

## Lógica y cálculos
- Ley de corte de equilibrio = (Cm + Cp + Cg) / ((P - Cv) x R). Ejemplo: Cm 35, Cp 18, Cg 7 USD/t, P 60 USD/g, Cv 0,5, R 0,90: 60 / (59,5 x 0,90) = 1,12 g/t.
- Valor de un bloque = t x ( g x R x (P - Cv) - Cp - Cg ) - t x Cm.
- Dilución por pared: V_dil = ELOS x A_pared (m2), con dos paredes por tajeo; t_dil = V_dil x densidad; ley diluida = (t_min x g + t_dil x g_dil) / (t_min + t_dil). Ejemplo: tajeo con paredes de 400 m2 y ELOS 0,5 m = 200 m3 por pared; 400 m3 totales x 2,8 t/m3 = 1 120 t de dilución.
- Forma candidata: en cada fila (nivel o corte) alineada con el rumbo, para cada inicio i y largo L entre L_min y L_max se calcula v(i, L) = suma de valores de bloques dentro de la forma, incluidos los diluidos, menos costos fijos de desarrollo (metros de acceso x costo por m). Se conserva solo si v mayor a cero.
- Selección sin traslape: programación dinámica de intervalos ponderados: f(k) = max( f(k - 1), v(i, L) + f(i - pilar) ). Se garantiza el pilar mínimo entre formas contiguas.
- Ancho mínimo: si el ancho de mineral es menor al ancho mínimo de minado W_min, el ancho de la forma es W_min y se agrega dilución por la diferencia.
- Suavizado: media móvil de los vértices de contorno entre formas contiguas con tolerancia en metros; la forma suavizada se revalida contra ancho mínimo.
- Esfuerzo del pilar por área tributaria: sigma_p = sigma_v / (1 - e); sigma_v = densidad x g x profundidad; e = tasa de extracción del área. Factor de seguridad = resistencia del pilar (aporta el geomecánico) / sigma_p, que debe ser mayor o igual al valor del proyecto.
- Escenarios: repetir la corrida para cada par (precio, ley de corte); comparar valor total, tonelaje y ley media.
- Valor total del plan = suma de v de las formas elegidas; relación desarrollo/mineral = metros de desarrollo / kt de mineral.

## Modelo de datos
- ParametrosOptimizacion: id, nombre, ley_corte, metodo_id, ancho_min_m (m), largo_min_m (m), largo_max_m (m), altura_m (m), elos_m (m), pilar_min_m (m), costo_desarrollo_usd_m
- Metodo: id, nombre, restricciones_json
- Corrida: id, parametros_id, modelo_bloques_id, fecha, estado, tiempo_s
- Forma: id, corrida_id, nivel_id, solido, tonelaje_t, ley, dilucion_pct, valor_usd, metros_desarrollo_m
- Pilar: id, forma_a, forma_b, ancho_m, factor_seguridad, resistencia_mpa
- Escenario: id, corrida_id, precio, ley_corte, valor_total_usd, tonelaje_t, ley_media
- Dominio: id, nombre, buzamiento_grados, rumbo_grados, elos_m, resistencia_mpa
- ConversionDiseno: id, forma_id, tajeo_id, fecha, estado

## Validaciones
- Ancho mínimo, largos y altura positivos y con L_min menor o igual a L_max.
- Ley de corte mayor que cero; si P menor o igual a Cv, error de precio.
- Pilar mínimo mayor o igual a cero; si el factor de seguridad es menor al exigido, la forma se marca.
- El modelo debe tener densidad y ley; bloque sin densidad se excluye con aviso.
- Cada forma debe cumplir ancho mínimo: 100 % de formas válidas, o la corrida falla.
- Formas elegidas sin traslape; la corrida valida y reporta cualquier cruce.
- El método elegido debe tener dimensiones definidas.
- ELOS no negativo.

## Catálogos semilla
- Métodos de minado: tajeo por subniveles, corte y relleno ascendente, cámaras y pilares, tajeo con relleno cementado (ejemplos).
- Dimensiones típicas por método con rango.
- ELOS por dominio geotécnico.
- Valores de factor de seguridad de pilares por criterio del cliente.

## Entradas
- Modelo de bloques de Resource
- Parámetros económicos de Economics
- Dominios geotécnicos y resistencia de Geotechnics

## Salidas
- Formas a Designer UG (diseño automático de tajeo con accesos)
- Tonelaje y ley a Reserves UG
- Sólidos en DXF u OMF

## Integraciones entre módulos
- Recibe de: Resource UG (Geology)
- Entrega a: Designer UG (Planning), Reserves UG (Planning)

## Integraciones externas y estándares
- DXF y OMF para formas.
- Importar el formato de salida de optimizadores externos (Datamine MSO, Deswik SO) como sólidos DXF: integrar, no construir su formato.

## Plataforma
Motor de cálculo en Python o C++ más visor 3D web; ejecución en servidor.

## Roles y permisos
- Ingeniero senior: correr y congelar escenarios
- Geomecánico: editar ELOS, pilares y dimensiones
- Ingeniero de diseño: convertir formas
- Lector: ver resultados

## Casos de prueba
- Ley de corte con Cm 35, Cp 18, Cg 7, P 60, Cv 0,5, R 0,90: 1,12 g/t.
- Tajeo con paredes de 400 m2 y ELOS 0,5 m a 2,8 t/m3: 1 120 t de dilución.
- Veta de 1,2 m con ancho mínimo 2,0 m: forma de 2,0 m y dilución por 0,8 m.
- DP de 3 formas candidatas con valores 10, 8 y 12 donde la 1 y la 2 se traslapan y la 2 y la 3 no: elige 1 y 3 con 22.
- Pilar con sigma_v 12 MPa y e = 0,6: sigma_p = 30 MPa; con resistencia 45 MPa, FS 1,5.
- 100 % de las formas cumple ancho mínimo en un modelo de prueba.

## Criterios de aceptación
- 100 % de formas cumplen el ancho mínimo y el pilar mínimo
- Valor total igual (+-1 %) a la hoja de referencia de un caso de prueba
- Corrida de 200 000 bloques en menos de 5 minutos
- Conversión a Designer UG sin pérdida de volumen mayor a 1 %

## Notas para el desarrollador
- Las formas óptimas son irregulares: necesitan suavizado antes del diseño.
- El ELOS depende de la roca y del tamaño del tajeo; no usar un valor único para toda la mina.
- La programación dinámica es exacta por fila, pero la consolidación 3D es heurística: documentar la diferencia.
- No asumir método único: las restricciones de corte y relleno son muy distintas a las de subniveles.
- El factor de seguridad de pilar necesita la resistencia del geomecánico; este módulo no la calcula.

## Referencias técnicas
Literatura de optimización de formas de tajeo (Datamine MSO, Alford); Hustrulid y Bullock, Underground Mining Methods; Potvin, método de estabilidad para tajeos. Límites de dimensiones y pilares: validar con el estudio geotécnico y la normativa vigente.

## Software de referencia
- MSO (Datamine)
- Deswik.SO (Deswik)
- MinePlan Stope Optimizer (Hexagon)
- Optimizador de tajeos (rol Surpac) (Dassault Systèmes)
- Deswik ASD (Deswik)
- Optimizador de tajeos (rol Surpac) (Dassault)
- Studio UG (Datamine)
- Deswik SO (Deswik)

## Capacidades de la competencia que cubre
- Dassault · Optimizador de tajeos (rol Surpac): selección y comparación de disposiciones de tajeos con la mejor ley de corte
- Datamine · Studio UG: diseño y reservas subterráneas con optimizador de tajeos
- Deswik · Deswik SO: optimización de formas de tajeo subterráneo por ley de corte
- Deswik · Deswik ASD: diseño automático de tajeos a partir de las formas optimizadas, generando sólidos listos para editar en el diseñador
- Hexagon · MinePlan Stope Optimizer: optimización de formas de tajeo subterráneo
