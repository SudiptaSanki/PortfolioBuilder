/* ═════════════════════════════════════════════════════════════
   APP — loader, HUD clock, spatial menu, cases, modal, terminal,
   ambient synth, GSAP ScrollTrigger, custom cursor
   ═════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ═══ CASE DATA (all images stored locally in assets/photos) ═══ */
  var CASES = [
    {
      id: 'nebula', name: 'NEBULA ENGINE', cat: 'REALTIME GRAPHICS', idx: '001',
      client: 'ORBITAL LABS', year: '2026', role: 'CONCEPT → LAUNCH', stack: 'WEBGL2 / GLSL / WASM',
      tags: ['PARTICLES', 'GPGPU', 'REALTIME'],
      desc: 'A GPU particle engine that renders two million stars at 60fps in the browser. Built as a marketing set piece for a space-data platform, it lets visitors stir a galaxy with their cursor and watch density waves fold back in.',
      metrics: [['2.1M', 'PARTICLES'], ['60', 'FPS LOCKED'], ['4.2M', 'SESSION VISITS']],
      note: 'Nominated — Awwwards Site of the Day · FWA of the Day · Webby honouree.',
      img: './assets/photos/img_a05d1e002413.webp',
      img2: './assets/photos/img_c8787321eee0.webp'
    },
    {
      id: 'chrono', name: 'CHRONO ARCHIVE', cat: 'SPATIAL ARCHIVE', idx: '002',
      client: 'MUNICIPAL RECORDS ASSN.', year: '2025', role: 'DESIGN + BUILD', stack: 'THREE.JS / WASM / SQLITE-WASM',
      tags: ['ARCHIVE', 'CAMERA PATHS', 'WEB ASSEMBLY'],
      desc: 'Ninety years of city records, re-organised as a walkable brutalist complex. Each gallery is a decade; the camera flies between them along rails of light. Search results physically rebuild the building around you.',
      metrics: [['90', 'YEARS INDEXED'], ['1.8M', 'RECORDS'], ['11:40', 'AVG. SESSION (SEC)']],
      note: 'A scroll is a dolly move: the archive is navigated like a building, not paged like a document.',
      img: './assets/photos/img_dfa815648363.webp',
      img2: './assets/photos/img_c3fd157d7c7a.webp'
    },
    {
      id: 'prism', name: 'PRISM OS', cat: 'SPECTRAL INTERFACE', idx: '003',
      client: 'HELIOGRAPH', year: '2025', role: 'R&D → PRODUCT', stack: 'WEBGL / WEBGPU / TS',
      tags: ['INTERFACE', 'WEBGPU', 'LIGHT MODEL'],
      desc: 'An operating metaphor made of light. Every document is a beam; filtering is refraction. A six-week R&D sprint with Heliograph turned into a shipped productivity concept used across their entire product line.',
      metrics: [['6', 'WEEKS TO PROTOTYPE'], ['3', 'PATENTS FILED'], ['100%', 'ADOPTION IN-HOUSE']],
      note: 'The desktop became a prism: apps are spectra, focus is a lens. Interfaces refract rather than stack.',
      img: './assets/photos/img_51ec097943c6.webp',
      img2: './assets/photos/img_0828f54b0b79.webp'
    },
    {
      id: 'solaris', name: 'SOLARIS AR', cat: 'LOCATION-BASED AR', idx: '004',
      client: 'DESERT BIENNALE', year: '2024', role: 'CREATION + FIELD BUILD', stack: 'WEBXR / SLAM / WEBSOCKETS',
      tags: ['AR', 'WEBSITE', 'FIELD'],
      desc: 'A desert-wide augmented reality layer for a biennale of land art. Visitors point their phones at the dunes and monumental sculptures bloom out of the horizon, stable to the centimetre across 4km of open sand.',
      metrics: [['4KM', 'AR FIELD'], ['38', 'INSTALLATIONS'], ['112K', 'VISITORS']],
      note: 'Ran on plain phone browsers — no app install. The desert kept the coordinates; the web kept the art.',
      img: './assets/photos/img_924657c74fba.webp',
      img2: './assets/photos/img_3fd75f982217.webp'
    },
    {
      id: 'synth', name: 'SYNTH LAB', cat: 'AUDIO-REACTIVE', idx: '005',
      client: 'MODULAR COLLECTIVE', year: '2024', role: 'DESIGN + ENGINEERING', stack: 'WEB AUDIO / WEBGL / MIDI',
      tags: ['AUDIO', 'MIDI', 'LIVE SHOWS'],
      desc: 'A browser instrument that turns any modular rig into a generative visual system. Patch a cable, spawn an emitter. Touring artists used it as full-stage visuals; the crowd fed it back through the house mics.',
      metrics: [['26', 'LIVE SHOWS'], ['<8MS', 'AUDIO LATENCY'], ['1.4K', 'PATCHES SHARED']],
      note: 'Every visual parameter is patchable. The room plays the graphics; the graphics play the room.',
      img: './assets/photos/img_bae5314c9e98.webp',
      img2: './assets/photos/img_f51db3f9e033.webp'
    },
    {
      id: 'eclipse', name: 'DARK PERIHELION', cat: 'LIVE EVENT', idx: '006',
      client: 'OBSERVATORY TRUST', year: '2023', role: 'REALTIME BROADCAST', stack: 'WEBGL / MSE / TIMEKEEPING',
      tags: ['LIVE', 'BROADCAST', 'DATA'],
      desc: 'A synchronized global broadcast for a total solar eclipse, with 640k viewers watching a realtime corona simulation keyed to the moon’s actual shadow path, second by second, as totality crossed the planet.',
      metrics: [['640K', 'CONCURRENT VIEWERS'], ['2:41', 'TOTALITY, SIMULATED'], ['0', 'DRIFT (MS)']],
      note: 'One shared sky: the simulation was clocked to the eclipse itself, not a recording of one.',
      img: './assets/photos/img_cfd17a034472.webp',
      img2: './assets/photos/img_568b3e62cc79.webp'
    }
  ];

  /* ═══ BUILD CASE CARDS ═══ */
  var casesEl = $('#cases');
  CASES.forEach(function (c, i) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'case' + (i % 3 === 0 ? ' big' : '');
    el.setAttribute('data-case', c.id);
    el.setAttribute('data-cursor', 'OPEN');
    el.innerHTML =
      '<span class="case-tag mono">CASE ' + c.idx + ' — ' + c.year + '</span>' +
      '<span class="case-media">' +
        '<img src="' + c.img + '" alt="' + c.name + ' case study" loading="eager" />' +
        '<span class="case-scan" aria-hidden="true"></span>' +
      '</span>' +
      '<span class="case-head">' +
        '<span class="case-idx mono">' + c.idx + '</span>' +
        '<span class="case-name">' + c.name + '</span>' +
        '<span class="case-cat mono">' + c.cat + '</span>' +
      '</span>' +
      '<span class="case-desc">' + c.desc + '</span>' +
      '<span class="case-cta">OPEN CASE STUDY <i>→</i></span>';
    el.addEventListener('click', function () { openCase(c.id); });
    casesEl.appendChild(el);
  });

  /* ═══ LOADER ═══ */
  var loader = $('#loader'), ldPct = $('#ldPct'), ldFill = $('#ldFill'), ldLog = $('#ldLog'), ldBars = $('#ldBars');
  var LOGS = [
    'ALLOCATING FIELD BUFFERS…',
    'LINKING PARTICLE SHADERS…',
    'CALIBRATING DEPTH OF FIELD…',
    'SPINNING UP AUDIO ENGINE…',
    'SYNCING SPATIAL INDEX…',
    'FIELD STABLE — WELCOME'
  ];
  var bars = 26;
  for (var b = 0; b < bars; b++) { var bi = document.createElement('i'); ldBars.appendChild(bi); }
  var barEls = $$('#ldBars i');

  var pct = 0, logI = 0;
  var tick = setInterval(function () {
    pct += 3 + Math.random() * 9;
    if (pct >= 100) { pct = 100; clearInterval(tick); setTimeout(done, 380); }
    ldPct.textContent = String(Math.floor(pct)).padStart(3, '0');
    ldFill.style.width = pct + '%';
    var on = Math.floor((pct / 100) * bars);
    barEls.forEach(function (el, k) { el.classList.toggle('on', k < on); el.style.transform = 'scaleY(' + (0.3 + (k / bars) * 0.7) + ')'; });
    var li = Math.floor((pct / 100) * (LOGS.length - 0.01));
    if (li > logI) { logI = li; ldLog.textContent = '> ' + LOGS[Math.min(logI, LOGS.length - 1)]; }
  }, 90);

  function done() {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    setTimeout(function () { loader.style.display = 'none'; }, 900);
  }

  /* ═══ HERO TYPE FIT — Syne is a wide face, so fit lines to the stage ═══ */
  function fitHero() {
    var stage = $('.hero-stage');
    var lines = $$('.hl-in');
    if (!stage || !lines.length) return;
    var avail = stage.clientWidth - 48;
    var best = Infinity;
    lines.forEach(function (l) {
      var probe = l.cloneNode(true);
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;transform:none;';
      l.parentNode.appendChild(probe);
      best = Math.min(best, probe.offsetWidth ? (avail / probe.offsetWidth) * 100 : Infinity);
      l.parentNode.removeChild(probe);
    });
    if (isFinite(best)) {
      var size = Math.max(38, Math.floor(best * 0.985));
      document.querySelector('.hero-type').style.fontSize = size + 'px';
    }
  }
  fitHero();
  window.addEventListener('resize', fitHero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

  /* ═══ HUD CLOCK + SECTION WATCHER ═══ */
  var hudClock = $('#hudClock');
  setInterval(function () {
    if (hudClock) hudClock.textContent = new Date().toISOString().slice(11, 19);
  }, 1000);

  var tbSection = $('#tbSection');
  var SECTIONS = [['hero', 'ORIGIN'], ['work', 'WORK'], ['studio', 'STUDIO'], ['signal', 'SIGNAL']];
  function watchSections() {
    var y = window.scrollY + window.innerHeight * 0.4, cur = 'ORIGIN';
    SECTIONS.forEach(function (s) {
      var el = document.getElementById(s[0]);
      if (el && el.offsetTop <= y) cur = s[1];
    });
    if (tbSection) tbSection.textContent = cur;
  }
  window.addEventListener('scroll', watchSections, { passive: true });

  /* ═══ CUSTOM CURSOR ═══ */
  var cursor = $('#cursor'), curLabel = $('#curLabel');
  var cx = -100, cy = -100, tx = -100, ty = -100;
  window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  window.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
  window.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
  (function curLoop() {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    requestAnimationFrame(curLoop);
  })();
  document.addEventListener('pointerover', function (e) {
    var t = e.target.closest && e.target.closest('[data-cursor]');
    if (t) { cursor.classList.add('is-active'); curLabel.textContent = t.getAttribute('data-cursor'); }
    else cursor.classList.remove('is-active');
  });

  /* ═══ MENU ═══ */
  var menu = $('#menu');
  $('#menuBtn').addEventListener('click', function () { menu.classList.add('is-open'); });
  $('#menuClose').addEventListener('click', function () { menu.classList.remove('is-open'); });
  $$('.menu-item').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      menu.classList.remove('is-open');
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      menu.classList.remove('is-open');
      closeCase();
    }
  });

  /* ═══ ENTER / SCROLL DIVE ═══ */
  $('#enterBtn').addEventListener('click', function () {
    if (window.FIELD) window.FIELD.pulse(1);
    var work = document.getElementById('work');
    window.scrollTo({ top: work.offsetTop - 30, behavior: 'smooth' });
  });

  /* ═══ CASE MODAL ═══ */
  var modal = $('#caseModal');
  function openCase(id) {
    var c = CASES.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    $('#cmIndex').textContent = c.idx + ' / CASE STUDY';
    $('#cmTitle').textContent = c.name;
    $('#cmDesc').textContent = c.desc;
    $('#cmClient').textContent = c.client;
    $('#cmYear').textContent = c.year;
    $('#cmRole').textContent = c.role;
    $('#cmStack').textContent = c.stack;
    $('#cmNote').textContent = '↳ ' + c.note;
    var img = $('#cmImg'); img.src = c.img; img.alt = c.name;
    $('#cmImg2').src = c.img2;
    $('#cmTags').innerHTML = c.tags.map(function (t) { return '<i>' + t + '</i>'; }).join('');
    $('#cmMetrics').innerHTML = c.metrics.map(function (m) {
      return '<div><b>' + m[0] + '</b><span class="mono">' + m[1] + '</span></div>';
    }).join('');
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    if (window.FIELD) window.FIELD.pulse(0.6);
  }
  function closeCase() {
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }
  $('#cmClose').addEventListener('click', closeCase);
  $('.cm-scrim').addEventListener('click', closeCase);

  /* ═══ TERMINAL ═══ */
  var termBody = $('#termBody'), termForm = $('#termForm'), termInput = $('#termInput'), termState = $('#termState');
  var commands = {
    help: function () {
      return 'AVAILABLE COMMANDS:\n' +
        '  projects        list the six systems\n' +
        '  open <name>     open a case study (e.g. open nebula)\n' +
        '  studio          who we are\n' +
        '  contact         reach a human\n' +
        '  audio on|off    toggle the ambient synth\n' +
        '  dive            descend into the field\n' +
        '  clear           wipe this channel';
    },
    projects: function () {
      return CASES.map(function (c) { return '  ' + c.idx + '  ' + c.name.toLowerCase().replace(/ /g, '-') + '  —  ' + c.cat.toLowerCase(); }).join('\n');
    },
    studio: function () {
      return 'NEON CIRCUIT — a spatial design study.\n14 years · 220 systems · 12 people · Los Angeles / Amsterdam.\nWe build places, not pages.';
    },
    contact: function () {
      return 'MAIL    hello@v6.studio\nPHONE   +1 (310) 555-0162\nSOCIAL  instagram / x / vimeo / linkedin (below)';
    },
    open: function (arg) {
      var c = CASES.filter(function (x) { return x.id === (arg || '').toLowerCase().split('-')[0]; })[0];
      if (!c) return 'no system named "' + (arg || '') + '". try: ' + CASES.map(function (x) { return x.id; }).join(', ');
      setTimeout(function () { openCase(c.id); }, 350);
      return 'opening ' + c.name.toLowerCase() + '…';
    },
    clear: function () { termBody.innerHTML = ''; return null; },
    dive: function () {
      setTimeout(function () {
        if (window.FIELD) window.FIELD.pulse(1);
        var work = document.getElementById('work');
        window.scrollTo({ top: work.offsetTop - 30, behavior: 'smooth' });
      }, 300);
      return 'descending…';
    }
  };
  var audioOn = false;
  commands.audio = function (arg) {
    if (arg === 'on') { setAudio(true); return 'ambient synth engaged — 60 BPM drone online.'; }
    if (arg === 'off') { setAudio(false); return 'ambient synth muted.'; }
    return 'usage: audio on|off';
  };

  function tline(text, cls) {
    var d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    termBody.appendChild(d);
    termBody.scrollTop = termBody.scrollHeight;
    return d;
  }
  tline('NEON CIRCUIT — SIGNAL CHANNEL v6.0', 't-ok');
  tline('secure link established. type "help" for commands.', 't-out');

  termForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = termInput.value.trim();
    if (!raw) return;
    termInput.value = '';
    tline(raw, 't-in');
    var parts = raw.split(/\s+/);
    var cmd = (parts[0] || '').toLowerCase();
    var arg = parts.slice(1).join(' ');
    if (commands[cmd]) {
      var out = commands[cmd](arg);
      if (out) tline(out, 't-out');
    } else {
      tline('unknown command: ' + cmd + ' — try "help"', 't-err');
    }
  });

  /* ═══ AMBIENT SYNTH (Web Audio) ═══ */
  var actx = null, master = null, droneNodes = [], analyser = null, freqData = null;
  function buildSynth() {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0;
    analyser = actx.createAnalyser(); analyser.fftSize = 64;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser); analyser.connect(actx.destination);

    // A minor-ish drone: three detuned oscillators + slow LFO filter
    var filt = actx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 420; filt.Q.value = 3.5;
    filt.connect(master);
    var lfo = actx.createOscillator(), lfoGain = actx.createGain();
    lfo.frequency.value = 0.08; lfoGain.gain.value = 160;
    lfo.connect(lfoGain); lfoGain.connect(filt.frequency); lfo.start();

    [55, 110, 164.81, 220].forEach(function (f, i) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = i === 3 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 6 : -6);
      g.gain.value = 0.12 / (i + 1);
      o.connect(g); g.connect(filt); o.start();
      droneNodes.push(o);
    });

    // airy shimmer
    var shOsc = actx.createOscillator(), shGain = actx.createGain(), shLfo = actx.createOscillator(), shLfoG = actx.createGain();
    shOsc.type = 'sine'; shOsc.frequency.value = 1318.5;
    shLfo.frequency.value = 0.21; shLfoG.gain.value = 0.012;
    shLfo.connect(shLfoG); shLfoG.connect(shGain.gain);
    shGain.gain.value = 0.014;
    shOsc.connect(shGain); shGain.connect(master);
    shOsc.start(); shLfo.start();
  }

  var soundBtn = $('#soundBtn'), soundState = $('#soundState');
  function setAudio(on) {
    if (on && !actx) buildSynth();
    if (on && actx.state === 'suspended') actx.resume();
    if (actx) master.gain.setTargetAtTime(on ? 0.24 : 0, actx.currentTime, 0.4);
    audioOn = on;
    soundBtn.classList.toggle('on', on);
    soundState.textContent = on ? 'ON' : 'OFF';
    termState.textContent = on ? 'SYNTH LIVE' : 'CONNECTED';
  }
  soundBtn.addEventListener('click', function () { setAudio(!audioOn); });

  // feed audio level into the particle field
  setInterval(function () {
    if (window.FIELD && analyser && audioOn) {
      analyser.getByteFrequencyData(freqData);
      var sum = 0;
      for (var k = 0; k < freqData.length; k++) sum += freqData[k];
      window.FIELD.setAudio((sum / freqData.length) / 255);
    } else if (window.FIELD) {
      window.FIELD.setAudio(0);
    }
  }, 90);

  /* ═══ GSAP SCROLLTRIGGER ═══ */
  function initGSAP() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // reveal-on-scroll
    $$('.sec-title, .sec-copy, .studio-title, .studio-copy, .stat, .case').forEach(function (el) {
      el.classList.add('rv');
      ScrollTrigger.create({
        trigger: el, start: 'top 86%',
        onEnter: function () { el.classList.add('is-in'); },
        onEnterBack: function () { el.classList.add('is-in'); }
      });
    });

    // parallax on case media
    $$('.case-media img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.closest('.case'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // marquee drift speed reacts to scroll velocity
    var track = $('.marquee-track');
    if (track) {
      gsap.to(track, {
        xPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }

    // drive field depth from document scroll
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'max',
      onUpdate: function (self) { if (window.FIELD) window.FIELD.setDepth(self.progress); }
    });
  }

  if (window.gsap && window.ScrollTrigger) initGSAP();
  else window.addEventListener('load', initGSAP);

  /* smooth section watch init */
  watchSections();
})();
