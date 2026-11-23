/* Sugar Fang — counter, marquee, and the boil calculator. No audio, no libraries. */

(function () {
  'use strict';

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- marquee: duplicate once so the loop is seamless ---------- */
  const track = document.getElementById('marqueeTrack');
  if (track && !reduced) {
    track.innerHTML = track.innerHTML + track.innerHTML;
  }

  /* ---------- nav ---------- */
  const topbar = document.querySelector('.topbar');
  const toggle = document.querySelector('.nav-toggle');
  if (topbar && toggle) {
    toggle.addEventListener('click', () => {
      const open = topbar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    topbar.querySelectorAll('.topnav a').forEach((a) => {
      a.addEventListener('click', () => {
        topbar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- reveal the sweets as they come up ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    const sweets = [...document.querySelectorAll('.sweet, .maker blockquote, .visit-card')];
    sweets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 3) * 60 + 'ms';
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    sweets.forEach((el) => io.observe(el));
  }

  /* ---------- the batch calculator ---------- */
  const CANDY = {
    marshmallow: {
      title: 'Marshmallow skulls',
      temp: 118,
      stage: 'Firm ball',
      range: '116–120°C',
      piece: 50,
      set: '4 hrs',
      note: 'Pull the syrup at 118°C and pour it into bloomed gelatine in a thin stream with the mixer running. Whip twelve minutes until it holds a ribbon, then pipe into the skull tray and cure overnight.',
      ingredients: [['Cane sugar', 330], ['Glucose syrup', 180], ['Water', 140], ['Gelatine', 22], ['Egg white', 40], ['Cornflour, to dust', 70]],
    },
    caramel: {
      title: 'Burnt-sugar caramels',
      temp: 119,
      stage: 'Firm ball',
      range: '118–121°C',
      piece: 22,
      set: '6 hrs',
      note: 'Cook the sugar dry to a dark amber first, then add the butter and cream — it will climb the pot and hiss. Bring back to 119°C, stir in salt, and pour into a lined tray before it starts to set.',
      ingredients: [['Cane sugar', 400], ['Double cream', 300], ['Butter', 80], ['Glucose syrup', 90], ['Flake salt', 5]],
    },
    lollipop: {
      title: 'Sour apple lollipops',
      temp: 150,
      stage: 'Hard crack',
      range: '146–155°C',
      piece: 40,
      set: '1 hr',
      note: 'Hard crack is the point where a drop in cold water snaps. Take it off at 150°C, stir in citric acid and flavour away from the heat, and pour into the moulds with sticks already set.',
      ingredients: [['Cane sugar', 600], ['Glucose syrup', 250], ['Water', 180], ['Citric acid', 6], ['Apple flavour', 4]],
    },
    gummy: {
      title: 'Fangs',
      temp: 107,
      stage: 'Thread',
      range: '106–112°C',
      piece: 30,
      set: '12 hrs',
      note: 'The sugar syrup only needs to reach 107°C; the set comes from gelatine, not from sugar. Bloom the gelatine, whisk it into the syrup, add acid last, and leave the moulds somewhere cool overnight.',
      ingredients: [['Cane sugar', 320], ['Glucose syrup', 220], ['Water', 180], ['Gelatine', 90], ['Citric acid', 12], ['Blackberry flavour', 6]],
    },
    honeycomb: {
      title: 'Cinder honeycomb',
      temp: 150,
      stage: 'Hard crack',
      range: '146–155°C',
      piece: 25,
      set: '2 hrs',
      note: 'At 150°C pull the pot off the heat and whisk in the bicarbonate in one go. It foams up hard and sets almost immediately — pour it straight onto the silpat, do not smooth it, and coat in chocolate once cool.',
      ingredients: [['Cane sugar', 420], ['Golden syrup', 240], ['Water', 60], ['Bicarbonate of soda', 12], ['Dark chocolate', 150]],
    },
    fudge: {
      title: 'Pumpkin fudge',
      temp: 115,
      stage: 'Soft ball',
      range: '113–116°C',
      piece: 28,
      set: '5 hrs',
      note: 'Soft ball is the whole trick: a spoonful dropped in cold water should hold its shape but flatten when you take it out. Cool to 40°C without stirring, then beat it until it loses its shine.',
      ingredients: [['Cane sugar', 450], ['Whole milk', 200], ['Butter', 80], ['Glucose syrup', 60], ['Pumpkin purée', 120], ['Mixed spice', 4]],
    },
  };

  const form = document.getElementById('batchForm');
  const select = document.getElementById('candy');
  const kg = document.getElementById('kg');
  const kgOut = document.getElementById('kgOut');

  function build() {
    if (!select || !kg) return;
    const key = select.value;
    const c = CANDY[key];
    if (!c) return;
    const size = parseFloat(kg.value) || 1;

    if (kgOut) kgOut.textContent = size + ' kg';

    const scale = size * 1000; // grams per kilo of base batch
    const tbody = document.querySelector('#batchTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      c.ingredients.forEach(([name, g]) => {
        const grams = Math.round((g * size) / 5) * 5;
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.textContent = name;
        const td2 = document.createElement('td');
        td2.textContent = grams >= 1000 ? (grams / 1000).toFixed(2) + ' kg' : grams + ' g';
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
      });
    }

    const title = document.getElementById('batchTitle');
    if (title) title.textContent = c.title + ', ' + size + ' kg';

    const note = document.getElementById('batchNote');
    if (note) note.textContent = c.note;

    const count = document.getElementById('batchCount');
    if (count) count.textContent = String(Math.round((size * 1000) / c.piece));

    const piece = document.getElementById('batchPiece');
    if (piece) piece.textContent = String(c.piece);

    const set = document.getElementById('batchSet');
    if (set) set.textContent = c.set;

    const pot = document.getElementById('batchPot');
    if (pot) pot.textContent = Math.max(2, Math.round(size * 2)) + ' L';

    const stageName = document.getElementById('stageName');
    if (stageName) stageName.textContent = c.stage;
    const stageRange = document.getElementById('stageRange');
    if (stageRange) stageRange.textContent = c.range;

    const tempText = document.getElementById('gaugeTemp');
    if (tempText) tempText.textContent = c.temp + '°';

    const needle = document.getElementById('gaugeNeedle');
    const angle = ((c.temp - 100) / 75) * 180 - 90;
    if (needle) needle.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 130 140)');

    const fill = document.getElementById('gaugeFill');
    if (fill) {
      const len = (Math.PI * 100 * (c.temp - 100)) / 75;
      fill.setAttribute('stroke-dasharray', len.toFixed(1) + ' 400');
    }

    return scale;
  }

  // gauge tick marks, drawn once
  const ticks = document.getElementById('gaugeTicks');
  if (ticks) {
    for (let t = 100; t <= 175; t += 15) {
      const a = (((t - 100) / 75) * 180 - 90) * (Math.PI / 180);
      const x1 = 130 + Math.cos(a) * 91;
      const y1 = 140 + Math.sin(a) * 91;
      const x2 = 130 + Math.cos(a) * 84;
      const y2 = 140 + Math.sin(a) * 84;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(1));
      line.setAttribute('y1', y1.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1));
      line.setAttribute('y2', y2.toFixed(1));
      ticks.appendChild(line);
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      build();
    });
  }
  if (select) select.addEventListener('change', build);
  if (kg) kg.addEventListener('input', build);

  build();

  /* ---------- order form on the contact page ---------- */
  const order = document.getElementById('orderForm');
  if (order) {
    const status = document.getElementById('orderStatus');
    order.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(order);
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const boxes = String(d.get('boxes') || '').trim();
      const day = String(d.get('day') || '').trim();
      const bad = [];
      if (name.length < 2) bad.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('a working email');
      if (!boxes) bad.push('how many boxes');
      if (!day) bad.push('the day you will collect');
      if (bad.length) {
        status.className = 'order-status err';
        status.textContent = 'We still need ' + bad.join(', ') + '.';
        return;
      }
      status.className = 'order-status ok';
      status.textContent = 'Held under ' + name.split(' ')[0] + ' for ' + day + '. We will write back to confirm the box count and what is left in the case. Pay at the counter; nothing is charged now.';
      order.reset();
    });
  }
})();
