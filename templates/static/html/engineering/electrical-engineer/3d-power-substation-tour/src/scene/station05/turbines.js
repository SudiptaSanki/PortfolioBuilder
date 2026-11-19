// turbines.js — 8 × Vestas V150-4.5 MW (inventory §4.1, datasheet
// dimensions): 150 m rotor, 105 m hub, nacelle 12.96 × 3.98 m with
// the CoolerTop fin bank on its roof, tapered tower on a Ø21 m
// gravity foundation, padmount 690 V → 33 kV kiosk at each base.
// Two near-field heroes carry full detail; six carry the silhouette
// plus the parts that read at distance. One background machine is
// parked for maintenance — a real fleet always has one. Rotors turn
// on ONE shared clock state (the station's clamped t) with per-
// turbine phase; they are never synchronised.

import * as THREE from 'three';
import { STATION05, PALETTE } from '../../config/world.js';
import { MAT, box, cyl, terrainHeight } from './kit.js';

const S05 = STATION05;
const T = S05.turbines;

const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdfe0dc, roughness: 0.48, metalness: 0.12 });
const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe4e5e1, roughness: 0.42, metalness: 0.08 });
const kioskMat = new THREE.MeshStandardMaterial({ color: 0x71806e, roughness: 0.6, metalness: 0.3 });

const rotors = [];   // { group, phase, omega } — omega 0 = parked

// One smooth lofted aerofoil — NOT stacked box segments (those
// read as articulated planks). Elliptical sections are lofted
// along the span through keyframed chord / thickness / twist /
// sweep profiles with smoothstep interpolation between keys, so
// the surface is continuous from root shoulder to fine tip.
function bladeGeometry() {
  const K = 14;    // points around each section
  const ST = 18;   // spanwise stations
  const y0 = 3.2, y1 = T.bladeLen;
  // keys: [spanFrac, chord, thickness, twistDeg, sweepZ]
  const keys = [
    [0.00, 3.40, 0.95, 13.0, 0.00],
    [0.10, 4.05, 0.78, 11.5, 0.06],
    [0.25, 3.95, 0.55, 9.0, 0.22],
    [0.45, 3.30, 0.36, 6.2, 0.52],
    [0.65, 2.55, 0.24, 4.0, 0.86],
    [0.85, 1.65, 0.15, 2.4, 1.12],
    [1.00, 0.62, 0.07, 1.2, 1.30],
  ];
  const prof = (f) => {
    let i = 0;
    while (i < keys.length - 2 && f > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1];
    const u = THREE.MathUtils.clamp((f - a[0]) / (b[0] - a[0]), 0, 1);
    const s = u * u * (3 - 2 * u);
    return [1, 2, 3, 4].map((k) => THREE.MathUtils.lerp(a[k], b[k], s));
  };
  const positions = [], indices = [];
  for (let j = 0; j <= ST; j++) {
    const f = j / ST;
    const [chord, thick, twistDeg, sweep] = prof(f);
    const y = THREE.MathUtils.lerp(y0, y1, f);
    const tw = THREE.MathUtils.degToRad(twistDeg);
    const ct = Math.cos(tw), st = Math.sin(tw);
    for (let i = 0; i < K; i++) {
      const th = (i / K) * Math.PI * 2;
      // ellipse section, balance point at ~40% chord
      const lx = Math.cos(th) * chord * 0.5 - chord * 0.10;
      const lz = Math.sin(th) * thick * 0.5;
      positions.push(lx * ct - lz * st, y, sweep + lx * st + lz * ct);
    }
  }
  for (let j = 0; j < ST; j++) {
    for (let i = 0; i < K; i++) {
      const a = j * K + i, b = j * K + ((i + 1) % K);
      indices.push(a, a + K, b, b, a + K, b + K);
    }
  }
  // tip cap: fan to a point just past the last ring
  const [tc, , ttw, ts] = prof(1);
  const twTip = THREE.MathUtils.degToRad(ttw);
  const tipIndex = positions.length / 3;
  positions.push(-tc * 0.10 * Math.cos(twTip), y1 + 0.35, ts - tc * 0.10 * Math.sin(twTip));
  const lastRing = ST * K;
  for (let i = 0; i < K; i++) indices.push(lastRing + i, tipIndex, lastRing + ((i + 1) % K));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();   // shared ring vertices → smooth shading
  return geo;
}

function buildBlade() {
  const blade = new THREE.Group();
  // root cylinder ~3.7 m dia necking into the aerofoil
  const root = cyl(1.85, 1.95, 5.5, bladeMat, 0, 2.75, 0, 12);
  blade.add(root);
  blade.add(new THREE.Mesh(bladeGeometry(), bladeMat));
  return blade;
}

function buildTurbine(hero) {
  const g = new THREE.Group();
  const H = T.hubHeight;

  // foundation: Ø21 m gravity base, 1 m proud, gravel ring
  const found = cyl(10.5, 11, 1.0, MAT.concrete, 0, 0.5, 0, 24);
  found.receiveShadow = true;
  g.add(found);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 0.12, 24), MAT.gravel);
  ring.position.y = 0.06; ring.receiveShadow = true;
  g.add(ring);
  g.add(cyl(3.4, 3.6, 0.35, MAT.concreteDark, 0, 1.15, 0, 20)); // grout plinth

  // tapered tower, 3 flange bands
  const tower = cyl(1.75, 3.0, H - 2, whiteMat, 0, 1.3 + (H - 2) / 2, 0, 20);
  g.add(tower);
  for (const fy of [0.33, 0.63]) {
    g.add(cyl(2.62 - fy * 0.85, 2.62 - fy * 0.85, 0.5, whiteMat, 0, 1.3 + (H - 2) * fy, 0, 20));
  }

  // nacelle (hub centre at H), body extends back from the hub
  const nac = new THREE.Group();
  nac.position.y = H;
  const body = box(3.98, 3.9, 11.4, whiteMat, 0, 0, -4.4);
  nac.add(body);
  nac.add(box(3.6, 0.5, 10.6, whiteMat, 0, 2.15, -4.4)); // roof line
  // CoolerTop: the finned radiator bank — the silhouette detail
  const finMat = MAT.darkSteel;
  const fins = hero ? 11 : 6;
  for (let i = 0; i < fins; i++) {
    nac.add(box(0.09, 1.15, 3.4, finMat, -1.55 + (3.1 * i) / (fins - 1), 2.95, -4.6));
  }
  nac.add(box(3.3, 0.35, 3.6, finMat, 0, 2.35, -4.6)); // fin bank base
  // aviation obstruction light (lit on the heroes at dusk)
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x551512, emissive: PALETTE.ledRed, emissiveIntensity: hero ? 2.2 : 0.0,
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lampMat);
  lamp.position.set(0, 3.65, -8.6);
  nac.add(lamp);
  g.add(nac);

  // spinner + rotor
  const rotor = new THREE.Group();
  rotor.position.set(0, H, 2.6);
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(1.9, 5.5, 16), whiteMat);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 0.6;
  rotor.add(spinner);
  const bladeProto = buildBlade();
  for (let i = 0; i < 3; i++) {
    const b = bladeProto.clone();
    b.rotation.z = (i * 2 * Math.PI) / 3;
    rotor.add(b);
  }
  g.add(rotor);

  if (hero) {
    // tower door + step + handrail, facing the access track (+x local)
    g.add(box(0.08, 2.0, 0.95, MAT.darkSteel, 2.98, 2.3, 0.6));
    g.add(box(0.7, 0.18, 1.3, MAT.concrete, 3.3, 1.4, 0.6));
    g.add(box(0.9, 0.5, 0.5, MAT.darkSteel, 2.9, 1.75, -1.3)); // tower-base cabinet
    // dark ventilation grille low on the tower
    g.add(box(0.06, 0.8, 1.4, MAT.darkSteel, -2.6, 2.0, 1.6));
    // earth pit cover beside the apron
    g.add(box(0.7, 0.1, 0.7, MAT.concreteDark, 5.4, 1.06, -3.4));
    g.add(box(0.12, 0.5, 0.12, MAT.copper, 5.4, 1.3, -3.4)); // earth tail
    // crane hardstand
    const hs = box(15, 0.14, 25, MAT.gravel, 14, 0.07, 4);
    hs.receiveShadow = true;
    g.add(hs);
  }

  // padmount unit transformer kiosk, 690 V → 33 kV, ~10 m from tower
  const kiosk = new THREE.Group();
  const kb = box(2.5, 2.0, 1.6, kioskMat, 0, 1.0, 0);
  kiosk.add(kb);
  kiosk.add(box(2.7, 0.15, 1.8, MAT.concrete, 0, 0.08, 0));
  kiosk.add(box(0.7, 1.1, 0.04, MAT.darkSteel, -0.6, 1.0, 0.82));
  kiosk.add(box(0.7, 1.1, 0.04, MAT.darkSteel, 0.6, 1.0, 0.82));
  kiosk.position.set(9.5, 0.14, -5.5);
  g.add(kiosk);
  // cable trench marker strip from kiosk toward the tower
  const trench = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 1 }));
  trench.rotation.x = -Math.PI / 2;
  trench.rotation.z = 0.61;
  trench.position.set(5.4, 0.22, -3.1);
  g.add(trench);

  return { group: g, rotor };
}

export function createTurbines() {
  const group = new THREE.Group();
  group.name = 's05-turbines';
  // yaw: local +z points INTO the wind (from WNW, same bearing as sun)
  const windDir = new THREE.Vector3(
    Math.sin(THREE.MathUtils.degToRad(S05.windFromDeg)), 0,
    -Math.cos(THREE.MathUtils.degToRad(S05.windFromDeg)));
  const yaw = Math.atan2(windDir.x, windDir.z);
  const omega = (T.rpm * 2 * Math.PI) / 60;

  T.rows.forEach((row, ri) => {
    row.z.forEach((z, ci) => {
      const isHero = ri === 0 && (ci === 0 || ci === 1);
      const isParked = ri === 1 && ci === 3;
      const { group: tg, rotor } = buildTurbine(isHero);
      const y = terrainHeight(row.x, z);
      tg.position.set(row.x, y, z);
      tg.rotation.y = yaw + (isParked ? THREE.MathUtils.degToRad(25) : 0);
      group.add(tg);
      rotors.push({
        group: rotor,
        phase: (ri * 4 + ci) * 1.93,
        omega: isParked ? 0 : omega * (0.94 + ((ri * 4 + ci) % 3) * 0.05),
      });
    });
  });
  return group;
}

// One shared rotation state: every rotor reads the same clamped t.
export function tickTurbines(t) {
  for (const r of rotors) r.group.rotation.z = r.phase + r.omega * t;
}
