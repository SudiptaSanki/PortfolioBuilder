// datacentre.js — Station 03 assembly. Wires the component modules into
// one station group: room shell, two facing rack rows, populated servers,
// rear cabling + manifolds + hoses, overhead distribution, lighting,
// labels and atmosphere. Nothing in here models anything itself.

import * as THREE from 'three';
import { allAnchors } from '../config/world.js';
import { createRoom } from './room.js';
import { createRackRows } from './racks.js';
import { populateRack, tickLEDs, setLEDProjFactor } from './gpuUnit.js';
import { createCabling, addRackRearCabling } from './cabling.js';
import {
  createCooling, addRackManifold, addRackHoses, finalizeManifolds,
} from './cooling.js';
import { createLighting } from './lighting.js';
import { createLabels, addRackPlate } from './labels.js';
import { createAtmosphere, applyFog, tickAtmosphere } from './atmosphere.js';

export function createDatacentre(scene) {
  const group = new THREE.Group();
  group.name = 'station-03-datacentre';

  if (scene) applyFog(scene);

  group.add(createRoom());

  // rack rows + everything that lives on a rack
  const anchors = allAnchors();
  const { group: rows, rackGroups } = createRackRows(anchors);
  group.add(rows);
  rackGroups.forEach((rackGroup, i) => {
    const anchor = anchors[i];
    populateRack(rackGroup, anchor);
    addRackRearCabling(rackGroup, anchor);
    addRackManifold(rackGroup, anchor);
    addRackHoses(rackGroup, anchor);
    addRackPlate(rackGroup, anchor);
  });

  group.add(createCabling());
  group.add(createCooling());
  group.updateMatrixWorld(true);
  finalizeManifolds(group);              // instanced manifold hardware, world space

  group.add(createLighting());
  group.add(createLabels());
  group.add(createAtmosphere());

  return {
    group,
    update(t) {
      tickLEDs(t);
      tickAtmosphere(t);
    },
    setProjFactor(f) {
      setLEDProjFactor(f);
    },
  };
}
