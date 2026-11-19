/* ═══════════════════════════════════════════════════════════════════════
   GRID RELIEF — interface layer
   loader · reveals · case-study index + drawer · clock · modes · cursor
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ══════════════ data ══════════════ */

  var PROJECTS = [
    {
      id: 'atrium', num: '01', title: 'ATRIUM', sub: 'Concrete Instruments — a sonic pavilion',
      disc: 'SPATIAL / SOUND', year: '2026', client: 'Kunsthalle Nord, Hamburg',
      team: '3 designers, 1 acoustician',
      img: './assets/photos/img_dfa815648363.webp',
      img2: './assets/photos/img_37526070297c.webp',
      thumb: './assets/photos/img_dfa815648363.webp',
      cap: 'PANEL PROTOTYPE / HAMBURG', cap2: 'THE HALL, AFTER TUNING',
      alt1: 'Monochrome concrete spiral ramp seen from below',
      alt2: 'Long grey exhibition corridor',
      text: [
        'Kunsthalle Nord wanted a room that could hold an orchestra without looking like a concert hall. The building already had a courtyard; the brief was to make it audible without putting a roof on it.',
        'We cast nine concrete panels of different porosities and hung them from a steel gantry, each one tuned to a frequency band. A live interface — the same object you are looking at, in another life — lets the curator move the panels between two acoustic states: dry and drowned.',
        'The pavilion opened in March. Visitors tend to walk in quietly and leave loud, which is roughly the effect we were after.'
      ],
      deliv: ['SPATIAL CONCEPT', 'ACOUSTIC PANEL SYSTEM', 'LIVE REVERB INTERFACE', 'WAYFINDING TYPE', 'ON-SITE SUPERVISION', 'DOCUMENTATION FILM']
    },
    {
      id: 'halo', num: '02', title: 'HALO', sub: 'A refractive operating system for Lumina Optics',
      disc: 'INTERFACE / WEBGL', year: '2025', client: 'Lumina Optics, Munich',
      team: '4 designers, 2 engineers',
      img: './assets/photos/img_51ec097943c6.webp',
      img2: './assets/photos/img_a83a8bd57fbe.webp',
      thumb: './assets/photos/img_51ec097943c6.webp',
      cap: 'LENS STACK / REAL-TIME PREVIEW', cap2: 'STUDY 12 — REFRACTION FIELD',
      alt1: 'Smeared rainbow light refracted through a lens',
      alt2: 'Soft gradient field of violet and cyan',
      text: [
        'Lumina’s lens-design software had 1,400 controls and no sense of light. Engineers could tell you the focal length of a stack, but not what it would look like to stand behind it.',
        'We rebuilt the workspace around a single live glass object. Every control is a physical property of that object — moving a slider bends it. The interface is the sample; the sample is the interface.',
        'Six months after launch, time-to-first-export fell from forty-one minutes to under four. Support tickets about the preview window: zero.'
      ],
      deliv: ['PRODUCT STRATEGY', 'REAL-TIME LENS PREVIEW', 'DESIGN SYSTEM', 'SHADER LIBRARY', 'ONBOARDING FLOW', 'MOTION SPEC']
    },
    {
      id: 'grid', num: '03', title: 'GRID', sub: 'Urban Signal — wayfinding for a district that keeps moving',
      disc: 'IDENTITY / SYSTEMS', year: '2024', client: 'Bezirk Mitte, Berlin',
      team: '3 designers, 1 type engineer',
      img: './assets/photos/img_d7d671e672a2.webp',
      img2: './assets/photos/img_c627a92ad1ab.webp',
      thumb: './assets/photos/img_d7d671e672a2.webp',
      cap: 'SIGN MOCK / LEIPZIGER STRASSE', cap2: 'TYPEFACE SPECIMEN',
      alt1: 'Black office towers disappearing into fog',
      alt2: 'Looking up at glass towers against a pale sky',
      text: [
        'A district that rebuilds itself every eighteen months cannot keep a fixed sign system. Mitte’s wayfinding was accurate in 2016 and wrong everywhere by 2022.',
        'We designed a twelve-column stencil alphabet with interchangeable inserts: the permanent information is cut into steel, the temporary information is slotted in and reprinted in-house. One template, 1,200 signs, no studio in the loop.',
        'The district now updates its own signage in an afternoon, which was the point and also, quietly, the hardest part to sell.'
      ],
      deliv: ['STENCIL TYPEFACE', 'SIGN SYSTEM / 1,200 UNITS', 'INSERT TEMPLATE', 'PRINT SPEC', 'CITY-WIDE AUDIT', 'MAINTENANCE MANUAL']
    },
    {
      id: 'device', num: '04', title: 'DEVICE', sub: 'Handheld MK II — a console for one game that does not exist',
      disc: 'PRODUCT / R&D', year: '2024', client: 'Self-initiated, Berlin',
      team: '2 designers, 1 firmware engineer',
      img: './assets/photos/img_9bc0b252726f.webp',
      img2: './assets/photos/img_4636190af475.webp',
      thumb: './assets/photos/img_9bc0b252726f.webp',
      cap: 'MK II / MILLED ALUMINIUM', cap2: 'BOARD REVISION 04',
      alt1: 'Retro handheld console with a small screen',
      alt2: 'Macro photograph of a circuit board',
      text: [
        'The studio’s own object: a console for one game that does not exist. It was meant as a week-long joke about hardware pitches and it took eleven months.',
        'Milled aluminium body, a 128×64 monochrome LCD, three buttons and a speaker that is louder than the battery deserves. The firmware simulates a game that is running slightly too fast, forever.',
        'Two hundred units were produced. They sold in nine days, and the waiting list is still open somewhere in a spreadsheet we keep avoiding.'
      ],
      deliv: ['INDUSTRIAL DESIGN', 'PCB / FIRMWARE', 'PACKAGING', 'TYPE + SCREEN UI', 'PRODUCTION RUN 200', 'WEB LAUNCH']
    },
    {
      id: 'terrain', num: '05', title: 'TERRAIN', sub: 'Aerial Atlas of the Baltic — 4,000 km of coastline, indexed',
      disc: 'DATA / CARTOGRAPHY', year: '2023', client: 'Baltic Institute of Coastal Research',
      team: '4 designers, 2 surveyors',
      img: './assets/photos/img_359e7d316be0.webp',
      img2: './assets/photos/img_924657c74fba.webp',
      thumb: './assets/photos/img_359e7d316be0.webp',
      cap: 'TILE 218 / SURF LINE', cap2: 'HEIGHT FIELD, 1:2000',
      alt1: 'Turquoise surf seen straight down from the air',
      alt2: 'Aerial view of a dry mountain ridge',
      text: [
        'Four thousand kilometres of coastline, measured by drones between 2019 and 2023, arrived as 61,000 photographs and no way to look at them.',
        'Each tile of the atlas is a live height field: drag a section and the coastline rebuilds itself at that resolution. The typography is deliberately boring — twelve sizes of one mono, because the map should be the loud part.',
        'The atlas is public, quarterly, and already used by three institutes to argue with each other about erosion.'
      ],
      deliv: ['DATA ARCHITECTURE', 'HEIGHT-FIELD VIEWER', 'ATLAS TYPE SYSTEM', 'PRINT EDITION / 320PP', 'PUBLIC API', 'LAUNCH CAMPAIGN']
    },
    {
      id: 'signal', num: '06', title: 'SIGNAL', sub: 'Museum of Failed Signals — a room for things that never arrived',
      disc: 'INSTALLATION', year: '2021', client: 'Funkhaus Berlin',
      team: '5 designers, 1 composer',
      img: './assets/photos/img_496dfbfc7564.webp',
      img2: './assets/photos/img_43490279c0fa.webp',
      thumb: './assets/photos/img_496dfbfc7564.webp',
      cap: 'HALL 3 / 60 CHANNELS', cap2: 'TRANSMISSION LOG, 1962—2021',
      alt1: 'Deep space field of stars and dust',
      alt2: 'Satellite view of city lights at night',
      text: [
        'The brief was one sentence: make a room for things that never arrived. We took it literally, which is the only way we know how to take a brief.',
        'Sixty speakers hang in a dark hall, each playing a message that was sent and never received — a distress call, a love letter, a number station counting to nothing. Their positions were generated from the actual transmission dates.',
        'It ran for eleven months. 140,000 people stood in the dark and waited for a message that had already failed.'
      ],
      deliv: ['CONCEPT / CURATION', 'SPATIAL AUDIO SYSTEM', '60-CHANNEL INSTALL', 'LIGHTING DESIGN', 'ARCHIVE RESEARCH', 'CATALOGUE']
    }
  ];

  /* ══════════════ clock / HUD ══════════════ */
  var clockEl = $('#hudClock');
  var contactClockEl = $('#contactClock');
  var tzName = 'CET';
  function tickClock() {
    var now = new Date();
    var t;
    try {
      t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(now);
      var off = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', timeZoneName: 'shortOffset' })
        .formatToParts(now).filter(function (p) { return p.type === 'timeZoneName'; })[0].value;
      tzName = /\+2/.test(off) ? 'CEST' : 'CET';
    } catch (e) {
      t = now.toTimeString().slice(0, 8);
    }
    if (clockEl) clockEl.textContent = t + ' ' + tzName;
    if (contactClockEl) contactClockEl.textContent = t + ' ' + tzName;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ══════════════ split reveal ══════════════ */
  function splitWords(el) {
    if (el.dataset.splitDone) return [];
    if (el.children.length) return null;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var out = [];
    words.forEach(function (w, i) {
      var wrap = document.createElement('span');
      wrap.className = 'w';
      wrap.style.display = 'inline-block';
      wrap.style.overflow = 'hidden';
      wrap.style.verticalAlign = 'top';
      var inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.display = 'inline-block';
      inner.textContent = w;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      out.push(inner);
    });
    el.dataset.splitDone = '1';
    return out;
  }

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduce) body.classList.add('reveal-ready');
  if (hasGsap && !reduce) gsap.set('[data-hero-line]', { yPercent: 112 });

  /* ══════════════ loader ══════════════ */
  var loader = $('#loader');
  var loadBar = $('#loadBar');
  var loadPct = $('#loadPct');
  var loadNote = $('#loadNote');
  var notes = ['LOADING VERTEX DATA', 'CASTING GEOMETRY', 'DRAWING THE ENVIRONMENT MAP', 'POLISHING 9,000 VERTICES', 'READY'];

  var progress = { v: 0 };
  function paint() {
    if (loadBar) loadBar.style.right = (100 - progress.v) + '%';
    if (loadPct) loadPct.textContent = String(Math.round(progress.v)).padStart(3, '0');
    if (loadNote) loadNote.textContent = notes[Math.min(notes.length - 1, Math.floor(progress.v / 25))];
  }

  function preload(urls) {
    return Promise.all(urls.map(function (u) {
      return new Promise(function (res) {
        var img = new Image();
        var done = false;
        var fin = function () { if (!done) { done = true; res(); } };
        img.onload = fin; img.onerror = fin;
        img.src = u;
        setTimeout(fin, 4000);
      });
    }));
  }

  var started = Date.now();
  function boot() {
    if (hasGsap) {
      gsap.set('.loader__word span', { yPercent: 110 });
      gsap.to('.loader__word span', {
        yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.028, delay: 0.05
      });
      gsap.to(progress, { v: 100, duration: 1.9, ease: 'power1.inOut', onUpdate: paint });
    } else {
      progress.v = 100; paint();
    }
  }

  var booted = false;
  function finishBoot() {
    if (booted) return;
    booted = true;
    body.setAttribute('data-ready', '1');
    var cv = document.getElementById('stage-canvas');
    if (cv) cv.style.opacity = '1';
    if (!reduce) body.classList.add('reveal-ready');

    var go = function () {
      loader.classList.add('is-out');
      var done = function () { loader.style.display = 'none'; };
      loader.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 1400);
      if (hasGsap) heroIn(gsap.timeline(), 0.22);
    };
    setTimeout(go, 120);
  }

  /* ══════════════ hero entrance ══════════════ */
  function heroIn(tl, at) {
    tl = tl || gsap.timeline();
    tl.to('[data-hero-line]', {
      yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.075
    }, at)
      .to('.kicker', { opacity: 1, duration: 0.5 }, at)
      .to('[data-reveal="up"]', {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08
      }, at + 0.25)
      .to('[data-reveal="fade"]', { opacity: 1, duration: 0.6, stagger: 0.05 }, at + 0.2)
      .fromTo('.stage',
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 1.25, ease: 'expo.out' }, at + 0.1)
      .fromTo('.stage__label, .stage__tick', { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.04 }, at + 0.7)
      .fromTo('.hero__rule', { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 1.1, ease: 'expo.out' }, at);
    return tl;
  }

  /* ══════════════ scroll reveals ══════════════ */
  function scrollReveals() {
    if (!hasGsap) {
      $$('[data-reveal]').forEach(function (e) { e.style.opacity = 1; });
      return;
    }

    $$('[data-split]').forEach(function (el) {
      var words = splitWords(el);
      if (!words) { gsap.set(el, { opacity: 0, y: 20 }); ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }); } }); return; }
      gsap.set(words, { yPercent: 112 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(words, {
            yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.035
          });
        }
      });
    });

    ScrollTrigger.batch('.row', {
      start: 'top 92%', once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.06 });
      }
    });

    ScrollTrigger.batch('.process__step', {
      start: 'top 90%', once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 });
      }
    });

    ScrollTrigger.batch('[data-reveal="up"]', {
      start: 'top 92%', once: true,
      onEnter: function (batch) {
        var list = batch.filter(function (el) { return !el.closest('.hero'); });
        if (list.length) gsap.to(list, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.06 });
      }
    });

    /* contact title lines */
    $$('.contact__title .line__in').forEach(function (el) {
      gsap.set(el, { yPercent: 112 });
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () { gsap.to(el, { yPercent: 0, duration: 1.15, ease: 'expo.out' }); }
      });
    });

    /* progress bar */
    ScrollTrigger.create({
      trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) {
        var bar = $('#progressBar');
        if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
      }
    });
  }

  /* ══════════════ hover preview ══════════════ */
  var preview = $('#preview');
  var previewImg = $('#previewImg');
  var previewNum = $('#previewNum');
  var previewMeta = $('#previewMeta');
  var mouse = { x: 0, y: 0 };
  var fol = { x: 0, y: 0 };
  var previewOn = false;
  var hoverIndex = 0;

  function floatLoop() {
    requestAnimationFrame(floatLoop);
    if (!previewOn) return;
    fol.x += (mouse.x - fol.x) * 0.14;
    fol.y += (mouse.y - fol.y) * 0.14;
    var rot = hoverIndex % 2 ? 1.8 : -2.4;
    preview.style.transform = 'translate3d(' + fol.x + 'px,' + fol.y + 'px,0) translate(-50%,-50%) rotate(' + rot + 'deg)';
  }
  requestAnimationFrame(floatLoop);

  function bindRows() {
    $$('.row').forEach(function (row, i) {
      var id = row.dataset.project;
      var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
      if (!p) return;

      row.addEventListener('pointerenter', function (e) {
        if (window.matchMedia('(hover: none)').matches) return;
        previewImg.src = p.thumb;
        previewImg.alt = p.alt1;
        previewNum.textContent = p.num;
        previewMeta.textContent = p.disc + ' — ' + p.year;
        hoverIndex = i;
        mouse.x = e.clientX; mouse.y = e.clientY;
        if (!previewOn) { fol.x = e.clientX; fol.y = e.clientY; }
        previewOn = true;
        preview.classList.add('is-on');
        preview.style.transform = 'translate3d(' + fol.x + 'px,' + fol.y + 'px,0) translate(-50%,-50%) rotate(0deg)';
      });

      row.addEventListener('pointerleave', function () {
        previewOn = false;
        preview.classList.remove('is-on');
      });

      var link = $('.row__link', row);
      if (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          openProject(id, link);
        });
      }
    });

    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });
  }

  /* ══════════════ drawer ══════════════ */
  var drawer = $('#drawer');
  var drawerPanel = $('#drawerPanel');
  var lastFocus = null;
  var currentIndex = 0;

  function fillDrawer(p, index) {
    currentIndex = index;
    var total = String(PROJECTS.length).padStart(2, '0');
    $('#drawerNum').textContent = p.num + ' / ' + total;
    $('#drawerTitle').textContent = p.title;
    $('#drawerSub').textContent = p.sub;
    $('#dClient').textContent = p.client;
    $('#dYear').textContent = p.year;
    $('#dDisc').textContent = p.disc;
    $('#dTeam').textContent = p.team;

    var img = $('#drawerImg');
    img.src = p.img; img.alt = p.alt1;
    $('#drawerCap').textContent = 'FIG. 01 — ' + p.cap;

    var img2 = $('#drawerImg2');
    img2.src = p.img2; img2.alt = p.alt2;
    $('#drawerCap2').textContent = 'FIG. 02 — ' + p.cap2;

    var text = $('#drawerText');
    text.innerHTML = '';
    p.text.forEach(function (t) {
      var par = document.createElement('p');
      par.textContent = t;
      text.appendChild(par);
    });

    var deliv = $('#drawerDeliv');
    deliv.innerHTML = '';
    p.deliv.forEach(function (d, i) {
      var li = document.createElement('li');
      var n = document.createElement('span');
      n.textContent = String(i + 1).padStart(2, '0');
      li.appendChild(n);
      li.appendChild(document.createTextNode(d));
      deliv.appendChild(li);
    });

    var next = PROJECTS[(index + 1) % PROJECTS.length];
    var nextBtn = $('#drawerNext');
    nextBtn.textContent = next.num + ' — ' + next.title + ' ↗';
    nextBtn.onclick = function () {
      var idx = PROJECTS.indexOf(next);
      fillDrawer(next, idx);
      drawerPanel.scrollTop = 0;
      if (history.replaceState) history.replaceState(null, '', '#project/' + next.id);
    };
  }

  function openProject(id, opener) {
    var index = -1;
    PROJECTS.forEach(function (p, i) { if (p.id === id) index = i; });
    if (index < 0) return;
    lastFocus = opener || document.activeElement;
    fillDrawer(PROJECTS[index], index);

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('drawer-open');
    drawerPanel.scrollTop = 0;
    if (history.replaceState) history.replaceState(null, '', '#project/' + id);

    if (hasGsap) {
      gsap.fromTo('.drawer__body > *', { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.045, delay: 0.18, overwrite: true
      });
    }
    setTimeout(function () { $('#drawerClose').focus({ preventScroll: true }); }, 80);
  }

  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('drawer-open');
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  if (drawer) {
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerScrim').addEventListener('click', closeDrawer);
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled])', drawer).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ══════════════ modes ══════════════ */
  function bindModes() {
    $$('[data-mode-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.dataset.modeSet;
        if (window.WD && window.WD.setMode) window.WD.setMode(m);
      });
    });
  }

  window.addEventListener('wd:mode', function (e) {
    var m = e.detail.mode;
    $$('[data-mode-set]').forEach(function (b) {
      var on = b.dataset.modeSet === m;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var lbl = $('#stageMode');
    if (lbl) lbl.textContent = e.detail.label;
    var mat = $('#specMat');
    if (mat) {
      mat.textContent = m === 'glass' ? 'GLASS / IOR 1.46'
        : m === 'wire' ? 'INK / WIREFRAME 0.82' : 'CHROME / ROUGH 0.19';
    }
  });

  /* ══════════════ telemetry ══════════════ */
  window.WD = window.WD || {};
  var lastForm = '';
  window.WD.telemetry = function (d) {
    var fmt = function (n) { return (n || 0).toLocaleString('en-US'); };
    var set = function (sel, val) { var el = $(sel); if (el && el.textContent !== val) el.textContent = val; };
    set('#stageVerts', fmt(window.WD.counts ? window.WD.counts.verts : 0) + ' VERT');
    set('#stageFrameB', d.fps + ' FPS');
    set('#specFps', d.fps + ' FPS');
    set('#specForm', d.form + ' / ' + (d.weight * 100).toFixed(0) + '%');
    set('#specVerts', fmt(window.WD.counts ? window.WD.counts.verts : 0));
    set('#specTris', fmt(window.WD.counts ? Math.round(window.WD.counts.tris) : 0));
    set('#specGpu', (window.WD.gpu || 'WEBGL').slice(0, 26));
  };

  window.addEventListener('wd:ready', function () {
    var c = window.WD.counts || { verts: 0, tris: 0 };
    var sv = $('#specVerts'), stt = $('#specTris'), sg = $('#specGpu');
    if (sv) sv.textContent = c.verts.toLocaleString('en-US');
    if (stt) stt.textContent = Math.round(c.tris).toLocaleString('en-US');
    if (sg && window.WD.gpu) sg.textContent = window.WD.gpu.slice(0, 26);
  });

  /* ══════════════ mobile menu ══════════════ */
  var menuBtn = $('#menuBtn');
  var menu = $('#menu');
  function closeMenu() {
    body.classList.remove('menu-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    if (menu) menu.setAttribute('aria-hidden', 'true');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ══════════════ HUD over the dark section ══════════════ */
  var contactSec = document.getElementById('contact');
  var darkTick = false;
  function syncDarkHud() {
    darkTick = false;
    if (!contactSec) return;
    var r = contactSec.getBoundingClientRect();
    body.classList.toggle('on-dark', r.top <= 64 && r.bottom > 64);
  }
  function queueDarkHud() { if (!darkTick) { darkTick = true; requestAnimationFrame(syncDarkHud); } }
  window.addEventListener('scroll', queueDarkHud, { passive: true });
  window.addEventListener('resize', queueDarkHud);
  syncDarkHud();

  /* ══════════════ keys ══════════════ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeMenu();
    }
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      var m = ['wire', 'solid', 'glass'][Number(e.key) - 1];
      if (window.WD && window.WD.setMode) window.WD.setMode(m);
    }
  });

  /* ══════════════ deep link ══════════════ */
  var hashOpened = false;
  function fromHash() {
    if (hashOpened) return;
    var m = /^#project\/([a-z]+)$/.exec(location.hash || '');
    if (m) {
      var p = PROJECTS.filter(function (x) { return x.id === m[1]; })[0];
      if (!p) return;
      hashOpened = true;
      setTimeout(function () { openProject(p.id, null); }, 1200);
    }
  }

  /* ══════════════ init ══════════════ */
  bindRows();
  bindModes();
  scrollReveals();

  var waitFonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  boot();
  preload(PROJECTS.map(function (p) { return p.thumb; }));
  /* the fonts are inlined, so the boot never needs to wait on the network */
  setTimeout(finishBoot, 1300);

  window.addEventListener('load', function () {
    if (Date.now() - started > 6000) finishBoot();
    fromHash();
  });
  if (document.readyState === 'complete') fromHash();

  /* refresh triggers once fonts land (metrics shift) */
  if (hasGsap) {
    waitFonts.then(function () { setTimeout(function () { ScrollTrigger.refresh(); }, 400); });
    window.addEventListener('load', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 600); });
  }
})();
