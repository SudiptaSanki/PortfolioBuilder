/* ═══════════════════════════════════════════════════════════════
   VARIN — interface layer
   preloader · scroll chapters · case drawer · accordion · tabs
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!window.gsap;
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ── content ──────────────────────────────────────────────── */
  var IMG = function (id, w) {
    return './assets/photos/img_' + id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase() + '.webp';
  };

  var PROJECTS = [
    {
      title: 'Stratus',
      kicker: 'Case 01 — Identity / Spatial / Motion',
      sub: 'A scenography studio that builds rooms you remember. The identity had to work four metres tall and at thirty-two pixels.',
      lead: IMG('photo-1600585154340-be6161a56a0c', 1600),
      leadCap: 'Stratus — architectural study, dusk',
      specs: [
        ['Client', 'Stratus, Bordeaux'],
        ['Year', '2026'],
        ['Role', 'Design, 3D & front-end'],
        ['Scope', 'Identity · Motion system · Site'],
        ['Stack', 'Rhino · Blender · Three.js · GSAP'],
        ['Recognition', 'Awwwards Honourable Mention']
      ],
      text: [
        'Stratus designs exhibition sets for museums and fashion houses — work that exists for three weeks and then disappears. Their old site showed photographs of empty rooms. We replaced it with a single form that behaves like a set: it turns, catches light and changes proportion the way a visitor would move through it.',
        'The identity is built on one gesture: a horizontal aperture that opens wider as the studio’s name gets smaller. In motion the aperture becomes a transition — it wipes, it holds, it closes. Everything else is set in a tight grotesk and left alone. The object does the talking.'
      ],
      gallery: [
        { src: IMG('photo-1586023492125-27b2c045efd7'), cap: 'Set study 02 — ochre chair, north light' },
        { src: IMG('photo-1567016432779-094069958ea5'), cap: 'Set study 03 — linen, terracotta, 18:40' }
      ]
    },
    {
      title: 'Metropole',
      kicker: 'Case 02 — Product / Data / Motion',
      sub: 'A media network with forty markets needed one motion language instead of forty decks.',
      lead: IMG('photo-1558655146-9f40138edfeb', 1600),
      leadCap: 'Metropole — planning console, dark mode',
      specs: [
        ['Client', 'Metropole, Paris'],
        ['Year', '2025'],
        ['Role', 'Product design & motion'],
        ['Scope', 'Design system · Dashboard · Motion'],
        ['Stack', 'Figma · GSAP · WebGL'],
        ['Recognition', 'Rolled out across 40 markets']
      ],
      text: [
        'Metropole buys and sells attention across forty markets, and every market had invented its own way of showing a number. We designed one planning console and, more importantly, one motion grammar: data arrives as stacked plates, settles, and only then resolves into figures.',
        'The restraint is the feature. A dashboard that animates everything tells you nothing about what matters, so only two things move — the thing you touched, and the thing that just changed. Every other transition is a fade measured in milliseconds.'
      ],
      gallery: [
        { src: IMG('photo-1540575467063-178a50c2df87'), cap: 'Launch keynote — 1 200 screens, one timeline' },
        { src: IMG('photo-1617791160536-598cf32026fb'), cap: 'Audience model — volumetric study' }
      ]
    },
    {
      title: 'ACHETERduNEUF',
      kicker: 'Case 03 — 3D product / Front-end',
      sub: 'New-build property made tangible: floor plans you can walk through before the concrete is poured.',
      lead: IMG('photo-1618221195710-dd6b41faaea6', 1600),
      leadCap: 'ACHETERduNEUF — apartment study, 10:20',
      specs: [
        ['Client', 'ACHETERduNEUF'],
        ['Year', '2025'],
        ['Role', '3D product & front-end'],
        ['Scope', 'Explorer · Configurator · Launch film'],
        ['Stack', 'Three.js · GLSL · Sanity'],
        ['Recognition', '+38% qualified enquiries']
      ],
      text: [
        'Buying off-plan means buying a promise. The brief was to make that promise spatial: pick a floor, open a wall, move the light from morning to evening, and see the room you are actually buying instead of a render shot from one flattering angle.',
        'Everything loads progressively — structure first, then furniture, then materials — so the first room appears in under a second on a phone. The camera is constrained on purpose: a small set of authored views, each with its own light, so the buyer never gets lost in an empty model.'
      ],
      gallery: [
        { src: IMG('photo-1600210492486-724fe5c67fb0'), cap: 'Living study — plaster, oak, 16:00' },
        { src: IMG('photo-1631679706909-1844bbd07221'), cap: 'Configurator — three material sets' }
      ]
    },
    {
      title: 'Vickies',
      kicker: 'Case 04 — Brand motion / Web',
      sub: 'A kinetic identity for an agency that gets bored quickly — built to be remixed by the team.',
      lead: IMG('photo-1618556450991-2f1af64e8191', 1600),
      leadCap: 'Vickies — motion texture 04',
      specs: [
        ['Client', 'Vickies, Lyon'],
        ['Year', '2024'],
        ['Role', 'Brand motion & web'],
        ['Scope', 'Motion system · Site · Templates'],
        ['Stack', 'After Effects · Rive · GSAP'],
        ['Recognition', 'In use for 3 seasons']
      ],
      text: [
        'Vickies calls itself a “super fresh” agency, which is the kind of claim a static logo cannot support. We gave them a system instead of a mark: three line behaviours that can be drawn, interrupted, echoed and re-coloured, and a set of timings that make any combination look like it came from the same hand.',
        'The site is the manual. Each project page doubles as a specimen: here is the behaviour, here is the easing curve, here is the button you press to copy the preset into After Effects. Nothing is hidden behind a PDF.'
      ],
      gallery: [
        { src: IMG('photo-1550745165-9bc0b252726f'), cap: 'Studio desk — reference hardware' },
        { src: IMG('photo-1618005182384-a83a8bd57fbe'), cap: 'Gradient field — season 02' }
      ]
    },
    {
      title: 'ADN Family',
      kicker: 'Case 05 — Spatial / Avatars / WebGL',
      sub: 'A metaverse ecosystem for a fashion family: one spatial lobby, six thousand avatars, no loading screens.',
      lead: IMG('photo-1620121692029-d088224ddc74', 1600),
      leadCap: 'ADN Family — lobby atmosphere pass',
      specs: [
        ['Client', 'ADN Family'],
        ['Year', '2024'],
        ['Role', 'Spatial design & WebGL'],
        ['Scope', 'Lobby · Avatar configurator · Events'],
        ['Stack', 'Three.js · OGL · GSAP'],
        ['Recognition', '6 000 avatars in week one']
      ],
      text: [
        'ADN Family wanted a place, not a page. We designed a single room that can hold a fashion show, a drop and a conversation without ever reloading: the camera moves, the light changes, the crowd appears. Avatars are assembled from a small kit of parts, which keeps six thousand of them under one texture budget.',
        'The hardest part was arrival. A metaverse that takes ninety seconds to load is a website with extra steps, so the lobby streams in behind the door: the room is playable at 700 kB and quietly fills in the rest while you are already walking.'
      ],
      gallery: [
        { src: IMG('photo-1518770660439-4636190af475'), cap: 'Avatar kit — texture budget study' },
        { src: IMG('photo-1517336714731-489689fd1ca8'), cap: 'Lobby at 21:00 — event state' }
      ]
    },
    {
      title: 'Atypica',
      kicker: 'Case 06 — Product / Editorial',
      sub: 'Where web meets originality — a product story told in five stills and one very patient scroll.',
      lead: IMG('photo-1526170375885-4d8ecf77b99f', 1600),
      leadCap: 'Atypica — product study 01',
      specs: [
        ['Client', 'Atypica'],
        ['Year', '2023'],
        ['Role', 'Design & development'],
        ['Scope', 'Editorial product site'],
        ['Stack', 'Three.js · GSAP'],
        ['Recognition', 'Personal project']
      ],
      text: [
        'Atypica began as an excuse to photograph one object properly. Five stills, one lens, the same window light at four different hours — and a page that treats each image as a chapter rather than a tile in a grid.',
        'The scroll is slow on purpose. Type arrives a line at a time, images hold for a beat longer than feels comfortable, and the only interaction is a slight parallax that makes the stills feel like they were taken in a room you could step into.'
      ],
      gallery: [
        { src: IMG('photo-1523275335684-37898b6baf30'), cap: 'Object study — 38 mm, matte case' },
        { src: IMG('photo-1516035069371-29a1b244cc32'), cap: 'Object study — 85 mm, f/1.8' }
      ]
    }
  ];

  var CHAPTER_MORPH = {
    hero: 'Pebble', approach: 'Sculpted', work: 'Spindle',
    expertise: 'Lens', studio: 'Blend', contact: 'Lens'
  };

  /* ── preloader ────────────────────────────────────────────── */
  function initLoader() {
    var loader = $('#loader');
    if (!loader) return finishLoader();
    var pctEl = $('#loadPct'), barEl = $('#loadBar'), noteEl = $('#loadNote');
    var letters = $$('.loader__word span');
    var progress = 0, targetProgress = 0, done = false;
    var start = performance.now();

    if (hasGSAP && !reduce) {
      gsap.set(letters, { yPercent: 115, opacity: 0 });
      gsap.to(letters, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.045, delay: 0.1 });
      gsap.from(loader.querySelectorAll('.loader__top, .loader__bottom'), { opacity: 0, duration: 1, delay: 0.25, ease: 'power2.out' });
    }

    var notes = ['Calibrating light rig', 'Casting OBJ-07', 'Baking studio environment', 'Composing chapters', 'Ready'];
    var assetsReady = false;
    var waitFor = [];
    if (doc.fonts && doc.fonts.ready) waitFor.push(doc.fonts.ready);
    waitFor.push(new Promise(function (res) {
      if (doc.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    }));
    Promise.all(waitFor).then(function () { assetsReady = true; });

    function tick(now) {
      var elapsed = (now - start) / 1000;
      // ease toward target, always moving so the counter never stalls
      targetProgress = Math.min(assetsReady ? 100 : 88, elapsed * 62);
      progress += (targetProgress - progress) * 0.09;
      var shown = Math.min(100, Math.round(progress + (elapsed > 0.4 ? 1 : 0)));
      if (pctEl) pctEl.textContent = String(shown).padStart(3, '0');
      if (barEl) barEl.style.width = shown + '%';
      if (noteEl) {
        var idx = Math.min(notes.length - 1, Math.floor(shown / 22));
        if (noteEl.textContent !== notes[idx]) noteEl.textContent = notes[idx];
      }
      if (shown >= 100 && !done && elapsed > 1.35) { done = true; return reveal(); }
      if (elapsed > 6) { if (!done) { done = true; reveal(); } return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function reveal() {
      var tl = hasGSAP ? gsap.timeline({ onComplete: finishLoader }) : null;
      if (!tl) return finishLoader();
      tl.to(letters, { yPercent: -110, opacity: 0, duration: 0.75, ease: 'expo.inOut', stagger: 0.025 })
        .to(loader.querySelectorAll('.loader__top, .loader__bottom'), { opacity: 0, duration: 0.4 }, 0.1)
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'expo.inOut' }, 0.35);
    }

    function finishLoader() {
      loader.style.display = 'none';
      loader.setAttribute('aria-hidden', 'true');
      doc.body.dataset.ready = '1';
      heroIntro();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
  }

  /* ── hero intro ───────────────────────────────────────────── */
  function heroIntro() {
    if (!hasGSAP || reduce) return;
    var lines = $$('[data-hero-line]');
    var fades = $$('[data-hero-fade]');
    var tl = gsap.timeline({ delay: 0.05 });
    tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.09 })
      .fromTo(fades, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.35)
      .from('.spec', { opacity: 0, y: 26, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, 0.55)
      .from('.hud, .rail', { opacity: 0, duration: 1, ease: 'power2.out' }, 0.4);
  }

  /* ── split text ───────────────────────────────────────────── */
  function splitWords(el) {
    var nodes = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { nodes.push(doc.createTextNode(' ')); return; }
            var outer = doc.createElement('span');
            outer.className = 'word';
            var inner = doc.createElement('i');
            inner.textContent = part;
            outer.appendChild(inner);
            nodes.push(outer);
          });
        } else if (child.nodeType === 1) {
          var clone = child.cloneNode(false);
          nodes.push(clone);
          walk(child);
        }
      });
    };
    var frag = doc.createDocumentFragment();
    var innerNodes = [];
    walk(el);
    // rebuild: nodes were collected flat — wrap text into words, keep element wrappers simple
    nodes.forEach(function (n) { frag.appendChild(n); });
    el.innerHTML = '';
    el.appendChild(frag);
    innerNodes = $$('.word i', el);
    return innerNodes;
  }

  function initSplitReveals() {
    var targets = $$('[data-split]');
    targets.forEach(function (el) {
      var words = splitWords(el);
      if (!hasGSAP || reduce) { gsap && gsap.set(words, { y: 0 }); return; }
      gsap.set(words, { yPercent: 108 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 86%',
        once: true,
        onEnter: function () {
          gsap.to(words, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.022 });
        }
      });
    });
  }

  /* ── reveal + chapter triggers ────────────────────────────── */
  function initScroll() {
    if (!hasGSAP || !window.ScrollTrigger) return;

    // staggered section reveals
    $$('[data-reveal]').forEach(function (el, i) {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { el.classList.add('is-revealed'); }
      });
    });

    // chapter choreography for the 3D rig
    $$('[data-chapter]').forEach(function (section) {
      var name = section.dataset.chapter;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 58%',
        end: 'bottom 42%',
        onToggle: function (self) {
          if (!self.isActive) return;
          doc.body.dataset.chapter = name;
          if (window.RIG) window.RIG.setChapter(name);
          setActiveNav(name);
        }
      });
    });

    // nav + rail state
    function setActiveNav(name) {
      var key = name === 'hero' ? 'top' : name;
      $$('.hud__nav a, .rail__list a, .menu__nav a').forEach(function (a) {
        a.classList.toggle('is-active', a.dataset.nav === key || a.dataset.rail === key);
      });
    }
    window.__setActiveNav = setActiveNav;
    doc.body.dataset.chapter = 'hero';
    setActiveNav('hero');

    // rail progress
    var fill = $('#railFill');
    function railProgress() {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
      if (fill) fill.style.height = (p * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', railProgress, { passive: true });
    railProgress();

    // hero intro also needs to re-run if loader skipped
    if (doc.body.dataset.ready === '1') heroIntro();
  }

  /* ── smooth anchors ───────────────────────────────────────── */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = doc.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        var top = target.getBoundingClientRect().top + window.pageYOffset - (id === '#top' ? 0 : 8);
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ── pointer parallax / card tilt / magnetic ──────────────── */
  function initPointer() {
    if (window.matchMedia('(hover: none)').matches) return;

    var specs = $$('.spec');
    var mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('pointermove', function (e) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      if (window.RIG) window.RIG.setPointer(mx, my);
    }, { passive: true });

    function frame() {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      specs.forEach(function (el, i) {
        var depth = (i + 1) * 7;
        var base = el.dataset.tx || '0px';
        el.style.transform = 'translate3d(' + (-cx * depth) + 'px,' + (-cy * depth * 0.7) + 'px,0)';
      });
      requestAnimationFrame(frame);
    }
    if (!reduce) requestAnimationFrame(frame);

    // project tilt
    $$('.project').forEach(function (card) {
      var media = $('.project__media', card);
      if (!media) return;
      card.addEventListener('pointermove', function (e) {
        var r = media.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width * 2 - 1;
        var ny = (e.clientY - r.top) / r.height * 2 - 1;
        media.style.setProperty('--rx', (-ny * 3.4).toFixed(2) + 'deg');
        media.style.setProperty('--ry', (nx * 4.2).toFixed(2) + 'deg');
        media.style.setProperty('--mx', nx.toFixed(3));
        media.style.setProperty('--my', ny.toFixed(3));
      });
      card.addEventListener('pointerleave', function () {
        media.style.setProperty('--rx', '0deg');
        media.style.setProperty('--ry', '0deg');
        media.style.setProperty('--mx', '0');
        media.style.setProperty('--my', '0');
      });
    });

    // magnetic buttons
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + (x * 7).toFixed(2) + 'px,' + (y * 5).toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ── header state ─────────────────────────────────────────── */
  function initHeader() {
    var hud = $('#hud');
    var last = -1;
    function onScroll() {
      var y = window.pageYOffset;
      if (last === y) return;
      last = y;
      hud.classList.toggle('is-scrolled', y > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── mobile menu ──────────────────────────────────────────── */
  function closeMenu() {
    var menu = $('#menu'), btn = $('#menuBtn');
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    doc.body.classList.remove('is-locked');
  }

  function initMenu() {
    var menu = $('#menu'), btn = $('#menuBtn');
    if (!menu || !btn) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      menu.setAttribute('aria-hidden', String(!open));
      btn.setAttribute('aria-expanded', String(open));
      doc.body.classList.toggle('is-locked', open);
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ── case drawer ──────────────────────────────────────────── */
  var drawer, drawerIndex = 0;

  function fillDrawer(i) {
    var p = PROJECTS[i];
    drawerIndex = i;
    $('#drawerCase').textContent = 'Case ' + String(i + 1).padStart(2, '0') + ' / ' + String(PROJECTS.length).padStart(2, '0');
    $('#drawerKicker').textContent = p.kicker;
    $('#drawerTitle').textContent = p.title;
    $('#drawerSub').textContent = p.sub;

    var hero = $('#drawerHero');
    hero.src = p.lead;
    hero.alt = p.title + ' — case study lead image';
    $('#drawerHeroCap').textContent = p.leadCap;

    var specs = $('#drawerSpecs');
    specs.innerHTML = '';
    p.specs.forEach(function (row) {
      var div = doc.createElement('div');
      var dt = doc.createElement('dt'); dt.textContent = row[0];
      var dd = doc.createElement('dd'); dd.textContent = row[1];
      div.appendChild(dt); div.appendChild(dd); specs.appendChild(div);
    });

    var text = $('#drawerText');
    text.innerHTML = '';
    p.text.forEach(function (t) { var el = doc.createElement('p'); el.textContent = t; text.appendChild(el); });

    var gal = $('#drawerGallery');
    gal.innerHTML = '';
    p.gallery.forEach(function (g) {
      var fig = doc.createElement('figure');
      var img = doc.createElement('img');
      img.src = g.src; img.alt = g.cap; img.loading = 'lazy';
      var cap = doc.createElement('figcaption');
      cap.className = 'mono'; cap.textContent = g.cap;
      cap.style.padding = '.6rem .75rem';
      fig.appendChild(img); fig.appendChild(cap); gal.appendChild(fig);
    });

    var next = PROJECTS[(i + 1) % PROJECTS.length];
    $('#drawerNextTitle').textContent = next.title;
    var scroll = $('#drawerScroll');
    if (scroll) scroll.scrollTop = 0;
  }

  function openDrawer(i) {
    if (!drawer) return;
    fillDrawer(i);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('is-locked');
    var close = $('#drawerClose');
    if (close) setTimeout(function () { close.focus({ preventScroll: true }); }, 420);
    if (hasGSAP && !reduce) {
      gsap.fromTo('#drawer .drawer__hero, #drawer .drawer__intro, #drawer .drawer__specs, #drawer .drawer__text, #drawer .drawer__gallery',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.35, overwrite: true });
    }
  }

  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    doc.body.classList.remove('is-locked');
  }

  function initDrawer() {
    drawer = $('#drawer');
    if (!drawer) return;

    $$('.project').forEach(function (card) {
      var open = function () { openDrawer(Number(card.dataset.project)); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    $('#drawerClose').addEventListener('click', closeDrawer);
    $$('[data-close]', drawer).forEach(function (el) { el.addEventListener('click', closeDrawer); });
    $('#drawerNext').addEventListener('click', function () {
      fillDrawer((drawerIndex + 1) % PROJECTS.length);
      if (hasGSAP && !reduce) gsap.fromTo('#drawerScroll', { opacity: 0.35 }, { opacity: 1, duration: 0.5 });
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'ArrowRight') fillDrawer((drawerIndex + 1) % PROJECTS.length);
      if (e.key === 'ArrowLeft') fillDrawer((drawerIndex - 1 + PROJECTS.length) % PROJECTS.length);
    });
  }

  /* ── accordion ────────────────────────────────────────────── */
  function initAccordion() {
    var acc = $('#acc');
    if (!acc) return;
    var items = $$('.acc__item', acc);

    function panelOf(item) { return $('.acc__panel', item); }

    function setOpen(item, open) {
      var btn = $('.acc__btn', item);
      var panel = panelOf(item);
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      var target = open ? panel.firstElementChild.offsetHeight : 0;
      if (hasGSAP) {
        gsap.to(panel, { height: target, duration: reduce ? 0.01 : 0.55, ease: 'power3.inOut', overwrite: true });
      } else {
        panel.style.height = target + 'px';
      }
    }

    items.forEach(function (item) {
      var btn = $('.acc__btn', item);
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, willOpen);
      });
    });

    // initial open state
    items.forEach(function (item) {
      setOpen(item, item.classList.contains('is-open'));
    });

    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) {
          panelOf(item).style.height = 'auto';
          var h = panelOf(item).firstElementChild.offsetHeight;
          panelOf(item).style.height = h + 'px';
        }
      });
    });
  }

  /* ── studio tabs ──────────────────────────────────────────── */
  function initTabs() {
    var root = $('#studioTabs');
    if (!root) return;
    var btns = $$('.tabs__btn', root);
    var panels = $$('.tabs__panel', root);
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.id === btn.getAttribute('aria-controls'));
        });
        if (hasGSAP && !reduce) {
          var active = $('.tabs__panel.is-active', root);
          if (active) gsap.fromTo(active, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
        }
      });
    });
  }

  /* ── copy address ─────────────────────────────────────────── */
  function initCopy() {
    var btn = $('#copyMail');
    if (!btn) return;
    var label = $('#copyLabel');
    btn.addEventListener('click', function () {
      var mail = btn.dataset.mail;
      var done = function () {
        btn.classList.add('is-done');
        label.textContent = 'Copied';
        setTimeout(function () { btn.classList.remove('is-done'); label.textContent = 'Copy address'; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(done).catch(fallback);
      } else fallback();

      function fallback() {
        var ta = doc.createElement('textarea');
        ta.value = mail; ta.style.position = 'fixed'; ta.style.opacity = '0';
        doc.body.appendChild(ta); ta.select();
        try { doc.execCommand('copy'); done(); } catch (e) { label.textContent = mail; }
        doc.body.removeChild(ta);
      }
    });
  }

  /* ── brief form ───────────────────────────────────────────── */
  function initForm() {
    var form = $('#briefForm');
    if (!form) return;
    var note = $('#formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#fName').value.trim();
      var email = $('#fMail').value.trim();
      var msg = $('#fMsg').value.trim();
      var validMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      if (!name || !validMail) {
        note.textContent = 'A name and a valid email, please — everything else is optional.';
        note.classList.add('is-error'); note.classList.remove('is-ok');
        (!name ? $('#fName') : $('#fMail')).focus();
        return;
      }

      var subject = 'Project enquiry — ' + name;
      var body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + (msg || '(no brief yet)');
      var href = 'mailto:hello@theovarin.design?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Opening your mail app — the brief is pre-filled.';
      note.classList.remove('is-error'); note.classList.add('is-ok');
      window.location.href = href;
    });
    ['#fName', '#fMail', '#fMsg'].forEach(function (sel) {
      var el = $(sel);
      if (el) el.addEventListener('input', function () { note.classList.remove('is-error', 'is-ok'); note.textContent = 'Opens your mail app — nothing is stored here.'; });
    });
  }

  /* ── clocks ───────────────────────────────────────────────── */
  function initClocks() {
    var targets = ['#studioClock', '#footClock', '#menuClock'];
    function update() {
      var now = new Date();
      var opts = { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' };
      var time;
      try { time = new Intl.DateTimeFormat('en-GB', opts).format(now); }
      catch (e) { time = now.toTimeString().slice(0, 5) + ' local'; }
      targets.forEach(function (sel) {
        var el = $(sel);
        if (!el) return;
        el.textContent = el.id === 'studioClock' ? time.replace(' GMT+1', '').replace(' CET', '') + ' local' : 'Europe/Paris ' + time;
      });
    }
    update();
    setInterval(update, 30000);
  }

  /* ── live rig readout ─────────────────────────────────────── */
  function initReadout() {
    var fps = $('#roFps'), morph = $('#roMorph'), bar = $('#roBar'), chapter = $('#roChapter'), verts = $('#roVerts');
    if (verts) verts.textContent = window.innerWidth < 760 ? '3 146' : '6 407';
    var idxMap = { hero: '00 / 05', approach: '01 / 05', work: '02 / 05', expertise: '03 / 05', studio: '04 / 05', contact: '05 / 05' };
    setInterval(function () {
      var ch = doc.body.dataset.chapter || 'hero';
      if (fps && window.RIG) fps.textContent = window.RIG.fps;
      if (morph) morph.textContent = CHAPTER_MORPH[ch] || 'Pebble';
      if (chapter) chapter.textContent = idxMap[ch] || '00 / 05';
      if (bar) bar.style.width = ({ hero: 18, approach: 38, work: 55, expertise: 72, studio: 84, contact: 96 }[ch] || 18) + '%';
    }, 700);
  }

  /* ── boot ─────────────────────────────────────────────────── */
  function boot() {
    initLoader();
    initScroll();
    initSplitReveals();
    initAnchors();
    initPointer();
    initHeader();
    initMenu();
    initDrawer();
    initAccordion();
    initTabs();
    initCopy();
    initForm();
    initClocks();
    initReadout();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
