/* Ellingsen Assessment — shared script.
   No audio anywhere: this practice fails the sound need-test and stays silent.
   No hover-triggered effects. Every control below is click/tap driven. */

/* Cross-document view transitions abort noisily in Chromium when a
   navigation interrupts one; the abort is harmless and the navigation
   completes. Swallow only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- Mobile index panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mpanel');
  var closeBtn = document.getElementById('menuClose');
  if (!btn || !panel || !closeBtn) return;
  var hideTimer = null;

  function open() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    panel.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        panel.classList.add('open');
        var first = panel.querySelector('nav a');
        if (first) first.focus();
      });
    });
    btn.setAttribute('aria-expanded', 'true');
  }
  function shut() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    hideTimer = setTimeout(function () { panel.hidden = true; }, 320);
    btn.focus();
  }
  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) shut();
  });
})();

/* ---------- Annex A: the forcing explorer (teaching model) ---------- */
(function () {
  var aodVal = document.getElementById('aodVal');
  if (!aodVal) return;

  var COEF = 22;          /* Table 1: -22 W/m2 per unit AOD */
  var TAU = 1;            /* Table 1: residence e-folding, years */
  var STEP = 0.01, MIN = 0, MAX = 0.20;
  var aod = 0.05;

  var minus = document.getElementById('aodMinus');
  var plus = document.getElementById('aodPlus');
  var calcLine = document.getElementById('calcLine');
  var forcingVal = document.getElementById('forcingVal');
  var bandLine = document.getElementById('bandLine');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-aod]'));
  var line = document.getElementById('decayLine');
  var dots = document.getElementById('decayDots');

  function fmt2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

  function render() {
    var F0 = -COEF * aod;
    aodVal.textContent = aod.toFixed(2);
    calcLine.innerHTML = 'ΔF = -' + COEF + ' × ' + aod.toFixed(2) +
      ' = <span class="res">' + fmt2(F0) + ' W m⁻²</span>';
    forcingVal.textContent = fmt2(F0) + ' W m⁻²';
    bandLine.textContent = 'Plausible band at ±30%: ' + fmt2(F0 * 1.3) + ' to ' +
      fmt2(F0 * 0.7) + ' W m⁻². The band is part of the answer, not a footnote to it.';
    minus.disabled = aod <= MIN + 1e-9;
    plus.disabled = aod >= MAX - 1e-9;
    chips.forEach(function (c) {
      var on = Math.abs(parseFloat(c.getAttribute('data-aod')) - aod) < 1e-9;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    /* decay table */
    for (var t = 0; t <= 5; t++) {
      var cell = document.getElementById('dF' + t);
      if (cell) cell.textContent = fmt2(F0 * Math.exp(-t / TAU));
    }
    /* decay chart: x = 56 + 96t ; y from value, axis 0 at y=250, -3.5 at y=30 */
    var pts = [];
    for (var tt = 0; tt <= 5.001; tt += 0.25) {
      var v = F0 * Math.exp(-tt / TAU);
      var x = 56 + 96 * tt;
      var y = 250 - (Math.abs(v) / 3.5) * 220;
      if (y < 30) y = 30;
      pts.push(x.toFixed(1) + ',' + y.toFixed(1));
    }
    if (line) line.setAttribute('points', pts.join(' '));
    if (dots) {
      var html = '';
      for (var k = 0; k <= 5; k++) {
        var vk = F0 * Math.exp(-k / TAU);
        var xk = 56 + 96 * k;
        var yk = 250 - (Math.abs(vk) / 3.5) * 220;
        if (yk < 30) yk = 30;
        html += '<circle cx="' + xk + '" cy="' + yk.toFixed(1) + '" r="3.5"/>';
      }
      dots.innerHTML = html;
    }
  }

  minus.addEventListener('click', function () {
    aod = Math.round((aod - STEP) * 100) / 100;
    if (aod < MIN) aod = MIN;
    render();
  });
  plus.addEventListener('click', function () {
    aod = Math.round((aod + STEP) * 100) / 100;
    if (aod > MAX) aod = MAX;
    render();
  });
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      aod = parseFloat(c.getAttribute('data-aod'));
      render();
    });
  });
  render();
})();

/* ---------- Annex B: the study estimator ---------- */
(function () {
  var typeSel = document.getElementById('estType');
  if (!typeSel) return;

  var RATES = { lead: 1600, analyst: 1100, compute: 1200, review: 9500, workshop: 6800 };
  var PRESETS = {
    evidence:        { lead: 15, analyst: 20, compute: 1 },
    intercomparison: { lead: 30, analyst: 55, compute: 6 },
    campaign:        { lead: 25, analyst: 30, compute: 3 }
  };
  var BOUNDS = { lead: [5, 60], analyst: [0, 90], compute: [0, 12] };
  var state = { lead: 15, analyst: 20, compute: 1 };

  var els = {
    leadCalc: document.getElementById('leadCalc'),
    analystCalc: document.getElementById('analystCalc'),
    computeCalc: document.getElementById('computeCalc'),
    leadAmt: document.getElementById('leadAmt'),
    analystAmt: document.getElementById('analystAmt'),
    computeAmt: document.getElementById('computeAmt'),
    total: document.getElementById('estTotal')
  };
  var stepBtns = Array.prototype.slice.call(document.querySelectorAll('.mini-step button[data-k]'));

  function eur(n) { return '€' + n.toLocaleString('en-US'); }

  function render() {
    els.leadCalc.textContent = state.lead + ' days × €1,600';
    els.analystCalc.textContent = state.analyst + ' days × €1,100';
    els.computeCalc.textContent = state.compute + (state.compute === 1 ? ' unit' : ' units') + ' × €1,200';
    els.leadAmt.textContent = eur(state.lead * RATES.lead);
    els.analystAmt.textContent = eur(state.analyst * RATES.analyst);
    els.computeAmt.textContent = eur(state.compute * RATES.compute);
    els.total.textContent = eur(state.lead * RATES.lead + state.analyst * RATES.analyst +
      state.compute * RATES.compute + RATES.review + RATES.workshop);
    stepBtns.forEach(function (b) {
      var k = b.getAttribute('data-k'), d = parseInt(b.getAttribute('data-d'), 10);
      var next = state[k] + d;
      b.disabled = next < BOUNDS[k][0] || next > BOUNDS[k][1];
    });
  }

  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-k'), d = parseInt(b.getAttribute('data-d'), 10);
      var next = state[k] + d;
      if (next < BOUNDS[k][0] || next > BOUNDS[k][1]) return;
      state[k] = next;
      render();
    });
  });
  typeSel.addEventListener('change', function () {
    var p = PRESETS[typeSel.value];
    if (p) { state.lead = p.lead; state.analyst = p.analyst; state.compute = p.compute; }
    render();
  });
  render();
})();

/* ---------- Contact form: validation + in-page confirmation ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;

  var name = document.getElementById('fName');
  var email = document.getElementById('fEmail');
  var msg = document.getElementById('fMsg');
  var eName = document.getElementById('eName');
  var eEmail = document.getElementById('eEmail');
  var eMsg = document.getElementById('eMsg');
  var formErr = document.getElementById('formErr');
  var confirmBox = document.getElementById('confirmBox');
  var confirmRef = document.getElementById('confirmRef');
  var submitBtn = document.getElementById('submitBtn');

  function showErr(input, errEl, bad) {
    errEl.classList.toggle('show', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okName = showErr(name, eName, name.value.trim().length < 2);
    var okEmail = showErr(email, eEmail, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
    var okMsg = showErr(msg, eMsg, msg.value.trim().length < 20);
    var ok = okName && okEmail && okMsg;
    formErr.classList.toggle('show', !ok);
    if (!ok) {
      var firstBad = !okName ? name : (!okEmail ? email : msg);
      firstBad.focus();
      return;
    }
    var ref = 'ENQ-2026-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    confirmRef.textContent = ref;
    confirmBox.hidden = false;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enquiry noted';
    confirmBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  [name, email, msg].forEach(function (input) {
    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
    });
  });
})();
