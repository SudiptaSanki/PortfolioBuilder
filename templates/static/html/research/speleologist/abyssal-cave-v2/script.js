/* ============================================================
   Hartley Cave Survey — script.js
   Sound ruling: NONE. A cave surveyor's instrument is the tape,
   the compass and the book; there is no audio in this trade's
   portfolio that teaches anything, so the site stays silent.
   The stub's falling-dust particle canvas is gone with it —
   decoration that measured nothing.
   ============================================================ */

/* --- View-transition abort guard ----------------------------------
   Cross-document view transitions that Chrome aborts surface as an
   unhandled InvalidStateError rejection. Swallow ONLY that case. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* --- Mobile menu: the station register ----------------------------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (!btn || !panel) return;
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked');
    requestAnimationFrame(function () {
      var first = panel.querySelector('a');
      if (first) first.focus();
    });
  }
  function close(restore) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
    if (restore && lastFocus) lastFocus.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(true); else open();
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
})();

/* --- Reveal on scroll (opacity only; CSS gates reduced motion) ----- */
(function () {
  var els = document.querySelectorAll('.rv');
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

/* ============================================================
   THE LEG CALCULATOR
   The printed method (on the page, in the method panel):
     plan contribution of a leg  = distance × cos(gradient)
     vertical change of a leg    = distance × sin(gradient)
   Totals are summed from UNROUNDED leg values, then rounded to
   2 dp for display — the drawing-office convention, stated on
   the page. One computation drives the per-leg readouts, the
   totals AND the elevation profile, so they can never disagree.
   ============================================================ */
(function () {
  var root = document.getElementById('legCalc');
  if (!root) return;

  var LEGS = [
    { dist: 24.0, grad: -8 },
    { dist: 17.5, grad: -32 },
    { dist: 11.0, grad: 5 },
    { dist: 29.5, grad: -18 }
  ];
  var DIST = { min: 0, max: 60, step: 0.5 };
  var GRAD = { min: -60, max: 60, step: 1 };

  function fmt(n, dp) { return n.toFixed(dp); }
  function fmtSigned(n) { return (n > 0 ? '+' : '') + n.toFixed(2); }

  function compute() {
    var planTotal = 0, vertTotal = 0, slopeTotal = 0;
    var cumPlan = [0], cumVert = [0];
    LEGS.forEach(function (leg, i) {
      var rad = leg.grad * Math.PI / 180;
      var plan = leg.dist * Math.cos(rad);
      var vert = leg.dist * Math.sin(rad);
      planTotal += plan; vertTotal += vert; slopeTotal += leg.dist;
      cumPlan.push(cumPlan[i] + plan);
      cumVert.push(cumVert[i] + vert);
      var po = document.getElementById('plan' + i);
      var vo = document.getElementById('vert' + i);
      if (po) po.firstChild.nodeValue = fmt(plan, 2);
      if (vo) {
        vo.firstChild.nodeValue = fmtSigned(vert);
        vo.classList.toggle('neg', vert < 0);
      }
      var dv = document.getElementById('distVal' + i);
      var gv = document.getElementById('gradVal' + i);
      if (dv) dv.textContent = fmt(leg.dist, 1);
      if (gv) gv.textContent = (leg.grad > 0 ? '+' : '') + leg.grad + '°';
    });
    var tp = document.getElementById('totalPlan');
    var tv = document.getElementById('totalVert');
    var ts = document.getElementById('totalSlope');
    if (tp) tp.firstChild.nodeValue = fmt(planTotal, 2);
    if (tv) tv.firstChild.nodeValue = fmtSigned(vertTotal);
    if (ts) ts.firstChild.nodeValue = fmt(slopeTotal, 1);
    drawProfile(cumPlan, cumVert);
  }

  /* Elevation profile: cumulative plan distance across,
     cumulative height change down (a descent plots downward). */
  function drawProfile(cumPlan, cumVert) {
    var line = document.getElementById('profLine');
    var dots = document.getElementById('profDots');
    var labels = document.getElementById('profLabels');
    if (!line || !dots || !labels) return;
    var W = 640, H = 190, padL = 34, padR = 14, padT = 18, padB = 26;
    var maxX = Math.max.apply(null, cumPlan.concat([10]));
    var minY = Math.min.apply(null, cumVert.concat([0]));
    var maxY = Math.max.apply(null, cumVert.concat([0]));
    var spanY = Math.max(maxY - minY, 4);
    function X(p) { return padL + (p / maxX) * (W - padL - padR); }
    function Y(v) { return padT + ((maxY - v) / spanY) * (H - padT - padB); }
    var pts = cumPlan.map(function (p, i) { return X(p).toFixed(1) + ',' + Y(cumVert[i]).toFixed(1); });
    line.setAttribute('points', pts.join(' '));
    var circles = '', texts = '';
    cumPlan.forEach(function (p, i) {
      var cx = X(p), cy = Y(cumVert[i]);
      circles += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4"/>';
      texts += '<text x="' + cx.toFixed(1) + '" y="' + (cy - 9).toFixed(1) + '">STN ' + i + '</text>';
    });
    dots.innerHTML = circles;
    labels.innerHTML = texts;
    var end = document.getElementById('profEnd');
    if (end) {
      end.setAttribute('x', X(cumPlan[cumPlan.length - 1]).toFixed(1));
      end.setAttribute('y', (H - 8));
      end.textContent = 'plan ' + fmt(cumPlan[cumPlan.length - 1], 1) + ' m · net ' + fmtSigned(cumVert[cumVert.length - 1]) + ' m';
    }
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-leg]');
    if (!btn) return;
    var i = parseInt(btn.getAttribute('data-leg'), 10);
    var field = btn.getAttribute('data-field');
    var dir = parseInt(btn.getAttribute('data-dir'), 10);
    var leg = LEGS[i];
    if (field === 'dist') {
      leg.dist = Math.min(DIST.max, Math.max(DIST.min, Math.round((leg.dist + dir * DIST.step) * 2) / 2));
    } else {
      leg.grad = Math.min(GRAD.max, Math.max(GRAD.min, leg.grad + dir * GRAD.step));
    }
    compute();
  });

  compute();
})();

/* ============================================================
   THE EXPEDITION ESTIMATOR
   Rates are the printed fee table on the same page:
     underground survey day (two-person team)   £760 / day
     rigging & consumables                      £140 / underground day
     drawing-up & reporting                     £480 fixed + £6 / station
   Every line shows its arithmetic; the total is their sum.
   ============================================================ */
(function () {
  var root = document.getElementById('estimator');
  if (!root) return;
  var RATES = { day: 760, rig: 140, fixed: 480, perStation: 6 };
  var state = { days: 6, stations: 120 };
  var LIM = {
    days: { min: 1, max: 30, step: 1 },
    stations: { min: 0, max: 300, step: 10 }
  };
  function gbp(n) { return '£' + n.toLocaleString('en-GB'); }

  function compute() {
    var dayCost = state.days * RATES.day;
    var rigCost = state.days * RATES.rig;
    var drawCost = RATES.fixed + state.stations * RATES.perStation;
    var total = dayCost + rigCost + drawCost;
    setText('estDaysVal', state.days);
    setText('estStationsVal', state.stations);
    setText('lineDays', gbp(dayCost));
    setText('lineDaysCalc', state.days + ' days × ' + gbp(RATES.day));
    setText('lineRig', gbp(rigCost));
    setText('lineRigCalc', state.days + ' days × ' + gbp(RATES.rig));
    setText('lineDraw', gbp(drawCost));
    setText('lineDrawCalc', gbp(RATES.fixed) + ' + ' + state.stations + ' stations × ' + gbp(RATES.perStation));
    setText('lineTotal', gbp(total));
  }
  function setText(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  root.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-est]');
    if (!btn) return;
    var field = btn.getAttribute('data-est');
    var dir = parseInt(btn.getAttribute('data-dir'), 10);
    var lim = LIM[field];
    state[field] = Math.min(lim.max, Math.max(lim.min, state[field] + dir * lim.step));
    compute();
  });
  compute();
})();

/* ============================================================
   ENQUIRY FORM — demonstration only.
   Validates in the page, confirms in the page, transmits
   nothing, and says so beside the button before you press it.
   ============================================================ */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');

  function fieldOf(input) { return input.closest('.field'); }
  function validate(input) {
    var ok = true;
    if (input.type === 'email') {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    } else if (input.tagName === 'SELECT') {
      ok = input.value !== '';
    } else {
      ok = input.value.trim().length >= 2;
    }
    var f = fieldOf(input);
    if (f) f.classList.toggle('invalid', !ok);
    return ok;
  }
  ['cf-name', 'cf-email', 'cf-type', 'cf-msg'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('blur', function () { validate(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ids = ['cf-name', 'cf-email', 'cf-type', 'cf-msg'];
    var allOk = true, firstBad = null;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !validate(el)) { allOk = false; if (!firstBad) firstBad = el; }
    });
    if (!allOk) { if (firstBad) firstBad.focus(); return; }
    var name = document.getElementById('cf-name').value.trim();
    var ref = 'HCS-' + new Date().getFullYear() + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    var refEl = document.getElementById('confirmRef');
    var nameEl = document.getElementById('confirmName');
    if (refEl) refEl.textContent = 'Reference: ' + ref;
    if (nameEl) nameEl.textContent = name.split(' ')[0];
    form.hidden = true;
    if (confirmBox) {
      confirmBox.hidden = false;
      confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var h = confirmBox.querySelector('h3');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    }
  });
})();
