/* Clarinet Lights — site behaviour
   Nav, reveals, window snow, and the opt-in Freygish phrase bench.
   Web Audio is created only inside the play button's click handler: zero autoplay. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var jump = document.getElementById('scroll-to-bench');
  if (jump) {
    jump.addEventListener('click', function () {
      var bench = document.getElementById('bench');
      if (bench) bench.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ---------- window snow ---------- */
  (function snow() {
    var canvas = document.getElementById('snow');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var flakes = [];

    function seed() {
      flakes = [];
      for (var i = 0; i < 42; i += 1) {
        flakes.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.8 + Math.random() * 1.9,
          speed: 0.008 + Math.random() * 0.018,
          drift: (Math.random() - 0.5) * 0.01,
          phase: Math.random() * Math.PI * 2,
          a: 0.35 + Math.random() * 0.5
        });
      }
    }

    function resize() {
      var box = canvas.getBoundingClientRect();
      if (!box.width) return;
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawStatic() {
      if (!ctx || !w) return;
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(240, 232, 214, ' + f.a + ')';
        ctx.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f) {
        var y = (f.y + t * f.speed) % 1.04;
        var x = f.x + Math.sin(t * 0.4 + f.phase) * f.drift * 10;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(240, 232, 214, ' + f.a + ')';
        ctx.arc(((x % 1) + 1) % 1 * w, y * h, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      window.requestAnimationFrame(frame);
    }

    resize();
    seed();
    if (reduced) {
      drawStatic();
    } else {
      window.requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () {
      resize();
      if (reduced) drawStatic();
    });
  })();

  /* ---------- phrase bench ---------- */
  (function bench() {
    var staff = document.getElementById('phrase-staff');
    if (!staff) return;
    var modeSel = document.getElementById('mode');
    var tempo = document.getElementById('tempo');
    var ornament = document.getElementById('ornament');
    var playBtn = document.getElementById('play-phrase');
    var state = document.querySelector('[data-out="audio-state"]');
    var tempoOut = document.querySelector('[data-out="tempo"]');
    var bpmOut = document.querySelector('[data-out="bpm"]');

    var LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    var ACCIDENTAL = { '': 0, '#': 1, 'b': -1 };

    var MODES = {
      freygish: {
        name: 'Freygish · Ahava Rabbah',
        degree: '1 · ♭2 · 3 · 4 · 5 · ♭6 · ♭7',
        notes: ['D4', 'E♭4', 'F♯4', 'G4', 'A4', 'B♭4', 'A4', 'G4', 'F♯4', 'E♭4', 'D4', 'D4'],
        beats: [1, 0.5, 0.5, 1, 1, 1.5, 0.5, 1, 0.5, 0.5, 1, 2]
      },
      misheberakh: {
        name: 'Mi Sheberakh · Ukrainian Dorian',
        degree: '1 · 2 · ♭3 · ♯4 · 5 · 6 · ♭7',
        notes: ['D4', 'E4', 'F4', 'G♯4', 'A4', 'B4', 'A4', 'G♯4', 'F4', 'E4', 'D4'],
        beats: [1, 0.5, 0.5, 1, 1, 1.5, 0.5, 1, 0.5, 0.5, 3]
      },
      adonai: {
        name: 'Adonai Malakh',
        degree: '1 · 2 · ♭3 · 4 · 5 · ♭6 · ♭7',
        notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B♭4', 'A4', 'G4', 'F4', 'E4', 'D4'],
        beats: [1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 3]
      }
    };

    function parse(noteName) {
      var m = noteName.match(/^([A-G])([#♯b♭]?)(\d)$/);
      if (!m) return { step: 30, midi: 62, letter: 'D', acc: '' };
      var letter = m[1];
      var acc = m[2].replace('♯', '#').replace('♭', 'b');
      var octave = parseInt(m[3], 10);
      var semis = [0, 2, 4, 5, 7, 9, 11][LETTER_STEP[letter]] + (ACCIDENTAL[acc] || 0);
      var midi = (octave + 1) * 12 + semis;
      return { step: octave * 7 + LETTER_STEP[letter], midi: midi, letter: letter, acc: acc };
    }

    function freqOf(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function currentPhrase() {
      var mode = MODES[modeSel.value] || MODES.freygish;
      return mode;
    }

    /* geometry */
    var X0 = 92;
    var X1 = 742;
    var BOTTOM = 168;
    var SPACING = 15;

    function yOf(step) {
      return BOTTOM - (step - 30) * (SPACING / 2);
    }

    function renderStaff() {
      var mode = currentPhrase();
      var totalBeats = mode.beats.reduce(function (a, b) { return a + b; }, 0);
      var usable = X1 - X0;
      var xAt = function (beat) { return X0 + (beat / totalBeats) * usable; };

      var out = '';
      out += '<title id="staff-title">' + mode.name + ' phrase on the staff</title>';
      out += '<rect x="0" y="0" width="780" height="260" fill="transparent"/>';

      /* staff lines */
      for (var i = 0; i < 5; i += 1) {
        var y = BOTTOM - i * SPACING;
        out += '<line x1="70" y1="' + y + '" x2="752" y2="' + y + '" stroke="#c8bda9" stroke-opacity=".45" stroke-width="1"/>';
      }
      /* bar lines every 2 beats */
      var beatCount = 0;
      var measures = [];
      mode.beats.forEach(function (b) {
        beatCount += b;
        if (Math.abs(beatCount % 2) < 0.001) measures.push(beatCount);
      });
      measures.forEach(function (b) {
        var x = xAt(b);
        out += '<line x1="' + x.toFixed(1) + '" y1="' + (BOTTOM - 4 * SPACING) + '" x2="' + x.toFixed(1) + '" y2="' + BOTTOM + '" stroke="#c8bda9" stroke-opacity=".5" stroke-width="1"/>';
      });
      out += '<line x1="752" y1="' + (BOTTOM - 4 * SPACING) + '" x2="752" y2="' + BOTTOM + '" stroke="#e3bb6c" stroke-opacity=".8" stroke-width="2"/>';
      /* time signature and label */
      out += '<text x="70" y="' + (BOTTOM - 4 * SPACING - 14) + '" fill="#978d7d" font-family="Heebo, Arial, sans-serif" font-size="11" letter-spacing="1.4">' + mode.name.toUpperCase() + '</text>';
      out += '<text x="70" y="' + (BOTTOM + 30) + '" fill="#c9a24a" font-family="Heebo, Arial, sans-serif" font-size="11">' + mode.degree + '</text>';
      out += '<text x="640" y="' + (BOTTOM + 30) + '" fill="#978d7d" font-family="Heebo, Arial, sans-serif" font-size="11">2/4</text>';

      /* notes */
      var beat = 0;
      var heads = '';
      var stems = '';
      var labels = '';
      var phraseNotes = [];
      mode.notes.forEach(function (n, idx) {
        var p = parse(n);
        var x = xAt(beat + mode.beats[idx] / 2);
        var y = yOf(p.step);
        phraseNotes.push({ x: x, y: y, startBeat: beat, beats: mode.beats[idx], midi: p.midi, name: n });
        heads += '<ellipse class="note-head" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="7" ry="5.2" transform="rotate(-18 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="#efe4cd"/>';
        var stemUp = y > BOTTOM - 2 * SPACING;
        if (mode.beats[idx] < 2) {
          stems += '<line x1="' + (x + 6).toFixed(1) + '" y1="' + (y - 1).toFixed(1) + '" x2="' + (x + 6).toFixed(1) + '" y2="' + (stemUp ? y - 30 : y + 30).toFixed(1) + '" stroke="#efe4cd" stroke-width="1.6"/>';
        }
        if (p.acc === '#') labels += '<text x="' + (x - 11).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" fill="#e3bb6c" font-family="Heebo, Arial, sans-serif" font-size="13" text-anchor="end">♯</text>';
        if (p.acc === 'b') labels += '<text x="' + (x - 11).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" fill="#e3bb6c" font-family="Heebo, Arial, sans-serif" font-size="13" text-anchor="end">♭</text>';
        /* ledger line for notes below the staff */
        if (y > BOTTOM + 3) {
          var ly = BOTTOM + SPACING;
          while (ly <= y + 1) {
            out += '<line x1="' + (x - 12).toFixed(1) + '" y1="' + ly + '" x2="' + (x + 12).toFixed(1) + '" y2="' + ly + '" stroke="#c8bda9" stroke-opacity=".55" stroke-width="1"/>';
            ly += SPACING;
          }
        }
        labels += '<text x="' + x.toFixed(1) + '" y="' + (BOTTOM + 52) + '" fill="#978d7d" font-family="Heebo, Arial, sans-serif" font-size="10" text-anchor="middle">' + p.letter + (p.acc === '#' ? '♯' : p.acc === 'b' ? '♭' : '') + '</text>';
        beat += mode.beats[idx];
      });

      out += heads + stems + labels;
      out += '<path d="M' + phraseNotes[0].x.toFixed(1) + ' ' + (phraseNotes[0].y - 34).toFixed(1) + ' Q ' + ((X0 + X1) / 2) + ' ' + (phraseNotes[0].y - 62) + ' ' + phraseNotes[phraseNotes.length - 1].x.toFixed(1) + ' ' + (phraseNotes[phraseNotes.length - 1].y - 34).toFixed(1) + '" fill="none" stroke="#e3bb6c" stroke-opacity=".55" stroke-width="1.2"/>';
      out += '<line id="staff-playhead" x1="' + X0 + '" y1="' + (BOTTOM - 4 * SPACING - 10) + '" x2="' + X0 + '" y2="' + (BOTTOM + 10) + '" stroke="#e3bb6c" stroke-opacity="0" stroke-width="2"/>';
      staff.innerHTML = out;
      staff.setAttribute('data-notes', String(phraseNotes.length));
      window.__staffNotes = phraseNotes;
    }

    /* ---------- audio ---------- */
    var ctx = null;
    var active = [];
    var playing = false;
    var playToken = 0;

    function setState(text) {
      if (state) state.textContent = text;
    }

    function stopAll() {
      active.forEach(function (node) {
        try { node.stop(); } catch (e) { /* already stopped */ }
      });
      active = [];
      playing = false;
      playBtn.setAttribute('aria-pressed', 'false');
      playBtn.querySelector('.play-label').textContent = 'Play the phrase';
      var head = document.getElementById('staff-playhead');
      if (head) head.setAttribute('stroke-opacity', '0');
    }

    function buildEvents(mode, beatSec) {
      var base = [];
      var t = 0;
      mode.notes.forEach(function (n, i) {
        base.push({ name: n, start: t, dur: mode.beats[i] * beatSec });
        t += mode.beats[i] * beatSec;
      });

      var orn = ornament.value;
      if (orn === 'krekhts') {
        /* a sob: a semitone below, then back up into the held note */
        [2, 5, 8].forEach(function (idx) {
          if (!base[idx]) return;
          var p = parse(base[idx].name);
          base.push({ midi: p.midi - 1, start: Math.max(0, base[idx].start - 0.09), dur: 0.1, soft: true });
        });
      } else if (orn === 'turn') {
        var longest = 0;
        base.forEach(function (e, i) { if (e.dur > base[longest].dur) longest = i; });
        var target = base[longest];
        var p2 = parse(target.name);
        base.push({ midi: p2.midi + 2, start: target.start + target.dur * 0.5, dur: 0.09, soft: true });
        base.push({ midi: p2.midi - 1, start: target.start + target.dur * 0.62, dur: 0.09, soft: true });
      }
      base.sort(function (a, b) { return a.start - b.start; });
      var total = t;
      if (orn === 'glitsh') {
        base[0].slideFrom = (base[0].midi || parse(base[0].name).midi) - 5;
      }
      return { events: base, total: total };
    }

    function play() {
      if (playing) { stopAll(); setState('Stopped'); return; }
      var mode = currentPhrase();
      var bpm = parseInt(tempo.value, 10) || 96;
      var beatSec = 60 / bpm;

      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { setState('This browser has no audio engine'); return; }
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();

      var master = ctx.createGain();
      master.gain.value = 0.12;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2400;
      filter.Q.value = 0.9;
      filter.connect(master);
      master.connect(ctx.destination);

      var plan = buildEvents(mode, beatSec);
      var t0 = ctx.currentTime + 0.06;
      var token = playToken + 1;
      playToken = token;
      active = [];
      playing = true;
      playBtn.setAttribute('aria-pressed', 'true');
      playBtn.querySelector('.play-label').textContent = 'Stop';
      setState('Playing · ' + mode.name.split(' · ')[0] + ' at ' + bpm);

      plan.events.forEach(function (ev) {
        var p = ev.name ? parse(ev.name) : { midi: ev.midi };
        var f = freqOf(p.midi);
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        var start = t0 + ev.start;
        var dur = Math.max(0.08, ev.dur);
        if (ev.slideFrom) {
          osc.frequency.setValueAtTime(freqOf(p.midi), start);
          osc.frequency.setValueAtTime(freqOf(ev.slideFrom), start);
          osc.frequency.exponentialRampToValueAtTime(f, start + Math.min(0.22, dur * 0.5));
        } else if (ornament.value === 'krekhts' && !ev.soft) {
          osc.frequency.setValueAtTime(f * 1.012, start);
          osc.frequency.linearRampToValueAtTime(f, start + Math.min(0.14, dur));
        } else {
          osc.frequency.setValueAtTime(f, start);
        }
        var peak = ev.soft ? 0.35 : 0.8;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
        gain.gain.setTargetAtTime(0.0001, start + dur - 0.02, 0.04);
        if (dur > 0.3) {
          var lfo = ctx.createOscillator();
          var lfoGain = ctx.createGain();
          lfo.frequency.value = 5.4;
          lfoGain.gain.value = 4;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.detune);
          lfo.start(start + 0.12);
          lfo.stop(start + dur);
          active.push(lfo);
        }
        osc.connect(gain);
        gain.connect(filter);
        osc.start(start);
        osc.stop(start + dur + 0.12);
        active.push(osc);
      });

      var head = document.getElementById('staff-playhead');
      var totalMs = plan.total * 1000;
      var startedAt = performance.now();
      if (head) {
        head.setAttribute('stroke-opacity', '0.85');
        var X0 = 92, X1 = 742;
        var tick = function (now) {
          if (token !== playToken) return;
          var frac = Math.min(1, (now - startedAt) / totalMs);
          var x = X0 + (X1 - X0) * frac;
          head.setAttribute('x1', x.toFixed(1));
          head.setAttribute('x2', x.toFixed(1));
          if (frac < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      }

      window.setTimeout(function () {
        if (token !== playToken) return;
        stopAll();
        setState('Played · press again to hear it slower');
      }, totalMs + 260);
    }

    playBtn.addEventListener('click', play);

    function onTempo() {
      if (bpmOut) bpmOut.textContent = tempo.value;
      if (tempoOut) tempoOut.textContent = '♩ = ' + tempo.value;
    }
    tempo.addEventListener('input', onTempo);
    modeSel.addEventListener('change', function () {
      if (playing) stopAll();
      renderStaff();
      setState('Ready · ' + currentPhrase().name.split(' · ')[0]);
    });
    ornament.addEventListener('change', function () {
      if (playing) stopAll();
      setState('Ready · ' + ornament.options[ornament.selectedIndex].text);
    });

    onTempo();
    renderStaff();
    setState('Ready');
  })();

  /* ---------- booking form ---------- */
  (function form() {
    var f = document.getElementById('contact-form');
    if (!f) return;
    var note = document.getElementById('form-note');
    f.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = f.querySelector('#name');
      var email = f.querySelector('#email');
      var message = f.querySelector('#message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (note) { note.textContent = 'The date, a name and an email are enough to start; the message field is the one I read first.'; note.hidden = false; }
        return;
      }
      if (note) {
        note.textContent = 'Sent, ' + name.value.trim().split(' ')[0] + '. I answer booking enquiries on Mondays and Thursdays, and I will tell you honestly if the quartet is already out that night.';
        note.hidden = false;
      }
      f.reset();
    });
  })();
})();
