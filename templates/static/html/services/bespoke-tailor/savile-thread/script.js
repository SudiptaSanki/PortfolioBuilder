/* Savile Thread — interactions.
   No audio anywhere: tailoring is not a sound profession, and the
   stub's hover "snip" synth failed the owner's sound need-test. */
document.documentElement.classList.add('js');

/* ---------- reveal on scroll (one reading-order fade, nothing more) ---------- */
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

/* ---------- lightbox for the garment ledger ---------- */
(function () {
  var box = document.getElementById('lightbox');
  if (!box) return;
  var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (!triggers.length) return;
  var img = box.querySelector('img');
  var title = box.querySelector('.lb-title');
  var text = box.querySelector('.lb-text');
  var count = box.querySelector('.lb-count');
  var current = 0, lastFocus = null;

  function render() {
    var t = triggers[current];
    img.src = t.getAttribute('data-full');
    img.alt = t.querySelector('img') ? t.querySelector('img').alt : '';
    title.textContent = t.getAttribute('data-title') || '';
    text.textContent = t.getAttribute('data-text') || '';
    count.textContent = (current + 1) + ' / ' + triggers.length;
  }
  function open(i, el) {
    current = i; lastFocus = el || document.activeElement;
    render(); box.classList.add('open'); box.removeAttribute('hidden');
    box.querySelector('.lb-close').focus();
    document.addEventListener('keydown', keys);
  }
  function close() {
    box.classList.remove('open'); box.setAttribute('hidden', '');
    document.removeEventListener('keydown', keys);
    if (lastFocus) lastFocus.focus();
  }
  function step(d) { current = (current + d + triggers.length) % triggers.length; render(); }
  function keys(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  }
  triggers.forEach(function (t, i) {
    t.addEventListener('click', function () { open(i, t); });
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  box.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
})();

/* ---------- the draft: measurement explorer ---------- */
(function () {
  var panel = document.getElementById('measure-detail');
  if (!panel) return;
  var data = {
    neck:    { fig: '15½″', name: 'Neck & scruff',
               body: 'Taken round the neck where the collar will sit, with two fingers inside the tape. It sets the collar height and the scruff — the small of cloth below it. A collar cut from a wrong neck figure either strangles or stands away from the shirt, and no later fitting can fully rescue it.' },
    shoulder:{ fig: '18¼″', name: 'Shoulder, point to point',
               body: 'Across the back from bone to bone. The shoulder is the coat\u2019s foundation: cut it wide and the sleeve hangs off the arm and creases; cut it narrow and the whole chest pulls. This figure is checked again at the baste fitting, when the client\u2019s real stance replaces the tape\u2019s guess.' },
    chest:   { fig: '39″ + 3½″ ease', name: 'Chest',
               body: 'Round the fullest part of the chest, tape level, arms down, breathing normally — not held. Over the body figure the draft adds three and a half inches of working ease for a coat, less for a waistcoat worn under it. Too little ease and the fronts kick open when he reaches for a door.' },
    waist:   { fig: '34″ body', name: 'Waist & suppression',
               body: 'The body waist is measured; the coat\u2019s waist is then suppressed — taken in — by an amount chosen for the client\u2019s build and taste, usually one and a half to two and a half inches. Suppression is where a coat gets its shape, and where restraint matters: overdo it and the vents flare and the button strains.' },
    seat:    { fig: '40″', name: 'Seat',
               body: 'Round the fullest part of the seat, feet together. It decides the back balance of the coat and the whole cut of the trousers. A seat figure taken carelessly shows up as a coat that rides up at the back, or trousers that pull when he sits — faults the wearer feels every day and rarely names.' },
    length:  { fig: '30″', name: 'Back length',
               body: 'From the nape of the neck to the hem. The rule is that the skirt of the coat covers the seat — no more, no less. Fashion shortens and lengthens it; the pattern keeps it where the body says it belongs, adjusted only for the style the client has chosen and will still like in five years.' },
    sleeve:  { fig: '33½″', name: 'Sleeve, outseam',
               body: 'From the shoulder point down the arm to the wrist bone, arm hanging naturally. The aim is half an inch of shirt cuff showing below the coat sleeve — enough to prove the shirt is there, not enough to look borrowed. Arms are measured separately; most men differ by a quarter inch or more.' },
    posture: { fig: 'by eye', name: 'Posture — read, not taped',
               body: 'No tape measures a stoop. This client stoops half an inch from desk work and drops his right shoulder a quarter inch. Both are written on the pattern in chalk and corrected in the draft: length added where the back has rounded, taken where the shoulder has fallen. It is the part of bespoke that a size chart cannot do.' }
  };
  var figEl = panel.querySelector('.fig');
  var nameEl = panel.querySelector('h3');
  var bodyEl = panel.querySelector('p');
  var btns = Array.prototype.slice.call(document.querySelectorAll('.measure-btn'));
  var pts = Array.prototype.slice.call(document.querySelectorAll('.pt'));
  function select(key, focusBtn) {
    var d = data[key]; if (!d) return;
    figEl.textContent = d.fig; nameEl.textContent = d.name; bodyEl.textContent = d.body;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-measure') === key ? 'true' : 'false'); });
    pts.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-measure') === key); });
    if (focusBtn) {
      var b = btns.filter(function (x) { return x.getAttribute('data-measure') === key; })[0];
      if (b) b.focus();
    }
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-measure'), false); });
  });
  pts.forEach(function (p) {
    p.addEventListener('click', function () { select(p.getAttribute('data-measure'), false); });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.getAttribute('data-measure'), false); }
    });
  });
  /* Default selection is point 01 (neck), the first figure on the draft —
     not chest — so the first tap on any point, chest included, visibly
     updates the readout. */
  select('neck', false);
})();

/* ---------- enquiry form: validation + honest in-page confirmation ---------- */
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  var done = document.getElementById('confirmation');
  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function setInvalid(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validate() {
    var ok = true, firstBad = null;
    var name = field('name'), email = field('email'),
        garment = field('garment'), message = field('message');
    [[name, name.value.trim().length >= 2],
     [email, validEmail(email.value.trim())],
     [garment, garment.value !== ''],
     [message, message.value.trim().length >= 10]
    ].forEach(function (pair) {
      var good = setInvalid(pair[0], !pair[1]);
      if (!good) { ok = false; if (!firstBad) firstBad = pair[0]; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  ['name', 'email', 'garment', 'message'].forEach(function (n) {
    var input = field(n);
    if (input) input.addEventListener('input', function () { setInvalid(input, false); });
    if (input) input.addEventListener('change', function () { setInvalid(input, false); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var ref = 'ST-2026-' + Math.floor(100 + Math.random() * 900);
    done.querySelector('.ref').textContent = 'Reference ' + ref;
    done.querySelector('.sum').textContent =
      'Thank you, ' + field('name').value.trim().split(' ')[0] + '. Your request for a ' +
      field('garment').value + ' appointment has been noted on this page. ' +
      'This demonstration form sends and stores nothing — to reach the workshop for real, ' +
      'email appointments@savilethread.example and quote the reference above.';
    form.style.display = 'none';
    done.classList.add('show');
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
  var again = document.getElementById('send-another');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.style.display = '';
    done.classList.remove('show');
    field('name').focus();
  });
})();

/* ---------- mobile nav: the fitting-room curtain ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;
  var scrim = document.querySelector('.nav-scrim');
  var closeBtn = nav.querySelector('.nav-close');
  var open = false;
  function setNav(state, moveFocus) {
    open = state;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open);
    if (scrim) scrim.classList.toggle('show', open);
    if (moveFocus === false) return;
    if (open) { if (closeBtn) closeBtn.focus(); }
    else { toggle.focus(); }
  }
  toggle.addEventListener('click', function () { setNav(!open); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setNav(false); });
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setNav(false);
  });
  window.addEventListener('resize', function () {
    if (open && window.innerWidth > 860) setNav(false, false);
  });
})();
