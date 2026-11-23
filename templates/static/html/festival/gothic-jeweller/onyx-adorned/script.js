/* ============================================================
   Onyx Adorned — the sigil bench. Silent: the jewel is the sound.
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

  /* ---------- stones, settings, motifs, metals ---------- */
  var STONES = {
    onyx: { label: 'onyx', size: '12 mm cabochon', base: 560, extra: 0, fill: '#14141a', edge: '#4a4a56', highlight: '#6a6a78', shape: 'round' },
    obsidian: { label: 'obsidian', size: '11 mm marquise', base: 590, extra: 1, fill: '#0b0b10', edge: '#6a6a78', highlight: '#8a8a98', shape: 'marquise' },
    garnet: { label: 'garnet', size: '10 mm briolette', base: 640, extra: 1, fill: '#5c0d16', edge: '#c04050', highlight: '#d4666f', shape: 'briolette' },
    moonstone: { label: 'moonstone', size: '12 mm oval cabochon', base: 610, extra: 0, fill: '#c9cdd4', edge: '#eef0f4', highlight: '#ffffff', shape: 'oval' }
  };
  var SETTINGS = {
    claw: { label: 'four-claw', add: 90, lead: 2, note: 'The claws are filed from the shank, not soldered on. It sits higher and catches on knitwear; I tell everyone that before they choose it.' },
    bezel: { label: 'rub-over bezel', add: 40, lead: 1, note: 'The bezel is raised 4 mm so the stone sits above the finger rather than in it. It protects the edge and dulls the sparkle, deliberately.' },
    cathedral: { label: 'cathedral', add: 180, lead: 3, note: 'Two shoulders rise to meet the setting like the piers of an arch. It is the heaviest thing on this bench and the most comfortable to wear all day.' }
  };
  var MOTIFS = {
    thorn: { name: 'Thorn', add: 20, sub: 'A small, weighted pendant for a private grief.', note: 'The thorn is cast from a hawthorn from the Water of Leith, cut in 2018.' },
    serpent: { name: 'Serpent', add: 90, sub: 'A ring for a promise you have already broken once.', note: 'The serpent is modelled on a grass snake, not a viper; the head is blunt and the scales are cut with a scorper.' },
    rose: { name: 'Rose', add: 140, sub: 'A closed bud, for a love that is not for display.', note: 'The rose is built from nine overlapping petals in three layers, each one annealed and pressed by hand.' },
    bat: { name: 'Bat', add: 70, sub: 'A small night thing, wings folded, worn at the throat.', note: 'The bat is cut from sheet and domed with a punch; the wing bones are engraved, not cast.' }
  };
  var METALS = {
    silver: { label: 'blackened silver', mult: 1, lead: 0, color: '#d9d6cf', dark: '#8e8c85', fill: '#3a3a44' },
    gold: { label: 'pale 18ct gold', mult: 2.3, lead: 2, color: '#e2cd94', dark: '#a88c52', fill: '#5a4a2a' },
    bronze: { label: 'bronze', mult: 0.75, lead: 0, color: '#c08a5c', dark: '#7c5734', fill: '#4a3524' }
  };

  var state = { stone: 'onyx', setting: 'bezel', motif: 'thorn', metal: 'silver' };
  var svg = document.getElementById('sigil-svg');
  var nameEl = document.getElementById('sigil-name');
  var subEl = document.getElementById('sigil-sub');
  var metalEl = document.getElementById('spec-metal');
  var stoneEl = document.getElementById('spec-stone');
  var settingEl = document.getElementById('spec-setting');
  var priceEl = document.getElementById('spec-price');
  var leadEl = document.getElementById('spec-lead');
  var noteEl = document.getElementById('sigil-note');
  var footEl = document.getElementById('plate-foot');

  function make(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function stoneShape(s, cx, cy) {
    if (s.shape === 'round') return make('circle', { cx: cx, cy: cy, r: 56, fill: s.fill, stroke: s.edge, 'stroke-width': '1.4' });
    if (s.shape === 'oval') return make('ellipse', { cx: cx, cy: cy, rx: 62, ry: 48, fill: s.fill, stroke: s.edge, 'stroke-width': '1.4' });
    if (s.shape === 'marquise') return make('polygon', { points: cx + ',166 ' + (cx + 50) + ',' + cy + ' ' + cx + ',' + (cy + 96) + ' ' + (cx - 50) + ',' + cy, fill: s.fill, stroke: s.edge, 'stroke-width': '1.4' });
    return make('polygon', { points: (cx - 44) + ',' + (cy - 40) + ' ' + (cx + 40) + ',' + (cy - 52) + ' ' + (cx + 54) + ',' + (cy + 30) + ' ' + cx + ',' + (cy + 66) + ' ' + (cx - 50) + ',' + (cy + 24), fill: s.fill, stroke: s.edge, 'stroke-width': '1.4' });
  }

  function draw() {
    if (!svg) return;
    var s = STONES[state.stone];
    var set = SETTINGS[state.setting];
    var m = METALS[state.metal];
    var mot = MOTIFS[state.motif];
    svg.innerHTML = '';
    svg.setAttribute('aria-label', 'Drawing of the ' + mot.name + ': ' + s.label + ' in ' + set.label + ' ' + m.label + '.');

    var defs = make('defs', {});
    var grad = make('radialGradient', { id: 'stone-grad', cx: '36%', cy: '28%', r: '74%' });
    grad.appendChild(make('stop', { offset: '0', 'stop-color': s.highlight }));
    grad.appendChild(make('stop', { offset: '0.45', 'stop-color': s.fill }));
    grad.appendChild(make('stop', { offset: '1', 'stop-color': '#050507' }));
    defs.appendChild(grad);
    var metalGrad = make('linearGradient', { id: 'metal-grad', x1: '0', y1: '0', x2: '1', y2: '1' });
    metalGrad.appendChild(make('stop', { offset: '0', 'stop-color': m.color }));
    metalGrad.appendChild(make('stop', { offset: '0.5', 'stop-color': m.dark }));
    metalGrad.appendChild(make('stop', { offset: '0.72', 'stop-color': m.color }));
    metalGrad.appendChild(make('stop', { offset: '1', 'stop-color': m.dark }));
    defs.appendChild(metalGrad);
    svg.appendChild(defs);

    svg.appendChild(make('rect', { x: '0', y: '0', width: '460', height: '460', fill: '#0b0b0f' }));
    svg.appendChild(make('rect', { x: '26', y: '26', width: '408', height: '408', fill: 'none', stroke: '#22222a', 'stroke-width': '1' }));
    svg.appendChild(make('rect', { x: '38', y: '38', width: '384', height: '384', fill: 'none', stroke: '#191920', 'stroke-width': '1' }));

    var cx = 230, cy = 220;

    // chain and bail
    svg.appendChild(make('path', { d: 'M150 44 C190 70 270 70 310 44', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '2.4' }));
    svg.appendChild(make('circle', { cx: cx, cy: 92, r: 13, fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3' }));
    svg.appendChild(make('circle', { cx: cx, cy: 92, r: 17, fill: 'none', stroke: m.dark, 'stroke-width': '0.8', opacity: '0.7' }));

    // setting frame by type
    if (state.setting === 'bezel') {
      svg.appendChild(make('circle', { cx: cx, cy: cy, r: 68, fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '11' }));
      svg.appendChild(make('circle', { cx: cx, cy: cy, r: 74, fill: 'none', stroke: m.dark, 'stroke-width': '1' }));
      svg.appendChild(make('circle', { cx: cx, cy: cy, r: 61, fill: 'none', stroke: m.dark, 'stroke-width': '1' }));
      svg.appendChild(make('path', { d: 'M162 220 C170 196 196 180 220 178', fill: 'none', stroke: m.color, 'stroke-width': '1.6', opacity: '0.8' }));
    } else if (state.setting === 'claw') {
      svg.appendChild(make('circle', { cx: cx, cy: cy, r: 66, fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '4' }));
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (v) {
        var x1 = cx + v[0] * 62, y1 = cy + v[1] * 62;
        var x2 = cx + v[0] * 78, y2 = cy + v[1] * 78;
        svg.appendChild(make('path', { d: 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, stroke: 'url(#metal-grad)', 'stroke-width': '9', 'stroke-linecap': 'round' }));
        svg.appendChild(make('circle', { cx: x2, cy: y2, r: 5, fill: m.color }));
      });
      svg.appendChild(make('path', { d: 'M170 264 C190 286 270 286 290 264', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3' }));
    } else {
      svg.appendChild(make('path', { d: 'M230 108 L316 166 L316 286 L230 350 L144 286 L144 166 Z', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '8' }));
      svg.appendChild(make('path', { d: 'M230 128 L298 176 L298 278 L230 332 L162 278 L162 176 Z', fill: 'none', stroke: m.dark, 'stroke-width': '1' }));
      svg.appendChild(make('path', { d: 'M144 166 L120 150 M316 166 L340 150 M144 286 L120 306 M316 286 L340 306', stroke: 'url(#metal-grad)', 'stroke-width': '4' }));
    }

    // stone
    var shape = stoneShape(s, cx, cy);
    shape.setAttribute('fill', 'url(#stone-grad)');
    svg.appendChild(shape);
    svg.appendChild(make('path', { d: 'M' + (cx - 30) + ' ' + (cy - 24) + ' C' + (cx - 6) + ' ' + (cy - 38) + ' ' + (cx + 22) + ' ' + (cy - 30) + ' ' + (cx + 34) + ' ' + (cy - 12), fill: 'none', stroke: s.highlight, 'stroke-width': '2', opacity: '0.5' }));

    // motif
    if (state.motif === 'thorn') {
      [[148, 168, 132, 146], [312, 168, 328, 146], [152, 272, 132, 294], [308, 272, 328, 294]].forEach(function (p) {
        svg.appendChild(make('path', { d: 'M' + p[0] + ' ' + p[1] + ' C' + (p[0] - 6) + ' ' + ((p[1] + p[3]) / 2) + ' ' + ((p[0] + p[2]) / 2) + ' ' + p[3] + ' ' + p[2] + ' ' + p[3], fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '2.4', 'stroke-linecap': 'round' }));
        svg.appendChild(make('circle', { cx: p[2], cy: p[3], r: 2.4, fill: '#7a1220' }));
      });
      svg.appendChild(make('path', { d: 'M230 350 L230 384', stroke: 'url(#metal-grad)', 'stroke-width': '2' }));
    } else if (state.motif === 'serpent') {
      svg.appendChild(make('path', { d: 'M120 316 C170 300 176 268 214 260 C252 252 268 286 300 280 C330 274 338 246 322 232', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '7', 'stroke-linecap': 'round' }));
      svg.appendChild(make('path', { d: 'M120 316 C170 300 176 268 214 260 C252 252 268 286 300 280 C330 274 338 246 322 232', fill: 'none', stroke: m.dark, 'stroke-width': '1', 'stroke-dasharray': '2 4' }));
      svg.appendChild(make('circle', { cx: '322', cy: '230', r: '7', fill: m.color }));
      svg.appendChild(make('circle', { cx: '324', cy: '228', r: '1.8', fill: '#7a1220' }));
      svg.appendChild(make('path', { d: 'M318 224 L328 224 M320 218 L326 218', stroke: m.color, 'stroke-width': '1.4' }));
    } else if (state.motif === 'rose') {
      svg.appendChild(make('path', { d: 'M230 340 C196 324 186 292 202 268 C218 244 254 240 272 258 C290 276 284 306 264 318 C248 328 228 320 224 304 C220 288 236 276 248 282', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3' }));
      svg.appendChild(make('path', { d: 'M198 330 C186 338 180 352 184 362 M262 330 C274 338 280 352 276 362', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3' }));
      svg.appendChild(make('path', { d: 'M230 268 C238 274 240 286 232 292', fill: 'none', stroke: m.dark, 'stroke-width': '1.2' }));
    } else {
      svg.appendChild(make('path', { d: 'M230 300 C214 284 190 268 168 262 C152 258 142 264 146 276 C150 288 168 296 186 302 C170 306 156 316 158 328 C160 340 176 342 192 334 C208 326 222 312 230 300', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3', 'stroke-linejoin': 'round' }));
      svg.appendChild(make('path', { d: 'M230 300 C246 284 270 268 292 262 C308 258 318 264 314 276 C310 288 292 296 274 302 C290 306 304 316 302 328 C300 340 284 342 268 334 C252 326 238 312 230 300', fill: 'none', stroke: 'url(#metal-grad)', 'stroke-width': '3', 'stroke-linejoin': 'round' }));
      svg.appendChild(make('path', { d: 'M216 272 L222 282 M244 272 L238 282 M214 316 L224 310 M246 316 L236 310', stroke: m.dark, 'stroke-width': '1.2' }));
      svg.appendChild(make('circle', { cx: '230', cy: '300', r: '5', fill: m.color }));
    }

    // hallmark marks
    svg.appendChild(make('path', { d: 'M352 384 h22 M352 392 h14 M382 384 h10 v8 h-10 z', stroke: m.dark, 'stroke-width': '1', fill: 'none', opacity: '0.8' }));

    var label = make('text', { x: '26', y: '446', fill: '#6f6d66', 'font-family': 'Jost, sans-serif', 'font-size': '7', 'letter-spacing': '2.4' });
    label.textContent = 'PLATE ' + (mot.name.charAt(0)) + ' · ' + s.label.toUpperCase() + ' · ' + set.label.toUpperCase();
    svg.appendChild(label);
  }

  function priceOf() {
    var s = STONES[state.stone];
    var set = SETTINGS[state.setting];
    var mot = MOTIFS[state.motif];
    var m = METALS[state.metal];
    return Math.round(((s.base + set.add + mot.add) * m.mult) / 5) * 5;
  }

  function paint() {
    var s = STONES[state.stone];
    var set = SETTINGS[state.setting];
    var mot = MOTIFS[state.motif];
    var m = METALS[state.metal];
    if (nameEl) nameEl.textContent = 'The ' + mot.name + ', with ' + s.label;
    if (subEl) subEl.textContent = mot.sub;
    if (metalEl) metalEl.textContent = m.label;
    if (stoneEl) stoneEl.textContent = s.label + ' · ' + s.size;
    if (settingEl) settingEl.textContent = set.label;
    if (priceEl) priceEl.textContent = '£' + priceOf().toLocaleString('en-GB');
    if (leadEl) leadEl.textContent = (5 + set.lead + s.extra + m.lead) + ' weeks';
    if (noteEl) noteEl.textContent = set.note + ' ' + mot.note;
    if (footEl) footEl.textContent = 'Fig. ' + mot.name.charAt(0) + ' · ' + s.label + ' · ' + set.label + ' · ' + m.label;
    draw();
  }

  ['stone', 'setting', 'motif', 'metal'].forEach(function (kind) {
    Array.prototype.slice.call(document.querySelectorAll('.' + kind)).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-' + kind);
        if (!value) return;
        state[kind] = value;
        document.querySelectorAll('.' + kind).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle(kind === 'stone' ? 'is-active' : 'is-set', on);
          b.setAttribute('aria-pressed', String(on));
        });
        paint();
      });
    });
  });

  if (svg) paint();

  /* ---------- cabinet filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var cabs = Array.prototype.slice.call(document.querySelectorAll('.cab'));
  if (filterBtns.length && cabs.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
        cabs.forEach(function (c) { c.hidden = kind !== 'all' && c.getAttribute('data-type') !== kind; });
      });
    });
  }

  /* ---------- bespoke form ---------- */
  var form = document.getElementById('bespoke-form');
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
    ['y-name', 'y-email', 'y-date', 'y-type', 'y-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var clear = function () { if (el.getAttribute('aria-invalid') === 'true') setError(id, ''); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
    var agree = document.getElementById('y-agree');
    if (agree) agree.addEventListener('change', function () {
      var err = document.querySelector('.err[data-for="y-agree"]');
      if (err && agree.checked) err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('y-name');
      var email = document.getElementById('y-email');
      var date = document.getElementById('y-date');
      var type = document.getElementById('y-type');
      var note = document.getElementById('y-note');
      var problems = [];
      ['y-name', 'y-email', 'y-date', 'y-type', 'y-note'].forEach(function (id) { setError(id, ''); });
      var agreeErr = document.querySelector('.err[data-for="y-agree"]');
      if (agreeErr) agreeErr.textContent = '';

      if (!name.value.trim()) { setError('y-name', 'A name for the card, or an initial.'); problems.push(name); }
      if (!email.value.trim()) { setError('y-email', 'An address for the drawing and the appointment.'); problems.push(email); }
      else if (!validEmail(email.value.trim())) { setError('y-email', 'That address looks incomplete.'); problems.push(email); }
      if (!date.value) { setError('y-date', 'When would you like it, even roughly?'); problems.push(date); }
      else {
        var d = new Date(date.value + 'T12:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) { setError('y-date', 'That date cannot be read.'); problems.push(date); }
        else if (d < today) { setError('y-date', 'Please choose a date still ahead.'); problems.push(date); }
      }
      if (!type.value) { setError('y-type', 'What kind of piece?'); problems.push(type); }
      if (note.value.trim().length < 12) { setError('y-note', 'A sentence about the piece is enough to begin.'); problems.push(note); }
      if (!agree.checked) { if (agreeErr) agreeErr.textContent = 'Please confirm you have read the note.'; problems.push(agree); }

      if (problems.length) { problems[0].focus(); return; }

      var chosen = type.options[type.selectedIndex].textContent;
      var readable = new Date(date.value + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (sentDetail) {
        sentDetail.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note about ' + chosen + ', wanted for ' + readable + ', is on the bench list. Mira writes to ' + email.value.trim() + ' with a first drawing or with a straight refusal, within a week.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
    });
  }
})();
