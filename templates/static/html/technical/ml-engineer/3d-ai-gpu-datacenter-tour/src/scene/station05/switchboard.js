// switchboard.js — the service & ingress switchboard (the
// attentionBoard.js role: the wall that explains routing). A wide
// patch panel on the north wall in the telephone-switchboard
// tradition: labelled service sockets, and endpoint cords plugged
// from each service to the pods currently behind it — cords land
// only on READY pods, and one socket sits deliberately empty. The
// EndpointSlice as a plug list: who is plugged in IS who gets
// traffic. Above it, the ingress fascia: the shared front door,
// routing by host and path. Cords travel dressed — up into the
// overhead tray, along it, down a column, along the floor — never
// loose catenary spaghetti; tidiness is the realism cue.

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S05 = STATION05;
const SB = S05.switchboard;
const PANEL = { cx: (SB.x0 + SB.x1) / 2, w: SB.x1 - SB.x0, h: 1.15, frontZ: -3.34 };
// service rows, west → east on the panel face (canvas rows top→bottom)
const SERVICES = [
  { name: 'model-api', ip: 'ClusterIP 10.96.14.7:80' },
  { name: 'model-api-canary', ip: 'ClusterIP 10.96.14.8:80' },
  { name: 'feature-store', ip: 'ClusterIP 10.96.3.21:9000' },
  { name: 'metrics', ip: 'ClusterIP 10.96.7.2:9090' },
];
const rowY = (i) => SB.panelY + (0.5 - (88 + i * 52) / 280) * PANEL.h;
const SOCK_X = [4.01, 4.25];                       // physical socket columns
const EMPTY_SOCK = { x: 3.64, row: 0 };            // the NOT READY socket

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function tube(points, radius, color, rough = 0.55) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 48, radius, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
  return new THREE.Mesh(geo, mat);
}

// Squared conduit runs: straight cylinders + joint spheres through
// the waypoints, NO curve smoothing. A CatmullRom through squared
// waypoints rounds every corner into a free arc — the dressed route
// is the discipline: rise against the surface, run in the tray,
// descend inside the trunking, floor channel to the berth.
function tubeOrtho(points, radius, color, rough = 0.55) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
  const pts = points.map((p) => new THREE.Vector3(...p));
  const cylGeo = new THREE.CylinderGeometry(radius, radius, 1, 6);
  const sphGeo = new THREE.SphereGeometry(radius, 8, 6);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = a.distanceTo(b);
    if (len < 1e-6) continue;
    const cyl = new THREE.Mesh(cylGeo, mat);
    cyl.position.copy(a).lerp(b, 0.5);
    cyl.scale.set(1, len, 1);
    cyl.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    group.add(cyl);
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const joint = new THREE.Mesh(sphGeo, mat);
    joint.position.copy(pts[i]);
    group.add(joint);
  }
  return group;
}

// ---------------------------------------------------------------- panel --
function panelFaceTex() {
  return canvasTexture(1024, 280, (g, w, h) => {
    g.fillStyle = '#202329'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4'; g.textAlign = 'left';
    g.font = '700 30px Arial, sans-serif';
    g.fillText('SERVICES · PATCH PANEL', 26, 38);
    g.font = '400 23px Arial, sans-serif'; g.fillStyle = '#9aa0a6';
    g.fillText('ENDPOINTSLICE — WHO IS READY NOW', 560, 38);
    SERVICES.forEach((s, i) => {
      const cy = 88 + i * 52;
      g.fillStyle = i % 2 ? '#23262c' : '#262a30';
      g.fillRect(14, cy - 24, w - 28, 46);
      g.fillStyle = '#f2f3f4'; g.font = '400 27px "Courier New", monospace';
      g.fillText(s.name, 30, cy + 9);
      g.fillStyle = '#9aa0a6'; g.font = '400 24px "Courier New", monospace';
      g.fillText(s.ip, 470, cy + 9);
      for (const sx of [880, 940]) {                       // plugged sockets
        g.beginPath(); g.arc(sx, cy, 15, 0, Math.PI * 2);
        g.fillStyle = '#0c0d0f'; g.fill();
        g.strokeStyle = '#7d838a'; g.lineWidth = 3; g.stroke();
        g.beginPath(); g.arc(sx, cy, 5, 0, Math.PI * 2);
        g.fillStyle = '#2fb7c9'; g.fill();
      }
    });
    // the empty socket on the model-api row: a ring, no plug, no light
    g.beginPath(); g.arc(790, 88, 15, 0, Math.PI * 2);
    g.strokeStyle = '#7d838a'; g.lineWidth = 3; g.stroke();
  });
}

function buildPanel(group, leds) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.5 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(PANEL.w + 0.05, PANEL.h + 0.05, 0.07), frameMat);
  frame.position.set(PANEL.cx, SB.panelY, SB.z);
  group.add(frame);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL.w, PANEL.h),
    new THREE.MeshStandardMaterial({ map: panelFaceTex(), roughness: 0.55, metalness: 0.25 }));
  face.position.set(PANEL.cx, SB.panelY, PANEL.frontZ);
  group.add(face);
  // physical sockets proud of the face, two per service row
  const sockMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.4, metalness: 0.6 });
  const rimMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const sockGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.028, 12);
  const rimGeo = new THREE.TorusGeometry(0.027, 0.006, 6, 16);
  SERVICES.forEach((s, i) => {
    for (const sx of SOCK_X) {
      const sock = new THREE.Mesh(sockGeo, sockMat);
      sock.rotation.x = Math.PI / 2;
      sock.position.set(sx, rowY(i), PANEL.frontZ + 0.012);
      group.add(sock);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(sx, rowY(i), PANEL.frontZ + 0.026);
      group.add(rim);
      leds.push({ x: sx, y: rowY(i) + 0.045, z: PANEL.frontZ + 0.01, color: PALETTE.ledGreen, phase: i * 0.2 + sx, blink: 0.2 });
    }
  });
  // the empty socket: just a ring — no plug, no cord, no light
  const ring = new THREE.Mesh(rimGeo, rimMat);
  ring.position.set(EMPTY_SOCK.x, rowY(EMPTY_SOCK.row), PANEL.frontZ + 0.01);
  group.add(ring);
}

// --------------------------------------------------------------- fascia --
function fasciaTex() {
  return canvasTexture(1024, 128, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4'; g.textAlign = 'left';
    g.font = '700 30px Arial, sans-serif';
    g.fillText('INGRESS · SHARED FRONT DOOR', 24, 40);
    g.font = '400 27px "Courier New", monospace'; g.fillStyle = '#c8ccd1';
    g.fillText('api.example.dev /model    → model-api', 24, 84);
    g.fillText('api.example.dev /features → feature-store', 24, 118);
  });
}

function buildFascia(group) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.5 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(PANEL.w + 0.05, 0.56, 0.06), frameMat);
  frame.position.set(PANEL.cx, SB.fasciaY, SB.z + 0.01);
  group.add(frame);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL.w, 0.52),
    new THREE.MeshStandardMaterial({ map: fasciaTex(), roughness: 0.55, metalness: 0.25 }));
  face.position.set(PANEL.cx, SB.fasciaY, PANEL.frontZ + 0.005);
  group.add(face);
  // external traffic arrives along the north wall from the west
  group.add(tubeOrtho([
    [-6.02, SB.fasciaY, -3.3], [-3.4, SB.fasciaY, -3.31], [SB.x0 - 0.05, SB.fasciaY, -3.32],
  ], 0.02, PALETTE.galvanised));
  const rodMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.45, metalness: 0.8 });
  for (const rx of [-5.2, -3.2, -1.2]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, S05.room.height - SB.fasciaY, 5), rodMat);
    rod.position.set(rx, (SB.fasciaY + S05.room.height) / 2, -3.3);
    group.add(rod);
  }
}

// ----------------------------------------------------------------- tray --
// The overhead route the cords (and the traffic in flow.js) share:
// north run above the panel, a south leg over the west walkway to
// the gate column, and a branch south over the node field's aisle.
function buildTray(group) {
  const trayMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.5, metalness: 0.7 });
  const run = (cx, cz, len, alongX) => {
    const g = new THREE.Group();
    const deckGeo = alongX ? new THREE.BoxGeometry(len, 0.035, 0.2) : new THREE.BoxGeometry(0.2, 0.035, len);
    const deck = new THREE.Mesh(deckGeo, trayMat);
    g.add(deck);
    for (const s of [-1, 1]) {
      const lipGeo = alongX ? new THREE.BoxGeometry(len, 0.055, 0.018) : new THREE.BoxGeometry(0.018, 0.055, len);
      const lip = new THREE.Mesh(lipGeo, trayMat);
      if (alongX) lip.position.set(0, 0.02, s * 0.095); else lip.position.set(s * 0.095, 0.02, 0);
      g.add(lip);
    }
    g.position.set(cx, S05.tray.y, cz);
    group.add(g);
  };
  run(0.71, S05.tray.northZ, 7.18, true);                 // north run
  run(S05.tray.southX, -0.63, 5.26, false);               // south leg to the gate
  run(2.0, -1.855, 2.81, false);                          // branch over the aisle
  const rodMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.45, metalness: 0.8 });
  const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, S05.room.height - S05.tray.y - 0.02, 5);
  for (const [rx, rz] of [[-2.4, -3.26], [0.6, -3.26], [3.4, -3.26], [-2.88, -0.8], [-2.88, 1.2], [2.0, -1.6]]) {
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(rx, (S05.tray.y + S05.room.height) / 2, rz);
    group.add(rod);
  }
  // drop columns: gate (west) and node field (east) — floor trunking.
  // Fix loop 3: the gate column stood at z 1.95, interpenetrating
  // the canary drum (body z 1.79–2.21) and hiding the middle of its
  // reading face; it now stands at z 1.35, beside the gate's north
  // post (post z 1.195–1.285), still meeting the south leg's tray
  // mid-run — the leg passes directly overhead.
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat });
  for (const [tx, tz] of [[S05.tray.southX, 1.35], [2.0, -0.45]]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.13, S05.tray.y, 0.13), trunkMat);
    col.position.set(tx, S05.tray.y / 2, tz);
    group.add(col);
  }
}

// ----------------------------------------------------------------- cords --
// Dressed endpoint cords: socket → tray → column → floor → berth.
// Every run is SQUARED (tubeOrtho): rise tight against the panel
// face to the overhead tray's underside, west strapped under the
// tray, south under the tray leg, down INSIDE the drop trunking,
// then a floor channel that turns at right angles into its berth.
// No free arcs, no diagonal drapes, nothing crossing a walkway
// in the air.
// Only ready pods are plugged in — that is the whole Service idea.
function buildCords(group) {
  const aqua = PALETTE.fibreAqua;
  // model-api → v1 lane head (under-tray lane z −3.28)
  group.add(tubeOrtho([
    [SOCK_X[0], rowY(0), -3.31],              // the socket (endpoint)
    [4.01, 2.50, -3.28],                      // rise in front of the fascia, to the tray underside
    [-2.93, 2.50, -3.28],                     // west, strapped under the tray
    [-2.93, 2.50, 1.35],                      // south, under the gate leg's tray
    [-2.88, 0.07, 1.35],                      // down inside the gate drop column (z 1.35 since fix loop 3)
    [-2.46, 0.07, 1.35],                      // floor channel east, along the gate line
    [-2.46, 0.07, 1.55],                      // north to the v1 lane's west end
    [-2.46, 0.30, 1.55],                      // rise at the lane end post
    [-2.12, 0.3, S05.lanes.v1.z],             // plug stub into the head seat (endpoint)
  ], 0.011, aqua));
  // model-api-canary → v2 lane head (under-tray lane z −3.22)
  group.add(tubeOrtho([
    [SOCK_X[0], rowY(1), -3.31],              // the socket (endpoint)
    [4.01, 2.50, -3.22],                      // rise in front of the fascia, to the tray underside
    [-2.84, 2.50, -3.22],                     // west, strapped under the tray
    [-2.84, 2.50, 1.35],                      // south, under the gate leg's tray
    [-2.86, 0.07, 1.35],                      // down inside the gate drop column (z 1.35 since fix loop 3)
    [-2.86, 0.07, 2.45],                      // floor channel south, west of the v2 lane head
    [-2.46, 0.07, 2.45],                      // east to the lane's west end
    [-2.46, 0.30, 2.45],                      // rise at the end post
    [-2.12, 0.3, S05.lanes.v2.z],             // plug stub into the head seat (endpoint)
  ], 0.011, aqua));
  // feature-store → a berth on NODE 4, via the aisle branch column
  // (under-tray lane z −3.25; the floor run stays at the aisle's
  // east edge and along the rack's plinth — never a diagonal
  // across the aisle)
  group.add(tubeOrtho([
    [SOCK_X[0], rowY(2), -3.31],              // the socket (endpoint)
    [4.01, 2.50, -3.25],                      // rise in front of the fascia, to the tray underside
    [2.00, 2.50, -3.25],                      // west to the aisle branch
    [2.00, 2.50, -0.50],                      // south, under the branch tray
    [2.00, 0.07, -0.47],                      // down inside the branch drop column
    [2.00, 0.07, 0.20],                       // floor channel south, at the aisle's east edge
    [1.64, 0.07, 0.20],                       // west along NODE 4's plinth base
    [1.64, 0.95, 0.20],                       // rise up the rack's east cheek, clear of the shelves
    [1.64, 0.95, 0.25],                       // jog onto the face line, clear of the capsules
    [1.38, 0.95, 0.25],                       // plug stub into the berth (endpoint)
  ], 0.011, aqua));
  // metrics → east along the wall → the exit collar (Station 06's feed)
  group.add(tubeOrtho([
    [SOCK_X[0], rowY(3), -3.31],              // the socket (endpoint)
    [4.70, 1.073, -3.31],                     // east in front of the panel face, to its edge
    [4.70, 2.27, -3.31],                      // rise against the north wall
    [5.90, 2.27, -3.46],                      // east along the wall at collar height
    [5.93, 2.27, 2.00],                       // south along the east wall
    [6.04, 2.27, S05.exit.doorZ],             // into the exit collar (endpoint)
  ], 0.013, PALETTE.galvanised));
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.22, 0.22),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.45, metalness: 0.8 }));
  collar.position.set(5.97, 2.27, S05.exit.doorZ);
  group.add(collar);
  // two short patch loops on the panel face — switchboard flavour
  group.add(tube([
    [SOCK_X[1], rowY(0), -3.32], [4.33, (rowY(0) + rowY(1)) / 2, -3.27], [SOCK_X[1], rowY(1), -3.32],
  ], 0.009, aqua));
  group.add(tube([
    [SOCK_X[1], rowY(2), -3.32], [4.33, (rowY(2) + rowY(3)) / 2, -3.27], [SOCK_X[1], rowY(3), -3.32],
  ], 0.009, aqua));
}

export function createSwitchboard() {
  const group = new THREE.Group();
  group.name = 's05-switchboard';
  const leds = [];
  buildPanel(group, leds);
  buildFascia(group);
  buildTray(group);
  buildCords(group);
  group.add(createLEDField(leds));
  return group;
}
