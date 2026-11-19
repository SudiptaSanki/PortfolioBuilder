/* Graphic Designer · mono — Genre Lab GSAP edition (variant 5) */
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







  /* ---- particle field morphing between words ---- */
  var pf = document.querySelector('[data-particles]');
  if (pf && !reduced) {
    var px = pf.getContext('2d');
    var words = ['JONAS DUARTE', 'GRAPHIC DESI', 'PORTFOLIO'];
    var parts = [], wi = 0, targets = [];
    function sample(word) {
      var off = document.createElement('canvas'); off.width = pf.offsetWidth; off.height = pf.offsetHeight;
      var oc = off.getContext('2d');
      oc.fillStyle = '#fff'; oc.font = '700 ' + Math.floor(off.height / 3.2) + 'px Segoe UI, sans-serif';
      oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillText(word, off.width / 2, off.height / 2);
      var d = oc.getImageData(0, 0, off.width, off.height).data, pts = [];
      for (var y = 0; y < off.height; y += 6) for (var x = 0; x < off.width; x += 6) {
        if (d[(y * off.width + x) * 4 + 3] > 128) pts.push({ x: x, y: y });
      }
      return pts;
    }
    function setTargets() { targets = sample(words[wi % words.length]); wi++; }
    function init() {
      pf.width = pf.offsetWidth; pf.height = pf.offsetHeight;
      setTargets();
      for (var i = 0; i < 700; i++) parts.push({ x: Math.random() * pf.width, y: Math.random() * pf.height, tx: 0, ty: 0 });
    }
    init(); setTargets();
    setInterval(setTargets, 3200);
    window.addEventListener('resize', function () { pf.width = pf.offsetWidth; pf.height = pf.offsetHeight; setTargets(); });
    var mx = -9999, my = -9999;
    pf.parentElement.addEventListener('mousemove', function (e) { var r = pf.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    (function loop() {
      px.clearRect(0, 0, pf.width, pf.height);
      px.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--acc');
      parts.forEach(function (pt, i) {
        var tg = targets[i % Math.max(targets.length, 1)] || { x: pf.width / 2, y: pf.height / 2 };
        pt.x += (tg.x - pt.x) * 0.045; pt.y += (tg.y - pt.y) * 0.045;
        var dx = pt.x - mx, dy = pt.y - my, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 70) { pt.x += (dx / (dist || 1)) * 3; pt.y += (dy / (dist || 1)) * 3; }
        px.fillRect(pt.x, pt.y, 2, 2);
      });
      requestAnimationFrame(loop);
    })();
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
