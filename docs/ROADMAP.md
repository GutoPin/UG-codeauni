# Roadmap

Hitos del *Plan de trabajo Planning UG*. Esta entrega es una **demo** pedida para mostrar avance; el plan pide
módulos completos («Nada de MVP»), así que nada de lo de abajo cuenta como hito cerrado hasta cumplir su
definición de hecho (sección 6 del plan) y la aprobación del ingeniero de minas.

| Hito | Módulo | Estado |
|---|---|---|
| H0 | Fase 0 · Fundación | Parcial: repo, pruebas, mina piloto sintética, docs. Falta CI, contratos de datos, motor 3D común, REPORTS.md |
| H1 | Short-Term Planner UG | Demo funcional en navegador (ver abajo) |
| H2 | Designer UG | Demo funcional: labor por tramos, tajeo paramétrico, versiones, visor 3D, DXF/Surpac, entregas (ver abajo) |
| ▶ H3 | Reserves UG | Demo funcional: reservas por tajeo, desarrollo, agregación y versiones (ver abajo) |
| H4 | Scheduler UG | Fórmulas + CPM con mini-Gantt |
| H5 | Stope Optimizer | Fórmulas + selección de formas por DP |
| H6 | Blend UG | Solo fórmulas + calculadora |
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
entrega de la versión publicada a Scheduler UG (actividad y duración) y a Reserves UG (tajeos).

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
