/* Market of Seasons — notice-board menu, stallholder planner, enquiry form.
   No sound, no scroll effects. Reduced motion respected in CSS. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View transitions abort when a navigation is interrupted; that
     rejection is expected behaviour, not an error worth surfacing. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- notice-board mobile menu ---------- */
  var btn = document.getElementById('boardBtn');
  var panel = document.getElementById('boardPanel');
  if (btn && panel) {
    var setOpen = function (open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    };
    btn.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setOpen(false);
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        setOpen(false);
      }
    });
  }

  /* ---------- stallholder planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    /* Rates mirror the fee table printed on this page. */
    var PITCHES = {
      standard: { label: 'Standard pitch', perDay: 28, booked: false },
      double:   { label: 'Double pitch',   perDay: 50, booked: false },
      food:     { label: 'Food pitch, Row A', perDay: 40, booked: true }
    };
    var EXTRAS = { power: 9, water: 4, hire: 12 };
    var state = { pitch: 'standard', days: 4, extras: { power: false, water: false, hire: false } };

    var chips = planner.querySelectorAll('.chip[data-pitch]');
    var daysOut = document.getElementById('daysOut');
    var receipt = document.getElementById('receipt');
    var bookedNote = document.getElementById('bookedNote');
    var rPitch = document.getElementById('rPitch');
    var rPitchLabel = document.getElementById('rPitchLabel');
    var rDiscountLine = document.getElementById('rDiscountLine');
    var rDiscount = document.getElementById('rDiscount');
    var rExtras = document.getElementById('rExtras');
    var rTotal = document.getElementById('rTotal');
    var gbp = function (n) { return '£' + n.toLocaleString('en-GB'); };

    function render() {
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-pitch') === state.pitch ? 'true' : 'false');
      });
      daysOut.textContent = state.days;
      var p = PITCHES[state.pitch];
      if (p.booked) {
        receipt.hidden = true;
        bookedNote.hidden = false;
        return;
      }
      bookedNote.hidden = true;
      receipt.hidden = false;
      var pitchFees = p.perDay * state.days;
      var discount = state.days >= 8 ? Math.round(pitchFees * 0.10) : 0;
      var extrasPerDay = 0;
      Object.keys(EXTRAS).forEach(function (k) { if (state.extras[k]) extrasPerDay += EXTRAS[k]; });
      var extras = extrasPerDay * state.days;
      rPitchLabel.textContent = p.label + ' · ' + state.days + (state.days === 1 ? ' day' : ' days');
      rPitch.textContent = gbp(pitchFees);
      rDiscountLine.hidden = discount === 0;
      rDiscount.textContent = '−' + gbp(discount);
      rExtras.textContent = gbp(extras);
      rTotal.textContent = gbp(pitchFees - discount + extras);
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.pitch = c.getAttribute('data-pitch');
        render();
      });
    });
    document.getElementById('daysMinus').addEventListener('click', function () {
      if (state.days > 1) { state.days--; render(); }
    });
    document.getElementById('daysPlus').addEventListener('click', function () {
      if (state.days < 12) { state.days++; render(); }
    });
    Object.keys(EXTRAS).forEach(function (k) {
      var box = document.getElementById('ex-' + k);
      if (box) box.addEventListener('change', function () {
        state.extras[k] = box.checked;
        render();
      });
    });
    render();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var type = document.getElementById('f-type').value;
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var code = '';
      for (var i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      var ref = 'MOS-2026-' + code;
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = name ? name.split(' ')[0] : 'Thanks';
      document.getElementById('confType').textContent = type;
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus({ preventScroll: false });
    });
  }
})();
