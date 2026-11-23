# Preguntas para el ingeniero de minas

1. **Fuente de verdad.** El plan nombra `CODEa_Mining_Studio_v3.html` como fuente de verdad y no está en la carpeta.
   Se trabajó con `fichas/*.md`. ¿Hay diferencias entre ambos?
2. **Escala de estado de reglas.** El plan define R0 (sin fuente) a R4 (validada por la operación). Se asumió
   R1 = caso resuelto en la ficha, R2 = fuente humana citada, R3 = revisada por el ingeniero. ¿Es correcta?
3. **Umbral de desvío.** Se usó 10 % para exigir causa al cerrar una tarea. ¿Es parámetro por mina o por tipo de tarea?
   ¿Aplica también al sobrecumplimiento?
4. **Tiempo de re-ingreso** tras la voladura: se usaron 45 min fijos por labor. Validar con el reglamento de seguridad
   minera vigente (la ficha lo pide).
5. **Puntaje de asignación.** La ficha da la forma (prioridad + valor − espera) pero no escalas ni pesos. Se usó
   prioridad 1–3 por tipo de labor, valor = pendiente relativo (0–10), espera en horas; pesos 10 / 5 / 2. ¿Qué
   escalas usa la operación?
6. **Arrastre.** ¿El pendiente pasa a la misma guardia del día siguiente (lo implementado) o a la primera guardia
   disponible?
7. **Cumplimiento total** mezclando metros y toneladas: se pondera por número de tareas. ¿Hay un indicador oficial?
8. **Rendimientos vs. plan de la mina piloto.** Un scoop de 55 t/h en una tarea de 3 h mueve 165 t, pero el plan pide
   180–260 t por tajeo; un jumbo de 12 m/h en 9 h perfora 108 m y un frente pide 38 × 3,0 = 114 m. Por eso la
   reoptimización usa límites fijos por tarea (desarrollo 1–2 disparos, tajeo 100–300 t). ¿Cuáles son la capacidad real
   por equipo y por punto de carga?
9. **Metas de la semana.** Se tomó como meta el programa original (t y m) y una ley objetivo de 6,5 g/t. ¿Quién fija
   las metas semanales y la ley que pide la planta? ¿Cuánto pesa cada objetivo en la reoptimización?
