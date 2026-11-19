// site.js — the ground itself and the human-scale infrastructure:
// displaced terrain (flat plant floor east, turbine ridge west), the
// dirt road network, the main gate, the O&M cabin with its lit window
// and parked pickup, sparse dry scrub and thorn trees. Ground is
// cracked pale earth from a procedural canvas — solar fields are not
// green lawns (inventory §3, §4.9).

import * as THREE from 'three';
import { STATION05, PALETTE } from '../../config/world.js';
import { MAT, box, cyl, canvasTexture, rng, terrainHeight } from './kit.js';

const S05 = STATION05;

function earthTexture() {
  const rand = rng(4102);
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#b39c72'; g.fillRect(0, 0, w, h);
    // tonal patches
    for (let i = 0; i < 260; i++) {
      const x = rand() * w, y = rand() * h, r = 8 + rand() * 42;
      const tones = ['#a98f66', '#bba37c', '#ae9469', '#a28a63'];
      g.fillStyle = tones[(rand() * tones.length) | 0];
      g.globalAlpha = 0.16 + rand() * 0.2;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // speckle / small stones
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = rand() > 0.5 ? '#937c58' : '#cbb489';
      g.fillRect(rand() * w, rand() * h, 1.6, 1.6);
    }
    // faint cracks
    g.strokeStyle = 'rgba(90,72,50,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      let x = rand() * w, y = rand() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (rand() - 0.5) * 46; y += (rand() - 0.5) * 46; g.lineTo(x, y); }
      g.stroke();
    }
  });
}

function buildTerrain(group) {
  const geo = new THREE.PlaneGeometry(1150, 880, 115, 88);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const rand = rng(777);
  // per-vertex gentle noise, only on the ridge (flat floor stays flat)
  const noise = new Map();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const key = `${Math.round(x)},${Math.round(z)}`;
    if (!noise.has(key)) noise.set(key, rand());
    const ridgeT = THREE.MathUtils.clamp((-90 - x) / 80, 0, 1);
    pos.setY(i, terrainHeight(x, z) + (noise.get(key) - 0.5) * 0.5 * ridgeT);
  }
  geo.computeVertexNormals();
  const tex = earthTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 20);
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
  ground.position.set(-20, 0, -10);
  ground.receiveShadow = true;
  group.add(ground);
}

function buildRoads(group) {
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xb3a284, roughness: 1 });
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x9a8668, roughness: 1 });
  function road(w, l, x, z, rotY = 0) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), roadMat);
    r.rotation.x = -Math.PI / 2; r.rotation.z = rotY;
    r.position.set(x, 0.03, z);
    r.receiveShadow = true;
    group.add(r);
    // darker wheel tracks
    for (const off of [-w * 0.28, w * 0.28]) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.55, l * 0.98), trackMat);
      t.rotation.x = -Math.PI / 2; t.rotation.z = rotY;
      const dx = Math.cos(rotY) * off, dz = -Math.sin(rotY) * off;
      t.position.set(x + dx, 0.045, z + dz);
      t.receiveShadow = true;
      group.add(t);
    }
  }
  // main east-west road along the south of the PV field
  road(90, 5, 10, 38);
  // north-south roads between the PV blocks (array-walk roads)
  road(5, 84, -26, -4);
  road(5, 84, 26, -4);
  // south site road to the gate, and the spur to the BESS yard
  road(150, 5, 20, 124);
  road(5, 66, 84, 92);
  road(74, 5, 121, 60);
  // road east to the substation
  road(5, 80, 84, -8);
  road(66, 5, 116, -16);
  // turbine access track climbing west (flat ribbon on the flat floor;
  // it ends where the ridge begins)
  road(70, 5, -70, 6);
}

function buildScrub(group) {
  const rand = rng(9021);
  const scrubMat = new THREE.MeshStandardMaterial({ color: 0x7a7a4c, roughness: 1 });
  const dryMat = new THREE.MeshStandardMaterial({ color: PALETTE.dryGrass, roughness: 1 });
  const geo = new THREE.IcosahedronGeometry(0.55, 0);
  const count = 170;
  const inst = new THREE.InstancedMesh(geo, scrubMat, count);
  const instDry = new THREE.InstancedMesh(geo, dryMat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  let placed = 0, guard = 0;
  while (placed < count && guard++ < 4000) {
    const x = -320 + rand() * 620, z = -190 + rand() * 400;
    // keep clear of the built zones
    if (x > -90 && x < 190 && z > -80 && z < 145) continue;
    if (x > 85 && x < 175 && z > 20 && z < 75) continue;
    const y = terrainHeight(x, z);
    for (const [mesh, idx] of [[inst, placed], [instDry, placed]]) {
      e.set(0, rand() * 6.28, 0); q.setFromEuler(e);
      const s = 0.5 + rand() * 1.1;
      sc.set(s, s * 0.55, s);
      v.set(x + (rand() - 0.5) * 1.4, y + 0.12, z + (rand() - 0.5) * 1.4);
      m.compose(v, q, sc);
      mesh.setMatrixAt(idx, m);
    }
    placed++;
  }
  inst.count = instDry.count = placed;
  inst.castShadow = true;
  group.add(inst, instDry);

  // a few thorn trees at the fence line
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4a38, roughness: 1 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x66713f, roughness: 1 });
  const trees = [[-95, -120], [-60, 150], [185, 90], [200, -140], [-140, -170], [90, 168]];
  for (const [x, z] of trees) {
    const y = terrainHeight(x, z);
    const t = new THREE.Group();
    const trunk = cyl(0.14, 0.22, 2.6, trunkMat, 0, 1.3, 0, 7);
    trunk.castShadow = true;
    t.add(trunk);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 + rand() * 0.7, 0), canopyMat);
      c.position.set((rand() - 0.5) * 1.8, 3 + rand() * 0.9, (rand() - 0.5) * 1.8);
      c.scale.y = 0.55;
      c.castShadow = true;
      t.add(c);
    }
    t.position.set(x, y, z);
    group.add(t);
  }
}

function buildGateAndCabin(group) {
  const [gx, gz] = S05.gate;
  // gate: two posts + a swung-open mesh gate leaf on the south road
  const postMat = MAT.structure;
  for (const dx of [-3.2, 3.2]) group.add(box(0.18, 2.4, 0.18, postMat, gx + dx, 1.2, gz));
  const leaf = box(6.2, 1.7, 0.05, MAT.galvanised, gx - 0.2, 1.05, gz - 1.4);
  leaf.rotation.y = 0.5;
  group.add(leaf);

  // O&M cabin — one container cabin, lit window (the shift operator)
  const [cx, cz] = S05.cabin.pos;
  const cabin = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c0, roughness: 0.8 });
  const body = box(6.1, 2.9, 2.5, bodyMat, 0, 1.6, 0);
  body.castShadow = true;
  cabin.add(body);
  cabin.add(box(6.3, 0.12, 2.7, MAT.concreteDark, 0, 3.1, 0));
  cabin.add(box(6.3, 0.3, 2.7, MAT.concrete, 0, 0.15, 0));
  // window with warm interior glow (emissive; the point light is in lighting.js)
  const winMat = new THREE.MeshStandardMaterial({ color: 0x2c2c26, emissive: 0xffb765, emissiveIntensity: 1.6 });
  cabin.add(box(1.5, 0.95, 0.04, winMat, -1.4, 1.8, -1.26));
  cabin.add(box(0.85, 2.0, 0.05, MAT.darkSteel, 1.9, 1.35, -1.26));
  // wall AC unit + water tank beside
  cabin.add(box(0.8, 0.6, 0.35, MAT.galvanised, 3.25, 1.7, 0.4));
  const tank = cyl(0.85, 0.85, 1.6, new THREE.MeshStandardMaterial({ color: 0x3f4448, roughness: 0.6 }), 4.6, 1.6, 0.6, 14);
  tank.castShadow = true;
  cabin.add(tank);
  cabin.add(box(2.2, 0.8, 0.15, MAT.structure, 4.6, 0.4, 0.6));
  cabin.position.set(cx, 0, cz);
  group.add(cabin);

  // parked pickup — dusty white, simple honest volumes
  const pk = new THREE.Group();
  const pkMat = new THREE.MeshStandardMaterial({ color: 0xdcd8ce, roughness: 0.55, metalness: 0.2 });
  const cab = box(1.7, 0.62, 1.76, pkMat, -0.25, 0.98, 0); cab.castShadow = true;
  const bed = box(2.2, 0.5, 1.8, pkMat, -2.2, 0.82, 0); bed.castShadow = true;
  const hood = box(1.3, 0.42, 1.76, pkMat, 1.35, 0.86, 0); hood.castShadow = true;
  pk.add(cab, bed, hood);
  pk.add(box(1.5, 0.4, 1.7, new THREE.MeshStandardMaterial({ color: 0x22282e, roughness: 0.2 }), -0.3, 1.32, 0));
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.95 });
  for (const [wx, wz] of [[1.35, 0.95], [1.35, -0.95], [-2.3, 0.95], [-2.3, -0.95]]) {
    const wgeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 14);
    const w = new THREE.Mesh(wgeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    pk.add(w);
  }
  pk.position.set(cx + 7.5, 0, cz + 3.4);
  pk.rotation.y = -0.22;
  group.add(pk);
}

function buildBoundaryFence(group) {
  // post-and-wire plant boundary along the south and east (suggested,
  // not a cage): posts every 12 m with two wire lines.
  const postGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.7, 6);
  const posts = [];
  for (let x = -110; x <= 210; x += 12) posts.push([x, 130]);
  for (let z = -70; z <= 130; z += 12) posts.push([210, z]);
  const inst = new THREE.InstancedMesh(postGeo, MAT.structure, posts.length);
  const m = new THREE.Matrix4();
  posts.forEach(([x, z], i) => {
    m.makeTranslation(x, terrainHeight(x, z) + 0.85, z);
    inst.setMatrixAt(i, m);
  });
  group.add(inst);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x6a7076 });
  const pts = [];
  for (const y of [0.9, 1.55]) {
    for (let x = -110; x < 210; x += 12) { pts.push(new THREE.Vector3(x, y, 130), new THREE.Vector3(x + 12, y, 130)); }
    for (let z = -70; z < 130; z += 12) { pts.push(new THREE.Vector3(210, y, z), new THREE.Vector3(210, y, z + 12)); }
  }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), wireMat);
  group.add(wires);
}

export function createSite() {
  const group = new THREE.Group();
  group.name = 's05-site';
  buildTerrain(group);
  buildRoads(group);
  buildScrub(group);
  buildGateAndCabin(group);
  buildBoundaryFence(group);
  return group;
}
