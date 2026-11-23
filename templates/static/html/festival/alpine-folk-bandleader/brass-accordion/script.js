/* Brass Accordion — the voicing desk.
   Builds a four- or five-part brass voicing, transposes it for B-flat players,
   draws the pitch ladder, and plays it only when the button is pressed. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  var KEYS = { F: 5, Bb: 10, Eb: 3, Ab: 8 };
  var KEY_LABEL = { F: 'F', Bb: 'B♭', Eb: 'E♭', Ab: 'A♭' };
  var CHORDS = {
    I: { deg: 0, tones: [0, 4, 7], minor: false },
    IV: { deg: 5, tones: [0, 4, 7], minor: false },
    V: { deg: 7, tones: [0, 4, 7], minor: false },
    vi: { deg: 9, tones: [0, 3, 7], minor: true }
  };
  var INSTRUMENTS = {
    tuba: { label: 'Tuba', short: 'Tb', bb: false, color: '#1f3b32', role: 'root' },
    trombone: { label: 'Trombone', short: 'Tr', bb: false, color: '#3d5c4e', role: 'fifth' },
    accordion: { label: 'Accordion', short: 'Ac', bb: false, color: '#a8442a', role: 'third' },
    clarinet: { label: 'Clarinet in B♭', short: 'Cl', bb: true, color: '#a97c2f', role: 'fifth' },
    flugelhorn: { label: 'Flügelhorn in B♭', short: 'Fl', bb: true, color: '#c99a45', role: 'root' }
  };
  var ENSEMBLES = {
    trio: ['tuba', 'accordion', 'flugelhorn'],
    quartet: ['tuba', 'accordion', 'clarinet', 'flugelhorn'],
    quintet: ['tuba', 'trombone', 'accordion', 'clarinet', 'flugelhorn']
  };

  var state = { key: 'F', chord: 'I', ensemble: 'trio', voicing: 'close', tempo: 112 };

  function pc(midi) { return ((midi % 12) + 12) % 12; }
  function noteName(midi) { return NAMES[pc(midi)] + (Math.floor(midi / 12) - 1); }
  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* a chord-tone pitch in a given octave: octave 4 means MIDI 48 + pc */
  function tone(rootPc, semitone, octave) {
    return 12 * (octave + 1) + pc(rootPc + semitone);
  }

  function buildVoicing() {
    var rootPc = (KEYS[state.key] + CHORDS[state.chord].deg + 12) % 12;
    var quality = CHORDS[state.chord].minor ? [0, 3, 7] : [0, 4, 7];
    var third = quality[1];
    var fifth = quality[2];
    var voices = [];

    voices.push({ inst: 'tuba', midi: tone(rootPc, 0, 2) });

    if (ENSEMBLES[state.ensemble].indexOf('trombone') >= 0) {
      voices.push({ inst: 'trombone', midi: tone(rootPc, fifth, 2) });
    }

    /* upper three: the voicing style decides where the middle sits */
    var accOct = state.voicing === 'open' ? 3 : 4;
    var accMidi = tone(rootPc, third, accOct);
    if (state.voicing === 'drop2' && ENSEMBLES[state.ensemble].indexOf('clarinet') < 0) accMidi -= 12;
    voices.push({ inst: 'accordion', midi: accMidi });

    if (ENSEMBLES[state.ensemble].indexOf('clarinet') >= 0) {
      var clarMidi = tone(rootPc, fifth, 4);
      if (state.voicing === 'drop2') clarMidi -= 12;
      voices.push({ inst: 'clarinet', midi: clarMidi });
    }

    voices.push({ inst: 'flugelhorn', midi: tone(rootPc, 0, 5) });

    voices.sort(function (a, b) { return a.midi - b.midi; });
    return { voices: voices, rootPc: rootPc };
  }

  var INTERVALS = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th'];
  function intervalName(semis) {
    if (semis === 0) return 'unison';
    var oct = Math.floor(semis / 12);
    var simple = semis % 12;
    if (simple === 0) return oct === 1 ? 'octave' : oct + ' octaves';
    var base = INTERVALS[simple];
    if (oct >= 1) return 'compound ' + base + ' (' + (7 + simple) + 'th)';
    return base;
  }

  function chordLabel() {
    var rootPc = (KEYS[state.key] + CHORDS[state.chord].deg + 12) % 12;
    return NAMES[rootPc] + (CHORDS[state.chord].minor ? ' minor' : ' major') + ' · ' + state.chord;
  }

  function tempoWord(t) {
    if (t < 96) return 'chorale';
    if (t < 126) return 'waltz';
    if (t < 146) return 'polka';
    return 'schnellpolka';
  }

  function drawLadder(data) {
    var svg = document.getElementById('ladder');
    if (!svg) return;
    var top = 24;
    var bottom = 300;
    var lowMidi = 36;
    var highMidi = 84;
    var step = (bottom - top) / (highMidi - lowMidi);
    var y = function (midi) { return top + (highMidi - midi) * step; };
    var width = 560;
    var parts = [];
    parts.push('<rect x="0" y="0" width="560" height="340" fill="#f7f3e7"/>');

    for (var m = lowMidi; m <= highMidi; m += 12) {
      var gy = y(m);
      parts.push('<line x1="54" y1="' + gy + '" x2="540" y2="' + gy + '" stroke="rgba(32,38,31,.18)" stroke-width="1"/>');
      parts.push('<text x="46" y="' + (gy + 4) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9" fill="#6a6e5e">C' + (m / 12 - 1) + '</text>');
    }
    /* middle C emphasised */
    parts.push('<line x1="54" y1="' + y(60) + '" x2="540" y2="' + y(60) + '" stroke="rgba(168,68,42,.35)" stroke-width="1" stroke-dasharray="4 4"/>');

    var n = data.voices.length;
    var xs = data.voices.map(function (v, i) { return 120 + i * (380 / Math.max(1, n - 1)); });

    /* connecting line, bass to top */
    var pts = data.voices.map(function (v, i) { return xs[i] + ',' + y(v.midi); }).join(' ');
    parts.push('<polyline points="' + pts + '" fill="none" stroke="rgba(32,38,31,.35)" stroke-width="1.5"/>');

    data.voices.forEach(function (v, i) {
      var info = INSTRUMENTS[v.inst];
      var vy = y(v.midi);
      parts.push('<line x1="' + xs[i] + '" y1="' + vy + '" x2="' + xs[i] + '" y2="' + bottom + '" stroke="rgba(32,38,31,.12)" stroke-width="1"/>');
      parts.push('<circle cx="' + xs[i] + '" cy="' + vy + '" r="8" fill="' + info.color + '" stroke="#20261f" stroke-width="1.5"/>');
      parts.push('<text x="' + xs[i] + '" y="' + (vy - 16) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#20261f">' + noteName(v.midi) + '</text>');
      parts.push('<text x="' + xs[i] + '" y="' + (bottom + 18) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#6a6e5e">' + info.short + '</text>');
    });

    parts.push('<line x1="54" y1="' + bottom + '" x2="540" y2="' + bottom + '" stroke="#20261f" stroke-width="1.5"/>');
    parts.push('<text x="54" y="' + (bottom + 40) + '" font-family="JetBrains Mono, monospace" font-size="9" fill="#6a6e5e">sounding pitch · grand staff range</text>');
    svg.innerHTML = parts.join('');
  }

  function render() {
    var data = buildVoicing();
    var voices = data.voices;
    var bass = voices[0];
    var topV = voices[voices.length - 1];
    var spread = topV.midi - bass.midi;

    drawLadder(data);

    var list = document.getElementById('voiceList');
    if (list) {
      list.innerHTML = voices.slice().reverse().map(function (v) {
        var info = INSTRUMENTS[v.inst];
        var written = info.bb ? v.midi + 2 : v.midi;
        return '<div class="voice"><span class="dot" style="background:' + info.color + '"></span><div>' +
          '<b>' + info.label + '</b>' +
          '<span>' + noteName(v.midi) + ' · ' + Math.round(freq(v.midi)) + ' Hz · ' + intervalName(v.midi - bass.midi) + '</span>' +
          '<span>written <em>' + noteName(written) + '</em>' + (info.bb ? ' (B♭, sounds a tone lower)' : ' (concert)') + '</span>' +
          '</div></div>';
      }).join('');
    }

    var upper = voices.filter(function (v) { return INSTRUMENTS[v.inst].role !== 'root' || v !== bass; });
    var lowestUpper = upper.length ? upper[0].midi : topV.midi;
    var upperSpread = topV.midi - lowestUpper;
    var balance;
    if (state.ensemble === 'trio' && state.voicing === 'open') balance = 'Wide for three players — the accordion has to fill a lot of air';
    else if (upperSpread > 19) balance = 'Wide — the clarinet has to hold the middle together';
    else if (upperSpread <= 12 && state.ensemble !== 'trio') balance = 'Close — accordion and clarinet will crowd the same register';
    else balance = 'Balanced for a village hall';

    var set = function (id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
    set('outChord', chordLabel());
    set('outBass', noteName(bass.midi) + ' · ' + freq(bass.midi).toFixed(1) + ' Hz');
    set('outSpread', spread + ' semitones · ' + (spread / 12).toFixed(1) + ' octaves');
    set('outWritten', noteName(voices[voices.length - 1].midi + 2));
    set('outBalance', balance);
    set('outTempo', state.tempo + ' bpm · ' + tempoWord(state.tempo));
    set('deskTitle', chordLabel());

    document.querySelectorAll('[data-ensemble]').forEach(function (b) {
      var on = b.getAttribute('data-ensemble') === state.ensemble;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-voicing]').forEach(function (b) {
      var on = b.getAttribute('data-voicing') === state.voicing;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* controls */
  var keySel = document.getElementById('keySel');
  var chordSel = document.getElementById('chordSel');
  var tempoIn = document.getElementById('tempoIn');
  if (keySel) keySel.addEventListener('change', function () { state.key = keySel.value; render(); });
  if (chordSel) chordSel.addEventListener('change', function () { state.chord = chordSel.value; render(); });
  if (tempoIn) {
    tempoIn.addEventListener('input', function () {
      state.tempo = Number(tempoIn.value);
      var out = document.getElementById('tempoOut');
      if (out) out.textContent = state.tempo + ' bpm';
      render();
    });
  }
  document.querySelectorAll('[data-ensemble]').forEach(function (b) {
    b.addEventListener('click', function () { state.ensemble = b.getAttribute('data-ensemble'); render(); });
  });
  document.querySelectorAll('[data-voicing]').forEach(function (b) {
    b.addEventListener('click', function () { state.voicing = b.getAttribute('data-voicing'); render(); });
  });

  /* audio, only on press */
  var ctx = null;
  var timer = null;
  function stopAll() {
    if (timer) { clearTimeout(timer); timer = null; }
    var st = document.getElementById('soundStatus');
    if (st) st.textContent = 'Silent';
  }
  function play() {
    var AC = window.AudioContext || window.webkitAudioContext;
    var st = document.getElementById('soundStatus');
    if (!AC) { if (st) st.textContent = 'No audio engine in this browser'; return; }
    try {
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      stopAll();
      var data = buildVoicing();
      var now = ctx.currentTime;
      var master = ctx.createGain();
      master.gain.value = 0.72;
      master.connect(ctx.destination);

      data.voices.forEach(function (v) {
        var f = freq(v.midi);
        var conf = {
          tuba: { type: 'sine', cut: 520, gain: 0.3 },
          trombone: { type: 'sawtooth', cut: 900, gain: 0.11 },
          accordion: { type: 'sawtooth', cut: 1800, gain: 0.1 },
          clarinet: { type: 'square', cut: 1200, gain: 0.075 },
          flugelhorn: { type: 'triangle', cut: 1500, gain: 0.15 }
        }[v.inst];
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = conf.cut;
        filter.Q.value = 0.7;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(conf.gain, now + 0.05);
        g.gain.setValueAtTime(conf.gain, now + 1.15);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        filter.connect(g);
        g.connect(master);
        var oscs = [];
        if (v.inst === 'accordion') {
          [-6, 6].forEach(function (cents) {
            var o = ctx.createOscillator();
            o.type = conf.type;
            o.frequency.value = f;
            o.detune.value = cents;
            o.connect(filter);
            o.start(now); o.stop(now + 1.95);
            oscs.push(o);
          });
        } else {
          var o2 = ctx.createOscillator();
          o2.type = conf.type;
          o2.frequency.value = f;
          o2.connect(filter);
          o2.start(now); o2.stop(now + 1.95);
          oscs.push(o2);
        }
      });
      if (st) st.textContent = 'Sounding · ' + chordLabel() + ' · ' + state.voicing;
      timer = setTimeout(function () {
        if (st) st.textContent = 'Silent';
        timer = null;
      }, 2050);
    } catch (err) {
      if (st) st.textContent = 'Audio could not start';
    }
  }
  var playBtn = document.getElementById('playVoicing');
  if (playBtn) playBtn.addEventListener('click', play);

  render();

  /* ---------- booking form ---------- */
  var form = document.getElementById('bandForm');
  if (form) {
    var status = document.getElementById('bandStatus');
    var showError = function (field, message) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      if (wrap) wrap.classList.toggle('invalid', Boolean(message));
      if (err) err.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var date = form.elements.date;
      var kind = form.elements.kind;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var problems = 0;
      if (!name.value.trim() || name.value.trim().length < 2) { showError(name, 'A name, please'); problems++; } else showError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { showError(email, 'That address is incomplete'); problems++; } else showError(email, '');
      if (!date.value) { showError(date, 'A date, even approximate'); problems++; } else showError(date, '');
      if (!kind.value) { showError(kind, 'Choose the kind of engagement'); problems++; } else showError(kind, '');
      if (!message.value.trim() || message.value.trim().length < 10) { showError(message, 'A line about the occasion and the place'); problems++; } else showError(message, '');
      if (!consent.checked) { showError(consent, 'Please tick to allow a reply'); problems++; } else showError(consent, '');
      if (status) {
        if (problems) {
          status.className = 'form-status bad';
          status.textContent = problems + (problems === 1 ? ' answer needs attention above.' : ' answers need attention above.');
        } else {
          form.reset();
          document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
          document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
          status.className = 'form-status ok';
          status.textContent = 'Received. Sepp answers on Monday evenings after rehearsal, usually within three days.';
        }
      }
    });
    form.addEventListener('reset', function () {
      document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
    });
  }

  window.__voicing = buildVoicing;
})();
