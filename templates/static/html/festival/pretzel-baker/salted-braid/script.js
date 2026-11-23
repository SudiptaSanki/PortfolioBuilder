/* Salted Braid — interaction for Kern & Kruste.
   Bench calculator, nav, reveal, tray tilt, order form. No libraries. */
(function () {
  'use strict';

  /* ── navigation ─────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        toggle.focus();
      }
    });
  }

  /* ── reveal ─────────────────────────────────────────────── */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── tray tilt ──────────────────────────────────────────── */
  var tray = document.getElementById('tray');
  var stage = document.getElementById('pretzelStage');
  if (tray && stage && window.matchMedia('(min-width: 980px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tray.addEventListener('mousemove', function (e) {
      var r = tray.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--ry', (-5 + x * 11).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (4 - y * 9).toFixed(2) + 'deg');
    });
    tray.addEventListener('mouseleave', function () {
      stage.style.setProperty('--ry', '-5deg');
      stage.style.setProperty('--rx', '4deg');
    });
  }

  /* ── batch calculator ───────────────────────────────────── */
  var STYLES = {
    swabian:     { name: 'Swabian brezel',    weight: 95,  bake: 13, temp: 240, perTray: 12, trays: 3 },
    bavarian:    { name: 'Bavarian brezel',   weight: 120, bake: 15, temp: 235, perTray: 10, trays: 3 },
    oktoberfest: { name: 'Oktoberfest brezel', weight: 210, bake: 18, temp: 230, perTray: 8,  trays: 3 },
    stange:      { name: 'Laugenstange',      weight: 110, bake: 14, temp: 240, perTray: 12, trays: 3 },
    mini:        { name: 'Party mini',        weight: 45,  bake: 9,  temp: 245, perTray: 24, trays: 3 }
  };

  var form = document.getElementById('batchForm');
  if (form) {
    var styleEl = document.getElementById('style');
    var countEl = document.getElementById('count');
    var countOut = document.getElementById('countOut');
    var lyeEl = document.getElementById('lye');
    var dipEl = document.getElementById('dip');
    var serveEl = document.getElementById('serve');
    var resetEl = document.getElementById('resetBatch');

    var out = {
      dough: document.getElementById('outDough'),
      pieces: document.getElementById('outPieces'),
      flour: document.getElementById('outFlour'),
      style: document.getElementById('outStyle'),
      list: document.getElementById('ingList'),
      lyeLine: document.getElementById('lyeLine'),
      oven: document.getElementById('outOven'),
      bake: document.getElementById('outBake'),
      start: document.getElementById('outStart')
    };

    function grams(v) {
      if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kg';
      return Math.round(v) + ' g';
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function clockFrom(base, minusMinutes) {
      var m = base[0] * 60 + base[1] - minusMinutes;
      m = ((m % 1440) + 1440) % 1440;
      return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    }

    function render() {
      var s = STYLES[styleEl.value] || STYLES.swabian;
      var n = parseInt(countEl.value, 10);
      var pct = parseFloat(lyeEl.value);
      var dip = parseInt(dipEl.value, 10);
      countOut.textContent = n;

      var dough = n * s.weight;
      var flour = dough / 1.735;
      var water = flour * 0.50;
      var milk = flour * 0.10;
      var butter = flour * 0.08;
      var salt = flour * 0.022;
      var malt = flour * 0.015;
      var yeast = flour * 0.018;

      out.dough.textContent = grams(dough);
      out.pieces.textContent = n + ' × ' + s.weight + ' g';
      out.flour.textContent = grams(flour);
      out.style.textContent = s.name;

      out.list.innerHTML =
        '<li><span>Water</span><b>' + grams(water) + '</b></li>' +
        '<li><span>Cold milk</span><b>' + grams(milk) + '</b></li>' +
        '<li><span>Butter</span><b>' + grams(butter) + '</b></li>' +
        '<li><span>Salt</span><b>' + grams(salt) + '</b></li>' +
        '<li><span>Malt</span><b>' + grams(malt) + '</b></li>' +
        '<li><span>Fresh yeast</span><b>' + grams(yeast) + '</b></li>' +
        '<li class="total"><span>Total dough</span><b>' + grams(dough) + '</b></li>';

      var perTray = s.perTray;
      var capacity = perTray * s.trays;
      var loads = Math.ceil(n / capacity);
      var bathL = Math.max(2, Math.round(n * 0.03 * 10) / 10);
      var naoh = Math.round(bathL * 1000 * pct / 100);

      out.lyeLine.innerHTML = '<b>Lye bath ' + bathL.toFixed(1) + ' L + ' + naoh + ' g NaOH (' +
        pct.toFixed(1) + ' %).</b> Dip ' + dip + ' seconds each, drain on a rack, salt immediately. ' +
        loads + ' oven load' + (loads > 1 ? 's' : '') + ', up to ' + capacity + ' pieces per load.';

      out.oven.textContent = loads + ' load' + (loads > 1 ? 's' : '') + ' · ' + n + ' pieces';
      out.bake.textContent = s.bake + ' min at ' + s.temp + ' °C';

      var serveParts = (serveEl.value || '07:30').split(':');
      var serve = [parseInt(serveParts[0], 10) || 7, parseInt(serveParts[1], 10) || 30];
      var shape = Math.ceil(n / 40) * 6;
      var bakeAll = loads * (s.bake + 2);
      var totalBack = 10 + 45 + shape + 20 + bakeAll + 5;
      out.start.textContent = clockFrom(serve, totalBack);
      out.start.nextElementSibling.textContent = 'to serve at ' + pad(serve[0]) + ':' + pad(serve[1]) +
        ' · ' + Math.round(totalBack / 60 * 10) / 10 + ' h before';
    }

    [styleEl, countEl, lyeEl, dipEl, serveEl].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });

    if (resetEl) {
      resetEl.addEventListener('click', function () {
        styleEl.value = 'swabian';
        countEl.value = 60;
        lyeEl.value = '3';
        dipEl.value = '30';
        serveEl.value = '07:30';
        resetEl.setAttribute('aria-pressed', 'true');
        setTimeout(function () { resetEl.setAttribute('aria-pressed', 'false'); }, 700);
        render();
      });
    }

    render();
  }

  /* ── order form ─────────────────────────────────────────── */
  var order = document.getElementById('orderForm');
  if (order) {
    var dateEl = order.querySelector('#needBy');
    if (dateEl) {
      var d = new Date();
      d.setDate(d.getDate() + 2);
      dateEl.min = d.toISOString().slice(0, 10);
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function mark(field, ok) {
      var wrap = field.closest('.f');
      if (!wrap) return;
      wrap.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }

    order.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = order.querySelector('#name');
      var email = order.querySelector('#email');
      var message = order.querySelector('#message');
      var okName = name.value.trim().length > 1;
      var okEmail = emailRe.test(email.value.trim());
      var okMessage = message.value.trim().length > 5;

      mark(name, okName);
      mark(email, okEmail);
      mark(message, okMessage);

      if (!okName || !okEmail || !okMessage) {
        var first = !okName ? name : (!okEmail ? email : message);
        first.focus();
        return;
      }

      var ok = document.getElementById('formOk');
      var who = name.value.trim().split(' ')[0];
      ok.innerHTML = '<strong>Danke, ' + who.replace(/[<>&]/g, '') + '.</strong> Your note is in the order book. Jonas answers every enquiry within one working day, usually after the morning bake.';
      ok.classList.add('show');
      order.reset();
      if (dateEl) {
        var d2 = new Date();
        d2.setDate(d2.getDate() + 2);
        dateEl.min = d2.toISOString().slice(0, 10);
      }
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    order.addEventListener('input', function (e) {
      var wrap = e.target.closest('.f');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
})();
