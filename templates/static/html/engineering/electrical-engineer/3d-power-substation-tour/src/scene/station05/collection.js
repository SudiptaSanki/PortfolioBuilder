// collection.js — the 33 kV collection network made visible
// (inventory §4.8): buried cable everywhere (its route markers are
// the visible trace), plus one overhead 33 kV spur on 11 m poles
// from the far turbine row to the pooling substation, and the
// 132 kV exit line leaving the gantry on tubular poles toward
// Station 03's corridor country. Conductors hang in true catenary
// sag — parabolic approximation, sag ~2.5% of span (SCAFFOLD rule 2).

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { MAT, box, cyl, terrainHeight } from './kit.js';

const S05 = STATION05;

const wireMat = new THREE.LineBasicMaterial({ color: 0x2e3236 });

function catenary(group, p0, p1, sag) {
  const pts = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = new THREE.Vector3().lerpVectors(p0, p1, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
}

function pole(x, z, h, armLen) {
  const g = new THREE.Group();
  const y = terrainHeight(x, z);
  const p = cyl(0.13, 0.19, h, MAT.concreteDark, 0, h / 2, 0, 8);
  p.castShadow = true;
  g.add(p);
  g.add(box(armLen, 0.14, 0.14, MAT.structure, 0, h - 0.8, 0));
  for (const off of [-armLen / 2 + 0.25, 0, armLen / 2 - 0.25]) {
    g.add(cyl(0.035, 0.035, 0.5, MAT.porcelainGrey, off, h - 0.5, 0, 6));
  }
  g.position.set(x, y, z);
  return { group: g, topY: y + h - 0.3, x, z };
}

export function createCollection() {
  const group = new THREE.Group();
  group.name = 's05-collection';

  // ---- 33 kV overhead spur: turbine country → substation ----
  const spurPts = S05.spur.polesX.map((x) => [x, S05.spur.z]);
  spurPts.push([112, -84], [122, -52]);
  const tops = [];
  spurPts.forEach(([x, z], i) => {
    const p = pole(x, z, 11, 2.6);
    // crossarm perpendicular to the local line direction
    const next = spurPts[Math.min(i + 1, spurPts.length - 1)];
    const prev = spurPts[Math.max(i - 1, 0)];
    p.group.rotation.y = Math.atan2(next[0] - prev[0], next[1] - prev[1]);
    group.add(p.group);
    tops.push(p);
  });
  for (let i = 0; i < tops.length - 1; i++) {
    const a = tops[i], b = tops[i + 1];
    const dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    for (const off of [-1.05, 0, 1.05]) {
      catenary(group,
        new THREE.Vector3(a.x + perp.x * off, a.topY, a.z + perp.z * off),
        new THREE.Vector3(b.x + perp.x * off, b.topY, b.z + perp.z * off),
        1.3);
    }
  }

  // ---- 132 kV exit line: gantry → horizon (NE) ----
  const exitPts = [[160, -52], [194, -86], [236, -120], [280, -156]];
  const exitTops = [];
  exitPts.forEach(([x, z], i) => {
    if (i === 0) { exitTops.push({ x, z, topY: 11.2 }); return; } // gantry beam
    const p = pole(x, z, 16, 3.6);
    p.group.rotation.y = Math.atan2(1, 1);
    group.add(p.group);
    exitTops.push(p);
  });
  for (let i = 0; i < exitTops.length - 1; i++) {
    const a = exitTops[i], b = exitTops[i + 1];
    const dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    for ( const off of [-1.5, 0, 1.5]) {
      catenary(group,
        new THREE.Vector3(a.x + perp.x * off, a.topY, a.z + perp.z * off),
        new THREE.Vector3(b.x + perp.x * off, b.topY, b.z + perp.z * off),
        2.0);
    }
  }

  // ---- buried-cable route markers: weathered posts, red band ----
  const markerSpots = [];
  for (let x = -60; x <= 70; x += 26) markerSpots.push([x, 33.5]);
  for (let x = -40; x <= 60; x += 25) markerSpots.push([x, -33]);
  markerSpots.push([-26, 30], [26, 30], [80, 46], [80, -30], [100, -18]);
  const postGeo = new THREE.BoxGeometry(0.3, 0.55, 0.3);
  const bandGeo = new THREE.BoxGeometry(0.32, 0.1, 0.32);
  const posts = new THREE.InstancedMesh(postGeo, MAT.concrete, markerSpots.length);
  const bands = new THREE.InstancedMesh(bandGeo,
    new THREE.MeshStandardMaterial({ color: 0xb03028, roughness: 0.8 }), markerSpots.length);
  const m = new THREE.Matrix4();
  markerSpots.forEach(([x, z], i) => {
    const y = terrainHeight(x, z);
    m.makeTranslation(x, y + 0.27, z); posts.setMatrixAt(i, m);
    m.makeTranslation(x, y + 0.44, z); bands.setMatrixAt(i, m);
  });
  group.add(posts, bands);

  // ---- fibre/SCADA ring markers: same discipline, orange ----
  const fibreSpots = [];
  for (let x = -50; x <= 70; x += 24) fibreSpots.push([x, 120.5]);
  const fposts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.6, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xd96c27, roughness: 0.7 }), fibreSpots.length);
  fibreSpots.forEach(([x, z], i) => {
    m.makeTranslation(x, terrainHeight(x, z) + 0.3, z);
    fposts.setMatrixAt(i, m);
  });
  group.add(fposts);

  return group;
}
