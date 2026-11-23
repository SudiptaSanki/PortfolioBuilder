/* Ink Panel Fest — panel bench, shelf filter, submission slip */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal */
  if (!reduce) {
    $$('.pages-head, .mini-panel, .bench-head, .bench-grid, .cal-list li, .method-grid > *, .outro > div, .work, .qa-item, .side-block, .slip, .page-top > *')
      .forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    $$('.rv').forEach((el) => io.observe(el));
  }

  /* ---------- panel bench ---------- */
  const layouts = {
    yonkoma: { label: '4-koma', count: 4, read: 'Top to bottom', panels: (() => {
      const out = [];
      for (let i = 0; i < 4; i++) out.push({ x: 26, y: 26 + i * 206, w: 568, h: 190 });
      return out;
    })() },
    three: { label: '3-panel', count: 3, read: 'Right to left', panels: [
      { x: 26, y: 26, w: 568, h: 296 },
      { x: 26, y: 338, w: 276, h: 496 },
      { x: 318, y: 338, w: 276, h: 496 },
    ] },
    splash: { label: 'Splash', count: 4, read: 'Right to left', panels: [
      { x: 26, y: 26, w: 372, h: 540 },
      { x: 414, y: 26, w: 180, h: 262 },
      { x: 414, y: 304, w: 180, h: 262 },
      { x: 26, y: 582, w: 568, h: 252 },
    ] },
    six: { label: '2×3 grid', count: 6, read: 'Right to left', panels: (() => {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) out.push({ x: 26 + c * 292, y: 26 + r * 266, w: 276, h: 250 });
      return out;
    })() },
  };

  const tones = {
    fine: { label: '60 lpi', gap: 4, r: 1.05, op: .5, extra: 55 },
    medium: { label: '45 lpi', gap: 6, r: 1.7, op: .5, extra: 35 },
    coarse: { label: '30 lpi', gap: 9, r: 2.7, op: .48, extra: 20 },
  };

  const sfx = {
    gogo: { text: 'ゴゴゴ', meaning: 'ゴゴゴ — a low, menacing rumble; used when something large is arriving.' },
    dodo: { text: 'ドドド', meaning: 'ドドド — a heavy, fast approach: feet, drums, a crowd running.' },
    zawa: { text: 'ザワザワ', meaning: 'ザワザワ — the murmur of a crowd that has just noticed something.' },
    shiin: { text: 'シーン', meaning: 'シーン — silence; the absence of sound after a line lands.' },
  };

  const scenes = {
    matsuri: () => `
      <rect x="0" y="0" width="200" height="140" fill="#101010"/>
      <circle cx="162" cy="24" r="11" fill="#f5f1e6" opacity=".92"/>
      <g stroke="#f5f1e6" stroke-width=".6" opacity=".4" fill="none">
        <path d="M10 16h28M10 22h16M132 42h44M140 48h30"/>
      </g>
      <g fill="#101010">
        <path d="M6 58V30l8-6 8 6v28zM28 60V36l7-5 7 5v24zM176 62V34l8-6 8 6v28z"/>
      </g>
      <g>
        <path d="M78 128V44h44v84" fill="#f5f1e6" opacity=".07"/>
        <path d="M76 128V42h48v86" fill="none" stroke="#f5f1e6" stroke-width="1.4"/>
        <path d="M76 42l24-18 24 18" fill="none" stroke="#f5f1e6" stroke-width="1.4"/>
        <path d="M100 24V4" stroke="#f5f1e6" stroke-width="1.2"/>
        <g fill="#e0452c" stroke="#101010" stroke-width=".6">
          <rect x="80" y="52" width="7" height="9"/><rect x="94" y="52" width="7" height="9"/><rect x="108" y="52" width="7" height="9"/>
          <rect x="80" y="72" width="7" height="9"/><rect x="108" y="72" width="7" height="9"/>
          <rect x="80" y="92" width="7" height="9"/><rect x="94" y="92" width="7" height="9"/><rect x="108" y="92" width="7" height="9"/>
        </g>
        <g stroke="#f5f1e6" stroke-width=".7" opacity=".8">
          <path d="M88 120h24M88 124h24"/>
        </g>
      </g>
      <g fill="#f5f1e6">
        <path d="M0 140c0-18 6-30 15-30s15 12 15 30zM34 140c0-14 5-24 12-24s12 10 12 24zM60 140c0-16 5-28 13-28s13 12 13 28zM146 140c0-15 5-25 12-25s12 10 12 25zM172 140c0-20 7-32 16-32s16 12 16 32z"/>
      </g>
      <g fill="#e0452c">
        <rect x="6" y="112" width="4" height="6"/><rect x="38" y="118" width="4" height="6"/><rect x="152" y="116" width="4" height="6"/>
      </g>
      <g stroke="#101010" stroke-width="1" fill="none">
        <path d="M6 128c4-3 8-4 12-2M40 130c4-3 8-4 12-2M152 130c4-3 8-4 12-2"/>
      </g>`,
    shrine: () => `
      <rect x="0" y="0" width="200" height="140" fill="#f5f1e6"/>
      <g stroke="#101010" fill="none" stroke-width="1.3">
        <path d="M0 106h200M0 118h200M0 130h200"/>
        <path d="M36 106V42M160 106V42M24 42h148M30 34h136M54 34v8M130 34v8"/>
        <path d="M36 56h124"/>
      </g>
      <g stroke="#101010" stroke-width=".8" opacity=".45" fill="none">
        <path d="M44 118v12M72 118v12M100 118v12M128 118v12M156 118v12"/>
      </g>
      <g fill="#101010">
        <path d="M86 106c0-22 6-34 14-34s14 12 14 34zM92 68c0-8 3-13 8-13s8 5 8 13-3 12-8 12-8-4-8-12z"/>
        <path d="M60 106c0-16 5-25 11-25s11 9 11 25zM64 78c0-6 3-10 7-10s7 4 7 10-3 9-7 9-7-3-7-9z"/>
      </g>
      <g stroke="#101010" stroke-width=".9" fill="none" opacity=".6">
        <path d="M8 106c0-26 4-44 10-56M18 106c0-22 4-40 10-50M186 106c0-24 4-40 10-52"/>
      </g>
      <g fill="#e0452c">
        <path d="M94 62h12v4H94z"/>
      </g>`,
    backstage: () => `
      <rect x="0" y="0" width="200" height="140" fill="#1b1916"/>
      <g stroke="#101010" fill="#2b2722" stroke-width="1.2">
        <rect x="8" y="96" width="52" height="36"/><rect x="62" y="106" width="36" height="26"/>
        <rect x="140" y="92" width="46" height="40"/>
      </g>
      <g stroke="#f5f1e6" stroke-width=".7" opacity=".45">
        <path d="M8 106h52M8 116h52M62 116h36M140 104h46M140 116h46"/>
      </g>
      <path d="M100 0v22" stroke="#f5f1e6" stroke-width="1"/>
      <circle cx="100" cy="26" r="9" fill="#e0452c" opacity=".95"/>
      <g stroke="#e0452c" stroke-width=".7" opacity=".45">
        <path d="M100 35v26M88 42l24 22M112 42L88 64"/>
      </g>
      <g fill="#101010">
        <path d="M72 140c0-34 6-56 20-56s20 22 20 56z"/>
        <path d="M80 84c0-12 5-19 12-19s12 7 12 19-5 18-12 18-12-6-12-18z"/>
      </g>
      <g stroke="#f5f1e6" stroke-width=".8" opacity=".5" fill="none">
        <path d="M96 100c8 6 12 16 12 28M84 108c-6 4-8 10-8 16"/>
      </g>
      <g fill="#e0452c">
        <rect x="120" y="62" width="14" height="18" opacity=".9"/>
      </g>`,
    rain: () => `
      <rect x="0" y="0" width="200" height="140" fill="#c9c6bd"/>
      <g stroke="#101010" stroke-width=".7" opacity=".55">
        <path d="M10 0l-8 26M34 0l-8 26M58 0l-8 26M82 0l-8 26M106 0l-8 26M130 0l-8 26M154 0l-8 26M178 0l-8 26M22 40l-8 26M46 40l-8 26M70 40l-8 26M94 40l-8 26M118 40l-8 26M142 40l-8 26M166 40l-8 26M190 40l-8 26M10 80l-8 26M34 80l-8 26M58 80l-8 26M82 80l-8 26M106 80l-8 26M130 80l-8 26M154 80l-8 26M178 80l-8 26"/>
      </g>
      <path d="M0 122c30-6 60-6 90 0s70 4 110-2v20H0z" fill="#101010" opacity=".18"/>
      <g fill="#101010">
        <path d="M22 140c0-30 6-50 18-50s18 20 18 50zM46 86c-16 0-28-8-28-20h56c0 12-12 20-28 20z"/>
        <path d="M124 140c0-26 5-42 15-42s15 16 15 42zM110 96c-12 0-22-6-22-15h44c0 9-10 15-22 15z"/>
      </g>
      <g stroke="#101010" stroke-width=".8" opacity=".5" fill="none">
        <path d="M0 124c14 4 26 4 40 0M96 130c14 3 28 3 42 0M150 136c12 2 24 2 36 0"/>
      </g>`,
  };

  const state = { layout: 'yonkoma', tone: 'fine', lines: 'focus', scene: 'matsuri', sfx: 'gogo' };

  function sceneForPanels(panel, index, focusPanel) {
    let art = `<g>${scenes[state.scene]()}</g>`;
    let overlay = '';
    if (state.lines === 'focus' && panel === focusPanel) {
      const cx = panel.w / 2;
      const cy = panel.h / 2;
      const lines = [];
      for (let i = 0; i < 22; i++) {
        const ang = (i / 22) * Math.PI * 2;
        const r1 = Math.min(panel.w, panel.h) * 0.34;
        const r2 = Math.max(panel.w, panel.h);
        lines.push(`<line x1="${(cx + Math.cos(ang) * r1).toFixed(1)}" y1="${(cy + Math.sin(ang) * r1).toFixed(1)}" x2="${(cx + Math.cos(ang) * r2).toFixed(1)}" y2="${(cy + Math.sin(ang) * r2).toFixed(1)}"/>`);
      }
      overlay = `<g stroke="#101010" stroke-width=".8" opacity=".35">${lines.join('')}</g>`;
    } else if (state.lines === 'speed') {
      const lines = [];
      for (let y = 6; y < panel.h; y += 12) lines.push(`<line x1="${(index % 2 ? 0 : panel.w * .45).toFixed(0)}" y1="${y}" x2="${panel.w}" y2="${y - 10}"/>`);
      overlay = `<g stroke="#101010" stroke-width=".7" opacity=".28">${lines.join('')}</g>`;
    }
    return { art, overlay };
  }

  function renderBench() {
    const svg = $('#bench-svg');
    if (!svg) return;
    const L = layouts[state.layout];
    const T = tones[state.tone];
    const defs = `
      <defs>
        <pattern id="tonePage" width="${T.gap}" height="${T.gap}" patternUnits="userSpaceOnUse">
          <circle cx="${(T.gap / 2).toFixed(2)}" cy="${(T.gap / 2).toFixed(2)}" r="${T.r}" fill="#101010" opacity="${T.op}"/>
        </pattern>
        <pattern id="toneSoft" width="${T.gap * 1.6}" height="${T.gap * 1.6}" patternUnits="userSpaceOnUse">
          <circle cx="${(T.gap * 0.8).toFixed(2)}" cy="${(T.gap * 0.8).toFixed(2)}" r="${T.r * .8}" fill="#101010" opacity=".32"/>
        </pattern>
        ${L.panels.map((p, i) => `<clipPath id="pclip${i}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath>`).join('')}
      </defs>`;

    const focusIndex = L.panels.reduce((best, p, i) => (p.w * p.h > L.panels[best].w * L.panels[best].h ? i : best), 0);

    const panels = L.panels.map((p, i) => {
      const { art, overlay } = sceneForPanels(p, i, L.panels[focusIndex]);
      const wide = p.w / p.h > 200 / 140;
      const scale = Math.max(p.w / 200, p.h / 140) * (1 + (i % 3) * 0.08);
      const pan = ((i * 41) % 90) - 45;
      const mirror = i % 2 === 1;
      const tx = p.x + (p.w - 200 * scale) / 2 + pan;
      const ty = wide ? p.y + p.h - 140 * scale + 4 : p.y + (p.h - 140 * scale) / 2;
      const sceneTransform = mirror
        ? `translate(${(tx + 200 * scale).toFixed(1)} ${ty.toFixed(1)}) scale(${(-scale).toFixed(3)} ${scale.toFixed(3)})`
        : `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})`;
      const isNight = state.scene === 'matsuri' || state.scene === 'backstage';
      const sfxText = i === focusIndex
        ? `<text x="${p.x + p.w * .06}" y="${p.y + p.h * .34}" font-family="Dela Gothic One, sans-serif" font-size="${Math.min(p.w * .13, p.h * .3, 58)}" fill="${isNight ? '#f5f1e6' : '#e0452c'}" letter-spacing="3" transform="rotate(-3 ${p.x + p.w * .06} ${p.y + p.h * .34})">${sfx[state.sfx].text}</text>`
        : '';
      const balloons = [
        ['どいた', 'make way'],
        ['まだ', 'not yet'],
        ['上や', 'look up'],
        ['はやく', 'hurry'],
        ['しずか', 'quiet'],
        ['あとで', 'later'],
      ];
      const balloon = i === focusIndex ? '' : (() => {
        const [jp, en] = balloons[i % balloons.length];
        const bw = Math.min(96, p.w * 0.42);
        const bh = 44;
        const bx = p.x + 16 + (i % 2) * 6;
        const by = p.y + 14;
        return `<g>
          <ellipse cx="${bx + bw / 2}" cy="${by + bh / 2}" rx="${bw / 2}" ry="${bh / 2}" fill="#fffdf6" stroke="#101010" stroke-width="1.6"/>
          <path d="M${bx + bw * 0.3} ${by + bh - 4}l-8 16 20-12z" fill="#fffdf6" stroke="#101010" stroke-width="1.6"/>
          <text x="${bx + bw / 2}" y="${by + 20}" text-anchor="middle" font-family="Zen Kaku Gothic New, sans-serif" font-size="12" font-weight="700" fill="#101010">${jp}</text>
          <text x="${bx + bw / 2}" y="${by + 34}" text-anchor="middle" font-family="DM Mono, monospace" font-size="6.5" letter-spacing="1" fill="#101010" opacity=".65">${en}</text>
        </g>`;
      })();
      return `
        <g>
          <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#fffdf6"/>
          <g clip-path="url(#pclip${i})">
            <g transform="${sceneTransform}">${art}</g>
            <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#toneSoft)" opacity=".55"/>
            ${overlay}
          </g>
          ${sfxText}
          ${balloon}
          <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="none" stroke="#101010" stroke-width="3"/>
        </g>`;
    }).join('');

    svg.innerHTML = `
      <title id="bench-title">Manga page preview: ${L.label}, ${T.label} tone, ${state.scene}</title>
      <desc id="bench-desc">A rough manga page layout of ${L.count} panels in the ${state.scene} scene, with ${state.lines} lines and the sound effect ${sfx[state.sfx].text}.</desc>
      ${defs}
      <rect width="620" height="860" fill="#fffdf6"/>
      <rect x="14" y="14" width="592" height="832" fill="none" stroke="#101010" stroke-width=".8" opacity=".35"/>
      ${panels}
      <text x="26" y="852" font-family="DM Mono, monospace" font-size="9" letter-spacing="2" fill="#101010" opacity=".5">INK PANEL FEST · NAME SHEET · ${L.count}P</text>
      <text x="594" y="852" text-anchor="end" font-family="DM Mono, monospace" font-size="9" letter-spacing="2" fill="#101010" opacity=".5">B4 · ${T.label}</text>`;

    $('#panel-count').textContent = String(L.count);
    $('#tone-read').textContent = T.label;
    $('#ink-time').textContent = inkTime(L.count, T.extra);
    $('#sfx-meaning').textContent = sfx[state.sfx].meaning;
    $('#page-meta').textContent = `B4 · ${L.count} panels · ${L.read.toLowerCase()} · tone ${T.label}`;
  }

  function inkTime(panels, extra) {
    const mins = panels * 42 + extra;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} h ${m} m` : `${m} m`;
  }

  const benchForm = $('#bench-form');
  if (benchForm) {
    benchForm.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const map = { layout: 'data-layout', tone: 'data-tone', lines: 'data-lines', scene: 'data-scene', sfx: 'data-sfx' };
      for (const [key, attr] of Object.entries(map)) {
        if (chip.hasAttribute(attr)) {
          state[key] = chip.getAttribute(attr);
          $$(`.chip[${attr}]`, benchForm).forEach((c) => {
            c.classList.toggle('is-set', c === chip);
            c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
          });
        }
      }
      renderBench();
    });
    renderBench();
  }

  /* shelf filter */
  const filters = $('.filters');
  if (filters) {
    const works = $$('.work');
    const count = $('.filter-count');
    const empty = $('.empty-note');
    const apply = (key) => {
      let shown = 0;
      works.forEach((w) => {
        const match = key === 'all' || w.dataset.kind === key;
        w.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = `${shown} of ${works.length} works`;
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

  /* submission form */
  const form = $('#submit-form');
  if (form) {
    const fields = {
      name: { el: $('#m-name'), ok: (v) => v.trim().length >= 2, msg: 'A name for the envelope.' },
      email: { el: $('#m-email'), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: 'An address that accepts mail.' },
      project: { el: $('#m-project'), ok: (v) => v !== '', msg: 'Choose the kind of work.' },
      deadline: { el: $('#m-deadline'), ok: (v) => v !== '' && !Number.isNaN(Date.parse(v)), msg: 'A date for the handover.' },
      brief: { el: $('#m-brief'), ok: (v) => v.trim().length >= 40, msg: 'At least a few sentences — the story and the page count.' },
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
      const agree = $('#m-agree');
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
