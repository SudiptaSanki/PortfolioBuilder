/* silver-iodide — Cole Weather Operations
   Sound ruling: FAILS the need-test — no audio anywhere on this site.
   Weather operations is not a sound profession and no interaction
   here teaches through audio. The stub's rain-droplet canvas and
   parallax were decoration and were honestly replaced by the working
   Seedability Check and season estimator (see CREDITS.md). */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort as unhandled rejections in
   Chrome when interrupted; the navigation itself always completes.
   Swallow only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile menu: the ops-log index ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (firstLink) firstLink.focus();
    }); });
  }
  function close(back) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('lock');
    if (back) btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(false); else open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
})();

/* ---------- reveals (opacity only) ---------- */
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

/* ---------- the Seedability Check ----------
   The rule, exactly as printed in Table 1's rule line:
   all five MET -> GO; any NOT MET -> NO-GO; any UNKNOWN with none
   failed -> INSUFFICIENT DATA. Nothing else is computed here. */
(function () {
  var list = document.getElementById('critList');
  if (!list) return;
  var crits = Array.prototype.slice.call(list.querySelectorAll('.crit'));
  var stamp = document.getElementById('verdictStamp');
  var why = document.getElementById('verdictWhy');
  var decide = document.getElementById('verdictDecide');
  var stateNames = { met: 'MET', not: 'NOT MET', unknown: 'UNKNOWN' };

  function getState(crit) {
    var pressed = crit.querySelector('[aria-pressed="true"]');
    return pressed ? pressed.getAttribute('data-state') : 'unknown';
  }

  function compute() {
    var rows = crits.map(function (crit, i) {
      return {
        ref: 'C' + (i + 1),
        name: crit.getAttribute('data-name'),
        state: getState(crit)
      };
    });
    var failed = rows.filter(function (r) { return r.state === 'not'; });
    var unknown = rows.filter(function (r) { return r.state === 'unknown'; });

    why.innerHTML = rows.map(function (r) {
      return '<div class="row"><span class="dot ' + r.state + '" aria-hidden="true"></span><span>' +
        r.ref + ' · ' + r.name + ' — <strong>' + stateNames[r.state] + '</strong></span></div>';
    }).join('');

    if (failed.length) {
      stamp.textContent = 'NO-GO';
      stamp.className = 'stamp nogo';
      decide.innerHTML = '<strong>Decided by ' + failed[0].ref + ' — ' + failed[0].name + ', NOT MET.</strong> ' +
        'One failed criterion ends the discussion: the sortie does not fly, the day is logged as a no-go, and standby is billed as printed. The remaining readings do not outvote it.';
    } else if (unknown.length) {
      stamp.textContent = 'INSUFFICIENT DATA';
      stamp.className = 'stamp insuff';
      var listU = unknown.map(function (r) { return r.ref; }).join(', ');
      decide.innerHTML = '<strong>No criterion has failed — but ' + listU + ' ' +
        (unknown.length === 1 ? 'is' : 'are') + ' still UNKNOWN.</strong> ' +
        'The rule returns INSUFFICIENT DATA: the sortie waits for evidence — a sounding, a radiometer reading, a clearance — not for optimism.';
    } else {
      stamp.textContent = 'GO';
      stamp.className = 'stamp go';
      decide.innerHTML = '<strong>All five criteria MET.</strong> ' +
        'The rule returns GO: the sortie may fly, the flares may burn — and the decision goes in the log with the same care as every no-go, because the season\'s evaluation will need both.';
    }
  }

  crits.forEach(function (crit) {
    crit.querySelectorAll('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        crit.querySelectorAll('.seg button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        compute();
      });
    });
  });
  var reset = document.getElementById('checkReset');
  if (reset) reset.addEventListener('click', function () {
    crits.forEach(function (crit) {
      crit.querySelectorAll('.seg button').forEach(function (o) {
        o.setAttribute('aria-pressed', o.getAttribute('data-state') === 'unknown' ? 'true' : 'false');
      });
    });
    compute();
  });
  compute();
})();

/* ---------- season estimator ---------- */
(function () {
  var root = document.getElementById('estimator');
  if (!root) return;
  var state = { hours: 40, gendays: 30, standby: 20 };
  var limits = { hours: [0, 120], gendays: [0, 120], standby: [0, 90] };
  var units = { hours: 'h', gendays: 'days', standby: 'days' };
  var ctrls = {};
  root.querySelectorAll('.qty-ctrl').forEach(function (c) { ctrls[c.getAttribute('data-key')] = c; });
  var lines = Array.prototype.slice.call(root.querySelectorAll('[data-line]'));
  var totalEl = document.getElementById('estTotal');
  var shareEl = document.getElementById('estShare');
  function usd(n) { return '$' + n.toLocaleString('en-US'); }
  function compute() {
    var total = 0, evalFee = 0, standbyAmt = 0;
    lines.forEach(function (el) {
      var rate = parseInt(el.getAttribute('data-rate'), 10);
      var kind = el.getAttribute('data-line');
      var amt;
      if (kind === 'qty') {
        var key = el.getAttribute('data-key');
        amt = rate * state[key];
        el.querySelector('[data-amt]').textContent = state[key] + ' ' + el.getAttribute('data-unit') + ' × ' + usd(rate) + ' = ' + usd(amt);
        if (key === 'standby') standbyAmt = amt;
      } else {
        amt = rate;
        el.querySelector('[data-amt]').textContent = usd(amt) + ' fixed';
        if (rate === 38000) evalFee = amt;
      }
      total += amt;
    });
    Object.keys(ctrls).forEach(function (key) {
      ctrls[key].querySelector('[data-val]').innerHTML = state[key] + ' <small>' + units[key] + '</small>';
    });
    totalEl.textContent = usd(total);
    var share = Math.round((evalFee / total) * 100);
    shareEl.innerHTML = '<strong>Evaluation is ' + usd(evalFee) + ' of this estimate — ' + share + '% — and it is neither optional nor contingent on the answer.</strong> ' +
      'Standby accounts for ' + usd(standbyAmt) + ': days the crew was ready, the criteria said no, and the aircraft stayed on the ground. That line is the price of a log you can defend.';
  }
  Object.keys(ctrls).forEach(function (key) {
    ctrls[key].querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = state[key] + parseInt(b.getAttribute('data-step'), 10);
        state[key] = Math.max(limits[key][0], Math.min(limits[key][1], v));
        compute();
      });
    });
  });
  compute();
})();

/* ---------- enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var confirm = document.getElementById('confirm');
  var params = new URLSearchParams(window.location.search);
  var typeSel = form.querySelector('#f-type');
  var wanted = params.get('type');
  if (typeSel && wanted) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
    }
  }
  function flag(input, errEl, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (errEl) errEl.classList.toggle('on', bad);
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.querySelector('#f-name');
    var email = form.querySelector('#f-email');
    var msg = form.querySelector('#f-msg');
    var ok = true;
    ok = flag(name, document.getElementById('e-name'), !name.value.trim()) && ok;
    ok = flag(email, document.getElementById('e-email'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = flag(msg, document.getElementById('e-msg'), !msg.value.trim()) && ok;
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var ref = 'CWO-2026-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('confirmRef').textContent = ref;
    form.hidden = true;
    confirm.hidden = false;
    var h = confirm.querySelector('h3');
    if (h) h.focus();
  });
  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirm.hidden = true;
  });
})();
