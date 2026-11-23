// Resham Care — weave diagram, treatment planner, navigation.
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- weave plate ---------- */
  var canvas = document.getElementById('weaveCanvas');
  var caption = document.getElementById('plateCaption');
  var captionText = {
    brocade: 'Silk brocade · satin ground, 2/1 float',
    ikat: 'Double ikat · plain weave, resist-dyed warp',
    painted: 'Painted cotton · plain weave, iron-gall outline'
  };
  var mode = 'brocade';

  function ink(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawWeave() {
    if (!canvas) return;
    var host = canvas.parentElement;
    var cssW = host.clientWidth;
    var cssH = Math.max(200, Math.round(cssW * 0.62));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var paper = ink('--paper-2') || '#efe8d9';
    var line = ink('--line') || 'rgba(34,31,26,.16)';
    var inkC = ink('--ink') || '#221f1a';
    var indigo = ink('--indigo') || '#2b3a55';
    var madder = ink('--madder') || '#8b3a2c';
    var gold = '#b08a3e';

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // faint plate grid
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (var gx = 0.5; gx < cssW; gx += 28) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, cssH); ctx.stroke();
    }
    for (var gy = 0.5; gy < cssH; gy += 28) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cssW, gy); ctx.stroke();
    }

    var padX = 30, padY = 34;
    var w = cssW - padX * 2;
    var h = cssH - padY * 2 - 16;
    var step = Math.max(9, Math.round(w / 30));
    var cols = Math.floor(w / step);
    var rows = Math.floor(h / step);
    var x0 = padX + (w - cols * step) / 2 + step / 2;
    var y0 = padY + (h - rows * step) / 2 + step / 2;

    // cloth ground tint
    ctx.fillStyle = mode === 'painted' ? 'rgba(255,252,244,.85)' : mode === 'ikat' ? 'rgba(43,58,85,.05)' : 'rgba(176,138,62,.06)';
    ctx.fillRect(x0 - step / 2, y0 - step / 2, cols * step, rows * step);

    // warp (vertical)
    for (var c = 0; c < cols; c++) {
      var x = x0 + c * step;
      ctx.beginPath();
      for (var yy = 0; yy <= rows * step; yy += 2) {
        var wob = Math.sin((yy / step) * 1.7 + c * 0.9) * 0.7;
        if (yy === 0) ctx.moveTo(x + wob, y0 - step / 2 + yy);
        else ctx.lineTo(x + wob, y0 - step / 2 + yy);
      }
      ctx.strokeStyle = mode === 'ikat' && (c % 7 === 3) ? madder : indigo;
      ctx.globalAlpha = mode === 'painted' ? 0.18 : 0.32;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // weft (horizontal) with interlacing
    for (var r = 0; r < rows; r++) {
      var y = y0 + r * step;
      var brokenBand = mode === 'brocade' && r >= Math.round(rows * 0.58) && r <= Math.round(rows * 0.58) + 2;
      var zariBand = mode === 'brocade' && (r === 2 || r === 3 || r === rows - 4);
      ctx.strokeStyle = zariBand ? gold : inkC;
      ctx.globalAlpha = zariBand ? 0.9 : mode === 'painted' ? 0.22 : 0.42;
      ctx.lineWidth = zariBand ? 1.6 : 1.1;
      for (var cc = 0; cc < cols; cc++) {
        var cx = x0 + cc * step;
        // satin: weft floats over four warps, then dips
        var over = mode === 'brocade' ? (cc + r) % 4 !== 0 : (cc + r) % 2 === 0;
        if (mode === 'painted') over = (r % 2 === 0) ? (cc % 2 === 0) : (cc % 2 === 1);
        if (!over) continue;
        if (brokenBand && cc > 3 && cc < cols - 4) {
          // shattered: short dashes with gaps
          if (cc % 3 === 0) continue;
          ctx.beginPath();
          ctx.moveTo(cx - step * 0.32, y + Math.sin(cc) * 0.6);
          ctx.lineTo(cx + step * 0.3, y + Math.cos(cc) * 0.6);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(cx - step * 0.5, y);
          ctx.lineTo(cx + step * 0.5, y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // ikat pattern blocks
    if (mode === 'ikat') {
      var bw = Math.floor(cols / 4), bh = Math.floor(rows / 3);
      for (var br = 0; br < 3; br++) {
        for (var bc = 0; bc < 4; bc++) {
          if ((br + bc) % 2) continue;
          var bx = x0 + bc * bw * step - step / 2 + step * 0.6;
          var by = y0 + br * bh * step - step / 2 + step * 0.6;
          ctx.strokeStyle = madder;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(bx, by, bw * step - step * 1.2, bh * step - step * 1.2);
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = madder;
          ctx.fillRect(bx, by, bw * step - step * 1.2, bh * step - step * 1.2);
          ctx.globalAlpha = 1;
        }
      }
    }

    // painted cotton: kalamkari outlines
    if (mode === 'painted') {
      ctx.strokeStyle = inkC;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.75;
      var cx0 = x0 + cols * step * 0.22, cy0 = y0 + rows * step * 0.2;
      var rr = Math.min(cols, rows) * step * 0.3;
      ctx.beginPath();
      ctx.arc(cx0, cy0, rr, 0, Math.PI * 2);
      ctx.stroke();
      for (var p = 0; p < 12; p++) {
        var a = (p / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx0 + Math.cos(a) * rr * 0.35, cy0 + Math.sin(a) * rr * 0.35);
        ctx.quadraticCurveTo(cx0 + Math.cos(a + 0.3) * rr * 0.85, cy0 + Math.sin(a + 0.3) * rr * 0.85, cx0 + Math.cos(a) * rr * 0.98, cy0 + Math.sin(a) * rr * 0.98);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx0 + rr * 0.2, cy0 + rr * 0.5);
      ctx.bezierCurveTo(cx0 + rr * 0.5, cy0 + rr * 1.6, cx0 + rr * 1.4, cy0 + rr * 1.5, cx0 + rr * 1.6, cy0 + rr * 2.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // frame + scale bar
    ctx.strokeStyle = indigo;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 - step / 2 - 0.5, y0 - step / 2 - 0.5, cols * step + 1, rows * step + 1);
    ctx.globalAlpha = 1;

    var barY = cssH - 16;
    ctx.strokeStyle = inkC;
    ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.moveTo(padX, barY); ctx.lineTo(padX + 46, barY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padX, barY - 3); ctx.lineTo(padX, barY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padX + 46, barY - 3); ctx.lineTo(padX + 46, barY + 3); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = inkC;
    ctx.globalAlpha = 0.6;
    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillText('10 mm', padX + 54, barY + 3);
    ctx.globalAlpha = 1;
  }

  var switches = document.querySelectorAll('.plate-switch button');
  switches.forEach(function (btn) {
    btn.addEventListener('click', function () {
      mode = btn.getAttribute('data-weave');
      switches.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      if (caption) caption.textContent = captionText[mode];
      drawWeave();
    });
  });

  if (canvas) {
    drawWeave();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(drawWeave, 160);
    });
  }

  /* ---------- treatment planner ---------- */
  var TEXTILES = {
    banarasi: { label: 'Banarasi kadhwa silk sari', base: 38000, weeks: 6, fragility: 1.05, fibre: 'silk', dyeRisk: 2, metal: true, painted: false },
    baluchari: { label: 'Baluchari silk sari', base: 32000, weeks: 5, fragility: 1.1, fibre: 'silk', dyeRisk: 2, metal: false, painted: false },
    patola: { label: 'Patan patola, double ikat', base: 46000, weeks: 8, fragility: 1.25, fibre: 'silk', dyeRisk: 3, metal: false, painted: false },
    zari: { label: 'Zari brocade on silk', base: 42000, weeks: 7, fragility: 1.15, fibre: 'silk', dyeRisk: 1, metal: true, painted: false },
    kalamkari: { label: 'Kalamkari painted cotton', base: 28000, weeks: 5, fragility: 0.9, fibre: 'cotton', dyeRisk: 3, metal: false, painted: true },
    pichwai: { label: 'Pichwai painted cotton', base: 34000, weeks: 7, fragility: 0.95, fibre: 'cotton', dyeRisk: 2, metal: false, painted: true },
    bandhani: { label: 'Bandhani tie-dyed odhani', base: 22000, weeks: 4, fragility: 0.85, fibre: 'cotton', dyeRisk: 3, metal: false, painted: false }
  };
  var AGE = { pre1900: 1.15, mid: 1, late: 0.85, now: 0.7 };
  var FLAG_W = { shattered: 20, dye: 18, metal: 16, insect: 14, repair: 8, crease: 6 };
  var INTENT = {
    store: { label: 'store', weeks: 0 },
    study: { label: 'study', weeks: 0 },
    short: { label: 'six weeks', weeks: 6 },
    long: { label: 'six months', weeks: 26 }
  };

  var form = document.getElementById('plannerForm');
  var outTitle = document.getElementById('outTitle');
  var outStamp = document.getElementById('outStamp');
  var outScore = document.getElementById('outScore');
  var outWeeks = document.getElementById('outWeeks');
  var outCost = document.getElementById('outCost');
  var outLife = document.getElementById('outLife');
  var outSteps = document.getElementById('outSteps');
  var outNote = document.getElementById('outNote');
  var luxFill = document.getElementById('luxFill');
  var luxUsed = document.getElementById('luxUsed');

  function rupees(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function selectedFlags() {
    if (!form) return [];
    return Array.prototype.slice.call(form.querySelectorAll('input[name="flag"]:checked')).map(function (i) { return i.value; });
  }

  function update() {
    if (!form) return;
    var t = TEXTILES[form.textile.value], ageKey = form.age.value, intent = INTENT[form.intent.value];
    var hours = Number(form.hours.value);
    var flags = selectedFlags();
    var age = AGE[ageKey];

    var sum = flags.reduce(function (s, f) { return s + (FLAG_W[f] || 0); }, 0) * age;
    var score = Math.max(12, Math.min(97, Math.round(100 - sum * t.fragility)));

    var priority, stampClass;
    if (score >= 78) { priority = 'Monitor'; stampClass = 'ok'; }
    else if (score >= 55) { priority = 'Within 6 months'; stampClass = 'warn'; }
    else { priority = 'Immediate'; stampClass = ''; }

    var weeks = t.weeks + Math.ceil(sum * 0.14);
    var cost = Math.round((t.base * (1 + 0.055 * sum)) / 500) * 500;
    var life = Math.max(10, Math.min(30, Math.round((32 - sum * 0.72) / 5) * 5));

    var steps = [];
    if (flags.indexOf('insect') > -1) {
      steps.push('Seal and freeze at −20 °C for seven days, twice, before the object enters the bench.');
    } else {
      steps.push('Photograph at 1:1 and draw the condition map before anything is moved.');
    }
    steps.push(t.dyeRisk >= 2 ? 'Blotter-test every colour on a hidden seam; no moisture until the test is read.'
      : 'Confirm fibre with a burn test and check the pH of the soil.');

    if (t.metal || flags.indexOf('metal') > -1) {
      steps.push('Dry clean only: soft brush and smoke sponge. No water and no solvent over metal thread.');
    } else if (t.painted) {
      steps.push('Suction-table clean with localised humidification; the ground is painted, so no immersion.');
    } else if (flags.indexOf('dye') > -1 || t.dyeRisk >= 3) {
      steps.push('Surface clean only. The dye is fugitive and will walk into the ground.');
    } else {
      steps.push('Wet clean in soft water at 28 °C, non-ionic surfactant, pH 7.5, two rinses.');
    }

    if (flags.indexOf('shattered') > -1) steps.push('Couch shattered weft to a dyed silk crepeline with hair silk, working from the reverse.');
    if (flags.indexOf('metal') > -1) steps.push('Stabilise corrosion under the microscope with 3% Paraloid B-72 in acetone, dry.');
    if (flags.indexOf('repair') > -1) steps.push('Document the old repairs and leave those that still hold; reverse only staining ones.');
    if (flags.indexOf('crease') > -1) steps.push('Humidify at 45–50% RH and weight the creases flat, one at a time, over a week.');

    if (intent.weeks === 0) steps.push('Box in unbuffered tissue with padded folds; check every six months.');
    else if (intent.weeks <= 6) steps.push('Mount at 30° and show at 50 lux behind UV-filtering glazing, six weeks maximum.');
    else steps.push('Mount, show at 50 lux, and rotate with another object every twelve weeks.');
    steps.push('Deliver the report with the 1:1 map and a one-page care sheet for the owner.');

    // light budget
    var luxHours = intent.weeks * 7 * hours * 50;
    var pct = Math.round((luxHours / 50000) * 100);
    var fill = Math.min(100, pct);
    if (luxFill) {
      luxFill.style.width = fill + '%';
      luxFill.classList.toggle('over', pct > 100);
    }
    if (luxUsed) luxUsed.textContent = 'Annual light budget · ' + pct + '%';

    if (outTitle) outTitle.textContent = t.label;
    if (outStamp) {
      outStamp.textContent = priority;
      outStamp.className = 'stamp ' + stampClass;
    }
    if (outScore) outScore.innerHTML = score + ' <small>/ 100</small>';
    if (outWeeks) outWeeks.innerHTML = weeks + ' <small>weeks</small>';
    if (outCost) outCost.textContent = rupees(cost);
    if (outLife) outLife.innerHTML = life + ' <small>years +</small>';
    if (outSteps) {
      outSteps.innerHTML = '';
      steps.slice(0, 7).forEach(function (s) {
        var li = document.createElement('li'); li.textContent = s; outSteps.appendChild(li);
      });
    }
    if (outNote) {
      var band = rupees(Math.round(cost * 0.86 / 500) * 500) + '–' + rupees(Math.round(cost * 1.18 / 500) * 500);
      var budgetLine = intent.weeks === 0
        ? 'No display time is spent; keep the box under 50 lux whenever it is open.'
        : 'Displaying for ' + intent.label + ' at ' + hours + ' hours a day spends ' + luxHours.toLocaleString('en-IN') + ' lux-hours, ' + (pct > 100 ? 'over the annual allowance — rotate it' : 'about ' + pct + '% of the annual allowance') + '.';
      outNote.innerHTML = '<strong>Estimate band ' + band + '.</strong> ' + budgetLine + ' Treatment estimate, not a quotation.';
    }
  }

  if (form) {
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); update(); });
    update();
  }

  /* ---------- contact form (contact page) ---------- */
  var cform = document.getElementById('contactForm');
  if (cform) {
    var status = document.getElementById('formStatus');
    var ok = document.getElementById('formOk');
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = cform.elements.name.value.trim();
      var email = cform.elements.email.value.trim();
      var msg = cform.elements.message.value.trim();
      var err = '';
      if (name.length < 2) err = 'Please add your name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'That email address looks incomplete.';
      else if (msg.length < 20) err = 'Tell me a little more — at least a couple of sentences.';
      if (err) {
        status.textContent = err;
        status.classList.remove('ok');
        ok.classList.remove('show');
        return;
      }
      status.textContent = 'Received. I answer emails on weekday mornings.';
      status.classList.add('ok');
      ok.classList.add('show');
      ok.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your note is logged as enquiry RC–' + String(Date.now()).slice(-4) + '. A reply comes within two working days, and no textile should be posted until I have seen the photographs.';
      cform.reset();
    });
  }
})();
