import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useCursor } from '@react-three/drei'
import { PRODUCT } from '../config/materials'
import { LIGHTS } from '../config/journey'
import { PANEL } from './layout'
import { beadBlast, keyLabel, radial } from './textures'
import { pressDepth, useUI } from '../state/store'
import { toggleLight } from '../state/controller'

const { key: KEY, gap: GAP, keyDepth: KEY_D, plateDepth: PLATE_D, travel: TRAVEL } = PRODUCT.size
const PITCH = KEY + GAP
const PLATE = 2 * KEY + GAP + 0.0004

// Redraw engraved labels once the web font is available.
function useFontReady(font) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const family = font.split(',')[0]
    document.fonts
      ?.load(`400 48px ${family}`)
      .catch(() => {})
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [font])
  return ready
}

function useKeyMaterials() {
  const fontReady = useFontReady(PRODUCT.font)
  const bead = useMemo(() => beadBlast(), [])
  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PRODUCT.key.color,
        metalness: PRODUCT.key.metalness,
        roughness: PRODUCT.key.roughness,
        envMapIntensity: PRODUCT.key.envMapIntensity,
        bumpMap: bead,
        bumpScale: 0.4,
      }),
    [bead],
  )
  const faces = useMemo(
    () =>
      LIGHTS.map((l, i) => {
        const { map, bumpMap } = keyLabel(l.label, {
          font: fontReady ? PRODUCT.font : 'sans-serif',
          base: PRODUCT.key.color,
          engrave: PRODUCT.key.engrave,
          seed: 51 + i,
        })
        return new THREE.MeshStandardMaterial({
          map,
          bumpMap,
          bumpScale: PRODUCT.key.bumpScale,
          metalness: PRODUCT.key.metalness,
          roughness: PRODUCT.key.roughness,
          envMapIntensity: PRODUCT.key.envMapIntensity,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        })
      }),
    [fontReady],
  )
  useEffect(
    () => () =>
      faces.forEach((m) => {
        m.map.dispose()
        m.bumpMap.dispose()
        m.dispose()
      }),
    [faces],
  )
  const plate = useMemo(() => new THREE.MeshStandardMaterial(PRODUCT.backplate), [])
  return { body, faces, plate }
}

function Key({ index, body, face, interactive }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const row = Math.floor(index / 2)
  const col = index % 2
  const baseZ = PLATE_D + KEY_D / 2

  useFrame(() => {
    ref.current.position.z = baseZ - pressDepth(index) * TRAVEL
  })

  return (
    <group
      ref={ref}
      position={[(col - 0.5) * PITCH, (0.5 - row) * PITCH, baseZ]}
      onClick={(e) => {
        if (!interactive) return
        e.stopPropagation()
        toggleLight(index)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[KEY, KEY, KEY_D]} radius={0.0007} smoothness={3} material={body} castShadow />
      <mesh position={[0, 0, KEY_D / 2 + 0.00002]} material={face}>
        <planeGeometry args={[KEY - 0.0012, KEY - 0.0012]} />
      </mesh>
    </group>
  )
}

export function SwitchPanel() {
  const { body, faces, plate } = useKeyMaterials()
  const { mode } = useUI()
  const shadow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#000',
        alphaMap: radial(1.3),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    [],
  )

  // Explicit env map so the keys can take a stronger reflection than the
  // room's (scene-wide) environment intensity.
  useFrame(({ scene }) => {
    if (scene.environment && body.envMap !== scene.environment) {
      ;[body, ...faces].forEach((m) => {
        m.envMap = scene.environment
        m.needsUpdate = true
      })
    }
  })

  return (
    <group position={PANEL.position}>
      {/* soft contact shadow on the wall */}
      <mesh position={[0, -0.006, 0.0006]} material={shadow}>
        <planeGeometry args={[PLATE * 1.75, PLATE * 1.85]} />
      </mesh>
      <RoundedBox
        args={[PLATE, PLATE, PLATE_D]}
        radius={0.0008}
        smoothness={2}
        position={[0, 0, PLATE_D / 2]}
        material={plate}
      />
      {LIGHTS.map((l, i) => (
        <Key key={l.id} index={i} body={body} face={faces[i]} interactive={mode === 'explore'} />
      ))}
    </group>
  )
}
