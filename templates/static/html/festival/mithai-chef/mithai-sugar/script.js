/* Taraju Mithai Counter — menu, tray stamps, the box planner, the order form. */
(function () {
  'use strict';

  /* CSS view transitions can abort when navigation is interrupted;
     swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- mobile menu: the hanging counter ticket ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    var open = false;
    var closeTimer = null;
    function setOpen(v, moveFocus) {
      open = v;
      btn.setAttribute('aria-expanded', String(v));
      if (v) {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        panel.hidden = false;
        requestAnimationFrame(function () {
          panel.classList.add('open');
          if (moveFocus) {
            var first = panel.querySelector('a');
            if (first) first.focus({ preventScroll: true });
          }
        });
      } else {
        panel.classList.remove('open');
        if (reduced) { panel.hidden = true; }
        else {
          closeTimer = setTimeout(function () { if (!open) panel.hidden = true; }, 260);
        }
        if (moveFocus) btn.focus({ preventScroll: true });
      }
    }
    btn.addEventListener('click', function () { setOpen(!open, true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false, true);
    });
  }

  /* ---------- tray stamps ---------- */
  var stamps = document.querySelectorAll('[data-stamp]');
  if (stamps.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      stamps.forEach(function (s) { s.classList.add('stamped'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('stamped');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.35 });
      stamps.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- the gift box & order planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var rows = Array.prototype.slice.call(planner.querySelectorAll('.p-row'));
    var days = 0;
    var daysOut = document.getElementById('daysOut');
    var rWeight = document.getElementById('rWeight');
    var rSweets = document.getElementById('rSweets');
    var rBoxes = document.getElementById('rBoxes');
    var rPacking = document.getElementById('rPacking');
    var rTotal = document.getElementById('rTotal');
    var verdict = document.getElementById('verdict');
    var BOX_PRICE = 60;

    function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }
    function fmtKg(kg) { return (kg % 1 ? kg.toFixed(1) : String(kg)) + ' kg'; }

    function recalc() {
      var totalKg = 0, subtotal = 0, warnings = [];
      rows.forEach(function (row) {
        var kg = parseFloat(row.getAttribute('data-kg') || '0');
        var rate = parseInt(row.getAttribute('data-rate'), 10);
        var keeps = parseInt(row.getAttribute('data-days'), 10);
        totalKg += kg;
        subtotal += kg * rate;
        row.querySelector('.p-kg').textContent = fmtKg(kg);
        row.querySelector('.p-line').textContent = fmt(kg * rate);
        if (kg > 0 && keeps < days) {
          warnings.push({
            name: row.getAttribute('data-name'),
            keeps: keeps,
            swap: row.getAttribute('data-swap')
          });
        }
      });
      var giftEl = planner.querySelector('input[name="packing"]:checked');
      var gift = giftEl && giftEl.value === 'gift';
      var boxes = gift && totalKg > 0 ? Math.ceil(totalKg) : 0;
      var packing = boxes * BOX_PRICE;
      var total = subtotal + packing;

      rWeight.textContent = fmtKg(totalKg);
      rSweets.textContent = fmt(subtotal);
      rBoxes.textContent = gift
        ? (boxes ? boxes + (boxes === 1 ? ' × 1 kg box' : ' × 1 kg boxes') : '—')
        : 'Loose — no boxes';
      rPacking.textContent = fmt(packing);
      rTotal.textContent = fmt(total);
      if (daysOut) daysOut.textContent = days + (days === 1 ? ' day' : ' days');

      verdict.classList.remove('warn', 'ok');
      if (totalKg === 0) {
        verdict.textContent = 'The scale is empty. Add a sweet from the counter — half a kilo is a respectable start.';
      } else if (warnings.length) {
        verdict.classList.add('warn');
        verdict.textContent = 'Wait — the dates do not hold. ' + warnings.map(function (w) {
          return w.name + ' keeps ' + (w.keeps === 0 ? 'no days at all — it is eaten the day it is fried' : w.keeps + (w.keeps === 1 ? ' day' : ' days')) +
            ', but this box must last ' + days + (days === 1 ? ' day' : ' days') + '. Swap it for ' + w.swap + '.';
        }).join(' ');
      } else {
        verdict.classList.add('ok');
        verdict.textContent = 'Every sweet in this box is still honest on day ' + days + '. Weighed in the open, it comes to ' + fmt(total) + '.';
      }
    }

    rows.forEach(function (row) {
      row.querySelectorAll('.step-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var kg = parseFloat(row.getAttribute('data-kg') || '0');
          kg = Math.round((kg + parseFloat(b.getAttribute('data-step'))) * 2) / 2;
          if (kg < 0) kg = 0;
          if (kg > 10) kg = 10;
          row.setAttribute('data-kg', String(kg));
          recalc();
        });
      });
    });
    planner.querySelectorAll('input[name="packing"]').forEach(function (r) {
      r.addEventListener('change', recalc);
    });
    planner.querySelectorAll('.days-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        days += parseInt(b.getAttribute('data-step'), 10);
        if (days < 0) days = 0;
        if (days > 30) days = 30;
        recalc();
      });
    });
    recalc();
  }

  /* ---------- the order form ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var need = document.getElementById('fNeed');
      var date = document.getElementById('fDate').value;
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var ref = 'TM-2026-';
      for (var i = 0; i < 4; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confSummary').textContent =
        (name ? name + ' — ' : '') + need.options[need.selectedIndex].text +
        (date ? ', needed by ' + date : '') + '.';
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus({ preventScroll: false });
    });
  }
})();
