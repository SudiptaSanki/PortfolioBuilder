/* neural-link — shared script.
   Sound ruling: NO audio. EEG has no soundtrack; the stub's hover beep
   synth was decoration and a deal-breaker (hover-triggered audio), and
   it has been deleted, not rebuilt. */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort noisily in Chromium when a
   navigation interrupts one; the abort surfaces as an unhandled
   rejection although the navigation completes. Swallow only that. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile menu: the notebook index ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  var scrim = document.getElementById('scrim');
  if (!btn || !panel) return;
  var closeBtn = panel.querySelector('.mp-close');
  var firstLink = panel.querySelector('.mp-links a');
  function open() {
    panel.classList.add('open');
    if (scrim) scrim.classList.add('open');
    document.documentElement.classList.add('locked');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    });
  }
  function close() {
    panel.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    document.documentElement.classList.remove('locked');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(); else open();
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      panel.classList.remove('open');
      if (scrim) scrim.classList.remove('open');
      document.documentElement.classList.remove('locked');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ---------- reveal on scroll (opacity only, has one job: pace the reading) ---------- */
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

/* ---------- Band Explorer ----------
   One data object drives the sheet; the printed table on the same page
   carries the identical range and amplitude strings. */
var BANDS = {
  delta: {
    name: 'Delta', symbol: 'δ', range: '0.5–4 Hz',
    character: 'Slow, tall waves — the largest deflections on the sheet.',
    amp: 'Up to ~100 µV in deep sleep',
    where: 'Across the whole scalp in deep (NREM) sleep. In babies it fills much of the record, waking or not.',
    notmean: 'Delta is not a “healing frequency”. In an awake adult, prominent delta is a finding for a clinician — never a wellness score, and never something a headband app can grade.'
  },
  theta: {
    name: 'Theta', symbol: 'θ', range: '4–8 Hz',
    character: 'Medium waves, gathering as alertness fades.',
    amp: 'About 10–50 µV',
    where: 'Creeping in with drowsiness and light sleep. A separate frontal-midline theta appears during sustained mental effort.',
    notmean: 'Theta is not a creativity switch. Mostly it is the signature of a brain drifting towards sleep — which is why “theta states” sold as a product should be read with care.'
  },
  alpha: {
    name: 'Alpha', symbol: 'α', range: '8–13 Hz',
    character: 'A regular, spindle-shaped rhythm — the steadiest handwriting on the sheet.',
    amp: 'About 10–50 µV',
    where: 'Back of the head (occipital), awake and relaxed with the eyes closed. It blocks — visibly shrinks — the moment the eyes open.',
    notmean: 'Alpha is not “calmness”, measured. It is the idling rhythm of the visual system, and it disappears when the eyes open and the visual world comes back in.'
  },
  beta: {
    name: 'Beta', symbol: 'β', range: '13–30 Hz',
    character: 'Fast, low, untidy activity — small waves, closely packed.',
    amp: 'About 5–20 µV',
    where: 'Frontal and central regions during alert, active thought. Also raised by some prescribed sedative medicines, which the recording log must note.',
    notmean: 'Beta is not a focus score. Forehead and jaw muscle writes in exactly this range, only louder — a “high beta” reading is a tense face until proven otherwise.'
  },
  gamma: {
    name: 'Gamma', symbol: 'γ', range: '30 Hz and up',
    character: 'Very fast, very small — at the scalp, mostly a rumour.',
    amp: 'A few µV at most',
    where: 'Reported over task-relevant cortex in research paradigms — and, far more strongly, wherever a muscle contracts or an eye flicks.',
    notmean: 'A gamma bump is usually muscle until proven otherwise. Scalp gamma sits in the same range as EMG and eye-movement spikes, and honest work treats it as guilty until cleared.'
  }
};

(function () {
  var tabs = document.querySelectorAll('.band-tabs button');
  if (!tabs.length) return;
  var traces = {
    delta: document.getElementById('trace-delta'),
    theta: document.getElementById('trace-theta'),
    alpha: document.getElementById('trace-alpha'),
    beta: document.getElementById('trace-beta'),
    gamma: document.getElementById('trace-gamma')
  };
  var el = {
    name: document.getElementById('bandName'),
    rangeTag: document.getElementById('bandRangeTag'),
    range: document.getElementById('bandRange'),
    character: document.getElementById('bandCharacter'),
    amp: document.getElementById('bandAmp'),
    where: document.getElementById('bandWhere'),
    notmean: document.getElementById('bandNotMean'),
    capName: document.getElementById('bandCapName')
  };
  function select(key) {
    var b = BANDS[key];
    if (!b) return;
    tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.band === key ? 'true' : 'false'); });
    /* SVG elements have no `hidden` IDL property — setting .hidden would
       create an expando and leave the attribute (and the rendering)
       untouched. Toggle the content attribute itself. */
    Object.keys(traces).forEach(function (k) {
      if (!traces[k]) return;
      if (k === key) traces[k].removeAttribute('hidden'); else traces[k].setAttribute('hidden', '');
    });
    el.name.textContent = b.name;
    el.rangeTag.textContent = b.range;
    el.range.textContent = b.range;
    el.character.textContent = b.character;
    el.amp.textContent = b.amp;
    el.where.textContent = b.where;
    el.notmean.textContent = b.notmean;
    if (el.capName) el.capName.textContent = b.name + ' ' + b.symbol;
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.band); });
  });
  select('alpha');
})();

/* ---------- Artefact panel ----------
   The trade's real skill: knowing what to throw away, and saying so. */
var ARTEFACTS = {
  blink: {
    name: 'Eye blink',
    signature: 'One large, smooth deflection, roughly 200–400 ms long, standing alone in an otherwise quiet trace.',
    where: 'Largest at the front of the head (Fp1/Fp2) and fading towards the back — the eyes are electrical, and they sit close to those electrodes.',
    size: 'Often 50–150 µV — bigger than any band on the reference table beside it.',
    handling: 'Record a dedicated eye channel (EOG) at every session, without exception. Then reject or correct the affected epochs — and log how many went. A blink must never be averaged into a result.'
  },
  muscle: {
    name: 'Muscle (EMG)',
    signature: 'A ragged burst of fast, dense activity that starts and stops like a switched-on motor.',
    where: 'The edges of the cap — jaw, forehead, temples, neck. Anywhere a participant is tense, cold, or holding their head still by effort.',
    size: 'Tens of µV, broadband above ~20 Hz — it swamps beta and gamma completely.',
    handling: 'Fix the person, not the file: a relaxed jaw, a supported head, a re-seated electrode, a break. Mark the segment in the log. No filter can tell muscle from gamma after the fact — the log has to.'
  },
  mains: {
    name: 'Mains hum',
    signature: 'A ruler-straight sine wave that never varies, identical cycle after identical cycle.',
    where: 'Every channel at once, and worst wherever electrode contact is poor. It is the building’s wiring, writing itself into the record.',
    size: 'Anything from a few µV to larger than the signal itself, depending on contact and cabling.',
    handling: 'Fix the cause first — electrode contact, grounding, cable runs away from power supplies. The notch filter is the last resort, set to the local mains: 50 Hz in Europe and most of the world, 60 Hz in the Americas. Filtering first and asking later is how real signal gets deleted quietly.'
  }
};

(function () {
  var tabs = document.querySelectorAll('.art-tabs button');
  if (!tabs.length) return;
  var traces = {
    blink: document.getElementById('trace-blink'),
    muscle: document.getElementById('trace-muscle'),
    mains: document.getElementById('trace-mains')
  };
  var el = {
    name: document.getElementById('artName'),
    signature: document.getElementById('artSignature'),
    where: document.getElementById('artWhere'),
    size: document.getElementById('artSize'),
    handling: document.getElementById('artHandling'),
    capName: document.getElementById('artCapName')
  };
  function select(key) {
    var a = ARTEFACTS[key];
    if (!a) return;
    tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.art === key ? 'true' : 'false'); });
    /* As above: attribute toggling, not the .hidden expando. */
    Object.keys(traces).forEach(function (k) {
      if (!traces[k]) return;
      if (k === key) traces[k].removeAttribute('hidden'); else traces[k].setAttribute('hidden', '');
    });
    el.name.textContent = a.name;
    el.signature.textContent = a.signature;
    el.where.textContent = a.where;
    el.size.textContent = a.size;
    el.handling.textContent = a.handling;
    if (el.capName) el.capName.textContent = a.name;
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.art); });
  });
  select('blink');
})();

/* ---------- contact form (demonstration — nothing is transmitted) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var params = new URLSearchParams(window.location.search);
  var typeSel = document.getElementById('f-type');
  var wanted = params.get('type');
  if (typeSel && wanted) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
    }
  }
  var confirm = document.getElementById('confirm');
  var confRef = document.getElementById('confRef');
  var confEcho = document.getElementById('confEcho');
  var again = document.getElementById('sendAnother');

  function field(id) { return document.getElementById(id); }
  function wrap(input) { return input.closest('.field'); }
  function mark(input, bad) { wrap(input).classList.toggle('invalid', bad); return !bad; }
  ['f-name', 'f-email', 'f-type', 'f-msg'].forEach(function (id) {
    var input = field(id);
    if (input) input.addEventListener('input', function () { wrap(input).classList.remove('invalid'); });
    if (input) input.addEventListener('change', function () { wrap(input).classList.remove('invalid'); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = field('f-name'), email = field('f-email'), type = field('f-type'), msg = field('f-msg');
    var ok = true;
    ok = mark(name, name.value.trim().length < 2) && ok;
    ok = mark(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
    ok = mark(type, !type.value) && ok;
    ok = mark(msg, msg.value.trim().length < 10) && ok;
    if (!ok) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var seed = name.value + '|' + email.value + '|' + msg.value;
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var ref = 'NL-2026-' + (100 + (h % 900));
    confRef.textContent = ref;
    confEcho.textContent = 'Thank you, ' + name.value.trim() + '. Your enquiry about “' +
      type.options[type.selectedIndex].text + '” has been logged under reference ' + ref +
      '. On the real practice this is the point where Marta replies personally, within two working days.';
    form.hidden = true;
    confirm.classList.add('show');
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirm.classList.remove('show');
    field('f-name').focus();
  });
})();
