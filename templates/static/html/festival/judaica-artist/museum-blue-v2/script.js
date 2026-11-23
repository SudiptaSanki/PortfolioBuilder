/* Museum Blue — gallery guide panel, commission planner, order form.
   No sound. No autoplay. Everything here answers a tap or a key. */
(function () {
  'use strict';

  /* View-transition abort guard: an interrupted cross-page fade rejects
     its promise; swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- gallery guide panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('guide-panel');
  var scrim = document.getElementById('scrim');
  function openPanel() {
    if (!panel) return;
    panel.classList.add('open');
    if (scrim) scrim.classList.add('on');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      var first = panel.querySelector('.guide-close');
      if (first) first.focus();
    });
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    if (scrim) scrim.classList.remove('on');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  }
  if (btn && panel) {
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(); else openPanel();
    });
    var closeBtn = panel.querySelector('.guide-close');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (scrim) scrim.addEventListener('click', closePanel);
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('open');
        if (scrim) scrim.classList.remove('on');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  /* ---------- date helpers (UTC, so the arithmetic never drifts) ---------- */
  var MONTHS = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];
  function parseISO(v) {
    var p = (v || '').split('-');
    if (p.length !== 3) return null;
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }
  function addDays(d, n) {
    var c = new Date(d.getTime());
    c.setUTCDate(c.getUTCDate() + n);
    return c;
  }
  function fmt(d) {
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function isoLocal(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function money(n) {
    return '$' + Number(n).toLocaleString('en-US');
  }

  /* ---------- festival commission planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var objSel = document.getElementById('pl-object');
    var festSel = document.getElementById('pl-festival');
    var dateIn = document.getElementById('pl-date');
    var out = document.getElementById('pl-result');
    if (dateIn && !dateIn.value) dateIn.value = isoLocal(new Date());

    function selectedData(sel) {
      var o = sel.options[sel.selectedIndex];
      return o ? o.dataset : {};
    }
    function run() {
      var od = selectedData(objSel);
      var fd = selectedData(festSel);
      var order = parseISO(dateIn.value);
      if (!od.price || !fd.date || !order) {
        out.innerHTML = '<p>Choose an object, a festival and an order date, and the bench will do the calendar arithmetic.</p>';
        return;
      }
      var weeks = parseInt(od.weeks, 10);
      var price = parseInt(od.price, 10);
      var festDate = parseISO(fd.date);
      var ready = addDays(order, weeks * 7);
      var orderBy = addDays(festDate, -weeks * 7);
      var objName = objSel.options[objSel.selectedIndex].textContent;
      var festName = festSel.options[festSel.selectedIndex].textContent;
      var html = '<p class="sum">' + objName + ' — ' + money(price) + ' · ' + weeks +
        ' weeks at the bench</p>';
      if (ready.getTime() <= festDate.getTime()) {
        html += '<div class="verdict"><p><strong>In time for ' + festName + '.</strong> ' +
          'Ordered ' + fmt(order) + ', the piece is ready <strong>' + fmt(ready) + '</strong>. ' +
          'The last order date for this festival is <strong>' + fmt(orderBy) + '</strong> — ' +
          'after that the bench cannot promise it.</p></div>';
      } else {
        html += '<div class="verdict late"><p><strong>Too late for ' + festName + '.</strong> ' +
          'Ordered ' + fmt(order) + ', this piece would be ready <strong>' + fmt(ready) + '</strong>, ' +
          'after the festival has begun (' + fmt(festDate) + '). Silver keeps its own calendar.</p>' +
          '<p><strong>From the shelf instead:</strong> ' + od.stock + '</p></div>';
      }
      out.innerHTML = html;
    }
    [objSel, festSel, dateIn].forEach(function (el) {
      el.addEventListener('change', run);
      el.addEventListener('input', run);
    });
    run();
  }

  /* ---------- order form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('cf-name').value || '').trim();
      var obj = document.getElementById('cf-object');
      var objName = obj.options[obj.selectedIndex].textContent;
      var year = new Date().getFullYear();
      var num = String(1000 + Math.floor(Math.random() * 9000));
      var ref = 'MB-' + year + '-' + num;
      var box = document.getElementById('confirmation');
      document.getElementById('cf-ref').textContent = ref;
      document.getElementById('cf-summary').textContent =
        (name ? 'Thank you, ' + name + '. ' : 'Thank you. ') +
        'Your note about the ' + objName + ' is on the bench list. ' +
        'I reply within two working days — sooner when a festival is close.';
      box.hidden = false;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      form.reset();
    });
  }
})();
