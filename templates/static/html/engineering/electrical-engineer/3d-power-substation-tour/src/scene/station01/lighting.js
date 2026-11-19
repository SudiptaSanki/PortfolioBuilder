// lighting.js — the inventory's lighting design, literally: low
// indirect cove ambient (150-200 lux feel), the screens as the dominant
// cool source, and ONE warm dawn shaft through the east blinds at ~8-12
// degrees, throwing the blind slats' long shadows across the floor.
// No downlight cones, no bloom. Faint warm bar decals under the real
// shadows keep the bars readable where SwiftShader softens them.

import * as THREE from 'three';
import { STATION01 } from '../../config/world.js';

const S = STATION01;

export function createLighting() {
  const group = new THREE.Group();
  group.name = 's01-lighting';

  const hemi = new THREE.HemisphereLight(0x93a7c4, 0x4a4238, 0.5);
  group.add(hemi);

  // indirect cove: two soft warm-white points, front and rear
  for (const [x, z, i] of [[0, -1.6, 14], [0, 3.2, 10]]) {
    const p = new THREE.PointLight(0xfff1dd, i, 11, 1.8);
    p.position.set(x, 3.15, z);
    group.add(p);
  }
  // screen glow spilling off the video wall onto the console row
  const spill = new THREE.PointLight(0xbfe0d8, 13, 9, 1.8);
  spill.position.set(0, 1.9, -3.1);
  group.add(spill);

  // the dawn shaft
  const dawn = new THREE.DirectionalLight(0xffa050, 2.4);
  dawn.position.set(11.5, 3.0, 2.4);
  dawn.target.position.set(-3, 0, 0.9);
  dawn.castShadow = true;
  dawn.shadow.mapSize.set(2048, 2048);
  dawn.shadow.camera.left = -8; dawn.shadow.camera.right = 8;
  dawn.shadow.camera.top = 8; dawn.shadow.camera.bottom = -8;
  dawn.shadow.camera.near = 2; dawn.shadow.camera.far = 30;
  dawn.shadow.bias = -0.0004;
  dawn.shadow.normalBias = 0.02;
  group.add(dawn);
  group.add(dawn.target);

  // light bars on the floor, thrown from the window band westward
  const barMat = new THREE.MeshBasicMaterial({
    color: 0xffb066, transparent: true, opacity: 0.10,
    depthWrite: false,
  });
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.3), barMat);
    bar.rotation.x = -Math.PI / 2;
    bar.rotation.z = 0.06;
    bar.position.set(3.4, 0.006 + i * 0.0004, 0.75 + i * 0.78);
    group.add(bar);
  }
  // one bar lands on desk 4's east end
  const deskBar = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0.12, depthWrite: false }));
  deskBar.rotation.x = -Math.PI / 2;
  deskBar.rotation.z = 0.06;
  deskBar.position.set(3.85, S.consoles.topY + 0.003, 1.62);
  group.add(deskBar);

  return group;
}
