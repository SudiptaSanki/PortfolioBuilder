/* Shantaram Kadu — Warli artist
   Composes a Warli scene as hand-built SVG: two triangles and a circle.
   No libraries, no audio. */
(() => {
  'use strict';

  /* chrome */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  const svg = document.getElementById('chauk-svg');
  if (svg) initChauk();

  function initChauk() {
    const $ = (id) => document.getElementById(id);
    const form = document.getElementById('chauk-form');
    const R = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    const SCENES = {
      chauk: { name: 'Lagna chauk', cap: 'The marriage square with the goddess at the centre and the village around her.' },
      tarpa: { name: 'Tarpa dance', cap: 'Two tarpa players at the centre, the village turning inwards until the music stops.' },
      harvest: { name: 'Rice harvest', cap: 'Bent backs, sickles and sheaves, the sun as a wheel and the field running to the edge of the wall.' },
      fishing: { name: 'Monsoon fishing', cap: 'Figures in the river to the waist, nets below the surface, boats drawn flat from the bank.' },
    };

    /* ── one Warli person: head, two triangles, four limbs ── */
    function person(x, y, s, pose) {
      const arms = {
        dance: `M${x - 1.05 * s} ${y - 2.1 * s}L${x - 2.4 * s} ${y - 3.5 * s}M${x + 1.05 * s} ${y - 2.1 * s}L${x + 2.4 * s} ${y - 3.5 * s}`,
        link: `M${x - 1.05 * s} ${y - 2.2 * s}L${x - 2.6 * s} ${y - 1.7 * s}M${x + 1.05 * s} ${y - 2.2 * s}L${x + 2.6 * s} ${y - 1.7 * s}`,
        up: `M${x - 1.05 * s} ${y - 2.2 * s}L${x - 1.8 * s} ${y - 4.1 * s}M${x + 1.05 * s} ${y - 2.2 * s}L${x + 1.8 * s} ${y - 4.1 * s}`,
        sickle: `M${x - 1.05 * s} ${y - 2.2 * s}L${x - 2.5 * s} ${y - 1.4 * s}M${x + 1.05 * s} ${y - 2.2 * s}L${x + 1.9 * s} ${y + 0.9 * s}`,
        net: `M${x - 1.05 * s} ${y - 2.2 * s}L${x - 3 * s} ${y - 1.1 * s}M${x + 1.05 * s} ${y - 2.2 * s}L${x + 3 * s} ${y - 1.1 * s}`,
        oar: `M${x - 1.05 * s} ${y - 2.2 * s}L${x - 2.2 * s} ${y - 1.2 * s}M${x + 1.05 * s} ${y - 2.2 * s}L${x + 2.3 * s} ${y - 0.6 * s}`,
      };
      const bend = pose === 'bend' ? 0.6 : 0;
      return `<g transform="translate(0 ${bend * s})">
        <circle class="w-fill" cx="${x}" cy="${(y - 3.6 * s).toFixed(1)}" r="${(0.82 * s).toFixed(2)}"/>
        <path class="w-fill" d="M${x} ${(y - 2.8 * s).toFixed(1)}L${(x + 1.15 * s).toFixed(1)} ${(y - 2.8 * s).toFixed(1)}L${x} ${(y - 0.15 * s).toFixed(1)}Z"/>
        <path class="w-fill" d="M${x} ${(y - 0.15 * s).toFixed(1)}L${(x + 1.1 * s).toFixed(1)} ${(y + 2.35 * s).toFixed(1)}L${(x - 1.1 * s).toFixed(1)} ${(y + 2.35 * s).toFixed(1)}Z" opacity=".92"/>
        <path class="w-thin" d="M${(x - 0.55 * s).toFixed(1)} ${(y + 2.2 * s).toFixed(1)}L${(x - 0.8 * s).toFixed(1)} ${(y + 4 * s).toFixed(1)}M${(x + 0.55 * s).toFixed(1)} ${(y + 2.2 * s).toFixed(1)}L${(x + 0.8 * s).toFixed(1)} ${(y + 4 * s).toFixed(1)}"/>
        <path class="w-thin" d="${arms[pose] || arms.dance}"/>
      </g>`;
    }

    function tree(x, y, s) {
      return `<g class="w-line">
        <path d="M${x} ${y}v${-5.4 * s}M${x} ${y - 4.2 * s}l${-1.8 * s} ${-1.4 * s}M${x} ${y - 4.2 * s}l${1.8 * s} ${-1.4 * s}M${x} ${y - 5.2 * s}l${-1.3 * s} ${-1.1 * s}M${x} ${y - 5.2 * s}l${1.3 * s} ${-1.1 * s}"/>
      </g>`;
    }

    function sun(x, y, r) {
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        rays += `M${(x + Math.cos(a) * (r + 4)).toFixed(1)} ${(y + Math.sin(a) * (r + 4)).toFixed(1)}L${(x + Math.cos(a) * (r + 12)).toFixed(1)} ${(y + Math.sin(a) * (r + 12)).toFixed(1)}`;
      }
      return `<circle class="w-border" cx="${x}" cy="${y}" r="${r}"/><path class="w-line" d="${rays}"/>`;
    }

    function moon(x, y, r) {
      return `<path class="w-fill" d="M${x} ${y - r}a${r} ${r} 0 1 0 0 ${2 * r}a${r * 0.78} ${r * 0.78} 0 1 1 0 ${-2 * r}z" opacity=".92"/>`;
    }

    function bird(x, y) {
      return `<path class="w-thin" d="M${x} ${y}q5-5 10 0M${x + 10} ${y}q5-5 10 0"/>`;
    }

    function frame(mode) {
      if (mode === 'none') return '';
      let out = `<rect class="w-draw" x="26" y="26" width="668" height="468"/>`;
      if (mode === 'double') {
        out += `<rect class="w-border" x="38" y="38" width="644" height="444" stroke-width="1"/>`;
        let ticks = '';
        for (let x = 52; x < 676; x += 24) {
          ticks += `M${x} 38l6 9-6 9-6-9z`;
        }
        for (let x = 52; x < 676; x += 24) {
          ticks += `M${x} 482l6-9-6-9-6 9z`;
        }
        for (let y = 62; y < 470; y += 24) {
          ticks += `M38 ${y}l9 6 9-6-9-6zM682 ${y}l-9 6-9-6 9-6z`;
        }
        out += `<path class="w-tick" d="${ticks}" fill="none"/>`;
      }
      return out;
    }

    /* ── scenes ── */
    function sceneChauk(n) {
      let g = '';
      // central chauk
      g += `<rect class="w-draw" x="252" y="152" width="216" height="216"/>`;
      g += `<rect class="w-border" x="268" y="168" width="184" height="184" stroke-width="1"/>`;
      // goddess
      g += `<g transform="translate(360 250) scale(1.5)">
        <circle class="w-fill" cx="0" cy="-14" r="7"/>
        <path class="w-fill" d="M0-6l15 27h-30z"/>
        <path class="w-fill" d="M0 21l11 22h-22z"/>
        <path class="w-thin" d="M-15-2l-14 8M15-2l14 8M-4 42l-9 15M4 42l9 15"/>
        <path class="w-thin" d="M-9-24l-2-9M9-24l2-9"/>
      </g>`;
      // four attendants at the square's corners inside
      [[292, 192], [428, 192], [292, 326], [428, 326]].forEach(([x, y]) => { g += person(x, y, 3.6, 'up'); });
      // the village around the chauk: rows above and below, as on a wedding wall
      const q = Math.max(1, Math.ceil((n - 4) / 2));
      for (let i = 0; i < q; i++) {
        const x = 150 + i * (420 / Math.max(1, q - 1));
        g += person(x, 140, 5.0, i % 3 === 0 ? 'up' : 'link');
        g += person(x, 444, 5.0, i % 3 === 1 ? 'up' : 'link');
      }
      g += `<g class="w-line">
        <path d="M74 470v-54h74v54"/><path d="M64 416l47-32 47 32"/><path d="M100 470v-30h22v30"/>
      </g>`;
      g += `<g class="w-line"><path d="M566 470v-44h58v44"/><path d="M558 426l37-26 37 26"/><path d="M586 470v-24h16v24"/></g>`;
      g += tree(170, 470, 1.6) + tree(500, 472, 1.6) + tree(78, 300, 1.2);
      g += sun(96, 88, 17) + moon(628, 86, 15);
      g += bird(232, 96) + bird(470, 88);
      return g;
    }

    function sceneTarpa(n) {
      let g = '';
      // two musicians at centre
      g += `<g transform="translate(360 260)">
        <circle class="w-fill" cx="-30" cy="-34" r="9"/><path class="w-fill" d="M-30-25l14 25h-28z"/><path class="w-fill" d="M-30 0l11 22h-22z"/>
        <path class="w-thin" d="M-38-18l-10-6M-14-18l10-6M-34 18l-8 12M-18 18l8 12"/>
        <circle class="w-fill" cx="30" cy="-34" r="9"/><path class="w-fill" d="M30-25l14 25h-28z"/><path class="w-fill" d="M30 0l11 22h-22z"/>
        <path class="w-thin" d="M14-18l-10-6M38-18l10-6M22 18l-8 12M30 18l8 12"/>
        <path class="w-line" d="M-46 26a52 26 0 0 1 92 0"/>
        <circle class="w-border" cx="0" cy="26" r="16"/><path class="w-thin" d="M0 10v32M-16 26h32"/>
      </g>`;
      // spiral
      const start = 0.55;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const a = start + t * Math.PI * 4.1;
        const rad = 66 + t * 178;
        const x = 360 + Math.cos(a) * rad * 1.12;
        const y = 266 + Math.sin(a) * rad * 0.72;
        if (x < 60 || x > 660 || y < 96 || y > 462) continue;
        g += person(x, y, 3.4, 'dance');
      }
      g += `<path class="w-thin" d="M300 400c80 40 180-6 208-96" opacity=".25" stroke-dasharray="3 6"/>`;
      g += tree(86, 470, 1.3) + tree(640, 466, 1.4);
      g += sun(626, 104, 17) + moon(96, 108, 15);
      g += bird(420, 84) + bird(456, 84);
      return g;
    }

    function sceneHarvest(n) {
      let g = '';
      // field furrows
      let furrow = '';
      for (let y = 330; y < 470; y += 26) furrow += `M64 ${y}h592`;
      g += `<path class="w-water" d="${furrow}" opacity=".28"/>`;
      // rows of bent figures
      const rows = Math.max(2, Math.ceil(n / 7));
      let placed = 0;
      for (let r = 0; r < rows; r++) {
        const perRow = Math.floor(n / rows) + (r < n % rows ? 1 : 0);
        const y = 356 + r * 30;
        for (let c = 0; c < perRow; c++) {
          const x = 120 + (c + 0.5) * (480 / perRow) + (r % 2 ? 12 : 0);
          g += person(x, y, 3.0, 'sickle');
          // sheaf beside each figure
          g += `<path class="w-thin" d="M${(x + 16).toFixed(1)} ${(y + 22).toFixed(1)}v-12M${(x + 13).toFixed(1)} ${(y + 13).toFixed(1)}l3-5 3 5"/>`;
          placed++;
        }
      }
      // two standing figures with sheaves on head
      g += person(84, 306, 3.2, 'up') + person(640, 306, 3.2, 'up');
      g += `<path class="w-thin" d="M84 274q0-14 12-14t12 14M636 274q0-14 12-14t12 14"/>`;
      g += tree(70, 330, 1.2) + tree(660, 340, 1.3) + tree(560, 300, 0.9);
      g += sun(360, 116, 24);
      g += bird(180, 96) + bird(212, 96) + bird(500, 90);
      return { g, placed };
    }

    function sceneFishing(n) {
      let g = '';
      // river bands
      g += `<path class="w-ground" d="M52 336h616M52 432h616" opacity=".55"/>`;
      let waves = '';
      for (let x = 60; x < 664; x += 26) {
        waves += `M${x} 372q6-6 12 0t12 0M${x} 400q6-6 12 0t12 0`;
      }
      g += `<path class="w-water" d="${waves}"/>`;
      // fish
      for (let i = 0; i < 7; i++) {
        const x = 100 + i * 78 + (i % 2) * 18;
        const y = 366 + (i % 3) * 22;
        g += `<path class="w-fish" d="M${x} ${y}c8-9 22-9 30 0-8 9-22 9-30 0z"/><path class="w-fish" d="M${x + 30} ${y}l8-6v12z"/>`;
        g += `<circle cx="${x + 8}" cy="${y - 1}" r=".9" fill="#5f432c"/>`;
      }
      // boats
      g += `<g class="w-line"><path d="M92 320q34 18 68 0l-6 10q-28 10-56 0z"/><path d="M126 320v-22l24 16z"/></g>`;
      g += `<g class="w-line"><path d="M520 316q30 16 60 0l-5 9q-25 9-50 0z"/><path d="M550 316v-20l22 14z"/></g>`;
      // standing fishers with nets
      const nFig = Math.max(4, Math.min(n, 12));
      for (let i = 0; i < nFig; i++) {
        const x = 130 + i * (440 / Math.max(1, nFig - 1));
        g += person(x, 336, 3.0, 'net');
        g += `<path class="w-thin" d="M${(x - 12).toFixed(1)} 322l-8 46M${(x + 12).toFixed(1)} 322l8 46" opacity=".55"/>`;
      }
      g += tree(78, 470, 1.3);
      g += sun(640, 104, 17);
      g += bird(300, 92) + bird(336, 92);
      return g;
    }

    function draw(scene, n, border) {
      let body = '';
      if (scene === 'chauk') body = sceneChauk(n);
      else if (scene === 'tarpa') body = sceneTarpa(n);
      else if (scene === 'harvest') body = sceneHarvest(n).g;
      else body = sceneFishing(n);
      return `<rect x="0" y="0" width="720" height="520" fill="#5f432c"/>
        <rect x="0" y="0" width="720" height="520" fill="url(#grain)"/>
        <path class="w-ground" d="M40 492h640" opacity=".5"/>
        ${frame(border)}
        ${body}`;
    }

    function render() {
      const scene = form.querySelector('input[name="scene"]:checked').value;
      const figures = parseInt($('figures').value, 10);
      const border = $('border').value;
      const ground = $('ground').value;
      const area = parseInt($('size').value, 10);
      const place = $('place').value;

      svg.innerHTML = `<defs><pattern id="grain" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r=".8" fill="#3e2b1c" opacity=".5"/>
          <circle cx="18" cy="14" r=".6" fill="#3e2b1c" opacity=".4"/>
          <circle cx="9" cy="21" r=".7" fill="#3e2b1c" opacity=".35"/>
        </pattern></defs>` + draw(scene, figures, border);

      $('o-figs').textContent = figures;
      $('o-scene').textContent = SCENES[scene].name;
      $('o-cap').textContent = SCENES[scene].cap + (border === 'none' ? ' Painted edge to edge, without a frame.' : '');

      const rate = ground === 'wall' ? 1800 : ground === 'canvas' ? 2400 : 2000;
      const travel = { home: 0, hotel: 12000, gallery: 18000, outdoor: 35000 }[place];
      const price = Math.max(48000, area * rate * (1 + figures / 160) + travel);
      const paste = (area * 0.018 + figures * 0.02);
      const days = 3 + Math.ceil(figures / 10) + (area > 60 ? 4 : area > 30 ? 2 : 1);
      $('o-price').textContent = R(price);
      $('o-area').textContent = `${area} sq ft`;
      $('o-paste').textContent = `${paste.toFixed(1)} kg`;
      $('o-days').textContent = `${days} days`;
      $('o-travel').textContent = travel === 0 ? 'included in Mumbai' : `${R(travel)}, at cost`;
      $('o-note').textContent = ground === 'wall'
        ? 'A mud wall is prepared over three days before the border goes up. I travel with my own brushes and paste stone.'
        : ground === 'canvas'
          ? 'Hand-stretched khadi over a wooden frame, primed with the same earth and gum as a wall.'
          : 'Handmade paper, four sheets joined and stretched wet. Framing is not included.';
    }

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  }

  /* commission form */
  const cform = document.getElementById('contact-form');
  if (cform) {
    const status = document.getElementById('form-status');
    const fields = [...cform.querySelectorAll('input, textarea, select')];
    const slotFor = (el) => (el.closest('.field') || el.parentElement).querySelector('.err');
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      fields.forEach((el) => {
        let msg = '';
        const v = (el.value || '').trim();
        if (el.required && !v) msg = 'Please fill this.';
        else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email looks incomplete.';
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Add the full number.';
        const slot = slotFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      status.hidden = false;
      status.textContent = 'Thank you. Shantaram reads commissions on Sunday evenings — you will have a reply, and a rough date for the wall, within a week.';
      cform.reset();
      status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    fields.forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        const slot = slotFor(el);
        if (slot) slot.textContent = '';
        el.setAttribute('aria-invalid', 'false');
      }
    }));
  }
})();
