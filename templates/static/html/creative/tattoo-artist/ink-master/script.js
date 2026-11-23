/* Ink & Iron — interactions.
   No audio anywhere: tattooing is not a sound profession, and the
   stub's hover buzz failed the owner's sound need-test.
   No custom cursor: the pointer stays the visitor's own. */
document.documentElement.classList.add('js');

/* ---------- mobile nav: the appointment card ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (!toggle || !panel) return;
  var open = false;
  function setNav(state, moveFocus) {
    open = state;
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close ×' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (moveFocus === false) return;
    if (open) {
      var first = panel.querySelector('a');
      if (first) first.focus();
    } else {
      toggle.focus();
    }
  }
  toggle.addEventListener('click', function () { setNav(!open); });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setNav(false);
  });
  window.addEventListener('resize', function () {
    if (open && window.innerWidth > 760) setNav(false, false);
  });
})();

/* ---------- booking-readiness tool ----------
   The formula is published next to the tool on index.html.
   Keep the two in step:
     hours    = base(size) × style multiplier × placement factor,
                rounded to the nearest half hour
     sittings = ceil(hours / 4)   (a sitting is up to ~4 hours)
     price    = hours × hourly rate for the style, £80 minimum
     band     = price −10% / +10%, rounded to the nearest £10
     deposit  = £60 (up to 2.5 h) · £100 (up to 6 h) · £150 (over) */
(function () {
  var tool = document.getElementById('readiness');
  if (!tool) return;

  var PLACEMENT = {
    'forearm':   { label: 'Forearm',        factor: 1.0  },
    'upper-arm': { label: 'Upper arm',      factor: 1.0  },
    'calf':      { label: 'Calf',           factor: 1.0  },
    'thigh':     { label: 'Thigh',          factor: 1.05 },
    'chest':     { label: 'Chest / sternum', factor: 1.1 },
    'back':      { label: 'Back',           factor: 1.1  },
    'ankle':     { label: 'Ankle / foot',   factor: 1.15 },
    'ribs':      { label: 'Ribs / side',    factor: 1.2  }
  };
  var SIZE = {
    'small':  { label: 'Small — up to 8 cm',   base: 1   },
    'medium': { label: 'Medium — 8 to 15 cm',  base: 2.5 },
    'large':  { label: 'Large — 15 to 25 cm',  base: 5   },
    'xl':     { label: 'Extra large — 25 cm +', base: 9  }
  };
  var STYLE = {
    'fineline':   { label: 'Fine line',    mult: 0.8, rate: 120 },
    'blackwork':  { label: 'Blackwork',    mult: 1.0, rate: 140 },
    'traditional':{ label: 'Traditional',  mult: 1.1, rate: 140 },
    'blackgrey':  { label: 'Black & grey', mult: 1.4, rate: 160 }
  };

  var chosen = { placement: null, size: null, style: null };
  var out = {
    design: document.getElementById('out-design'),
    hours: document.getElementById('out-hours'),
    sittings: document.getElementById('out-sittings'),
    band: document.getElementById('out-band'),
    deposit: document.getElementById('out-deposit'),
    note: document.getElementById('out-note'),
    cta: document.getElementById('out-cta')
  };

  function roundHalf(x) { return Math.round(x * 2) / 2; }
  function floor10(x) { return Math.floor(x / 10) * 10; }
  function ceil10(x) { return Math.ceil(x / 10) * 10; }
  function money(n) { return '£' + n.toLocaleString('en-GB'); }

  function render() {
    var keys = ['placement', 'size', 'style'];
    var missing = keys.filter(function (k) { return !chosen[k]; });
    if (missing.length) {
      out.design.textContent = 'Still to choose: ' +
        missing.map(function (k) { return { placement: 'placement', size: 'size', style: 'style' }[k]; }).join(', ') + '.';
      out.hours.textContent = '—';
      out.sittings.textContent = '—';
      out.band.textContent = '—';
      out.deposit.textContent = '—';
      out.note.textContent = 'Pick one from each row and the book works out the rest, using the same formula printed beside the tool.';
      return;
    }
    var p = PLACEMENT[chosen.placement], s = SIZE[chosen.size], st = STYLE[chosen.style];
    var hours = roundHalf(s.base * st.mult * p.factor);
    var sittings = Math.ceil(hours / 4);
    var price = Math.max(80, hours * st.rate);
    var low = floor10(price * 0.9), high = ceil10(price * 1.1);
    var deposit = hours <= 2.5 ? 60 : (hours <= 6 ? 100 : 150);

    out.design.textContent = s.label.split(' — ')[0] + ' · ' + st.label + ' · ' + p.label;
    out.hours.textContent = hours + (hours === 1 ? ' hour' : ' hours') + ' of tattooing';
    out.sittings.textContent = sittings + (sittings === 1 ? ' sitting' : ' sittings') + ' (up to ~4 hours each)';
    out.band.textContent = money(low) + ' – ' + money(high);
    out.deposit.textContent = money(deposit) + ', taken off the final sitting';
    out.note.textContent = 'First sittings are running about five weeks from consultation. ' +
      'The fixed price is agreed at the consultation, in writing, before any deposit is taken.';
    if (out.cta) out.cta.href = 'contact.html?piece=' +
      encodeURIComponent(s.label.split(' — ')[0] + ' ' + st.label.toLowerCase() + ', ' + p.label.toLowerCase());
  }

  tool.querySelectorAll('[data-group]').forEach(function (group) {
    var name = group.getAttribute('data-group');
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-value]');
      if (!btn) return;
      group.querySelectorAll('[data-value]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      chosen[name] = btn.getAttribute('data-value');
      render();
    });
  });
  render();
})();

/* ---------- booking enquiry form ---------- */
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  var done = document.getElementById('confirmation');

  // The readiness tool can carry a starting point into the form.
  var params = new URLSearchParams(window.location.search);
  var piece = params.get('piece');
  var ideaField = form.querySelector('[name="idea"]');
  if (piece && ideaField && !ideaField.value) {
    ideaField.value = 'From the readiness check: ' + piece + '. ';
  }

  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function setInvalid(input, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    var wrap = input.closest('.field');
    if (wrap) {
      var err = wrap.querySelector('.err');
      if (err) err.classList.toggle('show', bad);
    }
    return !bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validate() {
    var ok = true, firstBad = null;
    var checks = [
      [field('name'), field('name').value.trim().length >= 2],
      [field('email'), validEmail(field('email').value.trim())],
      [field('placement'), field('placement').value !== ''],
      [field('size'), field('size').value !== ''],
      [field('idea'), field('idea').value.trim().length >= 10],
      [field('over18'), field('over18').checked]
    ];
    checks.forEach(function (pair) {
      var good = setInvalid(pair[0], !pair[1]);
      if (!good) { ok = false; if (!firstBad) firstBad = pair[0]; }
    });
    if (over18Err) over18Err.style.display = field('over18').checked ? 'none' : 'block';
    if (firstBad) firstBad.focus();
    return ok;
  }
  ['name', 'email', 'placement', 'size', 'idea'].forEach(function (n) {
    var input = field(n);
    if (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
      input.addEventListener('change', function () { setInvalid(input, false); });
    }
  });
  var over18 = field('over18');
  var over18Err = document.getElementById('over18-err');
  if (over18) over18.addEventListener('change', function () {
    setInvalid(over18, false);
    if (over18Err) over18Err.style.display = 'none';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var ref = 'II-2026-' + Math.floor(1000 + Math.random() * 9000);
    done.querySelector('.ref').textContent = 'Reference ' + ref;
    var sizeWord = { small: 'small', medium: 'medium', large: 'large', xl: 'extra-large', unsure: 'new' }[field('size').value] || 'new';
    done.querySelector('.sum').textContent =
      'Thank you, ' + field('name').value.trim().split(' ')[0] + '. Your enquiry about a ' +
      sizeWord + ' piece on the ' +
      field('placement').value + ' has been noted on this page. This demonstration form sends ' +
      'and stores nothing — to reach the studio for real, email bookings@inkandiron.example ' +
      'and quote the reference above.';
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
