/* Iris Kovač — navigation, Bloch sphere, fringe field, forms. */

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

  /* ---------- state lab ---------- */

  var thetaEl = document.getElementById('theta');
  if (thetaEl) initLab();

  function initLab() {
    var phiEl = document.getElementById('phi');
    var gammaEl = document.getElementById('gamma');
    var thetaOut = document.getElementById('thetaOut');
    var phiOut = document.getElementById('phiOut');
    var gammaOut = document.getElementById('gammaOut');
    var blochFoot = document.getElementById('blochFoot');
    var fringeFoot = document.getElementById('fringeFoot');
    var measureBtn = document.getElementById('measureBtn');
    var measureOut = document.getElementById('measureOut');
    var outP0 = document.getElementById('outP0');
    var outP1 = document.getElementById('outP1');
    var outCoh = document.getElementById('outCoh');
    var outVis = document.getElementById('outVis');
    var outPur = document.getElementById('outPur');

    var bloch = document.getElementById('blochCanvas');
    var fringe = document.getElementById('fringeCanvas');

    var state = { theta: 90, phi: 0, gamma: 0 };

    function values() {
      var t = state.theta * Math.PI / 180;
      var p = state.phi * Math.PI / 180;
      var g = state.gamma / 100;
      var r = 1 - g;
      return {
        t: t, p: p, g: g, r: r,
        x: r * Math.sin(t) * Math.cos(p),
        y: r * Math.sin(t) * Math.sin(p),
        z: r * Math.cos(t),
        p0: (1 + Math.cos(t)) / 2,
        p1: (1 - Math.cos(t)) / 2,
        coh: r * Math.sin(t) / 2,
        vis: r,
        purity: (1 + r * r) / 2
      };
    }

    function sizeCanvas(canvas) {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx: ctx, w: rect.width, h: rect.height };
    }

    function drawBloch(v) {
      var c = sizeCanvas(bloch);
      var ctx = c.ctx, w = c.w, h = c.h;
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2, cy = h / 2 + 2;
      var R = Math.min(w, h) * 0.335;
      var A = 0.6, B = 0.38;

      function project(x, y, z) {
        var ex = x * Math.cos(A) - y * Math.sin(A);
        var dep = x * Math.sin(A) + y * Math.cos(A);
        return { x: cx + R * ex, y: cy - R * (z * Math.cos(B) - dep * Math.sin(B)) };
      }

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#f2f2ea';
      ctx.fill();
      ctx.strokeStyle = '#b9bcae';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * Math.sin(B), 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#d9d9ce';
      ctx.stroke();

      ctx.strokeStyle = '#d9d9ce';
      ctx.beginPath();
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      var xx = project(1, 0, 0); var xn = project(-1, 0, 0);
      ctx.moveTo(xn.x, xn.y); ctx.lineTo(xx.x, xx.y);
      var yy = project(0, 1, 0); var yn = project(0, -1, 0);
      ctx.moveTo(yn.x, yn.y); ctx.lineTo(yy.x, yy.y);
      ctx.stroke();

      ctx.fillStyle = '#79837c';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('|0⟩', cx, cy - R - 9);
      ctx.fillText('|1⟩', cx, cy + R + 17);
      ctx.textAlign = 'left';
      ctx.fillText('x', xx.x + 4, xx.y + 3);
      ctx.fillText('y', yy.x + 3, yy.y + 2);

      var zt = project(0, 0, v.z);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(192, 59, 45, 0.55)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, zt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (v.r < 0.02) {
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#79837c';
        ctx.fill();
      } else {
        var tip = project(v.x, v.y, v.z);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = '#c03b2d';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = '#c03b2d';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#1b211e';
      ctx.fill();
    }

    function drawFringe(v) {
      var c = sizeCanvas(fringe);
      var ctx = c.ctx, w = c.w, h = c.h;
      ctx.clearRect(0, 0, w, h);

      var fieldH = Math.round(h * 0.54);
      var plotTop = fieldH + 16;
      var plotH = h - plotTop - 16;
      var period = w / 8.5;

      ctx.fillStyle = '#16241d';
      ctx.fillRect(0, 0, w, fieldH);

      for (var x = 0; x < w; x++) {
        var env = Math.exp(-Math.pow((x - w / 2) / (w * 0.44), 2));
        var inten = 0.5 + 0.5 * v.vis * Math.cos((2 * Math.PI * x) / period) * env;
        var a = (0.06 + 0.94 * Math.max(0, Math.min(1, inten))) * (0.4 + 0.6 * env);
        ctx.fillStyle = 'rgba(212, 64, 48, ' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
        ctx.fillRect(x, 0, 1, fieldH);
      }

      ctx.strokeStyle = '#d9d9ce';
      ctx.beginPath();
      ctx.moveTo(0, plotTop + plotH + 0.5);
      ctx.lineTo(w, plotTop + plotH + 0.5);
      ctx.stroke();

      ctx.beginPath();
      for (var i = 0; i <= w; i += 2) {
        var e = Math.exp(-Math.pow((i - w / 2) / (w * 0.44), 2));
        var val = 0.5 + 0.5 * v.vis * Math.cos((2 * Math.PI * i) / period) * e;
        var y = plotTop + plotH - val * plotH;
        if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = '#c03b2d';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#79837c';
      ctx.font = '8.5px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textAlign = 'right';
      ctx.fillText('position', w, h - 2);
      ctx.textAlign = 'left';
      ctx.fillText('0', 0, h - 2);
    }

    function update() {
      var v = values();

      thetaOut.textContent = state.theta + '°';
      phiOut.textContent = state.phi + '°';
      gammaOut.textContent = state.gamma + '%';

      outP0.textContent = v.p0.toFixed(3);
      outP1.textContent = v.p1.toFixed(3);
      outCoh.textContent = v.coh.toFixed(3);
      outVis.textContent = Math.round(v.vis * 100) + '%';
      outPur.textContent = v.purity.toFixed(3);

      if (v.r > 0.995) {
        blochFoot.textContent = 'Pure state, vector length 1.00. The state is on the surface.';
      } else if (v.r < 0.02) {
        blochFoot.textContent = 'Fully mixed: the vector has collapsed to the centre and there is no preferred direction left.';
      } else {
        blochFoot.textContent = 'Vector length ' + v.r.toFixed(2) + '. The environment knows ' + state.gamma + '% of the which-path information.';
      }

      if (state.gamma === 0) {
        fringeFoot.textContent = 'Visibility 100%: the two paths are indistinguishable and the fringes are at full contrast.';
      } else if (state.gamma < 40) {
        fringeFoot.textContent = 'Visibility ' + Math.round(v.vis * 100) + '%: a partial record exists, so the bands are washed out but still present.';
      } else if (state.gamma < 95) {
        fringeFoot.textContent = 'Visibility ' + Math.round(v.vis * 100) + '%: the record is good enough that the pattern is nearly gone.';
      } else {
        fringeFoot.textContent = 'No fringes: the paths are fully distinguishable. The screen shows two overlapping single-slit envelopes.';
      }

      drawBloch(v);
      drawFringe(v);
    }

    thetaEl.addEventListener('input', function () { state.theta = parseInt(thetaEl.value, 10); update(); });
    phiEl.addEventListener('input', function () { state.phi = parseInt(phiEl.value, 10); update(); });
    gammaEl.addEventListener('input', function () { state.gamma = parseInt(gammaEl.value, 10); update(); });

    if (measureBtn) {
      measureBtn.addEventListener('click', function () {
        var v = values();
        var n = 200, zero = 0;
        for (var i = 0; i < n; i++) if (Math.random() < v.p0) zero++;
        measureOut.textContent = zero + ' in |0⟩, ' + (n - zero) + ' in |1⟩';
      });
    }

    update();

    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(update, 120);
    });
  }

  /* ---------- experiment filters ---------- */

  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.exp'));
    var count = document.getElementById('expCount');
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
        setError(message.closest('.field'), 'A sentence about the physics and the ask is enough.');
        ok = false; firstBad = firstBad || message;
      }

      if (!ok) {
        status.textContent = 'The form needs a name, a working address and a short description of the question.';
        status.className = 'form-status bad';
        if (firstBad) firstBad.focus();
        return;
      }

      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note is with the lab; collaborations get an answer within a week.';
      status.className = 'form-status good';
      form.reset();
      form.querySelectorAll('.field').forEach(clearError);
    });
  }
})();
