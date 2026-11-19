// labels.js — signage and IDs: rack ID plates ("A03"), the hanging row sign
// ("A03 / COLD AISLE"), EXIT sign over the fire door, CDU label + flow arrows,
// fire point, and the hazard strip by the CDU pipework. Cheap planes with
// canvas text — disproportionately convincing (research: labels section).

import * as THREE from 'three';
import {
  RACK, LAYOUT, PALETTE, SURFACE,
} from '../config/world.js';
import { getCDUPosition } from './cooling.js';

function textPlate(w, h, draw, px = [256, 64]) {
  const c = document.createElement('canvas');
  c.width = px[0]; c.height = px[1];
  draw(c.getContext('2d'), px[0], px[1]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  return mesh;
}

// Rack ID plate in rack-local space (top of the mesh door).
export function addRackPlate(rackGroup, anchor) {
  const plate = textPlate(0.15, 0.038, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.font = '700 40px Arial, sans-serif';
    g.fillText(anchor.code, 12, 46);
    g.fillStyle = '#14171a';                                 // barcode block
    let x = w - 74;
    const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 2];
    for (const b of bars) { g.fillRect(x, 12, b * 2, 40); x += b * 2 + 4; }
  }, [256, 64]);
  plate.position.set(0, RACK.height - 0.14, -RACK.depth / 2 - 0.002);
  plate.rotation.y = Math.PI;
  rackGroup.add(plate);
}

function buildRowSign(group) {
  const sign = textPlate(0.62, 0.42, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#14171a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 120px Arial, sans-serif';
    g.fillText('A03', w / 2, 138);
    g.font = '700 44px Arial, sans-serif';
    g.fillText('COLD AISLE', w / 2, 208);
  }, [256, 176]);
  sign.material.side = THREE.DoubleSide;
  const x = LAYOUT.containment.endX + 0.28;
  sign.position.set(x, 2.62, 0);
  sign.rotation.y = -Math.PI / 2;   // textured face toward the cold aisle (-X)
  group.add(sign);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  for (const dz of [-0.18, 0.18]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, LAYOUT.room.height - 2.83, 5), rodMat);
    rod.position.set(x, (LAYOUT.room.height + 2.83) / 2, dz);
    group.add(rod);
  }
}

function buildExitSign(group) {
  const sign = textPlate(0.52, 0.19, (g, w, h) => {
    g.fillStyle = '#0a8a3c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('EXIT ▸', w / 2, 63);
  }, [256, 96]);
  sign.material = new THREE.MeshBasicMaterial({ map: sign.material.map });
  sign.position.set(-LAYOUT.room.widthX / 2 + 0.06, 2.42, 0);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);

  // red fire point cabinet beside the door
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.72, 0.52),
    new THREE.MeshStandardMaterial({ color: PALETTE.fireRed, roughness: 0.5 }));
  cab.position.set(-LAYOUT.room.widthX / 2 + 0.08, 1.25, 1.35);
  group.add(cab);
  const tag = textPlate(0.3, 0.12, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0272d';
    g.textAlign = 'center';
    g.font = '700 44px Arial, sans-serif';
    g.fillText('FIRE', w / 2, 56);
  }, [160, 64]);
  tag.position.set(-LAYOUT.room.widthX / 2 + 0.16, 1.32, 1.35);
  tag.rotation.y = Math.PI / 2;
  group.add(tag);
}

function buildCDULabels(group) {
  const { x, z } = getCDUPosition();
  // service face looks south (-Z) after the cabinet rotation in cooling.js
  const plate = textPlate(0.4, 0.1, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 40px Arial, sans-serif';
    g.fillText('CDU-01 · 1.3 MW', w / 2, 46);
  }, [320, 64]);
  plate.position.set(x, 1.93, z - 0.437);
  plate.rotation.y = Math.PI;
  group.add(plate);

  // flow legend sticker above the service panel
  const legend = textPlate(0.5, 0.11, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.fillStyle = '#1d6fd1';
    g.font = '700 30px Arial, sans-serif';
    g.fillText('▼ 32.4 °C', 78, 40);
    g.fillStyle = '#e8710a';
    g.fillText('▲ 41.8 °C', 210, 40);
  }, [320, 64]);
  legend.position.set(x, 1.72, z - 0.442);
  legend.rotation.y = Math.PI;
  group.add(legend);

  // yellow/black hazard strip on the floor in front of the CDU
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const g2 = c.getContext('2d');
  g2.fillStyle = '#e8c51a'; g2.fillRect(0, 0, 128, 32);
  g2.fillStyle = '#14171a';
  for (let i = -1; i < 6; i++) {
    g2.beginPath();
    g2.moveTo(i * 32, 32); g2.lineTo(i * 32 + 16, 0); g2.lineTo(i * 32 + 32, 0); g2.lineTo(i * 32 + 16, 32);
    g2.fill();
  }
  const hzTex = new THREE.CanvasTexture(c);
  hzTex.colorSpace = THREE.SRGBColorSpace;
  hzTex.wrapS = THREE.RepeatWrapping;
  hzTex.repeat.set(3, 1);
  const hz = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.28),
    new THREE.MeshStandardMaterial({ map: hzTex, roughness: 0.85 }));
  hz.rotation.x = -Math.PI / 2;
  hz.rotation.z = Math.PI / 2;
  hz.position.set(x, 0.003, z - 0.78);
  group.add(hz);
}

export function createLabels() {
  const group = new THREE.Group();
  group.name = 'labels';
  buildRowSign(group);
  buildExitSign(group);
  buildCDULabels(group);
  return group;
}
