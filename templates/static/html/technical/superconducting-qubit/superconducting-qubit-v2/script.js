/* ============================================================
   KORHONEN QUANTUM HARDWARE — log behaviour
   No audio anywhere on this site: the need-test fails for
   cryogenic hardware (the work is read from logs, thermometry
   and measured distributions; nothing here teaches through
   sound), so the site is silent by ruling, not by omission.
   The ruling is printed in the footer.
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

/* ---------- mobile cooldown panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  var closeBtn = document.getElementById('menuClose');
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
  if (closeBtn) closeBtn.addEventListener('click', close);
  panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
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
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function fmtEUR(n) { return '€' + fmtInt(n); }
var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function fmtSci(v, sig) {
  /* 0.0998 stays decimal; 5.59e-7 becomes 5.59 × 10⁻⁷ */
  if (v !== 0 && (Math.abs(v) >= 0.001 && Math.abs(v) < 10000)) {
    return String(parseFloat(v.toPrecision(sig || 4)));
  }
  var parts = v.toExponential(sig ? sig - 1 : 2).split('e');
  var exp = parts[1].replace('-', '').split('').map(function (c) { return SUP[c] || c; }).join('');
  return parts[0] + ' × 10' + (parts[1].charAt(0) === '-' ? SUP['-'] : '') + exp;
}
function fmtE(v) { return v.toExponential(3); }

/* ============================================================
   INSTRUMENT 01, PART 1 — thermal occupation.
   Reads h and kB from the constants panel exactly as printed
   (data attributes on the very element the visitor reads), and
   stage temperatures from the chips, so tool and page cannot
   quietly disagree.
   n̄ = 1 / (exp(hf / kB·T) − 1)
   ============================================================ */
(function () {
  var panel = document.getElementById('consts');
  if (!panel) return;
  var H = parseFloat(panel.getAttribute('data-h'));
  var KB = parseFloat(panel.getAttribute('data-kb'));
  var freq = 5.00;                       /* GHz, printed range 4.00–6.00 */
  var stageMk = 100;                     /* cold plate default */
  var stageName = 'the cold plate';
  var freqVal = document.getElementById('freqVal');
  var roHF = document.getElementById('roHF');
  var roX = document.getElementById('roX');
  var roN = document.getElementById('roN');
  var verdict = document.getElementById('thVerdict');
  var work = document.getElementById('thWork');

  function render() {
    freqVal.textContent = freq.toFixed(2) + ' GHz';
    var hf = H * freq * 1e9;             /* J */
    var hfK = hf / KB;                   /* K */
    var hfMk = hfK * 1000;               /* mK */
    var x = hfMk / stageMk;
    var ex = Math.exp(x);
    var nbar = 1 / (ex - 1);
    roHF.innerHTML = hfMk.toFixed(2) + ' <small>mK</small>';
    roX.textContent = x >= 100 ? x.toFixed(1) : x >= 10 ? x.toFixed(2) : x.toFixed(3);
    roN.textContent = fmtSci(nbar, 4);
    var cls = '', html = '';
    if (nbar >= 1) {
      cls = 'warm';
      html = '<b>Thermally occupied.</b> At ' + stageName + ', the bath holds more than one thermal photon per mode at ' +
        freq.toFixed(2) + ' GHz. A qubit kept here is a thermometer, not a computer.';
    } else if (nbar >= 0.01) {
      html = '<b>Marginal.</b> At ' + stageName + ', about one mode in ' + Math.round(1 / nbar) +
        ' holds a thermal photon at ' + freq.toFixed(2) + ' GHz — quiet enough for wiring, too loud for an honest qubit measurement. Keep cooling.';
    } else {
      html = '<b>Thermally quiet.</b> At ' + stageName + ', n̄ sits below one photon per hundred modes at ' +
        freq.toFixed(2) + ' GHz. This is why the device lives at the bottom of the ladder, and why every stage above it exists.';
    }
    verdict.className = 'verdict' + (cls ? ' ' + cls : '');
    verdict.innerHTML = html;
    work.innerHTML =
      'hf = h × f = ' + fmtE(H) + ' × ' + fmtE(freq * 1e9) + ' = <b>' + fmtE(hf) + ' J</b><br>' +
      'hf/k<sub>B</sub> = ' + fmtE(hf) + ' / ' + fmtE(KB) + ' = <b>' + hfMk.toFixed(2) + ' mK</b><br>' +
      'x = hf/k<sub>B</sub>T = ' + hfMk.toFixed(2) + ' / ' + fmtInt(stageMk) + ' = <b>' + (x >= 10 ? x.toFixed(2) : x.toFixed(3)) + '</b><br>' +
      'e<sup>x</sup> = <b>' + (ex >= 1000 ? fmtE(ex) : ex.toFixed(2)) + '</b><br>' +
      'n̄ = 1 / (e<sup>x</sup> − 1) = <b>' + fmtSci(nbar, 4) + '</b>';
  }
  document.getElementById('freqDown').addEventListener('click', function () {
    if (freq > 4.00) { freq = Math.round((freq - 0.25) * 100) / 100; render(); }
  });
  document.getElementById('freqUp').addEventListener('click', function () {
    if (freq < 6.00) { freq = Math.round((freq + 0.25) * 100) / 100; render(); }
  });
  var chips = document.querySelectorAll('#stageChips .chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      stageMk = parseFloat(chip.getAttribute('data-mk'));
      stageName = chip.getAttribute('data-sname');
      render();
    });
  });
  render();
})();

/* ============================================================
   INSTRUMENT 01, PART 2 — the gate-error rule of thumb.
   ε ≈ t_gate / T₁. Device T₁ values are read from Table D's
   rows exactly as printed, so the tool and the table cannot
   quietly disagree. A rule of thumb, labelled as one in the
   page copy beside the tool.
   ============================================================ */
(function () {
  var table = document.getElementById('devTable');
  if (!table) return;
  var gate = 25;                          /* ns, printed range 10–60 */
  var t1 = 212, devName = 'K-07 “Aava”';  /* µs, Table D default row */
  var gateVal = document.getElementById('gateVal');
  var gateDev = document.getElementById('gateDev');
  var roEps = document.getElementById('roEps');
  var roEpsPct = document.getElementById('roEpsPct');
  var roPer = document.getElementById('roPer');
  var work = document.getElementById('gateWork');

  function render() {
    gateVal.textContent = gate + ' ns';
    gateDev.textContent = devName + ' — T₁ median ' + t1 + ' µs';
    var eps = gate / (t1 * 1000);         /* both in ns */
    roEps.textContent = fmtSci(eps, 3);
    roEpsPct.innerHTML = (eps * 100).toFixed(4) + ' <small>%</small>';
    roPer.textContent = fmtInt(1 / eps);
    work.innerHTML =
      'ε ≈ t<sub>gate</sub> / T₁ = ' + gate + ' ns / ' + fmtInt(t1 * 1000) + ' ns = <b>' + fmtE(eps) + '</b><br>' +
      '= <b>' + (eps * 100).toFixed(4) + ' %</b> of the gate budget, from relaxation alone';
  }
  document.getElementById('gateDown').addEventListener('click', function () {
    if (gate > 10) { gate -= 5; render(); }
  });
  document.getElementById('gateUp').addEventListener('click', function () {
    if (gate < 60) { gate += 5; render(); }
  });
  var rows = table.querySelectorAll('tbody tr');
  rows.forEach(function (row) {
    var pick = function () {
      rows.forEach(function (r) { r.setAttribute('aria-selected', 'false'); });
      row.setAttribute('aria-selected', 'true');
      t1 = parseFloat(row.getAttribute('data-t1'));
      devName = row.getAttribute('data-name');
      render();
    };
    var btn = row.querySelector('.devpick');
    if (btn) btn.addEventListener('click', pick);
    row.addEventListener('click', function (e) { if (e.target !== btn) pick(); });
  });
  render();
})();

/* ============================================================
   INSTRUMENT 02 — engagement estimator.
   Rates are the ones printed in the fee table above it.
   ============================================================ */
(function () {
  var total = document.getElementById('estTotal');
  if (!total) return;
  var work = document.getElementById('estWork');
  var state = { eng: 6, fridge: 4, loom: 1, review: false };
  var RATE = { eng: 1600, fridge: 1150, loom: 2300, review: 4800 };

  function bindStepper(downId, upId, valId, key, min, max, fmt) {
    var val = document.getElementById(valId);
    document.getElementById(downId).addEventListener('click', function () {
      if (state[key] > min) { state[key]--; val.textContent = fmt(state[key]); render(); }
    });
    document.getElementById(upId).addEventListener('click', function () {
      if (state[key] < max) { state[key]++; val.textContent = fmt(state[key]); render(); }
    });
  }
  function days(n) { return n + (n === 1 ? ' day' : ' days'); }

  function render() {
    var lEng = state.eng * RATE.eng, lFr = state.fridge * RATE.fridge,
        lLoom = state.loom * RATE.loom, lRev = state.review ? RATE.review : 0;
    document.getElementById('estEngLine').textContent = fmtEUR(lEng);
    document.getElementById('estFridgeLine').textContent = fmtEUR(lFr);
    document.getElementById('estLoomLine').textContent = fmtEUR(lLoom);
    document.getElementById('estReviewLine').textContent = fmtEUR(lRev);
    var sum = lEng + lFr + lLoom + lRev;
    total.textContent = fmtEUR(sum);
    work.innerHTML =
      state.eng + ' × ' + fmtEUR(RATE.eng) + ' = <b>' + fmtEUR(lEng) + '</b> · ' +
      state.fridge + ' × ' + fmtEUR(RATE.fridge) + ' = <b>' + fmtEUR(lFr) + '</b> · ' +
      state.loom + ' × ' + fmtEUR(RATE.loom) + ' = <b>' + fmtEUR(lLoom) + '</b> · ' +
      'review <b>' + fmtEUR(lRev) + '</b> → total <b>' + fmtEUR(sum) + '</b>';
  }
  bindStepper('estEngDown', 'estEngUp', 'estEngVal', 'eng', 0, 20, days);
  bindStepper('estFridgeDown', 'estFridgeUp', 'estFridgeVal', 'fridge', 0, 20, days);
  bindStepper('estLoomDown', 'estLoomUp', 'estLoomVal', 'loom', 0, 3, function (n) { return String(n); });
  var rev = document.getElementById('estReview');
  rev.addEventListener('click', function () {
    state.review = !state.review;
    rev.setAttribute('aria-pressed', state.review ? 'true' : 'false');
    rev.querySelector('b').textContent = state.review ? 'Review added' : 'Add the review';
    render();
  });
  render();
})();

/* ============================================================
   Contact — enquiry form. Validated and confirmed on this
   page only; the form says so before the button is pressed.
   ============================================================ */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  function field(id, errId, ok) {
    var el = document.getElementById(id);
    var err = document.getElementById(errId);
    var valid = ok(el.value.trim());
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');
    if (err) err.classList.toggle('on', !valid);
    return valid;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var vName = field('fName', 'eName', function (v) { return v.length >= 2; });
    var vEmail = field('fEmail', 'eEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); });
    var vDev = field('fDevice', 'eDevice', function (v) { return v.length >= 3; });
    var vMsg = field('fMsg', 'eMsg', function (v) { return v.length >= 10; });
    if (!(vName && vEmail && vDev && vMsg)) {
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var name = document.getElementById('fName').value.trim();
    var email = document.getElementById('fEmail').value.trim();
    var ref = 'KH-2026-' + (1000 + Math.floor(Math.random() * 9000));
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('confirmEcho').textContent =
      'Logged for ' + name + ' — a reply will go to ' + email + ' within two working days, from the engineer who would do the work.';
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });
  ['fName', 'fEmail', 'fDevice', 'fMsg'].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () {
      el.setAttribute('aria-invalid', 'false');
      var err = document.getElementById('e' + id.slice(1));
      if (err) err.classList.remove('on');
    });
  });
})();
