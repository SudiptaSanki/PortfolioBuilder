/* University Professor · warm — Genre Lab GSAP edition (variant 4) */
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

  /* ---- top progress bar: ScrollTrigger scrub ---- */
  var bar = document.querySelector('.progress-bar');
  if (bar) gsap.to(bar, { width: '100%', ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

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



















  /* ---- glare portrait: blur-in words ---- */
  if (!reduced) gsap.from('.glare-hero [data-blurword]', { filter: 'blur(10px)', opacity: 0, y: 26, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.25 });
  gsap.from('.glare-hero .portrait', { clipPath: 'inset(0 100% 0 0)', opacity: 0.4, duration: 1.2, ease: 'power3.inOut', delay: 0.2 });

  /* ---- pinned horizontal scroll ---- */
  if (!reduced) {
    var row = document.querySelector('.works-horiz-wrap');
    var hp = document.querySelector('.horiz-pin');
    if (row && hp) {
      var dist = row.scrollWidth - window.innerWidth + 120;
      gsap.to(row, { x: -dist, ease: 'none',
        scrollTrigger: { trigger: hp, start: 'top top', end: '+=' + dist, scrub: 1, pin: true, anticipatePin: 1,
          onUpdate: function (self) { var p = document.querySelector('[data-hprogress] i'); if (p) p.style.width = (self.progress * 100) + '%'; } } });
    }
  }









  /* ---- demo form ---- */
  var form = document.getElementById('cform');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = document.getElementById('form-ok');
    if (ok) ok.hidden = false;
    console.log('[demo form]', Object.fromEntries(new FormData(form)));
    form.reset();
  });

  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
