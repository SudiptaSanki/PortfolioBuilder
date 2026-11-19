// selection.js — raycast hit proxies and the blue cabinet halo.
// The proxy boxes are invisible (colorWrite off) but still raycastable, so
// the picker never has to walk thousands of tray/LED meshes.

import * as THREE from 'three';
import { RACK, LAYOUT } from '../config/world.js';

const HALO_BLUE = 0x2f8bff;
const HALO_GOLD = 0xe0b866;

function haloBox() {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const group = new THREE.Group();
  const outer = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: HALO_BLUE, transparent: true, opacity: 0.18, depthWrite: false })
  );
  const inner = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: HALO_BLUE, transparent: true, opacity: 0.9, depthWrite: false })
  );
  outer.scale.setScalar(1.035);
  group.add(outer, inner);
  group.userData.outer = outer;
  group.userData.inner = inner;
  return group;
}

export function createSelection(scene, { rackGroups, cduGroup }) {
  const proxies = [];
  const hitMat = new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, transparent: true, opacity: 0,
  });

  rackGroups.forEach((group) => {
    const a = group.userData.anchor;
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(RACK.width + 0.04, RACK.height + 0.04, RACK.depth + 0.04),
      hitMat
    );
    proxy.position.set(0, RACK.height / 2, 0);
    proxy.userData.machineId = a.code;
    proxy.userData.isHitProxy = true;
    proxy.renderOrder = -10;
    group.add(proxy);
    proxies.push(proxy);
  });

  if (cduGroup) {
    cduGroup.userData.machineId = 'CDU-01';
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.12, 1.18), hitMat);
    proxy.position.set(0, 1.03, 0);
    proxy.userData.machineId = 'CDU-01';
    proxy.userData.isHitProxy = true;
    proxy.renderOrder = -10;
    cduGroup.add(proxy);
    proxies.push(proxy);
  }

  // one reusable halo for racks, one for the (wider, shorter) CDU
  const rackHalo = haloBox();
  const cduHalo = haloBox();
  scene.add(rackHalo, cduHalo);

  const ringMat = new THREE.MeshBasicMaterial({
    color: HALO_BLUE, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.47, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  scene.add(ring);

  const state = {
    mode: 'none',        // 'none' | 'hover' | 'selected'
    id: null,
    targetOpacity: 0,
    opacity: 0,
    ringOpacity: 0,
  };

  function place(id) {
    const rack = rackGroups.find((g) => g.userData.anchor.code === id);
    const halo = id === 'CDU-01' ? cduHalo : rackHalo;
    const other = halo === rackHalo ? cduHalo : rackHalo;
    other.visible = false;
    halo.visible = true;

    if (rack) {
      const a = rack.userData.anchor;
      halo.position.set(a.x, RACK.height / 2, a.z);
      halo.scale.set(RACK.width + 0.05, RACK.height + 0.05, RACK.depth + 0.05);
      halo.rotation.y = a.rotY;
      const front = a.row === 'A' ? LAYOUT.rowZ - RACK.depth / 2 : -(LAYOUT.rowZ - RACK.depth / 2);
      ring.position.set(a.x, 0.004, front + (a.row === 'A' ? 0.02 : -0.02));
    } else if (id === 'CDU-01') {
      halo.position.set(LAYOUT.cdu.x, 1.02, LAYOUT.cdu.z);
      halo.scale.set(1.0, 2.14, 1.2);
      halo.rotation.y = 0;
      ring.position.set(LAYOUT.cdu.x - 0.78, 0.004, LAYOUT.cdu.z);
    }
    const sel = state.mode === 'selected';
    halo.userData.inner.material.color.setHex(sel ? HALO_BLUE : HALO_GOLD);
    halo.userData.outer.material.color.setHex(sel ? HALO_BLUE : HALO_GOLD);
    ring.material.color.setHex(sel ? HALO_BLUE : HALO_GOLD);
  }

  function set(mode, id) {
    if (mode === 'none' || !id) {
      state.mode = 'none';
      state.id = null;
      state.targetOpacity = 0;
      state.ringOpacity = 0;
      return;
    }
    if (mode === 'hover' && state.mode === 'selected') return;
    if (state.mode === mode && state.id === id) return;
    state.mode = mode;
    state.id = id;
    place(id);
    state.targetOpacity = mode === 'selected' ? 0.85 : 0.42;
    state.ringOpacity = mode === 'selected' ? 0.55 : 0.0;
  }

  function update(t, dt) {
    const k = Math.min(1, dt * 9);
    state.opacity += (state.targetOpacity - state.opacity) * k;
    const ringTarget = state.mode === 'selected' ? 0.55 : 0;
    state.ringOpacity += (ringTarget - state.ringOpacity) * k;
    const halos = [rackHalo, cduHalo];
    const pulse = state.mode === 'selected' ? 0.16 * (0.5 + 0.5 * Math.sin(t * 3.1)) : 0;
    halos.forEach((h) => {
      if (!h.visible) return;
      h.userData.outer.material.opacity = Math.max(0, state.opacity * 0.4 + pulse);
      h.userData.inner.material.opacity = state.opacity;
    });
    ringMat.opacity = Math.max(0, state.ringOpacity + pulse * 0.6);
    if (state.mode === 'none' && state.opacity < 0.01) {
      rackHalo.visible = false;
      cduHalo.visible = false;
    }
  }

  return {
    proxies,
    set,
    update,
    clear() { set('none'); },
    get id() { return state.id; },
    get mode() { return state.mode; },
  };
}
