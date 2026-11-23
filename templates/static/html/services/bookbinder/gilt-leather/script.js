/* Marlowe Bindery — gilt-leather template
   Three jobs only: reading-order reveal, the restoration
   before/after slider, and the enquiry form. No audio: bookbinding
   is not a sound profession (sound need-test), and the stub's
   hover-triggered snap sound was removed, not replaced. */

document.documentElement.classList.add('js');

/* ---------- reveal, in reading order ---------- */
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

/* ---------- before / after slider ---------- */
(function () {
  var figure = document.getElementById('baFigure');
  var range = document.getElementById('baRange');
  if (!figure || !range) return;

  function setPos(pct) {
    pct = Math.max(0, Math.min(100, pct));
    figure.style.setProperty('--pos', pct + '%');
    range.value = Math.round(pct);
    range.setAttribute('aria-valuetext',
      Math.round(pct) + '% kept binding shown, ' + (100 - Math.round(pct)) + '% as books arrive');
  }
  setPos(50);

  range.addEventListener('input', function () { setPos(parseFloat(range.value)); });

  /* Dragging anywhere on the figure moves the handle too; the range
     input sits over the whole figure, so pointer events land on it —
     this handler covers browsers that report the figure instead. */
  var dragging = false;
  function fromEvent(e) {
    var r = figure.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setPos((x / r.width) * 100);
  }
  figure.addEventListener('pointerdown', function (e) { dragging = true; fromEvent(e); });
  window.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
  window.addEventListener('pointerup', function () { dragging = false; });
})();

/* ---------- mobile nav: three gilt rules, a cover that opens ----------
   The panel is the book's cover: it swings from its left edge when
   motion is allowed (CSS), fades otherwise. Focus goes to the first
   link on open and back to the button on close; Esc closes; the body
   is scroll-locked while the cover is open. */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (!toggle || !panel) return;
  var closeTimer = null;

  function open() {
    window.clearTimeout(closeTimer);
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-locked');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.classList.add('open'); });
    });
    var first = panel.querySelector('a');
    if (first) first.focus();
  }
  function close(returnFocus) {
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
    document.body.classList.remove('nav-locked');
    closeTimer = window.setTimeout(function () { panel.hidden = true; }, 340);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    if (toggle.getAttribute('aria-expanded') === 'true') close(false);
    else open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { close(false); });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 700 && toggle.getAttribute('aria-expanded') === 'true') {
      window.clearTimeout(closeTimer);
      panel.hidden = true;
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-locked');
    }
  });
})();

/* ---------- enquiry form ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmation = document.getElementById('confirmation');
  var confText = document.getElementById('confText');
  var confRef = document.getElementById('confRef');
  var sendAnother = document.getElementById('sendAnother');

  var fields = {
    name: { input: document.getElementById('fName'), err: document.getElementById('eName'),
            test: function (v) { return v.trim().length > 1; } },
    email: { input: document.getElementById('fEmail'), err: document.getElementById('eEmail'),
             test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    type: { input: document.getElementById('fType'), err: document.getElementById('eType'),
            test: function (v) { return v !== ''; } },
    message: { input: document.getElementById('fMsg'), err: document.getElementById('eMsg'),
               test: function (v) { return v.trim().length > 3; } }
  };

  function validate(key) {
    var f = fields[key];
    var ok = f.test(f.input.value);
    f.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    f.err.classList.toggle('show', !ok);
    return ok;
  }
  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener('blur', function () { validate(key); });
    fields[key].input.addEventListener('input', function () {
      if (fields[key].err.classList.contains('show')) validate(key);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(fields).forEach(function (key) {
      if (!validate(key) && !firstBad) firstBad = fields[key].input;
    });
    if (firstBad) { firstBad.focus(); return; }

    var name = fields.name.input.value.trim();
    var first = name.split(/\s+/)[0];
    var type = fields.type.input.value;
    var book = document.getElementById('fBook').value.trim();
    var ref = 'MB-2026-' + String(Math.floor(100 + Math.random() * 900));
    confRef.textContent = 'Reference ' + ref;
    confText.textContent = 'Thank you, ' + first + '. Your enquiry — ' +
      type.charAt(0).toLowerCase() + type.slice(1) +
      (book ? ', for "' + book + '"' : '') +
      ' — has been noted under reference ' + ref +
      '. The first answer, from your photographs, would arrive within five working days.';
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
  });

  sendAnother.addEventListener('click', function () {
    form.reset();
    Object.keys(fields).forEach(function (key) {
      fields[key].input.setAttribute('aria-invalid', 'false');
      fields[key].err.classList.remove('show');
    });
    confirmation.hidden = true;
    form.hidden = false;
    fields.name.input.focus();
  });
})();
