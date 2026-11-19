// station04.js — Station 04 assembly. Wires the Turbine Hall's
// component modules into one station group: hall shell, pedestal
// (deck + VIS columns), the turbine train, generator end, cranes,
// basement plant, oil skid, laydown bay, labels, then the life
// layer (lighting + the lube-oil flow). Nothing here models anything
// itself. Exposes the anchor list for the journey's click zones.

import * as THREE from 'three';
import { STATION04 } from '../../config/world.js';
import { createHall } from './hall.js';
import { createPedestal } from './pedestal.js';
import { createTurbine } from './turbine.js';
import { createGenerator } from './generator.js';
import { createCranes } from './crane.js';
import { createBasement } from './basement.js';
import { createOilSkid } from './oilSkid.js';
import { createLaydown } from './laydown.js';
import { createLabels } from './labels.js';
import { createHallLighting, createFlow, tickFlow, setFlowProjFactor } from './flow.js';

const S04 = STATION04;
const SY = S04.shaft.y;

// Click-zone anchors for the later journey. Centre/size in world
// metres; the journey's raycast proxies are built from these.
export function station04Anchors() {
  return [
    {
      id: 'hp-turbine', kind: 'hp-cylinder',
      centre: [(S04.hp.x0 + S04.hp.x1) / 2, SY, 0], size: [6.5, 3.9, 3.9],
    },
    {
      id: 'crossover', kind: 'crossover-pipe',
      centre: [-8.3, SY + 5.2, 0], size: [4.4, 2.2, 1.9],
    },
    {
      id: 'lp-hood', kind: 'lp-cylinder',
      centre: [(S04.lp[1].x0 + S04.lp[1].x1) / 2, (S04.deck.topY + S04.lpHood.topY) / 2, 0],
      size: [8.5, 8.5, 9.2],
    },
    {
      id: 'thrust-bearing', kind: 'bearing-n3',
      centre: [S04.bearingsX[2], SY - 0.6, 0], size: [2.3, 4.6, 2.9],
    },
    {
      id: 'generator', kind: 'generator-barrel',
      centre: [(S04.generator.x0 + S04.generator.x1) / 2, SY, 0], size: [9.5, 4.6, 4.6],
    },
    {
      id: 'eot-crane', kind: 'crane-200t',
      centre: [S04.crane.parkedX[0], S04.crane.y, 0], size: [4.6, 3.4, 36],
    },
    {
      id: 'condenser', kind: 'condenser',
      centre: [(S04.condenser.x0 + S04.condenser.x1) / 2, 5, 0], size: [19, 7.5, 9.5],
    },
    {
      id: 'main-oil-tank', kind: 'lube-oil-tank',
      centre: [S04.mot.x, 1.8, S04.mot.z], size: [7.4, 3.6, 3.4],
    },
    {
      id: 'spare-rotor', kind: 'laydown-rotor',
      centre: [31, S04.deck.topY + 1.05, 0], size: [2.4, 2.4, 9.4],
    },
    {
      id: 'vis-deck', kind: 'spring-isolated-deck',
      centre: [-8, S04.deck.soffitY - 0.6, -S04.deck.colZ], size: [3.2, 2.6, 2.6],
    },
  ];
}

export function createStation04(scene) {
  const group = new THREE.Group();
  group.name = 'station-04-turbine-hall';

  if (scene) {
    scene.fog = new THREE.Fog(0xe8edea, 55, 130);   // long hall: far bays soften, never void
  }

  group.add(createHall());
  group.add(createPedestal());
  group.add(createBasement());
  group.add(createTurbine());
  group.add(createGenerator());
  group.add(createCranes());
  group.add(createOilSkid());
  group.add(createLaydown());
  group.add(createLabels());
  group.add(createHallLighting());
  group.add(createFlow());

  return {
    group,
    anchors: station04Anchors(),
    update(t) {
      tickFlow(t);
    },
    setProjFactor(f) {
      setFlowProjFactor(f);
    },
  };
}
