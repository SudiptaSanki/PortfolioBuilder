// station04.js — Station 04 assembly (the datacentre.js mirror).
// Wires the Build Hall's component modules into one station group in
// contract order: room, commit gate, build cells, quality gates,
// layer stack, registry, signing desk, deploy ring, labels, then the
// life layer (lighting, flow, dust). Nothing in here models anything
// itself. Exposes the anchor list for the journey's click zones,
// exactly as Station 01 does.

import * as THREE from 'three';
import { STATION04 } from '../../config/world.js';
import { applyFog } from '../atmosphere.js';
import { createPipelineRoom } from './pipelineRoom.js';
import { createCommitGate } from './commitGate.js';
import { createBuildCells } from './buildCells.js';
import { createQualityGates } from './qualityGates.js';
import { createLayerStack } from './layerStack.js';
import { createRegistry } from './registry.js';
import { createSigningDesk } from './signingDesk.js';
import { createDeployRing } from './deployRing.js';
import { createPipelineLabels } from './pipelineLabels.js';
import { createHallLighting, createFlow, createDust, tickFlow, setLEDProjFactor } from './flow.js';

const S04 = STATION04;

// Click-zone anchors (inventory: 3 required + 2 spare). Centre/size
// in world metres; the journey's raycast proxies are built from these.
export function station04Anchors() {
  return [
    {
      id: 'layer-stack', kind: 'layer-stack',
      centre: [S04.stack.x, 0.72, S04.stack.z], size: [1.3, 1.45, 1.0],
    },
    {
      id: 'registry-tag', kind: 'tag-plate',
      centre: [S04.room.widthX / 2 - 0.12, 1.6, 0.48], size: [0.3, 0.85, 0.62],
    },
    {
      id: 'signing-seal', kind: 'cosign-seal',
      centre: [S04.desk.x, 0.95, S04.desk.z], size: [0.95, 0.95, 0.75],
    },
    {
      id: 'reject-bin', kind: 'reject-bin',
      centre: [S04.gates.rejectBin.x, 0.4, S04.gates.rejectBin.z], size: [0.78, 0.85, 0.78],
    },
    {
      id: 'sbom-lectern', kind: 'sbom-lectern',
      centre: [S04.desk.lectern.x, 0.85, S04.desk.lectern.z], size: [0.66, 1.15, 0.55],
    },
  ];
}

export function createStation04(scene) {
  const group = new THREE.Group();
  group.name = 'station-04-build-hall';

  if (scene) applyFog(scene);

  group.add(createPipelineRoom());
  group.add(createCommitGate());
  group.add(createBuildCells());
  group.add(createQualityGates());
  group.add(createLayerStack());
  group.add(createRegistry());
  group.add(createSigningDesk());
  group.add(createDeployRing());
  group.add(createPipelineLabels());
  group.add(createHallLighting());
  group.add(createFlow());
  group.add(createDust());

  return {
    group,
    anchors: station04Anchors(),
    update(t) {
      tickFlow(t);
    },
    setProjFactor(f) {
      setLEDProjFactor(f);
    },
  };
}
