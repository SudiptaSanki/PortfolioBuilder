/* Kessler Propulsion Review — interactions.
   Sound ruling: NONE. An engine recording would be spectacle, not
   information, so this site is silent by design. No web-audio calls,
   no audio files — the stub's hover rumble was deleted, not rebuilt. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces as an unhandled InvalidStateError
     rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile sheet-index panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('sheetPanel');
  if (menuBtn && panel) {
    var closePanel = function (refocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closePanel(false);
      }
    });
  }

  /* ---------- reveal on scroll (opacity only job: stage the sheets) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Propellant Comparator (Sheet A) ---------- */
  /* Textbook class figures, stated as classes and bands on the page.
     Bulk density = combined density at a typical mixture ratio;
     density impulse = Isp class x bulk density. */
  var COMBOS = {
    methalox: {
      name: 'LOX / CH4 — methalox',
      isp: '≈ 360', ispBand: 'Textbook vacuum band 350–380 s for this class',
      density: '≈ 830', densityNote: 'kg/m³ combined, at a typical mixture ratio near 3.6 : 1',
      dimpulse: '≈ 300,000', dimpulseNote: 's·kg/m³ — Isp class × bulk density',
      storage: 'Both cryogenic: methane −162 °C, oxygen −183 °C',
      cycle: 'Full-flow staged combustion in current designs; also gas-generator',
      handling: 'The modern compromise. Both fluids are cryogenic but their temperatures sit close together, which keeps tank insulation and shared-bulkhead layouts simple. Methane burns cleaner than kerosene — far less carbon deposition in cooling passages — which is why reuse programmes keep choosing it. It still boils off, still needs chill-down, and its density is unremarkable: the tanks are bigger than a kerosene stage\u2019s, smaller than a hydrogen stage\u2019s by a wide margin.'
    },
    hydrolox: {
      name: 'LOX / LH2 — hydrolox',
      isp: '≈ 450', ispBand: 'Textbook vacuum band 440–465 s for this class',
      density: '≈ 360', densityNote: 'kg/m³ combined, at a typical mixture ratio near 6 : 1',
      dimpulse: '≈ 163,000', dimpulseNote: 's·kg/m³ — Isp class × bulk density',
      storage: 'Hydrogen −253 °C, oxygen −183 °C — the coldest fluids in the business',
      cycle: 'Expander and staged combustion; the classic high-energy upper-stage choice',
      handling: 'The performance champion and the handling problem in one. Hydrogen\u2019s Isp class is unmatched by any chemical propellant in routine use, but the fuel itself is 71 kg/m³ — the tanks are enormous, which is why hydrolox stages are wide. The molecule is small enough to leak through seals that hold everything else, it embrittles many structural alloys, and at −253 °C it boils off relentlessly. You do not choose hydrolox because it is convenient; you choose it because the mission\u2019s Δv budget leaves no alternative.'
    },
    kerolox: {
      name: 'LOX / RP-1 — kerolox',
      isp: '≈ 330', ispBand: 'Textbook vacuum band 310–350 s for this class',
      density: '≈ 1,030', densityNote: 'kg/m³ combined, at a typical mixture ratio near 2.7 : 1',
      dimpulse: '≈ 339,000', dimpulseNote: 's·kg/m³ — Isp class × bulk density',
      storage: 'RP-1 near ambient temperature; oxygen −183 °C',
      cycle: 'Gas-generator and staged combustion; the historic first-stage workhorse',
      handling: 'The density champion among the cryogenic pairs: compact tanks, a stiff structure, and a fuel you can store in a drum. The price is paid inside the engine — kerosene cracked in hot cooling passages leaves carbon deposits (coking), which limits chamber life and makes reuse an inspection problem. For an expendable first stage that trades on density and simplicity, kerolox remains a rational answer; for a stage you intend to fly twenty times, the trade study usually turns against it.'
    },
    storable: {
      name: 'MMH / NTO — storable bipropellant',
      isp: '≈ 320', ispBand: 'Textbook vacuum band 300–340 s for this class',
      density: '≈ 1,160', densityNote: 'kg/m³ combined, at a typical mixture ratio near 1.65 : 1',
      dimpulse: '≈ 373,000', dimpulseNote: 's·kg/m³ — Isp class × bulk density',
      storage: 'Both fluids liquid at room temperature, storable for years',
      cycle: 'Pressure-fed, deliberately simple — no turbopumps to fail',
      handling: 'Chosen when the calendar matters more than the physics. Both fluids sit in the tanks at room temperature for years and ignite on contact with each other — hypergolic — so there is no igniter to fail and no boiloff clock running. The Isp class is the lowest on this sheet, and both fluids are highly toxic and corrosive, handled as hazardous materials under strict procedure. Spacecraft and long-coast upper stages accept that bargain because a propellant you can wait with beats a propellant you must hurry with.'
    }
  };

  var sheet = document.getElementById('comboSheet');
  var comboBtns = document.querySelectorAll('[data-combo]');
  var currentCombo = 'methalox';

  function fmt(n) { return n.toLocaleString('en-GB'); }

  function renderCombo(key) {
    var c = COMBOS[key];
    if (!c || !sheet) return;
    currentCombo = key;
    document.getElementById('csName').textContent = c.name;
    document.getElementById('csIsp').innerHTML = '<span class="big">' + c.isp + ' s</span> <span class="unit">specific impulse, vacuum class</span>';
    document.getElementById('csIspBand').textContent = c.ispBand;
    document.getElementById('csDensity').innerHTML = '<span class="big">' + c.density + '</span> <span class="unit">' + c.densityNote + '</span>';
    document.getElementById('csDimpulse').innerHTML = '<span class="big">' + c.dimpulse + '</span> <span class="unit">' + c.dimpulseNote + '</span>';
    document.getElementById('csStorage').textContent = c.storage;
    document.getElementById('csCycle').textContent = c.cycle;
    document.getElementById('csHandling').textContent = c.handling;
    comboBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-combo') === key ? 'true' : 'false');
    });
    /* keep the printed reference table's highlight in step */
    document.querySelectorAll('#comboTable tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-row') === key);
    });
    /* and feed the class Isp into the rocket equation */
    var ispMap = { methalox: 360, hydrolox: 450, kerolox: 330, storable: 320 };
    setIsp(ispMap[key]);
  }
  comboBtns.forEach(function (b) {
    b.addEventListener('click', function () { renderCombo(b.getAttribute('data-combo')); });
  });

  /* ---------- Rocket equation (Sheet B) ---------- */
  var G0 = 9.80665;
  var eqIsp = 450;
  var eqMr = 5;
  var ispBtns = document.querySelectorAll('[data-isp]');
  var mrRange = document.getElementById('mrRange');
  var mrVal = document.getElementById('mrVal');
  var eqSub = document.getElementById('eqSub');
  var eqDv = document.getElementById('eqDv');

  function renderEq() {
    var ln = Math.log(eqMr);
    var dv = eqIsp * G0 * ln;
    if (mrVal) mrVal.textContent = '× ' + eqMr.toFixed(1);
    if (mrRange && parseFloat(mrRange.value) !== eqMr) mrRange.value = eqMr;
    if (eqSub) {
      eqSub.textContent = 'Δv = ' + eqIsp + ' × 9.80665 × ln(' + eqMr.toFixed(1) + ') = ' +
        eqIsp + ' × 9.80665 × ' + ln.toFixed(4) + ' = ' + fmt(Math.round(dv)) + ' m/s';
    }
    if (eqDv) {
      eqDv.innerHTML = (dv / 1000).toFixed(2) + ' <small>km/s</small>';
    }
    ispBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-isp'), 10) === eqIsp ? 'true' : 'false');
    });
  }
  function setIsp(v) {
    eqIsp = v;
    renderEq();
  }
  ispBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = parseInt(b.getAttribute('data-isp'), 10);
      /* full two-way sync: picking an Isp class re-sheets the comparator */
      var keyFor = { 360: 'methalox', 450: 'hydrolox', 330: 'kerolox', 320: 'storable' };
      if (sheet && keyFor[v]) renderCombo(keyFor[v]);
      else setIsp(v);
    });
  });
  if (mrRange) {
    mrRange.addEventListener('input', function () {
      eqMr = parseFloat(mrRange.value);
      renderEq();
    });
  }
  var mrMinus = document.getElementById('mrMinus');
  var mrPlus = document.getElementById('mrPlus');
  if (mrMinus) mrMinus.addEventListener('click', function () {
    eqMr = Math.max(2, Math.round((eqMr - 0.5) * 2) / 2); renderEq();
  });
  if (mrPlus) mrPlus.addEventListener('click', function () {
    eqMr = Math.min(10, Math.round((eqMr + 0.5) * 2) / 2); renderEq();
  });

  if (sheet) { renderCombo('methalox'); setIsp(360); }
  else if (eqSub) { renderEq(); }

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('fType');
    if (typeSel && params.get('type')) {
      var want = params.get('type');
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === want) { typeSel.selectedIndex = i; break; }
      }
    }
    function fieldBad(id, bad) {
      var input = document.getElementById(id);
      if (!input) return;
      var wrap = input.closest('.field');
      if (wrap) wrap.classList.toggle('bad', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var msg = document.getElementById('fMsg').value.trim();
      var ok = true;
      ok = fieldBad('fName', name.length < 2) && ok;
      ok = fieldBad('fEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = fieldBad('fMsg', msg.length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (firstBad) firstBad.focus();
        return;
      }
      /* deterministic reference from the enquiry itself */
      var seed = (name + '|' + email + '|' + msg).split('').reduce(function (a, c) {
        return ((a * 31) + c.charCodeAt(0)) % 900;
      }, 7);
      var ref = 'KP-2026-' + (100 + seed);
      if (confirmRef) confirmRef.textContent = ref;
      form.style.display = 'none';
      if (confirmBox) {
        confirmBox.classList.add('show');
        confirmBox.setAttribute('tabindex', '-1');
        confirmBox.focus();
      }
    });
    ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () { fieldBad(id, false); });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      if (confirmBox) confirmBox.classList.remove('show');
      document.getElementById('fName').focus();
    });
  }
})();
