// supervisor.js — the raised rear row: platform (+150 mm) with steps
// and handrail at the east end, the supervisor's desk looking over the
// operators to the wall, the master shift register, and the magnetic
// shift board on the south wall. Hierarchy you can read from the floor.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';
import { canvasTexture, fitFont, screenMesh, textPlate, box, std } from './tex.js';

const S = STATION01;
const V = S.values;
const BG = '#0d1420';
const INK = '#dfe8ee';
const DIM = '#8fa5b5';
const CY = '#7fe0c3';
const AMBER = '#ffb02e';
const MONO = '"Courier New", monospace';

function drawEMS(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 26px Arial, sans-serif';
  g.fillText('EMS STATUS · AGC / STATE ESTIMATOR / CA', 28, 40);
  const rows = [
    ['AGC', 'AUTO · RAISE', `ACE ${V.aceMW} MW`, AMBER],
    ['AGC CYCLE', `${V.agcCycleS} s`, '6 UNITS ON REG', CY],
    ['STATE ESTIMATOR', 'SOLVED 05:57', 'RESIDUAL 0.4 %', CY],
    ['CONTINGENCY ANALYSIS', 'RUNNING', 'WORST 96 %', AMBER],
    ['ALARM PROCESSOR', 'NORMAL', `${V.alarms24h} / 24 h`, CY],
    ['HISTORIAN', 'ARCHIVING', 'LAG 4 s', CY],
  ];
  rows.forEach(([a, b, c, col], i) => {
    const y = 104 + i * 72;
    g.fillStyle = INK; g.font = '700 27px Arial, sans-serif'; g.fillText(a, 28, y);
    g.fillStyle = col; g.font = `400 27px ${MONO}`; g.fillText(b, 380, y);
    g.fillStyle = DIM; g.fillText(c, 700, y);
  });
}

function drawRepeater(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 26px Arial, sans-serif';
  g.fillText('WALL OVERVIEW · REPEATER', 28, 40);
  g.fillStyle = '#ffd9a0'; g.font = `700 120px ${MONO}`; g.textAlign = 'center';
  g.fillText(V.freqHz.toFixed(2), w / 2, 190);
  g.fillStyle = INK; g.font = '700 34px Arial, sans-serif';
  g.fillText('Hz · ALL-INDIA GRID', w / 2, 246);
  g.fillStyle = CY; g.font = `400 30px ${MONO}`;
  g.fillText(`DEMAND ${V.indiaDemandGW} GW ↑`, w / 2, 330);
  g.fillStyle = AMBER;
  g.fillText('NEXT: 06:00 HANDOVER', w / 2, 390);
  g.fillStyle = DIM; g.font = '400 28px Arial, sans-serif';
  g.fillText('SHIFT C → SHIFT A · GRID NORMAL (RAMP)', w / 2, 470);
  g.textAlign = 'left';
}

export function createSupervisor() {
  const group = new THREE.Group();
  group.name = 's01-supervisor';
  const SV = S.supervisor;
  const platW = 4.2;
  const platMat = std(0x8f8a7f, { roughness: 0.9 });

  // platform + nosing + steps (east end) + handrail
  const plat = box(platW, SV.platTopY, SV.platZ1 - SV.platZ0, platMat);
  plat.position.set(0, SV.platTopY / 2, (SV.platZ0 + SV.platZ1) / 2);
  plat.receiveShadow = true;
  group.add(plat);
  const nosing = box(platW, 0.02, 0.03, std(PALETTE.safetyYellow, { roughness: 0.6 }));
  nosing.position.set(0, SV.platTopY - 0.01, SV.platZ0 + 0.015);
  group.add(nosing);
  const step1 = box(0.62, 0.075, 0.3, platMat);
  step1.position.set(platW / 2 + 0.31, 0.0375, SV.platZ0 + 0.62);
  group.add(step1);
  const step2 = box(0.62, 0.15, 0.3, platMat);
  step2.position.set(platW / 2 + 0.31, 0.075, SV.platZ0 + 0.33);
  group.add(step2);
  const railMat = std(PALETTE.brushedSteel, { roughness: 0.35, metalness: 0.8 });
  for (const px of [platW / 2 + 0.06, platW / 2 + 0.56]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 8), railMat);
    post.position.set(px, SV.platTopY + 0.42, SV.platZ0 + 0.42);
    group.add(post);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.72, 8), railMat);
  rail.rotation.z = Math.PI / 2 - 0.18;
  rail.position.set(platW / 2 + 0.31, SV.platTopY + 0.82, SV.platZ0 + 0.42);
  group.add(rail);

  // supervisor desk on the platform, facing the wall
  const desk = new THREE.Group();
  const top = box(SV.deskW, 0.025, 0.9, std(S.tones.deskTop, { roughness: 0.6, metalness: 0.15 }));
  top.position.y = 0.7075;
  top.castShadow = true;
  desk.add(top);
  for (const sx of [-1, 1]) {
    const leg = box(0.06, 0.7, 0.5, std(0x9aa0a3, { roughness: 0.45, metalness: 0.7 }));
    leg.position.set(sx * (SV.deskW / 2 - 0.09), 0.35, 0.05);
    desk.add(leg);
  }
  const monData = [
    { tex: canvasTexture(1024, 576, drawEMS), x: -0.52, ry: 0.18 },
    { tex: canvasTexture(1024, 576, drawRepeater), x: 0.52, ry: -0.18 },
  ];
  for (const m of monData) {
    const body = box(0.615, 0.365, 0.045, std(0x17191c, { roughness: 0.55 }));
    body.position.set(m.x, 1.04, -0.28);
    body.rotation.y = m.ry;
    desk.add(body);
    const scr = screenMesh(0.598, 0.348, m.tex);
    scr.position.set(m.x + Math.sin(m.ry) * 0.024, 1.04, -0.28 + Math.cos(m.ry) * 0.024);
    scr.rotation.y = m.ry;
    desk.add(scr);
  }
  // master shift register + tabbed handover file
  const reg = box(0.34, 0.09, 0.46, std(0x5a2e2e, { roughness: 0.65 }));
  reg.position.set(-0.72, 0.765, 0.22);
  reg.rotation.y = 0.1;
  desk.add(reg);
  const file = box(0.32, 0.06, 0.44, std(0x31435c, { roughness: 0.6 }));
  file.position.set(0.68, 0.75, 0.24);
  file.rotation.y = -0.14;
  desk.add(file);
  for (let i = 0; i < 4; i++) {
    const tab = box(0.05, 0.012, 0.03, std([0xb03028, 0xd9a441, 0x2fae5f, 0x4d7fa8][i], { roughness: 0.6 }));
    tab.position.set(0.68 - 0.1 + i * 0.06, 0.783, 0.03);
    tab.rotation.y = -0.14;
    desk.add(tab);
  }
  const kb = box(0.45, 0.02, 0.16, std(0x17191c, { roughness: 0.55 }));
  kb.position.set(0, 0.732, 0.14);
  desk.add(kb);
  desk.position.set(0, SV.platTopY, SV.deskZ);
  group.add(desk);

  // supervisor chair (behind desk, on the platform)
  const chairSeat = box(0.5, 0.07, 0.48, std(0x33373d, { roughness: 1.0 }));
  chairSeat.position.set(0.2, SV.platTopY + 0.5, SV.deskZ + 0.85);
  group.add(chairSeat);
  const chairBack = box(0.48, 0.7, 0.08, std(0x33373d, { roughness: 1.0 }));
  chairBack.position.set(0.2, SV.platTopY + 0.94, SV.deskZ + 1.08);
  chairBack.rotation.x = 0.1;
  group.add(chairBack);

  // the day engineer's shoulder bag, dropped on the platform
  const bag = box(0.42, 0.3, 0.16, std(0x54443a, { roughness: 0.9 }));
  bag.position.set(-1.55, SV.platTopY + 0.15, SV.deskZ + 0.5);
  bag.rotation.y = 0.4;
  bag.castShadow = true;
  group.add(bag);
  const strap = box(0.5, 0.02, 0.05, std(0x3e332a, { roughness: 0.9 }));
  strap.position.set(-1.3, SV.platTopY + 0.012, SV.deskZ + 0.62);
  strap.rotation.y = 0.9;
  group.add(strap);

  // magnetic shift board on the south wall
  const board = textPlate(1.5, 0.85, (g, w, h) => {
    g.fillStyle = '#3f464d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8ecf0'; g.font = '700 44px Arial, sans-serif';
    g.fillText('SHIFT ROSTER', 36, 60);
    const teams = [['A', 'DAY 06:00–14:00', '#d9a441'], ['B', 'EVENING 14:00–22:00', '#8fa5b5'], ['C', 'NIGHT 22:00–06:00 · ON DUTY', '#2fae5f']];
    teams.forEach(([t, when, col], i) => {
      const y = 130 + i * 92;
      g.fillStyle = '#e8e6df'; g.fillRect(36, y - 40, 74, 56);
      g.fillStyle = '#14171a'; g.textAlign = 'center';
      fitFont(g, t, 60, 44, '700');
      g.fillText(t, 73, y + 2);
      g.textAlign = 'left';
      g.fillStyle = col; g.font = '400 38px Arial, sans-serif';
      g.fillText(when, 140, y);
    });
    g.fillStyle = '#ffb02e'; g.font = '700 40px Arial, sans-serif';
    g.fillText('SHIFT C ON DUTY → SHIFT A FROM 06:00', 36, h - 36);
  }, [1024, 580]);
  board.position.set(4.35, 2.0, S.room.southZ - 0.075);
  board.rotation.y = Math.PI;
  group.add(board);

  return group;
}
