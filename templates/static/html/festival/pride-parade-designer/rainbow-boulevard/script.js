/* Rainbow Boulevard — float desk, route logic and drawing.
   No libraries. The elevation is generated as SVG from metres, to scale. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- ticker: duplicate the track so the loop is seamless ---------- */
  var track = document.querySelector('.ticker__track');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.card, .sheet__row, .steps li, .float, .voice blockquote');
  if ('IntersectionObserver' in window) {
    revealables.forEach(function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- projects filter ---------- */
  var chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    var items = document.querySelectorAll('#float-list [data-type]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(items, function (it) {
          it.hidden = want !== 'all' && it.getAttribute('data-type') !== want;
        });
      });
    });
  }

  /* ---------- brief form ---------- */
  var brief = document.getElementById('brief-form');
  if (brief) {
    var sent = document.getElementById('sent');
    var sentList = document.getElementById('sent-list');

    function setErr(key, msg, field) {
      var e = document.getElementById('e-' + key);
      if (e) e.textContent = msg || '';
      if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    function value(id) {
      var f = document.getElementById(id);
      return f ? f.value.trim() : '';
    }

    brief.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errs = 0;
      var name = value('p-name'), email = value('p-email'), date = value('p-date');
      var city = value('p-city'), type = value('p-type'), budget = value('p-budget');
      var group = value('p-group'), message = value('p-message');
      var agree = document.getElementById('p-agree').checked;

      if (name.length < 2) { setErr('name', 'Please give a name I can answer to.', document.getElementById('p-name')); errs++; }
      else setErr('name', '', document.getElementById('p-name'));

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setErr('email', 'That email address does not look complete.', document.getElementById('p-email')); errs++; }
      else setErr('email', '', document.getElementById('p-email'));

      if (!date) { setErr('date', 'A date, even an approximate one.', document.getElementById('p-date')); errs++; }
      else setErr('date', '', document.getElementById('p-date'));

      if (city.length < 2) { setErr('city', 'Which city is the march in?', document.getElementById('p-city')); errs++; }
      else setErr('city', '', document.getElementById('p-city'));

      if (!type) { setErr('type', 'Choose the closest thing.', document.getElementById('p-type')); errs++; }
      else setErr('type', '', document.getElementById('p-type'));

      if (!budget) { setErr('budget', 'A band is enough; it does not need to be exact.', document.getElementById('p-budget')); errs++; }
      else setErr('budget', '', document.getElementById('p-budget'));

      if (!group || Number(group) < 1) { setErr('group', 'Roughly how many people march with it?', document.getElementById('p-group')); errs++; }
      else setErr('group', '', document.getElementById('p-group'));

      if (message.length < 20) { setErr('message', 'Twenty characters at least — the route and the constraint are the useful part.', document.getElementById('p-message')); errs++; }
      else setErr('message', '', document.getElementById('p-message'));

      if (!agree) { setErr('agree', 'Please confirm before sending.', null); errs++; }
      else setErr('agree', '');

      if (errs > 0) {
        var first = brief.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }

      var typeLabel = document.getElementById('p-type');
      var budgetLabel = document.getElementById('p-budget');
      sentList.innerHTML =
        '<dt>Name</dt><dd>' + name.replace(/[<>]/g, '') + '</dd>' +
        '<dt>March</dt><dd>' + date + ' · ' + city.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Build</dt><dd>' + typeLabel.options[typeLabel.selectedIndex].text + '</dd>' +
        '<dt>Budget</dt><dd>' + budgetLabel.options[budgetLabel.selectedIndex].text + '</dd>' +
        '<dt>Group</dt><dd>' + group + ' people</dd>';
      brief.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- the float desk ---------- */
  var ARCH = {
    walk:    { name: 'Walking group',    len: 8.0, wid: 4.0, deck: 0,    tow: 'None — marshals at both flanks', days: 2, riders: 18, vehicle: false },
    flatbed: { name: 'Flatbed float',    len: 6.0, wid: 2.4, deck: 1.15, tow: 'Tractor 35 hp, 2.4 m drawbar',   days: 6, riders: 8,  vehicle: true },
    trailer: { name: 'Long trailer',     len: 9.5, wid: 2.5, deck: 1.2,  tow: 'Tractor 45 hp, ball hitch',      days: 9, riders: 14, vehicle: true },
    cycle:   { name: 'Cycle rickshaw set', len: 3.0, wid: 1.4, deck: 0.45, tow: 'Hand-pulled by six walkers',  days: 3, riders: 3,  vehicle: true }
  };

  var STREET = {
    mumbai: {
      name: 'Mumbai',
      short: 'Azad Maidan → Girgaon',
      width: 7.4,
      headroom: 4.5,
      turn: 6.2,
      base: 4,
      note: 'The Met junction turn is the constraint, not the overhead. Anything past 8.5 m needs the hinge kit.'
    },
    bengaluru: {
      name: 'Bengaluru',
      short: 'Town Hall → Anand Rao Circle',
      width: 9.0,
      headroom: 5.2,
      turn: 11.0,
      base: 3,
      note: 'The Kanteerava signal is the lowest thing on the route, and the sweep is wide enough for a long trailer driven slowly.'
    },
    kochi: {
      name: 'Kochi',
      short: 'Fort Kochi → Calvathy',
      width: 5.6,
      headroom: 3.9,
      turn: 5.4,
      base: 5,
      note: 'Princess Street will not take a trailer past eight metres. Build it in halves and pin it at the beach.'
    }
  };

  var FLAG = {
    classic:  { name: 'Six-stripe', stripes: ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'] },
    progress: { name: 'Progress',   stripes: ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787', '#ffffff', '#ffafc8', '#74d7ee', '#613915', '#16151a'] },
    trans:    { name: 'Trans',      stripes: ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'] },
    sunset:   { name: 'Sunset',     stripes: ['#f2a03d', '#e2542a', '#c2315b', '#8b3170', '#5b2a86', '#2c2a5e'] }
  };

  var state = { arch: 'flatbed', street: 'bengaluru', flag: 'classic', crown: 3.0, riders: 8 };
  window.__floatDesk = state;

  var form = document.getElementById('float-form');
  var svg = document.getElementById('float-svg');
  if (!form || !svg) return;

  var el = {
    title: document.getElementById('board-title'),
    scale: document.getElementById('board-scale'),
    size: document.getElementById('spec-size'),
    crown: document.getElementById('spec-crown'),
    head: document.getElementById('spec-head'),
    marshals: document.getElementById('spec-marshals'),
    tow: document.getElementById('spec-tow'),
    days: document.getElementById('spec-days'),
    cloth: document.getElementById('spec-cloth'),
    note: document.getElementById('spec-note'),
    warn: document.getElementById('spec-warn'),
    hint: document.getElementById('street-hint'),
    crownOut: document.getElementById('crown-out'),
    ridersOut: document.getElementById('riders-out'),
    stamp: document.getElementById('spec-stamp')
  };

  var GROUND = 344;
  var MAXW = 524;

  function round5(n) { return Math.round(n / 5) * 5; }

  function figure(x, y, s, scale) {
    var h = 1.72 * s;
    var head = 0.105 * s;
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' +
      '<circle cx="0" cy="' + (-h + head).toFixed(1) + '" r="' + head.toFixed(1) + '" fill="none" stroke="#16151a" stroke-width="1.6"/>' +
      '<path d="M0 ' + (-h + head * 2).toFixed(1) + 'v' + (h * 0.42).toFixed(1) +
      'M0 ' + (-h * 0.62).toFixed(1) + 'l' + (-0.19 * s).toFixed(1) + ' ' + (0.22 * s).toFixed(1) +
      'M0 ' + (-h * 0.62).toFixed(1) + 'l' + (0.19 * s).toFixed(1) + ' ' + (0.22 * s).toFixed(1) +
      'M0 ' + (-h * 0.2).toFixed(1) + 'l' + (-0.15 * s).toFixed(1) + ' ' + (0.34 * s).toFixed(1) +
      'M0 ' + (-h * 0.2).toFixed(1) + 'l' + (0.15 * s).toFixed(1) + ' ' + (0.34 * s).toFixed(1) +
      '" fill="none" stroke="#16151a" stroke-width="1.6"/>' +
      '</g>';
  }

  function draw() {
    var a = ARCH[state.arch];
    var st = STREET[state.street];
    var f = FLAG[state.flag];
    var s = Math.min(MAXW / a.len, 62);
    var lenPx = a.len * s;
    var x0 = (640 - lenPx) / 2;
    var crownY = GROUND - state.crown * s;
    var deckY = GROUND - a.deck * s;
    var limitY = GROUND - (st.headroom - 0.35) * s;
    var out = [];

    out.push('<g>');
    /* ground */
    out.push('<path d="M0 ' + GROUND + 'h640" stroke="#16151a" stroke-width="1.6"/>');
    for (var gx = 0; gx < 640; gx += 16) {
      out.push('<path d="M' + gx + ' ' + GROUND + 'l-10 12" stroke="rgba(22,21,26,0.28)" stroke-width="1"/>');
    }

    /* height limit */
    out.push('<path d="M24 ' + limitY.toFixed(1) + 'h592" stroke="#d94a20" stroke-width="1.3" stroke-dasharray="8 6"/>');
    out.push('<text x="28" y="' + (limitY - 7).toFixed(1) + '" fill="#a8350f" font-size="11" font-family="Public Sans, sans-serif">headroom ' + st.headroom.toFixed(1) + ' m — ' + st.name + '</text>');

    if (a.vehicle) {
      /* chassis + deck */
      out.push('<path d="M' + (x0 + 8) + ' ' + GROUND + 'v-18h' + (lenPx - 16) + 'v18" fill="none" stroke="#16151a" stroke-width="2.2"/>');
      out.push('<rect x="' + x0.toFixed(1) + '" y="' + deckY.toFixed(1) + '" width="' + lenPx.toFixed(1) + '" height="' + (GROUND - 18 - deckY).toFixed(1) + '" fill="#fbf7ee" stroke="#16151a" stroke-width="2.2"/>');

      /* canopy */
      var topH = deckY - crownY;
      if (state.arch === 'trailer') {
        out.push('<path d="M' + x0.toFixed(1) + ' ' + deckY.toFixed(1) + 'h' + lenPx.toFixed(1) + 'l-' + (lenPx * 0.09).toFixed(1) + ' -' + (topH * 0.28).toFixed(1) + 'h-' + (lenPx * 0.82).toFixed(1) + 'z" fill="#fbf7ee" stroke="#16151a" stroke-width="2.2"/>');
      } else {
        out.push('<rect x="' + x0.toFixed(1) + '" y="' + crownY.toFixed(1) + '" width="' + lenPx.toFixed(1) + '" height="' + topH.toFixed(1) + '" fill="#fbf7ee" stroke="#16151a" stroke-width="2.2"/>');
      }
      /* stripes in the canopy band */
      var n = f.stripes.length;
      var bandTop = crownY + (state.arch === 'trailer' ? topH * 0.1 : 0);
      var bandH = Math.min(0.9 * s, topH * 0.55);
      var sw = lenPx / n;
      for (var i = 0; i < n; i++) {
        out.push('<rect x="' + (x0 + i * sw).toFixed(1) + '" y="' + bandTop.toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + bandH.toFixed(1) + '" fill="' + f.stripes[i] + '"/>');
      }
      /* panel line */
      out.push('<path d="M' + x0.toFixed(1) + ' ' + (bandTop + bandH).toFixed(1) + 'h' + lenPx.toFixed(1) + '" stroke="#16151a" stroke-width="1.2"/>');

      /* paper-flower motifs on the side panel */
      var motY = deckY + (GROUND - 18 - deckY) * 0.55;
      for (var m = 0; m < 3; m++) {
        var cx = x0 + lenPx * (0.52 + m * 0.16);
        var r = Math.min(lenPx * 0.05, 18);
        out.push('<circle cx="' + cx.toFixed(1) + '" cy="' + motY.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + f.stripes[(m + 2) % n] + '" stroke="#16151a" stroke-width="1.3"/>');
        out.push('<circle cx="' + cx.toFixed(1) + '" cy="' + motY.toFixed(1) + '" r="' + (r * 0.32).toFixed(1) + '" fill="#fbf7ee"/>');
      }

      /* wheels */
      var wheelR = Math.min(0.46 * s, 30);
      var wheelY = GROUND - wheelR;
      var wheels = state.arch === 'cycle' ? [0.28, 0.72] : [0.22, 0.78];
      wheels.forEach(function (w) {
        var wx = x0 + lenPx * w;
        out.push('<circle cx="' + wx.toFixed(1) + '" cy="' + wheelY.toFixed(1) + '" r="' + wheelR.toFixed(1) + '" fill="#fbf7ee" stroke="#16151a" stroke-width="2.2"/>');
        out.push('<circle cx="' + wx.toFixed(1) + '" cy="' + wheelY.toFixed(1) + '" r="' + (wheelR * 0.34).toFixed(1) + '" fill="#16151a"/>');
      });

      /* riders on the deck */
      var onTop = Math.max(0, Math.min(state.riders, 12));
      var yTop = state.arch === 'trailer' ? deckY + 2 : crownY + bandH + 4;
      for (var p = 0; p < onTop; p++) {
        var px = x0 + lenPx * (0.12 + (0.76 * p) / Math.max(onTop - 1, 1));
        out.push(figure(px, yTop + 1.72 * s * 0.34, s));
      }
    } else {
      /* walking group: two ranks of figures inside the footprint */
      var count = Math.min(state.riders, 24);
      var perRow = Math.ceil(count / 2);
      var span = lenPx;
      for (var k = 0; k < count; k++) {
        var row = k < perRow ? 0 : 1;
        var idx = k < perRow ? k : k - perRow;
        var fx = x0 + 10 + (span - 20) * (perRow === 1 ? 0.5 : idx / (perRow - 1));
        out.push(figure(fx, GROUND - 2 - row * 0.6 * s, s));
      }
      /* footprint outline */
      out.push('<path d="M' + x0.toFixed(1) + ' ' + GROUND + 'v-4h' + lenPx.toFixed(1) + 'v4" stroke="#d94a20" stroke-width="1.6" fill="none"/>');
      out.push('<text x="' + (x0 + 6).toFixed(1) + '" y="' + (GROUND - 10 - 0.6 * s).toFixed(1) + '" fill="#a8350f" font-size="11" font-family="Public Sans, sans-serif">footprint ' + a.len.toFixed(1) + ' × ' + a.wid.toFixed(1) + ' m</text>');
    }

    /* dimensions */
    out.push('<path d="M' + (x0 + lenPx + 26).toFixed(1) + ' ' + crownY.toFixed(1) + 'v' + (GROUND - crownY).toFixed(1) + 'M' + (x0 + lenPx + 20).toFixed(1) + ' ' + crownY.toFixed(1) + 'h12M' + (x0 + lenPx + 20).toFixed(1) + ' ' + GROUND + 'h12" stroke="#d94a20" stroke-width="1.2" fill="none"/>');
    out.push('<text x="' + (x0 + lenPx + 34).toFixed(1) + '" y="' + ((crownY + GROUND) / 2).toFixed(1) + '" fill="#a8350f" font-size="12" font-family="Public Sans, sans-serif">' + state.crown.toFixed(1) + ' m</text>');
    out.push('<path d="M' + x0.toFixed(1) + ' ' + (GROUND + 30) + 'h' + lenPx.toFixed(1) + 'M' + x0.toFixed(1) + ' ' + (GROUND + 24) + 'v12M' + (x0 + lenPx).toFixed(1) + ' ' + (GROUND + 24) + 'v12" stroke="#d94a20" stroke-width="1.2" fill="none"/>');
    out.push('<text x="' + (x0 + lenPx / 2).toFixed(1) + '" y="' + (GROUND + 48) + '" fill="#a8350f" font-size="12" text-anchor="middle" font-family="Public Sans, sans-serif">' + a.len.toFixed(1) + ' m</text>');

    /* title block */
    out.push('<text x="24" y="26" fill="#16151a" font-size="13" font-weight="600" font-family="Bricolage Grotesque, sans-serif">' + a.name + ' · ' + st.short + '</text>');
    out.push('<text x="24" y="44" fill="#615d55" font-size="10.5" letter-spacing="1.2" font-family="Public Sans, sans-serif">ELEVATION · ' + FLAG[state.flag].name.toUpperCase() + ' · ' + st.width.toFixed(1) + ' M CARRIAGEWAY</text>');
    out.push('</g>');

    svg.innerHTML = out.join('');
    svg.setAttribute('aria-label', 'Side elevation of a ' + a.name.toLowerCase() + ' for ' + st.name + ': ' + a.len.toFixed(1) + ' metres long, ' + state.crown.toFixed(1) + ' metres high, with the route headroom of ' + st.headroom.toFixed(1) + ' metres marked.');

    /* readouts */
    var limit = st.headroom - 0.35;
    var headroomLeft = st.headroom - state.crown;
    var marshals = st.base + Math.ceil(Math.max(state.riders, 1) / 10) + (state.arch === 'trailer' ? 2 : 0);
    var days = a.days + (state.crown > 3.6 ? 2 : 0);
    var panels = f.stripes.length * 2;

    el.title.textContent = a.name + ' · ' + st.name;
    el.scale.textContent = 'scale 1 : ' + round5(3779 / s);
    el.size.textContent = a.len.toFixed(1) + ' × ' + a.wid.toFixed(1) + ' m';
    el.crown.textContent = state.crown.toFixed(1) + ' m';
    el.head.textContent = headroomLeft > 0 ? headroomLeft.toFixed(2) + ' m' : 'over by ' + Math.abs(headroomLeft).toFixed(2) + ' m';
    el.head.style.color = headroomLeft > 0.4 ? '' : '#ff8f6b';
    el.marshals.textContent = String(marshals);
    el.tow.textContent = a.tow;
    el.days.textContent = String(days);
    el.cloth.textContent = f.name + ' · ' + panels + ' panels';
    el.stamp.textContent = 'W11B · F' + (marshals < 10 ? '0' + marshals : marshals);

    var warns = [];
    if (state.crown > limit) {
      warns.push('Crown is ' + (state.crown - limit).toFixed(2) + ' m over the ' + st.name + ' limit of ' + limit.toFixed(2) + ' m. Either lower it to ' + limit.toFixed(2) + ' m or build the top panel to unbolt at the overhead.');
    }
    if (a.wid > st.width * 0.42) {
      warns.push('At ' + a.wid.toFixed(1) + ' m wide this takes ' + Math.round((a.wid / st.width) * 100) + '% of a ' + st.width.toFixed(1) + ' m carriageway. No overtaking: the whole march slows to the float.');
    }
    if (a.len > 8.5 && st.turn < 7) {
      warns.push('A ' + a.len.toFixed(1) + ' m float cannot make a ' + st.turn.toFixed(1) + ' m radius turn under tow. Plan a tow release, or build in two halves.');
    }
    if (state.riders > 14 && !a.vehicle) {
      warns.push('Thirty-plus walkers need a second marshal pair at the rear. Build the whistle signal into the rehearsal, not the morning.');
    }
    el.warn.hidden = warns.length === 0;
    el.warn.textContent = warns.join(' ');

    el.note.textContent = st.note + (state.arch === 'cycle'
      ? ' Six rickshaws read as six objects, not one float: keep a gap of 3 m so the gap does not fill with the crowd.'
      : ' ' + 'Build the crown in two panels and you will thank yourself at the first low branch.');
    el.hint.textContent = st.width.toFixed(1) + ' m carriageway, ' + st.headroom.toFixed(1) + ' m overhead, ' +
      (st.turn < 7 ? 'a tight ' : 'a wide ') + st.turn.toFixed(1) + ' m turn.';
    el.crownOut.textContent = state.crown.toFixed(1) + ' m';
    el.ridersOut.textContent = String(state.riders);
  }

  /* controls */
  Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b) {
    b.addEventListener('click', function () {
      state.arch = b.getAttribute('data-arch');
      document.querySelectorAll('.opt').forEach(function (o) {
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (state.arch === 'walk') { state.riders = 18; }
      else if (state.arch === 'cycle') { state.riders = 6; }
      else { state.riders = state.riders > 24 ? 12 : ARCH[state.arch].riders; }
      document.getElementById('riders').value = String(state.riders);
      draw();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.sw'), function (b) {
    b.addEventListener('click', function () {
      state.flag = b.getAttribute('data-flag');
      document.querySelectorAll('.sw').forEach(function (o) {
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      draw();
    });
  });

  var streetSel = document.getElementById('street');
  streetSel.addEventListener('change', function () {
    state.street = streetSel.value;
    draw();
  });

  var crownRange = document.getElementById('crown');
  crownRange.addEventListener('input', function () {
    state.crown = parseFloat(crownRange.value);
    draw();
  });

  var ridersRange = document.getElementById('riders');
  ridersRange.addEventListener('input', function () {
    state.riders = parseInt(ridersRange.value, 10);
    draw();
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); draw(); });

  draw();
})();
