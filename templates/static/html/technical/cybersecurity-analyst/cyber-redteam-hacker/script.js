/* Hartley — Offensive Security: interactions.
   Sound ruling: NONE. This profession's product is a document; a
   terminal beep would be costume, not information. No web-audio
   calls, no audio files — the stub's fake terminal and its invented
   vulnerability claims were deleted, not rebuilt. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces as an unhandled InvalidStateError
     rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile contents panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('tocPanel');
  if (menuBtn && panel) {
    var closePanel = function (refocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closePanel(false);
      }
    });
  }

  /* ---------- reveal on scroll (opacity only: stage the documents) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
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

  /* ---------- Scope Builder (index §1.1) ---------- */
  /* The sheets below are the starting drafts of real scope letters.
     Durations and fee bands agree with Table 2 on the same page;
     the probe asserts the agreement. */
  var SCOPES = {
    web: {
      name: 'Web application test',
      ref: 'REF SS-WEB',
      duration: '5–10 days',
      durationNote: ' of testing, plus reporting',
      inScope: [
        'The named application and its APIs, at the agreed addresses',
        'A staging mirror with synthetic data, if you provide one',
        'Test accounts at each privilege level, created for the test',
        'Business-logic flows — the sequences the application exists to perform'
      ],
      outScope: [
        'Denial-of-service testing of any kind',
        'Third-party services the application calls — payment processors, identity providers — without their own written consent',
        'Social engineering of your staff (available only as a separately authorised phase)',
        'Taking data out: findings are evidenced with the minimum proof, never by exfiltrating records'
      ],
      deliv: [
        'The report: every finding evidenced, rated with its reasoning, and paired with a fix',
        'An executive summary written for the board, not the firewall',
        'A walkthrough call with your engineers',
        'One retest round of the fixed criticals and highs, included in the fee'
      ],
      auth: 'A signed scope letter naming the application\u2019s addresses, the test window, test accounts, and a named contact on each side who knows testing is live.'
    },
    internal: {
      name: 'Internal network assessment',
      ref: 'REF SS-INT',
      duration: '10–15 days',
      durationNote: ' of testing, plus reporting',
      inScope: [
        'The named networks and address ranges in the scope letter',
        'The agreed starting point: a standard staff account, a network point, or both',
        'The domain environment and the workstations and servers inside the named ranges',
        'How far a foothold travels: privilege and lateral reach, established by evidence'
      ],
      outScope: [
        'Any system you list as production-fragile — those are assessed by review, not by probing',
        'Out-of-hours testing, unless separately agreed in the rules of engagement',
        'Physical access attempts (a separate engagement type)',
        'Clinical, safety or control systems named as untouchable — named means untouched'
      ],
      deliv: [
        'The report: findings, the evidenced attack path at class level, and remediation in priority order',
        'A map of what the foothold could reach, and what stopped it where it stopped',
        'A fix-first list: the three changes that remove the most risk per pound',
        'One retest round of the fixed criticals and highs, included in the fee'
      ],
      auth: 'A signed scope letter naming the address ranges, the excluded hosts, the stop conditions, and an escalation contact who is reachable for the whole test window.'
    },
    redteam: {
      name: 'Red team engagement',
      ref: 'REF SS-RT',
      duration: '4–8 weeks',
      durationNote: ' elapsed, part-time by design — real attackers are not in a hurry, and neither is the test',
      inScope: [
        'One agreed objective, stated in the rules of engagement — a system, a data store, a process',
        'Any in-scope route to that objective, technical or procedural',
        'Your suppliers\u2019 access paths into you — the paths are yours to test',
        'Detection and response: your defenders are part of what is being measured'
      ],
      outScope: [
        'Your suppliers\u2019 own systems — a third party cannot be tested on your signature',
        'Anything touching safety systems, or the personal devices of staff',
        'Destructive actions, data deletion, or changes that outlive the engagement',
        'Social or physical components, unless each is separately authorised in writing'
      ],
      deliv: [
        'The full narrative report: what was attempted, what worked, what was detected and what was not',
        'A timeline your defenders can replay against their own logs',
        'Process fixes, not just technical ones — most objectives are reached through a process',
        'A board-level summary and a closing detection review with your security team'
      ],
      auth: 'Rules of engagement signed by an executive sponsor; a named \u201Cwhite cell\u201D contact who knows the exercise is live; a stop letter carried by every tester, at all times.'
    },
    cloud: {
      name: 'Cloud configuration review',
      ref: 'REF SS-CLD',
      duration: '4–8 days',
      durationNote: ', read-only throughout — a review changes nothing',
      inScope: [
        'The named cloud accounts or subscriptions, and only those',
        'Identity and access configuration: who can do what, and whether they should',
        'Network exposure and storage exposure, checked against the provider\u2019s own benchmarks',
        'Logging and alerting coverage — whether you would see an incident if one happened'
      ],
      outScope: [
        'Changes of any kind: the review is read-only and makes none',
        'Testing of workloads beyond their configuration',
        'Accounts not named in the scope letter, however interesting they look',
        'Other tenants, other customers, the provider\u2019s own systems — never in anyone\u2019s scope'
      ],
      deliv: [
        'The report: findings mapped to the provider\u2019s published benchmarks, in priority order',
        'A fix list your platform team can work through without a translator',
        'A re-check of the critical findings once fixed, included in the fee',
        'A short note of what was reviewed and found sound — assurance needs evidence too'
      ],
      auth: 'A read-only role provisioned by you, in the named accounts only; the signed account list; and a named owner for each account who can answer questions during the review.'
    }
  };

  var scopeSheet = document.getElementById('scopeSheet');
  var scopeBtns = document.querySelectorAll('[data-scope]');
  function listInto(id, items, outClass) {
    var ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    items.forEach(function (t) {
      var li = document.createElement('li');
      if (outClass) li.className = outClass;
      li.textContent = t;
      ul.appendChild(li);
    });
  }
  function renderScope(key) {
    var s = SCOPES[key];
    if (!s || !scopeSheet) return;
    document.getElementById('ssName').textContent = s.name;
    document.getElementById('ssRef').textContent = s.ref;
    document.getElementById('ssDuration').innerHTML = '<span class="big">' + s.duration + '</span>' + s.durationNote;
    listInto('ssIn', s.inScope, '');
    listInto('ssOut', s.outScope, 'out');
    listInto('ssDeliv', s.deliv, '');
    document.getElementById('ssAuth').textContent = s.auth;
    scopeBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-scope') === key ? 'true' : 'false');
    });
    document.querySelectorAll('#feeTable tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-feerow') === key);
    });
  }
  scopeBtns.forEach(function (b) {
    b.addEventListener('click', function () { renderScope(b.getAttribute('data-scope')); });
  });
  if (scopeSheet) renderScope('web');

  /* ---------- Severity Explainer (index §1.2) ---------- */
  /* Ratings follow the printed scale in Table 1 on the same page:
     impact if exploited, weighed against realistic likelihood. */
  var FINDINGS = {
    admin: {
      name: 'Admin panel reachable, default credentials unchanged',
      chip: 'Critical', chipClass: 'crit', row: 'crit',
      impact: 'Full administrative control of the application — its configuration, its users, and in most cases its data. There is no partial version of this outcome.',
      likelihood: 'As high as likelihood gets. The default credentials are printed in the product\u2019s own manual, and automated scanners check for exactly this, every day, across the whole internet.',
      change: 'Very little would lower it. Taking the panel off the public internet would cut the likelihood and bring it to high; the moment the defaults are changed and a second factor is on, the finding closes.'
    },
    unpatched: {
      name: 'Unpatched internet-facing service, known published exploit',
      chip: 'High', chipClass: 'high', row: 'high',
      impact: 'Whatever the service can reach. A published exploit means the technique is no longer scarce — using it is a download, not a discovery.',
      likelihood: 'High and rising with time. Once an exploit is public, scanning for the vulnerable version becomes routine background noise on the internet; the question stops being \u201Cif\u201D and becomes \u201Cwhen someone bothers\u201D.',
      change: 'It rises to critical if the service holds sensitive data or offers a path further inside — context, not the software, decides. It falls the day the patch is applied and verified, which is why this is rated to be fixed in days.'
    },
    session: {
      name: 'Session tokens that never expire',
      chip: 'Medium', chipClass: 'med', row: 'med',
      impact: 'A stolen session token — from a lost laptop, a shared screenshot, a careless log — remains a working key indefinitely. The account stays open long after the owner believes it closed.',
      likelihood: 'Conditional. Nothing here can be exploited on its own; an attacker first needs the token, which requires a separate failure or theft. That dependency is exactly what keeps it out of the high band.',
      change: 'It rises if tokens are also predictable or leak somewhere readable — then the condition disappears. It falls to low with a sane expiry and revocation on password change, an afternoon of work in most frameworks.'
    },
    headers: {
      name: 'Missing security headers',
      chip: 'Low', chipClass: 'low', row: 'low',
      impact: 'On its own, none. Security headers instruct the browser to behave more carefully; their absence removes a layer of protection but hands an attacker no capability they did not already have.',
      likelihood: 'Not applicable in the usual sense — there is nothing here to exploit directly. The risk only materialises if a separate weakness appears that a header would have blunted.',
      change: 'It stays low until it is standing next to a real weakness — a page that also reflects user input, for instance, where a missing header widens the blast radius. Rating it critical, as some reports do, is how ratings stop meaning anything.'
    }
  };

  var sevSheet = document.getElementById('sevSheet');
  var sevBtns = document.querySelectorAll('[data-sev]');
  function renderSev(key) {
    var f = FINDINGS[key];
    if (!f || !sevSheet) return;
    document.getElementById('svName').textContent = f.name;
    var chip = document.getElementById('svChip');
    chip.textContent = f.chip;
    chip.className = 'chip ' + f.chipClass;
    document.getElementById('svImpact').textContent = f.impact;
    document.getElementById('svLikelihood').textContent = f.likelihood;
    document.getElementById('svChange').textContent = f.change;
    sevBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-sev') === key ? 'true' : 'false');
    });
    document.querySelectorAll('#sevTable tbody tr').forEach(function (tr) {
      tr.classList.toggle('hl', tr.getAttribute('data-sevrow') === f.row);
    });
  }
  sevBtns.forEach(function (b) {
    b.addEventListener('click', function () { renderSev(b.getAttribute('data-sev')); });
  });
  if (sevSheet) renderSev('admin');

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('fType');
    if (typeSel && params.get('type')) {
      var want = params.get('type');
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === want) { typeSel.selectedIndex = i; break; }
      }
    }
    function fieldBad(id, bad) {
      var input = document.getElementById(id);
      if (!input) return !bad;
      var wrap = input.closest('.field');
      if (wrap) wrap.classList.toggle('bad', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var msg = document.getElementById('fMsg').value.trim();
      var ok = true;
      ok = fieldBad('fName', name.length < 2) && ok;
      ok = fieldBad('fEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = fieldBad('fMsg', msg.length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (firstBad) firstBad.focus();
        return;
      }
      /* deterministic reference from the enquiry itself */
      var seed = (name + '|' + email + '|' + msg).split('').reduce(function (a, c) {
        return ((a * 31) + c.charCodeAt(0)) % 900;
      }, 7);
      var ref = 'OH-2026-' + (100 + seed);
      if (confirmRef) confirmRef.textContent = ref;
      form.style.display = 'none';
      if (confirmBox) {
        confirmBox.classList.add('show');
        confirmBox.setAttribute('tabindex', '-1');
        confirmBox.focus();
      }
    });
    ['fName', 'fEmail', 'fMsg'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () { fieldBad(id, false); });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      if (confirmBox) confirmBox.classList.remove('show');
      document.getElementById('fName').focus();
    });
  }
})();
