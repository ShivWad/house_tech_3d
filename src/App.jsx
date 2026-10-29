import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { SCROLL_LENGTH_VH } from './config/journey'
import { useUI } from './state/store'
import { bindScroll, setReducedMotion } from './state/controller'
import { Overlay } from './ui/Overlay'
import { Fallback } from './ui/Fallback'

const Experience = lazy(() => import('./scene/Experience'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.error('3D scene failed, showing fallback', error)
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function App() {
  const [webgl] = useState(hasWebGL)
  const [failed, setFailed] = useState(false)
  const prefersReduced = usePrefersReducedMotion()
  const [motionOptIn, setMotionOptIn] = useState(false)
  const reduced = prefersReduced && !motionOptIn
  const { reducedMotion } = useUI()
  const track = useRef()

  useEffect(() => setReducedMotion(reduced), [reduced])

  useEffect(() => {
    if (reducedMotion || !webgl || failed) return
    window.scrollTo(0, 0)
    return bindScroll(track.current)
  }, [reducedMotion, webgl, failed])

  if (!webgl || failed) return <Fallback />

  return (
    <>
      <div className="scene" aria-hidden="true">
        <SceneBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <Experience onError={() => setFailed(true)} />
          </Suspense>
        </SceneBoundary>
      </div>
      <p className="sr-only">
        Prototype architectural film: approach a house at dusk, ring the video doorbell beside the front door, step
        inside as the door opens, and watch four keys on a wall panel
        switch on a wall light, an artwork spotlight, a display niche and a corridor path light. Use “Try the
        switches” to control the lights directly.
      </p>
      <Overlay onPlayJourney={() => setMotionOptIn(true)} />
      {!reducedMotion && <div ref={track} className="scroll-track" style={{ height: `${SCROLL_LENGTH_VH}vh` }} />}
    </>
  )
}
