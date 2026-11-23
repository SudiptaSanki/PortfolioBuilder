/* Chromosphere Corona — flare class, CME transit and loop bench */
(function () {
  'use strict';

  var AU_KM = 1.496e8;
  var MU0 = 4 * Math.PI * 1e-7;
  var MP = 1.6726e-27;
  var N_CM3 = 1e9;                 // coronal density used for the loop
  var LAUNCH = Date.UTC(2026, 10, 18, 12, 0, 0);

  var $ = function (id) { return document.getElementById(id); };

  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function sci(x, d) {
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = x / Math.pow(10, e);
    return fmt(m, d) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/[0-9]/g, function (c) {
      return '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c, 10)];
    });
  }

  /* ---------- flare ---------- */
  function flare() {
    var logF = parseFloat($('flux').value);
    var F = Math.pow(10, logF);
    var letter, num;
    if (F < 1e-7) { letter = 'A'; num = F / 1e-8; }
    else if (F < 1e-6) { letter = 'B'; num = F / 1e-7; }
    else if (F < 1e-5) { letter = 'C'; num = F / 1e-6; }
    else if (F < 1e-4) { letter = 'M'; num = F / 1e-5; }
    else { letter = 'X'; num = F / 1e-4; }

    var r;
    if (F >= 2e-3) r = 'R5 · blackout';
    else if (F >= 1e-3) r = 'R4 · severe';
    else if (F >= 1e-4) r = 'R3 · strong';
    else if (F >= 5e-5) r = 'R2 · moderate';
    else if (F >= 1e-5) r = 'R1 · minor';
    else r = 'below R1';

    return { logF: logF, F: F, cls: letter + fmt(num, 1), letter: letter, r: r, num: num };
  }

  function drawLadder(f) {
    var X0 = 24, X1 = 296, Y = 52;
    var x = function (lf) { return X0 + ((lf + 8) / 5) * (X1 - X0); };

    var base = '';
    base += '<line x1="' + X0 + '" y1="' + Y + '" x2="' + X1 + '" y2="' + Y + '" stroke="rgba(240,230,214,0.32)" stroke-width="1"></line>';
    var text = '';
    [-8, -7, -6, -5, -4, -3].forEach(function (lf, i) {
      var letters = ['A', 'B', 'C', 'M', 'X', ''];
      base += '<line x1="' + x(lf) + '" y1="' + (Y - 5) + '" x2="' + x(lf) + '" y2="' + (Y + 5) + '" stroke="rgba(240,230,214,0.5)" stroke-width="1"></line>';
      if (letters[i]) text += '<text x="' + x(lf) + '" y="' + (Y + 22) + '" text-anchor="middle">' + letters[i] + '</text>';
    });
    text += '<text x="' + X0 + '" y="' + (Y - 16) + '">10⁻⁸</text>';
    text += '<text x="' + X1 + '" y="' + (Y - 16) + '" text-anchor="end">10⁻³</text>';
    $('ladderBase').innerHTML = base;
    $('ladderText').innerHTML = text;

    var px = x(Math.max(-8, Math.min(-3, f.logF)));
    $('ladderMark').setAttribute('x1', px);
    $('ladderMark').setAttribute('x2', px);
    $('ladderDot').setAttribute('cx', px);
    $('ladderDot').setAttribute('cy', Y);
  }

  /* ---------- CME ---------- */
  function cme() {
    var speed = parseFloat($('speed').value);
    var bz = parseFloat($('bz').value);
    var hours = AU_KM / speed / 3600;
    var arrive = new Date(LAUNCH + hours * 3600 * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var hh = String(arrive.getUTCHours()).padStart(2, '0');
    var mm = String(arrive.getUTCMinutes()).padStart(2, '0');
    var arriveStr = arrive.getUTCDate() + ' ' + months[arrive.getUTCMonth()] + ' · ' + hh + ':' + mm + ' UTC';
    var dst = bz < 0 ? Math.max(-600, -(speed * Math.abs(bz)) / 100) : 0;
    return { speed: speed, bz: bz, hours: hours, arrive: arriveStr, dst: dst };
  }

  function drawTransit(c) {
    var X0 = 34, X1 = 286, Y = 52, MAX = 96;
    var x = function (h) { return X0 + (Math.min(h, MAX) / MAX) * (X1 - X0); };

    var base = '';
    base += '<line x1="' + X0 + '" y1="' + Y + '" x2="' + X1 + '" y2="' + Y + '" stroke="rgba(240,230,214,0.32)" stroke-width="1"></line>';
    base += '<circle cx="' + X0 + '" cy="' + Y + '" r="6" fill="#e8622a"></circle>';
    base += '<circle cx="' + X1 + '" cy="' + Y + '" r="5" fill="none" stroke="#a8957c" stroke-width="1.2"></circle>';
    var text = '';
    [0, 24, 48, 72, 96].forEach(function (h) {
      base += '<line x1="' + x(h) + '" y1="' + (Y - 4) + '" x2="' + x(h) + '" y2="' + (Y + 4) + '" stroke="rgba(240,230,214,0.4)" stroke-width="1"></line>';
      text += '<text x="' + x(h) + '" y="' + (Y + 20) + '" text-anchor="middle">' + h + 'h</text>';
    });
    text += '<text x="' + X0 + '" y="' + (Y - 16) + '">Sun</text>';
    text += '<text x="' + X1 + '" y="' + (Y - 16) + '" text-anchor="end">Earth</text>';
    $('transitBase').innerHTML = base;
    $('transitText').innerHTML = text;

    var px = x(c.hours);
    $('transitDot').setAttribute('cx', px);
    $('transitDot').setAttribute('cy', Y);
  }

  /* ---------- loop ---------- */
  function loop() {
    var a = parseFloat($('half').value);      // Mm
    var h = parseFloat($('loopH').value);     // Mm
    var B = parseFloat($('field').value);     // Gauss
    var P = Math.PI * (3 * (a + h) - Math.sqrt((3 * a + h) * (a + 3 * h)));
    var L = P / 2;                            // Mm
    var rho = N_CM3 * 1e6 * MP;               // kg/m3
    var va = (B * 1e-4) / Math.sqrt(MU0 * rho); // m/s
    var period = (2 * L * 1e6) / va;          // s
    return { a: a, h: h, B: B, L: L, va: va / 1000, period: period };
  }

  function drawLoop(l) {
    var CX = 160, BASE = 96, MAXX = 132, MAXY = 74;
    var rx = (l.a / 120) * MAXX;
    var ry = (l.h / 120) * MAXY;

    var base = '';
    base += '<line x1="20" y1="' + BASE + '" x2="300" y2="' + BASE + '" stroke="rgba(240,230,214,0.28)" stroke-width="1"></line>';
    base += '<path d="M' + (CX - rx) + ' ' + BASE + ' A ' + rx + ' ' + ry + ' 0 0 1 ' + (CX + rx) + ' ' + BASE + '" fill="rgba(232,98,42,0.10)" stroke="#e8622a" stroke-width="1.6"></path>';
    base += '<circle cx="' + (CX - rx) + '" cy="' + BASE + '" r="3" fill="#f0b13f"></circle>';
    base += '<circle cx="' + (CX + rx) + '" cy="' + BASE + '" r="3" fill="#f0b13f"></circle>';
    base += '<line x1="' + CX + '" y1="' + BASE + '" x2="' + CX + '" y2="' + (BASE - ry) + '" stroke="rgba(240,230,214,0.4)" stroke-width="0.8" stroke-dasharray="3 3"></line>';
    base += '<line x1="' + (CX - rx) + '" y1="' + (BASE + 14) + '" x2="' + (CX + rx) + '" y2="' + (BASE + 14) + '" stroke="#a8957c" stroke-width="0.8"></line>';
    base += '<line x1="' + (CX - rx) + '" y1="' + (BASE + 10) + '" x2="' + (CX - rx) + '" y2="' + (BASE + 18) + '" stroke="#a8957c" stroke-width="0.8"></line>';
    base += '<line x1="' + (CX + rx) + '" y1="' + (BASE + 10) + '" x2="' + (CX + rx) + '" y2="' + (BASE + 18) + '" stroke="#a8957c" stroke-width="0.8"></line>';
    $('loopBase').innerHTML = base;

    var text = '';
    text += '<text x="' + CX + '" y="' + (BASE + 30) + '" text-anchor="middle">' + fmt(2 * l.a, 0) + ' Mm</text>';
    text += '<text x="' + (CX + 5) + '" y="' + (BASE - ry - 4) + '">h ' + fmt(l.h, 0) + ' Mm</text>';
    $('loopText').innerHTML = text;
  }

  /* ---------- render ---------- */
  function render() {
    if (!$('flux') || !$('ladder')) return;

    var f = flare();
    $('fluxOut').textContent = sci(f.F, 1) + ' W/m²';
    $('outClass').textContent = f.cls;
    $('outR').textContent = f.r;
    $('outErg').textContent = fmt(f.F * 1000, 3) + ' erg/cm²/s';
    $('outR').className = /R[45]/.test(f.r) ? 'warn' : '';
    $('outClass').className = /^X/.test(f.cls) ? 'warn' : '';
    drawLadder(f);

    var c = cme();
    $('speedOut').textContent = fmt(c.speed, 0) + ' km/s';
    $('bzOut').textContent = (c.bz < 0 ? '−' : '') + fmt(Math.abs(c.bz), 0) + ' nT';
    $('outTransit').textContent = fmt(c.hours, 1) + ' h';
    $('outArrive').textContent = c.arrive;
    $('outDst').textContent = c.dst === 0 ? 'no coupling' : '−' + fmt(Math.abs(c.dst), 0) + ' nT';
    $('outDst').className = c.dst < -200 ? 'warn' : '';
    drawTransit(c);

    var l = loop();
    $('halfOut').textContent = fmt(l.a, 0) + ' Mm';
    $('loopHOut').textContent = fmt(l.h, 0) + ' Mm';
    $('fieldOut').textContent = fmt(l.B, 0) + ' G';
    $('outLen').textContent = fmt(l.L, 0) + ' Mm';
    $('outVa').textContent = fmt(l.va, 0) + ' km/s';
    $('outPeriod').textContent = fmt(l.period, 0) + ' s';
    drawLoop(l);
  }

  function bindBench() {
    if (!$('flux')) return;
    ['flux', 'speed', 'bz', 'half', 'loopH', 'field'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', render);
    });
    render();
  }

  function bindFilters() {
    var list = $('caseList');
    if (!list) return;
    var cases = list.querySelectorAll('.case');
    var count = $('caseCount');
    var btns = document.querySelectorAll('[data-filter]');

    function apply(f) {
      var shown = 0;
      for (var i = 0; i < cases.length; i += 1) {
        var tags = (cases[i].getAttribute('data-tags') || '').split(' ');
        var on = f === 'all' || tags.indexOf(f) !== -1;
        cases[i].hidden = !on;
        if (on) shown += 1;
      }
      if (count) count.textContent = 'Showing ' + shown + ' of ' + cases.length + ' campaigns';
      for (var j = 0; j < btns.length; j += 1) {
        var on = btns[j].getAttribute('data-filter') === f;
        btns[j].classList.toggle('is-on', on);
        btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    for (var k = 0; k < btns.length; k += 1) {
      btns[k].addEventListener('click', function () { apply(this.getAttribute('data-filter')); });
    }
    apply('all');
  }

  function bindForm() {
    var f = $('enquiryForm');
    if (!f) return;
    var status = $('formStatus');
    var result = $('formResult');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var org = $('fOrg').value.trim();
      var kind = $('fKind').value;
      var message = $('fMessage').value.trim();
      var ok = true;

      $('errName').textContent = '';
      $('errEmail').textContent = '';
      $('errMessage').textContent = '';
      status.textContent = '';
      status.classList.remove('bad');

      if (name.length < 2) { $('errName').textContent = 'A name, please.'; ok = false; }
      if (!emailRe.test(email)) { $('errEmail').textContent = 'An address that can receive a reply.'; ok = false; }
      if (message.length < 24) { $('errMessage').textContent = 'Which event, which instrument, and what you need from it.'; ok = false; }

      if (!ok) {
        result.hidden = true;
        status.textContent = 'Not sent. Check the marked fields.';
        status.classList.add('bad');
        ($('errName').textContent ? $('fName') : ($('errEmail').textContent ? $('fEmail') : $('fMessage'))).focus();
        return;
      }

      var body = 'Name: ' + name + '\nEmail: ' + email + '\nInstitution: ' + (org || '—') +
        '\nRequest: ' + kind + '\n\n' + message;
      $('resultBody').textContent = body;
      $('resultSend').setAttribute('href',
        'mailto:i.barros@chromosphere.space?subject=' + encodeURIComponent('Chromosphere enquiry — ' + (org || name)) +
        '&body=' + encodeURIComponent(body));
      result.hidden = false;
      status.textContent = 'Enquiry prepared. Nothing has left this page.';
      result.focus();
    });
  }

  function bindMenu() {
    var btn = $('menuBtn');
    var nav = $('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  window.__solar = {
    flare: flare,
    cme: cme,
    loop: loop,
    read: function () { return { flare: flare(), cme: cme(), loop: loop() }; },
    set: function (name, value) { var el = $(name); if (el) { el.value = String(value); render(); } }
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindBench();
    bindFilters();
    bindForm();
  });
})();
