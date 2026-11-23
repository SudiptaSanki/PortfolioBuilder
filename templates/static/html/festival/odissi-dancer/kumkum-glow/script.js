/* Kumkum Glow — behaviour. Silent site: no audio is created or played. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* -------------------------------------------------------------- nav --- */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    var close = function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    var nav = document.getElementById('nav');
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { close(); menuBtn.focus(); }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------- mudras --- */
  var MUDRAS = {
    pataka: {
      name: 'Pataka',
      meaning: 'The flag. All four fingers together, thumb bent to the palm.',
      use: 'Salutation, a flag, the beginning of an item, the palm of the earth.',
      fingers: [
        { x: 118, len: 58, angle: -4, curve: 2 },
        { x: 136, len: 70, angle: 0, curve: 0 },
        { x: 154, len: 66, angle: 3, curve: -1 },
        { x: 170, len: 52, angle: 7, curve: -2 }
      ],
      thumb: 'folded'
    },
    tripataka: {
      name: 'Tripataka',
      meaning: 'The three-part flag. Pataka with the ring finger bent.',
      use: 'A crown, a tree, an arrow, the three worlds.',
      fingers: [
        { x: 118, len: 58, angle: -4, curve: 2 },
        { x: 136, len: 70, angle: 0, curve: 0 },
        { x: 154, len: 46, angle: 10, curve: -16, bent: true },
        { x: 170, len: 52, angle: 7, curve: -2 }
      ],
      thumb: 'folded'
    },
    ardhachandra: {
      name: 'Ardhachandra',
      meaning: 'The half moon. Four fingers straight, thumb extended away.',
      use: 'The moon, a mirror, the waist, a blessing.',
      fingers: [
        { x: 118, len: 58, angle: -6, curve: 1 },
        { x: 136, len: 70, angle: 0, curve: 0 },
        { x: 154, len: 66, angle: 4, curve: -1 },
        { x: 170, len: 52, angle: 8, curve: -2 }
      ],
      thumb: 'side'
    },
    mayura: {
      name: 'Mayura',
      meaning: 'The peacock. Fingertips gathered, thumb extended like a beak.',
      use: 'A peacock, applying a tilak, holding a small object.',
      fingers: [
        { x: 118, len: 58, angle: 12, curve: 8 },
        { x: 136, len: 68, angle: 4, curve: 3 },
        { x: 154, len: 64, angle: -4, curve: -3 },
        { x: 170, len: 52, angle: -12, curve: -8 }
      ],
      thumb: 'side'
    },
    alapadma: {
      name: 'Alapadma',
      meaning: 'The fully opened lotus. Fingers fanned apart and gently curved.',
      use: 'A lotus, the sun, abundance, a full heart.',
      fingers: [
        { x: 118, len: 62, angle: -30, curve: -12 },
        { x: 136, len: 72, angle: -10, curve: -5 },
        { x: 154, len: 68, angle: 12, curve: 5 },
        { x: 170, len: 56, angle: 32, curve: 12 }
      ],
      thumb: 'side'
    },
    hamsasya: {
      name: 'Hamsasya',
      meaning: 'The swan’s beak. Index and thumb joined at the tips, the rest extended.',
      use: 'A swan, holding a thread, a delicate pinch, a blessing.',
      fingers: [
        { x: 118, len: 52, angle: -18, curve: -14, join: true },
        { x: 136, len: 72, angle: -2, curve: 0 },
        { x: 154, len: 68, angle: 4, curve: -1 },
        { x: 170, len: 54, angle: 9, curve: -2 }
      ],
      thumb: 'pinch'
    }
  };

  var TALAS = {
    ekatali: { label: 'Ekatali', beats: 4 },
    khemta: { label: 'Khemta', beats: 6 },
    tripata: { label: 'Tripata', beats: 7 },
    aditala: { label: 'Aditala', beats: 8 }
  };

  var RAGAS = {
    kalyani: 'Kalyani',
    bhairavi: 'Bhairavi',
    shankarabharanam: 'Shankarabharanam',
    malkauns: 'Malkauns',
    mohana: 'Mohana'
  };

  var mudraSel = document.getElementById('mudraSel');
  var handSvg = document.getElementById('handSvg');

  var handPath = function (f) {
    var bx = f.x;
    var by = 150;
    var a = (f.angle * Math.PI) / 180;
    var len = f.len;
    var tx = bx + Math.sin(a) * len + (f.curve || 0);
    var ty = by - Math.cos(a) * len;
    var cx1 = bx + Math.sin(a) * len * 0.15;
    var cy1 = by - len * 0.45;
    var cx2 = tx - (f.curve || 0) * 0.4;
    var cy2 = ty + len * 0.3;
    return {
      d: 'M' + bx + ' ' + by + 'C' + cx1.toFixed(1) + ' ' + cy1.toFixed(1) + ',' + cx2.toFixed(1) + ' ' + cy2.toFixed(1) + ',' + tx.toFixed(1) + ' ' + ty.toFixed(1),
      tx: tx,
      ty: ty
    };
  };

  var drawHand = function (m) {
    var data = MUDRAS[m] || MUDRAS.pataka;
    var parts = [];
    parts.push('<g fill="none" stroke-linecap="round" transform="translate(0 -26)">');

    data.fingers.forEach(function (f) {
      var p = handPath(f);
      parts.push('<path d="' + p.d + '" stroke="#8C5B3C" stroke-width="19"/>');
      parts.push('<path d="' + p.d + '" stroke="#C98A62" stroke-width="15"/>');
      if (f.bent) {
        parts.push('<circle cx="' + p.tx.toFixed(1) + '" cy="' + p.ty.toFixed(1) + '" r="7.5" fill="#C98A62" stroke="#8C5B3C" stroke-width="1.4"/>');
      }
      parts.push('<path d="' + p.d + '" stroke="#E2AE84" stroke-width="4" opacity=".45" transform="translate(-3 0)"/>');
    });

    /* palm */
    parts.push('<rect x="106" y="146" width="82" height="84" rx="26" fill="#C98A62" stroke="#8C5B3C" stroke-width="2"/>');
    parts.push('<path d="M120 186c8 10 20 16 34 16s26-6 34-16" fill="none" stroke="#A97051" stroke-width="1.4" opacity=".7"/>');
    parts.push('<path d="M122 166c6 4 12 4 18 2M160 168c6 2 12 2 18-2" fill="none" stroke="#A97051" stroke-width="1.2" opacity=".6"/>');

    if (data.thumb === 'folded') {
      parts.push('<path d="M108 214c14-2 30 8 36 22" fill="none" stroke="#8C5B3C" stroke-width="20"/>');
      parts.push('<path d="M108 214c14-2 30 8 36 22" fill="none" stroke="#C98A62" stroke-width="16"/>');
    } else if (data.thumb === 'pinch') {
      parts.push('<path d="M110 208c-10-14-12-34-2-44 8-8 20-4 22 6" fill="none" stroke="#8C5B3C" stroke-width="20"/>');
      parts.push('<path d="M110 208c-10-14-12-34-2-44 8-8 20-4 22 6" fill="none" stroke="#C98A62" stroke-width="16"/>');
      parts.push('<circle cx="130" cy="170" r="5" fill="#C98A62" stroke="#8C5B3C" stroke-width="1.2"/>');
    } else {
      parts.push('<path d="M108 206c-16-4-28-14-32-26" fill="none" stroke="#8C5B3C" stroke-width="21"/>');
      parts.push('<path d="M108 206c-16-4-28-14-32-26" fill="none" stroke="#C98A62" stroke-width="17"/>');
      parts.push('<circle cx="76" cy="180" r="8" fill="#C98A62" stroke="#8C5B3C" stroke-width="1.4"/>');
    }

    /* bangle and wrist */
    parts.push('<path d="M118 244c20 8 40 8 60 0" fill="none" stroke="#B98C36" stroke-width="8"/>');
    parts.push('<path d="M118 244c20 8 40 8 60 0" fill="none" stroke="#E3C071" stroke-width="3"/>');
    parts.push('<circle cx="128" cy="249" r="2.4" fill="#B03A2E"/><circle cx="148" cy="252" r="2.4" fill="#B03A2E"/><circle cx="168" cy="249" r="2.4" fill="#B03A2E"/>');
    parts.push('<path d="M150 256v38" stroke="#8C5B3C" stroke-width="28" stroke-linecap="round"/>');
    parts.push('<path d="M150 256v38" stroke="#C98A62" stroke-width="24" stroke-linecap="round"/>');
    parts.push('</g>');
    parts.push('<circle cx="150" cy="52" r="104" fill="none" stroke="#C39A45" stroke-opacity=".18" stroke-dasharray="1 6"/>');
    parts.push('<text x="150" y="292" text-anchor="middle" font-family="Marcellus, serif" font-size="12" letter-spacing="3" fill="#7A6A5B">' + data.name.toUpperCase() + '</text>');

    handSvg.innerHTML = parts.join('');
    handSvg.setAttribute('aria-label', 'Drawing of the ' + data.name + ' mudra: ' + data.meaning);
  };

  var renderPlan = function () {
    var m = MUDRAS[mudraSel.value];
    var tala = TALAS[document.getElementById('talaSel').value];
    var raga = RAGAS[document.getElementById('ragaSel').value];
    var bpm = parseInt(document.getElementById('tempoSel').value, 10);
    var length = parseInt(document.getElementById('lengthSel').value, 10);
    var tempoOut = document.getElementById('tempoOut');
    var lengthOut = document.getElementById('lengthOut');
    tempoOut.value = bpm + ' bpm';
    lengthOut.value = length + ' min';

    drawHand(mudraSel.value);

    document.getElementById('handName').textContent = m.name;
    document.getElementById('handMeaning').textContent = m.meaning;
    document.getElementById('handUse').textContent = 'Used for: ' + m.use;

    var cycles = Math.max(1, Math.round((length * bpm) / tala.beats));
    var beats = cycles * tala.beats;
    document.getElementById('planCycles').textContent = String(cycles);
    document.getElementById('planBeats').textContent = String(beats);

    var items = [
      { name: 'Mangalacharan', mins: 8, note: 'invocation' },
      { name: 'Pallavi · ' + raga, mins: length, note: m.name + ' opens' },
      { name: 'Abhinaya', mins: 11, note: 'Odia padam' },
      { name: 'Moksha', mins: 7, note: 'release' }
    ];
    document.getElementById('planItems').textContent = String(items.length);

    var clock = 0;
    var fmt = function (mins) { return String(mins).padStart(2, '0') + ':00'; };
    document.getElementById('setList').innerHTML = items.map(function (item) {
      var start = fmt(clock);
      clock += item.mins;
      return '<li><span class="t">' + start + '</span><span><strong>' + item.name + '</strong><br><small>' + item.note +
        '</small></span><small>' + item.mins + '′</small></li>';
    }).join('') + '<li><span class="t">' + fmt(clock) + '</span><span><strong>Mangala arati</strong><br><small>closing lamp</small></span><small>2′</small></li>';

    var note;
    if (length >= 20) {
      note = 'A ' + length + ' minute pallavi is a full statement, and the evening will run about ' + (clock + 2) +
        ' minutes. Keep the abhinaya short or the audience will be tired before Moksha.';
    } else if (length <= 8) {
      note = 'At ' + length + ' minutes the pallavi is a sketch. Useful for a festival slot, but the set will feel like a programme rather than an evening.';
    } else {
      note = 'The pallavi runs ' + cycles + ' avartanas of ' + tala.label + ' at ' + bpm + ' bpm, about ' +
        (length * 60) + ' seconds of pure nritta. The whole evening runs ' + (clock + 2) + ' minutes including the closing lamp.';
    }
    if (bpm > 100) note += ' At this tempo, check the jati with the mardala player before the first rehearsal.';
    document.getElementById('planNote').textContent = note;
  };

  var mudraForm = document.getElementById('mudraForm');
  if (mudraForm) {
    ['mudraSel', 'ragaSel', 'talaSel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', renderPlan);
    });
    ['tempoSel', 'lengthSel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', renderPlan);
    });
    mudraForm.addEventListener('submit', function (e) {
      e.preventDefault();
      renderPlan();
      var stage = document.querySelector('.hand-stage');
      if (stage) {
        stage.classList.remove('pulse');
        void stage.offsetWidth;
        stage.classList.add('pulse');
      }
    });
    var reset = document.getElementById('mReset');
    if (reset) reset.addEventListener('click', function () {
      mudraForm.reset();
      document.getElementById('tempoSel').value = '72';
      document.getElementById('lengthSel').value = '14';
      renderPlan();
    });
    renderPlan();
  }

  /* ----------------------------------------------------------- reveals --- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------- contact form --- */
  var form = document.getElementById('stageForm');
  if (form) {
    var success = document.getElementById('vSuccess');
    var rules = {
      vfName: function (v) { return v.trim().length >= 2; },
      vfEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      vfDate: function (v) { return v !== ''; },
      vfType: function (v) { return v !== ''; },
      vfMessage: function (v) { return v.trim().length >= 20; }
    };
    var check = function (id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var ok = rules[id](el.value);
      var wrap = el.closest('.f-field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var h = function () {
        var wrap = el.closest('.f-field');
        if (wrap && wrap.classList.contains('invalid')) check(id);
      };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (check(id) === false && !firstBad) firstBad = document.getElementById(id);
      });
      if (firstBad) {
        firstBad.focus();
        if (success) success.hidden = true;
        return;
      }
      if (success) {
        var nameEl = document.getElementById('vfName');
        var slot = document.getElementById('vSuccessName');
        if (slot) slot.textContent = nameEl && nameEl.value.trim() ? nameEl.value.trim().split(' ')[0] : 'friend';
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      form.reset();
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var wrap = el.closest('.f-field');
        if (wrap) wrap.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    });
  }
})();
