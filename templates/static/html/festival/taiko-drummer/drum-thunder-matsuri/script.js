/* Drum Thunder Matsuri — Ensemble Hayate.
   Vanilla JS: programme-panel menu, reveal, the set-list total,
   the kuchishoga pattern player (user-started Web Audio synthesis,
   labelled on the page as demonstration patterns, never recordings),
   and the booking enquiry form. */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) e.preventDefault();
  });

  /* ---------- mobile menu (the programme panel) ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var openMenu = function () {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var f = panel.querySelector('a');
          if (f) f.focus();
        });
      });
    };
    var closeMenu = function (ret) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (ret) btn.focus();
    };
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    var closeBtn = panel.querySelector('.mp-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && panel.classList.contains('open')) closeMenu(false);
    });
  }

  /* ---------- reveal ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- set-list total (index) ---------- */
  var setTable = document.getElementById('setTable');
  if (setTable) {
    var sum = 0;
    setTable.querySelectorAll('[data-min]').forEach(function (td) {
      sum += parseInt(td.getAttribute('data-min'), 10) || 0;
    });
    var totalEl = document.getElementById('setTotal');
    if (totalEl) totalEl.textContent = String(sum);
    setTable.setAttribute('data-total', String(sum));
  }

  /* ---------- the pattern player ---------- */
  var player = document.getElementById('pl');
  if (player) {
    var PATTERNS = {
      matsuri: {
        title: 'Matsuri Ji', drum: 'Shime-daiko over nagado-daiko',
        tempo: 132, min: 96, max: 168,
        strokes: ['DON', 'KA', 'DON', 'KA', 'DOKO', 'KA', 'DON', 'KA',
                  'DON', 'KA', 'DOKO', 'KA', 'DON', 'DOKO', 'KA', 'SU'],
        note: '<b>The ground rhythm (ji) the whole ensemble stands on.</b> The shime keeps this pattern under almost every festival piece; the big drums phrase over the top of it. Learn this first and the rest of the programme makes sense.'
      },
      shime: {
        title: 'Shime Conversation', drum: 'Two shime-daiko, high and bright',
        tempo: 152, min: 110, max: 190,
        strokes: ['KA', 'TSU', 'KA', 'KA', 'TSU', 'KA', 'DOKO', 'KA',
                  'KA', 'TSU', 'DOKO', 'SU'],
        note: '<b>Two shime players answering each other.</b> The shime is the small rope-tensioned drum played with thin sticks — the highest voice in the group, and the one that cues every change. TSU is a light centre stroke: a breath, not a hit.'
      },
      miyake: {
        title: 'Miyake — the Low Stance', drum: 'Nagado-daiko × 4, played low',
        tempo: 92, min: 72, max: 120,
        strokes: ['DON', 'SU', 'DON', 'KA', 'DON', 'SU', 'DOKO', 'SU'],
        note: '<b>From the Miyake-jima tradition: drum slung low, stance lower.</b> Half the phrase is silence. The rests (SU) are counted out loud in rehearsal until the body keeps them on its own — the space is part of the pattern.'
      },
      odaiko: {
        title: 'Odaiko — the Thunder Build', drum: 'Odaiko solo, shime keeping time',
        tempo: 108, min: 80, max: 140,
        strokes: ['DON', 'SU', 'SU', 'SU', 'DON', 'SU', 'DON', 'SU',
                  'DON', 'KA', 'DON', 'DOKO', 'DON', 'DOKO', 'DOKO', 'DON'],
        note: '<b>The solo frame for the big drum.</b> One stroke, three counts of air, then the build. On stage the odaiko player works both heads of the drum and trades phrases with the shime; this grid is the skeleton they hang the improvisation on.'
      }
    };

    var grid = document.getElementById('phraseGrid');
    var tabs = Array.prototype.slice.call(player.querySelectorAll('.pat-tab'));
    var playBtn = document.getElementById('playBtn');
    var stopBtn = document.getElementById('stopBtn');
    var tempoInput = document.getElementById('tempo');
    var tempoVal = document.getElementById('tempoVal');
    var statusEl = document.getElementById('plStatus');
    var noteEl = document.getElementById('plNote');
    var patNameEl = document.getElementById('plPatName');

    var current = 'matsuri';
    var tempo = PATTERNS[current].tempo;
    var ctx = null, master = null, noiseBuf = null;
    var timer = null, nextTime = 0, nextIdx = 0, loopCount = 0;
    var scheduled = []; /* {time, idx, tok} for the highlighter */
    var playing = false;

    function cellClass(tok) {
      return 'cell t-' + tok.toLowerCase();
    }
    function renderGrid() {
      var p = PATTERNS[current];
      grid.innerHTML = '';
      p.strokes.forEach(function (tok, i) {
        var c = document.createElement('div');
        c.className = cellClass(tok);
        c.setAttribute('data-idx', String(i));
        var t = document.createElement('span');
        t.className = 'tok';
        t.textContent = tok === 'DOKO' ? 'DO·KO' : tok;
        var n = document.createElement('span');
        n.className = 'cell-n';
        n.textContent = String(i + 1);
        c.appendChild(t); c.appendChild(n);
        grid.appendChild(c);
      });
      patNameEl.textContent = p.title;
      noteEl.innerHTML = p.note;
      tempoInput.min = String(p.min);
      tempoInput.max = String(p.max);
      tempoInput.value = String(p.tempo);
      tempo = p.tempo;
      tempoVal.textContent = tempo + ' / min';
      player.setAttribute('data-pattern', current);
      player.setAttribute('data-cells', String(p.strokes.length));
    }
    function setStatus(html) { statusEl.innerHTML = html; }

    function makeNoise(c) {
      var len = c.sampleRate * 0.5;
      var buf = c.createBuffer(1, len, c.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    function membrane(t, vol, f0, f1) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + 0.22);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.42);
      var n = ctx.createBufferSource(); n.buffer = noiseBuf;
      var nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 420;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.45, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      n.connect(nf); nf.connect(ng); ng.connect(master);
      n.start(t); n.stop(t + 0.09);
    }
    function rim(t, vol) {
      var n = ctx.createBufferSource(); n.buffer = noiseBuf;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 1900; f.Q.value = 7;
      var g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t); n.stop(t + 0.07);
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 840;
      og.gain.setValueAtTime(vol * 0.35, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + 0.05);
    }
    function stroke(tok, t, cellDur) {
      if (tok === 'DON') membrane(t, 0.9, 150, 52);
      else if (tok === 'TSU') membrane(t, 0.3, 195, 95);
      else if (tok === 'KA') rim(t, 0.55);
      else if (tok === 'DOKO') { membrane(t, 0.8, 150, 55); rim(t + cellDur * 0.5, 0.5); }
      /* SU is a counted rest — no sound, by design. */
    }
    function scheduler() {
      var p = PATTERNS[current];
      var cellDur = 60 / tempo;
      while (nextTime < ctx.currentTime + 0.14) {
        var tok = p.strokes[nextIdx];
        if (tok !== 'SU') stroke(tok, nextTime, cellDur);
        scheduled.push({ time: nextTime, idx: nextIdx, tok: tok });
        if (scheduled.length > 40) scheduled.shift();
        nextTime += cellDur;
        nextIdx++;
        if (nextIdx >= p.strokes.length) { nextIdx = 0; loopCount++; }
      }
    }
    function highlight() {
      if (!playing) return;
      var now = ctx.currentTime;
      var cur = null;
      for (var i = scheduled.length - 1; i >= 0; i--) {
        if (scheduled[i].time <= now) { cur = scheduled[i]; break; }
      }
      if (cur) {
        var cells = grid.children;
        for (var j = 0; j < cells.length; j++) {
          cells[j].classList.toggle('on', j === cur.idx);
        }
        player.setAttribute('data-active', String(cur.idx));
        setStatus('Phrase <b>' + (loopCount + 1) + '</b> · stroke <b>' +
          (cur.idx + 1) + ' of ' + PATTERNS[current].strokes.length + '</b> — ' + cur.tok);
      }
      requestAnimationFrame(highlight);
    }
    function startAudio() {
      if (playing) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { setStatus('This browser has no Web Audio — the grid above still shows the pattern.'); return; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = makeNoise(ctx);
      ctx.resume();
      playing = true;
      loopCount = 0; nextIdx = 0; scheduled = [];
      nextTime = ctx.currentTime + 0.06;
      timer = setInterval(scheduler, 30);
      scheduler();
      player.setAttribute('data-audio', 'running');
      playBtn.disabled = true; stopBtn.disabled = false;
      playBtn.setAttribute('aria-pressed', 'true');
      requestAnimationFrame(highlight);
    }
    function stopAudio(silent) {
      if (!playing) return;
      playing = false;
      clearInterval(timer); timer = null;
      if (ctx) { ctx.close(); ctx = null; }
      scheduled = [];
      var cells = grid.children;
      for (var j = 0; j < cells.length; j++) cells[j].classList.remove('on');
      player.setAttribute('data-audio', 'none');
      player.setAttribute('data-active', '-1');
      playBtn.disabled = false; stopBtn.disabled = true;
      playBtn.setAttribute('aria-pressed', 'false');
      if (!silent) setStatus('Stopped. The pattern stays on the board — press Play to hear it again.');
    }
    playBtn.addEventListener('click', startAudio);
    stopBtn.addEventListener('click', function () { stopAudio(false); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAudio(true);
    });
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        stopAudio(true);
        current = tab.getAttribute('data-pat');
        tabs.forEach(function (t) {
          t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
        });
        renderGrid();
        setStatus('Ready — press Play. Nothing sounds until you do.');
      });
    });
    tempoInput.addEventListener('input', function () {
      tempo = parseInt(tempoInput.value, 10) || PATTERNS[current].tempo;
      tempoVal.textContent = tempo + ' / min';
    });
    renderGrid();
    player.setAttribute('data-audio', 'none');
    player.setAttribute('data-active', '-1');
  }

  /* ---------- booking enquiry form (contact) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('fType');
    var wanted = params.get('type');
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    var fields = {
      fName: document.getElementById('fName'),
      fEmail: document.getElementById('fEmail'),
      fType: typeSel,
      fMsg: document.getElementById('fMsg')
    };
    function fieldWrap(el) { return el.closest('.field'); }
    function validateField(key) {
      var el = fields[key];
      if (!el) return true;
      var ok = true;
      var v = (el.value || '').trim();
      if (!v) ok = false;
      if (key === 'fEmail' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ok = false;
      fieldWrap(el).classList.toggle('err', !ok);
      return ok;
    }
    Object.keys(fields).forEach(function (key) {
      var el = fields[key];
      if (!el) return;
      el.addEventListener('input', function () { validateField(key); });
      el.addEventListener('change', function () { validateField(key); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      Object.keys(fields).forEach(function (key) {
        var ok = validateField(key);
        if (!ok) { allOk = false; if (!firstBad) firstBad = fields[key]; }
      });
      if (!allOk) { if (firstBad) firstBad.focus(); return; }
      var seed = fields.fName.value.trim() + fields.fEmail.value.trim();
      var s = 0;
      for (var j = 0; j < seed.length; j++) s += seed.charCodeAt(j);
      var ref = 'KM-2026-' + (100 + (s % 900));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmType').textContent =
        fields.fType.options[fields.fType.selectedIndex].text;
      form.hidden = true;
      var conf = document.getElementById('confirmBox');
      conf.hidden = false;
      conf.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    var again = document.getElementById('againBtn');
    if (again) {
      again.addEventListener('click', function () {
        document.getElementById('confirmBox').hidden = true;
        form.hidden = false;
        form.reset();
        Object.keys(fields).forEach(function (key) {
          if (fields[key]) fieldWrap(fields[key]).classList.remove('err');
        });
      });
    }
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
