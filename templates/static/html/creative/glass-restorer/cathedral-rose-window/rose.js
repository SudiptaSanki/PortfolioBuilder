/* The rose window: twelve leaded panels and twelve petals, lit by a sun the
   visitor places. Panels are drawn from real rose geometry (30° sectors, lead
   lines on the saddle), and each one carries its own conservation record. */
(function () {
  'use strict';

  var svg = document.getElementById('rose');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 320;
  var CY = 320;
  var OUTER_R = 274;
  var MID_R = 168;
  var INNER_R = 62;

  var records = [
    { num: '01', pos: 'North I', title: 'The Tree of Jesse', glass: 'Pot-metal cobalt, flashed ruby', date: 'c. 1225', cond: 'Came fatigued at the springing line; four cracks', treat: 'Re-leaded in 7 mm flat came, 2022', note: 'The central stem was found to be original; only the border was replaced in 1889.' },
    { num: '02', pos: 'North II', title: 'The Elders of the Apocalypse', glass: 'Pot-metal ruby and violet, grisaille', date: 'c. 1225', cond: 'Two losses at the saddle bar; paint loss on three faces', treat: 'Edge-bonded; no re-touching', note: 'Paint loss left as found. Any intervention would have altered the reading of the faces.' },
    { num: '03', pos: 'North III', title: 'The Evangelists, quatrefoil', glass: 'Cobalt, pale green, silver stain', date: 'c. 1230', cond: 'Stable; lead slightly open at two joints', treat: 'Joint repair only', note: 'Left in place. The panel did not travel to the studio.' },
    { num: '04', pos: 'East I', title: 'The Last Judgement, upper medallions', glass: 'Ruby, cobalt, amber', date: 'c. 1240', cond: 'Eleven fractures; two losses at the saddle bar', treat: 'Edge-bonded, copper foil at the saddle', note: 'Photographed in raking light before treatment. All original glass retained.' },
    { num: '05', pos: 'East II', title: 'The Lancets of the Passion', glass: 'Pot-metal ruby, flashed, with grisaille', date: 'c. 1235', cond: 'Edge losses at six panels; corrosion of the ferramenta', treat: 'Edge-bonded; stainless saddle bars', note: 'The saddle bars were replaced to the original profile, not to a modern standard section.' },
    { num: '06', pos: 'East III', title: 'The Corporal Works', glass: 'Cobalt and pale green, grisaille', date: 'c. 1245', cond: 'Hairline fissures in the border; one inserted panel', treat: 'Fissures bonded; insertion documented', note: 'The inserted panel of 1902 was retained and recorded as a later addition.' },
    { num: '07', pos: 'South I', title: 'The Virgin\u2019s Coronation', glass: 'Ruby, cobalt, silver stain', date: 'c. 1230', cond: 'Sound glass; lead of the inner ring replaced in 1968', treat: 'Re-leaded to the 1968 line', note: 'The 1968 came was retained where it still carried the glass; only failed sections were renewed.' },
    { num: '08', pos: 'South II', title: 'The Prophets, inner ring', glass: 'Violet, amber, grisaille', date: 'c. 1225', cond: 'Paint loss across two figures; stable otherwise', treat: 'Consolidated in situ', note: 'Consolidation was carried out on the scaffold to avoid lifting a stable panel.' },
    { num: '09', pos: 'South III', title: 'The Donor Panel, 1502', glass: 'Clear glass, silver stain, enamel', date: '1502', cond: 'Enamel loss at the hem; one crack from the saddle', treat: 'Enamel left; crack bonded', note: 'A later panel in an earlier window. It is recorded separately and not integrated into the medieval cycle.' },
    { num: '10', pos: 'West I', title: 'The Creation, outer ring', glass: 'Cobalt, ruby, pale green', date: 'c. 1220', cond: 'Twelve fractures; lead heavily oxidised', treat: 'Full re-lead, 2021', note: 'The oldest glass in the window. Every fragment was numbered before the came was opened.' },
    { num: '11', pos: 'West II', title: 'The Zodiac', glass: 'Pale blue, amber, grisaille', date: 'c. 1220, restored 1889', cond: 'Nineteenth-century glass in four of eight medallions', treat: 'Recorded; no intervention', note: 'The 1889 restoration is part of the window\u2019s history and was not removed.' },
    { num: '12', pos: 'West III', title: 'The Angel Choir', glass: 'Ruby, cobalt, clear', date: 'c. 1235', cond: 'Two losses at the outer edge; mortar failure behind', treat: 'Edge-bonded; mortar renewed', note: 'Mortar was renewed before the panel returned, so the window could drain again.' }
  ];

  var oculus = {
    num: '00', pos: 'Oculus', title: 'The Lamb and the Twelve Seals',
    glass: 'Ruby, cobalt, clear, silver stain', date: 'c. 1235',
    cond: 'Sound; the central boss was reset in 1908',
    treat: 'Cleaned; no re-leading',
    note: 'The boss sits on a nineteenth-century iron armature that was left in place and monitored.'
  };

  var palettes = {
    chartres: {
      outer: ['#8e1f2f', '#25457c', '#b07a24', '#25457c', '#3f6b53', '#1d3566', '#8e1f2f', '#b07a24', '#25457c', '#3f6b53', '#8e1f2f', '#1d3566'],
      inner: ['#c9b98f', '#8e1f2f', '#c9b98f', '#25457c', '#c9b98f', '#8e1f2f', '#c9b98f', '#25457c', '#c9b98f', '#8e1f2f', '#c9b98f', '#25457c'],
      oculus: '#c8912f'
    },
    rouen: {
      outer: ['#25457c', '#3f6b53', '#b8cbd6', '#25457c', '#2f5a6b', '#3f6b53', '#25457c', '#b8cbd6', '#2f5a6b', '#25457c', '#3f6b53', '#2f5a6b'],
      inner: ['#d7e0e4', '#3f6b53', '#d7e0e4', '#25457c', '#d7e0e4', '#2f5a6b', '#d7e0e4', '#3f6b53', '#d7e0e4', '#25457c', '#d7e0e4', '#2f5a6b'],
      oculus: '#b8cbd6'
    },
    grisaille: {
      outer: ['#8b8478', '#d9c9a8', '#b3a893', '#8b8478', '#d9c9a8', '#9a9184', '#b3a893', '#8b8478', '#d9c9a8', '#9a9184', '#b3a893', '#8b8478'],
      inner: ['#efe7d6', '#8b8478', '#efe7d6', '#b3a893', '#efe7d6', '#8b8478', '#efe7d6', '#b3a893', '#efe7d6', '#8b8478', '#efe7d6', '#b3a893'],
      oculus: '#d9c9a8'
    }
  };

  var palette = 'chartres';
  var azimuth = 150;
  var elevation = 26;
  var selected = 3;

  var outerPaths = [];
  var innerPaths = [];

  /* ---------------------------------------------------------------- helpers */
  function polar(r, deg) {
    var rad = (deg * Math.PI) / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
  }

  function annular(r0, r1, a0, a1) {
    var p0 = polar(r1, a0);
    var p1 = polar(r1, a1);
    var p2 = polar(r0, a1);
    var p3 = polar(r0, a0);
    var large = a1 - a0 > 180 ? 1 : 0;
    return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
      ' A' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) +
      ' L' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2) +
      ' A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + p3[0].toFixed(2) + ' ' + p3[1].toFixed(2) + ' Z';
  }

  function petal(r0, r1, a0, a1) {
    var mid = (a0 + a1) / 2;
    var p0 = polar(r0, a0);
    var p1 = polar(r0, a1);
    var tip = polar(r1, mid);
    return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
      ' A' + r0 + ' ' + r0 + ' 0 0 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) +
      ' L' + tip[0].toFixed(2) + ' ' + tip[1].toFixed(2) + ' Z';
  }

  function rgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  function mix(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  function lit(hex, factor) {
    var base = rgb(hex);
    var warm = [255, 246, 226];
    var cold = [38, 31, 36];
    if (factor >= 0) return mix(base, warm, factor * 0.56);
    return mix(base, cold, -factor * 0.4);
  }

  function angularDelta(a, b) {
    var d = ((a - b + 540) % 360) - 180;
    return d;
  }

  /* ------------------------------------------------------------------ build */
  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  var defs = el('defs', {});
  var glow = el('radialGradient', { id: 'rose-glow', cx: '50%', cy: '50%', r: '50%' });
  glow.appendChild(el('stop', { offset: '0%', 'stop-color': 'rgba(255, 244, 214, 0.55)' }));
  glow.appendChild(el('stop', { offset: '68%', 'stop-color': 'rgba(255, 240, 205, 0.18)' }));
  glow.appendChild(el('stop', { offset: '100%', 'stop-color': 'rgba(255, 240, 205, 0)' }));
  defs.appendChild(glow);
  svg.appendChild(defs);

  var halo = el('circle', { cx: CX, cy: CY, r: OUTER_R + 46, fill: 'url(#rose-glow)' });
  svg.appendChild(halo);

  var stone = el('circle', { cx: CX, cy: CY, r: 290, fill: 'none', stroke: '#e0d2bc', 'stroke-width': 32 });
  svg.appendChild(stone);
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: 306, fill: 'none', stroke: 'rgba(42,33,28,0.16)', 'stroke-width': 1 }));
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: 274, fill: 'none', stroke: 'rgba(42,33,28,0.2)', 'stroke-width': 1 }));

  var outerG = el('g', { class: 'layer-outer' });
  var innerG = el('g', { class: 'layer-inner' });
  var leadG = el('g', { class: 'layer-lead' });

  for (var i = 0; i < 12; i += 1) {
    var a0 = -90 + i * 30 + 0.9;
    var a1 = -90 + (i + 1) * 30 - 0.9;
    var path = el('path', {
      d: annular(MID_R + 3, OUTER_R, a0, a1),
      class: 'panel-glass panel-outer',
      'data-index': String(i),
      role: 'button',
      tabindex: '0',
      'aria-label': 'Panel ' + (i + 1) + ', ' + records[i].pos + ', ' + records[i].title
    });
    outerG.appendChild(path);
    outerPaths.push(path);

    var ring = el('path', {
      d: annular(MID_R + 3, OUTER_R, a0, a1),
      class: 'panel-ring',
      'data-ring': String(i)
    });
    outerG.appendChild(ring);
  }

  for (var j = 0; j < 12; j += 1) {
    var b0 = -90 + j * 30 + 15 + 1.4;
    var b1 = -90 + (j + 1) * 30 + 15 - 1.4;
    var petalNode = el('path', {
      d: petal(INNER_R + 2, MID_R - 3, b0, b1),
      class: 'panel-glass panel-inner',
      'data-inner': String(j)
    });
    innerG.appendChild(petalNode);
    innerPaths.push(petalNode);
  }

  svg.appendChild(outerG);
  svg.appendChild(innerG);

  /* tracery: rings and radial leads */
  leadG.appendChild(el('circle', { cx: CX, cy: CY, r: OUTER_R, class: 'lead-line' }));
  leadG.appendChild(el('circle', { cx: CX, cy: CY, r: MID_R, class: 'lead-line' }));
  leadG.appendChild(el('circle', { cx: CX, cy: CY, r: INNER_R, class: 'lead-line', 'stroke-width': 2.4 }));
  for (var k = 0; k < 12; k += 1) {
    var line = polar(MID_R, -90 + k * 30);
    var outerPoint = polar(OUTER_R, -90 + k * 30);
    leadG.appendChild(el('line', {
      x1: line[0].toFixed(2), y1: line[1].toFixed(2),
      x2: outerPoint[0].toFixed(2), y2: outerPoint[1].toFixed(2),
      class: 'lead-line'
    }));
    var innerA = polar(INNER_R, -90 + k * 30 + 15);
    var innerB = polar(MID_R, -90 + k * 30 + 15);
    leadG.appendChild(el('line', {
      x1: innerA[0].toFixed(2), y1: innerA[1].toFixed(2),
      x2: innerB[0].toFixed(2), y2: innerB[1].toFixed(2),
      class: 'lead-line',
      'stroke-width': 1.4
    }));
  }
  svg.appendChild(leadG);

  /* centre oculus */
  var oculusG = el('g', {});
  var oculusPath = el('circle', {
    cx: CX, cy: CY, r: INNER_R - 1,
    class: 'panel-glass panel-oculus',
    role: 'button',
    tabindex: '0',
    'aria-label': 'Oculus, ' + oculus.title
  });
  oculusPath.setAttribute('data-oculus', '');
  oculusG.appendChild(oculusPath);
  var rosette = el('g', { 'pointer-events': 'none', opacity: '0.9' });
  for (var m = 0; m < 8; m += 1) {
    var tip = polar(INNER_R - 8, -90 + m * 45 + 22.5);
    rosette.appendChild(el('path', {
      d: 'M' + CX + ' ' + CY + ' Q' + (CX + (tip[0] - CX) * 0.45).toFixed(1) + ' ' + (CY + (tip[1] - CY) * 0.45).toFixed(1) +
        ' ' + tip[0].toFixed(1) + ' ' + tip[1].toFixed(1),
      fill: 'none', stroke: '#2c221d', 'stroke-width': 1.2
    }));
  }
  oculusG.appendChild(rosette);
  svg.appendChild(oculusG);



  /* ----------------------------------------------------------------- paint */
  function paint() {
    var paletteData = palettes[palette];
    var sunAngle = azimuth - 90;
    var strength = 0.42 + (elevation / 62) * 0.58;

    outerPaths.forEach(function (path, index) {
      var mid = -90 + index * 30 + 15;
      var delta = Math.abs(angularDelta(mid, sunAngle));
      var facing = Math.cos((delta * Math.PI) / 180);
      var factor = Math.sign(facing) * Math.pow(Math.abs(facing), 2.4) * strength;
      path.setAttribute('fill', lit(paletteData.outer[index], factor));
    });

    innerPaths.forEach(function (path, index) {
      var mid = -90 + index * 30 + 30;
      var delta = Math.abs(angularDelta(mid, sunAngle));
      var facing = Math.cos((delta * Math.PI) / 180);
      var factor = Math.sign(facing) * Math.pow(Math.abs(facing), 2) * strength * 0.85;
      var base = paletteData.inner[index];
      path.setAttribute('fill', lit(base, factor));
    });

    oculusPath.setAttribute('fill', lit(paletteData.oculus, 0.3 * strength));



    outerPaths.forEach(function (path, index) {
      var ring = outerG.querySelector('[data-ring="' + index + '"]');
      if (ring) ring.style.opacity = index === selected ? '1' : '0';
    });

    var timeLabel = document.getElementById('rose-time');
    if (timeLabel) {
      timeLabel.textContent = 'Sun ' + azimuth + '° ' + compass(azimuth) + ' · ' + elevation + '° elevation · ' + azimuthTime(azimuth);
    }
  }

  function compass(deg) {
    var names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return names[Math.round(deg / 22.5) % 16];
  }

  function azimuthTime(deg) {
    if (deg < 45 || deg > 315) return 'north light';
    if (deg < 135) return 'morning';
    if (deg < 225) return 'afternoon';
    return 'evening';
  }

  /* ---------------------------------------------------------------- record */
  function showRecord(index) {
    var data = index === 'oculus' ? oculus : records[index];
    if (!data) return;
    var fill = function (id, value) {
      var node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    fill('rec-num', 'Panel ' + data.num);
    fill('rec-pos', data.pos);
    fill('rec-title', data.title);
    fill('rec-glass', data.glass);
    fill('rec-date', data.date);
    fill('rec-cond', data.cond);
    fill('rec-treat', data.treat);
    fill('rec-note', data.note);
  }

  function select(index) {
    selected = index;
    if (document.activeElement && document.activeElement !== document.body) {
      /* keep focus where the visitor put it */
    }
    paint();
    showRecord(index);
  }

  outerPaths.forEach(function (path, index) {
    path.addEventListener('click', function () { select(index); });
    path.addEventListener('focus', function () { select(index); });
    path.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(index);
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        var next = (index + 1) % 12;
        outerPaths[next].focus();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        var prev = (index + 11) % 12;
        outerPaths[prev].focus();
      }
    });
  });

  oculusPath.addEventListener('click', function () { select('oculus'); });
  oculusPath.addEventListener('focus', function () { select('oculus'); });
  oculusPath.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select('oculus');
    }
  });

  /* ---------------------------------------------------------------- controls */
  var azimuthInput = document.getElementById('azimuth');
  var elevationInput = document.getElementById('elevation');
  var azimuthOut = document.getElementById('azimuth-out');
  var elevationOut = document.getElementById('elevation-out');

  if (azimuthInput) {
    azimuthInput.addEventListener('input', function () {
      azimuth = Number(azimuthInput.value);
      if (azimuthOut) azimuthOut.textContent = azimuth + '°';
      paint();
    });
  }
  if (elevationInput) {
    elevationInput.addEventListener('input', function () {
      elevation = Number(elevationInput.value);
      if (elevationOut) elevationOut.textContent = elevation + '°';
      paint();
    });
  }

  document.querySelectorAll('.swatch').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.swatch').forEach(function (other) {
        other.classList.remove('is-active');
        other.setAttribute('aria-checked', 'false');
      });
      button.classList.add('is-active');
      button.setAttribute('aria-checked', 'true');
      palette = button.getAttribute('data-tint');
      paint();
    });
  });

  /* drag the sun around the window */
  var dragging = false;
  function pointToAngle(event) {
    var rect = svg.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var scale = 640 / rect.width;
    var dx = x * scale - CX;
    var dy = y * scale - CY;
    var deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    return (deg + 360) % 360;
  }

  svg.addEventListener('pointerdown', function (event) {
    if (event.target.classList.contains('panel-glass')) return;
    dragging = true;
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
    }
    azimuth = Math.round(pointToAngle(event));
    if (azimuthInput.value !== String(azimuth)) azimuthInput.value = String(azimuth);
    if (azimuthOut) azimuthOut.textContent = azimuth + '°';
    paint();
  });

  svg.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    azimuth = Math.round(pointToAngle(event));
    if (azimuthInput.value !== String(azimuth)) azimuthInput.value = String(azimuth);
    if (azimuthOut) azimuthOut.textContent = azimuth + '°';
    paint();
  });

  function endDrag() { dragging = false; }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', endDrag);

  paint();
  showRecord(selected);
  window.__roseReady = true;
})();
