// station04-main.js — standalone verification entry for Station 04.
// Boots ONLY the Turbine Hall (no journey, no portfolio UI) so each
// camera pose can be render-checked in isolation:
//   station04.html?view=train|frontstandard|crossover|generator|basement|crane
// Renderer pattern mirrors the AI/ML build's station mains (ACES +
// sRGB, __rendered after 3 frames). The animation clock accumulates
// clamped frame deltas and freezes while the tab is hidden.

import * as THREE from 'three';
import { createStation04 } from './scene/station04/station04.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'train';

// Camera poses — the inventory's six. Fix loop 3 (parent-
// dictated from a scene-graph probe): loops 1–2's deck cameras
// were defeated by the EHC/supervisory CABINETS' CABLE TRAY —
// a dark-steel slab (oilSkid.js) at y 16.71–16.79, z 5.4–5.8,
// x −32…−23, exactly at the loop-2 eye height (16.6) on the
// south walkway, so it crossed those frames as a black bar.
// Loop 3 drops the west-end eyes to 15.9 (deck +1.9), passing
// UNDER the tray (0.8 m clearance to its underside), where it
// reads as a thin bar at the frame top; crossover is retaken
// from the west, aimed at the crossover pipe itself instead of
// up the LP-1 hood's south face; crane moves to the NORTH
// walkway, its sightline threading north of the LP-2 hood.
// Deck top +14 m, shaft centreline 18.6 m at z 0, deck edges
// x ±33 / z ±6.5, LP hoods x −7.4…1.1 / 3.4…11.9, z ±4.5
// (top 22.5), crane bridges at y ≈ 30.6. Nearest-surface
// clearances are stated per pose, cable tray and hood faces
// included.
const POSES = {
  // 1 · the train, whole — SW deck corner on the south walkway,
  // eye at deck +1.9 UNDER the cable tray, three-quarter down
  // the train's south flank: HP→IP→LP barrels receding in
  // profile, generator + exciter closing the frame, east crane
  // girder upper frame. Nearest surfaces: cable tray 0.8 m
  // overhead (underside 16.71 vs eye 15.9; its west end 0.5 m
  // E) — clear of the ENE sightline, a thin bar at frame top;
  // EHC row west corner 1.8 m (NE); front standard ≈6.0 m;
  // HP barrel ≈7.1 m.
  train: { pos: [40, 22, -15], tgt: [-18, 17.5, 0.5] },
  // 2 · front standard & HP — south walkway west of the EHC
  // row, eye under the cable tray, looking ENE: front standard
  // mid-frame at ≈6.7 m, the HP barrel (x −26.9…−20.4, Ø3.2)
  // behind-right with its ESV/CV chests on the south face
  // toward camera, N1/N2 pedestals in frame. Nearest surfaces:
  // cable tray directly overhead, 0.8 m above eye (its west
  // end 0.6 m E at z 5.4–5.8 — the camera passes beneath it);
  // EHC row west corner 1.9 m (E); HP barrel ≈7.0 m.
  frontstandard: { pos: [-38, 19.5, -10.5], tgt: [-26, 17.8, 0] },
  // 3 · crossover pipes — south walkway WEST of the IP, looking
  // ESE and up at the IP→LP-1 crossover PIPE itself (bbox
  // x −17.3…−5.3, y 20.1–24.9, z ±0.8): the arc spans from the
  // IP barrel (top 20.5) toward the LP-1 hood top in profile.
  // (Loop 2 stood 1.6 m from LP-1's south face looking up its
  // wall — the hood filled the frame.) The sightline ends at
  // x −11, 3.6 m short of the LP-1 hood's west face (x −7.4),
  // so the hood never enters it. Nearest surfaces: cable
  // tray's east leg (x −23.4) ≈2.1 m (W, overhead); IP barrel
  // ≈6 m; camera 1.4 m S of the hood-face plane, 14 m W of
  // the hood itself.
  crossover: { pos: [-26.5, 16.8, 8.5], tgt: [-10.5, 22.2, 0] },
  // 4 · generator & exciter — the one working family, pulled
  // ~30 % wider along the same SE three-quarter: barrel + end
  // shields + exciter + turning gear in frame, and the spare
  // rotor now inside the frame's west edge (≈17° off-axis).
  // Nearest surface: LP-2 hood 7.6 m (N); generator barrel 6 m.
  generator: { pos: [8.9, 16.2, 12.1], tgt: [21.8, 17.9, -0.5] },
  // 5 · basement — on the basement floor SOUTH of the
  // condenser at human eye (1.9 m), looking north: the box
  // (x −7…12, z ±4.5, top 8.5) frontal with its dished water
  // boxes, neck trunks rising to the LP deck slots, VIS deck
  // columns framing. (Loop 1 stood at z −10.5, inside the
  // Ø2.6 m CW pipes' run from the north wall at y 2.6 — a pipe
  // filled the frame; the pipes stay on the far, north side
  // here.) Nearest surface: B-row hall column ≈3.0 m (behind,
  // S); condenser south face 12.0 m.
  basement: { pos: [-2.6, 1.9, 16.5], tgt: [2.5, 5.2, 0] },
  // 6 · crane & laydown — NORTH walkway mid-hall, eye at deck
  // +2.6, looking ESE and up: generator flank mid-frame, the
  // spare rotor beyond it on the laydown, and the east crane
  // bridge (parked x 28, girders y ≈ 29–31) in the top third.
  // (Loop 2 stood on the south walkway 1.7 m from the LP-2
  // hood's south face, which filled the left of frame.) The
  // sightline holds NORTH of z −4.5 for the whole LP-2 hood
  // (x 3.4…11.9) and clears its NE corner — the hood never
  // enters it. Nearest surfaces: LP-2 hood north-face plane
  // 1.6 m (S; nearest hood corner ≈5.6 m); generator barrel
  // ≈9 m. Camera inside the north railing (z −6.44).
  crane: { pos: [39, 20.5, 15], tgt: [-28, 19.0, -0.5] },
};
const pose = POSES[viewParam] || POSES.train;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 04 · Turbine Hall — view: ${viewParam}`;

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
  renderer.toneMappingExposure = 1.32;   // fix loop 1: bright industrial interior
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8edea); // bright hall, no void

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 220);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation04(scene);
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
    if (!document.hidden) t += dt;   // hidden tab: time holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
