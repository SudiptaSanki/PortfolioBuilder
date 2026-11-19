// kit.js — shared small builders for Station 04 (measured-text plates,
// squared pipe runs, handrails). Every module in this station uses
// these so text always fits its plate (SCAFFOLD rule 1: measure, never
// guess) and pipes always run in straight, jointed segments between
// named points (rule 2: no fat tubes through open air — the crossover
// pipes in turbine.js are the one sanctioned exception, real bent
// steam pipe drawn with a smooth tube).

import * as THREE from 'three';

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Fit a single line of text to a pixel width: shrink the font until
// measureText fits with padding on both ends. Returns the font size used.
export function fitFont(g, text, weight, family, startPx, maxWidthPx) {
  let px = startPx;
  while (px > 8) {
    g.font = `${weight} ${px}px ${family}`;
    if (g.measureText(text).width <= maxWidthPx) break;
    px -= 2;
  }
  return px;
}

// A text plate: a plane with a canvas of centred lines. Each line:
// { text, px (start size), weight, colour }. The canvas is sized from
// the plate's aspect so glyphs are never stretched.
export function textPlate(w, h, lines, { bg = '#eef0ee', ink = '#1c2126', pxPerM = 340 } = {}) {
  const cw = Math.max(64, Math.round(w * pxPerM));
  const ch = Math.max(32, Math.round(h * pxPerM));
  const tex = canvasTexture(cw, ch, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((ln, i) => {
      const txt = typeof ln === 'string' ? ln : ln.text;
      const col = (typeof ln === 'object' && ln.colour) || ink;
      const weight = (typeof ln === 'object' && ln.weight) || 700;
      const start = (typeof ln === 'object' && ln.px) || Math.round(ch / (n + 0.6));
      fitFont(g, txt, weight, 'Arial, sans-serif', start, cw * 0.9);
      g.fillStyle = col;
      g.fillText(txt, cw / 2, ch * (i + 0.5) / n);
    });
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

// A squared pipe run: straight cylinders between consecutive points
// with a joint sphere at every corner. Points are [x,y,z] triples.
export function pipeRun(points, r, mat, group) {
  const v = points.map((p) => new THREE.Vector3(...p));
  for (let i = 0; i < v.length - 1; i++) {
    const a = v[i], b = v[i + 1];
    const len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const geo = new THREE.CylinderGeometry(r, r, len, 14);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    group.add(m);
    const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 12, 10), mat);
    j.position.copy(b);
    group.add(j);
  }
  return group;
}

// Handrail run along a straight line at deck level: posts, two rails
// (0.55 / 1.1 m) and a 100 mm kick plate. dir is 'x' or 'z'.
export function railing(len, mat) {
  const g = new THREE.Group();
  const postGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.1, 8);
  const n = Math.max(2, Math.round(len / 2.2) + 1);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(postGeo, mat);
    p.position.set(-len / 2 + (len * i) / (n - 1), 0.55, 0);
    g.add(p);
  }
  const railGeo = new THREE.CylinderGeometry(0.024, 0.024, len, 8);
  for (const y of [0.55, 1.1]) {
    const r = new THREE.Mesh(railGeo, mat);
    r.rotation.z = Math.PI / 2;
    r.position.y = y;
    g.add(r);
  }
  g.add(box(len, 0.1, 0.015, mat, 0, 0.05, 0));
  return g;
}

// Place a railing run built along local X at (x, deckY, z), rotated
// so it runs along world X (rotY=0) or world Z (rotY=PI/2).
export function placeRailing(len, mat, x, y, z, rotY = 0) {
  const r = railing(len, mat);
  r.position.set(x, y, z);
  r.rotation.y = rotY;
  return r;
}
