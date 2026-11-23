/* Samir Barakat — oud and dusk
   The only sound on this site is the course pad, and it stays silent until a
   visitor touches it. No AudioContext is created at load. */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- nav -- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth <= 720) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  /* ---------------------------------------------------------------- year -- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --------------------------------------------------------- contact form -- */
  var form = document.getElementById('booking-form');
  if (form) {
    var status = document.getElementById('form-status');
    var fields = [
      { id: 'name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give the name I should use.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That address looks incomplete.' },
      { id: 'kind', test: function (v) { return v !== ''; }, msg: 'Choose the kind of date.' },
      { id: 'date', test: function (v) { return v !== ''; }, msg: 'A date helps me answer properly.' },
      { id: 'message', test: function (v) { return v.trim().length >= 12; }, msg: 'A sentence about the room and the occasion is enough.' }
    ];

    function showError(field, msg) {
      var el = document.getElementById('err-' + field);
      if (el) el.textContent = msg;
      var input = document.getElementById(field);
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    fields.forEach(function (f) {
      var input = document.getElementById(f.id);
      if (!input) return;
      input.addEventListener('input', function () { showError(f.id, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        if (!input) return;
        var ok = f.test(input.value);
        showError(f.id, ok ? '' : f.msg);
        if (!ok && !firstBad) firstBad = input;
      });
      if (firstBad) {
        if (status) {
          status.textContent = 'Two or three fields still need an answer.';
          status.style.color = '#d68e7c';
        }
        firstBad.focus();
        return;
      }
      var kind = document.getElementById('kind');
      var venue = document.getElementById('venue');
      var message = document.getElementById('message');
      var subject = 'Booking enquiry — ' + (kind ? kind.value : 'oud date');
      var body =
        'Name: ' + document.getElementById('name').value +
        '\nEmail: ' + document.getElementById('email').value +
        '\nKind of date: ' + (kind ? kind.value : '') +
        '\nDate: ' + document.getElementById('date').value +
        '\nVenue and city: ' + (venue ? venue.value : '') +
        '\n\n' + (message ? message.value : '');
      var link = document.getElementById('mail-link');
      if (link) {
        link.href = 'mailto:samir@barakatoud.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        link.hidden = false;
      }
      if (status) {
        status.style.color = '';
        status.textContent = 'Checked. Open the message in your mail app to send it; the details are already written. I answer within two working days.';
      }
    });
  }

  /* ----------------------------------------------------------- course pad -- */
  var fretboard = document.querySelector('.fretboard');
  if (!fretboard) return;

  var COURSES = [
    { name: 'C4', midi: 60 },
    { name: 'G3', midi: 55 },
    { name: 'D3', midi: 50 },
    { name: 'A2', midi: 45 },
    { name: 'F2', midi: 41 },
    { name: 'C2', midi: 36 }
  ];
  var FRETS = [0, 1, 2, 3, 3.5, 4, 5, 6];

  var MAQAMS = {
    rast: {
      name: 'Rast',
      steps: [0, 2, 3.5, 5, 7, 9, 10.5, 12, 14, 15.5, 17, 19, 21, 22.5, 24],
      note: 'Whole steps with a half-flat third and seventh. The shape most Cairo listeners hear as home, and the one that opens most taqsim.'
    },
    bayati: {
      name: 'Bayati',
      steps: [0, 1.5, 3, 5, 7, 8, 10, 12, 13.5, 15, 17, 19, 20, 22, 24],
      note: 'A half-flat second under a Nahawand upper half. The usual opening for a taqsim, and it sits well on the open D course.'
    },
    hijaz: {
      name: 'Hijaz',
      steps: [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19, 20, 22, 24],
      note: 'A raised third over a half-flat second, the augmented second of the old city modes. Slow it reads as lament; at speed it is celebration.'
    },
    nahawand: {
      name: 'Nahawand',
      steps: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24],
      note: 'The natural minor of the repertoire, with a half-flat sixth on the way down. The easiest door in for a Western ear, and a good first maqam to teach.'
    },
    saba: {
      name: 'Saba',
      steps: [0, 1.5, 3, 4, 7, 8, 10, 12, 13.5, 15, 16, 19, 20, 22, 24],
      note: 'A diminished fourth under a half-flat second and a raised sixth. The most plaintive of the five, and the hardest to leave once entered.'
    }
  };

  var NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

  function pitchName(midi) {
    var frac = Math.round((midi - Math.floor(midi)) * 100) / 100;
    if (Math.abs(frac - 0.5) < 0.01) {
      var nat = Math.ceil(midi);
      var idx = ((nat % 12) + 12) % 12;
      return { text: NOTE_NAMES[idx], quarter: '½♭', aria: NOTE_NAMES[idx] + ' half-flat' };
    }
    var n = Math.round(midi);
    var i = ((n % 12) + 12) % 12;
    return { text: NOTE_NAMES[i], quarter: '', aria: NOTE_NAMES[i] };
  }

  var state = { maqam: 'rast', tonic: 48 };
  var buttons = [];

  // Build six courses of eight positions, high string first like tablature.
  COURSES.forEach(function (course, ci) {
    var row = fretboard.querySelector('.course[data-course="' + ci + '"]');
    if (!row) return;
    FRETS.forEach(function (fret) {
      var midi = course.midi + fret;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fret';
      b.dataset.midi = String(midi);
      b.dataset.course = course.name;
      b.dataset.fret = String(fret);
      b.setAttribute('aria-label', course.name + ' course, fret ' + String(fret).replace('.5', ' and a half'));
      row.appendChild(b);
      buttons.push(b);
    });
  });

  function isInScale(midi) {
    var rel = ((midi - state.tonic) % 12 + 12) % 12;
    var steps = MAQAMS[state.maqam].steps;
    for (var i = 0; i < steps.length; i++) {
      if (Math.abs(rel - (steps[i] % 12)) < 0.01) return true;
    }
    return false;
  }

  function paint() {
    var m = MAQAMS[state.maqam];
    buttons.forEach(function (b) {
      var midi = parseFloat(b.dataset.midi);
      var p = pitchName(midi);
      b.classList.toggle('in-scale', isInScale(midi));
      b.classList.toggle('root', Math.abs(midi - state.tonic) < 0.01);
      b.innerHTML = p.text + (p.quarter ? '<sup>' + p.quarter + '</sup>' : '');
      b.setAttribute('aria-label',
        p.aria + ', ' + b.dataset.course + ' course, fret ' + b.dataset.fret.replace('.5', ' and a half') +
        (isInScale(midi) ? ', in ' + m.name : ', outside ' + m.name));
    });
    var inScale = buttons.filter(function (b) { return b.classList.contains('in-scale'); }).length;
    readoutMaqam.textContent = m.name + ' on ' + pitchName(state.tonic).aria + ' · ' + inScale + ' positions in range';
    readoutDesc.textContent = m.note;
    readoutNote.textContent = 'Tap a position on the fingerboard.';
  }

  var readoutMaqam = document.getElementById('readout-maqam');
  var readoutNote = document.getElementById('readout-note');
  var readoutDesc = document.getElementById('readout-desc');
  var readoutState = document.getElementById('readout-state');

  if (readoutMaqam && readoutDesc && readoutNote) paint();

  /* ---- audio, created only inside a gesture ---- */
  var ctx = null;
  var master = null;

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      readoutState.textContent = 'This browser has no Web Audio';
      return null;
    }
    ctx = new AC();
    window.__audioCreated = true;
    master = ctx.createGain();
    master.gain.value = 0.42;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.24;
    master.connect(comp);
    comp.connect(ctx.destination);
    readoutState.textContent = 'Sound on · synthesised in this page';
    return ctx;
  }

  function pluck(midi, when, velocity) {
    var c = audio();
    if (!c) return;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var t = Math.max(c.currentTime + 0.005, when || 0);
    var vel = velocity || 0.5;
    var env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);

    var lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.1;
    lp.frequency.setValueAtTime(Math.min(11000, f * 16), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(420, f * 3.2), t + 1.4);

    var o1 = c.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = f;
    var o2 = c.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2.004;
    var g2 = c.createGain();
    g2.gain.value = 0.3;
    var o3 = c.createOscillator();
    o3.type = 'sine';
    o3.frequency.value = f * 0.5;
    var g3 = c.createGain();
    g3.gain.value = 0.16;

    o1.connect(lp);
    o2.connect(g2); g2.connect(lp);
    o3.connect(g3); g3.connect(env);
    lp.connect(env); env.connect(master);

    // short noise at the string attack, the pick against the course
    var len = Math.floor(c.sampleRate * 0.035);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var noise = c.createBufferSource();
    noise.buffer = buf;
    var bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(4200, f * 6);
    bp.Q.value = 0.9;
    var ng = c.createGain();
    ng.gain.value = 0.09;
    noise.connect(bp); bp.connect(ng); ng.connect(master);

    o1.start(t); o2.start(t); o3.start(t); noise.start(t);
    o1.stop(t + 2.2); o2.stop(t + 2.2); o3.stop(t + 2.2);
  }

  function flash(b, ms) {
    b.classList.add('struck');
    window.setTimeout(function () { b.classList.remove('struck'); }, ms || 280);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var midi = parseFloat(b.dataset.midi);
      pluck(midi, 0, 0.52);
      var p = pitchName(midi);
      var rel = ((midi - state.tonic) % 12 + 12) % 12;
      var steps = MAQAMS[state.maqam].steps;
      var degree = '';
      for (var i = 0; i < steps.length; i++) {
        if (Math.abs(rel - (steps[i] % 12)) < 0.01) { degree = 'degree ' + (i + 1) + ' of ' + MAQAMS[state.maqam].name; break; }
      }
      readoutNote.textContent = p.aria + ' · ' + b.dataset.course + ' course, fret ' + b.dataset.fret.replace('.5', '½');
      readoutState.textContent = degree ? degree + ' · ' + Math.round(440 * Math.pow(2, (midi - 69) / 12)) + ' Hz' : 'Outside ' + MAQAMS[state.maqam].name + ' · ' + Math.round(440 * Math.pow(2, (midi - 69) / 12)) + ' Hz';
      flash(b, 300);
    });
  });

  var chips = document.querySelectorAll('[data-maqam]');
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      state.maqam = chip.dataset.maqam;
      Array.prototype.forEach.call(chips, function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      paint();
    });
  });

  var tonics = document.querySelectorAll('[data-tonic]');
  Array.prototype.forEach.call(tonics, function (chip) {
    chip.addEventListener('click', function () {
      state.tonic = parseInt(chip.dataset.tonic, 10);
      Array.prototype.forEach.call(tonics, function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      paint();
    });
  });

  var playBtn = document.getElementById('play-scale');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      var c = audio();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      var steps = MAQAMS[state.maqam].steps;
      var t0 = c.currentTime + 0.08;
      readoutNote.textContent = 'Playing ' + MAQAMS[state.maqam].name + ' from ' + pitchName(state.tonic).aria;
      steps.forEach(function (step, i) {
        var midi = state.tonic + step;
        pluck(midi, t0 + i * 0.25, 0.42);
        var match = buttons.filter(function (b) { return Math.abs(parseFloat(b.dataset.midi) - midi) < 0.01; })[0];
        if (match) window.setTimeout(function () { flash(match, 220); }, 60 + i * 250);
      });
    });
  }

  var stopBtn = document.getElementById('stop-tone');
  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      if (!ctx) return;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
        window.setTimeout(function () {
          if (master) master.gain.setTargetAtTime(0.42, ctx.currentTime, 0.06);
        }, 220);
      }
      readoutNote.textContent = 'Stopped.';
    });
  }
})();
