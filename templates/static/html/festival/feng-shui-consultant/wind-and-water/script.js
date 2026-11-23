/* Wind & Water — Eight Mansions life gua calculator and compass.
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

  const form = document.getElementById('gua-form');
  if (!form) { bindContact(); return; }

  /* ── Eight Mansions data ─────────────────────────────────── */
  const GUA = {
    1: { trigram: 'Kan', element: 'water', zh: '坎', group: 'East', good: { 'Sheng Qi': 'SE', 'Tian Yi': 'E', 'Yan Nian': 'S', 'Fu Wei': 'N' } },
    2: { trigram: 'Kun', element: 'earth', zh: '坤', group: 'West', good: { 'Sheng Qi': 'NE', 'Tian Yi': 'W', 'Yan Nian': 'NW', 'Fu Wei': 'SW' } },
    3: { trigram: 'Zhen', element: 'wood', zh: '震', group: 'East', good: { 'Sheng Qi': 'S', 'Tian Yi': 'N', 'Yan Nian': 'SE', 'Fu Wei': 'E' } },
    4: { trigram: 'Xun', element: 'wood', zh: '巽', group: 'East', good: { 'Sheng Qi': 'N', 'Tian Yi': 'S', 'Yan Nian': 'E', 'Fu Wei': 'SE' } },
    6: { trigram: 'Qian', element: 'metal', zh: '乾', group: 'West', good: { 'Sheng Qi': 'W', 'Tian Yi': 'NE', 'Yan Nian': 'SW', 'Fu Wei': 'NW' } },
    7: { trigram: 'Dui', element: 'metal', zh: '兌', group: 'West', good: { 'Sheng Qi': 'NW', 'Tian Yi': 'SW', 'Yan Nian': 'NE', 'Fu Wei': 'W' } },
    8: { trigram: 'Gen', element: 'earth', zh: '艮', group: 'West', good: { 'Sheng Qi': 'SW', 'Tian Yi': 'NW', 'Yan Nian': 'W', 'Fu Wei': 'NE' } },
    9: { trigram: 'Li', element: 'fire', zh: '離', group: 'East', good: { 'Sheng Qi': 'E', 'Tian Yi': 'SE', 'Yan Nian': 'N', 'Fu Wei': 'S' } },
  };
  const ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const MEANING = {
    'Sheng Qi': 'vitality, the desk and the front door',
    'Tian Yi': 'health, the bed head',
    'Yan Nian': 'relationships, the dining table',
    'Fu Wei': 'steadiness, study and stillness',
  };

  const $ = (id) => document.getElementById(id);

  function lifeGua(year, sex, early) {
    let y = year;
    if (early) y -= 1;
    let k = String(y).split('').reduce((a, b) => a + Number(b), 0);
    while (k > 9) k = String(k).split('').reduce((a, b) => a + Number(b), 0);
    let g;
    if (sex === 'm') {
      g = 11 - k;
      if (g === 10) g = 1;
      if (g === 5) g = 2;
    } else {
      g = k + 4;
      while (g > 9) g -= 9;
      if (g === 5) g = 8;
    }
    return g;
  }

  /* ── compass drawing ─────────────────────────────────────── */
  const svg = $('gua-svg');
  const CX = 260, CY = 252;

  function polar(r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }

  function sectorPath(r1, r2, a1, a2) {
    const [x1, y1] = polar(r2, a1);
    const [x2, y2] = polar(r2, a2);
    const [x3, y3] = polar(r1, a2);
    const [x4, y4] = polar(r1, a1);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r2} ${r2} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}A${r1} ${r1} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)}Z`;
  }

  function drawCompass(g) {
    const data = GUA[g];
    const goodDirs = Object.values(data.good);
    let out = '';

    ORDER.forEach((dir, i) => {
      const a1 = i * 45 - 22.5;
      const a2 = i * 45 + 22.5;
      const good = goodDirs.includes(dir);
      out += `<path class="g-sector${good ? '' : ' bad'}" d="${sectorPath(112, 186, a1, a2)}"/>`;
      const [lx, ly] = polar(199, i * 45);
      out += `<text class="g-txt${good ? ' jade' : ''}" x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}">${dir}</text>`;
      if (good) {
        const name = Object.keys(data.good).find((k) => data.good[k] === dir);
        const [nx, ny] = polar(148, i * 45);
        out += `<text class="g-label" x="${nx.toFixed(1)}" y="${(ny + 3).toFixed(1)}" text-anchor="middle">${name.toUpperCase()}</text>`;
      }
    });

    out += `<circle class="g-ring" cx="${CX}" cy="${CY}" r="210"/>`;
    out += `<circle class="g-ring" cx="${CX}" cy="${CY}" r="186"/>`;
    out += `<circle class="g-ring" cx="${CX}" cy="${CY}" r="112"/>`;
    out += `<circle class="g-ring" cx="${CX}" cy="${CY}" r="74"/>`;

    // needle, pointing south as a Chinese compass does
    out += `<path class="g-needle" d="M${CX} ${CY + 66}l-7-44 7-16 7 16z"/>`;
    out += `<path d="M${CX} ${CY - 66}l-5 32 5 12 5-12z" fill="none" stroke="#1c1f1b" stroke-opacity=".45"/>`;
    out += `<circle cx="${CX}" cy="${CY}" r="6" fill="#f3eee2" stroke="#1c1f1b" stroke-width="1"/>`;

    // gua trigram at the centre
    out += `<text class="g-trigram" x="${CX}" y="${CY + 104}" style="font-size:22px">${data.zh}</text>`;
    out += `<text class="g-txt" x="${CX}" y="${CY + 124}" style="font-size:9px">${data.trigram.toUpperCase()} · ${data.element.toUpperCase()}</text>`;

    svg.innerHTML = out;
  }

  function render() {
    const year = Math.min(2026, Math.max(1920, parseInt($('year').value || '1988', 10)));
    const sex = $('sex').value;
    const early = $('early').checked;
    const g = lifeGua(year, sex, early);
    const data = GUA[g];
    const goodDirs = Object.values(data.good);
    const avoid = ORDER.filter((d) => !goodDirs.includes(d));

    $('o-gua').textContent = g;
    $('o-element').textContent = `${data.trigram} · ${data.element}`;
    $('o-group').textContent = `${data.group} group`;
    $('o-best').textContent = `Best: ${data.good['Sheng Qi'].toLowerCase()}`;
    $('o-figdir').textContent = `Sheng Qi to the ${data.good['Sheng Qi']}`;
    $('o-figcap').textContent = `Gua ${g}, ${data.trigram} ${data.zh}. The four jade sectors support you; the four ink sectors do not.`;

    const rows = Object.keys(data.good).map((name) => {
      const dir = data.good[name];
      const meaning = name === 'Fu Wei' ? 'stability' : name === 'Tian Yi' ? 'health' : name === 'Yan Nian' ? 'relationships' : 'vitality';
      return `<div class="good"><dt>${name}</dt><dd>${dir} · ${meaning}</dd></div>`;
    }).join('');
    const badRows = avoid.map((d) => `<div><dt>${d}</dt><dd style="color:var(--ink-3)">avoid</dd></div>`).join('');
    $('o-dirs').innerHTML = rows + badRows;

    let note = `Born in ${early ? year - 1 : year}${early ? ' (solar year)' : ''}: the life gua is read from the lunar year, which begins on 3 February.`;
    if ((sex === 'm' && (11 - digital(year - (early ? 1 : 0))) === 5) || (sex === 'f' && (digital(year - (early ? 1 : 0)) + 4) === 5)) {
      note += ' The number five has no direction; it is read as two for a man and eight for a woman.';
    }
    $('o-note').textContent = note;

    drawCompass(g);
  }

  function digital(n) {
    let k = String(n).split('').reduce((a, b) => a + Number(b), 0);
    while (k > 9) k = String(k).split('').reduce((a, b) => a + Number(b), 0);
    return k;
  }

  $('year').addEventListener('input', render);
  $('sex').addEventListener('change', render);
  $('early').addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();

  bindContact();

  function bindContact() {
    const cform = document.getElementById('contact-form');
    if (!cform) return;
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
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Add the country code.';
        const slot = slotFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      status.hidden = false;
      status.textContent = 'Received. Mei-Ling replies within two working days with the fee, the next available dates, and a short list of what to send before the visit.';
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
