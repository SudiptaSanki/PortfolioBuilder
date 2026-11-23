/* Orbital Drill — navigation, nav-cam canvas, extraction balance, forms.
   No audio, no external libraries. */

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

  /* ---------- nav cam ---------- */

  var rock = document.getElementById('rockCanvas');
  if (rock) drawRock();

  function drawRock() {
    var ctx = rock.getContext('2d');
    var w = 0, h = 0;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var rect = rock.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      rock.width = Math.max(1, Math.round(rect.width * dpr));
      rock.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = rect.width;
      h = rect.height;
    }

    var stars = [];
    for (var i = 0; i < 110; i++) {
      stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.3 + 0.3, a: Math.random() * 0.55 + 0.15 });
    }

    var craters = [];
    for (var c = 0; c < 30; c++) {
      craters.push({
        lat: (Math.random() - 0.5) * 2.1,
        lon: Math.random() * Math.PI * 2,
        r: 0.035 + Math.random() * 0.1
      });
    }
    craters.push({ lat: 0.42, lon: 1.0, r: 0.19 });
    craters.push({ lat: -0.3, lon: 2.4, r: 0.15 });

    var ang = 0;
    var raf = null;

    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b0907';
      ctx.fillRect(0, 0, w, h);

      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        ctx.globalAlpha = st.a;
        ctx.fillStyle = '#cfc6b4';
        ctx.fillRect(st.x * w, st.y * h, st.s, st.s);
      }
      ctx.globalAlpha = 1;

      var cx = w * 0.55, cy = h * 0.54, R = Math.min(w, h) * 0.315;

      var g = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.08, cx, cy, R * 1.08);
      g.addColorStop(0, '#8a795e');
      g.addColorStop(0.45, '#574a39');
      g.addColorStop(0.8, '#332b22');
      g.addColorStop(1, '#171310');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      for (var k = 0; k < craters.length; k++) {
        var cr = craters[k];
        var lon = cr.lon + ang;
        var z = Math.cos(lon);
        if (z <= 0.02) continue;
        var x = cx + R * Math.cos(cr.lat) * Math.sin(lon);
        var y = cy - R * Math.sin(cr.lat);
        var rr = cr.r * R * (0.35 + 0.65 * z);
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * (0.45 + 0.55 * z), 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 8, 6, ' + (0.42 * z).toFixed(3) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - rr * 0.12, y - rr * 0.14, rr * 0.92, Math.PI * 0.85, Math.PI * 1.95);
        ctx.strokeStyle = 'rgba(226, 211, 184, ' + (0.16 * z).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      var sh = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      sh.addColorStop(0, 'rgba(9, 8, 6, 0.62)');
      sh.addColorStop(0.42, 'rgba(9, 8, 6, 0.02)');
      sh.addColorStop(1, 'rgba(9, 8, 6, 0.85)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sh;
      ctx.fill();

      // landed module on the sunward shoulder
      var lx = cx - R * 0.46;
      var ly = cy - R * 0.74;
      ctx.strokeStyle = '#d9cdb5';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx - 13, ly + 9);
      ctx.lineTo(lx - 5, ly - 4);
      ctx.lineTo(lx + 6, ly - 4);
      ctx.lineTo(lx + 13, ly + 9);
      ctx.stroke();
      ctx.fillStyle = '#221e19';
      ctx.fillRect(lx - 8, ly - 8, 16, 7);
      ctx.strokeStyle = '#8f7d5b';
      ctx.strokeRect(lx - 8, ly - 8, 16, 7);
      ctx.fillStyle = '#e0a13a';
      ctx.fillRect(lx + 5, ly - 6.5, 2, 2);

      ctx.strokeStyle = 'rgba(224, 161, 58, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lx + 12, ly - 2);
      ctx.lineTo(lx + 34, ly - 14);
      ctx.stroke();

      // reticle
      ctx.strokeStyle = 'rgba(224, 161, 58, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(14.5, 14.5, w - 29, h - 29);
      ctx.beginPath();
      ctx.moveTo(w / 2 - 8, h / 2); ctx.lineTo(w / 2 + 8, h / 2);
      ctx.moveTo(w / 2, h / 2 - 8); ctx.lineTo(w / 2, h / 2 + 8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(172, 164, 154, 0.9)';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillText('47 EGERIA', 24, h - 24);
      ctx.fillText('S/C 0.4 km', 24, h - 12);

      if (!reduce) {
        ang += 0.0022;
        raf = requestAnimationFrame(frame);
      } else if (raf === null) {
        raf = 0;
      }
    }

    resize();
    window.addEventListener('resize', function () {
      resize();
      if (reduce) frame();
    });
    frame();
  }

  /* ---------- extraction balance ---------- */

  var dist = document.getElementById('dist');
  if (dist) initBalance();

  function initBalance() {
    var BODIES = {
      c: { name: 'C-type', water: 12, density: 1.3, cohesion: 0.6, hint: 'Carbonaceous, 1.3 g/cm³, 12 wt% water, cohesion 0.6 kPa.' },
      s: { name: 'S-type', water: 1.5, density: 2.7, cohesion: 1.1, hint: 'Silicate, 2.7 g/cm³, 1.5 wt% water, cohesion 1.1 kPa. Harder rock, far less ice.' },
      m: { name: 'M-type', water: 0.2, density: 4.6, cohesion: 2.4, hint: 'Metallic, 4.6 g/cm³, 0.2 wt% water, cohesion 2.4 kPa. A metal target, not a water target.' }
    };
    var ANCHOR = { auger: 1.0, screw: 1.15, harpoon: 0.5 };
    var AREA = 0.377;          // engaged auger surface, m², 40 mm × 3 m
    var ENGAGE = 30.5;           // thread engagement multiplier
    var ENTHALPY = 2.83;       // MJ per kg of water, ice to vapour at 273 K
    var CP = 0.18;             // MJ per kg of regolith raised 220 K
    var EFF = 0.32;            // whole-chain oven efficiency
    var PV = 0.30;             // array efficiency
    var COST_DAY = 42000;      // € per operating day, all in

    var state = { body: 'c', dist: 2.7, feed: 6, anchor: 'auger', rate: 20 };

    var feed = document.getElementById('feed');
    var rate = document.getElementById('rate');
    var distOut = document.getElementById('distOut');
    var feedOut = document.getElementById('feedOut');
    var rateOut = document.getElementById('rateOut');
    var bodyHint = document.getElementById('bodyHint');
    var note = document.getElementById('toolNote');
    var outFlux = document.getElementById('outFlux');
    var outPower = document.getElementById('outPower');
    var outWater = document.getElementById('outWater');
    var outMargin = document.getElementById('outMargin');
    var outCost = document.getElementById('outCost');
    var reactionLbl = document.getElementById('reactionLbl');
    var capacityLbl = document.getElementById('capacityLbl');

    function fmt(n) {
      if (n >= 1000) return Math.round(n).toLocaleString('en-GB');
      if (n >= 10) return n.toFixed(0);
      return n.toFixed(1);
    }

    function compute() {
      var b = BODIES[state.body];
      var frac = b.water / 100;
      var flux = 1361 / (state.dist * state.dist);
      var capacity = b.cohesion * AREA * ENGAGE * ANCHOR[state.anchor];
      var margin = capacity - state.feed;
      var waterDay = state.rate * 1000 * frac;
      var energyKg = (ENTHALPY / EFF + CP / (frac * EFF));   // MJ per kg of water
      var kwhKg = energyKg / 3.6;
      var powerKw = (waterDay * energyKg * 1000) / 86400;
      var array = (powerKw * 1000) / (flux * PV);
      var cost = COST_DAY / waterDay;
      return {
        b: b, flux: flux, capacity: capacity, margin: margin, waterDay: waterDay,
        kwhKg: kwhKg, powerKw: powerKw, array: array, cost: cost, frac: frac
      };
    }

    function update() {
      var r = compute();
      var b = r.b;

      distOut.textContent = state.dist.toFixed(2) + ' AU';
      feedOut.textContent = state.feed.toFixed(1) + ' kN';
      rateOut.textContent = state.rate + ' t/day';
      bodyHint.textContent = b.hint;

      outFlux.textContent = Math.round(r.flux) + ' W/m²';
      outPower.textContent = fmt(r.powerKw) + ' kW';
      outWater.textContent = fmt(r.waterDay) + ' kg';
      outMargin.textContent = (r.margin >= 0 ? '+' : '−') + Math.abs(r.margin).toFixed(1) + ' kN';
      outMargin.className = r.margin < 0 ? 'bad' : '';
      outCost.textContent = '€' + r.cost.toFixed(0);

      reactionLbl.textContent = 'reaction ' + state.feed.toFixed(1) + ' kN';
      capacityLbl.textContent = 'capacity ' + r.capacity.toFixed(1) + ' kN';

      if (r.margin < 0) {
        note.innerHTML = 'At ' + state.feed.toFixed(1) + ' kN feed the anchor capacity of ' + r.capacity.toFixed(1) + ' kN is exceeded by ' + Math.abs(r.margin).toFixed(1) + ' kN. The rig walks off the surface. Drop the feed or add a hold-down thruster before this becomes a flight configuration.';
      } else if (r.frac < 0.03) {
        note.innerHTML = 'The anchor holds with ' + r.margin.toFixed(1) + ' kN to spare, but ' + b.name + ' carries only ' + b.water + ' wt% water: the oven needs ' + fmt(r.kwhKg) + ' kWh per kilogram of water and the array would be ' + fmt(r.array) + ' m². This body is worth working for metal, not for volatiles.';
      } else {
        note.innerHTML = 'The anchor holds with ' + r.margin.toFixed(1) + ' kN to spare at ' + state.feed.toFixed(1) + ' kN feed. The oven needs ' + r.kwhKg.toFixed(1) + ' kWh per kilogram of water, which is ' + fmt(r.waterDay) + ' kg a day at ' + state.rate + ' t/day, an average ' + fmt(r.powerKw) + ' kW, and about ' + fmt(r.array) + ' m² of array at ' + state.dist.toFixed(2) + ' AU.';
      }
    }

    document.querySelectorAll('[data-body]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.body = b.getAttribute('data-body');
        document.querySelectorAll('[data-body]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        update();
      });
    });

    document.querySelectorAll('[data-anchor]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.anchor = b.getAttribute('data-anchor');
        document.querySelectorAll('[data-anchor]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        update();
      });
    });

    dist.addEventListener('input', function () { state.dist = parseFloat(dist.value); update(); });
    feed.addEventListener('input', function () { state.feed = parseFloat(feed.value); update(); });
    rate.addEventListener('input', function () { state.rate = parseInt(rate.value, 10); update(); });

    update();
  }

  /* ---------- asset filters ---------- */

  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var assets = Array.prototype.slice.call(document.querySelectorAll('.asset'));
    var count = document.getElementById('assetCount');
    var emptyNote = document.getElementById('emptyNote');

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      assets.forEach(function (a) {
        var match = cat === 'all' || a.getAttribute('data-cat') === cat;
        a.hidden = !match;
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
        setError(message.closest('.field'), 'A paragraph on the target and the date helps me answer properly.');
        ok = false; firstBad = firstBad || message;
      }

      if (!ok) {
        status.textContent = 'The brief needs a name, a working address and a paragraph about the target.';
        status.className = 'form-status bad';
        if (firstBad) firstBad.focus();
        return;
      }

      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. The brief is with me; mission enquiries get an answer within four working days.';
      status.className = 'form-status good';
      form.reset();
      form.querySelectorAll('.field').forEach(clearError);
    });
  }
})();
