# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, Tailwind v4, three.js vía @react-three/fiber, ECharts, zustand. Solo frontend para la demo (decisión del usuario, 2026-11-23); datos sintéticos en el navegador y guardado local.

## Users

- Planeador de corto plazo y jefe de mina subterránea: arman el programa semanal, diario y por guardia en oficina (hoy en Excel y pizarra).
- Jefe de guardia y supervisores de perforación, voladura y sostenimiento: reciben tareas en tablet bajo tierra, a menudo sin señal, y marcan inicio, fin, cantidad y causa de desvío.
- Gerente de mina: ve el cumplimiento plan vs. real.
- Ingenieros de planeamiento de mediano/largo plazo, reservas y diseño (módulos 2–7, aún no construidos).

## Product Purpose

CODEa Planning UG es la familia de planeamiento para minería subterránea de CODEa Mining Studio: diseña la mina, la optimiza y la programa, del largo plazo al turno. Siete módulos: Short-Term Planner UG, Designer UG, Reserves UG, Scheduler UG, Stope Optimizer, Blend UG, Cave Planner. Se construye en ese orden (plan de trabajo v1.0, 2026-11-20). El éxito de la primera entrega: reemplazar el Excel del programa de corto plazo y medir el cumplimiento sin digitar.

## Positioning

Una sola cadena CODEa de plan, ejecución del turno y seguimiento, en español y para minas peruanas, que reemplaza software comercial (Deswik, Datamine, RPMGlobal, Maptek, Hexagon) con fórmulas trazables a su fuente.

## Operating Context

Oficina de planeamiento con monitor grande; tablet bajo tierra con poca luz y sin conexión; reuniones de cumplimiento diario. Vocabulario: labor, frente, guardia, disparo, anillo, sostenimiento, tajeo, ley, cumplimiento, arrastre, re-ingreso.

## Capabilities and Constraints

- Las fichas en `docs/fichas/` dicen QUÉ construir; el plan de trabajo dice el orden. Lo normativo peruano es parámetro configurable "validar con el texto vigente", nunca valor fijo.
- Si Shift no reporta, el cumplimiento queda vacío; no se inventa.
- Esta demo cubre Fase 0 (mina piloto sintética) y el Short-Term Planner UG; los módulos 2–7 aparecen como calculadoras de sus fórmulas.
- Sin backend, roles reales ni integraciones en esta demo.

## Brand Commitments

CODEa Mining Studio: portada del plan de trabajo en casi negro con kicker en coral (`CODEA MINING STUDIO · PLAN DE TRABAJO`), titulares blancos en negrita, encabezados de tabla verde-negro y avisos con borde izquierdo coral. El usuario fijó la dirección "sala de control oscura" sobre esa identidad.

## Evidence on Hand

Solo documentación (PDF del plan, 7 fichas, backlog de 74 issues). No hay datos reales de mina, clientes ni métricas: todo dato visible es de la "Mina piloto UG" sintética y debe rotularse así.

## Product Principles

1. Cada número se puede rastrear hasta su fórmula y su fuente.
2. Vacío antes que inventado.
3. La guardia bajo tierra trabaja igual con o sin señal.
4. Un módulo se cierra probado antes de abrir el siguiente.

## Accessibility & Inclusion

Uso en tablet con guantes y poca luz: objetivos táctiles grandes y contraste alto en la vista de guardia.
