/* =========================================================================
   Creative Software Agency — motion layer
   GSAP + ScrollTrigger + Lenis, written for this build.
   Sections: smooth scroll, reveals, headline marker, quote fill,
             footprint trail, work carousel, mobile nav, hero parallax.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  if (!hasGSAP) {
    // keep the page readable if the vendor scripts did not load
    root.classList.remove('js');
    root.classList.add('no-motion');
  }
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------- Lenis */
  var lenis = null;
  if (!reduced && typeof window.Lenis === 'function') {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.4
    });
    if (hasGSAP) {
      if (hasST) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    if (!target) return;
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -12, duration: 1.1 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') { e.preventDefault(); return; }
    var el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    closeNav();
    scrollToTarget(el);
    history.replaceState(null, '', href);
  });

  /* -------------------------------------------------------------- Reveals */
  if (hasST && !reduced) {
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  } else {
    gsap && gsap.utils.toArray('.reveal').forEach(function (el) { el.classList.add('is-in'); el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ------------------------------------------------ Headline marker draws  */
  var markers = document.querySelectorAll('.title-group__title .highlight, .pull-quote .highlight');
  markers.forEach(function (m) { m.setAttribute('data-state', 'pending'); });
  if (hasST && !reduced) {
    markers.forEach(function (m) {
      ScrollTrigger.create({
        trigger: m, start: 'top 85%', once: true,
        onEnter: function () { m.removeAttribute('data-state'); }
      });
    });
  } else {
    markers.forEach(function (m) { m.removeAttribute('data-state'); });
  }

  /* --------------------------------------------------- Pull quote word fill */
  var quote = document.querySelector('.pull-quote__quote');
  if (quote && hasGSAP) {
    quote.setAttribute('data-fill', 'script');
    quote.style.setProperty('--fill', reduced ? '1' : '0');
    if (hasST && !reduced) {
      gsap.to(quote, {
        '--fill': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: quote,
          start: 'top 82%',
          end: 'bottom 45%',
          scrub: 0.4
        }
      });
    }
  }

  /* ------------------------------------------------- Footprint trail press */
  var trails = document.querySelectorAll('.footprint-trail');
  trails.forEach(function (trail) {
    var prints = trail.querySelectorAll('.footprint-trail__print');
    if (!prints.length) return;
    if (reduced || !hasST) return;
    gsap.set(prints, { opacity: 0, scale: 1.06 });
    ScrollTrigger.create({
      trigger: trail.closest('section') || trail,
      start: 'top 70%',
      once: true,
      onEnter: function () {
        gsap.to(prints, {
          opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out',
          stagger: 0.09
        });
      }
    });
  });

  /* ------------------------------------------------------- Work carousel */
  var track = document.getElementById('work-track');
  var prev = document.querySelector('[data-carousel-prev]');
  var next = document.querySelector('[data-carousel-next]');

  if (track) {
    var step = function () {
      var card = track.querySelector('li');
      return card ? card.getBoundingClientRect().width + 32 : track.clientWidth * 0.8;
    };
    var syncButtons = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.setAttribute('aria-disabled', track.scrollLeft <= 2 ? 'true' : 'false');
      if (next) next.setAttribute('aria-disabled', track.scrollLeft >= max ? 'true' : 'false');
    };
    var nudge = function (dir) {
      var left = track.scrollLeft + dir * step();
      if (lenis) {
        // scroll the track itself, not the page
        track.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
      } else {
        track.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
      }
    };
    if (prev) prev.addEventListener('click', function () { if (prev.getAttribute('aria-disabled') !== 'true') nudge(-1); });
    if (next) next.addEventListener('click', function () { if (next.getAttribute('aria-disabled') !== 'true') nudge(1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(syncButtons); }, { passive: true });
    window.addEventListener('resize', syncButtons);
    syncButtons();

    /* drag to scroll with a mouse (touch already scrolls natively) */
    if (fine && !reduced) {
      var down = false, startX = 0, startLeft = 0, moved = 0;
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = 0;
        startX = e.clientX; startLeft = track.scrollLeft;
        track.style.cursor = 'grabbing';
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        moved = Math.abs(dx);
        track.scrollLeft = startLeft - dx;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        track.style.cursor = '';
        if (moved > 6) {
          // snap to the nearest card after a drag
          var cardW = step();
          var idx = Math.round(track.scrollLeft / cardW);
          track.scrollTo({ left: idx * cardW, behavior: 'smooth' });
        }
      });
      track.addEventListener('click', function (e) {
        if (moved > 6) { e.preventDefault(); moved = 0; }
      }, true);
    }
  }

  /* --------------------------------------------------------- Mobile nav */
  var panel = document.querySelector('[data-nav-panel]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var closeBtn = document.querySelector('[data-nav-close]');

  function openNav() {
    if (!panel) return;
    panel.setAttribute('data-open', 'true');
    document.body.classList.add('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  function closeNav() {
    if (!panel || panel.getAttribute('data-open') !== 'true') return;
    panel.setAttribute('data-open', 'false');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  if (toggle) toggle.addEventListener('click', openNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* ------------------------------------------------------- Hero parallax */
  var walker = document.querySelector('.home-hero__walker');
  var boulder = document.querySelector('.home-hero__boulder');
  if (fine && !reduced && hasGSAP && walker) {
    var qx = gsap.quickTo(walker, 'x', { duration: 1.1, ease: 'power3.out' });
    var qy = gsap.quickTo(walker, 'y', { duration: 1.1, ease: 'power3.out' });
    var bx = boulder ? gsap.quickTo(boulder, 'x', { duration: 1.4, ease: 'power3.out' }) : null;
    window.addEventListener('pointermove', function (e) {
      var nx = (e.clientX / window.innerWidth - 0.5);
      var ny = (e.clientY / window.innerHeight - 0.5);
      qx(nx * -16); qy(ny * -10);
      if (bx) bx(nx * 22);
    }, { passive: true });
  }

  /* ------------------------------------------------------ Nav scrollspy */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-navigation__link'));
  var sections = navLinks.map(function (l) {
    return { link: l, el: document.querySelector(l.getAttribute('href')) };
  }).filter(function (s) { return s.el; });

  if (hasST && sections.length) {
    sections.forEach(function (s) {
      ScrollTrigger.create({
        trigger: s.el, start: 'top 45%', end: 'bottom 45%',
        onToggle: function (self) {
          if (self.isActive) {
            navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
            s.link.setAttribute('aria-current', 'page');
          }
        }
      });
    });
  }

  /* ------------------------------------------------------- Refresh hooks */
  window.addEventListener('load', function () {
    if (hasST) ScrollTrigger.refresh();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (hasST) ScrollTrigger.refresh(); });
  }
})();
