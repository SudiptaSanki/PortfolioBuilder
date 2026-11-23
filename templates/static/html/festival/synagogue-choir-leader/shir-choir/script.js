/* ==========================================================================
   Shir Choir — interaction
   The only sound on this site is the voice desk, and it is silent until
   the visitor presses play. No AudioContext exists before that gesture.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------- nav */
  var toggle = document.querySelector('.rail__toggle');
  var nav = document.getElementById('rail-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 780) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------------- reveal */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      rvs.forEach(function (el) { io.observe(el); });
    } else {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ------------------------------------------------------------- voice desk */
  var NOTE_OFFSET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var ACC = { '♭': -1, 'b': -1, '♯': 1, '#': 1, '': 0 };

  function freq(note) {
    var m = /^([A-G])([♭♯b#]?)(-?\d)$/.exec(note);
    if (!m) return 0;
    var midi = (parseInt(m[3], 10) + 1) * 12 + NOTE_OFFSET[m[1]] + (ACC[m[2]] || 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function pretty(note) {
    return note.replace('b', '♭').replace('#', '♯');
  }

  var MODES = {
    kabbalat: {
      label: 'Kabbalat Shabbat',
      short: 'L’cha Dodi · minor nusach',
      chords: [
        { label: 'Gm', notes: { soprano: 'G4', alto: 'D4', tenor: 'B♭3', bass: 'G3' } },
        { label: 'E♭', notes: { soprano: 'E♭4', alto: 'B♭3', tenor: 'G3', bass: 'E♭3' } },
        { label: 'Cm', notes: { soprano: 'E♭4', alto: 'C4', tenor: 'G3', bass: 'C3' } },
        { label: 'D', notes: { soprano: 'D4', alto: 'A3', tenor: 'F♯3', bass: 'D3' } }
      ],
      parts: {
        soprano: {
          entry: 'After the congregation has found the tune, on the third stanza of L’cha Dodi.',
          range: 'D4 – F5',
          listen: 'The top edge, not the loudest thing in the room. On “Bo’i kallah” the line rises a fourth and should arrive without a push.'
        },
        alto: {
          entry: 'With the choir on the second stanza, under the soprano.',
          range: 'B♭3 – D5',
          listen: 'The third of every chord. When the chord turns from G minor to E♭ the alto is the voice that makes the change audible.'
        },
        tenor: {
          entry: 'First, quietly, an octave below the melody line before the choir joins.',
          range: 'G3 – G4',
          listen: 'Holds the fifth and stays out of the soprano’s way. In the last bar the tenor has the leading tone and must not hurry it.'
        },
        bass: {
          entry: 'At the opening chord, on the root, and then almost nothing for two bars.',
          range: 'C3 – E♭4',
          listen: 'Stepwise motion down: G, E♭, C, D. The bass walks the whole cadence in four notes and the choir does the rest.'
        }
      }
    },
    hhd: {
      label: 'High Holy Days',
      short: 'Kol Nidre · Ahava Rabbah',
      chords: [
        { label: 'Dm', notes: { soprano: 'D4', alto: 'A3', tenor: 'F3', bass: 'D3' } },
        { label: 'Gm', notes: { soprano: 'G4', alto: 'D4', tenor: 'B♭3', bass: 'G3' } },
        { label: 'A', notes: { soprano: 'A4', alto: 'E4', tenor: 'C♯4', bass: 'A3' } },
        { label: 'Dm', notes: { soprano: 'F4', alto: 'D4', tenor: 'A3', bass: 'D3' } }
      ],
      parts: {
        soprano: {
          entry: 'On the second recitation of Kol Nidre, after the shaliach tzibbur has set the mode.',
          range: 'D4 – A4',
          listen: 'The augmented second between E♭ and F♯ is the whole argument of the mode. Sing it in tune and do not soften it into a step.'
        },
        alto: {
          entry: 'At the first cadence, sustaining under the solo line.',
          range: 'A3 – F4',
          listen: 'A single sustained tone through the first two bars. The alto is the room’s breath here; moving is worse than being slightly flat.'
        },
        tenor: {
          entry: 'On the repeat of the opening phrase, an octave below the melody.',
          range: 'F3 – D4',
          listen: 'The C♯ in the third bar is the only leading tone in the mode. It should sound like a question, not a resolution.'
        },
        bass: {
          entry: 'With the opening chord, and then held for as long as the breath allows.',
          range: 'D3 – A3',
          listen: 'Almost still: D, G, A, D. In Kol Nidre the bass is the floor the melody leans on, and the floor should not move while someone is praying.'
        }
      }
    },
    shacharit: {
      label: 'Shabbat Morning',
      short: 'Kedusha · Adonai Malach',
      chords: [
        { label: 'F', notes: { soprano: 'F4', alto: 'C4', tenor: 'A3', bass: 'F3' } },
        { label: 'B♭', notes: { soprano: 'B♭4', alto: 'F4', tenor: 'D4', bass: 'B♭3' } },
        { label: 'C', notes: { soprano: 'C5', alto: 'G4', tenor: 'E4', bass: 'C4' } },
        { label: 'F', notes: { soprano: 'A4', alto: 'F4', tenor: 'C4', bass: 'F3' } }
      ],
      parts: {
        soprano: {
          entry: 'On “Kadosh, kadosh, kadosh”, after the reader’s first line.',
          range: 'F4 – C5',
          listen: 'The peak of the morning. Take the C at the third bar in one breath and come down by step; the descent is the part people remember.'
        },
        alto: {
          entry: 'With the choir, on the first response.',
          range: 'C4 – G4',
          listen: 'Keeps the third steady while the soprano rises. In the last bar the alto and tenor cross; hold your line and let them pass.'
        },
        tenor: {
          entry: 'On the first response, under the soprano.',
          range: 'A3 – E4',
          listen: 'Sings the fifth and then the third. The tenor line is what makes the Kedusha sound major rather than merely loud.'
        },
        bass: {
          entry: 'At the opening, on F, and on every downbeat after it.',
          range: 'F3 – C4',
          listen: 'Four roots: F, B♭, C, F. Nothing else. The bass’s restraint is what lets forty voices sound like one room.'
        }
      }
    }
  };

  var desk = document.getElementById('voice-desk');
  if (desk) {
    var chart = document.getElementById('voice-chart');
    var state = {
      mode: 'kabbalat',
      part: 'soprano',
      ctx: null,
      master: null,
      nodes: [],
      playing: false,
      timers: []
    };

    var els = {
      title: document.getElementById('readout-title'),
      mode: document.getElementById('readout-mode'),
      entry: document.getElementById('readout-entry'),
      range: document.getElementById('readout-range'),
      listen: document.getElementById('readout-listen'),
      play: document.getElementById('play-chord'),
      playLabel: document.getElementById('play-label'),
      stop: document.getElementById('stop-chord'),
      status: document.getElementById('audio-state'),
      badge: document.getElementById('sound-badge'),
      badgeText: document.getElementById('sound-badge-text')
    };

    var NS = 'http://www.w3.org/2000/svg';
    var PARTS = [
      { key: 'soprano', abbr: 'S', name: 'Soprano' },
      { key: 'alto', abbr: 'A', name: 'Alto' },
      { key: 'tenor', abbr: 'T', name: 'Tenor' },
      { key: 'bass', abbr: 'B', name: 'Bass' }
    ];

    function el(name, attrs, text) {
      var node = document.createElementNS(NS, name);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
      if (text !== undefined) node.textContent = text;
      return node;
    }

    // Shared pitch axis for the four voices: C3 to C5 on a log scale.
    var F_LOW = 130.81;
    var F_HIGH = 523.25;
    var Y_TOP = 54;
    var Y_BOTTOM = 262;
    function pitchY(f) {
      var t = Math.log(f / F_LOW) / Math.log(F_HIGH / F_LOW);
      return Y_BOTTOM - t * (Y_BOTTOM - Y_TOP);
    }

    function drawChart() {
      if (!chart) return;
      var mode = MODES[state.mode];
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var title = el('title', { id: 'chart-title' }, mode.label + ' — four parts across four chords');
      chart.appendChild(title);

      var X0 = 132;
      var XSTEP = 122;

      // octave guides
      [130.81, 261.63, 523.25].forEach(function (f) {
        var y = pitchY(f);
        chart.appendChild(el('line', { x1: 92, y1: y, x2: 604, y2: y, stroke: 'rgba(236,226,205,0.09)', 'stroke-width': 1, 'stroke-dasharray': '2 6' }));
        chart.appendChild(el('text', { x: 96, y: y - 5, fill: '#6f6a5d', 'font-size': 9, 'font-family': 'Georgia, serif' }, f === 130.81 ? 'C3' : f === 261.63 ? 'C4' : 'C5'));
      });

      // chord columns
      mode.chords.forEach(function (chord, i) {
        var x = X0 + i * XSTEP;
        chart.appendChild(el('line', { x1: x, y1: 40, x2: x, y2: 278, stroke: 'rgba(236,226,205,0.07)', 'stroke-width': 1 }));
        chart.appendChild(el('text', { x: x, y: 28, fill: '#e3c46b', 'font-size': 13, 'font-family': 'Georgia, serif', 'text-anchor': 'middle' }, chord.label));
        chart.appendChild(el('text', { x: x, y: 298, fill: '#6f6a5d', 'font-size': 9, 'letter-spacing': '1.5', 'text-anchor': 'middle' }, 'BAR ' + (i + 1)));
      });

      // parts
      PARTS.forEach(function (part) {
        var selected = part.key === state.part;
        var points = mode.chords.map(function (chord, i) {
          return { x: X0 + i * XSTEP, y: pitchY(freq(chord.notes[part.key])), note: chord.notes[part.key] };
        });
        chart.appendChild(el('text', {
          x: 78, y: points[0].y + 4,
          fill: selected ? '#e3c46b' : '#8e8878',
          'font-size': 11, 'letter-spacing': 1.6, 'text-anchor': 'end',
          'font-family': 'Assistant, sans-serif', 'font-weight': selected ? 600 : 400
        }, part.abbr + '  ' + part.name));

        var d = 'M ' + points[0].x + ' ' + points[0].y;
        for (var i = 1; i < points.length; i++) {
          var p0 = points[i - 1];
          var p1 = points[i];
          var mx = (p0.x + p1.x) / 2;
          d += ' C ' + mx + ' ' + p0.y + ', ' + mx + ' ' + p1.y + ', ' + p1.x + ' ' + p1.y;
        }
        chart.appendChild(el('path', {
          d: d,
          fill: 'none',
          stroke: selected ? '#c9a227' : 'rgba(236,226,205,0.26)',
          'stroke-width': selected ? 2.2 : 1.2,
          'stroke-linecap': 'round'
        }));

        points.forEach(function (p, i) {
          chart.appendChild(el('circle', {
            cx: p.x, cy: p.y,
            r: selected ? 5.4 : 3.6,
            fill: selected ? '#e3c46b' : '#0b1120',
            stroke: selected ? '#0b1120' : 'rgba(236,226,205,0.45)',
            'stroke-width': selected ? 1.6 : 1.2
          }));
          if (selected) {
            chart.appendChild(el('text', {
              x: p.x, y: p.y - 13, fill: '#ece2cd', 'font-size': 11,
              'font-family': 'Assistant, sans-serif', 'font-weight': 600, 'text-anchor': 'middle'
            }, pretty(p.note)));
          }
        });
      });

      // legend
      chart.appendChild(el('text', { x: 92, y: 312, fill: '#6f6a5d', 'font-size': 9.5, 'letter-spacing': '1.2' }, 'PITCH AXIS: C3 AT THE BOTTOM, C5 AT THE TOP'));
      chart.setAttribute('aria-label', mode.label + ' voice-leading chart. ' + PARTS.map(function (p) {
        return p.name + ': ' + mode.chords.map(function (c) { return pretty(c.notes[p.key]); }).join(', ');
      }).join('. '));
    }

    function updateReadout() {
      var mode = MODES[state.mode];
      var part = mode.parts[state.part];
      els.title.textContent = PARTS.filter(function (p) { return p.key === state.part; })[0].name;
      els.mode.textContent = mode.label + ' · ' + mode.short;
      els.entry.textContent = part.entry;
      els.range.textContent = part.range;
      els.listen.textContent = part.listen;
    }

    function setPressed(groupSelector, value) {
      Array.prototype.forEach.call(document.querySelectorAll(groupSelector + ' .chip'), function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-' + (groupSelector === '[data-mode]' ? 'mode' : 'part')) === value ? 'true' : 'false');
      });
    }

    function chooseMode(mode) {
      state.mode = mode;
      Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false');
      });
      drawChart();
      updateReadout();
      if (state.playing) stopAudio('Mode changed — the cadence stopped. Press play to hear the new one.');
    }

    function choosePart(part) {
      state.part = part;
      Array.prototype.forEach.call(document.querySelectorAll('[data-part]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-part') === part ? 'true' : 'false');
      });
      drawChart();
      updateReadout();
    }

    function clearTimers() {
      state.timers.forEach(function (t) { clearTimeout(t); });
      state.timers = [];
    }

    function stopAudio(message, quiet) {
      clearTimers();
      state.playing = false;
      if (els.play) {
        els.play.disabled = false;
        els.playLabel.textContent = 'Sound the cadence';
      }
      if (els.stop) els.stop.hidden = true;
      if (els.badge) els.badge.classList.remove('is-live');
      if (els.badgeText) els.badgeText.textContent = 'Silent until you press play';
      if (state.master && state.ctx) {
        try {
          state.master.gain.cancelScheduledValues(state.ctx.currentTime);
          state.master.gain.setTargetAtTime(0, state.ctx.currentTime, 0.06);
        } catch (e) { /* ignore */ }
      }
      state.nodes.forEach(function (node) {
        try { node.stop(state.ctx.currentTime + 0.25); } catch (e) { /* already stopped */ }
      });
      state.nodes = [];
      if (message) els.status.textContent = message;
      if (state.ctx && state.ctx.state === 'running' && !quiet) {
        state.timers.push(setTimeout(function () {
          try { state.ctx.suspend(); } catch (e) { /* ignore */ }
          els.status.textContent = 'Cadence finished. The sound channel is closed again until you press play.';
        }, 320));
      }
    }

    function playCadence() {
      if (state.playing) { stopAudio('Stopped.'); return; }
      var mode = MODES[state.mode];
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        els.status.textContent = 'This browser does not offer the Web Audio API, so the cadence cannot sound here. The chart and the notes are complete without it.';
        return;
      }
      if (!state.ctx) {
        state.ctx = new Ctx();
        // Test hook: this object only exists after a real press.
        window.__shirAudio = { created: true, plays: 0, context: state.ctx };
      }
      if (state.ctx.state === 'suspended') state.ctx.resume();

      var ctx = state.ctx;
      var master = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2600;
      filter.Q.value = 0.4;
      master.gain.value = 0;
      master.connect(filter);
      filter.connect(ctx.destination);
      master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.08);
      state.master = master;
      state.nodes = [];
      window.__shirAudio.plays += 1;

      var chordDur = 0.9;
      var start = ctx.currentTime + 0.06;
      var selectedName = state.part;

      mode.chords.forEach(function (chord, chordIndex) {
        var t0 = start + chordIndex * chordDur;
        PARTS.forEach(function (part) {
          var f = freq(chord.notes[part.key]);
          if (!f) return;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          var isSelected = part.key === selectedName;
          osc.type = isSelected ? 'triangle' : 'sine';
          osc.frequency.value = f;
          // a second, very quiet detuned partial gives the choir its bloom
          var shimmer = ctx.createOscillator();
          shimmer.type = 'sine';
          shimmer.frequency.value = f * 2;
          var shimmerGain = ctx.createGain();
          shimmerGain.gain.value = isSelected ? 0.05 : 0.018;

          var peak = isSelected ? 0.26 : 0.075;
          if (part.key === 'bass') peak *= 1.5;
          if (part.key === 'soprano' && !isSelected) peak *= 1.1;

          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.14);
          gain.gain.setValueAtTime(peak, t0 + chordDur - 0.28);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + chordDur + 0.32);

          osc.connect(gain);
          shimmer.connect(shimmerGain);
          shimmerGain.connect(gain);
          gain.connect(master);

          if (part.key === 'soprano') {
            var lfo = ctx.createOscillator();
            var lfoGain = ctx.createGain();
            lfo.frequency.value = 4.6;
            lfoGain.gain.value = isSelected ? 1.6 : 0.8;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(t0);
            lfo.stop(t0 + chordDur + 0.4);
            state.nodes.push(lfo);
          }

          osc.start(t0);
          shimmer.start(t0);
          osc.stop(t0 + chordDur + 0.4);
          shimmer.stop(t0 + chordDur + 0.4);
          state.nodes.push(osc, shimmer);
        });
      });

      state.playing = true;
      els.play.disabled = false;
      els.playLabel.textContent = 'Restart the cadence';
      if (els.stop) els.stop.hidden = false;
      if (els.badge) els.badge.classList.add('is-live');
      if (els.badgeText) els.badgeText.textContent = 'Sound on — stop whenever you like';
      els.status.textContent = 'Playing ' + mode.label + '. The ' + selectedName + ' line is the bright one; the other three sit under it.';

      var total = (mode.chords.length * chordDur + 0.5) * 1000;
      state.timers.push(setTimeout(function () {
        if (!state.playing) return;
        state.playing = false;
        els.playLabel.textContent = 'Sound the cadence again';
        if (els.stop) els.stop.hidden = true;
        if (els.badge) els.badge.classList.remove('is-live');
        if (els.badgeText) els.badgeText.textContent = 'Silent until you press play';
        els.status.textContent = 'Cadence finished. The sound channel closed itself until you press play again.';
        if (state.ctx) state.ctx.suspend().catch(function () {});
      }, total));

      if (state.ctx.state === 'suspended') state.ctx.resume().catch(function () {});
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (btn) {
      btn.addEventListener('click', function () { chooseMode(btn.getAttribute('data-mode')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-part]'), function (btn) {
      btn.addEventListener('click', function () { choosePart(btn.getAttribute('data-part')); });
    });
    if (els.play) els.play.addEventListener('click', playCadence);
    if (els.stop) els.stop.addEventListener('click', function () { stopAudio('Stopped. Press play when you want the cadence again.'); });

    drawChart();
    updateReadout();
  }

  /* -------------------------------------------------- project filter */
  var filters = document.querySelector('.filters');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-type]'));
    var countEl = document.getElementById('filter-count');
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (!chip) return;
      var value = chip.getAttribute('data-filter');
      Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
        var on = c === chip;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shown = 0;
      items.forEach(function (item) {
        var show = value === 'all' || item.getAttribute('data-type').indexOf(value) !== -1;
        item.hidden = !show;
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' programme' : ' programmes');
    });
  }

  /* ------------------------------------------------------- contact form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('sent');
    var successDetail = document.getElementById('sent-detail');
    var successRef = document.getElementById('sent-ref');

    function fieldWrap(input) { return input.closest('.field') || input.closest('.check'); }
    function setErr(input, message) {
      var wrap = fieldWrap(input);
      if (!wrap) return;
      wrap.classList.toggle('has-error', Boolean(message));
      var err = wrap.querySelector('.err');
      if (err) err.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    var checks = [
      { id: 'c-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give me a name to reply to.' },
      { id: 'c-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email address looks incomplete.' },
      { id: 'c-type', test: function (v) { return Boolean(v); }, msg: 'Choose the kind of occasion.' },
      { id: 'c-date', test: function (v) { return Boolean(v); }, msg: 'A date, even an approximate one, helps me answer honestly.' },
      { id: 'c-venue', test: function (v) { return v.trim().length >= 2; }, msg: 'Where would it take place?' },
      { id: 'c-message', test: function (v) { return v.trim().length >= 12; }, msg: 'A sentence or two about what you have in mind.' }
    ];

    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      if (!input) return;
      input.addEventListener('input', function () { if (fieldWrap(input) && fieldWrap(input).classList.contains('has-error')) setErr(input, ''); });
      input.addEventListener('change', function () { if (c.id === 'c-type') setErr(input, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      var values = {};
      checks.forEach(function (c) {
        var input = document.getElementById(c.id);
        if (!input) return;
        values[c.id] = input.value;
        var ok = c.test(input.value);
        setErr(input, ok ? '' : c.msg);
        if (!ok && !firstBad) firstBad = input;
      });
      var agree = document.getElementById('c-agree');
      var agreeOk = agree && agree.checked;
      if (agree) {
        var wrap = agree.closest('.check');
        if (wrap) wrap.classList.toggle('has-error', !agreeOk);
        var err = wrap && wrap.querySelector('.err');
        if (err) err.textContent = agreeOk ? '' : 'Please confirm I may reply to you.';
        agree.setAttribute('aria-invalid', agreeOk ? 'false' : 'true');
        if (!agreeOk && !firstBad) firstBad = agree;
      }
      if (firstBad) {
        firstBad.focus();
        var live = document.getElementById('form-status');
        if (live) live.textContent = 'The enquiry was not sent. Check the marked fields.';
        return;
      }

      var typeSelect = document.getElementById('c-type');
      var typeLabel = typeSelect && typeSelect.options[typeSelect.selectedIndex] ? typeSelect.options[typeSelect.selectedIndex].text : 'Service';
      var when = values['c-date'] ? new Date(values['c-date'] + 'T12:00:00') : null;
      var whenText = when && !isNaN(when) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the date you gave';
      if (successDetail) {
        successDetail.textContent = 'Thank you, ' + values['c-name'].trim().split(' ')[0] + '. I have your note about ' + typeLabel.toLowerCase() + ' on ' + whenText + ' in ' + values['c-venue'].trim() + '. I answer enquiries on Mondays and Thursdays; if it is urgent, call and leave a message.';
      }
      if (successRef) {
        var ref = 'LOH-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        successRef.textContent = 'Reference ' + ref;
      }
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus();
      }
      var live = document.getElementById('form-status');
      if (live) live.textContent = 'Enquiry recorded on this page. No message has left the browser.';
    });
  }
})();
