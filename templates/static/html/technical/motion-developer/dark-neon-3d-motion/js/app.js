/* ==========================================================================
   KINETIC MOTION — interface behaviour
   Loader · cursor · kinetic type · marquees · work index · case studies
   ========================================================================== */
(function () {
  'use strict';

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = window.matchMedia('(hover:none)').matches;

  document.body.classList.add('is-loading');

  const LOW_POWER = !!(window.MM_STAGE && window.MM_STAGE.quality === 'low');
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  // on software renderers keep animation time accurate instead of letting GSAP stall
  if (window.gsap && LOW_POWER) gsap.ticker.lagSmoothing(0);

  /* ── work data ────────────────────────────────────────────────────────── */
  const IMG = function (id) {
    return './assets/photos/img_' + id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase() + '.webp';
  };

  const WORKS = {
    halo: {
      n: '01', title: 'HALO®', cat: 'WEBGL IDENTITY',
      sub: 'A living brand system for a lighting company — one shader, endless surfaces.',
      year: '2025', role: 'Creative direction · Design · WebGL', stack: 'Three.js · GLSL · GSAP',
      client: 'HALO® Lighting',
      cover: IMG('photo-1550859492-d5da9d8e45f3'),
      cover2: IMG('photo-1545431613-51ec097943c6'),
      cap: 'Fig. 02 — the shader broken into its spectrum: the material study behind the identity.',
      p1: 'HALO needed a brand that could move the way their light does. We built a single iridescent shader — thin-film interference over a brushed metal base — and let it become the logo, the product shot, the loading screen and the checkout header.',
      p2: 'Everything is one material rendered at different scales. Scroll drives the film thickness, the cursor drives the angle of incidence, and the palette shifts between warm retail and cold after-hours. No video, no sprite sheets: 38kb of GLSL holding a steady frame rate on a four-year-old phone.',
      small: 'Deliverables — Art direction / Design system / WebGL engine / Site build / Handover docs'
    },
    nocturne: {
      n: '02', title: 'NOCTURNE', cat: 'AUDIO EXPERIENCE',
      sub: 'An album you can see — FFT-driven geometry for a late-night electronic record.',
      year: '2025', role: 'Design · WebGL · Sound interaction', stack: 'Three.js · Web Audio · GSAP',
      client: 'NOCTURNE / independent release',
      cover: IMG('photo-1620121692029-d088224ddc74'),
      cover2: IMG('photo-1634017839464-5c339ebe3cb4'),
      cap: 'Fig. 02 — low-frequency displacement, captured at 04:12 of the record.',
      p1: 'Every track on NOCTURNE got its own body. A Web Audio analyser splits the signal into low, mid and high bands, and each band drives a different part of the deformation: the bass swells the surface, the mids tighten the rim, the highs spray particles into the dark.',
      p2: 'The site behaves like an instrument rather than a player. Drag to tilt the field, click to drop a needle, scroll to move through the tracklist while the current shape keeps breathing underneath. Audio never autoplays — the whole experience works silently, with the geometry reading a composed envelope instead.',
      small: 'Deliverables — Concept / Visual system / WebGL build / Audio pipeline / Launch assets'
    },
    prism: {
      n: '03', title: 'PRISM/01', cat: 'GENERATIVE STUDY',
      sub: 'Twelve thousand instanced facets, one rule, no two frames the same.',
      year: '2024', role: 'Concept · Shaders · Motion', stack: 'GLSL · Instancing · GSAP',
      client: 'Self-initiated study',
      cover: IMG('photo-1524169358666-79f22534bc6e'),
      cover2: IMG('photo-1618005182384-a83a8bd57fbe'),
      cap: 'Fig. 02 — colour field study: the same noise driving a second surface.',
      p1: 'PRISM started as a question: how little geometry do you need before a surface feels alive? The answer was a single instanced tetrahedron, repeated twelve thousand times and rotated by a noise field in the vertex shader.',
      p2: 'The palette is generated, not designed — the base hue is sampled from the time of day the page is opened, and the acid highlight is fixed so the piece always has one signature colour. It runs at 60fps on integrated graphics because nothing is computed twice: no post-processing, no shadow maps, no textures.',
      small: 'Deliverables — Research / Shader study / Real-time prototype / Print series'
    },
    eclipse: {
      n: '04', title: 'ECLIPSE', cat: 'IMMERSIVE LAUNCH',
      sub: 'A wearable launched with a scroll-driven eclipse — ninety seconds, one continuous shot.',
      year: '2024', role: 'Art direction · WebGL · Scroll design', stack: 'Scroll cinema · Shaders · GSAP',
      client: 'ECLIPSE Wearables',
      cover: IMG('photo-1503706502779-cfd17a034472'),
      cover2: IMG('photo-1534796636912-3b95b3ab5986'),
      cap: 'Fig. 02 — totality at 68% scroll; the product reveal happens in the corona.',
      p1: 'The launch page is one unbroken camera move: a black disc slides over a burning rim while the product orbits through the corona. There is no cut, no scene swap — only scroll position, mapped to one timeline that drives the camera, the light and the typography at once.',
      p2: 'We built a lightweight instrument to author it: scrub the page, key the light, watch the type reflow in real time. The shipped page weighs less than the press kit, loads in under a second, and degrades to a still image and a transcript when WebGL is unavailable.',
      small: 'Deliverables — Concept / Storyboard / WebGL build / Type system / Press microsite'
    },
    neon: {
      n: '05', title: 'NEON DISTRICT', cat: 'COMMERCE / MOTION',
      sub: 'A streetwear flagship rebuilt around motion: kinetic product walls, 0.9s loads.',
      year: '2023', role: 'Design · Front-end · Motion system', stack: 'Headless commerce · GSAP',
      client: 'NEON DISTRICT',
      cover: IMG('photo-1519608487953-e999c86e7455'),
      cover2: IMG('photo-1617293109458-f51db3f9e033'),
      cap: 'Fig. 02 — product-wall detail; textures hold at 2× on retina panels.',
      p1: 'NEON DISTRICT had a look but no rhythm. We rebuilt the storefront as a moving product wall: collections drift horizontally, hover pulls a garment into focus, and quick-add slides a drawer without ever leaving the wall.',
      p2: 'The motion system is a shared contract between design and engineering — twelve named easings, one duration scale, and a rule that nothing animates longer than the user waits for it. Cart conversion rose 23% in the first quarter after launch.',
      small: 'Deliverables — Art direction / UX / Design system / Front-end build / Motion guidelines'
    },
    orbit: {
      n: '06', title: 'ORBIT', cat: 'PRODUCT / DATA',
      sub: 'Satellite operations in one room: live telemetry, orbital tracks, 40 years of launches.',
      year: '2022', role: 'Product design · Data viz · WebGL', stack: 'R3F · D3 · Data viz',
      client: 'ORBIT Systems',
      cover: IMG('photo-1451187580459-43490279c0fa'),
      cover2: IMG('photo-1502134249126-9f3755a50d78'),
      cap: 'Fig. 02 — ground track and live telemetry, mapped on a shaded globe.',
      p1: 'Operators were reading satellite health from four dashboards and a spreadsheet. ORBIT puts the constellation on one globe: orbit tracks, live telemetry, ground stations and anomalies, all in the same spatial language.',
      p2: 'The interface stays legible at 3am: one accent colour for anything that needs attention, motion only when state changes, and a hard performance budget so the globe never drops below 30fps on the ops-room machines.',
      small: 'Deliverables — Product strategy / UI / 3D globe / Data pipeline / Design system'
    }
  };

  const ORDER = ['halo', 'nocturne', 'prism', 'eclipse', 'neon', 'orbit'];

  /* ── preloader ────────────────────────────────────────────────────────── */
  const loader = $('#loader');
  const pctEl = $('#loader-pct');
  const barEl = $('#loader-bar');
  const statusEl = $('#loader-status');

  const assets = [];
  ORDER.forEach(function (id) {
    assets.push(WORKS[id].cover, WORKS[id].cover2);
  });

  let pending = assets.length + 1; // + fonts
  const total = pending;
  let target = 0;
  let shown = 0;
  let finished = false;
  let loaderDone = false;
  const startAt = performance.now();

  function stepAsset() {
    pending = Math.max(0, pending - 1);
    target = ((total - pending) / total) * 100;
  }

  assets.forEach(function (url) {
    const im = new Image();
    im.onload = stepAsset;
    im.onerror = stepAsset;
    im.src = url;
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(stepAsset).catch(stepAsset);
  } else {
    stepAsset();
  }

  // never hold the door longer than 7s
  window.setTimeout(function () { pending = 0; target = 100; }, 7000);

  function statusFor(v) {
    if (v < 18) return 'BOOTING WEBGL';
    if (v < 40) return 'LOADING GEOMETRY';
    if (v < 62) return 'COMPILING SHADERS';
    if (v < 84) return 'BUILDING THE INDEX';
    if (v < 99) return 'POLISHING THE TYPE';
    return 'READY';
  }

  let lastLoop = performance.now();

  function loaderLoop() {
    if (loaderDone) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastLoop) / 1000) || 0.016;
    lastLoop = now;
    shown += (target - shown) * Math.min(1, dt * 5.5);
    if (target >= 100 && shown > 99.2) shown = 100;

    pctEl.textContent = String(Math.round(shown)).padStart(2, '0');
    barEl.style.transform = 'scaleX(' + (shown / 100).toFixed(4) + ')';
    statusEl.textContent = statusFor(shown);

    const elapsed = performance.now() - startAt;
    if (!finished && target >= 100 && elapsed > 1500) {
      finished = true;
      window.setTimeout(finishLoader, 420);
    }
    if (shown < 100) {
      requestAnimationFrame(loaderLoop);
    } else {
      window.setTimeout(function () { if (!loaderDone) finishLoader(); }, 200);
    }
  }

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    document.body.classList.remove('is-loading');
    loader.classList.add('is-done');

    if (REDUCED) {
      loader.style.display = 'none';
      heroIntro(true);
      return;
    }

    const tl = gsap.timeline();
    tl.to('.loader__counter', { yPercent: -14, opacity: 0, duration: 0.6, ease: 'power2.in' })
      .to('.loader__row, .loader__track', { opacity: 0, duration: 0.4 }, 0)
      .to(loader, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1.05,
        ease: 'expo.inOut'
      }, 0.35)
      .add(function () { loader.style.display = 'none'; }, '+=0.05')
      .add(function () { heroIntro(false); }, '-=0.75');
  }

  requestAnimationFrame(loaderLoop);

  /* ── split type ───────────────────────────────────────────────────────── */
  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    text.split('').forEach(function (ch) {
      const s = document.createElement('span');
      s.className = 'char';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(s);
    });
    el.appendChild(frag);
    return $$('.char', el);
  }

  const heroChars = [];
  $$('.hero__title [data-split]').forEach(function (el) {
    heroChars.push.apply(heroChars, splitChars(el));
  });

  gsap.set(heroChars, { yPercent: 118, rotation: 4, opacity: 0 });
  gsap.set('.hero__kicker .mono, .hero__lede, .hero__facts, .hero__cue, .hero__side', { opacity: 0 });
  gsap.set('.hdr', { y: -20, opacity: 0 });

  function settleTitle(sel) {
    const el = document.querySelector(sel);
    if (el) el.classList.add('is-settled');
  }

  function heroIntro(instant) {
    if (instant || REDUCED) {
      gsap.set(heroChars, { yPercent: 0, rotation: 0, opacity: 1 });
      gsap.set('.hero__kicker .mono, .hero__lede, .hero__facts, .hero__cue, .hero__side, .hdr', { opacity: 1, y: 0 });
      settleTitle('.hero__title');
      settleTitle('.contact__title');
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroChars, {
      yPercent: 0, rotation: 0, opacity: 1,
      duration: 1.45, stagger: { each: 0.032, from: 'start' }
    }, 0)
      .to('.hdr', { y: 0, opacity: 1, duration: 0.9 }, 0.15)
      .to('.hero__kicker .mono', { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.25)
      .to('.hero__lede, .hero__facts', { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.55)
      .to('.hero__cue, .hero__side', { opacity: 1, duration: 0.8 }, 1.0)
      .add(function () { settleTitle('.hero__title'); }, 1.9);
  }

  /* ── cursor ───────────────────────────────────────────────────────────── */
  const cursor = $('#cursor');
  const cursorLabel = $('#cursor-label');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my, ringX = mx, ringY = my;
  let cursorActive = false;

  if (!TOUCH) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      document.body.classList.add('has-cursor');
      mx = e.clientX; my = e.clientY;

      const hit = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
      const label = hit ? hit.getAttribute('data-cursor') : '';
      if (label) {
        if (!cursorActive || cursorLabel.textContent !== label) {
          cursorLabel.textContent = label;
          cursor.classList.add('is-active');
          cursorActive = true;
        }
      } else if (cursorActive) {
        cursor.classList.remove('is-active');
        cursorActive = false;
      }
    }, { passive: true });

    window.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = ''; });
  }

  /* ── marquees ─────────────────────────────────────────────────────────── */
  const marquees = [];

  function Marquee(track) {
    this.track = track;
    this.speed = parseFloat(track.getAttribute('data-speed') || '1');
    this.x = 0;
    this.setW = 0;
    this.hovered = false;
    this.pause = 1;

    const self = this;
    const host = track.closest('.stack__row, .ticker');
    if (host) {
      host.addEventListener('mouseenter', function () { self.hovered = true; });
      host.addEventListener('mouseleave', function () { self.hovered = false; });
    }
    this.measure();
  }

  Marquee.prototype.measure = function () {
    const sets = $$('.ticker__set, .stack__set', this.track);
    if (!sets.length) return;

    // make sure the track is wide enough to loop seamlessly
    let w = sets[0].getBoundingClientRect().width;
    if (!w) return;
    const needed = Math.ceil((window.innerWidth * 1.25) / w) + 1;
    while ($$('.ticker__set, .stack__set', this.track).length < needed) {
      const clone = sets[0].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('button, a', clone).forEach(function (b) { b.setAttribute('tabindex', '-1'); });
      this.track.appendChild(clone);
    }
    this.setW = w;
    this.x = this.speed < 0 ? 0 : -w;
    this.apply();
  };

  Marquee.prototype.apply = function () {
    this.track.style.transform = 'translate3d(' + this.x.toFixed(2) + 'px,0,0)';
  };

  Marquee.prototype.update = function (dt, boost) {
    if (!this.setW) return;
    const targetPause = this.hovered ? 0.06 : 1;
    this.pause += (targetPause - this.pause) * Math.min(1, dt * 5);

    const pxPerSec = (46 + Math.min(420, Math.abs(boost)) * 0.42) * this.pause;
    this.x -= this.speed * pxPerSec * dt;

    if (this.x <= -this.setW) this.x += this.setW;
    else if (this.x >= 0 && this.speed < 0) this.x -= this.setW;
    else if (this.x >= 0) this.x -= this.setW;

    this.apply();
  };

  $$('[data-marquee]').forEach(function (track) {
    marquees.push(new Marquee(track));
  });

  /* ── main loop (cursor, marquees, scroll velocity, rail) ──────────────── */
  let lastScroll = window.scrollY || 0;
  let velocity = 0;
  let lastT = performance.now();
  const maxScroll = function () {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  };

  const railNum = $('#rail-num');
  const railLabel = $('#rail-label');
  const railFill = $('#rail-fill');
  const sectionMarks = [
    { el: $('#hero'), n: '01', label: 'INTRO' },
    { el: $('#about'), n: '02', label: 'ABOUT' },
    { el: $('#work'), n: '03', label: 'WORK' },
    { el: $('#stack'), n: '04', label: 'STACK' },
    { el: $('#contact'), n: '05', label: 'CONTACT' }
  ];
  let currentSection = '';

  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;

    // cursor
    if (!TOUCH) {
      cx += (mx - cx) * Math.min(1, dt * 18);
      cy += (my - cy) * Math.min(1, dt * 18);
      ringX += (mx - ringX) * Math.min(1, dt * 7);
      ringY += (my - ringY) * Math.min(1, dt * 7);
      cursor.style.transform = 'translate3d(' + ringX.toFixed(2) + 'px,' + ringY.toFixed(2) + 'px,0)';
      const dot = cursor.firstElementChild;
      if (dot) dot.style.transform = 'translate(' + (cx - ringX).toFixed(2) + 'px,' + (cy - ringY).toFixed(2) + 'px) translate(-50%,-50%)';
    }

    // scroll velocity
    const sy = window.scrollY || 0;
    const delta = sy - lastScroll;
    lastScroll = sy;
    velocity += (delta - velocity) * Math.min(1, dt * 10);

    if (!REDUCED) {
      for (let i = 0; i < marquees.length; i++) marquees[i].update(dt, velocity);
    }

    // rail
    if (railFill) {
      const p = clamp(sy / maxScroll(), 0, 1);
      railFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      let active = sectionMarks[0];
      for (let i = 0; i < sectionMarks.length; i++) {
        const s = sectionMarks[i];
        if (!s.el) continue;
        if (s.el.getBoundingClientRect().top <= window.innerHeight * 0.45) active = s;
      }
      if (active.label !== currentSection) {
        currentSection = active.label;
        railNum.textContent = active.n;
        railLabel.textContent = active.label;
      }
    }
  }
  requestAnimationFrame(tick);

  /* ── header ───────────────────────────────────────────────────────────── */
  const hdr = $('#hdr');
  let lastY = window.scrollY, hdrTicking = false;
  window.addEventListener('scroll', function () {
    if (hdrTicking) return;
    hdrTicking = true;
    requestAnimationFrame(function () {
      const y = window.scrollY;
      hdr.classList.toggle('is-scrolled', y > 40);
      if (y > lastY + 8 && y > 200 && !document.body.classList.contains('is-locked')) {
        hdr.classList.add('is-hidden');
      } else if (y < lastY - 6 || y < 120) {
        hdr.classList.remove('is-hidden');
      }
      lastY = y;
      hdrTicking = false;
    });
  }, { passive: true });

  /* ── mobile menu ──────────────────────────────────────────────────────── */
  const menu = $('#menu');
  const menuBtn = $('#menu-btn');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open || !!$('#case').classList.contains('is-open'));
    if (open) {
      if (typeof hideCursorLabel === 'function') hideCursorLabel();
      gsap.fromTo('.menu__inner a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'expo.out' });
    }
    const spans = $$('.hdr__menu-lines i');
    spans[0].style.transform = open ? 'translateY(2.5px) rotate(45deg)' : '';
    spans[1].style.transform = open ? 'translateY(-2.5px) rotate(-45deg)' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  $$('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ── statement reveals ────────────────────────────────────────────────── */
  const statement = $('#statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    const spans = words.map(function (w) {
      const s = document.createElement('span');
      s.className = 'w' + (/^(3D|60FPS\.?)$/i.test(w) ? ' acid' : '');
      s.textContent = w;
      statement.appendChild(s);
      statement.appendChild(document.createTextNode(' '));
      return s;
    });

    if (REDUCED) {
      spans.forEach(function (s) { s.classList.add('on'); });
    } else {
      ScrollTrigger.create({
        trigger: statement,
        start: 'top 85%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate: function (self) {
          const k = Math.round(self.progress * spans.length * 1.05);
          spans.forEach(function (s, i) { s.classList.toggle('on', i < k); });
        }
      });
    }
  }

  /* ── flying glyphs ────────────────────────────────────────────────────── */
  const glyphBox = $('#glyphs');
  const glyphTarget = $('#glyphs-target');
  if (glyphBox && glyphTarget && !REDUCED) {
    const chars = 'PRECISIONFEELINGPLAY✳—&'.split('');
    const flyers = [];
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('span');
      s.textContent = chars[i % chars.length];
      s.style.left = '50%';
      s.style.top = '50%';
      glyphBox.appendChild(s);
      flyers.push(s);
    }

    const bw = glyphBox.getBoundingClientRect().width || window.innerWidth;
    gsap.set(flyers, {
      x: function () { return gsap.utils.random(-bw * 0.48, bw * 0.48); },
      y: function () { return gsap.utils.random(-70, 70); },
      rotate: function () { return gsap.utils.random(-40, 40); },
      opacity: 0
    });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: glyphBox, start: 'top 82%', once: true }
    });
    tl.to(flyers, {
      x: function () { return gsap.utils.random(-bw * 0.12, bw * 0.12); },
      y: function () { return gsap.utils.random(-16, 16); },
      rotate: 0,
      opacity: 0.8,
      duration: 1.15,
      stagger: { each: 0.012, from: 'random' },
      ease: 'power3.out'
    })
      .to(flyers, { opacity: 0, duration: 0.45, stagger: { each: 0.004, from: 'center' }, ease: 'power2.in' }, 0.95)
      .fromTo(glyphTarget,
        { opacity: 0, letterSpacing: '1.1em' },
        { opacity: 1, letterSpacing: '.5em', duration: 0.9, ease: 'expo.out' }, 1.15);
  } else if (glyphTarget) {
    glyphTarget.style.opacity = '1';
  }

  /* ── stats counters ───────────────────────────────────────────────────── */
  if (!REDUCED) {
    $$('.stats b').forEach(function (b) {
      const end = parseInt(b.textContent, 10) || 0;
      const state = { v: 0 };
      b.textContent = '0';
      ScrollTrigger.create({
        trigger: b,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(state, {
            v: end, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { b.textContent = String(Math.round(state.v)).padStart(end < 10 ? 2 : 0, '0'); }
          });
        }
      });
    });
  }

  /* ── work index + floating preview ────────────────────────────────────── */
  const rows = $$('.work__row');
  const preview = $('#work-preview');
  const previewImg = $('#work-preview-img');
  const previewTag = $('#work-preview-tag');
  const workList = $('#work-list');
  let previewKey = '';
  let previewShown = false;

  // mobile thumbnails
  rows.forEach(function (row) {
    const id = row.getAttribute('data-case');
    const w = WORKS[id];
    if (!w) return;
    const img = document.createElement('img');
    img.className = 'work__thumb';
    img.src = w.cover;
    img.alt = '';
    img.loading = 'lazy';
    row.insertBefore(img, row.children[1]);
    row.setAttribute('aria-label', w.title + ' — ' + w.sub);
  });

  const px = { v: 0 }, py = { v: 0 }, rx = { v: 0 }, ry = { v: 0 };
  let targetPX = 0, targetPY = 0, targetRX = 0, targetRY = 0;
  let previewRaf = 0;

  function previewLoop() {
    previewRaf = requestAnimationFrame(previewLoop);
    px.v += (targetPX - px.v) * 0.12;
    py.v += (targetPY - py.v) * 0.12;
    rx.v += (targetRX - rx.v) * 0.08;
    ry.v += (targetRY - ry.v) * 0.08;
    gsap.set(preview, { x: px.v, y: py.v });
    gsap.set('.work__preview-in', { rotationX: rx.v, rotationY: ry.v, transformPerspective: 900 });
  }

  function setPreview(id) {
    if (previewKey === id) return;
    previewKey = id;
    const w = WORKS[id];
    if (!w) return;
    previewImg.src = w.cover;
    previewImg.alt = w.title;
    previewTag.textContent = w.title;
    gsap.fromTo(previewImg, { scale: 1.14, opacity: 0.3 }, { scale: 1.06, opacity: 1, duration: 0.7, ease: 'expo.out' });
  }

  function showPreview() {
    if (previewShown) return;
    previewShown = true;
    preview.classList.add('is-on');
    gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'expo.out' });
    workList.classList.add('is-hot');
    if (!previewRaf) previewLoop();
  }

  function hidePreview() {
    if (!previewShown) return;
    previewShown = false;
    preview.classList.remove('is-on');
    gsap.to(preview, { scale: 0.9, autoAlpha: 0, duration: 0.35, ease: 'power2.out' });
    workList.classList.remove('is-hot');
  }

  if (preview && !TOUCH) {
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.92, autoAlpha: 0 });
    preview.style.transformOrigin = '50% 50%';

    rows.forEach(function (row) {
      const id = row.getAttribute('data-case');
      row.addEventListener('mouseenter', function () {
        setPreview(id);
        showPreview();
        px.v = mx; py.v = my;
        targetPX = mx; targetPY = my;
      });
    });

    workList.addEventListener('mouseleave', hidePreview);

    workList.addEventListener('pointermove', function (e) {
      if (!previewShown) return;
      const halfW = Math.min(420, window.innerWidth * 0.26) * 0.5;
      const halfH = halfW * 0.75;
      targetPX = clamp(e.clientX + halfW + 36, halfW + 12, window.innerWidth - halfW - 12);
      targetPY = clamp(e.clientY, halfH + 12, window.innerHeight - halfH - 12);
      const r = preview.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width || 1);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height || 1);
      targetRY = clamp(dx * 26, -16, 16);
      targetRX = clamp(-dy * 22, -14, 14);
    });

    window.addEventListener('scroll', hidePreview, { passive: true });
  }

  /* ── case study modal ────────────────────────────────────────────────── */
  const caseEl = $('#case');
  const caseScroll = $('#case-scroll');
  const caseTitle = $('#case-title');
  const caseSub = $('#case-sub');
  const caseIdx = $('#case-idx');
  const caseCat = $('#case-cat');
  const caseYear = $('#case-year');
  const caseRole = $('#case-role');
  const caseStack = $('#case-stack');
  const caseClient = $('#case-client');
  const caseBody = $('#case-body');
  const caseHeroImg = $('#case-hero');
  const caseImg2 = $('#case-img2');
  const caseCap = $('#case-cap');
  const caseHeroTag = $('#case-hero-tag');
  const caseNextName = $('#case-next-name');
  const caseClose = $('#case-close');
  const caseNext = $('#case-next');

  let caseOpen = false;
  let caseId = null;
  let opener = null;
  let savedScroll = 0;

  function renderCase(id) {
    const w = WORKS[id];
    if (!w) return;
    caseId = id;
    caseIdx.textContent = w.n + ' / 06';
    caseCat.textContent = w.cat;
    caseTitle.textContent = w.title;
    caseSub.textContent = w.sub;
    caseYear.textContent = w.year;
    caseRole.textContent = w.role;
    caseStack.textContent = w.stack;
    caseClient.textContent = w.client;
    caseHeroImg.src = w.cover;
    caseHeroImg.alt = w.title + ' — cover';
    caseImg2.src = w.cover2;
    caseImg2.alt = w.title + ' — detail';
    caseCap.textContent = w.cap;
    caseHeroTag.textContent = 'CASE ' + w.n;
    caseBody.innerHTML = '';
    const colA = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = w.p1;
    const p2 = document.createElement('p');
    p2.textContent = w.p2;
    colA.appendChild(p1); colA.appendChild(p2);
    const colB = document.createElement('div');
    const p3 = document.createElement('p');
    p3.className = 'small';
    p3.textContent = w.small;
    colB.appendChild(p3);
    caseBody.appendChild(colA);
    caseBody.appendChild(colB);

    const i = ORDER.indexOf(id);
    const nid = ORDER[(i + 1) % ORDER.length];
    caseNextName.textContent = WORKS[nid].title;
    caseNext.setAttribute('data-next', nid);
  }

  function hideCursorLabel() {
    cursor.classList.remove('is-active');
    cursorActive = false;
    cursor.style.opacity = '0';
  }

  function openCase(id, trigger) {
    if (caseOpen) return;
    hideCursorLabel();
    renderCase(id);
    caseOpen = true;
    opener = trigger || null;
    savedScroll = window.scrollY;
    caseEl.classList.add('is-open');
    caseEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    caseScroll.scrollTop = 0;

    if (REDUCED) {
      gsap.set(caseEl, { clipPath: 'inset(0 0 0% 0)' });
      gsap.set('.case__hero, .case__head, .case__meta, .case__body, .case__fig, .case__next', { opacity: 1, y: 0 });
    } else {
      gsap.set(caseEl, { clipPath: 'inset(0 0 100% 0)' });
      const tl = gsap.timeline();
      tl.to(caseEl, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.inOut' })
        .fromTo('.case__bar', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5)
        .fromTo('.case__hero', { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 0.55)
        .fromTo('.case__head, .case__meta, .case__body, .case__fig, .case__next',
          { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, 0.7);
    }

    if (caseClose) caseClose.focus({ preventScroll: true });
  }

  function closeCase() {
    if (!caseOpen) return;
    caseOpen = false;
    caseEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');

    if (REDUCED) {
      caseEl.classList.remove('is-open');
    } else {
      gsap.to(caseEl, {
        clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut',
        onComplete: function () { caseEl.classList.remove('is-open'); }
      });
    }
    if (opener && opener.focus) opener.focus({ preventScroll: true });
    window.scrollTo(0, savedScroll);
    cursor.style.opacity = '';
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function (e) {
      e.preventDefault();
      openCase(row.getAttribute('data-case'), row);
    });
  });

  caseClose.addEventListener('click', closeCase);

  caseNext.addEventListener('click', function () {
    const nid = caseNext.getAttribute('data-next');
    if (!nid) return;
    if (REDUCED) { renderCase(nid); caseScroll.scrollTop = 0; return; }
    const tl = gsap.timeline();
    tl.to('.case__scroll', { opacity: 0, y: -18, duration: 0.35, ease: 'power2.in' })
      .add(function () {
        renderCase(nid);
        caseScroll.scrollTop = 0;
        gsap.set('.case__scroll', { y: 20 });
      })
      .to('.case__scroll', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (caseOpen) closeCase();
      else if (menuOpen) setMenu(false);
    }
    if (e.key === 'Tab' && caseOpen) {
      const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', caseEl)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── stack interactions ───────────────────────────────────────────────── */
  const stackCaption = $('#stack-caption');
  const defaultCaption = '<span>Select a tool</span> to read how it gets used.';
  let captionTimer = 0;

  function setCaption(text) {
    stackCaption.innerHTML = text;
  }

  $$('.stk').forEach(function (btn) {
    const info = btn.getAttribute('data-info') || '';
    const parts = info.split('|');

    function on() {
      window.clearTimeout(captionTimer);
      $$('.stk.is-current').forEach(function (s) { s.classList.remove('is-current'); });
      $$('.stk').forEach(function (s) {
        if (s.textContent === btn.textContent) s.classList.add('is-current');
      });
      setCaption('<span>' + parts[0] + '</span> — ' + (parts[1] || ''));
    }

    btn.addEventListener('mouseenter', on);
    btn.addEventListener('focus', on);
    btn.addEventListener('click', on);
    btn.addEventListener('mouseleave', function () {
      captionTimer = window.setTimeout(function () {
        $$('.stk.is-current').forEach(function (s) { s.classList.remove('is-current'); });
        setCaption(defaultCaption);
      }, 900);
    });
  });

  /* ── contact ──────────────────────────────────────────────────────────── */
  const clock = $('#clock');
  function tickClock() {
    if (!clock) return;
    const d = new Date();
    const t = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    clock.textContent = 'LOCAL ' + t;
  }
  tickClock();
  window.setInterval(tickClock, 1000);

  const mailLink = $('#mail-link');
  if (mailLink) {
    mailLink.addEventListener('click', function (e) {
      e.preventDefault();
      const addr = 'hello@example.com';
      const restore = function () {
        mailLink.textContent = addr;
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () {
          mailLink.textContent = 'COPIED ✓ ' + addr;
          window.setTimeout(restore, 1800);
        }).catch(function () {
          window.location.href = 'mailto:' + addr;
        });
      } else {
        window.location.href = 'mailto:' + addr;
      }
    });
  }

  // magnetic CTA
  const cta = $('#cta');
  if (cta && !TOUCH) {
    const qx = gsap.quickTo(cta, 'x', { duration: 0.5, ease: 'power3.out' });
    const qy = gsap.quickTo(cta, 'y', { duration: 0.5, ease: 'power3.out' });
    cta.addEventListener('pointermove', function (e) {
      const r = cta.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.22);
      qy((e.clientY - (r.top + r.height / 2)) * 0.22);
    });
    cta.addEventListener('pointerleave', function () { qx(0); qy(0); });
  }

  /* ── scroll scenes ────────────────────────────────────────────────────── */
  if (!REDUCED) {
    gsap.to('.hero__title', {
      yPercent: -12,
      scale: 0.965,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    gsap.to('.hero__foot, .hero__kicker', {
      opacity: 0,
      y: -20,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: 0.6 }
    });

    gsap.from('.work__row', {
      y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.work__list', start: 'top 78%', once: true }
    });

    gsap.utils.toArray('.contact__title .line__in').forEach(function (el, i, arr) {
      gsap.fromTo(el, { yPercent: 112 }, {
        yPercent: 0, duration: 1.25, ease: 'expo.out', delay: i * 0.06,
        scrollTrigger: { trigger: '.contact__title', start: 'top 82%', once: true },
        onComplete: function () { if (i === arr.length - 1) settleTitle('.contact__title'); }
      });
    });

    gsap.from('.sec-head', {
      opacity: 0, y: 18, duration: 0.8, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '.about', start: 'top 80%', once: true }
    });

    // hero title mouse parallax
    if (!TOUCH) {
      const lines = $$('[data-depth]').map(function (el) {
        return {
          el: el,
          d: parseFloat(el.getAttribute('data-depth')) || 10,
          x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' })
        };
      });
      window.addEventListener('pointermove', function (e) {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        lines.forEach(function (l) {
          l.x(nx * l.d * 0.7);
          l.y(ny * l.d * 0.35);
        });
      }, { passive: true });
    }
  } else {
    gsap.set('.contact__title .line__in', { yPercent: 0 });
  }

  // recompute marquees once everything is in place
  window.addEventListener('load', function () {
    marquees.forEach(function (m) { m.measure(); });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  let resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      marquees.forEach(function (m) { m.measure(); });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 220);
  });

  // debugging / audit handle
  window.MM_SITE = {
    works: ORDER.length,
    images: assets.length,
    ready: function () { return loaderDone; },
    get loader() {
      return { done: loaderDone, finished: finished, shown: shown, target: target, pending: pending };
    }
  };
})();
