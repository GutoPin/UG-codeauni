# Reglas y fórmulas

Estado: R0 sin fuente · R1 caso resuelto en la ficha · R2 fuente humana citada · R3 revisada por el ingeniero ·
R4 validada por la operación (ver QUESTIONS.md #2). Todas tienen prueba automática con el valor de la ficha
(`src/domain/*.test.ts`). **Ninguna pasa de R1**: falta la fuente humana verificable que pide el plan.

| Módulo | Regla | Implementación | Caso de la ficha | Estado |
|---|---|---|---|---|
| 01 STP | Cumplimiento = real / plan × 100; sin reporte = vacío | `stp.cumplimiento` | 36 / 45 → 80 % | R1 |
| 01 STP | Avance por disparo = barreno × eficiencia | `stp.avancePorDisparo` | 3,0 × 0,90 → 2,7 m | R1 |
| 01 STP | Tonelaje de avance = sección × avance × densidad | `stp.tonelajeAvance` | 18 × 2,7 × 2,8 → 136 t | R1 |
| 01 STP | Capacidad de equipo = horas × rendimiento | `stp.capacidadEquipo` | 9 h × 12 → 108 m | R1 |
| 01 STP | Disparos por guardia = ⌊horas / ciclo⌋ | `stp.disparosPorGuardia` | | R1 |
| 01 STP | Habilitación: ventilación, sostenimiento, equipo, re-ingreso | `stp.estaHabilitada` | | R1 · validar con el texto vigente |
| 01 STP | Un equipo no puede estar en dos tareas solapadas | `stp.conflictosEquipo` | | R1 |
| 01 STP | Arrastre: pendiente = plan − real si > 0, se suma al siguiente | `stp.arrastrarPendientes` | 9 m arrastrados | R1 |
| 01 STP | Puntaje = prioridad + valor − espera (ponderados) | `stp.puntajeTarea` | | R0 escalas |
| 01 STP | Cola sin señal idempotente por id, hora local | `stp.aplicarCola` | sin duplicados | R1 |
| 02 Designer | Herradura A = w hₚ + π w²/8 | `modulos.areaHerradura` | 4 × 3 → 18,28 m² | R1 |
| 02 Designer | Gradiente, desnivel con máximo, curva de rampa | `gradiente`, `desnivelRampa`, `curvaRampa` | R15 180° 12 % → 47,1 m / 5,65 m | R1 |
| 02 Designer | Tonelaje de bloque y tajeo; interferencia | `tonelajeBloque`, `tonelajeTajeo`, `hayInterferencia` | 17 400 t | R1 |
| 03 Reserves | Ancho de minado, dilución, diluido, recuperado | `anchoMinado` … `mineralRecuperado` | 1 250 t a 6,4 g/t | R1 |
| 03 Reserves | Ley de corte = costo / (precio × recuperación) | `leyCorte` | 1,79 g/t | R1 |
| 03 Reserves | Pilar dejado | `pilar` | 1 566 / 14 094 t | R1 |
| 04 Scheduler | Duración; CPM fin-inicio con rechazo de ciclos | `duracion`, `cpm` | 31,4 d; A-C-D 11 d | R1 |
| 05 Stope | Ley de corte de equilibrio; dilución ELOS | `leyCorteEquilibrio`, `dilucionELOS` | 1,12 g/t; 1 120 t | R1 |
| 05 Stope | Formas sin traslape por DP; esfuerzo de pilar | `seleccionarFormas`, `esfuerzoPilar` | {1,3} = 22; FS 1,5 | R1 |
| 06 Blend | Ponderado; pique; camiones; chimenea | `ponderado` … `ingresoChimenea` | 6,6 g/t; 459 t; 4; 100 t | R1 |
| 07 Cave | Tonelaje de columna; radio hidráulico | `tonelajeColumna`, `radioHidraulico` | 36 450 t; 50 m | R1 |
