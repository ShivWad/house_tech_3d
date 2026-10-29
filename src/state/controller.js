import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { invalidate } from '@react-three/fiber'
import { INSIDE_PROGRESS, journeyLevel, LIGHTS } from '../config/journey'
import { anim, getUI, setUI } from './store'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

let scrub = null // the gsap tween ScrollTrigger scrubs

// Request a WebGL frame whenever any animated value moves (the canvas renders
// on demand).
let last = ''
gsap.ticker.add(() => {
  const m = anim.manual
  const key = `${anim.p}|${anim.modeT}|${m[0].level}${m[1].level}${m[2].level}${m[3].level}|${m[0].press}${m[1].press}${m[2].press}${m[3].press}`
  if (key !== last) {
    last = key
    invalidate()
  }
})

export function bindScroll(track) {
  scrub = gsap.to(anim, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
  })
  return () => {
    scrub?.scrollTrigger?.kill()
    scrub?.kill()
    scrub = null
  }
}

function lockScroll(locked) {
  document.documentElement.classList.toggle('scroll-locked', locked)
}

// Fade to dark, run `swap` while hidden, fade back.
function veilCut(swap, onDone) {
  gsap
    .timeline({ onComplete: onDone })
    .to(anim, { veil: 1, duration: 0.45, ease: 'power1.in' })
    .add(swap)
    .to(anim, { veil: 0, duration: 0.75, ease: 'power1.out' }, '+=0.1')
}

const quick = () => getUI().reducedMotion

export function enterExplore() {
  const ui = getUI()
  if (ui.mode === 'explore' || ui.busy) return
  // Carry over whatever the journey had lit at this point.
  const on = LIGHTS.map((_, i) => journeyLevel(i, anim.p) > 0.5)
  LIGHTS.forEach((_, i) => {
    gsap.killTweensOf(anim.manual[i])
    anim.manual[i].level = journeyLevel(i, anim.p)
    anim.manual[i].press = 0
    gsap.to(anim.manual[i], { level: on[i] ? 1 : 0, duration: 0.6, ease: 'power2.out' })
  })
  setUI({ mode: 'explore', on, busy: true })
  lockScroll(true)
  const done = () => setUI({ busy: false })
  gsap.killTweensOf(anim, 'modeT')
  if (quick()) {
    anim.modeT = 1
    done()
  } else if (anim.p >= INSIDE_PROGRESS) {
    gsap.to(anim, { modeT: 1, duration: 1.5, ease: 'power2.inOut', onComplete: done })
  } else {
    veilCut(() => (anim.modeT = 1), done)
  }
}

export function exitExplore() {
  const ui = getUI()
  if (ui.mode !== 'explore' || ui.busy || ui.reducedMotion) return
  setUI({ busy: true })
  const done = () => {
    lockScroll(false)
    setUI({ mode: 'journey', busy: false })
  }
  gsap.killTweensOf(anim, 'modeT')
  if (anim.p >= INSIDE_PROGRESS) {
    gsap.to(anim, { modeT: 0, duration: 1.4, ease: 'power2.inOut', onComplete: done })
  } else {
    veilCut(() => (anim.modeT = 0), done)
  }
}

// Back to the exterior, lights off, scroll at the top.
export function replay() {
  const ui = getUI()
  if (ui.busy || ui.reducedMotion) return
  setUI({ busy: true })
  veilCut(
    () => {
      gsap.killTweensOf(anim, 'modeT')
      anim.modeT = 0
      lockScroll(false)
      window.scrollTo({ top: 0, behavior: 'instant' })
      ScrollTrigger.update()
      // Skip the scrub's catch-up so we don't rewind through the house.
      scrub?.scrollTrigger?.getTween()?.progress(1)
      anim.p = 0
      setUI({ mode: 'journey' })
    },
    () => setUI({ busy: false }),
  )
}

export function toggleLight(i) {
  const ui = getUI()
  if (ui.mode !== 'explore') return
  const next = !ui.on[i]
  setUI({ on: ui.on.map((v, j) => (j === i ? next : v)) })
  const m = anim.manual[i]
  gsap.killTweensOf(m)
  // Key travels down, the light follows as it bottoms out, key returns.
  gsap
    .timeline()
    .to(m, { press: 1, duration: 0.09, ease: 'power2.out' })
    .to(m, { level: next ? 1 : 0, duration: next ? 0.55 : 0.4, ease: 'power2.out' })
    .to(m, { press: 0, duration: 0.2, ease: 'power2.inOut' }, '<0.06')
}

export function setReducedMotion(reduced) {
  setUI({ reducedMotion: reduced })
  if (reduced) {
    // Static room view with every light available to toggle.
    LIGHTS.forEach((_, i) => {
      anim.manual[i].level = 0
      anim.manual[i].press = 0
    })
    anim.modeT = 1
    setUI({ mode: 'explore', on: LIGHTS.map(() => false), busy: false })
  } else {
    anim.modeT = 0
    setUI({ mode: 'journey', busy: false })
  }
}

// Dev-only handle for automated checks.
if (import.meta.env.DEV) window.__journey = { anim, getUI }
