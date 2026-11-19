// world.js — the shared contract for the electrical 3D portfolio.
// Units are METRES, real scale, everywhere. Stations append their own
// STATIONNN block at the end of this file (append-only: never edit
// another station's block or the shared sections above it).

export const WORLD = {
  // 50 Hz system, Indian-grid practice per the research inventories
  frequencyHz: 50,
};

export const PALETTE = {
  // metals & structure
  galvanised: 0xb9bfc4,      // hot-dip galvanised steel, matte light grey
  brushedSteel: 0x9aa1a7,
  darkSteel: 0x3c4147,
  structureGrey: 0x707880,   // lattice steelwork, weathered
  copper: 0xb87333,
  brass: 0xa88d4a,
  aluminium: 0xc9ccd0,
  // electrical plant
  tankGreen: 0x5f7161,       // transformer tank grey-green (BS 14C39 family)
  tankGrey: 0x767c78,
  porcelainBrown: 0x6e4632,  // glazed porcelain insulators
  porcelainGrey: 0x8d9299,   // grey porcelain / silicone rubber sheds
  polymerShed: 0x7d8489,
  sf6Tank: 0xa7adb2,         // breaker tanks, light grey enamel
  panelBlue: 0x33566e,       // control kiosk / marshalling boxes (site blue-grey)
  cabinetCream: 0xd8d2c2,    // older control cabinets
  safetyYellow: 0xe3a008,
  warningRed: 0xb03028,
  // civil & ground
  concrete: 0xb5b0a6,
  concreteDark: 0x8f8a7f,
  gravel: 0x9a958a,
  asphalt: 0x4a4a4c,
  grass: 0x77894f,
  dryGrass: 0xa9a05e,
  soil: 0x6e5b49,
  // interiors
  floorTile: 0xcfd2cd,
  wallPanel: 0xd9d5c9,
  deskTop: 0x4c5157,
  // light & signal
  ledGreen: 0x2fae5f,
  ledAmber: 0xffb02e,
  ledRed: 0xd63a2f,
  screenGlow: 0xbfe0d8,
  gold: 0xd9a441,
};

export const SURFACE = {
  brushedSteel: { roughness: 0.42, metalness: 0.85 },
  galvanised: { roughness: 0.62, metalness: 0.55 },
  powderCoat: { roughness: 0.55, metalness: 0.25 },
  porcelain: { roughness: 0.28, metalness: 0.05 },
  mattePaint: { roughness: 0.8, metalness: 0.05 },
  concrete: { roughness: 0.95, metalness: 0.0 },
};

// ---------------------------------------------------------- station 04 -----
// STATION04 — Turbine Hall (Unit 5, 660 MW / 3000 rpm). The hall reads
// west → east along the shaft: front standard → HP → IP → LP ×2 →
// generator → exciter, on a spring-isolated deck at +14 m with the
// condenser in the basement below. All dimensions from
// research/station04-components.md (Sipat K-660-247 / TBB-660-2T3).
export const STATION04 = {
  hall: {
    x0: -42, x1: 42,            // 84 m of hall for one unit
    aZ: -18, bZ: 18, cZ: 30,    // column rows A / B / C (AB bay 36 m, BC bay 12 m)
    eavesY: 33, craneRailY: 29.6, bayPitch: 8.4,
    clerestoryY0: 18, clerestoryY1: 27,
  },
  deck: { x0: -33, x1: 33, halfZ: 6.5, topY: 14, soffitY: 11.2, colPitch: 5.2, colZ: 5.4 },
  shaft: { y: 18.6, z: 0 },     // shaft centreline, 4.6 m above the deck
  frontStandard: { x: -29.0 },
  bearingsX: [-27.6, -19.7, -18.2, -9.0, -8.1, 1.8, 2.7, 12.6, 13.5, 24.4, 25.2, 28.6], // N1..N12
  hp: { x0: -26.9, x1: -20.4, dia: 3.2 },
  ip: { x0: -17.2, x1: -9.7, dia: 3.8 },
  lp: [
    { x0: -7.4, x1: 1.1 },
    { x0: 3.4, x1: 11.9 },
  ],
  lpHood: { halfZ: 4.5, topY: 22.5 },
  generator: { x0: 14.2, x1: 23.7, dia: 4.0 },
  exciter: { x0: 25.7, x1: 28.2, dia: 1.8 },
  turningGearX: 29.2,
  crane: { span: 36, y: 30.6, mainT: 200, auxT: 20, parkedX: [28, -36] },
  condenser: { x0: -7, x1: 12, halfZ: 4.5, baseY: 1.5, topY: 8.5 },
  cwPipe: { dia: 2.6 },
  mot: { x: -24, z: -11, volM3: 58 },
  unit: { name: 'UNIT 5', mw: 660, loadMw: 640, rpm: 3000, stages: 59 },
};

// ---------------------------------------------------------- station 01 --
// Station 01 — Control Room at Dawn. Freeze-frame 05:58:40 IST.
// Axes: x east(+), z south(+), y up. Video wall on the north wall
// (z = -4.5); consoles face north; entrance south; mimic + dawn window
// on the east wall; SCADA server room behind glass on the west wall.
export const STATION01 = {
  room: { widthX: 13.2, depthZ: 9.0, height: 3.4, northZ: -4.5, southZ: 4.5, eastX: 6.6, westX: -6.6, tile: 0.6 },
  wall: {
    tileW: 1.21, tileH: 0.682, bottomY: 1.05, x0: -5.45, x1: 5.45,
    centreX0: -3.025, centreX1: 3.025, faceZ: -4.44, plinthH: 0.15,
    bannerY: 2.61, bannerH: 0.34, fasciaY: 3.06, clockX: 5.88, clockY: 3.02,
  },
  consoles: {
    deskXs: [-3.15, -1.05, 1.05, 3.15], deskZ: 1.35, frontZ: 0.9,
    w: 1.8, d: 0.9, topY: 0.72, arcDeg: [8, 3, 3, 8],
  },
  supervisor: { platZ0: 3.22, platZ1: 4.46, platTopY: 0.15, deskZ: 3.82, deskW: 2.0 },
  mimic: { x: 6.58, centreZ: -2.6, w: 3.6, h: 1.8, centreY: 1.78, stripY: 0.94 },
  windows: { x: 6.6, z0: 0.3, z1: 4.3, sillY: 1.0, topY: 2.6 },
  serverRoom: { glassX: -6.6, glassZ0: -3.6, glassZ1: 2.4, rackX: -7.7, rackFaceX: -7.2, rackZ: [-2.75, -2.0, -1.25, -0.5, 0.25, 1.0], batteryZ: 2.0, gpsZ: -3.3 },
  door: { x0: 1.0, x1: 2.4, h: 2.15 },
  // the value register (inventory section 12) — every screen reads these
  values: {
    time: '05:58:40', freqHz: 49.93, bandLo: 49.90, bandHi: 50.05, ufls1: 49.4,
    indiaDemandGW: 148.2, rampMWmin: 90, regionDemandMW: 24612, regionGenMW: 24431,
    drawalMW: 24290, aceMW: -180, agcCycleS: 4, scanS: 2, pmuFps: 50,
    busKV: 131.4, t2MVA: 43.6, t2RatingMVA: 50, t2Tap: 7, t1MVA: 31.2, t1Tap: 6,
    fdr1A: 96, fdr2A: 88, alarms24h: 132, standingAlarms: 3, sunrise: '06:12',
    cityC: 24, roomC: 23.5, roomRH: 48, hydroMW: 200,
  },
  tones: {
    screenBg: 0x0d1420, hotlineRed: 0xb02020, teak: 0x7a5c42,
    acousticA: 0x8a8d89, acousticB: 0x5f7373, rackBlack: 0x1e2124,
    deskTop: 0x33373b, wallCharcoal: 0x232629,
  },
};

// ---------------------------------------------------------- station 06 ---
// Station 06 — City Grid at Night. One city block at 20:15, mid-May:
// Feeder F-7 "Station Road", an 11 kV open ring (NOP between RMU-3 and
// RMU-4, open), fed tonight from the west. The block's coincident peak
// is ≈ 950 kW; the hero 315 kVA pole transformer carries 78% of its
// rating. The load-curve wall carries the city's day, arithmetic-
// checked against the inventory: the hourly table sums to exactly
// 11,004 MWh, average 458.5 ≈ 459 MW, load factor 459/612 = 0.75.
export const STATION06 = {
  // the night palette — kept inside this block (the AI/ML observatory
  // precedent): the shared PALETTE stays untouched.
  palette: {
    skyZenith: 0x0d1b2e, skyHorizon: 0x2a2438, skyGlow: 0x4a3a30,
    ledPool: 0xffe9c4,              // 4000 K LED streetlight
    sodiumPool: 0xff9d45,           // the one unreplaced 2200 K fitting
    windowWarm: 0xffc98a, windowDim: 0x9a7a52, windowCool: 0xdfe9ff,
    tvBlue: 0x7fa8d8, curtain: 0x6b5a44,
    wallPanel: 0x1c2733, wallLine: 0xfff3dd, wallAmber: 0xffb35c,
    kioskGreen: 0x77816f,           // municipal green-grey street furniture
  },
  street: {
    halfX: 60,                      // modelled canyon, x −60…+60
    carriageHalf: 4.75,             // 9.5 m carriageway, z −4.75…+4.75
    footNorth: [4.75, 7.3], footSouth: [-7.3, -4.75],
    frontNorthZ: 8.2,               // north building faces
    frontSouthZ: -11,               // apartment face (forecourt in front)
    houseFrontZ: -9.5,
  },
  feeder: {                         // the 11 kV overhead line, north footpath
    poleZ: 6.3, poleHeight: 9.1, buried: 1.5,   // 7.6 m above ground
    poleXs: [-50, 30, 70],          // plain line poles (hero pair sits at −10)
    span: 40,                       // true urban spans, pole-centre to centre
    armY: 7.0, topPinY: 7.35,       // V-arm phase pins; middle phase raised
    phaseZ: [5.76, 6.3, 6.84],      // 1.07 m phase spacing across the arm… (z offsets 0.54)
    sag: 0.5,                       // 1.25% of the 40 m span at mid-span
    ltArmY: 5.55,                   // LT underbuild arm
    ltZ: [5.98, 6.19, 6.41, 6.62],  // four-wire LT across the arm
  },
  hero: {                           // the 315 kVA double-pole structure
    x: -10, z: 6.3, poleGap: 2.75,  // poles at x −11.375 / −8.625
    platformY: 5.8,                 // channel bearers
    tank: { w: 1.5, h: 1.2, d: 0.8, centreY: 6.62 },
    conservator: { r: 0.15, len: 0.7, y: 7.62, z: 5.72 },
  },
  secondUnit: { x: -47.5, z: 6.3 }, // background 315 kVA, just east of the entry pole
  rmu: { x: 26, z: 6.55, w: 1.8, h: 1.5, d: 1.1, plinthTop: 0.3 },
  frtu: { x: 24.55, z: 6.75, w: 0.5, h: 1.1, d: 0.35 },
  transitionPoleX: 30,              // overhead → underground, sealing ends
  plinth: {                         // 500 kVA plinth substation, apartment forecourt
    x: -28, z: -9.2, compound: { x0: -30.4, x1: -25.6, z0: -10.9, z1: -7.5 },
    tank: { w: 1.9, h: 1.4, d: 1.0 },
  },
  feederPillars: [{ x: -25.0, z: -7.9 }, { x: 8, z: 6.95 }],
  apartment: { x0: -34, x1: -10, frontZ: -11, backZ: -22, floors: 6, floorH: 3.1 },
  shops: { x0: -38, x1: -2, frontZ: 8.2, h: 4.2 },
  cornerBlock: { x0: 28, x1: 48, frontZ: 8.2, backZ: 24, floors: 5, floorH: 3.1 },
  curveWall: { x: 34, y: 2.75, z: 8.13, w: 8, h: 3.5 },  // on the corner block's street face
  streetlights: {
    height: 9, armReach: 2.2,
    north: [{ x: -44 }, { x: -14 }, { x: 16, sodium: true }, { x: 46 }],
    south: [{ x: -29 }, { x: 1 }, { x: 31 }],
    poleZ: 5.15,                    // stands on the footpath, arm over the carriageway
  },
  // the city's day — inventory §2, drawn on the curve wall verbatim.
  // Sum = 11,004 MWh ✓ · avg 459 MW · LF 0.75 · max 612 @20 · min 268 @04
  demandMW: [372, 338, 305, 282, 268, 279, 318, 386, 442, 486, 512, 534,
             548, 556, 549, 528, 505, 498, 536, 588, 612, 596, 528, 438],
  solarMW: [0, 0, 0, 0, 0, 0, 8, 35, 75, 115, 142, 158,
            166, 168, 158, 138, 105, 62, 18, 0, 0, 0, 0, 0],   // the duck's belly
  windMW: 38,
  nowHour: 20.25,                   // 20:15 — the NOW needle stands at the peak
};

// ---------------------------------------------------------------------------
// STATION03 — Transmission Corridor (appended by the Station 03 builder;
// the Riverbend–Kestrel 400 kV D/C line, Section 7, towers T-214 → T-218).
// Every number below is from research/station03-components.md's register.
// ---------------------------------------------------------------------------
export const STATION03 = {
  name: 'Transmission Corridor',
  lineName: 'Riverbend–Kestrel 400 kV D/C line',
  section: 'Section 7 · T-214 → T-218',
  voltageKv: 400,
  highestKv: 420,
  loadA: 1450,               // per circuit at the scene's moment (~1,000 MVA)
  spanM: 400,                // ruling span, all four spans in the scene
  bendDeg: 25,               // line deviation at T-215
  towers: {
    suspensionHeightM: 49,
    tensionHeightM: 48,
    suspensionBaseM: 10.4,
    tensionBaseM: 13.5,
    armLevelsM: [30.5, 36.5, 42.0],   // underside, bottom → top
    attachOffsetM: 7.2,               // suspension conductor attach from centreline
    armTipM: 7.7,
    tensionAttachOffsetM: 6.6,
    tensionArmTipM: 7.0,
    midArmOffsetM: 0.18,              // middle arm's subtle z offset
  },
  string: {
    discs: 23,                        // per suspension string — count them
    discDiaMm: 255,
    discPitchMm: 146,
    setLengthM: 4.6,                  // discs + fittings, arm tip → clamp
    tensionDiscDiaMm: 280,
    tensionDiscPitchMm: 170,
    strainLengthM: 5.2,               // horizontal strain set, tip → dead-end
    gradingRingDiaM: 0.8,
  },
  conductor: {
    name: 'ACSR Moose',
    diaMm: 31.77,
    massKgPerKm: 2004,
    utsKn: 160,
    bundle: 4,
    bundleSquareMm: 457,
    renderDiaMm: 100,                 // stated visual cheat ≈ 3× true Ø
    earthRenderDiaMm: 60,
  },
  sag: {
    hotM: 14.3, hotTempC: 75, hotTensionKn: 27.5,   // scene condition
    edsM: 12.3, edsTempC: 32, edsTensionKn: 32.5,
    earthWireM: 12.0,
    jumperM: 3.2,
  },
  clearance: {
    statutoryM: 8.84,                 // IE Rule 77 at 400 kV
    midspanM: 11.6,
    lowestAttachM: 25.9,              // 30.5 arm − 4.6 set
    earthSeparationM: 9.0,
  },
  spacers: { perBundleSpan: 5, atM: [40, 105, 170, 235, 300] },
  row: { widthM: 46, trackWidthM: 3.5, trackOffsetM: 7 },
  haze: { colour: 0xe9dfc8, near: 500, far: 2300 },
  sky: { top: 0x9fc3e8, horizon: 0xf2e3c2 },
  steel: 0x969ea4,                    // weathered galvanised, dull mid-grey
};

// ------------------------------------------------------------------
// STATION05 — Renewables at golden hour: Suryagarh Hybrid Park,
// Block C, 18:30 in May. One plant: 8 × Vestas V150-4.5 MW on the
// west ridge, a 28 MWp fixed-tilt PV field at centre, 10 × Tesla
// Megapack 2XL in the east BESS yard, the pooling substation at the
// NE corner, a 105 m met mast on the south edge. Landscape scale —
// equipment at true size, distances between groups compressed (the
// site board states the real spacing rules).
export const STATION05 = {
  // sun: ~7° elevation, WNW (inventory §2 lighting spec, ~3200 K)
  sun: {
    azimuthDeg: 287, elevationDeg: 7,
    color: 0xffb168, intensity: 2.7,
    hemiSky: 0xbccadb, hemiGround: 0xb08154, hemiIntensity: 0.5,
  },
  sky: { zenith: 0x7490b4, horizonWarm: 0xeaa76d, horizonCool: 0xb4bec9, ground: 0x9a7c58 },
  windFromDeg: 287,                       // evening wind veered to WNW
  ridge: { x0: -90, x1: -170, height: 7 }, // plant floor → turbine ridge
  turbines: {
    hubHeight: 105, rotorD: 150, bladeLen: 73.5, rpm: 8.5,
    // two staggered rows of 4; heroes = front row idx 0,1; parked =
    // back row idx 3 (maintenance). Real spacing 3–5 D / 5–9 D.
    rows: [
      { x: -150, z: [-80, 0, 80, 160] },
      { x: -225, z: [-120, -40, 40, 120] },
    ],
  },
  pv: {
    moduleW: 1.303, moduleL: 2.384,       // 700 Wp class, T/CPIA size
    tiltDeg: 25, tableLen: 37.0, perRow: 28,   // 2P × 28 = 56/table
    frontClearance: 0.6, pitch: 7.0,
    blocks: [-52, 0, 52],                 // block centre x (A, B, C)
    rowsZ: [-28, -21, -14, -7, 0, 7, 14, 21],  // row front edges
  },
  inverters: [{ x: -26, z: -4 }, { x: 26, z: -4 }],  // 2 of 7 modelled
  inverterDims: [6.058, 2.896, 2.438],    // SG3125HV-MV-30, L × H × D
  bess: {
    apron: [128, 46], rowsZ: [40, 52], unitX: [104, 114, 124, 134, 144],
    unit: [8.8, 2.785, 1.65],             // Megapack 2XL, L × H × D
    skid: [156, 46], fence: [96, 31, 162, 61],
  },
  substation: {
    yard: [115, -62, 165, -22],           // x0, z0, x1, z1 (gravel)
    transformers: [[131, -44], [149, -44]],   // 2 × 40 MVA 33/132 kV
    gantry: [156, -56], control: [122, -55], breakersZ: -30,
    yardLight: [146, -26],
  },
  mast: { x: -15, z: 106, height: 105 },  // met mast at hub height
  gate: [30, 124],
  cabin: { pos: [52, 118] },              // O&M cabin by the gate
  siteBoard: [23, 120.5],
  rampBoard: [38.5, 120.5],
  bessSign: [93.5, 46],
  spur: { z: -104, polesX: [-195, -140, -85, -30, 25, 80] },  // 33 kV OH spur
};

// ---------------------------------------------------------------------
// STATION02 — Substation Yard (appended by the Station 02 build; the
// hero hall). 132/33 kV Meridian Road, freeze-frame 06:04 IST.
export const STATION02 = {
  yard: { widthEW: 72, depthNS: 46, fenceH: 2.4 },
  bayPitch: 12.2,
  bays: [ // west -> east, §12 state matrix
    { id: 'FDR-1', x: -24.4, kind: 'line', load: '96 A' },
    { id: 'T-1', x: -12.2, kind: 'xfmr', load: '31.2 MVA', tap: 6 },
    { id: 'BUS-COUPLER', x: 0, kind: 'coupler' },
    { id: 'T-2', x: 12.2, kind: 'xfmr', load: '43.6 MVA', tap: 7 },
    { id: 'FDR-2', x: 24.4, kind: 'line', load: '88 A' },
  ],
  bus: { height: 9.0, phaseSpacing: 3.0, sagRatio: 0.02, conductor: "ACSR 'Moose' Ø31.5" },
  clearances: { phaseEarth: 1.3, phasePhase: 3.0, section: 3.5, ground: 4.6 }, // IEC 61936-1, Um 145
  transformer: {
    ratingONAN: 40, ratingONAF: 50, hvKV: 132, lvKV: 33, vectorGroup: 'YNd11',
    impedancePct: 10.0, oilLitres: 38500, massKg: 112000,
    tankSage: 0x5a6b5e, // §18 — the original Blender unit's paint family
    hvCurrentA: 219, lvCurrentA: 875,
  },
  state: { // 06:04, matching Station 01's 05:56 event
    t1: { mva: 31.2, tap: 6, fans: false, otiC: 54 },
    t2: { mva: 43.6, tap: 7, fans: true, otiC: 61, wtiMaxC: 71 },
    busKV: 131.4, fdr2Reclosed: '05:56',
  },
};
