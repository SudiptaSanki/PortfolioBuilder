/* Murti Marble — page behaviour
   The calculator divides a chosen height into shilpa-shastra head-lengths and
   draws a measured elevation from those numbers. No sound, no canvas. */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- plate filters ---------- */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (filterButtons.length) {
    const plates = [...document.querySelectorAll('.plate[data-group]')];
    filterButtons.forEach((btn) => btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      plates.forEach((p) => { p.hidden = btn.dataset.filter !== 'all' && p.dataset.group !== btn.dataset.filter; });
    }));
  }

  /* ---------- commission form ---------- */
  const form = document.getElementById('murti-form');
  if (form) {
    const status = document.getElementById('murti-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const formType = form.querySelector('#form-type');
      const height = form.querySelector('#height-field');
      const material = form.querySelector('#material-field');
      const notes = form.querySelector('#notes');
      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!formType.value) bad.push(formType);
      if (!height.value || Number(height.value) < 6 || Number(height.value) > 120) bad.push(height);
      if (!material.value) bad.push(material);
      if (notes.value.trim().length < 6) bad.push(notes);

      [name, email, formType, height, material, notes].forEach((el) => {
        const w = el.closest('.field');
        const isBad = bad.includes(el);
        if (w) w.classList.toggle('invalid', isBad);
        el.setAttribute('aria-invalid', String(isBad));
      });

      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'Some fields still need an answer. Nothing has been sent.';
        bad[0].focus();
        return;
      }

      const first = name.value.trim().split(' ')[0];
      const big = Number(height.value) > 60;
      status.className = 'form-status ok';
      status.textContent = big
        ? `Thank you, ${first}. At ${height.value} inches this needs a block we may not have on the yard; I will check the quarry list and write within four days.`
        : `Thank you, ${first}. Your note is on the workshop desk. I answer on Monday and Thursday evenings and will send a first sketch of the proportions.`;
      form.reset();
      [name, email, formType, height, material, notes].forEach((el) => {
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

  /* ---------- the proportion calculator ---------- */
  const stage = document.getElementById('murtiStage');
  if (!stage) return;

  const FORMS = {
    devi: { label: 'Devi standing', faces: 9, seated: false, arms: 4, extra: 0 },
    ganesha: { label: 'Ganesha seated', faces: 8, seated: true, arms: 4, extra: 2 },
    nataraja: { label: 'Nataraja', faces: 8.5, seated: false, ring: true, arms: 4, extra: 3 },
    buddha: { label: 'Buddha standing', faces: 9, seated: false, arms: 2, extra: -1 },
  };

  const MATERIALS = {
    marble: { label: 'Makrana marble', density: 2.7, rate: 9000, fill: 0.44, tone: '#f7f4ec', tone2: '#e4ded1', stroke: '#211f1b' },
    sandstone: { label: 'Dholpur sandstone', density: 2.3, rate: 6500, fill: 0.44, tone: '#e0bd97', tone2: '#cfa982', stroke: '#211f1b' },
    bronze: { label: 'Bronze', density: 8.4, rate: 15000, fill: 0.16, tone: '#8aa091', tone2: '#5d7468', stroke: '#1c231f' },
  };

  const FINISHES = { polished: 1.15, matte: 1.0, antique: 1.08 };

  const state = { form: 'devi', material: 'marble', height: 36, finish: 'polished' };

  const out = {
    formOut: document.getElementById('formOut'),
    materialOut: document.getElementById('materialOut'),
    heightOut: document.getElementById('heightOut'),
    finishOut: document.getElementById('finishOut'),
    height: document.getElementById('height'),
    rTala: document.getElementById('rTala'),
    rWidth: document.getElementById('rWidth'),
    rBlock: document.getElementById('rBlock'),
    rWeight: document.getElementById('rWeight'),
    rWeeks: document.getElementById('rWeeks'),
    rPrice: document.getElementById('rPrice'),
    sheetRef: document.getElementById('sheetRef'),
  };

  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

  function figure(form, px, paint) {
    /* px = figure height in drawing pixels, from crown to feet; feet sit at y=470 */
    const f = FORMS[form];
    const hd = px / f.faces;            /* one face-length */
    const cx = 310;
    const feet = paint.feet;
    const top = feet - px;
    const headCy = top + hd * 0.5;
    const neck = top + hd * 1.04;
    const shoulder = top + hd * 1.42;
    const waist = top + hd * 3.1;
    const hip = top + hd * 4.1;
    const hs = hd * 0.92;               /* half shoulder */
    const ww = hd * 0.62;
    const wh = hd * 0.95;
    const wb = hd * 1.45;
    const ink = MATERIALS[state.material].stroke;
    const tone = MATERIALS[state.material].tone;
    const g = [];

    g.push(`<defs><linearGradient id="figGrad" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="${tone}"/><stop offset="0.62" stop-color="${tone}"/>
      <stop offset="1" stop-color="${MATERIALS[state.material].tone2}"/></linearGradient></defs>`);

    if (f.ring) {
      g.push(`<circle cx="${cx}" cy="${(top + feet) / 2}" r="${px * 0.55}" fill="none" stroke="#a8563a" stroke-width="2.4" opacity=".6"/>`);
      g.push(`<circle cx="${cx}" cy="${(top + feet) / 2}" r="${px * 0.51}" fill="none" stroke="#c9a67a" stroke-width="1" opacity=".65"/>`);
    } else if (!f.seated) {
      g.push(`<circle cx="${cx}" cy="${headCy}" r="${hd * 2.4}" fill="none" stroke="#c9a67a" stroke-width="1" stroke-dasharray="3 5" opacity=".55"/>`);
    }

    if (f.seated) {
      /* crossed legs: a low broad base */
      g.push(`<path d="M${cx - hd * 1.9} ${feet} c0 -${hd * 0.75} ${hd * 0.9} -${hd * 1.05} ${hd * 1.9} -${hd * 1.05} c${hd} 0 ${hd * 1.9} ${hd * 0.3} ${hd * 1.9} ${hd * 1.05}Z"
        fill="url(#figGrad)" stroke="${ink}" stroke-width="1.4"/>`);
      g.push(`<ellipse cx="${cx}" cy="${feet - hd * 0.5}" rx="${hd * 1.55}" ry="${hd * 0.34}" fill="none" stroke="${ink}" stroke-width=".9" opacity=".5"/>`);
      /* belly and torso */
      g.push(`<path d="M${cx - hs * 0.9} ${shoulder} L${cx + hs * 0.9} ${shoulder} C${cx + hd * 1.15} ${shoulder + hd} ${cx + hd * 1.05} ${hip - hd * 0.5} ${cx + hd * 1.25} ${hip}
        L${cx - hd * 1.25} ${hip} C${cx - hd * 1.05} ${hip - hd * 0.5} ${cx - hd * 1.15} ${shoulder + hd} ${cx - hs * 0.9} ${shoulder}Z"
        fill="url(#figGrad)" stroke="${ink}" stroke-width="1.4"/>`);
      g.push(`<path d="M${cx - hd * 0.75} ${waist} c${hd * 0.5} ${hd * 0.22} ${hd * 1.0} ${hd * 0.22} ${hd * 1.5} 0" stroke="#a8563a" stroke-width="2" fill="none" opacity=".45"/>`);
    } else {
      /* standing: one continuous silhouette from shoulder to hem */
      g.push(`<path d="M${cx - hs} ${shoulder}
        L${cx + hs} ${shoulder}
        C${cx + ww} ${shoulder + hd * 0.9} ${cx + ww} ${waist - hd * 0.4} ${cx + ww} ${waist}
        C${cx + wh} ${waist + hd * 0.5} ${cx + wb * 0.92} ${hip + hd * 2.4} ${cx + wb} ${feet}
        L${cx - wb} ${feet}
        C${cx - wb * 0.92} ${hip + hd * 2.4} ${cx - wh} ${waist + hd * 0.5} ${cx - ww} ${waist}
        C${cx - ww} ${waist - hd * 0.4} ${cx - ww} ${shoulder + hd * 0.9} ${cx - hs} ${shoulder}Z"
        fill="url(#figGrad)" stroke="${ink}" stroke-width="1.4"/>`);
      /* drapery */
      const folds = [];
      for (let i = -2; i <= 2; i++) {
        const xTop = cx + i * hd * 0.32;
        const xBot = cx + i * hd * 0.72;
        folds.push(`M${xTop} ${waist + hd * 0.3} L${xBot} ${feet - hd * 0.1}`);
      }
      g.push(`<path d="${folds.join('')}" stroke="${ink}" stroke-width=".7" fill="none" opacity=".28"/>`);
      /* hem band */
      g.push(`<path d="M${cx - wb * 0.96} ${feet - hd * 0.22} Q${cx} ${feet - hd * 0.06} ${cx + wb * 0.96} ${feet - hd * 0.22}" stroke="#a8563a" stroke-width="1.6" fill="none" opacity=".55"/>`);
    }

    /* sash */
    g.push(`<path d="M${cx - ww - 2} ${waist - hd * 0.15} Q${cx} ${waist + hd * 0.18} ${cx + ww + 2} ${waist - hd * 0.15} Q${cx} ${waist + hd * 0.42} ${cx - ww - 2} ${waist - hd * 0.15}Z" fill="#b3543a" opacity=".45"/>`);

    /* neck */
    g.push(`<path d="M${cx - hd * 0.22} ${neck - hd * 0.08} h${hd * 0.44} v${hd * 0.3} h-${hd * 0.44}Z" fill="url(#figGrad)" stroke="${ink}" stroke-width="1.1"/>`);

    /* head */
    g.push(`<ellipse cx="${cx}" cy="${headCy}" rx="${hd * 0.38}" ry="${hd * 0.46}" fill="url(#figGrad)" stroke="${ink}" stroke-width="1.2"/>`);
    /* crown */
    g.push(`<path d="M${cx - hd * 0.4} ${headCy - hd * 0.4} L${cx} ${headCy - hd * 0.78} L${cx + hd * 0.4} ${headCy - hd * 0.4} L${cx + hd * 0.28} ${headCy - hd * 0.32} L${cx} ${headCy - hd * 0.55} L${cx - hd * 0.28} ${headCy - hd * 0.32}Z" fill="url(#figGrad)" stroke="${ink}" stroke-width="1.1"/>`);
    g.push(`<circle cx="${cx}" cy="${headCy - hd * 0.86}" r="${hd * 0.06}" fill="#a8563a" opacity=".85"/>`);
    /* face */
    g.push(`<path d="M${cx - hd * 0.17} ${headCy - hd * 0.03} q${hd * 0.06} -${hd * 0.05} ${hd * 0.12} 0 M${cx + hd * 0.05} ${headCy - hd * 0.03} q${hd * 0.06} -${hd * 0.05} ${hd * 0.12} 0" stroke="${ink}" stroke-width="1" fill="none"/>`);
    g.push(`<path d="M${cx - hd * 0.08} ${headCy + hd * 0.2} q${hd * 0.08} ${hd * 0.06} ${hd * 0.16} 0" stroke="#a8563a" stroke-width="1" fill="none"/>`);
    /* earrings for the Devi */
    if (form === 'devi') {
      g.push(`<circle cx="${cx - hd * 0.4}" cy="${headCy + hd * 0.08}" r="${hd * 0.07}" fill="none" stroke="#a8563a" stroke-width="1"/>`);
      g.push(`<circle cx="${cx + hd * 0.4}" cy="${headCy + hd * 0.08}" r="${hd * 0.07}" fill="none" stroke="#a8563a" stroke-width="1"/>`);
    }

    if (form === 'ganesha') {
      g.push(`<path d="M${cx} ${headCy + hd * 0.18} q${hd * 0.06} ${hd * 0.45} -${hd * 0.26} ${hd * 0.5}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`);
      g.push(`<path d="M${cx - hd * 0.38} ${headCy} q-${hd * 0.3} ${hd * 0.1} -${hd * 0.22} ${hd * 0.36} q${hd * 0.06} ${hd * 0.16} ${hd * 0.2} ${hd * 0.04}" fill="url(#figGrad)" stroke="${ink}" stroke-width="1"/>`);
      g.push(`<path d="M${cx + hd * 0.38} ${headCy} q${hd * 0.3} ${hd * 0.1} ${hd * 0.22} ${hd * 0.36} q-${hd * 0.06} ${hd * 0.16} -${hd * 0.2} ${hd * 0.04}" fill="url(#figGrad)" stroke="${ink}" stroke-width="1"/>`);
    }

    /* arms: outlined limbs, four for Devi/Ganesha/Nataraja, two for Buddha */
    const armY = f.seated ? shoulder + hd * 0.1 : shoulder + hd * 0.18;
    const drawArm = (x0, y0, c1x, c1y, x1, y1, w) => {
      g.push(`<path d="M${x0} ${y0} Q${c1x} ${c1y} ${x1} ${y1}" fill="none" stroke="${ink}" stroke-width="${w + 2.6}" stroke-linecap="round"/>`);
      g.push(`<path d="M${x0} ${y0} Q${c1x} ${c1y} ${x1} ${y1}" fill="none" stroke="${tone}" stroke-width="${w}" stroke-linecap="round"/>`);
    };
    const pair = f.arms / 2;
    for (let i = 0; i < pair; i++) {
      const drop = i === 0 ? -hd * 0.85 : hd * 1.55;
      const reach = hd * (i === 0 ? 1.05 : 1.25);
      drawArm(cx - hs * 0.85, armY, cx - hs - reach * 0.7, armY + drop * 0.35, cx - hs - reach, armY + drop, Math.max(4, hd * 0.17));
      drawArm(cx + hs * 0.85, armY, cx + hs + reach * 0.7, armY + drop * 0.35, cx + hs + reach, armY + drop, Math.max(4, hd * 0.17));
      /* hand */
      g.push(`<circle cx="${cx - hs - reach}" cy="${armY + drop}" r="${Math.max(3, hd * 0.1)}" fill="${tone}" stroke="${ink}" stroke-width="1"/>`);
      g.push(`<circle cx="${cx + hs + reach}" cy="${armY + drop}" r="${Math.max(3, hd * 0.1)}" fill="${tone}" stroke="${ink}" stroke-width="1"/>`);
      if (i === 0) {
        /* the upper hands carry a lotus and a conch */
        g.push(`<path d="M${cx - hs - reach} ${armY + drop - hd * 0.24} c-${hd * 0.14} -${hd * 0.06} -${hd * 0.2} -${hd * 0.18} -${hd * 0.16} -${hd * 0.3} c${hd * 0.08} -${hd * 0.02} ${hd * 0.16} ${hd * 0.06} ${hd * 0.16} ${hd * 0.14} c0 -${hd * 0.08} ${hd * 0.08} -${hd * 0.16} ${hd * 0.16} -${hd * 0.14} c${hd * 0.04} ${hd * 0.12} -${hd * 0.02} ${hd * 0.24} -${hd * 0.16} ${hd * 0.3}Z" fill="#f4efe2" stroke="${ink}" stroke-width=".9"/>`);
        g.push(`<path d="M${cx + hs + reach} ${armY + drop - hd * 0.1} c-${hd * 0.06} -${hd * 0.2} ${hd * 0.02} -${hd * 0.32} ${hd * 0.12} -${hd * 0.38} ${hd * 0.1} ${hd * 0.1} ${hd * 0.14} ${hd * 0.24} ${hd * 0.08} ${hd * 0.38}Z" fill="#f4efe2" stroke="${ink}" stroke-width=".9"/>`);
      }
    }

    /* pedestal */
    const pedH = paint.pedPx;
    g.push(`<path d="M${cx - hd * 1.95} ${feet} h${hd * 3.9} v${pedH * 0.48} h-${hd * 3.9}Z" fill="${tone}" stroke="${ink}" stroke-width="1.2"/>`);
    g.push(`<path d="M${cx - hd * 2.2} ${feet + pedH * 0.48} h${hd * 4.4} v${pedH * 0.52} h-${hd * 4.4}Z" fill="${MATERIALS[state.material].tone2}" stroke="${ink}" stroke-width="1.2"/>`);

    return { svg: g.join(''), top, feet, pedH, head: hd, cx };
  }

  function dimensions(fig, totalIn, pedIn) {
    const { cx, top, feet, pedH, head } = fig;
    const baseY = feet + pedH;
    const g = [];
    g.push(`<g stroke="#a8563a" stroke-width="1" fill="none">
      <path d="M${cx - head * 3.4} ${baseY}V${top}M${cx - head * 3.52} ${baseY}h${head * 0.24}M${cx - head * 3.52} ${top}h${head * 0.24}"/>
      <path d="M${cx - head * 3.4} ${top}l-4 8M${cx - head * 3.4} ${top}l4 8M${cx - head * 3.4} ${baseY}l-4 -8M${cx - head * 3.4} ${baseY}l4 -8"/>
      <path d="M${cx + head * 3.0} ${baseY}V${feet}M${cx + head * 2.88} ${baseY}h${head * 0.24}M${cx + head * 2.88} ${feet}h${head * 0.24}"/>
      <path d="M${cx + head * 3.0} ${feet}l-4 8M${cx + head * 3.0} ${feet}l4 8M${cx + head * 3.0} ${baseY}l-4 -8M${cx + head * 3.0} ${baseY}l4 -8"/>
      <path d="M${cx + head * 1.4} ${top}h${head * 1.6}"/>
      <path d="M${cx + head * 3.0} ${top}l-8 -4M${cx + head * 3.0} ${top}l-8 4"/>
    </g>`);
    g.push(`<g font-family="Archivo, sans-serif" font-size="10" fill="#a8563a" letter-spacing="1.4">
      <text x="${cx - head * 3.4 - 12}" y="${(top + baseY) / 2}" transform="rotate(-90 ${cx - head * 3.4 - 12} ${(top + baseY) / 2})" text-anchor="middle">TOTAL ${totalIn} IN</text>
      <text x="${cx + head * 3.0 + 8}" y="${(feet + baseY) / 2 + 4}" text-anchor="start" font-size="9">PEDESTAL ${pedIn} IN</text>
      <text x="${cx + head * 1.5}" y="${top - 8}" font-size="9">HEAD</text>
    </g>`);
    return g.join('');
  }

  function render() {
    const f = FORMS[state.form];
    const m = MATERIALS[state.material];
    const H = state.height;

    const pedIn = Math.max(2, Math.round(H * (f.seated ? 0.2 : 0.22)));
    const figIn = H - pedIn;
    const headIn = figIn / f.faces;
    const widthIn = headIn * 2;
    const depthIn = headIn * 1.5;

    const blockW = Math.round(widthIn * 1.85 * 2.54);
    const blockD = Math.round(depthIn * 1.7 * 2.54);
    const blockH = Math.round(H * 1.06 * 2.54);
    const volume = blockW * blockD * blockH;
    const weight = Math.round(volume * m.density * m.fill / 1000);

    const weeks = Math.max(3, Math.round(H / 7 + f.extra + (state.material === 'bronze' ? -2 : 0)));
    const price = Math.round((H * m.rate + 40000) * FINISHES[state.finish]);

    out.formOut.textContent = f.label;
    out.materialOut.textContent = m.label;
    out.heightOut.textContent = `${H} in`;
    out.finishOut.textContent = { polished: 'Hand-polished', matte: 'Matte', antique: 'Antique' }[state.finish];
    out.height.value = String(H);
    out.rTala.innerHTML = `${f.faces} faces<small>${headIn.toFixed(1)} in per face</small>`;
    out.rWidth.innerHTML = `${Math.round(widthIn)} in<small>shoulder to shoulder</small>`;
    out.rBlock.innerHTML = `${blockW} × ${blockD} × ${blockH} cm<small>rough, before carving</small>`;
    out.rWeight.innerHTML = `${weight} kg<small>finished, approximate</small>`;
    out.rWeeks.innerHTML = `${weeks} weeks<small>after block selection</small>`;
    out.rPrice.innerHTML = `${inr(price)}<small>before packing</small>`;
    out.sheetRef.textContent = `M-${H}${state.form.charAt(0).toUpperCase()}`;

    /* total drawing height ~ 400 px, split between figure and pedestal */
    const totalPx = 400;
    const figPx = totalPx * (figIn / H);
    const pedPx = totalPx * (pedIn / H);
    const feetY = 500 - pedPx;
    const fig = figure(state.form, figPx, { pedPx, feet: feetY });

    stage.innerHTML = `${fig.svg}${dimensions(fig, H, pedIn)}
      <g font-family="Archivo, sans-serif" font-size="8.5" fill="#8b8578" letter-spacing="1.4">
        <text x="24" y="536">${f.label.toUpperCase()} · ${m.label.toUpperCase()}</text>
        <text x="470" y="536">SHEET ${out.sheetRef.textContent}</text>
      </g>
      <line x1="24" y1="524" x2="596" y2="524" stroke="#b6b0a2" stroke-width=".7"/>`;
  }

  document.querySelectorAll('[data-form]').forEach((btn) => btn.addEventListener('click', () => {
    state.form = btn.dataset.form;
    document.querySelectorAll('[data-form]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));
  document.querySelectorAll('[data-mat]').forEach((btn) => btn.addEventListener('click', () => {
    state.material = btn.dataset.mat;
    document.querySelectorAll('[data-mat]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));
  document.querySelectorAll('[data-finish]').forEach((btn) => btn.addEventListener('click', () => {
    state.finish = btn.dataset.finish;
    document.querySelectorAll('[data-finish]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));
  out.height.addEventListener('input', () => {
    state.height = Number(out.height.value);
    render();
  });

  render();
})();
