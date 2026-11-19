// station05-main.js — standalone verification entry for Station 05.
// Boots ONLY the Mesh Hall (no journey, no portfolio UI) so each
// camera pose can be render-checked in isolation:
//   station05.html?view=overview|dais|nodes|switchboard|gate|lane
// Renderer pattern mirrors src/main.js (ACES + sRGB, __rendered
// after 3 frames). The animation clock accumulates clamped frame
// deltas and freezes while the tab is hidden, so the traffic and
// the canary cycle pause instead of jumping when the visitor returns.

import * as THREE from 'three';
import { createStation05 } from './scene/station05/station05.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses — the inventory's six journey stops. Every one inside
// the room, off the furniture, in the flight corridors (the centre
// aisle, the lane-side walkway, west of the gate): never through
// the plant (the Station 03 journey lesson). Fix loop 1 framing:
// overview reads the hall story from the south-west (dais left,
// nodes centre, lanes right, gate right-of-centre — no upright
// dead-centre); dais is a front three-quarter holding all four
// consoles + the manifest lectern; nodes stands at the aisle's
// west mouth, not inside the capsules; switchboard pulls back to
// frame the whole panel with margin; gate stands north-west of
// the gate so the drum, vane and diverging lanes are the subject
// (the analysis lectern drops to the frame's lower-left edge).
// Fix loop 2: switchboard is centred on the panel's measured
// centre (x 2.5 — face spans 0.4–4.6) and pulled back to the
// aisle's east end, so the full 4.25 m board + fascia fit with
// ~0.74 m margin per side at 1440×900.
// Fix loop 3: the tray drop column moved off the drum (z 1.95 →
// 1.35, beside the gate's north post; the gate header plate moved
// with it), so the drum face is now whole from the west. The gate
// pose stands west-northwest of the gate, high enough that the
// face's bottom-row sightlines clear the analysis lectern's
// board top edge by ~5 cm: all 15 face samples clear, the face
// renders ~122 px tall at a 39° viewing angle, the header plate
// and both full lanes are in frame, and the vane's blade mid/tip
// and stripe tip show below the drum (its root and lower edge
// stay behind the drum body and lectern board from any western
// viewpoint that keeps the face whole — swept and confirmed).
// Fix loop 4: loop 2's switchboard framing math held for an
// empty frustum but not for the room — from [2.5, 1.78, 0.1]
// NODE 2's rack stands in the left foreground and eats the
// panel's west end (all four service names occluded, the
// fascia's SW corner and both route lines cut). The pose now
// stands east and higher, over the aisle's east end, so the
// sightlines to the west end pass east of NODE 2 and then
// north of it, never over its footprint: a full occlusion
// sweep (four racks, dais, gate column, both tray runs in
// the model, dense face sampling) gives the panel face, all
// four names + ClusterIPs, the ENDPOINTSLICE header, the
// fascia corners and route lines and the NOT READY tag zero
// blocked sightlines; the combined panel + fascia + tag box
// sits in frame at max |ndc| 0.84, and the panel's projected
// area is ×1.02 the loop-2 pose with glyph heights up
// everywhere (names 22–28 px vs 21, IPs 28–43 vs 18 at
// 1440×900). One crossing no southern viewpoint can remove:
// the north tray deck's band over the fascia title (the deck
// rides 0.175 m in front of the fascia, across the title's
// y 2.54–2.62 band) — the route lines below it are clear.
const POSES = {
  overview: { pos: [-5.35, 2.35, 3.05], tgt: [0.9, 0.55, -1.1] },
  dais: { pos: [-1.55, 1.78, -0.55], tgt: [-3.85, 0.72, -2.72] },
  nodes: { pos: [-3.55, 1.72, -0.42], tgt: [1.35, 0.95, -0.55] },
  switchboard: { pos: [3.25, 2.15, -0.05], tgt: [2.55, 2.0, -3.34] },
  gate: { pos: [-4.1, 2.2, 1.6], tgt: [-2.87, 1.25, 1.6] },
  lane: { pos: [0.2, 1.22, 3.18], tgt: [5.7, 0.85, 1.85] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 05 · Mesh Hall — view: ${viewParam}`;

let gl2 = null;
try {
  gl2 = document.createElement('canvas').getContext('webgl2');
} catch {
  gl2 = null;
}

let renderer = null;
if (gl2) {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch {
    renderer = null;
  }
}

if (!renderer) {
  document.getElementById('fallback').hidden = false;
  window.__rendered = true;
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9edf0); // bright hall, no void

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation05(scene);
  scene.add(station.group);

  function projFactor() {
    return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  station.setProjFactor(projFactor() * renderer.getPixelRatio());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    station.setProjFactor(projFactor() * renderer.getPixelRatio());
  });

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;   // hidden tab: the cluster holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
