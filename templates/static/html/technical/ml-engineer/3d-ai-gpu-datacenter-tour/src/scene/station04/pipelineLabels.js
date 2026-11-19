// pipelineLabels.js — Station 04 signage (labels.js discipline:
// cheap canvas plates, disproportionately convincing). Trigger and
// build plates at the commit gantry, gate name plates hanging under
// the quality gates, repository plates over the registry shelves,
// the tag/digest discipline plates and the crossed `latest`, ring
// station markers, the deploy-gate plate, wayfinding, EXIT signs,
// and the station's thesis posted on the south wall.

import * as THREE from 'three';
import { STATION04, PALETTE } from '../../config/world.js';

const S04 = STATION04;
const R = S04.ring;

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
      g.font = '700 46px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 17);
    } else {
      g.font = '700 42px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 33px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 38);
    }
  }, px);
}

const rodMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
function hangingPlate(group, plate, x, yTop, z, rodLen) {
  plate.material.side = THREE.DoubleSide;
  plate.position.set(x, yTop - rodLen - plate.geometry.parameters.height / 2, z);
  group.add(plate);
  const ph = plate.geometry.parameters.width;
  for (const dx of [-ph / 2 + 0.05, ph / 2 - 0.05]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, rodLen, 5), rodMat);
    rod.position.set(x + dx, yTop - rodLen / 2, z);
    group.add(rod);
  }
}

// --------------------------------------------------------- trigger -----
function buildTriggerPlates(group) {
  const C = S04.commit;
  const push = simplePlate(1.3, 0.18, ['PUSH · main · c41a7e2'],
    { bg: '#14171a', ink: '#f2f3f4', px: [900, 128] });
  push.position.set(C.gantryX - 0.088, C.beamY, -0.6);
  push.rotation.y = -Math.PI / 2;                  // beam's west face, approach side
  group.add(push);
  const build = simplePlate(0.72, 0.17, ['BUILD #482'], { bg: '#14171a', ink: '#f2f3f4', px: [640, 144] });
  hangingPlate(group, build, C.gantryX, C.beamY - 0.12, -0.6, 0.14);
}

// ------------------------------------------------------------ gates ----
function buildGateNamePlates(group) {
  const names = ['GATE 1 · LINT + TESTS', 'GATE 2 · SCAN · FAIL ON CRITICAL'];
  S04.gates.xs.forEach((x, i) => {
    const plate = simplePlate(i ? 1.5 : 1.1, 0.17, [names[i]],
      { bg: '#14171a', ink: '#f2f3f4', px: [1024, 128] });
    hangingPlate(group, plate, x, S04.gates.beamY - 0.15, S04.line.z, 0.16);
  });
}

// --------------------------------------------------------- registry ----
function buildRegistryPlates(group) {
  const wallX = S04.room.widthX / 2 - 0.03;
  const runs = [
    { text: 'REGISTRY · model-server / trainer', z: -2.5 },
    { text: 'REGISTRY · feature-pipeline / lattice-serve', z: 1.9 },
  ];
  for (const run of runs) {
    const plate = simplePlate(1.35, 0.19, [run.text], { px: [1152, 144] });
    plate.position.set(wallX, 2.44, run.z);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
  }
  // tag discipline, posted on the registry's own wall
  const tag = simplePlate(0.78, 0.15, ['TAG · HUMAN POINTER · MOVABLE'], { px: [900, 144] });
  tag.position.set(wallX, 1.82, 0.48);
  tag.rotation.y = -Math.PI / 2;
  group.add(tag);
  const dig = simplePlate(0.78, 0.15, ['DIGEST · IDENTITY · PINNED'],
    { bg: '#14171a', ink: '#f2f3f4', px: [900, 144] });
  dig.position.set(wallX, 1.6, 0.48);
  dig.rotation.y = -Math.PI / 2;
  group.add(dig);
  const latest = textPlate(0.6, 0.24, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 62px "Courier New", monospace';
    g.fillText('latest', w / 2, 78);
    g.strokeStyle = '#c0272d';
    g.lineWidth = 10;
    g.beginPath(); g.moveTo(60, 62); g.lineTo(w - 60, 62); g.stroke();
    g.fillStyle = '#c0272d';
    g.font = '700 34px Arial, sans-serif';
    g.fillText('NOT IN PRODUCTION', w / 2, 138);
  }, [512, 192]);
  latest.position.set(wallX, 1.3, 0.48);
  latest.rotation.y = -Math.PI / 2;
  group.add(latest);
}

// ------------------------------------------------------------- ring ----
function buildRingPlates(group) {
  const stations = [
    ['LOADED', 322], ['SIGNED', 264], ['SBOM ATTACHED', 206],
    ['VERIFIED', 148], ['DISPATCH', 90],
  ];
  const postMat = rodMat;
  for (const [name, angle] of stations) {
    const th = (angle + 15) * Math.PI / 180;
    const x = R.x + 1.52 * Math.sin(th);
    const z = R.z + 1.52 * Math.cos(th);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), postMat);
    post.position.set(x, R.topY + 0.07, z);
    group.add(post);
    const plate = simplePlate(0.42, 0.1, [name], { bg: '#14171a', ink: '#f2f3f4', px: [640, 144] });
    plate.position.set(x, R.topY + 0.19, z);
    plate.rotation.y = th;                         // faces outward, to the hall
    group.add(plate);
  }
  const gate = simplePlate(0.98, 0.13, ['DEPLOY GATE · DIGEST PINNED · VERIFIED ONLY'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1152, 128] });
  gate.position.set(5.36, 1.9, S04.exitDoorZ);
  gate.rotation.y = -Math.PI / 2;                  // the gate beam's west face
  group.add(gate);
}

// ------------------------------------------------------- wayfinding ----
function exitSign(x, rotY, z) {
  const sign = textPlate(0.52, 0.19, (g, w, h) => {
    g.fillStyle = '#0a8a3c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('EXIT ▸', w / 2, 63);
  }, [256, 96]);
  sign.material = new THREE.MeshBasicMaterial({ map: sign.material.map });
  sign.position.set(x, 2.42, z);
  sign.rotation.y = rotY;
  return sign;
}

function buildWayfinding(group) {
  const W2 = S04.room.widthX / 2;
  const west = simplePlate(1.5, 0.2, ['← TRAINED MODELS IN · CODE VIA GIT'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1152, 144] });
  west.position.set(-W2 + 0.03, 2.66, S04.entryDoorZ);
  west.rotation.y = Math.PI / 2;
  group.add(west);
  const east = simplePlate(1.3, 0.2, ['SIGNED IMAGES → KUBERNETES'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1152, 144] });
  east.position.set(W2 - 0.03, 2.66, S04.exitDoorZ);
  east.rotation.y = -Math.PI / 2;
  group.add(east);
  group.add(exitSign(-W2 + 0.06, Math.PI / 2, S04.entryDoorZ));
  group.add(exitSign(W2 - 0.06, -Math.PI / 2, S04.exitDoorZ));

  // the station's thesis, posted on the south wall
  const thesis = simplePlate(2.9, 0.27,
    ['BUILD ONCE · SIGN THE DIGEST · DEPLOY THE SAME BYTES EVERYWHERE'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1600, 144] });
  thesis.position.set(0.1, 2.4, S04.room.depthZ / 2 - 0.03);
  thesis.rotation.y = Math.PI;
  group.add(thesis);
}

export function createPipelineLabels() {
  const group = new THREE.Group();
  group.name = 's04-labels';
  buildTriggerPlates(group);
  buildGateNamePlates(group);
  buildRegistryPlates(group);
  buildRingPlates(group);
  buildWayfinding(group);
  return group;
}
