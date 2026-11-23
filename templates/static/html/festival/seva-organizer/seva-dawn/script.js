/* Dawn Langar — roster navigation, entrance stagger, and the Saturday-night planner. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* navigation */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* entrance */
  var targets = doc.querySelectorAll('.board, .rail-section > *, .steps li, .planner-head, .planner-grid, .cost-body > *, .rules h2, .rules li, .rules blockquote, .callout > *, .page-head > *, .ledger-row, .story-grid > *, .team-grid > *');
  if (!reduce && targets.length) {
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (el) { el.classList.add('in'); });
      });
    });
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 1800);
  }

  /* ---------- roster form ---------- */
  var form = doc.getElementById('rosterForm');
  if (form) {
    var success = doc.getElementById('formSuccess');
    var fail = function (id, msg) {
      var input = doc.getElementById(id);
      if (!input) return;
      var field = input.closest('.field');
      var slot = field ? field.querySelector('.field-error') : null;
      if (field) field.classList.toggle('invalid', !!msg);
      if (slot) slot.textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('name');
      var email = doc.getElementById('email');
      var phone = doc.getElementById('phone');
      var ok = true;
      if (!name.value.trim()) { fail('name', 'Please add your name.'); ok = false; } else fail('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        fail('email', 'We need an email to confirm your slot.'); ok = false;
      } else fail('email', '');
      if (phone.value.trim() && !/^[+\d][\d\s-]{7,}$/.test(phone.value.trim())) {
        fail('phone', 'Please check the number.'); ok = false;
      } else fail('phone', '');
      if (!ok) { if (success) success.hidden = true; return; }

      var sunday = doc.getElementById('sunday').value;
      var role = doc.getElementById('role').value;
      var first = doc.getElementById('firstTime').checked;
      var note = doc.getElementById('message').value.trim();
      var subject = 'Roster: ' + name.value.trim() + ' — ' + sunday;
      var body = 'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
        '\nPhone: ' + (phone.value.trim() || '—') + '\nSunday: ' + sunday + '\nRole: ' + role +
        '\nFirst Sunday: ' + (first ? 'yes' : 'no') + '\n\n' + (note || '—');
      var mailto = 'mailto:roster@dawnlangar.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (success) {
        success.hidden = false;
        success.innerHTML = 'Thank you, ' + name.value.trim().replace(/[<>&]/g, '') + '. Your name is ready for the roster — ' +
          '<a href="' + mailto + '">send it from your mail app</a> to finish the sign-up. ' +
          'You will hear from us by Friday at six, with the time to arrive and who will meet you at the door.';
      }
    });
    ['name', 'email', 'phone'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.addEventListener('input', function () { fail(id, ''); });
    });
  }

  /* ---------- planner ---------- */
  var plates = doc.getElementById('plates');
  if (!plates) return;

  var menu = doc.getElementById('menu');
  var buttermilk = doc.getElementById('buttermilk');
  var sweet = doc.getElementById('sweet');

  var RECIPES = {
    sambar: {
      name: 'Sambar rice',
      grain: ['Ponni rice', 'kg', 0.075, 50],
      dal: ['Toor dal', 'kg', 0.035, 84],
      veg: 0.080,
      oil: 0.008,
      tamarind: 0.005,
      sweetKg: 0.040
    },
    tamarind: {
      name: 'Tamarind rice',
      grain: ['Ponni rice', 'kg', 0.075, 50],
      dal: ['Chana dal', 'kg', 0.012, 84],
      veg: 0.055,
      oil: 0.010,
      tamarind: 0.008,
      sweetKg: 0.040
    },
    chapati: {
      name: 'Chapati & dal',
      grain: ['Atta (wheat)', 'kg', 0.120, 44],
      dal: ['Toor dal', 'kg', 0.030, 84],
      veg: 0.070,
      oil: 0.012,
      tamarind: 0.001,
      sweetKg: 0.035
    }
  };

  var PRICE = { veg: 26, oil: 125, tamarind: 100, salt: 20, buttermilk: 14, sweet: 45, gas: 1050 };

  function fmt(n, unit) {
    if (unit === 'L' || unit === 'kg') {
      if (n >= 100) return String(Math.round(n));
      if (n >= 10) return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');
      return (Math.round(n * 10) / 10).toFixed(1);
    }
    return String(Math.round(n));
  }

  function set(id, value) {
    var el = doc.getElementById(id);
    if (el) el.textContent = value;
  }

  function calculate() {
    var n = parseInt(plates.value, 10);
    var r = RECIPES[menu.value] || RECIPES.sambar;
    var grainKg = r.grain[2] * n;
    var dalKg = r.dal[2] * n;
    var vegKg = r.veg * n;
    var oilL = r.oil * n;
    var tamKg = r.tamarind * n;
    var saltKg = 0.003 * n;
    var butterL = buttermilk.checked ? 0.150 * n : 0;
    var sweetKg = sweet.checked ? r.sweetKg * n : 0;
    var gas = Math.ceil(n / 480);
    var vols = 6 + Math.ceil(n / 22);

    var cost = grainKg * r.grain[3] + dalKg * r.dal[3] + vegKg * PRICE.veg + oilL * PRICE.oil +
      tamKg * PRICE.tamarind + saltKg * PRICE.salt + butterL * PRICE.buttermilk +
      sweetKg * PRICE.sweet + gas * PRICE.gas;

    set('plateOut', n.toLocaleString('en-IN'));
    set('outPlates', n.toLocaleString('en-IN'));
    set('lRice', r.grain[0]);
    set('lDal', r.dal[0]);
    set('outMenu', r.name);
    set('oRice', fmt(grainKg, 'kg'));
    set('oDal', fmt(dalKg, 'kg'));
    set('oVeg', fmt(vegKg, 'kg'));
    set('oOil', fmt(oilL, 'L'));
    set('oTamarind', fmt(tamKg, 'kg'));
    set('oSalt', fmt(saltKg, 'kg'));
    set('oButter', butterL ? fmt(butterL, 'L') : '—');
    set('oSweet', sweetKg ? fmt(sweetKg, 'kg') : '—');
    set('oGas', String(gas));
    set('oVol', String(vols));
    set('oCost', Math.round(cost).toLocaleString('en-IN'));
    set('oPer', String(Math.max(1, Math.round(cost / n))));
  }

  plates.addEventListener('input', calculate);
  menu.addEventListener('change', calculate);
  buttermilk.addEventListener('change', calculate);
  sweet.addEventListener('change', calculate);
  calculate();
})();
