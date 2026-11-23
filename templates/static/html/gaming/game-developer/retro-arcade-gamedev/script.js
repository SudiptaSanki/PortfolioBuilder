/* Rosa Delgado — arcade works
   Hitbox / frame-data bench with a CRT mask preview, plus opt-in FM + PSG one-shots. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- bench ---------- */
  var canvas = document.getElementById('hitCanvas');
  if (!canvas) { initRest(); return; }

  var ui = {
    speed: document.getElementById('speed'),
    boxW: document.getElementById('boxW'),
    boxH: document.getElementById('boxH'),
    startup: document.getElementById('startup'),
    active: document.getElementById('active'),
    recovery: document.getElementById('recovery'),
    hitstun: document.getElementById('hitstun'),
    blockstun: document.getElementById('blockstun'),
    refresh: document.getElementById('refresh'),
    mask: document.getElementById('mask'),
    scan: document.getElementById('scan'),
    speedOut: document.getElementById('speedOut'),
    boxWOut: document.getElementById('boxWOut'),
    boxHOut: document.getElementById('boxHOut'),
    startupOut: document.getElementById('startupOut'),
    activeOut: document.getElementById('activeOut'),
    recoveryOut: document.getElementById('recoveryOut'),
    hitstunOut: document.getElementById('hitstunOut'),
    blockstunOut: document.getElementById('blockstunOut'),
    scanOut: document.getElementById('scanOut'),
    frameCount: document.getElementById('frameCount'),
    vHit: document.getElementById('vHit'),
    vBlock: document.getElementById('vBlock'),
    vReach: document.getElementById('vReach'),
    vPunish: document.getElementById('vPunish')
  };

  var model = null;

  function read() {
    var speed = parseFloat(ui.speed.value);
    var boxW = parseInt(ui.boxW.value, 10);
    var boxH = parseInt(ui.boxH.value, 10);
    var startup = parseInt(ui.startup.value, 10);
    var active = parseInt(ui.active.value, 10);
    var recovery = parseInt(ui.recovery.value, 10);
    var hitstun = parseInt(ui.hitstun.value, 10);
    var blockstun = parseInt(ui.blockstun.value, 10);
    var total = startup + active + recovery;
    var busy = active - 1 + recovery;
    return {
      speed: speed, boxW: boxW, boxH: boxH,
      startup: startup, active: active, recovery: recovery,
      hitstun: hitstun, blockstun: blockstun,
      total: total, busy: busy,
      advHit: hitstun - busy,
      advBlock: blockstun - busy,
      reach: boxW + speed * startup,
      refresh: parseInt(ui.refresh.value, 10),
      mask: ui.mask.value,
      scan: parseInt(ui.scan.value, 10)
    };
  }

  function update() {
    model = read();
    ui.speedOut.textContent = model.speed + ' px/f';
    ui.boxWOut.textContent = model.boxW + ' px';
    ui.boxHOut.textContent = model.boxH + ' px';
    ui.startupOut.textContent = model.startup + ' f';
    ui.activeOut.textContent = model.active + ' f';
    ui.recoveryOut.textContent = model.recovery + ' f';
    ui.hitstunOut.textContent = model.hitstun + ' f';
    ui.blockstunOut.textContent = model.blockstun + ' f';
    ui.scanOut.textContent = model.scan + '%';
    ui.frameCount.textContent = model.total + ' frames';

    ui.vHit.textContent = (model.advHit > 0 ? '+' : model.advHit < 0 ? '−' : '') + Math.abs(model.advHit);
    ui.vBlock.textContent = (model.advBlock > 0 ? '+' : model.advBlock < 0 ? '−' : '') + Math.abs(model.advBlock);
    ui.vHit.style.color = model.advHit >= 0 ? '' : '#e8452f';
    ui.vBlock.style.color = model.advBlock >= 0 ? '' : '#e8452f';
    ui.vReach.textContent = model.reach + ' px';
    ui.vPunish.textContent = model.advBlock < 0 ? Math.abs(model.advBlock) + ' f' : 'safe';

    draw();
  }

  function draw() {
    if (!model) return;
    var ctx = canvas.getContext('2d');
    var cssW = canvas.clientWidth || 800;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssH = Math.round(Math.max(380, Math.min(560, cssW * 0.64)));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#070a09';
    ctx.fillRect(0, 0, cssW, cssH);

    var pad = 14;
    var stageH = Math.round(cssH * 0.52);
    drawStage(ctx, pad, pad, cssW - pad * 2, stageH - 12);
    drawTimeline(ctx, pad, pad + stageH + 4, cssW - pad * 2, cssH - stageH - pad - 24);

    drawMask(ctx, pad, pad, cssW - pad * 2, cssH - pad * 2);
  }

  function mono(ctx, size, color) {
    ctx.fillStyle = color || '#9a9083';
    ctx.font = '400 ' + size + 'px "Share Tech Mono", monospace';
  }

  function drawStage(ctx, x, y, w, h) {
    ctx.fillStyle = '#050807';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1f2a28';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    /* header */
    mono(ctx, 10, '#9a9083');
    ctx.fillText('HITBOX VIEW', x + 10, y + 16);
    ctx.fillStyle = '#45d9c0';
    var hdr = '320 × 240 · ' + model.refresh + ' HZ';
    ctx.fillText(hdr, x + w - 10 - ctx.measureText(hdr).width, y + 16);
    ctx.fillStyle = '#6d6458';
    ctx.fillText('STAGE 04 · NIGHT PLATFORM', x + w / 2 - ctx.measureText('STAGE 04 · NIGHT PLATFORM').width / 2, y + 16);

    var vx = x + 10, vy = y + 26;
    var vw = w - 20, vh = h - 34;
    var horizon = vy + vh * 0.58;

    /* floor grid */
    ctx.strokeStyle = 'rgba(69,217,192,.14)';
    for (var i = 0; i <= 8; i++) {
      var gx = vx + (i / 8) * vw;
      ctx.beginPath();
      ctx.moveTo(vx + vw / 2 + (gx - vx - vw / 2) * 0.18, horizon);
      ctx.lineTo(gx, vy + vh);
      ctx.stroke();
    }
    for (var r = 0; r < 5; r++) {
      var t = Math.pow(r / 4, 1.7);
      var gy = horizon + t * (vh - (horizon - vy));
      ctx.beginPath();
      ctx.moveTo(vx, gy);
      ctx.lineTo(vx + vw, gy);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(vx, horizon);
    ctx.lineTo(vx + vw, horizon);
    ctx.strokeStyle = 'rgba(69,217,192,.28)';
    ctx.stroke();

    /* fighters */
    var scale = vw / 320;
    var p1x = vx + vw * 0.24;
    var p2x = Math.min(vx + vw - 30, p1x + model.reach * scale);
    var baseY = vy + vh;

    function fighter(cx, bodyW, bodyH, color, label, facing) {
      var bh = bodyH * scale;
      var bw = bodyW * scale;
      var legH = bh * 0.34;
      var torsoH = bh * 0.46;
      var headR = bh * 0.11;
      var torsoTop = baseY - legH - torsoH;

      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 3 * scale, bw * 0.7, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      /* legs */
      ctx.fillRect(cx - bw * 0.36, baseY - legH, bw * 0.24, legH);
      ctx.fillRect(cx + bw * 0.12, baseY - legH, bw * 0.24, legH);
      /* torso, slightly tapered by two stacked rects */
      ctx.fillRect(cx - bw * 0.42, torsoTop, bw * 0.84, torsoH * 0.55);
      ctx.fillRect(cx - bw * 0.5, torsoTop + torsoH * 0.55, bw, torsoH * 0.45);
      /* leading arm */
      var armX = facing > 0 ? cx + bw * 0.4 : cx - bw * 0.62;
      ctx.fillRect(armX, torsoTop + torsoH * 0.08, bw * 0.22, torsoH * 0.72);
      /* head */
      ctx.beginPath();
      ctx.arc(cx, torsoTop - headR * 0.7, headR, 0, Math.PI * 2);
      ctx.fill();

      mono(ctx, 9, '#6d6458');
      ctx.fillText(label, cx - 8, baseY + 16);
    }

    fighter(p1x, 26, 64, '#efe6d3', 'P1', 1);
    fighter(p2x, 26, 62, '#e8452f', 'P2', -1);

    /* hitbox */
    var hbW = model.boxW * scale;
    var hbH = model.boxH * scale;
    var hbX = p1x + 13 * scale;
    var hbY = baseY - (model.boxH * 0.95) * scale - 10 * scale;

    var hurtX = p2x - 14 * scale;
    var hurtY = baseY - 60 * scale;
    var hurtW = 28 * scale;
    var hurtH = 60 * scale;

    ctx.fillStyle = 'rgba(232,69,47,.20)';
    ctx.fillRect(hbX, hbY, hbW, hbH);
    ctx.strokeStyle = '#e8452f';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(hbX + 0.5, hbY + 0.5, hbW, hbH);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(69,217,192,.10)';
    ctx.fillRect(hurtX, hurtY, hurtW, hurtH);
    ctx.strokeStyle = '#45d9c0';
    ctx.strokeRect(hurtX + 0.5, hurtY + 0.5, hurtW, hurtH);

    var ox = Math.max(hbX, hurtX);
    var oright = Math.min(hbX + hbW, hurtX + hurtW);
    if (oright > ox) {
      ctx.fillStyle = 'rgba(255,194,51,.5)';
      ctx.fillRect(ox, Math.max(hbY, hurtY), oright - ox, Math.min(hbY + hbH, hurtY + hurtH) - Math.max(hbY, hurtY));
      mono(ctx, 9, '#ffc233');
      ctx.fillText('HIT', ox + 2, Math.max(hbY, hurtY) - 5);
    }

    /* reach bracket */
    ctx.strokeStyle = '#ffc233';
    ctx.beginPath();
    ctx.moveTo(p1x, baseY + 4);
    ctx.lineTo(p2x, baseY + 4);
    ctx.stroke();
    mono(ctx, 9, '#ffc233');
    ctx.fillText('REACH ' + model.reach + ' PX', (p1x + p2x) / 2 - 34, baseY + 0);
  }

  function drawTimeline(ctx, x, y, w, h) {
    ctx.strokeStyle = '#1f2a28';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    mono(ctx, 10, '#9a9083');
    ctx.fillText('FRAME TIMELINE · 60 HZ BASIS', x + 10, y + 16);

    var m = model;
    var maxF = Math.max(m.total, m.startup + m.hitstun, m.startup + m.blockstun) + 2;
    var left = x + 62;
    var right = x + w - 58;
    var px = (right - left) / maxF;
    var top = y + 30;

    function row(label, segments, ry, height) {
      mono(ctx, 9, '#9a9083');
      ctx.fillText(label, x + 8, ry + height - 2);
      var cx = left;
      segments.forEach(function (seg) {
        var sw = seg.frames * px;
        ctx.fillStyle = seg.color;
        ctx.globalAlpha = seg.alpha || 0.85;
        ctx.fillRect(cx, ry, Math.max(1, sw), height);
        ctx.globalAlpha = 1;
        if (sw > 26) {
          mono(ctx, 9, '#0b0a09');
          ctx.fillText(String(seg.frames), cx + 4, ry + height - 3);
        }
        cx += sw;
      });
      mono(ctx, 9, '#6d6458');
      ctx.fillText(maxF + 'F', right + 6, ry + height - 2);
    }

    var rowH = Math.min(26, (h - 56) / 3);
    row('P1 ATK', [
      { frames: m.startup, color: '#ffc233' },
      { frames: m.active, color: '#e8452f' },
      { frames: m.recovery, color: '#5c554a' }
    ], top, rowH);

    row('P2 HIT', [
      { frames: m.startup, color: 'transparent', alpha: 0 },
      { frames: m.hitstun, color: '#45d9c0' }
    ], top + rowH + 7, rowH);

    row('P2 BLK', [
      { frames: m.startup, color: 'transparent', alpha: 0 },
      { frames: m.blockstun, color: '#7d7468' }
    ], top + (rowH + 7) * 2, rowH);

    /* contact line */
    var cx = left + m.startup * px;
    ctx.strokeStyle = 'rgba(232,69,47,.7)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, top - 6);
    ctx.lineTo(cx, top + (rowH + 7) * 3 - 7);
    ctx.stroke();
    ctx.setLineDash([]);
    mono(ctx, 8, '#e8452f');
    ctx.fillText('HIT', cx + 3, top - 8);

    /* ruler */
    var rulerY = top + (rowH + 7) * 3 - 2;
    ctx.strokeStyle = '#332e26';
    ctx.beginPath();
    ctx.moveTo(left, rulerY);
    ctx.lineTo(right, rulerY);
    ctx.stroke();
    for (var f = 0; f <= maxF; f += 5) {
      var tx = left + f * px;
      ctx.beginPath();
      ctx.moveTo(tx, rulerY - 3);
      ctx.lineTo(tx, rulerY);
      ctx.stroke();
      mono(ctx, 8, '#6d6458');
      ctx.fillText(String(f), tx - 3, rulerY + 10);
    }

    /* advantage readout */
    var advY = rulerY + 26;
    mono(ctx, 11, m.advHit >= 0 ? '#45d9c0' : '#e8452f');
    ctx.fillText((m.advHit >= 0 ? '+' : '−') + Math.abs(m.advHit) + ' ON HIT', left, advY);
    mono(ctx, 11, m.advBlock >= 0 ? '#45d9c0' : '#e8452f');
    ctx.fillText((m.advBlock >= 0 ? '+' : '−') + Math.abs(m.advBlock) + ' ON BLOCK', left + (right - left) * 0.38, advY);
    mono(ctx, 11, '#9a9083');
    ctx.fillText(m.total + 'F TOTAL · ' + Math.round(m.total * (m.refresh / 60)) + 'F AT ' + m.refresh + ' HZ', left + (right - left) * 0.68, advY);
  }

  function drawMask(ctx, x, y, w, h) {
    var m = model;
    var strength = m.scan / 100;
    if (m.mask === 'none') {
      if (strength > 0.4) {
        ctx.fillStyle = 'rgba(0,0,0,' + (strength * 0.10).toFixed(3) + ')';
        for (var sy = y; sy < y + h; sy += 3) ctx.fillRect(x, sy, w, 1);
      }
      return;
    }
    ctx.save();
    if (m.mask === 'grille') {
      for (var gx = x; gx < x + w; gx += 3) {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.22 * strength).toFixed(3) + ')';
        ctx.fillRect(gx, y, 1, h);
      }
    } else if (m.mask === 'shadow') {
      for (var dy = y; dy < y + h; dy += 4) {
        for (var dx = x + ((dy / 4) % 2) * 2; dx < x + w; dx += 4) {
          ctx.fillStyle = 'rgba(0,0,0,' + (0.30 * strength).toFixed(3) + ')';
          ctx.fillRect(dx, dy, 1, 1);
        }
      }
    } else {
      for (var sx = x; sx < x + w; sx += 3) {
        ctx.fillStyle = 'rgba(232,69,47,' + (0.05 * strength).toFixed(3) + ')';
        ctx.fillRect(sx, y, 1, h);
        ctx.fillStyle = 'rgba(69,217,192,' + (0.05 * strength).toFixed(3) + ')';
        ctx.fillRect(sx + 1, y, 1, h);
        ctx.fillStyle = 'rgba(255,194,51,' + (0.05 * strength).toFixed(3) + ')';
        ctx.fillRect(sx + 2, y, 1, h);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,' + (0.20 * strength).toFixed(3) + ')';
    for (var ly = y; ly < y + h; ly += 3) ctx.fillRect(x, ly, w, 1);
    ctx.restore();

    /* glass vignette */
    var grd = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.25, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, w, h);
  }

  ['input', 'change'].forEach(function (evt) {
    Object.keys(ui).forEach(function (key) {
      var node = ui[key];
      if (node && node.tagName && (node.tagName === 'INPUT' || node.tagName === 'SELECT')) {
        node.addEventListener(evt, update);
      }
    });
  });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { draw(); }).observe(canvas);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });

  update();
  initRest();

  /* ---------- sound ---------- */
  var audioCtx = null;
  var master = null;
  var audioState = document.getElementById('audioState');

  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { if (audioState) audioState.textContent = 'NO WEB AUDIO'; return null; }
      audioCtx = new AC();
      master = audioCtx.createGain();
      master.gain.value = 0.18;
      master.connect(audioCtx.destination);
      if (audioState) audioState.textContent = 'AUDIO ON';
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /* two-operator FM tone */
  function fm(carrierHz, ratio, start, dur, level, index) {
    var t0 = audioCtx.currentTime + start;
    var car = audioCtx.createOscillator();
    var mod = audioCtx.createOscillator();
    var modGain = audioCtx.createGain();
    var g = audioCtx.createGain();
    car.type = 'sine';
    mod.type = 'sine';
    car.frequency.setValueAtTime(carrierHz, t0);
    mod.frequency.setValueAtTime(carrierHz * ratio, t0);
    modGain.gain.setValueAtTime(carrierHz * index, t0);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(level, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    car.connect(g);
    g.connect(master);
    car.start(t0); mod.start(t0);
    car.stop(t0 + dur + 0.02); mod.stop(t0 + dur + 0.02);
  }

  function psgNoise(start, dur, level, cutoff) {
    var t0 = audioCtx.currentTime + start;
    var len = Math.floor(audioCtx.sampleRate * dur);
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff || 2400, t0);
    var g = audioCtx.createGain();
    g.gain.value = level;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  function play(kind) {
    if (!ensureAudio()) return;
    if (kind === 'coin') {
      fm(988, 2, 0, 0.10, 0.5, 1.2);
      fm(1319, 2, 0.09, 0.26, 0.5, 1.0);
    } else if (kind === 'laser') {
      var t0 = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.22);
      g.gain.setValueAtTime(0.16, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + 0.26);
    } else if (kind === 'boom') {
      psgNoise(0, 0.55, 0.5, 900);
      var t1 = audioCtx.currentTime;
      var sub = audioCtx.createOscillator();
      var sg = audioCtx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, t1);
      sub.frequency.exponentialRampToValueAtTime(38, t1 + 0.5);
      sg.gain.setValueAtTime(0.4, t1);
      sg.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.55);
      sub.connect(sg); sg.connect(master);
      sub.start(t1); sub.stop(t1 + 0.58);
    } else if (kind === 'select') {
      fm(660, 1, 0, 0.06, 0.3, 0.4);
      fm(990, 1, 0.055, 0.09, 0.3, 0.4);
    }
  }

  document.querySelectorAll('.sfx').forEach(function (btn) {
    btn.addEventListener('click', function () { play(btn.getAttribute('data-sfx')); });
  });

  /* ---------- rest ---------- */
  function initRest() {
    var chips = document.querySelectorAll('.chip');
    var cabs = document.querySelectorAll('.cab');
    if (chips.length && cabs.length) {
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-filter');
          chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
          cabs.forEach(function (c) {
            c.hidden = !(cat === 'all' || c.getAttribute('data-cat') === cat);
          });
        });
      });
    }

    var form = document.getElementById('briefForm');
    if (!form) return;
    var ok = document.getElementById('formOk');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      function setErr(field, msg) {
        var box = document.getElementById(field.name + 'Err');
        if (box) box.textContent = msg || '';
        if (msg) problems.push(msg);
      }
      var name = form.elements.name;
      var email = form.elements.email;
      var pages = form.elements.pages;
      var message = form.elements.message;

      setErr(name, name.value.trim().length < 2 ? 'Name needed.' : '');
      setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'That address will bounce.');
      setErr(pages, pages.value && (parseInt(pages.value, 10) < 1 || parseInt(pages.value, 10) > 400) ? 'Between 1 and 400 cabinets.' : '');
      setErr(message, message.value.trim().length < 20 ? 'Tell me about the machine or the game.' : '');

      if (problems.length) { if (ok) ok.hidden = true; return; }
      if (ok) {
        ok.hidden = false;
        ok.querySelector('p').textContent = 'Credit registered, ' + name.value.trim().split(' ')[0] +
          '. I read build mail on Tuesdays and Fridays and answer with a bench slot before any money changes hands.';
        ok.scrollIntoView({ block: 'nearest' });
      }
      form.reset();
      form.querySelectorAll('.err').forEach(function (n) { n.textContent = ''; });
    });
  }
})();
