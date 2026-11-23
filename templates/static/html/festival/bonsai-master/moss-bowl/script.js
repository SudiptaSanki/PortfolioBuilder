/* Moss Bowl — interaction layer
   Everything here is quiet on purpose: a menu, a scroll rail, a drifting
   mist in the hero, a sideways bench, and the pruning planner. */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        document.body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- rail progress + section markers ---------- */
  const railProgress = document.getElementById('railProgress');
  const dots = [...document.querySelectorAll('.rail-dots a')];
  const sections = dots.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - window.innerHeight;
    if (railProgress) railProgress.style.height = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    const mid = window.scrollY + window.innerHeight * 0.42;
    let current = -1;
    sections.forEach((s, i) => { if (s.offsetTop <= mid) current = i; });
    dots.forEach((d, i) => d.classList.toggle('is-current', i === current));
  }
  let raf = 0;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; onScroll(); });
  }, { passive: true });
  onScroll();

  /* ---------- reveal ---------- */
  const risers = document.querySelectorAll('.rise');
  if (risers.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      risers.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      risers.forEach((el) => io.observe(el));
    }
  }

  /* ---------- the bench: sideways walk ---------- */
  const track = document.getElementById('benchTrack');
  const prev = document.getElementById('benchPrev');
  const next = document.getElementById('benchNext');
  if (track && prev && next) {
    const step = () => {
      const card = track.querySelector('.tree-card');
      return card ? card.getBoundingClientRect().width + 1 : 320;
    };
    const sync = () => {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---------- hero mist: slow drifting spores ---------- */
  const canvas = document.getElementById('mist');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let visible = true;
    let last = performance.now();

    const seed = () => {
      const count = Math.max(18, Math.min(46, Math.round((w * h) / 26000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 2.1,
        vx: (Math.random() - 0.5) * 0.11,
        vy: -0.05 - Math.random() * 0.12,
        a: 0.06 + Math.random() * 0.18,
        ph: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }).observe(canvas);
    }

    const draw = (now) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.x += p.vx * dt * 0.06 + Math.sin((now * 0.0004) + p.ph) * 0.06;
          p.y += p.vy * dt * 0.06;
          if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
          if (p.x < -6) p.x = w + 6;
          if (p.x > w + 6) p.x = -6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(85,105,63,${p.a})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- bench filters ---------- */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (filterButtons.length) {
    const plates = [...document.querySelectorAll('.plate[data-group]')];
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        plates.forEach((p) => {
          p.hidden = f !== 'all' && p.dataset.group !== f;
        });
      });
    });
  }

  /* ---------- visit form ---------- */
  const form = document.getElementById('visit-form');
  if (form) {
    const status = document.getElementById('form-status');
    const setErr = (el, bad) => {
      const wrap = el.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', bad);
      el.setAttribute('aria-invalid', String(bad));
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const reason = form.querySelector('#reason');
      const when = form.querySelector('#when');
      const tree = form.querySelector('#tree');
      const consent = form.querySelector('#consent');

      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!reason.value) bad.push(reason);
      if (!when.value) bad.push(when);
      if (tree.value.trim().length < 8) bad.push(tree);
      if (!consent.checked) bad.push(consent);

      [name, email, reason, when, tree].forEach((el) => setErr(el, bad.includes(el)));
      const consentWrap = consent.closest('.field');
      if (consentWrap) consentWrap.classList.toggle('invalid', !consent.checked);

      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'Two or three fields still need an answer. The note has not been sent.';
        const first = bad[0];
        if (first && first.focus) first.focus({ preventScroll: false });
        return;
      }

      const d = new Date(when.value + 'T12:00:00');
      const day = d.getDay();
      const closed = day >= 2 && day <= 4;
      const nameShort = name.value.trim().split(' ')[0];
      status.className = 'form-status ok';
      status.textContent = closed
        ? `Thank you, ${nameShort}. Tuesday to Thursday is bench work, so I will write back with the nearest Friday or Monday and a time.`
        : `Thank you, ${nameShort}. Your note is on the bench. I read these on Tuesday and Thursday mornings and will answer within two days.`;
      form.reset();
      [name, email, reason, when, tree, consent].forEach((el) => setErr(el, false));
      if (consentWrap) consentWrap.classList.remove('invalid');
    });

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => {
        if (el.type === 'checkbox' ? el.checked : el.value.trim()) setErr(el, false);
        const w = el.closest('.field');
        if (w && el.type === 'checkbox' && el.checked) w.classList.remove('invalid');
      });
    });
  }

  /* ---------- the pruning planner ---------- */
  const stage = document.getElementById('treeStage');
  if (!stage) return;

  const state = { species: 'pine', pot: 'nanban', canopy: 3, lean: 12, years: 14 };

  const SPECIES = {
    pine: {
      label: 'Black pine',
      trunk: '#3a3229',
      bark: '#241f19',
      foliage: ['#3f5334', '#55693f', '#6c8450'],
      form: 'pad',
      water: [3, 2], repot: 'late Feb', wire: 'Jun–Jul', show: 3,
      note: 'needle pads, two flushes',
    },
    juniper: {
      label: 'Shimpaku',
      trunk: '#6a5c46',
      bark: '#4a3f2f',
      foliage: ['#4b6042', '#5f7a52', '#7d9666'],
      form: 'cloud',
      water: [4, 3], repot: 'early Apr', wire: 'May–Jul', show: 2,
      note: 'cloud pads, live vein',
    },
    maple: {
      label: 'Trident maple',
      trunk: '#5b4a39',
      bark: '#3f3227',
      foliage: ['#7f8a4c', '#94a05c', '#b0bb73'],
      form: 'round',
      water: [2, 1], repot: 'early Mar', wire: 'Jun–Aug', show: 2,
      note: 'ramified, broom crown',
    },
    beech: {
      label: 'Beech',
      trunk: '#8b8779',
      bark: '#6b6558',
      foliage: ['#a9a98c', '#bfc0a0', '#d2d3b4'],
      form: 'round',
      water: [3, 2], repot: 'late Mar', wire: 'May–Jun', show: 4,
      note: 'smooth bark, late leaf',
    },
  };

  const POTS = {
    nanban: { label: 'Nanban', rim: '#7d5c40', body: '#5d4a35', foot: '#3d2b1d', depth: 1, width: 1 },
    oval: { label: 'Oval', rim: '#b9b39c', body: '#a29b83', foot: '#7c7663', depth: 0.85, width: 1.08 },
    cascade: { label: 'Deep', rim: '#6b6a5e', body: '#4e4d44', foot: '#33322c', depth: 1.75, width: 0.76 },
  };

  /* small deterministic PRNG so a given setting keeps its shape */
  const hashSeed = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const BASE_X = 310;
  const GROUND = 424;

  function pad(x, y, r, rand, colors, form, flip) {
    const g = [];
    if (form === 'pad') {
      g.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.33}" fill="${colors[0]}"/>`);
      g.push(`<ellipse cx="${x - r * 0.34}" cy="${y - r * 0.10}" rx="${r * 0.54}" ry="${r * 0.24}" fill="${colors[1]}"/>`);
      g.push(`<ellipse cx="${x + r * 0.30}" cy="${y - r * 0.06}" rx="${r * 0.44}" ry="${r * 0.20}" fill="${colors[2]}" opacity=".9"/>`);
      const needles = [];
      for (let i = 0; i < 9; i++) {
        const nx = x + (rand() - 0.5) * r * 1.5;
        const ny = y + (rand() - 0.5) * r * 0.4;
        needles.push(`M${nx.toFixed(1)} ${ny.toFixed(1)}l${(rand() * 10 - 5).toFixed(1)} ${(-4 - rand() * 5).toFixed(1)}`);
      }
      g.push(`<path d="${needles.join('')}" stroke="${colors[0]}" stroke-width=".8" fill="none" opacity=".55"/>`);
    } else if (form === 'cloud') {
      g.push(`<path d="M${x - r} ${y + r * 0.18}q${r * 0.28} ${-r * 0.52} ${r * 0.92} ${-r * 0.34}q${r * 0.34} ${-r * 0.46} ${r * 1.02} ${-r * 0.05}q${r * 0.42} ${r * 0.06} ${r * 0.26} ${r * 0.36}q${-r * 0.34} ${r * 0.28} ${-r * 1.1} ${r * 0.2}q${-r * 0.72} ${r * 0.14} ${-r * 1.1} ${-r * 0.17}Z" fill="${colors[0]}"/>`);
      g.push(`<path d="M${x - r * 0.7} ${y + r * 0.02}q${r * 0.3} ${-r * 0.32} ${r * 0.86} ${-r * 0.2}q${r * 0.3} ${-r * 0.24} ${r * 0.74} ${r * 0.02}" stroke="${colors[2]}" stroke-width="1.1" fill="none" opacity=".65"/>`);
      g.push(`<path d="M${x - r * 0.4} ${y + r * 0.12}l${-r * 0.22} ${-r * 0.2}M${x + r * 0.1} ${y + r * 0.1}l${r * 0.16} ${-r * 0.22}" stroke="${colors[0]}" stroke-width=".8" opacity=".6"/>`);
    } else {
      for (let i = 0; i < 5; i++) {
        const cx = x + (rand() - 0.5) * r * 1.15;
        const cy = y + (rand() - 0.5) * r * 0.68;
        g.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * (0.34 + rand() * 0.2)).toFixed(1)}" fill="${colors[i % 3]}"/>`);
      }
      g.push(`<circle cx="${x - r * 0.2}" cy="${y - r * 0.2}" r="${(r * 0.3).toFixed(1)}" fill="${colors[2]}" opacity=".55"/>`);
    }
    return `<g${flip ? ` transform="rotate(${flip} ${x} ${y})"` : ''}>${g.join('')}</g>`;
  }

  function render() {
    const sp = SPECIES[state.species];
    const pot = POTS[state.pot];
    const rand = mulberry(hashSeed(`${state.species}|${state.pot}|${state.canopy}|${state.lean}|${state.years}`));
    const density = state.canopy;
    const years = state.years;
    const lean = (state.lean * Math.PI) / 180;

    const potW = 176 * pot.width;
    const potH = 30 * pot.depth;
    const potTop = GROUND;
    const baseX = BASE_X;
    const topX = baseX + Math.tan(lean) * 250;
    const trunkTop = 300 - Math.min(46, years * 1.4);
    const trunkW = 12 + Math.min(16, years * 0.55);

    const out = [];
    out.push(`<defs>
      <linearGradient id="potBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pot.rim}"/><stop offset="1" stop-color="${pot.body}"/>
      </linearGradient>
      <linearGradient id="trunkBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${sp.trunk}"/><stop offset="1" stop-color="${sp.bark}"/>
      </linearGradient>
      <radialGradient id="stageGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0" stop-color="#efe9d9"/><stop offset="1" stop-color="#efe9d9" stop-opacity="0"/>
      </radialGradient>
    </defs>`);

    out.push(`<circle cx="310" cy="270" r="215" fill="url(#stageGlow)"/>`);
    out.push(`<line x1="60" y1="${GROUND + potH + 2}" x2="560" y2="${GROUND + potH + 2}" stroke="#cfc7b0"/>`);
    out.push(`<ellipse cx="${baseX}" cy="${GROUND + potH + 8}" rx="${potW * 0.62}" ry="12" fill="#1f251c" opacity=".07"/>`);

    /* pot */
    const halfTop = potW / 2;
    const halfBot = halfTop * 0.86;
    out.push(`<path d="M${baseX - halfTop} ${potTop}h${halfTop * 2}l-${(halfTop - halfBot) * 0.55} ${potH}h-${halfBot * 2}Z" fill="url(#potBody)"/>`);
    out.push(`<path d="M${baseX - halfTop} ${potTop}h${halfTop * 2}l-4 ${potH * 0.24}h-${halfTop * 2 - 8}Z" fill="${pot.rim}" opacity=".9"/>`);
    out.push(`<path d="M${baseX - halfBot + 6} ${potTop + potH}h${halfBot * 2 - 12}l-3 6h-${halfBot * 2 - 18}Z" fill="${pot.foot}" opacity=".5"/>`);
    if (state.pot === 'nanban') {
      out.push(`<path d="M${baseX - halfTop} ${potTop}c${halfTop * 0.7} 6 ${halfTop * 1.3} 6 ${halfTop * 2} 0" fill="none" stroke="#8a674a" stroke-width="2" opacity=".7"/>`);
      out.push(`<path d="M${baseX - halfTop * 0.8} ${potTop + potH * 1.6}l${halfTop * 1.6} 0" stroke="#3d2b1d" stroke-width="6" opacity=".25"/>`);
    } else if (state.pot === 'oval') {
      out.push(`<ellipse cx="${baseX}" cy="${potTop}" rx="${halfTop}" ry="7" fill="${pot.rim}"/>`);
    } else {
      out.push(`<path d="M${baseX - halfTop + 10} ${potTop + 12}v${potH - 20}M${baseX + halfTop - 10} ${potTop + 12}v${potH - 20}" stroke="${pot.foot}" stroke-width="1" opacity=".4"/>`);
    }

    /* moss at the rim */
    out.push(`<g fill="#55693f" opacity=".9">
      <ellipse cx="${baseX - halfTop * 0.55}" cy="${potTop}" rx="${halfTop * 0.34}" ry="5"/>
      <ellipse cx="${baseX + halfTop * 0.5}" cy="${potTop}" rx="${halfTop * 0.3}" ry="4.4"/>
      <ellipse cx="${baseX + 10}" cy="${potTop - 1}" rx="${halfTop * 0.3}" ry="4"/>
    </g>`);
    for (let i = 0; i < 7; i++) {
      out.push(`<circle cx="${baseX - halfTop * 0.8 + rand() * halfTop * 1.6}" cy="${potTop - 1 - rand() * 3}" r="${(1.4 + rand() * 2).toFixed(1)}" fill="${['#6c8450', '#7d9459', '#98a377'][i % 3]}" opacity=".85"/>`);
    }

    /* trunk: a tapered curve made of two paths */
    const midX = baseX + (topX - baseX) * 0.45 + (rand() - 0.5) * 18;
    const midY = GROUND - (GROUND - trunkTop) * 0.5;
    out.push(`<path d="M${baseX - trunkW / 2} ${GROUND}
      C${baseX - trunkW / 2 + 6} ${midY + 24} ${midX - trunkW * 0.3} ${midY} ${topX - trunkW * 0.16} ${trunkTop}
      L${topX + trunkW * 0.28} ${trunkTop}
      C${midX + trunkW * 0.42} ${midY + 6} ${baseX + trunkW / 2 + 4} ${midY + 30} ${baseX + trunkW / 2} ${GROUND}Z"
      fill="url(#trunkBody)"/>`);

    /* bark lines */
    out.push(`<g stroke="${sp.bark}" fill="none" opacity=".4" stroke-width="1">
      <path d="M${baseX - 2} ${GROUND - 18}c2-30 8-52 14-74M${baseX + 4} ${GROUND - 40}c0-22 4-38 8-56"/>
    </g>`);

    /* roots */
    out.push(`<g stroke="${sp.bark}" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round">
      <path d="M${baseX - 4} ${GROUND - 2}c-14 5-26 8-38 8M${baseX + 4} ${GROUND - 2}c14 5 24 8 34 8"/>
    </g>`);

    /* branches + pads */
    const branchCount = 2 + density;
    const spread = 74 + density * 20;
    let pads = [];
    for (let i = 0; i < branchCount; i++) {
      const t = (i + 1) / (branchCount + 1);
      const y0 = trunkTop + (GROUND - 60 - trunkTop) * t;
      const x0 = baseX + (topX - baseX) * t * 0.9 + (rand() - 0.5) * 12;
      const side = i % 2 === 0 ? -1 : 1;
      const len = spread * (0.55 + rand() * 0.7) * (1 - t * 0.25);
      const x1 = x0 + side * len;
      const y1 = y0 - 12 - rand() * 34;
      out.push(`<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}Q${(x0 + side * len * 0.5).toFixed(1)} ${(y0 - 18 - rand() * 16).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${sp.trunk}" stroke-width="${(7 - i * 0.7).toFixed(1)}" stroke-linecap="round"/>`);
      const r = (34 + density * 6 + rand() * 18) * (1 - t * 0.22);
      pads.push({ x: x1, y: y1 - 6, r, form: sp.form });
      /* secondary twig */
      if (rand() > 0.35) {
        const x2 = x1 + side * (12 + rand() * 22);
        const y2 = y1 - 18 - rand() * 22;
        out.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}l${(x2 - x1).toFixed(1)} ${(y2 - y1).toFixed(1)}" stroke="${sp.trunk}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
        pads.push({ x: x2, y: y2, r: r * 0.62, form: sp.form });
      }
    }
    /* crown */
    const crownR = 40 + density * 8 + rand() * 12;
    out.push(`<path d="M${topX.toFixed(1)} ${trunkTop.toFixed(1)}l0 ${-34 - density * 4}" stroke="${sp.trunk}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    pads.push({ x: topX, y: trunkTop - 46 - density * 4, r: crownR, form: sp.form });

    pads.sort((a, b) => a.y - b.y);
    pads.forEach((p, i) => {
      const col = [sp.foliage[i % 3], sp.foliage[(i + 1) % 3], sp.foliage[(i + 2) % 3]];
      if (p.form === 'pad') col.reverse();
      out.push(pad(p.x, p.y, p.r, rand, col, p.form, p.form === 'pad' ? (rand() * 8 - 4).toFixed(1) : 0));
    });

    /* pot front detail drawn again so pads never cover it */
    out.push(`<path d="M${baseX - halfTop} ${potTop}h${halfTop * 2}" stroke="${pot.foot}" stroke-width="1" opacity=".35"/>`);

    stage.innerHTML = out.join('\n');

    /* readouts */
    const waterBase = sp.water[0] - (state.canopy >= 4 ? 1 : 0);
    const waterMax = Math.max(1, waterBase);
    document.getElementById('rWater').innerHTML = waterMax > 1
      ? `every ${waterMax} days<small>soak, then drain</small>`
      : `daily<small>soak, then drain</small>`;
    document.getElementById('rRepot').innerHTML = `${sp.repot}<small>${state.pot === 'cascade' ? 'deep pot: +2 weeks' : 'before buds break'}</small>`;
    document.getElementById('rWire').innerHTML = `${sp.wire}<small>6 weeks, then off</small>`;
    const show = Math.max(1, sp.show + (state.canopy >= 4 ? 1 : 0) - (years > 18 ? 1 : 0));
    document.getElementById('rShow').innerHTML = `${show} year${show > 1 ? 's' : ''}<small>at this density</small>`;
  }

  /* controls */
  const speciesOut = document.getElementById('speciesOut');
  const potOut = document.getElementById('potOut');
  const canopy = document.getElementById('canopy');
  const canopyOut = document.getElementById('canopyOut');
  const lean = document.getElementById('lean');
  const leanOut = document.getElementById('leanOut');
  const years = document.getElementById('years');
  const yearsOut = document.getElementById('yearsOut');

  const densityWords = ['open', 'airy', 'balanced', 'full', 'heavy'];

  document.querySelectorAll('[data-species]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.species = btn.dataset.species;
      document.querySelectorAll('[data-species]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      speciesOut.textContent = SPECIES[state.species].label;
      render();
    });
  });

  document.querySelectorAll('[data-pot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pot = btn.dataset.pot;
      document.querySelectorAll('[data-pot]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      potOut.textContent = POTS[state.pot].label;
      render();
    });
  });

  canopy.addEventListener('input', () => {
    state.canopy = Number(canopy.value);
    canopyOut.textContent = densityWords[state.canopy - 1];
    render();
  });
  lean.addEventListener('input', () => {
    state.lean = Number(lean.value);
    leanOut.textContent = `${state.lean}°`;
    render();
  });
  years.addEventListener('input', () => {
    state.years = Number(years.value);
    yearsOut.textContent = String(state.years);
    render();
  });

  render();
})();
