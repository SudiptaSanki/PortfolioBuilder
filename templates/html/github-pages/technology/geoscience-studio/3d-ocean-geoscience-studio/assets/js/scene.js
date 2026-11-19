/* 3D Ocean & Geoscience Studio — the surface-to-seabed scene.
   A sunset ocean, a working vessel on the horizon, and a dive into deep water.
   Built with Three.js; the page copy scrolls over it. */
(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  if (!canvas || !window.THREE) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x8fb4c8, 0.00055);
  var camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 6000);
  camera.position.set(0, 9, 60);
  camera.lookAt(0, 8, -300);

  var SUN = new THREE.Vector3(-0.42, 0.13, -1).normalize();

  /* ------------------------------------------------------------- sky dome */
  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color("#1d4f7a") },
      uHorizon: { value: new THREE.Color("#f7b184") },
      uSunColor: { value: new THREE.Color("#ffd9a8") },
      uDeep: { value: new THREE.Color("#04101f") },
      uSunDir: { value: SUN },
      uUnder: { value: 0 },
      uTime: { value: 0 }
    },
    vertexShader: [
      "varying vec3 vDir;",
      "void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }"
    ].join("\n"),
    fragmentShader: [
      "varying vec3 vDir;",
      "uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunColor; uniform vec3 uDeep; uniform vec3 uSunDir;",
      "uniform float uUnder; uniform float uTime;",
      "float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }",
      "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
      " float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));",
      " return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }",
      "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }",
      "void main(){",
      "  vec3 d = normalize(vDir);",
      "  float h = d.y;",
      "  vec3 sky = mix(uHorizon, uTop, smoothstep(-0.03, 0.6, h));",
      "  float sun = max(dot(d, normalize(uSunDir)), 0.0);",
      "  sky += uSunColor * pow(sun, 1400.0) * 4.0;",
      "  sky += uSunColor * pow(sun, 14.0) * 0.30;",
      "  float cl = fbm(vec2(d.x/(h+0.32), d.z/(h+0.32)) * 1.7 + vec2(uTime*0.004, 0.0));",
      "  cl = smoothstep(0.54, 0.92, cl) * smoothstep(0.015, 0.42, h);",
      "  sky = mix(sky, vec3(1.0, 0.88, 0.83), cl * 0.42);",
      "  vec3 water = mix(vec3(0.09,0.19,0.27), uDeep, smoothstep(0.0, -0.22, h));",
      "  vec3 col = h > 0.0 ? sky : water;",
      "  col = mix(col, uDeep * 1.15, uUnder);",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n")
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 40, 24), skyMat);
  scene.add(sky);

  /* ---------------------------------------------------------------- water */
  var waterUniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color("#071c2e") },
    uShallow: { value: new THREE.Color("#1d4a63") },
    uSun: { value: new THREE.Color("#ffcf9e") },
    uSunDir: { value: SUN },
    uCam: { value: camera.position },
    uHorizon: { value: new THREE.Color("#f0b394") },
    uUnder: { value: 0 }
  };

  var waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    vertexShader: [
      "uniform float uTime;",
      "varying vec3 vWorld; varying vec3 vN; varying float vH;",
      "float heightAt(vec2 p, float t){",
      "  float h = 0.0;",
      "  h += sin(p.x*0.035 + t*0.55) * 1.55;",
      "  h += sin(p.y*0.052 - t*0.42) * 1.15;",
      "  h += sin((p.x+p.y)*0.021 + t*0.31) * 2.10;",
      "  h += sin((p.x*0.7-p.y*0.3)*0.09 + t*0.9) * 0.65;",
      "  h += sin((p.x*1.6+p.y*0.9)*0.16 - t*1.35) * 0.28;",
      "  return h;",
      "}",
      "void main(){",
      "  vec4 wp = modelMatrix * vec4(position, 1.0);",
      "  float h = heightAt(wp.xz, uTime);",
      "  wp.y += h;",
      "  float e = 2.5;",
      "  float hx = heightAt(wp.xz + vec2(e,0.0), uTime);",
      "  float hz = heightAt(wp.xz + vec2(0.0,e), uTime);",
      "  vN = normalize(vec3(h-hx, e, h-hz));",
      "  vWorld = wp.xyz;",
      "  vH = h;",
      "  gl_Position = projectionMatrix * viewMatrix * wp;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSun; uniform vec3 uSunDir; uniform vec3 uCam; uniform vec3 uHorizon; uniform float uUnder;",
      "varying vec3 vWorld; varying vec3 vN; varying float vH;",
      "void main(){",
      "  vec3 N = normalize(vN);",
      "  vec3 V = normalize(uCam - vWorld);",
      "  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);",
      "  vec3 base = mix(uDeep, uShallow, clamp(fres*0.9 + vH*0.03, 0.0, 1.0));",
      "  vec3 R = reflect(-normalize(uSunDir), N);",
      "  float spec = pow(max(dot(R, V), 0.0), 320.0) * 2.4;",
      "  float glit = pow(max(dot(R, V), 0.0), 24.0) * 0.10;",
      "  vec3 col = base + uSun * (spec + glit);",
      "  float dist = length(uCam - vWorld);",
      "  col = mix(col, uHorizon, smoothstep(240.0, 1500.0, dist) * 0.9);",
      "  float a = 1.0 - uUnder;",
      "  if (uUnder > 0.98) discard;",
      "  gl_FragColor = vec4(col, a * 0.98);",
      "}"
    ].join("\n")
  });

  var water = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600, 128, 128), waterMat);
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  /* ----------------------------------------------------------------- ship */
  var ship = new THREE.Group();
  var darkRed = new THREE.MeshStandardMaterial({ color: 0x8f2f24, roughness: 0.62, metalness: 0.18 });
  var white = new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.55, metalness: 0.1 });
  var grey = new THREE.MeshStandardMaterial({ color: 0x8d949c, roughness: 0.6, metalness: 0.3 });
  var yellow = new THREE.MeshStandardMaterial({ color: 0xd9a33a, roughness: 0.5, metalness: 0.35 });
  var glassMat = new THREE.MeshStandardMaterial({ color: 0x1b2a33, roughness: 0.25, metalness: 0.5, emissive: 0x223a44, emissiveIntensity: 0.5 });
  var box = function (w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    ship.add(m);
    return m;
  };

  box(34, 5.2, 10, darkRed, 0, 1.2, 0);                 // hull
  var bow = new THREE.Mesh(new THREE.ConeGeometry(5.6, 7, 4), darkRed);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(19.6, 1.4, 0);
  bow.scale.set(1, 1, 1.9);
  ship.add(bow);
  box(26, 0.7, 10.4, grey, -2, 4.1, 0);                 // deck
  box(7.5, 7.2, 8.6, white, 8.5, 8.2, 0);               // superstructure
  box(7.9, 1.5, 8.9, glassMat, 8.5, 10.6, 0);           // bridge glass
  box(3.4, 3.2, 5.4, white, 8.4, 13.6, 0);              // wheelhouse
  box(0.6, 11, 0.6, grey, 8.2, 14.5, 3.4);              // mast
  box(0.35, 7, 0.35, grey, 8.2, 17.2, -3.2);
  // derrick
  box(0.7, 15, 0.7, yellow, -1.2, 12, 2.6);
  box(0.7, 15, 0.7, yellow, -1.2, 12, -2.6);
  box(0.7, 15, 0.7, yellow, 2.0, 12, 2.6);
  box(0.7, 15, 0.7, yellow, 2.0, 12, -2.6);
  box(3.9, 0.5, 0.5, yellow, 0.4, 18.2, 2.6);
  box(3.9, 0.5, 0.5, yellow, 0.4, 18.2, -2.6);
  box(0.5, 0.5, 5.4, yellow, 0.4, 18.2, 0);
  box(3.4, 1.0, 3.0, grey, 0.4, 19.0, 0);
  // crane / A-frame at the stern
  var leg1 = box(0.6, 11, 0.6, white, -14.4, 9.0, 2.4); leg1.rotation.x = 0.45;
  var leg2 = box(0.6, 11, 0.6, white, -14.4, 9.0, -2.4); leg2.rotation.x = -0.45;
  box(0.8, 0.8, 5.6, grey, -17.4, 13.6, 0);
  // containers
  box(5.6, 2.7, 2.4, new THREE.MeshStandardMaterial({ color: 0x9d4a3c, roughness: 0.7 }), -6.5, 5.7, 2.4);
  box(5.6, 2.7, 2.4, new THREE.MeshStandardMaterial({ color: 0xb8b2a4, roughness: 0.7 }), -6.5, 5.7, -1.0);
  box(5.6, 2.7, 2.4, yellow, -6.5, 8.4, 0.7);
  box(9, 0.6, 9, darkRed, 13.5, 4.5, 0);               // bow deck

  ship.position.set(46, 0.5, -300);
  ship.rotation.y = -0.28;
  ship.scale.setScalar(1.55);
  scene.add(ship);

  /* lights */
  var sunLight = new THREE.DirectionalLight(0xffc39a, 2.4);
  sunLight.position.copy(SUN).multiplyScalar(500);
  scene.add(sunLight);
  var skyLight = new THREE.HemisphereLight(0x9fc6e8, 0x0a1a26, 0.85);
  scene.add(skyLight);
  var rim = new THREE.PointLight(0xff8a5c, 1.2, 900);
  rim.position.set(-300, 60, -500);
  scene.add(rim);

  /* ---------------------------------------------------------------- birds */
  function birdTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var x = c.getContext("2d");
    x.strokeStyle = "#12222e";
    x.lineWidth = 4;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(8, 40); x.quadraticCurveTo(22, 22, 32, 36);
    x.quadraticCurveTo(42, 22, 56, 40);
    x.stroke();
    return new THREE.CanvasTexture(c);
  }
  var birds = [];
  var birdTex = birdTexture();
  for (var b = 0; b < 14; b++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: birdTex, transparent: true, opacity: 0.9, depthWrite: false }));
    sp.position.set(-160 + Math.random() * 320, 26 + Math.random() * 42, -420 + Math.random() * 260);
    sp.scale.setScalar(7 + Math.random() * 6);
    sp.userData = { ph: Math.random() * 6.28, sp: 0.06 + Math.random() * 0.1, r: 40 + Math.random() * 90 };
    scene.add(sp);
    birds.push(sp);
  }

  /* -------------------------------------------------------------- bubbles */
  function glowTexture(inner, outer) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, outer);
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var bubbleTex = glowTexture("rgba(255,255,255,.95)", "rgba(170,225,255,.35)");
  var BUB = 900;
  var bGeo = new THREE.BufferGeometry();
  var bPos = new Float32Array(BUB * 3);
  var bSpd = new Float32Array(BUB);
  for (var i = 0; i < BUB; i++) {
    bPos[i * 3] = (Math.random() - 0.5) * 260;
    bPos[i * 3 + 1] = Math.random() * 220 - 120;
    bPos[i * 3 + 2] = (Math.random() - 0.5) * 260;
    bSpd[i] = 0.12 + Math.random() * 0.5;
  }
  bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  var bMat = new THREE.PointsMaterial({ size: 2.4, map: bubbleTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  var bubbles = new THREE.Points(bGeo, bMat);
  scene.add(bubbles);

  /* -------------------------------------------------------------- jellies */
  var jellyTex = glowTexture("rgba(190,240,255,.95)", "rgba(70,160,255,.4)");
  var jellies = [];
  for (var j = 0; j < 16; j++) {
    var js = new THREE.Sprite(new THREE.SpriteMaterial({ map: jellyTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    js.position.set((Math.random() - 0.5) * 520, -150 + Math.random() * 150, -Math.random() * 700 - 60);
    js.scale.setScalar(10 + Math.random() * 16);
    js.userData = { ph: Math.random() * 6.28, sp: 0.15 + Math.random() * 0.3 };
    scene.add(js);
    jellies.push(js);
  }

  /* ------------------------------------------------------------ light rays */
  var rayTex = (function () {
    var c = document.createElement("canvas");
    c.width = 64; c.height = 512;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "rgba(190,235,255,.55)");
    g.addColorStop(0.5, "rgba(150,210,255,.16)");
    g.addColorStop(1, "rgba(120,180,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 512);
    return new THREE.CanvasTexture(c);
  })();
  var rays = [];
  for (var r = 0; r < 6; r++) {
    var rm = new THREE.Mesh(new THREE.PlaneGeometry(60 + r * 26, 700), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    rm.position.set(-200 + r * 80, 120, -240 - r * 40);
    rm.rotation.z = 0.14 - r * 0.05;
    scene.add(rm);
    rays.push(rm);
  }

  /* ---------------------------------------------------------------- scroll */
  var state = { y: 0, p: 0 };
  function smoothstep(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function readScroll() {
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    state.p = Math.max(0, Math.min(1, (window.scrollY || doc.scrollTop || 0) / max));
  }

  var clock = new THREE.Clock();
  var depthM = 0;

  function frame() {
    requestAnimationFrame(frame);
    var t = clock.getElapsedTime();
    readScroll();

    var p = state.p;
    var dive = smoothstep(0.03, 0.58, p);
    var low = dive * 96;

    camera.position.y = 9 - low;
    camera.position.z = 60 + p * 26;
    camera.position.x = Math.sin(t * 0.06) * 1.6 * (1 - dive);
    var lookY = 8 - low - dive * 14;
    camera.lookAt(0, lookY, -300);

    waterUniforms.uTime.value = t;
    waterUniforms.uUnder.value = Math.max(0, Math.min(1, (-camera.position.y - 1.5) / 14));
    skyMat.uniforms.uTime.value = t;
    skyMat.uniforms.uUnder.value = smoothstep(0.0, 1.0, Math.max(0, -low) / 40);

    scene.fog.density = 0.00055 + dive * 0.0042;
    scene.fog.color.setRGB(0.16 + 0.1 * dive, 0.35 - 0.16 * dive, 0.46 - 0.17 * dive);

    ship.visible = dive < 0.22;
    ship.position.z = -300;
    ship.position.y = 0.5 + Math.sin(t * 0.5) * 0.35;

    for (var i = 0; i < birds.length; i++) {
      var sp = birds[i];
      var u = sp.userData;
      sp.position.x += Math.cos(t * u.sp + u.ph) * 0.06;
      sp.position.y += Math.sin(t * u.sp * 2 + u.ph) * 0.025;
      sp.material.opacity = 0.9 * (1 - dive);
      sp.visible = dive < 0.4;
    }

    bubbles.position.copy(camera.position);
    var arr = bGeo.attributes.position.array;
    for (var k = 0; k < BUB; k++) {
      arr[k * 3 + 1] += bSpd[k] * 0.42;
      if (arr[k * 3 + 1] > 120) arr[k * 3 + 1] = -130;
    }
    bGeo.attributes.position.needsUpdate = true;
    bMat.opacity = dive < 0.15 ? 0 : Math.min(0.75, (dive - 0.15) * 1.4);

    for (var jj = 0; jj < jellies.length; jj++) {
      var jm = jellies[jj];
      var ju = jm.userData;
      jm.position.y += Math.sin(t * ju.sp + ju.ph) * 0.02;
      jm.position.x += Math.cos(t * ju.sp * 0.7 + ju.ph) * 0.02;
      jm.material.opacity = Math.max(0, dive - 0.45) * 0.75;
    }

    for (var ri = 0; ri < rays.length; ri++) {
      rays[ri].material.opacity = Math.max(0, dive - 0.2) * 0.34;
      rays[ri].rotation.z += 0.0002;
    }

    depthM = Math.round(p * 7000);
    window.__abyssalDepth = depthM;
    window.__abyssalDive = dive;

    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) clock.getDelta();
  });

  if (reduced) {
    // keep one still frame, no animation loop
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
  window.__abyssalReady = true;
})();
