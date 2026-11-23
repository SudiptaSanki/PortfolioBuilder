/* ============================================================
   VAN DER MEER TETHER DYNAMICS — log behaviour
   No audio anywhere on this site: the need-test fails for
   tether dynamics (the work is read from traces, tables and
   simulation output; nothing here teaches through sound),
   so the site is silent by ruling, not by omission. The
   ruling is printed in the footer.
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

/* ---------- mobile flight-log panel ---------- */
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
function fmtT(T) { return T >= 100 ? fmtInt(T) : T.toFixed(2); }

/* ============================================================
   ENTRY 01 — the tension sizer.
   The sizer reads its orbit periods from Table 1 and its
   material figures from Table 2, exactly as printed on the
   page (data attributes on the very rows the visitor reads),
   so the tool and the tables can never quietly disagree.
   Relation: T ≈ (3/2) · m · n² · L,  n = 2π / T_orbit.
   Working stress = breaking strength ÷ 4 (printed factor).
   The near-massless assumption is flagged against the
   practice's printed tolerance: trusted to 5%, marginal to
   10% of tip mass, failed above 10%.
   ============================================================ */
(function () {
  var oTable = document.getElementById('orbit-table');
  if (!oTable) return;
  var mTable = document.getElementById('mat-table');
  var oRows = Array.prototype.slice.call(oTable.querySelectorAll('tbody tr'));
  var mRows = Array.prototype.slice.call(mTable.querySelectorAll('tbody tr'));
  var orbits = oRows.map(function (tr) {
    return { period: parseFloat(tr.getAttribute('data-period')) };
  });
  var mats = mRows.map(function (tr, i) {
    return {
      sigb: parseFloat(tr.getAttribute('data-sigb')),       /* GPa */
      rho: parseFloat(tr.getAttribute('data-rho')),         /* kg/m3 */
      name: ['Aramid braid', 'UHMWPE braid', 'PBO fibre', 'Steel wire'][i]
    };
  });
  var orbBtns = Array.prototype.slice.call(document.querySelectorAll('.orb-btn'));
  var matBtns = Array.prototype.slice.call(document.querySelectorAll('.mat-btn'));
  var lenChips = Array.prototype.slice.call(document.querySelectorAll('.len-chip'));

  var st = { orb: 0, mat: 0, mass: 100, len: 10 };
  var mVal = document.getElementById('mVal'), mValLab = document.getElementById('mValLab');
  var lVal = document.getElementById('lVal'), lValLab = document.getElementById('lValLab');
  var wTorb = document.getElementById('wTorb'), wN = document.getElementById('wN'),
      wT = document.getElementById('wT'), wSigma = document.getElementById('wSigma'),
      wArea = document.getElementById('wArea'), wLam = document.getElementById('wLam');
  var rT = document.getElementById('rT'), rDia = document.getElementById('rDia'),
      rMass = document.getElementById('rMass'), rRatio = document.getElementById('rRatio');
  var verdict = document.getElementById('verdict'),
      vHead = document.getElementById('vHead'), vText = document.getElementById('vText');

  function render() {
    var o = orbits[st.orb], mt = mats[st.mat];
    var Torb = o.period * 60;                              /* s */
    var n = 2 * Math.PI / Torb;                            /* rad/s */
    var Lm = st.len * 1000;
    var T = 1.5 * st.mass * n * n * Lm;                    /* N */
    var sigAllow = mt.sigb * 1e9 / 4;                      /* Pa */
    var A = T / sigAllow;                                  /* m2 */
    var diaMm = Math.sqrt(4 * A / Math.PI) * 1000;
    var lamKg = A * mt.rho;                                /* kg/m */
    var tMass = lamKg * Lm;                                /* kg */
    var ratio = 100 * tMass / st.mass;                     /* % */

    mVal.textContent = st.mass + ' kg'; mValLab.textContent = st.mass + ' kg';
    lVal.textContent = st.len + ' km'; lValLab.textContent = st.len + ' km';
    lenChips.forEach(function (c) {
      c.setAttribute('aria-pressed', parseFloat(c.getAttribute('data-len')) === st.len ? 'true' : 'false');
    });
    oRows.forEach(function (tr, i) { tr.classList.toggle('hl', i === st.orb); });
    mRows.forEach(function (tr, i) { tr.classList.toggle('hl', i === st.mat); });

    wTorb.innerHTML = 'T<sub>orbit</sub> = ' + o.period.toFixed(1) + ' min &times; 60 = <span class="res">' + fmtInt(Torb) + ' s</span>';
    wN.innerHTML = 'n = 2&pi; &divide; ' + fmtInt(Torb) + ' = <span class="res">' + (n * 1000).toFixed(3) + ' &times; 10<sup>&minus;3</sup> rad/s</span>';
    wT.innerHTML = 'T = 1.5 &times; ' + st.mass + ' kg &times; n&sup2; &times; ' + fmtInt(Lm) + ' m = <span class="res">' + fmtT(T) + ' N</span>';
    wSigma.innerHTML = '&sigma;<sub>working</sub> = ' + mt.sigb.toFixed(1) + ' GPa &divide; 4 = <span class="res">' + fmtInt(sigAllow / 1e6) + ' MPa</span> (' + mt.name + ')';
    wArea.innerHTML = 'A = T &divide; &sigma;<sub>working</sub> = <span class="res">' + (A * 1e6).toFixed(4) + ' mm&sup2;</span> &rarr; line &Oslash; <span class="res">' + diaMm.toFixed(3) + ' mm</span>';
    wLam.innerHTML = 'line mass = A &times; &rho; = <span class="res">' + (lamKg * 1000).toFixed(3) + ' g/m</span> &rarr; over ' + st.len + ' km: <span class="res">' + tMass.toFixed(2) + ' kg</span>';

    rT.innerHTML = fmtT(T) + ' <em>N</em>';
    rDia.innerHTML = diaMm.toFixed(3) + ' <em>mm</em>';
    rMass.innerHTML = tMass.toFixed(2) + ' <em>kg</em>';
    rRatio.innerHTML = ratio.toFixed(2) + '<em>%</em>';

    if (ratio <= 5) {
      verdict.setAttribute('data-state', 'holds');
      vHead.textContent = 'ASSUMPTION CHECK — HOLDS';
      vText.textContent = 'The tether\u2019s own mass is ' + ratio.toFixed(2) + '% of the tip mass, inside the practice\u2019s printed tolerance (trusted to 5%). The near-massless reading of the relation is a fair first picture of this system — a first picture, not a flight clearance.';
    } else if (ratio <= 10) {
      verdict.setAttribute('data-state', 'marginal');
      vHead.textContent = 'ASSUMPTION CHECK — MARGINAL';
      vText.textContent = 'The tether\u2019s own mass is ' + ratio.toFixed(2) + '% of the tip mass — past the trusted 5%, inside the printed 10% limit. Treat the tension figure as approximate and iterate with the tether\u2019s mass distributed along its length before quoting it anywhere.';
    } else {
      verdict.setAttribute('data-state', 'fails');
      vHead.textContent = 'ASSUMPTION CHECK — FAILS';
      vText.textContent = 'The tether\u2019s own mass is ' + ratio.toFixed(2) + '% of the tip mass, beyond the printed 10% tolerance. The relation\u2019s answer is no longer about your system: the line is a distributed mass, not a connector, and a bead model is required. This flag is the most useful number on the page.';
    }
  }

  orbBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      st.orb = i;
      orbBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      render();
    });
  });
  matBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      st.mat = i;
      matBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      render();
    });
  });
  lenChips.forEach(function (c) {
    c.addEventListener('click', function () {
      st.len = parseFloat(c.getAttribute('data-len'));
      render();
    });
  });
  document.getElementById('mMinus').addEventListener('click', function () {
    if (st.mass > 25) { st.mass -= 25; render(); }
  });
  document.getElementById('mPlus').addEventListener('click', function () {
    if (st.mass < 2000) { st.mass += 25; render(); }
  });
  document.getElementById('lMinus').addEventListener('click', function () {
    if (st.len > 1) { st.len -= 1; render(); }
  });
  document.getElementById('lPlus').addEventListener('click', function () {
    if (st.len < 100) { st.len += 1; render(); }
  });
  render();
})();

/* ============================================================
   ENTRY 03 — the study estimator.
   Rates are read from the printed fee table (data-rate on the
   rows), so the estimator and the table cannot disagree.
   ============================================================ */
(function () {
  var feeTable = document.getElementById('fee-table');
  if (!feeTable) return;
  var rates = {};
  feeTable.querySelectorAll('tbody tr').forEach(function (tr, i) {
    rates[['analysis', 'sim', 'deployment', 'review'][i]] = parseFloat(tr.getAttribute('data-rate'));
  });

  var st = { days: 8, cases: 2, dep: true, rev: false };
  var aVal = document.getElementById('aVal'), cVal = document.getElementById('cVal');
  var lines = document.getElementById('estLines'), total = document.getElementById('estTotal');
  var depTgl = document.getElementById('depTgl'), revTgl = document.getElementById('revTgl');

  function money(n) { return '&euro;' + fmtInt(n); }
  function renderEst() {
    aVal.textContent = st.days + (st.days === 1 ? ' day' : ' days');
    cVal.textContent = st.cases + (st.cases === 1 ? ' case' : ' cases');
    depTgl.setAttribute('aria-pressed', st.dep ? 'true' : 'false');
    depTgl.textContent = st.dep ? 'INCLUDED' : 'EXCLUDED';
    revTgl.setAttribute('aria-pressed', st.rev ? 'true' : 'false');
    revTgl.textContent = st.rev ? 'INCLUDED' : 'EXCLUDED';
    var html = '', tot = 0;
    function line(label, calc, amt) {
      html += '<div class="el"><span>' + label + ' &mdash; ' + calc + '</span><span>' + money(amt) + '</span></div>';
      tot += amt;
    }
    line('Dynamics analysis', st.days + ' days &times; ' + money(rates.analysis), st.days * rates.analysis);
    line('Simulation cases', st.cases + ' cases &times; ' + money(rates.sim), st.cases * rates.sim);
    if (st.dep) line('Deployment study', 'fixed', rates.deployment);
    if (st.rev) line('Independent design review', 'fixed', rates.review);
    lines.innerHTML = html;
    total.innerHTML = money(tot);
  }
  document.getElementById('aMinus').addEventListener('click', function () {
    if (st.days > 0) { st.days--; renderEst(); }
  });
  document.getElementById('aPlus').addEventListener('click', function () {
    if (st.days < 40) { st.days++; renderEst(); }
  });
  document.getElementById('cMinus').addEventListener('click', function () {
    if (st.cases > 0) { st.cases--; renderEst(); }
  });
  document.getElementById('cPlus').addEventListener('click', function () {
    if (st.cases < 10) { st.cases++; renderEst(); }
  });
  depTgl.addEventListener('click', function () { st.dep = !st.dep; renderEst(); });
  revTgl.addEventListener('click', function () { st.rev = !st.rev; renderEst(); });
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
      var firstBad = form.querySelector('.fld.invalid input, .fld.invalid textarea, .fld.invalid select');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'TD-2026-' + Math.floor(1000 + Math.random() * 9000);
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
