/* ============================================================
   THE COPPER FIRKIN — brew sheet instruments
   Sound ruling: FAILS the need-test. Brewing and cellar work are
   not sound professions and nothing here teaches through audio.
   No audio anywhere on this site (see CREDITS.md).
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself always completes. Guard is narrowly filtered. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- mobile menu: the cellar book ---------------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('cellar-book');
  if (btn && panel) {
    var closeMenu = function (returnFocus) {
      panel.classList.remove('open');
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (returnFocus) btn.focus();
    };
    var openMenu = function () {
      panel.hidden = false;
      /* force reflow so the animation runs from the hidden state */
      void panel.offsetWidth;
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      });
    };
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
  }

  /* ---------------- reveals (opacity only) ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- the brew sheet ----------------
     One data model. The printed Table 1 on index.html carries the
     same figures; the verification probe reads both and asserts
     they agree. ABV = (OG - FG) x 131.25 (standard approximation).
     A firkin is 9 imperial gallons = 72 pints. Firkins filled are
     rounded DOWN: you cannot rack half a firkin.               */
  var FIRKIN_PINTS = 72;
  var BEERS = {
    bitter: {
      name: 'Stillage Bitter', style: 'Best bitter',
      og: 1.040, fg: 1.010, ibu: 32, ebc: 24,
      barrels: 5, loss: 8, price: 4.60, trade: 118,
      cellar: 'Vent with a soft peg for 24 hours, then hard peg overnight. Tap the morning it goes on. Serve at 11–13 °C, straight from the stillage — never through a sparkler so tight it scrubs the condition out.'
    },
    pale: {
      name: 'Copperline Pale', style: 'Pale ale',
      og: 1.046, fg: 1.011, ibu: 38, ebc: 14,
      barrels: 5, loss: 8, price: 4.90, trade: 126,
      cellar: 'Dry-hopped in the cask for the last two days of conditioning. Vent 24 hours before tapping; if the hop aroma has not lifted by then, it is not ready, whatever the diary says.'
    },
    porter: {
      name: 'Dark Lantern Porter', style: 'Porter',
      og: 1.052, fg: 1.014, ibu: 30, ebc: 68,
      barrels: 4.5, loss: 9, price: 5.20, trade: 134,
      cellar: 'Conditions slowly — a full week on stillage before venting. The roast malt throws a heavier sediment, so the cask is never rolled once it is stillaged.'
    },
    gold: {
      name: 'Harvest Gold', style: 'Golden ale',
      og: 1.038, fg: 1.009, ibu: 26, ebc: 10,
      barrels: 5, loss: 7, price: 4.40, trade: 112,
      cellar: 'The lightest beer in the book and the least forgiving: any haze shows. Vent, tap, and sell inside the three-day window or the hop freshness goes first.'
    },
    old: {
      name: 'Old Stillage', style: 'Old ale',
      og: 1.068, fg: 1.018, ibu: 34, ebc: 42,
      barrels: 2.5, loss: 10, price: 6.20, trade: 168,
      cellar: 'Brewed at half length and conditioned six weeks before the first firkin is vented. Sold by the half as readily as the pint — the price on the sheet is the pint price; a half is half.'
    }
  };

  function fmtG(g) { return g.toFixed(3); }
  function abv(b) { return ((b.og - b.fg) * 131.25).toFixed(1); }
  function grossPints(b) { return b.barrels * 288; } /* 1 barrel = 288 pints */
  function netPints(b) { return grossPints(b) * (1 - b.loss / 100); }
  function firkinsFilled(b) { return Math.floor(netPints(b) / FIRKIN_PINTS); }
  function money(n) { return '£' + n.toFixed(2); }

  var sheet = document.getElementById('brew-sheet');
  if (sheet) {
    var fields = {
      name: document.getElementById('bs-name'),
      sub: document.getElementById('bs-sub'),
      og: document.getElementById('bs-og'),
      fg: document.getElementById('bs-fg'),
      abv: document.getElementById('bs-abv'),
      yield: document.getElementById('bs-yield'),
      price: document.getElementById('bs-price'),
      trade: document.getElementById('bs-trade'),
      cellar: document.getElementById('bs-cellar'),
      working: document.getElementById('bs-working')
    };
    var rows = document.querySelectorAll('#brew-table tbody tr[data-beer]');
    var buttons = document.querySelectorAll('.beer-list button[data-beer]');

    var selectBeer = function (key) {
      var b = BEERS[key];
      if (!b) return;
      buttons.forEach(function (x) {
        x.setAttribute('aria-pressed', x.getAttribute('data-beer') === key ? 'true' : 'false');
      });
      rows.forEach(function (r) {
        r.classList.toggle('hl', r.getAttribute('data-beer') === key);
      });
      var gross = grossPints(b), net = netPints(b), fk = firkinsFilled(b);
      fields.name.textContent = b.name;
      fields.sub.textContent = b.style + ' · Brew sheet entry · IBU ' + b.ibu + ' · EBC ' + b.ebc + ' (descriptive units)';
      fields.og.textContent = fmtG(b.og);
      fields.fg.textContent = fmtG(b.fg);
      fields.abv.textContent = abv(b) + '% ABV';
      fields.yield.textContent = fk + ' firkins · ' + (fk * FIRKIN_PINTS).toLocaleString('en-GB') + ' pints';
      fields.price.textContent = money(b.price) + ' / pint';
      fields.trade.textContent = '£' + b.trade + ' / firkin';
      fields.cellar.textContent = b.cellar;
      fields.working.innerHTML =
        '<span class="w-k">The working, in the open</span>' +
        'ABV: (' + fmtG(b.og) + ' − ' + fmtG(b.fg) + ') × 131.25 = <strong>' + abv(b) + '%</strong><br>' +
        'Brew length: ' + b.barrels + ' barrels × 288 pints = ' + gross.toLocaleString('en-GB') + ' pints gross<br>' +
        'Losses at ' + b.loss + '% (trub, yeast crop, racking): ' + gross.toLocaleString('en-GB') + ' × ' + (1 - b.loss / 100).toFixed(2) + ' = ' + net.toLocaleString('en-GB', { maximumFractionDigits: 2 }) + ' pints<br>' +
        'Firkins filled: ' + net.toLocaleString('en-GB', { maximumFractionDigits: 2 }) + ' ÷ 72 = ' + (net / FIRKIN_PINTS).toFixed(2) + ' → <strong>' + fk + ' firkins</strong> (rounded down — you cannot rack half a firkin; the rest stays in the tank and is written in the loss column)';
    };
    buttons.forEach(function (x) {
      x.addEventListener('click', function () { selectBeer(x.getAttribute('data-beer')); });
    });
    selectBeer('bitter');
  }

  /* ---------------- the cellar calculator ----------------
     Firkins on stillage x 72 pints, over the sell-through window.
     House rule, printed on the page: a tapped cask gets 3 days.
     House trade, printed on the page: ~70 pints of cask ale on a
     weekday, ~120 on a Friday or Saturday.                     */
  var calc = document.getElementById('cellar-calc');
  if (calc) {
    var state = { firkins: 4, days: 3 };
    var outF = document.getElementById('calc-firkins');
    var outD = document.getElementById('calc-days');
    var outMain = document.getElementById('calc-main');
    var outVerdict = document.getElementById('calc-verdict');
    var render = function () {
      outF.textContent = state.firkins;
      outD.textContent = state.days;
      var total = state.firkins * FIRKIN_PINTS;
      var perDay = total / state.days;
      outMain.innerHTML =
        state.firkins + ' firkins × 72 pints = <span class="big">' + total + ' pints</span> · ' +
        total + ' ÷ ' + state.days + ' days = <span class="big">' + (Math.round(perDay * 10) / 10) + ' pints a day</span> to finish in condition.';
      var v;
      if (state.days > 3) {
        v = 'That window breaks the house rule: a tapped cask at the Copper Firkin gets 3 days, because on day four the beer has been breathing too long and it shows in the glass. Stillage fewer firkins, or plan the window across a weekend.';
        outVerdict.innerHTML = '<span class="warn">Outside the 3-day rule.</span> ' + v;
      } else if (perDay <= 70) {
        outVerdict.textContent = 'Within a weekday\u2019s trade at this house (about 70 pints of cask ale a day). The cellar book would stillage this without a second thought.';
      } else if (perDay <= 120) {
        outVerdict.textContent = 'That needs a weekend\u2019s trade (about 120 pints of cask ale on a Friday or Saturday here). Time the tapping for Thursday night, not Monday morning.';
      } else {
        outVerdict.innerHTML = '<span class="warn">Too much beer.</span> At this house\u2019s trade the last firkin would still be pouring on day ' + state.days + ' at ' + (Math.round(perDay * 10) / 10) + ' pints a day — past its best. Stillage fewer firkins.';
      }
    };
    calc.querySelectorAll('button[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var field = b.getAttribute('data-field');
        var step = parseInt(b.getAttribute('data-step'), 10);
        var min = field === 'firkins' ? 1 : 2;
        var max = field === 'firkins' ? 12 : 5;
        state[field] = Math.min(max, Math.max(min, state[field] + step));
        render();
      });
    });
    render();
  }

  /* ---------------- enquiry form ---------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('f-type');
    if (typeSel && params.get('type')) {
      var wanted = params.get('type');
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    var confirmBox = document.getElementById('form-confirm');
    var required = [
      { id: 'f-name', err: 'err-name' },
      { id: 'f-email', err: 'err-email' },
      { id: 'f-type', err: 'err-type' },
      { id: 'f-msg', err: 'err-msg' }
    ];
    var validate = function () {
      var firstBad = null, badCount = 0;
      required.forEach(function (r) {
        var el = document.getElementById(r.id);
        var errEl = document.getElementById(r.err);
        var bad = !el.value || !el.value.trim();
        if (!bad && r.id === 'f-email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (errEl) errEl.classList.toggle('show', bad);
        if (bad) { badCount++; if (!firstBad) firstBad = el; }
      });
      return { ok: badCount === 0, count: badCount, first: firstBad };
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validate();
      if (!v.ok) { if (v.first) v.first.focus(); return; }
      var ref = 'SW-2026-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('confirm-ref').textContent = ref;
      confirmBox.hidden = false;
      form.hidden = true;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    var again = document.getElementById('send-another');
    if (again) again.addEventListener('click', function () {
      form.reset();
      required.forEach(function (r) {
        var el = document.getElementById(r.id);
        el.setAttribute('aria-invalid', 'false');
        var errEl = document.getElementById(r.err);
        if (errEl) errEl.classList.remove('show');
      });
      confirmBox.hidden = true;
      form.hidden = false;
      document.getElementById('f-name').focus();
    });
  }

  /* footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
