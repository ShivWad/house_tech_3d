// Surface and product finishes. Colours are sRGB hex. `tile` is the real-world
// size (metres) one repeat of the procedural texture covers.

export const PRODUCT = {
  // Matte warm-grey / champagne metallic key caps (reference photo).
  key: {
    color: '#b4aea6',
    engrave: '#6c665f',
    metalness: 0.3,
    roughness: 0.44,
    envMapIntensity: 2.2,
    bumpScale: 0.45,
  },
  // Dark backing plate and the fine gaps between keys.
  backplate: { color: '#191715', metalness: 0.35, roughness: 0.55 },
  font: '"Manrope Variable", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  // Panel geometry in metres. Slightly generous versus a real plate so it
  // reads in wide shots; adjust freely.
  size: { key: 0.0545, gap: 0.0013, keyDepth: 0.0062, plateDepth: 0.0058, travel: 0.0024 },
}

export const SURFACES = {
  plaster: { color: '#e4dbcf', roughness: 0.94, tile: 1.6, bump: 0.06 },
  limewash: { color: '#d2c2ad', roughness: 0.9, tile: 2.2, bump: 0.08 },
  ceiling: { color: '#ebe5db', roughness: 0.96, tile: 2, bump: 0.03 },
  oak: { color: '#ffffff', roughness: 0.55, tile: 3.6, bump: 0.15 },
  oakDark: { color: '#b49a83', roughness: 0.52, tile: 1.2, bump: 0.1 },
  travertine: { color: '#efe4d2', roughness: 0.82, tile: 2.4, bump: 0.25 },
  travertineSolid: { color: '#e7dccb', roughness: 0.72, tile: 1.2, bump: 0.15 },
  timber: { color: '#8f7562', roughness: 0.8, tile: 1, bump: 0.4 },
  bronze: { color: '#3f362e', roughness: 0.38, metalness: 0.85 },
  glass: { color: '#5d7480', roughness: 0.04, opacity: 0.16 },
  water: { color: '#0b1114', roughness: 0.06, metalness: 0.1 },
  ground: { color: '#2a2b24', roughness: 1 },
  gravel: { color: '#6b655b', roughness: 1, tile: 1, bump: 1 },
  hedge: { color: '#26301f', roughness: 1 },
  foliage: { color: '#344029', roughness: 0.95, tile: 0.6 },
  bark: { color: '#3a3129', roughness: 0.95 },
  boucle: { color: '#d9d0c3', roughness: 1 },
  rug: { color: '#8e8273', roughness: 1 },
  ceramic: { color: '#cdbfae', roughness: 0.55 },
  ceramicDark: { color: '#3b3530', roughness: 0.45 },
}

// Video doorbell at the front door (reference photo). Dimensions in metres,
// by eye and slightly generous like the panel; `travel` is the bell key press.
export const DOORBELL_FINISH = {
  housing: { color: '#3b3d41', stripColor: '#35373b', metalness: 0.25, roughness: 0.46, envMapIntensity: 1.6 },
  // Soft accent light so the dark housing reads at dusk (candela).
  fill: { color: '#fff3e6', intensity: 2.2 },
  // Camera indicator: dark at rest, cool white while a call is in progress.
  indicator: { off: '#15171b', on: '#d6e8ff', intensity: 2.2 },
  // Bell glyph brightness (colour multiplier): at rest, while calling, flash on press.
  icon: { standby: 0.55, active: 1.1, flare: 2.6, haloColor: '#dfe9ff' },
  size: { height: 0.2, bodyWidth: 0.057, stripWidth: 0.021, gap: 0.0012, depth: 0.032, stripDepth: 0.032, travel: 0.0016 },
}
