// Solver lineal estándar (HiGHS compilado a WebAssembly, ficha 06: «integrar, no construir»). Se carga solo al usarlo.
import type { Highs } from 'highs'

let cargado: Promise<Highs> | null = null
export const cargarSolver = () =>
  (cargado ??= Promise.all([import('highs'), import('highs/runtime?url')]).then(([m, wasm]) => m.default({ locateFile: () => wasm.default })))
