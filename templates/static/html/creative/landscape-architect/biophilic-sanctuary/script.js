/* Ellery Ground — interactions
   Sun-path planner computed from solar geometry at 45.5°N,
   plus the shared menu, form validation and reveal-on-load. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('load', function () {
    document.body.classList.add('loaded');
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- sun path planner ---------- */
  var plot = document.getElementById('sunPlot');
  if (plot) {
    var LAT = 45.5 * Math.PI / 180;
    var DECL = { jun: 23.44, mar: 0, dec: -23.44 };
    var OCCLUDE = {
      jun: { open: 0, deciduous: 14, evergreen: 18 },
      mar: { open: 0, deciduous: 7, evergreen: 18 },
      dec: { open: 0, deciduous: 3, evergreen: 18 }
    };
    var GLASS_REDUCTION = {
      jun: { open: 'No canopy: the full June load lands on the glass from 10:00 to 16:00.', deciduous: 'Deciduous canopy: leaf-on blocks the high summer sun, leaf-off admits 78% of winter noon radiation.', evergreen: 'Evergreen canopy: steady summer shade, but it also closes the winter solar window.' },
      mar: { open: 'No canopy: the equinox sun crosses deep into the room and no shading is needed.', deciduous: 'Deciduous canopy: still bare in March, so the equinox sun reaches the glass.', evergreen: 'Evergreen canopy: blocks roughly half of the useful equinox gain.' },
      dec: { open: 'No canopy: December noon sun reaches 6.4 m into an unshaded room.', deciduous: 'Deciduous canopy: bare branches admit most of the low winter sun.', evergreen: 'Evergreen canopy: the winter solar window is largely lost.' }
    };

    var x0 = 44, x1 = 424, yTop = 24, yGround = 252, maxAlt = 80;
    function X(azRel) { return 220 + (azRel / 110) * ((x1 - x0) / 2); }
    function Y(alt) { return yGround - (alt / maxAlt) * (yGround - yTop); }

    function solar(hour, decl) {
      var d = decl * Math.PI / 180;
      var H = (hour - 12) * 15 * Math.PI / 180;
      var sinAlt = Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(H);
      sinAlt = Math.max(-1, Math.min(1, sinAlt));
      var alt = Math.asin(sinAlt);
      var cosAz = (Math.sin(d) - sinAlt * Math.sin(LAT)) / (Math.cos(alt) * Math.cos(LAT));
      cosAz = Math.max(-1, Math.min(1, cosAz));
      var azFromNorth = Math.acos(cosAz) * 180 / Math.PI;
      if (H > 0) azFromNorth = 360 - azFromNorth;
      return { alt: alt * 180 / Math.PI, az: azFromNorth };
    }

    function svgEl(name, attrs) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', name);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    }

    // static grid
    var grid = document.getElementById('sunGrid');
    var labels = document.getElementById('sunLabels');
    [0, 20, 40, 60, 80].forEach(function (a) {
      grid.appendChild(svgEl('line', { x1: x0, y1: Y(a), x2: x1, y2: Y(a) }));
      var t = svgEl('text', { x: x0 - 8, y: Y(a) + 3, 'text-anchor': 'end', fill: '#767a6c' });
      t.textContent = a + '°';
      labels.appendChild(t);
    });
    [-90, -45, 0, 45, 90].forEach(function (az) {
      grid.appendChild(svgEl('line', { x1: X(az), y1: yTop, x2: X(az), y2: yGround, stroke: az === 0 ? 'rgba(35,37,31,0.22)' : 'rgba(35,37,31,0.1)' }));
    });
    [['E', -90], ['SE', -45], ['S', 0], ['SW', 45], ['W', 90]].forEach(function (pair) {
      var t = svgEl('text', { x: X(pair[1]), y: yGround + 14, 'text-anchor': 'middle', fill: '#767a6c' });
      t.textContent = pair[0];
      labels.appendChild(t);
    });
    var altTitle = svgEl('text', { x: x0 - 8, y: yTop - 10, 'text-anchor': 'end', fill: '#767a6c' });
    altTitle.textContent = 'alt';
    labels.appendChild(altTitle);

    var paths = document.getElementById('sunPaths');
    var shadeBand = document.getElementById('shadeBand');
    var markerDot = document.getElementById('markerDot');
    var markerDrop = document.getElementById('markerDrop');
    var hourRange = document.getElementById('hourRange');
    var hourRead = document.getElementById('hourRead');
    var outAlt = document.getElementById('outAlt');
    var outAz = document.getElementById('outAz');
    var outShadow = document.getElementById('outShadow');
    var outSun = document.getElementById('outSun');
    var instNote = document.getElementById('instNote');

    var state = { season: 'jun', canopy: 'deciduous', hour: 14 };

    var COLORS = { jun: '#22331f', mar: '#935c3e', dec: '#767a6c' };

    function drawSeason(season) {
      var decl = DECL[season];
      var segs = [];
      var seg = [];
      for (var h = 3; h <= 22; h += 0.1) {
        var s = solar(h, decl);
        if (s.alt > 0) {
          seg.push(X(s.az - 180) + ',' + Y(s.alt));
        } else if (seg.length) {
          segs.push(seg); seg = [];
        }
      }
      if (seg.length) segs.push(seg);
      segs.forEach(function (points, i) {
        paths.appendChild(svgEl('polyline', {
          points: points.join(' '),
          stroke: COLORS[season],
          'stroke-width': season === state.season ? 1.8 : 1.1,
          opacity: season === state.season ? 1 : 0.28
        }));
      });
    }

    function drawShade() {
      var occ = OCCLUDE[state.season][state.canopy];
      if (occ <= 0) {
        shadeBand.setAttribute('d', '');
      } else {
        var y = Y(occ);
        shadeBand.setAttribute('d', 'M' + x0 + ' ' + yGround + ' L' + x0 + ' ' + y + ' L' + x1 + ' ' + y + ' L' + x1 + ' ' + yGround + ' Z');
      }
    }

    function sunHours() {
      var occ = OCCLUDE[state.season][state.canopy];
      var decl = DECL[state.season];
      var count = 0;
      for (var h = 0; h <= 24; h += 0.05) {
        var s = solar(h, decl);
        var azRel = s.az - 180;
        if (s.alt > occ && Math.abs(azRel) < 90 && s.alt > 2) count += 0.05;
      }
      return count;
    }

    function update() {
      paths.innerHTML = '';
      drawSeason('jun'); drawSeason('mar'); drawSeason('dec');
      drawShade();
      document.querySelectorAll('[data-season]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.season === state.season ? 'true' : 'false');
      });
      document.querySelectorAll('[data-canopy]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.canopy === state.canopy ? 'true' : 'false');
      });

      var s = solar(state.hour, DECL[state.season]);
      var hh = Math.floor(state.hour);
      var mm = Math.round((state.hour - hh) * 60);
      hourRead.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');

      if (s.alt > 0) {
        var x = X(s.az - 180), y = Y(s.alt);
        markerDot.setAttribute('cx', x); markerDot.setAttribute('cy', y);
        markerDrop.setAttribute('x1', x); markerDrop.setAttribute('x2', x);
        markerDot.style.opacity = 1; markerDrop.style.opacity = 1;
        outAlt.textContent = s.alt.toFixed(1) + '°';
        outAz.textContent = s.az.toFixed(0) + '°';
        var shadow = 6 / Math.tan(s.alt * Math.PI / 180);
        outShadow.textContent = shadow > 60 ? '∞' : shadow.toFixed(1) + ' m';
      } else {
        markerDot.style.opacity = 0; markerDrop.style.opacity = 0;
        outAlt.textContent = 'below'; outAz.textContent = '—'; outShadow.textContent = '—';
      }
      var hrs = sunHours();
      outSun.textContent = hrs.toFixed(1) + ' h';

      // note: shorten on narrow screens is handled by CSS wrapping
      instNote.textContent = GLASS_REDUCTION[state.season][state.canopy];
    }

    document.querySelectorAll('[data-season]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.season = b.dataset.season;
        update();
      });
    });
    document.querySelectorAll('[data-canopy]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.canopy = b.dataset.canopy;
        update();
      });
    });
    hourRange.addEventListener('input', function () {
      state.hour = parseFloat(hourRange.value);
      update();
    });

    update();

    // drag on the plot also moves the hour: pick nearest hour whose sun altitude is positive
    plot.addEventListener('click', function (ev) {
      var box = plot.getBoundingClientRect();
      var px = (ev.clientX - box.left) / box.width * 440;
      var py = (ev.clientY - box.top) / box.height * 292;
      var alt = (yGround - py) / (yGround - yTop) * maxAlt;
      var azRel = (px - 220) / ((x1 - x0) / 2) * 110;
      var best = null;
      for (var h = 3; h <= 22; h += 0.05) {
        var s = solar(h, DECL[state.season]);
        if (s.alt <= 0) continue;
        var d = Math.hypot(X(s.az - 180) - px, Y(s.alt) - py);
        if (!best || d < best.d) best = { d: d, h: h };
      }
      if (best && best.d < 60) {
        state.hour = Math.round(best.h * 4) / 4;
        hourRange.value = state.hour;
        update();
      }
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var fields = [
      { id: 'f-name', test: function (v) { return v.trim().length >= 2; } },
      { id: 'f-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'f-site', test: function (v) { return v.trim().length >= 3; } },
      { id: 'f-message', test: function (v) { return v.trim().length >= 20; } }
    ];
    function checkField(f) {
      var input = document.getElementById(f.id);
      if (!input) return true;
      var ok = f.test(input.value);
      input.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    }
    fields.forEach(function (f) {
      var input = document.getElementById(f.id);
      if (input) input.addEventListener('blur', function () { checkField(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = fields.every(checkField);
      if (!ok) {
        status.className = 'form-status';
        var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      status.className = 'form-status show';
      status.innerHTML = '<strong>Thank you — the note is with us.</strong> We reply within two working days with two or three site-walk times. If the enquiry is about a planning deadline, say so in the message and we will call instead.';
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = 'Sent';
    });
  }
})();
