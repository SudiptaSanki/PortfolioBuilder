/* FPV VELOCITY — fpv-velocity
   Shared script: lap-sheet menu, reveals, the Pack Budget Tool,
   the day estimator, and the booking form.
   Sound ruling: NONE. No AudioContext exists in this file — lap times
   are read off a sheet, not heard. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled rejection; the navigation
     itself always completes, so swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- lap-sheet menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('sheetPanel');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('sheetClose');
  if (btn && panel && scrim) {
    var openMenu = function () {
      panel.classList.add('open');
      scrim.classList.add('on');
      btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () {
        var first = panel.querySelector('a.lap');
        if (first) first.focus();
      });
    };
    var closeMenu = function () {
      panel.classList.remove('open');
      scrim.classList.remove('on');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    };
    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- helpers ---------- */
  function fmtMS(sec) {
    var m = Math.floor(sec / 60), s = Math.round(sec - m * 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function eur(n) { return '€' + n.toLocaleString('en-GB'); }

  /* ---------- Pack Budget Tool ---------- */
  var tool = document.getElementById('packTool');
  if (tool) {
    var packs = {}, quads = {};
    document.querySelectorAll('#packTable tbody tr').forEach(function (tr) {
      packs[tr.getAttribute('data-key')] = {
        ah: parseFloat(tr.getAttribute('data-ah')),
        name: tr.cells[0].textContent.trim()
      };
    });
    document.querySelectorAll('#quadTable tbody tr').forEach(function (tr) {
      quads[tr.getAttribute('data-key')] = {
        draw: parseFloat(tr.getAttribute('data-draw')),
        session: parseFloat(tr.getAttribute('data-session')),
        unit: tr.getAttribute('data-unit'),
        name: tr.cells[0].textContent.trim(),
        format: tr.cells[2].textContent.trim(),
        sessionText: tr.cells[3].textContent.trim()
      };
    });
    var state = { pack: 'p1', quad: 'q1', rotation: 6 };
    var roTime = document.getElementById('roTime');
    var roSessK = document.getElementById('roSessK');
    var roSess = document.getElementById('roSess');
    var roSessD = document.getElementById('roSessD');
    var roDay = document.getElementById('roDay');
    var roDayD = document.getElementById('roDayD');
    var rotVal = document.getElementById('rotVal');
    var workings = document.getElementById('workings');

    function syncRows(tableId, key) {
      document.querySelectorAll('#' + tableId + ' tbody tr').forEach(function (tr) {
        tr.classList.toggle('sel', tr.getAttribute('data-key') === key);
      });
    }
    function compute() {
      var p = packs[state.pack], q = quads[state.quad];
      var usable = p.ah * 0.80;
      var seconds = usable / q.draw * 3600;
      var count, sessLabel, sessDesc, sessLine;
      if (q.unit === 'flight') {
        count = 1;
        sessLabel = 'Flights per pack';
        sessDesc = 'Freestyle is flown as one continuous flight — the pack is the flight.';
        sessLine = 'Session = one continuous flight -> <b>1 flight per pack</b>';
      } else {
        count = Math.floor(seconds / q.session);
        sessLabel = (q.unit === 'heat' ? 'Heats' : 'Takes') + ' per pack';
        sessDesc = 'Full ' + fmtMS(q.session) + ' ' + (q.unit === 'heat' ? 'league heats' : 'film takes') + ' this pack finishes.';
        sessLine = 'Session ' + fmtMS(q.session) + ' (' + q.session + ' s) -> full ' + q.unit + 's = floor(' +
          seconds.toFixed(1) + ' / ' + q.session + ') = <b>' + count + '</b>';
      }
      var total = count * state.rotation;
      var unitWord = q.unit + (total === 1 ? '' : 's');
      roTime.textContent = fmtMS(seconds);
      roSessK.textContent = sessLabel;
      roSess.textContent = count;
      roSessD.textContent = sessDesc;
      roDay.textContent = total + ' ' + unitWord;
      if (q.unit === 'heat') {
        roDayD.textContent = state.rotation + ' packs × ' + count + ' heat' + (count === 1 ? '' : 's') +
          (total >= 6 ? ' — a 6-heat league day, covered.' : ' — short of a 6-heat league day by ' + (6 - total) + '. Add packs, not hope.');
      } else {
        roDayD.textContent = state.rotation + ' packs × ' + count + ' ' + q.unit + ' — the day’s rotation, charged and numbered.';
      }
      rotVal.textContent = state.rotation;
      workings.innerHTML =
        'Pack <b>' + p.name + '</b> — nominal ' + p.ah.toFixed(2) + ' Ah (Table P1)\n' +
        'Landing reserve 20% -> usable = ' + p.ah.toFixed(2) + ' x 0.80 = <b>' + usable.toFixed(2) + ' Ah</b>\n' +
        'Quad <b>' + q.name + '</b> — average draw ' + q.draw + ' A (Table Q1)\n' +
        'Usable time = ' + usable.toFixed(2) + ' / ' + q.draw + ' x 3600 = ' + seconds.toFixed(1) + ' s -> <b>' + fmtMS(seconds) + '</b>\n' +
        sessLine + '\n' +
        'Rotation ' + state.rotation + ' packs x ' + count + ' = <b>' + total + ' ' + unitWord + '</b> per day';
      syncRows('packTable', state.pack);
      syncRows('quadTable', state.quad);
    }
    tool.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.getAttribute('data-group');
        state[group] = chip.getAttribute('data-key');
        tool.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        compute();
      });
    });
    document.getElementById('rotMinus').addEventListener('click', function () {
      state.rotation = Math.max(2, state.rotation - 1); compute();
    });
    document.getElementById('rotPlus').addEventListener('click', function () {
      state.rotation = Math.min(12, state.rotation + 1); compute();
    });
    compute();
  }

  /* ---------- Day estimator ---------- */
  var est = document.getElementById('estimator');
  if (est) {
    var rates = { coach: 450, film: 850, travel: 200 };
    var labels = { coach: 'coaching', film: 'film', travel: 'travel' };
    var counts = { coach: 2, film: 1, travel: 1 };
    var estWork = document.getElementById('estWorkings');
    function dayWord(n) { return n === 1 ? 'day' : 'days'; }
    function estCompute() {
      var total = 0, lines = [];
      ['coach', 'film', 'travel'].forEach(function (k) {
        var amt = counts[k] * rates[k];
        total += amt;
        document.getElementById('est' + k.charAt(0).toUpperCase() + k.slice(1) + 'Val').textContent = counts[k];
        document.getElementById('est' + k.charAt(0).toUpperCase() + k.slice(1) + 'Amt').textContent = eur(amt);
        lines.push(counts[k] + ' ' + labels[k] + ' ' + dayWord(counts[k]) + ' x ' + eur(rates[k]) + ' = <b>' + eur(amt) + '</b>');
      });
      document.getElementById('estTotal').textContent = eur(total);
      estWork.innerHTML = lines.join('\n') + '\nPlanning total = <b>' + eur(total) + '</b> (before travel expenses at cost)';
    }
    est.querySelectorAll('button[data-est]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-est');
        counts[k] = Math.max(0, Math.min(30, counts[k] + parseInt(b.getAttribute('data-dir'), 10)));
        estCompute();
      });
    });
    estCompute();
  }

  /* ---------- Booking form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    function setInvalid(id, bad) {
      var f = document.getElementById(id).closest('.field');
      if (f) f.classList.toggle('invalid', bad);
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var type = document.getElementById('fType');
      var msg = document.getElementById('fMsg').value.trim();
      var ok = true;
      ok = setInvalid('fName', name.length < 2) && ok;
      ok = setInvalid('fEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) && ok;
      ok = setInvalid('fType', !type.value) && ok;
      ok = setInvalid('fMsg', msg.length < 10) && ok;
      if (!ok) return;
      var ref = 'FV-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmEcho').textContent =
        'Booked in for ' + name + ' — ' + type.options[type.selectedIndex].text +
        '. A reply goes to ' + email + ' within two working days.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    ['fName', 'fEmail', 'fType', 'fMsg'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { setInvalid(id, false); });
    });
  }
})();
