// world.js — the world contract for the AI/ML & DevOps 3D portfolio.
// Every dimension, colour and layout constant lives here (units: metres).
// Scene modules import from this file only — no magic numbers elsewhere.

// ---------------------------------------------------------------- scale ---
export const U = 0.04445;              // 1U = 44.45 mm (EIA-310)
export const TILE = 0.6;               // raised-floor tile: 600 x 600 mm

export const RACK = {
  width: 0.6,                          // 600 mm cabinet
  depth: 1.2,                          // 1200 mm cabinet
  units: 42,                           // 42U
  plinth: 0.12,                        // base plinth height
  bottomRail: 0.04,                    // frame rail below U1
  topRail: 0.05,                       // frame rail above U42
  post: 0.05,                          // corner post section
  get uBase() { return this.plinth + this.bottomRail; },        // y of U1 bottom
  get uHeight() { return this.units * U; },                     // 1.8669 m of U space
  get height() { return this.uBase + this.uHeight + this.topRail; }, // ~2.078 m
  interiorWidth: 0.44,                 // 19" tray face width
  trayDepth: 0.75,                     // server tray depth (rear space = cabling)
};

// --------------------------------------------------------------- layout ---
export const LAYOUT = {
  racksPerRow: 8,
  rowNames: ['A', 'B'],
  aisleWidth: 1.2,                     // cold aisle = 2 floor tiles
  // Row A sits at z = +rowZ and faces -Z; row B at z = -rowZ faces +Z.
  get rowZ() { return this.aisleWidth / 2 + RACK.depth / 2; },  // 1.2
  get rowStartX() { return -(this.racksPerRow * RACK.width) / 2 + RACK.width / 2; },
  heroRacks: { A: [3, 4], B: [3, 4] }, // indices that carry DGX hero chassis
  hoseHeroRacks: { A: [3, 4] },        // racks with full per-tray hose loops
  room: {                              // hall shell
    widthX: 9.6,                       // 16 tiles
    depthZ: 8.4,                       // 14 tiles
    height: 3.3,
  },
  containment: {                       // cold-aisle containment envelope
    roofY: 2.2,
    get endX() { return (LAYOUT.racksPerRow * RACK.width) / 2; }, // ±2.4
  },
  cdu: { x: 3.6, z: 1.2 },             // in-row CDU position (east, row A side)
};

// -------------------------------------------------------------- palette ---
export const PALETTE = {
  // shell
  floorTile: 0xd2d5d8,
  floorSeam: 0x3a3f42,
  perfTile: 0xb9bdc1,
  subfloor: 0x8f959a,
  wall: 0xeceef0,
  wallSeam: 0xc9ccd0,
  ceiling: 0xdfe2e5,
  beam: 0x7d8287,
  safetyYellow: 0xd8a812,
  // racks & servers
  rackBlack: 0x17191c,
  rackFrame: 0x101215,
  doorMesh: 0x191c20,
  interiorDark: 0x0a0b0c,
  blankPanel: 0x121316,
  trayBody: 0x1b1e22,
  trayTrim: 0xb9bec4,
  switchGold: 0x8f7a3a,
  dgxGold: 0xc9a24d,
  steel: 0xb9bec4,
  brushedSteel: 0x9fa6ad,
  galvanised: 0xa8adb2,
  // infrastructure colours (real conventions — do not recolours these)
  coolantSupply: 0x1d6fd1,             // blue
  coolantReturn: 0xe8710a,             // orange
  hoseBlack: 0x131517,
  fibreAqua: 0x2fb7c9,                 // OM3/OM4 multimode
  fibreYellow: 0xf2c230,               // OS2 single-mode
  cat6Blue: 0x2456c8,
  copper: 0xb87333,                    // bare busbar / NVLink spine
  busway: 0xc9ccd1,
  buswayStripe: 0x2456c8,
  // light
  lightNeutral: 0xfff4e0,              // ~5000 K ceiling strips
  lightHousing: 0x2a2d31,
  // status LEDs
  ledGreen: 0x39ff7a,
  ledBlue: 0x3fa9ff,
  ledAmber: 0xffb02e,
  ledRed: 0xff4444,
  // signage
  exitGreen: 0x0a8a3c,
  fireRed: 0xc0272d,
  signFace: 0xf2f3f4,
  signInk: 0x14171a,
};

// ------------------------------------------------------------ materials ---
// Shared PBR-ish constants so every module grades the same way.
export const SURFACE = {
  paintedMetal: { roughness: 0.55, metalness: 0.35 },
  powderCoat: { roughness: 0.62, metalness: 0.2 },
  plastic: { roughness: 0.8, metalness: 0.0 },
  polishedSteel: { roughness: 0.28, metalness: 0.9 },
  brushedSteel: { roughness: 0.42, metalness: 0.85 },
  copper: { roughness: 0.3, metalness: 1.0 },
  gold: { roughness: 0.35, metalness: 0.8 },
  floor: { roughness: 0.32, metalness: 0.05 },
};

// -------------------------------------------------------------- helpers ---
// Deterministic pseudo-random (same layout every load / every screenshot).
export function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// y centre of a U slot. uIndex is 0-based from the bottom (U1 = 0).
export function uCentreY(uIndex, uSpan = 1) {
  return RACK.uBase + (uIndex + uSpan / 2) * U;
}

// Rack anchor for a row/index — the single source of layout truth.
export function rackAnchor(row, index) {
  const facing = row === 'A' ? 1 : -1; // +1: body extends +Z from aisle
  return {
    row,
    index,
    code: `${row}0${index + 1}`,
    x: LAYOUT.rowStartX + index * RACK.width,
    z: facing * LAYOUT.rowZ,
    facing,                            // world +Z direction of the rack rear
    rotY: row === 'A' ? 0 : Math.PI,   // local -Z is always the rack front
    hero: (LAYOUT.heroRacks[row] || []).includes(index),
    hoseHero: (LAYOUT.hoseHeroRacks[row] || []).includes(index),
  };
}

export function allAnchors() {
  const out = [];
  for (const row of LAYOUT.rowNames) {
    for (let i = 0; i < LAYOUT.racksPerRow; i++) out.push(rackAnchor(row, i));
  }
  return out;
}
