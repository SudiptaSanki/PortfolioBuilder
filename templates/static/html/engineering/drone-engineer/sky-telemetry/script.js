/* Sky Telemetry — shared script.
   Sound ruling: FAILS the need-test. No audio anywhere — the stub's
   promised rotor synthesizer was decoration, and hover-triggered
   audio is a deal-breaker regardless. */
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

/* ---------- mobile menu ("Flight index" panel) ---------- */
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
        var first = panel.querySelector('.sheet a, .sheet button');
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
    if (e.target.closest('[data-close]') || e.target.closest('a')) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('locked');
    }
  });
})();

/* ---------- reveal on scroll (opacity-led, reduced-motion safe) ---------- */
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
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- Link Planner (index) ----------
   One data object drives the sheet; the printed band table on the
   same page carries the same bands, rates and ranges. */
(function () {
  var root = document.getElementById('linkPlanner');
  if (!root) return;
  var LINKS = {
    telem: {
      name: 'Telemetry radio',
      band: '868 / 915 MHz',
      carries: 'MAVLink telemetry — position, attitude, battery, mode — plus mission and parameter upload. This is the link the log is made of.',
      rate: '10–60 kbit/s usable, set by the radio air rate',
      range: '2–10 km line-of-sight on stock antennas; further behind a tracking antenna',
      latency: 'Tens of milliseconds — plenty for telemetry, wrong for hand-flying',
      fails: '<b>The Fresnel zone.</b> Drop the path into a roofline, a tree belt or the far side of a hangar and the margin goes first: the aircraft is still flying, the log just stops. Ground-side antenna height and pointing are the cheap fix nobody does.'
    },
    control: {
      name: 'Control link',
      band: '2.4 GHz',
      carries: 'The pilot\u2019s sticks, mode switches and the arm command — ExpressLRS / Crossfire class, or the maker\u2019s own link on integrated aircraft.',
      rate: 'Low data, high priority — small packets, sent often',
      range: '1–5 km in open country; a few hundred metres in a cluttered city block',
      latency: 'Single-digit to tens of milliseconds — this is the link the pilot feels',
      fails: '<b>Interference and shadowing.</b> 2.4 GHz is the most crowded band the aircraft owns, and one building between the sticks and the aircraft ends the conversation — which is why the lost-link failsafe is set and tested on the bench, never discovered in the air.'
    },
    video: {
      name: 'Video downlink',
      band: '5.8 GHz',
      carries: 'The camera feed the pilot or the inspector actually looks at — the picture the deliverable is judged by.',
      rate: 'Megabits, not kilobits — the hungriest link on the aircraft by a hundredfold',
      range: '0.5–3 km before breakup on typical fits; the first link to degrade',
      latency: 'Low on analogue and modern digital fits; glass-to-glass delay is the figure that matters for inspection flying',
      fails: '<b>Bandwidth starvation at range.</b> Video gives up long before telemetry does, so the plan treats it as a luxury: the aircraft must stay flyable, landable and fully logged with the picture gone.'
    },
    lte: {
      name: 'LTE command link',
      band: '4G / LTE',
      carries: 'Command, telemetry and log upload over the mobile network — the link that makes beyond-visual-line-of-sight work arguable at all.',
      rate: 'Whatever the cell gives you: plenty at 60 m over open fields, nothing in a dead spot',
      range: 'Network-shaped, not distance-shaped — read coverage maps, not kilometres',
      latency: 'Hundreds of milliseconds and variable — supervise with it, never hand-fly on it',
      fails: '<b>Coverage holes and handovers.</b> The budget stops being about your antennas and starts being about somebody else\u2019s mast — so LTE flies as the second link, with a radio link kept as the way home.'
    }
  };
  var chips = root.querySelectorAll('[data-link]');
  var f = {
    name: document.getElementById('lpName'),
    band: document.getElementById('lpBand'),
    carries: document.getElementById('lpCarries'),
    rate: document.getElementById('lpRate'),
    range: document.getElementById('lpRange'),
    latency: document.getElementById('lpLatency'),
    fails: document.getElementById('lpFails')
  };
  function render(key) {
    var d = LINKS[key];
    if (!d) return;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-link') === key ? 'true' : 'false'); });
    f.name.textContent = d.name;
    f.band.textContent = d.band;
    f.carries.textContent = d.carries;
    f.rate.textContent = d.rate;
    f.range.textContent = d.range;
    f.latency.textContent = d.latency;
    f.fails.innerHTML = d.fails;
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { render(c.getAttribute('data-link')); });
  });
  render('telem');
})();

/* ---------- Link Budget (index) ----------
   Free-space path loss: FSPL = 20*log10(d km) + 20*log10(f MHz) + 32.44.
   Margin is computed from unrounded figures and rounded only for
   display, so the panel always agrees with the printed worked example. */
(function () {
  var root = document.getElementById('linkBudget');
  if (!root) return;
  var BANDS = {
    '868':  { f: 868,  tx: 20, gt: 3, gr: 5, sens: -110 },
    '915':  { f: 915,  tx: 20, gt: 3, gr: 5, sens: -110 },
    '2400': { f: 2400, tx: 20, gt: 2, gr: 2, sens: -95 },
    '5800': { f: 5800, tx: 25, gt: 2, gr: 2, sens: -90 }
  };
  var chips = root.querySelectorAll('[data-band]');
  var range = document.getElementById('bRange');
  var rangeVal = document.getElementById('bRangeVal');
  var elFspl = document.getElementById('bFspl');
  var elRx = document.getElementById('bRx');
  var elMargin = document.getElementById('bMargin');
  var elVerdict = document.getElementById('bVerdict');
  var elVerdictText = document.getElementById('bVerdictText');
  var elTx = document.getElementById('bTxLine');
  var current = '915';
  function fmt(n) { return (Math.round(n * 10) / 10).toFixed(1).replace('-', '\u2212'); }
  function render() {
    var b = BANDS[current];
    var d = parseFloat(range.value);
    var fspl = 20 * Math.log10(d) + 20 * Math.log10(b.f) + 32.44;
    var rx = b.tx + b.gt + b.gr - fspl;
    var margin = rx - b.sens;
    rangeVal.textContent = fmt(d) + ' km';
    elFspl.textContent = fmt(fspl) + ' dB';
    elRx.textContent = fmt(rx) + ' dBm';
    elMargin.textContent = fmt(margin) + ' dB';
    elTx.textContent = 'TX ' + b.tx + ' dBm \u00B7 antennas +' + b.gt + ' / +' + b.gr +
      ' dBi \u00B7 receiver sensitivity ' + String(b.sens).replace('-', '\u2212') + ' dBm (typical fit for this band)';
    elVerdict.classList.remove('thin', 'no');
    if (margin >= 10) {
      elVerdictText.innerHTML = 'LINK CLOSES <small>With room to spare for cables, weather and optimism. This is where a working link lives.</small>';
    } else if (margin >= 0) {
      elVerdict.classList.add('thin');
      elVerdictText.innerHTML = 'THIN <small>It closes on paper. Antenna height, pointing and a clear Fresnel zone decide whether it closes in the field.</small>';
    } else {
      elVerdict.classList.add('no');
      elVerdictText.innerHTML = 'NO LINK <small>Free space alone eats the budget before a single tree gets a vote. Shorten the leg, raise an antenna, or change bands.</small>';
    }
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-band') === current ? 'true' : 'false'); });
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { current = c.getAttribute('data-band'); render(); });
  });
  range.addEventListener('input', render);
  render();
})();

/* ---------- enquiry form (contact) ----------
   Demonstration form: validates locally and confirms in-page with a
   generated reference. Nothing is transmitted or stored. */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var refEl = document.getElementById('confirmRef');
  var again = document.getElementById('sendAnother');
  var params = new URLSearchParams(window.location.search);
  var typeSel = document.getElementById('fType');
  if (typeSel && params.get('type')) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === params.get('type')) { typeSel.selectedIndex = i; break; }
    }
  }
  function field(id) { return document.getElementById(id); }
  function mark(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = field('fName'), email = field('fEmail'), msg = field('fMsg');
    var ok = true;
    ok = mark(name, !name.value.trim()) && ok;
    ok = mark(email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = mark(msg, !msg.value.trim()) && ok;
    if (!ok) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'JW-2026-' + Math.floor(100 + Math.random() * 900);
    refEl.textContent = ref;
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.setAttribute('tabindex', '-1');
    confirmBox.focus();
  });
  ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
    var input = field(id);
    if (input) input.addEventListener('input', function () { mark(input, false); });
  });
  if (again) {
    again.addEventListener('click', function () {
      form.reset();
      confirmBox.hidden = true;
      form.hidden = false;
      var first = field('fName');
      if (first) first.focus();
    });
  }
})();
