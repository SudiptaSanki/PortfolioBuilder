/* ============================================================
   HALVORSEN INTERFEROMETRY — bench behaviour
   No audio anywhere on this site: the need-test fails for
   interferometry (the work is silent; nothing here teaches
   through sound), so the site is silent by ruling, not by
   omission. The ruling is printed in the footer.
   ============================================================ */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort noisily in Chromium when
   interrupted; the navigation itself always completes. Swallow
   only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile log-index panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a.mlink');
  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    /* Focus inside rAF, after the panel is rendered — focusing a
       still-hidden panel is a silent no-op. */
    requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    btn.focus();
  }
  btn.addEventListener('click', open);
  panel.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
})();

/* ---------- reveal on scroll ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function fmtLen(nm) {
  if (nm >= 1e9) return (nm / 1e9).toFixed(1) + ' m';
  if (nm >= 1e6) return (nm / 1e6).toFixed(1) + ' mm';
  if (nm >= 1e3) return (nm / 1e3).toFixed(1) + ' µm';
  return nm.toFixed(1) + ' nm';
}
function fmtDL(nm) {
  return (Math.round(nm * 10) / 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ============================================================
   ENTRY 01 — the phase & fringe tool.
   The tool reads its source data from Table 1 as printed on the
   page (the data-lambda / data-dlambda attributes on the very
   rows the visitor reads), so the tool and the table can never
   quietly disagree.
   ============================================================ */
(function () {
  var table = document.getElementById('src-table');
  if (!table) return;
  var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
  var srcBtns = Array.prototype.slice.call(document.querySelectorAll('.src-btn'));
  var sources = rows.map(function (tr, i) {
    return {
      lambda: parseFloat(tr.getAttribute('data-lambda')),
      dlambda: parseFloat(tr.getAttribute('data-dlambda')),
      name: srcBtns[i] ? srcBtns[i].querySelector('.sn').textContent : 'Source'
    };
  });

  var slider = document.getElementById('dlSlider');
  var dlVal = document.getElementById('dlVal');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var rN = document.getElementById('rN'), rPhi = document.getElementById('rPhi'),
      rWrap = document.getElementById('rWrap'), rLc = document.getElementById('rLc'),
      rPct = document.getElementById('rPct'), rSrc = document.getElementById('rSrc');
  var wN = document.getElementById('wN'), wPhi = document.getElementById('wPhi'),
      wLc = document.getElementById('wLc');
  var visText = document.getElementById('visText');
  var strip = document.getElementById('fringeStrip');

  /* Build the fringe strip: 36 bars across 720 units. */
  var NS = 'http://www.w3.org/2000/svg';
  var bars = [];
  for (var i = 0; i < 36; i++) {
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', i * 20 + 3);
    rect.setAttribute('y', 4);
    rect.setAttribute('width', 14);
    rect.setAttribute('height', 56);
    rect.setAttribute('fill', '#ff6a3d');
    strip.appendChild(rect);
    bars.push(rect);
  }

  var state = { src: 0, dL: 316.4 };

  function visBand(pct) {
    if (pct >= 100) return 'Gone. The path difference is past this source\u2019s coherence length \u2014 there are no fringes here to read, and any instrument claiming otherwise is reading noise.';
    if (pct >= 50) return 'Faint. More than half the coherence length is spent; a careful bench can still count these fringes, a production floor cannot.';
    if (pct >= 10) return 'Fading. Contrast is leaving the pattern \u2014 this is the region where fringe counters start to miss, and start to lie about missing.';
    if (pct >= 1) return 'Strong. A small share of the coherence length is spent; the pattern is steady and countable.';
    return 'Crisp. The path difference is a rounding error against this source\u2019s coherence length.';
  }

  function render() {
    var s = sources[state.src];
    var lam = s.lambda, dl = state.dL;
    var Lc = lam * lam / s.dlambda;              /* nm */
    var N = dl / lam;                            /* fringes */
    var phi = 2 * Math.PI * N;                   /* rad */
    var wrap = phi % (2 * Math.PI);
    var pct = Lc > 0 ? (100 * dl / Lc) : 0;

    dlVal.textContent = fmtDL(dl);
    if (document.activeElement !== slider) slider.value = dl;
    rN.textContent = N.toFixed(3);
    rPhi.innerHTML = phi.toFixed(3) + ' <em>rad</em>';
    rWrap.innerHTML = wrap.toFixed(2) + ' <em>rad</em>';
    var lcParts = fmtLen(Lc).split(' ');
    rLc.innerHTML = lcParts[0] + ' <em>' + lcParts[1] + '</em>';
    rPct.innerHTML = pct.toFixed(1) + '<em>%</em>';
    rSrc.textContent = s.name;

    wN.innerHTML = 'N = &Delta;L &divide; &lambda; = ' + fmtDL(dl) + ' &divide; ' + lam +
      ' = <span class="res">' + N.toFixed(3) + ' fringes</span>';
    wPhi.innerHTML = '&Delta;&phi; = 2&pi; &times; N = 2&pi; &times; ' + N.toFixed(3) +
      ' = <span class="res">' + phi.toFixed(3) + ' rad</span>';
    wLc.innerHTML = 'L<sub>c</sub> = &lambda;&sup2; &divide; &Delta;&lambda; = ' + lam + '&sup2; &divide; ' +
      s.dlambda + ' = <span class="res">' + fmtInt(Lc) + ' nm &asymp; ' + fmtLen(Lc) + '</span>';

    visText.textContent = visBand(pct);

    /* Fringe strip: intensity I = 1/2 + 1/2 · vis · cos(2π(i/6 + N)),
       six bars per fringe period; vis is the printed straight-line
       rule of thumb, vis = 1 − ΔL/L_c, floored at zero. */
    var vis = Math.max(0, 1 - dl / Lc);
    for (var j = 0; j < bars.length; j++) {
      var inten = 0.5 + 0.5 * vis * Math.cos(2 * Math.PI * (j / 6 + N));
      bars[j].setAttribute('opacity', (0.07 + 0.93 * inten).toFixed(3));
    }
  }

  srcBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      state.src = i;
      srcBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      render();
    });
  });
  slider.addEventListener('input', function () {
    state.dL = parseFloat(slider.value);
    chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    render();
  });
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var mult = parseFloat(c.getAttribute('data-mult'));
      state.dL = mult * sources[state.src].lambda;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      render();
    });
  });

  render();
})();

/* ============================================================
   ENTRY 03 — the engagement estimator.
   Rates are read from the printed fee table (data-rate on the
   rows), so the estimator and the table cannot disagree either.
   ============================================================ */
(function () {
  var feeTable = document.getElementById('fee-table');
  if (!feeTable) return;
  var rates = {};
  feeTable.querySelectorAll('tbody tr').forEach(function (tr, i) {
    rates[['design', 'support', 'survey', 'cal'][i]] = parseFloat(tr.getAttribute('data-rate'));
  });

  var st = { design: 6, support: 2, survey: true, cal: true };
  var dVal = document.getElementById('dVal'), sVal = document.getElementById('sVal');
  var lines = document.getElementById('estLines'), total = document.getElementById('estTotal');
  var surveyTgl = document.getElementById('surveyTgl'), calTgl = document.getElementById('calTgl');

  function money(n) { return '&euro;' + fmtInt(n); }
  function renderEst() {
    dVal.textContent = st.design;
    sVal.textContent = st.support;
    surveyTgl.setAttribute('aria-pressed', st.survey ? 'true' : 'false');
    surveyTgl.textContent = st.survey ? 'INCLUDED' : 'EXCLUDED';
    calTgl.setAttribute('aria-pressed', st.cal ? 'true' : 'false');
    calTgl.textContent = st.cal ? 'INCLUDED' : 'EXCLUDED';
    var html = '', tot = 0;
    function line(label, calc, amt) {
      html += '<div class="el"><span>' + label + ' &mdash; ' + calc + '</span><span>' + money(amt) + '</span></div>';
      tot += amt;
    }
    line('Design &amp; build', st.design + ' days &times; ' + money(rates.design), st.design * rates.design);
    line('Commissioning &amp; support', st.support + ' days &times; ' + money(rates.support), st.support * rates.support);
    if (st.survey) line('Environmental survey', 'fixed', rates.survey);
    if (st.cal) line('Calibration + budget', 'per system', rates.cal);
    lines.innerHTML = html;
    total.innerHTML = money(tot);
  }
  function bindStepper(minusId, plusId, key, min, max) {
    document.getElementById(minusId).addEventListener('click', function () {
      if (st[key] > min) { st[key]--; renderEst(); }
    });
    document.getElementById(plusId).addEventListener('click', function () {
      if (st[key] < max) { st[key]++; renderEst(); }
    });
  }
  bindStepper('dMinus', 'dPlus', 'design', 0, 30);
  bindStepper('sMinus', 'sPlus', 'support', 0, 20);
  surveyTgl.addEventListener('click', function () { st.survey = !st.survey; renderEst(); });
  calTgl.addEventListener('click', function () { st.cal = !st.cal; renderEst(); });
  renderEst();
})();

/* ============================================================
   Contact — the demonstration form. Validation is real; the
   transmission is not, and the page says so in both places.
   ============================================================ */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var refOut = document.getElementById('refOut');

  function check(id, ok) {
    var fld = document.getElementById(id);
    fld.classList.toggle('invalid', !ok);
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMsg');
    var okName = check('fld-name', name.value.trim().length > 1);
    var okEmail = check('fld-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()));
    var okMsg = check('fld-msg', msg.value.trim().length > 3);
    if (!(okName && okEmail && okMsg)) {
      var firstBad = form.querySelector('.fld.invalid input, .fld.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'HB-2026-' + Math.floor(1000 + Math.random() * 9000);
    refOut.textContent = ref;
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });
  ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      this.closest('.fld').classList.remove('invalid');
    });
  });
})();
