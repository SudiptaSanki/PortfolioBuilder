/* Ahalya Chitrakar — patua scroll site
   Nav, reveal, and the live pat composer. All artwork is drawn here as SVG. */

(function () {
  'use strict';

  /* ---------- navigation ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

/* ---------- contact form ---------- */
  const contactForm = document.getElementById('commissionForm');
  if (contactForm) {
    const status = document.getElementById('formStatus');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const story = String(data.get('story') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || story.length < 2 || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = 'Please add your name, a working email, the story you have in mind, and a sentence about the wall.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${name.split(' ')[0]}. Your note about ${story} is noted; I answer commissions on Sundays, usually within the week.`;
      contactForm.reset();
    });
  }

  /* ---------- the pat composer ---------- */
  const preview = document.getElementById('patPreview');
  if (!preview) return;

  const PALETTES = {
    cloth: { bg: '#e2d2b1', ground: '#f3e8d0', line: '#241a15', a: '#b23a2a', b: '#23405e', c: '#d59a3c', edge: '#8a5a2b', cap: '#5a463a' },
    indigo: { bg: '#16283a', ground: '#1d3348', line: '#f3e8d0', a: '#d59a3c', b: '#efe3cc', c: '#b23a2a', edge: '#efe3cc', cap: '#e9dcc2' },
    ochre: { bg: '#c98f2e', ground: '#e9c169', line: '#241a15', a: '#b23a2a', b: '#23405e', c: '#efe3cc', edge: '#241a15', cap: '#3d2a16' }
  };

  const MOTIF = {
    snake: (p) => `
      <path d="M-28 18c-10-2-16-12-11-22 5-10 18-11 23-2 4 8-3 15-10 13-6-2-7-9-2-12" fill="none" stroke="${p.b}" stroke-width="7" stroke-linecap="round"/>
      <path d="M-30-4c-6-8-2-18 7-18 7 0 10 7 6 11" fill="none" stroke="${p.b}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="-17" cy="-6" r="2" fill="${p.ground}"/>`,
    lotus: (p) => `
      <path d="M0 22c-6-10-16-14-22-12 4 10 12 14 22 12Z" fill="${p.a}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M0 22c6-10 16-14 22-12-4 10-12 14-22 12Z" fill="${p.a}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M0 22c-4-12-2-26 0-30 3 4 5 18 0 30Z" fill="${p.c}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M-18 26h36" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M-9 22c6 4 12 4 18 0" fill="none" stroke="${p.line}" stroke-width="1.2"/>`,
    boat: (p) => `
      <path d="M-34 14c12 8 56 8 68 0-6 12-16 16-26 16h-16c-10 0-20-4-26-16Z" fill="${p.edge}" stroke="${p.line}" stroke-width="2"/>
      <circle cx="-4" cy="-8" r="7" fill="${p.ground}" stroke="${p.line}" stroke-width="1.5"/>
      <circle cx="-6" cy="-9" r="1.4" fill="${p.line}"/><circle cx="-1" cy="-9" r="1.4" fill="${p.line}"/>
      <path d="M-10-16c2-4 10-4 12 0" fill="${p.a}" stroke="${p.line}" stroke-width="1"/>
      <path d="M-3 0v14M16-14c3 8 3 18 0 26" stroke="${p.line}" stroke-width="2.2" fill="none"/>
      <path d="M16 6 32-6" stroke="${p.edge}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M-26 34c6-4 12 4 18 0s12 4 18 0 12 4 18 0" fill="none" stroke="${p.b}" stroke-width="1.4"/>`,
    tiger: (p) => `
      <path d="M-34 6c10-14 44-16 58-2 8 8 4 20-8 23-20 6-44 4-52-6-4-5-3-11 2-15Z" fill="${p.c}" stroke="${p.line}" stroke-width="2"/>
      <path d="M20 2c6-7 14-6 18 2 3 7-4 12-10 10" fill="${p.c}" stroke="${p.line}" stroke-width="2"/>
      <circle cx="28" cy="1" r="1.8" fill="${p.line}"/>
      <path d="M-22 4c4 8 2 14-2 18M-2 6c3 8 1 14-3 18M14 6c2 6 0 11-3 14" stroke="${p.line}" stroke-width="5" opacity=".85"/>
      <path d="M-12 26c2 6 0 10-4 12M8 26c2 6 0 10-4 12" stroke="${p.line}" stroke-width="3"/>
      <path d="M-34 2c-4-6-2-12 4-14M-28-8l-6-6" fill="none" stroke="${p.line}" stroke-width="2"/>`,
    goddess: (p) => `
      <circle cx="0" cy="-16" r="10" fill="${p.ground}" stroke="${p.line}" stroke-width="1.8"/>
      <circle cx="-4" cy="-17" r="1.7" fill="${p.line}"/><circle cx="4" cy="-17" r="1.7" fill="${p.line}"/>
      <path d="M-3-11c2 2 4 2 6 0" fill="none" stroke="${p.line}" stroke-width="1.1"/>
      <path d="M-10-26c3-5 17-5 20 0" fill="${p.a}" stroke="${p.line}" stroke-width="1"/>
      <path d="M0-6v20M-8 0c-6 4-10 10-10 18M8 0c6 4 10 10 10 18" stroke="${p.line}" stroke-width="2.4" fill="none"/>
      <path d="M0 14c-6 4-8 10-8 16M0 14c6 4 8 10 8 16" stroke="${p.line}" stroke-width="2.4" fill="none"/>
      <path d="M-6 30h12" stroke="${p.line}" stroke-width="2"/>`,
    palm: (p) => `
      <path d="M0 34c2-20 2-38-1-52" stroke="${p.a}" stroke-width="6" fill="none"/>
      <path d="M-1-18c-12-8-20-6-26 0 10 2 17 6 24 10M-1-18c12-8 20-6 26 0-10 2-17 6-24 10M-1-18c-2-10 2-16 8-20 0 10-2 16-4 20" fill="${p.b}" stroke="${p.line}" stroke-width="1.1"/>
      <path d="M-20 34h40" stroke="${p.line}" stroke-width="1.4"/>`,
    mountain: (p) => `
      <path d="M-40 30 0-28l26 32 12-14 24 40Z" fill="${p.b}" stroke="${p.line}" stroke-width="2"/>
      <path d="M0-28-8-8l8 6-6 10" fill="none" stroke="${p.ground}" stroke-width="1.3"/>
      <path d="M-40 30h80" stroke="${p.line}" stroke-width="1.6"/>`,
    fish: (p) => `
      <path d="M-32-4c14-14 34-14 46 0-12 14-32 14-46 0Z" fill="${p.a}" stroke="${p.line}" stroke-width="1.8"/>
      <path d="M14-4l14-10v20Z" fill="${p.a}" stroke="${p.line}" stroke-width="1.6"/>
      <circle cx="-20" cy="-6" r="2" fill="${p.line}"/>
      <path d="M-32 20c14-10 34-10 46 0" fill="none" stroke="${p.b}" stroke-width="1.3"/>`,
    palanquin: (p) => `
      <rect x="-22" y="-20" width="44" height="34" fill="${p.a}" stroke="${p.line}" stroke-width="2"/>
      <path d="M-22-20 0-32l22 12" fill="none" stroke="${p.line}" stroke-width="2"/>
      <path d="M-12-6h24M-12 2h24M-12 10h24" stroke="${p.ground}" stroke-width="2"/>
      <path d="M-22-6h-16M22-6h16M-30-6v26M30-6v26" stroke="${p.edge}" stroke-width="3"/>
      <path d="M-34 22c-2 6 0 10 4 12M34 22c2 6 0 10-4 12" stroke="${p.line}" stroke-width="2"/>`,
    sun: (p) => `
      <circle cx="0" cy="0" r="18" fill="${p.c}" stroke="${p.line}" stroke-width="2"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return `<path d="M${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 22).toFixed(1)}L${(Math.cos(a) * 30).toFixed(1)} ${(Math.sin(a) * 30).toFixed(1)}" stroke="${p.a}" stroke-width="2.4"/>`;
      }).join('')}
      <circle cx="-6" cy="-4" r="2" fill="${p.line}"/><circle cx="6" cy="-4" r="2" fill="${p.line}"/>
      <path d="M-6 5c4 3 8 3 12 0" fill="none" stroke="${p.line}" stroke-width="1.4"/>`,
    drum: (p) => `
      <path d="M-22-12h44v24h-44Z" fill="${p.a}" stroke="${p.line}" stroke-width="2"/>
      <ellipse cx="-22" cy="0" rx="7" ry="12" fill="${p.ground}" stroke="${p.line}" stroke-width="2"/>
      <ellipse cx="22" cy="0" rx="7" ry="12" fill="${p.ground}" stroke="${p.line}" stroke-width="2"/>
      <path d="M-22-12 22 12M22-12-22 12" stroke="${p.c}" stroke-width="1.6"/>
      <path d="M-34 12c-2 8 0 14 6 18M34 12c2 8 0 14-6 18" fill="none" stroke="${p.line}" stroke-width="2"/>`,
    bird: (p) => `
      <path d="M-30 8c8-16 30-24 44-16 10 6 12 18 4 24-10 8-34 6-48-8Z" fill="${p.b}" stroke="${p.line}" stroke-width="1.9"/>
      <circle cx="14" cy="-6" r="8" fill="${p.b}" stroke="${p.line}" stroke-width="1.8"/>
      <path d="M22-8 32-6 22-2" fill="${p.c}" stroke="${p.line}" stroke-width="1.2"/>
      <circle cx="15" cy="-8" r="1.7" fill="${p.line}"/>
      <path d="M-4 8c-2 12 4 20 14 22M-16 6c-6 8-8 16-6 22" fill="none" stroke="${p.line}" stroke-width="1.6"/>
      <path d="M-30 12c-14 8-18 20-14 26 8-4 12-10 14-18" fill="${p.a}" stroke="${p.line}" stroke-width="1.4"/>`,
    lamp: (p) => `
      <path d="M-16 12c0-8 8-10 10 0v6h-10Z" fill="${p.c}" stroke="${p.line}" stroke-width="1.5"/>
      <path d="M-1 12c0-6 8-6 8 0v6h-8Z" fill="${p.c}" stroke="${p.line}" stroke-width="1.5"/>
      <path d="M-6 2c3-6 2-10-1-14 6 3 8 10 1 14Z" fill="${p.a}"/>
      <path d="M-20 22h40" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M-12 26c8-4 16-4 24 0" fill="none" stroke="${p.b}" stroke-width="1.3"/>`,
    river: (p) => `
      <path d="M-40-6c10-6 20 6 30 0s20 6 30 0 14 2 20 0M-40 8c10-6 20 6 30 0s20 6 30 0 14 2 20 0M-40 22c10-6 20 6 30 0s20 6 30 0 14 2 20 0" fill="none" stroke="${p.b}" stroke-width="2.2"/>
      <path d="M-14-20c8 6 20 6 28 0-6 10-22 10-28 0Z" fill="${p.a}" stroke="${p.line}" stroke-width="1.2"/>`,
    forest: (p) => `
      <path d="M-26 30V-4M-26-4l-12 10M-26-4l12 10M-26-4v-16" stroke="${p.a}" stroke-width="5" fill="none"/>
      <path d="M2 30V2M2 2-12 14M2 2 16 14M2 2V-18" stroke="${p.b}" stroke-width="5" fill="none"/>
      <path d="M28 30V8M28 8l-10 8M28 8l10 8" stroke="${p.a}" stroke-width="4" fill="none"/>
      <path d="M-38 30h80" stroke="${p.line}" stroke-width="1.4"/>`
  };

  const STORIES = {
    manasa: {
      title: 'Manasa Mangal',
      couplet: '“The boat goes out, the snake comes down — / who will sing my Behula home?”',
      panels: [
        ['snake', 'The snake is invited'],
        ['lotus', 'The lotus pond'],
        ['boat', 'Behula sets out'],
        ['lamp', 'The lamp on the water'],
        ['goddess', 'Manasa is pleased'],
        ['fish', 'The river gives way'],
        ['river', 'The household returns']
      ]
    },
    chandi: {
      title: 'Chandi Mangal',
      couplet: '“In the forest of the tiger, / a merchant learns to pray.”',
      panels: [
        ['palm', 'The palm and the shrine'],
        ['tiger', 'The tiger appears'],
        ['forest', 'The merchant in the forest'],
        ['drum', 'The drum calls the village'],
        ['goddess', 'Chandi on her lion'],
        ['sun', 'The day of return'],
        ['boat', 'The last crossing']
      ]
    },
    gazi: {
      title: 'Gazir Pat',
      couplet: '“Tiger of the water, saint of the wood, / keep the boat and the boatman good.”',
      panels: [
        ['boat', 'The boatmen push off'],
        ['river', 'The tide turns'],
        ['tiger', 'The tiger saint'],
        ['forest', 'The sundari wood'],
        ['sun', 'Midday on the water'],
        ['bird', 'The heron waits'],
        ['fish', 'The nets come up']
      ]
    }
  };

  const panelsInput = document.getElementById('panels');
  const panelsOut = document.getElementById('panelsOut');
  const groundSelect = document.getElementById('ground');
  const noteEl = document.getElementById('composeNote');
  const captionEl = document.getElementById('previewCaption');
  const form = document.getElementById('composer');

  function esc(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildScroll() {
    const key = (form.querySelector('input[name="story"]:checked') || {}).value || 'manasa';
    const story = STORIES[key];
    const total = Number(panelsInput.value);
    const pal = PALETTES[groundSelect.value] || PALETTES.cloth;
    const W = 260;
    const panelH = 124;
    const H = 34 + total * panelH + 26;

    let out = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(story.title)} scroll, ${total} panels">`;
    out += `<rect width="${W}" height="${H}" fill="${pal.bg}"/>`;
    out += `<rect x="12" y="6" width="${W - 24}" height="${H - 12}" fill="${pal.ground}" stroke="${pal.line}" stroke-width="1.6"/>`;
    out += `<rect x="17" y="11" width="${W - 34}" height="${H - 22}" fill="none" stroke="${pal.a}" stroke-width="3.5"/>`;

    for (let i = 0; i < total; i++) {
      const [motifName, caption] = story.panels[i % story.panels.length];
      const draw = MOTIF[motifName] || MOTIF.lotus;
      const y = 20 + i * panelH;
      out += `<g>`;
      out += `<rect x="24" y="${y}" width="${W - 48}" height="${panelH - 8}" fill="none" stroke="${pal.line}" stroke-width="1"/>`;
      out += `<path d="M30 ${y + 18}h${W - 60}" stroke="${pal.cap}" stroke-width=".4" opacity=".45"/>`;
      out += `<text x="30" y="${y + 13}" font-family="DM Mono, monospace" font-size="6" letter-spacing=".4" fill="${pal.cap}">${esc(caption)}</text>`;
      out += `<g transform="translate(${W / 2 + 12} ${y + 72})">${draw(pal)}</g>`;
      out += `</g>`;
    }

    out += `<path d="M17 ${H - 26}h${W - 34}" stroke="${pal.line}" stroke-width="1"/>`;
    out += `<path d="M17 ${H - 22}c22-5 44 5 66 0s44 5 66 0 44 5 ${W - 34 - 176} 0" fill="none" stroke="${pal.a}" stroke-width="1.4"/>`;
    out += `</svg>`;
    return { svg: out, story, total };
  }

  function render() {
    const { svg, story, total } = buildScroll();
    preview.innerHTML = svg;
    panelsOut.textContent = `${total} panels`;
    const perPanel = 0.32;
    noteEl.textContent = `A ${total}-panel ${story.title} scroll, about ${(total * perPanel).toFixed(1)} m of cloth.`;
    captionEl.textContent = `${story.title} · ${total} panels · ground: ${groundSelect.options[groundSelect.selectedIndex].text.toLowerCase()}`;
    preview.setAttribute('aria-label', `${story.title} scroll preview with ${total} painted panels`);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    render();
    noteEl.textContent = noteEl.textContent + ' ' + STORIES[(form.querySelector('input[name="story"]:checked') || {}).value].couplet;
  });
  panelsInput.addEventListener('input', render);
  groundSelect.addEventListener('change', render);
  form.querySelectorAll('input[name="story"]').forEach((r) => r.addEventListener('change', render));

  render();

})();
