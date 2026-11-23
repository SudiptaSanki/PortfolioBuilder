/* Abrasive Stream — kerf/speed simulator, quote form. */

(function () {
  'use strict';

  var MATERIALS = {
    titanium: { name: 'Titanium 6Al-4V', base: 1000, kerf: 1.0, note: 'No heat-affected zone, no recast. Thin sections may need tabs; abrasive can embed in the cut edge and is removed by bead blasting if specified.' },
    marble: { name: 'Marble', base: 10350, kerf: 1.05, note: 'Cuts cleanly with no thermal shock. Thick stone shows a slight V-taper and striations toward the exit; a tilting head removes both at a slower rate.' },
    carbon: { name: 'Carbon fibre', base: 3690, kerf: 0.95, note: 'No fumes and no delamination when pierced off-part with a low-pressure pierce. Abrasive can linger in the cut edge; specify a sealing coat if the part is structural.' },
    glass: { name: 'Glass (not tempered)', base: 6525, kerf: 0.9, note: 'Float and laminated glass cut well. Tempered glass must never be waterjet cut: it is under internal stress and will shatter.' }
  };
  var QF = { 1: { speed: 1.6, kerf: 1.15, ra: 12.5, label: 'Q1 separation' }, 3: { speed: 1.0, kerf: 1.0, ra: 6.3, label: 'Q3 medium' }, 5: { speed: 0.55, kerf: 0.85, ra: 3.2, label: 'Q5 fine' } };

  var elSpeed = document.getElementById('outSpeed');
  var elKerf = document.getElementById('outKerf');
  var elTime = document.getElementById('outTime');
  var elCost = document.getElementById('outCost');
  var matName = document.getElementById('matName');
  var qualName = document.getElementById('qualName');
  var thickVal = document.getElementById('thickVal');
  var lenVal = document.getElementById('lenVal');
  var simNote = document.getElementById('simNote');
  var thick = document.getElementById('thick');
  var len = document.getElementById('len');
  var kerfPath = document.getElementById('kerfPath');
  var topKerf = document.getElementById('topKerf');
  var botKerf = document.getElementById('botKerf');
  var taperTxt = document.getElementById('taperTxt');
  var thickTxt = document.getElementById('thickTxt');

  var state = { mat: 'titanium', q: 3 };

  function calc() {
    var m = MATERIALS[state.mat];
    var q = QF[state.q];
    var t = parseFloat(thick.value);
    var metres = parseFloat(len.value);
    var speed = (m.base / Math.pow(t, 0.85)) * q.speed;
    var kerf = m.kerf * q.kerf;
    var cutMin = (metres * 1000) / speed;
    var minutes = cutMin + 0.8;
    var cost = minutes * 1.93 + 2.5;
    var tol = t > 25 ? '±0.25' : (state.q === 5 && t <= 12 ? '±0.05' : '±0.13');

    matName.textContent = m.name;
    qualName.textContent = q.label;
    thickVal.textContent = t + ' mm';
    lenVal.textContent = metres.toFixed(1) + ' m';
    elSpeed.innerHTML = Math.round(speed) + ' <small>mm/min</small>';
    elKerf.innerHTML = kerf.toFixed(2) + ' <small>mm</small>';
    elTime.innerHTML = minutes.toFixed(1) + ' <small>min</small>';
    elCost.innerHTML = '£' + cost.toFixed(2);
    simNote.textContent = m.note + ' Tolerance for this setting: ' + tol + ' mm, edge Ra ' + q.ra + ' µm.';

    // kerf drawing: cx 226, 1 mm = 8.4 px at this scale
    var top = kerf * 4.4;
    var bot = top * 0.94;
    kerfPath.setAttribute('d', 'M' + (226 - top) + ' 60 L' + (226 + top) + ' 60 L' + (226 + bot) + ' 240 L' + (226 - bot) + ' 240 Z');
    topKerf.textContent = kerf.toFixed(2) + ' mm';
    botKerf.textContent = (kerf * 0.94).toFixed(2) + ' mm';
    taperTxt.textContent = (t > 25 ? '1.8°' : (state.q === 5 ? '0.8°' : '1.2°'));
    thickTxt.textContent = 'PLATE ' + t.toFixed(1) + ' mm';
  }

  if (elSpeed) {
    document.querySelectorAll('[data-mat]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.mat = b.getAttribute('data-mat');
        document.querySelectorAll('[data-mat]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        calc();
      });
    });
    document.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.q = parseInt(b.getAttribute('data-q'), 10);
        document.querySelectorAll('[data-q]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        calc();
      });
    });
    thick.addEventListener('input', calc);
    len.addEventListener('input', calc);
    calc();
  }

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('load', function () { document.body.classList.add('loaded'); });

  /* ---------- quote form ---------- */
  var form = document.getElementById('quoteForm');
  if (form) {
    var status = document.getElementById('quoteStatus');
    var checks = [
      { id: 'q-name', test: function (v) { return v.trim().length >= 2; } },
      { id: 'q-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'q-part', test: function (v) { return v.trim().length >= 8; } },
      { id: 'q-qty', test: function (v) { var n = parseInt(v, 10); return n >= 1 && n <= 100000; } }
    ];
    function check(c) {
      var input = document.getElementById(c.id);
      if (!input) return true;
      var ok = c.test(input.value);
      input.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    }
    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      if (input) input.addEventListener('blur', function () { check(c); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checks.every(check)) {
        var bad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (bad) bad.focus();
        return;
      }
      status.className = 'form-status show';
      status.innerHTML = '<strong>Enquiry logged.</strong> Send the DXF or STEP to quote@abrasivestream.example and quote it against this reference. You will have a price, a lead time and any feature we cannot hold within one working day.';
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sent';
    });
  }
})();
