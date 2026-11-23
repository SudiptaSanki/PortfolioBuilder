/* olfactory-notes — shared script.
   Sound ruling: FAILS the need-test. Perfumery is not a sound
   profession and no interaction here teaches through audio, so
   there is no audio anywhere on this site. The stub's hover
   "crystal mist" synth was deleted, not rebuilt. */
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

/* ---------- reveals ---------- */
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

/* ---------- formula explorer (index only) ---------- */
(function () {
  var organ = document.getElementById('organ');
  if (!organ) return;
  var MATERIALS = {
    top: {
      bergamot:  { name: 'Bergamot',    facet: 'bright citrus',    note: 'Earl-Grey peel brightness; the classic opening of the trade.' },
      lemon:     { name: 'Lemon',       facet: 'sharp citrus',     note: 'Cleaner and sharper than bergamot, gone sooner.' },
      pinkpepper:{ name: 'Pink pepper', facet: 'sparkling spice',  note: 'A rosy, fizzy spice — lift without fruit.' },
      basil:     { name: 'Basil',       facet: 'green herbal',     note: 'Green and aromatic; reads as a garden, not a grove.' }
    },
    heart: {
      rose:    { name: 'Damask rose', facet: 'rose floral',     note: 'Honeyed, deep floral — the heart most clients picture first.' },
      jasmine: { name: 'Jasmine',     facet: 'warm white floral', note: 'Rich and warm; a little goes a long way.' },
      lavender:{ name: 'Lavender',    facet: 'aromatic lavender', note: 'Herbal-floral and calming in structure; bridges top and heart.' },
      orris:   { name: 'Orris (iris)', facet: 'powdery iris',   note: 'Powdery, cool, violet-leaning; the most expensive tier on this bench.' }
    },
    base: {
      cedarwood:  { name: 'Cedarwood',  facet: 'dry cedarwood',    note: 'Dry, pencil-shaving wood; structure without sweetness.' },
      sandalwood: { name: 'Sandalwood', facet: 'creamy sandalwood', note: 'Soft, creamy wood; rounds every edge it touches.' },
      vetiver:    { name: 'Vetiver',    facet: 'earthy vetiver',    note: 'Rooty and earthy; the green that survives into the dry-down.' },
      vanilla:    { name: 'Vanilla',    facet: 'vanilla-balsamic',  note: 'Sweet balsamic warmth; use with restraint or it becomes the perfume.' }
    }
  };
  var sel = { top: 'bergamot', heart: 'rose', base: 'cedarwood' };
  var charEl = document.getElementById('charLine');
  var rows = {
    top: document.getElementById('rowTop'),
    heart: document.getElementById('rowHeart'),
    base: document.getElementById('rowBase')
  };
  function render() {
    var t = MATERIALS.top[sel.top], h = MATERIALS.heart[sel.heart], b = MATERIALS.base[sel.base];
    charEl.textContent = 'A ' + t.facet + ' opening over a ' + h.facet + ' heart, settling into a ' + b.facet + ' base.';
    rows.top.innerHTML = '<b>' + t.name + '.</b> <span>' + t.note + '</span>';
    rows.heart.innerHTML = '<b>' + h.name + '.</b> <span>' + h.note + '</span>';
    rows.base.innerHTML = '<b>' + b.name + '.</b> <span>' + b.note + '</span>';
    organ.querySelectorAll('.chip').forEach(function (chip) {
      var tier = chip.getAttribute('data-tier');
      chip.setAttribute('aria-pressed', chip.getAttribute('data-mat') === sel[tier] ? 'true' : 'false');
    });
  }
  organ.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      sel[chip.getAttribute('data-tier')] = chip.getAttribute('data-mat');
      render();
    });
  });
  render();

  /* concentration panel */
  var CONC = {
    cologne: { band: '2–5%', label: 'perfume concentrate, by convention', text: 'A refresh, not a presence. Worn close and briefly — typically one to two hours before it is a memory. The right answer for a splash, the wrong one for an evening.' },
    toilette: { band: '5–15%', label: 'perfume concentrate, by convention', text: 'The everyday strength. Clear projection for the first hour, then a polite fade — typically three to five hours on skin.' },
    parfum: { band: '15–20%', label: 'perfume concentrate, by convention', text: 'More base weight in the blend, so the dry-down lasts — typically six to eight hours. The structure you built in the explorer is most legible at this strength.' },
    extrait: { band: '20–30%', label: 'perfume concentrate, by convention', text: 'The longest-wearing and the closest-wearing. Strength is not loudness: an extrait often projects less than a toilette and simply stays. Priced accordingly — the concentrate is the expensive part.' }
  };
  var cBand = document.getElementById('cBand');
  var cText = document.getElementById('cText');
  document.querySelectorAll('.cbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = CONC[b.getAttribute('data-conc')];
      if (!c) return;
      cBand.innerHTML = c.band + ' <small>' + c.label + '</small>';
      cText.textContent = c.text;
      document.querySelectorAll('.cbtn').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
    });
  });

  /* estimator */
  var RATES = { bespoke: 1450, brand: 2900 };
  var ROUND = 160, PACK = 380;
  var svc = 'bespoke', rounds = 3;
  var svcBtns = document.querySelectorAll('[data-svc]');
  var minus = document.getElementById('rMinus'), plus = document.getElementById('rPlus');
  var rVal = document.getElementById('rVal');
  var packBox = document.getElementById('packBox');
  var packNote = document.getElementById('packNote');
  var work = document.getElementById('estWorking');
  function eur(n) { return '€' + n.toLocaleString('en-IE'); }
  function renderEst() {
    var base = RATES[svc];
    var extra = Math.max(0, rounds - 3);
    var pack = svc === 'brand' ? 0 : (packBox.checked ? PACK : 0);
    var total = base + extra * ROUND + pack;
    var lines = '';
    lines += '<div class="row"><span>' + (svc === 'bespoke' ? 'Bespoke commission (base)' : 'Brand fragrance development (base)') + '</span><span>' + eur(base) + '</span></div>';
    lines += '<div class="row"><span>Iteration rounds — ' + rounds + ' (' + extra + ' beyond the 3 included × ' + eur(ROUND) + ')</span><span>' + eur(extra * ROUND) + '</span></div>';
    if (svc === 'brand') {
      lines += '<div class="row"><span>Stability &amp; compliance documentation pack</span><span>included</span></div>';
    } else {
      lines += '<div class="row"><span>Stability &amp; compliance documentation pack</span><span>' + (packBox.checked ? eur(PACK) : 'not added') + '</span></div>';
    }
    lines += '<div class="row total"><span>Estimated total</span><span>' + eur(total) + '</span></div>';
    work.innerHTML = lines;
    rVal.textContent = rounds;
    minus.disabled = rounds <= 3;
    plus.disabled = rounds >= 8;
    if (svc === 'brand') {
      packBox.checked = true; packBox.disabled = true;
      packNote.textContent = 'Included in every brand development — a fragrance that cannot be documented cannot be sold.';
    } else {
      packBox.disabled = false;
      packNote.textContent = 'Recommended for any bespoke formula you may later take to a producer.';
    }
  }
  svcBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      svc = b.getAttribute('data-svc');
      svcBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderEst();
    });
  });
  minus.addEventListener('click', function () { if (rounds > 3) { rounds--; renderEst(); } });
  plus.addEventListener('click', function () { if (rounds < 8) { rounds++; renderEst(); } });
  packBox.addEventListener('change', renderEst);
  renderEst();
})();

/* ---------- contact form (contact only) ---------- */
(function () {
  var form = document.getElementById('enqForm');
  if (!form) return;
  var confirm = document.getElementById('confirmBox');
  var refEl = document.getElementById('confirmRef');
  var again = document.getElementById('sendAnother');
  /* ?type= preselect */
  var params = new URLSearchParams(window.location.search);
  var t = params.get('type');
  var sel = document.getElementById('fType');
  if (t && sel) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === t) { sel.selectedIndex = i; break; }
    }
  }
  function field(id) { return document.getElementById(id).closest('.field'); }
  function check() {
    var ok = true;
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMsg');
    [[name, name.value.trim().length >= 2], [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())], [sel, !!sel.value], [msg, msg.value.trim().length >= 10]].forEach(function (pair) {
      var f = field(pair[0].id);
      if (!pair[1]) { f.classList.add('bad'); ok = false; } else { f.classList.remove('bad'); }
    });
    return ok;
  }
  ['fName', 'fEmail', 'fType', 'fMsg'].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () { field(id).classList.remove('bad'); });
    el.addEventListener('change', function () { field(id).classList.remove('bad'); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) {
      var firstBad = form.querySelector('.field.bad input, .field.bad select, .field.bad textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var name = document.getElementById('fName').value.trim();
    var seed = 0;
    var s = name + sel.value + document.getElementById('fMsg').value.trim();
    for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) % 900;
    refEl.textContent = 'SM-2026-' + (100 + seed);
    form.style.display = 'none';
    confirm.classList.add('show');
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  if (again) again.addEventListener('click', function () {
    form.reset();
    confirm.classList.remove('show');
    form.style.display = '';
  });
})();
