/* Paleobotanist Amber — Sofia Marchetti
   Canvas 1: a polished amber specimen with inclusions (plate drawing).
   Canvas 2: CO2 against stomatal density with an uncertainty band.
   Canvas 3 (inline SVG): selected inclusion.
   No audio. */

(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- contact form ---------- */

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var status = document.getElementById('formStatus');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.elements.namedItem('name');
      var email = contactForm.elements.namedItem('email');
      var message = contactForm.elements.namedItem('message');
      var ok = true;
      [name, email, message].forEach(function (field) {
        if (!field) return;
        var bad = !field.value.trim() || (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value));
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!status) return;
      status.classList.add('is-visible');
      if (!ok) {
        status.classList.add('is-error');
        status.textContent = 'Check the name, email and message — nothing was drafted.';
        return;
      }
      status.classList.remove('is-error');
      status.textContent = 'Draft ready, ' + name.value.trim().split(/\s+/)[0] + '. Nothing was transmitted: copy the text into an email to sofia@amberlab.es.';
      contactForm.reset();
    });
  }

  function fit(canvas, logicalW, logicalH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(w / logicalW, 0, 0, h / logicalH, 0, 0);
    return ctx;
  }

  /* ---------- plate: amber specimen ---------- */

  var amber = document.getElementById('amberCanvas');

  function amberShape(c) {
    c.beginPath();
    c.moveTo(150, 210);
    c.bezierCurveTo(190, 90, 330, 60, 430, 92);
    c.bezierCurveTo(540, 126, 610, 210, 600, 330);
    c.bezierCurveTo(590, 448, 500, 540, 370, 548);
    c.bezierCurveTo(250, 556, 168, 480, 148, 372);
    c.bezierCurveTo(134, 300, 138, 248, 150, 210);
    c.closePath();
  }

  function drawAmber() {
    if (!amber) return;
    var W = 760, H = 620;
    var c = fit(amber, W, H);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#efe2ca';
    c.fillRect(0, 0, W, H);

    // plate grid
    c.strokeStyle = 'rgba(36,26,17,0.05)';
    c.lineWidth = 1;
    for (var gx = 40; gx < W; gx += 40) {
      c.beginPath();
      c.moveTo(gx, 0);
      c.lineTo(gx, H);
      c.stroke();
    }
    for (var gy = 40; gy < H; gy += 40) {
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(W, gy);
      c.stroke();
    }

    // shadow
    c.save();
    c.translate(8, 14);
    amberShape(c);
    c.fillStyle = 'rgba(70, 46, 20, 0.16)';
    c.filter = 'blur(10px)';
    c.fill();
    c.restore();
    c.filter = 'none';

    // body
    amberShape(c);
    var grad = c.createLinearGradient(140, 100, 620, 560);
    grad.addColorStop(0, '#e2b467');
    grad.addColorStop(0.32, '#cf9240');
    grad.addColorStop(0.62, '#b0702a');
    grad.addColorStop(0.85, '#8c5318');
    grad.addColorStop(1, '#6d3f10');
    c.fillStyle = grad;
    c.fill();
    c.strokeStyle = 'rgba(70, 42, 12, 0.55)';
    c.lineWidth = 2.2;
    c.stroke();

    // inner flow lines
    c.save();
    amberShape(c);
    c.clip();
    c.strokeStyle = 'rgba(255, 226, 168, 0.28)';
    c.lineWidth = 1.4;
    for (var i = 0; i < 9; i++) {
      c.beginPath();
      c.moveTo(120, 250 + i * 28);
      c.bezierCurveTo(260, 220 + i * 26, 420, 300 + i * 20, 640, 250 + i * 24);
      c.stroke();
    }
    // darker core region
    var core = c.createRadialGradient(380, 330, 20, 380, 330, 220);
    core.addColorStop(0, 'rgba(90, 52, 14, 0.22)');
    core.addColorStop(1, 'rgba(90, 52, 14, 0)');
    c.fillStyle = core;
    c.fillRect(100, 80, 560, 500);

    // surface highlight
    c.beginPath();
    c.ellipse(300, 200, 150, 70, -0.5, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255, 240, 205, 0.30)';
    c.fill();
    c.restore();

    // cracks
    c.save();
    amberShape(c);
    c.clip();
    c.strokeStyle = 'rgba(255, 236, 190, 0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(238, 180);
    c.bezierCurveTo(300, 220, 280, 300, 340, 340);
    c.bezierCurveTo(390, 372, 420, 430, 470, 470);
    c.stroke();
    c.beginPath();
    c.moveTo(470, 470);
    c.lineTo(520, 520);
    c.stroke();
    c.restore();

    // inclusions: bubbles
    var bubbles = [[270, 420, 16], [312, 444, 9], [238, 452, 7], [530, 300, 12], [556, 336, 6]];
    bubbles.forEach(function (b) {
      c.beginPath();
      c.arc(b[0], b[1], b[2], 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 240, 205, 0.20)';
      c.fill();
      c.strokeStyle = 'rgba(90, 54, 16, 0.5)';
      c.lineWidth = 1;
      c.stroke();
      c.beginPath();
      c.arc(b[0] - b[2] * 0.3, b[1] - b[2] * 0.35, b[2] * 0.28, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 248, 226, 0.7)';
      c.fill();
    });

    // conifer hairs
    c.strokeStyle = 'rgba(70, 42, 14, 0.62)';
    c.lineWidth = 1.6;
    for (var h = 0; h < 4; h++) {
      var hx = 330 + h * 13;
      var hy = 300 + h * 4;
      c.beginPath();
      c.moveTo(hx, hy);
      c.bezierCurveTo(hx + 26, hy - 18, hx + 54, hy - 8, hx + 82, hy - 26);
      c.stroke();
    }

    // wasp
    var wx = 452, wy = 244;
    c.save();
    c.translate(wx, wy);
    c.rotate(0.38);
    // wings
    c.beginPath();
    c.ellipse(-2, -18, 34, 11, -0.5, 0, Math.PI * 2);
    c.fillStyle = 'rgba(246, 236, 210, 0.55)';
    c.fill();
    c.strokeStyle = 'rgba(70, 42, 14, 0.5)';
    c.lineWidth = 0.9;
    c.stroke();
    c.beginPath();
    c.ellipse(2, 12, 27, 8, 0.4, 0, Math.PI * 2);
    c.fillStyle = 'rgba(246, 236, 210, 0.45)';
    c.fill();
    c.stroke();
    // body
    c.beginPath();
    c.ellipse(-14, 0, 9, 7, 0.1, 0, Math.PI * 2);
    c.fillStyle = '#3d2812';
    c.fill();
    c.beginPath();
    c.ellipse(2, 0, 13, 9, 0.1, 0, Math.PI * 2);
    c.fillStyle = '#2f1e0c';
    c.fill();
    // stripes
    c.strokeStyle = 'rgba(200, 150, 90, 0.65)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-2, -8);
    c.lineTo(-2, 8);
    c.moveTo(5, -8.6);
    c.lineTo(5, 8.6);
    c.stroke();
    // head and antennae
    c.beginPath();
    c.arc(-26, -1, 5.5, 0, Math.PI * 2);
    c.fillStyle = '#2a1a0a';
    c.fill();
    c.strokeStyle = '#2a1a0a';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-30, -4);
    c.bezierCurveTo(-40, -12, -44, -18, -54, -22);
    c.stroke();
    c.beginPath();
    c.moveTo(-30, 1);
    c.bezierCurveTo(-42, -4, -48, -6, -58, -8);
    c.stroke();
    // legs
    c.lineWidth = 0.9;
    for (var l = 0; l < 3; l++) {
      c.beginPath();
      c.moveTo(-6 + l * 7, 7);
      c.lineTo(-10 + l * 8, 17);
      c.lineTo(-2 + l * 8, 22);
      c.stroke();
    }
    // ovipositor
    c.beginPath();
    c.moveTo(14, 0);
    c.lineTo(34, 2);
    c.stroke();
    c.restore();

    // annotation leaders
    function leader(x1, y1, x2, y2, label, align) {
      c.strokeStyle = 'rgba(36, 26, 17, 0.5)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
      c.beginPath();
      c.arc(x1, y1, 2, 0, Math.PI * 2);
      c.fillStyle = '#241a11';
      c.fill();
      c.fillStyle = '#3c2d1c';
      c.font = '16px "DM Mono", monospace';
      c.textAlign = align || 'left';
      c.textBaseline = 'middle';
      c.fillText(label, x2 + (align === 'right' ? -6 : 6), y2);
    }
    leader(452, 244, 566, 184, 'Hymenoptera 2.1 mm');
    leader(372, 292, 586, 278, 'conifer hairs');
    leader(270, 420, 128, 474, 'gas bubble', 'right');
    leader(470, 470, 568, 512, 'crack');
    leader(340, 340, 178, 300, 'resin flow', 'right');

    // scale bar
    c.strokeStyle = '#3c2d1c';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(70, 580);
    c.lineTo(190, 580);
    c.moveTo(70, 575);
    c.lineTo(70, 585);
    c.moveTo(190, 575);
    c.lineTo(190, 585);
    c.stroke();
    c.fillStyle = '#3c2d1c';
    c.font = '13px "DM Mono", monospace';
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillText('10 mm', 74, 572);

    c.fillStyle = '#6b5840';
    c.font = '13px "DM Mono", monospace';
    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillText('cut and polished · transmitted light', W - 26, 20);
  }

  if (amber) {
    drawAmber();
    if ('ResizeObserver' in window) new ResizeObserver(drawAmber).observe(amber);
    else window.addEventListener('resize', drawAmber);
  }

  /* ---------- proxy + inspector ---------- */

  var proxyCanvas = document.getElementById('proxyCanvas');
  var proxyForm = document.getElementById('proxyForm');
  if (!proxyCanvas || !proxyForm) return;

  var GROUPS = {
    frenelopsis: { sdRef: 190, siRef: 12.2, co2Ref: 560, kSD: 1.0, kSI: 1.15, label: 'Frenelopsis' },
    pagiophyllum: { sdRef: 214, siRef: 14.0, co2Ref: 560, kSD: 1.1, kSI: 1.2, label: 'Pagiophyllum' },
    ginkgo: { sdRef: 158, siRef: 10.6, co2Ref: 560, kSD: 1.25, kSI: 1.3, label: 'Ginkgo' },
    angiosperm: { sdRef: 242, siRef: 16.4, co2Ref: 560, kSD: 0.9, kSI: 0.95, label: 'early angiosperm' }
  };

  var HORIZONS = {
    escucha: { name: 'Escucha Fm., early Aptian', age: '113 Ma' },
    'uclés': { name: 'Utrillas Fm., late Aptian', age: '110 Ma' },
    wealden: { name: 'Wealden, Barremian', age: '128 Ma' }
  };

  var el = {
    group: document.getElementById('leafGroup'),
    sd: document.getElementById('sd'),
    si: document.getElementById('si'),
    horizon: document.getElementById('horizon')
  };
  var out = {
    sd: document.getElementById('sdOut'),
    si: document.getElementById('siOut'),
    co2: document.getElementById('co2Out'),
    note: document.getElementById('proxyNote'),
    tag: document.getElementById('chartTag')
  };

  var SPECIMENS = [
    {
      id: 'MCNA-2214', title: 'Hymenopteran in amber', taxon: 'Hymenoptera, Apocrita',
      size: '2.1 mm body length', site: 'Escucha Fm., Álava', scan: 'Synchrotron µCT, ALBA BL20',
      note: 'A small parasitoid wasp, preserved with one wing partly open. The ovipositor is visible in the µCT reconstruction but not in the polished surface.',
      glyph: 'wasp'
    },
    {
      id: 'MCNA-0881', title: 'Conifer pollen cluster', taxon: 'Classopollis sp.',
      size: '46 grains, 18–24 µm', site: 'Escucha Fm., Álava', scan: 'Light microscopy, 1,000×',
      note: 'A pollen cluster caught on a resin surface while still in its tetrad stage. Classopollis is the characteristic pollen of the cheirolepid conifers that produced most of this amber.',
      glyph: 'pollen'
    },
    {
      id: 'MCNA-3140', title: 'Basal eudicot flower', taxon: 'Angiospermae, eudicot',
      size: '4.1 mm diameter', site: 'Utrillas Fm., Álava', scan: 'Synchrotron µCT, ALBA BL20',
      note: 'A five-parted flower with in-situ pollen, reconstructed from 1,040 slice images. The pollen places it among the basal eudicots and pushes the group back in Iberia by six million years.',
      glyph: 'flower'
    },
    {
      id: 'MCNA-1207', title: 'Feather barb', taxon: 'Maniraptora, contour feather',
      size: '3.6 mm fragment', site: 'Escucha Fm., Álava', scan: 'Reflected light, 400×',
      note: 'A fragment of a contour feather with preserved barbules. The melanosome pattern suggests a dark, iridescent sheen rather than a plain brown.',
      glyph: 'feather'
    },
    {
      id: 'MCNA-4002', title: 'Mite on a beetle', taxon: 'Acari, Mesostigmata',
      size: '0.4 mm on 3.1 mm beetle', site: 'Escucha Fm., Álava', scan: 'Synchrotron µCT, ALBA BL20',
      note: 'A phoretic mite attached to the underside of a beetle. The pair records a behaviour — hitchhiking — that is otherwise almost invisible in the fossil record.',
      glyph: 'mite'
    }
  ];

  var GLYPHS = {
    wasp: '<path d="M100 76c-14 0-24-8-24-18 0-8 8-14 18-14h20c12 0 20 6 20 15 0 10-10 17-24 17z" fill="#7a4a18" opacity=".55"/><ellipse cx="88" cy="58" rx="7" ry="5" fill="#2f1e0c"/><ellipse cx="104" cy="58" rx="11" ry="7" fill="#2f1e0c"/><path d="M96 51v14M104 50v15" stroke="#c9965a" stroke-width="1.2"/><path d="M80 54l-12-8M80 59l-14-3" stroke="#2f1e0c" stroke-width=".8"/><ellipse cx="104" cy="42" rx="22" ry="7" fill="none" stroke="#5a3a12" stroke-width=".8" opacity=".7"/><path d="M120 58l18 2" stroke="#2f1e0c" stroke-width=".8"/>',
    pollen: '<g fill="#8a5a20">' + Array.from({ length: 14 }, function (_, i) {
      var a = i / 14 * Math.PI * 2;
      var r = 30 + (i % 3) * 9;
      return '<circle cx="' + (100 + Math.cos(a) * r.toFixed(1)) + '" cy="' + (75 + Math.sin(a) * r * 0.7).toFixed(1) + '" r="5.5"/>';
    }).join('') + '</g><circle cx="100" cy="75" r="5" fill="#5a3a12"/>',
    flower: '<g stroke="#5a3a12" stroke-width="1" fill="#c98b3e" opacity=".9"><ellipse cx="100" cy="52" rx="13" ry="20"/><ellipse cx="100" cy="52" rx="13" ry="20" transform="rotate(72 100 75)"/><ellipse cx="100" cy="52" rx="13" ry="20" transform="rotate(144 100 75)"/><ellipse cx="100" cy="52" rx="13" ry="20" transform="rotate(216 100 75)"/><ellipse cx="100" cy="52" rx="13" ry="20" transform="rotate(288 100 75)"/></g><circle cx="100" cy="75" r="10" fill="#7a4a18"/><circle cx="100" cy="75" r="4" fill="#2f1e0c"/>',
    feather: '<path d="M50 105C70 60 110 40 150 38c-6 34-34 66-78 76z" fill="#d8b98a" stroke="#5a3a12" stroke-width="1"/><path d="M50 105L148 40" stroke="#5a3a12" stroke-width="1.4"/><g stroke="#8a6534" stroke-width=".7">' +
      Array.from({ length: 9 }, function (_, i) {
        return '<path d="M' + (62 + i * 9) + ' ' + (96 - i * 6) + 'l14-16"/>';
      }).join('') + '</g>',
    mite: '<ellipse cx="92" cy="78" rx="16" ry="11" fill="#5a3a12"/><ellipse cx="78" cy="78" rx="7" ry="6" fill="#3a2410"/><g stroke="#3a2410" stroke-width="1.2"><path d="M84 68l-6-10M96 67l2-12M108 68l8-9M84 88l-6 9M96 89l2 11M108 88l8 9"/></g><path d="M70 78h-10" stroke="#3a2410" stroke-width="1.2"/>'
  };

  var state = { spec: 0 };

  function group() { return GROUPS[el.group.value] || GROUPS.frenelopsis; }

  function estimate() {
    var g = group();
    var sd = parseFloat(el.sd.value);
    var si = parseFloat(el.si.value);
    var co2sd = g.co2Ref * Math.pow(sd / g.sdRef, -g.kSD);
    var co2si = g.co2Ref * Math.pow(si / g.siRef, -g.kSI);
    var co2 = Math.sqrt(co2sd * co2si);
    var err = co2 * 0.24;
    return { sd: sd, si: si, co2: co2, co2sd: co2sd, co2si: co2si, err: err, g: g };
  }

  function drawProxy(res) {
    var cssW = proxyCanvas.getBoundingClientRect().width || 900;
    var narrow = cssW < 560;
    var W = narrow ? 480 : 900;
    var H = narrow ? 520 : 420;
    var c = fit(proxyCanvas, W, H);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#f8f2e5';
    c.fillRect(0, 0, W, H);

    var padL = narrow ? 54 : 66;
    var padR = narrow ? 20 : 26;
    var padT = narrow ? 34 : 30;
    var padB = narrow ? 54 : 56;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var fs = narrow ? 12 : 11;

    var sdMin = 50, sdMax = 320, co2Min = 200, co2Max = 1800;
    function X(sd) { return padL + (sd - sdMin) / (sdMax - sdMin) * plotW; }
    function Y(co2) { return padT + plotH - (co2 - co2Min) / (co2Max - co2Min) * plotH; }

    // grid
    c.font = fs + 'px "DM Mono", monospace';
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    [200, 400, 800, 1200, 1600].forEach(function (v) {
      var y = Y(v);
      c.strokeStyle = 'rgba(36,26,17,0.10)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, y);
      c.lineTo(padL + plotW, y);
      c.stroke();
      c.fillStyle = '#8b7a63';
      c.fillText(String(v), padL - 8, y);
    });
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (var sd = 50; sd <= 320; sd += 45) {
      var x = X(sd);
      c.strokeStyle = 'rgba(36,26,17,0.05)';
      c.beginPath();
      c.moveTo(x, padT);
      c.lineTo(x, padT + plotH);
      c.stroke();
      c.fillStyle = '#8b7a63';
      c.fillText(String(sd), x, padT + plotH + 8);
    }

    // reference bands
    c.fillStyle = 'rgba(79,82,54,0.10)';
    c.fillRect(padL, Y(430), plotW, Y(380) - Y(430));
    c.fillStyle = '#4f5236';
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.font = fs - 1 + 'px "DM Mono", monospace';
    c.fillText('pre-industrial 280—420 ppm', padL + plotW - 6, Y(430) - 3);

    // uncertainty band
    var g = res.g;
    c.beginPath();
    for (var s1 = sdMin; s1 <= sdMax; s1 += 4) {
      var v1 = g.co2Ref * Math.pow(s1 / g.sdRef, -g.kSD) * 1.24;
      if (s1 === sdMin) c.moveTo(X(s1), Y(Math.min(co2Max, v1))); else c.lineTo(X(s1), Y(Math.min(co2Max, v1)));
    }
    for (var s2 = sdMax; s2 >= sdMin; s2 -= 4) {
      var v2 = g.co2Ref * Math.pow(s2 / g.sdRef, -g.kSD) * 0.76;
      c.lineTo(X(s2), Y(Math.max(co2Min, v2)));
    }
    c.closePath();
    c.fillStyle = 'rgba(165,100,31,0.12)';
    c.fill();

    // main curve
    c.beginPath();
    for (var s3 = sdMin; s3 <= sdMax; s3 += 2) {
      var v3 = g.co2Ref * Math.pow(s3 / g.sdRef, -g.kSD);
      var y3 = Y(Math.max(co2Min, Math.min(co2Max, v3)));
      if (s3 === sdMin) c.moveTo(X(s3), y3); else c.lineTo(X(s3), y3);
    }
    c.strokeStyle = '#a5641f';
    c.lineWidth = 2;
    c.lineJoin = 'round';
    c.stroke();

    // marker
    var mx = X(res.sd);
    var my = Y(Math.max(co2Min, Math.min(co2Max, res.co2)));
    c.save();
    c.strokeStyle = 'rgba(36,26,17,0.35)';
    c.setLineDash([3, 4]);
    c.beginPath();
    c.moveTo(mx, padT);
    c.lineTo(mx, padT + plotH);
    c.stroke();
    c.restore();
    c.beginPath();
    c.arc(mx, my, narrow ? 5 : 4.5, 0, Math.PI * 2);
    c.fillStyle = '#241a11';
    c.fill();
    c.beginPath();
    c.arc(mx, my, narrow ? 9 : 8, 0, Math.PI * 2);
    c.strokeStyle = '#a5641f';
    c.lineWidth = 1.4;
    c.stroke();

    // marker label
    var label = Math.round(res.co2) + ' ppm';
    c.font = fs + 'px "DM Mono", monospace';
    var tw = c.measureText(label).width;
    var lx = mx + 12;
    if (lx + tw > padL + plotW) lx = mx - tw - 12;
    if (lx < padL + 4) lx = padL + 4;
    var ly = Math.max(padT + 4, my - 30);
    c.fillStyle = 'rgba(248,242,229,0.94)';
    c.fillRect(lx - 4, ly - 2, tw + 8, 20);
    c.fillStyle = '#241a11';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(label, lx, ly);

    // titles
    c.fillStyle = '#574734';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = fs + 'px "DM Mono", monospace';
    c.fillText('CO₂, ppm', 12, 8);
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.fillText(narrow ? 'Stomatal density /mm²' : 'Stomatal density, per mm²', padL + plotW, H - 6);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = '#8b7a63';
    c.font = fs - 1 + 'px "DM Mono", monospace';
    c.textAlign = 'right';
    c.fillText(g.label + ' calibration', padL + plotW - 6, padT + 6);
    c.textAlign = 'left';
  }

  function renderSpecimen(i) {
    var s = SPECIMENS[i];
    state.spec = i;
    document.querySelectorAll('.spec-tab').forEach(function (tab, idx) {
      var active = idx === i;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    var svg = document.getElementById('specimenSvg');
    if (svg) {
      svg.setAttribute('aria-label', 'Schematic of ' + s.title);
      svg.innerHTML = '<rect width="200" height="150" fill="#efe2ca"/><circle cx="100" cy="75" r="60" fill="rgba(201,139,62,0.25)" stroke="rgba(90,58,20,0.35)"/>' + GLYPHS[s.glyph];
    }
    var set = function (id, text) { var n = document.getElementById(id); if (n) n.textContent = text; };
    set('specTitle', s.title);
    set('specTaxon', s.taxon);
    set('specSize', s.size);
    set('specSite', s.site);
    set('specScan', s.scan);
    set('specNote', s.note);
    set('inclusionCount', String(i + 1) + ' of 9,412 · ' + s.id);
  }

  function render() {
    var res = estimate();
    out.sd.textContent = Math.round(res.sd) + ' /mm²';
    out.si.textContent = res.si.toFixed(1) + '%';
    out.co2.textContent = String(Math.round(res.co2 / 10) * 10);
    out.note.textContent = 'Calibration: ' + res.g.label + ', SD-based ' + Math.round(res.co2sd) + ' ppm and SI-based ' + Math.round(res.co2si) + ' ppm; 2× standard error shown.';
    out.tag.textContent = res.g.label + ' · ' + HORIZONS[el.horizon.value].name;
    drawProxy(res);
  }

  ['input', 'change'].forEach(function (evt) {
    proxyForm.addEventListener(evt, function (e) {
      if (e.target.matches('input, select')) render();
    });
  });

  document.querySelectorAll('.spec-tab').forEach(function (tab, i) {
    tab.addEventListener('click', function () { renderSpecimen(i); });
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { drawProxy(estimate()); }).observe(proxyCanvas);
  } else {
    window.addEventListener('resize', function () { drawProxy(estimate()); });
  }

  render();
  renderSpecimen(0);

})();
