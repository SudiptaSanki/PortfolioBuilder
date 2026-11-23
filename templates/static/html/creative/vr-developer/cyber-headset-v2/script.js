/* RICCI/FRAME — site script
   Menu · HUD parallax (hero only) · Frame Budget Planner · Booking estimator ·
   Enquiry form. No audio anywhere, by printed ruling. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled InvalidStateError rejection.
     Swallow only that exact rejection; the navigation itself completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- system menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var sysPanel = document.getElementById('sysPanel');
  if (menuBtn && sysPanel) {
    var closeMenu = function (refocus) {
      sysPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = sysPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        /* Focus after the panel becomes visible — focusing while it is
           still visibility:hidden is a silent no-op. */
        requestAnimationFrame(function () {
          var first = sysPanel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sysPanel.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', function (e) {
      if (sysPanel.classList.contains('open') &&
          !sysPanel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closeMenu(false);
      }
    });
  }

  /* ---------- HUD parallax: readout layer drifts a few px against the
     scene, inside the hero only. Reduced motion / touch / small screens:
     stillness. ---------- */
  var stage = document.getElementById('vpStage');
  var hud = document.getElementById('hudLayer');
  if (stage && hud && !reducedMotion.matches &&
      !window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 900) {
    var ticking = false;
    var updateHud = function () {
      ticking = false;
      var r = stage.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) { hud.style.transform = ''; return; }
      var prog = (vh - r.top) / (vh + r.height);
      var y = Math.max(-6, Math.min(6, (prog - 0.5) * 12));
      hud.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateHud); }
    }, { passive: true });
    updateHud();
  }

  /* ---------- helpers ---------- */
  function fmtMs(tenths) { return (tenths / 10).toFixed(1) + ' ms'; }
  function fmtEur(n) { return '\u20AC' + n.toLocaleString('en-US'); }

  /* ---------- Frame Budget Planner (Table B1) ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var BUDGET = 111; /* tenths of a ms: 11.1 ms at 90 fps */
    var RESERVE = 8;  /* 0.8 ms, always charged */
    var ORDER = ['rendering', 'physics', 'ai', 'audio', 'tracking'];
    var SYSNAMES = { rendering: 'Rendering', physics: 'Physics', ai: 'AI', audio: 'Audio', tracking: 'Tracking' };
    var groups = {};
    planner.querySelectorAll('button.opt').forEach(function (btn) {
      var sys = btn.getAttribute('data-system');
      if (!groups[sys]) groups[sys] = [];
      groups[sys].push(btn);
      btn.addEventListener('click', function () {
        groups[sys].forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        compute();
      });
    });

    function selected(sys) {
      var found = null;
      groups[sys].forEach(function (b) {
        if (b.getAttribute('aria-pressed') === 'true') found = b;
      });
      return found;
    }

    var workings = document.getElementById('workings');
    var fpsOut = document.getElementById('fpsOut');
    var verdict = document.getElementById('verdict');

    function compute() {
      var total = RESERVE;
      var lines = '';
      var chosen = {};
      ORDER.forEach(function (sys) {
        var btn = selected(sys);
        var cost = parseInt(btn.getAttribute('data-cost'), 10);
        chosen[sys] = { btn: btn, cost: cost };
        total += cost;
        lines += '<li><span>' + SYSNAMES[sys] + ' — ' + btn.getAttribute('data-label') + '</span><b>' + fmtMs(cost) + '</b></li>';
      });
      lines += '<li><span>Reserve — compositor &amp; OS (always charged)</span><b>' + fmtMs(RESERVE) + '</b></li>';
      lines += '<li class="total"><span>Total frame time</span><b>' + fmtMs(total) + '</b></li>';
      workings.innerHTML = lines;

      var fps = Math.round(10000 / total);
      fpsOut.textContent = fps + ' fps';

      if (total <= BUDGET) {
        var head = BUDGET - total;
        verdict.className = 'verdict ok';
        verdict.innerHTML =
          '<p class="v-head">Within budget — ' + fmtMs(total) + ' of 11.1 ms</p>' +
          '<p>This scene holds <b>90 fps</b> with <b>' + fmtMs(head) + '</b> to spare. The implied rate is ' +
          fps + ' fps; the display caps at 90, so the spare frame time becomes thermal and battery headroom — not wasted work.</p>';
      } else {
        var over = total - BUDGET;
        /* Most expensive chosen system, and its cheapest printed alternative. */
        var worst = null;
        ORDER.forEach(function (sys) {
          if (!worst || chosen[sys].cost > chosen[worst].cost) worst = sys;
        });
        var cheapest = null;
        groups[worst].forEach(function (b) {
          var c = parseInt(b.getAttribute('data-cost'), 10);
          if (!cheapest || c < cheapest.cost) cheapest = { btn: b, cost: c };
        });
        var fix = '';
        if (cheapest.cost >= chosen[worst].cost) {
          fix = '<b>' + SYSNAMES[worst] + '</b> is already at its cheapest printed option — the cut has to come from another system.';
        } else {
          var saving = chosen[worst].cost - cheapest.cost;
          var newTotal = total - saving;
          var lands;
          if (newTotal === BUDGET) lands = 'which lands the scene <b>exactly on the 11.1 ms budget line</b>.';
          else if (newTotal < BUDGET) lands = 'which brings the scene to <b>' + fmtMs(newTotal) + '</b> — within budget.';
          else lands = 'which brings the scene to <b>' + fmtMs(newTotal) + '</b> — still ' + fmtMs(newTotal - BUDGET) + ' over. One swap is not enough; keep cutting.';
          fix = 'Most expensive system: <b>' + SYSNAMES[worst] + ' — ' + chosen[worst].btn.getAttribute('data-label') +
            ' (' + fmtMs(chosen[worst].cost) + ')</b>. The cheapest printed alternative in Table B1 is <b>' +
            cheapest.btn.getAttribute('data-label') + ' (' + fmtMs(cheapest.cost) + ')</b>, saving <b>' + fmtMs(saving) + '</b> — ' + lands;
        }
        verdict.className = 'verdict over';
        verdict.innerHTML =
          '<p class="v-head">Over budget — ' + fmtMs(over) + ' too slow</p>' +
          '<p>At <b>' + fmtMs(total) + '</b> this scene renders at <b>' + fps + ' fps</b> on the target headset. ' +
          'In VR that shortfall is a comfort defect, not a compromise — it is felt in the stomach, not read off a chart. ' + fix + '</p>';
      }
    }
    compute();
  }

  /* ---------- Booking estimator (Sheet F1) ---------- */
  var prodMinus = document.getElementById('prodMinus');
  if (prodMinus) {
    var RATE = 780, PROTO_DAYS = 10, PLAT_FEE = 9800;
    var prod = 40, plat = 0;
    var prodVal = document.getElementById('prodVal'),
        prodAmt = document.getElementById('prodAmt'),
        optVal = document.getElementById('optVal'),
        optAmt = document.getElementById('optAmt'),
        platVal = document.getElementById('platVal'),
        platAmt = document.getElementById('platAmt'),
        estTotal = document.getElementById('estTotal'),
        estWorkings = document.getElementById('estWorkings'),
        prodPlus = document.getElementById('prodPlus'),
        platMinus = document.getElementById('platMinus'),
        platPlus = document.getElementById('platPlus');

    function renderEst() {
      var opt = prod / 5;
      var days = PROTO_DAYS + prod + opt;
      var total = days * RATE + plat * PLAT_FEE;
      prodVal.textContent = prod + ' days';
      prodAmt.textContent = fmtEur(prod * RATE);
      optVal.textContent = opt + ' days';
      optAmt.textContent = fmtEur(opt * RATE);
      platVal.textContent = String(plat);
      platAmt.textContent = fmtEur(plat * PLAT_FEE);
      estTotal.textContent = fmtEur(total);
      estWorkings.textContent = '(10 + ' + prod + ' + ' + opt + ') days \u00D7 \u20AC780 + ' +
        plat + ' \u00D7 \u20AC9,800 = ' + fmtEur(total) + '.';
      prodMinus.disabled = prod <= 20;
      prodPlus.disabled = prod >= 120;
      platMinus.disabled = plat <= 0;
      platPlus.disabled = plat >= 2;
    }
    prodMinus.addEventListener('click', function () { if (prod > 20) { prod -= 5; renderEst(); } });
    prodPlus.addEventListener('click', function () { if (prod < 120) { prod += 5; renderEst(); } });
    platMinus.addEventListener('click', function () { if (plat > 0) { plat -= 1; renderEst(); } });
    platPlus.addEventListener('click', function () { if (plat < 2) { plat += 1; renderEst(); } });
    renderEst();
  }

  /* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function setErr(id, msg) {
      var el = document.getElementById(id);
      if (el) { el.textContent = msg || ''; el.hidden = !msg; }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var type = document.getElementById('fType').value;
      var msg = document.getElementById('fMsg').value.trim();
      var ok = true;
      if (name.length < 2) { setErr('errName', 'Please give a name — I reply to people, not to blanks.'); ok = false; } else setErr('errName', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setErr('errEmail', 'That email doesn\u2019t parse — check it and try again.'); ok = false; } else setErr('errEmail', '');
      if (!type) { setErr('errType', 'Pick the kind of work — it decides which budget sheet I open.'); ok = false; } else setErr('errType', '');
      if (msg.length < 20) { setErr('errMsg', 'A little more than that — platform, worst scene, and the number you need to hit (20+ characters).'); ok = false; } else setErr('errMsg', '');
      if (!ok) return;
      var ref = 'RF-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = name;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
    });
  }
})();
