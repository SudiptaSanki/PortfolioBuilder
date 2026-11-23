/* ============================================================
   Kaminski — Quantum Information Studies: notebook interactions.
   Sound ruling: NONE. Quantum information theory is not a sound
   profession and nothing on this site teaches through audio.
   The stub's spinning canvas qubit was decoration — worse, it
   was wrong physics (a vector orbiting in a plane). It has been
   replaced by a Bloch tool that computes the state it draws.
   The site is silent by design.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome surfaces that abort as
     an unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- contents panel (mobile) ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('contentsPanel');
  if (btn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanel();
    });
  }

  /* ---------- reveal (opacity only) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (reduced || !('IntersectionObserver' in window)) {
    revs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- money formatting ---------- */
  function eur(n) {
    return '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ==========================================================
     The Bloch tool — |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩
     The sphere is an orthographic projection (azimuth 0.6 rad,
     elevation 0.42 rad). The vector drawn is the vector computed:
     one state object, two renderings — they cannot disagree.
     ========================================================== */
  var tool = document.getElementById('bloch');
  if (tool) {
    var CX = 180, CY = 160, R = 118;
    var AZ = 0.6, EL = 0.42;
    var cA = Math.cos(AZ), sA = Math.sin(AZ), cE = Math.cos(EL), sE = Math.sin(EL);
    /* screen = centre + R * (v·right, -(v·up)) with
       right = (sA, -cA, 0), up = (-cA·sE, -sA·sE, cE) */
    function project(x, y, z) {
      return [
        CX + R * (sA * x - cA * y),
        CY + R * (cA * sE * x + sA * sE * y - cE * z)
      ];
    }
    function circlePath(fn) {
      var pts = [];
      for (var t = 0; t <= 360; t += 5) {
        var p = fn(t * Math.PI / 180);
        pts.push((t === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1));
      }
      return pts.join(' ') + ' Z';
    }
    var eq = document.getElementById('eqPath');
    var mer1 = document.getElementById('merPath1');
    var mer2 = document.getElementById('merPath2');
    if (eq) eq.setAttribute('d', circlePath(function (t) { return project(Math.cos(t), Math.sin(t), 0); }));
    if (mer1) mer1.setAttribute('d', circlePath(function (t) { return project(Math.sin(t), 0, Math.cos(t)); }));
    if (mer2) mer2.setAttribute('d', circlePath(function (t) { return project(0, Math.sin(t), Math.cos(t)); }));

    var state = { th: 90, ph: 0 };
    var vecLine = document.getElementById('vecLine');
    var vecTip = document.getElementById('vecTip');
    var sphere = document.getElementById('blochSvg');
    var thVal = document.getElementById('thVal');
    var phVal = document.getElementById('phVal');
    var stateName = document.getElementById('stateName');
    var work = document.getElementById('workLines');
    var bar0 = document.getElementById('bar0');
    var bar1 = document.getElementById('bar1');
    var pv0 = document.getElementById('pv0');
    var pv1 = document.getElementById('pv1');
    var chips = tool.querySelectorAll('.chip');

    function clean(v) { return Math.abs(v) < 0.00005 ? 0 : v; }
    function f4(v) { return clean(v).toFixed(4); }
    function f3(v) { return clean(v).toFixed(3); }

    var NAMES = {
      '0,0': '|0⟩ — the north pole. The one certainty measurement allows.',
      '180,0': '|1⟩ — the south pole. Equally certain, opposite answer.',
      '90,0': '|+⟩ — equal superposition, phase zero.',
      '90,180': '|−⟩ — equal superposition, phase π. The same probabilities as |+⟩; a different state. The phase is not decoration.',
      '90,90': '|+i⟩ — equal superposition, phase π/2. The vector points along +y.',
      '90,270': '|−i⟩ — equal superposition, phase 3π/2. The vector points along −y.'
    };

    function renderBloch() {
      var th = state.th, ph = state.ph;
      var thr = th * Math.PI / 180, phr = ph * Math.PI / 180;
      var half = thr / 2;
      var alpha = Math.cos(half);
      var sHalf = Math.sin(half);
      var betaRe = sHalf * Math.cos(phr);
      var betaIm = sHalf * Math.sin(phr);
      var p0 = alpha * alpha;
      var p1 = betaRe * betaRe + betaIm * betaIm;
      var rx = Math.sin(thr) * Math.cos(phr);
      var ry = Math.sin(thr) * Math.sin(phr);
      var rz = Math.cos(thr);
      var tip = project(rx, ry, rz);

      vecLine.setAttribute('x2', tip[0].toFixed(1));
      vecLine.setAttribute('y2', tip[1].toFixed(1));
      vecTip.setAttribute('cx', tip[0].toFixed(1));
      vecTip.setAttribute('cy', tip[1].toFixed(1));
      sphere.setAttribute('data-vector', f3(rx) + ',' + f3(ry) + ',' + f3(rz));
      sphere.setAttribute('data-tip', tip[0].toFixed(1) + ',' + tip[1].toFixed(1));

      thVal.textContent = th + '°';
      phVal.textContent = ph + '°';
      stateName.textContent = NAMES[th + ',' + ph] ||
        'A general pure state — no special name. Most of the sphere is like this.';

      var betaStr = f4(betaRe) + (clean(betaIm) >= 0 ? ' + ' : ' - ') + f4(Math.abs(betaIm)) + 'i';
      work.innerHTML =
        'θ = ' + th + '° · φ = ' + ph + '° · θ/2 = ' + (th / 2) + '°<br>' +
        'α = cos(θ/2) = cos ' + (th / 2) + '° = <b>' + f4(alpha) + '</b><br>' +
        'sin(θ/2) = ' + f4(sHalf) + ' · cos φ = ' + f4(Math.cos(phr)) + ' · sin φ = ' + f4(Math.sin(phr)) + '<br>' +
        'β = sin(θ/2)·(cos φ + i·sin φ) = <b>' + betaStr + '</b><br>' +
        'P(0) = |α|² = <b>' + f4(p0) + ' → ' + (p0 * 100).toFixed(1) + '%</b><br>' +
        'P(1) = |β|² = <b>' + f4(p1) + ' → ' + (p1 * 100).toFixed(1) + '%</b><br>' +
        'r = (sinθ·cosφ, sinθ·sinφ, cosθ) = <b>(' + f3(rx) + ', ' + f3(ry) + ', ' + f3(rz) + ')</b><br>' +
        'check: |α|² + |β|² = ' + f4(p0 + p1) + ' ✓ — a state, not a suggestion';

      bar0.style.width = (p0 * 100) + '%';
      bar1.style.width = (p1 * 100) + '%';
      pv0.textContent = (p0 * 100).toFixed(1) + '%';
      pv1.textContent = (p1 * 100).toFixed(1) + '%';

      chips.forEach(function (c) {
        var on = parseInt(c.getAttribute('data-th'), 10) === th &&
                 parseInt(c.getAttribute('data-ph'), 10) === ph;
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.th = parseInt(c.getAttribute('data-th'), 10);
        state.ph = parseInt(c.getAttribute('data-ph'), 10);
        renderBloch();
      });
    });
    tool.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-step').split(':');
        var d = parseInt(parts[1], 10);
        if (parts[0] === 'th') {
          state.th = Math.min(180, Math.max(0, state.th + d));
        } else if (parts[0] === 'ph') {
          state.ph = ((state.ph + d) % 360 + 360) % 360;
        }
        renderBloch();
      });
    });
    renderBloch();
  }

  /* ==========================================================
     Collaboration estimator — printed rates only.
     Study day €1,350 · Review day €1,600 ·
     Assumptions audit €3,800 each · Briefing €950 per session.
     ========================================================== */
  var est = document.getElementById('est');
  if (est) {
    var RATES = { study: 1350, review: 1600, audit: 3800, briefing: 950 };
    var UNITS = { study: ['day', 'days'], review: ['day', 'days'], audit: ['audit', 'audits'], briefing: ['session', 'sessions'] };
    var LIMITS = { study: [1, 30], review: [0, 20], audit: [0, 3], briefing: [0, 6] };
    var qty = { study: 6, review: 2, audit: 1, briefing: 0 };

    function renderEst() {
      var total = 0;
      Object.keys(RATES).forEach(function (key) {
        var line = qty[key] * RATES[key];
        total += line;
        document.getElementById('q-' + key).textContent = qty[key];
        document.getElementById('lt-' + key).textContent =
          qty[key] + ' ' + UNITS[key][qty[key] === 1 ? 0 : 1] + ' × ' + eur(RATES[key]);
        document.getElementById('amt-' + key).textContent = eur(line);
      });
      document.getElementById('estTotal').textContent = eur(total);
    }
    est.querySelectorAll('[data-est]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-est').split(':');
        var key = parts[0], d = parseInt(parts[1], 10);
        qty[key] = Math.min(LIMITS[key][1], Math.max(LIMITS[key][0], qty[key] + d));
        renderEst();
      });
    });
    renderEst();
  }

  /* ==========================================================
     Enquiry form — demonstration only. Nothing is transmitted;
     the page says so, and the confirmation says so again.
     ========================================================== */
  var form = document.getElementById('enquiry');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    var fields = {
      name: { el: document.getElementById('f-name'), err: document.getElementById('err-name'),
              test: function (v) { return v.trim().length >= 2; }, msg: 'Your name, as it should appear on the report.' },
      email: { el: document.getElementById('f-email'), err: document.getElementById('err-email'),
               test: function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()); }, msg: 'A working email — the reply and the report travel by it.' },
      interest: { el: document.getElementById('f-interest'), err: document.getElementById('err-interest'),
                  test: function (v) { return v !== ''; }, msg: 'Choose the closest line — it decides which notebook the enquiry lands in.' },
      message: { el: document.getElementById('f-message'), err: document.getElementById('err-message'),
                 test: function (v) { return v.trim().length >= 20; }, msg: 'Twenty characters at least: the claim, the document it lives in, and the decision it feeds.' }
    };
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.el.addEventListener('input', function () {
        f.el.removeAttribute('aria-invalid');
        f.err.textContent = '';
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (key) {
        var f = fields[key];
        if (!f.test(f.el.value)) {
          f.el.setAttribute('aria-invalid', 'true');
          f.err.textContent = f.msg;
          if (!firstBad) firstBad = f.el;
        }
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'QI-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmEcho').textContent =
        'Logged for ' + fields.name.el.value.trim() + ' — ' +
        fields.interest.el.options[fields.interest.el.selectedIndex].text + '.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: false });
    });
  }
})();
