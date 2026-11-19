// station06.js — Station 06 assembly: the Observatory. The sixth and
// last room of the world: telemetry comes IN through the west wall
// from Station 05's canary mesh, walks the OpenTelemetry pipeline on
// the south wall, and is spent in the room — the four golden-signals
// consoles, the traces waterfall, the SLO gauge bank, and the curved
// edge map wall the whole journey ends facing. The room is DIM by
// design (a NOC, not a showroom) but fully architectural — the
// sanctioned exception is to the light, never the discipline.

import * as THREE from 'three';
import { STATION06 } from '../../config/world.js';
import { createObservatoryRoom } from './observatoryRoom.js';
import { createOtelPipeline } from './otelPipeline.js';
import { createTelemetryConsoles, consolePose } from './telemetryConsoles.js';
import { createTracesWaterfall } from './tracesWaterfall.js';
import { createSloGauges } from './sloGauges.js';
import { createEdgeMapWall, amberPopAnchor } from './edgeMapWall.js';
import { createObservatoryLabels } from './observatoryLabels.js';
import { createFlow, tickFlow, setLEDProjFactor } from './flow.js';

// The five click zones (inventory §8) — returned so the journey layer
// can raycast exactly the volumes the visitor is looking at.
export function station06Anchors() {
  const S = STATION06;
  const amber = amberPopAnchor();
  const latency = consolePose(0);
  return [
    { id: 'amber-pop', label: 'Recife — the one amber stud', position: amber.centre, size: amber.size },
    { id: 'latency-console', label: 'Latency console — the golden signals', position: [latency.x, 1.05, latency.z], size: [0.95, 1.1, 0.7] },
    { id: 'budget-gauge', label: 'The error budget', position: [S.gauges.x, 1.15, S.gauges.z], size: [0.9, 1.3, 0.5] },
    { id: 'waterfall-cabinet', label: 'One request, every span', position: [S.waterfall.x, 1.25, S.waterfall.centreZ], size: [1.1, 2.2, 0.4] },
    { id: 'tail-sampling', label: 'Tail sampling — keep the interesting traces', position: [S.pipeline.stages[1].x, 1.2, S.pipeline.centreZ], size: [1.3, 1.9, 0.6] },
  ];
}

export function createStation06(scene) {
  // the observatory's own dim aerial perspective — NOT the bright
  // shared fog: the map wall must stay legible at 3 m while the room
  // reads as night.
  scene.fog = new THREE.Fog(0x0a0d12, 16, 34);

  const group = new THREE.Group();
  group.name = 'station06-observatory';

  group.add(createObservatoryRoom());
  group.add(createOtelPipeline());
  group.add(createTelemetryConsoles());
  group.add(createTracesWaterfall());
  group.add(createSloGauges());
  const mapWall = createEdgeMapWall();
  group.add(mapWall.group);
  group.add(createObservatoryLabels());
  group.add(createFlow());

  scene.add(group);

  return {
    group,
    anchors: station06Anchors(),
    update(t) {
      tickFlow(t);
      mapWall.tick(t);
    },
    setProjFactor(f) { setLEDProjFactor(f); },
  };
}
