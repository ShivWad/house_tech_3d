import { DOORBELL as DOORBELL_LAYOUT, PANEL as PANEL_LAYOUT } from '../scene/layout'

// The whole cinematic sequence hangs off one normalized scroll progress value
// (0 → 1). Everything here is plain data or a pure function of that value, so
// scrolling backwards, jumping, or flinging the page always resolves to the
// same camera / button / light / text state.
//
// World units are metres. +z points out of the front facade toward the street,
// the front door sits at x ≈ 1.6 with the doorbell beside it at x ≈ 2.52, the
// switch panel at (2.95, 1.25, -3.2).

export const SCROLL_LENGTH_VH = 1250

// Below this progress the camera is outside or in the doorway; mode changes
// from there use a fade instead of a camera move so nothing flies through walls.
export const INSIDE_PROGRESS = 0.52

// Doorstep beat: the doorbell key is pressed, its bell lights up and the
// camera indicator wakes, then the pivot door swings open.
export const BELL = { press: 0.312, door: [0.398, 0.458] }

export const LIGHTS = [
  { id: 'wall', label: 'Wall Light', key: '1', press: 0.628 },
  { id: 'spot', label: 'Spot Light', key: '2', press: 0.716 },
  { id: 'niche', label: 'Niche Light', key: '3', press: 0.788 },
  { id: 'path', label: 'Path Light', key: '4', press: 0.86 },
]

// Press choreography, in progress units relative to each light's `press` time.
// The light starts ramping the moment the key bottoms out.
export const PRESS = { down: 0.0065, hold: 0.01, up: 0.008, ramp: 0.032 }

export const TEXT = {
  intro: { out: [0.036, 0.088] },
  doorbell: { in: [0.248, 0.268], out: [0.335, 0.348] },
  panel: { in: [0.556, 0.576], out: [0.598, 0.607] },
  caption: { lead: 0.01, tail: 0.056, fade: 0.01 },
  outro: { in: [0.932, 0.964] },
  status: { in: [0.552, 0.576] },
  replay: { in: [0.08, 0.112] },
}

// Camera framing. Each view has a landscape version and an optional `portrait`
// override; the rig blends between them by viewport aspect. `fov` is the
// vertical field of view at 16:9 and is widened automatically on narrower
// landscape screens.
const PANEL = PANEL_LAYOUT.position
const BELL_AT = DOORBELL_LAYOUT.position

// Exterior → doorbell → doorway → panel close-up: one continuous spline.
export const APPROACH = [
  {
    t: 0.0,
    pos: [10.4, 2.35, 18.5], target: [-0.6, 2.3, -2], fov: 34,
    portrait: { pos: [6.5, 2.0, 21], target: [1.2, 2.6, -1], fov: 50 },
  },
  {
    t: 0.08,
    pos: [9.0, 2.1, 15.6], target: [0.2, 2.1, -2], fov: 35,
    portrait: { pos: [5.8, 1.9, 18], target: [1.4, 2.4, -1], fov: 50 },
  },
  {
    t: 0.176,
    pos: [3.7, 1.72, 7.4], target: [1.6, 1.6, -2], fov: 40,
    portrait: { pos: [3.0, 1.7, 8.2], target: [1.6, 1.7, -2], fov: 56 },
  },
  // Doorbell three-quarter view from the door side, then a slow push-in
  // while the key is pressed.
  {
    t: 0.265,
    pos: [2.34, 1.42, 0.72], target: [BELL_AT[0] + 0.005, BELL_AT[1] - 0.01, 0], fov: 32,
    portrait: { pos: [2.38, 1.41, 0.6], target: [BELL_AT[0], BELL_AT[1] - 0.01, 0], fov: 44 },
  },
  {
    t: 0.335,
    pos: [2.4, 1.39, 0.58], target: [BELL_AT[0], BELL_AT[1] - 0.015, 0], fov: 30,
    portrait: { pos: [2.42, 1.38, 0.5], target: [BELL_AT[0], BELL_AT[1] - 0.015, 0], fov: 42 },
  },
  // Dolly back with the doorbell still framed, turn to the door, then creep
  // forward while it swings open.
  {
    t: 0.365,
    pos: [2.5, 1.52, 1.55], target: [2.25, 1.38, 0], fov: 38,
    portrait: { pos: [2.45, 1.52, 1.8], target: [2.2, 1.38, 0], fov: 54 },
  },
  {
    t: 0.405,
    pos: [1.95, 1.62, 2.2], target: [1.66, 1.5, -3], fov: 42,
    portrait: { pos: [1.8, 1.62, 2.5], target: [1.68, 1.52, -3], fov: 60 },
  },
  {
    t: 0.455,
    pos: [1.74, 1.6, 1.3], target: [1.7, 1.5, -3], fov: 43,
    portrait: { pos: [1.7, 1.61, 1.5], target: [1.7, 1.52, -3], fov: 60 },
  },
  {
    t: 0.5,
    pos: [1.82, 1.55, -0.9], target: [2.65, 1.36, -3.6], fov: 44,
    portrait: { pos: [1.85, 1.55, -0.9], target: [2.7, 1.36, -3.6], fov: 60 },
  },
  {
    t: 0.56,
    pos: [3.2, 1.38, -2.6], target: PANEL, fov: 30,
    portrait: { pos: [3.03, 1.31, -2.5], target: PANEL, fov: 44 },
  },
]

// After the close-up: discrete stations with eased moves between them. A
// station repeated with a later `t` is a hold.
const CLOSE_PUSH = {
  pos: [3.17, 1.37, -2.66], target: PANEL, fov: 30,
  portrait: { pos: [3.02, 1.3, -2.55], target: PANEL, fov: 44 },
}
const DEMO_POS = [2.72, 1.43, -1.82]
const VIEW_WALL = {
  pos: DEMO_POS, target: [0.55, 1.55, -7.6], fov: 46,
  portrait: { pos: [2.6, 1.45, -1.5], target: [-4.4, 1.85, -8.1], fov: 58 },
}
const VIEW_SPOT = {
  pos: [2.7, 1.42, -1.9], target: [1.15, 1.5, -7.9], fov: 45,
  portrait: { pos: [2.6, 1.45, -1.5], target: [-2.2, 1.55, -8.1], fov: 58 },
}
const VIEW_NICHE = {
  pos: [2.68, 1.4, -2.0], target: [1.8, 1.42, -8.0], fov: 43,
  portrait: { pos: [2.6, 1.45, -1.6], target: [-0.15, 1.4, -8.1], fov: 58 },
}
const VIEW_PATH = {
  pos: [2.68, 1.38, -2.05], target: [2.2, 1.2, -8.2], fov: 41,
  portrait: { pos: [2.55, 1.4, -1.9], target: [1.7, 0.85, -9.6], fov: 58 },
}
const VIEW_FINAL = {
  pos: [2.98, 1.58, -0.72], target: [-0.35, 1.3, -8.1], fov: 49,
  portrait: { pos: [2.85, 1.55, -0.65], target: [-1.2, 1.35, -8.1], fov: 66 },
}

export const STATIONS = [
  { t: 0.56, ...APPROACH[APPROACH.length - 1] },
  { t: 0.636, ...CLOSE_PUSH },
  { t: 0.676, ...VIEW_WALL },
  { t: 0.692, ...VIEW_WALL },
  { t: 0.71, ...VIEW_SPOT },
  { t: 0.764, ...VIEW_SPOT },
  { t: 0.782, ...VIEW_NICHE },
  { t: 0.836, ...VIEW_NICHE },
  { t: 0.854, ...VIEW_PATH },
  { t: 0.9, ...VIEW_PATH },
  { t: 0.952, ...VIEW_FINAL },
  { t: 1.0, ...VIEW_FINAL },
]

// Fixed view for "Try the switches": the panel in the right foreground with
// the wall light, artwork, niche and lit corridor visible past the corner.
export const EXPLORE_VIEW = {
  pos: [2.76, 1.46, -1.58], target: [0.35, 1.42, -7.9], fov: 48,
  portrait: { pos: [2.85, 1.5, -0.7], target: [-0.9, 1.3, -8.1], fov: 68 },
}

// ── pure timeline helpers ─────────────────────────────────────────────

export const clamp01 = (v) => Math.min(1, Math.max(0, v))

export function smoothstep(a, b, v) {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const fadeIn = ([a, b], p) => smoothstep(a, b, p)
export const fadeOut = ([a, b], p) => 1 - smoothstep(a, b, p)

function pressAt(at, p) {
  const down = smoothstep(at - PRESS.down, at, p)
  const up = smoothstep(at + PRESS.hold, at + PRESS.hold + PRESS.up, p)
  return down * (1 - up)
}

export const journeyPress = (i, p) => pressAt(LIGHTS[i].press, p)

export function journeyLevel(i, p) {
  const at = LIGHTS[i].press
  return smoothstep(at, at + PRESS.ramp, p)
}

export const journeyBellPress = (p) => pressAt(BELL.press, p)

// 0 = standby glow, 1 = call in progress. Settles back once the door is open.
export function journeyBellLevel(p) {
  const end = BELL.door[1]
  return smoothstep(BELL.press, BELL.press + PRESS.ramp * 0.5, p) * (1 - smoothstep(end, end + 0.03, p))
}

// Brief flash on the bell icon as the key bottoms out.
export function journeyBellFlare(p) {
  const at = BELL.press
  return smoothstep(at - 0.002, at + 0.004, p) * (1 - smoothstep(at + 0.01, at + 0.04, p))
}

export const journeyDoor = (p) => smoothstep(BELL.door[0], BELL.door[1], p)

export function captionOpacity(i, p) {
  const at = LIGHTS[i].press
  const { lead, tail, fade } = TEXT.caption
  return smoothstep(at - lead - fade, at - lead, p) * (1 - smoothstep(at + tail, at + tail + fade, p))
}
