/* Tōri Cotton — cutting sheet planner.
   The preview is an SVG cutting diagram: sleeve geometry, panel widths and pattern all follow the inputs. */

(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', nav.classList.toggle('is-open') ? 'true' : 'false');
    });
  }

  var planner = document.getElementById('planner');
  if (!planner) { initForm(); return; }

  var COLOURS = {
    ai:    { base: '#1E2E4A', name: 'Indigo' },
    sumi:  { base: '#2A2A2E', name: 'Sumi ink' },
    beni:  { base: '#A6384B', name: 'Safflower' },
    asagi: { base: '#3F6F7E', name: 'Pale blue' }
  };
  var PATTERNS = {
    seigaiha: 'seigaiha waves',
    asanoha: 'hemp leaf',
    kikko: 'tortoiseshell',
    shibori: 'bound dots',
    stripe: 'Matsusaka stripe'
  };
  var SLEEVES = {
    standard: { take: 49, drop: 300, label: 'Sode-take 49 cm — the everyday yukata sleeve, ends mid-forearm.' },
    long:     { take: 68, drop: 384, label: 'Sode-take 68 cm — long sleeve, worn by younger clients and at fireworks.' },
    child:    { take: 38, drop: 246, label: 'Sode-take 38 cm — short sleeve, for a child or a working yukata.' }
  };

  var state = { height: 162, sleeve: 'standard', pattern: 'seigaiha', colour: 'ai' };

  var heightEl = document.getElementById('height');
  var heightOut = document.getElementById('heightOut');
  var sleeveHint = document.getElementById('sleeveHint');
  var patternEl = document.getElementById('pattern');
  var gBody = document.getElementById('gBody');
  var gSleeveL = document.getElementById('gSleeveL');
  var gSleeveR = document.getElementById('gSleeveR');
  var cBody = document.getElementById('cBody');
  var cSleeveL = document.getElementById('cSleeveL');
  var cSleeveR = document.getElementById('cSleeveR');
  var pat = document.querySelector('.pat');
  var mL = document.getElementById('mTake');
  var mY = document.getElementById('mYuki');

  function paths(drop, hem) {
    var body = 'M116 96 L146 74 L190 100 L234 74 L264 96 L264 ' + hem + ' L116 ' + hem + ' Z';
    var left = 'M116 96 L66 118 L60 ' + drop + ' L116 ' + (drop + 8) + ' Z';
    var right = 'M264 96 L314 118 L320 ' + drop + ' L264 ' + (drop + 8) + ' Z';
    return [body, left, right];
  }

  function update() {
    var h = state.height;
    var take = h - 4;
    var yuki = Math.round(h * 0.42 + 2);
    var sode = SLEEVES[state.sleeve].take;
    var mae = Math.round(h * 0.148);
    var ushiro = Math.round(h * 0.185);
    var used = ((2 * take) + (2 * sode) + 240 + 90) / 100;      // metres before pattern allowance
    var withRepeat = used * 1.15;
    var offcut = Math.max(0, 12 - withRepeat);
    var obi = 3.6;

    heightOut.textContent = h + ' cm';
    sleeveHint.textContent = SLEEVES[state.sleeve].label;

    document.getElementById('outTake').textContent = take + ' cm';
    document.getElementById('outYuki').textContent = yuki + ' cm';
    document.getElementById('outSleeve').textContent = sode + ' cm';
    document.getElementById('outPanels').textContent = mae + ' / ' + ushiro + ' cm';
    document.getElementById('outTan').textContent = withRepeat.toFixed(1) + ' m';
    document.getElementById('outObi').textContent = obi.toFixed(1) + ' m';
    document.getElementById('outOffcut').textContent = offcut.toFixed(1) + ' m → ' +
      (offcut > 2.6 ? 'a haori collar + two kinchaku' : offcut > 1.6 ? 'two kinchaku' : 'one kinchaku');
    document.getElementById('sheetNote').textContent = 'Bolt 38 cm wide, 12 m tan. ' + used.toFixed(1) +
      ' m of cloth plus 15 % pattern repeat = ' + withRepeat.toFixed(1) + ' m. Cut with a 1.5 cm seam allowance; the obi is a separate 3.6 m length.';

    var hem = Math.round(96 + (take / 158) * 390);
    var p = paths(SLEEVES[state.sleeve].drop, hem);
    gBody.setAttribute('d', p[0]); gSleeveL.setAttribute('d', p[1]); gSleeveR.setAttribute('d', p[2]);
    cBody.setAttribute('d', p[0]); cSleeveL.setAttribute('d', p[1]); cSleeveR.setAttribute('d', p[2]);

    var base = COLOURS[state.colour].base;
    gBody.setAttribute('fill', base);
    gSleeveL.setAttribute('fill', base);
    gSleeveR.setAttribute('fill', base);

    pat.setAttribute('fill', 'url(#p' + state.pattern.charAt(0).toUpperCase() + state.pattern.slice(1) + ')');
    /* pattern scale: bigger motifs on a longer garment so the repeat stays in proportion */
    var s = 0.85 + (h - 145) / 90;
    pat.setAttribute('transform', 'translate(50 60) scale(' + s.toFixed(2) + ') translate(-50 -60)');

    document.getElementById('hemLine').setAttribute('d', 'M116 ' + hem + 'h148');
    document.getElementById('preview').setAttribute('viewBox', '0 0 360 ' + (hem + 30));
    document.getElementById('measureLine').setAttribute('d', 'M296 96h26M296 ' + hem + 'h26M309 96v' + (hem - 96));
    mL.setAttribute('y', String(Math.round((96 + hem) / 2)));
    mL.setAttribute('transform', 'rotate(-90 305 ' + Math.round((96 + hem) / 2) + ')');
    mL.textContent = take + ' cm';
    mY.textContent = yuki;
    document.getElementById('previewLabel').textContent = COLOURS[state.colour].name + ', ' +
      PATTERNS[state.pattern] + ', ' + state.sleeve + ' sleeve';
  }

  heightEl.addEventListener('input', function () {
    state.height = parseInt(this.value, 10);
    update();
  });

  planner.querySelectorAll('[data-sleeve]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      planner.querySelectorAll('[data-sleeve]').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
      state.sleeve = btn.getAttribute('data-sleeve');
      update();
    });
  });

  patternEl.addEventListener('change', function () {
    state.pattern = this.value;
    update();
  });

  planner.querySelectorAll('[data-colour]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      planner.querySelectorAll('[data-colour]').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
      state.colour = btn.getAttribute('data-colour');
      update();
    });
  });

  /* ---------- commission form ---------- */
  function initForm() {
    var form = document.getElementById('commissionForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var wrap = input.closest('.f-field');
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && input.type === 'number') bad = Number(v) < 140 || Number(v) > 200;
        wrap.classList.toggle('bad', bad);
        if (bad) { ok = false; wrap.dataset.touched = '1'; }
      });
      var okBox = document.getElementById('okBox');
      var fail = document.getElementById('failBox');
      if (okBox) okBox.classList.toggle('show', ok);
      if (fail) fail.classList.toggle('show', !ok);
      if (ok && okBox) { okBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); form.reset(); }
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var w = el.closest('.f-field');
        if (w) w.classList.remove('bad');
      });
    });
  }

  update();
  initForm();
})();
