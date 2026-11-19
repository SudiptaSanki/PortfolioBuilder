/* =========================================================
   Sunset → night scene
   A layered 2D canvas sky: setting sun, ridges, valley lights,
   starfield and a hilltop silhouette (tree, traveller, motorcycle).
   Progress 0 → 1 is driven by scroll.
   ========================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1;
  let lightsCanvas = null, lightsCtx = null;
  let starCanvas = null;
  let stars = [];
  let dust = [];
  let grass = [];
  let clouds = [];
  let meteors = [];

  const state = {
    p: 0,          // scroll progress 0..1
    pEased: 0,
    t: 0,
    mx: 0, my: 0,  // eased pointer -1..1
    tmx: 0, tmy: 0,
    lastP: -1
  };

  /* ---------------- helpers ---------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  };
  const mixRgb = (a, b, t) => [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t))
  ];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------------- silhouette assets ---------------- */
  const ASSETS = {
    moto: { src: 'assets/img/moto-silhouette.png', img: null, loaded: false, cache: {} },
    tree: { src: 'assets/img/tree-silhouette.png', img: null, loaded: false, cache: {} }
  };
  Object.keys(ASSETS).forEach((k) => {
    const im = new Image();
    im.onload = () => { ASSETS[k].loaded = true; };
    im.onerror = () => { ASSETS[k].loaded = false; };
    im.src = ASSETS[k].src;
    ASSETS[k].img = im;
  });

  function tintedCanvas(asset, wCss, hCss, kind, color) {
    const key = kind + ':' + Math.round(wCss) + 'x' + Math.round(hCss);
    if (asset.cache[key]) return asset.cache[key];
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(wCss * DPR));
    c.height = Math.max(1, Math.round(hCss * DPR));
    const g = c.getContext('2d');
    g.drawImage(asset.img, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    asset.cache[key] = c;
    return c;
  }

  function drawSilhouette(asset, xCss, yBottom, hCss, night, duskColor, nightColor) {
    if (!asset.loaded || !asset.img.naturalWidth) return;
    const wCss = hCss * asset.img.naturalWidth / asset.img.naturalHeight;
    const left = xCss - wCss / 2;
    const top = yBottom - hCss;
    const dusk = tintedCanvas(asset, wCss, hCss, 'dusk', duskColor);
    const dark = tintedCanvas(asset, wCss, hCss, 'night', nightColor);
    ctx.drawImage(dusk, left, top, wCss, hCss);
    if (night > 0.01) {
      ctx.globalAlpha = clamp(night, 0, 1);
      ctx.drawImage(dark, left, top, wCss, hCss);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------- palettes ---------------- */
  // [position, dusk, night]
  const SKY = [
    [0.00, '#132335', '#05080e'],
    [0.12, '#19293c', '#080c14'],
    [0.24, '#223346', '#0b111b'],
    [0.33, '#2b3f54', '#0e1523'],
    [0.42, '#3a4759', '#111726'],
    [0.50, '#515162', '#141b28'],
    [0.55, '#6d5862', '#171f2c'],
    [0.595, '#9c665c', '#1a222f'],
    [0.625, '#c97b6b', '#1d2532'],
    [0.652, '#e8855f', '#212832'],
    [0.672, '#d97e5e', '#242a31'],
    [0.71, '#9c6a5c', '#1f232a'],
    [0.79, '#5a4550', '#15181e'],
    [1.00, '#2b2733', '#0a0d12']
  ].map(([pos, d, n]) => ({ pos, dusk: hexToRgb(d), night: hexToRgb(n) }));

  /* ---------------- ridges ---------------- */
  const rndSeed = mulberry32(4242);
  function makeHarm(freqs, ampScale, seed) {
    const r = mulberry32(seed);
    return freqs.map((f, i) => ({
      f,
      a: (1 / Math.pow(i + 1.4, 1.15)) * ampScale * (0.7 + r() * 0.6),
      ph: r() * Math.PI * 2
    }));
  }

  const RIDGES = [
    {
      depth: 0.30, base: 0.648, amp: 0.058, step: 0.006,
      harm: makeHarm([1.1, 2.3, 4.7, 8.9], 0.55, 91),
      peaks: { f: 4.6, amp: 0.95, sharp: 2.8, ph: 1.2 },
      dusk: '#343042', night: '#0d1420', haze: 0.08, fog: '#c08568'
    },
    {
      depth: 0.52, base: 0.688, amp: 0.042, step: 0.005,
      harm: makeHarm([0.9, 2.1, 4.1, 7.3], 0.5, 17),
      peaks: { f: 3.4, amp: 1.0, sharp: 2.4, ph: 3.4 },
      dusk: '#201e2a', night: '#080d16', haze: 0.06, fog: '#a06f58'
    },
    {
      depth: 0.74, base: 0.766, amp: 0.024, step: 0.004,
      harm: makeHarm([1.4, 3.2, 6.1, 11.0], 0.5, 55),
      peaks: { f: 2.6, amp: 0.6, sharp: 1.8, ph: 0.4 },
      dusk: '#1c1b26', night: '#0a0e16', haze: 0.05, fog: '#8a6154'
    }
  ];

  // foreground hill crest — explicit, hand-placed silhouette line
  const HILL = [
    [-0.05, 0.822], [0.06, 0.806], [0.15, 0.792], [0.235, 0.782],
    [0.30, 0.786], [0.37, 0.800], [0.45, 0.818], [0.55, 0.834],
    [0.66, 0.849], [0.78, 0.862], [0.90, 0.874], [1.05, 0.890]
  ];

  function catmull(points, x) {
    // find segment
    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) i++;
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const t = clamp((x - p1[0]) / (p2[0] - p1[0] || 1), 0, 1);
    const t2 = t * t, t3 = t2 * t;
    const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
    return y;
  }
  const hillY = (x) => catmull(HILL, x);

  /* ---------------- camera keyframes ---------------- */
  const CAM = [
    { p: 0.00, s: 1.000, y: 0.000 },
    { p: 0.18, s: 1.075, y: 0.140 },
    { p: 0.42, s: 1.140, y: 0.300 },
    { p: 0.70, s: 1.115, y: 0.255 },
    { p: 0.88, s: 1.035, y: 0.070 },
    { p: 1.00, s: 1.000, y: 0.000 }
  ];

  // foreground hill silhouette fades while the visitor is reading mid-page
  const FG = [
    { p: 0.00, a: 1.00 },
    { p: 0.14, a: 1.00 },
    { p: 0.28, a: 0.00 },
    { p: 0.72, a: 0.00 },
    { p: 0.92, a: 0.85 },
    { p: 1.00, a: 1.00 }
  ];

  function fgAlpha(p) {
    let i = 0;
    while (i < FG.length - 2 && p > FG[i + 1].p) i++;
    const a = FG[i], b = FG[i + 1];
    const t = smoothstep(0, 1, clamp((p - a.p) / (b.p - a.p || 1), 0, 1));
    return lerp(a.a, b.a, t);
  }

  function cameraAt(p) {
    let i = 0;
    while (i < CAM.length - 2 && p > CAM[i + 1].p) i++;
    const a = CAM[i], b = CAM[i + 1];
    const t = easeInOut(clamp((p - a.p) / (b.p - a.p || 1), 0, 1));
    return { s: lerp(a.s, b.s, t), y: lerp(a.y, b.y, t) };
  }

  /* ---------------- build scene data ---------------- */
  function build() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    W = w; H = h;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    // ---- stars
    const r = mulberry32(20261116);
    const count = Math.round(clamp((W * H) / 2600, 260, 900));
    stars = [];
    for (let i = 0; i < count; i++) {
      const y = Math.pow(r(), 1.18) * 0.78;
      stars.push({
        x: r(),
        y: y,
        r: r() < 0.06 ? 1.05 + r() * 0.75 : 0.3 + r() * 0.62,
        a: 0.38 + r() * 0.62,
        sp: 0.4 + r() * 2.2,
        ph: r() * Math.PI * 2,
        warm: r() < 0.22
      });
    }

    // faint galactic dust band
    dust = [];
    for (let i = 0; i < 260; i++) {
      const u = r();
      dust.push({
        x: 0.08 + u * 0.98,
        y: 0.06 + u * 0.34 + (r() - 0.5) * 0.12,
        r: 0.2 + r() * 0.6,
        a: 0.1 + r() * 0.28
      });
    }

    // ---- valley town lights (pre-rendered)
    lightsCanvas = document.createElement('canvas');
    lightsCanvas.width = Math.round(W * DPR);
    lightsCanvas.height = Math.round(H * DPR);
    lightsCtx = lightsCanvas.getContext('2d');
    lightsCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    lightsCtx.clearRect(0, 0, W, H);

    const lr = mulberry32(777);
    const unit = H / 1000;
    const clusters = 15;
    const drawLight = (x, y, size, alpha) => {
      const rad = Math.max(1.4, size * 5.2 * unit);
      const g = lightsCtx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(255,234,196,${0.9 * alpha})`);
      g.addColorStop(0.2, `rgba(255,208,148,${0.4 * alpha})`);
      g.addColorStop(0.55, `rgba(240,170,112,${0.11 * alpha})`);
      g.addColorStop(1, 'rgba(240,150,100,0)');
      lightsCtx.fillStyle = g;
      lightsCtx.beginPath();
      lightsCtx.arc(x, y, rad, 0, Math.PI * 2);
      lightsCtx.fill();
      lightsCtx.fillStyle = `rgba(255,246,222,${0.92 * alpha})`;
      lightsCtx.beginPath();
      lightsCtx.arc(x, y, Math.max(0.45, size * 0.9 * unit), 0, Math.PI * 2);
      lightsCtx.fill();
    };

    // town lights live on the valley floor, between the mid ridge and the near hills
    for (let c = 0; c < clusters; c++) {
      const cx = lr() * 1.04 - 0.02;
      const cy = 0.702 + lr() * 0.032;
      const spreadX = 0.010 + lr() * 0.048;
      const n = 5 + Math.floor(lr() * 9);
      for (let i = 0; i < n; i++) {
        const ang = lr() * Math.PI * 2;
        const dist = Math.pow(lr(), 0.7);
        const x = (cx + Math.cos(ang) * dist * spreadX * 2.2) * W;
        const y = (cy + Math.sin(ang) * dist * 0.010 + (lr() - 0.5) * 0.004) * H;
        drawLight(x, y, 0.45 + lr() * 1.0, 0.4 + lr() * 0.6);
      }
    }
    for (let i = 0; i < 110; i++) {
      const x = lr() * W;
      const y = (0.699 + Math.pow(lr(), 0.85) * 0.038) * H;
      drawLight(x, y, 0.28 + lr() * 0.5, 0.14 + lr() * 0.3);
    }

    // ---- grass blades along the hill crest
    const gr = mulberry32(9091);
    grass = [];
    const blades = Math.round(clamp(W / 5.2, 120, 360));
    for (let i = 0; i < blades; i++) {
      const x = gr() * 1.06 - 0.03;
      grass.push({
        x,
        y: hillY(x) + (gr() - 0.5) * 0.006,
        h: 0.0025 + Math.pow(gr(), 2.1) * 0.0085,   // fraction of viewport height
        lean: (gr() - 0.5) * 1.5,
        ph: gr() * Math.PI * 2,
        sp: 0.5 + gr() * 0.9,
        lit: gr() < 0.07,
        w: 0.7 + gr() * 1.2
      });
    }
    grass.sort((a, b) => a.y - b.y);

    // ---- clouds
    const cr = mulberry32(31337);
    clouds = [];
    for (let i = 0; i < 9; i++) {
      const band = i < 4 ? 0.30 + cr() * 0.12 : 0.44 + cr() * 0.12;
      clouds.push({
        x: cr(),
        y: band,
        w: 0.26 + cr() * 0.55,
        h: 0.005 + cr() * 0.014,
        a: 0.025 + cr() * 0.06,
        sp: (0.0012 + cr() * 0.003) * (cr() < 0.5 ? -1 : 1),
        ph: cr() * Math.PI * 2
      });
    }

    // ---- re-render static star layer? stars twinkle live, so none cached.
    starCanvas = null;

    Object.keys(ASSETS).forEach((k) => { ASSETS[k].cache = {}; });
    state.lastP = -1;
  }

  /* ---------------- layer transform ---------------- */
  let cam = { s: 1, y: 0 };
  function layerTransform(depth) {
    const s = 1 + (cam.s - 1) * (0.34 + 0.66 * depth);
    const oy = cam.y * (0.42 + 0.58 * depth);
    const px = state.mx * 16 * depth;
    const py = state.my * 9 * depth - 0;
    ctx.setTransform(DPR * s, 0, 0, DPR * s, DPR * (W / 2 * (1 - s) + px), DPR * (H * (1 - s) + oy * H + py));
    return { s, oy };
  }

  /* ---------------- sky ---------------- */
  // C1-continuous colour ramp through the palette stops (no banding at stop joins)
  function skyColorAt(pos, night) {
    const pts = SKY;
    let i = 0;
    while (i < pts.length - 2 && pos > pts[i + 1].pos) i++;
    const p1 = pts[i], p2 = pts[i + 1];
    const p0 = pts[Math.max(0, i - 1)], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const span = (p2.pos - p1.pos) || 1;
    const t = clamp((pos - p1.pos) / span, 0, 1);
    const d = [p2.pos - p0.pos || 1, p3.pos - p1.pos || 1];
    const out = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const v1 = lerp(p1.dusk[c], p1.night[c], night);
      const v2 = lerp(p2.dusk[c], p2.night[c], night);
      const v0 = lerp(p0.dusk[c], p0.night[c], night);
      const v3 = lerp(p3.dusk[c], p3.night[c], night);
      const m1 = ((v2 - v0) / (d[0] + (p1.pos - p0.pos))) * span;
      const m2 = ((v3 - v1) / (d[1] + (p2.pos - p1.pos))) * span;
      const t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      out[c] = Math.round(clamp(h00 * v1 + h10 * m1 + h01 * v2 + h11 * m2, 0, 255));
    }
    return out;
  }

  function drawSky(night) {
    const yTop = (n) => (n * H - H) * cam.s + H + cam.y * H;
    const y0 = yTop(0), y1 = yTop(1);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const pos = i / N;
      g.addColorStop(pos, rgba(skyColorAt(pos, night), 1));
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- horizon glow ---------------- */
  function drawHorizonGlow(sunX, sunY, intensity) {
    const cx = W * sunX;
    const cy = H * sunY;
    const rad = H * 0.58;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(255,196,140,${0.32 * intensity})`);
    g.addColorStop(0.16, `rgba(248,168,116,${0.24 * intensity})`);
    g.addColorStop(0.4, `rgba(232,124,96,${0.12 * intensity})`);
    g.addColorStop(0.7, `rgba(190,96,90,${0.04 * intensity})`);
    g.addColorStop(1, 'rgba(150,80,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- stars ---------------- */
  function drawStars(night, t) {
    const vis = smoothstep(0.04, 0.42, night);
    if (vis <= 0.004) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // dust
    ctx.globalAlpha = vis * 0.75;
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      ctx.fillStyle = `rgba(206,216,240,${d.a})`;
      ctx.fillRect(d.x * W, d.y * H, d.r, d.r);
    }

    const drift = state.mx * 4;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let tw = 1;
      if (!reduceMotion) tw = 0.62 + 0.38 * Math.sin(t * s.sp + s.ph);
      const a = s.a * vis * tw;
      if (a < 0.02) continue;
      const x = s.x * W + drift * 0.4;
      const y = s.y * H;
      if (s.r > 0.95) {
        ctx.fillStyle = s.warm ? `rgba(255,238,214,${a})` : `rgba(226,234,255,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // soft halo
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4.2);
        g.addColorStop(0, s.warm ? `rgba(255,226,190,${a * 0.26})` : `rgba(206,222,255,${a * 0.24})`);
        g.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = s.warm ? `rgba(255,236,208,${a})` : `rgba(222,232,255,${a})`;
        ctx.fillRect(x, y, s.r, s.r);
      }
    }
    ctx.globalAlpha = 1;

    // meteors
    if (!reduceMotion) {
      if (!meteors.length || (t % 11 < 0.02 && meteors.length < 2)) {
        if (Math.random() < 0.0025 && night > 0.8) {
          meteors.push({ x: 0.15 + Math.random() * 0.7, y: 0.05 + Math.random() * 0.28, t: 0, life: 1.1 + Math.random() * 0.6, len: 0.025 + Math.random() * 0.035, dir: Math.random() < 0.5 ? -1 : 1 });
        }
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.t += 1 / 60;
        if (m.t > m.life) { meteors.splice(i, 1); continue; }
        const k = m.t / m.life;
        const a = Math.sin(Math.PI * k) * 0.34 * vis;
        const x = m.x * W + m.dir * k * m.len * W;
        const y = m.y * H + k * m.len * H * 0.55;
        const g = ctx.createLinearGradient(x, y, x - m.dir * m.len * W * 0.5, y - m.len * H * 0.28);
        g.addColorStop(0, `rgba(255,246,232,${a})`);
        g.addColorStop(1, 'rgba(255,240,220,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - m.dir * m.len * W * 0.5, y - m.len * H * 0.28);
        ctx.stroke();
      }
    }
  }

  /* ---------------- sun ---------------- */
  function drawSun(p, night) {
    const k = clamp(p / 0.55, 0, 1);
    const e = easeInOut(k);
    const sunXn = 0.748 + 0.012 * e;
    const sunYn = 0.600 + 0.128 * e;
    const x = sunXn * W;
    const y = sunYn * H;
    const fade = 1 - smoothstep(0.26, 0.46, p);
    if (fade <= 0.01) return;

    ctx.save();
    layerTransform(0.22);
    const R = H * (0.0195 + 0.0035 * Math.sin(k * Math.PI));
    const warm = mixRgb(hexToRgb('#ffe0b6'), hexToRgb('#f7a26a'), 0.25 + k * 0.7);

    // bloom
    const g = ctx.createRadialGradient(x, y, R * 0.4, x, y, H * 0.22);
    g.addColorStop(0, rgba(hexToRgb('#ffeccd'), 0.78 * fade));
    g.addColorStop(0.1, rgba(hexToRgb('#ffc999'), 0.42 * fade));
    g.addColorStop(0.36, rgba(hexToRgb('#f8a878'), 0.16 * fade));
    g.addColorStop(1, 'rgba(240,140,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, H * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // disc
    const dg = ctx.createRadialGradient(x, y, 0, x, y, R);
    dg.addColorStop(0, rgba(hexToRgb('#fff2da'), fade));
    dg.addColorStop(0.72, rgba(warm, fade));
    dg.addColorStop(1, rgba(mixRgb(warm, hexToRgb('#e86f52'), 0.5), fade * 0.9));
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return { x: sunXn, y: sunYn };
  }

  /* ---------------- clouds ---------------- */
  function drawClouds(p, night, t) {
    ctx.save();
    layerTransform(0.18);
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const drift = reduceMotion ? 0 : t * c.sp;
      let x = (c.x + drift) % 1.4;
      if (x > 1.2) x -= 1.4;
      const cx = x * W;
      const cy = c.y * H;
      const cw = c.w * W;
      const ch = c.h * H;

      const litCol = mixRgb(hexToRgb('#e6a184'), hexToRgb('#232f42'), night);
      const darkCol = mixRgb(hexToRgb('#8a6668'), hexToRgb('#0c1320'), night);
      const alpha = c.a * (1 - 0.62 * night) * (0.72 + 0.28 * Math.sin(p * 2 + c.ph));
      if (alpha < 0.004) continue;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(cw * 0.5, ch * 1.9);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, rgba(litCol, alpha));
      g.addColorStop(0.28, rgba(litCol, alpha * 0.72));
      g.addColorStop(0.58, rgba(litCol, alpha * 0.26));
      g.addColorStop(0.82, rgba(darkCol, alpha * 0.08));
      g.addColorStop(1, rgba(darkCol, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // a thinner strand trailing the main body
      ctx.save();
      ctx.translate(cx + cw * 0.22, cy + ch * 0.9);
      ctx.scale(cw * 0.34, ch * 1.1);
      const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g2.addColorStop(0, rgba(litCol, alpha * 0.3));
      g2.addColorStop(0.6, rgba(litCol, alpha * 0.14));
      g2.addColorStop(1, rgba(darkCol, 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------------- mountains ---------------- */
  function ridgeY(layer, x) {
    let v = 0;
    for (let i = 0; i < layer.harm.length; i++) {
      const h = layer.harm[i];
      v += h.a * Math.sin(x * Math.PI * 2 * h.f + h.ph);
    }
    if (layer.peaks) {
      v += layer.peaks.amp * Math.pow(Math.abs(Math.sin(x * Math.PI * layer.peaks.f + layer.peaks.ph)), layer.peaks.sharp);
    }
    return layer.base - v * layer.amp;
  }

  function drawRidge(layer, night, p) {
    const { s } = layerTransform(layer.depth);
    const fill = mixRgb(hexToRgb(layer.dusk), hexToRgb(layer.night), night);
    const step = layer.step;
    ctx.beginPath();
    ctx.moveTo(-0.2 * W, H * 1.3);
    for (let x = -0.16; x <= 1.16; x += step) {
      ctx.lineTo(x * W, ridgeY(layer, x) * H);
    }
    ctx.lineTo(1.16 * W, H * 1.3);
    ctx.closePath();
    ctx.fillStyle = rgba(fill, 1);
    ctx.fill();

    // atmospheric haze sitting on the ridge line
    const hazeA = layer.haze * (0.55 + 0.45 * (1 - night));
    if (hazeA > 0.01) {
      const top = ridgeY(layer, 0.5) * H;
      const g = ctx.createLinearGradient(0, top - H * 0.022, 0, top + H * 0.022);
      g.addColorStop(0, rgba(mixRgb(hexToRgb(layer.fog), fill, night * 0.75), 0));
      g.addColorStop(0.45, rgba(mixRgb(hexToRgb(layer.fog), fill, night * 0.75), hazeA * 0.5));
      g.addColorStop(1, rgba(fill, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-0.1 * W, top - H * 0.022, 1.2 * W, H * 0.045);
    }
    ctx.restore();
  }

  /* ---------------- valley lights ---------------- */
  function drawLights(p, night) {
    if (!lightsCanvas) return;
    const a = 0.16 + 0.84 * smoothstep(0.02, 0.78, night);
    ctx.save();
    layerTransform(0.80);
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(lightsCanvas, 0, 0, W, H);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- foreground ---------------- */
  function drawHill(night, t) {
    layerTransform(1);
    const fill = mixRgb(hexToRgb('#0b0e14'), hexToRgb('#04070a'), night);

    // grass behind the crest (drawn first, so blades peek above)
    drawGrass(night, t, true);

    ctx.beginPath();
    ctx.moveTo(-0.1 * W, H * 1.25);
    ctx.lineTo(-0.1 * W, hillY(-0.1) * H);
    for (let x = -0.1; x <= 1.1; x += 0.004) {
      ctx.lineTo(x * W, hillY(x) * H);
    }
    ctx.lineTo(1.1 * W, H * 1.25);
    ctx.closePath();
    ctx.fillStyle = rgba(fill, 1);
    ctx.fill();

    drawGrass(night, t, false);
  }

  function drawGrass(night, t, back) {
    const baseCol = mixRgb(hexToRgb('#0c0f14'), hexToRgb('#03050a'), night);
    const litCol = mixRgb(hexToRgb('#9c7660'), hexToRgb('#2b2c33'), night);
    ctx.lineCap = 'round';
    for (let i = 0; i < grass.length; i++) {
      const g = grass[i];
      const isBack = i % 2 === 0;
      if (isBack !== back) continue;
      const sway = reduceMotion ? 0 : Math.sin(t * g.sp + g.ph + g.x * 6) * 0.7;
      const x = g.x * W;
      const y = g.y * H;
      const h = g.h * H;
      const tipX = x + (g.lean + sway) * h * 0.55;
      const tipY = y - h;
      ctx.strokeStyle = g.lit ? rgba(litCol, 0.22 * (1 - night)) : rgba(baseCol, 1);
      ctx.lineWidth = g.w;
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.quadraticCurveTo(x + (g.lean + sway) * h * 0.16, y - h * 0.55, tipX, tipY);
      ctx.stroke();
    }
  }

  function narrowScale() {
    return clamp(W / (H * 1.35), 0.40, 1);
  }

  function drawTree(night, t) {
    const k = narrowScale();
    const x0 = lerp(0.175, 0.137, k);
    const y0 = hillY(x0);
    drawSilhouette(ASSETS.tree, x0 * W, (y0 + 0.004) * H, H * 0.335 * k, night, '#10141c', '#03060b');
  }

  function drawPerson(night, t) {
    const x0 = 0.362;
    const y0 = hillY(x0);
    const h = H * 0.128 * clamp(W / (H * 1.35), 0.55, 1);
    const col = rgba(mixRgb(hexToRgb('#0a0d13'), hexToRgb('#020409'), night), 1);

    ctx.save();
    ctx.translate(x0 * W, (y0 + 0.003) * H);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // seated figure facing right, leaning back on one hand
    // torso
    ctx.beginPath();
    ctx.moveTo(-0.30 * h, 0);
    ctx.bezierCurveTo(-0.34 * h, -0.30 * h, -0.30 * h, -0.55 * h, -0.16 * h, -0.62 * h);
    ctx.bezierCurveTo(-0.02 * h, -0.68 * h, 0.10 * h, -0.60 * h, 0.12 * h, -0.44 * h);
    ctx.bezierCurveTo(0.14 * h, -0.24 * h, 0.06 * h, -0.06 * h, -0.04 * h, 0);
    ctx.closePath();
    ctx.fill();

    // head + cap
    ctx.beginPath();
    ctx.arc(-0.055 * h, -0.735 * h, 0.115 * h, 0, Math.PI * 2);
    ctx.fill();
    // cap brim
    ctx.beginPath();
    ctx.ellipse(0.02 * h, -0.775 * h, 0.135 * h, 0.05 * h, -0.16, 0, Math.PI * 2);
    ctx.fill();

    // arm resting on the knee
    ctx.lineWidth = 0.085 * h;
    ctx.beginPath();
    ctx.moveTo(-0.02 * h, -0.56 * h);
    ctx.quadraticCurveTo(0.14 * h, -0.40 * h, 0.22 * h, -0.20 * h);
    ctx.stroke();

    // thigh + shin
    ctx.lineWidth = 0.14 * h;
    ctx.beginPath();
    ctx.moveTo(-0.10 * h, -0.05 * h);
    ctx.quadraticCurveTo(0.16 * h, -0.10 * h, 0.34 * h, -0.16 * h);
    ctx.stroke();
    ctx.lineWidth = 0.105 * h;
    ctx.beginPath();
    ctx.moveTo(0.34 * h, -0.16 * h);
    ctx.quadraticCurveTo(0.44 * h, -0.06 * h, 0.46 * h, 0.02 * h);
    ctx.stroke();
    // foot
    ctx.beginPath();
    ctx.ellipse(0.49 * h, 0.015 * h, 0.075 * h, 0.032 * h, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawMoto(night, t) {
    const k = narrowScale();
    const x0 = lerp(0.64, 0.615, k);
    const y0 = hillY(x0);
    drawSilhouette(ASSETS.moto, x0 * W, (y0 + 0.002) * H, H * 0.196 * k, night, '#11151d', '#03060b');
  }

  /* ---------------- frame ---------------- */
  function frame(now) {
    const t = now / 1000;
    state.t = t;

    // ease pointer
    state.mx += (state.tmx - state.mx) * 0.05;
    state.my += (state.tmy - state.my) * 0.05;

    const p = state.p;
    state.pEased += (p - state.pEased) * 0.08;
    const pe = state.pEased;

    cam = cameraAt(pe);
    const night = smoothstep(0.005, 0.5, pe);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    drawSky(night);

    // warm bloom in the notch where the sun goes down
    const glowK = 1 - smoothstep(0.12, 0.62, pe) * 0.6;
    drawHorizonGlow(0.742, 0.652, glowK * (0.8 + 0.2 * (1 - night)));

    drawSun(pe, night);
    drawStars(night, t);
    drawClouds(pe, night, t);

    for (let i = 0; i < 2; i++) {
      drawRidge(RIDGES[i], night, pe);
    }

    drawLights(pe, night);

    drawRidge(RIDGES[2], night, pe);

    const fg = fgAlpha(pe);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (fg > 0.004) {
      ctx.globalAlpha = fg;
      drawHill(night, t);
      layerTransform(1);
      drawTree(night, t);
      drawPerson(night, t);
      drawMoto(night, t);
      ctx.globalAlpha = 1;
    }

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    requestAnimationFrame(frame);
  }

  /* ---------------- public API ---------------- */
  window.SunsetScene = {
    setProgress(p) { state.p = clamp(p, 0, 1); },
    resize() { build(); },
    pointer(nx, ny) { state.tmx = clamp(nx, -1, 1); state.tmy = clamp(ny, -1, 1); }
  };

  window.addEventListener('resize', () => {
    clearTimeout(window.__skyRT);
    window.__skyRT = setTimeout(build, 160);
  });
  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  build();
  requestAnimationFrame(frame);
})();
