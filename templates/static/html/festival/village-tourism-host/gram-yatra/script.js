/* Gram Yatra — route sheet and booking. No audio, no libraries. */
(function () {
  'use strict';

  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  var yr = document.getElementById('year');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- the planner ---------- */
  var ACT = {
    farm: {
      name: 'Areca and cardamom walk',
      time: '06.30',
      length: '2 hours',
      km: 1.2, car: 0,
      text: 'Two men cut one tree at a time while you stand on the path and watch. Then the drying yard, the pepper vines climbing the areca, and the reason cardamom likes the shade.'
    },
    kitchen: {
      name: 'Cook a ghatti breakfast',
      time: '09.30',
      length: '2 hours',
      km: 0, car: 0,
      text: 'Rice dough kneaded by hand, broken into a coconut chutney, and a sambar that has been on the fire since six. You will be given a job and it will not be the interesting one.'
    },
    craft: {
      name: 'Weave an areca-leaf plate',
      time: '11.00',
      length: '1 hour 30',
      km: 1.2, car: 0,
      text: 'Two houses down, the Shetty sisters weave leaf plates and cups for the temple. You will make one badly and be allowed to keep it.'
    },
    birds: {
      name: 'Dawn at the tank',
      time: '06.00',
      length: '2 hours',
      km: 2.5, car: 0,
      text: 'The tank behind the plots holds herons, kingfishers and, in December, a pair of lesser whistling ducks. Bring the quiet.'
    },
    yakshagana: {
      name: 'Yakshagana at the school ground',
      time: '20.30',
      length: '3 hours',
      km: 0, car: 8,
      text: 'A night performance, drums and a painted face lit by a petromax, usually lasting until two in the morning. It is loud and it is not shortened for visitors.'
    },
    falls: {
      name: 'Unchalli falls',
      time: '07.00',
      length: 'half a day',
      km: 2, car: 32,
      text: 'A car to the top, then steps down through evergreen forest to the fall. The climb back is the hard part; there is a shop at the top with cold drinks and no ice.'
    },
    temple: {
      name: 'Banavasi, the old Kadamba capital',
      time: '08.00',
      length: 'half a day',
      km: 0.8, car: 44,
      text: 'The Madhukeshwara temple, a stone well that predates it, and a town that was a capital when this district was a kingdom. We leave before the afternoon heat.'
    },
    market: {
      name: 'The weekly haat',
      time: '08.00',
      length: '1 hour',
      km: 0.8, car: 0,
      text: 'Saturday only. Areca, bananas by the bunch, bangles, a man who sharpens knives on a bicycle, and the best jaggery in the taluk.'
    }
  };

  var form = document.getElementById('planner-form');
  if (form) {
    var state = { days: 3, pace: 'even', day: 1, picked: ['farm'] };
    var daysEl = document.getElementById('plan-days');
    var kmEl = document.getElementById('plan-km');
    var carEl = document.getElementById('plan-car');
    var tabsEl = document.getElementById('day-tabs');
    var headEl = document.getElementById('day-heading');
    var slotsEl = document.getElementById('day-slots');
    var plan = [];

    var NUMBER = ['one', 'two', 'three', 'four', 'five'];

    function build() {
      var order = ['farm', 'birds', 'kitchen', 'craft', 'market', 'temple', 'falls', 'yakshagana'];
      var queue = order.filter(function (k) { return state.picked.indexOf(k) >= 0; });
      var planOut = [];
      var day = 1;

      // day one is always arrival, because the road takes longer than anyone believes
      var first = {
        title: 'Day ' + NUMBER[0] + ' — arrive and look around',
        slots: [
          { t: '12.00', text: 'Arrive, tea on the verandah, and a room with a chair facing the plots.', dist: '' },
          { t: '13.00', text: 'Lunch: rice, a dry vegetable, curd and something pickled.', dist: '' }
        ]
      };
      first.slots.push({
        t: '16.00',
        text: 'The farm in an hour — the drying yard, the well, and the shortest path around the plots.',
        dist: '1.2 km on foot'
      });
      first.slots.push({ t: '19.00', text: 'Temple bell, then dinner at half past eight.', dist: '' });
      planOut.push(first);
      queue = queue.filter(function (k) { return k !== 'farm'; });

      for (day = 2; day <= state.days; day++) {
        var last = day === state.days;
        var d = {
          title: 'Day ' + NUMBER[day - 1] + ' — ' + (last ? 'one last walk, then the road home' : 'the village at its own pace'),
          slots: [
            { t: '08.15', text: 'Ghatti breakfast. Filter coffee, and no one will hurry you.', dist: '' }
          ]
        };
        if (state.pace !== 'slow') {
          d.slots.unshift({ t: '06.15', text: 'Tea in bed if you want it, or the verandah if you are up.', dist: '' });
        }
        var a = queue.shift();
        if (a) {
          var A = ACT[a];
          d.slots.push({ t: A.time, text: A.name + ' — ' + A.text, dist: A.length + (A.km ? ' · ' + A.km + ' km on foot' : '') + (A.car ? ' · ' + A.car + ' km by car' : '') });
        } else {
          d.slots.push({ t: '07.00', text: 'A slow morning. The tank path, if you want it, and nothing else arranged.', dist: '2.5 km on foot' });
        }
        if (state.pace !== 'slow') {
          d.slots.push({ t: '13.00', text: 'Lunch, then the house sleeps. So should you.', dist: '' });
          if (state.pace === 'full') {
            var b = queue.shift();
            if (b) {
              var B = ACT[b];
              d.slots.push({ t: '15.30', text: B.name + ' — ' + B.text, dist: B.length + (B.km ? ' · ' + B.km + ' km on foot' : '') + (B.car ? ' · ' + B.car + ' km by car' : '') });
            } else {
              d.slots.push({ t: '16.30', text: 'Tea on the verandah with jaggery, and the book you have not opened.', dist: '' });
            }
          } else {
            d.slots.push({ t: '16.30', text: 'Tea on the verandah, and a chair that does not need company.', dist: '' });
          }
        }
        if (state.picked.indexOf('yakshagana') >= 0 && day === Math.min(2, state.days)) {
          d.slots.push({ t: '20.30', text: 'Yakshagana at the school ground — ' + ACT.yakshagana.text, dist: '3 hours · 8 km by car, and back at two in the morning' });
          queue = queue.filter(function (k) { return k !== 'yakshagana'; });
        } else {
          d.slots.push({ t: '20.30', text: 'Dinner, a lantern on the path, and the dogs settling.', dist: '' });
        }
        planOut.push(d);
      }

      plan = planOut;
      if (state.day > plan.length) state.day = plan.length;
      render();
    }

    function render() {
      daysEl.textContent = String(state.days);

      var km = 0, car = 0;
      plan.forEach(function (d) {
        d.slots.forEach(function (s) {
          var m = /([\d.]+) km on foot/.exec(s.dist);
          if (m) km += Number(m[1]);
          var c = /([\d.]+) km by car/.exec(s.dist);
          if (c) car += Number(c[1]);
        });
      });
      kmEl.textContent = km.toFixed(1).replace(/\.0$/, '') + ' km';
      carEl.textContent = Math.round(car) + ' km';

      tabsEl.innerHTML = '';
      plan.forEach(function (d, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'day-tab' + (i + 1 === state.day ? ' is-set' : '');
        b.dataset.day = String(i + 1);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(i + 1 === state.day));
        b.textContent = 'Day ' + (i + 1);
        b.addEventListener('click', function () {
          state.day = i + 1;
          render();
        });
        tabsEl.appendChild(b);
      });

      var current = plan[state.day - 1];
      headEl.textContent = current.title;
      slotsEl.innerHTML = '';
      current.slots.forEach(function (s) {
        var li = document.createElement('li');
        var t = document.createElement('span');
        t.className = 't';
        t.textContent = s.t;
        var p = document.createElement('p');
        p.textContent = s.text;
        if (s.dist) {
          var d = document.createElement('span');
          d.className = 'dist';
          d.textContent = s.dist;
          p.appendChild(d);
        }
        li.appendChild(t);
        li.appendChild(p);
        slotsEl.appendChild(li);
      });
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b.dataset.days) state.days = Number(b.dataset.days);
      if (b.dataset.pace) state.pace = b.dataset.pace;
      if (b.dataset.interest) {
        var k = b.dataset.interest;
        var idx = state.picked.indexOf(k);
        if (idx >= 0) state.picked.splice(idx, 1);
        else state.picked.push(k);
        b.classList.toggle('is-set', idx < 0);
        b.setAttribute('aria-pressed', String(idx < 0));
        build();
        return;
      }
      Array.prototype.forEach.call(b.parentElement.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      build();
    });

    build();
  }

  /* ---------- walks filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var empty = document.querySelector('.empty-note');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.dataset.filter;
      Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (en) {
        var show = f === 'all' || en.dataset.type === f;
        en.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.classList.toggle('on', shown === 0);
    });
  }

  /* ---------- stay form ---------- */
  var stay = document.getElementById('stay-form');
  if (stay) {
    var sent = document.getElementById('sent');
    var sentName = document.getElementById('sent-name');
    var fields = [
      { id: 's-name', msg: 'Please tell me who is coming.' },
      { id: 's-email', msg: 'An email address, so the reply reaches you.', email: true },
      { id: 's-arrive', msg: 'Pick the day you would arrive.', date: true },
      { id: 's-guests', msg: 'How many of you?' },
      { id: 's-note', msg: 'A line about food, walking and what you hope to see.', min: 6 }
    ];
    var agree = document.getElementById('s-agree');

    stay.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var nameVal = '';
      fields.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!el) return;
        var v = el.value.trim();
        var bad = !v;
        if (!bad && f.email) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && f.date) bad = !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v).getTime());
        if (!bad && f.min) bad = v.length < f.min;
        var wrap = el.closest('.field');
        if (wrap) {
          wrap.classList.toggle('bad', bad);
          var err = wrap.querySelector('.err');
          if (err) err.textContent = bad ? f.msg : '';
        }
        if (bad) ok = false;
        if (f.id === 's-name') nameVal = v;
      });
      if (agree && !agree.checked) {
        ok = false;
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.add('bad');
      }
      if (!ok) {
        var first = stay.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (first) first.focus();
        return;
      }
      if (sentName) sentName.textContent = nameVal.split(' ')[0] || 'friend';
      stay.hidden = true;
      if (sent) {
        sent.hidden = false;
        sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    stay.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('bad') && e.target.value.trim()) {
        wrap.classList.remove('bad');
        var err = wrap.querySelector('.err');
        if (err) err.textContent = '';
      }
      if (agree && agree.checked) {
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.remove('bad');
      }
    });
  }
})();
