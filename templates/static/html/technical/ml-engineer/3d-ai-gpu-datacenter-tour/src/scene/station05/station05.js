// station05.js — Station 05 assembly (the station01.js mirror).
// Wires the Mesh Hall's component modules into one station group in
// contract order: room, image dock, control-plane dais, node field,
// switchboard, canary rollout, labels, then the life layer
// (lighting, traffic, dust). Nothing in here models anything
// itself. Exposes the anchor list for the journey's click zones,
// exactly as Stations 01 and 02 do.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { applyFog } from '../atmosphere.js';
import { createMeshRoom } from './meshRoom.js';
import { createRolloutDock } from './rolloutDock.js';
import { createControlPlane } from './controlPlane.js';
import { createNodes } from './nodes.js';
import { createSwitchboard } from './switchboard.js';
import { createCanary, tickCanary } from './canary.js';
import { createMeshLabels } from './meshLabels.js';
import { createHallLighting, createFlow, createDust, tickFlow, setLEDProjFactor } from './flow.js';

const S05 = STATION05;

// Click-zone anchors (inventory: 3 required + 2 spare). Centre/size
// in world metres; the journey's raycast proxies are built from these.
export function station05Anchors() {
  const seat4X = S05.lanes.x0 + S05.lanes.pitch / 2 + 4 * S05.lanes.pitch;
  return [
    {
      id: 'split-gate', kind: 'traffic-gate',
      centre: [S05.gate.x, 1.0, S05.gate.z], size: [0.75, 2.0, 1.7],
    },
    {
      id: 'etcd-drum', kind: 'etcd-trio',
      centre: [-4.0, 0.85, S05.dais.etcdZ], size: [1.15, 0.95, 0.65],
    },
    {
      id: 'v2-capsule', kind: 'pod-capsule',
      centre: [seat4X, 0.42, S05.lanes.v2.z], size: [0.5, 0.8, 0.6],
    },
    {
      id: 'switchboard', kind: 'ingress-switchboard',
      centre: [2.5, 1.55, S05.switchboard.z], size: [4.2, 1.7, 0.35],
    },
    {
      id: 'hpa-governor', kind: 'hpa',
      centre: [S05.hpa.x, 0.8, S05.hpa.z], size: [0.75, 1.6, 0.95],
    },
  ];
}

export function createStation05(scene) {
  const group = new THREE.Group();
  group.name = 'station-05-mesh-hall';

  if (scene) applyFog(scene);

  group.add(createMeshRoom());
  group.add(createRolloutDock());
  group.add(createControlPlane());
  group.add(createNodes());
  group.add(createSwitchboard());
  group.add(createCanary());
  group.add(createMeshLabels());
  group.add(createHallLighting());
  group.add(createFlow());
  group.add(createDust());

  return {
    group,
    anchors: station05Anchors(),
    update(t) {
      tickFlow(t);
      tickCanary(t);
    },
    setProjFactor(f) {
      setLEDProjFactor(f);
    },
  };
}
