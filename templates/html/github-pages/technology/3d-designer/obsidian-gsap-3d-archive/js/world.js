/* ═══════════════════════════════════════════════════════════════════
   OBSIDIAN ARCHIVE WORLD — the scroll-driven 3D layer.
   One scene, one camera; the scroll timeline (app.js) moves a single
   progress value through per-chapter keyframes.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('world');
  const isReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const FOG_PAPER = new THREE.Fog(0xe9e3d6, 14, 44);
  const FOG_NIGHT = new THREE.Fog(0x07080b, 12, 60);
  scene.fog = FOG_PAPER;

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 220);

  /* ── palette ─────────────────────────────────────────────────── */
  const INK = 0x1d1c1a;
  const BONE = 0xe7e2d4;
  const RED = 0xd31f26;

  /* ── groups ──────────────────────────────────────────────────── */
  const world = new THREE.Group();
  scene.add(world);

  // dimension helpers (chapter 02) — every visible line the sketch needs
  const sketch = new THREE.Group();
  world.add(sketch);

  const slabGroup = new THREE.Group();
  world.add(slabGroup);

  const shardGroup = new THREE.Group();
  world.add(shardGroup);

  const satGroup = new THREE.Group();
  world.add(satGroup);

  const dustGroup = new THREE.Group();
  world.add(dustGroup);

  const constel = new THREE.Group();
  world.add(constel);

  /* ── the slab (1 : 4 : 9) ─────────────────────────────────────── */
  const SLAB = [1, 9, 4]; // x, y, z — 1 wide, 9 tall, 4 deep
  const slabGeo = new THREE.BoxGeometry(...SLAB);
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x232833,
    roughness: 0.34,
    metalness: 0.55,
    emissive: 0x060910,
  });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = SLAB[1] / 2 - 2.6;
  slabGroup.add(slab);

  // seams: red edge line that "answers" in chapter 07 — a live strip on the front vertical edges
  const seamGeo = new THREE.BoxGeometry(0.07, SLAB[1] * 1.001, 0.07);
  const seamMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0 });
  const seam = new THREE.Mesh(seamGeo, seamMat);
  seam.position.set(SLAB[0] / 2, slab.position.y, SLAB[2] / 2);
  slabGroup.add(seam);
  const seamBack = seam.clone();
  seamBack.position.z = -SLAB[2] / 2;
  slabGroup.add(seamBack);

  // horizon ground plane (chapter 08+)
  const groundGeo = new THREE.CircleGeometry(70, 72);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x101218,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.6;
  scene.add(ground);

  /* ── sketch lines (ink, on paper) ─────────────────────────────── */
  function inkLine(points, width = 1.4) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 1 });
    const line = new THREE.Line(geo, mat);
    line.material.linewidth = width; // note: mostly ignored by WebGL, opacity carries the look
    return line;
  }

  // elevation box: the slab drawn as pure edges, standing on the same ground line
  const y0 = slab.position.y - SLAB[1] / 2;
  const y1 = slab.position.y + SLAB[1] / 2;
  const x0 = -SLAB[0] / 2, x1 = SLAB[0] / 2;
  const z0 = -SLAB[2] / 2, z1 = SLAB[2] / 2;
  const corners = {
    fbl: [x0, y0, z1], fbr: [x1, y0, z1], ftr: [x1, y1, z1], ftl: [x0, y1, z1],
    bbl: [x0, y0, z0], bbr: [x1, y0, z0], btr: [x1, y1, z0], btl: [x0, y1, z0],
  };
  const edges = [
    ['fbl', 'fbr'], ['fbr', 'ftr'], ['ftr', 'ftl'], ['ftl', 'fbl'],
    ['bbl', 'bbr'], ['bbr', 'btr'], ['btr', 'btl'], ['btl', 'bbl'],
    ['fbl', 'bbl'], ['fbr', 'bbr'], ['ftr', 'btr'], ['ftl', 'btl'],
  ];
  edges.forEach(([a, b]) => {
    const line = inkLine([
      new THREE.Vector3(...corners[a]),
      new THREE.Vector3(...corners[b]),
    ]);
    sketch.add(line);
  });

  // ground line the slab stands on
  sketch.add(inkLine([new THREE.Vector3(-16, y0, 0), new THREE.Vector3(16, y0, 0)]));

  // dimension line + ticks (right of the slab)
  const dx = x1 + 1.6;
  const dim = new THREE.Group();
  dim.add(inkLine([new THREE.Vector3(dx, y0, z1), new THREE.Vector3(dx, y1, z1)]));
  [y0, y1].forEach((y) => {
    dim.add(inkLine([new THREE.Vector3(dx - 0.28, y, z1), new THREE.Vector3(dx + 0.28, y, z1)]));
    dim.add(inkLine([new THREE.Vector3(x1 + 0.12, y, z1), new THREE.Vector3(dx, y, z1)]));
  });
  sketch.add(dim);

  // leader line to a small ratio note
  sketch.add(inkLine([
    new THREE.Vector3(x1, y1, z1),
    new THREE.Vector3(x1 + 2.6, y1 + 0.9, z1),
    new THREE.Vector3(x1 + 4.4, y1 + 0.9, z1),
  ]));

  /* ── sketch plane under everything (the paper itself, in 3D) ──── */
  const paperMat = new THREE.MeshBasicMaterial({ color: 0xe9e3d6, transparent: true, opacity: 1 });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), paperMat);
  paper.rotation.x = -Math.PI / 2;
  paper.position.y = y0 - 0.005;
  scene.add(paper);

  /* ── satellite — the one red bead ─────────────────────────────── */
  const sat = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    new THREE.MeshStandardMaterial({ color: RED, roughness: 0.18, metalness: 0.1, emissive: 0x550000, emissiveIntensity: 0.35 })
  );
  satGroup.add(sat);
  const satRing = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.335, 48),
    new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  satRing.rotation.x = Math.PI / 2;
  satGroup.add(satRing);
  const satOrbit = new THREE.Mesh(
    new THREE.RingGeometry(8.2, 8.24, 128),
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  satOrbit.rotation.x = Math.PI / 2;
  satOrbit.position.y = 0.01;
  world.add(satOrbit);

  /* ── dust — 4000 particles ────────────────────────────────────── */
  const DUST = 4000;
  const dustGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(DUST * 3);
    const spd = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 26 - 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      spd[i] = 0.2 + Math.random() * 0.6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
  }
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: 2.2 },
      uColor: { value: new THREE.Color(BONE) },
      uBeam: { value: 0 }, // 1 = gather inside a beam above the slab
    },
    vertexShader: `
      attribute float aSpeed;
      uniform float uTime; uniform float uSize; uniform float uBeam;
      varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * aSpeed * 0.5 + 3.0, 26.0) - 3.0;
        p.x += sin(uTime * 0.3 + p.y * 0.5) * 0.35;
        p.z += cos(uTime * 0.22 + p.y * 0.4) * 0.35;
        if (uBeam > 0.0) {
          float beamW = 2.6;
          p.x = mix(p.x, p.x * 0.12, uBeam * smoothstep(6.0, 0.0, abs(p.z)));
          p.z = mix(p.z, sign(p.z) * beamW, uBeam * 0.85 * smoothstep(6.0, 1.0, abs(p.x)));
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        vA = smoothstep(60.0, 8.0, d) * smoothstep(0.5, 4.0, d);
        gl_PointSize = uSize * (24.0 / max(d, 0.001)) * (0.6 + 0.8 * aSpeed);
      }`,
    fragmentShader: `
      uniform float uOpacity; uniform vec3 uColor;
      varying float vA;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(uv));
        gl_FragColor = vec4(uColor, a * vA * uOpacity);
      }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.position.y = -1.5;
  world.add(dust);

  /* ── shards — seven kept mistakes (chapter 10) ────────────────── */
  const shardMats = [];
  for (let i = 0; i < 7; i++) {
    const s = 0.32 + Math.random() * 0.55;
    const geo = new THREE.BoxGeometry(s * 0.45, s, s * 0.3);
    const mat = new THREE.MeshStandardMaterial({ color: 0x232833, roughness: 0.38, metalness: 0.5, emissive: 0x060910 });
    const mesh = new THREE.Mesh(geo, mat);
    const ang = (i / 7) * Math.PI * 2 + 0.35;
    const rad = 4.2 + (i % 3) * 0.9;
    mesh.position.set(Math.cos(ang) * rad, 1.2 + Math.sin(i * 2.1) * 1.4, Math.sin(ang) * rad);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.userData = { ang, rad, y: mesh.position.y, spd: 0.08 + Math.random() * 0.1 };
    shardMats.push(mat);
    shardGroup.add(mesh);
  }
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshStandardMaterial({ color: 0x232833, roughness: 0.32, metalness: 0.55, flatShading: true, emissive: 0x060910 })
  );
  core.position.y = 1.2;
  shardGroup.add(core);
  const constelCore = core;

  /* ── constellation — 84 points, 60 lines ──────────────────────── */
  const constelPts = [];
  {
    const n = 84;
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().setFromSphericalCoords(
        9 + Math.random() * 8,
        Math.acos(2 * Math.random() - 1),
        Math.random() * Math.PI * 2
      );
      v.y = Math.abs(v.y) * 0.7 - 1;
      constelPts.push(v);
    }
  }
  const constelGeo = new THREE.BufferGeometry().setFromPoints(constelPts);
  const constelMat = new THREE.PointsMaterial({
    color: BONE, size: 0.075, transparent: true, opacity: 0, sizeAttenuation: true,
  });
  const constelDots = new THREE.Points(constelGeo, constelMat);
  constel.add(constelDots);

  // 60 lines connecting sequential-ish points
  const linePos = [];
  for (let i = 0; i < 60; i++) {
    const a = constelPts[Math.floor(Math.random() * constelPts.length)];
    const b = constelPts[(constelPts.indexOf(a) + 1 + Math.floor(Math.random() * 4)) % constelPts.length];
    linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const constelLineGeo = new THREE.BufferGeometry();
  constelLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  const constelLineMat = new THREE.LineBasicMaterial({ color: BONE, transparent: true, opacity: 0 });
  constel.add(new THREE.LineSegments(constelLineGeo, constelLineMat));

  /* ── lights ───────────────────────────────────────────────────── */
  const ambPaper = new THREE.AmbientLight(0xffffff, 1.05);
  const ambNight = new THREE.AmbientLight(0x3a4258, 0.0);
  const hemi = new THREE.HemisphereLight(0x8b95b8, 0x0a0c12, 0.0);

  const key = new THREE.DirectionalLight(0xfff2df, 0.0);
  key.position.set(6, 12, 8);

  const rim = new THREE.DirectionalLight(0xd31f26, 0.0);
  rim.position.set(-8, 5, -6);

  const fill = new THREE.DirectionalLight(0x9fb4ff, 0.0);
  fill.position.set(-4, 3, 10);

  const top = new THREE.SpotLight(0xe7e2d4, 0.0, 60, 0.42, 0.85);
  top.position.set(0, 26, 4);
  top.target = slab;

  scene.add(ambPaper, ambNight, hemi, key, rim, fill, top);

  /* ═══ state — every scroll-driven value, with per-chapter targets ══ */
  // chapter index: 0..12
  const CH = 13;

  const state = {
    prog: 0,               // 0..12 chapter-space progress
    camera: new THREE.Vector3(0, 0, 0),
    look: new THREE.Vector3(0, 0, 0),
    fogMix: 0,             // 0 paper → 1 night
    sketchIn: 1,           // ink lines visible
    slabIn: 0,             // monolith present
    seam: 0,               // red seam sweep
    satVis: 0,
    satAngle: 0,
    dust: 0,
    beam: 0,
    shards: 0,
    constel: 0,
    ground: 0,
    paper: 1,
    eclipse: 0,
    grainO: 0.5,
    gridO: 1,
    vigO: 0,
  };

  // per-chapter camera keyframes (position, look) — the cinematic spine
  const CAM = [
    { p: [6.5, 2.2, 15.5], l: [0, 2.2, 0] },    // 01 genesis — hero, whole tower at an angle
    { p: [4.5, 2.0, 13.0], l: [0, 2.0, 0] },    // 02 wireframe — front-ish, dimension line
    { p: [10.5, 2.2, 7.5], l: [0, 2.0, 0] },    // 03 monolith — the tall face, low
    { p: [10.5, 3.0, 11.5], l: [0, 2.2, 0] },   // 04 orbit — wide to see the bead
    { p: [6.0, 5.0, 13.5], l: [0, 2.6, 0] },    // 05 artifacts — pulled up
    { p: [2.2, 6.5, 9.0],  l: [0, 4.5, 0] },    // 06 dust — look up the beam
    { p: [2.0, 2.6, 8.0],  l: [0, 3.2, 0] },    // 07 signal — seam closeup
    { p: [16.0, 2.5, 24.0], l: [0, 3.0, 0] },   // 08 horizon — far away
    { p: [10.0, 2.0, 14.0], l: [0, 4.5, 0] },   // 09 eclipse
    { p: [7.0, 4.0, 11.0], l: [0, 2.6, 0] },    // 10 relic — shards
    { p: [2.5, 6.5, 13.0], l: [0, 3.0, 0] },    // 11 constellation
    { p: [5.2, 3.0, 11.0], l: [0, 2.6, 0] },    // 12 transmission
    { p: [8.5, 2.6, 14.0], l: [0, 3.0, 0] },    // 13 contact
  ];

  // smoothstep blend of two scalars over local progress t
  const smooth = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  // local progress of chapter-space p inside a fractional chapter range [a, b]
  const seg = (p, a, b) => Math.min(Math.max((p - a) / (b - a), 0), 1);
  const lerpV3 = (out, a, b, t) => out.set(
    smooth(a[0], b[0], t), smooth(a[1], b[1], t), smooth(a[2], b[2], t)
  );

  /** Evaluate every animated value for a given chapter-space progress. */
  function evalState(p) {
    const i = Math.min(Math.floor(p), CH - 2);
    const t = seg(p, i, Math.min(i + 1, CH - 1));

    // camera along the spine
    const A = CAM[i], B = CAM[Math.min(i + 1, CH - 1)];
    lerpV3(state.camera, A.p, B.p, t);
    lerpV3(state.look, A.l, B.l, t);

    // world turns dark between ch 02 and ch 03
    state.fogMix = smooth(0, 1, seg(p, 1.35, 2.0));
    // ink sketch lives 0→2, gone by 2.4
    state.sketchIn = 1 - smooth(0, 1, seg(p, 1.5, 2.4));
    state.paper = 1 - smooth(0, 1, seg(p, 1.5, 2.4));
    // slab fades in 1.45→2.2
    state.slabIn = smooth(0, 1, seg(p, 1.45, 2.2));
    // red seam in 07
    state.seam = smooth(0, 1, seg(p, 5.9, 6.6)) * (1 - smooth(0, 1, seg(p, 7.6, 8.2)));
    // satellite from 04, stays
    state.satVis = smooth(0, 1, seg(p, 3.0, 3.6));
    // dust from 06, stays on in dark chapters
    state.dust = smooth(0, 1, seg(p, 4.6, 5.6));
    state.beam = smooth(0, 1, seg(p, 4.8, 5.8)) * (1 - smooth(0, 1, seg(p, 7.0, 7.8)));
    // ground plane from 08
    state.ground = smooth(0, 1, seg(p, 6.8, 7.8));
    // shards in 10, gone before 12
    state.shards = smooth(0, 1, seg(p, 9.0, 9.7)) * (1 - smooth(0, 1, seg(p, 10.9, 11.5)));
    // constellation in 11, dissolving into 12
    state.constel = smooth(0, 1, seg(p, 10.0, 10.7)) * (1 - smooth(0, 1, seg(p, 11.5, 12.2)));
    // eclipse in 09
    state.eclipse = smooth(0, 1, seg(p, 8.0, 8.6)) * (1 - smooth(0, 1, seg(p, 9.0, 9.5)));
    // HUD texture
    state.grainO = 0.5 - 0.38 * state.fogMix;
    state.gridO = 1 - state.fogMix;
    state.vigO = state.fogMix;
  }
  
  /* ── eclipse occluder (a dark sphere behind the slab, ch 09) ──── */
  const occluder = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
  );
  occluder.position.set(-14, 6, -30);
  scene.add(occluder);
  const corona = new THREE.Mesh(
    new THREE.RingGeometry(3.7, 5.4, 64),
    new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  corona.position.copy(occluder.position);
  scene.add(corona);

  /* ── render ───────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let elapsed = 0;
  let passCount = 0;
  let targetProg = 0;
  const lookV = new THREE.Vector3();
  const GROUND_A = new THREE.Color(0x101218);
  const GROUND_B = new THREE.Color(0x1a1f2c);

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    // ease chapter-space progress toward the scroll target (feel of scrubbed film)
    state.prog += (targetProg - state.prog) * Math.min(1, dt * 4.5);
    if (Math.abs(targetProg - state.prog) < 0.0004) state.prog = targetProg;
    evalState(state.prog);

    // satellite orbit (one pass ≈ 11 s)
    const prevAngle = state.satAngle;
    state.satAngle = (elapsed / 11) * Math.PI * 2;
    if (Math.floor(prevAngle / (Math.PI * 2)) !== Math.floor(state.satAngle / (Math.PI * 2))) {
      passCount++;
      if (typeof onPass === 'function') onPass(passCount);
    }
    const sa = state.satAngle;
    const sr = 8.2;
    satGroup.position.set(Math.cos(sa) * sr, 0.9 + Math.sin(sa * 2) * 0.4, Math.sin(sa) * sr);

    // shards drift
    shardGroup.children.forEach((m) => {
      if (m.userData.ang === undefined) return;
      const ud = m.userData;
      m.position.x = Math.cos(ud.ang + elapsed * ud.spd) * ud.rad;
      m.position.z = Math.sin(ud.ang + elapsed * ud.spd) * ud.rad;
      m.position.y = ud.y + Math.sin(elapsed * 0.7 + ud.ang) * 0.25;
      m.rotation.y += dt * 0.2;
      m.rotation.x += dt * 0.1;
    });
    constelCore.rotation.y += dt * 0.12;
    constelCore.rotation.x += dt * 0.05;

    // apply state
    const st = state;
    camera.position.copy(st.camera);
    camera.lookAt(lookV.copy(st.look));

    // fog + background handled by CSS for bg color; fog blends
    scene.fog.color.copy(FOG_PAPER.color).lerp(FOG_NIGHT.color, st.fogMix);
    scene.fog.near = 14 - 3 * st.fogMix;
    scene.fog.far = 44 + 18 * st.fogMix;

    // lights
    ambPaper.intensity = 1.05 * (1 - st.fogMix);
    ambNight.intensity = 0.75 * st.fogMix;
    hemi.intensity = 0.9 * st.fogMix;
    key.intensity = 3.2 * st.fogMix + 0.2 * st.slabIn * (1 - st.fogMix);
    fill.intensity = 1.0 * st.fogMix;
    rim.intensity = 1.2 * st.fogMix * (0.5 + 0.5 * st.seam);
    top.intensity = 1.5 * st.beam + 0.5 * st.seam;

    // sketch opacity
    sketch.traverse((c) => {
      if (!c.material) return;
      c.material.opacity = st.sketchIn;
      c.visible = st.sketchIn > 0.01;
    });
    satOrbit.material.opacity = 0.22 * st.sketchIn;
    satOrbit.visible = st.sketchIn > 0.01;

    // paper + slab
    paperMat.opacity = st.paper * 0.92 * (1 - st.fogMix);
    paper.visible = paperMat.opacity > 0.01;
    slabGroup.visible = st.slabIn > 0.005;
    slabMat.transparent = true;
    slabMat.opacity = st.slabIn;
    seamMat.opacity = st.seam * (0.75 + 0.25 * Math.sin(elapsed * 2.2));
    seam.visible = st.seam > 0.01;
    seamBack.visible = seam.visible;

    // ground
    ground.visible = st.ground > 0.01;
    groundMat.transparent = true;
    groundMat.opacity = st.ground;
    groundMat.color.copy(GROUND_A).lerp(GROUND_B, st.eclipse * 0.5);

    // satellite
    satGroup.visible = st.satVis > 0.01;
    sat.material.transparent = true;
    sat.material.opacity = st.satVis;
    satRing.material.opacity = 0.35 * st.satVis;
    satOrbit.material.opacity = Math.max(satOrbit.material.opacity, 0.18 * st.satVis);

    // dust
    dustMat.uniforms.uTime.value = elapsed;
    dustMat.uniforms.uOpacity.value = st.dust * 0.8;
    dustMat.uniforms.uBeam.value = st.beam;
    dust.visible = st.dust > 0.01;

    // shards
    shardGroup.visible = st.shards > 0.01;
    shardGroup.children.forEach((m) => {
      m.material.transparent = true;
      m.material.opacity = st.shards;
    });

    // constellation
    constel.visible = st.constel > 0.01;
    constelMat.opacity = st.constel * 0.95;
    constelLineMat.opacity = st.constel * 0.4;

    // eclipse: occluder slides behind the slab, rim lights up
    occluder.material.opacity = st.eclipse;
    occluder.position.x = -14 + st.eclipse * 10.5;
    corona.material.opacity = st.eclipse * 0.8;
    corona.scale.setScalar(1 + st.eclipse * 0.06);

    // grain via CSS vars (set on #grain and #vignette)
    document.documentElement.style.setProperty('--grain-o', st.grainO.toFixed(3));
    document.documentElement.style.setProperty('--grid-o', st.gridO.toFixed(3));
    document.documentElement.style.setProperty('--vig-o', st.vigO.toFixed(3));

    renderer.render(scene, camera);
  }

  let onPass = null;
  let raf = null;
  function loop() {
    raf = requestAnimationFrame(loop);
    render();
  }
  loop();

  /* ── resize ───────────────────────────────────────────────────── */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', onResize);

  /* ── public handle ────────────────────────────────────────────── */
  window.MONO = {
    /** set world state from scroll progress in chapter units (0..12) */
    set(p) {
      targetProg = Math.min(Math.max(p, 0), CH - 1);
    },
    /** register callback for satellite passes */
    onPass(fn) { onPass = fn; },
    /** red seam pulse, used by app.js in chapter 07 */
    pulseSeam() { seamMat.opacity = 1; },
    THREE,
    camera,
  };
})();
