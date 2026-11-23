/* ============================================================
   NYHOLM FLIGHT ADVISORY — apogee-pilot
   Sound ruling: NONE. Suborbital flight training is read from
   profiles, checklists and debriefs; nothing on this site
   teaches through audio. The stub's canvas horizon and HUD
   were removed, not rebuilt. The site is silent by design;
   the ruling is printed in the footer and in CREDITS.md.
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
  var fmt = function (n) { return n.toLocaleString('en-US'); };
  var money = function (n) { return '$' + fmt(n); };
  var mmss = function (s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ' min ' + (r < 10 ? '0' : '') + r + ' s';
  };
  var tplus = function (s) { return 'T+' + s + ' s'; };

  /* ---------- mobile flight-plan panel ---------- */
  var btn = document.querySelector('.plan-btn');
  var panel = document.getElementById('planPanel');
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

  /* ==========================================================
     THE PROFILE PLANNER
     Every figure is parsed from the printed profile table in
     the DOM (tbody[data-variant] rows carry data-key / data-t /
     data-dur), so the tool and the printed page cannot
     disagree. All derived numbers are sums and differences of
     printed T+ points, shown line by line in the workings.
     ========================================================== */
  var profileTable = document.getElementById('profileTable');
  var chipBox = document.getElementById('variantChips');
  if (profileTable && chipBox) {
    var bodies = Array.prototype.slice.call(profileTable.querySelectorAll('tbody[data-variant]'));
    var profiles = bodies.map(function (tb) {
      var d = { id: tb.getAttribute('data-variant'), apogee: parseFloat(tb.getAttribute('data-apogee')), rows: {} };
      tb.querySelectorAll('tr').forEach(function (tr) {
        var k = tr.getAttribute('data-key');
        if (k) d.rows[k] = { t: parseFloat(tr.getAttribute('data-t')), dur: parseFloat(tr.getAttribute('data-dur') || '0') };
      });
      return d;
    });
    var sel = 0;
    var chips = profiles.map(function (p, i) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      c.innerHTML = (i === 0 ? 'Profile A — Standard Arc' : 'Profile B — High Arc') +
        '<small>apogee ' + p.apogee + ' km · total ' + mmss(p.rows.glide.t) + '</small>';
      c.addEventListener('click', function () { select(i); });
      chipBox.appendChild(c);
      return c;
    });

    var segEls = {
      boost: document.getElementById('segBoost'),
      coastup: document.getElementById('segCoastUp'),
      coastdown: document.getElementById('segCoastDown'),
      glide: document.getElementById('segGlide')
    };
    var phRows = {
      boost: document.getElementById('phBoost'),
      coastup: document.getElementById('phCoastUp'),
      coastdown: document.getElementById('phCoastDown'),
      glide: document.getElementById('phGlide')
    };
    var roApogee = document.getElementById('roApogee');
    var roTotal = document.getElementById('roTotal');
    var roWeightless = document.getElementById('roWeightless');
    var roA100 = document.getElementById('roA100');
    var roA80 = document.getElementById('roA80');
    var workings = document.getElementById('plannerWorkings');

    function select(i) {
      sel = i;
      chips.forEach(function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      compute();
    }

    function compute() {
      var p = profiles[sel], r = p.rows;
      var total = r.glide.t;
      var meco = r.boost.t, apogeeT = r.coastup.t, ifaceT = r.coastdown.t;
      var weightless = ifaceT - meco;
      var a100 = r.c100d.t - r.c100u.t;
      var a80 = r.c80d.t - r.c80u.t;

      segEls.boost.style.width = (r.boost.dur / total * 100).toFixed(1) + '%';
      segEls.coastup.style.width = (r.coastup.dur / total * 100).toFixed(1) + '%';
      segEls.coastdown.style.width = (r.coastdown.dur / total * 100).toFixed(1) + '%';
      segEls.glide.style.width = (r.glide.dur / total * 100).toFixed(1) + '%';

      phRows.boost.textContent = 'T+0 → ' + tplus(meco);
      phRows.coastup.textContent = tplus(meco) + ' → ' + tplus(apogeeT);
      phRows.coastdown.textContent = tplus(apogeeT) + ' → ' + tplus(ifaceT);
      phRows.glide.textContent = tplus(ifaceT) + ' → ' + tplus(total);

      roApogee.textContent = p.apogee + ' km';
      roTotal.textContent = mmss(total);
      roWeightless.textContent = mmss(weightless);
      roA100.textContent = a100 + ' s';
      roA80.textContent = mmss(a80);

      workings.textContent =
        'Boost ' + r.boost.dur + ' s → MECO at ' + tplus(meco) + '\n' +
        'Coast up ' + r.coastup.dur + ' s → apogee ' + p.apogee + ' km at ' + tplus(apogeeT) + ' (' + meco + ' + ' + r.coastup.dur + ')\n' +
        'Coast down ' + r.coastdown.dur + ' s → re-entry interface at ' + tplus(ifaceT) + ' (' + apogeeT + ' + ' + r.coastdown.dur + ')\n' +
        'Glide ' + r.glide.dur + ' s → touchdown at ' + tplus(total) + ' = ' + mmss(total) + ' total\n' +
        'Weightless window: ' + tplus(ifaceT) + ' − ' + tplus(meco) + ' = ' + weightless + ' s = ' + mmss(weightless) + '\n' +
        'Above 100 km: ' + tplus(r.c100d.t) + ' − ' + tplus(r.c100u.t) + ' = ' + a100 + ' s\n' +
        'Above 80.5 km: ' + tplus(r.c80d.t) + ' − ' + tplus(r.c80u.t) + ' = ' + a80 + ' s = ' + mmss(a80);
    }
    compute();
  }

  /* ==========================================================
     ENGAGEMENT ESTIMATOR
     Rates are parsed from the printed fee table (rows carry
     data-rate), so the estimate and the printed fees cannot
     disagree. A planning estimate, never a quote.
     ========================================================== */
  var feeTable = document.getElementById('feeTable');
  var est = document.getElementById('estimator');
  if (feeTable && est) {
    var rates = {};
    feeTable.querySelectorAll('tr[data-key]').forEach(function (tr) {
      rates[tr.getAttribute('data-key')] = parseFloat(tr.getAttribute('data-rate'));
    });
    var state = { train: 6, review: 2, parts: 0, sim: true };
    var limits = { train: [0, 30], review: [0, 20], parts: [0, 24] };
    var valEls = {
      train: document.getElementById('svTrain'),
      review: document.getElementById('svReview'),
      parts: document.getElementById('svParts')
    };
    var simBtn = document.getElementById('simToggle');
    var totalEl = document.getElementById('eTotal');
    var workEl = document.getElementById('eWork');

    est.querySelectorAll('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-k'), step = parseInt(b.getAttribute('data-step'), 10);
        var v = state[key] + step;
        if (v < limits[key][0]) v = limits[key][0];
        if (v > limits[key][1]) v = limits[key][1];
        state[key] = v;
        valEls[key].textContent = v;
        eCompute();
      });
    });
    if (simBtn) {
      simBtn.addEventListener('click', function () {
        state.sim = !state.sim;
        simBtn.setAttribute('aria-pressed', state.sim ? 'true' : 'false');
        simBtn.textContent = state.sim ? 'Simulator block — included' : 'Simulator block — excluded';
        eCompute();
      });
    }
    function eCompute() {
      var t = state.train * rates.train;
      var r = state.review * rates.review;
      var pp = state.parts * rates.parts;
      var s = state.sim ? rates.sim : 0;
      var total = t + r + pp + s;
      totalEl.textContent = money(total);
      workEl.textContent =
        'Crew training: ' + state.train + ' days × ' + money(rates.train) + ' = ' + money(t) + '\n' +
        'Profile & safety review: ' + state.review + ' days × ' + money(rates.review) + ' = ' + money(r) + '\n' +
        'Participant preparation: ' + state.parts + ' × ' + money(rates.parts) + ' = ' + money(pp) + '\n' +
        'Simulator block: ' + (state.sim ? money(rates.sim) + ' (included)' : '$0 (excluded)') + '\n' +
        'Planning total: ' + money(total) + ' — an estimate for planning, not a quote.';
    }
    eCompute();
  }

  /* ==========================================================
     ENQUIRY FORM — demonstration only; nothing is transmitted.
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirm = document.getElementById('confirmBox');
    var fields = {
      name: { el: document.getElementById('fName'), err: document.getElementById('eName'),
              test: function (v) { return v.trim().length >= 2; }, msg: 'Please give your name.' },
      org: { el: document.getElementById('fOrg'), err: document.getElementById('eOrg'),
             test: function (v) { return v.trim().length >= 2; }, msg: 'Please give your organisation (or “independent”).' },
      email: { el: document.getElementById('fEmail'), err: document.getElementById('eEmail'),
               test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: 'Please give a valid email address.' },
      type: { el: document.getElementById('fType'), err: document.getElementById('eType'),
              test: function (v) { return v !== ''; }, msg: 'Please choose an enquiry type.' },
      msg: { el: document.getElementById('fMsg'), err: document.getElementById('eMsg'),
             test: function (v) { return v.trim().length >= 10; }, msg: 'A sentence or two about the programme (10+ characters).' }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var valid = f.test(f.el.value);
        f.err.hidden = valid;
        if (!valid) { ok = false; if (!firstBad) firstBad = f.el; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = 'NFA-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmEcho').textContent =
        'Thank you, ' + fields.name.el.value.trim() + ' (' + fields.org.el.value.trim() + '). ' +
        'Your enquiry is logged under the reference above. On the real practice this is answered by email within two working days.';
      form.hidden = true;
      confirm.hidden = false;
      confirm.setAttribute('tabindex', '-1');
      confirm.focus({ preventScroll: true });
    });
  }
})();
