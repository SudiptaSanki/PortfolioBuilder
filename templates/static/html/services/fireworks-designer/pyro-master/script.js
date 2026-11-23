/* Ashgrove Pyrotechnics — sky engine, cue sheet and brief form */

(function () {
  'use strict';

  /* ---------- nav drawer ---------- */
  var toggle = document.querySelector('.navtoggle');
  var drawer = document.getElementById('navdrawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- colour and shell vocabulary ---------- */
  var COLOURS = {
    '#f0c15a': 'Gold',
    '#e0644a': 'Red',
    '#7fb2d9': 'Blue',
    '#8fc98a': 'Green',
    '#d9cfe8': 'Silver'
  };

  var SHELLS = {
    chrysanthemum: {
      name: 'Chrysanthemum', note: 'A symmetrical break with trails that hold their shape; the classic gold chrysanthemum.',
      count: 112, speed: 3.4, life: 125, gravity: 0.032, drag: 0.985, trail: true, glitter: false
    },
    willow: {
      name: 'Willow', note: 'Long, slow trails that droop like a willow; it hangs in the sky and finishes low.',
      count: 82, speed: 2.5, life: 200, gravity: 0.058, drag: 0.991, trail: true, glitter: false
    },
    kamuro: {
      name: 'Kamuro', note: 'Dense gold glitter that clusters at the break and falls as a curtain.',
      count: 130, speed: 2.0, life: 165, gravity: 0.05, drag: 0.988, trail: false, glitter: true
    },
    strobe: {
      name: 'Strobe', note: 'Flickering points that flash on and off as they fall; reads at distance and photographs badly.',
      count: 62, speed: 1.9, life: 150, gravity: 0.028, drag: 0.99, trail: false, glitter: true, strobe: true
    },
    peony: {
      name: 'Peony', note: 'A clean symmetrical break with no trails: the shape is over in two seconds.',
      count: 98, speed: 3.0, life: 90, gravity: 0.03, drag: 0.98, trail: false
    },
    crossette: {
      name: 'Crossette', note: 'Each arm splits into a cross of four a beat after the break. Timing is everything.',
      count: 28, speed: 2.6, life: 150, gravity: 0.03, drag: 0.985, trail: true, split: true
    }
  };

  var SIZES = {
    3: { breakH: 250, lift: 8, radius: 78, burn: 1.9 },
    5: { breakH: 420, lift: 18, radius: 130, burn: 2.4 },
    8: { breakH: 620, lift: 40, radius: 208, burn: 2.9 },
    12: { breakH: 850, lift: 110, radius: 312, burn: 3.5 }
  };

  /* ---------- audio ---------- */
  var audioCtx = null;
  var audioOn = document.getElementById('audio');
  function boom() {
    if (!audioOn || !audioOn.checked) return;
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var len = Math.floor(audioCtx.sampleRate * 0.45);
      var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      var lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      src.connect(lp).connect(gain).connect(audioCtx.destination);
      src.start(t);

      var osc = audioCtx.createOscillator();
      var og = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.25);
      og.gain.setValueAtTime(0.16, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(og).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch (err) {
      /* audio is optional; silence is an acceptable failure */
    }
  }

  /* ---------- the sky engine ---------- */
  function Sky(canvas, options) {
    var ctx = canvas.getContext('2d');
    var self = this;
    var w = 1;
    var h = 1;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var stars = [];
    var particles = [];
    var shells = [];
    var running = true;
    var raf = null;
    var last = 0;
    var spawnTimer = 24;
    var start = performance.now();
    var cueCount = 0;
    var opts = options || {};

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round((w * h) / 9000);
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.82, r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.5 + 0.15 });
      }
    }

    function burst(x, y, type, colour, size) {
      var def = SHELLS[type] || SHELLS.chrysanthemum;
      var scale = 0.65 + Number(size) / 12 * 0.7;
      for (var i = 0; i < def.count; i++) {
        var a = (i / def.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
        var sp = def.speed * (0.55 + Math.random() * 1.0) * scale;
        particles.push({
          x: x, y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: def.life * (0.8 + Math.random() * 0.35),
          max: def.life,
          colour: colour,
          size: def.glitter ? 1.1 : 1.7,
          gravity: def.gravity,
          drag: def.drag,
          trail: def.trail,
          glitter: def.glitter,
          strobe: def.strobe,
          split: def.split,
          splitAt: def.split ? 34 : 0,
          px: x, py: y
        });
      }
      boom();
      cueCount++;
      if (opts.onBurst) opts.onBurst(type, size, colour, cueCount);
    }

    function step(now) {
      var dt = Math.min(2.4, last ? (now - last) / 16.67 : 1);
      last = now;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8,12,17,0.2)';
      ctx.fillRect(0, 0, w, h);
      var grad = ctx.createRadialGradient(w * 0.55, h * 1.08, 0, w * 0.55, h * 1.08, h * 0.95);
      grad.addColorStop(0, 'rgba(44,62,80,0.30)');
      grad.addColorStop(1, 'rgba(8,12,17,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // stars
      ctx.globalCompositeOperation = 'lighter';
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        ctx.fillStyle = 'rgba(200,215,230,' + st.a + ')';
        ctx.fillRect(st.x, st.y, st.r, st.r);
      }

      // shells rising
      for (var i = shells.length - 1; i >= 0; i--) {
        var sh = shells[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.vy += 0.055 * dt;
        ctx.strokeStyle = 'rgba(240,193,90,0.8)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 3, sh.y - sh.vy * 3);
        ctx.stroke();
        ctx.fillStyle = '#fff5d8';
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (sh.y <= sh.target || sh.vy >= 0) {
          burst(sh.x, sh.y, sh.type, sh.colour, sh.size);
          shells.splice(i, 1);
        }
      }

      // particles
      for (var p = particles.length - 1; p >= 0; p--) {
        var q = particles[p];
        q.px = q.x; q.py = q.y;
        q.vx *= Math.pow(q.drag, dt);
        q.vy = q.vy * Math.pow(q.drag, dt) + q.gravity * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;

        if (q.split && q.life <= q.max - q.splitAt) {
          q.split = false;
          for (var k = 0; k < 4; k++) {
            var ang = Math.PI / 4 + k * Math.PI / 2;
            particles.push({
              x: q.x, y: q.y,
              vx: Math.cos(ang) * 1.9, vy: Math.sin(ang) * 1.9,
              life: 52, max: 52, colour: q.colour, size: 1.4,
              gravity: 0.04, drag: 0.975, trail: true, glitter: false,
              strobe: false, split: false, splitAt: 0, px: q.x, py: q.y
            });
          }
        }

        var fade = Math.max(0, q.life / q.max);
        if (q.strobe) {
          var flash = Math.floor(q.life / 4) % 2 === 0;
          if (!flash) { if (q.life <= 0) particles.splice(p, 1); continue; }
        }
        if (q.life <= 0 || q.y > h + 20) { particles.splice(p, 1); continue; }

        ctx.globalAlpha = q.glitter ? Math.min(1, fade * (0.3 + Math.random() * 0.9)) : fade;
        ctx.strokeStyle = q.colour;
        ctx.fillStyle = q.colour;
        if (q.trail) {
          ctx.lineCap = 'round';
          ctx.globalAlpha = ctx.globalAlpha * 0.22;
          ctx.lineWidth = q.size * 3.6;
          ctx.beginPath();
          ctx.moveTo(q.px, q.py);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
          ctx.globalAlpha = q.glitter ? Math.min(1, fade * (0.3 + Math.random() * 0.9)) : fade;
          ctx.lineWidth = q.size * 1.5;
          ctx.beginPath();
          ctx.moveTo(q.px, q.py);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        } else {
          ctx.globalAlpha = ctx.globalAlpha * 0.3;
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.size * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = q.glitter ? Math.min(1, fade * (0.3 + Math.random() * 0.9)) : fade;
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // ambient shells for the hero
      if (opts.ambient && running) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 110 + Math.random() * 120;
          var types = ['chrysanthemum', 'willow', 'peony', 'strobe', 'kamuro'];
          var t = types[Math.floor(Math.random() * types.length)];
          var xs = w * (0.3 + Math.random() * 0.62);
          self.launch(xs, t, Math.random() > 0.65 ? '#e0644a' : '#f0c15a', 4 + Math.round(Math.random() * 4));
        }
      }

      raf = window.requestAnimationFrame(step);
    }

    self.launch = function (x, type, colour, size) {
      var sz = SIZES[size] || SIZES[5];
      var target = h * (0.62 - Number(size) * 0.03);
      shells.push({
        x: x, y: h - 4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.sqrt(2 * 0.055 * (h - target)) * 1.02),
        target: target, type: type, colour: colour, size: size || 5
      });
    };

    self.fireStatic = function (x, y, type, colour, size) {
      burst(x, y, type, colour, size);
      renderOnce();
    };

    function renderOnce() {
      // one frame for reduced-motion users: stars, shells and a still burst
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#060a0e';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        ctx.fillStyle = 'rgba(200,215,230,' + st.a + ')';
        ctx.fillRect(st.x, st.y, st.r, st.r);
      }
      for (var i = 0; i < particles.length; i++) {
        var q = particles[i];
        ctx.globalAlpha = Math.max(0.15, q.life / q.max);
        ctx.fillStyle = q.colour;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    self.setRunning = function (v) {
      running = v;
      if (v && !raf) { last = 0; raf = window.requestAnimationFrame(step); }
      if (!v && raf) { window.cancelAnimationFrame(raf); raf = null; }
    };

    self.clear = function () {
      particles.length = 0;
      shells.length = 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#060a0e';
      ctx.fillRect(0, 0, w, h);
      renderStars();
    };

    function renderStars() {
      ctx.globalCompositeOperation = 'lighter';
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        ctx.fillStyle = 'rgba(200,215,230,' + st.a + ')';
        ctx.fillRect(st.x, st.y, st.r, st.r);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    self.now = function () { return performance.now() - start; };
    self.size = function () { return { w: w, h: h }; };
    self.cueCount = function () { return cueCount; };
    self.resetCount = function () { cueCount = 0; };

    window.addEventListener('resize', function () { resize(); });
    resize();
    if (reduce) {
      renderOnce();
    } else {
      raf = window.requestAnimationFrame(step);
    }
  }

  /* ---------- hero sky ---------- */
  var skyCanvas = document.getElementById('sky-canvas');
  var sky = null;
  var skyPause = document.getElementById('sky-pause');
  var skyTc = document.getElementById('sky-tc');
  var skyVisible = true;

  if (skyCanvas) {
    sky = new Sky(skyCanvas, {
      ambient: true,
      onBurst: function (type, size, colour, n) {
        if (skyTc && skyPause && skyPause.getAttribute('aria-pressed') !== 'true') {
          skyTc.textContent = 'Cue ' + String(n).padStart(3, '0') + ' · ' + SHELLS[type].name + ' · ' + size + ' in';
        }
      }
    });
    window.setTimeout(function () {
      var dims = sky.size();
      sky.launch(dims.w * 0.62, 'chrysanthemum', '#f0c15a', 6);
      sky.launch(dims.w * 0.82, 'willow', '#e0644a', 5);
    }, 700);
    if (skyPause) {
      skyPause.addEventListener('click', function () {
        var paused = skyPause.getAttribute('aria-pressed') === 'true';
        skyPause.setAttribute('aria-pressed', String(!paused));
        skyPause.textContent = paused ? 'Pause sky' : 'Resume sky';
        sky.setRunning(paused);
        skyTc.textContent = paused ? 'Cue 000 · sky paused' : 'Cue 000 · ambient pattern';
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          skyVisible = entry.isIntersecting;
          if (!reduce && skyPause && skyPause.getAttribute('aria-pressed') !== 'true') {
            sky.setRunning(entry.isIntersecting);
          }
        });
      }, { threshold: 0.05 }).observe(skyCanvas);
    }
  }

  /* ---------- choreographer ---------- */
  var burstCanvas = document.getElementById('burst-canvas');
  if (!burstCanvas) return;

  var shellRow = document.getElementById('shells');
  var sizeRow = document.getElementById('sizes');
  var colourRow = document.getElementById('colours');
  var fireBtn = document.getElementById('fire-btn');
  var clearBtn = document.getElementById('clear-sky');
  var hudTc = document.getElementById('hud-tc');
  var hudCues = document.getElementById('hud-cues');
  var hudShell = document.getElementById('hud-shell');
  var stageHint = document.getElementById('stage-hint');
  var timeline = document.getElementById('timeline');
  var cueRows = document.getElementById('cue-rows');
  var sizeHint = document.getElementById('size-hint');

  var type = 'chrysanthemum';
  var size = 5;
  var colour = '#f0c15a';
  var cueLog = [];
  var startTime = performance.now();

  var desk = new Sky(burstCanvas, {
    onBurst: function (t, sz, col, n) {
      var seconds = (performance.now() - startTime) / 1000;
      var tc = formatTC(seconds);
      cueLog.unshift({ seconds: seconds, tc: tc, type: t, name: SHELLS[t].name, colour: COLOURS[col] || 'Gold', size: sz });
      if (cueLog.length > 9) cueLog.pop();
      renderCues();
      hudCues.textContent = n + (n === 1 ? ' cue' : ' cues');
    }
  });

  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }
  function formatTC(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.floor(sec % 60);
    var f = Math.floor((sec % 1) * 25);
    return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
  }

  function renderCues() {
    if (!cueLog.length) {
      cueRows.innerHTML = '<p class="cues__empty">No cues yet. Fire a shell to start the sheet.</p>';
      timeline.innerHTML = '';
      return;
    }
    cueRows.innerHTML = cueLog.map(function (c, i) {
      return '<div class="cue-row"><span>' + c.tc + '</span><span>C' + pad(cueLog.length - i) + '</span><span>' +
        c.name + '</span><span>' + c.colour + '</span><span>' + c.size + ' in · break ' + SIZES[c.size].breakH + ' ft</span></div>';
    }).join('');

    timeline.innerHTML = cueLog.map(function (c) {
      var pct = (c.seconds % 24) / 24 * 100;
      return '<i style="left:' + pct.toFixed(2) + '%"></i>';
    }).join('');
  }

  function updateShellCard() {
    var def = SHELLS[type];
    var sz = SIZES[size];
    document.getElementById('spec-name').textContent = def.name + ', ' + size + ' in';
    document.getElementById('spec-height').textContent = sz.breakH + ' ft';
    document.getElementById('spec-lift').textContent = sz.lift + ' g';
    document.getElementById('spec-radius').textContent = sz.radius + ' ft';
    document.getElementById('spec-burn').textContent = sz.burn.toFixed(1) + ' s';
    document.getElementById('spec-site').textContent = (70 * size) + ' ft';
    document.getElementById('spec-fallout').textContent = size >= 8 ? 'open land only' : 'open ground';
    document.getElementById('spec-note').textContent = def.note;
    sizeHint.textContent = size + ' in · ' + (70 * size) + ' ft site radius · break at ' + sz.breakH + ' ft';
    hudShell.textContent = def.name + ' · ' + size + ' in';
  }

  shellRow.addEventListener('click', function (e) {
    var b = e.target.closest('[data-shell]');
    if (!b) return;
    type = b.getAttribute('data-shell');
    Array.prototype.forEach.call(shellRow.querySelectorAll('[data-shell]'), function (el) {
      el.classList.toggle('is-on', el === b);
      el.setAttribute('aria-pressed', String(el === b));
    });
    updateShellCard();
  });

  sizeRow.addEventListener('click', function (e) {
    var b = e.target.closest('[data-size]');
    if (!b) return;
    size = Number(b.getAttribute('data-size'));
    Array.prototype.forEach.call(sizeRow.querySelectorAll('[data-size]'), function (el) {
      el.classList.toggle('is-on', el === b);
      el.setAttribute('aria-pressed', String(el === b));
    });
    updateShellCard();
  });

  colourRow.addEventListener('click', function (e) {
    var b = e.target.closest('[data-colour]');
    if (!b) return;
    colour = b.getAttribute('data-colour');
    Array.prototype.forEach.call(colourRow.querySelectorAll('[data-colour]'), function (el) {
      el.classList.toggle('is-on', el === b);
      el.setAttribute('aria-pressed', String(el === b));
    });
  });

  function fireAt(x, y) {
    if (stageHint) stageHint.style.opacity = '0';
    var dims = desk.size();
    if (reduce) {
      desk.fireStatic(x, y, type, colour, Number(size));
      cueLog.unshift({ seconds: (performance.now() - startTime) / 1000, tc: formatTC((performance.now() - startTime) / 1000), type: type, name: SHELLS[type].name, colour: COLOURS[colour] || 'Gold', size: size });
      if (cueLog.length > 9) cueLog.pop();
      renderCues();
      hudCues.textContent = desk.cueCount() + ' cues';
      return;
    }
    desk.launch(x, type, colour, size);
    // a launched shell is a cue on the sheet only when it breaks; preview line here
    if (y && dims.h) { /* the click position sets only the launch column */ }
  }

  fireBtn.addEventListener('click', function () {
    var dims = desk.size();
    fireAt(dims.w * (0.25 + Math.random() * 0.5), dims.h * 0.5);
  });

  clearBtn.addEventListener('click', function () {
    desk.clear();
    desk.resetCount();
    cueLog = [];
    renderCues();
    hudCues.textContent = '0 cues';
    if (stageHint) stageHint.style.opacity = '';
  });

  burstCanvas.addEventListener('click', function (e) {
    var r = burstCanvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * desk.size().w;
    fireAt(x, 0);
  });

  var tick = window.setInterval(function () {
    hudTc.textContent = formatTC((performance.now() - startTime) / 1000);
  }, 90);

  updateShellCard();
  renderCues();
})();

/* ---------- brief form ---------- */
(function () {
  var form = document.getElementById('brief-form');
  if (!form) return;
  var status = document.getElementById('brief-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      if (!el.value.trim()) {
        ok = false;
        el.style.borderColor = '#c8a35a';
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.style.borderColor = '';
        el.removeAttribute('aria-invalid');
      }
    });
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var val = function (id) { return (form.querySelector('#' + id).value || '').trim(); };
    var want = Array.prototype.slice.call(form.querySelectorAll('input[name="want"]:checked')).map(function (c) { return c.value; }).join(', ') || 'not stated';
    var ref = 'AP-' + String(Date.now()).slice(-6);
    var body = [
      'Name: ' + val('p-name'),
      'Organisation: ' + (val('p-org') || '\u2014'),
      'Email: ' + val('p-email'),
      'Event date: ' + val('p-date'),
      'Venue and town: ' + val('p-venue'),
      'Audience: ' + val('p-audience'),
      'Largest shell wanted: ' + val('p-shell'),
      'Elements: ' + want,
      '',
      val('p-message')
    ].join('\n');
    var mail = 'mailto:shows@ashgrovepyro.example?subject=' + encodeURIComponent('Display brief ' + ref) + '&body=' + encodeURIComponent(body);
    status.hidden = false;
    status.innerHTML = '<h3>Brief ' + ref + ' assembled</h3>' +
      '<p>Nothing has been sent yet. Your brief is ready as an email; open it and send it, or write to <a href="mailto:shows@ashgrovepyro.example">shows@ashgrovepyro.example</a>.</p>' +
      '<p><a href="' + mail + '">Open the email with the brief</a></p>';
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
