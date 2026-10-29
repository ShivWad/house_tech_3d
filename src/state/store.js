import { useSyncExternalStore } from 'react'
import {
  journeyBellFlare,
  journeyBellLevel,
  journeyBellPress,
  journeyDoor,
  journeyLevel,
  journeyPress,
  LIGHTS,
} from '../config/journey'

// Per-frame animated values. Mutated by GSAP (scroll scrub, mode transitions,
// manual toggles) and read by the WebGL scene and the HTML overlay. Kept out
// of React state so nothing re-renders at 60fps.
export const anim = {
  p: 0, // smoothed journey progress, 0 → 1
  modeT: 0, // 0 = journey camera/lights, 1 = explore camera/lights
  veil: 0, // full-screen fade used for hard cuts
  manual: LIGHTS.map(() => ({ level: 0, press: 0 })),
}

const mix = (a, b, t) => a + (b - a) * t

export function lightLevel(i) {
  return mix(journeyLevel(i, anim.p), anim.manual[i].level, anim.modeT)
}

export function pressDepth(i) {
  return mix(journeyPress(i, anim.p), anim.manual[i].press, anim.modeT)
}

// Doorbell and front door follow the journey only; explore mode is inside,
// so it rests the bell and holds the door open.
export const bellPress = () => mix(journeyBellPress(anim.p), 0, anim.modeT)
export const bellLevel = () => mix(journeyBellLevel(anim.p), 0, anim.modeT)
export const bellFlare = () => mix(journeyBellFlare(anim.p), 0, anim.modeT)
export const doorOpen = () => mix(journeyDoor(anim.p), 1, anim.modeT)

// Discrete UI state (React).
let ui = {
  mode: 'journey', // 'journey' | 'explore'
  busy: false, // a mode transition is running
  on: LIGHTS.map(() => false), // manual toggle states
  reducedMotion: false,
  dialog: false,
}
const listeners = new Set()

export const getUI = () => ui
export function setUI(patch) {
  ui = { ...ui, ...(typeof patch === 'function' ? patch(ui) : patch) }
  listeners.forEach((l) => l())
}
function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useUI = () => useSyncExternalStore(subscribe, getUI)
