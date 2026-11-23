/* Harleen Kaur — phulkari and bagh
   Nav, reveal, the stitch loom, and the commission letter. */

(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

/* ---------- commission form ---------- */
  const form = document.getElementById('commissionForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const occasion = String(data.get('occasion') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || occasion.length < 2 || message.length < 10) {
        status.className = 'form-status err';
        status.textContent = 'Please add your name, a working email, the occasion, and a line about the cloth you have in mind.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${name.split(' ')[0]}. I read commissions on Sunday; if the date is close I will say so honestly.`;
      form.reset();
    });
  }

  /* ---------- the bagh loom ---------- */
  const bagh = document.getElementById('bagh');
  if (!bagh) return;
  const N = 16;
  const cells = [];
  const state = new Array(N * N).fill(null);
  let painting = false;

  const countEl = document.getElementById('stitchCount');
  const coverEl = document.getElementById('coverPct');
  const monthsEl = document.getElementById('monthsOut');

  for (let i = 0; i < N * N; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.i = String(i);
    cell.setAttribute('aria-label', `row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}`);
    cell.setAttribute('aria-pressed', 'false');
    bagh.appendChild(cell);
    cells.push(cell);
  }

  const STAMPS = {
    darn: [[0, 0]],
    chand: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]],
    mor: [[0, 0], [0, -1], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]],
    kikar: [[0, 0], [1, -1], [2, -2], [-1, 1], [-2, 2]]
  };

  function chosen(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function paintAt(index) {
    const color = chosen('thread');
    const motif = chosen('motif');
    if (!color || !motif) return;
    const r = Math.floor(index / N);
    const c = index % N;
    STAMPS[motif].forEach(([dr, dc]) => {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) return;
      const i = rr * N + cc;
      state[i] = { c: color, m: motif };
      const cell = cells[i];
      cell.classList.add('filled');
      cell.dataset.c = color;
      cell.dataset.m = motif;
      cell.setAttribute('aria-pressed', 'true');
    });
    updateStats();
  }

  function clearAt(index) {
    state[index] = null;
    const cell = cells[index];
    cell.classList.remove('filled');
    delete cell.dataset.c;
    delete cell.dataset.m;
    cell.setAttribute('aria-pressed', 'false');
  }

  function updateStats() {
    const filled = state.filter(Boolean).length;
    const stitches = filled * 42 + (filled ? 120 : 0);
    countEl.textContent = stitches.toLocaleString('en-IN');
    coverEl.textContent = `${Math.round((filled / (N * N)) * 100)}%`;
    if (!filled) { monthsEl.textContent = '—'; return; }
    const evenings = Math.max(1, Math.round(stitches / 600));
    monthsEl.textContent = `${evenings} evening${evenings === 1 ? '' : 's'}`;
  }

  bagh.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    painting = true;
    bagh.setPointerCapture?.(e.pointerId);
    if (e.shiftKey) clearAt(Number(cell.dataset.i));
    else paintAt(Number(cell.dataset.i));
    e.preventDefault();
  });

  bagh.addEventListener('pointerover', (e) => {
    if (!painting) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    if (e.shiftKey) clearAt(Number(cell.dataset.i));
    else paintAt(Number(cell.dataset.i));
  });

  window.addEventListener('pointerup', () => { painting = false; });
  bagh.addEventListener('pointercancel', () => { painting = false; });

  cells.forEach((cell) => {
    cell.addEventListener('click', (e) => {
      // keyboard activation (pointer already handled above)
      if (e.detail === 0) paintAt(Number(cell.dataset.i));
    });
  });

  document.getElementById('clearBagh').addEventListener('click', () => {
    for (let i = 0; i < N * N; i++) clearAt(i);
    updateStats();
  });

  document.getElementById('fillBorder').addEventListener('click', () => {
    const color = chosen('thread');
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N);
      const c = i % N;
      if (r === 0 || c === 0 || r === N - 1 || c === N - 1) {
        state[i] = { c: color, m: 'chand' };
        cells[i].classList.add('filled');
        cells[i].dataset.c = color;
        cells[i].dataset.m = 'chand';
        cells[i].setAttribute('aria-pressed', 'true');
      }
    }
    updateStats();
  });

  // a small starting motif so the cloth is not blank
  function seed() {
    const mid = 8;
    for (let r = mid - 3; r <= mid + 2; r++) {
      for (let c = mid - 3; c <= mid + 2; c++) {
        const d = Math.abs(r - mid + 0.5) + Math.abs(c - mid + 0.5);
        if (d < 3.2) {
          const i = r * N + c;
          state[i] = { c: d < 1.6 ? 'magenta' : 'mustard', m: 'chand' };
          cells[i].classList.add('filled');
          cells[i].dataset.c = d < 1.6 ? 'magenta' : 'mustard';
          cells[i].dataset.m = 'chand';
          cells[i].setAttribute('aria-pressed', 'true');
        }
      }
    }
    [[0, 0], [0, 15], [15, 0], [15, 15]].forEach(([r, c]) => {
      const i = r * N + c;
      state[i] = { c: 'emerald', m: 'kikar' };
      cells[i].classList.add('filled');
      cells[i].dataset.c = 'emerald';
      cells[i].dataset.m = 'kikar';
      cells[i].setAttribute('aria-pressed', 'true');
    });
    updateStats();
  }
  seed();

})();
