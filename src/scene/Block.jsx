import { useMemo } from 'react'
import * as THREE from 'three'

// Box with UVs in metres on every face, so tiled textures keep a constant
// real-world scale regardless of the box size.
function meterBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i
      uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1])
    }
  }
  return g
}

// Architectural block defined by its extents: x={[x0, x1]} y={[y0, y1]} z={[z0, z1]}.
// `mat` is one material, or an object of per-face overrides
// ({ px, nx, py, ny, pz, nz, rest }).
export function Block({ x, y, z, mat, cast = false, receive = true, ...props }) {
  const w = x[1] - x[0]
  const h = y[1] - y[0]
  const d = z[1] - z[0]
  const geometry = useMemo(() => meterBox(w, h, d), [w, h, d])
  const material = useMemo(() => {
    if (mat?.isMaterial) return mat
    const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
    return faces.map((f) => mat[f] ?? mat.rest)
  }, [mat])
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}
      castShadow={cast}
      receiveShadow={receive}
      {...props}
    />
  )
}
