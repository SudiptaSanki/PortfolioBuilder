/* ============================================================
   dani — interactions
   GSAP + ScrollTrigger, spring physics, drawer, garden, tabs
   ============================================================ */
(function () {
  'use strict';

  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  var SPRING = 'elastic.out(1, 0.55)';

  var yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------
     content
     ------------------------------------------------------------ */
  var img = function (id, w, h) {
    return './assets/photos/img_' + id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase() + '.webp';
  };

  var ORDER = ['corti', 'zapo', 'sandhill', 'adfonic', 'healthpoint', 'union'];
  var CASES = {
    corti: {
      name: 'Corti.ai',
      tag: 'Medtech, AI',
      title: 'A calmer voice for clinical AI',
      year: '2025',
      role: 'Product design lead',
      scope: 'Design system · Product UI · Motion · Web',
      lede: 'Corti\u2019s AI listens to emergency calls in real time and suggests the next question a clinician should ask. My job was to make that intelligence feel like a colleague \u2014 quiet, fast and trustworthy in the worst minute of someone\u2019s day.',
      body: [
        'Emergency medicine has no room for a chat window that wants attention. We rebuilt the assistant around a single principle: the model speaks only when it can change a decision, and it says it in the same words a senior colleague would use.',
        'I led the product language end to end \u2014 the component library, the latency states, and the motion that tells a clinician whether an answer is still forming or already settled.'
      ],
      bullets: [
        'A 40-component design system shared by product, web and print',
        'Latency and confidence states designed for hands-busy, eyes-busy use',
        '28 co-design sessions with paramedics, nurses and dispatchers'
      ],
      stats: [['42%', 'faster triage hand-off'], ['100M', 'patient interactions'], ['28', 'clinicians co-designing']],
      cover: img('photo-1634017839464-5c339ebe3cb4', 1200, 760),
      shots: [img('photo-1518770660439-4636190af475', 760, 570), img('photo-1504384308090-c894fdcc538d', 760, 570)]
    },
    zapo: {
      name: 'Zapo',
      tag: 'B2B, SaaS',
      title: 'Growth leads, made obvious',
      year: '2024',
      role: 'Brand & product design',
      scope: 'Brand identity · Marketing site · Dashboard UI',
      lede: 'Zapo is a UK-based platform that drives growth for local businesses by generating high-quality leads. I rebuilt the brand and the product surface so a plumber with ten minutes between jobs can see exactly where the next customer comes from.',
      body: [
        'The old dashboard reported activity; owners wanted answers. We rewrote the interface around three questions \u2014 what came in, what is worth chasing, what it cost \u2014 and let everything else live one level down.',
        'The identity followed the same logic: a soft flower mark, a two-weight type system, and a colour language that survives being printed on a van.'
      ],
      bullets: [
        'Lead pipeline rebuilt around quality, not volume',
        'Brand identity and a marketing site that converts without noise',
        'Onboarding cut from nine screens to three'
      ],
      stats: [['+38%', 'qualified leads'], ['2.1\u00d7', 'trial to paid'], ['11', 'markets launched']],
      cover: img('photo-1483058712412-4245e9b90334', 1200, 760),
      shots: [img('photo-1519389950473-47ba0277781c', 760, 570), img('photo-1517245386807-bb43f82c33c4', 760, 570)]
    },
    sandhill: {
      name: 'Sandhill',
      tag: 'Fintech',
      title: 'Finance dashboards that feel light',
      year: '2024\u201325',
      role: 'Product designer',
      scope: 'Product UI · Data viz · Design system',
      lede: 'Sandhill gives small finance teams the clarity of a trading terminal without the terminal. Cash, runway and burn in one calm surface \u2014 with a design system that survives a forty-screen product.',
      body: [
        'Numbers only earn trust when they are legible. I designed a data language where every chart answers a question a founder actually asks on a Monday, and every table can be read at a glance on a laptop in a cafe.',
        'The system underneath scales across cash flow, forecasting and a customer-facing membership product without ever feeling like three different apps.'
      ],
      bullets: [
        'One data-viz language across 12 chart types',
        'Onboarding that gets a first real number on screen in 4 minutes',
        'Accessible colour scales tested against deuteranopia and protanopia'
      ],
      stats: [['18k', 'teams onboarded'], ['27%', 'activation lift'], ['4.8', 'App Store rating']],
      cover: img('photo-1604871000636-074fa5117945', 1200, 760),
      shots: [img('photo-1522199755839-a2bacb67c546', 760, 570), img('photo-1551434678-e076c223a692', 760, 570)]
    },
    adfonic: {
      name: 'Adfonic',
      tag: 'SaaS',
      title: 'Ad spend, without the fakes',
      year: '2023',
      role: 'Product & web design',
      scope: 'Product UI · Marketing site · Illustration · Motion',
      lede: 'Adfonic is a smart tool that helps advertisers avoid fake clicks, save money, and get better results from their ads. The interface had to make fraud legible in five seconds \u2014 and give marketers a reason to come back tomorrow.',
      body: [
        'Fraud reporting usually reads like a police file. We turned it into a story with a shape: here is the money, here is what leaked, here is the cut that survived.',
        'Illustration and motion carry the tone \u2014 playful enough to lower the temperature of a bad-news dashboard, precise enough to be believed by a performance team.'
      ],
      bullets: [
        'A five-second read on waste, per campaign',
        'Illustrated report system used in sales and in-product',
        'Motion spec for every alert severity level'
      ],
      stats: [['\u221231%', 'wasted spend'], ['6 min', 'to first insight'], ['240', 'brands live']],
      cover: img('photo-1614850523459-c2f4c699c52e', 1200, 760),
      shots: [img('photo-1618005182384-a83a8bd57fbe', 760, 570), img('photo-1555949963-aa79dcee981c', 760, 570)]
    },
    healthpoint: {
      name: 'Healthpoint',
      tag: 'Branding',
      title: 'A healthcare brand with a pulse',
      year: '2023',
      role: 'Brand designer',
      scope: 'Visual identity · Type system · Iconography · Print',
      lede: 'Fourteen clinics, one voice. I built a healthcare identity that feels human at a reception desk and clinical on a consent form \u2014 starting with a flower-shaped mark and a type system that carries both.',
      body: [
        'Care brands tend to choose between warmth and competence. Healthpoint needed both at once, in a system that a practice manager with no design team can actually apply.',
        'The answer was a small kit: one mark, two typefaces, six colours, forty icons and a three-page guide. Everything else is judgement.'
      ],
      bullets: [
        'Identity system applied across 14 clinics in 12 weeks',
        'Forty-icon family drawn on a single 24px grid',
        'A three-page brand guide a receptionist can follow'
      ],
      stats: [['14', 'clinics unified'], ['+52%', 'brand recall'], ['12', 'weeks to launch']],
      cover: img('photo-1490750967868-88aa4486c946', 1200, 760),
      shots: [img('photo-1416879595882-3373a0480b5b', 760, 570), img('photo-1470071459604-3b5ec3a7fe05', 760, 570)]
    },
    union: {
      name: 'Union Dreamers',
      tag: 'Community, App',
      title: 'Find your people in a new city',
      year: '2022',
      role: '0 \u2192 1 product designer',
      scope: 'Product strategy · Mobile UI · Prototype · Testing',
      lede: 'A community app for people who have just moved to a new city. Three taps from \u201cI know nobody\u201d to \u201cthere\u2019s a table on Thursday\u201d \u2014 designed, prototyped and tested in six weeks.',
      body: [
        'Every network app fails at the same moment: the first message to a stranger. We designed the whole product around making that message unnecessary \u2014 small, hosted, low-stakes events that people can join without speaking first.',
        'The visual language stays deliberately plain: one accent, big type, and photography that looks like a phone camera rather than a stock shoot.'
      ],
      bullets: [
        'A join-a-table flow with no cold messaging',
        'Six-week cycle from whiteboard to closed beta',
        'Prototype tested with 32 people who had moved within the last year'
      ],
      stats: [['24k', 'members'], ['68%', 'week-4 retention'], ['$1.2M', 'seed raised']],
      cover: img('photo-1502134249126-9f3755a50d78', 1200, 760),
      shots: [img('photo-1465101162946-4377e57745c3', 760, 570), img('photo-1451187580459-43490279c0fa', 760, 570)]
    }
  };

  var GARDEN = [
    ['photo-1618005182384-a83a8bd57fbe', 800, 1000, 'Chromatic gradient study'],
    ['photo-1634017839464-5c339ebe3cb4', 800, 600, 'Blue fabric waves'],
    ['photo-1541701494587-cb58502866ab', 800, 900, 'Marbled paint'],
    ['photo-1550684376-efcbd6e3f031', 800, 700, 'Ink in water'],
    ['photo-1519681393784-d120267933ba', 800, 1100, 'Mountains at night'],
    ['photo-1502134249126-9f3755a50d78', 800, 620, 'Milky way'],
    ['photo-1465101162946-4377e57745c3', 800, 900, 'Star field'],
    ['photo-1470071459604-3b5ec3a7fe05', 800, 560, 'Fog in the valley'],
    ['photo-1441974231531-c6227db76b6e', 800, 1050, 'Forest light'],
    ['photo-1490750967868-88aa4486c946', 800, 600, 'Yellow field'],
    ['photo-1416879595882-3373a0480b5b', 800, 800, 'Flower macro'],
    ['photo-1499209974431-9dddcece7f88', 800, 1000, 'Sunset arms'],
    ['photo-1524504388940-b1c1722653e1', 800, 1000, 'Window light'],
    ['photo-1517841905240-472988babdf9', 800, 700, 'Denim and sky'],
    ['photo-1487958449943-2429e8be8625', 800, 620, 'White architecture'],
    ['photo-1519389950473-47ba0277781c', 800, 900, 'Desk of many laptops'],
    ['photo-1506905925346-21bda4d32df4', 800, 560, 'Alpine dawn'],
    ['photo-1501854140801-50d01698950b', 800, 900, 'Green ridges'],
    ['photo-1604871000636-074fa5117945', 800, 700, 'Warm gradient'],
    ['photo-1620121692029-d088224ddc74', 800, 1000, 'Pink and blue wave']
  ];

  /* ------------------------------------------------------------
     help: svg draw-in
     ------------------------------------------------------------ */
  function prepDraw(paths) {
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
  }

  /* ------------------------------------------------------------
     hero
     ------------------------------------------------------------ */
  function heroMotion() {
    var archPaths = qsa('.hero__doodle path');
    var petals = qsa('.flower .petal-inner');
    var lines = qsa('.hero__title .line > span');

    if (!hasGSAP || reduced) {
      archPaths.forEach(function (p) { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = 0; });
      return;
    }

    prepDraw(archPaths);

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.12 });
    tl.from('.nav__inner', { y: -16, opacity: 0, duration: 0.7 }, 0)
      .from('.brand .letter', { y: -10, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'back.out(2.2)' }, 0.05)
      .to(archPaths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.inOut' }, 0.25)
      .from(petals, {
        scale: 0, opacity: 0, duration: 1.35, transformOrigin: '200px 200px',
        stagger: { each: 0.045, from: 'random' }, ease: 'elastic.out(1, 0.7)'
      }, 0.2)
      .from(lines, { yPercent: 118, duration: 1.05, stagger: 0.085, ease: 'power4.out' }, 0.4)
      .from('.hero__sub', { y: 18, opacity: 0, duration: 0.9 }, '-=0.55')
      .from('.hero__actions .pill', { scale: 0.86, opacity: 0, duration: 0.9, ease: SPRING }, '-=0.6')
      .from('.scrollcue', { opacity: 0, duration: 0.6 }, '-=0.4');

    // idle float
    gsap.to('.flower--left > svg', { y: -18, rotate: -3.5, duration: 6.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('.flower--right > svg', { y: 16, rotate: 3, duration: 7.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 });

    // pointer parallax
    var hero = qs('.hero');
    var left = qs('.flower--left');
    var right = qs('.flower--right');
    if (hero && left && right) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(left, { x: nx * -42, y: ny * -26, duration: 1.3, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(right, { x: nx * 34, y: ny * -20, duration: 1.5, ease: 'power2.out', overwrite: 'auto' });
      });
    }
  }

  /* ------------------------------------------------------------
     marquee
     ------------------------------------------------------------ */
  function marquee() {
    var track = qs('#marqueeTrack');
    if (!track) return;
    var original = track.innerHTML;
    track.innerHTML = original + original;

    if (!hasGSAP || reduced) return;

    var loop = gsap.to(track, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 });

    qsa('.snip', track).forEach(function (snip) {
      snip.addEventListener('pointerenter', function () {
        gsap.to(loop, { timeScale: 0, duration: 0.55, ease: 'power2.out' });
        gsap.to(snip, { y: -18, scale: 1.045, rotate: -1.2, duration: 0.9, ease: SPRING });
      });
      snip.addEventListener('pointerleave', function () {
        gsap.to(loop, { timeScale: 1, duration: 0.9, ease: 'power2.out' });
        gsap.to(snip, { y: 0, scale: 1, rotate: 0, duration: 0.75, ease: 'elastic.out(1, 0.7)' });
      });
    });
  }

  /* ------------------------------------------------------------
     reveal on scroll
     ------------------------------------------------------------ */
  function reveals() {
    if (!hasST || reduced) return;

    qsa('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 34, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    var grid = qs('.work__grid');
    if (grid) {
      gsap.from(qsa('.tile'), {
        y: 64, opacity: 0, scale: 0.965, duration: 1.05, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 84%' }
      });
    }

    var caps = qs('#caps');
    if (caps) {
      gsap.from(qsa('.cap'), {
        y: 34, opacity: 0, duration: 0.85, stagger: 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: caps, start: 'top 86%' }
      });
    }

    qsa('.ph').forEach(function (ph) {
      var tilt = parseFloat(ph.dataset.tilt || '0');
      gsap.set(ph, { rotate: tilt });
      gsap.from(ph, {
        y: 46, opacity: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ph, start: 'top 90%' }
      });
      if (ph.classList.contains('ph--story')) return;
      gsap.fromTo(ph, { rotate: tilt - 1.8 }, {
        rotate: tilt + 1.8, ease: 'none',
        scrollTrigger: { trigger: ph, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    });

    // hero flowers drift a little as the page scrolls
    gsap.to('.flower--left', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.flower--right', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ------------------------------------------------------------
     tiles: spring hover
     ------------------------------------------------------------ */
  function tiles() {
    qsa('.tile').forEach(function (tile) {
      if (!hasGSAP || reduced) {
        tile.addEventListener('click', function () { openCase(tile.dataset.case); });
        return;
      }
      tile.addEventListener('pointerenter', function () {
        gsap.to(tile, { y: -10, scale: 1.012, duration: 0.9, ease: SPRING });
        gsap.to(tile.querySelectorAll('.art-card'), { y: -7, duration: 0.8, ease: SPRING, stagger: 0.05 });
        var fl = tile.querySelector('.tile__flower');
        if (fl) gsap.to(fl, { rotate: 22, scale: 1.06, duration: 1, ease: SPRING });
      });
      tile.addEventListener('pointerleave', function () {
        gsap.to(tile, { y: 0, scale: 1, duration: 0.75, ease: 'elastic.out(1, 0.7)' });
        gsap.to(tile.querySelectorAll('.art-card'), { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.7)' });
        var fl = tile.querySelector('.tile__flower');
        if (fl) gsap.to(fl, { rotate: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' });
      });
      tile.addEventListener('click', function () { openCase(tile.dataset.case); });
    });
  }

  /* ------------------------------------------------------------
     capabilities
     ------------------------------------------------------------ */
  function caps() {
    qsa('.cap').forEach(function (cap) {
      cap.addEventListener('click', function () {
        var open = cap.classList.toggle('is-open');
        if (hasGSAP && !reduced) {
          gsap.fromTo(cap, { scale: 0.985 }, { scale: 1, duration: 0.8, ease: SPRING });
        }
        cap.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      cap.setAttribute('aria-expanded', 'false');
    });

    if (!hasGSAP || reduced) return;
    qsa('.cap').forEach(function (cap) {
      cap.addEventListener('pointerenter', function () {
        gsap.to(cap.querySelector('.cap__icon'), { rotate: -8, scale: 1.08, duration: 0.8, ease: SPRING });
      });
      cap.addEventListener('pointerleave', function () {
        gsap.to(cap.querySelector('.cap__icon'), { rotate: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.7)' });
      });
    });
  }

  /* ------------------------------------------------------------
     case study drawer
     ------------------------------------------------------------ */
  var drawer = qs('#drawer');
  var panel = drawer ? qs('.drawer__panel', drawer) : null;
  var scrim = drawer ? qs('.drawer__scrim', drawer) : null;
  var caseContent = qs('#caseContent');
  var lastFocus = null;

  function caseHTML(c, key) {
    var nextKey = ORDER[(ORDER.indexOf(key) + 1) % ORDER.length];
    var next = CASES[nextKey];
    return '' +
      '<div class="case-anim">' +
        '<div class="case__head"><h2 class="case__name" id="caseName">' + c.name + '</h2><span class="case__tag">' + c.tag + '</span></div>' +
        '<p class="case__lede">' + c.lede + '</p>' +
      '</div>' +
      '<img class="case__cover case-anim" src="' + c.cover + '" alt="' + c.name + ' case study cover" loading="lazy" width="1200" height="760">' +
      '<dl class="case__meta case-anim">' +
        '<div><dt>Year</dt><dd>' + c.year + '</dd></div>' +
        '<div><dt>Role</dt><dd>' + c.role + '</dd></div>' +
        '<div><dt>Scope</dt><dd>' + c.scope + '</dd></div>' +
      '</dl>' +
      '<div class="case__body">' +
        '<h4>What it needed</h4>' +
        c.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        '<h4>What I made</h4>' +
        '<ul>' + c.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="case__shots">' + c.shots.map(function (s, i) {
        return '<img src="' + s + '" alt="' + c.name + ' detail ' + (i + 1) + '" loading="lazy" width="760" height="570">';
      }).join('') + '</div>' +
      '<div class="stats case-anim">' + c.stats.map(function (s) {
        return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
      }).join('') + '</div>' +
      '<button class="case__next case-anim" data-next="' + nextKey + '">' +
        '<span><small>Next case study</small><b>' + next.name + ' — ' + next.tag + '</b></span>' +
        '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' +
      '</button>';
  }

  function openCase(key) {
    var c = CASES[key];
    if (!c || !drawer) return;
    lastFocus = document.activeElement;
    caseContent.innerHTML = caseHTML(c, key);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    panel.scrollTop = 0;

    if (hasGSAP && !reduced) {
      gsap.to(scrim, { opacity: 1, duration: 0.35, ease: 'power1.out' });
      gsap.to(panel, { xPercent: 0, duration: 0.8, ease: 'power4.out' });
      gsap.from(qsa('.case-anim', caseContent), {
        y: 20, opacity: 0, duration: 0.6, stagger: 0.055, ease: 'power3.out', delay: 0.14
      });
    } else {
      if (hasGSAP) gsap.set(panel, { xPercent: 0 });
      if (scrim) scrim.style.opacity = '1';
    }
    var closeBtn = qs('[data-close]', drawer);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeCase() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    var done = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (hasGSAP && !reduced) {
      gsap.to(panel, { xPercent: 100, duration: 0.5, ease: 'power3.inOut', onComplete: done });
      gsap.to(scrim, { opacity: 0, duration: 0.35 });
    } else {
      done();
    }
  }

  if (drawer) {
    qsa('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeCase); });
    caseContent.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-next]');
      if (!btn) return;
      var nextKey = btn.getAttribute('data-next');
      var c = CASES[nextKey];
      caseContent.innerHTML = caseHTML(c, nextKey);
      panel.scrollTop = 0;
      if (hasGSAP && !reduced) {
        gsap.from(qsa('.case-anim', caseContent), { y: 22, opacity: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out' });
      }
    });
  }

  /* ------------------------------------------------------------
     garden
     ------------------------------------------------------------ */
  var garden = qs('#garden');
  var masonry = qs('#masonry');
  var gardenBuilt = false;
  var gardenLastFocus = null;

  function buildGarden() {
    if (gardenBuilt || !masonry) return;
    masonry.innerHTML = GARDEN.map(function (g) {
      return '<figure><img src="' + img(g[0], g[1], g[2]) + '" alt="' + g[3] + '" loading="lazy" width="' + g[1] + '" height="' + g[2] + '"></figure>';
    }).join('');
    gardenBuilt = true;
  }

  function openGarden() {
    if (!garden) return;
    gardenLastFocus = document.activeElement;
    buildGarden();
    garden.classList.add('is-open');
    garden.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    garden.scrollTop = 0;
    if (hasGSAP && !reduced) {
      gsap.to(garden, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.from(qsa('.masonry figure'), { y: 30, opacity: 0, duration: 0.7, stagger: 0.028, ease: 'power3.out', delay: 0.06 });
    } else {
      garden.style.opacity = '1';
    }
    var closeBtn = qs('[data-close]', garden);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeGarden() {
    if (!garden || !garden.classList.contains('is-open')) return;
    var done = function () {
      garden.classList.remove('is-open');
      garden.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (gardenLastFocus && gardenLastFocus.focus) gardenLastFocus.focus({ preventScroll: true });
    };
    if (hasGSAP && !reduced) {
      gsap.to(garden, { opacity: 0, duration: 0.3, ease: 'power1.in', onComplete: done });
    } else {
      done();
    }
  }

  var gardenOpenBtn = qs('#gardenOpen');
  if (gardenOpenBtn) gardenOpenBtn.addEventListener('click', openGarden);
  if (garden) {
    qsa('[data-close]', garden).forEach(function (b) { b.addEventListener('click', closeGarden); });
  }
  qsa('[data-garden]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openGarden(); });
  });

  /* ------------------------------------------------------------
     footer tabs
     ------------------------------------------------------------ */
  function tabs() {
    var tabline = qs('#tabline');
    var all = qsa('#tabs .tab');
    all.forEach(function (tab) {
      var show = function () {
        if (tabline) tabline.textContent = tab.dataset.line || '';
        all.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      };
      tab.addEventListener('pointerenter', show);
      tab.addEventListener('focus', show);
      tab.addEventListener('click', show);
    });
  }

  /* ------------------------------------------------------------
     keyboard + scroll chrome
     ------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (garden && garden.classList.contains('is-open')) closeGarden();
    else if (drawer && drawer.classList.contains('is-open')) closeCase();
  });

  function trapFocus(container) {
    if (!container) return;
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = qsa('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', container)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  trapFocus(drawer);
  trapFocus(garden);

  var nav = qs('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------
     boot
     ------------------------------------------------------------ */
  if (panel && hasGSAP) gsap.set(panel, { xPercent: 100 });
  if (scrim) scrim.style.opacity = '0';

  heroMotion();
  marquee();
  reveals();
  tiles();
  caps();
  tabs();

  window.addEventListener('load', function () {
    if (hasST) ScrollTrigger.refresh();
  });
})();
