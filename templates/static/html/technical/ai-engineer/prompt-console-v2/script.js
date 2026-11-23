/* prompt-console — Rahman LLM Systems
   Sound ruling: none. No audio is created anywhere in this file;
   the profession is read, not heard, and audio failed the need-test.
   The console is a fixed command index over this site's printed
   content. There is no model behind it — it says so in its boot text. */
(function () {
  'use strict';

  /* ---- View-transition abort guard ----------------------------------
     Cross-document view transitions that get aborted surface as an
     unhandled InvalidStateError rejection. The navigation itself
     always completes; swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile menu: the session index ------------------------------- */
  var btn = document.getElementById('menu-btn');
  var panel = document.getElementById('menu-panel');
  var scrim = document.getElementById('menu-scrim');
  if (btn && panel) {
    var firstLink = panel.querySelector('nav a');
    function openMenu() {
      panel.classList.add('open');
      if (scrim) scrim.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      /* focus inside rAF, after .open makes the panel visible —
         focusing while visibility:hidden is a silent no-op */
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closeMenu(returnFocus) {
      panel.classList.remove('open');
      if (scrim) scrim.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    if (scrim) scrim.addEventListener('click', function () { closeMenu(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
  }

  /* ---- Reveal on scroll (enhancement only) --------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.06 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- Money / number formatting ------------------------------------- */
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtUSD(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtUSD4(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }); }
  function fmtEUR(n) { return '€' + Math.round(n).toLocaleString('en-US'); }

  /* ---- Token prices: parsed from the printed Table 1 ------------------
     The table is the single source of truth; console and panel both
     read it, so the tools cannot disagree with the printed page. */
  var PRICES = {};
  document.querySelectorAll('#price-table tbody tr').forEach(function (tr) {
    PRICES[tr.getAttribute('data-class')] = {
      label: tr.getAttribute('data-label'),
      inPrice: parseFloat(tr.getAttribute('data-in')),
      outPrice: parseFloat(tr.getAttribute('data-out'))
    };
  });

  function computeCost(cls, requests, inTok, outTok) {
    var p = PRICES[cls];
    if (!p) return null;
    var inTotal = requests * inTok;
    var outTotal = requests * outTok;
    var inCost = inTotal / 1e6 * p.inPrice;
    var outCost = outTotal / 1e6 * p.outPrice;
    var total = inCost + outCost;
    return {
      label: p.label, inPrice: p.inPrice, outPrice: p.outPrice,
      inTotal: inTotal, outTotal: outTotal,
      inCost: inCost, outCost: outCost, total: total,
      per: requests > 0 ? total / requests : 0
    };
  }

  function costLines(cls, requests, inTok, outTok) {
    var r = computeCost(cls, requests, inTok, outTok);
    if (!r) return null;
    return [
      { t: 'class     ' + r.label + '  (Table 1: in ' + fmtUSD(r.inPrice) + ' / 1M · out ' + fmtUSD(r.outPrice) + ' / 1M)', c: 'dim' },
      { t: 'input     ' + fmtInt(requests) + ' requests × ' + fmtInt(inTok) + ' tok = ' + fmtInt(r.inTotal) + ' tok → ' + fmtUSD(r.inCost) },
      { t: 'output    ' + fmtInt(requests) + ' requests × ' + fmtInt(outTok) + ' tok = ' + fmtInt(r.outTotal) + ' tok → ' + fmtUSD(r.outCost) },
      { t: 'total     ' + fmtUSD(r.total) + ' per month  →  ' + fmtUSD4(r.per) + ' per request', c: 'grn' },
      { t: 'excludes cached input, retries and eval traffic — the honest bill is this, plus those.', c: 'dim' }
    ];
  }

  /* ---- Cost panel (the no-typing surface) ---------------------------- */
  var costOut = document.getElementById('cost-output');
  if (costOut && Object.keys(PRICES).length) {
    var cClass = document.getElementById('cost-class');
    var cReq = document.getElementById('cost-requests');
    var cIn = document.getElementById('cost-in');
    var cOutTok = document.getElementById('cost-out');
    function markRow(cls) {
      document.querySelectorAll('#price-table tbody tr').forEach(function (tr) {
        if (tr.getAttribute('data-class') === cls) tr.setAttribute('aria-selected', 'true');
        else tr.removeAttribute('aria-selected');
      });
    }
    function runPanel() {
      var cls = cClass.value;
      var req = Math.max(1, parseInt(cReq.value, 10) || 0);
      var it = Math.max(0, parseInt(cIn.value, 10) || 0);
      var ot = Math.max(0, parseInt(cOutTok.value, 10) || 0);
      var lines = costLines(cls, req, it, ot);
      costOut.textContent = lines.map(function (l) { return l.t; }).join('\n');
      markRow(cls);
    }
    document.getElementById('cost-run').addEventListener('click', runPanel);
    [cClass, cReq, cIn, cOutTok].forEach(function (el) { el.addEventListener('change', runPanel); });
    runPanel();
  }

  /* ---- Engagement estimator ------------------------------------------- */
  var estOut = document.getElementById('est-output');
  if (estOut) {
    var RATES = { build: 1250, eval: 1100, harness: 2400 };
    var LIMITS = { build: [2, 40], eval: [0, 20] };
    var state = { build: 10, eval: 4, harness: false };
    var valEls = { build: document.getElementById('est-build-val'), eval: document.getElementById('est-eval-val') };
    var lineEls = { build: document.getElementById('est-build-line'), eval: document.getElementById('est-eval-line') };
    var totalEl = document.getElementById('est-total');
    var harnessBox = document.getElementById('est-harness');
    function renderEst() {
      var bLine = state.build * RATES.build;
      var eLine = state.eval * RATES.eval;
      var hLine = state.harness ? RATES.harness : 0;
      var total = bLine + eLine + hLine;
      valEls.build.textContent = state.build + (state.build === 1 ? ' day' : ' days');
      valEls.eval.textContent = state.eval + (state.eval === 1 ? ' day' : ' days');
      lineEls.build.textContent = fmtEUR(bLine);
      lineEls.eval.textContent = fmtEUR(eLine);
      totalEl.innerHTML = fmtEUR(total) + ' <small>excl. VAT</small>';
      estOut.textContent = [
        'build    ' + state.build + ' days × ' + fmtEUR(RATES.build) + ' = ' + fmtEUR(bLine),
        'eval     ' + state.eval + ' days × ' + fmtEUR(RATES.eval) + ' = ' + fmtEUR(eLine),
        'harness  ' + (state.harness ? 'included, fixed ' + fmtEUR(RATES.harness) : 'not included'),
        'total    ' + fmtEUR(total) + ' excl. VAT — planning figure, not a quote'
      ].join('\n');
    }
    document.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-step');
        var d = parseInt(b.getAttribute('data-dir'), 10);
        var next = state[k] + d;
        if (next >= LIMITS[k][0] && next <= LIMITS[k][1]) { state[k] = next; renderEst(); }
      });
    });
    if (harnessBox) harnessBox.addEventListener('change', function () { state.harness = harnessBox.checked; renderEst(); });
    renderEst();
  }

  /* ---- The console ------------------------------------------------------
     A fixed command index over this site's content. No model, no
     generation, no network. It looks things up and does arithmetic. */
  var cForm = document.getElementById('console-form');
  var cInput = document.getElementById('console-input');
  var cOut = document.getElementById('console-output');
  if (cForm && cInput && cOut) {
    var history = [];
    var histIdx = -1;

    function addLine(text, cls) {
      var p = document.createElement('p');
      p.className = 'ln' + (cls ? ' ' + cls : '');
      p.textContent = text;
      cOut.appendChild(p);
      return p;
    }
    function addCmdEcho(raw) {
      var p = document.createElement('p');
      p.className = 'ln cmd';
      var s = document.createElement('span');
      s.className = 'p';
      s.textContent = 'guest@rahman-llm:~$ ';
      p.appendChild(s);
      p.appendChild(document.createTextNode(raw));
      cOut.appendChild(p);
    }
    function addLines(lines) {
      lines.forEach(function (l) {
        if (typeof l === 'string') addLine(l);
        else addLine(l.t, l.c);
      });
    }
    function scrollConsole() { cOut.scrollTop = cOut.scrollHeight; }

    var CONTENT = {
      help: [
        'Available commands — this index is the whole machine:',
        '  help                       this list',
        '  whoami                     the engineer, briefly',
        '  services                   the services register (S.01–S.05)',
        '  cases                      the three case files, one line each',
        '  case 1 | case 2 | case 3   a case file in full',
        '  fees                       day rates and what moves the price',
        '  evals                      how the launch gates work',
        '  cost <class> <requests> <in> <out>',
        '                             token arithmetic from Table 1, e.g.',
        '                             cost frontier 10000 800 200',
        '                             classes: frontier · mid · small · self',
        '  contact                    the email address and the form',
        '  clear                      clear the console',
        'Everything printed here is also printed in the page sections.'
      ],
      whoami: [
        'Dr. Nadia Rahman — LLM systems engineer, Berlin (CET).',
        'PhD in NLP, 2016; six years in product companies; independent since 2021.',
        'I build LLM features that survive contact with production:',
        'frozen eval sets first, launch gates in writing, token bills',
        'you can recompute by hand. 23 features shipped, 4 launches',
        'stopped at the gate — three of them shipped later, better.',
        'Full story: about.html'
      ],
      services: [
        'S.01  Production LLM feature builds — Booking · Feb 2027',
        'S.02  Evaluation harnesses & launch gates — Booking · Jan 2027',
        'S.03  Cost & latency engineering — Booking · Jan 2027',
        'S.04  Retrieval & corpus remediation — Waitlist',
        'S.05  Demo rescue audit, fixed fee €4,800 — Booking · Dec 2026',
        'Full register with client types: index.html, section § 01.'
      ],
      cases: [
        'CASE 01  The copilot that failed its own launch gate',
        '         84.6% at the gate → held → 93.8% re-measured → shipped.',
        'CASE 02  The corpus that ate the budget',
        '         38,400 documents, 31% duplicates; 58% of spend was corpus work.',
        'CASE 03  The token bill that fell 78%',
        '         $18,254 → $4,096 a month, reconciled to the invoice.',
        'Type "case 1", "case 2" or "case 3" for a file; full text: projects.html'
      ],
      fees: [
        'Build days ................ €1,250 / day',
        'Eval & audit days ......... €1,100 / day',
        'Demo rescue audit ......... €4,800 fixed (5 days, written verdict)',
        'Gate re-measurement ....... €950 / run',
        'What moves the price: eval depth first, integration surface second.',
        'Model choice barely moves it. Estimator: index.html, section § 03.'
      ],
      evals: [
        'How a launch gate works here:',
        '1. A frozen eval set is built from YOUR real traffic and labelled',
        '   by your own domain experts. It is never edited after a run.',
        '2. Thresholds are agreed in writing before the first measurement.',
        '3. Failures are counted in six classes: retrieval miss, stale',
        '   source, ungrounded generation, truncation, format drift,',
        '   escalation failure. (Table 2, about.html.)',
        '4. The report says ship or stop. It has said stop four times.',
        'A vendor benchmark is not your workload. A demo is not a product.'
      ],
      contact: [
        'Email:    nadia@rahman-llm.example',
        'Form:     contact.html — validated in-page, reference issued',
        'Response: within 2 working days · Berlin, CET · EN / DE',
        'A useful first message: the feature, its users, its current',
        'state, and what a wrong answer costs. Four sentences is plenty.'
      ]
    };

    var CASES = {
      '1': [
        'CASE 01 — The copilot that failed its own launch gate',
        'Ask:     "final integration" for a support copilot, launch in 6 weeks.',
        '         No eval set existed. One does by the time I leave.',
        'Work:    eval v1.3 — 412 real resolved tickets, labelled by two of',
        '         the client\'s support leads, frozen. Gate set in writing:',
        '         groundedness ≥ 92%, correct escalation ≥ 95%.',
        'Result:  first run 84.6% / 91.2% — GATE HELD, launch moved 6 weeks.',
        '         Failures: 41% retrieval misses, 27% stale/duplicate docs.',
        '         Re-measured on the same frozen set: 93.8% / 96.4%.',
        '         Shipped 2 Apr 2026. Full file: projects.html'
      ],
      '2': [
        'CASE 02 — The corpus that ate the budget',
        'Ask:     adviser Q&A over 14 years of pension scheme documents.',
        '         A vendor had demoed "94% accuracy" on its own questions.',
        'Work:    300 real adviser questions; vendor system scored',
        '         precision@5 of 0.52. Corpus audit: 38,400 documents,',
        '         31% duplicates/superseded, 62% without usable metadata.',
        'Result:  deduplicated to 26,500; precision@5 0.87, groundedness 91%.',
        '         Internal launch Sep 2026; public use still held at the gate.',
        '         58% of the budget was corpus work. Printed on purpose.',
        '         Full file: projects.html'
      ],
      '3': [
        'CASE 03 — The token bill that fell 78%',
        'Ask:     two production features, all frontier class, February',
        '         invoice $18,254 and climbing. Cost per request: unknown.',
        'Work:    metered 1.71M requests (avg 2,350 in / 480 out — check it',
        '         against Table 1). Routing: classification (78% of traffic)',
        '         to the small class. Caching: 64% hit rate on draft input.',
        '         Output discipline: drafts capped 480 → 240 avg tokens.',
        'Result:  May invoice $4,096 (−78%), reconciled to the billing export.',
        '         Quality ledger printed: accuracy 96.1% → 95.8%, draft',
        '         acceptance 88% → 87%. The trade is stated, not hidden.',
        '         Full file: projects.html'
      ]
    };

    function runCommand(raw) {
      var input = (raw || '').trim();
      addCmdEcho(input);
      if (!input) { scrollConsole(); return; }
      history.unshift(input);
      histIdx = -1;
      var parts = input.toLowerCase().split(/\s+/);
      var cmd = parts[0];

      if (cmd === 'clear') {
        cOut.innerHTML = '';
        addLine('Console cleared. The disclosure stands: still no model back here.', 'dim');
      } else if (cmd === 'cost') {
        var cls = parts[1];
        var req = parseInt(parts[2], 10);
        var it = parseInt(parts[3], 10);
        var ot = parseInt(parts[4], 10);
        if (!PRICES[cls] || isNaN(req) || isNaN(it) || isNaN(ot) || req < 1 || it < 0 || ot < 0) {
          addLine('usage: cost <class> <requests> <avg-in-tokens> <avg-out-tokens>', 'err');
          addLine('classes: frontier · mid · small · self — example: cost mid 50000 600 300', 'dim');
        } else {
          addLines(costLines(cls, req, it, ot));
        }
      } else if (cmd === 'case' || cmd === 'cases') {
        if (cmd === 'case' && CASES[parts[1]]) addLines(CASES[parts[1]]);
        else if (cmd === 'case') { addLine('usage: case 1 · case 2 · case 3', 'err'); addLines(CONTENT.cases); }
        else addLines(CONTENT.cases);
      } else if (CONTENT[cmd]) {
        addLines(CONTENT[cmd]);
      } else {
        addLine('index: no entry for "' + cmd + '" — this console only looks things up.', 'err');
        addLine('Type "help" for the four pages\' worth of things it knows.', 'dim');
      }
      scrollConsole();
    }

    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      runCommand(cInput.value);
      cInput.value = '';
      cInput.focus();
    });
    cInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' && history.length) {
        e.preventDefault();
        histIdx = Math.min(histIdx + 1, history.length - 1);
        cInput.value = history[histIdx];
      } else if (e.key === 'ArrowDown' && history.length) {
        e.preventDefault();
        histIdx = Math.max(histIdx - 1, -1);
        cInput.value = histIdx >= 0 ? history[histIdx] : '';
      }
    });
    document.querySelectorAll('.chip[data-cmd]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        runCommand(chip.getAttribute('data-cmd'));
        cInput.focus();
      });
    });
    var consoleEl = document.getElementById('console');
    if (consoleEl) {
      consoleEl.addEventListener('click', function (e) {
        if (e.target === cOut || e.target.classList.contains('console-body')) cInput.focus();
      });
    }
  }

  /* ---- Contact form: validation + in-page confirmation ---------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var fields = [
      { id: 'f-name', err: 'e-name', ok: function (v) { return v.trim().length >= 2; } },
      { id: 'f-email', err: 'e-email', ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'f-org', err: 'e-org', ok: function (v) { return v.trim().length >= 2; } },
      { id: 'f-type', err: 'e-type', ok: function (v) { return v !== ''; } },
      { id: 'f-msg', err: 'e-msg', ok: function (v) { return v.trim().length >= 20; } }
    ];
    function validateField(f) {
      var el = document.getElementById(f.id);
      var err = document.getElementById(f.err);
      var valid = f.ok(el.value);
      el.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (err) err.classList.toggle('on', !valid);
      return valid;
    }
    fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      el.addEventListener('blur', function () { validateField(f); });
      el.addEventListener('input', function () {
        var err = document.getElementById(f.err);
        if (err && err.classList.contains('on')) validateField(f);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        if (!validateField(f) && !firstBad) firstBad = document.getElementById(f.id);
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'RL-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirm-ref').textContent = ref;
      var confirm = document.getElementById('confirm');
      confirm.classList.add('on');
      document.getElementById('f-submit').textContent = 'Enquiry logged (demo)';
      confirm.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
