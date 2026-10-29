import * as THREE from 'three'
import { APPROACH, STATIONS, smoothstep } from '../config/journey'

// Camera sampling for the journey. The approach (exterior → doorway → panel)
// is one centripetal Catmull-Rom spline; key times are mapped onto it with a
// monotone Hermite curve so speed changes smoothly between keys and eases in
// and out at both ends. After the close-up the camera eases between stations.

const v3 = (a) => new THREE.Vector3(...a)
const variant = (key, portrait) => (portrait && key.portrait ? key.portrait : key)

// Monotone cubic time → spline index mapping with zero slope at the ends.
function monotoneTiming(times) {
  const n = times.length
  const d = times.slice(0, -1).map((t, i) => 1 / (times[i + 1] - t))
  const m = times.map((_, i) => (i === 0 || i === n - 1 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i])))
  return (t) => {
    if (t <= times[0]) return 0
    if (t >= times[n - 1]) return n - 1
    let k = 0
    while (t > times[k + 1]) k++
    const h = times[k + 1] - times[k]
    const s = (t - times[k]) / h
    const s2 = s * s
    const s3 = s2 * s
    return (2 * s3 - 3 * s2 + 1) * k + (s3 - 2 * s2 + s) * h * m[k] + (-2 * s3 + 3 * s2) * (k + 1) + (s3 - s2) * h * m[k + 1]
  }
}

function buildTrack(portrait) {
  const keys = APPROACH.map((k) => variant(k, portrait))
  return {
    pos: new THREE.CatmullRomCurve3(keys.map((k) => v3(k.pos)), false, 'centripetal'),
    target: new THREE.CatmullRomCurve3(keys.map((k) => v3(k.target)), false, 'centripetal'),
    fov: keys.map((k) => k.fov),
    timing: monotoneTiming(APPROACH.map((k) => k.t)),
    end: APPROACH[APPROACH.length - 1].t,
    stations: STATIONS.map((s) => {
      const v = variant(s, portrait)
      return { t: s.t, pos: v3(v.pos), target: v3(v.target), fov: v.fov }
    }),
  }
}

const tracks = { landscape: buildTrack(false), portrait: buildTrack(true) }

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)

function sampleTrack(track, p, out) {
  if (p <= track.end) {
    const idx = track.timing(p)
    const u = idx / (track.fov.length - 1)
    track.pos.getPoint(u, out.pos)
    track.target.getPoint(u, out.target)
    const k = Math.min(Math.floor(idx), track.fov.length - 2)
    out.fov = THREE.MathUtils.lerp(track.fov[k], track.fov[k + 1], idx - k)
    return out
  }
  const st = track.stations
  let k = 0
  while (k < st.length - 2 && p > st[k + 1].t) k++
  const a = st[k]
  const b = st[k + 1]
  const e = easeInOut(THREE.MathUtils.clamp((p - a.t) / (b.t - a.t), 0, 1))
  out.pos.lerpVectors(a.pos, b.pos, e)
  out.target.lerpVectors(a.target, b.target, e)
  out.fov = THREE.MathUtils.lerp(a.fov, b.fov, e)
  return out
}

export const makeSample = () => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 })

// 0 for landscape screens, 1 for tall phones.
export const portraitBlend = (aspect) => smoothstep(1.15, 0.75, aspect)

// Landscape framings are authored at 16:9; on narrower landscape screens keep
// roughly the same horizontal coverage by widening the vertical FOV a little.
function adaptFov(fov, aspect) {
  const ref = 16 / 9
  if (aspect >= ref) return fov
  const half = THREE.MathUtils.degToRad(fov / 2)
  const wide = THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(half) * ref) / aspect))
  return Math.min(wide, fov * 1.3)
}

const tmpL = makeSample()
const tmpP = makeSample()

function blend(aspect, a, b, out) {
  const w = portraitBlend(aspect)
  a.fov = adaptFov(a.fov, Math.max(aspect, 1))
  out.pos.lerpVectors(a.pos, b.pos, w)
  out.target.lerpVectors(a.target, b.target, w)
  out.fov = THREE.MathUtils.lerp(a.fov, b.fov, w)
  return out
}

export function sampleJourney(p, aspect, out) {
  sampleTrack(tracks.landscape, p, tmpL)
  sampleTrack(tracks.portrait, p, tmpP)
  return blend(aspect, tmpL, tmpP, out)
}

export function sampleView(view, aspect, out) {
  const l = view
  const pv = view.portrait ?? view
  tmpL.pos.set(...l.pos)
  tmpL.target.set(...l.target)
  tmpL.fov = l.fov
  tmpP.pos.set(...pv.pos)
  tmpP.target.set(...pv.target)
  tmpP.fov = pv.fov
  return blend(aspect, tmpL, tmpP, out)
}
