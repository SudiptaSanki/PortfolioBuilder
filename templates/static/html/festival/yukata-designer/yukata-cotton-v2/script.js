/* Hoshino Yukata — vanilla JS: mobile menu, cloth-band parallax, the
   made-to-measure planner, and the contact form. No libraries. */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  var menuClose = document.getElementById('menuClose');
  function openMenu() {
    if (!menuPanel) return;
    menuPanel.classList.add('open');
    menuPanel.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      var first = menuPanel.querySelector('nav a');
      if (first) first.focus({ preventScroll: true });
    });
  }
  function closeMenu() {
    if (!menuPanel) return;
    menuPanel.classList.remove('open');
    menuPanel.setAttribute('aria-hidden', 'true');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus({ preventScroll: true }); }
  }
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- parallax: the cloth bands drift as they unroll ---------- */
  if (!reduced) {
    var drifters = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
    var driftBgs = Array.prototype.slice.call(document.querySelectorAll('[data-drift-bg]'));
    var ticking = false;
    function applyDrift() {
      ticking = false;
      var vh = window.innerHeight;
      drifters.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-drift'));
        var y = Math.max(-16, Math.min(16, -off));
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(1.07)';
      });
      driftBgs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var off = (r.top - vh / 2) * parseFloat(el.getAttribute('data-drift-bg'));
        var x = Math.max(-28, Math.min(28, off));
        el.style.backgroundPosition = x.toFixed(1) + 'px 0';
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(applyDrift); }
    }
    if (drifters.length || driftBgs.length) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      applyDrift();
    }
  }

  /* ---------- the made-to-measure planner ---------- */
  var heightVal = document.getElementById('heightVal');
  if (heightVal) {
    var SEWING = 18000, QUEUE_DAYS = 21, LONG_BOLT = 2000;
    var height = 162;
    var fabricPrice = 16000, obiPrice = 6800;
    var festInput = document.getElementById('festDate');
    var rCloth = document.getElementById('rCloth');
    var rSize = document.getElementById('rSize');
    var rReady = document.getElementById('rReady');
    var rTotal = document.getElementById('rTotal');
    var rLongRow = document.getElementById('rLongRow');
    var okBox = document.getElementById('plannerOk');
    var warnBox = document.getElementById('plannerWarn');

    /* The cutting table, exactly as printed on this page. */
    function cutFor(h) {
      if (h <= 155) return { size: 'S', cloth: '10.8 m', long: false };
      if (h <= 165) return { size: 'M', cloth: '11.4 m', long: false };
      if (h <= 175) return { size: 'L', cloth: '12.0 m', long: false };
      return { size: 'LL', cloth: '12.6 m', long: true };
    }
    function yen(n) { return '¥' + n.toLocaleString('en-US'); }
    function fmtDate(d) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    }
    function readyDate() {
      var d = new Date();
      d.setDate(d.getDate() + QUEUE_DAYS);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    function compute() {
      var cut = cutFor(height);
      heightVal.textContent = height + ' cm';
      rCloth.textContent = cut.cloth;
      rSize.textContent = cut.size;
      rLongRow.hidden = !cut.long;
      var total = fabricPrice + SEWING + obiPrice + (cut.long ? LONG_BOLT : 0);
      rTotal.textContent = yen(total);
      var ready = readyDate();
      var readyStr = fmtDate(ready);
      rReady.textContent = readyStr;
      var fest = festInput.value ? new Date(festInput.value + 'T00:00:00') : null;
      if (fest && fest < ready) {
        okBox.classList.remove('show');
        warnBox.querySelector('p').textContent =
          'That date is inside the sewing queue. A made-to-measure yukata ordered today is ready ' +
          readyStr + ' — after the date you picked. Two honest ways round it: the same four patterns are sewn as ready sizes (S–LL) and leave the studio in 3 days, or book the cutting table now for the next festival.';
        warnBox.classList.add('show');
      } else {
        warnBox.classList.remove('show');
        okBox.querySelector('p').textContent = fest
          ? 'That works. Your yukata is ready ' + readyStr + ', ahead of your festival. Send me these same numbers from the contact page and I will hold your place in the queue for two days while you decide.'
          : 'Your yukata would be ready ' + readyStr + '. Add your festival date and I will tell you plainly whether the queue reaches it.';
        okBox.classList.add('show');
      }
    }
    document.getElementById('hMinus').addEventListener('click', function () {
      height = Math.max(130, height - 1); compute();
    });
    document.getElementById('hPlus').addEventListener('click', function () {
      height = Math.min(195, height + 1); compute();
    });
    function bindChips(id, set) {
      var box = document.getElementById(id);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        box.querySelectorAll('.chip').forEach(function (c) {
          c.classList.remove('sel'); c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('sel'); chip.setAttribute('aria-pressed', 'true');
        set(parseInt(chip.getAttribute('data-price'), 10));
        compute();
      });
    }
    bindChips('fabricChips', function (v) { fabricPrice = v; });
    bindChips('obiChips', function (v) { obiPrice = v; });
    festInput.addEventListener('change', compute);
    festInput.addEventListener('input', compute);
    compute();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      if (!name || !email) {
        (!name ? document.getElementById('fName') : document.getElementById('fEmail')).focus();
        return;
      }
      var ref = 'YK-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmLine').textContent =
        'Thank you, ' + name + '. Your letter is on the board at the studio in Demachiyanagi, and an answer will come to ' +
        email + ' within two days — a little slower in June, when the whole city remembers the festival at once.';
      form.style.display = 'none';
      var box = document.getElementById('confirmBox');
      box.classList.add('show');
      box.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
