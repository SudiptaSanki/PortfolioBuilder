/* ============================================================
   FERRANTE NEUROMORPHIC ENGINEERING — bench behaviour
   No audio anywhere on this site: the need-test fails for
   bench engineering (spikes are counted from traces and
   tables; nothing here teaches through sound), so the site
   is silent by ruling, not by omission. The stub's neural
   spike audio synthesis was removed, not rebuilt. The
   ruling is printed in the footer.
   ============================================================ */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort noisily in Chromium when
   interrupted; the navigation itself always completes. Swallow
   only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile channels panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a.mlink');
  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    /* Focus inside rAF, after the panel is rendered — focusing a
       still-hidden panel is a silent no-op. */
    requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    btn.focus();
  }
  btn.addEventListener('click', open);
  panel.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
})();

/* ---------- reveal on scroll ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- number formatting ---------- */
function fmtInt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function fmtVal(v) {
  var s = v.toFixed(3);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  var parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
function fmtEnergy(j) {
  var units = [[1, 'J'], [1e-3, 'mJ'], [1e-6, 'µJ'], [1e-9, 'nJ'], [1e-12, 'pJ']];
  for (var i = 0; i < units.length; i++) {
    if (j >= units[i][0] || i === units.length - 1) return fmtVal(j / units[i][0]) + ' ' + units[i][1];
  }
}
function fmtPower(w) {
  var units = [[1, 'W'], [1e-3, 'mW'], [1e-6, 'µW'], [1e-9, 'nW']];
  for (var i = 0; i < units.length; i++) {
    if (w >= units[i][0] || i === units.length - 1) return fmtVal(w / units[i][0]) + ' ' + units[i][1];
  }
}

/* ---------- Entry 01 · the spike budget ---------- */
(function () {
  var tool = document.getElementById('budget-tool');
  if (!tool) return;
  var baselineMw = parseFloat(tool.getAttribute('data-baseline-mw')); // 6.2 mW, printed in the intro
  var state = { cls: 'NM-A2', neurons: 20000, rate: 6, dur: 60 };

  function pjFor(cls) {
    var row = document.querySelector('#hw-table tr[data-class="' + cls + '"]');
    return row ? parseFloat(row.getAttribute('data-pj')) : 640;
  }
  function syncTable() {
    document.querySelectorAll('#hw-table tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-class') === state.cls);
    });
  }
  function compute() {
    var pj = pjFor(state.cls);
    var rate = state.neurons * state.rate;              // spikes per second
    var spikes = rate * state.dur;                      // total spikes
    var energyJ = spikes * pj * 1e-12;                  // joules
    var powerW = energyJ / state.dur;                   // average watts
    var baseJ = baselineMw * 1e-3 * state.dur;          // baseline joules
    var ratio = baseJ / energyJ;

    document.getElementById('wRateIn').textContent = fmtInt(state.neurons) + ' × ' + state.rate;
    document.getElementById('wRate').textContent = fmtInt(rate);
    document.getElementById('wSpkIn').textContent = fmtInt(rate) + ' × ' + state.dur;
    document.getElementById('wSpikes').textContent = fmtInt(spikes);
    document.getElementById('wEnIn').textContent = fmtInt(spikes) + ' × ' + fmtInt(pj) + ' pJ';
    document.getElementById('wEnergy').textContent = fmtEnergy(energyJ);
    document.getElementById('wPower').textContent = fmtPower(powerW);
    document.getElementById('wBaseIn').textContent = state.dur + ' s';
    document.getElementById('wBase').textContent = fmtEnergy(baseJ);
    var rTxt = ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2);
    document.getElementById('wRatio').textContent = rTxt + '×';

    var v = document.getElementById('verdict');
    v.classList.remove('warn', 'bad');
    if (ratio >= 1.25) {
      v.innerHTML = '<b>Verdict: the spiking system uses less energy on this workload</b> — because the data is sparse. Raise the firing rate and watch the win shrink. That shrinking is the honest part, and it is why the workload gets defined before the hardware gets chosen.';
    } else if (ratio >= 0.8) {
      v.classList.add('warn');
      v.innerHTML = '<b>Verdict: about the same.</b> At this firing rate the event-driven advantage has been spent — the two systems are inside each other&rsquo;s measurement noise. This is the configuration nobody puts in a brochure, and it is a perfectly good reason to ship the conventional part.';
    } else {
      v.classList.add('bad');
      v.innerHTML = '<b>Verdict: the conventional accelerator wins this one.</b> Dense data is frame-shaped data, and spikes are only cheap when they are rare. A report from this bench would say so, in the first paragraph, and charge the same fee.';
    }
  }

  document.querySelectorAll('.class-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.cls = chip.getAttribute('data-class');
      document.querySelectorAll('.class-chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      syncTable();
      compute();
    });
  });
  document.querySelectorAll('.size-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.neurons = parseInt(chip.getAttribute('data-neurons'), 10);
      document.querySelectorAll('.size-chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      compute();
    });
  });
  function stepper(minusId, plusId, valId, key, step, min, max) {
    var valEl = document.getElementById(valId);
    document.getElementById(minusId).addEventListener('click', function () {
      state[key] = Math.max(min, state[key] - step);
      valEl.textContent = state[key];
      compute();
    });
    document.getElementById(plusId).addEventListener('click', function () {
      state[key] = Math.min(max, state[key] + step);
      valEl.textContent = state[key];
      compute();
    });
  }
  stepper('rateMinus', 'ratePlus', 'rateVal', 'rate', 3, 3, 60);
  stepper('durMinus', 'durPlus', 'durVal', 'dur', 10, 10, 300);
  compute();
})();

/* ---------- Entry 03 · estimator ---------- */
(function () {
  var est = document.getElementById('estimator');
  if (!est) return;
  function money(n) { return '€' + fmtInt(n); }
  function recalc() {
    var total = 0;
    est.querySelectorAll('.est-row').forEach(function (row) {
      var rate = parseFloat(row.getAttribute('data-rate'));
      var line = 0;
      if (row.hasAttribute('data-fixed')) {
        var tog = row.querySelector('.est-toggle');
        line = tog && tog.getAttribute('aria-pressed') === 'true' ? rate : 0;
      } else {
        var count = parseInt(row.querySelector('.est-count').textContent, 10) || 0;
        line = count * rate;
      }
      row.querySelector('.line-total').textContent = money(line);
      total += line;
    });
    document.getElementById('estTotal').textContent = money(total);
  }
  est.querySelectorAll('.est-row').forEach(function (row) {
    if (row.hasAttribute('data-fixed')) {
      var tog = row.querySelector('.est-toggle');
      tog.addEventListener('click', function () {
        var on = tog.getAttribute('aria-pressed') === 'true';
        tog.setAttribute('aria-pressed', on ? 'false' : 'true');
        tog.textContent = on ? 'NOT INCLUDED' : 'INCLUDED';
        recalc();
      });
    } else {
      var countEl = row.querySelector('.est-count');
      row.querySelector('.est-minus').addEventListener('click', function () {
        var v = Math.max(0, (parseInt(countEl.textContent, 10) || 0) - 1);
        countEl.textContent = v;
        recalc();
      });
      row.querySelector('.est-plus').addEventListener('click', function () {
        var v = Math.min(30, (parseInt(countEl.textContent, 10) || 0) + 1);
        countEl.textContent = v;
        recalc();
      });
    }
  });
  recalc();
})();

/* ---------- contact form ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  function mark(id, ok) {
    var f = document.getElementById(id);
    var row = f.closest('.frow');
    if (row) row.classList.toggle('invalid', !ok);
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var org = document.getElementById('fOrg');
    var svc = document.getElementById('fService');
    var msg = document.getElementById('fMsg');
    var ok = true;
    ok = mark('fName', name.value.trim().length >= 2) && ok;
    ok = mark('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = mark('fOrg', org.value.trim().length >= 2) && ok;
    ok = mark('fService', svc.value !== '') && ok;
    ok = mark('fMsg', msg.value.trim().length >= 10) && ok;
    if (!ok) {
      var firstBad = form.querySelector('.frow.invalid input, .frow.invalid select, .frow.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'SC-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('confRef').textContent = ref;
    form.hidden = true;
    var conf = document.getElementById('confirm');
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
  ['fName', 'fEmail', 'fOrg', 'fService', 'fMsg'].forEach(function (id) {
    var f = document.getElementById(id);
    f.addEventListener('input', function () {
      var row = f.closest('.frow');
      if (row) row.classList.remove('invalid');
    });
  });
})();
