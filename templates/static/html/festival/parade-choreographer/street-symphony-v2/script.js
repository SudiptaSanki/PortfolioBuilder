/* Street Symphony — Ruiz Movimiento.
   No audio anywhere: parade music belongs to the bands (see CREDITS.md).
   Tools parse their numbers from the printed tables on the page. */
(function () {
  'use strict';

  /* Cross-document view transitions abort as unhandled rejections in
     Chrome when a navigation is interrupted; swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* --- mobile menu: the running order panel ------------------------------- */
  var menuBtn = document.getElementById('menu-btn');
  var panel = document.getElementById('menu-panel');
  if (menuBtn && panel) {
    var closeMenu = function () {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        var first = panel.querySelector('a');
        if (first) requestAnimationFrame(function () { first.focus(); });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  /* --- the one honestly-live element: days to the printed parade date ----- */
  var daysEl = document.getElementById('days-count');
  if (daysEl) {
    var target = new Date(2027, 1, 14); /* 14 February 2027, printed on the page */
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var days = Math.round((target - today) / 86400000);
    if (days > 0) {
      daysEl.textContent = days;
    } else if (days === 0) {
      daysEl.textContent = '0';
      var lab = document.getElementById('days-label');
      if (lab) lab.textContent = 'Today — the parade steps off';
    } else {
      daysEl.textContent = '—';
      var lab2 = document.getElementById('days-label');
      if (lab2) lab2.textContent = 'Stepped off — the next date goes on this sheet when it is signed';
    }
  }

  var fmtMin = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var fmtInt = function (v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var fmtEur = function (v) { return '€' + fmtInt(v); };

  /* --- Route Timing Planner -------------------------------------------------
     Numbers are read from the printed tables: block lengths live on the
     printed block rows (data-len), the gap rule and paces on their buttons,
     the route length and closure on the printed route sheet (data attrs). */
  var planner = document.getElementById('planner');
  if (planner) {
    var routeLen = parseInt(planner.getAttribute('data-route'), 10);       /* 2400 */
    var closure = parseInt(planner.getAttribute('data-closure'), 10);      /* 105 */
    var gap = 15, pace = 45;
    var order = []; /* block ids in tap order */

    var blockBtns = planner.querySelectorAll('.block');
    var gapBtns = planner.querySelectorAll('[data-gap]');
    var paceBtns = planner.querySelectorAll('[data-pace]');
    var orderList = document.getElementById('order-list');
    var wBlocks = document.getElementById('w-blocks');
    var wGaps = document.getElementById('w-gaps');
    var wLength = document.getElementById('w-length');
    var wPass = document.getElementById('w-pass');
    var wRoute = document.getElementById('w-route');
    var oLength = document.getElementById('o-length');
    var oPass = document.getElementById('o-pass');
    var oRoute = document.getElementById('o-route');
    var verdict = document.getElementById('p-verdict');

    function blockData(btn) {
      return {
        id: btn.getAttribute('data-id'),
        name: btn.querySelector('.bk-name').textContent,
        len: parseInt(btn.getAttribute('data-len'), 10)
      };
    }

    function render() {
      var sum = 0, parts = [];
      order.forEach(function (b) { sum += b.len; parts.push(b.len); });
      var n = order.length;
      var gapsTotal = n > 1 ? gap * (n - 1) : 0;
      var length = sum + gapsTotal;
      var pass = length / pace;
      var route = (routeLen + length) / pace;

      orderList.innerHTML = '';
      if (!n) {
        var li = document.createElement('li');
        li.textContent = 'No blocks yet — tap the printed block list to build the running order.';
        orderList.appendChild(li);
      }
      order.forEach(function (b, i) {
        var li2 = document.createElement('li');
        li2.textContent = (i + 1) + '. ' + b.name + ' — ' + b.len + ' m';
        orderList.appendChild(li2);
      });

      wBlocks.textContent = n ? parts.join(' + ') + ' = ' + fmtInt(sum) + ' m' : '0 m';
      wGaps.textContent = n > 1 ? (n - 1) + ' × ' + gap + ' m = ' + fmtInt(gapsTotal) + ' m' : '0 m';
      wLength.textContent = fmtInt(sum) + ' + ' + fmtInt(gapsTotal) + ' = ' + fmtInt(length) + ' m';
      wPass.textContent = fmtInt(length) + ' ÷ ' + pace + ' = ' + fmtMin(pass) + ' min';
      wRoute.textContent = '(' + fmtInt(routeLen) + ' + ' + fmtInt(length) + ') ÷ ' + pace + ' = ' + fmtMin(route) + ' min';

      oLength.textContent = fmtInt(length) + ' m';
      oPass.textContent = fmtMin(pass) + ' min';
      oRoute.textContent = fmtMin(route) + ' min';

      if (!n) {
        verdict.className = 'verdict';
        verdict.textContent = 'Build the running order: tap blocks from the printed list. The verdict appears here, against the printed closure window of ' + closure + ' minutes.';
      } else if (route <= closure) {
        verdict.className = 'verdict';
        verdict.textContent = 'Inside the closure — this running order clears the route in ' + fmtMin(route) + ' minutes, ' + fmtMin(closure - route) + ' minutes inside the ' + closure + '-minute window.';
      } else {
        verdict.className = 'verdict over';
        verdict.textContent = 'This running order overruns the closure by ' + fmtMin(route - closure) + ' minutes (' + fmtMin(route) + ' against a ' + closure + '-minute window) — cut a block or tighten gaps to the printed minimum of 8 m.';
      }
    }

    blockBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = blockData(btn);
        var idx = order.findIndex(function (b) { return b.id === d.id; });
        if (idx >= 0) {
          order.splice(idx, 1);
          btn.setAttribute('aria-pressed', 'false');
          btn.querySelector('.bk-state').textContent = 'Add';
        } else {
          order.push(d);
          btn.setAttribute('aria-pressed', 'true');
          btn.querySelector('.bk-state').textContent = 'In order';
        }
        render();
      });
    });
    gapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        gap = parseInt(btn.getAttribute('data-gap'), 10);
        gapBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        render();
      });
    });
    paceBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        pace = parseInt(btn.getAttribute('data-pace'), 10);
        paceBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        render();
      });
    });
    var resetBtn = document.getElementById('p-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      order = [];
      blockBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
        b.querySelector('.bk-state').textContent = 'Add';
      });
      render();
    });
    render();
  }

  /* --- Booking estimator ------------------------------------------------------
     Rates are parsed from the printed fee table (data-rate on each row). */
  var est = document.getElementById('estimator');
  if (est) {
    var rate = function (id) {
      var el = document.getElementById(id);
      return el ? parseInt(el.getAttribute('data-rate'), 10) : 0;
    };
    var R = {
      base: rate('fee-base'),       /* 2400, covers up to 6 blocks */
      extra: rate('fee-extra'),     /* 180 per block beyond 6 */
      rehearsal: rate('fee-rehearsal'), /* 450 per day */
      marshal: rate('fee-marshal'), /* 300 per session */
      night: rate('fee-night')      /* 600 flat */
    };
    var S = { blocks: 8, rehearsal: 2, marshal: 1, night: false };

    function stepper(id, key, min, max) {
      var box = document.getElementById(id);
      if (!box) return;
      var val = box.querySelector('.st-v');
      box.querySelector('[data-d="-1"]').addEventListener('click', function () {
        S[key] = Math.max(min, S[key] - 1); val.textContent = S[key]; renderEst();
      });
      box.querySelector('[data-d="1"]').addEventListener('click', function () {
        S[key] = Math.min(max, S[key] + 1); val.textContent = S[key]; renderEst();
      });
    }
    stepper('e-blocks', 'blocks', 1, 14);
    stepper('e-rehearsal', 'rehearsal', 0, 6);
    stepper('e-marshal', 'marshal', 0, 4);

    var nightBtn = document.getElementById('e-night');
    if (nightBtn) nightBtn.addEventListener('click', function () {
      S.night = !S.night;
      nightBtn.setAttribute('aria-pressed', String(S.night));
      nightBtn.textContent = S.night ? 'Night parade: yes' : 'Night parade: no';
      renderEst();
    });

    function renderEst() {
      var extraBlocks = Math.max(0, S.blocks - 6);
      var vBase = R.base;
      var vExtra = extraBlocks * R.extra;
      var vReh = S.rehearsal * R.rehearsal;
      var vMar = S.marshal * R.marshal;
      var vNight = S.night ? R.night : 0;
      document.getElementById('e-base-v').textContent = fmtEur(vBase);
      document.getElementById('e-extra-v').textContent = extraBlocks ? fmtEur(vExtra) + ' (' + extraBlocks + ' × ' + fmtEur(R.extra) + ')' : '—';
      document.getElementById('e-reh-v').textContent = S.rehearsal ? fmtEur(vReh) + ' (' + S.rehearsal + ' × ' + fmtEur(R.rehearsal) + ')' : '—';
      document.getElementById('e-mar-v').textContent = S.marshal ? fmtEur(vMar) + ' (' + S.marshal + ' × ' + fmtEur(R.marshal) + ')' : '—';
      document.getElementById('e-night-v').textContent = S.night ? fmtEur(vNight) : '—';
      document.getElementById('e-total').textContent = fmtEur(vBase + vExtra + vReh + vMar + vNight);
    }
    renderEst();
  }

  /* --- enquiry form (demonstration — nothing is transmitted) ---------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      ['f-name', 'f-email', 'f-parade', 'f-date'].forEach(function (id) {
        var input = document.getElementById(id);
        var field = input.closest('.field');
        var ok = input.value.trim().length > 0;
        if (id === 'f-email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        field.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      var ref = 'SS-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirm-ref').textContent = ref;
      document.getElementById('confirm').style.display = 'block';
      form.reset();
      document.getElementById('confirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    ['f-name', 'f-email', 'f-parade', 'f-date'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () {
        input.closest('.field').classList.remove('invalid');
      });
    });
  }
})();
