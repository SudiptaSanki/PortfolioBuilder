/* Singer · deep — Genre Lab GSAP edition (variant 3) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- dot cursor: gsap.quickTo ---- */
  var dot = document.querySelector('.cursor-dot');
  if (dot && !reduced) {
    var dx = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });
    document.addEventListener('mousemove', function (e) { dx(e.clientX); dy(e.clientY); });
    document.querySelectorAll('a,button,.card3d,.sticker').forEach(function (el) {
      el.addEventListener('mouseenter', function () { gsap.to(dot, { width: 44, height: 44, background: 'transparent', border: '2px solid var(--acc)', duration: 0.25 }); });
      el.addEventListener('mouseleave', function () { gsap.to(dot, { width: 10, height: 10, background: 'var(--acc)', borderWidth: 0, duration: 0.25 }); });
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



























  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
