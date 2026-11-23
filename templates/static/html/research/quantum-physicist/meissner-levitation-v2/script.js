/* Kessler Low-Temperature Laboratory — run-sheet behaviour.
   Sound ruling: NONE. Superconductivity is read from instruments and
   logbooks; no measurement on this site is heard, and nothing here
   teaches through audio. The site is silent by the need-test, and the
   ruling is printed in every footer. */
document.documentElement.classList.add('js');

/* Cross-document view transitions: when the browser aborts one, the
   abort surfaces as an unhandled promise rejection. The navigation
   itself always completes, so swallow only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile run index ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('mnav');
  if (!btn || !nav) return;
  var sheet = nav.querySelector('.sheet');
  function open() {
    nav.hidden = false;
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      sheet.classList.add('open');
      var first = nav.querySelector('.mlink');
      if (first) first.focus();
    });
  }
  function close() {
    sheet.classList.remove('open');
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { nav.hidden = true; }, 60);
    btn.focus();
  }
  btn.addEventListener('click', open);
  nav.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !nav.hidden) close();
  });
})();

/* ---------- reveals (opacity only; reduced motion shows all) ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

function money(n) { return '\u20AC' + n.toLocaleString('en-GB'); }

/* ---------- the lift pressure tool ----------
   Every input is read from the printed tables in the DOM — the field
   ranges from Table 1's data attributes — so the tool and the printed
   sheet cannot disagree. Relation: P = B^2 / (2 mu0), mu0 = 4 pi x 10^-7. */
(function () {
  var root = document.getElementById('lift-tool');
  if (!root) return;
  var MU0 = 1.2566e-6, G = 9.81;
  var rows = Array.prototype.map.call(
    document.querySelectorAll('#magnet-table tbody tr'),
    function (tr) {
      return {
        tr: tr,
        name: tr.querySelector('td').textContent.trim(),
        min: parseFloat(tr.getAttribute('data-bmin')),
        max: parseFloat(tr.getAttribute('data-bmax')),
        def: parseFloat(tr.getAttribute('data-bdef'))
      };
    });
  var sysBtns = Array.prototype.slice.call(root.querySelectorAll('.sys-btn'));
  var bMinus = document.getElementById('bMinus'), bPlus = document.getElementById('bPlus'), bVal = document.getElementById('bVal');
  var aMinus = document.getElementById('aMinus'), aPlus = document.getElementById('aPlus'), aVal = document.getElementById('aVal');
  var wSys = document.getElementById('wSys'), wP = document.getElementById('wP'), wA = document.getElementById('wA'),
      wF = document.getElementById('wF'), wM = document.getElementById('wM');
  var rP = document.getElementById('rP'), rF = document.getElementById('rF'), rMass = document.getElementById('rMass');

  var sys = 1, B = rows[1].def, A = 25;

  function fmtP(pa) {
    if (pa < 1000) return Math.round(pa) + ' Pa';
    if (pa < 1e6) return Math.round(pa / 1000) + ' kPa';
    return (pa / 1e6).toFixed(2) + ' MPa';
  }
  function fmtF(n) {
    if (n < 1000) return Math.round(n) + ' N';
    return (n / 1000).toFixed(2) + ' kN';
  }
  function fmtM(kg) {
    if (kg < 100) return kg.toFixed(1) + ' kg';
    return Math.round(kg).toLocaleString('en-GB') + ' kg';
  }
  function areaStr() {
    var s = (A / 10000).toFixed(4);
    return s.replace(/0+$/, '').replace(/\.$/, '.0');
  }
  function render() {
    var row = rows[sys];
    var P = (B * B) / (2 * MU0);
    var F = P * (A / 10000);
    var M = F / G;
    rows.forEach(function (r, i) { r.tr.classList.toggle('hl', i === sys); });
    sysBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === sys ? 'true' : 'false'); });
    bVal.textContent = B.toFixed(2) + ' T';
    aVal.textContent = A + ' cm\u00B2';
    bMinus.disabled = B <= row.min + 1e-9;
    bPlus.disabled = B >= row.max - 1e-9;
    aMinus.disabled = A <= 5;
    aPlus.disabled = A >= 500;
    wSys.textContent = 'System \u2014 ' + row.name + ' (printed range ' + row.min.toFixed(2) + '\u2013' + row.max.toFixed(2) + ' T, Table 1)';
    wP.textContent = 'P = B\u00B2 \u00F7 (2 \u00D7 \u03BC\u2080) = ' + B.toFixed(2) + '\u00B2 \u00F7 (2 \u00D7 1.2566\u00D710\u207B\u2076) = ' + fmtP(P);
    wA.textContent = 'A = ' + A + ' cm\u00B2 = ' + areaStr() + ' m\u00B2';
    wF.textContent = 'F = P \u00D7 A = ' + fmtP(P) + ' \u00D7 ' + areaStr() + ' m\u00B2 = ' + fmtF(F);
    wM.textContent = 'm = F \u00F7 g = ' + fmtF(F) + ' \u00F7 9.81 = ' + fmtM(M);
    rP.textContent = fmtP(P);
    rF.textContent = fmtF(F);
    rMass.textContent = fmtM(M);
  }
  sysBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      sys = parseInt(b.getAttribute('data-sys'), 10);
      B = rows[sys].def;
      render();
    });
  });
  bMinus.addEventListener('click', function () { B = Math.max(rows[sys].min, Math.round((B - 0.05) * 100) / 100); render(); });
  bPlus.addEventListener('click', function () { B = Math.min(rows[sys].max, Math.round((B + 0.05) * 100) / 100); render(); });
  aMinus.addEventListener('click', function () { A = Math.max(5, A - 5); render(); });
  aPlus.addEventListener('click', function () { A = Math.min(500, A + 5); render(); });
  render();
})();

/* ---------- characterisation estimator ----------
   Rates are read from the printed fee table's data-rate attributes, in
   row order, so the estimator and the rate card cannot disagree. */
(function () {
  if (!document.getElementById('estLines')) return;
  var rates = Array.prototype.map.call(
    document.querySelectorAll('#fee-table tbody tr'),
    function (tr) { return parseInt(tr.getAttribute('data-rate'), 10); });
  /* rates: [day, extra cycle, helium per litre, full map, report] */
  var days = 3, cycles = 1, helium = 40, mapOn = false, repOn = true;
  var dMinus = document.getElementById('dMinus'), dPlus = document.getElementById('dPlus'), dVal = document.getElementById('dVal');
  var cMinus = document.getElementById('cMinus'), cPlus = document.getElementById('cPlus'), cVal = document.getElementById('cVal');
  var hMinus = document.getElementById('hMinus'), hPlus = document.getElementById('hPlus'), hVal = document.getElementById('hVal');
  var mapTgl = document.getElementById('mapTgl'), repTgl = document.getElementById('repTgl');
  var estLines = document.getElementById('estLines'), estTotal = document.getElementById('estTotal');

  function line(label, n) {
    return '<div class="eline"><span>' + label + '</span><span>' + money(n) + '</span></div>';
  }
  function render() {
    dVal.textContent = days + (days === 1 ? ' day' : ' days');
    cVal.textContent = cycles + (cycles === 1 ? ' cycle' : ' cycles');
    hVal.textContent = helium + ' L';
    dMinus.disabled = days <= 1; dPlus.disabled = days >= 15;
    cMinus.disabled = cycles <= 0; cPlus.disabled = cycles >= 10;
    hMinus.disabled = helium <= 0; hPlus.disabled = helium >= 400;
    mapTgl.setAttribute('aria-pressed', mapOn ? 'true' : 'false');
    repTgl.setAttribute('aria-pressed', repOn ? 'true' : 'false');
    var html = '';
    var total = 0;
    html += line(days + ' characterisation days \u00D7 ' + money(rates[0]), days * rates[0]); total += days * rates[0];
    html += line(cycles + ' additional cooldown cycles \u00D7 ' + money(rates[1]), cycles * rates[1]); total += cycles * rates[1];
    html += line(helium + ' L liquid helium at cost \u00D7 ' + money(rates[2]), helium * rates[2]); total += helium * rates[2];
    if (mapOn) { html += line('Full Jc(B,T) map \u2014 fixed', rates[3]); total += rates[3]; }
    if (repOn) { html += line('Report with uncertainty budget \u2014 fixed', rates[4]); total += rates[4]; }
    estLines.innerHTML = html;
    estTotal.textContent = money(total);
  }
  dMinus.addEventListener('click', function () { days = Math.max(1, days - 1); render(); });
  dPlus.addEventListener('click', function () { days = Math.min(15, days + 1); render(); });
  cMinus.addEventListener('click', function () { cycles = Math.max(0, cycles - 1); render(); });
  cPlus.addEventListener('click', function () { cycles = Math.min(10, cycles + 1); render(); });
  hMinus.addEventListener('click', function () { helium = Math.max(0, helium - 10); render(); });
  hPlus.addEventListener('click', function () { helium = Math.min(400, helium + 10); render(); });
  mapTgl.addEventListener('click', function () { mapOn = !mapOn; render(); });
  repTgl.addEventListener('click', function () { repOn = !repOn; render(); });
  render();
})();

/* ---------- enquiry form (demonstration — nothing is transmitted) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var confRef = document.getElementById('confRef');
  var fields = [
    { input: document.getElementById('fName'), err: document.getElementById('eName'),
      ok: function (v) { return v.trim().length > 1; } },
    { input: document.getElementById('fEmail'), err: document.getElementById('eEmail'),
      ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
    { input: document.getElementById('fService'), err: document.getElementById('eService'),
      ok: function (v) { return v !== ''; } },
    { input: document.getElementById('fMsg'), err: document.getElementById('eMsg'),
      ok: function (v) { return v.trim().length > 9; } }
  ];
  function check(f) {
    var good = f.ok(f.input.value);
    f.input.setAttribute('aria-invalid', good ? 'false' : 'true');
    f.err.classList.toggle('on', !good);
    return good;
  }
  fields.forEach(function (f) {
    f.input.addEventListener('input', function () {
      if (f.input.getAttribute('aria-invalid') === 'true') check(f);
    });
    f.input.addEventListener('change', function () {
      if (f.input.getAttribute('aria-invalid') === 'true') check(f);
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var allOk = true, firstBad = null;
    fields.forEach(function (f) {
      if (!check(f)) { allOk = false; if (!firstBad) firstBad = f.input; }
    });
    if (!allOk) { if (firstBad) firstBad.focus(); return; }
    var ref = 'KLT-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    confRef.textContent = ref;
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });
})();
