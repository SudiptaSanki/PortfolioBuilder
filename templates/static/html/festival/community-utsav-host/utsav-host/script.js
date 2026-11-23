/* Priya Reddy — utsav host
   The run-sheet desk: times, quantities and the two things that go wrong. */

(function () {
  'use strict';

  /* ---------- chrome ---------- */

  var navbtn = document.querySelector('.navbtn');
  var nav = document.getElementById('nav');
  if (navbtn && nav) {
    navbtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        navbtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- the run-sheet ---------- */

  var FESTIVALS = {
    vinayaka: {
      name: 'Vinayaka Chavithi',
      prasad: 'two modak and a kudumulu each',
      prasadG: 120,
      ritual: 'Aarti and the 108 names',
      ritualMin: 25,
      cultural: 'Bhajan group, the children\u2019s kolatam, the prize round',
      slots: 60,
      note: function (s) { return 'Modak steamed in three batches; the third batch has to leave the kitchen by ' + fmt(s.aarti + 10) + '.'; }
    },
    bathukamma: {
      name: 'Bathukamma',
      prasad: 'pulihora, a laddu and buttermilk',
      prasadG: 90,
      ritual: 'The Bathukamma song circle',
      ritualMin: 35,
      cultural: 'The girls\u2019 flower stack, circle songs, the elders\u2019 turn',
      slots: 75,
      note: function () { return 'The stack is built in the morning, not at five; it collapses when it is rushed.'; }
    },
    sankranti: {
      name: 'Sankranti bhogi',
      prasad: 'pongal, a laddu and an ellu-bella packet',
      prasadG: 100,
      ritual: 'Bhogi fire, then the ellu-bella exchange',
      ritualMin: 20,
      cultural: 'Haridasu, the rangoli row, the kite line on the terrace',
      slots: 50,
      note: function () { return 'The fire is lit at the far corner, six metres from the transformer, with two sand buckets beside it.'; }
    },
    deepavali: {
      name: 'Deepavali',
      prasad: 'a laddu, a murukku and a diya to take home',
      prasadG: 110,
      ritual: 'Lakshmi puja and the lamp row',
      ritualMin: 30,
      cultural: 'The lamp row, the children\u2019s skit, the elder\u2019s story',
      slots: 55,
      note: function () { return 'Six hundred diyas, two people with long lighters, and one bucket of water at each end of the row.'; }
    },
    christmas: {
      name: 'Carol evening',
      prasad: 'plum cake and a cup of chai',
      prasadG: 80,
      ritual: 'Lessons and carols, the ninth lesson',
      ritualMin: 20,
      cultural: 'The colony choir, the school brass band, the children\u2019s tableau',
      slots: 65,
      note: function () { return 'The choir stands on the stage, not on the floor; the keyboard needs its own 13 A socket.'; }
    }
  };

  var VENUES = {
    courtyard: { name: 'society courtyard', short: 'courtyard', capacity: 400, lights: 2.0, wasteG: 40, lead: 7, place: 'the society resolution and the secretary\u2019s signature' },
    street: { name: 'street pandal', short: 'street', capacity: 600, lights: 4.0, wasteG: 60, lead: 15, place: 'the police permission and the traffic diversion' },
    hall: { name: 'community hall', short: 'hall', capacity: 250, lights: 3.0, wasteG: 40, lead: 30, place: 'the hall booking and its caretaker' },
    temple: { name: 'temple forecourt', short: 'forecourt', capacity: 800, lights: 3.5, wasteG: 45, lead: 10, place: 'the trust\u2019s written approval' }
  };

  function toMin(s) {
    var p = String(s).split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function fmt(m) {
    m = ((m % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return (h < 10 ? '0' + h : String(h)) + ':' + (mm < 10 ? '0' + mm : String(mm));
  }

  function span(m) {
    if (m <= 0) return 'none';
    var h = Math.floor(m / 60);
    var mm = m % 60;
    if (h === 0) return mm + ' min';
    return h + ' h' + (mm ? ' ' + (mm < 10 ? '0' + mm : mm) : '');
  }

  var el = {
    festival: document.getElementById('d-festival'),
    crowd: document.getElementById('d-crowd'),
    venue: document.getElementById('d-venue'),
    start: document.getElementById('d-start'),
    title: document.getElementById('sheet-title'),
    sub: document.getElementById('sheet-sub'),
    stamp: document.getElementById('sheet-stamp'),
    list: document.getElementById('run-list'),
    foot: document.getElementById('sheet-foot'),
    figures: document.getElementById('figures'),
    watch: document.getElementById('watch-list')
  };

  var deskReady = !!(el.festival && el.list);

  function build(state) {
    var f = FESTIVALS[state.festival];
    var v = VENUES[state.venue];
    var crowd = state.crowd;
    var t0 = toMin(state.start);

    var volunteers = Math.ceil(crowd / 45) + 6;
    var chairs = Math.round((crowd * 0.4) / 10) * 10;
    var prasadKg = Math.ceil((crowd * f.prasadG * 1.08) / 1000 / 5) * 5;
    var water = Math.ceil((crowd * 0.6 + 60) / 10) * 10;
    var power = +(3 + v.lights + (crowd > 600 ? 3.0 : 2.5)).toFixed(1);
    var waste = Math.ceil((crowd * v.wasteG) / 1000);
    var flowers = Math.round(crowd * 0.35);

    var culturalStart = t0 + 20;
    var culturalEnd = culturalStart + f.slots;
    var aartiStart = culturalEnd;
    var aartiEnd = aartiStart + f.ritualMin;
    var prasadBatches = Math.ceil(crowd / 150);
    var prasadStart = aartiEnd + 10;
    var prasadEnd = prasadStart + prasadBatches * 10;
    var windStart = prasadEnd + 10;
    var windEnd = windStart + 25;
    var soundOff = aartiEnd;
    var margin = toMin('22:00') - soundOff;

    var rows = [
      { t: t0 - 90, title: 'Sound check and the first reading', note: 'One operator, one meter at the boundary wall, the volume marked on tape', fixed: true },
      { t: t0 - 45, title: 'Volunteer brief at the gate', note: volunteers + ' people, six of them with a single job each: gate, stage, kitchen, water, first aid, sweep' },
      { t: t0, title: 'Welcome and the lamp', note: 'Two minutes, no speeches before the lamp \u2014 the crowd will not listen yet' },
      { t: culturalStart, title: 'Cultural slots', note: f.cultural + ' \u00b7 ' + f.slots + ' minutes, hard stop' },
      { t: aartiStart, title: f.ritual, note: 'ramp of ' + f.ritualMin + ' minutes; the sound comes down at the end, not after it', fixed: true },
      { t: prasadStart, title: 'Prasadam, ' + prasadBatches + ' batch' + (prasadBatches > 1 ? 'es' : ''), note: prasadKg + ' kg \u2014 ' + f.prasad + '; one counter, one queue, no second helping until the last row is served' },
      { t: windStart, title: 'Wind-down and the sweep', note: 'Chairs stacked, flowers bagged separately, the skip is already at the corner' },
      { t: 22 * 60, title: 'Sound off', note: 'The cut-off in the Noise Pollution Rules. The meter reading goes in the ledger', fixed: true }
    ];

    var figures = [
      ['Volunteers', volunteers, 'one per 45, plus 6 fixed roles'],
      ['Prasadam', prasadKg + ' kg', f.prasadG + ' g a head, plus 8%'],
      ['Chairs', chairs, '40% of the crowd, in tens'],
      ['Water', water + ' L', '0.6 L a head, 60 L for the crew'],
      ['Power', power + ' kW', 'house load, sound and ' + v.short + ' lights'],
      ['Waste', waste + ' kg', v.wasteG + ' g a head, flowers separate'],
      ['Curfew margin', margin > 0 ? span(margin) : 'over', 'aarti ends ' + fmt(aartiEnd) + ', sound off 22:00'],
      ['Arrange in', v.lead + ' days', v.place]
    ];

    var warn = [];
    if (crowd > v.capacity) {
      var sitting = Math.floor(v.capacity * 0.85 / 10) * 10;
      warn.push('<strong>Over capacity by ' + (crowd - v.capacity) + '.</strong> The ' + v.name + ' holds ' + v.capacity + ' with the chairs down. Plan two sittings of ' + sitting + ', the second starting at ' + fmt(aartiEnd + 5) + ', and say so on the sheet \u2014 otherwise the gate does the deciding.');
    }
    if (margin < 45) {
      warn.push('<strong>The aarti ends at ' + fmt(aartiEnd) + ', ' + span(margin) + ' before the cut-off.</strong> One overrun and the last bhajan is a complaint. Move the start to ' + fmt(t0 - (45 - margin)) + ' or cut the cultural block to ' + Math.max(30, f.slots - 20) + ' minutes.');
    } else if (margin > 150) {
      warn.push('<strong>' + span(margin) + ' of room before 22:00.</strong> You can start half an hour later and still keep the margin; the older neighbours will come at 19:00 either way.');
    }
    if (state.venue === 'street') {
      warn.push('<strong>A street pandal needs the police and the traffic diversion.</strong> Apply ' + v.lead + ' days ahead, keep a 4 m fire lane, and put the drum team off the carriageway \u2014 that is the first thing an inspector looks at.');
    }
    if (state.venue === 'hall') {
      warn.push('<strong>The hall\u2019s generator will not carry the sound rig.</strong> Ask the caretaker for the changeover time and keep the aarti on house power; the lights drop for eight seconds when it switches.');
    }
    if (state.venue === 'temple') {
      warn.push('<strong>The inner prakara closes at 21:00.</strong> If the aarti is later than that it happens outside the gate, which is not the same ritual for the elders.');
    }
    if (state.festival === 'bathukamma') {
      warn.push('<strong>' + flowers + ' kg of flowers have to go somewhere.</strong> Book the GHMC compost collection for the morning after; a stack left at the corner tank is what the neighbours remember in November.');
    }
    if (state.festival === 'deepavali') {
      warn.push('<strong>Crackers only 20:00\u201322:00, and never within 100 m of a hospital or school.</strong> Count the children first, keep two sand buckets at the row, and put one adult on the terrace edge.');
    }
    if (state.festival === 'christmas') {
      warn.push('<strong>The choir arrives with its own keyboard and one extension board.</strong> Give it a 13 A socket on the stage side; daisy-chaining into the lighting line trips the whole courtyard.');
    }
    if (state.festival === 'sankranti') {
      warn.push('<strong>The bhogi fire is the one thing that can end the evening early.</strong> Six metres from the transformer, two sand buckets, no plastic, and the fire service number written on the sheet.');
    }
    if (crowd >= 700) {
      warn.push('<strong>At ' + crowd + ' the gate is the bottleneck.</strong> Two volunteers do nothing but the gate, an ambulance is on standby from ' + fmt(t0 - 30) + ', and the prasadam queue starts at the far end, not at the entrance.');
    }
    if (state.start === '19:30') {
      warn.push('<strong>A 19:30 start means a third of the crowd has eaten.</strong> Take the prasadam down by a fifth (' + Math.round(prasadKg * 0.8) + ' kg) and keep the children\u2019s slot first, before the youngest are taken home.');
    }

    return {
      rows: rows,
      figures: figures,
      warnings: warn,
      numbers: {
        volunteers: volunteers, chairs: chairs, prasadKg: prasadKg, water: water,
        power: power, waste: waste, flowers: flowers, soundOff: soundOff,
        margin: margin, aartiEnd: aartiEnd, aartiStart: aartiStart, prasadEnd: prasadEnd,
        windEnd: windEnd, lead: v.lead, culturalStart: culturalStart, culturalEnd: culturalEnd,
        batches: prasadBatches, capacity: v.capacity
      },
      festivalName: f.name,
      venueName: v.name
    };
  }

  function render(state) {
    var out = build(state);
    el.title.innerHTML = out.festivalName + ' &middot; ' + out.venueName;
    el.sub.textContent = state.crowd + ' neighbours from ' + state.start + ' \u2014 ' + FESTIVALS[state.festival].prasad + ', ' + out.numbers.prasadKg + ' kg of it';

    el.stamp.innerHTML = out.numbers.lead + ' days<br>to arrange';
    el.list.innerHTML = out.rows.map(function (r) {
      return '<li' + (r.fixed ? ' class="is-fixed"' : '') + '><time datetime="' + fmt(r.t) + '">' + fmt(r.t) + '</time>' +
        '<div><strong>' + r.title + '</strong><span>' + r.note + '</span></div></li>';
    }).join('');

    el.foot.textContent = 'Sound off at ' + fmt(out.numbers.soundOff) + ' \u00b7 sweepers booked for ' + fmt(out.numbers.windEnd + 10) + ' \u00b7 ' + out.numbers.waste + ' kg of waste, flowers bagged separately';

    el.figures.innerHTML = out.figures.map(function (f) {
      var parts = String(f[1]).split(' ');
      var num = parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : f[1];
      var unit = parts.length > 1 ? ' <small>' + parts[parts.length - 1] + '</small>' : '';
      return '<div><dt>' + f[0] + '</dt><dd>' + num + unit + '</dd><p class="fig-note">' + f[2] + '</p></div>';
    }).join('');

    el.watch.innerHTML = out.warnings.map(function (w) { return '<li>' + w + '</li>'; }).join('');

    window.__runSheet = {
      state: state,
      numbers: out.numbers,
      figures: out.figures,
      warnings: out.warnings,
      title: el.title.textContent,
      sub: el.sub.textContent
    };
  }

  function readState() {
    return {
      festival: el.festival.value,
      crowd: parseInt(el.crowd.value, 10),
      venue: el.venue.value,
      start: el.start.value
    };
  }

  if (deskReady) {
    ['festival', 'crowd', 'venue', 'start'].forEach(function (k) {
      el[k].addEventListener('change', function () { render(readState()); });
    });
    render(readState());
  }

  /* ---------- project filter ---------- */

  var filters = document.querySelector('.filters');
  if (filters) {
    var cases = Array.prototype.slice.call(document.querySelectorAll('[data-utsav]'));
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var want = chip.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      cases.forEach(function (c) {
        c.hidden = want !== 'all' && c.getAttribute('data-utsav') !== want;
      });
    });
  }

  /* ---------- contact form ---------- */

  var form = document.getElementById('brief-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('c-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'Tell me who is writing.' },
      society: { el: document.getElementById('c-society'), test: function (v) { return v.trim().length >= 2; }, msg: 'Which colony or street this is for.' },
      email: { el: document.getElementById('c-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email I can reply to.' },
      phone: { el: document.getElementById('c-phone'), test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Ten digits, so the committee can reach you.' },
      date: { el: document.getElementById('c-date'), test: function (v) { return !!v; }, msg: 'The utsav date the committee has fixed.' },
      message: { el: document.getElementById('c-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'Two lines about the venue and what usually goes wrong there.' }
    };

    function setErr(key, on) {
      var f = fields[key];
      var box = f.el.closest('.field').querySelector('.err');
      if (on) {
        f.el.setAttribute('aria-invalid', 'true');
        box.textContent = f.msg;
      } else {
        f.el.removeAttribute('aria-invalid');
        box.textContent = '';
      }
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
      var agree = document.getElementById('c-agree');
      var agreeErr = document.getElementById('c-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm the committee has agreed to ask.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) {
        var first = form.querySelector('[aria-invalid="true"]') || agree;
        first.focus();
        return;
      }
      var sent = document.getElementById('sent');
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = fields.date.el.value + ' \u00b7 ' + document.getElementById('c-utsav').value;
      document.getElementById('sent-where').textContent = fields.society.el.value.trim();
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
