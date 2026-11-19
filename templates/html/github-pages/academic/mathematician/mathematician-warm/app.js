/* Mathematician · warm — Genre Lab GSAP edition (variant 4) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();



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









  /* ---- spotlight hero grid ---- */
  var sg = document.querySelector('.spot-hero-grid');
  if (sg) gsap.from('.spot-hero-grid .cell', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.3,
    scrollTrigger: { trigger: sg, start: 'top 92%' } });



















  /* ---- floating preview follows cursor ---- */
  var lp = document.querySelector('[data-lpreview]');
  if (lp && !reduced) {
    var lx = gsap.quickTo(lp, 'x', { duration: 0.4, ease: 'power3' });
    var ly = gsap.quickTo(lp, 'y', { duration: 0.4, ease: 'power3' });
    var rows = document.querySelectorAll('.list-rows article');
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var img = lp.querySelector('img');
        if (img) img.src = './assets/photos/' + (row.getAttribute('data-preview') || 'work1.webp');
        gsap.to(lp, { opacity: 1, scale: 1, duration: 0.3 });
      });
      row.addEventListener('mouseleave', function () { gsap.to(lp, { opacity: 0, scale: 0.9, duration: 0.3 }); });
    });
    document.querySelector('.list-rows').addEventListener('mousemove', function (e) { lx(e.clientX - 150); ly(e.clientY - 100); });
  }



  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
