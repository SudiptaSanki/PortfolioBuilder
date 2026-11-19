/* ============================================================
   WORLD — floating stone garden, water, exhibition frames
   Three.js r160 (UMD)
   ============================================================ */
const World = (() => {
  'use strict';

  const C = {
    fog: 0x0a1214,
    deep: 0x04090c,
    stone: 0xb3a289,
    stoneDark: 0x7c7160,
    rock: 0x5d564a,
    moss: 0x5c6a3c,
    wood: 0x342a22,
    ink: 0x11161a,
    amber: 0xffb877,
    sunCol: 0xffcf9e,
  };

  const SUN_DIR = new THREE.Vector3(-0.70, 0.36, -0.62).normalize();

  let scene, renderer, camera, clock;
  let waterMat, sky, sunLight, fillLight;
  let stoneTex, sandTex, woodTex, glowTex, mistTex, flareTex;
  const animated = [];        // {obj, fn(t, dt)}
  const pickables = [];       // meshes carrying workIndex / action
  const frames = [];          // group per work
  const billboards = [];      // mist planes facing camera
  const pointLights = [];
  let particles, particleData;
  let contactHit = null;
  let shadowTex = null;
  const tmpV = new THREE.Vector3();

  /* ---------------- canvas textures ---------------- */
  function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = Math.min(8, renderer ? renderer.capabilities.getMaxAnisotropy() : 4);
    return t;
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  function makeStoneTex() {
    return canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#b5a48b'; ctx.fillRect(0, 0, w, h);
      // soft warm clouds
      for (let i = 0; i < 160; i++) {
        const x = rnd(0, w), y = rnd(0, h), r = rnd(20, 90);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const tone = Math.random() > 0.5 ? '190,172,148' : '146,132,110';
        g.addColorStop(0, `rgba(${tone},0.10)`);
        g.addColorStop(1, `rgba(${tone},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // strata lines
      for (let i = 0; i < 26; i++) {
        const y = rnd(0, h);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(96,86,70,${rnd(0.03, 0.10).toFixed(3)})`;
        ctx.lineWidth = rnd(0.6, 2.6);
        ctx.moveTo(-10, y);
        for (let x = 0; x < w + 10; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
        ctx.stroke();
      }
      // speckle
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 16;
        d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
      }
      ctx.putImageData(img, 0, 0);
    }, [2, 2]);
  }

  function makeSandTex() {
    return canvasTex(1024, 1024, (ctx, w, h) => {
      ctx.fillStyle = '#cbb997'; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      // raked concentric rings
      for (let r = 14; r < 520; r += 13) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(112,96,72,${rnd(0.10, 0.22).toFixed(2)})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240,230,208,0.10)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      // grain
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 22;
        d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.85;
      }
      ctx.putImageData(img, 0, 0);
      // a few stray stones
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(rnd(0, w), rnd(0, h), rnd(1, 2.6), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,80,64,0.35)'; ctx.fill();
      }
    }, [1, 1]);
  }

  function makeWoodTex() {
    return canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#3a2f24'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = rnd(0, w);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '92,74,55' : '26,20,15'},${rnd(0.05, 0.22).toFixed(2)})`;
        ctx.lineWidth = rnd(0.5, 2.4);
        ctx.moveTo(x, -5);
        for (let y = 0; y < h + 10; y += 24) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 2.4, y);
        ctx.stroke();
      }
    }, [1, 1]);
  }

  function makeGlowTex() {
    return canvasTex(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,214,168,0.85)');
      g.addColorStop(0.35, 'rgba(255,190,132,0.30)');
      g.addColorStop(1, 'rgba(255,180,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, [1, 1]);
  }

  function makeFlareTex() {
    return canvasTex(1024, 1024, (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
      g.addColorStop(0, 'rgba(255,246,226,1)');
      g.addColorStop(0.05, 'rgba(255,232,190,0.92)');
      g.addColorStop(0.18, 'rgba(255,196,132,0.35)');
      g.addColorStop(0.55, 'rgba(255,168,104,0.09)');
      g.addColorStop(1, 'rgba(255,150,90,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // anamorphic streak
      const lg = ctx.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, 'rgba(255,190,130,0)');
      lg.addColorStop(0.42, 'rgba(255,214,170,0.22)');
      lg.addColorStop(0.5, 'rgba(255,236,206,0.55)');
      lg.addColorStop(0.58, 'rgba(255,214,170,0.22)');
      lg.addColorStop(1, 'rgba(255,190,130,0)');
      ctx.fillStyle = lg;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, cy - 5, w, 10);
    }, [1, 1]);
  }

  function makeMistTex() {
    return canvasTex(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(214,206,190,0.55)');
      g.addColorStop(0.5, 'rgba(190,190,180,0.16)');
      g.addColorStop(1, 'rgba(180,180,175,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, [1, 1]);
  }

  /* ---------------- materials ---------------- */
  let M = {};

  function buildMaterials() {
    stoneTex = makeStoneTex();
    sandTex = makeSandTex();
    woodTex = makeWoodTex();
    glowTex = makeGlowTex();
    flareTex = makeFlareTex();
    shadowTex = canvasTex(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(3,6,7,0.75)');
      g.addColorStop(0.55, 'rgba(3,6,7,0.42)');
      g.addColorStop(1, 'rgba(3,6,7,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, [1, 1], false);
    mistTex = makeMistTex();

    M.stone = new THREE.MeshStandardMaterial({
      map: stoneTex, color: 0xdccfb9, roughness: 0.92, metalness: 0.02,
    });
    M.stoneWarm = new THREE.MeshStandardMaterial({
      map: stoneTex, color: 0xd8bf9c, roughness: 0.9, metalness: 0.02,
    });
    M.stoneDark = new THREE.MeshStandardMaterial({
      map: stoneTex, color: 0x9c9180, roughness: 0.96, metalness: 0.02,
    });
    M.rock = new THREE.MeshStandardMaterial({
      color: C.rock, roughness: 1, metalness: 0.02, flatShading: true,
    });
    M.sand = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1, metalness: 0 });
    M.moss = new THREE.MeshStandardMaterial({ color: C.moss, roughness: 1, flatShading: true });
    M.mossLight = new THREE.MeshStandardMaterial({ color: 0x74814a, roughness: 1, flatShading: true });
    M.bark = new THREE.MeshStandardMaterial({ color: 0x453729, roughness: 1 });
    M.wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x9a8a76, roughness: 0.85, metalness: 0.04 });
    M.woodDark = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x4a3d31, roughness: 0.8 });
    M.frame = new THREE.MeshStandardMaterial({ color: 0x2c2a25, roughness: 0.55, metalness: 0.55 });
    M.frameWarm = new THREE.MeshStandardMaterial({ color: 0x6b543c, roughness: 0.45, metalness: 0.65 });
    M.gold = new THREE.MeshStandardMaterial({ color: 0xc99a5b, roughness: 0.28, metalness: 0.95 });
    M.glass = new THREE.MeshStandardMaterial({
      color: 0xbfd4d6, roughness: 0.08, metalness: 1, transparent: true, opacity: 0.55,
    });
    M.lamp = new THREE.MeshStandardMaterial({
      color: 0xffd9ad, emissive: 0xff9d50, emissiveIntensity: 0.85, roughness: 0.7,
    });
    M.neon = new THREE.MeshBasicMaterial({
      color: 0xc7ff9b, wireframe: true, transparent: true, opacity: 0.16,
    });
    M.hit = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

    M.canopy = [0x7c884d, 0x97a05a, 0x657244, 0xa3a96c].map(c =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.98, flatShading: true })
    );
    M.bamboo = new THREE.MeshStandardMaterial({ color: 0x6d7a45, roughness: 0.9 });
  }

  const icoGeo = new THREE.IcosahedronGeometry(1, 0);
  const icoGeo1 = new THREE.IcosahedronGeometry(1, 1);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);

  function mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }
  function box(w, h, d, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* ---------------- sky & water ---------------- */
  const skyVert = `
    varying vec3 vDir;
    void main(){
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const skyFrag = `
    varying vec3 vDir;
    uniform vec3 uZenith, uMid, uHorizon, uSunCol, uSunDir;
    void main(){
      vec3 d = normalize(vDir);
      float h = d.y;
      vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.10, h));
      col = mix(col, uZenith, smoothstep(0.07, 0.42, h));
      float below = smoothstep(-0.02, -0.30, h);
      col = mix(col, vec3(0.012,0.020,0.022), below);
      float sd = max(dot(d, normalize(uSunDir)), 0.0);
      col += uSunCol * pow(sd, 6.0) * 0.05;
      col += uSunCol * pow(sd, 60.0) * 0.30;
      col += uSunCol * pow(sd, 420.0) * 1.5;
      col += vec3(1.0, 0.80, 0.56) * smoothstep(0.99960, 0.99992, sd) * 1.5;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  function buildSun() {
    const mat = new THREE.SpriteMaterial({
      map: flareTex, color: 0xffd8b0, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(210, 210, 1);
    sp.position.copy(SUN_DIR).multiplyScalar(330);
    sp.renderOrder = 3;
    scene.add(sp);
  }

  function buildSky() {
    const geo = new THREE.SphereGeometry(420, 40, 24);
    const mat = new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(0x03060a) },
        uMid: { value: new THREE.Color(0x0c1418) },
        uHorizon: { value: new THREE.Color(0x3d2617) },
        uSunCol: { value: new THREE.Color(0xffb377) },
        uSunDir: { value: SUN_DIR.clone() },
      },
    });
    sky = new THREE.Mesh(geo, mat);
    sky.frustumCulled = false;
    scene.add(sky);
  }

  const waterVert = `
    varying vec3 vWorld;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;

  const waterFrag = `
    varying vec3 vWorld;
    uniform float uTime;
    uniform vec3 uDeep, uSky, uSunCol, uSunDir, uFog, uZenith, uMid, uHorizon;
    vec3 skyRef(vec3 d){
      float h = d.y;
      vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.10, h));
      c = mix(c, uZenith, smoothstep(0.07, 0.42, h));
      float s = max(dot(d, normalize(uSunDir)), 0.0);
      c += uSunCol * pow(s, 6.0) * 0.05;
      c += uSunCol * pow(s, 60.0) * 0.45;
      return c;
    }
    void main(){
      vec3 V = normalize(cameraPosition - vWorld);
      float wx = vWorld.x, wz = vWorld.z;
      vec3 N = normalize(vec3(
        sin(wx*0.42 + uTime*0.55)*0.05 + sin(wz*0.21 - uTime*0.43)*0.035,
        1.0,
        sin(wz*0.37 + uTime*0.48)*0.05 + sin(wx*0.26 + uTime*0.31)*0.035
      ));
      float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
      vec3 R = reflect(-V, N);
      vec3 refl = skyRef(R);
      vec3 col = mix(uDeep, refl, clamp(fres*1.35 + 0.04, 0.0, 0.96));
      float sd = max(dot(R, normalize(uSunDir)), 0.0);
      float ripple = 0.55 + 0.45*sin(wx*1.7 + wz*1.3 + uTime*1.6);
      col += uSunCol * pow(sd, 900.0) * 4.0 * ripple;
      col += uSunCol * pow(sd, 120.0) * 0.35 * ripple;
      float d = length(vWorld.xz - cameraPosition.xz);
      col = mix(col, uFog, smoothstep(60.0, 230.0, d) * 0.92);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  function buildWater() {
    waterMat = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color(0x03080a) },
        uSky: { value: new THREE.Color(0x241c18) },
        uSunCol: { value: new THREE.Color(0xffb894) },
        uSunDir: { value: SUN_DIR.clone() },
        uFog: { value: new THREE.Color(C.fog) },
        uZenith: { value: new THREE.Color(0x03060a) },
        uMid: { value: new THREE.Color(0x0c1418) },
        uHorizon: { value: new THREE.Color(0x3d2617) },
      },
    });
    const geo = new THREE.PlaneGeometry(520, 520, 1, 1);
    const w = new THREE.Mesh(geo, waterMat);
    w.rotation.x = -Math.PI / 2;
    w.position.y = 0;
    scene.add(w);
  }

  /* ---------------- garden pieces ---------------- */
  function platform(r, h, y, opts = {}) {
    const g = new THREE.Group();
    const seg = opts.seg || 11;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.985, h, seg, 1), opts.mat || M.stone);
    top.position.y = h / 2;
    top.castShadow = true; top.receiveShadow = true;
    if (opts.sand) {
      top.material = M.sand;
    }
    g.add(top);

    // rim
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.006, r * 1.006, h * 0.14, seg, 1), M.stoneDark);
    rim.position.y = h * 0.93;
    rim.receiveShadow = true;
    g.add(rim);

    // rocky underside
    const under = new THREE.Mesh(icoGeo1, M.rock);
    under.scale.set(r * 0.88, r * 0.52 * (opts.deep || 1), r * 0.88);
    under.position.y = -r * 0.5;
    under.rotation.y = Math.random() * 3;
    under.castShadow = true;
    g.add(under);

    // water-contact shadow
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 2.5, r * 2.5),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(opts.x || 0, 0.02, opts.z || 0);
    scene.add(sh);

    g.position.set(opts.x || 0, y, opts.z || 0);
    scene.add(g);
    return g;
  }

  function slab(w, h, d, mat, x, y, z, ry = 0) {
    const m = box(w, h, d, mat, x, y, z);
    m.rotation.y = ry;
    scene.add(m);
    return m;
  }

  function rock(x, z, s, y = 0) {
    const m = new THREE.Mesh(icoGeo1, M.rock);
    m.scale.set(s * rnd(0.8, 1.3), s * rnd(0.5, 0.9), s * rnd(0.8, 1.3));
    m.position.set(x, y + s * 0.35, z);
    m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function mossMound(x, z, s, y) {
    const m = new THREE.Mesh(icoGeo1, Math.random() > 0.5 ? M.moss : M.mossLight);
    m.scale.set(s, s * 0.5, s * 0.9);
    m.position.set(x, y, z);
    m.rotation.y = rnd(0, 3);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function tree(x, z, s = 1, y = 0, opts = {}) {
    const g = new THREE.Group();
    const th = 5.4 * s;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.44 * s, th, 7, 1), M.bark);
    trunk.position.y = th / 2;
    trunk.castShadow = true;
    g.add(trunk);

    for (let i = 0; i < 3; i++) {
      const bl = rnd(1.4, 2.4) * s;
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.16 * s, bl, 5), M.bark);
      br.position.set(rnd(-0.5, 0.5) * s, th * rnd(0.62, 0.82), rnd(-0.5, 0.5) * s);
      br.rotation.set(rnd(-0.8, 0.8), rnd(0, 3), rnd(-0.8, 0.8));
      br.castShadow = true;
      g.add(br);
    }

    const n = opts.big ? 14 : 9;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(icoGeo, M.canopy[i % M.canopy.length]);
      const r = rnd(1.0, 1.9) * s * (opts.big ? 1.15 : 1);
      m.scale.set(r, r * rnd(0.6, 0.9), r);
      const ang = (i / n) * Math.PI * 2 + rnd(-0.4, 0.4);
      const rad = rnd(0.2, 2.2) * s;
      m.position.set(Math.cos(ang) * rad, th * rnd(0.85, 1.05) + rnd(-0.3, 0.9) * s, Math.sin(ang) * rad);
      m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
      m.castShadow = true;
      g.add(m);
    }
    g.position.set(x, y, z);
    g.rotation.y = rnd(0, Math.PI * 2);
    g.userData.sway = rnd(0.4, 1.0);
    g.userData.seed = rnd(0, 6.28);
    scene.add(g);
    animated.push({ obj: g, kind: 'sway' });
    return g;
  }

  function bamboo(x, z, n = 14, s = 1, y = 0) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const h = rnd(4.5, 8.5) * s;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.042 * s, h, 5), M.bamboo);
      stalk.position.set(rnd(-1.1, 1.1) * s, h / 2, rnd(-1.1, 1.1) * s);
      stalk.rotation.set(rnd(-0.08, 0.08), 0, rnd(-0.08, 0.08));
      stalk.castShadow = true;
      g.add(stalk);
      for (let k = 0; k < 9; k++) {
        const leaf = new THREE.Mesh(icoGeo, M.canopy[1 + (k % 2)]);
        leaf.scale.set(rnd(0.13, 0.24) * s, rnd(0.02, 0.05) * s, rnd(0.36, 0.62) * s);
        leaf.position.set(stalk.position.x + rnd(-0.55, 0.55), h * rnd(0.55, 0.99), stalk.position.z + rnd(-0.55, 0.55));
        leaf.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
        g.add(leaf);
      }
    }
    g.position.set(x, y, z);
    scene.add(g);
    animated.push({ obj: g, kind: 'sway', amp: 0.02 });
    return g;
  }

  function wireBush(x, z, s, y) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(icoGeo1, M.neon);
    a.scale.setScalar(s);
    g.add(a);
    const b = new THREE.Mesh(icoGeo1, M.neon);
    b.scale.setScalar(s * 0.6);
    b.position.set(s * 0.7, s * 0.35, -s * 0.3);
    g.add(b);
    g.position.set(x, y + s * 0.75, z);
    scene.add(g);
    animated.push({ obj: g, kind: 'float', amp: 0.16, speed: 0.8, baseY: g.position.y, spin: 0.12 });
    return g;
  }

  function lantern(x, z, s = 1, y = 0) {
    const g = new THREE.Group();
    g.add(box(0.75 * s, 0.18 * s, 0.75 * s, M.stoneDark, 0, 0.09 * s, 0));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.13 * s, 1.15 * s, 8), M.stone);
    shaft.position.y = 0.75 * s; shaft.castShadow = true;
    g.add(shaft);
    g.add(box(0.62 * s, 0.12 * s, 0.62 * s, M.stoneDark, 0, 1.38 * s, 0));
    const lampBox = box(0.36 * s, 0.42 * s, 0.36 * s, M.lamp, 0, 1.7 * s, 0);
    g.add(lampBox);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62 * s, 0.34 * s, 4), M.stone);
    roof.position.y = 2.07 * s; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    g.add(roof);
    const finial = new THREE.Mesh(icoGeo, M.stoneDark);
    finial.scale.setScalar(0.11 * s);
    finial.position.y = 2.3 * s;
    g.add(finial);
    g.position.set(x, y, z);
    scene.add(g);
    animated.push({ obj: lampBox.material, kind: 'flicker' });
    return g;
  }

  function glowSprite(x, y, z, size, opacity = 0.5) {
    const mat = new THREE.SpriteMaterial({
      map: glowTex, color: 0xffc79a, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(size, size, 1);
    sp.position.set(x, y, z);
    scene.add(sp);
    return sp;
  }

  function torii(x, z) {
    const g = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.26, 0.34, 6.4, 10);
    [-3.5, 3.5].forEach(px => {
      const p = new THREE.Mesh(postGeo, M.woodDark);
      p.position.set(px, 3.2, 0);
      p.castShadow = true; p.receiveShadow = true;
      g.add(p);
    });
    // top lintel with slight upward curve at ends
    const topBar = box(9.6, 0.42, 0.62, M.woodDark, 0, 6.35, 0);
    topBar.rotation.z = 0;
    g.add(topBar);
    [-4.9, 4.9].forEach(px => {
      const cap = box(0.9, 0.34, 0.58, M.woodDark, px, 6.55, 0);
      cap.rotation.z = px > 0 ? -0.14 : 0.14;
      g.add(cap);
    });
    g.add(box(10.3, 0.2, 0.5, M.woodDark, 0, 5.72, 0));
    const plaque = box(1.05, 0.62, 0.12, M.frameWarm, 0, 5.95, 0.3);
    g.add(plaque);
    // base stones
    [-3.5, 3.5].forEach(px => g.add(box(0.9, 0.3, 0.9, M.stoneDark, px, 0.1, 0)));
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }

  /* ---------------- works ---------------- */
  function captionTex(work) {
    return canvasTex(1280, 160, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(217,160,106,0.95)';
      ctx.font = '700 40px "Space Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(work.no, 0, h / 2);
      ctx.fillStyle = 'rgba(236,231,219,0.94)';
      ctx.font = '700 40px "Space Mono", monospace';
      ctx.fillText(work.title.toUpperCase(), 90, h / 2);
      ctx.fillStyle = 'rgba(236,231,219,0.42)';
      ctx.font = '400 32px "Space Mono", monospace';
      const t = work.year;
      ctx.fillText(t, w - ctx.measureText(t).width - 4, h / 2);
    });
  }

  function workFrame(work, i) {
    const { x, y, z, ry, w, h } = work.frame;
    const g = new THREE.Group();
    const b = 0.15, d = 0.18;

    g.add(box(w, b, d, M.frame, 0, h / 2 - b / 2, 0));
    g.add(box(w, b, d, M.frame, 0, -h / 2 + b / 2, 0));
    g.add(box(b, h - 2 * b, d, M.frame, -w / 2 + b / 2, 0, 0));
    g.add(box(b, h - 2 * b, d, M.frame, w / 2 - b / 2, 0, 0));
    g.add(box(w, h, 0.05, M.frame, 0, 0, -0.09));

    const imgMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.82, metalness: 0.0,
      emissive: 0xffffff, emissiveIntensity: 0.3,
    });
    const img = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * b, h - 2 * b), imgMat);
    img.position.z = 0.012;
    g.add(img);
    work._imgMat = imgMat;
    work._imgMesh = img;

    // small brass light bar above the frame
    g.add(box(w * 0.34, 0.05, 0.08, M.gold, 0, h / 2 + 0.18, 0.06));

    // small brass index plate under the frame
    const idxMat = new THREE.MeshBasicMaterial({ map: captionTex(work), transparent: true, depthWrite: false });
    const idx = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.2), idxMat);
    idx.position.set(0, -h / 2 - 0.26, 0.02);
    g.add(idx);

    // pedestal glow under the frame
    const pedMat = new THREE.MeshBasicMaterial({
      map: glowTex, color: 0xffc79a, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ped = new THREE.Mesh(new THREE.PlaneGeometry(w + 2.0, 3.4), pedMat);
    ped.rotation.x = -Math.PI / 2;
    ped.position.set(0, -y + 0.06, 0.4);
    g.add(ped);

    // invisible hit volume
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.7), M.hit);
    hit.userData.workIndex = i;
    g.add(hit);
    pickables.push(hit);

    g.position.set(x, y, z);
    g.rotation.y = ry;
    g.userData.baseY = y;
    g.userData.seed = i * 1.7;
    g.userData.i = i;
    scene.add(g);
    frames.push(g);
    animated.push({ obj: g, kind: 'floatFrame', amp: 0.1, speed: 0.55 + i * 0.06, baseY: y, spin: 0.0 });
    return g;
  }

  function stoneHall() {
    // a narrow stone walkway over the water, framed by a colonnade standing in it
    const walk = box(4.8, 0.8, 44, M.stone, 0, 0.4, -13);
    walk.receiveShadow = true; walk.castShadow = true;
    scene.add(walk);
    // dark wet edging
    slab(0.34, 0.84, 44, M.stoneDark, -2.4, 0.42, -13, 0);
    slab(0.34, 0.84, 44, M.stoneDark, 2.4, 0.42, -13, 0);
    // brass inlay running the length of the walkway
    slab(0.05, 0.015, 42, M.gold, 0, 0.81, -13, 0);

    // colonnade standing in the pool
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const z = -1 - k * 7.6;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 8.4, 10), M.stone);
        col.position.set(side * 10.4, 4.2, z);
        col.castShadow = true; col.receiveShadow = true;
        scene.add(col);
        scene.add(box(1.0, 0.26, 1.0, M.stoneDark, side * 10.4, 8.6, z));
        // base sitting in the water
        scene.add(box(1.4, 0.5, 1.4, M.stoneDark, side * 10.4, 0.12, z));
      }
    }

    // stepping slabs on the far end of the walkway
    for (let k = 0; k < 3; k++) {
      const m = box(3.0, 0.22, 1.5, M.stoneWarm, 0, 0.86, -27 - k * 3.2);
      m.receiveShadow = true;
      scene.add(m);
    }

    // floating moss islands along the edges of the walkway
    const mossSpots = [[-4.6, -2], [4.9, -6.5], [-5.2, -11], [5.4, -16], [-4.8, -20.5], [4.6, -24]];
    mossSpots.forEach(([x, z]) => {
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(rnd(0.7, 1.1), rnd(0.6, 1.0), 0.3, 8), M.rock);
      pl.position.set(x, 0.1, z);
      pl.rotation.y = rnd(0, 3);
      pl.receiveShadow = true;
      scene.add(pl);
      mossMound(x, z, rnd(0.45, 0.7), 0.28);
    });

    rock(-5.6, -14, 0.8, 0.1);
    rock(5.8, -17, 0.7, 0.1);

    // lanterns at the mouth of the walkway
    tree(-14.5, -20, 1.35, 0);
    tree(14.8, -26, 1.25, 0);
    bamboo(-15.2, -16, 9, 1.0, 0);
    bamboo(15.6, -20, 8, 0.9, 0);

    // floating paper lanterns along the walkway
    for (let k = 0; k < 4; k++) {
      const side = k % 2 === 0 ? -1 : 1;
      const lx = side * 3.2, lz = -4 - k * 6;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), M.lamp);
      bulb.position.set(lx, 1.9 + Math.sin(k) * 0.15, lz);
      scene.add(bulb);
      const sp = glowSprite(lx, bulb.position.y, lz, 2.2, 0.5);
      animated.push({ obj: sp.material, kind: 'flickerSoft' });
      animated.push({ obj: bulb, kind: 'float', amp: 0.1, speed: 0.6 + k * 0.1, baseY: bulb.position.y, spin: 0 });
    }

    glowSprite(0, 1.0, -8, 18, 0.10);
  }

  function studio() {
    platform(12, 0.8, 0.45, { x: 0, z: -44.5, deep: 0.8, seg: 14 });

    // approach steps
    slab(6.4, 0.3, 1.4, M.stoneDark, 0, 0.32, -33.6);
    slab(5.4, 0.55, 1.2, M.stoneDark, 0, 0.5, -34.8);

    // long low bench
    const bench = box(3.8, 0.22, 1.1, M.wood, 2.6, 1.45, -43.2);
    bench.castShadow = true;
    scene.add(bench);
    for (const dx of [-1.5, 1.5]) scene.add(box(0.16, 0.55, 0.9, M.woodDark, 2.6 + dx, 1.2, -43.2));

    // desk slab with the monitor
    const desk = box(3.4, 0.14, 1.5, M.wood, -6.2, 1.55, -44.2);
    desk.rotation.y = 0.62;
    desk.castShadow = true;
    scene.add(desk);
    for (const dx of [-1.4, 1.4]) scene.add(box(0.12, 0.6, 0.12, M.woodDark, -6.2 + dx * Math.cos(0.62), 1.2, -44.2 - dx * Math.sin(0.62)));

    const mon = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.48, 0.12), M.frame);
    mon.position.set(-6.2, 2.45, -44.6);
    mon.rotation.y = 0.62;
    mon.castShadow = true;
    scene.add(mon);
    const screenTex = canvasTex(1024, 620, (ctx, w, h) => {
      ctx.fillStyle = '#070c0b'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(199,255,155,0.16)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(217,160,106,0.9)'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const x = (i / 27) * w, y = h * 0.62 + Math.sin(i * 0.7) * 80 + Math.sin(i * 0.23) * 42;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(199,255,155,0.8)';
      ctx.font = '700 30px "Space Mono", monospace';
      ctx.fillText('SCENE / 03', 44, 70);
      ctx.fillStyle = 'rgba(236,231,219,0.45)';
      ctx.font = '400 22px "Space Mono", monospace';
      ctx.fillText('REAL-TIME  ·  SPATIAL STUDY', 44, h - 48);
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.28),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screen.position.set(-6.2 + Math.sin(0.62) * 0.07, 2.45, -44.6 + Math.cos(0.62) * 0.07);
    screen.rotation.y = 0.62;
    scene.add(screen);

    // monolith with the studio typography
    const plate = canvasTex(1400, 780, (ctx, w, h) => {
      ctx.fillStyle = '#0a0f0d'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(236,231,219,0.16)'; ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);
      ctx.fillStyle = 'rgba(217,160,106,0.95)';
      ctx.font = '700 26px "Space Mono", monospace';
      ctx.fillText('03 / PRACTICE', 70, 100);
      ctx.fillStyle = 'rgba(236,231,219,0.94)';
      ctx.font = '800 190px "Inter Tight", sans-serif';
      ctx.fillText('STUDIO', 62, 300);
      ctx.fillStyle = 'rgba(236,231,219,0.62)';
      ctx.font = '400 27px "Space Mono", monospace';
      const rows = ['SPATIAL DESIGN', '3D VISUALISATION', 'WEB ANIMATION', 'SINCE 2016 — AMSTERDAM / KYOTO'];
      rows.forEach((r, i) => ctx.fillText(r, 70, 400 + i * 50));
      ctx.strokeStyle = 'rgba(217,160,106,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(70, 640); ctx.lineTo(w - 70, 640); ctx.stroke();
      ctx.fillStyle = 'rgba(236,231,219,0.4)';
      ctx.font = '400 22px "Space Mono", monospace';
      ctx.fillText('I BUILD QUIET SPACES YOU CAN WALK THROUGH.', 70, 700);
    });
    const mono = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4.45, 0.24),
      [M.frame, M.frame, M.frame, M.frame,
        new THREE.MeshStandardMaterial({ map: plate, emissive: 0xffffff, emissiveMap: plate, emissiveIntensity: 0.34, roughness: 0.7 }),
        M.frame]
    );
    mono.position.set(0, 4.35, -49.6);
    mono.castShadow = true;
    scene.add(mono);
    animated.push({ obj: mono, kind: 'float', amp: 0.1, speed: 0.5, baseY: 4.35, spin: 0 });

    // floating objects
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.22, 128, 18), M.gold);
    knot.position.set(5.4, 4.5, -44.6);
    knot.castShadow = true;
    scene.add(knot);
    animated.push({ obj: knot, kind: 'float', amp: 0.26, speed: 0.7, baseY: 4.5, spin: 0.35 });

    const glass = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), M.glass);
    glass.position.set(-7.4, 3.4, -46.6);
    scene.add(glass);
    animated.push({ obj: glass, kind: 'float', amp: 0.2, speed: 0.9, baseY: 3.4, spin: -0.25 });

    lantern(-9.0, -40.5, 1.05, 1.25);
    wireBush(8.2, -40.8, 1.05, 1.25);
    rock(8.6, -47.6, 1.3, 1.25);
    tree(-12.5, -50.5, 1.2, 1.25);
    glowSprite(0, 3.4, -45, 30, 0.16);
  }

  function contactPavilion() {
    platform(11, 0.7, 0.35, { x: 0, z: -64.5, deep: 0.8, seg: 14 });

    // approach stepping stones
    for (let k = 0; k < 2; k++) {
      const m = box(2.8, 0.22, 1.8, M.stoneWarm, 0, 0.9, -55.4 - k * 2.6);
      m.receiveShadow = true;
      scene.add(m);
    }

    const colGeo = new THREE.CylinderGeometry(0.16, 0.18, 5.5, 10);
    [[-3.7, -3.7], [3.7, -3.7], [-3.7, 3.7], [3.7, 3.7]].forEach(([cx, cz]) => {
      const c = new THREE.Mesh(colGeo, M.woodDark);
      c.position.set(cx, 1.05 + 2.75, -64.5 + cz);
      c.castShadow = true;
      scene.add(c);
      scene.add(box(0.5, 0.12, 0.5, M.stoneDark, cx, 1.05, -64.5 + cz));
      scene.add(box(0.5, 0.12, 0.5, M.stoneDark, cx, 6.55, -64.5 + cz));
    });
    const roof = box(10, 0.3, 10, M.woodDark, 0, 6.8, -64.5);
    roof.castShadow = true;
    scene.add(roof);
    scene.add(box(10.6, 0.1, 10.6, M.wood, 0, 6.98, -64.5));

    for (let i = 0; i < 3; i++) {
      const x = -2.7 + i * 2.7;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 4), M.frame);
      cord.position.set(x, 6.0, -65.1);
      scene.add(cord);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), M.lamp);
      bulb.position.set(x, 5.3, -65.1);
      scene.add(bulb);
      const sp = glowSprite(x, 5.3, -65.1, 3.2, 0.45);
      animated.push({ obj: sp.material, kind: 'flickerSoft' });
    }
    const pl = new THREE.PointLight(0xffb877, 12, 20, 2);
    pl.position.set(0, 4.6, -64.8);
    scene.add(pl);
    pointLights.push(pl);

    const card = canvasTex(1200, 780, (ctx, w, h) => {
      ctx.fillStyle = '#0a0f0d'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(217,160,106,0.65)'; ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.fillStyle = 'rgba(217,160,106,0.95)';
      ctx.font = '700 24px "Space Mono", monospace';
      ctx.fillText('04 / CONTACT', 64, 96);
      ctx.fillStyle = 'rgba(236,231,219,0.95)';
      ctx.font = '800 138px "Inter Tight", sans-serif';
      ctx.fillText("LET'S", 60, 236);
      ctx.fillText('MOVE', 60, 372);
      ctx.fillText('PEOPLE.', 60, 508);
      ctx.fillStyle = 'rgba(217,160,106,0.95)';
      ctx.font = '400 25px "Space Mono", monospace';
      ctx.fillText('HELLO@TOMA-SATO.STUDIO', 64, 592);
      ctx.fillStyle = 'rgba(236,231,219,0.5)';
      ctx.font = '400 21px "Space Mono", monospace';
      ctx.fillText('CLICK THIS SLAB TO OPEN THE CONTACT DRAWER', 64, 690);
    });
    const monolithMat = new THREE.MeshStandardMaterial({
      map: card, emissive: 0xffffff, emissiveMap: card, emissiveIntensity: 0.45, roughness: 0.75,
    });
    const monolith = new THREE.Mesh(new THREE.BoxGeometry(4.9, 3.15, 0.16), [
      M.frame, M.frame, M.frame, M.frame, monolithMat, M.frame,
    ]);
    monolith.position.set(0, 2.95, -63.6);
    monolith.castShadow = true;
    scene.add(monolith);
    animated.push({ obj: monolith, kind: 'float', amp: 0.07, speed: 0.45, baseY: 2.95, spin: 0 });
    const hit = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 0.8), M.hit);
    hit.userData.action = 'contact';
    hit.position.copy(monolith.position);
    scene.add(hit);
    pickables.push(hit);
    contactHit = hit;

    // backdrop screen wall with a warm slot
    for (let k = 0; k < 7; k++) {
      scene.add(box(2.0, 9.5, 0.7, M.stoneDark, -7.8 + k * 2.6, 4.8, -73));
    }
    const slot = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 6.0),
      new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc08a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    slot.position.set(0, 4.8, -72.5);
    scene.add(slot);

    // side steles
    for (const side of [-1, 1]) {
      const st = box(0.9, 5.4, 0.5, M.stoneDark, side * 8.4, 3.4, -66.5);
      scene.add(st);
    }

    lantern(-7.2, -57.5, 1.1, 0.1);
    lantern(7.2, -57.5, 1.1, 0.1);
    glowSprite(0, 2.8, -63.6, 26, 0.22);

    const boulder = rock(10.5, -60.5, 1.5, 0);
    boulder.scale.y *= 0.7;
    tree(-13.5, -68, 1.3, 0);
    tree(13.8, -70, 1.15, 0);
  }

  function distantWorld() {
    const spots = [
      [-52, -18, 1.4], [46, -34, 1.2], [-38, -66, 1.3], [58, -70, 1.0],
      [-70, 20, 1.2], [64, 26, 1.4], [-34, 54, 1.0], [40, 60, 1.2],
    ];
    spots.forEach(([x, z, s]) => {
      const y = -0.6;
      platform(4.5 * s, 0.8, y, { x, z, seg: 9, deep: 0.6 });
      tree(x + rnd(-1.2, 1.2), z + rnd(-1.2, 1.2), s * 0.85, y + 0.8, { big: Math.random() > 0.6 });
      rock(x + rnd(-2, 2), z + rnd(-2, 2), rnd(0.7, 1.4) * s, y + 0.8);
    });
    // low mist band over the water
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.PlaneGeometry(rnd(30, 70), rnd(8, 18));
      const mat = new THREE.MeshBasicMaterial({
        map: mistTex, transparent: true, opacity: rnd(0.07, 0.16),
        depthWrite: false, color: 0xd8cdb8, blending: THREE.NormalBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(rnd(-80, 80), rnd(1.5, 7), rnd(-95, 50));
      m.userData.baseOp = mat.opacity;
      scene.add(m);
      billboards.push(m);
    }
  }

  function particlesBuild() {
    const N = 760;
    const pos = new Float32Array(N * 3);
    particleData = [];
    for (let i = 0; i < N; i++) {
      const x = rnd(-55, 55), y = rnd(0.4, 22), z = rnd(-80, 55);
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      particleData.push({ sp: rnd(0.05, 0.28), ph: rnd(0, 6.28), amp: rnd(0.2, 1.2) });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd9b4, size: 0.075, sizeAttenuation: true,
      transparent: true, opacity: 0.55, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  /* ---------------- garden zone ---------------- */
  function garden() {
    // approach path
    for (let i = 0; i < 11; i++) {
      const z = 48 - i * 4.2;
      const w = 2.6 + (i % 2) * 0.3;
      const m = box(w, 0.26, 3.4, i % 3 === 0 ? M.stoneWarm : M.stone, rnd(-0.18, 0.18), 0.13, z);
      m.rotation.y = rnd(-0.02, 0.02);
      m.receiveShadow = true;
      scene.add(m);
    }
    torii(0, 24);

    // moss islands flanking the gate
    platform(6.2, 0.7, -0.3, { x: -12.5, z: 22, seg: 10, deep: 0.5 });
    tree(-13.4, 21, 1.5, 0.4, { big: true });
    rock(-10.2, 24.4, 1.1, 0.4);
    mossMound(-9.6, 19.4, 1.6, 0.4);
    wireBush(-9.9, 22.6, 0.75, 0.4);

    platform(5.4, 0.7, -0.2, { x: 13.2, z: 30, seg: 10, deep: 0.5 });
    tree(13.8, 31, 1.15, 0.5);
    rock(11.2, 28.6, 1.0, 0.5);

    // zen sand garden on a floating disc
    platform(7.4, 0.9, 0.85, { x: 15.5, z: 6.5, seg: 22, sand: true, deep: 0.5 });
        rock(14.2, 5.2, 1.1, 1.75);
    rock(16.9, 7.6, 0.9, 1.75);
    rock(15.9, 3.9, 0.7, 1.75);
    mossMound(13.4, 8.2, 0.9, 1.75);

    // lily pads / floating stones near the path
    for (let i = 0; i < 14; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.35, 0.8), 12), new THREE.MeshStandardMaterial({
        color: 0x3c4a2c, roughness: 1, side: THREE.DoubleSide,
      }));
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = rnd(0, 3);
      pad.position.set(rnd(-24, 24), 0.03, rnd(-70, 46));
      scene.add(pad);
    }

    lantern(-6.2, 32, 1.2, 0);
    lantern(6.2, 17.5, 1.2, 0);
    lantern(-6.6, 11, 1.05, 0);
    bamboo(-9.2, 12, 14, 1, 0);
    bamboo(10.4, 14, 10, 0.85, 0);

    // floating sculptures
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.16, 96, 14), M.gold);
    knot.position.set(-4.2, 5.2, 14);
    knot.castShadow = true;
    scene.add(knot);
    animated.push({ obj: knot, kind: 'float', amp: 0.28, speed: 0.8, baseY: 5.2, spin: 0.4 });

    const cubes = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(boxGeo, i === 1 ? M.gold : M.stoneWarm);
      c.scale.setScalar(0.9 - i * 0.18);
      c.position.set(i * 0.55, i * 0.78, 0);
      c.castShadow = true;
      cubes.add(c);
    }
    cubes.position.set(8.6, 6.4, 22);
    scene.add(cubes);
    animated.push({ obj: cubes, kind: 'float', amp: 0.3, speed: 0.6, baseY: 6.4, spin: 0.22 });

    const glass = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), M.glass);
    glass.position.set(-11.5, 3.6, 2.5);
    scene.add(glass);
    animated.push({ obj: glass, kind: 'float', amp: 0.22, speed: 0.7, baseY: 3.6, spin: 0.18 });

    // warm pools of light on the water near the gate
    glowSprite(0, 1.2, 20, 20, 0.22);
    glowSprite(-12.5, 1.2, 22, 16, 0.14);
    glowSprite(15.5, 2.2, 6.5, 18, 0.14);
  }

  /* ---------------- init / build ---------------- */
  function init(canvas) {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, powerPreference: 'high-performance', alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(C.fog);
    scene.fog = new THREE.FogExp2(C.fog, 0.0115);

    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 700);
    camera.position.set(0, 2.3, 41);
    camera.lookAt(0, 4, 10);

    clock = new THREE.Clock();
    buildMaterials();
    buildSky();
    buildSun();
    buildWater();
    buildLights();
    garden();
    stoneHall();
    studio();
    contactPavilion();
    distantWorld();
    particlesBuild();

    renderer.shadowMap.needsUpdate = true;
    window.addEventListener('resize', onResize);
    return { scene, camera, renderer };
  }

  function buildLights() {
    sunLight = new THREE.DirectionalLight(C.sunCol, 2.75);
    sunLight.position.copy(SUN_DIR).multiplyScalar(130);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1536, 1536);
    sunLight.shadow.camera.left = -70;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 70;
    sunLight.shadow.camera.bottom = -70;
    sunLight.shadow.camera.near = 20;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.035;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLight.target.position.set(0, 0, -20);

    fillLight = new THREE.DirectionalLight(0x9fc0cc, 0.95);
    fillLight.position.set(40, 26, 70);
    scene.add(fillLight);

    const hemi = new THREE.HemisphereLight(0x50646e, 0x6a5c46, 0.75);
    scene.add(hemi);

    // soft sky fill straight down: keeps stone surfaces from going black
    const skyFill = new THREE.DirectionalLight(0x86a6b4, 0.55);
    skyFill.position.set(0, 60, 10);
    scene.add(skyFill);

    const amb = new THREE.AmbientLight(0x2a3a40, 0.5);
    scene.add(amb);
  }

  function addWork(i) {
    workFrame(WORKS[i], i);
  }

  function setWorkImage(i, tex) {
    if (WORKS[i]._imgMat) {
      WORKS[i]._imgMat.map = tex;
      WORKS[i]._imgMat.emissiveMap = tex;
      WORKS[i]._imgMat.needsUpdate = true;
    }
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ---------------- animation ---------------- */
  function update(dt, t) {
    if (waterMat) waterMat.uniforms.uTime.value = t;

    for (const a of animated) {
      const o = a.obj;
      if (a.kind === 'float' || a.kind === 'floatFrame') {
        o.position.y = a.baseY + Math.sin(t * (a.speed || 0.6) + (o.userData.seed || 0)) * a.amp;
        if (a.spin) o.rotation.y += a.spin * dt;
      } else if (a.kind === 'sway') {
        o.rotation.z = Math.sin(t * 0.35 * (a.amp ? 0.5 : 1)) * (a.amp || 0.012);
      } else if (a.kind === 'flicker') {
        o.emissiveIntensity = 0.85 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 2.1) * 0.05;
      } else if (a.kind === 'flickerSoft') {
        o.opacity = 0.44 + Math.sin(t * 1.7) * 0.06;
      }
    }

    // frames: subtle tilt toward the visitor
    for (let i = 0; i < frames.length; i++) {
      const g = frames[i];
      g.rotation.z = Math.sin(t * 0.4 + i) * 0.008;
    }

    // mist billboards face the camera
    for (const m of billboards) {
      m.lookAt(camera.position.x, m.position.y, camera.position.z);
    }

    // drifting motes
    if (particles) {
      const pos = particles.geometry.attributes.position;
      for (let i = 0; i < particleData.length; i++) {
        const d = particleData[i];
        let y = pos.getY(i) + d.sp * dt;
        if (y > 24) y = 0.3;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + d.ph) * d.amp * dt * 0.4);
      }
      pos.needsUpdate = true;
    }
  }

  /* ---------------- focus / picking ---------------- */
  function focusFor(i) {
    const w = WORKS[i];
    const f = w.frame;
    const n = new THREE.Vector3(Math.sin(f.ry), 0, Math.cos(f.ry));
    const right = new THREE.Vector3(Math.cos(f.ry), 0, -Math.sin(f.ry));
    const center = new THREE.Vector3(f.x, f.y, f.z);
    const pos = center.clone()
      .add(n.clone().multiplyScalar(Math.max(4.4, f.w * 1.35 + 1.6)))
      .add(right.clone().multiplyScalar(1.9))
      .add(new THREE.Vector3(0, -0.35, 0));
    return { pos, look: center.clone() };
  }

  function contactFocus() {
    return {
      pos: new THREE.Vector3(0, 2.4, -55.6),
      look: new THREE.Vector3(0, 2.9, -63.2),
    };
  }

  function studioFocus() {
    return {
      pos: new THREE.Vector3(0, 2.6, -36.4),
      look: new THREE.Vector3(0, 3.6, -46),
    };
  }

  function setHover(index) {
    for (let i = 0; i < WORKS.length; i++) {
      const m = WORKS[i]._imgMat;
      if (!m) continue;
      m.emissiveIntensity = i === index ? 0.62 : 0.3;
    }
  }

  function pick(ndc, cam) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, cam);
    const hits = ray.intersectObjects(pickables, false);
    if (!hits.length) return null;
    const o = hits[0].object;
    return o.userData.workIndex !== undefined
      ? { type: 'work', index: o.userData.workIndex }
      : { type: o.userData.action || 'none' };
  }

  return {
    init, update, addWork, setWorkImage, focusFor, contactFocus, studioFocus, pick, setHover,
    get camera() { return camera; },
    get renderer() { return renderer; },
    get scene() { return scene; },
    get frames() { return frames; },
    get contactHit() { return contactHit; },
    SUN_DIR,
  };
})();
