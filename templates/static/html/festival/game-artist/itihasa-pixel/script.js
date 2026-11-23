/* Itihasa Pixel — pixel scene, sprite forge, cartridge filter, party form */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* reveal */
  if (!reduce) {
    $$('.quest-head, .quest-card, .forge-head, .forge-grid, .process-grid li, .section-head, .outro > div, .bio-block, .cart-item, .info-box, .page-top > *')
      .forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    $$('.rv').forEach((el) => io.observe(el));
  }

  /* dialogue typewriter */
  const lineEl = $('#dialogue-line');
  const fullLine = lineEl ? lineEl.textContent : '';
  if (lineEl && !reduce) {
    lineEl.textContent = '';
    let i = 0;
    const tick = () => {
      if (i <= fullLine.length) {
        lineEl.textContent = fullLine.slice(0, i);
        i += 1;
        setTimeout(tick, 18);
      }
    };
    setTimeout(tick, 600);
  }

  /* ---------- title-scene canvas ---------- */
  const scene = $('#scene');
  if (scene) {
    const ctx = scene.getContext('2d');
    const P = {
      sky0: '#0b0e26', sky1: '#141938', sky2: '#1e2448', sky3: '#2b3260',
      moon: '#f4e6c8', moon2: '#d9c9a6',
      hillFar: '#1d2a44', hillNear: '#16203a',
      temple: '#2b2140', templeLit: '#f2a33c',
      ground: '#1b3a2a', ground2: '#2c5540', path: '#5a4632',
      tree: '#122a20', treeLit: '#1e4433',
      hero: '#f2a33c', heroSkin: '#c98a52', heroCloth: '#b5482f',
      fire: '#f2e07a'
    };
    const W = 320, H = 180;
    const stars = Array.from({ length: 46 }, (_, i) => ({
      x: (i * 71 + 13) % W, y: (i * 37 + 7) % 96, on: i % 3 === 0,
    }));
    let scrollX = 0;
    let tick = 0;

    function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const sx = scrollX;
      // sky bands
      rect(0, 0, W, 40, P.sky0);
      rect(0, 40, W, 34, P.sky1);
      rect(0, 74, W, 30, P.sky2);
      // stars
      stars.forEach((s, i) => {
        const wobble = Math.sin((tick + i * 12) / 26) > 0.7 ? 1 : 0;
        if (s.y < 92) rect((s.x - sx * 0.04 + W) % W, s.y, 1 + wobble, 1 + wobble, i % 5 === 0 ? P.moon2 : P.moon);
      });
      // moon
      const mx = 252 - sx * 0.06;
      rect(mx, 22, 22, 22, P.moon);
      rect(mx + 3, 19, 16, 28, P.moon);
      rect(mx + 6, 26, 6, 5, P.moon2);
      rect(mx + 13, 34, 5, 4, P.moon2);
      // far hills
      for (let i = 0; i < 9; i++) {
        const x = i * 44 - (sx * 0.12) % 44 - 20;
        rect(x, 96, 46, 26, P.hillFar);
        rect(x + 8, 90, 26, 10, P.hillFar);
        rect(x + 14, 84, 12, 8, P.hillFar);
      }
      // temple on hill
      const tx = 62 - sx * 0.16;
      rect(tx, 52, 46, 40, P.temple);
      rect(tx - 6, 50, 58, 5, P.temple);
      rect(tx + 2, 42, 42, 8, P.temple);
      rect(tx + 8, 34, 30, 8, P.temple);
      rect(tx + 18, 24, 10, 12, P.temple);
      rect(tx + 21, 18, 4, 8, P.temple);
      rect(tx + 19, 58, 10, 34, P.sky0);
      rect(tx + 34, 60, 3, 4, P.templeLit);
      rect(tx + 6, 62, 3, 4, P.templeLit);
      // near hills / trees
      for (let i = 0; i < 7; i++) {
        const x = i * 56 - (sx * 0.3) % 56 - 30;
        rect(x, 116, 56, 22, P.hillNear);
        rect(x + 10, 108, 4, 20, P.tree);
        rect(x + 4, 104, 16, 6, P.tree);
        rect(x + 7, 100, 10, 5, P.treeLit);
        rect(x + 32, 112, 3, 16, P.tree);
        rect(x + 27, 106, 13, 8, P.tree);
      }
      // ground
      rect(0, 132, W, 48, P.ground);
      rect(0, 132, W, 3, P.ground2);
      for (let i = 0; i < 18; i++) {
        const x = (i * 23 - sx * 0.5) % W;
        rect(x < 0 ? x + W : x, 138 + (i % 4) * 8, 4, 1, P.ground2);
      }
      // path
      rect(0, 156, W, 6, P.path);
      rect(0, 162, W, 2, '#3e3122');
      // hero
      const hx = 150;
      rect(hx, 140, 8, 8, P.heroSkin);
      rect(hx - 1, 138, 10, 3, P.hero);
      rect(hx + 1, 148, 6, 8, P.heroCloth);
      rect(hx + 1, 156, 2, 6, P.heroSkin);
      rect(hx + 5, 156, 2, 6, P.heroSkin);
      rect(hx - 2, 148, 2, 7, P.heroSkin);
      rect(hx + 8, 148, 2, 7, P.heroSkin);
      rect(hx + 9, 138, 1, 18, P.moon);
      // fireflies
      for (let i = 0; i < 7; i++) {
        const fx = (i * 47 + Math.sin((tick + i * 20) / 18) * 8 - sx * 0.4 + W) % W;
        const fy = 120 + Math.cos((tick + i * 20) / 22) * 12;
        rect(fx, fy, 2, 2, P.fire);
      }
      // foreground grass
      for (let i = 0; i < 30; i++) {
        const gx = (i * 13 - sx * 0.7) % W;
        rect(gx < 0 ? gx + W : gx, 172 - (i % 3), 2, 8, P.tree);
      }
    }

    const onScroll = () => { scrollX = window.scrollY * 0.35; draw(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (!reduce) {
      setInterval(() => { tick += 1; draw(); }, 220);
    }
    window.addEventListener('resize', draw);
    draw();
  }

  /* ---------- sprite forge ---------- */
  const palettes = {
    dawn: { outline: '#2b1a12', skin: '#c98a52', cloth: '#f2a33c', cloth2: '#b5482f', metal: '#f4e6c8', accent: '#3e7c4f', name: 'Dawn · 6 colours' },
    dusk: { outline: '#241016', skin: '#a86a44', cloth: '#c96b3b', cloth2: '#5b2f3a', metal: '#e8c9a0', accent: '#7a8c5a', name: 'Dusk · 6 colours' },
    night: { outline: '#070a1c', skin: '#8a9ab8', cloth: '#4a6fa5', cloth2: '#1b2a4a', metal: '#b9c7e6', accent: '#f2a33c', name: 'Night · 6 colours' },
    ash: { outline: '#1a1917', skin: '#a89f8c', cloth: '#8a8578', cloth2: '#3a3730', metal: '#d8d4c8', accent: '#b5482f', name: 'Ash · 6 colours' },
  };
  const heroNames = { vanara: 'Vanara scout', kuru: 'Kuru archer', naga: 'Naga guardian', prince: 'Chariot prince' };
  const state = { hero: 'vanara', palette: 'dawn', weapon: 'bow', stance: 'idle' };

  function drawSprite(ctx, hero, pal, weapon, stance, frame) {
    ctx.clearRect(0, 0, 32, 32);
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const bob = frame === 1 ? 1 : 0;
    const lean = stance === 'attack' ? 1 : 0;

    // shadow
    px(9, 30, 14, 2, 'rgba(0,0,0,.35)');

    // cape / tail behind
    if (hero === 'prince') {
      px(7, 16 + bob, 4, 12, pal.cloth2);
      px(5, 20 + bob, 3, 9, pal.cloth2);
      px(24, 16 + bob, 4, 12, pal.outline);
    }
    if (hero === 'vanara') {
      // tail curling up the left
      px(7, 24, 3, 2, pal.outline);
      px(5, 20, 2, 4, pal.outline);
      px(4, 15, 2, 5, pal.outline);
      px(5, 11, 2, 4, pal.outline);
      px(6, 9, 3, 2, pal.skin);
    }
    if (hero === 'naga') {
      // cobra hood behind head
      px(6, 6 + bob, 20, 12, pal.cloth2);
      px(8, 4 + bob, 16, 4, pal.cloth2);
      px(10, 16 + bob, 12, 4, pal.outline);
    }

    // legs
    if (stance === 'attack') {
      px(11, 26, 4, 6, pal.cloth2);
      px(19, 24, 4, 8, pal.cloth2);
      px(10, 30, 5, 2, pal.outline);
      px(19, 30, 5, 2, pal.outline);
    } else if (frame === 1) {
      px(11, 26, 4, 6, pal.cloth2);
      px(18, 27, 4, 5, pal.cloth2);
      px(10, 30, 5, 2, pal.outline);
      px(18, 30, 5, 2, pal.outline);
    } else {
      px(11, 26, 4, 6, pal.cloth2);
      px(18, 26, 4, 6, pal.cloth2);
      px(10, 30, 5, 2, pal.outline);
      px(17, 30, 5, 2, pal.outline);
    }

    // torso (outlined)
    px(9 + lean, 15 + bob, 14, 13, pal.outline);
    px(10 + lean, 16 + bob, 12, 11, pal.cloth);
    px(10 + lean, 25 + bob, 12, 2, pal.cloth2);
    px(12 + lean, 18 + bob, 8, 2, pal.accent);
    px(12 + lean, 21 + bob, 2, 4, pal.cloth2);

    // arms
    if (stance === 'guard') {
      px(8 + lean, 18 + bob, 3, 7, pal.skin);
      px(21 + lean, 17 + bob, 3, 6, pal.skin);
      px(13 + lean, 20 + bob, 8, 3, pal.metal);
    } else if (stance === 'attack') {
      px(19 + lean, 17 + bob, 6, 3, pal.skin);
      px(8 + lean, 18 + bob, 3, 6, pal.skin);
    } else {
      px(7 + lean, 16 + bob, 5, 10, pal.outline);
      px(8 + lean, 17 + bob, 3, 8, pal.skin);
      px(20 + lean, 16 + bob, 5, 10, pal.outline);
      px(21 + lean, 17 + bob, 3, 8, pal.skin);
    }

    // head (outlined)
    px(10 + lean, 5 + bob, 12, 12, pal.outline);
    px(11 + lean, 7 + bob, 10, 9, pal.skin);
    px(11 + lean, 6 + bob, 10, 2, pal.outline);
    px(12 + lean, 10 + bob, 2, 2, pal.outline);
    px(18 + lean, 10 + bob, 2, 2, pal.outline);
    px(14 + lean, 13 + bob, 4, 1, pal.outline);
    px(12 + lean, 8 + bob, 8, 1, pal.cloth2);

    // headgear per hero
    if (hero === 'kuru') {
      px(10 + lean, 5 + bob, 12, 3, pal.metal);
      px(10 + lean, 7 + bob, 12, 1, pal.outline);
      px(15 + lean, 2 + bob, 2, 3, pal.accent);
    } else if (hero === 'prince') {
      px(10 + lean, 5 + bob, 12, 3, pal.metal);
      px(9 + lean, 6 + bob, 2, 2, pal.metal);
      px(21 + lean, 6 + bob, 2, 2, pal.metal);
      px(15 + lean, 3 + bob, 2, 3, pal.accent);
    } else if (hero === 'naga') {
      px(9 + lean, 6 + bob, 14, 3, pal.accent);
      px(9 + lean, 9 + bob, 2, 3, pal.accent);
      px(21 + lean, 9 + bob, 2, 3, pal.accent);
    } else {
      // vanara ears + brow
      px(8 + lean, 9 + bob, 2, 3, pal.skin);
      px(22 + lean, 9 + bob, 2, 3, pal.skin);
      px(11 + lean, 8 + bob, 10, 1, pal.cloth2);
    }

    // weapon
    if (weapon === 'bow') {
      const bx = stance === 'attack' ? 25 + lean : 24;
      const by = stance === 'attack' ? 10 : 10 + bob;
      px(bx, by, 1, 2, pal.metal);
      px(bx + 1, by + 1, 1, 3, pal.metal);
      px(bx + 2, by + 3, 1, 6, pal.metal);
      px(bx + 1, by + 8, 1, 3, pal.metal);
      px(bx, by + 10, 1, 2, pal.metal);
      px(bx + 1, by + 3, 1, 6, pal.outline);
      px(bx + 2, by + 5, 6, 1, pal.outline);
      px(bx + 7, by + 5, 1, 2, pal.accent);
    } else if (weapon === 'gada') {
      if (stance === 'attack') {
        px(23, 12, 3, 3, pal.accent);
        px(25, 9, 4, 4, pal.metal);
        px(24, 15, 2, 6, pal.outline);
        px(26, 7, 2, 2, pal.outline);
      } else {
        px(22, 16 + bob, 2, 10, pal.outline);
        px(21, 11 + bob, 4, 5, pal.metal);
        px(20, 10 + bob, 2, 2, pal.accent);
      }
    } else if (weapon === 'spear') {
      const up = stance === 'attack' ? 2 : 8;
      px(24, 2, 2, 26, pal.outline);
      px(23, up - 2, 4, 4, pal.metal);
      px(24, up - 5, 2, 3, pal.accent);
    }
  }

  function renderSprite(frame, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawSprite(ctx, state.hero, palettes[state.palette], state.weapon, state.stance, frame);
  }

  const spriteCanvas = $('#sprite');
  const frameCanvases = [$('#frame0'), $('#frame1'), $('#frame2')];
  const forgeForm = $('#forge-form');
  let animTimer = null;
  let animFrame = 0;

  function renderForge() {
    if (!spriteCanvas) return;
    renderSprite(animFrame, spriteCanvas);
    frameCanvases.forEach((c, i) => c && renderSprite(i, c));
    const p = palettes[state.palette];
    $('#sprite-name').textContent = heroNames[state.hero];
    $('#palette-name').textContent = p.name;
    const notes = {
      vanara: 'The vanara\u2019s tail is the read: it breaks the silhouette at the top right so the character is recognisable at 1×.',
      kuru: 'The Kuru archer reads by the helmet crest and the bow line. Both are metal, so the eye finds the weapon before the face.',
      naga: 'The hood is two pixels wider than the shoulders on each side. That is the whole trick of making a snake look heavy.',
      prince: 'The prince is the only hero with a cape, which is why the palette has to keep cloth2 dark. A bright cape eats the legs.',
    };
    $('#forge-note').textContent = notes[state.hero];
    const stanceNote = state.stance === 'attack' ? ' The strike frame is drawn first; the idle is built backwards from it.' : '';
    $('#forge-note').textContent += stanceNote;
  }

  function startAnim() {
    if (animTimer) clearInterval(animTimer);
    if (!spriteCanvas || reduce) { renderForge(); return; }
    animTimer = setInterval(() => {
      if ($('#animate') && $('#animate').checked) {
        animFrame = (animFrame + 1) % 3;
        renderSprite(animFrame, spriteCanvas);
      }
    }, 380);
  }

  if (forgeForm) {
    forgeForm.addEventListener('click', (e) => {
      const pick = e.target.closest('.pick');
      if (!pick) return;
      const attrs = ['data-hero', 'data-palette', 'data-weapon', 'data-stance'];
      const key = attrs.map((a) => pick.getAttribute(a)).find(Boolean);
      if (!key) return;
      const map = { 'data-hero': ['hero'], 'data-palette': ['palette'], 'data-weapon': ['weapon'], 'data-stance': ['stance'] };
      const [prop] = map[attrs.find((a) => pick.hasAttribute(a))];
      state[prop] = pick.getAttribute(attrs.find((a) => pick.hasAttribute(a)));
      $$(`.pick[${attrs.find((a) => pick.hasAttribute(a))}]`, forgeForm).forEach((c) => {
        c.classList.toggle('is-set', c === pick);
        c.setAttribute('aria-pressed', c === pick ? 'true' : 'false');
      });
      animFrame = 0;
      renderForge();
    });
    const anim = $('#animate');
    if (anim) anim.addEventListener('change', () => { animFrame = 0; renderForge(); });
    renderForge();
    startAnim();
  }

  /* cartridge filter */
  const filters = $('.filters');
  if (filters) {
    const items = $$('.cart-item');
    const count = $('.filter-count');
    const empty = $('.empty-note');
    const apply = (key) => {
      let shown = 0;
      items.forEach((it) => {
        const match = key === 'all' || it.dataset.kind === key;
        it.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = `${shown} / ${items.length} cartridges`;
      if (empty) empty.classList.toggle('show', shown === 0);
    };
    filters.addEventListener('click', (e) => {
      const pick = e.target.closest('.pick');
      if (!pick) return;
      $$('.pick', filters).forEach((c) => {
        c.classList.toggle('is-set', c === pick);
        c.setAttribute('aria-pressed', c === pick ? 'true' : 'false');
      });
      apply(pick.dataset.filter);
    });
    apply('all');
  }

  /* party form */
  const form = $('#party-form');
  if (form) {
    const fields = {
      name: { el: $('#i-name'), ok: (v) => v.trim().length >= 2, msg: 'Enter a player name.' },
      email: { el: $('#i-email'), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: 'That address will not receive mail.' },
      project: { el: $('#i-project'), ok: (v) => v !== '', msg: 'Choose a quest type.' },
      deadline: { el: $('#i-deadline'), ok: (v) => v !== '' && !Number.isNaN(Date.parse(v)), msg: 'A date for the cart to ship.' },
      brief: { el: $('#i-brief'), ok: (v) => v.trim().length >= 40, msg: 'Tell me the game, the screen, and the constraint.' },
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
      const agree = $('#i-agree');
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
