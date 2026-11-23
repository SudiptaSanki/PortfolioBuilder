/* cosmic-void — observing log behaviour.
   Sound ruling: NO audio anywhere. The stub's hover tones and eager
   AudioContext were removed: the sound need-test fails for this trade
   (the sky is silent at these distances; ambient hum is decoration). */

'use strict';

/* --- view-transition abort guard ----------------------------------
   Cross-document view transitions that get aborted surface as an
   unhandled InvalidStateError rejection. Filter only that case. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* --- mobile log panel ---------------------------------------------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mpanel');
  if (!btn || !panel) return;
  var scrim = document.querySelector('.scrim');
  var closeBtn = panel.querySelector('.mp-close');
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    if (scrim) scrim.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var first = panel.querySelector('a');
      if (first) first.focus();
    });
  }
  function close() {
    panel.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  btn.addEventListener('click', function () {
    panel.classList.contains('open') ? close() : open();
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', close);
  });
})();

/* --- reveal on scroll (opacity only; no-JS and reduced-motion safe) - */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
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

/* --- Distance Ladder Explorer ---------------------------------------
   One data source drives the readout sheet, the ladder marker and —
   by construction — matches the table printed in LOG 02.
   Constant: 1 pc = 3.26156 ly (printed on the page as 3.26). */
var TARGETS = {
  moon: {
    name: 'The Moon',
    sub: 'Earth\u2019s satellite \u00B7 ranged directly, not inferred',
    rung: 'Rung 0 \u00B7 Laser ranging',
    dist: '384,400 km',
    ly: 4.06e-8,
    alt: '0.00257 AU \u2014 the parsec is the wrong tool at this range',
    method: 'Lunar laser ranging \u2014 timing light pulses bounced off reflectors left by Apollo and Lunokhod',
    lookback: '1.28 seconds',
    math: '384,400 km \u00F7 299,792 km/s (the speed of light) = 1.28 s of light-travel time',
    unc: '\u00B1 a few centimetres \u2014 the most precisely measured distance in this log',
    note: 'The ladder starts with a tape measure, not a telescope trick: we time light. Every rung after this one is inference stacked on inference \u2014 which is why each carries a bigger \u00B1.'
  },
  proxima: {
    name: 'Proxima Centauri',
    sub: 'Nearest star \u00B7 4.246 ly',
    rung: 'Rung 1 \u00B7 Parallax',
    dist: '4.246 ly',
    ly: 4.246,
    alt: '1.302 pc',
    method: 'Trigonometric parallax \u2014 the Gaia spacecraft measures the star\u2019s yearly wobble against distant background stars',
    lookback: '4.246 years',
    math: '4.246 ly \u00F7 1 ly per year of travel = 4.246 years \u2014 the light arriving tonight left about four years ago',
    unc: '\u00B1 0.002 ly \u2014 better than 0.1%',
    note: 'Parallax is geometry, not astrophysics: watch a star shift as Earth crosses its orbit and the distance falls out of a triangle. Gaia has done this for well over a billion stars.'
  },
  lmc: {
    name: 'Large Magellanic Cloud',
    sub: 'Satellite galaxy of the Milky Way \u00B7 the anchor rung',
    rung: 'Rung 2 \u00B7 Standard candles',
    dist: '163,000 ly',
    ly: 163000,
    alt: '50.0 kpc (49,976 pc)',
    method: 'Cepheid period\u2013luminosity relation, cross-checked with detached eclipsing binaries',
    lookback: '163,000 years',
    math: '163,000 ly \u2192 the light left 163,000 years ago \u2014 long before farming, writing or cities',
    unc: '\u00B1 2% \u2014 small, and the whole ladder hangs on it',
    note: 'The LMC is the ladder\u2019s anchor. Its Cepheids are close enough to calibrate directly, and their period\u2013luminosity relation is then carried to galaxies millions of times farther away. A 2% error here becomes a 2% error everywhere.'
  },
  galcen: {
    name: 'The Galactic Centre',
    sub: 'Sagittarius A* \u00B7 the Milky Way\u2019s central black hole',
    rung: 'Rung 1\u20132 \u00B7 Parallax-anchored orbits',
    dist: '26,000 ly',
    ly: 26000,
    alt: '8.0 kpc (7,972 pc)',
    method: 'Orbits of stars whipping around Sgr A*, anchored to parallax measurements',
    lookback: '26,000 years',
    math: '26,000 ly \u2192 the light left 26,000 years ago, during the last ice age',
    unc: '\u00B1 1,000 ly (about \u00B1 4%)',
    note: 'We cannot see the centre directly \u2014 dust blocks the view. Instead we watch stars loop around something invisible and massive, and time their years-long orbits. The loops give both the black hole\u2019s mass and its distance.'
  },
  andromeda: {
    name: 'Andromeda Galaxy (M31)',
    sub: 'Nearest large galaxy \u00B7 the 1924 measurement',
    rung: 'Rung 2 \u00B7 Standard candles',
    dist: '2.5 million ly',
    ly: 2500000,
    alt: '0.77 Mpc (766,000 pc)',
    method: 'Cepheid variables, cross-checked against the tip of the red-giant branch',
    lookback: '2.5 million years',
    math: '2,500,000 ly \u2192 the light left 2.5 million years ago, long before Homo sapiens',
    unc: '\u00B1 100,000 ly (about \u00B1 4%)',
    note: 'In 1924 Hubble found Cepheids in what was then called the Andromeda Nebula, and the universe grew by orders of magnitude overnight. The modern figure is 2.5 million ly \u00B1 4% \u2014 the \u00B1 is part of the number, not a footnote to it.'
  },
  z1: {
    name: 'A galaxy at z \u2248 1',
    sub: 'Redshift rung \u00B7 where \u201Cdistance\u201D splits in two',
    rung: 'Rung 3 \u00B7 Redshift',
    dist: 'z = 1.0',
    ly: 7.8e9,
    alt: 'Comoving distance today \u2248 10.8 billion ly (3.3 Gpc)',
    method: 'Type Ia supernovae as standardisable candles, placed on the Hubble diagram by their redshift',
    lookback: '7.8 billion years',
    math: 'Lookback 7.8 billion years \u2014 but the galaxy kept receding while its light travelled: 3.3 Gpc \u00D7 3.26 ly/pc \u2248 10.8 billion ly is where it is now. Two distances, both correct, answering two different questions',
    unc: '\u00B1 5% \u2014 and it moves with H\u2080 (see the tension, LOG 02)',
    note: 'Any single distance printed for a high-redshift galaxy without saying which distance it is \u2014 is wrong, whichever one it is. This is the rung where honest labelling matters most.'
  }
};

(function () {
  var sheet = document.getElementById('ex-sheet');
  if (!sheet) return;
  var btns = Array.prototype.slice.call(document.querySelectorAll('.xt'));
  var marker = document.getElementById('lb-marker');
  var el = {
    name: document.getElementById('ex-name'),
    sub: document.getElementById('ex-sub'),
    dist: document.getElementById('ex-dist'),
    alt: document.getElementById('ex-alt'),
    method: document.getElementById('ex-method'),
    lookback: document.getElementById('ex-lookback'),
    math: document.getElementById('ex-math'),
    unc: document.getElementById('ex-unc'),
    note: document.getElementById('ex-note')
  };
  function markerPos(ly) {
    var p = (Math.log10(ly) + 8) / 18 * 100;
    return Math.max(0.5, Math.min(99.5, p));
  }
  function render(key) {
    var t = TARGETS[key];
    if (!t) return;
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-target') === key ? 'true' : 'false');
    });
    el.name.textContent = t.name;
    el.sub.textContent = t.sub + ' \u00B7 ' + t.rung;
    el.dist.textContent = t.dist;
    el.alt.textContent = t.alt;
    el.method.textContent = t.method;
    el.lookback.textContent = t.lookback;
    el.math.textContent = t.math;
    el.unc.textContent = t.unc;
    el.note.innerHTML = '';
    el.note.appendChild(document.createTextNode(t.note));
    if (marker) {
      marker.style.left = markerPos(t.ly) + '%';
      marker.setAttribute('data-name', t.name);
    }
    sheet.setAttribute('data-current', key);
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { render(b.getAttribute('data-target')); });
  });
  render('andromeda');
})();

/* --- contact form ---------------------------------------------------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var confirm = document.getElementById('confirm');
  var TYPES = ['audit', 'analysis', 'planetarium', 'lecture', 'other'];

  /* preselect from ?type= (register and case CTAs deep-link here) */
  try {
    var q = new URLSearchParams(window.location.search).get('type');
    var sel = document.getElementById('fType');
    if (q && sel && TYPES.indexOf(q) !== -1) sel.value = q;
  } catch (e) { /* no query string — nothing to preselect */ }

  function setErr(input, errEl, msg) {
    if (msg) {
      errEl.textContent = msg;
      errEl.classList.add('on');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errEl.textContent = '';
      errEl.classList.remove('on');
      input.removeAttribute('aria-invalid');
    }
    return !msg;
  }
  function validate() {
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMsg');
    var ok = true;
    ok = setErr(name, document.getElementById('eName'),
      name.value.trim() ? '' : 'Your name is required \u2014 the log is signed.') && ok;
    ok = setErr(email, document.getElementById('eEmail'),
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'A valid email is required \u2014 it is the reply address.') && ok;
    ok = setErr(msg, document.getElementById('eMsg'),
      msg.value.trim().length >= 10 ? '' : 'A few lines on what you are measuring (10+ characters) \u2014 the enquiry needs a target.') && ok;
    return ok;
  }
  ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', validate);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'AO-2026-' + (100 + (Date.now() % 900));
    document.getElementById('confirmRef').textContent = ref;
    var typeSel = document.getElementById('fType');
    var typeLabel = typeSel.options[typeSel.selectedIndex].text;
    document.getElementById('confirmEcho').textContent =
      'Logged for ' + document.getElementById('fName').value.trim() +
      ' \u00B7 ' + typeLabel +
      ' \u00B7 reply to ' + document.getElementById('fEmail').value.trim() + '.';
    form.style.display = 'none';
    confirm.classList.add('on');
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });

  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.style.display = '';
    confirm.classList.remove('on');
    document.getElementById('fName').focus();
  });
})();

/* --- footer year ------------------------------------------------------ */
(function () {
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
