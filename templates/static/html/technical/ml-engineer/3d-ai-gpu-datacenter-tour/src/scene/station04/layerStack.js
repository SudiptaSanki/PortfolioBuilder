// layerStack.js — the image, stacked (co-hero). At the line's end
// the finished image stands as a physical stack of labelled slabs
// on a low press plinth — the layer diagram from every Docker
// explainer, extruded into 3D. Slabs are ordered bottom → top
// exactly as the Dockerfile reads, each edge carrying its
// instruction and a short digest. Cache stamps tell build #482's
// story at a glance: the bottom four layers came back CACHED; only
// the top COPY src/ slab — the layer that changes with every commit
// — was REBUILT. Beside the stack stands the builder-stage scaffold:
// everything the build needed, visibly next to the image and not in
// it. Multi-stage builds as furniture.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';

const S04 = STATION04;
const ST = S04.stack;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

function simplePlate(w, h, lines, { bg = '#f2f3f4', ink = '#14171a', px = [512, 128] } = {}) {
  return textPlate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.font = '700 42px Arial, sans-serif';
    g.fillText(lines[0], cw / 2, ch / 2 + 15);
  }, px);
}

// instruction, short digest, width (x), height — bottom → top, as
// the Dockerfile reads. The weights slab carries the gold trim: it
// was trained in Station 03, and the gold is a provenance cue.
const SLABS = [
  { label: 'FROM python:3.12-slim', digest: 'sha256:1a2b…', w: 1.10, h: 0.17 },
  { label: 'RUN apt-get install …', digest: 'sha256:4c5d…', w: 1.02, h: 0.15 },
  { label: 'COPY requirements.txt · RUN pip install', digest: 'sha256:6e7f…', w: 0.96, h: 0.15 },
  { label: 'COPY weights/ · model artifact', digest: 'sha256:8a9b…', w: 0.90, h: 0.16, gold: true },
  { label: 'COPY src/', digest: 'sha256:b3c4…', w: 0.80, h: 0.13, rebuilt: true },
];
const DEPTH = 0.78;

function edgeTexture(slab) {
  return canvasTexture(1024, 96, (g, w, h) => {
    g.fillStyle = '#e8eaec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'left';
    g.font = '700 40px "Courier New", monospace';
    g.fillText(slab.label, 22, h / 2 + 14);
    g.textAlign = 'right';
    g.font = '400 34px "Courier New", monospace';
    g.fillStyle = '#5a6068';
    g.fillText(slab.digest, w - 22, h / 2 + 12);
  });
}

function buildStack(group) {
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.16, 1.06), galv);
  plinth.position.set(ST.x, 0.08, ST.z);
  group.add(plinth);
  // corner guides of the press — the stack is assembled under them
  const guideMat = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  for (const [dx, dz] of [[-0.62, -0.48], [0.62, -0.48], [-0.62, 0.48], [0.62, 0.48]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.18, 0.04), guideMat);
    post.position.set(ST.x + dx, 0.16 + 0.59, ST.z + dz);
    group.add(post);
  }

  let y = 0.16;
  SLABS.forEach((slab, i) => {
    const tone = 0x23262b + i * 0x030303;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(slab.w, slab.h, DEPTH),
      new THREE.MeshStandardMaterial({ color: tone, ...SURFACE.powderCoat }));
    body.position.set(ST.x, y + slab.h / 2, ST.z);
    group.add(body);

    // the gold provenance trim on the weights slab's south edge
    if (slab.gold) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(slab.w, 0.016, 0.012),
        new THREE.MeshStandardMaterial({ color: PALETTE.dgxGold, ...SURFACE.gold }));
      trim.position.set(ST.x, y + slab.h / 2, ST.z + DEPTH / 2 + 0.004);
      group.add(trim);
    }

    // edge plate on the south face: instruction + short digest
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(slab.w - 0.05, Math.min(0.105, slab.h - 0.02)),
      new THREE.MeshStandardMaterial({ map: edgeTexture(slab), roughness: 0.6, metalness: 0.05 }));
    edge.position.set(ST.x, y + slab.h / 2, ST.z + DEPTH / 2 + 0.002);
    group.add(edge);

    // cache stamp on the west face: amber CACHED for the reused
    // layers, green REBUILT for the one this commit changed
    const stamp = slab.rebuilt
      ? simplePlate(0.4, 0.075, ['REBUILT · THIS COMMIT'], { bg: '#0a8a3c', ink: '#ffffff', px: [768, 128] })
      : simplePlate(0.2, 0.075, ['CACHED'], { bg: '#ffb02e', ink: '#14171a', px: [384, 128] });
    stamp.position.set(ST.x - slab.w / 2 - 0.002, y + slab.h / 2, ST.z);
    stamp.rotation.y = -Math.PI / 2;
    group.add(stamp);

    y += slab.h;
  });

  // the config cap: metadata, not files — a thin plate, not a layer
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.05, DEPTH),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  cap.position.set(ST.x, y + 0.025, ST.z);
  group.add(cap);
  const capPlate = simplePlate(0.78, 0.042, ['CONFIG · ENV · ENTRYPOINT · USER'], { px: [1024, 64] });
  capPlate.position.set(ST.x, y + 0.025, ST.z + DEPTH / 2 + 0.002);
  group.add(capPlate);
}

// ------------------------------------------------------ scaffold -----
// The builder stage: an open cage with a workbench and tool
// silhouettes, standing beside the stack — everything the build
// needed, visibly not in the shipped image.
function buildScaffold(group) {
  const { x, z } = ST.scaffold;
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const W = 1.3, D = 0.9, H = 2.0;
  for (const [dx, dz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), frameMat);
    post.position.set(x + dx, H / 2, z + dz);
    group.add(post);
  }
  for (const dz of [-D / 2, D / 2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 0.05, 0.05), frameMat);
    beam.position.set(x, H - 0.025, z + dz);
    group.add(beam);
  }
  for (const dx of [-W / 2, W / 2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, D + 0.05), frameMat);
    beam.position.set(x + dx, H - 0.025, z);
    group.add(beam);
  }
  // workbench + the toolchain's silhouettes (flat, dark, at rest)
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.7, metalness: 0.4 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.55), benchMat);
  bench.position.set(x, 0.85, z);
  group.add(bench);
  for (const [dx, dz] of [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.85, 0.045), benchMat);
    leg.position.set(x + dx, 0.425, z + dz);
    group.add(leg);
  }
  const toolMat = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.6, metalness: 0.5 });
  const shapes = [
    [0.2, 0.13, 0.05, -0.3, 0.92], [0.3, 0.09, 0.04, 0.05, 0.9], [0.12, 0.2, 0.04, 0.36, 0.95],
  ];
  for (const [w, h, d, dx, y] of shapes) {
    const tool = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toolMat);
    tool.position.set(x + dx, y, z);
    group.add(tool);
  }
  const plate = simplePlate(1.24, 0.17,
    ['BUILDER STAGE · TOOLCHAIN · DOES NOT SHIP'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1152, 144] });
  plate.position.set(x, H - 0.22, z + D / 2 + 0.03);
  group.add(plate);
}

export function createLayerStack() {
  const group = new THREE.Group();
  group.name = 's04-layer-stack';
  buildStack(group);
  buildScaffold(group);
  return group;
}
