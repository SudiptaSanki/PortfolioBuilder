/* qubit-state — lab notebook behaviour.
   Sound ruling: NO audio anywhere. The stub's "quantum state sound
   synthesis" (a hover/click sine sweep) fails the sound need-test:
   a qubit's state makes no sound you can learn from, and a tone that
   merely rises when you click a gate teaches nothing about phase,
   probability or noise. The trade's real material is the arithmetic,
   so the arithmetic is what the signature interaction does. */

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

/* --- mobile notebook-index panel ----------------------------------- */
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
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus();
      });
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

/* --- State Explorer (index only) ------------------------------------
   One qubit, exact arithmetic. The state is a pair of complex
   amplitudes a (for |0>) and b (for |1>); every gate is its real
   2x2 matrix. Probabilities are |a|^2 and |b|^2 — computed, never
   typed in. The Bloch arrow is drawn from the same numbers:
   x = 2*Re(conj(a)*b), y = 2*Im(conj(a)*b), z = |a|^2 - |b|^2. */
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;

  var SQ = Math.SQRT1_2; // 1/sqrt(2)
  var state = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } };
  var seq = [];        // gate names, in order applied
  var history = [];    // previous states, for Undo

  var elVec = document.getElementById('stateVec');
  var elP0v = document.getElementById('p0val');
  var elP1v = document.getElementById('p1val');
  var elF0 = document.getElementById('p0fill');
  var elF1 = document.getElementById('p1fill');
  var elSeq = document.getElementById('seqLine');
  var elNote = document.getElementById('noteText');
  var elCircuit = document.getElementById('circuitGates');
  var elWire = document.getElementById('circuitWire');
  var elSvg = document.getElementById('circuitSvg');
  var elArrow = document.getElementById('blochArrow');
  var elTip = document.getElementById('blochTip');
  var btnUndo = document.getElementById('undoBtn');

  function cadd(p, q) { return { re: p.re + q.re, im: p.im + q.im }; }
  function cmul(p, q) { return { re: p.re * q.re - p.im * q.im, im: p.re * q.im + p.im * q.re }; }
  function cscale(p, s) { return { re: p.re * s, im: p.im * s }; }

  var GATES = {
    H: function (s) {
      return { a: cscale(cadd(s.a, s.b), SQ), b: cscale({ re: s.a.re - s.b.re, im: s.a.im - s.b.im }, SQ) };
    },
    X: function (s) { return { a: s.b, b: s.a }; },
    Z: function (s) { return { a: s.a, b: { re: -s.b.re, im: -s.b.im } }; },
    S: function (s) { return { a: s.a, b: { re: -s.b.im, im: s.b.re } }; },
    T: function (s) { return { a: s.a, b: cmul(s.b, { re: SQ, im: SQ }) }; }
  };

  function fmtNum(x) {
    var v = Math.abs(x) < 0.0005 ? 0 : x;
    var s = v.toFixed(3);
    return s === '-0.000' ? '0.000' : s;
  }
  function fmtC(z) {
    var re = Math.abs(z.re) < 0.0005 ? 0 : z.re;
    var im = Math.abs(z.im) < 0.0005 ? 0 : z.im;
    if (im === 0) return fmtNum(re);
    if (re === 0) return fmtNum(im) + 'i';
    return fmtNum(re) + (im < 0 ? ' − ' : ' + ') + fmtNum(Math.abs(im)) + 'i';
  }
  function approx(x, y) { return Math.abs(x - y) < 0.01; }
  function isState(aRe, aIm, bRe, bIm) {
    return approx(state.a.re, aRe) && approx(state.a.im, aIm) &&
           approx(state.b.re, bRe) && approx(state.b.im, bIm);
  }

  function note() {
    var p0 = state.a.re * state.a.re + state.a.im * state.a.im;
    var p1 = state.b.re * state.b.re + state.b.im * state.b.im;
    if (!seq.length) {
      return 'The qubit sits at |0\u27E9. Measure it as many times as you like: every shot returns 0. Nothing is uncertain yet \u2014 and nothing has been computed. Apply a gate.';
    }
    if (isState(1, 0, 0, 0)) return 'Back at |0\u27E9 exactly. The gates you applied undid each other \u2014 every gate here is reversible, which is a rule of the mathematics, not a feature of this page.';
    if (isState(0, 0, 1, 0)) return 'A certain 1. The X gate swapped the amplitudes wholesale; there is no superposition here, just a flipped bit with extra steps.';
    if (isState(SQ, 0, SQ, 0)) return 'Equal superposition, |+\u27E9. Measurement is now a fair coin \u2014 50/50 \u2014 but the state is not \u201Cunknown\u201D. It is exactly this, and a later gate can still make the two halves interfere.';
    if (isState(SQ, 0, -SQ, 0)) return 'THE PHASE LESSON. The probabilities read 50/50, identical to |+\u27E9 \u2014 but \u03B2 carries a minus sign. Probabilities cannot see that sign; interference can. Phase is where quantum algorithms do their work, and it is exactly what a probability readout hides.';
    if (isState(SQ, 0, 0, SQ)) return '50/50 again \u2014 the difference from |+\u27E9 lives entirely in \u03B2\u2019s phase, now +\u0069. Measuring in this basis will never reveal it. Change the basis (apply H) and the phase becomes probability.';
    if (isState(SQ, 0, 0, -SQ)) return '50/50, with \u03B2\u2019s phase at \u2212\u0069. Invisible to this measurement, decisive to the next gate. This is why a qubit is not just a random bit.';
    var phi = Math.atan2(state.b.im, state.b.re) - Math.atan2(state.a.im, state.a.re);
    var deg = Math.round(((phi * 180 / Math.PI) % 360 + 360) % 360);
    if (Math.abs(p0 - p1) < 0.005) {
      return 'A 50/50 split of probability, with \u03B2\u2019s phase at \u03C6 \u2248 ' + deg + '\u00B0 relative to \u03B1. Same odds as |+\u27E9, different state \u2014 the odds are not the state.';
    }
    return 'P(0) = ' + (p0 * 100).toFixed(1) + '%, P(1) = ' + (p1 * 100).toFixed(1) + '%, and \u03B2\u2019s phase sits at \u03C6 \u2248 ' + deg + '\u00B0. Remember: the next gate acts on the amplitudes, not on these percentages. Percentages are only what measurement reports.';
  }

  function drawCircuit() {
    var n = seq.length;
    var w = Math.max(360, 92 + n * 52 + 66);
    elSvg.setAttribute('viewBox', '0 0 ' + w + ' 64');
    elSvg.setAttribute('width', w);
    elWire.setAttribute('x2', w - 8);
    var html = '';
    for (var i = 0; i < n; i++) {
      var x = 92 + i * 52;
      html += '<g><rect x="' + x + '" y="14" width="38" height="36" fill="#FAF7EF" stroke="#1D2433" stroke-width="1.5"/>' +
        '<text x="' + (x + 19) + '" y="39" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="600" fill="#2743A6">' + seq[i] + '</text></g>';
    }
    var mx = 92 + n * 52 + 6;
    html += '<g><rect x="' + mx + '" y="14" width="38" height="36" fill="#141A28"/>' +
      '<path d="M ' + (mx + 9) + ' 40 A 11 11 0 0 1 ' + (mx + 29) + ' 40" fill="none" stroke="#FAF7EF" stroke-width="2"/>' +
      '<line x1="' + (mx + 26) + '" y1="42" x2="' + (mx + 33) + '" y2="24" stroke="#FAF7EF" stroke-width="2"/></g>';
    elCircuit.innerHTML = html;
  }

  function render() {
    var p0 = state.a.re * state.a.re + state.a.im * state.a.im;
    var p1 = state.b.re * state.b.re + state.b.im * state.b.im;
    elVec.innerHTML = '|\u03C8\u27E9 = <b>' + fmtC(state.a) + '</b> |0\u27E9 &nbsp;+&nbsp; <b>' + fmtC(state.b) + '</b> |1\u27E9';
    elP0v.textContent = (p0 * 100).toFixed(1) + '%';
    elP1v.textContent = (p1 * 100).toFixed(1) + '%';
    elF0.style.width = (p0 * 100).toFixed(1) + '%';
    elF1.style.width = (p1 * 100).toFixed(1) + '%';
    elSeq.textContent = seq.length ? 'Applied, in order: ' + seq.join(' \u00B7 ') : 'Applied, in order: \u2014 (no gates yet)';
    elNote.textContent = note();
    // Bloch vector from the same amplitudes
    var cab = cmul({ re: state.a.re, im: -state.a.im }, state.b); // conj(a) * b
    var x = 2 * cab.re, y = 2 * cab.im, z = p0 - p1;
    var px = 130 + 92 * (x * 0.82 + y * 0.45);
    var py = 130 - 92 * z;
    elArrow.setAttribute('x2', px.toFixed(1));
    elArrow.setAttribute('y2', py.toFixed(1));
    elTip.setAttribute('cx', px.toFixed(1));
    elTip.setAttribute('cy', py.toFixed(1));
    btnUndo.disabled = !history.length;
    drawCircuit();
  }

  root.querySelectorAll('.gate-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var g = btn.getAttribute('data-gate');
      if (!GATES[g]) return;
      history.push(JSON.parse(JSON.stringify(state)));
      state = GATES[g](state);
      seq.push(g);
      render();
    });
  });
  btnUndo.addEventListener('click', function () {
    if (!history.length) return;
    state = history.pop();
    seq.pop();
    render();
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    state = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } };
    seq = []; history = [];
    render();
  });

  /* --- shots sampler: results are distributions, not answers ------ */
  var shotOut = document.getElementById('shotOut');
  root.querySelectorAll('.shot-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = parseInt(btn.getAttribute('data-shots'), 10);
      var p1 = state.b.re * state.b.re + state.b.im * state.b.im;
      var ones = 0;
      for (var i = 0; i < n; i++) { if (Math.random() < p1) ones++; }
      var zeros = n - ones;
      var obs = (ones / n * 100).toFixed(1);
      var sigma = Math.sqrt(n * p1 * (1 - p1));
      shotOut.innerHTML = n.toLocaleString('en-GB') + ' shots of the current state \u2192 0: <b>' + zeros.toLocaleString('en-GB') +
        '</b> \u00B7 1: <b>' + ones.toLocaleString('en-GB') + '</b><br>Observed P(1) = <b>' + obs +
        '%</b> \u2014 true value ' + (p1 * 100).toFixed(1) + '%, sampling spread \u03C3 \u2248 ' + sigma.toFixed(1) + ' counts.' +
        (p1 === 0 || p1 === 1 ? ' A certain state samples without spread: \u03C3 = 0.' : ' Run it again: the count will move. That movement is not a bug \u2014 it is what a quantum result is.');
    });
  });

  render();
})();

/* --- contact form (contact only) ------------------------------------
   Demonstration form: validates in the page, generates a reference
   from the sender's own input, and transmits nothing. */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var typeMap = { assessment: 'Readiness assessment', prototyping: 'Simulator-first prototyping', hardware: 'Hardware run review', education: 'Team education programme', vendor: 'Vendor-claim review' };
  var sel = document.getElementById('f-type');
  var want = params.get('type');
  if (sel && want && typeMap[want]) sel.value = typeMap[want];

  function setErr(id, on) {
    var input = document.getElementById(id);
    var err = document.querySelector('[data-err-for="' + id + '"]');
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
    if (err) err.classList.toggle('show', on);
    return !on;
  }
  ['f-name', 'f-email', 'f-msg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { setErr(id, false); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name');
    var email = document.getElementById('f-email');
    var msg = document.getElementById('f-msg');
    var ok = true;
    ok = setErr('f-name', !name.value.trim()) && ok;
    ok = setErr('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = setErr('f-msg', !msg.value.trim()) && ok;
    if (!ok) {
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var seed = (name.value.trim() + '|' + email.value.trim());
    var sum = 0;
    for (var i = 0; i < seed.length; i++) sum += seed.charCodeAt(i) * (i + 3);
    var ref = 'EV-2026-' + (100 + (sum % 900));
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('confirmEcho').textContent =
      'Thank you, ' + name.value.trim() + '. Your note about \u201C' + (sel ? sel.value : 'an enquiry') +
      '\u201D is recorded in this page under the reference above.';
    form.style.display = 'none';
    document.getElementById('confirm').classList.add('show');
    document.getElementById('confirm').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    document.getElementById('confirm').classList.remove('show');
    form.reset();
    form.style.display = '';
    document.getElementById('f-name').focus();
  });
})();
