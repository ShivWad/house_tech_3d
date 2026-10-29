import * as THREE from 'three'

// All surface textures are generated at runtime on canvases: no downloads,
// deterministic (seeded) so every load looks identical.

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Tileable fractal value noise in [0, 1]. sx/sy stretch the base cell count
// per axis so grain can run along one direction.
function fbm(size, { cells = 4, octaves = 5, seed = 1, sx = 1, sy = 1, gain = 0.5 } = {}) {
  const out = new Float32Array(size * size)
  const rand = rng(seed)
  let amp = 1
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const cx = Math.max(1, Math.round(cells * sx * 2 ** o))
    const cy = Math.max(1, Math.round(cells * sy * 2 ** o))
    const grid = new Float32Array(cx * cy).map(() => rand())
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * cy
      const y0 = Math.floor(gy)
      const fy = gy - y0
      const sy0 = fy * fy * (3 - 2 * fy)
      const r0 = (y0 % cy) * cx
      const r1 = ((y0 + 1) % cy) * cx
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * cx
        const x0 = Math.floor(gx)
        const fx = gx - x0
        const sx0 = fx * fx * (3 - 2 * fx)
        const x1 = (x0 + 1) % cx
        const a = grid[r0 + x0] + (grid[r0 + x1] - grid[r0 + x0]) * sx0
        const b = grid[r1 + x0] + (grid[r1 + x1] - grid[r1 + x0]) * sx0
        out[y * size + x] += (a + (b - a) * sy0) * amp
      }
    }
    total += amp
    amp *= gain
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

function canvas(w, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function toTexture(c, { color = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

// Write a function of (x, y) → [r, g, b] (0–255) into a canvas.
function paint(size, fn, h = size) {
  const c = canvas(size, h)
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x, y)
      const k = (y * size + x) * 4
      img.data[k] = r
      img.data[k + 1] = g
      img.data[k + 2] = b
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

const grey = (v) => {
  const g = Math.max(0, Math.min(255, v * 255))
  return [g, g, g]
}

// Soft, cloudy plaster: subtle tonal drift + fine trowel texture for bump.
export function plaster(seed = 3, strength = 1) {
  const S = 512
  const low = fbm(S, { cells: 3, octaves: 4, seed })
  const fine = fbm(S, { cells: 32, octaves: 3, seed: seed + 7 })
  const map = paint(S, (x, y) => {
    const v = 0.93 + (low[y * S + x] - 0.5) * 0.09 * strength + (fine[y * S + x] - 0.5) * 0.03
    return grey(v)
  })
  const bump = paint(S, (x, y) => grey(0.5 + (fine[y * S + x] - 0.5) * 0.8 + (low[y * S + x] - 0.5) * 0.3))
  return { map: toTexture(map), bump: toTexture(bump, { color: false }) }
}

// Wide-plank oak: per-plank tone, staggered ends, grain along the length.
// One tile = 12 planks across.
export function oakPlanks(seed = 11) {
  const S = 1024
  const rand = rng(seed)
  const planks = 16
  const grain = fbm(S, { cells: 2, octaves: 5, seed: seed + 1, sx: 1, sy: 24 })
  const figure = fbm(S, { cells: 3, octaves: 4, seed: seed + 2, sx: 1, sy: 6 })
  const cols = Array.from({ length: planks }, () => {
    const offs = rand()
    const segs = []
    let y = -offs
    while (y < 1) {
      const len = 0.55 + rand() * 0.45
      segs.push({ start: y, end: y + len, tone: 0.86 + rand() * 0.22, hue: rand() })
      y += len
    }
    return segs
  })
  const base = [154, 116, 82]
  const bumpData = new Float32Array(S * S)
  const map = paint(S, (x, y) => {
    const col = Math.floor((x / S) * planks)
    const u = (x / S) * planks - col
    const v = y / S
    const seg = cols[col].find((s) => v >= s.start && v < s.end) ?? cols[col][0]
    const g = grain[y * S + x]
    const f = figure[y * S + x]
    let k = seg.tone * (0.84 + (g - 0.5) * 0.5 + (f - 0.5) * 0.25)
    // Bevelled joints between boards and at board ends.
    const edge = Math.min(u, 1 - u) * (S / planks)
    const end = Math.min(Math.abs(v - seg.start), Math.abs(v - seg.end)) * S
    const joint = Math.min(edge, end)
    if (edge < 1.4) k *= 0.62
    else if (end < 1) k *= 0.8
    bumpData[y * S + x] = joint < 1.4 ? 0.2 : 0.55 + (g - 0.5) * 0.4
    const warm = (seg.hue - 0.5) * 10
    return [base[0] * k + warm, base[1] * k + warm * 0.5, base[2] * k - warm * 0.3]
  })
  const bump = paint(S, (x, y) => grey(bumpData[y * S + x]))
  return { map: toTexture(map), bump: toTexture(bump, { color: false }) }
}

// Honed travertine cladding: horizontal banding, pores, large-format joints
// (two courses of 1.2 × 0.6 m slabs per tile, staggered).
export function travertine(seed = 21, joints = true) {
  const S = 1024
  const band = fbm(S, { cells: 2, octaves: 5, seed, sx: 0.5, sy: 6 })
  const cloud = fbm(S, { cells: 4, octaves: 4, seed: seed + 5 })
  const pores = fbm(S, { cells: 64, octaves: 2, seed: seed + 9 })
  const bumpData = new Float32Array(S * S)
  const map = paint(S, (x, y) => {
    const b = band[y * S + x]
    const c = cloud[y * S + x]
    const pr = pores[y * S + x]
    let k = 0.9 + (b - 0.5) * 0.28 + (c - 0.5) * 0.12
    let h = 0.6 + (b - 0.5) * 0.2
    if (pr > 0.78) {
      k *= 0.9
      h = 0.25
    }
    if (joints) {
      const rows = 4
      const rowF = (y / S) * rows
      const row = Math.floor(rowF)
      const shift = row % 2 ? 0.25 : 0
      const colF = ((x / S + shift) % 1) * 2
      const jy = Math.min(rowF - row, 1 - (rowF - row)) * (S / rows)
      const jx = Math.min(colF % 1, 1 - (colF % 1)) * (S / 2)
      if (Math.min(jx, jy) < 1.5) {
        k *= 0.62
        h = 0.05
      }
    }
    bumpData[y * S + x] = h
    return [236 * k, 222 * k, 198 * k]
  })
  const bump = paint(S, (x, y) => grey(bumpData[y * S + x]))
  return { map: toTexture(map), bump: toTexture(bump, { color: false }) }
}

// Vertical timber battens with shadow gaps. One tile = 1 m, 10 battens.
export function battens(seed = 31) {
  const S = 512
  const rand = rng(seed)
  const n = 10
  const tones = Array.from({ length: n }, () => 0.82 + rand() * 0.3)
  const grain = fbm(S, { cells: 2, octaves: 4, seed, sx: 2, sy: 16 })
  const bumpData = new Float32Array(S * S)
  const map = paint(S, (x, y) => {
    const f = (x / S) * n
    const i = Math.floor(f)
    const u = f - i
    const gap = u > 0.82
    const k = gap ? 0.18 : tones[i] * (0.88 + (grain[y * S + x] - 0.5) * 0.35)
    bumpData[y * S + x] = gap ? 0 : 0.7
    return [118 * k, 92 * k, 72 * k]
  })
  const bump = paint(S, (x, y) => grey(bumpData[y * S + x]))
  return { map: toTexture(map), bump: toTexture(bump, { color: false }) }
}

// Fine bead-blast speckle for the metal keys.
export function beadBlast(seed = 41) {
  const S = 256
  const rand = rng(seed)
  const c = paint(S, () => grey(0.5 + (rand() - 0.5) * 0.5))
  return toTexture(c, { color: false })
}

// A key cap face: colour map with darker engraved lettering, and a matching
// bump map where the letters sit below the surface.
export function keyLabel(text, { font, base, engrave, seed = 51 }) {
  const S = 512
  const rand = rng(seed)
  const color = canvas(S)
  const ctx = color.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  // Bead-blast speckle.
  const img = ctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 14
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  const fontSpec = `400 ${S * 0.088}px ${font}`
  ctx.font = fontSpec
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = engrave
  ctx.globalAlpha = 0.85
  ctx.fillText(text, S / 2, S * 0.47)

  const bump = canvas(S)
  const b = bump.getContext('2d')
  b.fillStyle = '#ffffff'
  b.fillRect(0, 0, S, S)
  b.font = fontSpec
  b.textAlign = 'center'
  b.textBaseline = 'middle'
  b.filter = 'blur(1.2px)'
  b.fillStyle = '#000000'
  b.fillText(text, S / 2, S * 0.47)

  const map = toTexture(color, { repeat: false })
  const bumpMap = toTexture(bump, { color: false, repeat: false })
  return { map, bumpMap, canvases: [color, bump] }
}

// Abstract artwork for the spotlit wall: warm mineral ground, a dark arch,
// a pale disc. Painterly texture via noise.
export function artwork(seed = 61) {
  const W = 640
  const H = 448
  const n = fbm(512, { cells: 6, octaves: 5, seed })
  const c = paint(
    W,
    (x, y) => {
      const t = n[(y % 512) * 512 + (x % 512)]
      const u = x / W
      const v = y / H
      // ground
      let r = 168, g = 122, b = 88
      // arch
      const ax = 0.38, aw = 0.2, top = 0.3
      const inArch = Math.abs(u - ax) < aw && (v > top + aw * 1.2 || Math.hypot((u - ax) / aw, (v - (top + aw * 1.2)) / (aw * 1.43)) < 1)
      if (inArch && v < 0.9) {
        r = 62; g = 48; b = 40
      }
      // disc
      if (Math.hypot((u - 0.72) * (W / H), v - 0.36) < 0.12) {
        r = 226; g = 206; b = 176
      }
      // lower band
      if (v > 0.9) {
        r = 120; g = 82; b = 58
      }
      const k = 0.86 + (t - 0.5) * 0.45
      return [r * k, g * k, b * k]
    },
    H,
  )
  return toTexture(c, { repeat: false })
}

// Light decals (used with additive blending).
function gradientCanvas(w, h, draw) {
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  draw(ctx, w, h)
  return toTexture(c, { repeat: false })
}

// Up/down wash from a wall sconce: bright and narrow at the source, widening
// and fading away from it. Source at the bottom edge of the texture.
export function scallop() {
  return gradientCanvas(256, 512, (ctx, w, h) => {
    const img = ctx.getImageData(0, 0, w, h)
    for (let y = 0; y < h; y++) {
      const d = 1 - y / h // 0 at source (bottom), 1 at far end
      const halfW = 0.06 + d * 0.42
      const fall = Math.pow(1 - d, 1.6) * (0.35 + 0.65 * Math.min(1, d * 6))
      for (let x = 0; x < w; x++) {
        const u = Math.abs(x / w - 0.5) / halfW
        const edge = Math.max(0, 1 - u * u)
        const v = Math.pow(edge, 1.4) * fall
        const k = (y * w + x) * 4
        img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}

// Floor wash from a low wall light: source at the top edge.
export function floorFan() {
  return gradientCanvas(256, 256, (ctx, w, h) => {
    const img = ctx.getImageData(0, 0, w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x / w - 0.5) * 2
        const dy = y / h
        const r = Math.hypot(dx * 0.8, dy * 1.05)
        const v = Math.max(0, 1 - r) ** 2.2 * Math.min(1, dy * 10)
        const k = (y * w + x) * 4
        img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}

export function radial(power = 2) {
  return gradientCanvas(128, 128, (ctx, w, h) => {
    const img = ctx.getImageData(0, 0, w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const r = Math.hypot(x / w - 0.5, y / h - 0.5) * 2
        const v = Math.max(0, 1 - r) ** power
        const k = (y * w + x) * 4
        img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}

// Vertical gradient (bright top → dark bottom) for the niche back wall.
export function verticalFade() {
  return gradientCanvas(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.25, '#9a9a9a')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

// Bell glyph for the doorbell key, white on black, for additive use.
export function bellIcon() {
  return gradientCanvas(256, 256, (ctx, w) => {
    const u = w / 256
    ctx.translate(w / 2, w / 2 + 6 * u)
    ctx.fillStyle = '#fff'
    ctx.filter = `blur(${0.8 * u}px)`
    ctx.beginPath()
    ctx.moveTo(-62 * u, 42 * u)
    ctx.quadraticCurveTo(-40 * u, 26 * u, -40 * u, -6 * u)
    ctx.bezierCurveTo(-40 * u, -58 * u, 40 * u, -58 * u, 40 * u, -6 * u)
    ctx.quadraticCurveTo(40 * u, 26 * u, 62 * u, 42 * u)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, -54 * u, 8 * u, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 54 * u, 11 * u, 0, Math.PI)
    ctx.fill()
  })
}
