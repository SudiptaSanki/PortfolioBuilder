/* Vaani Raghavan — wedding planner
   Hand-drawn mandapam plan (top view) + working cost band.
   No libraries. */
(() => {
  'use strict';

  /* ── chrome ─────────────────────────────────────────────── */
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

  const reveal = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && reveal.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add('in'));
  }

  /* ── planner ────────────────────────────────────────────── */
  const svg = document.getElementById('plan-svg');
  const form = document.getElementById('plan-form');
  if (svg && form) initPlanner();

  function initPlanner() {
  const out = {
    size: document.getElementById('out-size'),
    counts: document.getElementById('out-counts'),
    flower: document.getElementById('out-flower'),
    crew: document.getElementById('out-crew'),
    cost: document.getElementById('out-cost'),
    bars: document.getElementById('bars'),
    key: document.getElementById('bar-key'),
  };

  const TOWNS = {
    chennai: { label: 'Chennai', mult: 1.0 },
    madurai: { label: 'Madurai', mult: 0.82 },
    coimbatore: { label: 'Coimbatore', mult: 0.79 },
    bengaluru: { label: 'Bengaluru', mult: 1.18 },
  };

  const STYLES = {
    four: { label: 'four-pillar kalyana mandapam', venue: 240000, perGuest: 450, pillar: 4, cloth: false },
    pandal: { label: 'open-air pandal', venue: 108000, perGuest: 260, pillar: 0, cloth: true },
    hall: { label: 'leased thousand-pillar hall', venue: 320000, perGuest: 300, pillar: 0, cloth: false },
  };

  const PALETTE = ['#94282a', '#a8812f', '#2b1c18', '#6b5344', '#c9a85e', '#8a7365'];

  const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const lakh = (n) => (n / 100000).toFixed(1);

  function readForm() {
    const guests = parseInt(form.querySelector('input[name="guests"]:checked').value, 10);
    const style = form.querySelector('input[name="style"]:checked').value;
    const town = document.getElementById('town').value;
    const reception = document.getElementById('reception').value === 'yes';
    const sangeet = document.getElementById('sangeet').checked;
    return { guests, style, town, reception, sangeet };
  }

  function geometry(guests, style) {
    const hallW = 66 + guests * 0.062;
    const hallD = 54 + guests * 0.052;
    const S = Math.min(hallW * 0.5, 16 + guests / 58);
    const path = 7;
    const scale = Math.min(556 / hallW, 448 / hallD);
    const pxW = hallW * scale;
    const pxD = hallD * scale;
    const ox = 52 + (560 - pxW) / 2;
    const oy = 56;
    const side = S * scale;
    const mx = ox + (pxW - side) / 2;
    const my = oy + 10;
    const family = Math.min(36, Math.round(guests * 0.1));
    const chairs = Math.max(0, guests - family);
    return { hallW, hallD, S, path, scale, pxW, pxD, ox, oy, side, mx, my, family, chairs, style };
  }

  function drawPlan(g) {
    const { scale, ox, oy, pxW, pxD, side, mx, my, path, chairs, family } = g;
    const chairW = 1.65 * scale;
    const chairD = 1.5 * scale;
    const colGap = 1.9 * scale;
    const pathPx = path * scale;
    const cx = ox + pxW / 2;

    const seatTop = my + side + 7 * scale;
    const seatBottom = oy + pxD - 7 * scale;
    const depthAvail = seatBottom - seatTop;
    const blockW = (pxW - 10 * scale - pathPx) / 2;
    const perSide = Math.max(3, Math.floor(blockW / colGap));
    const perRow = perSide * 2;
    const rows = Math.max(1, Math.ceil(chairs / perRow));
    const maxRows = Math.max(1, Math.floor(depthAvail / (2.6 * scale)));
    const drawnRows = Math.min(rows, maxRows);
    const rowPitch = depthAvail / drawnRows;
    const drawn = Math.min(chairs, drawnRows * perRow);

    let seatRects = '';
    let left = drawn;
    for (let r = 0; r < drawnRows && left > 0; r++) {
      const y = seatTop + r * rowPitch;
      const n = Math.min(left, perRow);
      const nl = Math.min(perSide, Math.ceil(n / 2));
      const nr = Math.min(perSide, n - nl);
      for (let c = 0; c < nl; c++) {
        const x = cx - pathPx / 2 - 3 * scale - (c + 1) * colGap;
        seatRects += `<rect class="p-seat" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${chairW.toFixed(1)}" height="${chairD.toFixed(1)}" rx=".8"/>`;
      }
      for (let c = 0; c < nr; c++) {
        const x = cx + pathPx / 2 + 3 * scale + c * colGap;
        seatRects += `<rect class="p-seat" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${chairW.toFixed(1)}" height="${chairD.toFixed(1)}" rx=".8"/>`;
      }
      left -= nl + nr;
    }

    // pillars
    const inset = 3.2 * scale;
    const pillars = [[mx + inset, my + inset], [mx + side - inset, my + inset], [mx + inset, my + side - inset], [mx + side - inset, my + side - inset]]
      .map(([x, y]) => `<circle class="p-pillar" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3, scale * 0.9).toFixed(1)}"/>`).join('');

    const agniCx = mx + side / 2;
    const agniCy = my + side * 0.46;
    const swingW = side * 0.28;

    return `
      <g>
        <rect class="p-outline p-drawn" x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="${pxW.toFixed(1)}" height="${pxD.toFixed(1)}"/>
        <text class="p-dim-txt" x="${ox.toFixed(1)}" y="${(oy - 14).toFixed(1)}">${g.hallW.toFixed(0)} FT HALL · ${g.hallD.toFixed(0)} FT DEEP</text>

        <!-- procession path -->
        <rect class="p-path" x="${(cx - pathPx / 2).toFixed(1)}" y="${(my + side).toFixed(1)}" width="${pathPx.toFixed(1)}" height="${(oy + pxD - (my + side)).toFixed(1)}"/>
        <text class="p-dim-txt" x="${(cx + pathPx / 2 + 6).toFixed(1)}" y="${(oy + pxD - 20).toFixed(1)}">PATH ${path} FT</text>

        <!-- mandapam -->
        <rect class="p-mandap" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" width="${side.toFixed(1)}" height="${side.toFixed(1)}"/>
        <rect x="${(mx + 4).toFixed(1)}" y="${(my + 4).toFixed(1)}" width="${(side - 8).toFixed(1)}" height="${(side - 8).toFixed(1)}" fill="none" stroke="#a8812f" stroke-width=".5" stroke-dasharray="2 3" opacity=".8"/>
        ${pillars}
        <circle class="p-agni" cx="${agniCx.toFixed(1)}" cy="${agniCy.toFixed(1)}" r="${Math.max(5, scale * 0.85).toFixed(1)}"/>
        <circle cx="${agniCx.toFixed(1)}" cy="${agniCy.toFixed(1)}" r="${Math.max(9, scale * 1.55).toFixed(1)}" fill="none" stroke="#94282a" stroke-width=".5" opacity=".55"/>
        <rect class="p-swing" x="${(agniCx - swingW / 2).toFixed(1)}" y="${(my + side * 0.72).toFixed(1)}" width="${swingW.toFixed(1)}" height="${(side * 0.09).toFixed(1)}" rx="1"/>
        <text class="p-label" x="${mx.toFixed(1)}" y="${(my + side - 6).toFixed(1)}">MANDAPAM ${g.S.toFixed(0)} × ${g.S.toFixed(0)} FT</text>
        <text class="p-label" x="${(cx - 12).toFixed(1)}" y="${(agniCy - Math.max(14, scale * 2.2)).toFixed(1)}" text-anchor="middle" style="font-size:8px">AGNI</text>

        ${seatRects}
        <text class="p-label" x="${(cx - pathPx / 2 - 8).toFixed(1)}" y="${(oy + pxD + 16).toFixed(1)}" text-anchor="end">${drawn} SEATS DRAWN · ${family} FAMILY INSIDE</text>
        <text class="p-dim-txt" x="${(ox + pxW).toFixed(1)}" y="${(oy + pxD + 16).toFixed(1)}" text-anchor="end">ENTRANCE ↓</text>
      </g>`;
  }

  function compute() {
    const { guests, style, town, reception, sangeet } = readForm();
    const g = geometry(guests, style);
    svg.innerHTML = drawPlan(g);

    const t = TOWNS[town];
    const s = STYLES[style];

    /* quantities */
    const staff = Math.ceil(guests * 0.12) + 10;
    const plates = guests + staff;
    const metres = Math.round((g.S * 4 * 2.4 + 12 + 7 + guests * 0.02) / 5) * 5;
    const jasmine = Math.round((g.S * 1.15 + guests * 0.028) * 10) / 10;
    const chairsTotal = guests + Math.round(guests * 0.08);
    const crew = Math.ceil(guests / 45) + 9;
    const setupDays = guests <= 250 ? 1 : guests <= 700 ? 2 : 3;

    /* money */
    const venue = (s.venue + guests * s.perGuest) * t.mult;
    const plateRate = { chennai: 980, madurai: 820, coimbatore: 770, bengaluru: 1120 }[town];
    let catering = plates * plateRate * t.mult;
    if (reception) catering += guests * plateRate * 1.05 * 0.55 * t.mult;
    const decor = (metres * 620 + jasmine * 880 + 38000 + (s.cloth ? 45000 : 0)) * t.mult;
    const photo = (168000 + guests * 95) * t.mult;
    let music = 42000 * t.mult;
    if (reception) music += 26000 * t.mult;
    if (sangeet) music += 0;
    let extras = 0;
    if (sangeet) extras += (68000 + guests * 85) * t.mult;
    extras += (plates * 60 + 42000) * t.mult; // leaf, priest dakshina, invites, transport
    const sub = venue + catering + decor + photo + music + extras;
    const misc = sub * 0.055;
    const total = sub + misc;
    const lo = total * 0.93;
    const hi = total * 1.13;

    /* write */
    out.size.textContent = `${g.S.toFixed(0)} × ${g.S.toFixed(0)} ft mandapam`;
    out.counts.textContent = `${chairsTotal} chairs · ${plates} leaves`;
    out.flower.textContent = `${metres} m garland · ${jasmine.toFixed(1)} kg`;
    out.crew.textContent = `${crew} crew · ${setupDays} day${setupDays > 1 ? 's' : ''} setup`;
    out.cost.textContent = `₹${lakh(lo)}–${lakh(hi)} L`;

    const lines = [
      ['Venue', venue],
      ['Catering', catering],
      ['Flowers & decor', decor],
      ['Photography', photo],
      ['Music', music],
      ['Sangeet & misc', extras + misc],
    ];
    out.bars.innerHTML = lines.map(([, v], i) =>
      `<span style="background:${PALETTE[i]};width:${((v / total) * 100).toFixed(1)}%"></span>`).join('');
    out.key.innerHTML = lines.map(([k, v], i) =>
      `<li><i style="background:${PALETTE[i]}"></i>${k}<b>${rupees(v)}</b></li>`).join('');
  }

  form.addEventListener('change', compute);
  form.addEventListener('submit', (e) => e.preventDefault());
  compute();
  }

  /* ── wedding filters ────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.filters button[data-town]');
  if (filterBtns.length) {
    const cases = document.querySelectorAll('.case');
    filterBtns.forEach((btn) => btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const town = btn.dataset.town;
      cases.forEach((c) => { c.hidden = town !== 'all' && c.dataset.town !== town; });
    }));
  }

  /* ── contact form ───────────────────────────────────────── */
  const cform = document.getElementById('contact-form');
  if (cform) {
    const status = document.getElementById('form-status');
    const fields = [...cform.querySelectorAll('input, textarea, select')];
    const errFor = (el) => {
      const p = el.closest('.field') || el.closest('label') || el.parentElement;
      return p ? p.querySelector('.err') : null;
    };
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      fields.forEach((el) => {
        let msg = '';
        const v = (el.value || '').trim();
        if (el.required && !v) msg = 'Please fill this.';
        else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email looks incomplete.';
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Add the country code or full number.';
        const slot = errFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      status.hidden = false;
      status.textContent = 'Thank you — Vaani reads enquiries on Tuesday mornings and will write back within three days.';
      cform.reset();
      status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    fields.forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        const slot = errFor(el);
        if (slot) slot.textContent = '';
        el.setAttribute('aria-invalid', 'false');
      }
    }));
  }
})();
