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

// ---------------------------------------------------------- station 01 ---
// The Intake Hall (Data Ingestion & Feature Lake). Same shell discipline
// as Station 03 — 600 mm tiles, 3.3 m ceiling — flow runs west → east:
// sources → stream gallery → schema gate → lake tiers → feature vault.
// Full inventory: research/station01-components.md. Nothing above this
// block is shared with or altered by the Station 01 contract.
export const STATION01 = {
  room: { widthX: 12.0, depthZ: 7.2, height: 3.3 },   // 20 x 12 tiles
  sources: {
    faceX: -5.4,                 // front plane of the four gateway bays
    centreX: -5.68,              // bay body centre (0.55 deep)
    bayZ: [-2.8, -1.15, 1.15, 2.8],
    bayWidth: 1.25,
    bayDepth: 0.55,
    kinds: ['api', 'cdc', 'iot', 'batch'],   // G1..G4, north → south
  },
  gallery: {
    x0: -3.6, x1: 1.8,           // channel bed run
    topY: 0.9,                   // waist height
    width: 0.9,
    lanes: 3,
    laneGap: 0.26,
    blockPitch: 0.27,
    blockLen: 0.24,
    channels: [                  // topic per channel, north → south
      { topic: 'clickstream', z: -1.8, partitions: 24, source: 0 },
      { topic: 'orders', z: -0.6, partitions: 12, source: 1, hero: true },
      { topic: 'telemetry', z: 0.6, partitions: 48, source: 2 },
      { topic: 'cdc.users', z: 1.8, partitions: 6, source: 3 },
    ],
  },
  gate: {
    x: 2.2,
    spanZ: 2.45,                 // uprights at z = ±spanZ
    beamY: 2.4,
    registry: { x: 2.2, z: -3.0 },
    dlq: { x: 2.2, z: 2.9 },
  },
  tiers: [                       // east-wall run, bronze → silver → gold
    { tier: 'bronze', z: -2.45 },
    { tier: 'silver', z: -0.85 },
    { tier: 'gold', z: 0.75 },
  ],
  tierBay: { x: 5.62, width: 1.45, height: 2.0, depth: 0.7 },
  vault: {
    archiveX: [3.5, 4.3, 5.1],   // archive enclosures on the south wall
    archiveZ: 3.28,
    online: { x: 5.3, z: 2.3 },
    lectern: { x: 4.5, z: 2.45, rotY: -0.5 },
    exitDoorZ: 2.6,              // east-wall exit toward Station 02
  },
};

// ---------------------------------------------------------- station 02 ---
// The Lattice Hall (Neural Network & Attention Lattice). Same shell
// discipline — 600 mm tiles, 3.3 m ceiling — flow west → east:
// token rail → six transformer block bays on the residual spine →
// LM head. A scale model of the 2017 paper's decoder stack:
// N = 6, d_model = 512, h = 8, d_k = 64, FFN 512 → 2048 → 512.
// Full inventory: research/station02-components.md. Nothing above this
// block is shared with or altered by the Station 02 contract.
export const STATION02 = {
  room: { widthX: 12.0, depthZ: 7.2, height: 3.3 },   // 20 x 12 tiles
  tokens: ['the', 'cat', 'sat', 'on', 'the', 'mat', ',', '.'],
  tokenRail: {
    x: -5.4,                     // plates stand on a rail at the west wall
    z0: -2.45,                   // z of token 0; plates run north → south
    pitch: 0.6,                  // plate spacing along z
    railY: 0.92,                 // rail top height
    embedCabinet: { x: -5.62, z: -3.05 },  // west wall, north end
    entryDoorZ: 2.6,             // west entry — Station 01's east exit
  },
  spine: { x0: -4.8, x1: 5.4, y: 0.9, z: 0 },   // the residual stream
  blocks: {
    centresX: [-3.6, -1.8, 0, 1.8, 3.6, 5.4],
    spanZ: 1.8,                  // portal uprights at z = ±spanZ
    hero: 2,                     // bay index 2 (BLOCK 3/6) is the hero bay
    heads: 8,                    // H1..H8 per bay
    headZ0: -1.4,                // z of head/node 0 within a bay
    headPitch: 0.4,
    galleryY: 1.98,              // head frame centre height
    nodeY: 1.04,                 // sequence node rail height
    gate1X: -0.38, gate2X: 0.38, // LN gates at the bay thresholds
    pressX: 0,                   // FFN press centred under the gallery
    collar1X: 0.14, collar2X: 0.5, // "+" merge collars, bay-relative
  },
  board: {                       // attention matrix board, north wall
    x: 0, z: -3.38, y: 1.75, width: 2.6, height: 1.7,
  },
  qkv: {                         // projection cabinets, south wall
    z: 3.22, frontZ: 2.97, xs: [-1.05, -0.35, 0.35, 1.05],
  },
  lmHead: {
    x: 5.9,                      // scoreboard panel face plane
    gateX: 5.96,                 // FINAL LN collar at the feed rail's end
    boardY: 2.05, boardW: 2.2, boardH: 1.5,
  },
  flow: { period: 23, travel: 16, points: 720 },  // one pass, then rest
};

// -------------------------------------------------------------- materials ---
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

// ---------------------------------------------------------- station 06 ---
// The Observatory (Global Edge Observability). The blueprint's one
// sanctioned exception: a DIM room — a NOC at 3 a.m. — but fully
// architectural: panelled walls, console furniture, a curved panelled
// map wall. The exception is to the light, never the discipline. Flow
// west → east: telemetry in → OTel pipeline → golden-signal consoles →
// traces waterfall → error-budget gauges → the world. There is NO east
// exit: the map wall closes the world, and the dais in front of it is
// where the journey's scroll ends (blueprint anchor 0.96).
// Full inventory: research/station06-components.md. Nothing above this
// block is shared with or altered by the Station 06 contract.
export const STATION06 = {
  room: { widthX: 12.0, depthZ: 7.2, height: 3.3 },   // 20 x 12 tiles
  // the sanctioned palette exception — exactly two new tones, this
  // room only, kept inside this block so the shared palette is untouched
  palette: { nightInk: 0x11151c, mapLand: 0x39434e },
  entry: { doorZ: 0.0, conduitZ: -1.15 },  // west door; telemetry conduit lands beside it
  pipeline: {                              // OTel Collector run, south wall
    frontZ: 2.98,                          // cabinet face plane (bodies run to the wall)
    centreZ: 3.26,
    width: 1.5, height: 1.92, depth: 0.56,
    stages: [                              // COLLECT → PROCESS → EXPORT
      { id: 'receive', x: -3.6 },
      { id: 'process', x: -0.6 },
      { id: 'export', x: 2.4 },
    ],
    conduitY: 2.52,                        // overhead run linking the stages
  },
  consoles: {                              // golden-signal arc, centre room
    kinds: ['latency', 'traffic', 'errors', 'saturation'],  // the SRE book's order
    xs: [-1.8, -0.93, -0.07, 0.8],
    z: 0.78,                               // arc centre line
    arcLift: 0.22,                         // z added at the arc's ends (shallow bow)
    width: 0.78, depth: 0.62, height: 1.06,
  },
  waterfall: {                             // traces cabinet, north wall
    x: -1.5, frontZ: -3.3, centreZ: -3.44, width: 1.15, height: 2.2, depth: 0.28,
  },
  gauges: { x: 3.6, z: -2.9, rotY: -0.5, width: 1.7 },  // bank angled toward the dais
  mapWall: {
    zSpan: 3.0,                            // face spans z −3.0 → +3.0 along the curve
    centreX: 5.2,                          // face x at centre; edges curve back to ≈ 5.8
    radius: 7.8,                           // centre of curvature at x = 13.0, behind the wall
    curveCentreX: 13.0,
    bandY0: 0.7, bandY1: 2.3,              // the map display band
    latTop: 80, latBottom: -60,            // equirectangular window the texture draws
    panels: 14,
  },
  dais: { x: 2.0, z: 0, width: 1.7, depth: 2.2, height: 0.09 },  // ~3 m from the map face
};

// ---------------------------------------------------------- station 05 ---
// The Mesh Hall (Kubernetes Mesh & Canary Rollout). Same shell
// discipline — 600 mm tiles, 3.3 m ceiling — flow west → east:
// image dock → control-plane dais → node field → switchboard →
// canary lanes (v1 / v2) → exit to observability. A teaching-scale
// model of one cluster corner: 3 etcd members, 4 worker nodes, one
// deployment (`model-api`, 10 replicas) caught mid-canary.
// Full inventory: research/station05-components.md. Nothing above
// this block is shared with or altered by the Station 05 contract.
export const STATION05 = {
  room: { widthX: 12.0, depthZ: 7.2, height: 3.3 },   // 20 x 12 tiles
  dock: {
    plinth: { x: -5.52, z: -1.55 },        // image-crate landing plinth, west wall
    lectern: { x: -4.86, z: -1.24, rotY: 0.55 },   // deployment manifest lectern
    entryDoorZ: 0,                          // west entry — Station 04's east exit
  },
  dais: {
    x0: -5.2, x1: -2.2,                     // platform run along the north-west wall
    z: -2.72, depth: 1.35,                  // platform centre line + z extent
    topY: 0.45,                             // raised platform height
    consoles: [                             // west → east: the four who decide
      { kind: 'api', x: -4.85 },
      { kind: 'etcd', x: -4.0 },
      { kind: 'scheduler', x: -3.15 },
      { kind: 'controller', x: -2.52 },
    ],
    etcdDrumsX: [-4.32, -4.0, -3.68],       // the trio, behind the etcd desk
    etcdZ: -3.08,
  },
  nodes: {
    rows: [                                 // two rows facing the centre aisle
      { z: -1.5, facing: 1 },               // faces +Z, into the aisle
      { z: 0.6, facing: -1 },               // faces -Z, into the aisle
    ],
    xs: [-1.15, 1.15],                      // two racks per row (NODE 1–4)
    width: 1.06, height: 1.98, depth: 0.66,
    berths: { cols: 2, rows: 4 },           // capsule berths per rack face
  },
  switchboard: {
    x0: 0.4, x1: 4.6, z: -3.38,             // panel run on the north wall
    panelY: 1.5, fasciaY: 2.44,
  },
  tray: { y: 2.55, northZ: -3.26, southX: -2.88 },  // overhead request tray
  lanes: {
    x0: -2.4, x1: 3.4, seats: 10, pitch: 0.58, bedTopY: 0.24,
    v1: { z: 1.55 },                        // stable — brushed steel
    v2: { z: 2.45 },                        // canary — dgxGold trim
  },
  gate: {
    x: -2.75, z: 2.0,                       // traffic-split gate, lanes' west head
    lectern: { x: -3.38, z: 2.0, rotY: -Math.PI / 2 },  // analysis lectern, faces the lanes
  },
  hpa: { x: 3.85, z: 2.0, cradleX: 4.48 },  // governor cabinet + pending-pod cradle
  exit: { doorZ: 2.0 },                     // east exit toward Station 06
  flow: {
    steps: [10, 25, 50, 100],               // the Argo setWeight staircase (v2 %)
    hold: 20, restAtFull: 35, between: 15,  // seconds of hall time per phase
    points: 1150,                           // total traffic points (budget ≤ 1200)
  },
};

// ---------------------------------------------------------- station 04 ---
// The Build Hall (CI/CD & Container Build Pipeline). Same shell
// discipline — 600 mm tiles, 3.3 m ceiling — flow west → east:
// commit trigger → build cells → quality gates → image-layer stack →
// registry → signing & SBOM → deploy ring → GitOps gate. The worked
// build is #482: commit c41a7e2 packaging Station 03's trained model
// as `model-server` — a code-only change, so four layers come back
// CACHED and only the top COPY src/ slab is REBUILT.
// Full inventory: research/station04-components.md. Nothing above
// this block is shared with or altered by the Station 04 contract.
export const STATION04 = {
  room: { widthX: 12.0, depthZ: 7.2, height: 3.3 },   // 20 x 12 tiles
  entryDoorZ: -0.6,              // west entry — Station 03's east exit
  exitDoorZ: -0.6,               // east exit toward Station 05
  line: { z: -0.6, x0: -4.8, x1: 1.6, topY: 0.9 },   // the production line
  commit: {
    gantryX: -5.5, spanZ: [-1.5, 0.3], beamY: 2.4,
    dock: { x: -5.0, z: -2.1 },  // model-artifact intake dock
  },
  cells: { z: -3.02, xs: [-4.2, -3.2, -2.2], spunDown: 2 },  // runners, north wall
  gates: {
    xs: [-1.4, 0.2], spanZ: [-1.65, 0.45], beamY: 2.3,
    rejectBin: { x: 0.2, z: 0.85 },
  },
  stack: { x: 1.7, z: -0.6, scaffold: { x: 1.7, z: -2.4 } },
  registry: {
    x: 5.75,                     // shelving face plane, east wall
    runs: [{ z0: -3.2, z1: -1.8 }, { z0: 0.8, z1: 3.0 }],
    pedestal: { x: 5.45, z: 0.45 },
  },
  desk: {
    x: 3.6, z: 2.4,              // signing & SBOM desk, south-east
    rekor: { x: 4.32, z: 2.5 },  // transparency-log ledger rail
    lectern: { x: 2.9, z: 2.52, rotY: 0.5 },   // SBOM lectern
  },
  ring: { x: 3.7, z: -0.6, radius: 1.35, topY: 0.93 },  // the deploy ring
  flow: { cycle: 30 },           // seconds per build loop
};
