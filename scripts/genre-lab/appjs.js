/**
 * genre-lab/appjs.js — emits the per-template app.js (GSAP edition)
 * Requires vendor/gsap.min.js + vendor/ScrollTrigger.min.js (loaded before this).
 * Every module uses real GSAP timelines / ScrollTrigger scrub / batch / quickTo.
 */

function appJs(cfg, v) {
  const hero = cfg.hero;
  const cursor = cfg.cursor;
  const progress = cfg.progress;
  const work = cfg.work;
  const contact = cfg.contact;

  return `/* ${cfg.theme} — Genre Lab GSAP edition (variant ${v + 1}) */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

${cursor === 'none' ? '' : cursor === 'dot' ? `  /* ---- dot cursor: gsap.quickTo ---- */
  var dot = document.querySelector('.cursor-dot');
  if (dot && !reduced) {
    var dx = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });
    document.addEventListener('mousemove', function (e) { dx(e.clientX); dy(e.clientY); });
    document.querySelectorAll('a,button,.card3d,.sticker').forEach(function (el) {
      el.addEventListener('mouseenter', function () { gsap.to(dot, { width: 44, height: 44, background: 'transparent', border: '2px solid var(--acc)', duration: 0.25 }); });
      el.addEventListener('mouseleave', function () { gsap.to(dot, { width: 10, height: 10, background: 'var(--acc)', borderWidth: 0, duration: 0.25 }); });
    });
  }` : `  /* ---- ring cursor with label: gsap.quickTo ---- */
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
  }`}

${progress === 0 ? `  /* ---- top progress bar: ScrollTrigger scrub ---- */
  var bar = document.querySelector('.progress-bar');
  if (bar) gsap.to(bar, { width: '100%', ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });` : `  /* ---- side ruler: ScrollTrigger scrub ---- */
  var ruler = document.querySelector('.ruler');
  if (ruler) {
    var knob = ruler.querySelector('i'), lbl = ruler.querySelector('span');
    ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) { knob.style.top = 'calc(' + (self.progress * 100).toFixed(1) + '% - 4px)'; lbl.textContent = Math.round(self.progress * 100) + '%'; } });
  }`}

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

${hero === 'splitRise' ? `  /* ---- splitRise: char timeline ---- */
  if (!reduced) {
    var chs = document.querySelectorAll('.split-hero .ch');
    gsap.from(chs, { yPercent: 115, rotation: 7, filter: 'blur(7px)', duration: 0.9, ease: 'power3.out', stagger: 0.04, delay: 0.15 });
    gsap.from('.split-hero .rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power2.out', delay: 0.9 });
    gsap.from(['.split-hero .sub', '.split-hero .cta-row'], { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', delay: 1.0, stagger: 0.12 });
  }` : ''}

${hero === 'stickerBoard' ? `  /* ---- stickerBoard: entrance + drag with inertia ---- */
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
  });` : ''}

${hero === 'aurora' ? `  /* ---- aurora canvas: drifting gradient blobs ---- */
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
  }` : ''}

${hero === 'particlesMorph' ? `  /* ---- particle field morphing between words ---- */
  var pf = document.querySelector('[data-particles]');
  if (pf && !reduced) {
    var px = pf.getContext('2d');
    var words = ['${cfg.persona.toUpperCase().replace(/'/g, '')}', '${cfg.role.toUpperCase().slice(0, 12).replace(/'/g, '')}', 'PORTFOLIO'];
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
  }` : ''}

${hero === 'spotlightGrid' ? `  /* ---- spotlight hero grid ---- */
  var sg = document.querySelector('.spot-hero-grid');
  if (sg) gsap.from('.spot-hero-grid .cell', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.3,
    scrollTrigger: { trigger: sg, start: 'top 92%' } });` : ''}

${hero === 'marqueeHero' ? `  /* ---- counter-scrolling bands ---- */
  if (!reduced) {
    var bands = document.querySelectorAll('.mq-band .inner');
    if (bands[0]) gsap.to(bands[0], { xPercent: -30, ease: 'none', duration: 26, repeat: -1 });
    if (bands[1]) gsap.fromTo(bands[1], { xPercent: -30 }, { xPercent: 0, ease: 'none', duration: 26, repeat: -1 });
    gsap.from('.mq-hero .hero-inner > *', { opacity: 0, y: 26, duration: 0.8, ease: 'power3.out', stagger: 0.14, delay: 0.4,
      scrollTrigger: { trigger: '.mq-hero .hero-inner', start: 'top 92%' } });
  }` : ''}

${hero === 'typeCounter' ? `  /* ---- typewriter + gsap counters ---- */
  var tl2 = document.querySelector('[data-type]');
  if (tl2 && !reduced) {
    var full = tl2.getAttribute('data-type'), i = 0;
    (function tick() { tl2.textContent = full.slice(0, i++); if (i <= full.length) setTimeout(tick, 34); })();
  }
  document.querySelectorAll('[data-count]').forEach(function (c) {
    var end = parseInt(c.getAttribute('data-count'), 10);
    var o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out',
      onUpdate: function () { c.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: c, start: 'top 92%' } });
  });` : ''}

${hero === 'imageCollapse' ? `  /* ---- image collapse: pinned fan-out scrub ---- */
  if (!reduced) {
    var layers = gsap.utils.toArray('.collapse-hero .layer');
    var tl3 = gsap.timeline({ scrollTrigger: { trigger: '.collapse-hero', start: 'top top', end: '+=120%', scrub: 1, pin: true } });
    layers.forEach(function (l, i) {
      tl3.to(l, { xPercent: (i - 1) * 16, rotation: (i - 1) * 5, scale: 0.92, transformOrigin: 'center center', ease: 'power2.inOut' }, 0);
    });
    tl3.to('.collapse-hero .hero-inner', { opacity: 0.25, ease: 'power1.inOut' }, 0);
  }` : ''}

${hero === 'tileScatter' ? `  /* ---- tile scatter scrub ---- */
  if (!reduced) {
    gsap.utils.toArray('[data-tile]').forEach(function (t) {
      gsap.to(t, { x: t.style.getPropertyValue('--tx') || 0, y: t.style.getPropertyValue('--ty') || 0, rotation: parseFloat(t.style.getPropertyValue('--tr')) || 0,
        ease: 'none', scrollTrigger: { trigger: '.hero-tiles', start: 'top top', end: 'bottom top', scrub: 1 } });
    });
  }` : ''}

${hero === 'glarePortrait' ? `  /* ---- glare portrait: blur-in words ---- */
  if (!reduced) gsap.from('.glare-hero [data-blurword]', { filter: 'blur(10px)', opacity: 0, y: 26, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.25 });
  gsap.from('.glare-hero .portrait', { clipPath: 'inset(0 100% 0 0)', opacity: 0.4, duration: 1.2, ease: 'power3.inOut', delay: 0.2 });` : ''}

${work === 'horizPin' ? `  /* ---- pinned horizontal scroll ---- */
  if (!reduced) {
    var row = document.querySelector('.works-horiz-wrap');
    var hp = document.querySelector('.horiz-pin');
    if (row && hp) {
      var dist = row.scrollWidth - window.innerWidth + 120;
      gsap.to(row, { x: -dist, ease: 'none',
        scrollTrigger: { trigger: hp, start: 'top top', end: '+=' + dist, scrub: 1, pin: true, anticipatePin: 1,
          onUpdate: function (self) { var p = document.querySelector('[data-hprogress] i'); if (p) p.style.width = (self.progress * 100) + '%'; } } });
    }
  }` : ''}

${work === 'tiltGlare' ? `  /* ---- tilt cards ---- */
  if (!reduced) document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: x * 9, rotationX: -y * 9, y: -4, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function () { gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, duration: 0.5, ease: 'power2.out' }); });
  });` : ''}

${work === 'chipsFilter' ? `  /* ---- chip filter ---- */
  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      var cat = chip.getAttribute('data-cat');
      document.querySelectorAll('#works article[data-cat]').forEach(function (a) {
        gsap.to(a, { opacity: (cat === 'all' || a.getAttribute('data-cat') === cat) ? 1 : 0, duration: 0.35,
          onComplete: function () { a.style.display = (cat === 'all' || a.getAttribute('data-cat') === cat) ? '' : 'none'; } });
      });
    });
  });` : ''}

${work === 'staggerZig' ? `  /* ---- image parallax scrub ---- */
  if (!reduced) document.querySelectorAll('[data-parallax] img').forEach(function (im) {
    gsap.fromTo(im, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: im.closest('.img-wrap'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });` : ''}

${work === 'listHover' ? `  /* ---- floating preview follows cursor ---- */
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
  }` : ''}

${contact === 'form' ? `  /* ---- demo form ---- */
  var form = document.getElementById('cform');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = document.getElementById('form-ok');
    if (ok) ok.hidden = false;
    console.log('[demo form]', Object.fromEntries(new FormData(form)));
    form.reset();
  });` : ''}

  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
`;
}

module.exports = { appJs };
