/* Sangeet Scholar — Swar Sadhana Gurukul.
   Opt-in Web Audio practice room: tanpura drone, twelve swaras, teentaal pad.
   No AudioContext is created until the visitor presses a sound control. */
(function () {
  'use strict';

  /* ── navigation & reveal ────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        toggle.focus();
      }
    });
  }

  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── practice room ──────────────────────────────────────── */
  var audioToggle = document.getElementById('audioToggle');
  var lamp = document.getElementById('lamp');
  var audioNote = document.getElementById('audioNote');
  var saPick = document.getElementById('saPick');
  var swaraOut = document.getElementById('swaraOut');
  var matrasEl = document.getElementById('matras');
  var taalToggle = document.getElementById('taalToggle');
  var taalOut = document.getElementById('taalOut');
  var tempo = document.getElementById('tempo');
  var tempoOut = document.getElementById('tempoOut');

  var ctx = null;
  var master = null;
  var droneNodes = [];
  var droneOn = false;
  var taalTimer = null;
  var taalOn = false;
  var matraIdx = -1;
  var BPM = tempo ? parseInt(tempo.value, 10) : 80;

  var BOLS = ['Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Dhin', 'Dhin', 'Dha',
              'Dha', 'Tin', 'Tin', 'Ta', 'Ta', 'Dhin', 'Dhin', 'Dha'];

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    window.__audioCreated = true;
    return ctx;
  }

  function saFreq() {
    return saPick ? parseFloat(saPick.value) : 130.81;
  }

  function saName() {
    if (!saPick) return 'C3';
    return saPick.options[saPick.selectedIndex].getAttribute('data-name') || 'C3';
  }

  function setLamp(on) {
    if (lamp) lamp.classList.toggle('on', on);
    var state = document.getElementById('soundState');
    if (state) state.textContent = on ? 'Sound on' : 'Sound off';
  }

  function startDrone() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (droneOn) return;
    var f = saFreq();
    var specs = [
      [f, 'sine', 0.040],
      [f * 1.003, 'sine', 0.028],
      [f * 1.5, 'sine', 0.024],
      [f * 2, 'sine', 0.010],
      [f * 0.5, 'triangle', 0.018]
    ];
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1600;
    filt.connect(master);
    droneNodes = [filt];
    specs.forEach(function (s) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = s[1];
      o.frequency.value = s[0];
      g.gain.value = s[2];
      o.connect(g);
      g.connect(filt);
      o.start();
      droneNodes.push(o);
    });
    droneOn = true;
    audioToggle.setAttribute('aria-pressed', 'true');
    audioToggle.textContent = 'Stop the tanpura';
    audioNote.textContent = 'Tanpura running at Sa = ' + saName() + ' · ' + f.toFixed(2) + ' Hz. The strings are tuned Sa–Pa–Sa.';
    setLamp(true);
  }

  function stopDrone() {
    droneNodes.forEach(function (n) {
      try { if (n.stop) n.stop(); } catch (e) { /* already stopped */ }
      try { n.disconnect(); } catch (e) { /* ignore */ }
    });
    droneNodes = [];
    droneOn = false;
    if (audioToggle) {
      audioToggle.setAttribute('aria-pressed', 'false');
      audioToggle.textContent = 'Start the tanpura';
    }
    if (audioNote) audioNote.textContent = 'Sound is off. The room is quiet until you ask.';
    setLamp(false);
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', function () {
      if (droneOn) stopDrone(); else startDrone();
    });
  }

  if (saPick) {
    saPick.addEventListener('change', function () {
      if (droneOn) {
        stopDrone();
        startDrone();
      }
      var label = document.getElementById('saLabel');
      if (label) label.textContent = 'Sa = ' + saName() + ' · ' + saFreq().toFixed(2) + ' Hz';
      if (swaraOut) swaraOut.innerHTML = 'Sa moves to <b>' + saName() + '</b>. Every swara is measured from this note.';
    });
  }

  /* plucked swara */
  function playSwara(button) {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var ratio = parseFloat(button.getAttribute('data-ratio'));
    var name = button.getAttribute('data-name');
    var dev = button.getAttribute('data-dev');
    var f = saFreq() * ratio;
    var t = ctx.currentTime;

    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.20, t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 1.55);
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(4200, t);
    filt.frequency.exponentialRampToValueAtTime(1400, t + 1.2);
    out.connect(filt);
    filt.connect(master);

    [[1, 'sine', 1], [2.002, 'triangle', 0.26], [3.004, 'sine', 0.08], [4.01, 'sine', 0.03]].forEach(function (p) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = p[1];
      o.frequency.value = f * p[0];
      g.gain.value = p[2];
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 1.65);
    });

    if (swaraOut) {
      swaraOut.innerHTML = 'Sounding <b>' + name + '</b> at ' + f.toFixed(2) + ' Hz · ratio ' + dev +
        (droneOn ? ' · against the tanpura' : ' · tanpura off, the note is alone');
    }
    button.classList.add('sounding');
    setTimeout(function () { button.classList.remove('sounding'); }, 340);
  }

  document.querySelectorAll('.key').forEach(function (key) {
    key.addEventListener('click', function () { playSwara(key); });
  });

  /* teentaal */
  function buildMatras() {
    if (!matrasEl) return;
    matrasEl.innerHTML = '';
    BOLS.forEach(function (bol, i) {
      var d = document.createElement('div');
      d.className = 'matra' + (i === 0 ? ' sam' : '') + (i === 8 ? ' khali' : '') + ((i === 4 || i === 12) ? ' tali' : '');
      d.setAttribute('data-mat', String(i + 1));
      d.innerHTML = '<span class="m-no">' + (i + 1) + '</span><span class="m-bol">' + bol + '</span>';
      matrasEl.appendChild(d);
    });
  }
  buildMatras();

  function bolSound(bol) {
    if (!ctx) return;
    var t = ctx.currentTime;
    var map = {
      Dha: [172, 78, 0.30, 0.34],
      Dhin: [210, 104, 0.28, 0.30],
      Tin: [430, 430, 0.10, 0.16],
      Ta: [600, 600, 0.08, 0.13],
      Na: [330, 300, 0.10, 0.15],
      Ge: [120, 92, 0.26, 0.28],
      Ke: [500, 470, 0.08, 0.12]
    };
    var m = map[bol] || map.Na;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = bol === 'Tin' || bol === 'Ta' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(m[0], t);
    o.frequency.exponentialRampToValueAtTime(m[1], t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(m[2], t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + m[3]);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + m[3] + 0.02);
  }

  function tick() {
    matraIdx = (matraIdx + 1) % 16;
    if (matrasEl) {
      matrasEl.querySelectorAll('.matra').forEach(function (el, i) {
        el.classList.toggle('now', i === matraIdx);
      });
    }
    bolSound(BOLS[matraIdx]);
    if (taalOut) {
      var toSam = (16 - matraIdx) % 16;
      taalOut.textContent = 'Matra ' + (matraIdx + 1) + ' of 16 · ' + BOLS[matraIdx] +
        ' · ' + (matraIdx === 0 ? 'sam' : 'sam in ' + toSam);
    }
  }

  function startTaal() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    taalOn = true;
    matraIdx = -1;
    tick();
    taalTimer = setInterval(tick, 60000 / BPM);
    if (taalToggle) {
      taalToggle.setAttribute('aria-pressed', 'true');
      taalToggle.textContent = 'Stop the taal';
    }
    setLamp(true);
  }

  function stopTaal() {
    if (taalTimer) clearInterval(taalTimer);
    taalTimer = null;
    taalOn = false;
    matraIdx = -1;
    if (matrasEl) {
      matrasEl.querySelectorAll('.matra').forEach(function (el) { el.classList.remove('now'); });
    }
    if (taalToggle) {
      taalToggle.setAttribute('aria-pressed', 'false');
      taalToggle.textContent = 'Start the taal';
    }
    if (taalOut) taalOut.textContent = 'Sam on 1 · khali on 9 · laya ' + BPM;
  }

  if (taalToggle) {
    taalToggle.addEventListener('click', function () {
      if (taalOn) stopTaal(); else startTaal();
    });
  }

  if (tempo) {
    tempo.addEventListener('input', function () {
      BPM = parseInt(tempo.value, 10);
      if (tempoOut) tempoOut.textContent = BPM + ' bpm';
      if (taalOn) {
        clearInterval(taalTimer);
        taalTimer = setInterval(tick, 60000 / BPM);
      }
      if (taalOut && !taalOn) taalOut.textContent = 'Sam on 1 · khali on 9 · laya ' + BPM;
    });
  }

  /* ── admission form ─────────────────────────────────────── */
  var admit = document.getElementById('admitForm');
  if (admit) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function mark(field, ok) {
      var wrap = field.closest('.f');
      if (!wrap) return;
      wrap.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    admit.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = admit.querySelector('#name');
      var email = admit.querySelector('#email');
      var message = admit.querySelector('#message');
      var okName = name.value.trim().length > 1;
      var okEmail = emailRe.test(email.value.trim());
      var okMessage = message.value.trim().length > 4;
      mark(name, okName); mark(email, okEmail); mark(message, okMessage);
      if (!okName || !okEmail || !okMessage) {
        (!okName ? name : (!okEmail ? email : message)).focus();
        return;
      }
      var ok = document.getElementById('formOk');
      var who = name.value.trim().split(' ')[0].replace(/[<>&]/g, '');
      ok.innerHTML = '<strong>Namaste, ' + who + '.</strong> Your note is with the gurukul. Anjali replies on Tuesdays and Fridays after the morning riyaz, and will offer you a trial lesson time.';
      ok.classList.add('show');
      admit.reset();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    admit.addEventListener('input', function (e) {
      var wrap = e.target.closest('.f');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
})();
