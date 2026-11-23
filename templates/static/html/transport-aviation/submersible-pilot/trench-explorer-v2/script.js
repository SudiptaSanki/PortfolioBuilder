/* Iversen Submersible Operations — site script.
   Contents: the log-panel menu, reveal-on-scroll, the Mission Profile
   Planner (reads its vehicle-class figures from the table printed on
   the page, so the arithmetic can be checked against it), the charter
   estimator (reads its rates from the printed rate card), and the
   demonstration enquiry form.

   SOUND RULING (need-test): NONE. The stub's sonar ping on hover was
   removed and not replaced. A submersible pilot's trade is not sound,
   nothing on this site teaches through audio, and a ping that fires
   when a cursor crosses a headline is decoration with a startle in
   it. The site is silent by design; the ruling is printed in the
   footer. No AudioContext exists anywhere in this file. */

/* Cross-document view transitions can reject their promise when a
   navigation interrupts the animation; swallow only that rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && (r.name === 'InvalidStateError' ||
      (typeof r.message === 'string' && r.message.indexOf('Transition was aborted') !== -1))) {
    e.preventDefault();
  }
});

/* ---------- Log panel (mobile menu) ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('logPanel');
  if (!btn || !panel) return;
  function setOpen(open) {
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var first = panel.querySelector('a');
      if (first) requestAnimationFrame(function () { first.focus({ preventScroll: true }); });
    }
  }
  btn.addEventListener('click', function () {
    setOpen(!panel.classList.contains('open'));
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (panel.classList.contains('open') && !e.target.closest('.masthead')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
})();

/* ---------- Reveal on scroll (opacity only on live elements) ---------- */
(function () {
  var els = document.querySelectorAll('.rev');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function r1(x) { return Math.round(x * 10) / 10; }
function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
function fmt1(x) {
  var parts = r1(x).toFixed(1).split('.');
  return Number(parts[0]).toLocaleString('en-US') + '.' + parts[1];
}
function fmtHM(mins) {
  var t = Math.round(mins);
  var h = Math.floor(t / 60), m = t % 60;
  return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
}
function fmtUSD(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

/* ---------- Mission Profile Planner ---------- */
(function () {
  var root = document.getElementById('planner');
  if (!root) return;
  function pv(id) { return parseFloat(document.getElementById(id).getAttribute('data-value')); }
  var DESC = pv('ctDesc'), ASC = pv('ctAsc'),
      LOADED = pv('ctLoaded'), RES_PCT = pv('ctReserve');
  var RESERVE = LOADED * RES_PCT / 100;         /* 240 min */
  var USABLE = LOADED - RESERVE;                /* 720 min */

  var state = { depth: 4500, bottom: 240 };
  var depthVal = document.getElementById('depthVal');
  var bottomVal = document.getElementById('bottomVal');
  var chips = root.querySelectorAll('.chip[data-depth]');

  function compute() {
    var d = state.depth, b = state.bottom;
    var down = r1(d / DESC), up = r1(d / ASC);
    var total = r1(down + b + up);
    var margin = r1(USABLE - total);
    return { down: down, up: up, total: total, margin: margin };
  }

  function render() {
    var c = compute();
    depthVal.innerHTML = fmtInt(state.depth) + '<small>m</small>';
    bottomVal.innerHTML = fmtHM(state.bottom);
    chips.forEach(function (ch) {
      ch.setAttribute('aria-pressed',
        parseInt(ch.getAttribute('data-depth'), 10) === state.depth ? 'true' : 'false');
    });
    document.getElementById('lnDown').textContent = fmt1(c.down) + ' min';
    document.getElementById('lnDownA').textContent =
      fmtInt(state.depth) + ' m ÷ ' + DESC + ' m/min';
    document.getElementById('lnUp').textContent = fmt1(c.up) + ' min';
    document.getElementById('lnUpA').textContent =
      fmtInt(state.depth) + ' m ÷ ' + ASC + ' m/min';
    document.getElementById('lnBottom').textContent = fmt1(state.bottom) + ' min';
    document.getElementById('lnTotal').textContent =
      fmt1(c.total) + ' min · ' + fmtHM(c.total);
    document.getElementById('lnTotalA').textContent =
      fmt1(c.down) + ' + ' + fmt1(state.bottom) + ' + ' + fmt1(c.up);

    /* profile chart */
    var X0 = 70, X1 = 610, Y0 = 34, YMAX = 260;
    var yD = Y0 + (state.depth / 6500) * (YMAX - Y0);
    var x1 = X0 + (c.down / c.total) * (X1 - X0);
    var x2 = X0 + ((c.down + state.bottom) / c.total) * (X1 - X0);
    var pts = X0 + ',' + Y0 + ' ' + x1.toFixed(1) + ',' + yD.toFixed(1) + ' ' +
              x2.toFixed(1) + ',' + yD.toFixed(1) + ' ' + X1 + ',' + Y0;
    var line = document.getElementById('profLine');
    line.setAttribute('points', pts);
    line.setAttribute('data-depth-y', yD.toFixed(1));
    var bot = document.getElementById('profBottom');
    bot.setAttribute('x1', x1.toFixed(1)); bot.setAttribute('x2', x2.toFixed(1));
    bot.setAttribute('y1', yD.toFixed(1)); bot.setAttribute('y2', yD.toFixed(1));
    var lab = document.getElementById('profDepthLab');
    lab.setAttribute('x', ((x1 + x2) / 2).toFixed(1));
    lab.setAttribute('y', (yD - 8).toFixed(1));
    lab.textContent = fmtInt(state.depth) + ' m — bottom ' + fmtHM(state.bottom);

    /* budget bar */
    var bar = document.getElementById('budgetBar');
    var usedPct = Math.min(c.total, LOADED) / LOADED * 100;
    document.getElementById('segUsed').style.width = usedPct.toFixed(1) + '%';
    document.getElementById('segMargin').style.width =
      (c.margin > 0 ? (c.margin / LOADED * 100).toFixed(1) : '0') + '%';
    document.getElementById('segReserve').style.width =
      (Math.max(LOADED - c.total - Math.max(c.margin, 0), 0) / LOADED * 100).toFixed(1) + '%';
    bar.classList.toggle('breach', c.margin < 0);

    /* verdict */
    var v = document.getElementById('verdict');
    var tag = document.getElementById('vTag'), txt = document.getElementById('vText');
    if (c.margin >= 0) {
      v.classList.remove('breach');
      tag.textContent = 'Verdict — within budget';
      txt.innerHTML = 'Total submerged <b>' + fmt1(c.total) + ' min</b> against a usable ' +
        'budget of <b>' + fmtInt(USABLE) + ' min</b> (loaded ' + fmtInt(LOADED) +
        ' min less the ' + RES_PCT + '% reserve). The dive surfaces with <b>' +
        fmt1(c.margin) + ' min (' + fmtHM(c.margin) + ')</b> of margin untouched above ' +
        'the reserve. This profile can be flown as planned.';
    } else {
      var over = r1(-c.margin);
      var maxBottom = r1(USABLE - c.down - c.up);
      v.classList.add('breach');
      tag.textContent = 'Verdict — reserve breached';
      txt.innerHTML = 'Total submerged <b>' + fmt1(c.total) + ' min</b> exceeds the usable ' +
        'budget of <b>' + fmtInt(USABLE) + ' min</b> by <b>' + fmt1(over) + ' min</b>. ' +
        'The reserve is not science time and is never planned against, so the bottom ' +
        'time must come down by <b>' + fmt1(over) + ' min</b> — to at most <b>' +
        fmt1(maxBottom) + ' min (' + fmtHM(maxBottom) + ')</b> at this depth — or the ' +
        'dive does not fly.';
    }
  }

  root.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var which = btn.getAttribute('data-step');
      var delta = parseInt(btn.getAttribute('data-delta'), 10);
      if (which === 'depth') {
        state.depth = Math.min(6500, Math.max(500, state.depth + delta));
      } else {
        state.bottom = Math.min(600, Math.max(60, state.bottom + delta));
      }
      render();
    });
  });
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      state.depth = parseInt(ch.getAttribute('data-depth'), 10);
      render();
    });
  });
  render();
})();

/* ---------- Charter estimator ---------- */
(function () {
  var root = document.getElementById('estimator');
  if (!root) return;
  var SPREAD = parseFloat(document.getElementById('rateSpread').getAttribute('data-value'));
  var PLAN = parseFloat(document.getElementById('ratePlan').getAttribute('data-value'));
  var state = { days: 10, mob: 60000, plan: 4 };
  var mobChips = root.querySelectorAll('.chip[data-mob]');

  function render() {
    document.getElementById('estDaysVal').textContent = state.days;
    document.getElementById('estPlanVal').textContent = state.plan;
    mobChips.forEach(function (ch) {
      ch.setAttribute('aria-pressed',
        parseFloat(ch.getAttribute('data-mob')) === state.mob ? 'true' : 'false');
    });
    var d = state.days * SPREAD, m = state.mob, p = state.plan * PLAN;
    document.getElementById('estDaysLine').textContent = fmtUSD(d);
    document.getElementById('estMobLine').textContent = fmtUSD(m);
    document.getElementById('estPlanLine').textContent = fmtUSD(p);
    document.getElementById('estTotal').textContent = fmtUSD(d + m + p);
  }
  root.querySelectorAll('[data-est-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var which = btn.getAttribute('data-est-step');
      var delta = parseInt(btn.getAttribute('data-delta'), 10);
      if (which === 'days') state.days = Math.min(30, Math.max(3, state.days + delta));
      else state.plan = Math.min(10, Math.max(0, state.plan + delta));
      render();
    });
  });
  mobChips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      state.mob = parseFloat(ch.getAttribute('data-mob'));
      render();
    });
  });
  render();
})();

/* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var conf = document.getElementById('confirmation');
  function field(id) { return document.getElementById(id); }
  function wrap(el) { return el.closest('.field'); }
  function mark(el, bad) {
    wrap(el).classList.toggle('invalid', bad);
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = field('fName'), email = field('fEmail'),
        type = field('fType'), msg = field('fMsg');
    var ok = true;
    ok = mark(name, name.value.trim().length < 2) && ok;
    ok = mark(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
    ok = mark(msg, msg.value.trim().length < 10) && ok;
    if (!ok) {
      var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea, .field.invalid select');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'ISO-2026-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('confRef').textContent = ref;
    document.getElementById('confEcho').textContent =
      'Logged for ' + name.value.trim() + ' — ' + type.options[type.selectedIndex].text +
      '. Expect a reply within two working days when the practice is ashore.';
    form.hidden = true;
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus({ preventScroll: false });
  });
  ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
    var el = field(id);
    el.addEventListener('input', function () { mark(el, false); });
  });
})();
