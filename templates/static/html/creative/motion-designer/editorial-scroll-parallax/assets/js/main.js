/* ============================================================
   Editorial Motion Studio — portfolio study
   GSAP + ScrollTrigger · kinetic type · parallax case studies
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ==========================================================
     CONTENT
     ========================================================== */
  var PROJECTS = [
    {
      id: 'google', n: '01', menu: 'Google & Gemini',
      title: 'Google & Gemini Rebrand',
      sub: 'New era, new energy',
      client: 'Google Creative Lab', year: '2025',
      role: 'Design direction · Identity · Motion',
      team: '6 designers, 2 motion, 1 writer',
      pills: ['Rebrand', 'Strategy', 'Mark Design'],
      ar: 0.78,
      img: './assets/photos/img_fae571b6a101.webp', img2: './assets/photos/img_364ed4de02c1.webp',
      alt: 'Two glass prisms on a dark grey field, light breaking through the crystal',
      lead: 'Gemini arrived as a model, not as a brand. The work was to give it a body — a mark that could hold a billboard, a sweater and a phone screen and still read as one idea.',
      body1: 'We started from the spiral: a single line turning on itself. At billboard scale it reads as orbit; up close it behaves like a lens. The identity runs on a twelve-column grid, one grotesque, and a palette that stays out of the product\u2019s way.',
      body2: 'The launch included a limited knitwear drop for the lab\u2019s open studio — the softest possible proof of a software brand, and the first time the mark was worn instead of displayed.',
      quote: 'A mark good enough to wear.'
    },
    {
      id: 'uniball', n: '02', menu: 'Uniball Pen',
      title: 'Uniball Brand Refreshment',
      sub: 'Legacy Refined',
      client: 'Uniball', year: '2024',
      role: 'Brand design · E-commerce · 3D prototype',
      team: '4 designers, 2 engineers',
      pills: ['Rebrand', 'E-Com', '3D Prototype'],
      ar: 1.22,
      img: './assets/photos/img_9c61870c11f9.webp', img2: './assets/photos/img_680e295ce3fe.webp',
      alt: 'A silver fountain pen resting on a handwritten page',
      lead: 'Uniball has lived in people\u2019s hands for forty years. The refresh keeps the ink and rebuilds everything around it.',
      body1: 'The nib became the logo\u2019s anchor point. The cap band became a colour system. On the storefront we rebuilt the product page around one continuous line: draw it, buy it, see where the ink went.',
      body2: 'Packaging was prototyped in 3D before a single box was printed, so the studio could look at the shelf the way a shopper does — from a metre away, for four seconds.',
      quote: 'Legacy is a material, not a constraint.'
    },
    {
      id: 'cosmos', n: '03', menu: 'Cosmos',
      title: 'Cosmos Mountain Bike',
      sub: 'Mechanical Rawness',
      client: 'Cosmos', year: '2024',
      role: 'Identity · Typeface · Art direction',
      team: '3 designers, 1 photographer',
      pills: ['Branding', 'Typeface', 'Logo Design'],
      ar: 0.86,
      img: './assets/photos/img_046bf225d3fa.webp', img2: './assets/photos/img_32af77c8efd8.webp',
      alt: 'A black hardtail mountain bike parked on a desert trail at dusk',
      lead: 'Cosmos builds frames that show their welds. The brand had to do the same.',
      body1: 'We shot the bikes like jewellery — raking light, black field, no lifestyle gloss — and drew a typeface with a cut through the stems, the way the frame has a cut through its tubes.',
      body2: 'The system covers the mark, the type, the spec sheets and the dealer wall. Everything is measured in millimetres, because the riders measure in millimetres.',
      quote: 'Mechanical rawness, kept precise.'
    },
    {
      id: 'mac', n: '04', menu: 'M\u00b7A\u00b7C',
      title: 'M\u00b7A\u00b7C Cosmetics Dot Com',
      sub: 'Color Authority',
      client: 'M\u00b7A\u00b7C Cosmetics', year: '2023',
      role: 'UI system · Kinetic type · Commerce',
      team: '8 designers, 5 engineers',
      pills: ['E-Com', 'UI System', 'Kinetic Type'],
      ar: 1.32,
      img: './assets/photos/img_70c7ddca341f.webp', img2: './assets/photos/img_c32649b934ce.webp',
      alt: 'A single red lipstick standing on a black field',
      lead: 'M\u00b7A\u00b7C sells colour authority. The old commerce experience made customers hunt for it.',
      body1: 'We rebuilt the dot com around a single tile: one product, one swatch, one price. Headlines shift weight as you scroll — a nod to the way a shade looks different in different light.',
      body2: 'The UI ships as forty-two documented components, with the colour engine exposing every finish as a token so a new shade needs no new design work.',
      quote: 'Colour first, checkout second.'
    },
    {
      id: 'beats', n: '05', menu: 'Beats by Dre.',
      title: 'Beats In-Store Display',
      sub: 'Digital Simulation',
      client: 'Beats by Dre.', year: '2023',
      role: 'UI system · Storytelling · Product design',
      team: '5 designers, 2 technologists',
      pills: ['Storytelling', 'UI System', 'Product Design'],
      ar: 1.12,
      img: './assets/photos/img_bed9218acd39.webp', img2: './assets/photos/img_e21cc028cb29.webp',
      alt: 'Black over-ear headphones resting on a dark surface',
      lead: 'A display has four seconds and no sound. The system had to sell the headphone before anyone touched it.',
      body1: 'We simulated the store in 3D to test sightlines from the entrance, then wrote a silent story — a waveform, a face, a lyric — on a loop that never quite repeats.',
      body2: 'Fielded in 240 stores, with a component library the retail team can re-cut per market without calling us.',
      quote: 'Silence, staged.'
    },
    {
      id: 'salesforce', n: '06', menu: 'Salesforce',
      title: 'Salesforce Platform',
      sub: 'Streaming For Career Growth',
      client: 'Salesforce', year: '2022',
      role: 'Product design · Component library · Strategy',
      team: '9 designers, 6 engineers',
      pills: ['Product Design', 'UI Component Library', 'Product Strategy'],
      ar: 0.92,
      img: './assets/photos/img_d09940b84e90.webp', img2: './assets/photos/img_d3f4f2bcdca5.webp',
      alt: 'Faceted blue glass catching light against black',
      lead: 'Salesforce\u2019s product had grown faster than its vocabulary. The platform needed one language across a hundred surfaces.',
      body1: 'We mapped the journeys, thinned the component library to sixty primitives, and wrote a motion spec that describes how data arrives rather than how it looks.',
      body2: 'The result streams: career paths, skill graphs and progress in a single visual grammar that engineering could ship without interpretation.',
      quote: 'One grammar, every surface.'
    }
  ];

  /* ==========================================================
     BUILD
     ========================================================== */
  var projectsEl = $('#projects');
  projectsEl.innerHTML = PROJECTS.map(function (p, i) {
    return '' +
      '<article class="project' + (i % 2 ? ' rev' : '') + '" id="' + p.id + '" data-id="' + p.id + '">' +
        '<div class="p-info">' +
          '<div class="p-top"><span class="p-num">' + p.n + '</span><span class="p-year">' + p.year + '</span></div>' +
          '<h2 class="p-title">' + p.title + '</h2>' +
          '<p class="p-sub">' + p.sub + '</p>' +
          '<ul class="p-pills">' + p.pills.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
          '<button class="p-open" data-open="' + p.id + '" data-cursor="View case study"><span>View case study</span><i>&#8599;</i></button>' +
        '</div>' +
        '<figure class="p-media" data-open="' + p.id + '" data-cursor="Email me for more" style="--ar:' + p.ar + '">' +
          '<div class="media-inner"><img src="' + p.img + '" alt="' + p.alt + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async"></div>' +
          '<figcaption><span>' + p.client + '</span><span>' + p.sub + '</span></figcaption>' +
        '</figure>' +
      '</article>';
  }).join('');

  /* menu ---------------------------------------------------- */
  var MENU = [
    { label: 'Email Me', meta: 'Say hello', href: 'mailto:hello@example.com' }
  ].concat(PROJECTS.filter(function (p) { return p.id !== 'google'; }).map(function (p) {
    return { label: p.menu, meta: p.sub, goto: p.id };
  })).concat([
    { label: 'Archive', meta: '2018 \u2014 2025', goto: 'archive' }
  ]);

  $('#menuList').innerHTML = MENU.map(function (m, i) {
    var inner = '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="lbl">' + m.label + '</span>' +
      '<em>' + m.meta + '</em>';
    if (m.href) {
      return '<a class="menu-item" href="' + m.href + '">' + inner + '</a>';
    }
    return '<a class="menu-item" href="#' + m.goto + '" data-goto="' + m.goto + '">' + inner + '</a>';
  }).join('');

  /* progress rail ------------------------------------------- */
  var SECTIONS = [
    { id: 'hero', label: 'Intro' },
    { id: 'about', label: 'About' },
    { id: 'work', label: 'Work' },
    { id: 'archive', label: 'Archive' },
    { id: 'contact', label: 'Contact' }
  ];
  var rail = $('#rail');
  rail.innerHTML = SECTIONS.map(function (s) {
    return '<button data-goto="' + s.id + '" aria-label="Go to ' + s.label + '"></button>';
  }).join('');

  /* ==========================================================
     HELPERS
     ========================================================== */
  function scrollToId(id) {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    var el = document.getElementById(id);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-goto]');
    if (go) {
      e.preventDefault();
      if (document.body.classList.contains('menu-open')) {
        closeMenu();
        setTimeout(function () { scrollToId(go.dataset.goto); }, 420);
      } else {
        scrollToId(go.dataset.goto);
      }
      return;
    }
    var open = e.target.closest('[data-open]');
    if (open) {
      openCase(open.dataset.open);
    }
  });

  /* ==========================================================
     CURSOR
     ========================================================== */
  (function cursor() {
    if (!canHover) return;
    var el = $('#cursor');
    var label = $('.cursor-label', el);
    el.classList.add('on');
    document.documentElement.classList.add('has-cursor');
    var xTo = gsap.quickTo(el, 'x', { duration: 0.36, ease: 'power3' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.36, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { xTo(e.clientX); yTo(e.clientY); });
    window.addEventListener('mousedown', function () { el.classList.add('is-down'); });
    window.addEventListener('mouseup', function () { el.classList.remove('is-down'); });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('[data-cursor]');
      if (t) {
        label.textContent = t.getAttribute('data-cursor');
        el.classList.add('has-label');
      } else if (!e.target.closest('a, button')) {
        el.classList.remove('has-label');
      }
    });
    document.addEventListener('mouseout', function (e) {
      var t = e.target.closest('[data-cursor]');
      if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) el.classList.remove('has-label');
    });
  })();

  /* ==========================================================
     LOADER + HERO INTRO
     ========================================================== */
  function heroIntro() {
    var lines = $$('.hero-type .line-inner');
    if (reduced) {
      gsap.set('.hdr-mark', { opacity: 1, y: 0 });
      return;
    }
    gsap.set(lines, { yPercent: 108 });
    gsap.to(lines, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.085, delay: 0.05 });
    gsap.fromTo('.rail button', { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.6 });
  }

  var loadState = { v: 0 };
  var loaderDone = false;
  function runLoader() {
    if (loaderDone) return;
    loaderDone = true;
    var pctEl = $('#loadPct'), barEl = $('#loadBar');
    var tl = gsap.timeline();
    tl.to(loadState, {
      v: 100, duration: reduced ? 0.2 : 1.15, ease: 'power2.inOut',
      onUpdate: function () {
        var v = Math.round(loadState.v);
        pctEl.textContent = v;
        barEl.style.width = v + '%';
      }
    })
      .to('#loader', { yPercent: -100, duration: reduced ? 0.01 : 0.95, ease: 'expo.inOut' }, '+=0.12')
      .set('#loader', { display: 'none' })
      .add(heroIntro, reduced ? 0 : '-=0.5');
  }

  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1400); })])
      .then(function () { setTimeout(runLoader, 150); });
  } else {
    setTimeout(runLoader, 350);
  }
  // safety net
  setTimeout(runLoader, 3200);

  /* ==========================================================
     HERO MORPH  (giant type shrinks into the fixed wordmark)
     ========================================================== */
  function initHero() {
    var typeEl = $('#heroType');
    var mark = $('.hdr-mark');
    if (reduced) {
      gsap.set('.hdr-mark', { opacity: 1, y: 0 });
      return;
    }

    function target() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var h = typeEl.offsetHeight;
      var mr = mark.getBoundingClientRect();
      return {
        scale: Math.max(0.02, mr.height / h),
        x: (mr.left + mr.width / 2) - vw / 2,
        y: (mr.top + mr.height / 2) - vh / 2
      };
    }

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });

    tl.to(typeEl, {
      x: function () { return target().x; },
      y: function () { return target().y; },
      scale: function () { return target().scale; },
      duration: 1
    }, 0)
      .to('.hero-fade', { opacity: 0, duration: 0.2 }, 0.04)
      .to(typeEl, { filter: 'blur(7px)', duration: 0.4 }, 0.5)
      .to(typeEl, { opacity: 0, duration: 0.09 }, 0.88)
      .to(mark, { opacity: 1, y: 0, duration: 0.09 }, 0.88);
  }

  /* ==========================================================
     BIO — word-by-word scroll reveal
     ========================================================== */
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
          var s = document.createElement('span');
          s.className = 'w';
          s.textContent = tok;
          frag.appendChild(s);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && !n.classList.contains('bio-link')) {
        splitWords(n);
      }
    });
  }

  function initBio() {
    var bio = $('#bioText');
    splitWords(bio);
    var words = $$('.w', bio);
    if (reduced) {
      words.forEach(function (w) { w.classList.add('hot'); });
      return;
    }
    ScrollTrigger.create({
      trigger: bio,
      start: 'top 84%',
      end: 'bottom 58%',
      scrub: true,
      onUpdate: function (self) {
        var n = Math.ceil(self.progress * (words.length + 4));
        words.forEach(function (w, i) { w.classList.toggle('hot', i < n); });
      }
    });
    gsap.from('.emoji', {
      scale: 0.4, opacity: 0, duration: 1, ease: 'back.out(2)', stagger: 0.06,
      scrollTrigger: { trigger: '#emojiStrip', start: 'top 88%' }
    });
    gsap.from('.bio-foot .bio-cell', {
      y: 20, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.bio-foot', start: 'top 92%' }
    });
  }

  /* ==========================================================
     EMOJI STRIP — spring hover
     ========================================================== */
  function initEmoji() {
    $$('.emoji').forEach(function (chip) {
      var inner = { x: 0, y: 0 };
      chip.addEventListener('mouseenter', function () {
        if (reduced) return;
        gsap.to(chip, {
          scale: 1.22,
          y: -9,
          rotate: gsap.utils.random(-14, 14),
          duration: 0.9,
          ease: 'elastic.out(1, 0.42)',
          overwrite: 'auto'
        });
      });
      chip.addEventListener('mouseleave', function () {
        if (reduced) return;
        gsap.to(chip, { scale: 1, y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
      });
      chip.addEventListener('click', function () {
        if (reduced) return;
        gsap.fromTo(chip, { scale: 1.35, rotate: gsap.utils.random(-20, 20) },
          { scale: 1, rotate: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
        // little emoji burst
        for (var i = 0; i < 5; i++) {
          var b = document.createElement('span');
          b.textContent = chip.dataset.emoji;
          b.style.cssText = 'position:fixed;z-index:230;pointer-events:none;font-size:16px;left:0;top:0';
          document.body.appendChild(b);
          var r = chip.getBoundingClientRect();
          gsap.set(b, { x: r.left + r.width / 2, y: r.top + r.height / 2, scale: 1 });
          gsap.to(b, {
            x: r.left + r.width / 2 + gsap.utils.random(-120, 120),
            y: r.top + r.height / 2 + gsap.utils.random(-140, -20),
            opacity: 0, scale: gsap.utils.random(0.6, 1.4), rotate: gsap.utils.random(-90, 90),
            duration: gsap.utils.random(0.7, 1.2), ease: 'power2.out',
            onComplete: function () { b.remove(); }
          });
        }
      });
    });
  }

  /* ==========================================================
     MARQUEE
     ========================================================== */
  function initMarquee() {
    var track = $('#marqueeTrack');
    if (!track) return;
    var tween = gsap.to(track, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    if (!reduced) {
      ScrollTrigger.create({
        trigger: '.marquee',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: function (self) {
          tween.timeScale(1 + Math.min(4, Math.abs(self.getVelocity()) / 900));
        }
      });
    }
  }

  /* ==========================================================
     PROJECTS
     ========================================================== */
  function initProjects() {
    $$('.project').forEach(function (proj) {
      var media = $('.media-inner', proj);
      var img = $('img', media);
      var info = $$('.p-info > *', proj);
      var title = $('.p-title', proj);

      gsap.set(img, { scale: 1.06 });

      if (!reduced) {
        gsap.fromTo(media, { clipPath: 'inset(0% 0% 100% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: proj, start: 'top 76%' }
        });
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: proj, start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.from(info, {
          y: 40, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.07,
          scrollTrigger: { trigger: proj, start: 'top 72%' }
        });
        gsap.to(title, {
          yPercent: -14,
          ease: 'none',
          scrollTrigger: { trigger: proj, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }

      if (!canHover || reduced) return;

      /* hover tilt + zoom */
      var rx = gsap.quickTo(media, 'rotationX', { duration: 0.8, ease: 'power3' });
      var ry = gsap.quickTo(media, 'rotationY', { duration: 0.8, ease: 'power3' });
      var sc = gsap.quickTo(img, 'scale', { duration: 1.0, ease: 'power3' });

      media.addEventListener('mousemove', function (e) {
        var r = media.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * 7);
        ry(px * 9);
      });
      media.addEventListener('mouseenter', function () {
        sc(1.12);
        gsap.to(title, { color: '#ffffff', duration: 0.5 });
        gsap.to(proj.querySelector('.p-media'), { boxShadow: '0 40px 120px rgba(0,0,0,.6)', duration: 0.6 });
      });
      media.addEventListener('mouseleave', function () {
        rx(0); ry(0); sc(1.06);
        gsap.to(title, { color: '', duration: 0.5 });
        gsap.to(proj.querySelector('.p-media'), { boxShadow: 'none', duration: 0.6 });
      });
    });
  }

  /* ==========================================================
     RAIL STATE
     ========================================================== */
  function initRail() {
    var btns = $$('#rail button');
    SECTIONS.forEach(function (s, i) {
      ScrollTrigger.create({
        trigger: '#' + s.id,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: function (self) {
          if (self.isActive) {
            btns.forEach(function (b, j) { b.classList.toggle('is-active', j === i); });
          }
        }
      });
    });
    btns[0].classList.add('is-active');
  }

  /* ==========================================================
     FOOTER
     ========================================================== */
  function initFooter() {
    if (!reduced) {
      gsap.from('.foot-big .l', {
        yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: '.foot-big', start: 'top 85%' }
      });
      gsap.from('.foot-contact, .foot-bottom', {
        y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: '.foot-contact', start: 'top 92%' }
      });
    }
    var face = $('#footFace');
    face.addEventListener('click', function () {
      if (reduced) return;
      gsap.to(face, { rotate: '+=360', scale: 1.15, duration: 1.1, ease: 'elastic.out(1, 0.4)' })
        .to(face, { scale: 1, duration: 0.4 }, '-=0.3');
    });
    $('#resumeBtn').addEventListener('click', openResume);
    $('#archiveBtn').addEventListener('click', openArchive);
  }

  /* ==========================================================
     MODAL
     ========================================================== */
  var modal = $('#modal');
  var modalPanel = $('#modalPanel');
  var modalBg = $('#modalBg');
  var modalScroll = $('#modalScroll');
  var modalContent = $('#modalContent');
  var modalClose = $('#modalClose');
  var modalOpen = false;

  function showModal() {
    modalOpen = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    modalScroll.scrollTop = 0;
    if (!reduced) {
      gsap.fromTo(modalBg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(modalPanel, { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.95, ease: 'expo.out', delay: 0.04 });
      gsap.fromTo('#modalContent > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
    }
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    var done = function () {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lock');
      modalContent.innerHTML = '';
    };
    if (reduced) { done(); return; }
    gsap.to(modalPanel, { y: 40, opacity: 0, duration: 0.4, ease: 'power3.in' });
    gsap.to(modalBg, { opacity: 0, duration: 0.45, delay: 0.1, onComplete: done });
  }

  modalClose.addEventListener('click', closeModal);
  modalBg.addEventListener('click', closeModal);

  function openCase(id) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var i = PROJECTS.indexOf(p);
    var next = PROJECTS[(i + 1) % PROJECTS.length];

    $('#modalKicker').textContent = 'Case Study \u2014 ' + p.n + ' / 06';
    modalContent.innerHTML = '' +
      '<h2 class="m-title">' + p.title + '</h2>' +
      '<p class="m-sub">' + p.sub + '</p>' +
      '<div class="m-pills">' + p.pills.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
      '<figure class="m-hero"><img src="' + p.img + '" alt="' + p.alt + '"></figure>' +
      '<div class="m-grid">' +
        '<div class="m-body">' +
          '<p>' + p.lead + '</p>' +
          '<p>' + p.body1 + '</p>' +
          '<p>' + p.body2 + '</p>' +
          '<blockquote class="m-quote">' + p.quote + '</blockquote>' +
        '</div>' +
        '<dl class="m-meta">' +
          '<div><dt>Client</dt><dd>' + p.client + '</dd></div>' +
          '<div><dt>Year</dt><dd>' + p.year + '</dd></div>' +
          '<div><dt>Role</dt><dd>' + p.role + '</dd></div>' +
          '<div><dt>Team</dt><dd>' + p.team + '</dd></div>' +
          '<div><dt>Deliverables</dt><dd>' + p.pills.join(', ') + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<figure class="m-second"><img src="' + p.img2 + '" alt="" loading="lazy"></figure>' +
      '<div class="m-next">' +
        '<span class="mono-label">Next project</span>' +
        '<button data-open="' + next.id + '"><span>' + next.title + '</span><i>&#8594;</i></button>' +
      '</div>';
    showModal();
  }

  function openArchive() {
    $('#modalKicker').textContent = 'Archive \u2014 2018 / 2025';
    var items = PROJECTS.map(function (p) {
      return '<button class="arc-item" data-open="' + p.id + '"><img src="' + p.img2 + '" alt="" loading="lazy"><span>' + p.title + '</span></button>';
    }).join('');
    modalContent.innerHTML = '' +
      '<h2 class="m-title">Archive</h2>' +
      '<p class="m-sub">Outtakes, side quests and the frames that did not make the case studies.</p>' +
      '<div class="arc-grid">' + items + items + '</div>';
    showModal();
  }

  function openResume() {
    $('#modalKicker').textContent = 'Resume \u2014 sample content';
    var rows = [
      ['2023 \u2014 now', 'Designer', 'Google Creative Lab'],
      ['2021 \u2014 2023', 'Senior Designer', 'Instrument'],
      ['2020 \u2014 2021', 'Designer', 'Monks'],
      ['2019 \u2014 2020', 'Interaction Designer', 'Firstborn'],
      ['2018 \u2014 2019', 'Product Designer', 'Work & Co'],
      ['2016 \u2014 2018', 'Art Director', 'Apple Marcom']
    ].map(function (r) {
      return '<div class="res-row"><span class="yr">' + r[0] + '</span><span class="role">' + r[1] + '</span><span class="org">' + r[2] + '</span></div>';
    }).join('');

    modalContent.innerHTML = '' +
      '<h2 class="m-title">Editorial Motion Studio</h2>' +
      '<p class="m-sub">Graphic, Interactive, 3D and Motion Designer \u2014 Brooklyn, NY</p>' +
      '<div class="m-grid">' +
        '<div class="m-body">' +
          '<p>Designer working between brand and product: identity systems, motion languages, and interfaces that survive being shipped.</p>' +
          '<p>Currently at Google Creative Lab. Previously with Apple Marcom, Instrument, Monks, Firstborn and Work &amp; Co. MFA from RISD.</p>' +
          '<p class="mono-label">Sample r\u00e9sum\u00e9 written for this study \u2014 dates are illustrative.</p>' +
        '</div>' +
        '<dl class="m-meta">' +
          '<div><dt>Contact</dt><dd><a href="mailto:hello@example.com">hello@example.com</a></dd></div>' +
          '<div><dt>Education</dt><dd>MFA, Rhode Island School of Design</dd></div>' +
          '<div><dt>Recognition</dt><dd>Awwwards Honorable Mention, 2025</dd></div>' +
          '<div><dt>Focus</dt><dd>Identity, Motion, 3D, Product</dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="res-list">' + rows + '</div>' +
      '<div class="m-next"><span class="mono-label">Availability</span><button data-open="google"><span>See the work</span><i>&#8594;</i></button></div>';
    showModal();
  }

  /* ==========================================================
     MENU
     ========================================================== */
  var menu = $('#menu');
  var menuBtn = $('#menuBtn');
  var menuClose = $('#menuClose');

  function openMenu() {
    document.body.classList.add('menu-open', 'lock');
    menu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    if (!reduced) {
      gsap.fromTo('.menu-panel', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo('.menu-item', { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.85, ease: 'expo.out', stagger: 0.055, delay: 0.1
      });
      gsap.fromTo('.menu-ghost', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1.2, ease: 'expo.out' });
    }
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('lock');
    if (!reduced) gsap.set('.menu-item', { clearProps: 'all' });
  }

  menuBtn.addEventListener('click', function () {
    if (document.body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  });
  menuClose.addEventListener('click', closeMenu);

  /* ==========================================================
     KEYS
     ========================================================== */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modalOpen) closeModal();
    else if (document.body.classList.contains('menu-open')) closeMenu();
  });

  /* ==========================================================
     INIT
     ========================================================== */
  initHero();
  initBio();
  initEmoji();
  initMarquee();
  initProjects();
  initRail();
  initFooter();

  // keep ScrollTrigger honest after fonts / images settle
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('resize', function () { ScrollTrigger.refresh(); });
})();
