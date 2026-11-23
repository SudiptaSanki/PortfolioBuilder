/* Pan Drum Gold — the instrument register.
   Vanilla JS: mobile menu, reveal, the pan-range explorer (Web Audio
   synthesis, user-started only) and the booking enquiry form. */
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

  /* ---------- reveal (read down the register) ---------- */
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

  /* ---------- the range explorer ---------- */
  /* Voice ranges (MIDI), checked against published steelband data:
     low-C tenor C4–E6 · double seconds F3–C6 · double guitar C♯3–F♯5 ·
     six bass B1–C4. Equal temperament, A4 = 440 Hz. */
  var NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var VOICES = {
    tenor: {
      name: 'Lead tenor', sub: 'Low C tenor', pans: '1 pan', lo: 60, hi: 88,
      role: 'Melody — the tune itself, carried on one pan',
      layout: '<b>Laid out in the circle of fifths.</b> The lowest notes sit on the outer ring, by the skirt; their octaves form a second ring just inside, and the highest notes cluster at the centre. Because each note is surrounded by its fifth and its fourth, a chord shape learned in one key is the same shape in all twelve — the layout Anthony Williams standardised in the 1950s, and the reason a tenor player can read a new tune at speed.'
    },
    seconds: {
      name: 'Double seconds', sub: 'The harmony pair', pans: '2 pans', lo: 53, hi: 84,
      role: 'Harmony — the chords under the tune',
      layout: '<b>One keyboard split across two drums.</b> The pair divides the range between a left and a right pan, so the seconds player works like a pianist: chord voicings in one hand, answering figures in the other. Seconds rarely take the tune — they are the band\u2019s harmony engine, filling the space between the tenor\u2019s melody and the guitar pan\u2019s strum.'
    },
    guitar: {
      name: 'Double guitar', sub: 'Also called cello pans', pans: '2 pans', lo: 49, hi: 78,
      role: 'Strum — the chord rhythm the band dances to',
      layout: '<b>Voiced for strumming, not melody.</b> The two pans group chord tones so triads fall under alternating hands in a steady pattern — the \u201cstrum\u201d that gives a steelband its bounce. The layout puts the notes of common chords close together rather than in scale order; a guitar player thinks in chord shapes first and single notes second.'
    },
    bass: {
      name: 'Six bass', sub: 'The lowest voice', pans: '6 pans', lo: 35, hi: 60,
      role: 'Bass line — the floor the whole band stands on',
      layout: '<b>Six drums in a semicircle, a few notes each.</b> No single bass drum can hold a low note big enough, so the voice is spread over six pans arranged in an arc and the player stands inside it, walking the bass line around their own body. It is the only voice played from inside the instrument — and the heaviest load in the van.'
    }
  };
  var SPAN_LO = 35, SPAN_HI = 88; /* B1..E6 — the whole family */

  function noteName(midi) { return NAMES[midi % 12] + (Math.floor(midi / 12) - 1); }
  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  var grid = document.getElementById('noteGrid');
  if (grid) {
    var vName = document.getElementById('vName');
    var vPans = document.getElementById('vPans');
    var vRange = document.getElementById('vRange');
    var vNotes = document.getElementById('vNotes');
    var vRole = document.getElementById('vRole');
    var vLayout = document.getElementById('vLayout');
    var rbSpan = document.getElementById('rbSpan');
    var status = document.getElementById('exStatus');
    var stopBtn = document.getElementById('stopBtn');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.voice-tab'));
    var current = 'tenor';

    /* Audio state — created lazily, ONLY on a note tap. */
    window.__panAudio = { created: false, notes: 0, lastFreq: 0, lastNote: '' };
    var actx = null, bus = null, master = null;

    function ensureCtx() {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        actx = new AC();
        master = actx.createGain();
        master.gain.value = 0.22;
        var comp = actx.createDynamicsCompressor();
        master.connect(comp); comp.connect(actx.destination);
        bus = actx.createGain(); bus.gain.value = 1; bus.connect(master);
        window.__panAudio.created = true;
      }
      if (actx.state === 'suspended') actx.resume();
      return true;
    }

    function stopAll(msg) {
      if (actx && bus) {
        var t = actx.currentTime;
        bus.gain.cancelScheduledValues(t);
        bus.gain.setTargetAtTime(0.0001, t, 0.03);
        var old = bus;
        window.setTimeout(function () {
          try { old.disconnect(); } catch (e) {}
          bus = actx.createGain(); bus.gain.value = 1; bus.connect(master);
        }, 220);
      }
      grid.querySelectorAll('.ringing').forEach(function (b) { b.classList.remove('ringing'); });
      if (status && msg) status.textContent = msg;
    }

    function playNote(midi, name, btnEl) {
      if (!ensureCtx()) { if (status) status.textContent = 'This browser has no Web Audio — the chart still reads true.'; return; }
      var f = freq(midi);
      var t = actx.currentTime;
      var dur = midi < 48 ? 2.4 : 1.6;
      var g = actx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.9, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      g.connect(bus);
      /* A pan tone: strong fundamental, a tuned octave, and the
         inharmonic partials that make steel sound like steel. */
      var partials = [[1, 1], [2.005, 0.38], [2.74, 0.24], [4.12, 0.09], [5.43, 0.05]];
      partials.forEach(function (p) {
        var o = actx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * p[0];
        var og = actx.createGain(); og.gain.value = p[1];
        o.connect(og); og.connect(g);
        o.start(t); o.stop(t + dur + 0.1);
      });
      window.__panAudio.notes++;
      window.__panAudio.lastFreq = f;
      window.__panAudio.lastNote = name;
      if (status) status.textContent = name + ' · ' + f.toFixed(1) + ' Hz — ' + VOICES[current].name + ', synthesised.';
      if (btnEl) {
        btnEl.classList.add('ringing');
        window.setTimeout(function () { btnEl.classList.remove('ringing'); }, 650);
      }
    }

    function renderVoice(key) {
      current = key;
      var v = VOICES[key];
      stopAll('');
      tabs.forEach(function (tb) { tb.setAttribute('aria-pressed', tb.getAttribute('data-voice') === key ? 'true' : 'false'); });
      vName.textContent = v.name;
      vPans.textContent = v.pans;
      vRange.textContent = noteName(v.lo) + ' – ' + noteName(v.hi);
      vNotes.textContent = (v.hi - v.lo + 1) + ' notes';
      vRole.textContent = v.role;
      vLayout.innerHTML = v.layout;
      var total = SPAN_HI - SPAN_LO;
      rbSpan.style.left = ((v.lo - SPAN_LO) / total * 100) + '%';
      rbSpan.style.width = ((v.hi - v.lo) / total * 100) + '%';
      grid.innerHTML = '';
      for (var m = v.lo; m <= v.hi; m++) {
        (function (midi) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'note-btn';
          b.setAttribute('data-midi', midi);
          b.setAttribute('aria-label', 'Play ' + noteName(midi) + ', ' + Math.round(freq(midi)) + ' hertz, synthesised');
          b.innerHTML = noteName(midi) + '<span class="nb-hz">' + Math.round(freq(midi)) + ' Hz</span>';
          b.addEventListener('click', function () { playNote(midi, noteName(midi), b); });
          grid.appendChild(b);
        })(m);
      }
      if (status) status.textContent = v.name + ' loaded — ' + (v.hi - v.lo + 1) + ' notes, ' + noteName(v.lo) + ' to ' + noteName(v.hi) + '. Tap any note to hear it.';
    }

    tabs.forEach(function (tb) {
      tb.addEventListener('click', function () { renderVoice(tb.getAttribute('data-voice')); });
    });
    if (stopBtn) stopBtn.addEventListener('click', function () { stopAll('All quiet — every voice stopped.'); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(''); });
    renderVoice('tenor');
  }

  /* ---------- booking enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirm = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var again = document.getElementById('againBtn');
    var FIELDS = ['fName', 'fEmail', 'fType', 'fMsg'];
    var params = new URLSearchParams(window.location.search);
    var pre = params.get('type');
    var typeSel = document.getElementById('fType');
    if (pre && typeSel) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === pre) { typeSel.selectedIndex = i; break; }
      }
    }
    function fieldWrap(id) { return document.getElementById(id).closest('.field'); }
    function validate(id) {
      var el = document.getElementById(id);
      var ok = !!el.value.trim();
      if (id === 'fEmail') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      fieldWrap(id).classList.toggle('invalid', !ok);
      return ok;
    }
    FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { if (fieldWrap(id).classList.contains('invalid')) validate(id); });
      el.addEventListener('change', function () { if (fieldWrap(id).classList.contains('invalid')) validate(id); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      FIELDS.forEach(function (id) {
        if (!validate(id)) { allOk = false; if (!firstBad) firstBad = id; }
      });
      if (!allOk) { document.getElementById(firstBad).focus(); return; }
      var seedStr = FIELDS.map(function (id) { return document.getElementById(id).value.trim(); }).join('|') + '|' + document.getElementById('fDate').value;
      var seed = 0;
      for (var j = 0; j < seedStr.length; j++) seed += seedStr.charCodeAt(j) * (j + 3);
      var ref = 'MD-2026-' + (100 + (seed % 900));
      if (confirmRef) confirmRef.textContent = ref;
      form.style.display = 'none';
      if (confirm) {
        confirm.classList.add('show');
        confirm.setAttribute('tabindex', '-1');
        confirm.focus();
      }
    });
    if (again) again.addEventListener('click', function () {
      form.reset();
      FIELDS.forEach(function (id) { fieldWrap(id).classList.remove('invalid'); });
      if (confirm) confirm.classList.remove('show');
      form.style.display = '';
      document.getElementById('fName').focus();
    });
  }
})();
