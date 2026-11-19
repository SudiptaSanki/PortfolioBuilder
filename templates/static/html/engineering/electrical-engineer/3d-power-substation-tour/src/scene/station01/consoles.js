// consoles.js — the four operator consoles in their shallow arc, each
// with three 27" screens (unique canvas content per role and desk),
// chair, phones, and the placed-not-scattered clutter of the inventory's
// human-traces checklist. Desk 2 is the story desk: red hotline handset
// off its cradle, log book open at the 05:56 entry, task light on.

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

// ------------------------------------------------------- desk screens --
function drawOverview(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 26px Arial, sans-serif';
  g.fillText('REGIONAL NETWORK · 400/220 kV OVERVIEW', 28, 40);
  g.strokeStyle = '#e8e2d0'; g.lineWidth = 5;
  const bus = (y, x0, x1) => { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); };
  bus(150, 120, 900); bus(300, 120, 900); bus(450, 200, 820);
  g.fillStyle = DIM; g.font = '400 24px Arial, sans-serif';
  g.fillText('400 kV', 30, 158); g.fillText('220 kV', 30, 308); g.fillText('132 kV', 110, 458);
  g.fillStyle = '#2fae5f';
  for (const [x, y] of [[250, 150], [480, 150], [700, 300], [380, 450], [620, 450]]) g.fillRect(x - 10, y - 10, 20, 20);
  g.strokeStyle = '#7d8894'; g.lineWidth = 3;
  for (const [x1, y1, x2, y2] of [[250, 160, 250, 290], [480, 160, 480, 290], [700, 310, 620, 440], [380, 310, 380, 440]]) {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  g.fillStyle = CY; g.font = `400 24px ${MONO}`;
  g.fillText('MERIDIAN RD ▸', 640, 500);
  g.fillStyle = AMBER; g.strokeStyle = AMBER; g.lineWidth = 3;
  g.beginPath(); g.roundRect(560, 420, 200, 60, 8); g.stroke();
}

function drawDeskSLD(g, w, h, dialog) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = INK; g.font = '700 28px Arial, sans-serif';
  g.fillText('MERIDIAN ROAD 132/33 kV — WORKING DISPLAY', 28, 42);
  g.strokeStyle = '#e8e2d0'; g.lineWidth = 7;
  g.beginPath(); g.moveTo(80, 150); g.lineTo(944, 150); g.stroke();
  g.beginPath(); g.moveTo(80, 205); g.lineTo(944, 205); g.stroke();
  g.fillStyle = DIM; g.font = '400 22px Arial, sans-serif';
  g.fillText('BUS A', 80, 138); g.fillText('BUS B', 80, 240);
  const bay = (x, name, valTxt, halo) => {
    if (halo) { g.strokeStyle = AMBER; g.lineWidth = 4; g.beginPath(); g.roundRect(x - 70, 60, 140, 160, 8); g.stroke(); }
    g.strokeStyle = '#e8e2d0'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 150); g.stroke();
    g.fillStyle = '#2fae5f'; g.fillRect(x - 12, 108, 24, 24);
    g.fillStyle = INK; g.font = '700 24px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(name, x, 56);
    g.fillStyle = CY; g.font = `400 23px ${MONO}`;
    g.fillText(valTxt, x, 268);
    g.textAlign = 'left';
  };
  bay(300, 'FDR-1', `${V.fdr1A} A`, false);
  bay(470, 'FDR-2', `${V.fdr2A} A`, true);
  // transformers
  for (const [x, name, mva, tap] of [[660, 'T-1', V.t1MVA, V.t1Tap], [850, 'T-2', V.t2MVA, V.t2Tap]]) {
    g.strokeStyle = '#e8e2d0'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x, 205); g.lineTo(x, 300); g.stroke();
    g.beginPath(); g.arc(x, 345, 42, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x, 395, 42, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x, 437); g.lineTo(x, 480); g.stroke();
    g.fillStyle = INK; g.font = '700 24px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(name, x, 330);
    g.fillStyle = name === 'T-2' ? AMBER : CY; g.font = `400 23px ${MONO}`;
    g.fillText(`${mva} MVA · TAP ${tap}`, x, 512);
    g.textAlign = 'left';
  }
  g.fillStyle = CY; g.font = `400 23px ${MONO}`;
  g.fillText(`BUS ${V.busKV} kV`, 80, 512);
  if (dialog) {
    g.fillStyle = 'rgba(16,24,36,0.97)'; g.fillRect(252, 150, 520, 240);
    g.strokeStyle = AMBER; g.lineWidth = 3; g.strokeRect(252, 150, 520, 240);
    g.fillStyle = AMBER; g.font = '700 26px Arial, sans-serif';
    g.fillText('CONTROL — SELECT BEFORE OPERATE', 276, 196);
    g.fillStyle = INK; g.font = '400 25px Arial, sans-serif';
    g.fillText('DEVICE: FDR-2 CB · ACTION: OPEN', 276, 244);
    g.fillText('STEP 1 OF 2 — SELECTED 05:58:02', 276, 284);
    for (const [label, x, col] of [['CONFIRM', 276, '#2fae5f'], ['CANCEL', 500, '#5a6068']]) {
      g.fillStyle = col; g.fillRect(x, 312, 180, 52);
      g.fillStyle = '#0d1420'; g.font = '700 24px Arial, sans-serif'; g.textAlign = 'center';
      g.fillText(label, x + 90, 346); g.textAlign = 'left';
    }
  }
}

function drawTrends(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 26px Arial, sans-serif';
  g.fillText('TRENDS · SINCE MIDNIGHT (HISTORIAN)', 28, 40);
  const plot = (y0, y1, label, unit) => {
    g.strokeStyle = '#31435c'; g.lineWidth = 2; g.strokeRect(90, y0, 880, y1 - y0);
    g.fillStyle = DIM; g.font = '400 22px Arial, sans-serif';
    g.fillText(label, 28, y0 + 26); g.fillText(unit, 28, y0 + 52);
  };
  plot(70, 240, 'FREQ', 'Hz');
  g.fillStyle = 'rgba(47,174,95,0.25)'; g.fillRect(90, 118, 880, 52);
  g.strokeStyle = '#ffd9a0'; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 88; i++) {
    const x = 90 + (i / 88) * 880;
    const f = i < 55 ? 0.45 + Math.sin(i * 0.3) * 0.05 : 0.45 - (i - 55) * 0.011;
    const y = 240 - Math.max(0.05, Math.min(0.95, f)) * 170;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  plot(300, 470, 'T-2 LOAD', 'MVA');
  g.strokeStyle = CY; g.beginPath();
  for (let i = 0; i <= 88; i++) {
    const x = 90 + (i / 88) * 880;
    const load = 18 + i * 0.29 + Math.sin(i * 0.2) * 1.2;
    const y = 470 - (load / 50) * 170;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  g.fillStyle = AMBER; g.font = `400 23px ${MONO}`;
  g.fillText(`${V.t2MVA} MVA`, 900, 470 - (V.t2MVA / 50) * 170 - 8);
  // FDR-2 current notch at 05:56 (x near right edge)
  g.strokeStyle = '#ff8a7a'; g.lineWidth = 2.5; g.beginPath();
  g.moveTo(90, 530); g.lineTo(880, 530); g.lineTo(892, 552); g.lineTo(904, 530); g.lineTo(970, 530); g.stroke();
  g.fillStyle = DIM; g.font = '400 22px Arial, sans-serif';
  g.fillText('FDR-2 CURRENT — 05:56 NOTCH ▸', 560, 556);
  g.fillText('00:00', 90, 500); g.fillText('06:00', 920, 500);
}

function drawAlarmScreen(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = AMBER; g.font = '700 24px Arial, sans-serif';
  g.fillText('ALARM LIST · UNACK 1', 20, 36);
  g.font = `400 22px ${MONO}`;
  const rows = [
    ['05:56', 'FDR-2 RECLOSE OK', AMBER], ['05:47', 'T-2 COOLING G2 RUN', INK],
    ['05:52', 'FREQ < 49.95', INK], ['04:58', 'UPS-B ON FLOAT', DIM],
    ['03:12', 'RTU-7 SCAN SLOW', DIM],
  ];
  rows.forEach(([t, ev, col], i) => {
    g.fillStyle = DIM; g.fillText(t, 20, 84 + i * 44);
    g.fillStyle = col; g.fillText(ev, 110, 84 + i * 44);
  });
}

function drawLogPage(g, w, h) {
  g.fillStyle = '#e9e4d4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(90,110,160,0.5)'; g.lineWidth = 2;
  for (let y = 90; y < h - 40; y += 46) { g.beginPath(); g.moveTo(40, y); g.lineTo(w - 40, y); g.stroke(); }
  g.strokeStyle = 'rgba(200,80,80,0.5)';
  g.beginPath(); g.moveTo(90, 30); g.lineTo(90, h - 30); g.stroke();
  g.fillStyle = '#2c3e70'; g.font = 'italic 400 34px "Segoe Print", "Comic Sans MS", cursive';
  const lines = [
    '05:12  Night round — all bays normal.',
    '05:41  Solar nil. Hydro on schedule.',
    '05:56  FDR-2 trip / reclose —',
    '        informed RLDC. Line healthy.',
    '05:58  T-2 43.6 MVA, fans on. Watch.',
  ];
  lines.forEach((t, i) => g.fillText(t, 110, 128 + i * 46));
  g.fillStyle = '#5a6068'; g.font = '700 26px Arial, sans-serif';
  g.fillText('SHIFT LOG — DESK 2 · NIGHT (C)', 40, 52);
}

// ------------------------------------------------------------ parts ----
const topMat = std(S.tones.deskTop, { roughness: 0.6, metalness: 0.15 });
const frameMat = std(0x9aa0a3, { roughness: 0.45, metalness: 0.7 });
const blackMat = std(0x17191c, { roughness: 0.55, metalness: 0.2 });
const redMat = std(S.tones.hotlineRed, { roughness: 0.35, metalness: 0.05 });

function monitor(tex, small = false) {
  const grp = new THREE.Group();
  const bw = small ? 0.42 : 0.615, bh = small ? 0.27 : 0.365;
  const body = box(bw, bh, 0.045, blackMat);
  body.castShadow = true;
  grp.add(body);
  const scr = screenMesh(bw - 0.017, bh - 0.017, tex);
  scr.position.z = 0.024;
  grp.add(scr);
  const neck = box(0.05, 0.09, 0.04, blackMat);
  neck.position.set(0, -bh / 2 - 0.03, -0.01);
  grp.add(neck);
  return grp;
}

function phone(mat, label) {
  const grp = new THREE.Group();
  const base = box(0.21, 0.05, 0.26, mat);
  base.position.y = 0.025;
  grp.add(base);
  const handset = box(0.05, 0.045, 0.24, mat);
  handset.position.set(-0.075, 0.065, 0);
  grp.add(handset);
  if (label) {
    const tag = textPlate(0.11, 0.028, (g, w, h) => {
      g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#14171a'; g.textAlign = 'center';
      fitFont(g, label, w - 10, 30, '700', '"Courier New", monospace');
      g.fillText(label, w / 2, h / 2 + 10);
    }, [256, 64]);
    tag.rotation.x = -Math.PI / 2 + 0.35;
    tag.position.set(0.03, 0.055, 0);
    grp.add(tag);
  }
  return grp;
}

function coiledCord(x0, y0, z0, x1, y1, z1, coils, mat) {
  const pts = [];
  const N = coils * 10;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * coils * Math.PI * 2;
    const r = 0.016;
    pts.push(new THREE.Vector3(
      x0 + (x1 - x0) * t + Math.cos(a) * r * (1 - Math.abs(t - 0.5)),
      y0 + (y1 - y0) * t + Math.sin(a) * r * (1 - Math.abs(t - 0.5)) - Math.sin(t * Math.PI) * 0.05,
      z0 + (z1 - z0) * t));
  }
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, 0.0035, 5), mat);
  return tube;
}

function chair(fabric, { jacket = false, headrest = false } = {}) {
  const grp = new THREE.Group();
  const fab = std(fabric, { roughness: 1.0, metalness: 0, emissive: 0x1e2229 });
  const seat = box(0.48, 0.07, 0.47, fab);
  seat.position.y = 0.5;
  seat.castShadow = true;
  grp.add(seat);
  const back = box(0.47, 0.68, 0.08, fab);
  back.position.set(0, 0.92, 0.245);
  back.rotation.x = 0.1;
  back.castShadow = true;
  grp.add(back);
  if (headrest) {
    const hr = box(0.26, 0.13, 0.06, fab);
    hr.position.set(0, 1.33, 0.27);
    hr.rotation.x = 0.1;
    grp.add(hr);
  }
  for (const sx of [-1, 1]) {
    const post = box(0.04, 0.16, 0.04, blackMat);
    post.position.set(sx * 0.27, 0.6, 0.02);
    grp.add(post);
    const arm = box(0.06, 0.03, 0.3, blackMat);
    arm.position.set(sx * 0.27, 0.69, 0.02);
    grp.add(arm);
  }
  const stem = box(0.05, 0.42, 0.05, frameMat);
  stem.position.y = 0.25;
  grp.add(stem);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = box(0.3, 0.025, 0.045, blackMat);
    spoke.position.set(Math.cos(a) * 0.16, 0.035, Math.sin(a) * 0.16);
    spoke.rotation.y = -a;
    grp.add(spoke);
  }
  if (jacket) {
    const jmat = std(0x39505a, { roughness: 1.0 });
    const jback = box(0.5, 0.52, 0.1, jmat);
    jback.position.set(0, 1.06, 0.26);
    jback.rotation.x = 0.1;
    grp.add(jback);
    const jfront = box(0.46, 0.4, 0.03, jmat);
    jfront.position.set(0, 0.98, 0.175);
    jfront.rotation.x = 0.06;
    grp.add(jfront);
    for (const sx of [-1, 1]) {
      const sleeve = box(0.09, 0.34, 0.09, jmat);
      sleeve.position.set(sx * 0.28, 0.92, 0.24);
      grp.add(sleeve);
    }
  }
  return grp;
}

// -------------------------------------------------------------- desk ---
function buildDesk(idx) {
  const grp = new THREE.Group();
  const C = S.consoles;
  // worktop with waterfall front edge (thin curved strip approximated)
  const top = box(C.w, 0.025, C.d, topMat);
  top.position.y = C.topY - 0.0125;
  top.castShadow = true;
  grp.add(top);
  const lip = box(C.w, 0.05, 0.03, topMat);
  lip.position.set(0, C.topY - 0.045, -C.d / 2 + 0.015);
  grp.add(lip);
  // C-legs + cable trough + modesty panel
  for (const sx of [-1, 1]) {
    const leg = box(0.06, C.topY - 0.03, 0.5, frameMat);
    leg.position.set(sx * (C.w / 2 - 0.09), (C.topY - 0.03) / 2, 0.05);
    grp.add(leg);
  }
  const trough = box(C.w - 0.3, 0.13, 0.15, blackMat);
  trough.position.set(0, C.topY - 0.12, 0.3);
  grp.add(trough);
  const modesty = box(C.w - 0.24, 0.42, 0.02, std(0x2b2f34, { roughness: 0.6, metalness: 0.4 }));
  modesty.position.set(0, C.topY - 0.28, -0.18);
  grp.add(modesty);
  // height-adjust paddle under the right front edge
  const paddle = box(0.05, 0.015, 0.09, blackMat);
  paddle.position.set(0.55, C.topY - 0.035, -0.38);
  grp.add(paddle);
  // CPU cabinet + footrest
  const cpu = box(0.24, 0.5, 0.55, std(0x3a3f45, { roughness: 0.55, metalness: 0.4 }));
  cpu.position.set(-0.68, 0.25, 0.08);
  grp.add(cpu);
  const cpuLed = box(0.012, 0.012, 0.005, new THREE.MeshBasicMaterial({ color: PALETTE.ledGreen }));
  cpuLed.position.set(-0.60, 0.44, -0.2);
  grp.add(cpuLed);
  const foot = box(0.5, 0.025, 0.025, frameMat);
  foot.position.set(0, 0.12, 0.28);
  grp.add(foot);

  // monitor rail + three screens (unique content per role); screen
  // tops land at ~1.15 m per the inventory (centre y 0.97 + 0.18)
  const rail = box(1.5, 0.04, 0.04, blackMat);
  rail.position.set(0, 0.8, -0.3);
  grp.add(rail);
  const texL = canvasTexture(1024, 576, drawOverview);
  const texC = canvasTexture(1024, 576, (g, w, h) => drawDeskSLD(g, w, h, idx === 1));
  const texR = canvasTexture(1024, 576, drawTrends);
  const mons = [
    { tex: texL, x: -0.58, z: -0.24, ry: 0.35 },
    { tex: texC, x: 0, z: -0.31, ry: 0 },
    { tex: texR, x: 0.58, z: -0.24, ry: -0.35 },
  ];
  for (const m of mons) {
    const mon = monitor(m.tex);
    mon.position.set(m.x, 0.97, m.z);
    mon.rotation.y = m.ry;
    grp.add(mon);
  }
  if (idx === 3) {  // desk 4's fourth screen: the alarm list
    const extra = monitor(canvasTexture(512, 320, drawAlarmScreen), true);
    extra.position.set(0.86, 0.93, 0.05);
    extra.rotation.y = -0.6;
    grp.add(extra);
  }
  if (idx === 0) {  // the room's one sticky note
    const note = textPlate(0.07, 0.07, (g, w, h) => {
      g.fillStyle = '#f2d06b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#33302a'; g.textAlign = 'center';
      g.font = '400 30px "Segoe Print", cursive';
      g.fillText('Hydro desk', w / 2, 44); g.fillText('ext. 214', w / 2, 82);
    }, [128, 128]);
    note.position.set(-0.337, 0.84, -0.30);
    note.rotation.y = 0.35;
    grp.add(note);
  }

  // keyboard, mouse / trackball
  const kb = box(0.45, 0.02, 0.16, blackMat);
  kb.position.set(-0.05, C.topY + 0.012, 0.12);
  kb.rotation.y = idx === 2 ? 0.06 : -0.03;
  grp.add(kb);
  if (idx === 0) {
    const tb = box(0.11, 0.03, 0.14, blackMat);
    tb.position.set(0.32, C.topY + 0.015, 0.12);
    grp.add(tb);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), std(0x6e2a2a, { roughness: 0.3 }));
    ball.position.set(0.32, C.topY + 0.038, 0.12);
    grp.add(ball);
  } else {
    const mouse = box(0.06, 0.025, 0.1, blackMat);
    mouse.position.set(0.32, C.topY + 0.013, 0.12);
    grp.add(mouse);
  }

  // phones: black desk phone every desk; red hotline shared by desks 2-3
  const bp = phone(blackMat);
  bp.position.set(0.72, C.topY, 0.18);
  bp.rotation.y = -0.25;
  grp.add(bp);
  if (idx === 1 || idx === 2) {
    const shelf = box(0.34, 0.03, 0.3, frameMat);
    shelf.position.set(-0.78, C.topY - 0.02, 0.22);
    grp.add(shelf);
    const rp = phone(redMat, 'RLDC HOTLINE');
    rp.position.set(-0.78, C.topY - 0.005, 0.22);
    rp.rotation.y = 0.3;
    if (idx === 1) {
      // handset off the cradle, resting on the desk; cord stretched
      rp.children[1].position.set(0.34, -0.028, 0.3);
      rp.children[1].rotation.z = 0.25;
      grp.add(coiledCord(-0.82, C.topY + 0.03, 0.3, -0.44, C.topY + 0.02, 0.5, 7, redMat));
    } else {
      grp.add(coiledCord(-0.84, C.topY + 0.02, 0.3, -0.9, C.topY - 0.35, 0.42, 10, redMat));
    }
    grp.add(rp);
  }

  // task lights on desks 2 and 3; only desk 2's is on
  if (idx === 1 || idx === 2) {
    const armMat = blackMat;
    const armBase = box(0.07, 0.03, 0.07, armMat);
    armBase.position.set(-0.35, C.topY + 0.015, -0.05);
    grp.add(armBase);
    const arm = box(0.02, 0.3, 0.02, armMat);
    arm.position.set(-0.35, C.topY + 0.17, -0.05);
    arm.rotation.z = 0.5;
    grp.add(arm);
    const head = box(0.13, 0.03, 0.06, armMat);
    head.position.set(-0.27, C.topY + 0.32, -0.03);
    head.rotation.z = -0.4;
    grp.add(head);
    if (idx === 1) {
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.045),
        new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
      glow.rotation.x = Math.PI / 2 - 0.4;
      glow.position.set(-0.27, C.topY + 0.305, -0.03);
      grp.add(glow);
    }
  }

  // clutter set, varied per desk
  const penCup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.09, 12), std(0x5a6068, { roughness: 0.5, metalness: 0.5 }));
  penCup.position.set(0.45, C.topY + 0.045, -0.12);
  grp.add(penCup);
  for (let i = 0; i < 3; i++) {
    const pen = box(0.006, 0.13, 0.006, std(i === 0 ? 0xb03028 : 0x22262b, { roughness: 0.4 }));
    pen.position.set(0.44 + i * 0.012, C.topY + 0.1, -0.12);
    pen.rotation.z = 0.15 - i * 0.1;
    grp.add(pen);
  }
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 14), std(0x8b939c, { roughness: 0.3, metalness: 0.85 }));
  bottle.position.set(-0.5, C.topY + 0.12, -0.15);
  grp.add(bottle);

  if (idx === 1) {
    // THE open log book, 05:56 entry in blue ink, pen in the spine fold
    const book = new THREE.Group();
    const cover = box(0.62, 0.015, 0.44, std(0x4a3b30, { roughness: 0.7 }));
    book.add(cover);
    for (const sx of [-1, 1]) {
      const page = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.42),
        new THREE.MeshStandardMaterial({ map: canvasTexture(512, 720, drawLogPage), roughness: 0.9 }));
      page.rotation.x = -Math.PI / 2;
      page.rotation.z = sx * 0.04;
      page.position.set(sx * 0.152, 0.012, 0);
      book.add(page);
    }
    const penInFold = box(0.008, 0.008, 0.15, std(0x1d3fbf, { roughness: 0.4 }));
    penInFold.position.set(0, 0.02, 0.05);
    book.add(penInFold);
    book.position.set(0.08, C.topY + 0.008, 0.3);
    book.rotation.y = -0.12;
    grp.add(book);
  } else {
    const book = box(0.3, 0.045, 0.42, std(idx === 2 ? 0x31435c : 0x4a3b30, { roughness: 0.7 }));
    book.position.set(0.1, C.topY + 0.023, 0.3);
    book.rotation.y = idx === 0 ? 0.2 : -0.08;
    grp.add(book);
  }
  if (idx === 0) {  // desk calendar, open at October
    const cal = textPlate(0.13, 0.17, (g, w, h) => {
      g.fillStyle = '#efe9da'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b03028'; g.textAlign = 'center';
      g.font = '700 44px Arial, sans-serif'; g.fillText('OCTOBER', w / 2, 52);
      g.fillStyle = '#33373d'; g.font = '400 30px "Courier New", monospace';
      for (let r = 0; r < 4; r++) g.fillText('·  ·  ·  ·  ·  ·  ·', w / 2, 108 + r * 38);
    }, [256, 340]);
    cal.position.set(-0.72, C.topY + 0.085, -0.05);
    cal.rotation.x = -0.18;
    grp.add(cal);
  }
  if (idx === 2) {  // spectacles case + morning peak checklist clipboard
    const spec = box(0.16, 0.035, 0.06, std(0x2c2f33, { roughness: 0.6 }));
    spec.position.set(0.5, C.topY + 0.018, 0.3);
    spec.rotation.y = 0.4;
    grp.add(spec);
    const clip = box(0.24, 0.008, 0.32, std(0x8a6f4d, { roughness: 0.7 }));
    clip.position.set(-0.45, C.topY + 0.006, 0.28);
    clip.rotation.y = 0.15;
    grp.add(clip);
    const sheet = textPlate(0.22, 0.3, (g, w, h) => {
      g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#14171a'; g.font = '700 30px Arial, sans-serif';
      g.fillText('MORNING PEAK', 18, 42); g.fillText('CHECKLIST', 18, 76);
      g.font = '400 26px Arial, sans-serif'; g.fillStyle = '#33373d';
      ['☑ Freq watch', '☑ T-2 fans', '☐ Hydro +200', '☐ Handover log'].forEach((t, i) => g.fillText(t, 18, 128 + i * 40));
    }, [256, 340]);
    sheet.rotation.x = -Math.PI / 2;
    sheet.rotation.z = 0.15;
    sheet.position.set(-0.45, C.topY + 0.012, 0.28);
    grp.add(sheet);
  }
  if (idx === 3) {  // tiffin box on desk 4
    const tiffin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.11, 16), std(0xb9bfc4, { roughness: 0.3, metalness: 0.85 }));
    tiffin.position.set(-0.55, C.topY + 0.055, 0.25);
    grp.add(tiffin);
  }

  // chair — desk 3 (idx 2) carries the jacket; desk 4 (idx 3) is the
  // faded blue one, rotated 30 degrees and pushed back
  // (the chair model faces -z as built: back at +z, operator side -z)
  const ch = chair(idx === 3 ? 0x5a6d8c : 0x59616b, { jacket: idx === 2, headrest: idx < 2 });
  if (idx === 3) {
    ch.position.set(0.15, 0, 1.15);
    ch.rotation.y = 0.52;
  } else if (idx === 2) {
    ch.position.set(-0.1, 0, 0.82);
    ch.rotation.y = -0.15;
  } else {
    ch.position.set(idx === 1 ? 0.05 : -0.05, 0, 0.8);
    ch.rotation.y = idx === 1 ? 0.05 : -0.08;
  }
  grp.add(ch);
  return grp;
}

export function createConsoles() {
  const group = new THREE.Group();
  group.name = 's01-consoles';
  const C = S.consoles;
  C.deskXs.forEach((x, i) => {
    const desk = buildDesk(i);
    desk.position.set(x, 0, C.deskZ);
    const sgn = i < 2 ? -1 : 1;
    desk.rotation.y = sgn * THREE.MathUtils.degToRad(C.arcDeg[i]);
    group.add(desk);
  });
  // floor grommets under each desk (cables land here, never drape)
  const gromMat = std(0x2b2f34, { roughness: 0.7 });
  for (const x of C.deskXs) {
    for (const dz of [-0.25, 0.35]) {
      const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 16), gromMat);
      gr.position.set(x, 0.004, C.deskZ + dz);
      group.add(gr);
    }
  }
  return group;
}
