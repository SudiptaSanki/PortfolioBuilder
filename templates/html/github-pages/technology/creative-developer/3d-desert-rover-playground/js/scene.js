/* ============================================================
   DUNE ROVER® — Playground / desert world
   Everything here is procedural: dunes, hill roads, oasis ponds,
   mesas, cacti, palms and the billboards. Photos come from
   assets/photos (local copies) (CORS-enabled) and type is drawn into
   canvases at build time, so the static sandbox needs no binaries.
   ============================================================ */
(function () {
  'use strict';

  /* r149 keeps colour management off by default, which renders every hex
     colour as if it were linear — the whole desert came out pastel. Turn it
     on so the palette is the palette. */
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

  const World = (window.World = {});
  window.__build = 'desert-v5';

  /* ── palette ─────────────────────────────────────────────── */
  const C = {
    sand: 0xf0c894,
    sandLight: 0xf8dfb8,
    sandDeep: 0xd79f66,
    clay: 0xe28f5f,
    terra: 0xc2674a,
    terraDeep: 0x9d4a30,
    cream: 0xfff4e2,
    butter: 0xf4cf7c,
    mint: 0xa9c9a4,
    sage: 0x9db07c,
    olive: 0x8a9b63,
    plum: 0x5c3a37,
    ink: 0x3a2a22,
    sky: 0xa9c6d8,
    glass: 0x8fb6c4,
    water: 0x3f9a9a,
  };

  const R = 96;                 // island radius — 2× the old 46
  World.R = R;
  World.BOUNDS = R - 5;         // soft fence the car cannot cross

  World.ZONES = {
    intro:      { x: 0,   z: 8,   label: 'INTRO',      sub: 'THE STARTING GRID' },
    projects:   { x: 0,   z: -40, label: 'PROJECTS',   sub: 'SIX CASE STUDIES' },
    playground: { x: 48,  z: 4,   label: 'PLAYGROUND', sub: 'KNOCK THINGS OVER' },
    about:      { x: -48, z: 8,   label: 'ABOUT',      sub: 'WHO DRIVES THIS' },
    contact:    { x: 0,   z: 60,  label: 'CONTACT',    sub: 'SAY HELLO' },
  };

  /* The guided tour: one open route, INTRO → PROJECTS → PLAYGROUND →
     ABOUT → CONTACT. It ends at the signpost and never loops back. */
  World.TOUR_PATH = [
    [0, 14], [0, 4], [0, -10], [0, -24], [0, -34], [0, -44], [0, -46.5],
    [10, -46.5], [20, -46.5], [30, -46.5],
    [40, -41], [46, -30], [48, -16], [48, -2], [48, 4],
    [48, 14], [42, 22], [32, 24], [22, 22], [12, 14], [0, 8],
    [-14, 8], [-28, 8], [-40, 8], [-48, 8],
    [-52, 20], [-48, 32], [-38, 42], [-24, 50], [-10, 55], [0, 58],
  ];

  /* ── projects ────────────────────────────────────────────── */
  const U = (id, w, h) =>
    `https://assets/photos (local copies)/${id}?w=${w}&h=${h || ''}&fit=crop&auto=format&q=80&fm=jpg`;

  World.PROJECTS = [
    {
      n: '01', title: 'Arcade 84', accent: 0xd8785a,
      sub: 'A playable museum wing for people who grew up in arcades.',
      meta: { YEAR: '2025', ROLE: 'ART DIRECTION, WEBGL', STACK: 'THREE.JS · GSAP · HOWLER', CLIENT: 'PINBALL MUSEUM, OSAKA' },
      hero: U('photo-1550745165-9bc0b252726f', 1400, 800),
      shots: [U('photo-1511512578047-dfb367046420', 800, 600), U('photo-1493711662062-fa541adb3fc8', 800, 600)],
      lead: 'Twelve cabinets, one browser tab. The museum had the hardware; what it lacked was the noise, the heat and the pull of a room full of strangers waiting for their turn.',
      body: [
        'We rebuilt the wing as a single WebGL street: CRT glass curved with a custom vertex shader, attract-mode loops decoded from the museum’s own tapes, neon bleeding onto wet asphalt. Walk in with the arrow keys and a cabinet lights up; press enter and the original ROM boots inside a canvas on the screen you are facing.',
        'The hard part was not the cabinets, it was the crowd. A queue system modelled on the museum’s Saturday figures paces how many cabinets are lit at once, so the room never feels empty and never feels like a rendering demo.',
      ],
      quote: '“The kids stopped reading the labels. They started playing.”',
      quoteBy: 'MIKA TODO — HEAD OF DIGITAL, PINBALL MUSEUM',
      results: [['+312%', 'AVERAGE SESSION TIME'], ['4.7×', 'TICKET CONVERSIONS'], ['11', 'AWARDS & MENTIONS']],
      credit: 'Photography: Unsplash — Daniel Korpai, Carl Raw, Craig Boudreaux',
    },
    {
      n: '02', title: 'Terrace', accent: 0xc98c63,
      sub: 'A quiet house for loud architecture.',
      meta: { YEAR: '2024', ROLE: 'DESIGN, FRONT-END, 3D CONFIG', STACK: 'THREE.JS · GSAP · VITE', CLIENT: 'TERRACE ARCHITECTS, LISBON' },
      hero: U('photo-1523217582562-09d0def993a6', 1400, 800),
      shots: [U('photo-1487958449943-2429e8be8625', 800, 600), U('photo-1497366754035-f200968a6e72', 800, 600)],
      lead: 'An architecture studio that builds in white asked for a site that would not compete with the buildings. We gave them one long room, a slow camera and nothing to click before the work.',
      body: [
        'Each project is a walkthrough rather than a gallery: the camera drifts at the pace of a person who has just arrived, floorplans unfold as line drawings over the render, and the palette is pinned to the material board of the actual house — lime plaster, oiled oak, one precise black.',
        'A three.js configurator lets clients swap façade, terrace tile and timber finish on the live model. Every choice writes a shareable URL, which the studio now sends instead of PDFs.',
      ],
      quote: '“It reads like a monograph you can walk through.”',
      quoteBy: 'INES FERREIRA — PARTNER, TERRACE',
      results: [['-64%', 'BRIEFING PDFS'], ['2:58', 'MEDIAN VISIT'], ['19', 'NEW COMMISSIONS']],
      credit: 'Photography: Unsplash — R ARCHITECTURE, Joel Filipe, Nastuh Abootalebi',
    },
    {
      n: '03', title: 'Helios', accent: 0xd9a05b,
      sub: 'Mission control for a satellite that only exists in a browser.',
      meta: { YEAR: '2025', ROLE: 'CREATIVE DEV, DATA VIZ', STACK: 'THREE.JS · D3 · WEBSOCKETS', CLIENT: 'HELIOS AEROSPACE, TOULOUSE' },
      hero: U('photo-1451187580459-43490279c0fa', 1400, 800),
      shots: [U('photo-1633356122544-f134324a6cee', 800, 600), U('photo-1526374965328-7f61d4dc18c5', 800, 600)],
      lead: 'Aerospace engineers read telemetry the way musicians read scores. The marketing site kept drawing rockets; we drew the data instead.',
      body: [
        'Helios streams 240 channels of simulated telemetry into a globe you can pull apart. Anomalies surface as warm lights drifting off the ground track, and each one opens into a plain-language card written with the flight team, so a journalist and an engineer can read the same page.',
        'We kept the chrome to a minimum: one typeface, one accent, no dashboard tiles. The numbers are live, the interface is quiet, and the site doubles as the internal wall display in Toulouse.',
      ],
      quote: '“We stopped explaining the mission. People could see it.”',
      quoteBy: 'DR. SAMIR OULD — FLIGHT DIRECTOR',
      results: [['240', 'LIVE CHANNELS'], ['8.1M', 'LAUNCH-DAY VIEWS'], ['0.4s', 'TTFI ON 4G']],
      credit: 'Photography: Unsplash — NASA, Lautaro Andreani, Markus Spiske',
    },
    {
      n: '04', title: 'Meridian', accent: 0x8fa9b8,
      sub: 'A road-trip companion for an electric car with range anxiety.',
      meta: { YEAR: '2024', ROLE: 'PRODUCT DESIGN, WEBGL', STACK: 'THREE.JS · GSAP · MAPLIBRE', CLIENT: 'MERIDIAN MOTORS, OSLO' },
      hero: U('photo-1552519507-da3b142c6e3d', 1400, 800),
      shots: [U('photo-1503376780353-7e6692767b70', 800, 600), U('photo-1506905925346-21bda4d32df4', 800, 600)],
      lead: 'Buying an electric car is an argument about charging. Meridian wanted the argument to happen inside a landscape instead of a spreadsheet.',
      body: [
        'We built a drive from Oslo to the fjords that you can run in ninety seconds: the terrain drops through the seasons, the battery drains in real time and the charger stops appear exactly when the car would ask for them. Change your driving style and the route rebuilds around you.',
        'The same scene powers the dealer screen and the campaign film, one build, three formats. Nothing pre-rendered: every ridge is displaced geometry, every light is a directional source.',
      ],
      quote: '“The test-drive bookings doubled in a fortnight.”',
      quoteBy: 'ANNE HOLM — CMO, MERIDIAN',
      results: [['2.1×', 'TEST-DRIVE BOOKINGS'], ['58%', 'COMPLETED DRIVES'], ['1', 'CODEBASE, 3 FORM FACTORS']],
      credit: 'Photography: Unsplash — Samuele Errico Piccarini, Campbell, Luca Bravo',
    },
    {
      n: '05', title: 'Solstice', accent: 0xb07fa0,
      sub: 'A festival identity that composes itself every morning.',
      meta: { YEAR: '2023', ROLE: 'GENERATIVE IDENTITY, SITE', STACK: 'THREE.JS · GLSL · GSAP', CLIENT: 'SOLSTICE FESTIVAL, BERLIN' },
      hero: U('photo-1563089145-599997674d42', 1400, 800),
      shots: [U('photo-1618005182384-a83a8bd57fbe', 800, 600), U('photo-1522202176988-66273c2fd55f', 800, 600)],
      lead: 'Twenty-two artists, one sunset. The posters could not all look the same, and they could not look like nothing.',
      body: [
        'Every sunrise a shader recomposes the year’s poster from the day’s weather and the running order, then publishes it to the site, the vinyl cutter and the twelve billboards around Kreuzberg. The palette never breaks: two warm gradients, one horizon line, a grid of stage times.',
        'On the site the poster is the navigation. Drag the horizon and the timetable reflows; the same drag prints a ticket stub with your own gradient on it.',
      ],
      quote: '“We printed 400 unique posters and never opened a layout file.”',
      quoteBy: 'JONAS REIN — FOUNDER, SOLSTICE',
      results: [['400', 'UNIQUE POSTERS'], ['61K', 'TICKETS SOLD'], ['36', 'DAYS OF DAILY ART']],
      credit: 'Photography: Unsplash — Pawel Czerwinski, Andrew Kliatskyi, Annie Spratt',
    },
    {
      n: '06', title: 'Paper Plane', accent: 0xa9c9a4,
      sub: 'A learning app that a nine-year-old can drive.',
      meta: { YEAR: '2023', ROLE: 'DESIGN SYSTEM, INTERACTION', STACK: 'CANVAS 2D · GSAP · SVELTE', CLIENT: 'PAPER PLANE LABS, SEOUL' },
      hero: U('photo-1503387762-592deb58ef4e', 1400, 800),
      shots: [U('photo-1519389950473-47ba0277781c', 800, 600), U('photo-1498050108023-c5249f4df085', 800, 600)],
      lead: 'Most kids’ apps look like a toy shop exploded. Paper Plane asked for the opposite: one calm surface, big targets, nothing that punishes a wrong tap.',
      body: [
        'We designed a paper world with a single rule — everything can be folded. Lessons are paper panels that crease and flip, mistakes unfold back to where they started, and progress is a growing stack of planes on the shelf rather than a percentage.',
        'The design system ships as 84 tokens and 26 components, tested with 120 children in three languages. Reading scores rose, but the metric the team watches is how often a child opens the app on a Saturday.',
      ],
      quote: '“It is the first app my daughter asks for by name.”',
      quoteBy: 'PARENT, PILOT GROUP 4',
      results: [['84', 'DESIGN TOKENS'], ['120', 'CHILD TESTERS'], ['+27%', 'WEEKEND RETENTION']],
      credit: 'Photography: Unsplash — Kelly Sikkema, Andrew Neel, Christopher Gower',
    },
  ];

  /* ── small helpers ───────────────────────────────────────── */
  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color, roughness: 0.86, metalness: 0.02,
    }, opts || {}));
  }

  const texCache = {};
  World.assets = { textures: 0, failed: 0, errors: [] };

  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }

  function loadTexture(url, onDone) {
    if (texCache[url]) { if (onDone) onDone(texCache[url]); return texCache[url]; }
    const t = new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 8;
        texCache[url] = tex;
        World.assets.textures++;
        if (onDone) onDone(tex);
        texLoaded();
      },
      undefined,
      () => {
        World.assets.failed++;
        World.assets.errors.push(url);
        texLoaded();
      }
    );
    return t;
  }

  let _texPending = 0, _texDone = 0, _texCb = null;
  function texLoaded() {
    _texDone++;
    if (_texCb) _texCb(_texDone, _texPending);
  }
  World.textureProgress = () => ({ done: _texDone, total: _texPending });
  World.onTextureProgress = (cb) => { _texCb = cb; cb(_texDone, _texPending); };
  World.expectTextures = (n) => { _texPending += n; };

  function textPanel(w, h, draw, opts) {
    const o = opts || {};
    return canvasTex(w, h, (ctx) => {
      ctx.fillStyle = o.bg || '#fff4e2';
      ctx.fillRect(0, 0, w, h);
      if (o.border) {
        ctx.strokeStyle = o.border;
        ctx.lineWidth = o.borderWidth || 8;
        ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
      }
      draw(ctx, w, h);
    });
  }

  /* ============================================================
     TERRAIN
     A dune field, flattened into roads and zone pads, carved into
     basins where the oasis ponds sit. One function, `terrainAt`,
     drives the mesh, the car, the props and the minimap, so what
     you see is exactly what you drive on.
     ============================================================ */
  function duneField(x, z) {
    let h = 0;
    h += Math.sin(x * 0.0335 + 1.2) * Math.cos(z * 0.0305 - 0.6) * 2.9;
    h += Math.sin(x * 0.0152 - z * 0.0195 + 2.4) * 3.3;
    h += Math.cos(x * 0.058 + z * 0.014) * 1.0;
    h += Math.sin(x * 0.115 + 0.5) * Math.cos(z * 0.098 + 1.7) * 0.26;
    return h;
  }

  function rimFade(x, z) {
    const r = Math.hypot(x, z);
    const t = Math.min(1, Math.max(0, (R - 7 - r) / 16));
    return t * t * (3 - 2 * t);
  }

  function baseHeight(x, z) {
    return duneField(x, z) * rimFade(x, z);
  }

  /* Roads: polylines with a half-width. The corridor is flattened to
     the smoothed height of the centre line, so the road crests the
     dunes instead of cutting through them — hill roads. */
  const ROADS = [
    { w: 9.5, pts: [[0, 58], [0, 8], [0, -20], [0, -30], [0, -38], [0, -44]] },
    { w: 9.0, pts: [[-58, 8], [-30, 8], [0, 8], [30, 8], [58, 8]] },
    { w: 8.0, pts: [[0, -36], [16, -36], [32, -26], [44, -9], [48, 4]] },
    { w: 8.5, pts: [[-48, 8], [-46, 22], [-40, 34], [-26, 46], [-10, 54], [0, 58]] },
    { w: 7.0, pts: [[10, 8], [24, 16], [40, 24], [56, 32], [68, 42], [72, 54]] },
  ];
  World.ROADS = ROADS;

  const PADS = [
    { x: 0, z: 8, r: 15 },      // intro roundabout
    { x: 0, z: -42, r: 30 },    // billboard plaza
    { x: 48, z: 4, r: 19 },     // playground
    { x: -48, z: 8, r: 19 },    // about
    { x: 0, z: 60, r: 16 },     // contact
  ];
  /* a pad sits at the mean height of its footprint, not the peak of one dune,
     so the zones stay gentle to drive between */
  PADS.forEach((p) => {
    let sum = baseHeight(p.x, p.z), n = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      sum += baseHeight(p.x + Math.cos(a) * p.r * 0.7, p.z + Math.sin(a) * p.r * 0.7);
      n++;
    }
    p.y = sum / n;
  });

  const POND_DEFS = [
    { x: 48, z: 52, r: 12, name: 'MIRAGE' },
    { x: -62, z: -30, r: 11, name: 'SALT' },
    { x: -26, z: 70, r: 9, name: 'REED' },
  ];
  const PONDS = (World.PONDS = POND_DEFS.map((p) => {
    const waterY = baseHeight(p.x, p.z) - 0.1;
    return Object.assign({}, p, { waterY, level: waterY - 0.5, waterR: p.r * 0.84 });
  }));

  const GRID = 15;
  const roadGrid = new Map();
  const roadSamples = [];

  function prepRoads() {
    ROADS.forEach((road) => {
      const pts = [];
      for (let i = 0; i < road.pts.length - 1; i++) {
        const a = road.pts[i], b = road.pts[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(len / 2.4));
        for (let k = 0; k < n; k++) {
          pts.push([a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)]);
        }
      }
      pts.push(road.pts[road.pts.length - 1]);
      const raw = pts.map((p) => baseHeight(p[0], p[1]));
      const sm = raw.map((_, i) => {
        let sum = 0, n = 0;
        for (let j = Math.max(0, i - 5); j <= Math.min(raw.length - 1, i + 5); j++) { sum += raw[j]; n++; }
        return sum / n;
      });
      pts.forEach((p, i) => {
        const s = { x: p[0], z: p[1], y: sm[i], w: road.w };
        roadSamples.push(s);
        const key = Math.round(p[0] / GRID) + ',' + Math.round(p[1] / GRID);
        let arr = roadGrid.get(key);
        if (!arr) { arr = []; roadGrid.set(key, arr); }
        arr.push(s);
      });
    });
  }
  prepRoads();

  const smoothstep01 = (t) => t * t * (3 - 2 * t);

  function terrainAt(x, z) {
    let h = baseHeight(x, z);

    /* roads — weighted average of the nearby centre-line samples */
    const cx = Math.round(x / GRID), cz = Math.round(z / GRID);
    let wsum = 0, ysum = 0;
    for (let ix = cx - 1; ix <= cx + 1; ix++) {
      for (let iz = cz - 1; iz <= cz + 1; iz++) {
        const arr = roadGrid.get(ix + ',' + iz);
        if (!arr) continue;
        for (let k = 0; k < arr.length; k++) {
          const s = arr[k];
          const inner = s.w * 0.5, outer = inner + 7.5;
          const d = Math.hypot(x - s.x, z - s.z);
          if (d >= outer) continue;
          const t = d <= inner ? 0 : (d - inner) / (outer - inner);
          const wgt = 1 - smoothstep01(t);
          wsum += wgt; ysum += wgt * s.y;
        }
      }
    }
    if (wsum > 0) {
      const k = Math.min(1, wsum);
      h = h * (1 - k) + (ysum / wsum) * k;
    }

    /* zone pads — perfectly flat, eased into the dunes */
    for (let i = 0; i < PADS.length; i++) {
      const p = PADS[i];
      const d = Math.hypot(x - p.x, z - p.z);
      const outer = p.r + 9;
      if (d >= outer) continue;
      const t = d <= p.r ? 0 : (d - p.r) / 9;
      const wgt = 1 - smoothstep01(t);
      h = h * (1 - wgt) + p.y * wgt;
    }

    /* oasis basins — the shoreline wobbles so the pools are not perfect discs */
    for (let i = 0; i < PONDS.length; i++) {
      const p = PONDS[i];
      const dx = x - p.x, dz = z - p.z;
      const d = Math.hypot(dx, dz);
      const ang = Math.atan2(dz, dx);
      const pr = p.r * (1 + 0.055 * Math.sin(3 * ang + 1.1) + 0.035 * Math.sin(5 * ang + 2.3));
      const outer = pr + 4.5;
      if (d >= outer) continue;
      let target;
      if (d < pr) {
        const k = d / pr;
        target = p.waterY - 1.35 * (1 - k * k);
      } else {
        target = p.waterY + 0.42 * Math.sin(Math.PI * (d - pr) / 4.5);
      }
      const wgt = d <= pr ? 1 : 1 - smoothstep01((d - pr) / 4.5);
      h = h * (1 - wgt) + target * wgt;
    }

    return h;
  }
  World.terrainAt = terrainAt;

  /* ── ground texture ──────────────────────────────────────── */
  function makeGroundTexture() {
    const S = 2048;
    const K = S / (2 * R);
    const toCanvas = (x, z) => [(x + R) * K, (z + R) * K];
    return canvasTex(S, S, (ctx) => {
      ctx.fillStyle = '#dfa86c';
      ctx.fillRect(0, 0, S, S);

      let seed = 11;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

      /* golden light in the middle, terracotta toward the rim */
      const g0 = ctx.createRadialGradient(S / 2, S / 2, S * 0.04, S / 2, S / 2, S * 0.56);
      g0.addColorStop(0, 'rgba(246,216,164,0.22)');
      g0.addColorStop(0.55, 'rgba(232,185,127,0)');
      g0.addColorStop(1, 'rgba(158,94,58,0.48)');
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, S, S);

      /* hillshade straight from the height field — drawn small, then scaled
         smoothly so the dunes read as light and shade rather than a grid */
      const N = 128;
      const hs = document.createElement('canvas');
      hs.width = hs.height = N;
      const hctx = hs.getContext('2d');
      const img = hctx.createImageData(N, N);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const x = (i + 0.5) / N * 2 * R - R;
          const z = (j + 0.5) / N * 2 * R - R;
          const hx = terrainAt(x + 1.6, z) - terrainAt(x - 1.6, z);
          const hz = terrainAt(x, z + 1.6) - terrainAt(x, z - 1.6);
          const light = (-hx * 0.55 - hz * 0.75) * 2.6;
          const k = (j * N + i) * 4;
          if (light >= 0) {
            img.data[k] = 255; img.data[k + 1] = 246; img.data[k + 2] = 218;
            img.data[k + 3] = Math.min(96, Math.round(light * 105));
          } else {
            img.data[k] = 122; img.data[k + 1] = 62; img.data[k + 2] = 32;
            img.data[k + 3] = Math.min(92, Math.round(-light * 100));
          }
        }
      }
      hctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(hs, 0, 0, S, S);

      /* soft blotches */
      for (let i = 0; i < 300; i++) {
        const x = rnd() * S, y = rnd() * S, r = 24 + rnd() * 130;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const warm = rnd() > 0.5;
        g.addColorStop(0, warm ? 'rgba(250,222,180,0.22)' : 'rgba(196,132,84,0.20)');
        g.addColorStop(1, 'rgba(232,185,127,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      /* sand grain */
      for (let i = 0; i < 2600; i++) {
        const x = rnd() * S, y = rnd() * S, r = 0.8 + rnd() * 2.2;
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(150,96,60,0.10)' : 'rgba(255,240,212,0.14)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      /* dry field patches: rows of stubble */
      const fields = [[30, 34, 22, 15], [-20, -62, 24, 16], [-58, 30, 20, 14], [64, 12, 17, 12]];
      fields.forEach(([fx, fz, fw, fh], fi) => {
        const [px, py] = toCanvas(fx, fz);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((fi % 3) * 0.35 - 0.3);
        ctx.fillStyle = 'rgba(140,142,86,0.16)';
        ctx.fillRect(-fw * K, -fh * K, fw * 2 * K, fh * 2 * K);
        ctx.strokeStyle = 'rgba(122,124,70,0.24)';
        ctx.lineWidth = 2.5;
        for (let y = -fh * K; y < fh * K; y += 9) {
          ctx.beginPath(); ctx.moveTo(-fw * K + 4, y); ctx.lineTo(fw * K - 4, y); ctx.stroke();
        }
        ctx.restore();
      });

      /* roads */
      const path = (pts, width, color) => {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = color; ctx.lineWidth = width;
        ctx.beginPath();
        pts.forEach((p, i) => {
          const c = toCanvas(p[0], p[1]);
          if (i === 0) ctx.moveTo(c[0], c[1]); else ctx.lineTo(c[0], c[1]);
        });
        ctx.stroke();
      };
      ROADS.forEach((road) => {
        path(road.pts, road.w * K + 16, 'rgba(158,102,64,0.30)');
        path(road.pts, road.w * K, 'rgba(203,152,106,0.95)');
        path(road.pts, road.w * K * 0.62, 'rgba(214,168,120,0.6)');
      });

      /* centre line on the boulevard, edge lines elsewhere */
      ctx.save();
      ctx.setLineDash([30, 28]);
      path([[0, 58], [0, 8], [0, -44]], 7, 'rgba(255,246,232,0.55)');
      ctx.setLineDash([]);
      ctx.restore();

      /* chequered plaza in front of the billboards */
      {
        const step = 2.2;
        const tile = step * K - 1;
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 32; col++) {
            const wx = -34 + col * step;
            const wz = -54 + row * step;
            const c = toCanvas(wx, wz);
            ctx.fillStyle = ((row + col) % 2) ? 'rgba(255,246,233,0.34)' : 'rgba(180,118,78,0.22)';
            ctx.fillRect(c[0], c[1], tile, tile);
          }
        }
      }

      /* zone plates */
      function plate(x, z, label, sub) {
        const [px, py] = toCanvas(x, z);
        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = 'rgba(194,103,74,0.13)';
        ctx.beginPath(); ctx.ellipse(0, 0, 176, 124, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(194,103,74,0.09)';
        ctx.beginPath(); ctx.ellipse(0, 0, 136, 94, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(96,58,40,0.42)';
        ctx.font = "700 30px 'Space Mono', monospace";
        ctx.textAlign = 'center';
        ctx.letterSpacing = '6px';
        ctx.fillText(label, 0, 6);
        ctx.font = "400 15px 'Space Mono', monospace";
        ctx.fillStyle = 'rgba(96,58,40,0.26)';
        ctx.fillText(sub, 0, 30);
        ctx.restore();
      }
      plate(0, -42, 'PROJECTS', 'SIX CASE STUDIES');
      plate(48, 4, 'PLAYGROUND', 'KNOCK IT OVER');
      plate(-48, 8, 'ABOUT', 'WHO DRIVES THIS');
      plate(0, 60, 'CONTACT', 'SAY HELLO');

      /* start pad */
      {
        const [px, py] = toCanvas(0, 8);
        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = 'rgba(255,246,233,0.45)';
        ctx.beginPath(); ctx.arc(0, 0, 132, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(194,103,74,0.85)'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(0, 0, 134, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(194,103,74,0.4)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 106, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(75,48,37,0.55)';
        ctx.font = "400 22px 'Space Mono', monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.letterSpacing = '6px';
        ctx.fillText('N', 0, -152);
        ctx.restore();
      }

      /* wordmark */
      ctx.save();
      const [wx, wy] = toCanvas(0, 32);
      ctx.translate(wx, wy);
      ctx.fillStyle = 'rgba(160,105,74,0.14)';
      ctx.font = "800 100px 'Inter Tight', sans-serif";
      ctx.textAlign = 'center';
      ctx.letterSpacing = '20px';
      ctx.fillText('DUNE ROVER', 0, 0);
      ctx.font = "400 24px 'Space Mono', monospace";
      ctx.fillStyle = 'rgba(160,105,74,0.2)';
      ctx.letterSpacing = '14px';
      ctx.fillText('DESERT  /  001', 0, 46);
      ctx.restore();

      /* tyre arcs near the start */
      ctx.strokeStyle = 'rgba(150,98,68,0.09)';
      ctx.lineWidth = 12;
      for (let i = 0; i < 3; i++) {
        const [cx2, cy2] = toCanvas(-8 - i * 1.6, 14);
        ctx.beginPath(); ctx.ellipse(cx2, cy2, 200 + i * 26, 124 + i * 18, -0.5 + i * 0.14, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }

  /* ── sky ─────────────────────────────────────────────────── */
  function buildSky(scene) {
    const geo = new THREE.SphereGeometry(420, 32, 20);
    const mtl = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0xd97f6b) },
        mid: { value: new THREE.Color(0xf3b592) },
        bottom: { value: new THREE.Color(0xffe9c9) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main(){
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
        varying vec3 vPos;
        void main(){
          float h = normalize(vPos).y;
          vec3 col = mix(bottom, mid, smoothstep(-0.02, 0.28, h));
          col = mix(col, top, smoothstep(0.22, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(geo, mtl);
    sky.frustumCulled = false;
    scene.add(sky);

    const sunTex = canvasTex(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,247,225,1)');
      g.addColorStop(0.42, 'rgba(255,230,186,0.92)');
      g.addColorStop(0.62, 'rgba(255,206,158,0.35)');
      g.addColorStop(1, 'rgba(255,196,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false }));
    sun.scale.set(180, 180, 1);
    sun.position.set(-190, 70, -330);
    scene.add(sun);

    const discTex = canvasTex(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,252,238,1)');
      g.addColorStop(0.86, 'rgba(255,244,214,0.96)');
      g.addColorStop(1, 'rgba(255,240,206,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex, transparent: true, depthWrite: false }));
    disc.scale.set(60, 60, 1);
    disc.position.set(-190, 70, -329);
    scene.add(disc);

    return { sky, sun, disc };
  }

  /* ── props (knockable) ───────────────────────────────────── */
  const propList = [];
  World.props = propList;

  function addProp(mesh, opts) {
    const o = opts || {};
    if (!mesh.parent && sceneRef) sceneRef.add(mesh);
    const p = {
      mesh, kind: o.kind || 'box',
      radius: o.radius || 0.6,
      mass: o.mass || 1,
      home: mesh.position.clone(),
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      rest: true,
      t: Math.random() * 10,
      baseY: mesh.position.y,
      floorOff: o.floorOff || 0,
      flying: false,
    };
    propList.push(p);
    return p;
  }

  function crate(size, color, x, y, z, rotY) {
    const g = new THREE.BoxGeometry(size, size, size);
    const m = mat(color, { roughness: 0.7 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, World.groundHeight(x, z) + y, z);
    if (rotY) mesh.rotation.y = rotY;
    mesh.castShadow = true; mesh.receiveShadow = true;
    return addProp(mesh, { kind: 'crate', radius: size * 0.62, mass: 1.1, floorOff: size / 2 });
  }

  function cone(x, z) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.86, 16), mat(0xe2764a, { roughness: 0.65 }));
    body.position.y = 0.5; body.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.16, 16), mat(C.cream));
    band.position.y = 0.44;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.72), mat(0xd06a44));
    base.position.y = 0.05; base.castShadow = true;
    grp.add(body, band, base);
    grp.position.set(x, World.groundHeight(x, z), z);
    return addProp(grp, { kind: 'cone', radius: 0.46, mass: 0.42 });
  }

  function pin(x, z) {
    const grp = new THREE.Group();
    const bodyMat = mat(C.cream, { roughness: 0.55 });
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.27, 0.62, 14), bodyMat);
    lower.position.y = 0.31;
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.16, 14), bodyMat);
    waist.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), bodyMat);
    head.position.y = 0.92;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.028, 6, 18), mat(C.terra));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.745;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.024, 6, 18), mat(C.terra));
    ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.22;
    grp.add(lower, waist, head, ring, ring2);
    grp.children.forEach((c) => { c.castShadow = true; });
    grp.position.set(x, World.groundHeight(x, z), z);
    return addProp(grp, { kind: 'pin', radius: 0.32, mass: 0.3 });
  }

  function ball(x, z) {
    const grp = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), mat(0x4d3b57, { roughness: 0.3, metalness: 0.18 }));
    b.position.y = 0.52; b.castShadow = true;
    const holeMat = mat(0x2c2230);
    [[-0.12, 0.2], [0.12, 0.2], [0, 0.34]].forEach(([hx, hz]) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 8), holeMat);
      hole.position.set(hx, 0.88, hz - 0.15);
      hole.rotation.x = 0.5;
      grp.add(hole);
    });
    grp.add(b);
    grp.position.set(x, World.groundHeight(x, z), z);
    return addProp(grp, { kind: 'ball', radius: 0.55, mass: 1.6 });
  }

  /* ── billboards ──────────────────────────────────────────── */
  const billboards = [];
  World.billboards = billboards;

  function makeBillboard(project, index, x, z, rotY) {
    const grp = new THREE.Group();
    grp.position.set(x, World.groundHeight(x, z), z);
    grp.rotation.y = rotY || 0;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.22, 1.5), mat(C.sandLight, { roughness: 0.9 }));
    plinth.position.set(0, 0.11, 0);
    plinth.receiveShadow = true;

    const legMat = mat(project.accent, { roughness: 0.6 });
    const legG = new THREE.BoxGeometry(0.19, 2.7, 0.19);
    const legL = new THREE.Mesh(legG, legMat);
    const legR = new THREE.Mesh(legG, legMat);
    legL.position.set(-1.9, 1.5, 0);
    legR.position.set(1.9, 1.5, 0);
    legL.castShadow = legR.castShadow = true;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.16, 0.22), mat(project.accent, { roughness: 0.55 }));
    frame.position.set(0, 4.3, 0);
    frame.castShadow = true;

    const inner = new THREE.Mesh(new THREE.BoxGeometry(4.34, 3.0, 0.16), mat(C.cream, { roughness: 0.9 }));
    inner.position.set(0, 4.3, 0.06);

    const photoGeo = new THREE.PlaneGeometry(4.02, 2.28);
    const photoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.set(0, 4.74, 0.15);

    const stripTex = textPanel(1024, 168, (ctx, w, h) => {
      ctx.fillStyle = '#fff4e2';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a2a22';
      ctx.font = "700 62px 'Inter Tight', sans-serif";
      ctx.textBaseline = 'middle';
      ctx.fillText(project.title.toUpperCase(), 40, h / 2 + 2);
      ctx.fillStyle = 'rgba(58,42,34,0.45)';
      ctx.font = "400 30px 'Space Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(project.meta.YEAR + '  /  ' + project.n, w - 40, h / 2 + 2);
    });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(4.02, 0.6), new THREE.MeshBasicMaterial({ map: stripTex }));
    strip.position.set(0, 3.18, 0.15);

    const badgeTex = textPanel(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4d488';
      ctx.font = "400 118px 'Instrument Serif', serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(project.n, w / 2, h / 2 + 6);
      ctx.strokeStyle = 'rgba(255,246,233,0.35)';
      ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
    });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: badgeTex }));
    badge.position.set(0, 6.06, 0.1);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6), mat(C.ink));
    pole.position.set(2.35, 1.7, 0);
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0); flagShape.lineTo(1.1, 0.32); flagShape.lineTo(0, 0.64); flagShape.lineTo(0, 0);
    const flag = new THREE.Mesh(
      new THREE.ShapeGeometry(flagShape),
      new THREE.MeshStandardMaterial({ color: project.accent, side: THREE.DoubleSide, roughness: 0.8 })
    );
    flag.position.set(2.35, 3.1, 0);
    flag.castShadow = true;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 6.3, 1.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(0, 3.15, 0);

    grp.add(plinth, legL, legR, inner, frame, photo, strip, badge, pole, flag, hit);
    grp.traverse((o) => { if (o.isMesh) o.castShadow = o !== photo && o !== strip && o !== badge && o !== hit; });

    const cardUrl = project.hero.replace('w=1400', 'w=1000').replace('h=800', 'h=560');
    loadTexture(cardUrl, (tex) => {
      photoMat.map = tex;
      photoMat.needsUpdate = true;
    });

    const bb = {
      index, project, group: grp, hit, flag, badge,
      pos: new THREE.Vector3(x, 0, z),
      photoMat,
      prompt: false,
    };
    hit.userData = { type: 'billboard', index };
    sceneRef.add(grp);
    World.addBox(x, z, 2.55, 0.85, rotY || 0);
    billboards.push(bb);
    return bb;
  }

  /* ── world build ─────────────────────────────────────────── */
  const ramps = [];
  const interactives = [];
  const colliders = [];
  World.colliders = colliders;

  World.addCircle = function (x, z, r) {
    const c = { type: 'c', x, z, r };
    colliders.push(c);
    return c;
  };
  World.addBox = function (x, z, hw, hd, rot) {
    const a = rot || 0;
    const c = { type: 'b', x, z, hw, hd, rot: a, cos: Math.cos(a), sin: Math.sin(a) };
    colliders.push(c);
    return c;
  };

  const _pen = { nx: 0, nz: 0, depth: 0, hits: 0 };
  World.resolveCircle = function (p, radius, out) {
    const o = out || _pen;
    o.nx = 0; o.nz = 0; o.depth = 0; o.hits = 0;
    for (let pass = 0; pass < 2; pass++) {
      let touched = 0;
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        let nx, nz, depth;
        if (c.type === 'c') {
          const dx = p.x - c.x, dz = p.z - c.z;
          const d = Math.hypot(dx, dz);
          const minD = c.r + radius;
          if (d >= minD) continue;
          if (d < 1e-4) { nx = 1; nz = 0; depth = minD; }
          else { nx = dx / d; nz = dz / d; depth = minD - d; }
        } else {
          const dx = p.x - c.x, dz = p.z - c.z;
          const lx = dx * c.cos - dz * c.sin;
          const lz = dx * c.sin + dz * c.cos;
          const hw = c.hw + radius, hd = c.hd + radius;
          if (Math.abs(lx) >= hw || Math.abs(lz) >= hd) continue;
          const px = hw - Math.abs(lx), pz = hd - Math.abs(lz);
          let nlx = 0, nlz = 0;
          if (px < pz) { nlx = lx >= 0 ? 1 : -1; depth = px; }
          else { nlz = lz >= 0 ? 1 : -1; depth = pz; }
          nx = nlx * c.cos + nlz * c.sin;
          nz = -nlx * c.sin + nlz * c.cos;
        }
        p.x += nx * depth;
        p.z += nz * depth;
        touched++;
        if (touched === 1 || depth > o.depth) { o.nx = nx; o.nz = nz; o.depth = depth; }
        o.hits = touched > o.hits ? touched : o.hits;
      }
      if (!touched) break;
    }
    return o.hits ? o : null;
  };

  const decor = {};
  let sceneRef = null;
  let sunLight = null;
  const waterMats = [];

  /* ── ground mesh ─────────────────────────────────────────── */
  function buildGroundMesh(scene, renderer) {
    const RINGS = 132, SECT = 192;
    const pos = [0, terrainAt(0, 0), 0];
    const uv = [0.5, 0.5];
    const idx = [];
    for (let i = 1; i <= RINGS; i++) {
      const rr = R * (i / RINGS);
      for (let j = 0; j < SECT; j++) {
        const a = (j / SECT) * Math.PI * 2;
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        pos.push(x, terrainAt(x, z), z);
        uv.push((x + R) / (2 * R), (z + R) / (2 * R));
      }
    }
    for (let j = 0; j < SECT; j++) {
      const a = 1 + j, b = 1 + ((j + 1) % SECT);
      idx.push(0, b, a);
    }
    for (let i = 0; i < RINGS - 1; i++) {
      for (let j = 0; j < SECT; j++) {
        const j2 = (j + 1) % SECT;
        const in0 = 1 + i * SECT + j, in1 = 1 + i * SECT + j2;
        const out0 = 1 + (i + 1) * SECT + j, out1 = 1 + (i + 1) * SECT + j2;
        idx.push(in0, out1, out0, in0, in1, out1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    /* soft vertex shading from the dunes themselves: valleys sit a shade
       deeper, crests catch the light — reads as terrain even at a distance */
    const nrm = geo.attributes.normal;
    const col = new Float32Array(pos.length);
    for (let i = 0; i < pos.length / 3; i++) {
      const y = pos[i * 3 + 1];
      const slope = Math.max(0, 1 - nrm.getY(i));
      const t = Math.max(-1, Math.min(1, y / 7));
      const k = 0.90 + 0.10 * t - slope * 0.22;
      col[i * 3] = Math.min(1, k * 1.02);
      col[i * 3 + 1] = Math.min(1, k * 0.985);
      col[i * 3 + 2] = Math.min(1, k * 0.94);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const tex = makeGroundTexture();
    tex.flipY = false;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;

    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.97, metalness: 0, vertexColors: true,
    }));
    mesh.receiveShadow = true;
    scene.add(mesh);

    /* if the winding came out facing down, flip it */
    scene.updateMatrixWorld();
    return mesh;
  }

  /* ── water ───────────────────────────────────────────────── */
  function buildPond(scene, pond, index) {
    const shapeR = (a) => pond.r * (1 + 0.055 * Math.sin(3 * a + 1.1) + 0.035 * Math.sin(5 * a + 2.3)) * 0.88;
    const SEG = 72;
    const wpos = [0, 0, 0];
    const wuv = [0.5, 0.5];
    const widx = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const rr = shapeR(a);
      wpos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      wuv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    }
    for (let i = 0; i < SEG; i++) {
      widx.push(0, 1 + ((i + 1) % SEG), 1 + i);
    }
    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
    waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2));
    waterGeo.setIndex(widx);
    waterGeo.computeVertexNormals();
    const waterMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color(0x14545f) },
        uShallow: { value: new THREE.Color(0x59b7a8) },
        uSky: { value: new THREE.Color(0xffe9c9) },
        uSeed: { value: index * 3.7 },
        uCenter: { value: new THREE.Vector2(pond.x, pond.z) },
        uR: { value: pond.waterR },
      },
      vertexShader: `
        varying vec3 vW;
        void main(){
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `
        uniform float uTime; uniform float uSeed; uniform float uR;
        uniform vec2 uCenter;
        uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky;
        varying vec3 vW;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        void main(){
          vec2 p = vW.xz * 0.5 + uSeed;
          float t = uTime * 0.30;
          float n = noise(p + vec2(t, t * 0.6)) * 0.6 + noise(p * 2.4 - vec2(t * 0.8, t * 0.45)) * 0.4;
          vec3 col = mix(uDeep, uShallow, 0.18 + n * 0.85);
          float depth = length(vW.xz - uCenter) / max(uR, 0.001);
          col *= 0.80 + 0.34 * smoothstep(0.10, 1.0, depth);
          float glint = pow(noise(p * 3.2 + vec2(-t * 1.5, t * 1.2)), 14.0);
          col += vec3(1.0, 0.97, 0.90) * glint * 0.45;
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 2.2);
          col = mix(col, uSky, fres * 0.40);
          gl_FragColor = vec4(col, 0.95);
        }`,
    });
    waterMats.push(waterMat);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(pond.x, pond.level, pond.z);
    water.receiveShadow = false;
    scene.add(water);

    /* sandy beach stones and reeds around the shore */
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.25;
      const rr = pond.r * (0.86 + Math.random() * 0.14);
      const x = pond.x + Math.cos(a) * rr, z = pond.z + Math.sin(a) * rr;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + Math.random() * 0.4, 0), mat(0xcaa075, { roughness: 1 }));
      st.position.set(x, World.groundHeight(x, z) + 0.15, z);
      st.rotation.set(Math.random(), Math.random(), Math.random());
      st.castShadow = true;
      scene.add(st);
    }

    const reedMat = mat(0x7d8f55, { roughness: 0.95 });
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + Math.random() * 0.2;
      const rr = pond.r * (0.9 + Math.random() * 0.22);
      const x = pond.x + Math.cos(a) * rr, z = pond.z + Math.sin(a) * rr;
      const g = new THREE.Group();
      const n = 2 + (i % 3);
      for (let k = 0; k < n; k++) {
        const h = 0.6 + Math.random() * 0.7;
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, h, 4), reedMat);
        blade.position.set((Math.random() - 0.5) * 0.5, h / 2, (Math.random() - 0.5) * 0.5);
        blade.rotation.z = (Math.random() - 0.5) * 0.35;
        g.add(blade);
      }
      g.position.set(x, World.groundHeight(x, z), z);
      scene.add(g);
    }

    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * pond.waterR * 0.66;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.45 + Math.random() * 0.35, 12), mat(0x6a8f52, { roughness: 0.9 }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(pond.x + Math.cos(a) * rr, pond.level + 0.03, pond.z + Math.sin(a) * rr);
      scene.add(pad);
    }

    /* the water is solid ground for the car: it stops on the beach */
    World.addCircle(pond.x, pond.z, pond.r + 1.2);
  }

  /* ── desert flora + rocks ────────────────────────────────── */
  function palm(x, z, s) {
    const scale = s || 1;
    const g = new THREE.Group();
    const trunkMat = mat(0xa77e52, { roughness: 0.95 });
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.06 * scale, 1.6 * scale, 0.03 * scale),
      new THREE.Vector3(0.28 * scale, 3.2 * scale, 0.02 * scale),
      new THREE.Vector3(0.72 * scale, 4.7 * scale, -0.02 * scale),
      new THREE.Vector3(1.18 * scale, 5.9 * scale, 0),
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.17 * scale, 7, false), trunkMat);
    trunk.castShadow = true;
    g.add(trunk);

    const crown = new THREE.Group();
    const tip = curve.getPoint(1);
    crown.position.copy(tip);
    const frondMat = mat(0x86a35f, { roughness: 0.9, side: THREE.DoubleSide });
    const frondGeo = new THREE.ConeGeometry(0.26 * scale, 3.1 * scale, 4);
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 8 : 5;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.4 + Math.random() * 0.1;
        const arm = new THREE.Group();
        arm.rotation.y = a;
        const droop = (ring === 0 ? 0.34 : 0.12) + (i % 3) * 0.09;
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.rotation.z = -(Math.PI / 2 + droop);
        frond.position.set(Math.cos(droop) * 1.45 * scale, -Math.sin(droop) * 1.45 * scale + 0.16 * scale, 0);
        frond.scale.set(ring === 0 ? 1 : 0.72, 1, 0.24);
        frond.castShadow = true;
        arm.add(frond);
        crown.add(arm);
      }
    }
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 8, 6), mat(0x8a6a3c));
    crown.add(nut);
    g.add(crown);
    g.position.set(x, World.groundHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI;
    sceneRef.add(g);
    World.addCircle(x, z, 0.5 * scale);
    decor.palms = decor.palms || [];
    decor.palms.push({ crown, phase: Math.random() * 6 });
    return g;
  }

  function cactus(x, z, s) {
    const scale = s || 1;
    const g = new THREE.Group();
    const green = mat(0x7fa06a, { roughness: 0.85 });
    const trunkH = 2.3 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.34 * scale, trunkH, 10), green);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 10, 8), green);
    top.position.y = trunkH;
    top.scale.y = 0.75;
    g.add(trunk, top);
    const arms = 2 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + Math.random();
      const side = new THREE.Group();
      side.position.set(Math.cos(a) * 0.24 * scale, trunkH * (0.42 + i * 0.12), Math.sin(a) * 0.24 * scale);
      side.rotation.y = -a;
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.18 * scale, 0.72 * scale, 8), green);
      up.position.set(0.42 * scale, 0.18 * scale, 0);
      up.rotation.z = Math.PI / 2.4;
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.85 * scale, 8), green);
      fore.position.set(0.82 * scale, 0.62 * scale, 0);
      fore.castShadow = true;
      up.castShadow = true;
      side.add(up, fore);
      g.add(side);
    }
    g.position.set(x, World.groundHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI;
    sceneRef.add(g);
    World.addCircle(x, z, 0.42 * scale);
    return g;
  }

  function acacia(x, z, s) {
    const scale = s || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.28 * scale, 2.4 * scale, 8), mat(0x9a7248, { roughness: 0.95 }));
    trunk.position.y = 1.2 * scale;
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 12, 8), mat(0x93a868, { roughness: 0.95 }));
      const a = (i / 3) * Math.PI * 2;
      canopy.position.set(Math.cos(a) * 0.9 * scale, 2.6 * scale + (i % 2) * 0.35, Math.sin(a) * 0.9 * scale);
      canopy.scale.set(1, 0.42, 1);
      canopy.castShadow = true;
      g.add(canopy);
    }
    g.position.set(x, World.groundHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI;
    sceneRef.add(g);
    World.addCircle(x, z, 0.55 * scale);
    return g;
  }

  function shrub(x, z, s) {
    const scale = s || 1;
    const g = new THREE.Group();
    const cols = [0x94a76e, 0x86995f, 0xa8b47c];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry((0.55 + Math.random() * 0.3) * scale, 9, 7), mat(cols[i % 3], { roughness: 1 }));
      b.position.set((Math.random() - 0.5) * 1.1 * scale, 0.34 * scale, (Math.random() - 0.5) * 1.1 * scale);
      b.scale.y = 0.7;
      b.castShadow = true;
      g.add(b);
    }
    g.position.set(x, World.groundHeight(x, z), z);
    sceneRef.add(g);
    return g;
  }

  function boulder(x, z, s, sx, sy) {
    const scale = s || 1;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * scale, 0), mat(0xc08c62, { roughness: 1 }));
    m.position.set(x, World.groundHeight(x, z) + 0.26 * scale, z);
    m.scale.set(sx || 1, sy || 0.8, 1);
    m.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    m.castShadow = true; m.receiveShadow = true;
    sceneRef.add(m);
    World.addCircle(x, z, 0.46 * scale);
    return m;
  }

  function rockCylinder(rTop, rBot, h, seed, tiers) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, 13, tiers || 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const rad = Math.hypot(x, z);
      if (rad < 0.001) continue;
      const a = Math.atan2(z, x);
      const k = 1 + 0.085 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 6 + seed * 2.1);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function mesa(x, z, r, h) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(rockCylinder(r * 0.82, r, h * 0.66, 1.3, 3), mat(0xc07a52, { roughness: 1, flatShading: true }));
    base.position.y = h * 0.33;
    base.castShadow = true;
    const upper = new THREE.Mesh(rockCylinder(r * 0.72, r * 0.84, h * 0.34, 2.7, 2), mat(0xcd8b5e, { roughness: 1, flatShading: true }));
    upper.position.y = h * 0.83;
    upper.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.7, 0.45, 13), mat(0xc98a5c, { roughness: 1, flatShading: true }));
    cap.position.y = h - 0.1;
    cap.castShadow = true;
    g.add(base, upper, cap);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = r * (0.55 + Math.random() * 0.55);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.4, 0), mat(0xb9734f, { roughness: 1 }));
      rock.position.set(Math.cos(a) * rr, -h * 0.08 + Math.random() * 0.5, Math.sin(a) * rr);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      g.add(rock);
    }
    g.position.set(x, groundMin(x, z, r * 0.9) - 0.35, z);   // the base sinks into the dune
    g.rotation.y = Math.random() * Math.PI;
    sceneRef.add(g);
    World.addCircle(x, z, r * 0.92);
    return g;
  }

  function windmill(x, z, s) {
    const scale = s || 1;
    const g = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * scale, 1.25 * scale, 6.4 * scale, 8), mat(0xd7a377, { roughness: 0.9 }));
    tower.position.y = 3.2 * scale;
    tower.castShadow = true;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0 * scale, 1.1 * scale, 8), mat(0xa9603f, { roughness: 0.85 }));
    cap.position.y = 6.9 * scale;
    cap.castShadow = true;
    const hub = new THREE.Group();
    hub.position.set(0, 6.4 * scale, 0.9 * scale);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 2.6 * scale, 0.08 * scale), mat(0xfff4e2, { roughness: 0.8 }));
      blade.position.set(0, 1.3 * scale, 0);
      const arm = new THREE.Group();
      arm.rotation.z = (i / 4) * Math.PI * 2;
      arm.add(blade);
      hub.add(arm);
    }
    const hubCap = new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 8, 6), mat(0xa9603f));
    hub.add(hubCap);
    g.add(tower, cap, hub);
    g.position.set(x, groundMin(x, z, 1.3 * scale) - 0.1, z);
    g.rotation.y = Math.random() * 0.6;
    sceneRef.add(g);
    decor.windmills = decor.windmills || [];
    decor.windmills.push(hub);
    World.addCircle(x, z, 1.1 * scale);
    return g;
  }

  function tree(x, z, scale, kind) {
    const g = new THREE.Group();
    const s = scale || 1;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * s, 0.25 * s, 2.1 * s, 8), mat(0xa97a55, { roughness: 0.9 }));
    trunk.position.y = 1.05 * s;
    trunk.castShadow = true;
    g.add(trunk);
    if (kind === 'pine') {
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.15 * s, 1.5 * s, 9), mat(0x93a868, { roughness: 0.9 }));
      c1.position.y = 2.25 * s; c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.82 * s, 1.2 * s, 9), mat(0xa2b878, { roughness: 0.9 }));
      c2.position.y = 3.15 * s; c2.castShadow = true;
      g.add(c1, c2);
    } else {
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.25 * s, 12, 10), mat(0x9db075, { roughness: 0.92 }));
      leaves.position.y = 2.5 * s;
      leaves.scale.set(1, 0.78, 1);
      leaves.castShadow = true;
      const leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.85 * s, 10, 8), mat(0xb0c084, { roughness: 0.92 }));
      leaves2.position.set(0.55 * s, 2.05 * s, 0.3 * s);
      leaves2.castShadow = true;
      g.add(leaves, leaves2);
    }
    g.position.set(x, World.groundHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI;
    sceneRef.add(g);
    World.addCircle(x, z, 0.62 * s);
    return g;
  }

  function groundMin(x, z, r) {
    let m = World.groundHeight(x, z);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      m = Math.min(m, World.groundHeight(x + Math.cos(a) * r, z + Math.sin(a) * r));
    }
    return m;
  }

  function house(x, z, w, h, d, rot, color, roofColor) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color || C.terra, { roughness: 0.88 }));
    body.position.y = h / 2;
    body.castShadow = true; body.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.55, 4), mat(roofColor || C.cream, { roughness: 0.9 }));
    roof.position.y = h + h * 0.27;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x6d8b96, roughness: 0.35, metalness: 0.2 });
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, h * 0.26, 0.06), windowMat);
    win.position.set(0, h * 0.6, d / 2 + 0.02);
    // a buried foundation so a house on a slope never shows daylight underneath
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 3.2, d * 0.98), mat(0xb07a56, { roughness: 1 }));
    plinth.position.y = -1.4;
    plinth.receiveShadow = true;
    g.add(plinth, body, roof, win);
    g.position.set(x, groundMin(x, z, Math.max(w, d) * 0.55) - 0.15, z);   // bed it into the slope
    g.rotation.y = rot || 0;
    sceneRef.add(g);
    World.addBox(x, z, w / 2 + 0.1, d / 2 + 0.1, rot || 0);
    return g;
  }

  function buildRamp(def) {
    const { w, l, h } = def;
    const geo = new THREE.BufferGeometry();
    const hw = w / 2, hl = l / 2;
    const v = [
      -hw, 0, -hl, hw, 0, -hl, hw, h, hl, -hw, h, hl,
      -hw, 0, hl, hw, 0, hl, hw, h, hl, -hw, h, hl,
      -hw, 0, -hl, -hw, 0, hl, -hw, h, hl,
      hw, 0, -hl, hw, h, hl, hw, 0, hl,
    ];
    const uv = [
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1,
      0, 0, 1, 1, 1, 0,
    ];
    const idx = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 11, 12, 13];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.clearGroups();
    geo.addGroup(0, 6, 0);
    geo.addGroup(6, 12, 1);

    const stripes = canvasTex(256, 256, (ctx, w2, h2) => {
      ctx.fillStyle = '#f4d9b4'; ctx.fillRect(0, 0, w2, h2);
      ctx.fillStyle = '#cf6b4c';
      ctx.save();
      ctx.translate(w2 / 2, h2 / 2);
      ctx.rotate(-Math.PI / 4);
      for (let i = -6; i < 7; i++) ctx.fillRect(-w2, i * 42, w2 * 2, 18);
      ctx.restore();
    });
    stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
    stripes.repeat.set(1, 2);

    const grp = new THREE.Group();
    const baseY = World.groundHeight(def.x, def.z);
    grp.position.set(def.x, baseY, def.z);
    grp.rotation.y = Math.atan2(def.dx, def.dz);

    const mesh = new THREE.Mesh(geo, [mat(0xf7dfbc, { map: stripes, roughness: 0.9 }), mat(def.color || C.clay, { roughness: 0.9 })]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    grp.add(mesh);

    const slopeAng = Math.atan2(h, l);
    const railLen = Math.hypot(h, l);
    [-1, 1].forEach((sgn) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, railLen), mat(C.cream, { roughness: 0.85 }));
      rail.position.set(sgn * hw, h / 2 + 0.06, 0);
      rail.rotation.x = -slopeAng;
      rail.castShadow = true;
      grp.add(rail);
    });

    sceneRef.add(grp);
    ramps.push(Object.assign({}, def, { mesh: grp, baseY }));
    return grp;
  }

  World.groundHeight = function (x, z) {
    let y = terrainAt(x, z);
    for (let i = 0; i < ramps.length; i++) {
      const r = ramps[i];
      const dx = x - r.x, dz = z - r.z;
      const along = dx * r.dx + dz * r.dz;
      const side = -dx * r.dz + dz * r.dx;
      if (Math.abs(side) <= r.w / 2 && along >= -r.l / 2 && along <= r.l / 2) {
        const t = (along + r.l / 2) / r.l;
        y = Math.max(y, r.baseY + r.h * t);
      }
    }
    return y;
  };

  /* ============================================================
     BUILD
     ============================================================ */
  World.init = function (scene, renderer) {
    sceneRef = scene;
    scene.fog = new THREE.Fog(0xf4c8a4, 145, 420);

    const hemi = new THREE.HemisphereLight(0xffe2c8, 0x8a5433, 0.26);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffe8d2, 0.04);
    scene.add(amb);

    sunLight = new THREE.DirectionalLight(0xffdcb4, 0.74);
    sunLight.position.set(-30, 44, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    const sc = sunLight.shadow.camera;
    sc.left = -52; sc.right = 52; sc.top = 52; sc.bottom = -52; sc.near = 1; sc.far = 180;
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.03;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const fill = new THREE.DirectionalLight(0xffd2c4, 0.1);
    fill.position.set(28, 16, -30);
    scene.add(fill);

    decor.sky = buildSky(scene);

    /* island rim: cliff + warm rock underneath */
    const cliffMat = mat(0xbe7150, { roughness: 0.95 });
    const cliff = new THREE.Mesh(new THREE.CylinderGeometry(R, R - 5, 9.5, 96, 1, true), cliffMat);
    cliff.position.y = -4.75;
    cliff.receiveShadow = true;
    scene.add(cliff);

    const rock = new THREE.Mesh(
      new THREE.SphereGeometry(R - 4, 48, 22, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      mat(0xa9634a, { roughness: 1 })
    );
    rock.position.y = -9.4;
    rock.scale.set(1, 0.85, 1);
    scene.add(rock);

    buildGroundMesh(scene, renderer);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.2, 0.5, 8, 128), mat(C.sandDeep, { roughness: 1 }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.05;
    scene.add(rim);

    /* ── oasis ponds ── */
    PONDS.forEach((p, i) => buildPond(scene, p, i));

    /* ── mesas ── */
    [[70, -50, 12, 9], [-68, -52, 13, 10.5], [-66, 46, 10, 8], [44, 76, 9, 7], [84, -10, 9, 7.5]]
      .forEach(([x, z, r, h]) => mesa(x, z, r, h));

    /* ── houses ── */
    house(-70, -10, 5, 3.4, 5, 0.4, 0xd9a688, 0xfff4e2);
    house(-72, 26, 3.6, 2.6, 4, -0.3, 0xc98f74, 0xf7e2c8);
    house(72, 16, 4.4, 3, 4.4, 0.8, 0xdfae8e, 0xfff4e2);
    house(68, -30, 4, 2.8, 3.6, -0.6, 0xd6a184, 0xf9ead2);
    house(20, 72, 4, 2.6, 4, 1.1, 0xdca98c, 0xfff4e2);

    /* ── playful desert props ── */
    windmill(-58, 52, 1);
    windmill(26, 44, 0.85);

    /* palms ring the oasis ponds */
    [[34, 60, 1.05], [60, 42, 0.95], [44, 68, 0.9], [34, 44, 0.85],
     [-50, -38, 1], [-72, -22, 0.9], [-56, -20, 0.8],
     [-18, 78, 0.95], [-34, 64, 0.85], [6, 74, 0.8]]
      .forEach(([x, z, s]) => palm(x, z, s));

    /* cacti in the open sand */
    [[-60, -30], [-64, -16], [-56, -44], [-72, 10], [64, -16], [76, -34], [58, -56],
     [30, -64], [-8, -64], [16, -66], [56, 44], [36, 52], [20, 40], [-16, 40],
     [-44, 62], [8, 76], [24, 70], [-80, 34]]
      .forEach(([x, z]) => cactus(x, z, 0.85 + Math.random() * 0.4));

    /* acacias + a few pines on the far fields */
    [[-30, -14], [24, -12], [-18, 22], [58, -6], [-46, -18], [12, -58], [-60, 66], [40, -60]]
      .forEach(([x, z], i) => (i % 3 === 2 ? tree(x, z, 0.9, 'pine') : acacia(x, z, 0.9 + (i % 4) * 0.08)));

    /* foreground furniture around the start pad */
    [[-4.4, 1.6], [-3.4, -1.4], [4.2, 0.6], [5.4, 3.6], [-5.2, 5.2]].forEach(([cx, cz]) => cone(cx, cz));
    crate(0.9, C.butter, 5.6, 0.5, -2.6, 0.5);
    crate(0.7, C.mint, 6.3, 0.4, -1.6, 0.2);
    for (let i = 0; i < 3; i++) {
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.24, 8, 18), mat(0x4a3f3b, { roughness: 0.95 }));
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(-6.6, World.groundHeight(-6.6, -4.2) + 0.26 + i * 0.5, -4.2);
      tyre.castShadow = true;
      scene.add(tyre);
    }
    World.addCircle(-6.6, -4.2, 0.78);

    /* ── scatter: rocks, shrubs, straw tufts — seeded, off every lane ── */
    let scatterSeed = 20261116;
    const srnd = () => { scatterSeed = (scatterSeed * 16807) % 2147483647; return scatterSeed / 2147483647; };

    const onLane = (x, z, pad) => {
      const p = pad === undefined ? 3.5 : pad;
      const cx = Math.round(x / GRID), cz = Math.round(z / GRID);
      for (let ix = cx - 1; ix <= cx + 1; ix++) {
        for (let iz = cz - 1; iz <= cz + 1; iz++) {
          const arr = roadGrid.get(ix + ',' + iz);
          if (!arr) continue;
          for (let k = 0; k < arr.length; k++) {
            const s = arr[k];
            if (Math.hypot(x - s.x, z - s.z) < s.w * 0.5 + p) return true;
          }
        }
      }
      for (let i = 0; i < PADS.length; i++) {
        const pd = PADS[i];
        if (Math.hypot(x - pd.x, z - pd.z) < pd.r + p) return true;
      }
      for (let i = 0; i < PONDS.length; i++) {
        const pd = PONDS[i];
        if (Math.hypot(x - pd.x, z - pd.z) < pd.r + 5) return true;
      }
      if (Math.hypot(x, z) > R - 9) return true;
      const tp = World.TOUR_PATH;
      for (let i = 0; i < tp.length - 1; i++) {
        const ax = tp[i][0], az = tp[i][1], bx = tp[i + 1][0], bz = tp[i + 1][1];
        const dx = bx - ax, dz = bz - az;
        const l2 = dx * dx + dz * dz || 1;
        let k = ((x - ax) * dx + (z - az) * dz) / l2;
        k = Math.max(0, Math.min(1, k));
        if (Math.hypot(x - (ax + dx * k), z - (az + dz * k)) < 4.5) return true;
      }
      return false;
    };

    const rockMat = mat(0xc48f6d, { roughness: 1 });
    const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
    let placed = 0, tries = 0;
    while (placed < 34 && tries < 800) {
      tries++;
      const a = srnd() * Math.PI * 2;
      const rr = 10 + srnd() * (R - 24);
      const px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
      if (onLane(px, pz)) continue;
      const sx = 0.7 + srnd() * 1.2, sz = 0.7 + srnd() * 1.2, sy = 0.5 + srnd() * 0.7;
      const m = new THREE.Mesh(rockGeo, rockMat);
      m.position.set(px, World.groundHeight(px, pz) + 0.26, pz);
      m.scale.set(sx, sy, sz);
      m.rotation.set(srnd(), srnd(), srnd());
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      World.addCircle(px, pz, 0.5 * (sx + sz));
      placed++;
    }
    let bushes = 0, btries = 0;
    while (bushes < 26 && btries < 500) {
      btries++;
      const a = srnd() * Math.PI * 2;
      const rr = 12 + srnd() * (R - 26);
      const px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
      if (onLane(px, pz)) continue;
      shrub(px, pz, 0.8 + srnd() * 0.6);
      bushes++;
    }

    /* hay rolls: parked in the west field, far from any road */
    [[-56, -12], [-58, -8], [-53, -16], [-60, -15]].forEach(([bx, bz], i) => {
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.5, 16), mat(0xe8c56f, { roughness: 0.95 }));
      bale.rotation.z = Math.PI / 2;
      bale.position.set(bx, World.groundHeight(bx, bz) + 1.05, bz);
      bale.castShadow = true;
      scene.add(bale);
      World.addBox(bx, bz, 0.8, 1.1, (i % 2) * 0.35);
    });

    /* straw tufts, one instanced draw call */
    {
      const N = 900;
      const tuftGeo = new THREE.ConeGeometry(0.1, 0.52, 3, 1);
      tuftGeo.translate(0, 0.26, 0);
      const tuftMat = new THREE.MeshStandardMaterial({ color: 0x9a9a63, roughness: 0.98 });
      const inst = new THREE.InstancedMesh(tuftGeo, tuftMat, N);
      const mtx = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const vscale = new THREE.Vector3();
      const vpos = new THREE.Vector3();
      const fields = [[30, 34, 24], [-20, -62, 26], [-58, 30, 22], [64, 12, 18]];
      let n = 0, guard = 0;
      while (n < N && guard < N * 8) {
        guard++;
        let px, pz;
        if (srnd() < 0.62) {
          const f = fields[Math.floor(srnd() * fields.length)];
          const a = srnd() * Math.PI * 2, rr = Math.sqrt(srnd()) * f[2];
          px = f[0] + Math.cos(a) * rr; pz = f[1] + Math.sin(a) * rr;
        } else {
          const a = srnd() * Math.PI * 2, rr = 14 + srnd() * (R - 30);
          px = Math.cos(a) * rr; pz = Math.sin(a) * rr;
        }
        if (onLane(px, pz, 2)) continue;
        if (Math.abs(pz + 48) < 13 && Math.abs(px) < 40) continue;   // keep the plaza clean
        const gx = World.groundHeight(px + 1, pz) - World.groundHeight(px - 1, pz);
        const gz = World.groundHeight(px, pz + 1) - World.groundHeight(px, pz - 1);
        if (Math.hypot(gx, gz) > 0.9) continue;
        vpos.set(px, World.groundHeight(px, pz), pz);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), srnd() * Math.PI * 2);
        const s = 0.55 + srnd() * 0.65;
        vscale.set(s, s * (0.7 + srnd() * 0.7), s);
        mtx.compose(vpos, q, vscale);
        inst.setMatrixAt(n++, mtx);
      }
      inst.count = n;
      inst.instanceMatrix.needsUpdate = true;
      inst.castShadow = false;
      scene.add(inst);
    }

    /* ── ramps ── */
    buildRamp({ x: 56, z: 14, w: 5.4, l: 8, h: 1.9, dx: 0, dz: 1, color: 0xb85c3f });

    /* ── billboards: six in a shallow arc facing +z ── */
    const bbX = [-30, -18, -6, 6, 18, 30];
    const bbZ = [-49, -50, -50.6, -50.6, -50, -49];
    World.PROJECTS.forEach((p, i) => {
      makeBillboard(p, i, bbX[i], bbZ[i], Math.atan2(-bbX[i], 26) * 0.35);
    });

    /* projects sign beside the row */
    const pj = new THREE.Group();
    const pjPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 8), mat(0xa97a55));
    pjPole.position.y = 1.8;
    const pjTex = textPanel(768, 320, (ctx, w, h) => {
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4d488';
      ctx.font = "400 104px 'Instrument Serif', serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PROJECTS', w / 2, h / 2 - 18);
      ctx.fillStyle = 'rgba(255,246,233,0.62)';
      ctx.font = "400 28px 'Space Mono', monospace";
      ctx.letterSpacing = '8px';
      ctx.fillText('SIX CASE STUDIES', w / 2, h / 2 + 74);
    });
    const pjBoard = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.46, 0.14), mat(C.cream, { roughness: 0.85 }));
    pjBoard.position.y = 3.4;
    const pjFace = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({ map: pjTex }));
    pjFace.position.set(0, 3.4, 0.085);
    const pjHit = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.7, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
    pjHit.position.y = 3.4;
    pjHit.userData = { type: 'projects' };
    pj.add(pjPole, pjBoard, pjFace, pjHit);
    pj.position.set(-39, World.groundHeight(-39, -43), -43);
    pj.rotation.y = 0.42;
    scene.add(pj);
    interactives.push(pjHit);
    World.addCircle(-39, -43, 0.42);

    /* ── playground ── */
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col <= row; col++) {
        const x = 48 + (col - row / 2) * 1.15;
        const z = 12 + row * 1.05;
        pin(x, z);
      }
    }
    ball(48, 16.4);

    const towerSpots = [[42.6, 0.4], [43.8, 3.4], [53.6, -0.6], [52.4, 3.6]];
    towerSpots.forEach(([tx, tz], ti) => {
      const cols = [C.butter, C.mint, 0xe3a184, C.cream];
      for (let i = 0; i < 3; i++) {
        crate(0.95, cols[(i + ti) % cols.length], tx + (i === 2 ? 0.08 : 0), 0.5 + i * 1.0, tz);
      }
    });
    crate(0.8, C.mint, 50.8, 0.42, 8.6, 0.4);
    crate(0.8, C.butter, 44.4, 0.42, 9.4, -0.2);
    crate(1.1, 0xe3a184, 51.2, 0.58, -3.6, 0.6);
    [[54.5, 6.2], [55.6, 9.2], [53.8, 11.6], [40.4, 6.6], [41.0, 9.2], [44.6, 14.0]].forEach(([cx, cz]) => cone(cx, cz));

    const pgSign = new THREE.Group();
    const pgPole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 8), mat(0xa97a55));
    pgPole.position.y = 2.1;
    const pgTex = textPanel(768, 220, (ctx, w, h) => {
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4d488';
      ctx.font = "400 96px 'Instrument Serif', serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PLAYGROUND', w / 2, h / 2 + 4);
    });
    const pgBoard = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.98, 0.12), mat(C.cream, { roughness: 0.85 }));
    pgBoard.position.y = 4.0;
    const pgFace = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.9), new THREE.MeshBasicMaterial({ map: pgTex }));
    pgFace.position.set(0, 4.0, 0.075);
    const pgHit = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
    pgHit.position.y = 4.0;
    pgHit.userData = { type: 'playground' };
    pgSign.add(pgPole, pgBoard, pgFace, pgHit);
    pgSign.position.set(61, World.groundHeight(61, 24), 24);
    pgSign.rotation.y = -0.7;
    scene.add(pgSign);
    interactives.push(pgHit);
    World.addCircle(61, 24, 0.42);

    /* ── about zone ── */
    const ab = new THREE.Group();
    const abPlinth = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.3, 2.2), mat(C.sandLight));
    abPlinth.position.y = 0.15; abPlinth.receiveShadow = true;
    const abTex = textPanel(1024, 640, (ctx, w, h) => {
      ctx.fillStyle = '#fff4e2'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(194,103,74,0.14)';
      ctx.fillRect(0, 0, w, 96);
      ctx.fillStyle = '#c2674a';
      ctx.font = "400 34px 'Space Mono', monospace";
      ctx.letterSpacing = '10px';
      ctx.fillText('ABOUT  /  DUNE ROVER', 56, 62);
      ctx.fillStyle = '#3a2a22';
      ctx.font = "400 118px 'Instrument Serif', serif";
      ctx.letterSpacing = '-2px';
      ctx.fillText('A developer who', 56, 218);
      ctx.font = "italic 400 118px 'Instrument Serif', serif";
      ctx.fillStyle = '#c2674a';
      ctx.fillText('likes the toy version', 56, 336);
      ctx.fillStyle = 'rgba(58,42,34,0.72)';
      ctx.font = "400 30px 'Inter Tight', sans-serif";
      ctx.letterSpacing = '0px';
      const lines = [
        'Six years building interactive worlds for museums, studios and',
        'brands that would rather be remembered than scrolled past.',
        '',
        'THREE.JS   ·   GSAP   ·   GLSL   ·   TYPESCRIPT   ·   BRAND',
      ];
      lines.forEach((l, i) => ctx.fillText(l, 56, 418 + i * 44));
      ctx.fillStyle = 'rgba(58,42,34,0.34)';
      ctx.font = "400 24px 'Space Mono', monospace";
      ctx.fillText('CLICK TO OPEN THE LONG VERSION', 56, 602);
    });
    const abBack = new THREE.Mesh(new THREE.BoxGeometry(7.3, 4.6, 0.22), mat(C.cream, { roughness: 0.9 }));
    abBack.position.set(0, 3.1, -0.02);
    abBack.castShadow = true;
    const abBoard = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.5), new THREE.MeshBasicMaterial({ map: abTex }));
    abBoard.position.set(0, 3.1, 0.1);
    const abHit = new THREE.Mesh(new THREE.BoxGeometry(7.4, 4.8, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
    abHit.position.set(0, 3.1, 0);
    abHit.userData = { type: 'about' };
    ab.add(abPlinth, abBack, abBoard, abHit);
    ab.position.set(-58, World.groundHeight(-58, 26), 26);
    ab.rotation.y = Math.PI + 0.5;
    scene.add(ab);
    interactives.push(abHit);
    World.addBox(-58, 26, 3.8, 1.15, Math.PI + 0.5);

    const skillNames = ['THREE', 'GSAP', 'GLSL', 'TYPE', 'BRAND'];
    const skillCols = [C.terra, C.mint, C.butter, C.clay, 0xb07fa0];
    decor.cubes = [];
    const abBase = World.groundHeight(-58, 26);
    skillNames.forEach((name, i) => {
      const tex = canvasTex(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#fff4e2'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(58,42,34,0.2)'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, w - 12, h - 12);
        ctx.fillStyle = '#3a2a22';
        ctx.font = "700 46px 'Inter Tight', sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(name, w / 2, h / 2);
      });
      const cubeMat = new THREE.MeshStandardMaterial({ color: skillCols[i], roughness: 0.6 });
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), [cubeMat, cubeMat, cubeMat, cubeMat, new THREE.MeshBasicMaterial({ map: tex }), cubeMat]);
      cube.position.set(-58 + 2.6 + (i - 2) * 1.35, abBase + 6.4, 26 + (i % 2 ? 0.2 : -0.2));
      cube.castShadow = true;
      scene.add(cube);
      decor.cubes.push({ mesh: cube, base: cube.position.y, phase: i * 0.7 });
    });

    /* ── contact signpost ── */
    const sp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 4.6, 10), mat(0x9c6b4a, { roughness: 0.95 }));
    pole.position.y = 2.3; pole.castShadow = true;
    const arrowTex = (txt) => textPanel(512, 168, (ctx, w, h) => {
      ctx.fillStyle = '#fff4e2'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a2a22';
      ctx.font = "400 74px 'Instrument Serif', serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, w / 2, h / 2 + 4);
      ctx.beginPath();
      ctx.fillStyle = '#c2674a';
      ctx.moveTo(w - 12, h / 2); ctx.lineTo(w - 52, 34); ctx.lineTo(w - 52, h - 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff4e2';
      ctx.beginPath(); ctx.moveTo(w - 26, h / 2); ctx.lineTo(w - 52, 48); ctx.lineTo(w - 52, h - 48); ctx.closePath(); ctx.fill();
    });
    ['EMAIL', 'GITHUB', 'X / TWITTER'].forEach((label, i) => {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(2.9, 0.95, 0.1),
        [mat(C.cream), mat(C.cream), mat(C.cream), mat(C.cream), new THREE.MeshBasicMaterial({ map: arrowTex(label) }), new THREE.MeshBasicMaterial({ map: arrowTex(label) })]
      );
      board.position.set(i % 2 ? 0.5 : -0.3, 3.7 - i * 1.05, 0);
      board.rotation.y = -0.35 + i * 0.5;
      board.castShadow = true;
      sp.add(board);
    });
    const spTex = textPanel(512, 300, (ctx, w, h) => {
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4d488';
      ctx.font = "400 104px 'Instrument Serif', serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('CONTACT', w / 2, h / 2 - 8);
      ctx.fillStyle = 'rgba(255,246,233,0.6)';
      ctx.font = "400 26px 'Space Mono', monospace";
      ctx.fillText('★  SAY HELLO  ★', w / 2, h / 2 + 74);
    });
    const spTop = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.8, 0.12), new THREE.MeshBasicMaterial({ map: spTex }));
    spTop.position.y = 5.3;
    const spHit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.6, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    spHit.position.y = 3;
    spHit.userData = { type: 'contact' };
    sp.add(pole, spTop, spHit);
    sp.position.set(0, World.groundHeight(0, 70), 70);
    sp.rotation.y = Math.PI;
    scene.add(sp);
    interactives.push(spHit);
    World.addCircle(0, 70, 0.55);

    /* little flags behind the signpost, clear of the road */
    decor.flags = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + (i / 8) * 0.7);
      const fl = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.5),
        new THREE.MeshStandardMaterial({ color: [C.mint, C.butter, C.clay][i % 3], side: THREE.DoubleSide, roughness: 0.9 })
      );
      const fx = Math.cos(a) * 8.4, fz = 70 + Math.sin(a) * 5.6;
      fl.position.set(fx, World.groundHeight(fx, fz) + 1.5 + (i % 2) * 0.5, fz);
      scene.add(fl);
      decor.flags.push({ mesh: fl, phase: i });
    }

    /* ── clouds + balloon ── */
    decor.clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xfff4e6, roughness: 1 });
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const puffs = 3 + (i % 3);
      for (let p = 0; p < puffs; p++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(3.2 + Math.random() * 2.4, 10, 8), cloudMat);
        s.position.set(p * 3.4 - puffs * 1.4, Math.random() * 0.9, Math.random() * 2 - 1);
        s.scale.y = 0.66;
        g.add(s);
      }
      const a = (i / 12) * Math.PI * 2;
      g.position.set(Math.cos(a) * (120 + Math.random() * 40), 42 + Math.random() * 18, Math.sin(a) * (120 + Math.random() * 40));
      scene.add(g);
      decor.clouds.push({ mesh: g, a, r: Math.hypot(g.position.x, g.position.z), speed: 0.004 + Math.random() * 0.004, y: g.position.y });
    }

    const balloon = new THREE.Group();
    const envelope = new THREE.Mesh(new THREE.SphereGeometry(3.4, 20, 16), new THREE.MeshStandardMaterial({ color: 0xe39772, roughness: 0.75 }));
    envelope.scale.set(1, 1.15, 1);
    envelope.position.y = 3.4;
    const stripe = new THREE.Mesh(new THREE.SphereGeometry(3.42, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: C.butter, roughness: 0.8 }));
    stripe.scale.set(1, 1.15, 1);
    stripe.position.y = 3.4;
    stripe.rotation.z = 0.5;
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), mat(0xa97a55));
    basket.position.y = -0.6;
    balloon.add(envelope, stripe, basket);
    balloon.position.set(-46, 26, -14);
    balloon.scale.setScalar(1.1);
    scene.add(balloon);
    decor.balloon = balloon;

    World.scene = scene;
    return World;
  };

  /* ── prop physics ────────────────────────────────────────── */
  const GRAV = 26;

  function resolveProp(p, car, carVel) {
    const dx = p.mesh.position.x - car.pos.x;
    const dz = p.mesh.position.z - car.pos.z;
    const d = Math.hypot(dx, dz);
    const minD = p.radius + car.radius;
    if (d > minD || d < 0.0001) return 0;

    const nx = dx / d, nz = dz / d;
    const impact = Math.abs(car.speed);
    const push = Math.min(28, 2.4 + impact * 1.75) / Math.max(0.55, p.mass);
    p.vel.x += nx * push * 0.85 + carVel.x * 0.55;
    p.vel.z += nz * push * 0.85 + carVel.z * 0.55;
    p.vel.y += Math.min(7.5, impact * 0.22) + 1.1;
    p.spin.x += (Math.random() - 0.5) * impact * 0.2 + nz * impact * 0.06;
    p.spin.z += (Math.random() - 0.5) * impact * 0.2 - nx * impact * 0.06;
    p.spin.y += (Math.random() - 0.5) * impact * 0.12;
    p.rest = false;
    p.flying = true;

    const overlap = minD - d;
    p.mesh.position.x += nx * (overlap + 0.02);
    p.mesh.position.z += nz * (overlap + 0.02);

    return 1 - Math.min(0.5, p.mass * 0.12);
  }

  World.updateProps = function (dt, car, carVel) {
    let bounceBack = 0;

    for (let i = 0; i < propList.length; i++) {
      const p = propList[i];
      const mp = p.mesh.position;

      if (!p.rest) {
        p.vel.y -= GRAV * dt;
        mp.x += p.vel.x * dt;
        mp.y += p.vel.y * dt;
        mp.z += p.vel.z * dt;

        p.mesh.rotation.x += p.spin.x * dt;
        p.mesh.rotation.y += p.spin.y * dt;
        p.mesh.rotation.z += p.spin.z * dt;

        const floor = World.groundHeight(mp.x, mp.z) + p.floorOff;
        if (mp.y <= floor) {
          mp.y = floor;
          if (p.vel.y < -0.6) {
            p.vel.y *= -0.32;
            p.spin.multiplyScalar(0.7);
          } else {
            p.vel.y = 0;
            p.spin.multiplyScalar(0.82);
          }
          p.vel.x *= 0.9; p.vel.z *= 0.9;
          p.spin.x *= 0.85; p.spin.z *= 0.85;
        }

        const r = Math.hypot(mp.x, mp.z);
        if (r > R - 2) {
          const k = (R - 2) / r;
          mp.x *= k; mp.z *= k;
          p.vel.x *= -0.4; p.vel.z *= -0.4;
        }

        if (mp.y < -16) {
          mp.copy(p.home);
          p.mesh.rotation.set(0, 0, 0);
          p.vel.set(0, 0, 0); p.spin.set(0, 0, 0);
          p.rest = true;
        }

        const speed2 = p.vel.lengthSq();
        if (speed2 < 0.02 && Math.abs(mp.y - floor) < 0.02) {
          p.vel.set(0, 0, 0);
          p.spin.multiplyScalar(0.6);
          if (p.spin.lengthSq() < 0.001) p.rest = true;
        }
      } else {
        p.mesh.rotation.x *= 0.98;
        p.mesh.rotation.z *= 0.98;
      }

      if (!car || car.airborne) continue;
      const res = resolveProp(p, car, carVel);
      if (res) bounceBack = Math.max(bounceBack, res);
    }

    for (let i = 0; i < propList.length; i++) {
      const a = propList[i];
      if (a.rest) continue;
      for (let j = i + 1; j < propList.length; j++) {
        const b = propList[j];
        const ax = a.mesh.position, bx = b.mesh.position;
        const dx = bx.x - ax.x, dy = bx.y - ax.y, dz = bx.z - ax.z;
        const dist = Math.hypot(dx, dz);
        const minD = a.radius + b.radius;
        if (dist > minD || dist < 0.0001 || Math.abs(dy) > 1.6) continue;
        const nx = dx / dist, nz = dz / dist;
        const overlap = (minD - dist) * 0.5;
        ax.x -= nx * overlap; ax.z -= nz * overlap;
        bx.x += nx * overlap; bx.z += nz * overlap;
        const rel = (a.vel.x - b.vel.x) * nx + (a.vel.z - b.vel.z) * nz;
        if (rel > 0) {
          const imp = rel * 0.55;
          a.vel.x -= nx * imp; a.vel.z -= nz * imp;
          b.vel.x += nx * imp; b.vel.z += nz * imp;
          b.rest = false;
          b.spin.y += (Math.random() - 0.5) * 2;
        }
      }
    }

    return bounceBack;
  };

  World.resetProps = function () {
    propList.forEach((p) => {
      p.mesh.position.copy(p.home);
      p.mesh.rotation.set(0, 0, 0);
      p.vel.set(0, 0, 0); p.spin.set(0, 0, 0);
      p.rest = true;
    });
  };

  /* ── per-frame decoration ────────────────────────────────── */
  let waterTime = 0;
  World.update = function (dt, t, camera, car) {
    if (decor.clouds) {
      decor.clouds.forEach((c) => {
        c.a += c.speed * dt;
        c.mesh.position.x = Math.cos(c.a) * c.r;
        c.mesh.position.z = Math.sin(c.a) * c.r;
        c.mesh.position.y = c.y + Math.sin(t * 0.4 + c.a * 3) * 0.8;
      });
    }
    if (decor.balloon) {
      decor.balloon.position.y = 26 + Math.sin(t * 0.5) * 1.6;
      decor.balloon.rotation.y += dt * 0.08;
      decor.balloon.position.x = -46 + Math.sin(t * 0.22) * 3;
    }
    if (decor.cubes) {
      decor.cubes.forEach((c) => {
        c.mesh.rotation.y += dt * 0.55;
        c.mesh.rotation.x = Math.sin(t * 0.6 + c.phase) * 0.24;
        c.mesh.position.y = c.base + Math.sin(t * 0.9 + c.phase) * 0.18;
      });
    }
    if (decor.flags) {
      decor.flags.forEach((f) => {
        f.mesh.rotation.y = Math.sin(t * 1.6 + f.phase) * 0.35;
        f.mesh.rotation.z = Math.sin(t * 2.1 + f.phase) * 0.08;
      });
    }
    if (decor.palms) {
      decor.palms.forEach((p) => {
        p.crown.rotation.z = Math.sin(t * 0.9 + p.phase) * 0.045;
        p.crown.rotation.x = Math.cos(t * 0.7 + p.phase) * 0.04;
      });
    }
    if (decor.windmills) {
      decor.windmills.forEach((hub, i) => { hub.rotation.z += dt * (0.5 + i * 0.18); });
    }

    waterTime += dt;
    for (let i = 0; i < waterMats.length; i++) waterMats[i].uniforms.uTime.value = waterTime;

    World.billboards.forEach((b, i) => {
      if (b.flag) b.flag.rotation.y = Math.sin(t * 1.7 + i) * 0.28;
      if (b.badge) b.badge.position.y = 6.06 + Math.sin(t * 1.1 + i * 0.8) * 0.06;
    });

    /* keep the shadow frustum around the car */
    if (sunLight && car) {
      sunLight.position.set(car.pos.x - 30, car.pos.y + 44, car.pos.z + 22);
      sunLight.target.position.set(car.pos.x, car.pos.y, car.pos.z);
      sunLight.target.updateMatrixWorld();
    }
  };

  World.interactives = interactives;

  /* nearest billboard to a point (xz) */
  World.nearestBillboard = function (pos, maxDist) {
    let best = null, bestD = maxDist || 6;
    World.billboards.forEach((b) => {
      const d = Math.hypot(b.pos.x - pos.x, b.pos.z - pos.z);
      if (d < bestD) { bestD = d; best = b; }
    });
    return best;
  };

  /* nearest oasis pond, for the proximity water mix */
  World.nearestPond = function (pos) {
    let best = null, bestD = 1e9;
    PONDS.forEach((p) => {
      const d = Math.hypot(p.x - pos.x, p.z - pos.z) - p.r;
      if (d < bestD) { bestD = d; best = p; }
    });
    return { pond: best, dist: Math.max(0, bestD) };
  };
})();
