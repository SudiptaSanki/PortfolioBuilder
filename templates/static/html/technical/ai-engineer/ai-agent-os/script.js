/* ai-agent-os — shared script.
   Sound ruling: FAILS the need-test. There is no audio anywhere in
   this template: an agent console that beeps teaches nothing, and
   hover/run-triggered sound is a deal-breaker pattern regardless.
   The stub's fake "agent runner" (a button that typed canned log
   lines ending in "Accuracy 99.9%") was deleted, not rebuilt: the
   Trace Explorer below is a real, priced, annotated run whose every
   number is computed from the token counts printed on the page. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Cross-document view transitions abort noisily in Chromium when a
     navigation interrupts one; the navigation itself always completes.
     Swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile panel ---------- */
  var panel = document.getElementById('mobilePanel');
  var menuBtn = document.getElementById('menuBtn');
  var panelClose = document.getElementById('panelClose');
  if (panel && menuBtn) {
    var lastFocus = null;
    function openPanel() {
      lastFocus = document.activeElement;
      panel.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var first = panel.querySelector('nav a');
          if (first) first.focus();
        });
      });
    }
    function closePanel() {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    menuBtn.addEventListener('click', openPanel);
    if (panelClose) panelClose.addEventListener('click', closePanel);
    var scrim = panel.querySelector('.scrim');
    if (scrim) scrim.addEventListener('click', closePanel);
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', closePanel);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  /* ---------- reveals (opacity only, JS-gated) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- trace explorer ---------- */
  var PIN = 3.00, POUT = 15.00; /* USD per 1M tokens — the rate card printed on the page */
  var TRACE = [
    { type: 'PLAN', title: 'Plan the run',
      args: '<span class="k">task</span> = "Ticket #4821: customer charged twice for order #88112. Verify the charge, check the refund rule, draft a reply. Send nothing."',
      obs: 'Plan accepted. Three tool calls expected. Per-run budget cap of $0.50 noted from configuration.',
      tin: 1200, tout: 200, loop: false,
      note: 'The plan is the cheapest place to catch a bad run — it costs one short call. This plan is good: it names the evidence it needs and forbids the irreversible act (sending) up front.' },
    { type: 'TOOL CALL', title: 'billing.search_charges',
      args: '<span class="k">customer_id</span> = "C-2291"',
      obs: 'Two charges of £49.00, same card, 41 seconds apart, one order number. The duplicate is real.',
      tin: 1600, tout: 100, loop: false,
      note: 'Evidence, not vibes. The agent now holds the fact the whole run turns on — and the context grows by everything the tool returned, which is why later steps cost more.' },
    { type: 'TOOL CALL', title: 'billing.search_charges — again',
      args: '<span class="k">customer_id</span> = "C-2291" &nbsp;<span class="k">window</span> = "30d"',
      obs: 'The same two charges returned. No new information.',
      tin: 2000, tout: 100, loop: false,
      note: 'A second call with a wider window. Still defensible — a careful human might check once more. Watch what happens next.' },
    { type: 'TOOL CALL — LOOP', title: 'billing.search_charges — third time',
      args: '<span class="k">customer_id</span> = "C-2291" &nbsp;<span class="k">window</span> = "90d"',
      obs: 'The same two charges returned. No new information.',
      tin: 2400, tout: 100, loop: true,
      note: 'This is a loop starting: the same tool, materially the same arguments, returning facts the agent already holds — at full context price. The guard that catches it is repeated-call detection: same tool + near-identical arguments + no new information in the result means halt, summarise what is known, and re-plan or escalate. In Case File 01 this exact pattern ran for a weekend because nobody had installed that guard.' },
    { type: 'PLAN', title: 'Re-plan from what is known',
      args: '<span class="k">decision</span> = "No further billing data exists. Stop searching; check the refund rule for duplicate charges."',
      obs: 'Plan updated. The run proceeds to the policy check.',
      tin: 2800, tout: 120, loop: false,
      note: 'The run recovers — this time, by the model noticing. Recovery by luck is not a control; the guard in step 4 is what makes recovery a property of the system instead of the mood of the model.' },
    { type: 'TOOL CALL', title: 'policy.lookup',
      args: '<span class="k">topic</span> = "duplicate charge"',
      obs: 'Duplicate charges are refunded in full on request. No time limit applies to card-processing errors.',
      tin: 3100, tout: 260, loop: false,
      note: 'Policy before drafting. The reply can now cite the rule it is applying, and a human approver can check the citation in seconds.' },
    { type: 'TOOL CALL', title: 'crm.create_draft',
      args: '<span class="k">ticket</span> = "4821" &nbsp;<span class="k">action</span> = "refund £49.00 + apology" &nbsp;<span class="k">send</span> = false',
      obs: 'Draft D-5531 created. Status: awaiting human approval. Nothing was sent and no money moved.',
      tin: 3300, tout: 80, loop: false,
      note: 'The write is a draft, not a send. Refunds are irreversible; a human approval gate on irreversible actions is the cheapest insurance in the entire system.' },
    { type: 'OUTPUT', title: 'Run summary, queued for approval',
      args: '<span class="k">result</span> = "Duplicate confirmed (£49.00 × 2, one order). Refund recommended under the duplicate-charge rule. Draft D-5531 awaiting approval."',
      obs: 'Run closed inside its step and budget caps. Total: 19,850 tokens in, 1,110 out, $0.0762.',
      tin: 3450, tout: 150, loop: false,
      note: 'A good run — one loop, caught by a re-plan. The cost panel below prices what this same run does at production volume, and what it does when the loop is not caught.' }
  ];
  function stepCost(s) { return (s.tin * PIN + s.tout * POUT) / 1000000; }
  function cumCost(i) { var t = 0; for (var j = 0; j <= i; j++) t += stepCost(TRACE[j]); return t; }
  function m4(v) { return '$' + v.toFixed(4); }
  function num(v) { return v.toLocaleString('en-GB'); }

  var sheet = document.getElementById('traceSheet');
  if (sheet) {
    var el = {
      kicker: document.getElementById('stKicker'),
      title: document.getElementById('stTitle'),
      args: document.getElementById('stArgs'),
      obs: document.getElementById('stObs'),
      note: document.getElementById('stNote'),
      noteK: document.getElementById('stNoteK'),
      noteP: document.getElementById('stNoteP'),
      tin: document.getElementById('tokIn'),
      tout: document.getElementById('tokOut'),
      step: document.getElementById('tokStep'),
      cum: document.getElementById('tokCum'),
      prev: document.getElementById('prevStep'),
      next: document.getElementById('nextStep')
    };
    var btns = Array.prototype.slice.call(document.querySelectorAll('.step-btn'));
    var cur = 0;
    function render(i) {
      cur = i;
      var s = TRACE[i];
      el.kicker.innerHTML = 'Step ' + (i + 1) + ' of 8 — ' + s.type +
        (s.loop ? ' &nbsp;<span class="bad">■ failure step</span>' : '');
      el.title.textContent = s.title;
      el.args.innerHTML = s.args;
      el.obs.innerHTML = '<span class="obs-k">Observation</span>' + s.obs;
      el.note.classList.toggle('bad', !!s.loop);
      el.noteK.textContent = s.loop ? 'Reading the trace — the failure' : 'Reading the trace';
      el.noteP.textContent = s.note;
      el.tin.textContent = num(s.tin);
      el.tout.textContent = num(s.tout);
      el.step.textContent = m4(stepCost(s));
      el.step.classList.toggle('hot', !!s.loop);
      el.cum.textContent = m4(cumCost(i));
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      el.prev.disabled = i === 0;
      el.next.disabled = i === TRACE.length - 1;
    }
    btns.forEach(function (b, j) { b.addEventListener('click', function () { render(j); }); });
    el.prev.addEventListener('click', function () { if (cur > 0) render(cur - 1); });
    el.next.addEventListener('click', function () { if (cur < TRACE.length - 1) render(cur + 1); });
    render(0);
    window.__TRACE = TRACE; window.__stepCost = stepCost; window.__cumCost = cumCost;
  }

  /* ---------- cost panel ---------- */
  var costRoot = document.getElementById('costPanel');
  if (costRoot) {
    var TOK_IN = 19850, TOK_OUT = 1110;
    var RATES = {
      frontier: { pin: 3.00, pout: 15.00 },
      small: { pin: 0.30, pout: 1.50 }
    };
    var rate = 'frontier', runs = 2000;
    var outRun = document.getElementById('costRun'),
        outDay = document.getElementById('costDay'),
        outMonth = document.getElementById('costMonth'),
        runsVal = document.getElementById('runsVal'),
        formula = document.getElementById('costFormula');
    function m2(v) {
      return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function renderCost() {
      var r = RATES[rate];
      var run = (TOK_IN * r.pin + TOK_OUT * r.pout) / 1000000;
      outRun.textContent = m4(run);
      outDay.textContent = m2(run * runs);
      outMonth.textContent = m2(run * runs * 30);
      runsVal.textContent = num(runs);
      formula.textContent =
        'per run = 19,850 × $' + r.pin.toFixed(2) + ' / 1M + 1,110 × $' + r.pout.toFixed(2) +
        ' / 1M = $' + ((TOK_IN * r.pin) / 1000000).toFixed(5) + ' + $' + ((TOK_OUT * r.pout) / 1000000).toFixed(5) +
        ' = ' + m4(run) + ' · per day = per run × ' + num(runs) + ' runs · per month = per day × 30';
    }
    costRoot.querySelectorAll('.rate-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        rate = b.getAttribute('data-rate');
        costRoot.querySelectorAll('.rate-btn').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        renderCost();
      });
    });
    document.getElementById('runsDown').addEventListener('click', function () {
      runs = Math.max(250, runs - 250); renderCost();
    });
    document.getElementById('runsUp').addEventListener('click', function () {
      runs = Math.min(10000, runs + 250); renderCost();
    });
    renderCost();
    window.__cost = function () {
      var r = RATES[rate];
      var run = (TOK_IN * r.pin + TOK_OUT * r.pout) / 1000000;
      return { rate: rate, runs: runs, run: run, day: run * runs, month: run * runs * 30 };
    };
  }

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('fType');
    var wanted = params.get('type');
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    function field(id) { return document.getElementById(id); }
    function validate() {
      var ok = true;
      var name = field('fName'), email = field('fEmail'), msg = field('fMsg');
      [[name, function (v) { return v.trim().length > 1; }],
       [email, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }],
       [msg, function (v) { return v.trim().length > 9; }]].forEach(function (pair) {
        var wrap = pair[0].closest('.fld');
        var good = pair[1](pair[0].value);
        wrap.classList.toggle('invalid', !good);
        pair[0].setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good) ok = false;
      });
      return ok;
    }
    ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
      field(id).addEventListener('input', function () {
        this.closest('.fld').classList.remove('invalid');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('.fld.invalid input, .fld.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (field('fName').value + '|' + field('fEmail').value + '|' + field('fMsg').value);
      var h = 0;
      for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 900;
      var ref = 'NR-2026-' + (100 + h);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmBox').classList.add('show');
      document.getElementById('confirmBox').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      document.getElementById('confirmBox').classList.remove('show');
      field('fName').focus();
    });
  }
})();
