/* Abhyanga Calm — navigation, scroll reveal and the dinacharya builder. */
(function () {
  'use strict';

  /* ---------- mobile rail ---------- */
  var rail = document.querySelector('.rail');
  var toggle = document.querySelector('.rail-toggle');
  if (toggle && rail) {
    toggle.addEventListener('click', function () {
      var open = rail.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('open')) {
        rail.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    rail.querySelectorAll('.rail-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        rail.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- reveal on scroll (only for blocks below the first screen) ---------- */
  var blocks = document.querySelectorAll('.sec, .quote-band, .cta-band, .page-head');
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 }) : null;

  blocks.forEach(function (block) {
    if (!io) return;
    if (block.getBoundingClientRect().top > window.innerHeight * 1.1) {
      block.classList.add('rv');
      io.observe(block);
    }
  });

  /* ---------- booking form ---------- */
  var bf = document.getElementById('booking-form');
  if (bf) {
    var status = document.getElementById('form-status');
    var setErr = function (id, msg) {
      var el = document.getElementById('err-' + id);
      if (el) el.textContent = msg || '';
    };
    bf.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var note = document.getElementById('note');
      var agree = document.getElementById('agree');
      var bad = [];
      setErr('name'); setErr('email'); setErr('note'); setErr('agree');
      if (name.value.trim().length < 2) { setErr('name', 'Please give the name you would like me to use.'); bad.push(name); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setErr('email', 'That email does not look complete.'); bad.push(email); }
      if (note.value.trim().length < 12) { setErr('note', 'A sentence or two is enough, but I need something to go on.'); bad.push(note); }
      if (!agree.checked) { setErr('agree', 'Please tick this so I know you have read it.'); bad.push(agree); }
      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'Two or three fields still need you.';
        bad[0].focus();
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note has been checked and dated. This is a portfolio preview, so nothing has been sent anywhere — write to meera@abhyangacalm.in and I will answer within one working day.';
      bf.querySelector('button[type="submit"]').textContent = 'Note ready';
    });
  }

  /* ---------- dinacharya builder ---------- */
  var form = document.getElementById('plan-form');
  if (!form) return;

  var outOil = document.getElementById('out-oil');
  var outMl = document.getElementById('out-ml');
  var outTemp = document.getElementById('out-temp');
  var outMin = document.getElementById('out-min');
  var outNote = document.getElementById('out-note');
  var outSteps = document.getElementById('out-steps');
  var outCaveat = document.getElementById('out-caveat');

  var DOSHA = {
    vata: {
      oil: 'Sesame (tila), warm',
      temp: '39–41 °C',
      base: 20,
      ml: 75,
      note: 'Vata skin drinks oil slowly. Warm the bottle in a bowl of hot water for ten minutes, then work from the crown down with long, steady strokes — no quick rubbing, which scatters an already mobile nervous system.',
      caveat: 'If your hands and feet stay cold after twenty minutes, add a second blanket rather than more oil.'
    },
    pitta: {
      oil: 'Coconut (nalikera), gently warmed',
      temp: '34–36 °C',
      base: 15,
      ml: 55,
      note: 'Pitta runs hot. Coconut is the one oil that cools as it is worked in, and it suits a body that flushes, itches or wakes at two in the morning. Keep the room at 24 °C and the strokes broad, not deep.',
      caveat: 'Skip the steam box in a heatwave. A cool, damp towel on the forehead does the same work without adding heat.'
    },
    kapha: {
      oil: 'Mustard (sarshapa) after dry brushing',
      temp: '40–42 °C',
      base: 18,
      ml: 70,
      note: 'Kapha needs friction before it needs oil. Two minutes of dry brushing with a coarse cotton cloth, then mustard oil, then the longest stroke you can make along the limb — short strokes make a heavy body heavier.',
      caveat: 'Patch-test mustard on the inner forearm; it is pungent and will sting freshly shaved skin.'
    }
  };

  var SEASON = {
    monsoon: {
      label: 'Karkidakam',
      add: 4,
      ml: 10,
      oilSwap: null,
      line: 'Karkidakam is the month Kerala treats. The air is at saturation, old injuries ache, and the classical advice is more oil, more warmth and less travel.',
      caveat: 'In Karkidakam, keep the window shut during svedana. Damp air on hot skin undoes the point of it.'
    },
    winter: {
      label: 'Hemantha',
      add: 3,
      ml: 10,
      oilSwap: null,
      line: 'Cool, dry mornings hold the oil on the skin longer, so a winter abhyanga can run longer without feeling thin.',
      caveat: 'Warm the towel as well as the oil. A cold towel at the end closes the pores you just opened.'
    },
    summer: {
      label: 'Grishma',
      add: -3,
      ml: -10,
      oilSwap: { vata: 'Sesame, cooled to room temperature', pitta: 'Coconut, at room temperature' },
      line: 'In Grishma the oil goes on cooler and comes off sooner; the body is already open and does not need much persuading.',
      caveat: 'Do not follow abhyanga with a hot bath in April or May. Lukewarm water, then shade.'
    }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parseTime(value) {
    var parts = (value || '06:00').split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h)) h = 6;
    if (isNaN(m)) m = 0;
    return h * 60 + m;
  }

  function stamp(total) {
    var t = ((total % 1440) + 1440) % 1440;
    var h = Math.floor(t / 60);
    var m = t % 60;
    var suffix = h < 12 ? 'am' : 'pm';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + pad(m) + ' ' + suffix;
  }

  function render() {
    var dosha = form.querySelector('input[name="dosha"]:checked').value;
    var seasonKey = document.getElementById('season').value;
    var wake = parseTime(document.getElementById('wake').value);
    var stiff = document.getElementById('stiff').checked;

    var d = DOSHA[dosha];
    var s = SEASON[seasonKey];

    var oil = d.oil;
    if (s.oilSwap && s.oilSwap[dosha]) oil = s.oilSwap[dosha];
    if (stiff) oil = 'Mahanarayana, warm';

    var minutes = d.base + s.add + (stiff ? 4 : 0);
    var ml = d.ml + s.ml + (stiff ? 5 : 0);
    var temp = d.temp;
    if (seasonKey === 'summer' && dosha === 'pitta') temp = '32–34 °C';

    outOil.textContent = oil;
    outMl.textContent = ml + ' ml';
    outTemp.textContent = temp;
    outMin.textContent = minutes + ' min';
    outNote.textContent = (stiff ? 'Stiff joints get mahanarayana, which is sesame cooked with bala and some forty herbs. It is slower and heavier than plain sesame; give it the full twenty minutes. ' : '') + s.line + ' ' + d.note;

    var steps = [];
    var t = wake;
    steps.push([t, 'Wake', 'Scrape the tongue, rinse, and drink a glass of warm water. No phone for the first ten minutes.']);
    t += 10;
    if (dosha === 'kapha') {
      steps.push([t, 'Dry brush', 'Two minutes, long strokes toward the heart, until the skin is warm and slightly pink.']);
      t += 3;
    }
    steps.push([t, 'Abhyanga', oil + ', ' + ml + ' ml at ' + temp + ', ' + minutes + ' minutes, crown to soles.']);
    t += minutes;
    steps.push([t, 'Rest', 'Ten minutes in the warm room, oil still on, knees covered. This is where most of the effect settles.']);
    t += 10;
    steps.push([t, 'Bath', 'Warm water, green-gram paste on the oily skin, no soap on the face.']);
    t += 12;
    steps.push([t, 'Breakfast', dosha === 'kapha' ? 'Warm, light and dry: millet porridge with ginger, no cold curd.' : dosha === 'pitta' ? 'Cool and mild: rice flakes with milk, sweet fruit, no chilli or vinegar.' : 'Warm and oily: upma with ghee, a date or two, no dry cereal.']);
    t += 20;
    steps.push([t, 'Begin', 'The first task of the day. The routine has done its work; do not spend it on email.']);

    outSteps.innerHTML = steps.map(function (row) {
      return '<li><span class="t">' + stamp(row[0]) + '</span><span><b>' + row[1] + '</b><span class="d">' + row[2] + '</span></span></li>';
    }).join('');

    outCaveat.textContent = s.caveat + ' ' + d.caveat;
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  render();
})();
