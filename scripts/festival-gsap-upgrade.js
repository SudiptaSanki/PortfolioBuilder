/**
 * festival-gsap-upgrade.js — upgrades the festival family generator to GSAP:
 *   1. vendor copy (gsap.min.js + ScrollTrigger.min.js) into every template
 *   2. script tags before script.js
 *   3. SCRIPT_JS rewritten: ScrollTrigger.batch reveals, split-char hero,
 *      ScrollTrigger scrub fx choreography, magnetic CTAs
 *   4. CSS: .split-ch rule
 * Run: node scripts/festival-gsap-upgrade.js
 */

const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const f = path.join(repoRoot, 'scripts', 'festival', 'generate.js');
let s = fs.readFileSync(f, 'utf8');

if (s.includes('Festival GSAP edition')) { console.log('already patched'); process.exit(0); }

// ---- 1. vendor sources ----
s = s.replace(
  "const repoRoot = path.resolve(__dirname, '..', '..');",
  `const repoRoot = path.resolve(__dirname, '..', '..');\nconst VENDOR_SRC = {\n  'gsap.min.js': path.join(T(), 'technology/creative-developer/dune-rover/vendor/gsap.min.js'),\n  'ScrollTrigger.min.js': path.join(T(), 'creative/interaction-designer/zen-haven/vendor/ScrollTrigger.min.js')\n};\nfunction T() { return path.join(repoRoot, 'templates', 'html', 'github-pages'); }`
);

// ---- 2. vendor copy in the emission loop ----
s = s.replace(
  "    fs.mkdirSync(assets, { recursive: true });",
  `    fs.mkdirSync(assets, { recursive: true });
    fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
    for (const lib of ['gsap.min.js', 'ScrollTrigger.min.js']) {
      const src = VENDOR_SRC[lib];
      if (src && fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, 'vendor', lib));
    }`
);

// ---- 3. script tags ----
s = s.replace(
  '<script src="./script.js"></script>',
  '<script src="./vendor/gsap.min.js"></script>\n<script src="./vendor/ScrollTrigger.min.js"></script>\n<script src="./script.js"></script>'
);

// ---- 4. SCRIPT_JS (GSAP edition) ----
const NEW_SCRIPT = `/* Festival portfolio — GSAP edition (ScrollTrigger choreography) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('form-note');
    if (note) note.hidden = false;
    form.reset();
  });

  if (!window.gsap) { // libraries missing -> reveal everything, done
    document.querySelectorAll('.reveal,.card').forEach(function (el) { el.classList.add('in'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* hero h1: split into chars + gsap rise */
  if (!reduced) document.querySelectorAll('.hero h1').forEach(function (h) {
    if (h.dataset.split) return; h.dataset.split = '1';
    var txt = h.textContent; h.textContent = '';
    txt.split('').forEach(function (c) {
      var sp = document.createElement('span');
      sp.className = 'split-ch'; sp.textContent = c === ' ' ? '\\u00A0' : c;
      h.appendChild(sp);
    });
    gsap.from(h.querySelectorAll('.split-ch'), { yPercent: 110, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.035, delay: 0.15 });
  });

  /* reveals: ScrollTrigger.batch (CSS animates the .in class) */
  var els = document.querySelectorAll('.reveal,.card');
  if (reduced) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    ScrollTrigger.batch('.reveal,.card', { start: 'top 90%', once: true,
      onEnter: function (b) { b.forEach(function (el) { el.classList.add('in'); }); } });
  }

  /* fx choreography: ScrollTrigger scrub */
  if (!reduced) {
    var garland = document.querySelector('.garland');
    var floats = document.querySelector('.flowers-bg');
    var heroEl = document.querySelector('.hero');
    var mode = document.body.classList.contains('fx-parallax') ? 'parallax'
      : document.body.classList.contains('fx-cascade') ? 'cascade'
      : document.body.classList.contains('fx-drift') ? 'drift' : 'hero-fade';
    var maxST = { start: 'top top', end: 'max', scrub: true };
    if (mode === 'parallax') {
      if (garland) gsap.to(garland, { yPercent: 35, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: 8, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'cascade') {
      if (garland) gsap.to(garland, { yPercent: -18, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: -5, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'drift') {
      if (garland) gsap.to(garland, { yPercent: 10, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: -12, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'hero-fade' && heroEl) {
      gsap.to(heroEl, { opacity: 0.45, scale: 0.94, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* magnetic CTAs */
  if (!reduced) document.querySelectorAll('.cta').forEach(function (b) {
    var mx = gsap.quickTo(b, 'x', { duration: 0.3, ease: 'power3' });
    var my = gsap.quickTo(b, 'y', { duration: 0.3, ease: 'power3' });
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.22);
    });
    b.addEventListener('mouseleave', function () { mx(0); my(0); });
  });

  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
`;

s = s.replace(/const SCRIPT_JS = `[\s\S]*?`;/i, 'const SCRIPT_JS = `' + NEW_SCRIPT + '`;');

// ---- 5. CSS: split-ch rule ----
s = s.replace(
  '/* --- responsive --------------------------------------------------------------- */',
  `/* split chars */
.split-ch{display:inline-block;will-change:transform}

/* --- responsive --------------------------------------------------------------- */`
);

fs.writeFileSync(f, s, 'utf8');
console.log('festival generator upgraded to GSAP edition');
