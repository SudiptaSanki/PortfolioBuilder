// rig.js — camera glide between authored poses. One tween at a time, eased
// with a cubic in/out; reduced motion jumps straight to the pose. A very
// small idle drift keeps the frame alive when the camera is at rest.

import * as THREE from 'three';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createRig(camera, { reduced = false } = {}) {
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  const fromPos = new THREE.Vector3();
  const fromTgt = new THREE.Vector3();
  const toPos = new THREE.Vector3();
  const toTgt = new THREE.Vector3();
  let tween = null;
  let still = false;
  let motionReduced = reduced;
  let fovFrom = camera.fov;
  let fovTo = camera.fov;
  let fovT0 = 0;
  let fovDur = 0.6;

  function setPose(pose, { immediate = false, duration = 1.0 } = {}) {
    fromPos.copy(pos);
    fromTgt.copy(tgt);
    toPos.fromArray(pose.pos);
    toTgt.fromArray(pose.tgt);
    if (immediate || motionReduced) {
      pos.copy(toPos);
      tgt.copy(toTgt);
      tween = null;
      // apply at once so a screenshot or a pick right after this call sees
      // the new pose (the render loop may be a frame behind)
      camera.position.copy(pos);
      camera.lookAt(tgt);
      camera.updateMatrixWorld(true);
      return;
    }
    // distance-aware duration: long moves take a little longer, never slow
    const dist = fromPos.distanceTo(toPos);
    const dur = THREE.MathUtils.clamp(duration * (0.75 + dist * 0.16), 0.55, 1.35);
    tween = { t0: performance.now(), dur };
  }
  function update(now) {
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / (tween.dur * 1000));
      const e = easeInOut(k);
      pos.lerpVectors(fromPos, toPos, e);
      tgt.lerpVectors(fromTgt, toTgt, e);
      if (k >= 1) tween = null;
    }
    // lens: the inspector opens a touch wider to fit a whole cabinet
    if (camera.fov !== fovTo) {
      if (motionReduced) {
        camera.fov = fovTo;
        camera.updateProjectionMatrix();
      } else {
        const k = Math.min(1, (now - fovT0) / (fovDur * 1000));
        const e = easeInOut(k);
        camera.fov = fovFrom + (fovTo - fovFrom) * e;
        camera.updateProjectionMatrix();
      }
    }

    if (!tween && !motionReduced && !still) {
      const s = now / 1000;
      camera.position.set(
        pos.x + Math.sin(s * 0.16) * 0.022,
        pos.y + Math.sin(s * 0.13 + 1.1) * 0.014,
        pos.z + Math.cos(s * 0.11) * 0.018
      );
    } else {
      camera.position.copy(pos);
    }
    camera.lookAt(tgt);
    return { moving: !!tween };
  }

  return {
    setPose,
    update,
    setReduced(v) { motionReduced = !!v; },
    setFov(v, dur = 0.6) {
      if (Math.abs(camera.fov - v) < 0.01 && fovTo === v) return;
      fovFrom = camera.fov;
      fovTo = v;
      fovT0 = performance.now();
      fovDur = motionReduced ? 0 : dur;
    },
    get fov() { return fovTo; },
    setStill(v) { still = !!v; },
    get pos() { return pos; },
    get target() { return tgt; },
    get moving() { return !!tween; },
    get reduced() { return motionReduced; },
  };
}
