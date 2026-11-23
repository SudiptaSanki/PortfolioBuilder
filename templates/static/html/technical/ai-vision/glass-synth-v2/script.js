/* ============================================================
   AYDIN EVALUATION — workbook behaviour
   No audio anywhere on this site: the need-test fails for
   evaluation science (agreement is counted from tables; nothing
   here teaches through sound), so the site is silent by ruling,
   not by omission. The stub's hover glass-synth was removed,
   not rebuilt. The ruling is printed in the footer.
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

/* ---------- mobile contents panel ---------- */
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

/* ---------- §01 · the agreement calculator (Cohen's kappa) ----------
   The tool reads the printed marginals from the table's data
   attributes — the same numbers printed in the cells — so the
   page and the tool cannot disagree.
   Marginals: A defect 64 / A no-defect 136; B defect 58 / B
   no-defect 142; N = 200. With a = agreed-defect count:
     DN = 64 − a, ND = 58 − a, NN = 200 − a − DN − ND = 78 + a.
   p_e = (64×58 + 136×142) / 200² = 23,024 / 40,000 = 0.5756.  */
(function () {
  var tool = document.getElementById('kappa-tool');
  if (!tool) return;
  var N = parseInt(tool.getAttribute('data-n'), 10);            // 200
  var aDef = parseInt(tool.getAttribute('data-a-defect'), 10);  // 64
  var bDef = parseInt(tool.getAttribute('data-b-defect'), 10);  // 58
  var aNo = N - aDef;                                           // 136
  var bNo = N - bDef;                                           // 142
  var pe = (aDef * bDef + aNo * bNo) / (N * N);                 // 0.5756
  var state = { a: 33 };

  var bands = [
    { max: 0.00, name: 'No agreement beyond chance', cls: '' },
    { max: 0.20, name: 'Slight', cls: '' },
    { max: 0.40, name: 'Fair', cls: '' },
    { max: 0.60, name: 'Moderate', cls: 'good' },
    { max: 0.80, name: 'Substantial', cls: 'good' },
    { max: 1.00, name: 'Almost perfect', cls: 'good' }
  ];
  function bandFor(k) {
    if (k <= 0) return bands[0];
    for (var i = 1; i < bands.length; i++) if (k <= bands[i].max) return bands[i];
    return bands[bands.length - 1];
  }
  function f3(x) { return x.toFixed(3); }
  function f4(x) { return x.toFixed(4); }
  function f2(x) { return x.toFixed(2); }

  function compute() {
    var a = state.a;
    var dn = aDef - a;
    var nd = bDef - a;
    var nn = N - a - dn - nd;
    var agree = a + nn;
    var po = agree / N;
    var k = (po - pe) / (1 - pe);
    var band = bandFor(k);

    document.getElementById('cellDD').firstChild.textContent = a;
    document.getElementById('cellDN').firstChild.textContent = dn;
    document.getElementById('cellND').firstChild.textContent = nd;
    document.getElementById('cellNN').firstChild.textContent = nn;
    document.getElementById('aVal').textContent = a;

    document.getElementById('wAgreeIn').textContent = a + ' + ' + nn;
    document.getElementById('wAgree').textContent = agree;
    document.getElementById('wPo').textContent = f3(po);
    document.getElementById('wPeTerms').textContent =
      '(' + aDef + ' × ' + bDef + ' + ' + aNo + ' × ' + bNo + ') ÷ ' + fmtInt(N * N);
    document.getElementById('wPe').textContent = fmtInt(aDef * bDef + aNo * bNo) + ' ÷ ' + fmtInt(N * N) + ' = ' + f4(pe);
    document.getElementById('wKIn').textContent = '(' + f3(po) + ' − ' + f4(pe) + ') ÷ (1 − ' + f4(pe) + ')';
    document.getElementById('wKNum').textContent = f4(po - pe) + ' ÷ ' + f4(1 - pe);
    document.getElementById('wK').textContent = f2(k);

    document.getElementById('kVal').textContent = f2(k);
    document.getElementById('kBand').textContent = 'BAND: ' + band.name.toUpperCase();
    document.getElementById('kMarker').style.left = (Math.max(0, Math.min(1, k)) * 100).toFixed(1) + '%';

    var v = document.getElementById('kVerdict');
    v.classList.toggle('good', band.cls === 'good');
    if (k <= 0.20) {
      v.innerHTML = '<b>Verdict: the labels cannot carry a model.</b> Raw agreement can look respectable while κ sits here — the classes are doing the agreeing, not the annotators. Nobody gets blamed at this number; the guideline gets read first.';
    } else if (k <= 0.40) {
      v.innerHTML = '<b>Verdict: fair — and this is where Study EV-02 started.</b> Two trained annotators, one task, κ 0.34. The disagreement map showed two class definitions overlapping; the guideline was rewritten, and the same annotators re-measured at 0.79. Step the count up to 52 and watch the same table tell that story.';
    } else if (k <= 0.60) {
      v.innerHTML = '<b>Verdict: moderate.</b> Usable for triage and for training a first model whose errors you will audit — not yet a ground truth you would certify a product against. The remaining disagreements deserve names before they get averaged away.';
    } else if (k <= 0.80) {
      v.innerHTML = '<b>Verdict: substantial.</b> This is the rewritten-guideline round of Study EV-02. Labels at this level can carry an evaluation: disagreements are now specific enough to adjudicate case by case, and the adjudications get printed with the dataset.';
    } else {
      v.innerHTML = '<b>Verdict: almost perfect — check the task, not just the annotators.</b> Agreement this high on a genuinely hard task is rare; on an easy one it is expected and proves little. κ rewards clear classes as much as careful people.';
    }
  }

  document.querySelectorAll('.round-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.a = parseInt(chip.getAttribute('data-a'), 10);
      document.querySelectorAll('.round-chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      compute();
    });
  });
  document.getElementById('aMinus').addEventListener('click', function () {
    state.a = Math.max(0, state.a - 1);
    document.querySelectorAll('.round-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    compute();
  });
  document.getElementById('aPlus').addEventListener('click', function () {
    state.a = Math.min(bDef, state.a + 1);
    document.querySelectorAll('.round-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    compute();
  });
  compute();
})();

/* ---------- §03 · estimator ---------- */
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

/* ---------- contact form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  function mark(id, ok) {
    var f = document.getElementById(id);
    var row = f.closest('.frow');
    if (row) row.classList.toggle('invalid', !ok);
    f.setAttribute('aria-invalid', ok ? 'false' : 'true');
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
    var ref = 'EV-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('confRef').textContent = ref;
    document.getElementById('confEcho').textContent =
      name.value.trim() + ' · ' + org.value.trim() + ' · ' + svc.value;
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
      f.removeAttribute('aria-invalid');
    });
  });
})();
