/* Jadi Booti — kadha composer, formulary filter, consultation form */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!reduce) {
    $$('.hero-copy, .specimen-board, .section-head, .herb, .kadha-head, .kadha-body, .method-head, .rules li, .outro > div, .prose > *, .story-photo, .rx, .side-block, .form-paper')
      .forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    $$('.rv').forEach((el) => io.observe(el));
  }

  /* ---------- data ---------- */
  const herbs = {
    tulsi: {
      label: 'Tulsi', qty: '5 leaves', warm: 1, leaf: true,
      taste: 'green, clove-like',
      caution: 'Tulsi may lower blood sugar — adjust if you take diabetes medication.',
    },
    adrak: {
      label: 'Adrak, grated', qty: '1 tsp', warm: 2, root: true,
      taste: 'hot and sharp',
      caution: 'Ginger thins the blood in large doses. Stop a week before surgery and go easy with warfarin.',
    },
    sonf: {
      label: 'Sonf, crushed', qty: '½ tsp', warm: 1, seed: true,
      taste: 'sweet aniseed',
      caution: 'Fennel in medicinal doses is best avoided in pregnancy.',
    },
    dalchini: {
      label: 'Dalchini quill', qty: '1 small quill', warm: 2, root: true,
      taste: 'woody, sweet bark',
      caution: 'Use Ceylon cinnamon, not cassia — cassia is high in coumarin, which is hard on the liver in daily doses.',
    },
    mulethi: {
      label: 'Mulethi stick', qty: '1 stick, 5 cm', warm: 0, root: true,
      taste: 'sweet, faintly bitter',
      caution: 'Licorice raises blood pressure and holds water. No daily use with hypertension, kidney disease or pregnancy.',
    },
    pudina: {
      label: 'Pudina leaves', qty: '6 leaves', warm: -1, leaf: true,
      taste: 'cool and clean',
      caution: 'Peppermint can worsen reflux for some people.',
    },
    brahmi: {
      label: 'Brahmi, dried', qty: '½ tsp', warm: -2, leaf: true,
      taste: 'bitter and grassy',
      caution: 'Brahmi can upset the stomach and does not mix well with sedatives. Not in pregnancy.',
    },
    ashwagandha: {
      label: 'Ashwagandha root powder', qty: '½ tsp', warm: 1, root: true,
      taste: 'earthy, horsey',
      caution: 'Ashwagandha is not for pregnancy and can interact with thyroid medicine and sedatives.',
    },
  };

  const needs = {
    sleep: { title: 'Night kadha', herbs: ['ashwagandha', 'brahmi', 'sonf'], base: 'milk', line: 'Warm and grounding — a night-time cup, not a morning one.', method: 'Drink it an hour before bed, with the lights already low.' },
    digest: { title: 'Digestive kadha', herbs: ['adrak', 'sonf', 'pudina'], base: 'water', line: 'Warm and lifting — after a meal, never on an empty stomach.', method: 'Sip it slowly after eating, not with the meal.' },
    cough: { title: 'Throat kadha', herbs: ['tulsi', 'adrak', 'mulethi'], base: 'honey', line: 'Warm, sweet and coating — for a throat that has been used too much.', method: 'Take it warm in small sips through the day; do not gulp.' },
    focus: { title: 'Morning kadha', herbs: ['brahmi', 'tulsi', 'dalchini'], base: 'water', line: 'Cooling and clear, with a little heat to wake the mouth.', method: 'Drink it before the first task of the day, not instead of breakfast.' },
    cycle: { title: 'Warmth kadha', herbs: ['adrak', 'dalchini', 'tulsi'], base: 'water', line: 'Warming — for the first two days, when the body wants heat.', method: 'Take it hot, in a cup, with a hot-water bottle and no heroics.' },
  };

  const state = { need: 'sleep', picked: [...needs.sleep.herbs], base: needs.sleep.base };
  let cardCount = 0;

  function qtyFor(key, base) {
    const h = herbs[key];
    if (base === 'milk' && key === 'ashwagandha') return '½ tsp, stirred in at the end';
    return h.qty;
  }

  function renderKadha() {
    const need = needs[state.need];
    const picked = state.picked.slice(0, 3);
    const n = picked.length;
    cardCount += 1;
    $('#card-no').textContent = `KD-${String(cardCount).padStart(3, '0')}`;
    $('#recipe-title').textContent = need.title;
    const baseName = state.base === 'water' ? 'water base' : state.base === 'milk' ? 'milk base' : 'water + honey';
    $('#recipe-sub').textContent = `For ${state.need === 'cycle' ? 'the first days of the cycle' : state.need} · ${baseName} · ${n} ${n === 1 ? 'herb' : 'herbs'}`;

    const liquid = state.base === 'milk' ? '250 ml milk and 100 ml water' : '300 ml water';
    const rows = picked.map((k) => `<li><span>${herbs[k].label}</span><span>${qtyFor(k, state.base)}</span></li>`);
    rows.push(`<li><span>${state.base === 'milk' ? 'Milk + water' : 'Water'}</span><span>${liquid}</span></li>`);
    if (state.base === 'honey') rows.push('<li><span>Honey</span><span>1 tsp, off the heat</span></li>');
    $('#ingredients').innerHTML = rows.join('');

    const hasRoot = picked.some((k) => herbs[k].root);
    const hasLeaf = picked.some((k) => herbs[k].leaf);
    const simmer = 4 + (hasRoot ? 2 : 0) + (hasLeaf ? 0 : 1);
    const steps = [];
    if (state.base === 'milk') {
      steps.push('Warm the milk and water together; do not let it boil over.');
      steps.push(`Add the herbs, cover, and keep it at a low simmer for ${simmer} minutes.`);
      steps.push('Strain into a cup and drink it warm. ' + need.method);
    } else {
      steps.push('Bring the water to a boil, then take it off the heat for a minute.');
      steps.push(`Add the herbs, cover, and simmer gently for ${simmer} minutes.`);
      steps.push(state.base === 'honey'
        ? 'Strain into a cup. Let it cool to drinking temperature, then stir in the honey — never boil honey.'
        : 'Strain into a cup and drink it warm. ' + need.method);
    }
    $('#method').innerHTML = steps.map((s) => `<li>${s}</li>`).join('');

    const tastes = picked.map((k) => herbs[k].taste);
    const tasteLine = tastes.length > 1
      ? `${tastes.slice(0, -1).join(', ')} and ${tastes[tastes.length - 1]}, finishing warm.`
      : `${tastes[0]}, and not much else.`;
    $('#recipe-taste').textContent = tasteLine.charAt(0).toUpperCase() + tasteLine.slice(1) + (state.base === 'honey' ? ' The honey rounds the edges.' : '');

    const cautions = [...new Set(picked.map((k) => herbs[k].caution))];
    if (state.base === 'honey') cautions.push('Never give honey to a child under one year.');
    $('#recipe-caution').textContent = cautions.slice(0, 3).join(' ');

    const warm = picked.reduce((sum, k) => sum + herbs[k].warm, 0) / Math.max(picked.length, 1);
    const width = Math.max(12, Math.min(88, 50 + warm * 16));
    $('#warm-bar').style.width = `${width}%`;
    const note = width > 58 ? 'Warm and grounding — a night-time cup, not a morning one.' : width < 42 ? 'Cooling and light — better before a task than before sleep.' : 'Balanced — neither heating nor cooling in any strong way.';
    $('#balance-note').textContent = note;

    $('#herb-help').textContent = `${picked.length} selected${picked.length === 3 ? '. Tap a fourth and the oldest choice makes way.' : ', room for ' + (3 - picked.length) + ' more.'}`;
  }

  function syncChips() {
    $$('.chip[data-herb]').forEach((c) => {
      const on = state.picked.includes(c.dataset.herb);
      c.classList.toggle('is-set', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('.chip[data-base]').forEach((c) => {
      const on = c.dataset.base === state.base;
      c.classList.toggle('is-set', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('.chip[data-need]').forEach((c) => {
      const on = c.dataset.need === state.need;
      c.classList.toggle('is-set', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  const kadhaForm = $('#kadha-form');
  if (kadhaForm) {
    kadhaForm.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      if (chip.dataset.need) {
        state.need = chip.dataset.need;
        state.picked = [...needs[state.need].herbs];
        state.base = needs[state.need].base;
        syncChips();
        renderKadha();
        return;
      }
      if (chip.dataset.herb) {
        const key = chip.dataset.herb;
        if (state.picked.includes(key)) {
          state.picked = state.picked.filter((k) => k !== key);
        } else {
          state.picked = [...state.picked, key].slice(-3);
        }
        syncChips();
        renderKadha();
        return;
      }
      if (chip.dataset.base) {
        state.base = chip.dataset.base;
        syncChips();
        renderKadha();
      }
    });
    syncChips();
    renderKadha();
  }

  /* ---------- formulary filter ---------- */
  const filters = $('.filters');
  if (filters) {
    const items = $$('.rx');
    const count = $('.filter-count');
    const empty = $('.empty-note');
    const apply = (key) => {
      let shown = 0;
      items.forEach((it) => {
        const match = key === 'all' || it.dataset.kind === key;
        it.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = `${shown} of ${items.length} preparations`;
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

  /* ---------- consultation form ---------- */
  const form = $('#consult-form');
  if (form) {
    const fields = {
      name: { el: $('#j-name'), ok: (v) => v.trim().length >= 2, msg: 'A name for the register.' },
      email: { el: $('#j-email'), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: 'An address that accepts mail.' },
      type: { el: $('#j-type'), ok: (v) => v !== '', msg: 'Choose a consultation or a workshop.' },
      date: { el: $('#j-date'), ok: (v) => v !== '' && !Number.isNaN(Date.parse(v)), msg: 'A date that suits you.' },
      note: { el: $('#j-note'), ok: (v) => v.trim().length >= 30, msg: 'A few lines about what you need — at least thirty characters.' },
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
      const agree = $('#j-agree');
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
