/* Ananya Bhattacharya — sitar
   Six evening ragas, a synthesised pluck, and a tanpura that is only ever switched on. */

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

  var SEMI = { S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11 };
  var NAMES = { S: 'Sa', r: 'komal Re', R: 'Re', g: 'komal Ga', G: 'Ga', m: 'shuddha Ma', M: 'tivra Ma', P: 'Pa', d: 'komal Dha', D: 'Dha', n: 'komal Ni', N: 'Ni' };

  var RAGAS = {
    bhairav: {
      name: 'Bhairav', time: '05:50', label: 'before sunrise', mood: 'The raga of the hour before light. It is slow and austere, and the two komal notes in it are what give it the weight.',
      aroha: 'S r G M P d N S\u0304', avaroha: 'S\u0304 N d P M G r S', pakad: 'G M d P, M G r S',
      vadi: 'Dha / Re', taraf: 'r, G, M, P, d, N', avoid: 'shuddha Re and shuddha Dha',
      body: 'Bhairav is the same scale as Bhairavi with one difference of emphasis, and musicians spend a lifetime on that difference. The komal Re is not a slide from Sa; it is reached from Ga, and it falls.',
      listen: 'The dha is held longer than you expect and the Re arrives from above. Played fast, it stops being Bhairav.',
      phrase: [['G', 0.9], ['M', 0.7], ['d', 0.85], ['P', 0.6], ['M', 0.6], ['G', 0.7], ['r', 0.9], ['S', 1.2]],
      strings: ['M', 'S', 'P', 'S', 'P', 'S']
    },
    marwa: {
      name: 'Marwa', time: '17:15', label: 'late afternoon', mood: 'The sun is still up and the raga refuses Pa. It is unsettled on purpose: the ear keeps waiting for a note that never comes.',
      aroha: 'S r G M\u0304 D N S\u0304', avaroha: 'S\u0304 N D M\u0304 G r S', pakad: 'r G M\u0304 D, M\u0304 G r S',
      vadi: 'komal Re / Dha', taraf: 'r, G, M\u0304, D, N', avoid: 'Pa, entirely',
      body: 'No Pa anywhere, in either direction. That absence is the raga. The tivra Ma is the only bright thing in it, and the resolution always comes back to the komal Re.',
      listen: 'The phrase r G M\u0304 D climbs, and the return M\u0304 G r S falls. If a Pa slips in, the raga has gone.',
      phrase: [['r', 0.8], ['G', 0.7], ['M', 0.9], ['D', 0.7], ['M', 0.6], ['G', 0.7], ['r', 1.0], ['S', 1.3]],
      strings: ['M', 'S', 'D', 'S', 'D', 'S']
    },
    puriya: {
      name: 'Puriya Dhanashri', time: '18:10', label: 'sunset', mood: 'A sunset raga with the same notes as Puriya and a different centre. It is the most patient raga I play, and the one that suffers most from being hurried.',
      aroha: 'S r G M\u0304 P d N S\u0304', avaroha: 'S\u0304 N d P M\u0304 G r S', pakad: 'N r G M\u0304 P, M\u0304 G r S',
      vadi: 'Ga / Ni', taraf: 'r, G, M\u0304, P, d, N', avoid: 'shuddha Re and shuddha Dha',
      body: 'Both Dha and Ni are komal, and both Re and Ga are approached with care. The Ga is the note the raga rests on; the Ni in the ascent is a grace note, not a destination.',
      listen: 'The P is touched and left. If you hear a long Pa, the player is thinking of another raga.',
      phrase: [['N', 0.6], ['r', 0.8], ['G', 0.9], ['M', 0.8], ['P', 0.7], ['M', 0.6], ['G', 0.8], ['r', 0.8], ['S', 1.2]],
      strings: ['M', 'S', 'P', 'S', 'P', 'S']
    },
    yaman: {
      name: 'Yaman', time: '19:30', label: 'early evening', mood: 'The first raga of the night and the one every student is given first. It is calm and wide, and it forgives a beginner.',
      aroha: 'S R G M\u0304 P D N S\u0304', avaroha: 'S\u0304 N D P M\u0304 G R S', pakad: 'N R G M\u0304 P, M G R S',
      vadi: 'Ga / Ni', taraf: 'N, R, G, M\u0304, P, D', avoid: 'shuddha Ma, komal Ga',
      body: 'The raised fourth is the whole raga. Play it in the ascent and touch it lightly coming down; a Yaman without the tivra Ma is a Bhupali with extra notes.',
      listen: 'In the pakad the N is a grace note and the G is held. If you can hear the G before the M\u0304, you have the raga.',
      phrase: [['N', 0.5], ['R', 0.6], ['G', 0.85], ['M', 0.9], ['P', 0.7], ['M', 0.6], ['G', 0.8], ['R', 0.7], ['S', 1.2]],
      strings: ['M', 'S', 'P', 'S', 'P', 'S']
    },
    bageshri: {
      name: 'Bageshri', time: '23:00', label: 'late night', mood: 'A late raga for a room that has gone quiet. It is the one I am asked for most, and the one most often played too sweetly.',
      aroha: 'S g M D n S\u0304', avaroha: 'S\u0304 n D M P D g R S', pakad: 'M D n S\u0304, n D M, P D g R S',
      vadi: 'Ma / Sa', taraf: 'g, M, D, n, S\u0304', avoid: 'shuddha Ga and shuddha Ni in the ascent',
      body: 'Bageshri is a night raga built on the komal Ga and komal Ni, with a long shuddha Ma to hold it together. The Pa appears in the descent and not in the ascent, which is where most student versions go wrong.',
      listen: 'The M is held and the D n S\u0304 comes as one gesture. Then it has to come down through P, not straight to g.',
      phrase: [['M', 0.9], ['D', 0.7], ['n', 0.7], ['S', 0.9], ['n', 0.6], ['D', 0.7], ['M', 0.8], ['P', 0.5], ['D', 0.6], ['g', 0.8], ['R', 0.7], ['S', 1.2]],
      strings: ['M', 'S', 'P', 'S', 'P', 'S']
    },
    malkauns: {
      name: 'Malkauns', time: '00:30', label: 'after midnight', mood: 'The midnight raga, and the one with the fewest notes. Five, no Re and no Pa, and it does not need either.',
      aroha: 'S g M d n S\u0304', avaroha: 'S\u0304 n d M g S', pakad: 'n S g M, g M d n S\u0304',
      vadi: 'Ma / Sa', taraf: 'g, M, d, n', avoid: 'Re and Pa, entirely',
      body: 'Malkauns has no Re and no Pa. The komal Ga, komal Dha and komal Ni carry everything, and the shuddha Ma is the only still point. It is a raga of drone and descent.',
      listen: 'The lower n is touched before Sa in the ascent, and the descent never hurries. If it sounds like a scale, it has been played too evenly.',
      phrase: [['n', 0.7], ['S', 0.8], ['g', 0.9], ['M', 1.0], ['d', 0.7], ['n', 0.8], ['S', 0.9], ['n', 0.7], ['d', 0.7], ['M', 1.0], ['g', 0.9], ['S', 1.4]],
      strings: ['M', 'S', 'M', 'S', 'M', 'S']
    }
  };

  var ORDER = ['bhairav', 'marwa', 'puriya', 'yaman', 'bageshri', 'malkauns'];

  var el = {
    arc: document.getElementById('arc'),
    list: document.getElementById('raga-list'),
    state: document.getElementById('audio-state'),
    sel: document.getElementById('sel-raga'),
    play: document.getElementById('play'),
    stop: document.getElementById('stop'),
    drone: document.getElementById('drone'),
    tonic: document.getElementById('tonic'),
    speed: document.getElementById('speed'),
    tone: document.getElementById('tone'),
    foot: document.getElementById('player-foot'),
    strings: document.getElementById('strings'),
    shKicker: document.getElementById('sh-kicker'),
    shName: document.getElementById('sh-name'),
    shMood: document.getElementById('sh-mood'),
    shAroha: document.getElementById('sh-aroha'),
    shAvaroha: document.getElementById('sh-avaroha'),
    shPakad: document.getElementById('sh-pakad'),
    shVadi: document.getElementById('sh-vadi'),
    shTaraf: document.getElementById('sh-taraf'),
    shAvoid: document.getElementById('sh-avoid'),
    shBody: document.getElementById('sh-body'),
    shListen: document.getElementById('sh-listen')
  };

  var ready = !!(el.arc && el.list);

  var selected = 'yaman';
  var chosenKey = 'yaman';
  var timers = [];
  var engine = { ctx: null, master: null, contexts: 0, plays: 0, playing: false, drone: false, droneTimer: null };
  var cache = {};

  if (ready) {
    ORDER.forEach(function (key) {
      var r = RAGAS[key];
      var a = document.createElement('button');
      a.className = 'arc__item';
      a.type = 'button';
      a.setAttribute('data-raga', key);
      a.innerHTML = '<span class="arc__time">' + r.time + '</span><span class="arc__name">' + r.name + '</span>';
      a.addEventListener('click', function () { choose(key); });
      el.arc.appendChild(a);

      var b = document.createElement('button');
      b.className = 'raga';
      b.type = 'button';
      b.setAttribute('data-raga', key);
      b.innerHTML = '<span class="raga__name">' + r.name + '</span><span class="raga__time">' + r.time + '</span><span class="raga__mood">' + r.label + '</span>';
      b.addEventListener('click', function () { choose(key); });
      el.list.appendChild(b);
    });
  }

  function base() { return Number(el.tonic.value); }
  function freq(semi) { return base() * Math.pow(2, semi / 12); }
  function rate(semi) { return Math.pow(2, semi / 12); }

  /* ---------- synthesis ---------- */

  function ensureContext() {
    if (engine.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { el.state.textContent = 'This browser will not make a string sound. The page still reads.'; return false; }
    engine.ctx = new AC();
    engine.contexts++;
    engine.master = engine.ctx.createGain();
    engine.master.gain.value = 0.6;
    engine.master.connect(engine.ctx.destination);
    return true;
  }

  function pluckBuffer(f) {
    var key = Math.round(f * 100) + '|' + el.tone.value;
    if (cache[key]) return cache[key];
    var ctx = engine.ctx;
    var sr = ctx.sampleRate;
    var dur = 2.6;
    var len = Math.floor(sr * dur);
    var n = Math.max(2, Math.round(sr / f));
    var ring = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var t = i / n;
      ring[i] = (Math.random() * 2 - 1) * (1 - t * 0.7);
    }
    var buf = ctx.createBuffer(1, len, sr);
    var out = buf.getChannelData(0);
    var decay = el.tone.value === '1' ? 0.9975 : 0.9955;
    var prev = 0, idx = 0;
    for (var s = 0; s < len; s++) {
      var v = ring[idx];
      var mixed = 0.5 * (v + prev);
      ring[idx] = mixed * decay;
      out[s] = v;
      prev = v;
      idx = (idx + 1) % n;
    }
    /* gentle body: a short attack fade and a tail fade */
    for (var a2 = 0; a2 < 240 && a2 < len; a2++) out[a2] *= a2 / 240;
    for (var t2 = 0; t2 < 2200; t2++) out[len - 1 - t2] *= t2 / 2200;
    cache[key] = buf;
    return buf;
  }

  function playNote(semi, when, gainValue, bendSemi) {
    var ctx = engine.ctx;
    var src = ctx.createBufferSource();
    src.buffer = pluckBuffer(freq(semi));
    var g = ctx.createGain();
    g.gain.value = gainValue || 0.5;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = el.tone.value === '1' ? 5200 : 2200;
    src.connect(lp);
    lp.connect(g);
    g.connect(engine.master);
    var t = (when || ctx.currentTime) + 0.005;
    if (bendSemi) {
      src.playbackRate.setValueAtTime(1, t);
      src.playbackRate.linearRampToValueAtTime(rate(bendSemi), t + 0.16);
    }
    src.start(t);
    engine.plays++;
    return src;
  }

  function startDrone() {
    if (!engine.ctx || engine.droneTimer) return;
    var pattern = [['P', 0.34], ['S', 0.3], ['S', 0.26], ['S', 0.22]];
    var i = 0;
    function step() {
      if (!engine.ctx) return;
      var p = pattern[i % pattern.length];
      playNote(SEMI[p[0]], engine.ctx.currentTime, 0.16, null);
      i++;
    }
    step();
    engine.droneTimer = setInterval(step, 1450);
  }

  function stopDrone() {
    if (engine.droneTimer) clearInterval(engine.droneTimer);
    engine.droneTimer = null;
  }

  function closeAudio() {
    stopDrone();
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    if (engine.ctx) { try { engine.ctx.close(); } catch (e) {} }
    engine.ctx = null;
    engine.master = null;
    engine.playing = false;
    engine.drone = false;
    el.drone.checked = false;
  }

  /* ---------- reading ---------- */

  function choose(key) {
    selected = key;
    chosenKey = key;
    var r = RAGAS[key];
    document.querySelectorAll('[data-raga]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-raga') === key);
    });
    el.sel.textContent = r.name + ' \u00b7 ' + r.label;
    el.shKicker.textContent = r.label + ' \u00b7 ' + r.time;
    el.shName.textContent = r.name;
    el.shMood.textContent = r.mood;
    el.shAroha.textContent = r.aroha;
    el.shAvaroha.textContent = r.avaroha;
    el.shPakad.textContent = r.pakad;
    el.shVadi.textContent = r.vadi;
    el.shTaraf.textContent = r.taraf;
    el.shAvoid.textContent = r.avoid;
    el.shBody.textContent = r.body;
    el.shListen.textContent = r.listen;
    el.foot.innerHTML = 'The pakad of ' + r.name + ': <span class="notes">' + r.pakad + '</span> \u2014 ' + r.listen.split('. ')[0] + '.';
  }

  function playPakad() {
    if (!ensureContext()) return;
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    stopDrone();
    if (el.drone.checked) { engine.drone = true; startDrone(); }
    engine.playing = true;
    el.play.textContent = 'Playing\u2026';
    el.play.disabled = true;
    el.stop.disabled = false;

    var r = RAGAS[selected];
    var laya = Number(el.speed.value);
    var t = 0.1;
    var last = null;
    r.phrase.forEach(function (note) {
      var dur = note[1] / laya;
      var semi = SEMI[note[0]];
      var bend = null;
      if (last !== null && Math.abs(semi - last) > 1) bend = last - semi;
      (function (sm, at, bnd, d) {
        timers.push(setTimeout(function () {
          playNote(sm, engine.ctx ? engine.ctx.currentTime : 0, 0.55, bnd);
        }, at * 1000));
      })(semi, t, bend, dur);
      last = semi;
      t += dur;
    });
    var end = t + 0.9;
    timers.push(setTimeout(function () {
      engine.playing = false;
      el.play.textContent = 'Hear the pakad';
      el.play.disabled = false;
      el.state.textContent = 'The pakad of ' + r.name + ' is finished \u00b7 sound stays open until you press stop';
    }, end * 1000));
    el.state.textContent = 'Playing the pakad of ' + r.name;
  }

  if (ready) {
    choose('yaman');

    el.play.addEventListener('click', playPakad);

    el.stop.addEventListener('click', function () {
      closeAudio();
      el.play.textContent = 'Hear the pakad';
      el.play.disabled = false;
      el.stop.disabled = true;
      el.state.textContent = 'Sound closed. Nothing plays until you ask again';
    });

    el.drone.addEventListener('change', function () {
      if (!el.drone.checked) {
        stopDrone();
        engine.drone = false;
        return;
      }
      if (!ensureContext()) { el.drone.checked = false; return; }
      engine.drone = true;
      startDrone();
      el.stop.disabled = false;
      el.state.textContent = 'Tanpura on \u00b7 Sa and Pa, at ' + base() + ' Hz';
    });

    el.tonic.addEventListener('change', function () {
      cache = {};
      if (engine.ctx && el.drone.checked) { stopDrone(); startDrone(); }
      el.state.textContent = engine.ctx ? 'Sa is now ' + base() + ' Hz' : 'Sound off until you press play';
    });

    el.tone.addEventListener('change', function () {
      cache = {};
      if (engine.ctx && el.drone.checked) { stopDrone(); startDrone(); }
    });

    el.strings.addEventListener('click', function () {
      if (!ensureContext()) return;
      var r = RAGAS[selected];
      el.stop.disabled = false;
      var i = 0;
      r.strings.forEach(function (n) {
        playNote(SEMI[n], engine.ctx.currentTime + i * 0.22, 0.5, null);
        i++;
      });
      el.state.textContent = 'Six strings of ' + r.name + ' \u00b7 ' + r.strings.map(function (n) { return NAMES[n]; }).join(', ');
    });

    el.speed.addEventListener('change', function () {
      if (engine.ctx) el.state.textContent = 'Laya set; press play to hear it';
    });
  }

  window.__raga = {
    get contexts() { return engine.contexts; },
    get plays() { return engine.plays; },
    get audioOn() { return !!engine.ctx; },
    get playing() { return engine.playing; },
    get drone() { return engine.drone; },
    get choice() { return chosenKey; },
    ragas: ORDER
  };

  /* ---------- concerts filter ---------- */

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

  /* ---------- invite form ---------- */

  var form = document.getElementById('invite-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('s-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'Who is writing.' },
      venue: { el: document.getElementById('s-venue'), test: function (v) { return v.trim().length >= 2; }, msg: 'The hall, house or festival.' },
      email: { el: document.getElementById('s-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email that works.' },
      date: { el: document.getElementById('s-date'), test: function (v) { return !!v; }, msg: 'The date of the concert.' },
      message: { el: document.getElementById('s-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'The hour, the room, and whether there is a tanpura player.' }
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
      var agree = document.getElementById('s-agree');
      var agreeErr = document.getElementById('s-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm the engagement and the date are settled enough to plan around.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) { (form.querySelector('[aria-invalid="true"]') || agree).focus(); return; }
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = fields.date.el.value + ' \u00b7 ' + document.getElementById('s-kind').value;
      document.getElementById('sent-where').textContent = fields.venue.el.value.trim();
      form.hidden = true;
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
