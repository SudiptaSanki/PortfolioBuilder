// lmHead.js — the LM head (east end): where the finished vectors are
// scored against the whole vocabulary and the next token is chosen.
// The residual spine's feed rail runs from the last bay to a FINAL LN
// collar — the last rescaling before scoring, mirroring the per-block
// gates. Above it, the logit scoreboard: the one dark panel in the
// hall, so its bars read — five candidate next tokens as horizontal
// bars (length = logit), the winner lit green with its probability,
// and the rest of the vocabulary dismissed in one plate line:
// + 50,252 MORE · VOCAB 50,257 (GPT-2's vocabulary). Below, the
// next-token chute: one token plate emerging — SAMPLE → APPEND →
// REPEAT, the autoregressive loop made physical. An exit conduit
// leaves east through the wall toward Station 03's training cluster.

import * as THREE from 'three';
import { STATION02, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S02 = STATION02;
const LM = S02.lmHead;
const SPINE_Y = S02.spine.y;

// Fix loop 3: the scoreboard rides 0.12 m above the world.js boardY
// datum. The raise is what lets a low camera keep bay 6's portal-beam
// shadow entirely above the title while the whole panel — south
// frame edge included — stays inside the lmhead frame (solver-
// verified; see the lmhead pose note in station02-main.js). Panel
// proportions, canvas and copy are unchanged. The FINAL LN collar
// below is NOT raised: it is feed-rail furniture, not part of the
// board, and the raise also lifts the panel's bottom edge clear of
// the plate's top edge (they overlapped by 55 mm at the old datum).
const BOARD_Y = LM.boardY + 0.12;

// Candidates for the position after the worked sentence's last token
// — a new sentence begins. Logits are the raw scores; softmax turns
// them into the probabilities, the winner's shown on the board.
const CANDIDATES = [
  { tok: 'the', logit: 9.6, p: 0.38 },
  { tok: 'a', logit: 8.7 },
  { tok: 'it', logit: 8.1 },
  { tok: 'on', logit: 7.3 },
  { tok: 'cat', logit: 6.8 },
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

function scoreboardTexture() {
  return canvasTexture(1100, 750, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'left';
    g.font = '700 44px Arial, sans-serif';
    g.fillText('NEXT TOKEN · LOGITS', 48, 70);
    g.font = '400 30px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('P(next) = softmax(logits)', 48, 116);
    const x0 = 210, x1 = 880, maxLogit = 10.5;
    CANDIDATES.forEach((cd, i) => {
      const y = 168 + i * 92;
      g.fillStyle = '#f2f3f4';
      g.font = '700 46px Georgia, serif';
      g.textAlign = 'right';
      g.fillText(cd.tok, x0 - 24, y + 46);
      const bw = (cd.logit / maxLogit) * (x1 - x0);
      g.fillStyle = i === 0 ? '#39ff7a' : '#9fa6ad';
      g.fillRect(x0, y + 8, bw, 40);
      g.fillStyle = i === 0 ? '#39ff7a' : '#c9ccd0';
      g.font = '700 36px "Courier New", monospace';
      g.textAlign = 'left';
      g.fillText(cd.logit.toFixed(1), x0 + bw + 18, y + 42);
      if (cd.p) {
        g.fillStyle = '#39ff7a';
        g.font = '700 40px Arial, sans-serif';
        g.fillText(`P = ${cd.p.toFixed(2)}`, x0 + bw + 108, y + 42);
      }
    });
    g.fillStyle = '#9aa0a6';
    g.font = '400 34px "Courier New", monospace';
    g.textAlign = 'left';
    g.fillText('+ 50,252 MORE · VOCAB 50,257', 48, h - 36);
  });
}

// The feed rail: the spine's profile continued from the last bay to
// the scoreboard — the stream's final run.
function buildFeedRail(group) {
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal });
  const x0 = S02.spine.x1, x1 = 5.97, len = x1 - x0, cx = (x0 + x1) / 2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.035, 0.13), steelMat);
  top.position.set(cx, SPINE_Y + 0.018, 0);
  group.add(top);
  const chord = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.08), darkMat);
  chord.position.set(cx, SPINE_Y - 0.035, 0);
  group.add(chord);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, SPINE_Y - 0.05, 0.05), darkMat);
  post.position.set(5.68, (SPINE_Y - 0.05) / 2, 0);
  group.add(post);
}

// The FINAL LN collar: a ring on the feed rail with its plate — the
// last calibration before the scoreboard, the per-block LN gates'
// final sibling.
function buildFinalGate(group) {
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.07, 14), steelMat);
  ring.rotation.z = Math.PI / 2;
  ring.position.set(LM.gateX, SPINE_Y, 0);
  group.add(ring);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.02, 14), darkMat);
  band.rotation.z = Math.PI / 2;
  band.position.set(LM.gateX, SPINE_Y, 0);
  group.add(band);
  for (const s of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.015), darkMat);
    rod.position.set(LM.gateX - 0.03, SPINE_Y + 0.18, s * 0.2);
    group.add(rod);
  }
  const tex = canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 52px Arial, sans-serif';
    g.fillText('FINAL LN', w / 2, 58);
    g.font = '400 32px Arial, sans-serif';
    g.fillStyle = '#5a6169';
    g.fillText('LAST RESCALE BEFORE SCORING', w / 2, 102);
  });
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.13),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  plate.rotation.y = -Math.PI / 2;   // faces −X, into the room — reads correctly
  plate.position.set(LM.gateX - 0.03, SPINE_Y + 0.32, 0);
  group.add(plate);
}

function buildScoreboard(group) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.08, LM.boardH + 0.14, LM.boardW + 0.16), frameMat);
  panel.position.set(LM.x + 0.045, BOARD_Y, 0);
  group.add(panel);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(LM.boardW, LM.boardH),
    new THREE.MeshStandardMaterial({ map: scoreboardTexture(), roughness: 0.6, metalness: 0.05 }));
  face.rotation.y = -Math.PI / 2;   // faces −X, into the room — reads correctly
  face.position.set(LM.x - 0.002, BOARD_Y, 0);
  group.add(face);

  const leds = [];
  for (let i = 0; i < 5; i++) {
    leds.push({
      x: LM.x - 0.01, y: BOARD_Y - LM.boardH / 2 - 0.12, z: -0.9 + i * 0.45,
      color: i === 2 ? PALETTE.ledGreen : PALETTE.ledBlue, phase: i / 5, blink: 0.4,
    });
  }
  group.add(createLEDField(leds));
}

// The next-token chute: a steel trough under the scoreboard with the
// winning token's plate emerging from it — one token out, ready to be
// appended to the rail and the pass repeated.
function buildChute(group) {
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal });
  const cx = 5.66;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.34), steelMat);
  base.position.set(cx, 0.44, 0);
  group.add(base);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.03), darkMat);
    side.position.set(cx, 0.5, s * 0.155);
    group.add(side);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), darkMat);
    leg.position.set(cx + 0.2, 0.21, s * 0.13);
    group.add(leg);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), darkMat);
    leg2.position.set(cx - 0.2, 0.21, s * 0.13);
    group.add(leg2);
  }
  const tex = canvasTexture(256, 288, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#0a8a3c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 92px Georgia, "Times New Roman", serif';
    g.fillText('the', w / 2, 138);
    g.fillStyle = '#0a8a3c';
    g.font = '700 40px Arial, sans-serif';
    g.fillText('NEXT', w / 2, 226);
  });
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.34),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  plate.rotation.y = -Math.PI / 2;
  plate.position.set(cx, 0.66, 0);
  group.add(plate);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat }));
  back.position.set(cx + 0.012, 0.66, 0);
  group.add(back);
}

// Exit conduit: out of the scoreboard's top, tight east through the
// wall — hidden states on their way to the GPU training cluster.
function buildExitConduit(group) {
  const mat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const pts = [
    [LM.x + 0.02, BOARD_Y + LM.boardH / 2 + 0.05, 0],
    [LM.x + 0.06, BOARD_Y + LM.boardH / 2 + 0.22, 0],
    [6.06, BOARD_Y + LM.boardH / 2 + 0.24, 0],
  ].map((p) => new THREE.Vector3(...p));
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.02, 6), mat);
  group.add(tube);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal }));
  collar.rotation.z = Math.PI / 2;
  collar.position.set(5.99, BOARD_Y + LM.boardH / 2 + 0.24, 0);
  group.add(collar);
}

export function createLMHead() {
  const group = new THREE.Group();
  group.name = 's02-lm-head';
  buildFeedRail(group);
  buildFinalGate(group);
  buildScoreboard(group);
  buildChute(group);
  buildExitConduit(group);
  return group;
}
