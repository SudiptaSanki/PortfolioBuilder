// terrain.js — the land the line crosses: flat Deccan-style
// farmland parcels, the cleared 46 m right-of-way with its patrol
// track, a dirt road crossing under span 2, a dry nala dip in
// span 3, scrub and lone trees OUTSIDE the RoW, and a hazy
// late-afternoon sky. The corridor strip and tower aprons are kept
// flat by the height function; the fields roll gently beyond it.

import * as THREE from 'three';
import { PALETTE, STATION03 } from '../../config/world.js';
import { TOWERS, spanDir } from './towers.js';

const S03 = STATION03;

// Corridor polyline (extended past both end towers).
const POLY = [];
{
  const back = spanDir(0).multiplyScalar(-80);
  POLY.push(TOWERS[0].pos.clone().add(back));
  for (const t of TOWERS) POLY.push(t.pos.clone());
  POLY.push(TOWERS[4].pos.clone().addScaledVector(spanDir(3), 80));
}
// cumulative station distances along POLY (from T-214)
const STATION = [0];
for (let i = 1; i < POLY.length; i++) {
  STATION.push(STATION[i - 1] + POLY[i].distanceTo(POLY[i - 1]));
}
const S_T214 = POLY[1].distanceTo(POLY[0]); // station of T-214 itself

function closestOnCorridor(x, z) {
  let best = { d: Infinity, s: 0 };
  for (let i = 0; i < POLY.length - 1; i++) {
    const ax = POLY[i].x, az = POLY[i].z;
    const bx = POLY[i + 1].x, bz = POLY[i + 1].z;
    const dx = bx - ax, dz = bz - az;
    const L2 = dx * dx + dz * dz;
    let t = ((x - ax) * dx + (z - az) * dz) / L2;
    t = THREE.MathUtils.clamp(t, 0, 1);
    const px = ax + dx * t, pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, s: STATION[i] + Math.sqrt(L2) * t - S_T214 };
  }
  return best;
}

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Ground height: gentle undulation, flattened on the corridor and
// the road, with the dry-nala dip where the track crosses in span 3.
export function groundHeight(x, z) {
  const base = 1.1 * Math.sin(x * 0.011 + 1.7) * Math.sin(z * 0.0085 + 0.4)
    + 0.6 * Math.sin(x * 0.021 + 0.3) * Math.sin(z * 0.017 + 2.1);
  const { d, s } = closestOnCorridor(x, z);
  const fCorr = smooth(30, 95, d);
  const fRoad = 1 - 0.75 * (1 - smooth(6, 16, Math.abs(z - 600)));
  const dip = -1.1 * Math.exp(-(((s - 1000) / 28) ** 2)) * Math.exp(-((d / 70) ** 2));
  return base * fCorr * fRoad + dip;
}

// ------------------------------------------------------------ ground texture ---

const WORLD_RECT = { x0: -750, x1: 950, z0: -350, z1: 1750 };
function groundTexture() {
  const W = 4096, H = 4096;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cx = (x) => ((x - WORLD_RECT.x0) / (WORLD_RECT.x1 - WORLD_RECT.x0)) * W;
  const cy = (z) => ((z - WORLD_RECT.z0) / (WORLD_RECT.z1 - WORLD_RECT.z0)) * H;
  const pxm = W / (WORLD_RECT.x1 - WORLD_RECT.x0);   // texture pixels per metre
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // Field parcels: a true tiling (no overlap, no alpha wash) with a
  // wide tone spread — deep crop green, bright crop, khaki stubble,
  // dark fallow, pale dry — so neighbours differ at a glance and the
  // land reads as farmland, not as one flat olive sheet.
  const tones = ['#5f7a38', '#74924a', '#86a04c', '#a9a05c', '#bfae6d',
    '#8a7a4c', '#6e5b40', '#7d8a48', '#c2b183', '#97a155'];
  g.fillStyle = '#8f8a52'; g.fillRect(0, 0, W, H);
  for (let gx = WORLD_RECT.x0; gx < WORLD_RECT.x1;) {
    const pw = 120 + rnd() * 180;
    let prevTone = null;
    for (let gz = WORLD_RECT.z0; gz < WORLD_RECT.z1;) {
      const ph = 120 + rnd() * 180;
      let tone = tones[Math.floor(rnd() * tones.length)];
      if (tone === prevTone) tone = tones[Math.floor(rnd() * tones.length)];
      prevTone = tone;
      const x0 = cx(gx), y0 = cy(gz), x1 = cx(gx + pw), y1 = cy(gz + ph);
      g.fillStyle = tone;
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      // crop-row / plough striping on some parcels
      if (rnd() < 0.55) {
        const vertical = rnd() < 0.5;
        const step = pxm * (7 + rnd() * 5);
        g.save();
        g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
        g.strokeStyle = 'rgba(40,36,20,0.10)';
        g.lineWidth = Math.max(2, pxm * 0.8);
        g.beginPath();
        if (vertical) for (let x = x0 + step; x < x1; x += step) { g.moveTo(x, y0); g.lineTo(x, y1); }
        else for (let y = y0 + step; y < y1; y += step) { g.moveTo(x0, y); g.lineTo(x1, y); }
        g.stroke();
        g.restore();
      }
      // bund: a dark ridge line with a pale lip just inside it
      g.strokeStyle = 'rgba(58,48,30,0.9)';
      g.lineWidth = Math.max(3, pxm * 1.1);
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = 'rgba(240,232,200,0.20)';
      g.lineWidth = Math.max(1.5, pxm * 0.45);
      g.strokeRect(x0 + pxm * 0.9, y0 + pxm * 0.9, x1 - x0, y1 - y0);
      gz += ph;
    }
    gx += pw;
  }
  // grain over the fields, so grazing angles keep some tooth
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(52,46,26,0.10)' : 'rgba(238,230,196,0.08)';
    g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  // corridor band (46 m RoW) as an offset polygon
  const perp = (i) => {
    const d = spanDir(Math.min(i, 3));
    return new THREE.Vector3(d.z, 0, -d.x);
  };
  const band = (offsetFn, width, fill) => {
    g.fillStyle = fill;
    g.beginPath();
    const ext = [TOWERS[0].pos.clone().addScaledVector(spanDir(0), -90),
      ...TOWERS.map((t) => t.pos),
      TOWERS[4].pos.clone().addScaledVector(spanDir(3), 90)];
    const L = [], R = [];
    ext.forEach((p, i) => {
      const pp = perp(Math.min(Math.max(i - 1, 0), 3));
      const cOff = offsetFn(p, pp);
      L.push([cx(cOff.x + pp.x * width / 2), cy(cOff.z + pp.z * width / 2)]);
      R.push([cx(cOff.x - pp.x * width / 2), cy(cOff.z - pp.z * width / 2)]);
    });
    g.moveTo(L[0][0], L[0][1]);
    for (const p of L) g.lineTo(p[0], p[1]);
    for (const p of R.reverse()) g.lineTo(p[0], p[1]);
    g.closePath(); g.fill();
    // rough, worked ground inside the RoW: dense speckle, clipped
    // to the band, so the strip reads paler and rougher than fields
    g.save();
    g.clip();
    for (let i = 0; i < 15000; i++) {
      g.fillStyle = rnd() < 0.55 ? 'rgba(96,82,54,0.16)' : 'rgba(226,216,178,0.14)';
      g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 4, 2 + rnd() * 4);
    }
    g.restore();
    // darker edges, so the 46 m band reads as a band
    g.strokeStyle = 'rgba(70,60,40,0.55)';
    g.lineWidth = Math.max(2, pxm * 0.7);
    for (const line of [L, R]) {
      g.beginPath();
      line.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.stroke();
    }
    return { L, R };
  };
  band((p) => p, S03.row.widthM, '#b8ab7d');
  // nala band across span 3 (station ~1000 m from T-214)
  {
    const sIdx = 1000 / 400;
    const seg = Math.min(Math.floor(sIdx), 3);
    const frac = sIdx - seg;
    const base = TOWERS[seg].pos.clone().lerp(TOWERS[seg + 1].pos, frac);
    const d = spanDir(seg);
    const pp = new THREE.Vector3(d.z, 0, -d.x);
    g.fillStyle = 'rgba(96,84,58,0.45)';
    g.beginPath();
    const corners = [
      base.clone().addScaledVector(d, -16).addScaledVector(pp, 42),
      base.clone().addScaledVector(d, 16).addScaledVector(pp, 42),
      base.clone().addScaledVector(d, 16).addScaledVector(pp, -42),
      base.clone().addScaledVector(d, -16).addScaledVector(pp, -42),
    ];
    corners.forEach((p, i) => (i ? g.lineTo(cx(p.x), cy(p.z)) : g.moveTo(cx(p.x), cy(p.z))));
    g.closePath(); g.fill();
  }
  // patrol track: offset polyline, pale fill + two wheel ruts
  const trackPts = [];
  {
    const ext = [TOWERS[0].pos.clone().addScaledVector(spanDir(0), -90),
      ...TOWERS.map((t) => t.pos),
      TOWERS[4].pos.clone().addScaledVector(spanDir(3), 90)];
    ext.forEach((p, i) => {
      const pp = perp(Math.min(Math.max(i - 1, 0), 3));
      trackPts.push(p.clone().addScaledVector(pp, S03.row.trackOffsetM));
    });
    g.strokeStyle = '#d0c198';
    g.lineWidth = S03.row.trackWidthM * (W / (WORLD_RECT.x1 - WORLD_RECT.x0));
    g.lineJoin = 'round';
    g.beginPath();
    trackPts.forEach((p, i) => (i ? g.lineTo(cx(p.x), cy(p.z)) : g.moveTo(cx(p.x), cy(p.z))));
    g.stroke();
    g.strokeStyle = 'rgba(86,70,46,0.85)';
    g.lineWidth = Math.max(2, pxm * 0.55);
    for (const off of [-0.8, 0.8]) {
      g.beginPath();
      trackPts.forEach((p, i) => {
        const pp = perp(Math.min(Math.max(i - 1, 0), 3));
        const q = p.clone().addScaledVector(pp, off);
        i ? g.lineTo(cx(q.x), cy(q.z)) : g.moveTo(cx(q.x), cy(q.z));
      });
      g.stroke();
    }
  }
  // crossing road under span 2, along X at z = 600
  g.fillStyle = '#cbbd97';
  g.fillRect(cx(WORLD_RECT.x0), cy(597.5), cx(WORLD_RECT.x1) - cx(WORLD_RECT.x0), cy(602.5) - cy(597.5));
  g.strokeStyle = 'rgba(96,80,54,0.7)'; g.lineWidth = Math.max(2, pxm * 0.5);
  for (const dz of [-0.8, 0.8]) {
    g.beginPath(); g.moveTo(cx(WORLD_RECT.x0), cy(600 + dz)); g.lineTo(cx(WORLD_RECT.x1), cy(600 + dz)); g.stroke();
  }
  // distant tree lines on the horizon edges
  g.fillStyle = 'rgba(70,80,45,0.85)';
  for (let i = 0; i < 260; i++) {
    const edge = rnd();
    const x = edge < 0.5 ? WORLD_RECT.x0 + rnd() * 60 : WORLD_RECT.x1 - rnd() * 60;
    const z = WORLD_RECT.z0 + rnd() * (WORLD_RECT.z1 - WORLD_RECT.z0);
    g.beginPath(); g.arc(cx(x), cy(z), (6 + rnd() * 12) * (W / 2048), 0, 7); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ------------------------------------------------------------------- scene ---

export function buildTerrain() {
  const group = new THREE.Group();
  group.name = 's03-terrain';

  const W = WORLD_RECT.x1 - WORLD_RECT.x0, D = WORLD_RECT.z1 - WORLD_RECT.z0;
  const geo = new THREE.PlaneGeometry(W, D, 170, 210);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i) + (WORLD_RECT.x0 + W / 2);
    const wz = pos.getZ(i) + (WORLD_RECT.z0 + D / 2);
    pos.setY(i, groundHeight(wx, wz));
  }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: groundTexture(), roughness: 1, metalness: 0,
  }));
  ground.position.set(WORLD_RECT.x0 + W / 2, 0, WORLD_RECT.z0 + D / 2);
  ground.receiveShadow = true;
  group.add(ground);

  // scrub bushes — outside the RoW, in the hundreds: thick near
  // the corridor, thinning out into the far fields, olive-dark
  let seed = 31;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const scrubGeom = new THREE.IcosahedronGeometry(0.55, 0);
  const scrubMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  const SCRUB_N = 720;
  const scrub = new THREE.InstancedMesh(scrubGeom, scrubMat, SCRUB_N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const col = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < SCRUB_N && guard++ < 60000) {
    const x = -460 + rnd() * 1340, z = -220 + rnd() * 1920;
    const { d } = closestOnCorridor(x, z);
    if (d < 26) continue;
    if (Math.abs(z - 600) < 6) continue;
    if (rnd() > THREE.MathUtils.clamp(1.5 - d / 160, 0.12, 1)) continue;
    e.set(0, rnd() * Math.PI, 0); q.setFromEuler(e);
    const s = 0.7 + rnd() * 2.4;
    m4.compose(new THREE.Vector3(x, groundHeight(x, z) + 0.15, z), q,
      new THREE.Vector3(s, s * (0.45 + rnd() * 0.3), s));
    scrub.setMatrixAt(placed, m4);
    col.setHSL(0.21 + rnd() * 0.04, 0.35, 0.17 + rnd() * 0.09);
    scrub.setColorAt(placed, col);
    placed++;
  }
  scrub.count = placed;
  scrub.instanceMatrix.needsUpdate = true;
  if (scrub.instanceColor) scrub.instanceColor.needsUpdate = true;
  scrub.castShadow = true;
  group.add(scrub);

  // lone trees, all outside the RoW, varied in size
  const trunkMat = new THREE.MeshStandardMaterial({ color: PALETTE.soil, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x55663a, roughness: 1 });
  for (const [tx, tz] of [[-90, 150], [150, 560], [335, 906], [172, 982],
    [-160, 420], [120, 240], [-70, 760], [430, 1150], [260, 1330], [-120, -60]]) {
    const tree = new THREE.Group();
    const gy = groundHeight(tx, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.6, 7), trunkMat);
    trunk.position.y = 1.3;
    tree.add(trunk);
    for (const [ox, oy, oz, r] of [[0, 3.4, 0, 2.1], [1.1, 2.8, 0.4, 1.5], [-1.0, 2.9, -0.5, 1.4]]) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMat);
      blob.position.set(ox, oy, oz);
      blob.scale.y = 0.75;
      blob.castShadow = true;
      tree.add(blob);
    }
    tree.position.set(tx, gy, tz);
    tree.scale.setScalar(0.85 + rnd() * 0.5);
    group.add(tree);
  }
  return group;
}

// Sky dome: warm hazy horizon rising to pale blue.
export function buildSky() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#8fb8e6');
  grad.addColorStop(0.42, '#c8d9e8');
  grad.addColorStop(0.52, '#f2e3c2');
  grad.addColorStop(0.56, '#e9dfc8');
  grad.addColorStop(1, '#ddd2b8');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3600, 24, 14),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -1;
  return dome;
}
