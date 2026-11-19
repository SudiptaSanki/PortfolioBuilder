// videoWall.js — the 18-tile video wall on the north wall: alarm banner
// strip, fascia sign, centre SLD of 132/33 kV Meridian Road (the Station
// 02 yard), frequency wing with the room's ONE animated element (the
// live frequency trace), demand/mix, PMU inset, SOE list, alarm KPI and
// the N-1 / weather strip. Every value comes from STATION01.values —
// the inventory's register — so all screens agree. Zone canvases sit
// over per-tile bezel geometry, per inventory section 9.1.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';
import { makeCanvas, canvasTexture, fitFont, screenMesh, box, std } from './tex.js';

const S = STATION01;
const V = S.values;
const W = S.wall;
const BG = '#0d1420';
const INK = '#dfe8ee';
const DIM = '#8fa5b5';
const CY = '#7fe0c3';
const AMBER = '#ffb02e';
const GREEN = '#2fae5f';
const MONO = '"Courier New", monospace';

// ---------------------------------------------------------------- SLD --
function drawSLD(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.textBaseline = 'alphabetic';
  // title + heartbeat
  g.fillStyle = INK; g.textAlign = 'left';
  fitFont(g, '132/33 kV MERIDIAN ROAD SUBSTATION — SINGLE-LINE DIAGRAM', 2400, 54, '700');
  g.fillText('132/33 kV MERIDIAN ROAD SUBSTATION — SINGLE-LINE DIAGRAM', 60, 80);
  g.fillStyle = CY; g.textAlign = 'right';
  g.font = `700 44px ${MONO}`;
  g.fillText(`${V.time} IST · LAST SCAN ${V.scanS} s`, w - 60, 80);
  g.textAlign = 'left';

  const line = (x1, y1, x2, y2, col = '#e8e2d0', lw = 7) => {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  };
  const breaker = (x, y, closed = true) => {
    g.fillStyle = closed ? GREEN : BG;
    g.fillRect(x - 21, y - 21, 42, 42);
    g.strokeStyle = '#e8e2d0'; g.lineWidth = 5; g.strokeRect(x - 21, y - 21, 42, 42);
  };
  const isolator = (x, y) => { line(x, y + 26, x + 30, y - 26); line(x, y + 26, x, y + 44); };
  const arrow = (x, y) => {
    g.fillStyle = CY; g.beginPath(); g.moveTo(x, y + 16); g.lineTo(x - 12, y - 10); g.lineTo(x + 12, y - 10); g.fill();
  };
  const label = (t, x, y, col = INK, px = 40, align = 'left') => {
    g.fillStyle = col; g.textAlign = align; g.font = `700 ${px}px Arial, sans-serif`; g.fillText(t, x, y); g.textAlign = 'left';
  };
  const val = (t, x, y, col = CY, align = 'left') => {
    g.fillStyle = col; g.textAlign = align; g.font = `700 40px ${MONO}`; g.fillText(t, x, y); g.textAlign = 'left';
  };

  // buses
  const busA = 300, busB = 380, x0 = 420, x1 = 3420;
  g.fillStyle = '#e8e2d0'; g.fillRect(x0, busA - 8, x1 - x0, 16); g.fillRect(x0, busB - 8, x1 - x0, 16);
  label('132 kV BUS A', x0, busA - 26, DIM, 36);
  label('132 kV BUS B', x0, busB + 62, DIM, 36);
  val(`${V.busKV} kV`, x1, busA - 26, CY, 'right');
  // bus coupler
  line(1920, busA, 1920, busB); breaker(1920, (busA + busB) / 2);
  label('BUS COUPLER', 1960, (busA + busB) / 2 + 14, DIM, 34);

  // line bays from the top into Bus A
  const lineBay = (x, name, amps, halo) => {
    if (halo) {
      g.strokeStyle = AMBER; g.lineWidth = 7;
      g.beginPath(); g.roundRect(x - 125, 118, 250, 200, 14); g.stroke();
    }
    line(x, 128, x, busA);
    isolator(x, 205); breaker(x, 262);
    arrow(x, 168);
    label(name, x, 108, INK, 40, 'center');
    val(`${amps} A`, x + 40, 250);
  };
  lineBay(820, 'FDR-1 · FROM GRID', V.fdr1A, false);
  lineBay(1300, 'FDR-2 · FROM GRID', V.fdr2A, true);
  g.fillStyle = AMBER; g.font = '700 38px Arial, sans-serif'; g.textAlign = 'left';
  g.fillText('◂ 05:56 TRIP · AUTO-RECLOSE OK', 1470, 215);

  // transformer bays from Bus B down to the 33 kV bus
  const xfmr = (x, name, mva, tap, hot) => {
    line(x, busB, x, 470); breaker(x, 445); isolator(x, 520);
    line(x, 546, x, 566);
    g.strokeStyle = '#e8e2d0'; g.lineWidth = 7;
    g.beginPath(); g.arc(x, 640, 88, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x, 742, 88, 0, Math.PI * 2); g.stroke();
    line(x, 830, x, 878);
    label(name, x, 620, INK, 42, 'center');
    val(`${mva} MVA`, x, 690, hot ? AMBER : CY, 'center');
    val(`TAP ${tap}`, x, 800, CY, 'center');
  };
  xfmr(2380, 'T-1 · 50 MVA', V.t1MVA, V.t1Tap, false);
  xfmr(2980, 'T-2 · 50 MVA', V.t2MVA, V.t2Tap, true);
  g.fillStyle = AMBER; g.font = '700 36px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('87 % ONAF · FANS ON', 2980, 985);
  g.textAlign = 'left';

  // 33 kV bus + six outgoing feeders
  const bus33 = 892;
  g.fillStyle = '#e8e2d0'; g.fillRect(2050, bus33 - 7, 1300, 14);
  label('33 kV BUS', 2050, bus33 - 22, DIM, 36);
  for (let i = 0; i < 6; i++) {
    const x = 2140 + i * 228;
    line(x, bus33, x, 1010); breaker(x, 950);
    arrow(x, 990);
    label(`OUT-${i + 1}`, x, 1052, DIM, 32, 'center');
  }
  // legend
  g.fillStyle = DIM; g.font = '400 36px Arial, sans-serif';
  g.fillText('■ CB CLOSED    ╱ ISOLATOR OPEN    ◯◯ TRANSFORMER    ▸ FLOW', 60, 1052);
}

// ------------------------------------------------------- frequency -----
// The one animated element: the trace breathes around the register
// value; the digital readout never leaves 49.93 Hz.
const freqCanvas = document.createElement('canvas');
freqCanvas.width = 1024; freqCanvas.height = 576;
const freqTex = new THREE.CanvasTexture(freqCanvas);
freqTex.colorSpace = THREE.SRGBColorSpace; freqTex.anisotropy = 8;

function drawFreq(t) {
  const g = freqCanvas.getContext('2d');
  const w = 1024, h = 576;
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif'; g.textAlign = 'left';
  g.fillText('GRID FREQUENCY · IEGC BAND 49.90–50.05', 36, 52);
  g.fillStyle = '#ffd9a0'; g.textAlign = 'center';
  g.font = `700 150px ${MONO}`;
  g.fillText(V.freqHz.toFixed(2), w / 2 - 60, 218);
  g.font = '700 54px Arial, sans-serif'; g.fillStyle = INK;
  g.fillText('Hz', 838, 218);
  g.textAlign = 'left';
  // band strip: scale 49.70..50.30
  const sx = (f) => 56 + ((f - 49.70) / 0.60) * (w - 112);
  g.fillStyle = '#233242'; g.fillRect(56, 258, w - 112, 30);
  g.fillStyle = 'rgba(47,174,95,0.55)'; g.fillRect(sx(V.bandLo), 258, sx(V.bandHi) - sx(V.bandLo), 30);
  g.fillStyle = AMBER; g.fillRect(sx(V.freqHz) - 4, 248, 8, 50);
  g.fillStyle = DIM; g.font = '400 26px Arial, sans-serif';
  g.fillText('49.70', 56, 322); g.fillText('50.30', w - 130, 322);
  g.fillStyle = AMBER; g.fillText('UFLS STAGE-1 49.40', 150, 322);
  // 24 h trend, trace sagging to the band edge on the morning ramp
  const ty = (f) => 520 - ((f - 49.80) / 0.40) * 150;
  g.fillStyle = 'rgba(47,174,95,0.20)';
  g.fillRect(56, ty(V.bandHi), w - 112, ty(V.bandLo) - ty(V.bandHi));
  g.strokeStyle = '#31435c'; g.lineWidth = 2; g.strokeRect(56, 370, w - 112, 150);
  g.strokeStyle = '#ffd9a0'; g.lineWidth = 3.5; g.beginPath();
  for (let i = 0; i <= 96; i++) {
    const px = 56 + (i / 96) * (w - 112);
    const base = i < 62 ? 50.0 + Math.sin(i * 0.35) * 0.012
      : 50.0 - (i - 62) * 0.0021 + Math.sin(i * 0.5 + t * 0.7) * 0.004;
    const wig = i > 88 ? Math.sin(t * 2.2 + i) * 0.0035 : 0;
    const f = i === 96 ? V.freqHz : base + wig;
    const py = ty(Math.max(49.82, Math.min(50.18, f)));
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.stroke();
  g.fillStyle = DIM; g.font = '400 26px Arial, sans-serif';
  g.fillText('00:00', 56, 556); g.fillText('24 h', w - 110, 556);
  freqTex.needsUpdate = true;
}

// ------------------------------------------------------------ wings ----
function drawDemand(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('ALL-INDIA DEMAND', 40, 56);
  g.fillStyle = INK; g.font = `700 108px ${MONO}`;
  g.fillText(`${V.indiaDemandGW} GW`, 40, 168);
  g.fillStyle = AMBER; g.font = '700 40px Arial, sans-serif';
  g.fillText(`↑ RAMP +${V.rampMWmin} MW/min`, 40, 228);
  const rows = [
    ['REGIONAL DEMAND', `${V.regionDemandMW.toLocaleString('en-IN')} MW`],
    ['GENERATION', `${V.regionGenMW.toLocaleString('en-IN')} MW`],
    ['DRAWAL SCHEDULE', `${V.drawalMW.toLocaleString('en-IN')} MW`],
    ['ACE', `${V.aceMW} MW`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 330 + i * 92;
    g.fillStyle = DIM; g.font = '400 36px Arial, sans-serif'; g.fillText(k, 40, y);
    g.fillStyle = k === 'ACE' ? AMBER : CY; g.font = `700 52px ${MONO}`; g.textAlign = 'right';
    g.fillText(v, w - 40, y); g.textAlign = 'left';
  });
  g.fillStyle = DIM; g.font = '700 32px Arial, sans-serif';
  g.fillText('GENERATION MIX · 05:41', 40, 742);
  const mix = [['THERMAL', 0.62, '#c96f2e'], ['HYDRO', 0.21, '#4d7fa8'], ['NUCLEAR', 0.05, '#8d9299'], ['WIND', 0.09, '#5f8f6a'], ['SOLAR ≈ 0', 0.005, '#d9a441']];
  mix.forEach(([k, f, col], i) => {
    const y = 800 + i * 62;
    g.fillStyle = INK; g.font = '400 32px Arial, sans-serif'; g.fillText(k, 40, y + 8);
    g.fillStyle = '#233242'; g.fillRect(300, y - 18, w - 360, 30);
    g.fillStyle = col; g.fillRect(300, y - 18, (w - 360) * f, 30);
  });
  g.fillStyle = DIM; g.font = '400 30px Arial, sans-serif';
  g.fillText('SOLAR STILL ≈ 0 — PRE-SUNRISE · HYDRO + THERMAL CARRY THE RAMP', 40, 1128);
}

function drawPMU(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('URTDSM · SYNCHROPHASORS', 36, 52);
  g.fillStyle = CY; g.font = `400 30px ${MONO}`;
  g.fillText(`PMU ${V.pmuFps} fps · IEEE C37.118`, 36, 96);
  const dials = [['NORTH', -12.4], ['WEST', -4.1], ['SOUTH', 7.8]];
  dials.forEach(([k, ang], i) => {
    const cx = 190 + i * 320, cy = 320, r = 118;
    g.strokeStyle = '#31435c'; g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(cx + Math.cos(t) * (r - 14), cy + Math.sin(t) * (r - 14));
      g.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r); g.stroke();
    }
    const t = (-90 + ang) * Math.PI / 180;
    g.strokeStyle = AMBER; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * (r - 24), cy + Math.sin(t) * (r - 24)); g.stroke();
    g.fillStyle = INK; g.font = '700 32px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(k, cx, cy + r + 48);
    g.fillStyle = CY; g.font = `400 30px ${MONO}`;
    g.fillText(`δ ${ang.toFixed(1)}°`, cx, cy + r + 88);
    g.textAlign = 'left';
  });
}

function drawSOE(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('SEQUENCE OF EVENTS · 1 ms', 36, 52);
  const rows = [
    ['05:56:13.318', 'FDR-2 CB CLOSE', CY],
    ['05:56:12.905', 'RECLOSE RELAY OPERATED', INK],
    ['05:56:12.412', 'FDR-2 CB OPEN — 51N', '#ff8a7a'],
    ['05:54:02.110', 'AGC RAISE UNIT-4 +12 MW', INK],
    ['05:52:47.020', 'FREQ BELOW 49.95 — RAMP', INK],
    ['05:47:31.556', 'T-2 COOLING GROUP 2 START', INK],
    ['05:41:09.204', 'SOLAR FLEET AT ZERO OUTPUT', DIM],
    ['05:30:00.000', 'DEMAND 148.2 GW · RAMP ON', DIM],
  ];
  g.font = `400 33px ${MONO}`;
  rows.forEach(([t, ev, col], i) => {
    const y = 128 + i * 54;
    g.fillStyle = DIM; g.fillText(t, 36, y);
    g.fillStyle = col; g.fillText(ev, 330, y);
  });
}

function drawKPI(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('ALARM HEALTH · EEMUA 191', 36, 52);
  g.fillStyle = INK; g.font = `700 120px ${MONO}`;
  g.fillText(String(V.alarms24h), 36, 190);
  g.fillStyle = DIM; g.font = '400 34px Arial, sans-serif';
  g.fillText('ALARMS / 24 h  (TARGET ≈ 150)', 330, 190);
  const rows = [['STANDING ALARMS', String(V.standingAlarms)], ['FLOOD (10 min > 10)', 'NONE'], ['PRIORITY MIX L/M/H', '80 / 15 / 5 %']];
  rows.forEach(([k, v], i) => {
    const y = 300 + i * 78;
    g.fillStyle = DIM; g.font = '400 34px Arial, sans-serif'; g.fillText(k, 36, y);
    g.fillStyle = CY; g.font = `700 46px ${MONO}`; g.textAlign = 'right'; g.fillText(v, w - 36, y); g.textAlign = 'left';
  });
  g.fillStyle = '#233242'; g.fillRect(36, 520, w - 72, 22);
  g.fillStyle = GREEN; g.fillRect(36, 520, (w - 72) * 0.8, 22);
  g.fillStyle = AMBER; g.fillRect(36 + (w - 72) * 0.8, 520, (w - 72) * 0.15, 22);
  g.fillStyle = '#d63a2f'; g.fillRect(36 + (w - 72) * 0.95, 520, (w - 72) * 0.05, 22);
}

function drawN1Weather(g, w, h) {
  g.fillStyle = BG; g.fillRect(0, 0, w, h);
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('CONTINGENCY ANALYSIS · N-1', 40, 56);
  const rows = [
    ['LOSS OF 400 kV I/C-1', '96 %', AMBER],
    ['LOSS OF T-1 → T-2', '98 %', AMBER],
    ['LOSS OF FDR-1', '71 %', CY],
    ['LOSS OF BUS COUPLER', '64 %', CY],
    ['LOSS OF HYDRO UNIT-2', '58 %', CY],
  ];
  rows.forEach(([k, v, col], i) => {
    const y = 140 + i * 76;
    g.fillStyle = INK; g.font = '400 36px Arial, sans-serif'; g.fillText(k, 40, y);
    g.fillStyle = col; g.font = `700 48px ${MONO}`; g.textAlign = 'right'; g.fillText(v, w - 40, y); g.textAlign = 'left';
  });
  g.strokeStyle = '#31435c'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(40, 560); g.lineTo(w - 40, 560); g.stroke();
  g.fillStyle = DIM; g.font = '700 34px Arial, sans-serif';
  g.fillText('WEATHER · CITY', 40, 628);
  g.fillStyle = '#ffd9a0'; g.font = `700 96px ${MONO}`;
  g.fillText(`${V.cityC} °C`, 40, 736);
  g.fillStyle = INK; g.font = '400 40px Arial, sans-serif';
  g.fillText('CLEAR · WIND NE 6 km/h', 40, 806);
  g.fillStyle = AMBER;
  g.fillText(`SUNRISE ${V.sunrise}`, 40, 880);
  g.fillStyle = DIM; g.font = '400 32px Arial, sans-serif';
  g.fillText('SOLAR RAMP FOLLOWS SUNRISE — NEXT WATCH ITEM', 40, 960);
  g.fillText(`ROOM ${V.roomC} °C · ${V.roomRH} % RH`, 40, 1096);
}

function drawBanner(g, w, h) {
  g.fillStyle = '#8a5a10'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#14100a'; g.textAlign = 'left';
  const msg = '⚠ 05:56:13 · 132 kV MERIDIAN RD FDR-2 · AUTO-RECLOSE SUCCESSFUL · ACK 05:57';
  fitFont(g, msg, 3050, 62, '700', MONO);
  g.fillText(msg, 48, 86);
  g.textAlign = 'right';
  const tag = 'ALARM · HIGH · ACKNOWLEDGED';
  fitFont(g, tag, 900, 54, '700', MONO);
  g.fillText(tag, w - 48, 86);
  g.textAlign = 'left';
}

// ------------------------------------------------------------ build ----
export function createVideoWall() {
  const group = new THREE.Group();
  group.name = 's01-video-wall';

  // plinth + vent grille
  const plinth = box(11.3, W.plinthH, 0.24, std(PALETTE.darkSteel, { roughness: 0.45, metalness: 0.6 }));
  plinth.position.set(0, W.plinthH / 2, W.faceZ + 0.02);
  group.add(plinth);
  const vent = box(11.0, 0.05, 0.02, std(0x14171a, { roughness: 0.8 }));
  vent.position.set(0, 0.075, W.faceZ + 0.15);
  group.add(vent);
  // (banner + fascia mount on the wall plane at tile-face depth —
  // no header beam: it would swallow both)

  // 18 tile bodies (bezel geometry over the zone canvases)
  const tileMat = std(0x0a0c0e, { roughness: 0.5, metalness: 0.2 });
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 9; c++) {
      const t = box(W.tileW - 0.004, W.tileH - 0.004, 0.09, tileMat);
      t.position.set(W.x0 + W.tileW * (c + 0.5), W.bottomY + W.tileH * (r + 0.5), W.faceZ);
      group.add(t);
    }
  }
  const face = W.faceZ + 0.048;
  const rowY = (r) => W.bottomY + W.tileH * (r + 0.5);
  const colX = (c) => W.x0 + W.tileW * (c + 0.5);

  const sld = screenMesh(6.05, 1.364, canvasTexture(3840, 1080, drawSLD));
  sld.position.set(0, rowY(0) + W.tileH / 2, face);
  group.add(sld);

  drawFreq(0);
  const freq = screenMesh(W.tileW, W.tileH, freqTex);
  freq.position.set(colX(0), rowY(1), face);
  group.add(freq);
  // wing tile #7 ageing: a whisper brighter (overlay on PMU tile)
  const pmu = screenMesh(W.tileW, W.tileH, canvasTexture(1024, 576, drawPMU));
  pmu.position.set(colX(0), rowY(0), face);
  group.add(pmu);
  const age = new THREE.Mesh(new THREE.PlaneGeometry(W.tileW, W.tileH),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.045 }));
  age.position.set(colX(0), rowY(0), face + 0.001);
  group.add(age);

  const demand = screenMesh(W.tileW, 1.364, canvasTexture(1024, 1152, drawDemand));
  demand.position.set(colX(1), rowY(0) + W.tileH / 2, face);
  group.add(demand);

  const soe = screenMesh(W.tileW, W.tileH, canvasTexture(1024, 576, drawSOE));
  soe.position.set(colX(7), rowY(1), face);
  group.add(soe);
  const kpi = screenMesh(W.tileW, W.tileH, canvasTexture(1024, 576, drawKPI));
  kpi.position.set(colX(7), rowY(0), face);
  group.add(kpi);
  const n1 = screenMesh(W.tileW, 1.364, canvasTexture(1024, 1152, drawN1Weather));
  n1.position.set(colX(8), rowY(0) + W.tileH / 2, face);
  group.add(n1);

  // alarm banner strip, full width above the tiles
  const banner = screenMesh(10.89, W.bannerH, canvasTexture(4096, 128, drawBanner));
  banner.position.set(0, W.bannerY, face);
  group.add(banner);

  // fascia sign — backlit room identity over the wall
  const fascia = screenMesh(6.4, 0.32, canvasTexture(2048, 104, (g, w, h) => {
    g.fillStyle = '#1b1e22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8ecf0'; g.textAlign = 'center';
    const t = 'STATE LOAD DESPATCH CENTRE — CONTROL ROOM';
    fitFont(g, t, w - 80, 56, '700');
    g.fillText(t, w / 2, 70);
  }));
  fascia.position.set(0, W.fasciaY, face);
  group.add(fascia);

  group.userData.update = (t) => {
    // redraw the frequency trace at ~2 Hz; the room otherwise holds
    // its freeze-frame. Cheap guard: quantise t to 0.5 s steps.
    const q = Math.floor(t * 2);
    if (q !== group.userData._fq) { group.userData._fq = q; drawFreq(t); }
  };
  return group;
}
