// atmosphere.js — air and depth, kept subtle: a whisper of light-grey fog
// for long sightlines (never the black void), slow dust motes drifting in
// the cold-aisle light, and faint shaft planes under the ceiling strips.
// Floor sheen itself lives in room.js (low-roughness tile material).

import * as THREE from 'three';
import { LAYOUT, seeded } from '../config/world.js';

export function applyFog(scene) {
  scene.fog = new THREE.Fog(0xe4e8eb, 13, 32);
  return scene.fog;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

const DUST_COUNT = 260;
let _dust = null;
let _dustBase = null;
let _dustSeed = null;

function buildDust(group) {
  const rnd = seeded(41);
  const pos = new Float32Array(DUST_COUNT * 3);
  _dustBase = new Float32Array(DUST_COUNT * 3);
  _dustSeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const inAisle = i < DUST_COUNT * 0.65;
    const x = -2.6 + rnd() * 5.2;
    const y = 0.25 + rnd() * 2.8;
    const z = inAisle ? (rnd() - 0.5) * 1.1 : (rnd() - 0.5) * 5.4;
    _dustBase.set([x, y, z], i * 3);
    pos.set([x, y, z], i * 3);
    _dustSeed[i] = rnd() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  _dust = new THREE.Points(geo, new THREE.PointsMaterial({
    map: dotTexture(), color: 0xffffff, size: 0.011, sizeAttenuation: true,
    transparent: true, opacity: 0.32, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  _dust.frustumCulled = false;
  group.add(_dust);
}

function buildShafts(group) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255,248,230,0.55)');
  grad.addColorStop(1, 'rgba(255,248,230,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.05, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2.9), mat);
  shaft.position.set(0, LAYOUT.room.height - 1.5, 0);
  group.add(shaft);
}

export function createAtmosphere() {
  const group = new THREE.Group();
  group.name = 'atmosphere';
  buildDust(group);
  buildShafts(group);
  return group;
}

// Slow subliminal drift — motion at the edge of attention.
export function tickAtmosphere(t) {
  if (!_dust) return;
  const pos = _dust.geometry.attributes.position;
  for (let i = 0; i < DUST_COUNT; i++) {
    const s = _dustSeed[i];
    pos.array[i * 3] = _dustBase[i * 3] + Math.sin(t * 0.07 + s * 1.7) * 0.05;
    pos.array[i * 3 + 1] = _dustBase[i * 3 + 1] + Math.sin(t * 0.12 + s) * 0.045;
  }
  pos.needsUpdate = true;
}
