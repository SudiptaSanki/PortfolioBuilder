/* =========================================================
   MAIN — motion, HUD, guided journey across eight biomes.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------------------------------------------------
     CONTENT — eight artifacts, eight chapters
     --------------------------------------------------------- */

  var Q = '?auto=format&fit=crop&w=1200&q=75';

  var DATA = [
    {
      code: 'A-01', name: 'Bubblemaps', kicker: 'Data visualisation · 2026 — now',
      img: './assets/photos/img_d09940b84e90.webp',
      img2: './assets/photos/img_c3fd157d7c7a.webp',
      cap: 'Reference texture — crystalline structure, 4K.',
      meta: [['Role', 'Lead Frontend Engineer'], ['Period', '2026 — now'], ['Base', 'Paris'], ['Stack', 'React · Three.js · GLSL']],
      prose: [
        'Bubblemaps turns a token’s holder list into a readable map of influence. I lead the frontend, where the job is to keep a graph of hundreds of thousands of wallets legible — and honest — while it moves in real time.',
        'Most of the work is not drawing. It is deciding what to leave out, then making the WebGL layer fast enough that the answer arrives before the question does.'
      ],
      notes: [
        'Lead frontend engineer since March 2026, Paris.',
        'Cluster and influence views for on-chain holders.',
        'Frame budget first: instancing, level of detail, a hard cap on animated elements.'
      ],
      tags: ['WebGL', 'Data viz', 'React', 'Real-time']
    },
    {
      code: 'A-02', name: 'Dogamí', kicker: 'Game economy · 2023 — 2025',
      img: './assets/photos/img_364ed4de02c1.webp',
      img2: './assets/photos/img_a05d1e002413.webp',
      cap: 'Reference texture — refracted light, chromatic split.',
      meta: [['Role', 'Fullstack & Blockchain'], ['Period', '2023 — 2025'], ['Base', 'Paris'], ['Stack', 'Solidity · React · Node']],
      prose: [
        'A pet-raising universe that lives on-chain: I worked the fullstack line between smart contracts and what a player actually sees. Minting, wallet sessions, the economy screens — the parts that must never lose someone’s pet.',
        'The chapter I am proudest of is the quiet one: moving the game from Tezos to Polygon without asking players to understand what changed.'
      ],
      notes: [
        'Fullstack & blockchain engineer, 2023 — 2025.',
        'Tezos → Polygon migration of in-game assets.',
        'Wallet and session infrastructure across web and mobile builds.'
      ],
      tags: ['Web3', 'Gaming', 'Smart contracts', 'Migration']
    },
    {
      code: 'A-03', name: 'CoinsPaid', kicker: 'Tokenised real estate · 2022 — 2023',
      img: './assets/photos/img_d3f4f2bcdca5.webp',
      img2: './assets/photos/img_dfa815648363.webp',
      cap: 'Reference texture — repeated modular shell.',
      meta: [['Role', 'Lead Fullstack'], ['Period', '2022 — 2023'], ['Base', 'Tallinn'], ['Stack', 'React · Node · TypeScript']],
      prose: [
        'Lead of four on a marketplace that turns property into fractions. I set the frontend architecture in React and the service boundaries behind it in Node and TypeScript, with CI/CD and Docker from the first commit.',
        'Latency and reliability were not polish here; they were the product. A marketplace that hesitates on an investment screen loses the room.'
      ],
      notes: [
        'Led a team of four from kick-off.',
        'React frontend architecture; Node microservices with CI/CD and Docker.',
        'Unit tests in Jest, end-to-end in Puppeteer.'
      ],
      tags: ['Marketplace', 'Microservices', 'Fintech', 'Leadership']
    },
    {
      code: 'A-04', name: 'Pasokon Studio', kicker: 'Creative development · 2021 — now',
      img: './assets/photos/img_f51db3f9e033.webp',
      img2: './assets/photos/img_680e295ce3fe.webp',
      cap: 'Reference texture — patched signal, studio desk.',
      meta: [['Role', 'Founder & Creative Developer'], ['Period', '2021 — now'], ['Base', 'Paris'], ['Stack', 'Three.js · GSAP · Blender']],
      prose: [
        'My own studio, founded in Paris in 2021. Advanced GSAP motion, 3D built with Three.js and modelled in Blender, frontends in React or plain JavaScript when the framework would only be weight.',
        'It is the smallest possible company and the largest possible excuse to keep doing the work I would do anyway: sites that move with intent.'
      ],
      notes: [
        'Founder & creative developer since November 2021.',
        'Three.js / WebGL integration with GSAP choreography.',
        '3D modelling in Blender; vanilla JS where it is faster.'
      ],
      tags: ['Studio', 'Motion', '3D', 'Blender']
    },
    {
      code: 'A-05', name: 'Jellysmack', kicker: 'NFT auctions · 2021 — 2022',
      img: './assets/photos/img_0828f54b0b79.webp',
      img2: './assets/photos/img_51ec097943c6.webp',
      cap: 'Reference texture — light split through glass.',
      meta: [['Role', 'Front-end & Blockchain'], ['Period', '2021 — 2022'], ['Base', 'Paris'], ['Stack', 'Solidity · Vue.js']],
      prose: [
        'Smart contracts for auctions, for NFTs, and for the containers that hold them — Solidity under a Vue.js product. My first year of writing financial logic that a user would touch with a click.',
        'The lesson that stayed: a contract is a promise, and the interface has one job — never let someone make a promise they cannot see.'
      ],
      notes: [
        'Front-end & blockchain developer, 2021 — 2022.',
        'Solidity contracts for auctions and NFT containers.',
        'Vue.js frontends from Figma to production.'
      ],
      tags: ['NFT', 'Auctions', 'Solidity', 'Product']
    },
    {
      code: 'A-06', name: 'Scorechain', kicker: 'Crypto analytics · 2018 — 2021',
      img: './assets/photos/img_924657c74fba.webp',
      img2: './assets/photos/img_568b3e62cc79.webp',
      cap: 'Reference texture — survey of a wide field.',
      meta: [['Role', 'Fullstack & Blockchain'], ['Period', '2018 — 2021'], ['Base', 'Luxembourg'], ['Stack', 'React · Node · Solidity']],
      prose: [
        'Three and a half years at the analytical end of crypto: smart contracts for instruments such as DVP and interest-rate swaps, a tokenisation platform in React and Node, and the transaction-analytics product for Bitcoin, Ethereum, Tezos and Ripple.',
        'It is where I learned that a good visualisation is an argument — and that a graph people trust is worth more than a graph that looks impressive.'
      ],
      notes: [
        'Fullstack & blockchain developer, 2018 — 2021.',
        'Contracts for DVP and interest-rate swaps.',
        'Analytics product for BTC, ETH, Tezos and XRP.'
      ],
      tags: ['Analytics', 'Compliance', 'Blockchain', 'Data']
    },
    {
      code: 'A-07', name: 'Cyberpunk Desk', kicker: 'Personal experiment · 2025',
      img: './assets/photos/img_fae571b6a101.webp',
      img2: './assets/photos/img_bed9218acd39.webp',
      cap: 'Reference texture — acrylic volume, studio light.',
      meta: [['Role', 'Design & build'], ['Period', '2025'], ['Base', 'Paris'], ['Stack', 'Blender · Three.js']],
      prose: [
        'A desk at night: a monitor with an attitude, cables, a mug that has seen things. Built in Blender and Three.js as a study in making a still life feel inhabited — reflections, dust, a cursor that is not sure where to go.',
        'Awwwards gave it an Honourable Mention in May 2025. I gave it three weekends and an unreasonable amount of time on the monitor’s glow.'
      ],
      notes: [
        'Awwwards Honourable Mention, 23 May 2025.',
        'Blender modelling, Three.js realtime scene.',
        'Personal experiment — no framework, no client.'
      ],
      tags: ['3D', 'Experiment', 'Awwwards', 'Realtime']
    },
    {
      code: 'A-08', name: 'Gamefolio', kicker: 'This world · 2025',
      img: './assets/photos/img_c8787321eee0.webp',
      img2: './assets/photos/img_cfd17a034472.webp',
      cap: 'Reference texture — corona, near total eclipse.',
      meta: [['Role', 'Concept & build'], ['Period', '2025'], ['Base', 'Paris'], ['Stack', 'Three.js · Blender']],
      prose: [
        'The planet you are standing on is the portfolio: a whole interactive world, explorable on desktop and mobile, built without a framework for performance and with Three.js plus Blender for the space between.',
        'It took months, nearly died twice, and was worth it. FWA gave it Site of the Day in December 2025. Half a dozen facts about me are still hidden out here — this study keeps the idea and swaps the address.'
      ],
      notes: [
        'FWA Site of the Day, December 2025.',
        'Awwwards Honourable Mention, December 2025.',
        'Three.js + Blender, no framework, desktop and mobile.'
      ],
      tags: ['Game', 'Portfolio', 'WebGL', 'FWA']
    }
  ];

  var BIOME_COPY = [
    ['Cyan Grid Valley', 'A landing pad of light. The grid runs to the horizon and the first chapter waits in the middle of it.'],
    ['Amber Canyon Ridges', 'Sandstone terraces stacked into the sky, warm dust in the air, an arch over the road at every turn.'],
    ['Violet Monolith Ruins', 'Broken obelisks and floating shards: an architecture that remembers a city and has forgotten its name.'],
    ['Emerald Data Grove', 'Bioluminescent canopies, spores drifting upward, the ground soft with living light.'],
    ['Crimson Basalt Bridge', 'Hexagonal columns, lava in the seams, a volcano breathing on the skyline.'],
    ['Arctic Mirror Flats', 'Flat white distance, ice shards and a horizon so bright it erases the seam between ground and sky.'],
    ['Indigo Orbital Ring', 'Nothing underfoot but platforms and stars — the path becomes a bridge between rings.'],
    ['Golden Horizon Citadel', 'The climb ends at a gate: gold trim, banners, and the last chapter of eight.']
  ];

  var TIMELINE = [
    ['2018', 'Fullstack & Blockchain', 'Scorechain'],
    ['2021', 'Front-end & Blockchain', 'Jellysmack'],
    ['2021', 'Founder, Creative Developer', 'Pasokon Studio'],
    ['2022', 'Lead Fullstack', 'CoinsPaid'],
    ['2023', 'Fullstack & Blockchain', 'Dogamí'],
    ['2026', 'Lead Frontend Engineer', 'Bubblemaps']
  ];

  var SKILLS = ['Three.js', 'WebGL / GLSL', 'GSAP', 'Blender', 'React', 'TypeScript', 'Node.js', 'Solidity', 'Vue.js', 'Docker', 'Figma', 'Jest'];

  var LINKS = [
    ['Website', 'https://www.theomarchand.space'],
    ['LinkedIn', 'https://www.linkedin.com/in/theo-marchand'],
    ['Awwwards', 'https://www.awwwards.com/theo-marchand/']
  ];

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  if (window.gsap) gsap.ticker.lagSmoothing(0);

  var canvas = $('#scene');
  var world = window.createWorld(canvas);
  var II = world.biomes.length;

  var state = {
    entered: false,
    mode: 'journey',
    progress: 0,
    travelU: 0,
    collected: {},
    count: 0,
    activeWp: -1,
    biome: -1,
    moveTarget: null,
    keys: {},
    vel: new THREE.Vector3(),
    moveVel: new THREE.Vector3(),
    avatarPos: new THREE.Vector3().copy(world.avatar.position),
    camYaw: 0,
    userYaw: 0,
    camPitch: 0.36,
    camPos: new THREE.Vector3(0, 8, 14),
    camVel: new THREE.Vector3(),
    camLook: new THREE.Vector3(0, 1.4, 0),
    camLookVel: new THREE.Vector3(),
    yawRate: 0,
    drag: null,
    pendingCard: null,
    pendingTimer: null,
    scrollLocked: false,
    autoOpen: true,
    freezeCam: false,
    finale: false,
    pendingFinale: false,
    replaying: false
  };

  var avatar = world.avatar;
  var camera = world.camera;
  var pathPts = world.curve.getSpacedPoints(900);
  var wpU = world.wpU;

  function maxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function nearestU(x, z) {
    var best = 0, bestD = Infinity;
    for (var k = 0; k < pathPts.length; k++) {
      var dx = pathPts[k].x - x, dz = pathPts[k].z - z;
      var d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = k; }
    }
    return best / (pathPts.length - 1);
  }

  /* ---------------------------------------------------------
     CRITICALLY DAMPED SMOOTHING (no jitter, no overshoot)
     --------------------------------------------------------- */
  function smoothDamp(cur, target, vel, smoothTime, dt) {
    var omega = 2 / Math.max(0.0001, smoothTime);
    var x = omega * dt;
    var exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    var change = cur - target;
    var temp = (vel + omega * change) * dt;
    vel = (vel - omega * temp) * exp;
    return { value: target + (change + temp) * exp, vel: vel };
  }
  var _v3a = new THREE.Vector3();
  function smoothDampV3(cur, target, vel, smoothTime, dt, out) {
    var omega = 2 / Math.max(0.0001, smoothTime);
    var x = omega * dt;
    var exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    var axes = ['x', 'y', 'z'];
    for (var i = 0; i < 3; i++) {
      var a = axes[i];
      var change = cur[a] - target[a];
      var temp = (vel[a] + omega * change) * dt;
      vel[a] = (vel[a] - omega * temp) * exp;
      out[a] = target[a] + (change + temp) * exp;
    }
    return out;
  }

  function angleLerp(a, b, t) {
    var d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  /* ---------------------------------------------------------
     HUD BUILD
     --------------------------------------------------------- */
  var ticksEl = $('#ticks');
  for (var ti = 0; ti < DATA.length; ti++) ticksEl.appendChild(document.createElement('span'));
  $('#countTotal').textContent = pad(DATA.length);

  var wpEl = $('#waypoints');
  world.waypoints.forEach(function (w, i) {
    var b = document.createElement('button');
    b.className = 'wp';
    b.type = 'button';
    b.setAttribute('data-wp', i);
    b.innerHTML = '<span class="wp__n">' + pad(i + 1) + '</span><span class="wp__dot"></span><span class="wp__name">' + w.name + '</span>';
    b.addEventListener('click', function () { jumpTo(i); });
    wpEl.appendChild(b);
  });

  var tlEl = $('#timeline');
  TIMELINE.forEach(function (row) {
    var d = document.createElement('div');
    d.className = 'tl-row';
    d.innerHTML = '<span class="tl-row__y">' + row[0] + '</span><span class="tl-row__r">' + row[1] + '</span><span class="tl-row__o">' + row[2] + '</span>';
    tlEl.appendChild(d);
  });

  var chipsEl = $('#skillChips');
  SKILLS.forEach(function (s) {
    var c = document.createElement('span');
    c.textContent = s;
    chipsEl.appendChild(c);
  });

  var linksEl = $('#contactLinks');
  LINKS.forEach(function (l) {
    var a = document.createElement('a');
    a.href = l[1];
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = l[0] + ' ↗';
    linksEl.appendChild(a);
  });

  var finaleLinks = $('#finaleLinks');
  if (finaleLinks) {
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[1];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = l[0] + ' ↗';
      finaleLinks.appendChild(a);
    });
  }

  /* ---------------------------------------------------------
     PRELOADER
     --------------------------------------------------------- */
  var pre = $('#preloader');
  var plPct = $('#plPct'), plBar = $('#plBar'), plStatus = $('#plStatus'),
      plSub = $('#plSub'), enterBtn = $('#enterBtn'), plBtnTxt = $('#plBtnTxt');

  var STAGES = [
    [0, 'Casting the route', 'Eight worlds · one path · seeding 08 artifacts'],
    [26, 'Raising the grid valley', 'Terrain field · monoliths · sky gradient'],
    [52, 'Burning the canyon', 'Sandstone ridges · fog · light direction'],
    [76, 'Lighting the citadel', 'Chapters 06–08 · orbital ring · golden gate'],
    [100, 'World ready', 'Descend with sound for the full transmission']
  ];

  var plLoad = { p: 0, done: false };
  (function preload() {
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / 2300);
      var eased = 1 - Math.pow(1 - t, 2.2);
      plLoad.p = Math.round(eased * 100);
      plPct.textContent = String(plLoad.p);
      plBar.style.width = plLoad.p + '%';
      for (var i = STAGES.length - 1; i >= 0; i--) {
        if (plLoad.p >= STAGES[i][0]) {
          plStatus.textContent = STAGES[i][1];
          plSub.textContent = STAGES[i][2];
          break;
        }
      }
      if (t < 1) requestAnimationFrame(step);
      else {
        plLoad.done = true;
        enterBtn.disabled = false;
        plBtnTxt.textContent = 'Enter the world';
      }
    }
    requestAnimationFrame(step);
  })();

  function enterWorld() {
    if (state.entered) return;
    state.entered = true;
    AUDIO.start();
    updateSoundUI();
    document.body.classList.remove('is-locked');
    gsap.to(pre, {
      opacity: 0, duration: 1.0, ease: 'power2.inOut',
      onComplete: function () { pre.style.display = 'none'; }
    });
    gsap.fromTo('.hero__name', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, delay: 0.25, ease: 'power3.out' });
    gsap.fromTo('.hero__line', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.5, ease: 'power2.out' });
    gsap.fromTo('.brand, .topbar__right', { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, delay: 0.35, ease: 'power2.out' });
    gsap.fromTo('.hud-counter, .hud-left', { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.9 });
    toast('08 artifacts detected — follow the beacons');
    AUDIO.chime(392);
    ScrollTrigger.refresh();
    showZoneCard(0, true);
  }
  enterBtn.addEventListener('click', enterWorld);

  /* ---------------------------------------------------------
     SOUND UI
     --------------------------------------------------------- */
  var soundBtn = $('#soundBtn'), soundLabel = $('#soundLabel');
  function updateSoundUI() {
    var muted = AUDIO.isMuted();
    soundBtn.setAttribute('aria-pressed', String(!muted));
    soundLabel.textContent = muted ? 'Sound off' : 'Sound on';
  }
  soundBtn.addEventListener('click', function () {
    if (!AUDIO.start()) return;
    AUDIO.toggle();
    updateSoundUI();
    AUDIO.blip(880);
  });

  /* ---------------------------------------------------------
     TOAST + CHAPTER CARD
     --------------------------------------------------------- */
  var toastEl = $('#toast'), toastTimer = null;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, ms || 2600);
  }

  var zoneCard = $('#zoneCard'), zoneNumEl = $('#zoneNum'), zoneNameEl = $('#zoneName'), zoneCardTimer = null;
  function showZoneCard(index, immediate) {
    if (!zoneCard) return;
    var copy = BIOME_COPY[index] || [world.biomes[index].name, ''];
    zoneNumEl.textContent = pad(index + 1);
    zoneNameEl.textContent = copy[0];
    zoneCard.classList.add('is-on');
    clearTimeout(zoneCardTimer);
    zoneCardTimer = setTimeout(function () { zoneCard.classList.remove('is-on'); }, immediate ? 4200 : 3200);
  }

  /* ---------------------------------------------------------
     COLLECT
     --------------------------------------------------------- */
  function updateHUD() {
    $('#countNow').textContent = pad(state.count);
    $$('#ticks span').forEach(function (s, i) { s.classList.toggle('on', !!state.collected[i]); });
    $$('.wp').forEach(function (b, i) { b.classList.toggle('is-found', !!state.collected[i]); });
    var hud = $('#hudCounter');
    hud.classList.remove('is-hit');
    void hud.offsetWidth;
    hud.classList.add('is-hit');
  }

  function collect(index, opts) {
    opts = opts || {};
    if (state.collected[index]) {
      if (opts.open !== false) openDrawer(index);
      return false;
    }
    if (!world.collectOrb(index)) return false;
    state.collected[index] = true;
    state.count++;
    updateHUD();
    AUDIO.chime(392 * Math.pow(2, index / 12) * (index % 2 ? 1.5 : 1));
    flash();
    toast('Artifact ' + DATA[index].code + ' recovered — ' + DATA[index].name, 2400);
    if (opts.open !== false && state.autoOpen) setTimeout(function () { openDrawer(index); }, 560);
    if (state.count >= DATA.length) {
      state.pendingFinale = true;
      if (opts.open === false) setTimeout(maybeShowFinale, 1400);
    }
    return true;
  }

  function flash() {
    var el = $('#flash');
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: 0 }, {
      opacity: 0.7, duration: 0.10, ease: 'power2.out',
      onComplete: function () { gsap.to(el, { opacity: 0, duration: 0.8, ease: 'power2.out' }); }
    });
  }

  /* ---------------------------------------------------------
     DRAWER
     --------------------------------------------------------- */
  var drawer = $('#drawer'), scrim = $('#scrim'), drawerScroll = $('#drawerScroll');
  var currentCard = 0;

  function fillDrawer(i) {
    var d = DATA[i];
    $('#drwCode').textContent = d.code;
    $('#drwIdx').textContent = 'Collectible ' + pad(i + 1) + ' / ' + pad(DATA.length);
    $('#drawerTitle').textContent = d.name;
    $('#drwKicker').textContent = d.kicker;
    $('#drwImg').src = d.img;
    $('#drwImg').alt = d.name + ' — reference image';
    $('#drwImg2').src = d.img2;
    $('#drwImg2').alt = d.name + ' — detail reference';
    $('#drwCap').textContent = d.cap;
    var meta = $('#drwMeta');
    meta.innerHTML = '';
    d.meta.forEach(function (m) {
      var div = document.createElement('div');
      div.innerHTML = '<dt>' + m[0] + '</dt><dd>' + m[1] + '</dd>';
      meta.appendChild(div);
    });
    var prose = $('#drwProse');
    prose.innerHTML = '';
    d.prose.forEach(function (p) {
      var el = document.createElement('p');
      el.textContent = p;
      prose.appendChild(el);
    });
    var notes = $('#drwNotes');
    notes.innerHTML = '';
    d.notes.forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = n;
      notes.appendChild(li);
    });
    var tags = $('#drwTags');
    tags.innerHTML = '';
    d.tags.forEach(function (t) {
      var s = document.createElement('span');
      s.textContent = t;
      tags.appendChild(s);
    });
  }

  function openDrawer(i) {
    currentCard = i;
    fillDrawer(i);
    drawerScroll.scrollTop = 0;
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('is-on'); });
    drawer.classList.add('is-open');
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    AUDIO.blip(660);
    setTimeout(function () { $('#drwClose').focus({ preventScroll: true }); }, 220);
  }

  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-on');
    setTimeout(function () { if (!drawer.classList.contains('is-open')) scrim.hidden = true; }, 520);
    lockScroll(false);
    if (state.pendingFinale) setTimeout(maybeShowFinale, 650);
  }

  $('#drwClose').addEventListener('click', closeDrawer);
  $('#drawerX').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  $('#drwNext').addEventListener('click', function () {
    var next = (currentCard + 1) % DATA.length;
    if (!state.collected[next]) {
      closeDrawer();
      setTimeout(function () { jumpTo(next); }, 320);
    } else {
      fillDrawer(next);
      currentCard = next;
      drawerScroll.scrollTop = 0;
      AUDIO.blip(740);
    }
  });

  function lockScroll(on) {
    state.scrollLocked = on;
    document.body.classList.toggle('is-modal', on);
  }

  /* ---------------------------------------------------------
     MODALS
     --------------------------------------------------------- */
  var about = $('#aboutModal'), contact = $('#contactModal');

  function openModal(el) {
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add('is-on'); });
    lockScroll(true);
    AUDIO.blip(560);
    var first = el.querySelector('button, input, a');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 200);
  }
  function closeModals() {
    [about, contact].forEach(function (el) {
      if (el.hidden) return;
      el.classList.remove('is-on');
      setTimeout(function () {
        if (!el.classList.contains('is-on')) el.hidden = true;
      }, 380);
    });
    lockScroll(false);
  }

  $('#aboutBtn').addEventListener('click', function () { openModal(about); });
  $('#contactBtn').addEventListener('click', function () { openModal(contact); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeModals); });
  [about, contact].forEach(function (el) {
    el.addEventListener('click', function (e) { if (e.target === el) closeModals(); });
  });

  $('#contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var note = $('#formNote');
    var name = form.elements.name.value.trim();
    var mail = form.elements.email.value.trim();
    var msg = form.elements.message.value.trim();
    if (!name || !mail || !msg || mail.indexOf('@') < 1) {
      note.textContent = 'Fill all three fields — a signal needs a return address.';
      note.style.color = '#ffb35c';
      return;
    }
    note.style.color = '';
    note.textContent = 'Signal queued locally — this concept study does not send mail. Reach the studio through the links below.';
    AUDIO.blip(990);
    form.reset();
  });

  /* ---------------------------------------------------------
     MODE / JOURNEY
     --------------------------------------------------------- */
  var modeBtn = $('#modeBtn'), modeTxt = $('.mode-btn__txt', modeBtn);

  function setMode(m, opts) {
    opts = opts || {};
    if (state.mode === m) return;
    state.mode = m;
    modeBtn.setAttribute('aria-pressed', String(m === 'explore'));
    modeTxt.textContent = m === 'explore' ? 'Free explore' : 'Scroll journey';
    if (m === 'journey' && !opts.silentScroll) {
      var u = nearestU(avatar.position.x, avatar.position.z);
      state.travelU = u;
      state.progress = u;
      window.scrollTo(0, u * maxScroll());
    }
    if (m === 'explore') {
      state.moveTarget = null;
      state.userYaw = state.camYaw;
      state.avatarPos.copy(avatar.position);
      toast('Free explore — WASD / arrows to walk, click the ground', 3000);
    } else {
      toast('Scroll journey — the path carries you between worlds', 2600);
    }
  }
  modeBtn.addEventListener('click', function () {
    setMode(state.mode === 'journey' ? 'explore' : 'journey');
    AUDIO.blip(state.mode === 'explore' ? 720 : 480);
  });

  function warpTo(u) {
    u = clamp(u, 0, 1);
    state.progress = u;
    state.travelU = u;
    var pt = world.curve.getPointAt(u * 0.99999);
    var ah = world.curve.getPointAt(clamp(u + 0.0035, 0, 0.99999));
    avatar.position.x = pt.x;
    avatar.position.z = pt.z;
    avatar.position.y = world.heightAt(pt.x, pt.z);
    state.avatarPos.copy(avatar.position);
    state.moveVel.set(0, 0, 0);
    var yaw = Math.atan2(ah.x - pt.x, ah.z - pt.z);
    avatar.rotation.y = yaw;
    state.userYaw = yaw;
    state.camYaw = yaw;
    state.yawRate = 0;
    var dist = isMobileView() ? 9.2 : 7.2;
    var pitch = state.camPitch;
    var fx = Math.sin(yaw), fz = Math.cos(yaw);
    var tx = pt.x, ty = avatar.position.y + 1.22, tz = pt.z;
    state.camPos.set(tx - fx * dist * Math.cos(pitch), ty + dist * Math.sin(pitch) + 0.5, tz - fz * dist * Math.cos(pitch));
    var gy = world.heightAt(state.camPos.x, state.camPos.z) + 2.3;
    if (state.camPos.y < gy) state.camPos.y = gy;
    state.camVel.set(0, 0, 0);
    state.camLook.set(tx + fx * 2.6, ty + 0.2, tz + fz * 2.6);
    state.camLookVel.set(0, 0, 0);
    camera.position.copy(state.camPos);
    camera.lookAt(state.camLook);
    window.scrollTo(0, u * maxScroll());
    return { u: u, x: pt.x, z: pt.z };
  }

  function jumpTo(i) {
    closeDrawer();
    closeModals();
    if (state.finale) hideFinale();
    AUDIO.whoosh();
    flash();
    if (state.mode === 'explore') {
      state.mode = 'journey';
      modeBtn.setAttribute('aria-pressed', 'false');
      modeTxt.textContent = 'Scroll journey';
    }
    warpTo(wpU[i]);
    setTimeout(function () { collect(i, { open: false }); }, 420);
    setTimeout(function () { openDrawer(i); }, 620);
    toast('Chapter ' + pad(i + 1) + ' — ' + DATA[i].name, 2000);
  }

  /* ---------------------------------------------------------
     SCROLL SCENES
     --------------------------------------------------------- */
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: function (self) {
      if (state.mode !== 'journey') return;
      state.progress = self.progress;
    }
  });

  gsap.to('#journeyIntro', {
    opacity: 0, y: -40, ease: 'none',
    scrollTrigger: { trigger: '#journey', start: 'top top', end: '8% top', scrub: true }
  });

  /* ---------------------------------------------------------
     INPUT
     --------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (!state.entered) {
      if (e.key === 'Enter' && !enterBtn.disabled) enterWorld();
      return;
    }
    var k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
      if (!drawer.classList.contains('is-open') && !about.classList.contains('is-on') && !contact.classList.contains('is-on') && !state.finale) {
        state.keys[k] = true;
        if (state.mode !== 'explore') setMode('explore');
        e.preventDefault();
      }
    }
    if (k === 'escape') {
      if (drawer.classList.contains('is-open')) closeDrawer();
      else if (state.finale) hideFinale();
      else closeModals();
    }
  });
  window.addEventListener('keyup', function (e) { state.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { state.keys = {}; });

  function isUiTarget(t) {
    return !!(t && t.closest && t.closest('button, a, input, textarea, .drawer, .modal'));
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (!state.entered) return;
    state.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, touch: e.pointerType === 'touch' };
    if (!state.drag.touch) canvas.classList.add('is-grabbing');
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!state.entered) return;
    if (state.drag && !state.drag.touch) {
      var dx = e.clientX - state.drag.x;
      var dy = e.clientY - state.drag.y;
      if (Math.abs(e.clientX - state.drag.sx) + Math.abs(e.clientY - state.drag.sy) > 5) state.drag.moved = true;
      if (state.drag.moved) {
        state.userYaw -= dx * 0.0042;
        state.camPitch = clamp(state.camPitch + dy * 0.0018, 0.06, 0.95);
        if (state.mode !== 'explore') setMode('explore');
      }
      state.drag.x = e.clientX; state.drag.y = e.clientY;
      return;
    }
    var idx = world.pickOrb(e.clientX, e.clientY);
    world.setHover(idx);
    canvas.classList.toggle('is-hover', idx >= 0);
  });

  function endDrag(e) {
    if (!state.entered || !state.drag) return;
    var d = state.drag;
    state.drag = null;
    canvas.classList.remove('is-grabbing');
    var quick = performance.now() - d.t < 520;
    var still = Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 9;
    if (!quick || !still) return;

    var orbIdx = world.pickOrb(e.clientX, e.clientY);
    if (orbIdx >= 0) { collect(orbIdx); return; }
    if (isUiTarget(e.target)) return;
    var p = world.pickGround(e.clientX, e.clientY);
    if (!p) return;
    state.moveTarget = p;
    if (state.mode !== 'explore') setMode('explore');
    AUDIO.blip(520);
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', function () { state.drag = null; canvas.classList.remove('is-grabbing'); });

  window.addEventListener('wheel', function () {
    if (!state.entered || state.scrollLocked) return;
    if (state.mode === 'explore') setMode('journey');
  }, { passive: true });

  window.addEventListener('touchmove', function () {
    if (!state.entered || state.scrollLocked) return;
    if (state.mode === 'explore') setMode('journey');
  }, { passive: true });

  /* ---------------------------------------------------------
     MOVEMENT
     --------------------------------------------------------- */
  var SPEED = 7.4;
  var _dir = new THREE.Vector3();
  var _fwd = new THREE.Vector3();
  var _right = new THREE.Vector3();
  var _target = new THREE.Vector3();

  function updateExplore(dt) {
    state.camYaw = angleLerp(state.camYaw, state.userYaw, 1 - Math.exp(-dt * 5.5));
    _fwd.set(Math.sin(state.camYaw), 0, Math.cos(state.camYaw));
    _right.set(Math.cos(state.camYaw), 0, -Math.sin(state.camYaw));
    _dir.set(0, 0, 0);
    var k = state.keys;
    if (k.w || k.arrowup) _dir.add(_fwd);
    if (k.s || k.arrowdown) _dir.sub(_fwd);
    if (k.a || k.arrowleft) _dir.sub(_right);
    if (k.d || k.arrowright) _dir.add(_right);

    if (state.moveTarget) {
      var tx = state.moveTarget.x - avatar.position.x;
      var tz = state.moveTarget.z - avatar.position.z;
      if (tx * tx + tz * tz < 0.5) state.moveTarget = null;
      else _dir.set(tx, 0, tz).normalize();
    }
    if (_dir.lengthSq() > 0.0001) _dir.normalize();
    _target.copy(_dir).multiplyScalar(SPEED);

    var accel = _dir.lengthSq() > 0.01 ? 4.2 : 6.5;
    state.vel.lerp(_target, 1 - Math.exp(-dt * accel));
    if (state.vel.length() < 0.03) state.vel.set(0, 0, 0);

    avatar.position.x += state.vel.x * dt;
    avatar.position.z += state.vel.z * dt;
    avatar.position.x = clamp(avatar.position.x, -190, 190);
    avatar.position.z = clamp(avatar.position.z, -34, 546);

    var sp = state.vel.length();
    if (sp > 0.2) {
      var want = Math.atan2(state.vel.x, state.vel.z);
      var before = avatar.rotation.y;
      avatar.rotation.y = angleLerp(avatar.rotation.y, want, 1 - Math.exp(-dt * 7));
      state.yawRate = angleLerp(0, avatar.rotation.y - before, 1) / Math.max(dt, 0.001);
    } else {
      state.yawRate *= 0.9;
    }
    world.setMoveSpeed(sp);
    world.setYawRate(state.yawRate);
    state.avatarPos.copy(avatar.position);
  }

  var _posBefore = new THREE.Vector3();
  function updateJourney(dt) {
    var targetU = clamp(state.progress, 0, 0.9995);
    state.travelU += (targetU - state.travelU) * (1 - Math.exp(-4.6 * dt));
    if (Math.abs(targetU - state.travelU) < 0.00003) state.travelU = targetU;

    var u = clamp(state.travelU, 0, 1);
    var point = world.curve.getPointAt(u * 0.99999);
    var ahead = world.curve.getPointAt(clamp(u + 0.0035, 0, 0.99999));

    _posBefore.copy(avatar.position);
    _target.set(point.x, 0, point.z);
    smoothDampV3(state.avatarPos, _target, state.moveVel, 0.17, dt, state.avatarPos);
    avatar.position.x = state.avatarPos.x;
    avatar.position.z = state.avatarPos.z;

    var sp = state.moveVel.length();
    if (sp > 26) sp = 26;

    var dx = ahead.x - point.x, dz = ahead.z - point.z;
    if (dx * dx + dz * dz > 1e-6) {
      var want = Math.atan2(dx, dz);
      state.userYaw = want;
      state.camYaw = angleLerp(state.camYaw, want, 1 - Math.exp(-dt * 2.2));
      var before = avatar.rotation.y;
      avatar.rotation.y = angleLerp(avatar.rotation.y, want, 1 - Math.exp(-dt * 4.5));
      var rate = angleLerp(0, avatar.rotation.y - before, 1) / Math.max(dt, 0.001);
      state.yawRate += (rate - state.yawRate) * Math.min(1, dt * 8);
    }
    world.setMoveSpeed(sp);
    world.setYawRate(state.yawRate);
  }

  /* ---------------------------------------------------------
     CAMERA
     --------------------------------------------------------- */
  function isMobileView() { return window.matchMedia('(max-width: 860px)').matches; }

  function updateCamera(dt) {
    if (state.freezeCam) return;
    var dist = isMobileView() ? 9.2 : 7.2;
    var pitch = state.camPitch;
    var f = new THREE.Vector3(Math.sin(state.camYaw), 0, Math.cos(state.camYaw));
    var target = new THREE.Vector3(avatar.position.x, avatar.position.y + 1.22, avatar.position.z);
    var desired = new THREE.Vector3(
      target.x - f.x * dist * Math.cos(pitch),
      target.y + dist * Math.sin(pitch) + 0.5,
      target.z - f.z * dist * Math.cos(pitch)
    );
    var groundY = world.heightAt(desired.x, desired.z) + 2.3;
    if (desired.y < groundY) desired.y = groundY;

    smoothDampV3(state.camPos, desired, state.camVel, 0.34, dt, state.camPos);
    camera.position.copy(state.camPos);

    var lookAhead = state.mode === 'journey' ? 2.6 : 1.4;
    _v3a.set(target.x + f.x * lookAhead, target.y + 0.2, target.z + f.z * lookAhead);
    smoothDampV3(state.camLook, _v3a, state.camLookVel, 0.22, dt, state.camLook);
    camera.lookAt(state.camLook);

    var fovTarget = 54 + clamp((state.mode === 'journey' ? state.moveVel.length() : state.vel.length()) * 0.35, 0, 5);
    if (Math.abs(camera.fov - fovTarget) > 0.05) {
      camera.fov += (fovTarget - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
  }

  /* ---------------------------------------------------------
     BIOME UI + PROXIMITY
     --------------------------------------------------------- */
  var posName = $('#posName'), posChip = $('#posChip');
  var accentColor = new THREE.Color();

  function applyAccent(hex) {
    accentColor.setHex(hex);
    var hs = accentColor.getHexString();
    var c = accentColor.clone().multiplyScalar(0.55);
    document.documentElement.style.setProperty('--cyan', '#' + hs);
    document.documentElement.style.setProperty('--cyan-soft', '#' + c.clone().lerp(new THREE.Color(0xffffff), 0.45).getHexString());
    document.documentElement.style.setProperty('--cyan-deep', '#' + c.getHexString());
    document.documentElement.style.setProperty('--line', 'rgba(' + Math.round(accentColor.r * 255) + ',' + Math.round(accentColor.g * 255) + ',' + Math.round(accentColor.b * 255) + ',.18)');
    document.documentElement.style.setProperty('--line-strong', 'rgba(' + Math.round(accentColor.r * 255) + ',' + Math.round(accentColor.g * 255) + ',' + Math.round(accentColor.b * 255) + ',.40)');
  }

  function checkBiome(dt) {
    if (!state.entered) return;
    var z = world.getZone();
    var idx = Math.round(clamp(z, 0, II - 1));
    if (idx !== state.biome) {
      var first = state.biome === -1;
      state.biome = idx;
      var b = world.biomes[idx];
      applyAccent(b.accent);
      posName.textContent = b.name;
      posChip.firstChild.nodeValue = 'SECTOR ' + pad(idx + 1) + ' · ';
      $$('.wp').forEach(function (el, i) { el.classList.toggle('is-active', i === idx); });
      if (!first) showZoneCard(idx, false);
    }
  }

  function checkProximity(dt) {
    if (!state.entered) return;
    var near = -1, nearD = 3.2 * 3.2;
    for (var i = 0; i < world.orbs.length; i++) {
      var o = world.orbs[i];
      if (o.collected) continue;
      var dx = avatar.position.x - o.wp.x;
      var dz = avatar.position.z - o.wp.z;
      var d2 = dx * dx + dz * dz;
      if (d2 < nearD) { near = i; nearD = d2; }
    }
    if (near >= 0) {
      if (!state.pendingCard || state.pendingCard.index !== near) {
        state.pendingCard = { index: near, x: world.orbs[near].wp.x, z: world.orbs[near].wp.z };
        clearTimeout(state.pendingTimer);
        state.pendingTimer = setTimeout(function () {
          var pc = state.pendingCard;
          if (!pc) return;
          var ddx = avatar.position.x - pc.x, ddz = avatar.position.z - pc.z;
          if (ddx * ddx + ddz * ddz < 5.5 * 5.5) collect(pc.index);
        }, 850);
      }
    } else if (state.pendingCard) {
      clearTimeout(state.pendingTimer);
      state.pendingCard = null;
    }
  }

  /* ---------------------------------------------------------
     FINALE — thank you + get in touch
     --------------------------------------------------------- */
  var finaleEl = $('#finale');

  function maybeShowFinale() {
    if (state.finale || !finaleEl) return;
    if (!state.pendingFinale && state.count < DATA.length) return;
    showFinale();
  }

  function showFinale() {
    if (state.finale) return;
    state.finale = true;
    state.pendingFinale = false;
    $('#finaleEyebrow').textContent = 'Journey complete · ' + pad(state.count) + ' / 08 artifacts';
    $('#finaleStat').textContent = state.count >= DATA.length
      ? 'Eight worlds walked · eight chapters recovered'
      : 'You reached the citadel with ' + pad(state.count) + ' of 08 artifacts';
    finaleEl.hidden = false;
    requestAnimationFrame(function () { finaleEl.classList.add('is-on'); });
    lockScroll(true);
    document.body.classList.add('has-finale');
    AUDIO.chime(523);
    setTimeout(function () { AUDIO.chime(784); }, 180);
    setTimeout(function () { AUDIO.chime(1046); }, 380);
    if (window.gsap) {
      gsap.fromTo('.finale__card', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
    }
    setTimeout(function () { $('#finaleContact').focus({ preventScroll: true }); }, 500);
  }

  function hideFinale() {
    if (!state.finale) return;
    state.finale = false;
    finaleEl.classList.remove('is-on');
    document.body.classList.remove('has-finale');
    setTimeout(function () { if (!finaleEl.classList.contains('is-on')) finaleEl.hidden = true; }, 500);
    lockScroll(false);
  }

  function replay() {
    hideFinale();
    state.collected = {};
    state.count = 0;
    state.pendingFinale = false;
    world.resetOrbs();
    updateHUD();
    state.mode = 'journey';
    modeBtn.setAttribute('aria-pressed', 'false');
    modeTxt.textContent = 'Scroll journey';
    warpTo(0);
    window.scrollTo(0, 0);
    toast('Replaying the journey from the grid valley', 2600);
  }

  if (finaleEl) {
    $('#finaleContact').addEventListener('click', function () {
      hideFinale();
      setTimeout(function () { openModal(contact); }, 260);
      AUDIO.blip(820);
    });
    $('#finaleReplay').addEventListener('click', replay);
    $('#finaleClose').addEventListener('click', hideFinale);
    $('#finale').addEventListener('click', function (e) { if (e.target === finaleEl) hideFinale(); });
  }

  /* ---------------------------------------------------------
     LOOP
     --------------------------------------------------------- */
  var clock = new THREE.Clock();
  function tick() {
    var dt = Math.min(clock.getDelta(), 0.05);
    if (state.entered && !state.scrollLocked) {
      if (state.mode === 'journey') updateJourney(dt);
      else updateExplore(dt);
    } else if (state.scrollLocked) {
      state.moveVel.multiplyScalar(0.9);
      state.vel.multiplyScalar(0.9);
      world.setMoveSpeed(0);
    }
    checkProximity(dt);
    checkBiome(dt);
    updateCamera(dt);
    world.update(dt);
    world.render();

    /* the end of the road always completes the journey */
    if (state.entered && !state.finale && state.mode === 'journey' && state.travelU > 0.988) {
      state.pendingFinale = true;
      if (!drawer.classList.contains('is-open')) maybeShowFinale();
    }
    requestAnimationFrame(tick);
  }

  /* initial framing */
  state.camPos.set(0, 9, 16);
  camera.position.copy(state.camPos);
  state.camLook.set(0, 1.4, 0);
  camInit();

  function camInit() {
    var f = new THREE.Vector3(Math.sin(state.camYaw), 0, Math.cos(state.camYaw));
    state.camLook.set(avatar.position.x + f.x * 2.6, avatar.position.y + 1.5, avatar.position.z + f.z * 2.6);
  }

  applyAccent(world.biomes[0].accent);
  world.resize();
  window.addEventListener('resize', function () {
    world.resize();
    ScrollTrigger.refresh();
  });

  tick();

  /* ---------------------------------------------------------
     TEST / DEBUG SURFACE
     --------------------------------------------------------- */
  window.__SITE = {
    world: world,
    data: DATA,
    state: state,
    biomes: world.biomes,
    collect: collect,
    collectAll: function () { DATA.forEach(function (d, i) { if (!state.collected[i]) collect(i, { open: false }); }); },
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    jumpTo: jumpTo,
    showFinale: showFinale,
    hideFinale: hideFinale,
    replay: replay,
    setProgress: function (p) { state.progress = p; state.travelU = p; window.scrollTo(0, p * maxScroll()); },
    closeUp: function (angle, dist) {
      var d = dist || 3.4;
      state.freezeCam = true;
      state.camPos.set(avatar.position.x + Math.sin(angle) * d, avatar.position.y + 1.15, avatar.position.z + Math.cos(angle) * d);
      state.camVel.set(0, 0, 0);
      state.camLook.set(avatar.position.x, avatar.position.y + 1.0, avatar.position.z);
      state.camLookVel.set(0, 0, 0);
      camera.position.copy(state.camPos);
      camera.lookAt(state.camLook);
    },
    unfreeze: function () { state.freezeCam = false; },
    place: function (i) { return warpTo(world.wpU[clamp(i, 0, DATA.length - 1)]); },
    placeAt: function (u) { return warpTo(u); },
    gotoZone: function (i) { jumpTo(clamp(i, 0, DATA.length - 1)); },
    projectOrb: function (i) {
      var o = world.orbs[i];
      var v = o.group.position.clone().project(world.camera);
      var r = world.renderer.domElement.getBoundingClientRect();
      return { x: (v.x * 0.5 + 0.5) * r.width + r.left, y: (-v.y * 0.5 + 0.5) * r.height + r.top, visible: v.z < 1 };
    },
    counts: function () {
      return {
        collected: Object.keys(state.collected).length,
        counter: $('#countNow').textContent + '/' + $('#countTotal').textContent,
        mode: state.mode,
        progress: state.progress,
        biome: state.biome,
        biomeName: world.biomes[Math.max(0, state.biome)].name,
        speed: state.moveVel.length()
      };
    }
  };
})();
