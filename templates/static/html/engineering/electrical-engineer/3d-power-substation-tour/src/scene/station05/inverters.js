// inverters.js — Sungrow SG3125HV-MV-30 central inverter stations
// (inventory §4.4): a 20-ft container 6058 × 2896 × 2438 mm holding
// inverter + MV transformer + switchgear, 3125 kVA at 50 °C. Seven
// in the plant's story, two modelled in the block roads. Louvred
// ventilation banks are the dominant texture; the transformer end
// carries a real fin stack. Each station gets its 33 kV RMU kiosk
// (§4.8) — the collection network's local switch.

import * as THREE from 'three';
import { STATION05, PALETTE } from '../../config/world.js';
import { MAT, box, canvasTexture, plateLines } from './kit.js';

const S05 = STATION05;

function louvreTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = '#d7d5cf'; g.fillRect(0, 0, w, h);
    // two louvre banks with panel seams between
    for (const bx of [40, 356, 672]) {
      g.fillStyle = '#c4c2bb'; g.fillRect(bx, 60, 300, h - 120);
      g.fillStyle = '#8f8d86';
      for (let y = 74; y < h - 70; y += 13) g.fillRect(bx + 8, y, 284, 5);
      g.strokeStyle = '#a9a7a0'; g.lineWidth = 3; g.strokeRect(bx, 60, 300, h - 120);
    }
    // door seams + hinges on the right section
    g.strokeStyle = '#a9a7a0'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w - 60, 30); g.lineTo(w - 60, h - 30); g.stroke();
  });
}

function buildInverterStation() {
  const g = new THREE.Group();
  const D = S05.inverterDims; // [length, height, depth]
  // concrete plinth, 150 mm proud, gravel surround
  const plinth = box(D[0] + 0.8, 0.15, D[2] + 0.8, MAT.concrete, 0, 0.075, 0);
  plinth.receiveShadow = true;
  g.add(plinth);
  const gravel = box(D[0] + 2.6, 0.06, D[2] + 2.6, MAT.gravel, 0, 0.03, 0);
  gravel.receiveShadow = true;
  g.add(gravel);

  const bodyMat = new THREE.MeshStandardMaterial({ map: louvreTexture(), roughness: 0.55, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(D[0], D[1], D[2]), bodyMat);
  body.position.y = 0.15 + D[1] / 2;
  body.castShadow = true;
  g.add(body);
  // plain roof + end caps in body colour (texture only reads on sides)
  g.add(box(D[0] + 0.06, 0.08, D[2] + 0.06, new THREE.MeshStandardMaterial({ color: 0xd7d5cf, roughness: 0.6 }), 0, 0.15 + D[1] + 0.04, 0));

  // transformer radiator fin stack at the east end
  for (let i = 0; i < 7; i++) {
    g.add(box(0.08, 1.9, 0.24, MAT.darkSteel, D[0] / 2 + 0.22, 1.35, -0.85 + i * 0.29));
  }
  g.add(box(0.3, 2.1, 2.1, MAT.darkSteel, D[0] / 2 + 0.12, 1.35, 0));

  // HMI window + status LEDs on the south face
  g.add(box(0.5, 0.38, 0.03, new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.25 }), -D[0] / 2 + 0.8, 1.75, D[2] / 2 + 0.01));
  const ledG = new THREE.MeshStandardMaterial({ color: 0x0d3319, emissive: PALETTE.ledGreen, emissiveIntensity: 2.0 });
  const ledA = new THREE.MeshStandardMaterial({ color: 0x33230d, emissive: PALETTE.ledAmber, emissiveIntensity: 0.7 });
  g.add(box(0.07, 0.07, 0.03, ledG, -D[0] / 2 + 1.25, 1.78, D[2] / 2 + 0.01));
  g.add(box(0.07, 0.07, 0.03, ledA, -D[0] / 2 + 1.42, 1.78, D[2] / 2 + 0.01));

  // cable entry pit in front + striped step edge
  g.add(box(2.6, 0.1, 0.7, MAT.concreteDark, -1.2, 0.05, D[2] / 2 + 0.75));
  const stripe = canvasTexture(128, 16, (g2, w, h) => {
    for (let x = 0; x < w; x += 16) { g2.fillStyle = (x / 16) % 2 ? '#14171a' : '#e3a008'; g2.fillRect(x, 0, 16, h); }
  });
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.4),
    new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }));
  step.position.set(-D[0] / 2 + 0.8, 0.18, D[2] / 2 + 0.45);
  g.add(step);

  // rating plate (numbers from the inventory register)
  const plate = plateLines(1.7, 0.42, [
    { text: 'SG3125HV-MV · 3125 kVA', size: 62 },
    { text: '1500 V DC · 0.6/33 kV · Dy11', size: 52, weight: 400 },
  ], { px: [1024, 256] });
  plate.position.set(0.6, 2.2, D[2] / 2 + 0.02);
  g.add(plate);

  // 33 kV RMU kiosk beside the station
  const rmu = new THREE.Group();
  rmu.add(box(1.6, 0.12, 1.1, MAT.concrete, 0, 0.06, 0));
  const rk = box(1.5, 1.6, 1.0, MAT.galvanised, 0, 0.92, 0);
  rk.castShadow = true;
  rmu.add(rk);
  rmu.add(box(0.55, 0.9, 0.03, MAT.darkSteel, -0.35, 0.95, 0.51));
  rmu.add(box(0.55, 0.9, 0.03, MAT.darkSteel, 0.35, 0.95, 0.51));
  rmu.position.set(-D[0] / 2 - 0.4, 0, D[2] / 2 + 1.6);
  g.add(rmu);

  return g;
}

export function createInverters() {
  const group = new THREE.Group();
  group.name = 's05-inverters';
  for (const inv of S05.inverters) {
    const s = buildInverterStation();
    s.position.set(inv.x, 0, inv.z);
    s.rotation.y = Math.PI / 2; // long axis along the block road
    group.add(s);
  }
  return group;
}
