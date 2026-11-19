// helpers.js — shared builders for Station 06: canvas textures with
// MEASURED text (SCAFFOLD rule 1: a label wider than its canvas clips
// at both ends — every plate here auto-fits its longest line), simple
// materials, the window field (one draw call for every lit window in
// the scene), and the light-pool decal every streetlight throws.

import * as THREE from 'three';
import { SURFACE } from '../../config/world.js';

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Shrink the font (from `start` px) until `text` fits `maxW` px.
// Returns the fitted size. This is the measured-text rule, mechanised.
export function fitFont(g, text, maxW, start, weight = 700, family = 'Arial, sans-serif') {
  let s = start;
  g.font = `${weight} ${s}px ${family}`;
  while (g.measureText(text).width > maxW && s > 8) {
    s -= 2;
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

// A text plate: dark or light ground, centred lines, each auto-fitted.
// lines: [{ text, size, color, weight }] — sizes are starting points.
export function textPlate(w, h, lines, {
  px = [1024, 256], bg = '#20262b', border = 'rgba(200,210,220,0.35)',
  emissive = 0.35, pad = 0.08,
} = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    if (border) {
      g.strokeStyle = border; g.lineWidth = 4;
      g.strokeRect(3, 3, cw - 6, ch - 6);
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const maxW = cw * (1 - pad * 2);
    const step = ch / (lines.length + 1);
    lines.forEach((ln, i) => {
      const size = fitFont(g, ln.text, maxW, ln.size || 64, ln.weight || 700);
      g.font = `${ln.weight || 700} ${size}px Arial, sans-serif`;
      g.fillStyle = ln.color || '#e8ecf0';
      g.fillText(ln.text, cw / 2, step * (i + 1) + (ln.dy || 0));
    });
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.55, metalness: 0.15,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive,
    }));
  return m;
}

// Plain materials from the shared surface language.
export const mat = {
  std: (color, surf = 'powderCoat', extra = {}) =>
    new THREE.MeshStandardMaterial({ color, ...(SURFACE[surf] || SURFACE.powderCoat), ...extra }),
  galv: () => mat.std(0xb9bfc4, 'galvanised'),
  steel: () => mat.std(0x9aa1a7, 'brushedSteel'),
  darkSteel: () => mat.std(0x3c4147, 'brushedSteel'),
  concrete: () => mat.std(0xb5b0a6, 'concrete'),
  concreteDark: () => mat.std(0x8f8a7f, 'concrete'),
};

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  return m;
}

// ------------------------------------------------------- window field --
// Every lit/dark window in the scene as ONE BufferGeometry of quads
// with per-vertex colours, drawn with an unlit material — windows are
// light sources in the night scene, they do not receive light.
// list: [{ x, y, z, w, h, rotY, color (hex), bright 0..1 }]
export function createWindowField(list) {
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  list.forEach((win, i) => {
    const b = i * 4;
    const hw = win.w / 2, hh = win.h / 2;
    const cos = Math.cos(win.rotY || 0), sin = Math.sin(win.rotY || 0);
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    for (const [lx, ly] of corners) {
      pos.push(win.x + lx * cos, win.y + ly, win.z - lx * sin);
    }
    c.setHex(win.color);
    const k = win.bright == null ? 1 : win.bright;
    for (let j = 0; j < 4; j++) col.push(c.r * k, c.g * k, c.b * k);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  mesh.name = 'window-field';
  return mesh;
}

// -------------------------------------------------------- light pools --
// The elongated ellipse a streetlight throws on asphalt. A radial-
// gradient decal: bright core under the fitting, fading to nothing —
// pools just touch at mid-span, per IS 1944 spacing discipline.
let _poolTex = null;
function poolTexture() {
  if (_poolTex) return _poolTex;
  _poolTex = canvasTexture(256, 256, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.38)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  return _poolTex;
}

export function lightPool(x, z, rx, rz, color, opacity = 0.5) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1, 28),
    new THREE.MeshBasicMaterial({
      map: poolTexture(), color, transparent: true, opacity,
      depthWrite: false,
    }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(rx, rz, 1);
  m.position.set(x, 0.02, z);
  m.renderOrder = 2;
  return m;
}

// A soft round glow sprite at a lamp head (the visible "on" of a
// fitting) — small, warm, never a halo ball.
let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  _glowTex = canvasTexture(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  return _glowTex;
}

export function lampGlow(x, y, z, size, color, opacity = 0.85) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity, depthWrite: false,
  }));
  m.scale.set(size, size, 1);
  m.position.set(x, y, z);
  return m;
}

// Catenary points between two anchors with parabolic sag — the only
// curve a conductor is allowed to take (SCAFFOLD rule 2).
export function catenaryPoints(a, b, sag, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return pts;
}

export function conductorTube(a, b, sag, radius, material) {
  const curve = new THREE.CatmullRomCurve3(catenaryPoints(a, b, sag));
  const geo = new THREE.TubeGeometry(curve, 24, radius, 5, false);
  return new THREE.Mesh(geo, material);
}
