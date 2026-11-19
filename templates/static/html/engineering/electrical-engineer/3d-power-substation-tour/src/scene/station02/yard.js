// yard.js — civil works, fence, roads, control building edge and
// signage (inventory §7-§9, §13). The earthing grid is invisible; it is
// shown by its evidence: earth flats, test links, earth pits.

import * as THREE from 'three';
import { PALETTE } from '../../config/world.js';
import { MAT, box, cyl, grp, plate, signPlate, canvasTex } from './helpers.js';
import { latticeMast } from './baykit.js';

function gravelTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7d7f82'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3800; i++) {
      const v = 100 + Math.random() * 55, s = 2 + Math.random() * 4;
      g.fillStyle = `rgb(${v - 6},${v - 3},${v + 2})`;
      g.fillRect(Math.random() * w, Math.random() * h, s, s * 0.75);
    }
  });
}

export function createYard() {
  const Y = grp();

  // ---- ground: grass apron, gravel bed (§8.1) -------------------------
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(190, 150),
    new THREE.MeshStandardMaterial({ color: PALETTE.grass, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.04; grass.receiveShadow = true; Y.add(grass);
  const gtex = gravelTexture();
  gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(30, 20);
  const gravel = new THREE.Mesh(new THREE.PlaneGeometry(74, 48),
    new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 }));
  gravel.rotation.x = -Math.PI / 2; gravel.position.y = 0; gravel.receiveShadow = true; Y.add(gravel);

  // ---- roads (§8.4): spur from gate + south apron + walkway (§3) ------
  const roadMat = MAT.concrete;
  Y.add(box(4, 0.06, 8.2, roadMat, 0, 0.03, 19.2));           // gate spur
  Y.add(box(56, 0.06, 3.6, roadMat, -6, 0.03, 21.2));          // south apron
  const walk = box(66, 0.05, 1.2, MAT.concreteDark, 0, 0.025, 8.6); Y.add(walk); // equipment-row path
  Y.add(box(1.2, 0.05, 5.4, MAT.concreteDark, 0, 0.025, 12.4)); // path spur to fire wall gap

  // ---- cable trench (§7.5): main run + one replaced cover -------------
  for (let x = -31; x <= 31; x += 1.24) {
    const replaced = x > 17 && x < 19.5;
    Y.add(box(1.16, 0.04, 0.9, replaced ? MAT.galvBright : MAT.concreteDark, x, 0.02, 6.9));
  }

  // ---- drainage channel at the gate (§8.6): one reflective strip ------
  const drain = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x9fb6bd, roughness: 0.08, metalness: 0.35 }));
  drain.rotation.x = -Math.PI / 2; drain.position.set(0, 0.012, 22.6); Y.add(drain);

  // ---- fence + gate (§8.3) ----------------------------------------------
  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.4, 8);
  const posts = [];
  for (let x = -36; x <= 36; x += 3) { posts.push([x, -23]); if (Math.abs(x) > 3.4) posts.push([x, 23]); }
  for (let z = -20; z <= 20; z += 3.2) { posts.push([-36, z]); posts.push([36, z]); }
  const postInst = new THREE.InstancedMesh(postGeo, MAT.galv, posts.length);
  { const m4 = new THREE.Matrix4(); posts.forEach(([x, z], i) => { m4.setPosition(x, 1.2, z); postInst.setMatrixAt(i, m4); }); }
  postInst.castShadow = true; Y.add(postInst);
  const meshMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.5, metalness: 0.7, wireframe: true, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  function fenceRun(len, x, z, rotY) {
    const f = grp(x, 0, z); f.rotation.y = rotY;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.2), meshMat);
    mesh.position.y = 1.25; f.add(mesh);
    for (let i = 0; i < 3; i++) { // barbed overhang strands
      const s = cyl(0.006, 0.006, len, MAT.darkSteel, 0, 2.5 + i * 0.12, 0.1 + i * 0.08, 4);
      s.rotation.z = Math.PI / 2; f.add(s);
    }
    f.add(box(len, 0.05, 0.05, MAT.galv, 0, 2.38, 0));
    return f;
  }
  Y.add(fenceRun(72, 0, -23, 0));
  Y.add(fenceRun(32.6, -19.7, 23, 0));
  Y.add(fenceRun(32.6, 19.7, 23, 0));
  Y.add(fenceRun(46, -36, 0, Math.PI / 2));
  Y.add(fenceRun(46, 36, 0, Math.PI / 2));
  { // sliding main gate, padlocked
    const gate = grp(0.4, 0, 23);
    gate.add(box(6.2, 0.06, 0.06, MAT.galv, 0, 2.3, 0));
    gate.add(box(6.2, 0.06, 0.06, MAT.galv, 0, 0.25, 0));
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.0), meshMat);
    gm.position.y = 1.28; gate.add(gm);
    for (let i = 0; i < 5; i++) gate.add(box(0.06, 2.2, 0.06, MAT.galv, -3 + i * 1.5, 1.2, 0));
    gate.add(box(0.3, 0.12, 0.08, MAT.darkSteel, 2.6, 1.1, 0.06)); // chain + lock block
    Y.add(gate);
    const board = signPlate(1.7, 0.42, ['132/33 kV MERIDIAN ROAD SUBSTATION', 'AUTHORISED ENTRY ONLY'], { px: [1024, 256] });
    board.position.set(0.4, 1.7, 22.9); board.rotation.y = Math.PI; Y.add(board);
  }
  for (const fx of [-27, -9, 9, 27]) { // fence danger plates, every ~15 m
    const dp = signPlate(0.5, 0.25, ['DANGER', '132000 VOLTS'], { bg: '#f2ede2', ink: '#a3241c', px: [512, 256] });
    dp.position.set(fx, 1.5, -22.9); Y.add(dp);
    const dp2 = dp.clone(); dp2.position.set(fx, 1.5, 22.9); dp2.rotation.y = Math.PI; Y.add(dp2);
  }
  for (const ex of [-34, 34]) { // earth pits near the corners (§8.2)
    Y.add(box(0.5, 0.18, 0.5, MAT.concrete, ex, 0.09, 20.5));
    const lid = signPlate(0.44, 0.44, ['EARTH PIT'], { px: [256, 256] });
    lid.rotation.x = -Math.PI / 2; lid.position.set(ex, 0.19, 20.5); Y.add(lid);
  }

  // ---- fire wall (§8.5): 650 mm RCC between the transformers ----------
  const wall = grp(0, 0, 12.0);
  wall.add(box(0.65, 7.6, 6.4, MAT.concrete, 0, 3.8, 0));
  wall.add(box(0.85, 0.18, 6.6, MAT.concreteDark, 0, 7.69, 0)); // coping
  wall.add(box(0.67, 7.6, 0.03, MAT.concreteDark, 0, 3.8, 0.4)); // construction joint
  Y.add(wall);

  // ---- yard lighting columns (§6.6) --------------------------------------
  for (const [lx, lz] of [[-28, 4], [28, 4], [-28, 16], [28, 16]]) {
    const pole = grp(lx, 0, lz);
    const shaft = cyl(0.05, 0.09, 9, MAT.galv, 0, 4.5, 0, 10); pole.add(shaft);
    pole.add(box(0.9, 0.05, 0.05, MAT.galv, 0, 8.9, 0));
    for (const hx of [-0.35, 0.35]) pole.add(box(0.34, 0.12, 0.2, MAT.darkSteel, hx, 8.82, 0.1));
    Y.add(pole);
  }

  // ---- fire point (§7.2): the yard's one rationed red --------------------
  const fp = grp(-4.6, 0, 15.9);
  fp.add(box(0.07, 1.7, 0.07, MAT.galv, 0, 0.85, 0));
  fp.add(box(0.7, 0.9, 0.3, MAT.redPaint, 0, 1.35, 0));
  const fpl = signPlate(0.6, 0.16, ['FIRE POINT'], { bg: '#a3241c', ink: '#f5efe2', px: [512, 128] });
  fpl.position.set(0, 1.62, 0.16); fp.add(fpl);
  for (const ex of [-0.16, 0.16]) fp.add(cyl(0.055, 0.055, 0.42, MAT.redPaint, ex, 1.05, 0.17, 10));
  Y.add(fp);

  // ---- control building edge (§9) -----------------------------------------
  const B = grp(27, 0, 19);
  B.add(box(14.4, 0.5, 6.4, MAT.concreteDark, 0, 0.25, 0)); // plinth band
  B.add(box(14, 3.6, 6, MAT.whitePaint, 0, 2.05, 0));
  B.add(box(14.3, 0.18, 6.3, MAT.concreteDark, 0, 3.95, 0)); // parapet
  for (let i = 0; i < 5; i++) { // dark-glass windows, yard side
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), MAT.glassDark);
    win.position.set(-5.4 + i * 2.7, 2.4, -3.01); win.rotation.y = Math.PI; B.add(win);
  }
  const door = grp(-4.2, 0, -3.0);
  door.add(box(1.0, 2.2, 0.08, MAT.darkSteel, 0.42, 1.35, -0.3)).children;
  door.children[door.children.length - 1].rotation.y = -0.7; // door ajar
  door.add(box(1.04, 2.24, 0.06, MAT.black, -0.05, 1.35, 0.02));
  B.add(door);
  for (let i = 0; i < 2; i++) { // hard hats on hooks by the door
    const hat = grp(-3.2 + i * 0.45, 1.8, -3.06);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.whitePaint);
    hat.add(dome); hat.add(cyl(0.15, 0.15, 0.015, MAT.whitePaint, 0, 0, 0, 14));
    B.add(hat);
  }
  for (const ax of [3.4, 5.2]) { // split-AC outdoor units
    B.add(box(0.9, 0.7, 0.3, MAT.cabinet, ax, 0.85, -3.2));
    const fanC = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16),
      new THREE.MeshStandardMaterial({ color: 0x3c4147, roughness: 0.6, wireframe: true }));
    fanC.position.set(ax, 0.85, -3.36); fanC.rotation.y = Math.PI; B.add(fanC);
  }
  for (let i = 0; i < 3; i++) // fire-stop pillows at the trench entry
    B.add(box(0.3, 0.18, 0.12, MAT.redPaint, -6.4, 0.35 + i * 0.2, -3.05));
  Y.add(B);
  { // station service transformer: 100 kVA on poles beside the building (§9)
    const ss = grp(17.6, 0, 15.6);
    for (const sx of [-0.9, 0.9]) ss.add(box(0.14, 5.4, 0.14, MAT.concreteDark, sx, 2.7, 0));
    ss.add(box(2.4, 0.12, 0.12, MAT.concreteDark, 0, 5.2, 0));
    ss.add(box(1.1, 1.0, 0.7, MAT.tank, 0, 4.35, 0));
    for (let i = 0; i < 3; i++) ss.add(cyl(0.03, 0.045, 0.3, MAT.porcelain, -0.35 + i * 0.35, 5.0, 0, 8));
    const ssp = signPlate(0.6, 0.15, ['STN SERVICE · 100 kVA'], { px: [640, 160] });
    ssp.position.set(0, 3.4, 0.4); ss.add(ssp);
    Y.add(ss);
  }
  { // Stevenson-screen ambient sensor post (§7.6)
    const st = grp(14.5, 0, 20.8);
    st.add(box(0.06, 1.3, 0.06, MAT.galv, 0, 0.65, 0));
    st.add(box(0.5, 0.4, 0.35, MAT.whitePaint, 0, 1.45, 0));
    Y.add(st);
  }
  return Y;
}
