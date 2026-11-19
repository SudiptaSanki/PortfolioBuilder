// controlRoom.js — the room's fixed fabric: 600 mm raised-floor grid
// (the room's ruler), ceiling with acoustic baffles and cassettes,
// walls, the east dawn window band with half-raised venetian blinds,
// the south double door (one leaf open) and the south wall's acoustic
// absorber rhythm. The server glass itself lives in serverRoom.js.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';
import { canvasTexture, box, std } from './tex.js';

const S = STATION01;
const R = S.room;

function floorTexture() {
  return canvasTexture(2048, 1400, (g, w, h) => {
    g.fillStyle = '#b9bcbe'; g.fillRect(0, 0, w, h);
    // speckle
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      g.fillStyle = Math.random() > 0.5 ? 'rgba(90,95,100,0.13)' : 'rgba(235,238,240,0.13)';
      g.fillRect(x, y, 2.2, 2.2);
    }
    // 600 mm tile grid: 22 x 15 tiles
    g.strokeStyle = 'rgba(70,75,80,0.55)'; g.lineWidth = 3;
    for (let i = 0; i <= 22; i++) { g.beginPath(); g.moveTo((i / 22) * w, 0); g.lineTo((i / 22) * w, h); g.stroke(); }
    for (let j = 0; j <= 15; j++) { g.beginPath(); g.moveTo(0, (j / 15) * h); g.lineTo(w, (j / 15) * h); g.stroke(); }
    // one darker tile on the entrance path (a thousand footsteps)
    g.fillStyle = 'rgba(80,82,84,0.20)';
    g.fillRect((13 / 22) * w, (12 / 15) * h, w / 22, h / 15);
  });
}

export function createControlRoom() {
  const group = new THREE.Group();
  group.name = 's01-room';
  const wallMat = std(0xd9d5c9, { roughness: 0.92 });
  const ceilMat = std(0xe6e2d8, { roughness: 0.95 });

  // floor (raised access floor, top surface at y=0)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.widthX, R.depthZ),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.5, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  const floorSlab = box(R.widthX, 0.45, R.depthZ, std(0x6d6a63, { roughness: 0.95 }));
  floorSlab.position.set(0, -0.226, 0);
  group.add(floorSlab);

  // ceiling + cove shadow gap
  const ceil = box(R.widthX, 0.08, R.depthZ, ceilMat);
  ceil.position.set(0, R.height + 0.04, 0);
  group.add(ceil);
  // acoustic baffle strips over the console area (two aged slightly darker)
  const baffleMat = std(0xefece4, { roughness: 0.95 });
  const baffleOld = std(0xe0dbcd, { roughness: 0.95 });
  for (let i = 0; i < 7; i++) {
    const b = box(0.28, 0.18, 5.6, i === 2 || i === 5 ? baffleOld : baffleMat);
    b.position.set(-4.2 + i * 1.4, R.height - 0.09, 0.6);
    group.add(b);
  }
  // two air-con cassettes over the rear half
  const cassMat = std(0xdcd8ce, { roughness: 0.8 });
  for (const x of [-3.4, 3.4]) {
    const c = box(1.2, 0.06, 1.2, cassMat);
    c.position.set(x, R.height - 0.03, 3.4);
    group.add(c);
    for (let i = 0; i < 5; i++) {
      const louvre = box(1.1, 0.015, 0.07, std(0xb9b4a8, { roughness: 0.8 }));
      louvre.position.set(x, R.height - 0.065, 3.4 - 0.4 + i * 0.2);
      group.add(louvre);
    }
  }

  // north wall (behind the video wall) and south wall
  const north = box(R.widthX, R.height, 0.12, wallMat);
  north.position.set(0, R.height / 2, R.northZ - 0.06);
  group.add(north);
  // south wall in segments — the doorway (x 1.0..2.4) is a real opening
  const southSeg = (x0, x1, y0 = 0, y1 = R.height) => {
    const seg = box(x1 - x0, y1 - y0, 0.12, wallMat);
    seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, R.southZ + 0.06);
    group.add(seg);
  };
  southSeg(-R.widthX / 2, S.door.x0);
  southSeg(S.door.x1, R.widthX / 2);
  southSeg(S.door.x0, S.door.x1, S.door.h, R.height);
  // the airlock glimpse behind the opening: dark lobby, one light strip
  const lobbyMat = std(0x2e3134, { roughness: 0.95 });
  const lobbyBack = box(2.2, 2.6, 0.1, lobbyMat);
  lobbyBack.position.set(1.7, 1.3, R.southZ + 0.95);
  group.add(lobbyBack);
  for (const lx of [0.62, 2.78]) {
    const side = box(0.08, 2.6, 0.95, lobbyMat);
    side.position.set(lx, 1.3, R.southZ + 0.5);
    group.add(side);
  }
  const lobbyStrip = box(1.2, 0.04, 0.12, new THREE.MeshBasicMaterial({ color: 0xd8d2c2 }));
  lobbyStrip.position.set(1.7, 2.42, R.southZ + 0.5);
  group.add(lobbyStrip);
  // south wall acoustic absorber modules (warm grey / desat teal grid)
  const acA = std(S.tones.acousticA, { roughness: 1.0 });
  const acB = std(S.tones.acousticB, { roughness: 1.0 });
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 2; j++) {
      const p = box(1.2, 0.6, 0.05, (i + j) % 3 === 0 ? acB : acA);
      p.position.set(-5.6 + i * 1.4, 0.85 + j * 0.72, R.southZ - 0.028);
      group.add(p);
    }
  }

  // east wall segments: mimic zone (north), window band (south), piers
  const east = (z0, z1, y0 = 0, y1 = R.height) => {
    const seg = box(0.12, y1 - y0, z1 - z0, wallMat);
    seg.position.set(R.eastX + 0.06, (y0 + y1) / 2, (z0 + z1) / 2);
    group.add(seg);
  };
  east(R.northZ, S.windows.z0);                    // north segment (mimic mounts here)
  east(S.windows.z1, R.southZ);                    // south pier
  east(S.windows.z0, S.windows.z1, 0, S.windows.sillY);          // below sill
  east(S.windows.z0, S.windows.z1, S.windows.topY, R.height);    // header
  // west wall segments around the server glass
  const west = (z0, z1) => {
    const seg = box(0.12, R.height, z1 - z0, wallMat);
    seg.position.set(R.westX - 0.06, R.height / 2, (z0 + z1) / 2);
    group.add(seg);
  };
  west(R.northZ, S.serverRoom.glassZ0);
  west(S.serverRoom.glassZ1, R.southZ);

  // ---- dawn window: frame, glass, sky, blinds (half-raised) ----
  const winZ0 = S.windows.z0, winZ1 = S.windows.z1, winMidZ = (winZ0 + winZ1) / 2;
  const winLen = winZ1 - winZ0;
  const frameMat = std(0x5a6068, { roughness: 0.45, metalness: 0.6 });
  const sill = box(0.1, 0.05, winLen, frameMat);
  sill.position.set(R.eastX, S.windows.sillY, winMidZ);
  group.add(sill);
  for (let i = 0; i <= 4; i++) {
    const mull = box(0.08, S.windows.topY - S.windows.sillY, 0.05, frameMat);
    mull.position.set(R.eastX, (S.windows.sillY + S.windows.topY) / 2, winZ0 + (i / 4) * winLen);
    group.add(mull);
  }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winLen, S.windows.topY - S.windows.sillY),
    new THREE.MeshStandardMaterial({ color: 0x9fb4c4, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.22 }));
  glass.rotation.y = -Math.PI / 2;
  glass.position.set(R.eastX - 0.02, (S.windows.sillY + S.windows.topY) / 2, winMidZ);
  group.add(glass);
  // the dawn sky outside: indigo to amber, no sun disc (sunrise 06:12)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(winLen + 1.5, 3.4),
    new THREE.MeshBasicMaterial({ map: canvasTexture(64, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#232c47'); grad.addColorStop(0.55, '#5a4a63');
      grad.addColorStop(0.8, '#c97a35'); grad.addColorStop(1, '#e8913f');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    }) }));
  sky.rotation.y = -Math.PI / 2;
  sky.position.set(R.eastX + 1.1, 1.7, winMidZ);
  group.add(sky);
  // venetian blinds, half-raised: slats bunched over the top half,
  // tilted; bottom cassette rail at mid-height. Slats cast the bars.
  const slatMat = std(0xcac2b2, { roughness: 0.6, metalness: 0.3 });
  const blindTop = S.windows.topY - 0.06;
  for (let i = 0; i < 11; i++) {
    const slat = box(0.012, 0.018, winLen - 0.15, slatMat);
    slat.position.set(R.eastX - 0.09, blindTop - i * 0.075, winMidZ);
    slat.rotation.x = 0.6;
    slat.castShadow = true;
    group.add(slat);
  }
  const blindRail = box(0.04, 0.05, winLen - 0.1, slatMat);
  blindRail.position.set(R.eastX - 0.09, blindTop - 11 * 0.075 - 0.03, winMidZ);
  group.add(blindRail);
  const headRail = box(0.07, 0.09, winLen - 0.05, frameMat);
  headRail.position.set(R.eastX - 0.09, S.windows.topY + 0.02, winMidZ);
  group.add(headRail);

  // ---- south double door: east leaf closed, west leaf open ----
  const doorMat = std(S.tones.teak, { roughness: 0.55 });
  const leafW = (S.door.x1 - S.door.x0) / 2;
  const frame = box(S.door.x1 - S.door.x0 + 0.16, 0.08, 0.14, frameMat);
  frame.position.set((S.door.x0 + S.door.x1) / 2, S.door.h + 0.04, R.southZ);
  group.add(frame);
  const closedLeaf = box(leafW - 0.02, S.door.h, 0.05, doorMat);
  closedLeaf.position.set(S.door.x0 + leafW * 1.5, S.door.h / 2, R.southZ);
  group.add(closedLeaf);
  const closedHandle = box(0.02, 0.02, 0.16, std(PALETTE.brushedSteel, { roughness: 0.35, metalness: 0.8 }));
  closedHandle.position.set(S.door.x0 + leafW + 0.1, 1.05, R.southZ - 0.05);
  group.add(closedHandle);
  // west leaf open: hinged at the west jamb, swung into the room
  const openLeaf = new THREE.Group();
  const leafMesh = box(leafW - 0.02, S.door.h, 0.05, doorMat);
  leafMesh.geometry.translate(leafW / 2 - 0.01, 0, 0);
  leafMesh.position.y = S.door.h / 2;
  openLeaf.add(leafMesh);
  const openHandle = box(0.02, 0.02, 0.16, std(PALETTE.brushedSteel, { roughness: 0.35, metalness: 0.8 }));
  openHandle.position.set(leafW - 0.14, 1.05, -0.05);
  openLeaf.add(openHandle);
  openLeaf.position.set(S.door.x0 + 0.01, 0, R.southZ);
  openLeaf.rotation.y = 1.85;
  group.add(openLeaf);
  return group;
}
