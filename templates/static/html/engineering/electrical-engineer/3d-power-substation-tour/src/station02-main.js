// station02-main.js — standalone verification entry for Station 02,
// the Substation Yard (the hero). Boots ONLY the yard so each camera
// pose can be render-checked in isolation:
//   station02.html?view=gate|portrait|lid|bayline|bus|firewall
// Renderer pattern: ACES + sRGB, __rendered after 3 frames, clamped
// clock that freezes while hidden. Morning light, long shadows.

import * as THREE from 'three';
import { createStation02 } from './scene/station02/station02.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'gate';

// Camera poses (inventory §10) — believable standing positions inside
// the fence; sightlines checked against the built geometry.
const POSES = {
  // 1 Through the Gate: on the gate spur (road z 15.2..23), eye
  // height, shifted ~2 m west of the yard axis so the fire wall's end
  // (x 0, z 8.8..15.2, top 7.78) sits right of centre instead of
  // filling it; fire point (-4.6, 15.9) stays in frame at the left,
  // T-1/T-2 flank the wall, bus conductors cross the sky at 9.0.
  gate: { pos: [-1.8, 1.7, 22.6], tgt: [-0.4, 3.4, -8] },
  // 2 Transformer Portrait: SE of T-2 on the apron, swung east/south
  // clear of the LV gantry leg (15, 18.2) and the tube-bus posts
  // (z 15.9) that used to slice the frame. South radiator bank +
  // face-mounted fans in the near plane, marshalling box as
  // foreground, nameplate face (z 13.1) readable, HV bushings
  // against the sky.
  portrait: { pos: [19.9, 2.3, 18.9], tgt: [12.3, 2.9, 12.1] },
  // 3 Lid World: elevated NW of T-2 looking SE across the lid (lid top
  // 4.78, conservator centreline 6.13). Camera clears the HV bushing
  // row (z 11.45, tops 7.4) by standing north-west at 5.9 m.
  lid: { pos: [8.8, 5.9, 8.2], tgt: [13.4, 5.0, 12.4] },
  // 4 The Bay Line: low at the west end of the equipment row (row at
  // z 0..7.6, walkway z 8.6 behind camera-right); bays recede east at
  // 12.2 m pitch to FDR-2's entry gantry.
  bayline: { pos: [-31.5, 1.5, 4.8], tgt: [20, 3.6, 3.2] },
  // 5 Along the Bus: ground level at the west end of the bus band
  // (band centre z -12.5), looking east along both strain buses —
  // bus-1 (z -5..-11, sag 0.61) and bus-2 (z -14..-20, sag 0.68),
  // both at 9.0 — portal frames receding at x 0 and x 30.5,
  // droppers falling to each bay along the way.
  bus: { pos: [-33.5, 1.7, -12.5], tgt: [15, 7.5, -12.5] },
  // 6 Firewall Scale: from the gate spur SW of the wall, looking NNE
  // along its west face: the 650 mm fire wall (x 0, z 8.8..15.2,
  // coping at 7.78) runs diagonally through the centre of frame,
  // T-2 in frame at the right edge, T-1's bund corner at the left,
  // fire point in the near foreground.
  firewall: { pos: [-6.5, 1.8, 22.6], tgt: [0.5, 4.8, 9.0] },
};
const pose = POSES[viewParam] || POSES.gate;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 02 · Substation Yard — view: ${viewParam}`;

let gl2 = null;
try { gl2 = document.createElement('canvas').getContext('webgl2'); } catch { gl2 = null; }
let renderer = null;
if (gl2) {
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch { renderer = null; }
}

if (!renderer) {
  document.getElementById('fallback').hidden = false;
  window.__rendered = true;
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8e2e8); // clear morning sky
  scene.fog = new THREE.Fog(0xd8e2e8, 85, 190);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  // 06:04 sun: low in the ESE, warm, long shadows toward WNW.
  const sun = new THREE.DirectionalLight(0xffd9a6, 2.6);
  sun.position.set(55, 17, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -52; sun.shadow.camera.right = 52;
  sun.shadow.camera.top = 52; sun.shadow.camera.bottom = -52;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbdd2e4, 0x8a7f6a, 0.85));
  const fill = new THREE.DirectionalLight(0xdfe8ee, 0.35);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  const station = createStation02();
  scene.add(station);

  function projFactor() {
    return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  if (station.userData.setProjFactor)
    station.userData.setProjFactor(projFactor() * renderer.getPixelRatio());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (station.userData.setProjFactor)
      station.userData.setProjFactor(projFactor() * renderer.getPixelRatio());
  });

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;
    if (station.userData.update) station.userData.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
