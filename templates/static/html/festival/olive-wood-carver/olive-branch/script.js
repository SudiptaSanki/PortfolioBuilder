/* ============================================================
   Olive Branch — the drawing bench. No sound, no libraries.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('nav-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- pieces ---------- */
  var FORMS = {
    bowl: {
      label: 'bowl', sub: 'Serves nuts, oil, or nothing at all.', base: 48, per: 6.2,
      timber: function (s) { return Math.round(s * s * 3.4) + ' g'; },
      note: 'Turned from a pruned limb and dried in sawdust for five years. The rim is left a little thick so it can take hot oil; the foot is cut by hand, not turned.'
    },
    board: {
      label: 'board', sub: 'For bread, or for a wall that needs one honest thing on it.', base: 40, per: 4.4,
      timber: function (s) { return Math.round(s * s * 1.5) + ' g'; },
      note: 'Cut along the trunk axis so the grain runs the length of the board. It will take knife marks and a monthly rub of oil; it should never go in a dishwasher.'
    },
    pendant: {
      label: 'pendant', sub: 'A small piece of a very old tree, worn at the throat.', base: 18, per: 0.9,
      timber: function (s) { return Math.max(4, Math.round(s * 1.7)) + ' g'; },
      note: 'Cut from a burl offcut, stabilised from the back and finished on the face only. The cord is waxed cotton; the bail is silver, made two streets away.'
    },
    spoon: {
      label: 'spoon', sub: 'One piece, no glue, sized for a hand.', base: 22, per: 1.6,
      timber: function (s) { return Math.round(s * 9) + ' g'; },
      note: 'Carved with an axe and a hook knife from a straight-grained limb. The bowl is thin enough to feel the food through it; that is the whole point of an olive spoon.'
    },
    mortar: {
      label: 'mortar', sub: 'Heavy enough to stay put while you work.', base: 70, per: 5.4,
      timber: function (s) { return Math.round(s * s * 6.2) + ' g'; },
      note: 'Hollowed from a single block with a gouge, with no lamination and no insert. It weighs what it weighs; the pestle is cut from the same trunk and matched to the bowl.'
    },
    mezuzah: {
      label: 'mezuzah', sub: 'A case for a scroll, cut from a branch.', base: 26, per: 1.3,
      timber: function (s) { return Math.max(8, Math.round(s * 4.4)) + ' g'; },
      note: 'Hollowed from a single piece so the scroll sits dry. The opening is cut to take a standard 10 cm klaf; the scroll itself is supplied by your sofer, not by me.'
    }
  };
  var GRAINS = {
    straight: { label: 'straight', mult: 1, dry: 'cut with the trunk, calm and pale', bug: '' },
    figured: { label: 'figured', mult: 1.3, dry: 'cut from the crotch, banded and restless', bug: 'Figured wood moves more in the first winter; I cut it 6 mm oversize.' },
    burl: { label: 'burl', mult: 1.55, dry: 'cut from a bud burl, no two alike', bug: 'A burl yields one piece, not a set. If you need two matching, say so now; it may not be possible.' }
  };
  var FINISHES = {
    raw: { label: 'raw', add: 0, days: 3, dry: 'raw · 3 days to stabilise' },
    oil: { label: 'oil', add: 12, days: 21, dry: 'oil · 21 days to cure' },
    wax: { label: 'wax', add: 9, days: 14, dry: 'wax · 14 days to cure' }
  };

  var state = { blank: 'bowl', grain: 'straight', finish: 'oil', size: 20 };
  var svg = document.getElementById('piece-svg');
  var nameEl = document.getElementById('piece-name');
  var subEl = document.getElementById('piece-sub');
  var timberEl = document.getElementById('timber');
  var dryEl = document.getElementById('dry');
  var leadEl = document.getElementById('lead');
  var priceEl = document.getElementById('price');
  var noteEl = document.getElementById('atelier-note');
  var stampEl = document.getElementById('plate-stamp');
  var sizeOut = document.getElementById('size-out');
  var sizeNote = document.getElementById('size-note');
  var range = document.getElementById('diameter');

  function make(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function shapePath(form) {
    switch (form) {
      case 'bowl':
        return 'M112 120 C116 214 166 286 260 286 C354 286 404 214 408 120 Z';
      case 'board':
        return 'M96 168 C150 150 350 150 424 166 C438 168 440 190 428 200 C360 236 170 236 92 202 C82 196 82 174 96 168 Z';
      case 'pendant':
        return 'M260 84 C286 118 330 168 330 212 C330 262 300 292 260 292 C220 292 190 262 190 212 C190 168 234 118 260 84 Z';
      case 'spoon':
        return 'M150 168 C150 140 190 124 226 128 C262 132 282 158 278 186 C274 218 240 236 206 230 C172 224 150 200 150 168 Z M262 208 C300 224 330 250 356 284 C362 292 352 302 344 296 C318 272 292 252 258 242 Z';
      case 'mortar':
        return 'M120 150 C124 240 176 300 260 300 C344 300 396 240 400 150 Z';
      case 'mezuzah':
        return 'M230 66 C230 52 244 42 260 42 C276 42 290 52 290 66 L290 340 C290 352 276 360 260 360 C244 360 230 352 230 340 Z';
      default:
        return 'M120 120 L400 120 L400 300 L120 300 Z';
    }
  }

  function detailPaths(form) {
    var d = [];
    if (form === 'bowl') {
      d.push('M100 120 C104 126 416 126 420 120');
      d.push('M112 120 C210 136 310 136 408 120');
      d.push('M176 286 C210 296 310 296 344 286');
      d.push('M210 120 C214 160 214 200 216 232');
    } else if (form === 'board') {
      d.push('M110 184 C190 170 330 170 412 182');
      d.push('M104 204 C188 216 336 216 416 202');
      d.push('M120 250 L150 250 M170 250 L200 250');
    } else if (form === 'pendant') {
      d.push('M260 84 C252 104 244 120 238 136');
      d.push('M226 236 C246 250 274 250 294 236');
      d.push('M260 96 L260 118');
      d.push('M252 104 C248 116 248 128 252 140');
    } else if (form === 'spoon') {
      d.push('M150 168 C164 146 196 136 226 140');
      d.push('M160 196 C176 216 210 226 240 218');
      d.push('M286 224 C316 246 340 272 354 292');
    } else if (form === 'mortar') {
      d.push('M108 150 C160 164 360 164 412 150');
      d.push('M120 150 C210 166 310 166 400 150');
      d.push('M180 300 C220 310 300 310 340 300');
      d.push('M200 150 C204 200 206 250 208 286');
    } else {
      d.push('M230 84 C246 96 274 96 290 84');
      d.push('M230 330 C246 342 274 342 290 330');
      d.push('M252 120 C244 180 244 260 252 320');
      d.push('M282 120 C290 180 290 260 282 320');
    }
    return d;
  }

  function draw() {
    if (!svg) return;
    var form = state.blank;
    var grain = GRAINS[state.grain];
    svg.innerHTML = '';
    svg.setAttribute('aria-label', 'Drawing of an olive wood ' + FORMS[form].label + ' with ' + grain.label + ' grain.');

    var defs = make('defs', {});
    var grad = make('linearGradient', { id: 'wood-fill', x1: '0', y1: '0', x2: '0.6', y2: '1' });
    grad.appendChild(make('stop', { offset: '0', 'stop-color': '#e2cbab' }));
    grad.appendChild(make('stop', { offset: '0.55', 'stop-color': '#d3b992' }));
    grad.appendChild(make('stop', { offset: '1', 'stop-color': '#c0a37c' }));
    defs.appendChild(grad);

    var clip = make('clipPath', { id: 'piece-clip' });
    var clipPath = make('path', { d: shapePath(form) });
    clip.appendChild(clipPath);
    defs.appendChild(clip);
    svg.appendChild(defs);

    svg.appendChild(make('rect', { x: '0', y: '0', width: '520', height: '420', fill: '#efe6d5' }));

    // faint bench grid
    for (var gx = 20; gx < 520; gx += 40) {
      svg.appendChild(make('path', { d: 'M' + gx + ' 12 V408', stroke: '#e0d3bf', 'stroke-width': '0.6' }));
    }
    for (var gy = 20; gy < 420; gy += 40) {
      svg.appendChild(make('path', { d: 'M12 ' + gy + ' H508', stroke: '#e0d3bf', 'stroke-width': '0.6' }));
    }

    var shape = make('path', { d: shapePath(form), fill: 'url(#wood-fill)', stroke: '#4b3524', 'stroke-width': '1.6', 'stroke-linejoin': 'round' });
    svg.appendChild(shape);

    var grainGroup = make('g', { 'clip-path': 'url(#piece-clip)' });
    var lines = state.grain === 'straight' ? 13 : state.grain === 'figured' ? 16 : 18;
    for (var i = 0; i < lines; i++) {
      var y = 70 + i * (280 / lines);
      var amp = state.grain === 'straight' ? 3 : state.grain === 'figured' ? 9 : 14;
      var phase = state.grain === 'burl' ? i * 1.7 : i * 0.9;
      var d = 'M90 ' + y.toFixed(1);
      for (var x = 90; x <= 430; x += 20) {
        var yy = y + Math.sin((x / 40) + phase) * amp + Math.sin(x / 13 + i) * (amp / 3);
        d += ' L' + x + ' ' + yy.toFixed(1);
      }
      grainGroup.appendChild(make('path', {
        d: d,
        fill: 'none',
        stroke: '#a07f56',
        'stroke-width': state.grain === 'burl' ? '0.7' : '0.9',
        opacity: String(0.28 + (i % 3) * 0.08)
      }));
    }
    if (state.grain === 'burl') {
      for (var b = 0; b < 6; b++) {
        var cx = 170 + (b % 3) * 70, cy = 150 + Math.floor(b / 3) * 80, r = 12 + (b % 4) * 5;
        grainGroup.appendChild(make('path', {
          d: 'M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + (r * 0.7) + ' 0 1 0 ' + (2 * r) + ' 0 a' + r + ' ' + (r * 0.7) + ' 0 1 0 ' + (-2 * r) + ' 0',
          fill: 'none', stroke: '#8b6b4a', 'stroke-width': '0.9', opacity: '0.5'
        }));
      }
    }
    svg.appendChild(grainGroup);

    detailPaths(form).forEach(function (p) {
      svg.appendChild(make('path', { d: p, fill: 'none', stroke: '#6d5238', 'stroke-width': '1.1', opacity: '0.8', 'stroke-linecap': 'round' }));
    });

    // dimension rule
    var dim = make('g', { opacity: '0.8' });
    dim.appendChild(make('path', { d: 'M96 372 H424', stroke: '#4a5a3a', 'stroke-width': '0.8' }));
    dim.appendChild(make('path', { d: 'M96 366 V378 M424 366 V378', stroke: '#4a5a3a', 'stroke-width': '0.8' }));
    var dimText = make('text', {
      x: '260', y: '390', 'text-anchor': 'middle', 'font-family': 'Instrument Sans, sans-serif',
      'font-size': '10', 'letter-spacing': '2', fill: '#4a5a3a'
    });
    dimText.textContent = state.size + ' cm';
    dim.appendChild(dimText);
    svg.appendChild(dim);

    var stamp = make('text', {
      x: '18', y: '28', 'font-family': 'Instrument Sans, sans-serif', 'font-size': '8',
      'letter-spacing': '2.2', fill: '#7a6b58'
    });
    stamp.textContent = 'BENCH DRAWING · ' + grain.label.toUpperCase() + ' GRAIN';
    svg.appendChild(stamp);
  }

  function priceOf() {
    var f = FORMS[state.blank];
    var g = GRAINS[state.grain];
    var fin = FINISHES[state.finish];
    var raw = f.base + f.per * state.size;
    var total = (raw * g.mult + fin.add) * (state.blank === 'pendant' ? 1 + (state.size - 8) * 0.02 : 1);
    return Math.max(16, Math.round(total / 2) * 2);
  }

  function paint() {
    var f = FORMS[state.blank];
    var g = GRAINS[state.grain];
    var fin = FINISHES[state.finish];
    if (nameEl) nameEl.textContent = 'Olive ' + f.label + ', ' + state.size + ' cm';
    if (subEl) subEl.textContent = f.sub;
    if (timberEl) timberEl.textContent = f.timber(state.size);
    if (dryEl) dryEl.textContent = fin.dry;
    if (leadEl) leadEl.textContent = (4 + Math.ceil(state.size / 12) + (state.grain === 'burl' ? 2 : 0)) + ' weeks';
    if (priceEl) priceEl.textContent = '$' + priceOf();
    if (noteEl) noteEl.textContent = f.note + ' ' + g.bug;
    if (stampEl) stampEl.textContent = 'Blank ' + ('00' + (1 + Object.keys(FORMS).indexOf(state.blank))) .slice(-3) + ' · olive · ' + g.dry;
    if (sizeOut) sizeOut.textContent = state.size + ' cm';
    if (sizeNote) {
      sizeNote.textContent = state.blank === 'board' ? 'Length of the board, in centimetres.'
        : state.blank === 'pendant' ? 'Height of the pendant, including the bail.'
        : state.blank === 'mezuzah' ? 'Height of the case, in centimetres.'
        : 'Diameter at the widest point of the blank.';
    }
    draw();
  }

  Array.prototype.slice.call(document.querySelectorAll('.blank')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.blank = btn.getAttribute('data-blank');
      document.querySelectorAll('.blank').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('.grain')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.grain = btn.getAttribute('data-grain');
      document.querySelectorAll('.grain').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-set', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('.finish')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.finish = btn.getAttribute('data-finish');
      document.querySelectorAll('.finish').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-set', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });
  if (range) {
    range.addEventListener('input', function () {
      state.size = Number(range.value);
      paint();
    });
  }

  if (svg) paint();

  /* ---------- catalogue filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var pieces = Array.prototype.slice.call(document.querySelectorAll('.piece'));
  if (filterBtns.length && pieces.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
        pieces.forEach(function (p) { p.hidden = kind !== 'all' && p.getAttribute('data-type') !== kind; });
      });
    });
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commission-form');
  var sent = document.getElementById('sent');
  var sentDetail = document.getElementById('sent-detail');

  function setError(id, message) {
    var err = document.querySelector('.err[data-for="' + id + '"]');
    var input = document.getElementById(id);
    if (err) err.textContent = message || '';
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      var field = input.closest('.field');
      if (field) field.classList.toggle('has-error', Boolean(message));
    }
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  if (form) {
    ['o-name', 'o-email', 'o-date', 'o-type', 'o-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var clear = function () { if (el.getAttribute('aria-invalid') === 'true') setError(id, ''); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
    var agree = document.getElementById('o-agree');
    if (agree) agree.addEventListener('change', function () {
      var err = document.querySelector('.err[data-for="o-agree"]');
      if (err && agree.checked) err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('o-name');
      var email = document.getElementById('o-email');
      var date = document.getElementById('o-date');
      var type = document.getElementById('o-type');
      var note = document.getElementById('o-note');
      var problems = [];
      ['o-name', 'o-email', 'o-date', 'o-type', 'o-note'].forEach(function (id) { setError(id, ''); });
      var agreeErr = document.querySelector('.err[data-for="o-agree"]');
      if (agreeErr) agreeErr.textContent = '';

      if (!name.value.trim()) { setError('o-name', 'Whose name should go on the bench card?'); problems.push(name); }
      if (!email.value.trim()) { setError('o-email', 'An email address, for the drawing and the quote.'); problems.push(email); }
      else if (!validEmail(email.value.trim())) { setError('o-email', 'That address looks incomplete.'); problems.push(email); }
      if (!date.value) { setError('o-date', 'When would you like it delivered, even roughly?'); problems.push(date); }
      else {
        var d = new Date(date.value + 'T12:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) { setError('o-date', 'That date cannot be read.'); problems.push(date); }
        else if (d < today) { setError('o-date', 'Please choose a date still ahead.'); problems.push(date); }
      }
      if (!type.value) { setError('o-type', 'What kind of piece?'); problems.push(type); }
      if (note.value.trim().length < 12) { setError('o-note', 'A sentence about the piece, the wood and the person.'); problems.push(note); }
      if (!agree.checked) { if (agreeErr) agreeErr.textContent = 'Please confirm you have read the note about wood and time.'; problems.push(agree); }

      if (problems.length) { problems[0].focus(); return; }

      var chosen = type.options[type.selectedIndex].textContent;
      var readable = new Date(date.value + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (sentDetail) {
        sentDetail.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note about ' + chosen + ' for ' + readable + ' is on the bench. Yusuf replies to ' + email.value.trim() + ' with a drawing or an honest refusal, usually within a week.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
    });
  }
})();
