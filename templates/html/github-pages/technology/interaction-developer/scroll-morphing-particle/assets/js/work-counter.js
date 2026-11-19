/* Work counter — the selected-work number, built out of glyph particles in Three.js.
   Each scroll step morphs every glyph along a bezier path into the next number. */
(function () {
  "use strict";

  var host = document.querySelector("[data-workcounter]");
  if (!host || !window.THREE) return;

  var W = 288, H = 231;
  var CHARS = "0123456789#+=-:.*/%";
  var AW = 5, AH = 4, CELL = 128;
  var MAX = 460;
  var COUNT = 4;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- glyph atlas ---------------------------------------------------- */
  function makeAtlas() {
    var c = document.createElement("canvas");
    c.width = AW * CELL;
    c.height = AH * CELL;
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 92px " + '"JetBrains Mono", ui-monospace, monospace';
    for (var i = 0; i < CHARS.length; i++) {
      var col = i % AW, row = (i / AW) | 0;
      ctx.fillText(CHARS[i], col * CELL + CELL / 2, row * CELL + CELL / 2 + 4);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  /* ---- sample a number into glyph cells ------------------------------- */
  var sampler = document.createElement("canvas");
  sampler.width = W;
  sampler.height = H;
  var sctx = sampler.getContext("2d");

  function sample(text) {
    sctx.clearRect(0, 0, W, H);
    sctx.fillStyle = "#fff";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.font = '400 196px "SV Serif", Georgia, serif';
    sctx.fillText(text, W / 2, H / 2 + 6);
    var data = sctx.getImageData(0, 0, W, H).data;
    var step = 12;
    var cells = [];
    for (var y = 0; y < H; y += step) {
      for (var x = 0; x < W; x += step) {
        var a = data[((y + 4) * W + (x + 4)) * 4 + 3];
        if (a > 110) {
          cells.push({
            x: x + step / 2 - W / 2 + (Math.random() - 0.5) * step * 0.55,
            y: y + step / 2 - H / 2 + (Math.random() - 0.5) * step * 0.55,
            ch: (Math.random() * CHARS.length) | 0,
            alpha: 0.55 + (a / 255) * 0.45
          });
        }
      }
    }
    return cells;
  }

  var targets = [];
  for (var i = 0; i < COUNT; i++) {
    targets.push({ big: sample("0" + (i + 1)) });
  }

  /* ---- three.js scene -------------------------------------------------- */
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -10, 10);
  camera.position.z = 1;

  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(MAX * 3);
  var from = new Float32Array(MAX * 3);
  var to = new Float32Array(MAX * 3);
  var ctrl = new Float32Array(MAX * 3);
  var seed = new Float32Array(MAX);
  var charIdx = new Float32Array(MAX);
  var alpha = new Float32Array(MAX);
  var size = new Float32Array(MAX);

  for (var p = 0; p < MAX; p++) {
    seed[p] = Math.random();
    size[p] = 10 + Math.random() * 3;
    alpha[p] = 0;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aFrom", new THREE.BufferAttribute(from, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(to, 3));
  geo.setAttribute("aCtrl", new THREE.BufferAttribute(ctrl, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.setAttribute("aChar", new THREE.BufferAttribute(charIdx, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  var accent = new THREE.Color("#ff5c2e");

  var mat = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: makeAtlas() },
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uScale: { value: Math.min(2, window.devicePixelRatio || 1) },
      uColor: { value: accent },
      uInk: { value: new THREE.Color("#ffe0d5") }
    },
    vertexShader: [
      "attribute vec3 aFrom;",
      "attribute vec3 aTo;",
      "attribute vec3 aCtrl;",
      "attribute float aSeed;",
      "attribute float aChar;",
      "attribute float aAlpha;",
      "attribute float aSize;",
      "uniform float uProgress;",
      "uniform float uTime;",
      "uniform float uScale;",
      "varying float vChar;",
      "varying float vAlpha;",
      "varying float vSeed;",
      "float ease(float t){return t<0.5?4.0*t*t*t:1.0-pow(-2.0*t+2.0,3.0)/2.0;}",
      "void main(){",
      "  float d = aSeed*0.34;",
      "  float t = clamp((uProgress - d)/(1.0-0.34),0.0,1.0);",
      "  float e = ease(t);",
      "  float m = 1.0-e;",
      "  vec3 pos = m*m*aFrom + 2.0*m*e*aCtrl + e*e*aTo;",
      "  pos.x += sin(uTime*0.7 + aSeed*31.4)*1.6*(1.0-e*0.8);",
      "  pos.y += cos(uTime*0.9 + aSeed*17.2)*1.6*(1.0-e*0.8);",
      "  vChar = aChar;",
      "  vAlpha = aAlpha * smoothstep(0.0,0.25,t) * mix(0.35,1.0,e);",
      "  vSeed = aSeed;",
      "  gl_Position = projectionMatrix*modelViewMatrix*vec4(pos,1.0);",
      "  gl_PointSize = aSize*uScale*(0.75+0.35*e);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uAtlas;",
      "uniform vec3 uColor;",
      "uniform vec3 uInk;",
      "varying float vChar;",
      "varying float vAlpha;",
      "varying float vSeed;",
      "void main(){",
      "  float col = mod(vChar, 5.0);",
      "  float row = floor(vChar/5.0);",
      "  vec2 uv = vec2((col + gl_PointCoord.x)/5.0, 1.0 - (row + gl_PointCoord.y)/4.0);",
      "  vec4 tex = texture2D(uAtlas, uv);",
      "  if(tex.a < 0.06) discard;",
      "  vec3 c = mix(uColor, uInk, smoothstep(0.55,1.0,vSeed)*0.35);",
      "  gl_FragColor = vec4(c, tex.a*vAlpha);",
      "}"
    ].join("\n"),
    transparent: true,
    depthWrite: false
  });

  var points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  /* ---- state ----------------------------------------------------------- */
  var current = -1;
  var booted = false;
  var animating = false;
  var scrambleTimer = 0;

  function layout() {
    var r = host.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + "px";
    renderer.domElement.style.height = h + "px";
    mat.uniforms.uScale.value = Math.min(2, window.devicePixelRatio || 1) * (w / W);
    camera.left = -W / 2; camera.right = W / 2;
    camera.top = H / 2; camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
  }

  function seedFrom(index) {
    // start from the previous target's slots where possible, else scattered
    var prev = index <= 0 ? null : targets[index - 1].big;
    var target = targets[index].big;
    var posArr = geo.attributes.position.array;
    var chArr = geo.attributes.aChar.array;
    var alArr = geo.attributes.aAlpha.array;
    var fromArr = geo.attributes.aFrom.array;
    var toArr = geo.attributes.aTo.array;
    var cArr = geo.attributes.aCtrl.array;

    var pool = Math.max(target.length, 1);
    for (var i = 0; i < MAX; i++) {
      var cell = target[i % pool];
      var fp = prev ? prev[i % prev.length] : { x: (Math.random() - 0.5) * W * 1.4, y: (Math.random() - 0.5) * H * 1.6 };
      var j = i * 3;
      var fx = booted ? posArr[j] : fp.x;
      var fy = booted ? posArr[j + 1] : fp.y;
      var tx = cell.x, ty = cell.y;
      fromArr[j] = fx; fromArr[j + 1] = fy; fromArr[j + 2] = 0;
      toArr[j] = tx; toArr[j + 1] = ty; toArr[j + 2] = 0;
      cArr[j] = (fx + tx) / 2 + (Math.random() - 0.5) * 90;
      cArr[j + 1] = (fy + ty) / 2 + (Math.random() - 0.5) * 70;
      cArr[j + 2] = 0;
      posArr[j] = fx; posArr[j + 1] = fy;
      chArr[i] = cell.ch;
      alArr[i] = cell.alpha * (i < target.length ? 1 : 0.15);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aFrom.needsUpdate = true;
    geo.attributes.aTo.needsUpdate = true;
    geo.attributes.aCtrl.needsUpdate = true;
    geo.attributes.aChar.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }

  function settle() {
    // the morph ended: the targets become the new resting positions
    var posArr = geo.attributes.position.array;
    var toArr = geo.attributes.aTo.array;
    var chArr = geo.attributes.aChar.array;
    var target = targets[current] ? targets[current].big : [];
    for (var i = 0; i < MAX; i++) {
      var j = i * 3;
      posArr[j] = toArr[j];
      posArr[j + 1] = toArr[j + 1];
      if (target.length) chArr[i] = target[i % target.length].ch;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aChar.needsUpdate = true;
  }

  function go(index) {
    index = Math.max(0, Math.min(COUNT - 1, index));
    if (index === current) return;
    var first = !booted;
    current = index;
    booted = true;
    seedFrom(index);
    mat.uniforms.uProgress.value = first ? 0 : 0;
    if (reduced) {
      mat.uniforms.uProgress.value = 1;
      settle();
      return;
    }
    animating = true;
    if (window.gsap) {
      gsap.killTweensOf(mat.uniforms.uProgress);
      gsap.to(mat.uniforms.uProgress, {
        value: 1,
        duration: first ? 2.1 : 1.15,
        ease: "power2.inOut",
        onComplete: function () { animating = false; settle(); }
      });
    } else {
      mat.uniforms.uProgress.value = 1;
      animating = false;
      settle();
    }
  }

  /* scramble chars while morphing */
  function scramble() {
    if (!animating) return;
    var chArr = geo.attributes.aChar.array;
    var n = Math.max(3, (MAX * 0.06) | 0);
    for (var i = 0; i < n; i++) {
      chArr[(Math.random() * MAX) | 0] = (Math.random() * CHARS.length) | 0;
    }
    geo.attributes.aChar.needsUpdate = true;
  }
  setInterval(scramble, 70);

  /* ---- scroll driver ---------------------------------------------------- */
  function initScroll() {
    var desk = document.querySelector(".sw__desk");
    if (!desk || !window.ScrollTrigger) { go(0); return; }
    gsap.registerPlugin(ScrollTrigger);
    var last = 0;
    ScrollTrigger.create({
      trigger: desk,
      start: "top top",
      end: "bottom bottom",
      onUpdate: function (self) {
        var idx = Math.min(COUNT - 1, Math.floor(self.progress * COUNT + 0.08));
        if (idx !== last) {
          last = idx;
          go(idx);
          document.dispatchEvent(new CustomEvent("workchange", { detail: { index: idx } }));
        }
      }
    });
    window.addEventListener("resize", function () { ScrollTrigger.refresh(); });
  }

  var ticking = false;
  function loop(t) {
    requestAnimationFrame(loop);
    mat.uniforms.uTime.value = t * 0.001;
    renderer.render(scene, camera);
  }

  function boot() {
    layout();
    go(0);
    initScroll();
    requestAnimationFrame(loop);
    window.addEventListener("resize", layout);
    document.dispatchEvent(new CustomEvent("workchange", { detail: { index: 0 } }));
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
  else boot();

  window.WorkNumber = { go: go, count: COUNT };
})();
