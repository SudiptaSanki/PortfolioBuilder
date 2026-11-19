// serverRoom.js — the SCADA server room behind the west glass: six 42U
// racks with LED fields and tape labels (SCADA-A/B, FEP-A/B, HIST-01),
// rack 3's door ajar from night maintenance, the GPS clock cabinet, and
// the UPS battery rack in the far corner. A quiet second world.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';
import { canvasTexture, fitFont, box, std } from './tex.js';

const S = STATION01;
const SR = S.serverRoom;

function rackTexture(label, variant) {
  return canvasTexture(512, 1024, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    // perforated door field
    g.fillStyle = 'rgba(200,210,220,0.10)';
    for (let x = 26; x < w - 20; x += 13) for (let y = 150; y < h - 30; y += 13) g.fillRect(x, y, 4, 4);
    // 2U server bands with LED rows
    let seed = variant * 131 + 17;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let u = 0; u < 9; u++) {
      const y = 170 + u * 88;
      g.fillStyle = '#1e2124'; g.fillRect(24, y, w - 48, 62);
      g.fillStyle = '#2b3036'; g.fillRect(24, y, w - 48, 10);
      for (let i = 0; i < 12; i++) {
        const on = rnd() > 0.25;
        g.fillStyle = !on ? '#23282c' : (rnd() > 0.88 ? '#ffb02e' : '#2fae5f');
        g.beginPath(); g.arc(52 + i * 34, y + 38, 6, 0, Math.PI * 2); g.fill();
      }
    }
    // tape label
    g.fillStyle = '#e8e6df'; g.fillRect(120, 46, 272, 58);
    g.fillStyle = '#14171a'; g.textAlign = 'center';
    fitFont(g, label, 250, 42, '700', '"Courier New", monospace');
    g.fillText(label, w / 2, 88);
    g.textAlign = 'left';
  });
}

export function createServerRoom() {
  const group = new THREE.Group();
  group.name = 's01-server-room';
  const rackMat = std(S.tones.rackBlack, { roughness: 0.5, metalness: 0.4 });
  const frameMat = std(0x4c5157, { roughness: 0.45, metalness: 0.6 });

  // ---- the glass partition (in the west wall plane) ----
  const gz0 = SR.glassZ0, gz1 = SR.glassZ1, gMid = (gz0 + gz1) / 2, gLen = gz1 - gz0;
  for (const [y0, y1] of [[0, 0.06], [3.32, 3.4]]) {
    const rail = box(0.07, y1 - y0, gLen, frameMat);
    rail.position.set(SR.glassX, (y0 + y1) / 2, gMid);
    group.add(rail);
  }
  for (let i = 0; i <= 4; i++) {
    const post = box(0.07, 3.4, 0.06, frameMat);
    post.position.set(SR.glassX, 1.7, gz0 + (i / 4) * gLen);
    group.add(post);
  }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(gLen, 3.28),
    new THREE.MeshStandardMaterial({ color: 0xaec6b8, roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
  glass.rotation.y = Math.PI / 2;
  glass.position.set(SR.glassX, 1.7, gMid);
  group.add(glass);
  // venetian film band at eye level
  const film = new THREE.Mesh(new THREE.PlaneGeometry(gLen, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xd8dcd2, roughness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  film.rotation.y = Math.PI / 2;
  film.position.set(SR.glassX, 1.55, gMid);
  group.add(film);

  // ---- the room behind: floor, back wall, ceiling strip ----
  const srFloor = box(2.6, 0.05, 8.6, std(0x8e9296, { roughness: 0.7 }));
  srFloor.position.set(-7.9, -0.026, -0.6);
  group.add(srFloor);
  // perforated airflow tiles under the racks (drawn dots on a strip)
  const perf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 6.4),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 1024, (g, w, h) => {
        g.fillStyle = '#9aa0a4'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(40,44,48,0.6)';
        for (let x = 12; x < w; x += 18) for (let y = 12; y < h; y += 18) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
      }), roughness: 0.6,
    }));
  perf.rotation.x = -Math.PI / 2;
  perf.position.set(-7.55, 0.002, -0.85);
  group.add(perf);
  const backWall = box(0.1, 3.4, 8.6, std(0x3a3f45, { roughness: 0.9 }));
  backWall.position.set(-9.25, 1.7, -0.6);
  group.add(backWall);
  const srCeil = box(2.6, 0.06, 8.6, std(0x2e3237, { roughness: 0.95 }));
  srCeil.position.set(-7.9, 3.38, -0.6);
  group.add(srCeil);
  const strip = box(1.8, 0.03, 0.18, new THREE.MeshBasicMaterial({ color: 0xcfd6da }));
  strip.position.set(-7.9, 3.34, -0.6);
  group.add(strip);

  // ---- six racks ----
  const labels = ['SCADA-A', 'SCADA-B', 'FEP-A', 'FEP-B', 'HIST-01', 'EMS-APP'];
  SR.rackZ.forEach((z, i) => {
    const rack = new THREE.Group();
    const body = box(1.0, 2.0, 0.6, rackMat);
    body.position.y = 1.0;
    rack.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.94),
      new THREE.MeshStandardMaterial({ map: rackTexture(labels[i], i + 1), roughness: 0.55 }));
    front.rotation.y = Math.PI / 2;
    if (i === 2) {
      // rack 3's door ajar: front panel hinged at its north edge
      // (geometry offset so the mesh origin sits on the hinge line)
      front.geometry = new THREE.PlaneGeometry(0.56, 1.94);
      front.geometry.translate(-0.28, 0, 0);
      front.position.set(0.505, 1.0, -0.28);
      front.rotation.y = Math.PI / 2 - 0.35;
      const patch = box(0.04, 0.5, 0.1, std(0xd9a441, { roughness: 0.6 }));
      patch.position.set(0.32, 1.35, -0.1);
      rack.add(patch);
    } else {
      front.position.set(0.505, 1.0, 0);
    }
    rack.add(front);
    rack.position.set(SR.rackX, 0, z);
    group.add(rack);
  });

  // ---- GPS clock cabinet (small, north end) ----
  const gps = new THREE.Group();
  const gpsBody = box(0.8, 1.4, 0.5, rackMat);
  gpsBody.position.y = 0.7;
  gps.add(gpsBody);
  const gpsFace = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.3),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 720, (g, w, h) => {
        g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#e8e6df'; g.fillRect(28, 30, w - 56, 54);
        g.fillStyle = '#14171a'; g.textAlign = 'center';
        fitFont(g, 'GPS CLOCK', 190, 36, '700', '"Courier New", monospace');
        g.fillText('GPS CLOCK', w / 2, 68);
        g.fillStyle = '#7fe0c3'; g.font = '400 30px "Courier New", monospace';
        g.fillText('IRIG-B / PTP', w / 2, 150);
        g.fillText('GRANDMASTER', w / 2, 192);
        g.fillStyle = '#2fae5f';
        g.beginPath(); g.arc(w / 2, 300, 16, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e8e6df'; g.font = '700 32px Arial, sans-serif';
        g.fillText('LOCKED', w / 2, 356);
        g.fillStyle = '#8fa5b5'; g.font = '400 28px "Courier New", monospace';
        g.fillText('05:58:40', w / 2, 460);
        g.textAlign = 'left';
      }), roughness: 0.55,
    }));
  gpsFace.rotation.y = Math.PI / 2;
  gpsFace.position.set(0.405, 0.7, 0);
  gps.add(gpsFace);
  gps.position.set(SR.rackX, 0, SR.gpsZ);
  group.add(gps);

  // ---- UPS battery rack: 2 V cells with copper inter-cell links ----
  const batt = new THREE.Group();
  const shelfMat = std(0x4c5157, { roughness: 0.5, metalness: 0.6 });
  for (const y of [0.25, 0.75, 1.25]) {
    const shelf = box(0.55, 0.04, 1.1, shelfMat);
    shelf.position.y = y;
    batt.add(shelf);
    for (let i = 0; i < 5; i++) {
      const cell = box(0.4, 0.42, 0.18, std(0x9aa0a4, { roughness: 0.35, metalness: 0.1 }));
      cell.position.set(0, y + 0.23, -0.44 + i * 0.22);
      batt.add(cell);
      const cap = box(0.1, 0.04, 0.1, std(0x2b2f34, { roughness: 0.5 }));
      cap.position.set(0, y + 0.46, -0.44 + i * 0.22);
      batt.add(cap);
      if (i < 4) {
        const link = box(0.05, 0.015, 0.22, std(PALETTE.copper, { roughness: 0.35, metalness: 0.9 }));
        link.position.set(0, y + 0.47, -0.33 + i * 0.22);
        batt.add(link);
      }
    }
  }
  for (const dz of [-0.52, 0.52]) {
    const post = box(0.55, 1.55, 0.04, shelfMat);
    post.position.set(0, 0.78, dz);
    batt.add(post);
  }
  const battLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(512, 128, (g, w, h) => {
        g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#14171a'; g.textAlign = 'center';
        fitFont(g, 'UPS BATTERY · 240 V DC', 470, 52, '700', '"Courier New", monospace');
        g.fillText('UPS BATTERY · 240 V DC', w / 2, h / 2 + 18);
      }), roughness: 0.6,
    }));
  battLabel.rotation.y = Math.PI / 2;
  battLabel.position.set(0.29, 1.62, 0);
  batt.add(battLabel);
  batt.position.set(SR.rackX, 0, SR.batteryZ);
  group.add(batt);

  return group;
}
