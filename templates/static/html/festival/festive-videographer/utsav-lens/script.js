/* Kabir Sen — festival films
   The shot planner: what the cut actually takes, in minutes, cards and batteries. */

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

  var FESTIVALS = {
    durga: {
      name: 'Durga Puja', city: 'Kolkata',
      moment: 'Sandhi puja', momentTime: '21:00', callLead: 100, wrapAfter: 95,
      traps: [
        '<strong>Dhunuchi smoke kills autofocus.</strong> From the first coconut husk on, switch to manual and let peaking find the dancer; the smoke also eats 30% of your contrast, so expose a stop under.',
        '<strong>Sindoor khela and a lens do not mix.</strong> A clear filter you can wipe and a rain cover on the body; keep a second filter in a pocket, not in the bag on the other side of the crowd.',
        '<strong>The dhaak will clip every lav.</strong> Record the drum with the shotgun and the ambient with a recorder at the wall; the lav is only for the priest and the family.'
      ],
      shots: [
        ['Kumortuli, idol before paint', 'The clay still wet, the eyes not opened', 300, true],
        ['Pandal build, bamboo and cloth', 'Wide, from the street corner, 14 mm', 220, false],
        ['Anjali, the offertory line', 'Hands and flowers, 70–200 from the side', 260, true],
        ['Dhunuchi naach', 'Manual focus, 55 mm, f/2, smoke in the backlight', 340, true],
        ['Sandhi puja, the 24 minutes', 'Roll ten minutes early, two angles, no cuts', 1500, true],
        ['Aarti, the whole courtyard', 'High angle from the balcony opposite', 300, true],
        ['Priest and family, close', 'The face during the last mantra', 240, true],
        ['Crowd moving between pandals', 'Walking shot, 35 mm, one lane', 280, false],
        ['Sindoor khela, Dashami', 'Wide then tight, filter wiped between', 320, true],
        ['Bishorjon at the ghat', 'Idol into water, 02:00, one body on the steps', 420, true]
      ]
    },
    chhath: {
      name: 'Chhath Puja', city: 'Patna ghats',
      moment: 'Usha arghya', momentTime: '04:40', callLead: 100, wrapAfter: 80,
      traps: [
        '<strong>There is no light at 03:30.</strong> The 35 mm f/1.4 at ISO 3200 is the only lens that gets the walk down; a phone torch ruins the faces and the mood.',
        '<strong>Wet steps and a tripod.</strong> A tripod on the ghat legs will slide as the crowd presses; use a monopod or shoot handheld with the strap round your wrist.',
        '<strong>Sunrise is the whole point and it flares.</strong> Expose for the faces with the sun behind you, then turn for three frames of the flare at the end of the arghya.'
      ],
      shots: [
        ['The 03:30 walk to the ghat', 'Handheld, 35 mm, ISO 3200, people in ones and twos', 420, true],
        ['Thekua and the bamboo dalia being carried', 'Hands, low angle, 55 mm', 240, true],
        ['Steps filling before light', 'Wide from the top of the ghat, then a tilt down', 300, true],
        ['The first lamp on the water', 'Close, 85 mm, f/2, the flame only', 220, true],
        ['Family in the water, arghya', 'From the side at knee height, water in frame', 480, true],
        ['Priest on the platform', '70–200, silhouetted against the river', 300, true],
        ['Sunrise over the far bank', 'One long hold, no pan', 240, true],
        ['Prasad sharing after', 'The circle, the leaf plates, laughter', 260, false],
        ['The ghat emptying at 07:00', 'Wide, high, from the same step as the start', 200, true]
      ]
    },
    ganesh: {
      name: 'Ganesh visarjan', city: 'Mumbai',
      moment: 'Immersion at the water', momentTime: '22:30', callLead: 110, wrapAfter: 90,
      traps: [
        '<strong>Salt water and sand end lenses.</strong> Rain cover, dry bag, and no lens changes on the beach; the second body stays sealed until the idol is in the water.',
        '<strong>The lane is narrower than the idol.</strong> One camera walks backwards with a spotter behind it; the other stays at the corner. Do not try to cover both with one body.',
        '<strong>The crowd surge at the corner is the only real risk.</strong> Keep the camera above head height on a monopod and your back to a wall, and know where the police line is before it matters.'
      ],
      shots: [
        ['The mandal at 17:00, still full', 'Wide, 14 mm, the idol and the pandal roof', 260, false],
        ['Aarti before the procession', 'Two angles, the drum close', 340, true],
        ['Lifting the idol onto the truck', 'Low angle, 35 mm, hands and ropes', 300, true],
        ['The lane, backwards walk', '55 mm, steady, the idol fills the frame at the corner', 720, true],
        ['Corner turn, eleven men', 'From the corner, static, 24 mm', 260, true],
        ['Crowd faces at the side', '70–200, the ones not shouting', 280, true],
        ['The beach at arrival', 'Wide, high, the line of trucks', 260, true],
        ['Immersion', 'Idol into water, one body low, one on the shoulder', 600, true],
        ['After, the empty truck', 'Static, 30 seconds is enough', 120, false]
      ]
    },
    onam: {
      name: 'Onam', city: 'Thrissur',
      moment: 'Pulikali at the vadakkunnathan', momentTime: '16:00', callLead: 90, wrapAfter: 85,
      traps: [
        '<strong>Pulikali paint is charcoal and turmeric.</strong> It stains a cloth lens wipe and then smears it; use a wet wipe once, then a fresh cloth.',
        '<strong>The pookalam at dawn is flat, open shade.</strong> It will look like a carpet unless you put a person at the edge for scale and shoot from knee height with the lamp light raking across.',
        '<strong>The vallam kali is far away.</strong> From the bank a 200 mm is still short; get on a boat or accept that the race is a wide shot with a long lens on the bank and the sound doing the work.'
      ],
      shots: [
        ['Pookalam at 06:00', 'Knee height, raking light, one hand in frame for scale', 280, true],
        ['The sadya being served', 'Overhead, banana leaf line, hands only', 260, true],
        ['Pulikali bodies being painted', 'Close, 55 mm, charcoal and turmeric', 240, true],
        ['Pulikali at the temple', 'Wide then 70–200, drummers in the same frame', 420, true],
        ['Vallam kali from the bank', '200 mm, the oars in rhythm, hold long', 360, true],
        ['The crowd under the trees', 'Static, 35 mm, heat and shade', 220, false],
        ['Children in new clothes', 'The ones watching, not posing', 200, true],
        ['Evening lamps at the temple', 'Slow, f/2, the flame and the stone', 260, true]
      ]
    },
    karthigai: {
      name: 'Karthigai Deepam', city: 'Tiruvannamalai',
      moment: 'Maha deepam', momentTime: '18:00', callLead: 100, wrapAfter: 80,
      traps: [
        '<strong>The flame is a pinprick on a hill.</strong> Expose for the flame and let the hill go dark, or expose for the hill and lose the moment. Shoot both, decide in the edit.',
        '<strong>Ten thousand lamps make moiré.</strong> Keep the wide lens off the lamp rows; a 70 mm at f/4 separates the flames instead of turning them into a screen.',
        '<strong>Girivalam at night is a long walk.</strong> One body, one 35 mm, a battery in the pocket and no tripod; the crowd moves faster than you think.'
      ],
      shots: [
        ['Lamp rows at the temple gate', '55 mm, f/2.8, flames separated', 260, true],
        ['Girivalam walkers at dusk', 'Walking backwards, 35 mm, 20 minutes of it', 600, true],
        ['The hill before the flame', 'Wide, 14 mm, people as scale', 240, true],
        ['Maha deepam lit', '200 mm, hold long, then the crowd sound', 300, true],
        ['Faces turned up to the hill', '70–200, the reflection in the eyes', 260, true],
        ['The temple tank at night', 'Static, lamps reflected', 220, false],
        ['Prasad queue after', 'Wide, low, movement', 200, false],
        ['A single lamp being lit', 'Macro, hands, 85 mm', 180, true]
      ]
    }
  };

  var CUTS = {
    reel: { name: '60-second reel, vertical', mins: 14, ratio: '9:16', shotsCap: 10 },
    film: { name: '4-minute film, horizontal', mins: 35, ratio: '16:9', shotsCap: 10 },
    doc: { name: '12-minute documentary', mins: 110, ratio: '16:9', shotsCap: 12 }
  };

  var CREW = { 1: { label: 'one body', factor: 1, name: 'just me' }, 2: { label: 'two bodies', factor: 1.45, name: 'me and a second camera' }, 3: { label: 'three bodies and a recordist', factor: 1.85, name: 'three, with sound' } };

  var LIGHT = {
    day: { label: 'daylight', batteries: 4, note: 'ND for the wide, and shade for the close-ups' },
    dusk: { label: 'dusk into night', batteries: 5, note: 'the twenty minutes when the lamps come on are the film' },
    night: { label: 'after dark', batteries: 6, note: 'f/1.4 and ISO 3200; grain is honest, noise reduction is not' }
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function clock(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
  }

  function secs(s) {
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + pad(r);
  }

  var el = {
    festival: document.getElementById('p-festival'),
    cut: document.getElementById('p-deliverable'),
    crew: document.getElementById('p-crew'),
    light: document.getElementById('p-light'),
    no: document.getElementById('call-no'),
    title: document.getElementById('call-title'),
    sub: document.getElementById('call-sub'),
    take: document.getElementById('call-take'),
    shots: document.getElementById('shot-list'),
    kit: document.getElementById('kit'),
    traps: document.getElementById('trap-list'),
    foot: document.getElementById('call-foot')
  };

  var ready = !!(el.festival && el.shots);

  function plan(state) {
    var f = FESTIVALS[state.festival];
    var cut = CUTS[state.cut];
    var crew = CREW[state.crew];
    var light = LIGHT[state.light];

    var footage = Math.round(cut.mins * crew.factor);
    var gb = Math.round(footage * 1.9);
    var cards = Math.ceil(gb / 128);
    var batteries = Number(state.crew) * light.batteries;
    var shotCount = Math.min(cut.shotsCap, f.shots.length);

    var chosen = f.shots.slice(0, shotCount);
    var base = chosen.reduce(function (a, s) { return a + s[2]; }, 0);
    var target = footage * 60;
    var factor = target / base;

    var callMin = toMin(f.momentTime) - f.callLead;
    var wrap = toMin(f.momentTime) + f.wrapAfter;

    var traps = f.traps.slice();
    if (state.crew === '1' && state.cut === 'doc') {
      traps.push('<strong>A twelve-minute documentary on one body means no cutaways while the moment happens.</strong> Either take a second body for the ritual hours or write it as a single-subject film and accept the long takes.');
    }
    if (state.crew === '3' && state.cut === 'reel') {
      traps.push('<strong>Three bodies for a sixty-second reel is more footage than you will ever cut.</strong> Send the third to the side of the stage for next year\u2019s library, or leave it in the bag and keep the crew small.');
    }
    if (state.light === 'night') {
      traps.push('<strong>After dark, the 70\u2013200 is too slow for a moving crowd.</strong> The 35 mm f/1.4 gets the film; the zoom gets a tripod shot that nobody uses.');
    }
    if (state.cut === 'reel') {
      traps.push('<strong>Vertical is a different frame, not a crop.</strong> Protect the top third for the caption, shoot 4K 50 for the two-times slow motion, and never crop a horizontal frame of a lamp row \u2014 the lamps fall outside.');
    }
    if (state.cut === 'doc') {
      traps.push('<strong>Interviews take twenty minutes each, plus a consent card.</strong> Budget them before the aarti, not after, and never with a family that is waiting to leave for the ghat.');
    }
    if (state.festival === 'durga' && state.cut !== 'reel') {
      traps.push('<strong>Sandhi puja cannot be repeated.</strong> Roll from ten minutes before the bell and let it run; a missed sandhi is a missed year.');
    }

    return {
      f: f, cut: cut, crew: crew, light: light,
      footage: footage, gb: gb, cards: cards, batteries: batteries,
      chosen: chosen.map(function (s, i) {
        return { n: pad(i + 1), name: s[0], note: s[1], sec: Math.max(15, Math.round(s[2] * factor / 5) * 5), must: s[3] };
      }),
      shotCount: shotCount,
      call: clock(callMin), wrap: clock(wrap), moment: f.momentTime,
      traps: traps
    };
  }

  function toMin(t) {
    var p = t.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function render(state) {
    var p = plan(state);
    el.no.textContent = 'CALL SHEET \u00b7 ' + pad(Number(state.crew)) + ' \u00b7 ' + p.f.name.toUpperCase();
    el.title.textContent = p.f.name + ' \u00b7 ' + p.cut.name;
    el.sub.textContent = p.crew.label + ', ' + p.light.label + ', ' + p.footage + ' minutes of footage for a ' + p.cut.name.split(',')[0] + ' \u2014 ' + p.shotCount + ' set-ups; the moment is ' + p.moment + ' at ' + p.f.moment;
    el.take.textContent = pad(Number(state.crew));

    el.shots.innerHTML = p.chosen.map(function (s) {
      return '<li' + (s.must ? ' class="is-must"' : '') + '><span class="n">' + s.n + '</span>' +
        '<span class="nm">' + s.name + '<span>' + s.note + '</span></span>' +
        '<span class="d">' + secs(s.sec) + '</span>' +
        '<span class="pr">' + (s.must ? 'must' : 'nice') + '</span></li>';
    }).join('');

    var kit = [
      ['Footage', p.footage + ' min', p.cut.ratio + ', 4K 25p 10-bit'],
      ['Cards', p.cards + ' \u00d7 128 GB', p.gb + ' GB at 250 Mbps'],
      ['Batteries', p.batteries + '', p.crew.label + ', ' + p.light.batteries + ' each'],
      ['Backup', (p.gb * 2) + ' GB', 'two drives, before sleep']
    ];
    el.kit.innerHTML = kit.map(function (k) {
      return '<div><dt>' + k[0] + '</dt><dd>' + k[1] + '<small>' + k[2] + '</small></dd></div>';
    }).join('');

    el.traps.innerHTML = p.traps.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    var lightNote = p.light.note;
    if (state.festival === 'chhath' && state.light !== 'day') lightNote = 'no light before 05:10; the lamp and the faces are the exposure, and the ghat steps are the tripod';
    el.foot.textContent = 'Call ' + p.call + ' \u00b7 ' + p.moment + ' at ' + p.f.moment + ' \u00b7 wrap ' + p.wrap + ' \u00b7 ' + lightNote;

    window.__shotPlan = {
      state: state,
      numbers: { footage: p.footage, gb: p.gb, cards: p.cards, batteries: p.batteries, shots: p.shotCount, call: p.call, wrap: p.wrap },
      traps: p.traps,
      title: el.title.textContent,
      sub: el.sub.textContent,
      shots: p.chosen
    };
  }

  function state() {
    return { festival: el.festival.value, cut: el.cut.value, crew: el.crew.value, light: el.light.value };
  }

  if (ready) {
    ['festival', 'cut', 'crew', 'light'].forEach(function (k) {
      el[k].addEventListener('change', function () { render(state()); });
    });
    render(state());
  }

  /* films filter */
  var filters = document.querySelector('.filters');
  if (filters) {
    var films = Array.prototype.slice.call(document.querySelectorAll('[data-fest]'));
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var want = chip.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      films.forEach(function (f) { f.hidden = want !== 'all' && f.getAttribute('data-fest') !== want; });
    });
  }

  /* booking form */
  var form = document.getElementById('booking-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('b-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'Who is writing.' },
      org: { el: document.getElementById('b-org'), test: function (v) { return v.trim().length >= 2; }, msg: 'The pandal committee, family or brand.' },
      email: { el: document.getElementById('b-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email that works.' },
      phone: { el: document.getElementById('b-phone'), test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Ten digits; I will call before I write.' },
      date: { el: document.getElementById('b-date'), test: function (v) { return !!v; }, msg: 'The date of the festival, not of the shoot.' },
      message: { el: document.getElementById('b-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'The moment you cannot lose, and the venue.' }
    };
    function setErr(k, on) {
      var f = fields[k];
      var box = f.el.closest('.field').querySelector('.err');
      f.el.setAttribute('aria-invalid', on ? 'true' : 'false');
      if (!on) f.el.removeAttribute('aria-invalid');
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
      var agree = document.getElementById('b-agree');
      var agreeErr = document.getElementById('b-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm you are the person who will answer the phone.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) { (form.querySelector('[aria-invalid="true"]') || agree).focus(); return; }
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = fields.date.el.value + ' \u00b7 ' + document.getElementById('b-festival').value;
      document.getElementById('sent-where').textContent = document.getElementById('b-city').value;
      form.hidden = true;
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
