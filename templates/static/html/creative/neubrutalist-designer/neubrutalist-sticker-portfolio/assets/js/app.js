/* Neubrutalist Studio — portfolio interactions
   Faithful spring-physics rebuild of the original framer-motion behaviour:
   - hero stickers: staggered spring entrance (stiffness 80 / damping 15, 1s + 100ms stagger),
     hover / drag scale 1.1, elastic drag constraints (dragElastic .1) and a 600/20 bounce back
   - scroll reveals: spring translate (stiffness 100 / damping 10), optional re-trigger
   - section background colour transitions, mobile drawer, contact terminal            */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = 768;

  /* ==========================================================================
     spring engine — semi-implicit Euler, fixed sub-steps, rest threshold
     ========================================================================== */
  function Spring(value, stiffness, damping, mass) {
    this.v = value;
    this.vel = 0;
    this.target = value;
    this.k = stiffness || 100;
    this.c = damping || 10;
    this.m = mass || 1;
    this.moving = false;
  }
  Spring.prototype.to = function (value, stiffness, damping) {
    if (typeof stiffness === 'number') this.k = stiffness;
    if (typeof damping === 'number') this.c = damping;
    this.target = value;
    this.moving = true;
  };
  Spring.prototype.jump = function (value) {
    this.v = value;
    this.target = value;
    this.vel = 0;
    this.moving = false;
  };
  Spring.prototype.step = function (dt) {
    if (!this.moving) return false;
    var sub = Math.min(8, Math.max(1, Math.ceil(dt * 240)));
    var h = dt / sub;
    for (var i = 0; i < sub; i++) {
      var a = (-this.k * (this.v - this.target) - this.c * this.vel) / this.m;
      this.vel += a * h;
      this.v += this.vel * h;
    }
    if (Math.abs(this.vel) < 0.02 && Math.abs(this.v - this.target) < 0.02) {
      this.v = this.target;
      this.vel = 0;
      this.moving = false;
    }
    return true;
  };

  var bodies = [];
  var ticking = false;
  var lastTime = 0;
  function tick(t) {
    var dt = lastTime ? Math.min((t - lastTime) / 1000, 0.064) : 0.016;
    lastTime = t;
    var active = false;
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i].step(dt)) active = true;
    }
    if (active) {
      requestAnimationFrame(tick);
    } else {
      ticking = false;
      lastTime = 0;
    }
  }
  function kick() {
    if (ticking) return;
    ticking = true;
    lastTime = 0;
    requestAnimationFrame(tick);
  }
  function register(body) {
    if (bodies.indexOf(body) === -1) bodies.push(body);
    kick();
  }

  /* ==========================================================================
     nav + mobile drawer (spring-ish slide, damping 20)
     ========================================================================== */
  var panel = document.getElementById('menu-panel');
  var toggle = document.getElementById('menu-toggle');
  var closeBtn = document.getElementById('menu-close');

  function openMenu() {
    if (!panel) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  }
  function closeMenu() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }
  if (toggle) toggle.addEventListener('click', function () {
    panel && panel.classList.contains('open') ? closeMenu() : openMenu();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  Array.prototype.forEach.call(document.querySelectorAll('[data-menu-link]'), function (a) {
    a.addEventListener('click', closeMenu);
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('data-scroll'));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      closeMenu();
    });
  });

  /* ==========================================================================
     section background colours (threshold .5, same as the original observer)
     ========================================================================== */
  var sections = document.querySelectorAll('section[data-bgcolor]');
  var bgLayer = document.getElementById('bg-layer');
  if (sections.length && bgLayer && 'IntersectionObserver' in window) {
    // a 1px band across the middle of the viewport: the section the reader is
    // looking at owns the page colour, whatever the viewport height is
    var bgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var colour = entry.target.getAttribute('data-bgcolor');
        if (colour) bgLayer.style.backgroundColor = colour;
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    Array.prototype.forEach.call(sections, function (s) { bgObserver.observe(s); });
    // fallback for the very first paint and for browsers without IO
    var first = sections[0].getAttribute('data-bgcolor');
    if (first) bgLayer.style.backgroundColor = first;
  }

  /* ==========================================================================
     scroll reveals — spring x / y / scale + opacity
     ========================================================================== */
  function readNumber(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw === null || raw === '') return fallback;
    var n = parseFloat(raw);
    return isNaN(n) ? fallback : n;
  }

  function initReveals() {
    var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    var counters = new WeakMap();

    els.forEach(function (el) {
      var type = el.getAttribute('data-reveal') || 'up';
      var dist = readNumber(el, 'data-reveal-dist', type === 'up' ? 50 : 100);
      var once = el.getAttribute('data-reveal-once') !== 'false';
      var margin = el.getAttribute('data-reveal-margin') || '-10% 0px -10% 0px';
      var immediate = el.getAttribute('data-reveal-now') === 'true';

      // stagger siblings that share a parent when no explicit delay is given
      var explicitDelay = el.getAttribute('data-reveal-delay');
      var delay;
      if (explicitDelay !== null) {
        delay = parseFloat(explicitDelay) || 0;
      } else if (type === 'up' && el.parentElement && el.parentElement.children.length > 1) {
        var idx = counters.get(el.parentElement) || 0;
        counters.set(el.parentElement, idx + 1);
        delay = idx * 0.1;
      } else {
        delay = 0;
      }

      var fromX = 0, fromY = 0, fromS = 1;
      if (type === 'left') fromX = -dist;
      else if (type === 'right') fromX = dist;
      else if (type === 'up') fromY = dist;
      else if (type === 'scale') fromS = 0.9;

      var sx = new Spring(fromX, 100, 10);
      var sy = new Spring(fromY, 100, 10);
      var ss = new Spring(fromS, 140, 12);
      var so = new Spring(0, 100, 22);

      var frame = {
        step: function (dt) {
          var moved = sx.step(dt) | sy.step(dt) | ss.step(dt) | so.step(dt);
          el.style.transform = 'translate3d(' + sx.v + 'px,' + sy.v + 'px,0) scale(' + ss.v + ')';
          el.style.opacity = Math.max(0, Math.min(1, so.v));
          return !!moved;
        }
      };

      function rest() {
        sx.jump(fromX); sy.jump(fromY); ss.jump(fromS); so.jump(0);
        el.style.transform = 'translate3d(' + fromX + 'px,' + fromY + 'px,0) scale(' + fromS + ')';
        el.style.opacity = 0;
        el.style.willChange = 'transform, opacity';
      }
      function play() {
        register(frame);
        sx.to(0, 100, 10);
        sy.to(0, 100, 10);
        ss.to(1, 140, 12);
        so.to(1, 100, 22);
      }

      if (reduceMotion) {
        el.style.opacity = 1;
        el.style.transform = 'none';
        return;
      }

      rest();

      var played = false;
      function trigger() {
        if (played && once) return;
        played = true;
        window.setTimeout(play, delay * 1000);
      }

      if (immediate) {
        trigger();
        return;
      }

      if (!('IntersectionObserver' in window)) {
        play();
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            trigger();
            if (once) observer.unobserve(el);
          } else if (!once) {
            played = false;
            rest();
          }
        });
      }, { rootMargin: margin, threshold: 0.15 });
      observer.observe(el);
    });
  }

  /* ==========================================================================
     hero stickers — spring entrance, elastic drag, hover scale
     ========================================================================== */
  function initStickers() {
    var stickers = [].slice.call(document.querySelectorAll('.sticker'));
    if (!stickers.length) return;

    var hero = document.querySelector('#home section') || stickers[0].parentElement;

    stickers.forEach(function (el, i) {
      var cfg = {
        x: readNumber(el, 'data-x', 0),
        y: readNumber(el, 'data-y', 0),
        mx: readNumber(el, 'data-mx', 0),
        my: readNumber(el, 'data-my', 0),
        rot: readNumber(el, 'data-rot', 0)
      };

      var homeX = window.innerWidth < MOBILE ? cfg.mx : cfg.x;
      var homeY = window.innerWidth < MOBILE ? cfg.my : cfg.y;

      var sx = new Spring(0, 80, 15);
      var sy = new Spring(0, 80, 15);
      var sr = new Spring(0, 80, 15);
      var ss = new Spring(1, 300, 20);
      var so = new Spring(0, 100, 22);

      function render() {
        el.style.transform = 'translate3d(' + sx.v + 'px,' + sy.v + 'px,0) rotate(' + sr.v + 'deg) scale(' + ss.v + ')';
        el.style.opacity = Math.max(0, Math.min(1, so.v));
      }

      var body = {
        step: function (dt) {
          var moved = sx.step(dt) | sy.step(dt) | sr.step(dt) | ss.step(dt) | so.step(dt);
          render();
          return !!moved;
        }
      };

      render();
      register(body);

      // keep the responsive home position in sync with the breakpoint
      window.addEventListener('resize', function () {
        if (dragging) return;
        homeX = window.innerWidth < MOBILE ? cfg.mx : cfg.x;
        homeY = window.innerWidth < MOBILE ? cfg.my : cfg.y;
        sx.to(homeX, 80, 15);
        sy.to(homeY, 80, 15);
        register(body);
      });

      // ---- entrance: spring out from the centre, 1s delay + 100ms stagger
      window.setTimeout(function () {
        if (reduceMotion) {
          sx.jump(homeX); sy.jump(homeY); sr.jump(cfg.rot); so.jump(1);
          render();
          return;
        }
        so.to(1, 100, 22);
        sx.to(homeX, 80, 15);
        sy.to(homeY, 80, 15);
        sr.to(cfg.rot, 80, 15);
        register(body);
      }, 1000 + i * 100);

      // ---- hover / drag scale
      el.addEventListener('pointerenter', function () {
        ss.to(1.1, 300, 20);
        register(body);
      });
      el.addEventListener('pointerleave', function () {
        if (dragging) return;
        ss.to(1, 300, 20);
        register(body);
      });

      // ---- drag with elastic constraints (dragElastic .1) + 600/20 bounce
      var dragging = false, moved = false;
      var startX = 0, startY = 0, baseX = 0, baseY = 0;
      var bounds = null;

      function computeBounds() {
        var rect = el.getBoundingClientRect();
        var w = el.offsetWidth * ss.v;
        var h = el.offsetHeight * ss.v;
        var left0 = rect.left - sx.v;
        var top0 = rect.top - sy.v;
        var box = hero.getBoundingClientRect();
        var pad = 8;
        bounds = {
          minX: box.left + pad - left0,
          maxX: box.right - pad - (left0 + w),
          minY: box.top + pad - top0,
          maxY: box.bottom - pad - (top0 + h)
        };
      }
      function elastic(value, min, max, factor) {
        if (value < min) return min - (min - value) * factor;
        if (value > max) return max + (value - max) * factor;
        return value;
      }
      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      el.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        baseX = sx.v;
        baseY = sy.v;
        sx.vel = sy.vel = 0;
        sx.moving = sy.moving = false;
        computeBounds();
        el.classList.add('dragging');
        ss.to(1.1, 300, 20);
        register(body);
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });

      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        var rawX = baseX + dx;
        var rawY = baseY + dy;
        sx.v = reduceMotion ? clamp(rawX, bounds.minX, bounds.maxX) : elastic(rawX, bounds.minX, bounds.maxX, 0.1);
        sy.v = reduceMotion ? clamp(rawY, bounds.minY, bounds.maxY) : elastic(rawY, bounds.minY, bounds.maxY, 0.1);
        render();
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        try {
          if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        } catch (err) {}
        if (moved) el.dataset.dragged = 'true';

        // settle inside the section, bouncing if it was dragged past the edge
        homeX = clamp(sx.v, bounds.minX, bounds.maxX);
        homeY = clamp(sy.v, bounds.minY, bounds.maxY);
        sx.to(homeX, 600, 20);
        sy.to(homeY, 600, 20);
        ss.to(1, 300, 20);
        register(body);
      }
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
    });
  }

  /* ==========================================================================
     contact terminal (modal springs in: scale .8 + rotate -5 -> 1 / 0)
     ========================================================================== */
  var modal = document.getElementById('talk-modal');
  var openBtn = document.getElementById('talk-btn');
  var closeModalBtn = document.getElementById('talk-close');
  var backdrop = document.getElementById('talk-backdrop');
  var form = document.getElementById('talk-form');
  var status = document.getElementById('talk-status');

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('show');
    document.body.classList.add('menu-open');
    var first = document.getElementById('f-name');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 120);
  }
  function closeModal() {
    if (!modal || !modal.classList.contains('show')) return;
    modal.classList.remove('show');
    modal.classList.add('hidden');
    document.body.classList.remove('menu-open');
  }
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeMenu(); }
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var message = document.getElementById('f-msg');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (status) {
          status.classList.remove('hidden');
          status.textContent = '> error: identity, coordinates and payload are all required.';
          status.className = 'text-center text-sm font-bold bg-white border-2 border-black p-2';
        }
        return;
      }
      var subject = 'Portfolio contact — ' + name.value.trim();
      var body = message.value.trim() + '\n\n— ' + name.value.trim() + ' (' + email.value.trim() + ')';
      window.location.href = 'mailto:hello@example.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      if (status) {
        status.classList.remove('hidden');
        status.textContent = '> transmitting to hello@example.com … opening your mail app.';
        status.className = 'text-center text-sm font-bold text-white bg-black border-2 border-black p-2';
      }
    });
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    initReveals();
    initStickers();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
