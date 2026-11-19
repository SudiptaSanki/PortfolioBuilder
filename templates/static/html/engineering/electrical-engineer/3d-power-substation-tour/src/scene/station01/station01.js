// station01.js — Station 01 assembly: the Control Room at dawn,
// frozen at 05:58:40 IST. Wires the component modules into one group;
// the only motion in the room is the frequency trace (videoWall's
// userData.update), driven from the main module's clamped clock.

import * as THREE from 'three';
import { STATION01 } from '../../config/world.js';
import { createControlRoom } from './controlRoom.js';
import { createVideoWall } from './videoWall.js';
import { createConsoles } from './consoles.js';
import { createSupervisor } from './supervisor.js';
import { createMimicPanel } from './mimicPanel.js';
import { createServerRoom } from './serverRoom.js';
import { createProps } from './props.js';
import { createLighting } from './lighting.js';

const S = STATION01;

// Click-zone anchors for the later portfolio journey: centre/size in
// world metres, named for the story each zone tells.
export function station01Anchors() {
  return [
    { id: 'sld-wall', kind: 'video-wall-sld', centre: [0, 1.73, -4.4], size: [6.05, 1.36, 0.15] },
    { id: 'frequency', kind: 'frequency-display', centre: [-4.85, 2.07, -4.4], size: [1.21, 0.68, 0.15] },
    { id: 'soe-alarms', kind: 'alarm-events', centre: [3.64, 2.07, -4.4], size: [1.21, 0.68, 0.15] },
    { id: 'operator-desk-2', kind: 'story-desk', centre: [-1.05, 0.85, 1.35], size: [1.8, 1.1, 1.6] },
    { id: 'supervisor', kind: 'supervisor-row', centre: [0, 0.9, 3.84], size: [2.0, 1.2, 1.0] },
    { id: 'mimic-panel', kind: 'mosaic-mimic', centre: [6.55, 1.78, -2.6], size: [0.15, 1.8, 3.6] },
    { id: 'server-glass', kind: 'server-room', centre: [-7.2, 1.1, -0.85], size: [1.2, 2.0, 4.4] },
    { id: 'dawn-blinds', kind: 'window-band', centre: [6.55, 1.8, 2.3], size: [0.15, 1.6, 4.0] },
  ];
}

export function createStation01() {
  const group = new THREE.Group();
  group.name = 'station-01-control-room';

  const wall = createVideoWall();
  group.add(createControlRoom());
  group.add(wall);
  group.add(createConsoles());
  group.add(createSupervisor());
  group.add(createMimicPanel());
  group.add(createServerRoom());
  group.add(createProps());
  group.add(createLighting());

  group.userData.update = (t) => {
    if (wall.userData.update) wall.userData.update(t);
  };
  return group;
}
