// station01-main.js — standalone verification entry for Station 01,
// the Control Room at dawn (freeze-frame 05:58:40 IST):
//   station01.html?view=threshold|wall|shoulder|blinds|oldroom|glass
// Renderer pattern per SCAFFOLD.md: WebGL2 check + fallback panel,
// ACESFilmic + sRGB, window.__rendered after 3 frames, animation clock
// accumulating CLAMPED deltas and freezing while hidden (only the
// frequency trace consumes it).

import * as THREE from 'three';
import { createStation01 } from './scene/station01/station01.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'threshold';

// The inventory's six poses (section 7), each composed from a
// believable standing position inside the room:
// - threshold: just inside the open south door (door x 1.0-2.4, east of
//   the supervisor platform which spans x -2.1..2.1 at z 3.22-4.46);
//   the whole room and the wall fit the 55-degree frame from here.
// - wall: standing between the console row (desks end z 1.8, chairs to
//   z ~2.3) and the supervisor platform (z 3.22) — the only spot where
//   the full 10.9 m wall + banner fits with margin.
// - shoulder: behind desk 2's chair (chair back top ~1.35 at z ~2.15),
//   camera above it; desk 2 is the story desk (off-cradle hotline,
//   open log book, control dialog on the centre screen).
// - blinds: low at the west end of the console row, west of desk 1
//   (desk 1 spans x -4.05..-2.25) looking ESE along the row to the
//   window band; chair backs are deliberate foreground.
// - oldroom: 3.3 m west of the mimic panel, square to it; the panel is
//   3.6 m wide, coverage at 3.3 m is ~5.9 m — comfortable.
// - glass: standing SE of the server glass looking NW; the sightline
//   crosses the glass (x -6.6) at z ~-0.9, inside its span (-3.6..2.4),
//   and lands on the rack row (rack faces at x -7.2).
const POSES = {
  threshold: { pos: [2.05, 1.62, 4.08], tgt: [-0.3, 1.3, -4.45] },
  wall: { pos: [0, 1.62, 2.62], tgt: [0, 1.8, -4.5] },
  shoulder: { pos: [-0.92, 1.5, 2.62], tgt: [-1.12, 0.88, -0.9] },
  blinds: { pos: [-4.7, 1.05, 2.35], tgt: [6.55, 1.4, 3.3] },
  oldroom: { pos: [3.3, 1.55, -2.55], tgt: [6.6, 1.6, -2.6] },
  glass: { pos: [-4.35, 1.5, 2.2], tgt: [-7.7, 1.05, -2.4] },
};
const pose = POSES[viewParam] || POSES.threshold;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 01 · Control Room — view: ${viewParam}`;

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
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161a);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation01();
  scene.add(station);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;   // hidden tab: the room holds still
    if (station.userData.update) station.userData.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
