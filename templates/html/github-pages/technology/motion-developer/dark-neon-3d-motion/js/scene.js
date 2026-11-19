/* ==========================================================================
   KINETIC MOTION — WebGL stage
   Floating iridescent / chrome geometry + particle trails.
   Mouse reactive, scroll aware, click bursts.
   ========================================================================== */
(function () {
  'use strict';

  const canvas = document.getElementById('stage');
  if (!canvas || !window.THREE) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 900px)').matches;

  // probe the GPU: software rasterisers get a lighter scene so the page stays usable
  let softGPU = false;
  try {
    const probe = document.createElement('canvas').getContext('webgl');
    if (probe) {
      const dbg = probe.getExtension('WEBGL_debug_renderer_info');
      const name = dbg ? String(probe.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
      softGPU = /swiftshader|llvmpipe|software|basic render|angle \(google/i.test(name);
      const lose = probe.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  } catch (e) { softGPU = false; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !softGPU,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    document.body.classList.add('no-webgl');
    return;
  }

  const MAX_DPR = softGPU ? 0.8 : isSmall ? 1.6 : 1.9;
  let DPR = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 7.6);

  /* ── studio environment (procedural, PMREM) ───────────────────────────── */
  function buildEnvironment() {
    const env = new THREE.Scene();

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        cTop: { value: new THREE.Color('#20261d') },
        cMid: { value: new THREE.Color('#3a4740') },
        cBot: { value: new THREE.Color('#050605') },
        cAcid: { value: new THREE.Color('#c9ff3d') }
      },
      vertexShader: [
        'varying vec3 vP;',
        'void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot; uniform vec3 cAcid;',
        'varying vec3 vP;',
        'void main(){',
        '  float h = normalize(vP).y * 0.5 + 0.5;',
        '  vec3 c = mix(cBot, cMid, smoothstep(0.0, 0.55, h));',
        '  c = mix(c, cTop, smoothstep(0.5, 1.0, h));',
        '  float band = smoothstep(0.42,0.5,h) * (1.0 - smoothstep(0.5,0.58,h));',
        '  c += cAcid * band * 0.55;',
        '  float glow = pow(max(0.0, 1.0 - abs(normalize(vP).y)), 3.0);',
        '  c += cAcid * glow * 0.05;',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    });
    env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 24), skyMat));

    function panel(color, intensity, pos, size, rotY) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0], size[1]),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
      );
      m.position.set(pos[0], pos[1], pos[2]);
      if (rotY) m.rotation.y = rotY;
      env.add(m);
    }
    panel('#ffffff', 9.0, [7, 5.5, 5], [5, 3], -0.5);
    panel('#ffffff', 4.0, [-6, 7, -3], [3, 6], 0);
    panel('#c9ff3d', 7.0, [-8, 3, 3], [4, 4], 0.8);
    panel('#8ff0ff', 3.6, [6, -4, 3], [4, 3], 0.3);
    panel('#ff9a5c', 2.2, [-4, -6, 4], [4, 2], 0.2);
    panel('#c06bff', 1.4, [1, 6, -8], [5, 2], 0);
    panel('#ff5ad8', 3.2, [-3, -4, 8], [6, 3], 0);
    panel('#5ce1ff', 2.6, [5, -2, -7], [4, 4], 0);
    panel('#ffffff', 4.5, [0, 2, 11], [7, 4], 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const rt = pmrem.fromScene(env, 0.03);
    pmrem.dispose();
    env.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    return rt.texture;
  }

  const envMap = buildEnvironment();
  scene.environment = envMap;

  const keyLight = new THREE.DirectionalLight('#dff3ff', 1.1);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight('#c9ff3d', 26, 18, 2);
  rimLight.position.set(-4.5, -2.5, 3.5);
  scene.add(rimLight);

  /* ── materials ────────────────────────────────────────────────────────── */
  function chrome(opts) {
    const o = opts || {};
    if (softGPU) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color || '#ffffff'),
        metalness: o.metalness === undefined ? 1 : o.metalness,
        roughness: o.roughness === undefined ? 0.08 : o.roughness,
        envMapIntensity: 2.2,
        flatShading: !!o.flat
      });
      // cheap stand-in for thin-film iridescence on software renderers
      mat.onBeforeCompile = function (shader) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          [
            'float mmFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);',
            'vec3 mmIri = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + mmFres * 1.7 + 0.35));',
            'gl_FragColor.rgb += mmIri * mmFres * 0.85;',
            '#include <dithering_fragment>'
          ].join('\n')
        );
      };
      return mat;
    }
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(o.color || '#f2f6ea'),
      metalness: o.metalness === undefined ? 1 : o.metalness,
      roughness: o.roughness === undefined ? 0.07 : o.roughness,
      iridescence: o.iridescence === undefined ? 0.9 : o.iridescence,
      iridescenceIOR: o.ior || 1.9,
      iridescenceThicknessRange: o.thickness || [180, 900],
      envMapIntensity: o.env === undefined ? 2.1 : o.env,
      clearcoat: o.clearcoat === undefined ? 0.8 : o.clearcoat,
      clearcoatRoughness: 0.18,
      flatShading: !!o.flat
    });
  }

  /* ── floating objects ─────────────────────────────────────────────────── */
  const group = new THREE.Group();
  scene.add(group);

  const objects = [];
  function addObject(mesh, cfg) {
    mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    if (cfg.scale) mesh.scale.setScalar(cfg.scale);
    group.add(mesh);
    objects.push({
      mesh: mesh,
      base: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
      rotSpeed: cfg.rotSpeed || [0.06, 0.09, 0.03],
      floatAmp: cfg.floatAmp === undefined ? 0.12 : cfg.floatAmp,
      floatSpeed: cfg.floatSpeed || 0.55,
      phase: Math.random() * Math.PI * 2,
      repel: cfg.repel === undefined ? 0.34 : cfg.repel,
      scaleBase: cfg.scale || 1
    });
  }

  // hero crystal — faceted iridescent icosahedron, upper right
  addObject(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), chrome({ roughness: 0.09, color: '#eef3e2', flat: true, thickness: [220, 860] })),
    { pos: [1.72, 0.9, -1.05], rot: [0.4, 0.7, 0.1], floatAmp: 0.14, floatSpeed: 0.42, repel: 0.3 }
  );

  // torus knot — top right
  addObject(
    new THREE.Mesh(new THREE.TorusKnotGeometry(0.4, 0.12, 160, 22, 2, 3), chrome({ roughness: 0.06, color: '#f4f7ee' })),
    { pos: [3.45, 1.72, 0.1], rot: [0.6, 0.2, 0.3], floatSpeed: 0.7, repel: 0.26 }
  );

  // smooth chrome sphere — right middle
  addObject(
    new THREE.Mesh(new THREE.SphereGeometry(0.36, 64, 48), chrome({ roughness: 0.03, color: '#f7f9f1' })),
    { pos: [3.15, -0.35, 0.85], rot: [0, 0, 0], floatSpeed: 0.5, repel: 0.3 }
  );

  // chrome capsule — lower right
  addObject(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.72, 12, 24), chrome({ roughness: 0.05, color: '#f6f8ee' })),
    { pos: [2.55, -1.35, 0.4], rot: [0.4, 0.3, 0.75], floatAmp: 0.16, floatSpeed: 0.5, repel: 0.26 }
  );

  // an acid-lit small gem
  const gem = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshPhysicalMaterial({
      color: '#c9ff3d', metalness: 0.85, roughness: 0.22,
      emissive: new THREE.Color('#7aa80f'), emissiveIntensity: 0.6,
      envMapIntensity: 1.2, flatShading: true
    })
  );
  addObject(gem, { pos: [1.02, -0.72, 1.15], rot: [0.5, 1.1, 0.3], floatAmp: 0.22, floatSpeed: 0.9, repel: 0.38 });

  /* ── particles + trails ───────────────────────────────────────────────── */
  const COUNT = softGPU ? 620 : isSmall ? 700 : 1450;
  const pPos = new Float32Array(COUNT * 3);
  const pVel = new Float32Array(COUNT * 3);
  const pScale = new Float32Array(COUNT);
  const pSeed = new Float32Array(COUNT);
  const BOUND = { x: 7.4, y: 4.4, z: 3.6 };

  for (let i = 0; i < COUNT; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * BOUND.x * 2;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * BOUND.y * 2;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * BOUND.z * 2;
    pSeed[i] = Math.random();
    pScale[i] = 0.45 + Math.random() * 1.4;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aScale', new THREE.BufferAttribute(pScale, 1));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));

  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColorA: { value: new THREE.Color('#c9ff3d') },
      uColorB: { value: new THREE.Color('#8fb6a4') },
      uOpacity: { value: softGPU ? 0.75 : isSmall ? 0.6 : 0.7 },
      uSize: { value: softGPU ? 34 : isSmall ? 42 : 54 }
    },
    vertexShader: [
      'attribute float aScale;',
      'attribute float aSeed;',
      'uniform float uSize;',
      'varying float vSeed;',
      'varying float vFade;',
      'void main(){',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = uSize * aScale * (1.0 / max(0.2, -mv.z)) * 0.6;',
      '  gl_Position = projectionMatrix * mv;',
      '  vSeed = aSeed;',
      '  vFade = clamp(1.0 - (-mv.z - 2.0) / 11.0, 0.12, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;',
      'varying float vSeed; varying float vFade;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5;',
      '  float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.02, d);',
      '  vec3 col = mix(uColorB, uColorA, pow(vSeed, 1.6));',
      '  gl_FragColor = vec4(col, a * uOpacity * vFade);',
      '}'
    ].join('\n')
  });

  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  const TRAILS = softGPU ? 110 : isSmall ? 160 : 340;
  const tPos = new Float32Array(TRAILS * 6);
  const tCol = new Float32Array(TRAILS * 6);
  for (let i = 0; i < TRAILS; i++) {
    const k = i * 6;
    // head brighter acid, tail sage
    tCol[k] = 0.85; tCol[k + 1] = 1.0; tCol[k + 2] = 0.32;
    tCol[k + 3] = 0.02; tCol[k + 4] = 0.03; tCol[k + 5] = 0.015;
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
  tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
  const trails = new THREE.LineSegments(
    tGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: softGPU ? 0.22 : isSmall ? 0.24 : 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  scene.add(trails);

  /* ── click waves ──────────────────────────────────────────────────────── */
  const waves = [];
  const waveGeo = new THREE.RingGeometry(0.86, 0.9, 96);
  function spawnWave(point) {
    if (waves.length > 5) return;
    const mat = new THREE.MeshBasicMaterial({
      color: '#d6ff5c', transparent: true, opacity: 0.95,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const m = new THREE.Mesh(waveGeo, mat);
    m.position.copy(point);
    m.scale.setScalar(0.15);
    scene.add(m);
    waves.push({ mesh: m, t: 0, max: 0.62 });
  }

  /* ── pointer / scroll state ───────────────────────────────────────────── */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let hasPointer = false;
  const world = new THREE.Vector3(0, 0, 0);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'touch') hasPointer = true;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  window.addEventListener('pointerdown', function (e) {
    if (document.body.classList.contains('is-locked')) return;
    if (e.target && e.target.closest && e.target.closest('a,button,input,textarea,select')) return;

    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, hit)) return;
    spawnWave(hit);

    // particle impulse
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const dx = pPos[i3] - hit.x;
      const dy = pPos[i3 + 1] - hit.y;
      const dz = pPos[i3 + 2] - hit.z;
      const d2 = dx * dx + dy * dy + dz * dz + 0.35;
      const force = 0.022 / d2;
      pVel[i3] += dx * force;
      pVel[i3 + 1] += dy * force;
      pVel[i3 + 2] += dz * force;
    }

    // nearest object kicks
    if (window.gsap) {
      objects.forEach(function (o) {
        const d = o.mesh.position.distanceTo(hit);
        if (d < 2.4) {
          const k = 1 + 0.22 * (1 - d / 2.4);
          gsap.fromTo(o.mesh.scale,
            { x: k, y: k, z: k },
            { x: o.scaleBase, y: o.scaleBase, z: o.scaleBase, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: true });
        }
      });
    }
  }, { passive: true });

  let scrollY = window.scrollY || 0;
  let scrollTarget = 0;
  let scrollEase = 0;
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollTarget = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
    scrollY = window.scrollY || 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  /* ── loop ─────────────────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let time = 0;
  let rafId = 0;
  let paused = false;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    // widen framing on tall/narrow screens so objects stay in view
    camera.fov = w / h < 1 ? 58 : 42;
    camera.updateProjectionMatrix();
    DPR = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    renderer.setPixelRatio(DPR);
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  resize();

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (paused) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;                                    // animation time (may freeze)
    scrollEase += (scrollTarget - scrollEase) * Math.min(1, dt * 3.2);
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3.4);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3.4);

    world.set(mouse.x * 5.2, mouse.y * 3.0, 0);

    // camera + group parallax
    camera.position.x = mouse.x * 0.42;
    camera.position.y = mouse.y * 0.28 - scrollEase * 0.55;
    camera.position.z = 7.6 - scrollEase * 1.15;
    camera.lookAt(0, -scrollEase * 0.35, 0);

    group.rotation.y = mouse.x * 0.16 + scrollEase * 0.5;
    group.rotation.x = -mouse.y * 0.1;

    // floating objects
    for (let i = 0; i < objects.length; i++) {
      const o = objects[i];
      const m = o.mesh;
      const t = time * o.floatSpeed + o.phase;
      let px = o.base.x + Math.sin(t * 0.9) * o.floatAmp;
      let py = o.base.y + Math.cos(t * 1.13) * o.floatAmp * 1.15;
      let pz = o.base.z + Math.sin(t * 0.7) * o.floatAmp * 0.6;

      // pointer repel
      const dx = px - world.x;
      const dy = py - world.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2.9 && dist > 0.001) {
        const f = (1 - dist / 2.9) * o.repel;
        px += (dx / dist) * f;
        py += (dy / dist) * f;
      }

      m.position.set(px, py, pz);
      m.rotation.x += o.rotSpeed[0] * dt;
      m.rotation.y += o.rotSpeed[1] * dt;
      m.rotation.z += o.rotSpeed[2] * dt;
      // pointer adds a little spin
      m.rotation.y += mouse.x * 0.0025;
      m.rotation.x -= mouse.y * 0.002;
    }

    // particles
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const x = arr[i3], y = arr[i3 + 1], z = arr[i3 + 2];

      let vx = pVel[i3];
      let vy = pVel[i3 + 1];
      let vz = pVel[i3 + 2];

      const s = pSeed[i] * 6.283;
      vx += Math.sin(y * 0.62 + time * 0.36 + s) * 0.00075;
      vy += Math.cos(x * 0.54 + time * 0.31 + s * 1.7) * 0.00075;
      vz += Math.sin(x * 0.33 + y * 0.44 + time * 0.22) * 0.00055;

      // gentle attraction to the cursor field
      const ddx = world.x - x;
      const ddy = world.y - y;
      const d2 = ddx * ddx + ddy * ddy + 0.6;
      if (d2 < 12) {
        vx += ddx * 0.00042;
        vy += ddy * 0.00042;
      }

      // scroll pushes them back and up
      vz -= scrollEase * 0.00035;

      vx *= 0.986;
      vy *= 0.986;
      vz *= 0.986;

      arr[i3] = x + vx;
      arr[i3 + 1] = y + vy;
      arr[i3 + 2] = z + vz;
      pVel[i3] = vx;
      pVel[i3 + 1] = vy;
      pVel[i3 + 2] = vz;

      // wrap
      if (arr[i3] > BOUND.x) arr[i3] = -BOUND.x;
      else if (arr[i3] < -BOUND.x) arr[i3] = BOUND.x;
      if (arr[i3 + 1] > BOUND.y) arr[i3 + 1] = -BOUND.y;
      else if (arr[i3 + 1] < -BOUND.y) arr[i3 + 1] = BOUND.y;
      if (arr[i3 + 2] > BOUND.z) arr[i3 + 2] = -BOUND.z;
      else if (arr[i3 + 2] < -BOUND.z) arr[i3 + 2] = BOUND.z;
    }
    pGeo.attributes.position.needsUpdate = true;

    // trails follow a subset of particles
    // trails only near the pointer: comets follow the cursor, the field stays dust
    const tp = tGeo.attributes.position.array;
    for (let i = 0; i < TRAILS; i++) {
      const i3 = i * 3;
      const k = i * 6;
      const dx = arr[i3] - world.x;
      const dy = arr[i3 + 1] - world.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = hasPointer ? Math.max(0, 1 - dist / 3.1) : 0;
      const len = 2.2 + near * 12;
      tp[k] = arr[i3] - pVel[i3] * len * near;
      tp[k + 1] = arr[i3 + 1] - pVel[i3 + 1] * len * near;
      tp[k + 2] = arr[i3 + 2];
      tp[k + 3] = arr[i3];
      tp[k + 4] = arr[i3 + 1];
      tp[k + 5] = arr[i3 + 2];
    }
    tGeo.attributes.position.needsUpdate = true;

    // waves
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      w.t += dt;
      const p = Math.min(1, w.t / w.max);
      w.mesh.scale.setScalar(0.14 + p * 3.4);
      w.mesh.material.opacity = 0.95 * Math.pow(1 - p, 2.1);
      w.mesh.lookAt(camera.position);
      if (p >= 1) {
        scene.remove(w.mesh);
        w.mesh.material.dispose();
        waves.splice(i, 1);
      }
    }

    // fade the stage as the page moves past the hero
    const fade = 1 - Math.min(0.95, Math.max(0, (scrollEase - 0.01) / 0.1) * 0.95);
    canvas.style.opacity = fade.toFixed(3);

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    // one still frame, no loop
    renderer.render(scene, camera);
    window.addEventListener('resize', function () {
      resize();
      renderer.render(scene, camera);
    });
  } else {
    frame();
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (!paused) clock.getDelta();
    });
  }

  // expose a tiny read-only handle for the audit
  window.MM_STAGE = {
    objects: objects.length,
    particles: COUNT,
    trails: TRAILS,
    quality: softGPU ? 'low' : 'high',
    get dpr() { return DPR; },
    setDPR: function (v) {
      DPR = v;
      renderer.setPixelRatio(DPR);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    },
    get running() { return !reduceMotion && !paused; }
  };

  // stop the loop if the page is torn down (helps bfcache)
  window.addEventListener('pagehide', function () {
    if (rafId) cancelAnimationFrame(rafId);
  });
})();
