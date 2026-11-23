/* SECOND ROTATION — interactions
   Sound ruling: FAILS the need-test. A resale shop's work is visual
   inspection; the stub's cash-register beep was decoration and is
   deleted, not rebuilt. No audio anywhere on this site. */

'use strict';

/* Cross-document view transitions can abort when a navigation is
   interrupted; Chrome surfaces that abort as an unhandled rejection.
   Swallow only that specific rejection — nothing else. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile stock-list panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('stockPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '✕ Close list';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    });
  }
  function close(returnFocus) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰ Stock list';
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

/* ---------- reveal on scroll (opacity only; a job: ledger settles in reading order) ---------- */
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

/* ---------- Condition & Price Explorer ----------
   One data model. The printed rate-card table on index.html carries
   the same bands; the explorer reads from here and the probe checks
   the two agree. */
var SR_CATS = {
  runners:  { label: 'Runners',   note: 'Retro and modern running silhouettes' },
  hightops: { label: 'High-Tops', note: 'Basketball and high-cut lifestyle' },
  skate:    { label: 'Skate',     note: 'Vulc and cupsole skate shoes' },
  lowtops:  { label: 'Low-Tops',  note: 'Court and lifestyle low-tops' }
};
var SR_GRADES = {
  A: { name: 'Deadstock', code: 'Grade A · DS',
    means: 'Never worn, never tried on outside a carpet. Laces untouched, tissue and box as released. If we cannot prove it, it is not graded A.',
    checks: ['Provenance — receipt or release record checked where it exists', 'Construction — stitching, glue lines and panel alignment inspected', 'Labels & codes — size tag and production codes cross-checked against the release', 'UV light pass — no repairs, paint-overs or sole swaps', 'Second checker repeats the inspection blind and signs the card'],
    returns: '14 days. Tags attached, box as sold, unworn outdoors — if the tissue is disturbed we re-grade before refunding.' },
  B: { name: 'Tried On', code: 'Grade B · VNDS',
    means: 'Tried on indoors only. Soles show no outdoor contact — checked under light, not by eye from a metre away. The trade calls this VNDS; we write out what it means.',
    checks: ['Provenance — receipt or release record checked where it exists', 'Construction — stitching, glue lines and panel alignment inspected', 'Labels & codes — size tag and production codes cross-checked against the release', 'Soles under light — any outdoor grit or wear drops the grade to C', 'Second checker repeats the inspection blind and signs the card'],
    returns: '14 days, returned in the condition sold.' },
  C: { name: 'Excellent', code: 'Grade C · 9/10',
    means: 'Lightly worn — under ten wears by our wear map. Soles keep 90% or more of their tread pattern. No stains, no structural flaws.',
    checks: ['Construction — stitching, glue lines and panel alignment inspected', 'Labels & codes — size tag and production codes cross-checked against the release', 'Wear mapped and photographed — heel drag, creasing, tread depth', 'Cleaned by us before listing; the card says what was cleaned', 'Second checker repeats the inspection blind and signs the card'],
    returns: '7 days, returned in the condition sold.' },
  D: { name: 'Good', code: 'Grade D · 8/10',
    means: 'Honestly worn. Visible creasing and tread wear, all of it photographed before listing — never after you have paid. Cleaned and sanitised by us.',
    checks: ['Construction — stitching, glue lines and panel alignment inspected', 'Labels & codes — size tag and production codes cross-checked against the release', 'Wear mapped and photographed — heel drag, creasing, tread depth', 'Deep clean and sanitise; frayed laces replaced and declared on the card', 'Second checker repeats the inspection blind and signs the card'],
    returns: '7 days, returned in the condition sold.' },
  E: { name: 'Worn-In', code: 'Grade E · 7/10 & below',
    means: 'Worn in, and priced to be worn out. Heavy tread wear or cosmetic damage, every flaw written on the card. Authenticity is still fully checked — condition is the only thing discounted.',
    checks: ['Construction — stitching, glue lines and panel alignment inspected', 'Labels & codes — size tag and production codes cross-checked against the release', 'Every flaw written on the card — nothing described as “character”', 'Cleaned and sanitised before listing', 'Second checker repeats the inspection blind and signs the card'],
    returns: 'Final sale — no returns for condition. The lifetime authenticity guarantee still applies: if any pair we sell is ever shown to be not authentic, we refund in full — any grade, any date.' }
};
var SR_BANDS = { /* USD, [low, high] by grade A..E */
  runners:  { A: [180, 420], B: [150, 340], C: [110, 240], D: [75, 160],  E: [40, 90] },
  hightops: { A: [220, 650], B: [180, 520], C: [130, 360], D: [85, 220],  E: [45, 110] },
  skate:    { A: [90, 260],  B: [75, 210],  C: [55, 150],  D: [38, 95],   E: [20, 55] },
  lowtops:  { A: [120, 380], B: [100, 300], C: [70, 210],  D: [48, 130],  E: [25, 70] }
};
function srMoney(n) { return '$' + n.toLocaleString('en-US'); }

(function () {
  var sheet = document.getElementById('gradeSheet');
  if (!sheet) return;
  var cat = 'runners', grade = 'A';
  var el = {
    code: document.getElementById('gsCode'),
    name: document.getElementById('gsName'),
    means: document.getElementById('gsMeans'),
    checks: document.getElementById('gsChecks'),
    band: document.getElementById('gsBand'),
    bandNote: document.getElementById('gsBandNote'),
    returns: document.getElementById('gsReturns')
  };
  function render() {
    var g = SR_GRADES[grade], b = SR_BANDS[cat][grade];
    el.code.textContent = g.code + ' · ' + SR_CATS[cat].label;
    el.name.textContent = g.name;
    el.means.textContent = g.means;
    el.checks.innerHTML = '';
    g.checks.forEach(function (c) {
      var li = document.createElement('li');
      li.textContent = c;
      el.checks.appendChild(li);
    });
    el.band.textContent = srMoney(b[0]) + ' – ' + srMoney(b[1]);
    el.bandNote.textContent = SR_CATS[cat].label + ' at ' + g.code + '. From the printed rate card below — the card is the price, not a starting point for haggling theatre.';
    el.returns.textContent = g.returns;
    document.querySelectorAll('[data-cat]').forEach(function (b2) {
      b2.setAttribute('aria-pressed', b2.getAttribute('data-cat') === cat ? 'true' : 'false');
    });
    document.querySelectorAll('[data-grade]').forEach(function (b2) {
      b2.setAttribute('aria-pressed', b2.getAttribute('data-grade') === grade ? 'true' : 'false');
    });
  }
  document.querySelectorAll('[data-cat]').forEach(function (b) {
    b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); render(); });
  });
  document.querySelectorAll('[data-grade]').forEach(function (b) {
    b.addEventListener('click', function () { grade = b.getAttribute('data-grade'); render(); });
  });
  render();
})();

/* ---------- Sell-to-the-shop calculator ----------
   Printed splits: consignment 80% to the seller · trade-in credit 65%
   · cash 55%. The calculator applies exactly those, nothing hidden. */
(function () {
  var input = document.getElementById('resaleValue');
  if (!input) return;
  var out = {
    consign: document.getElementById('outConsign'),
    credit: document.getElementById('outCredit'),
    cash: document.getElementById('outCash')
  };
  function render() {
    var v = parseFloat(input.value);
    if (isNaN(v) || v < 0) v = 0;
    out.consign.textContent = srMoney(Math.round(v * 0.80));
    out.credit.textContent = srMoney(Math.round(v * 0.65));
    out.cash.textContent = srMoney(Math.round(v * 0.55));
  }
  input.addEventListener('input', render);
  render();
})();

/* ---------- enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirm = document.getElementById('confirmBox');
  var refEl = document.getElementById('confirmRef');
  var again = document.getElementById('sendAnother');

  var params = new URLSearchParams(window.location.search);
  var t = params.get('type');
  var typeSel = document.getElementById('ftype');
  if (t && typeSel && typeSel.querySelector('option[value="' + t + '"]')) typeSel.value = t;

  function hashRef(name, email) {
    var s = name + '|' + email, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'SR-2026-' + (100 + (h % 900));
  }
  function setBad(id, bad) {
    var fld = document.getElementById(id);
    if (fld) fld.classList.toggle('bad', bad);
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fname').value.trim();
    var email = document.getElementById('femail').value.trim();
    var type = typeSel ? typeSel.value : '';
    var msg = document.getElementById('fmsg').value.trim();
    var ok = true;
    ok = setBad('fld-name', name.length < 2) && ok;
    ok = setBad('fld-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = setBad('fld-type', !type) && ok;
    ok = setBad('fld-msg', msg.length < 10) && ok;
    if (!ok) {
      var firstBad = form.querySelector('.fld.bad input, .fld.bad select, .fld.bad textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    refEl.textContent = hashRef(name, email);
    form.hidden = true;
    confirm.classList.add('show');
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  ['fname', 'femail', 'fmsg'].forEach(function (id) {
    var i = document.getElementById(id);
    if (i) i.addEventListener('input', function () { i.closest('.fld').classList.remove('bad'); });
  });
  if (typeSel) typeSel.addEventListener('change', function () { typeSel.closest('.fld').classList.remove('bad'); });
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirm.classList.remove('show');
    document.getElementById('fname').focus();
  });
})();
