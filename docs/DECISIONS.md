# Decisiones técnicas

- **D-01 · Solo frontend para la demo.** Datos en el navegador (`localStorage`). Permite mostrar el flujo completo sin
  infraestructura. Al pasar a H1 real se necesita backend; el dominio (`src/domain`) no depende de React ni del
  almacenamiento, así que se reusa tal cual.
- **D-02 · Stack.** Vite + React + TypeScript, Tailwind v4, three.js con React Three Fiber, ECharts, zustand, vitest.
- **D-03 · Cálculo pesado en el navegador** por ahora (las fórmulas de la demo son instantáneas). El optimizador de
  tajeos sobre modelo de bloques y la nivelación de recursos deberán evaluarse en un Web Worker o un servicio de
  cálculo cuando existan.
- **D-04 · Mina piloto sintética determinista** (semilla fija), con fecha «ahora» fija en jueves 26-nov-2026 09:40
  para que la demo sea repetible.
- **D-05 · Sin fuentes ni recursos de CDN.** Rótulos 3D con textura de canvas y fuente empaquetada: la vista de tablet
  debe funcionar sin señal.
- **D-06 · Formato numérico de las fichas** (coma decimal, espacio de miles: «2,7 m», «36 450 t»).
- **D-07 · Solver lineal HiGHS (`highs`, WebAssembly).** La ficha 06 pide integrar un solver estándar, no construirlo.
  Se carga con import dinámico solo en Blend UG: el `.wasm` (≈ 4 MB, 1,4 MB comprimido) va como asset local, sin CDN
  (D-05). El modelo (`src/domain/mezcla.ts`) arma texto LP y recibe la función de resolver, así que en el servidor se
  puede cambiar por HiGHS nativo u OR-Tools sin tocarlo.
