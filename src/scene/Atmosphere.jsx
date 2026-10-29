import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { DUSK } from '../config/lighting'
import { PANEL, ROOM } from './layout'
import { emissive, glowMaterial } from './materials'
import { radial, scallop } from './textures'

RectAreaLightUniformsLib.init()

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  uniform vec3 top;
  uniform vec3 mid;
  uniform vec3 horizon;
  uniform vec3 ground;
  uniform vec3 glow;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = mix(horizon, mid, smoothstep(0.0, 0.22, h));
    c = mix(c, top, smoothstep(0.18, 0.75, h));
    // Afterglow where the sun went down (behind the house, left).
    vec2 flat2 = normalize(vDir.xz + 1e-5);
    float sun = max(dot(flat2, normalize(vec2(-0.55, -0.85))), 0.0);
    c += glow * pow(sun, 5.0) * (1.0 - smoothstep(-0.02, 0.32, h)) * 0.55;
    c = mix(c, ground, smoothstep(0.0, -0.06, h));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function SkyDome({ radius = 220 }) {
  const material = useMemo(() => {
    const u = DUSK.sky
    const col = (hex) => ({ value: new THREE.Color(hex) })
    return new THREE.ShaderMaterial({
      uniforms: { top: col(u.top), mid: col(u.mid), horizon: col(u.horizon), ground: col(u.ground), glow: col(u.glow) },
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  }, [])
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  )
}

function Spot({ position, target, ...props }) {
  const ref = useRef()
  const scene = useThree((s) => s.scene)
  const obj = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    obj.position.set(...target)
    scene.add(obj)
    ref.current.target = obj
    return () => scene.remove(obj)
  }, [scene, obj, target])
  return <spotLight ref={ref} position={position} decay={2} {...props} />
}

// Always-on dusk context: canopy downlights washing the stone facade, the
// lit upper window, a garden uplight, and a dim foyer light on the panel.
function ContextLights() {
  const c = DUSK.canopy
  const mats = useMemo(() => {
    const lamp = emissive(c.color)
    lamp.emissiveIntensity = 3
    const wash = glowMaterial(scallop(), c.color)
    wash.opacity = c.glow
    const pool = glowMaterial(radial(1.8), c.color)
    pool.opacity = c.glow * 0.5
    const window = new THREE.MeshBasicMaterial({ color: new THREE.Color(DUSK.upperWindow.color).multiplyScalar(DUSK.upperWindow.emissive), toneMapped: true })
    const slot = new THREE.MeshBasicMaterial({ color: new THREE.Color('#1b2130') })
    const foyerTrim = emissive(DUSK.foyer.color)
    foyerTrim.emissiveIntensity = 0.6
    return { lamp, wash, pool, window, slot, foyerTrim }
  }, [c])
  const facadeLamps = [3.4, 5.2, 7.0]
  const terraceLamps = [-4.6, -2.8, -1.0, 1.6]
  const [px, py, pz] = PANEL.position
  return (
    <group>
      {[...facadeLamps, ...terraceLamps].map((x) => (
        <mesh key={x} position={[x, ROOM.ceiling - 0.002, 0.4]} rotation-x={Math.PI / 2} material={mats.lamp}>
          <circleGeometry args={[0.045, 24]} />
        </mesh>
      ))}
      {facadeLamps.map((x) => (
        <mesh key={x} position={[x, ROOM.ceiling - 1.1, 0.004]} rotation-z={Math.PI} material={mats.wash}>
          <planeGeometry args={[1.5, 2.2]} />
        </mesh>
      ))}
      {terraceLamps.map((x) => (
        <mesh key={x} position={[x, 0.004, 0.55]} rotation-x={-Math.PI / 2} material={mats.pool}>
          <planeGeometry args={[1.8, 1.4]} />
        </mesh>
      ))}
      <Spot position={[1.6, ROOM.ceiling - 0.05, 0.6]} target={[1.6, 0, 0.3]} color={c.color} intensity={c.intensity} angle={0.85} penumbra={0.9} distance={9} />
      <Spot position={[7.4, 0.1, 7.0]} target={[8.1, 3.0, 8.2]} color={DUSK.treeUplight.color} intensity={DUSK.treeUplight.intensity} angle={0.7} penumbra={0.8} distance={10} />
      {/* upper floor window */}
      <mesh position={[1.1, 5.025, -1.598]} material={mats.window}>
        <planeGeometry args={[5.5, 1.05]} />
      </mesh>
      {/* corridor end: dusk through a slot window */}
      <mesh position={[1.8, 1.55, ROOM.corridor.z[0] + 0.002]} material={mats.slot}>
        <planeGeometry args={[0.08, 2.5]} />
      </mesh>
      {/* foyer downlight raking the panel */}
      <mesh position={[px + 0.1, ROOM.ceiling - 0.003, pz + 1.05]} rotation-x={Math.PI / 2} material={mats.foyerTrim}>
        <circleGeometry args={[0.035, 24]} />
      </mesh>
      <Spot
        position={[px + 0.1, ROOM.ceiling - 0.05, pz + 1.05]}
        target={[px, py - 0.12, pz]}
        color={DUSK.foyer.color}
        intensity={DUSK.foyer.intensity}
        angle={0.3}
        penumbra={1}
        distance={6}
      />
    </group>
  )
}

export function Atmosphere() {
  const fill = useRef()
  const g = DUSK.glazingFill
  useLayoutEffect(() => {
    fill.current.lookAt(g.position[0], g.position[1] - 0.6, -5)
  }, [g])
  return (
    <>
      <fog attach="fog" args={[DUSK.fog.color, DUSK.fog.near, DUSK.fog.far]} />
      <SkyDome />
      <Environment frames={1} resolution={128} environmentIntensity={DUSK.environmentIntensity}>
        <SkyDome radius={50} />
        <Lightformer form="rect" color="#ffd7ac" intensity={3} position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" color="#ffcf9e" intensity={1.6} position={[-6, 2.5, 3]} rotation-y={Math.PI / 2} scale={[4, 1.5, 1]} />
        <Lightformer form="rect" color="#c8d4ff" intensity={0.8} position={[6, 3, 4]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
      <hemisphereLight args={[DUSK.hemisphere.sky, DUSK.hemisphere.ground, DUSK.hemisphere.intensity]} />
      <directionalLight color={DUSK.afterglow.color} intensity={DUSK.afterglow.intensity} position={DUSK.afterglow.position} />
      <rectAreaLight ref={fill} color={g.color} intensity={g.intensity} width={g.size[0]} height={g.size[1]} position={g.position} />
      <ContextLights />
    </>
  )
}
