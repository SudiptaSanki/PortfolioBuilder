/* Midnight Sparkle — the launch desk.
   Shared: view-transition abort guard, mobile desk menu,
   live desk readouts (Edinburgh clock + days to Hogmanay),
   the Display Coverage Planner, the booking form. No sound. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* --- view-transition abort guard: swallow ONLY the known abort --- */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- mobile menu: layered panel over the desk --- */
  var panel = document.querySelector('.menu-panel');
  var openBtn = document.querySelector('.menu-btn');
  var closeBtn = panel ? panel.querySelector('.menu-close') : null;
  var scrim = panel ? panel.querySelector('.menu-scrim') : null;
  var lastFocus = null;

  function openMenu() {
    if (!panel) return;
    lastFocus = document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { if (closeBtn) closeBtn.focus(); });
  }
  function closeMenu() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (openBtn && panel) {
    openBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (scrim) scrim.addEventListener('click', closeMenu);
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* --- live desk readouts: Edinburgh clock + days to midnight, 31 Dec --- */
  var clockEl = document.getElementById('desk-clock');
  var cdEl = document.getElementById('countdown-days');
  if (clockEl || cdEl) {
    var fmtTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    var fmtDate = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric'
    });
    function tick() {
      var now = new Date();
      if (clockEl) clockEl.textContent = fmtTime.format(now);
      if (cdEl) {
        var parts = {};
        fmtDate.formatToParts(now).forEach(function (p) { parts[p.type] = parseInt(p.value, 10); });
        var todayUTC = Date.UTC(parts.year, parts.month - 1, parts.day);
        var targetUTC = Date.UTC(parts.year, 11, 31);
        if (todayUTC > targetUTC) targetUTC = Date.UTC(parts.year + 1, 11, 31);
        var days = Math.round((targetUTC - todayUTC) / 86400000);
        cdEl.innerHTML = days + ' <small>DAYS</small>';
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ================================================================
     DISPLAY COVERAGE PLANNER
     Rate card (printed on the page — the tool reads the same numbers):
       base coverage ............ £1,450 (first shooting position incl.)
       extra shooting position .. +£380 each
       display length ........... first 12 min incl.; +£120 per extra
                                  started 5 min
       edition print ............ £240 each (100 x 70 cm)
       frames planned ........... 6 per minute per position
       crew hours ............... 4 survey + 2 per position + 2 edit
       survey lead .............. minimum 21 days before the display
     ================================================================ */
  var planner = document.getElementById('planner');
  if (planner) {
    var RATES = { base: 1450, extraPos: 380, inclMin: 12, extraBlock: 5, extraFee: 120, edition: 240, framesPerMin: 6, lead: 21 };

    var state = { duration: 12, sites: 2, editions: 4 };

    var durOut = document.getElementById('dur-out');
    var chips = planner.querySelectorAll('.chip[data-min]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.duration = parseInt(chip.getAttribute('data-min'), 10);
        render();
      });
    });

    function bindStepper(minusId, plusId, valId, key, min, max) {
      var val = document.getElementById(valId);
      document.getElementById(minusId).addEventListener('click', function () {
        state[key] = Math.max(min, state[key] - 1);
        val.textContent = state[key];
        render();
      });
      document.getElementById(plusId).addEventListener('click', function () {
        state[key] = Math.min(max, state[key] + 1);
        val.textContent = state[key];
        render();
      });
    }
    bindStepper('sites-minus', 'sites-plus', 'sites-val', 'sites', 1, 4);
    bindStepper('ed-minus', 'ed-plus', 'ed-val', 'editions', 0, 12);

    var dateInput = document.getElementById('display-date');
    if (dateInput && !dateInput.value) {
      var y = new Date().getFullYear();
      dateInput.value = y + '-12-31';
    }

    function money(n) { return '£' + n.toLocaleString('en-GB'); }

    function render() {
      var positions = state.sites;
      var frames = state.duration * RATES.framesPerMin * positions;
      var crew = 4 + 2 * positions + 2;
      var extraMin = Math.max(0, state.duration - RATES.inclMin);
      var blocks = Math.ceil(extraMin / RATES.extraBlock);
      var lenFee = blocks * RATES.extraFee;
      var posFee = (positions - 1) * RATES.extraPos;
      var edFee = state.editions * RATES.edition;
      var total = RATES.base + posFee + lenFee + edFee;

      if (durOut) durOut.textContent = state.duration + ' MIN';
      document.getElementById('out-positions').textContent = positions;
      document.getElementById('out-frames').textContent = frames.toLocaleString('en-GB');
      document.getElementById('out-crew').textContent = crew + ' HRS';
      document.getElementById('fee-base').textContent = money(RATES.base);
      document.getElementById('fee-pos').textContent = money(posFee);
      document.getElementById('fee-len').textContent = money(lenFee);
      document.getElementById('fee-ed').textContent = money(edFee);
      document.getElementById('out-total').textContent = money(total);

      var box = document.getElementById('lead-state');
      var k = box.querySelector('.k');
      var p = box.querySelector('p');
      var days = null;
      if (dateInput && dateInput.value) {
        var d = new Date(dateInput.value + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          days = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
        }
      }
      if (days !== null && days < RATES.lead) {
        box.classList.add('late');
        k.textContent = 'Inside the survey window';
        p.innerHTML = 'That date is <b>' + Math.max(days, 0) + ' days away</b>. The desk needs a minimum of <b>' +
          RATES.lead + ' days</b> to walk the positions with the firing team and agree the safety distances — inside that, I will not take the booking. ' +
          'What I can do instead: <b>license an archive edition</b> from a past display, printed and framed the same way. Ask on the booking form.';
      } else {
        box.classList.remove('late');
        k.textContent = 'Survey window: clear';
        p.innerHTML = days !== null
          ? 'That date is <b>' + days + ' days away</b> — outside the ' + RATES.lead + '-day minimum. The survey day can be booked as soon as the enquiry lands.'
          : 'Pick a display date and the desk checks it against the ' + RATES.lead + '-day survey minimum.';
      }
    }
    if (dateInput) dateInput.addEventListener('change', render);
    render();
  }

  /* --- booking form: in-page confirmation with a desk reference --- */
  var form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#f-name').value.trim();
      var date = form.querySelector('#f-date').value;
      var ref = 'MS-' + new Date().getFullYear() + '-' +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      var box = document.getElementById('confirmation');
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-line').textContent =
        'Logged for ' + (name || 'the desk') + (date ? ' — display date ' + date : '') +
        '. The desk answers within two working days with the survey plan and the fee in writing.';
      form.hidden = true;
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      box.focus();
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
