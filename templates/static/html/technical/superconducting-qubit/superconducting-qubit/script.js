/* Mira Halvorsen — shared behaviour
   Navigation, the coherence budget model, and contact-form validation.
   No audio, no external libraries. */

(function () {
  'use strict';

  /* ---------- rail navigation ---------- */

  var rail = document.getElementById('rail');
  var menuBtn = document.getElementById('menuBtn');

  if (rail && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = rail.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    rail.querySelectorAll('.rail-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        rail.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('open')) {
        rail.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- coherence budget ---------- */

  var freq = document.getElementById('freq');
  if (freq) initCoherence();

  function initCoherence() {
    var LOSS = [2.0e-7, 3.5e-7, 6.0e-7, 1.0e-6, 1.6e-6, 2.4e-6, 3.5e-6];
    var PARTICIPATION = 0.11;      // electric energy in substrate + surface
    var HZ_PER_K = 20.836;         // GHz per kelvin, h/kB
    var state = { temp: 15, f: 5.0, lossIdx: 3, nbar: 0.2 };

    var loss = document.getElementById('loss');
    var photons = document.getElementById('photons');
    var freqOut = document.getElementById('freqOut');
    var lossOut = document.getElementById('lossOut');
    var photonsOut = document.getElementById('photonsOut');
    var note = document.getElementById('instNote');
    var t1Path = document.getElementById('t1Path');
    var t2Path = document.getElementById('t2Path');
    var grid = document.getElementById('plotGrid');
    var ticks = document.getElementById('plotTicks');
    var outNth = document.getElementById('outNth');
    var outT1 = document.getElementById('outT1');
    var outT2 = document.getElementById('outT2');
    var outE1 = document.getElementById('outE1');
    var outE2 = document.getElementById('outE2');

    var X0 = 40, X1 = 480, Y0 = 24, Y1 = 252;

    function thermalPhotons(f, tempMilliK) {
      var x = (f * 1000) / (HZ_PER_K * tempMilliK);
      if (x > 40) return 0;
      return 1 / (Math.exp(x) - 1);
    }

    function compute() {
      var nth = thermalPhotons(state.f, state.temp);
      var tanD = LOSS[state.lossIdx];

      // dielectric-limited relaxation: T1 = 1 / (2 pi f tan(delta) p)
      var t1diel = 1 / (2 * Math.PI * state.f * 1e9 * tanD * PARTICIPATION) * 1e6;
      // photon-induced transitions shorten the measured lifetime
      var t1 = t1diel / (1 + 2.2 * nth);
      // dephasing from flux noise and residual resonator population
      var tphi = 900 * Math.sqrt(5 / state.f) / (1 + 4 * state.nbar);
      var t2 = 1 / (1 / (2 * t1) + 1 / tphi);

      var tg1 = 0.025;   // single-qubit gate, microseconds
      var tg2 = 0.120;   // CZ, microseconds
      var e1 = 4.2e-4 + 0.5 * (tg1 / t1) + 0.6 * (tg1 / t2) + 2.0e-3 * nth;
      var e2 = 6.0e-3 + 1.5 * (tg2 / t1) + 1.0 * (tg2 / t2) + 4.0e-3 * nth;

      return { nth: nth, tanD: tanD, t1diel: t1diel, t1: t1, t2: t2, e1: e1, e2: e2 };
    }

    function niceMax(v) {
      var targets = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000];
      for (var i = 0; i < targets.length; i++) if (v <= targets[i]) return targets[i];
      return 4000;
    }

    function draw(r) {
      var xmax = niceMax(3.2 * r.t1);
      var sx = (X1 - X0) / xmax;
      var sy = Y1 - Y0;

      // grid
      var g = '';
      for (var k = 0; k <= 4; k++) {
        var y = Y1 - (k / 4) * sy;
        g += '<line x1="' + X0 + '" y1="' + y + '" x2="' + X1 + '" y2="' + y + '"' + (k === 0 ? ' stroke="#b3aea2"' : '') + '/>';
      }
      grid.innerHTML = g;

      // ticks
      var t = '<text x="' + (X0 - 6) + '" y="' + (Y1 + 3) + '" text-anchor="end">0</text>';
      for (var i = 1; i <= 4; i++) {
        t += '<text x="' + (X0 - 6) + '" y="' + (Y1 - (i / 4) * sy + 3) + '" text-anchor="end">' + (i / 4).toFixed(2).replace('0.', '.') + '</text>';
      }
      for (var j = 1; j <= 4; j++) {
        var xv = (xmax / 4) * j;
        t += '<line x1="' + (X0 + xv * sx) + '" y1="' + Y1 + '" x2="' + (X0 + xv * sx) + '" y2="' + (Y1 + 4) + '" stroke="#b3aea2"/>';
        t += '<text x="' + (X0 + xv * sx) + '" y="' + (Y1 + 16) + '" text-anchor="middle">' + Math.round(xv) + '</text>';
      }
      ticks.innerHTML = t;

      // curves
      var N = 140;
      var d1 = '', d2 = '';
      for (var s = 0; s <= N; s++) {
        var tt = (s / N) * xmax;
        var x = X0 + tt * sx;
        var y1 = Y1 - Math.exp(-tt / r.t1) * sy;
        var y2 = Y1 - Math.exp(-Math.pow(tt / r.t2, 2)) * sy;
        d1 += (s === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y1.toFixed(1);
        d2 += (s === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y2.toFixed(1);
      }
      t1Path.setAttribute('d', d1);
      t2Path.setAttribute('d', d2);
    }

    function fmtInt(n) {
      return Math.round(n).toLocaleString('en-GB');
    }

    function smallE(n) {
      if (n < 1e-4) {
        var exp = Math.floor(Math.log10(n));
        var mant = n / Math.pow(10, exp);
        return mant.toFixed(1) + ' × 10<sup>' + exp + '</sup>';
      }
      return n.toPrecision(2).replace('e-', ' × 10⁻');
    }

    function nthText(n) {
      if (n < 1e-9) return '&lt; 10⁻⁹';
      if (n < 1e-4) return smallE(n);
      return n.toFixed(3);
    }

    function update() {
      var r = compute();

      freqOut.textContent = state.f.toFixed(2) + ' GHz';
      lossOut.textContent = (r.tanD * 1e6).toFixed(1) + ' × 10⁻⁶';
      photonsOut.textContent = state.nbar.toFixed(2);

      outNth.innerHTML = nthText(r.nth);
      outT1.textContent = fmtInt(r.t1) + ' µs';
      outT2.textContent = fmtInt(r.t2) + ' µs';
      outE1.textContent = (100 * (1 - r.e1)).toFixed(3) + '%';
      outE2.textContent = (100 * (1 - r.e2)).toFixed(2) + '%';

      if (state.temp >= 800) {
        note.innerHTML = 'At 800 mK the resonator carries ' + r.nth.toFixed(2) + ' thermal photons. The qubit is still measurable, but the lifetime has dropped to ' + fmtInt(r.t1) + ' µs and the CZ error is dominated by photon-induced transitions. This is a diagnostic point, not an operating point.';
      } else if (state.temp >= 100) {
        note.innerHTML = 'At 100 mK there are ' + r.nth.toFixed(2) + ' photons in the readout mode. That is enough to shorten T1 to ' + fmtInt(r.t1) + ' µs and to pull the echo coherence below the dielectric limit. Cold attenuators at the still and the cold plate are what buy this back.';
      } else if (r.tanD > 1.5e-6) {
        note.innerHTML = 'The substrate dominates: at tanδ = ' + (r.tanD * 1e6).toFixed(1) + ' × 10⁻⁶ the dielectric limit alone is ' + fmtInt(r.t1diel) + ' µs. Thermal photons are negligible here, so fabrication, not the fridge, is the lever.';
      } else {
        note.innerHTML = 'At ' + state.temp + ' mK the thermal photon number is ' + (r.nth < 1e-9 ? 'below 10⁻⁹' : nthText(r.nth)) + '. Nothing in the fridge is warm enough to excite the qubit; what limits T1 is the substrate and the package surface.';
      }

      draw(r);
    }

    document.querySelectorAll('[data-temp]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.temp = parseInt(b.getAttribute('data-temp'), 10);
        document.querySelectorAll('[data-temp]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        update();
      });
    });

    freq.addEventListener('input', function () {
      state.f = parseFloat(freq.value);
      update();
    });
    loss.addEventListener('input', function () {
      state.lossIdx = parseInt(loss.value, 10);
      update();
    });
    photons.addEventListener('input', function () {
      state.nbar = parseFloat(photons.value);
      update();
    });

    update();
  }

  /* ---------- plate filters ---------- */

  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var plates = Array.prototype.slice.call(document.querySelectorAll('.plate'));
    var count = document.getElementById('plateCount');
    var emptyNote = document.getElementById('emptyNote');

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      plates.forEach(function (p) {
        var match = cat === 'all' || p.getAttribute('data-cat') === cat;
        p.hidden = !match;
        if (match) shown++;
      });
      if (count) count.textContent = String(shown);
      if (emptyNote) emptyNote.hidden = shown > 0;
    });
  }

  /* ---------- faq accordion ---------- */

  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      var panel = q.closest('div').querySelector('.faq-a');
      if (panel) panel.hidden = open;
    });
  });

  /* ---------- contact form ---------- */

  var form = document.getElementById('enquiry');
  if (form) {
    var status = document.getElementById('formStatus');

    function setError(field, message) {
      field.classList.add('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = message;
      var input = field.querySelector('input, textarea, select');
      if (input) input.setAttribute('aria-invalid', 'true');
    }

    function clearError(field) {
      field.classList.remove('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = '';
      var input = field.querySelector('input, textarea, select');
      if (input) input.removeAttribute('aria-invalid');
    }

    form.querySelectorAll('.field input, .field textarea, .field select').forEach(function (input) {
      input.addEventListener('input', function () {
        clearError(input.closest('.field'));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;

      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError(name.closest('.field'), 'Please give a name I can answer to.');
        ok = false; firstBad = firstBad || name;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email.closest('.field'), 'That address does not look complete.');
        ok = false; firstBad = firstBad || email;
      }
      if (message.value.trim().length < 24) {
        setError(message.closest('.field'), 'A sentence or two about the chip or the measurement helps.');
        ok = false; firstBad = firstBad || message;
      }

      if (!ok) {
        status.textContent = 'The form needs ' + (firstBad === name || !name.value ? 'a name, ' : '') + 'a working address and a short description before it can be sent.';
        status.className = 'form-status bad';
        if (firstBad) firstBad.focus();
        return;
      }

      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note is with me; hardware enquiries get an answer within three working days.';
      status.className = 'form-status good';
      form.reset();
      form.querySelectorAll('.field').forEach(clearError);
    });
  }
})();
