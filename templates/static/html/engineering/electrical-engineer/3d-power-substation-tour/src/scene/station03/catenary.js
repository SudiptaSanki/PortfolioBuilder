// catenary.js — the true catenary, per the inventory's sag maths.
// A freely suspended conductor follows y = c·[cosh(x/c) − 1] with
// c = H/w. The scene is strung at the hot condition (75 °C, H ≈ 27.5 kN
// per Moose sub-conductor): S = wL²/8H ≈ 14.3 m on the 400 m ruling
// span. We solve c from the wanted sag and span, then sample the cosh
// curve itself — never a straight line, never a guessed parabola.

import * as THREE from 'three';

// Solve the catenary constant c for horizontal span L and mid-span
// sag S:  S = c·(cosh(L/2c) − 1).  f(c) is monotonically decreasing,
// so bisection is safe.
export function solveC(L, S) {
  const f = (c) => c * (Math.cosh(L / (2 * c)) - 1) - S;
  let lo = 0.05, hi = 1;
  while (f(hi) > 0 && hi < 1e9) hi *= 4;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Point on the catenary between A and B at parameter t ∈ [0,1].
// The drop is measured from the chord AB: drop(t) = c·(cosh(L/2c) −
// cosh((t−½)L/c)), zero at both ends, S at mid-span.
export function catenaryPoint(A, B, c, t, out) {
  const Lh = Math.hypot(B.x - A.x, B.z - A.z);
  const u = (t - 0.5) * Lh;
  const drop = c * (Math.cosh(Lh / (2 * c)) - Math.cosh(u / c));
  out.set(
    A.x + (B.x - A.x) * t,
    A.y + (B.y - A.y) * t - drop,
    A.z + (B.z - A.z) * t,
  );
  return out;
}

// A THREE.Curve wrapping the catenary, for TubeGeometry.
export class CatenaryCurve extends THREE.Curve {
  constructor(A, B, sag) {
    super();
    this.A = A.clone(); this.B = B.clone();
    const Lh = Math.hypot(B.x - A.x, B.z - A.z);
    this.c = solveC(Math.max(Lh, 0.01), sag);
  }
  getPoint(t, target = new THREE.Vector3()) {
    return catenaryPoint(this.A, this.B, this.c, t, target);
  }
}

// Tube along the catenary between A and B with the given sag.
export function catenaryTube(A, B, sag, radius, material, segments = 64) {
  const curve = new CatenaryCurve(A, B, sag);
  const geom = new THREE.TubeGeometry(curve, segments, radius, 5, false);
  const mesh = new THREE.Mesh(geom, material);
  mesh.userData.curve = curve;
  return mesh;
}

// Bundle frame for a span direction: side/up vectors so the 457 mm
// square stays upright along the span.
export function bundleFrame(dir) {
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(up, dir).normalize();
  return { side, up };
}

// The four sub-conductor offsets of the quad bundle (457 mm square).
export function bundleOffsets(frame, half = 0.2285) {
  const o = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    o.push(new THREE.Vector3()
      .addScaledVector(frame.side, sx * half)
      .addScaledVector(frame.up, sy * half));
  }
  return o;
}
