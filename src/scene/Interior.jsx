import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Block } from './Block'
import { getSurfaces } from './materials'
import { FIXTURE_POS, ROOM } from './layout'
import { artwork } from './textures'

// Furnishing for the living room: deliberately sparse so the four lit
// features carry the composition.

function Vessel({ profile, position, material, scale = 1 }) {
  const geometry = useMemo(
    () => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40),
    [profile],
  )
  return <mesh geometry={geometry} position={position} material={material} scale={scale} castShadow receiveShadow />
}

const AMPHORA = [[0, 0], [0.07, 0], [0.11, 0.06], [0.13, 0.16], [0.1, 0.27], [0.045, 0.33], [0.05, 0.36], [0.045, 0.36]]
const BOTTLE = [[0, 0], [0.06, 0], [0.075, 0.1], [0.07, 0.2], [0.025, 0.28], [0.02, 0.4], [0.026, 0.41], [0.02, 0.41]]
const BOWL = [[0, 0], [0.06, 0], [0.14, 0.04], [0.17, 0.09], [0.16, 0.09], [0.13, 0.05], [0, 0.03]]

function Sofa({ s, position, length = 2.8, rotation = 0 }) {
  const d = 1.0
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[length, 0.24, d]} radius={0.05} position={[0, 0.17, 0]} material={s.boucle} castShadow receiveShadow />
      <RoundedBox args={[length - 0.36, 0.16, d - 0.24]} radius={0.06} position={[0, 0.36, -0.08]} material={s.boucle} receiveShadow />
      <RoundedBox args={[length, 0.48, 0.22]} radius={0.07} position={[0, 0.46, d / 2 - 0.11]} material={s.boucle} castShadow />
      <RoundedBox args={[0.2, 0.36, d]} radius={0.07} position={[-length / 2 + 0.1, 0.4, 0]} material={s.boucle} castShadow />
      <RoundedBox args={[0.2, 0.36, d]} radius={0.07} position={[length / 2 - 0.1, 0.4, 0]} material={s.boucle} castShadow />
      <Block x={[-length / 2 + 0.1, length / 2 - 0.1]} y={[0, 0.05]} z={[-d / 2 + 0.08, d / 2 - 0.08]} mat={s.black} receive={false} />
    </group>
  )
}

function Chair({ s, position, rotation }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[0.82, 0.36, 0.82]} radius={0.12} position={[0, 0.2, 0]} material={s.boucle} castShadow />
      <RoundedBox args={[0.82, 0.42, 0.2]} radius={0.09} position={[0, 0.5, 0.31]} material={s.boucle} castShadow />
    </group>
  )
}

function Artwork({ s }) {
  const { center, size } = FIXTURE_POS.art
  const map = useMemo(() => artwork(), [])
  const canvasMat = useMemo(() => new THREE.MeshStandardMaterial({ map, roughness: 0.9 }), [map])
  const [w, h] = size
  return (
    <group position={[center[0], center[1], center[2]]}>
      <Block x={[-w / 2 - 0.025, w / 2 + 0.025]} y={[-h / 2 - 0.025, h / 2 + 0.025]} z={[0, 0.045]} mat={s.oakDark} cast />
      <mesh position={[0, 0, 0.0465]} material={canvasMat} receiveShadow>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  )
}

function Credenza({ s }) {
  const x = FIXTURE_POS.art.center[0]
  const z = ROOM.backWall
  return (
    <group>
      <Block x={[x - 1.25, x + 1.25]} y={[0.16, 0.62]} z={[z, z + 0.46]} mat={s.oakDark} cast />
      <Block x={[x - 1.12, x + 1.12]} y={[0, 0.16]} z={[z + 0.04, z + 0.38]} mat={s.black} />
      <Vessel profile={AMPHORA} position={[x - 0.85, 0.62, z + 0.24]} material={s.ceramic} scale={1.15} />
      <Vessel profile={BOWL} position={[x + 0.55, 0.62, z + 0.24]} material={s.ceramicDark} />
      <Block x={[x + 0.85, x + 1.12]} y={[0.62, 0.66]} z={[z + 0.1, z + 0.32]} mat={s.ceramicDark} cast />
      <Block x={[x + 0.87, x + 1.1]} y={[0.66, 0.69]} z={[z + 0.12, z + 0.3]} mat={s.boucle} cast />
    </group>
  )
}

function NicheObjects({ s }) {
  const { niche, backWall } = ROOM
  const zc = backWall - niche.depth / 2 - 0.02
  const shelfY = 1.5
  return (
    <group>
      <Block x={[niche.x[0] + 0.02, niche.x[1] - 0.02]} y={[shelfY - 0.035, shelfY]} z={[backWall - niche.depth, backWall - 0.02]} mat={s.oakDark} cast />
      <Vessel profile={BOTTLE} position={[niche.x[0] + 0.24, niche.y[0] + 0.02, zc]} material={s.ceramic} scale={1.3} />
      <Vessel profile={AMPHORA} position={[niche.x[1] - 0.27, niche.y[0] + 0.02, zc]} material={s.ceramicDark} scale={0.95} />
      <Vessel profile={BOWL} position={[niche.x[0] + 0.3, shelfY, zc]} material={s.ceramic} scale={0.85} />
      <mesh position={[niche.x[1] - 0.22, shelfY + 0.085, zc]} material={s.ceramicDark} castShadow>
        <sphereGeometry args={[0.085, 32, 16]} />
      </mesh>
    </group>
  )
}

export function Interior() {
  const s = getSurfaces()
  return (
    <group>
      <Block x={[-4.7, 0.3]} y={[0, 0.014]} z={[-6.9, -2.5]} mat={s.rug} />
      <Sofa s={s} position={[-2.2, 0, -3.65]} />
      <Chair s={s} position={[-4.55, 0, -5.4]} rotation={-2.2} />
      <Block x={[-2.95, -1.45]} y={[0, 0.34]} z={[-5.55, -4.85]} mat={s.travertineSolid} cast />
      <Vessel profile={BOWL} position={[-2.5, 0.34, -5.2]} material={s.ceramicDark} scale={0.9} />
      <Artwork s={s} />
      <Credenza s={s} />
      <NicheObjects s={s} />
    </group>
  )
}
