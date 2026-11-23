/* RAZE — interactions.
   No audio anywhere: mural painting is not a sound profession, and the
   stub's spray-can synth failed the owner's sound need-test. */
document.documentElement.classList.add('js');

/* ---------- mobile nav: the hoarding panel ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (!toggle || !panel) return;
  var open = false;
  var firstLink = panel.querySelector('a');
  function setNav(state, moveFocus) {
    open = state;
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open);
    if (moveFocus === false) return;
    if (open && firstLink) firstLink.focus();
    if (!open) toggle.focus();
  }
  toggle.addEventListener('click', function () { setNav(!open); });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setNav(false);
  });
  window.addEventListener('resize', function () {
    if (open && window.innerWidth > 820) setNav(false, false);
  });
})();

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
  }, { threshold: 0.1 });
  items.forEach(function (el) { io.observe(el); });
})();

/* ---------- the wall estimator ----------
   Uses exactly the figures printed in the rate card on this page:
   coverage per surface, prep days per surface, painting speed and
   per-m² band per detail level, access allowances by wall height,
   anti-graffiti coating at £18/m². An estimate, never a quote. */
(function () {
  var form = document.getElementById('estimator-form');
  if (!form) return;
  var SURFACES = {
    render:    { coverage: 5.5, prep: 0.5 },
    brick:     { coverage: 4.5, prep: 1 },
    concrete:  { coverage: 4.0, prep: 1.5 },
    painted:   { coverage: 6.0, prep: 0.5 },
    roughcast: { coverage: 3.5, prep: 2 }
  };
  var BANDS = {
    a: { low: 95,  high: 140, rate: 12 },
    b: { low: 160, high: 230, rate: 7 },
    c: { low: 280, high: 420, rate: 3.5 }
  };
  var COATING_PER_M2 = 18;
  var out = {
    area: document.getElementById('out-area'),
    paint: document.getElementById('out-paint'),
    days: document.getElementById('out-days'),
    access: document.getElementById('out-access'),
    price: document.getElementById('out-price')
  };
  function ceilHalf(x) { return Math.ceil(x * 2) / 2; }
  function money(x) { return '£' + Math.round(x).toLocaleString('en-GB'); }
  function compute() {
    var w = parseFloat(form.elements.width.value);
    var h = parseFloat(form.elements.height.value);
    var surf = SURFACES[form.elements.surface.value] || SURFACES.render;
    var bandEl = form.querySelector('input[name="band"]:checked');
    var band = BANDS[bandEl ? bandEl.value : 'a'];
    var coating = form.elements.coating.checked;
    if (!(w > 0) || !(h > 0)) {
      out.area.textContent = '—'; out.paint.textContent = '—';
      out.days.textContent = '—'; out.access.textContent = '—';
      out.price.textContent = '—';
      return;
    }
    var area = w * h;
    var litres = ceilHalf(area / surf.coverage);
    var days = ceilHalf(surf.prep + area / band.rate);
    var accessFee = 0, accessNote;
    if (h <= 3.2) { accessNote = 'Podium steps — included'; }
    else if (h <= 6.5) { accessFee = 475; accessNote = 'Tower scaffold — £475 allowed'; }
    else { accessFee = 1250; accessNote = 'MEWP (cherry picker) — £1,250 allowed'; }
    var coatFee = coating ? area * COATING_PER_M2 : 0;
    var low = area * band.low + accessFee + coatFee;
    var high = area * band.high + accessFee + coatFee;
    out.area.textContent = area.toFixed(1) + ' m²';
    out.paint.textContent = litres.toFixed(1) + ' L';
    out.days.textContent = days.toFixed(1) + ' days';
    out.access.textContent = accessNote;
    out.price.textContent = money(low) + ' – ' + money(high);
  }
  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  compute();
})();

/* ---------- commission form: validation + honest in-page confirmation ---------- */
(function () {
  var form = document.getElementById('commission-form');
  if (!form) return;
  var done = document.getElementById('confirmation');
  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function setInvalid(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) wrap.classList.toggle('err-on', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validate() {
    var ok = true, firstBad = null;
    var name = field('name'), email = field('email'), town = field('town'),
        owner = field('owner'), message = field('message');
    [[name, name.value.trim().length >= 2],
     [email, validEmail(email.value.trim())],
     [town, town.value.trim().length >= 2],
     [owner, owner.value !== ''],
     [message, message.value.trim().length >= 20]
    ].forEach(function (pair) {
      var good = setInvalid(pair[0], !pair[1]);
      if (!good) { ok = false; if (!firstBad) firstBad = pair[0]; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  ['name', 'email', 'town', 'owner', 'message'].forEach(function (n) {
    var input = field(n);
    if (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
      input.addEventListener('change', function () { setInvalid(input, false); });
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var ref = 'RZ-2026-' + Math.floor(100 + Math.random() * 900);
    done.querySelector('.ref').textContent = 'Reference ' + ref;
    done.querySelector('.sum').textContent =
      'Thank you, ' + field('name').value.trim().split(' ')[0] + '. Your wall in ' +
      field('town').value.trim() + ' has been noted on this page. ' +
      'This demonstration form sends and stores nothing — to reach the studio for real, ' +
      'email commissions@razewalls.example and quote the reference above.';
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
