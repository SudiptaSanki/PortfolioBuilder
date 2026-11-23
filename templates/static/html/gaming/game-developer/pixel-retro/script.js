/* Arjun Mehra — 8-bit portfolio
   Sprite editor, palette swap, opt-in chiptune. No autoplay, no storage. */

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

  /* ---------- sprite editor ---------- */
  var canvas = document.getElementById('spriteCanvas');
  if (!canvas) { initRest(); return; }

  var N = 16;
  var PALETTES = {
    pico8: { name: 'PICO-8', colors: ['#1d2b53', '#ff004d', '#ffec27', '#29adff'] },
    dmg: { name: 'GAME BOY', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    nes: { name: 'NES', colors: ['#3a3a4a', '#e40058', '#fbd000', '#58d854'] },
    mono: { name: 'MONO', colors: ['#161616', '#5a5a5a', '#a8a8a8', '#f2e9d8'] }
  };

  var INITIAL = [
    '0000000000000000',
    '0000000330000000',
    '0000000330000000',
    '0000111111110000',
    '0001122222211000',
    '0011222222221100',
    '0011223322331100',
    '0011222222221100',
    '0011222222221100',
    '0011222222221100',
    '0011223333331100',
    '0001122222211000',
    '0000111111110000',
    '0000010000100000',
    '0000110000110000',
    '0000000000000000'
  ];

  var grid = [];
  var paletteKey = 'pico8';
  var selected = 1;
  var erasing = false;
  var drawing = false;

  INITIAL.forEach(function (row) {
    grid.push(row.split('').map(function (c) { return parseInt(c, 10); }));
  });

  var ctx = canvas.getContext('2d');

  function colors() { return PALETTES[paletteKey].colors; }

  function paintCanvas() {
    var cssW = canvas.clientWidth || 320;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var side = Math.round(cssW);
    canvas.width = Math.round(side * dpr);
    canvas.height = Math.round(side * dpr);
    canvas.style.height = side + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cell = side / N;
    var pal = colors();

    ctx.fillStyle = '#0b0a18';
    ctx.fillRect(0, 0, side, side);

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        ctx.fillStyle = pal[grid[y][x]];
        ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }

    /* grid */
    ctx.strokeStyle = 'rgba(242,233,216,.09)';
    ctx.lineWidth = 1;
    for (var i = 1; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(i * cell) + 0.5, 0);
      ctx.lineTo(Math.round(i * cell) + 0.5, side);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, Math.round(i * cell) + 0.5);
      ctx.lineTo(side, Math.round(i * cell) + 0.5);
      ctx.stroke();
    }

    /* 8x8 tile split */
    ctx.strokeStyle = 'rgba(255,209,102,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side / 2, 0);
    ctx.lineTo(side / 2, side);
    ctx.moveTo(0, side / 2);
    ctx.lineTo(side, side / 2);
    ctx.stroke();

    /* selected colour marker */
    ctx.strokeStyle = '#f2e9d8';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, side - 2, side - 2);
  }

  function toHex() {
    var out = [];
    for (var y = 0; y < N; y++) {
      var bytes = [0, 0, 0, 0];
      for (var x = 0; x < N; x++) {
        bytes[Math.floor(x / 4)] |= grid[y][x] << (6 - (x % 4) * 2);
      }
      out.push(bytes.map(function (b) { return ('0' + b.toString(16).toUpperCase()).slice(-2); }).join(' '));
    }
    return out;
  }

  function updateHex() {
    var lines = toHex();
    var used = {};
    grid.forEach(function (row) { row.forEach(function (v) { used[v] = true; }); });
    var count = Object.keys(used).length;
    var hexOut = document.getElementById('hexOut');
    var colorCount = document.getElementById('colorCount');
    var romCost = document.getElementById('romCost');
    if (hexOut) hexOut.textContent = lines.join(' ');
    if (colorCount) colorCount.textContent = count + ' of 4';
    if (romCost) romCost.textContent = (N * N * 2 / 8) + ' B';
  }

  function cellFromEvent(e) {
    var rect = canvas.getBoundingClientRect();
    var x = Math.floor(((e.clientX - rect.left) / rect.width) * N);
    var y = Math.floor(((e.clientY - rect.top) / rect.height) * N);
    return {
      x: Math.max(0, Math.min(N - 1, x)),
      y: Math.max(0, Math.min(N - 1, y))
    };
  }

  function paintAt(e) {
    var c = cellFromEvent(e);
    grid[c.y][c.x] = erasing ? 0 : selected;
    paintCanvas();
    updateHex();
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    drawing = true;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    paintAt(e);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    paintAt(e);
  });
  window.addEventListener('pointerup', function () { drawing = false; });
  canvas.addEventListener('pointercancel', function () { drawing = false; });

  var eraserBtn = document.getElementById('eraseBtn');
  if (eraserBtn) {
    eraserBtn.addEventListener('click', function () {
      erasing = !erasing;
      eraserBtn.setAttribute('aria-pressed', erasing ? 'true' : 'false');
    });
  }

  var flipBtn = document.getElementById('flipBtn');
  if (flipBtn) {
    flipBtn.addEventListener('click', function () {
      grid = grid.map(function (row) { return row.slice().reverse(); });
      paintCanvas();
      updateHex();
    });
  }

  var clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      grid = grid.map(function (row) { return row.map(function () { return 0; }); });
      paintCanvas();
      updateHex();
    });
  }

  document.querySelectorAll('.pal-btn').forEach(function (btn) {
    var key = btn.getAttribute('data-pal');
    var pal = PALETTES[key];
    if (pal) {
      var swatches = btn.querySelectorAll('span');
      pal.colors.forEach(function (c, i) {
        if (swatches[i]) swatches[i].style.background = c;
      });
    }
    btn.addEventListener('click', function () {
      paletteKey = key;
      document.querySelectorAll('.pal-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var label = document.getElementById('paletteName');
      if (label) label.textContent = pal.name;
      paintCanvas();
    });
  });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { paintCanvas(); }).observe(canvas);
  }

  paintCanvas();
  updateHex();

  /* ---------- chiptune bench ---------- */
  var audioCtx = null;
  var master = null;
  var vol = document.getElementById('vol');
  var audioState = document.getElementById('audioState');
  var audioNote = document.getElementById('audioNote');

  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        if (audioState) audioState.textContent = 'NO WEB AUDIO';
        return null;
      }
      audioCtx = new AC();
      master = audioCtx.createGain();
      master.gain.value = parseFloat(vol.value) / 100 * 0.5;
      master.connect(audioCtx.destination);
      if (audioState) audioState.textContent = 'CHIP ONLINE';
      if (audioNote) audioNote.textContent = 'Chip is running. Every sound is a one-shot; nothing loops and nothing is loaded from a file.';
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function pulse(freq, start, dur, gainLevel, type) {
    var t0 = audioCtx.currentTime + start;
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gainLevel, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    return osc;
  }

  function noise(start, dur, gainLevel, freq) {
    var t0 = audioCtx.currentTime + start;
    var len = Math.floor(audioCtx.sampleRate * dur);
    var buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    var src = audioCtx.createBufferSource();
    src.buffer = buffer;
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 1200;
    filter.Q.value = 0.9;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(gainLevel, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  function playSfx(kind) {
    if (!ensureAudio()) return;
    if (kind === 'coin') {
      pulse(987.8, 0, 0.07, 0.22);
      pulse(1318.5, 0.075, 0.16, 0.22);
    } else if (kind === 'jump') {
      var osc = pulse(220, 0, 0.19, 0.2);
      osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.18);
    } else if (kind === 'hit') {
      noise(0, 0.24, 0.4, 900);
      noise(0.02, 0.12, 0.2, 2400);
    } else if (kind === 'power') {
      [523.3, 659.3, 784, 1046.5].forEach(function (f, i) {
        pulse(f, i * 0.06, 0.09, 0.18);
      });
    }
  }

  document.querySelectorAll('.sfx').forEach(function (btn) {
    btn.addEventListener('click', function () {
      playSfx(btn.getAttribute('data-sfx'));
    });
  });

  if (vol) {
    vol.addEventListener('input', function () {
      var out = document.getElementById('volOut');
      if (out) out.textContent = vol.value + '%';
      if (master) master.gain.value = parseFloat(vol.value) / 100 * 0.5;
    });
  }

  initRest();

  /* ---------- filters, form ---------- */
  function initRest() {
    var chips = document.querySelectorAll('.chip');
    var games = document.querySelectorAll('.game');
    if (chips.length && games.length) {
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-filter');
          chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
          games.forEach(function (g) {
            g.hidden = !(cat === 'all' || g.getAttribute('data-cat') === cat);
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
      setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Check the email address.');
      setErr(pages, pages.value && (parseInt(pages.value, 10) < 1 || parseInt(pages.value, 10) > 500) ? 'Between 1 and 500 sprites.' : '');
      setErr(message, message.value.trim().length < 20 ? 'A sentence about the game, please.' : '');

      if (problems.length) { if (ok) ok.hidden = true; return; }
      if (ok) {
        ok.hidden = false;
        ok.querySelector('p').textContent = 'Thanks, ' + name.value.trim().split(' ')[0] + '. Your note is queued for the next Wednesday batch — I answer with a sprite test before quoting.';
        ok.scrollIntoView({ block: 'nearest' });
      }
      form.reset();
      form.querySelectorAll('.err').forEach(function (n) { n.textContent = ''; });
    });
  }
})();
