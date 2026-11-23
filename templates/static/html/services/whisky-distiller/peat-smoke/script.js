/* PEAT SMOKE — interactions
   Sound ruling: FAILS the need-test. Distilling is not a sound
   profession and nothing on this site teaches through audio — the
   still room is quiet and the ledger is read, not heard. The stub's
   mousemove smoke-parallax was decoration and is deleted, not
   rebuilt. No audio anywhere on this site. */

'use strict';

/* Cross-document view transitions can abort when a navigation is
   interrupted; Chrome surfaces that abort as an unhandled rejection.
   Swallow only that specific rejection — nothing else. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile ledger panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('ledgerPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '✕ Close the ledger';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    });
  }
  function close(returnFocus) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰ Open the ledger';
    document.body.style.overflow = '';
    if (returnFocus) btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(true); else open();
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
})();

/* ---------- reveal on scroll (opacity only; a job: ledger entries
   settle in reading order as the reader reaches them) ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- Smoke & Cask Explorer ----------
   One data model. The printed reference tables on index.html carry
   the same bands, phenol figures and cask additions; the probe
   checks the sheet against the printed page. PPM is the phenol
   content of the MALT, as specified to the maltster — stated on the
   page, because ppm in the malt is not smokiness in the glass. */
var PS_BANDS = {
  unpeated: { name: 'Unpeated', ppm: '0 ppm', base: 6,
    malt: 'Malt dried with hot air alone. No peat smoke in the kiln, so no phenols to measure — the figure is a true zero, not a rounding.',
    taste: 'Malt, orchard fruit, honey and the cask do all the talking. This is whisky\u2019s control sample: everything you taste arrived after the kiln.',
    serve: 'Tulip glass, neat first. Of the four bands this one changes least with water — a teaspoon at most, and only if the strength bites.' },
  light: { name: 'Lightly peated', ppm: '1\u201315 ppm', base: 7,
    malt: 'A short peat reek in the kiln — hours of smoke, not days. The maltster\u2019s specification is a range, because peat is a fuel, not a reagent.',
    taste: 'Smoke as seasoning rather than the dish: woodsmoke and heather behind fruit and malt, gone by the finish on most casks.',
    serve: 'Tulip glass. A few drops of water lift the smoke off the spirit and into the nose — add drops, not splashes.' },
  medium: { name: 'Medium peated', ppm: '16\u201330 ppm', base: 9,
    malt: 'Peat smoke through most of the kilning. The band where the malt bill and the cask bill argue loudest — and both can win.',
    taste: 'Bonfire, sea air and malt in balance. This is the band where cask choice shows most clearly, because neither side shouts the other down.',
    serve: 'Tulip glass, five minutes\u2019 rest. Water a teaspoon at a time: this band changes fastest in the glass, in both directions.' },
  heavy: { name: 'Heavily peated', ppm: '35\u201355+ ppm', base: 11,
    malt: 'Malt peated hard — the 40\u201355 ppm specifications asked of maltsters for the smokiest island styles. Remember: that number describes the malt, before fermentation, distillation and the cask have each taken their share.',
    taste: 'Tar, iodine, smoked fish, ash — and underneath, sweetness, if the cut was kind. What reaches the glass is always less than the malt figure, and never the whole story.',
    serve: 'Tulip glass and a generous rest. Water in small steps: heavy peat opens slowly and overshoots fast.' }
};
var PS_CASKS = {
  refill: { name: 'Refill hogshead', add: 0,
    contrib: 'A cask on its second or third fill for Scotch. The oak has given most of what it had, so the spirit speaks first and the wood whispers. Slow, honest maturation — and usually the best value on this page.',
    effect: 'Palest colour of the four. Smoke and spirit character stay in front; nothing is hidden behind the wood.' },
  bourbon: { name: 'First-fill bourbon barrel', add: 2,
    contrib: 'American oak that held bourbon, on its first fill for Scotch. Vanilla, coconut and honey arrive early and generously — the cask equivalent of a warm welcome.',
    effect: 'Sweetness moves up front and the peat reads rounder and warmer against it.' },
  wine: { name: 'Red-wine cask finish', add: 3,
    contrib: 'A finishing period — months, not years — in a cask that held red wine, after full maturation elsewhere. A finish is a seasoning, not a second maturation, and it is priced as one.',
    effect: 'Berry fruit and a little tannin over the top; the cask shows most in the finish of the whisky, fittingly.' },
  sherry: { name: 'Sherry butt · European oak', add: 4,
    contrib: 'A 500-litre butt that held sherry. Dried fruit, walnut, spice and the deepest natural colour of the four — European oak works harder and costs more, which is most of why this line costs more.',
    effect: 'The cask can stand in front of the smoke. Against heavy peat it is a genuine contest, and the better tastings are the ones where neither wins outright.' }
};
function psMoney(n) { return '\u00A3' + n; }

(function () {
  var sheet = document.getElementById('exSheet');
  if (!sheet) return;
  var band = 'heavy', cask = 'sherry';
  var el = {
    title: document.getElementById('exTitle'),
    ppm: document.getElementById('exPpm'),
    malt: document.getElementById('exMalt'),
    caskName: document.getElementById('exCaskName'),
    contrib: document.getElementById('exContrib'),
    effect: document.getElementById('exEffect'),
    taste: document.getElementById('exTaste'),
    serve: document.getElementById('exServe'),
    price: document.getElementById('exPrice')
  };
  function render() {
    var b = PS_BANDS[band], c = PS_CASKS[cask];
    el.title.textContent = b.name + ' \u00D7 ' + c.name;
    el.ppm.textContent = 'Malt phenols ' + b.ppm + ' \u00B7 25 ml pour';
    el.malt.textContent = b.malt;
    el.caskName.textContent = c.name;
    el.contrib.textContent = c.contrib;
    el.effect.textContent = c.effect;
    el.taste.textContent = b.taste;
    el.serve.textContent = b.serve;
    el.price.innerHTML = 'The pour, worked out: <b>' + psMoney(b.base + c.add) + '</b> &nbsp;=&nbsp; ' +
      psMoney(b.base) + ' band + ' + (c.add ? psMoney(c.add) + ' cask' : '\u00A30 cask') +
      ' &nbsp;\u00B7&nbsp; ' + b.name.toLowerCase() + ', ' + c.name.toLowerCase();
    document.querySelectorAll('#bandTable tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-band') === band);
    });
    document.querySelectorAll('#caskTable tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-cask') === cask);
    });
  }
  document.querySelectorAll('[data-band-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      band = btn.getAttribute('data-band-btn');
      document.querySelectorAll('[data-band-btn]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === btn ? 'true' : 'false');
      });
      render();
    });
  });
  document.querySelectorAll('[data-cask-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cask = btn.getAttribute('data-cask-btn');
      document.querySelectorAll('[data-cask-btn]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === btn ? 'true' : 'false');
      });
      render();
    });
  });
  render();
})();

/* ---------- Flight builder ----------
   A flight is three or four 15 ml pours, in the order the distiller
   pours them — lightest first. Prices are the printed flight-card
   prices on the page; the sheet shows every line and the sum. */
(function () {
  var box = document.getElementById('flightOpts');
  if (!box) return;
  var lines = document.getElementById('flightLines');
  var totalEl = document.getElementById('flightTotal');
  var note = document.getElementById('flightNote');
  var inputs = Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]'));
  function render() {
    var picked = inputs.filter(function (i) { return i.checked; });
    inputs.forEach(function (i) {
      var lab = i.closest('.pour-opt');
      if (lab) lab.classList.toggle('off', !i.checked && picked.length >= 4);
      i.disabled = !i.checked && picked.length >= 4;
    });
    if (!picked.length) {
      lines.innerHTML = '<div class="fl"><span>No pours picked yet.</span><span></span></div>';
    } else {
      lines.innerHTML = picked.map(function (i) {
        return '<div class="fl"><span>' + i.getAttribute('data-name') + '</span><span>' + psMoney(+i.getAttribute('data-price')) + '</span></div>';
      }).join('');
    }
    var sum = picked.reduce(function (s, i) { return s + (+i.getAttribute('data-price')); }, 0);
    totalEl.textContent = psMoney(sum);
    if (picked.length < 3) {
      note.textContent = 'A flight is three or four pours — pick ' + (3 - picked.length) + ' more and the card is complete. Pours are 15 ml tasting measures, lightest first.';
    } else if (picked.length === 4) {
      note.textContent = 'Four pours — the full card. That is 60 ml across the flight; the water jug and the spittoon are on the table, and nobody is keeping score.';
    } else {
      note.textContent = 'Three pours — a complete flight. Add a fourth if the evening allows; the card stops at four on purpose.';
    }
  }
  inputs.forEach(function (i) { i.addEventListener('change', render); });
  render();
})();

/* ---------- contact form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirm = document.getElementById('confirmBox');
  var fields = {
    name: document.getElementById('fName'),
    email: document.getElementById('fEmail'),
    type: document.getElementById('fType'),
    msg: document.getElementById('fMsg')
  };
  var params = new URLSearchParams(window.location.search);
  var pre = params.get('type');
  if (pre && fields.type) {
    for (var i = 0; i < fields.type.options.length; i++) {
      if (fields.type.options[i].value === pre) { fields.type.selectedIndex = i; break; }
    }
  }
  function flag(input, errId, bad) {
    var err = document.getElementById(errId);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (err) err.classList.toggle('show', bad);
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ok = flag(fields.name, 'eName', !fields.name.value.trim()) && ok;
    ok = flag(fields.email, 'eEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) && ok;
    ok = flag(fields.msg, 'eMsg', fields.msg.value.trim().length < 10) && ok;
    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'PS-2026-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('confirmText').textContent =
      'Thank you, ' + fields.name.value.trim() + '. Your note about \u201C' +
      fields.type.options[fields.type.selectedIndex].text + '\u201D is written in the ledger under ' + ref +
      '. This demonstration form sends nothing — for a real reply, email hamish@peatsmoke.example.';
    confirm.classList.add('show');
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    form.reset();
    confirm.classList.remove('show');
    ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.setAttribute('aria-invalid', 'false');
    });
    document.querySelectorAll('.f-err').forEach(function (n) { n.classList.remove('show'); });
    fields.name.focus();
  });
})();
