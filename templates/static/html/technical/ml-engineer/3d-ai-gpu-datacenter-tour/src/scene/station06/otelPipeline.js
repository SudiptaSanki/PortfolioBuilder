// otelPipeline.js — the OpenTelemetry pipeline as plant: three
// cabinets along the south wall, one per Collector stage — RECEIVE →
// PROCESS → EXPORT — linked by an overhead conduit run in the
// cabling discipline (hugging walls and ceiling, never light-beams).
// The west telemetry conduit from Station 05 lands in RECEIVE;
// conduits leave EXPORT to feed the consoles, the waterfall cabinet
// and the map wall — the room's instruments are visibly fed, not
// self-powered. The flow system (flow.js) walks these same routes.

import * as THREE from 'three';
import { STATION06, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S06 = STATION06;
const PIPE = S06.pipeline;
const FACE_Z = PIPE.frontZ - 0.004;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function litMaterial(tex, glow = 0.45) {
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.5, metalness: 0.2,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow,
  });
}

function plate(w, h, lines, { px = [768, 96], ink = '#dfe7ee' } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = '#0d1015'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.3)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.fillStyle = ink;
      g.font = '700 38px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 13);
    } else {
      g.fillStyle = ink;
      g.font = '700 36px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 5);
      g.fillStyle = '#9aa7b5';
      g.font = '400 30px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 32);
    }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), litMaterial(tex, 0.38));
  m.rotation.y = Math.PI;                            // faces the room (−Z)
  return m;
}

function tube(points, radius, color, rough = 0.55) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 48, radius, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.35 });
  return new THREE.Mesh(geo, mat);
}

// Squared conduit: straight cylinder runs + joint spheres, so the
// corners stay corners and a route can hug walls and ceiling instead
// of arcing through open air (Station 05's tubeOrtho discipline).
function tubeOrtho(points, radius, color, rough = 0.55) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.35 });
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

// --------------------------------------------------------- faces --------
function header(g, w, title, sub) {
  g.fillStyle = '#141518'; g.fillRect(0, 0, w, 640);
  g.fillStyle = '#1d2024'; g.fillRect(0, 0, w, 92);
  g.fillStyle = '#e8eef4';
  g.textAlign = 'left';
  g.font = '700 44px Arial, sans-serif';
  g.fillText(title, 26, 60);
  g.fillStyle = '#9aa7b5';
  g.font = '400 28px Arial, sans-serif';
  g.fillText(sub, 26, 132);
}

function portRow(g, w, y, label, note) {
  g.fillStyle = '#1d2024'; g.fillRect(22, y, w - 44, 74);
  g.fillStyle = '#0c0d0f'; g.fillRect(38, y + 19, 38, 38);
  g.fillStyle = '#3d434a'; g.fillRect(44, y + 25, 26, 26);
  g.fillStyle = '#dfe7ee';
  g.font = '700 31px "Courier New", monospace';
  g.textAlign = 'left';
  g.fillText(label, 96, y + 48);
  if (note) {
    g.fillStyle = '#9aa7b5';
    g.font = '400 24px Arial, sans-serif';
    g.fillText(note, 96, y + 100);
  }
}

function receiveFace() {
  return canvasTexture(512, 640, (g, w) => {
    header(g, w, 'RECEIVE', 'RECEIVERS · DATA IN, ANY SOURCE');
    portRow(g, w, 168, 'OTLP · gRPC 4317', '');
    portRow(g, w, 262, 'OTLP · HTTP 4318', '');
    portRow(g, w, 356, 'PROMETHEUS SCRAPE', '');
    portRow(g, w, 450, 'LOG FILES · TAIL', '');
  });
}

function processFace() {
  return canvasTexture(512, 640, (g, w) => {
    header(g, w, 'PROCESS', 'PROCESSORS · IN ORDER, IN FLIGHT');
    const chips = ['MEMORY_LIMITER', 'BATCH', 'FILTER', 'TAIL_SAMPLING'];
    chips.forEach((chip, i) => {
      const y = 168 + i * 104;
      g.fillStyle = i === 3 ? '#2a2118' : '#1d2024';
      g.fillRect(60, y, w - 120, 68);
      g.strokeStyle = i === 3 ? '#c9a24d' : '#3d434a';
      g.lineWidth = 3;
      g.strokeRect(60, y, w - 120, 68);
      g.fillStyle = '#e8eef4';
      g.textAlign = 'center';
      g.font = '700 32px "Courier New", monospace';
      g.fillText(chip, w / 2, y + 44);
      if (i < 3) {
        g.fillStyle = '#9aa7b5';
        g.font = '700 30px Arial, sans-serif';
        g.fillText('↓', w / 2, y + 96);
      }
    });
    g.textAlign = 'left';
  });
}

function exportFace() {
  return canvasTexture(512, 640, (g, w) => {
    header(g, w, 'EXPORT', 'EXPORTERS · BACKENDS ARE REPLACEABLE');
    portRow(g, w, 168, 'TRACES → JAEGER / TEMPO', '');
    portRow(g, w, 262, 'METRICS → PROMETHEUS', '');
    portRow(g, w, 356, 'LOGS → LOKI', '');
    g.fillStyle = '#9aa7b5';
    g.font = '400 26px Arial, sans-serif';
    g.textAlign = 'left';
    g.fillText('ONE PIPELINE PER SIGNAL:', 26, 486);
    g.fillText('TRACES · METRICS · LOGS', 26, 522);
  });
}

const FACES = { receive: receiveFace, process: processFace, export: exportFace };
const NAMES = { receive: 'RECEIVE · COLLECT', process: 'PROCESS', export: 'EXPORT' };
const PLATES = {
  receive: [['EVERY SERVICE, ONE FORMAT — OTLP']],
  process: [
    ['TAIL SAMPLING — KEEP 100% OF ERRORS,', '100% OF SLOW, SAMPLE THE REST'],
    ['HEAD SAMPLING DECIDES BLIND, AT THE START'],
    ['MEMORY_LIMITER FIRST — THE PIPELINE', 'PROTECTS ITSELF BEFORE IT SERVES'],
  ],
  export: [['CHANGE THE EXPORTER,', 'KEEP THE INSTRUMENTATION']],
};

// ------------------------------------------------------------ cabinets --
function buildCabinet(group, stage, leds) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat });
  const { x } = stage;
  const body = new THREE.Mesh(new THREE.BoxGeometry(PIPE.width, PIPE.height, PIPE.depth), bodyMat);
  body.position.set(x, PIPE.height / 2, PIPE.centreZ);
  group.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(PIPE.width + 0.03, 0.04, PIPE.depth + 0.03), frameMat);
  cap.position.set(x, PIPE.height + 0.02, PIPE.centreZ);
  group.add(cap);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(PIPE.width - 0.08, PIPE.height - 0.1),
    litMaterial(FACES[stage.id](), 0.5));
  face.position.set(x, PIPE.height / 2, FACE_Z);
  face.rotation.y = Math.PI;
  group.add(face);

  // stage name on the wall above the cabinet
  const name = plate(0.92, 0.12, [NAMES[stage.id]], { px: [768, 100] });
  name.position.set(x, PIPE.height + 0.24, S06.room.depthZ / 2 - 0.03);
  group.add(name);

  // stage plates: RECEIVE / EXPORT carry theirs on the cabinet's lower
  // front; PROCESS has three, so its set stands on the wall in the gap
  // before EXPORT — the sampling decision gets wall space, as it should.
  const plates = PLATES[stage.id];
  plates.forEach((lines, i) => {
    const two = lines.length > 1;
    if (stage.id === 'process') {
      const p = plate(1.18, two ? 0.13 : 0.09, lines, { px: [1000, two ? 110 : 84] });
      p.position.set(0.92, 1.66 - i * 0.19, S06.room.depthZ / 2 - 0.03);
      group.add(p);
    } else {
      const p = plate(PIPE.width - 0.18, two ? 0.13 : 0.09, lines, { px: [900, two ? 110 : 84] });
      p.position.set(x, 0.2, FACE_Z - 0.004);
      group.add(p);
    }
  });

  // port activity telltales on the face
  const rnd = seeded(stage.x * 10 + 40);
  for (let i = 0; i < 6; i++) {
    leds.push({
      x: x - 0.6 + (i % 3) * 0.55, y: 1.62 - Math.floor(i / 3) * 0.24, z: FACE_Z - 0.004,
      color: rnd() < 0.6 ? PALETTE.ledGreen : PALETTE.ledBlue, phase: rnd(), blink: 1,
    });
  }
}

// ------------------------------------------------------------ conduits --
function buildConduits(group) {
  const steelMat = 0x3f464d;
  const darkMat = 0x23272c;
  // the west entry run: wall collar → south along the west wall → east
  // into RECEIVE's top. Tight to the walls, as the cabling discipline
  // demands — a conduit is a conduit, never a light-beam.
  group.add(tube([
    [-5.95, 2.3, S06.entry.conduitZ], [-5.9, 2.38, 0.6], [-5.82, 2.46, 2.2],
    [-5.5, PIPE.conduitY, 2.95], [-4.5, PIPE.conduitY, 3.06], [PIPE.stages[0].x, 2.5, 3.08],
  ], 0.034, steelMat));
  group.add(tube([
    [-5.95, 2.24, S06.entry.conduitZ], [-5.9, 2.32, 0.6], [-5.82, 2.4, 2.2],
    [-5.5, 2.46, 2.95], [-4.5, 2.46, 3.06], [PIPE.stages[0].x, 2.44, 3.08],
  ], 0.018, darkMat));
  // overhead tray + run linking the three stages
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(7.9, 0.03, 0.15),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.5, metalness: 0.6 }));
  tray.position.set(-0.6, PIPE.conduitY - 0.055, 3.08);
  group.add(tray);
  group.add(tube([[-4.5, PIPE.conduitY, 3.08], [PIPE.stages[1].x, PIPE.conduitY, 3.08], [3.3, PIPE.conduitY, 3.08]], 0.028, steelMat));
  for (const s of PIPE.stages) {
    group.add(tube([[s.x, PIPE.conduitY, 3.08], [s.x, 2.2, 3.06], [s.x, PIPE.height + 0.03, 3.04]], 0.022, steelMat));
  }
  // EXPORT's feeds, re-routed squared (fix loop 1): the original
  // diagonal tubes swooped through the room's air and one slashed
  // across the map face. The feeds now rise off EXPORT to a ceiling
  // run (y 3.1, just under the light strips) and travel the room's
  // edges — a south run, a north spine, and drops behind/into their
  // plant: the console arc's back, the waterfall's top, the map
  // wall's south end. The gold flow points still fly their direct
  // paths; the plumbing no longer crosses open air or the map face.
  const CEIL_Y = 3.1;
  const EXP_X = PIPE.stages[2].x;
  const feed = (pts) => group.add(tubeOrtho(pts, 0.02, darkMat));
  feed([[EXP_X, 1.95, 3.08], [EXP_X, CEIL_Y, 3.08]]);                          // rise off EXPORT
  feed([[5.7, CEIL_Y, 3.08], [EXP_X, CEIL_Y, 3.08], [0.05, CEIL_Y, 3.08]]);    // south ceiling run
  feed([[5.7, CEIL_Y, 3.08], [5.7, 2.52, 3.08]]);                              // drop into the map wall's south end
  feed([[0.05, CEIL_Y, 3.08], [0.05, CEIL_Y, -3.42]]);                         // north ceiling spine
  feed([[0.05, CEIL_Y, 1.18], [0.05, 1.14, 1.18], [0.05, 1.14, 1.04]]);        // drop behind the console arc
  feed([[0.05, CEIL_Y, -3.42], [S06.waterfall.x, CEIL_Y, -3.42],
        [S06.waterfall.x, 2.28, -3.42]]);                                     // along the north wall, down into the waterfall top
  // hanger straps tying the ceiling runs to the slab (clear of the
  // light strips at z −1.8 / 0 / 1.8 and the ceiling beams)
  const strapMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.5, metalness: 0.6 });
  const strapGeo = new THREE.BoxGeometry(0.05, S06.room.height - CEIL_Y, 0.05);
  for (const [hx, hz] of [[1.2, 3.08], [3.6, 3.08], [5.2, 3.08],
                          [0.05, 2.2], [0.05, 0.6], [0.05, -1.0], [0.05, -2.6]]) {
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(hx, (CEIL_Y + S06.room.height) / 2, hz);
    group.add(strap);
  }
}

export function createOtelPipeline() {
  const group = new THREE.Group();
  group.name = 's06-pipeline';
  const leds = [];
  for (const stage of PIPE.stages) buildCabinet(group, stage, leds);
  buildConduits(group);
  group.add(createLEDField(leds));
  return group;
}
