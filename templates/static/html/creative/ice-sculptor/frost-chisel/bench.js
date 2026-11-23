/* Bench: the facet a tool leaves, and the rate at which the room takes it back. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  /* ------------------------------------------------------------- facet */
  var facetSvg = document.getElementById('facet');
  var tools = {
    flat: {
      angle: '38° included',
      finish: 'Matte, holds light',
      use: 'Block lettering and broad planes',
      profile: 'flat'
    },
    v: {
      angle: '60° included',
      finish: 'Crisp groove, dark shadow line',
      use: 'Lettering, feathers and thin detail',
      profile: 'v'
    },
    grinder: {
      angle: '90° burr',
      finish: 'Satin, faint tool marks',
      use: 'Rounded forms and hollows',
      profile: 'round'
    },
    torch: {
      angle: 'None — melted',
      finish: 'Clear, glassy, no facet',
      use: 'Sealing a weld and polishing a face',
      profile: 'torch'
    }
  };

  function drawFacet(key) {
    if (!facetSvg) return;
    clear(facetSvg);
    var tool = tools[key] || tools.flat;

    /* ice body */
    facetSvg.appendChild(el('path', {
      d: 'M40 96 L340 96 L340 210 Q340 216 334 216 L46 216 Q40 216 40 210 Z',
      class: 'ice-fill'
    }));
    facetSvg.appendChild(el('path', {
      d: 'M40 96 L340 96 L340 210 Q340 216 334 216 L46 216 Q40 216 40 210 Z',
      class: 'ice-line'
    }));
    facetSvg.appendChild(el('line', { x1: 24, y1: 96, x2: 396, y2: 96, class: 'ice-dash' }));

    var path;
    if (tool.profile === 'flat') {
      path = 'M150 96 L196 124 L246 124 L286 96';
      facetSvg.appendChild(el('path', { d: path, class: 'ice-line' }));
      facetSvg.appendChild(el('path', { d: 'M196 124 L196 104 M246 124 L246 104', class: 'facet-hatch' }));
      facetSvg.appendChild(el('path', { d: 'M196 124 L196 164', class: 'measure' }));
      facetSvg.appendChild(el('path', { d: 'M188 124 L204 124 M188 164 L204 164', class: 'measure' }));
      facetSvg.appendChild(el('text', { x: 206, y: 150, class: 'measure-text' }, '12 mm facet'));
      facetSvg.appendChild(el('path', { d: 'M150 96 L196 124', class: 'measure' }));
      facetSvg.appendChild(el('text', { x: 140, y: 88, class: 'measure-text', 'text-anchor': 'middle' }, '38°'));
    } else if (tool.profile === 'v') {
      facetSvg.appendChild(el('path', { d: 'M170 96 L216 152 L262 96', class: 'ice-line' }));
      facetSvg.appendChild(el('path', { d: 'M216 152 L216 96', class: 'facet-hatch' }));
      facetSvg.appendChild(el('path', { d: 'M216 152 L216 186', class: 'measure' }));
      facetSvg.appendChild(el('text', { x: 224, y: 176, class: 'measure-text' }, '18 mm deep'));
      facetSvg.appendChild(el('text', { x: 216, y: 84, class: 'measure-text', 'text-anchor': 'middle' }, '60° V'));
    } else if (tool.profile === 'round') {
      facetSvg.appendChild(el('path', { d: 'M160 96 Q216 176 272 96', class: 'ice-line' }));
      facetSvg.appendChild(el('path', { d: 'M216 140 L216 186', class: 'measure' }));
      facetSvg.appendChild(el('text', { x: 224, y: 172, class: 'measure-text' }, '16 mm hollow'));
      facetSvg.appendChild(el('path', { d: 'M168 96 Q216 160 264 96', class: 'facet-hatch' }));
    } else {
      facetSvg.appendChild(el('path', { d: 'M150 96 Q216 116 282 96', class: 'ice-line' }));
      facetSvg.appendChild(el('path', { d: 'M150 96 Q216 108 282 96', class: 'facet-hatch' }));
      facetSvg.appendChild(el('text', { x: 216, y: 78, class: 'measure-text', 'text-anchor': 'middle' }, 'surface re-flowed'));
    }

    /* the tool above the cut */
    if (tool.profile === 'flat' || tool.profile === 'v') {
      var tip = tool.profile === 'flat' ? 'M150 40 L150 64 L216 88 L282 64 L282 40' : 'M170 40 L170 66 L216 96 L262 66 L262 40';
      facetSvg.appendChild(el('path', { d: tip, fill: 'rgba(18,51,61,0.08)', stroke: '#12333d', 'stroke-width': '1.2' }));
      facetSvg.appendChild(el('rect', { x: tool.profile === 'flat' ? 150 : 170, y: 22, width: tool.profile === 'flat' ? 132 : 92, height: 20, fill: '#12333d', opacity: '0.85' }));
    } else {
      facetSvg.appendChild(el('rect', { x: 196, y: 34, width: 40, height: 46, fill: '#12333d', opacity: '0.85' }));
      facetSvg.appendChild(el('circle', { cx: 216, cy: 88, r: 11, fill: 'none', stroke: '#12333d', 'stroke-width': '1.4' }));
    }

    document.getElementById('facet-angle').textContent = tool.angle;
    document.getElementById('facet-finish').textContent = tool.finish;
    document.getElementById('facet-use').textContent = tool.use;
  }

  document.querySelectorAll('[data-tool]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-tool]').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-selected', 'false');
      });
      button.classList.add('is-on');
      button.setAttribute('aria-selected', 'true');
      drawFacet(button.getAttribute('data-tool'));
    });
  });

  drawFacet('flat');

  /* -------------------------------------------------------------- melt */
  var meltSvg = document.getElementById('melt');
  var air = document.getElementById('air');
  var wind = document.getElementById('wind');
  var sun = document.getElementById('sun');
  var lit = document.getElementById('lit');
  var hours = document.getElementById('hours');

  function rate() {
    var airTemp = Number(air.value);
    var windSpeed = Number(wind.value);
    if (airTemp <= 0) return 0;
    var base = 0.055 * airTemp * (1 + 0.035 * windSpeed);
    if (sun && sun.checked) base *= 1.45;
    if (lit && lit.checked) base *= 1.12;
    return base;
  }

  function drawMelt() {
    if (!meltSvg) return;
    clear(meltSvg);

    var r = rate();
    var t = hours ? Number(hours.value) : 0;
    var lost = r * t;

    var W = 420;
    var H = 240;
    var groundY = 206;
    var baseX = 110;
    var baseW = 200;
    var topY = 54;

    /* ground and drip tray */
    meltSvg.appendChild(el('line', { x1: 24, y1: groundY, x2: W - 24, y2: groundY, class: 'ice-dash' }));
    meltSvg.appendChild(el('text', { x: 26, y: groundY + 16, class: 'measure-text' }, 'drip tray'));

    /* original outline */
    meltSvg.appendChild(el('path', {
      d: 'M' + baseX + ' ' + groundY + ' L' + baseX + ' ' + (topY + 40) + ' Q' + baseX + ' ' + topY + ' ' + (baseX + 40) + ' ' + topY +
        ' L' + (baseX + baseW - 40) + ' ' + topY + ' Q' + (baseX + baseW) + ' ' + topY + ' ' + (baseX + baseW) + ' ' + (topY + 40) +
        ' L' + (baseX + baseW) + ' ' + groundY,
      class: 'ice-dash'
    }));

    /* eroded outline */
    var inset = Math.min(46, lost * 3.4);
    var x1 = baseX + inset;
    var x2 = baseX + baseW - inset;
    var yTop = topY + inset;
    var yGround = groundY;
    meltSvg.appendChild(el('path', {
      d: 'M' + x1 + ' ' + yGround + ' L' + x1 + ' ' + (yTop + 30) + ' Q' + x1 + ' ' + yTop + ' ' + (x1 + 30) + ' ' + yTop +
        ' L' + (x2 - 30) + ' ' + yTop + ' Q' + x2 + ' ' + yTop + ' ' + x2 + ' ' + (yTop + 30) +
        ' L' + x2 + ' ' + yGround + ' Z',
      class: 'ice-fill ice-line'
    }));

    /* melt water */
    if (lost > 0.2) {
      var poolW = Math.min(70, lost * 7);
      meltSvg.appendChild(el('ellipse', { cx: 210, cy: groundY + 4, rx: 80 + poolW, ry: 5, fill: 'rgba(31,122,150,0.18)' }));
    }

    /* loss dimension */
    meltSvg.appendChild(el('path', { d: 'M' + (baseX + baseW + 16) + ' ' + topY + ' L' + (baseX + baseW + 16) + ' ' + (topY + inset), class: 'measure' }));
    meltSvg.appendChild(el('path', { d: 'M' + (baseX + baseW + 10) + ' ' + topY + ' L' + (baseX + baseW + 22) + ' ' + topY, class: 'measure' }));
    meltSvg.appendChild(el('path', { d: 'M' + (baseX + baseW + 10) + ' ' + (topY + inset) + ' L' + (baseX + baseW + 22) + ' ' + (topY + inset), class: 'measure' }));
    meltSvg.appendChild(el('text', { x: baseX + baseW + 26, y: topY + inset / 2 + 3, class: 'measure-text' }, lost.toFixed(1) + ' mm'));

    meltSvg.appendChild(el('text', { x: 24, y: 34, class: 'measure-text' }, 'hour ' + t + ' of 12'));

    /* readouts */
    document.getElementById('rate').textContent = r.toFixed(1) + ' mm/h';
    var detailHours = r <= 0.02 ? Infinity : 7 / r;
    document.getElementById('detail').textContent = r <= 0.02 ? 'All night' : (detailHours < 12 ? detailHours.toFixed(1) + ' h' : '12 h +');

    var verdict = document.getElementById('verdict');
    var text;
    var warn = false;
    if (r <= 0.02) {
      text = 'Frozen — no loss';
    } else if (r < 0.8) {
      text = 'Holds through service';
    } else if (r < 1.6) {
      text = 'Detail softens in the last hour';
    } else if (r < 2.6) {
      text = 'Book a short display';
      warn = true;
    } else {
      text = 'Too warm for carved detail';
      warn = true;
    }
    verdict.textContent = text;
    verdict.classList.toggle('is-warn', warn);

    window.__meltState = { rate: Number(r.toFixed(2)), hours: t, lost: Number(lost.toFixed(1)), verdict: warn ? 'warn' : 'ok' };
  }

  [air, wind, sun, lit, hours].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      if (input === air) document.getElementById('air-out').textContent = air.value + ' °C';
      if (input === wind) document.getElementById('wind-out').textContent = wind.value + ' km/h';
      if (input === hours) document.getElementById('hours-out').textContent = hours.value + ' h';
      drawMelt();
    });
  });

  drawMelt();
  window.__benchReady = true;
})();
