/* Raghav Iyer — vastu consultation
   The zone tool: place a room, read what the texts say, and see the score. */

(function () {
  'use strict';

  var navbtn = document.querySelector('.navbtn');
  var nav = document.getElementById('nav');
  if (navbtn && nav) {
    navbtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var ZONE_NAME = {
    NW: 'North-west', N: 'North', NE: 'North-east', W: 'West',
    E: 'East', SW: 'South-west', S: 'South', SE: 'South-east'
  };
  var ZONE_GOD = {
    NW: 'Vayu', N: 'Kubera', NE: 'Ishanya', W: 'Varuna',
    E: 'Indra', SW: 'Nairutya', S: 'Yama', SE: 'Agni'
  };

  var ROOMS = {
    kitchen: {
      label: 'Kitchen', ideal: ['SE'], ok: ['W'],
      classical: 'Agni belongs in the south-east. Almost every version of the mandala puts the kitchen there, and the north-west is the only other corner a few households use.',
      practical: 'The south-east takes the morning sun while you cook and keeps the heat away from the rooms you sleep in. A kitchen in the north-east heats the coolest corner of the house and pushes the flue into the room the family uses first.',
      fix: 'Do not demolish a kitchen to satisfy a text. Move the cooking plate to the south-east corner of the room if the gas line allows, keep the sink on the north or east wall, and treat the rest as a kitchen that happens to be in the wrong room.'
    },
    master: {
      label: 'Master bedroom', ideal: ['SW'], ok: ['S'],
      classical: 'The south-west is the heaviest corner, and the texts give it to the head of the family. The south is an accepted second.',
      practical: 'The south-west takes the afternoon heat, which is why it is the worst room at four o\u2019clock and the best at midnight, when the wall releases the warmth. It also carries the most structure, so a heavy bed and a wardrobe cost nothing there.',
      fix: 'If the master is in the north-east, move the bed to the south-west corner of that room and sleep with your head to the south or east. The room is not ideal; the sleeping position still can be.'
    },
    puja: {
      label: 'Puja room', ideal: ['NE'], ok: ['E'],
      classical: 'The north-east is Ishanya, the lightest corner, and the one the texts reserve for prayer and water. The east is acceptable; the texts disagree on which way the image should face.',
      practical: 'Morning light arrives first and softly in the north-east, which is when the room is used. It is also the coolest corner, so a lamp and a small flame do not fight the heat of the room.',
      fix: 'Keep the shrine on the north or east wall of whatever room you can spare, at the far end from a toilet wall, and use a lamp rather than a window.'
    },
    stairs: {
      label: 'Staircase', ideal: ['S'], ok: ['W', 'SW'],
      classical: 'Staircases are given to the south-west, south or west \u2014 the corners where a solid mass does no harm and the centre of the plan stays open.',
      practical: 'A stair is heavy and it moves. Putting it in the south-west keeps the living rooms on the cool sides and frees the centre, which is the one thing the texts and an architect agree on.',
      fix: 'If the stair is in the north-east, keep the space under it open and light rather than closing it into a store cupboard.'
    },
    toilet: {
      label: 'Toilet', ideal: ['NW'], ok: ['W'],
      classical: 'The north-west is Vayu, given to waste and movement; the west and south are allowed. Never the north-east, and never the centre.',
      practical: 'The north-west takes the evening sun, so a toilet there dries out. In most plans it is also the corner farthest from the kitchen, which is why it works.',
      fix: 'A toilet in the north-east cannot be moved in a rented flat. Keep the door closed, keep it dry, and do not put the puja shelf on the wall behind it.'
    },
    study: {
      label: 'Study', ideal: ['E'], ok: ['N', 'NE'],
      classical: 'The north-east and east are the study corners: light in the morning and none of the afternoon glare.',
      practical: 'A desk facing east or north gets the light on the page instead of in your eyes, which matters more to how you work than any corner.',
      fix: 'Whatever the room, sit facing east or north with a wall behind you, and take the desk off the wall it shares with a toilet.'
    },
    dining: {
      label: 'Dining', ideal: ['W'], ok: ['E'],
      classical: 'The west is given to Varuna and is the usual dining corner; the east works where the plan forces it.',
      practical: 'The west dining room gets the evening light, and in most plans it sits beside the kitchen. That adjacency is the real reason the placement works.',
      fix: 'A dining room in the south-east beside the kitchen is fine. The texts allow the dining to sit near the fire, and so does anyone who has carried a hot vessel across a house.'
    },
    guest: {
      label: 'Guest room', ideal: ['N'], ok: ['NW', 'W'],
      classical: 'The north is Kubera\u2019s corner, and many households put the guest room there. The north-west, which the texts give to what leaves the house, is the second choice.',
      practical: 'Guests arrive and leave. A room on the north side gets even light, stays cool in the afternoon, and sits next to the entry without being on the family\u2019s side of the house.',
      fix: 'If the only spare room is in the south-east, use it as a study and put the guest bed in the living room. Do not overthink a room used four nights a year.'
    }
  };

  var INITIAL = { NW: 'toilet', N: 'study', NE: 'kitchen', W: 'guest', E: 'dining', SW: 'puja', S: 'stairs', SE: 'master' };
  var ORDER = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];

  var state = Object.assign({}, INITIAL);
  var selected = 'NE';

  var el = {
    zones: Array.prototype.slice.call(document.querySelectorAll('.zone[data-zone]')),
    score: document.getElementById('score'),
    scoreState: document.getElementById('score-state'),
    room: document.getElementById('room'),
    reset: document.getElementById('reset'),
    kicker: document.getElementById('read-kicker'),
    title: document.getElementById('read-title'),
    dir: document.getElementById('read-dir'),
    verdict: document.getElementById('read-verdict'),
    text: document.getElementById('read-text'),
    classical: document.getElementById('read-classical'),
    practical: document.getElementById('read-practical'),
    fix: document.getElementById('read-fix'),
    worst: document.getElementById('worst'),
    place: document.getElementById('place-btn'),
    note: document.getElementById('place-note')
  };
  var ready = !!(el.zones.length && el.score);

  function grade(room, zone) {
    var r = ROOMS[room];
    if (r.ideal.indexOf(zone) > -1) return 2;
    if (r.ok.indexOf(zone) > -1) return 1;
    return 0;
  }

  function score() {
    return ORDER.reduce(function (sum, z) { return sum + grade(state[z], z); }, 0);
  }

  function bestZone(room) {
    return ROOMS[room].ideal[0];
  }

  function renderZones() {
    el.zones.forEach(function (btn) {
      var z = btn.getAttribute('data-zone');
      var room = state[z];
      var g = grade(room, z);
      btn.classList.toggle('is-good', g === 2);
      btn.classList.toggle('is-ok', g === 1);
      btn.classList.toggle('is-bad', g === 0);
      btn.classList.toggle('is-picked', z === selected);
      var roomEl = btn.querySelector('.zone__room');
      if (roomEl) roomEl.textContent = ROOMS[room].label;
      btn.setAttribute('aria-label', ZONE_NAME[z] + ': ' + ROOMS[room].label + ', ' + (g === 2 ? 'the ideal placement' : g === 1 ? 'allowed by the texts' : 'warned against'));
    });
  }

  function renderScore() {
    var s = score();
    var pct = Math.round((s / 16) * 100);
    el.score.textContent = String(pct);
    var bad = ORDER.filter(function (z) { return grade(state[z], z) === 0; }).length;
    var ok = ORDER.filter(function (z) { return grade(state[z], z) === 1; }).length;
    var msg;
    if (bad === 0 && ok === 0) msg = 'Every room in its corner. On a first visit this has never happened.';
    else if (bad === 0) msg = 'Nothing is in a warned corner. ' + ok + (ok === 1 ? ' room is' : ' rooms are') + ' allowed rather than ideal.';
    else msg = (bad === 1 ? 'One room is' : bad + ' rooms are') + ' in a corner the texts warn against' + (ok ? ', and ' + ok + ' in one they merely allow' : '') + '.';
    el.scoreState.textContent = msg;

    var rows = ORDER
      .map(function (z) { return { z: z, room: state[z], g: grade(state[z], z) }; })
      .filter(function (r) { return r.g < 2; })
      .sort(function (a, b) { return a.g - b.g; })
      .slice(0, 3);
    el.worst.innerHTML = rows.length
      ? rows.map(function (r, i) {
        return '<li><span class="n">0' + (i + 1) + '</span><span>' + ROOMS[r.room].label + ' in the ' + ZONE_NAME[r.z].toLowerCase() + ' \u2014 move it to the ' + ZONE_NAME[bestZone(r.room)].toLowerCase() + ' if you can.</span></li>';
      }).join('')
      : '<li><span class="n">01</span><span>Nothing left to move. This is as good as this plan gets without a wall coming down.</span></li>';

    window.__vastu = { state: Object.assign({}, state), score: pct, points: s, bad: bad, ok: ok, message: msg };
  }

  function renderRead() {
    var z = selected;
    var room = state[z];
    var g = grade(room, z);
    var r = ROOMS[room];
    el.kicker.textContent = 'Reading the ' + ZONE_NAME[z].toLowerCase();
    el.title.textContent = r.label + ' in the ' + ZONE_NAME[z].toLowerCase();
    el.dir.textContent = ZONE_NAME[z] + ' \u00b7 ' + ZONE_GOD[z];
    el.verdict.textContent = g === 2 ? 'The ideal placement' : g === 1 ? 'Allowed by the texts' : 'Warned against';
    el.text.textContent = g === 2
      ? 'This is where the texts put it, and where the plan wants it: ' + r.practical.split('. ')[0].toLowerCase() + '.'
      : g === 1
        ? 'This corner is allowed rather than ideal. ' + r.practical
        : 'This is the placement the texts warn against, and the one I am asked to fix most often. ' + r.practical;
    var chosen = el.room.value;
    el.place.textContent = state[z] === chosen ? 'This room is already here' : 'Put the ' + ROOMS[chosen].label.toLowerCase() + ' here';
    el.place.disabled = state[z] === chosen;
    el.place.style.opacity = state[z] === chosen ? '0.45' : '1';
    var home = null;
    ORDER.forEach(function (zz) { if (state[zz] === chosen) home = zz; });
    el.note.textContent = 'The ' + ROOMS[chosen].label.toLowerCase() + ' is in the ' + (home ? ZONE_NAME[home].toLowerCase() : 'centre') + '.';
    el.classical.textContent = r.classical;
    el.practical.textContent = r.practical;
    el.fix.textContent = r.fix;
    renderZones();
    renderScore();
  }

  function place(zone, room) {
    var prev = null;
    ORDER.forEach(function (z) { if (state[z] === room) prev = z; });
    var occupant = state[zone];
    if (prev && prev !== zone) {
      state[prev] = occupant;
    }
    state[zone] = room;
    selected = zone;
    renderRead();
  }

  if (ready) {
    el.zones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = btn.getAttribute('data-zone');
        renderRead();
      });
    });

    el.room.addEventListener('change', function () { renderRead(); });

    el.place.addEventListener('click', function () {
      var room = el.room.value;
      if (state[selected] === room) return;
      place(selected, room);
    });

    el.reset.addEventListener('click', function () {
      state = Object.assign({}, INITIAL);
      selected = 'NE';
      el.room.value = 'kitchen';
      renderRead();
    });

    renderZones();
    renderRead();
  }

  /* readings filter */
  var filters = document.querySelector('.filters');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-kind]'));
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var want = chip.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (it) { it.hidden = want !== 'all' && it.getAttribute('data-kind') !== want; });
    });
  }

  /* consultation form */
  var form = document.getElementById('consult-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('g-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'Who is asking.' },
      place: { el: document.getElementById('g-place'), test: function (v) { return v.trim().length >= 2; }, msg: 'The area and the building, so I can look at the map.' },
      email: { el: document.getElementById('g-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email that works.' },
      area: { el: document.getElementById('g-area'), test: function (v) { return Number(v) >= 150; }, msg: 'Built-up area in square feet, at least roughly.' },
      message: { el: document.getElementById('g-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'The rooms that worry you, and whether the plan is built or still on paper.' }
    };
    function setErr(k, on) {
      var f = fields[k];
      var box = f.el.closest('.field').querySelector('.err');
      if (on) f.el.setAttribute('aria-invalid', 'true');
      else f.el.removeAttribute('aria-invalid');
      box.textContent = on ? f.msg : '';
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        if (fields[k].el.getAttribute('aria-invalid') === 'true' && fields[k].test(fields[k].el.value)) setErr(k, false);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = 0;
      Object.keys(fields).forEach(function (k) {
        var good = fields[k].test(fields[k].el.value);
        setErr(k, !good);
        if (!good) bad++;
      });
      var agree = document.getElementById('g-agree');
      var agreeErr = document.getElementById('g-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm the plan is yours to share, or that the owner has agreed.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) { (form.querySelector('[aria-invalid="true"]') || agree).focus(); return; }
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = document.getElementById('g-stage').value + ' \u00b7 ' + document.getElementById('g-kind').value;
      document.getElementById('sent-where').textContent = fields.place.el.value.trim();
      form.hidden = true;
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
