// labels.js — the plates that make the plant explain itself
// (inventory §4.12: a visitor who reads five plates has understood
// a hybrid plant). Site board at the gate with the honest spacing
// note, the evening-ramp chart board, the substation numbers plate,
// the BESS yard sign, block signs and danger plates. Every figure
// comes from the inventory's value register; every line is measured
// before it is drawn (SCAFFOLD rule 1).

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { MAT, box, textPlate, plateLines, fitFont } from './kit.js';

const S05 = STATION05;

function boardOnPosts(w, h, plate, x, z, rotY = 0, postH = 1.1) {
  const g = new THREE.Group();
  const back = box(w + 0.1, h + 0.1, 0.06, MAT.darkSteel, 0, postH + h / 2, -0.02);
  back.castShadow = true;
  g.add(back);
  plate.position.set(0, postH + h / 2, 0.02);
  g.add(plate);
  for (const dx of [-w / 2 + 0.25, w / 2 - 0.25]) {
    g.add(box(0.09, postH + 0.3, 0.09, MAT.structure, dx, (postH + 0.3) / 2, -0.05));
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

function rampBoard() {
  const plate = textPlate(3.4, 2.05, (g, w, h) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#14171a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#14171a'; g.textAlign = 'center';
    fitFont(g, 'THE EVENING RAMP', w - 120, 64);
    g.fillText('THE EVENING RAMP', w / 2, 78);
    g.font = '400 34px Arial, sans-serif';
    g.fillText('export holds almost flat while solar fades to zero', w / 2, 126);

    // chart: 13:00 → 22:30 across, 0 → 30 MW up
    const cx0 = 120, cx1 = w - 60, cy0 = 190, cy1 = h - 235;
    const X = (t) => cx0 + ((t - 13) / 9.5) * (cx1 - cx0);
    const Y = (v) => cy1 - (v / 30) * (cy1 - cy0);
    g.strokeStyle = 'rgba(20,23,26,0.25)'; g.lineWidth = 2;
    g.fillStyle = '#5a6068'; g.font = '400 26px Arial, sans-serif'; g.textAlign = 'right';
    for (const v of [0, 10, 20, 30]) {
      g.beginPath(); g.moveTo(cx0, Y(v)); g.lineTo(cx1, Y(v)); g.stroke();
      g.fillText(`${v}`, cx0 - 12, Y(v) + 9);
    }
    g.textAlign = 'center';
    for (const t of [13, 15, 17, 19, 21]) g.fillText(`${t}:00`, X(t), cy1 + 36);
    g.fillText('22:30', X(22.5), cy1 + 36);
    g.fillText('MW', cx0 - 60, cy0 - 14);

    const series = [
      { pts: [[13, 21.5], [17, 13.8], [18.5, 2.1], [19.25, 0], [22.5, 0]], color: '#d98a1f', width: 6, label: 'SOLAR', lx: 17.6, ly: 17 },
      { pts: [[13, 9], [17, 11.2], [18.5, 13.4], [19.25, 14.1], [20.25, 13.8], [22.5, 12.5]], color: '#33566e', width: 6, label: 'WIND', lx: 20.6, ly: 17.5 },
      { pts: [[13, 24.5], [17, 25], [18.5, 25.3], [19.25, 23.9], [20.25, 23.6], [22.5, 12.5]], color: '#14171a', width: 8, label: 'EXPORT', lx: 19.6, ly: 28.5 },
    ];
    for (const s of series) {
      g.strokeStyle = s.color; g.lineWidth = s.width; g.beginPath();
      s.pts.forEach(([t, v], i) => { if (i === 0) g.moveTo(X(t), Y(v)); else g.lineTo(X(t), Y(v)); });
      g.stroke();
      g.fillStyle = s.color; g.font = '700 30px Arial, sans-serif'; g.textAlign = 'left';
      g.fillText(s.label, X(s.lx), Y(s.ly));
    }
    // the 18:30 marker — the scene's moment
    g.strokeStyle = '#b03028'; g.lineWidth = 3; g.setLineDash([10, 8]);
    g.beginPath(); g.moveTo(X(18.5), cy0); g.lineTo(X(18.5), cy1); g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#b03028'; g.font = '700 30px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('18:30 · NOW', X(18.5), cy0 - 16);

    g.fillStyle = '#14171a';
    fitFont(g, 'AT 18:30 — SOLAR 2.1 MW · WIND 13.4 MW · BESS DISCHARGING 9.8 MW · EXPORT 25.3 MW', w - 100, 36);
    g.fillText('AT 18:30 — SOLAR 2.1 MW · WIND 13.4 MW · BESS DISCHARGING 9.8 MW · EXPORT 25.3 MW', w / 2, h - 128);
    g.font = '400 30px Arial, sans-serif'; g.fillStyle = '#44484d';
    fitFont(g, 'solar noon export was 24.5 MW · the 20:15 city peak still draws 23.6 MW — wind + 4 h storage flattens the duck curve', w - 100, 30, 400);
    g.fillText('solar noon export was 24.5 MW · the 20:15 city peak still draws 23.6 MW — wind + 4 h storage flattens the duck curve', w / 2, h - 84);
    g.font = '400 27px Arial, sans-serif';
    g.fillText('typical capacity factors — wind 28–32% · solar 20–21%', w / 2, h - 44);
  }, [1400, 845]);
  return boardOnPosts(3.4, 2.05, plate, S05.rampBoard[0], S05.rampBoard[1], 0, 0.55);
}

export function createLabels() {
  const group = new THREE.Group();
  group.name = 's05-labels';

  // site board at the gate
  const sitePlate = plateLines(3.6, 1.7, [
    { text: 'SURYAGARH HYBRID PARK — BLOCK C', size: 74 },
    { text: '36 MW WIND · 28 MWp SOLAR · 39.2 MWh STORAGE', size: 58 },
    { text: 'equipment modelled at true size · field spacing compressed for the scene', size: 40, weight: 400 },
    { text: 'real turbine spacing: 3–5 rotor diameters across wind · 5–9 downwind', size: 40, weight: 400 },
  ], { px: [1500, 708], bg: '#efe9da' });
  group.add(boardOnPosts(3.6, 1.7, sitePlate, S05.siteBoard[0], S05.siteBoard[1], 0, 0.75));

  // the evening-ramp board beside it
  group.add(rampBoard());

  // substation numbers plate on the south fence, facing the road
  const ssPlate = plateLines(3.4, 1.15, [
    { text: 'POOLING SUBSTATION · 2 × 40 MVA · 33/132 kV', size: 66 },
    { text: 'EXPORT 25.3 MW AT 18:30', size: 62 },
    { text: 'WIND 8.6 m/s @ 105 m · GHI 142 W/m² AND FALLING', size: 50, weight: 400 },
  ], { px: [1500, 508] });
  ssPlate.position.set(140, 1.55, -21.4);
  group.add(ssPlate);
  group.add(box(0.09, 1.5, 0.09, MAT.structure, 138.4, 0.75, -21.45));
  group.add(box(0.09, 1.5, 0.09, MAT.structure, 141.6, 0.75, -21.45));

  // danger plates on the substation fence
  for (const dx of [122, 158]) {
    const dp = plateLines(0.62, 0.42, [{ text: 'DANGER', size: 64 }, { text: '132 kV', size: 58 }],
      { bg: '#e3a008', px: [512, 348] });
    dp.position.set(dx, 1.5, -21.42);
    group.add(dp);
  }

  // BESS yard sign at the gate, facing west (the approach)
  const bessPlate = plateLines(2.3, 1.05, [
    { text: 'BESS — 39.2 MWh · 9.8 MW', size: 66 },
    { text: 'DISCHARGES 18:30–22:30 · THE EVENING SHIFT', size: 48 },
    { text: '10 × MEGAPACK 2XL · STATE OF CHARGE 96%', size: 44, weight: 400 },
  ], { px: [1300, 594] });
  group.add(boardOnPosts(2.3, 1.05, bessPlate, S05.bessSign[0], S05.bessSign[1], -Math.PI / 2, 0.6));

  // array block signs
  const blocks = ['A', 'B', 'C'];
  S05.pv.blocks.forEach((bx, i) => {
    const bp = plateLines(1.15, 0.5, [{ text: `ARRAY BLOCK ${blocks[i]}`, size: 58 }], { px: [768, 334] });
    group.add(boardOnPosts(1.15, 0.5, bp, bx - 14, 27.5, 0, 0.55));
  });

  // met mast plate
  const mastPlate = plateLines(1.3, 0.55, [
    { text: 'MET MAST · 105 m', size: 60 },
    { text: 'IEC 61400-12-1 · 12-MONTH CAMPAIGN', size: 42, weight: 400 },
  ], { px: [900, 380] });
  group.add(boardOnPosts(1.3, 0.55, mastPlate, S05.mast.x + 3.4, S05.mast.z + 2.6, Math.PI / 4, 0.5));

  // inverter-station block sign (the second modelled station)
  const invPlate = plateLines(1.3, 0.5, [{ text: 'INVERTER STATION 4 OF 7', size: 52 }], { px: [900, 346] });
  group.add(boardOnPosts(1.3, 0.5, invPlate, 21.5, 4.5, Math.PI, 0.5));

  return group;
}
