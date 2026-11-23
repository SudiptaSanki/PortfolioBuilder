/* ============================================================
   MORI RAIL AERODYNAMICS — maglev-slipstream
   No audio is used on this site: the work is read from run
   sheets and tables, and nothing here teaches through sound.
   The sound need-test fails; the site is silent by design.
   ============================================================ */

/* --- view-transition abort guard: an aborted cross-document
       transition surfaces as an unhandled rejection; it is not
       an error, and the navigation always completes. --- */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* --- mobile run-index menu --- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      var first = panel.querySelector('.mlink, .close-btn');
      if (first) first.focus();
    });
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  btn.addEventListener('click', open);
  panel.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
})();

/* --- reveal on scroll (opacity only; reduced motion shows all) --- */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
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

/* --- number formatting --- */
function fmtInt(n) { return Math.round(n).toLocaleString('en-GB'); }
function fmt(n, dp) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/* ============================================================
   THE CUBE-LAW TOOL
   P = ½ · ρ · v³ · (Cd·A),  F = ½ · ρ · v² · (Cd·A)
   ρ = 1.225 kg/m³ (ISA sea level, printed on the page).
   Cd·A values are read from the printed Table T1 rows in the
   DOM, so the tool and the table cannot disagree.
   ============================================================ */
(function () {
  var tool = document.getElementById('cubeTool');
  if (!tool) return;
  var RHO = 1.225;
  var classChips = tool.querySelectorAll('[data-class-chip]');
  var speedChips = tool.querySelectorAll('[data-speed-chip]');
  var speedVal = document.getElementById('speedVal');
  var rows = document.querySelectorAll('#trainTable tbody tr');
  var state = { cda: 7.6, name: '', kmh: 300 };

  function currentRow() {
    var found = null;
    rows.forEach(function (r) {
      if (parseFloat(r.getAttribute('data-cda')) === state.cda) found = r;
    });
    return found;
  }
  function syncTable() {
    rows.forEach(function (r) {
      r.classList.toggle('sel', parseFloat(r.getAttribute('data-cda')) === state.cda);
    });
  }
  function compute(kmh, cda) {
    var v = kmh / 3.6;
    var F = 0.5 * RHO * v * v * cda;      // N
    var P = F * v;                        // W
    return { v: v, F: F, P: P };
  }
  function render() {
    var r = compute(state.kmh, state.cda);
    var half = compute(state.kmh / 2, state.cda);
    speedVal.textContent = state.kmh;
    document.getElementById('dragVal').innerHTML =
      fmt(r.F / 1000, 1) + ' <span class="unit">kN</span>';
    document.getElementById('powerVal').innerHTML =
      fmt(r.P / 1e6, 2) + ' <span class="unit">MW</span>';
    document.getElementById('workings').innerHTML =
      '<p>v = ' + state.kmh + ' km/h ÷ 3.6 = <b>' + fmt(r.v, 3) + ' m/s</b></p>' +
      '<p>F = ½ × 1.225 × ' + fmt(r.v * r.v, 1) + ' × ' + fmt(state.cda, 1) + ' = <b>' + fmt(r.F / 1000, 1) + ' kN</b></p>' +
      '<p>P = F × v = ' + fmt(r.F / 1000, 1) + ' kN × ' + fmt(r.v, 3) + ' m/s = <b>' + fmt(r.P / 1e6, 2) + ' MW</b></p>';
    document.getElementById('compareText').innerHTML =
      'Same train at <b>' + (state.kmh / 2) + ' km/h</b>: <b>' + fmt(half.P / 1e6, 2) + ' MW</b>. ' +
      'Halving the speed divides the power by (' + state.kmh + ' ÷ ' + (state.kmh / 2) + ')³ = <b>8.00×</b> — ' +
      'check: ' + fmt(r.P / 1e6, 2) + ' MW ÷ 8 = <b>' + fmt(r.P / 8 / 1e6, 2) + ' MW</b>. ' +
      'Run the speed up and watch which readout moves like a cube.';
    classChips.forEach(function (c) {
      c.setAttribute('aria-pressed', parseFloat(c.getAttribute('data-cda')) === state.cda ? 'true' : 'false');
    });
    speedChips.forEach(function (c) {
      c.setAttribute('aria-pressed', parseInt(c.getAttribute('data-speed'), 10) === state.kmh ? 'true' : 'false');
    });
    syncTable();
  }
  classChips.forEach(function (c) {
    c.addEventListener('click', function () {
      state.cda = parseFloat(c.getAttribute('data-cda'));
      state.name = c.getAttribute('data-name') || '';
      render();
    });
  });
  speedChips.forEach(function (c) {
    c.addEventListener('click', function () {
      state.kmh = parseInt(c.getAttribute('data-speed'), 10);
      render();
    });
  });
  document.getElementById('speedDown').addEventListener('click', function () {
    state.kmh = Math.max(120, state.kmh - 10); render();
  });
  document.getElementById('speedUp').addEventListener('click', function () {
    state.kmh = Math.min(500, state.kmh + 10); render();
  });
  // initialise from the printed default row (Class 1) if present
  var def = tool.querySelector('[data-class-chip][data-default]');
  if (def) { state.cda = parseFloat(def.getAttribute('data-cda')); }
  render();
})();

/* ============================================================
   PROGRAMME ESTIMATOR
   Rates are read from the printed fee table's data attributes
   so the estimator and the fee table cannot disagree.
   ============================================================ */
(function () {
  var est = document.getElementById('estimator');
  if (!est) return;
  var feeSrc = document.getElementById('feeTable');
  var DAY = parseFloat(feeSrc.getAttribute('data-day'));
  var TUN = parseFloat(feeSrc.getAttribute('data-tunnel'));
  var CFD = parseFloat(feeSrc.getAttribute('data-cfd'));
  var s = { days: 10, tunnel: 2, cfd: true };
  function line(id, txt) { document.getElementById(id).textContent = txt; }
  function render() {
    document.getElementById('estDays').textContent = s.days;
    document.getElementById('estTunnel').textContent = s.tunnel;
    document.getElementById('cfdToggle').setAttribute('aria-pressed', s.cfd ? 'true' : 'false');
    var d = s.days * DAY, t = s.tunnel * TUN, c = s.cfd ? CFD : 0;
    line('estDaysLine', '€' + fmtInt(d));
    line('estTunnelLine', '€' + fmtInt(t));
    line('estCfdLine', '€' + fmtInt(c));
    document.getElementById('estTotal').textContent = '€' + fmtInt(d + t + c);
    document.getElementById('estWork').textContent =
      s.days + ' × €' + fmtInt(DAY) + ' + ' + s.tunnel + ' × €' + fmtInt(TUN) +
      (s.cfd ? ' + €' + fmtInt(CFD) + ' CFD block' : ' + €0 (no CFD block)') +
      ' = €' + fmtInt(d + t + c) + ', before travel and taxes.';
  }
  est.querySelector('[data-est="days-"]').addEventListener('click', function () { s.days = Math.max(1, s.days - 1); render(); });
  est.querySelector('[data-est="days+"]').addEventListener('click', function () { s.days = Math.min(60, s.days + 1); render(); });
  est.querySelector('[data-est="tun-"]').addEventListener('click', function () { s.tunnel = Math.max(0, s.tunnel - 1); render(); });
  est.querySelector('[data-est="tun+"]').addEventListener('click', function () { s.tunnel = Math.min(20, s.tunnel + 1); render(); });
  document.getElementById('cfdToggle').addEventListener('click', function () { s.cfd = !s.cfd; render(); });
  render();
})();

/* ============================================================
   ENQUIRY FORM — demonstration form. Nothing is transmitted;
   validation + in-page confirmation with a generated reference.
   ============================================================ */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var conf = document.getElementById('confirmation');
  function setErr(field, msg) {
    var wrap = field.closest('.field');
    var err = wrap.querySelector('.err');
    if (msg) { wrap.classList.add('invalid'); err.textContent = msg; err.hidden = false; }
    else { wrap.classList.remove('invalid'); err.textContent = ''; err.hidden = true; }
    return !msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name');
    var email = document.getElementById('f-email');
    var org = document.getElementById('f-org');
    var type = document.getElementById('f-type');
    var msg = document.getElementById('f-msg');
    var ok = true;
    ok = setErr(name, name.value.trim() ? '' : 'Your name is required.') && ok;
    ok = setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'A valid email is required.') && ok;
    ok = setErr(org, org.value.trim() ? '' : 'Organisation is required — studies are commissioned by operators, manufacturers and infrastructure owners.') && ok;
    ok = setErr(type, type.value ? '' : 'Choose the closest programme type.') && ok;
    ok = setErr(msg, msg.value.trim().length >= 20 ? '' : 'Tell me a little about the programme (20+ characters) — vehicle or route, speed, and what is undecided.') && ok;
    if (!ok) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'MS-2026-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('confRef').textContent = ref;
    document.getElementById('confEcho').textContent =
      'Thank you, ' + name.value.trim() + ' (' + org.value.trim() + '). Your ' +
      type.options[type.selectedIndex].text.toLowerCase() +
      ' enquiry is logged under the reference above. A first reply — usually with two questions and a reading list, not a brochure — follows within two working days.';
    form.hidden = true;
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
})();
