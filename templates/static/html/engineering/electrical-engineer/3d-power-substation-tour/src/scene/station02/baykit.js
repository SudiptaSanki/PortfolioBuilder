// baykit.js — the repeated 132 kV bay kit (inventory §5) and the
// lattice structures (§6.4, Card 02-I). Build once, instance with
// intent: variation comes only from §12 state, never geometry drift.
// Local frames: equipment groups sit on the ground, power flows along
// +z (bus at -z, line/transformer at +z), phases across x.

import * as THREE from 'three';
import { MAT, box, cyl, grp, plate, signPlate, fitFont, shedProfile, lathe, dialPlate } from './helpers.js';

// ---- disc insulator string (9-10 bells, §6.3) hanging from origin ----
const bellGeo = (() => {
  const pts = [
    new THREE.Vector2(0.02, 0), new THREE.Vector2(0.035, -0.03),
    new THREE.Vector2(0.128, -0.055), new THREE.Vector2(0.125, -0.1),
    new THREE.Vector2(0.07, -0.115), new THREE.Vector2(0.032, -0.1),
    new THREE.Vector2(0.03, -0.146),
  ];
  return new THREE.LatheGeometry(pts, 12);
})();
export function discString(n = 9) {
  const g = grp();
  for (let i = 0; i < n; i++) {
    const bell = new THREE.Mesh(bellGeo, MAT.porcelainGrey);
    bell.position.y = -i * 0.146; bell.castShadow = true; g.add(bell);
  }
  g.add(cyl(0.012, 0.012, 0.22, MAT.galv, 0, 0.08, 0, 6)); // pin link up
  g.userData.drop = n * 0.146;
  return g;
}
// shedded post insulator standing on origin, height h
export function postInsulator(h, r = 0.09, mat = MAT.porcelain) {
  const g = grp();
  g.add(cyl(r * 1.5, r * 1.6, 0.08, MAT.galv, 0, 0.04, 0, 12));
  g.add(lathe(shedProfile(r, r * 0.92, h - 0.16, r * 1.55, 0.11), mat, 0, 0.08, 0));
  g.add(cyl(r * 1.3, r * 1.3, 0.06, MAT.galv, 0, h - 0.03, 0, 12));
  return g;
}
function frame42(w) { // galvanised equipment frame, top at 2.55
  const g = grp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    g.add(box(0.09, 2.55, 0.09, MAT.galv, sx * w / 2, 1.275, sz * 0.3));
  g.add(box(w + 0.3, 0.09, 0.8, MAT.galv, 0, 2.55, 0));
  g.add(box(w + 0.3, 0.06, 0.06, MAT.galv, 0, 1.3, 0.32));
  g.add(box(w + 0.3, 0.06, 0.06, MAT.galv, 0, 1.3, -0.32));
  return g;
}
function earthFlat(h = 2.55) { // copper flat down one leg (§8.2 evidence)
  return box(0.06, h, 0.01, MAT.copperOld, 0, h / 2, 0);
}

// ---- SF6 live-tank breaker (§5.1, Card 02-E) --------------------------
export function makeBreaker({ counter = 4812 } = {}) {
  const g = grp();
  g.add(frame42(3.4));
  const tops = [];
  [-1.7, 0, 1.7].forEach((px) => {
    g.add(lathe(shedProfile(0.12, 0.11, 1.8, 0.185, 0.1), MAT.porcelain, px, 2.6, 0));
    const chamber = cyl(0.16, 0.16, 1.9, MAT.sf6, px, 4.55, 0, 14);
    chamber.rotation.x = Math.PI / 2; g.add(chamber);
    for (const ez of [-0.95, 0.95]) {
      const capS = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), MAT.sf6);
      capS.scale.z = 0.4; capS.position.set(px, 4.55, ez); capS.castShadow = true; g.add(capS);
    }
    for (const pz of [-0.55, 0.55]) {
      g.add(box(0.22, 0.03, 0.3, MAT.aluminium, px, 4.78, pz)); // terminal pads
      tops.push([px, 4.8, pz]);
    }
    const flat = earthFlat(); flat.position.set(px - 1.62, 0, 0.36); if (px === -1.7) g.add(flat);
  });
  const rod = cyl(0.02, 0.02, 3.6, MAT.steel, 0, 2.32, 0.42, 8);
  rod.rotation.z = Math.PI / 2; g.add(rod); // gang drive rod
  const drive = grp(0, 0, 0.62);
  drive.add(box(0.7, 1.1, 0.35, MAT.cabinet, 0, 0.75, 0));
  const gauge = dialPlate(0.13, { label: 'SF₆', frac: 0.62 });
  gauge.position.set(-0.17, 1.05, 0.18); drive.add(gauge);
  const cnt = plate(0.2, 0.09, (gc, w, h) => {
    gc.fillStyle = '#22252a'; gc.fillRect(0, 0, w, h); gc.fillStyle = '#f2e9c9';
    gc.textAlign = 'center'; fitFont(gc, `OPS ${counter}`, w - 16, 44, 700, 'Courier New, monospace');
    gc.fillText(`OPS ${counter}`, w / 2, h / 2 + 15);
  }, [320, 144]);
  cnt.position.set(0.16, 1.06, 0.18); drive.add(cnt);
  const sema = signPlate(0.2, 0.09, ['CLOSED'], { bg: '#a3241c', ink: '#f5efe2', px: [320, 144] });
  sema.position.set(0.16, 0.88, 0.18); drive.add(sema);
  const sf6 = signPlate(0.16, 0.08, ['SF₆'], { px: [256, 128] });
  sf6.position.set(-0.17, 0.86, 0.18); drive.add(sf6);
  g.add(drive);
  g.userData.tops = tops;
  return g;
}

// ---- vertical-break disconnector (§5.2, Card 02-F) --------------------
// mode: 'closed' | 'open' | 'earthed' (earth blade closed + red tag)
export function makeDisconnector({ mode = 'closed' } = {}) {
  const g = grp();
  g.add(frame42(5.6));
  const tops = [];
  [-2.8, 0, 2.8].forEach((px) => {
    for (const pz of [-0.95, 0.95]) {
      const post = postInsulator(0.62, 0.09); post.position.set(px, 2.6, pz); g.add(post);
    }
    g.add(box(0.16, 0.05, 0.22, MAT.copper, px, 3.3, -0.95)); // jaw contact cluster
    for (let f = 0; f < 4; f++) g.add(box(0.02, 0.09, 0.1, MAT.copper, px - 0.05 + f * 0.033, 3.3, -0.95));
    const hinge = grp(px, 3.26, 0.95);
    const blade = cyl(0.03, 0.03, 2.0, MAT.aluminium, 0, 0, -1.0, 10);
    blade.rotation.x = Math.PI / 2; hinge.add(blade);
    if (mode === 'open') hinge.rotation.x = -1.31; // blade raised ~75°
    g.add(hinge);
    tops.push([px, 3.32, -0.95], [px, 3.32, 0.95]);
  });
  const driveRod = cyl(0.018, 0.018, 5.8, MAT.steel, 0, 2.3, 0.42, 8);
  driveRod.rotation.z = Math.PI / 2; g.add(driveRod);
  const drive = grp(0, 0, 0.62);
  drive.add(box(0.55, 0.95, 0.32, MAT.cabinet, 0, 0.68, 0));
  drive.add(cyl(0.035, 0.035, 0.05, MAT.darkSteel, 0, 0.85, 0.18, 10)).children;
  drive.children[drive.children.length - 1].rotation.x = Math.PI / 2; // crank hole boss
  g.add(drive);
  if (mode === 'earthed') {
    const es = grp(0, 0, 1.35);
    const eb = cyl(0.022, 0.022, 1.6, MAT.copperOld, 0, 1.6, 0, 8);
    eb.rotation.x = 0.5; es.add(eb);
    es.add(box(0.3, 0.5, 0.02, MAT.redPaint, 0.25, 1.05, 0.1));
    const tag = signPlate(0.28, 0.13, ['EARTHED', 'PTW-118'], { bg: '#a3241c', ink: '#f5efe2', px: [384, 192] });
    tag.position.set(0.25, 1.05, 0.115); es.add(tag);
    g.add(es);
  }
  g.userData.tops = tops;
  return g;
}

// ---- CT (§5.3) ---------------------------------------------------------
export function makeCT({ ratio = '800–400/1 A' } = {}) {
  const g = grp();
  g.add(box(0.7, 0.15, 0.7, MAT.concrete, 0, 0.075, 0));
  g.add(frame42(0.5));
  const tops = [];
  [-2.8, 0, 2.8].forEach((px) => {
    g.add(lathe(shedProfile(0.1, 0.09, 1.15, 0.15, 0.1), MAT.porcelain, px, 2.6, 0));
    g.add(cyl(0.225, 0.225, 0.42, MAT.aluminium, px, 3.95, 0, 16)); // head tank
    const bar = cyl(0.026, 0.026, 1.1, MAT.copper, px, 4.2, 0, 8);
    bar.rotation.x = Math.PI / 2; g.add(bar);
    g.add(cyl(0.05, 0.07, 0.12, MAT.galv, px, 4.24, 0, 10)); // expansion bellows
    tops.push([px, 4.2, -0.5], [px, 4.2, 0.5]);
  });
  const jb = grp(0, 0, 0.5);
  jb.add(box(0.5, 0.7, 0.25, MAT.cabinet, 0, 0.8, 0));
  const rp = signPlate(0.44, 0.2, [ratio, '5P20 / CL 0.5 · 31.5 kA/3 s'], { px: [640, 288] });
  rp.position.set(0, 0.85, 0.13); jb.add(rp);
  g.add(jb);
  g.userData.tops = tops;
  return g;
}

// ---- CVT (§5.4) ---------------------------------------------------------
export function makeCVT() {
  const g = grp();
  g.add(box(0.7, 0.15, 0.7, MAT.concrete, 0, 0.075, 0));
  const tops = [];
  [-2.8, 0, 2.8].forEach((px) => {
    g.add(box(0.9, 1.15, 0.6, MAT.sf6, px, 0.72, 0)); // EMU tank
    g.add(lathe(shedProfile(0.1, 0.095, 1.5, 0.15, 0.1), MAT.porcelain, px, 1.32, 0));
    g.add(lathe(shedProfile(0.095, 0.09, 1.45, 0.145, 0.1), MAT.porcelain, px, 2.85, 0));
    g.add(cyl(0.05, 0.05, 0.14, MAT.aluminium, px, 4.36, 0, 10));
    tops.push([px, 4.43, 0]);
  });
  const rp = signPlate(0.5, 0.14, ['132000/√3 : 110/√3 V', 'VT MCB · PLCC COUPLING'], { px: [640, 176] });
  rp.position.set(0, 0.72, 0.31); g.add(rp);
  g.userData.tops = tops;
  return g;
}

// ---- surge arrester (§5.5, Card 02-G) ----------------------------------
export function makeArrester({ count = 16, small = false } = {}) {
  const g = grp();
  const stoolH = small ? 1.2 : 2.5, stackH = small ? 1.1 : 2.3;
  const tops = [];
  [-2.8, 0, 2.8].forEach((px) => {
    for (const sx of [-0.16, 0.16]) for (const sz of [-0.16, 0.16])
      g.add(box(0.05, stoolH, 0.05, MAT.galv, px + sx, stoolH / 2, sz));
    g.add(box(0.45, 0.05, 0.45, MAT.galv, px, stoolH, 0));
    // alternating long/short sheds: two stacked lathe sections
    g.add(lathe(shedProfile(0.07, 0.068, stackH / 2, 0.105, 0.09), MAT.polymer, px, stoolH + 0.03, 0));
    g.add(lathe(shedProfile(0.068, 0.065, stackH / 2, 0.1, 0.09), MAT.polymer, px, stoolH + stackH / 2, 0));
    const topY = stoolH + stackH + 0.06;
    if (!small) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.02, 8, 24), MAT.aluminium);
      ring.rotation.x = Math.PI / 2; ring.position.set(px, topY + 0.1, 0); ring.castShadow = true; g.add(ring);
    }
    g.add(cyl(0.014, 0.014, 0.16, MAT.steel, px, topY + 0.06, 0, 8));
    const lead = cyl(0.008, 0.008, stoolH - 1.2, MAT.copperOld, px + 0.2, (stoolH + 1.5) / 2 + 0.15, 0.1, 6);
    g.add(lead); // insulated earth lead to the counter box
    tops.push([px, topY + 0.14, 0]);
  });
  if (!small) {
    const cb = grp(0, 0, 0.3);
    cb.add(box(0.34, 0.44, 0.14, MAT.cabinet, 0, 1.5, 0));
    const cnt = plate(0.2, 0.1, (gc, w, h) => {
      gc.fillStyle = '#22252a'; gc.fillRect(0, 0, w, h); gc.fillStyle = '#f2e9c9';
      gc.textAlign = 'center'; fitFont(gc, `COUNT ${count}`, w - 14, 46, 700, 'Courier New, monospace');
      gc.fillText(`COUNT ${count}`, w / 2, h / 2 + 16);
    }, [320, 160]);
    cnt.position.set(0, 1.56, 0.075); cb.add(cnt);
    const ma = dialPlate(0.09, { label: 'mA', frac: 0.3 });
    ma.position.set(0, 1.36, 0.075); cb.add(ma);
    g.add(cb);
  }
  g.userData.tops = tops;
  return g;
}

// ---- wave trap (§5.6, Card 02-H) — hangs in the line's path ------------
export function makeWaveTrap() {
  const g = grp();
  const barrel = cyl(0.625, 0.625, 1.9, MAT.sf6, 0, 0, 0, 20);
  barrel.rotation.x = Math.PI / 2; g.add(barrel);
  for (let i = 0; i < 6; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.028, 8, 22), MAT.aluminium);
    band.position.z = -0.78 + i * 0.31; band.castShadow = true; g.add(band);
  }
  g.add(box(0.4, 0.2, 0.3, MAT.cabinet, 0, -0.78, 0)); // tuning pack
  const lbl = signPlate(0.5, 0.14, ['1,250 A · PLCC WAVE TRAP'], { px: [640, 176] });
  lbl.position.set(0, 0, 0.64); g.add(lbl);
  for (const sx of [-0.5, 0.5]) {
    const s = discString(4); s.position.set(sx, 1.35, 0); s.rotation.z = sx > 0 ? -0.18 : 0.18; g.add(s);
    g.add(box(0.05, 0.75, 0.05, MAT.galv, sx, 0.95, 0));
  }
  return g;
}

// ---- bay marshalling kiosk (§7.1, Card 02-J) ----------------------------
export function makeKiosk({ label = 'BAY 1 — FDR-1', permit = false } = {}) {
  const g = grp();
  g.add(box(0.9, 0.2, 0.6, MAT.concrete, 0, 0.1, 0));
  g.add(box(0.8, 1.4, 0.4, MAT.cabinet, 0, 0.9, 0));
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.02, 10), MAT.ledGreen);
  lamp.position.set(-0.18, 1.42, 0.205); g.add(lamp);
  const lamp2 = new THREE.Mesh(new THREE.CircleGeometry(0.02, 10), MAT.ledOff);
  lamp2.position.set(0.18, 1.42, 0.205); g.add(lamp2);
  const lb = signPlate(0.62, 0.13, [label], { px: [768, 160] });
  lb.position.set(0, 1.18, 0.205); g.add(lb);
  for (let i = 0; i < 3; i++) g.add(box(0.3, 0.02, 0.01, MAT.darkSteel, 0, 0.45 + i * 0.07, 0.205)); // door louvre
  if (permit) {
    const board = grp(1.1, 0, 0.3);
    board.add(box(0.06, 1.5, 0.06, MAT.galv, 0, 0.75, 0));
    const card = signPlate(0.52, 0.34, ['PERMIT TO WORK', 'PTW-118 · FDR-1 PATROL', 'INSPECTION · CREW: 2'], { bg: '#f0ead2', px: [640, 416] });
    card.position.set(0, 1.35, 0.04); board.add(card);
    g.add(board);
  }
  return g;
}

// ---- lattice structures (§6.4, Card 02-I) -------------------------------
// Lattice mast: two chords + zigzag lacing in the x-y plane.
export function latticeMast(h, w = 0.55, chord = 0.075) {
  const g = grp();
  for (const sx of [-1, 1]) g.add(box(chord, h, chord, MAT.galv, sx * w / 2, h / 2, 0));
  const n = Math.max(3, Math.round(h / 0.85));
  for (let i = 0; i < n; i++) {
    const y0 = (i / n) * h, y1 = ((i + 1) / n) * h;
    const d = box(0.045, Math.hypot(w, y1 - y0), 0.045, MAT.galv, 0, (y0 + y1) / 2, 0);
    d.rotation.z = Math.atan2(w, y1 - y0) * (i % 2 ? 1 : -1);
    g.add(d);
    g.add(box(w + 0.05, 0.045, 0.045, MAT.galv, 0, y1, 0));
  }
  g.add(box(w + 0.24, 0.06, 0.3, MAT.galv, 0, 0.03, 0)); // base plate
  return g;
}
// Lattice beam along +x from origin, depth ~0.9.
export function latticeBeam(span, depth = 0.9) {
  const g = grp();
  for (const sy of [0, -depth]) g.add(box(span, 0.07, 0.07, MAT.galv, span / 2, sy, 0));
  for (const sz of [-0.14, 0.14]) g.add(box(span, 0.05, 0.05, MAT.galv, span / 2, -depth / 2, sz));
  const n = Math.max(3, Math.round(span / 1.1));
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * span;
    g.add(box(0.05, depth, 0.05, MAT.galv, x, -depth / 2, 0));
    if (i < n) {
      const d = box(0.04, Math.hypot(span / n, depth), 0.04, MAT.galv, x + span / n / 2, -depth / 2, 0);
      d.rotation.z = Math.atan2(span / n, depth) * (i % 2 ? -1 : 1) + Math.PI / 2 * 0 + (i % 2 ? 0 : 0);
      d.rotation.z = Math.atan2(depth, span / n) * (i % 2 ? 1 : -1);
      g.add(d);
    }
  }
  return g;
}
// Portal: two masts + beam spanning x, beam top at `height`.
export function makePortal({ span = 12.2, height = 11.5, peak = false }) {
  const g = grp();
  for (const sx of [-1, 1]) {
    const m = latticeMast(height - 0.9, 0.6);
    m.position.set(sx * span / 2, 0, 0); g.add(m);
    const idp = signPlate(0.4, 0.14, ['132 kV'], { px: [384, 144] });
    idp.position.set(sx * span / 2, 1.6, 0.06); g.add(idp);
  }
  const beam = latticeBeam(span, 0.9);
  beam.position.set(-span / 2, height, 0); g.add(beam);
  if (peak) g.add(box(0.06, 1.1, 0.06, MAT.galv, 0, height + 0.5, 0)); // earth peak stub
  return g;
}
