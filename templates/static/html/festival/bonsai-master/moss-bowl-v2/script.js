/* Moss Bowl — Maarten Dekker. Vanilla JS: mobile menu, commission planner,
   enquiry form. No sound, no libraries. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts surface as unhandled InvalidStateError rejections;
     swallow only those, nothing else. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var panel = document.getElementById('mobilePanel');
  var openBtn = document.getElementById('menuBtn');
  if (panel && openBtn) {
    var closeBtn = panel.querySelector('.sheet-close');
    var firstLink = panel.querySelector('.sheet nav a');
    function openMenu() {
      panel.classList.add('open');
      openBtn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        if (firstLink) firstLink.focus({ preventScroll: true });
      });
    }
    function closeMenu() {
      panel.classList.remove('open');
      openBtn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      openBtn.focus({ preventScroll: true });
    }
    openBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    var scrim = panel.querySelector('.scrim');
    if (scrim) scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- Bowl Commission Planner (index) ----------
     Every rate is read from the options printed in the tables on the page:
     species options carry data-base / data-rate / data-min,
     bowl options carry data-price, wanted-by options carry data-deadline
     as YYYYMM so a spring ready date (YYYY03) compares directly. */
  var planner = document.getElementById('planner');
  if (planner) {
    var speciesSel = document.getElementById('pSpecies');
    var bowlSel = document.getElementById('pBowl');
    var wantSel = document.getElementById('pWant');
    var yearsOut = document.getElementById('pYearsOut');
    var years = 5;
    var START_YEAR = 2027; /* commissions are potted at the March 2027 repotting window */

    var elTotal = document.getElementById('outTotal');
    var elDeposit = document.getElementById('outDeposit');
    var elReady = document.getElementById('outReady');
    var elBreak = document.getElementById('outBreak');
    var noteOk = document.getElementById('noteOk');
    var noteYoung = document.getElementById('noteYoung');
    var noteLate = document.getElementById('noteLate');

    function eur(n) { return '€' + n.toLocaleString('en-IE'); }

    function compute() {
      var sp = speciesSel.options[speciesSel.selectedIndex];
      var base = parseInt(sp.getAttribute('data-base'), 10);
      var rate = parseInt(sp.getAttribute('data-rate'), 10);
      var minYears = parseInt(sp.getAttribute('data-min'), 10);
      var spName = sp.getAttribute('data-name');
      var bowlPrice = parseInt(bowlSel.options[bowlSel.selectedIndex].getAttribute('data-price'), 10);
      var bowlName = bowlSel.options[bowlSel.selectedIndex].getAttribute('data-name');

      var training = years * rate;
      var total = base + training + bowlPrice;
      var deposit = Math.round(total * 0.4);
      var readyYear = START_YEAR + years;
      var readyVal = readyYear * 100 + 3; /* 1 March of the ready year */
      var deadline = parseInt(wantSel.options[wantSel.selectedIndex].getAttribute('data-deadline'), 10);
      var wantName = wantSel.options[wantSel.selectedIndex].getAttribute('data-name');

      yearsOut.textContent = years + (years === 1 ? ' year' : ' years');
      elBreak.textContent = spName + ' €' + base + ' + ' + years + ' yrs × €' + rate +
        ' + ' + bowlName + ' €' + bowlPrice;
      elTotal.textContent = eur(total);
      elDeposit.textContent = eur(deposit) + ' (40%)';
      elReady.textContent = 'Spring ' + readyYear;

      var young = years < minYears;
      var late = readyVal > deadline;

      noteYoung.hidden = !young;
      if (young) {
        noteYoung.innerHTML = '<strong>Still a young tree.</strong> At ' + years +
          ' years a ' + spName.toLowerCase() + ' has not yet grown into the finished look — the honest minimum for this species is ' +
          minYears + ' years. I will grow it for ' + years + ' years if you ask, but I will not call it finished.';
      }
      noteLate.hidden = !late;
      if (late) {
        noteLate.innerHTML = '<strong>It cannot be ready by ' + wantName + '.</strong> A commission potted in March ' +
          START_YEAR + ' and grown for ' + years + ' years is ready in <strong>spring ' + readyYear +
          '</strong> — trees keep their own calendar. If the date matters more than the species, the finished bowls on this page are ready now.';
      }
      noteOk.hidden = young || late;
      planner.setAttribute('data-state', late ? 'late' : (young ? 'young' : 'ok'));
    }

    document.getElementById('pYearsMinus').addEventListener('click', function () {
      if (years > 2) { years--; compute(); }
    });
    document.getElementById('pYearsPlus').addEventListener('click', function () {
      if (years < 8) { years++; compute(); }
    });
    speciesSel.addEventListener('change', compute);
    bowlSel.addEventListener('change', compute);
    wantSel.addEventListener('change', compute);
    compute();
  }

  /* ---------- enquiry form (contact) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var conf = document.getElementById('confirmation');
      var ref = 'MB-2027-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = name ? name.split(' ')[0] : 'there';
      conf.hidden = false;
      form.hidden = true;
      conf.setAttribute('tabindex', '-1');
      conf.focus({ preventScroll: false });
      window.__lastRef = ref;
    });
  }
})();
