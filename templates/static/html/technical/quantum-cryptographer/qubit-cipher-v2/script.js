/* ============================================================
   FISCHER POST-QUANTUM AUDIT — workbook behaviour
   No audio anywhere on this site: the need-test fails for
   audit work (an audit is read, not heard), so the site is
   silent by ruling, not by omission. The ruling is printed
   in the footer of every page.
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
    /* Focus inside rAF, after the panel is rendered — focusing a
       still-hidden panel is a silent no-op. */
    requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.hidden) open(); else close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
})();

/* ---------- reveal on scroll (opacity only) ---------- */
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
  }, { threshold: 0.06 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function fmtEUR(n) { return '€' + n.toLocaleString('en-US'); }
function parseMoney(text) { return parseInt(String(text).replace(/[^0-9]/g, ''), 10) || 0; }

/* Generic stepper: buttons [data-step="-1"|"1"] around a .val display. */
function makeStepper(root, opts) {
  var valEl = root.querySelector('.val');
  var state = { value: opts.initial };
  function render() {
    valEl.textContent = opts.format ? opts.format(state.value) : String(state.value);
    if (opts.onChange) opts.onChange(state.value);
  }
  root.querySelectorAll('button[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = parseInt(b.getAttribute('data-step'), 10) * opts.step;
      var next = Math.min(opts.max, Math.max(opts.min, state.value + d));
      if (next !== state.value) { state.value = next; render(); }
    });
  });
  render();
  return { get: function () { return state.value; }, render: render };
}

/* ============================================================
   THE MOSCA CHECK (index)
   X + Y > Z means the migration is already late — under that
   scenario. Z is read from the printed scenario table in the
   DOM, so the tool and the table cannot disagree.
   ============================================================ */
(function () {
  var table = document.getElementById('scenTable');
  if (!table) return;
  var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
  var scenarios = rows.map(function (tr) {
    return {
      name: tr.getAttribute('data-name'),
      year: tr.getAttribute('data-year'),
      z: parseInt(tr.querySelector('.z-years').textContent, 10),
      basis: tr.querySelector('.z-basis').textContent
    };
  });
  var current = 1; /* Central is the printed default */
  var x = 10, y = 4;

  var wSum = document.getElementById('wSum');
  var wZ = document.getElementById('wZ');
  var wMargin = document.getElementById('wMargin');
  var wBasis = document.getElementById('wBasis');
  var verdict = document.getElementById('verdict');
  var vTag = document.getElementById('vTag');
  var vText = document.getElementById('vText');
  var pickBtns = document.querySelectorAll('.scen-pick button[data-scen]');

  function render() {
    var s = scenarios[current];
    var sum = x + y;
    var margin = s.z - sum;
    rows.forEach(function (tr, i) { tr.setAttribute('aria-selected', i === current ? 'true' : 'false'); });
    pickBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === current ? 'true' : 'false'); });
    wSum.innerHTML = '<b>Step 1 — the exposure.</b> X + Y = ' + x + ' + ' + y + ' = <b>' + sum + ' years</b> that must stay ahead of the machine.';
    wZ.innerHTML = '<b>Step 2 — the scenario.</b> Z (' + s.name + ', CRQC ' + s.year + ') = <b>' + s.z + ' years</b> from 2026.';
    wBasis.textContent = 'Scenario basis: ' + s.basis;
    if (margin < 0) {
      wMargin.innerHTML = '<b>Step 3 — the margin.</b> Z − (X + Y) = ' + s.z + ' − ' + sum + ' = <b>' + margin + ' years</b>.';
      verdict.className = 'verdict beyond';
      vTag.textContent = 'Verdict — beyond this scenario';
      vText.textContent = 'Under the ' + s.name + ' scenario the data outlives the migration by ' + Math.abs(margin) + ' years. Data recorded today would still need secrecy ' + Math.abs(margin) + ' years after this scenario\u2019s machine arrives. The plan cannot wait for certainty — it starts with inventory.';
    } else {
      wMargin.innerHTML = '<b>Step 3 — the margin.</b> Z − (X + Y) = ' + s.z + ' − ' + sum + ' = <b>+' + margin + ' years</b>.';
      verdict.className = 'verdict within';
      vTag.textContent = 'Verdict — within this scenario';
      vText.textContent = 'Under the ' + s.name + ' scenario there are ' + margin + ' years of margin. Spend them on the inventory and the classification — that is what the margin is for. This verdict is a property of the scenario, not a promise about the future.';
    }
  }

  makeStepper(document.getElementById('xStepper'), {
    initial: x, step: 1, min: 1, max: 75,
    format: function (v) { return v + ' yrs'; },
    onChange: function (v) { x = v; render(); }
  });
  makeStepper(document.getElementById('yStepper'), {
    initial: y, step: 1, min: 1, max: 20,
    format: function (v) { return v + ' yrs'; },
    onChange: function (v) { y = v; render(); }
  });
  pickBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      current = parseInt(b.getAttribute('data-scen'), 10);
      render();
    });
  });
  render();
})();

/* ============================================================
   AUDIT ESTIMATOR (index)
   Rates are read from the printed fee table in the DOM, so the
   estimator and the fee shape cannot disagree.
   ============================================================ */
(function () {
  var est = document.getElementById('estimator');
  if (!est) return;
  var rates = {};
  document.querySelectorAll('#feeTable [data-rate-for]').forEach(function (cell) {
    rates[cell.getAttribute('data-rate-for')] = parseMoney(cell.textContent);
  });
  var qty = { audit: 6, inventory: 40, review: 0 };
  var lineEls = {
    audit: document.getElementById('line-audit'),
    inventory: document.getElementById('line-inventory'),
    review: document.getElementById('line-review')
  };
  var totalEl = document.getElementById('estTotal');
  function render() {
    var total = 0;
    Object.keys(qty).forEach(function (k) {
      var line = qty[k] * (rates[k] || 0);
      total += line;
      if (lineEls[k]) lineEls[k].textContent = fmtEUR(line);
    });
    totalEl.textContent = fmtEUR(total);
  }
  [['audit', 1, 0, 30], ['inventory', 10, 0, 500], ['review', 1, 0, 20]].forEach(function (cfg) {
    var root = document.getElementById('est-' + cfg[0]);
    if (!root) return;
    makeStepper(root, {
      initial: qty[cfg[0]], step: cfg[1], min: cfg[2], max: cfg[3],
      onChange: function (v) { qty[cfg[0]] = v; render(); }
    });
  });
  render();
})();

/* ============================================================
   ENQUIRY FORM (contact) — demonstration form: validates and
   issues a reference, transmits nothing. Stated on the page.
   ============================================================ */
(function () {
  var form = document.getElementById('auditForm');
  if (!form) return;
  var conf = document.getElementById('confirmation');
  var confRef = document.getElementById('confRef');
  var confEcho = document.getElementById('confEcho');

  function fieldOf(input) { return input.closest('.field'); }
  function validate(input) {
    var v = (input.value || '').trim();
    var ok = true;
    if (input.id === 'fName') ok = v.length >= 2;
    else if (input.id === 'fOrg') ok = v.length >= 2;
    else if (input.id === 'fEmail') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    else if (input.id === 'fSector') ok = v !== '';
    else if (input.id === 'fMsg') ok = v.length >= 10;
    fieldOf(input).classList.toggle('invalid', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  ['fName', 'fOrg', 'fEmail', 'fSector', 'fMsg'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('blur', function () { validate(el); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ids = ['fName', 'fOrg', 'fEmail', 'fSector', 'fMsg'];
    var firstBad = null;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !validate(el) && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); return; }
    var ref = 'QC-ENQ-' + Math.floor(1000 + Math.random() * 9000);
    confRef.textContent = ref;
    confEcho.textContent = 'Logged for ' + document.getElementById('fName').value.trim() +
      ' (' + document.getElementById('fOrg').value.trim() + '). On the live practice, Dr Fischer replies within two working days — and the reply begins with your X, not with a product.';
    form.hidden = true;
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
})();
