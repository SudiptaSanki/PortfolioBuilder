/* Hollow Pine Farm — christmas tree farmer
   Nav, reveal, the tree finder, and the visit request. */

(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

/* ---------- visit request ---------- */
  const visit = document.getElementById('visitForm');
  if (visit) {
    const status = document.getElementById('formStatus');
    visit.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(visit);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const when = String(data.get('when') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || when.length < 2 || message.length < 8) {
        status.className = 'form-status err';
        status.textContent = 'Please add your name, a working email, the day you have in mind, and how many are coming.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${name.split(' ')[0]}. Ellen or I will write back within a day; the gate is open until 4 pm, and later on weekends.`;
      visit.reset();
    });
  }

  /* ---------- tree finder ---------- */
  const finder = document.getElementById('finderForm');
  if (!finder) return;

  const heightEl = document.getElementById('height');
  const heightOut = document.getElementById('heightOut');
  const resultName = document.getElementById('resultName');
  const resultLatin = document.getElementById('resultLatin');
  const resultBody = document.getElementById('resultBody');
  const resultPrice = document.getElementById('resultPrice');
  const resultYears = document.getElementById('resultYears');
  const resultPlot = document.getElementById('resultPlot');
  const resultTrim = document.getElementById('resultTrim');

  const SPECIES = {
    fraser: {
      name: 'Fraser fir',
      latin: 'Abies fraseri',
      base: 78,
      rate: 11,
      years: 7,
      plot: 'Plot 1 · rows 3–9',
      body: 'Fraser is the tree most people are describing when they say “a Christmas tree”: dense, dark needles, a scent that fills the room, and the best needle retention of anything we grow. It is also the slowest and the dearest, which is why we only plant it where the soil drains.'
    },
    balsam: {
      name: 'Balsam fir',
      latin: 'Abies balsamea',
      base: 62,
      rate: 9,
      years: 6,
      plot: 'Plot 2 · rows 1–6',
      body: 'Balsam is the Vermont native and the strongest smell on the farm — the resinous one people remember from childhood. The branches are narrower and a little open, which lets the lights through instead of sitting on top of them. It will drop a few needles by New Year, and nobody has ever minded.'
    },
    canaan: {
      name: 'Canaan fir',
      latin: 'Abies balsamea var. phanerolepis',
      base: 69,
      rate: 10,
      years: 7,
      plot: 'Plot 3 · rows 2–8',
      body: 'Canaan sits between the other two: fuller than balsam, softer than Fraser, and the most forgiving in a dry room over a radiator. If your tree goes up early and comes down late, this is the one I would walk you toward.'
    }
  };

  function chosen(name) {
    const el = finder.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function recommend() {
    const height = Number(heightEl.value);
    const drop = chosen('drop') || 'low';
    const want = chosen('want') || 'scent';
    const scores = { fraser: 0, balsam: 0, canaan: 0 };

    if (drop === 'low') { scores.fraser += 2; scores.canaan += 1; }
    if (drop === 'some') { scores.fraser += 1; scores.balsam += 1; }
    if (drop === 'lots') { scores.balsam += 2; scores.canaan += 1; }
    if (want === 'scent') { scores.balsam += 2; scores.fraser += 1; }
    if (want === 'shape') { scores.fraser += 2; scores.canaan += 1; }
    if (want === 'budget') { scores.balsam += 2; scores.canaan += 1; }
    if (height >= 9.5) { scores.canaan += 1; }
    if (height <= 7.5 && want === 'shape') { scores.fraser += 1; }

    let best = 'fraser';
    Object.keys(scores).forEach((k) => { if (scores[k] > scores[best]) best = k; });
    return { key: best, height };
  }

  function render() {
    const { key, height } = recommend();
    const s = SPECIES[key];
    const price = s.base + Math.round(Math.max(0, height - 7) * s.rate);
    resultName.textContent = s.name;
    resultLatin.textContent = s.latin;
    resultBody.innerHTML = `<p>${s.body}</p>`;
    resultPrice.textContent = `$${price}`;
    resultYears.textContent = `${s.years}`;
    resultPlot.textContent = s.plot.split(' · ')[0];
    resultTrim.textContent = `${(height - 1).toFixed(1).replace('.0', '')} ft`;
    heightOut.textContent = `${height.toFixed(1).replace('.0', '')} ft`;
  }

  finder.addEventListener('submit', (e) => { e.preventDefault(); render(); });
  heightEl.addEventListener('input', render);
  finder.querySelectorAll('input[type="radio"]').forEach((r) => r.addEventListener('change', render));
  render();

})();
