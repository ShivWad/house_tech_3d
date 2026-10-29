import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { DUSK } from '../config/lighting'
import { Atmosphere } from './Atmosphere'
import { CameraRig } from './CameraRig'
import { Doorbell } from './Doorbell'
import { Fixtures } from './Fixtures'
import { House } from './House'
import { Interior } from './Interior'
import { SwitchPanel } from './SwitchPanel'

function useQuality() {
  return useMemo(() => {
    const small = Math.min(window.innerWidth, window.innerHeight) < 700
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    const mobile = small || coarse
    return {
      dpr: [1, mobile ? 1.5 : 2],
      shadowSize: mobile ? 512 : 1024,
      antialias: !mobile || window.devicePixelRatio < 2,
    }
  }, [])
}

export default function Experience({ onError }) {
  const q = useQuality()
  return (
    <Canvas
      className="scene-canvas"
      frameloop="demand"
      dpr={q.dpr}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: q.antialias, powerPreference: 'high-performance' }}
      camera={{ position: [9.6, 2.35, 18.5], fov: 34, near: 0.1, far: 500 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = DUSK.exposure
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onError?.()
        })
      }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Atmosphere />
        <House />
        <Doorbell />
        <Interior />
        <Fixtures shadowSize={q.shadowSize} />
        <SwitchPanel />
      </Suspense>
    </Canvas>
  )
}
