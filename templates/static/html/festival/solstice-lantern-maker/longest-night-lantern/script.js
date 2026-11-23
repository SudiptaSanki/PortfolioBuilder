/* Longest Night Lanterns — nav, parallax layers, order planner, form.
   No libraries. The planner reads its numbers from the rate tables
   printed on the page, so the tool and the page cannot disagree. */
(function () {
  'use strict';

  /* CSS view transitions abort noisily when a navigation interrupts
     one; swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('menu-panel');
  if (btn && panel) {
    var closeMenu = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closeMenu();
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        closeMenu();
      }
    });
  }

  /* ---------- parallax layers ---------- */
  var fine = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-px]'));
  if (fine && layers.length) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (img) {
        var host = img.parentElement.getBoundingClientRect();
        if (host.bottom < -200 || host.top > vh + 200) return;
        var speed = parseFloat(img.getAttribute('data-px')) || 0.08;
        var rel = (host.top + host.height / 2) - vh / 2;
        var shift = Math.max(-90, Math.min(90, -rel * speed));
        img.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- order planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var CUTOFF = new Date(2026, 11, 8);    /* Tue 8 Dec 2026: solstice book closes */
    var COLLECT = new Date(2026, 11, 18);  /* Fri 18 Dec 2026: last collection */
    var JANWALK = new Date(2027, 0, 23);   /* Sat 23 Jan 2027: dark-moon walk */

    var types = {}, lights = {};
    planner.querySelectorAll('[data-type]').forEach(function (row) {
      types[row.getAttribute('data-type')] = {
        price: +row.getAttribute('data-price'),
        days: +row.getAttribute('data-days')
      };
    });
    planner.querySelectorAll('[data-light]').forEach(function (row) {
      lights[row.getAttribute('data-light')] = {
        add: +row.getAttribute('data-add'),
        hours: +row.getAttribute('data-hours')
      };
    });

    var sel = { type: 'walker', light: 'timer', need: 'solstice' };
    var qtyInput = document.getElementById('qty');
    var out = {
      per: document.getElementById('out-per'),
      sub: document.getElementById('out-sub'),
      discRow: document.getElementById('row-disc'),
      disc: document.getElementById('out-disc'),
      total: document.getElementById('out-total'),
      days: document.getElementById('out-days'),
      ready: document.getElementById('out-ready'),
      hours: document.getElementById('out-hours'),
      state: document.getElementById('out-state'),
      flame: document.getElementById('flame-note')
    };
    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    var num = function (n) { return n.toLocaleString('en-US'); };
    var fmtDate = function (d) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };
    var dayMs = 86400000;
    var startOfDay = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

    function bindSeg(id, key) {
      var group = document.getElementById(id);
      if (!group) return;
      group.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-val]');
        if (!b) return;
        group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        sel[key] = b.getAttribute('data-val');
        render();
      });
    }
    bindSeg('seg-type', 'type');
    bindSeg('seg-light', 'light');
    bindSeg('seg-need', 'need');

    function clampQty() {
      var q = parseInt(qtyInput.value, 10);
      if (isNaN(q)) q = 1;
      q = Math.max(1, Math.min(120, q));
      qtyInput.value = q;
      return q;
    }
    document.getElementById('qty-minus').addEventListener('click', function () {
      qtyInput.value = clampQty() - 1; clampQty(); render();
    });
    document.getElementById('qty-plus').addEventListener('click', function () {
      qtyInput.value = clampQty() + 1; clampQty(); render();
    });
    qtyInput.addEventListener('change', function () { clampQty(); render(); });
    qtyInput.addEventListener('input', function () { render(); });

    function render() {
      var t = types[sel.type], l = lights[sel.light];
      if (!t || !l) return;
      var qty = clampQtySoft();
      var per = t.price + l.add;
      var sub = qty * per;
      var disc = qty >= 10 ? Math.round(0.10 * qty * t.price) : 0;
      var total = sub - disc;
      var batches = Math.ceil(qty / 6);
      var days = batches * t.days;
      var hours = qty * l.hours;
      var today = startOfDay(new Date());
      var ready = new Date(today.getTime() + days * dayMs);

      out.per.textContent = money(per);
      out.sub.textContent = money(sub);
      out.discRow.style.display = disc > 0 ? '' : 'none';
      out.disc.textContent = '−' + money(disc);
      out.total.textContent = money(total);
      out.days.textContent = days + (days === 1 ? ' day' : ' days');
      out.ready.textContent = fmtDate(ready);
      out.hours.textContent = num(hours) + ' h';
      out.flame.hidden = sel.light !== 'votive';

      var cls = 'state', html = '';
      if (sel.need === 'solstice' && today > CUTOFF) {
        cls += ' closed';
        html = '<p><strong>The solstice book is closed.</strong> Orders for the 2026 walk ' +
          'closed on Tuesday 8 December, and I will not take money for lanterns I cannot ' +
          'finish well. The same lanterns are on the January bench: this order would be ' +
          'ready by ' + fmtDate(ready) + ', in good time for the dark-moon walk on ' +
          'Saturday 23 January 2027.</p>';
      } else if (sel.need === 'solstice' && ready > COLLECT) {
        var left = Math.round((COLLECT - today) / dayMs);
        cls += ' warn';
        html = '<p><strong>Too big for this solstice.</strong> That is ' + days +
          ' making days of work, and only ' + left + ' days are left before the last ' +
          'collection on Friday 18 December. Split the order, or take the whole thing ' +
          'for the dark-moon walk on Saturday 23 January 2027 — ready by ' +
          fmtDate(ready) + ', with weeks to spare.</p>';
      } else if (sel.need === 'solstice') {
        html = '<p><strong>In time for the walk.</strong> Ready for collection by ' +
          fmtDate(ready) + ' — ahead of the last collection day, Friday 18 December, ' +
          'and the solstice walk itself on Monday 21 December.</p>';
      } else if (ready > JANWALK) {
        cls += ' warn';
        html = '<p><strong>Past the January walk too.</strong> At ' + days +
          ' making days this order lands on ' + fmtDate(ready) + '. Write to me and ' +
          'we will plan it as a February bench order instead — the dark is still ' +
          'long then.</p>';
      } else {
        html = '<p><strong>On the January bench.</strong> Ready by ' + fmtDate(ready) +
          ', ahead of the dark-moon walk on Saturday 23 January 2027. January orders ' +
          'are made without the December rush, and the frames are the better for it.</p>';
      }
      out.state.className = cls;
      out.state.innerHTML = html;
    }
    function clampQtySoft() {
      var q = parseInt(qtyInput.value, 10);
      if (isNaN(q)) q = 1;
      return Math.max(1, Math.min(120, q));
    }
    render();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      if (!name || !email || email.indexOf('@') < 0) {
        form.reportValidity();
        return;
      }
      var typeSel = document.getElementById('f-type');
      var typeText = typeSel.options[typeSel.selectedIndex].text;
      var qty = document.getElementById('f-qty').value;
      var ref = 'LN-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('cf-name').textContent = name.split(' ')[0];
      document.getElementById('cf-what').textContent = qty + ' × ' + typeText;
      document.getElementById('cf-ref').textContent = ref;
      document.getElementById('cf-email').textContent = email;
      form.hidden = true;
      var box = document.getElementById('confirm');
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      box.focus({ preventScroll: false });
    });
  }
})();
