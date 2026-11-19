// nodes.js — the node field (racks.js's role: the machine wall).
// Four worker-node racks in the Station 03 cabinet language, two
// rows facing the centre aisle, each face a grid of pod capsule
// BERTHS instead of compute trays: a node is a budget of CPU and
// memory that pods spend, drawn as capacity. One capsule unit is
// built here and instanced across every berth in the hall — node
// field, canary lanes and the HPA cradle all seat the same pod
// (createCapsuleField is exported for canary.js). Pods of one
// ReplicaSet ARE identical — one template, one pod-template-hash —
// and the difference is carried by state (ready / pending LEDs),
// version (lane, trim, plates) and place (the berth's node name).

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S05 = STATION05;
const N = S05.nodes;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ------------------------------------------------------------- capsule --
// The pod: a squat rounded capsule (cylinder + dome caps) seated
// upright in its berth. One geometry, one material, per-instance
// tint — one draw call per field that uses it.
const capsuleGeo = new THREE.CapsuleGeometry(0.085, 0.12, 4, 14);
const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.5 });

// placements: [{x, y, z, tint (hex), scale (uniform or [sx, sy, sz])}]
// — positions are capsule CENTRES in the caller's group space.
export function createCapsuleField(placements) {
  const mesh = new THREE.InstancedMesh(capsuleGeo, capsuleMat, placements.length);
  const d = new THREE.Object3D();
  const tint = new THREE.Color();
  placements.forEach((p, i) => {
    d.position.set(p.x, p.y, p.z);
    d.rotation.set(0, 0, 0);
    if (Array.isArray(p.scale)) d.scale.set(...p.scale);
    else d.scale.setScalar(p.scale || 1);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    mesh.setColorAt(i, tint.setHex(p.tint ?? 0xf2f3f4));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

// ------------------------------------------------------------- layout ---
// Berth geometry on a rack face (local space, face at z = +depth/2,
// face plane 1.90 tall centred at y = 1.08). Canvas and shelves are
// computed from the same numbers so the drawn cells and the seated
// capsules agree.
const FACE = { w: 1.0, top: 2.03, h: 1.9 };
const CELL = { x: [-0.25, 0.25], shelfY: [1.409, 1.073, 0.737, 0.401] };
const capY = (r) => CELL.shelfY[r] + 0.16;         // capsule centre height
const SUFFIX = 'abcdefghjkmnpqrstuvwxyz23456789';

function podName(rnd, special) {
  if (special) return special;
  let s = '';
  for (let i = 0; i < 4; i++) s += SUFFIX[Math.floor(rnd() * SUFFIX.length)];
  return `model-api-7d9f-${s}`;
}

// One rack's face: header (node name + crew), the berth grid with a
// pod name per cell, the capacity bar — the node's budget, drawn.
function rackFaceTex(nodeIdx, names, cpu, mem, sidecar) {
  return canvasTexture(512, 960, (g, w, h) => {
    g.fillStyle = '#22252a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c3036'; g.fillRect(0, 0, w, 132);                    // header
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'left';
    g.font = '700 54px Arial, sans-serif';
    g.fillText(`NODE ${nodeIdx + 1}`, 26, 62);
    g.font = '400 27px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('KUBELET · KUBE-PROXY · CONTAINERD', 26, 106);
    // berth cells
    for (let r = 0; r < N.berths.rows; r++) {
      for (let c = 0; c < N.berths.cols; c++) {
        const cx = 18 + c * 247, cy = 150 + r * 170;
        g.fillStyle = '#17191d'; g.fillRect(cx, cy, 230, 158);
        g.strokeStyle = '#3d434a'; g.lineWidth = 3; g.strokeRect(cx, cy, 230, 158);
        g.fillStyle = '#c8ccd1';
        g.font = '400 24px "Courier New", monospace';
        g.fillText(names[r * N.berths.cols + c], cx + 12, cy + 36);
      }
    }
    if (sidecar) {                       // the one told example, tagged
      g.fillStyle = '#c9a24d'; g.fillRect(18, 322, 230, 34);
      g.fillStyle = '#14171a';
      g.font = '700 21px Arial, sans-serif';
      g.fillText('APP + SIDECAR · ONE IP', 30, 346);
    }
    // capacity: requested vs capacity — a node is a budget
    const bar = (label, frac, y) => {
      g.fillStyle = '#9aa0a6'; g.font = '400 25px Arial, sans-serif';
      g.fillText(label, 26, y + 8);
      g.fillStyle = '#101215'; g.fillRect(120, y - 16, 366, 24);
      g.fillStyle = frac > 0.8 ? '#ffb02e' : '#39ff7a';
      g.fillRect(120, y - 16, 366 * frac, 24);
      g.fillStyle = '#c8ccd1'; g.font = '400 24px "Courier New", monospace';
      g.fillText(`${Math.round(frac * 100)}%`, 446, y + 34);
    };
    bar('CPU', cpu, 872);
    bar('MEM', mem, 922);
  });
}

// ------------------------------------------------------------- a rack ---
function buildRack(group, leds, capsules, nodeIdx, x, row, seedBase, sidecar) {
  const { facing, z } = row;
  const rack = new THREE.Group();
  rack.position.set(x, 0, z);
  rack.rotation.y = facing === 1 ? 0 : Math.PI;
  group.add(rack);

  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(N.width + 0.08, 0.09, N.depth + 0.08),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  plinth.position.y = 0.045;
  rack.add(plinth);
  const body = new THREE.Mesh(new THREE.BoxGeometry(N.width, N.height, N.depth), bodyMat);
  body.position.y = 0.09 + N.height / 2;
  rack.add(body);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, N.height, 0.05), frameMat);
    post.position.set(sx * (N.width / 2 - 0.025), 0.09 + N.height / 2, sz * (N.depth / 2 - 0.025));
    rack.add(post);
  }
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(N.width + 0.03, 0.04, N.depth + 0.03), frameMat);
  capTop.position.y = 0.09 + N.height + 0.02;
  rack.add(capTop);

  const rnd = seeded(seedBase);
  const names = [];
  for (let i = 0; i < N.berths.cols * N.berths.rows; i++) {
    let special = null;
    if (nodeIdx === 0 && i === 6) special = 'kube-proxy-x4md2';
    if (nodeIdx === 3 && i === 3) special = 'node-exporter-9k';
    names.push(podName(rnd, special));
  }
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(FACE.w, FACE.h),
    new THREE.MeshStandardMaterial({ map: rackFaceTex(nodeIdx, names, 0.55 + rnd() * 0.3, 0.4 + rnd() * 0.33, sidecar), roughness: 0.55, metalness: 0.3 }));
  face.position.set(0, 1.08, N.depth / 2 + 0.002);
  rack.add(face);

  // berth shelves + capsules + status LEDs (world space via facing)
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.6 });
  const toWorld = (lx, ly, lz) => facing === 1
    ? [x + lx, ly, z + lz]
    : [x - lx, ly, z - lz];
  let berthIdx = 0;
  for (let r = 0; r < N.berths.rows; r++) {
    for (let c = 0; c < N.berths.cols; c++, berthIdx++) {
      const lx = CELL.x[c];
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), shelfMat);
      shelf.position.set(lx, CELL.shelfY[r], N.depth / 2 + 0.14);
      rack.add(shelf);
      const isSidecar = sidecar && r === 0 && c === 0;
      if (isSidecar) {
        const [wx, wy, wz] = toWorld(lx - 0.08, capY(r), N.depth / 2 + 0.15);
        capsules.push({ x: wx, y: wy, z: wz, tint: 0xf2f3f4 });
        const [cx2, cy2, cz2] = toWorld(lx + 0.11, CELL.shelfY[r] + 0.095, N.depth / 2 + 0.15);
        capsules.push({ x: cx2, y: cy2, z: cz2, tint: 0xd8dce0, scale: [0.68, 0.55, 0.68] });
        const [ex, ey, ez] = toWorld(lx - 0.08, capY(r) + 0.15, N.depth / 2 + 0.26);
        leds.push({ x: ex, y: ey, z: ez, color: PALETTE.ledGreen, phase: rnd(), blink: 0 });
      } else {
        const [wx, wy, wz] = toWorld(lx, capY(r), N.depth / 2 + 0.15);
        capsules.push({ x: wx, y: wy, z: wz, tint: 0xf2f3f4 });
        // a healthy field at rest: green everywhere but two ambers —
        // pods starting somewhere is a normal sight, not an error
        const amber = (nodeIdx === 1 && berthIdx === 5) || (nodeIdx === 2 && berthIdx === 2);
        const [ex, ey, ez] = toWorld(lx, capY(r) + 0.15, N.depth / 2 + 0.26);
        leds.push({
          x: ex, y: ey, z: ez,
          color: amber ? PALETTE.ledAmber : PALETTE.ledGreen,
          phase: rnd(), blink: amber ? 0.9 : 0.25,
        });
      }
    }
  }
}

export function createNodes() {
  const group = new THREE.Group();
  group.name = 's05-nodes';
  const leds = [];
  const capsules = [];
  // NODE 1–4: north row west → east, then the south row
  buildRack(group, leds, capsules, 0, N.xs[0], N.rows[0], 6101, false);
  buildRack(group, leds, capsules, 1, N.xs[1], N.rows[0], 6203, true);   // NODE 2: the sidecar berth
  buildRack(group, leds, capsules, 2, N.xs[0], N.rows[1], 6307, false);
  buildRack(group, leds, capsules, 3, N.xs[1], N.rows[1], 6411, false);
  group.add(createCapsuleField(capsules));
  group.add(createLEDField(leds));
  return group;
}
