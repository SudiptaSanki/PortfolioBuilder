// transformer.js — the hero machine: 40/50 MVA ONAN/ONAF, 132/33 kV,
// YNd11. Anatomy descends from the original project's Blender build
// (skid/plinth, bevelled tank, lid + gasket + bolts, radiator cooling,
// bushings built flange -> collar -> shed barrel -> cap -> copper lug,
// nameplate, drain valve, earthing boss) completed with the fittings a
// 50 MVA unit actually carries (inventory §4). Local frame: origin at
// plinth base centre, north = -z (HV side), tank long axis along x.
// cfg: { id, tap, fansRunning, oti (degC needle), wtiMax, breatherPink,
//        birdSpikes } — the §12 state matrix, applied per machine.

import * as THREE from 'three';
import { MAT, SAGE, box, cyl, grp, plate, signPlate, fitFont, shedProfile, lathe, dialPlate, tube, V3 } from './helpers.js';

// ---- bushing: flange -> collar -> tapered shed barrel -> cap -> lug --
function bushing({ h = 2.3, rBase = 0.14, rTop = 0.095, rShed = 0.165, mat = MAT.porcelain, lugW = 0.1, spikes = false }) {
  const g = grp();
  const flange = cyl(0.17, 0.17, 0.06, MAT.galv, 0, 0.03, 0, 18); g.add(flange);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(cyl(0.016, 0.016, 0.05, MAT.darkSteel, Math.cos(a) * 0.145, 0.07, Math.sin(a) * 0.145, 6));
  }
  g.add(cyl(rBase * 1.05, rBase * 1.12, 0.14, mat, 0, 0.13, 0, 16)); // collar
  g.add(lathe(shedProfile(rBase, rTop, h, rShed, 0.1), mat, 0, 0.18, 0));
  const capY = 0.18 + h;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(rTop * 1.25, 14, 10), MAT.aluminium);
  cap.scale.y = 0.62; cap.position.y = capY + 0.02; cap.castShadow = true; g.add(cap);
  g.add(cyl(0.02, 0.02, 0.22, MAT.copper, 0, capY + 0.14, 0, 8)); // stem
  const lug = box(lugW, 0.2, 0.014, MAT.copper, 0, capY + 0.3, 0); g.add(lug); // flat palm
  g.add(cyl(0.012, 0.012, 0.03, MAT.darkSteel, 0, capY + 0.36, 0.02, 6));
  g.add(cyl(0.012, 0.012, 0.03, MAT.darkSteel, 0, capY + 0.24, 0.02, 6));
  if (spikes) { // bird-guard retrofit, T-2 only (§4.3.4)
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.09, 5), MAT.steel);
      const a = (i / 5) * Math.PI * 2;
      s.position.set(Math.cos(a) * rTop * 0.8, capY + 0.09, Math.sin(a) * rTop * 0.8);
      s.rotation.z = Math.cos(a) * 0.5; s.rotation.x = -Math.sin(a) * 0.5;
      g.add(s);
    }
  }
  g.userData.topY = capY + 0.4; // lug top, for conductor landings
  return g;
}

// ---- nameplate: exact §4.5 content, measured text on brass -----------
function nameplate(id) {
  return plate(0.5, 0.35, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#b3924e'); grad.addColorStop(0.5, '#a8894a'); grad.addColorStop(1, '#93763a');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a3a18'; g.lineWidth = 4; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#2e2410'; g.textAlign = 'center';
    const lines = [
      ['MERIDIAN POWER SYSTEMS LTD.', 40, 700],
      ['THREE PHASE POWER TRANSFORMER', 34, 700],
      [`RATING   40000 kVA ONAN / 50000 kVA ONAF`, 30, 400],
      [`VOLTAGE  132000 / 33000 V      VECTOR GROUP  YNd11`, 30, 400],
      [`CURRENT  175 / 219 A HV · 700 / 875 A LV (ONAN/ONAF)`, 28, 400],
      [`IMPEDANCE  10.0 % AT 50 MVA, 75 °C`, 30, 400],
      [`TAPS  +5 % TO −15 %, 17 STEPS OF 1.25 %, ON HV (OLTC)`, 28, 400],
      [`INSULATION  HV 650 kVp LI / 275 kV AC · LV 170 kVp LI / 70 kV AC`, 26, 400],
      [`LOSSES  NO-LOAD 30 kW · LOAD 235 kW AT 50 MVA`, 28, 400],
      [`OIL  38500 LITRES · TOTAL MASS 112000 kg`, 30, 400],
      [`STANDARD  IEC 60076 / IS 2026 · YEAR 2016 · S.No. MPS-132-4471`, 26, 400],
    ];
    lines.forEach(([txt, px, wt], i) => {
      fitFont(g, txt, w - 56, px, wt, 'Courier New, monospace');
      g.fillText(txt, w / 2, 58 + i * 56);
    });
  }, [1024, 716]);
}

function handwheel(r, mat) {
  const g = grp();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 8, 20), mat);
  rim.castShadow = true; g.add(rim);
  for (let i = 0; i < 3; i++) {
    const s = box(r * 1.8, 0.02, 0.02, mat);
    s.rotation.z = (i / 3) * Math.PI; g.add(s);
  }
  g.add(cyl(0.025, 0.025, 0.07, mat, 0, 0, 0, 8)).children;
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  return g;
}

export function createTransformer(cfg) {
  const T = grp();
  const fans = [];

  // ---- bunded oil pit, rail beams, rails, wheels (§4.1) ---------------
  // The foundation reads as a stone-filled bund, not a slab: perimeter
  // kerbs with coping hold the washed-stone fill (§4.1.2), and the tank
  // rides on rails carried by two concrete beams inside the pit. The
  // rails run off the pit south across a concrete track bed — the
  // delivery path (§4.1.3).
  for (const kz of [-3.675, 3.675]) { // kerb walls, long sides
    T.add(box(10.6, 0.55, 0.25, MAT.concrete, 0, 0.275, kz));
    T.add(box(10.85, 0.07, 0.4, MAT.concreteDark, 0, 0.585, kz)); // coping
  }
  for (const kx of [-5.175, 5.175]) { // kerb walls, short sides
    T.add(box(0.25, 0.55, 7.1, MAT.concrete, kx, 0.275, 0));
    T.add(box(0.4, 0.07, 7.35, MAT.concreteDark, kx, 0.585, 0));
  }
  T.add(box(10.1, 0.08, 7.1, MAT.concreteDark, 0, 0.04, 0)); // pit floor
  const pit = plate(10.1, 7.1, (g, w, h) => { // washed stone: bigger, cleaner speckle
    g.fillStyle = '#8f8c85'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const s = 3 + Math.random() * 7, v = 118 + Math.random() * 60;
      g.fillStyle = `rgb(${v - 8},${v - 4},${v - 14})`;
      g.fillRect(Math.random() * w, Math.random() * h, s, s * 0.8);
    }
  }, [768, 512]);
  pit.rotation.x = -Math.PI / 2; pit.position.y = 0.3; T.add(pit);
  const stain = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x3a362c, transparent: true, opacity: 0.35, roughness: 1 }));
  stain.rotation.x = -Math.PI / 2; stain.position.y = 0.312; T.add(stain);
  for (const sx of [-1.1, 1.1]) // rail beams inside the pit, tops at 0.85
    T.add(box(0.55, 0.55, 6.4, MAT.concrete, sx, 0.575, 0));
  T.add(box(2.9, 0.85, 3.3, MAT.concrete, 0, 0.425, 4.55)); // track bed south to the road
  for (const sx of [-1.1, 1.1]) { // rails run off the pit south, the delivery path
    T.add(box(0.14, 0.1, 9.4, MAT.darkSteel, sx, 0.9, 1.4));
    for (const wz of [-1.5, -0.5, 0.5, 1.5]) {
      const wheel = cyl(0.17, 0.17, 0.07, MAT.darkSteel, sx, 1.0, wz, 16);
      wheel.rotation.z = Math.PI / 2; T.add(wheel);
    }
  }
  T.add(box(4.9, 0.16, 1.9, MAT.darkSteel, 0, 0.98, 0)); // skid

  // ---- tank, lid, gasket, bolts (§4.2) -------------------------------
  T.add(box(5.2, 3.6, 2.2, MAT.tank, 0, 2.86, 0));
  T.add(box(5.24, 0.3, 2.24, MAT.tankDark, 0, 1.21, 0)); // splash zone
  for (const fz of [-1.13, 1.13]) // stiffener ribs
    for (let i = 0; i < 6; i++) T.add(box(0.12, 3.3, 0.05, MAT.tank, -2.25 + i * 0.9, 2.86, fz));
  T.add(box(5.54, 0.035, 2.54, MAT.rubber, 0, 4.665, 0)); // gasket line
  T.add(box(5.5, 0.12, 2.5, MAT.tank, 0, 4.72, 0)); // lid
  { // lid bolts at ~180mm pitch (instanced)
    const boltGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.055, 6);
    const pts = [];
    for (let x = -2.66; x <= 2.66; x += 0.38) { pts.push([x, -1.19]); pts.push([x, 1.19]); }
    for (let z = -0.95; z <= 0.95; z += 0.38) { pts.push([-2.66, z]); pts.push([2.66, z]); }
    const inst = new THREE.InstancedMesh(boltGeo, MAT.galv, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(([x, z], i) => { m4.setPosition(x, 4.79, z); inst.setMatrixAt(i, m4); });
    inst.castShadow = true; T.add(inst);
  }
  for (const cx of [-1.5, 1.5]) { // inspection covers on the lid
    T.add(cyl(0.28, 0.28, 0.05, MAT.tank, cx, 4.8, 0.75, 18));
    T.add(box(0.1, 0.05, 0.03, MAT.darkSteel, cx, 4.85, 0.75));
  }
  for (const lx of [-2.4, 2.4]) for (const lz of [-1.0, 1.0]) // lifting lugs + jacking pads
    T.add(box(0.05, 0.16, 0.12, MAT.darkSteel, lx, 4.86, lz));
  for (const jx of [-2.45, 2.45]) for (const jz of [-1.0, 1.0])
    T.add(box(0.3, 0.1, 0.3, MAT.darkSteel, jx, 1.02, jz));

  // ---- radiator banks + fans (§4.2.4 / 4.2.5) -------------------------
  // Cowl paint matches the bank (sage tank enamel), inside faces shown.
  const cowlMat = new THREE.MeshStandardMaterial({ color: SAGE, roughness: 0.5, metalness: 0.18, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const hz = side * 1.32;
    for (const hy of [1.62, 4.12]) {
      const hdr = cyl(0.05, 0.05, 4.5, MAT.tank, 0, hy, hz, 10);
      hdr.rotation.z = Math.PI / 2; T.add(hdr);
      const w = handwheel(0.1, MAT.redPaint); w.position.set(2.32, hy, hz); w.rotation.y = Math.PI / 2; T.add(w);
      const w2 = handwheel(0.1, MAT.redPaint); w2.position.set(-2.32, hy, hz); w2.rotation.y = Math.PI / 2; T.add(w2);
    }
    for (let i = 0; i < 10; i++) {
      const px = -1.9 + i * 0.422;
      T.add(box(0.38, 2.6, 0.18, MAT.tank, px, 2.87, side * 1.46));
      T.add(box(0.1, 2.5, 0.035, MAT.tankDark, px, 2.87, side * 1.565)); // pressed ridge
    }
    for (let i = 0; i < 4; i++) { // cooling fans mounted ON the bank face (§4.2.5)
      const fx = -1.65 + i * 1.1;
      const fan = grp(fx, 2.87, side * 1.58); // bank mid-height, on the pressed-ridge face
      fan.rotation.x = side * Math.PI / 2; // local +Y becomes the outward normal
      const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.34, 18, 1, true), cowlMat);
      cowl.position.y = 0.17; cowl.castShadow = true; fan.add(cowl);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.36, 18), MAT.black);
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.06; fan.add(disc); // dark back disc inside the ring
      const blades = grp(); blades.position.y = 0.17;
      for (let b = 0; b < 6; b++) {
        const bl = box(0.09, 0.015, 0.3, MAT.darkSteel, 0, 0, 0.17);
        const holder = grp(); holder.rotation.y = (b / 6) * Math.PI * 2;
        bl.rotation.x = 0.6; holder.add(bl); blades.add(holder);
      }
      fan.add(blades);
      fan.add(cyl(0.03, 0.03, 0.14, MAT.darkSteel, 0, 0.11, 0, 8)); // shaft
      fan.add(cyl(0.07, 0.07, 0.08, MAT.darkSteel, 0, 0.17, 0, 10)); // hub
      const motor = cyl(0.13, 0.13, 0.24, MAT.darkSteel, 0, -0.06, 0, 12); fan.add(motor);
      const guard = new THREE.Mesh(new THREE.CircleGeometry(0.37, 18),
        new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.6, metalness: 0.5, wireframe: true }));
      guard.rotation.x = -Math.PI / 2; guard.position.y = 0.345; fan.add(guard);
      if (cfg.fansRunning) {
        const blur = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20),
          new THREE.MeshBasicMaterial({ color: 0x22252a, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
        blur.rotation.x = -Math.PI / 2; blur.position.y = 0.21; fan.add(blur);
      } else if (i === 2) {
        blades.rotation.y = 0.7; // one fan parked at a different angle (§4.2.5)
      }
      for (const mx of [-0.3, 0.3]) // mounting straps back to the bank face
        fan.add(box(0.06, 0.18, 0.06, MAT.galv, mx, 0.02, 0));
      T.add(fan);
      fans.push({ blades, running: cfg.fansRunning });
    }
  }

  // ---- bushings (§4.3) -------------------------------------------------
  const hvLugs = [];
  [-1.6, 0, 1.6].forEach((bx) => {
    const b = bushing({ h: 2.3, spikes: cfg.birdSpikes });
    b.position.set(bx, 4.78, -0.55); T.add(b);
    hvLugs.push([bx, 4.78 + b.userData.topY, -0.55]);
  });
  const neutral = bushing({ h: 0.85, rBase: 0.09, rTop: 0.06, rShed: 0.105, lugW: 0.07 });
  neutral.position.set(2.15, 4.78, -0.55); T.add(neutral);
  { // neutral earth strap + CT doughnut: "solidly earthed" made visible
    T.add(box(0.07, 3.3, 0.012, MAT.copperOld, 2.62, 3.1, -0.55));
    T.add(box(0.07, 1.3, 0.012, MAT.copperOld, 2.45, 1.05, -0.55));
    const ct = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.032, 8, 18), MAT.panelBlue);
    ct.position.set(2.62, 3.6, -0.55); ct.castShadow = true; T.add(ct);
  }
  const lvLugs = [];
  [-1.3, 0, 1.3].forEach((bx) => {
    const b = bushing({ h: 0.8, rBase: 0.13, rTop: 0.1, rShed: 0.15, mat: MAT.porcelainGrey, lugW: 0.16 });
    b.position.set(bx, 4.78, 0.55); T.add(b);
    lvLugs.push([bx, 4.78 + b.userData.topY, 0.55]);
  });

  // ---- conservator cluster (§4.4) --------------------------------------
  const cons = grp(-0.3, 6.13, 0.95);
  const consBody = cyl(0.525, 0.525, 2.9, MAT.tank, 0, 0, 0, 20);
  consBody.rotation.z = Math.PI / 2; cons.add(consBody);
  for (const ex of [-1.45, 1.45]) {
    const capS = new THREE.Mesh(new THREE.SphereGeometry(0.525, 16, 10), MAT.tank);
    capS.scale.x = 0.35; capS.position.x = ex; capS.castShadow = true; cons.add(capS);
  }
  T.add(cons);
  for (const sx of [-1.4, 0.8]) { // saddles from the lid
    T.add(box(0.08, 1.0, 0.08, MAT.galv, sx, 5.28, 0.72));
    T.add(box(0.08, 1.0, 0.08, MAT.galv, sx, 5.28, 1.18));
    T.add(box(0.08, 0.08, 0.6, MAT.galv, sx, 5.72, 0.95));
  }
  { // Buchholz relay in the inclined Ø80 pipe, lid -> conservator (§4.4.2)
    const a = V3(1.5, 4.82, 0.72), b = V3(0.92, 5.98, 0.95);
    T.add(tube([a, V3(1.28, 5.3, 0.82), b], 0.04, MAT.tank, 8));
    const relay = grp(1.22, 5.42, 0.85); relay.rotation.z = -0.62;
    relay.add(box(0.3, 0.22, 0.22, MAT.tank));
    const sight = cyl(0.045, 0.045, 0.02, MAT.glassPale, 0, 0, 0.12, 14);
    sight.rotation.x = Math.PI / 2; relay.add(sight);
    relay.add(box(0.1, 0.08, 0.1, MAT.darkSteel, 0.05, -0.16, 0));
    T.add(relay);
    const arrow = signPlate(0.34, 0.09, ['OIL FLOW →'], { bg: '#e9e7e0', px: [512, 128] });
    arrow.position.set(1.62, 5.05, 0.86); arrow.rotation.y = 0.5; T.add(arrow);
  }
  { // MOG dial on the conservator's east end — needle at 3/4 (§4.4.3)
    const mog = dialPlate(0.15, { label: 'OIL', frac: 0.75, unit: 'MIN · MAX' });
    mog.position.set(1.34, 6.13, 0.95); mog.rotation.y = Math.PI / 2; T.add(mog);
    T.add(cyl(0.085, 0.085, 0.03, MAT.darkSteel, 1.32, 6.13, 0.95, 16)).children;
    T.children[T.children.length - 1].rotation.z = Math.PI / 2;
  }
  { // silica-gel breather (§4.4.4): blue dry top 2/3, T-1's lower third spent pink
    const br = grp(1.35, 0, 1.62);
    br.add(tube([V3(0.0, 5.78, -0.55), V3(0.1, 4.4, -0.2), V3(0, 2.85, 0)], 0.022, MAT.steel, 8));
    const bowl = cyl(0.09, 0.09, 0.3, MAT.glassPale, 0, 2.62, 0, 14); br.add(bowl);
    br.add(cyl(0.082, 0.082, 0.19, MAT.blueCrystal, 0, 2.68, 0, 12));
    br.add(cyl(0.082, 0.082, 0.1, cfg.breatherPink ? MAT.pinkCrystal : MAT.blueCrystal, 0, 2.52, 0, 12));
    br.add(cyl(0.07, 0.07, 0.06, MAT.oilDark, 0, 2.42, 0, 12)); // oil cup
    T.add(br);
  }
  { // pressure relief device, flag DOWN (§4.4.5)
    T.add(cyl(0.075, 0.075, 0.5, MAT.galv, -2.2, 5.02, -0.3, 12));
    T.add(cyl(0.11, 0.11, 0.04, MAT.darkSteel, -2.2, 5.29, -0.3, 14));
    T.add(box(0.03, 0.2, 0.13, MAT.yellowPaint, -2.2, 5.12, -0.16));
  }

  // ---- dials, OLTC, marshalling (§4.2.6/4.2.7, §4.4.6) -----------------
  const oti = dialPlate(0.11, { label: 'OIL °C', frac: cfg.oti / 120 });
  oti.position.set(-0.55, 1.78, 1.115); T.add(oti);
  const wti = dialPlate(0.11, { label: 'WIND °C', frac: (cfg.oti + 8) / 140, redFrac: cfg.wtiMax / 140 });
  wti.position.set(-0.3, 1.78, 1.115); T.add(wti);
  T.add(tube([V3(-0.55, 1.86, 1.08), V3(-0.55, 3.4, 1.05), V3(-0.55, 4.7, 0.6)], 0.008, MAT.darkSteel, 6));
  T.add(cyl(0.28, 0.28, 0.34, MAT.tank, 2.25, 4.95, 0.35, 16)); // OLTC head
  const oltc = grp(2.82, 0, 0.35);
  oltc.add(box(0.4, 1.1, 0.6, MAT.cabinet, 0, 1.75, 0));
  const tapPlate = signPlate(0.3, 0.16, [`TAP  ${cfg.tap}`], { bg: '#22252a', ink: '#f2e9c9', px: [384, 192] });
  tapPlate.position.set(0, 1.95, 0.31); oltc.add(tapPlate);
  const tapNote = signPlate(0.34, 0.09, ['TAP RAISES VOLTAGE →'], { bg: '#e9e7e0', px: [512, 128] });
  tapNote.position.set(0, 1.62, 0.31); oltc.add(tapNote);
  T.add(oltc);
  const marsh = grp(3.6, 0, 2.3);
  marsh.add(box(1.1, 0.3, 0.7, MAT.concrete, 0, 0.15, 0));
  marsh.add(box(1.0, 1.4, 0.5, MAT.cabinet, 0, 1.0, 0));
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), MAT.ledGreen);
  lamp.position.set(-0.25, 1.45, 0.256); marsh.add(lamp);
  const lamp2 = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), MAT.ledOff);
  lamp2.position.set(0.25, 1.45, 0.256); marsh.add(lamp2);
  const mLabel = signPlate(0.6, 0.12, [`MARSHALLING · ${cfg.id}`], { px: [640, 128] });
  mLabel.position.set(0, 1.15, 0.256); marsh.add(mLabel);
  T.add(marsh);
  T.add(box(0.9, 0.1, 0.14, MAT.galv, 3.1, 0.32, 1.7)); // ground trunking to tank
  T.children[T.children.length - 1].rotation.y = 0.6;

  // ---- plates, valves, earthing (§4.5, §4.4.7, §4.2.8) ------------------
  const np = nameplate(cfg.id); np.position.set(0.35, 2.35, 1.115); T.add(np);
  const caution = signPlate(0.44, 0.1, ['CAUTION · MINERAL OIL · NO NAKED FLAME'], { bg: '#f0ead2', ink: '#7a1d18', px: [768, 128] });
  caution.position.set(0.35, 2.05, 1.115); T.add(caution);
  const stencil = plate(1.6, 0.3, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(238,236,228,0.92)'; g.textAlign = 'center';
    fitFont(g, `${cfg.id} · 50 MVA · 132/33 kV`, w - 30, 92, 700);
    g.fillText(`${cfg.id} · 50 MVA · 132/33 kV`, w / 2, h / 2 + 32);
  }, [1024, 192], { transparent: true });
  stencil.position.set(2.615, 2.9, 0); stencil.rotation.y = Math.PI / 2; T.add(stencil);
  const drain = grp(-1.9, 1.22, 1.18);
  drain.add(cyl(0.03, 0.03, 0.18, MAT.steel, 0, 0, 0, 8)).children;
  drain.children[0].rotation.x = Math.PI / 2;
  const dw = handwheel(0.09, MAT.redPaint); dw.position.set(0, 0.05, 0.12); drain.add(dw);
  T.add(drain);
  T.add(box(0.34, 0.04, 0.26, MAT.darkSteel, -1.9, 0.34, 1.3)); // drip tray, on the pit stone
  for (const ex of [-2.3, 2.3]) { // earth bosses + flats to the grid
    T.add(box(0.09, 0.14, 0.05, MAT.copper, ex, 1.1, 1.05));
    T.add(box(0.07, 1.06, 0.012, MAT.copperOld, ex, 0.53, 1.32));
    T.add(box(0.16, 0.1, 0.06, MAT.darkSteel, ex, 1.0, 1.34)); // test link
  }

  T.userData.fans = fans;
  T.userData.hvLugs = hvLugs;
  T.userData.lvLugs = lvLugs;
  return T;
}
