/* Polka Keys — bench logic, navigation and booking form.
   No frameworks. Audio is built only when "Sound the reed" is pressed. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- the bellows bench ---------- */
  var bench = document.getElementById('bellowsBench');
  if (!bench) { initForm(); return; }

  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var ROWS = {
    C: { label: 'C row', push: [60, 64, 67, 72], pull: [62, 65, 69, 71], tonic: 60 },
    B: { label: 'B row', push: [59, 63, 66, 71], pull: [61, 64, 68, 70], tonic: 59 }
  };
  var PUSH_DEGREES = ['root', 'third', 'fifth', 'octave'];
  var PULL_DEGREES = ['second', 'fourth', 'sixth', 'seventh'];
  var CHROMATIC = [60, 61, 62, 63, 64, 65, 66, 67];
  var REGISTERS = {
    M: { label: 'Middle only', cents: [0] },
    L: { label: 'Low octave only', cents: [-1200] },
    H: { label: 'High octave only', cents: [1200] },
    LM: { label: 'Low + middle', cents: [-1200, 0] },
    MM: { label: 'Middle + middle, detuned', cents: [0, 6] },
    MH: { label: 'Middle + high', cents: [0, 1200] }
  };

  var state = { system: 'diatonic', row: 'C', dir: 'push', btn: 0, reg: 'M' };

  var el = {
    keys: document.getElementById('keys'),
    keysNote: document.getElementById('keysNote'),
    rowGroup: document.getElementById('rowGroup'),
    note: document.getElementById('noteOut'),
    freq: document.getElementById('freqOut'),
    degree: document.getElementById('degreeOut'),
    bass: document.getElementById('bassOut'),
    bank: document.getElementById('bankOut'),
    beat: document.getElementById('beatOut'),
    explain: document.getElementById('explainOut'),
    draw: document.getElementById('bellowsDraw'),
    bellowsState: document.getElementById('bellowsState'),
    play: document.getElementById('playReed'),
    status: document.getElementById('playStatus'),
    register: document.getElementById('register')
  };

  function noteName(midi) {
    return NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  }
  function frequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function chordName(midi, minor) {
    return noteName(midi).replace(/\d+$/, '') + (minor ? ' minor' : ' major');
  }

  /* current written pitch and its role */
  function readState() {
    if (state.system === 'chromatic') {
      var cm = CHROMATIC[state.btn];
      return {
        midi: cm,
        degree: 'chromatic button ' + (state.btn + 1),
        bass: 'Counterbass ' + noteName(cm + 4),
        explain: 'On C-griff every button gives the same pitch in both directions; the bellows only change pressure and volume. The counterbass row puts ' + noteName(cm + 4).replace(/\d+$/, '') + ' under ' + noteName(cm).replace(/\d+$/, '') + '.'
      };
    }
    var row = ROWS[state.row];
    var notes = state.dir === 'push' ? row.push : row.pull;
    var midi = notes[state.btn];
    var degree = state.dir === 'push' ? PUSH_DEGREES[state.btn] : PULL_DEGREES[state.btn];
    var tonicName = noteName(row.tonic).replace(/\d+$/, '');
    var bass;
    if (state.dir === 'push') {
      bass = chordName(row.tonic, false) + ' · I';
    } else {
      bass = chordName(row.tonic + 7, false) + ' · V';
    }
    var explain;
    if (state.dir === 'push') {
      explain = 'Push on the ' + row.label + ' gives the tonic triad tones. The bass hand plays ' + tonicName + ' major underneath.';
    } else {
      explain = 'Pull on the ' + row.label + ' gives the passing tones of the scale — second, fourth, sixth, seventh. The bass hand plays ' + noteName(row.tonic + 7).replace(/\d+$/, '') + ' major, the dominant.';
    }
    return { midi: midi, degree: degree, bass: bass, explain: explain };
  }

  function beatRate(baseFreq, cents) {
    if (cents.length === 1) return null;
    var a = baseFreq * Math.pow(2, cents[0] / 1200);
    var b = baseFreq * Math.pow(2, cents[1] / 1200);
    return Math.abs(b - a);
  }

  function renderKeys() {
    var frag = document.createDocumentFragment();
    if (state.system === 'chromatic') {
      CHROMATIC.forEach(function (midi, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'key' + (i === state.btn ? ' is-on' : '');
        b.setAttribute('aria-pressed', i === state.btn ? 'true' : 'false');
        b.setAttribute('data-index', String(i));
        b.innerHTML = '<span class="key-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="key-note">' + noteName(midi) + '</span>' +
          '<span class="key-dir">both ways</span>';
        frag.appendChild(b);
      });
      el.keysNote.textContent = 'C-griff · eight buttons from C4';
    } else {
      var row = ROWS[state.row];
      var notes = state.dir === 'push' ? row.push : row.pull;
      notes.forEach(function (midi, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'key' + (i === state.btn ? ' is-on' : '');
        b.setAttribute('aria-pressed', i === state.btn ? 'true' : 'false');
        b.setAttribute('data-index', String(i));
        b.innerHTML = '<span class="key-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="key-note">' + noteName(midi) + '</span>' +
          '<span class="key-dir">' + (state.dir === 'push' ? 'push' : 'pull') + '</span>';
        frag.appendChild(b);
      });
      el.keysNote.textContent = 'Middle octave · buttons 1–4 of the ' + row.label + ', ' + (state.dir === 'push' ? 'closing' : 'opening');
    }
    el.keys.replaceChildren(frag);
  }

  function render() {
    var info = readState();
    var reg = REGISTERS[state.reg];
    var base = frequency(info.midi);

    el.note.textContent = noteName(info.midi);
    el.freq.textContent = base.toFixed(1) + ' Hz';
    el.degree.textContent = info.degree.charAt(0).toUpperCase() + info.degree.slice(1);
    el.bass.textContent = info.bass;
    el.bank.textContent = reg.label + ' · ' + reg.cents.map(function (c) {
      return (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c) + '¢';
    }).join(' / ');
    var beat = beatRate(base, reg.cents);
    if (beat === null) {
      el.beat.textContent = 'None — one reed';
    } else if (beat < 1) {
      el.beat.textContent = beat.toFixed(2) + ' beats/s';
    } else {
      el.beat.textContent = beat.toFixed(1) + ' beats/s';
    }
    el.explain.textContent = info.explain;

    el.draw.setAttribute('data-direction', state.system === 'chromatic' ? (state.dir === 'push' ? 'push' : 'pull') : state.dir);
    el.bellowsState.textContent = state.system === 'chromatic'
      ? (state.dir === 'push' ? 'Closing · pressure up' : 'Opening · pressure down')
      : (state.dir === 'push' ? 'Closing · push' : 'Opening · pull');

    renderKeys();

    document.querySelectorAll('[data-system]').forEach(function (b) {
      var on = b.getAttribute('data-system') === state.system;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-row]').forEach(function (b) {
      var on = b.getAttribute('data-row') === state.row;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-dir]').forEach(function (b) {
      var on = b.getAttribute('data-dir') === state.dir;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (el.rowGroup) {
      el.rowGroup.classList.toggle('is-muted', state.system === 'chromatic');
      el.rowGroup.setAttribute('aria-disabled', state.system === 'chromatic' ? 'true' : 'false');
    }
  }

  document.querySelectorAll('[data-system]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.system = b.getAttribute('data-system');
      state.btn = 0;
      render();
    });
  });
  document.querySelectorAll('[data-row]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (state.system === 'chromatic') return;
      state.row = b.getAttribute('data-row');
      state.btn = 0;
      render();
    });
  });
  document.querySelectorAll('[data-dir]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.dir = b.getAttribute('data-dir');
      render();
    });
  });
  el.keys.addEventListener('click', function (e) {
    var key = e.target.closest('.key');
    if (!key) return;
    state.btn = Number(key.getAttribute('data-index'));
    render();
  });
  if (el.register) {
    el.register.addEventListener('change', function () {
      state.reg = el.register.value;
      render();
    });
  }

  /* ---------- audio: opt-in only ---------- */
  var ctx = null;
  var nodes = [];
  var timer = null;

  function stopSound() {
    nodes.forEach(function (n) {
      try { n.stop(); } catch (err) { /* already stopped */ }
    });
    nodes = [];
    if (timer) { clearTimeout(timer); timer = null; }
    if (el.status) el.status.textContent = 'Silent';
  }

  function sound() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      if (el.status) el.status.textContent = 'No audio engine in this browser';
      return;
    }
    var info = readState();
    var reg = REGISTERS[state.reg];
    var base = frequency(info.midi);
    try {
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      stopSound();
      var now = ctx.currentTime;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1900;
      filter.Q.value = 0.6;
      filter.connect(ctx.destination);
      var master = ctx.createGain();
      master.gain.value = 0.9 / Math.sqrt(reg.cents.length);
      master.connect(filter);

      reg.cents.forEach(function (cents) {
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = base * Math.pow(2, cents / 1200);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.09, now + 0.18);
        g.gain.setValueAtTime(0.09, now + 0.95);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 1.5);
        nodes.push(osc);
        osc.onended = function () {
          if (nodes.indexOf(osc) === nodes.length - 1) {
            if (el.status) el.status.textContent = 'Silent';
          }
        };
      });
      if (el.status) el.status.textContent = 'Sounding · ' + noteName(info.midi) + ' · ' + reg.label.toLowerCase();
      timer = setTimeout(function () {
        if (el.status) el.status.textContent = 'Silent';
        nodes = [];
        timer = null;
      }, 1650);
    } catch (err) {
      if (el.status) el.status.textContent = 'Audio could not start';
    }
  }

  if (el.play) el.play.addEventListener('click', sound);

  render();

  /* ---------- booking form ---------- */
  function initForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;
    var status = document.getElementById('formStatus');
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
      var venue = form.elements.venue;
      var kind = form.elements.kind;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var problems = 0;

      if (!name.value.trim() || name.value.trim().length < 2) { showError(name, 'A name, please'); problems++; } else showError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { showError(email, 'That address does not look complete'); problems++; } else showError(email, '');
      if (!date.value) { showError(date, 'Choose a date, even an approximate one'); problems++; } else showError(date, '');
      if (!venue.value.trim() || venue.value.trim().length < 2) { showError(venue, 'Where is the hall'); problems++; } else showError(venue, '');
      if (!kind.value) { showError(kind, 'Pick the closest kind of event'); problems++; } else showError(kind, '');
      if (!message.value.trim() || message.value.trim().length < 10) { showError(message, 'A sentence or two about the room and the day'); problems++; } else showError(message, '');
      if (!consent.checked) {
        showError(consent, 'Please tick this so the reply is allowed');
        problems++;
      } else showError(consent, '');

      if (status) {
        if (problems) {
          status.className = 'form-status bad';
          status.textContent = problems + (problems === 1 ? ' answer needs attention above.' : ' answers need attention above.');
        } else {
          form.reset();
          document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
          document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
          status.className = 'form-status ok';
          status.textContent = 'Sent. A reply comes within two business days, with a quote and the dates already held.';
        }
      }
    });

    form.addEventListener('reset', function () {
      document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
    });
  }

  initForm();
})();
