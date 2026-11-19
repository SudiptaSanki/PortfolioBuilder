/* ═══════════════════════════════════════════════════════════════════════
   GRID RELIEF — SPECIMEN 001
   One morphing artifact: chrome / glass / wire, driven by scroll + pointer.
   three.js r149 · no external assets (environment is drawn to a canvas)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('stage-canvas');
  if (!canvas || !window.THREE) { document.body.classList.add('no-webgl'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = window.matchMedia('(max-width: 900px)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isSmall,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    document.body.classList.add('no-webgl');
    return;
  }
  if (!renderer || !renderer.getContext()) { document.body.classList.add('no-webgl'); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearAlpha(0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  /* ── environment: a studio softbox drawn to an equirect canvas ───────── */
  function makeEnv() {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    var g = c.getContext('2d');

    var grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#c9c6bf');
    grad.addColorStop(0.16, '#e3e0d9');
    grad.addColorStop(0.30, '#efece6');
    grad.addColorStop(0.46, '#d2cfc7');
    grad.addColorStop(0.60, '#b0ada5');
    grad.addColorStop(0.76, '#94918a');
    grad.addColorStop(1, '#78756e');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);

    /* studio softboxes — crisp enough to read as reflections on metal */
    g.filter = 'blur(6px)';
    g.fillStyle = '#ffffff';
    g.fillRect(60, 40, 200, 84);
    g.fillRect(322, 10, 150, 58);
    g.fillRect(640, 44, 220, 100);
    g.fillRect(936, 30, 70, 170);
    g.fillRect(0, 0, 1024, 26);
    g.fillRect(96, 300, 300, 116);
    g.fillRect(694, 250, 118, 118);

    /* dark flags */
    g.filter = 'blur(4px)';
    g.fillStyle = 'rgba(10,10,9,0.95)';
    g.fillRect(516, 150, 176, 264);
    g.fillRect(856, 246, 118, 190);
    g.fillStyle = 'rgba(10,10,9,0.7)';
    g.fillRect(180, 130, 90, 300);

    /* one signal-orange card */
    g.filter = 'blur(3px)';
    g.fillStyle = '#ff3b00';
    g.fillRect(468, 58, 34, 34);

    /* floor bounce */
    g.filter = 'blur(14px)';
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(0, 442, 1024, 44);

    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  var envMap = makeEnv();

  /* ── morph geometry: sphere → octahedron → cube → ribbed spindle ─────── */
  var BASE_R = 1.0;

  function buildTargets(pos, kind) {
    var out = new Float32Array(pos.length);
    for (var i = 0; i < pos.length; i += 3) {
      var x = pos[i], y = pos[i + 1], z = pos[i + 2];
      var ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
      var tx, ty, tz, blend;

      if (kind === 'octa') {
        var s1 = ax + ay + az || 1;
        tx = (x / s1) * 1.30; ty = (y / s1) * 1.30; tz = (z / s1) * 1.30;
        blend = 0.90;
      } else if (kind === 'cube') {
        var s2 = Math.max(ax, ay, az) || 1;
        tx = (x / s2) * 1.04; ty = (y / s2) * 1.04; tz = (z / s2) * 1.04;
        blend = 0.86;
      } else { /* spindle */
        var ang = Math.atan2(z, x);
        var rib = 1 + 0.15 * Math.cos(6 * ang + y * 3.4);
        var tw = y * 0.42;
        var ct = Math.cos(tw), st = Math.sin(tw);
        tx = (x * ct - z * st) * rib * 0.92;
        ty = y * 1.48 * (1 - 0.10 * Math.cos(6 * ang));
        tz = (x * st + z * ct) * rib * 0.92;
        blend = 1.0;
      }
      out[i] = x + (tx - x) * blend;
      out[i + 1] = y + (ty - y) * blend;
      out[i + 2] = z + (tz - z) * blend;
    }
    return out;
  }

  function makeMorphGeometry(wSeg, hSeg) {
    var geo = new THREE.SphereGeometry(BASE_R, wSeg, hSeg);
    var base = geo.attributes.position.array.slice();
    var kinds = ['octa', 'cube', 'spindle'];
    geo.morphAttributes.position = [];
    geo.morphAttributes.normal = [];
    for (var k = 0; k < kinds.length; k++) {
      var arr = buildTargets(base, kinds[k]);
      var attr = new THREE.BufferAttribute(arr, 3);
      geo.morphAttributes.position.push(attr);

      var proxy = new THREE.BufferGeometry();
      proxy.setAttribute('position', new THREE.BufferAttribute(arr.slice(), 3));
      proxy.setIndex(geo.index ? geo.index.clone() : null);
      proxy.computeVertexNormals();
      geo.morphAttributes.normal.push(proxy.attributes.normal);
      proxy.attributes.position = null;
      proxy.dispose();
    }
    geo.attributes.position.needsUpdate = true;
    return geo;
  }

  var SEG_HI = isSmall ? [72, 52] : [116, 84];
  var SEG_LO = isSmall ? [22, 16] : [26, 18];

  var geoHi = makeMorphGeometry(SEG_HI[0], SEG_HI[1]);
  var geoLo = makeMorphGeometry(SEG_LO[0], SEG_LO[1]);

  /* ── materials (a touch of vertex flow on every one of them) ─────────── */
  var flowUniform = { value: 0 };
  function addFlow(mat, amount) {
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = flowUniform;
      shader.uniforms.uFlow = { value: amount };
      shader.vertexShader = 'uniform float uTime;\nuniform float uFlow;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          'float flowA = sin(transformed.y * 3.1 + uTime * 0.85);',
          'float flowB = cos(transformed.x * 2.4 - uTime * 0.62);',
          'float flowC = sin(transformed.z * 2.8 + uTime * 0.41);',
          'transformed += objectNormal * (flowA * flowB * 0.5 + flowC * 0.5) * uFlow;'
        ].join('\n')
      );
    };
    mat.customProgramCacheKey = function () { return 'flow' + amount; };
    return mat;
  }

  var matChrome = addFlow(new THREE.MeshStandardMaterial({
    color: 0x8e8b85,
    metalness: 1,
    roughness: 0.13,
    envMap: envMap,
    envMapIntensity: 1.35
  }), 0.022);

  /* glass on a transparent canvas: layered translucency + strong reflections
     (true transmission has nothing behind it to refract here) */
  var matGlass = addFlow(new THREE.MeshPhysicalMaterial({
    color: 0x1e2b25,
    metalness: 0.0,
    roughness: 0.03,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    ior: 1.46,
    reflectivity: 0.85,
    envMap: envMap,
    envMapIntensity: 1.15
  }), 0.016);

  var matWireGlass = new THREE.MeshBasicMaterial({
    color: 0x0c0c0b, wireframe: true, transparent: true, opacity: 0.12
  });

  var matWire = new THREE.MeshBasicMaterial({
    color: 0x0c0c0b,
    wireframe: true,
    transparent: true,
    opacity: 0.82
  });

  var matCage = new THREE.LineBasicMaterial({
    color: 0x0c0c0b,
    transparent: true,
    opacity: 0.22
  });

  var matRing = new THREE.MeshBasicMaterial({ color: 0x0c0c0b, transparent: true, opacity: 0.4 });
  var matCore = addFlow(new THREE.MeshStandardMaterial({
    color: 0xd9d5cd, metalness: 1, roughness: 0.18, envMap: envMap, envMapIntensity: 1.4
  }), 0.01);
  var matInner = new THREE.LineBasicMaterial({ color: 0x22221f, transparent: true, opacity: 0.42 });

  /* ── the assembly ───────────────────────────────────────────────────── */
  var stageGroup = new THREE.Group();
  var group = new THREE.Group();
  stageGroup.add(group);
  scene.add(stageGroup);

  var meshHi = new THREE.Mesh(geoHi, matChrome);
  var meshLo = new THREE.Mesh(geoLo, matWire);
  var meshLoGlass = new THREE.Mesh(geoLo, matWireGlass);
  meshLoGlass.visible = false;

  meshHi.frustumCulled = false;
  meshLo.frustumCulled = false;
  group.add(meshHi, meshLo, meshLoGlass);

  var cageGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.30, 1));
  var cage = new THREE.LineSegments(cageGeo, matCage);
  group.add(cage);

  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.0045, 6, 220), matRing);
  ring.rotation.set(Math.PI / 2.42, 0.2, 0);
  group.add(ring);

  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.0035, 6, 200), matRing.clone());
  ring2.material.opacity = 0.26;
  ring2.rotation.set(0.4, Math.PI / 2.2, 0.7);
  group.add(ring2);

  /* inner crystal + kryptonite core: what makes the glass look like glass */
  var core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), matCore);
  core.visible = false;
  group.add(core);

  var inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.70, 0)), matInner);
  inner.visible = false;
  group.add(inner);

  var spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
  spark.visible = false;
  group.add(spark);

  /* a soft printed shadow behind the artifact, in scene space (not rotated) */
  function makeShadow() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');
    var rad = g.createRadialGradient(128, 128, 6, 128, 128, 124);
    rad.addColorStop(0, 'rgba(14,14,12,0.30)');
    rad.addColorStop(0.55, 'rgba(14,14,12,0.12)');
    rad.addColorStop(1, 'rgba(14,14,12,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 2.5),
    new THREE.MeshBasicMaterial({ map: makeShadow(), transparent: true, depthWrite: false, opacity: 0.9 })
  );
  shadow.position.set(0.22, -0.46, -1.05);
  shadow.scale.set(1.15, 0.8, 1);
  shadow.material.opacity = 0.6;
  stageGroup.add(shadow);

  /* plate → removed: it read as a black slab in front of the glass */
  var plate = { visible: false };

  var lightA = new THREE.DirectionalLight(0xffffff, 2.6);
  lightA.position.set(3, 4, 5);
  var lightB = new THREE.DirectionalLight(0xcfd4d8, 1.1);
  lightB.position.set(-4, -2, 2);
  var lightC = new THREE.DirectionalLight(0xffffff, 0.35);
  lightC.position.set(0, 0, -4);
  scene.add(lightA, lightB, lightC, new THREE.AmbientLight(0xffffff, 0.42));

  var influences = [0, 0, 0];
  function applyInfluences() {
    for (var i = 0; i < 3; i++) {
      meshHi.morphTargetInfluences[i] = influences[i];
      meshLo.morphTargetInfluences[i] = influences[i];
      meshLoGlass.morphTargetInfluences[i] = influences[i];
    }
  }

  /* ── mode switching ─────────────────────────────────────────────────── */
  var LABEL = { wire: 'WIREFRAME / CAGE', solid: 'SOLID / CHROME', glass: 'GLASS / IOR 1.46' };
  var MODE_ORDER = ['wire', 'solid', 'glass'];
  var mode = 'solid';

  function setMode(next, silent) {
    if (MODE_ORDER.indexOf(next) === -1) return;
    mode = next;
    document.body.setAttribute('data-mode', mode);

    meshHi.material = next === 'glass' ? matGlass : matChrome;
    meshHi.visible = next !== 'wire';
    meshLo.visible = next === 'wire';
    meshLoGlass.visible = next === 'glass';
    cage.material.opacity = next === 'wire' ? 0.34 : 0.16;
    core.visible = next === 'glass';
    matRing.opacity = next === 'glass' ? 0.55 : 0.38;
    cage.material.opacity = next === 'glass' ? 0.10 : cage.material.opacity;

    inner.visible = next === 'glass';
    spark.visible = next === 'glass';
    if (!silent && window.gsap) {
      gsap.fromTo(group.scale, { x: 0.94, y: 0.94, z: 0.94 },
        { x: 1, y: 1, z: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
    }
    window.dispatchEvent(new CustomEvent('wd:mode', { detail: { mode: mode, label: LABEL[mode] } }));
  }

  /* ── drag to orbit ──────────────────────────────────────────────────── */
  var st = {
    rotX: -0.16, rotY: 0.42,
    velX: 0, velY: 0,
    dragging: false, lastX: 0, lastY: 0,
    pointerX: 0, pointerY: 0,
    px: 0, py: 0
  };

  function bindDrag(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      st.dragging = true;
      st.lastX = e.clientX; st.lastY = e.clientY;
      st.velX = st.velY = 0;
      if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) {} }
      document.body.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      st.pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!st.dragging) return;
      var dx = e.clientX - st.lastX;
      var dy = e.clientY - st.lastY;
      st.lastX = e.clientX; st.lastY = e.clientY;
      st.rotY += dx * 0.0075;
      st.rotX += dy * 0.0055;
      st.rotX = Math.max(-1.15, Math.min(1.15, st.rotX));
      st.velY = dx * 0.0009;
      st.velX = dy * 0.0007;
    });
    function end() {
      st.dragging = false;
      document.body.style.cursor = '';
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', function () {
      st.pointerX *= 0.4; st.pointerY *= 0.4;
      if (!st.dragging) return;
      end();
    });
  }
  bindDrag(document.getElementById('stage'));
  bindDrag(document.getElementById('stageB'));

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    st.px = (e.clientX / window.innerWidth) * 2 - 1;
    st.py = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ── stage geometry: the artifact lives inside the DOM stage box ─────── */
  var anchors = {
    a: document.getElementById('stage'),
    b: document.getElementById('stageB')
  };
  var blend = 0;         // 0 → stage A (hero), 1 → stage B (specimen)
  var canvasFade = 1;

  function stageRect(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: r.height, w: r.width };
  }

  function updatePlacement() {
    var ra = stageRect(anchors.a);
    var rb = stageRect(anchors.b);

    var cx, cy, hh, ww;
    if (ra && rb) {
      cx = ra.cx + (rb.cx - ra.cx) * blend;
      cy = ra.cy + (rb.cy - ra.cy) * blend;
      hh = ra.h + (rb.h - ra.h) * blend;
      ww = ra.w + (rb.w - ra.w) * blend;
    } else if (rb) {
      cx = rb.cx; cy = rb.cy; hh = rb.h; ww = rb.w;
    } else if (ra) {
      cx = ra.cx; cy = ra.cy; hh = ra.h; ww = ra.w;
    } else { return; }

    var W = window.innerWidth;
    var H = window.innerHeight;
    var dist = camera.position.z;
    var visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
    var visW = visH * camera.aspect;

    var ndcX = (cx / W) * 2 - 1;
    var ndcY = -((cy / H) * 2 - 1);

    var fill = isSmall ? 0.70 : 0.66;
    var targetPx = Math.min(hh * fill, ww * 0.9);

    stageGroup.position.x = ndcX * visW / 2;
    stageGroup.position.y = ndcY * visH / 2;
    var s = (targetPx / H) * visH / 2.0;
    stageGroup.scale.setScalar(s);
  }

  /* scroll drives the blend between stage A and stage B, and the morph */
  var scrollMorph = 0;
  var heroSpin = 0;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: '#specimen',
      start: 'top bottom',
      end: 'center center',
      scrub: true,
      onUpdate: function (self) { blend = self.progress; }
    });

    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: function (self) { heroSpin = self.progress; }
    });

    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) { scrollMorph = self.progress; }
    });

    ScrollTrigger.create({
      trigger: '#contact',
      start: 'top 85%',
      end: 'top 25%',
      scrub: true,
      onUpdate: function (self) {
        canvasFade = 1 - self.progress;
        canvas.style.opacity = String(0.15 + canvasFade * 0.85);
      }
    });
  }

  /* ── render loop ─────────────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var frames = 0, fpsAt = performance.now(), fps = 60, paused = false;
  var formNames = ['OCTA', 'CUBE', 'SPINDLE'];

  function gauss(x, c, s) { var d = (x - c) / s; return Math.exp(-d * d); }

  function tick() {
    requestAnimationFrame(tick);
    if (paused) return;

    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    flowUniform.value = t;

    /* idle rotation + inertia + pointer tilt */
    if (!st.dragging) {
      st.rotY += st.velY;
      st.rotX += st.velX;
      st.velY *= 0.94;
      st.velX *= 0.94;
      st.rotX += (-st.py * 0.16 - st.rotX) * (reduce ? 0 : 0.012);
    }
    var idle = reduce ? 0 : 0.0016;
    var spin = st.rotY + t * idle + heroSpin * 1.9;
    var tiltX = st.rotX + (reduce ? 0 : Math.sin(t * 0.34) * 0.05);
    var tiltY = st.px * 0.22 + Math.sin(t * 0.22) * 0.03;

    group.rotation.set(tiltX, spin + tiltY, Math.sin(t * 0.18) * 0.03);
    cage.rotation.set(-spin * 0.35, spin * 0.28, 0);
    ring.rotation.z += 0.0016;
    ring2.rotation.y += 0.0022;
    core.rotation.set(t * 0.4, t * 0.55, 0);
    inner.rotation.set(-spin * 0.5, spin * 0.42, 0);
    spark.rotation.set(t * 0.9, t * 0.7, 0);
    spark.position.set(Math.cos(t * 0.4) * 0.28, Math.sin(t * 0.55) * 0.34, Math.cos(t * 0.31) * 0.2);

    /* morph weights: octa (0) → cube (0.5) → spindle (1) */
    var m = Math.min(1, Math.max(0, scrollMorph * 1.15 + st.px * 0.05));
    var w0 = gauss(m, 0.02, 0.30);
    var w1 = gauss(m, 0.5, 0.26);
    var w2 = gauss(m, 0.98, 0.30);
    var sum = w0 + w1 + w2 || 1;
    influences[0] = w0 / sum;
    influences[1] = w1 / sum;
    influences[2] = w2 / sum;
    applyInfluences();

    var dom = influences[0] >= influences[1] && influences[0] >= influences[2] ? 0
      : influences[1] >= influences[2] ? 1 : 2;

    updatePlacement();

    /* glass needs a hair more exposure to read on paper */
    renderer.toneMappingExposure = mode === 'glass' ? 1.12 : 1.02;
    renderer.render(scene, camera);

    frames++;
    var now = performance.now();
    if (now - fpsAt > 600) {
      fps = Math.round((frames * 1000) / (now - fpsAt));
      frames = 0; fpsAt = now;
      window.WD && window.WD.telemetry && window.WD.telemetry({
        fps: fps,
        mode: mode,
        form: formNames[dom],
        weight: influences[dom]
      });
    }
  }

  /* ── resize / visibility ─────────────────────────────────────────────── */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
    renderer.setSize(w, h, false);
  }
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });

  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    if (!paused) { clock.getDelta(); }
  });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    document.body.classList.add('no-webgl');
  });

  /* ── public surface ──────────────────────────────────────────────────── */
  window.WD = window.WD || {};
  window.WD.setMode = setMode;
  window.WD.debug = function () {
    var ra = stageRect(anchors.a), rb = stageRect(anchors.b);
    return {
      blend: blend, scrollMorph: scrollMorph, heroSpin: heroSpin,
      a: ra, b: rb,
      pos: { x: +stageGroup.position.x.toFixed(3), y: +stageGroup.position.y.toFixed(3) },
      scale: +stageGroup.scale.x.toFixed(3),
      camera: { z: camera.position.z, aspect: +camera.aspect.toFixed(3), fov: camera.fov }
    };
  };
  window.WD.modes = MODE_ORDER.slice();
  window.WD.counts = {
    verts: geoHi.attributes.position.count,
    tris: (geoHi.index ? geoHi.index.count : geoHi.attributes.position.count) / 3
  };
  window.WD.gpu = (function () {
    try {
      var gl = renderer.getContext();
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'WEBGL';
      return String(name).replace(/ANGLE \(|\)/g, '').split(',')[0].toUpperCase();
    } catch (e) { return 'WEBGL'; }
  })();

  setMode(initialMode(), true);
  function initialMode() {
    var m = document.body.getAttribute('data-mode');
    return MODE_ORDER.indexOf(m) === -1 ? 'solid' : m;
  }

  resize();
  tick();

  window.addEventListener('load', resize);
  window.dispatchEvent(new CustomEvent('wd:ready', { detail: window.WD.counts }));
})();
