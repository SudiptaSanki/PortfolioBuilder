/* Bansuri Breeze — the raga-time chart.
   Vanilla JS: mobile menu, reveal, the raga explorer, a Web Audio
   scale demonstration (user-started only), and the enquiry form. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) e.preventDefault();
  });

  /* ---------- mobile menu ---------- */
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760 && panel.classList.contains('open')) closeMenu(false);
    });
  }

  /* ---------- reveal (read-down-the-chart) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- the raga-time explorer ---------- */
  var RATIO = {
    'Sa': 1, 'Re_k': 16 / 15, 'Re': 9 / 8, 'Ga_k': 6 / 5, 'Ga': 5 / 4,
    'Ma': 4 / 3, 'Ma_t': 45 / 32, 'Pa': 3 / 2, 'Dha_k': 8 / 5, 'Dha': 5 / 3,
    'Ni_k': 9 / 5, 'Ni': 15 / 8, 'Sa2': 2, 'Ni_l': 15 / 16
  };
  var SA_HZ = 329.63; /* E — the E bansuri's Sa */

  var RAGAS = {
    bhairav: {
      name: 'Bhairav', seg: 1, hour: 6.5,
      time: 'First prahar of the day · roughly 6–9 am',
      mood: 'Solemn and devotional — the raga of first light, all weight and stillness.',
      thaat: 'Bhairav', vadi: 'Dha (komal) / Re (komal)',
      dur: '25–40 min, as a full alap–jor–jhala',
      pairs: 'A solo opening, or under a vocalist at a morning mehfil; tabla in vilambit ektal.',
      pakad: 'Ga Ma Dha(komal) Pa, Ga Ma Re(komal) Sa. The flattened Re and Dha lean toward each other, and the slow oscillation — andolan — on Dha is the raga\u2019s fingerprint.',
      cap: 'Marker at \u2248 6:30 am — Bhairav\u2019s hour, as the light comes up.',
      aroha: [['Sa', 'Sa', ''], ['Re_k', 'Re', 'komal'], ['Ga', 'Ga', ''], ['Ma', 'Ma', ''], ['Pa', 'Pa', ''], ['Dha_k', 'Dha', 'komal'], ['Ni', 'Ni', ''], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni', 'Ni', ''], ['Dha_k', 'Dha', 'komal'], ['Pa', 'Pa', ''], ['Ma', 'Ma', ''], ['Ga', 'Ga', ''], ['Re_k', 'Re', 'komal'], ['Sa', 'Sa', '']]
    },
    bhairavi: {
      name: 'Bhairavi', seg: 2, hour: 10,
      time: 'Morning · by custom the concluding raga of a concert, at any hour',
      mood: 'Devotional pathos — tender and valedictory; the raga audiences ask for at the end.',
      thaat: 'Bhairavi', vadi: 'Ma / Sa',
      dur: '10–20 min as a closer; the thumri and dhun raga',
      pairs: 'The natural close after any main raga; bhajans, thumris and film cues that must say farewell.',
      pakad: 'Ma Ga(komal) Sa Re(komal) Sa; Sa\u0307 Ni(komal) Dha(komal) Pa. Every flattened note is available, and the descent through Ni(komal) and Dha(komal) carries the goodbye.',
      cap: 'Marker at \u2248 10 am — Bhairavi\u2019s morning; by custom it may close a concert at any hour.',
      aroha: [['Sa', 'Sa', ''], ['Re_k', 'Re', 'komal'], ['Ga_k', 'Ga', 'komal'], ['Ma', 'Ma', ''], ['Pa', 'Pa', ''], ['Dha_k', 'Dha', 'komal'], ['Ni_k', 'Ni', 'komal'], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni_k', 'Ni', 'komal'], ['Dha_k', 'Dha', 'komal'], ['Pa', 'Pa', ''], ['Ma', 'Ma', ''], ['Ga_k', 'Ga', 'komal'], ['Re_k', 'Re', 'komal'], ['Sa', 'Sa', '']]
    },
    bhimpalasi: {
      name: 'Bhimpalasi', seg: 3, hour: 13.5,
      time: 'Third prahar of the day · roughly 1–4 pm',
      mood: 'Tender longing in warm light — an afternoon raga of waiting.',
      thaat: 'Kafi', vadi: 'Ma / Sa',
      dur: '20–30 min',
      pairs: 'Afternoon concerts and recordings; a favourite beneath a vocalist in madhya laya.',
      pakad: '\u1e46i Sa Ma, Ga(komal) Ma Pa Ga(komal) Ma Ga(komal) Re Sa. The climb takes only Ni(komal) upward; the descent softens through Dha and Pa.',
      cap: 'Marker at \u2248 1:30 pm — Bhimpalasi\u2019s early afternoon.',
      aroha: [['Ni_l', '\u1e46i', 'low'], ['Sa', 'Sa', ''], ['Ga_k', 'Ga', 'komal'], ['Ma', 'Ma', ''], ['Pa', 'Pa', ''], ['Ni_k', 'Ni', 'komal'], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni_k', 'Ni', 'komal'], ['Dha', 'Dha', ''], ['Pa', 'Pa', ''], ['Ma', 'Ma', ''], ['Ga_k', 'Ga', 'komal'], ['Re', 'Re', ''], ['Sa', 'Sa', '']]
    },
    yaman: {
      name: 'Yaman', seg: 5, hour: 18.75,
      time: 'First prahar of the night · roughly 6–9 pm, just after dusk',
      mood: 'Serene and luminous — the evening\u2019s doorway; romantic without heaviness.',
      thaat: 'Kalyan', vadi: 'Ga / Ni',
      dur: '30–45 min as a main evening raga',
      pairs: 'The classic first item of an evening concert; a jugalbandi favourite.',
      pakad: '\u1e46i Re Ga, Ma(tivra) Pa Dha Ni Sa\u0307. The phrase climbs from below Sa and rests on the sharpened Ma — the one bright note that makes the raga glow.',
      cap: 'Marker at \u2248 6:45 pm — Yaman begins as dusk settles; the marker sits just past sunset.',
      aroha: [['Ni_l', '\u1e46i', 'low'], ['Re', 'Re', ''], ['Ga', 'Ga', ''], ['Ma_t', 'Ma', 'tivra'], ['Dha', 'Dha', ''], ['Ni', 'Ni', ''], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni', 'Ni', ''], ['Dha', 'Dha', ''], ['Pa', 'Pa', ''], ['Ma_t', 'Ma', 'tivra'], ['Ga', 'Ga', ''], ['Re', 'Re', ''], ['Sa', 'Sa', '']]
    },
    desh: {
      name: 'Desh', seg: 6, hour: 21.5,
      time: 'Second prahar of the night · roughly 9 pm–midnight · the monsoon raga',
      mood: 'Joyful and rain-wet — romance with a smile; folk airs run through it.',
      thaat: 'Khamaj', vadi: 'Pa / Re',
      dur: '15–25 min',
      pairs: 'Evening concerts in the rains; film briefs that ask for \u201cmonsoon\u201d reach for Desh.',
      pakad: 'Re Ma Pa, Ni(komal) Dha Pa Dha Ma Ga Re. The two Nis are the whole story: bright shuddha Ni going up, softened komal Ni coming down.',
      cap: 'Marker at \u2248 9:30 pm — Desh, mid-evening, in the rains.',
      aroha: [['Sa', 'Sa', ''], ['Re', 'Re', ''], ['Ma', 'Ma', ''], ['Pa', 'Pa', ''], ['Ni', 'Ni', ''], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni_k', 'Ni', 'komal'], ['Dha', 'Dha', ''], ['Pa', 'Pa', ''], ['Ma', 'Ma', ''], ['Ga', 'Ga', ''], ['Re', 'Re', ''], ['Sa', 'Sa', '']]
    },
    malkauns: {
      name: 'Malkauns', seg: 7, hour: 24.5,
      time: 'Third prahar of the night · roughly midnight–3 am',
      mood: 'Deep, slow, inward — five notes, and a long silence between them.',
      thaat: 'Bhairavi', vadi: 'Ma / Sa',
      dur: '30–45 min, vilambit',
      pairs: 'Late-night mehfils; the raga a soloist saves for a listening room, not a festival main stage.',
      pakad: 'Ga(komal) Ma Dha(komal) Ni(komal) Dha(komal), Ma Ga(komal) Sa. No Re, no Pa — the raga turns on the Ga(komal)\u2013Ma axis and refuses to hurry.',
      cap: 'Marker at \u2248 12:30 am — Malkauns, in the middle of the night arc.',
      aroha: [['Sa', 'Sa', ''], ['Ga_k', 'Ga', 'komal'], ['Ma', 'Ma', ''], ['Dha_k', 'Dha', 'komal'], ['Ni_k', 'Ni', 'komal'], ['Sa2', 'Sa', 'upper']],
      avaroha: [['Sa2', 'Sa', 'upper'], ['Ni_k', 'Ni', 'komal'], ['Dha_k', 'Dha', 'komal'], ['Ma', 'Ma', ''], ['Ga_k', 'Ga', 'komal'], ['Sa', 'Sa', '']]
    }
  };

  var tabs = document.querySelectorAll('.raga-tab');
  var nameEl = document.getElementById('rgName');
  if (tabs.length && nameEl) {
    var timeEl = document.getElementById('rgTime'),
      moodEl = document.getElementById('rgMood'),
      thaatEl = document.getElementById('rgThaat'),
      vadiEl = document.getElementById('rgVadi'),
      durEl = document.getElementById('rgDur'),
      pairsEl = document.getElementById('rgPairs'),
      pakadEl = document.getElementById('rgPakad'),
      arohaRow = document.getElementById('arohaRow'),
      avarohaRow = document.getElementById('avarohaRow'),
      needle = document.getElementById('ck-needle'),
      sun = document.getElementById('ck-sun'),
      clockCap = document.getElementById('clockCap'),
      playBtn = document.getElementById('playBtn'),
      playLabel = document.getElementById('playLabel'),
      statusEl = document.getElementById('demoStatus');
    var cur = RAGAS.bhairav, curId = 'bhairav';

    function chip(note) {
      var s = document.createElement('span');
      s.className = 'nt';
      var b = document.createElement('b');
      b.textContent = note[1];
      s.appendChild(b);
      if (note[2]) {
        var i = document.createElement('i');
        i.textContent = note[2];
        s.appendChild(i);
      }
      s.dataset.key = note[0];
      return s;
    }
    function buildScale() {
      arohaRow.querySelectorAll('.nt').forEach(function (n) { n.remove(); });
      avarohaRow.querySelectorAll('.nt').forEach(function (n) { n.remove(); });
      cur.aroha.forEach(function (n) { arohaRow.appendChild(chip(n)); });
      cur.avaroha.forEach(function (n) { avarohaRow.appendChild(chip(n)); });
    }
    function clockPos(hour) {
      if (hour >= 6 && hour <= 18) {
        var f = (hour - 6) / 12, a = Math.PI * (1 - f);
        return [95 + 80 * Math.cos(a), 95 - 80 * Math.sin(a)];
      }
      var h2 = hour < 6 ? hour + 24 : hour;
      var f2 = (h2 - 18) / 12, a2 = Math.PI * f2;
      return [95 + 70 * Math.cos(a2), 95 + 70 * Math.sin(a2)];
    }
    function select(id) {
      if (playing) stopPlayback(true);
      cur = RAGAS[id]; curId = id;
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.raga === id ? 'true' : 'false'); });
      document.querySelectorAll('.dayband .seg').forEach(function (s) {
        s.classList.toggle('on', Number(s.dataset.seg) === cur.seg);
      });
      nameEl.textContent = cur.name;
      timeEl.textContent = cur.time;
      moodEl.textContent = cur.mood;
      thaatEl.textContent = cur.thaat;
      vadiEl.textContent = cur.vadi;
      durEl.textContent = cur.dur;
      pairsEl.textContent = cur.pairs;
      pakadEl.textContent = cur.pakad;
      clockCap.textContent = cur.cap;
      var p = clockPos(cur.hour);
      needle.setAttribute('x2', p[0].toFixed(1));
      needle.setAttribute('y2', p[1].toFixed(1));
      sun.setAttribute('cx', p[0].toFixed(1));
      sun.setAttribute('cy', p[1].toFixed(1));
      buildScale();
      var total = cur.aroha.length + cur.avaroha.length;
      statusEl.textContent = 'Arohana, then avarohana — ' + total + ' notes, about ' + Math.round(total * NOTE_DUR) + ' seconds.';
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t.dataset.raga); });
    });

    /* ----- Web Audio scale demonstration (user-started only) ----- */
    var NOTE_DUR = 0.62;
    var ctx = null, master = null, noiseBuf = null, droneGain = null, droneOsc = [];
    var playing = false, timers = [];

    function makeNoise() {
      var len = ctx.sampleRate * 1.2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    function voice(freq, t, dur) {
      var g = ctx.createGain();
      var flt = ctx.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.value = 1600; flt.Q.value = 0.4;
      flt.connect(g); g.connect(master);
      var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
      var g2 = ctx.createGain(); g2.gain.value = 0.16;
      o1.connect(flt); o2.connect(g2); g2.connect(flt);
      var lfo = ctx.createOscillator(); lfo.frequency.value = 5.1;
      var lg = ctx.createGain(); lg.gain.value = 0;
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(freq * 0.006, t + dur * 0.55);
      var ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
      var nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 1.1;
      var ng = ctx.createGain(); ng.gain.value = 0.045;
      ns.connect(nf); nf.connect(ng); ng.connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.85, t + 0.09);
      g.gain.setValueAtTime(0.85, t + Math.max(0.1, dur - 0.16));
      g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
      var stop = t + dur + 0.12;
      o1.start(t); o2.start(t); lfo.start(t); ns.start(t);
      o1.stop(stop); o2.stop(stop); lfo.stop(stop); ns.stop(stop);
    }
    function startDrone(t) {
      droneGain = ctx.createGain(); droneGain.gain.value = 0;
      droneGain.connect(master);
      droneGain.gain.setValueAtTime(0, t);
      droneGain.gain.linearRampToValueAtTime(0.05, t + 0.4);
      [SA_HZ, SA_HZ * 1.5].forEach(function (f) {
        var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        o.connect(droneGain); o.start(t); droneOsc.push(o);
      });
    }
    function stopDrone() {
      if (!droneGain) return;
      var t = ctx.currentTime;
      droneGain.gain.cancelScheduledValues(t);
      droneGain.gain.setTargetAtTime(0, t, 0.08);
      droneOsc.forEach(function (o) { try { o.stop(t + 0.3); } catch (e) {} });
      droneOsc = []; droneGain = null;
    }
    function clearNow() {
      document.querySelectorAll('.nt.now').forEach(function (n) { n.classList.remove('now'); });
    }
    function sequence() {
      var chips = [];
      arohaRow.querySelectorAll('.nt').forEach(function (c) { chips.push(c); });
      avarohaRow.querySelectorAll('.nt').forEach(function (c) { chips.push(c); });
      var notes = cur.aroha.concat(cur.avaroha);
      return notes.map(function (n, i) {
        return { freq: SA_HZ * RATIO[n[0]], label: n[1], chip: chips[i] };
      });
    }
    function stopPlayback(user) {
      timers.forEach(function (id) { clearTimeout(id); });
      timers = [];
      if (ctx && master) {
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setTargetAtTime(0, t, 0.05);
      }
      stopDrone();
      clearNow();
      playing = false;
      playBtn.setAttribute('aria-pressed', 'false');
      playLabel.textContent = 'Hear the scale';
      if (user) statusEl.textContent = 'Stopped. The scale of ' + cur.name + ' is still charted above.';
    }
    function play() {
      if (playing) { stopPlayback(true); return; }
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { statusEl.textContent = 'This browser has no Web Audio — the chart above still gives the scale in full.'; return; }
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.22;
        var comp = ctx.createDynamicsCompressor();
        master.connect(comp); comp.connect(ctx.destination);
        noiseBuf = makeNoise();
      }
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.22, ctx.currentTime);
      playing = true;
      playBtn.setAttribute('aria-pressed', 'true');
      playLabel.textContent = 'Stop';
      var seq = sequence();
      var t0 = ctx.currentTime + 0.08;
      startDrone(t0);
      seq.forEach(function (s, i) { voice(s.freq, t0 + i * NOTE_DUR, NOTE_DUR); });
      seq.forEach(function (s, i) {
        timers.push(setTimeout(function () {
          clearNow();
          if (s.chip) s.chip.classList.add('now');
          statusEl.textContent = 'Now sounding: ' + s.label + ' — note ' + (i + 1) + ' of ' + seq.length + ' · ' + cur.name;
        }, 80 + i * NOTE_DUR * 1000));
      });
      timers.push(setTimeout(function () {
        stopPlayback(false);
        statusEl.textContent = 'Finished — ' + cur.name + ', arohana and avarohana. Hear it again, or choose another raga.';
      }, 80 + seq.length * NOTE_DUR * 1000 + 200));
    }
    playBtn.addEventListener('click', play);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) stopPlayback(true);
    });
    window.BansuriDemo = {
      state: function () { return !ctx ? 'none' : (playing ? 'playing' : ctx.state); },
      raga: function () { return curId; },
      stop: function () { stopPlayback(true); }
    };
    select('bhairav');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var againBtn = document.getElementById('againBtn');
    function fieldOk(name) {
      var f = form.querySelector('[data-field="' + name + '"]');
      var input = f.querySelector('input,select,textarea');
      var v = (input.value || '').trim();
      var ok = v.length > 0;
      if (name === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      f.classList.toggle('bad', !ok);
      return ok;
    }
    ['name', 'email', 'type', 'message'].forEach(function (n) {
      var f = form.querySelector('[data-field="' + n + '"]');
      var input = f.querySelector('input,select,textarea');
      input.addEventListener('blur', function () { if (f.classList.contains('bad')) fieldOk(n); });
      input.addEventListener('input', function () { f.classList.remove('bad'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var names = ['name', 'email', 'type', 'message'];
      var firstBad = null;
      names.forEach(function (n) {
        if (!fieldOk(n) && !firstBad) firstBad = form.querySelector('[data-field="' + n + '"] input,[data-field="' + n + '"] select,[data-field="' + n + '"] textarea');
      });
      if (firstBad) { firstBad.focus(); return; }
      confirmRef.textContent = 'NV-2026-' + Math.floor(100 + Math.random() * 900);
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.focus();
    });
    if (againBtn) againBtn.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      confirmBox.classList.remove('show');
      form.querySelector('input').focus();
    });
  }
})();
