/* Spectrum Log — shared behaviour.
   Menu, reveal, the line-shift converter, the programme
   estimator, and the enquiry form. Each block runs only on
   pages that contain its elements. */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a
     navigation is interrupted; Chrome reports the abort as an
     unhandled rejection. Swallow only that specific case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- mobile log-index panel ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.getElementById('indexPanel');
  var scrim = document.getElementById('scrim');
  if (menuBtn && panel) {
    var closeBtn = panel.querySelector('.panel-close');
    var firstLink = panel.querySelector('nav a');
    function openPanel() {
      panel.classList.add('open');
      if (scrim) scrim.classList.add('on');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        if (closeBtn) closeBtn.focus();
      });
    }
    function closePanel() {
      panel.classList.remove('open');
      if (scrim) scrim.classList.remove('on');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      menuBtn.focus();
    }
    menuBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (scrim) scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
    if (firstLink) { /* links navigate normally; panel state resets on load */ }
  }

  /* ---------------- reveal on scroll ---------------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- line-shift converter ---------------- */
  var F0 = 1420.4;          /* MHz — hydrogen line rest frequency used throughout */
  var C = 299792;           /* km/s */
  var FMIN = 1416.0, FMAX = 1424.8;

  var slider = document.getElementById('freqRange');
  if (slider) {
    var freqVal = document.getElementById('freqVal');
    var dfOut = document.getElementById('dfOut');
    var ratioOut = document.getElementById('ratioOut');
    var velOut = document.getElementById('velOut');
    var verdictV = document.getElementById('verdictV');
    var verdictDir = document.getElementById('verdictDir');
    var obsMarker = document.getElementById('obsMarker');
    var obsFlag = document.getElementById('obsFlag');
    var presets = document.querySelectorAll('.preset[data-freq]');
    var cur = F0;

    function fmt(n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }
    function signed(n, dp) { return (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), dp); }
    function xFor(f) { return ((f - FMIN) / (FMAX - FMIN)) * 640; }

    function render() {
      var df = F0 - cur;
      var ratio = df / F0;
      var v = C * ratio;
      slider.value = cur.toFixed(1);
      freqVal.textContent = cur.toFixed(1);
      dfOut.textContent = signed(df, 1) + ' MHz';
      ratioOut.textContent = signed(ratio, 6);
      velOut.textContent = signed(v, 1) + ' km/s';
      var x = xFor(cur).toFixed(1);
      if (obsMarker) { obsMarker.setAttribute('x1', x); obsMarker.setAttribute('x2', x); }
      if (obsFlag) { obsFlag.setAttribute('transform', 'translate(' + x + ',0)'); }
      verdictV.textContent = signed(v, 1) + ' km/s';
      if (Math.abs(v) < 0.05) {
        verdictV.className = 'v rest';
        verdictDir.textContent = 'At the rest frequency — no shift. The line sits where the hydrogen atom put it.';
      } else if (v > 0) {
        verdictV.className = 'v recede';
        verdictDir.textContent = 'Observed below the rest frequency — the source is receding. Redshifted.';
      } else {
        verdictV.className = 'v approach';
        verdictDir.textContent = 'Observed above the rest frequency — the source is approaching. Blueshifted.';
      }
      presets.forEach(function (b) {
        b.setAttribute('aria-pressed', Math.abs(parseFloat(b.getAttribute('data-freq')) - cur) < 0.001 ? 'true' : 'false');
      });
    }
    function setFreq(f) {
      cur = Math.round(Math.min(FMAX, Math.max(FMIN, f)) * 10) / 10;
      render();
    }
    slider.addEventListener('input', function () { setFreq(parseFloat(slider.value)); });
    document.getElementById('stepDown').addEventListener('click', function () { setFreq(cur - 0.1); });
    document.getElementById('stepUp').addEventListener('click', function () { setFreq(cur + 0.1); });
    presets.forEach(function (b) {
      b.addEventListener('click', function () { setFreq(parseFloat(b.getAttribute('data-freq'))); });
    });
    render();
  }

  /* ---------------- programme estimator ---------------- */
  var estRows = document.querySelectorAll('.est-row[data-rate]');
  if (estRows.length) {
    var FLAT = 240;
    var estTotal = document.getElementById('estTotal');
    function gbp(n) { return '£' + n.toLocaleString('en-GB'); }
    function estRender() {
      var total = FLAT;
      estRows.forEach(function (row) {
        var days = parseInt(row.getAttribute('data-days'), 10) || 0;
        var rate = parseInt(row.getAttribute('data-rate'), 10) || 0;
        var line = days * rate;
        total += line;
        row.querySelector('.n').textContent = days;
        row.querySelector('.est-line').textContent = gbp(line);
      });
      estTotal.textContent = gbp(total);
    }
    estRows.forEach(function (row) {
      row.querySelectorAll('.day-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var days = parseInt(row.getAttribute('data-days'), 10) || 0;
          days += parseInt(btn.getAttribute('data-delta'), 10);
          days = Math.max(0, Math.min(30, days));
          row.setAttribute('data-days', days);
          estRender();
        });
      });
    });
    estRender();
  }

  /* ---------------- enquiry form ---------------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function setErr(id, msg) {
      var field = document.getElementById(id);
      var err = document.getElementById(id + 'Err');
      if (msg) {
        field.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.hidden = false; }
        return false;
      }
      field.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
      return true;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName');
      var email = document.getElementById('fEmail');
      var service = document.getElementById('fService');
      var msg = document.getElementById('fMsg');
      var ok = true;
      ok = setErr('fName', name.value.trim().length >= 2 ? '' : 'Please give your name.') && ok;
      ok = setErr('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Please give a valid email address.') && ok;
      ok = setErr('fService', service.value ? '' : 'Please choose the service closest to your need.') && ok;
      ok = setErr('fMsg', msg.value.trim().length >= 20 ? '' : 'A little more detail, please — at least 20 characters. What is the data, and what is the deadline?') && ok;
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (name.value.trim() + email.value.trim()).split('').reduce(function (a, ch) {
        return ((a * 31) + ch.charCodeAt(0)) % 9973;
      }, 7);
      var ref = 'SL-' + new Date().getFullYear() + '-' + String(1000 + seed);
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = name.value.trim();
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.querySelector('h3').focus();
    });
    ['fName', 'fEmail', 'fService', 'fMsg'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { setErr(id, ''); });
      el.addEventListener('change', function () { setErr(id, ''); });
    });
  }

  /* footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
