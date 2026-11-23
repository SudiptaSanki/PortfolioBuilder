/* Duarte Passive Acoustics — site script.
   Contents: watch-panel menu, reveal-on-scroll, the Propagation Calculator
   (reads its source levels, absorption coefficients and ambient bands from
   the printed tables in the page, so the arithmetic can be checked against
   them), the Listening Bench, the survey estimator (reads its rates from
   the printed rate card), and the demonstration enquiry form.

   SOUND RULING (need-test, Set 7): this is the set's one genuine sound
   profession — the analyst's trade IS listening, and the bench teaches
   detector literacy: what a downsweep contour and a click train are, the
   two shapes every detector on a PAM programme is built to find. Sound is
   therefore permitted ONLY in the frequency-room pattern: synthesised
   contours generated in the browser on an explicit button press, fixed low
   gain (0.12), self-stopping inside two seconds, a stop control, a
   hearing-safety line, and a printed statement that these are synthesised
   teaching contours — NOT recordings of animals. The AudioContext is
   created lazily on the first press, never before. No hover audio, no
   autoplay, anywhere on the site. */

/* Cross-document view transitions can reject their promise when a
   navigation interrupts the animation; swallow only that rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && (r.name === 'InvalidStateError' ||
      (typeof r.message === 'string' && r.message.indexOf('Transition was aborted') !== -1))) {
    e.preventDefault();
  }
});

/* ---------- Watch panel (mobile menu) ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('watchPanel');
  if (!btn || !panel) return;
  function setOpen(open) {
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var first = panel.querySelector('a');
      if (first) requestAnimationFrame(function () { first.focus({ preventScroll: true }); });
    }
  }
  btn.addEventListener('click', function () {
    setOpen(!panel.classList.contains('open'));
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
})();

/* ---------- Reveal on scroll (opacity only on live elements) ---------- */
(function () {
  var els = document.querySelectorAll('.rev');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

function fmtDB(n) { return n.toFixed(1); }
function fmtMoney(n) { return '£' + n.toLocaleString('en-GB'); }

/* ---------- Propagation Calculator ---------- */
(function () {
  var calc = document.getElementById('calculator');
  if (!calc) return;

  /* Printed tables are the source of truth — read them, never duplicate. */
  var sources = {}, alphas = {}, ambients = {};
  document.querySelectorAll('#srcTable tbody tr').forEach(function (tr) {
    sources[tr.getAttribute('data-src')] = { sl: parseFloat(tr.getAttribute('data-sl')), band: null };
  });
  /* Each source's own band is printed on its picker card. */
  document.querySelectorAll('[data-src-btn]').forEach(function (b) {
    var key = b.getAttribute('data-src-btn');
    if (sources[key]) sources[key].band = b.getAttribute('data-band');
  });
  document.querySelectorAll('#absTable tbody tr').forEach(function (tr) {
    alphas[tr.getAttribute('data-freq')] = parseFloat(tr.getAttribute('data-alpha'));
  });
  document.querySelectorAll('#ambTable tbody tr').forEach(function (tr) {
    ambients[tr.getAttribute('data-amb')] = parseFloat(tr.getAttribute('data-db'));
  });

  var RANGES = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];
  var state = { src: 'fin', freq: 'f100', rangeIdx: 3, amb: 'quiet' };

  var el = {
    rgVal: document.getElementById('rgVal'),
    wSL: document.getElementById('wSL'), wSpread: document.getElementById('wSpread'),
    wAbsorb: document.getElementById('wAbsorb'), wTL: document.getElementById('wTL'),
    wRL: document.getElementById('wRL'), wAmb: document.getElementById('wAmb'),
    wMargin: document.getElementById('wMargin'),
    verdict: document.getElementById('calcVerdict'), vTag: document.getElementById('vTag'),
    vText: document.getElementById('vText'), pairNote: document.getElementById('pairNote')
  };

  function markRows(tableId, attr, value) {
    document.querySelectorAll('#' + tableId + ' tbody tr').forEach(function (tr) {
      tr.classList.toggle('sel', tr.getAttribute(attr) === value);
    });
  }
  function markPressed(attr, value) {
    document.querySelectorAll('[' + attr + ']').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute(attr) === value ? 'true' : 'false');
    });
  }

  function render() {
    var src = sources[state.src];
    var alpha = alphas[state.freq];
    var amb = ambients[state.amb];
    var R = RANGES[state.rangeIdx];
    var spread = 20 * Math.log10(R);
    var absorb = alpha * (R / 1000);
    var tl = spread + absorb;
    var rl = src.sl - tl;
    var margin = rl - amb;

    el.rgVal.textContent = R.toLocaleString('en-GB') + ' m';
    el.wSL.textContent = 'SL = ' + src.sl + ' dB re 1 µPa @ 1 m (Table 1, stated example figure)';
    el.wSpread.textContent = 'Spreading: 20 × log₁₀(' + R.toLocaleString('en-GB') + ') = ' + fmtDB(spread) + ' dB';
    el.wAbsorb.textContent = 'Absorption: ' + alpha + ' dB/km × ' + (R / 1000) + ' km = ' + fmtDB(absorb) + ' dB';
    el.wTL.textContent = 'TL = ' + fmtDB(spread) + ' + ' + fmtDB(absorb) + ' = ' + fmtDB(tl) + ' dB';
    el.wRL.textContent = 'RL = SL − TL = ' + src.sl + ' − ' + fmtDB(tl) + ' = ' + fmtDB(rl) + ' dB';
    el.wAmb.textContent = 'Ambient band = ' + amb + ' dB (Table 3)';
    el.wMargin.textContent = 'Margin = ' + fmtDB(rl) + ' − ' + amb + ' = ' + (margin >= 0 ? '+' : '') + fmtDB(margin) + ' dB';

    el.verdict.classList.remove('above', 'at', 'below');
    if (margin > 10) {
      el.verdict.classList.add('above');
      el.vTag.textContent = 'Above the noise';
      el.vText.textContent = 'The call arrives ' + fmtDB(margin) + ' dB above the ambient band. A competent detector finds this reliably — this is the range at which a survey can honestly promise detections, in these conditions.';
    } else if (margin >= -10) {
      el.verdict.classList.add('at');
      el.vTag.textContent = 'At the noise line';
      el.vText.textContent = 'The call arrives within ±10 dB of the ambient band. Detection is possible but not promisable: it will come and go with the hour, the weather and the traffic. A report written from this range must carry its conditions.';
    } else {
      el.verdict.classList.add('below');
      el.vTag.textContent = 'Below the noise';
      el.vText.textContent = 'The call arrives ' + fmtDB(Math.abs(margin)) + ' dB under the ambient band. It is, for survey purposes, not there — and a hydrophone reporting silence at this range has reported nothing about the animal at all.';
    }

    /* Teaching note when the chosen frequency is not the source's own band */
    el.pairNote.hidden = (state.freq === src.band);

    markRows('srcTable', 'data-src', state.src);
    markRows('absTable', 'data-freq', state.freq);
    markRows('ambTable', 'data-amb', state.amb);
    markPressed('data-src-btn', state.src);
    markPressed('data-freq-btn', state.freq);
    markPressed('data-amb-btn', state.amb);
    document.getElementById('rgMinus').disabled = state.rangeIdx === 0;
    document.getElementById('rgPlus').disabled = state.rangeIdx === RANGES.length - 1;
  }

  document.querySelectorAll('[data-src-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.src = b.getAttribute('data-src-btn');
      state.freq = sources[state.src].band; /* a source is read in its own band */
      render();
    });
  });
  document.querySelectorAll('[data-freq-btn]').forEach(function (b) {
    b.addEventListener('click', function () { state.freq = b.getAttribute('data-freq-btn'); render(); });
  });
  document.querySelectorAll('[data-amb-btn]').forEach(function (b) {
    b.addEventListener('click', function () { state.amb = b.getAttribute('data-amb-btn'); render(); });
  });
  document.getElementById('rgMinus').addEventListener('click', function () {
    if (state.rangeIdx > 0) { state.rangeIdx--; render(); }
  });
  document.getElementById('rgPlus').addEventListener('click', function () {
    if (state.rangeIdx < RANGES.length - 1) { state.rangeIdx++; render(); }
  });
  render();
})();

/* ---------- Listening Bench (tap-gated, synthesised, self-stopping) ---------- */
(function () {
  var bench = document.getElementById('bench');
  if (!bench) return;
  var statusEl = document.getElementById('benchStatus');
  var noteEl = document.getElementById('benchNote');
  var stopBtn = document.getElementById('benchStop');
  var btns = bench.querySelectorAll('[data-bench]');
  var traces = { sweep: document.getElementById('traceSweep'), clicks: document.getElementById('traceClicks') };
  var actx = null, master = null, current = null;

  function setStatus(word, rest) {
    statusEl.innerHTML = '';
    var s = document.createElement('span');
    s.className = 'st'; s.textContent = word;
    statusEl.appendChild(s);
    statusEl.appendChild(document.createTextNode(' ' + rest));
  }

  function ensureCtx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.12; /* fixed low gain — hearing safety */
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  }

  function clearMarks() {
    btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    Object.keys(traces).forEach(function (k) { if (traces[k]) traces[k].classList.remove('trace-live'); });
  }

  function halt(silent) {
    if (!current) return;
    current.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    if (current.timer) clearTimeout(current.timer);
    current = null;
    clearMarks();
    if (!silent) setStatus('STOPPED.', 'Halted by hand. The bench is silent.');
  }

  function finish(kind) {
    current = null;
    clearMarks();
    setStatus('FINISHED.', kind === 'sweep'
      ? 'The sweep played once, in full, and stopped itself.'
      : 'The click train played once, in full, and stopped itself.');
  }

  function playSweep() {
    ensureCtx(); halt(true);
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var g = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.05);
    g.gain.setValueAtTime(1, t + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.85);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 1.9);
    var timer = setTimeout(function () { finish('sweep'); }, 2000);
    current = { kind: 'sweep', nodes: [osc], timer: timer };
    setStatus('PLAYING.', 'The downsweep: one tone sliding from 90 Hz down to 40 Hz over two seconds.');
    noteEl.textContent = 'What you heard: a single tone sliding down in pitch — the shape a fin-whale pulse draws on the sheet in Fig. 2. A detector finds it by matching that falling shape, which is why broadband noise cannot fake it for long. On a real recording the same contour would sit inside the ambient band, not alone in a quiet room.';
    traces.sweep.classList.add('trace-live');
  }

  function playClicks() {
    ensureCtx(); halt(true);
    var t0 = actx.currentTime + 0.03;
    var len = Math.floor(actx.sampleRate * 0.05);
    var buffer = actx.createBuffer(1, len, actx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var bp = actx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 1.1;
    var g = actx.createGain(); g.gain.value = 0.9;
    bp.connect(g); g.connect(master);
    var nodes = [], at = t0, gap = 0.28;
    for (var k = 0; k < 12; k++) {
      var srcNode = actx.createBufferSource();
      srcNode.buffer = buffer;
      srcNode.connect(bp);
      srcNode.start(at); srcNode.stop(at + 0.06);
      nodes.push(srcNode);
      at += gap; gap *= 0.82;
    }
    var totalMs = Math.round((at - t0) * 1000) + 150;
    var timer = setTimeout(function () { finish('clicks'); }, totalMs);
    current = { kind: 'clicks', nodes: nodes, timer: timer };
    setStatus('PLAYING.', 'The click train: twelve clicks, the gap between them shrinking each time.');
    noteEl.textContent = 'What you heard: twelve short clicks with shrinking gaps — the accelerating rhythm of an echolocator closing on something. Click trains are timed, not just heard: the gap pattern is the signature, and a detector reads the rhythm the way you just did.';
    traces.clicks.classList.add('trace-live');
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-bench');
      if (current && current.kind === kind) { halt(false); return; }
      b.setAttribute('aria-pressed', 'true');
      if (kind === 'sweep') playSweep(); else playClicks();
    });
  });
  stopBtn.addEventListener('click', function () {
    if (current) halt(false);
    else setStatus('STOPPED.', 'Nothing was playing. The bench is silent.');
  });
})();

/* ---------- Survey estimator (rates read from the printed rate card) ---------- */
(function () {
  var est = document.getElementById('fees');
  if (!est) return;
  var rates = {};
  document.querySelectorAll('#rateCard tbody tr').forEach(function (tr) {
    rates[tr.getAttribute('data-key')] = parseFloat(tr.getAttribute('data-rate'));
  });
  var state = { design: 3, deploy: 4, analysis: 10, units: 6, weeks: 4 };
  var bounds = { design: [0, 15], deploy: [0, 30], analysis: [0, 60], units: [0, 24], weeks: [1, 26] };

  function render() {
    Object.keys(state).forEach(function (k) {
      var mv = document.getElementById('mv-' + k);
      if (mv) mv.textContent = state[k];
    });
    document.getElementById('line-design').textContent = fmtMoney(state.design * rates.design);
    document.getElementById('line-deploy').textContent = fmtMoney(state.deploy * rates.deploy);
    document.getElementById('line-analysis').textContent = fmtMoney(state.analysis * rates.analysis);
    document.getElementById('line-units').textContent = fmtMoney(state.units * state.weeks * rates.unit);
    document.getElementById('line-weeks').textContent =
      state.units + ' × ' + state.weeks + ' × ' + fmtMoney(rates.unit);
    var total = state.design * rates.design + state.deploy * rates.deploy +
      state.analysis * rates.analysis + state.units * state.weeks * rates.unit;
    document.getElementById('estTotal').textContent = fmtMoney(total);
    document.querySelectorAll('[data-est]').forEach(function (b) {
      var k = b.getAttribute('data-est'), d = parseInt(b.getAttribute('data-dir'), 10);
      var next = state[k] + d;
      b.disabled = next < bounds[k][0] || next > bounds[k][1];
    });
  }
  document.querySelectorAll('[data-est]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-est'), d = parseInt(b.getAttribute('data-dir'), 10);
      var next = state[k] + d;
      if (next < bounds[k][0] || next > bounds[k][1]) return;
      state[k] = next; render();
    });
  });
  render();
})();

/* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var fields = {
    name: { input: document.getElementById('fName'), err: document.getElementById('eName'),
            test: function (v) { return v.trim().length > 0; } },
    email: { input: document.getElementById('fEmail'), err: document.getElementById('eEmail'),
             test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
    org: { input: document.getElementById('fOrg'), err: document.getElementById('eOrg'),
           test: function (v) { return v.trim().length > 0; } },
    msg: { input: document.getElementById('fMsg'), err: document.getElementById('eMsg'),
           test: function (v) { return v.trim().length > 1; } }
  };
  Object.keys(fields).forEach(function (k) {
    var f = fields[k];
    f.input.addEventListener('input', function () {
      f.input.removeAttribute('aria-invalid'); f.err.hidden = true;
    });
  });
  var typeSel = document.getElementById('fType');
  var wanted = new URLSearchParams(window.location.search).get('type');
  if (wanted && typeSel) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
    }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      var ok = f.test(f.input.value);
      f.err.hidden = ok;
      if (ok) f.input.removeAttribute('aria-invalid');
      else { f.input.setAttribute('aria-invalid', 'true'); if (!firstBad) firstBad = f.input; }
    });
    if (firstBad) { firstBad.focus(); return; }
    var ref = 'LOG-' + (1000 + Math.floor(Math.random() * 9000));
    document.getElementById('confirmRef').textContent = ref;
    var typeLabel = typeSel.options[typeSel.selectedIndex].text;
    document.getElementById('confirmEcho').textContent =
      'Entered for ' + fields.name.input.value.trim() + ' — programme: ' + typeLabel +
      '. Nothing has been sent anywhere, and this page keeps no copy once it is closed.';
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });
})();
