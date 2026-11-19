// racks.js — 42U cabinets: framed posts + rails (never a single solid box),
// recessed perforated mesh front doors (hex perforation punched into a canvas
// alpha texture — research rule 2), door furniture, plinths, top brush strips.
// Local space: origin at rack centre on the floor, front door at local z =
// -depth/2, rear at local z = +depth/2. Servers/LEDs are added by gpuUnit.js.

import * as THREE from 'three';
import { RACK, PALETTE, SURFACE } from '../config/world.js';

// Hex-perforated door texture (RGBA — holes are punched transparent so the
// LED field behind the door genuinely glows through the mesh).
let _doorTex = null;
function doorTexture() {
  if (_doorTex) return _doorTex;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#111317';
  g.fillRect(0, 0, S, S);
  // punch a hexagonal hole field (~70% open) — cells large enough to read
  // as perforation rather than stripes, and to let the LED field through
  g.globalCompositeOperation = 'destination-out';
  const r = 4.2, dx = r * 2 * 1.02, dy = r * 1.78;
  let row = 0;
  for (let y = dy / 2; y < S + dy; y += dy, row++) {
    for (let x = (row % 2 ? dx / 2 : 0); x < S + dx; x += dx) {
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 3 * k + Math.PI / 6;
        const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
      g.fill();
    }
  }
  g.globalCompositeOperation = 'source-over';
  _doorTex = new THREE.CanvasTexture(c);
  _doorTex.wrapS = _doorTex.wrapT = THREE.RepeatWrapping;
  _doorTex.repeat.set(3, 11);
  _doorTex.anisotropy = 8;
  return _doorTex;
}

const frameMat = () => new THREE.MeshStandardMaterial({
  color: PALETTE.rackFrame, ...SURFACE.powderCoat,
});
const blackMat = () => new THREE.MeshStandardMaterial({
  color: PALETTE.rackBlack, ...SURFACE.powderCoat,
});

// Build one cabinet group for an anchor (see config/world.js rackAnchor).
export function createRack(anchor) {
  const g = new THREE.Group();
  g.name = `rack-${anchor.code}`;
  g.position.set(anchor.x, 0, anchor.z);
  g.rotation.y = anchor.rotY;
  g.userData.anchor = anchor;

  const W = RACK.width, D = RACK.depth, H = RACK.height;
  const halfW = W / 2, halfD = D / 2;
  const frame = frameMat();
  const black = blackMat();

  // plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W, RACK.plinth, D), frame);
  plinth.position.y = RACK.plinth / 2;
  g.add(plinth);

  // corner posts — the frame edges are what sell the cabinet
  const postGeo = new THREE.BoxGeometry(RACK.post, H - RACK.plinth, RACK.post);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, frame);
    post.position.set(
      sx * (halfW - RACK.post / 2), RACK.plinth + (H - RACK.plinth) / 2,
      sz * (halfD - RACK.post / 2));
    g.add(post);
  }

  // top cap + brush strip (cable pass-through)
  const top = new THREE.Mesh(new THREE.BoxGeometry(W, RACK.topRail, D), frame);
  top.position.y = H - RACK.topRail / 2;
  g.add(top);
  const brush = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.55, 0.012, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x060708, roughness: 1 }));
  brush.position.set(0, H + 0.004, halfD - 0.22);
  g.add(brush);

  // side panels (thin, inset between posts)
  const sideGeo = new THREE.BoxGeometry(0.018, H - RACK.plinth - RACK.topRail, D - RACK.post * 2);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(sideGeo, black);
    side.position.set(sx * (halfW - 0.012), RACK.plinth + (H - RACK.plinth) / 2, 0);
    g.add(side);
  }

  // rear darkness panel (behind the trays; the hot-aisle detail lives in
  // cooling.js / cabling.js, this just stops see-through hollowness)
  const rear = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.08, RACK.uHeight),
    new THREE.MeshStandardMaterial({ color: PALETTE.interiorDark, roughness: 1 }));
  rear.position.set(0, RACK.uBase + RACK.uHeight / 2, halfD - 0.1);
  rear.rotation.y = Math.PI;
  g.add(rear);

  // ---- front mesh door, recessed between the posts ----
  // Hung on a hinge group at its left edge so selection can swing it open
  // and reveal the lit tray faces behind the perforation.
  const doorH = RACK.uHeight + 0.1;
  const doorW = W - 0.09;
  const doorPivot = new THREE.Group();
  doorPivot.name = 'door-pivot';
  doorPivot.position.set(-doorW / 2, RACK.uBase + RACK.uHeight / 2, -halfD + 0.012);
  g.add(doorPivot);
  g.userData.doorPivot = doorPivot;
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW, doorH),
    new THREE.MeshStandardMaterial({
      map: doorTexture(), transparent: true, side: THREE.DoubleSide,
      roughness: 0.55, metalness: 0.25, depthWrite: false,
    }));
  door.position.set(doorW / 2, 0, 0);
  door.rotation.y = Math.PI;               // face the aisle (local -Z)
  door.name = 'rack-door';
  doorPivot.add(door);

  // door border shadow gap (thin dark frame just behind the door edge)
  const gapMat = new THREE.MeshStandardMaterial({ color: 0x050606, roughness: 1 });
  for (const sx of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, doorH, 0.01), gapMat);
    strip.position.set(sx * (halfW - 0.045), RACK.uBase + RACK.uHeight / 2, -halfD + 0.006);
    g.add(strip);
  }

  // door furniture: vertical pull handle + latch block (right-hand side),
  // riding on the hinge group so they swing with the door
  const steel = new THREE.MeshStandardMaterial({
    color: PALETTE.brushedSteel, ...SURFACE.brushedSteel,
  });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.3, 0.03), steel);
  handle.position.set(doorW - 0.04, 1.15 - (RACK.uBase + RACK.uHeight / 2), -0.02);
  doorPivot.add(handle);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.02), black);
  latch.position.set(doorW - 0.04, 1.32 - (RACK.uBase + RACK.uHeight / 2), -0.016);
  doorPivot.add(latch);

  return g;
}

// Both rows as one group, plus the anchor list for the other modules.
export function createRackRows(anchors) {
  const group = new THREE.Group();
  group.name = 'rack-rows';
  const rackGroups = anchors.map((a) => {
    const rack = createRack(a);
    group.add(rack);
    return rack;
  });
  return { group, rackGroups };
}
