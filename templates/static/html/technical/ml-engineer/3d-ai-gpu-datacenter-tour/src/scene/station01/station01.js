// station01.js — Station 01 assembly (the datacentre.js mirror).
// Wires the Intake Hall's component modules into one station group in
// contract order: room, sources, stream gallery, schema gate, lake
// tiers, feature vault, labels, then the life layer (lighting, flow,
// dust). Nothing in here models anything itself. Exposes the anchor
// list for the journey's click zones, exactly as Station 03 does.

import * as THREE from 'three';
import { STATION01 } from '../../config/world.js';
import { applyFog } from '../atmosphere.js';
import { createIntakeRoom } from './intakeRoom.js';
import { createSources } from './sources.js';
import { createStreams, tickStreams } from './streams.js';
import { createSchemaGate } from './schemaGate.js';
import { createLakeTiers } from './lakeTiers.js';
import { createFeatureStore } from './featureStore.js';
import { createStreamLabels } from './streamLabels.js';
import { createHallLighting, createFlow, createDust, tickFlow, setLEDProjFactor } from './flow.js';

const S01 = STATION01;

// Click-zone anchors (inventory: 3 required + 2 spare). Centre/size in
// world metres; the journey's raycast proxies are built from these.
export function station01Anchors() {
  const orders = S01.gallery.channels[1];
  const bronze = S01.tiers[0];
  const bayF = S01.tierBay.x - S01.tierBay.depth / 2;
  return [
    {
      id: 'orders-log', kind: 'log-channel',
      centre: [0.2, 0.88, orders.z], size: [4.6, 0.35, S01.gallery.width],
    },
    {
      id: 'bronze-jbod', kind: 'bronze-enclosure',
      centre: [bayF - 0.1, 1.0, bronze.z], size: [0.55, 1.9, 1.3],
    },
    {
      id: 'online-store', kind: 'online-cabinet',
      centre: [S01.vault.online.x, 0.85, S01.vault.online.z], size: [0.66, 1.5, 0.64],
    },
    {
      id: 'dlq-crate', kind: 'dlq',
      centre: [S01.gate.dlq.x, 0.3, S01.gate.dlq.z], size: [0.62, 0.6, 0.62],
    },
    {
      id: 'version-spine', kind: 'version-spine',
      centre: [bayF - 0.09, 0.95, bronze.z + 0.45], size: [0.14, 1.85, 0.3],
    },
  ];
}

export function createStation01(scene) {
  const group = new THREE.Group();
  group.name = 'station-01-intake-hall';

  if (scene) applyFog(scene);

  group.add(createIntakeRoom());
  group.add(createSources());
  group.add(createStreams());
  group.add(createSchemaGate());
  group.add(createLakeTiers());
  group.add(createFeatureStore());
  group.add(createStreamLabels());
  group.add(createHallLighting());
  group.add(createFlow());
  group.add(createDust());

  return {
    group,
    anchors: station01Anchors(),
    update(t) {
      tickFlow(t);
      tickStreams(t);
    },
    setProjFactor(f) {
      setLEDProjFactor(f);
    },
  };
}
