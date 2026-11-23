/* Lehenga Luxe — menu, outfit planner, enquiry form. No audio, anywhere. */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact case so navigation stays error-free. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var close = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Menu';
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
      if (open) {
        var first = panel.querySelector('a');
        if (first) first.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) { close(); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) close();
    });
  }

  /* ---------- outfit planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var BASE_WEEKS = 5; /* cutting, stitching, two fittings — printed on the page */
    var state = { silhouette: null, fabric: null, embroidery: null, dupatta: null, weeks: 12 };

    function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }

    function pick(group) {
      var b = planner.querySelector('.opt[aria-pressed="true"][data-group="' + group + '"]');
      return b ? { price: +b.dataset.price, weeks: +b.dataset.weeks, label: b.dataset.label } : null;
    }

    function render() {
      state.silhouette = pick('silhouette');
      state.fabric = pick('fabric');
      state.embroidery = pick('embroidery');
      state.dupatta = pick('dupatta');
      var total = state.silhouette.price + state.fabric.price + state.embroidery.price + state.dupatta.price;
      var weeks = BASE_WEEKS + state.fabric.weeks + state.embroidery.weeks;
      document.getElementById('rSil').textContent = fmt(state.silhouette.price);
      document.getElementById('rFab').textContent = fmt(state.fabric.price);
      document.getElementById('rEmb').textContent = fmt(state.embroidery.price);
      document.getElementById('rDup').textContent = fmt(state.dupatta.price);
      document.getElementById('rTotal').textContent = fmt(total);
      document.getElementById('rWeeks').textContent = weeks + ' weeks';
      document.getElementById('weeksOut').textContent = state.weeks;

      var v = document.getElementById('verdict');
      if (state.weeks > weeks) {
        v.className = 'verdict';
        v.innerHTML = 'That fits. The outfit needs <b>' + weeks + ' weeks</b> and you have <b>' +
          state.weeks + '</b> — first fitting in week ' + (weeks - 2) + ', final fitting in week ' +
          (weeks - 1) + ', collected pressed and bagged in week ' + weeks + '.';
      } else if (state.weeks === weeks) {
        v.className = 'verdict tight';
        v.innerHTML = 'Just fits — exactly <b>' + weeks + ' weeks</b>, with no slack. If a fitting has to move, ' +
          'the date moves. Book the first fitting this week, or choose a lighter embroidery.';
      } else {
        v.className = 'verdict too-close';
        v.innerHTML = 'Too close, and I won\u2019t pretend otherwise: this outfit needs <b>' + weeks +
          ' weeks</b> and your date gives <b>' + state.weeks + '</b>. The honest alternative is ready now — ' +
          '<a href="#piece-01">Piece 01, the Sindoor Red bridal lehenga</a>, is in the boutique today at ' +
          '<b>\u20B91,45,000</b>, and I can alter it to your size in 10 days.';
      }
    }

    planner.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () {
        planner.querySelectorAll('.opt[data-group="' + b.dataset.group + '"]').forEach(function (x) {
          x.setAttribute('aria-pressed', 'false');
        });
        b.setAttribute('aria-pressed', 'true');
        render();
      });
    });
    var minus = document.getElementById('weeksMinus');
    var plus = document.getElementById('weeksPlus');
    minus.addEventListener('click', function () { if (state.weeks > 3) { state.weeks--; render(); } });
    plus.addEventListener('click', function () { if (state.weeks < 40) { state.weeks++; render(); } });
    render();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ref = 'LL-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      var name = document.getElementById('fName').value.trim();
      document.getElementById('confirmName').textContent = name ? ', ' + name.split(' ')[0] : '';
      form.style.display = 'none';
      var c = document.getElementById('confirmBox');
      c.classList.add('show');
      c.setAttribute('tabindex', '-1');
      c.focus();
    });
  }
})();
