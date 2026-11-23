/* Warli Earth — Sunita Bhoye. Vanilla JS: menu, stamp reveals,
   wall commission planner, commission form. No audio anywhere. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts (rapid navigation) surface as unhandled
     InvalidStateError rejections — swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.querySelector('.menu-panel');
  if (btn && panel) {
    var closeBtn = panel.querySelector('.menu-close');
    var firstLink = panel.querySelector('nav a');
    function openMenu() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closeMenu() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      btn.focus();
    }
    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- stamp reveals ---------- */
  var stamps = document.querySelectorAll('.stamp');
  if (stamps.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      stamps.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      stamps.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- wall commission planner ---------- */
  /* These numbers are the same ones printed in the rate table on the page. */
  var RATES = { tarpa: 400, harvest: 450, wedding: 550 };   /* rupees per sq ft */
  var DENSITY = { tarpa: 2, harvest: 3, wedding: 3 };       /* figures per sq ft */
  var SQFT_PER_DAY = 10;                                    /* one painter, one day */
  var PREP = { wall: 2, cloth: 1, paper: 0 };               /* preparation days */
  var SECOND_PER_DAY = 1800;                                /* second painter, per painting day */

  var planner = document.getElementById('planner-form');
  if (planner) {
    var wIn = document.getElementById('p-width');
    var hIn = document.getElementById('p-height');
    var dateIn = document.getElementById('p-date');
    var secondIn = document.getElementById('p-second');
    var oArea = document.getElementById('o-area');
    var oFig = document.getElementById('o-figures');
    var oDays = document.getElementById('o-days');
    var oPrice = document.getElementById('o-price');
    var honest = document.getElementById('honest');
    var honestText = document.getElementById('honest-text');

    function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
    function picked(name) {
      var el = planner.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    function fmtDate(d) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    function compute() {
      var w = parseFloat(wIn.value);
      var h = parseFloat(hIn.value);
      var scene = picked('scene');
      var ground = picked('ground');
      var second = secondIn.checked;
      if (!(w > 0) || !(h > 0) || !scene || !ground) {
        oArea.textContent = '—'; oFig.textContent = '—';
        oDays.textContent = '—'; oPrice.textContent = '—';
        honest.hidden = true;
        return;
      }
      var area = Math.round(w * h * 2) / 2;
      var figures = Math.round(area * DENSITY[scene]);
      var paintDays = Math.ceil(area / SQFT_PER_DAY);
      var prep = PREP[ground];
      var effPaint = second ? Math.ceil(paintDays / 2) : paintDays;
      var totalDays = effPaint + prep;
      var price = Math.round(area * RATES[scene]) + (second ? effPaint * SECOND_PER_DAY : 0);

      oArea.textContent = area.toLocaleString('en-IN') + ' sq ft';
      oFig.textContent = 'about ' + figures.toLocaleString('en-IN');
      oDays.textContent = effPaint + (effPaint === 1 ? ' day' : ' days') + ' painting' +
        (second ? ' (two painters)' : '') +
        (prep ? ' + ' + prep + (prep === 1 ? ' day' : ' days') + ' preparing = ' + totalDays + ' days' : ' = ' + totalDays + ' days');
      oPrice.textContent = inr(price);

      /* honest state: a date the wall cannot meet */
      honest.hidden = true;
      if (dateIn.value) {
        var parts = dateIn.value.split('-');
        var target = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var avail = Math.round((target - today) / 86400000);
        if (avail < 0) {
          honestText.innerHTML = '<strong>That date has already passed.</strong> Pick a date ahead of us and I will tell you plainly whether the wall fits it.';
          honest.hidden = false;
        } else if (totalDays > avail) {
          var msg = '<strong>I cannot finish this wall by ' + fmtDate(target) + '.</strong> ' +
            'A wall of ' + area.toLocaleString('en-IN') + ' sq ft needs ' + totalDays + ' days' +
            (second ? ' even with two painters' : ' from me alone') + ', and there are ' + avail + ' days between now and then.';
          if (!second) {
            var p2 = Math.ceil(paintDays / 2) + prep;
            var price2 = Math.round(area * RATES[scene]) + Math.ceil(paintDays / 2) * SECOND_PER_DAY;
            msg += ' <strong>One way:</strong> my cousin Datta paints beside me — ' + p2 + ' days, ' + inr(price2) + '. Tick the second-painter box above to see it worked out.';
          }
          var maxPaint = avail - prep;
          if (maxPaint > 0) {
            var maxArea = maxPaint * SQFT_PER_DAY * (second ? 2 : 1);
            var maxW = Math.floor((maxArea / h) * 2) / 2;
            if (maxW >= 2) {
              var smallArea = maxW * h;
              var smallPaint = Math.ceil(Math.ceil(smallArea / SQFT_PER_DAY) / (second ? 2 : 1));
              var smallPrice = Math.round(smallArea * RATES[scene]) + (second ? smallPaint * SECOND_PER_DAY : 0);
              msg += ' <strong>Another way:</strong> at ' + h + ' ft high, a wall up to ' + maxW + ' ft wide fits the date — ' +
                smallArea.toLocaleString('en-IN') + ' sq ft, ' + inr(smallPrice) + ' at this scene\u2019s rate.';
            } else {
              msg += ' No wall of a useful size fits that date — the date itself has to move.';
            }
          } else {
            msg += ' Even preparing the ' + ground + ' takes ' + prep + (prep === 1 ? ' day' : ' days') + ' — the date itself has to move.';
          }
          honestText.innerHTML = msg;
          honest.hidden = false;
        }
      }
    }
    planner.addEventListener('input', compute);
    planner.addEventListener('change', compute);
    compute();
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commission-form');
  if (form) {
    var conf = document.getElementById('confirmation');
    var refEl = document.getElementById('conf-ref');
    var sumEl = document.getElementById('conf-summary');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name').value.trim();
      var place = document.getElementById('c-place').value.trim();
      var groundEl = form.querySelector('input[name="c-ground"]:checked');
      var sceneEl = document.getElementById('c-scene');
      var ref = 'WE-' + Math.floor(1000 + Math.random() * 9000);
      refEl.textContent = ref;
      sumEl.textContent = 'Thank you, ' + (name || 'friend') + '. Your ' +
        (sceneEl ? sceneEl.value : 'painting') + ' on ' + (groundEl ? groundEl.value : 'a wall') +
        (place ? ' at ' + place : '') +
        ' is in my book under this reference. I answer within three days — sooner in the quiet months, slower when the harvest walls are on.';
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
