/* Fenn Glass Conservation — shared script.
   Sound ruling: this site makes no sound, by design. There is no audio code here. */

// View-transition abort guard: when Chrome aborts a cross-document view
// transition it surfaces an unhandled rejection; the navigation itself
// always completes, so swallow only that specific rejection.
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------------- mobile menu: the report index ---------------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('menu-panel');
  if (!btn || !panel) return;
  function close() {
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    panel.classList.remove('open');
  }
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    if (open) { close(); return; }
    btn.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    panel.classList.add('open');
    requestAnimationFrame(function () {
      var first = panel.querySelector('a');
      if (first) first.focus();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      close(); btn.focus();
    }
  });
})();

/* ---------------- the panel map, planner (index) ---------------- */
(function () {
  var map = document.getElementById('rose-map');
  if (!map) return;

  // This table is the same register printed on the page (Table R1) and the
  // hours table printed beside it (Table T2). The planner reads its numbers
  // from here so the tool and the printed report cannot disagree.
  var PANELS = {
    1:  { name: 'North petal',      colour: 'Ruby',    grade: 'B', gradeName: 'Stable — lead fatigued', action: 'Clean & consolidate in situ',        hours: 6,
          glass: 'Sound throughout; no cracks recorded at the 2026 survey.',
          paint: 'Stable. Minor wear to the grisaille border, consistent with age; no active flaking.',
          lead: 'Fatigued at the perimeter; solder joints and tie wires sound.' },
    2:  { name: 'North-east petal', colour: 'Sapphire', grade: 'C', gradeName: 'Deteriorating',          action: 'Bench conservation',                 hours: 22,
          glass: 'Two quarrels cracked. One 19th-century repair in mismatched glass — retained and recorded, not replaced.',
          paint: 'Loss of about 15% on the medallion figure; what survives is stable.',
          lead: 'Sound; no distortion measured.' },
    3:  { name: 'East-north petal', colour: 'Gold',    grade: 'A', gradeName: 'Sound',                    action: 'Monitor at annual inspection',       hours: 0,
          glass: 'Sound.', paint: 'Sound.', lead: 'Sound; releaded in the 1968 campaign and holding well.' },
    4:  { name: 'East petal',       colour: 'Green',   grade: 'D', gradeName: 'Critical',                 action: 'Bench conservation & partial relead', hours: 38,
          glass: 'Multiple cracks; one piece displaced 4 mm at the lower border.',
          paint: 'Flaking along the border pattern; loose flakes were consolidated during the survey itself.',
          lead: 'Failed. The panel bows 12 mm out of plane; two cames fractured.' },
    5:  { name: 'East-south petal', colour: 'Ruby',    grade: 'B', gradeName: 'Stable — lead fatigued',   action: 'Clean & consolidate in situ',        hours: 6,
          glass: 'Sound.', paint: 'Stable.', lead: 'Fatigued at the lower edge; ties sound.' },
    6:  { name: 'South-east petal', colour: 'Sapphire', grade: 'C', gradeName: 'Deteriorating',           action: 'Bench conservation',                 hours: 22,
          glass: 'One cracked quarry; surface pitting on the outer face from a century of weather.',
          paint: 'Loss of about 10%; the remainder stable.', lead: 'Sound.' },
    7:  { name: 'South petal',      colour: 'Gold',    grade: 'M', gradeName: 'Monitor only — intervention refused', action: 'No intervention — monitor only', hours: 0,
          glass: 'Sound but fragile; thin medieval pot metal, irreplaceable.',
          paint: 'The finest survival in the window: a medieval paint layer intact beneath later overpaint. Any cleaning would take the medieval surface with it.',
          lead: 'Fatigued but holding; the panel does not move.' },
    8:  { name: 'South-west petal', colour: 'Green',   grade: 'B', gradeName: 'Stable — lead fatigued',   action: 'Clean & consolidate in situ',        hours: 6,
          glass: 'Sound; one old edge-bond holding well.', paint: 'Stable.', lead: 'Fatigued at the perimeter.' },
    9:  { name: 'West-south petal', colour: 'Sapphire', grade: 'A', gradeName: 'Sound',                   action: 'Monitor at annual inspection',       hours: 0,
          glass: 'Sound.', paint: 'Sound.', lead: 'Sound.' },
    10: { name: 'West petal',       colour: 'Ruby',    grade: 'C', gradeName: 'Deteriorating',            action: 'Bench conservation',                 hours: 22,
          glass: 'Three hairline cracks, stable but lengthening between surveys.',
          paint: 'Loss of about 12% on the border pattern.', lead: 'Sound; slight bowing of 3 mm, recorded for comparison.' },
    11: { name: 'West-north petal', colour: 'Green',   grade: 'D', gradeName: 'Critical',                 action: 'Bench conservation & partial relead', hours: 38,
          glass: 'Cracks radiating from one impact point; two pieces loose in their cames.',
          paint: 'Stable where it survives; the impact area has lost its paint entirely.',
          lead: 'Failed around the impact point; the panel is held by its neighbours.' },
    12: { name: 'North-west petal', colour: 'Gold',    grade: 'B', gradeName: 'Stable — lead fatigued',   action: 'Clean & consolidate in situ',        hours: 6,
          glass: 'Sound.', paint: 'Stable; the silver-stain is unusually bright here.', lead: 'Fatigued at the upper edge.' }
  };
  var RATE = 30; // printed: 30 conservation hours per scaffold week

  var selected = {};
  var readout = document.getElementById('readout');
  var planLines = document.getElementById('plan-lines');
  var planTotal = document.getElementById('plan-total');
  var planRefusals = document.getElementById('plan-refusals');

  function fmt(n) { return n.toLocaleString('en-GB'); }

  function viewPanel(n) {
    var p = PANELS[n];
    document.getElementById('ro-panel').textContent = 'Panel ' + n + ' — ' + p.name;
    document.getElementById('ro-colour').textContent = p.colour + ' glass';
    var chip = document.getElementById('ro-grade');
    chip.textContent = 'Grade ' + p.grade + ' · ' + p.gradeName;
    chip.className = 'grade-chip g' + p.grade;
    document.getElementById('ro-glass').textContent = p.glass;
    document.getElementById('ro-paint').textContent = p.paint;
    document.getElementById('ro-lead').textContent = p.lead;
    document.getElementById('ro-action').textContent =
      p.grade === 'M' ? 'No intervention. Monitor only — see the refusal below.' :
      p.action + (p.hours ? ' — ' + p.hours + ' hours (Table T2)' : ' — 0 hours');
    document.getElementById('ro-refusal').hidden = p.grade !== 'M';
    var tog = document.getElementById('ro-toggle');
    tog.hidden = p.grade === 'M';
    tog.setAttribute('aria-pressed', selected[n] ? 'true' : 'false');
    tog.textContent = selected[n] ? 'Remove Panel ' + n + ' from the plan' : 'Add Panel ' + n + ' to the plan';
    tog.dataset.panel = n;
  }

  function renderPlan() {
    var keys = Object.keys(selected).map(Number).sort(function (a, b) { return a - b; });
    var hours = 0, html = '', refusals = '';
    keys.forEach(function (n) {
      var p = PANELS[n];
      if (p.grade === 'M') {
        refusals += '<p>Panel ' + n + ' — monitor only: intervention would destroy original medieval paint; the report recommends no action. It adds no hours and will not be scheduled.</p>';
      } else if (p.hours > 0) {
        hours += p.hours;
        html += '<li><span>Panel ' + n + ' — ' + p.action + '</span><span class="h">' + p.hours + ' h</span></li>';
      } else {
        html += '<li><span>Panel ' + n + ' — ' + p.action + '</span><span class="h">0 h</span></li>';
      }
    });
    if (!keys.length) {
      planLines.innerHTML = '<li class="plan-empty">No panels selected yet. Tap panels on the map, use the readout button, or use the register below.</li>';
    } else {
      planLines.innerHTML = html || '<li class="plan-empty">No chargeable panels selected — see the refusal note below.</li>';
    }
    var weeks = hours ? Math.ceil(hours / RATE) : 0;
    planTotal.innerHTML =
      '<span>Total conservation time <strong id="plan-hours">' + hours + ' hours</strong></span>' +
      '<span>Scaffold time <strong id="plan-weeks">' + weeks + (weeks === 1 ? ' week' : ' weeks') + '</strong></span>' +
      '<span>Working: ' + hours + ' h ÷ ' + RATE + ' h per scaffold week = ' + (hours / RATE).toFixed(1) + ', rounded up</span>';
    planRefusals.innerHTML = refusals;
    planRefusals.hidden = !refusals;
  }

  function togglePanel(n) {
    if (selected[n]) { delete selected[n]; } else { selected[n] = true; }
    var petal = map.querySelector('[data-panel="' + n + '"]');
    if (petal) petal.setAttribute('aria-pressed', selected[n] ? 'true' : 'false');
    document.querySelectorAll('.rowbtn[data-panel="' + n + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', selected[n] ? 'true' : 'false');
      b.textContent = selected[n] ? 'In plan' : 'Add to plan';
    });
    viewPanel(n);
    renderPlan();
  }

  map.querySelectorAll('.petal').forEach(function (petal) {
    var n = petal.getAttribute('data-panel');
    petal.addEventListener('click', function () { togglePanel(n); });
    petal.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(n); }
    });
  });
  document.querySelectorAll('.rowbtn[data-panel]').forEach(function (b) {
    b.addEventListener('click', function () { togglePanel(b.getAttribute('data-panel')); });
  });
  document.getElementById('ro-toggle').addEventListener('click', function () {
    togglePanel(this.dataset.panel);
  });

  viewPanel(4);
  renderPlan();
})();

/* ---------------- the booking estimator (index) ---------------- */
(function () {
  var table = document.getElementById('fee-table');
  if (!table) return;
  var DOC_FEE = 1250; // printed flat line: documentation & panel map, per window
  var LINES = {
    survey:  { val: 2, min: 1, max: 10, step: 1, rate: 950, unit: 'days',    text: 'Condition survey' },
    panels:  { val: 6, min: 0, max: 40, step: 1, rate: 780, unit: 'panels',  text: 'Panel conservation' },
    relead:  { val: 2, min: 0, max: 40, step: 1, rate: 420, unit: 'panels',  text: 'Releading' },
    glazing: { val: 0, min: 0, max: 60, step: 2, rate: 95,  unit: 'm²',      text: 'Protective glazing' }
  };
  function gbp(n) { return '£' + n.toLocaleString('en-GB'); }
  function render() {
    var total = DOC_FEE, html = '';
    Object.keys(LINES).forEach(function (k) {
      var L = LINES[k], sum = L.val * L.rate;
      total += sum;
      html += '<li><span>' + L.text + ' — ' + L.val + ' ' + L.unit + ' × ' + gbp(L.rate) + '</span><span>' + gbp(sum) + '</span></li>';
      var v = document.querySelector('[data-val="' + k + '"]');
      if (v) v.textContent = L.val;
    });
    html += '<li><span>Documentation &amp; panel map — flat, per window</span><span>' + gbp(DOC_FEE) + '</span></li>';
    document.getElementById('est-lines').innerHTML = html;
    document.getElementById('est-grand').textContent = gbp(total);
  }
  table.querySelectorAll('.stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      var L = LINES[b.getAttribute('data-line')];
      var d = Number(b.getAttribute('data-delta'));
      L.val = Math.min(L.max, Math.max(L.min, L.val + d * L.step));
      render();
    });
  });
  render();
})();

/* ---------------- the enquiry form (contact) ---------------- */
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  function setErr(id, msg) {
    var field = document.getElementById(id);
    var err = document.getElementById(id + '-err');
    if (err) err.textContent = msg || '';
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var building = document.getElementById('f-building').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var message = document.getElementById('f-message').value.trim();
    var ok = true;
    setErr('f-name', name ? '' : 'Please give your name.'); if (!name) ok = false;
    setErr('f-building', building ? '' : 'Please name the church or building.'); if (!building) ok = false;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr('f-email', emailOk ? '' : 'Please give a valid email address.'); if (!emailOk) ok = false;
    setErr('f-message', message.length >= 20 ? '' : 'Please describe the window in a sentence or two (20 characters or more).'); if (message.length < 20) ok = false;
    if (!ok) return;
    var ref = 'FG-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('conf-ref').textContent = ref;
    document.getElementById('conf-name').textContent = name;
    document.getElementById('conf-building').textContent = building;
    form.hidden = true;
    var conf = document.getElementById('confirmation');
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
})();
