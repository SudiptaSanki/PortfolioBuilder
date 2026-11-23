/* Lawson Family Practice — template interactions.
   No audio: a GP practice's profession is not sound and nothing here
   teaches through audio, so the site is silent by design. */
document.documentElement.classList.add('js');

/* View-transition abort guard: when Chrome aborts a cross-document
   view transition, the rejection surfaces as an unhandled
   InvalidStateError. Swallow only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- Day-book mobile menu ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('daybook');
  if (!btn || !panel) return;
  var closeBtn = panel.querySelector('.db-close');
  var firstLink = panel.querySelector('nav a');
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    });
  }
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
    if (lastFocus) lastFocus.focus();
  }
  btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  panel.querySelector('.scrim').addEventListener('click', close);
  panel.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
})();

/* ---------- Reveal on scroll (opacity only in effect) ---------- */
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

/* ---------- Appointment planner ---------- */
var PLANNER = {
  first: {
    name: 'First visit', dur: '45 minutes', fee: '£120', feeNum: 120,
    lede: 'Your first appointment at the practice. Long enough for your full history, a proper examination and a plan we agree together — not a ten-minute slot with the clock on the door.',
    covers: ['Full medical history, taken once and recorded properly', 'Examination, as needed for what you bring', 'A written plan: what happens next, and when', 'Your records set up, with your previous notes requested'],
    not: ['Procedures — those are booked as a procedure slot, with time to do them well', 'Certificates and forms — on the printed fee list, charged separately'],
    bring: ['A list of every medicine you take, with doses', 'Any letters or results you already have', 'Your concerns, written down — all of them'],
    note: 'The fee is payable when you book. It includes the referral letter if we refer you on.'
  },
  standard: {
    name: 'Standard appointment', dur: '20 minutes', fee: '£75', feeNum: 75,
    lede: 'The everyday appointment: one main problem, dealt with properly, or the next step of care already under way. Twenty minutes is twice the slot most patients are used to.',
    covers: ['One main problem, examined and planned', 'Follow-up of an ongoing condition or treatment', 'Prescription reviews and repeat-medication checks', 'Results of tests we ordered, explained face to face'],
    not: ['A second, unrelated problem — book the extended review so both get their time', 'Procedures — booked separately as a procedure slot'],
    bring: ['Your medication list, if anything has changed', 'A readings diary (blood pressure, glucose) if we asked for one', 'The one question you most want answered'],
    note: 'If your problem needs more time on the day, we say so honestly and book the longer slot rather than rush.'
  },
  extended: {
    name: 'Extended review', dur: '40 minutes', fee: '£110', feeNum: 110,
    lede: 'For several things at once, an annual review, or a set of results that deserves a real conversation. This is the appointment the patient panel asked us to protect when we set the fee list.',
    covers: ['Several problems dealt with together, in one sitting', 'Annual review: medicines, checks due, screening status', 'A medication overhaul — what each drug is for, and whether it still earns its place', 'Test results discussed in depth, with the plan in writing'],
    not: ['Procedures — booked separately, though we can agree the plan here', 'A substitute for specialist care — if you need a specialist, we refer, and the letter is included'],
    bring: ['Every result and letter you have, in date order if you can', 'Your full medication list, including anything bought over the counter', 'Your questions, written down in the order that matters to you'],
    note: 'Plan members: one extended review a year is included in the plan — see the arithmetic below.'
  },
  procedure: {
    name: 'Minor procedure slot', dur: '30 minutes', fee: '£95', feeNum: 95,
    lede: 'A booked slot for the procedure we have already agreed in a consultation — joint injections, removal of small skin lesions, ear irrigation and similar. Never squeezed into an ordinary appointment.',
    covers: ['The agreed procedure, with local anaesthetic where needed', 'Dressings and an aftercare sheet to take home', 'A booked review of the site if it needs one', 'Consent talked through and signed before we start'],
    not: ['Laboratory or histology fees — charged at cost and quoted to you before anything is sent', 'A second procedure — one slot, one procedure, done carefully'],
    bring: ['Your signed consent form', 'A list of allergies and every medicine you take, especially blood thinners', 'Someone to drive you home if the procedure needs it — we will tell you at booking'],
    note: '£95 is the slot fee. Materials are at cost, quoted in advance; nothing is added afterwards.'
  }
};

(function () {
  var root = document.getElementById('planner');
  if (!root) return;
  var buttons = root.querySelectorAll('.planner-types button');
  var sheet = {
    name: document.getElementById('pl-name'),
    lede: document.getElementById('pl-lede'),
    covers: document.getElementById('pl-covers'),
    not: document.getElementById('pl-not'),
    bring: document.getElementById('pl-bring'),
    fee: document.getElementById('pl-fee'),
    dur: document.getElementById('pl-dur'),
    note: document.getElementById('pl-note'),
    cta: document.getElementById('pl-cta')
  };
  var rows = document.querySelectorAll('table.fees tbody tr[data-key]');

  function fillList(ul, items) {
    ul.innerHTML = '';
    items.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
  }
  function select(key) {
    var d = PLANNER[key];
    if (!d) return;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false'); });
    sheet.name.textContent = d.name;
    sheet.lede.textContent = d.lede;
    fillList(sheet.covers, d.covers);
    fillList(sheet.not, d.not);
    fillList(sheet.bring, d.bring);
    sheet.fee.textContent = d.fee;
    sheet.dur.textContent = d.dur + ' · with Dr Lawson';
    sheet.note.textContent = d.note;
    sheet.cta.href = 'contact.html?type=' + key;
    rows.forEach(function (r) { r.classList.toggle('hl', r.dataset.key === key); });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { select(b.dataset.key); });
  });
  select('first');
})();

/* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var pre = params.get('type');
  var typeSel = document.getElementById('f-type');
  if (pre && typeSel) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === pre) { typeSel.selectedIndex = i; break; }
    }
  }

  function field(id) { return document.getElementById(id).closest('.field'); }
  function validate() {
    var ok = true;
    var name = document.getElementById('f-name');
    var email = document.getElementById('f-email');
    var msg = document.getElementById('f-msg');
    [[name, name.value.trim().length >= 2],
     [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())],
     [msg, msg.value.trim().length >= 10]].forEach(function (pair) {
      var valid = pair[1];
      pair[0].closest('.field').classList.toggle('invalid', !valid);
      pair[0].setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid) ok = false;
    });
    return ok;
  }
  ['f-name', 'f-email', 'f-msg'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      this.closest('.field').classList.remove('invalid');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var seed = (document.getElementById('f-name').value + document.getElementById('f-email').value).split('')
      .reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) % 9973; }, 7);
    var ref = 'LFP-2026-' + (100 + (seed % 900));
    document.getElementById('cf-ref').textContent = ref;
    document.getElementById('cf-name').textContent = document.getElementById('f-name').value.trim();
    form.style.display = 'none';
    var conf = document.getElementById('confirm');
    conf.classList.add('show');
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });

  var again = document.getElementById('send-another');
  if (again) again.addEventListener('click', function () {
    document.getElementById('confirm').classList.remove('show');
    form.reset();
    form.style.display = '';
    document.getElementById('f-name').focus();
  });
})();
