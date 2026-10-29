import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { doorOpen } from '../state/store'
import { Block } from './Block'
import { getSurfaces } from './materials'
import { ROOM } from './layout'

// Contemporary single-storey pavilion with a timber-clad upper volume.
// Front facade on z = 0: glazing on the left, pivot door, travertine on the
// right. Inside: living room (left), foyer with the panel wall (right),
// corridor running back beside the core.

const H = ROOM.ceiling

function Facade({ s }) {
  const exterior = (outside) => ({ pz: outside, rest: s.plaster })
  const mullions = [-5.4, -3.9, -2.4, -0.9, 0.6]
  return (
    <group>
      <Block x={[-6, -5.4]} y={[0, H]} z={[-0.3, 0]} mat={s.plaster} />
      {/* glazing */}
      {mullions.map((x, i) => (
        <Block key={x} x={[x - (i === 0 ? 0 : 0.03), x + (i === mullions.length - 1 ? 0 : 0.03)]} y={[0, H]} z={[-0.2, -0.1]} mat={s.bronze} />
      ))}
      <Block x={[-5.4, 0.6]} y={[0, 0.04]} z={[-0.22, -0.08]} mat={s.bronze} />
      <Block x={[-5.4, 0.6]} y={[H - 0.05, H]} z={[-0.22, -0.08]} mat={s.bronze} />
      <mesh position={[-2.4, H / 2, -0.15]} material={s.glass} renderOrder={2}>
        <planeGeometry args={[6, H]} />
      </mesh>
      {/* door surround + stone wall */}
      <Block x={[0.6, ROOM.door.x[0]]} y={[0, H]} z={[-0.3, 0]} mat={exterior(s.travertine)} />
      <Block x={ROOM.door.x} y={[ROOM.door.height, H]} z={[-0.3, 0]} mat={exterior(s.travertine)} />
      <Block x={[ROOM.door.x[1], 7.5]} y={[0, H]} z={[-0.3, 0]} mat={exterior(s.travertine)} />
      <PivotDoor s={s} />
    </group>
  )
}

// Pivot door, hinged on the left. Closed until the doorbell beat, then swings
// inward; held open in explore mode.
const DOOR_OPEN = THREE.MathUtils.degToRad(97)

function PivotDoor({ s }) {
  const ref = useRef()
  useFrame(() => {
    ref.current.rotation.y = DOOR_OPEN * doorOpen()
  })
  return (
    <group ref={ref} position={[ROOM.door.x[0] + 0.04, 0, -0.3]}>
      <Block x={[0, 1.14]} y={[0.01, ROOM.door.height - 0.01]} z={[-0.03, 0.03]} mat={s.oakDark} cast />
      <Block x={[0.98, 1.0]} y={[0.9, 1.9]} z={[0.03, 0.07]} mat={s.bronze} />
    </group>
  )
}

// Seamless plaster face for the back wall with the niche cut out. Built as a
// 3 × 3 grid of quads sharing vertices (centre cell omitted) so there are no
// cracks where pieces meet. UVs are in metres.
function BackWallSkin({ s }) {
  const { backWall, niche, corridor, leftWall } = ROOM
  const geometry = useMemo(() => {
    const xs = [leftWall, niche.x[0], niche.x[1], corridor.x[0]]
    const ys = [0, niche.y[0], niche.y[1], H]
    const pos = []
    const uv = []
    for (const y of ys) {
      for (const x of xs) {
        pos.push(x, y, 0)
        uv.push(x, y)
      }
    }
    const index = []
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        if (i === 1 && j === 1) continue
        const a = j * 4 + i
        index.push(a, a + 1, a + 5, a, a + 5, a + 4)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(index)
    g.computeVertexNormals()
    return g
  }, [niche, corridor, leftWall])
  return <mesh geometry={geometry} material={s.plaster} position={[0, 0, backWall + 0.004]} receiveShadow />
}

function Shell({ s }) {
  const { backWall, niche, corridor } = ROOM
  const bw = [backWall - 0.5, backWall - 0.01] // recessed behind BackWallSkin
  const nz = [backWall - niche.depth, backWall]
  return (
    <group>
      {/* floor */}
      <Block x={[-6, 7.5]} y={[-0.08, 0]} z={[-12.3, 0]} mat={{ py: s.oak, rest: s.travertineSolid }} />
      {/* threshold */}
      <Block x={ROOM.door.x} y={[-0.08, 0.004]} z={[-0.3, 0]} mat={s.travertineSolid} />
      {/* left wall */}
      <Block x={[-6, ROOM.leftWall]} y={[0, H]} z={[-8.6, -0.3]} mat={s.plaster} />
      {/* rooms behind the living room */}
      <Block x={[-6, 0.7]} y={[0, H]} z={[-12.3, -8.6]} mat={s.plaster} />
      {/* back wall with recessed niche */}
      <Block x={[ROOM.leftWall, niche.x[0]]} y={[0, H]} z={bw} mat={s.plaster} />
      <Block x={[niche.x[1], corridor.x[0]]} y={[0, H]} z={bw} mat={s.plaster} />
      <Block x={niche.x} y={[0, niche.y[0]]} z={bw} mat={s.plaster} />
      <Block x={niche.x} y={[niche.y[1], H]} z={bw} mat={s.plaster} />
      <Block x={niche.x} y={niche.y} z={[backWall - 0.5, nz[0]]} mat={s.travertineSolid} />
      {/* niche lining */}
      <Block x={[niche.x[0], niche.x[0] + 0.02]} y={niche.y} z={nz} mat={s.travertineSolid} />
      <Block x={[niche.x[1] - 0.02, niche.x[1]]} y={niche.y} z={nz} mat={s.travertineSolid} />
      <Block x={niche.x} y={[niche.y[0], niche.y[0] + 0.02]} z={nz} mat={s.travertineSolid} />
      <Block x={niche.x} y={[niche.y[1] - 0.02, niche.y[1]]} z={nz} mat={s.travertineSolid} />
      <BackWallSkin s={s} />
      {/* corridor */}
      <Block x={[0.7, corridor.x[0]]} y={[0, H]} z={[corridor.z[0], backWall - 0.5]} mat={s.plaster} />
      <Block x={[0.7, corridor.x[1]]} y={[0, H]} z={[-12.3, corridor.z[0]]} mat={s.plaster} />
      {/* core: limewashed feature wall facing the entrance */}
      <Block x={[ROOM.coreLeft, 7.5]} y={[0, H]} z={[-12.3, ROOM.coreFront]} mat={{ pz: s.limewash, rest: s.plaster }} />
      {/* foyer side wall */}
      <Block x={[7.2, 7.5]} y={[0, H]} z={[ROOM.coreFront, -0.3]} mat={s.plaster} />
      {/* roof slab + canopy */}
      <Block x={[-6.4, 8]} y={[H, H + 0.32]} z={[-12.6, 2.6]} mat={{ ny: s.ceiling, rest: s.plaster }} />
      {/* upper volume */}
      <Block x={[-2.5, 7.5]} y={[H + 0.32, 6.4]} z={[-10, -1.6]} mat={s.timber} />
      <Block x={[-2.7, 7.7]} y={[6.4, 6.56]} z={[-10.2, -1.4]} mat={s.plaster} />
      <Block x={[-1.65, 3.85]} y={[4.45, 4.5]} z={[-1.6, -1.52]} mat={s.bronze} />
      <Block x={[-1.65, 3.85]} y={[5.55, 5.6]} z={[-1.6, -1.52]} mat={s.bronze} />
    </group>
  )
}

function Tree({ position, s, scale = 1 }) {
  const clusters = useMemo(() => {
    const out = []
    const pts = [
      [0, 3.4, 0, 1.25], [0.9, 3.0, 0.3, 0.95], [-0.8, 3.1, -0.2, 1.0], [0.3, 4.1, -0.4, 0.95],
      [-0.4, 3.8, 0.6, 0.85], [1.1, 3.7, -0.5, 0.75], [-1.2, 3.6, 0.5, 0.7],
    ]
    for (const [x, y, z, r] of pts) out.push({ p: [x, y, z], r })
    return out
  }, [])
  return (
    <group position={position} scale={scale}>
      {[[0.15, 0.1], [-0.2, -0.12], [0.05, -0.22]].map(([lean, twist], i) => (
        <mesh key={i} position={[lean * 4, 1.5, twist * 3]} rotation={[twist, 0, -lean]} material={s.bark} castShadow>
          <cylinderGeometry args={[0.05, 0.09, 3.2, 7]} />
        </mesh>
      ))}
      {clusters.map((c, i) => (
        <mesh key={i} position={c.p} scale={[c.r, c.r * 0.72, c.r]} material={s.foliage}>
          <icosahedronGeometry args={[1, 3]} />
        </mesh>
      ))}
    </group>
  )
}

function Cypress({ position, height, s }) {
  return (
    <mesh position={[position[0], height / 2, position[1]]} scale={[0.55, height / 2, 0.55]} material={s.hedge}>
      <sphereGeometry args={[1, 10, 16]} />
    </mesh>
  )
}

function Landscape({ s }) {
  const slabs = useMemo(() => Array.from({ length: 15 }, (_, i) => 3.0 + i * 0.86), [])
  const pool = { x: [-6.2, -0.6], z: [3.0, 8.6] }
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]} material={s.ground} receiveShadow>
        <planeGeometry args={[400, 400]} />
      </mesh>
      {/* terrace */}
      <Block x={[-6.4, 8]} y={[-0.08, 0]} z={[0, 2.6]} mat={s.travertine} />
      {/* stepping stones to the door */}
      {slabs.map((z) => (
        <Block key={z} x={[0.95, 2.35]} y={[-0.08, -0.005]} z={[z, z + 0.52]} mat={s.travertineSolid} />
      ))}
      {/* reflecting pool */}
      <Block x={pool.x} y={[-0.08, 0.03]} z={[pool.z[0], pool.z[0] + 0.3]} mat={s.travertineSolid} />
      <Block x={pool.x} y={[-0.08, 0.03]} z={[pool.z[1] - 0.3, pool.z[1]]} mat={s.travertineSolid} />
      <Block x={[pool.x[0], pool.x[0] + 0.3]} y={[-0.08, 0.03]} z={pool.z} mat={s.travertineSolid} />
      <Block x={[pool.x[1] - 0.3, pool.x[1]]} y={[-0.08, 0.03]} z={pool.z} mat={s.travertineSolid} />
      <mesh rotation-x={-Math.PI / 2} position={[(pool.x[0] + pool.x[1]) / 2, -0.01, (pool.z[0] + pool.z[1]) / 2]} material={s.water}>
        <planeGeometry args={[pool.x[1] - pool.x[0] - 0.6, pool.z[1] - pool.z[0] - 0.6]} />
      </mesh>
      {/* gravel bed + planting on the right */}
      <Block x={[3.2, 8.6]} y={[-0.08, -0.03]} z={[3.0, 9.5]} mat={s.gravel} />
      <Block x={[3.2, 8.6]} y={[0, 0.5]} z={[2.9, 3.5]} mat={s.hedge} />
      <Tree position={[8.1, 0, 8.2]} s={s} scale={0.82} />
      {/* site boundary */}
      <Block x={[-10, -9.2]} y={[0, 1.7]} z={[-16, 12]} mat={s.hedge} />
      <Block x={[9.6, 10.4]} y={[0, 1.7]} z={[-16, 12]} mat={s.hedge} />
      {[[-8.1, -4.2, 7.4], [-8.7, -7.6, 6.2], [-7.6, -11, 8.4], [10.6, -5.6, 7.2], [11.4, -9.2, 8.6], [9.4, -2.2, 5.6], [-11.5, -1, 6.8]].map(
        ([x, z, h]) => <Cypress key={`${x}${z}`} position={[x, z]} height={h} s={s} />,
      )}
    </group>
  )
}

export function House() {
  const s = getSurfaces()
  return (
    <group>
      <Facade s={s} />
      <Shell s={s} />
      <Landscape s={s} />
    </group>
  )
}
