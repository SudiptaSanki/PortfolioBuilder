/* Jyotish Night — sky, chart sketch, casebook, sitting request */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAD = Math.PI / 180;
  const mod360 = (x) => ((x % 360) + 360) % 360;

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!reduce) {
    $$('.hero-copy, .wheel-figure, .section-head, .premise-grid article, .kundli-head, .kundli-body, .offer-grid article, .method-inner, .outro > div, .prose > *, .reader-photo, .case, .side-block, .sit-form')
      .forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    $$('.rv').forEach((el) => io.observe(el));
  }

  /* ---------- astronomy (low precision) ---------- */
  function jdFromUTC(d) { return d.getTime() / 86400000 + 2440587.5; }
  function sunTropical(jd) {
    const n = jd - 2451545.0;
    const L = 280.460 + 0.9856474 * n;
    const g = (357.528 + 0.9856003 * n) * RAD;
    return mod360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  }
  function moonTropical(jd) {
    const n = jd - 2451545.0;
    const Lp = 218.316 + 13.176396 * n;
    const M = (134.963 + 13.064993 * n) * RAD;
    const D = (297.850 + 12.190749 * n) * RAD;
    const F = (93.272 + 13.229350 * n) * RAD;
    const Ms = (357.528 + 0.9856003 * n) * RAD;
    return mod360(Lp + 6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D)
      + 0.214 * Math.sin(2 * M) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F));
  }
  function ayanamsa(jd) {
    const y = 2000 + (jd - 2451545.0) / 365.25;
    return 23.85 + 0.01397 * (y - 2000);
  }
  function ascendantTropical(jd, lat, lon) {
    const T = (jd - 2451545) / 36525;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
    const lst = mod360(gmst + lon);
    const eps = (23.4393 - 0.0000004 * (jd - 2451545)) * RAD;
    const ramc = lst * RAD;
    const phi = lat * RAD;
    const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
    return mod360(asc / RAD);
  }

  const rashiShort = ['Mes', 'Vri', 'Mit', 'Kar', 'Sim', 'Kan', 'Tul', 'Vsc', 'Dha', 'Mak', 'Kum', 'Mee'];
  const rashis = [
    ['Mesha', 'Aries', 'fire'], ['Vrishabha', 'Taurus', 'earth'], ['Mithuna', 'Gemini', 'air'],
    ['Karka', 'Cancer', 'water'], ['Simha', 'Leo', 'fire'], ['Kanya', 'Virgo', 'earth'],
    ['Tula', 'Libra', 'air'], ['Vrishchika', 'Scorpio', 'water'], ['Dhanu', 'Sagittarius', 'fire'],
    ['Makara', 'Capricorn', 'earth'], ['Kumbha', 'Aquarius', 'air'], ['Meena', 'Pisces', 'water'],
  ];
  const rashiLines = [
    'Aries starts things and is bored by the middle. The courage is real; the follow-through is the practice.',
    'Taurus takes time to decide and then does not move. Comfort is not laziness here, it is how the work gets done.',
    'Gemini thinks aloud. The gift is language; the discipline is finishing a sentence before starting the next.',
    'Cancer remembers. Home is not a place but a temperature, and the work is learning not to keep everyone outside it.',
    'Leo needs the room to see the work. The generosity is real when the applause is not the point.',
    'Virgo improves what is already good, which is useful and exhausting. The remedy is a deadline, not more analysis.',
    'Libra sees both sides, which makes for a good judge and a slow decision. The practice is choosing.',
    'Scorpio goes to the bottom of things. Loyalty is total and so is the memory of a wound; both need tending.',
    'Sagittarius aims at meaning. The risk is the lecture; the gift is the map.',
    'Capricorn builds slowly and does not need to be seen doing it. Rest is the discipline, not the reward.',
    'Aquarius stands a little to one side and sees the system. The work is to come back into the room.',
    'Pisces dissolves the boundary between self and weather. Beautiful for art, hard for a Tuesday.',
  ];
  const nakshatras = [
    ['Ashwini', 'quick to begin, impatient with the end'], ['Bharani', 'carries weight and learns restraint'],
    ['Krittika', 'cuts cleanly, sometimes too cleanly'], ['Rohini', 'makes things grow and wants to be admired for it'],
    ['Mrigashira', 'searching, never quite settled'], ['Ardra', 'storm and clarity after it'],
    ['Punarvasu', 'returns, repairs, gives second chances'], ['Pushya', 'nourishes; the risk is over-care'],
    ['Ashlesha', 'coiled, perceptive, slow to trust'], ['Magha', 'ancestral, proud, carries a name'],
    ['Purva Phalguni', 'pleasure and play as serious work'], ['Uttara Phalguni', 'loyalty, contracts, the long friendship'],
    ['Hasta', 'skilled hands, dry humour'], ['Chitra', 'makes the beautiful thing visible'],
    ['Swati', 'independent, a little windblown'], ['Vishakha', 'ambition with a fork in the road'],
    ['Anuradha', 'devotion, friendship as a practice'], ['Jyeshtha', 'seniority, protection, a hard edge'],
    ['Mula', 'roots and uprooting'], ['Purva Ashadha', 'invincible early, careful later'],
    ['Uttara Ashadha', 'the long win, the late reward'], ['Shravana', 'listening, learning, carrying news'],
    ['Dhanishta', 'rhythm, wealth, the drum'], ['Shatabhisha', 'the healer who keeps a distance'],
    ['Purva Bhadrapada', 'intensity that frightens even the owner'], ['Uttara Bhadrapada', 'depth, patience, a quiet floor'],
    ['Revati', 'the last mile, the gentle ending'],
  ];
  const tithiNames = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
  const tithiNamesK = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'];
  const varas = ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara'];
  const varaEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const cities = {
    chennai: { name: 'Chennai', lat: 13.08, lon: 80.27 },
    mumbai: { name: 'Mumbai', lat: 19.08, lon: 72.88 },
    delhi: { name: 'Delhi', lat: 28.61, lon: 77.21 },
    kolkata: { name: 'Kolkata', lat: 22.57, lon: 88.36 },
    bengaluru: { name: 'Bengaluru', lat: 12.97, lon: 77.59 },
    hyderabad: { name: 'Hyderabad', lat: 17.39, lon: 78.49 },
    pune: { name: 'Pune', lat: 18.52, lon: 73.86 },
    kochi: { name: 'Kochi', lat: 9.93, lon: 76.27 },
    ahmedabad: { name: 'Ahmedabad', lat: 23.02, lon: 72.57 },
    varanasi: { name: 'Varanasi', lat: 25.32, lon: 82.97 },
  };

  function computeChart(y, m, d, hh, mm, cityKey) {
    const city = cities[cityKey] || cities.chennai;
    const utc = new Date(Date.UTC(y, m - 1, d, hh - 5, mm - 30));
    const jd = jdFromUTC(utc);
    const ayan = ayanamsa(jd);
    const sun = mod360(sunTropical(jd) - ayan);
    const moon = mod360(moonTropical(jd) - ayan);
    const asc = mod360(ascendantTropical(jd, city.lat, city.lon) - ayan);
    const sunR = Math.floor(sun / 30);
    const moonR = Math.floor(moon / 30);
    const ascR = Math.floor(asc / 30);
    const nakIndex = Math.floor(moon / (360 / 27)) % 27;
    const pada = Math.floor((moon % (360 / 27)) / (360 / 108)) + 1;
    const diff = mod360(moon - sun);
    const tithiNum = Math.floor(diff / 12) + 1;
    const isShukla = tithiNum <= 15;
    const tithiName = isShukla ? tithiNames[tithiNum - 1] : tithiNamesK[tithiNum - 16];
    const paksha = isShukla ? 'Shukla' : 'Krishna';
    const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const vara = localDate.getUTCDay();
    return { sun, moon, asc, sunR, moonR, ascR, nakIndex, pada, tithiNum, tithiName, paksha, vara, city, jd };
  }

  function houseOf(rashi, ascR) { return ((rashi - ascR + 12) % 12) + 1; }

  /* ---------- today's panchang ---------- */
  function todayLine(cityKey) {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000);
    const c = computeChart(ist.getUTCFullYear(), ist.getUTCMonth() + 1, ist.getUTCDate(), ist.getUTCHours(), ist.getUTCMinutes(), cityKey || 'chennai');
    return `${rashis[c.moonR][0]} moon · ${c.paksha} ${c.tithiName} · ${nakshatras[c.nakIndex][0]} · ${varas[c.vara]}`;
  }
  const tp = $('#today-panchang');
  if (tp) tp.textContent = `Chennai · ${todayLine('chennai')}`;
  const strip = $('#strip-line');
  if (strip) strip.textContent = todayLine('chennai');

  /* ---------- star canvas ---------- */
  const sky = $('#sky');
  if (sky) {
    const ctx = sky.getContext('2d');
    let stars = [];
    let w = 0, h = 0, t = 0;
    function size() {
      const r = sky.parentElement.getBoundingClientRect();
      w = sky.width = Math.max(1, Math.floor(r.width));
      h = sky.height = Math.max(1, Math.floor(r.height));
      stars = Array.from({ length: Math.min(220, Math.floor(w / 6)) }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h * 0.9,
        r: Math.random() * 1.3 + 0.3, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
      }));
    }
    function drawSky() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.0012 * s.s + s.p));
        ctx.fillStyle = `rgba(236, 228, 211, ${a.toFixed(3)})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.strokeStyle = 'rgba(200, 163, 90, .18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = 0.7 + i * 0.05;
        ctx.moveTo(w * 0.08, h * (0.2 + i * 0.13));
        ctx.bezierCurveTo(w * 0.35, h * (0.05 + i * 0.14), w * 0.6, h * (0.55 + i * 0.05), w * 0.95, h * (0.28 + i * 0.1));
      }
      ctx.stroke();
    }
    function loop(ts) { t = ts || 0; drawSky(); if (!reduce) requestAnimationFrame(loop); }
    size();
    window.addEventListener('resize', () => { size(); drawSky(); });
    if (reduce) drawSky(); else requestAnimationFrame(loop);
  }

  /* ---------- chart svg ---------- */
  function drawChart(c) {
    const svg = $('#chart');
    if (!svg) return;
    const pos = {
      1: [210, 118], 2: [104, 62], 3: [62, 104], 4: [104, 210], 5: [62, 316], 6: [104, 358],
      7: [210, 302], 8: [316, 358], 9: [358, 316], 10: [316, 210], 11: [358, 104], 12: [316, 62],
    };
    const sunHouse = houseOf(c.sunR, c.ascR);
    const moonHouse = houseOf(c.moonR, c.ascR);
    const houses = Object.entries(pos).map(([n, [x, y]]) => {
      const rIdx = (c.ascR + Number(n) - 1) % 12;
      const marks = [];
      if (Number(n) === sunHouse) marks.push('<text x="' + x + '" y="' + (y + 30) + '" text-anchor="middle" font-family="Marcellus, serif" font-size="15" fill="#e0c07a">Su</text>');
      if (Number(n) === moonHouse) marks.push('<text x="' + x + '" y="' + (y + (Number(n) === sunHouse ? 48 : 30)) + '" text-anchor="middle" font-family="Marcellus, serif" font-size="15" fill="#ece4d3">Mo</text>');
      return `<g>
        <text x="${x}" y="${y}" text-anchor="middle" font-family="Spline Sans Mono, monospace" font-size="8" fill="#6f7a97">${n}</text>
        <text x="${x}" y="${y + 14}" text-anchor="middle" font-family="Marcellus, serif" font-size="10" fill="#c8a35a" opacity=".85">${rashiShort[rIdx]}</text>
        ${marks.join('')}
      </g>`;
    }).join('');

    svg.innerHTML = `
      <title id="chart-title">North Indian chart sketch for ${c.city.name}</title>
      <desc id="chart-desc">Lagna ${rashis[c.ascR][0]}, Sun in ${rashis[c.sunR][0]}, Moon in ${rashis[c.moonR][0]} (${nakshatras[c.nakIndex][0]}).</desc>
      <rect width="420" height="420" fill="#0c1024"/>
      <rect x="20" y="20" width="380" height="380" fill="none" stroke="#c8a35a" stroke-width="1.4"/>
      <g stroke="#c8a35a" stroke-width=".8" opacity=".75">
        <path d="M20 20L400 400M400 20L20 400"/>
        <path d="M210 20L400 210L210 400L20 210Z"/>
      </g>
      <g stroke="#c8a35a" stroke-width=".5" opacity=".3">
        <circle cx="210" cy="210" r="54" fill="none"/>
        <path d="M210 156v-36M210 264v36M156 210h-36M264 210h36"/>
      </g>
      ${houses}
      <text x="210" y="205" text-anchor="middle" font-family="Marcellus, serif" font-size="11" fill="#ece4d3">${rashis[c.ascR][0]}</text>
      <text x="210" y="219" text-anchor="middle" font-family="Spline Sans Mono, monospace" font-size="7" letter-spacing="2" fill="#c8a35a">LAGNA</text>
      <text x="30" y="36" font-family="Spline Sans Mono, monospace" font-size="7" fill="#6f7a97">CHENNAI · SKETCH</text>
      <text x="400" y="404" text-anchor="end" font-family="Spline Sans Mono, monospace" font-size="7" fill="#6f7a97">SUN · MOON</text>`;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function castChart(opts) {
    const { name, date, time, cityKey } = opts;
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const c = computeChart(y, m, d, hh, mm, cityKey);
    const sunR = rashis[c.sunR];
    const moonR = rashis[c.moonR];
    const ascR = rashis[c.ascR];
    const [nak, nakLine] = nakshatras[c.nakIndex];
    const sunHouse = houseOf(c.sunR, c.ascR);
    const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 10 > 3 || (n % 100 >= 11 && n % 100 <= 13)) ? 0 : n % 10] || 'th');

    const factsName = $('#facts-name');
    if (factsName) {
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      factsName.textContent = `${name ? name + ' · ' : ''}Born ${dateStr}, ${pad(hh)}:${pad(mm)} IST · ${c.city.name}`;
    }
    $('#fact-lagna').textContent = `${ascR[0]} · ${ascR[1]}`;
    $('#fact-sun').textContent = `${sunR[0]} · ${sunR[1]}`;
    $('#fact-moon').textContent = `${moonR[0]} · ${moonR[1]}`;
    $('#fact-nak').textContent = `${nak} · pada ${c.pada}`;
    $('#fact-tithi').textContent = `${c.paksha} ${c.tithiName}`;
    $('#fact-vara').textContent = `${varas[c.vara]} · ${varaEn[c.vara]}`;
    $('#reading-text').textContent = `The Moon sits in ${nak}, pada ${c.pada} — ${nakLine}. It falls in ${moonR[0]}, which is the ${ordinal(houseOf(c.moonR, c.ascR))} house from the lagna: ${rashiLines[c.moonR]}`;
    $('#chart-desc').textContent = `Lagna ${ascR[0]}, Sun in ${sunR[0]}, Moon in ${moonR[0]} (${nak}).`;
    $('#chart-caption').textContent = `${name ? name + ' · ' : ''}${c.paksha} ${c.tithiName}, ${varas[c.vara]}. House 1 is the lagna; signs run anticlockwise.`;
    drawChart(c);
  }

  const chartForm = $('#chart-form');
  if (chartForm) {
    const dateEl = $('#k-date');
    const timeEl = $('#k-time');
    const cityEl = $('#k-city');
    const validate = (show) => {
      let bad = null;
      if (!dateEl.value) { bad = 'A date is needed.'; dateEl.setAttribute('aria-invalid', 'true'); }
      if (!timeEl.value && !bad) { bad = 'A time is needed.'; timeEl.setAttribute('aria-invalid', 'true'); }
      if (bad && show) {
        let err = $('#k-date-err');
        if (!err) {
          err = document.createElement('span');
          err.id = 'k-date-err';
          err.className = 'err';
          err.setAttribute('aria-live', 'polite');
          dateEl.parentElement.appendChild(err);
        }
        err.textContent = bad;
      }
      return !bad;
    };
    chartForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(true)) return;
      castChart({ name: $('#k-name').value.trim(), date: dateEl.value, time: timeEl.value, cityKey: cityEl.value });
    });
    [dateEl, timeEl].forEach((el) => el.addEventListener('input', () => {
      el.removeAttribute('aria-invalid');
      const err = $('#k-date-err');
      if (err) err.textContent = '';
    }));
    $('#k-name').addEventListener('input', () => {});
    castChart({ name: '', date: dateEl.value, time: timeEl.value, cityKey: cityEl.value });
  }

  /* ---------- casebook filter ---------- */
  const filters = $('.filters');
  if (filters) {
    const cases = $$('.case');
    const count = $('.filter-count');
    const empty = $('.empty-note');
    const apply = (key) => {
      let shown = 0;
      cases.forEach((item) => {
        const match = key === 'all' || item.dataset.kind === key;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = `${shown} of ${cases.length} cases`;
      if (empty) empty.classList.toggle('show', shown === 0);
    };
    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', filters).forEach((c) => {
        c.classList.toggle('is-set', c === chip);
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      apply(chip.dataset.filter);
    });
    apply('all');
  }

  /* ---------- sitting form ---------- */
  const form = $('#sitting-form');
  if (form) {
    const fields = {
      name: { el: $('#s-name'), ok: (v) => v.trim().length >= 2, msg: 'A name for the appointment book.' },
      email: { el: $('#s-email'), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: 'An address that accepts mail.' },
      birth: { el: $('#s-birth'), ok: (v) => v !== '' && !Number.isNaN(Date.parse(v)), msg: 'Date of birth is needed to look at the chart.' },
      birthTime: { el: $('#s-birth-time'), ok: (v) => v !== '', msg: 'Time of birth, as close as you know it.' },
      type: { el: $('#s-type'), ok: (v) => v !== '', msg: 'Choose the kind of sitting.' },
      question: { el: $('#s-question'), ok: (v) => v.trim().length >= 30, msg: 'A few lines about the question you are carrying.' },
    };
    Object.values(fields).forEach(({ el }) => {
      if (!el) return;
      el.addEventListener('input', () => {
        el.removeAttribute('aria-invalid');
        const err = $(`#${el.id}-err`);
        if (err) err.textContent = '';
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      Object.values(fields).forEach(({ el, ok, msg }) => {
        if (!el) return;
        if (!ok(el.value)) {
          el.setAttribute('aria-invalid', 'true');
          const err = $(`#${el.id}-err`);
          if (err) err.textContent = msg;
          if (!first) first = el;
        }
      });
      const agree = $('#s-agree');
      if (agree && !agree.checked && !first) first = agree;
      if (first) { first.focus(); return; }
      $('#sent-name').textContent = fields.name.el.value.trim().split(/\s+/)[0];
      form.hidden = true;
      const sent = $('#sent');
      sent.hidden = false;
      sent.focus?.();
      sent.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
