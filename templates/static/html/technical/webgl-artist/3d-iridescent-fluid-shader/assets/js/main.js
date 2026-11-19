/* ============================================================
   IRIDESCENT CORE® — study rebuild
   real-time WebGL blob · GSAP ScrollTrigger choreography
   ============================================================ */
(function () {
  'use strict';
  window.IRIDESCENT_CORE_BUILD = 'v8';

  gsap.registerPlugin(ScrollTrigger);

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------------------------------------------- projects */
  var U = function (id, w) {
    return `./assets/photos/img_` + id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase() + `.webp`;
  };

  var PROJECTS = [
    {
      id: 'aether', name: 'AETHER', client: 'Aether Motors', year: '2026',
      tags: 'concept · web · 3d · shaders', roles: 'Direction, 3D, Dev',
      img1: U('1786882384562-a6ca8941fb21', 2000), img2: U('1759179075749-7fa29f2a1c7b', 1600),
      lede: 'A launch site that behaves like liquid chrome — every scroll a fresh coat of paint.',
      text: 'Aether asked for a reveal worthy of their first electric hyper-GT. We answered with a real-time metal fluid: a raymarched surface that re-pours itself as you move through the spec sheet. Nothing is pre-rendered — the car never appears as a still, only as light remembering where it has been. Shipped with a bespoke GLSL pipeline, a 14k-vertex sculpted core and a scroll choreography tuned frame by frame.',
      award: 'AWWWARDS SOTD × FWA'
    },
    {
      id: 'atlas', name: 'ATLAS MOTION', client: 'Atlas Labs', year: '2025',
      tags: 'web · development · 3d', roles: 'Dev, Motion',
      img1: U('1762281749806-213ae55fef28', 2000), img2: U('1787590570140-1c6231836e48', 1600),
      lede: 'Twelve products, one camera, zero cuts — a configurator that streams like a reel.',
      text: 'Atlas Labs needed their hardware line to feel like one continuous object. We built a scroll-bound dolly that travels through a single abstract space, materialising each product out of the same molten subsystem. The result reads less like a catalogue and more like one thought remembering itself in twelve shapes.',
      award: 'CSSDA WOTD'
    },
    {
      id: 'devin', name: 'DEVIN AI', client: 'Devin', year: '2025',
      tags: 'web · design · development · 3d', roles: 'Design, Dev',
      img1: U('1773937464832-f43fde4fa71e', 2000), img2: U('1659776026024-ab5d7c6b4433', 1600),
      lede: 'An AI agent rendered as weather — a site that thinks in gradients and answers in light.',
      text: 'How do you give a face to something that is pure latency? We gave Devin a climate. A custom noise field breathes behind the interface, thickening when the model is busy and clearing when it delivers. The typographic system runs on a strict 12-column grotesque grid that keeps the storm legible.',
      award: 'AWWWARDS SOTD'
    },
    {
      id: 'oak', name: 'OF THE OAK', client: 'Of The Oak', year: '2025',
      tags: 'web · design · development · 3d', roles: '3D, Dev',
      img1: U('1764258906061-90d80be359a2', 2000), img2: U('1786870376519-7987d1c29755', 1600),
      lede: 'A forest you walk through one pixel of bark at a time.',
      text: 'A conservation studio asked us to make a single oak tree matter as much as a skyline. We scanned 40,000 points of real bark, rebuilt it as a displaced mesh, and let visitors erode it with their cursor — every visit leaves the surface a little different, the way weather does. Proceeds counter fed directly from the same geometry.',
      award: 'FWA OF THE DAY'
    },
    {
      id: 'everswap', name: 'EVERSWAP', client: 'Everswap', year: '2024',
      tags: 'concept · web · 3d · animation', roles: 'Direction, Dev',
      img1: U('1624978960894-bed9218acd39', 2000), img2: U('1739056238818-d00d80f0f842', 1600),
      lede: 'Value exchange as a perpetual material — one liquid asset split into two hands.',
      text: 'Everswap settles value in one second and needed a site that could feel that speed. We built a two-lobed fluid body: one side iridescent, one side ink, permanently negotiating the midpoint. The trade interface sits directly on the shader, so every transaction visibly stirs the surface.',
      award: 'AWWWARDS HM ×3'
    },
    {
      id: 'porzsche', name: 'DRIVE/01', client: 'Porzsche Dream Machine', year: '2024',
      tags: 'concept · 3d · mograph · video', roles: '3D, Motion, Dev',
      img1: U('1756759095180-e6c55a012fb7', 2000), img2: U('1756759327778-b45f0266e68c', 1600),
      lede: 'A dream machine catalogue where every product is a weather system.',
      text: 'Six vehicles, six atmospheres, one shared particle atlas. Each chapter dissolves the previous car into the next one\u2019s climate — chrome into rain, rain into headlight fog. Built on a single instanced geometry pool that never clears between scenes, so the whole film costs one draw call\u2019s worth of memory.',
      award: 'CANNES LIONS SHORTLIST'
    }
  ];

  var ALT = {
    'aether1': 'Flowing liquid chrome waves over a black background',
    'aether2': 'Abstract swirling metallic surface with soft reflections',
    'atlas1': 'Swirling liquid metal patterns on black',
    'atlas2': 'A splash of liquid silver with a reflective surface',
    'devin1': 'Dark metallic waves with blue and purple hues',
    'devin2': 'Iridescent swirls with rainbow reflections',
    'oak1': 'Abstract metallic fluid shapes on a black background',
    'oak2': 'Abstract liquid metal surface with flowing ripples',
    'everswap1': 'Iridescent holographic gradient texture',
    'everswap2': 'A silver sculptural object on a black background',
    'drive1': 'Abstract metallic swirls with highlights',
    'drive2': 'Abstract metallic swirls in silver tones'
  };

  /* ---------------------------------------------------- dom: work cards */
  var worksEl = document.getElementById('works');
  PROJECTS.forEach(function (p, i) {
    var li = document.createElement('li');
    li.className = 'work';
    li.setAttribute('data-id', p.id);
    li.innerHTML =
      '<button class="work__head" type="button" data-cursor="VIEW" data-open="' + p.id + '" aria-haspopup="dialog">' +
        '<span class="work__idx mono">' + pad2(i + 1) + '</span>' +
        '<span class="work__t">' + p.name + '</span>' +
        '<span class="work__client mono">' + p.client + '</span>' +
        '<span class="work__tags mono">' + p.tags + '</span>' +
        '<span class="work__y mono">' + p.year + '</span>' +
        '<span class="work__arrow" aria-hidden="true">↗</span>' +
      '</button>' +
      '<div class="work__media" data-open="' + p.id + '" data-cursor="VIEW">' +
        '<img src="' + p.img1 + '" alt="' + p.name + ' — ' + p.client + '" loading="eager" decoding="async" />' +
        '<span class="work__cta mono">OPEN CASE STUDY</span>' +
      '</div>' +
      '<p class="work__desc">' + p.lede + '</p>';
    worksEl.appendChild(li);
  });

  /* ---------------------------------------------------- split text */
  function splitLines(el) {
    var text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    var frag = document.createDocumentFragment();
    text.split(' ').forEach(function (w, i, arr) {
      var ri = document.createElement('span');
      ri.className = 'ri';
      var s = document.createElement('span');
      s.textContent = w;
      ri.appendChild(s);
      frag.appendChild(ri);
      if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
  }
  document.querySelectorAll('#heroTitle [data-split]').forEach(splitLines);
  splitLines(document.querySelector('.work__h'));

  // kinetic words
  var kinetic = document.getElementById('kinetic');
  (function () {
    var words = kinetic.textContent.trim().split(/\s+/);
    kinetic.textContent = '';
    words.forEach(function (w) {
      var s = document.createElement('span');
      s.className = 'kw';
      s.textContent = w;
      kinetic.appendChild(s);
      kinetic.appendChild(document.createTextNode(' '));
    });
  })();
  var kws = kinetic.querySelectorAll('.kw');

  /* ---------------------------------------------------- loader */
  var loadNum = document.getElementById('loadNum');
  var loadBar = document.getElementById('loadBar');
  var loadStatus = document.getElementById('loadStatus');
  var loader = document.getElementById('loader');

  var preloadSrcs = PROJECTS.map(function (p) { return p.img1; })
    .concat(PROJECTS.map(function (p) { return p.img2; }));
  var loadedCount = 0;
  var progress = { v: 0 };
  var target = 0;
  var statMsgs = ['GEOMETRY', 'SHADERS', 'TEXTURES', 'LIGHTING', 'READY'];

  function bumpStatus() {
    var idx = Math.min(statMsgs.length - 1, Math.floor(target / 100 * statMsgs.length));
    loadStatus.textContent = statMsgs[idx];
  }

  preloadSrcs.forEach(function (src) {
    var im = new Image();
    im.onload = im.onerror = function () {
      loadedCount++;
      target = Math.round(loadedCount / preloadSrcs.length * 100);
      bumpStatus();
    };
    im.src = src;
  });

  var loadTl = gsap.timeline();
  loadTl.to(progress, {
    v: 100, duration: REDUCED ? 0.3 : 2.6, ease: 'power2.inOut',
    onUpdate: function () {
      var v = Math.floor(Math.min(progress.v, Math.max(target * 0.999 + 8, progress.v * 0.985)));
      v = clamp(v, 0, 100);
      loadNum.textContent = pad2(v);
      loadBar.style.width = v + '%';
    }
  });

  function finishLoad() {
    loadNum.textContent = '100';
    loadBar.style.width = '100%';
    gsap.timeline()
      .to('.loader__mark i', { scaleY: 0, transformOrigin: 'top left', duration: 0.5, ease: 'power3.inOut', stagger: 0.06 })
      .to('.loader__row, .loader__bar', { opacity: 0, y: -20, duration: 0.45, ease: 'power2.in' }, '<')
      .add(function () {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        heroIn();
        gsap.delayedCall(0.8, function () { loader.classList.add('is-gone'); });
      });
  }
  loadTl.add(finishLoad, '+=0.25');

  /* ---------------------------------------------------- cursor */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
  var px = cx, py = cy;
  var isCoarse = window.matchMedia('(pointer: coarse)').matches;

  if (!isCoarse) {
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-on');
      document.body.classList.add('is-cursor');
      var t = e.target;
      var label = t.closest && (t.closest('[data-cursor]') ? t.closest('[data-cursor]').getAttribute('data-cursor') : null);
      if (label) {
        cursorLabel.textContent = label;
        cursor.classList.add('has-label');
      } else {
        cursor.classList.remove('has-label');
      }
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
  }

  gsap.ticker.add(function () {
    cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22);
    px = lerp(px, tx, 0.12); py = lerp(py, ty, 0.12);
    if (cursor) {
      cursor.children[0].style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      cursor.children[1].style.transform = 'translate(' + px + 'px,' + py + 'px) translate(-50%,-50%)';
    }
  });
  // dot uses its own pivot; pill centers itself
  cursor.children[0].style.marginLeft = '0';
  cursor.children[0].style.transform = 'translate(' + cx + 'px,' + cy + 'px)';

  /* ---------------------------------------------------- WebGL scene */
  var G = { ok: false };
  (function initGL() {
    var canvas = document.getElementById('gl');
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return; }
    G.ok = true;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 6.2);

    var uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.34 },
      uFreq: { value: 1.55 },
      uSwirl: { value: 0.35 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uScroll: { value: 0 },
      uHueA: { value: new THREE.Color('#8fa2ff') },
      uHueB: { value: new THREE.Color('#ff9a5c') },
      uDark: { value: 0.42 }
    };

    var geo = new THREE.SphereGeometry(1.06, 180, 180);
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: [
        'uniform float uTime, uAmp, uFreq, uSwirl, uMouseStrength;',
        'uniform vec2 uMouse;',
        'varying vec3 vPos;',
        'varying vec3 vNrm;',
        'varying float vDisp;',
        '',
        'vec3 hash3(vec3 p){',
        '  p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6)));',
        '  return -1.0 + 2.0*fract(sin(p)*43758.5453123);',
        '}',
        'float noise(vec3 p){',
        '  vec3 i = floor(p); vec3 f = fract(p);',
        '  vec3 u = f*f*(3.0-2.0*f);',
        '  return mix(mix(mix(dot(hash3(i+vec3(0,0,0)),f-vec3(0,0,0)), dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),',
        '                 mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),',
        '             mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),',
        '                 mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);',
        '}',
        'float fbm(vec3 p){',
        '  float v = 0.0; float a = 0.5;',
        '  for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.02 + vec3(1.7); a *= 0.5; }',
        '  return v;',
        '}',
        '',
        'float sculpt(vec3 n, float t){',
        '  float d = fbm(n * uFreq + vec3(t, t*0.8, -t*0.6));',
        '  d += uSwirl * 0.30 * sin(9.0*n.y + uTime*0.6 + d*3.2);',
        '  vec3 mDir = normalize(vec3(uMouse.x * 1.35, uMouse.y * 1.0, 0.75));',
        '  d += pow(max(dot(n, mDir), 0.0), 9.0) * uMouseStrength * 0.5;',
        '  return d;',
        '}',
        '',
        'void main(){',
        '  vec3 n = normalize(position);',
        '  float t = uTime * 0.22;',
        '  float d = sculpt(n, t);',
        '  vec3 newPos = position + n * d * uAmp;',
        '',
        '  // analytic smooth normal from tangent offsets',
        '  vec3 t1 = normalize(cross(n, vec3(0.0, 1.0, 0.0) + vec3(0.001, 0.0, 0.0)));',
        '  vec3 t2 = normalize(cross(n, t1));',
        '  float eps = 0.018;',
        '  vec3 na = normalize(n + t1 * eps);',
        '  vec3 nb = normalize(n + t2 * eps);',
        '  vec3 pa = position + na * sculpt(na, t) * uAmp;',
        '  vec3 pb = position + nb * sculpt(nb, t) * uAmp;',
        '  vec3 nrm = normalize(cross(pa - newPos, pb - newPos));',
        '  if (dot(nrm, n) < 0.0) nrm = -nrm;',
        '',
        '  vDisp = d;',
        '  vPos = (modelMatrix * vec4(newPos, 1.0)).xyz;',
        '  vNrm = normalize(mat3(modelMatrix) * nrm);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform float uTime, uDark, uScroll;',
        'uniform vec3 uHueA, uHueB;',
        'varying vec3 vPos;',
        'varying vec3 vNrm;',
        'varying float vDisp;',
        '',
        'void main(){',
        '  vec3 nrm = normalize(vNrm);',
        '  vec3 vDir = normalize(cameraPosition - vPos);',
        '  float facing = clamp(dot(nrm, vDir), 0.0, 1.0);',
        '  float fres = pow(1.0 - facing, 2.6);',
        '',
        '  // liquid-chrome body: dark core, bright grazing angles',
        '  vec3 body = mix(vec3(0.045, 0.05, 0.062), vec3(0.62, 0.65, 0.70), pow(facing, 1.6));',
        '',
        '  // thin-film iridescence, strongest where the surface curves away',
        '  float k = nrm.x*0.55 + nrm.y*0.4 + vDisp*1.5 + uTime*0.05;',
        '  vec3 iri = 0.5 + 0.5*cos(6.2831*(k*0.8 + vec3(0.0, 0.33, 0.67)));',
        '  iri = mix(iri, iri*iri*1.35, 0.5); // deepen saturation',
        '  vec3 tint = mix(uHueA, uHueB, clamp(k*0.5+0.5, 0.0, 1.0));',
        '',
        '  vec3 col = mix(body, tint * 0.30, 0.18);              // environment tint',
        '  col = mix(col, iri * 0.9, 0.10 + 0.40 * fres * fres); // iridescent rim',
        '',
        '  // key light + secondary cool light',
        '  vec3 L1 = normalize(vec3(0.55, 0.85, 0.5));',
        '  vec3 L2 = normalize(vec3(-0.7, -0.3, 0.4));',
        '  vec3 H1 = normalize(L1 + vDir);',
        '  vec3 H2 = normalize(L2 + vDir);',
        '  col += vec3(1.0, 0.98, 0.94) * pow(max(dot(nrm, H1), 0.0), 42.0) * 1.5;',
        '  col += vec3(0.55, 0.62, 0.9) * pow(max(dot(nrm, H2), 0.0), 30.0) * 0.6;',
        '  col += fres * 0.6 * mix(vec3(1.0), iri, 0.35);',
        '',
        '  col = mix(col, vec3(0.012), clamp(uDark * (1.0 - fres*1.2), 0.0, 1.0));',
        '  col = clamp(col, 0.0, 1.5);',
        '',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });

    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -0.35;
    scene.add(mesh);

    var mouse = new THREE.Vector2(0, 0);
    var mouseT = new THREE.Vector2(0, 0);
    var drag = { on: false, x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0 };
    var vis = { p: 0 };  // scroll progress 0..1

    window.addEventListener('pointermove', function (e) {
      mouseT.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseT.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    function dragStart(e) {
      drag.on = true; drag.x = e.clientX; drag.y = e.clientY;
      document.body.classList.add('is-dragging');
    }
    function dragMove(e) {
      if (!drag.on) return;
      drag.vx = (e.clientX - drag.x) * 0.005;
      drag.vy = (e.clientY - drag.y) * 0.005;
      drag.x = e.clientX; drag.y = e.clientY;
    }
    function dragEnd() { drag.on = false; document.body.classList.remove('is-dragging'); }
    canvas.addEventListener('pointerdown', dragStart);
    window.addEventListener('pointermove', dragMove, { passive: true });
    window.addEventListener('pointerup', dragEnd);

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    var clock = new THREE.Clock();
    gsap.ticker.add(function (time) {
      if (document.hidden) return;
      var t = clock.getElapsedTime();

      mouse.x = lerp(mouse.x, mouseT.x, 0.055);
      mouse.y = lerp(mouse.y, mouseT.y, 0.055);

      // scroll choreography (piecewise over full page)
      var p = vis.p;
      var seg = function (a, b) { return clamp((p - a) / (b - a), 0, 1); };
      var e = seg(0, 0.28), e2 = seg(0.28, 0.62), e3 = seg(0.62, 0.82), e4 = seg(0.82, 1);
      var amp = 0.30 + 0.20 * e + 0.08 * e3;
      var freq = 1.55 + 0.9 * e2 - 0.45 * e4;
      var swirl = 0.35 + 0.85 * e2 - 0.35 * e3;
      var aspect = camera.aspect;
      var portrait = aspect < 1 ? Math.pow(1 / aspect, 0.6) : 1;
      var camZ = (6.5 - 0.5 * e + 1.6 * e2 - 0.3 * e3 - 1.6 * e4) * portrait;
      var camY = -0.15 * e + 0.35 * e2 - 0.1 * e4;
      var posX = 1.35 * e2 - 1.6 * e3 + 0.7 * e4;
      var posY = 0.3 * e - 0.1 * e2;
      var scale = 1 - 0.38 * e2 + 0.5 * e3 + 0.55 * e4;
      var dark = 0.50 + 0.2 * e2 - 0.32 * e4;

      uniforms.uTime.value = t;
      uniforms.uAmp.value = lerp(uniforms.uAmp.value, amp * (REDUCED ? 0.5 : 1), 0.06);
      uniforms.uFreq.value = lerp(uniforms.uFreq.value, freq, 0.06);
      uniforms.uSwirl.value = lerp(uniforms.uSwirl.value, swirl, 0.06);
      uniforms.uDark.value = lerp(uniforms.uDark.value, dark, 0.06);
      uniforms.uDark.value = Math.max(uniforms.uDark.value, 0.0);
      uniforms.uMouse.value.copy(mouse);
      uniforms.uMouseStrength.value = lerp(uniforms.uMouseStrength.value, drag.on ? 1.5 : 0.85, 0.08);
      uniforms.uScroll.value = p;

      var hueA = new THREE.Color().setHSL(0.62 - 0.32 * e2 + 0.28 * e3 + 0.13 * e4, 0.65, 0.66);
      var hueB = new THREE.Color().setHSL(0.075 + 0.16 * e2 - 0.06 * e3 - 0.075 * e4, 0.8, 0.62);
      uniforms.uHueA.value.lerp(hueA, 0.06);
      uniforms.uHueB.value.lerp(hueB, 0.06);

      // drag inertia + idle rotation
      drag.rx = lerp(drag.rx, 0, 0.08);
      drag.ry = lerp(drag.ry, 0, 0.08);
      mesh.rotation.y += 0.0016 + drag.vx + drag.ry;
      mesh.rotation.x += drag.vy * 0.6;
      mesh.rotation.z = -0.35 + Math.sin(t * 0.1) * 0.12 + drag.rx;
      drag.vx *= 0.94; drag.vy *= 0.94;

      mesh.position.x = lerp(mesh.position.x, posX + mouse.x * 0.16, 0.05);
      mesh.position.y = lerp(mesh.position.y, posY + mouse.y * 0.12, 0.05);
      mesh.scale.setScalar(lerp(mesh.scale.x, scale, 0.05));

      camera.position.z = lerp(camera.position.z, camZ, 0.06);
      camera.position.y = lerp(camera.position.y, camY, 0.06);
      camera.lookAt(mesh.position.x * 0.35, mesh.position.y * 0.35, 0);

      renderer.render(scene, camera);
    });

    // scroll progress feed (smoothed by ScrollTrigger scrub)
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1,
      onUpdate: function (self) { vis.p = self.progress; }
    });

    G.mesh = mesh;
    window.__G = G;
  })();

  if (!G.ok) {
    // graceful fallback: the CSS gradient stage carries the design
    document.getElementById('gl').style.display = 'none';
  }

  /* ---------------------------------------------------- hero intro */
  function heroIn() {
    if (REDUCED) {
      gsap.set('.hl__i .ri > span, .hero__kicker span, .hero__intro, .hero__awards span, .scroll-cue, .hdr .pill, .brand', { opacity: 1, y: 0, yPercent: 0 });
      gsap.set('.hl__i--stroke, .hl__i', { opacity: 1 });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.brand', { y: -26, opacity: 0, duration: 0.7 })
      .from('.hdr .pill', { y: -26, opacity: 0, duration: 0.7, stagger: 0.07 }, '<0.05')
      .from('.hero__kicker span', { y: 18, opacity: 0, duration: 0.8, stagger: 0.08 }, '<')
      .fromTo('#heroTitle .hl__i .ri > span', { yPercent: 115 }, {
        yPercent: 0, duration: 1.15, stagger: { each: 0.055, from: 'start' }
      }, '<0.12')
      .from('.hero__intro, .hero__awards span, .scroll-cue', { y: 22, opacity: 0, duration: 0.9, stagger: 0.06 }, '<0.5');
  }

  /* ---------------------------------------------------- header hide */
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    document.getElementById('hdr').classList.toggle('is-hidden', y > 140 && y > lastY && !document.body.classList.contains('is-menu'));
    lastY = y;
  }, { passive: true });

  /* ---------------------------------------------------- menu */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menuBtn');
  var menuOpen = false;
  var menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0% 0 0% 0)', duration: 0.85, ease: 'power4.inOut' })
    .from('.menu__link span, .menu__link i, .menu__link::before', { yPercent: 110, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, '-=0.3')
    .from('.menu__side > div, .menu__foot', { y: 24, opacity: 0, duration: 0.6, stagger: 0.07 }, '-=0.5');

  function setMenu(open) {
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.querySelector('.menu__nav').setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    document.body.classList.toggle('is-menu', open);
    menuBtn.querySelector('.pill__label').textContent = open ? 'CLOSE' : 'MENU';
    if (open) { menuTl.timeScale(1).play(); ScrollTrigger.refresh(); }
    else menuTl.timeScale(1.6).reverse();
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.querySelectorAll('.menu__link').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (menuOpen) setMenu(false);
      if (caseOpen) setCase(null);
    }
  });

  /* ---------------------------------------------------- sound */
  var soundBtn = document.getElementById('soundBtn');
  var soundLabel = document.getElementById('soundLabel');
  var audio = null;
  function buildAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var master = ctx.createGain(); master.gain.value = 0;
    master.connect(ctx.destination);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.6;
    lp.connect(master);
    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110.6;
    var o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 220.3;
    var g3 = ctx.createGain(); g3.gain.value = 0.16;
    o3.connect(g3); g3.connect(lp);
    o1.connect(lp); o2.connect(lp);
    // slow swell
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.35;
    lfo.connect(lfoG);
    var swell = ctx.createGain(); swell.gain.value = 0.6;
    lfoG.connect(swell.gain);
    lp.connect(swell); // (swell feeds its own gain param, audio path stays lp->master)
    o1.start(); o2.start(); o3.start(); lfo.start();
    return { ctx: ctx, master: master };
  }
  soundBtn.addEventListener('click', function () {
    if (!audio) audio = buildAudio();
    if (!audio) return;
    var on = soundBtn.getAttribute('aria-pressed') === 'true';
    if (on) {
      audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.3);
      soundBtn.setAttribute('aria-pressed', 'false');
      soundBtn.classList.remove('is-on');
      soundLabel.textContent = 'SOUND OFF';
    } else {
      audio.ctx.resume();
      audio.master.gain.setTargetAtTime(0.045, audio.ctx.currentTime, 0.6);
      soundBtn.setAttribute('aria-pressed', 'true');
      soundBtn.classList.add('is-on');
      soundLabel.textContent = 'SOUND ON';
    }
  });

  /* ---------------------------------------------------- scroll animations */
  // rail
  var sections = [
    ['#hero', '01', 'HERO'],
    ['#about', '02', 'STUDIO'],
    ['#work', '03', 'WORK'],
    ['#contact', '04', 'CONTACT']
  ];
  var railNum = document.getElementById('railNum');
  var railLabel = document.getElementById('railLabel');
  var railBar = document.getElementById('railBar');
  sections.forEach(function (s) {
    ScrollTrigger.create({
      trigger: s[0], start: 'top 55%', end: 'bottom 45%',
      onToggle: function (self) {
        if (self.isActive) { railNum.textContent = s[1]; railLabel.textContent = s[2]; }
      }
    });
  });
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: function (self) { railBar.style.height = (self.progress * 100).toFixed(1) + '%'; }
  });

  // section heads slide in
  document.querySelectorAll('.sec-head').forEach(function (h) {
    gsap.fromTo(h.children, { y: 26, opacity: 0 }, {
      y: 0, opacity: 1,
      scrollTrigger: { trigger: h, start: 'top 86%' },
      duration: 0.8, stagger: 0.08, ease: 'power3.out', immediateRender: true
    });
  });

  // kinetic word reveal (scrub)
  ScrollTrigger.create({
    trigger: kinetic, start: 'top 78%', end: 'bottom 38%', scrub: 0.6,
    onUpdate: function (self) {
      var n = Math.round(self.progress * kws.length);
      kws.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
    }
  });

  // about side fade
  gsap.fromTo('.about__side > *', { y: 34, opacity: 0 }, {
    y: 0, opacity: 1,
    scrollTrigger: { trigger: '.about__grid', start: 'top 72%' },
    duration: 0.9, stagger: 0.12, ease: 'power3.out', immediateRender: true
  });
  gsap.fromTo('.stats .stat', { y: 26, opacity: 0 }, {
    y: 0, opacity: 1,
    scrollTrigger: { trigger: '.stats', start: 'top 88%' },
    duration: 0.7, stagger: 0.09, ease: 'power3.out', immediateRender: true
  });

  // work intro
  gsap.fromTo('.work__h .ri > span', { yPercent: 115 }, {
    scrollTrigger: { trigger: '.work__intro', start: 'top 80%' },
    yPercent: 0, duration: 1, stagger: 0.045, ease: 'power4.out'
  });
  gsap.fromTo('.work__p', { y: 26, opacity: 0 }, {
    y: 0, opacity: 1,
    scrollTrigger: { trigger: '.work__intro', start: 'top 80%' },
    duration: 0.9, delay: 0.2, ease: 'power3.out', immediateRender: true
  });

  // work cards: reveal + parallax
  document.querySelectorAll('ul.works > li.work').forEach(function (card, i) {
    gsap.fromTo(card.querySelectorAll('.work__head > *'),
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1,
        scrollTrigger: { trigger: card, start: 'top 88%' },
        duration: 0.85, stagger: 0.06, ease: 'power3.out', immediateRender: true });
    var media = card.querySelector('.work__media');
    gsap.to(media, {
      scrollTrigger: { trigger: card, start: 'top 92%' },
      clipPath: 'inset(0% 0 0% 0)', duration: 1.25, ease: 'power4.inOut',
      onComplete: function () { media.style.clipPath = 'inset(0% 0 0% 0)'; }
    });
    gsap.fromTo(media.querySelector('img'), { yPercent: -6 }, {
      scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      yPercent: 4, ease: 'none'
    });
    gsap.fromTo(card.querySelector('.work__desc'), { y: 20, opacity: 0 }, {
      y: 0, opacity: 1,
      scrollTrigger: { trigger: card, start: 'top 80%' },
      duration: 0.8, ease: 'power3.out', immediateRender: true
    });
  });

  // cta lines
  gsap.fromTo('#ctaTitle .cl__i', { yPercent: 115 }, {
    scrollTrigger: { trigger: '#ctaTitle', start: 'top 84%' },
    yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out'
  });
  gsap.fromTo('.cta__row > *', { y: 40, opacity: 0 }, {
    y: 0, opacity: 1,
    scrollTrigger: { trigger: '.cta__row', start: 'top 82%' },
    duration: 1, stagger: 0.15, ease: 'power3.out', immediateRender: true
  });

  /* ---------------------------------------------------- magnetic button */
  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    if (isCoarse) return;
    var strength = 0.34;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', function () {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });

  // capability pills are draggable floaters
  document.querySelectorAll('.cap').forEach(function (el, i) {
    var float = gsap.to(el, {
      y: 'random(-9, 9)', x: 'random(-6, 6)',
      duration: 'random(2.4, 3.6)', ease: 'sine.inOut',
      repeat: -1, yoyo: true, delay: i * 0.2
    });
    if (!isCoarse) {
      var draggie = { active: false };
      el.addEventListener('pointerdown', function (e) {
        draggie.active = true;
        float.pause();
        gsap.killTweensOf(el);
        var ox = e.clientX - gsap.getProperty(el, 'x');
        var oy = e.clientY - gsap.getProperty(el, 'y');
        function mv(ev) {
          if (!draggie.active) return;
          gsap.set(el, { x: ev.clientX - ox, y: ev.clientY - oy });
        }
        function up() {
          draggie.active = false;
          window.removeEventListener('pointermove', mv);
          window.removeEventListener('pointerup', up);
          float.resume();
        }
        window.addEventListener('pointermove', mv);
        window.addEventListener('pointerup', up);
      });
    }
  });

  /* ---------------------------------------------------- case drawer */
  var caseEl = document.getElementById('case');
  var caseOpen = false;
  var caseTl = gsap.timeline({ paused: true })
    .set(caseEl, { visibility: 'visible' })
    .to(caseEl, { backgroundColor: 'rgba(4,4,6,0.62)', duration: 0.5, ease: 'power2.out' })
    .to('.case__panel', { x: 0, duration: 0.85, ease: 'power4.out' }, '<0.05')
    .from('.case__body > *', { y: 34, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' }, '-=0.4');

  function setCase(p, idx) {
    if (p) {
      document.getElementById('caseIdx').textContent = 'CASE ' + pad2(idx + 1) + ' / ' + pad2(PROJECTS.length);
      document.getElementById('caseTitle').textContent = p.name;
      document.getElementById('caseImg1').src = p.img1;
      document.getElementById('caseImg1').alt = p.name + ' hero — ' + p.client;
      document.getElementById('caseImg2').src = p.img2;
      document.getElementById('caseImg2').alt = p.name + ' detail — ' + p.client;
      document.getElementById('caseLede').textContent = p.lede;
      document.getElementById('caseText').textContent = p.text;
      document.getElementById('caseNextName').textContent = PROJECTS[(idx + 1) % PROJECTS.length].name;
      document.getElementById('caseNext').setAttribute('data-open', PROJECTS[(idx + 1) % PROJECTS.length].id);
      document.getElementById('caseMeta').innerHTML = [
        ['CLIENT', p.client], ['YEAR', p.year], ['SCOPE', p.roles], ['RECOGNITION', p.award]
      ].map(function (m) {
        return '<div><dt>' + m[0] + '</dt><dd>' + m[1] + '</dd></div>';
      }).join('');
      caseOpen = true;
      caseEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      document.getElementById('caseScroll').scrollTop = 0;
      caseTl.timeScale(1).play();
    } else {
      caseOpen = false;
      caseEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      caseTl.timeScale(1.7).reverse();
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (!t) return;
    var id = t.getAttribute('data-open');
    var idx = PROJECTS.findIndex(function (p) { return p.id === id; });
    if (idx > -1) {
      e.preventDefault();
      setCase(PROJECTS[idx], idx);
    }
  });
  document.getElementById('caseClose').addEventListener('click', function () { setCase(null); });
  caseEl.addEventListener('click', function (e) { if (e.target === caseEl) setCase(null); });

  /* ---------------------------------------------------- misc */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
