/* Clockwork Brass — generated gear train, escapement, chrome. */

(() => {
  'use strict';

  /* ---------- nav ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  initPageFeatures();

  const svg = document.getElementById('trainSvg');
  if (!svg) return;

  const gearGroup = document.getElementById('gearGroup');
  const escapeGroup = document.getElementById('escapeGroup');
  const NS = 'http://www.w3.org/2000/svg';

  const state = { zA: 18, zB: 30, zC: 54, module: 0.75, rpm: 12 };

  const el = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  function gearPath(r, teeth, toothH) {
    const pts = [];
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i += 1) {
      const a = i * step;
      pts.push([a, r]);
      pts.push([a + step * 0.1, r + toothH]);
      pts.push([a + step * 0.45, r + toothH]);
      pts.push([a + step * 0.55, r]);
      pts.push([a + step * 0.95, r]);
    }
    return `${pts
      .map(([a, rr], i) => `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`)
      .join(' ')} Z`;
  }

  function makeWheel(r, teeth, cx, cy, label, sub, cls, side) {
    const toothH = Math.max(1.8, r * 0.1);
    const spin = el('g', { class: 'wheel' });
    spin.appendChild(el('path', { class: cls, d: gearPath(r, teeth, toothH) }));
    spin.appendChild(el('circle', { class: 'gear-rim', cx: 0, cy: 0, r: (r - toothH * 0.4).toFixed(2) }));
    spin.appendChild(el('circle', { class: 'gear-hub', cx: 0, cy: 0, r: Math.max(3, r * 0.14).toFixed(2) }));
    const spokes = Math.max(4, Math.round(teeth / 7));
    for (let i = 0; i < spokes; i += 1) {
      const a = (i / spokes) * Math.PI * 2;
      spin.appendChild(
        el('line', {
          class: 'gear-spoke',
          x1: (Math.cos(a) * r * 0.16).toFixed(2),
          y1: (Math.sin(a) * r * 0.16).toFixed(2),
          x2: (Math.cos(a) * r * 0.74).toFixed(2),
          y2: (Math.sin(a) * r * 0.74).toFixed(2)
        })
      );
    }
    spin.setAttribute('transform', `translate(${cx} ${cy})`);
    const ly = side === 'up' ? cy - r - 34 : cy + r + 40;
    const labelEl = el('text', { class: 'gear-label', x: cx, y: ly, 'text-anchor': 'middle' });
    labelEl.textContent = label;
    const subEl = el('text', { class: 'gear-sub', x: cx, y: ly + 14, 'text-anchor': 'middle' });
    subEl.textContent = sub;
    return { spin, labelEl, subEl, cx, cy, r };
  }

  let wheels = [];

  function build() {
    const m = state.module;
    const rA = (m * state.zA) / 2;
    const rB = (m * state.zB) / 2;
    const rC = (m * state.zC) / 2;
    const needed = rA + (rA + rB) + (rB + rC) + rC;
    const s = Math.max(1.6, Math.min(9.5, 760 / needed, 128 / rC));

    const pA = rA * s;
    const pB = rB * s;
    const pC = rC * s;
    const y = 170;
    const total = pA + pB + pB + pC;
    const xA = 450 - total / 2;
    const xB = xA + pA + pB;
    const xC = xB + pB + pC;

    gearGroup.textContent = '';
    escapeGroup.textContent = '';

    gearGroup.appendChild(
      el('line', { class: 'centre-line', x1: (xA - pA - 12).toFixed(1), y1: y, x2: (xC + pC + 12).toFixed(1), y2: y })
    );

    const A = makeWheel(pA, state.zA, xA, y, 'A · driver', `${state.zA} t · Ø${(m * state.zA).toFixed(1)}`, 'gear-body');
    const B = makeWheel(pB, state.zB, xB, y, 'B · idler', `${state.zB} t · Ø${(m * state.zB).toFixed(1)}`, 'gear-body', 'up');
    const C = makeWheel(pC, state.zC, xC, y, 'C · output', `${state.zC} t · Ø${(m * state.zC).toFixed(1)}`, 'gear-body');
    [A, B, C].forEach((w) => {
      gearGroup.appendChild(w.spin);
      gearGroup.appendChild(w.labelEl);
      gearGroup.appendChild(w.subEl);
    });

    // escape wheel below the output
    const ex = 450;
    const ey = 418;
    const er = 26;
    const escTeeth = 15;
    const escSpin = el('g', { class: 'wheel' });
    escSpin.appendChild(el('circle', { class: 'esc-rim', cx: 0, cy: 0, r: er }));
    for (let i = 0; i < escTeeth; i += 1) {
      const a = (i / escTeeth) * Math.PI * 2;
      escSpin.appendChild(
        el('line', {
          class: 'esc-tooth',
          x1: (Math.cos(a) * (er - 5)).toFixed(2),
          y1: (Math.sin(a) * (er - 5)).toFixed(2),
          x2: (Math.cos(a + 0.11) * (er + 4)).toFixed(2),
          y2: (Math.sin(a + 0.11) * (er + 4)).toFixed(2)
        })
      );
    }
    escSpin.appendChild(el('circle', { class: 'gear-hub', cx: 0, cy: 0, r: 3.5 }));
    escSpin.setAttribute('transform', `translate(${ex} ${ey})`);
    escapeGroup.appendChild(escSpin);

    const anchor = el('g', { class: 'anchor-holder' });
    anchor.appendChild(el('line', { x1: ex, y1: ey - 86, x2: ex, y2: ey - 66, stroke: 'rgba(176,141,79,0.8)', 'stroke-width': '1.4' }));
    anchor.appendChild(el('circle', { cx: ex, cy: ey - 66, r: 3, fill: 'none', stroke: 'rgba(176,141,79,0.9)', 'stroke-width': '1.2' }));
    anchor.appendChild(
      el('path', {
        class: 'anchor',
        d: `M${ex - 34} ${ey - 52} q10 22 34 16 q24 6 34 -16`
      })
    );
    anchor.appendChild(el('line', { class: 'anchor', x1: ex - 26, y1: ey - 30, x2: ex - 34, y2: ey - 44 }));
    anchor.appendChild(el('line', { class: 'anchor', x1: ex + 26, y1: ey - 30, x2: ex + 34, y2: ey - 44 }));
    escapeGroup.appendChild(anchor);

    const t1 = el('text', { class: 'gear-sub', x: ex, y: ey + 46, 'text-anchor': 'middle' });
    t1.textContent = 'escape wheel 15 t · anchor, 2 beats per tooth';
    const t2 = el('text', { class: 'gear-sub', x: ex, y: ey + 60, 'text-anchor': 'middle' });
    t2.textContent = 'driven from the output arbor';
    escapeGroup.appendChild(t1);
    escapeGroup.appendChild(t2);

    wheels = [
      { node: A.spin, cx: A.cx, cy: A.cy, speed: state.rpm * 6, dir: 1 },
      { node: B.spin, cx: B.cx, cy: B.cy, speed: state.rpm * 6 * (state.zA / state.zB), dir: -1 },
      { node: C.spin, cx: C.cx, cy: C.cy, speed: state.rpm * 6 * (state.zA / state.zC), dir: 1 },
      { node: escSpin, cx: ex, cy: ey, speed: state.rpm * 6 * (state.zA / state.zC) * 2.4, dir: 1 }
    ];
    window.__cb.wheelCount = 4;
    window.__cb.anchor = anchor;
    window.__cb.escapeY = ey;
    window.__cb.escapeX = ex;
  }

  function readouts() {
    const m = state.module;
    const ratio = state.zC / state.zA;
    const outRpm = state.rpm / ratio;
    const vph = Math.round(outRpm * 15 * 2 * 60);
    const halfPeriod = vph > 0 ? 3600 / vph : 0;
    const L = 9.81 * Math.pow(halfPeriod / (2 * Math.PI), 2) * 1000;

    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    set('roRatio', `1 : ${ratio.toFixed(2)}`);
    set('roOut', `${outRpm.toFixed(2)} rpm`);
    set('roPitch', `${(m * state.zA).toFixed(1)} / ${(m * state.zB).toFixed(1)} / ${(m * state.zC).toFixed(1)} mm`);
    set('roCentre', `${(m * (state.zA + state.zB) / 2).toFixed(1)} / ${(m * (state.zB + state.zC) / 2).toFixed(1)} mm`);
    set('roBeat', `${vph.toLocaleString('en-GB')} vph`);
    set('roPend', `${Math.round(L)} mm`);
    set('zAOut', `${state.zA} t`);
    set('zBOut', `${state.zB} t`);
    set('zCOut', `${state.zC} t`);
    set('moduleOut', m.toFixed(2));
    set('rpmOut', `${state.rpm} rpm`);
    const bp = document.getElementById('bpRatio');
    if (bp) bp.textContent = `RATIO 1 : ${ratio.toFixed(2)}`;
    return { ratio, outRpm, vph, L };
  }

  function refresh() {
    build();
    readouts();
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let t0 = 0;

  function frame(now) {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    wheels.forEach(({ node, cx, cy, speed, dir }) => {
      const a = dir * speed * t;
      node.setAttribute('transform', `translate(${cx} ${cy}) rotate(${(a % 360).toFixed(2)})`);
    });
    if (window.__cb.anchor) {
      const beat = Math.sin(t * 2.2);
      window.__cb.anchor.setAttribute(
        'transform',
        `translate(0 ${(-beat * 4).toFixed(2)}) rotate(${(beat * 2).toFixed(2)} ${window.__cb.escapeX} ${window.__cb.escapeY})`
      );
    }
    requestAnimationFrame(frame);
  }

  window.__cb = {
    state: () => ({ ...state }),
    readouts: () => readouts(),
    set: (id, value) => {
      const input = document.getElementById(id);
      if (!input) return;
      if (input.tagName === 'SELECT') {
        input.value = String(value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    ratioText: () => document.getElementById('roRatio').textContent,
    gearPathLength: () => {
      const p = gearGroup.querySelector('path');
      return p ? p.getAttribute('d').length : 0;
    },
    wheelCount: 4,
    anchor: null,
    escapeX: 0,
    escapeY: 0
  };

  ['zA', 'zB', 'zC', 'rpm'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      state[id] = Number(input.value);
      refresh();
    });
  });
  const moduleSel = document.getElementById('module');
  if (moduleSel) {
    moduleSel.addEventListener('change', () => {
      state.module = Number(moduleSel.value);
      refresh();
    });
  }

  refresh();
  if (!reduce.matches) requestAnimationFrame(frame);
})();

/* ---------- page-level features (works on every page) ---------- */
function initPageFeatures() {
  /* movement filter */
  const filters = [...document.querySelectorAll('.filter')];
  const items = [...document.querySelectorAll('.movement')];
  const countEl = document.getElementById('movementCount');
  if (filters.length && items.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        items.forEach((it) => {
          const match = kind === 'all' || it.dataset.kind === kind;
          it.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (countEl) {
          countEl.textContent = kind === 'all'
            ? 'Six movements shown'
            : `${shown} of 6 movements shown`;
        }
      });
    });
  }

  /* commission enquiry */
  const form = document.getElementById('commissionForm');
  if (!form) return;
  const result = document.getElementById('commissionResult');
  const preview = document.getElementById('commissionPreview');
  const send = document.getElementById('commissionSend');
  const edit = document.getElementById('commissionEdit');
  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    message: document.getElementById('message'),
    consent: document.getElementById('consent')
  };
  const rules = {
    name: (v) => v.trim().length > 1,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    message: (v) => v.trim().length > 8,
    consent: (v, el) => el.checked
  };
  Object.entries(fields).forEach(([key, el]) => {
    const err = document.getElementById(`err-${key}`);
    if (!err) return;
    el.setAttribute('aria-describedby', err.id);
    const clear = () => { err.hidden = true; el.removeAttribute('aria-invalid'); };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });
  const validate = () => {
    let firstBad = null;
    Object.entries(fields).forEach(([key, el]) => {
      const err = document.getElementById(`err-${key}`);
      const ok = rules[key](el.value, el);
      if (err) err.hidden = ok;
      if (ok) el.removeAttribute('aria-invalid');
      else {
        el.setAttribute('aria-invalid', 'true');
        if (!firstBad) firstBad = el;
      }
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const get = (id) => document.getElementById(id);
    const brief = [
      'Commission enquiry — Clockwork Brass',
      '',
      `Name: ${fields.name.value.trim()}`,
      `Email: ${fields.email.value.trim()}`,
      `Kind of work: ${get('kind').value}`,
      `Piece or maker: ${get('piece').value.trim() || 'not stated'}`,
      `Size: ${get('size').value.trim() || 'not stated'}`,
      `Budget band: ${get('budget').value}`,
      `Deadline: ${get('deadline').value.trim() || 'none'}`,
      `Winding: ${get('winding').value}`,
      '',
      fields.message.value.trim(),
      '',
      'Estimate terms acknowledged: yes'
    ].join('\n');
    preview.textContent = brief;
    send.href = `mailto:bench@clockworkbrass.studio?subject=${encodeURIComponent('Enquiry — ' + fields.name.value.trim())}&body=${encodeURIComponent(brief)}`;
    result.hidden = false;
    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  edit.addEventListener('click', () => {
    result.hidden = true;
    fields.name.focus();
  });
}
