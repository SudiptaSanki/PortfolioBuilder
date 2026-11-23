/* Nandi Sunflower Farm — the field calculator and the planting strip. */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const head = document.querySelector('.site-head');
  const toggle = document.querySelector('.nav-toggle');
  if (head && toggle) {
    toggle.addEventListener('click', () => {
      const open = head.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    head.querySelectorAll('.nav a').forEach((a) => {
      a.addEventListener('click', () => {
        head.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- the field planner ---------- */

  const VARIETIES = {
    morden: { name: 'Morden', days: 85, bloom: [55, 65], yield: 380, note: 'short, open-pollinated, good for a small patch and a dry year' },
    drsh: { name: 'DRSH-1', days: 95, bloom: [60, 70], yield: 450, note: 'the reliable one; what most of Karnataka sows' },
    kbsh: { name: 'KBSH-44', days: 100, bloom: [62, 74], yield: 480, note: 'highest oil, but it wants water at flowering' },
    co2: { name: 'CO-2', days: 90, bloom: [58, 68], yield: 400, note: 'rainfed, shorter, tolerates a late start' },
  };

  const SEED_PER_ACRE = 3.3;     // kg
  const PLANTS_PER_ACRE = 22470; // 60 x 30 cm
  const OIL_RATIO = 0.41;
  const PRESS_EFFICIENCY = 0.88;

  const form = document.getElementById('planForm');
  const areaEl = document.getElementById('area');
  const sowEl = document.getElementById('sow');
  const varietyEl = document.getElementById('variety');

  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + n);
    return d;
  }
  function commas(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function drawStrip(v, bloomStart, bloomEnd) {
    const svg = document.getElementById('stageSvg');
    const marks = document.getElementById('stageMarks');
    const fill = document.getElementById('stageFill');
    const end = document.getElementById('stageEnd');
    const note = document.getElementById('stageNote');
    if (!svg || !marks) return;

    const total = v.days;
    const X0 = 20, X1 = 700;
    const x = (day) => X0 + (Math.min(day, total) / total) * (X1 - X0);

    marks.innerHTML = '';
    if (fill) fill.setAttribute('x2', String(X1));
    if (end) end.textContent = 'day ' + total;

    // flowering window as a shaded band
    const band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    band.setAttribute('x', x(v.bloom[0]).toFixed(1));
    band.setAttribute('y', '56');
    band.setAttribute('width', Math.max(6, x(v.bloom[1]) - x(v.bloom[0])).toFixed(1));
    band.setAttribute('height', '20');
    band.setAttribute('fill', '#f2b02a');
    band.setAttribute('opacity', '0.35');
    marks.appendChild(band);

    const stages = [
      { day: 0, label: 'sown' },
      { day: 6, label: 'up' },
      { day: 35, label: 'bud' },
      { day: v.bloom[0], label: 'first flower' },
      { day: total, label: 'harvest' },
    ];

    stages.forEach((s, i) => {
      const cx = x(s.day);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx.toFixed(1));
      c.setAttribute('cy', '66');
      c.setAttribute('r', '5');
      c.setAttribute('fill', '#1f2b1a');
      marks.appendChild(c);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', cx.toFixed(1));
      t.setAttribute('y', i % 2 === 0 ? '40' : '34');
      t.setAttribute('text-anchor', cx > 660 ? 'end' : cx < 40 ? 'start' : 'middle');
      t.setAttribute('font-family', "'Space Mono', monospace");
      t.setAttribute('font-size', '9.5');
      t.setAttribute('fill', '#3c4a33');
      t.textContent = s.label;
      marks.appendChild(t);
    });

    if (note) {
      note.textContent = 'Six days to come up, thirty-five to the bud, ' + v.bloom[0] +
        ' to the first open flower, ' + v.days + ' to the combine. ' + v.name + ' ' + v.note + '.';
    }
  }

  function build() {
    if (!areaEl || !sowEl || !varietyEl) return;
    const acres = Math.max(0.25, Math.min(200, parseFloat(areaEl.value) || 0.25));
    const v = VARIETIES[varietyEl.value] || VARIETIES.drsh;
    const sow = addDays(sowEl.value, 0);
    if (!sow) return;

    const seed = acres * SEED_PER_ACRE;
    const plants = acres * PLANTS_PER_ACRE;
    const bloomStart = addDays(sowEl.value, v.bloom[0]);
    const bloomEnd = addDays(sowEl.value, v.bloom[1]);
    const harvest = addDays(sowEl.value, v.days);
    const yieldKg = acres * v.yield;
    const oil = yieldKg * OIL_RATIO * PRESS_EFFICIENCY;

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('outSeed', seed < 10 ? seed.toFixed(1) + ' kg' : commas(seed) + ' kg');
    set('outPlants', commas(plants));
    set('outBloom', fmtDate(bloomStart) + '–' + fmtDate(bloomEnd));
    set('outHarvest', fmtDate(harvest));
    set('outYield', commas(yieldKg) + ' kg');
    set('outOil', commas(oil) + ' L');

    const seedNote = document.querySelector('#outSeed + .fig-note');
    if (seedNote) seedNote.textContent = 'at ' + SEED_PER_ACRE + ' kg per acre, thinned to one plant';
    const plantsNote = document.querySelector('#outPlants + .fig-note');
    if (plantsNote) plantsNote.textContent = '60 × 30 cm spacing, ' + commas(acres * 0.4047) + ' ha';

    drawStrip(v, bloomStart, bloomEnd);
  }

  if (form) {
    form.addEventListener('submit', (e) => { e.preventDefault(); build(); });
    [areaEl, sowEl, varietyEl].forEach((el) => {
      if (el) el.addEventListener('input', build);
      if (el) el.addEventListener('change', build);
    });
  }
  build();

  /* ---------- enquiry form ---------- */
  const enquiry = document.getElementById('visitForm');
  if (enquiry) {
    const status = document.getElementById('visitStatus');
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(enquiry);
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const day = String(d.get('day') || '').trim();
      const people = String(d.get('people') || '').trim();
      const msg = String(d.get('message') || '').trim();
      const bad = [];
      if (name.length < 2) bad.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('a working email');
      if (!people) bad.push('how many of you');
      if (bad.length) {
        status.className = 'visit-status err';
        status.textContent = 'Please add ' + bad.join(', ') + '.';
        return;
      }
      status.className = 'visit-status ok';
      status.textContent = 'Thank you, ' + name.split(' ')[0] + '. ' +
        (Number(people) > 12 ? 'A group that size needs the gate opened early; I will telephone you to arrange it.'
          : 'No booking needed for ' + (day || 'the day you have in mind') + '; come between six and ten and look for the yellow gate.');
      enquiry.reset();
    });
  }
})();
