// towers.js — the line's layout and its two tower types.
// Layout: T-214 (suspension) at the origin, line running +Z; T-215
// (tension) at 400 m, where the corridor turns 25°; T-216/217/218
// (suspension) at 400 m intervals along the turned direction — five
// towers, four true 400 m spans, ~1.6 km of corridor.
// Towers are generated as member lists (legs, struts, bracing, arm
// trusses following the CBIP proportions in the inventory) and drawn
// as one InstancedMesh of unit boxes per tower.

import * as THREE from 'three';
import { PALETTE, SURFACE, STATION03 } from '../../config/world.js';
import { mergeGeoms, membersToInstanced } from './geom.js';

const S03 = STATION03;
const BEND = THREE.MathUtils.degToRad(S03.bendDeg);
export const DIR2 = new THREE.Vector3(Math.sin(BEND), 0, Math.cos(BEND));

function towerEntry(id, type, pos, yaw) {
  const matrix = new THREE.Matrix4().makeRotationY(yaw).setPosition(pos);
  return { id, type, pos: pos.clone(), yaw, matrix };
}

export const TOWERS = [
  towerEntry('T-214', 'suspension', new THREE.Vector3(0, 0, 0), 0),
  towerEntry('T-215', 'tension', new THREE.Vector3(0, 0, 400), BEND / 2),
  towerEntry('T-216', 'suspension', new THREE.Vector3(0, 0, 400).addScaledVector(DIR2, 400), BEND),
  towerEntry('T-217', 'suspension', new THREE.Vector3(0, 0, 400).addScaledVector(DIR2, 800), BEND),
  towerEntry('T-218', 'suspension', new THREE.Vector3(0, 0, 400).addScaledVector(DIR2, 1200), BEND),
];

export function spanDir(i) {
  return TOWERS[i + 1].pos.clone().sub(TOWERS[i].pos).normalize();
}

const LEVELS = S03.towers.armLevelsM;
export const midOffset = (lvl) => (lvl === 1 ? S03.towers.midArmOffsetM : 0);

function localToWorld(t, x, y, z) {
  return new THREE.Vector3(x, y, z).applyMatrix4(t.matrix);
}

// Suspension string top (arm-tip underside) and clamp point (4.6 m set below).
export const stringTopWorld = (t, side, lvl) =>
  localToWorld(t, side * S03.towers.attachOffsetM, LEVELS[lvl], midOffset(lvl));
export const clampWorld = (t, side, lvl) =>
  localToWorld(t, side * S03.towers.attachOffsetM, LEVELS[lvl] - S03.string.setLengthM, midOffset(lvl));
// Tension tower arm tip, and the dead-end where the conductor's
// catenary actually starts (strain set runs 5.2 m out along the span).
export const tensionTipWorld = (t, side, lvl) =>
  localToWorld(t, side * S03.towers.tensionAttachOffsetM, LEVELS[lvl], midOffset(lvl));
export function tensionDeadEndWorld(t, side, lvl, spanIdx) {
  const away = spanIdx >= 1 && TOWERS.indexOf(t) === spanIdx
    ? spanDir(spanIdx)
    : spanDir(spanIdx).negate();
  const p = tensionTipWorld(t, side, lvl).addScaledVector(away, S03.string.strainLengthM);
  p.y -= 0.35;
  return p;
}
export const peakWorld = (t) =>
  localToWorld(t, 0, t.type === 'tension' ? S03.towers.tensionHeightM : S03.towers.suspensionHeightM, 0);

// ---------------------------------------------------------------- towers ---

function profileFn(points) {
  return (y) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [y0, h0] = points[i], [y1, h1] = points[i + 1];
      if (y <= y1) return h0 + (h1 - h0) * ((y - y0) / (y1 - y0));
    }
    return points[points.length - 1][1];
  };
}

const CORNERS = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

function towerMembers(type) {
  const susp = type === 'suspension';
  const hw = profileFn(susp
    ? [[0, 5.2], [12, 3.85], [24, 2.3], [36, 2.18], [42, 2.12], [46, 1.15], [49, 0.42]]
    : [[0, 6.75], [12, 5.0], [24, 3.1], [36, 2.85], [42, 2.75], [46, 1.6], [48, 0.6]]);
  const H = susp ? 49 : 48;
  const panels = [0.35, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 43, 46, H];
  const M = [];
  const add = (ax, ay, az, bx, by, bz, t) =>
    M.push({ a: new THREE.Vector3(ax, ay, az), b: new THREE.Vector3(bx, by, bz), t });
  const cornerAt = (c, y) => [CORNERS[c][0] * hw(y), y, CORNERS[c][1] * hw(y)];

  // legs
  for (let c = 0; c < 4; c++) {
    for (let i = 0; i < panels.length - 1; i++) {
      const [ax, ay, az] = cornerAt(c, panels[i]);
      const [bx, by, bz] = cornerAt(c, panels[i + 1]);
      add(ax, ay, az, bx, by, bz, THREE.MathUtils.lerp(susp ? 0.17 : 0.21, susp ? 0.085 : 0.10, panels[i] / H));
    }
  }
  // face struts + bracing
  for (let i = 0; i < panels.length; i++) {
    const y = panels[i];
    if (i > 0) for (let f = 0; f < 4; f++) {
      const [ax, , az] = cornerAt(f, y), [bx, , bz] = cornerAt((f + 1) % 4, y);
      add(ax, y, az, bx, y, bz, 0.075);
    }
    if (i === panels.length - 1) break;
    const y0 = panels[i], y1 = panels[i + 1], midY = (y0 + y1) / 2;
    for (let f = 0; f < 4; f++) {
      const A = cornerAt(f, y0), B = cornerAt((f + 1) % 4, y0);
      const A1 = cornerAt(f, y1), B1 = cornerAt((f + 1) % 4, y1);
      if (midY < 24) {           // X-braced legs; tension tower adds a mid strut
        add(...A, ...B1, 0.065); add(...B, ...A1, 0.065);
        if (!susp) {
          const Am = cornerAt(f, midY), Bm = cornerAt((f + 1) % 4, midY);
          add(...Am, ...Bm, 0.07);
        }
      } else if ((i + f) % 2 === 0) add(...A, ...B1, 0.06);
      else add(...B, ...A1, 0.06);
    }
  }
  // waist diaphragm (plan X at 24 m)
  {
    const [ax, , az] = cornerAt(0, 24), [bx, , bz] = cornerAt(2, 24);
    const [cx, , cz] = cornerAt(1, 24), [dx, , dz] = cornerAt(3, 24);
    add(ax, 24, az, bx, 24, bz, 0.07); add(cx, 24, cz, dx, 24, dz, 0.07);
  }
  // cross-arms
  const stations = susp ? [1.9, 3.8, 5.7, 7.7] : [2.3, 4.4, 6.2, 7.0];
  const planeZ = susp ? 0.42 : 0.5;
  const rootDepth = susp ? 1.35 : 1.9, tipDepth = susp ? 0.5 : 0.8;
  LEVELS.forEach((L, lvl) => {
    const zo = midOffset(lvl);
    // plan X bracing inside the cage at arm level
    const h = hw(L);
    add(h, L, h, -h, L, -h, 0.06); add(h, L, -h, -h, L, h, 0.06);
    for (const s of [-1, 1]) {
      const topY = (x) => L + rootDepth - ((x - stations[0]) / (stations[stations.length - 1] - stations[0])) * (rootDepth - tipDepth);
      for (const pz of [-planeZ, planeZ]) {
        const z = zo + pz;
        for (let i = 0; i < stations.length - 1; i++) {
          const x0 = s * stations[i], x1 = s * stations[i + 1];
          add(x0, L, z, x1, L, z, 0.085);                       // bottom chord
          add(x0, topY(stations[i]), z, x1, topY(stations[i + 1]), z, 0.075); // top chord
          if (i % 2 === 0) add(x0, L, z, x1, topY(stations[i + 1]), z, 0.05);
          else add(x0, topY(stations[i]), z, x1, L, z, 0.05);
        }
        for (const st of stations) add(s * st, L, z, s * st, topY(st), z, 0.05); // verticals
      }
      for (const st of stations) {                              // transverse ties
        add(s * st, L, zo - planeZ, s * st, L, zo + planeZ, 0.05);
      }
      const attachX = s * (susp ? S03.towers.attachOffsetM : S03.towers.tensionAttachOffsetM);
      add(attachX, L - 0.3, zo, attachX, L + 0.1, zo, 0.07);     // attachment lug
    }
  });
  return { members: M, hw };
}

// ------------------------------------------------------------- small parts ---

function textPlate(w, h, px, draw) {
  const c = document.createElement('canvas');
  c.width = px[0]; c.height = px[1];
  draw(c.getContext('2d'), px[0], px[1]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide }));
}

function dangerPlate() {
  return textPlate(0.95, 0.63, [512, 340], (g, w, h) => {
    g.fillStyle = '#ece9e0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b03028'; g.fillRect(0, 0, w, 128);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = '700 84px Arial';
    g.fillText('DANGER', w / 2, 94);
    g.fillStyle = '#1c1e20'; g.font = '700 62px Arial';
    g.fillText('400,000 VOLTS', w / 2, 218);
    g.font = '600 36px Arial'; g.fillStyle = '#5a6068';
    g.fillText('AUTHORISED STAFF ONLY', w / 2, 288);
  });
}
function numberPlate(id) {
  return textPlate(0.85, 0.42, [512, 256], (g, w, h) => {
    g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1c1e20'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#1c1e20'; g.textAlign = 'center'; g.font = '700 138px Arial';
    g.fillText(id, w / 2, h / 2 + 52);
  });
}
function circuitPlate(txt) {
  return textPlate(0.55, 0.23, [384, 160], (g, w, h) => {
    g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1e20'; g.textAlign = 'center'; g.font = '700 84px Arial';
    g.fillText(txt, w / 2, h / 2 + 30);
  });
}

export function buildTower(t) {
  const susp = t.type === 'suspension';
  const group = new THREE.Group();
  group.name = `s03-${t.id}`;
  const { members, hw } = towerMembers(t.type);
  // Weathered galvanising must read mid-grey, never a black
  // silhouette: a light base with LOW metalness, so the hemisphere
  // sky/ground fill does the shading (bare metal with no env map
  // to reflect renders near-black in backlight).
  const steelMat = new THREE.MeshStandardMaterial({
    color: PALETTE.galvanised, roughness: 0.6, metalness: 0.15,
  });
  const lattice = membersToInstanced(members, steelMat);
  lattice.castShadow = true; lattice.receiveShadow = true;
  group.add(lattice);

  const concMat = new THREE.MeshStandardMaterial({ color: PALETTE.concrete, ...SURFACE.concrete });
  const gravelMat = new THREE.MeshStandardMaterial({ color: PALETTE.gravel, roughness: 0.95, metalness: 0 });
  // gravel apron + four chimney footings
  const apronSize = susp ? 12.5 : 17;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(apronSize, 0.14, apronSize), gravelMat);
  apron.position.y = 0.07; apron.receiveShadow = true;
  group.add(apron);
  const hw0 = hw(0.35);
  for (const [sx, sz] of CORNERS) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 1.3), concMat);
    plinth.position.set(sx * hw0, 0.09, sz * hw0);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.95), concMat);
    chimney.position.set(sx * hw0, 0.3, sz * hw0);
    chimney.castShadow = true;
    group.add(plinth, chimney);
  }
  // peak cap + earth lug
  const H = susp ? 49 : 48;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), steelMat);
  cap.position.y = H + 0.05;
  group.add(cap);

  // plates on the approach face (−Z local)
  const hwAt = (y) => hw(y);
  const danger = dangerPlate();
  danger.position.set(0, 3.1, -(hwAt(3.1) + 0.06));
  danger.rotation.y = Math.PI;
  const num = numberPlate(t.id);
  num.position.set(1.35, 3.85, -(hwAt(3.85) + 0.06));
  num.rotation.y = Math.PI;
  group.add(danger, num);
  // circuit plates on the cage faces
  const c1 = circuitPlate('CKT-I'); c1.position.set(hwAt(20) + 0.05, 20, 0); c1.rotation.y = Math.PI / 2;
  const c2 = circuitPlate('CKT-II'); c2.position.set(-(hwAt(20) + 0.05), 20, 0); c2.rotation.y = -Math.PI / 2;
  group.add(c1, c2);
  // No discs floating at the arm tips: unattached, they read as
  // finials/balls. The line's aviation markers live where they
  // belong — on the earth wire at the road crossing (conductors.js).

  // hero details — step bolts, anti-climb guards, earthing lead (near towers)
  if (t.id === 'T-214' || t.id === 'T-215') {
    const darkMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, roughness: 0.6, metalness: 0.6 });
    const parts = [];
    const box = (w, h, d, x, y, z) => parts.push({
      geom: new THREE.BoxGeometry(w, h, d),
      matrix: new THREE.Matrix4().makeTranslation(x, y, z),
    });
    // step bolts up the (1,−1) leg
    for (let y = 3.8; y < 45; y += 0.45) {
      const h = hw(y);
      box(0.2, 0.03, 0.05, h - 0.08, y, -h + 0.14);
    }
    // anti-climb guard frames on all four legs, 1.0–3.5 m
    for (const [sx, sz] of CORNERS) {
      for (let i = -1; i <= 1; i++) {
        const off = i * 0.26;
        box(0.025, 2.5, 0.025, sx * hw(2.2) + sz * off * 0.7, 2.25, sz * hw(2.2) - sx * off * 0.7);
      }
      for (const gy of [1.2, 2.25, 3.3]) {
        box(0.55, 0.025, 0.025, sx * hw(gy), gy, sz * hw(gy));
      }
    }
    const guard = new THREE.Mesh(mergeGeoms(parts), darkMat);
    group.add(guard);
    // earthing lead down the (−1,−1) leg + earth pit
    const lead = [];
    const pts = [0.35, 8, 16, 24, 32, 40, H - 1];
    for (let i = 0; i < pts.length - 1; i++) {
      lead.push({
        a: new THREE.Vector3(-hw(pts[i]) - 0.05, pts[i], -hw(pts[i]) - 0.05),
        b: new THREE.Vector3(-hw(pts[i + 1]) - 0.05, pts[i + 1], -hw(pts[i + 1]) - 0.05),
        t: 0.025,
      });
    }
    group.add(membersToInstanced(lead, darkMat));
    const pit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), concMat);
    pit.position.set(-(hw0 + 0.9), 0.12, -(hw0 + 0.9));
    group.add(pit);
  }

  group.position.copy(t.pos);
  group.rotation.y = t.yaw;
  return group;
}
