/* Murti Marble — menu, commission planner, contact form. No audio: the sound need-test fails for a stone workshop. */
(function () {
  'use strict';

  /* View-transition abort guard: an aborted CSS view transition surfaces as an
     unhandled InvalidStateError rejection; swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu (spec-sheet panel) ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('menuClose');
  function openMenu() {
    panel.classList.add('open');
    scrim.classList.add('on');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { closeBtn.focus(); });
  }
  function closeMenu() {
    panel.classList.remove('open');
    scrim.classList.remove('on');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  if (btn && panel) {
    btn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
    panel.querySelectorAll('a.mp-link').forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('open');
        scrim.classList.remove('on');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Murti Commission Planner ----------
     Reads the tables printed on index.html: block weight + carving weeks from
     the height row, stone rate per kg, carving at Rs 15,000/week.
     Mirror polish = weeks x 1.25 rounded up. Painted detail = +1 week and
     Rs 140 per cm of height. One extra week is added for crating/delivery. */
  var WEEK_RATE = 15000, CRATE_WEEKS = 1, PAINT_PER_CM = 140;
  function inr(n) { return '\u20B9' + n.toLocaleString('en-IN'); }
  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function weeksFor(baseWeeks, finish) {
    if (finish === 'mirror') return Math.ceil(baseWeeks * 1.25);
    if (finish === 'painted') return baseWeeks + 1;
    return baseWeeks;
  }
  function readyDate(weeks) {
    var d = new Date();
    d.setDate(d.getDate() + (weeks + CRATE_WEEKS) * 7);
    return d;
  }
  var pHeight = document.getElementById('pHeight');
  if (pHeight) {
    var pStone = document.getElementById('pStone');
    var pFinish = document.getElementById('pFinish');
    var pDate = document.getElementById('pDate');
    function plan() {
      var hOpt = pHeight.options[pHeight.selectedIndex];
      var height = parseInt(pHeight.value, 10);
      var kg = parseInt(hOpt.getAttribute('data-kg'), 10);
      var baseWeeks = parseInt(hOpt.getAttribute('data-weeks'), 10);
      var sOpt = pStone.options[pStone.selectedIndex];
      var rate = parseInt(sOpt.getAttribute('data-rate'), 10);
      var finish = pFinish.value;

      var weeks = weeksFor(baseWeeks, finish);
      var finishCost = finish === 'painted' ? PAINT_PER_CM * height : 0;
      var stoneCost = kg * rate;
      var labour = weeks * WEEK_RATE;
      var total = stoneCost + labour + finishCost;
      var ready = readyDate(weeks);

      document.getElementById('rBlock').textContent = hOpt.getAttribute('data-block');
      document.getElementById('rWeight').textContent = kg.toLocaleString('en-IN') + ' kg';
      document.getElementById('rStone').textContent = inr(stoneCost);
      document.getElementById('rWeeks').textContent = weeks + (weeks === 1 ? ' week' : ' weeks');
      document.getElementById('rLabour').textContent = inr(labour);
      document.getElementById('rFinish').textContent = inr(finishCost);
      document.getElementById('rReady').textContent = fmtDate(ready);
      document.getElementById('rTotal').textContent = inr(total);

      var warn = document.getElementById('pWarn');
      var dateVal = pDate.value;
      if (dateVal) {
        var need = new Date(dateVal + 'T23:59:59');
        if (ready > need) {
          var smallerTxt = '';
          var idx = pHeight.selectedIndex;
          if (idx > 0) {
            var so = pHeight.options[idx - 1];
            var sw = weeksFor(parseInt(so.getAttribute('data-weeks'), 10), finish);
            smallerTxt = ' A ' + so.value + ' cm figure (' + sw + ' weeks in the stone) would be ready by ' +
              fmtDate(readyDate(sw)) + '.';
          }
          warn.innerHTML = '<b>That date is inside the carving time.</b> This figure will be ready on <b>' +
            fmtDate(ready) + '</b>, not before \u2014 marble does not hurry.' + smallerTxt +
            ' Or choose a finished piece from the <a href="projects.html">studio shelf</a>, which can be crated this week.';
          warn.hidden = false;
        } else {
          warn.hidden = true;
        }
      } else {
        warn.hidden = true;
      }
    }
    [pHeight, pStone, pFinish, pDate].forEach(function (el) {
      el.addEventListener('change', plan);
      el.addEventListener('input', plan);
    });
    plan();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cName');
      var email = document.getElementById('cEmail');
      var msg = document.getElementById('cMsg');
      var fields = [name, email, msg];
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].value.trim()) { fields[i].focus(); return; }
      }
      var ref = 'MM-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmText').textContent =
        'Thank you, ' + name.value.trim() + '. I will reply to ' + email.value.trim() +
        ' within two working days, and the first line of my reply will be the honest date.';
      form.hidden = true;
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
