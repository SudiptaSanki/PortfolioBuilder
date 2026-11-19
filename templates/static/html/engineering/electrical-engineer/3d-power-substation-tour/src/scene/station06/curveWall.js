// curveWall.js — the finale's hero display (inventory §4.8): the
// city's day drawn on the corner building's flank — the single graph
// every previous station exists to serve. The demand polyline is the
// inventory's hourly table verbatim (it sums to exactly 11,004 MWh;
// load factor 0.75); the dashed net-demand line dips through the
// solar hours and necks up to meet demand at 19:00; the NOW needle
// stands at 20:15, ON the 612 MW peak, pulsing amber: you are here,
// at the top of the curve. The wall is a physical object — framed,
// glassy, spilling amber onto the footpath — not a HUD.

import * as THREE from 'three';
import { STATION06 } from '../../config/world.js';
import { box, mat, canvasTexture, lightPool, lampGlow, fitFont } from './helpers.js';

const S06 = STATION06;
const W = S06.curveWall;
const P06 = S06.palette;

// plot geometry on the canvas (2048 × 896 px = 8 m × 3.5 m @ 256 px/m)
const PX = { left: 150, right: 1330, top: 92, bottom: 782, maxMW: 700 };
const hourX = (h) => PX.left + (h / 24) * (PX.right - PX.left);
const mwY = (mw) => PX.bottom - (mw / PX.maxMW) * (PX.bottom - PX.top);

function drawWall(g, cw, ch) {
  // panel ground + frame line
  g.fillStyle = '#1c2733'; g.fillRect(0, 0, cw, ch);
  g.strokeStyle = 'rgba(190,205,220,0.4)'; g.lineWidth = 3;
  g.strokeRect(10, 10, cw - 20, ch - 20);

  // header: name + abstract municipal roundel. The subtitle is
  // placed from the title's MEASURED width (SCAFFOLD rule 1) — at
  // 44px bold the title runs ≈490px, so the old fixed x=470 let the
  // two strings collide into one run-on line.
  g.fillStyle = '#e8eef4'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = '700 44px Arial, sans-serif';
  g.fillText('CITY GRID CONTROL', 48, 52);
  const titleW = g.measureText('CITY GRID CONTROL').width;
  g.font = '400 30px Arial, sans-serif'; g.fillStyle = '#8fa2b5';
  g.fillText('DISTRIBUTION LOAD — TODAY', 48 + titleW + 26, 54);
  g.beginPath(); g.arc(1962, 52, 30, 0, Math.PI * 2);
  g.strokeStyle = '#ffb35c'; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(1962, 52, 17, 0, Math.PI * 2);
  g.fillStyle = '#ffb35c'; g.fill();

  // grid + axis labels
  g.textAlign = 'right';
  for (const mw of [200, 400, 600]) {
    g.strokeStyle = 'rgba(160,180,200,0.18)'; g.lineWidth = 1.5;
    g.setLineDash([6, 8]);
    g.beginPath(); g.moveTo(PX.left, mwY(mw)); g.lineTo(PX.right, mwY(mw)); g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#8fa2b5'; g.font = '400 27px Arial, sans-serif';
    g.fillText(`${mw}`, PX.left - 14, mwY(mw));
  }
  g.fillStyle = '#8fa2b5'; g.font = '400 27px Arial, sans-serif';
  g.fillText('MW', PX.left - 14, mwY(660));
  g.textAlign = 'center';
  for (const h of [0, 4, 8, 12, 16, 20]) {
    g.fillText(`${String(h).padStart(2, '0')}:00`, hourX(h), PX.bottom + 34);
  }
  g.fillText('24:00', PX.right, PX.bottom + 34);

  const D = S06.demandMW;
  const pts = D.map((mw, h) => [hourX(h), mwY(mw)]);
  const tracePath = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      g.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  };

  // area fill: deep amber gradient under the demand curve
  tracePath();
  g.lineTo(PX.right, PX.bottom); g.lineTo(PX.left, PX.bottom); g.closePath();
  const grad = g.createLinearGradient(0, PX.top, 0, PX.bottom);
  grad.addColorStop(0, 'rgba(255,179,92,0.42)');
  grad.addColorStop(1, 'rgba(255,179,92,0.05)');
  g.fillStyle = grad; g.fill();

  // net demand (dashed): demand − solar − wind; the duck's belly
  const net = D.map((mw, h) => Math.max(120, mw - S06.solarMW[h] - S06.windMW));
  g.beginPath();
  net.forEach((mw, h) => {
    const x = hourX(h), y = mwY(mw);
    if (h === 0) g.moveTo(x, y); else g.lineTo(x, y);
  });
  g.strokeStyle = '#9fb6c9'; g.lineWidth = 3; g.setLineDash([10, 8]); g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#9fb6c9'; g.font = '600 27px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('NET DEMAND', hourX(6.4), mwY(net[6]) - 26);
  g.fillText('SOLAR HOURS', hourX(12.6), mwY(net[13]) + 44);

  // the demand line itself, warm white
  tracePath();
  g.strokeStyle = '#fff3dd'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
  // the evening peak section (19:00–22:00) burns brighter
  g.beginPath();
  for (let h = 19; h <= 22; h++) {
    const [x, y] = pts[h];
    if (h === 19) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.strokeStyle = '#ffd9a0'; g.lineWidth = 7;
  g.shadowColor = '#ffb35c'; g.shadowBlur = 7; g.stroke();   // tight halo, not a bloom
  g.shadowBlur = 0;

  // MIN flag at the trough
  g.fillStyle = '#c8d4e0'; g.font = '600 28px Arial, sans-serif'; g.textAlign = 'left';
  g.fillText('MIN 268 MW · 04:00', hourX(4) + 14, mwY(268) + 52);
  g.beginPath(); g.arc(hourX(4), mwY(268), 6, 0, Math.PI * 2); g.fillStyle = '#c8d4e0'; g.fill();
  // MAX flag at the peak (fitted so it can never reach the stats)
  g.fillStyle = '#ffd9a0';
  g.font = `700 ${fitFont(g, 'MAX 612 MW · 20:15', 395, 32)}px Arial, sans-serif`;
  g.fillText('MAX 612 MW · 20:15', hourX(20) - 118, mwY(612) - 44);
  // NOW needle at 20:15
  g.strokeStyle = '#ffb35c'; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(hourX(S06.nowHour), PX.top + 26); g.lineTo(hourX(S06.nowHour), mwY(612)); g.stroke();
  g.fillStyle = '#ffb35c'; g.font = '700 30px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('NOW 20:15', hourX(S06.nowHour), PX.top + 8);

  // ---- stat plates, right third — the city's day in five numbers
  const stats = [
    ['LOAD FACTOR', '0.75'],
    ['DAILY ENERGY', '11,004 MWh'],
    ['FEEDERS', '214'],
    ['DISTRIBUTION TRANSFORMERS', '3,180'],
    ['THIS BLOCK ≈', '950 kW'],
  ];
  // every stat string is fitted to the column width (1420→2000), so
  // nothing can clip the panel's right edge whatever the metrics do
  let sy = 190;
  for (const [label, value] of stats) {
    g.textAlign = 'left';
    g.fillStyle = '#8fa2b5';
    g.font = `600 ${fitFont(g, label, 580, 27, 600)}px Arial, sans-serif`;
    g.fillText(label, 1420, sy);
    g.fillStyle = label.startsWith('THIS BLOCK') ? '#ffd9a0' : '#fff3dd';
    g.font = `700 ${fitFont(g, value, 580, 54)}px Arial, sans-serif`;
    g.fillText(value, 1420, sy + 48);
    g.strokeStyle = 'rgba(160,180,200,0.22)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(1420, sy + 84); g.lineTo(2000, sy + 84); g.stroke();
    sy += 128;
  }
  g.fillStyle = '#8fa2b5'; g.textAlign = 'left';
  g.font = `400 ${fitFont(g, 'THE EVENING PEAK IS DOMESTIC:', 580, 25, 400)}px Arial, sans-serif`;
  g.fillText('THE EVENING PEAK IS DOMESTIC:', 1420, sy + 6);
  g.font = `400 ${fitFont(g, 'LIGHTS, COOKING, COOLING — 19:00–22:00', 580, 25, 400)}px Arial, sans-serif`;
  g.fillText('LIGHTS, COOKING, COOLING — 19:00–22:00', 1420, sy + 38);
}

// world position of the NOW dot on the wall face (peak, 20:15).
// The screen plane is rotated π to face the street, so canvas +x
// maps to world −x: the dot's world offset mirrors the canvas one.
export function nowDotWorld() {
  const pxPerM = 256;
  const localX = (1024 - hourX(S06.nowHour)) / pxPerM;
  const localY = (448 - mwY(612)) / pxPerM;
  return new THREE.Vector3(W.x + localX, W.y + localY, W.z - 0.1);
}

export function createCurveWall() {
  const group = new THREE.Group();
  group.name = 's06-curve-wall';

  // frame + panel, mounted proud of the corner block's street face
  group.add(box(W.w + 0.35, W.h + 0.35, 0.14, mat.std(0x141a21, 'powderCoat'), W.x, W.y, W.z + 0.05));
  const tex = canvasTexture(2048, 896, drawWall);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W.w, W.h),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.4, metalness: 0.1,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85,
    }));
  screen.position.set(W.x, W.y, W.z - 0.03);
  screen.rotation.y = Math.PI;
  group.add(screen);
  // a whisper of glass: the streetlight opposite ghosts on the face
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(W.w, W.h),
    new THREE.MeshBasicMaterial({
      color: 0xbfd0dd, transparent: true, opacity: 0.05, depthWrite: false,
    }));
  sheen.position.set(W.x, W.y, W.z - 0.045);
  sheen.rotation.y = Math.PI;
  group.add(sheen);

  // the NOW dot: a physical amber stud ON the peak, pulsing slowly
  const dotPos = nowDotWorld();
  const dotMat = new THREE.MeshBasicMaterial({ color: P06.wallAmber });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), dotMat);
  dot.position.copy(dotPos);
  dot.rotation.y = Math.PI;
  group.add(dot);
  const dotGlow = lampGlow(dotPos.x, dotPos.y, dotPos.z - 0.06, 0.34, P06.wallAmber, 0.5);
  group.add(dotGlow);
  group.userData.nowDot = { dot, dotGlow, dotMat };

  // the wall's glow spills onto the footpath below (its own light,
  // from its own surface — rule 1 honoured by a real point light)
  group.add(lightPool(W.x, W.z - 2.6, 5.2, 1.7, P06.wallAmber, 0.22));
  const spill = new THREE.PointLight(P06.wallAmber, 42, 15, 1.8);
  spill.position.set(W.x, 2.3, W.z - 1.6);
  group.add(spill);

  return group;
}
