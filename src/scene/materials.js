import * as THREE from 'three'
import { SURFACES } from '../config/materials'
import * as tex from './textures'

// Shared materials, created once on first use. Geometry UVs are in metres
// (see geometry.js), so a texture's repeat is 1 / its tile size.

let cache = null

function withTile(t, tile) {
  const c = t.clone()
  c.repeat.set(1 / tile, 1 / tile)
  c.needsUpdate = true
  return c
}

function textured(spec, { map, bump }, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness ?? 0,
    map: map ? withTile(map, spec.tile) : null,
    bumpMap: bump ? withTile(bump, spec.tile) : null,
    bumpScale: spec.bump ?? 1,
    ...extra,
  })
}

function plain(spec, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness ?? 0,
    ...extra,
  })
}

export function getSurfaces() {
  if (cache) return cache
  const S = SURFACES
  const plasterTex = tex.plaster(3, 1)
  const limeTex = tex.plaster(9, 2.6)
  const oakTex = tex.oakPlanks()
  const travTex = tex.travertine(21, true)
  const travSolidTex = tex.travertine(23, false)
  const battenTex = tex.battens()
  const gravelTex = tex.plaster(17, 3)

  cache = {
    plaster: textured(S.plaster, plasterTex),
    limewash: textured(S.limewash, limeTex),
    ceiling: textured(S.ceiling, plasterTex),
    oak: textured(S.oak, oakTex),
    oakDark: textured(S.oakDark, oakTex),
    travertine: textured(S.travertine, travTex),
    travertineSolid: textured(S.travertineSolid, travSolidTex),
    timber: textured(S.timber, battenTex),
    gravel: textured(S.gravel, gravelTex),
    bronze: plain(S.bronze),
    glass: new THREE.MeshStandardMaterial({
      color: S.glass.color,
      roughness: S.glass.roughness,
      metalness: 0,
      transparent: true,
      opacity: S.glass.opacity,
      depthWrite: false,
    }),
    water: plain(S.water),
    ground: plain(S.ground),
    hedge: plain(S.hedge),
    foliage: textured(S.foliage, { bump: gravelTex.bump }, { bumpScale: 2 }),
    bark: plain(S.bark),
    boucle: textured(S.boucle, { bump: plasterTex.bump }, { bumpScale: 2 }),
    rug: textured(S.rug, { bump: gravelTex.bump }, { bumpScale: 1.5 }),
    ceramic: plain(S.ceramic),
    ceramicDark: plain(S.ceramicDark),
    black: new THREE.MeshStandardMaterial({ color: '#0d0c0b', roughness: 0.6 }),
  }
  // Boucle / rug textures need their own tile scale.
  cache.boucle.bumpMap.repeat.set(4, 4)
  cache.rug.bumpMap.repeat.set(3, 3)
  return cache
}

// Emissive material for lamp apertures; intensity animated per frame.
export function emissive(color) {
  return new THREE.MeshStandardMaterial({
    color: '#1a1714',
    emissive: color,
    emissiveIntensity: 0,
    roughness: 0.4,
  })
}

// Additive light decal (wall scallops, floor washes).
export function glowMaterial(map, color) {
  return new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    fog: false,
  })
}
