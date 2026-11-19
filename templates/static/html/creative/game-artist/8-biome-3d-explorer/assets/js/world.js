/* =========================================================
   WORLD — eight distinct biomes, one continuous journey.

   Everything is generated in code: no binary 3D assets.
   The path is a single serpentine route; the terrain, sky,
   fog, lighting and props change per chapter so no two
   stretches of the walk look alike.
   ========================================================= */
window.createWorld = function (canvas) {
  'use strict';

  var T = THREE;
  var isMobile = window.matchMedia('(max-width: 860px)').matches ||
                 /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  var DENSITY = isMobile ? 0.55 : 1;

  /* ---------------- small math / noise ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20260116);

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sstep(x, a, b) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  function hash2(i, j) {
    var n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function vnoise(x, y) {
    var i = Math.floor(x), j = Math.floor(y);
    var fx = x - i, fy = y - j;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }
  function fbm(x, y) {
    var v = 0, amp = 0.5, f = 1;
    for (var k = 0; k < 3; k++) { v += amp * vnoise(x * f, y * f); f *= 2.07; amp *= 0.5; }
    return v;
  }

  /* =========================================================
     THE EIGHT BIOMES
     ========================================================= */
  var BIOMES = [
    {
      key: 'valley', name: 'Cyan Grid Valley', short: 'Grid Valley', accent: 0x4ff5ff,
      sky: {
        top: 0x02050d, mid: 0x061826, hor: 0x0d4a60, glow: 0x46f0ff, band: 0.95,
        stars: 0.55, sun: [-0.42, 0.07, -1], sunCol: 0x9ff8ff, sunSize: 150, sunOp: 0.30
      },
      fog: { color: 0x07131f, density: 0.0115 },
      hemi: [0x2c6f96, 0x04080f, 0.92],
      key: [0xcfeeff, 1.15, 70, 90, -50],
      rim: [0x37e6ff, 0.6],
      ground: { base: [0.030, 0.056, 0.082], hi: [0.085, 0.16, 0.21], line: [0.20, 0.85, 1.0], road: [0.10, 0.55, 0.68], pat: [1, 0, 0.15], glow: 0.9 },
      dust: { color: 0x8ffbff, size: 0.85 },
      terrain: { amp: 2.0, freq: 0.020, ridge: 0.0, terrace: 0.55, step: 0.9, swell: 4.0, seed: 11.3 }
    },
    {
      key: 'canyon', name: 'Amber Canyon Ridges', short: 'Amber Canyon', accent: 0xffa14a,
      sky: {
        top: 0x180702, mid: 0x4a1c08, hor: 0xcf6a22, glow: 0xffb066, band: 0.7,
        stars: 0.12, sun: [0.35, 0.12, -1], sunCol: 0xffd7a3, sunSize: 260, sunOp: 0.85
      },
      fog: { color: 0x3a1a0b, density: 0.0100 },
      hemi: [0xb4703a, 0x1a0a04, 0.95],
      key: [0xffd3a0, 1.45, 80, 70, -60],
      rim: [0xff7a2b, 0.55],
      ground: { base: [0.155, 0.070, 0.034], hi: [0.40, 0.20, 0.085], line: [1.0, 0.55, 0.22], road: [0.62, 0.32, 0.13], pat: [0.12, 1, 0.08], glow: 0.8 },
      dust: { color: 0xffc98a, size: 1.0 },
      terrain: { amp: 4.2, freq: 0.016, ridge: 1.9, terrace: 1.0, step: 1.7, swell: 10.0, seed: 43.7 }
    },
    {
      key: 'ruins', name: 'Violet Monolith Ruins', short: 'Violet Ruins', accent: 0xb07bff,
      sky: {
        top: 0x05020f, mid: 0x170a30, hor: 0x452282, glow: 0xa06bff, band: 0.85,
        stars: 0.5, sun: [-0.25, 0.16, -1], sunCol: 0xd8c2ff, sunSize: 190, sunOp: 0.4
      },
      fog: { color: 0x140a28, density: 0.0112 },
      hemi: [0x5a3a9c, 0x0a0614, 0.85],
      key: [0xdccdff, 1.05, -60, 80, -40],
      rim: [0x9d5cff, 0.7],
      ground: { base: [0.070, 0.050, 0.125], hi: [0.175, 0.105, 0.30], line: [0.66, 0.45, 1.0], road: [0.36, 0.20, 0.62], pat: [0.55, 0.55, 0.1], glow: 0.95 },
      dust: { color: 0xc9a8ff, size: 0.9 },
      terrain: { amp: 2.8, freq: 0.022, ridge: 0.6, terrace: 0.85, step: 1.3, swell: 6.0, seed: 77.1 }
    },
    {
      key: 'grove', name: 'Emerald Data Grove', short: 'Emerald Grove', accent: 0x48ffb0,
      sky: {
        top: 0x010c07, mid: 0x052a1c, hor: 0x0a5f3f, glow: 0x4dffae, band: 0.8,
        stars: 0.30, sun: [0.15, 0.10, -1], sunCol: 0xb8ffdd, sunSize: 220, sunOp: 0.5
      },
      fog: { color: 0x061a11, density: 0.0106 },
      hemi: [0x2f9c6e, 0x04100a, 0.95],
      key: [0xd6ffe9, 1.15, 40, 85, -55],
      rim: [0x2bff9a, 0.6],
      ground: { base: [0.035, 0.105, 0.065], hi: [0.075, 0.22, 0.135], line: [0.30, 1.0, 0.66], road: [0.09, 0.46, 0.27], pat: [0.35, 0.15, 0.85], glow: 0.8 },
      dust: { color: 0x9dffce, size: 1.1 },
      terrain: { amp: 3.1, freq: 0.030, ridge: 0.2, terrace: 0.0, step: 1.0, swell: 6.0, seed: 21.9 }
    },
    {
      key: 'volcanic', name: 'Crimson Basalt Bridge', short: 'Crimson Basalt', accent: 0xff6a35,
      sky: {
        top: 0x0b0205, mid: 0x2a0609, hor: 0x7d1a12, glow: 0xff6a30, band: 0.9,
        stars: 0.18, sun: [0.1, 0.05, -1], sunCol: 0xff8a4a, sunSize: 280, sunOp: 0.7
      },
      fog: { color: 0x25080a, density: 0.0112 },
      hemi: [0x8f2a1c, 0x0d0304, 0.8],
      key: [0xffb08a, 0.95, 60, 60, -40],
      rim: [0xff3c14, 0.85],
      ground: { base: [0.095, 0.036, 0.038], hi: [0.21, 0.065, 0.05], line: [1.0, 0.35, 0.13], road: [0.42, 0.12, 0.08], pat: [0.20, 1, 0.05], glow: 1.05 },
      dust: { color: 0xff9a6a, size: 1.0 },
      terrain: { amp: 3.6, freq: 0.035, ridge: 2.3, terrace: 0.45, step: 2.2, swell: 10.0, seed: 91.5 }
    },
    {
      key: 'mirror', name: 'Arctic Mirror Flats', short: 'Mirror Flats', accent: 0xd8f2ff,
      sky: {
        top: 0x061019, mid: 0x2c4356, hor: 0xaacbdd, glow: 0xeaf8ff, band: 0.5,
        stars: 0.35, sun: [-0.55, 0.20, -1], sunCol: 0xffffff, sunSize: 300, sunOp: 0.55
      },
      fog: { color: 0x8fb2c6, density: 0.0062 },
      hemi: [0xd8eeff, 0x1b2a36, 1.15],
      key: [0xffffff, 1.55, -70, 75, -45],
      rim: [0xbfe9ff, 0.5],
      ground: { base: [0.17, 0.24, 0.30], hi: [0.40, 0.52, 0.60], line: [0.85, 0.97, 1.0], road: [0.50, 0.66, 0.75], pat: [0.30, 0.05, 0.5], glow: 0.45 },
      dust: { color: 0xeaf7ff, size: 0.8 },
      terrain: { amp: 0.55, freq: 0.012, ridge: 0.0, terrace: 0.0, step: 1.0, swell: 1.2, seed: 5.4 }
    },
    {
      key: 'orbital', name: 'Indigo Orbital Ring', short: 'Orbital Ring', accent: 0x9aa4ff,
      sky: {
        top: 0x010208, mid: 0x070c26, hor: 0x222e6c, glow: 0x8f9cff, band: 0.75,
        stars: 1.0, sun: [0.45, 0.22, -1], sunCol: 0xcdd6ff, sunSize: 170, sunOp: 0.4
      },
      fog: { color: 0x060a1c, density: 0.0038 },
      hemi: [0x3a4a9c, 0x03040c, 0.75],
      key: [0xdfe6ff, 1.2, 90, 70, 40],
      rim: [0x6f7bff, 0.8],
      ground: { base: [0.055, 0.062, 0.135], hi: [0.125, 0.14, 0.30], line: [0.58, 0.62, 1.0], road: [0.22, 0.25, 0.56], pat: [1, 0.1, 0.25], glow: 0.95 },
      dust: { color: 0xa8b0ff, size: 0.75 },
      terrain: { amp: 1.5, freq: 0.020, ridge: 0.2, terrace: 0.7, step: 2.0, swell: 2.5, seed: 63.2 }
    },
    {
      key: 'citadel', name: 'Golden Horizon Citadel', short: 'Golden Citadel', accent: 0xffcf7a,
      sky: {
        top: 0x0d0803, mid: 0x3a2308, hor: 0xdca044, glow: 0xffd98a, band: 0.85,
        stars: 0.25, sun: [-0.2, 0.13, -1], sunCol: 0xffe3ad, sunSize: 320, sunOp: 0.9
      },
      fog: { color: 0x2a1a08, density: 0.0076 },
      hemi: [0xc79a52, 0x120b04, 0.95],
      key: [0xffe2b0, 1.35, -50, 80, -50],
      rim: [0xffb347, 0.7],
      ground: { base: [0.135, 0.095, 0.042], hi: [0.30, 0.21, 0.09], line: [1.0, 0.80, 0.42], road: [0.52, 0.36, 0.15], pat: [0.2, 0.9, 0.45], glow: 0.9 },
      dust: { color: 0xffd79a, size: 0.95 },
      terrain: { amp: 3.3, freq: 0.018, ridge: 0.9, terrace: 1.0, step: 1.5, swell: 8.0, seed: 33.8 }
    }
  ];
  var N_BIOMES = BIOMES.length;

  function col(hex) { return new T.Color(hex); }
  BIOMES.forEach(function (b) {
    b._sky = {
      top: col(b.sky.top), mid: col(b.sky.mid), hor: col(b.sky.hor), glow: col(b.sky.glow),
      sunCol: col(b.sky.sunCol)
    };
    b._fog = col(b.fog.color);
    b._hemi = [col(b.hemi[0]), col(b.hemi[1])];
    b._key = col(b.key[0]);
    b._rim = col(b.rim[0]);
    b._dust = col(b.dust.color);
    b._accent = col(b.accent);
  });

  /* =========================================================
     PATH — one serpentine route through the eight worlds
     ========================================================= */
  var WAYPOINTS = [
    { x: 0, z: 0, name: 'Bubblemaps' },
    { x: 58, z: 78, name: 'Dogamí' },
    { x: 6, z: 158, name: 'CoinsPaid' },
    { x: -62, z: 240, name: 'Pasokon Studio' },
    { x: -6, z: 320, name: 'Jellysmack' },
    { x: 62, z: 400, name: 'Scorechain' },
    { x: 4, z: 480, name: 'Cyberpunk Desk' },
    { x: -50, z: 566, name: 'Gamefolio' }
  ];
  var curve = (function () {
    var pts = [new T.Vector3(0, 0, -20)];
    WAYPOINTS.forEach(function (w) { pts.push(new T.Vector3(w.x, 0, w.z)); });
    pts.push(new T.Vector3(-50, 0, 604));
    return new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  })();
  var PATH_LEN = curve.getLength();
  var PATH_PTS = curve.getSpacedPoints(460);

  /* u of each waypoint on the curve */
  var wpU = WAYPOINTS.map(function (w) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < PATH_PTS.length; i++) {
      var dx = PATH_PTS[i].x - w.x, dz = PATH_PTS[i].z - w.z;
      var d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best / (PATH_PTS.length - 1);
  });

  function uToZone(u) {
    u = clamp(u, 0, 1);
    if (u <= wpU[0]) return 0;
    if (u >= wpU[N_BIOMES - 1]) return N_BIOMES - 1;
    for (var i = 0; i < N_BIOMES - 1; i++) {
      if (u <= wpU[i + 1]) return i + (u - wpU[i]) / Math.max(1e-6, wpU[i + 1] - wpU[i]);
    }
    return N_BIOMES - 1;
  }
  function zoneToU(z) {
    z = clamp(z, 0, N_BIOMES - 1);
    var i = Math.floor(z);
    if (i >= N_BIOMES - 1) return wpU[N_BIOMES - 1];
    return lerp(wpU[i], wpU[i + 1], z - i);
  }

  /* nearest path sample: z is monotonic along the route, so a
     binary search plus a generous window is enough and fast. */
  function pathNear(x, z, out) {
    var lo = 0, hi = PATH_PTS.length - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (PATH_PTS[mid].z < z) lo = mid; else hi = mid;
    }
    var s = Math.max(0, lo - 70), e = Math.min(PATH_PTS.length - 1, lo + 70);
    var best = lo, bd = Infinity;
    for (var i = s; i <= e; i++) {
      var dx = x - PATH_PTS[i].x, dz = z - PATH_PTS[i].z;
      var d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    /* also probe the ends for far corners */
    for (var k = 0; k < 24; k += 1) {
      var j1 = k, j2 = PATH_PTS.length - 1 - k;
      var a1 = x - PATH_PTS[j1].x, b1 = z - PATH_PTS[j1].z, c1 = a1 * a1 + b1 * b1;
      if (c1 < bd) { bd = c1; best = j1; }
      var a2 = x - PATH_PTS[j2].x, b2 = z - PATH_PTS[j2].z, c2 = a2 * a2 + b2 * b2;
      if (c2 < bd) { bd = c2; best = j2; }
    }
    out.i = best;
    out.u = best / (PATH_PTS.length - 1);
    out.dist = Math.sqrt(bd);
    return out;
  }

  /* =========================================================
     RENDERER / SCENE
     ========================================================= */
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.85));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  if ('outputColorSpace' in renderer && T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
  else if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping || 0;
  renderer.toneMappingExposure = 1.14;

  var scene = new T.Scene();
  scene.fog = new T.FogExp2(BIOMES[0].fog.color, BIOMES[0].fog.density);

  var camera = new T.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(0, 7, 16);

  /* ---------------- canvas textures ---------------- */
  function radialTex(softness, inner) {
    var s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,' + (inner || 1) + ')');
    grd.addColorStop(softness || 0.28, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    var t = new T.CanvasTexture(c);
    if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  var texGlow = radialTex(0.22, 1);
  var texSoft = radialTex(0.44, 0.9);

  function windowsTex() {
    var w = 64, h = 128, c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (var y = 6; y < h - 4; y += 6) {
      for (var x = 4; x < w - 3; x += 5) {
        if (rand() > 0.58) {
          g.fillStyle = 'rgba(255,255,255,' + (0.25 + rand() * 0.75) + ')';
          g.fillRect(x, y, 2, 3);
        }
      }
    }
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  var texWin = windowsTex();

  function beamTex() {
    var c = document.createElement('canvas');
    c.width = 8; c.height = 128;
    var g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 128, 0, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 8, 128);
    var t = new T.CanvasTexture(c);
    if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  var texBeam = beamTex();

  function textTex(lines, w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    lines.forEach(function (l) {
      g.font = l.font;
      g.fillStyle = l.color;
      g.shadowColor = l.shadow || l.color;
      g.shadowBlur = l.blur || 24;
      g.fillText(l.text, w / 2, l.y);
    });
    var t = new T.CanvasTexture(c);
    if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  /* =========================================================
     SKY
     ========================================================= */
  var skyU = {
    uTime: { value: 0 },
    uTop: { value: col(BIOMES[0].sky.top) },
    uMid: { value: col(BIOMES[0].sky.mid) },
    uHor: { value: col(BIOMES[0].sky.hor) },
    uGlow: { value: col(BIOMES[0].sky.glow) },
    uBand: { value: BIOMES[0].sky.band },
    uGlowStr: { value: 1.0 }
  };
  var sky = new T.Mesh(
    new T.SphereGeometry(900, 48, 28),
    new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, uniforms: skyU,
      vertexShader: [
        'varying vec3 vPos;',
        'void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vPos;',
        'uniform float uTime; uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uGlow; uniform float uBand; uniform float uGlowStr;',
        'void main(){',
        '  vec3 p = normalize(vPos);',
        '  float h = p.y;',
        '  vec3 midc = uMid;',
        '  vec3 col = mix(midc, uTop, smoothstep(0.12,0.82,h));',
        '  col = mix(uHor, col, smoothstep(-0.03,0.34,h));',
        '  float band = exp(-pow((h-0.015)*11.0,2.0));',
        '  float side = 0.42 + 0.58*pow(abs(p.x*0.55+p.z*0.84),1.6);',
        '  col += uGlow * band * uBand * side * 0.85;',
        '  float band2 = exp(-pow((h-0.10)*26.0,2.0));',
        '  col += uGlow * band2 * uBand * 0.16;',
        '  float drift = 0.5 + 0.5*sin(uTime*0.16 + p.x*3.0 + p.z*2.0);',
        '  col += uGlow * drift * 0.035 * smoothstep(-0.1,0.5,h) * uGlowStr;',
        '  col += vec3(0.012,0.016,0.03) * (1.0 - smoothstep(-0.35,0.05,h));',
        '  gl_FragColor = vec4(col,1.0);',
        '}'
      ].join('\n')
    })
  );
  sky.position.set(0, 0, 232);
  scene.add(sky);

  /* stars */
  var starsMat;
  (function stars() {
    var n = isMobile ? 900 : 2200;
    var pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var th = rand() * Math.PI * 2;
      var ph = Math.acos(0.02 + rand() * 0.98);
      var r = 640 + rand() * 80;
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      pos[i * 3 + 1] = Math.cos(ph) * r * 0.92 + 20;
      pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
      var warm = rand();
      colr[i * 3] = 0.55 + warm * 0.45;
      colr[i * 3 + 1] = 0.75 + warm * 0.22;
      colr[i * 3 + 2] = 1.0;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('color', new T.BufferAttribute(colr, 3));
    starsMat = new T.PointsMaterial({
      size: 1.9, sizeAttenuation: false, map: texGlow, transparent: true,
      opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, fog: false
    });
    scene.add(new T.Points(g, starsMat));
  })();

  /* low sun / moon disc — position, size and colour are per biome */
  var sunSprite = new T.Sprite(new T.SpriteMaterial({
    map: texSoft, color: 0x9ff8ff, transparent: true, opacity: 0.3,
    blending: T.AdditiveBlending, depthWrite: false, fog: false
  }));
  sunSprite.scale.set(150, 150, 1);
  scene.add(sunSprite);
  var sunDir = new T.Vector3(-0.42, 0.07, -1).normalize();

  /* a giant orbital ring that only belongs to chapter 07 */

  /* distant gas giant, seen from the first and last chapters */
  var planetGroup = new T.Group();
  (function planet() {
    var disc = new T.Mesh(new T.SphereGeometry(54, 36, 26), new T.MeshBasicMaterial({ color: 0x1b2a4a, fog: false }));
    planetGroup.add(disc);
    var halo = new T.Sprite(new T.SpriteMaterial({
      map: texSoft, color: 0x2a6fa8, transparent: true, opacity: 0.26,
      blending: T.AdditiveBlending, depthWrite: false, fog: false
    }));
    halo.scale.set(230, 230, 1);
    planetGroup.add(halo);
    var ring = new T.Mesh(
      new T.TorusGeometry(84, 0.6, 6, 150),
      new T.MeshBasicMaterial({ color: 0x3ea6c8, transparent: true, opacity: 0.3, blending: T.AdditiveBlending, depthWrite: false, fog: false })
    );
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.z = 0.34;
    planetGroup.add(ring);
    planetGroup.position.set(-430, 250, 760);
    planetGroup.rotation.y = 0.4;
    scene.add(planetGroup);
  })();

  /* =========================================================
     LIGHTS
     ========================================================= */
  var hemi = new T.HemisphereLight(BIOMES[0].hemi[0], BIOMES[0].hemi[1], BIOMES[0].hemi[2]);
  scene.add(hemi);
  var keyLight = new T.DirectionalLight(BIOMES[0].key[0], BIOMES[0].key[1]);
  keyLight.position.set(BIOMES[0].key[2], BIOMES[0].key[3], BIOMES[0].key[4]);
  scene.add(keyLight);
  var rimLight = new T.DirectionalLight(BIOMES[0].rim[0], BIOMES[0].rim[1]);
  rimLight.position.set(-80, 40, 60);
  scene.add(rimLight);
  var bounce = new T.DirectionalLight(0x66d8ff, 0.18);
  bounce.position.set(0, -40, 0);
  scene.add(bounce);

  /* =========================================================
     TERRAIN — one mesh, biome-blended height & colour
     ========================================================= */
  function pathBaseY(u) {
    var y = 1.35 * Math.sin(u * 21.0) + 0.85 * Math.sin(u * 7.3 + 1.3);
    y += sstep(u, wpU[N_BIOMES - 1] - 0.012, 1.0) * 5.2;   /* the citadel climb */
    return y;
  }

  /* a ridge across the route at every threshold between two worlds:
     the road slips through a gap, the next chapter stays hidden behind it */
  function gateAt(u) {
    var g = 0;
    for (var k = 1; k < N_BIOMES; k++) {
      var ub = (wpU[k - 1] + wpU[k]) * 0.5;
      var d = (u - ub) * PATH_LEN;
      if (d < -46 || d > 46) continue;
      g += Math.exp(-(d * d) / 162);
    }
    return g * 17;
  }

  var _pn = { i: 0, u: 0, dist: 0 };
  var _bp = { amp: 0, freq: 0, ridge: 0, terrace: 0, step: 1, swell: 0, seed: 0 };

  function blendTerrain(z) {
    var i0 = Math.min(N_BIOMES - 2, Math.floor(z));
    var f = sstep(z - i0, 0.62, 0.86);
    var a = BIOMES[i0].terrain, b = BIOMES[i0 + 1].terrain;
    _bp.amp = lerp(a.amp, b.amp, f);
    _bp.freq = lerp(a.freq, b.freq, f);
    _bp.ridge = lerp(a.ridge, b.ridge, f);
    _bp.terrace = lerp(a.terrace, b.terrace, f);
    _bp.step = lerp(a.step, b.step, f);
    _bp.swell = lerp(a.swell, b.swell, f);
    _bp.seed = lerp(a.seed, b.seed, f);
    _bp.zone = z;
    return _bp;
  }

  function reliefAt(x, z, p) {
    var s = p.seed;
    var n1 = fbm(x * p.freq + s, z * p.freq - s * 0.7) - 0.5;
    var h = n1 * 2.0 * p.amp;
    if (p.ridge > 0.01) {
      var r = 1.0 - Math.abs(fbm(x * p.freq * 2.15 + s * 1.7, z * p.freq * 2.15 - s) * 2.0 - 1.0);
      h += p.ridge * r * r * p.amp * 1.35;
    }
    if (p.terrace > 0.01) {
      var q = Math.round(h / p.step) * p.step;
      h = lerp(h, q, clamp(p.terrace, 0, 1) * 0.72);
    }
    var far = sstep(_pn.dist, 55, 230);
    h += far * p.swell * (0.5 + 0.5 * fbm(x * 0.006 + 4.2, z * 0.006 - 2.1));
    return h;
  }

  function terrainHeight(x, z) {
    pathNear(x, z, _pn);
    var p = blendTerrain(uToZone(_pn.u));
    var cor = sstep(_pn.dist, 8, 24);
    var gate = gateAt(_pn.u) * sstep(_pn.dist, 6, 24);
    return pathBaseY(_pn.u) + cor * reliefAt(x, z, p) - 0.05 + gate;
  }

  var T_SIZE = 1250, T_SEG = isMobile ? 148 : 248;
  var T_CX = 0, T_CZ = 232;
  var groundGeo = new T.PlaneGeometry(T_SIZE, T_SIZE, T_SEG, T_SEG);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(T_CX, 0, T_CZ);

  var NRM = new T.Vector3();
  var KEYDIR = new T.Vector3(0.42, 0.82, -0.38).normalize();

  (function buildTerrain() {
    var pos = groundGeo.attributes.position;
    var n = pos.count;
    var base = new Float32Array(n * 3);
    var glow = new Float32Array(n * 3);
    var pat = new Float32Array(n * 3);
    var road = new Float32Array(n);
    var hiTint = new Float32Array(n * 3);
    var roadTint = new Float32Array(n * 3);
    var glowStr = new Float32Array(n);
    var x, z, i, u, dist, zone, p;

    for (i = 0; i < n; i++) {
      x = pos.getX(i); z = pos.getZ(i);
      pathNear(x, z, _pn);
      u = _pn.u; dist = _pn.dist;
      zone = uToZone(u);
      p = blendTerrain(zone);
      var cor = sstep(dist, 8, 24);
      var gate = gateAt(u) * sstep(dist, 6, 24);
      pos.setY(i, pathBaseY(u) + cor * reliefAt(x, z, p) - 0.05 + gate);

      var i0 = Math.min(N_BIOMES - 2, Math.floor(zone));
      var f = sstep(zone - i0, 0.62, 0.86);
      var ga = BIOMES[i0].ground, gb = BIOMES[i0 + 1].ground;
      var b0 = BIOMES[i0].ground.base, b1 = BIOMES[i0 + 1].ground.base;
      var h0 = BIOMES[i0].ground.hi, h1 = BIOMES[i0 + 1].ground.hi;
      var l0 = BIOMES[i0].ground.line, l1 = BIOMES[i0 + 1].ground.line;
      var r0 = BIOMES[i0].ground.road, r1 = BIOMES[i0 + 1].ground.road;
      var pa0 = ga.pat, pa1 = gb.pat;

      var varn = fbm(x * 0.09 + 7.7, z * 0.09 - 3.3) * 0.28 + 0.86;
      base[i * 3] = lerp(lerp(b0[0], b1[0], f), lerp(h0[0], h1[0], f), 0.0) * varn;
      base[i * 3 + 1] = lerp(b0[1], b1[1], f) * varn;
      base[i * 3 + 2] = lerp(b0[2], b1[2], f) * varn;
      /* store the "high" tint in a second pass below via slope: keep in glow until then */
      glow[i * 3] = lerp(l0[0], l1[0], f);
      glow[i * 3 + 1] = lerp(l0[1], l1[1], f);
      glow[i * 3 + 2] = lerp(l0[2], l1[2], f);
      pat[i * 3] = lerp(pa0[0], pa1[0], f);
      pat[i * 3 + 1] = lerp(pa0[1], pa1[1], f);
      pat[i * 3 + 2] = lerp(pa0[2], pa1[2], f);
      road[i] = (1.0 - sstep(dist, 2.0, 5.6)) * 0.9 + (1.0 - sstep(dist, 5.6, 11)) * 0.10;

      /* keep high tint for later */
      hiTint[i * 3] = lerp(h0[0], h1[0], f);
      hiTint[i * 3 + 1] = lerp(h0[1], h1[1], f);
      hiTint[i * 3 + 2] = lerp(h0[2], h1[2], f);
      roadTint[i * 3] = lerp(r0[0], r1[0], f);
      roadTint[i * 3 + 1] = lerp(r0[1], r1[1], f);
      roadTint[i * 3 + 2] = lerp(r0[2], r1[2], f);
      glowStr[i] = lerp(ga.glow, gb.glow, f);
    }
    pos.needsUpdate = true;
    groundGeo.computeVertexNormals();

    var nrm = groundGeo.attributes.normal;
    for (i = 0; i < n; i++) {
      NRM.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
      var lam = clamp(NRM.dot(KEYDIR) * 0.55 + 0.55, 0.25, 1.35);
      var slope = clamp(1.0 - NRM.y, 0, 1);
      var mixH = clamp(slope * 1.65 + 0.10, 0, 1);
      base[i * 3] = (base[i * 3] + (hiTint[i * 3] - base[i * 3]) * mixH) * lam;
      base[i * 3 + 1] = (base[i * 3 + 1] + (hiTint[i * 3 + 1] - base[i * 3 + 1]) * mixH) * lam;
      base[i * 3 + 2] = (base[i * 3 + 2] + (hiTint[i * 3 + 2] - base[i * 3 + 2]) * mixH) * lam;
      glow[i * 3] *= glowStr[i]; glow[i * 3 + 1] *= glowStr[i]; glow[i * 3 + 2] *= glowStr[i];
      roadTint[i * 3] *= lam; roadTint[i * 3 + 1] *= lam; roadTint[i * 3 + 2] *= lam;
    }
    groundGeo.setAttribute('aBase', new T.BufferAttribute(base, 3));
    groundGeo.setAttribute('aGlow', new T.BufferAttribute(glow, 3));
    groundGeo.setAttribute('aPat', new T.BufferAttribute(pat, 3));
    groundGeo.setAttribute('aRoadTint', new T.BufferAttribute(roadTint, 3));
    groundGeo.setAttribute('aRoad', new T.BufferAttribute(road, 1));
  })();

  var groundU = {
    uTime: { value: 0 },
    uCam: { value: new T.Vector3() },
    uFogColor: { value: col(BIOMES[0].fog.color) },
    uFogDensity: { value: BIOMES[0].fog.density }
  };
  var groundMat = new T.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: groundU,
    vertexShader: [
      'attribute vec3 aBase; attribute vec3 aGlow; attribute vec3 aPat; attribute vec3 aRoadTint; attribute float aRoad;',
      'varying vec3 vWorld; varying vec3 vBase; varying vec3 vGlow; varying vec3 vPat; varying vec3 vRoadTint; varying float vRoad;',
      'void main(){',
      '  vec4 wp = modelMatrix * vec4(position,1.0);',
      '  vWorld = wp.xyz; vBase = aBase; vGlow = aGlow; vPat = aPat; vRoadTint = aRoadTint; vRoad = aRoad;',
      '  gl_Position = projectionMatrix * viewMatrix * wp;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vWorld; varying vec3 vBase; varying vec3 vGlow; varying vec3 vPat; varying vec3 vRoadTint; varying float vRoad;',
      'uniform float uTime; uniform vec3 uCam; uniform vec3 uFogColor; uniform float uFogDensity;',
      'float lineAt(vec2 p, float s){',
      '  vec2 q = p / s; vec2 w = fwidth(q);',
      '  vec2 g = abs(fract(q - 0.5) - 0.5) / max(w, vec2(1e-5));',
      '  return 1.0 - min(min(g.x, g.y), 1.0);',
      '}',
      'void main(){',
      '  vec2 p = vWorld.xz;',
      '  float minor = lineAt(p, 3.4);',
      '  float major = lineAt(p, 23.8);',
      '  float sy = vWorld.y * 0.5;',
      '  float strata = 1.0 - min(abs(fract(sy) - 0.5) / max(fwidth(sy), 1e-4), 1.0);',
      '  float dots = smoothstep(0.86, 1.0, sin(p.x * 7.4) * sin(p.y * 6.3));',
      '  float pulse = 0.72 + 0.28 * sin(uTime * 0.6 - length(p) * 0.03);',
      '  float pat = (minor * 0.30 + major * 1.05) * vPat.x + strata * 0.55 * vPat.y + dots * 0.45 * vPat.z;',
      '  vec3 col = vBase + vGlow * pat * (0.55 + 0.65 * pulse);',
      '  float road = smoothstep(0.45, 0.92, vRoad);',
      '  float dash = smoothstep(0.15, 1.0, sin((p.x + p.y) * 0.30 - uTime * 0.75));',
      '  vec3 rc = vRoadTint * (0.95 + 0.85 * dash) + vGlow * 0.30 * dash;',
      '  col = mix(col, rc, road * 0.55);',
      '  float d = length(vWorld - uCam);',
      '  float fog = 1.0 - exp(-uFogDensity * uFogDensity * d * d);',
      '  col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  var ground = new T.Mesh(groundGeo, groundMat);
  ground.frustumCulled = false;
  scene.add(ground);

  /* =========================================================
     PROPS — each chapter gets its own architecture
     ========================================================= */
  function stdMat(color, rough, metal) {
    return new T.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.75 : rough, metalness: metal == null ? 0.2 : metal });
  }
  function glowMat(color, opacity) {
    return new T.MeshBasicMaterial({
      color: color, transparent: true, opacity: opacity == null ? 1 : opacity,
      blending: T.AdditiveBlending, depthWrite: false
    });
  }
  function edgeOf(mesh, color, opacity) {
    var e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry), new T.LineBasicMaterial({
      color: color, transparent: true, opacity: opacity == null ? 0.5 : opacity,
      blending: T.AdditiveBlending, depthWrite: false
    }));
    e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale);
    return e;
  }

  var dynamics = [];
  var propGroups = [];

  function scatter(bi, count, rMin, rMax, minPath) {
    var out = [], tries = 0, info = {};
    count = Math.max(3, Math.round(count * DENSITY));
    while (out.length < count && tries < count * 45) {
      tries++;
      var z = bi + (rand() * 2 - 1) * 0.30;
      var u = zoneToU(z);
      var p = curve.getPointAt(clamp(u, 0.002, 0.998));
      var a = rand() * Math.PI * 2, r = rMin + rand() * (rMax - rMin);
      var x = p.x + Math.cos(a) * r, zz = p.z + Math.sin(a) * r;
      pathNear(x, zz, info);
      if (info.dist < minPath) continue;
      out.push({ x: x, z: zz, y: terrainHeight(x, zz), u: u });
    }
    return out;
  }

  function spawn(bi, count, rMin, rMax, minPath, build) {
    var g = new T.Group();
    propGroups.push(g);
    scene.add(g);
    scatter(bi, count, rMin, rMax, minPath).forEach(function (p, i) { build(g, p, i); });
    return g;
  }

  function farSpots(bi, count, rMin, rMax, minPathDist) {
    var out = [], tries = 0, info = {};
    count = Math.max(2, Math.round(count * DENSITY));
    while (out.length < count && tries < count * 50) {
      tries++;
      var a = rand() * Math.PI * 2;
      var r = rMin + rand() * (rMax - rMin);
      var c = curve.getPointAt(zoneToU(bi));
      var x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      pathNear(x, z, info);
      if (info.dist < minPathDist) continue;
      if (Math.abs(uToZone(info.u) - bi) > 0.60) continue;
      out.push({ x: x, z: z, y: terrainHeight(x, z), u: info.u });
    }
    return out;
  }

  /* ---------- 01 · Cyan grid valley ---------- */
  (function valley() {
    var dark = stdMat(0x0a1523, 0.7, 0.5);
    var accent = 0x2fe6ff;
    spawn(0, 22, 20, 100, 12, function (g, p, i) {
      var kind = i % 4;
      if (kind === 0) {
        var h = 5 + rand() * 11;
        var m = new T.Mesh(new T.BoxGeometry(0.5, h, 0.5), dark);
        m.position.set(p.x, p.y + h / 2, p.z); m.rotation.y = rand() * 3;
        g.add(m); g.add(edgeOf(m, accent, 0.45));
        var tip = new T.Mesh(new T.BoxGeometry(0.62, 0.10, 0.62), glowMat(accent, 0.9));
        tip.position.set(p.x, p.y + h, p.z); tip.rotation.y = m.rotation.y; g.add(tip);
      } else if (kind === 1) {
        var s = 1.2 + rand() * 1.8;
        var cube = new T.Mesh(new T.BoxGeometry(s, s, s), new T.MeshStandardMaterial({ color: 0x081a26, roughness: 0.3, metalness: 0.7, emissive: 0x0a3d4a, emissiveIntensity: 0.6 }));
        cube.position.set(p.x, p.y + 3 + rand() * 6, p.z);
        cube.rotation.set(rand(), rand(), rand());
        g.add(cube); g.add(edgeOf(cube, accent, 0.7));
        dynamics.push({ o: cube, fn: function (t) { cube.rotation.y += 0.004; cube.rotation.x += 0.0016; cube.position.y += Math.sin(t * 0.8 + i) * 0.003; } });
      } else if (kind === 2) {
        var rad = 3.5 + rand() * 4;
        var arch = new T.Mesh(new T.TorusGeometry(rad, 0.06, 6, 60, Math.PI), glowMat(accent, 0.75));
        arch.position.set(p.x, p.y + 0.1, p.z);
        arch.rotation.y = rand() * Math.PI;
        g.add(arch);
      } else {
        var ring = new T.Mesh(new T.RingGeometry(2.4, 2.55, 44), glowMat(accent, 0.5));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p.x, p.y + 0.08, p.z);
        g.add(ring);
        dynamics.push({ o: ring, fn: function (t) { ring.rotation.z += 0.002; } });
      }
    });
    /* distant skyline — only this chapter has a city, and it stays on its horizon */
    var sky = new T.Group(); scene.add(sky);
    var cityMat = new T.MeshStandardMaterial({ color: 0x050a12, roughness: 0.95, metalness: 0.1 });
    farSpots(0, isMobile ? 12 : 22, 150, 300, 135).forEach(function (p2) {
      var ang = Math.atan2(p2.x - 0, p2.z + 20);
      var w = 8 + rand() * 16, h = 16 + rand() * 78, d = 8 + rand() * 16;
      var b = new T.Mesh(new T.BoxGeometry(w, h, d), cityMat);
      b.position.set(p2.x, h / 2 - 4, p2.z); b.rotation.y = -ang;
      sky.add(b);
      var win = new T.Mesh(new T.PlaneGeometry(w * 0.9, h * 0.92), new T.MeshBasicMaterial({
        map: texWin, transparent: true, opacity: 0.4 + rand() * 0.28,
        color: rand() > 0.6 ? 0x6ff6ff : 0x9f8bff, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      }));
      win.position.set(p2.x - Math.cos(ang) * (d / 2 + 0.4), h / 2 - 4, p2.z - Math.sin(ang) * (d / 2 + 0.4));
      win.rotation.y = -ang + Math.PI / 2;
      sky.add(win);
    });
  })();

  /* ---------- 02 · Amber canyon ---------- */
  (function canyon() {
    var rockA = stdMat(0x6b3418, 0.95, 0.05);
    var rockB = stdMat(0x4a2210, 0.95, 0.05);
    var rockC = stdMat(0x8a4a22, 0.9, 0.05);
    spawn(1, 20, 18, 105, 12, function (g, p, i) {
      var kind = i % 4;
      if (kind === 0) {
        var h = 6 + rand() * 12, rTop = 1.6 + rand() * 2.4, rBot = rTop + 1.4 + rand() * 2.4;
        var mesa = new T.Mesh(new T.CylinderGeometry(rTop, rBot, h, 7, 1), rockA);
        mesa.position.set(p.x, p.y + h / 2 - 0.3, p.z); mesa.rotation.y = rand();
        g.add(mesa);
        for (var k = 1; k <= 3; k++) {
          var band = new T.Mesh(new T.CylinderGeometry(rTop * 1.02 + k * 0.08, rBot * 1.02 - k * 0.06, h * 0.10, 7, 1), k % 2 ? rockB : rockC);
          band.position.set(p.x, p.y + h * (k / 4.2), p.z); band.rotation.y = mesa.rotation.y;
          g.add(band);
        }
      } else if (kind === 1) {
        var rad = 4 + rand() * 5;
        var arch = new T.Mesh(new T.TorusGeometry(rad, 0.9 + rand() * 0.8, 8, 30, Math.PI * (0.9 + rand() * 0.6)), rockA);
        arch.position.set(p.x, p.y - 0.4, p.z);
        arch.rotation.set(rand() * 0.15, rand() * Math.PI, rand() * 0.2);
        g.add(arch);
      } else if (kind === 2) {
        var hh = 3 + rand() * 3;
        var y = p.y;
        for (var j = 0; j < 3; j++) {
          var seg = new T.Mesh(new T.CylinderGeometry(0.9 - j * 0.2, 1.2 - j * 0.2, hh * (1 - j * 0.18), 6, 1), j % 2 ? rockB : rockC);
          seg.position.set(p.x + Math.sin(j * 2 + i) * 0.2, y + hh * 0.5, p.z);
          g.add(seg);
          y += hh * (1 - j * 0.18) * 0.92;
        }
      } else {
        var sp = new T.Mesh(new T.ConeGeometry(1.6 + rand() * 2.2, 6 + rand() * 9, 6), rockB);
        sp.position.set(p.x, p.y + 3, p.z); sp.rotation.y = rand();
        g.add(sp);
      }
    });
    /* distant mesas */
    var far = new T.Group(); scene.add(far);
    farSpots(1, isMobile ? 7 : 13, 165, 330, 120).forEach(function (p2) {
      var h = 22 + rand() * 55;
      var m = new T.Mesh(new T.CylinderGeometry(10 + rand() * 18, 16 + rand() * 26, h, 7, 1), rockB);
      m.position.set(p2.x, h / 2 + 4, p2.z);
      m.rotation.y = rand() * 3;
      far.add(m);
    });
  })();

  /* ---------- 03 · Violet monolith ruins ---------- */
  (function ruins() {
    var stone = stdMat(0x1a1330, 0.8, 0.25);
    var accent = 0xb07bff;
    spawn(2, 20, 18, 100, 12, function (g, p, i) {
      var kind = i % 4;
      if (kind === 0) {
        var h = 6 + rand() * 14, w = 1.2 + rand() * 2.4, d = 3 + rand() * 4;
        var mono = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: 0x140f28, roughness: 0.55, metalness: 0.4, emissive: 0x2a1a5a, emissiveIntensity: 0.5 }));
        mono.position.set(p.x, p.y + h / 2, p.z);
        mono.rotation.set((rand() - 0.5) * 0.16, rand() * Math.PI, (rand() - 0.5) * 0.16);
        g.add(mono); g.add(edgeOf(mono, accent, 0.55));
      } else if (kind === 1) {
        var h2 = 3 + rand() * 5;
        var baseCol = new T.Mesh(new T.CylinderGeometry(0.8, 1.0, 0.5, 8), stone);
        baseCol.position.set(p.x, p.y + 0.25, p.z); g.add(baseCol);
        var col = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, h2, 8), stone);
        col.position.set(p.x, p.y + h2 / 2 + 0.4, p.z); col.rotation.z = (rand() - 0.5) * 0.12;
        g.add(col); g.add(edgeOf(col, accent, 0.3));
        var cap = new T.Mesh(new T.BoxGeometry(1.5, 0.28, 1.5), stone);
        cap.position.set(p.x, p.y + h2 + 0.55, p.z); g.add(cap);
      } else if (kind === 2) {
        var sh = new T.Mesh(new T.OctahedronGeometry(0.9 + rand() * 1.4, 0), new T.MeshStandardMaterial({ color: 0x1a1038, emissive: accent, emissiveIntensity: 1.1, roughness: 0.3, metalness: 0.5 }));
        sh.position.set(p.x, p.y + 4 + rand() * 7, p.z);
        sh.rotation.set(rand(), rand(), rand());
        g.add(sh); g.add(edgeOf(sh, accent, 0.8));
        dynamics.push({ o: sh, fn: function (t) { sh.rotation.y += 0.005; sh.position.y += Math.sin(t * 0.7 + i) * 0.004; } });
      } else {
        var n = 3 + Math.floor(rand() * 3);
        for (var j = 0; j < n; j++) {
          var st = new T.Mesh(new T.BoxGeometry(4 - j * 0.6, 0.35, 3 - j * 0.4), stone);
          st.position.set(p.x + Math.cos(i) * j * 0.35, p.y + 0.18 + j * 0.36, p.z + Math.sin(i) * j * 0.35);
          st.rotation.y = rand() * 0.3;
          g.add(st);
        }
      }
    });
    var far = new T.Group(); scene.add(far);
    farSpots(2, isMobile ? 6 : 11, 155, 320, 115).forEach(function (p2) {
      var h = 40 + rand() * 90;
      var slab = new T.Mesh(new T.BoxGeometry(8 + rand() * 10, h, 4 + rand() * 6), stdMat(0x0b0818, 0.9, 0.2));
      slab.position.set(p2.x, h / 2 + 6, p2.z);
      slab.rotation.y = rand() * 3; slab.rotation.z = (rand() - 0.5) * 0.1;
      far.add(slab);
      far.add(edgeOf(slab, accent, 0.22));
    });
  })();

  /* ---------- 04 · Emerald data grove ---------- */
  (function grove() {
    var trunk = stdMat(0x0a2418, 0.9, 0.1);
    var accent = 0x48ffb0;
    var canopyGeo = new T.IcosahedronGeometry(1, 1);
    spawn(3, 26, 16, 95, 11, function (g, p, i) {
      var kind = i % 3;
      if (kind === 0 || kind === 1) {
        var h = 5 + rand() * 9;
        var t = new T.Mesh(new T.CylinderGeometry(0.22 + rand() * 0.14, 0.46, h, 7), trunk);
        t.position.set(p.x, p.y + h / 2, p.z);
        g.add(t);
        var crownMat = new T.MeshStandardMaterial({
          color: 0x06180f, emissive: accent, emissiveIntensity: 1.1 + rand() * 0.5,
          roughness: 0.55, metalness: 0.15, flatShading: true
        });
        for (var c2 = 0; c2 < 3; c2++) {
          var crown = new T.Mesh(canopyGeo, crownMat);
          crown.position.set(p.x + (rand() - 0.5) * 2.4, p.y + h + 0.2 + (rand() - 0.4) * 1.8, p.z + (rand() - 0.5) * 2.4);
          crown.scale.set(2.0 + rand() * 1.6, 1.5 + rand() * 1.1, 2.0 + rand() * 1.6);
          g.add(crown);
        }
        var halo = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: accent, transparent: true, opacity: 0.26, blending: T.AdditiveBlending, depthWrite: false }));
        halo.scale.setScalar(12 + rand() * 8);
        halo.position.set(p.x, p.y + h + 0.6, p.z);
        g.add(halo);
      } else {
        for (var k = 0; k < 4; k++) {
          var spore = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: accent, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
          spore.scale.setScalar(0.7 + rand() * 0.9);
          spore.position.set(p.x + (rand() - 0.5) * 9, p.y + 1.5 + rand() * 7, p.z + (rand() - 0.5) * 9);
          g.add(spore);
          dynamics.push({ o: spore, fn: (function (s, ph) { return function (t) { s.position.y += Math.sin(t * 1.1 + ph) * 0.004; s.material.opacity = 0.35 + 0.3 * Math.abs(Math.sin(t * 0.9 + ph)); }; })(spore, i + k) });
        }
      }
    });
  })();

  /* ---------- 05 · Crimson basalt bridge ---------- */
  (function volcanic() {
    var basalt = stdMat(0x1a0d0e, 0.92, 0.12);
    var accent = 0xff5a2a;
    spawn(4, 20, 16, 95, 11, function (g, p, i) {
      var kind = i % 3;
      if (kind === 0) {
        var n = 3 + Math.floor(rand() * 4);
        for (var k = 0; k < n; k++) {
          var h = 5 + rand() * 12;
          var col = new T.Mesh(new T.CylinderGeometry(0.9, 1.05, h, 6), basalt);
          col.position.set(p.x + (rand() - 0.5) * 3.4, p.y + h / 2, p.z + (rand() - 0.5) * 3.4);
          col.rotation.y = rand() * 3;
          g.add(col);
          var top = new T.Mesh(new T.CylinderGeometry(0.92, 0.92, 0.06, 6), glowMat(accent, 0.35));
          top.position.set(col.position.x, p.y + h, col.position.z);
          g.add(top);
        }
      } else if (kind === 1) {
        var v = new T.Mesh(new T.ConeGeometry(3 + rand() * 4, 4 + rand() * 6, 7), basalt);
        v.position.set(p.x, p.y + 2.6, p.z); g.add(v);
        var mouth = new T.Mesh(new T.CircleGeometry(0.9 + rand() * 1.2, 16), glowMat(accent, 0.85));
        mouth.rotation.x = -Math.PI / 2;
        mouth.position.set(p.x, p.y + 5.0, p.z);
        g.add(mouth);
        var pool = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: accent, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false }));
        pool.scale.setScalar(16); pool.position.set(p.x, p.y + 5.4, p.z);
        g.add(pool);
      } else {
        for (var c = 0; c < 3; c++) {
          var crack = new T.Mesh(new T.PlaneGeometry(0.35 + rand() * 0.4, 8 + rand() * 14), glowMat(accent, 0.55));
          crack.rotation.x = -Math.PI / 2;
          crack.rotation.z = rand() * Math.PI;
          crack.position.set(p.x + (rand() - 0.5) * 8, p.y + 0.07, p.z + (rand() - 0.5) * 8);
          g.add(crack);
        }
      }
    });
    var volcano = new T.Mesh(new T.ConeGeometry(70, 90, 9), stdMat(0x1c0a0a, 0.95, 0.05));
    volcano.position.set(250, 30, 352);
    scene.add(volcano);
    var glow = new T.Sprite(new T.SpriteMaterial({ map: texSoft, color: 0xff4a1a, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    glow.scale.set(260, 160, 1); glow.position.set(250, 80, 352);
    scene.add(glow);
  })();

  /* ---------- 06 · Arctic mirror flats ---------- */
  (function mirror() {
    var accent = 0xdfefff;
    spawn(5, 22, 18, 108, 12, function (g, p, i) {
      var kind = i % 3;
      if (kind === 0) {
        var h = 4 + rand() * 14;
        var spike = new T.Mesh(new T.ConeGeometry(0.8 + rand() * 1.6, h, 5), new T.MeshStandardMaterial({
          color: 0xbfe0f2, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.9, flatShading: true
        }));
        spike.position.set(p.x, p.y + h / 2, p.z);
        spike.rotation.set((rand() - 0.5) * 0.25, rand(), (rand() - 0.5) * 0.25);
        g.add(spike); g.add(edgeOf(spike, accent, 0.5));
      } else if (kind === 1) {
        for (var k = 0; k < 4; k++) {
          var sh = new T.Mesh(new T.BoxGeometry(0.12, 3 + rand() * 7, 0.9 + rand() * 1.6), new T.MeshStandardMaterial({ color: 0xd6ecf8, roughness: 0.05, metalness: 0.6 }));
          sh.position.set(p.x + (rand() - 0.5) * 6, p.y + 2 + rand() * 2, p.z + (rand() - 0.5) * 6);
          sh.rotation.set(rand() * 0.5, rand() * 3, (rand() - 0.5) * 0.5);
          g.add(sh); g.add(edgeOf(sh, accent, 0.45));
        }
      } else {
        var disc = new T.Mesh(new T.CylinderGeometry(4 + rand() * 6, 4.2 + rand() * 6, 0.08, 40), new T.MeshStandardMaterial({ color: 0xc9e4f2, roughness: 0.08, metalness: 0.85 }));
        disc.position.set(p.x, p.y + 0.05, p.z);
        g.add(disc);
      }
    });
    farSpots(5, isMobile ? 6 : 10, 190, 340, 150).forEach(function (p2) {
      var h = 60 + rand() * 90;
      var peak = new T.Mesh(new T.ConeGeometry(30 + rand() * 30, h, 5), new T.MeshStandardMaterial({ color: 0x9fbccd, roughness: 0.4, metalness: 0.3, flatShading: true }));
      peak.position.set(p2.x, h / 2 + 4, p2.z);
      scene.add(peak);
    });
  })();

  /* ---------- 07 · Indigo orbital ring ---------- */
  (function orbital() {
    var accent = 0x8f9cff;
    var hull = stdMat(0x0c1130, 0.5, 0.75);
    spawn(6, 18, 20, 112, 13, function (g, p, i) {
      var kind = i % 3;
      if (kind === 0) {
        var y = p.y + 8 + rand() * 16;
        var plat = new T.Mesh(new T.CylinderGeometry(4 + rand() * 5, 4 + rand() * 5, 0.7, 6), hull);
        plat.position.set(p.x, y, p.z);
        plat.rotation.y = rand();
        g.add(plat); g.add(edgeOf(plat, accent, 0.6));
        var rim = new T.Mesh(new T.TorusGeometry(4.2 + rand() * 4, 0.05, 5, 40), glowMat(accent, 0.8));
        rim.rotation.x = Math.PI / 2;
        rim.position.set(p.x, y - 0.4, p.z);
        g.add(rim);
        dynamics.push({ o: plat, fn: function (t) { plat.position.y = y + Math.sin(t * 0.5 + i) * 0.35; } });
      } else if (kind === 1) {
        var h = 10 + rand() * 16;
        var mast = new T.Mesh(new T.CylinderGeometry(0.10, 0.22, h, 6), hull);
        mast.position.set(p.x, p.y + h / 2, p.z);
        g.add(mast); g.add(edgeOf(mast, accent, 0.4));
        var beacon = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: accent, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
        beacon.scale.setScalar(1.8);
        beacon.position.set(p.x, p.y + h, p.z);
        g.add(beacon);
        dynamics.push({ o: beacon, fn: function (t) { beacon.material.opacity = 0.25 + 0.65 * Math.max(0, Math.sin(t * 2.2 + i)); } });
      } else {
        var ring = new T.Mesh(new T.TorusGeometry(2.5 + rand() * 3.5, 0.16, 5, 40), hull);
        ring.position.set(p.x, p.y + 6 + rand() * 10, p.z);
        ring.rotation.set(rand() * 1.4, rand() * 3, rand() * 1.4);
        g.add(ring); g.add(edgeOf(ring, accent, 0.55));
        dynamics.push({ o: ring, fn: function (t) { ring.rotation.z += 0.003; } });
      }
    });
  })();

  /* ---------- 08 · Golden citadel ---------- */
  (function citadel() {
    var stone = stdMat(0x4a3618, 0.75, 0.25);
    var gold = 0xffcf7a;
    var endU = wpU[N_BIOMES - 1];
    var end = curve.getPointAt(endU);
    var gateZ = 602;
    /* the gate + hologram at the end of the route */
    var gate = new T.Group();
    var gy = terrainHeight(end.x, gateZ);
    gate.position.set(end.x, gy, gateZ);
    [-6, 6].forEach(function (px) {
      var pil = new T.Mesh(new T.BoxGeometry(2.2, 11.5, 2.2), stone);
      pil.position.set(px, 5.75, 0);
      gate.add(pil);
      gate.add(edgeOf(pil, gold, 0.55));
      var strip = new T.Mesh(new T.BoxGeometry(0.18, 9.8, 0.05), glowMat(gold, 0.85));
      strip.position.set(px, 5.7, 1.12);
      gate.add(strip);
    });
    var lintel = new T.Mesh(new T.BoxGeometry(16, 1.6, 2.6), stone);
    lintel.position.set(0, 12.1, 0); gate.add(lintel);
    var crest = new T.Mesh(new T.BoxGeometry(6, 2.2, 0.4), glowMat(gold, 0.5));
    crest.position.set(0, 12.1, 1.35); gate.add(crest);
    /* steps up to the gate */
    for (var s = 0; s < 5; s++) {
      var st = new T.Mesh(new T.BoxGeometry(22 - s * 2, 0.5, 3.2), stone);
      st.position.set(0, -0.1 + s * 0.5, -3.4 - s * 3.0);
      gate.add(st);
    }
    var holo = new T.Sprite(new T.SpriteMaterial({
      map: textTex([
        { text: 'THANK YOU FOR VISITING', font: '600 62px sans-serif', color: '#fff3d4', y: 96, shadow: '#ffcf7a', blur: 34 },
        { text: 'EIGHT WORLDS · ONE JOURNEY', font: '400 26px monospace', color: '#ffd79a', y: 176, shadow: '#ffb347', blur: 20 }
      ], 1024, 256),
      transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, fog: true
    }));
    holo.scale.set(26, 6.5, 1);
    holo.position.set(0, 9.2, 0.5);
    gate.add(holo);
    dynamics.push({ o: holo, fn: function (t) { holo.material.opacity = 0.72 + 0.16 * Math.sin(t * 1.6) + (Math.sin(t * 23.0) > 0.985 ? -0.3 : 0); } });
    scene.add(gate);

    spawn(7, 22, 18, 108, 12, function (g, p, i) {
      var kind = i % 4;
      if (kind === 0) {
        var h = 8 + rand() * 18;
        var tower = new T.Mesh(new T.CylinderGeometry(1.3 + rand(), 2.0 + rand(), h, 8), stone);
        tower.position.set(p.x, p.y + h / 2, p.z);
        g.add(tower); g.add(edgeOf(tower, gold, 0.4));
        var crown = new T.Mesh(new T.ConeGeometry(2.4, 4 + rand() * 5, 8), new T.MeshStandardMaterial({ color: 0x6b4c1c, roughness: 0.6, metalness: 0.45, emissive: 0x2a1c05, emissiveIntensity: 0.6 }));
        crown.position.set(p.x, p.y + h + 2.4, p.z);
        g.add(crown);
      } else if (kind === 1) {
        var arch = new T.Mesh(new T.TorusGeometry(3 + rand() * 3, 0.5, 6, 26, Math.PI), stone);
        arch.position.set(p.x, p.y, p.z); arch.rotation.y = rand() * Math.PI;
        g.add(arch); g.add(edgeOf(arch, gold, 0.35));
      } else if (kind === 2) {
        var ob = new T.Mesh(new T.CylinderGeometry(0.35, 0.8, 9 + rand() * 10, 4), stone);
        ob.position.set(p.x, p.y + 6, p.z); ob.rotation.y = rand();
        g.add(ob); g.add(edgeOf(ob, gold, 0.5));
        var top = new T.Mesh(new T.OctahedronGeometry(0.55, 0), glowMat(gold, 0.9));
        top.position.set(p.x, p.y + 12 + rand() * 6, p.z);
        g.add(top);
      } else {
        var br = new T.Mesh(new T.PlaneGeometry(1.2, 5.5), new T.MeshStandardMaterial({ color: 0x8a3a20, roughness: 0.9, side: T.DoubleSide, emissive: 0x3a1004, emissiveIntensity: 0.4 }));
        br.position.set(p.x, p.y + 4.5, p.z); br.rotation.y = rand() * 3;
        g.add(br);
      }
    });
  })();

  /* ---------- chapter markers flanking the route ---------- */
  (function markers() {
    for (var i = 0; i < N_BIOMES; i++) {
      var u = wpU[i];
      var p = curve.getPointAt(u);
      var t = curve.getTangentAt(u);
      var perp = new T.Vector3(-t.z, 0, t.x).normalize();
      var accent = BIOMES[i].accent;
      [-1, 1].forEach(function (s) {
        var px = p.x + perp.x * 6.4 * s, pz = p.z + perp.z * 6.4 * s;
        var y = terrainHeight(px, pz);
        var h = 3.0;
        var blade = new T.Mesh(new T.BoxGeometry(0.06, h, 0.06), glowMat(accent, 0.85));
        blade.position.set(px, y + h / 2, pz);
        scene.add(blade);
        var tip = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: accent, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
        tip.scale.setScalar(2.6);
        tip.position.set(px, y + h, pz);
        scene.add(tip);
        var base = new T.Sprite(new T.SpriteMaterial({ map: texSoft, color: accent, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
        base.scale.setScalar(3.2);
        base.position.set(px, y + 0.3, pz);
        scene.add(base);
      });
    }
  })();

  /* ---------- roadside verge — what stands right beside the walk ---------- */
  (function verges() {
    var matDarkRock = stdMat(0x1a1210, 0.95, 0.1);
    var matStone = stdMat(0x241a34, 0.85, 0.25);
    var matGold = stdMat(0x6b4c1c, 0.6, 0.5);
    var matIce = new T.MeshStandardMaterial({ color: 0xcfe6f4, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.92 });
    var matHull = stdMat(0x101634, 0.55, 0.7);
    var matTrunk = stdMat(0x0a2418, 0.9, 0.1);
    var mats = [];

    var builders = [
      /* 0 · grid valley — light wands and data nuggets */
      function (g, p, i) {
        if (i % 2 === 0) {
          var h = 1.1 + rand() * 1.6;
          var wand = new T.Mesh(new T.CylinderGeometry(0.035, 0.05, h, 5), stdMat(0x0b1a26, 0.5, 0.6));
          wand.position.set(p.x, p.y + h / 2, p.z);
          g.add(wand);
          var tip = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), glowMat(0x4ff5ff, 0.95));
          tip.position.set(p.x, p.y + h, p.z); g.add(tip);
        } else {
          var s = 0.22 + rand() * 0.24;
          var cube = new T.Mesh(new T.BoxGeometry(s, s, s), new T.MeshStandardMaterial({ color: 0x081a26, emissive: 0x2fe6ff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5 }));
          cube.position.set(p.x, p.y + 0.6 + rand() * 0.8, p.z);
          cube.rotation.set(rand(), rand(), rand());
          g.add(cube);
          g.add(edgeOf(cube, 0x4ff5ff, 0.8));
          dynamics.push({ o: cube, fn: function (t) { cube.rotation.y += 0.008; } });
        }
      },
      /* 1 · canyon — stone rubble and pebble stacks */
      function (g, p, i) {
        var n = 2 + Math.floor(rand() * 3);
        var y = p.y;
        for (var k = 0; k < n; k++) {
          var sz = 0.55 - k * 0.12;
          var r = new T.Mesh(new T.IcosahedronGeometry(sz, 0), k % 2 ? stdMat(0x6b3418, 0.95, 0.05) : matDarkRock);
          r.position.set(p.x + (rand() - 0.5) * 0.5, y + sz * 0.7, p.z + (rand() - 0.5) * 0.5);
          r.scale.set(1, 0.72, 1);
          r.rotation.set(rand(), rand(), rand());
          g.add(r);
          y += sz * 1.15;
        }
      },
      /* 2 · ruins — broken shards and rubble */
      function (g, p, i) {
        var sh = new T.Mesh(new T.OctahedronGeometry(0.3 + rand() * 0.5, 0), new T.MeshStandardMaterial({ color: 0x1a1038, emissive: 0xb07bff, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.5 }));
        sh.position.set(p.x, p.y + 0.5 + rand() * 0.9, p.z);
        sh.rotation.set(rand() * 2, rand() * 3, rand() * 2);
        g.add(sh);
        g.add(edgeOf(sh, 0xb07bff, 0.6));
        var rub = new T.Mesh(new T.BoxGeometry(0.5 + rand() * 0.7, 0.24, 0.5 + rand() * 0.5), matStone);
        rub.position.set(p.x + 0.7, p.y + 0.1, p.z - 0.4);
        rub.rotation.y = rand() * 3;
        g.add(rub);
      },
      /* 3 · grove — glowing mushrooms and ground ferns */
      function (g, p, i) {
        if (i % 2 === 0) {
          var h = 0.5 + rand() * 1.1;
          var stem = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, h, 6), matTrunk);
          stem.position.set(p.x, p.y + h / 2, p.z);
          g.add(stem);
          var cap = new T.Mesh(new T.SphereGeometry(0.24 + rand() * 0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), new T.MeshStandardMaterial({ color: 0x072417, emissive: 0x48ffb0, emissiveIntensity: 1.25, roughness: 0.6, flatShading: true }));
          cap.position.set(p.x, p.y + h, p.z);
          cap.scale.set(1, 0.8, 1);
          g.add(cap);
          var hal = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: 0x48ffb0, transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false }));
          hal.scale.setScalar(2.4); hal.position.set(p.x, p.y + h + 0.1, p.z);
          g.add(hal);
        } else {
          for (var k = 0; k < 3; k++) {
            var f = new T.Mesh(new T.ConeGeometry(0.16 + rand() * 0.16, 0.8 + rand() * 0.7, 5), new T.MeshStandardMaterial({ color: 0x06251a, emissive: 0x1f8f5e, emissiveIntensity: 0.8, roughness: 0.8, flatShading: true }));
            f.position.set(p.x + (rand() - 0.5) * 0.8, p.y + 0.45, p.z + (rand() - 0.5) * 0.8);
            f.rotation.z = (rand() - 0.5) * 0.3;
            g.add(f);
          }
        }
      },
      /* 4 · volcanic — basalt chunks with glowing seams */
      function (g, p, i) {
        var h = 0.4 + rand() * 0.9;
        var chunk = new T.Mesh(new T.CylinderGeometry(0.35, 0.48, h, 6), stdMat(0x1a0d0e, 0.92, 0.12));
        chunk.position.set(p.x, p.y + h / 2, p.z);
        chunk.rotation.y = rand() * 3;
        g.add(chunk);
        var seam = new T.Mesh(new T.PlaneGeometry(0.5 + rand() * 0.8, 0.06), glowMat(0xff5a2a, 0.85));
        seam.rotation.x = -Math.PI / 2;
        seam.rotation.z = rand() * Math.PI;
        seam.position.set(p.x + (rand() - 0.5) * 1.2, p.y + 0.09, p.z + (rand() - 0.5) * 1.2);
        g.add(seam);
        var ember = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: 0xff7030, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false }));
        ember.scale.setScalar(1.6 + rand());
        ember.position.set(p.x, p.y + h + 0.3, p.z);
        g.add(ember);
      },
      /* 5 · mirror — ice shards */
      function (g, p, i) {
        for (var k = 0; k < 2; k++) {
          var h = 0.7 + rand() * 1.8;
          var ice = new T.Mesh(new T.ConeGeometry(0.14 + rand() * 0.2, h, 4), matIce);
          ice.position.set(p.x + (rand() - 0.5) * 1.2, p.y + h / 2, p.z + (rand() - 0.5) * 1.2);
          ice.rotation.set((rand() - 0.5) * 0.4, rand() * 3, (rand() - 0.5) * 0.4);
          g.add(ice);
          g.add(edgeOf(ice, 0xdff2ff, 0.45));
        }
      },
      /* 6 · orbital — small floating debris */
      function (g, p, i) {
        var b = new T.Mesh(new T.BoxGeometry(0.4 + rand() * 0.5, 0.16, 0.3 + rand() * 0.4), matHull);
        b.position.set(p.x, p.y + 1.4 + rand() * 2.2, p.z);
        b.rotation.set(rand(), rand(), rand());
        g.add(b);
        g.add(edgeOf(b, 0x8f9cff, 0.7));
        dynamics.push({ o: b, fn: function (t) { b.rotation.y += 0.006; b.position.y += Math.sin(t * 0.9 + i) * 0.002; } });
        var led = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: 0x8f9cff, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }));
        led.scale.setScalar(0.9); led.position.copy(b.position);
        g.add(led);
      },
      /* 7 · citadel — gold-trimmed bollards */
      function (g, p, i) {
        var h = 1.0 + rand() * 1.4;
        var post = new T.Mesh(new T.CylinderGeometry(0.13, 0.18, h, 8), matGold);
        post.position.set(p.x, p.y + h / 2, p.z);
        g.add(post);
        var band = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.07, 8), glowMat(0xffcf7a, 0.9));
        band.position.set(p.x, p.y + h * 0.85, p.z);
        g.add(band);
        var cap = new T.Mesh(new T.OctahedronGeometry(0.14, 0), glowMat(0xffd98a, 0.85));
        cap.position.set(p.x, p.y + h + 0.12, p.z);
        g.add(cap);
      }
    ];

    function vergeSpots(bi, count, rMin, rMax) {
      var out = [], tries = 0, info = {};
      count = Math.max(4, Math.round(count * DENSITY));
      while (out.length < count && tries < count * 40) {
        tries++;
        var u = zoneToU(bi + (rand() * 2 - 1) * 0.40);
        var p = curve.getPointAt(clamp(u, 0.002, 0.998));
        var tn = curve.getTangentAt(clamp(u, 0.002, 0.998));
        var perp = new T.Vector3(-tn.z, 0, tn.x).normalize();
        var side = rand() > 0.5 ? 1 : -1;
        var r = rMin + rand() * (rMax - rMin);
        var x = p.x + perp.x * side * r + tn.x * (rand() - 0.5) * 8;
        var z = p.z + perp.z * side * r + tn.z * (rand() - 0.5) * 8;
        pathNear(x, z, info);
        if (info.dist < 4.6) continue;
        out.push({ x: x, z: z, y: terrainHeight(x, z) });
      }
      return out;
    }

    for (var bi = 0; bi < N_BIOMES; bi++) {
      var g = new T.Group();
      propGroups.push(g);
      scene.add(g);
      var sp = vergeSpots(bi, 13, 5.2, 15);
      sp.forEach(function (p, i) { builders[bi](g, p, i); });
    }
  })();

  /* ---------- mist veils on the threshold between two worlds ---------- */
  (function veils() {
    for (var i = 1; i < N_BIOMES; i++) {
      var u = (wpU[i - 1] + wpU[i]) * 0.5;
      var pt = curve.getPointAt(u);
      var tn = curve.getTangentAt(u);
      var perp = new T.Vector3(-tn.z, 0, tn.x).normalize();
      var tint = BIOMES[i - 1]._fog.clone().lerp(BIOMES[i]._fog, 0.5).multiplyScalar(1.35);
      for (var k = 0; k < 3; k++) {
        var off = (k - 1) * 17;
        var px = pt.x + perp.x * off, pz = pt.z + perp.z * off;
        var sp = new T.Sprite(new T.SpriteMaterial({
          map: texSoft, color: tint, transparent: true, opacity: 0.26 - Math.abs(k - 1) * 0.05,
          depthWrite: false, fog: false
        }));
        sp.scale.set(96, 26, 1);
        sp.position.set(px, terrainHeight(px, pz) + 7, pz);
        scene.add(sp);
      }
    }
  })();

  /* =========================================================
     ATMOSPHERE — drifting dust, tinted per chapter
     ========================================================= */
  var dust, dustMat;
  (function atmosphere() {
    var n = isMobile ? 800 : 1900;
    var pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var a = rand() * Math.PI * 2, r = 10 + rand() * 190;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = rand() * 52 + 0.4;
      pos[i * 3 + 2] = Math.sin(a) * r + 235;
      var t = rand();
      colr[i * 3] = 0.55 + t * 0.45;
      colr[i * 3 + 1] = 0.75 + t * 0.25;
      colr[i * 3 + 2] = 1.0;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('color', new T.BufferAttribute(colr, 3));
    dustMat = new T.PointsMaterial({
      size: isMobile ? 0.9 : 0.7, map: texGlow, transparent: true, opacity: 0.6,
      depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, sizeAttenuation: true
    });
    dust = new T.Points(g, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);
  })();

  /* =========================================================
     EXPLORER — sleek rig with two-bone IK legs
     ========================================================= */
  var AV = { hipY: 0.95, L1: 0.455, L2: 0.415, footY: 0.085, shoulderY: 1.40 };
  var avatar = new T.Group();
  var rig = {};
  var suitTrim, visorMat, capeGeo, capeBase;

  (function buildAvatar() {
    var ivory = new T.MeshStandardMaterial({ color: 0xf2f7ff, roughness: 0.38, metalness: 0.22, emissive: 0x0d1c2a, emissiveIntensity: 0.45 });
    var graphite = new T.MeshStandardMaterial({ color: 0x1b2c3e, roughness: 0.55, metalness: 0.42 });
    var slate = new T.MeshStandardMaterial({ color: 0x2b4257, roughness: 0.62, metalness: 0.3 });
    suitTrim = new T.MeshBasicMaterial({ color: 0x7ff6ff });
    visorMat = new T.MeshStandardMaterial({ color: 0x02080f, emissive: 0x2fd8f0, emissiveIntensity: 1.5, roughness: 0.03, metalness: 0.9 });

    var body = new T.Group();
    avatar.add(body);
    rig.body = body;

    /* pelvis */
    var pelvis = new T.Mesh(new T.SphereGeometry(0.145, 16, 12), graphite);
    pelvis.position.y = AV.hipY;
    pelvis.scale.set(1.0, 0.7, 0.82);
    body.add(pelvis);

    /* long coat — a flared skirt from waist to mid-thigh, with a lit hem */
    var coat = new T.Mesh(new T.CylinderGeometry(0.152, 0.232, 0.40, 24, 1, true), new T.MeshStandardMaterial({
      color: 0x24455f, roughness: 0.66, metalness: 0.3, side: T.DoubleSide,
      emissive: 0x123445, emissiveIntensity: 0.55
    }));
    coat.position.y = AV.hipY - 0.12;
    body.add(coat);
    var hem = new T.Mesh(new T.TorusGeometry(0.238, 0.008, 6, 34), suitTrim);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = AV.hipY - 0.315;
    hem.scale.set(1, 1, 0.88);
    body.add(hem);
    [0.5, -0.5].forEach(function (a) {
      var seam = new T.Mesh(new T.BoxGeometry(0.012, 0.36, 0.006), suitTrim);
      seam.position.set(Math.sin(a) * 0.19, AV.hipY - 0.12, Math.cos(a) * 0.19);
      seam.rotation.y = a;
      body.add(seam);
    });

    /* torso — tapered lathe: narrow waist, shaped chest */
    var prof = [];
    [[0.128, 0.00], [0.132, 0.05], [0.140, 0.12], [0.152, 0.20],
     [0.168, 0.30], [0.180, 0.38], [0.176, 0.44], [0.150, 0.49], [0.112, 0.52]]
      .forEach(function (p) { prof.push(new T.Vector2(p[0], p[1])); });
    var torso = new T.Mesh(new T.LatheGeometry(prof, 24), ivory);
    torso.position.y = AV.hipY + 0.04;
    torso.scale.set(1.0, 1.02, 0.80);
    body.add(torso);

    /* chest yoke + signal lines */
    var yoke = new T.Mesh(new T.BoxGeometry(0.20, 0.12, 0.05), graphite);
    yoke.position.set(0, 1.315, 0.126);
    body.add(yoke);
    var shoulderBar = new T.Mesh(new T.BoxGeometry(0.35, 0.05, 0.13), graphite);
    shoulderBar.position.set(0, 1.415, -0.01);
    body.add(shoulderBar);
    var line = new T.Mesh(new T.BoxGeometry(0.12, 0.012, 0.006), suitTrim);
    line.position.set(0, 1.352, 0.156);
    body.add(line);
    var dot = new T.Mesh(new T.SphereGeometry(0.013, 8, 8), suitTrim);
    dot.position.set(0, 1.285, 0.156);
    body.add(dot);

    /* collar + back pack */
    var collar = new T.Mesh(new T.TorusGeometry(0.092, 0.024, 8, 20), slate);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = AV.hipY + 0.545;
    collar.scale.set(1.0, 1.0, 0.88);
    body.add(collar);
    var pack = new T.Mesh(new T.BoxGeometry(0.19, 0.24, 0.075), graphite);
    pack.position.set(0, 1.29, -0.150);
    body.add(pack);
    [-0.062, 0.062].forEach(function (x) {
      var tank = new T.Mesh(new T.CylinderGeometry(0.026, 0.026, 0.20, 8), slate);
      tank.position.set(x, 1.28, -0.196);
      body.add(tank);
    });
    [-0.055, 0.055].forEach(function (x) {
      var led = new T.Mesh(new T.BoxGeometry(0.035, 0.008, 0.005), suitTrim);
      led.position.set(x, 1.36, -0.196);
      body.add(led);
    });
    var spine = new T.Mesh(new T.BoxGeometry(0.012, 0.22, 0.005), suitTrim);
    spine.position.set(0, 1.28, -0.196);
    body.add(spine);

    /* head — slim helmet with a visor band */
    var head = new T.Group();
    head.position.y = 1.625;
    body.add(head);
    rig.head = head;
    var helmet = new T.Mesh(new T.SphereGeometry(0.126, 28, 22), ivory);
    helmet.scale.set(0.94, 1.10, 1.0);
    head.add(helmet);
    var visor = new T.Mesh(new T.SphereGeometry(0.130, 28, 18), visorMat);
    visor.scale.set(0.95, 0.60, 1.0);
    visor.position.set(0, -0.004, 0.012);
    head.add(visor);
    var visorRim = new T.Mesh(new T.TorusGeometry(0.112, 0.006, 6, 26, Math.PI * 1.15), suitTrim);
    visorRim.rotation.set(Math.PI / 2, 0, -Math.PI * 0.075);
    visorRim.position.set(0, 0.036, 0.028);
    head.add(visorRim);
    var crest = new T.Mesh(new T.BoxGeometry(0.018, 0.042, 0.17), slate);
    crest.position.set(0, 0.126, -0.018);
    head.add(crest);
    var crestGlow = new T.Mesh(new T.BoxGeometry(0.007, 0.010, 0.13), suitTrim);
    crestGlow.position.set(0, 0.148, -0.018);
    head.add(crestGlow);
    var neck = new T.Mesh(new T.CylinderGeometry(0.048, 0.062, 0.07, 10), graphite);
    neck.position.y = 1.50;
    body.add(neck);

    /* arms */
    function buildArm(side) {
      var sh = new T.Group();
      sh.position.set(side * 0.158, AV.shoulderY, 0);
      var pad = new T.Mesh(new T.SphereGeometry(0.055, 12, 10), slate);
      pad.scale.set(1.05, 0.78, 1.0);
      sh.add(pad);
      var upper = new T.Mesh(new T.CapsuleGeometry(0.040, 0.155, 5, 10), ivory);
      upper.position.y = -0.112;
      sh.add(upper);
      var elbow = new T.Group();
      elbow.position.y = -0.228;
      var fore = new T.Mesh(new T.CapsuleGeometry(0.034, 0.145, 5, 10), ivory);
      fore.position.y = -0.104;
      elbow.add(fore);
      var cuff = new T.Mesh(new T.CylinderGeometry(0.040, 0.036, 0.026, 10), graphite);
      cuff.position.y = -0.192;
      elbow.add(cuff);
      var hand = new T.Mesh(new T.SphereGeometry(0.036, 10, 8), graphite);
      hand.position.y = -0.222;
      hand.scale.set(0.85, 1.15, 0.7);
      elbow.add(hand);
      sh.add(elbow);
      body.add(sh);
      return { shoulder: sh, elbow: elbow, side: side };
    }
    rig.armL = buildArm(-1);
    rig.armR = buildArm(1);

    /* legs */
    function buildLeg(side) {
      var hip = new T.Group();
      hip.position.set(side * 0.078, AV.hipY, 0);
      var thigh = new T.Mesh(new T.CapsuleGeometry(0.058, AV.L1 - 0.10, 5, 10), ivory);
      thigh.position.y = -AV.L1 / 2;
      hip.add(thigh);
      var knee = new T.Group();
      knee.position.y = -AV.L1;
      var shin = new T.Mesh(new T.CapsuleGeometry(0.046, AV.L2 - 0.10, 5, 10), ivory);
      shin.position.y = -AV.L2 / 2;
      knee.add(shin);
      var kneepad = new T.Mesh(new T.SphereGeometry(0.046, 10, 8), slate);
      kneepad.scale.set(1, 0.85, 0.9);
      knee.add(kneepad);
      var foot = new T.Group();
      foot.position.y = -AV.L2;
      var boot = new T.Mesh(new T.BoxGeometry(0.078, 0.054, 0.175), graphite);
      boot.position.set(0, 0.012, 0.042);
      foot.add(boot);
      var sole = new T.Mesh(new T.BoxGeometry(0.079, 0.010, 0.18), suitTrim);
      sole.position.set(0, -0.020, 0.042);
      foot.add(sole);
      knee.add(foot);
      hip.add(knee);
      body.add(hip);
      return { hip: hip, knee: knee, foot: foot, side: side };
    }
    rig.legL = buildLeg(-1);
    rig.legR = buildLeg(1);

    /* two narrow coat tails that trail behind the walk */
    capeGeo = new T.PlaneGeometry(0.16, 0.66, 3, 10);
    var capeMat = new T.MeshStandardMaterial({
      color: 0x24455f, roughness: 0.76, metalness: 0.2, side: T.DoubleSide,
      emissive: 0x14384a, emissiveIntensity: 0.55
    });
    rig.capes = [];
    [-1, 1].forEach(function (sx) {
      var tail = new T.Mesh(capeGeo, capeMat);
      tail.position.set(sx * 0.088, 0.60, -0.155);
      tail.rotation.x = 0.13;
      body.add(tail);
      rig.capes.push(tail);
    });
    capeBase = capeGeo.attributes.position.array.slice(0);

    /* soft contact shadow */
    var shadow = new T.Mesh(
      new T.CircleGeometry(0.60, 26),
      new T.MeshBasicMaterial({ map: texSoft, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.035;
    avatar.add(shadow);
    rig.shadow = shadow;

    /* a small suit light so the explorer has presence in dark biomes */
    var lamp = new T.PointLight(0x8ff8ff, 1.4, 11, 2);
    lamp.position.set(0, 1.42, 0.26);
    body.add(lamp);
    rig.lamp = lamp;
    var rimFill = new T.PointLight(0xbfe6ff, 0.7, 6, 2);
    rimFill.position.set(0, 1.5, -0.9);
    body.add(rimFill);
  })();


  avatar.position.set(0, terrainHeight(0, -20), -20);
  scene.add(avatar);

  /* =========================================================
     ARTIFACTS
     ========================================================= */
  var orbs = [];
  var hitTargets = [];

  function buildOrb(index) {
    var wp = WAYPOINTS[index];
    var gy = terrainHeight(wp.x, wp.z);
    var color = BIOMES[index].accent;
    var group = new T.Group();
    group.position.set(wp.x, gy + 1.55, wp.z);

    var hit = new T.Mesh(
      new T.SphereGeometry(1.65, 12, 10),
      new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.userData.orb = index;
    group.add(hit);
    hitTargets.push(hit);

    var core = new T.Mesh(new T.IcosahedronGeometry(0.36, 1), new T.MeshBasicMaterial({ color: color }));
    group.add(core);
    var inner = new T.Mesh(new T.IcosahedronGeometry(0.16, 0), new T.MeshBasicMaterial({ color: 0xffffff }));
    group.add(inner);

    var ringMat = new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false });
    var ring1 = new T.Mesh(new T.TorusGeometry(0.72, 0.012, 6, 64), ringMat);
    ring1.rotation.x = Math.PI / 2.6;
    group.add(ring1);
    var ring2 = new T.Mesh(new T.TorusGeometry(0.95, 0.008, 6, 72), ringMat.clone());
    ring2.material.opacity = 0.5;
    ring2.rotation.set(Math.PI / 2.1, 0.4, 0);
    group.add(ring2);

    var glow = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: color, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(3.0);
    group.add(glow);

    var beam = new T.Mesh(
      new T.CylinderGeometry(0.035, 0.36, 10, 14, 1, true),
      new T.MeshBasicMaterial({ map: texBeam, color: color, transparent: true, opacity: 0.34, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    );
    beam.position.y = 4.8;
    group.add(beam);

    var groundRing = new T.Mesh(
      new T.RingGeometry(0.55, 0.72, 48),
      new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    );
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.set(0, -1.55 + 0.08, 0);
    group.add(groundRing);

    var pool = new T.Sprite(new T.SpriteMaterial({ map: texSoft, color: color, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false }));
    pool.scale.setScalar(5.2);
    pool.position.set(0, -1.45, 0);
    group.add(pool);

    scene.add(group);
    return {
      index: index, wp: wp, color: color, group: group, core: core, inner: inner,
      ring1: ring1, ring2: ring2, glow: glow, beam: beam, groundRing: groundRing,
      pool: pool, hit: hit, collected: false, phase: rand() * Math.PI * 2, baseY: gy + 1.55
    };
  }
  for (var oi = 0; oi < WAYPOINTS.length; oi++) orbs.push(buildOrb(oi));

  /* ---------------- bursts ---------------- */
  var bursts = [];
  function spawnBurst(orb) {
    var n = isMobile ? 44 : 78;
    var pos = new Float32Array(n * 3), vel = [];
    var origin = orb.group.position.clone();
    for (var i = 0; i < n; i++) {
      pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      var dir = new T.Vector3(rand() * 2 - 1, rand() * 1.6 - 0.2, rand() * 2 - 1).normalize();
      vel.push(dir.multiplyScalar(2.4 + rand() * 6.8));
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var pts = new T.Points(g, new T.PointsMaterial({
      size: 0.5, map: texGlow, color: orb.color, transparent: true,
      opacity: 1, depthWrite: false, blending: T.AdditiveBlending
    }));
    pts.position.copy(origin);
    scene.add(pts);

    var ring = new T.Mesh(new T.RingGeometry(0.5, 0.62, 56), new T.MeshBasicMaterial({
      color: orb.color, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(origin.x, terrainHeight(origin.x, origin.z) + 0.12, origin.z);
    scene.add(ring);

    var dome = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: 0xffffff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    dome.position.copy(origin);
    dome.scale.setScalar(3);
    scene.add(dome);

    bursts.push({ points: pts, vel: vel, life: 1.35, max: 1.35, ring: ring, dome: dome });
    if (window.gsap) {
      gsap.to(ring.scale, { x: 9, y: 9, duration: 1.1, ease: 'power2.out' });
      gsap.to(ring.material, { opacity: 0, duration: 1.1, ease: 'power1.out' });
      gsap.to(dome.scale, { x: 14, y: 14, duration: 0.8, ease: 'power3.out' });
      gsap.to(dome.material, { opacity: 0, duration: 0.75, ease: 'power1.out' });
    }
  }

  function collectOrb(index) {
    var orb = orbs[index];
    if (!orb || orb.collected) return false;
    orb.collected = true;
    spawnBurst(orb);
    if (window.gsap) {
      gsap.to(orb.core.scale, { x: 2.6, y: 2.6, z: 2.6, duration: 0.32, ease: 'power2.out' });
      orb.core.material.transparent = true;
      gsap.to(orb.core.material, { opacity: 0, duration: 0.32 });
      gsap.to(orb.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.85, delay: 0.12, ease: 'power3.inOut', onComplete: function () { orb.group.visible = false; } });
      gsap.to(orb.beam.material, { opacity: 0, duration: 0.6 });
      gsap.to(orb.pool.material, { opacity: 0, duration: 0.9 });
      gsap.to(orb.glow.material, { opacity: 0, duration: 0.5 });
    } else {
      orb.group.visible = false;
    }
    return true;
  }

  function resetOrbs() {
    orbs.forEach(function (o) {
      o.collected = false;
      o.group.visible = true;
      o.group.scale.set(1, 1, 1);
      o.core.scale.set(1, 1, 1);
      o.core.material.opacity = 1;
      o.glow.material.opacity = 0.85;
      o.beam.material.opacity = 0.34;
      o.pool.material.opacity = 0.22;
    });
  }

  /* =========================================================
     INTERACTION
     ========================================================= */
  var raycaster = new T.Raycaster();
  var pointer = new T.Vector2();
  var groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);

  function toPointer(cx, cy) {
    var r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((cx - r.left) / r.width) * 2 - 1;
    pointer.y = -((cy - r.top) / r.height) * 2 + 1;
  }
  function pickOrb(cx, cy) {
    toPointer(cx, cy);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(hitTargets, false);
    for (var i = 0; i < hits.length; i++) {
      var idx = hits[i].object.userData.orb;
      if (orbs[idx] && !orbs[idx].collected) return idx;
    }
    return -1;
  }
  function pickGround(cx, cy) {
    toPointer(cx, cy);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObject(ground, false);
    if (hits.length) return hits[0].point.clone();
    var p = new T.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, p)) {
      p.y = terrainHeight(p.x, p.z);
      return p;
    }
    return null;
  }

  var state = { hovered: -1, speed: 0, speedSmooth: 0, yawRate: 0 };
  function setHover(index) {
    if (state.hovered === index) return;
    state.hovered = index;
    orbs.forEach(function (o, i) {
      if (o.collected) return;
      var target = i === index ? 1.22 : 1;
      if (window.gsap) gsap.to(o.group.scale, { x: target, y: target, z: target, duration: 0.35, ease: 'power2.out' });
      else o.group.scale.setScalar(target);
    });
  }

  /* =========================================================
     BIOME TRANSITION
     ========================================================= */
  var zoneState = {
    zone: 0, accent: new T.Color(BIOMES[0].accent),
    sky: {
      top: col(BIOMES[0].sky.top), mid: col(BIOMES[0].sky.mid), hor: col(BIOMES[0].sky.hor),
      glow: col(BIOMES[0].sky.glow), band: BIOMES[0].sky.band,
      stars: BIOMES[0].sky.stars, sunCol: col(BIOMES[0].sky.sunCol)
    },
    fog: col(BIOMES[0].fog.color), fogD: BIOMES[0].fog.density,
    hemiSky: col(BIOMES[0].hemi[0]), hemiGround: col(BIOMES[0].hemi[1]), hemiI: BIOMES[0].hemi[2],
    key: col(BIOMES[0].key[0]), keyI: BIOMES[0].key[1],
    keyPos: new T.Vector3(BIOMES[0].key[2], BIOMES[0].key[3], BIOMES[0].key[4]),
    rim: col(BIOMES[0].rim[0]), rimI: BIOMES[0].rim[1],
    dust: col(BIOMES[0].dust.color), dustSize: BIOMES[0].dust.size,
    sunPos: new T.Vector3().copy(new T.Vector3(BIOMES[0].sky.sun[0], BIOMES[0].sky.sun[1], BIOMES[0].sky.sun[2])).normalize().multiplyScalar(640),
    sunSize: BIOMES[0].sky.sunSize, sunOp: BIOMES[0].sky.sunOp,
    ringOp: 0
  };

  var _sun = new T.Vector3();
  var currentZone = 0;

  function applyZone(zoneFloat, dt, immediate) {
    var z = clamp(zoneFloat, 0, N_BIOMES - 1);
    var i0 = Math.min(N_BIOMES - 2, Math.floor(z));
    var f = sstep(z - i0, 0.60, 0.84);
    if (z >= N_BIOMES - 1) { i0 = N_BIOMES - 2; f = 1; }
    var A = BIOMES[i0], B = BIOMES[i0 + 1];
    var k = immediate ? 1 : (1 - Math.exp(-1.9 * Math.max(dt, 0.001)));

    zoneState.zone = z;
    zoneState.accent.lerpColors(A._accent, B._accent, f);
    zoneState.sky.top.lerpColors(A._sky.top, B._sky.top, f);
    zoneState.sky.mid.lerpColors(A._sky.mid, B._sky.mid, f);
    zoneState.sky.hor.lerpColors(A._sky.hor, B._sky.hor, f);
    zoneState.sky.glow.lerpColors(A._sky.glow, B._sky.glow, f);
    zoneState.sky.band = lerp(A.sky.band, B.sky.band, f);
    zoneState.sky.stars = lerp(A.sky.stars, B.sky.stars, f);
    zoneState.sky.sunCol.lerpColors(A._sky.sunCol, B._sky.sunCol, f);
    zoneState.fog.lerpColors(A._fog, B._fog, f);
    zoneState.fogD = lerp(A.fog.density, B.fog.density, f);
    zoneState.hemiSky.lerpColors(A._hemi[0], B._hemi[0], f);
    zoneState.hemiGround.lerpColors(A._hemi[1], B._hemi[1], f);
    zoneState.hemiI = lerp(A.hemi[2], B.hemi[2], f);
    zoneState.key.lerpColors(A._key, B._key, f);
    zoneState.keyI = lerp(A.key[1], B.key[1], f);
    _sun.set(lerp(A.key[2], B.key[2], f), lerp(A.key[3], B.key[3], f), lerp(A.key[4], B.key[4], f));
    zoneState.rim.lerpColors(A._rim, B._rim, f);
    zoneState.rimI = lerp(A.rim[1], B.rim[1], f);
    zoneState.dust.lerpColors(A._dust, B._dust, f);
    zoneState.dustSize = lerp(A.dust.size, B.dust.size, f);
    _sun.set(lerp(A.sky.sun[0], B.sky.sun[0], f), lerp(A.sky.sun[1], B.sky.sun[1], f), lerp(A.sky.sun[2], B.sky.sun[2], f)).normalize().multiplyScalar(640);
    zoneState.sunPos.lerp(_sun, immediate ? 1 : Math.min(1, k * 1.5));
    zoneState.sunSize = lerp(A.sky.sunSize, B.sky.sunSize, f);
    zoneState.sunOp = lerp(A.sky.sunOp, B.sky.sunOp, f);
    var ringTarget = (A.key === 'orbital' || B.key === 'orbital') ? (A.key === 'orbital' && B.key === 'orbital' ? 1 : f) : 0;
    zoneState.ringOp = lerp(zoneState.ringOp, ringTarget, immediate ? 1 : Math.min(1, k * 0.8));

    currentZone = z;
  }

  function syncUniforms() {
    skyU.uTop.value.copy(zoneState.sky.top);
    skyU.uMid.value.copy(zoneState.sky.mid);
    skyU.uHor.value.copy(zoneState.sky.hor);
    skyU.uGlow.value.copy(zoneState.sky.glow);
    skyU.uBand.value = zoneState.sky.band;
    groundU.uFogColor.value.copy(zoneState.fog);
    groundU.uFogDensity.value = zoneState.fogD;
    scene.fog.color.copy(zoneState.fog);
    scene.fog.density = zoneState.fogD;
    hemi.color.copy(zoneState.hemiSky);
    hemi.groundColor.copy(zoneState.hemiGround);
    hemi.intensity = zoneState.hemiI;
    keyLight.color.copy(zoneState.key);
    keyLight.intensity = zoneState.keyI;
    keyLight.position.lerp(zoneState.keyPos, 0.08);
    rimLight.color.copy(zoneState.rim);
    rimLight.intensity = zoneState.rimI;
    dustMat.color.copy(zoneState.dust);
    starsMat.opacity = zoneState.sky.stars;
    sunSprite.material.color.copy(zoneState.sky.sunCol);
    sunSprite.material.opacity = zoneState.sunOp;
    sunSprite.position.copy(zoneState.sunPos);
    sunSprite.scale.setScalar(zoneState.sunSize);
    if (suitTrim) suitTrim.color.copy(zoneState.accent);
    if (visorMat) { visorMat.emissive.copy(zoneState.accent).multiplyScalar(0.55); }
    if (rig.lamp) rig.lamp.color.copy(zoneState.accent);
    if (rig.shadow) rig.shadow.material.opacity = 0.38 + 0.22 * (1 - zoneState.fogD * 100);
  }

  /* =========================================================
     AVATAR ANIMATION (gait + IK + cloth)
     ========================================================= */
  var gait = { phase: 0, A: 0.30, bodyY: 0, bob: 0, lean: 0, yaw: 0, sway: 0 };
  var reach = AV.L1 + AV.L2 - 0.004;

  function footTarget(ph, A, lift) {
    var t = ph - Math.floor(ph);
    var stance = 0.62;
    if (t < stance) {
      var k = t / stance;
      return { z: A * (1 - 2 * k), y: 0, contact: 1 };
    }
    var k2 = (t - stance) / (1 - stance);
    var e = k2 * k2 * (3 - 2 * k2);
    return { z: A * (-1 + 2 * e), y: Math.sin(Math.PI * k2) * lift, contact: 0 };
  }

  function ik(leg, hipY, fz, fy, toe) {
    var dy = fy - hipY, dz = fz;
    var D = Math.sqrt(dy * dy + dz * dz);
    if (D > reach) {
      var s = reach / Math.max(D, 1e-5);
      dy *= s; dz *= s; D = reach;
    }
    D = Math.max(D, 0.06);
    var a = Math.atan2(dz, -dy);
    var cosA = (D * D + AV.L1 * AV.L1 - AV.L2 * AV.L2) / (2 * D * AV.L1);
    var A = Math.acos(clamp(cosA, -1, 1));
    var cosB = (AV.L1 * AV.L1 + AV.L2 * AV.L2 - D * D) / (2 * AV.L1 * AV.L2);
    var B = Math.acos(clamp(cosB, -1, 1));
    leg.hip.rotation.x = -(a + A);
    leg.knee.rotation.x = Math.PI - B;
    leg.foot.rotation.x = (a + A) - (Math.PI - B) + toe;
  }

  function updateAvatar(dt, t) {
    var sp = state.speedSmooth;
    var moving = sp > 0.12;

    /* stride length follows speed, phase follows distance */
    var targetA = clamp(0.20 + sp * 0.030, 0.20, 0.46);
    gait.A += (targetA - gait.A) * Math.min(1, dt * 3.5);
    var dist = sp * dt;
    gait.phase += dist / (4 * gait.A);

    var phL = gait.phase;
    var phR = gait.phase + 0.5;
    var lift = clamp(0.09 + sp * 0.012, 0.09, 0.16);
    var fL = footTarget(phL, gait.A, lift);
    var fR = footTarget(phR, gait.A, lift);

    /* settle into a relaxed stance when the walk stops */
    var idleMix = 1 - clamp(sp / 0.75, 0, 1);
    if (idleMix > 0.01) {
      fL.z *= (1 - idleMix * 0.92); fR.z *= (1 - idleMix * 0.92);
      fL.y *= (1 - idleMix); fR.y *= (1 - idleMix);
    }

    /* hip height satisfies the furthest planted foot */
    var hipL = Math.sqrt(Math.max(0.02, reach * reach - fL.z * fL.z)) + AV.footY + fL.y;
    var hipR = Math.sqrt(Math.max(0.02, reach * reach - fR.z * fR.z)) + AV.footY + fR.y;
    var hip = Math.min(hipL, hipR) - 0.008;
    var idle = 1 - clamp(sp, 0, 1);
    gait.bob += (hip - AV.hipY - gait.bob) * Math.min(1, dt * 14);

    var bobY = gait.bob + Math.sin(t * 1.5) * 0.006 * idle;
    rig.body.position.y = bobY;

    /* subtle counter-rotation & sway */
    var swing = Math.sin(gait.phase * Math.PI * 2);
    var swayTarget = swing * 0.016 * clamp(sp * 0.28, 0, 1);
    gait.sway += (swayTarget - gait.sway) * Math.min(1, dt * 10);
    rig.body.position.x = gait.sway * 0.5;
    rig.body.rotation.y = -swing * 0.055 * clamp(sp * 0.22, 0, 1);
    rig.body.rotation.x = -clamp(sp * 0.012, 0, 0.10);

    /* lean into turns */
    var leanTarget = clamp(-state.yawRate * 0.05, -0.26, 0.26);
    gait.lean += (leanTarget - gait.lean) * Math.min(1, dt * 5);
    rig.body.rotation.z = gait.lean * 0.5;
    rig.body.position.z = 0;

    /* legs */
    ik(rig.legL, AV.hipY + bobY, fL.z, AV.footY + fL.y, -(1 - fL.contact) * 0.28 + (fL.contact ? clamp(-fL.z * 0.14, -0.06, 0.06) : 0));
    ik(rig.legR, AV.hipY + bobY, fR.z, AV.footY + fR.y, -(1 - fR.contact) * 0.28 + (fR.contact ? clamp(-fR.z * 0.14, -0.06, 0.06) : 0));

    /* arms swing opposite the legs */
    var armSwing = clamp(sp * 0.20, 0, 1);
    rig.armL.shoulder.rotation.x = -swing * 0.55 * armSwing + 0.04;
    rig.armR.shoulder.rotation.x = swing * 0.55 * armSwing + 0.04;
    rig.armL.shoulder.rotation.z = 0.10 + 0.03 * Math.sin(t * 0.9);
    rig.armR.shoulder.rotation.z = -0.10 - 0.03 * Math.sin(t * 0.9);
    rig.armL.elbow.rotation.x = -(0.24 + 0.30 * Math.max(0, -swing) * armSwing);
    rig.armR.elbow.rotation.x = -(0.24 + 0.30 * Math.max(0, swing) * armSwing);

    /* head stabilises against the body bob */
    rig.head.rotation.x = -bobY * 1.1 + Math.sin(t * 0.8) * 0.012 * idle;
    rig.head.rotation.y = Math.sin(t * 0.45) * 0.10 * idle - rig.body.rotation.y * 0.6;
    rig.head.rotation.z = -gait.lean * 0.2;

    /* coat tails: flare with speed, ripple with the gait, drag behind */
    var cp = capeGeo.attributes.position;
    var amp = 0.05 + Math.min(sp, 12) * 0.012;
    for (var i = 0; i < cp.count; i++) {
      var bx = capeBase[i * 3], by = capeBase[i * 3 + 1];
      var v = (1 - (by + 0.33) / 0.66);            /* 0 at top, 1 at hem */
      var wave = Math.sin(by * 8.0 + t * (3.4 + sp * 0.22) + bx * 4.0) * amp * v;
      cp.setZ(i, 0.10 * v + wave);
      cp.setX(i, bx * (1 + v * 0.10));
      cp.setY(i, by);
    }
    cp.needsUpdate = true;
    if (rig.capes) {
      rig.capes.forEach(function (tail, ti) {
        var side = ti === 0 ? -1 : 1;
        tail.rotation.x = 0.12 + clamp(sp * 0.014, 0, 0.42);
        tail.rotation.z = side * (0.10 + clamp(sp * 0.004, 0, 0.10)) - gait.lean * 0.3;
      });
    }

    /* shadow follows ground even over bumps */
    var groundY = terrainHeight(avatar.position.x, avatar.position.z);
    rig.shadow.position.y = 0.035 + (groundY - avatar.position.y);
  }

  /* =========================================================
     PER FRAME
     ========================================================= */
  var clock = new T.Clock();
  var elapsed = 0;
  var zoneNow = 0;

  function update(dt) {
    dt = Math.min(dt, 0.06);
    elapsed += dt;
    var t = elapsed;

    skyU.uTime.value = t;
    groundU.uTime.value = t;
    groundU.uCam.value.copy(camera.position);

    /* biome from the explorer's place on the route */
    pathNear(avatar.position.x, avatar.position.z, _pn);
    zoneNow = uToZone(_pn.u);
    applyZone(zoneNow, dt, false);
    syncUniforms();

    /* smooth speed for the gait */
    state.speedSmooth += (Math.min(state.speed, 15) - state.speedSmooth) * Math.min(1, dt * 6);
    if (state.speedSmooth < 0.02) state.speedSmooth = 0;

    var ay = terrainHeight(avatar.position.x, avatar.position.z);
    avatar.position.y += (ay - avatar.position.y) * Math.min(1, dt * 11);

    updateAvatar(dt, t);

    /* artifacts */
    orbs.forEach(function (o, i) {
      if (o.collected) return;
      var bob = Math.sin(t * 1.25 + o.phase) * 0.20;
      o.group.position.y = o.baseY + bob;
      o.core.rotation.y = t * 0.6 + i;
      o.core.rotation.x = t * 0.35;
      o.inner.rotation.y = -t * 0.9;
      o.ring1.rotation.z = t * 0.8;
      o.ring2.rotation.y = -t * 0.55;
      o.ring2.rotation.x = Math.PI / 2.1 + Math.sin(t * 0.6 + i) * 0.2;
      o.groundRing.rotation.z = t * 0.35;
      var pulse = 1 + Math.sin(t * 1.6 + o.phase) * 0.06;
      o.glow.scale.setScalar(3.0 * pulse);
      o.pool.material.opacity = 0.16 + Math.sin(t * 1.2 + o.phase) * 0.06;
      o.ring1.scale.setScalar(i === state.hovered ? 1.08 : 1);
    });

    /* dust drifts upward and recycles */
    if (dust) {
      dust.rotation.y = t * 0.004;
      var arr = dust.geometry.attributes.position.array;
      for (var i = 0; i < arr.length; i += 3) {
        arr[i + 1] += dt * (0.18 + (i % 7) * 0.035);
        if (arr[i + 1] > 54) arr[i + 1] = 0.4;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }

    /* bursts */
    for (var b = bursts.length - 1; b >= 0; b--) {
      var bu = bursts[b];
      bu.life -= dt;
      var p = bu.points.geometry.attributes.position.array;
      for (var k2 = 0; k2 < bu.vel.length; k2++) {
        bu.vel[k2].y -= dt * 2.2;
        p[k2 * 3] += bu.vel[k2].x * dt;
        p[k2 * 3 + 1] += bu.vel[k2].y * dt;
        p[k2 * 3 + 2] += bu.vel[k2].z * dt;
        bu.vel[k2].multiplyScalar(1 - dt * 0.9);
      }
      bu.points.geometry.attributes.position.needsUpdate = true;
      bu.points.material.opacity = Math.max(0, bu.life / bu.max);
      if (bu.life <= 0) {
        scene.remove(bu.points);
        scene.remove(bu.ring);
        scene.remove(bu.dome);
        bu.points.geometry.dispose();
        bu.points.material.dispose();
        bu.ring.geometry.dispose();
        bu.ring.material.dispose();
        bu.dome.material.dispose();
        bursts.splice(b, 1);
      }
    }

    /* props that move */
    for (var d = 0; d < dynamics.length; d++) dynamics[d].fn(t);

    planetGroup.rotation.y += dt * 0.003;
  }

  function render() { renderer.render(scene, camera); }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.85));
    renderer.setSize(w, h, false);
  }

  applyZone(0, 0, true);
  syncUniforms();

  return {
    THREE: T, scene: scene, camera: camera, renderer: renderer, avatar: avatar, rig: rig,
    orbs: orbs, waypoints: WAYPOINTS, curve: curve, clock: clock,
    biomes: BIOMES, wpU: wpU, pathLength: PATH_LEN,
    heightAt: terrainHeight, pathNear: pathNear, uToZone: uToZone, zoneToU: zoneToU,
    update: update, render: render, resize: resize,
    pickOrb: pickOrb, pickGround: pickGround, collectOrb: collectOrb, resetOrbs: resetOrbs,
    setHover: setHover,
    setMoveSpeed: function (s) { state.speed = s; },
    setYawRate: function (r) { state.yawRate = r; },
    getZone: function () { return zoneNow; },
    getBiome: function () { return BIOMES[Math.round(clamp(zoneNow, 0, N_BIOMES - 1))]; },
    getAccent: function () { return zoneState.accent.getHexString(); },
    setAvatarXZ: function (x, z, snap) {
      avatar.position.x = x; avatar.position.z = z;
      if (snap) avatar.position.y = terrainHeight(x, z);
    },
    debugGait: function (phase, speed) {
      gait.phase = phase;
      state.speed = speed || 0;
      state.speedSmooth = speed || 0;
    },
    gate: { x: -50, z: 602 }
  };
};
