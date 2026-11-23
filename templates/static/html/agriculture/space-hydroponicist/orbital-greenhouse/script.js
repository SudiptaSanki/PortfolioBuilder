/* ORBITAL GREENHOUSE — interactions
   Sound ruling: FAILS the need-test. Growing is not a sound profession
   and nothing on this site teaches through audio; the stub's drifting
   mist-particle canvas was decoration and is deleted, not rebuilt.
   No audio anywhere on this site.
   The explorer and the estimator read ONE data model (CROPS / LIGHTS
   below), and the same figures are printed in Tables 1–2 on the page —
   the three cannot disagree. */

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

/* ---------- the one data model ---------- */
var CROPS = {
  leafy: {
    name: 'Leafy greens', detail: 'lettuce & salad leaves',
    min: 12, max: 17, cycle: 32, cycleNote: '(incl. 2 days sanitation between cycles)',
    yieldVal: 3.0, yieldUnit: 'kg', yieldLabel: '3.0 kg per m² of canopy per cycle — planning figure',
    perLabel: '3.0 kg/m²', watch: 'loose, pale heads when under-lit; tip burn on the inner leaves when pushed.'
  },
  herbs: {
    name: 'Herbs', detail: 'basil & soft herbs',
    min: 12, max: 18, cycle: 35, cycleNote: '(incl. 2 days sanitation between cycles)',
    yieldVal: 1.2, yieldUnit: 'kg', yieldLabel: '1.2 kg per m² of canopy per cycle — planning figure',
    perLabel: '1.2 kg/m²', watch: 'leggy, small-leaved, pale growth when under-lit; scorched leaf edges and stalled growth when pushed.'
  },
  fruiting: {
    name: 'Fruiting crops', detail: 'dwarf tomato',
    min: 20, max: 30, cycle: 75, cycleNote: '(sowing to first harvest; picking then continues)',
    yieldVal: 4.5, yieldUnit: 'kg', yieldLabel: '4.5 kg per m² of canopy per cycle — planning figure',
    perLabel: '4.5 kg/m²', watch: 'flowers dropping unlit when under; plants shutting down at midday and setting poorly when pushed.'
  },
  seedlings: {
    name: 'Seedlings', detail: 'propagation & young plants',
    min: 6, max: 12, cycle: 14, cycleNote: '(sowing to transplant-ready)',
    yieldVal: 12, yieldUnit: 'trays', yieldLabel: '12 trays (128-cell) per m² of bench per cycle — planning figure',
    perLabel: '12 trays/m²', watch: 'stretched, weak stems when under-lit — the windowsill failure, at bench scale; checked, slow growth when pushed.'
  }
};
var LIGHTS = {
  winter:   { name: 'Winter glasshouse — daylight only',   short: 'daylight only',        ppfd: 150, hours: 10 },
  toplight: { name: 'Glasshouse + LED top-light',          short: 'LED top-light',        ppfd: 250, hours: 14 },
  indoor:   { name: 'Indoor farm — full LED',              short: 'full LED',             ppfd: 300, hours: 16 },
  habitat:  { name: 'Habitat chamber — power-capped',      short: 'power-capped chamber', ppfd: 220, hours: 12 },
  highwire: { name: 'High-wire glasshouse — LED + HPS',    short: 'high-wire glasshouse', ppfd: 400, hours: 16 }
};
function dliOf(light) { return light.ppfd * light.hours * 0.0036; }
function fmtDli(v) { return (Math.round(v * 10) / 10).toFixed(1); }
function fmtNum(n) { return n.toLocaleString('en-GB'); }

/* ---------- mobile log-index panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('logPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '✕ Close index';
        document.body.style.overflow = 'hidden';
        if (firstLink) firstLink.focus();
      });
    });
  }
  function close(returnFocus) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰ Log index';
    document.body.style.overflow = '';
    window.setTimeout(function () { panel.hidden = true; }, 60);
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
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- the light & crop explorer ---------- */
(function () {
  var sheet = document.getElementById('sheet');
  if (!sheet) return;
  var state = { crop: 'leafy', light: 'toplight' };
  var cropBtns = Array.prototype.slice.call(document.querySelectorAll('[data-crop]'));
  var lightBtns = Array.prototype.slice.call(document.querySelectorAll('[data-light]'));
  var el = {
    title: document.getElementById('sheetTitle'),
    verdict: document.getElementById('sheetVerdict'),
    crop: document.getElementById('sheetCrop'),
    band: document.getElementById('sheetBand'),
    recipe: document.getElementById('sheetRecipe'),
    arith: document.getElementById('sheetArith'),
    dli: document.getElementById('sheetDli'),
    cycle: document.getElementById('sheetCycle'),
    cycleNote: document.getElementById('sheetCycleNote'),
    yield: document.getElementById('sheetYield'),
    lever: document.getElementById('sheetLever'),
    watch: document.getElementById('sheetWatch')
  };
  var LEVERS = {
    under: '<b>First lever: hours.</b> Extend the photoperiod before raising intensity — photons added by the clock are cheaper than photons added by the dimmer, and most crops tolerate a longer day better than a brighter one. If the day is already long, raise PPFD in steps of about 25 µmol and re-log after a week.',
    within: '<b>First lever: hold.</b> The recipe is inside the band; keep it, and log the DLI weekly — daylight drift moves the total even when the lamps never change.',
    over: '<b>First lever: hours, in reverse.</b> Shorten the day or dim before anything else. Surplus light is paid for twice — once in electricity, and again in quality faults the surplus causes.'
  };
  function render() {
    var c = CROPS[state.crop], l = LIGHTS[state.light];
    var d = dliOf(l);
    var status = d < c.min ? 'under' : (d > c.max ? 'over' : 'within');
    el.title.textContent = 'Log sheet — ' + c.name + ' under ' + l.short;
    el.crop.textContent = c.name + ' — ' + c.detail;
    el.band.textContent = c.min + '–' + c.max;
    el.recipe.innerHTML = l.name + ' — <span class="fig">' + l.ppfd + ' µmol·m⁻²·s⁻¹ × ' + l.hours + ' h</span>';
    el.arith.textContent = l.ppfd + ' × ' + l.hours + ' × 0.0036';
    el.dli.textContent = fmtDli(d);
    el.cycle.textContent = c.cycle + ' days';
    el.cycleNote.textContent = c.cycleNote;
    el.yield.textContent = c.yieldLabel;
    el.verdict.className = 'verdict ' + status;
    el.verdict.textContent = status === 'under'
      ? 'UNDER THE BAND — ' + fmtDli(d) + ' against a target of ' + c.min + '–' + c.max
      : status === 'over'
        ? 'OVER THE BAND — ' + fmtDli(d) + ' against a target of ' + c.min + '–' + c.max
        : 'INSIDE THE BAND — ' + fmtDli(d) + ' within a target of ' + c.min + '–' + c.max;
    el.lever.innerHTML = LEVERS[status];
    el.watch.innerHTML = '<b>Watch for:</b> ' + c.watch;
    cropBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-crop') === state.crop ? 'true' : 'false'); });
    lightBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-light') === state.light ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-crop-row]'), function (row) {
      row.classList.toggle('hl', row.getAttribute('data-crop-row') === state.crop);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-light-row]'), function (row) {
      row.classList.toggle('hl', row.getAttribute('data-light-row') === state.light);
    });
  }
  cropBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.crop = b.getAttribute('data-crop'); render(); });
  });
  lightBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.light = b.getAttribute('data-light'); render(); });
  });
  render();
})();

/* ---------- the production estimator ---------- */
(function () {
  var sel = document.getElementById('estCrop');
  var areaIn = document.getElementById('estArea');
  if (!sel || !areaIn) return;
  var title = document.getElementById('estTitle'),
      cycle = document.getElementById('estCycle'),
      cycles = document.getElementById('estCycles'),
      per = document.getElementById('estPer'),
      annual = document.getElementById('estAnnual');
  function render() {
    var c = CROPS[sel.value];
    var area = parseFloat(areaIn.value);
    if (!isFinite(area) || area <= 0) {
      title.textContent = 'Estimate — enter a canopy area';
      cycle.textContent = 'Cycle length: —';
      cycles.textContent = 'Cycles per year: —';
      per.textContent = 'Per cycle: —';
      annual.innerHTML = 'Annual production: —';
      return;
    }
    var full = Math.floor(365 / c.cycle);
    var raw = (365 / c.cycle).toFixed(1);
    var perVal = area * c.yieldVal;
    var annVal = perVal * full;
    var unit = c.yieldUnit;
    title.textContent = 'Estimate — ' + c.name + ' on ' + fmtNum(area) + ' m²';
    cycle.textContent = 'Cycle length: ' + c.cycle + ' days, sowing to harvest';
    cycles.textContent = 'Cycles per year: 365 ÷ ' + c.cycle + ' = ' + raw + ' → ' + full + ' full cycles';
    per.textContent = 'Per cycle: ' + fmtNum(area) + ' m² × ' + c.perLabel + ' = ' + fmtNum(perVal) + ' ' + unit;
    annual.innerHTML = 'Annual production: ' + fmtNum(perVal) + ' ' + unit + ' × ' + full + ' cycles = <span class="tot">' + fmtNum(annVal) + ' ' + unit + ' per year</span>';
  }
  sel.addEventListener('change', render);
  areaIn.addEventListener('input', render);
  render();
})();

/* ---------- enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var refEl = document.getElementById('confirmRef');
  var fields = {
    name: document.getElementById('fName'),
    email: document.getElementById('fEmail'),
    message: document.getElementById('fMsg')
  };
  /* preselect from rate-card links, e.g. contact.html?type=audit */
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type');
  var typeSel = document.getElementById('fType');
  if (type && typeSel && typeSel.querySelector('option[value="' + type + '"]')) {
    typeSel.value = type;
  }
  function mark(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okName = mark(fields.name, !fields.name.value.trim());
    var okEmail = mark(fields.email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim()));
    var okMsg = mark(fields.message, !fields.message.value.trim());
    if (!(okName && okEmail && okMsg)) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea, .field.invalid select');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'OG-2026-' + Math.floor(100 + Math.random() * 900);
    refEl.textContent = ref;
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });
  ['input', 'change'].forEach(function (evt) {
    form.addEventListener(evt, function (e) {
      var wrap = e.target.closest && e.target.closest('.field');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  });
  var again = document.getElementById('sendAnother');
  if (again) {
    again.addEventListener('click', function () {
      form.reset();
      confirmBox.hidden = true;
      form.hidden = false;
      fields.name.focus();
    });
  }
})();
