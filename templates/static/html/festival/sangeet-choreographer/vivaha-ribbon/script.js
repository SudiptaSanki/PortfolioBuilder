/* Rhea Menon — sangeet choreographer
   Set builder: counts, formation plan, rehearsal schedule, fee.
   Hand-drawn stage plan in SVG. No libraries. */
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

  /* set builder */
  const form = document.getElementById('set-form');
  if (form) build();

  function build() {
    const sl = (id) => document.getElementById(id);
    const $ = sl;
    const stageSvg = sl('stage-svg');

    const GROUPS = {
      cousins: { name: 'Bride\u2019s cousins & siblings', pref: 'v', couple: true },
      friends: { name: 'Groom\u2019s friends', pref: 'diagonal', couple: false },
      uncles: { name: 'Uncles & aunts', pref: 'rows', couple: false },
      kids: { name: 'The kids\u2019 squad', pref: 'circle', couple: false },
    };
    const FORM_NAMES = { rows: 'Two rows, staggered', v: 'V, couple at the point', circle: 'Circle, couple inside', diagonal: 'Diagonal line' };

    const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    function state() {
      return {
        group: $('group').value,
        formation: $('formation').value,
        dancers: parseInt($('dancers').value, 10),
        weeks: parseInt($('weeks').value, 10),
        seconds: parseInt($('length').value, 10),
        bpm: parseInt($('tempo').value, 10),
        width: parseInt($('width').value, 10),
      };
    }

    function resolveFormation(s) {
      if (s.formation !== 'auto') return s.formation;
      const pref = GROUPS[s.group].pref;
      if (pref === 'rows') return 'rows';
      if (pref === 'v' && s.dancers > 26) return 'rows';
      if (pref === 'circle' && s.dancers > 22) return 'rows';
      if (pref === 'diagonal' && s.dancers > 20) return 'two';
      return pref;
    }

    function layout(s, form) {
      const f = form === 'two' ? 'rows' : form;
      const counts = Math.floor((s.seconds * s.bpm) / 480);
      const perRow = Math.max(2, Math.floor((s.width - 3) / 2.3));
      const rows = Math.ceil(s.dancers / perRow);
      const depth = Math.max(10, rows * 3 + 6);
      const changes = (s.dancers <= 10 ? 1 : s.dancers <= 24 ? 2 : 3) - (s.weeks < 5 ? 1 : 0);
      const baseSessions = Math.ceil(s.dancers / 6) + 2 + Math.max(0, changes - 2);
      const capacity = Math.max(2, s.weeks * 2 - 1);
      const sessions = Math.min(baseSessions, capacity);
      let fee = 60000 + s.dancers * 2600 + (counts > 50 ? 12000 : 0) + (s.weeks <= 4 ? 25000 : 0);
      if (f === 'v' || f === 'circle') fee += 8000;
      const warn = baseSessions > capacity
        ? `You have room for ${capacity} sessions in ${s.weeks} weeks and this set wants ${baseSessions}. I would cut one formation or add a Sunday morning.`
        : '';
      return { f, counts, perRow, rows, depth, changes, sessions, baseSessions, capacity, fee, warn };
    }

    function positions(s, L) {
      const pts = [];
      const n = s.dancers;
      const coupleFront = L.f === 'v' || L.f === 'circle' ? 2 : 0;
      const movers = n - coupleFront;
      if (L.f === 'rows') {
        const rows = Math.max(1, Math.ceil(movers / L.perRow));
        let i = 0;
        for (let r = 0; r < rows; r++) {
          const left = Math.min(L.perRow, movers - i);
          const offset = r % 2 ? 0.5 : 0;
          for (let c = 0; c < left; c++) {
            pts.push({
              u: (c + 0.5 + offset) / L.perRow,
              v: rows === 1 ? 0.5 : r / (rows - 1),
              kind: 'dancer',
            });
            i++;
          }
        }
      } else if (L.f === 'v') {
        const arm = Math.ceil(movers / 2);
        for (let i = 0; i < arm; i++) {
          const t = i / Math.max(1, arm - 1);
          const spread = 0.42 * t;
          const y = 0.88 - 0.66 * t;
          pts.push({ u: 0.5 - spread, v: y, kind: 'dancer' });
          if (pts.filter((p) => p.kind === 'dancer').length < movers) pts.push({ u: 0.5 + spread, v: y, kind: 'dancer' });
        }
      } else if (L.f === 'circle') {
        for (let i = 0; i < movers; i++) {
          const a = -Math.PI / 2 + (i / movers) * Math.PI * 2;
          pts.push({ u: 0.5 + Math.cos(a) * 0.34, v: 0.48 + Math.sin(a) * 0.34, kind: 'dancer' });
        }
      } else {
        for (let i = 0; i < movers; i++) {
          const t = movers === 1 ? 0.5 : i / (movers - 1);
          pts.push({ u: 0.12 + 0.76 * t, v: 0.9 - 0.68 * t, kind: 'dancer' });
        }
      }
      // trim to exact count
      const trimmed = pts.slice(0, movers);
      if (coupleFront) {
        trimmed.push({ u: 0.47, v: L.f === 'circle' ? 0.48 : 0.94, kind: 'couple' });
        trimmed.push({ u: 0.53, v: L.f === 'circle' ? 0.48 : 0.94, kind: 'couple' });
      }
      return trimmed;
    }

    function drawStage(s, L) {
      const W = 560, H = 420;
      const padX = 46, padTop = 44;
      const scale = Math.min((W - padX * 2) / s.width, (H - padTop - 92) / L.depth, 18);
      const sw = s.width * scale;
      const sd = L.depth * scale;
      const x0 = (W - sw) / 2;
      const y0 = padTop;

      const pts = positions(s, L);
      const dot = s.group === 'kids' ? 4.6 : 5.6;
      const marks = pts.map((p) => {
        const cx = x0 + 18 + p.u * (sw - 36);
        const cy = y0 + 16 + p.v * (sd - 32);
        const cls = p.kind === 'couple' ? 'st-dot couple' : s.group === 'kids' ? 'st-dot st-kid' : 'st-dot';
        return `<circle class="${cls}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dot}"/>`;
      }).join('');

      const depthTicks = [];
      for (let f = 0; f <= L.depth; f += 4) {
        const y = y0 + (f / L.depth) * sd;
        depthTicks.push(`<line class="st-wing" x1="${x0 - 8}" y1="${y.toFixed(1)}" x2="${x0}" y2="${y.toFixed(1)}"/>`);
        depthTicks.push(`<text class="st-txt small" x="${(x0 - 12).toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="end">${f}′</text>`);
      }

      stageSvg.innerHTML = `
        <text class="st-txt" x="${x0.toFixed(1)}" y="${(y0 - 22).toFixed(1)}">STAGE ${s.width} FT WIDE · ${L.depth} FT DEEP</text>
        <text class="st-txt small" x="${(x0 + sw).toFixed(1)}" y="${(y0 - 22).toFixed(1)}" text-anchor="end">NUMBER OF DANCERS ${s.dancers}</text>
        <rect class="st-aud" x="${(x0 - 10).toFixed(1)}" y="${y0.toFixed(1)}" width="${(sw + 20).toFixed(1)}" height="${sd.toFixed(1)}"/>
        <rect class="st-floor" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${sw.toFixed(1)}" height="${sd.toFixed(1)}"/>
        <path class="st-wing" d="M${(x0 + 18).toFixed(1)} ${(y0 + 16).toFixed(1)}h${(sw - 36).toFixed(1)}" opacity=".5"/>
        <text class="st-txt small" x="${(x0 + 18).toFixed(1)}" y="${(y0 + 30).toFixed(1)}">BACK</text>
        ${depthTicks.join('')}
        ${marks}
        <line class="st-line" x1="${(x0 + sw / 2).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(x0 + sw / 2).toFixed(1)}" y2="${(y0 + sd).toFixed(1)}"/>
        <!-- audience -->
        <path class="st-aud" d="M${(x0 - 6).toFixed(1)} ${(y0 + sd + 26).toFixed(1)}q${(sw / 2 + 6).toFixed(1)} 22 ${(sw + 12).toFixed(1)} 0l0 34q-${(sw / 2 + 6).toFixed(1)} -18 -${(sw + 12).toFixed(1)} 0z" opacity=".7"/>
        <text class="st-txt" x="${(x0 + sw / 2).toFixed(1)}" y="${(y0 + sd + 52).toFixed(1)}" text-anchor="middle">AUDIENCE</text>
        <text class="st-txt small" x="${(x0 + sw / 2).toFixed(1)}" y="${(y0 - 6).toFixed(1)}" text-anchor="middle">CENTRE LINE</text>
        <text class="st-txt small" x="${x0.toFixed(1)}" y="${(y0 + sd - 8).toFixed(1)}">STAGE LEFT</text>
        <text class="st-txt small" x="${(x0 + sw).toFixed(1)}" y="${(y0 + sd - 8).toFixed(1)}" text-anchor="end">STAGE RIGHT</text>
      `;
    }

    function render() {
      const s = state();
      const L = layout(s, resolveFormation(s));
      $('o-dancers').textContent = s.dancers;
      $('o-weeks').textContent = s.weeks;
      $('o-counts').textContent = L.counts;
      $('o-routine').textContent = `${fmtTime(s.seconds)} · ${L.counts * 8} beats`;
      $('o-form').textContent = FORM_NAMES[L.f];
      $('o-depth').textContent = `${L.depth} ft deep`;
      $('o-reh').textContent = `${L.sessions} sessions`;
      $('o-fee').textContent = `₹${(L.fee * 0.94 / 100000).toFixed(1)}–${(L.fee * 1.12 / 100000).toFixed(1)} L`;
      $('o-stagenote').textContent = `${L.depth} ft deep`;
      const warn = $('o-warn');
      warn.hidden = !L.warn;
      warn.textContent = L.warn || '';

      $('stage-cap').textContent = `${s.dancers} dancers, ${FORM_NAMES[L.f].toLowerCase()}, facing the audience. ${GROUPS[s.group].couple ? 'The couple stands on the centre line.' : 'No couple in this item — the group carries the whole set.'}`;

      const plan = [
        [`Session 1 · counts`, `Walk-on, the hook phrase, ${Math.round(L.counts * 0.3)} counts. No music yet — I count out loud and nobody watches a mirror.`],
        [`Sessions 2–3 · formations`, `${L.changes} clean change${L.changes > 1 ? 's' : ''}, walked to a metronome at ${s.bpm} bpm until everyone stops looking at their neighbour.`],
        [`Sessions 4–5 · music`, `Full track, ${fmtTime(s.seconds)} on the clock, twice through without stopping. Video sent to anyone who missed a rehearsal.`],
        [`Last session · stage`, `On the actual stage if it is free, with the DJ, the lighting cue and the bow marked in the count sheet.`],
      ];
      if (L.sessions <= 3) plan.splice(2, 1);
      $('o-plan').innerHTML = plan.map(([t, d]) => `<li><b>${t}</b>${d}</li>`).join('');
      drawStage(s, L);
    }

    ['group', 'formation', 'dancers', 'weeks', 'length', 'tempo', 'width'].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  }

  /* contact form */
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
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Add the full number with the country code.';
        const slot = slotFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      status.hidden = false;
      status.textContent = 'Got it. Rhea replies within two days with the dates she has open and an honest answer about whether the set fits the time.';
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
