/* ═══════════════════════════════════════════════════════════════
   Architectural Parallax Studio — interaction layer
   GSAP + ScrollTrigger · preloader · hero slider · horizontal
   parallax strip · project spotlight viewer · mega menu
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger) {
    document.body.classList.remove('is-loading');
    const pre = $('#preloader');
    if (pre) pre.style.display = 'none';
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ─────────────────────── PROJECT DATA ─────────────────────── */
  const PROJECTS = [
    {
      title: 'MODERN TUDOR',
      tags: 'RESIDENTIAL · NEW CONSTRUCTION',
      desc: 'Just outside New York City, this home reimagines Tudor style for modern family living. A painted brick façade, warm wood, and intimate scale blend with the neighborhood, while soft curves, rich textures, and custom details create a cozy retreat that feels both elegant and inviting.',
      img: 'assets/img/spotlight-4.jpg'
    },
    {
      title: 'THE GLENMERE MANSION',
      tags: 'COMMERCIAL · HISTORIC RENOVATION',
      desc: 'Our firm restored the iconic Glenmere Mansion, a 1911 Tuscan-style estate overlooking Glenmere Lake, transforming it into a celebrated Relais & Châteaux boutique hotel. Preserving its historic plasterwork, colonnades, and grandeur while introducing modern amenities, we honored its Gilded Age legacy and prepared it for a new era of discerning guests.',
      img: 'assets/img/spotlight-1.jpg'
    },
    {
      title: 'AMERICAN FARMHOUSE',
      tags: 'RESIDENTIAL · HISTORIC RENOVATION',
      desc: "This renovation preserved the farmhouse's 19th-century character while adding modern comfort. Original pine floors and rustic details remain, complemented by a new porch and pool that connect the home to its surrounding landscape.",
      img: 'assets/img/spotlight-2.jpg'
    },
    {
      title: 'OLD STONE HOUSE',
      tags: 'COMMERCIAL · ADAPTIVE REUSE',
      desc: 'A 1790s stone dwelling reimagined as a working studio and gallery. Original masonry and hand-hewn beams were left exposed, while quiet modern insertions bring daylight and warmth into rooms that have held three centuries of weather.',
      img: 'assets/img/project-2.jpg'
    },
    {
      title: 'POOL HOUSE',
      tags: 'RESIDENTIAL · NEW CONSTRUCTION',
      desc: 'At the edge of a meadow, a low pavilion of glass and cedar frames the water and the treeline beyond. Its roof plane floats above a limestone terrace, keeping the horizon uninterrupted from the pool.',
      img: 'assets/img/spotlight-3.jpg'
    }
  ];

  /* ─────────────────────── PRELOADER ─────────────────────── */
  const preloader = $('#preloader');
  const preCount = $('#preCount');
  const progress = { v: 0 };
  let preDone = false;

  if (preloader) {
    gsap.to('.pre__circle', {
      rotation: 360,
      duration: 30,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%'
    });
  }

  function endPreloader() {
    if (preDone) return;
    preDone = true;
    document.body.classList.remove('is-loading');
    preloader.style.display = 'none';
    heroIntro();
    ScrollTrigger.refresh();
  }

  function runPreloader() {
    if (REDUCE || !preloader) { endPreloader(); return; }
    const tl = gsap.timeline();
    tl.to(progress, {
      v: 100,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate() { if (preCount) preCount.textContent = Math.round(progress.v) + '%'; }
    })
      .to('.pre__ring', { scale: 1.06, opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '+=0.15')
      .to('.pre__foot', { opacity: 0, duration: 0.5 }, '<')
      .call(() => document.body.classList.remove('is-loading'), null, '<0.1')
      .to(preloader, {
        yPercent: -100,
        duration: 1.15,
        ease: 'expo.inOut',
        onComplete: endPreloader
      }, '-=0.35');
    /* safety net: never trap the page behind the curtain */
    setTimeout(() => { if (!preDone) { gsap.killTweensOf(preloader); endPreloader(); } }, 6500);
  }

  /* ─────────────────────── HERO SLIDER ─────────────────────── */
  const slides = $$('.hero__slide');
  const heroIndexEl = $('#heroIndex');
  const heroCapEl = $('#heroCaption');
  const heroBarEl = $('#heroBar');
  let hIdx = 0;
  let barTween = null;
  let heroStarted = false;

  function ken(img) {
    if (!img) return;
    gsap.killTweensOf(img);
    gsap.fromTo(img, { scale: 1.13 }, { scale: 1.02, duration: 9, ease: 'none' });
  }

  function restartBar() {
    if (!heroBarEl) return;
    if (barTween) barTween.kill();
    if (REDUCE) return;
    barTween = gsap.fromTo(heroBarEl, { scaleX: 0 }, {
      scaleX: 1, duration: 6.5, ease: 'none',
      onComplete() { goHero(hIdx + 1, 1); }
    });
  }

  function goHero(next, dir) {
    if (!slides.length) return;
    const i = ((next % slides.length) + slides.length) % slides.length;
    if (i === hIdx) return;
    const cur = slides[hIdx];
    const nxt = slides[i];

    gsap.set(cur, { zIndex: 3 });
    gsap.set(nxt, { zIndex: 2 });
    gsap.to(nxt, { opacity: 1, duration: 1.15, ease: 'power2.inOut' });
    gsap.to(cur, {
      opacity: 0, duration: 1.15, ease: 'power2.inOut',
      onComplete() { gsap.set(cur, { zIndex: 1 }); cur.classList.remove('is-active'); }
    });
    nxt.classList.add('is-active');
    ken(nxt.querySelector('img'));

    hIdx = i;
    if (heroIndexEl) heroIndexEl.textContent = String(i + 1).padStart(2, '0');
    if (heroCapEl) {
      gsap.fromTo(heroCapEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: 'power2.out' });
      setTimeout(() => { heroCapEl.textContent = nxt.dataset.caption || ''; }, 160);
    }
    if (heroStarted) restartBar();
  }

  $('#heroNext') && $('#heroNext').addEventListener('click', () => goHero(hIdx + 1, 1));
  $('#heroPrev') && $('#heroPrev').addEventListener('click', () => goHero(hIdx - 1, -1));

  function heroIntro() {
    if (heroStarted) return;
    heroStarted = true;
    slides.forEach((s, i) => gsap.set(s, { opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 2 : 1 }));
    ken(slides[0] && slides[0].querySelector('img'));

    if (REDUCE) { restartBar(); return; }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.nav__brand', { y: -18, opacity: 0, duration: 1 }, 0.1)
      .from('.nav__links a', { y: -14, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.15)
      .from('.nav__toggle', { y: -14, opacity: 0, duration: 0.8 }, 0.2)
      .from('.hero__title .line__in', { yPercent: 118, duration: 1.25, stagger: 0.11, ease: 'expo.out' }, 0.15)
      .from('.hero__eyebrow', { y: 18, opacity: 0, duration: 0.9 }, 0.45)
      .from('.hero__sub', { y: 18, opacity: 0, duration: 0.9 }, 0.6)
      .from('.hero__actions .btn', { y: 18, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.7)
      .from('.hero__bar > *', { y: 16, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.75)
      .from('.hero__progress', { opacity: 0, duration: 0.6 }, 0.8);

    tl.add(restartBar, 0.8);
  }

  /* hero parallax on scroll */
  if (!REDUCE) {
    gsap.to('.hero__slides', {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__content', {
      yPercent: -12, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__bar', {
      opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ─────────────────────── NAV STATE ─────────────────────── */
  const nav = $('#nav');
  function syncNav() {
    if (!nav) return;
    const past = window.scrollY > window.innerHeight * 0.72;
    nav.classList.toggle('is-scrolled', past);
  }
  window.addEventListener('scroll', syncNav, { passive: true });
  window.addEventListener('resize', syncNav);
  syncNav();

  /* ─────────────────────── MEGA MENU ─────────────────────── */
  const menu = $('#menu');
  const menuToggle = $('#menuToggle');
  let menuOpen = false;

  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open', 'is-locked');
    gsap.fromTo(menu,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' });
    gsap.fromTo('.menu__word',
      { yPercent: 108, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1, stagger: 0.07, delay: 0.2, ease: 'expo.out' });
    gsap.fromTo('.menu__right img',
      { scale: 1.14, opacity: 0 },
      { scale: 1.02, opacity: 1, duration: 1.3, delay: 0.25, ease: 'power3.out' });
    gsap.fromTo('.menu__foot, .menu__social',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.45, stagger: 0.06, ease: 'power2.out' });
  }

  function closeMenu() {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open', 'is-locked');
    gsap.to(menu, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 0.7,
      ease: 'expo.inOut',
      onComplete() {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  menuToggle && menuToggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  $$('.menu__item').forEach((a) => a.addEventListener('click', closeMenu));

  /* ─────────────────────── TEXT SPLITTING ─────────────────────── */
  function splitWords(el) {
    if (!el) return;
    const words = (el.textContent || '').trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('[data-split-words]').forEach(splitWords);

  if (!REDUCE) {
    gsap.set('.statement__text .w > span', { yPercent: 120, opacity: 0 });
    gsap.set('.statement__mark', { opacity: 0, y: 24 });
    whenVisible('.statement', () => {
      gsap.to('.statement__text .w > span', {
        yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.018, ease: 'power3.out'
      });
      gsap.to('.statement__mark', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
    });
  }

  /* ─────────────────────── GENERIC REVEALS ─────────────────────── */
  /* IntersectionObserver driven so nothing stays hidden when the page
     is jumped, deep-linked or refreshed mid-scroll */
  function whenVisible(container, run, threshold, observeEl) {
    const el = typeof container === 'string' ? $(container) : container;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { run(); return; }
    /* a clip-path-hidden element reports zero intersection area, so
       clipped targets are watched through their unclipped parent */
    const watch = observeEl || el;
    if (watch.getBoundingClientRect().top < window.innerHeight * 0.96) { run(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } });
    }, { threshold: threshold == null ? 0.05 : threshold });
    io.observe(watch);
  }

  function revealGroup(container, itemSel, opts) {
    if (REDUCE) return;
    const o = opts || {};
    const items = $$(itemSel);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: o.y == null ? 24 : o.y });
    whenVisible(container, () => {
      gsap.to(items, {
        opacity: 1, y: 0,
        duration: o.duration || 1,
        stagger: o.stagger == null ? 0.09 : o.stagger,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  }

  revealGroup('.press', '.press__label, .press__item', { y: 16, stagger: 0.07 });
  revealGroup('.spot', '.spot__text > *', { y: 22, stagger: 0.08 });
  revealGroup('.strip', '.strip__head > *', { y: 20, stagger: 0.1 });
  revealGroup('.about', '.about__copy > *', { y: 22, stagger: 0.08 });
  revealGroup('.works', '.works__head > *', { y: 20, stagger: 0.09 });
  revealGroup('.works__grid', '.works__card', { y: 30, stagger: 0.12 });
  revealGroup('.talk', '.talk__title', { y: 20, stagger: 0.08 });
  revealGroup('.footer', '.footer__grid > *, .footer__bottom', { y: 20, stagger: 0.07 });

  /* clip-path image reveals */
  if (!REDUCE) {
    $$('.works__frame').forEach((frame) => {
      gsap.set(frame, { clipPath: 'inset(0% 0% 100% 0%)' });
      whenVisible(frame, () => {
        gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'expo.out' });
      }, 0.02, frame.parentElement);
    });
    const aboutFrame = $('.about__frame');
    if (aboutFrame) {
      gsap.set(aboutFrame, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set('.about__img', { scale: 1.12 });
      whenVisible(aboutFrame, () => {
        gsap.to(aboutFrame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' });
        gsap.to('.about__img', { scale: 1, duration: 1.8, ease: 'expo.out' });
      }, 0.02, aboutFrame.parentElement);
    }
    gsap.set('.about__img', { yPercent: -5 });
    gsap.to('.about__img', {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: '.about__frame', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.spot__imgs', {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: '.spot__frame', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ─────────────────────── FEATURED PROJECT SPOTLIGHT ─────────────────────── */
  const spotImgs = $$('.spot__img');
  const spotIndexEl = $('#spotIndex');
  const spotCountEl = $('#spotCount');
  const spotTitleEl = $('#spotTitle');
  const spotTagsEl = $('#spotTags');
  const spotDescEl = $('#spotDesc');
  let spIdx = 0;
  let spotTimer = null;

  function applySpot(i) {
    const p = PROJECTS[i];
    if (!p) return;
    spotImgs.forEach((f, k) => f.classList.toggle('is-active', k === i));
    if (spotIndexEl) spotIndexEl.textContent = String(i + 1).padStart(2, '0');
    if (spotCountEl) spotCountEl.textContent = String(i + 1);
    const tl = gsap.timeline();
    tl.to('#spotTitle, #spotTags, #spotDesc', {
      opacity: 0, y: -12, duration: 0.32, stagger: 0.04, ease: 'power2.in'
    }).add(() => {
      if (spotTitleEl) spotTitleEl.textContent = p.title;
      if (spotTagsEl) spotTagsEl.textContent = p.tags;
      if (spotDescEl) spotDescEl.textContent = p.desc;
    }).to('#spotTitle, #spotTags, #spotDesc', {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out'
    });
  }

  function setSpot(i) {
    spIdx = ((i % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
    applySpot(spIdx);
  }

  function startSpotTimer() {
    stopSpotTimer();
    if (REDUCE) return;
    spotTimer = setInterval(() => setSpot(spIdx + 1), 8000);
  }
  function stopSpotTimer() { if (spotTimer) { clearInterval(spotTimer); spotTimer = null; } }

  $('#spotNext') && $('#spotNext').addEventListener('click', () => { setSpot(spIdx + 1); startSpotTimer(); });
  $('#spotPrev') && $('#spotPrev').addEventListener('click', () => { setSpot(spIdx - 1); startSpotTimer(); });

  const spotSection = $('.spot');
  if (spotSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? startSpotTimer() : stopSpotTimer()));
    }, { threshold: 0.25 });
    io.observe(spotSection);
  } else {
    startSpotTimer();
  }

  /* ─────────────────────── HORIZONTAL PARALLAX STRIP ─────────────────────── */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    const track = $('#stripTrack');
    const section = $('.strip');
    const bar = $('#stripBar');
    if (!track || !section) return;

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const scrollTween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    if (bar) {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true
        }
      });
    }

    /* opposing vertical parallax inside each frame */
    if (!REDUCE) {
      $$('.strip__card').forEach((card, i) => {
        const img = card.querySelector('img');
        if (!img) return;
        const dir = i % 2 === 1 ? 1 : -1;
        gsap.fromTo(img,
          { yPercent: -6 - dir * 5 },
          {
            yPercent: -6 + dir * 5,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => '+=' + distance(),
              scrub: 1
            }
          });
      });
    }

    return () => { if (scrollTween) scrollTween.scrollTrigger && scrollTween.scrollTrigger.kill(); };
  });

  /* card click → project viewer */
  $$('.strip__card').forEach((card) => {
    card.addEventListener('click', () => openViewer(Number(card.dataset.project || 1) - 1));
  });

  /* ─────────────────────── PROJECT VIEWER ─────────────────────── */
  const viewer = $('#viewer');
  const viewerImg = $('#viewerImg');
  const viewerTitle = $('#viewerTitle');
  const viewerTags = $('#viewerTags');
  const viewerDesc = $('#viewerDesc');
  const viewerIndex = $('#viewerIndex');
  let vIdx = 0;
  let viewerOpen = false;

  function paintViewer(i) {
    const p = PROJECTS[i];
    if (!p) return;
    vIdx = i;
    if (viewerImg) { viewerImg.src = p.img; viewerImg.alt = p.title; }
    if (viewerTitle) viewerTitle.textContent = p.title;
    if (viewerTags) viewerTags.textContent = p.tags;
    if (viewerDesc) viewerDesc.textContent = p.desc;
    if (viewerIndex) viewerIndex.textContent = String(i + 1).padStart(2, '0');
  }

  function openViewer(i) {
    if (!viewer) return;
    paintViewer(((i % PROJECTS.length) + PROJECTS.length) % PROJECTS.length);
    viewerOpen = true;
    viewer.setAttribute('aria-hidden', 'false');
    viewer.style.visibility = 'visible';
    document.body.classList.add('is-locked');
    gsap.killTweensOf([viewer, '.viewer__media img', '.viewer__info > *']);
    gsap.to(viewer, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    gsap.fromTo('.viewer__media', { clipPath: 'inset(12% 12% 12% 12%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out' });
    gsap.fromTo('.viewer__info > *', { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, delay: 0.1, ease: 'power3.out' });
    gsap.fromTo('.viewer__media img', { scale: 1.08 }, { scale: 1, duration: 1.2, ease: 'power2.out' });
  }

  function closeViewer() {
    if (!viewer || !viewerOpen) return;
    viewerOpen = false;
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    gsap.to(viewer, {
      opacity: 0, duration: 0.4, ease: 'power2.inOut',
      onComplete() { viewer.style.visibility = 'hidden'; }
    });
  }

  $('#viewerClose') && $('#viewerClose').addEventListener('click', closeViewer);
  $$('#viewerPrev').forEach((b) => b.addEventListener('click', () => {
    paintViewer((vIdx - 1 + PROJECTS.length) % PROJECTS.length);
    gsap.fromTo('.viewer__media img', { opacity: 0.2, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' });
  }));
  $$('#viewerNext').forEach((b) => b.addEventListener('click', () => {
    paintViewer((vIdx + 1) % PROJECTS.length);
    gsap.fromTo('.viewer__media img', { opacity: 0.2, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' });
  }));
  viewer && viewer.addEventListener('click', (e) => {
    if (e.target === viewer) closeViewer();
  });

  /* ─────────────────────── CONTACT MODAL ─────────────────────── */
  const modal = $('#contactModal');
  const contactForm = $('#contactForm');
  const contactNote = $('#contactNote');
  let modalOpen = false;

  function openContact() {
    if (!modal) return;
    closeMenu();
    closeViewer();
    modalOpen = true;
    modal.setAttribute('aria-hidden', 'false');
    modal.style.visibility = 'visible';
    document.body.classList.add('is-locked');
    gsap.to(modal, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo('.modal__panel', { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
  }

  function closeContact() {
    if (!modal || !modalOpen) return;
    modalOpen = false;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    gsap.to(modal, {
      opacity: 0, duration: 0.35, ease: 'power2.inOut',
      onComplete() { modal.style.visibility = 'hidden'; }
    });
  }

  $$('[data-open-contact]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    openContact();
  }));
  $('#contactClose') && $('#contactClose').addEventListener('click', closeContact);
  modal && modal.addEventListener('click', (e) => { if (e.target === modal) closeContact(); });

  contactForm && contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const body = [
      message || 'Hello, I would like to talk about a project.',
      '',
      '—',
      name,
      email
    ].join('\n');
    const href = 'mailto:hello@example.com'
      + '?subject=' + encodeURIComponent('New project inquiry — ' + (name || 'website'))
      + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    if (contactNote) contactNote.textContent = 'Email draft prepared — check your mail app.';
  });

  /* ─────────────────────── KEYBOARD & ANCHORS ─────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOpen) closeContact();
      else if (viewerOpen) closeViewer();
      else if (menuOpen) closeMenu();
    }
    if (viewerOpen) {
      if (e.key === 'ArrowRight') { paintViewer((vIdx + 1) % PROJECTS.length); }
      if (e.key === 'ArrowLeft') { paintViewer((vIdx - 1 + PROJECTS.length) % PROJECTS.length); }
    }
  });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const y = target.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
    });
  });

  /* ─────────────────────── START ─────────────────────── */
  function boot() {
    gsap.set(slides.length ? slides : [], { opacity: 0 });
    if (slides.length) gsap.set(slides[0], { opacity: 1, zIndex: 2 });
    runPreloader();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
