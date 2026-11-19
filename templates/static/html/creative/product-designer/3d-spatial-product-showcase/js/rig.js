/* ═══════════════════════════════════════════════════════════════
   OBJ-07 / ORBIT RIG
   A single sphere mesh carrying three sculpted forms — rounded slab,
   ribbed spindle, optical lens — blended per frame and choreographed
   across scroll chapters with camera, light and material shifts.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('stage');
  if (!canvas || !window.THREE) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia('(max-width: 760px)');
  var isMobile = mqMobile.matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL unavailable, static fallback.', err);
    return;
  }

  var DPR = function () { return Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2); };
  renderer.setPixelRatio(DPR());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070709, 11, 28);

  var camera = new THREE.PerspectiveCamera(isMobile ? 46 : 36, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 6.3);

  /* ── procedural studio environment ─────────────────────────── */
  function buildEnv() {
    var s = new THREE.Scene();
    s.background = new THREE.Color(0x0a0b0e);

    function panel(w, h, color, pos, rot, intensity) {
      var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity || 1) });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
      s.add(mesh);
    }

    panel(7, 4.5, 0xfff2df, [-3.4, 4.2, 2.6], [Math.PI * 0.42, Math.PI * 0.22, 0], 1.35);
    panel(1.2, 8, 0xbccdff, [4.6, 0.6, 1.2], [0, -Math.PI * 0.42, 0], 1.1);
    panel(5, 2.4, 0xffc9a0, [1.2, -3.4, 3.0], [-Math.PI * 0.38, 0, 0], 0.55);
    panel(9, 0.4, 0xffffff, [0, 5.6, -1.4], [Math.PI * 0.5, 0, 0], 0.95);
    panel(9, 9, 0x030304, [0, 0, -6], [0, 0, 0], 1);
    panel(9, 7, 0x050506, [-6, 0, 0], [0, Math.PI * 0.5, 0], 1);
    return s;
  }

  var pmrem = new THREE.PMREMGenerator(renderer);
  var envRT = pmrem.fromScene(buildEnv(), 0.03);
  scene.environment = envRT.texture;

  /* ── geometry: base sphere + three target forms ───────────── */
  var rig = new THREE.Group();
  scene.add(rig);

  var SEG_W = isMobile ? 72 : 104;
  var SEG_H = isMobile ? 52 : 78;
  var geo = new THREE.SphereGeometry(1, SEG_W, SEG_H);
  var posAttr = geo.attributes.position;
  var normalAttr = geo.attributes.normal;
  var count = posAttr.count;
  var basePos = new Float32Array(posAttr.array);
  var baseNrm = new Float32Array(normalAttr.array);

  var forms = [new Float32Array(count * 3), new Float32Array(count * 3), new Float32Array(count * 3)];

  for (var i = 0; i < count; i++) {
    var ix = i * 3;
    var x = basePos[ix], y = basePos[ix + 1], z = basePos[ix + 2];
    var r = Math.sqrt(x * x + y * y + z * z) || 1;
    var nx = x / r, ny = y / r, nz = z / r;
    var theta = Math.acos(Math.max(-1, Math.min(1, ny)));
    var phi = Math.atan2(nz, nx);

    /* 01 — rounded slab (superellipsoid), the hero device */
    var e = 0.5;
    var bx = Math.sign(nx) * Math.pow(Math.abs(nx), e);
    var by = Math.sign(ny) * Math.pow(Math.abs(ny), e);
    var bz = Math.sign(nz) * Math.pow(Math.abs(nz), e);
    // shoulder dent expressed as a 3D gaussian so it stays continuous across the UV seam
    var scoop = Math.exp(-Math.pow((theta - 1.05) / 0.55, 2)) *
                Math.exp(-(Math.pow((nx - 0.42) / 0.55, 2) + Math.pow((nz - 0.46) / 0.6, 2) + Math.pow((ny - 0.1) / 0.75, 2)));
    var pull = 1 - 0.07 * scoop;
    forms[0][ix] = bx * pull * 1.14;
    forms[0][ix + 1] = by * pull * 0.66;
    forms[0][ix + 2] = bz * pull * 1.03;

    /* 02 — ribbed spindle, vertical flutes + pinched waist */
    var rib = 1 + 0.06 * Math.sin(theta * 9.5) + 0.02 * Math.cos(phi * 7);
    var waist = 1 - 0.16 * Math.exp(-Math.pow((theta - Math.PI * 0.5) / 0.5, 2));
    forms[1][ix] = nx * rib * waist * 0.82;
    forms[1][ix + 1] = ny * rib * 1.34;
    forms[1][ix + 2] = nz * rib * waist * 0.82;

    /* 03 — optical lens, flattened disc with rounded rim */
    var ay = Math.abs(ny);
    var rim = 1 - 0.15 * Math.pow(ay, 3);
    forms[2][ix] = nx * 1.22 * rim;
    forms[2][ix + 1] = ny * 0.44 * (1 - 0.2 * Math.pow(ay, 6));
    forms[2][ix + 2] = nz * 1.22 * rim;
  }

  // normals for each target, computed once
  function targetNormals(arr) {
    var g = new THREE.BufferGeometry();
    g.setIndex(geo.index.clone());
    g.setAttribute('position', new THREE.BufferAttribute(arr.slice(), 3));
    g.computeVertexNormals();
    var n = new Float32Array(g.attributes.normal.array);
    g.dispose();

    // weld normals across the UV seam / poles so no crease shows on the surface
    var buckets = {}, key;
    for (var i = 0; i < count; i++) {
      var ix = i * 3;
      key = Math.round(arr[ix] * 1e4) + '|' + Math.round(arr[ix + 1] * 1e4) + '|' + Math.round(arr[ix + 2] * 1e4);
      var b = buckets[key] || (buckets[key] = [0, 0, 0]);
      b[0] += n[ix]; b[1] += n[ix + 1]; b[2] += n[ix + 2];
    }
    for (var j = 0; j < count; j++) {
      var jx = j * 3;
      key = Math.round(arr[jx] * 1e4) + '|' + Math.round(arr[jx + 1] * 1e4) + '|' + Math.round(arr[jx + 2] * 1e4);
      var v = buckets[key];
      var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
      n[jx] = v[0] / len; n[jx + 1] = v[1] / len; n[jx + 2] = v[2] / len;
    }
    return n;
  }
  var formNrm = [targetNormals(forms[0]), targetNormals(forms[1]), targetNormals(forms[2])];

  /* roughness noise for a machined, non-plastic surface */
  function roughnessNoise() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(256, 256);
    for (var k = 0; k < img.data.length; k += 4) {
      var v = 160 + Math.random() * 80;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  }

  var coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x9d968a,
    metalness: 0.32,
    roughness: 0.5,
    envMapIntensity: 1.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.42,
    roughnessMap: roughnessNoise()
  });

  var core = new THREE.Mesh(geo, coreMat);
  core.frustumCulled = false;
  rig.add(core);

  var cageMat = new THREE.MeshBasicMaterial({
    color: 0xd8c3a1,
    wireframe: true,
    transparent: true,
    opacity: 0.01,
    depthWrite: false
  });
  var cage = new THREE.Mesh(geo, cageMat);
  cage.scale.setScalar(1.02);
  cage.frustumCulled = false;
  rig.add(cage);

  /* ── machined details ─────────────────────────────────────── */
  var detail = new THREE.Group();
  rig.add(detail);

  var seamMat = new THREE.MeshStandardMaterial({
    color: 0xb9a37c, metalness: 1, roughness: 0.3, transparent: true, opacity: 0.2
  });
  var seam = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.012, 8, 220), seamMat);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = 0.02;
  seam.scale.set(1.14, 1.03, 1);
  detail.add(seam);

  var portMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c, transparent: true, opacity: 1 });
  var port = new THREE.Mesh(new THREE.CircleGeometry(0.2, 56), portMat);
  port.position.set(0, 0.06, 1.05);
  detail.add(port);

  var portRing = new THREE.Mesh(
    new THREE.RingGeometry(0.206, 0.23, 72),
    new THREE.MeshBasicMaterial({ color: 0xe0c9a2, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
  );
  portRing.position.set(0, 0.06, 1.052);
  detail.add(portRing);

  var portGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 36),
    new THREE.MeshBasicMaterial({ color: 0xf3d7ab, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  portGlow.position.set(0, 0.06, 1.053);
  detail.add(portGlow);

  var dotMat = new THREE.MeshBasicMaterial({ color: 0x2a2723, transparent: true, opacity: 1 });
  [[-0.42, 0.3], [-0.42, 0.02]].forEach(function (p) {
    var dot = new THREE.Mesh(new THREE.CircleGeometry(0.021, 20), dotMat);
    dot.position.set(p[0], p[1], 1.012);
    detail.add(dot);
  });

  /* ── orbiting rings + satellites ──────────────────────────── */
  var ringGroup = new THREE.Group();
  rig.add(ringGroup);

  var ringMat = new THREE.MeshStandardMaterial({
    color: 0xcdb692, metalness: 1, roughness: 0.3, envMapIntensity: 1.0,
    transparent: true, opacity: 0.85
  });
  var ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.011, 8, 240), ringMat);
  ring1.rotation.set(Math.PI * 0.52, 0.18, 0.1);
  ringGroup.add(ring1);

  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.007, 6, 240), ringMat.clone());
  ring2.material.opacity = 0.42;
  ring2.rotation.set(Math.PI * 0.42, -0.55, 0.7);
  ringGroup.add(ring2);

  var satPivot = new THREE.Group();
  satPivot.rotation.copy(ring1.rotation);
  ringGroup.add(satPivot);
  var satellite = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.04, 1),
    new THREE.MeshStandardMaterial({ color: 0xf4e6cd, metalness: 0.85, roughness: 0.22, envMapIntensity: 1.5 })
  );
  satellite.position.set(1.7, 0, 0);
  satPivot.add(satellite);

  var satPivot2 = new THREE.Group();
  satPivot2.rotation.copy(ring2.rotation);
  ringGroup.add(satPivot2);
  var satellite2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xe8d4b4 })
  );
  satellite2.position.set(-2.08, 0, 0);
  satPivot2.add(satellite2);

  /* ── dust field ───────────────────────────────────────────── */
  var dustCount = isMobile ? 260 : 620;
  var dustTex = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  var dustGeo = new THREE.BufferGeometry();
  var dustPos = new Float32Array(dustCount * 3);
  for (var d = 0; d < dustCount; d++) {
    var rad = 2.6 + Math.random() * 5.4;
    var th = Math.random() * Math.PI * 2;
    var ph = Math.acos(2 * Math.random() - 1);
    dustPos[d * 3] = Math.sin(ph) * Math.cos(th) * rad;
    dustPos[d * 3 + 1] = Math.cos(ph) * rad * 0.62;
    dustPos[d * 3 + 2] = Math.sin(ph) * Math.sin(th) * rad * 0.7;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: dustTex, color: 0xe9dcc6, size: 0.05, sizeAttenuation: true,
    transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  /* ── halo, floor, ground glow ─────────────────────────────── */
  function radialTexture(inner, outer) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(0.45, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  var halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture('rgba(232,208,172,0.5)', 'rgba(232,208,172,0.08)'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3
  }));
  halo.scale.set(6, 6, 1);
  halo.position.z = -1.8;
  rig.add(halo);

  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.45 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.05;
  scene.add(floor);

  var groundGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({
      map: radialTexture('rgba(216,195,161,0.3)', 'rgba(216,195,161,0.04)'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = -2.03;
  scene.add(groundGlow);

  /* ── lights ───────────────────────────────────────────────── */
  var keyLight = new THREE.SpotLight(0xffe6c9, 3.3, 30, Math.PI * 0.2, 0.6, 1.2);
  keyLight.position.set(3.8, 5.4, 4.6);
  scene.add(keyLight);
  var keyTarget = new THREE.Object3D();
  scene.add(keyTarget);
  keyLight.target = keyTarget;

  var rimLight = new THREE.DirectionalLight(0x9db4ff, 1.4);
  rimLight.position.set(-5.2, 2.4, -4.2);
  scene.add(rimLight);

  var fillLight = new THREE.PointLight(0xff8f52, 0.85, 14);
  fillLight.position.set(-3.2, -1.8, 3.4);
  scene.add(fillLight);

  var hemi = new THREE.HemisphereLight(0x2a3140, 0x050506, 0.45);
  scene.add(hemi);

  /* ── chapter states ───────────────────────────────────────── */
  var MOB = isMobile;
  var compact = window.innerWidth <= 1100;
  function sx(v) { return MOB ? v * 0.5 : (compact ? v * 0.86 : v); }
  function sy(v) { return MOB ? v * 0.7 : v; }

  var STATES = {
    hero: {
      tx: MOB ? 0.82 : sx(1.62), ty: MOB ? -1.86 : sy(0.26), tz: 0,
      rx: 0.05, ry: 0.26, rz: -0.03,
      scale: MOB ? 0.46 : (compact ? 0.6 : 0.76), m1: 1, m2: 0, m3: 0,
      camZ: MOB ? 6.9 : (compact ? 6.5 : 6.3), camX: 0, camY: 0,
      key: 2.3, rim: 1.3, fill: 0.8, exp: 0.92, ring: 0.9, halo: 0.22, tint: 0xa9a294
    },
    approach: {
      tx: sx(-1.62), ty: sy(0.14), tz: -0.35, rx: 0.34, ry: -0.62, rz: 0.1,
      scale: MOB ? 0.62 : 0.86, m1: 0.45, m2: 0, m3: 0.25,
      camZ: MOB ? 6.7 : 5.7, camX: MOB ? 0 : 0.15, camY: 0,
      key: 2.2, rim: 2.3, fill: 0.6, exp: 0.98, ring: 0.6, halo: 0.28, tint: 0x9e9789
    },
    work: {
      tx: sx(0.2), ty: sy(0.7), tz: -2.6, rx: 0.2, ry: 0.95, rz: 0,
      scale: MOB ? 0.44 : 0.6, m1: 0, m2: 1, m3: 0,
      camZ: MOB ? 7.4 : 6.6, camX: 0, camY: 0.2,
      key: 1.6, rim: 1.2, fill: 0.5, exp: 0.9, ring: 0.3, halo: 0.2, tint: 0x8f8a80
    },
    expertise: {
      tx: sx(2.3), ty: sy(-0.15), tz: -1.1, rx: 1.36, ry: 0.35, rz: 0.16,
      scale: MOB ? 0.48 : 0.68, m1: 0, m2: 0, m3: 1,
      camZ: MOB ? 6.7 : 5.5, camX: MOB ? 0 : -0.1, camY: 0,
      key: 1.6, rim: 1.35, fill: 1.0, exp: 0.9, ring: 1, halo: 0.18, tint: 0x8b8170
    },
    studio: {
      tx: sx(-2.0), ty: sy(-0.55), tz: -1.5, rx: 0.5, ry: -0.35, rz: -0.16,
      scale: MOB ? 0.5 : 0.66, m1: 0.5, m2: 0.5, m3: 0,
      camZ: MOB ? 7.0 : 6.0, camX: 0, camY: -0.1,
      key: 1.7, rim: 1.5, fill: 0.8, exp: 0.95, ring: 0.5, halo: 0.22, tint: 0x9a9488
    },
    contact: {
      tx: sx(2.55), ty: sy(1.25), tz: -1.2, rx: 0.95, ry: 0.9, rz: 0.1,
      scale: MOB ? 0.46 : 0.56, m1: 0.1, m2: 0, m3: 1,
      camZ: MOB ? 6.8 : 5.8, camX: 0, camY: 0.05,
      key: 1.9, rim: 1.4, fill: 1.0, exp: 0.92, ring: 0.85, halo: 0.2, tint: 0x968d7c
    }
  };

  var live = Object.assign({}, STATES.hero);
  var w = [1, 0, 0];            // smoothed form weights
  var wDirty = true;

  var RIG = window.RIG = {
    ready: false,
    fps: 60,
    morphName: 'Slab',
    setChapter: function (name) {
      var s = STATES[name];
      if (!s) return;
      if (s !== STATES.hero) {
        s = Object.assign({}, s);
        if (MOB) { s.scale *= 0.78; s.tz -= 0.9; s.ty += 0.25; }
        else if (compact) { s.scale *= 0.88; s.tz -= 0.3; }
      }
      RIG.morphName = s.m1 >= s.m2 && s.m1 >= s.m3 ? 'Slab' : (s.m2 >= s.m3 ? 'Spindle' : 'Lens');
      if (!window.gsap) { Object.assign(live, s); return; }
      gsap.killTweensOf(live);
      if (s.tint !== undefined) {
        var targetCol = new THREE.Color(s.tint);
        gsap.to(coreMat.color, { r: targetCol.r, g: targetCol.g, b: targetCol.b, duration: 1.5, ease: 'power3.inOut' });
      }
      gsap.to(live, {
        tx: s.tx, ty: s.ty, tz: s.tz,
        rx: s.rx, ry: s.ry, rz: s.rz,
        scale: s.scale, m1: s.m1, m2: s.m2, m3: s.m3,
        camZ: s.camZ, camX: s.camX, camY: s.camY,
        key: s.key, rim: s.rim, fill: s.fill, exp: s.exp,
        ring: s.ring, halo: s.halo,
        duration: reduce ? 0.01 : 1.5,
        ease: 'power3.inOut',
        overwrite: true
      });
    },
    setPointer: function (nx, ny) { pointer.tx = nx; pointer.ty = ny; },
    resize: resize
  };

  /* ── geometry blend (CPU, so the silhouette always follows) ─ */
  var P = posAttr.array;
  var N = normalAttr.array;

  function blendForms() {
    var t1 = Math.min(1, Math.max(0, w[0]));
    var t2 = Math.min(1, Math.max(0, w[1])) * (1 - t1);
    var t3 = Math.min(1, Math.max(0, w[2])) * (1 - t1 - t2);
    var t0 = 1 - t1 - t2 - t3;
    var A = forms[0], B = forms[1], C = forms[2];
    var AN = formNrm[0], BN = formNrm[1], CN = formNrm[2];

    for (var k = 0; k < count * 3; k++) {
      P[k] = basePos[k] * t0 + A[k] * t1 + B[k] * t2 + C[k] * t3;
      var nx = baseNrm[k] * t0 + AN[k] * t1 + BN[k] * t2 + CN[k] * t3;
      N[k] = nx;
    }
    // renormalise normals
    for (var j = 0; j < count; j++) {
      var jx = j * 3;
      var a = N[jx], b = N[jx + 1], c = N[jx + 2];
      var len = Math.sqrt(a * a + b * b + c * c) || 1;
      N[jx] = a / len; N[jx + 1] = b / len; N[jx + 2] = c / len;
    }
    posAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;
    geo.computeBoundingSphere();
    wDirty = false;
  }

  /* ── pointer + scroll ─────────────────────────────────────── */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var scrollVel = 0, lastScroll = window.pageYOffset || 0;

  window.addEventListener('pointermove', function (e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    scrollVel = Math.max(-1, Math.min(1, (y - lastScroll) / 90));
    lastScroll = y;
  }, { passive: true });

  function resize() {
    isMobile = mqMobile.matches;
    compact = window.innerWidth <= 1100;
    var ww = window.innerWidth, hh = window.innerHeight;
    camera.aspect = ww / hh;
    camera.fov = isMobile ? 46 : 36;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(DPR());
    renderer.setSize(ww, hh, false);
  }
  window.addEventListener('resize', resize);
  if (mqMobile.addEventListener) {
    mqMobile.addEventListener('change', function () {
      isMobile = mqMobile.matches;
      compact = window.innerWidth <= 1100;
      resize();
      RIG.setChapter(document.body.dataset.chapter || 'hero');
    });
  }

  /* ── loop ─────────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var frames = 0, fpsTime = 0, ryIdle = 0;
  var lw = [1, 0, 0];

  function damp(cur, tgt, lambda, dt) { return cur + (tgt - cur) * (1 - Math.exp(-lambda * dt)); }

  function tick() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    pointer.x = damp(pointer.x, pointer.tx, 4, dt);
    pointer.y = damp(pointer.y, pointer.ty, 4, dt);
    scrollVel *= Math.pow(0.001, dt);
    ryIdle += dt * (reduce ? 0.02 : 0.1);

    rig.position.x = damp(rig.position.x, live.tx, 5, dt);
    rig.position.y = damp(rig.position.y, live.ty, 5, dt) + Math.sin(t * 0.55) * 0.03;
    rig.position.z = damp(rig.position.z, live.tz, 5, dt);
    rig.scale.setScalar(damp(rig.scale.x, live.scale, 5, dt));

    rig.rotation.x = live.rx + pointer.y * 0.13 + Math.sin(t * 0.33) * 0.02;
    rig.rotation.y = live.ry + ryIdle * 0.3 + pointer.x * 0.28 + scrollVel * 0.3;
    rig.rotation.z = live.rz + Math.sin(t * 0.27) * 0.014;

    /* form weights */
    lw[0] = damp(lw[0], live.m1, 3, dt);
    lw[1] = damp(lw[1], live.m2, 3, dt);
    lw[2] = damp(lw[2], live.m3, 3, dt);
    if (Math.abs(lw[0] - w[0]) + Math.abs(lw[1] - w[1]) + Math.abs(lw[2] - w[2]) > 0.0015) {
      w[0] = lw[0]; w[1] = lw[1]; w[2] = lw[2];
      blendForms();
    }

    ringGroup.rotation.y = t * 0.16;
    ringGroup.rotation.x = Math.sin(t * 0.22) * 0.12;
    satPivot.rotation.z = t * 0.5;
    satPivot2.rotation.z = -t * 0.34;

    ringMat.opacity = live.ring * 0.85;
    ring2.material.opacity = live.ring * 0.42;
    cageMat.opacity = 0.004 + live.ring * 0.01;
    satellite.visible = live.ring > 0.25;
    satellite2.visible = live.ring > 0.25;

    /* details belong to the slab and lens forms */
    var slab = Math.min(1, Math.max(0, w[0]));
    var lens = Math.min(1, Math.max(0, w[2])) * (1 - slab);
    seamMat.opacity = 0.05 + lens * 0.8;
    seam.rotation.z = Math.PI * 0.5 * lens;
    portMat.opacity = slab;
    portRing.material.opacity = slab * 0.95;
    portGlow.material.opacity = slab * (0.4 + Math.sin(t * 1.6) * 0.12);
    dotMat.opacity = slab;
    detail.visible = slab > 0.03 || lens > 0.03;

    halo.material.opacity = damp(halo.material.opacity, live.halo, 3, dt);
    halo.scale.setScalar(damp(halo.scale.x, 5 + live.scale * 1.4, 2, dt));

    keyLight.intensity = damp(keyLight.intensity, live.key, 3, dt);
    rimLight.intensity = damp(rimLight.intensity, live.rim, 3, dt);
    fillLight.intensity = damp(fillLight.intensity, live.fill, 3, dt);
    renderer.toneMappingExposure = damp(renderer.toneMappingExposure, live.exp, 3, dt);

    keyLight.position.x = 3.8 + pointer.x * 0.9;
    keyLight.position.y = 5.4 - pointer.y * 0.6;
    keyTarget.position.copy(rig.position);

    camera.position.x = damp(camera.position.x, live.camX + pointer.x * 0.24, 3, dt);
    camera.position.y = damp(camera.position.y, live.camY - pointer.y * 0.16, 3, dt);
    camera.position.z = damp(camera.position.z, live.camZ, 3, dt);
    camera.lookAt(rig.position.x * 0.25, rig.position.y * 0.25 + 0.1, 0);

    dust.rotation.y = t * 0.012 + scrollVel * 0.2;

    renderer.render(scene, camera);

    frames++;
    fpsTime += dt;
    if (fpsTime >= 0.6) { RIG.fps = Math.round(frames / fpsTime); frames = 0; fpsTime = 0; }
    requestAnimationFrame(tick);
  }

  blendForms();
  RIG.ready = true;
  RIG._core = core;
  RIG._target = live;
  RIG._forms = forms;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clock.stop(); else clock.start();
  });
})();
