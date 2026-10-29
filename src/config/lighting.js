// Lighting presets. Intensities are three.js physical units (candela for
// point/spot lights). Each switchable fixture scales its sources and glow
// decals by a 0–1 level supplied by the timeline or the manual controls.

export const DUSK = {
  exposure: 1.0,
  sky: { top: '#141c33', mid: '#3c4a72', horizon: '#d99a78', ground: '#18171a', glow: '#ff9a62' },
  fog: { color: '#252a3a', near: 30, far: 95 },
  environmentIntensity: 0.32,
  hemisphere: { sky: '#7686b0', ground: '#2c241d', intensity: 0.32 },
  // Last light of the sun, low behind the house on the left.
  afterglow: { color: '#ffb48a', intensity: 0.7, position: [-30, 12, -40] },
  // Cool blue-hour light falling through the front glazing.
  glazingFill: { color: '#8ea2d0', intensity: 1.0, position: [-2.4, 1.6, -0.45], size: [5.8, 3] },
  // Always-on context lights.
  canopy: { color: '#ffc58f', intensity: 26, glow: 0.65 },
  treeUplight: { color: '#ffd4a0', intensity: 70 },
  upperWindow: { color: '#ffc896', emissive: 0.55 },
  // Dim foyer downlight that rakes the panel so its edges read even before
  // any key is pressed.
  foyer: { color: '#fff1e2', intensity: 11 },
}

export const FIXTURES = {
  wall: { color: '#ffb36b', intensity: 5, distance: 6, glow: 1.05, emissive: 6 },
  spot: { color: '#ffd3a3', intensity: 85, angle: 0.42, penumbra: 0.8, emissive: 4 },
  niche: { color: '#ffc285', intensity: 3.4, distance: 2.2, glow: 1.0, emissive: 8 },
  path: { color: '#ffbf80', intensity: 2.4, distance: 2.8, glow: 1.0, emissive: 7 },
}
