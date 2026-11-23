/* Kintsugi Glow — quiet interactions only. No audio: the craft is silent work. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- gold crack canvas (hero only, drawn once, still) ---------- */
  var canvas = document.getElementById('cracks');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    // Deterministic pseudo-random so the cracks sit still between resizes.
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function draw() {
      var hero = canvas.parentElement;
      var w = hero.clientWidth, h = hero.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      seed = 7;
      for (var i = 0; i < 5; i++) {
        var x = rnd() * w, y = rnd() * h * 0.7;
        ctx.beginPath(); ctx.moveTo(x, y);
        var steps = 6 + Math.floor(rnd() * 4);
        for (var j = 0; j < steps; j++) {
          x += (rnd() - 0.42) * 130;
          y += rnd() * 90 + 18;
          ctx.lineTo(x, y);
          if (rnd() > 0.72) { // a short branch vein
            ctx.moveTo(x, y);
            ctx.lineTo(x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 70);
            ctx.moveTo(x, y);
          }
        }
        ctx.strokeStyle = 'rgba(201,162,39,0.20)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    draw();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 200); });
  }

  /* ---------- before / after comparison slider ---------- */
  var baStage = document.querySelector('.ba-stage');
  var baRange = document.getElementById('ba-range');
  if (baStage && baRange) {
    var setSplit = function () {
      baStage.style.setProperty('--split', baRange.value + '%');
      baRange.setAttribute('aria-valuetext', baRange.value + '% repaired view');
    };
    baRange.addEventListener('input', setSplit);

    /* Drag directly on the figure (finger or mouse). The visible divider
       sits on the stage but is not itself a control, so touches land on the
       stage: drive the same range input from the pointer position, keeping
       touch, mouse and keyboard in sync. touch-action:pan-y (in the CSS)
       lets vertical page scroll pass through while horizontal drags are
       captured here. */
    var baDragging = false;
    var baFromPointer = function (e) {
      var r = baStage.getBoundingClientRect();
      if (!r.width) return;
      var pct = (e.clientX - r.left) / r.width * 100;
      pct = Math.max(0, Math.min(100, Math.round(pct)));
      if (String(pct) !== baRange.value) {
        baRange.value = pct;
        setSplit();
      }
    };
    baStage.addEventListener('pointerdown', function (e) {
      baDragging = true;
      try { baStage.setPointerCapture(e.pointerId); } catch (err) {}
      baFromPointer(e);
    });
    baStage.addEventListener('pointermove', function (e) {
      if (baDragging) baFromPointer(e);
    });
    var baEndDrag = function () { baDragging = false; };
    baStage.addEventListener('pointerup', baEndDrag);
    baStage.addEventListener('pointercancel', baEndDrag);
    baStage.addEventListener('dragstart', function (e) { e.preventDefault(); });
    setSplit();
  }

  /* ---------- lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  var lb = document.getElementById('lightbox');
  if (items.length && lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + items.length) % items.length;
      var img = items[idx].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = items[idx].getAttribute('data-caption') || img.alt;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (btn, i) { btn.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- commission enquiry form ---------- */
  var form = document.getElementById('enquiry');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate(input) {
      var v = (input.value || '').trim();
      if (input.id === 'f-name') return setInvalid(input, v.length < 2);
      if (input.id === 'f-email') return setInvalid(input, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      if (input.id === 'f-type') return setInvalid(input, v === '');
      if (input.id === 'f-breaks') return setInvalid(input, v === '' || isNaN(+v) || +v < 1 || +v > 60);
      if (input.id === 'f-size') return setInvalid(input, v.length < 2);
      if (input.id === 'f-message') return setInvalid(input, v.length < 10);
      return true;
    }
    var fields = ['f-name', 'f-email', 'f-type', 'f-breaks', 'f-size', 'f-message']
      .map(function (id) { return document.getElementById(id); }).filter(Boolean);
    fields.forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('invalid')) validate(input);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = fields.map(validate);
      if (ok.indexOf(false) !== -1) {
        var firstBad = fields[ok.indexOf(false)];
        firstBad.focus();
        return;
      }
      var name = document.getElementById('f-name').value.trim();
      var type = document.getElementById('f-type');
      var typeLabel = type.options[type.selectedIndex].text;
      var breaks = document.getElementById('f-breaks').value;
      document.getElementById('confirm-summary').textContent =
        name + ' — ' + typeLabel.toLowerCase() + ', ' + breaks + (breaks === '1' ? ' break' : ' breaks') +
        '. The studio replies within two working days with the photo assessment.';
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
      window.scrollTo({ top: confirmation.offsetTop - 90, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    var again = document.getElementById('again-btn');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        fields.forEach(function (input) { setInvalid(input, false); });
        confirmation.hidden = true;
        form.hidden = false;
        document.getElementById('f-name').focus();
      });
    }
  }

  /* ---------- mobile nav: MENU button + seam-edged drop panel ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navPanel = document.getElementById('mobile-panel');
  if (navToggle && navPanel) {
    var navLinks = navPanel.querySelectorAll('a');
    var navOpen = false;
    function setNav(open) {
      navOpen = open;
      navPanel.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      navPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && navLinks.length) navLinks[0].focus();
      if (!open) navToggle.focus();
    }
    navToggle.addEventListener('click', function () { setNav(!navOpen); });
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navOpen) setNav(false);
    });
    window.addEventListener('resize', function () {
      if (navOpen && window.innerWidth > 700) setNav(false);
    });
    navPanel.setAttribute('aria-hidden', 'true');
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
