/* Haft Sin Spring — interactions
   Silent by design: no audio anywhere in this build. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    '.section-head, .seven-list li, .cloth-wrap, .tray-panel, .method-media, .steps li, .work-card, .quote blockquote, .timeline li, .project, .form-card, .contact-side, .page-head .lead'
  );
  if ('IntersectionObserver' in window && !reduce) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- item artwork (hand-drawn line SVG) ---------- */
  var ART = {
    sabzeh:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><ellipse cx="22" cy="35" rx="13" ry="4" fill="#C9A97A"/><path d="M10 34c0-4 5-6 12-6s12 2 12 6" fill="none" stroke="#8A4C0B" stroke-width="1.2"/><path d="M22 33V13M22 22c-6 0-9-4-9-9 6 0 9 3 9 9ZM22 19c6 0 9-4 9-9-6 0-9 3-9 9ZM22 27c-4 0-6-3-6-6 4 0 6 2 6 6Z" fill="none" stroke="#5F7C4B" stroke-width="1.5" stroke-linecap="round"/></svg>',
    samanu:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M8 21h28c0 11-6 17-14 17S8 32 8 21Z" fill="#C0883E" opacity="0.28"/><path d="M8 21h28c0 11-6 17-14 17S8 32 8 21Z" fill="none" stroke="#8A4C0B" stroke-width="1.4"/><path d="M13 21c2-2 7-2 9 0 2-2 7-2 9 0" fill="none" stroke="#8A4C0B" stroke-width="1.2"/><path d="M17 12c3-3 0-6 0-8M22 12c3-3 0-6 0-8M27 12c3-3 0-6 0-8" fill="none" stroke="#A96012" stroke-width="1.2" stroke-linecap="round"/></svg>',
    senjed:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M22 16c4 0 6 5 6 10s-2 9-6 9-6-4-6-9 2-10 6-10Z" fill="#C97A3A" opacity="0.28" stroke="#A96012" stroke-width="1.3"/><path d="M22 16c0-5 4-9 10-9 0 6-4 9-10 9ZM14 31c3 2 5 5 5 8" fill="none" stroke="#5F7C4B" stroke-width="1.3"/></svg>',
    seer:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M22 11c6 0 11 8 11 16 0 6-5 10-11 10s-11-4-11-10c0-8 5-16 11-16Z" fill="#F0E6D2" stroke="#8A4C0B" stroke-width="1.3"/><path d="M22 11V4M22 15v22M17 30c2-3 8-3 10 0M17 22c3-2 7-2 10 0" fill="none" stroke="#8A4C0B" stroke-width="1"/></svg>',
    seeb:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M22 16c5-4 13-1 13 9 0 8-6 13-13 13s-13-5-13-13c0-10 8-13 13-9Z" fill="#B34A3A" opacity="0.25" stroke="#8A2F22" stroke-width="1.3"/><path d="M22 16c0-5 2-8 6-10M22 12c-3-1-6-1-8 1" fill="none" stroke="#5F7C4B" stroke-width="1.3"/></svg>',
    serkeh:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M18 7h8v8l5 8v14a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V23l5-8Z" fill="#E9E0CC" stroke="#8A4C0B" stroke-width="1.3"/><path d="M13 27h18M20 5h4" stroke="#8A4C0B" stroke-width="1.2"/><path d="M16 31h12" stroke="#6E5D93" stroke-width="1.4"/></svg>',
    somaq:
      '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M10 29h24c0 6-5 9-12 9s-12-3-12-9Z" fill="#A3392B" opacity="0.25" stroke="#8A2F22" stroke-width="1.3"/><path d="M22 29V14M22 20c5 1 8-1 9-5-4-1-7 1-9 5ZM22 18c-5 1-8-1-9-5 4-1 7 1 9 5Z" fill="none" stroke="#5F7C4B" stroke-width="1.2"/></svg>'
  };

  var NAMES = {
    sabzeh: 'Sabzeh', samanu: 'Samanu', senjed: 'Senjed', seer: 'Seer',
    seeb: 'Seeb', serkeh: 'Serkeh', somaq: 'Somaq'
  };
  var LINES = {
    sabzeh: 'Sabzeh · sprouted wheat, front left, 26 cm',
    samanu: 'Samanu · wheat-germ pudding, in the copper bowl',
    senjed: 'Senjed · dried oleaster, small dish, right of samanu',
    seer: 'Seer · one garlic bulb on a saucer',
    seeb: 'Seeb · two apples, stem up',
    serkeh: 'Serkeh · aged vinegar, glass bottle with the year on it',
    somaq: 'Somaq · sumac drawn into a cone, shallow dish'
  };
  var EXTRA_LINES = {
    mirror: 'Mirror · facing the door',
    candles: 'Candles · two, lit last',
    goldfish: 'Goldfish · bowl at the right end',
    eggs: 'Painted eggs · one per child at the table',
    coins: 'Coins · in a small dish by the mirror',
    hyacinth: 'Hyacinth · one stem, left of the mirror',
    wheat: 'Wheat sheaf · tied, leaning at the back'
  };

  /* fill decorative art slots */
  Object.keys(ART).forEach(function (key) {
    var trayArt = document.querySelector('.tray-item[data-item="' + key + '"] .tray-art');
    if (trayArt) trayArt.innerHTML = ART[key];
  });

  /* ---------- sofreh builder ---------- */
  var grid = document.getElementById('sofrehGrid');
  if (grid) {
    var slots = Array.prototype.slice.call(grid.querySelectorAll('.slot'));
    var trayBtns = Array.prototype.slice.call(document.querySelectorAll('.tray-item'));
    var countEl = document.getElementById('sofrehCount');
    var statusEl = document.getElementById('sofrehStatus');
    var listEl = document.getElementById('sofrehList');
    var fillEl = document.getElementById('meterFill');
    var extrasEl = document.getElementById('extras');
    var state = new Array(7).fill(null);

    function extrasChecked() {
      if (!extrasEl) return [];
      return Array.prototype.slice.call(extrasEl.querySelectorAll('input:checked')).map(function (i) { return i.value; });
    }

    function render() {
      slots.forEach(function (slot, i) {
        var key = state[i];
        var art = slot.querySelector('.slot-art');
        var name = slot.querySelector('.slot-name');
        if (key) {
          art.innerHTML = ART[key];
          name.textContent = NAMES[key];
          slot.classList.add('filled');
          slot.setAttribute('aria-label', 'Place ' + (i + 1) + ', ' + NAMES[key] + '. Remove');
        } else {
          art.innerHTML = '';
          name.textContent = 'empty';
          slot.classList.remove('filled');
          slot.setAttribute('aria-label', 'Place ' + (i + 1) + ', empty');
        }
      });

      var placed = state.filter(Boolean);
      countEl.textContent = placed.length + ' of 7';
      fillEl.style.width = (placed.length / 7 * 100) + '%';

      trayBtns.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(state.indexOf(btn.dataset.item) > -1));
      });

      var missing = Object.keys(NAMES).filter(function (k) { return state.indexOf(k) === -1; });
      var message;
      if (placed.length === 0) {
        message = 'Nothing on the cloth yet. Start with sabzeh at the left corner, it is the tallest.';
      } else if (missing.length === 0) {
        message = 'The seven are seated. Mirror and candles go in last, and the candles are the last thing lit.';
      } else if (missing.length === 1) {
        message = 'Six places taken. One to go: ' + NAMES[missing[0]] + '.';
      } else {
        message = placed.length + ' places taken. Still to seat: ' + missing.map(function (k) { return NAMES[k]; }).join(', ') + '.';
      }
      statusEl.textContent = message;

      var lines = [];
      state.forEach(function (k, i) {
        if (k) lines.push('Place ' + (i + 1) + ' — ' + LINES[k]);
      });
      extrasChecked().forEach(function (k) { lines.push('Also — ' + EXTRA_LINES[k]); });
      listEl.innerHTML = lines.map(function (l) {
        var li = document.createElement('li');
        li.textContent = l;
        return li.outerHTML;
      }).join('');
    }

    trayBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.item;
        var at = state.indexOf(key);
        if (at > -1) {
          state[at] = null;
        } else {
          var free = state.indexOf(null);
          if (free === -1) {
            statusEl.textContent = 'All seven places are taken. Tap one on the cloth to lift it off first.';
            return;
          }
          state[free] = key;
        }
        render();
      });
    });

    slots.forEach(function (slot, i) {
      slot.addEventListener('click', function () {
        if (state[i]) {
          state[i] = null;
          render();
        }
      });
    });

    if (extrasEl) {
      extrasEl.addEventListener('change', render);
    }

    var resetBtn = document.getElementById('buildReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state = new Array(7).fill(null);
        render();
      });
    }

    var copyBtn = document.getElementById('buildCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var placed = state.filter(Boolean);
        var text = 'Haft-sin table plan — Shirin Navaei, Tehran\n\n';
        text += placed.length ? '' : 'No S items placed yet.\n';
        state.forEach(function (k, i) { if (k) text += 'Place ' + (i + 1) + ': ' + LINES[k] + '\n'; });
        var extras = extrasChecked();
        if (extras.length) text += '\nAlso on the table:\n' + extras.map(function (k) { return '- ' + EXTRA_LINES[k]; }).join('\n') + '\n';
        text += '\nDressing order: cloth, mirror, seven from heaviest to lightest, candles last.';
        var done = function (ok) {
          copyBtn.textContent = ok ? 'Plan copied' : 'Press Ctrl+C to copy';
          setTimeout(function () { copyBtn.textContent = 'Copy the table plan'; }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          document.body.removeChild(ta);
          done(ok);
        }
      });
    }

    render();
  }

  /* ---------- sprouting wheat canvas (hero) ---------- */
  var canvas = document.getElementById('sprouts');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var blades = [];
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function buildBlades() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width || 800;
      h = rect.height || 110;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      blades = [];
      var count = Math.max(24, Math.round(w / 16));
      for (var i = 0; i < count; i++) {
        blades.push({
          x: (i + 0.5) * (w / count) + (Math.random() - 0.5) * 8,
          hh: h * (0.28 + Math.random() * 0.62),
          lean: (Math.random() - 0.5) * 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.5,
          hue: Math.random()
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (var i = 0; i < blades.length; i++) {
        var b = blades[i];
        var sway = Math.sin(t * 0.0006 * b.speed + b.phase) * 4;
        var tipX = b.x + b.lean * b.hh * 0.35 + sway;
        var tipY = h - b.hh;
        ctx.beginPath();
        ctx.moveTo(b.x, h);
        ctx.quadraticCurveTo(b.x + (tipX - b.x) * 0.25, h - b.hh * 0.6, tipX, tipY);
        ctx.strokeStyle = b.hue > 0.72 ? 'rgba(169, 96, 18, 0.32)' : 'rgba(95, 124, 75, 0.34)';
        ctx.lineWidth = b.hue > 0.85 ? 1.5 : 1.1;
        ctx.stroke();
        if (b.hue > 0.55) {
          ctx.beginPath();
          ctx.arc(tipX, tipY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(201, 154, 63, 0.55)';
          ctx.fill();
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    }

    buildBlades();
    if (reduce) {
      draw(0);
    } else {
      requestAnimationFrame(draw);
    }
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { buildBlades(); if (reduce) draw(0); }, 180);
    });
  }

  /* ---------- project filters ---------- */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    var projects = document.querySelectorAll('.project');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        var key = btn.dataset.filter;
        var shown = 0;
        projects.forEach(function (p) {
          var match = key === 'all' || (p.dataset.scale || '').split(' ').indexOf(key) > -1;
          p.hidden = !match;
          if (match) shown++;
        });
        var empty = document.getElementById('filterEmpty');
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('brief-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = ['name', 'email', 'message'];
      var ok = true;
      required.forEach(function (id) {
        var el = form.querySelector('#' + id);
        if (!el) return;
        var wrap = el.closest('.field');
        var valid = el.value.trim().length > 0;
        if (id === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (!valid) {
          wrap.classList.add('invalid');
          ok = false;
        } else {
          wrap.classList.remove('invalid');
        }
      });
      if (!ok) {
        status.className = 'form-status err on';
        status.textContent = 'Two things are missing: a name, a working email, or a sentence about the table.';
        return;
      }
      var name = form.querySelector('#name').value.trim().split(' ')[0];
      status.className = 'form-status on';
      status.textContent = 'Thank you, ' + name + '. Your brief is in the workshop inbox and I answer within two working days. If your date is inside three weeks, write “urgent” in the subject and I will look at it first.';
      form.reset();
    });

    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
