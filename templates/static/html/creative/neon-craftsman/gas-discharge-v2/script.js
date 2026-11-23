/* Havel Tube Works — bench script.
   Sound: none. The predecessor template buzzed on hover; that code is deleted
   and nothing in this file creates an AudioContext.
   The planner and estimator read their numbers from the printed tables in
   index.html (data attributes on the table rows), so the tools cannot
   disagree with the page. */
(function () {
  'use strict';

  /* View-transition abort guard: Chrome surfaces an aborted cross-document
     view transition as an unhandled rejection; swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return '£' + Math.round(n).toLocaleString('en-GB'); };
  var f1 = function (n) { return (Math.round(n * 10) / 10).toFixed(1); };

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('menuBtn'), menuPanel = $('menuPanel');
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.hidden;
      menuPanel.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
  }

  /* ---------- Hero pattern: bend points ---------- */
  var BENDS = {
    1: ['Bend 1 of 9 — the L loop · return bend, ≈180° · ribbon burner',
        'Bent hot and slow. Rush a return bend and the glass checks as it cools — you find out at burn-in, in front of everyone.'],
    2: ['Bend 2 of 9 — L downstroke · the stem · hand torch',
        'Set plumb against the pattern line and left alone. The whole word hangs off this stroke; a leaning L makes every later letter look drunk.'],
    3: ['Bend 3 of 9 — cross-over into u · tube over tube · hand torch',
        'The tube crosses its own path. Bent cool-headed and checked twice — a cross-over rubbed thin fails at the fill, not at the flame.'],
    4: ['Bend 4 of 9 — the u bowl · one continuous curve · ribbon burner',
        'No stops, no reheats. The bowl is where beginners flatten the tube; the radius drawn on the pattern is the law.'],
    5: ['Bend 5 of 9 — S-bend into m · two curves inside 60 mm · hand torch',
        'Opposite curves in one short run of glass — the signature of hand work, and counted honestly in Table B1 like every other bend.'],
    6: ['Bend 6 of 9 — m, first arch · to the centre line · ribbon burner',
        'Bent to the pattern\u2019s centre line so the second arch can match it. Mismatched arches are how you spot rushed work across a street.'],
    7: ['Bend 7 of 9 — m, second arch & drop · ribbon burner',
        'The drop after the arch sets the word\u2019s rhythm. Too long and the eye trips over it; the pattern\u2019s measure is the measure.'],
    8: ['Bend 8 of 9 — cross-over into e · tube over tube · hand torch',
        'The second cross-over, with the tube already heated seven times. By here the bender is reading the glass, not the clock.'],
    9: ['Bend 9 of 9 — the e eye · tightest curve in the word · hand torch',
        'The smallest radius in the word. This bend is why Table B2 exists: below the minimum height the eye closes, and the letter dies politely.']
  };
  var bendKey = $('bendKey'), bendNote = $('bendNote');
  var bendPts = Array.prototype.slice.call(document.querySelectorAll('.bendpt'));
  function selectBend(g) {
    bendPts.forEach(function (p) { p.classList.remove('sel'); });
    g.classList.add('sel');
    var d = BENDS[g.getAttribute('data-bend')];
    if (d && bendKey && bendNote) { bendKey.textContent = d[0]; bendNote.textContent = d[1]; }
  }
  bendPts.forEach(function (g) {
    g.addEventListener('click', function () { selectBend(g); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBend(g); }
    });
  });

  /* ---------- Shared stepper / segmented wiring ----------
     Stepper markup: a .val span in the label row (id *Val) mirrors the number;
     the .sv element inside the stepper (id *Show) shows the formatted value. */
  function stepper(minusId, plusId, showId, valId, opts) {
    var minus = $(minusId), plus = $(plusId), show = $(showId), val = $(valId);
    if (!minus || !plus || !show) return null;
    var state = { v: opts.def };
    function render() {
      show.textContent = opts.fmt(state.v);
      if (val) val.textContent = opts.valFmt ? opts.valFmt(state.v) : state.v;
      opts.onChange(state.v);
    }
    minus.addEventListener('click', function () {
      state.v = Math.max(opts.min, Math.round((state.v - opts.step) * 100) / 100); render();
    });
    plus.addEventListener('click', function () {
      state.v = Math.min(opts.max, Math.round((state.v + opts.step) * 100) / 100); render();
    });
    render();
    return state;
  }
  function segmented(id, def, onChange) {
    var box = $(id);
    if (!box) return null;
    var state = { v: def };
    var btns = Array.prototype.slice.call(box.querySelectorAll('button[data-class]'));
    function render() {
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-class') === state.v));
      });
      onChange(state.v);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { state.v = b.getAttribute('data-class'); render(); });
    });
    render();
    return state;
  }

  /* ---------- Pattern & Bend Planner (index only) ---------- */
  var tB1 = $('tableB1'), tB2 = $('tableB2');
  if (tB1 && tB2 && $('planWorkings')) {
    var B1 = {}, B2 = {}, CLASSNAME = {};
    Array.prototype.forEach.call(tB1.querySelectorAll('tbody tr'), function (tr) {
      var c = tr.getAttribute('data-class');
      B1[c] = { bends: parseFloat(tr.getAttribute('data-bends')), metres: parseFloat(tr.getAttribute('data-tube')) };
      CLASSNAME[c] = tr.querySelector('td').textContent.trim();
    });
    Array.prototype.forEach.call(tB2.querySelectorAll('tbody tr'), function (tr) {
      var d = tr.getAttribute('data-dia'); B2[d] = {};
      ['block', 'serif', 'script'].forEach(function (c) {
        var cell = tr.querySelector('[data-min-' + c + ']');
        if (cell) B2[d][c] = parseFloat(cell.getAttribute('data-min-' + c));
      });
    });

    var plan = { letters: 8, cls: 'block', tube: '10', height: 300 };
    function planCalc() {
      var b = B1[plan.cls];
      var bends = plan.letters * b.bends;
      var tubeRef = plan.letters * b.metres;
      var tube = tubeRef * plan.height / 300;
      var bendH = bends * 6 / 60;
      var tubeH = tube * 0.4;
      var hours = bendH + tubeH;
      var min = B2[plan.tube][plan.cls];
      var ok = plan.height >= min;

      $('planWorkings').innerHTML =
        '<li>Bends — ' + plan.letters + ' letters × ' + b.bends + ' bends (Table B1, ' + CLASSNAME[plan.cls] + ') = <strong>' + bends + ' bends</strong></li>' +
        '<li>Tube — ' + plan.letters + ' × ' + f1(b.metres) + ' m at the 300 mm reference = ' + f1(tubeRef) + ' m; scaled to ' + plan.height + ' mm (× ' + plan.height + '/300) = <strong>' + f1(tube) + ' m</strong></li>' +
        '<li>Bench time — ' + bends + ' bends × 6 min = ' + f1(bendH) + ' h; ' + f1(tube) + ' m × 0.4 h/m = ' + f1(tubeH) + ' h; total <strong>' + f1(hours) + ' h</strong></li>' +
        '<li>Legibility — Table B2 minimum for ' + CLASSNAME[plan.cls] + ' on ' + plan.tube + ' mm tube is <strong>' + min + ' mm</strong>; your height is ' + plan.height + ' mm.</li>';
      $('tBends').textContent = bends;
      $('tTube').textContent = f1(tube) + ' m';
      $('tHours').textContent = f1(hours) + ' h';

      var v = $('planVerdict');
      if (ok) {
        v.className = 'verdict okv';
        v.innerHTML = '<strong>Bendable</strong> — ' + plan.height + ' mm is at or above the ' + min + ' mm minimum for ' + CLASSNAME[plan.cls] + ' on ' + plan.tube + ' mm tube (Table B2). The bench would pattern this word as drawn.';
      } else {
        v.className = 'verdict refused';
        v.innerHTML = '<strong>Refused as drawn</strong> — at ' + plan.height + ' mm this word in ' + CLASSNAME[plan.cls] + ' cannot be bent legibly: Table B2 sets the minimum at ' + min + ' mm for ' + plan.tube + ' mm tube. Go bigger, drop to a finer tube, or simplify the lettering — the bench will redraw it with you.';
      }
    }
    stepper('lettersMinus', 'lettersPlus', 'lettersShow', 'lettersVal', {
      min: 1, max: 30, step: 1, def: 8,
      fmt: function (v) { return String(v); },
      onChange: function (v) { plan.letters = v; planCalc(); }
    });
    segmented('classSeg', 'block', function (v) { plan.cls = v; planCalc(); });
    var tubeSel = $('tubeSel');
    if (tubeSel) tubeSel.addEventListener('change', function () { plan.tube = tubeSel.value; planCalc(); });
    stepper('heightMinus', 'heightPlus', 'heightShow', 'heightVal', {
      min: 75, max: 500, step: 25, def: 300,
      fmt: function (v) { return v + ' mm'; },
      onChange: function (v) { plan.height = v; planCalc(); }
    });
    planCalc();
  }

  /* ---------- Bench estimator (index only) ---------- */
  var tF1 = $('tableF1');
  if (tF1 && $('estWorkings')) {
    var RATES = {};
    Array.prototype.forEach.call(tF1.querySelectorAll('tbody tr'), function (tr) {
      if (tr.getAttribute('data-line')) RATES[tr.getAttribute('data-line')] = parseFloat(tr.getAttribute('data-rate'));
    });
    var MOUNTLINE = { rail: 'mount-rail', acrylic: 'mount-acrylic', hanging: 'mount-hanging' };
    var MOUNTNAME = { rail: 'Mounting — rail', acrylic: 'Mounting — acrylic backing panel', hanging: 'Mounting — hanging kit' };
    var est = { metres: 12, units: 1, trans: 2, mount: 'rail', days: 1, cls: 'block' };
    function estCalc() {
      var tubeLine = est.metres * RATES.tube;
      var elec = est.units * RATES.electrodes;
      var trans = est.trans * RATES.transformer;
      var mount = RATES[MOUNTLINE[est.mount]];
      var install = est.days * RATES.install;
      var complex = (est.cls === 'script');
      var allowance = complex ? Math.round(RATES.allowance / 100 * tubeLine) : 0;
      var lines = [
        'Tube, gas &amp; bending — ' + f1(est.metres) + ' m × ' + money(RATES.tube) + ' = <strong>' + money(tubeLine) + '</strong>',
        'Electrodes &amp; lead-outs — ' + est.units + ' unit' + (est.units === 1 ? '' : 's') + ' × ' + money(RATES.electrodes) + ' = <strong>' + money(elec) + '</strong>',
        'Transformers — ' + est.trans + ' × ' + money(RATES.transformer) + ' = <strong>' + money(trans) + '</strong>',
        MOUNTNAME[est.mount] + ' — flat = <strong>' + money(mount) + '</strong>',
        'Installation — ' + est.days + ' day' + (est.days === 1 ? '' : 's') + ' × ' + money(RATES.install) + ' = <strong>' + money(install) + '</strong>'
      ];
      if (complex) lines.push('Breakage allowance — ' + RATES.allowance + '% of the tube line, script work (Table F1) = <strong>' + money(allowance) + '</strong>');
      $('estWorkings').innerHTML = lines.map(function (l) { return '<li>' + l + '</li>'; }).join('');
      $('eTube').textContent = money(tubeLine + allowance);
      $('eOther').textContent = money(elec + trans + mount + install);
      $('eTotal').textContent = money(tubeLine + allowance + elec + trans + mount + install);
    }
    stepper('metresMinus', 'metresPlus', 'metresShow', 'metresVal', {
      min: 1, max: 60, step: 0.5, def: 12,
      fmt: function (v) { return (v % 1 ? f1(v) : String(v)) + ' m'; },
      valFmt: function (v) { return v % 1 ? f1(v) : String(v); },
      onChange: function (v) { est.metres = v; estCalc(); }
    });
    stepper('unitsMinus', 'unitsPlus', 'unitsShow', 'unitsVal', {
      min: 1, max: 12, step: 1, def: 1,
      fmt: function (v) { return String(v); },
      onChange: function (v) { est.units = v; estCalc(); }
    });
    stepper('transMinus', 'transPlus', 'transShow', 'transVal', {
      min: 0, max: 8, step: 1, def: 2,
      fmt: function (v) { return String(v); },
      onChange: function (v) { est.trans = v; estCalc(); }
    });
    var mountSel = $('mountSel');
    if (mountSel) mountSel.addEventListener('change', function () { est.mount = mountSel.value; estCalc(); });
    stepper('daysMinus', 'daysPlus', 'daysShow', 'daysVal', {
      min: 0, max: 10, step: 1, def: 1,
      fmt: function (v) { return String(v); },
      onChange: function (v) { est.days = v; estCalc(); }
    });
    segmented('estClassSeg', 'block', function (v) { est.cls = v; estCalc(); });
    estCalc();
  }

  /* ---------- Enquiry form (contact only) ---------- */
  var form = $('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var word = $('fWord').value.trim();
      var okName = name.length > 0;
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      var okWord = word.length > 0;
      $('eName').hidden = okName;
      $('eEmail').hidden = okEmail;
      $('eWord').hidden = okWord;
      if (!(okName && okEmail && okWord)) {
        var firstBad = !okName ? $('fName') : (!okEmail ? $('fEmail') : $('fWord'));
        firstBad.focus();
        return;
      }
      $('confRef').textContent = 'HTW-2026-' + (1000 + Math.floor(Math.random() * 9000));
      $('confWord').textContent = '\u201C' + word + '\u201D';
      $('confirmBox').hidden = false;
      $('confirmBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    ['fName', 'fEmail', 'fWord'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        var err = { fName: 'eName', fEmail: 'eEmail', fWord: 'eWord' }[id];
        if (err) $(err).hidden = true;
      });
    });
  }
})();
