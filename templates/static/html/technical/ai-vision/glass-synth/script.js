/* Glass Synth — procedural frame, NMS and defocus bench, plus the page chrome.
   The scene is drawn from shapes, the edge map is a real Sobel over the rendered pixels,
   and the boxes come from a fixed candidate list passed through NMS. */

(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'index';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.nav a, .topnav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === page + '.html') a.setAttribute('aria-current', 'page');
  });

  /* ---------------- work filter ---------------- */

  var filts = document.querySelectorAll('.filt');
  if (filts.length) {
    filts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        filts.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        document.querySelectorAll('.proj').forEach(function (row) {
          var tasks = (row.getAttribute('data-task') || '').split(' ');
          var match = want === 'all' || tasks.indexOf(want) !== -1;
          row.hidden = !match;
          if (match) shown += 1;
        });
        var out = document.getElementById('projCount');
        if (out) out.textContent = shown + (shown === 1 ? ' project' : ' projects');
      });
    });
  }

  /* ---------------- contact form ---------------- */

  var cform = document.getElementById('contactForm');
  if (cform) {
    var cstatus = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var setErr = function (field, msg) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    ['name', 'email', 'message'].forEach(function (n) {
      var f = cform.elements[n];
      if (!f) return;
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') setErr(f, ''); });
    });
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = cform.elements.name, email = cform.elements.email, message = cform.elements.message;
      if (!name.value.trim()) { setErr(name, 'A name is enough.'); ok = false; } else setErr(name, '');
      if (!emailRe.test(email.value.trim())) { setErr(email, 'An address that accepts mail.'); ok = false; } else setErr(email, '');
      if (message.value.trim().length < 15) { setErr(message, 'What the system sees, and what it should see.'); ok = false; } else setErr(message, '');
      if (!ok) {
        if (cstatus) { cstatus.className = 'status show'; cstatus.textContent = 'A name, a valid email and a sentence about the failure, please.'; }
        var bad = cform.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      if (cstatus) {
        cstatus.className = 'status show ok';
        cstatus.textContent = 'Thanks, ' + name.value.trim().split(/\s+/)[0] + '. I read new briefs on Tuesdays and reply with two questions and a first guess at the cause. No data leaves this thread.';
      }
      cform.reset();
      cform.querySelectorAll('[aria-invalid]').forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      cform.querySelectorAll('.err').forEach(function (f) { f.textContent = ''; });
    });
  }

  /* ---------------- shared scene art ---------------- */

  var OBJECTS = [
    { id: 'person', label: 'person', box: [0.17, 0.55, 0.13, 0.37], depth: 0.15 },
    { id: 'cyclist', label: 'cyclist', box: [0.43, 0.60, 0.17, 0.17], depth: 0.5 },
    { id: 'sign', label: 'sign', box: [0.68, 0.30, 0.10, 0.17], depth: 0.86 }
  ];

  var CANDIDATES = [
    { box: [0.166, 0.556, 0.129, 0.363], score: 0.94 },
    { box: [0.176, 0.545, 0.132, 0.378], score: 0.81 },
    { box: [0.172, 0.562, 0.124, 0.356], score: 0.62 },
    { box: [0.426, 0.603, 0.171, 0.166], score: 0.89 },
    { box: [0.438, 0.594, 0.166, 0.175], score: 0.71 },
    { box: [0.434, 0.608, 0.162, 0.163], score: 0.55 },
    { box: [0.676, 0.304, 0.101, 0.168], score: 0.78 },
    { box: [0.684, 0.296, 0.097, 0.171], score: 0.58 },
    { box: [0.052, 0.30, 0.09, 0.14], score: 0.42 },
    { box: [0.82, 0.66, 0.12, 0.16], score: 0.37 },
    { box: [0.30, 0.74, 0.10, 0.12], score: 0.29 }
  ];

  function drawScene(ctx, w, h, focus, fNumber, blurOn) {
    var k = 55;
    var blurOf = function (depth) {
      if (!blurOn) return 0;
      return Math.min(26, Math.abs(depth - focus) * k / fNumber);
    };
    ctx.clearRect(0, 0, w, h);

    var band = function (depth, fn) {
      var b = blurOf(depth);
      ctx.save();
      if (b > 0.3) ctx.filter = 'blur(' + b.toFixed(1) + 'px)';
      fn();
      ctx.restore();
      ctx.filter = 'none';
    };

    // far: sky, sun, mountains, water
    band(0.86, function () {
      var sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      sky.addColorStop(0, '#0d2429');
      sky.addColorStop(0.45, '#1c4449');
      sky.addColorStop(0.78, '#c98b52');
      sky.addColorStop(1, '#f3bb7c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.62);

      var glow = ctx.createRadialGradient(w * 0.72, h * 0.44, 0, w * 0.72, h * 0.44, w * 0.26);
      glow.addColorStop(0, 'rgba(255, 222, 168, 0.95)');
      glow.addColorStop(0.32, 'rgba(255, 196, 126, 0.34)');
      glow.addColorStop(1, 'rgba(255, 190, 120, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h * 0.62);

      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.44, Math.min(w, h) * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = '#f6d9a4';
      ctx.fill();

      // mountains
      ctx.beginPath();
      ctx.moveTo(0, h * 0.52);
      ctx.lineTo(w * 0.14, h * 0.40);
      ctx.lineTo(w * 0.26, h * 0.47);
      ctx.lineTo(w * 0.38, h * 0.34);
      ctx.lineTo(w * 0.5, h * 0.45);
      ctx.lineTo(w * 0.62, h * 0.39);
      ctx.lineTo(w * 0.76, h * 0.47);
      ctx.lineTo(w * 0.88, h * 0.41);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(w, h * 0.62);
      ctx.lineTo(0, h * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#173b40';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, h * 0.54);
      ctx.lineTo(w * 0.20, h * 0.50);
      ctx.lineTo(w * 0.36, h * 0.53);
      ctx.lineTo(w * 0.52, h * 0.49);
      ctx.lineTo(w * 0.70, h * 0.53);
      ctx.lineTo(w * 0.86, h * 0.50);
      ctx.lineTo(w, h * 0.53);
      ctx.lineTo(w, h * 0.62);
      ctx.lineTo(0, h * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#103034';
      ctx.fill();

      // water
      var water = ctx.createLinearGradient(0, h * 0.60, 0, h);
      water.addColorStop(0, '#2a5457');
      water.addColorStop(0.4, '#123136');
      water.addColorStop(1, '#091d21');
      ctx.fillStyle = water;
      ctx.fillRect(0, h * 0.60, w, h * 0.40);

      ctx.strokeStyle = 'rgba(240, 200, 150, 0.28)';
      ctx.lineWidth = Math.max(1, w * 0.0016);
      for (var i = 0; i < 9; i += 1) {
        var yy = h * (0.63 + i * 0.032);
        var half = w * (0.05 + i * 0.018);
        ctx.beginPath();
        ctx.moveTo(w * 0.72 - half, yy);
        ctx.lineTo(w * 0.72 + half, yy);
        ctx.stroke();
      }
    });

    // mid: pier line, the cyclist and the sign
    band(0.52, function () {
      ctx.fillStyle = '#0d2428';
      ctx.fillRect(0, h * 0.635, w, h * 0.035);
      ctx.fillStyle = 'rgba(8, 24, 27, 0.9)';
      for (var p = 0.06; p < 0.95; p += 0.09) {
        ctx.fillRect(w * p, h * 0.63, w * 0.012, h * 0.10);
      }

      var cyc = OBJECTS[1].box;
      var cbx = cyc[0] * w, cby = cyc[1] * h, cbw = cyc[2] * w, cbh = cyc[3] * h;
      var wheelR = cbh * 0.24;
      var wy = cby + cbh * 0.76;
      ctx.strokeStyle = '#06181b';
      ctx.lineWidth = Math.max(1.4, w * 0.0024);
      [cbx + cbw * 0.22, cbx + cbw * 0.78].forEach(function (wx) {
        ctx.beginPath();
        ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cbx + cbw * 0.22, wy);
      ctx.lineTo(cbx + cbw * 0.44, cby + cbh * 0.30);
      ctx.lineTo(cbx + cbw * 0.62, wy);
      ctx.lineTo(cbx + cbw * 0.78, wy);
      ctx.moveTo(cbx + cbw * 0.62, wy);
      ctx.lineTo(cbx + cbw * 0.6, cby + cbh * 0.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cbx + cbw * 0.5, cby + cbh * 0.16, cbw * 0.08, cbh * 0.11, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#06181b';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cbx + cbw * 0.55, cby + cbh * 0.28);
      ctx.lineTo(cbx + cbw * 0.40, cby + cbh * 0.66);
      ctx.lineTo(cbx + cbw * 0.66, cby + cbh * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(240, 190, 130, 0.5)';
      ctx.lineWidth = Math.max(1, w * 0.0018);
      ctx.beginPath();
      ctx.arc(cbx + cbw * 0.5, cby + cbh * 0.16, cbw * 0.09, Math.PI * 0.95, Math.PI * 1.6);
      ctx.stroke();

      var sg = OBJECTS[2].box;
      var sbx = sg[0] * w, sby = sg[1] * h, sbw = sg[2] * w, sbh = sg[3] * h;
      ctx.fillStyle = '#0b2225';
      ctx.fillRect(sbx + sbw * 0.45, sby + sbh, Math.max(2, w * 0.008), h * 0.2);
      ctx.fillStyle = '#d9b070';
      ctx.fillRect(sbx, sby, sbw, sbh * 0.72);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(sbx + sbw * 0.14, sby + sbh * 0.16, sbw * 0.72, sbh * 0.08);
      ctx.fillRect(sbx + sbw * 0.14, sby + sbh * 0.36, sbw * 0.48, sbh * 0.08);
      ctx.fillStyle = 'rgba(255, 232, 190, 0.5)';
      ctx.fillRect(sbx, sby, sbw, Math.max(1, sbh * 0.04));
    });

    // near: the quay, the railing and the person
    band(0.15, function () {
      var quay = ctx.createLinearGradient(0, h * 0.76, 0, h);
      quay.addColorStop(0, '#0a1d20');
      quay.addColorStop(1, '#050f11');
      ctx.fillStyle = quay;
      ctx.fillRect(0, h * 0.76, w, h * 0.24);
      ctx.fillStyle = 'rgba(240, 190, 130, 0.10)';
      ctx.fillRect(0, h * 0.755, w, h * 0.006);

      var pb = OBJECTS[0].box;
      var bx = pb[0] * w, by = pb[1] * h, bw = pb[2] * w, bh = pb[3] * h;
      var headR = bw * 0.34;
      var headX = bx + bw * 0.5;
      var headY = by + headR * 1.1;
      // coat
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.08, by + bh * 0.26);
      ctx.quadraticCurveTo(bx - bw * 0.06, by + bh * 0.62, bx + bw * 0.04, by + bh);
      ctx.lineTo(bx + bw * 0.96, by + bh);
      ctx.quadraticCurveTo(bx + bw * 1.04, by + bh * 0.6, bx + bw * 0.9, by + bh * 0.27);
      ctx.quadraticCurveTo(bx + bw * 0.5, by + bh * 0.16, bx + bw * 0.08, by + bh * 0.26);
      ctx.closePath();
      ctx.fillStyle = '#061417';
      ctx.fill();
      // rim light down the left edge and around the head
      ctx.strokeStyle = 'rgba(245, 195, 135, 0.75)';
      ctx.lineWidth = Math.max(1.2, w * 0.0026);
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.1, by + bh * 0.28);
      ctx.quadraticCurveTo(bx - bw * 0.04, by + bh * 0.62, bx + bw * 0.05, by + bh * 0.98);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(headX, headY, headR, headR * 1.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#061417';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 195, 135, 0.8)';
      ctx.beginPath();
      ctx.ellipse(headX, headY, headR, headR * 1.12, 0, Math.PI * 0.82, Math.PI * 1.72);
      ctx.stroke();

      // railing in front of the person
      ctx.strokeStyle = 'rgba(4, 12, 14, 0.95)';
      ctx.lineWidth = Math.max(2, w * 0.005);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.895);
      ctx.lineTo(w * 0.42, h * 0.875);
      ctx.stroke();
      ctx.lineWidth = Math.max(1.4, w * 0.0026);
      for (var i = 0; i <= 5; i += 1) {
        var x = w * (0.015 + i * 0.07);
        ctx.beginPath();
        ctx.moveTo(x, h * (0.878 - i * 0.004));
        ctx.lineTo(x + w * 0.004, h);
        ctx.stroke();
      }
    });

    // gentle vignette
    var vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(3,10,12,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- hero ---------------- */

  var hero = document.getElementById('heroCanvas');
  if (hero) {
    var hctx = hero.getContext('2d');
    var phase = 0;
    var sizeHero = function () {
      var w = hero.clientWidth || hero.parentElement.clientWidth;
      var h = hero.clientHeight || hero.parentElement.clientHeight;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      hero.width = Math.max(1, Math.round(w * dpr));
      hero.height = Math.max(1, Math.round(h * dpr));
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    };
    var heroBox = sizeHero();
    var paintHero = function () {
      drawScene(hctx, heroBox.w, heroBox.h, 0.5, 4.5, true);
      // hazy light band, drifting very slowly
      var y = heroBox.h * (0.52 + Math.sin(phase) * 0.012);
      var haze = hctx.createLinearGradient(0, y - heroBox.h * 0.1, 0, y + heroBox.h * 0.16);
      haze.addColorStop(0, 'rgba(255, 200, 140, 0)');
      haze.addColorStop(0.5, 'rgba(255, 200, 140, 0.10)');
      haze.addColorStop(1, 'rgba(255, 200, 140, 0)');
      hctx.fillStyle = haze;
      hctx.fillRect(0, y - heroBox.h * 0.1, heroBox.w, heroBox.h * 0.26);
    };
    paintHero();
    var resizeHero = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeHero);
      resizeHero = setTimeout(function () {
        heroBox = sizeHero();
        paintHero();
      }, 160);
    });
  }

  if (page !== 'index') return;

  /* ---------------- inspector ---------------- */

  var el = {
    form: document.getElementById('inspForm'),
    scene: document.getElementById('sceneCanvas'),
    edge: document.getElementById('edgeCanvas'),
    depth: document.getElementById('depthCanvas'),
    tag: document.getElementById('frameTag'),
    kept: document.getElementById('roKept'),
    prec: document.getElementById('roPrec'),
    rec: document.getElementById('roRec'),
    miou: document.getElementById('roMiou'),
    blur: document.getElementById('roBlur'),
    lat: document.getElementById('roLat'),
    verdict: document.getElementById('verdict'),
    foot: document.getElementById('footOptics'),
    outs: {
      conf: document.getElementById('confOut'),
      iou: document.getElementById('iouOut'),
      focus: document.getElementById('focusOut'),
      aperture: document.getElementById('apertureOut')
    }
  };
  if (!el.form || !el.scene) return;

  var sctx = el.scene.getContext('2d');
  var ectx = el.edge.getContext('2d');
  var dctx = el.depth.getContext('2d');
  var last = null;

  function readState() {
    var fd = new FormData(el.form);
    return {
      conf: parseFloat(fd.get('conf')),
      iou: parseFloat(fd.get('iou')),
      soft: fd.get('soft') === 'on',
      focus: parseFloat(fd.get('focus')),
      aperture: parseFloat(fd.get('aperture'))
    };
  }

  function iou(a, b) {
    var ax2 = a[0] + a[2], ay2 = a[1] + a[3];
    var bx2 = b[0] + b[2], by2 = b[1] + b[3];
    var x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
    var x2 = Math.min(ax2, bx2), y2 = Math.min(ay2, by2);
    var inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    var union = a[2] * a[3] + b[2] * b[3] - inter;
    return union > 0 ? inter / union : 0;
  }

  function nms(s) {
    var list = CANDIDATES.map(function (c) { return { box: c.box.slice(), score: c.score, suppressed: false }; });
    list = list.filter(function (c) { return c.score >= s.conf; });
    list.sort(function (a, b) { return b.score - a.score; });
    var kept = [];
    for (var i = 0; i < list.length; i += 1) {
      var cand = list[i];
      if (cand.suppressed) continue;
      kept.push(cand);
      for (var j = i + 1; j < list.length; j += 1) {
        var other = list[j];
        if (other.suppressed) continue;
        var overlap = iou(cand.box, other.box);
        if (s.soft) {
          other.score *= Math.exp(-(overlap * overlap) / 0.5);
          if (other.score < s.conf) other.suppressed = true;
        } else if (overlap > s.iou) {
          other.suppressed = true;
        }
      }
    }
    return { kept: kept, all: list };
  }

  function evaluate(kept) {
    var used = {};
    var matches = 0;
    var sumIou = 0;
    kept.forEach(function (k) {
      var best = -1, bestIou = 0;
      OBJECTS.forEach(function (o, idx) {
        var v = iou(k.box, o.box);
        if (v > bestIou) { bestIou = v; best = idx; }
      });
      if (bestIou >= 0.5 && !used[best]) {
        used[best] = true;
        matches += 1;
        sumIou += bestIou;
      }
    });
    return {
      matches: matches,
      precision: kept.length ? matches / kept.length : 0,
      recall: matches / OBJECTS.length,
      meanIou: matches ? sumIou / matches : 0
    };
  }

  function sizeScene() {
    var host = el.scene.parentElement;
    var w = host.clientWidth;
    if (w < 40) return null;
    var h = Math.round(w * 0.66);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    el.scene.width = Math.round(w * dpr);
    el.scene.height = Math.round(h * dpr);
    el.scene.style.height = h + 'px';
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function drawEdge(box) {
    var w = 200, h = Math.round(box.h / box.w * 200);
    ectx.canvas.width = w;
    ectx.canvas.height = h;
    var tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    var tctx = tmp.getContext('2d');
    tctx.drawImage(el.scene, 0, 0, w, h);
    var data = tctx.getImageData(0, 0, w, h).data;
    var lum = new Float32Array(w * h);
    for (var i = 0; i < w * h; i += 1) {
      lum[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
    }
    var out = ectx.createImageData(w, h);
    var max = 0.0001;
    var mags = new Float32Array(w * h);
    for (var y = 1; y < h - 1; y += 1) {
      for (var x = 1; x < w - 1; x += 1) {
        var idx = y * w + x;
        var gx = -lum[idx - w - 1] - 2 * lum[idx - 1] - lum[idx + w - 1] + lum[idx - w + 1] + 2 * lum[idx + 1] + lum[idx + w + 1];
        var gy = -lum[idx - w - 1] - 2 * lum[idx - w] - lum[idx - w + 1] + lum[idx + w - 1] + 2 * lum[idx + w] + lum[idx + w + 1];
        var m = Math.sqrt(gx * gx + gy * gy);
        mags[idx] = m;
        if (m > max) max = m;
      }
    }
    for (var j = 0; j < w * h; j += 1) {
      var v = Math.min(1, mags[j] / (max * 0.55));
      // dark teal to amber ramp
      out.data[j * 4] = Math.round(8 + v * 216);
      out.data[j * 4 + 1] = Math.round(24 + v * 150);
      out.data[j * 4 + 2] = Math.round(26 + v * 88 - v * 40);
      out.data[j * 4 + 3] = 255;
    }
    ectx.putImageData(out, 0, 0);
  }

  function drawDepth(box) {
    var w = 200, h = Math.round(box.h / box.w * 200);
    dctx.canvas.width = w;
    dctx.canvas.height = h;
    var g = dctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#d5e6e2');
    g.addColorStop(0.55, '#7fa8a3');
    g.addColorStop(1, '#123033');
    dctx.fillStyle = g;
    dctx.fillRect(0, 0, w, h);
    OBJECTS.forEach(function (o) {
      var shade = Math.round(40 + (1 - o.depth) * 60);
      dctx.fillStyle = 'rgba(' + shade + ',' + (shade + 26) + ',' + (shade + 24) + ',0.95)';
      dctx.fillRect(o.box[0] * w, o.box[1] * h, o.box[2] * w, o.box[3] * h);
    });
    dctx.strokeStyle = 'rgba(6, 24, 26, 0.35)';
    dctx.lineWidth = 1;
    dctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawOverlay(box, kept, all, gtHit) {
    var w = box.w, h = box.h;
    sctx.font = '400 ' + Math.max(8, Math.round(w * 0.012)) + 'px "Fragment Mono", monospace';
    all.forEach(function (c) {
      if (!c.suppressed) return;
      sctx.strokeStyle = 'rgba(226, 240, 237, 0.28)';
      sctx.setLineDash([3, 3]);
      sctx.lineWidth = 1;
      sctx.strokeRect(c.box[0] * w, c.box[1] * h, c.box[2] * w, c.box[3] * h);
      sctx.setLineDash([]);
    });
    kept.forEach(function (k) {
      var x = k.box[0] * w, y = k.box[1] * h, bw = k.box[2] * w, bh = k.box[3] * h;
      var matched = gtHit.some(function (b) { return b === k; });
      var colour = matched ? '#6fc9c4' : '#d8a24a';
      sctx.strokeStyle = colour;
      sctx.lineWidth = 1.6;
      sctx.strokeRect(x, y, bw, bh);
      var label = k.score.toFixed(2);
      var tw = sctx.measureText(label).width + 8;
      sctx.fillStyle = colour;
      sctx.fillRect(x, Math.max(0, y - 13), tw, 13);
      sctx.fillStyle = '#06181a';
      sctx.fillText(label, x + 4, Math.max(9, y - 3));
    });
  }

  function render() {
    var s = readState();
    var box = sizeScene();
    if (!box) return;
    drawScene(sctx, box.w, box.h, s.focus, s.aperture, true);
    var res = nms(s);
    var ev = evaluate(res.kept);
    var matched = [];
    res.kept.forEach(function (k) {
      var bestIou = 0;
      OBJECTS.forEach(function (o) {
        var v = iou(k.box, o.box);
        if (v > bestIou) bestIou = v;
      });
      if (bestIou >= 0.5) matched.push(k);
    });
    drawOverlay(box, res.kept, res.all, matched);

    var blurPerson = Math.abs(OBJECTS[0].depth - s.focus) * 55 / s.aperture;
    var blurSign = Math.abs(OBJECTS[2].depth - s.focus) * 55 / s.aperture;

    el.outs.conf.textContent = s.conf.toFixed(2);
    el.outs.iou.textContent = s.iou.toFixed(2);
    el.outs.focus.textContent = s.focus.toFixed(2);
    el.outs.aperture.textContent = 'f/' + (s.aperture < 10 ? s.aperture.toFixed(1) : s.aperture.toFixed(0));

    el.kept.textContent = String(res.kept.length);
    el.prec.innerHTML = Math.round(ev.precision * 100) + '<small>%</small>';
    el.rec.innerHTML = Math.round(ev.recall * 100) + '<small>%</small>';
    el.miou.textContent = ev.meanIou.toFixed(2);
    el.blur.innerHTML = blurPerson.toFixed(1) + '<small>px</small>';
    el.lat.innerHTML = (26 + CANDIDATES.length * 0.45).toFixed(0) + '<small>ms</small>';
    el.tag.textContent = res.kept.length + ' kept / ' + CANDIDATES.length;

    var bits = [];
    bits.push(res.kept.length + ' detections kept from ' + CANDIDATES.length + ' candidates at a ' + s.conf.toFixed(2) + ' confidence threshold and ' + (s.soft ? 'Gaussian soft-NMS with σ = 0.5' : 'hard NMS at IoU ' + s.iou.toFixed(2)) + '.');
    bits.push('Precision ' + ev.precision.toFixed(2) + ', recall ' + ev.recall.toFixed(2) + ', mean IoU ' + ev.meanIou.toFixed(2) + '.');
    if (ev.recall < 1) bits.push((OBJECTS.length - ev.matches) + ' of three objects are unmatched: the confidence threshold is above one of the real detections.');
    if (ev.precision < 1) bits.push('The unmatched boxes sit on background, which is what a threshold below 0.45 buys you on this frame.');
    if (s.iou < 0.2) bits.push('An IoU threshold of ' + s.iou.toFixed(2) + ' is aggressive enough to risk merging two different objects.');
    bits.push('At ' + (s.aperture < 10 ? 'f/' + s.aperture.toFixed(1) : 'f/' + s.aperture.toFixed(0)) + ' and focus ' + s.focus.toFixed(2) + ', the person carries ' + blurPerson.toFixed(1) + ' px of defocus and the sign ' + blurSign.toFixed(1) + ' px, which is the cue the depth model actually uses.');
    el.verdict.textContent = bits.join(' ');

    el.foot.textContent = 'defocus ∝ |depth − focus| / f-number · person ' + OBJECTS[0].depth + ' · cyclist ' + OBJECTS[1].depth + ' · sign ' + OBJECTS[2].depth;

    drawEdge(box);
    drawDepth(box);

    last = { s: s, kept: res.kept.length, ev: ev, blurPerson: blurPerson, blurSign: blurSign, latency: 26 + CANDIDATES.length * 0.45, verdict: el.verdict.textContent };
  }

  el.form.addEventListener('input', render);
  el.form.addEventListener('change', render);
  el.form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(render, 150);
  });

  render();

  window.__vision = {
    read: function () {
      return {
        kept: last.kept,
        precision: last.ev.precision,
        recall: last.ev.recall,
        meanIou: last.ev.meanIou,
        blurPerson: last.blurPerson,
        blurSign: last.blurSign,
        latency: last.latency,
        verdict: last.verdict,
        readouts: {
          kept: el.kept.textContent,
          precision: el.prec.textContent,
          recall: el.rec.textContent,
          miou: el.miou.textContent,
          blur: el.blur.textContent,
          latency: el.lat.textContent
        },
        audio: typeof window.AudioContext !== 'undefined' && window.__audioCreated === true
      };
    },
    set: function (name, value) {
      var f = el.form.elements[name];
      if (!f) return;
      if (f.type === 'checkbox') f.checked = String(value) === 'true';
      else f.value = value;
      render();
    }
  };
})();
