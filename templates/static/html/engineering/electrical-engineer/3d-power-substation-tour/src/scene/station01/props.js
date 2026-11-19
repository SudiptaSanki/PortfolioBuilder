// props.js — the room's placed clutter and wall furniture: GPS clock
// pair flanking the fascia, handover whiteboard, cork notice board with
// the UFLS card, key cabinet, emergency phone panel, CO2 extinguisher,
// the tea point still-life, the line printer with its fanfold SOE
// trail, the radio charger bank and the door climate sensor.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';
import { canvasTexture, fitFont, textPlate, box, std } from './tex.js';

const S = STATION01;
const V = S.values;
const MONO = '"Courier New", monospace';

// ---------------------------------------------------------------- clocks
function drawClockFace(g, w, h) {
  g.fillStyle = '#f2f0e8'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#14171a'; g.lineWidth = 10;
  g.beginPath(); g.arc(256, 256, 244, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
    g.lineWidth = big ? 9 : 3;
    g.beginPath();
    g.moveTo(256 + Math.cos(a) * (big ? 205 : 222), 256 + Math.sin(a) * (big ? 205 : 222));
    g.lineTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232);
    g.stroke();
  }
  const hand = (ang, len, lw, col) => {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(256, 256); g.lineTo(256 + Math.cos(ang) * len, 256 + Math.sin(ang) * len); g.stroke();
  };
  // 05:58:40 — hour near 6, minute at 58, second at 40
  hand(((5 + 58 / 60) / 12) * Math.PI * 2 - Math.PI / 2, 120, 15, '#14171a');
  hand((58 / 60) * Math.PI * 2 - Math.PI / 2, 185, 10, '#14171a');
  hand((40 / 60) * Math.PI * 2 - Math.PI / 2, 205, 4, '#b03028');
  g.fillStyle = '#14171a'; g.beginPath(); g.arc(256, 256, 14, 0, Math.PI * 2); g.fill();
  g.font = '700 30px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('GPS SYNC', 256, 350);
}

function buildClocks(group) {
  const W = S.wall;
  for (const sx of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.045, 32), std(0x232629, { roughness: 0.4, metalness: 0.5 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(sx * W.clockX, W.clockY, W.faceZ + 0.1);
    group.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.198, 32),
      new THREE.MeshStandardMaterial({ map: canvasTexture(512, 512, drawClockFace), roughness: 0.4 }));
    face.position.set(sx * W.clockX, W.clockY, W.faceZ + 0.125);
    group.add(face);
  }
  // digital IST clock: high on the south wall, over the supervisor row
  // (the fascia over the video wall keeps its full width of text)
  const dig = textPlate(0.62, 0.17, (g, w, h) => {
    g.fillStyle = '#101214'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff4b3e'; g.textAlign = 'center';
    g.font = `700 92px ${MONO}`;
    g.fillText(V.time, w / 2, h / 2 + 26);
    g.fillStyle = '#8fa5b5'; g.font = '400 30px Arial, sans-serif';
    g.fillText('IST · GPS DISCIPLINED · IRIG-B / PTP', w / 2, h - 14);
  }, [640, 176]);
  dig.position.set(0.9, 2.92, S.room.southZ - 0.09);
  dig.rotation.y = Math.PI;
  group.add(dig);
}

// ------------------------------------------------------------- boards --
function buildWhiteboard(group) {
  const board = textPlate(1.8, 1.2, (g, w, h) => {
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h);
    // ghost of an erased diagram, top-right
    g.strokeStyle = 'rgba(120,130,140,0.18)'; g.lineWidth = 5;
    g.strokeRect(w - 330, 50, 260, 150);
    g.beginPath(); g.moveTo(w - 330, 125); g.lineTo(w - 70, 125); g.stroke();
    const hand = (t, x, y, col, px = 47) => {
      g.fillStyle = col; g.font = `italic 600 ${px}px "Segoe Print", "Comic Sans MS", cursive`;
      g.fillText(t, x, y);
    };
    hand('SHIFT C → A · 06:00 · GRID NORMAL (RAMP)', 46, 110, '#22262b');
    hand('FDR-2 AUTO-RECLOSE 05:56 — WATCH', 46, 240, '#b03028', 54);
    hand('NEXT 24 H', 46, 315, '#b03028', 54);
    g.strokeStyle = '#b03028'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(46, 335); g.lineTo(720, 335); g.stroke();
    g.beginPath(); g.moveTo(46, 348); g.lineTo(720, 348); g.stroke();
    hand('T-2 FANS ON · HYDRO +200 MW BY 07:00', 46, 460, '#1d4f9c');
    hand('FDR-2: line healthy — no patrol', 46, 560, '#22262b', 42);
  }, [1536, 1024]);
  board.position.set(-2.6, 1.78, S.room.southZ - 0.09);
  board.rotation.y = Math.PI;
  group.add(board);
  const tray = box(1.7, 0.03, 0.06, std(PALETTE.brushedSteel, { roughness: 0.4, metalness: 0.7 }));
  tray.position.set(-2.6, 1.15, S.room.southZ - 0.1);
  group.add(tray);
  for (const [dx, col] of [[-0.5, 0x22262b], [-0.35, 0xb03028], [-0.2, 0x1d4f9c]]) {
    const marker = box(0.015, 0.015, 0.13, std(col, { roughness: 0.5 }));
    marker.position.set(-2.6 + dx, 1.17, S.room.southZ - 0.1);
    group.add(marker);
  }
}

function buildNoticeBoard(group) {
  const board = textPlate(1.2, 0.9, (g, w, h) => {
    g.fillStyle = '#a9805a'; g.fillRect(0, 0, w, h);
    const paper = (x, y, pw, ph, title, lines, col = '#33373d') => {
      g.fillStyle = '#efece2'; g.fillRect(x, y, pw, ph);
      g.fillStyle = '#b03028'; g.beginPath(); g.arc(x + pw / 2, y + 12, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#14171a'; g.font = '700 30px Arial, sans-serif';
      g.fillText(title, x + 16, y + 52);
      g.fillStyle = col; g.font = '400 27px Arial, sans-serif';
      lines.forEach((t, i) => g.fillText(t, x + 16, y + 94 + i * 36));
    };
    paper(36, 36, 400, 300, 'DUTY ROSTER — OCT', ['A · DAY', 'B · EVENING', 'C · NIGHT']);
    paper(472, 36, 400, 300, 'UFLS STAGES (Hz)', ['STAGE 1 · 49.4', 'STAGE 2 · 49.2', 'STAGE 3 · 49.0', 'STAGE 4 · 48.8'], '#b03028');
    paper(36, 372, 400, 260, 'EMERGENCY PHONES', ['RLDC · HOTLINE', 'NLDC · 011-…', 'FIRE · 101']);
    paper(472, 372, 400, 260, 'MERIDIAN RD SLD', ['Rev 14 · faded print', '132/33 kV · 2×50 MVA'], '#5a6068');
  }, [1024, 768]);
  board.position.set(-4.75, 1.82, S.room.southZ - 0.09);
  board.rotation.y = Math.PI;
  group.add(board);
}

// ------------------------------------------------- door-side furniture -
function buildDoorSide(group) {
  const z = S.room.southZ - 0.1;
  // key cabinet: ~40 tagged keys on hooks, 3 hooks empty
  const cab = box(0.56, 0.74, 0.09, std(0x707880, { roughness: 0.5, metalness: 0.6 }));
  cab.position.set(2.82, 1.52, z);
  group.add(cab);
  const keyFace = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.68),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(512, 700, (g, w, h) => {
        g.fillStyle = '#565d64'; g.fillRect(0, 0, w, h);
        let n = 0;
        for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
          const x = 48 + c * 62, y = 60 + r * 100;
          g.fillStyle = '#2b2f34'; g.fillRect(x - 4, y - 4, 8, 8);
          if ((r * 7 + c) % 14 === 5) continue;   // signed out
          n++;
          g.strokeStyle = '#c9ccd0'; g.lineWidth = 4;
          g.beginPath(); g.arc(x, y + 16, 9, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.moveTo(x, y + 25); g.lineTo(x, y + 48); g.stroke();
          g.fillStyle = ['#d9a441', '#e8e6df', '#b03028'][n % 3];
          g.fillRect(x + 8, y + 22, 22, 15);
        }
        g.fillStyle = '#e8e6df'; g.font = '700 30px Arial, sans-serif'; g.textAlign = 'center';
        g.fillText('SUBSTATION KEYS', w / 2, 34);
      }), roughness: 0.6,
    }));
  keyFace.rotation.y = Math.PI;
  keyFace.position.set(2.82, 1.52, z - 0.048);
  group.add(keyFace);
  // emergency phone panel: red hotline + black PSTN, crooked Dymo labels
  const panel = box(0.5, 0.62, 0.07, std(0xd8d2c2, { roughness: 0.6 }));
  panel.position.set(3.5, 1.5, z);
  group.add(panel);
  for (const [dy, col, lab] of [[0.14, S.tones.hotlineRed, 'RLDC HOTLINE'], [-0.16, 0x17191c, 'PSTN']]) {
    const handset = box(0.07, 0.26, 0.06, std(col, { roughness: 0.4 }));
    handset.position.set(3.38, 1.5 + dy, z - 0.06);
    group.add(handset);
    const tape = textPlate(0.24, 0.045, (g, w, h) => {
      g.fillStyle = '#2b2f34'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8e6df'; g.textAlign = 'center';
      fitFont(g, lab, w - 12, 34, '700', MONO);
      g.fillText(lab, w / 2, h / 2 + 12);
    }, [256, 48]);
    tape.position.set(3.58, 1.5 + dy + 0.02, z - 0.045);
    tape.rotation.y = Math.PI;
    tape.rotation.z = dy > 0 ? 0.03 : -0.02;
    group.add(tape);
  }
  // CO2 extinguisher (black body) with last month's inspection tag
  const ext = new THREE.Group();
  const bodyE = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 16), std(0x1c1e20, { roughness: 0.4, metalness: 0.4 }));
  bodyE.position.y = 0.28;
  ext.add(bodyE);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.16, 10), std(0x1c1e20, { roughness: 0.5 }));
  horn.position.set(0.06, 0.58, 0);
  horn.rotation.z = -0.5;
  ext.add(horn);
  const tag = textPlate(0.07, 0.1, (g, w, h) => {
    g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b03028'; g.font = '700 26px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('CO₂', w / 2, 36);
    g.fillStyle = '#33373d'; g.font = '400 21px Arial, sans-serif';
    g.fillText('INSP', w / 2, 66); g.fillText('SEP 2026', w / 2, 90);
  }, [96, 128]);
  tag.position.set(0, 0.42, 0.08);
  ext.add(tag);
  ext.position.set(2.62, 0, S.room.southZ - 0.28);
  group.add(ext);
  // climate sensor by the door
  const sensor = textPlate(0.2, 0.11, (g, w, h) => {
    g.fillStyle = '#101214'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7fe0c3'; g.textAlign = 'center';
    g.font = `700 44px ${MONO}`;
    g.fillText(`${V.roomC}°C`, w / 2, 52);
    g.font = '400 30px Arial, sans-serif'; g.fillStyle = '#8fa5b5';
    g.fillText(`${V.roomRH} % RH`, w / 2, 92);
  }, [256, 144]);
  sensor.position.set(2.82, 2.14, z);
  sensor.rotation.y = Math.PI;
  group.add(sensor);
  // radio charger bank: 4 handsets, one slot empty
  const bank = box(0.52, 0.16, 0.18, std(0x2b2f34, { roughness: 0.55 }));
  bank.position.set(4.35, 1.06, z);
  group.add(bank);
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue;
    const hs = box(0.07, 0.2, 0.05, std(0x17191c, { roughness: 0.5 }));
    hs.position.set(4.16 + i * 0.13, 1.2, z);
    group.add(hs);
    const ant = box(0.012, 0.12, 0.012, std(0x17191c, { roughness: 0.5 }));
    ant.position.set(4.14 + i * 0.13, 1.35, z);
    group.add(ant);
  }
  const bankShelf = box(0.6, 0.03, 0.24, std(0x9aa0a3, { roughness: 0.45, metalness: 0.7 }));
  bankShelf.position.set(4.35, 0.97, z);
  group.add(bankShelf);
}

// ------------------------------------------------------------ tea point -
function buildTeaPoint(group) {
  const cab = box(1.1, 0.9, 0.55, std(0x707880, { roughness: 0.55, metalness: 0.4 }));
  cab.position.set(5.55, 0.45, S.room.southZ - 0.32);
  group.add(cab);
  const top = box(1.14, 0.03, 0.59, std(0xd8d2c2, { roughness: 0.5 }));
  top.position.set(5.55, 0.915, S.room.southZ - 0.32);
  group.add(top);
  const steel = std(0xb9bfc4, { roughness: 0.28, metalness: 0.9 });
  const kettle = new THREE.Group();
  const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.2, 18), steel);
  kBody.position.y = 0.1;
  kettle.add(kBody);
  const spout = box(0.09, 0.025, 0.025, steel);
  spout.position.set(0.11, 0.14, 0);
  spout.rotation.z = 0.5;
  kettle.add(spout);
  const kHandle = box(0.02, 0.09, 0.03, std(0x17191c, { roughness: 0.6 }));
  kHandle.position.set(-0.1, 0.15, 0);
  kettle.add(kHandle);
  kettle.position.set(5.25, 0.93, S.room.southZ - 0.35);
  group.add(kettle);
  const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 14), steel);
  flask.position.set(5.5, 1.08, S.room.southZ - 0.42);
  group.add(flask);
  // four mugs, one chipped (a notch of darker ceramic), one utility blue
  const mugCols = [0xe8e6df, 0xe8e6df, 0x33566e, 0xd8d2c2];
  mugCols.forEach((col, i) => {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 14), std(col, { roughness: 0.35 }));
    mug.position.set(5.72 + (i % 2) * 0.13, 0.975, S.room.southZ - 0.42 + Math.floor(i / 2) * 0.13);
    group.add(mug);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 14), std(col, { roughness: 0.35 }));
    handle.position.set(mug.position.x + 0.045, 0.975, mug.position.z);
    group.add(handle);
  });
  // biscuit tin, lid ajar
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 18), std(0xa83c32, { roughness: 0.4, metalness: 0.5 }));
  tin.position.set(5.95, 0.99, S.room.southZ - 0.25);
  group.add(tin);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.02, 18), std(0xa83c32, { roughness: 0.4, metalness: 0.5 }));
  lid.position.set(5.99, 1.06, S.room.southZ - 0.22);
  lid.rotation.z = 0.28;
  group.add(lid);
}

// ------------------------------------------------------------- printer --
function buildPrinter(group) {
  const pr = new THREE.Group();
  const stand = box(0.66, 0.7, 0.5, std(0x707880, { roughness: 0.55, metalness: 0.4 }));
  stand.position.y = 0.35;
  pr.add(stand);
  const bodyP = box(0.6, 0.25, 0.45, std(0xd8d2c2, { roughness: 0.55 }));
  bodyP.position.y = 0.825;
  bodyP.castShadow = true;
  pr.add(bodyP);
  const slot = box(0.5, 0.02, 0.06, std(0x17191c, { roughness: 0.6 }));
  slot.position.set(0, 0.96, -0.05);
  pr.add(slot);
  const led = box(0.014, 0.014, 0.006, new THREE.MeshBasicMaterial({ color: PALETTE.ledGreen }));
  led.position.set(0.24, 0.88, 0.228);
  pr.add(led);
  // fanfold stack behind, printed trail forward into a wire tray
  const stackP = box(0.42, 0.16, 0.3, std(0xe8e6df, { roughness: 0.9 }));
  stackP.position.set(0, 0.78, -0.42);
  pr.add(stackP);
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.85),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(512, 1024, (g, w, h) => {
        g.fillStyle = '#eceade'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#2b2f34'; g.font = `400 25px ${MONO}`;
        const lines = [
          '05:56:13.318 FDR-2 CB CLOSE',
          '05:56:12.905 RECLOSE OPERATED',
          '05:56:12.412 FDR-2 CB OPEN 51N',
          '05:54:02.110 AGC RAISE U4 +12',
          '05:52:47.020 FREQ < 49.95',
          '05:47:31.556 T-2 COOL G2 START',
          '05:41:09.204 SOLAR AT ZERO',
          '05:30:00.000 DEMAND 148.2 GW',
        ];
        lines.forEach((t, i) => g.fillText(t, 18, 120 + i * 62));
        for (let y = 60; y < h; y += 124) { g.fillStyle = 'rgba(90,95,100,0.35)'; g.fillRect(0, y, w, 3); g.fillStyle = '#2b2f34'; }
      }), roughness: 0.9, side: THREE.DoubleSide,
    }));
  trail.rotation.x = -0.5;
  trail.position.set(0, 0.72, 0.5);
  pr.add(trail);
  const tray = box(0.46, 0.03, 0.4, std(0x4c5157, { roughness: 0.5, metalness: 0.6 }));
  tray.position.set(0, 0.32, 0.62);
  pr.add(tray);
  pr.position.set(-6.05, 0, 3.35);
  pr.rotation.y = Math.PI / 2 - 0.15;
  group.add(pr);
}

export function createProps() {
  const group = new THREE.Group();
  group.name = 's01-props';
  buildClocks(group);
  buildWhiteboard(group);
  buildNoticeBoard(group);
  buildDoorSide(group);
  buildTeaPoint(group);
  buildPrinter(group);
  // hand-sanitiser bottle by the door
  const san = box(0.07, 0.2, 0.07, std(0xdde4e6, { roughness: 0.4 }));
  san.position.set(0.82, 1.25, S.room.southZ - 0.12);
  group.add(san);
  return group;
}
