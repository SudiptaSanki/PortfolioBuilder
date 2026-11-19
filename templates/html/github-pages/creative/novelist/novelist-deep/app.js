/* Novelist · deep — Genre Lab GSAP edition (variant 3) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- ring cursor with label: gsap.quickTo ---- */
  var ring = document.querySelector('.cursor-ring');
  if (ring && !reduced) {
    var rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
    document.addEventListener('mousemove', function (e) { rx(e.clientX); ry(e.clientY); });
    document.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('label'); ring.querySelector('span').textContent = 'open'; });
      el.addEventListener('mouseleave', function () { ring.classList.remove('label'); });
    });
    document.querySelectorAll('.card3d,.work-h,.list-rows article').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('label'); ring.querySelector('span').textContent = 'view'; });
      el.addEventListener('mouseleave', function () { ring.classList.remove('label'); });
    });
  }

  /* ---- side ruler: ScrollTrigger scrub ---- */
  var ruler = document.querySelector('.ruler');
  if (ruler) {
    var knob = ruler.querySelector('i'), lbl = ruler.querySelector('span');
    ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) { knob.style.top = 'calc(' + (self.progress * 100).toFixed(1) + '% - 4px)'; lbl.textContent = Math.round(self.progress * 100) + '%'; } });
  }

  /* ---- section titles: gsap blur-in ---- */
  document.querySelectorAll('h2.sec').forEach(function (h) {
    if (reduced) return;
    gsap.from(h, { filter: 'blur(10px)', y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 88%' } });
  });

  /* ---- reveals: ScrollTrigger.batch with stagger ---- */
  var batchEls = document.querySelectorAll('.reveal, [data-batch]');
  if (reduced) {
    gsap.set(batchEls, { opacity: 1, y: 0, clearProps: 'all' });
  } else {
    gsap.set(batchEls, { opacity: 0, y: 34 });
    ScrollTrigger.batch(batchEls, { start: 'top 90%',
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09, overwrite: true }); }
    });
  }

  /* ---- images: scale wipe on scroll ---- */
  if (!reduced) document.querySelectorAll('.img-wrap img').forEach(function (im) {
    gsap.fromTo(im, { scale: 1.18 }, { scale: 1, duration: 1.3, ease: 'power2.out',
      scrollTrigger: { trigger: im.parentElement, start: 'top 88%' } });
  });

  /* ---- magnetic CTAs ---- */
  if (!reduced) document.querySelectorAll('.cta').forEach(function (b) {
    var mx = gsap.quickTo(b, 'x', { duration: 0.3, ease: 'power3' });
    var my = gsap.quickTo(b, 'y', { duration: 0.3, ease: 'power3' });
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.22);
    });
    b.addEventListener('mouseleave', function () { mx(0); my(0); });
  });

  /* ---- spotlight hover ---- */
  document.querySelectorAll('.spotlight, .cell[data-spot]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---- marquee skew on scroll ---- */
  var track = document.querySelector('.marquee .track');
  if (track && !reduced) gsap.to(track, { skewX: -4, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 } });



  /* ---- stickerBoard: entrance + drag with inertia ---- */
  if (!reduced) gsap.from('.sticker', { scale: 0.6, opacity: 0, rotation: -14, duration: 0.7, ease: 'back.out(2)', stagger: 0.1, delay: 0.3 });
  document.querySelectorAll('[data-drag]').forEach(function (el) {
    var dragging = false, sx = 0, sy = 0, gx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    var gy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('pointerdown', function (e) {
      dragging = true; sx = e.clientX - (parseFloat(gsap.getProperty(el, 'x')) || 0); sy = e.clientY - (parseFloat(gsap.getProperty(el, 'y')) || 0);
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', function (e) { if (dragging) { gx(e.clientX - sx); gy(e.clientY - sy); } });
    window.addEventListener('pointerup', function () { if (dragging) { dragging = false; gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' }); } });
  });























  /* ---- image parallax scrub ---- */
  if (!reduced) document.querySelectorAll('[data-parallax] img').forEach(function (im) {
    gsap.fromTo(im, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: im.closest('.img-wrap'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });





  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
