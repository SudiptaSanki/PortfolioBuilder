// station06.js — Station 06 assembly: City Grid at Night, the
// finale. One ordinary block at 20:15 where everything the journey
// generated, converted, transmitted and stored finally lands: the
// 11 kV ring on its poles, the hero transformer humming over the
// footpath, RMU-3 standing ready to save the street, and the city's
// whole day glowing on the curve wall with its needle at the peak.
// Night, but architectural — every light in the scene has a fixture.

import * as THREE from 'three';
import { STATION06 } from '../../config/world.js';
import { createNightCity, createNightLights } from './nightCity.js';
import { createBuildings } from './buildings.js';
import { createFeederLine } from './feederLine.js';
import { createHeroTransformer, createSecondTransformer } from './poleTransformer.js';
import { createRmu } from './rmu.js';
import { createPlinthSubstation } from './plinthSubstation.js';
import { createStreetLighting } from './streetLighting.js';
import { createCurveWall } from './curveWall.js';
import { createStreetFurniture } from './streetFurniture.js';
import { createFlow, tickFlow } from './flow.js';

const S06 = STATION06;

// The click zones for the later journey layer — exactly the volumes
// the visitor is looking at.
export function station06Anchors() {
  return [
    { id: 'hero-transformer', label: '315 kVA pole transformer · 78% loaded at 20:15',
      position: [S06.hero.x, 4.6, S06.hero.z], size: [3.6, 9.2, 2.4] },
    { id: 'rmu-3', label: 'RMU-3 · the open ring, NOP to RMU-4',
      position: [S06.rmu.x, 1.15, S06.rmu.z], size: [2.4, 2.3, 1.6] },
    { id: 'curve-wall', label: 'The city\u2019s day · 612 MW peak · load factor 0.75',
      position: [S06.curveWall.x, S06.curveWall.y, S06.curveWall.z], size: [8.4, 3.9, 0.5] },
    { id: 'plinth-substation', label: '500 kVA plinth substation · Shanti Apartments',
      position: [S06.plinth.x, 1.1, S06.plinth.z], size: [3.2, 2.8, 2.4] },
    { id: 'transition-pole', label: 'Transition pole · the ring dives underground',
      position: [S06.transitionPoleX, 4.0, S06.feeder.poleZ], size: [1.4, 8.0, 1.8] },
    { id: 'sodium-light', label: 'The one sodium fitting the LED retrofit missed',
      position: [16, 8.6, 2.9], size: [1.2, 1.6, 1.2] },
  ];
}

export function createStation06(scene) {
  scene.fog = new THREE.Fog(0x131c2b, 55, 230);

  const group = new THREE.Group();
  group.name = 'station06-city-grid';

  const city = createNightCity();
  const buildings = createBuildings();
  const curveWall = createCurveWall();
  const rmu = createRmu();

  group.add(createNightLights());
  group.add(city);
  group.add(buildings);
  group.add(createFeederLine());
  group.add(createHeroTransformer());
  group.add(createSecondTransformer());
  group.add(rmu);
  group.add(createPlinthSubstation());
  group.add(createStreetLighting());
  group.add(curveWall);
  group.add(createStreetFurniture());
  group.add(createFlow());

  scene.add(group);

  const avMat = city.userData.aviationMat;
  const flickerMats = buildings.userData.flickerMats || [];
  const steam = buildings.userData.steam;
  const nowDot = curveWall.userData.nowDot;
  const scadaTipMat = rmu.userData.scadaTipMat;

  return {
    group,
    anchors: station06Anchors(),
    update(t) {
      tickFlow(t);
      // NOW dot on the curve wall: a slow, tight pulse, ~2.4 s
      // period — a breathing stud, not a bloom over the peak
      if (nowDot) {
        const p = 0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / 2.4));
        nowDot.dot.scale.setScalar(1 + 0.2 * p);
        nowDot.dotGlow.material.opacity = 0.28 + 0.22 * p;
      }
      // aviation lights blink (1.6 s cycle, mostly on)
      if (avMat) avMat.color.setHex((t % 1.6) < 1.05 ? 0xd63a2f : 0x38120f);
      // the bakery's tired tube sign: brief dropouts, never a strobe
      for (const m of flickerMats) {
        const dip = Math.sin(t * 29.0) + Math.sin(t * 16.7 + 1.3) > 1.86;
        m.color.setHex(dip ? 0x5d6d7d : 0xcfe4ff);
      }
      // tea-stall steam: a slow rise-and-fade loop
      if (steam) {
        const ph = (t * 0.14) % 1;
        steam.position.y = 1.95 + ph * 0.55;
        steam.material.opacity = 0.16 * (1 - ph);
        const s = 1 + ph * 0.7;
        steam.scale.set(s, 1, s);
      }
      // FRTU heartbeat to the control room
      if (scadaTipMat) scadaTipMat.emissiveIntensity = 0.55 + 0.5 * Math.sin(t * 2.2);
    },
  };
}
