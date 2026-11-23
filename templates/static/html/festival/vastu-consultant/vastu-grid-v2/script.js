/* Vastu Grid — Sowmya Rao. Shared script for all four pages.
   Menu, the scroll-driven grid diagram, the Plan Reading Planner,
   and the contact form. No sound, no libraries. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------------- mobile menu: a plan sheet laid over the page ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.querySelector('.nav-panel');
  if (menuBtn && panel) {
    var closeMenu = function (refocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') &&
          !panel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closeMenu(false);
      }
    });
  }

  /* ---------------- the nine cells: the diagram completes as you read ---------------- */
  var scrollgrid = document.querySelector('.scrollgrid');
  if (scrollgrid) {
    var cells = {};
    scrollgrid.querySelectorAll('.cell').forEach(function (c) {
      cells[c.getAttribute('data-cell')] = c;
    });
    var rows = document.querySelectorAll('.cell-row[data-cell]');
    var light = function (key) { if (cells[key]) cells[key].classList.add('lit'); };
    if (reduced || !('IntersectionObserver' in window)) {
      Object.keys(cells).forEach(light); /* reduced motion: the grid is drawn in full */
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            light(en.target.getAttribute('data-cell'));
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.3, rootMargin: '0px 0px -12% 0px' });
      rows.forEach(function (r) { io.observe(r); });
    }
  }

  /* ---------------- Plan Reading Planner ----------------
     Every rule and fee below is printed on the page beside the tool.
     The tables are the source; this is only their arithmetic. */
  var planner = document.getElementById('planner');
  if (planner) {
    var DIRS = { N: 'North', NE: 'North-east', E: 'East', SE: 'South-east',
                 S: 'South', SW: 'South-west', W: 'West', NW: 'North-west', C: 'Centre' };
    var ROOM_RULES = {
      kitchen: { label: 'Kitchen',        first: 'SE', also: ['NW'],       against: ['NE', 'SW'] },
      master:  { label: 'Master bedroom', first: 'SW', also: ['S', 'W'],   against: ['NE'] },
      pooja:   { label: 'Pooja room',     first: 'NE', also: ['E', 'N'],   against: ['S'] },
      toilet:  { label: 'Toilet & bath',  first: 'NW', also: ['W'],        against: ['NE', 'SW'] },
      stairs:  { label: 'Staircase',      first: 'S',  also: ['W', 'SW'],  against: ['NE'] }
    };
    var ENTRANCE_PADAS = { N: [3, 4, 5], NE: [3, 4], E: [3, 4, 5], SE: [4, 5],
                           S: [4, 5], SW: [5, 6], W: [4, 5, 6], NW: [4, 5] };
    var AREA_BANDS = [
      { label: 'Up to 1,200 sq ft', fee: 4500 },
      { label: '1,201–2,400 sq ft', fee: 7500 },
      { label: 'Above 2,400 sq ft', fee: 11000 }
    ];
    var FLOOR_EXTRA = 1500, VISIT_FEE = 3000;

    var state = { facing: 'E', pada: 5, area: 1, floors: 2 };
    var shown = false;

    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

    /* segmented button groups */
    planner.querySelectorAll('[data-group]').forEach(function (group) {
      var key = group.getAttribute('data-group');
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-value]');
        if (!btn) return;
        group.querySelectorAll('button').forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        state[key] = key === 'pada' || key === 'area' ? parseInt(btn.getAttribute('data-value'), 10)
                                                      : btn.getAttribute('data-value');
        if (shown) compute();
      });
    });

    /* floors stepper */
    var floorsOut = document.getElementById('floors-out');
    planner.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = parseInt(btn.getAttribute('data-step'), 10);
        state.floors = Math.min(4, Math.max(1, state.floors + d));
        floorsOut.textContent = String(state.floors);
        if (shown) compute();
      });
    });

    planner.querySelectorAll('select, input[type="checkbox"]').forEach(function (el) {
      el.addEventListener('change', function () { if (shown) compute(); });
    });

    function verdictFor(rule, placed, movable) {
      if (placed === 'C') {
        return { kind: 'against', label: 'Works against',
          note: 'The centre stays open in this practice — nothing is placed there. The reading suggests the nearest cell that serves.' };
      }
      if (placed === rule.first) {
        return { kind: 'agrees', label: 'Agrees',
          note: 'The grid\u2019s first choice for this room is the ' + DIRS[rule.first].toLowerCase() + '. Nothing to change.' };
      }
      if (rule.also.indexOf(placed) !== -1) {
        return { kind: 'serves', label: 'Also serves',
          note: 'Not the first choice, and the grid accepts it. No change suggested.' };
      }
      if (rule.against.indexOf(placed) !== -1) {
        return { kind: 'against', label: 'Works against',
          note: movable
            ? 'This room can move, so the reading marks where it goes and what the move involves — in writing, with the cost stated.'
            : 'This room cannot move, so it stays. The reading works around it and says so in writing — a room that cannot move is a fact, not a failure.' };
      }
      return { kind: 'workable', label: 'Workable',
        note: 'Neither favoured nor against in the printed table. The reading notes it and moves on.' };
    }

    function compute() {
      var items = [];

      /* entrance */
      var fav = ENTRANCE_PADAS[state.facing];
      var entAgrees = fav.indexOf(state.pada) !== -1;
      items.push({
        name: 'Entrance', placed: DIRS[state.facing] + ' frontage, pada ' + state.pada,
        kind: entAgrees ? 'agrees' : 'workable',
        label: entAgrees ? 'Agrees' : 'Workable',
        note: entAgrees
          ? 'Pada ' + state.pada + ' is one of the favourable padas for a ' + DIRS[state.facing].toLowerCase() +
            '-facing frontage (printed table: ' + fav.join(', ') + ').'
          : 'Pada ' + state.pada + ' sits outside the favourable padas for a ' + DIRS[state.facing].toLowerCase() +
            '-facing frontage (printed table: ' + fav.join(', ') + '). Entrances are rarely moved; a reading weighs the pada against the whole plan before suggesting anything.'
      });

      /* rooms */
      Object.keys(ROOM_RULES).forEach(function (key) {
        var rule = ROOM_RULES[key];
        var sel = document.getElementById('room-' + key);
        var move = document.getElementById('move-' + key);
        var placed = sel ? sel.value : rule.first;
        var v = verdictFor(rule, placed, move ? move.checked : false);
        items.push({ name: rule.label, placed: DIRS[placed], kind: v.kind, label: v.label, note: v.note });
      });

      var counts = { agrees: 0, serves: 0, against: 0, workable: 0 };
      items.forEach(function (it) { counts[it.kind] += 1; });

      var list = document.getElementById('verdict-list');
      list.innerHTML = '';
      items.forEach(function (it) {
        var li = document.createElement('li');
        var name = document.createElement('span');
        name.className = 'v-name';
        name.textContent = it.name + ' ';
        var placedSpan = document.createElement('span');
        placedSpan.textContent = '— ' + it.placed;
        name.appendChild(placedSpan);
        var chip = document.createElement('span');
        chip.className = 'chip ' + it.kind;
        chip.textContent = it.label;
        var note = document.createElement('p');
        note.className = 'v-note';
        note.textContent = it.note;
        li.appendChild(name); li.appendChild(chip); li.appendChild(note);
        list.appendChild(li);
      });

      document.getElementById('counts-line').innerHTML =
        'Of the six placements checked: <span class="ok">' + counts.agrees + ' agree</span> · ' +
        counts.serves + ' also serve · <span class="warn">' + counts.against + ' work against the grid</span> · ' +
        counts.workable + ' workable.';

      /* fee — or the refusal */
      var defect = document.getElementById('defect');
      var feeBox = document.getElementById('fee-box');
      var refusal = document.getElementById('refusal-box');
      if (defect && defect.checked) {
        feeBox.hidden = true;
        refusal.hidden = false;
      } else {
        refusal.hidden = true;
        feeBox.hidden = false;
        var band = AREA_BANDS[state.area];
        var lines = [{ t: 'Plan reading — ' + band.label.toLowerCase(), v: band.fee }];
        var total = band.fee;
        if (state.floors > 1) {
          var extra = (state.floors - 1) * FLOOR_EXTRA;
          lines.push({ t: 'Floors after the first — ' + (state.floors - 1) + ' × ' + inr(FLOOR_EXTRA), v: extra });
          total += extra;
        }
        var visit = document.getElementById('visit');
        if (visit && visit.checked) {
          lines.push({ t: 'Site visit — Bengaluru', v: VISIT_FEE });
          total += VISIT_FEE;
        }
        var feeLines = document.getElementById('fee-lines');
        feeLines.innerHTML = '';
        lines.forEach(function (l) {
          var row = document.createElement('div');
          row.className = 'fee-line';
          var a = document.createElement('span'); a.textContent = l.t;
          var b = document.createElement('span'); b.textContent = inr(l.v);
          row.appendChild(a); row.appendChild(b);
          feeLines.appendChild(row);
        });
        var trow = document.createElement('div');
        trow.className = 'fee-line total';
        var ta = document.createElement('span'); ta.textContent = 'Total';
        var tb = document.createElement('span'); tb.id = 'fee-total'; tb.textContent = inr(total);
        trow.appendChild(ta); trow.appendChild(tb);
        feeLines.appendChild(trow);
      }
    }

    document.getElementById('plan-go').addEventListener('click', function () {
      var results = document.getElementById('planner-results');
      results.hidden = false;
      shown = true;
      compute();
      results.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* ---------------- contact form ---------------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ref = 'VG-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('conf-ref').textContent = ref;
      var name = document.getElementById('cf-name');
      var who = document.getElementById('conf-name');
      if (name && who && name.value.trim()) who.textContent = name.value.trim().split(' ')[0];
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      var h = conf.querySelector('h3');
      if (h) h.focus();
    });
  }
})();
