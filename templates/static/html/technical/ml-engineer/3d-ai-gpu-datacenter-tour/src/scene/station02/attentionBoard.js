// attentionBoard.js — the attention matrix board (north wall): the
// hero bay's attention weights as a departures-board panel of 8×8
// cells, one per token pair of the worked sentence. Rows are queries,
// columns are keys (labelled on the frame, in latticeLabels.js); each
// cell's brightness is that pair's weight after the softmax. The
// causal mask is not an overlay — it is a solid SHUTTER panel bolted
// over the upper triangle: a position may attend only to itself and
// the past, so the future is simply not shown, and the remaining
// weights in each row still sum to 1.

import * as THREE from 'three';
import { STATION02, PALETTE, SURFACE, seeded } from '../../config/world.js';

const S02 = STATION02;
const BD = S02.board;
// grid region on the board face (world metres, face centre at BD.x/BD.y)
const GRID = { x0: -1.02, x1: 1.22, yTop: 2.38, yBot: 1.06 };
const CELL_W = (GRID.x1 - GRID.x0) / 8;
const CELL_H = (GRID.yTop - GRID.yBot) / 8;

// The hero bay's attention pattern: lower-triangular (causal), each
// row normalised to sum to 1 — diagonal-weighted, with the last token
// reaching back to `cat` (position 1), the pronoun-resolution story:
// a later token attending to an earlier one is the mechanism visible.
function attentionMatrix() {
  const rnd = seeded(4242);
  const m = [];
  for (let r = 0; r < 8; r++) {
    const row = new Array(8).fill(0);
    let sum = 0;
    for (let c = 0; c <= r; c++) {
      row[c] = Math.exp(-Math.abs(r - c) * 0.55) * (0.75 + rnd() * 0.5);
      sum += row[c];
    }
    m.push(row.map((w) => w / sum));
  }
  // boost row 7 → col 1, renormalise
  m[7][1] *= 2.2;
  const s = m[7].reduce((a, b) => a + b, 0);
  for (let c = 0; c < 8; c++) m[7][c] /= s;
  return m;
}

function boardTexture() {
  const W = 1300, H = 850;                    // 500 px per metre
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x) => (x - BD.x + BD.width / 2) * 500;
  const py = (y) => (BD.y + BD.height / 2 - y) * 500;
  g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, W, H);
  const M = attentionMatrix();
  const toks = S02.tokens;
  // column (key) labels along the top
  g.fillStyle = '#14171a';
  g.textAlign = 'center';
  g.font = '700 34px Georgia, serif';
  for (let col = 0; col < 8; col++) {
    g.fillText(toks[col], px(GRID.x0 + (col + 0.5) * CELL_W), py(GRID.yTop) - 18);
  }
  // row (query) labels down the left
  g.textAlign = 'right';
  for (let r = 0; r < 8; r++) {
    g.fillText(toks[r], px(GRID.x0) - 14, py(GRID.yTop - (r + 0.5) * CELL_H) + 12);
  }
  // cells
  for (let r = 0; r < 8; r++) {
    for (let col = 0; col < 8; col++) {
      const x = px(GRID.x0 + col * CELL_W);
      const y = py(GRID.yTop - r * CELL_H);
      const cw = CELL_W * 500, chh = CELL_H * 500;
      if (col <= r) {
        const b = Math.sqrt(M[r][col]);
        g.fillStyle = `rgba(47,183,201,${(0.12 + 0.88 * b).toFixed(3)})`;
        g.fillRect(x + 2, y + 2, cw - 4, chh - 4);
        if (M[r][col] > 0.3) {   // the strongest weights carry their number
          g.fillStyle = '#0d2b33';
          g.font = '700 30px "Courier New", monospace';
          g.textAlign = 'center';
          g.fillText(M[r][col].toFixed(2), x + cw / 2, y + chh / 2 + 11);
          g.textAlign = 'right';
          g.font = '700 34px Georgia, serif';
        }
      } else {
        g.fillStyle = '#e3e6e9';   // beneath the shutter: unlit, unseen
        g.fillRect(x + 2, y + 2, cw - 4, chh - 4);
      }
      g.strokeStyle = '#b9bec4';
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, cw - 2, chh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createAttentionBoard() {
  const group = new THREE.Group();
  group.name = 's02-attention-board';

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(BD.width + 0.16, BD.height + 0.16, 0.06), frameMat);
  frame.position.set(BD.x, BD.y, BD.z - 0.035);
  group.add(frame);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(BD.width, BD.height),
    new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.6, metalness: 0.05 }));
  face.position.set(BD.x, BD.y, BD.z);   // plane faces +Z, into the room — text reads correctly
  group.add(face);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(BD.width + 0.16, 0.04, 0.12), frameMat);
  ledge.position.set(BD.x, BD.y - BD.height / 2 - 0.1, BD.z - 0.01);
  group.add(ledge);

  // the causal-mask shutter: a solid slate cover over the upper
  // triangle — what is masked is not shown at all
  const shape = new THREE.Shape();
  shape.moveTo(GRID.x0 + CELL_W * 0.5, GRID.yTop);
  shape.lineTo(GRID.x1, GRID.yTop);
  shape.lineTo(GRID.x1, GRID.yBot + CELL_H * 0.5);
  shape.closePath();
  const shutter = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: 0x3c4147, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }));
  shutter.position.set(BD.x, 0, BD.z + 0.012);
  group.add(shutter);
  // the shutter's top rail — raised on two standoff straps so its
  // underside (y 2.5075) clears the column (key) label row drawn on
  // the face above the grid (labels span y ≈ 2.41–2.47): at its old
  // height (centre y 2.425) the rail sat directly across the labels
  // and hid all but their letter bottoms. The shutter panel itself
  // is unchanged — its top edge (y 2.38) never reached the labels,
  // and the panel keeps full coverage of the masked triangle.
  const shutterEdge = new THREE.Mesh(
    new THREE.BoxGeometry(BD.width + 0.2, 0.035, 0.03),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  shutterEdge.position.set(BD.x, GRID.yTop + 0.145, BD.z + 0.01);
  group.add(shutterEdge);
  const strapMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  for (const sx of [-1.27, 1.27]) {   // outside the label span and the grid (x1 = 1.22)
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.135, 0.025), strapMat);
    strap.position.set(BD.x + sx, GRID.yTop + 0.0625, BD.z + 0.01);
    group.add(strap);
  }

  return group;
}
