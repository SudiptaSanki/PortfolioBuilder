/* sunar-spark — the weight book, wired.
   Bench Calculator + Weight & Measure Explorer + day-book menu +
   enquiry form + reveals. Vanilla JS, no libraries.
   Sound ruling: FAILS the need-test — goldsmithing is not a sound
   profession and nothing here teaches through audio. No audio
   anywhere, by design. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Cross-document view transitions abort noisily when interrupted;
     the navigation itself always completes. Swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var inr = function (n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  /* ---------------- day-book menu ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var book = document.getElementById('dayBook');
  if (menuBtn && book) {
    var setBook = function (open) {
      if (open) {
        book.hidden = false;
        book.classList.remove('open-anim');
        void book.offsetWidth;
        book.classList.add('open-anim');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = book.querySelector('a');
            if (first) first.focus();
          });
        });
      } else {
        book.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    };
    menuBtn.addEventListener('click', function () {
      setBook(book.hidden);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !book.hidden) {
        setBook(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------------- bench calculator ---------------- */
  var RATES = { '22': 8800, '18': 7200, '14': 5600, '9': 3600 };
  var FINE = { '22': '916', '18': '750', '14': '585', '9': '375' };
  var MAKING = {
    plain: { label: 'Class I — Plain work', amt: 3800 },
    worked: { label: 'Class II — Worked', amt: 7500 },
    fine: { label: 'Class III — Fine work', amt: 14000 }
  };
  var STONES = {
    none: { label: 'No stones', amt: 0 },
    small: { label: 'Small stones, bench-supplied', amt: 6500 },
    centre: { label: 'One centre stone, bench-supplied', amt: 38000 },
    own: { label: 'Your own stones (setting in making)', amt: 0 }
  };
  var karat = '22', making = 'worked', stones = 'none';

  var weightIn = document.getElementById('cWeight');
  var oldIn = document.getElementById('cOld');
  if (weightIn) {
    var num = function (el, fallback) {
      var v = parseFloat(el.value);
      return isNaN(v) || v < 0 ? fallback : v;
    };
    var calc = function () {
      var w = num(weightIn, 0);
      var old = oldIn ? num(oldIn, 0) : 0;
      var rate = RATES[karat];
      var metal = w * rate;
      var credit = old * rate * 0.98;
      var mk = MAKING[making], st = STONES[stones];
      document.getElementById('eMetalLine').textContent =
        karat + 'k gold (' + FINE[karat] + ') — ' + w.toFixed(1) + ' g at ' + inr(rate) + ' per gram';
      document.getElementById('eMetal').textContent = inr(metal);
      document.getElementById('eMakingLine').textContent = mk.label + ', per piece';
      document.getElementById('eMaking').textContent = inr(mk.amt);
      document.getElementById('eStonesLine').textContent = st.label;
      document.getElementById('eStones').textContent = inr(st.amt);
      var creditRow = document.getElementById('eCreditRow');
      if (old > 0) {
        creditRow.hidden = false;
        document.getElementById('eCreditLine').textContent =
          'Old gold handed in — ' + old.toFixed(1) + ' g at the same rate, less 2% refining';
        document.getElementById('eCredit').textContent = '−' + inr(credit);
      } else {
        creditRow.hidden = true;
      }
      document.getElementById('eTotal').textContent = inr(metal + mk.amt + st.amt - credit);
      var rows = document.querySelectorAll('#rateCard tr[data-karat]');
      rows.forEach(function (r) {
        r.classList.toggle('hl', r.getAttribute('data-karat') === karat);
      });
    };
    var wireChips = function (sel, fn) {
      document.querySelectorAll(sel).forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', 'true');
          fn(btn);
          calc();
        });
      });
    };
    wireChips('.k-btn', function (b) { karat = b.getAttribute('data-k'); });
    wireChips('.m-btn', function (b) { making = b.getAttribute('data-m'); });
    wireChips('.s-btn', function (b) { stones = b.getAttribute('data-s'); });
    document.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-target'));
        if (!target) return;
        var step = parseFloat(btn.getAttribute('data-step'));
        var v = parseFloat(target.value) || 0;
        v = Math.max(0, Math.round((v + step) * 10) / 10);
        target.value = v;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    weightIn.addEventListener('input', calc);
    if (oldIn) oldIn.addEventListener('input', calc);
    calc();
  }

  /* ---------------- weight & measure explorer ---------------- */
  var gramsIn = document.getElementById('xGrams');
  if (gramsIn) {
    var xKarat = '22';
    var explore = function () {
      var g = parseFloat(gramsIn.value);
      if (isNaN(g) || g < 0) g = 0;
      document.getElementById('xOzt').textContent = (g / 31.1035).toFixed(4);
      document.getElementById('xDwt').textContent = (g / 1.55517).toFixed(2);
      document.getElementById('xTola').textContent = (g / 11.6638).toFixed(3);
      var k = parseInt(xKarat, 10);
      document.getElementById('xFineLine').innerHTML =
        '<b>' + k + ' karat</b> = ' + k + '/24 fine = <b>' + FINE[xKarat] + '</b> on the millesimal scale = <b>' +
        (k / 24 * 100).toFixed(1) + '%</b> pure gold. The rest is alloy — silver, copper, zinc — added for hardness and colour.';
    };
    document.querySelectorAll('.xk-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.xk-btn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        xKarat = btn.getAttribute('data-k');
        explore();
      });
    });
    document.querySelectorAll('.x-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = parseFloat(gramsIn.value) || 0;
        v = Math.max(0, Math.round((v + parseFloat(btn.getAttribute('data-step'))) * 100) / 100);
        gramsIn.value = v;
        gramsIn.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    gramsIn.addEventListener('input', explore);
    explore();
  }

  /* ---------------- enquiry form ---------------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('fType');
    var wanted = params.get('type');
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.value = wanted; break; }
      }
    }
    var check = function (id, test) {
      var input = document.getElementById(id);
      var field = input.closest('.field');
      var good = test(input.value.trim());
      field.classList.toggle('invalid', !good);
      input.setAttribute('aria-invalid', good ? 'false' : 'true');
      return good;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var results = [
        check('fName', function (v) { return v.length > 1; }),
        check('fEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }),
        check('fType', function (v) { return v !== ''; }),
        check('fMsg', function (v) { return v.length > 9; })
      ];
      if (results.indexOf(false) > -1) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'SS-2026-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('confRef').textContent = ref;
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
    ['fName', 'fEmail', 'fType', 'fMsg'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () {
        input.closest('.field').classList.remove('invalid');
      });
    });
    var again = document.getElementById('sendAnother');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        form.hidden = false;
        document.getElementById('confirmation').hidden = true;
        document.getElementById('fName').focus();
      });
    }
  }

  /* ---------------- reveals (opacity only) ---------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
