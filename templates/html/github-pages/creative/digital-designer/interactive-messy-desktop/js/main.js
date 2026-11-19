/* ============================================================
   Interactive Desktop Studio clone — desk modes, dragging, sounds, previews, flips
   No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     tiny synth: every sound is generated with the Web Audio API,
     nothing is downloaded
  ------------------------------------------------------------ */
  var Sound = (function () {
    var ctx = null;
    var enabled = true;

    function ac() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function env(gain, t0, peak, attack, release) {
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
    }

    function tone(freq, peak, attack, release, type, bend) {
      var c = ac(); if (!c || !enabled) return;
      var o = c.createOscillator(), g = c.createGain();
      var t0 = c.currentTime;
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (bend) o.frequency.exponentialRampToValueAtTime(bend, t0 + attack + release);
      env(g, t0, peak, attack, release);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + attack + release + 0.05);
    }

    function noise(duration, peak, filterFreq, sweepTo) {
      var c = ac(); if (!c || !enabled) return;
      var t0 = c.currentTime;
      var frames = Math.floor(c.sampleRate * duration);
      var buf = c.createBuffer(1, frames, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf;
      var f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(filterFreq, t0);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
      var g = c.createGain();
      env(g, t0, peak, 0.015, duration);
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start(t0);
    }

    var lib = {
      /* gentle wooden tap for picking up a desk object */
      pick: function () { tone(660, 0.05, 0.008, 0.05, 'triangle'); tone(1320, 0.02, 0.008, 0.04, 'sine'); },
      drop: function () { tone(430, 0.055, 0.006, 0.07, 'triangle'); noise(0.05, 0.015, 2400, 900); },
      /* paper rustle for the memo / dreams / notebook */
      paper: function () { noise(0.22, 0.05, 3200, 1400); noise(0.16, 0.03, 5200, 2600); },
      /* ceramic clink for the cup ring */
      clink: function () { tone(1975, 0.04, 0.004, 0.16, 'sine', 1870); tone(2637, 0.02, 0.004, 0.1, 'sine'); },
      /* the record player chimes + faint crackle */
      vinyl: function () {
        tone(880, 0.035, 0.01, 0.28, 'sine');
        tone(1174.7, 0.028, 0.01, 0.34, 'sine');
        setTimeout(function () { tone(1568, 0.02, 0.01, 0.4, 'sine'); }, 90);
        noise(0.3, 0.012, 4800);
      },
      /* AirDrop's two-note marimba */
      airdrop: function () {
        tone(1568, 0.06, 0.01, 0.22, 'sine');
        setTimeout(function () { tone(2093, 0.05, 0.01, 0.34, 'sine'); }, 110);
      },
      /* soft UI tick for buttons + toggles */
      tap: function () { tone(2400, 0.03, 0.003, 0.035, 'sine'); },
      hover: function () { tone(1200, 0.012, 0.004, 0.05, 'sine'); },
      /* a small swish when the desk rearranges itself */
      sweep: function () { noise(0.42, 0.035, 900, 4200); }
    };

    return {
      play: function (name) { if (lib[name]) lib[name](); },
      setEnabled: function (v) { enabled = v; if (v) ac(); },
      isEnabled: function () { return enabled; },
      unlock: ac
    };
  })();

  var soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', function () {
      var on = soundToggle.getAttribute('aria-pressed') !== 'true';
      soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      soundToggle.setAttribute('aria-label', on ? 'Mute sound effects' : 'Unmute sound effects');
      Sound.setEnabled(on);
      if (on) Sound.play('tap');
    });
  }

  /* first gesture unlocks audio */
  var unlock = function () { Sound.unlock(); };
  addEventListener('pointerdown', unlock, { once: true, passive: true });

  /* ------------------------------------------------------------
     desk modes
  ------------------------------------------------------------ */
  var modeBtns = document.querySelectorAll('[data-mode-btn]');

  function setMode(mode, silent) {
    if (!/^(chaos|clean|notebook)$/.test(mode)) return;
    stage.dataset.mode = mode;
    modeBtns.forEach(function (b) {
      var on = b.dataset.modeBtn === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!silent && !prefersReduced) Sound.play('sweep');
  }

  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.modeBtn); });
  });

  /* ------------------------------------------------------------
     dragging — pointer events, works for mouse and touch
  ------------------------------------------------------------ */
  var dragged = null;
  var dragState = null;

  function itemBox(el) {
    var r = el.getBoundingClientRect();
    var s = stage.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }

  function place(el, x, y) {
    /* switch from top/right anchoring to plain left/top so dragging is uniform */
    var box = itemBox(el);
    if (getComputedStyle(el).right !== 'auto') {
      el.style.right = 'auto';
      el.style.left = box.x + 'px';
      el.style.top = box.y + 'px';
    }
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  stage.querySelectorAll('.desk-item').forEach(function (el) {
    /* hover chirps */
    el.addEventListener('pointerenter', function () {
      if (dragged) return;
      var n = el.dataset.item;
      if (n === 'memo' || n === 'dreams' || n === 'notebook' || n === 'notebookOpen') Sound.play('paper');
      else if (n === 'coffee') Sound.play('clink');
      else Sound.play('hover');
    });

    el.addEventListener('dblclick', function () {
      /* double-click tidies this one object back into its mode slot */
      el.style.left = el.style.top = '';
      el.style.right = '';
    });

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      dragged = el;
      var box = itemBox(el);
      dragState = {
        dx: (e.clientX - stage.getBoundingClientRect().left) - box.x,
        dy: (e.clientY - stage.getBoundingClientRect().top) - box.y
      };
      el.classList.add('is-dragging');
      el.style.zIndex = 40;
      Sound.play('pick');
    });
  });

  addEventListener('pointermove', function (e) {
    if (!dragged) return;
    e.preventDefault();
    var s = stage.getBoundingClientRect();
    var box = itemBox(dragged);
    var x = (e.clientX - s.left) - dragState.dx;
    var y = (e.clientY - s.top) - dragState.dy;
    x = Math.max(-box.w * 0.6, Math.min(x, s.width - box.w * 0.4));
    y = Math.max(-40, Math.min(y, s.height - box.h * 0.35));
    dragged.style.transition = 'none';
    place(dragged, x, y);
  }, { passive: false });

  function endDrag() {
    if (!dragged) return;
    dragged.style.transition = '';
    dragged.classList.remove('is-dragging');
    Sound.play('drop');
    dragged = null;
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  /* keyboard nudge for focusable items */
  stage.querySelectorAll('.desk-item').forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 32 : 8;
      var map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!map[e.key]) return;
      e.preventDefault();
      var box = itemBox(el);
      place(el, box.x + map[e.key][0], box.y + map[e.key][1]);
      Sound.play('hover');
    });
  });

  /* ------------------------------------------------------------
     vinyl player
  ------------------------------------------------------------ */
  var player = document.getElementById('player');
  if (player) {
    var vinyl = player.querySelector('.vinyl');
    var toggle = player.querySelector('.player-toggle');
    vinyl.classList.add('is-spinning');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var paused = player.classList.toggle('is-paused');
      toggle.setAttribute('aria-label', paused ? 'Play the record' : 'Pause the record');
      if (!paused) { vinyl.classList.add('is-spinning'); Sound.play('vinyl'); }
      else Sound.play('tap');
    });
    vinyl.addEventListener('click', function () { toggle.click(); });
  }

  /* ------------------------------------------------------------
     folder + airdrop
  ------------------------------------------------------------ */
  var folder = document.getElementById('folder');
  if (folder) {
    folder.addEventListener('click', function () {
      folder.classList.remove('is-open');
      void folder.offsetWidth;
      folder.classList.add('is-open');
      Sound.play('drop');
    });
  }

  var airdrop = document.getElementById('airdrop');
  if (airdrop) {
    var photo = airdrop.querySelector('.ad-photo');
    var saved = airdrop.querySelector('.ad-saved');
    photo.addEventListener('click', function () {
      saved.classList.add('is-on');
      setTimeout(function () { saved.classList.remove('is-on'); }, 1600);
    });
    airdrop.querySelector('.ad-accept').addEventListener('click', function () {
      saved.classList.add('is-on');
      setTimeout(function () { saved.classList.remove('is-on'); }, 1800);
    });
  }

  /* ------------------------------------------------------------
     retro palette glyphs
  ------------------------------------------------------------ */
  var palette = document.getElementById('palette');
  if (palette) {
    var glyphs = [
      { k: 'wand', svg: '<svg viewBox="0 0 20 20"><path d="M3 17 14 6l1.5 1.5L4.5 18.5z" fill="#8a5c3a"/><path d="M12 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#e0407a"/></svg>' },
      { k: 'marquee', svg: '<svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" fill="none" stroke="#3a3a3a" stroke-dasharray="3 2" stroke-width="1.4"/></svg>' },
      { k: 'burn', svg: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" fill="#e8a33c"/><rect x="6" y="6" width="8" height="8" rx="1" fill="#fbe4b8"/></svg>' },
      { k: 'clone', svg: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="9" height="9" rx="1.5" fill="#7fa6c9"/><rect x="8" y="8" width="9" height="9" rx="1.5" fill="#4a6f96" opacity=".85"/></svg>' },
      { k: 'brush', svg: '<svg viewBox="0 0 20 20"><path d="M10 2s4 5 4 9a4 4 0 0 1-8 0c0-4 4-9 4-9z" fill="#d97b4a"/><circle cx="10" cy="13" r="1.6" fill="#fbe4b8"/></svg>' },
      { k: 'text', glyph: 'A', cls: '' },
      { k: 'eraser', svg: '<svg viewBox="0 0 20 20"><path d="M7 15H4l6-9h3l6 9h-3z" fill="#f2f0ea" stroke="#8a877e"/><path d="M6 15h9" stroke="#c9a2d8" stroke-width="2.4"/></svg>' },
      { k: 'smudge', svg: '<svg viewBox="0 0 20 20"><path d="M4 12c3-5 9-5 12-1" fill="none" stroke="#7fa6c9" stroke-width="2.2" stroke-linecap="round"/><circle cx="4" cy="12" r="1.7" fill="#4a6f96"/></svg>' },
      { k: 'lasso', svg: '<svg viewBox="0 0 20 20"><path d="M10 4c5 0 7 3 7 5s-2 3-4 3-3-1-3-2 1-2 2-2" fill="none" stroke="#3a3a3a" stroke-width="1.5"/><path d="M6 12l-2 5" stroke="#3a3a3a" stroke-width="1.5"/></svg>' },
      { k: 'type', glyph: 'A', cls: 'pxl' },
      { k: 'line', svg: '<svg viewBox="0 0 20 20"><path d="M3 17 17 3" stroke="#3a3a3a" stroke-width="1.6"/></svg>' },
      { k: 'q', glyph: '?', cls: 'pxl' },
      { k: 'rect', svg: '<svg viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="10" fill="none" stroke="#3a3a3a" stroke-width="1.5"/></svg>' },
      { k: 'poly', svg: '<svg viewBox="0 0 20 20"><path d="M4 15 10 4l6 11z" fill="none" stroke="#3a3a3a" stroke-width="1.5"/></svg>' },
      { k: 'circle', svg: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5" fill="none" stroke="#3a3a3a" stroke-width="1.5"/></svg>' },
      { k: 'roundrect', svg: '<svg viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="8" rx="4" fill="none" stroke="#3a3a3a" stroke-width="1.5"/></svg>' }
    ];
    glyphs.forEach(function (g) {
      var t = document.createElement('div');
      t.className = 'tool';
      t.setAttribute('role', 'button');
      t.setAttribute('aria-label', g.k + ' tool');
      if (g.svg) t.innerHTML = g.svg;
      else { var s = document.createElement('span'); s.className = 'glyph ' + (g.cls || ''); s.textContent = g.glyph; t.appendChild(s); }
      t.addEventListener('click', function () {
        var was = t.classList.contains('is-on');
        palette.querySelectorAll('.tool').forEach(function (x) { x.classList.remove('is-on'); });
        if (!was) t.classList.add('is-on');
        Sound.play('tap');
      });
      palette.appendChild(t);
    });
  }

  /* ------------------------------------------------------------
     work previews — hover a project row, its floating mocks appear.
     The "You" pill follows the pointer across the stage and, together
     with the coral "June" pill, glides along as the page scrolls.
  ------------------------------------------------------------ */
  var stageMini = document.getElementById('previewStage');
  var sets = {};
  document.querySelectorAll('.preview-set').forEach(function (s) { sets[s.dataset.for] = s; });

  var youCursor = document.getElementById('youCursor');
  var juneeCursor = document.getElementById('juneeCursor');

  if (stageMini && youCursor && juneeCursor) {
    /* the pills are laid out by CSS (left/top percentages); motion is a
       translate offset from that home spot, eased every frame */
    var home = { you: { x: 0, y: 0 }, junee: { x: 0, y: 0 } };
    var homeSize = { you: { w: 0, h: 0 }, junee: { w: 0, h: 0 } };
    var pointer = null;              /* stage-local pointer, or null */
    var offs = { you: { x: 0, y: 0 }, junee: { x: 0, y: 0 } };
    var targets = { you: { x: 0, y: 0 }, junee: { x: 0, y: 0 } };
    var rafId = 0;

    function readHome() {
      var csY = getComputedStyle(youCursor), csJ = getComputedStyle(juneeCursor);
      home.you.x = parseFloat(csY.left) || 0;
      home.you.y = parseFloat(csY.top) || 0;
      home.junee.x = parseFloat(csJ.left) || 0;
      home.junee.y = parseFloat(csJ.top) || 0;
      homeSize.you.w = youCursor.offsetWidth || 70;
      homeSize.you.h = youCursor.offsetHeight || 32;
      homeSize.junee.w = juneeCursor.offsetWidth || 96;
      homeSize.junee.h = juneeCursor.offsetHeight || 32;
    }

    /* how far the stage sits from the middle of the screen: +1 when it is
       just entering from below, 0 when it is centred, -1 when it has left the top */
    function glide() {
      var r = stageMini.getBoundingClientRect();
      var u = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2);
      u = Math.min(1, Math.max(-1, u));
      return { u: u, h: r.height };
    }

    function computeTargets() {
      var r = stageMini.getBoundingClientRect();
      var g = glide();
      /* wide stage: the pills ride up and down around their spot. on a phone
         the stage is short and sits low, so they start at home and drift down */
      var travel, sway;
      if (r.width < 520) {
        travel = Math.max(0, 0.75 - g.u) * r.height * 0.14;
        sway = -g.u * 16;
      } else {
        travel = -g.u * r.height * 0.30;
        sway = -g.u * r.height * 0.30 * 0.12;
      }

      /* You: the pointer while it is over the stage, otherwise its home spot */
      var bx = pointer ? pointer.x : home.you.x;
      var by = pointer ? pointer.y : home.you.y;
      bx = Math.max(10, Math.min(bx, r.width - homeSize.you.w - 10));
      by = Math.max(10, Math.min(by, r.height - homeSize.you.h - 10));

      /* keep the whole pill inside the stage while it travels */
      function clampTravel(t, base, stageSize, pillSize) {
        var lo = 10 - base, hi = stageSize - pillSize - 10 - base;
        return Math.max(lo, Math.min(t, hi));
      }
      targets.you.x = (bx - home.you.x) + clampTravel(sway, bx, r.width, homeSize.you.w);
      targets.you.y = (by - home.you.y) + clampTravel(travel, by, r.height, homeSize.you.h);

      /* June drifts a little less, so the two never lock together */
      targets.junee.x = clampTravel(sway * 0.55, home.junee.x, r.width, homeSize.junee.w);
      targets.junee.y = clampTravel(travel * 0.55, home.junee.y, r.height, homeSize.junee.h);

      kick();
    }

    function tick() {
      var busy = false;
      [['you', youCursor, 0.17], ['junee', juneeCursor, 0.09]].forEach(function (t) {
        var k = t[0], el = t[1], ease = prefersReduced ? 1 : t[2];
        var o = offs[k], g = targets[k];
        o.x += (g.x - o.x) * ease;
        o.y += (g.y - o.y) * ease;
        if (Math.abs(g.x - o.x) > 0.15 || Math.abs(g.y - o.y) > 0.15) busy = true;
        else { o.x = g.x; o.y = g.y; }
        el.style.transform =
          'translate3d(' + o.x.toFixed(2) + 'px,' + o.y.toFixed(2) + 'px,0) translate(-18%, -22%)';
      });
      rafId = busy ? requestAnimationFrame(tick) : 0;
    }

    function kick() {
      if (!rafId && !prefersReduced) rafId = requestAnimationFrame(tick);
      else if (prefersReduced) tick();
    }

    readHome();

    var lastPoint = { x: -1, y: -1 };
    stageMini.addEventListener('pointermove', function (e) {
      /* browsers re-send the pointer position while the page scrolls under a
         still finger or mouse; those repeats must not pin the pill in place,
         otherwise it never travels with the scroll */
      if (e.clientX === lastPoint.x && e.clientY === lastPoint.y) return;
      lastPoint.x = e.clientX;
      lastPoint.y = e.clientY;
      var r = stageMini.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      computeTargets();
    });
    stageMini.addEventListener('pointerleave', function () {
      pointer = null;
      lastPoint.x = -1;
      lastPoint.y = -1;
      computeTargets();
    });

    addEventListener('scroll', computeTargets, { passive: true });
    addEventListener('resize', function () { readHome(); computeTargets(); });
    computeTargets();
  }

  document.querySelectorAll('.project').forEach(function (p) {
    var set = sets[p.dataset.proj];
    if (!set) return;
    p.addEventListener('pointerenter', function () {
      Object.keys(sets).forEach(function (k) { sets[k].classList.toggle('is-on', k === p.dataset.proj); });
      Sound.play('hover');
    });
  });

  /* phones have no hover: open the stage on the first project so it is never
     an empty box, and keep it that way when a touch leaves the list */
  var narrow = matchMedia('(max-width: 760px)');
  function firstProjectSet() {
    var first = document.querySelector('.project');
    return first && sets[first.dataset.proj];
  }
  if (narrow.matches) {
    var def = firstProjectSet();
    if (def) def.classList.add('is-on');
  }

  var list = document.getElementById('projectList');
  if (list) {
    list.addEventListener('pointerleave', function () {
      Object.keys(sets).forEach(function (k) { sets[k].classList.remove('is-on'); });
      if (narrow.matches) {
        var def = firstProjectSet();
        if (def) def.classList.add('is-on');
      }
    });
  }

  /* ------------------------------------------------------------
     flip cards
  ------------------------------------------------------------ */
  document.querySelectorAll('[data-flip]').forEach(function (card) {
    var front = card.querySelector('.flip-front');
    var back = card.querySelector('.flip-back');
    function flip() {
      card.classList.toggle('is-flipped');
      Sound.play('paper');
    }
    front.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      flip();
    });
    front.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === front) { e.preventDefault(); flip(); }
    });
    back.addEventListener('click', function () { card.classList.remove('is-flipped'); });
  });

  /* ------------------------------------------------------------
     reveal on scroll
  ------------------------------------------------------------ */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (r) { io.observe(r); });
  } else {
    revealables.forEach(function (r) { r.classList.add('is-in'); });
  }

  /* export for QA harness */
  window.__desk = { setMode: setMode, Sound: Sound };
})();
