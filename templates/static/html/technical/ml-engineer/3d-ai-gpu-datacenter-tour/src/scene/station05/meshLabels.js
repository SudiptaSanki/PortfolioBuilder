// meshLabels.js — Station 05 signage (labels.js discipline: cheap
// canvas plates, disproportionately convincing). The dais rail
// plates (quorum, scale honesty), the gate's step plate, the lane
// head tags, the switchboard's NOT READY tag, wayfinding and EXIT
// signs. Furniture faces carry their own lettering in their own
// modules; this is the hall's shared voice.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';

const S05 = STATION05;

function textPlate(w, h, draw, px = [512, 128]) {
  const c = document.createElement('canvas');
  c.width = px[0]; c.height = px[1];
  draw(c.getContext('2d'), px[0], px[1]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

function simplePlate(w, h, lines, { bg = '#f2f3f4', ink = '#14171a', px = [512, 128] } = {}) {
  return textPlate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.fillStyle = ink;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = '700 50px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 18);
    } else {
      g.font = '700 44px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 2);
      g.font = '400 33px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 42);
    }
  }, px);
}

// ------------------------------------------------------------- dais -----
function buildDaisPlates(group) {
  const head = simplePlate(1.7, 0.24, ['CONTROL PLANE'], { bg: '#14171a', ink: '#f2f3f4', px: [960, 128] });
  head.position.set(-3.7, 2.92, -S05.room.depthZ / 2 + 0.03);
  group.add(head);
  // the quorum plate rides the dais rail, facing the floor it governs
  const railZ = S05.dais.z + S05.dais.depth / 2 - 0.03;
  const quorum = simplePlate(1.42, 0.17, ['ETCD ×3 · QUORUM 2 OF 3 · TOLERATES 1 FAILURE'], { px: [1280, 128] });
  quorum.position.set(-4.35, 1.02, railZ);
  group.add(quorum);
  // the scale-honesty plate is the platform's fascia board
  const scale = simplePlate(1.9, 0.26,
    ['ONE DEPLOYMENT AT TEACHING SCALE', '4 NODES SHOWN — PRODUCTION RUNS HUNDREDS'],
    { px: [1400, 192] });
  scale.position.set(-3.55, 0.24, S05.dais.z + S05.dais.depth / 2 + 0.002);
  group.add(scale);
}

// --------------------------------------------------------- gate + lanes --
function buildGatePlates(group) {
  const gate = simplePlate(1.34, 0.24,
    ['TRAFFIC SPLIT · SETWEIGHT STEPS', 'REAL STEPS ARE MINUTES APART · METRIC-GATED'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1024, 160] });
  // Mounted flush on the tray drop column's west face (column face
  // at tray.southX − 0.065): the column stands dead-centre in the
  // plate's span and runs floor → tray, so a beam-mounted plate
  // behind it was cut through the middle from every western view.
  // On the column face — the post as signpost — the full text reads
  // unobstructed from the gate and overview poses.
  // Fix loop 3: the plate moves WITH its column, which shifted
  // from z 1.95 (where it interpenetrated the canary drum) to
  // z 1.35, beside the gate's north post — same west-face mount,
  // still centred on the column, its south edge at z 2.02 still
  // reaching the gate's centre line.
  gate.position.set(S05.tray.southX - 0.067, 1.68, 1.35);
  gate.rotation.y = -Math.PI / 2;
  group.add(gate);
  // lane head tags, on posts at the outer side of each lane head
  const postMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  const heads = [
    { text: 'v1 · STABLE', z: 1.14, bg: '#9fa6ad', ink: '#14171a' },
    { text: 'v2 · CANARY', z: 2.86, bg: '#c9a24d', ink: '#14171a' },
  ];
  for (const hd of heads) {
    const plate = simplePlate(0.52, 0.15, [hd.text], { bg: hd.bg, ink: hd.ink, px: [640, 128] });
    plate.position.set(S05.lanes.x0 - 0.14, 0.52, hd.z);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.46, 6), postMat);
    post.position.set(S05.lanes.x0 - 0.14, 0.23, hd.z);
    group.add(post);
  }
}

// ---------------------------------------------------------- switchboard --
function buildSwitchboardPlates(group) {
  const tag = simplePlate(0.36, 0.1, ['NOT READY — NO ENDPOINT'], { ink: '#c0272d', px: [640, 128] });
  // Fix loop 2: the tag hung at panel centre height (y 1.5),
  // directly on the model-api-canary row's ClusterIP line. The
  // face has no free slot near the empty socket (3.64, rowY(0)
  // 1.714) — rows, socket rims and the x 4.01 cord rises crowd
  // every on-face spot — so the tag now hangs below the panel
  // on the socket's own x: clear of the frame (0.03 m), of the
  // nearest row text (metrics, 0.147 m) and of every cord
  // (≥ 0.26 m), still in the switchboard pose's frame.
  tag.position.set(3.64, 0.82, -3.325);
  group.add(tag);
}

// ------------------------------------------------------------ wayfinding --
function buildWayfinding(group) {
  const W = S05.room.widthX / 2;
  const west = simplePlate(1.35, 0.2, ['← BUILT IMAGES IN · CI/CD'], { px: [960, 128] });
  west.position.set(-W + 0.03, 2.52, S05.dock.entryDoorZ);
  west.rotation.y = Math.PI / 2;
  group.add(west);
  const east = simplePlate(1.6, 0.2, ['METRICS · TRACES → OBSERVABILITY'], { px: [1152, 128] });
  east.position.set(W - 0.03, 2.56, S05.exit.doorZ);
  east.rotation.y = -Math.PI / 2;
  group.add(east);
  for (const [sx, sz, rotY] of [[-W + 0.03, S05.dock.entryDoorZ, Math.PI / 2], [W - 0.03, S05.exit.doorZ, -Math.PI / 2]]) {
    const exit = textPlate(0.5, 0.15, (g, w, h) => {
      g.fillStyle = '#0a8a3c'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff'; g.textAlign = 'center';
      g.font = '700 64px Arial, sans-serif';
      g.fillText('EXIT', w / 2, h / 2 + 23);
    }, [512, 144]);
    exit.position.set(sx, 2.4, sz);
    exit.rotation.y = rotY;
    group.add(exit);
  }
}

export function createMeshLabels() {
  const group = new THREE.Group();
  group.name = 's05-labels';
  buildDaisPlates(group);
  buildGatePlates(group);
  buildSwitchboardPlates(group);
  buildWayfinding(group);
  return group;
}
