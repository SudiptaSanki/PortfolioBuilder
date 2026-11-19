/* =========================================================
   main.js — loader, kinetic gallery, case study, cursor
   ========================================================= */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = (n) => String(n).padStart(2, '0');

  window.__mouseX = window.innerWidth / 2;
  window.__mouseY = window.innerHeight / 2;

  /* ---------------------------------------------------------
     Project data (6 studies)
     --------------------------------------------------------- */
  const PROJECTS = [
    {
      slug: 'chroma-field',
      title: 'Chroma Field',
      year: '2025',
      client: 'Chroma Labs',
      role: 'Creative development · Shaders',
      tags: ['GLSL', 'WebGL', 'Generative'],
      img: './assets/photos/img_a83a8bd57fbe.webp',
      text: 'A generative colour instrument: a GPU noise field sampled through four octaves of curl, painted into a feedback buffer so every gesture leaves a light trail. The palette is driven by a live audio input, the camera by the pointer. One fragment shader, no post-processing stack, 60fps on integrated graphics.',
      credit: 'Direction & code: Kinetic Shader Studio\nSound design: Chroma Labs\nBuilt in Three.js · 4,100 lines of GLSL later'
    },
    {
      slug: 'aether-drift',
      title: 'Aether Drift',
      year: '2025',
      client: 'Aether Foundation',
      role: 'WebGL direction · Motion',
      tags: ['Three.js', 'GLSL', 'Particles'],
      img: './assets/photos/img_d120267933ba.webp',
      text: 'An interactive night sky built from 240,000 instanced particles, each carrying a depth value and a decay rate. Scroll drives the camera through layers of dust; the shader shifts their colour by velocity so the sky red-shifts as it moves. The whole scene runs on a single draw call.',
      credit: 'Concept: Aether Foundation\nCode & shaders: Kinetic Shader Studio\nShader length: 210 lines'
    },
    {
      slug: 'liquid-archive',
      title: 'Liquid Archive',
      year: '2024',
      client: 'Arkiv',
      role: 'Creative development · Simulation',
      tags: ['WebGL', 'FBO', 'Simulation'],
      img: './assets/photos/img_074fa5117945.webp',
      text: 'A digital archive for a fluid photographer, where the interface itself behaves like ink. Four framebuffer objects run a stable-fluids simulation at half resolution; the type is composited into the dye field so titles bleed into the imagery and back out as you scroll.',
      credit: 'Client: Arkiv\nInteraction & shaders: Kinetic Shader Studio\nAwarded FWA Site of the Day'
    },
    {
      slug: 'nocturne-studio',
      title: 'Nocturne Studio',
      year: '2024',
      client: 'Nocturne',
      role: 'Identity · Motion system',
      tags: ['GSAP', 'Canvas', 'Identity'],
      img: './assets/photos/img_d379bfcba9f8.webp',
      text: 'A motion identity for a late-night sound studio: a single silk gradient that stretches under every layout. The system ships as a 12kb library — three scroll behaviours, a pointer warp and a type animator — dropped into their site, decks and product UI.',
      credit: 'Identity: Nocturne Studio\nMotion library: Kinetic Shader Studio\nRuntime: 12kb, zero dependencies'
    },
    {
      slug: 'substrata',
      title: 'Substrata',
      year: '2023',
      client: 'Substrata Capital',
      role: 'Spatial web · Direction',
      tags: ['Three.js', 'Shaders', 'Spatial'],
      img: './assets/photos/img_d7d671e672a2.webp',
      text: 'A spatial web experience for an architecture fund: the portfolio is a city you scroll through, not a grid you scan. Buildings are extruded from the firm’s own project data; a raymarched fog shader hides the draw distance and gives the skyline its grain.',
      credit: 'Client: Substrata Capital\nConcept & build: Kinetic Shader Studio\nGeometry generated from project data'
    },
    {
      slug: 'kinetic-type',
      title: 'Kinetic Type Engine',
      year: '2023',
      client: 'Foundry Ø',
      role: 'Tooling · Shaders · Type',
      tags: ['GSAP', 'WebGL', 'Typography'],
      img: './assets/photos/img_298e090bd0f1.webp',
      text: 'A typesetting engine for a foundry that wanted its specimens to move. Glyphs are rendered to an atlas, then swept by a shader that can bend, slice and dissolve them along a timeline — every animation exports as a CSS-free, 60fps web loop or a 4K render.',
      credit: 'Client: Foundry Ø\nEngine & shaders: Kinetic Shader Studio\nUsed on 14 specimen pages'
    }
  ];

  const TOTAL = PROJECTS.length;

  /* ---------------------------------------------------------
     Build the gallery
     --------------------------------------------------------- */
  const track = $('#track');
  track.innerHTML = PROJECTS.map((p, i) => `
    <article class="panel" data-i="${i}">
      <div class="panel__media" role="button" tabindex="0" aria-label="Open ${p.title} case study" data-cursor="view"></div>
      <div class="panel__caption">
        <div class="panel__left">
          <span class="panel__idx">${pad2(i + 1)}</span>
          <h3 class="panel__title">${p.title}</h3>
        </div>
        <div class="panel__right">
          <span class="panel__tags">${p.tags.join(' / ')}</span>
          <span class="panel__year">${p.year}</span>
        </div>
      </div>
    </article>
  `).join('');

  const panels = $$('.panel');

  /* ---------------------------------------------------------
     Split helpers
     --------------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.innerHTML = text.split('').map((ch) => {
      const c = ch === ' ' ? '&nbsp;' : ch;
      return `<span class="ch"><b>${c}</b></span>`;
    }).join('');
    return $$('.ch b', el);
  }

  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join('');
    return $$('.w > span', el);
  }

  const heroChars = [];
  $$('.hero__line').forEach((el) => { heroChars.push.apply(heroChars, splitChars(el)); });
  const introChars = [];
  $$('.intro__title > span').forEach((el) => { introChars.push.apply(introChars, splitChars(el)); });
  const mailLine = $('.contact__mailtext');
  const statementWords = splitWords($('#statement'));

  gsap.set(heroChars, { yPercent: 118 });
  gsap.set(introChars, { yPercent: 118 });
  gsap.set(mailLine, { yPercent: 112 });
  gsap.set(statementWords, { opacity: 0.12 });

  /* ---------------------------------------------------------
     WebGL layer
     --------------------------------------------------------- */
  const canvas = $('#gl');
  let layer = null;
  let webglOk = true;
  try {
    layer = new JL.ShaderLayer(canvas);
  } catch (err) {
    webglOk = false;
    canvas.style.display = 'none';
    console.warn('WebGL unavailable, falling back to CSS images', err);
  }

  const heroMedia = $('#heroMedia');
  const mediaEls = $$('.panel__media');

  function cssFallback() {
    heroMedia.style.backgroundImage = `url("${PROJECTS[0].img}")`;
    heroMedia.style.backgroundSize = 'cover';
    heroMedia.style.backgroundPosition = 'center';
    mediaEls.forEach((el, i) => {
      el.style.backgroundImage = `url("${PROJECTS[i].img}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    });
  }

  const heroItem = webglOk
    ? layer.add(heroMedia, null, { full: true, fade: true, exposure: 1.16, vig: 0.3 })
    : null;
  const panelItems = webglOk
    ? mediaEls.map((el) => layer.add(el, null, { fade: false }))
    : [];

  /* ---------------------------------------------------------
     Loader
     --------------------------------------------------------- */
  const loader = $('#loader');
  const loadNum = $('#loadNum');
  const loadBar = $('#loadBar');
  let started = false;

  const sources = [PROJECTS[0].img].concat(PROJECTS.map((p) => p.img)); // hero uses its own
  const HERO_PHOTO = './assets/photos/img_d088224ddc74.webp';

  let done = 0;
  const all = TOTAL + 2; // hero photo + 6 projects + marker

  function progress(p) {
    const pct = clamp(p, 0, 1);
    loadNum.textContent = pad2(Math.round(pct * 100));
    loadBar.style.width = (pct * 100) + '%';
  }

  function tick() {
    done += 1;
    progress(done / all);
  }

  if (!webglOk) {
    cssFallback();
  }

  const jobs = [];

  if (webglOk) {
    jobs.push(
      JL.loadTexture(HERO_PHOTO, layer.renderer).then((tex) => {
        if (heroItem) {
          heroItem.texture = tex;
          heroItem.uniforms.uTex.value = tex;
          heroItem.imageAspect = tex.image.width / tex.image.height;
        }
        tick();
      })
    );

    PROJECTS.forEach((p, i) => {
      jobs.push(
        JL.loadTexture(p.img, layer.renderer).then((tex) => {
          const item = panelItems[i];
          item.texture = tex;
          item.uniforms.uTex.value = tex;
          item.imageAspect = tex.image.width / tex.image.height;
          tick();
        })
      );
    });
  } else {
    jobs.push(new Promise((r) => setTimeout(r, 400)).then(tick));
  }

  // fallback so a slow/broken CDN can never trap the visitor
  const watchdog = setTimeout(() => { if (!started) start(); }, 9000);

  Promise.all(jobs.map((j) => j.catch(() => tick())))
    .then(() => document.fonts ? document.fonts.ready : Promise.resolve())
    .then(() => setTimeout(start, 420));

  /* ---------------------------------------------------------
     Intro animation
     --------------------------------------------------------- */
  function start() {
    if (started) return;
    started = true;
    clearTimeout(watchdog);
    progress(1);

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.loader__count', { yPercent: -110, opacity: 0, duration: 0.8, ease: 'expo.inOut' }, 0.05)
      .to('.loader__row, .loader__bar', { opacity: 0, duration: 0.5 }, 0.1)
      .to(loader, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 0.35)
      .set(loader, { display: 'none' })
      .to(heroChars, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.045 }, 0.7)
      .from('.hero__eyebrow > span', { yPercent: 120, opacity: 0, duration: 1, stagger: 0.07 }, 0.7)
      .from('.hero__lede, .hero__coords > span', { y: 24, opacity: 0, duration: 1.1, stagger: 0.05 }, 0.95)
      .from('.hero__scroll', { opacity: 0, duration: 1 }, 1.1)
      .from('.nav', { y: -20, opacity: 0, duration: 1.2 }, 0.8);

    if (heroItem) gsap.to(heroItem, { hover: 0.55, duration: 2.4, ease: 'power2.out' });

    initScroll();
  }

  /* ---------------------------------------------------------
     Scroll systems
     --------------------------------------------------------- */
  let activeIndex = 0;

  function initScroll() {
    // hero parallax + fade
    gsap.to('.hero__title', {
      yPercent: -18,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__inner', {
      y: -60,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__media', {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // intro title + copy
    gsap.to(introChars, {
      yPercent: 0,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.018,
      scrollTrigger: { trigger: '.intro__title', start: 'top 84%' }
    });
    gsap.from('.intro__copy', {
      y: 30, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.intro__copy', start: 'top 92%' }
    });
    gsap.from('.intro__row', {
      opacity: 0, y: 16, duration: 0.9,
      scrollTrigger: { trigger: '.intro__row', start: 'top 92%' }
    });

    // statement words fill in
    gsap.to(statementWords, {
      opacity: 1,
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: { trigger: '#statement', start: 'top 78%', end: 'bottom 58%', scrub: true }
    });

    gsap.from('.about__col', {
      y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.about__grid', start: 'top 85%' }
    });
    gsap.from('.xp__row', {
      y: 28, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.xp', start: 'top 80%' }
    });
    gsap.from('.awards__col', {
      y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.awards', start: 'top 88%' }
    });

    // contact
    gsap.to(mailLine, {
      yPercent: 0,
      duration: 1.5,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 72%' }
    });
    gsap.from('.contact__grid > *', {
      y: 26, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact__grid', start: 'top 92%' }
    });

    // ------- horizontal gallery -------
    const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tl = gsap.to(track, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.work',
        start: 'top top',
        end: () => '+=' + getDistance(),
        pin: true,
        scrub: 0.9,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          $('#progressBar').style.width = (self.progress * 100).toFixed(2) + '%';
        }
      }
    });

    // marquee
    const mq = $('#marquee');
    const mqTween = gsap.to(mq, { xPercent: -50, repeat: -1, duration: 26, ease: 'none' });
    gsap.ticker.add(() => {
      const boost = clamp(1 + Math.abs(velocity) * 5, 0.45, 5);
      mqTween.timeScale(boost);
      gsap.set(mq, { skewX: clamp(velocity * 7, -8, 8) });
    });

    // hero scroll hint fade
    gsap.to('.hero__scroll', {
      opacity: 0, duration: 0.4,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true }
    });

    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------------------
     Render loop
     --------------------------------------------------------- */
  let lastY = window.scrollY;
  let velocity = 0;
  let lastT = performance.now();

  function loop(now) {
    const dt = Math.min(64, now - lastT) / 1000;
    lastT = now;

    const y = window.scrollY;
    const raw = y - lastY;
    lastY = y;
    const target = clamp(raw * 0.02, -1, 1);
    velocity += (target - velocity) * 0.11;
    if (Math.abs(velocity) < 0.0004) velocity = 0;

    if (layer) {
      layer.time += dt;
      layer.setVelocity(velocity);
      layer.render();
    }

    // active project = whichever plane is nearest the viewport centre
    let best = activeIndex;
    let bestD = Infinity;
    for (let i = 0; i < panels.length; i++) {
      const r = mediaEls[i].getBoundingClientRect();
      if (r.width === 0) continue;
      const d = Math.abs(r.left + r.width / 2 - window.innerWidth / 2);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best !== activeIndex) {
      activeIndex = best;
      updateHud(best);
    }

    requestAnimationFrame(loop);
  }

  function updateHud(i) {
    $('#idxCur').textContent = pad2(i + 1);
    gsap.fromTo('#idxCur',
      { yPercent: 70, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
  }

  requestAnimationFrame(loop);

  /* ---------------------------------------------------------
     Hover → shader distortion
     --------------------------------------------------------- */
  mediaEls.forEach((el, i) => {
    const item = panelItems[i];
    if (!item) return;
    el.addEventListener('mouseenter', () => {
      gsap.to(item, { hover: 1, duration: 0.7, ease: 'power2.out', overwrite: true });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(item, { hover: 0, duration: 0.9, ease: 'power2.out', overwrite: true });
    });
  });

  /* ---------------------------------------------------------
     Cursor
     --------------------------------------------------------- */
  const cursor = $('#cursor');
  const cursorLabel = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.42, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.42, ease: 'power3' });

  window.addEventListener('mousemove', (e) => {
    window.__mouseX = e.clientX;
    window.__mouseY = e.clientY;

    const hit = e.target.closest ? e.target.closest('[data-cursor]') : null;

    // magnetic pull: the ring leans toward the centre of the element under it
    let tx = e.clientX;
    let ty = e.clientY;
    if (hit) {
      const r = hit.getBoundingClientRect();
      const pull = r.width > 420 ? 0.025 : 0.16;
      tx += (r.left + r.width / 2 - e.clientX) * pull;
      ty += (r.top + r.height / 2 - e.clientY) * pull;
    }
    xTo(tx);
    yTo(ty);
    let kind = '';
    if (hit) kind = hit.getAttribute('data-cursor') || 'link';
    if (hit && hit.id === 'mailLink') kind = 'mail';

    const cls = kind === 'view' ? 'is-view' : kind === 'mail' ? 'is-mail' : kind ? 'is-link' : '';
    if (!cursor.classList.contains(cls)) {
      cursor.classList.remove('is-view', 'is-link', 'is-mail');
      if (cls) cursor.classList.add(cls);
      cursorLabel.textContent = kind === 'view' ? 'VIEW' : kind === 'mail' ? 'MAIL' : '';
    }
  }, { passive: true });

  window.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  window.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

  /* ---------------------------------------------------------
     Case study
     --------------------------------------------------------- */
  const caseEl = $('#case');
  const caseScroll = $('#caseScroll');
  let currentCase = -1;
  let caseAnimating = false;

  const caseBits = () => $$('.case__head, .case__hero, .case__body, .case__next', caseEl);

  function fillCase(i) {
    const p = PROJECTS[i];
    $('#caseIndex').textContent = pad2(i + 1);
    $('#caseTitle').textContent = p.title;
    $('#caseTags').innerHTML = p.tags.map((t) => `<span>${t}</span>`).join('');
    $('#caseText').textContent = p.text;
    $('#caseClient').textContent = p.client;
    $('#caseYear').textContent = p.year;
    $('#caseRole').textContent = p.role;
    $('#caseCredit').textContent = p.credit;
    $('#caseCount').textContent = pad2(i + 1) + ' / ' + pad2(TOTAL);
    $('#caseNextTitle').textContent = PROJECTS[(i + 1) % TOTAL].title;
    const img = $('#caseImg');
    img.alt = p.title + ' — case study';
    img.src = p.img.replace('w=1600', 'w=1800');
  }

  function openCase(i) {
    if (caseAnimating) return;
    caseAnimating = true;
    currentCase = i;
    fillCase(i);
    caseScroll.scrollTop = 0;
    document.documentElement.classList.add('is-locked');
    document.body.classList.add('is-locked');

    gsap.killTweensOf(caseEl);
    gsap.set(caseEl, { display: 'block' });
    caseEl.setAttribute('aria-hidden', 'false');
    cursor.classList.remove('is-view', 'is-link', 'is-mail');
    cursorLabel.textContent = '';

    gsap.fromTo(caseEl,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.1,
        ease: 'expo.inOut',
        onComplete: () => { caseAnimating = false; }
      });

    gsap.fromTo(caseBits(),
      { y: 70, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.15, ease: 'power3.out', stagger: 0.07, delay: 0.35, clearProps: 'transform' });

    gsap.fromTo($('#caseImg'),
      { scale: 1.25 },
      { scale: 1, duration: 1.6, ease: 'expo.out', delay: 0.3 });
  }

  function closeCase() {
    if (caseAnimating || currentCase < 0) return;
    caseAnimating = true;
    gsap.to(caseEl, {
      clipPath: 'inset(0% 0% 0% 100%)',
      duration: 0.85,
      ease: 'expo.inOut',
      onComplete: () => {
        gsap.set(caseEl, { display: 'none' });
        caseEl.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-locked');
        document.body.classList.remove('is-locked');
        currentCase = -1;
        caseAnimating = false;
      }
    });
  }

  mediaEls.forEach((el, i) => {
    el.addEventListener('click', () => openCase(i));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(i); }
    });
  });

  $('#caseClose').addEventListener('click', closeCase);
  $('#caseNext').addEventListener('click', () => {
    if (caseAnimating) return;
    const next = (currentCase + 1) % TOTAL;
    // quick internal swap
    gsap.to(caseBits(), {
      y: -40, opacity: 0, duration: 0.35, stagger: 0.03, ease: 'power2.in',
      onComplete: () => {
        currentCase = next;
        fillCase(next);
        caseScroll.scrollTop = 0;
        gsap.fromTo(caseBits(),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' });
        gsap.fromTo($('#caseImg'), { scale: 1.18 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCase();
  });

  /* ---------------------------------------------------------
     Clock, anchors, utilities
     --------------------------------------------------------- */
  function clocks() {
    let t = '';
    try {
      t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) {
      t = new Date().toTimeString().slice(0, 5);
    }
    const c1 = $('#clock');
    const c2 = $('#clock2');
    if (c1) c1.textContent = 'STK ' + t;
    if (c2) c2.textContent = 'STOCKHOLM ' + t;
  }
  clocks();
  setInterval(clocks, 15000);

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.addEventListener('resize', () => {
    if (layer) layer.resize();
    ScrollTrigger.refresh();
  });
})();
