# Roadmap

Hitos del *Plan de trabajo Planning UG*. Esta entrega es una **demo** pedida para mostrar avance; el plan pide
módulos completos («Nada de MVP»), así que nada de lo de abajo cuenta como hito cerrado hasta cumplir su
definición de hecho (sección 6 del plan) y la aprobación del ingeniero de minas.

| Hito | Módulo | Estado |
|---|---|---|
| H0 | Fase 0 · Fundación | Parcial: repo, pruebas, mina piloto sintética, docs. Falta CI, contratos de datos, motor 3D común, REPORTS.md |
| H1 | Short-Term Planner UG | Demo funcional en navegador (ver abajo) |
| H2 | Designer UG | Demo funcional: labor por tramos, tajeo paramétrico, versiones, visor 3D, DXF/Surpac, entregas (ver abajo) |
| H3 | Reserves UG | Demo funcional: reservas por tajeo, desarrollo, agregación y versiones (ver abajo) |
| H4 | Scheduler UG | Demo funcional: programa nivelado desde Reserves y Designer, Gantt, plan mensual, escenarios (ver abajo) |
| H5 | Stope Optimizer | Demo funcional: formas sobre el modelo de bloques, pilares, escenarios, conversión a Designer (ver abajo) |
| ▶ H6 | Blend UG | Demo funcional: mezcla por guardia con solver HiGHS, transporte y chimenea, costos sombra, escenarios, aprobación y CSV (ver abajo) |
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

Hecho después: proyecto con versiones (borrador, congelada, publicada; una congelada no se edita) y comparación entre
versiones; edición del eje en planta (arrastrar vértice cambia largo o giro del tramo, insertar, reordenar, quitar);
cruces con labores existentes (intersección propuesta, pilar mínimo, atraviesa tajeo) y autocruce; diseños en el visor 3D
(borrador translúcido); exportación DXF R12 (ejes 3D y contornos cerrados de tajeo) con lectura de ida y vuelta ≤ 1 mm
probada, strings de Surpac (.str, formato del apéndice de Surpac) y CSV de atributos; plano impreso A3 de la pantalla;
entrega de la versión publicada: Reserves UG evalúa sus tajeos; para Scheduler UG se calcula la actividad y su duración
(panel «Entregas» en Proyecto); Programa de mina (H4) toma el desarrollo publicado como actividad con sus propias tasas.

Falta: vértices libres (el eje es una cadena de tramos tangentes: arrastrar solo cambia largo o giro), suavizado,
intersecciones con geometría propia (hoy solo se señalan), consultas espaciales, servicios, OMF, importar DXF/Surpac a un
diseño editable, validar los archivos con Deswik y Surpac reales, plano con rótulo y escala normalizados, diseño automático
desde Stope Optimizer.

## H3 · Reserves UG: qué hay y qué falta

Hecho (demo): parámetros por método (corte y relleno, taladros largos: ancho mínimo, sobre-rotura, recuperación, pilar,
costo) y económicos, ley de corte por método; evaluación de los 8 tajeos de la mina piloto y de los tajeos publicados por
Designer UG contra el modelo de bloques (ancho de minado, dilución, diluido, pilar, recuperado, metal), acceso desde una
galería de nivel, categoría por la regla «la más baja»; labores de desarrollo a mineral o desmonte con ley de corte
marginal; agregación por nivel, método y categoría; versiones congeladas con sus parámetros y comparación con causa por
tajeo; exportación CSV.

Falta: categoría real desde Resource UG (hoy supuesto x ≤ 260 m), ley equivalente multimetal, optimizador de tajeos,
agregación por periodo (necesita Scheduler UG), conciliación con Reconcile, reporte PDF/Excel con estructura de código
internacional, aprobación por rol, modo tablet sin señal, publicación a Scheduler UG y NPV Analyzer. Ver QUESTIONS.md 10–12.

## H4 · Scheduler UG: qué hay y qué falta

Hecho (demo): actividades enlazadas por id a Designer UG (desarrollo publicado) y a Reserves UG (por tajeo en reserva:
preparación → producción → relleno en corte y relleno; el tajeo superior espera al inferior que se le traslapa); duración =
cantidad / (tasa × disponibilidad); CPM fin-inicio con desfase, holguras y rechazo de ciclos; nivelación serial con recursos
finitos (prioridad = oro por día de scoop, desempate por holgura) sobre un calendario con feriados; Gantt con filtro por nivel,
ruta crítica y espera por recurso; utilización mensual por recurso y cuello de botella; plan por mes prorrateado por días
(desarrollo, planta, ley, oro, desmonte, relleno); escenarios aprobados con comparación y actividades marcadas cuando cambia
el diseño enlazado; CSV con columnas de MS Project.

Falta: dependencias inicio-inicio y fin-fin, actividades manuales e hitos, plantillas por método, Gantt editable (arrastre,
zoom), turnos y calendarios 14 × 7, acarreo y movimiento de material, capacidad de chancado e izaje, optimización por VAN,
mezclas con Blend UG, animación 3D del plan, importar de MS Project/Excel, entrega del plan mensual a Short-Term Planner UG,
prueba con 2 000 actividades en menos de 10 s y comparación de la ruta crítica con MS Project. Ver QUESTIONS.md 14–15.

## H5 · Stope Optimizer: qué hay y qué falta

Hecho (demo): columnas de 5 m del modelo de bloques evaluadas con el mismo cálculo de Designer y Reserves (la forma
convertida da el mismo tonelaje); una fila por nivel con piso 5 m sobre la galería; formas candidatas por inicio y largo
(L mín–L máx) con ley diluida ≥ corte (equilibrio o manual), valor positivo con costo fijo de acceso y acceso desde la
galería; selección exacta por fila con programación dinámica y pilar mínimo, sin tocar tajeos ya diseñados; ancho mínimo
del método con su dilución; pilares por área tributaria con FS y ancho recomendado; escenarios precio × ley de corte,
curvas de toneladas y valor por corte, corridas congeladas; comparación con la disposición actual; CSV; conversión de una
forma a tajeo en borrador de Designer UG con su método asignado en Reserves UG.

Falta: subniveles dentro de un nivel (hoy una fila por nivel, porque Reserves exige acceso a ≤ 10 m de la galería),
consolidación 3D entre niveles y suavizado (con rectángulos en malla de 5 m no hay contorno que suavizar), potencia
variable de la veta (la mina piloto tiene 5 m constantes, así que el ancho mínimo solo muerde con taladros largos),
ELOS por dominio geotécnico, cámaras y pilares, accesos y subniveles generados desde la forma, visor 3D por valor,
exportar sólidos DXF/OMF desde aquí (Designer ya exporta DXF), importar formas de Datamine MSO o Deswik SO, prueba con
200 000 bloques y comparación del valor contra una hoja de referencia (±1 %). Ver QUESTIONS.md 16–17.


## H6 · Blend UG: qué hay y qué falta

Hecho (demo): modelo lineal por guardia resuelto con HiGHS (WebAssembly, cargado solo en la pantalla) sobre las guardias
abiertas de la semana del STP; fuentes = lo que el STP planea volar en tajeos y frentes con ley, solo con la labor
habilitada, más un acopio de interior y la carga que ya está en la chimenea; lo volado que no sale espera en el tajeo y
el mineral de frente se limpia en la guardia a planta o a desmonte; límites de planta (capacidad, alimentación mínima,
ley mín./máx., dureza, arsénico); pique (t/h × horas × disponibilidad), camiones de bajo perfil y chimenea de traspaso
con nivel, capacidad y salida por guardia; objetivos metal, desvío de ley o costo de transporte; restricciones activas
con costo sombra (duales de HiGHS; probado contra re-resolver con el límite aflojado); si no hay plan que cumpla, se
resuelve con holguras penalizadas y se nombra qué límite se rompe y dónde; escenarios «sin cada fuente»; fuentes
agotadas o fuera; alertas de agotamiento y chimenea llena; plan de la próxima guardia; guardias cerradas fijas con el
real reportado o «sin reporte»; aprobación con justificación obligatoria si rompe límites y CSV exportado desde la copia
aprobada.

Falta: horizonte mensual y semanal además de guardia, versión de reservas elegida, red de labores con varias chimeneas,
tolvas y límite por hora, orden FIFO dentro de la chimenea (hoy el solver elige qué carga sale), regla «no mezclar dos
tajeos de contaminante alto en la misma guardia» (necesita variables enteras, sin duales), destinos acopio y relleno,
cadena mina a mercado y penalidades de contrato, re-optimización por guardia con lo extraído, comparación real contra
plan de ley, cola sin señal en tablet, entrega al STP y a Scheduler (hoy el plan aprobado no lo consume ningún módulo) y
exportación con el formato real de Metso DPM. El mineral puede pasar por la chimenea en la misma guardia, así que su
capacidad casi nunca limita con estos datos; «Reiniciar demo» no borra la mezcla. Ver QUESTIONS.md 19–20.
