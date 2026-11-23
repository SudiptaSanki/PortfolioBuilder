/* Abyssal cave — survey reduction and cave-air box model
   No audio anywhere on this site. */
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.getElementById('profileCanvas')) initBench();

  function initBench() {
    var legs = [
      { L: 62, inc: -72, az: 348 },
      { L: 94, inc: -55, az: 12 },
      { L: 78, inc: -48, az: 305 },
      { L: 120, inc: -30, az: 40 }
    ];

    var el = {
      legs: document.getElementById('legs'),
      add: document.getElementById('addLeg'),
      remove: document.getElementById('removeLeg'),
      outDepth: document.getElementById('outDepth'),
      outLen: document.getElementById('outLen'),
      outReach: document.getElementById('outReach'),
      outEnd: document.getElementById('outEnd'),
      canvas: document.getElementById('profileCanvas'),
      profileFoot: document.getElementById('profileFoot'),
      depth: document.getElementById('depth'),
      volume: document.getElementById('volume'),
      exchange: document.getElementById('exchange'),
      depthOut: document.getElementById('depthOut'),
      volumeOut: document.getElementById('volumeOut'),
      exchangeOut: document.getElementById('exchangeOut'),
      outCo2: document.getElementById('outCo2'),
      outRn: document.getElementById('outRn'),
      outDose: document.getElementById('outDose'),
      outTurn: document.getElementById('outTurn'),
      outVerdict: document.getElementById('outVerdict'),
      co2Fill: document.getElementById('co2Fill'),
      rnFill: document.getElementById('rnFill'),
      co2Note: document.getElementById('co2Note'),
      rnNote: document.getElementById('rnNote')
    };

    function fmt(n, d) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
    }

    /* ---------- leg editor ---------- */
    function buildLegs() {
      // keep the header row, rebuild the rest
      var head = el.legs.querySelector('.leg-head');
      el.legs.innerHTML = '';
      el.legs.appendChild(head);
      legs.forEach(function (leg, i) {
        var row = document.createElement('div');
        row.className = 'leg';
        row.innerHTML =
          '<span>L' + (i + 1) + '</span>' +
          '<input type="number" inputmode="decimal" aria-label="Leg ' + (i + 1) + ' tape length in metres" value="' + leg.L + '" min="0" max="900" step="0.5">' +
          '<input type="number" inputmode="decimal" aria-label="Leg ' + (i + 1) + ' inclination in degrees" value="' + leg.inc + '" min="-90" max="90" step="1">' +
          '<input type="number" inputmode="decimal" aria-label="Leg ' + (i + 1) + ' azimuth in degrees" value="' + leg.az + '" min="0" max="360" step="1">';
        row.querySelectorAll('input').forEach(function (input, k) {
          input.addEventListener('input', function () {
            var v = parseFloat(input.value);
            if (isNaN(v)) v = 0;
            if (k === 0) leg.L = Math.max(0, Math.min(900, v));
            if (k === 1) leg.inc = Math.max(-90, Math.min(90, v));
            if (k === 2) leg.az = ((v % 360) + 360) % 360;
            update();
          });
        });
        el.legs.appendChild(row);
      });
    }

    /* ---------- survey maths ---------- */
    function reduce() {
      var e = 0, n = 0, z = 0, length = 0;
      var stations = [{ e: 0, n: 0, z: 0, d: 0 }];
      var along = 0;
      legs.forEach(function (leg) {
        var inc = leg.inc * Math.PI / 180;
        var az = leg.az * Math.PI / 180;
        var horiz = leg.L * Math.cos(inc);
        e += horiz * Math.sin(az);
        n += horiz * Math.cos(az);
        z -= leg.L * Math.sin(inc);
        length += leg.L;
        along += horiz;
        stations.push({ e: e, n: n, z: z, d: along });
      });
      var depth = Math.max.apply(null, stations.map(function (s) { return s.z; }));
      var reach = Math.sqrt(e * e + n * n);
      return { stations: stations, depth: depth, length: length, reach: reach, e: e, n: n, along: along };
    }

    /* ---------- profile drawing ---------- */
    function fitCanvas(c, aspect) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.max(260, c.clientWidth || 640);
      var h = Math.round(w / aspect);
      c.style.height = h + 'px';
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      var ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: ctx };
    }

    function draw(r) {
      var fit = fitCanvas(el.canvas, 1.58);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#1e1913';
      ctx.fillRect(0, 0, W, H);

      var padL = 52, padR = 132, padT = 26, padB = 26;
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var maxD = Math.max(40, Math.ceil((r.depth + 10) / 50) * 50);
      var maxX = Math.max(40, r.along * 1.05);

      function px(a) { return padL + (a / maxX) * plotW; }
      function py(z) { return padT + (z / maxD) * plotH; }
      var vert = (plotW / maxX) / (plotH / maxD);

      // grid
      ctx.strokeStyle = 'rgba(232,222,208,0.08)';
      ctx.lineWidth = 1;
      for (var gi = 1; gi <= 4; gi++) {
        var y = padT + (plotH * gi) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
        ctx.fillStyle = '#8a7a67';
        ctx.font = '9px "Martian Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('−' + Math.round((maxD * gi) / 4) + ' m', padL - 8, y + 3);
      }

      // surface line
      ctx.strokeStyle = 'rgba(232,222,208,0.35)';
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL + plotW, padT);
      ctx.stroke();

      // passage: the polyline from the stations
      ctx.strokeStyle = '#d99b3f';
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      r.stations.forEach(function (s, i) {
        var x = px(s.d), y = py(s.z);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // station dots
      r.stations.forEach(function (s, i) {
        var x = px(s.d), y = py(s.z);
        ctx.fillStyle = '#17130f';
        ctx.strokeStyle = '#d99b3f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // floor thickness hatch under the passage
      ctx.strokeStyle = 'rgba(217,155,63,0.16)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      r.stations.forEach(function (s, i) {
        var x = px(s.d), y = py(s.z) + 5;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // station labels on top of the passage
      ctx.font = '9px "Martian Mono", monospace';
      ctx.textAlign = 'left';
      r.stations.forEach(function (s, i) {
        if (i === r.stations.length - 1) return;
        var x = px(s.d), y = py(s.z);
        ctx.fillStyle = '#d8c9b2';
        ctx.fillText(i === 0 ? 'S0' : 'S' + i, x + 8, y + 18);
      });

      // labels
      ctx.fillStyle = '#8a7a67';
      ctx.font = '9px "Martian Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SECTION · horizontal scale ' + fmt(vert, 1) + '× vertical', padL, H - 8);
      ctx.textAlign = 'right';
      ctx.fillText('−' + fmt(r.depth, 0) + ' m', padL + plotW, padT - 8);
      ctx.textAlign = 'left';

      // plan inset
      var iw = 100, ih = 96;
      var ix = W - padR + 10, iy = padT;
      ctx.strokeStyle = 'rgba(232,222,208,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = '#8a7a67';
      ctx.font = '7px "Martian Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('PLAN', ix + 5, iy + 11);
      var maxE = Math.max(10, r.reach * 1.3);
      function qx(e) { return ix + iw / 2 + (e / maxE) * (iw / 2 - 10); }
      function qy(n) { return iy + ih / 2 - (n / maxE) * (ih / 2 - 12); }
      ctx.strokeStyle = 'rgba(217,155,63,0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      r.stations.forEach(function (s, i) {
        var x = qx(s.e), y = qy(s.n);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = '#e8ded0';
      ctx.beginPath();
      ctx.arc(qx(0), qy(0), 2, 0, Math.PI * 2);
      ctx.fill();

      el.profileFoot.textContent = 'Section drawn on the current legs. ' + r.stations.length +
        ' stations, ' + fmt(r.length, 0) + ' m of tape, ' + fmt(r.depth, 0) + ' m of vertical range.';
    }

    /* ---------- air box model ---------- */
    function air() {
      var depth = parseInt(el.depth.value, 10);
      var volume = parseInt(el.volume.value, 10);
      var q = parseInt(el.exchange.value, 10) / 1000;      // m³/s
      var outside = 420;

      var prodCo2 = 0.05 * (volume / 5000) * (1 + depth / 800);   // L/s
      var co2 = outside + (prodCo2 / 1000) / q * 1e6;             // ppm

      var surface = 12 * Math.pow(volume, 2 / 3);                 // m²
      var prodRn = 0.007 * surface * (1 + depth / 300);           // Bq/s
      var rn = prodRn / q;                                        // Bq/m³

      var hours = 800;
      var dose = rn * hours * 9e-6;                               // mSv/yr
      var turnover = volume / q / 3600;                           // hours

      el.depthOut.textContent = depth + ' m';
      el.volumeOut.textContent = fmt(volume, 0) + ' m³';
      el.exchangeOut.textContent = fmt(q, 3) + ' m³/s';

      el.outCo2.textContent = fmt(co2, 0) + ' ppm';
      el.outRn.textContent = fmt(rn, 0) + ' Bq/m³';
      el.outDose.textContent = fmt(dose, 1) + ' mSv/yr';
      el.outTurn.textContent = turnover > 99 ? fmt(turnover, 0) + ' h' : fmt(turnover, 1) + ' h';

      var verdict;
      var cls = 'ok';
      if (co2 > 30000 || rn > 3000) { verdict = 'Not workable without respiratory protection and a dosimeter'; cls = 'bad'; }
      else if (co2 > 10000) { verdict = 'Short visits only, monitor worn, no work at the far end'; cls = 'bad'; }
      else if (co2 > 5000 || rn > 1000) { verdict = 'Workable with a monitor and a rota for the guides'; cls = 'warn'; }
      else if (co2 > 2500 || rn > 300) { verdict = 'Workable; watch the July stagnation'; cls = 'warn'; }
      else { verdict = 'Workable for a normal survey day'; cls = 'ok'; }
      el.outVerdict.textContent = verdict;

      el.co2Fill.style.width = Math.max(1, Math.min(100, (co2 / 30000) * 100)) + '%';
      el.co2Fill.className = 'fill co2 ' + (co2 > 10000 ? 'bad' : co2 > 5000 ? 'warn' : '');
      el.rnFill.style.width = Math.max(1, Math.min(100, (rn / 3000) * 100)) + '%';
      el.rnFill.className = 'fill rn ' + (rn > 3000 ? 'bad' : rn > 1000 ? 'warn' : '');

      el.co2Note.textContent = co2 > 30000 ? 'Above the 3% ceiling: do not enter'
        : co2 > 10000 ? 'Above 1%: short exposure only'
          : co2 > 5000 ? 'Above the 8-hour limit of 5,000 ppm' : 'Below the 8-hour limit';
      el.co2Note.style.color = co2 > 5000 ? '#c65f3c' : '';
      el.rnNote.textContent = rn > 3000 ? 'Well above the action level'
        : rn > 300 ? 'Above the 300 Bq/m³ action level' : 'Below the action level';
      el.rnNote.style.color = rn > 300 ? '#d99b3f' : '';

      return cls;
    }

    function update() {
      var r = reduce();
      el.outDepth.textContent = fmt(r.depth, 0) + ' m';
      el.outLen.textContent = fmt(r.length, 0) + ' m';
      el.outReach.textContent = fmt(r.reach, 0) + ' m';
      el.outEnd.textContent = 'E ' + fmt(r.e, 0) + ' / N ' + fmt(r.n, 0) + ' m';
      draw(r);
      air();
    }

    el.add.addEventListener('click', function () {
      if (legs.length >= 8) return;
      legs.push({ L: 30, inc: -60, az: 0 });
      buildLegs();
      update();
    });
    el.remove.addEventListener('click', function () {
      if (legs.length <= 2) return;
      legs.pop();
      buildLegs();
      update();
    });

    [el.depth, el.volume, el.exchange].forEach(function (input) {
      input.addEventListener('input', air);
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { draw(reduce()); }, 120);
    });

    buildLegs();
    update();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fail(field, message) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.add('invalid');
      status.textContent = message;
      status.className = 'form-status err';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) { n.classList.remove('invalid'); });
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;

      if (!name.value.trim() || name.value.trim().length < 2) { fail(name, 'A name, please.'); name.focus(); return; }
      if (!emailRe.test(email.value.trim())) { fail(email, 'That address needs a domain after the @.'); email.focus(); return; }
      if (message.value.trim().length < 20) { fail(message, 'One more sentence: the cave, the passage, and what you need.'); message.focus(); return; }
      if (!consent.checked) { status.textContent = 'The consent box lets me reply to this address.'; status.className = 'form-status err'; consent.focus(); return; }
      status.textContent = 'Received. Meter loans are agreed by email and collected at the Sơn Trạch office.';
      status.className = 'form-status ok';
      form.reset();
    });

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
