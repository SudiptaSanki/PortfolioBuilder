// mimicPanel.js — the heritage object on the east wall: a 3.6 x 1.8 m
// mosaic-tile mimic of the 132 kV network (24 mm Mauell-type tiles,
// drawn as one high-res canvas), half its LEDs dark since the video
// wall arrived, one tile missing at the lower-left, and a strip of
// chunky selector switches on engraved traffolyte below.

import * as THREE from 'three';
import { STATION01 } from '../../config/world.js';
import { canvasTexture, fitFont, box, std } from './tex.js';

const S = STATION01;
const M = S.mimic;

function drawMimic(g, w, h) {
  // tile field: muted grey-green tiles with per-tile tone variation
  const tw = w / 150, th = h / 75;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 150; i++) {
    for (let j = 0; j < 75; j++) {
      const v = (rnd() - 0.5) * 14;
      g.fillStyle = `rgb(${106 + v},${116 + v},${104 + v})`;
      g.fillRect(i * tw, j * th, tw - 1.5, th - 1.5);
    }
  }
  // grubby bottom rows at hand height
  g.fillStyle = 'rgba(70,58,40,0.16)';
  g.fillRect(0, h - th * 6, w, th * 6);
  // the 132 kV network in tile symbols
  g.strokeStyle = '#e8e6df'; g.lineWidth = 9;
  const bus = (y) => { g.beginPath(); g.moveTo(500, y); g.lineTo(3600, y); g.stroke(); };
  bus(560); bus(700);
  g.fillStyle = '#e8e6df'; g.font = '700 62px Arial, sans-serif';
  g.fillText('132 kV', 130, 640);
  const bay = (x, closed) => {
    g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 560); g.stroke();
    g.fillStyle = closed ? '#2fae5f' : '#3a3f45';
    g.fillRect(x - 30, 420, 60, 60);
    g.strokeStyle = '#e8e6df'; g.lineWidth = 7; g.strokeRect(x - 30, 420, 60, 60);
    g.beginPath(); g.moveTo(x, 700); g.lineTo(x, 980); g.stroke();
    g.beginPath(); g.arc(x, 1090, 105, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x, 1270, 105, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x, 1375); g.lineTo(x, 1560); g.stroke();
  };
  bay(1050, true); bay(1750, true); bay(2450, true); bay(3150, false);
  g.beginPath(); g.moveTo(500, 1700); g.lineTo(3600, 1700); g.stroke();
  g.fillStyle = '#e8e6df'; g.fillText('33 kV', 130, 1740);
  // LED indicators: a living half and a dark half (decommissioned)
  let n = 0;
  for (let i = 0; i < 46; i++) {
    const x = 620 + (i % 23) * 128, y = 380 + Math.floor(i / 23) * 1180;
    const live = i % 5 !== 3 && i % 7 !== 2;
    g.fillStyle = !live ? '#3d443e' : (n++ % 4 === 0 ? '#d63a2f' : '#39d353');
    g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.arc(x, y, 19, 0, Math.PI * 2); g.stroke();
  }
  // the missing tile, lower-left quadrant: dark socket, grid behind
  g.fillStyle = '#20241f';
  g.fillRect(9 * tw, 58 * th, tw * 2 - 1.5, th * 2 - 1.5);
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3;
  g.strokeRect(9 * tw, 58 * th, tw * 2 - 1.5, th * 2 - 1.5);
  g.fillStyle = 'rgba(232,230,223,0.75)'; g.font = '400 44px Arial, sans-serif';
  g.fillText('MERIDIAN ROAD — MOSAIC MIMIC · 1987', 500, 1960);
}

export function createMimicPanel() {
  const group = new THREE.Group();
  group.name = 's01-mimic';
  const frameMat = std(0x4a4d4a, { roughness: 0.5, metalness: 0.5 });
  const backing = box(0.06, M.h + 0.1, M.w + 0.1, frameMat);
  backing.position.set(M.x + 0.04, M.centreY, M.centreZ);
  group.add(backing);
  const tex = canvasTexture(4096, 2048, drawMimic);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(M.w, M.h),
    new THREE.MeshBasicMaterial({ map: tex, color: 0xd8d8d8 }));
  panel.rotation.y = -Math.PI / 2;
  panel.position.set(M.x - 0.015, M.centreY, M.centreZ);
  group.add(panel);

  // selector switch strip below: 5 chunky rotaries, traffolyte labels
  const strip = box(0.09, 0.16, 2.6, std(0x2b2f34, { roughness: 0.5, metalness: 0.4 }));
  strip.position.set(M.x - 0.03, M.stripY, M.centreZ);
  group.add(strip);
  const labels = ['MERIDIAN RD BUS COUPLER', 'T-1 SELECT', 'T-2 SELECT', 'FDR-1 SELECT', 'FDR-2 SELECT'];
  labels.forEach((t, i) => {
    const z = M.centreZ - 1.04 + i * 0.52;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.05, 12), std(0x17191c, { roughness: 0.45 }));
    knob.rotation.z = Math.PI / 2;
    knob.position.set(M.x - 0.1, M.stripY + 0.02, z);
    group.add(knob);
    const pointer = box(0.012, 0.05, 0.008, std(0xe8e6df, { roughness: 0.5 }));
    pointer.position.set(M.x - 0.128, M.stripY + 0.045, z);
    pointer.rotation.x = i * 0.5 - 0.5;
    group.add(pointer);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.055),
      new THREE.MeshStandardMaterial({
        map: canvasTexture(512, 72, (g, w, h) => {
          g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#14171a'; g.textAlign = 'center';
          fitFont(g, t, w - 16, 36, '700', '"Courier New", monospace');
          g.fillText(t, w / 2, h / 2 + 13);
        }), roughness: 0.6,
      }));
    lab.rotation.y = -Math.PI / 2;
    lab.position.set(M.x - 0.078, M.stripY - 0.055, z);
    group.add(lab);
  });
  return group;
}
