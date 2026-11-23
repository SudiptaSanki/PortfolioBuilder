/* Mughal Miniature — page behaviour
   The pigment studio mixes two dry colours in sRGB and lays the result into a
   small garden folio. No sound, no canvas: everything is SVG and CSS. */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        document.body.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.target.closest('.nav') || e.target.closest('.menu-btn')) return;
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- reveal ---------- */
  const risers = document.querySelectorAll('.rise');
  if (risers.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) risers.forEach((el) => el.classList.add('in'));
    else {
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
      risers.forEach((el) => io.observe(el));
    }
  }

  /* ---------- plate filters ---------- */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (filterButtons.length) {
    const plates = [...document.querySelectorAll('.plate[data-group]')];
    filterButtons.forEach((btn) => btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      plates.forEach((p) => { p.hidden = btn.dataset.filter !== 'all' && p.dataset.group !== btn.dataset.filter; });
    }));
  }

  /* ---------- pigment studio ---------- */
  const panel = document.getElementById('mixPanel');
  if (panel) {
    const PIGMENTS = {
      lapis: { name: 'Lapis lazuli', rgb: [31, 58, 107], light: 9.4, cost: 1200, grind: 45, note: 'Lapis is ground slowly; too fast and the blue dulls to grey.' },
      vermilion: { name: 'Vermilion', rgb: [169, 58, 42], light: 7.6, cost: 420, grind: 25, note: 'Vermilion darkens in sulphur air. In Lahore it wants a varnish after ten years.' },
      orpiment: { name: 'Orpiment', rgb: [209, 160, 44], light: 5.8, cost: 300, grind: 30, note: 'Orpiment is arsenic. It is beautiful, and it is kept in a closed jar.' },
      indigo: { name: 'Indigo', rgb: [43, 74, 99], light: 6.9, cost: 180, grind: 20, note: 'Indigo fades first. Every indigo sky is a small bet against the light.' },
      malachite: { name: 'Malachite', rgb: [77, 122, 82], light: 8.2, cost: 520, grind: 35, note: 'Malachite needs a coarse grind to keep its spark; too fine and it reads as flat green.' },
      chalk: { name: 'Chalk', rgb: [233, 223, 198], light: 9.8, cost: 40, grind: 10, note: 'Chalk is the quiet one. It lightens without changing the hue, which is why it is in half the mixes here.' },
    };

    const state = { base: 'lapis', second: 'chalk', ratio: 6, target: 'sky' };

    const els = {
      baseOut: document.getElementById('baseOut'),
      secondOut: document.getElementById('secondOut'),
      ratioOut: document.getElementById('ratioOut'),
      ratio: document.getElementById('ratio'),
      targetOut: document.getElementById('targetOut'),
      mixName: document.getElementById('mixName'),
      mixParts: document.getElementById('mixParts'),
      mixHex: document.getElementById('mixHex'),
      bigSwatch: document.getElementById('bigSwatch'),
      swatchName: document.getElementById('swatchName'),
      rLight: document.getElementById('rLight'),
      rCost: document.getElementById('rCost'),
      rGrind: document.getElementById('rGrind'),
      mixNote: document.getElementById('mixNote'),
      sky: document.getElementById('mSky'),
      border: document.getElementById('mBorder'),
      robe: document.querySelector('#mFigure path'),
    };

    const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

    function update() {
      const a = PIGMENTS[state.base];
      const b = PIGMENTS[state.second];
      const r = state.ratio / 10;
      const mix = [0, 1, 2].map((i) => a.rgb[i] * r + b.rgb[i] * (1 - r));
      const hx = hex(mix[0], mix[1], mix[2]);
      const parts = `${state.ratio} part${state.ratio > 1 ? 's' : ''} ${a.name.split(' ')[0].toLowerCase()} · ${10 - state.ratio} parts ${b.name.split(' ')[0].toLowerCase()}`;

      els.baseOut.textContent = a.name;
      els.secondOut.textContent = b.name;
      els.ratioOut.textContent = `${state.ratio} of 10`;
      els.mixName.childNodes[0].nodeValue = `${a.name.split(' ')[0]} and ${b.name.split(' ')[0].toLowerCase()}`;
      els.mixParts.textContent = parts;
      els.mixHex.textContent = hx;
      els.bigSwatch.style.setProperty('--mix', hx);
      els.swatchName.textContent = `${a.name.split(' ')[0]} · ${b.name.split(' ')[0].toLowerCase()}`;
      els.rLight.innerHTML = `${(a.light * r + b.light * (1 - r)).toFixed(1)} / 10<small>fifty years, indirect light</small>`;
      els.rCost.innerHTML = `₨ ${Math.round(a.cost * r + b.cost * (1 - r))}<small>per 10 g of dry colour</small>`;
      els.rGrind.innerHTML = `${Math.max(a.grind, b.grind)} min<small>on a stone, with gum</small>`;
      els.mixNote.textContent = r >= 0.5 ? a.note : b.note;

      const targetText = { sky: 'the sky', robe: 'the robe', border: 'the border' }[state.target];
      els.targetOut.textContent = targetText;

      if (state.target === 'sky') els.sky.setAttribute('fill', hx);
      if (state.target === 'robe' && els.robe) els.robe.setAttribute('fill', hx);
      if (state.target === 'border') els.border.setAttribute('stroke', hx);
    }

    document.querySelectorAll('[data-base]').forEach((btn) => btn.addEventListener('click', () => {
      state.base = btn.dataset.base;
      if (state.second === state.base) {
        state.second = state.base === 'chalk' ? 'lapis' : 'chalk';
        document.querySelectorAll('[data-second]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.second === state.second)));
      }
      document.querySelectorAll('[data-base]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      update();
    }));

    document.querySelectorAll('[data-second]').forEach((btn) => btn.addEventListener('click', () => {
      state.second = btn.dataset.second;
      if (state.base === state.second) {
        state.base = state.second === 'chalk' ? 'lapis' : 'chalk';
        document.querySelectorAll('[data-base]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.base === state.base)));
      }
      document.querySelectorAll('[data-second]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      update();
    }));

    els.ratio.addEventListener('input', () => {
      state.ratio = Number(els.ratio.value);
      update();
    });

    document.querySelectorAll('[data-target]').forEach((btn) => btn.addEventListener('click', () => {
      state.target = btn.dataset.target;
      document.querySelectorAll('[data-target]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      update();
    }));

    update();
  }

  /* ---------- commission form ---------- */
  const form = document.getElementById('commission-form');
  if (form) {
    const status = document.getElementById('commission-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const kind = form.querySelector('#kind');
      const details = form.querySelector('#details');
      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!kind.value) bad.push(kind);
      if (details.value.trim().length < 10) bad.push(details);

      [name, email, kind, details].forEach((el) => {
        const w = el.closest('.field');
        const isBad = bad.includes(el);
        if (w) w.classList.toggle('invalid', isBad);
        el.setAttribute('aria-invalid', String(isBad));
      });

      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'A few lines are still missing. Nothing has been sent.';
        bad[0].focus();
        return;
      }

      const first = name.value.trim().split(' ')[0];
      const queue = details.value.length > 240 ? 'two weeks' : 'ten days';
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${first}. Your note is in the commission book; I answer on Tuesdays and will write within ${queue} with a first sketch of the idea and an honest timeline.`;
      form.reset();
      [name, email, kind, details].forEach((el) => {
        const w = el.closest('.field');
        if (w) w.classList.remove('invalid');
      });
    });

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      const clear = () => {
        const w = el.closest('.field');
        if (w && el.value.trim()) w.classList.remove('invalid');
      };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
  }
})();
