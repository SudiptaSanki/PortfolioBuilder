/* MacAllister Subsea — shared script.
   Sound ruling: FAILS the need-test. No audio anywhere — a sonar ping
   would be decoration, and hover audio is a deal-breaker. */
document.documentElement.classList.add('js');

/* View-transition abort guard: when Chrome aborts a cross-document
   view transition it surfaces an unhandled InvalidStateError rejection.
   Swallow only that exact rejection; every other error still shows. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile menu ("Dive plan" panel) ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobilePanel');
  if (!btn || !panel) return;
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus();
      });
    });
  }
  function close() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(); else open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('locked');
    }
  });
})();

/* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
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

/* ================================================================
   THE DIVE PLANNER (index)
   Vehicle class follows the task and the depth band. Current sets
   the working window. Every line below is a working rule of the
   trade, printed on the plan sheet — not decoration.
   ================================================================ */
(function () {
  var root = document.getElementById('planner');
  if (!root) return;

  var TASKS = {
    pipeline: {
      label: 'Pipeline inspection',
      sensors: 'HD video + stills, cathodic-protection (CP) probe, cleaning brush on standby',
      deliverables: [
        'KP-referenced video eventing log — every feature logged against the pipeline kilometre point',
        'CP potential readings at every field joint and anode',
        'Anomaly register, graded by severity, with stills',
        'As-found report in the operator\u2019s own template'
      ],
      watch: 'Crossings and free spans need slow, repeated passes — they are planned first, never left to the end of the dive.'
    },
    hull: {
      label: 'Hull inspection',
      sensors: 'HD video + stills, ultrasonic thickness spot-gaugings where coating allows, fouling camera scale',
      deliverables: [
        'Full hull video survey, zone by zone, bow to stern',
        'Coating and fouling grading per zone, with scale stills',
        'Anode wastage estimates as percentages, per anode',
        'Thruster, intake and sea-chest stills set',
        'Report formatted for class submission'
      ],
      watch: 'Harbour water is often turbid — if visibility at the hull falls under a metre, stills are worthless and the dive waits.'
    },
    cable: {
      label: 'Cable survey',
      sensors: 'Multibeam bathymetry (AUV), HD video at touchdown, subsea positioning throughout',
      deliverables: [
        'Route position list — the cable\u2019s actual position, not the as-laid drawing',
        'Depth-of-burial profile along the full route',
        'Free-span and exposure register with lengths and stills',
        'Crossing report for every asset crossed',
        'Bathymetry grid in the client\u2019s coordinate system'
      ],
      watch: 'A survey is only as good as its positioning. If the positioning degrades, the line is re-run — a pretty picture in the wrong place is worse than none.'
    },
    mooring: {
      label: 'Mooring check',
      sensors: 'HD video + stills, chain measurement calipers, water-jet / brush cleaning unit',
      deliverables: [
        'Chain diameter measurements against nominal, link by link at sample points',
        'Connector and shackle condition stills, cleaned before reading',
        'Marine growth grading per leg',
        'Riser and umbilical visual check along the same dive',
        'Wear summary against the last inspection, so trend is visible'
      ],
      watch: 'Chain cannot be measured through marine growth. Cleaning comes first, measurement second — any report that skips the cleaning is estimating, not measuring.'
    }
  };

  var DEPTHS = {
    d1: { label: '0\u201330 m', note: 'Divers could do this work — an ROV still wins on bottom time, and the survey is recorded, not remembered.' },
    d2: { label: '30\u2013100 m', note: 'Standard ROV territory. Air diving is at or past its practical limit here; the vehicle has no decompression clock.' },
    d3: { label: '100\u2013300 m', note: 'ROV or AUV only for practical purposes. Umbilical handling and launch sea-state become the planning constraints.' },
    d4: { label: '300\u20131,000 m', note: 'No diver option exists at this depth. Heavy work-class or full-depth AUV, long umbilical, moonpool or A-frame launch.' }
  };

  /* vehicle class: [task][depthBand] */
  var VEHICLES = {
    pipeline: { d1: 'Work-class ROV spread', d2: 'Work-class ROV spread', d3: 'Work-class ROV spread', d4: 'Heavy work-class ROV spread' },
    hull:     { d1: 'Observation-class ROV spread', d2: 'Observation-class ROV spread', d3: 'Work-class ROV spread (light intervention fit)', d4: 'Work-class ROV spread (light intervention fit)' },
    cable:    { d1: 'AUV survey spread + ROV touchdown checks', d2: 'AUV survey spread + ROV touchdown checks', d3: 'AUV survey spread + ROV touchdown checks', d4: 'AUV survey spread (full-depth rated) + work-class ROV touchdown checks' },
    mooring:  { d1: 'Work-class ROV spread', d2: 'Work-class ROV spread', d3: 'Work-class ROV spread', d4: 'Heavy work-class ROV spread' }
  };

  var CURRENTS = {
    c1: { label: '\u2264 0.5 kn', ok: true,  text: 'Full working window. Plan the dive around the task, not the tide — launch when ready.' },
    c2: { label: '0.5\u20131.0 kn', ok: true, text: 'Workable. Tether drag rises, so the vehicle flies up-current of the target and drifts down onto it. Slack windows are still diarised, not assumed.' },
    c3: { label: '1.0\u20131.5 kn', ok: true, text: 'Work-class holds station; observation-class vehicles are at their limit and get pushed off the workface. Fine measurement waits for slack.' },
    c4: { label: '> 1.5 kn', ok: false, text: 'NO LAUNCH. Above a knot and a half the umbilical becomes a sail and position-keeping eats the whole dive. We wait for slack water — that call is written into the plan, not argued on deck.' }
  };

  var state = { task: 'pipeline', depth: 'd2', current: 'c2' };
  var el = {
    vehicle: document.getElementById('planVehicle'),
    sensors: document.getElementById('planSensors'),
    window: document.getElementById('planWindow'),
    deliver: document.getElementById('planDeliver'),
    watch: document.getElementById('planWatch'),
    ref: document.getElementById('planRef')
  };

  function render() {
    var t = TASKS[state.task], d = DEPTHS[state.depth], c = CURRENTS[state.current];
    el.vehicle.textContent = VEHICLES[state.task][state.depth];
    el.sensors.textContent = t.sensors + ' \u00b7 ' + d.note;
    el.window.textContent = c.text;
    el.window.className = c.ok ? 'window-ok' : 'window-no';
    el.deliver.innerHTML = '';
    t.deliverables.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      el.deliver.appendChild(li);
    });
    el.watch.textContent = t.watch;
    el.ref.textContent = 'PLAN \u00b7 ' + t.label.toUpperCase() + ' \u00b7 ' + d.label.toUpperCase() + ' \u00b7 CURRENT ' + c.label.toUpperCase();
  }

  function wire(groupId, key) {
    var group = document.getElementById(groupId);
    if (!group) return;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-val]');
      if (!btn) return;
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      state[key] = btn.getAttribute('data-val');
      render();
    });
  }
  wire('taskSeg', 'task');
  wire('depthSeg', 'depth');
  wire('currentSeg', 'current');
  render();
})();

/* ================================================================
   DAY-COST ESTIMATOR (index)
   Rates are the printed rate card below — the estimator reads the
   same numbers the page publishes, and shows its arithmetic.
   ================================================================ */
(function () {
  var root = document.getElementById('estimator');
  if (!root) return;
  var gbp = function (n) { return '\u00a3' + n.toLocaleString('en-GB'); };
  var spreadSel = document.getElementById('estSpread');
  var vesselSel = document.getElementById('estVessel');
  var mobSel = document.getElementById('estMob');
  var seasonSel = document.getElementById('estSeason');
  var daysOut = document.getElementById('estDaysOut');
  var days = 6;
  var lines = document.getElementById('estLines');

  function optData(sel) {
    var o = sel.options[sel.selectedIndex];
    return { rate: parseInt(o.getAttribute('data-rate'), 10), label: o.getAttribute('data-label') };
  }
  function render() {
    daysOut.textContent = days + (days === 1 ? ' day' : ' days');
    var s = optData(spreadSel), v = optData(vesselSel), m = optData(mobSel);
    var season = seasonSel.options[seasonSel.selectedIndex];
    var lo = parseFloat(season.getAttribute('data-lo')), hi = parseFloat(season.getAttribute('data-hi'));
    var spreadTotal = s.rate * days, vesselTotal = v.rate * days, sub = spreadTotal + vesselTotal + m.rate;
    var cLo = Math.round(sub * lo), cHi = Math.round(sub * hi);
    var html = '';
    html += '<div class="ln"><span>' + s.label + ' \u00b7 ' + gbp(s.rate) + ' \u00d7 ' + days + 'd</span><span>' + gbp(spreadTotal) + '</span></div>';
    if (v.rate > 0) {
      html += '<div class="ln"><span>' + v.label + ' \u00b7 ' + gbp(v.rate) + ' \u00d7 ' + days + 'd</span><span>' + gbp(vesselTotal) + '</span></div>';
    } else {
      html += '<div class="ln"><span>' + v.label + '</span><span>not in estimate</span></div>';
    }
    html += '<div class="ln"><span>Mobilisation (one-off) \u00b7 ' + m.label + '</span><span>' + gbp(m.rate) + '</span></div>';
    html += '<div class="ln total"><span>Campaign subtotal</span><span>' + gbp(sub) + '</span></div>';
    html += '<div class="ln"><span>Weather contingency to budget (' + season.getAttribute('data-label') + ')</span><span>+' + gbp(cLo) + ' \u2013 ' + gbp(cHi) + '</span></div>';
    html += '<div class="ln grand"><span>Planning total</span><span>' + gbp(sub + cLo) + ' \u2013 ' + gbp(sub + cHi) + '</span></div>';
    lines.innerHTML = html;
  }
  document.getElementById('dayMinus').addEventListener('click', function () { if (days > 1) { days--; render(); } });
  document.getElementById('dayPlus').addEventListener('click', function () { if (days < 30) { days++; render(); } });
  [spreadSel, vesselSel, mobSel, seasonSel].forEach(function (sel) { sel.addEventListener('change', render); });
  render();
})();

/* ================================================================
   CONTACT FORM (contact) — demonstration form.
   Nothing is transmitted. Validation + in-page confirmation only,
   labelled as such on the page.
   ================================================================ */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var params = new URLSearchParams(window.location.search);
  var taskSel = document.getElementById('fTask');
  if (taskSel && params.get('task')) {
    for (var i = 0; i < taskSel.options.length; i++) {
      if (taskSel.options[i].value === params.get('task')) { taskSel.selectedIndex = i; break; }
    }
  }
  var confirmBox = document.getElementById('confirmBox');
  var errorBox = document.getElementById('formError');
  var refEl = document.getElementById('confirmRef');

  function fieldWrap(input) { return input.closest('.field'); }
  function setInvalid(input, bad) {
    var w = fieldWrap(input);
    if (w) w.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validate() {
    var ok = true;
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMessage');
    ok = setInvalid(name, name.value.trim().length < 2) && ok;
    ok = setInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
    ok = setInvalid(msg, msg.value.trim().length < 10) && ok;
    return ok;
  }
  ['fName', 'fEmail', 'fMessage'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () { setInvalid(input, false); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      errorBox.classList.add('show');
      errorBox.setAttribute('tabindex', '-1');
      errorBox.focus();
      return;
    }
    errorBox.classList.remove('show');
    var seed = (document.getElementById('fName').value.trim() + document.getElementById('fEmail').value.trim()).length;
    var ref = 'MS-2026-' + (100 + ((seed * 37) % 900));
    refEl.textContent = ref;
    form.style.display = 'none';
    confirmBox.classList.add('show');
    confirmBox.setAttribute('tabindex', '-1');
    confirmBox.focus();
  });
  var again = document.getElementById('sendAnother');
  if (again) {
    again.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      confirmBox.classList.remove('show');
      document.getElementById('fName').focus();
    });
  }
})();
