/* Candlefire — the ledger book's working parts.
   Mobile menu, stamp reveals, the Kinara Set Planner
   (which reads the bench table printed on the page),
   and the order form. No sound, anywhere. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only those, nothing else. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu: a loose leaf under the cover line ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  if (menuBtn && panel) {
    var open = false;
    function setMenu(state) {
      open = state;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(function () {
          panel.classList.add('open');
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        panel.classList.remove('open');
        panel.hidden = true;
      }
    }
    menuBtn.addEventListener('click', function () { setMenu(!open); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  /* ---------- stamp reveals: each night entered as it arrives ---------- */
  var rows = document.querySelectorAll('.ledger-row');
  if (rows.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rows.forEach(function (row) { row.classList.add('stamped'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('stamped');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      rows.forEach(function (row) { io.observe(row); });
    }
  }

  /* ---------- the Kinara Set Planner ----------
     Reads its figures from the bench table printed on the page,
     so the planner and the page can never disagree.
     A set is 7 candles. Across the week they burn
     7+6+5+4+3+2+1 = 28 candle-nights; the black candle
     alone burns 7 evenings. */
  var table = document.getElementById('rateTable');
  var plannerEl = document.querySelector('.planner');
  if (table && plannerEl) {
    var rates = {};
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      rates[tr.getAttribute('data-size')] = {
        burn: parseInt(tr.getAttribute('data-burn'), 10),
        wax: parseInt(tr.getAttribute('data-wax'), 10),
        price: parseInt(tr.getAttribute('data-price'), 10),
        label: tr.querySelector('th').textContent.trim()
      };
    });

    var NIGHTS = [7, 6, 5, 4, 3, 2, 1];
    var CANDLE_NIGHTS = NIGHTS.reduce(function (a, b) { return a + b; }, 0); /* 28 */
    var KINARA_PRICE = 38;

    var size = 'classic';
    var hours = 2;
    var sizeBtns = plannerEl.querySelectorAll('.size-btn');
    var hVal = document.getElementById('hVal');
    var hMinus = document.getElementById('hMinus');
    var hPlus = document.getElementById('hPlus');
    var kinaraChk = document.getElementById('kinaraChk');
    var outTotal = document.getElementById('outTotal');
    var outBlack = document.getElementById('outBlack');
    var outWax = document.getElementById('outWax');
    var outPrice = document.getElementById('outPrice');
    var outVerdict = document.getElementById('outVerdict');

    function fmt(n) { return n.toLocaleString('en-US'); }

    function compute() {
      var r = rates[size];
      var total = CANDLE_NIGHTS * hours;
      var black = 7 * hours;
      var wax = 7 * r.wax;
      var price = 7 * r.price + (kinaraChk.checked ? KINARA_PRICE : 0);

      outTotal.innerHTML = fmt(total) + ' <small>hours</small>';
      outBlack.innerHTML = fmt(black) + ' <small>of ' + r.burn + ' hours</small>';
      outWax.innerHTML = fmt(wax) + ' <small>g · ' + (wax / 1000).toFixed(2) + ' kg</small>';
      outPrice.textContent = '$' + fmt(price);

      if (black <= r.burn) {
        outVerdict.classList.remove('warn');
        outVerdict.innerHTML = '<strong>This set lasts your week.</strong> ' +
          'The black candle works ' + black + ' of its ' + r.burn + ' hours — it will still be standing, ' +
          'shorter and well used, when the last green candle is lit on 1 January.';
      } else {
        outVerdict.classList.add('warn');
        var fullNights = Math.floor(r.burn / hours);
        var when;
        if (r.burn % hours === 0) {
          when = 'burns its last hour at the close of night ' + fullNights;
        } else {
          when = 'gives out during night ' + (fullNights + 1);
        }
        var bigger = size === 'petite' ? 'Classic' : 'Tall';
        outVerdict.innerHTML = '<strong>Too short for your evenings.</strong> ' +
          'At ' + hours + ' hours a night the black candle needs ' + black + ' hours and the ' +
          r.label + ' holds ' + r.burn + ' — it ' + when + ', one seat of the kinara dark ' +
          'before the week is done. Step up to the ' + bigger + ' and the arithmetic closes.';
      }
    }

    sizeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        size = btn.getAttribute('data-size');
        sizeBtns.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        compute();
      });
    });
    hMinus.addEventListener('click', function () {
      if (hours > 1) { hours -= 1; hVal.textContent = hours + (hours === 1 ? ' hour' : ' hours'); compute(); }
    });
    hPlus.addEventListener('click', function () {
      if (hours < 4) { hours += 1; hVal.textContent = hours + ' hours'; compute(); }
    });
    kinaraChk.addEventListener('change', compute);
    compute();
  }

  /* ---------- the order form: entered in the book ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var confirmText = document.getElementById('confirmText');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var need = document.getElementById('fNeed').value;
      var dateVal = document.getElementById('fDate').value;
      if (!name) { document.getElementById('fName').focus(); return; }
      if (!email || email.indexOf('@') < 1) { document.getElementById('fEmail').focus(); return; }
      if (!dateVal) { document.getElementById('fDate').focus(); return; }

      /* Reference: CF- plus six characters worked from the entry itself. */
      var seed = (name + '|' + email + '|' + dateVal).toUpperCase();
      var hash = 0;
      for (var i = 0; i < seed.length; i++) {
        hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
      }
      var ref = 'CF-' + ('000000' + hash.toString(36).toUpperCase()).slice(-6);

      var niceDate = dateVal;
      try {
        niceDate = new Date(dateVal + 'T12:00:00').toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
      } catch (err) { /* keep the raw date */ }

      confirmRef.textContent = ref;
      confirmText.innerHTML = 'Thank you, <strong>' + name.split(' ')[0] + '</strong>. ' +
        '<strong>' + need + '</strong>, needed by <strong>' + niceDate + '</strong>, ' +
        'is written into the book under this reference. I answer within two evenings ' +
        'with the pour date and the collection day.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.focus();
    });
  }
})();
