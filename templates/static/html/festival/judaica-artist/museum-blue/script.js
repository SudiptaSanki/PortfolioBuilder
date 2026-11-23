/* Museum Blue — page behaviour
   The filigree studio draws a schematic of the chosen object, its pierced
   pattern and its Hebrew inscription, and estimates silver weight and price. */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HB = 'Frank Ruhl Libre, serif';

  /* ---------- menu ---------- */
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

  /* ---------- catalogue filters ---------- */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (filterButtons.length) {
    const plates = [...document.querySelectorAll('.plate[data-group]')];
    filterButtons.forEach((btn) => btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      plates.forEach((p) => { p.hidden = btn.dataset.filter !== 'all' && p.dataset.group !== btn.dataset.filter; });
    }));
  }

  /* ---------- commission form ---------- */
  const form = document.getElementById('judaica-form');
  if (form) {
    const status = document.getElementById('judaica-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const piece = form.querySelector('#piece');
      const date = form.querySelector('#date');
      const notes = form.querySelector('#notes');
      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!piece.value) bad.push(piece);
      if (!date.value) bad.push(date);
      if (notes.value.trim().length < 8) bad.push(notes);

      [name, email, piece, date, notes].forEach((el) => {
        const w = el.closest('.field');
        const isBad = bad.includes(el);
        if (w) w.classList.toggle('invalid', isBad);
        el.setAttribute('aria-invalid', String(isBad));
      });

      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'A few fields still need an answer. Nothing has been sent.';
        bad[0].focus();
        return;
      }

      const first = name.value.trim().split(' ')[0];
      const weeks = form.querySelector('#piece').selectedIndex;
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${first}. Your note is on the bench. I answer on Sunday and Wednesday mornings, and I will send a pencil sketch before any silver is cut.`;
      form.reset();
      [name, email, piece, date, notes].forEach((el) => {
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

  /* ---------- filigree studio ---------- */
  const svg = document.getElementById('filigree');
  if (!svg) return;

  const OBJECTS = {
    mezuzah: { label: 'Mezuzah case', length: 18, grams: 70, labour: 600, weeks: 4, code: 'M' },
    seder: { label: 'Seder plate', length: 34, grams: 420, labour: 1400, weeks: 6, code: 'S' },
    menorah: { label: 'Menorah', length: 26, grams: 380, labour: 1200, weeks: 7, code: 'N' },
    cup: { label: 'Kiddush cup', length: 12, grams: 160, labour: 700, weeks: 4, code: 'C' },
  };

  const state = { obj: 'mezuzah', pat: 'pomegranate', word: 'חיים', scale: 2, metal: 'silver' };

  const els = {
    objOut: document.getElementById('objOut'),
    patOut: document.getElementById('patOut'),
    wordOut: document.getElementById('wordOut'),
    scaleOut: document.getElementById('scaleOut'),
    scale: document.getElementById('scale'),
    metalOut: document.getElementById('metalOut'),
    rMetal: document.getElementById('rMetal'),
    rWeight: document.getElementById('rWeight'),
    rPrice: document.getElementById('rPrice'),
    rWeeks: document.getElementById('rWeeks'),
    ref: document.getElementById('designRef'),
  };

  const SIZE_WORDS = { 1: 'Small', 2: 'Medium', 3: 'Large' };
  const sizeFactor = () => [0.8, 1, 1.24][state.scale - 1];
  const sizeLength = (o) => Math.round(o.length * sizeFactor());

  /* one motif, drawn at the origin, in outline */
  function motif(pattern, x, y, s, stroke) {
    const g = [];
    if (pattern === 'pomegranate') {
      g.push(`<circle cx="${x}" cy="${y}" r="${5 * s}" fill="none" stroke="${stroke}" stroke-width="${s}"/>`);
      g.push(`<path d="M${x - 2.6 * s} ${y - 4.4 * s} l${1.4 * s} -${2.6 * s} l${1.2 * s} ${2.6 * s} l${1.2 * s} -${2.6 * s} l${1.4 * s} ${2.6 * s}" fill="none" stroke="${stroke}" stroke-width="${s * 0.9}"/>`);
      g.push(`<circle cx="${x}" cy="${y + 1.2 * s}" r="${1.1 * s}" fill="${stroke}" opacity=".55"/>`);
    } else if (pattern === 'vine') {
      g.push(`<path d="M${x - 7 * s} ${y} c${3 * s} -${5 * s} ${8 * s} -${5 * s} ${14 * s} 0" fill="none" stroke="${stroke}" stroke-width="${s}"/>`);
      g.push(`<path d="M${x - 3 * s} ${y - 1 * s} c-${2 * s} -${3 * s} -${5 * s} -${2 * s} -${5 * s} 0 c${2 * s} ${2 * s} ${4 * s} ${1 * s} ${5 * s} 0Z" fill="none" stroke="${stroke}" stroke-width="${s * 0.8}"/>`);
      g.push(`<circle cx="${x + 3 * s}" cy="${y + 2 * s}" r="${1.8 * s}" fill="${stroke}" opacity=".35"/>`);
    } else if (pattern === 'olive') {
      g.push(`<path d="M${x - 6 * s} ${y + 3 * s} c${4 * s} -${4 * s} ${8 * s} -${5 * s} ${12 * s} -${6 * s}" fill="none" stroke="${stroke}" stroke-width="${s}"/>`);
      for (let i = 0; i < 4; i++) {
        g.push(`<ellipse cx="${x - 3 * s + i * 3.2 * s}" cy="${y - 1 * s + (i % 2) * 2.4 * s}" rx="${2.4 * s}" ry="${1.1 * s}" fill="none" stroke="${stroke}" stroke-width="${s * 0.8}" transform="rotate(-18 ${x - 3 * s + i * 3.2 * s} ${y - 1 * s + (i % 2) * 2.4 * s})"/>`);
      }
    } else {
      g.push(`<path d="M${x} ${y - 5 * s} l${4 * s} ${5 * s} l-${4 * s} ${5 * s} l-${4 * s} -${5 * s}Z" fill="none" stroke="${stroke}" stroke-width="${s * 0.9}"/>`);
      g.push(`<circle cx="${x}" cy="${y}" r="${1.6 * s}" fill="${stroke}" opacity=".4"/>`);
    }
    return g.join('');
  }

  function band(pattern, x0, y0, x1, y1, step, s, stroke, vertical) {
    const out = [];
    if (vertical) {
      for (let y = y0; y <= y1; y += step) out.push(motif(pattern, x0, y, s, stroke));
    } else {
      for (let x = x0; x <= x1; x += step) out.push(motif(pattern, x, y0, s, stroke));
    }
    return out.join('');
  }

  function drawObject() {
    const o = OBJECTS[state.obj];
    const k = sizeFactor();
    const silver = state.metal === 'silver';
    const fill = silver ? '#c9cfd4' : '#c9a86a';
    const edge = silver ? '#6d747a' : '#8a6a34';
    const hi = silver ? '#eef1f3' : '#e2c894';
    const word = state.word;
    const g = [];
    const cx = 280;
    const cy = 266;

    g.push(`<g font-family="${HB}" text-anchor="middle">`);

    if (state.obj === 'mezuzah') {
      const w = 82 * k; const h = 300 * k;
      const x = cx - w / 2; const y = cy - h / 2;
      g.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${edge}" stroke-width="2"/>`);
      g.push(`<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="6" fill="none" stroke="${hi}" stroke-width="1" opacity=".85"/>`);
      g.push(band(state.pat, x + 22, y + 34, x + 22, y + h - 34, 26 * k, 1.1 * k, edge, true));
      g.push(band(state.pat, x + w - 22, y + 34, x + w - 22, y + h - 34, 26 * k, 1.1 * k, edge, true));
      g.push(`<rect x="${cx - 24 * k}" y="${cy - 40 * k}" width="${48 * k}" height="${80 * k}" fill="${hi}" fill-opacity=".45" stroke="${edge}" stroke-width=".9"/>`);
      g.push(`<text x="${cx}" y="${cy + 14 * k}" font-size="${30 * Math.min(k, 1.1)}" fill="#3f464b" direction="rtl">${word}</text>`);
    } else if (state.obj === 'seder') {
      const r = 150 * k;
      g.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${edge}" stroke-width="2"/>`);
      g.push(`<circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${hi}" stroke-width="1.2" opacity=".9"/>`);
      g.push(`<circle cx="${cx}" cy="${cy}" r="${r - 34}" fill="none" stroke="${edge}" stroke-width=".8" stroke-dasharray="3 5"/>`);
      for (let a = 0; a < 360; a += 20) {
        const rad = (a * Math.PI) / 180;
        g.push(motif(state.pat, cx + Math.cos(rad) * (r - 23), cy + Math.sin(rad) * (r - 23), 1.2 * k, edge));
      }
      const bowls = [[-0.42, -0.36], [0, -0.46], [0.42, -0.36], [-0.42, 0.3], [0, 0.4], [0.42, 0.3]];
      bowls.forEach(([bx, by]) => {
        g.push(`<circle cx="${cx + bx * r}" cy="${cy + by * r}" r="${20 * k}" fill="${hi}" stroke="${edge}" stroke-width="1.1"/>`);
        g.push(`<circle cx="${cx + bx * r}" cy="${cy + by * r}" r="${14 * k}" fill="none" stroke="${edge}" stroke-width=".6" opacity=".7"/>`);
      });
      g.push(`<circle cx="${cx}" cy="${cy}" r="${30 * k}" fill="${hi}" stroke="${edge}" stroke-width="1.2"/>`);
      g.push(`<text x="${cx}" y="${cy + 10 * k}" font-size="${20 * Math.min(k, 1.2)}" fill="#3f464b" direction="rtl">${word}</text>`);
    } else if (state.obj === 'menorah') {
      const baseY = cy + 120 * k;
      const topY = cy - 120 * k;
      g.push(`<path d="M${cx - 26 * k} ${baseY} h${52 * k} v${16 * k} h-${52 * k}Z" fill="${fill}" stroke="${edge}" stroke-width="1.6"/>`);
      g.push(`<path d="M${cx - 10 * k} ${baseY} v-${230 * k}" stroke="${edge}" stroke-width="${7 * k}" fill="none"/>`);
      for (let i = 0; i < 4; i++) {
        const dx = (i + 1) * 34 * k;
        [-1, 1].forEach((side) => {
          g.push(`<path d="M${cx} ${baseY - 40 * k} C${cx + side * dx * 0.6} ${baseY - 90 * k} ${cx + side * dx} ${baseY - 140 * k} ${cx + side * dx} ${topY + 20 * k} V${topY}" fill="none" stroke="${edge}" stroke-width="${4.4 * k}" stroke-linecap="round"/>`);
          g.push(`<rect x="${cx + side * dx - 6 * k}" y="${topY - 8 * k}" width="${12 * k}" height="${10 * k}" fill="${hi}" stroke="${edge}" stroke-width=".9"/>`);
        });
      }
      g.push(`<rect x="${cx - 6 * k}" y="${topY - 8 * k}" width="${12 * k}" height="${10 * k}" fill="${hi}" stroke="${edge}" stroke-width=".9"/>`);
      g.push(band(state.pat, cx - 40 * k, baseY + 26 * k, cx + 40 * k, baseY + 26 * k, 22 * k, 1 * k, edge, false));
      g.push(`<text x="${cx}" y="${baseY - 12 * k}" font-size="${16 * Math.min(k, 1.2)}" fill="#3f464b" direction="rtl">${word}</text>`);
    } else {
      const bowlY = cy - 60 * k;
      g.push(`<path d="M${cx - 58 * k} ${bowlY} h${116 * k} c${6 * k} 0 ${10 * k} ${5 * k} ${10 * k} ${11 * k} v${28 * k} c0 ${26 * k} -${22 * k} ${42 * k} -${54 * k} ${42 * k} s-${54 * k} -${16 * k} -${54 * k} -${42 * k} v-${28 * k} c0 -${6 * k} ${4 * k} -${11 * k} ${10 * k} -${11 * k}Z" fill="${fill}" stroke="${edge}" stroke-width="1.8"/>`);
      g.push(`<path d="M${cx - 48 * k} ${bowlY + 10 * k} h${96 * k}" stroke="${hi}" stroke-width="${3 * k}"/>`);
      g.push(band(state.pat, cx - 40 * k, bowlY + 40 * k, cx + 40 * k, bowlY + 40 * k, 22 * k, 1 * k, edge, false));
      g.push(`<text x="${cx}" y="${bowlY + 34 * k}" font-size="${18 * Math.min(k, 1.2)}" fill="#3f464b" direction="rtl">${word}</text>`);
      g.push(`<path d="M${cx - 8 * k} ${bowlY + 80 * k} h${16 * k} v${40 * k} h-${16 * k}Z" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`);
      g.push(`<ellipse cx="${cx}" cy="${bowlY + 128 * k}" rx="${20 * k}" ry="${7 * k}" fill="${fill}" stroke="${edge}" stroke-width="1"/>`);
      g.push(`<path d="M${cx - 52 * k} ${bowlY + 148 * k} h${104 * k} c${4 * k} 0 ${7 * k} ${4 * k} ${7 * k} ${8 * k} v${14 * k} c0 ${16 * k} -${14 * k} ${26 * k} -${30 * k} ${26 * k} h-${62 * k} c-${16 * k} 0 -${30 * k} -${10 * k} -${30 * k} -${26 * k} v-${14 * k} c0 -${4 * k} ${3 * k} -${8 * k} ${7 * k} -${8 * k}Z" fill="${fill}" stroke="${edge}" stroke-width="1.6"/>`);
    }

    g.push('</g>');
    const metrics = `<g font-family="Assistant, sans-serif" font-size="9" fill="#8a8474" letter-spacing="1.6">
      <text x="24" y="500">${o.label.toUpperCase()} · ${sizeLength(o)} CM · ${silver ? 'SILVER 925' : 'BRASS'}</text>
      <text x="410" y="500">SCHEMATIC · NOT TO SCALE</text>
    </g>
    <line x1="24" y1="486" x2="536" y2="486" stroke="#c2b89f" stroke-width=".8"/>`;

    return g.join('') + metrics;
  }

  function update() {
    const o = OBJECTS[state.obj];
    const k = sizeFactor();
    const silver = state.metal === 'silver';

    const grams = Math.round(o.grams * k * k * (silver ? 1 : 0.82));
    const silverPrice = grams * 26;
    const brassPrice = grams * 7;
    const price = Math.round((silver ? silverPrice : brassPrice) + o.labour * k);
    const weeks = Math.round(o.weeks + (state.scale - 1));

    els.objOut.textContent = o.label;
    els.patOut.textContent = { pomegranate: 'Pomegranate', vine: 'Vine', olive: 'Olive', geometric: 'Geometric' }[state.pat];
    els.wordOut.textContent = state.word;
    els.scaleOut.textContent = `${SIZE_WORDS[state.scale]} · ${sizeLength(o)} cm`;
    els.metalOut.textContent = silver ? 'Silver 925' : 'Brass';
    els.rMetal.innerHTML = `${silver ? 'Silver 925' : 'Brass'}<small>${silver ? 'hallmarked in Jerusalem' : 'lacquered finish'}</small>`;
    els.rWeight.innerHTML = `${grams} g<small>finished, approximate</small>`;
    els.rPrice.innerHTML = `₪${price.toLocaleString('en-US')}<small>before shipping</small>`;
    els.rWeeks.innerHTML = `${weeks} weeks<small>from approved drawing</small>`;
    els.ref.textContent = `F-${sizeLength(o)}-${o.code}${state.pat.charAt(0).toUpperCase()}`;

    svg.innerHTML = drawObject();
  }

  document.querySelectorAll('[data-obj]').forEach((btn) => btn.addEventListener('click', () => {
    state.obj = btn.dataset.obj;
    document.querySelectorAll('[data-obj]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    update();
  }));
  document.querySelectorAll('[data-pat]').forEach((btn) => btn.addEventListener('click', () => {
    state.pat = btn.dataset.pat;
    document.querySelectorAll('[data-pat]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    update();
  }));
  document.querySelectorAll('[data-word]').forEach((btn) => btn.addEventListener('click', () => {
    state.word = btn.dataset.word;
    document.querySelectorAll('[data-word]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    update();
  }));
  document.querySelectorAll('[data-metal]').forEach((btn) => btn.addEventListener('click', () => {
    state.metal = btn.dataset.metal;
    document.querySelectorAll('[data-metal]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    update();
  }));
  els.scale.addEventListener('input', () => {
    state.scale = Number(els.scale.value);
    update();
  });

  update();
})();
