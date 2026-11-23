/* Meenakshi Fine Arts — the panel composer.
   Draws a gilded board in SVG from the choices; nothing is loaded from outside. */

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
      a.addEventListener('click', () => { head.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
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

  /* ---------- data ---------- */

  const FIGURES = {
    lotus: { label: 'Lotus', note: 'the seat, and the commonest centre for a small panel' },
    conch: { label: 'Conch', note: 'a single shankha, for a doorway or an entrance hall' },
    chakra: { label: 'Chakra', note: 'the wheel, for a panel that hangs high' },
    lamp: { label: 'Lamp', note: 'a deepa, for a house that keeps one lit' },
  };

  const PALETTES = {
    classic: { name: 'Classic', field: '#3a1414', field2: '#2c0d0d', fig: '#1d2e46', accent: '#a8322a', detail: '#e6c978' },
    indigo: { name: 'Indigo room', field: '#1f3a5f', field2: '#16283f', fig: '#0f1c2e', accent: '#c9a227', detail: '#f0e2c8' },
    rosewood: { name: 'Rosewood', field: '#5a1a17', field2: '#3a0f10', fig: '#1f3a2c', accent: '#d8b24a', detail: '#f2ddb2' },
    moonlight: { name: 'Moonlight', field: '#201a17', field2: '#120d0c', fig: '#3a2f27', accent: '#c9a227', detail: '#efe6cf' },
  };

  const BORDERS = {
    lotus: { name: 'lotus', unit: 26, draw: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0c7-9 7-18 0-26-7 8-7 17 0 26Z" fill="none" stroke="#8f6d1b" stroke-width="1.1"/><path d="M-8 0c4-7 12-7 16 0" fill="none" stroke="#8f6d1b" stroke-width="1" opacity=".8"/></g>` },
    chevron: { name: 'chevron', unit: 22, draw: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-8 4 0-6 8 4" fill="none" stroke="#8f6d1b" stroke-width="1.2"/><path d="M-8 12 0 2 8 12" fill="none" stroke="#8f6d1b" stroke-width="1.2" opacity=".7"/></g>` },
    yaali: { name: 'yaali', unit: 34, draw: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-12 0c8-9 22-9 26 2 3 8-5 13-11 10" fill="none" stroke="#8f6d1b" stroke-width="1.2"/><circle cx="10" cy="-3" r="1.5" fill="#8f6d1b"/><path d="M-14 8c6-4 12-4 18 0" fill="none" stroke="#8f6d1b" stroke-width="1" opacity=".7"/></g>` },
    plain: { name: 'plain', unit: 30, draw: (x, y, r) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#8f6d1b" opacity=".55"/>` },
  };

  const SIZES = {
    '12x16': { w: 12, h: 16, price: 95000, weeks: 8 },
    '18x24': { w: 18, h: 24, price: 185000, weeks: 11 },
    '24x36': { w: 24, h: 36, price: 340000, weeks: 16 },
    '30x40': { w: 30, h: 40, price: 475000, weeks: 20 },
  };

  /* ---------- border ---------- */
  function borderUnits(kind) {
    const b = BORDERS[kind] || BORDERS.lotus;
    let out = '';
    for (let x = 56; x <= 364; x += b.unit) { out += b.draw(x, 43, 0); out += b.draw(x, 517, 180); }
    for (let y = 58; y <= 502; y += b.unit) { out += b.draw(43, y, -90); out += b.draw(377, y, 90); }
    return out;
  }

  /* ---------- the ornament at the centre of the arch ----------
     A commission sketch shows the board, the gold and the border. The figure
     is painted by hand afterwards, so the sketch composes the ornament. */

  function plinth(p) {
    return `<g>
      <path d="M120 438h180" stroke="${p.detail}" stroke-width="3"/>
      <path d="M132 446h156" stroke="${p.detail}" stroke-width="1.4" opacity=".8"/>
      <path d="M144 452h132" stroke="#8f6d1b" stroke-width="1" opacity=".5"/>
    </g>`;
  }

  function lotus(p) {
    const g = p.detail;
    const petals = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * 45) * Math.PI / 180;
      const x = 210 + Math.cos(a) * 44;
      const y = 300 + Math.sin(a) * 44;
      petals.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="40" ry="15" fill="${g}" stroke="#8f6d1b" stroke-width="1" transform="rotate(${i * 45} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
    }
    return `${plinth(p)}<g>${petals.join('')}</g>
      <circle cx="210" cy="300" r="44" fill="${g}" stroke="#8f6d1b" stroke-width="1.2"/>
      <circle cx="210" cy="300" r="26" fill="${p.accent}" stroke="${g}" stroke-width="1.4"/>
      <circle cx="210" cy="300" r="12" fill="${g}" stroke="#8f6d1b" stroke-width="1"/>
      <g fill="none" stroke="#8f6d1b" stroke-width="1" opacity=".7">
        <circle cx="210" cy="300" r="35"/>
      </g>`;
  }

  function conch(p) {
    const g = p.detail;
    return `${plinth(p)}
      <g fill="${g}" stroke="#8f6d1b" stroke-width="1.2">
        <path d="M210 176c30 0 52 26 52 62 0 40-24 74-52 92-28-18-52-52-52-92 0-36 22-62 52-62Z"/>
      </g>
      <g fill="none" stroke="#8f6d1b" stroke-width="1.2" opacity=".8">
        <path d="M210 196c18 0 30 18 30 42 0 30-14 54-30 68-16-14-30-38-30-68 0-24 12-42 30-42Z"/>
        <path d="M210 216c9 0 15 10 15 24 0 20-7 36-15 46-8-10-15-26-15-46 0-14 6-24 15-24Z"/>
        <path d="M210 176v-18M196 186l-16-12M224 186l16-12"/>
      </g>
      <circle cx="210" cy="310" r="7" fill="${p.accent}" stroke="${g}" stroke-width="1.4"/>`;
  }

  function chakra(p) {
    const g = p.detail;
    const spokes = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5) * Math.PI / 180;
      spokes.push(`<path d="M${(210 + Math.cos(a) * 22).toFixed(1)} ${(300 + Math.sin(a) * 22).toFixed(1)}L${(210 + Math.cos(a) * 62).toFixed(1)} ${(300 + Math.sin(a) * 64).toFixed(1)}" stroke="${g}" stroke-width="4"/>`);
    }
    return `${plinth(p)}
      <circle cx="210" cy="300" r="78" fill="none" stroke="${g}" stroke-width="7"/>
      <circle cx="210" cy="300" r="66" fill="none" stroke="#8f6d1b" stroke-width="1"/>
      <circle cx="210" cy="300" r="88" fill="none" stroke="${g}" stroke-width="2" stroke-dasharray="4 7" opacity=".8"/>
      ${spokes.join('')}
      <circle cx="210" cy="300" r="26" fill="${p.accent}" stroke="${g}" stroke-width="3"/>
      <circle cx="210" cy="300" r="12" fill="${g}" stroke="#8f6d1b" stroke-width="1"/>`;
  }

  function lamp(p) {
    const g = p.detail;
    return `${plinth(p)}
      <g fill="${g}" stroke="#8f6d1b" stroke-width="1.2">
        <path d="M150 330h120l-14 26H164Z"/>
        <path d="M196 330c0-12 6-18 14-18s14 6 14 18Z"/>
        <path d="M210 312v-16"/>
        <path d="M138 330c0-16 14-26 30-26h84c16 0 30 10 30 26Z" opacity=".85"/>
      </g>
      <path d="M210 300c-14-22-10-44 0-58 10 14 14 36 0 58Z" fill="${p.accent}" stroke="${g}" stroke-width="2"/>
      <path d="M210 288c-7-12-5-24 0-32 5 8 7 20 0 32Z" fill="${g}"/>
      <g stroke="${g}" stroke-width="2" fill="none" opacity=".7">
        <path d="M160 356c14 10 86 10 100 0"/>
        <path d="M172 366c12 8 64 8 76 0"/>
      </g>`;
  }

  const DRAW = { lotus, conch, chakra, lamp };

  /* ---------- build the panel ---------- */

  function buildPanel(motif, border, palette) {
    const p = PALETTES[palette] || PALETTES.classic;
    const b = BORDERS[border] || BORDERS.lotus;
    return `<svg viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${FIGURES[motif].label} panel preview">
      <defs>
        <linearGradient id="pvGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e8cf8e"/><stop offset=".45" stop-color="#c9a227"/>
          <stop offset=".7" stop-color="#f0dda6"/><stop offset="1" stop-color="#a8831c"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="412" height="552" fill="#241010"/>
      <rect x="14" y="14" width="392" height="532" fill="url(#pvGold)"/>
      <rect x="44" y="44" width="332" height="472" fill="${p.field}"/>
      <rect x="44" y="44" width="332" height="472" fill="none" stroke="#8f6d1b" stroke-width="1"/>
      <g>${borderUnits(border)}</g>
      <path d="M78 452V236c0-44 60-82 132-82s132 38 132 82v216Z" fill="${p.field2}" stroke="${p.detail}" stroke-width="1.4" opacity=".95"/>
      <path d="M92 452V238c0-36 54-70 118-70s118 34 118 70v214" fill="none" stroke="${p.detail}" stroke-width="1" opacity=".45"/>
      <g stroke="${p.detail}" fill="none" stroke-width="2" opacity=".7">
        <path d="M130 440c-18-78-4-154 80-186 84 32 98 108 80 186"/>
      </g>
      <path d="M210 250c6-12 12-12 18 0-6 5-12 5-18 0Z" fill="${p.detail}" opacity=".8"/>
      ${DRAW[motif] ? DRAW[motif](p) : DRAW.lotus(p)}
    </svg>`;
  }

  /* ---------- the thumbnails on the page share the generator ---------- */
  document.querySelectorAll('[data-panel]').forEach((el) => {
    el.innerHTML = buildPanel(el.getAttribute('data-panel') || 'lotus', el.getAttribute('data-border') || 'lotus', el.getAttribute('data-palette') || 'classic');
  });

  /* ---------- the form ---------- */

  const preview = document.getElementById('panelPreview');
  const caption = document.getElementById('panelCaption');
  const statusEl = document.getElementById('composeStatus');
  const form = document.getElementById('panelForm');

  const getRadio = () => {
    const el = document.querySelector('input[name="motif"]:checked');
    return el ? el.value : 'lotus';
  };

  function fmtRupees(n) {
    return '₹' + n.toLocaleString('en-IN');
  }

  function render() {
    if (!preview) return;
    const motif = getRadio();
    const borderEl = document.getElementById('border');
    const palEl = document.getElementById('palette');
    const sizeEl = document.getElementById('size');
    const nameEl = document.getElementById('panelName');
    const border = borderEl ? borderEl.value : 'lotus';
    const palette = palEl ? palEl.value : 'classic';
    const sizeKey = sizeEl ? sizeEl.value : '18x24';
    const size = SIZES[sizeKey] || SIZES['18x24'];
    const typed = nameEl && nameEl.value.trim();

    preview.innerHTML = buildPanel(motif, border, palette);

    const p = PALETTES[palette];
    if (caption) {
      caption.textContent = (typed || FIGURES[motif].label) + ' · ' + size.w + ' × ' + size.h +
        ' in · ' + BORDERS[border].name + ' border · ' + p.name.toLowerCase() + ' palette';
    }

    const board = document.getElementById('quoteBoard');
    if (board) board.textContent = size.w + ' × ' + size.h + ' in jackwood';
    const gold = document.getElementById('quoteGold');
    if (gold) gold.textContent = Math.round(size.w * size.h * 0.62) + ' sq in of gold';
    const time = document.getElementById('quoteTime');
    if (time) time.textContent = size.weeks + ' weeks';
    const price = document.getElementById('quotePrice');
    if (price) {
      const extra = border === 'yaali' ? 12000 : border === 'plain' ? -6000 : 0;
      price.textContent = fmtRupees(size.price + extra);
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      render();
      if (statusEl) {
        const motif = getRadio();
        statusEl.textContent = 'Drawn as a sketch. A ' + FIGURES[motif].label.toLowerCase() +
          ' panel takes ' + (SIZES[document.getElementById('size').value] || SIZES['18x24']).weeks +
          ' weeks from the day the board is ordered, and the gesso decides the rest.';
      }
    });
    form.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
  }
  render();

  /* ---------- commission form ---------- */
  const commission = document.getElementById('commissionForm');
  if (commission) {
    const status = document.getElementById('commissionStatus');
    commission.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(commission);
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const figure = String(d.get('figure') || '').trim();
      const message = String(d.get('message') || '').trim();
      const bad = [];
      if (name.length < 2) bad.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('a working email');
      if (message.length < 12) bad.push('a line or two about the room and the figure');
      if (bad.length) {
        status.className = 'commission-status err';
        status.textContent = 'Please add ' + bad.join(', ') + '.';
        return;
      }
      status.className = 'commission-status ok';
      status.textContent = 'Thank you, ' + name.split(' ')[0] + '. I answer commissions on Sundays. ' +
        (figure ? 'If the ' + figure.toLowerCase() + ' is settled, say so in your reply and I will put a board aside; nothing is ordered until we have spoken.' : 'The figure can be decided later; the room matters more at this stage.');
      commission.reset();
    });
  }
})();
