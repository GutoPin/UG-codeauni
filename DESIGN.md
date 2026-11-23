---
name: CODEa Planning UG
description: Sala de control oscura para el planeamiento de minería subterránea; el plano de mina es la interfaz de estado.
colors:
  suelo: "#111615"
  panel: "#171f1d"
  panel-2: "#1d2624"
  filete: "#29332f"
  filete-2: "#364240"
  tinta: "#e9eeec"
  tinta-2: "#a9b5b1"
  tinta-3: "#84918d"
  coral: "#e8735a"
  coral-hondo: "#d9603f"
  coral-claro: "#f08a73"
  tinta-sobre-coral: "#1a0d09"
  azul: "#3987e5"
  aqua: "#199e70"
  bien: "#2bb52b"
  alerta: "#fab219"
  critico: "#ff5470"
  ley-baja: "#3a2620"
  ley-alta: "#ffa27f"
typography:
  titulo-pantalla:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 640
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 87.5"
  titulo-tarjeta:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 640
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 87.5"
  titulo-panel:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 640
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 87.5"
  cuerpo:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  nota:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  rotulo:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 560
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 87.5"
rounded:
  sm: "3px"
  base: "4px"
spacing:
  unidad: "3.5px"
  xs: "5.25px"
  sm: "8.75px"
  md: "14px"
  lg: "21px"
components:
  boton-pri:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.tinta-sobre-coral}"
    rounded: "{rounded.base}"
    height: "28px"
    padding: "0 10.5px"
  boton-pri-hover:
    backgroundColor: "{colors.coral-claro}"
  boton-sec:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.base}"
    height: "28px"
    padding: "0 10.5px"
  boton-fant:
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.base}"
    height: "28px"
    padding: "0 10.5px"
  boton-fant-hover:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.tinta}"
  boton-guardia:
    height: "48px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.base}"
  panel-cabecera:
    height: "38.5px"
    padding: "0 14px"
    typography: "{typography.titulo-panel}"
  segmento-activo:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    height: "24.5px"
  campo:
    backgroundColor: "{colors.suelo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.base}"
    height: "31.5px"
  enlace-nav-activo:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.base}"
    height: "28px"
---

# Design System: CODEa Planning UG

## Overview

**Creative North Star: "La sala de control de la mina"**

Un tablero de turno, no un panel de ventas. El suelo es casi negro verdoso, como la portada del plan de trabajo de CODEa; encima, paneles planos separados por filetes de 1px, texto claro y cifras tabulares. La mina misma (sección longitudinal y visor 3D) es la superficie donde se lee el estado: cada labor y tajeo lleva su cumplimiento en el lugar donde está, en lugar de resumirse en tarjetas de KPI.

La densidad es alta y deliberada: el planeador trabaja en un monitor grande, a 13px, con tablas y rótulos semicondensados. La excepción es la vista de guardia en tablet, que se agranda (botones de 48px, cifras de 28px) porque se usa con guantes y poca luz. El color es escaso y con oficio fijo: coral para lo que se hace, azul/aqua para lo que se mide, tres estados para lo que va bien o mal.

**Key Characteristics:**
- Fondo oscuro tonal en tres capas (suelo, panel, panel-2), sin sombras decorativas.
- La sección longitudinal de la veta como pieza firma, presente en Inicio y como minimapa en Programa.
- Estados siempre con color + ícono + texto.
- Coral solo para acción, selección, foco y "ahora".
- Cifras en estilo SI (`fr-FR`): coma decimal y espacio de miles.

## Colors

Un verde-negro casi monocromo con un único acento cálido y una pareja fría para datos. Solo suelo…critico son tokens `@theme` (`--color-*`, clases `bg-*`/`text-*`); coral-claro, tinta-sobre-coral y la rampa de ley son literales en `kit.tsx` y `Mina3D.tsx`, no existen como clases.

### Primary
- **Coral CODEa** (coral): botón primario, ícono del enlace de navegación activo, anillo de foco (`:focus-visible`, 2px, offset 2px), interruptores y casillas (`accent-coral`), borde del campo enfocado, borde de la guardia en curso y marcador "ahora" del Gantt. Su versión clara (coral-claro) es el hover del primario; la selección de texto usa coral al 45%.
- **Coral hondo** (coral-hondo): definido en el tema; hoy sin uso en pantallas.

### Secondary
- **Azul de serie** (azul): serie única por defecto (barras de Pareto, progreso de la tarea en tablet, ruta crítica, puntaje de reprogramación), desarrollo (m) y guardia día. Su tinte al 15% marca la etiqueta "En curso".
- **Aqua de serie** (aqua): segunda serie: producción (t) y guardia noche. Validada en pareja con azul sobre el panel.

### Tertiary
- **Estados** (bien, alerta, critico): umbrales fijos de cumplimiento: ≥ 90 % en meta, 70–90 % bajo meta, < 70 % crítico, y "sin reporte" en tinta-3. Crítico es un rojo frío, lejos del coral de acción. Alerta también marca labores no habilitadas y marcas en cola sin señal.
- **Rampa de ley** (ley-baja → ley-alta): ley de Au en un solo tono cálido, solo sobre el campo de bloques 3D y su leyenda (2,5–11 g/t).

### Neutral
- **Suelo** (suelo): fondo de la app, barra lateral, interior de campos y del grupo de segmentos, fondo del canvas 3D y de su niebla.
- **Panel** (panel): superficie de todo contenedor; también el color del borde de las barras de gráfico.
- **Panel-2** (panel-2): capa elevada tonal: enlace activo, segmento activo, botón secundario, tooltip de gráfico.
- **Filete / Filete-2** (filete, filete-2): divisores y bordes de panel; filete-2 para bordes de controles, ejes de gráfico y labores fuera de programa en la sección.
- **Tinta 1–3** (tinta, tinta-2, tinta-3): texto principal, secundario (detalles, leyendas, etiquetas de eje de categoría) y terciario (rótulos, notas, eje numérico, "sin reporte").

### Named Rules
**The Coral Hace Rule.** Coral significa "puedes actuar aquí" o "esto está seleccionado / es ahora". Nunca es una serie de datos ni un estado.

**The Serie Fría Rule.** Toda serie de datos es azul (primera) o aqua (segunda); el texto del gráfico va en tintas, nunca en color de serie.

**The Nunca Solo Color Rule.** Un estado se muestra con su color, su ícono (ok, alerta, x, nube) y su cifra o texto; la sección longitudinal dibuja el mismo trazo de ícono dentro del tajeo.

## Typography

**Display Font:** Archivo Variable, eje de ancho (con system-ui, sans-serif)
**Body Font:** Archivo Variable (misma familia, ancho normal)

**Character:** Una sola familia con dos voces: semicondensada (ancho 87,5%, peso 640) para títulos y rótulos, como en los planos y rótulos de mina; ancho normal para el cuerpo. Cifras tabulares en toda la app.

### Hierarchy
- **Título de pantalla** (640, 26px, ancho 87,5%): una vez por pantalla, en la Cabecera, con su línea de contexto (semana, guardia, hora) en 13px tinta-2.
- **Título de tarjeta** (640, 19px): marca de la barra lateral y nombre de labor en la tarjeta de guardia.
- **Título de panel** (640, 15px): cabecera de cada Panel y rótulos superpuestos al 3D.
- **Cuerpo** (400, 13px, 1.45): tablas, listas, navegación. La raíz es 14px; casi todo el contenido se fija en 13px.
- **Nota** (400, 12px y 11.5px): detalles bajo una línea, leyendas, notas al pie del panel.
- **Rótulo** (560, 11.5px, 0.04em, MAYÚSCULAS, tinta-3): encabezados de columna de tabla, grupos de la barra lateral y etiquetas de campo.

### Named Rules
**The Cifra SI Rule.** Todo número visible pasa por `fmt` (`toLocaleString('fr-FR')`): `36 450 t`, `2,7 m`, `87 %`; nulo se escribe `—`, nunca 0. Fechas con `Intl.DateTimeFormat('es-PE')`.

## Layout

La raíz mide 14px, así que la escala de espaciado de Tailwind avanza en pasos de 3,5px (`p-4` = 14px). Rejilla de app: barra lateral fija de 232px y área de trabajo con scroll propio; bajo 900px la barra lateral se oculta. Las pantallas usan una rejilla de 12 columnas con gutter de 14px y márgenes laterales de 21px; Inicio reparte 7/5 (3D / sección) y abajo 5/4/3, que colapsan a 12 columnas bajo 1200px y a una sola bajo 760px. Ritmo interno: 14px de relleno horizontal en paneles, 8,75px vertical en filas de tabla y lista, 5–7px entre elementos pequeños. El visor 3D mide 520px de alto (420px bajo 1200px).

## Elevation & Depth

Plano por defecto: la profundidad se da por capas tonales (suelo → panel → panel-2) y filetes de 1px, no por sombras. Las únicas sombras son funcionales: el segmento activo lleva una sombra mínima de contacto, y las capas flotantes sobre el 3D usan suelo al 80–90% con desenfoque de fondo. La luz y el brillo viven en la escena 3D (emisivos), no en la interfaz.

### Shadow Vocabulary
- **Contacto de segmento** (`box-shadow: 0 1px 2px rgb(0 0 0 / .4)`): solo la opción activa de Segmentos.

### Named Rules
**The Sin Sombra Rule.** Ningún panel ni botón lleva sombra; si algo necesita separarse, sube una capa tonal o gana un filete.

## Shapes

Esquinas casi rectas (clases `rounded` = 4px y `rounded-sm` = 3px; no usar `rounded-md`, que es el valor por defecto de Tailwind): 4px en paneles, botones, campos y capas flotantes; 3px en segmentos, chips de estado, celdas de guardia y barras. Lo redondo completo solo en el interruptor del Visor. Bordes de 1px siempre en tokens de filete. Los íconos se dibujan a mano en caja de 20 con trazo 1,5, extremos y uniones redondeados.

## Components

### Buttons
- **Shape:** esquinas suaves (4px), 28px de alto, 10,5px de relleno, 13px, ícono de 14px + texto con 7px de separación.
- **Primary (pri):** fondo coral, texto casi negro cálido, seminegrita; hover a coral-claro. Uno por zona: la acción principal de la pantalla ("Abrir programa semanal", "Iniciar tarea", "Confirmar cierre").
- **Secondary (sec):** fondo panel-2, borde filete-2, texto tinta; hover sube el borde a tinta-3.
- **Ghost (fant):** sin fondo, tinta-2; hover a tinta sobre panel-2.
- **Hover / Focus:** transición de color de 150ms; foco con anillo coral de 2px; deshabilitado al 40% sin eventos.
- **Guardia (tablet):** los mismos botones a 48px de alto y 15px.

### Chips
- **Estado de tarea:** 12px seminegrita, 3px, relleno 7×3,5px: Pendiente (suelo, tinta-3), En curso (azul 15%, texto azul claro), Cerrada (panel-2, tinta-2).
- **Pct:** el componente de cumplimiento: ícono de estado de 12px + cifra seminegrita + texto opcional ("En meta", "Bajo meta", "Crítico", "Sin reporte"), todo en el color del estado.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** panel, borde filete.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Cabecera:** 38,5px, título de panel a la izquierda, acción o dato breve a la derecha, filete inferior.
- **Internal Padding:** 14px horizontal.
- **Tarjeta de guardia (tablet):** borde filete-2, cerrada al 70% de opacidad.

### Inputs / Fields
- **Style:** fondo suelo, borde filete-2, 4px; 28–31,5px en oficina, 48px en tablet. Los números se escriben con coma decimal.
- **Focus:** el borde pasa a coral.
- **Segmentos:** grupo radio sobre suelo con filete; opción activa en panel-2 con la sombra de contacto, inactivas en tinta-3.

### Navigation
- Barra lateral sobre suelo: marca "CODE**a** Planning UG" (la "a" en coral), grupos con rótulo, enlaces de 28px con ícono de 14px. Activo: panel-2, texto tinta, ícono coral. Hover: panel, tinta. Contadores a la derecha (marcas en cola en alerta con ícono sin señal, "Ola n" y "H1" en tinta). Pie con estado de señal (nube en bien / sin señal en alerta) y el aviso de datos sintéticos.

### Tablas
- Rótulos en mayúsculas semicondensadas como encabezado, filas con filete superior, cifras alineadas a la derecha, totales como última fila en seminegrita o `<tfoot>`, nunca como franja de tarjetas.

### Sección longitudinal (firma)
El plano que el planeador lee todos los días, usado como mapa de estado. Niveles NV 3900–3750 como renglones de trazo punteado en filete con su rótulo a la izquierda; tajeos como cajas de 2px de radio y labores de desarrollo como trazos. Las piezas del programa toman el color de su estado (relleno al 20%, trazo de 1px, con ícono de estado y cifra en 15px), las de fuera del programa van en filete-2 al 6%. Selección: relleno al 45% y trazo de 2px (desarrollo 5px). Responde a hover y clic, es enfocable con teclado y cada pieza tiene `aria-label` con nombre y cumplimiento. Hover y selección se sincronizan con el visor 3D.

### Visor 3D
- Fondo y niebla en suelo; luz ambiental más una clave cálida y un contraluz frío tenue.
- **Estado vs. ley:** el estado vive en tajeos y galerías casi opacos y emisivos (0,55–0,6; seleccionado 0,9–1); la ley vive en el campo mate de bloques detrás (opacidad 0,55, sin escritura de profundidad). Lo que está fuera de programa queda gris (#55625f) y casi apagado.
- Rótulos de nivel como sprites de canvas en tinta-2 (sin fuentes de red: la app abre sin señal).
- Rotación automática lenta (0,35), con amortiguación y límites de distancia; clic en vacío limpia la selección.
- Encima del canvas, solo capas de suelo translúcido con filete: título e instrucciones arriba a la izquierda, ficha de la labor abajo a la izquierda, leyenda de ley abajo a la derecha.

### Gráficos (ECharts)
Renderizador SVG, tema base con texto en tintas, ejes en filete-2, rejilla en filete, sin marcas de eje, tooltip en panel-2. Series en azul y aqua; meta como línea discontinua en tinta-3; barras con borde del color del panel.

## Do's and Don'ts

### Do:
- **Do** leer el cumplimiento sobre la mina (sección longitudinal, 3D, celdas de guardia) antes que en cualquier resumen.
- **Do** mostrar cada estado con `Pct` o el trazo de su ícono: color + ícono + cifra o texto.
- **Do** formatear toda cifra con `fmt` (fr-FR) y dejar `—` cuando Shift no reportó.
- **Do** usar azul para la primera serie y aqua para la segunda, en todos los gráficos y barras.
- **Do** separar capas por tono (suelo, panel, panel-2) y filetes de 1px.
- **Do** agrandar los controles de la vista de guardia por encima de los de oficina (hoy 48px, 15px).
- **Do** rotular visiblemente todo dato como de la "Mina piloto" sintética.

### Don't:
- **Don't** armar franjas de tarjetas de métrica con número grande; los totales van en una fila de tabla.
- **Don't** usar coral para datos, estados o decoración.
- **Don't** usar la rampa de ley fuera del campo de bloques y su leyenda; comparte tonos cálidos con alerta y crítico.
- **Don't** poner sombras en paneles ni botones.
- **Don't** cargar fuentes, íconos ni recursos de red: la guardia trabaja sin señal.
- **Don't** usar el rótulo en mayúsculas como antetítulo sobre los títulos de panel o de gráfico; es para encabezados de columna, grupos de navegación y etiquetas de campo.
