// geom.js — small geometry utilities for Station 03: merging simple
// indexed geometries (for instanced hardware built from several boxes)
// and turning member lists into InstancedMeshes (the lattice towers
// are hundreds of angle members; one instanced unit box serves all).

import * as THREE from 'three';

// Merge indexed BufferGeometries, each pre-transformed by its matrix.
// All inputs must carry position/normal/uv (Box/Sphere/Cylinder/
// Lathe/Torus all do). Returns one indexed BufferGeometry.
export function mergeGeoms(items) {
  let vTotal = 0, iTotal = 0;
  for (const { geom } of items) {
    vTotal += geom.attributes.position.count;
    iTotal += geom.index.count;
  }
  const pos = new Float32Array(vTotal * 3);
  const nor = new Float32Array(vTotal * 3);
  const uv = new Float32Array(vTotal * 2);
  const idx = new (vTotal > 65535 ? Uint32Array : Uint16Array)(iTotal);
  const nrm = new THREE.Matrix3();
  const v = new THREE.Vector3();
  let vo = 0, io = 0;
  for (const { geom, matrix } of items) {
    const p = geom.attributes.position, n = geom.attributes.normal, u = geom.attributes.uv;
    nrm.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(matrix);
      pos.set([v.x, v.y, v.z], (vo + i) * 3);
      v.fromBufferAttribute(n, i).applyMatrix3(nrm).normalize();
      nor.set([v.x, v.y, v.z], (vo + i) * 3);
      uv.set([u.getX(i), u.getY(i)], (vo + i) * 2);
    }
    const gi = geom.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += p.count; io += gi.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

const _mid = new THREE.Vector3(), _dir = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();

// One InstancedMesh of unit boxes for a member list
// [{a: Vector3, b: Vector3, t: thickness}] in world space.
export function membersToInstanced(members, material) {
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geom, material, members.length);
  members.forEach((mem, i) => {
    _dir.subVectors(mem.b, mem.a);
    const len = _dir.length();
    _mid.addVectors(mem.a, mem.b).multiplyScalar(0.5);
    _q.setFromUnitVectors(_up, _dir.normalize());
    _s.set(mem.t, len, mem.t);
    _m.compose(_mid, _q, _s);
    mesh.setMatrixAt(i, _m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// Matrix that places a unit at `pos`, oriented so local +Y runs along
// `axis` (used for insulator discs stacked along a string's axis).
export function axisMatrix(pos, axis, scale) {
  _q.setFromUnitVectors(_up, axis.clone().normalize());
  return new THREE.Matrix4().compose(pos, _q, scale || new THREE.Vector3(1, 1, 1));
}

// Matrix from an orthonormal basis (side, up, forward) at `pos`.
export function basisMatrix(pos, side, up, fwd, scale) {
  const m = new THREE.Matrix4().makeBasis(side, up, fwd);
  m.setPosition(pos);
  if (scale) m.scale(scale);
  return m;
}
