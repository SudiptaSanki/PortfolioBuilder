/* mughal-miniature — menu, clip reveal, commission planner, contact form. */
(function () {
  'use strict';

  /* View-transition abort guard: an aborted CSS view transition surfaces as
     an unhandled rejection; swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  if (btn && panel) {
    var close = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        close();
        btn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
  }

  /* ---------- clip reveal ----------
     Position-check on scroll, NOT IntersectionObserver: an element clipped
     to zero by clip-path reports zero intersection with itself, so IO never
     fires on it (proven on temple-emerald and malai-string). Rect checks are
     immune — clip-path does not change the layout box. */
  var rvEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvEls.length) {
    if (reduced) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var ticking = false;
      var checkRv = function () {
        ticking = false;
        var vh = window.innerHeight;
        rvEls.forEach(function (el) {
          if (el.classList.contains('in')) return;
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.9 && r.bottom > 0) el.classList.add('in');
        });
      };
      var onScroll = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(checkRv); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      checkRv();
      /* Safety: never leave a section masked. */
      setTimeout(function () {
        rvEls.forEach(function (el) { el.classList.add('in'); });
      }, 4000);
    }
  }

  /* ---------- commission planner (index only) ---------- */
  var fmtTable = document.getElementById('formatTable');
  if (fmtTable) {
    var goldTable = document.getElementById('goldTable');
    var formats = {}, golds = {}, figFee = 6500;
    fmtTable.querySelectorAll('tbody tr').forEach(function (tr) {
      formats[tr.dataset.key] = { price: +tr.dataset.price, weeks: +tr.dataset.weeks };
    });
    goldTable.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.dataset.key === 'fig') { figFee = +tr.dataset.fee; return; }
      golds[tr.dataset.key] = { fee: +tr.dataset.fee, weeks: +tr.dataset.weeks };
    });

    var state = { format: 'standard', gold: 'details', figures: 4, deadline: 12 };
    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

    var figOut = document.getElementById('figOut');
    var dlOut = document.getElementById('dlOut');
    var outPrice = document.getElementById('outPrice');
    var outWeeks = document.getElementById('outWeeks');
    var outDeposit = document.getElementById('outDeposit');
    var outWarn = document.getElementById('outWarn');

    function weeksFor(fmtKey, figures, goldKey) {
      var extra = Math.max(0, figures - 2);
      return formats[fmtKey].weeks + Math.ceil(extra / 2) + golds[goldKey].weeks;
    }

    function render() {
      var f = formats[state.format], g = golds[state.gold];
      var extra = Math.max(0, state.figures - 2);
      var price = f.price + extra * figFee + g.fee;
      var weeks = weeksFor(state.format, state.figures, state.gold);
      figOut.textContent = state.figures;
      dlOut.textContent = state.deadline;
      outPrice.textContent = inr(price);
      outWeeks.textContent = weeks + (weeks === 1 ? ' week' : ' weeks');
      outDeposit.textContent = inr(Math.round(price / 2));

      if (state.deadline < weeks) {
        /* Honest state: find the largest smaller format that fits the deadline. */
        var order = ['court', 'standard', 'small', 'postcard'];
        var fit = null;
        for (var i = order.indexOf(state.format) + 1; i < order.length; i++) {
          if (weeksFor(order[i], state.figures, state.gold) <= state.deadline) { fit = order[i]; break; }
        }
        var fitName = { postcard: 'postcard folio', small: 'small folio', standard: 'standard folio', court: 'court folio' };
        if (fit) {
          outWarn.innerHTML = '<b>That date is shorter than the painting.</b> This folio needs <b>' +
            weeks + ' weeks</b> at the bench; you have ' + state.deadline + '. The same scene on a ' +
            fitName[fit] + ' would fit your date — or keep the format and let the deadline move. I will not thin the wasli, skip the drying, or paint a face in a hurry to meet a calendar.';
        } else {
          outWarn.innerHTML = '<b>That date is shorter than the painting.</b> This folio needs <b>' +
            weeks + ' weeks</b> at the bench; you have ' + state.deadline + ', and no smaller format with this many figures fits either. The honest alternative: a hand-finished print of an existing folio — printed, then retouched by hand in pigment and gold — ready in <b>2 weeks</b>, from <b>₹7,500</b>. Or let the deadline move; the painting will not be hurried.';
        }
        outWarn.hidden = false;
      } else {
        outWarn.hidden = true;
      }
    }

    function chipGroup(id, key) {
      var box = document.getElementById(id);
      box.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        box.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state[key] = chip.dataset.key;
        render();
      });
    }
    chipGroup('formatChips', 'format');
    chipGroup('goldChips', 'gold');

    document.getElementById('figMinus').addEventListener('click', function () {
      if (state.figures > 0) { state.figures--; render(); }
    });
    document.getElementById('figPlus').addEventListener('click', function () {
      if (state.figures < 12) { state.figures++; render(); }
    });
    document.getElementById('dlMinus').addEventListener('click', function () {
      if (state.deadline > 1) { state.deadline--; render(); }
    });
    document.getElementById('dlPlus').addEventListener('click', function () {
      if (state.deadline < 30) { state.deadline++; render(); }
    });

    render();
  }

  /* ---------- contact form (contact only) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cf-name');
      var email = document.getElementById('cf-email');
      var msg = document.getElementById('cf-msg');
      var kind = document.getElementById('cf-kind');
      if (!name.value.trim()) { name.focus(); return; }
      if (!email.value.trim() || email.value.indexOf('@') < 1) { email.focus(); return; }
      if (!msg.value.trim()) { msg.focus(); return; }
      var ref = 'MM-2026-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirmRef').textContent = ref;
      var kindText = {
        commission: 'A commission begins with the drawing — expect my questions about the scene in the reply.',
        folio: 'I will confirm the folio is still on the table and arrange its journey to you.',
        workshop: 'I will confirm your seat and send what to bring (nothing — materials are waiting).',
        other: 'I will reply within three days.'
      };
      document.getElementById('confirmText').textContent =
        'Thank you, ' + name.value.trim().split(' ')[0] + '. ' + (kindText[kind.value] || kindText.other);
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      form.hidden = true;
      box.focus();
    });
  }
})();
