// Key positions in the house (metres). Front facade at z = 0, floor at y = 0.

export const PANEL = { position: [2.95, 1.25, -3.2] } // on the foyer feature wall, facing +z
export const DOORBELL = { position: [2.52, 1.36, 0] } // on the stone facade right of the door, facing +z

export const ROOM = {
  ceiling: 3.3,
  backWall: -8.1, // living room back wall face
  leftWall: -5.7,
  coreFront: -3.2, // foyer feature wall (panel wall)
  coreLeft: 2.6,
  corridor: { x: [1.0, 2.6], z: [-12.0, -8.1] },
  niche: { x: [-0.6, 0.3], y: [0.75, 2.25], depth: 0.35 },
  door: { x: [1.0, 2.2], height: 2.9 },
}

export const FIXTURE_POS = {
  sconce: [-4.6, 2.05, ROOM.backWall],
  art: { center: [-2.2, 1.68, ROOM.backWall], size: [1.8, 1.26] },
  artSpot: [-2.2, 3.22, -6.35],
  pathLights: [-8.7, -9.65, -10.6, -11.5],
}
