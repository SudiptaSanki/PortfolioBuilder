/* Sena Okonjo — near-space platforms
   Navigation, atmospheric model, ascent profile canvas, forms. */

(function () {
  'use strict';

  /* ---------- navigation ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- standard atmosphere ---------- */

  var G = 9.80665, R = 287.05, RHO0 = 1.225, T0 = 288.15, P0 = 101325;

  var LAYERS = [
    { h: 0, T: 288.15, p: 101325, L: -0.0065 },
    { h: 11000, T: 216.65, p: 22632.1, L: 0 },
    { h: 20000, T: 216.65, p: 5474.89, L: 0.001 },
    { h: 32000, T: 228.65, p: 868.02, L: 0.0028 },
    { h: 47000, T: 270.65, p: 110.91, L: 0 }
  ];

  function atmosphere(h) {
    var i = LAYERS.length - 1;
    for (var k = 0; k < LAYERS.length; k++) {
      if (h < LAYERS[k].h) { i = k - 1; break; }
    }
    if (i < 0) i = 0;
    var b = LAYERS[i];
    var T, p;
    if (b.L === 0) {
      T = b.T;
      p = b.p * Math.exp((-G * (h - b.h)) / (R * b.T));
    } else {
      T = b.T + b.L * (h - b.h);
      p = b.p * Math.pow(T / b.T, -G / (b.L * R));
    }
    return { T: T, p: p, rho: p / (R * T) };
  }

  /* ---------- ascent model ---------- */

  var BALLOONS = {
    '800': { mass: 0.8, d0: 2.0, db: 10.4, name: '800 g' },
    '1600': { mass: 1.6, d0: 2.8, db: 13.0, name: '1600 g' },
    '3000': { mass: 3.0, d0: 3.6, db: 16.0, name: '3000 g' }
  };

  function vol(d) { return (4 / 3) * Math.PI * Math.pow(d / 2, 3); }

  var profile = document.getElementById('profileCanvas');

  if (profile) initAscent();

  function initAscent() {
    var fillEl = document.getElementById('fill');
    var payloadEl = document.getElementById('payload');
    var solarEl = document.getElementById('solar');
    var fillOut = document.getElementById('fillOut');
    var payloadOut = document.getElementById('payloadOut');
    var solarOut = document.getElementById('solarOut');
    var hint = document.getElementById('balloonHint');
    var note = document.getElementById('simNote');
    var outRate = document.getElementById('outRate');
    var outBurst = document.getElementById('outBurst');
    var outTime = document.getElementById('outTime');
    var outDia = document.getElementById('outDia');
    var outDrift = document.getElementById('outDrift');

    var state = { balloon: '1600', fill: 80, payload: 3, solar: 8 };
    var CD = 0.55;

    function model() {
      var b = BALLOONS[state.balloon];
      var vNom = vol(b.d0);
      var vFill = vNom * (state.fill / 100);
      var vGround = vFill * (T0 + state.solar) / T0;
      var mHe = 0.169 * vFill;
      var mSys = b.mass + state.payload;
      var vBurst = vol(b.db);

      var rhoBurst = RHO0 * vGround / vBurst;
      var burstAlt = null;
      for (var h = 0; h <= 45000; h += 25) {
        if (atmosphere(h).rho <= rhoBurst) { burstAlt = h; break; }
      }

      var netLift = RHO0 * vGround - (mHe + mSys);   // kg, constant below burst
      var rate = 0;
      if (netLift > 0) {
        var a0 = Math.PI * Math.pow((3 * vGround) / (4 * Math.PI), 2 / 3);
        rate = Math.sqrt((2 * G * netLift) / (CD * RHO0 * a0));
      }

      var time = null;
      if (burstAlt && netLift > 0) {
        time = 0;
        for (var y = 0; y < burstAlt; y += 100) {
          var at = atmosphere(y);
          var v = vGround * (RHO0 / at.rho);
          var a = Math.PI * Math.pow((3 * v) / (4 * Math.PI), 2 / 3);
          var vv = Math.sqrt((2 * G * netLift) / (CD * at.rho * a));
          time += 100 / vv;
        }
      }

      return {
        b: b, vGround: vGround, mHe: mHe, mSys: mSys, netLift: netLift,
        rate: rate, burstAlt: burstAlt, time: time, dia: b.db,
        drift: burstAlt ? 7 + (burstAlt / 1000) * 0.75 : 0
      };
    }

    function fmtTime(s) {
      var m = Math.round(s / 60);
      var h = Math.floor(m / 60);
      m = m % 60;
      return (h > 0 ? h + ' h ' : '') + m + ' min';
    }

    function update() {
      var r = model();

      fillOut.textContent = state.fill + '%';
      payloadOut.textContent = state.payload.toFixed(1) + ' kg';
      solarOut.textContent = '+' + state.solar + ' K';
      hint.textContent = r.b.d0.toFixed(1) + ' m at launch, ' + r.b.db.toFixed(1) + ' m at burst, ' + Math.round(vol(r.b.db)) + ' m³ envelope.';

      outRate.textContent = r.rate > 0 ? r.rate.toFixed(1) + ' m/s' : 'no lift';
      outBurst.textContent = r.burstAlt ? (r.burstAlt / 1000).toFixed(1) + ' km' : '—';
      outTime.textContent = r.time ? fmtTime(r.time) : '—';
      outDia.textContent = r.b.db.toFixed(1) + ' m';
      outDrift.textContent = r.burstAlt ? Math.round(r.drift) + ' m/s' : '—';

      if (r.netLift <= 0) {
        note.innerHTML = 'With ' + state.payload.toFixed(1) + ' kg of payload the train is heavier than the air it displaces. This balloon does not leave the ground: add fill, use a larger balloon, or shed mass.';
      } else if (r.burstAlt && r.burstAlt < 20000) {
        note.innerHTML = 'This flight bursts at ' + (r.burstAlt / 1000).toFixed(1) + ' km, below the useful ceiling. The balloon is over-filled or the payload too light; at ' + state.fill + '% fill the envelope reaches its limit too early.';
      } else if (r.solar > 15) {
        note.innerHTML = 'The gas is running ' + state.solar + ' K above ambient, so the balloon is already larger on the ground and bursts at ' + (r.burstAlt / 1000).toFixed(1) + ' km instead of higher. Heating buys ascent rate and costs ceiling.';
      } else {
        note.innerHTML = 'At ' + state.fill + '% fill the balloon reaches burst at ' + (r.burstAlt / 1000).toFixed(1) + ' km, ' + fmtTime(r.time) + ' after release. Free lift is ' + r.netLift.toFixed(1) + ' kg and the train drifts downrange at about ' + Math.round(r.drift) + ' m/s.';
      }

      draw(r);
    }

    document.querySelectorAll('[data-balloon]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.balloon = btn.getAttribute('data-balloon');
        document.querySelectorAll('[data-balloon]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === btn ? 'true' : 'false');
        });
        update();
      });
    });

    fillEl.addEventListener('input', function () { state.fill = parseInt(fillEl.value, 10); update(); });
    payloadEl.addEventListener('input', function () { state.payload = parseFloat(payloadEl.value); update(); });
    solarEl.addEventListener('input', function () { state.solar = parseInt(solarEl.value, 10); update(); });

    /* ---------- canvas ---------- */

    function draw(r) {
      var ctx = profile.getContext('2d');
      var rect = profile.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      profile.width = Math.max(1, Math.round(rect.width * dpr));
      profile.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var w = rect.width, h = rect.height;
      var L = 44, Rm = 92, T = 16, B = 30;
      var plotW = w - L - Rm, plotH = h - T - B;
      var maxKm = 40;

      ctx.clearRect(0, 0, w, h);

      var sky = ctx.createLinearGradient(0, T, 0, T + plotH);
      sky.addColorStop(0, '#16273a');
      sky.addColorStop(0.32, '#2f5d7c');
      sky.addColorStop(0.62, '#7fa5ba');
      sky.addColorStop(0.85, '#cbdde4');
      sky.addColorStop(1, '#eef3f5');
      ctx.fillStyle = sky;
      ctx.fillRect(L, T, plotW, plotH);

      function yOf(km) { return T + plotH * (1 - km / maxKm); }

      ctx.font = '9px "Spline Sans Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var km = 0; km <= maxKm; km += 5) {
        var y = yOf(km);
        ctx.fillStyle = '#a9b4bb';
        ctx.fillText(km === 0 ? '0' : km + '', L - 8, y);
        ctx.strokeStyle = 'rgba(251, 250, 247, 0.16)';
        ctx.beginPath();
        ctx.moveTo(L, y + 0.5);
        ctx.lineTo(L + plotW, y + 0.5);
        ctx.stroke();
      }
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#cbc5b6';
      ctx.beginPath();
      ctx.moveTo(L, T + plotH + 0.5);
      ctx.lineTo(L + plotW, T + plotH + 0.5);
      ctx.stroke();

      // tropopause
      var yTrop = yOf(11);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(251, 250, 247, 0.75)';
      ctx.beginPath();
      ctx.moveTo(L, yTrop);
      ctx.lineTo(L + plotW, yTrop);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#4b5760';
      ctx.fillText('tropopause 11 km', L + plotW + 10, yTrop);
      ctx.fillStyle = '#78838b';
      ctx.fillText('km', L - 8, T - 6);

      // ozone band
      ctx.fillStyle = 'rgba(251, 250, 247, 0.10)';
      ctx.fillRect(L, yOf(25), plotW, yOf(20) - yOf(25));
      ctx.fillStyle = '#4b5760';
      ctx.font = '8.5px "Spline Sans Mono", monospace';
      ctx.fillText('ozone 20–25 km', L + plotW + 10, yOf(22.5) + 3);

      // ground
      ctx.fillStyle = '#d9d3c4';
      ctx.fillRect(L, T + plotH - 3, plotW, 3);
      ctx.fillStyle = '#4b5760';
      ctx.font = '8.5px "Spline Sans Mono", monospace';
      ctx.fillText('Esrange', L + 6, T + plotH - 9);

      // ascent with drift
      var burstKm = r.burstAlt ? r.burstAlt / 1000 : 0;
      var midX = L + plotW * 0.34;
      var yB = yOf(Math.min(burstKm, maxKm));

      if (r.netLift > 0 && r.burstAlt) {
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = 'rgba(24, 32, 41, 0.5)';
        ctx.beginPath();
        ctx.moveTo(midX, T + plotH - 4);
        ctx.quadraticCurveTo(midX + plotW * 0.02, (T + plotH + yB) / 2, midX + plotW * 0.14, yB + 14);
        ctx.stroke();
        ctx.setLineDash([]);
        midX = midX + plotW * 0.14;

        var rad = 7 + (r.dia / 16) * 11;
        ctx.beginPath();
        ctx.arc(midX, yB, rad, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 250, 247, 0.92)';
        ctx.fill();
        ctx.strokeStyle = '#182029';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, yB + rad);
        ctx.lineTo(midX, yB + rad + 10);
        ctx.strokeStyle = '#182029';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#182029';
        ctx.fillRect(midX - 5, yB + rad + 10, 10, 8);
        ctx.fillStyle = '#c2482c';
        ctx.fillRect(midX + 5, yB + rad + 10, 2, 2);

        ctx.fillStyle = '#182029';
        ctx.font = '9.5px "Spline Sans Mono", monospace';
        ctx.fillText('burst ' + burstKm.toFixed(1) + ' km', L + plotW + 10, yB - 4);
        ctx.strokeStyle = '#182029';
        ctx.beginPath();
        ctx.moveTo(midX + rad + 2, yB);
        ctx.lineTo(L + plotW + 4, yB);
        ctx.stroke();

        ctx.fillStyle = '#78838b';
        ctx.font = '8.5px "Spline Sans Mono", monospace';
        ctx.fillText('d ' + r.dia.toFixed(1) + ' m', L + plotW + 10, yB + 12);
        ctx.fillText('release', L + plotW + 10, T + plotH + 10);
        ctx.fillText('ascent', L + plotW + 10, T + plotH - 18);
        ctx.fillText(r.rate.toFixed(1) + ' m/s', L + plotW + 10, T + plotH - 7);
      } else {
        ctx.fillStyle = '#182029';
        ctx.font = '9.5px "Spline Sans Mono", monospace';
        ctx.fillText('does not lift', L + plotW + 8, yOf(20));
        ctx.fillStyle = 'rgba(24, 32, 41, 0.75)';
        ctx.fillRect(midX - 6, T + plotH - 16, 12, 12);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#78838b';
      ctx.font = '8.5px "Spline Sans Mono", monospace';
      ctx.fillText('altitude, km', L - 34, T + plotH + 18);
    }

    update();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 120);
    });
  }

  /* ---------- instrument filters ---------- */

  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.instrument-card'));
    var count = document.getElementById('cardCount');
    var emptyNote = document.getElementById('emptyNote');

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      items.forEach(function (item) {
        var match = cat === 'all' || item.getAttribute('data-cat') === cat;
        item.hidden = !match;
        if (match) shown++;
      });
      if (count) count.textContent = String(shown);
      if (emptyNote) emptyNote.hidden = shown > 0;
    });
  }

  /* ---------- faq ---------- */

  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      var panel = q.closest('div').querySelector('.faq-a');
      if (panel) panel.hidden = open;
    });
  });

  /* ---------- enquiry form ---------- */

  var form = document.getElementById('enquiry');
  if (form) {
    var status = document.getElementById('formStatus');

    function setError(field, message) {
      field.classList.add('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = message;
      var input = field.querySelector('input, textarea, select');
      if (input) input.setAttribute('aria-invalid', 'true');
    }
    function clearError(field) {
      field.classList.remove('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = '';
      var input = field.querySelector('input, textarea, select');
      if (input) input.removeAttribute('aria-invalid');
    }

    form.querySelectorAll('.field input, .field textarea, .field select').forEach(function (input) {
      input.addEventListener('input', function () { clearError(input.closest('.field')); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError(name.closest('.field'), 'Please give a name I can answer to.');
        ok = false; firstBad = firstBad || name;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email.closest('.field'), 'That address does not look complete.');
        ok = false; firstBad = firstBad || email;
      }
      if (message.value.trim().length < 24) {
        setError(message.closest('.field'), 'Mass, power and the altitude you need will do for a start.');
        ok = false; firstBad = firstBad || message;
      }

      if (!ok) {
        status.textContent = 'The form needs a name, a working address and a short description of the payload.';
        status.className = 'form-status bad';
        if (firstBad) firstBad.focus();
        return;
      }

      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your payload is with me; flight enquiries get an answer within three working days.';
      status.className = 'form-status good';
      form.reset();
      form.querySelectorAll('.field').forEach(clearError);
    });
  }
})();
