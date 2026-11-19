// station02.js — Station 02 assembly (the station01.js mirror).
// Wires the Lattice Hall's component modules into one station group
// in contract order: room (with the residual spine), token rail,
// transformer blocks, attention board, QKV cabinets, LM head, labels,
// then the life layer (lighting, the Forward Pass, dust). Nothing in
// here models anything itself. Exposes the anchor list for the
// journey's click zones, exactly as Station 01 does.

import * as THREE from 'three';
import { STATION02 } from '../../config/world.js';
import { applyFog } from '../atmosphere.js';
import { createLatticeRoom } from './latticeRoom.js';
import { createTokenRail } from './tokenRail.js';
import { createBlocks, tickBlocks } from './blocks.js';
import { createAttentionBoard } from './attentionBoard.js';
import { createQKV } from './qkv.js';
import { createLMHead } from './lmHead.js';
import { createLatticeLabels } from './latticeLabels.js';
import { createHallLighting, createFlow, createDust, tickFlow, setLEDProjFactor } from './flow.js';

const S02 = STATION02;
const B = S02.blocks;

// Click-zone anchors (inventory: 3 required + 2 spare). Centre/size in
// world metres; the journey's raycast proxies are built from these.
export function station02Anchors() {
  const heroCx = B.centresX[B.hero];
  return [
    {
      id: 'attention-head', kind: 'attention-head',
      centre: [heroCx, B.galleryY, B.headZ0 + B.headPitch],   // head H2, hero bay
      size: [0.55, 0.75, 0.5],
    },
    {
      id: 'residual-spine', kind: 'residual-spine',
      centre: [0.3, S02.spine.y, 0], size: [3.4, 0.32, 0.34],
    },
    {
      id: 'lm-head', kind: 'lm-head-scoreboard',
      centre: [S02.lmHead.x - 0.04, S02.lmHead.boardY, 0], size: [0.4, 1.7, 2.3],
    },
    {
      id: 'causal-mask', kind: 'causal-mask-shutter',
      centre: [0.68, 2.1, S02.board.z + 0.02], size: [1.35, 0.8, 0.18],
    },
    {
      id: 'ffn-press', kind: 'ffn-press',
      centre: [heroCx + B.pressX, 0.62, 0], size: [0.85, 0.6, 1.05],
    },
  ];
}

export function createStation02(scene) {
  const group = new THREE.Group();
  group.name = 'station-02-lattice-hall';

  if (scene) applyFog(scene);

  group.add(createLatticeRoom());
  group.add(createTokenRail());
  group.add(createBlocks());
  group.add(createAttentionBoard());
  group.add(createQKV());
  group.add(createLMHead());
  group.add(createLatticeLabels());
  group.add(createHallLighting());
  group.add(createFlow());
  group.add(createDust());

  return {
    group,
    anchors: station02Anchors(),
    update(t) {
      tickFlow(t);
      tickBlocks(t);
    },
    setProjFactor(f) {
      setLEDProjFactor(f);
    },
  };
}
