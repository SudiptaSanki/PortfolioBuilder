/* Bicycle Shop · mono — Genre Lab GSAP edition (variant 5) */
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











  /* ---- counter-scrolling bands ---- */
  if (!reduced) {
    var bands = document.querySelectorAll('.mq-band .inner');
    if (bands[0]) gsap.to(bands[0], { xPercent: -30, ease: 'none', duration: 26, repeat: -1 });
    if (bands[1]) gsap.fromTo(bands[1], { xPercent: -30 }, { xPercent: 0, ease: 'none', duration: 26, repeat: -1 });
    gsap.from('.mq-hero .hero-inner > *', { opacity: 0, y: 26, duration: 0.8, ease: 'power3.out', stagger: 0.14, delay: 0.4,
      scrollTrigger: { trigger: '.mq-hero .hero-inner', start: 'top 92%' } });
  }















  /* ---- image parallax scrub ---- */
  if (!reduced) document.querySelectorAll('[data-parallax] img').forEach(function (im) {
    gsap.fromTo(im, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: im.closest('.img-wrap'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });





  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
