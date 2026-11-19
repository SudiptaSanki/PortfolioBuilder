// helpers.js — shared materials, canvas-plate and geometry helpers for
// Station 02. Canvas rule (SCAFFOLD #1): every text plate is drawn with
// fitFont() so text NEVER overflows its canvas — measured, not guessed.

import * as THREE from 'three';
import { PALETTE, SURFACE } from '../../config/world.js';

export const SAGE = 0x5a6b5e; // tank enamel, inventory §18 (original Blender family)

export const MAT = {
  galv: new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.galvanised }),
  galvBright: new THREE.MeshStandardMaterial({ color: 0xc4c9cc, roughness: 0.45, metalness: 0.6 }),
  steel: new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }),
  darkSteel: new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, roughness: 0.5, metalness: 0.7 }),
  structure: new THREE.MeshStandardMaterial({ color: PALETTE.structureGrey, ...SURFACE.galvanised }),
  copper: new THREE.MeshStandardMaterial({ color: PALETTE.copper, roughness: 0.38, metalness: 0.9 }),
  copperOld: new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.45, metalness: 0.85 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.brass, roughness: 0.35, metalness: 0.9 }),
  aluminium: new THREE.MeshStandardMaterial({ color: PALETTE.aluminium, roughness: 0.45, metalness: 0.8 }),
  conductor: new THREE.MeshStandardMaterial({ color: 0xa8abad, roughness: 0.45, metalness: 0.85 }),
  tank: new THREE.MeshStandardMaterial({ color: SAGE, roughness: 0.5, metalness: 0.18 }),
  tankDark: new THREE.MeshStandardMaterial({ color: 0x4c5a4f, roughness: 0.55, metalness: 0.15 }),
  porcelain: new THREE.MeshStandardMaterial({ color: PALETTE.porcelainBrown, ...SURFACE.porcelain }),
  porcelainGrey: new THREE.MeshStandardMaterial({ color: PALETTE.porcelainGrey, ...SURFACE.porcelain }),
  polymer: new THREE.MeshStandardMaterial({ color: 0xb9bcbe, roughness: 0.7, metalness: 0.05 }),
  sf6: new THREE.MeshStandardMaterial({ color: PALETTE.sf6Tank, roughness: 0.5, metalness: 0.3 }),
  cabinet: new THREE.MeshStandardMaterial({ color: 0xb5b8b4, roughness: 0.55, metalness: 0.25 }),
  panelBlue: new THREE.MeshStandardMaterial({ color: PALETTE.panelBlue, ...SURFACE.powderCoat }),
  concrete: new THREE.MeshStandardMaterial({ color: PALETTE.concrete, ...SURFACE.concrete }),
  concreteDark: new THREE.MeshStandardMaterial({ color: PALETTE.concreteDark, ...SURFACE.concrete }),
  black: new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.7, metalness: 0.2 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.9, metalness: 0.0 }),
  redPaint: new THREE.MeshStandardMaterial({ color: PALETTE.warningRed, roughness: 0.5, metalness: 0.1 }),
  yellowPaint: new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, roughness: 0.5, metalness: 0.1 }),
  whitePaint: new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: 0.8, metalness: 0.02 }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x232a2e, roughness: 0.12, metalness: 0.4 }),
  glassPale: new THREE.MeshStandardMaterial({ color: 0xbfd4d2, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55 }),
  oilDark: new THREE.MeshStandardMaterial({ color: 0x2e2416, roughness: 0.25, metalness: 0.1 }),
  blueCrystal: new THREE.MeshStandardMaterial({ color: 0x2b5fb8, roughness: 0.35, metalness: 0.0 }),
  pinkCrystal: new THREE.MeshStandardMaterial({ color: 0xc98a9a, roughness: 0.35, metalness: 0.0 }),
  ledGreen: new THREE.MeshStandardMaterial({ color: 0x11351c, emissive: PALETTE.ledGreen, emissiveIntensity: 1.6 }),
  ledOff: new THREE.MeshStandardMaterial({ color: 0x3a3f3a, roughness: 0.4, metalness: 0.1 }),
};

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function grp(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

// ---- canvas textures -------------------------------------------------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
// Shrink font until `text` fits maxW; returns the px size set on ctx.
export function fitFont(g, text, maxW, px, weight = 700, family = 'Arial, sans-serif') {
  let s = px;
  g.font = `${weight} ${s}px ${family}`;
  while (g.measureText(text).width > maxW && s > 7) {
    s -= 2;
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}
export function plate(w, h, draw, px = [512, 256], mat = {}) {
  const tex = canvasTex(px[0], px[1], draw);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.08, ...mat }));
  m.castShadow = false; m.receiveShadow = true;
  return m;
}
// Simple centred-lines sign plate.
export function signPlate(w, h, lines, { bg = '#e9e7e0', ink = '#1c1e20', px = [640, 256], bold = true } = {}) {
  return plate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = ink; g.lineWidth = 5; g.strokeRect(7, 7, cw - 14, ch - 14);
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((ln, i) => {
      fitFont(g, ln, cw - 44, Math.min(64, (ch - 30) / n * 0.52), bold ? 700 : 400);
      g.fillText(ln, cw / 2, (ch / (n + 1)) * (i + 1) + 2);
    });
  }, px);
}

// ---- catenary conductors ---------------------------------------------
// Points along a shallow parabola between a and b (sag at midspan).
export function catenaryPts(a, b, sag, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, u);
    p.y -= 4 * sag * u * (1 - u);
    pts.push(p);
  }
  return pts;
}
export function tube(pts, r, mat, seg = 24) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 6), mat);
  m.castShadow = true;
  return m;
}
export function conductor(a, b, sag, r = 0.016) {
  return tube(catenaryPts(a, b, sag), r, MAT.conductor);
}
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Shedded porcelain profile for lathes: barrel radius r0->r1 over height h
// with shed discs (radius rShed) every `pitch`. Returns LatheGeometry.
export function shedProfile(r0, r1, h, rShed, pitch = 0.1) {
  const pts = [];
  pts.push(new THREE.Vector2(0.001, 0));
  pts.push(new THREE.Vector2(r0, 0));
  const steps = Math.max(2, Math.round(h / pitch));
  for (let i = 0; i < steps; i++) {
    const y0 = (i / steps) * h, y1 = ((i + 1) / steps) * h;
    const rA = r0 + (r1 - r0) * (i / steps);
    const rB = r0 + (r1 - r0) * ((i + 1) / steps);
    pts.push(new THREE.Vector2(rA, y0 + (y1 - y0) * 0.35));
    pts.push(new THREE.Vector2(rShed, y0 + (y1 - y0) * 0.5));
    pts.push(new THREE.Vector2(rShed * 0.99, y0 + (y1 - y0) * 0.62));
    pts.push(new THREE.Vector2(rB, y1));
  }
  pts.push(new THREE.Vector2(r1, h));
  pts.push(new THREE.Vector2(0.001, h));
  return new THREE.LatheGeometry(pts, 14);
}
export function lathe(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// Dial face texture: white dial, ticks, needle at frac (0..1 of sweep),
// optional red max-pointer. label under centre.
export function dialPlate(size, { label = '', frac = 0.5, redFrac = null, unit = '' } = {}) {
  return plate(size, size, (g, w, h) => {
    const cx = w / 2, cy = h / 2, r = w * 0.46;
    g.fillStyle = '#101214'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#22252a'; g.lineWidth = 3;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
      g.lineTo(cx + Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93);
      g.stroke();
    }
    if (redFrac !== null) {
      const a = Math.PI * 0.75 + redFrac * Math.PI * 1.5;
      g.strokeStyle = '#c0272d'; g.lineWidth = 7;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      g.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
      g.stroke();
    }
    const a = Math.PI * 0.75 + frac * Math.PI * 1.5;
    g.strokeStyle = '#14161a'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); g.stroke();
    g.fillStyle = '#14161a'; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, Math.PI * 2); g.fill();
    g.textAlign = 'center';
    fitFont(g, label, w * 0.62, 44, 700);
    g.fillText(label, cx, cy + r * 0.52);
    if (unit) { fitFont(g, unit, w * 0.5, 36, 400); g.fillText(unit, cx, cy + r * 0.74); }
  }, [256, 256]);
}
