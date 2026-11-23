/* Sarada Vishwanathan — Vedic chanting
   The swara lab: three pitch levels, a contour, and an AudioContext that does not exist
   until somebody presses a button. */

(function () {
  'use strict';

  var navbtn = document.querySelector('.navbtn');
  var nav = document.getElementById('nav');
  if (navbtn && nav) {
    navbtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- the line ---------- */

  var LINE = [
    { dev: 'ॐ', iast: 'oṃ', svara: 'a', note: 'The syllable before the line. It is held on the base note, and everything after it returns to this height.' },
    { dev: 'भूर्', iast: 'bhūr', svara: 'u', note: 'The first vyāhṛti. It is raised, and it sets the height the rest of the line returns to. Say it on the same breath as the oṃ, without a gap.' },
    { dev: 'भुवः', iast: 'bhuvaḥ', svara: 'a', note: 'The second vyāhṛti, back on the base. The fall from bhūr to bhuvaḥ is the whole lesson: a fourth, without sliding.' },
    { dev: 'स्वः', iast: 'svaḥ', svara: 's', note: 'The third vyāhṛti, and the svarita. It begins at the raised height and falls away in the same syllable.' },
    { dev: 'तत्', iast: 'tat', svara: 'u', note: 'The line of the Gāyatrī begins. Raised, short, and closed with the tongue at the ridge.' },
    { dev: 'स', iast: 'sa', svara: 'a', note: 'Low. The recitation drops back to the base after the raised tat.' },
    { dev: 'वि', iast: 'vi', svara: 'u', note: 'Raised. A short lift, the kind that keeps a line moving rather than singing.' },
    { dev: 'तुर्', iast: 'tur', svara: 'a', note: 'Low, and closed. The reverted ṛ is the sound most students from outside the tradition get wrong first.' },
    { dev: 'व', iast: 'va', svara: 's', note: 'The second svarita of the line. From here to the end the voice is falling more often than rising.' },
    { dev: 'रे', iast: 're', svara: 'u', note: 'Raised, and long. Hold the vowel; a short e closes the syllable and loses the accent.' },
    { dev: 'णि', iast: 'ṇi', svara: 'a', note: 'Low, with the retroflex ṇ. The tongue curls back, and the breath does not stop.' },
    { dev: 'यं', iast: 'yaṃ', svara: 's', note: 'The line closes on a svarita: the nasal falls with the pitch. In this tradition it is not cut off; it is let go.' }
  ];

  var SVARA = {
    u: { name: 'Udātta', mark: 'unmarked, and raised', level: 1 },
    a: { name: 'Anudātta', mark: 'a line beneath', level: 0 },
    s: { name: 'Svarita', mark: 'a vertical stroke above', level: 2 }
  };

  var el = {
    box: document.getElementById('syllables'),
    state: document.getElementById('audio-state'),
    sel: document.getElementById('sel-name'),
    canvas: document.getElementById('contour'),
    play: document.getElementById('play'),
    stop: document.getElementById('stop'),
    drone: document.getElementById('drone'),
    tonic: document.getElementById('tonic'),
    tempo: document.getElementById('tempo'),
    tempoOut: document.getElementById('tempo-out'),
    voice: document.getElementById('voice'),
    foot: document.getElementById('bench-foot'),
    roDev: document.getElementById('ro-dev'),
    roTitle: document.getElementById('ro-title'),
    roSvara: document.getElementById('ro-svara'),
    roPitch: document.getElementById('ro-pitch'),
    roMark: document.getElementById('ro-mark'),
    roBody: document.getElementById('ro-body'),
    roHow: document.getElementById('ro-how')
  };

  var ready = !!el.box;

  var selected = 1;
  var timers = [];
  var current = -1;

  var engine = {
    ctx: null,
    master: null,
    droneNodes: [],
    droneOn: false,
    playing: false,
    contexts: 0,
    plays: 0
  };

  function base() { return Number(el.tonic.value); }
  function tempo() { return Number(el.tempo.value); }

  function ratio(svara) {
    if (svara === 'u') return 4 / 3;
    if (svara === 's') return 4 / 3;
    return 1;
  }

  function pitchOf(i) {
    return Math.round(base() * ratio(LINE[i].svara));
  }

  /* ---------- audio ---------- */

  function ensureContext() {
    if (engine.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      el.state.textContent = 'This browser will not make a tone. The contour still works.';
      return false;
    }
    engine.ctx = new AC();
    engine.contexts++;
    engine.master = engine.ctx.createGain();
    engine.master.gain.value = 0.16;
    engine.master.connect(engine.ctx.destination);
    return true;
  }

  function makeTone(from, to, dur, when) {
    var ctx = engine.ctx;
    var t0 = (when || ctx.currentTime) + 0.01;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = el.voice.value === 'reed' ? 1600 : 3400;
    osc.type = el.voice.value === 'reed' ? 'triangle' : 'sine';
    if (to) {
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.82);
    } else {
      osc.frequency.setValueAtTime(from, t0);
    }
    var peak = el.voice.value === 'reed' ? 0.5 : 0.42;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.05);
    gain.gain.setValueAtTime(peak, t0 + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(engine.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    engine.plays++;
    return osc;
  }

  function startDrone() {
    if (!engine.ctx || engine.droneNodes.length) return;
    var ctx = engine.ctx;
    [1, 1.5].forEach(function (mult, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = base() * mult;
      g.gain.value = i === 0 ? 0.035 : 0.018;
      o.connect(g);
      g.connect(engine.master);
      o.start();
      engine.droneNodes.push(o);
    });
  }

  function stopDrone() {
    engine.droneNodes.forEach(function (o) { try { o.stop(); } catch (e) {} });
    engine.droneNodes = [];
  }

  function closeAudio() {
    stopDrone();
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    if (engine.ctx) {
      try { engine.ctx.close(); } catch (e) {}
    }
    engine.ctx = null;
    engine.master = null;
    engine.playing = false;
    engine.droneOn = false;
    el.drone.checked = false;
  }

  /* ---------- rendering ---------- */

  function buildChips() {
    el.box.innerHTML = LINE.map(function (s, i) {
      return '<button class="syl" type="button" data-svara="' + s.svara + '" data-i="' + i + '" aria-label="' +
        s.iast + ', ' + SVARA[s.svara].name + '">' +
        '<span class="syl__dev" lang="sa">' + s.dev + '</span>' +
        '<span class="syl__iast">' + s.iast + '</span>' +
        '<span class="syl__mark" aria-hidden="true"></span></button>';
    }).join('');
    el.box.querySelectorAll('.syl').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.getAttribute('data-i'));
        select(i);
        var ok = ensureContext();
        if (!ok) return;
        el.stop.disabled = false;
        stopDrone();
        var dur = 1.1;
        makeTone(pitchOf(i), LINE[i].svara === 's' ? Math.round(base() * 1.04) : null, dur);
        if (el.drone.checked) startDrone();
        engine.droneOn = el.drone.checked;
        el.state.textContent = 'Playing ' + LINE[i].iast + ' alone at ' + pitchOf(i) + ' Hz';
      });
    });
  }

  function select(i) {
    selected = i;
    el.box.querySelectorAll('.syl').forEach(function (b, k) {
      b.classList.toggle('is-on', k === i);
    });
    var s = LINE[i];
    el.sel.textContent = s.iast.charAt(0).toUpperCase() + s.iast.slice(1) + ' \u00b7 ' + SVARA[s.svara].name.toLowerCase();
    el.roDev.textContent = s.dev;
    el.roTitle.textContent = s.iast.charAt(0).toUpperCase() + s.iast.slice(1);
    el.roSvara.textContent = SVARA[s.svara].name;
    el.roPitch.textContent = s.svara === 's' ? pitchOf(i) + ' \u2192 ' + Math.round(base() * 1.04) + ' Hz' : pitchOf(i) + ' Hz';
    el.roMark.textContent = SVARA[s.svara].mark;
    el.roBody.textContent = s.note;
    el.roHow.innerHTML = howto(s);
    drawContour();
  }

  function howto(s) {
    if (s.svara === 'u') {
      return [
        'Hum the base note, then lift a fourth and hold it for two breaths.',
        'The lift comes from the breath, not the jaw. If the throat closes, the pitch is too high for you.',
        'Say the syllable again on the base, then lift. Two levels, no slide.'
      ];
    }
    if (s.svara === 'a') {
      return [
        'Drop back to the base without sliding through the middle.',
        'Keep the vowel open; a closed vowel makes anudātta sound like a mumble.',
        'Practise the pair: raised, low, raised, low. The gap is a fourth, every time.'
      ];
    }
    return [
      'Start at the raised pitch, then let it fall on the same syllable.',
      'The fall is quick, about a third of the syllable. Do not hold the top.',
      'In this line the svarita comes every third syllable, which is what gives the recitation its shape.'
    ];
  }

  /* ---------- canvas ---------- */

  function levelY(svara, t) {
    var top = 52, mid = 112, low = 168;
    if (svara === 'u') return top;
    if (svara === 'a') return low;
    return top + (low - top) * (t === undefined ? 0.55 : t);
  }

  function drawContour() {
    var c = el.canvas;
    if (!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    var padL = 46, padR = 26;
    var step = (W - padL - padR) / (LINE.length - 1);

    /* three level rules */
    ctx.strokeStyle = 'rgba(236,224,198,0.13)';
    ctx.lineWidth = 1;
    [[52, 'udātta'], [112, 'svarita falls'], [168, 'anudātta']].forEach(function (row) {
      ctx.beginPath();
      ctx.moveTo(padL - 14, row[0]);
      ctx.lineTo(W - padR + 10, row[0]);
      ctx.stroke();
      ctx.fillStyle = 'rgba(236,224,198,0.42)';
      ctx.font = '13px Georgia, serif';
      ctx.fillText(row[1], 2, row[0] + 4);
    });

    /* the line */
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(236,224,198,0.45)';
    ctx.beginPath();
    LINE.forEach(function (s, i) {
      var x = padL + step * i;
      var y = levelY(s.svara);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (s.svara === 's') {
        ctx.lineTo(x + step * 0.42, levelY('s', 1));
      }
    });
    ctx.stroke();

    /* syllables */
    LINE.forEach(function (s, i) {
      var x = padL + step * i;
      var y = levelY(s.svara);
      var on = i === current || i === selected;
      ctx.beginPath();
      ctx.arc(x, y, on ? 5.2 : 3.4, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#d98a52' : 'rgba(236,224,198,0.7)';
      ctx.fill();
      if (s.svara === 'u') {
        ctx.strokeStyle = 'rgba(236,224,198,0.5)';
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 8);
        ctx.lineTo(x, y - 14);
        ctx.lineTo(x + 4, y - 8);
        ctx.stroke();
      }
      if (s.svara === 'a') {
        ctx.strokeStyle = 'rgba(236,224,198,0.4)';
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 9);
        ctx.lineTo(x + 6, y + 9);
        ctx.stroke();
      }
      if (s.svara === 's') {
        ctx.strokeStyle = 'rgba(201,162,39,0.75)';
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y - 16);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(236,224,198,0.42)';
      ctx.font = '13px Georgia, serif';
      ctx.fillText(s.iast, x - 8, H - 10);
    });
  }

  /* ---------- the recitation ---------- */

  function durFor(svara, t) {
    var scale = 84 / tempo();
    if (svara === 'u') return 0.72 * scale;
    if (svara === 's') return 0.9 * scale;
    return 0.58 * scale;
  }

  function recite() {
    if (!ensureContext()) return;
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    current = -1;
    engine.playing = true;
    engine.droneOn = el.drone.checked;
    if (engine.droneOn) startDrone();
    el.play.textContent = 'Reciting\u2026';
    el.play.disabled = true;
    el.stop.disabled = false;

    var t = 0.08;
    var total = 0;
    LINE.forEach(function (s, i) {
      var d = durFor(s.svara);
      total += d;
      (function (idx, at, dur) {
        timers.push(setTimeout(function () {
          current = idx;
          select(idx);
          var from = pitchOf(idx);
          var to = LINE[idx].svara === 's' ? Math.round(base() * 1.04) : null;
          makeTone(from, to, dur * 0.94, engine.ctx ? engine.ctx.currentTime : 0);
          el.state.textContent = 'Reciting \u00b7 ' + LINE[idx].iast + ' \u00b7 ' + SVARA[LINE[idx].svara].name.toLowerCase();
        }, at * 1000));
      })(i, t, d);
      t += d;
    });

    timers.push(setTimeout(function () {
      current = -1;
      engine.playing = false;
      el.play.textContent = 'Recite the line';
      el.play.disabled = false;
      el.state.textContent = 'The line is finished \u00b7 open until you press stop';
      select(selected);
    }, (t + 0.15) * 1000));
  }

  /* ---------- wiring ---------- */

  if (ready) {
    buildChips();
    select(1);
    el.tempoOut.textContent = el.tempo.value;

    el.play.addEventListener('click', recite);

    el.stop.addEventListener('click', function () {
      closeAudio();
      current = -1;
      el.play.textContent = 'Recite the line';
      el.play.disabled = false;
      el.stop.disabled = true;
      el.state.textContent = 'Sound closed. The page makes no tone until you press play again';
      select(selected);
    });

    el.drone.addEventListener('change', function () {
      if (!el.drone.checked) {
        stopDrone();
        engine.droneOn = false;
        return;
      }
      if (!ensureContext()) { el.drone.checked = false; return; }
      engine.droneOn = true;
      startDrone();
      el.stop.disabled = false;
      el.state.textContent = 'Drone on at ' + base() + ' Hz and a fifth above';
    });

    el.tonic.addEventListener('change', function () {
      if (engine.ctx) {
        stopDrone();
        if (el.drone.checked) startDrone();
      }
      select(selected);
      el.foot.textContent = 'Udātta sits a fourth above the base: at ' + base() + ' Hz that is ' + Math.round(base() * 4 / 3) + ' Hz. The svarita falls from there to just above the base.';
      el.state.textContent = engine.ctx ? 'Base note is now ' + base() + ' Hz' : 'Sound off until you press play';
    });

    el.tempo.addEventListener('input', function () {
      el.tempoOut.textContent = el.tempo.value;
    });

    el.voice.addEventListener('change', function () {
      if (engine.ctx) {
        stopDrone();
        if (el.drone.checked) startDrone();
      }
    });

    window.__svara = {
      get contexts() { return engine.contexts; },
      get plays() { return engine.plays; },
      get audioOn() { return !!engine.ctx; },
      get playing() { return engine.playing; },
      get drone() { return engine.droneOn; },
      get current() { return current; },
      get selected() { return selected; },
      line: LINE,
      pitch: pitchOf
    };
  }

  /* ---------- classes filter ---------- */

  var filters = document.querySelector('.filters');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-kind]'));
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var want = chip.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (it) { it.hidden = want !== 'all' && it.getAttribute('data-kind') !== want; });
    });
  }

  /* ---------- enrolment ---------- */

  var form = document.getElementById('enrol-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('v-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'The name I will call you by.' },
      email: { el: document.getElementById('v-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email that works.' },
      city: { el: document.getElementById('v-city'), test: function (v) { return v.trim().length >= 2; }, msg: 'Where you will be sitting, for the in-person group.' },
      message: { el: document.getElementById('v-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'What you have chanted before, and how you learned it.' }
    };
    function setErr(k, on) {
      var f = fields[k];
      var box = f.el.closest('.field').querySelector('.err');
      if (on) f.el.setAttribute('aria-invalid', 'true');
      else f.el.removeAttribute('aria-invalid');
      box.textContent = on ? f.msg : '';
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        if (fields[k].el.getAttribute('aria-invalid') === 'true' && fields[k].test(fields[k].el.value)) setErr(k, false);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = 0;
      Object.keys(fields).forEach(function (k) {
        var good = fields[k].test(fields[k].el.value);
        setErr(k, !good);
        if (!good) bad++;
      });
      var agree = document.getElementById('v-agree');
      var agreeErr = document.getElementById('v-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm you can attend the hour you have chosen.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) { (form.querySelector('[aria-invalid="true"]') || agree).focus(); return; }
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = document.getElementById('v-group').value + ' \u00b7 ' + document.getElementById('v-level').value;
      document.getElementById('sent-where').textContent = fields.city.el.value.trim();
      form.hidden = true;
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
