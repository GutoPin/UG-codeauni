import { Edges, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { AHORA, GUARDIA_ACTUAL, inicioGuardia, LABORES, LABORES_SEMANA, NIVELES, generarBloques, type Bloque, type Labor, type Tarea } from '../data/minaPiloto'
import { fmt, laborDe, type Nivel } from '../derive'
import { useStore } from '../store'
import { resumen, useDisenos, type Datos } from '../disenos'
import { areaSeccion, centroTajeo, ejeDeTramos } from '../domain/designer'
import { estadoDiseno, ultima } from '../domain/versiones'
import FichaLabor, { modeloEquipo } from './FichaLabor'

const CX = 180
const CZ = 3825
/** coordenadas de mina (x rumbo, y transversal, z cota) → escena (x, y arriba, z) */
const p = (x: number, y: number, z: number) => new THREE.Vector3(x - CX, z - CZ, -y)

export const LEY_MIN = 2.5
export const LEY_MAX = 11
const BAJA = new THREE.Color('#3a2620')
const ALTA = new THREE.Color('#ffa27f')
export const colorLey = (ley: number) =>
  BAJA.clone().lerp(ALTA, Math.min(1, Math.max(0, (ley - LEY_MIN) / (LEY_MAX - LEY_MIN))))

const NIVEL_HEX: Record<Nivel, string> = { bien: '#2bb52b', alerta: '#fab219', critico: '#ff5470', vacio: '#84918d' } // mismos valores que los tokens de index.css
const INACTIVA = '#4a5552'
const CORAL = '#e8735a'
const TINTA = '#e9eeec'

export type Vista = '3d' | 'frente' | 'planta'
/** dirección desde la que mira cada vista; la distancia se ajusta al tamaño del panel */
const VISTAS: Record<Vista, THREE.Vector3> = { '3d': new THREE.Vector3(0.42, 0.34, 1), frente: new THREE.Vector3(0, 0.06, 1), planta: new THREE.Vector3(0.1, 1, 0.75) }
const OBJETIVO = new THREE.Vector3(-10, 22, 20)
const MEDIO_ANCHO = 300 // el bloque de roca mide ~610 m de largo y ~300 m de alto con la superficie
const MEDIO_ALTO = 175
const FOV = 38
const posVista = (v: Vista, aspecto: number) => {
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const d = 1.04 * Math.max(MEDIO_ALTO / t, MEDIO_ANCHO / (t * aspecto))
  return OBJETIVO.clone().add(VISTAS[v].clone().normalize().multiplyScalar(v === 'planta' ? d * 1.15 : d))
}

type Foco = { tipo: 'labor'; id: string } | { tipo: 'bloque'; b: Bloque } | { tipo: 'equipo'; t: Tarea } | { tipo: 'diseno'; nombre: string; estado: string; datos: Datos } | null

const centroLabor = (l: Labor) => {
  if (l.caja) {
    const [x0, x1, z0, z1] = l.caja
    return p((x0 + x1) / 2, 3 * Math.sin((z0 + z1) / 60), (z0 + z1) / 2)
  }
  return new THREE.Box3().setFromPoints(l.eje!.map(([x, y, z]) => p(x, y, z))).getCenter(new THREE.Vector3())
}
/** dónde se para el equipo: el frente de avance (último punto del eje) o el techo del tajeo */
const puestoEquipo = (l: Labor) => {
  if (l.caja) {
    const [x0, x1, z0, z1] = l.caja
    return p((x0 + x1) / 2, -18, (z0 + z1) / 2) // delante de la cara del tajeo
  }
  const [x, y, z] = l.eje!.at(-1)!
  return p(x, y, z + 7)
}

// ─── roca que envuelve la mina ───────────────────────────────────
// Bloque de roca en corte: se dibujan solo las caras interiores (BackSide), así que
// desde cualquier ángulo se ven el fondo, el piso y los costados, nunca la cara que tapa la mina.
const ROCA = { x0: -130, x1: 480, y0: -110, y1: 50, z0: 3700, z1: 3960 } // coordenadas de mina
const nada = () => null // la roca no participa del puntero

/** Textura de roca: estratos ondulados, granos y fracturas; `suelo` agrega la capa de tierra arriba. */
function texturaRoca(suelo: boolean) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const g = c.getContext('2d')!
  let semilla = suelo ? 7 : 3
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647)
  g.fillStyle = '#5a5047'
  g.fillRect(0, 0, c.width, c.height)
  for (let k = 0; k < 26; k++) {
    // estratos
    const y = azar() * c.height
    const alto = 6 + azar() * 34
    g.fillStyle = azar() > 0.5 ? 'rgba(150,128,104,0.22)' : 'rgba(20,14,10,0.28)'
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= c.width; x += 32) g.lineTo(x, y + Math.sin(x / 140 + k) * 10)
    for (let x = c.width; x >= 0; x -= 32) g.lineTo(x, y + alto + Math.sin(x / 120 + k * 2) * 8)
    g.fill()
  }
  for (let i = 0; i < 9000; i++) {
    // granos
    const v = 50 + azar() * 90
    g.fillStyle = `rgba(${v + 10},${v},${v - 8},${0.18 + azar() * 0.3})`
    g.fillRect(azar() * c.width, azar() * c.height, 1 + azar() * 3, 1 + azar() * 2.5)
  }
  g.strokeStyle = 'rgba(8,6,5,0.55)'
  for (let i = 0; i < 60; i++) {
    // fracturas
    let x = azar() * c.width
    let y = azar() * c.height
    g.lineWidth = 0.6 + azar() * 1.4
    g.beginPath()
    g.moveTo(x, y)
    for (let j = 0; j < 6; j++) g.lineTo((x += (azar() - 0.5) * 60), (y += (azar() - 0.3) * 40))
    g.stroke()
  }
  if (suelo) {
    // capa de tierra y cobertura en la parte alta del corte
    const grad = g.createLinearGradient(0, 0, 0, 34)
    grad.addColorStop(0, '#5a4a36')
    grad.addColorStop(1, 'rgba(70,56,40,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, 34)
    g.fillStyle = '#4d5a3c'
    g.fillRect(0, 0, c.width, 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Roca({ ligero }: { ligero: boolean }) {
  const mats = useMemo(() => {
    const muro = texturaRoca(true)
    const piso = texturaRoca(false)
    const m = (t: THREE.Texture) => new THREE.MeshStandardMaterial({ map: t, bumpMap: ligero ? null : t, bumpScale: 2.5, roughness: 1, side: THREE.BackSide })
    const lado = m(muro)
    // la roca que queda entre la cámara y la mina, translúcida: se ve la mina "dentro" del cerro
    const velo = new THREE.MeshStandardMaterial({ map: muro, roughness: 1, transparent: true, opacity: 0.2, depthWrite: false })
    // orden de caras de BoxGeometry: +x, -x, +y (techo), -y (piso), +z, -z
    return { interior: [lado, lado, m(piso), m(piso), lado, lado], velo }
  }, [ligero])
  const { x0, x1, y0, y1, z0, z1 } = ROCA
  const centro = p((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return (
    <group position={centro}>
      <mesh material={mats.interior} receiveShadow raycast={nada}>
        <boxGeometry args={[x1 - x0, z1 - z0, y1 - y0]} />
      </mesh>
      {/* se dibuja después de los tajeos translúcidos y desaparece si la cámara entra al cerro */}
      <mesh material={mats.velo} renderOrder={5} raycast={nada} visible={!ligero}>
        <boxGeometry args={[x1 - x0 + 1, z1 - z0 + 1, y1 - y0 + 1]} />
      </mesh>
    </group>
  )
}

/** Relieve de la superficie, en malla tenue: recuerda que todo lo demás está bajo tierra. */
function Superficie() {
  const geo = useMemo(() => {
    const { x0, x1, y0, y1 } = ROCA
    const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0, 61, 16)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, 22 + 16 * Math.sin(x / 75) + 9 * Math.cos(z / 30 + x / 140) + 5 * Math.sin((x - z) / 23))
    }
    return g
  }, [])
  const { x0, x1, y0, y1, z1 } = ROCA
  return (
    <group position={p((x0 + x1) / 2, (y0 + y1) / 2, z1)}>
      <mesh geometry={geo} raycast={nada}>
        <meshBasicMaterial color="#6f7d6a" wireframe transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <Rotulo3D texto="Superficie" position={new THREE.Vector3((x1 - x0) / 2 - 70, 52, 0)} alto={8} />
    </group>
  )
}

/** Luminarias cada ~18 m en el techo de las galerías y la rampa. */
function Lamparas() {
  const geo = useMemo(() => {
    const pts: number[] = []
    for (const l of LABORES) {
      if (!l.eje || l.tipo === 'Chimenea' || l.tipo === 'Crucero') continue
      const ps = l.eje.map(([x, y, z]) => p(x, y, z))
      const curva = ps.length > 2 ? new THREE.CatmullRomCurve3(ps) : new THREE.LineCurve3(ps[0], ps[1])
      const n = Math.floor(curva.getLength() / 18)
      for (let i = 1; i < n; i++) {
        const v = curva.getPointAt(i / n)
        pts.push(v.x, v.y + 3.4, v.z)
      }
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }, [])
  return (
    <points geometry={geo} raycast={nada}>
      <pointsMaterial color="#ffd49a" size={2.6} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  )
}

/** Paredes irregulares: mueve cada vértice un poco según su posición (los vértices repetidos se mueven igual). */
function labrar(g: THREE.BufferGeometry) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const h = Math.sin(Math.round(x * 3) * 12.9898 + Math.round(y * 3) * 78.233 + Math.round(z * 3) * 37.719) * 43758.5453
    const d = (h - Math.floor(h) - 0.5) * 0.7
    pos.setXYZ(i, x + d, y + d * 0.6, z - d)
  }
  g.computeVertexNormals()
  return g
}

// ─── piezas de la escena ─────────────────────────────────────────

interface Comun {
  onFoco: (f: Foco) => void
  onSelect?: (id: string) => void
}
const eventosLabor = (id: string, { onFoco, onSelect }: Comun) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    onFoco({ tipo: 'labor', id })
  },
  onPointerOut: () => {
    document.body.style.cursor = ''
    onFoco(null)
  },
  onClick: (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect?.(id)
  },
})

function Veta({ tenue, onFoco }: { tenue: boolean; onFoco: Comun['onFoco'] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const bloques = useMemo(() => generarBloques().filter((b) => b.ley >= LEY_MIN), [])
  const [sobre, setSobre] = useState<number | null>(null)
  useLayoutEffect(() => {
    const m = ref.current!
    const o = new THREE.Object3D()
    bloques.forEach((b, i) => {
      o.position.copy(p(b.x, b.y, b.z))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, colorLey(b.ley))
    })
    m.instanceMatrix.needsUpdate = true
    m.instanceColor!.needsUpdate = true
  }, [bloques])
  const b = sobre != null ? bloques[sobre] : null
  return (
    <>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, bloques.length]}
        onPointerMove={(e) => {
          e.stopPropagation()
          if (e.instanceId === sobre) return
          setSobre(e.instanceId ?? null)
          onFoco(e.instanceId != null ? { tipo: 'bloque', b: bloques[e.instanceId] } : null)
        }}
        onPointerOut={() => {
          setSobre(null)
          onFoco(null)
        }}
      >
        <boxGeometry args={[4.3, 4.3, 2.4]} />
        <meshStandardMaterial roughness={0.7} transparent opacity={tenue ? 0.15 : 0.38} depthWrite={false} />
      </instancedMesh>
      {b && (
        <mesh position={p(b.x, b.y, b.z)}>
          <boxGeometry args={[5, 5, 3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color={TINTA} />
        </mesh>
      )}
    </>
  )
}

function Desarrollo({ l, color, activa, marcada, sel, ...c }: { l: Labor; color: string; activa: boolean; marcada: boolean; sel: boolean } & Comun) {
  const [geo, halo] = useMemo(() => {
    const pts = l.eje!.map(([x, y, z]) => p(x, y, z))
    const curva = pts.length > 2 ? new THREE.CatmullRomCurve3(pts) : new THREE.LineCurve3(pts[0], pts[1])
    const r = l.tipo === 'Chimenea' ? 1.8 : 2.8
    const seg = Math.max(8, l.tipo === 'Rampa' ? pts.length * 2 : Math.round(curva.getLength() / 6))
    return [labrar(new THREE.TubeGeometry(curva, seg, r, 7, false)), new THREE.TubeGeometry(curva, seg, r + 1.6, 10, false)]
  }, [l])
  return (
    <group>
      <mesh geometry={geo} castShadow {...eventosLabor(l.id, c)}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={sel || marcada ? 0.85 : activa ? 0.3 : 0.04} roughness={0.95} flatShading />
      </mesh>
      {(sel || marcada) && (
        <mesh geometry={halo}>
          <meshBasicMaterial color={sel ? CORAL : TINTA} transparent opacity={0.28} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function Tajeo({ l, color, activa, marcada, sel, ...c }: { l: Labor; color: string; activa: boolean; marcada: boolean; sel: boolean } & Comun) {
  const [x0, x1, z0, z1] = l.caja!
  return (
    <mesh position={centroLabor(l)} castShadow={activa} {...eventosLabor(l.id, c)}>
      <boxGeometry args={[x1 - x0, z1 - z0, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={sel || marcada ? 0.75 : activa ? 0.4 : 0.05}
        transparent
        opacity={activa ? (sel || marcada ? 0.95 : 0.78) : 0.12}
        depthWrite={activa}
      />
      <Edges color={sel ? CORAL : marcada ? TINTA : activa ? color : '#5d6966'} lineWidth={sel || marcada ? 2 : 1} />
    </mesh>
  )
}

// ─── diseños del Designer UG (última versión de cada uno) ─────────
// azul: fuera de la paleta de cumplimiento; borrador translúcido, congelado sólido
const DISENO = '#3987e5'

function geometriaDiseno(d: Datos) {
  if (d.tipo === 'labor') {
    const e = ejeDeTramos(d.origen, d.rumbo, d.tramos)
    const curva = new THREE.CatmullRomCurve3(e.puntos.map(([x, y, z]) => p(x, y, z)))
    return new THREE.TubeGeometry(curva, Math.max(8, e.puntos.length), Math.sqrt(areaSeccion(d.seccion).conSobre / Math.PI), 8, false)
  }
  // paralelepípedo con el buzamiento: cada vértice de un cubo unitario va a su (x, z) y al centro transversal de esa cota
  const t = d.t
  const g = new THREE.BoxGeometry(1, 1, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = t.x0 + (pos.getX(i) + 0.5) * t.largo
    const z = t.zPiso + (pos.getY(i) + 0.5) * t.alto
    pos.setXYZ(i, ...p(x, centroTajeo(t, z) + pos.getZ(i) * t.ancho, z).toArray())
  }
  g.computeVertexNormals()
  return g
}

function Disenos({ onFoco }: { onFoco: Comun['onFoco'] }) {
  const disenos = useDisenos((s) => s.disenos)
  const piezas = useMemo(
    () =>
      disenos.map((d) => {
        const v = ultima(d)
        return { id: d.id, nombre: d.nombre, estado: `v${v.numero} ${estadoDiseno(d) === 'congelado' ? 'congelada' : 'en borrador'}`, congelado: v.congelada, datos: v.datos, geo: geometriaDiseno(v.datos) }
      }),
    [disenos],
  )
  return piezas.map((k) => {
    const c = DISENO
    return (
      <mesh
        key={k.id}
        geometry={k.geo}
        onPointerOver={(e) => {
          e.stopPropagation()
          onFoco({ tipo: 'diseno', nombre: k.nombre, estado: k.estado, datos: k.datos })
        }}
        onPointerOut={() => onFoco(null)}
      >
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.45} transparent opacity={k.congelado ? 0.85 : 0.35} depthWrite={k.congelado} />
        <Edges color={c} threshold={k.datos.tipo === 'tajeo' ? 1 : 40} />
      </mesh>
    )
  })
}

/** Equipo trabajando en la guardia actual: un rombo flotando sobre su frente. */
function Equipo({ t, onFoco }: { t: Tarea; onFoco: Comun['onFoco'] }) {
  const ref = useRef<THREE.Group>(null)
  const base = useMemo(() => puestoEquipo(laborDe(t.laborId)), [t.laborId])
  const fase = useMemo(() => Math.random() * 6, [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = base.y + Math.sin(clock.elapsedTime * 2 + fase) * 1.2
  })
  return (
    <group ref={ref} position={base}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'help'
          onFoco({ tipo: 'equipo', t })
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
          onFoco(null)
        }}
      >
        <octahedronGeometry args={[3.6]} />
        <meshStandardMaterial color={TINTA} emissive={TINTA} emissiveIntensity={0.5} />
      </mesh>
      <Rotulo3D texto={t.equipoId} position={new THREE.Vector3(0, 8.5, 0)} alto={7} color={TINTA} />
    </group>
  )
}

// Rótulo como sprite de canvas: evita cargar una fuente de un CDN (la app debe abrir sin red).
function Rotulo3D({ texto, position, alto = 7, color = '#a9b5b1' }: { texto: string; position: THREE.Vector3; alto?: number; color?: string }) {
  const [tex, ancho] = useMemo(() => {
    const c = document.createElement('canvas')
    const g = c.getContext('2d')!
    const fuente = '600 44px "Archivo Variable", system-ui, sans-serif'
    g.font = fuente
    c.width = Math.ceil(g.measureText(texto).width) + 24
    c.height = 64
    g.font = fuente
    g.fillStyle = 'rgba(17,22,21,0.72)'
    g.beginPath()
    g.roundRect(0, 4, c.width, 56, 10)
    g.fill()
    g.fillStyle = color
    g.textBaseline = 'middle'
    g.fillText(texto, 12, 34)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return [t, c.width / c.height]
  }, [texto, color])
  return (
    // tamaño fijo en pantalla: se lee igual de lejos que de cerca
    <sprite position={position} scale={[alto * 0.0021 * ancho, alto * 0.0021, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} sizeAttenuation={false} />
    </sprite>
  )
}

function Niveles() {
  return (
    <>
      {NIVELES.map((z) => (
        <group key={z}>
          <Rotulo3D texto={`NV ${z}`} position={p(-108, -14, z + 3)} alto={11} />
        </group>
      ))}
    </>
  )
}

type Controles = { target: THREE.Vector3; update: () => void; addEventListener: (t: 'start', f: () => void) => void; removeEventListener: (t: 'start', f: () => void) => void }

/** Lleva la cámara a una vista o a la pieza elegida; cualquier arrastre del usuario cancela el vuelo. */
function Camara({ vista, seleccion }: { vista?: { modo: Vista; n: number }; seleccion?: string | null }) {
  const { camera, controls, size } = useThree() as unknown as { camera: THREE.Camera; controls: Controles | null; size: { width: number; height: number } }
  const meta = useRef<{ pos: THREE.Vector3; obj: THREE.Vector3 } | null>(null)
  const aspecto = size.width / Math.max(1, size.height)
  const listo = useRef(false)
  useLayoutEffect(() => {
    // primer encuadre sin animación, ajustado al panel
    if (listo.current || !size.width) return
    listo.current = true
    camera.position.copy(posVista('3d', aspecto))
  }, [aspecto, camera, size.width])
  useEffect(() => {
    if (vista && vista.n > 0) meta.current = { pos: posVista(vista.modo, aspecto), obj: OBJETIVO.clone() }
  }, [vista]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!seleccion || !controls) return
    const obj = centroLabor(laborDe(seleccion))
    const dir = camera.position.clone().sub(controls.target).normalize()
    meta.current = { pos: obj.clone().add(dir.multiplyScalar(laborDe(seleccion).tipo === 'Rampa' ? 230 : 170)), obj }
  }, [seleccion, controls, camera])
  useEffect(() => {
    if (!controls) return
    const cancelar = () => (meta.current = null)
    controls.addEventListener('start', cancelar)
    return () => controls.removeEventListener('start', cancelar)
  }, [controls])
  useFrame((_, dt) => {
    const m = meta.current
    if (!m || !controls) return
    const k = 1 - Math.exp(-dt * 4)
    camera.position.lerp(m.pos, k)
    controls.target.lerp(m.obj, k)
    controls.update()
    if (camera.position.distanceTo(m.pos) < 0.5) meta.current = null
  })
  return null
}

// ─── tooltip ─────────────────────────────────────────────────────

function categoriaLey(ley: number) {
  return ley >= 7 ? 'alta ley' : ley >= 4.5 ? 'ley media' : 'baja ley, cerca del corte'
}

function Contenido({ f }: { f: NonNullable<Foco> }): ReactNode {
  if (f.tipo === 'labor') return <FichaLabor id={f.id} pie={<p className="mt-2 text-[11.5px] text-tinta-3">Clic para fijarla y acercar la cámara</p>} />
  if (f.tipo === 'bloque')
    return (
      <div className="text-[12.5px] leading-snug">
        <div className="flex items-center justify-between gap-4">
          <span className="titular text-[15px]">Bloque de mineral</span>
          <span className="size-3 rounded-sm" style={{ background: `#${colorLey(f.b.ley).getHexString()}` }} />
        </div>
        <p className="text-tinta-2 mt-1">
          Un cubo de 5 × 5 m del modelo de recursos. Su color es la ley: cuánto oro trae cada tonelada.
        </p>
        <dl className="mt-2 pt-2 border-t border-filete grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-tinta-3">Ley</dt>
          <dd className="text-right">{fmt(f.b.ley, 2)} g/t Au · {categoriaLey(f.b.ley)}</dd>
          <dt className="text-tinta-3">Cota</dt>
          <dd className="text-right">{fmt(f.b.z)} m · a {fmt(f.b.x)} m del inicio de la veta</dd>
        </dl>
      </div>
    )
  if (f.tipo === 'diseno') {
    const r = resumen(f.datos)
    return (
      <div className="text-[12.5px] leading-snug">
        <div className="titular text-[15px]">{f.nombre}</div>
        <p className="text-tinta-2 mt-1">
          {f.datos.tipo === 'labor' ? `${f.datos.clase} diseñada` : 'Tajeo diseñado'} en el Designer UG, todavía no excavado · {f.estado}.
        </p>
        <dl className="mt-2 pt-2 border-t border-filete grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-tinta-3">{f.datos.tipo === 'labor' ? 'Longitud' : 'Largo'}</dt>
          <dd className="text-right">{fmt(r.largo, 1)} m</dd>
          <dt className="text-tinta-3">{f.datos.tipo === 'labor' ? 'Roca a extraer' : 'Mineral diluido'}</dt>
          <dd className="text-right">{fmt(r.t)} t{r.ley != null && ` @ ${fmt(r.ley, 2)} g/t`}</dd>
        </dl>
      </div>
    )
  }
  const t = f.t
  const u = t.unidad
  return (
    <div className="text-[12.5px] leading-snug">
      <div className="titular text-[15px]">{t.equipoId} · {modeloEquipo(t.equipoId)}</div>
      <p className="text-tinta-2 mt-1">
        Trabajando ahora en <b className="text-tinta font-semibold">{laborDe(t.laborId).nombre}</b>: {t.tipo.toLowerCase()}, horas {t.inicio}–{t.fin} de la guardia.
      </p>
      <dl className="mt-2 pt-2 border-t border-filete grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-tinta-3">Avance</dt>
        <dd className="text-right">{t.estado === 'pendiente' ? 'sin iniciar' : `${fmt(t.real ?? 0, u === 'm' ? 1 : 0)} de ${fmt(t.plan, u === 'm' ? 1 : 0)} ${u}`}</dd>
        <dt className="text-tinta-3">Estado</dt>
        <dd className="text-right">{t.estado}</dd>
      </dl>
    </div>
  )
}

// ─── componente ──────────────────────────────────────────────────

export default function Mina3D({
  niveles = {},
  verBloques = true,
  verEquipos = true,
  verRotulos = true,
  verDisenos = true,
  autoRotar = true,
  seleccion,
  resaltado,
  vista,
  onSelect,
}: {
  niveles?: Record<string, Nivel>
  verBloques?: boolean
  verEquipos?: boolean
  verRotulos?: boolean
  verDisenos?: boolean
  autoRotar?: boolean
  seleccion?: string | null
  /** labor resaltada desde fuera (p. ej. al pasar sobre la lista) */
  resaltado?: string | null
  vista?: { modo: Vista; n: number }
  onSelect?: (id: string) => void
}) {
  const tareas = useStore((s) => s.tareas)
  const [foco, setFoco] = useState<Foco>(null)
  // equipos débiles: si el visor no sostiene los cuadros, se apagan sombras, relieve y velo de roca
  const [ligero, setLigero] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)

  // equipos en su puesto: la tarea de la guardia actual cuya franja horaria contiene "ahora"
  const enTurno = useMemo(() => {
    const h = (AHORA.getTime() - inicioGuardia(GUARDIA_ACTUAL.fecha, GUARDIA_ACTUAL.guardia).getTime()) / 3600e3
    const ts = tareas.filter((t) => t.fecha === GUARDIA_ACTUAL.fecha && t.guardia === GUARDIA_ACTUAL.guardia && t.inicio <= h && h < t.fin + 1)
    return [...new Map(ts.map((t) => [t.equipoId, t])).values()]
  }, [tareas])

  const marcada = (foco?.tipo === 'labor' ? foco.id : null) ?? resaltado ?? null
  const comun = { onFoco: setFoco, onSelect }

  // el tooltip sigue al puntero sin re-renderizar React en cada movimiento
  const mover = (e: React.PointerEvent) => {
    const r = caja.current!.getBoundingClientRect()
    const t = tip.current
    if (!t) return
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const izq = x + 18 + t.offsetWidth > r.width ? x - 18 - t.offsetWidth : x + 18
    const arr = Math.min(Math.max(8, y - 20), r.height - t.offsetHeight - 8)
    t.style.transform = `translate(${izq}px, ${arr}px)`
  }

  return (
    <div ref={caja} className="relative size-full" onPointerMove={mover}>
      <Canvas
        flat
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ position: [300, 200, 800], fov: FOV, near: 1, far: 4000 }}
        onPointerMissed={() => onSelect?.('')}
        aria-label="Vista 3D de la mina piloto UG"
      >
        <color attach="background" args={['#111615']} />
        <fog attach="fog" args={['#111615', 900, 2000]} />
        <hemisphereLight args={['#d8e2f0', '#20160f', 0.75]} />
        <directionalLight
          position={[160, 260, 320]}
          intensity={1.6}
          castShadow={!ligero}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={1.5}
          shadow-camera-left={-340}
          shadow-camera-right={340}
          shadow-camera-top={200}
          shadow-camera-bottom={-200}
          shadow-camera-near={50}
          shadow-camera-far={1100}
        />
        <directionalLight position={[-260, 40, 200]} intensity={0.3} color="#9fc4ff" />
        <PerformanceMonitor bounds={() => [24, 50]} flipflops={1} onDecline={() => setLigero(true)} />
        <Roca ligero={ligero} />
        <Superficie />
        <Lamparas />
        {verBloques && <Veta tenue={!!(marcada || seleccion)} onFoco={setFoco} />}
        <Niveles />
        {LABORES.map((l) => {
          const activa = LABORES_SEMANA.includes(l.id)
          const nivel = niveles[l.id]
          const props = { l, activa, color: activa && nivel ? NIVEL_HEX[nivel] : INACTIVA, marcada: marcada === l.id, sel: seleccion === l.id, ...comun }
          return l.tipo === 'Tajeo' ? <Tajeo key={l.id} {...props} /> : <Desarrollo key={l.id} {...props} />
        })}
        {verRotulos &&
          LABORES_SEMANA.map(laborDe).map((l) => (
            <Rotulo3D
              key={l.id}
              texto={l.tipo === 'Rampa' ? 'Rampa' : l.id}
              position={l.caja ? centroLabor(l).add(new THREE.Vector3(0, (l.caja[3] - l.caja[2]) / 2 + 6, 4)) : l.tipo === 'Rampa' ? p(-55, -40, 3728) : p(...l.eje!.at(-1)!).add(new THREE.Vector3(0, -8, 0))}
              alto={l.tipo === 'Rampa' ? 9 : 7.5}
              color={marcada === l.id || seleccion === l.id ? TINTA : '#a9b5b1'}
            />
          ))}
        {verDisenos && <Disenos onFoco={setFoco} />}
        {verEquipos && enTurno.map((t) => <Equipo key={t.equipoId} t={t} onFoco={setFoco} />)}
        <Camara vista={vista} seleccion={seleccion} />
        <OrbitControls makeDefault enableDamping autoRotate={autoRotar && !foco} autoRotateSpeed={0.35} minDistance={60} maxDistance={1400} target={OBJETIVO} />
      </Canvas>
      <div
        ref={tip}
        role="tooltip"
        className={`absolute left-0 top-0 w-[300px] pointer-events-none bg-suelo/95 border border-filete-2 rounded px-3.5 py-3 shadow-[0_8px_24px_rgb(0_0_0/.45)] transition-opacity duration-100 ${foco ? 'opacity-100' : 'opacity-0'}`}
      >
        {foco && <Contenido f={foco} />}
      </div>
    </div>
  )
}
