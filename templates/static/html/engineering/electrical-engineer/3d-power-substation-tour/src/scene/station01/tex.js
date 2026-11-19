// tex.js — canvas-texture helpers for Station 01 (labels.js discipline
// from the AI/ML build, plus the hard-won rule from its Station 06:
// MEASURE text or it clips at both ends). fitFont() shrinks a font
// until the string fits its allotted width — every plate and screen
// in this room routes its headlines through it.

import * as THREE from 'three';

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function canvasTexture(w, h, draw) {
  const [c, g] = makeCanvas(w, h);
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Set g.font to the largest size <= px at which `text` fits maxW.
// Returns the size used. Call before fillText; set fillStyle after.
export function fitFont(g, text, maxW, px, weight = '700', family = 'Arial, sans-serif') {
  let size = px;
  g.font = `${weight} ${size}px ${family}`;
  while (size > 8 && g.measureText(text).width > maxW) {
    size -= 2;
    g.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// A physical plate: plane with a drawn canvas.
export function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

// A screen surface: emissive by construction (MeshBasicMaterial — the
// screens are this room's dominant light source, per the inventory).
export function screenMesh(w, h, tex) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex }));
}

export function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

export function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...opts });
}
