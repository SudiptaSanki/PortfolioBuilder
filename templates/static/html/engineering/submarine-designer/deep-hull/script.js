/* Deep Hull — shared script.
   Sound ruling: NONE. A sonar ping is decoration, not information;
   it fails the need-test and there is no audio code on this site.
   The stub's ping canvas was deleted, not rebuilt. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces an unhandled rejection; the navigation
     itself always completes. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ("Frames" panel) ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var open = false;
    function setOpen(state, focusWhere) {
      open = state;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      } else if (focusWhere === 'btn') {
        btn.focus();
      }
    }
    btn.addEventListener('click', function () { setOpen(!open); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false, 'btn');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
  }

  /* ---------- reveal on scroll (opacity/translate only) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Depth & Shell Explorer (index) ----------
     p = rho * g * h   (rho = 1025 kg/m3 seawater, g = 9.81)
     sigma = p * r / t (membrane hoop stress, thin cylinder) */
  var depthEl = document.getElementById('ctlDepth');
  if (depthEl) {
    var RHO = 1025, G = 9.81, YIELD = 552; /* HY-80 yield, MPa */
    var thickEl = document.getElementById('ctlThick');
    var depthOut = document.getElementById('depthOut');
    var thickOut = document.getElementById('thickOut');
    var radiusBtns = Array.prototype.slice.call(document.querySelectorAll('#radiusSeg button'));
    var oP = document.getElementById('outPressure');
    var oBar = document.getElementById('outPressureBar');
    var oS = document.getElementById('outStress');
    var oU = document.getElementById('outUtil');
    var oDepthEcho = document.getElementById('outDepthEcho');
    var verdictText = document.getElementById('verdictText');
    var pbarFill = document.getElementById('pbarFill');
    var gaugeMark = document.getElementById('gaugeMark');
    var radius = 1.0;

    function fmt(n, d) { return n.toFixed(d); }

    function render() {
      var h = parseFloat(depthEl.value);          /* m */
      var t = parseFloat(thickEl.value);          /* mm */
      var pMPa = RHO * G * h / 1e6;
      var pBar = RHO * G * h / 1e5;
      var sigma = pMPa * (radius * 1000) / t;     /* MPa */
      var util = sigma / YIELD * 100;

      depthOut.textContent = h + ' m';
      thickOut.textContent = t + ' mm';
      oDepthEcho.textContent = h + ' m';
      oP.innerHTML = fmt(pMPa, 2) + ' <span class="unit">MPa</span>';
      oBar.textContent = fmt(pBar, 1) + ' bar';
      oS.innerHTML = Math.round(sigma) + ' <span class="unit">MPa</span>';
      oU.innerHTML = fmt(util, 1) + ' <span class="unit">%</span>';
      if (pbarFill) pbarFill.style.width = Math.min(100, h / 1500 * 100) + '%';
      if (gaugeMark) {
        var y = 30 + (h / 1500) * 120; /* gauge scale 30..150 in the drawing */
        gaugeMark.setAttribute('y1', y); gaugeMark.setAttribute('y2', y);
      }
      if (util >= 100) {
        verdictText.textContent = 'The membrane stress alone passes the yield point of HY-80. This shell fails by yielding \u2014 buckling never gets a say. It needs more thickness, a smaller radius, a stronger steel, or a shallower rating.';
      } else if (util >= 55) {
        verdictText.textContent = 'Membrane stress is a large share of yield. In practice the buckling check governs long before this point: frame spacing, frame size and the as-built out-of-roundness decide whether this shell is acceptable \u2014 and none of those appears in a membrane sum.';
      } else {
        verdictText.textContent = 'Membrane stress sits comfortably inside yield \u2014 which proves very little. Pressure hulls are lost to buckling, not to membrane stress: the shell gives way sideways between its frames. The real check is the collapse calculation, run to the classification rule factor with the measured out-of-roundness, not an assumed one.';
      }
    }
    depthEl.addEventListener('input', render);
    thickEl.addEventListener('input', render);
    radiusBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        radiusBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        radius = parseFloat(b.getAttribute('data-r'));
        render();
      });
    });
    render();
  }

  /* ---------- Plate renewal estimator (index) ----------
     tonnage = area * (t/1000) * 7.85  (steel density, t/m3) */
  var estArea = document.getElementById('estArea');
  if (estArea) {
    var estThick = document.getElementById('estThick');
    var estTonnes = document.getElementById('estTonnes');
    var estBand = document.getElementById('estBand');
    var estWork = document.getElementById('estWork');
    var RATE_LO = 9800, RATE_HI = 13500;
    function money(n) {
      var r = Math.round(n / 100) * 100;
      return '\u00a3' + r.toLocaleString('en-GB');
    }
    function renderEst() {
      var a = parseFloat(estArea.value);
      var t = parseFloat(estThick.value);
      if (!isFinite(a) || a <= 0) {
        estTonnes.textContent = '\u2014';
        estBand.textContent = 'Enter a plate area to size the renewal.';
        estWork.textContent = '';
        return;
      }
      var tonnes = a * (t / 1000) * 7.85;
      /* round half-up like a pencil would: 3.925 t prints as 3.93 t */
      var tonnesTxt = (Math.round((tonnes + 1e-9) * 100) / 100).toFixed(2);
      estTonnes.textContent = tonnesTxt + ' t';
      estBand.textContent = money(tonnes * RATE_LO) + ' \u2013 ' + money(tonnes * RATE_HI);
      estWork.textContent = a + ' m\u00b2 \u00d7 ' + t + ' mm \u00d7 7.85 t/m\u00b3 = ' + tonnesTxt + ' t of steel';
    }
    estArea.addEventListener('input', renderEst);
    estThick.addEventListener('change', renderEst);
    renderEst();
  }

  /* ---------- enquiry form (contact) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var refEl = document.getElementById('confirmRef');
    var againBtn = document.getElementById('againBtn');

    /* ?type= preselect, e.g. contact.html?type=survey */
    var params = new URLSearchParams(window.location.search);
    var typeParam = params.get('type');
    var typeSel = document.getElementById('fType');
    if (typeParam && typeSel) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === typeParam) { typeSel.selectedIndex = i; break; }
      }
    }

    function fieldWrap(input) { return input.closest('.field'); }
    function validate(input) {
      var wrap = fieldWrap(input);
      if (!wrap) return true;
      var bad = false;
      if (input.hasAttribute('required') && !input.value.trim()) bad = true;
      if (!bad && input.type === 'email' && input.value.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) bad = true;
      wrap.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', String(bad));
      return !bad;
    }
    ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { validate(el); });
      /* clear a shown error as the visitor types, so the layout has
         settled long before they reach the submit button */
      el.addEventListener('input', function () {
        var wrap = fieldWrap(el);
        if (wrap && wrap.classList.contains('invalid')) validate(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = ['fName', 'fEmail', 'fMsg'];
      var allOk = true, firstBad = null;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !validate(el)) { allOk = false; if (!firstBad) firstBad = el; }
      });
      if (!allOk) { if (firstBad) firstBad.focus(); return; }
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var seed = (name + '|' + email).split('').reduce(function (s, c) { return s + c.charCodeAt(0); }, 0);
      var ref = 'DH-2026-' + (100 + (seed % 900));
      refEl.textContent = ref;
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    if (againBtn) {
      againBtn.addEventListener('click', function () {
        form.reset();
        form.style.display = '';
        confirmBox.classList.remove('show');
        var first = document.getElementById('fName');
        if (first) first.focus();
      });
    }
  }
})();
