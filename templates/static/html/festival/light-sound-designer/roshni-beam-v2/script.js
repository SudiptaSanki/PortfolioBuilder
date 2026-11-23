/* ROSHNI BEAM — the desk logic.
   The Cue & Load tool parses the printed tables on the page (rig schedule,
   cue sheet, power budget, fee schedule) and computes from them — change a
   printed number and the tool's answer changes with it.
   This site is silent: no audio is created anywhere. Nothing flashes:
   cue changes crossfade, and the strobe channel is locked out in the plot. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* CSS view-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself completes. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu: the desk drawer ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var menuPanel = document.getElementById('menu-panel');
  if (menuBtn && menuPanel) {
    function closeMenu() {
      menuPanel.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.hidden;
      if (open) {
        menuPanel.hidden = false;
        menuBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menuPanel.hidden) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  function num(text) {
    return parseInt(String(text).replace(/[^0-9]/g, ''), 10) || 0;
  }
  function fmt(n) {
    return n.toLocaleString('en-IN');
  }

  /* ---------- THE DESK (index) ---------- */
  var rigTable = document.getElementById('rig-table');
  var cueTable = document.getElementById('cue-table');
  if (rigTable && cueTable) {
    var CH_ORDER = [1, 2, 3, 4, 5, 7];
    var CH_META = {
      1: { label: 'WASH', colour: '#ffc44d' },
      2: { label: 'PROFILE', colour: '#8fd0ff' },
      3: { label: 'BEAMS', colour: '#ff6a5e' },
      4: { label: 'BLINDERS', colour: '#fff3d6' },
      5: { label: 'FESTOON', colour: '#ff9440' },
      7: { label: 'BATTENS', colour: '#63e6be' }
    };

    /* rig schedule, parsed from the printed table */
    var rig = {};
    rigTable.querySelectorAll('tbody tr').forEach(function (row) {
      var cells = row.querySelectorAll('td');
      rig[row.getAttribute('data-ch')] = {
        count: num(cells[2].textContent),
        watts: num(cells[3].textContent),
        law: row.getAttribute('data-law')
      };
    });

    /* plot budget, parsed from the printed budget table (last row, kW) */
    var budget = 16000;
    var budgetTable = document.getElementById('budget-table');
    if (budgetTable) {
      var rows = budgetTable.querySelectorAll('tbody tr');
      var last = rows[rows.length - 1];
      budget = Math.round(parseFloat(last.querySelector('td.num').textContent.replace(/[^0-9.]/g, '')) * 1000) || 16000;
    }

    /* cue sheet, parsed from the printed table */
    var cues = [];
    cueTable.querySelectorAll('tbody tr').forEach(function (row) {
      var cells = row.querySelectorAll('td');
      var levels = [];
      row.querySelectorAll('td.lv').forEach(function (td) { levels.push(num(td.textContent)); });
      cues.push({
        row: row,
        q: cells[0].textContent.trim(),
        name: cells[1].textContent.replace('DO NOT RUN', '').trim(),
        fade: row.getAttribute('data-fade'),
        note: row.getAttribute('data-note'),
        levels: levels,
        paper: num(cells[cells.length - 1].textContent),
        dnr: row.classList.contains('dnr')
      });
    });

    function channelLoad(ch, level) {
      var r = rig[ch];
      if (!r || r.law === 'locked') return 0;
      var frac = level / 100;
      if (r.law === 'filament') return Math.round(r.count * r.watts * frac * frac);
      return Math.round(r.count * r.watts * frac);
    }
    function cueTotal(cue) {
      var total = 0;
      CH_ORDER.forEach(function (ch, i) { total += channelLoad(ch, cue.levels[i]); });
      return total;
    }

    var cbCue = document.getElementById('cb-cue');
    var cbLoad = document.getElementById('cb-load');
    var lamp = document.getElementById('status-lamp');
    var statusText = document.getElementById('status-text');
    var roQ = document.getElementById('ro-q');
    var roName = document.getElementById('ro-name');
    var roNote = document.getElementById('ro-note');
    var roWorkings = document.getElementById('ro-workings');
    var roTotal = document.getElementById('ro-total');
    var roPaper = document.getElementById('ro-paper');
    var roVerdict = document.getElementById('ro-verdict');
    var prevBtn = document.getElementById('prev-btn');
    var goBtn = document.getElementById('go-btn');
    var cueBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cue-btn]'));
    var current = 0;

    function setBeam(ch, level) {
      var g = document.getElementById('beam-ch' + ch);
      if (!g) return;
      var v = String(level / 100);
      if (ch === 5 || ch === 7) g.setAttribute('opacity', v);
      else g.setAttribute('fill-opacity', v);
    }

    function renderCue(idx) {
      current = idx;
      var cue = cues[idx];
      var total = cueTotal(cue);
      var over = total > budget;

      cbCue.textContent = cue.q + ' / ' + cues.length;
      cbLoad.textContent = fmt(total) + ' W';
      lamp.classList.toggle('over', over);
      statusText.textContent = over ? 'OVER BUDGET — DO NOT RUN' : 'WITHIN BUDGET';
      statusText.classList.toggle('over', over);

      roQ.textContent = 'CUE ' + cue.q + ' · FADE ' + cue.fade.toUpperCase();
      roName.textContent = cue.name;
      roNote.textContent = cue.note;

      roWorkings.innerHTML = '';
      CH_ORDER.forEach(function (ch, i) {
        var level = cue.levels[i];
        var li = document.createElement('li');
        var left = document.createElement('span');
        left.className = 'wc';
        var sw = document.createElement('span');
        sw.className = 'wch';
        sw.style.background = CH_META[ch].colour;
        left.appendChild(sw);
        var expr = 'CH ' + ch + ' · ' + CH_META[ch].label + ' × ' + level + '%' + (rig[ch].law === 'filament' ? '²' : '');
        left.appendChild(document.createTextNode(expr));
        var right = document.createElement('span');
        right.className = 'wv';
        right.textContent = fmt(channelLoad(ch, level)) + ' W';
        li.appendChild(left);
        li.appendChild(right);
        roWorkings.appendChild(li);
      });

      roTotal.textContent = fmt(total) + ' W';
      roPaper.innerHTML = '';
      roPaper.appendChild(document.createTextNode('Paper total on the cue sheet: '));
      var b = document.createElement('b');
      b.textContent = fmt(cue.paper) + ' W';
      roPaper.appendChild(b);
      roPaper.appendChild(document.createTextNode(total === cue.paper ? ' — the desk agrees.' : ' — the desk and the sheet disagree; trust neither until they match.'));

      roVerdict.classList.toggle('over', over);
      if (over) {
        roVerdict.innerHTML = '<b>Over budget by ' + fmt(total - budget) + ' W — do not run.</b> This cue exists on paper only: the finale as first programmed, kept in the sheet as the caught mistake. The fix is <b>Q5</b> — its story is Case File 02.';
      } else if (cue.dnr === false && idx === 4) {
        roVerdict.innerHTML = '<b>Within budget.</b> Headroom ' + fmt(budget - total) + ' W of the ' + fmt(budget) + ' W plot budget — the finale as plotted, after the fix.';
      } else {
        roVerdict.innerHTML = '<b>Within budget.</b> Headroom ' + fmt(budget - total) + ' W of the ' + fmt(budget) + ' W plot budget.';
      }

      CH_ORDER.forEach(function (ch, i) { setBeam(ch, cue.levels[i]); });

      cues.forEach(function (c, i) { c.row.classList.toggle('active', i === idx); });
      cueBtns.forEach(function (btn, i) { btn.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); });
      prevBtn.disabled = idx === 0;
      goBtn.disabled = idx === cues.length - 1;
    }

    cueBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { renderCue(i); });
    });
    prevBtn.addEventListener('click', function () { if (current > 0) renderCue(current - 1); });
    goBtn.addEventListener('click', function () { if (current < cues.length - 1) renderCue(current + 1); });

    renderCue(0);
  }

  /* ---------- ESTIMATOR (index) ---------- */
  var feeTable = document.getElementById('fee-table');
  if (feeTable) {
    var fees = {};
    var feeLabels = {};
    feeTable.querySelectorAll('tbody tr').forEach(function (row) {
      var key = row.getAttribute('data-key');
      var cells = row.querySelectorAll('td');
      fees[key] = num(cells[cells.length - 1].textContent);
      feeLabels[key] = cells[0].textContent.trim();
    });

    var scope = 'scope-light';
    var prog = 2, show = 2, second = false;
    var estWorkings = document.getElementById('est-workings');
    var estTotal = document.getElementById('est-total');

    function line(label, value) {
      var li = document.createElement('li');
      var l = document.createElement('span');
      l.className = 'wc';
      l.textContent = label;
      var r = document.createElement('span');
      r.className = 'wv';
      r.textContent = '₹' + fmt(value);
      li.appendChild(l);
      li.appendChild(r);
      return li;
    }
    function renderEst() {
      estWorkings.innerHTML = '';
      var total = 0;
      estWorkings.appendChild(line(feeLabels[scope], fees[scope]));
      total += fees[scope];
      estWorkings.appendChild(line('Programming — ' + prog + (prog === 1 ? ' day' : ' days') + ' × ₹' + fmt(fees.prog), prog * fees.prog));
      total += prog * fees.prog;
      estWorkings.appendChild(line('Show days — ' + show + (show === 1 ? ' day' : ' days') + ' × ₹' + fmt(fees.show), show * fees.show));
      total += show * fees.show;
      if (second) {
        estWorkings.appendChild(line(feeLabels.second, fees.second));
        total += fees.second;
      }
      estTotal.textContent = '₹' + fmt(total);
    }

    document.querySelectorAll('#est-scope button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        scope = btn.getAttribute('data-scope');
        document.querySelectorAll('#est-scope button').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        renderEst();
      });
    });
    function stepper(minusId, plusId, valId, get, set) {
      document.getElementById(minusId).addEventListener('click', function () {
        set(Math.max(0, get() - 1));
        document.getElementById(valId).textContent = get();
        renderEst();
      });
      document.getElementById(plusId).addEventListener('click', function () {
        set(Math.min(10, get() + 1));
        document.getElementById(valId).textContent = get();
        renderEst();
      });
    }
    stepper('prog-minus', 'prog-plus', 'prog-val', function () { return prog; }, function (v) { prog = v; });
    stepper('show-minus', 'show-plus', 'show-val', function () { return show; }, function (v) { show = v; });
    var secondToggle = document.getElementById('second-toggle');
    secondToggle.addEventListener('click', function () {
      second = !second;
      secondToggle.setAttribute('aria-pressed', second ? 'true' : 'false');
      renderEst();
    });

    renderEst();
  }

  /* ---------- ENQUIRY FORM (contact) ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var fields = [
      { input: document.getElementById('f-name'), err: document.getElementById('e-name'),
        ok: function (v) { return v.trim().length >= 2; } },
      { input: document.getElementById('f-email'), err: document.getElementById('e-email'),
        ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { input: document.getElementById('f-event'), err: document.getElementById('e-event'),
        ok: function (v) { return v.trim().length >= 3; } },
      { input: document.getElementById('f-msg'), err: document.getElementById('e-msg'),
        ok: function (v) { return v.trim().length >= 10; } }
    ];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        var valid = f.ok(f.input.value);
        f.err.hidden = valid;
        f.input.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid && !firstBad) firstBad = f.input;
      });
      var confirmation = document.getElementById('form-confirmation');
      if (firstBad) {
        confirmation.hidden = true;
        firstBad.focus();
        return;
      }
      var ref = 'RB-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('form-ref').textContent = ref;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
})();
