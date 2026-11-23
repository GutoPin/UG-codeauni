# Planning · Designer UG
Alcance: Solo subterránea (UG) · Reemplaza software comercial · Esfuerzo: Muy alto · Ola 3
Módulo hermano: Designer OP (Planning)
## Qué resuelve
CAD minero: rampas, galerías y tajeos (UG); bancos, bermas, rampas y botaderos (OP).

## Alcance
Módulo para minería subterránea (CODEa Designer UG). Su módulo hermano es Designer OP (bancos, bermas, rampas de camiones y botaderos de tajo abierto); esta ficha NO cubre diseño de tajo abierto.

## Contexto
En una mina subterránea el mineral se alcanza por túneles. El ingeniero de planeamiento debe dibujar en 3D esos túneles (rampas, galerías, cruceros, chimeneas) y los tajeos (los grandes vacíos de donde se extrae el mineral) antes de que se excaven. Hoy se hace en CAD (Deswik.CAD, Studio UG, Vulcan, AutoCAD) con líneas sueltas y se calculan tonelajes en hojas Excel. Este módulo es el CAD minero propio de CODEa: cada objeto de diseño es un registro con atributos consultables, se evalúa contra el modelo de bloques y alimenta a Scheduler, Conformance y Reserves.

## Usuarios
Ingeniero de planeamiento (diseña labores y tajeos y evalúa tonelaje y ley); ingeniero senior de planeamiento (aprueba el diseño y lo congela como versión oficial); topógrafo (importa as-built y replantea); ingeniero de ventilación y de servicios (revisa trazado de aire, agua y energía).

## Glosario
- Labor: Excavación subterránea: galería, crucero, rampa, chimenea, cámara.
- Rampa: Túnel inclinado por donde bajan camiones y equipos de un nivel a otro; su gradiente suele estar entre 10 y 15 % (parámetro del cliente).
- Galería: Túnel horizontal que sigue la veta o el cuerpo mineralizado.
- Crucero: Túnel horizontal que corta la veta en ángulo, para llegar a ella.
- Chimenea: Labor vertical o muy inclinada para ventilación, paso de mineral o acceso.
- Tajeo: Volumen de roca mineralizada que se extrae; en el CAD es un sólido 3D.
- Nivel: Plano horizontal de labores a una cota (elevación) dada, por ejemplo Nivel 3900.
- Sección tipo: Forma y medidas de la sección de un túnel (por ejemplo herradura de 4 m x 4 m).
- Eje (alineamiento): Línea 3D por el centro de una labor; la sección se barre a lo largo de él.
- Gradiente: Pendiente en %: diferencia de cota entre longitud horizontal por 100.
- Radio de giro: Radio mínimo de una curva para que pase el equipo de diseño.
- Modelo de bloques: Malla 3D de cubos con ley y densidad estimadas, de Resource.
- Dilución: Roca estéril que se mezcla con el mineral al extraerlo, por sobre-excavación.
- As-built: Forma real excavada, medida por topografía; se compara contra el diseño.
- DXF: Formato de intercambio de dibujos CAD (Autodesk).

## Flujo de uso
1. Paso 1: el ingeniero crea un proyecto de diseño y elige el modelo de bloques y las superficies (topografía) de referencia.
2. Paso 2: importa el estado actual de la mina (as-built de Surveyor UG) y, si aplica, planos DXF o strings de otros sistemas.
3. Paso 3: define secciones tipo y reglas (gradiente máxima, radio mínimo, distancia mínima entre labores).
4. Paso 4: dibuja el eje de la rampa principal con gradiente y radio controlados; el sistema barre la sección y crea el sólido.
5. Paso 5: dibuja galerías y cruceros por nivel y los conecta a la rampa; el sistema detecta cruces y propone intersecciones.
6. Paso 6: crea tajeos a mano, de forma paramétrica o importando las formas de Stope Optimizer (diseño automático de tajeo con accesos).
7. Paso 7: asigna atributos (nivel, tipo, método, fase, estado) y trazado de servicios (aire, agua, energía, drenaje).
8. Paso 8: ejecuta el chequeo de interferencias y la evaluación contra el modelo de bloques.
9. Paso 9: revisa tonelaje, ley y dilución por labor y tajeo; ajusta el diseño y reevalúa.
10. Paso 10: el ingeniero senior aprueba y congela la versión del diseño.
11. Paso 11: el sistema publica labores a Scheduler, objetivos a Face y Ring, trazado a Network, diseño a Conformance y reservas a Reserves.
12. Paso 12: se emiten planos, secciones y exportaciones DXF, OBJ, CSV y Surpac.

## Funcionalidades: Diseño de labores
- [ ] Labor por eje 3D con sección tipo barrida (herradura, rectangular, circular, personalizada)
- [ ] Rampas con gradiente máxima y radio de giro validados mientras se dibuja, incluida rampa en espiral y alternativa de rampa en retorno
- [ ] Galerías, cruceros, cámaras, chimeneas y piques con intersecciones automáticas
- [ ] Biblioteca de secciones tipo con área calculada y sobre-excavación planificada
- [ ] Reglas de diseño por proyecto con aviso inmediato al violarlas
- [ ] Edición del eje (mover vértice, insertar, suavizar curva) que regenera el sólido

## Funcionalidades: Tajeos
- [ ] Tajeo como sólido: dibujado, extruido desde polígono por nivel o importado
- [ ] Tajeo paramétrico: largo, ancho, altura, buzamiento y espaciado entre subniveles como parámetros editables
- [ ] Diseño automático del tajeo a partir de la forma óptima de Stope Optimizer: genera el sólido editable más los accesos y subniveles
- [ ] Secuencia de minado y pilares como atributos del tajeo
- [ ] Cálculo del volumen vacío para relleno

## Funcionalidades: Base de datos espacial de diseño
- [ ] Cada objeto (rampa, galería, tajeo, nivel) es un registro con geometría y atributos consultables
- [ ] Consultas por atributo y por zona espacial, por ejemplo todas las galerías del nivel 3900 sin sostenimiento asignado
- [ ] Un único motor 3D y una base compartida para sondajes, diseño, topografía y estimación
- [ ] Historial de versiones y comparación entre versiones
- [ ] Capas, colores y etiquetas por atributo
- [ ] Tabla de atributos editable en bloque

## Funcionalidades: Evaluación
- [ ] Intersección de sólidos con el modelo de bloques (fracción de bloque dentro)
- [ ] Tonelaje, ley, densidad, finos y dilución por labor, tajeo, nivel y método
- [ ] Evaluación con tope por ley de corte y categoría del recurso
- [ ] Entrega de la evaluación a Reserves para agregar por labor y periodo
- [ ] Reporte de metros lineales y volúmenes por tipo de labor

## Funcionalidades: Servicios y chequeo
- [ ] Trazado de tuberías de agua y aire comprimido, cables de energía y drenaje a lo largo de las labores, con longitudes y cantidades
- [ ] Chequeo de interferencias: distancia mínima entre labores, cruces no previstos, tajeo contra labor, pilares
- [ ] Chequeo contra topografía real: labor que sale de la roca o choca con vacíos existentes
- [ ] Informe de reglas violadas con ubicación

## Funcionalidades: Intercambio de archivos
- [ ] Importar y exportar Surpac: strings, DTM, modelos de bloques y sondajes
- [ ] DXF de ida y vuelta con AutoCAD
- [ ] OBJ, CSV, TXT y XYZ, incluidos mapas de calor de atributos
- [ ] Archivos de Deswik: intercambio por DXF, CSV y tablas de atributos, sin construir el formato propietario
- [ ] OMF para modelos y superficies

## Funcionalidades: Entrega a otros módulos
- [ ] Labores y duraciones por metro a Scheduler UG
- [ ] Objetivos de avance a Face y de anillos a Ring
- [ ] Trazado de aire y servicios a Network
- [ ] Diseño a Conformance UG y reservas a Reserves UG
- [ ] Publicación de versión congelada y notificación

## Funcionalidades: Planos
- [ ] Planos por nivel, secciones transversales y longitudinales
- [ ] Leyendas, cotas, escalas y cuadro de rotulación
- [ ] Exportación a PDF y DXF

## Pantallas
- Visor 3D de diseño: labores, tajeos, modelo de bloques, topografía y as-built
- Constructor de labor: eje, sección tipo, gradiente y radio con indicadores en vivo
- Biblioteca de secciones tipo
- Tabla de atributos y consultas espaciales
- Editor de tajeo paramétrico
- Resultado de Stope Optimizer y conversión a tajeo con accesos
- Evaluación contra modelo de bloques: tabla y mapa de calor
- Informe de interferencias y reglas
- Servicios: trazado y cantidades
- Versiones del diseño y comparación
- Importar y exportar

## Lógica y cálculos
- Sólido de labor: se barre la sección tipo (polígono plano) a lo largo del eje; en cada vértice la sección se orienta con la tangente y se mantiene horizontal la base; el volumen es el área de sección por la longitud del eje (V = A x L, m3).
- Área de sección herradura con pared de altura h_p (m) y ancho w (m) y arco semicircular: A = w x h_p + pi x w^2 / 8. Ejemplo: w = 4,0 m, h_p = 3,0 m: A = 12 + 6,28 = 18,28 m2.
- Gradiente (%) = (z_fin - z_ini) / L_horizontal x 100. Ejemplo: sube 6 m en 50 m horizontales = 12 %. Debe ser menor o igual a la gradiente máxima del proyecto.
- Curva de rampa: longitud horizontal del arco = R x theta (R en m, theta en radianes); desnivel = gradiente x R x theta. Ejemplo: R = 15 m, giro 180 grados, gradiente 12 %: arco = 47,1 m, desnivel = 5,65 m. R no puede ser menor que el radio mínimo de giro del equipo de diseño.
- Fracción de bloque dentro del sólido: recorte exacto del bloque (cubo) por el poliedro, o muestreo en subbloques de 5 x 5 x 5 si el recorte falla; fracción = V_dentro / V_bloque.
- Tonelaje del bloque = V_bloque x fracción x densidad. Ejemplo: bloque 5 x 5 x 5 m = 125 m3, fracción 0,6, densidad 2,8 t/m3: 210 t.
- Ley del sólido = suma(t_i x ley_i) / suma(t_i), ponderada por tonelaje. Finos = suma(t_i x ley_i).
- Dilución planificada por sobre-excavación: V_dil = d x A_pared, con d (m) el espesor por pared (hastial colgante y yacente) y A_pared (m2) el área de pared del tajeo; t_dil = V_dil x densidad del estéril; ley diluida = (t_min x ley + t_dil x ley_dil) / (t_min + t_dil).
- Interferencia: distancia mínima entre ejes menos las semisecciones debe ser mayor o igual al pilar mínimo (parámetro); si no, se marca la pareja de objetos.
- Tajeo paramétrico: volumen = largo x ancho x altura; ejemplo 30 x 8 x 25 m = 6000 m3, a 2,9 t/m3 = 17 400 t brutos antes de ley de corte y dilución.

## Modelo de datos
- ProyectoDiseno: id, nombre, mina_id, modelo_bloques_id, version_actual, estado (borrador, aprobado, congelado)
- Nivel: id, nombre, cota_m (m), proyecto_id
- SeccionTipo: id, nombre, forma, ancho_m, alto_m, area_m2, sobre_excavacion_m, poligono (puntos)
- Labor: id, tipo (rampa, galeria, crucero, chimenea, camara), nivel_id, eje (polilínea 3D), seccion_id, gradiente_pct, longitud_m, estado, metodo, fase, version, solido
- Tajeo: id, nivel_id, solido, largo_m, ancho_m, alto_m, buzamiento_grados, metodo, secuencia, origen (manual, parametrico, optimizador), forma_optimizada_id
- Servicio: id, tipo (agua, aire, energia, drenaje), trazado (polilínea 3D), diametro_mm, labor_id, longitud_m
- EvaluacionDiseno: id, proyecto_id, objeto_id, tonelaje_t, ley (unidad del elemento), finos, dilucion_pct, categoria, fecha
- ReglaDiseno: id, proyecto_id, tipo, valor, unidad, severidad
- Interferencia: id, objeto_a, objeto_b, tipo, distancia_m, estado
- VersionDiseno: id, proyecto_id, numero, fecha, autor, congelada (bool), comentario

## Validaciones
- La gradiente de una rampa no puede exceder la gradiente máxima del proyecto: Gradiente fuera de límite en tramo X.
- El radio de curva no puede ser menor al mínimo: Radio de giro insuficiente.
- El eje debe tener al menos 2 vértices y longitud mayor que cero.
- Una labor debe tener sección tipo asignada antes de evaluarse.
- Una versión congelada no se edita: crear nueva versión.
- Densidad y ley deben existir en el modelo de bloques para evaluar: Bloque sin densidad.
- El nombre de nivel y su cota no pueden repetirse en el mismo proyecto.
- Un tajeo no puede traslaparse con otro tajeo del mismo proyecto en la misma versión.
- Archivos importados: se informa el sistema de coordenadas y no se acepta si falta.

## Catálogos semilla
- Secciones tipo: herradura 4 x 4 m, 3,5 x 3,5 m, rampa 5 x 4,5 m, chimenea 2,4 x 2,4 m (ejemplos).
- Tipos de labor: rampa, galería, crucero, chimenea, cámara, pique, bypass.
- Métodos de minado: corte y relleno, sublevel stoping, cámaras y pilares, tajeo por subniveles con relleno (ejemplos).
- Estados de objeto: propuesto, aprobado, en ejecución, ejecutado.
- Tipos de servicio: agua, aire comprimido, energía, drenaje, ventilación.

## Entradas
- Modelo de bloques OMF de Resource
- As-built de Surveyor UG
- Formas optimizadas de Stope Optimizer
- Archivos DXF, Surpac, CSV y OBJ

## Salidas
- Labores a Scheduler UG
- Objetivos a Face y Ring
- Trazado a Network
- Diseño a Conformance UG
- Evaluación a Reserves UG
- Planos DXF y PDF

## Integraciones entre módulos
- Recibe de: Resource UG (Geology), Surveyor UG (Survey), Stope Optimizer (Planning), Conformance UG (Survey), Pillar (Geotech), Data Vault (Data)
- Entrega a: Scheduler UG (Planning), Surveyor UG (Survey), Face (Blasting), Ring (Blasting), Network (Ventilation), Conformance UG (Survey), Reserves UG (Planning)

## Integraciones externas y estándares
- Surpac (formatos de strings, DTM, bloques, sondajes): importar y exportar, no construir el software.
- AutoCAD DXF: intercambio ida y vuelta, formato estándar.
- OBJ, CSV, TXT, XYZ: salida de superficies y mapas de calor.
- Deswik: interoperar por DXF y CSV; el formato nativo propietario solo si el proveedor documenta su interfaz.
- OMF (Open Mining Format) para modelos.

## Plataforma
Escritorio o web con motor 3D de CODEa; en oficina, con conexión; la mina trabaja con las exportaciones.

## Roles y permisos
- Ingeniero de planeamiento: crear, editar y evaluar diseño
- Ingeniero senior: aprobar y congelar versiones
- Topógrafo: importar as-built y leer
- Ventilación y servicios: editar servicios y leer el diseño
- Lector: ver y exportar planos

## Casos de prueba
- Rampa de 100 m horizontales con gradiente 12 %: desnivel = 12 m; con gradiente máxima 10 % debe dar error.
- Curva R = 15 m, 180 grados, gradiente 12 %: arco 47,1 m y desnivel 5,65 m.
- Bloque 5 x 5 x 5 m con 60 % dentro y densidad 2,8: tonelaje 210 t.
- Tajeo de 30 x 8 x 25 m a 2,9 t/m3: 17 400 t brutos.
- Rampa y 3 tajeos contra un caso de referencia: tonelaje y ley iguales dentro de 1 %.
- Dos galerías con ejes a 5 m y sección de 4 m con pilar mínimo de 3 m: se marca interferencia.
- Importar y exportar DXF y volver a importar: geometría sin cambio mayor a 1 mm.

## Criterios de aceptación
- Rampa y 3 tajeos con tonelaje y ley iguales (+-1 %) a un caso de referencia
- Un diseño de 500 objetos se evalúa contra un modelo de 5 millones de bloques en menos de 5 minutos
- Consulta por atributo y zona responde en menos de 2 segundos
- DXF exportado abre sin errores en AutoCAD

## Notas para el desarrollador
- Todo en metros y sistema de coordenadas del proyecto (UTM de la mina); no mezclar con coordenadas locales sin transformación declarada.
- La gradiente se da en % (rise/run x 100) y a veces en grados: guardar siempre %, mostrar ambas.
- El recorte exacto sólido-bloque es costoso: usar índice espacial (octree o rejilla) y recorte solo en bloques parciales.
- No construir un formato propio para Deswik o Surpac: estudiar sus formatos de texto documentados antes de hacerlos; si no, DXF.
- Los tajeos optimizados suelen ser formas irregulares: el ingeniero debe poder suavizarlas y convertirlas en sólidos prácticos.
- Guardar los sólidos como malla triangulada cerrada y validar que sea manifold (sin huecos) antes de evaluar.

## Referencias técnicas
Hustrulid y Bullock, Underground Mining Methods; Hartman y Mutmansky, Introductory Mining Engineering; formato OMF; especificación DXF de Autodesk. Reglas de diseño y distancias de seguridad: validar con el reglamento de seguridad minera vigente.

## Software de referencia
- Deswik.CAD (Deswik)
- Studio UG / Studio OP (Datamine)
- Vulcan (Maptek)
- GEOVIA Surpac (Dassault Systèmes)
- MinePlan (Hexagon)
- AutoCAD (Autodesk)
- Micromine Beyond (Micromine)
- Micromine Advance (Micromine)
- Deswik ASD (Deswik)
- Deswik SPD (Deswik)
- MinePlan Pit Expansion Tool (Hexagon)
- Surface Mine Designer (3DEXPERIENCE) (Dassault Systèmes)
- Underground Mine Designer (3DEXPERIENCE) (Dassault Systèmes)
- GEOVIA Surpac (Dassault)
- Mine Designer (rol Surpac) (Dassault)
- Underground Mine Designer (3DEXPERIENCE) (Dassault)
- Studio UG (Datamine)
- Deswik Spatial (CAD) (Deswik)
- MinePlan 3D (Hexagon)
- Interfaz DXF con AutoCAD (METSIM · integración)
- CAD, formatos y mapas de calor (O-Pitblast)
- Deswik (ver mapa propio) (Sandvik)

## Capacidades de la competencia que cubre
- Dassault · GEOVIA Surpac: importar/exportar formatos Surpac de sondajes, strings, DTM y modelos de bloques, con diseño y topografía
- Dassault · Mine Designer (rol Surpac): diseño práctico de mina con rampas, bancos y galerías
- Dassault · Underground Mine Designer (3DEXPERIENCE): diseño de mina subterránea con rampas, galerías y tajeos
- Datamine · Studio UG: diseño y reservas subterráneas con optimizador de tajeos
- Deswik · Deswik Spatial (CAD): diseño CAD 3D donde cada objeto de diseño (rampa, galería, tajeo, banco) es un registro con atributos espaciales consultables
- Deswik · Deswik ASD: diseño automático de tajeos a partir de las formas optimizadas, generando sólidos listos para editar en el diseñador
- Hexagon · MinePlan 3D: plataforma CAD 3D central que alimenta sondajes, diseño, planificación y voladura
- Maptek · Vulcan: plataforma integrada de topografía, modelamiento, diseño y estimación bajo un mismo motor 3D
- METSIM · Interfaz DXF con AutoCAD (integración): importar y exportar planos DXF
- Micromine · Micromine Beyond: diseño, optimización de pit y programación estratégica sobre una sola base de datos compartida
- Micromine · Micromine Advance: planificación integrada de minas subterráneas metálicas: diseño de labores y programa de producción
- O-Pitblast · CAD, formatos y mapas de calor: herramientas CAD integradas, mapas de calor e intercambio en OBJ, DXF, CSV, TXT y XYZ
- Sandvik · Deswik (ver mapa propio): diseño, programación y plan de corto plazo que dialogan con archivos de Deswik; NOVA para tajo abierto como referencia
