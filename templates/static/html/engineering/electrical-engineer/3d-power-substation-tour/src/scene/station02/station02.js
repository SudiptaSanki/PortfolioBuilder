// station02.js — assembly of the Substation Yard (inventory §3):
// 132/33 kV Meridian Road, 06:04, double bus at the band's north side,
// five bays at 12.2 m pitch (FDR-1 · T-1 · BUS COUPLER · T-2 · FDR-2),
// transformers south of the band, fire wall between them, 33 kV
// interface at the south edge, future bay at the east end.

import * as THREE from 'three';
import { STATION02 } from '../../config/world.js';
import { MAT, box, cyl, grp, signPlate, conductor, tube, catenaryPts, V3 } from './helpers.js';
import { createTransformer } from './transformer.js';
import { makeBreaker, makeDisconnector, makeCT, makeCVT, makeArrester, makeWaveTrap, makeKiosk, makePortal, latticeMast, discString } from './baykit.js';
import { createYard } from './yard.js';

const S = STATION02;
const PHASES = [ // dx across the bay, bus phase z for bus1 / bus2
  { dx: -2.8, b1: -5.0, b2: -14.0 },
  { dx: 0.0, b1: -8.0, b2: -17.0 },
  { dx: 2.8, b1: -11.0, b2: -20.0 },
];
const BUS_Z = [-5, -8, -11, -14, -17, -20];
const Z = { ds: -2.4, cb: 0.6, lds: 3.2, ct: 5.0, arr: 6.4, cvt: 7.6 };

function jump(a, b, sag = 0.12) { return conductor(V3(...a), V3(...b), sag); }

export function createStation02() {
  const G = grp();
  const fans = [];
  G.add(createYard());

  // ---- bus support portals (z-spanning) + strain bus (§6.1) ----------
  for (const px of [-30.5, 0, 30.5]) {
    for (const mz of [-21, -3]) {
      const m = latticeMast(8.9, 0.6); m.position.set(px, 0, mz); G.add(m);
    }
    const beam = grp(px, 9.8, -21);
    const bb = box(0.09, 0.09, 18.4, MAT.galv, 0, 0, 9.2); beam.add(bb);
    const bb2 = box(0.09, 0.09, 18.4, MAT.galv, 0, -0.8, 9.2); beam.add(bb2);
    for (let i = 0; i <= 10; i++) beam.add(box(0.05, 0.8, 0.05, MAT.galv, 0, -0.4, i * 1.84));
    G.add(beam);
    for (const cz of BUS_Z) { const s = discString(5); s.position.set(px, 9.75, cz); G.add(s); }
  }
  for (const cz of BUS_Z) {
    const older = cz <= -14; // bus-2 sags slightly more (§6.1)
    G.add(conductor(V3(-30.5, 9.0, cz), V3(0, 9.0, cz), older ? 0.68 : 0.61, 0.0157));
    G.add(conductor(V3(0, 9.0, cz), V3(30.5, 9.0, cz), older ? 0.68 : 0.61, 0.0157));
  }

  // ---- transformers (§4) ----------------------------------------------
  const t1 = createTransformer({ id: 'T-1', tap: 6, fansRunning: false, oti: 54, wtiMax: 63, breatherPink: true, birdSpikes: false });
  t1.position.set(-12.2, 0, 12.0); G.add(t1);
  const t2 = createTransformer({ id: 'T-2', tap: 7, fansRunning: true, oti: 61, wtiMax: 71, breatherPink: false, birdSpikes: true });
  t2.position.set(12.2, 0, 12.0); G.add(t2);
  fans.push(...t1.userData.fans, ...t2.userData.fans);

  // ---- the five bays (§5, §12) -----------------------------------------
  const bayDefs = [
    { x: -24.4, kind: 'line', board: '132 kV FDR-1 — NORTH CITY', kiosk: 'BAY 1 — FDR-1', cbOps: 4812, arrCount: 16, permit: true },
    { x: -12.2, kind: 'xfmr', board: 'T-1 · 50 MVA', kiosk: 'BAY 2 — T-1', cbOps: 3304, arrCount: 16, ctRatio: '300–150/1 A' },
    { x: 0, kind: 'coupler', board: 'BUS COUPLER', kiosk: 'BAY 3 — BUS COUPLER', cbOps: 1977, arrCount: 16 },
    { x: 12.2, kind: 'xfmr', board: 'T-2 · 50 MVA', kiosk: 'BAY 4 — T-2', cbOps: 3311, arrCount: 16, ctRatio: '300–150/1 A' },
    { x: 24.4, kind: 'line', board: '132 kV FDR-2 — CITY CENTRE', kiosk: 'BAY 5 — FDR-2', cbOps: 4813, arrCount: 17 },
  ];
  for (const bay of bayDefs) {
    const B = grp(bay.x, 0, 0);
    const ds = makeDisconnector({ mode: 'closed' }); ds.position.z = Z.ds; B.add(ds);
    const cb = makeBreaker({ counter: bay.cbOps }); cb.position.z = Z.cb; B.add(cb);
    // bus droppers: bus-1 direct, bus-2 via a high span then a drop (§6.2)
    for (const ph of PHASES) {
      B.add(jump([ph.dx, 9.0, ph.b1], [ph.dx, 3.35, Z.ds - 0.95], 0.3));
      B.add(jump([ph.dx, 9.0, ph.b2], [ph.dx, 8.55, Z.ds - 1.8], 0.28));
      B.add(jump([ph.dx, 8.55, Z.ds - 1.8], [ph.dx, 3.35, Z.ds - 0.95], 0.05));
      const bx = ph.dx * (1.7 / 2.8);
      B.add(jump([ph.dx, 3.32, Z.ds + 0.95], [bx, 4.8, Z.cb - 0.55], 0.12)); // DS -> CB
    }
    if (bay.kind !== 'coupler') {
      const lds = makeDisconnector({ mode: 'closed' }); lds.position.z = Z.lds; B.add(lds);
      const ct = makeCT({ ratio: bay.ctRatio || '800–400/1 A' }); ct.position.z = Z.ct; B.add(ct);
      const arr = makeArrester({ count: bay.arrCount }); arr.position.z = Z.arr; B.add(arr);
      for (const ph of PHASES) {
        const bx = ph.dx * (1.7 / 2.8);
        B.add(jump([bx, 4.8, Z.cb + 0.55], [ph.dx, 3.32, Z.lds - 0.95], 0.12)); // CB -> line DS
        B.add(jump([ph.dx, 3.32, Z.lds + 0.95], [ph.dx, 4.2, Z.ct - 0.5], 0.08)); // DS -> CT
        B.add(jump([ph.dx, 4.2, Z.ct + 0.5], [ph.dx, 5.0, Z.arr], 0.1)); // CT -> arrester
      }
      if (bay.kind === 'line') {
        const cvt = makeCVT(); cvt.position.z = Z.cvt; B.add(cvt);
        for (const ph of PHASES)
          B.add(jump([ph.dx, 4.2, Z.ct + 0.5], [ph.dx, 4.43, Z.cvt], 0.12)); // CT -> CVT
        // take-off portal + line spans to the entry gantry (§3, §5.6)
        const portal = makePortal({ span: 9, height: 9.8 }); portal.position.z = 8.6; B.add(portal);
        const entry = makePortal({ span: 12.2, height: 11.5, peak: true }); entry.position.z = -21.8; B.add(entry);
        for (const ph of PHASES) {
          G.add(jump([bay.x + ph.dx, 11.3, -21.8], [bay.x + ph.dx, 9.8, 8.6], 0.55));
          G.add(jump([bay.x + ph.dx, 11.3, -21.8], [bay.x + ph.dx, 11.9, -40], 0.8)); // out to Station 03
          B.add(jump([ph.dx, 9.8, 8.6], [ph.dx, 4.43, Z.cvt], 0.15)); // drop to CVT
          const trap = makeWaveTrap(); trap.position.set(ph.dx, 10.35, -19.2); B.add(trap);
          const s = discString(5); s.position.set(ph.dx, 11.45, -21.8); B.add(s);
        }
        G.add(jump([bay.x, 12.3, -21.8], [bay.x, 12.6, -40], 0.5)); // shield wire out
        B.add(box(0.06, 6, 0.012, MAT.copperOld, -5.9, 3, -21.6)); // shield down-lead
      }
      if (bay.kind === 'xfmr') {
        const tx = bay.x === -12.2 ? t1 : t2;
        tx.userData.hvLugs.forEach(([lx, ly, lz], i) => {
          const ph = PHASES[i];
          B.add(jump([ph.dx, 4.2, Z.ct + 0.5], [lx, ly, 12.0 + lz], 0.4)); // CT -> HV bushing palms
        });
      }
    } else {
      // bus coupler: bus VT set (§5.4) fed from bus-1
      const cvt = makeCVT(); cvt.position.set(3.6, 0, Z.ct); G.add(cvt);
      PHASES.forEach((ph, i) => {
        const px = 3.6 + ph.dx;
        G.add(jump([px, 9.0, ph.b1], [px, 4.43, Z.ct], 0.3));
        void i;
      });
    }
    const kiosk = makeKiosk({ label: bay.kiosk, permit: !!bay.permit });
    kiosk.position.set(bay.x + 4.6, 0, 7.9); G.add(kiosk);
    const post = grp(bay.x - 4.6, 0, 7.9);
    post.add(box(0.06, 1.7, 0.06, MAT.galv, 0, 0.85, 0));
    const bb = signPlate(0.78, 0.2, [bay.board], { px: [896, 224] });
    bb.position.set(0, 1.6, 0.05); post.add(bb);
    G.add(post);
    G.add(B);
  }

  // ---- future bay: disconnector + CLOSED earth switch (§12 note) ------
  const fb = grp(30.5, 0, 0.6);
  const fds = makeDisconnector({ mode: 'earthed' }); fb.add(fds);
  const fbb = signPlate(0.7, 0.18, ['FUTURE BAY'], { px: [640, 176] });
  fbb.position.set(0, 1.6, 2.2); fb.add(fbb);
  fb.add(box(0.06, 1.7, 0.06, MAT.galv, 0, 0.85, 2.2));
  G.add(fb);

  // ---- 33 kV interface (§5.7): rigid tube bus, sealing ends ------------
  const lvGantry = makePortal({ span: 30, height: 7.6 }); lvGantry.position.z = 18.2; G.add(lvGantry);
  for (const tx of [t1, t2]) {
    const txX = tx.position.x;
    tx.userData.lvLugs.forEach(([lx, ly, lz]) => {
      const wx = txX + lx, wz = 12.0 + lz;
      G.add(tube([V3(wx, ly, wz), V3(wx, 6.5, 13.6)], 0.028, MAT.conductor, 6)); // riser
      G.add(tube([V3(wx, 6.5, 13.6), V3(wx, 6.5, 18.3)], 0.04, MAT.conductor, 4)); // tube bus Ø80
      const post = latticeMast(6.42, 0.34); post.position.set(wx, 0, 15.9); G.add(post);
      G.add(box(0.3, 0.06, 0.3, MAT.galv, wx, 6.45, 15.9));
      // cable sealing end: black termination, red stress cone, cable to trench
      G.add(cyl(0.055, 0.065, 0.72, MAT.black, wx, 5.95, 18.55, 10));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 10), MAT.redPaint);
      cone.position.set(wx, 6.36, 18.55); cone.castShadow = true; G.add(cone);
      G.add(tube([V3(wx, 5.6, 18.55), V3(wx, 2.8, 18.9), V3(wx, 0.06, 19.4)], 0.026, MAT.black, 10));
    });
  }
  const lvArr = makeArrester({ small: true }); lvArr.position.set(-17.5, 0, 16.6); G.add(lvArr);

  // ---- one flow system: morning dust motes in the light (§SCAFFOLD 4) --
  const N = 650;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = -34 + Math.random() * 68;
    pos[i * 3 + 1] = 0.2 + Math.random() * 6.5;
    pos[i * 3 + 2] = -22 + Math.random() * 44;
    seed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uScale: { value: 900 } },
    vertexShader: `
      attribute float aSeed; uniform float uTime; uniform float uScale; varying float vA;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.10 + aSeed * 17.0) * 0.9;
        p.y += sin(uTime * 0.06 + aSeed * 29.0) * 0.35;
        p.z += cos(uTime * 0.08 + aSeed * 23.0) * 0.9;
        vA = 0.4 + 0.6 * fract(aSeed * 7.31);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uScale * 0.028 / -mv.z, 1.0, 7.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d) * 0.14 * vA;
        gl_FragColor = vec4(1.0, 0.97, 0.9, a);
      }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  G.add(dust);

  G.userData.update = (t) => {
    dustMat.uniforms.uTime.value = t;
    for (const f of fans) if (f.running) f.blades.rotation.y = t * 7.5;
  };
  G.userData.setProjFactor = (f) => { dustMat.uniforms.uScale.value = f; };
  return G;
}

export function station02Anchors() {
  return {
    'transformer-t2': { position: [18.3, 2.4, 18.6], target: [12.2, 2.8, 12.0] },
    'nameplate-t2': { position: [12.6, 2.3, 15.4], target: [12.55, 2.35, 13.1] },
    'buchholz-t2': { position: [15.9, 5.7, 9.4], target: [13.4, 5.4, 12.85] },
    'breaker-fdr2': { position: [27.6, 2.0, 4.6], target: [24.4, 3.4, 0.6] },
    'wave-trap-fdr1': { position: [-18.5, 8.8, -12.5], target: [-24.4, 10.4, -19.2] },
    'firewall': { position: [-6.5, 1.8, 22.6], target: [0.5, 4.8, 9.0] },
    'bus': { position: [-33.5, 1.7, -12.5], target: [15, 7.5, -12.5] },
    'future-bay-earth': { position: [33.6, 1.7, 4.6], target: [30.5, 2.0, 0.6] },
    'control-building': { position: [17.5, 1.8, 13.0], target: [24.0, 2.2, 18.0] },
    'lv-interface': { position: [7.5, 2.0, 21.8], target: [12.2, 5.6, 17.6] },
  };
}
