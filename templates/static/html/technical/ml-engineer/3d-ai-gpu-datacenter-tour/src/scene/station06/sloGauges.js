// sloGauges.js — the SLO / error-budget bank: the judgement plant,
// angled toward the dais beside the map wall. Three large physical
// gauges (dial + remaining-budget bar), the arithmetic rail beneath
// them carrying the full nines table as furniture, and the policy
// plate set apart like a framed notice in a real control room. The
// arithmetic is the SRE literature's own: 99.9% over 30 days is
// 43.2 minutes; a 14.4× burn empties that budget in ~50 hours, which
// is the Workbook's page threshold; a spent budget freezes launches.

import * as THREE from 'three';
import { STATION06, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S06 = STATION06;
const GK = S06.gauges;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function litMaterial(tex, glow = 0.42) {
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.45, metalness: 0.15,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow,
  });
}

function plate(w, h, lines, { px = [640, 96], ink = '#dfe7ee' } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = '#0d1015'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.3)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.fillStyle = ink;
      g.font = '700 40px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 14);
    } else {
      g.fillStyle = ink;
      g.font = '700 37px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 5);
      g.fillStyle = '#9aa7b5';
      g.font = '400 31px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 33);
    }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), litMaterial(tex));
}

// ------------------------------------------------------------- dials ----
// Canvas gauge faces. angleFor maps a 0..1 fraction onto a 270° sweep.
function dialTexture(drawScale) {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#14181d';
    g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.strokeStyle = '#454f59';
    g.lineWidth = 7;
    g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
    drawScale(g);
    g.fillStyle = '#c8d2dc';
    g.beginPath(); g.arc(128, 128, 11, 0, 7); g.fill();
  });
}

const angleFor = (frac) => Math.PI * 0.75 + frac * Math.PI * 1.5;
function needle(g, frac, color = '#e8eef4') {
  const a = angleFor(frac);
  g.strokeStyle = color;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(128, 128);
  g.lineTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84);
  g.stroke();
}
function zoneArc(g, f0, f1, color) {
  g.strokeStyle = color;
  g.lineWidth = 13;
  g.beginPath();
  g.arc(128, 128, 100, angleFor(f0), angleFor(f1));
  g.stroke();
}
function ticks(g, fracs, r0 = 88, r1 = 97) {
  g.strokeStyle = '#8d99a6';
  g.lineWidth = 3;
  for (const f of fracs) {
    const a = angleFor(f);
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
    g.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
    g.stroke();
  }
}

// remaining-budget dial (availability + latency): green is what is
// left; the needle reads the fraction remaining.
function budgetDial(remaining, centreText) {
  return dialTexture((g) => {
    zoneArc(g, 0, 0.1, 'rgba(255,68,68,0.75)');
    zoneArc(g, 0.1, 0.3, 'rgba(255,176,46,0.75)');
    zoneArc(g, 0.3, 1, 'rgba(57,255,122,0.5)');
    ticks(g, [0, 0.25, 0.5, 0.75, 1]);
    needle(g, remaining);
    g.fillStyle = '#e8eef4';
    g.textAlign = 'center';
    g.font = '700 30px "Courier New", monospace';
    g.fillText(centreText, 128, 182);
    g.fillStyle = '#9aa7b5';
    g.font = '400 19px Arial, sans-serif';
    g.fillText('BUDGET LEFT', 128, 206);
  });
}

// burn-rate dial: log scale; green to 2×, amber to the 14.4× page
// threshold, red beyond. The needle sits at 1× — normal burn.
function burnDial() {
  const lo = Math.log10(0.1), hi = Math.log10(30);
  const frac = (v) => (Math.log10(v) - lo) / (hi - lo);
  return dialTexture((g) => {
    zoneArc(g, 0, frac(2), 'rgba(57,255,122,0.5)');
    zoneArc(g, frac(2), frac(14.4), 'rgba(255,176,46,0.75)');
    zoneArc(g, frac(14.4), 1, 'rgba(255,68,68,0.8)');
    ticks(g, [0.1, 0.5, 1, 2, 6, 14.4, 30].map(frac));
    g.fillStyle = '#c8d2dc';
    g.font = '700 21px "Courier New", monospace';
    g.textAlign = 'center';
    const at = (v, dy) => {
      const a = angleFor(frac(v));
      g.fillText(`${v}×`, 128 + Math.cos(a) * 66, 128 + Math.sin(a) * 66 + dy);
    };
    at(1, 6); at(14.4, 6);
    needle(g, frac(1));
    g.fillStyle = '#9aa7b5';
    g.font = '400 19px Arial, sans-serif';
    g.fillText('ERROR RATE ÷ BUDGET RATE', 128, 206);
  });
}

// ------------------------------------------------------------- bank -----
const GAUGES = [
  {
    name: 'AVAILABILITY · SLO 99.9%',
    dial: () => budgetDial(0.62, '62%'),
    bar: 0.62,
    fact: ['BUDGET 43.2 MIN · 30 DAYS', 'SPENT BY INCIDENTS AND LAUNCHES'],
  },
  {
    name: 'LATENCY · 99.95% < 300 MS',
    dial: () => budgetDial(0.78, '78%'),
    bar: 0.78,
    fact: ['21.6 MIN OF BREACH A MONTH', 'IS THE WHOLE ALLOWANCE'],
  },
  {
    name: 'BURN RATE',
    dial: burnDial,
    bar: null,
    fact: ['14.4× EMPTIES IT IN ~50 H', 'THAT IS WHEN WE PAGE'],
  },
];

export function createSloGauges() {
  const group = new THREE.Group();
  group.name = 's06-gauges';
  const bank = new THREE.Group();
  bank.position.set(GK.x, 0, GK.z);
  bank.rotation.y = GK.rotY;
  group.add(bank);

  const steel = new THREE.MeshStandardMaterial({ color: 0x3a424c, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x22262c, ...SURFACE.powderCoat });

  const panel = new THREE.Mesh(new THREE.BoxGeometry(GK.width, 1.42, 0.06), darkSteel);
  panel.position.set(0, 1.3, 0);
  bank.add(panel);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.62, 0.055), steel);
    post.position.set(s * (GK.width / 2 - 0.08), 0.31, 0);
    bank.add(post);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.3), darkSteel);
    foot.position.set(s * (GK.width / 2 - 0.08), 0.015, 0.02);
    bank.add(foot);
  }

  const leds = [];
  const rnd = seeded(19);
  GAUGES.forEach((gz, i) => {
    const lx = -0.56 + i * 0.56;
    const name = plate(0.5, 0.075, [gz.name], { px: [768, 96] });
    name.position.set(lx, 1.86, 0.036);
    bank.add(name);
    // dial: cylinder rim + canvas face
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 28), steel);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(lx, 1.52, 0.045);
    bank.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.186, 28), litMaterial(gz.dial(), 0.5));
    face.position.set(lx, 1.52, 0.072);
    bank.add(face);
    // remaining-budget bar (burn gauge gets a zone strip instead)
    const recess = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.015), new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.8 }));
    recess.position.set(lx, 1.22, 0.038);
    bank.add(recess);
    if (gz.bar !== null) {
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 * gz.bar, 0.032, 0.008),
        new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xdfe7ee, emissiveIntensity: 1.1, roughness: 0.5 }));
      seg.position.set(lx - 0.21 + (0.42 * gz.bar) / 2, 1.22, 0.046);
      bank.add(seg);
    } else {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.032),
        litMaterial(canvasTexture(256, 24, (g, w, h) => {
          g.fillStyle = '#2e7d46'; g.fillRect(0, 0, w * 0.42, h);
          g.fillStyle = '#a87c1e'; g.fillRect(w * 0.42, 0, w * 0.38, h);
          g.fillStyle = '#a52a2a'; g.fillRect(w * 0.8, 0, w * 0.2, h);
          g.fillStyle = '#e8eef4'; g.fillRect(w * 0.3, 0, 4, h);   // needle at 1×
        }), 0.7));
      strip.position.set(lx, 1.22, 0.047);
      bank.add(strip);
    }
    const fact = plate(0.52, 0.1, gz.fact, { px: [768, 128] });
    fact.position.set(lx, 1.06, 0.036);
    bank.add(fact);
    leds.push({ local: [lx + 0.17, 1.86, 0.05], color: i === 2 ? PALETTE.ledAmber : PALETTE.ledGreen, phase: rnd(), blink: i === 2 ? 0.6 : 0 });
  });

  // the arithmetic rail — the nines table as furniture
  const rail = new THREE.Mesh(new THREE.BoxGeometry(GK.width, 0.045, 0.04), steel);
  rail.position.set(0, 0.44, 0.02);
  bank.add(rail);
  const table = ['99% · 7 H 12 MIN', '99.9% · 43.2 MIN', '99.95% · 21.6 MIN', '99.99% · 4.32 MIN'];
  table.forEach((txt, i) => {
    const p = plate(0.4, 0.08, [txt], { px: [640, 96] });
    p.position.set(-0.63 + i * 0.42, 0.56, 0.036);
    bank.add(p);
  });

  // the policy plate — set apart, framed like a notice, on its own post.
  // It stands east of the bank with a clear gap (frame west edge at
  // 1.04 vs the panel's east edge at GK.width/2 = 0.85) and its face
  // sits proud of the panel's front plane, so no viewing angle lets
  // the bank clip its first line.
  const policyPost = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.14, 0.05), steel);
  policyPost.position.set(1.52, 0.57, 0.0);
  bank.add(policyPost);
  const policyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.38, 0.025), steel);
  policyFrame.position.set(1.52, 1.32, 0.015);
  bank.add(policyFrame);
  const policyTex = canvasTexture(1024, 384, (g, w, h) => {
    g.fillStyle = '#0d1015'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffb02e';
    g.lineWidth = 5;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.textAlign = 'center';
    g.fillStyle = '#ffb02e';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('ERROR BUDGET POLICY', w / 2, 92);
    g.fillStyle = '#e8eef4';
    // 38px, not larger: at 47px this line measures ~1125px on the
    // 1024px canvas and its centred text overflowed BOTH edges
    // ("…DGET SPENT ⇒ FEATURE LAUNCHES FREE…"). At 38px it measures
    // ~909px, leaving ~57px of padding each side.
    g.font = '700 38px Arial, sans-serif';
    g.fillText('BUDGET SPENT ⇒ FEATURE LAUNCHES FREEZE', w / 2, 196);
    g.font = '400 42px Arial, sans-serif';
    g.fillStyle = '#9aa7b5';
    g.fillText('UNTIL THE WINDOW RECOVERS', w / 2, 268);
    g.font = '400 34px Arial, sans-serif';
    g.fillText('THE BUDGET IS PERMISSION TO TAKE RISKS', w / 2, 330);
  });
  const policy = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), litMaterial(policyTex, 0.45));
  policy.position.set(1.52, 1.32, 0.035);
  bank.add(policy);

  // resolve gauge telltales into station space
  bank.updateMatrixWorld(true);
  const field = leds.map((l) => {
    const v = new THREE.Vector3(...l.local);
    bank.localToWorld(v);
    return { x: v.x, y: v.y, z: v.z, color: l.color, phase: l.phase, blink: l.blink };
  });
  if (field.length) group.add(createLEDField(field));

  return group;
}
