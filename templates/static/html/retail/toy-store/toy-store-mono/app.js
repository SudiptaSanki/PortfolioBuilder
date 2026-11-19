/* Toy Store · mono — Genre Lab GSAP edition (variant 5) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();



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





  /* ---- aurora canvas: drifting gradient blobs ---- */
  var cv = document.querySelector('[data-aurora]');
  if (cv && !reduced) {
    var cx = cv.getContext('2d');
    var colors = [getComputedStyle(document.documentElement).getPropertyValue('--acc'), getComputedStyle(document.documentElement).getPropertyValue('--acc2'), getComputedStyle(document.documentElement).getPropertyValue('--text')];
    function draw(t) {
      cv.width = cv.offsetWidth; cv.height = cv.offsetHeight;
      cx.fillStyle = getComputedStyle(document.body).backgroundColor; cx.fillRect(0, 0, cv.width, cv.height);
      cx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 3; i++) {
        var x = cv.width / 2 + Math.sin(t / 2600 + i * 2.1) * cv.width * 0.32;
        var y = cv.height / 2 + Math.cos(t / 3100 + i * 1.6) * cv.height * 0.3;
        var r = Math.max(cv.width, cv.height) * 0.3;
        var g = cx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, colors[i].trim() || '#888'); g.addColorStop(1, 'transparent');
        cx.globalAlpha = 0.35; cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

















  /* ---- tilt cards ---- */
  if (!reduced) document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: x * 9, rotationX: -y * 9, y: -4, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function () { gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, duration: 0.5, ease: 'power2.out' }); });
  });









  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
