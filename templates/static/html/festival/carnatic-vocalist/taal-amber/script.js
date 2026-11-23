/* ============================================================
   TAAL AMBER — site script
   Menu, reveal, contact form, and the Tala Keeper: a tala
   player that synthesises mridangam-style strokes (Web Audio)
   so a listener can follow each cycle's true structure.
   Audio is created only after a deliberate Play tap.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transitions in Chrome can abort when a navigation interrupts
     one; the abort surfaces as an unhandled rejection. Swallow only
     that exact case — the navigation itself always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile programme panel ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.getElementById('menu-panel');
  if (menuBtn && panel) {
    var closeBtn = panel.querySelector('.panel-close');
    var firstLink = panel.querySelector('nav a');
    var openPanel = function () {
      panel.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      });
    };
    var closePanel = function (refocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (refocus !== false) menuBtn.focus();
    };
    menuBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', function () { closePanel(true); });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ================================================================
     THE TALA KEEPER
     Structures are the true Carnatic anga divisions:
       Adi         8 = Laghu 4 + Dhrutam 2 + Dhrutam 2
       Rupaka      6 = Dhrutam 2 + Laghu 4
       Misra Chapu 7 = 3 + 4
       Khanda Chapu 5 = 2 + 3
     Bols are the sollukattu syllables as taught in class; each maps
     to one synthesised stroke voice (bass / slap / tick / ring).
     ================================================================ */
  var TALAS = {
    adi: {
      name: 'Adi Talam', count: 8, structure: '4 + 2 + 2',
      kriya: 'Laghu: beat + 3 finger counts · Dhrutam: beat + wave',
      angas: [
        { label: 'Laghu', n: 4, bols: [['Tha', 'slap'], ['Ki', 'tick'], ['Ta', 'slap'], ['Thom', 'bass']] },
        { label: 'Dhrutam', n: 2, bols: [['Tha', 'slap'], ['Thom', 'bass']] },
        { label: 'Dhrutam', n: 2, bols: [['Tha', 'slap'], ['Thom', 'bass']] }
      ]
    },
    rupaka: {
      name: 'Rupaka Talam', count: 6, structure: '2 + 4',
      kriya: 'Dhrutam: beat + wave · Laghu: beat + 3 finger counts',
      angas: [
        { label: 'Dhrutam', n: 2, bols: [['Thom', 'bass'], ['Na', 'ring']] },
        { label: 'Laghu', n: 4, bols: [['Tha', 'slap'], ['Ki', 'tick'], ['Ta', 'slap'], ['Thom', 'bass']] }
      ]
    },
    misra: {
      name: 'Misra Chapu', count: 7, structure: '3 + 4',
      kriya: 'Chapu talas are counted in beats only — no finger counts',
      angas: [
        { label: 'First part', n: 3, bols: [['Tha', 'slap'], ['Ki', 'tick'], ['Ta', 'slap']] },
        { label: 'Second part', n: 4, bols: [['Thom', 'bass'], ['Tha', 'slap'], ['Ki', 'tick'], ['Ta', 'slap']] }
      ]
    },
    khanda: {
      name: 'Khanda Chapu', count: 5, structure: '2 + 3',
      kriya: 'Chapu talas are counted in beats only — no finger counts',
      angas: [
        { label: 'First part', n: 2, bols: [['Tha', 'slap'], ['Thom', 'bass']] },
        { label: 'Second part', n: 3, bols: [['Tha', 'slap'], ['Ki', 'tick'], ['Ta', 'slap']] }
      ]
    }
  };

  var chart = document.getElementById('tala-chart');
  if (chart) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tala-tab'));
    var metaName = document.getElementById('tm-name');
    var metaStruct = document.getElementById('tm-struct');
    var metaKriya = document.getElementById('tm-kriya');
    var readout = document.getElementById('tala-readout');
    var playBtn = document.getElementById('tala-play');
    var stopBtn = document.getElementById('tala-stop');
    var tempo = document.getElementById('tala-tempo');
    var tempoVal = document.getElementById('tempo-val');

    var currentKey = 'adi';
    var flatBols = [];   // [{bol, voice}] in akshara order
    var cellEls = [];

    function flatten(key) {
      var out = [];
      TALAS[key].angas.forEach(function (a) {
        a.bols.forEach(function (b) { out.push({ bol: b[0], voice: b[1] }); });
      });
      return out;
    }

    function renderChart(key) {
      flatBols = flatten(key);
      chart.innerHTML = '';
      cellEls = [];
      var idx = 0;
      TALAS[key].angas.forEach(function (a) {
        var g = document.createElement('div');
        g.className = 'anga';
        var cells = document.createElement('div');
        cells.className = 'anga-cells';
        a.bols.forEach(function (b) {
          var c = document.createElement('div');
          c.className = 'cell' + (idx === 0 ? ' sam' : '');
          c.setAttribute('data-i', String(idx));
          var bol = document.createElement('span');
          bol.className = 'bol'; bol.textContent = b[0];
          var num = document.createElement('span');
          num.className = 'num'; num.textContent = String(idx + 1);
          c.appendChild(bol); c.appendChild(num);
          cells.appendChild(c); cellEls.push(c);
          idx++;
        });
        var lab = document.createElement('div');
        lab.className = 'anga-label';
        lab.innerHTML = '<b></b>';
        lab.querySelector('b').textContent = a.label;
        lab.appendChild(document.createTextNode(' · ' + a.n));
        g.appendChild(cells); g.appendChild(lab);
        chart.appendChild(g);
      });
      if (metaName) metaName.textContent = TALAS[key].name;
      if (metaStruct) metaStruct.textContent = TALAS[key].structure + ' = ' + TALAS[key].count + ' aksharas';
      if (metaKriya) metaKriya.textContent = TALAS[key].kriya;
      setReadoutIdle();
    }

    function setReadoutIdle() {
      if (readout) readout.textContent = 'Press Play and follow the hand: the first akshara of each cycle is sam.';
    }

    /* ----- audio engine (created lazily, on Play only) ----- */
    var ctx = null, master = null, noiseBuf = null;
    var playing = false, timerID = null;
    var nextTime = 0, nextAkshara = 0, totalPlayed = 0, strokesPlayed = 0;
    var litIndex = -1, drawTimers = [];

    function ensureCtx() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.42;
      master.connect(ctx.destination);
      var len = Math.floor(ctx.sampleRate * 0.5);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    function env(g, t, peak, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    function voiceBass(t, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(165, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.2);
      env(g, t, vol, 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
      var o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.value = 330;
      env(g2, t, vol * 0.25, 0.12);
      o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + 0.14);
    }
    function voiceSlap(t, vol) {
      var src = ctx.createBufferSource(); src.buffer = noiseBuf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.9;
      var g = ctx.createGain(); env(g, t, vol, 0.075);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.09);
      var o = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(175, t + 0.05);
      env(g2, t, vol * 0.5, 0.06);
      o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.08);
    }
    function voiceTick(t, vol) {
      var src = ctx.createBufferSource(); src.buffer = noiseBuf;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
      var g = ctx.createGain(); env(g, t, vol * 0.8, 0.035);
      src.connect(hp); hp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.05);
    }
    function voiceRing(t, vol) {
      [523.25, 1444].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        env(g, t, vol * (i === 0 ? 0.55 : 0.16), 0.34);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.36);
      });
    }
    function stroke(voice, t, sam) {
      var v = sam ? 0.95 : 0.7;
      if (voice === 'bass') voiceBass(t, v);
      else if (voice === 'slap') voiceSlap(t, v);
      else if (voice === 'tick') voiceTick(t, v);
      else voiceRing(t, v);
      if (sam) voiceBass(t, 0.5); // sam lands with weight under any bol
    }

    function bpm() { return parseInt(tempo.value, 10); }
    function layam(b) { return b < 60 ? 'Vilambit · slow' : (b <= 100 ? 'Madhya · medium' : 'Drut · fast'); }
    function showTempo() {
      if (tempoVal) tempoVal.innerHTML = '';
      if (tempoVal) {
        tempoVal.appendChild(document.createTextNode(bpm() + ' /min '));
        var s = document.createElement('span');
        s.className = 'tv-l'; s.textContent = '· ' + layam(bpm());
        tempoVal.appendChild(s);
      }
    }

    function highlight(i) {
      if (litIndex >= 0 && cellEls[litIndex]) cellEls[litIndex].classList.remove('lit');
      litIndex = i;
      if (cellEls[i]) cellEls[i].classList.add('lit');
      var n = TALAS[currentKey].count;
      var av = Math.floor(totalPlayed / n) + 1;
      if (readout) {
        readout.innerHTML = '';
        readout.appendChild(document.createTextNode(
          'Akshara ' + (i + 1) + ' of ' + n + ' — '));
        var b = document.createElement('span');
        b.className = 'ro-bol';
        b.textContent = flatBols[i].bol + (i === 0 ? ' · SAM' : '');
        readout.appendChild(b);
        readout.appendChild(document.createTextNode(' · āvartana (cycle) ' + av));
      }
    }

    function schedule() {
      var spb = 60 / bpm();
      while (nextTime < ctx.currentTime + 0.14) {
        (function (i, t) {
          stroke(flatBols[i].voice, t, i === 0);
          strokesPlayed++;
          var delay = Math.max(0, (t - ctx.currentTime) * 1000);
          drawTimers.push(setTimeout(function () { highlight(i); totalPlayed++; }, delay));
        })(nextAkshara, nextTime);
        nextTime += spb;
        nextAkshara = (nextAkshara + 1) % TALAS[currentKey].count;
      }
    }

    function start() {
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.42, ctx.currentTime, 0.02);
      playing = true;
      nextAkshara = 0; totalPlayed = 0;
      nextTime = ctx.currentTime + 0.06;
      schedule();
      timerID = setInterval(schedule, 27);
      playBtn.disabled = true;
      playBtn.textContent = 'Playing — follow the chart';
      stopBtn.disabled = false;
    }
    function stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timerID); timerID = null;
      drawTimers.forEach(clearTimeout); drawTimers = [];
      if (ctx && master) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
      if (litIndex >= 0 && cellEls[litIndex]) cellEls[litIndex].classList.remove('lit');
      litIndex = -1;
      playBtn.disabled = false;
      playBtn.textContent = 'Play the cycle';
      stopBtn.disabled = true;
      setReadoutIdle();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        stop();
        currentKey = tab.getAttribute('data-tala');
        tabs.forEach(function (t) { t.setAttribute('aria-pressed', t === tab ? 'true' : 'false'); });
        renderChart(currentKey);
      });
    });
    playBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    tempo.addEventListener('input', showTempo);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });

    renderChart('adi');
    showTempo();
    stopBtn.disabled = true;

    /* probe / test handle */
    window.TalaKeeper = {
      state: function () { return ctx ? ctx.state : 'none'; },
      playing: function () { return playing; },
      akshara: function () { return litIndex; },
      tala: function () { return currentKey; },
      count: function () { return TALAS[currentKey].count; },
      bpm: function () { return bpm(); },
      strokes: function () { return strokesPlayed; }
    };
  }

  /* ================================================================
     CONTACT FORM — validated, demonstration only (nothing is sent)
     ================================================================ */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirm = document.getElementById('form-confirm');
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('f-type');
    if (typeSel && params.get('type')) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === params.get('type')) { typeSel.selectedIndex = i; break; }
      }
    }
    function checkField(input) {
      var wrap = input.closest('.field');
      var ok = true;
      if (input.id === 'f-email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      else ok = input.value.trim().length > 0;
      if (wrap) wrap.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    ['f-name', 'f-email', 'f-type', 'f-message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('blur', function () { checkField(el); });
        /* re-check as the visitor fixes a field, so a corrected field
           never keeps its error mark until the next submit */
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          if (el.closest('.field').classList.contains('invalid')) checkField(el);
        });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = ['f-name', 'f-email', 'f-type', 'f-message'];
      var firstBad = null, bad = 0;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !checkField(el)) { bad++; if (!firstBad) firstBad = el; }
      });
      if (bad > 0) { if (firstBad) firstBad.focus(); return; }
      var name = document.getElementById('f-name').value.trim();
      var msg = document.getElementById('f-message').value.trim();
      var ref = 'NK-2026-' + String(100 + ((name.length * 7 + msg.length * 3) % 900));
      var refEl = document.getElementById('confirm-ref');
      if (refEl) refEl.textContent = ref;
      if (confirm) {
        confirm.classList.add('show');
        confirm.setAttribute('tabindex', '-1');
        confirm.focus();
      }
      form.reset();
    });
    var again = document.getElementById('confirm-again');
    if (again) again.addEventListener('click', function () {
      if (confirm) confirm.classList.remove('show');
      var n = document.getElementById('f-name');
      if (n) n.focus();
    });
  }
})();
