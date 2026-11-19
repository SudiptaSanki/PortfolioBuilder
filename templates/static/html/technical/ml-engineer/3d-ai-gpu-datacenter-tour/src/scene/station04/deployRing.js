// deployRing.js — the orbital conveyor (HERO). At the east end of
// the hall, a waist-high annular conveyor — a steel ring track on a
// plinth — carries finished image crates parked at five labelled
// stations around its rim: LOADED → SIGNED → SBOM ATTACHED →
// VERIFIED → DISPATCH. This is the orbital assembly track of every
// CI/CD diagram extruded into plant: a machine you could trip over,
// not a halo. The crates do not circulate on their own — builds sit
// at different stages, and the ring is a queue you can see; only the
// flow pulse makes the circuit. On the ring's east side, the deploy
// gate is the one point where a crate's journey leaves the ring,
// and beside the door the GitOps lectern holds the deployment
// repository's page: the pipeline's last act is a commit.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';

const S04 = STATION04;
const R = S04.ring;

// station name, angle (deg), crate label, gold trim — in the order
// the signed packet travels them, entry at the south rim
const STATIONS = [
  { name: 'LOADED', angle: 322, crate: 'trainer · v0.9.3', gold: false },
  { name: 'SIGNED', angle: 264, crate: 'feature-pipeline · v2.1.0', gold: false },
  { name: 'SBOM ATTACHED', angle: 206, crate: 'lattice-serve · v1.0.7', gold: false },
  { name: 'VERIFIED', angle: 148, crate: 'model-server · v1.4.1', gold: false },
  { name: 'DISPATCH', angle: 90, crate: 'model-server · v1.4.2', gold: true },
];

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function stationPoint(angleDeg, r) {
  const th = angleDeg * Math.PI / 180;
  return { x: R.x + r * Math.sin(th), z: R.z + r * Math.cos(th), th };
}

// ------------------------------------------------------------ ring -----
function buildRing(group) {
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.7, 0.84, 48), galv);
  plinth.position.set(R.x, 0.42, R.z);
  group.add(plinth);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(1.76, 1.78, 0.06, 48), galv);
  flange.position.set(R.x, 0.03, R.z);
  group.add(flange);
  // the palette's one industrial accent, used once: a safety stripe
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(1.715, 0.014, 8, 64),
    new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, roughness: 0.6, metalness: 0.2 }));
  stripe.rotation.x = Math.PI / 2;
  stripe.position.set(R.x, 0.1, R.z);
  group.add(stripe);

  // the track: a true flat annulus, extruded — a conveyor, not a halo
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.58, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 1.12, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const trackGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 64 });
  const track = new THREE.Mesh(trackGeo,
    new THREE.MeshStandardMaterial({ color: 0x8f959a, roughness: 0.38, metalness: 0.8 }));
  track.rotation.x = -Math.PI / 2;
  track.position.set(R.x, R.topY - 0.08, R.z);
  group.add(track);
  // segment seams across the track — machinery, not magic
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x565d64, roughness: 0.5, metalness: 0.7 });
  for (let a = 0; a < 360; a += 30) {
    const p = stationPoint(a, R.radius);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.006, 0.46), seamMat);
    seam.position.set(p.x, R.topY + 0.003, p.z);
    seam.rotation.y = p.th;
    group.add(seam);
  }
  // centre hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.18, 32), galv);
  hub.position.set(R.x, R.topY + 0.09, R.z);
  group.add(hub);
  const hubTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.012, 8, 40),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayTrim, ...SURFACE.brushedSteel }));
  hubTrim.rotation.x = Math.PI / 2;
  hubTrim.position.set(R.x, R.topY + 0.17, R.z);
  group.add(hubTrim);
}

// ----------------------------------------------------------- crates ----
function buildCrates(group) {
  for (const st of STATIONS) {
    const p = stationPoint(st.angle, R.radius);
    const crate = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.42, 0.56),
      new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat }));
    body.position.y = 0.21;
    crate.add(body);
    const trimMat = new THREE.MeshStandardMaterial({
      color: st.gold ? PALETTE.dgxGold : PALETTE.trayTrim,
      ...(st.gold ? SURFACE.gold : SURFACE.brushedSteel),
    });
    for (const [dx, dz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.035), trimMat);
      post.position.set(dx, 0.21, dz);
      crate.add(post);
    }
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.58), trimMat);
    rim.position.y = 0.425;
    crate.add(rim);
    const tex = canvasTexture(512, 128, (g, w, h) => {
      g.fillStyle = '#e8eaec'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#14171a';
      g.textAlign = 'center';
      g.font = '700 40px "Courier New", monospace';
      g.fillText(st.crate, w / 2, h / 2 + 14);
    });
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.11),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
    plate.position.set(0, 0.22, 0.285);
    crate.add(plate);
    crate.position.set(p.x, R.topY, p.z);
    crate.rotation.y = p.th;                       // face outward, to the hall
    group.add(crate);
  }
}

// ------------------------------------------------------ deploy gate ----
function buildDeployGate(group) {
  const gx = 5.42, gz = S04.exitDoorZ;
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  for (const dz of [-0.45, 0.45]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.9, 0.07), steel);
    upright.position.set(gx, 0.95, gz + dz);
    group.add(upright);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.24), darkSteel);
    foot.position.set(gx, 0.02, gz + dz);
    group.add(foot);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 1.04), steel);
  beam.position.set(gx, 1.9, gz);
  group.add(beam);
  // the chute: a steel trough from the ring's rim down toward the door
  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.035, 0.6),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  chute.position.set(5.45, 0.8, gz);
  chute.rotation.z = -0.13;
  group.add(chute);
  for (const dz of [-0.29, 0.29]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.07, 0.02),
      new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
    lip.position.set(5.45, 0.83, gz + dz);
    lip.rotation.z = -0.13;
    group.add(lip);
  }
}

// ---------------------------------------------------- GitOps lectern ---
function gitopsTexture() {
  const tex = canvasTexture(640, 448, (g, w, h) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'left';
    g.font = '700 38px Arial, sans-serif';
    g.fillText('GITOPS · DEPLOYMENT REPO', 36, 64);
    g.fillStyle = '#3a3e44'; g.fillRect(36, 88, w - 72, 2);
    g.font = '400 30px "Courier New", monospace';
    g.fillStyle = '#e8eaec';
    g.fillText('image:', 36, 150);
    g.fillText('model-server@sha256:9f86…', 36, 192);
    g.fillStyle = '#3a3e44'; g.fillRect(36, 224, w - 72, 2);
    g.font = '700 32px Arial, sans-serif';
    g.fillStyle = '#39ff7a';
    g.fillText('ARGO CD · SYNCED', 36, 282);
    g.font = '400 28px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('DESIRED STATE = GIT', 36, 326);
    g.fillText('RECONCILES ≈ EVERY 3 MIN', 36, 366);
  });
  // box top-face UVs: rotate so the page reads upright for the
  // reader standing at the lectern (the Station 01 lectern fix)
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  return tex;
}

function buildGitopsLectern(group) {
  const lect = new THREE.Group();
  lect.position.set(5.42, 0, -1.62);
  lect.rotation.y = Math.PI / 2;                   // reader stands west, in the room
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.5 });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.82, 0.36), deskMat);
  pedestal.position.y = 0.41;
  lect.add(pedestal);
  const slope = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.04, 0.5),
    new THREE.MeshStandardMaterial({ map: gitopsTexture(), roughness: 0.55, metalness: 0.2 }));
  slope.position.set(0, 0.94, 0.02);
  slope.rotation.x = -0.42;
  lect.add(slope);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.03, 0.03), deskMat);
  lip.position.set(0, 0.845, 0.245);
  lect.add(lip);
  group.add(lect);
}

export function createDeployRing() {
  const group = new THREE.Group();
  group.name = 's04-deploy-ring';
  buildRing(group);
  buildCrates(group);
  buildDeployGate(group);
  buildGitopsLectern(group);
  return group;
}
