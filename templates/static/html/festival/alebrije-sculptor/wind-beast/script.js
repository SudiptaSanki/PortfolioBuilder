/* Wind Beast — the beast bench.
   Draws a carved alebrije from four choices and estimates the work at the bench.
   Canvas 2D only; nothing here makes a sound. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mast-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var PALETTES = {
    copal: { name: 'copal', base: '#dfb269', dark: '#bd8d47', a1: '#c8442f', a2: '#2e7d68', a3: '#f6efdd', bg: '#efe2c8', ink: '#241a12' },
    noche: { name: 'noche', base: '#31456f', dark: '#22304f', a1: '#4fb3c4', a2: '#f2b03c', a3: '#eadfc6', bg: '#e9dcc2', ink: '#1a1526' },
    mercado: { name: 'mercado', base: '#b8355a', dark: '#8d2544', a1: '#f0a72e', a2: '#2f9c7a', a3: '#f6ead6', bg: '#f0e2c8', ink: '#241420' }
  };

  var BODIES = {
    jaguar: {
      name: 'Jaguar', size: '60 cm', factor: 4,
      body: { cx: 294, cy: 342, rx: 114, ry: 74, rot: -0.03 },
      neck: { sx: 356, sy: 324, ex: 414, ey: 302, w: 64 },
      head: { cx: 450, cy: 290, rx: 63, ry: 52, rot: 0.02 },
      legs: [[222, 392, 92, 27], [266, 400, 88, 26], [366, 400, 94, 26], [404, 392, 90, 25]],
      ears: 'round', tail: 'thick', pattern: 'rosette', crest: false, hoof: false
    },
    deer: {
      name: 'Venado', size: '65 cm', factor: 3,
      body: { cx: 288, cy: 332, rx: 100, ry: 62, rot: -0.03 },
      neck: { sx: 352, sy: 306, ex: 424, ey: 226, w: 42 },
      head: { cx: 452, cy: 204, rx: 45, ry: 35, rot: 0.08 },
      legs: [[228, 376, 108, 17], [268, 384, 104, 16], [356, 384, 110, 17], [392, 374, 106, 16]],
      ears: 'leaf', tail: 'puff', pattern: 'stripes', crest: false, hoof: true
    },
    rabbit: {
      name: 'Conejo', size: '40 cm', factor: 1,
      body: { cx: 288, cy: 370, rx: 96, ry: 76, rot: -0.02 },
      neck: { sx: 350, sy: 352, ex: 380, ey: 328, w: 52 },
      head: { cx: 402, cy: 310, rx: 54, ry: 47, rot: 0.04 },
      legs: [[236, 428, 58, 22], [276, 436, 55, 21], [352, 434, 57, 22], [386, 426, 55, 21]],
      ears: 'tall', tail: 'puff', pattern: 'dots', crest: false, hoof: false
    },
    iguana: {
      name: 'Iguana', size: '70 cm', factor: 5,
      body: { cx: 290, cy: 360, rx: 142, ry: 54, rot: -0.02 },
      neck: { sx: 406, sy: 350, ex: 444, ey: 336, w: 40 },
      head: { cx: 468, cy: 330, rx: 46, ry: 31, rot: 0.03 },
      legs: [[204, 398, 50, 19], [248, 406, 48, 18], [372, 404, 52, 19], [410, 398, 49, 18]],
      ears: 'none', tail: 'spiral', pattern: 'scales', crest: true, hoof: false
    },
    armadillo: {
      name: 'Armadillo', size: '45 cm', factor: 2,
      body: { cx: 292, cy: 350, rx: 120, ry: 68, rot: -0.02 },
      neck: { sx: 386, sy: 332, ex: 420, ey: 318, w: 40 },
      head: { cx: 444, cy: 308, rx: 45, ry: 35, rot: 0.03 },
      legs: [[236, 404, 60, 21], [280, 410, 58, 20], [364, 408, 60, 21], [402, 402, 58, 20]],
      ears: 'plates', tail: 'banded', pattern: 'bands', crest: false, hoof: false
    }
  };

  function background(ctx, P) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = 'rgba(36,26,18,.07)';
    for (var y = 20; y < 600; y += 24) {
      for (var x = 20; x < 600; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(36,26,18,.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 14, 572, 572);
  }

  /* one leg with a knee, a paw and toes */
  function leg(ctx, x, y, len, w, fill, P, hoof) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 14);
    ctx.bezierCurveTo(x - w * 0.58, y + len * 0.34, x - w * 0.46, y + len * 0.68, x - w * 0.36, y + len - 8);
    ctx.lineTo(x + w * 0.36, y + len - 8);
    ctx.bezierCurveTo(x + w * 0.46, y + len * 0.68, x + w * 0.58, y + len * 0.34, x + w / 2, y - 14);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    /* paw */
    ctx.beginPath();
    ctx.ellipse(x, y + len - 2, w * 0.56, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = hoof ? P.ink : fill;
    ctx.fill();
    if (!hoof) {
      ctx.fillStyle = P.ink;
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1.6;
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * w * 0.16, y + len - 8);
        ctx.lineTo(x + i * w * 0.16, y + len + 4);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(x, y + len - 2, w * 0.56, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawTail(ctx, B, P) {
    var b = B.body;
    var sx = b.cx - b.rx + 16;
    var sy = b.cy + b.ry * 0.24;
    ctx.lineCap = 'round';
    if (B.tail === 'thick') {
      var segs = [[sx, sy, sx - 74, sy - 22, 26], [sx - 74, sy - 22, sx - 108, sy - 88, 18], [sx - 108, sy - 88, sx - 82, sy - 142, 11]];
      segs.forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo((s[0] + s[2]) / 2 - 10, (s[1] + s[3]) / 2 + 8, s[2], s[3]);
        ctx.strokeStyle = P.ink; ctx.lineWidth = s[4] + 6; ctx.stroke();
        ctx.strokeStyle = P.base; ctx.lineWidth = s[4]; ctx.stroke();
      });
      for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(sx - 34 - i * 22, sy - 12 - i * 30, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = P.a2; ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.stroke();
      }
    } else if (B.tail === 'puff') {
      ctx.beginPath();
      ctx.arc(sx - 12, sy - 6, 27, 0, Math.PI * 2);
      ctx.fillStyle = P.a3; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx - 30, sy - 24, 13, 0, Math.PI * 2);
      ctx.fillStyle = P.a1; ctx.fill(); ctx.stroke();
    } else if (B.tail === 'spiral') {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx - 86, sy + 12, sx - 132, sy - 62, sx - 88, sy - 98);
      ctx.bezierCurveTo(sx - 54, sy - 124, sx - 30, sy - 86, sx - 60, sy - 70);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 24; ctx.stroke();
      ctx.strokeStyle = P.base; ctx.lineWidth = 18; ctx.stroke();
      ctx.strokeStyle = P.a2; ctx.lineWidth = 18; ctx.setLineDash([10, 24]); ctx.stroke(); ctx.setLineDash([]);
    } else if (B.tail === 'banded') {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - 82, sy + 16, sx - 114, sy - 40);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 26; ctx.stroke();
      ctx.strokeStyle = P.base; ctx.lineWidth = 20; ctx.stroke();
      for (var k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(sx - 18 - k * 20, sy + 2 - k * 7, 9, 0, Math.PI * 2);
        ctx.strokeStyle = k % 2 ? P.a2 : P.a1; ctx.lineWidth = 4; ctx.stroke();
      }
    }
  }

  function drawWings(ctx, type, P) {
    if (type === 'none' || !type) return;
    var long = type === 'heron';
    [-1, 1].forEach(function (dir) {
      ctx.save();
      ctx.translate(300, 330);
      ctx.scale(dir, 1);
      ctx.beginPath();
      if (long) {
        ctx.moveTo(8, 18);
        ctx.bezierCurveTo(62, -18, 128, -74, 150, -150);
        ctx.bezierCurveTo(158, -178, 140, -196, 114, -188);
        ctx.bezierCurveTo(84, -178, 62, -132, 56, -92);
        ctx.bezierCurveTo(26, -96, 2, -60, 8, 18);
        ctx.closePath();
      } else {
        ctx.moveTo(8, 22);
        ctx.bezierCurveTo(62, -6, 126, -40, 146, -104);
        ctx.bezierCurveTo(158, -142, 138, -176, 106, -172);
        ctx.bezierCurveTo(78, -168, 62, -136, 64, -108);
        ctx.bezierCurveTo(46, -92, 46, -54, 62, -38);
        ctx.bezierCurveTo(34, -30, 12, -6, 8, 22);
        ctx.closePath();
      }
      ctx.fillStyle = P.a1;
      ctx.fill();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 3.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
      /* veins */
      ctx.strokeStyle = P.a3;
      ctx.lineWidth = 2;
      for (var i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(16, 10);
        if (long) ctx.quadraticCurveTo(48 + i * 18, -60 - i * 20, 92 + i * 16, -148 - i * 6);
        else ctx.quadraticCurveTo(48 + i * 20, -46 - i * 24, 84 + i * 16, -118 - i * 12);
        ctx.stroke();
      }
      /* edge dots */
      ctx.fillStyle = P.a2;
      for (var d = 0; d < 7; d++) {
        ctx.beginPath();
        ctx.arc(52 + d * 12, -96 - d * 10, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawBeast(canvas, opts) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 600 * dpr;
    canvas.height = 600 * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var P = PALETTES[opts.palette] || PALETTES.copal;
    var B = BODIES[opts.body] || BODIES.jaguar;
    var density = Number(opts.density) || 55;

    background(ctx, P);

    ctx.beginPath();
    ctx.ellipse(300, 508, 165, 17, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(36,26,18,.13)';
    ctx.fill();

    drawWings(ctx, opts.wings, P);
    drawTail(ctx, B, P);

    leg(ctx, B.legs[0][0], B.legs[0][1], B.legs[0][2], B.legs[0][3], P.dark, P, B.hoof);
    leg(ctx, B.legs[2][0], B.legs[2][1], B.legs[2][2], B.legs[2][3], P.dark, P, B.hoof);
    leg(ctx, B.legs[1][0], B.legs[1][1], B.legs[1][2], B.legs[1][3], P.base, P, B.hoof);
    leg(ctx, B.legs[3][0], B.legs[3][1], B.legs[3][2], B.legs[3][3], P.base, P, B.hoof);

    /* neck sits behind body and head */
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(B.neck.sx, B.neck.sy);
    ctx.lineTo(B.neck.ex, B.neck.ey);
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = B.neck.w + 7;
    ctx.stroke();
    ctx.strokeStyle = P.base;
    ctx.lineWidth = B.neck.w;
    ctx.stroke();

    /* body */
    ctx.beginPath();
    ctx.ellipse(B.body.cx, B.body.cy, B.body.rx, B.body.ry, B.body.rot, 0, Math.PI * 2);
    ctx.fillStyle = P.base;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 3.4;
    ctx.stroke();

    /* head: skull, snout, jaw */
    var h = B.head;
    ctx.beginPath();
    ctx.ellipse(h.cx, h.cy, h.rx, h.ry, h.rot, 0, Math.PI * 2);
    ctx.fillStyle = P.base;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(h.cx + h.rx * 0.66, h.cy + h.ry * 0.26, h.rx * 0.48, h.ry * 0.42, h.rot, 0, Math.PI * 2);
    ctx.fillStyle = P.base;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(h.cx + h.rx * 0.24, h.cy + h.ry * 0.72);
    ctx.quadraticCurveTo(h.cx + h.rx * 0.62, h.cy + h.ry * 0.9, h.cx + h.rx * 1.02, h.cy + h.ry * 0.52);
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    drawEars(ctx, B, P);
    drawFace(ctx, B, P);
    paintPatterns(ctx, B, P, density);
    drawCrest(ctx, B, P);
    drawCollar(ctx, B, P);
  }

  function drawEars(ctx, B, P) {
    var h = B.head;
    if (B.ears === 'round') {
      [[-0.42, -0.88], [0.5, -0.92]].forEach(function (o) {
        var ex = h.cx + h.rx * o[0];
        var ey = h.cy + h.ry * o[1];
        ctx.beginPath();
        ctx.arc(ex, ey, 18, 0, Math.PI * 2);
        ctx.fillStyle = P.base; ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, ey + 1, 9, 0, Math.PI * 2);
        ctx.fillStyle = P.a1; ctx.fill();
      });
    } else if (B.ears === 'tall') {
      [[-0.5, -0.9, -0.16], [0.3, -0.95, 0.2]].forEach(function (o) {
        ctx.save();
        ctx.translate(h.cx + h.rx * o[0], h.cy + h.ry * o[1]);
        ctx.rotate(o[2]);
        ctx.beginPath();
        ctx.ellipse(0, -40, 16, 46, 0, 0, Math.PI * 2);
        ctx.fillStyle = P.base; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -38, 7, 33, 0, 0, Math.PI * 2);
        ctx.fillStyle = P.a1; ctx.fill();
        ctx.restore();
      });
    } else if (B.ears === 'leaf') {
      [[-0.55, -0.7, -0.4], [0.36, -0.78, 0.35]].forEach(function (o) {
        ctx.save();
        ctx.translate(h.cx + h.rx * o[0], h.cy + h.ry * o[1]);
        ctx.rotate(o[2]);
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.quadraticCurveTo(-18, -44, 2, -60);
        ctx.quadraticCurveTo(24, -40, 0, 6);
        ctx.fillStyle = P.a1; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2.6; ctx.stroke();
        ctx.restore();
      });
      /* antlers */
      [[-0.24, -1.02, -1], [0.44, -1.02, 1]].forEach(function (o) {
        ctx.save();
        ctx.translate(h.cx + h.rx * o[0], h.cy + h.ry * o[1]);
        ctx.scale(o[2], 1);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 11; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-8, -44, -18, -84); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(-40, -60); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-16, -66); ctx.lineTo(6, -88); ctx.stroke();
        ctx.strokeStyle = P.a3; ctx.lineWidth = 6.5;
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-8, -44, -18, -84); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(-40, -60); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-16, -66); ctx.lineTo(6, -88); ctx.stroke();
        ctx.restore();
      });
    } else if (B.ears === 'plates') {
      ctx.beginPath();
      ctx.moveTo(h.cx - 30, h.cy - h.ry + 8);
      ctx.lineTo(h.cx - 14, h.cy - h.ry - 14);
      ctx.lineTo(h.cx + 2, h.cy - h.ry + 4);
      ctx.closePath();
      ctx.fillStyle = P.a1; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4; ctx.stroke();
    }
  }

  function drawFace(ctx, B, P) {
    var h = B.head;
    /* eye */
    ctx.beginPath();
    ctx.ellipse(h.cx + h.rx * 0.22, h.cy - h.ry * 0.2, 9, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.a3; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.cx + h.rx * 0.26, h.cy - h.ry * 0.18, 4.4, 0, Math.PI * 2);
    ctx.fillStyle = P.ink; ctx.fill();
    ctx.beginPath();
    ctx.arc(h.cx + h.rx * 0.18, h.cy - h.ry * 0.3, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = P.a3; ctx.fill();
    /* brow marking */
    ctx.beginPath();
    ctx.arc(h.cx + h.rx * 0.22, h.cy - h.ry * 0.2, 15, -2.3, -0.55);
    ctx.strokeStyle = P.a1; ctx.lineWidth = 4; ctx.stroke();
    /* nostril and whisker dots */
    ctx.beginPath();
    ctx.arc(h.cx + h.rx * 0.98, h.cy + h.ry * 0.2, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = P.ink; ctx.fill();
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(h.cx + h.rx * (0.72 + i * 0.08), h.cy + h.ry * (0.28 + i * 0.08), 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    /* cheek dot */
    ctx.beginPath();
    ctx.arc(h.cx - h.rx * 0.4, h.cy + h.ry * 0.16, 8, 0, Math.PI * 2);
    ctx.fillStyle = P.a2; ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1.8; ctx.stroke();
    /* forehead marks */
    ctx.beginPath();
    ctx.moveTo(h.cx - h.rx * 0.12, h.cy - h.ry * 0.72);
    ctx.lineTo(h.cx - h.rx * 0.02, h.cy - h.ry * 0.48);
    ctx.moveTo(h.cx + h.rx * 0.1, h.cy - h.ry * 0.78);
    ctx.lineTo(h.cx + h.rx * 0.18, h.cy - h.ry * 0.52);
    ctx.strokeStyle = P.a1; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
  }

  function paintPatterns(ctx, B, P, density) {
    var b = B.body;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.cx, b.cy, b.rx, b.ry, b.rot, 0, Math.PI * 2);
    ctx.clip();
    var gap = Math.max(14, 66 - density * 0.5);

    if (B.pattern === 'rosette') {
      for (var y = b.cy - b.ry; y < b.cy + b.ry; y += gap) {
        for (var x = b.cx - b.rx; x < b.cx + b.rx; x += gap) {
          var row = Math.round((y - (b.cy - b.ry)) / gap);
          var ox = (row % 2) * gap * 0.5;
          var px = x + ox;
          if (((px - b.cx) / (b.rx * 0.94)) ** 2 + ((y - b.cy) / (b.ry * 0.94)) ** 2 > 1) continue;
          ctx.beginPath();
          ctx.arc(px, y, gap * 0.26, 0.2, Math.PI * 1.9);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 3.2; ctx.stroke();
          ctx.beginPath();
          ctx.arc(px - gap * 0.08, y + gap * 0.04, gap * 0.08, 0, Math.PI * 2);
          ctx.fillStyle = P.a2; ctx.fill();
          ctx.beginPath();
          ctx.arc(px + gap * 0.1, y - gap * 0.06, gap * 0.05, 0, Math.PI * 2);
          ctx.fillStyle = P.ink; ctx.fill();
        }
      }
    } else if (B.pattern === 'stripes') {
      var n = Math.max(6, Math.round(2 * b.rx / gap));
      for (var i = 0; i < n; i++) {
        var sx = b.cx - b.rx + (i + 0.5) * (2 * b.rx / n);
        ctx.beginPath();
        ctx.moveTo(sx, b.cy - b.ry);
        ctx.quadraticCurveTo(sx + 24, b.cy, sx, b.cy + b.ry);
        ctx.strokeStyle = i % 2 ? P.a1 : P.a2;
        ctx.lineWidth = Math.max(6, gap * 0.22);
        ctx.stroke();
      }
    } else if (B.pattern === 'dots') {
      for (var yy = b.cy - b.ry; yy < b.cy + b.ry; yy += gap * 0.8) {
        for (var xx = b.cx - b.rx; xx < b.cx + b.rx; xx += gap * 0.8) {
          var r = 3 + (Math.abs(Math.round(xx + yy)) % 3);
          ctx.beginPath();
          ctx.arc(xx, yy, r, 0, Math.PI * 2);
          ctx.fillStyle = [P.a1, P.a2, P.a3][Math.abs(Math.round(xx * yy)) % 3];
          ctx.fill();
        }
      }
    } else if (B.pattern === 'scales') {
      for (var sy = b.cy - b.ry; sy < b.cy + b.ry; sy += gap * 0.72) {
        for (var sx2 = b.cx - b.rx; sx2 < b.cx + b.rx; sx2 += gap * 0.9) {
          ctx.beginPath();
          ctx.arc(sx2, sy, gap * 0.42, 0.15, Math.PI - 0.15);
          ctx.strokeStyle = (Math.round(sy / gap) % 2) ? P.a2 : P.a3;
          ctx.lineWidth = 2.6;
          ctx.stroke();
        }
      }
    } else if (B.pattern === 'bands') {
      var bandH = Math.max(8, gap * 0.26);
      for (var by = b.cy - b.ry + 6; by < b.cy + b.ry * 0.55; by += bandH * 2) {
        ctx.fillStyle = (Math.round((by - (b.cy - b.ry)) / bandH) % 2) ? P.a1 : P.a2;
        ctx.fillRect(b.cx - b.rx, by, 2 * b.rx, bandH * 0.62);
      }
      ctx.beginPath();
      ctx.ellipse(b.cx, b.cy, b.rx * 0.97, b.ry * 0.97, b.rot, Math.PI * 0.05, Math.PI * 0.95);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 4.4; ctx.stroke();
      ctx.strokeStyle = P.a3; ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrest(ctx, B, P) {
    if (!B.crest) return;
    var b = B.body;
    for (var i = 0; i < 9; i++) {
      var x = b.cx - 96 + i * 23;
      var y = b.cy - b.ry + 6;
      ctx.beginPath();
      ctx.moveTo(x - 11, y + 6);
      ctx.lineTo(x, y - 20 - (i % 2) * 8);
      ctx.lineTo(x + 11, y + 6);
      ctx.fillStyle = P.a1;
      ctx.fill();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawCollar(ctx, B, P) {
    var n = B.neck;
    for (var i = 0; i < 5; i++) {
      var t = 0.3 + i * 0.11;
      var x = n.sx + (n.ex - n.sx) * t;
      var y = n.sy + (n.ey - n.sy) * t;
      ctx.beginPath();
      ctx.arc(x + 2, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? P.a3 : P.a1;
      ctx.fill();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  /* ---------- bench ---------- */
  var state = { body: 'jaguar', palette: 'copal', wings: 'none', density: 55 };
  var benchCanvas = document.getElementById('beastCanvas');
  var heroCanvas = document.getElementById('heroBeast');

  function plan() {
    var B = BODIES[state.body];
    var P = PALETTES[state.palette];
    var carve = Math.round(13 + Number(state.density) * 0.1 + (state.wings !== 'none' ? 5 : 0) + B.factor);
    var paint = Math.round(10 + Number(state.density) * 0.16 + (state.wings !== 'none' ? 6 : 0) + (B.pattern === 'rosette' ? 4 : 0));
    var drying = { jaguar: '10 weeks', deer: '12 weeks', rabbit: '7 weeks', iguana: '9 weeks', armadillo: '8 weeks' }[state.body];
    return {
      wood: 'Copal blanco · ' + B.size,
      dry: drying,
      carve: carve + ' h',
      paint: paint + ' h',
      pattern: { rosette: 'Hand-painted rosettes', stripes: 'Brush stripes', dots: 'Dot work', scales: 'Scale arcs', bands: 'Painted bands' }[B.pattern],
      name: B.name + ' de ' + P.name
    };
  }

  function paintBench() {
    if (!benchCanvas) return;
    drawBeast(benchCanvas, { body: state.body, palette: state.palette, wings: state.wings, density: state.density });
    var p = plan();
    var set = function (id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
    set('plateName', p.name);
    set('outWood', p.wood);
    set('outDry', p.dry);
    set('outCarve', p.carve);
    set('outPaint', p.paint);
    set('outPattern', p.pattern);
    document.querySelectorAll('[data-body]').forEach(function (b) {
      var on = b.getAttribute('data-body') === state.body;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-palette]').forEach(function (b) {
      var on = b.getAttribute('data-palette') === state.palette;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-body]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.body = b.getAttribute('data-body');
      paintBench();
    });
  });
  document.querySelectorAll('[data-palette]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.palette = b.getAttribute('data-palette');
      paintBench();
    });
  });
  document.querySelectorAll('[data-wings]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.wings = b.getAttribute('data-wings');
      document.querySelectorAll('[data-wings]').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      paintBench();
    });
  });
  var density = document.getElementById('density');
  if (density) {
    density.addEventListener('input', function () {
      state.density = Number(density.value);
      var out = document.getElementById('densityOut');
      if (out) out.textContent = state.density + '%';
      paintBench();
    });
  }
  var reset = document.getElementById('resetBeast');
  if (reset) {
    reset.addEventListener('click', function () {
      state = { body: 'jaguar', palette: 'copal', wings: 'none', density: 55 };
      if (density) density.value = '55';
      var out = document.getElementById('densityOut');
      if (out) out.textContent = '55%';
      document.querySelectorAll('[data-wings]').forEach(function (x) {
        var on = x.getAttribute('data-wings') === 'none';
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      paintBench();
    });
  }

  if (heroCanvas) drawBeast(heroCanvas, { body: 'jaguar', palette: 'copal', wings: 'moth', density: 50 });

  document.querySelectorAll('canvas.piece-canvas').forEach(function (c) {
    drawBeast(c, {
      body: c.getAttribute('data-body') || 'jaguar',
      palette: c.getAttribute('data-palette') || 'copal',
      wings: c.getAttribute('data-wings') || 'none',
      density: Number(c.getAttribute('data-density') || 55)
    });
  });

  paintBench();

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('beastForm');
  if (form) {
    var status = document.getElementById('beastStatus');
    var showError = function (field, message) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      if (wrap) wrap.classList.toggle('invalid', Boolean(message));
      if (err) err.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var interest = form.elements.interest;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var problems = 0;
      if (!name.value.trim() || name.value.trim().length < 2) { showError(name, 'A name, please'); problems++; } else showError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { showError(email, 'Check the email address'); problems++; } else showError(email, '');
      if (!interest.value) { showError(interest, 'Choose what this is about'); problems++; } else showError(interest, '');
      if (!message.value.trim() || message.value.trim().length < 10) { showError(message, 'A sentence about what you have in mind'); problems++; } else showError(message, '');
      if (!consent.checked) { showError(consent, 'Please tick this so we can reply'); problems++; } else showError(consent, '');
      if (status) {
        if (problems) {
          status.className = 'form-status bad';
          status.textContent = problems + (problems === 1 ? ' answer needs attention above.' : ' answers need attention above.');
        } else {
          form.reset();
          document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
          document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
          status.className = 'form-status ok';
          status.textContent = 'Written down. Nadia answers enquiries on Tuesdays and Fridays, Mexico City time.';
        }
      }
    });
    form.addEventListener('reset', function () {
      document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
    });
  }

  window.__drawBeast = drawBeast;
})();
