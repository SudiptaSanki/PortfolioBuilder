// kit.js — small shared helpers for Station 05 modules: a seeded RNG
// (renders must be reproducible), canvas-plate helpers that MEASURE
// text before drawing it (SCAFFOLD rule 1 — text wider than its canvas
// clips at both ends), and the terrain height function every module
// agrees on (the west ridge the turbines stand on).

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE } from '../../config/world.js';

const S05 = STATION05;

// Deterministic PRNG (mulberry32) — same seed, same scene, every load.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Terrain: flat plant floor in the east, rising to the turbine ridge
// in the west. Smoothstep between ridge.x0 (floor) and ridge.x1 (top).
export function terrainHeight(x, z) {
  const r = S05.ridge;
  const t = THREE.MathUtils.clamp((r.x0 - x) / (r.x0 - r.x1), 0, 1);
  const s = t * t * (3 - 2 * t);
  return s * r.height;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Shrink a font size until `text` fits maxW px (measured, never guessed).
export function fitFont(g, text, maxW, size, weight = 700, family = 'Arial, sans-serif') {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  const w = g.measureText(text).width;
  if (w > maxW) {
    s = Math.max(8, Math.floor(s * (maxW / w)));
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

// A canvas-textured plate. draw(g, w, h) paints it.
export function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

// Centred multi-line plate; every line is auto-fitted to the canvas
// width minus padding. lines: [{ text, size, weight, color, font }]
export function plateLines(w, h, lines, { bg = '#f2f3f4', px = [1024, 256], pad = 36 } = {}) {
  return textPlate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.textAlign = 'center';
    const n = lines.length;
    lines.forEach((ln, i) => {
      const y = (ch * (i + 1)) / (n + 1);
      g.fillStyle = ln.color || '#14171a';
      const s = fitFont(g, ln.text, cw - pad * 2, ln.size || 64, ln.weight || 700, ln.font);
      g.font = `${ln.weight || 700} ${s}px ${ln.font || 'Arial, sans-serif'}`;
      g.fillText(ln.text, cw / 2, y + s * 0.36);
    });
  }, px);
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

// Shared materials (built once, reused across modules).
export const MAT = {
  galvanised: new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.galvanised }),
  brushedSteel: new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }),
  darkSteel: new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, roughness: 0.55, metalness: 0.6 }),
  structure: new THREE.MeshStandardMaterial({ color: PALETTE.structureGrey, roughness: 0.6, metalness: 0.5 }),
  concrete: new THREE.MeshStandardMaterial({ color: PALETTE.concrete, ...SURFACE.concrete }),
  concreteDark: new THREE.MeshStandardMaterial({ color: PALETTE.concreteDark, ...SURFACE.concrete }),
  gravel: new THREE.MeshStandardMaterial({ color: PALETTE.gravel, roughness: 1, metalness: 0 }),
  tankGreen: new THREE.MeshStandardMaterial({ color: PALETTE.tankGreen, ...SURFACE.powderCoat }),
  porcelainGrey: new THREE.MeshStandardMaterial({ color: PALETTE.porcelainGrey, ...SURFACE.porcelain }),
  safetyYellow: new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.mattePaint }),
  warningRed: new THREE.MeshStandardMaterial({ color: PALETTE.warningRed, ...SURFACE.mattePaint }),
  copper: new THREE.MeshStandardMaterial({ color: PALETTE.copper, roughness: 0.45, metalness: 0.8 }),
};

// A porcelain/polymer bushing or insulator string: a core cylinder
// with shed discs. height total, r core radius, sheds count.
export function bushing(height, r, sheds, mat = MAT.porcelainGrey) {
  const g = new THREE.Group();
  const core = cyl(r, r * 1.15, height, mat, 0, height / 2, 0, 10);
  g.add(core);
  const shedGeo = new THREE.CylinderGeometry(r * 1.9, r * 1.9, height / sheds * 0.28, 12);
  for (let i = 0; i < sheds; i++) {
    const s = new THREE.Mesh(shedGeo, mat);
    s.position.y = (height * (i + 0.5)) / sheds;
    g.add(s);
  }
  const cap = cyl(r * 0.5, r * 0.5, 0.12, MAT.brushedSteel, 0, height + 0.05, 0, 8);
  g.add(cap);
  return g;
}
