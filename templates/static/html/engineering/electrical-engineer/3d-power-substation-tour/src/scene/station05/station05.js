// station05.js — Station 05 assembly: Suryagarh Hybrid Park, Block C
// at 18:30. Wires the component modules into one station group:
// ground and roads, the PV field, inverter stations, the turbine
// ridge, the BESS yard, the pooling substation, the met mast, the
// collection network, signage, golden-hour light, and the one dust
// system. Nothing in here models anything itself. Exposes the
// anchor list for the journey's click zones.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { createLighting } from './lighting.js';
import { createSite } from './site.js';
import { createPvField } from './pvField.js';
import { createInverters } from './inverters.js';
import { createTurbines, tickTurbines } from './turbines.js';
import { createBess } from './bess.js';
import { createSubstation } from './substation.js';
import { createMetMast } from './metMast.js';
import { createCollection } from './collection.js';
import { createLabels } from './labels.js';
import { createFlow, tickFlow } from './flow.js';

const S05 = STATION05;

// Click-zone anchors for the later journey integration. Centre/size
// in world metres.
export function station05Anchors() {
  const hero = S05.turbines.rows[0];
  const inv = S05.inverters[1];
  const [bx, bz] = S05.bess.apron;
  return [
    {
      id: 'hero-turbine', kind: 'wind-turbine',
      centre: [hero.x, 58, hero.z[1]], size: [16, 116, 16],
    },
    {
      id: 'pv-table-block', kind: 'pv-array',
      centre: [S05.pv.blocks[1], 1.4, -3.5], size: [37, 2.8, 51],
    },
    {
      id: 'inverter-station', kind: 'inverter',
      centre: [inv.x, 1.6, inv.z], size: [3.2, 3.2, 6.8],
    },
    {
      id: 'megapack-row', kind: 'bess',
      centre: [bx, 1.6, bz], size: [52, 3.2, 15],
    },
    {
      id: 'pooling-transformer', kind: 'transformer',
      centre: [S05.substation.transformers[0][0], 2.6, S05.substation.transformers[0][1]],
      size: [8.6, 5.2, 5.6],
    },
    {
      id: 'met-mast', kind: 'met-mast',
      centre: [S05.mast.x, 52, S05.mast.z], size: [3, 105, 3],
    },
  ];
}

export function createStation05(scene) {
  const group = new THREE.Group();
  group.name = 'station-05-renewables';

  if (scene) group.add(createLighting(scene));
  group.add(createSite());
  group.add(createPvField());
  group.add(createInverters());
  group.add(createTurbines());
  group.add(createBess());
  group.add(createSubstation());
  group.add(createMetMast());
  group.add(createCollection());
  group.add(createLabels());
  group.add(createFlow());

  return {
    group,
    anchors: station05Anchors(),
    update(t) {
      tickTurbines(t);
      tickFlow(t);
    },
  };
}
