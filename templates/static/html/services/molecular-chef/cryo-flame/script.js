/* cryo-flame — shared script.
   Sound ruling: FAILS the need-test. A chef's profession is taste,
   smell and temperature — not sound — and no interaction here
   teaches through audio, so there is no audio anywhere on this
   site. The stub's hover-triggered pop synth (an AudioContext
   created on page load) was deleted, not rebuilt. */
document.documentElement.classList.add('js');

/* View-transition abort guard (narrowly filtered, program standard) */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile panel ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobilePanel');
  if (!btn || !panel) return;
  var scrim = document.querySelector('.scrim');
  var closeBtn = panel.querySelector('.close');
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    if (scrim) scrim.classList.add('on');
    document.body.classList.add('lock');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (closeBtn) closeBtn.focus(); });
    });
  }
  function close() {
    panel.classList.remove('open');
    if (scrim) scrim.classList.remove('on');
    document.body.classList.remove('lock');
    btn.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
  panel.querySelectorAll('nav a').forEach(function (a) {
    a.addEventListener('click', close);
  });
})();

/* ---------- reveals (opacity only) ---------- */
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
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- temperature explorer (index only) ---------- */
(function () {
  var sheet = document.getElementById('sheet');
  if (!sheet) return;
  var PROC = {
    ln2: {
      name: 'Freeze — liquid nitrogen', band: '−196 °C', cls: 'cold',
      what: 'Nitrogen boils at −196 °C at ordinary pressure. Stirred through a base, it freezes the mix in about two minutes — and freezing that fast keeps the ice crystals too small to feel on the tongue. The texture is the point. The fog is what the cold does to the air on the way.',
      rule: 'Food-grade nitrogen (E941) only, poured with cryogenic gloves and eye protection, in a ventilated room — one litre of liquid becomes roughly 700 litres of gas. Nothing is served until every trace has boiled off, and nitrogen is never sealed into a closed vessel: warming gas expands, and a sealed bottle becomes a pressure vessel.',
      time: 'About 2 minutes per 2-litre batch at the bench; portioned and plated inside a minute.',
      book: 'Booked as: chef\u2019s-table evenings · event stations',
      price: 'from €1,850 / evening · €1,200 / station'
    },
    dryice: {
      name: 'Chill & vapour — dry ice', band: '−78.5 °C', cls: 'cold',
      what: 'Solid carbon dioxide sublimes at −78.5 °C — it passes straight from solid to gas, with no puddle. The white cloud is not smoke: it is water vapour from the room\u2019s air, condensing in the cold gas. Here it holds a serving piece at temperature, and chills fast without diluting anything.',
      rule: 'Gloves for every touch — at −78.5 °C it burns skin the way heat does. The room is ventilated, because CO\u2082 pools at floor level. It never sits loose in food or drink: caged infusers, cloches and perforated plates only, and it is fully sublimed before anything is eaten or drunk.',
      time: 'A 1 kg block holds a service of about 3 hours.',
      book: 'Booked as: event stations · menu R&D',
      price: 'from €1,200 / station · €650 / day'
    },
    blast: {
      name: 'Blast chill — the cold chain', band: '+70 °C → +3 °C', cls: 'cold',
      what: 'Cooked food cools slowly through the warm band where bacteria multiply fastest. A blast chiller pulls the core from +70 °C down to +3 °C inside 90 minutes — the working figure in the food-safety guidance this kitchen runs to — so a sauce made at noon is safe at seven, and still tastes like it was made at noon.',
      rule: 'The probe goes in the thickest part, and the reading is logged for every batch. Shallow trays only — depth is what defeats chilling. The log, not anyone\u2019s memory, is what an inspector is shown.',
      time: '\u2264 90 minutes, core probed and logged.',
      book: 'Booked as: process & safety audits · masterclasses',
      price: '€540 fixed · €980 / day'
    },
    sousvide: {
      name: 'Hold — sous vide bath', band: '54–65 °C', cls: '',
      what: 'Food sealed and held in water at its exact serving temperature. In the 54–65 °C band, proteins set gradually and evenly — no grey ring of overdone outside around a raw middle. What the bath cannot do is brown anything. That is the sear\u2019s job, afterwards.',
      rule: 'Temperature alone is not safety; time at temperature is. The kitchen works to published time–temperature tables — a core held at 60 °C needs its full table time — and food is not held below 54 °C. Baths are checked against a reference thermometer weekly, and the check is logged.',
      time: '45 minutes to 4 hours by cut, per the printed tables.',
      book: 'Booked as: masterclasses · menu R&D',
      price: '€980 / day · €650 / day'
    },
    sear: {
      name: 'Sear & char — pan and torch', band: '150–230 °C', cls: 'hot',
      what: 'Above roughly 140 °C, amino acids and sugars react — the Maillard reaction — and build the roasted flavours a bath cannot. A pan surface at 150–230 °C does it in under a minute a side. Push past the top of the band and you are charring: a little bitterness is a seasoning; more is just a mistake.',
      rule: 'A dry surface, a heavy pan, seconds counted out loud. Fat spits, so sleeves stay down and handles stay turned. Torch work is a finishing pass of seconds — the flame kept blue and moving, never left dwelling on sugar until it turns to carbon.',
      time: '30–90 seconds per side; rested before it is cut.',
      book: 'Booked as: chef\u2019s-table evenings',
      price: 'from €1,850 / evening'
    }
  };
  var btns = Array.prototype.slice.call(document.querySelectorAll('.proc'));
  var el = {
    name: document.getElementById('sName'), band: document.getElementById('sBand'),
    what: document.getElementById('sWhat'), rule: document.getElementById('sRule'),
    time: document.getElementById('sTime'), book: document.getElementById('sBook'),
    price: document.getElementById('sPrice')
  };
  var rows = {};
  document.querySelectorAll('table.ref tr[data-proc]').forEach(function (tr) {
    rows[tr.getAttribute('data-proc')] = tr;
  });
  function show(key) {
    var p = PROC[key];
    if (!p) return;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-p') === key ? 'true' : 'false'); });
    el.name.textContent = p.name;
    el.band.textContent = p.band;
    el.band.className = 's-band' + (p.cls ? ' ' + p.cls : '');
    el.what.textContent = p.what;
    el.rule.textContent = p.rule;
    el.time.textContent = p.time;
    el.book.textContent = p.book;
    el.price.textContent = p.price;
    Object.keys(rows).forEach(function (k) { rows[k].classList.toggle('hl', k === key); });
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-p')); });
  });
  show('ln2');
})();

/* ---------- nitrogen worksheet (index only) ---------- */
(function () {
  var input = document.getElementById('kg');
  if (!input) return;
  var PARTS = { serve: [78, 250, 10], store: [78, 250, 34] };
  var USABLE = 233, DENSITY = 0.807, GAS_PER_L = 0.7;
  var target = 'serve';
  var o = {
    perKgW: document.getElementById('oPerKgW'), perKg: document.getElementById('oPerKg'),
    totalW: document.getElementById('oTotalW'), total: document.getElementById('oTotal'),
    kg: document.getElementById('oKg'), l: document.getElementById('oL'),
    gas: document.getElementById('oGas'), warn: document.getElementById('warnText')
  };
  function fmt(n, dp) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function kgLabel(v) { return fmt(v, (v % 1) ? 1 : 0); }
  function calc() {
    var kg = parseFloat(input.value);
    if (isNaN(kg)) return;
    kg = Math.min(20, Math.max(0.5, kg));
    var parts = PARTS[target];
    var perKg = parts[0] + parts[1] + parts[2];
    var total = perKg * kg;
    var ln2kg = total / USABLE;
    var ln2l = ln2kg / DENSITY;
    var gas = ln2l * GAS_PER_L;
    o.perKgW.textContent = 'Heat to remove, per kg (' + parts[0] + ' + ' + parts[1] + ' + ' + parts[2] + ')';
    o.perKg.textContent = fmt(perKg, 0) + ' kJ';
    o.totalW.textContent = 'Heat to remove, ' + kgLabel(kg) + ' kg in total';
    o.total.textContent = fmt(total, 0) + ' kJ';
    o.kg.textContent = fmt(ln2kg, 1) + ' kg';
    o.l.textContent = fmt(ln2l, 1) + ' L';
    o.gas.textContent = fmt(gas, 1) + ' m\u00B3';
    o.warn.innerHTML = '<b>' + fmt(ln2l, 1) + ' litres</b> of liquid becomes about <b>' +
      fmt(gas, 1) + ' m\u00B3</b> of nitrogen gas. It has to go somewhere: the room\u2019s air ' +
      'changes must clear it, and nobody leans over the bowl to watch it happen. This is why ' +
      'the pour happens at the pass, under extraction — not at the table, in a guest\u2019s face.';
  }
  input.addEventListener('input', calc);
  input.addEventListener('change', function () {
    var kg = parseFloat(input.value);
    if (isNaN(kg)) { input.value = 5; }
    else { input.value = Math.min(20, Math.max(0.5, kg)); }
    calc();
  });
  document.getElementById('kgDown').addEventListener('click', function () {
    var v = (parseFloat(input.value) || 5) - 0.5;
    input.value = Math.max(0.5, v); calc();
  });
  document.getElementById('kgUp').addEventListener('click', function () {
    var v = (parseFloat(input.value) || 5) + 0.5;
    input.value = Math.min(20, v); calc();
  });
  document.querySelectorAll('.toggles button').forEach(function (b) {
    b.addEventListener('click', function () {
      target = b.getAttribute('data-t');
      document.querySelectorAll('.toggles button').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      calc();
    });
  });
  calc();
})();

/* ---------- enquiry form (contact only) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var confirmRef = document.getElementById('confirmRef');
  var typeSel = document.getElementById('fType');
  /* preselect from ?type= (register / rate-card links) */
  try {
    var t = new URLSearchParams(window.location.search).get('type');
    if (t) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === t) { typeSel.value = t; break; }
      }
    }
  } catch (e) { /* older browser: no preselect, form still works */ }
  function row(input) { return input.closest('.frow'); }
  function mark(input, bad) {
    var r = row(input);
    if (r) r.classList.toggle('bad', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  var fName = document.getElementById('fName'),
      fEmail = document.getElementById('fEmail'),
      fMsg = document.getElementById('fMsg');
  function validate() {
    var ok = true, first = null;
    var checks = [
      [fName, fName.value.trim().length >= 2],
      [fEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.value.trim())],
      [typeSel, typeSel.value !== ''],
      [fMsg, fMsg.value.trim().length >= 20]
    ];
    checks.forEach(function (c) {
      if (!mark(c[0], !c[1])) { ok = false; if (!first) first = c[0]; }
    });
    if (first) first.focus();
    return ok;
  }
  [fName, fEmail, typeSel, fMsg].forEach(function (inp) {
    inp.addEventListener('input', function () { mark(inp, false); });
    inp.addEventListener('change', function () { mark(inp, false); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    confirmRef.textContent = 'NF-2026-' + (100 + Math.floor(Math.random() * 900));
    confirmBox.classList.add('show');
    confirmBox.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
  document.getElementById('sendAnother').addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('.frow.bad').forEach(function (r) { r.classList.remove('bad'); });
    confirmBox.classList.remove('show');
    fName.focus();
  });
})();
