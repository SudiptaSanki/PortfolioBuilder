/* ═════════════════════════════════════════════════════════════
   PARTICLE FIELD — WebGL2 / custom GLSL
   40k point nodes · mouse vortex + repulsion · chromatic glow
   trails · DOF (blur by depth) · scroll & audio reactive
   Exposes: window.FIELD = { setDepth(v), pulse(a), setAudio(v) }
   ═════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('gl');
  var gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, powerPreference: 'high-performance'
  });
  if (!gl) { document.body.classList.add('no-webgl'); return; }

  /* ---------- shader utils ---------- */
  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  function prog(vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(p)); return null;
    }
    return p;
  }

  /* ---------- particle simulation state ---------- */
  // Physics runs on the CPU for exact mouse coupling; rendering on the GPU.
  var COUNT = (function () {
    var m = Math.min((window.innerWidth * window.innerHeight) / 420, 42000);
    return Math.max(14000, Math.floor(m / 500) * 500);
  })();
  window.__FIELD_NODES = COUNT;

  var pos = new Float32Array(COUNT * 3);      // current position
  var vel = new Float32Array(COUNT * 3);      // velocity
  var seed = new Float32Array(COUNT);         // per-node random
  var size = new Float32Array(COUNT);
  var hue  = new Float32Array(COUNT);

  var i;
  for (i = 0; i < COUNT; i++) {
    // start as a loose galaxy disc around origin
    var r = Math.pow(Math.random(), 0.62) * 16 + 0.6;
    var a = Math.random() * Math.PI * 2;
    var y = (Math.random() - 0.5) * (2.4 + r * 0.16);
    pos[i * 3]     = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a) * r;
    vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0;
    seed[i] = Math.random();
    size[i] = 0.6 + Math.random() * Math.random() * 2.6;
    hue[i]  = Math.random();
  }

  /* ---------- render shaders ---------- */
  var VS = [
    '#version 300 es',
    'layout(location=0) in vec3 aPos;',
    'layout(location=1) in float aSize;',
    'layout(location=2) in float aHue;',
    'uniform mat4 uProj, uView;',
    'uniform float uFocus, uTime, uPixel;',
    'out float vDepth; out float vHue;',
    'void main(){',
    '  vec4 mv = uView * vec4(aPos, 1.0);',
    '  gl_Position = uProj * mv;',
    '  float d = -mv.z;',                       // distance from camera
    '  vDepth = clamp(abs(d - uFocus) / 26.0, 0.0, 1.0);',
    '  vHue = aHue;',
    '  gl_PointSize = aSize * uPixel * (14.0 / max(d, 0.6)) * (1.0 + 0.12 * sin(uTime * 1.7 + aHue * 31.4));',
    '}'
  ].join('\n');

  // fragment: soft round sprite + chromatic rim
  var FS = [
    '#version 300 es',
    'precision highp float;',
    'in float vDepth; in float vHue;',
    'uniform float uGlow;',
    'out vec4 outColor;',
    'vec3 A = vec3(0.486, 0.965, 0.824);',   // accent mint
    'vec3 B = vec3(0.561, 0.482, 1.0);',     // violet
    'void main(){',
    '  vec2 pc = gl_PointCoord * 2.0 - 1.0;',
    '  float r = length(pc);',
    '  if (r > 1.0) discard;',
    '  float core = smoothstep(1.0, 0.0, r);',
    '  core = pow(core, 1.8);',
    '  vec3 col = mix(A, B, vHue);',
    // chromatic fringe: shift red/blue outward
    '  float fringe = smoothstep(0.55, 1.0, r);',
    '  col.r += fringe * 0.35; col.b += fringe * 0.2;',
    '  float alpha = core * (1.0 - vDepth * 0.88);',
    '  outColor = vec4(col * (uGlow * (1.1 + 0.6 * core)), alpha);',
    '}'
  ].join('\n');

  var drawProg = prog(VS, FS);
  if (!drawProg) { document.body.classList.add('no-webgl'); return; }
  gl.useProgram(drawProg);

  var uProj  = gl.getUniformLocation(drawProg, 'uProj');
  var uView  = gl.getUniformLocation(drawProg, 'uView');
  var uFocus = gl.getUniformLocation(drawProg, 'uFocus');
  var uTime  = gl.getUniformLocation(drawProg, 'uTime');
  var uPixel = gl.getUniformLocation(drawProg, 'uPixel');
  var uGlow  = gl.getUniformLocation(drawProg, 'uGlow');

  // GPU buffers: corners are generated per point (billboard), base attrs static
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  var posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  var sizeBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

  var hueBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, hueBuf);
  gl.bufferData(gl.ARRAY_BUFFER, hue, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // draw each point as a billboarded quad via POINTS + gl_PointSize (webgl2 supports gl_PointSize)
  var DRAW_MODE = gl.POINTS;

  /* ---------- camera ---------- */
  var cam = { x: 0, y: 0, z: 26, tx: 0, ty: 0, tz: 26 };
  var camBaseZ = 26;
  var focus = 13, focusTarget = 13;

  function perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf;
    out[11] = -1; out[14] = 2 * far * near * nf;
    out[1]=out[2]=out[3]=out[4]=out[6]=out[7]=out[8]=out[9]=out[12]=out[13]=out[15]=0;
  }
  function lookAt(out, ex, ey, ez, c) {
    var zx = ex - c.x, zy = ey - c.y, zz = ez - c.z;
    var zl = Math.hypot(zx, zy, zz) || 1; zx/=zl; zy/=zl; zz/=zl;
    // world up (0,1,0)
    var xx = 1*zz - 0*zy, xy = 0*zx - 0*zz, xz = 0*zy - 1*zx;
    // up crossed wrongly; do standard: x = up × z
    xx = 0 * zz - 0 * zy; xy = 0 * zx - 1 * zz; xz = 1 * zy - 0 * zx;
    var xl = Math.hypot(xx, xy, xz) || 1; xx/=xl; xy/=xl; xz/=xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0;
    out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0;
    out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0;
    out[12]=-(xx*ex+xy*ey+xz*ez);
    out[13]=-(yx*ex+yy*ey+yz*ez);
    out[14]=-(zx*ex+zy*ey+zz*ez);
    out[15]=1;
  }
  var mProj = new Float32Array(16), mView = new Float32Array(16);

  /* ---------- pointer & physics ---------- */
  var mouse = { x: 0, y: 0, nx: 0, ny: 0, wx: 0, wy: 0, active: false };
  var scroll01 = 0;   // 0 top → 1 bottom of document
  var audioLevel = 0; // 0..1
  var glow = 1, glowTarget = 1;

  function onMove(e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse.wx = mouse.nx * (16 * Math.max(window.innerWidth / window.innerHeight, 0.6));
    mouse.wy = mouse.ny * 9.5;
    mouse.active = true;
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', function () { glowTarget = 2.1; }, { passive: true });
  window.addEventListener('pointerup',   function () { glowTarget = 1; }, { passive: true });

  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    scroll01 = h > 0 ? window.scrollY / h : 0;
    focusTarget = 13 - scroll01 * 6;          // DOF shift with scroll
    cam.tz = camBaseZ - scroll01 * 10;        // camera descends into field
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var touchVortex = { x: 0, y: 0, on: false };

  var last = performance.now(), time = 0, fpsSmooth = 60;
  var hudXY = document.getElementById('hudXY');
  var hudZ = document.getElementById('hudZ');
  var hudFps = document.getElementById('hudFps');
  var hudNodes = document.getElementById('hudNodes');
  var heroNodes = document.getElementById('heroNodes');
  var frame = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    perspective(mProj, 60 * Math.PI / 180, w / h, 0.1, 120);
  }
  window.addEventListener('resize', resize);
  resize();

  function step(now) {
    requestAnimationFrame(step);
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    time += dt;
    frame++;
    fpsSmooth += (1 / Math.max(dt, 1e-4) - fpsSmooth) * 0.04;

    // HUD (every 6 frames)
    if (frame % 6 === 0) {
      if (hudXY) hudXY.textContent = 'X ' + fmt(mouse.nx) + '\u00A0\u00A0Y ' + fmt(mouse.ny);
      if (hudZ) hudZ.textContent = 'Z ' + fmt(-(cam.z));
      if (hudFps) hudFps.textContent = fpsSmooth.toFixed(1) + ' FPS';
      if (hudNodes && frame % 60 === 0) hudNodes.textContent = String(COUNT).padStart(5, '0');
      if (heroNodes && frame % 60 === 30) heroNodes.textContent = COUNT + ' NODES';
    }

    // camera easing
    cam.z += (cam.tz - cam.z) * 0.045;
    cam.x += (mouse.nx * 2.6 - cam.x) * 0.05;
    cam.y += (mouse.ny * 1.6 - cam.y) * 0.05;
    focus += (focusTarget - focus) * 0.06;
    glow += (glowTarget - glow) * 0.08;
    glowTarget += (1 - glowTarget) * 0.02;    // decay click pulse

    var halfW = 16 * Math.max(window.innerWidth / window.innerHeight, 0.6);

    // physics
    var repelR = 6.2 + audioLevel * 4;
    for (var j = 0; j < COUNT; j++) {
      var j3 = j * 3;
      var px = pos[j3], py = pos[j3 + 1], pz = pos[j3 + 2];

      // ambient curl-ish drift
      var s = seed[j];
      var ax = Math.sin(time * 0.32 + s * 12.9 + py * 0.14) * 0.42;
      var ay = Math.cos(time * 0.27 + s * 7.1 + px * 0.11) * 0.34;
      var az = Math.sin(time * 0.24 + s * 9.7 - px * 0.09) * 0.42;

      // slow vortex swirl around Y axis
      var ang = 0.055 + audioLevel * 0.16;
      var ca = Math.cos(ang * dt * 8), sa = Math.sin(ang * dt * 8);
      var vx = vel[j3] * ca - vel[j3 + 2] * sa;
      var vz = vel[j3] * sa + vel[j3 + 2] * ca;
      vel[j3] = vx * 0.992 + ax * dt * 4;
      vel[j3 + 2] = vz * 0.992 + az * dt * 4;

      // mouse repulsion / vortex in world space
      if (mouse.active) {
        var dx = px - mouse.wx, dy = py - mouse.wy;
        var d2 = dx * dx + dy * dy + 1.2;
        if (d2 < repelR * repelR) {
          var d = Math.sqrt(d2);
          var f = (1 - d / repelR) * (11 + audioLevel * 22);
          vel[j3] += (dx / d) * f * dt;
          vel[j3 + 1] += (dy / d) * f * dt + f * 0.12 * dt;
          // tangential swirl → vortex feel
          vel[j3]     += (-dy / d) * f * 0.55 * dt;
          vel[j3 + 1] +=  (dx / d) * f * 0.55 * dt;
        }
      }

      vel[j3 + 1] = vel[j3 + 1] * 0.99 + ay * dt * 4;

      // gentle bounds (elastic box)
      var lim = 19;
      if (px > lim) vel[j3] -= (px - lim) * 1.4 * dt * 8;
      if (px < -lim) vel[j3] -= (px + lim) * 1.4 * dt * 8;
      if (pz > lim) vel[j3 + 2] -= (pz - lim) * 1.4 * dt * 8;
      if (pz < -lim) vel[j3 + 2] -= (pz + lim) * 1.4 * dt * 8;
      if (py > 11) vel[j3 + 1] -= (py - 11) * 1.6 * dt * 8;
      if (py < -11) vel[j3 + 1] -= (py + 11) * 1.6 * dt * 8;

      pos[j3]     = px + vel[j3] * dt * 3.2;
      pos[j3 + 1] = py + vel[j3 + 1] * dt * 3.2;
      pos[j3 + 2] = pz + vel[j3 + 2] * dt * 3.2;
    }

    // upload positions
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);

    // draw
    gl.clearColor(0.019, 0.023, 0.039, 1);  // #05060a
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);      // additive → glow
    gl.disable(gl.DEPTH_TEST);

    lookAt(mView, cam.x * 0.6, cam.y * 0.4, cam.z, { x: cam.x * 0.2, y: cam.y * 0.2, z: 0 });
    gl.useProgram(drawProg);
    gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(uProj, false, mProj);
    gl.uniformMatrix4fv(uView, false, mView);
    gl.uniform1f(uFocus, focus);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uPixel, Math.min(window.devicePixelRatio || 1, 2) * (window.innerHeight / 900) * 3.4);
    gl.uniform1f(uGlow, glow * (1 + audioLevel * 1.6));
    gl.drawArrays(DRAW_MODE, 0, COUNT);
    gl.bindVertexArray(null);
  }

  function fmt(v) { return (v >= 0 ? '+' : '') + v.toFixed(3); }

  requestAnimationFrame(step);

  /* ---------- public API ---------- */
  window.FIELD = {
    setDepth: function (v01) {           // 0..1 scroll depth
      scroll01 = v01;
      focusTarget = 13 - v01 * 6;
      cam.tz = camBaseZ - v01 * 10;
    },
    pulse: function (a) { glowTarget = Math.max(glowTarget, 1 + a * 1.4); },
    setAudio: function (v) { audioLevel = v; },
    count: COUNT
  };
})();
