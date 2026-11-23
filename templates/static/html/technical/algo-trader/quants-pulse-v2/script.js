/* ============================================================
   NOWAK SYSTEMS — sheet behaviour
   No audio anywhere on this site: quantitative development is
   read from sheets and logs; nothing here teaches through
   sound, so the site is silent by ruling, not by omission.
   The stub's ticker synth and candle canvas were removed.
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

/* ---------- mobile sheet-index panel ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a.mlink');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var closeTimer = null;
  function open() {
    clearTimeout(closeTimer);
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    /* Focus inside rAF, after the panel is rendered — focusing a
       still-hidden panel is a silent no-op. */
    requestAnimationFrame(function () {
      panel.classList.add('open');
      if (firstLink) firstLink.focus();
    });
  }
  function close() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    closeTimer = setTimeout(function () { panel.hidden = true; }, reduced ? 0 : 300);
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
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function gbp(n, dp) {
  var neg = n < 0;
  var s = Math.abs(n).toLocaleString('en-GB', {
    minimumFractionDigits: dp, maximumFractionDigits: dp
  });
  return (neg ? '−£' : '£') + s;
}
function trimNum(n) {
  return (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
}

/* ---------- Worksheet C-1: cost drag calculator ---------- */
(function () {
  var sheet = document.querySelector('.worksheet');
  if (!sheet) return;

  /* The cost model is parsed from the printed table, so the tool
     and the page cannot disagree. */
  var costTotal = 0;
  sheet.querySelectorAll('tr[data-bps]').forEach(function (row) {
    costTotal += parseFloat(row.getAttribute('data-bps'));
  });
  costTotal = Math.round(costTotal * 10) / 10;
  var ct = document.getElementById('costTotal');
  if (ct) ct.textContent = trimNum(costTotal);

  var state = { edge: 4.5, size: 25000, trades: 40, days: 250 };
  var cfg = {
    edge:   { step: 0.5,  min: 0,    max: 12,     fmt: function (v) { return trimNum(v) + ' bps'; } },
    size:   { step: 5000, min: 5000, max: 250000, fmt: function (v) { return gbp(v, 0); } },
    trades: { step: 10,   min: 10,   max: 500,    fmt: function (v) { return String(v); } },
    days:   { step: 5,    min: 50,   max: 300,    fmt: function (v) { return String(v); } }
  };

  function render() {
    Object.keys(cfg).forEach(function (k) {
      var el = document.getElementById('val-' + k);
      if (el) el.textContent = cfg[k].fmt(state[k]);
    });
    var tradesYr = state.trades * state.days;
    var grossTrade = state.size * state.edge / 10000;
    var grossYr = grossTrade * tradesYr;
    var costTrade = state.size * costTotal / 10000;
    var dragYr = costTrade * tradesYr;
    var netTrade = grossTrade - costTrade;
    var netYr = grossYr - dragYr;
    var share = grossYr > 0 ? (dragYr / grossYr * 100) : 0;

    document.getElementById('wTrades').textContent =
      state.trades + ' × ' + state.days + ' = ' + tradesYr.toLocaleString('en-GB');
    document.getElementById('wGrossTrade').textContent = gbp(grossTrade, 2);
    document.getElementById('wGrossYr').textContent = gbp(grossYr, 0);
    document.getElementById('wCostLabel').textContent = 'Cost per trade (' + trimNum(costTotal) + ' bps)';
    document.getElementById('wCostTrade').textContent = gbp(costTrade, 2);
    document.getElementById('wDragYr').textContent = gbp(dragYr, 0);
    document.getElementById('wShare').textContent =
      (Math.round(share * 10) / 10).toString().replace(/\.0$/, '') + '% of gross';
    document.getElementById('wNetYr').textContent = gbp(netYr, 0);
    document.getElementById('wNetTrade').textContent = gbp(netTrade, 2);
    document.getElementById('wBreakeven').textContent = trimNum(costTotal) + ' bps';

    var stamp = document.getElementById('verdictStamp');
    var text = document.getElementById('verdictText');
    if (netYr > 0) {
      stamp.textContent = 'Reconciles — the edge survives';
      stamp.classList.remove('bad');
      text.textContent = 'At ' + trimNum(state.edge) + ' bps the claim clears its costs with ' +
        gbp(netTrade, 2) + ' per trade to spare. The audit\u2019s job is to check whether the ' +
        trimNum(state.edge) + ' was ever real.';
    } else {
      stamp.textContent = 'Does not reconcile — the edge is the costs';
      stamp.classList.add('bad');
      text.textContent = 'At ' + trimNum(state.edge) + ' bps the strategy pays ' +
        gbp(Math.abs(netTrade), 2) + ' on every trade before it earns a penny — costs take ' +
        (Math.round(share * 10) / 10).toString().replace(/\.0$/, '') +
        '% of the gross. Below the ' + trimNum(costTotal) + ' bps breakeven, more trading is just more cost.';
    }
  }

  sheet.querySelectorAll('.stepper').forEach(function (st) {
    var key = st.getAttribute('data-key');
    if (!key || !cfg[key]) return;
    st.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        var next = Math.round((state[key] + dir * cfg[key].step) * 10) / 10;
        state[key] = Math.min(cfg[key].max, Math.max(cfg[key].min, next));
        render();
      });
    });
  });

  render();
})();

/* ---------- engagement estimator ---------- */
(function () {
  var box = document.querySelector('.est-box');
  if (!box) return;

  var rates = {};
  document.querySelectorAll('tr[data-rate]').forEach(function (row) {
    rates[row.getAttribute('data-ekey')] = parseFloat(row.getAttribute('data-rate'));
  });
  var state = { audit: 4, build: 6, risk: true };
  var cfg = {
    audit: { step: 1, min: 0, max: 20, suffix: ' days' },
    build: { step: 1, min: 0, max: 30, suffix: ' days' }
  };

  function render() {
    document.getElementById('eval-audit').textContent = state.audit + ' days';
    document.getElementById('eval-build').textContent = state.build + ' days';
    var a = state.audit * rates.audit;
    var b = state.build * rates.build;
    var r = state.risk ? rates.risk : 0;
    document.getElementById('eAudit').textContent =
      state.audit + ' × ' + gbp(rates.audit, 0) + ' = ' + gbp(a, 0);
    document.getElementById('eBuild').textContent =
      state.build + ' × ' + gbp(rates.build, 0) + ' = ' + gbp(b, 0);
    document.getElementById('eRisk').textContent =
      state.risk ? gbp(rates.risk, 0) : 'Not included';
    document.getElementById('eTotal').textContent = gbp(a + b + r, 0);
    var t = document.getElementById('riskToggle');
    t.setAttribute('aria-pressed', state.risk ? 'true' : 'false');
    t.textContent = state.risk ? 'Included' : 'Not included';
  }

  box.querySelectorAll('.stepper').forEach(function (st) {
    var key = st.getAttribute('data-ekey');
    if (!key || !cfg[key]) return;
    st.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = parseInt(btn.getAttribute('data-dir'), 10);
        state[key] = Math.min(cfg[key].max, Math.max(cfg[key].min, state[key] + dir * cfg[key].step));
        render();
      });
    });
  });
  document.getElementById('riskToggle').addEventListener('click', function () {
    state.risk = !state.risk;
    render();
  });

  render();
})();

/* ---------- enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var conf = document.getElementById('confirmation');

  function check(id, errId, ok) {
    var err = document.getElementById(errId);
    if (err) err.hidden = ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName').value.trim();
    var email = document.getElementById('fEmail').value.trim();
    var firm = document.getElementById('fFirm').value.trim();
    var type = document.getElementById('fType').value;
    var msg = document.getElementById('fMsg').value.trim();

    var ok = true;
    ok = check('fName', 'eName', name.length > 0) && ok;
    ok = check('fEmail', 'eEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = check('fFirm', 'eFirm', firm.length > 0) && ok;
    ok = check('fMsg', 'eMsg', msg.length >= 10) && ok;
    if (!ok) return;

    var ref = 'NS-2026-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('confRef').textContent = ref;
    document.getElementById('confText').textContent =
      'Thank you, ' + name + ' (' + firm + '). Your enquiry — ' + type +
      ' — has been recorded under this reference.';
    form.hidden = true;
    conf.hidden = false;
    conf.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
})();
