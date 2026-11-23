/* Titanium Monobloc — tolerance and finish inspector, page chrome. */

(() => {
  'use strict';

  /* nav */
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

  initPages();

  const svg = document.getElementById('caseSvg');
  if (!svg) return;

  const FACES = {
    bezel: {
      name: 'BEZEL', hold: 8, cycle: 14.33, points: 5,
      dot: [240, 133], end: [330, 74], text: [334, 70], anchor: 'start'
    },
    caseband: {
      name: 'CASEBAND', hold: 10, cycle: 22.5, points: 7,
      dot: [358, 210], end: [400, 172], text: [404, 168], anchor: 'start'
    },
    lugs: {
      name: 'LUG', hold: 15, cycle: 9.8, points: 4,
      dot: [346, 252], end: [400, 286], text: [404, 290], anchor: 'start'
    },
    caseback: {
      name: 'CASEBACK', hold: 12, cycle: 6.4, points: 6,
      dot: [240, 289], end: [180, 332], text: [176, 336], anchor: 'end'
    },
    crown: {
      name: 'CROWN BOSS', hold: 20, cycle: 3.2, points: 3,
      dot: [392, 223], end: [428, 258], text: [430, 262], anchor: 'end'
    }
  };

  const FINISHES = {
    brushed: { ra: 'Ra 0.40 µm', tool: 'Ø 50 face mill', cut: '8,200 rpm / 1,400 mm/min', factor: 1 },
    bead: { ra: 'Ra 1.60 µm', tool: 'Ø 20 blast nozzle', cut: '— / 600 mm/min', factor: 0.62 },
    mirror: { ra: 'Ra 0.025 µm', tool: 'Ø 3 chamfer, hand lap', cut: '18,000 rpm / 320 mm/min', factor: 1.75 }
  };

  const state = { face: 'bezel', finish: 'brushed', tol: 10 };

  const $ = (id) => document.getElementById(id);
  const leaderPath = $('leaderPath');
  const leaderDot = $('leaderDot');
  const leaderText = $('leaderText');
  const roHold = $('roHold');
  const roRa = $('roRa');
  const roTool = $('roTool');
  const roCut = $('roCut');
  const roCycle = $('roCycle');
  const roInspect = $('roInspect');
  const tolIn = $('tol');
  const tolOut = $('tolOut');
  const verdict = $('verdict');
  const verdictText = $('verdictText');

  function paint() {
    const f = FACES[state.face];
    const fin = FINISHES[state.finish];

    document.querySelectorAll('.cs-part .face').forEach((el) => {
      el.classList.toggle('is-on', el.dataset.face === state.face);
    });

    leaderDot.setAttribute('cx', f.dot[0]);
    leaderDot.setAttribute('cy', f.dot[1]);
    leaderPath.setAttribute('d', `M${f.dot[0]} ${f.dot[1]} L${f.end[0]} ${f.end[1]}`);
    leaderText.setAttribute('x', f.text[0]);
    leaderText.setAttribute('y', f.text[1]);
    leaderText.setAttribute('text-anchor', f.anchor);
    leaderText.textContent = f.name;

    roHold.textContent = `±0.${String(f.hold).padStart(3, '0')} mm`;
    roRa.textContent = fin.ra;
    roTool.textContent = fin.tool;
    roCut.textContent = fin.cut;
    const minutes = f.cycle * fin.factor;
    const mm = Math.floor(minutes);
    const ss = Math.round((minutes - mm) * 60);
    roCycle.textContent = `${mm} min ${String(ss).padStart(2, '0')} s`;
    roInspect.textContent = `CMM, ${f.points} points`;

    const tol = state.tol;
    tolOut.textContent = `±0.${String(tol).padStart(3, '0')} mm`;

    if (tol < f.hold) {
      verdict.dataset.state = 'out';
      verdictText.textContent = `Out of process. ±0.${String(tol).padStart(3, '0')} mm is tighter than this shop holds on the ${f.name.toLowerCase()} (±0.${String(f.hold).padStart(3, '0')} mm). The quote would need a second operation or be declined.`;
    } else if (tol < f.hold * 1.35) {
      verdict.dataset.state = 'tight';
      verdictText.textContent = `At the limit. Within 35 % of the process capability on this face — first-article plus 100 % inspection, and a longer cycle.`;
    } else {
      verdict.dataset.state = 'ok';
      verdictText.textContent = 'In process. CMM first-article on the first part of the run; sampling after that.';
    }
    return { hold: f.hold, tol, ra: fin.ra, cycle: roCycle.textContent, state: verdict.dataset.state };
  }

  document.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.face = btn.dataset.face;
      document.querySelectorAll('.chip').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });

  document.querySelectorAll('.finish').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.finish = btn.dataset.finish;
      document.querySelectorAll('.finish').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });

  document.querySelectorAll('.cs-part .face').forEach((el) => {
    el.addEventListener('click', () => {
      const chip = document.querySelector(`.chip[data-face="${el.dataset.face}"]`);
      if (chip) chip.click();
    });
  });

  tolIn.addEventListener('input', () => {
    state.tol = Number(tolIn.value);
    paint();
  });

  paint();

  window.__tm = {
    state: () => ({ ...state }),
    setFace: (f) => {
      const chip = document.querySelector(`.chip[data-face="${f}"]`);
      if (chip) chip.click();
    },
    setFinish: (f) => {
      const btn = document.querySelector(`.finish[data-finish="${f}"]`);
      if (btn) btn.click();
    },
    setTol: (v) => {
      tolIn.value = String(v);
      tolIn.dispatchEvent(new Event('input', { bubbles: true }));
    },
    values: () => ({
      hold: roHold.textContent,
      ra: roRa.textContent,
      tool: roTool.textContent,
      cycle: roCycle.textContent,
      state: verdict.dataset.state,
      tol: tolOut.textContent,
      leader: document.getElementById('leaderText').textContent
    })
  };
})();

/* ---------- page-level features ---------- */
function initPages() {
  const filters = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.proj')];
  const countEl = document.getElementById('projCount');
  if (filters.length && cards.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        cards.forEach((c) => {
          const match = kind === 'all' || c.dataset.kind === kind;
          c.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (countEl) countEl.textContent = kind === 'all' ? 'Six projects shown' : `${shown} of 6 projects shown`;
      });
    });
  }

  const form = document.getElementById('rfqForm');
  if (!form) return;
  const result = document.getElementById('rfqResult');
  const preview = document.getElementById('rfqPreview');
  const send = document.getElementById('rfqSend');
  const edit = document.getElementById('rfqEdit');
  const fields = {
    company: document.getElementById('company'),
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    part: document.getElementById('part'),
    message: document.getElementById('message'),
    consent: document.getElementById('consent')
  };
  const rules = {
    company: (v) => v.trim().length > 1,
    name: (v) => v.trim().length > 1,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    part: (v) => v.trim().length > 1,
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
      'RFQ — Titanium Monobloc',
      '',
      `Company: ${fields.company.value.trim()}`,
      `Contact: ${fields.name.value.trim()}`,
      `Email: ${fields.email.value.trim()}`,
      `Part: ${fields.part.value.trim()}`,
      `Material: ${get('material').value}`,
      `Quantity: ${get('quantity').value}`,
      `Tolerance class: ${get('tolerance').value}`,
      `Finish: ${get('finish').value}`,
      `Deadline: ${get('deadline').value.trim() || 'none'}`,
      '',
      fields.message.value.trim(),
      '',
      'Drawing to follow by email (STEP + PDF).'
    ].join('\n');
    preview.textContent = brief;
    send.href = `mailto:rfq@titaniummonobloc.co.uk?subject=${encodeURIComponent('RFQ — ' + fields.company.value.trim())}&body=${encodeURIComponent(brief)}`;
    result.hidden = false;
    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  edit.addEventListener('click', () => {
    result.hidden = true;
    fields.company.focus();
  });
}
