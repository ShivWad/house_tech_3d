import { useFrame } from '@react-three/fiber'
import { EXPLORE_VIEW } from '../config/journey'
import { anim } from '../state/store'
import { makeSample, sampleJourney, sampleView } from './cameraPath'

const journey = makeSample()
const explore = makeSample()

// Places the camera from the scroll timeline, blended toward the fixed
// explore view by the mode transition value.
export function CameraRig() {
  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height
    sampleJourney(anim.p, aspect, journey)
    sampleView(EXPLORE_VIEW, aspect, explore)
    const t = anim.modeT
    camera.position.lerpVectors(journey.pos, explore.pos, t)
    journey.target.lerp(explore.target, t)
    camera.lookAt(journey.target)
    const fov = journey.fov + (explore.fov - journey.fov) * t
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })
  return null
}
