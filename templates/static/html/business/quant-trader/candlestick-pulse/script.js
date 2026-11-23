/* Candlestick Pulse — interactions.
   Sound ruling: this site makes no sound. A trading educator's
   profession is not sound and no interaction here teaches through
   audio; the stub's trade beep was decoration and was removed. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces an unhandled InvalidStateError rejection;
     the navigation itself completes. Swallow only that rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), panel = $('#mobilePanel');
  if (menuBtn && panel) {
    var closeMenu = function (refocus) {
      menuBtn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(false); return; }
      menuBtn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      });
    });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closeMenu(true);
    });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
  }

  /* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
  var rv = $$('.rv');
  if (rv.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- position-size calculator ---------- */
  var calcForm = $('#calcForm');
  if (calcForm) {
    var acc = $('#calcAccount'), risk = $('#calcRisk'),
        entry = $('#calcEntry'), stop = $('#calcStop'),
        bLong = $('#dirLong'), bShort = $('#dirShort'),
        err = $('#calcError'), warn = $('#calcWarn'),
        wRisk = $('#wRisk'), wDist = $('#wDist'), wRaw = $('#wRaw'), wRound = $('#wRound'),
        outSize = $('#outSize'), outLoss = $('#outLoss');
    var direction = 'long';

    var money = function (n) {
      var s = (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      return '£' + s;
    };
    var num = function (n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    };

    function setDir(d) {
      direction = d;
      bLong.setAttribute('aria-pressed', d === 'long' ? 'true' : 'false');
      bShort.setAttribute('aria-pressed', d === 'short' ? 'true' : 'false');
      compute();
    }
    bLong.addEventListener('click', function () { setDir('long'); });
    bShort.addEventListener('click', function () { setDir('short'); });

    function compute() {
      var a = parseFloat(acc.value), r = parseFloat(risk.value),
          e = parseFloat(entry.value), s = parseFloat(stop.value);
      err.hidden = true; warn.hidden = true;
      if (!(a > 0) || !(e > 0) || !(s > 0) || isNaN(r)) {
        err.textContent = 'Fill in an account size, an entry and an invalidation price — all above zero — and the working will follow.';
        err.hidden = false;
        outSize.textContent = '—'; outLoss.textContent = '—';
        return;
      }
      var dist = Math.abs(e - s);
      if (dist === 0) {
        err.textContent = 'Entry and invalidation are the same price, so the distance is zero and the division has no answer. An idea with no invalidation level is not a plan — pick the price where the idea is wrong.';
        err.hidden = false;
        outSize.textContent = '—'; outLoss.textContent = '—';
        return;
      }
      if (direction === 'long' && s > e) {
        warn.textContent = 'Check the direction: for a long idea the invalidation normally sits below the entry. The arithmetic below uses the distance either way.';
        warn.hidden = false;
      }
      if (direction === 'short' && s < e) {
        warn.textContent = 'Check the direction: for a short idea the invalidation normally sits above the entry. The arithmetic below uses the distance either way.';
        warn.hidden = false;
      }
      var budget = a * r / 100;
      var raw = budget / dist;
      var size = Math.floor(raw);
      var planned = size * dist;
      wRisk.innerHTML = money(a) + ' × ' + r + '% = <strong>' + money(budget) + '</strong>';
      wDist.innerHTML = '|' + num(e, 2) + ' − ' + num(s, 2) + '| = <strong>' + num(dist, 2) + ' points</strong>';
      wRaw.innerHTML = money(budget) + ' ÷ ' + num(dist, 2) + ' = <strong>' + num(raw, 2) + ' units</strong>';
      if (size === 0) {
        wRound.innerHTML = '<strong>0 units</strong> — one unit would risk ' + money(dist) + ', more than the whole budget';
        outSize.textContent = '0 units';
        outLoss.textContent = money(0);
        warn.textContent = 'The correct size here is no trade: at this distance, a single unit risks more than the budget allows. Widening the budget to force the trade is how accounts end.';
        warn.hidden = false;
        return;
      }
      wRound.innerHTML = '<strong>' + size + ' units</strong> — planned loss ' + size + ' × ' + num(dist, 2) + ' = ' + money(planned) + ' of the ' + money(budget) + ' budget';
      outSize.textContent = size + (size === 1 ? ' unit' : ' units');
      outLoss.textContent = money(planned);
    }
    [acc, entry, stop].forEach(function (el) { el.addEventListener('input', compute); });
    risk.addEventListener('change', compute);
    compute();
  }

  /* ---------- candle anatomy explorer ---------- */
  var shapeBtns = $$('.shape-btn');
  if (shapeBtns.length) {
    shapeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-shape');
        shapeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        $$('.sheet').forEach(function (sh) { sh.hidden = sh.id !== 'sheet-' + target; });
      });
    });
  }

  /* ---------- contact form (demonstration — transmits nothing) ---------- */
  var form = $('#enquiryForm');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var interest = $('#fInterest');
    var wanted = params.get('interest');
    if (interest && wanted) {
      $$('option', interest).forEach(function (o) { if (o.value === wanted) interest.value = wanted; });
    }
    var fields = [
      { el: $('#fName'), err: $('#eName'), ok: function (v) { return v.trim().length > 0; } },
      { el: $('#fEmail'), err: $('#eEmail'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      { el: $('#fMsg'), err: $('#eMsg'), ok: function (v) { return v.trim().length > 0; } }
    ];
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        var valid = f.ok(f.el.value);
        f.err.hidden = valid;
        f.el.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid && !firstBad) firstBad = f.el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var seed = ($('#fName').value + $('#fEmail').value).split('').reduce(function (h, ch) { return (h * 31 + ch.charCodeAt(0)) % 9000; }, 0);
      $('#confirmRef').textContent = 'CP-2026-' + (1000 + seed);
      form.hidden = true;
      var box = $('#confirmBox');
      box.hidden = false;
      box.focus();
    });
    var again = $('#againBtn');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        fields.forEach(function (f) { f.err.hidden = true; f.el.removeAttribute('aria-invalid'); });
        $('#confirmBox').hidden = true;
        form.hidden = false;
        $('#fName').focus();
      });
    }
  }
})();
