/* Tirtha Walk — route planner on a hand-drawn riverfront map. */
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- stop data ---------------- */
  var STOPS = {
    assi:       { name: 'Assi Ghat', order: 0, x: 272, y: 60, min: 10, dist: 0, note: 'Meeting point at the boat landing; the river is still grey.' },
    tulsi:      { name: 'Tulsi Ghat', order: 1, x: 266, y: 126, min: 15, dist: 0.6, note: 'The akhara is working. Watch from the upper path, no cameras.' },
    chet:       { name: 'Chet Singh Ghat', order: 2, x: 262, y: 192, min: 10, dist: 0.5, note: 'The fort wall, and the story of the 1781 siege told in four minutes.' },
    dash:       { name: 'Dashashwamedh Ghat', order: 3, x: 272, y: 262, min: 20, dist: 0.8, note: 'The aarti platform. Morning it is a bathing ghat; evening, a crowd.' },
    manmandir:  { name: 'Man Mandir', order: 4, x: 284, y: 328, min: 15, dist: 0.4, note: 'The Jantar Mantar observatory, built in 1737, still reading the sun.' },
    lalita:     { name: 'Lalita Ghat', order: 5, x: 276, y: 392, min: 12, dist: 0.5, note: 'The Nepali temple, wood and stone, and the quietest steps on the route.' },
    manikarnika:{ name: 'Manikarnika', order: 6, x: 264, y: 464, min: 10, dist: 0.6, note: 'From the upper platform only. No photographs, no commentary unless asked.' },
    vishwanath: { name: 'Vishwanath Gali', order: 7, x: 118, y: 262, min: 20, dist: 0.6, note: 'Single file past the brass sellers; the temple is behind a shopfront.' },
    madanpura:  { name: 'Madanpura weavers', order: 8, x: 88, y: 366, min: 25, dist: 0.9, note: 'A pit loom in a front room, and the family that has run it since 1958.' },
    kachori:    { name: 'Kachori Gali', order: 9, x: 142, y: 196, min: 15, dist: 0.5, note: 'The morning market: kachori, jalebi, and tea boiled with cardamom.' }
  };

  var ROUTES = {
    ghats: { label: 'Ghats and river life', title: 'Ghats at first light', list: ['assi', 'tulsi', 'chet', 'dash', 'manmandir', 'lalita', 'manikarnika'] },
    temple: { label: 'Temple and lanes', title: 'Temple and the lanes', list: ['assi', 'dash', 'vishwanath', 'manmandir', 'lalita'] },
    craft: { label: 'Silk and brass', title: 'Silk and brass', list: ['assi', 'vishwanath', 'madanpura', 'manikarnika'] },
    food: { label: 'Food and market', title: 'The morning market', list: ['assi', 'kachori', 'vishwanath', 'dash', 'tulsi'] }
  };

  var form = document.getElementById('plannerForm');
  var map = document.getElementById('planMap');
  if (!form || !map) return;

  var pointsLayer = document.getElementById('routePoints');
  var lineEl = document.getElementById('routeLine');
  var listEl = document.getElementById('itList');
  var titleEl = document.getElementById('itTitle');
  var metaEl = document.getElementById('itMeta');
  var noteEl = document.getElementById('itNote');
  var mapNote = document.getElementById('mapNote');

  var WALK_SPEED = 3.4; /* km/h on ghat stone */
  var PACE = { slow: 1.3, steady: 1, brisk: 0.75 };

  /* draw all ten points once */
  if (pointsLayer) {
    pointsLayer.innerHTML = Object.keys(STOPS).map(function (key) {
      var s = STOPS[key];
      return '<g class="pt" data-pt="' + key + '">' +
        '<circle cx="' + s.x + '" cy="' + s.y + '" r="7" fill="#a4563b" stroke="#efe6d3" stroke-width="1.5"/>' +
        '<text class="pt-num" x="' + s.x + '" y="' + (s.y + 2.6) + '" text-anchor="middle">' + (s.order + 1) + '</text>' +
        '</g>';
    }).join('');
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function clock(hoursFloat) {
    var total = Math.round(hoursFloat * 60);
    var h = Math.floor(total / 60) % 24;
    var m = total % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ':' + pad(m) + ' ' + suffix;
  }

  function minutesLabel(mins) {
    var h = Math.floor(mins / 60);
    var m = Math.round(mins % 60);
    return (h ? h + ' hr ' : '') + (m ? m + ' min' : '').trim();
  }

  function plan() {
    var start = parseFloat(form.elements.start.value);
    var budget = parseInt(form.elements.duration.value, 10);
    var interest = form.elements.interest.value;
    var pace = PACE[form.elements.pace.value] || 1;
    var route = ROUTES[interest] || ROUTES.ghats;

    var chosen = [];
    var used = 0;
    var distance = 0;
    route.list.forEach(function (key) {
      var s = STOPS[key];
      var walkMin = (s.dist / WALK_SPEED) * 60;
      var stay = s.min * pace;
      var add = walkMin + stay;
      if (chosen.length >= 3 && used + add > budget) return;
      chosen.push(key);
      used += add;
      distance += s.dist;
    });

    /* sort into the physical order of the walk (up the river, then lanes) */
    chosen.sort(function (a, b) { return STOPS[a].order - STOPS[b].order; });

    /* times */
    var t = start;
    var rows = [];
    chosen.forEach(function (key, i) {
      var s = STOPS[key];
      if (i > 0) t += (s.dist / WALK_SPEED);
      rows.push({ key: key, time: clock(t), stop: s });
      t += (s.min * pace) / 60;
    });
    var total = Math.round((t - start) * 60);

    /* map: dim others, draw line */
    if (pointsLayer) {
      pointsLayer.querySelectorAll('.pt').forEach(function (g) {
        var on = chosen.indexOf(g.getAttribute('data-pt')) !== -1;
        g.classList.toggle('pt-off', !on);
      });
    }
    if (lineEl) {
      var d = chosen.map(function (key, i) {
        var s = STOPS[key];
        return (i === 0 ? 'M' : 'L') + s.x + ' ' + s.y;
      }).join(' ');
      lineEl.setAttribute('d', d);
    }

    if (listEl) {
      listEl.innerHTML = rows.map(function (r) {
        return '<li><span class="t">' + r.time + '</span><span class="dot"></span>' +
          '<span class="stop-name">' + r.stop.name + '<small>' + r.stop.note + '</small></span></li>';
      }).join('');
    }
    if (titleEl) titleEl.textContent = route.title;
    if (metaEl) metaEl.textContent = distance.toFixed(1) + ' km · ' + minutesLabel(total);
    if (mapNote) mapNote.textContent = chosen.length + ' stops · ' + distance.toFixed(1) + ' km · ' + minutesLabel(total);

    var note = 'Shoes come off at Tulsi; the rest is on stone. ';
    if (interest === 'ghats' && rows.some(function (r) { return r.key === 'manikarnika'; })) {
      note += 'The last stop is silent and camera-free.';
    } else if (interest === 'craft') {
      note += 'The loom is in a family home; ask before photographing the workshop.';
    } else if (interest === 'food') {
      note += 'Come hungry, and carry small notes — the stalls rarely have change.';
    } else {
      note += 'The temple lane is closed to vehicles after eight, which makes it walkable.';
    }
    if (start >= 17) note += ' The aarti at Dashashwamedh begins around 18:45 in winter.';
    if (noteEl) noteEl.textContent = note;
  }

  form.addEventListener('change', plan);
  plan();
})();

/* ============================================================
   Booking form
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('bookForm');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function setError(name, msg) {
    var field = form.elements[name];
    var slot = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (slot) slot.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = 0;
    var name = form.elements.name.value.trim();
    if (name.length < 2) { setError('name', 'A name for the walk list.'); errors++; } else setError('name', '');
    var contact = form.elements.contact.value.trim();
    if (contact.length < 6) { setError('contact', 'An email or a phone number.'); errors++; } else setError('contact', '');
    var date = form.elements.date.value;
    if (!date) { setError('date', 'Which morning?'); errors++; }
    else if (new Date(date + 'T00:00:00') < new Date(new Date().toDateString())) { setError('date', 'That date has passed.'); errors++; }
    else setError('date', '');
    var people = parseInt(form.elements.people.value || '0', 10);
    if (!people || people < 1 || people > 8) { setError('people', 'Between one and eight people.'); errors++; } else setError('people', '');

    if (errors) {
      if (status) { status.className = 'form-status'; status.textContent = 'One or two fields still need an answer.'; }
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var walk = form.elements.walk.value;
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Noted, ' + name + '. ' + people + ' for the ' + walk.toLowerCase() + ' on ' +
        new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) +
        '. A confirmation goes to ' + contact + ' with the meeting point and what to wear.';
    }
    form.reset();
  });
})();

/* ============================================================
   Route filter
   ============================================================ */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.filters .chip');
  var routes = document.querySelectorAll('.routes .route');
  var countEl = document.getElementById('routeCount');
  if (!chips.length || !routes.length) return;

  function apply(filter) {
    var shown = 0;
    routes.forEach(function (r) {
      var match = filter === 'all' || r.getAttribute('data-type') === filter;
      r.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' route' : ' routes');
  }

  chips.forEach(function (c) {
    c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
    c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
  });
})();
