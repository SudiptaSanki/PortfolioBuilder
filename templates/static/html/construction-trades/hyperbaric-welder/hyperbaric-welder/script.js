/* REID SUBSEA — interactions
   Sound ruling: FAILS the need-test. Commercial diving is not a sound
   profession and nothing on this site teaches through audio — dive
   communications are a safety system, not a design feature. The stub's
   arc-spark particle canvas was decoration and is deleted, not
   rebuilt. No audio anywhere on this site. */

'use strict';
document.documentElement.classList.add('js');

/* Cross-document view transitions can abort when a navigation is
   interrupted; Chrome surfaces that abort as an unhandled rejection.
   Swallow only that specific rejection — nothing else. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile log-index panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('logPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '✕ Close index';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    });
  }
  function close(returnFocus) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰ Log index';
    document.body.style.overflow = '';
    if (returnFocus) btn.focus();
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

/* ---------- reveal on scroll (opacity only; a job: log entries
   settle in reading order as the reader reaches them) ---------- */
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
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- the rate card: ONE data model ----------
   The printed rate-card table on index.html, the Depth & Pressure
   Explorer and the job estimator all read these same figures, so the
   three can never disagree. Rates are £ per operational day. */
var RATES = {
  jobs: {
    inspect: { label: 'Inspection & survey', mob: 950,
      team: 'Four on the surface team: dive supervisor, working diver, standby diver dressed ready to enter the water, and a tender. Helmet CCTV and stills as standard; ultrasonic thickness readings where the brief asks for them.' },
    wet: { label: 'Wet weld repair', mob: 1750,
      team: 'Five on the team: supervisor, diver-welder, standby diver, tender, and a topside welding technician who owns the set and the consumables. The weld is made in the water; what that means for the repair class is stated plainly in the sheet and in every report.' },
    habitat: { label: 'Dry habitat repair', mob: 8600,
      team: 'A full habitat spread: the habitat is sealed to the structure and the water excluded, so the weld is made dry, in gas, at the pressure of the surrounding depth. Chamber, control container and a rotating team topside; saturation crewing at the deeper bands.' },
    cutting: { label: 'Cutting & removal', mob: 1500,
      team: 'Five on the team, plus lift support agreed with the vessel or crane contractor before mobilisation. What comes off must have somewhere to go — the lift plan is written before the cut plan.' }
  },
  bands: [
    { id: 'b1', label: '0–10 m', rep: 8,
      depth: 'At 8 m the water adds less than one bar. Working time is generous and the decompression obligation for inspection-length dives is small. The limits at this depth are rarely pressure — they are visibility, current, and everything else moving in the water.' },
    { id: 'b2', label: '10–30 m', rep: 20,
      depth: 'At 20 m the diver breathes at three times surface pressure, and every minute on the bottom is planned. Working time shrinks, decompression stops become part of the dive plan rather than an afterthought, and breathing-gas reserves are sized with margin on top.' },
    { id: 'b3', label: '30–50 m', rep: 40,
      depth: 'At 40 m, air itself becomes the constraint: nitrogen narcosis and oxygen exposure are managed as planning limits, surface decompression or mixed-gas planning enters the conversation, and the decompression obligation after a working dive is measured in hours, not minutes.' },
    { id: 'b4', label: '50–90 m', rep: 70,
      depth: 'At 70 m this is saturation territory. The team lives under pressure in a chamber system for the whole campaign, travels to the work in a closed bell, and decompresses once, slowly, at the end. The plan is measured in weeks — which is exactly why the arithmetic is printed before anyone signs.' }
  ],
  /* rows: job key; columns: band index 0..3 */
  matrix: {
    inspect: [1850, 2050, 2450, 3400],
    wet:     [2600, 2950, 3500, 4600],
    habitat: [7900, 8600, 9400, 11800],
    cutting: [2300, 2600, 3100, 4200]
  }
};
function gbp(n) { return '£' + n.toLocaleString('en-GB'); }
function pressureAt(depthM) { return 1 + depthM / 10; }

/* ---------- Depth & Pressure Explorer (index) ---------- */
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;
  var state = { job: 'wet', band: 1 };
  var jobBtns = root.querySelectorAll('[data-job]');
  var bandBtns = root.querySelectorAll('[data-band]');
  var el = {
    pressure: document.getElementById('exPressure'),
    depthText: document.getElementById('exDepth'),
    teamText: document.getElementById('exTeam'),
    rateText: document.getElementById('exRate')
  };
  function render() {
    var band = RATES.bands[state.band];
    var job = RATES.jobs[state.job];
    var p = pressureAt(band.rep);
    el.pressure.innerHTML = '1 + ' + band.rep + ' ÷ 10 = <span class="calc">' +
      p.toFixed(1) + ' bar</span> absolute at ' + band.rep + ' m';
    el.depthText.textContent = band.depth;
    el.teamText.textContent = job.team;
    el.rateText.textContent = gbp(RATES.matrix[state.job][state.band]) +
      ' per day — ' + job.label + ', ' + band.label + ' band, from the rate card below.';
    jobBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-job') === state.job ? 'true' : 'false');
    });
    bandBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', Number(b.getAttribute('data-band')) === state.band ? 'true' : 'false');
    });
    /* highlight the matching cell of the printed rate card */
    document.querySelectorAll('#rateTable td[data-cell]').forEach(function (td) {
      td.classList.toggle('hl-cell', td.getAttribute('data-cell') === state.job + ':' + state.band);
    });
    document.querySelectorAll('#rateTable tr[data-row]').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-row') === state.job);
    });
  }
  jobBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.job = b.getAttribute('data-job'); render(); });
  });
  bandBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.band = Number(b.getAttribute('data-band')); render(); });
  });
  render();
})();

/* ---------- job estimator (index) ---------- */
(function () {
  var form = document.getElementById('estimator');
  if (!form) return;
  var jobSel = document.getElementById('estJob');
  var bandSel = document.getElementById('estBand');
  var daysIn = document.getElementById('estDays');
  var out = {
    days: document.getElementById('estLineDays'),
    mob: document.getElementById('estLineMob'),
    total: document.getElementById('estLineTotal')
  };
  function render() {
    var job = jobSel.value, band = Number(bandSel.value);
    var days = Math.max(1, Math.min(60, parseInt(daysIn.value, 10) || 1));
    var rate = RATES.matrix[job][band];
    var mob = RATES.jobs[job].mob;
    out.days.textContent = days + ' day' + (days === 1 ? '' : 's') + ' × ' + gbp(rate) + ' = ' + gbp(days * rate);
    out.mob.textContent = 'Mobilisation (' + RATES.jobs[job].label + ') = ' + gbp(mob);
    out.total.textContent = 'Estimate total = ' + gbp(days * rate + mob);
  }
  [jobSel, bandSel, daysIn].forEach(function (c) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  });
  render();
})();

/* ---------- enquiry form (contact) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirm = document.getElementById('confirmBox');
  var refEl = document.getElementById('confirmRef');
  var typeSel = document.getElementById('fType');

  /* preselect from ?type= (register / explorer links) */
  var wanted = new URLSearchParams(window.location.search).get('type');
  if (wanted && typeSel) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
    }
  }

  function setInvalid(input, bad) {
    var fld = input.closest('.fld');
    if (fld) fld.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validate() {
    var ok = true;
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMsg');
    ok = setInvalid(name, !name.value.trim()) && ok;
    ok = setInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = setInvalid(typeSel, !typeSel.value) && ok;
    ok = setInvalid(msg, !msg.value.trim()) && ok;
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector('.fld.invalid input, .fld.invalid select, .fld.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'RS-2026-' + Math.floor(100 + Math.random() * 900);
    refEl.textContent = ref;
    form.hidden = true;
    confirm.hidden = false;
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('.fld.invalid').forEach(function (f) { f.classList.remove('invalid'); });
    confirm.hidden = true;
    form.hidden = false;
    document.getElementById('fName').focus();
  });
  ['fName', 'fEmail', 'fType', 'fMsg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { setInvalid(input, false); });
  });
})();
