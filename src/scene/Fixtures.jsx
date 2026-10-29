import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { FIXTURES } from '../config/lighting'
import { lightLevel } from '../state/store'
import { emissive, getSurfaces, glowMaterial } from './materials'
import { FIXTURE_POS, ROOM } from './layout'
import { floorFan, radial, scallop, verticalFade } from './textures'

// The four switchable fixtures. Each one keeps its light sources mounted at
// all times (intensity 0 when off) so toggling never triggers a shader
// recompile; the look comes from real lights plus additive glow decals on
// the surfaces they hit.

// 0 → 1 response with a slightly delayed tail, like a dimmer warming up.
const curve = (l) => l * l * (3 - 2 * l)

function WallLight() {
  const cfg = FIXTURES.wall
  const s = getSurfaces()
  const light = useRef()
  const mats = useMemo(() => {
    const tex = scallop()
    return { aperture: emissive(cfg.color), up: glowMaterial(tex, cfg.color), down: glowMaterial(tex, cfg.color) }
  }, [cfg.color])
  useFrame(() => {
    const l = curve(lightLevel(0))
    light.current.intensity = cfg.intensity * l
    mats.aperture.emissiveIntensity = cfg.emissive * l
    mats.up.opacity = cfg.glow * l
    mats.down.opacity = cfg.glow * 0.85 * l
  })
  const [x, y, z] = FIXTURE_POS.sconce
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, 0.045]} material={s.bronze} castShadow>
        <boxGeometry args={[0.1, 0.3, 0.09]} />
      </mesh>
      <mesh position={[0, 0.1505, 0.045]} rotation-x={-Math.PI / 2} material={mats.aperture}>
        <planeGeometry args={[0.07, 0.06]} />
      </mesh>
      <mesh position={[0, -0.1505, 0.045]} rotation-x={Math.PI / 2} material={mats.aperture}>
        <planeGeometry args={[0.07, 0.06]} />
      </mesh>
      <mesh position={[0, 0.15 + 0.62, 0.004]} material={mats.up}>
        <planeGeometry args={[1.15, 1.24]} />
      </mesh>
      <mesh position={[0, -0.15 - 0.62, 0.004]} rotation-z={Math.PI} material={mats.down}>
        <planeGeometry args={[1.05, 1.24]} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 0.42]} color={cfg.color} intensity={0} distance={cfg.distance} decay={2} />
    </group>
  )
}

function SpotLight({ shadowSize }) {
  const cfg = FIXTURES.spot
  const s = getSurfaces()
  const light = useRef()
  const scene = useThree((st) => st.scene)
  const target = useMemo(() => new THREE.Object3D(), [])
  const lens = useMemo(() => emissive(cfg.color), [cfg.color])
  const [ax, ay, az] = FIXTURE_POS.art.center
  const pos = FIXTURE_POS.artSpot
  useLayoutEffect(() => {
    target.position.set(ax, ay - 0.05, az)
    scene.add(target)
    light.current.target = target
    return () => scene.remove(target)
  }, [scene, target, ax, ay, az])
  useFrame(() => {
    const l = curve(lightLevel(1))
    light.current.intensity = cfg.intensity * l
    lens.emissiveIntensity = cfg.emissive * l
  })
  // Fixture body aimed at the artwork.
  const aim = useMemo(() => {
    const dir = new THREE.Vector3(ax - pos[0], ay - pos[1], az - pos[2]).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
  }, [ax, ay, az, pos])
  return (
    <group>
      <mesh position={[pos[0], ROOM.ceiling - 0.005, pos[2]]} material={s.black}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 32]} />
      </mesh>
      <mesh position={[pos[0], (ROOM.ceiling + pos[1]) / 2 - 0.02, pos[2]]} material={s.bronze}>
        <cylinderGeometry args={[0.008, 0.008, ROOM.ceiling - pos[1] + 0.04, 8]} />
      </mesh>
      <group position={[pos[0], pos[1] - 0.04, pos[2]]} quaternion={aim}>
        <mesh material={s.bronze} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.12, 32]} />
        </mesh>
        <mesh material={lens} position={[0, -0.041, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.032, 32]} />
        </mesh>
      </group>
      <spotLight
        ref={light}
        position={pos}
        color={cfg.color}
        intensity={0}
        angle={cfg.angle}
        penumbra={cfg.penumbra}
        decay={2}
        distance={9}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={6}
      />
    </group>
  )
}

function NicheLight() {
  const cfg = FIXTURES.niche
  const light = useRef()
  const { niche, backWall } = ROOM
  const mats = useMemo(
    () => ({ strip: emissive(cfg.color), back: glowMaterial(verticalFade(), cfg.color), shelf: glowMaterial(verticalFade(), cfg.color) }),
    [cfg.color],
  )
  useFrame(() => {
    const l = curve(lightLevel(2))
    light.current.intensity = cfg.intensity * l
    mats.strip.emissiveIntensity = cfg.emissive * l
    mats.back.opacity = cfg.glow * 0.55 * l
    mats.shelf.opacity = cfg.glow * 0.45 * l
  })
  const cx = (niche.x[0] + niche.x[1]) / 2
  const w = niche.x[1] - niche.x[0] - 0.04
  const backZ = backWall - niche.depth
  return (
    <group>
      {/* LED line hidden in the niche head */}
      <mesh position={[cx, niche.y[1] - 0.021, backWall - 0.05]} rotation-x={Math.PI / 2} material={mats.strip}>
        <planeGeometry args={[w, 0.014]} />
      </mesh>
      <mesh position={[cx, (niche.y[1] + 1.5) / 2, backZ + 0.002]} material={mats.back}>
        <planeGeometry args={[w, niche.y[1] - 1.5 - 0.02]} />
      </mesh>
      <mesh position={[cx, (1.465 + niche.y[0]) / 2, backZ + 0.002]} material={mats.shelf}>
        <planeGeometry args={[w, 1.465 - niche.y[0] - 0.02]} />
      </mesh>
      <pointLight ref={light} position={[cx, niche.y[1] - 0.12, backWall - 0.2]} color={cfg.color} intensity={0} distance={cfg.distance} decay={2} />
    </group>
  )
}

function PathLight() {
  const cfg = FIXTURES.path
  const s = getSurfaces()
  const lights = useRef([])
  const mats = useMemo(
    () => ({ aperture: emissive(cfg.color), floor: glowMaterial(floorFan(), cfg.color), halo: glowMaterial(radial(2.4), cfg.color) }),
    [cfg.color],
  )
  useFrame(() => {
    const l = curve(lightLevel(3))
    lights.current.forEach((pl) => pl && (pl.intensity = cfg.intensity * l))
    mats.aperture.emissiveIntensity = cfg.emissive * l
    mats.floor.opacity = cfg.glow * l
    mats.halo.opacity = 0.5 * cfg.glow * l
  })
  const wallX = ROOM.corridor.x[0]
  const y = 0.24
  return (
    <group>
      {FIXTURE_POS.pathLights.map((z) => (
        <group key={z} position={[wallX, y, z]}>
          <mesh position={[0.004, 0, 0]} material={s.bronze}>
            <boxGeometry args={[0.008, 0.07, 0.2]} />
          </mesh>
          <mesh position={[0.0085, -0.012, 0]} rotation-y={Math.PI / 2} material={mats.aperture}>
            <planeGeometry args={[0.16, 0.022]} />
          </mesh>
          <mesh position={[0.01, 0, 0]} rotation-y={Math.PI / 2} material={mats.halo}>
            <planeGeometry args={[0.6, 0.4]} />
          </mesh>
          <mesh position={[0.62, -y + 0.003, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={mats.floor}>
            <planeGeometry args={[1.5, 1.2]} />
          </mesh>
        </group>
      ))}
      {[-9.15, -11.0].map((z, i) => (
        <pointLight key={z} ref={(el) => (lights.current[i] = el)} position={[wallX + 0.25, y, z]} color={cfg.color} intensity={0} distance={cfg.distance} decay={2} />
      ))}
    </group>
  )
}

export function Fixtures({ shadowSize = 1024 }) {
  return (
    <group>
      <WallLight />
      <SpotLight shadowSize={shadowSize} />
      <NicheLight />
      <PathLight />
    </group>
  )
}
