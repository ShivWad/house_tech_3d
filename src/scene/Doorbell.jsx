import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { DOORBELL_FINISH as F } from '../config/materials'
import { bellFlare, bellLevel, bellPress } from '../state/store'
import { DOORBELL } from './layout'
import { glowMaterial } from './materials'
import { beadBlast, bellIcon, radial } from './textures'

// Video doorbell beside the front door, modelled by eye from the reference
// photo: a graphite body with a glazed camera window on top, and a separate
// key column on the right (blank cap, small cap, light sensor, bell key,
// microphone cap). Local origin: centre of the front width at the wall face,
// halfway up the body; +z faces the street.

const { height: H, bodyWidth: BW, stripWidth: SW, gap: GAP, depth: D, stripDepth: SD, travel: TRAVEL } = F.size
const W = BW + GAP + SW
const LEFT = -W / 2
const BODY_X = LEFT + BW / 2
const STRIP_X = W / 2 - SW / 2
const STRIP_TOP = H / 2
const STRIP_BOTTOM = -H / 2
const SEG_GAP = 0.0012
// Key column caps, top to bottom, as proportions of the photo.
const SEGMENTS = (() => {
  const parts = [335, 100, 100, 155, 160]
  const total = parts.reduce((a, b) => a + b, 0)
  const avail = STRIP_TOP - STRIP_BOTTOM - SEG_GAP * (parts.length - 1)
  let y = STRIP_TOP
  return parts.map((part) => {
    const h = (part / total) * avail
    const seg = { y: y - h / 2, h }
    y -= h + SEG_GAP
    return seg
  })
})()
const BELL_KEY = 3
const SENSOR_KEY = 2

// Camera window on the body front.
const WIN = { x: [LEFT + 0.0018, LEFT + BW - 0.0018], y: [0.0356, 0.0967] }
const GLASS_Z = D + 0.0011
const LENS = { x: -0.0161, y: 0.0667 }

function useDoorbellMaterials() {
  return useMemo(() => {
    const bead = beadBlast(43)
    const metal = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: F.housing.metalness,
        roughness: F.housing.roughness,
        envMapIntensity: F.housing.envMapIntensity,
        bumpMap: bead,
        bumpScale: 0.25,
      })
    const indicatorOff = new THREE.Color(F.indicator.off)
    const indicatorOn = new THREE.Color(F.indicator.on).multiplyScalar(F.indicator.intensity)
    return {
      body: metal(F.housing.color),
      strip: metal(F.housing.stripColor),
      backing: new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.7 }),
      glass: new THREE.MeshStandardMaterial({ color: '#08090b', metalness: 0.6, roughness: 0.07, envMapIntensity: 2.4 }),
      bezel: new THREE.MeshStandardMaterial({ color: '#26282c', metalness: 0.2, roughness: 0.35 }),
      lens: new THREE.MeshStandardMaterial({ color: '#0d1220', metalness: 0.85, roughness: 0.06, envMapIntensity: 3 }),
      lensRing: new THREE.MeshStandardMaterial({ color: '#55575d', metalness: 0.8, roughness: 0.28 }),
      sheen: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        metalness: 1,
        roughness: 0.04,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        envMapIntensity: 2.5,
      }),
      sensor: new THREE.MeshStandardMaterial({ color: '#4a3f38', metalness: 0.1, roughness: 0.22 }),
      slot: new THREE.MeshBasicMaterial({ color: '#050505' }),
      indicator: new THREE.MeshBasicMaterial({ color: indicatorOff.clone() }),
      indicatorOff,
      indicatorOn,
      icon: Object.assign(glowMaterial(bellIcon(), '#ffffff'), { opacity: 1 }),
      halo: glowMaterial(radial(2.2), F.icon.haloColor),
      shadow: new THREE.MeshBasicMaterial({
        color: '#000',
        alphaMap: radial(1.3),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    }
  }, [])
}

// Accent spot from the door side, aimed at the doorbell.
function Spot({ position }) {
  const ref = useRef()
  const target = useRef()
  useLayoutEffect(() => {
    ref.current.target = target.current
  }, [])
  return (
    <>
      <object3D ref={target} position={[0, 0, 0.02]} />
      <spotLight
        ref={ref}
        position={position}
        color={F.fill.color}
        intensity={F.fill.intensity}
        angle={0.24}
        penumbra={1}
        distance={2.5}
        decay={2}
      />
    </>
  )
}

export function Doorbell() {
  const m = useDoorbellMaterials()
  const key = useRef()

  useFrame(({ scene }) => {
    // Explicit env map, as on the switch panel, so the glass and graphite can
    // take a stronger reflection than the scene-wide environment intensity.
    if (scene.environment && m.glass.envMap !== scene.environment) {
      ;[m.body, m.strip, m.glass, m.lens, m.sheen].forEach((mat) => {
        mat.envMap = scene.environment
        mat.needsUpdate = true
      })
    }
    const level = bellLevel()
    const flare = bellFlare()
    key.current.position.z = -bellPress() * TRAVEL
    m.icon.color.setScalar(F.icon.standby + level * F.icon.active + flare * F.icon.flare)
    m.halo.opacity = level * 0.35 + flare * 0.9
    m.indicator.color.lerpColors(m.indicatorOff, m.indicatorOn, level)
  })

  const winW = WIN.x[1] - WIN.x[0]
  const winH = WIN.y[1] - WIN.y[0]
  const winX = (WIN.x[0] + WIN.x[1]) / 2
  const winY = (WIN.y[0] + WIN.y[1]) / 2
  const bell = SEGMENTS[BELL_KEY]
  const sensor = SEGMENTS[SENSOR_KEY]
  const mic = SEGMENTS[4]

  return (
    <group position={DOORBELL.position}>
      <Spot position={[-0.5, 0.3, 1.1]} />
      {/* soft contact shadow on the stone */}
      <mesh position={[0, -0.008, 0.0008]} material={m.shadow}>
        <planeGeometry args={[W * 1.9, H * 1.35]} />
      </mesh>

      {/* body */}
      <RoundedBox args={[BW, H, D]} radius={0.0012} smoothness={3} position={[BODY_X, 0, D / 2]} material={m.body} />
      {/* speaker slots on the door-side face */}
      {[-0.0044, -0.011, -0.0178].map((y) => (
        <mesh key={y} position={[LEFT - 0.00005, y, D * 0.52]} rotation-y={-Math.PI / 2} material={m.slot}>
          <planeGeometry args={[0.012, 0.0021]} />
        </mesh>
      ))}

      {/* camera window: glass slab, bezel square, lens, indicator */}
      <RoundedBox args={[winW, winH, 0.0016]} radius={0.0005} smoothness={2} position={[winX, winY, D + 0.0003]} material={m.glass} />
      <mesh position={[LENS.x, LENS.y, GLASS_Z + 0.00005]} material={m.bezel}>
        <planeGeometry args={[0.038, 0.051]} />
      </mesh>
      <mesh position={[LENS.x, LENS.y, GLASS_Z + 0.0007]} rotation-x={Math.PI / 2} material={m.lensRing}>
        <cylinderGeometry args={[0.0108, 0.0112, 0.0012, 40]} />
      </mesh>
      <mesh position={[LENS.x, LENS.y, GLASS_Z + 0.00135]} material={m.lens}>
        <circleGeometry args={[0.0082, 40]} />
      </mesh>
      <mesh position={[0.0085, 0.0875, GLASS_Z + 0.0001]} material={m.indicator}>
        <circleGeometry args={[0.0022, 24]} />
      </mesh>
      <mesh position={[winX, winY, GLASS_Z + 0.0018]} material={m.sheen}>
        <planeGeometry args={[winW, winH]} />
      </mesh>

      {/* key column */}
      <mesh position={[STRIP_X, (STRIP_TOP + STRIP_BOTTOM) / 2, (SD - 0.002) / 2]} material={m.backing}>
        <boxGeometry args={[SW - 0.001, STRIP_TOP - STRIP_BOTTOM, SD - 0.002]} />
      </mesh>
      {SEGMENTS.map((seg, i) =>
        i === BELL_KEY ? null : (
          <RoundedBox
            key={i}
            args={[SW, seg.h, SD]}
            radius={0.0007}
            smoothness={2}
            position={[STRIP_X, seg.y, SD / 2]}
            material={m.strip}
          />
        ),
      )}
      <mesh position={[STRIP_X, sensor.y, SD + 0.0001]} material={m.sensor}>
        <circleGeometry args={[0.0068, 32]} />
      </mesh>
      <mesh position={[STRIP_X + 0.0045, mic.y + mic.h * 0.36, SD + 0.0001]} material={m.slot}>
        <circleGeometry args={[0.0007, 12]} />
      </mesh>

      {/* bell key: travels on press, glyph glows */}
      <group ref={key}>
        <RoundedBox args={[SW, bell.h, SD]} radius={0.0007} smoothness={2} position={[STRIP_X, bell.y, SD / 2]} material={m.strip} />
        <mesh position={[STRIP_X, bell.y - 0.0005, SD + 0.0001]} material={m.icon}>
          <planeGeometry args={[0.0135, 0.0135]} />
        </mesh>
      </group>
      <mesh position={[STRIP_X, bell.y, SD + 0.0004]} material={m.halo}>
        <planeGeometry args={[0.07, 0.07]} />
      </mesh>
    </group>
  )
}
